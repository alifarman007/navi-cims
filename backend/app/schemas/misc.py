"""Schemas: Procurement Item Info (BNPIMS cache), Notifications, Audit log."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel

from app.schemas.common import ORMModel, UserRef


# ---- Procurement items (read-only cache of BNPIMS) ---------------------------------------------
class ProcurementItemRead(ORMModel):
    id: int
    external_id: str
    grn_no: str | None = None
    transaction_date: datetime | None = None
    imc: str | None = None
    item_name: str | None = None
    deno: str | None = None
    receive_quantity: Decimal | None = None
    part_no: str | None = None
    remarks: str | None = None
    synced_at: datetime | None = None


class ProcurementItemDetail(ProcurementItemRead):
    raw: dict[str, Any] | None = None


class ProcurementSyncResult(BaseModel):
    fetched: int
    created: int
    updated: int
    synced_at: datetime


# ---- Notifications ----------------------------------------------------------------------------
class NotificationRead(ORMModel):
    id: int
    title: str
    message: str
    link: str | None = None
    is_read: bool
    created_at: datetime


class UnreadCount(BaseModel):
    count: int


# ---- Audit logs -------------------------------------------------------------------------------
class AuditLogRead(ORMModel):
    id: int
    user_id: int | None = None
    user: UserRef | None = None
    action: str
    entity: str
    entity_id: str | None = None
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    ip: str | None = None
    created_at: datetime
