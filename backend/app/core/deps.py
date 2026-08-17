"""FastAPI dependencies: DB session, current user, permission guard, client IP."""

from __future__ import annotations

from collections.abc import Callable
from typing import Annotated

import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.permissions import Action, Module
from app.core.security import decode_token
from app.db.session import get_db
from app.models.enums import Status, UserType
from app.models.user import User

bearer = HTTPBearer(auto_error=False)

DB = Annotated[AsyncSession, Depends(get_db)]


def get_client_ip(request: Request) -> str | None:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else None


ClientIP = Annotated[str | None, Depends(get_client_ip)]


async def get_current_user(
    db: DB,
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User:
    if creds is None or not creds.credentials:
        raise UnauthorizedError()
    try:
        payload = decode_token(creds.credentials)
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("Token expired") from exc
    except jwt.PyJWTError as exc:
        raise UnauthorizedError("Invalid token") from exc
    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise UnauthorizedError("Invalid token") from exc
    user = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
    if user is None:
        raise UnauthorizedError("User not found")
    if user.status != Status.ACTIVE:
        raise ForbiddenError("Account is disabled")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def user_permissions(user: User) -> dict[str, dict[str, bool]]:
    """{module_code: {menu,list,view,add,edit,delete}} for the user's role. Super admin -> all True."""
    from app.core.permissions import ALL_ACTIONS, MODULE_DEFINITIONS

    if user.is_superuser or user.user_type == UserType.SUPER_ADMIN:
        return {m["code"]: {a.value: True for a in ALL_ACTIONS} for m in MODULE_DEFINITIONS}
    perms: dict[str, dict[str, bool]] = {}
    if user.role and user.role.status == Status.ACTIVE:
        for rp in user.role.permissions:
            perms[rp.module.code] = {
                "menu": rp.can_menu,
                "list": rp.can_list,
                "view": rp.can_view,
                "add": rp.can_add,
                "edit": rp.can_edit,
                "delete": rp.can_delete,
            }
    return perms


def has_permission(user: User, module: Module | str, action: Action | str) -> bool:
    return bool(user_permissions(user).get(str(module), {}).get(str(action), False))


def require_permission(module: Module | str, action: Action | str) -> Callable:
    async def _guard(user: CurrentUser) -> User:
        if not has_permission(user, module, action):
            raise ForbiddenError(f"Permission denied: {module}.{action}")
        return user

    return _guard


def require_user_types(*types: UserType) -> Callable:
    async def _guard(user: CurrentUser) -> User:
        if user.is_superuser or user.user_type in types:
            return user
        raise ForbiddenError("Not allowed for this user type")

    return _guard
