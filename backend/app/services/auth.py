"""Authentication: login, refresh rotation, logout, forgot/reset password, change password."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import user_permissions
from app.core.exceptions import BadRequestError, ForbiddenError, UnauthorizedError
from app.core.security import (
    create_access_token,
    generate_opaque_token,
    hash_password,
    hash_token,
    password_reset_expiry,
    refresh_token_expiry,
    verify_password,
)
from app.models.enums import Status
from app.models.user import PasswordResetToken, RefreshToken, User
from app.schemas.auth import TokenPair, UserMe
from app.services.audit import log_action
from app.utils.email import send_email

log = logging.getLogger(__name__)


def user_to_me(user: User) -> UserMe:
    me = UserMe.model_validate(user)
    me.permissions = user_permissions(user)
    return me


async def find_user_by_identifier(db: AsyncSession, identifier: str) -> User | None:
    ident = identifier.strip()
    stmt = select(User).where(or_(User.username == ident, User.email == ident.lower(), User.phone == ident))
    return (await db.execute(stmt)).scalars().first()


async def _issue_tokens(db: AsyncSession, user: User, ua: str | None, ip: str | None) -> TokenPair:
    raw_refresh = generate_opaque_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(raw_refresh),
            expires_at=refresh_token_expiry(),
            user_agent=(ua or "")[:300],
            ip=ip,
        )
    )
    await db.flush()
    access = create_access_token(user.id, {"ut": user.user_type.value})
    return TokenPair(
        access_token=access,
        refresh_token=raw_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_to_me(user),
    )


async def login(
    db: AsyncSession, identifier: str, password: str, ua: str | None, ip: str | None
) -> TokenPair:
    user = await find_user_by_identifier(db, identifier)
    if user is None or not verify_password(password, user.hashed_password):
        await log_action(
            db,
            user_id=user.id if user else None,
            action="login_failed",
            entity="auth",
            entity_id=identifier,
            ip=ip,
        )
        raise UnauthorizedError("Invalid credentials")
    if user.status != Status.ACTIVE:
        raise ForbiddenError("Account is disabled. Contact the administrator.")
    user.last_login_at = datetime.now(UTC)
    await log_action(db, user_id=user.id, action="login", entity="auth", entity_id=user.id, ip=ip)
    return await _issue_tokens(db, user, ua, ip)


async def refresh(db: AsyncSession, raw_refresh: str, ua: str | None, ip: str | None) -> TokenPair:
    token = (
        (await db.execute(select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_refresh))))
        .scalars()
        .first()
    )
    now = datetime.now(UTC)
    if token is None or token.revoked_at is not None or token.expires_at < now:
        raise UnauthorizedError("Invalid or expired refresh token")
    user = (await db.execute(select(User).where(User.id == token.user_id))).scalars().first()
    if user is None or user.status != Status.ACTIVE:
        raise UnauthorizedError("User inactive")
    token.revoked_at = now  # rotation
    return await _issue_tokens(db, user, ua, ip)


async def logout(db: AsyncSession, user: User, raw_refresh: str | None) -> None:
    now = datetime.now(UTC)
    if raw_refresh:
        token = (
            (await db.execute(select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_refresh))))
            .scalars()
            .first()
        )
        if token and token.user_id == user.id:
            token.revoked_at = now
    await log_action(db, user_id=user.id, action="logout", entity="auth", entity_id=user.id)


async def forgot_password(db: AsyncSession, identifier: str, ip: str | None) -> None:
    """Always succeeds (no user enumeration). Sends a reset link valid PASSWORD_RESET_EXPIRE_HOURS (12h, SRS)."""
    user = await find_user_by_identifier(db, identifier)
    if user is None or user.status != Status.ACTIVE or not user.email:
        return
    raw = generate_opaque_token()
    db.add(
        PasswordResetToken(user_id=user.id, token_hash=hash_token(raw), expires_at=password_reset_expiry())
    )
    await db.flush()
    link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{raw}"
    await send_email(
        to=user.email,
        subject="CIMS password reset",
        body=(
            f"Dear {user.full_name},\n\nA password reset was requested for your CIMS account.\n"
            f"Use the link below within {settings.PASSWORD_RESET_EXPIRE_HOURS} hours:\n{link}\n\n"
            "If you did not request this, ignore this email."
        ),
    )
    await log_action(db, user_id=user.id, action="forgot_password", entity="auth", entity_id=user.id, ip=ip)


async def reset_password(db: AsyncSession, raw_token: str, new_password: str, ip: str | None) -> None:
    now = datetime.now(UTC)
    token = (
        (
            await db.execute(
                select(PasswordResetToken).where(PasswordResetToken.token_hash == hash_token(raw_token))
            )
        )
        .scalars()
        .first()
    )
    if token is None or token.used_at is not None or token.expires_at < now:
        raise BadRequestError("Reset link is invalid or has expired")
    user = (await db.execute(select(User).where(User.id == token.user_id))).scalars().first()
    if user is None:
        raise BadRequestError("Reset link is invalid")
    user.hashed_password = hash_password(new_password)
    user.password_changed_at = now
    token.used_at = now
    # revoke all refresh tokens
    for rt in (await db.execute(select(RefreshToken).where(RefreshToken.user_id == user.id))).scalars():
        rt.revoked_at = now
    await log_action(db, user_id=user.id, action="reset_password", entity="auth", entity_id=user.id, ip=ip)


async def change_password(db: AsyncSession, user: User, current: str, new: str, ip: str | None) -> None:
    if not verify_password(current, user.hashed_password):
        raise BadRequestError("Current password is incorrect")
    user.hashed_password = hash_password(new)
    user.password_changed_at = datetime.now(UTC)
    await log_action(db, user_id=user.id, action="change_password", entity="auth", entity_id=user.id, ip=ip)
