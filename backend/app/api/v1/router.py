"""Aggregates every router under app/api/v1/endpoints.

Auto-discovery: each endpoint module may expose `router` (APIRouter) and/or `routers` (list[APIRouter]).
New modules are picked up automatically — no need to edit this file.
"""

from __future__ import annotations

import importlib
import pkgutil

from fastapi import APIRouter

from app.api.v1 import endpoints as endpoints_pkg

api_router = APIRouter()

for mod_info in sorted(pkgutil.iter_modules(endpoints_pkg.__path__), key=lambda m: m.name):
    module = importlib.import_module(f"{endpoints_pkg.__name__}.{mod_info.name}")
    single = getattr(module, "router", None)
    if single is not None:
        api_router.include_router(single)
    for r in getattr(module, "routers", []) or []:
        api_router.include_router(r)
