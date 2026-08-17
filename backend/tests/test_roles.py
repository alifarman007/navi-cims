"""Role Permission tests: modules list, role CRUD with matrix, PUT permissions round-trip, system-role guards."""

import pytest
from httpx import AsyncClient

API = "/api/v1"


def _codes(role: dict) -> set[str]:
    return {p["module"]["code"] for p in role["permissions"]}


@pytest.mark.asyncio
async def test_modules_and_role_matrix_round_trip(client: AsyncClient, admin_headers):
    h = admin_headers
    r = await client.get(f"{API}/modules", headers=h)
    assert r.status_code == 200
    mods = r.json()
    assert len(mods) == 10 and mods[0]["code"] == "dashboard" and mods[-1]["code"] == "user_management"
    assert [m["sort_order"] for m in mods] == sorted(m["sort_order"] for m in mods)

    # create with a matrix
    r = await client.post(
        f"{API}/roles",
        json={
            "name": "Employee Role",
            "permissions": [
                {"module_code": "item_management", "menu": True, "list": True, "view": True, "add": True},
                {"module_code": "report", "menu": True, "list": True},
                {"module_code": "dashboard"},  # all-false rows are dropped
            ],
        },
        headers=h,
    )
    assert r.status_code == 201, r.text
    role = r.json()
    rid = role["id"]
    assert role["is_system"] is False and role["status"] == "active"
    perms = {p["module"]["code"]: p for p in role["permissions"]}
    assert set(perms) == {"item_management", "report"}
    assert perms["item_management"]["can_add"] is True and perms["item_management"]["can_edit"] is False
    assert perms["item_management"]["module"]["name"] == "Item Management"

    # duplicate name -> 409 ; unknown module -> 422
    assert (await client.post(f"{API}/roles", json={"name": "Employee Role"}, headers=h)).status_code == 409
    r = await client.post(
        f"{API}/roles",
        json={"name": "Bad", "permissions": [{"module_code": "nope", "menu": True}]},
        headers=h,
    )
    assert r.status_code == 422

    # PUT /roles/{id}/permissions replaces the matrix
    r = await client.put(
        f"{API}/roles/{rid}/permissions",
        json={
            "permissions": [
                {
                    "module_code": "allocation_sanction",
                    "menu": True,
                    "list": True,
                    "view": True,
                    "add": True,
                    "edit": True,
                    "delete": True,
                },
            ]
        },
        headers=h,
    )
    assert r.status_code == 200, r.text
    perms = {p["module"]["code"]: p for p in r.json()["permissions"]}
    assert set(perms) == {"allocation_sanction"} and perms["allocation_sanction"]["can_delete"] is True
    assert _codes((await client.get(f"{API}/roles/{rid}", headers=h)).json()) == {"allocation_sanction"}

    # PUT /roles/{id} with permissions also replaces; without permissions keeps them
    r = await client.put(
        f"{API}/roles/{rid}",
        json={"name": "Employee Role 2", "permissions": [{"module_code": "report", "list": True}]},
        headers=h,
    )
    assert r.status_code == 200 and r.json()["name"] == "Employee Role 2"
    assert _codes(r.json()) == {"report"}
    r = await client.put(f"{API}/roles/{rid}", json={"description": "desc"}, headers=h)
    assert _codes(r.json()) == {"report"}

    # the matrix is effective: a user with this role gets exactly those permissions on login
    r = await client.post(
        f"{API}/users",
        json={
            "user_type": "admin",
            "username": "emp",
            "full_name": "Emp",
            "email": "emp@navy.mil.bd",
            "phone": "01711000040",
            "password": "Secret@123",
            "role_id": rid,
        },
        headers=h,
    )
    assert r.status_code == 201, r.text
    uid = r.json()["id"]
    body = (
        await client.post(f"{API}/auth/login", json={"identifier": "emp", "password": "Secret@123"})
    ).json()
    assert body["user"]["permissions"] == {
        "report": {"menu": False, "list": True, "view": False, "add": False, "edit": False, "delete": False}
    }

    # list/filter/sort/options + status
    r = await client.get(f"{API}/roles", params={"filter": "name:employee", "sort": "name:asc"}, headers=h)
    assert r.json()["total"] == 1
    r = await client.get(f"{API}/roles/options", headers=h)
    assert any(o["label"] == "Employee Role 2" for o in r.json())
    r = await client.patch(f"{API}/roles/{rid}/status", json={"status": "inactive"}, headers=h)
    assert r.status_code == 200 and r.json()["status"] == "inactive"

    # delete blocked while a user references it (409), then ok
    assert (await client.delete(f"{API}/roles/{rid}", headers=h)).status_code == 409
    roles = (await client.get(f"{API}/roles", params={"page_size": 50}, headers=h)).json()["items"]
    admin_role = next(x["id"] for x in roles if x["name"] == "Admin")
    assert (
        await client.put(f"{API}/users/{uid}", json={"role_id": admin_role}, headers=h)
    ).status_code == 200
    assert (await client.delete(f"{API}/roles/{rid}", headers=h)).status_code == 200
    assert (await client.get(f"{API}/roles/{rid}", headers=h)).status_code == 404


@pytest.mark.asyncio
async def test_system_role_guards(client: AsyncClient, admin_headers):
    h = admin_headers
    roles = (await client.get(f"{API}/roles", params={"page_size": 50}, headers=h)).json()["items"]
    sa = next(x for x in roles if x["name"] == "Super Admin")
    ship = next(x for x in roles if x["name"] == "Ship/Base User")
    assert sa["is_system"] is True and len(sa["permissions"]) == 10
    # system role: name not editable, cannot delete; permissions/description editable
    assert (await client.put(f"{API}/roles/{sa['id']}", json={"name": "Root"}, headers=h)).status_code == 409
    assert (await client.delete(f"{API}/roles/{ship['id']}", headers=h)).status_code == 409
    r = await client.put(
        f"{API}/roles/{ship['id']}", json={"name": "Ship/Base User", "description": "d"}, headers=h
    )
    assert r.status_code == 200
    r = await client.put(
        f"{API}/roles/{ship['id']}/permissions",
        json={"permissions": [{"module_code": "dashboard", "menu": True, "list": True, "view": True}]},
        headers=h,
    )
    assert r.status_code == 200 and len(r.json()["permissions"]) == 1
    assert (await client.get(f"{API}/roles/999999", headers=h)).status_code == 404
