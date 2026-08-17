"""User Management: /users (CRUD + soft delete) and POST /users/{id}/reset-password."""

from typing import Any

from fastapi import APIRouter, Depends

from app.api.v1.crud_router import make_crud_router
from app.core.deps import DB, ClientIP, require_permission
from app.core.permissions import Action, Module
from app.schemas.common import Message
from app.schemas.user import ResetPasswordByAdmin, UserCreate, UserRead, UserUpdate
from app.services.user import UserService

router = APIRouter(tags=["user-management"])


@router.post("/users/{user_id}/reset-password", response_model=Message)
async def reset_password(
    user_id: int,
    payload: ResetPasswordByAdmin,
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_permission(Module.USER_MANAGEMENT, Action.EDIT)),
):
    """Admin sets a new password for a user (no old password needed)."""
    await UserService(db, user_id=user.id, ip=ip).reset_password(user_id, payload.new_password)
    return Message(detail="Password reset")


router.include_router(
    make_crud_router(
        prefix="/users",
        tags=["user-management"],
        module=Module.USER_MANAGEMENT,
        service_cls=UserService,
        read_schema=UserRead,
        create_schema=UserCreate,
        update_schema=UserUpdate,
        options_modules=(Module.ALLOCATION_SANCTION, Module.COMPILATION_VERIFICATION, Module.REPORT),
    )
)
