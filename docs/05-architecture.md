# Architecture — CIMS

```
 ┌───────────────┐   HTTPS/JSON    ┌────────────────────┐   asyncpg   ┌────────────────┐
 │ React SPA     │ ──────────────▶ │ FastAPI (uvicorn)  │ ──────────▶ │ PostgreSQL 16  │
 │ Vite build →  │ ◀────────────── │ /api/v1            │             └────────────────┘
 │ static build  │                 │ services / models  │   httpx     ┌────────────────┐
 └───────────────┘                 │ integrations/bnpims│ ──────────▶ │ BNPIMS API     │
                                   └────────────────────┘             └────────────────┘
                                          │ SMTP (aiosmtplib) → password reset mails
```
Deployment target (DSIG): existing BN Server (Linux), intranet/internet mix. **No containers** (client decision): PostgreSQL as an OS service, the API under `uvicorn` (systemd unit, optionally behind nginx), the SPA as a static `vite build` served by nginx (or by the API via a static mount). Development runs the same three processes natively on Windows/Linux.

## Backend (FastAPI, async)
- `app/main.py` — app factory: CORS (from `CORS_ORIGINS`), routers under `/api/v1`, exception handlers, request-id + client-IP middleware, lifespan (engine dispose).
- `app/core/config.py` — `Settings(BaseSettings)` reading `.env` (`DATABASE_URL`, `SECRET_KEY`, token TTLs, `CORS_ORIGINS`, `FRONTEND_URL`, SMTP_*, `BNPIMS_BASE_URL/API_KEY`, `SEED_SUPERADMIN_*`).
- `app/core/security.py` — bcrypt hashing, JWT create/decode, secure token generation.
- `app/core/deps.py` — `get_db` (AsyncSession per request), `get_current_user`, `require_permission(module, action)`, `get_client_ip`.
- `app/db/base.py` — `Base`, `TimestampMixin`, `AuditMixin`; `app/db/session.py` — async engine + sessionmaker; `app/db/seed.py`.
- `app/models/*` — SQLAlchemy 2.0 typed models (see `06-database-schema.md`).
- `app/schemas/*` — Pydantic v2 (`*Create`, `*Update`, `*Read`, `*Option`), `common.py` (`Page[T]`, `StatusEnum`, `IdLabel`).
- `app/services/crud_base.py` — generic `CRUDService[Model, CreateSchema, UpdateSchema]`: `list(page, page_size, sort, filters, q)`, `get`, `create`, `update`, `delete`, `options`, with `filterable`, `sortable`, `search_fields`, `unique_fields`, `relations` (selectinload). Domain services extend it (e.g. `AllocationService.approve`).
- `app/api/v1/endpoints/*` — thin routers; `router.py` includes them all. A helper `make_crud_router(service, schemas, prefix, module_code)` generates the standard 6 endpoints for masters so each master is ~15 lines.
- `app/utils/query.py` — parse `sort`/`filter` into SQLAlchemy clauses safely; `app/utils/export.py` — rows → xlsx (openpyxl) `StreamingResponse`.
- `app/integrations/bnpims.py` — `BnpimsClient.fetch_items(since)`; `MockBnpimsClient` when unconfigured.
- Tests: pytest + httpx `AsyncClient` against a test DB (`TEST_DATABASE_URL`), fixtures for superadmin token; smoke tests per router.

## Frontend (React + TS)
- `src/app/` — `providers.tsx` (QueryClient, Router, Toaster), `store/auth.ts` (zustand: user, tokens, permissions, `hasPermission(module, action)`).
- `src/api/client.ts` — axios with base `/api/v1`, bearer injection, 401 → refresh once → retry → logout. `src/api/<module>.ts` typed endpoint functions; `src/features/<module>/hooks.ts` react-query hooks (`useList(params)`, `useCreate`, ...).
- `src/components/layout/AppShell` — Sidebar (nav config in `lib/nav.ts`, filtered by `menu` permission; accordion state), Header (Back, Breadcrumb from route handles, bell → notifications popover, user chip → logout popover), Footer, `<Outlet/>` in body.
- `src/components/ui/` — the design system extracted from Figma (see `03-figma-ui-spec.md` tokens): `Button` (primary/clear/outline/danger/ghost/icon), `Input`, `PasswordInput`, `Select` (native-styled + async options), `DatePicker` (native date/year), `Textarea`, `Checkbox`, `StatusRadio` (Active/Inactive box), `FormField` (label + required star + error), `FormGrid` (2/3 cols), `CollapsibleCard` (header strip + body), `ListCard`, `DataTable` (TanStack Table: sortable headers, filter row, zebra, actions column, `ColumnsChooser`, `Pagination` with page-jump/Go/rows-per-page), `RowActions` (view/edit/delete/approve/back/forward icons w/ hover bg), `Modal`, `DetailModal` (Item Details pattern, print), `ConfirmDialog` ("Are you sure?"), `CommentDialog` (Demand Back/Forwarded), `Toast`, `Badge`, `StatusText`, `EmptyState`, `Spinner`.
- `src/features/` — one folder per module: `api.ts`, `hooks.ts`, `schema.ts` (zod), `<Name>Page.tsx` (form + list), `columns.tsx`, `<Name>DetailModal.tsx`. A shared `CrudPage` composition (`components/crud/CrudPage.tsx`) implements the Figma page pattern: form card (create/edit modes, Clear All/Save) + list card (DataTable) + view modal + delete confirm, so masters are declarative (fields + columns + api).
- `src/routes.tsx` — lazy routes with `handle: {breadcrumb, module}`; `RequireAuth` + `RequirePermission` guards; `/ui-kit` showcase route (dev only).
- Styling: Tailwind with tokens; `globals.css` sets Roboto base, scrollbar, focus ring; 1920-wide Figma → fluid layout: sidebar 325 fixed (collapsible under 1280), content `max-w-[1546px]` centered with 24 px inset.

## Cross-cutting
- Permissions drive both API (403) and UI (hide menu/buttons). Super admin sees everything.
- Every mutation → audit log; approvals → notifications.
- All list screens share identical query semantics (page/page_size/sort/filter) → one DataTable ↔ one CRUD service.
- Config via env only; secrets never in code; `.env.example` at root, `backend/`, `frontend/`.
