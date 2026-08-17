"""Factory that builds the standard 7 endpoints (list/options/get/create/update/status/delete) for a CRUD service.

Usage (see endpoints/brands.py):
    router = make_crud_router(
        prefix="/brands", tags=["item-management"], module=Module.ITEM_MANAGEMENT,
        service_cls=BrandService, read_schema=BrandRead, create_schema=BrandCreate, update_schema=BrandUpdate,
    )
"""

# NOTE: no `from __future__ import annotations` here on purpose — the factory relies on
# annotations being evaluated at definition time (payload: create_schema).
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel

from app.core.deps import DB, ClientIP, CurrentUser, has_permission, require_permission
from app.core.exceptions import ForbiddenError
from app.core.permissions import Action, Module
from app.schemas.common import IdLabel, Message, Page, StatusUpdate
from app.services.crud_base import CRUDService, paginate
from app.utils.query import ListParams


def make_crud_router(
    *,
    prefix: str,
    tags: list[str],
    module: Module,
    service_cls: type[CRUDService],
    read_schema: type[BaseModel],
    create_schema: type[BaseModel],
    update_schema: type[BaseModel],
    with_status: bool = True,
    with_delete: bool = True,
    options_modules: tuple[Module, ...] = (),
) -> APIRouter:
    """`options_modules`: additional modules whose `list` permission also grants access to /options
    (e.g. Allocation users need item options without Item Management permission)."""
    router = APIRouter(prefix=prefix, tags=tags)
    PageT = Page[read_schema]  # type: ignore[valid-type]

    def svc(db: DB, user: CurrentUser, ip: ClientIP) -> CRUDService:
        return service_cls(db, user_id=user.id, ip=ip)

    @router.get("", response_model=PageT)
    async def list_items(
        db: DB,
        ip: ClientIP,
        user: Any = Depends(require_permission(module, Action.LIST)),
        params: ListParams = Depends(),
    ):
        service = service_cls(db, user_id=user.id, ip=ip)
        rows, total = await service.list(params)
        return paginate([read_schema.model_validate(r) for r in rows], total, params)

    @router.get("/options", response_model=list[IdLabel])
    async def options(
        db: DB,
        user: CurrentUser,
        ip: ClientIP,
        q: str | None = Query(None),
        limit: int = Query(50, ge=1, le=500),
    ):
        allowed = has_permission(user, module, Action.LIST) or any(
            has_permission(user, m, Action.LIST) for m in options_modules
        )
        if not allowed:
            raise ForbiddenError(f"Permission denied: {module}.list")
        service = service_cls(db, user_id=user.id, ip=ip)
        return await service.options(q=q, limit=limit)

    @router.get("/{item_id}", response_model=read_schema)
    async def get_item(
        item_id: int, db: DB, ip: ClientIP, user: Any = Depends(require_permission(module, Action.VIEW))
    ):
        service = service_cls(db, user_id=user.id, ip=ip)
        return read_schema.model_validate(await service.get(item_id))

    @router.post("", response_model=read_schema, status_code=status.HTTP_201_CREATED)
    async def create_item(
        payload: create_schema,
        db: DB,
        ip: ClientIP,  # type: ignore[valid-type]
        user: Any = Depends(require_permission(module, Action.ADD)),
    ):
        service = service_cls(db, user_id=user.id, ip=ip)
        return read_schema.model_validate(await service.create(payload))

    @router.put("/{item_id}", response_model=read_schema)
    async def update_item(
        item_id: int,
        payload: update_schema,
        db: DB,
        ip: ClientIP,  # type: ignore[valid-type]
        user: Any = Depends(require_permission(module, Action.EDIT)),
    ):
        service = service_cls(db, user_id=user.id, ip=ip)
        return read_schema.model_validate(await service.update(item_id, payload))

    if with_status:

        @router.patch("/{item_id}/status", response_model=read_schema)
        async def set_status(
            item_id: int,
            payload: StatusUpdate,
            db: DB,
            ip: ClientIP,
            user: Any = Depends(require_permission(module, Action.EDIT)),
        ):
            service = service_cls(db, user_id=user.id, ip=ip)
            await service.set_status(item_id, payload.status)
            return read_schema.model_validate(await service.get(item_id))

    if with_delete:

        @router.delete("/{item_id}", response_model=Message)
        async def delete_item(
            item_id: int, db: DB, ip: ClientIP, user: Any = Depends(require_permission(module, Action.DELETE))
        ):
            service = service_cls(db, user_id=user.id, ip=ip)
            await service.delete(item_id)
            return Message(detail="Deleted")

    return router
