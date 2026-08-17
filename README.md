# CIMS — Central Inventory Management System

Web application for the **Bangladesh Navy** to centrally manage inventory (items, stores, stock) and its **allocation / sanction** to Ships and Bases, with role-based access, master data, dashboards and reports. Procurement itself lives in a separate system (BNPIMS); CIMS reads procurement item information from it through an API adapter.

| Layer     | Tech                                                                                             |
|-----------|--------------------------------------------------------------------------------------------------|
| Database  | PostgreSQL 16                                                                                    |
| Backend   | Python 3.12+, FastAPI, SQLAlchemy 2 (async, asyncpg), Alembic, Pydantic v2, JWT auth, pytest     |
| Frontend  | React 18 + TypeScript, Vite, Tailwind CSS, React Router 6, TanStack Query/Table, react-hook-form |

No Docker is used — the three parts run as ordinary processes/services.

```
navi-cims/
├── backend/     FastAPI API  (app/, alembic/, tests/, scripts/)
├── frontend/    React SPA    (src/, public/)
└── docs/        requirements summaries, Figma UI spec + screenshots, gap analysis, architecture, DB schema, API conventions, open questions
```

---

## 1. Prerequisites

* PostgreSQL 16 running locally (service `postgresql-x64-16` on Windows) with a superuser you can use to create roles/databases.
* Python 3.12 or newer.
* Node.js 20+ and npm.

## 2. Database

Create the application role and databases once (adjust the superuser password to your installation):

```bash
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE ROLE cims LOGIN PASSWORD 'cims' CREATEDB;"
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE cims OWNER cims;"
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE cims_test OWNER cims;"   # used by pytest
```

## 3. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate      Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env                    # edit DATABASE_URL, SECRET_KEY, SMTP_*, BNPIMS_* as needed

alembic upgrade head                    # create the schema
python -m app.db.seed                   # modules, system roles, super admin, base master data (idempotent)
uvicorn app.main:app --reload --port 8000
```

* API base URL: `http://localhost:8000/api/v1` — interactive docs at `http://localhost:8000/docs` (disabled when `ENV=prod`).
* Default super admin (from `.env`): **admin / Admin@12345** — change it after first login (`POST /auth/change-password` or the user menu).
* Tests: `pytest` (uses `TEST_DATABASE_URL`, default `cims_test`; the schema is recreated per test).
* Migrations: `alembic revision --autogenerate -m "message"` then review the file. Note the audit columns use cyclic FKs (`use_alter=True`); after autogenerating a migration that creates those tables run `python scripts/fix_migration_cyclic_fks.py` (see `backend/scripts/README.md`).

## 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env                    # VITE_API_URL=/api/v1 (dev server proxies /api → http://localhost:8000)
npm run dev                             # http://localhost:5173
```

* Production build: `npm run build` → static files in `frontend/dist/` (serve with nginx/IIS/any static server, and proxy `/api` to the backend, or point `VITE_API_URL` at the API host).
* Type-check: `npx tsc -b`.

## 5. Everyday development

| Task                              | Command                                                    |
|-----------------------------------|------------------------------------------------------------|
| Run API (auto-reload)             | `cd backend && uvicorn app.main:app --reload --port 8000`  |
| Run UI                            | `cd frontend && npm run dev`                               |
| Backend tests                     | `cd backend && pytest`                                     |
| Frontend type-check / build       | `cd frontend && npx tsc -b` / `npm run build`              |
| Re-seed (safe, idempotent)        | `cd backend && python -m app.db.seed`                      |
| Live e2e smoke test (dev DB only) | `cd backend && python scripts/e2e_smoke.py` (API must be running) |
| Screenshot every page (Edge)      | `cd frontend && python scripts/shoot.py / /items/brand …` (needs `pip install playwright`) |
| Reset dev DB                      | `psql -U cims -d cims -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"` then `alembic upgrade head` + seed |

## 6. Configuration (backend/.env)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `TEST_DATABASE_URL` | asyncpg URLs |
| `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `PASSWORD_RESET_EXPIRE_HOURS` | auth |
| `CORS_ORIGINS`, `FRONTEND_URL` | comma-separated origins; base URL used in password-reset links |
| `SMTP_*` | password-reset mail (when `SMTP_HOST` is empty mails are logged) |
| `BNPIMS_BASE_URL`, `BNPIMS_API_KEY` | procurement integration (empty → deterministic mock data) |
| `SEED_SUPERADMIN_*` | first super admin created by the seed |

## 7. Modules

Dashboard · Configuration (Office, Appointment, Rank, Country, Division, District, Upazila) · Item Management (Item, Item Unit, Brand, Model, Item Category) · Ship/Base Management · Inventory Management (Store, Opening Stock, Stock Balance) · Procurement Item Info · Allocation/Sanction · Compilation/Verification · Report · User Management (User, Role Permission).

Access is role based: each role has Menu / List / View / Add / Edit / Delete permissions per module; the super admin bypasses all checks. See `docs/` for the requirements, the Figma-derived UI spec, the data model and the API conventions.

## 8. Deployment (native)

1. PostgreSQL as an OS service; create role/DB as in §2.
2. Backend: virtualenv + `pip install .`, `.env` with `ENV=prod` and a strong `SECRET_KEY`, `alembic upgrade head`, `python -m app.db.seed`, run `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2` under systemd (Linux) or NSSM/Task Scheduler (Windows).
3. Frontend: `npm ci && npm run build`, serve `frontend/dist` with nginx/IIS and reverse-proxy `/api` → `http://127.0.0.1:8000`; enable HTTPS on the proxy.
