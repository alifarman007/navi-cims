"""Allocation/Sanction (+ approve / send-back / cancel / resubmit) and Compilation/Verification routers."""

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.v1.crud_router import make_crud_router
from app.core.deps import DB, ClientIP, CurrentUser, has_permission, require_permission
from app.core.exceptions import ForbiddenError
from app.core.permissions import Action, Module
from app.models.enums import AllocationStatus
from app.schemas.allocation import (
    AllocationCreate,
    AllocationRead,
    AllocationUpdate,
    ApprovePayload,
    SendBackPayload,
    VerificationCreate,
    VerificationRead,
    VerificationUpdate,
)
from app.schemas.common import IdLabel, Page
from app.services.allocation import AllocationService, VerificationService
from app.services.crud_base import paginate
from app.utils.query import ListParams

_ALLOC_OPTS = (Module.COMPILATION_VERIFICATION, Module.REPORT, Module.DASHBOARD)

# ---- custom allocation routes (declared BEFORE the crud router so "/options" and the
# workflow paths are matched first) -----------------------------------------------------
allocation_actions_router = APIRouter(prefix="/allocations", tags=["allocation-sanction"])


@allocation_actions_router.get("", response_model=Page[AllocationRead])
async def list_allocations(db: DB, user: CurrentUser, ip: ClientIP, params: ListParams = Depends()):
    """Allocation queue — readable by Allocation/Sanction *or* Compilation/Verification list permission
    (the verification screen works this queue). Ship/base users are scoped to their own ship/base."""
    if not (
        has_permission(user, Module.ALLOCATION_SANCTION, Action.LIST)
        or has_permission(user, Module.COMPILATION_VERIFICATION, Action.LIST)
    ):
        raise ForbiddenError(f"Permission denied: {Module.ALLOCATION_SANCTION}.list")
    svc = AllocationService(db, user_id=user.id, ip=ip)
    rows, total = await svc.list(params)
    return paginate([AllocationRead.model_validate(r) for r in rows], total, params)


@allocation_actions_router.get("/options", response_model=list[IdLabel])
async def allocation_options(
    db: DB,
    user: CurrentUser,
    ip: ClientIP,
    q: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    status: AllocationStatus | None = Query(None, description="e.g. pending (Compilation/Verification form)"),
):
    allowed = has_permission(user, Module.ALLOCATION_SANCTION, Action.LIST) or any(
        has_permission(user, m, Action.LIST) for m in _ALLOC_OPTS
    )
    if not allowed:
        raise ForbiddenError(f"Permission denied: {Module.ALLOCATION_SANCTION}.list")
    return await AllocationService(db, user_id=user.id, ip=ip).options(q=q, limit=limit, status=status)


@allocation_actions_router.post("/{item_id}/approve", response_model=AllocationRead)
async def approve_allocation(
    item_id: int,
    db: DB,
    ip: ClientIP,
    payload: ApprovePayload | None = None,
    user: Any = Depends(require_permission(Module.COMPILATION_VERIFICATION, Action.EDIT)),
):
    svc = AllocationService(db, user_id=user.id, ip=ip)
    return AllocationRead.model_validate(
        await svc.approve(item_id, approver_id=user.id, comment=payload.comment if payload else None)
    )


@allocation_actions_router.post("/{item_id}/send-back", response_model=AllocationRead)
async def send_back_allocation(
    item_id: int,
    payload: SendBackPayload,
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_permission(Module.COMPILATION_VERIFICATION, Action.EDIT)),
):
    svc = AllocationService(db, user_id=user.id, ip=ip)
    return AllocationRead.model_validate(
        await svc.send_back(item_id, comment=payload.comment, approver_id=user.id)
    )


@allocation_actions_router.post("/{item_id}/cancel", response_model=AllocationRead)
async def cancel_allocation(
    item_id: int,
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_permission(Module.ALLOCATION_SANCTION, Action.LIST)),
):
    """Creator or admin may cancel a pending / sent-back allocation (checked in the service)."""
    svc = AllocationService(db, user_id=user.id, ip=ip)
    return AllocationRead.model_validate(await svc.cancel(item_id, user=user))


@allocation_actions_router.post("/{item_id}/resubmit", response_model=AllocationRead)
async def resubmit_allocation(
    item_id: int,
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_permission(Module.ALLOCATION_SANCTION, Action.LIST)),
):
    """Creator (or anyone with allocation_sanction.edit) resubmits a sent-back allocation."""
    svc = AllocationService(db, user_id=user.id, ip=ip)
    return AllocationRead.model_validate(await svc.resubmit(item_id, user=user))


allocations_router = make_crud_router(
    prefix="/allocations",
    tags=["allocation-sanction"],
    module=Module.ALLOCATION_SANCTION,
    service_cls=AllocationService,
    read_schema=AllocationRead,
    create_schema=AllocationCreate,
    update_schema=AllocationUpdate,
    with_status=False,
    options_modules=_ALLOC_OPTS,
)

verifications_router = make_crud_router(
    prefix="/verifications",
    tags=["compilation-verification"],
    module=Module.COMPILATION_VERIFICATION,
    service_cls=VerificationService,
    read_schema=VerificationRead,
    create_schema=VerificationCreate,
    update_schema=VerificationUpdate,
    with_status=False,
    options_modules=(Module.ALLOCATION_SANCTION, Module.REPORT),
)

routers = [allocation_actions_router, allocations_router, verifications_router]
