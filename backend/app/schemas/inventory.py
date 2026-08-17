"""Inventory Management schemas: Store, OpeningStock, Stock (read-only balance), StockTransaction (ledger)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.models.enums import Status, StockSource, StockTxnType
from app.schemas.common import AuditFields, ORMModel, Ref

STORE_TYPES = ("Central", "Depot", "Ship/Base", "Other")
StoreType = Literal["Central", "Depot", "Ship/Base", "Other"]


# ---- Store -----------------------------------------------------------------------
class StoreBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, description="Store ID (business code)")
    name: str = Field(..., min_length=1, max_length=200)
    store_type: StoreType = Field(..., description="Central | Depot | Ship/Base | Other")
    concern: str | None = Field(None, max_length=200)
    address: str | None = Field(None, max_length=500)
    status: Status = Status.ACTIVE


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=200)
    store_type: StoreType | None = None
    concern: str | None = Field(None, max_length=200)
    address: str | None = Field(None, max_length=500)
    status: Status | None = None


class StoreRead(AuditFields):
    id: int
    code: str
    name: str
    store_type: str | None = None
    concern: str | None = None
    address: str | None = None
    status: Status


# ---- Opening Stock ---------------------------------------------------------------
class OpeningStockCreate(BaseModel):
    store_id: int
    item_id: int
    quantity: Decimal = Field(..., gt=0, description="Opening Quantity (> 0)")
    entry_date: date = Field(..., description="Stock Entry Date")
    low_stock_threshold: Decimal | None = Field(None, ge=0)
    remarks: str | None = Field(None, max_length=300)


class OpeningStockUpdate(BaseModel):
    """Quantity / store / item are IMMUTABLE after creation (the ledger already holds the movement)."""

    entry_date: date | None = None
    low_stock_threshold: Decimal | None = Field(None, ge=0)
    remarks: str | None = Field(None, max_length=300)


class OpeningStockRead(AuditFields):
    id: int
    store_id: int
    item_id: int
    quantity: Decimal
    entry_date: date
    low_stock_threshold: Decimal | None = None
    remarks: str | None = None
    store: Ref | None = None
    item: Ref | None = None


# ---- Stock (read-only balance) ---------------------------------------------------
class StockRead(ORMModel):
    id: int
    store_id: int
    item_id: int
    quantity: Decimal
    low_stock_threshold: Decimal | None = None
    is_low: bool = False
    status: Status
    updated_at: datetime | None = None
    store: Ref | None = None
    item: Ref | None = None


class StockSummary(BaseModel):
    store_id: int
    item_id: int
    quantity: Decimal
    low_stock_threshold: Decimal | None = None
    is_low: bool = False


# ---- Stock transaction (read-only ledger) ----------------------------------------
class StockTransactionRead(ORMModel):
    id: int
    store_id: int
    item_id: int
    txn_type: StockTxnType
    quantity_delta: Decimal
    balance_after: Decimal
    source: StockSource | None = None
    ref_type: str | None = None
    ref_id: int | None = None
    remarks: str | None = None
    created_by_id: int | None = None
    created_at: datetime | None = None
    store: Ref | None = None
    item: Ref | None = None
