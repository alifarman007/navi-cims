"""User Management tests: create each user type, login as new user, permission denial, soft delete, guards."""

import pytest
from httpx import AsyncClient

API = "/api/v1"


async def _role_id(client: AsyncClient, h, name: str) -> int:
    r = await client.get(f"{API}/roles", params={"page_size": 50}, headers=h)
    assert r.status_code == 200, r.text
    return next(x["id"] for x in r.json()["items"] if x["name"] == name)


async def _login(client: AsyncClient, identifier: str, password: str):
    return await client.post(f"{API}/auth/login", json={"identifier": identifier, "password": password})


def _user(**over):
    base = {
        "user_type": "admin",
        "username": "kamal",
        "full_name": "Kamal Hossain",
        "email": "Kamal@navy.mil.bd",
        "phone": "01711000001",
        "password": "Secret@123",
    }
    base.update(over)
    return base


@pytest.mark.asyncio
async def test_user_crud_types_login_and_soft_delete(client: AsyncClient, admin_headers):
    h = admin_headers
    admin_role = await _role_id(client, h, "Admin")
    office_role = await _role_id(client, h, "Office User")
    ship_role = await _role_id(client, h, "Ship/Base User")

    # masters needed for bindings
    r = await client.post(f"{API}/config/offices", json={"code": "OFF-1", "name": "DTS"}, headers=h)
    office_id = r.json()["id"] if r.status_code == 201 else None
    r = await client.post(
        f"{API}/ship-bases", json={"code": "SB-1", "name": "BNS Bangabandhu", "type": "ship"}, headers=h
    )
    assert r.status_code == 201, r.text
    ship_id = r.json()["id"]

    # admin user
    r = await client.post(f"{API}/users", json=_user(role_id=admin_role), headers=h)
    assert r.status_code == 201, r.text
    admin_user = r.json()
    assert "hashed_password" not in admin_user and "password" not in admin_user
    assert admin_user["role"]["name"] == "Admin" and admin_user["status"] == "active"
    assert admin_user["email"] == "kamal@navy.mil.bd"

    # ship/base user requires ship_base_id
    ship_payload = _user(
        user_type="ship_base_user",
        username="shipuser",
        full_name="Ship User",
        email="ship@navy.mil.bd",
        phone="01711000002",
        role_id=ship_role,
    )
    assert (await client.post(f"{API}/users", json=ship_payload, headers=h)).status_code == 422
    r = await client.post(f"{API}/users", json={**ship_payload, "ship_base_id": ship_id}, headers=h)
    assert r.status_code == 201, r.text
    ship_user = r.json()
    assert ship_user["ship_base"]["name"] == "BNS Bangabandhu"

    # office user requires office_id
    off_payload = _user(
        user_type="office_user",
        username="officeuser",
        full_name="Office User",
        email="off@navy.mil.bd",
        phone="01711000003",
        role_id=office_role,
    )
    assert (await client.post(f"{API}/users", json=off_payload, headers=h)).status_code == 422
    if office_id:
        r = await client.post(f"{API}/users", json={**off_payload, "office_id": office_id}, headers=h)
        assert r.status_code == 201, r.text
        assert r.json()["office"]["name"] == "DTS"

    # uniqueness -> 409 (username, email) ; short password -> 422
    r = await client.post(
        f"{API}/users",
        json=_user(email="dup@navy.mil.bd", phone="01711000009", role_id=admin_role),
        headers=h,
    )
    assert r.status_code == 409
    r = await client.post(
        f"{API}/users", json=_user(username="kamal2", phone="01711000010", role_id=admin_role), headers=h
    )
    assert r.status_code == 409
    r = await client.post(
        f"{API}/users",
        json=_user(
            username="kamal3",
            email="k3@navy.mil.bd",
            phone="01711000011",
            password="short",
            role_id=admin_role,
        ),
        headers=h,
    )
    assert r.status_code == 422

    # login as new user works (username, email and phone)
    assert (await _login(client, "kamal", "Secret@123")).status_code == 200
    assert (await _login(client, "kamal@navy.mil.bd", "Secret@123")).status_code == 200
    assert (await _login(client, "01711000002", "Secret@123")).status_code == 200

    # list: filter by joined role name + sort + options label
    r = await client.get(f"{API}/users", params={"filter": "role:ship", "sort": "username:asc"}, headers=h)
    assert r.status_code == 200 and r.json()["total"] == 1
    r = await client.get(f"{API}/users", params={"filter": "user_type:admin"}, headers=h)
    assert r.json()["total"] == 1
    r = await client.get(f"{API}/users/options", params={"q": "kamal"}, headers=h)
    assert r.json() == [{"id": admin_user["id"], "label": "kamal - Kamal Hossain"}]

    # update: password optional (blank keeps), password given -> rehash
    uid = admin_user["id"]
    r = await client.put(f"{API}/users/{uid}", json={"full_name": "Kamal H."}, headers=h)
    assert r.status_code == 200 and r.json()["full_name"] == "Kamal H."
    assert (await _login(client, "kamal", "Secret@123")).status_code == 200
    r = await client.put(f"{API}/users/{uid}", json={"password": "Another@123"}, headers=h)
    assert r.status_code == 200
    assert (await _login(client, "kamal", "Secret@123")).status_code == 401
    assert (await _login(client, "kamal", "Another@123")).status_code == 200

    # admin reset-password
    r = await client.post(f"{API}/users/{uid}/reset-password", json={"new_password": "Reset@1234"}, headers=h)
    assert r.status_code == 200
    assert (await _login(client, "kamal", "Reset@1234")).status_code == 200

    # soft delete: row stays, status inactive, login blocked; options hides it
    sid = ship_user["id"]
    assert (await client.delete(f"{API}/users/{sid}", headers=h)).status_code == 200
    r = await client.get(f"{API}/users/{sid}", headers=h)
    assert r.status_code == 200 and r.json()["status"] == "inactive"
    assert (await _login(client, "shipuser", "Secret@123")).status_code in (401, 403)
    r = await client.get(f"{API}/users/options", params={"q": "shipuser"}, headers=h)
    assert r.json() == []
    # re-activate through PATCH status
    r = await client.patch(f"{API}/users/{sid}/status", json={"status": "active"}, headers=h)
    assert r.status_code == 200 and r.json()["status"] == "active"

    # audit log written for the soft delete (endpoint owned by another module; check only if present)
    r = await client.get(f"{API}/audit-logs", params={"filter": "entity:users"}, headers=h)
    if r.status_code == 200:
        assert any(x["action"] == "delete" for x in r.json()["items"])


