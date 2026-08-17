"""Report + Dashboard read schemas (read-only projections; no create/update)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import AllocationStatus, AllocationType
from app.schemas.common import ORMModel, Ref, UserRef


# ---- Stock summary / Low stock ----------------------------------------------------
class ReportItemRef(ORMModel):
    id: int
    code: str
    name: str
    category: Ref | None = None
    unit: Ref | None = None


class StockSummaryRow(ORMModel):
    id: int  # stock id
    store: Ref
    item: ReportItemRef
    quantity: Decimal
    low_stock_threshold: Decimal | None = None
    is_low: bool
    last_updated: datetime | None = None


# ---- Allocation report ---------------------------------------------------------------
class FiscalYearRef(ORMModel):
    id: int
    name: str


class AllocationReportRow(ORMModel):
    id: int
    code: str
    type: AllocationType
    fiscal_year: FiscalYearRef
    date: date
    store: Ref
    item: Ref
    ship_base: Ref
    quantity: Decimal
    status: AllocationStatus
    approved_by: UserRef | None = None
    approved_at: datetime | None = None


# ---- Dashboard -----------------------------------------------------------------------
class DashboardCounts(BaseModel):
    items: int
    ship_bases: int
    stores: int
    users: int
    allocations_pending: int
    allocations_approved: int
    allocations_sent_back: int
    low_stock_items: int


class StatusCount(BaseModel):
    status: AllocationStatus
    count: int


class FiscalYearAgg(BaseModel):
    fiscal_year: str
    allocation: int
    sanction: int
    total_qty: Decimal


class ShipBaseAgg(BaseModel):
    ship_base: str
    count: int
    qty: Decimal


class CategoryAgg(BaseModel):
    category: str
    count: int


class StoreAgg(BaseModel):
    store: str
    items: int
    total_qty: Decimal


class AllocationBrief(ORMModel):
    id: int
    code: str
    type: AllocationType
    fiscal_year: FiscalYearRef
    date: date
    store: Ref
    item: Ref
    ship_base: Ref
    quantity: Decimal
    status: AllocationStatus


class DashboardSummary(BaseModel):
    counts: DashboardCounts
    allocations_by_status: list[StatusCount]
    allocations_by_fiscal_year: list[FiscalYearAgg]
    allocations_by_ship_base: list[ShipBaseAgg]
    items_by_category: list[CategoryAgg]
    stock_by_store: list[StoreAgg]
    recent_allocations: list[AllocationBrief]
    low_stock: list[StockSummaryRow]
