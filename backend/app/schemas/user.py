"""User Management schemas (Figma 01_User)."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, model_validator

from app.models.enums import Status, UserType
from app.schemas.common import AuditFields, ORMModel, Ref

# Permissive e-mail (intranet domains like *.local / *.navy are allowed; EmailStr rejects special-use TLDs)
EmailLike = Annotated[str, Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=150)]


class RoleRef(ORMModel):
    id: int
    name: str


class UserBase(BaseModel):
    user_type: UserType
    username: str = Field(..., min_length=3, max_length=64, pattern=r"^[A-Za-z0-9._@+-]+$")
    full_name: str = Field(..., min_length=1, max_length=150)
    email: EmailLike | None = None
    phone: str | None = Field(None, min_length=6, max_length=20)
    role_id: int
    office_id: int | None = None
    ship_base_id: int | None = None
    status: Status = Status.ACTIVE


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

    @model_validator(mode="after")
    def _check_type_bindings(self):
        if self.user_type == UserType.SHIP_BASE_USER and not self.ship_base_id:
            raise ValueError("Ship/Base is required for a Ship/Base User")
        if self.user_type == UserType.OFFICE_USER and not self.office_id:
            raise ValueError("Office is required for an Office User")
        return self


class UserUpdate(BaseModel):
    user_type: UserType | None = None
    username: str | None = Field(None, min_length=3, max_length=64, pattern=r"^[A-Za-z0-9._@+-]+$")
    full_name: str | None = Field(None, min_length=1, max_length=150)
    email: EmailLike | None = None
    phone: str | None = Field(None, min_length=6, max_length=20)
    password: str | None = Field(None, min_length=8, max_length=128)
    role_id: int | None = None
    office_id: int | None = None
    ship_base_id: int | None = None
    status: Status | None = None


class UserRead(AuditFields):
    id: int
    user_type: UserType
    username: str
    full_name: str
    email: str | None = None
    phone: str | None = None
    role_id: int | None = None
    office_id: int | None = None
    ship_base_id: int | None = None
    status: Status
    is_superuser: bool = False
    last_login_at: datetime | None = None
    avatar_url: str | None = None
    role: RoleRef | None = None
    office: Ref | None = None
    ship_base: Ref | None = None


class ResetPasswordByAdmin(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)
