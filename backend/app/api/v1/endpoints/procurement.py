"""Procurement Item Info (BNPIMS cache): read-only list/options/detail + POST /procurement-items/sync."""

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.core.deps import DB, ClientIP, CurrentUser, has_permission, require_permission
from app.core.exceptions import ForbiddenError
from app.core.permissions import Action, Module
from app.schemas.common import IdLabel, Page
from app.schemas.misc import ProcurementItemDetail, ProcurementItemRead, ProcurementSyncResult
from app.services import procurement as procurement_service
from app.services.crud_base import paginate
from app.services.procurement import ProcurementItemService
from app.utils.query import ListParams

router = APIRouter(prefix="/procurement-items", tags=["procurement-item-info"])
_MODULE = Module.PROCUREMENT_ITEM_INFO
_OPTS = (Module.INVENTORY_MANAGEMENT, Module.ITEM_MANAGEMENT, Module.ALLOCATION_SANCTION, Module.REPORT)


@router.get("", response_model=Page[ProcurementItemRead])
async def list_procurement_items(
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_permission(_MODULE, Action.LIST)),
    params: ListParams = Depends(),
):
    service = ProcurementItemService(db, user_id=user.id, ip=ip)
    rows, total = await service.list(params)
    return paginate([ProcurementItemRead.model_validate(r) for r in rows], total, params)


@router.get("/options", response_model=list[IdLabel])
async def procurement_item_options(
    db: DB,
    user: CurrentUser,
    ip: ClientIP,
    q: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
):
    if not (
        has_permission(user, _MODULE, Action.LIST) or any(has_permission(user, m, Action.LIST) for m in _OPTS)
    ):
        raise ForbiddenError(f"Permission denied: {_MODULE}.list")
    return await ProcurementItemService(db, user_id=user.id, ip=ip).options(q=q, limit=limit)


@router.post("/sync", response_model=ProcurementSyncResult)
async def sync_procurement_items(
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_permission(_MODULE, Action.EDIT)),
    incremental: bool = Query(
        False, description="Only pull rows newer than the latest cached transaction_date"
    ),
):
    return await procurement_service.sync(db, user.id, ip=ip, incremental=incremental)


@router.get("/{item_id}", response_model=ProcurementItemDetail)
async def get_procurement_item(
    item_id: int, db: DB, ip: ClientIP, user: Any = Depends(require_permission(_MODULE, Action.VIEW))
):
    return ProcurementItemDetail.model_validate(
        await ProcurementItemService(db, user_id=user.id, ip=ip).get(item_id)
    )
