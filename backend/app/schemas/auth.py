from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import Status, UserType
from app.schemas.common import ORMModel, Ref


class LoginRequest(BaseModel):
    identifier: str = Field(..., min_length=1, description="username, email or phone")
    password: str = Field(..., min_length=1)
    remember_me: bool = False


class RoleBrief(ORMModel):
    id: int
    name: str


class UserMe(ORMModel):
    id: int
    user_type: UserType
    username: str
    full_name: str
    email: str | None = None
    phone: str | None = None
    status: Status
    is_superuser: bool
    role: RoleBrief | None = None
    office: Ref | None = None
    ship_base: Ref | None = None
    last_login_at: datetime | None = None
    avatar_url: str | None = None
    permissions: dict[str, dict[str, bool]] = {}


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserMe


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class ForgotPasswordRequest(BaseModel):
    identifier: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
