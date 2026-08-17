"""Configuration module tests: 7 masters under /config/* + read-only /fiscal-years."""

import pytest
from httpx import AsyncClient

API = "/api/v1"


@pytest.mark.asyncio
async def test_unauthenticated(client: AsyncClient):
    assert (await client.get(f"{API}/config/countries")).status_code == 401
    assert (await client.get(f"{API}/fiscal-years")).status_code == 401


@pytest.mark.asyncio
async def test_country_crud(client: AsyncClient, admin_headers):
    h = admin_headers
    r = await client.get(f"{API}/config/countries", headers=h)
    assert r.status_code == 200 and r.json()["total"] >= 1  # seeded

    r = await client.post(
        f"{API}/config/countries", json={"name": "Testland", "code": "TL", "gmt": "+6"}, headers=h
    )
    assert r.status_code == 201, r.text
    cid = r.json()["id"]
    assert r.json()["gmt"] == "+6"
    # unique name -> 409 ; empty name -> 422
    assert (
        await client.post(f"{API}/config/countries", json={"name": "Testland"}, headers=h)
    ).status_code == 409
    assert (await client.post(f"{API}/config/countries", json={"name": ""}, headers=h)).status_code == 422

    r = await client.get(
        f"{API}/config/countries", params={"filter": "name:testl", "sort": "code:desc"}, headers=h
    )
    assert r.json()["total"] == 1 and r.json()["items"][0]["id"] == cid
    r = await client.get(f"{API}/config/countries/options", params={"q": "testl"}, headers=h)
    assert r.json() == [{"id": cid, "label": "Testland"}]

    r = await client.put(f"{API}/config/countries/{cid}", json={"gmt": "+7"}, headers=h)
    assert r.status_code == 200 and r.json()["gmt"] == "+7" and r.json()["name"] == "Testland"
    # no status endpoint on country
    assert (
        await client.patch(f"{API}/config/countries/{cid}/status", json={"status": "inactive"}, headers=h)
    ).status_code == 404

    # referenced by an office -> 409, then delete ok
    r = await client.post(
        f"{API}/config/offices",
        json={"code": "OF-C", "name": "Ref", "office_type": "HQ", "country_id": cid},
        headers=h,
    )
    assert r.status_code == 201, r.text
    assert (await client.delete(f"{API}/config/countries/{cid}", headers=h)).status_code == 409
    assert (await client.delete(f"{API}/config/offices/{r.json()['id']}", headers=h)).status_code == 200
    assert (await client.delete(f"{API}/config/countries/{cid}", headers=h)).status_code == 200
    assert (await client.get(f"{API}/config/countries/{cid}", headers=h)).status_code == 404


