"""Test fixtures: isolated test database (TEST_DATABASE_URL), seeded modules/roles/superadmin, async HTTP client.

Each test function gets a fresh schema (create_all/drop_all) — simple and reliable for a CRUD-heavy API.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.db import seed as seed_mod
from app.db.session import get_db
from app.main import app
from app.models import Base


@pytest_asyncio.fixture()
async def engine():
    """Function-scoped engine so it always lives on the test's event loop (pytest-asyncio >= 0.23)."""
    eng = create_async_engine(settings.TEST_DATABASE_URL, poolclass=NullPool)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture()
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)
    async with maker() as session:
        modules = await seed_mod.seed_modules(session)
        roles = await seed_mod.seed_roles(session, modules)
        await seed_mod.seed_superadmin(session, roles)
        await seed_mod.seed_masters(session)
        await session.commit()
    async with maker() as session:
        yield session


@pytest_asyncio.fixture()
async def client(engine, db_session) -> AsyncGenerator[AsyncClient, None]:
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)

    async def _override_db():
        async with maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _override_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture()
async def admin_headers(client: AsyncClient) -> dict[str, str]:
    r = await client.post(
        "/api/v1/auth/login",
        json={"identifier": settings.SEED_SUPERADMIN_USERNAME, "password": settings.SEED_SUPERADMIN_PASSWORD},
    )
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
