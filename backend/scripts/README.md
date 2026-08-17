# backend/scripts

- `fix_migration_cyclic_fks.py` — run after `alembic revision --autogenerate` on a migration that creates the
  audited tables. Alembic drops `use_alter=True` FKs from `op.create_table`; this script moves them into explicit
  `op.create_foreign_key(...)` calls at the end of `upgrade()` (and `op.drop_constraint` in `downgrade()`).
  Also remember to append `op.execute("DROP TYPE IF EXISTS <enum>")` for every PG enum in `downgrade()`.
  Usage: `python scripts/fix_migration_cyclic_fks.py` (edits the newest file in `alembic/versions/`).
- `e2e_smoke.py` — end-to-end business-flow smoke test against a running API (`CIMS_API`, default `http://localhost:8000/api/v1`): masters → opening stock → allocation approve (stock deduction, 409 on shortage) → send back / resubmit / cancel → verifications → notifications → reports (+xlsx) → dashboard → procurement sync → roles/users/permissions. Creates demo rows with a random suffix; run against a dev DB only.
