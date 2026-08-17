"""Allocation/Sanction + Compilation/Verification: CRUD, workflow (approve deducts stock, send back,
resubmit, cancel), ship/base scoping and permissions."""

from __future__ import annotations

from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import hash_password
from app.models.config import FiscalYear
from app.models.enums import ShipBaseType, StockTxnType, UserType
from app.models.inventory import Stock, Store
from app.models.item import Item, ItemCategory
from app.models.misc import AuditLog, Notification
from app.models.role import Role
from app.models.ship_base import ShipBase
from app.models.user import User
from app.services.stock_ledger import apply_stock_movement

API = "/api/v1"
PW = "Test@12345"


async def _seed(db_session):
    """Two ship/bases, one store, one item with 100 units in stock, an office (verifier) user and a
    ship/base user bound to ship 1. Returns ids."""
    cat = ItemCategory(code="CAT-1", name="Cat 1")
    store = Store(code="ST-1", name="Central Store")
    s1 = ShipBase(code="BNS-1", name="BNS Bangabandhu", type=ShipBaseType.SHIP)
    s2 = ShipBase(code="BNS-2", name="BNS Osman", type=ShipBaseType.SHIP)
    db_session.add_all([cat, store, s1, s2])
    await db_session.flush()
    item = Item(code="IT-1", name="Rope 12mm", category_id=cat.id)
    db_session.add(item)
    await db_session.flush()
    await apply_stock_movement(
        db_session,
        store_id=store.id,
        item_id=item.id,
        quantity_delta=Decimal("100"),
        txn_type=StockTxnType.OPENING,
        user_id=None,
    )
    roles = {r.name: r for r in (await db_session.execute(select(Role))).scalars()}
    office = User(
        user_type=UserType.OFFICE_USER,
        username="dts1",
        full_name="DTS Officer",
        hashed_password=hash_password(PW),
        role_id=roles["Office User"].id,
    )
    ship = User(
        user_type=UserType.SHIP_BASE_USER,
        username="ship1",
        full_name="Ship One User",
        hashed_password=hash_password(PW),
        role_id=roles["Ship/Base User"].id,
        ship_base_id=s1.id,
    )
    db_session.add_all([office, ship])
    fy = (await db_session.execute(select(FiscalYear).order_by(FiscalYear.id))).scalars().first()
    await db_session.commit()
    return {
        "store": store.id,
        "item": item.id,
        "s1": s1.id,
        "s2": s2.id,
        "fy": fy.id,
        "office": office.id,
        "ship": ship.id,
    }


async def _login(client: AsyncClient, username: str) -> dict[str, str]:
    r = await client.post(f"{API}/auth/login", json={"identifier": username, "password": PW})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _payload(ids, code="ALC-001", qty="10", ship="s1", **kw):
    p = {
        "code": code,
        "allocation_type": "allocation",
        "fiscal_year_id": ids["fy"],
        "allocation_date": "2026-01-15",
        "store_id": ids["store"],
        "item_id": ids["item"],
        "ship_base_id": ids[ship],
        "quantity": qty,
    }
    p.update(kw)
    return p


async def _stock_qty(db_session, ids) -> Decimal:
    db_session.expire_all()
    st = (
        (
            await db_session.execute(
                select(Stock).where(Stock.store_id == ids["store"], Stock.item_id == ids["item"])
            )
        )
        .scalars()
        .first()
    )
    return Decimal(st.quantity)


