from fastapi import APIRouter, Request

from app.core.deps import DB, ClientIP, CurrentUser
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenPair,
    UserMe,
)
from app.schemas.common import Message
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair)
async def login(payload: LoginRequest, db: DB, request: Request, ip: ClientIP):
    return await auth_service.login(
        db, payload.identifier, payload.password, request.headers.get("user-agent"), ip
    )


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, db: DB, request: Request, ip: ClientIP):
    return await auth_service.refresh(db, payload.refresh_token, request.headers.get("user-agent"), ip)


@router.post("/logout", response_model=Message)
async def logout(payload: LogoutRequest, db: DB, user: CurrentUser):
    await auth_service.logout(db, user, payload.refresh_token)
    return Message(detail="Logged out")


@router.get("/me", response_model=UserMe)
async def me(user: CurrentUser):
    return auth_service.user_to_me(user)


@router.post("/forgot-password", response_model=Message)
async def forgot_password(payload: ForgotPasswordRequest, db: DB, ip: ClientIP):
    await auth_service.forgot_password(db, payload.identifier, ip)
    return Message(detail="If the account exists, a reset link has been sent to its email address")


@router.post("/reset-password", response_model=Message)
async def reset_password(payload: ResetPasswordRequest, db: DB, ip: ClientIP):
    await auth_service.reset_password(db, payload.token, payload.new_password, ip)
    return Message(detail="Password has been reset")


@router.post("/change-password", response_model=Message)
async def change_password(payload: ChangePasswordRequest, db: DB, user: CurrentUser, ip: ClientIP):
    await auth_service.change_password(db, user, payload.current_password, payload.new_password, ip)
    return Message(detail="Password changed")
