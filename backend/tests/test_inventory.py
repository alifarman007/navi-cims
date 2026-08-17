"""Inventory Management tests: Store CRUD, Opening Stock -> ledger/balance rules, read-only stocks + transactions."""

import pytest
from httpx import AsyncClient

API = "/api/v1"


async def _setup_item(client: AsyncClient, h, code="IT-001", name="Rope 12mm"):
    r = await client.post(f"{API}/item-categories", json={"code": "CAT-1", "name": "Consumables"}, headers=h)
    cat_id = (
        r.json()["id"]
        if r.status_code == 201
        else (await client.get(f"{API}/item-categories", params={"filter": "code:CAT-1"}, headers=h)).json()[
            "items"
        ][0]["id"]
    )
    r = await client.post(f"{API}/items", json={"code": code, "name": name, "category_id": cat_id}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def _setup_store(
    client: AsyncClient, h, code="ST-001", name="Central Store Dhaka", store_type="Central"
):
    r = await client.post(
        f"{API}/stores",
        json={"code": code, "name": name, "store_type": store_type, "concern": "DTS", "address": "Dhaka"},
        headers=h,
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


@pytest.mark.asyncio
async def test_store_crud_list_filter_sort_options(client: AsyncClient, admin_headers):
    h = admin_headers
    r = await client.post(
        f"{API}/stores",
        json={
            "code": "ST-001",
            "name": "Central Store",
            "store_type": "Central",
            "concern": "DTS",
            "address": "Dhaka",
        },
        headers=h,
    )
    assert r.status_code == 201, r.text
    sid = r.json()["id"]
    assert r.json()["status"] == "active" and r.json()["store_type"] == "Central"

    # duplicate code -> 409, missing/invalid type -> 422
    assert (
        await client.post(
            f"{API}/stores", json={"code": "ST-001", "name": "x", "store_type": "Depot"}, headers=h
        )
    ).status_code == 409
    assert (
        await client.post(f"{API}/stores", json={"code": "ST-X", "name": "x"}, headers=h)
    ).status_code == 422
    assert (
        await client.post(
            f"{API}/stores", json={"code": "ST-X", "name": "x", "store_type": "Garage"}, headers=h
        )
    ).status_code == 422

    for i in range(2, 14):
        await client.post(
            f"{API}/stores",
            json={
                "code": f"ST-{i:03d}",
                "name": f"Store {i}",
                "store_type": "Depot" if i % 2 else "Ship/Base",
            },
            headers=h,
        )
    r = await client.get(f"{API}/stores", params={"page": 1, "page_size": 10, "sort": "code:asc"}, headers=h)
    j = r.json()
    assert (j["total"], j["pages"], len(j["items"])) == (13, 2, 10)
    assert j["items"][0]["code"] == "ST-001"
    r = await client.get(f"{API}/stores", params={"filter": ["store_type:depot"]}, headers=h)
    assert r.status_code == 200 and r.json()["total"] == 6
    assert (await client.get(f"{API}/stores", params={"filter": "foo:bar"}, headers=h)).status_code == 422
    assert (await client.get(f"{API}/stores", params={"q": "central"}, headers=h)).json()["total"] == 1

    r = await client.get(f"{API}/stores/options", params={"q": "central"}, headers=h)
    assert r.json() == [{"id": sid, "label": "ST-001 - Central Store"}]

    r = await client.put(
        f"{API}/stores/{sid}", json={"name": "Central Store Dhaka", "store_type": "Other"}, headers=h
    )
    assert (
        r.status_code == 200
        and r.json()["name"] == "Central Store Dhaka"
        and r.json()["store_type"] == "Other"
    )
    r = await client.patch(f"{API}/stores/{sid}/status", json={"status": "inactive"}, headers=h)
    assert r.status_code == 200 and r.json()["status"] == "inactive"
    assert (await client.get(f"{API}/stores/999999", headers=h)).status_code == 404

    r = await client.get(f"{API}/stores/{sid}", headers=h)
    assert r.status_code == 200 and r.json()["code"] == "ST-001"
    assert (await client.delete(f"{API}/stores/{sid}", headers=h)).status_code == 200
    assert (await client.get(f"{API}/stores/{sid}", headers=h)).status_code == 404


@pytest.mark.asyncio
async def test_opening_stock_creates_ledger_and_balance(client: AsyncClient, admin_headers):
    h = admin_headers
    store_id = await _setup_store(client, h)
    item_id = await _setup_item(client, h)

    # qty must be > 0
    r = await client.post(
        f"{API}/opening-stocks",
        json={"store_id": store_id, "item_id": item_id, "quantity": 0, "entry_date": "2026-07-01"},
        headers=h,
    )
    assert r.status_code == 422
    # unknown store / item -> 404
    r = await client.post(
        f"{API}/opening-stocks",
        json={"store_id": 99999, "item_id": item_id, "quantity": 5, "entry_date": "2026-07-01"},
        headers=h,
    )
    assert r.status_code == 404

    r = await client.post(
        f"{API}/opening-stocks",
        json={
            "store_id": store_id,
            "item_id": item_id,
            "quantity": "100.5",
            "entry_date": "2026-07-01",
            "low_stock_threshold": 20,
            "remarks": "FY opening",
        },
        headers=h,
    )
    assert r.status_code == 201, r.text
    os1 = r.json()
    assert os1["store"]["code"] == "ST-001" and os1["item"]["name"] == "Rope 12mm"
    assert float(os1["quantity"]) == 100.5

    # balance row created + ledger 'opening' row written
    r = await client.get(
        f"{API}/stocks", params={"filter": [f"store_id:{store_id}", f"item_id:{item_id}"]}, headers=h
    )
    assert r.status_code == 200 and r.json()["total"] == 1
    stock = r.json()["items"][0]
    assert float(stock["quantity"]) == 100.5 and float(stock["low_stock_threshold"]) == 20
    assert stock["is_low"] is False and stock["store"]["name"] == "Central Store Dhaka"

    r = await client.get(
        f"{API}/stocks/summary", params={"store_id": store_id, "item_id": item_id}, headers=h
    )
    assert r.status_code == 200 and float(r.json()["quantity"]) == 100.5
    # unknown pair -> zero
    r = await client.get(f"{API}/stocks/summary", params={"store_id": store_id, "item_id": 424242}, headers=h)
    assert r.status_code == 200 and float(r.json()["quantity"]) == 0

    r = await client.get(f"{API}/stock-transactions", params={"filter": [f"store_id:{store_id}"]}, headers=h)
    assert r.json()["total"] == 1
    txn = r.json()["items"][0]
    assert txn["txn_type"] == "opening" and float(txn["quantity_delta"]) == 100.5
    assert (
        float(txn["balance_after"]) == 100.5
        and txn["ref_type"] == "opening_stock"
        and txn["ref_id"] == os1["id"]
    )
    assert txn["source"] == "manual"

    # second opening for the same (store,item) ADDS to the balance
    r = await client.post(
        f"{API}/opening-stocks",
        json={"store_id": store_id, "item_id": item_id, "quantity": 50, "entry_date": "2026-07-02"},
        headers=h,
    )
    assert r.status_code == 201, r.text
    os2_id = r.json()["id"]
    r = await client.get(
        f"{API}/stocks/summary", params={"store_id": store_id, "item_id": item_id}, headers=h
    )
    assert float(r.json()["quantity"]) == 150.5
    r = await client.get(
        f"{API}/stock-transactions", params={"sort": "id:asc", "filter": [f"item_id:{item_id}"]}, headers=h
    )
    assert [float(t["balance_after"]) for t in r.json()["items"]] == [100.5, 150.5]
    r = await client.get(f"{API}/stock-transactions", params={"filter": ["txn_type:opening"]}, headers=h)
    assert r.json()["total"] == 2
    r = await client.get(f"{API}/stock-transactions", params={"date_from": "2999-01-01"}, headers=h)
    assert r.json()["total"] == 0

    # update: quantity is immutable; entry_date/remarks/threshold editable; threshold propagates to the balance row
    r = await client.put(
        f"{API}/opening-stocks/{os1['id']}",
        json={"quantity": 999, "entry_date": "2026-07-05", "remarks": "edited", "low_stock_threshold": 200},
        headers=h,
    )
    assert r.status_code == 200, r.text
    assert (
        float(r.json()["quantity"]) == 100.5
        and r.json()["entry_date"] == "2026-07-05"
        and r.json()["remarks"] == "edited"
    )
    r = await client.get(f"{API}/stocks", params={"filter": ["is_low:true"]}, headers=h)
    assert r.json()["total"] == 1 and r.json()["items"][0]["is_low"] is True  # 150.5 <= 200
    assert float(r.json()["items"][0]["low_stock_threshold"]) == 200
    r = await client.get(f"{API}/stocks", params={"filter": ["is_low:false"]}, headers=h)
    assert r.json()["total"] == 0
    r = await client.get(
        f"{API}/stocks", params={"sort": "quantity:desc", "filter": ["store:central"]}, headers=h
    )
    assert r.status_code == 200 and r.json()["total"] == 1

    # list opening stocks with joined-name filter + sort
    r = await client.get(
        f"{API}/opening-stocks", params={"filter": ["item:rope"], "sort": "entry_date:asc"}, headers=h
    )
    assert r.json()["total"] == 2 and r.json()["items"][0]["id"] == os2_id  # 07-02 < 07-05 (edited)

    # delete reverses the movement (negative adjustment) and the balance drops
    r = await client.delete(f"{API}/opening-stocks/{os2_id}", headers=h)
    assert r.status_code == 200, r.text
    r = await client.get(
        f"{API}/stocks/summary", params={"store_id": store_id, "item_id": item_id}, headers=h
    )
    assert float(r.json()["quantity"]) == 100.5
    r = await client.get(f"{API}/stock-transactions", params={"sort": "id:desc"}, headers=h)
    last = r.json()["items"][0]
    assert (
        last["txn_type"] == "adjustment"
        and float(last["quantity_delta"]) == -50
        and float(last["balance_after"]) == 100.5
    )
    assert last["ref_type"] == "opening_stock_reversal" and last["ref_id"] == os2_id
    assert (await client.get(f"{API}/opening-stocks/{os2_id}", headers=h)).status_code == 404

    # store referenced by stocks / opening stocks -> delete blocked
    assert (await client.delete(f"{API}/stores/{store_id}", headers=h)).status_code == 409


@pytest.mark.asyncio
async def test_opening_stock_delete_blocked_when_balance_would_go_negative(
    client: AsyncClient, admin_headers, db_session
):
    from decimal import Decimal

    from app.models.enums import StockSource, StockTxnType
    from app.services.stock_ledger import apply_stock_movement

    h = admin_headers
    store_id = await _setup_store(client, h)
    item_id = await _setup_item(client, h)
    r = await client.post(
        f"{API}/opening-stocks",
        json={"store_id": store_id, "item_id": item_id, "quantity": 10, "entry_date": "2026-07-01"},
        headers=h,
    )
    assert r.status_code == 201, r.text
    os_id = r.json()["id"]

    # simulate an issue (allocation_out) of 8 through the ledger -> only 2 left
    await apply_stock_movement(
        db_session,
        store_id=store_id,
        item_id=item_id,
        quantity_delta=Decimal("-8"),
        txn_type=StockTxnType.ALLOCATION_OUT,
        user_id=None,
        source=StockSource.MANUAL,
        ref_type="test",
    )
    await db_session.commit()
    r = await client.get(
        f"{API}/stocks/summary", params={"store_id": store_id, "item_id": item_id}, headers=h
    )
    assert float(r.json()["quantity"]) == 2

    # reversing 10 would make the balance -8 -> 409, row still exists, balance unchanged
    r = await client.delete(f"{API}/opening-stocks/{os_id}", headers=h)
    assert r.status_code == 409, r.text
    assert "negative" in r.json()["detail"]
    assert (await client.get(f"{API}/opening-stocks/{os_id}", headers=h)).status_code == 200
    r = await client.get(
        f"{API}/stocks/summary", params={"store_id": store_id, "item_id": item_id}, headers=h
    )
    assert float(r.json()["quantity"]) == 2
    r = await client.get(f"{API}/stock-transactions", params={"filter": [f"item_id:{item_id}"]}, headers=h)
    assert r.json()["total"] == 2  # opening + allocation_out only, no reversal written


@pytest.mark.asyncio
async def test_stocks_require_auth(client: AsyncClient):
    assert (await client.get(f"{API}/stocks")).status_code == 401
    assert (await client.get(f"{API}/stock-transactions")).status_code == 401
    assert (await client.get(f"{API}/stores")).status_code == 401