@pytest.mark.asyncio
async def test_allocation_crud_and_list(client: AsyncClient, admin_headers, db_session):
    ids = await _seed(db_session)
    h = admin_headers
    r = await client.post(f"{API}/allocations", json=_payload(ids, remarks="urgent"), headers=h)
    assert r.status_code == 201, r.text
    a = r.json()
    aid = a["id"]
    assert a["status"] == "pending" and a["fiscal_year"]["name"] and a["store"]["name"] == "Central Store"
    assert (
        a["item"]["code"] == "IT-1"
        and a["ship_base"]["name"] == "BNS Bangabandhu"
        and a["verifications"] == []
    )
    # duplicate code -> 409 ; qty <= 0 -> 422 ; bad type -> 422
    assert (await client.post(f"{API}/allocations", json=_payload(ids), headers=h)).status_code == 409
    assert (
        await client.post(f"{API}/allocations", json=_payload(ids, code="X", qty="0"), headers=h)
    ).status_code == 422
    assert (
        await client.post(
            f"{API}/allocations", json=_payload(ids, code="Y", allocation_type="gift"), headers=h
        )
    ).status_code == 422

    for i in range(2, 6):
        await client.post(
            f"{API}/allocations",
            json=_payload(
                ids,
                code=f"ALC-{i:03d}",
                qty=str(i),
                allocation_type="sanction" if i % 2 else "allocation",
                ship="s2" if i > 3 else "s1",
            ),
            headers=h,
        )
    r = await client.get(f"{API}/allocations", params={"sort": "code:asc"}, headers=h)
    j = r.json()
    assert j["total"] == 5 and j["items"][0]["code"] == "ALC-001"
    r = await client.get(f"{API}/allocations", params={"filter": ["ship_base:osman"]}, headers=h)
    assert r.json()["total"] == 2
    r = await client.get(
        f"{API}/allocations", params={"filter": ["allocation_type:sanction", "status:pending"]}, headers=h
    )
    assert r.json()["total"] == 2
    r = await client.get(
        f"{API}/allocations", params={"filter": ["fiscal_year:20"], "sort": "item:desc"}, headers=h
    )
    assert r.json()["total"] == 5
    assert (
        await client.get(f"{API}/allocations", params={"filter": "foo:bar"}, headers=h)
    ).status_code == 422
    assert (await client.get(f"{API}/allocations", params={"q": "rope"}, headers=h)).json()["total"] == 5

    r = await client.get(f"{API}/allocations/options", params={"status": "pending"}, headers=h)
    assert (
        r.status_code == 200
        and len(r.json()) == 5
        and r.json()[-1]["label"].startswith("ALC-001 - Rope 12mm")
    )
    assert (
        await client.get(f"{API}/allocations/options", params={"status": "approved"}, headers=h)
    ).json() == []

    # update while pending ok
    r = await client.put(f"{API}/allocations/{aid}", json={"quantity": "20", "remarks": "changed"}, headers=h)
    assert r.status_code == 200 and Decimal(r.json()["quantity"]) == 20
    assert (await client.get(f"{API}/allocations/{aid}", headers=h)).json()["remarks"] == "changed"
    assert (await client.get(f"{API}/allocations/999999", headers=h)).status_code == 404
    # delete pending ok
    assert (await client.delete(f"{API}/allocations/{aid}", headers=h)).status_code == 200
    assert (await client.get(f"{API}/allocations/{aid}", headers=h)).status_code == 404


@pytest.mark.asyncio
async def test_approve_deducts_stock_and_blocks_insufficient(client: AsyncClient, admin_headers, db_session):
    ids = await _seed(db_session)
    h = admin_headers
    a = (await client.post(f"{API}/allocations", json=_payload(ids, qty="30"), headers=h)).json()
    big = (
        await client.post(f"{API}/allocations", json=_payload(ids, code="ALC-BIG", qty="500"), headers=h)
    ).json()

    r = await client.post(f"{API}/allocations/{a['id']}/approve", headers=h)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["status"] == "approved" and j["approved_by"]["username"] == "admin" and j["approved_at"]
    assert len(j["verifications"]) == 1 and j["verifications"][0]["action"] == "approved"
    assert j["verifications"][0]["code"].startswith("VRF-")
    assert await _stock_qty(db_session, ids) == Decimal("70")

    # second approve -> 409 ; edit/delete approved -> 409
    assert (await client.post(f"{API}/allocations/{a['id']}/approve", headers=h)).status_code == 409
    assert (
        await client.put(f"{API}/allocations/{a['id']}", json={"quantity": "1"}, headers=h)
    ).status_code == 409
    assert (await client.delete(f"{API}/allocations/{a['id']}", headers=h)).status_code == 409
    assert (await client.post(f"{API}/allocations/{a['id']}/cancel", headers=h)).status_code == 409

    # insufficient stock -> 409, nothing changed
    r = await client.post(f"{API}/allocations/{big['id']}/approve", headers=h)
    assert r.status_code == 409 and "Insufficient stock" in r.json()["detail"]
    assert await _stock_qty(db_session, ids) == Decimal("70")
    assert (await client.get(f"{API}/allocations/{big['id']}", headers=h)).json()["status"] == "pending"

    # ledger row + audit + notification (creator = admin) exist
    from app.models.inventory import StockTransaction

    txns = (
        (
            await db_session.execute(
                select(StockTransaction).where(
                    StockTransaction.ref_type == "allocation", StockTransaction.ref_id == a["id"]
                )
            )
        )
        .scalars()
        .all()
    )
    assert (
        len(txns) == 1
        and txns[0].txn_type == StockTxnType.ALLOCATION_OUT
        and Decimal(txns[0].quantity_delta) == -30
    )
    logs = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.entity == "allocations", AuditLog.action == "approve")
            )
        )
        .scalars()
        .all()
    )
    assert len(logs) == 1
    notes = (
        (await db_session.execute(select(Notification).where(Notification.title == "Allocation approved")))
        .scalars()
        .all()
    )
    assert len(notes) == 1

    # verifications list reflects it
    r = await client.get(f"{API}/verifications", headers=h)
    assert r.status_code == 200 and r.json()["total"] == 1
    v = r.json()["items"][0]
    assert v["allocation"]["code"] == "ALC-001" and v["allocation"]["status"] == "approved"
    assert v["approver"]["username"] == "admin" and v["action"] == "approved"
    # approved verification cannot be deleted even by admin (stock already moved)
    assert (await client.delete(f"{API}/verifications/{v['id']}", headers=h)).status_code == 409


