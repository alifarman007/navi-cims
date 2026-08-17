# API Conventions — CIMS backend (FastAPI)

Base URL: `/api/v1`. OpenAPI docs at `/docs` (disabled in production via `ENV=prod`). JSON only. All timestamps ISO-8601 UTC.

## Auth
- `POST /auth/login` `{identifier, password, remember_me}` → `{access_token, refresh_token, token_type, user}`; identifier = username | email | phone.
- `POST /auth/refresh` `{refresh_token}` → new pair (rotation; old refresh revoked).
- `POST /auth/logout` (revokes refresh) · `GET /auth/me` → user + `permissions: {module_code: {menu,list,view,add,edit,delete}}` · `POST /auth/change-password`.
- `POST /auth/forgot-password {identifier}` → always 200; sends reset link `FRONTEND_URL/reset-password/<token>` valid 12 h · `POST /auth/reset-password {token, new_password}`.
- Bearer JWT (`Authorization: Bearer <access>`), HS256, `sub=user_id`, exp = `ACCESS_TOKEN_EXPIRE_MINUTES` (60).

## Authorization
`Depends(require_permission("item_management", "add"))`. Actions: `menu | list | view | add | edit | delete`. `super_admin` bypasses. 403 `{detail: "Permission denied: item_management.add"}`.

## Resource endpoints (pattern for every master/entity)
```
GET    /<res>                 list (paginated, filter, sort)          perm: list
GET    /<res>/{id}            detail                                  perm: view
POST   /<res>                 create                                  perm: add
PUT    /<res>/{id}            full update                             perm: edit
PATCH  /<res>/{id}/status     {status}                                perm: edit
DELETE /<res>/{id}            delete (409 if referenced; users → disable) perm: delete
GET    /<res>/options         [{id,label}] lightweight for selects    perm: list  (?q=&limit=)
```
Resources: `config/offices, config/appointments, config/ranks, config/countries, config/divisions, config/districts, config/upazilas, fiscal-years, users, roles, modules, items, item-units, brands, item-models, item-categories, ship-bases, ship-base-categories, stores, opening-stocks, stocks (read-only), stock-transactions (read-only), allocations, verifications, procurement-items, notifications, audit-logs`.

Workflow extras: `POST /allocations/{id}/approve`, `POST /allocations/{id}/send-back {comment}`, `POST /allocations/{id}/cancel`, `POST /allocations/{id}/resubmit`, `POST /procurement-items/sync`, `PATCH /notifications/{id}/read`, `POST /notifications/read-all`.
Reports: `GET /reports/stock-summary`, `GET /reports/allocations`, `GET /reports/low-stock` (+ `?export=xlsx` → file). Dashboard: `GET /dashboard/summary`.

## List query parameters (used by the Figma DataTable)
| param | example | meaning |
|---|---|---|
| `page` | `1` | 1-based |
| `page_size` | `10` | 10/20/30/40 (max 200) |
| `sort` | `name:asc` | `field:asc|desc`; whitelist per resource; default `id:desc` |
| `filter` (repeatable) | `filter=name:rope&filter=status:active` | per-column, case-insensitive `ILIKE %v%` for text, equality for enums/ints/bools/dates; unknown fields → 422 |
| `q` | `rope` | global search across the resource's `search_fields` |
Response:
```json
{ "items": [...], "total": 11, "page": 1, "page_size": 10, "pages": 2 }
```
Related objects are embedded read-only (e.g. item → `brand: {id, code, name}`) so the table can display names while forms use `*_id`.

## Errors
FastAPI default `{ "detail": "..." }`; validation `422` with field errors; uniqueness `409 {"detail": "Brand code already exists"}`; FK-in-use on delete `409 {"detail": "Cannot delete: referenced by 3 items"}`.

## Audit
Services call `audit.log(db, user, action, entity, entity_id, before, after)` on every mutation; middleware attaches client IP.

## Endpoint catalogue (generated from OpenAPI, 2026-08-17)

