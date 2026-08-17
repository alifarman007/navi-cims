# Database Schema — CIMS (PostgreSQL 16)

Conventions: table names plural snake_case; every table has `id BIGSERIAL PK`; timestamp columns are `TIMESTAMPTZ`; audit columns `created_at, updated_at, created_by_id, updated_by_id` on business tables (mixin `AuditMixin`); enums are PostgreSQL enums created by Alembic. Business identifiers shown to users are `code` (unique, user-entered).

## Auth & security
```
users              id, user_type(enum super_admin|admin|office_user|ship_base_user), username UQ, full_name, email UQ, phone UQ,
                   hashed_password, role_id FK roles, office_id FK offices NULL, ship_base_id FK ship_bases NULL,
                   status(enum active|inactive), is_superuser bool, last_login_at, password_changed_at, avatar_url NULL, audit cols
roles              id, name UQ, description, status, is_system bool, audit cols
modules            id, code UQ (dashboard, configuration, item_management, ship_base_management, inventory_management,
                   procurement_item_info, allocation_sanction, compilation_verification, report, user_management), name, sort_order
role_permissions   id, role_id FK, module_id FK, can_menu, can_list, can_view, can_add, can_edit, can_delete  UQ(role_id,module_id)
refresh_tokens     id, user_id FK, token_hash UQ, expires_at, revoked_at NULL, user_agent, ip
password_reset_tokens id, user_id FK, token_hash UQ, expires_at (created+12h), used_at NULL
audit_logs         id, user_id FK NULL, action (create|update|delete|approve|send_back|login|...), entity, entity_id, before JSONB, after JSONB, ip, created_at
notifications      id, user_id FK, title, message, link NULL, is_read bool, created_at
```

## Master data (Configuration)
```
countries          id, name UQ, code NULL, gmt NULL, audit cols
divisions          id, name UQ, name_bn NULL, audit cols
districts          id, division_id FK, name, name_bn NULL, audit cols          UQ(division_id,name)
upazilas           id, district_id FK, name, name_bn NULL, audit cols          UQ(district_id,name)
offices            id, code UQ, name, office_type (text: HQ|Directorate|Command|Base|Depot|Other), country_id FK NULL, division_id FK NULL,
                   district_id FK NULL, address, status, audit cols
appointments       id, name UQ, status, audit cols
ranks              id, name UQ, name_bn NULL, priority int NULL, audit cols
fiscal_years       id, name UQ ("2025-2026"), start_date, end_date, is_current bool
```

## Item management
```
item_categories    id, code UQ, name, status, audit cols
item_units         id, code UQ, name, unit_code NULL, status, audit cols
brands             id, code UQ, name, status, audit cols
item_models        id, code UQ, name, brand_id FK NULL, status, audit cols
items              id, code UQ, name, category_id FK, unit_id FK NULL, brand_id FK NULL, model_id FK NULL, oem NULL,
                   warranty_months int NULL, country_of_manufacture_id FK countries NULL, country_of_origin_id FK countries NULL,
                   procurement_year int NULL, item_type NULL, local_supplier NULL, principal NULL,
                   year_of_manufacture int NULL, unit_price numeric(14,2) NULL, functional_status NULL
                   (operational|non_operational|defect|survey|obsolete), status, audit cols
```

## Ship/Base
```
ship_base_categories id, code UQ, name, audit cols
ship_bases           id, code UQ, name, type(enum ship|base), category_id FK NULL, status, audit cols
```

## Inventory
```
stores             id, code UQ, name, store_type NULL, concern NULL, address NULL, status, audit cols
stocks             id, store_id FK, item_id FK, quantity numeric(14,3), low_stock_threshold numeric(14,3) NULL, status, updated_at   UQ(store_id,item_id)
opening_stocks     id, store_id FK, item_id FK, quantity numeric(14,3), entry_date date, low_stock_threshold NULL, remarks NULL, audit cols
stock_transactions id, store_id FK, item_id FK, txn_type(enum opening|allocation_out|receipt|adjustment|transfer_in|transfer_out),
                   quantity_delta numeric(14,3), balance_after numeric(14,3), source NULL (procurement|from_ship|ex_bhatiary|manual),
                   ref_type NULL, ref_id NULL, remarks NULL, created_by_id, created_at
```

## Allocation / Verification
```
allocations        id, code UQ, allocation_type(enum allocation|sanction), fiscal_year_id FK, allocation_date date, store_id FK,
                   item_id FK, ship_base_id FK, quantity numeric(14,3), status(enum pending|approved|sent_back|cancelled),
                   remarks NULL, approved_at NULL, approved_by_id NULL, audit cols
verifications      id, code UQ, allocation_id FK, approver_id FK users, action(enum approved|sent_back), comment NULL, acted_at, audit cols
```

## Procurement (BNPIMS cache)
```
procurement_items  id, external_id UQ, grn_no, transaction_date, imc, item_name, deno, receive_quantity numeric, part_no, remarks,
                   raw JSONB, synced_at
```

## Relationships (ERD in words)
users →(role) roles ; roles ↔ modules via role_permissions ; users →(office|ship_base) ; offices → country/division/district ; districts → divisions ; upazilas → districts ; item_models → brands ; items → category, unit, brand, model, countries ; ship_bases → ship_base_categories ; stocks/opening_stocks/stock_transactions → stores & items ; allocations → fiscal_years, stores, items, ship_bases ; verifications → allocations, users.

## Seed data (`python -m app.db.seed`)
- modules (10), roles: `Super Admin` (system), `Admin`, `Office User`, `Ship/Base User` with sensible defaults; super admin user `admin` / password from `SEED_SUPERADMIN_PASSWORD` (must change on first login in prod).
- countries: Bangladesh (+ a few); divisions: the 8 BD divisions; fiscal years current−1 … current+1; item units (Nos, Meter, Kg, Litre, Set, Pair, Box); ship/base categories (Frigate, Corvette, Patrol Craft, Base, Depot); office types.