@pytest.mark.asyncio
async def test_division_district_upazila_hierarchy(client: AsyncClient, admin_headers):
    h = admin_headers
    r = await client.get(f"{API}/config/divisions", params={"page_size": 50}, headers=h)
    assert r.status_code == 200 and r.json()["total"] == 8  # seeded BD divisions
    dhaka = next(d for d in r.json()["items"] if d["name"] == "Dhaka")
    ctg = next(d for d in r.json()["items"] if d["name"] == "Chattogram")

    r = await client.post(f"{API}/config/divisions", json={"name": "New Div", "name_bn": "নতুন"}, headers=h)
    assert r.status_code == 201
    new_div = r.json()["id"]
    assert (
        await client.post(f"{API}/config/divisions", json={"name": "Dhaka"}, headers=h)
    ).status_code == 409

    # districts
    r = await client.post(
        f"{API}/config/districts",
        json={"division_id": dhaka["id"], "name": "Gazipur", "name_bn": "গাজীপুর"},
        headers=h,
    )
    assert r.status_code == 201, r.text
    gz = r.json()
    assert gz["division"]["name"] == "Dhaka"
    # same name in another division allowed; same division -> 409
    r = await client.post(
        f"{API}/config/districts", json={"division_id": ctg["id"], "name": "Gazipur"}, headers=h
    )
    assert r.status_code == 201
    gz2 = r.json()["id"]
    assert (
        await client.post(
            f"{API}/config/districts", json={"division_id": dhaka["id"], "name": "Gazipur"}, headers=h
        )
    ).status_code == 409
    # missing division -> 422
    assert (await client.post(f"{API}/config/districts", json={"name": "X"}, headers=h)).status_code == 422
    # filter/sort by joined division name
    r = await client.get(
        f"{API}/config/districts", params={"filter": "division:chatto", "sort": "division:asc"}, headers=h
    )
    assert r.status_code == 200 and r.json()["total"] == 1 and r.json()["items"][0]["id"] == gz2
    # options with division filter
    r = await client.get(f"{API}/config/districts/options", params={"division_id": dhaka["id"]}, headers=h)
    assert r.json() == [{"id": gz["id"], "label": "Gazipur"}]
    r = await client.get(f"{API}/config/districts/options", headers=h)
    assert len(r.json()) == 2

    # moving gz2 into dhaka -> conflicts with gz
    assert (
        await client.put(f"{API}/config/districts/{gz2}", json={"division_id": dhaka["id"]}, headers=h)
    ).status_code == 409
    r = await client.put(f"{API}/config/districts/{gz2}", json={"name": "Gazipur South"}, headers=h)
    assert r.status_code == 200 and r.json()["name"] == "Gazipur South"

    # upazilas
    r = await client.post(
        f"{API}/config/upazilas",
        json={"district_id": gz["id"], "name": "Sreepur", "name_bn": "শ্রীপুর"},
        headers=h,
    )
    assert r.status_code == 201, r.text
    up = r.json()
    assert up["district"]["name"] == "Gazipur" and up["district"]["division"]["name"] == "Dhaka"
    assert (
        await client.post(
            f"{API}/config/upazilas", json={"district_id": gz["id"], "name": "Sreepur"}, headers=h
        )
    ).status_code == 409
    r = await client.get(
        f"{API}/config/upazilas", params={"filter": "district:gazi", "sort": "district:desc"}, headers=h
    )
    assert r.json()["total"] == 1
    r = await client.get(f"{API}/config/upazilas/options", params={"district_id": gz2}, headers=h)
    assert r.json() == []
    r = await client.get(f"{API}/config/upazilas/options", params={"district_id": gz["id"]}, headers=h)
    assert r.json() == [{"id": up["id"], "label": "Sreepur"}]

    # referenced deletes blocked
    assert (await client.delete(f"{API}/config/divisions/{dhaka['id']}", headers=h)).status_code == 409
    assert (await client.delete(f"{API}/config/districts/{gz['id']}", headers=h)).status_code == 409
    assert (await client.delete(f"{API}/config/upazilas/{up['id']}", headers=h)).status_code == 200
    assert (await client.delete(f"{API}/config/districts/{gz['id']}", headers=h)).status_code == 200
    assert (await client.delete(f"{API}/config/districts/{gz2}", headers=h)).status_code == 200
    assert (await client.delete(f"{API}/config/divisions/{new_div}", headers=h)).status_code == 200


@pytest.mark.asyncio
async def test_office_crud(client: AsyncClient, admin_headers):
    h = admin_headers
    divs = (await client.get(f"{API}/config/divisions/options", headers=h)).json()
    dhaka = next(d for d in divs if d["label"] == "Dhaka")
    ctry = (await client.get(f"{API}/config/countries/options", params={"q": "bangla"}, headers=h)).json()[0]
    dist = (
        await client.post(
            f"{API}/config/districts", json={"division_id": dhaka["id"], "name": "Dhaka"}, headers=h
        )
    ).json()

    payload = {
        "code": "NHQ",
        "name": "Naval Headquarters",
        "office_type": "HQ",
        "country_id": ctry["id"],
        "division_id": dhaka["id"],
        "district_id": dist["id"],
        "address": "Banani, Dhaka",
    }
    r = await client.post(f"{API}/config/offices", json=payload, headers=h)
    assert r.status_code == 201, r.text
    off = r.json()
    assert off["status"] == "active" and off["country"]["name"] == "Bangladesh"
    assert off["division"]["name"] == "Dhaka" and off["district"]["name"] == "Dhaka"
    assert (await client.post(f"{API}/config/offices", json=payload, headers=h)).status_code == 409
    bad = dict(payload, code="X", office_type="Palace")
    assert (await client.post(f"{API}/config/offices", json=bad, headers=h)).status_code == 422
    assert (
        await client.post(f"{API}/config/offices", json={"code": "Y", "name": "n"}, headers=h)
    ).status_code == 422

    await client.post(
        f"{API}/config/offices",
        json={"code": "DEP1", "name": "Depot One", "office_type": "Depot", "status": "inactive"},
        headers=h,
    )
    r = await client.get(
        f"{API}/config/offices", params={"filter": ["country:bangla"], "sort": "district:asc"}, headers=h
    )
    assert r.json()["total"] == 1
    r = await client.get(
        f"{API}/config/offices", params={"filter": ["office_type:depot", "status:inactive"]}, headers=h
    )
    assert r.json()["total"] == 1
    r = await client.get(f"{API}/config/offices/options", headers=h)
    assert [o["label"] for o in r.json()] == ["NHQ - Naval Headquarters"]  # inactive excluded

    r = await client.patch(f"{API}/config/offices/{off['id']}/status", json={"status": "inactive"}, headers=h)
    assert r.status_code == 200 and r.json()["status"] == "inactive"
    r = await client.put(
        f"{API}/config/offices/{off['id']}", json={"district_id": None, "status": "active"}, headers=h
    )
    assert r.status_code == 200 and r.json()["district"] is None and r.json()["status"] == "active"
    r = await client.get(f"{API}/config/office-types", headers=h)
    assert r.json()[0] == "HQ" and "Other" in r.json()
    assert (await client.delete(f"{API}/config/offices/{off['id']}", headers=h)).status_code == 200


