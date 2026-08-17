"""Allocation/Sanction + Compilation/Verification schemas."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import AllocationStatus, AllocationType, VerificationAction
from app.schemas.common import AuditFields, ORMModel, Ref, UserRef


class FiscalYearRef(ORMModel):
    id: int
    name: str


# ---- Allocation ------------------------------------------------------------------
class AllocationBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, description="Allocation ID (business code)")
    allocation_type: AllocationType
    fiscal_year_id: int
    allocation_date: date = Field(default_factory=date.today)
    store_id: int
    item_id: int
    ship_base_id: int
    quantity: Decimal = Field(..., gt=0, description="Allocation Qty")
    remarks: str | None = Field(None, max_length=500)


class AllocationCreate(AllocationBase):
    pass


class AllocationUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    allocation_type: AllocationType | None = None
    fiscal_year_id: int | None = None
    allocation_date: date | None = None
    store_id: int | None = None
    item_id: int | None = None
    ship_base_id: int | None = None
    quantity: Decimal | None = Field(None, gt=0)
    remarks: str | None = Field(None, max_length=500)


class VerificationBrief(AuditFields):
    """Verification as embedded in an allocation (history)."""

    id: int
    code: str
    allocation_id: int
    approver_id: int
    approver: UserRef | None = None
    action: VerificationAction
    comment: str | None = None
    acted_at: datetime | None = None


class AllocationRead(AuditFields):
    id: int
    code: str
    allocation_type: AllocationType
    fiscal_year_id: int
    fiscal_year: FiscalYearRef | None = None
    allocation_date: date
    store_id: int
    store: Ref | None = None
    item_id: int
    item: Ref | None = None
    ship_base_id: int
    ship_base: Ref | None = None
    quantity: Decimal
    status: AllocationStatus
    remarks: str | None = None
    approved_at: datetime | None = None
    approved_by_id: int | None = None
    approved_by: UserRef | None = None
    verifications: list[VerificationBrief] = []


class SendBackPayload(BaseModel):
    comment: str = Field(..., min_length=1, max_length=500)


class ApprovePayload(BaseModel):
    """Optional body for POST /allocations/{id}/approve."""

    comment: str | None = Field(None, max_length=500)


# ---- Verification ------------------------------------------------------------------
class AllocationBrief(ORMModel):
    id: int
    code: str
    status: AllocationStatus
    allocation_type: AllocationType
    quantity: Decimal
    ship_base: Ref | None = None
    item: Ref | None = None
    store: Ref | None = None


class VerificationCreate(BaseModel):
    code: str | None = Field(
        None, min_length=1, max_length=50, description="Verification ID (auto when omitted)"
    )
    allocation_id: int
    approver_id: int | None = Field(None, description="Defaults to the current user")
    action: VerificationAction = VerificationAction.APPROVED
    comment: str | None = Field(None, max_length=500)


class VerificationUpdate(BaseModel):
    comment: str | None = Field(None, max_length=500)


class VerificationRead(AuditFields):
    id: int
    code: str
    allocation_id: int
    allocation: AllocationBrief | None = None
    approver_id: int
    approver: UserRef | None = None
    action: VerificationAction
    comment: str | None = None
    acted_at: datetime | None = None
