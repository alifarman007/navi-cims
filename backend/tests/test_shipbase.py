"""Ship/Base Management tests: category + ship/base CRUD, filters/sorts, uniqueness, FK-in-use, permissions."""

from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import hash_password
from app.models.allocation import Allocation
from app.models.config import FiscalYear
from app.models.inventory import Store
from app.models.item import Item, ItemCategory
from app.models.misc import AuditLog
from app.models.role import Module as ModuleModel
from app.models.role import Role, RolePermission
from app.models.user import User

API = "/api/v1"


@pytest.mark.asyncio
async def test_unauthenticated(client: AsyncClient):
    assert (await client.get(f"{API}/ship-bases")).status_code == 401
    assert (await client.get(f"{API}/ship-base-categories")).status_code == 401


@pytest.mark.asyncio
async def test_category_crud(client: AsyncClient, admin_headers):
    h = admin_headers
    r = await client.get(f"{API}/ship-base-categories", headers=h)
    seeded = r.json()["total"]
    assert seeded >= 1  # seed provides Frigate/Corvette/...

    r = await client.post(
        f"{API}/ship-base-categories", json={"code": "CAT-001", "name": "Destroyer"}, headers=h
    )
    assert r.status_code == 201, r.text
    cid = r.json()["id"]
    assert r.json()["code"] == "CAT-001" and "status" not in r.json()

    dup = await client.post(f"{API}/ship-base-categories", json={"code": "CAT-001", "name": "x"}, headers=h)
    assert dup.status_code == 409
    assert (
        await client.post(f"{API}/ship-base-categories", json={"code": "", "name": "x"}, headers=h)
    ).status_code == 422
    assert (
        await client.post(f"{API}/ship-base-categories", json={"name": "x"}, headers=h)
    ).status_code == 422

    r = await client.get(f"{API}/ship-base-categories", params={"filter": "name:destr"}, headers=h)
    assert r.json()["total"] == 1
    r = await client.get(f"{API}/ship-base-categories", params={"sort": "code:asc"}, headers=h)
    assert r.status_code == 200 and r.json()["total"] == seeded + 1
    bad = await client.get(f"{API}/ship-base-categories", params={"filter": "status:active"}, headers=h)
    assert bad.status_code == 422
    assert (await client.get(f"{API}/ship-base-categories", params={"q": "destroyer"}, headers=h)).json()[
        "total"
    ] == 1

    r = await client.get(f"{API}/ship-base-categories/options", params={"q": "CAT-001"}, headers=h)
    assert r.json() == [{"id": cid, "label": "CAT-001 - Destroyer"}]

    r = await client.put(f"{API}/ship-base-categories/{cid}", json={"name": "Destroyer Class"}, headers=h)
    assert r.status_code == 200 and r.json()["name"] == "Destroyer Class"
    # no status endpoint for categories (no status column)
    st = await client.patch(
        f"{API}/ship-base-categories/{cid}/status", json={"status": "inactive"}, headers=h
    )
    assert st.status_code in (404, 405)
    assert (await client.get(f"{API}/ship-base-categories/999999", headers=h)).status_code == 404

    # referenced by a ship base -> 409
    r = await client.post(
        f"{API}/ship-bases",
        json={"code": "SB-1", "name": "BNS X", "type": "ship", "category_id": cid},
        headers=h,
    )
    assert r.status_code == 201, r.text
    assert (await client.delete(f"{API}/ship-base-categories/{cid}", headers=h)).status_code == 409
    assert (await client.delete(f"{API}/ship-bases/{r.json()['id']}", headers=h)).status_code == 200
    assert (await client.delete(f"{API}/ship-base-categories/{cid}", headers=h)).status_code == 200
    assert (await client.get(f"{API}/ship-base-categories/{cid}", headers=h)).status_code == 404


