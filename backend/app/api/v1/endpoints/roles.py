"""User Management: /roles (CRUD + permission matrix) and GET /modules."""

from typing import Any

from fastapi import APIRouter, Depends

from app.api.v1.crud_router import make_crud_router
from app.core.deps import DB, ClientIP, CurrentUser, require_permission
from app.core.permissions import Action, Module
from app.schemas.role import ModuleRead, RoleCreate, RolePermissionsUpdate, RoleRead, RoleUpdate
from app.services.role import RoleService

router = APIRouter(tags=["user-management"])


@router.get("/modules", response_model=list[ModuleRead])
async def list_modules(db: DB, user: CurrentUser, ip: ClientIP):
    """All modules sorted by sidebar order (rows of the Assign Permission matrix)."""
    return [
        ModuleRead.model_validate(m) for m in await RoleService(db, user_id=user.id, ip=ip).list_modules()
    ]


@router.put("/roles/{role_id}/permissions", response_model=RoleRead)
async def set_role_permissions(
    role_id: int,
    payload: RolePermissionsUpdate,
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_permission(Module.USER_MANAGEMENT, Action.EDIT)),
):
    """Replace the whole permission matrix of a role."""
    role = await RoleService(db, user_id=user.id, ip=ip).set_permissions(role_id, payload.permissions)
    return RoleRead.model_validate(role)


router.include_router(
    make_crud_router(
        prefix="/roles",
        tags=["user-management"],
        module=Module.USER_MANAGEMENT,
        service_cls=RoleService,
        read_schema=RoleRead,
        create_schema=RoleCreate,
        update_schema=RoleUpdate,
    )
)