@pytest.mark.asyncio
async def test_super_admin_and_self_guards(client: AsyncClient, admin_headers):
    h = admin_headers
    me = (await client.get(f"{API}/auth/me", headers=h)).json()
    # cannot disable/delete the super admin (also self here)
    assert (await client.delete(f"{API}/users/{me['id']}", headers=h)).status_code in (403, 409)
    r = await client.patch(f"{API}/users/{me['id']}/status", json={"status": "inactive"}, headers=h)
    assert r.status_code in (403, 409)

    # an admin cannot create a super admin nor touch the super admin, but can be disabled by the super admin
    admin_role = await _role_id(client, h, "Admin")
    r = await client.post(
        f"{API}/users",
        json=_user(
            username="adm2",
            full_name="Admin Two",
            email="adm2@navy.mil.bd",
            phone="01711000020",
            role_id=admin_role,
        ),
        headers=h,
    )
    assert r.status_code == 201, r.text
    adm2 = r.json()
    tok = (await _login(client, "adm2", "Secret@123")).json()["access_token"]
    h2 = {"Authorization": f"Bearer {tok}"}
    r = await client.post(
        f"{API}/users",
        json=_user(
            user_type="super_admin",
            username="sa2",
            email="sa2@navy.mil.bd",
            phone="01711000021",
            role_id=admin_role,
        ),
        headers=h2,
    )
    assert r.status_code == 403
    assert (await client.delete(f"{API}/users/{me['id']}", headers=h2)).status_code == 403
    assert (
        await client.put(f"{API}/users/{me['id']}", json={"full_name": "x"}, headers=h2)
    ).status_code == 403
    # self-disable blocked
    assert (await client.delete(f"{API}/users/{adm2['id']}", headers=h2)).status_code == 409
    # super admin CAN disable the admin
    assert (await client.delete(f"{API}/users/{adm2['id']}", headers=h)).status_code == 200


@pytest.mark.asyncio
async def test_permission_denied_for_limited_role(client: AsyncClient, admin_headers):
    """A Ship/Base User (seeded role) has no User Management permission and no Item Management delete."""
    h = admin_headers
    ship_role = await _role_id(client, h, "Ship/Base User")
    r = await client.post(
        f"{API}/ship-bases", json={"code": "SB-9", "name": "BNS Test", "type": "base"}, headers=h
    )
    assert r.status_code == 201, r.text
    r = await client.post(
        f"{API}/users",
        json=_user(
            user_type="ship_base_user",
            username="limited",
            full_name="Limited User",
            email="limited@navy.mil.bd",
            phone="01711000030",
            role_id=ship_role,
            ship_base_id=r.json()["id"],
        ),
        headers=h,
    )
    assert r.status_code == 201, r.text
    body = (await _login(client, "limited", "Secret@123")).json()
    assert body["user"]["permissions"].get("user_management") is None
    h2 = {"Authorization": f"Bearer {body['access_token']}"}
    assert (await client.get(f"{API}/users", headers=h2)).status_code == 403
    assert (await client.get(f"{API}/roles", headers=h2)).status_code == 403
    assert (
        await client.get(f"{API}/modules", headers=h2)
    ).status_code == 200  # read-only, any authenticated user
    assert (
        await client.post(f"{API}/brands", json={"code": "B1", "name": "B"}, headers=h2)
    ).status_code == 201
    bid = (await client.get(f"{API}/brands", headers=h2)).json()["items"][0]["id"]
    assert (await client.delete(f"{API}/brands/{bid}", headers=h2)).status_code == 403
    # item options are still readable by allocation users
    assert (await client.get(f"{API}/items/options", headers=h2)).status_code == 200