@pytest.mark.asyncio
async def test_ship_base_crud_filter_sort(client: AsyncClient, admin_headers):
    h = admin_headers
    r = await client.post(
        f"{API}/ship-base-categories", json={"code": "FRG", "name": "Frigate Class"}, headers=h
    )
    cid = r.json()["id"]

    r = await client.post(
        f"{API}/ship-bases",
        json={"code": "S-001", "name": "BNS Bangabandhu", "type": "ship", "category_id": cid},
        headers=h,
    )
    assert r.status_code == 201, r.text
    j = r.json()
    sid = j["id"]
    assert j["status"] == "active" and j["type"] == "ship"
    assert j["category"] == {"id": cid, "code": "FRG", "name": "Frigate Class"}

    # category optional; type required + enum-validated
    r = await client.post(
        f"{API}/ship-bases", json={"code": "B-001", "name": "BNS Issa Khan", "type": "base"}, headers=h
    )
    assert r.status_code == 201 and r.json()["category"] is None
    bid = r.json()["id"]
    assert (
        await client.post(f"{API}/ship-bases", json={"code": "B-002", "name": "x"}, headers=h)
    ).status_code == 422
    bad_type = await client.post(
        f"{API}/ship-bases", json={"code": "B-002", "name": "x", "type": "plane"}, headers=h
    )
    assert bad_type.status_code == 422
    dup = await client.post(
        f"{API}/ship-bases", json={"code": "S-001", "name": "dup", "type": "ship"}, headers=h
    )
    assert dup.status_code == 409

    for i in range(2, 12):
        await client.post(
            f"{API}/ship-bases",
            json={
                "code": f"S-{i:03d}",
                "name": f"Ship {i}",
                "type": "ship",
                "category_id": cid if i % 2 else None,
                "status": "active" if i % 3 else "inactive",
            },
            headers=h,
        )

    r = await client.get(
        f"{API}/ship-bases", params={"page": 1, "page_size": 10, "sort": "code:asc"}, headers=h
    )
    j = r.json()
    assert (j["total"], j["pages"], len(j["items"])) == (12, 2, 10)
    assert j["items"][0]["code"] == "B-001"

    assert (await client.get(f"{API}/ship-bases", params={"filter": "type:base"}, headers=h)).json()[
        "total"
    ] == 1
    assert (await client.get(f"{API}/ship-bases", params={"filter": "category:frigate"}, headers=h)).json()[
        "total"
    ] == 6
    by_id = await client.get(f"{API}/ship-bases", params={"filter": f"category_id:{cid}"}, headers=h)
    assert by_id.json()["total"] == 6
    assert (await client.get(f"{API}/ship-bases", params={"filter": "status:inactive"}, headers=h)).json()[
        "total"
    ] == 3
    r = await client.get(f"{API}/ship-bases", params={"sort": "category:desc", "page_size": 20}, headers=h)
    assert r.status_code == 200
    assert (await client.get(f"{API}/ship-bases", params={"sort": "type:asc"}, headers=h)).status_code == 200
    assert (await client.get(f"{API}/ship-bases", params={"filter": "foo:bar"}, headers=h)).status_code == 422
    assert (await client.get(f"{API}/ship-bases", params={"q": "bangabandhu"}, headers=h)).json()[
        "total"
    ] == 1

    r = await client.get(f"{API}/ship-bases/options", params={"q": "S-001"}, headers=h)
    assert r.json() == [{"id": sid, "label": "S-001 - BNS Bangabandhu"}]
    # options only list active rows
    labels = [o["label"] for o in (await client.get(f"{API}/ship-bases/options", headers=h)).json()]
    assert not any(lbl.startswith("S-003 ") for lbl in labels)  # i=3 -> inactive

    r = await client.put(
        f"{API}/ship-bases/{sid}", json={"name": "BNS Bangabandhu (F25)", "category_id": None}, headers=h
    )
    assert (
        r.status_code == 200 and r.json()["name"] == "BNS Bangabandhu (F25)" and r.json()["category"] is None
    )
    r = await client.patch(f"{API}/ship-bases/{sid}/status", json={"status": "inactive"}, headers=h)
    assert r.status_code == 200 and r.json()["status"] == "inactive"
    assert (await client.get(f"{API}/ship-bases/999999", headers=h)).status_code == 404

    assert (await client.delete(f"{API}/ship-bases/{bid}", headers=h)).status_code == 200
    assert (await client.get(f"{API}/ship-bases/{bid}", headers=h)).status_code == 404


