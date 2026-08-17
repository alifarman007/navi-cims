"""Item Management: Item Unit / Item Category / Model / Item CRUD, uniqueness, embedded refs, FK-in-use 409."""

import pytest
from httpx import AsyncClient

API = "/api/v1"


@pytest.mark.asyncio
async def test_unit_category_model_crud(client: AsyncClient, admin_headers):
    h = admin_headers
    r = await client.post(
        f"{API}/item-units", json={"code": "UN-T1", "name": "Furlong", "unit_code": "Flg"}, headers=h
    )
    assert r.status_code == 201, r.text
    unit_id = r.json()["id"]
    assert r.json()["unit_code"] == "Flg" and r.json()["status"] == "active"
    assert (
        await client.post(f"{API}/item-units", json={"code": "UN-T1", "name": "x"}, headers=h)
    ).status_code == 409
    r = await client.get(
        f"{API}/item-units", params={"filter": "unit_code:flg", "sort": "unit_code:asc"}, headers=h
    )
    assert r.status_code == 200 and r.json()["total"] == 1

    r = await client.post(f"{API}/item-categories", json={"code": "CAT-01", "name": "Comms"}, headers=h)
    assert r.status_code == 201, r.text
    cat_id = r.json()["id"]
    assert (
        await client.post(f"{API}/item-categories", json={"code": "CAT-01", "name": "dup"}, headers=h)
    ).status_code == 409
    r = await client.get(f"{API}/item-categories/options", headers=h)
    assert {"id": cat_id, "label": "CAT-01 - Comms"} in r.json()

    r = await client.post(f"{API}/brands", json={"code": "BR-X", "name": "Icom"}, headers=h)
    brand_id = r.json()["id"]
    r = await client.post(
        f"{API}/item-models", json={"code": "MD-01", "name": "IC-M330", "brand_id": brand_id}, headers=h
    )
    assert r.status_code == 201, r.text
    model_id = r.json()["id"]
    assert r.json()["brand"] == {"id": brand_id, "code": "BR-X", "name": "Icom"}
    # brand optional
    r = await client.post(f"{API}/item-models", json={"code": "MD-02", "name": "Generic"}, headers=h)
    assert r.status_code == 201 and r.json()["brand"] is None
    r = await client.get(
        f"{API}/item-models", params={"filter": "brand:icom", "sort": "brand:desc"}, headers=h
    )
    assert r.json()["total"] == 1 and r.json()["items"][0]["id"] == model_id
    r = await client.put(f"{API}/item-models/{model_id}", json={"brand_id": None}, headers=h)
    assert r.status_code == 200 and r.json()["brand"] is None
    r = await client.put(f"{API}/item-models/{model_id}", json={"brand_id": brand_id}, headers=h)
    assert r.json()["brand_id"] == brand_id

    # ---- item ----
    payload = {
        "code": "ITM-01",
        "name": "VHF Radio",
        "category_id": cat_id,
        "unit_id": unit_id,
        "brand_id": brand_id,
        "model_id": model_id,
        "oem": "Yes",
        "warranty_months": 24,
        "procurement_year": 2024,
    }
    r = await client.post(f"{API}/items", json=payload, headers=h)
    assert r.status_code == 201, r.text
    item = r.json()
    item_id = item["id"]
    assert item["category"]["name"] == "Comms" and item["unit"]["name"] == "Furlong"
    assert item["brand"]["name"] == "Icom" and item["model"]["name"] == "IC-M330"
    assert item["country_of_manufacture"] is None
    assert (await client.post(f"{API}/items", json=payload, headers=h)).status_code == 409
    assert (
        await client.post(f"{API}/items", json={"code": "ITM-02", "name": "no cat"}, headers=h)
    ).status_code == 422
    assert (
        await client.post(
            f"{API}/items", json={**payload, "code": "ITM-03", "warranty_months": -1}, headers=h
        )
    ).status_code == 422

    r = await client.get(
        f"{API}/items",
        params={"filter": ["brand:ico", "model:m330", "procurement_year:2024"], "sort": "brand:asc"},
        headers=h,
    )
    assert r.status_code == 200 and r.json()["total"] == 1
    r = await client.get(f"{API}/items", params={"filter": "oem:no"}, headers=h)
    assert r.json()["total"] == 0
    r = await client.get(f"{API}/items/options", headers=h)
    assert {"id": item_id, "label": "ITM-01 - VHF Radio"} in r.json()

    r = await client.put(
        f"{API}/items/{item_id}", json={"warranty_months": 12, "status": "inactive"}, headers=h
    )
    assert r.status_code == 200 and r.json()["warranty_months"] == 12 and r.json()["status"] == "inactive"

    # masters referenced by the item cannot be deleted (409)
    for path, oid in (
        ("item-units", unit_id),
        ("item-categories", cat_id),
        ("item-models", model_id),
        ("brands", brand_id),
    ):
        assert (await client.delete(f"{API}/{path}/{oid}", headers=h)).status_code == 409, path

    assert (await client.delete(f"{API}/items/{item_id}", headers=h)).status_code == 200
    assert (await client.get(f"{API}/items/{item_id}", headers=h)).status_code == 404
    assert (await client.delete(f"{API}/item-units/{unit_id}", headers=h)).status_code == 200
    assert (await client.delete(f"{API}/item-categories/{cat_id}", headers=h)).status_code == 200


@pytest.mark.asyncio
async def test_item_masters_require_auth(client: AsyncClient):
    for path in ("items", "item-units", "item-models", "item-categories"):
        assert (await client.get(f"{API}/{path}")).status_code == 401
