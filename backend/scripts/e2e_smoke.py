"""End-to-end business-flow smoke test against a LIVE API (creates demo rows with a random suffix).

Usage: python scripts/e2e_smoke.py     Env: CIMS_API=http://localhost:8000/api/v1  CIMS_USER  CIMS_PASS
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import httpx, random, string

import os
B = os.environ.get("CIMS_API", "http://localhost:8000/api/v1")
c = httpx.Client(timeout=30)
sfx = "".join(random.choices(string.ascii_uppercase, k=4))
fails = []


def check(label, r, ok=(200, 201), show=True):
    good = r.status_code in ok
    body = r.text[:180].replace("\n", " ")
    print(("OK  " if good else "FAIL") + f" {label:<52} {r.status_code} {body if (show or not good) else ''}")
    if not good:
        fails.append(label)
    return r


r = check("login admin", c.post(f"{B}/auth/login", json={"identifier": os.environ.get("CIMS_USER", "admin"), "password": os.environ.get("CIMS_PASS", "Admin@12345")}), show=False)
H = {"Authorization": f"Bearer {r.json()['access_token']}"}

# masters
fy = check("fiscal year current", c.get(f"{B}/fiscal-years/current", headers=H)).json()
country = check("countries options", c.get(f"{B}/config/countries/options", headers=H), show=False).json()[0]
div = check("create division", c.post(f"{B}/config/divisions", json={"name": f"Div {sfx}", "name_bn": "বিভাগ"}, headers=H), show=False).json()
dist = check("create district", c.post(f"{B}/config/districts", json={"division_id": div["id"], "name": f"Dist {sfx}"}, headers=H), show=False).json()
check("districts options by division", c.get(f"{B}/config/districts/options", params={"division_id": div["id"]}, headers=H))
upz = check("create upazila", c.post(f"{B}/config/upazilas", json={"district_id": dist["id"], "name": f"Upz {sfx}"}, headers=H), show=False).json()
office = check("create office", c.post(f"{B}/config/offices", json={"code": f"OF-{sfx}", "name": f"Directorate {sfx}", "office_type": "Directorate", "country_id": country["id"], "division_id": div["id"], "district_id": dist["id"], "address": "NHQ"}, headers=H), show=False).json()
check("create appointment", c.post(f"{B}/config/appointments", json={"name": f"Appt {sfx}"}, headers=H), show=False)
check("create rank", c.post(f"{B}/config/ranks", json={"name": f"Rank {sfx}", "priority": 5}, headers=H), show=False)

cat = check("create item category", c.post(f"{B}/item-categories", json={"code": f"CAT-{sfx}", "name": "Comm Equipment"}, headers=H), show=False).json()
unit = c.get(f"{B}/item-units/options", headers=H).json()[0]
brand = check("create brand", c.post(f"{B}/brands", json={"code": f"BR-{sfx}", "name": "Icom"}, headers=H), show=False).json()
item = check("create item", c.post(f"{B}/items", json={"code": f"ITM-{sfx}", "name": f"VHF Radio {sfx}", "category_id": cat["id"], "unit_id": unit["id"], "brand_id": brand["id"], "warranty_months": 24, "country_of_origin_id": country["id"], "procurement_year": 2025}, headers=H), show=False).json()
sbc = c.get(f"{B}/ship-base-categories/options", headers=H).json()[0]
ship = check("create ship", c.post(f"{B}/ship-bases", json={"code": f"BNS-{sfx}", "name": f"BNS Test {sfx}", "type": "ship", "category_id": sbc["id"]}, headers=H), show=False).json()
store = check("create store", c.post(f"{B}/stores", json={"code": f"ST-{sfx}", "name": f"Central Store {sfx}", "store_type": "Central", "concern": "NSD CTG"}, headers=H), show=False).json()

# stock
check("opening stock 100", c.post(f"{B}/opening-stocks", json={"store_id": store["id"], "item_id": item["id"], "quantity": 100, "entry_date": "2026-08-01", "low_stock_threshold": 20}, headers=H), show=False)
summ = check("stock summary", c.get(f"{B}/stocks/summary", params={"store_id": store["id"], "item_id": item["id"]}, headers=H)).json()
assert float(summ["quantity"]) == 100, summ

# allocation workflow
alloc = check("create allocation 30", c.post(f"{B}/allocations", json={"code": f"AL-{sfx}-1", "allocation_type": "allocation", "fiscal_year_id": fy["id"], "allocation_date": "2026-08-17", "store_id": store["id"], "item_id": item["id"], "ship_base_id": ship["id"], "quantity": 30}, headers=H), show=False).json()
check("allocation options pending", c.get(f"{B}/allocations/options", params={"status": "pending"}, headers=H), show=False)
big = check("create allocation 500 (too much)", c.post(f"{B}/allocations", json={"code": f"AL-{sfx}-2", "allocation_type": "sanction", "fiscal_year_id": fy["id"], "allocation_date": "2026-08-17", "store_id": store["id"], "item_id": item["id"], "ship_base_id": ship["id"], "quantity": 500}, headers=H), show=False).json()
check("approve 500 -> 409 insufficient", c.post(f"{B}/allocations/{big['id']}/approve", headers=H), ok=(409,))
check("send back 500 (needs comment)", c.post(f"{B}/allocations/{big['id']}/send-back", json={"comment": "Reduce quantity, only 100 in stock"}, headers=H))
check("resubmit -> pending", c.post(f"{B}/allocations/{big['id']}/resubmit", headers=H))
check("cancel 500", c.post(f"{B}/allocations/{big['id']}/cancel", headers=H))
check("approve 30", c.post(f"{B}/allocations/{alloc['id']}/approve", headers=H), show=False)
summ = check("stock summary after approve", c.get(f"{B}/stocks/summary", params={"store_id": store["id"], "item_id": item["id"]}, headers=H)).json()
assert float(summ["quantity"]) == 70, summ
check("edit approved allocation -> 409", c.put(f"{B}/allocations/{alloc['id']}", json={"quantity": 10}, headers=H), ok=(409,))
r = check("verifications list", c.get(f"{B}/verifications", headers=H), show=False)
print("     verifications:", [(v["code"], v["action"]) for v in r.json()["items"][:5]])
alloc3 = check("create allocation 10 via verification", c.post(f"{B}/allocations", json={"code": f"AL-{sfx}-3", "allocation_type": "allocation", "fiscal_year_id": fy["id"], "allocation_date": "2026-08-17", "store_id": store["id"], "item_id": item["id"], "ship_base_id": ship["id"], "quantity": 10}, headers=H), show=False).json()
check("POST /verifications approve", c.post(f"{B}/verifications", json={"allocation_id": alloc3["id"], "comment": "ok"}, headers=H), show=False)
check("ledger", c.get(f"{B}/stock-transactions", params={"filter": f"item_id:{item['id']}"}, headers=H), show=False)

# notifications / audit / reports / dashboard / procurement
check("notifications", c.get(f"{B}/notifications", headers=H), show=False)
check("notifications unread-count", c.get(f"{B}/notifications/unread-count", headers=H))
check("audit logs", c.get(f"{B}/audit-logs", params={"page_size": 3}, headers=H), show=False)
check("report stock-summary", c.get(f"{B}/reports/stock-summary", params={"store_id": store["id"]}, headers=H), show=False)
check("report allocations", c.get(f"{B}/reports/allocations", params={"ship_base_id": ship["id"]}, headers=H), show=False)
check("report low-stock", c.get(f"{B}/reports/low-stock", headers=H), show=False)
r = check("report xlsx export", c.get(f"{B}/reports/allocations", params={"export": "xlsx"}, headers=H), show=False)
print("     xlsx content-type:", r.headers.get("content-type"), "bytes:", len(r.content))
d = check("dashboard summary", c.get(f"{B}/dashboard/summary", headers=H), show=False).json()
print("     dashboard keys:", sorted(d.keys()))
print("     counts:", d.get("counts"))
check("procurement sync (mock)", c.post(f"{B}/procurement-items/sync", headers=H))
check("procurement list", c.get(f"{B}/procurement-items", params={"page_size": 2}, headers=H), show=False)

# users / roles / permissions
mods = check("modules", c.get(f"{B}/modules", headers=H), show=False).json()
role = check("create limited role", c.post(f"{B}/roles", json={"name": f"Store Keeper {sfx}", "permissions": [
    {"module_code": "dashboard", "menu": True, "list": True, "view": True, "add": False, "edit": False, "delete": False},
    {"module_code": "inventory_management", "menu": True, "list": True, "view": True, "add": True, "edit": False, "delete": False},
]}, headers=H), show=False).json()
usr = check("create ship/base user", c.post(f"{B}/users", json={"user_type": "ship_base_user", "username": f"sk{sfx.lower()}", "full_name": f"Store Keeper {sfx}", "email": f"sk{sfx.lower()}@cims.local", "phone": f"018{random.randint(10000000, 99999999)}", "password": "Keeper@123", "role_id": role["id"], "ship_base_id": ship["id"]}, headers=H), show=False).json()
r = check("login as new user", c.post(f"{B}/auth/login", json={"identifier": usr["username"], "password": "Keeper@123"}), show=False)
H2 = {"Authorization": f"Bearer {r.json()['access_token']}"}
print("     perms:", {k: v for k, v in r.json()["user"]["permissions"].items()})
check("limited: list stores OK", c.get(f"{B}/stores", headers=H2), show=False)
check("limited: delete store -> 403", c.delete(f"{B}/stores/{store['id']}", headers=H2), ok=(403,))
check("limited: list users -> 403", c.get(f"{B}/users", headers=H2), ok=(403,))
check("limited: audit-logs -> 403", c.get(f"{B}/audit-logs", headers=H2), ok=(403,))
check("disable user (soft delete)", c.delete(f"{B}/users/{usr['id']}", headers=H))
check("disabled user login -> 403", c.post(f"{B}/auth/login", json={"identifier": usr["username"], "password": "Keeper@123"}), ok=(403,))
check("disable super admin -> 4xx", c.delete(f"{B}/users/1", headers=H), ok=(403, 409))
check("delete role in use -> 409", c.delete(f"{B}/roles/{role['id']}", headers=H), ok=(409,))
check("delete store with stock -> 409", c.delete(f"{B}/stores/{store['id']}", headers=H), ok=(409,))

print("\nFAILURES:", fails if fails else "none")
