"""FastAPI application factory for CIMS."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import engine

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("cims")


@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("Starting %s (%s)", settings.APP_NAME, settings.ENV)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        docs_url=None if settings.is_prod else "/docs",
        redoc_url=None if settings.is_prod else "/redoc",
        openapi_url=None if settings.is_prod else "/openapi.json",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.exception_handler(IntegrityError)
    async def _integrity_handler(_: Request, exc: IntegrityError):
        log.warning("IntegrityError: %s", exc)
        return JSONResponse(status_code=409, content={"detail": "Database integrity error"})

    @app.get("/health", tags=["meta"])
    async def health():
        return {"status": "ok", "app": settings.APP_NAME, "env": settings.ENV}

    return app


app = create_app()