| Method | Path | Tag |
|---|---|---|
| GET | `/api/v1/allocations` | allocation-sanction |
| POST | `/api/v1/allocations` | allocation-sanction |
| GET | `/api/v1/allocations/options` | allocation-sanction |
| DELETE | `/api/v1/allocations/{item_id}` | allocation-sanction |
| GET | `/api/v1/allocations/{item_id}` | allocation-sanction |
| PUT | `/api/v1/allocations/{item_id}` | allocation-sanction |
| POST | `/api/v1/allocations/{item_id}/approve` | allocation-sanction |
| POST | `/api/v1/allocations/{item_id}/cancel` | allocation-sanction |
| POST | `/api/v1/allocations/{item_id}/resubmit` | allocation-sanction |
| POST | `/api/v1/allocations/{item_id}/send-back` | allocation-sanction |
| GET | `/api/v1/audit-logs` | audit-logs |
| POST | `/api/v1/auth/change-password` | auth |
| POST | `/api/v1/auth/forgot-password` | auth |
| POST | `/api/v1/auth/login` | auth |
| POST | `/api/v1/auth/logout` | auth |
| GET | `/api/v1/auth/me` | auth |
| POST | `/api/v1/auth/refresh` | auth |
| POST | `/api/v1/auth/reset-password` | auth |
| GET | `/api/v1/brands` | item-management |
| POST | `/api/v1/brands` | item-management |
| GET | `/api/v1/brands/options` | item-management |
| DELETE | `/api/v1/brands/{item_id}` | item-management |
| GET | `/api/v1/brands/{item_id}` | item-management |
| PUT | `/api/v1/brands/{item_id}` | item-management |
| PATCH | `/api/v1/brands/{item_id}/status` | item-management |
| GET | `/api/v1/config/appointments` | configuration |
| POST | `/api/v1/config/appointments` | configuration |
| GET | `/api/v1/config/appointments/options` | configuration |
| DELETE | `/api/v1/config/appointments/{item_id}` | configuration |
| GET | `/api/v1/config/appointments/{item_id}` | configuration |
| PUT | `/api/v1/config/appointments/{item_id}` | configuration |
| PATCH | `/api/v1/config/appointments/{item_id}/status` | configuration |
| GET | `/api/v1/config/countries` | configuration |
| POST | `/api/v1/config/countries` | configuration |
| GET | `/api/v1/config/countries/options` | configuration |
| DELETE | `/api/v1/config/countries/{item_id}` | configuration |
| GET | `/api/v1/config/countries/{item_id}` | configuration |
| PUT | `/api/v1/config/countries/{item_id}` | configuration |
| GET | `/api/v1/config/districts` | configuration |
| POST | `/api/v1/config/districts` | configuration |
| GET | `/api/v1/config/districts/options` | configuration |
| DELETE | `/api/v1/config/districts/{item_id}` | configuration |
| GET | `/api/v1/config/districts/{item_id}` | configuration |
| PUT | `/api/v1/config/districts/{item_id}` | configuration |
| GET | `/api/v1/config/divisions` | configuration |
| POST | `/api/v1/config/divisions` | configuration |
| GET | `/api/v1/config/divisions/options` | configuration |
| DELETE | `/api/v1/config/divisions/{item_id}` | configuration |
| GET | `/api/v1/config/divisions/{item_id}` | configuration |
| PUT | `/api/v1/config/divisions/{item_id}` | configuration |
| GET | `/api/v1/config/office-types` | configuration |
| GET | `/api/v1/config/offices` | configuration |
| POST | `/api/v1/config/offices` | configuration |
| GET | `/api/v1/config/offices/options` | configuration |
| DELETE | `/api/v1/config/offices/{item_id}` | configuration |
| GET | `/api/v1/config/offices/{item_id}` | configuration |
| PUT | `/api/v1/config/offices/{item_id}` | configuration |
| PATCH | `/api/v1/config/offices/{item_id}/status` | configuration |
| GET | `/api/v1/config/ranks` | configuration |
| POST | `/api/v1/config/ranks` | configuration |
| GET | `/api/v1/config/ranks/options` | configuration |
| DELETE | `/api/v1/config/ranks/{item_id}` | configuration |
| GET | `/api/v1/config/ranks/{item_id}` | configuration |
| PUT | `/api/v1/config/ranks/{item_id}` | configuration |
| GET | `/api/v1/config/upazilas` | configuration |
| POST | `/api/v1/config/upazilas` | configuration |
| GET | `/api/v1/config/upazilas/options` | configuration |
| DELETE | `/api/v1/config/upazilas/{item_id}` | configuration |
| GET | `/api/v1/config/upazilas/{item_id}` | configuration |
| PUT | `/api/v1/config/upazilas/{item_id}` | configuration |
| GET | `/api/v1/dashboard/summary` | dashboard |
| GET | `/api/v1/fiscal-years` | configuration |
| GET | `/api/v1/fiscal-years/current` | configuration |
| GET | `/api/v1/fiscal-years/options` | configuration |
| GET | `/api/v1/fiscal-years/{fy_id}` | configuration |
| GET | `/api/v1/item-categories` | item-management |
| POST | `/api/v1/item-categories` | item-management |
| GET | `/api/v1/item-categories/options` | item-management |
| DELETE | `/api/v1/item-categories/{item_id}` | item-management |
| GET | `/api/v1/item-categories/{item_id}` | item-management |
| PUT | `/api/v1/item-categories/{item_id}` | item-management |
| PATCH | `/api/v1/item-categories/{item_id}/status` | item-management |
| GET | `/api/v1/item-models` | item-management |
| POST | `/api/v1/item-models` | item-management |
| GET | `/api/v1/item-models/options` | item-management |
| DELETE | `/api/v1/item-models/{item_id}` | item-management |
| GET | `/api/v1/item-models/{item_id}` | item-management |
| PUT | `/api/v1/item-models/{item_id}` | item-management |
| PATCH | `/api/v1/item-models/{item_id}/status` | item-management |
| GET | `/api/v1/item-units` | item-management |
| POST | `/api/v1/item-units` | item-management |
| GET | `/api/v1/item-units/options` | item-management |
| DELETE | `/api/v1/item-units/{item_id}` | item-management |
| GET | `/api/v1/item-units/{item_id}` | item-management |
| PUT | `/api/v1/item-units/{item_id}` | item-management |
| PATCH | `/api/v1/item-units/{item_id}/status` | item-management |
| GET | `/api/v1/items` | item-management |
| POST | `/api/v1/items` | item-management |
| GET | `/api/v1/items/options` | item-management |
| DELETE | `/api/v1/items/{item_id}` | item-management |
| GET | `/api/v1/items/{item_id}` | item-management |
| PUT | `/api/v1/items/{item_id}` | item-management |
| PATCH | `/api/v1/items/{item_id}/status` | item-management |
| GET | `/api/v1/modules` | user-management |
| GET | `/api/v1/notifications` | notifications |
| POST | `/api/v1/notifications/read-all` | notifications |
| GET | `/api/v1/notifications/unread-count` | notifications |
| PATCH | `/api/v1/notifications/{notification_id}/read` | notifications |
| GET | `/api/v1/opening-stocks` | inventory-management |
| POST | `/api/v1/opening-stocks` | inventory-management |
| GET | `/api/v1/opening-stocks/options` | inventory-management |
| DELETE | `/api/v1/opening-stocks/{item_id}` | inventory-management |
| GET | `/api/v1/opening-stocks/{item_id}` | inventory-management |
| PUT | `/api/v1/opening-stocks/{item_id}` | inventory-management |
| GET | `/api/v1/procurement-items` | procurement-item-info |
| GET | `/api/v1/procurement-items/options` | procurement-item-info |
| POST | `/api/v1/procurement-items/sync` | procurement-item-info |
| GET | `/api/v1/procurement-items/{item_id}` | procurement-item-info |
| GET | `/api/v1/reports/allocations` | report |
| GET | `/api/v1/reports/low-stock` | report |
| GET | `/api/v1/reports/stock-summary` | report |
| GET | `/api/v1/roles` | user-management |
| POST | `/api/v1/roles` | user-management |
| GET | `/api/v1/roles/options` | user-management |
| DELETE | `/api/v1/roles/{item_id}` | user-management |
| GET | `/api/v1/roles/{item_id}` | user-management |
| PUT | `/api/v1/roles/{item_id}` | user-management |
| PATCH | `/api/v1/roles/{item_id}/status` | user-management |
| PUT | `/api/v1/roles/{role_id}/permissions` | user-management |
| GET | `/api/v1/ship-base-categories` | ship-base-management |
| POST | `/api/v1/ship-base-categories` | ship-base-management |
| GET | `/api/v1/ship-base-categories/options` | ship-base-management |
| DELETE | `/api/v1/ship-base-categories/{item_id}` | ship-base-management |
| GET | `/api/v1/ship-base-categories/{item_id}` | ship-base-management |
| PUT | `/api/v1/ship-base-categories/{item_id}` | ship-base-management |
| GET | `/api/v1/ship-bases` | ship-base-management |
| POST | `/api/v1/ship-bases` | ship-base-management |
| GET | `/api/v1/ship-bases/options` | ship-base-management |
| DELETE | `/api/v1/ship-bases/{item_id}` | ship-base-management |
| GET | `/api/v1/ship-bases/{item_id}` | ship-base-management |
| PUT | `/api/v1/ship-bases/{item_id}` | ship-base-management |
| PATCH | `/api/v1/ship-bases/{item_id}/status` | ship-base-management |
| GET | `/api/v1/stock-transactions` | inventory-management |
| GET | `/api/v1/stock-transactions/{txn_id}` | inventory-management |
| GET | `/api/v1/stocks` | inventory-management |
| GET | `/api/v1/stocks/summary` | inventory-management |
| GET | `/api/v1/stocks/{stock_id}` | inventory-management |
| GET | `/api/v1/stores` | inventory-management |
| POST | `/api/v1/stores` | inventory-management |
| GET | `/api/v1/stores/options` | inventory-management |
| DELETE | `/api/v1/stores/{item_id}` | inventory-management |
| GET | `/api/v1/stores/{item_id}` | inventory-management |
| PUT | `/api/v1/stores/{item_id}` | inventory-management |
| PATCH | `/api/v1/stores/{item_id}/status` | inventory-management |
| GET | `/api/v1/users` | user-management |
| POST | `/api/v1/users` | user-management |
| GET | `/api/v1/users/options` | user-management |
| DELETE | `/api/v1/users/{item_id}` | user-management |
| GET | `/api/v1/users/{item_id}` | user-management |
| PUT | `/api/v1/users/{item_id}` | user-management |
| PATCH | `/api/v1/users/{item_id}/status` | user-management |
| POST | `/api/v1/users/{user_id}/reset-password` | user-management |
| GET | `/api/v1/verifications` | compilation-verification |
| POST | `/api/v1/verifications` | compilation-verification |
| GET | `/api/v1/verifications/options` | compilation-verification |
| DELETE | `/api/v1/verifications/{item_id}` | compilation-verification |
| GET | `/api/v1/verifications/{item_id}` | compilation-verification |
| PUT | `/api/v1/verifications/{item_id}` | compilation-verification |
| GET | `/health` | meta |