@pytest.mark.asyncio
async def test_send_back_resubmit_cancel_and_verification_create(
    client: AsyncClient, admin_headers, db_session
):
    ids = await _seed(db_session)
    h = admin_headers
    a = (await client.post(f"{API}/allocations", json=_payload(ids), headers=h)).json()

    # send back requires a comment
    assert (
        await client.post(f"{API}/allocations/{a['id']}/send-back", json={}, headers=h)
    ).status_code == 422
    assert (
        await client.post(f"{API}/allocations/{a['id']}/send-back", json={"comment": ""}, headers=h)
    ).status_code == 422
    r = await client.post(
        f"{API}/allocations/{a['id']}/send-back", json={"comment": "Qty too high"}, headers=h
    )
    assert r.status_code == 200 and r.json()["status"] == "sent_back"
    assert (
        r.json()["verifications"][0]["action"] == "sent_back"
        and r.json()["verifications"][0]["comment"] == "Qty too high"
    )
    assert await _stock_qty(db_session, ids) == Decimal("100")
    # can't approve or send back a sent_back allocation; can edit it
    assert (await client.post(f"{API}/allocations/{a['id']}/approve", headers=h)).status_code == 409
    assert (
        await client.post(f"{API}/allocations/{a['id']}/send-back", json={"comment": "x"}, headers=h)
    ).status_code == 409
    assert (
        await client.put(f"{API}/allocations/{a['id']}", json={"quantity": "5"}, headers=h)
    ).status_code == 200
    # resubmit -> pending
    r = await client.post(f"{API}/allocations/{a['id']}/resubmit", headers=h)
    assert r.status_code == 200 and r.json()["status"] == "pending"
    assert (await client.post(f"{API}/allocations/{a['id']}/resubmit", headers=h)).status_code == 409

    # POST /verifications approves through the same code path
    r = await client.post(
        f"{API}/verifications", json={"code": "VRF-MANUAL-1", "allocation_id": a["id"]}, headers=h
    )
    assert r.status_code == 201, r.text
    v = r.json()
    assert v["code"] == "VRF-MANUAL-1" and v["action"] == "approved" and v["approver"]["username"] == "admin"
    assert v["allocation"]["status"] == "approved"
    assert await _stock_qty(db_session, ids) == Decimal("95")
    # duplicate verification code -> 409 ; approving an already-approved allocation -> 409
    b = (await client.post(f"{API}/allocations", json=_payload(ids, code="ALC-002"), headers=h)).json()
    assert (
        await client.post(
            f"{API}/verifications", json={"code": "VRF-MANUAL-1", "allocation_id": b["id"]}, headers=h
        )
    ).status_code == 409
    assert (
        await client.post(f"{API}/verifications", json={"allocation_id": a["id"]}, headers=h)
    ).status_code == 409
    # send-back via verifications requires comment
    assert (
        await client.post(
            f"{API}/verifications", json={"allocation_id": b["id"], "action": "sent_back"}, headers=h
        )
    ).status_code == 409
    r = await client.post(
        f"{API}/verifications",
        json={"allocation_id": b["id"], "action": "sent_back", "comment": "no"},
        headers=h,
    )
    assert r.status_code == 201 and r.json()["action"] == "sent_back"
    sent_back_ver_id = r.json()["id"]
    r = await client.get(
        f"{API}/verifications", params={"filter": ["allocation:ALC-002"], "sort": "approver:asc"}, headers=h
    )
    assert r.json()["total"] == 1
    r = await client.get(f"{API}/verifications/{sent_back_ver_id}", headers=h)
    assert r.status_code == 200 and r.json()["allocation"]["code"] == "ALC-002"
    # admin may delete a sent_back verification
    assert (await client.delete(f"{API}/verifications/{sent_back_ver_id}", headers=h)).status_code == 200
    # history is embedded on the allocation
    r = await client.get(f"{API}/allocations/{a['id']}", headers=h)
    assert [v["action"] for v in r.json()["verifications"]] == ["sent_back", "approved"]

    # cancel: pending|sent_back -> cancelled
    r = await client.post(f"{API}/allocations/{b['id']}/cancel", headers=h)
    assert r.status_code == 200 and r.json()["status"] == "cancelled"
    assert (
        await client.put(f"{API}/allocations/{b['id']}", json={"quantity": "5"}, headers=h)
    ).status_code == 409