@pytest.mark.asyncio
async def test_ship_base_delete_blocked_when_referenced(client: AsyncClient, admin_headers, db_session):
    """Ship/Base referenced by a user (ship_base_id) or an allocation cannot be deleted (409)."""
    h = admin_headers
    r = await client.post(
        f"{API}/ship-bases", json={"code": "S-REF", "name": "BNS Ref", "type": "ship"}, headers=h
    )
    sid = r.json()["id"]

    # user bound to the ship base
    admin = (await db_session.execute(select(User).where(User.username == "admin"))).scalar_one()
    admin.ship_base_id = sid
    await db_session.commit()
    r = await client.delete(f"{API}/ship-bases/{sid}", headers=h)
    assert r.status_code == 409 and "users" in r.json()["detail"]
    admin.ship_base_id = None
    await db_session.commit()

    # allocation referencing the ship base
    fy = (await db_session.execute(select(FiscalYear).where(FiscalYear.is_current.is_(True)))).scalar_one()
    store = Store(code="ST-1", name="Central Store")
    cat = ItemCategory(code="IC-1", name="General")
    db_session.add_all([store, cat])
    await db_session.flush()
    item = Item(code="IT-1", name="Rope", category_id=cat.id)
    db_session.add(item)
    await db_session.flush()
    alloc = Allocation(
        code="AL-1",
        allocation_type="allocation",
        fiscal_year_id=fy.id,
        allocation_date=date.today(),
        store_id=store.id,
        item_id=item.id,
        ship_base_id=sid,
        quantity=1,
    )
    db_session.add(alloc)
    await db_session.commit()
    r = await client.delete(f"{API}/ship-bases/{sid}", headers=h)
    assert r.status_code == 409 and "allocations" in r.json()["detail"]
    await db_session.delete(alloc)
    await db_session.commit()
    assert (await client.delete(f"{API}/ship-bases/{sid}", headers=h)).status_code == 200


@pytest.mark.asyncio
async def test_options_permission_and_audit(client: AsyncClient, admin_headers, db_session):
    """A user with only User Management list permission can read /options but not the list; mutations are audited."""
    h = admin_headers
    r = await client.post(
        f"{API}/ship-bases", json={"code": "S-AUD", "name": "BNS Audit", "type": "ship"}, headers=h
    )
    sid = r.json()["id"]
    logs = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.entity == "ship_bases", AuditLog.entity_id == str(sid))
            )
        )
        .scalars()
        .all()
    )
    assert len(logs) == 1 and logs[0].action == "create" and logs[0].after["code"] == "S-AUD"

    role = Role(name="UM only", description="", is_system=False)
    db_session.add(role)
    await db_session.flush()
    um = (
        await db_session.execute(select(ModuleModel).where(ModuleModel.code == "user_management"))
    ).scalar_one()
    db_session.add(
        RolePermission(
            role_id=role.id,
            module_id=um.id,
            can_menu=True,
            can_list=True,
            can_view=True,
            can_add=False,
            can_edit=False,
            can_delete=False,
        )
    )
    db_session.add(
        User(
            user_type="admin",
            username="umuser",
            full_name="UM User",
            email="um@x.com",
            phone="0170",
            hashed_password=hash_password("Um@12345"),
            role_id=role.id,
        )
    )
    await db_session.commit()
    r = await client.post(f"{API}/auth/login", json={"identifier": "umuser", "password": "Um@12345"})
    assert r.status_code == 200, r.text
    uh = {"Authorization": f"Bearer {r.json()['access_token']}"}
    assert (await client.get(f"{API}/ship-bases/options", headers=uh)).status_code == 200
    assert (await client.get(f"{API}/ship-base-categories/options", headers=uh)).status_code == 200
    assert (await client.get(f"{API}/ship-bases", headers=uh)).status_code == 403
    denied = await client.post(
        f"{API}/ship-bases", json={"code": "S-X", "name": "x", "type": "ship"}, headers=uh
    )
    assert denied.status_code == 403
    assert (await client.delete(f"{API}/ship-bases/{sid}", headers=uh)).status_code == 403