@pytest.mark.asyncio
async def test_appointment_and_rank(client: AsyncClient, admin_headers):
    h = admin_headers
    r = await client.post(f"{API}/config/appointments", json={"name": "Chief of Naval Staff"}, headers=h)
    assert r.status_code == 201 and r.json()["status"] == "active"
    aid = r.json()["id"]
    assert (
        await client.post(f"{API}/config/appointments", json={"name": "Chief of Naval Staff"}, headers=h)
    ).status_code == 409
    r = await client.patch(f"{API}/config/appointments/{aid}/status", json={"status": "inactive"}, headers=h)
    assert r.json()["status"] == "inactive"
    r = await client.get(f"{API}/config/appointments", params={"filter": "status:inactive"}, headers=h)
    assert r.json()["total"] == 1
    assert (await client.delete(f"{API}/config/appointments/{aid}", headers=h)).status_code == 200

    for name, pr in (("Admiral", 1), ("Captain", 5), ("Lieutenant", 9)):
        r = await client.post(
            f"{API}/config/ranks", json={"name": name, "name_bn": name + " bn", "priority": pr}, headers=h
        )
        assert r.status_code == 201, r.text
    assert (await client.post(f"{API}/config/ranks", json={"name": "Admiral"}, headers=h)).status_code == 409
    assert (
        await client.post(f"{API}/config/ranks", json={"name": "Z", "priority": -1}, headers=h)
    ).status_code == 422
    r = await client.get(f"{API}/config/ranks", headers=h)  # default sort priority asc
    assert [i["name"] for i in r.json()["items"]] == ["Admiral", "Captain", "Lieutenant"]
    r = await client.get(
        f"{API}/config/ranks", params={"sort": "priority:desc", "filter": "priority:5"}, headers=h
    )
    assert r.json()["total"] == 1 and r.json()["items"][0]["name"] == "Captain"
    rid = r.json()["items"][0]["id"]
    r = await client.put(f"{API}/config/ranks/{rid}", json={"priority": 2}, headers=h)
    assert r.json()["priority"] == 2
    assert (
        await client.patch(f"{API}/config/ranks/{rid}/status", json={"status": "inactive"}, headers=h)
    ).status_code == 404
    assert (await client.delete(f"{API}/config/ranks/{rid}", headers=h)).status_code == 200


@pytest.mark.asyncio
async def test_fiscal_years_read_only(client: AsyncClient, admin_headers):
    h = admin_headers
    r = await client.get(f"{API}/fiscal-years", headers=h)
    assert r.status_code == 200
    j = r.json()
    assert j["total"] == 5 and j["items"][0]["start_date"] > j["items"][-1]["start_date"]  # start_date desc
    r = await client.get(f"{API}/fiscal-years", params={"sort": "start_date:asc"}, headers=h)
    assert r.json()["items"][0]["start_date"] < r.json()["items"][-1]["start_date"]
    r = await client.get(f"{API}/fiscal-years/current", headers=h)
    assert r.status_code == 200 and r.json()["is_current"] is True
    cur = r.json()
    r = await client.get(f"{API}/fiscal-years/options", headers=h)
    assert r.json()[0] == {"id": cur["id"], "label": cur["name"]} and len(r.json()) == 5
    assert (await client.get(f"{API}/fiscal-years/{cur['id']}", headers=h)).json()["name"] == cur["name"]
    assert (await client.get(f"{API}/fiscal-years/999999", headers=h)).status_code == 404
    # read-only
    assert (await client.post(f"{API}/fiscal-years", json={"name": "x"}, headers=h)).status_code == 405


@pytest.mark.asyncio
async def test_audit_log_written(client: AsyncClient, admin_headers, db_session):
    from sqlalchemy import select

    from app.models.misc import AuditLog

    r = await client.post(
        f"{API}/config/ranks", json={"name": "Commodore", "priority": 3}, headers=admin_headers
    )
    assert r.status_code == 201
    rows = (await db_session.execute(select(AuditLog).where(AuditLog.entity == "ranks"))).scalars().all()
    assert len(rows) == 1 and rows[0].action == "create" and rows[0].after["name"] == "Commodore"
