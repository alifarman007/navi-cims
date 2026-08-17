from __future__ import annotations

from datetime import datetime
from typing import TypeVar

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Status

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class IdLabel(ORMModel):
    """Lightweight option for selects."""

    id: int
    label: str


class StatusUpdate(BaseModel):
    status: Status


class Message(BaseModel):
    detail: str


class AuditFields(ORMModel):
    created_at: datetime | None = None
    updated_at: datetime | None = None
    created_by_id: int | None = None
    updated_by_id: int | None = None


class Ref(ORMModel):
    """Embedded read-only reference (id + code + name)."""

    id: int
    code: str | None = None
    name: str


class UserRef(ORMModel):
    id: int
    username: str
    full_name: str


StatusField = Field(default=Status.ACTIVE)