@pytest.mark.asyncio
async def test_scope_and_permissions(client: AsyncClient, admin_headers, db_session):
    ids = await _seed(db_session)
    h = admin_headers
    a1 = (
        await client.post(f"{API}/allocations", json=_payload(ids, code="ALC-S1", ship="s1"), headers=h)
    ).json()
    a2 = (
        await client.post(f"{API}/allocations", json=_payload(ids, code="ALC-S2", ship="s2"), headers=h)
    ).json()

    # ship/base user (seeded role: allocation list/view only) sees only own ship rows
    sh = await _login(client, "ship1")
    r = await client.get(f"{API}/allocations", headers=sh)
    assert r.status_code == 200 and [x["code"] for x in r.json()["items"]] == ["ALC-S1"]
    assert (await client.get(f"{API}/allocations/{a1['id']}", headers=sh)).status_code == 200
    assert (await client.get(f"{API}/allocations/{a2['id']}", headers=sh)).status_code == 404
    assert len((await client.get(f"{API}/allocations/options", headers=sh)).json()) == 1
    # no add / edit / approve / verification permissions
    assert (
        await client.post(f"{API}/allocations", json=_payload(ids, code="X"), headers=sh)
    ).status_code == 403
    assert (
        await client.put(f"{API}/allocations/{a1['id']}", json={"quantity": "1"}, headers=sh)
    ).status_code == 403
    assert (await client.post(f"{API}/allocations/{a1['id']}/approve", headers=sh)).status_code == 403
    assert (
        await client.post(f"{API}/allocations/{a1['id']}/send-back", json={"comment": "x"}, headers=sh)
    ).status_code == 403
    assert (await client.get(f"{API}/verifications", headers=sh)).status_code == 403
    # not creator, not admin -> cannot cancel
    assert (await client.post(f"{API}/allocations/{a1['id']}/cancel", headers=sh)).status_code == 403

    # office user (DTS/Directorate role): can create, approve, send back, but not delete verifications
    of = await _login(client, "dts1")
    r = await client.post(f"{API}/allocations", json=_payload(ids, code="ALC-OF"), headers=of)
    assert r.status_code == 201
    mine = r.json()
    r = await client.post(f"{API}/allocations/{a2['id']}/approve", headers=of)
    assert r.status_code == 200 and r.json()["approved_by"]["username"] == "dts1"
    r = await client.get(f"{API}/verifications", headers=of)
    assert r.status_code == 200 and r.json()["total"] == 1
    vid = r.json()["items"][0]["id"]
    assert (await client.delete(f"{API}/verifications/{vid}", headers=of)).status_code == 403
    # creator cancels own pending allocation
    r = await client.post(f"{API}/allocations/{mine['id']}/cancel", headers=of)
    assert r.status_code == 200 and r.json()["status"] == "cancelled"
    # office user is not admin -> cannot cancel someone else's allocation
    assert (await client.post(f"{API}/allocations/{a1['id']}/cancel", headers=of)).status_code == 403
    # admin can
    assert (await client.post(f"{API}/allocations/{a1['id']}/cancel", headers=h)).status_code == 200
    # unauthenticated
    assert (await client.get(f"{API}/allocations")).status_code == 401
