"""Tests: Procurement Item Info (mock BNPIMS sync + read-only list), Notifications inbox, Audit-log access control."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.integrations import bnpims
from app.integrations.bnpims import MockBnpimsClient, normalize_row
from app.models.enums import UserType
from app.models.misc import Notification
from app.models.role import Role
from app.models.user import User
from app.services.audit import notify

API = "/api/v1"


async def _make_user(db: AsyncSession, username: str, user_type: UserType, role_name: str) -> User:
    role = (await db.execute(select(Role).where(Role.name == role_name))).scalars().first()
    u = User(
        user_type=user_type,
        username=username,
        full_name=username.title(),
        email=f"{username}@cims.local",
        phone=f"017{abs(hash(username)) % 10**8:08d}",
        hashed_password=hash_password("Pass@12345"),
        role_id=role.id,
    )
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u


async def _login(client: AsyncClient, username: str, password: str = "Pass@12345") -> dict[str, str]:
    r = await client.post(f"{API}/auth/login", json={"identifier": username, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# ---- BNPIMS adapter -----------------------------------------------------------------------------
def test_normalize_row_tolerates_unknown_shapes():
    n = normalize_row(
        {
            "id": 7,
            "grnNo": "0725.1",
            "transactionDate": "29/07/2025 02:20PM",
            "imcCode": "55.1",
            "itemName": "Rope",
            "unit": "Meter",
            "qty": "12.5",
            "partNo": "P1",
            "remark": "ok",
        }
    )
    assert n["external_id"] == "7" and n["grn_no"] == "0725.1" and n["item_name"] == "Rope"
    assert n["deno"] == "Meter" and str(n["receive_quantity"]) == "12.5" and n["part_no"] == "P1"
    assert n["transaction_date"] == datetime(2025, 7, 29, 14, 20, tzinfo=UTC)
    assert n["raw"]["itemName"] == "Rope"
    # no id but a GRN -> composite external id; nothing usable -> None
    assert normalize_row({"grn_no": "G1", "part_no": "P"})["external_id"] == "G1:P"
    assert normalize_row({"foo": "bar"}) is None


def test_get_client_picks_mock_when_base_url_empty(monkeypatch):
    monkeypatch.setattr(bnpims.settings, "BNPIMS_BASE_URL", "")
    assert isinstance(bnpims.get_client(), MockBnpimsClient)
    monkeypatch.setattr(bnpims.settings, "BNPIMS_BASE_URL", "http://bnpims.local")
    monkeypatch.setattr(bnpims.settings, "BNPIMS_API_KEY", "k")
    c = bnpims.get_client()
    assert isinstance(c, bnpims.BnpimsClient) and c.base_url == "http://bnpims.local"


@pytest.mark.asyncio
async def test_http_client_maps_payload(monkeypatch):
    import httpx

    seen: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["key"] = request.headers.get("X-API-Key")
        return httpx.Response(
            200, json={"data": {"items": [{"external_id": "X1", "grn_no": "1", "item_name": "A"}]}}
        )

    real = httpx.AsyncClient

    def fake_client(*a, **kw):
        kw["transport"] = httpx.MockTransport(handler)
        return real(*a, **kw)

    monkeypatch.setattr(bnpims.httpx, "AsyncClient", fake_client)
    rows = await bnpims.BnpimsClient("http://b/", "secret").fetch_items(datetime(2025, 1, 1, tzinfo=UTC))
    assert rows[0]["external_id"] == "X1" and rows[0]["item_name"] == "A"
    assert seen["key"] == "secret" and seen["url"].startswith(
        "http://b/api/procurement/items?since=2025-01-01"
    )


# ---- Procurement items -------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_procurement_sync_creates_then_updates(client: AsyncClient, admin_headers, monkeypatch):
    h = admin_headers
    monkeypatch.setattr(bnpims.settings, "BNPIMS_BASE_URL", "")  # force mock

    r = await client.get(f"{API}/procurement-items", headers=h)
    assert r.status_code == 200 and r.json()["total"] == 0

    r = await client.post(f"{API}/procurement-items/sync", headers=h)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["fetched"] == 25 and j["created"] == 25 and j["updated"] == 0

    # re-sync: idempotent (nothing changed)
    r = await client.post(f"{API}/procurement-items/sync", headers=h)
    assert r.json() == {**r.json(), "fetched": 25, "created": 0, "updated": 0}

    # upstream change -> updated, no duplicates
    class Changed(MockBnpimsClient):
        async def fetch_items(self, since=None):
            rows = await super().fetch_items(since)
            rows[0]["remarks"] = "Corrected upstream"
            rows.append(
                normalize_row(
                    {"id": "BNP-NEW", "grn_no": "0925.1", "item_name": "New Item", "receive_quantity": 1}
                )
            )
            return rows

    monkeypatch.setattr("app.services.procurement.get_client", lambda: Changed())
    r = await client.post(f"{API}/procurement-items/sync", headers=h)
    assert (r.json()["fetched"], r.json()["created"], r.json()["updated"]) == (26, 1, 1)
    r = await client.get(f"{API}/procurement-items", params={"page_size": 100}, headers=h)
    assert r.json()["total"] == 26
    r = await client.get(f"{API}/procurement-items", params={"filter": "grn_no:0725.82647"}, headers=h)
    assert r.json()["total"] == 1 and r.json()["items"][0]["remarks"] == "Corrected upstream"

    # list: filter / sort / search / detail with raw / options; write endpoints do not exist
    r = await client.get(
        f"{API}/procurement-items", params={"filter": "item_name:rope", "sort": "item_name:asc"}, headers=h
    )
    assert r.status_code == 200 and r.json()["total"] == 3  # Rope Nylon, Rope Polyester, Wire Rope
    assert r.json()["items"][0]["item_name"].startswith("Rope, Nylon")
    assert (await client.get(f"{API}/procurement-items", params={"q": "filter"}, headers=h)).json()[
        "total"
    ] == 2
    assert (
        await client.get(f"{API}/procurement-items", params={"sort": "raw:asc"}, headers=h)
    ).status_code == 422
    row = r.json()["items"][0]
    r = await client.get(f"{API}/procurement-items/{row['id']}", headers=h)
    assert r.status_code == 200 and r.json()["raw"]["source"] == "mock"
    assert (await client.get(f"{API}/procurement-items/999999", headers=h)).status_code == 404
    r = await client.get(f"{API}/procurement-items/options", params={"q": "clamp"}, headers=h)
    assert r.status_code == 200 and len(r.json()) == 1 and "Clamp" in r.json()[0]["label"]
    assert (await client.post(f"{API}/procurement-items", json={}, headers=h)).status_code == 405

    # sync is audit-logged
    r = await client.get(f"{API}/audit-logs", params={"entity": "procurement_items"}, headers=h)
    assert r.status_code == 200 and r.json()["total"] == 3 and r.json()["items"][0]["action"] == "sync"


@pytest.mark.asyncio
async def test_procurement_sync_needs_edit_permission(client: AsyncClient, db_session: AsyncSession):
    # seeded "Office User" role: procurement_item_info menu/list/view only
    await _make_user(db_session, "officer", UserType.OFFICE_USER, "Office User")
    h = await _login(client, "officer")
    assert (await client.get(f"{API}/procurement-items", headers=h)).status_code == 200
    assert (await client.post(f"{API}/procurement-items/sync", headers=h)).status_code == 403


# ---- Notifications -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_notifications_flow_is_scoped_to_owner(
    client: AsyncClient, admin_headers, db_session: AsyncSession
):
    admin = (await db_session.execute(select(User).where(User.username == "admin"))).scalars().first()
    other = await _make_user(db_session, "sailor", UserType.SHIP_BASE_USER, "Ship/Base User")
    await notify(
        db_session,
        user_ids=[admin.id],
        title="Allocation approved",
        message="ALC-1 approved",
        link="/allocation",
    )
    await notify(db_session, user_ids=[admin.id], title="Low stock", message="Rope below threshold")
    await notify(db_session, user_ids=[other.id], title="For sailor", message="not yours")
    await db_session.commit()

    h = admin_headers
    r = await client.get(f"{API}/notifications", headers=h)
    assert r.status_code == 200
    j = r.json()
    assert j["total"] == 2 and [n["title"] for n in j["items"]] == [
        "Low stock",
        "Allocation approved",
    ]  # newest first
    assert all(n["is_read"] is False for n in j["items"])
    assert (await client.get(f"{API}/notifications/unread-count", headers=h)).json() == {"count": 2}

    first = j["items"][0]["id"]
    r = await client.patch(f"{API}/notifications/{first}/read", headers=h)
    assert r.status_code == 200 and r.json()["is_read"] is True
    assert (await client.get(f"{API}/notifications/unread-count", headers=h)).json() == {"count": 1}
    r = await client.get(f"{API}/notifications", params={"filter": "is_read:false"}, headers=h)
    assert r.json()["total"] == 1

    # cannot touch someone else's notification (404, not leaked)
    other_id = (
        await db_session.execute(select(Notification.id).where(Notification.user_id == other.id))
    ).scalar_one()
    assert (await client.patch(f"{API}/notifications/{other_id}/read", headers=h)).status_code == 404

    r = await client.post(f"{API}/notifications/read-all", headers=h)
    assert r.status_code == 200
    assert (await client.get(f"{API}/notifications/unread-count", headers=h)).json() == {"count": 0}
    # read-all only touched admin's rows
    oh = await _login(client, "sailor")
    r = await client.get(f"{API}/notifications", headers=oh)
    assert r.json()["total"] == 1 and r.json()["items"][0]["is_read"] is False
    assert (await client.get(f"{API}/notifications/unread-count", headers=oh)).json() == {"count": 1}
    assert (await client.get(f"{API}/notifications")).status_code == 401


# ---- Audit logs --------------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_audit_logs_access_control_and_filters(
    client: AsyncClient, admin_headers, db_session: AsyncSession
):
    h = admin_headers
    # produce some audit rows through a normal mutation
    r = await client.post(f"{API}/brands", json={"code": "BR-1", "name": "Yamaha"}, headers=h)
    bid = r.json()["id"]
    await client.put(f"{API}/brands/{bid}", json={"name": "Yamaha Motors"}, headers=h)
    await client.delete(f"{API}/brands/{bid}", headers=h)

    r = await client.get(f"{API}/audit-logs", headers=h)
    assert r.status_code == 200
    j = r.json()
    assert j["total"] >= 3
    top = j["items"][0]
    assert top["action"] == "delete" and top["entity"] == "brands" and top["user"]["username"] == "admin"
    assert top["before"]["name"] == "Yamaha Motors" and top["after"] is None
    assert set(top) >= {
        "id",
        "user_id",
        "user",
        "action",
        "entity",
        "entity_id",
        "before",
        "after",
        "ip",
        "created_at",
    }

    # filters: entity / action / user_id / date range / repeatable filter= / sort
    assert (await client.get(f"{API}/audit-logs", params={"entity": "brands"}, headers=h)).json()[
        "total"
    ] == 3
    assert (await client.get(f"{API}/audit-logs", params={"action": "update"}, headers=h)).json()[
        "total"
    ] == 1
    r = await client.get(f"{API}/audit-logs", params={"filter": ["action:create", "user:admin"]}, headers=h)
    assert r.json()["total"] >= 1 and all(i["action"] == "create" for i in r.json()["items"])
    admin = (await db_session.execute(select(User).where(User.username == "admin"))).scalars().first()
    assert (await client.get(f"{API}/audit-logs", params={"user_id": admin.id + 999}, headers=h)).json()[
        "total"
    ] == 0
    today = datetime.now(UTC).date().isoformat()
    assert (
        await client.get(f"{API}/audit-logs", params={"date_from": today, "date_to": today}, headers=h)
    ).json()["total"] >= 3
    assert (await client.get(f"{API}/audit-logs", params={"date_to": "2000-01-01"}, headers=h)).json()[
        "total"
    ] == 0
    r = await client.get(
        f"{API}/audit-logs", params={"sort": "created_at:asc", "entity": "brands"}, headers=h
    )
    assert r.json()["items"][0]["action"] == "create"
    assert (
        await client.get(f"{API}/audit-logs", params={"sort": "before:asc"}, headers=h)
    ).status_code == 422

    # access control: admin user type OK, office/ship-base users 403, anonymous 401
    await _make_user(db_session, "adminuser", UserType.ADMIN, "Admin")
    await _make_user(db_session, "officer", UserType.OFFICE_USER, "Office User")
    await _make_user(db_session, "sailor", UserType.SHIP_BASE_USER, "Ship/Base User")
    assert (
        await client.get(f"{API}/audit-logs", headers=await _login(client, "adminuser"))
    ).status_code == 200
    assert (await client.get(f"{API}/audit-logs", headers=await _login(client, "officer"))).status_code == 403
    assert (await client.get(f"{API}/audit-logs", headers=await _login(client, "sailor"))).status_code == 403
    assert (await client.get(f"{API}/audit-logs")).status_code == 401
