"""Inventory: Store, Stock (current balance), OpeningStock (entries), StockTransaction (ledger)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base
from app.models.enums import Status, StockSource, StockTxnType, db_enum
from app.models.item import Item


class Store(AuditMixin, Base):
    __tablename__ = "stores"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    store_type: Mapped[str | None] = mapped_column(String(50))
    concern: Mapped[str | None] = mapped_column(String(200))
    address: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status", create_type=False), default=Status.ACTIVE
    )


class Stock(Base):
    __tablename__ = "stocks"
    __table_args__ = (UniqueConstraint("store_id", "item_id", name="uq_stocks_store_item"),)

    store_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("stores.id", ondelete="RESTRICT"), nullable=False
    )
    item_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("items.id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0, nullable=False)
    low_stock_threshold: Mapped[Decimal | None] = mapped_column(Numeric(14, 3))
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status", create_type=False), default=Status.ACTIVE
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    store: Mapped[Store] = relationship("Store", lazy="selectin")
    item: Mapped[Item] = relationship("Item", lazy="selectin")


class OpeningStock(AuditMixin, Base):
    __tablename__ = "opening_stocks"

    store_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("stores.id", ondelete="RESTRICT"), nullable=False
    )
    item_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("items.id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    low_stock_threshold: Mapped[Decimal | None] = mapped_column(Numeric(14, 3))
    remarks: Mapped[str | None] = mapped_column(String(300))

    store: Mapped[Store] = relationship("Store", lazy="selectin")
    item: Mapped[Item] = relationship("Item", lazy="selectin")


class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    store_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("stores.id", ondelete="RESTRICT"), nullable=False
    )
    item_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("items.id", ondelete="RESTRICT"), nullable=False
    )
    txn_type: Mapped[StockTxnType] = mapped_column(
        db_enum(StockTxnType, name="stock_txn_type"), nullable=False
    )
    quantity_delta: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    balance_after: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    source: Mapped[StockSource | None] = mapped_column(db_enum(StockSource, name="stock_source"))
    ref_type: Mapped[str | None] = mapped_column(String(50))
    ref_id: Mapped[int | None] = mapped_column(BigInteger)
    remarks: Mapped[str | None] = mapped_column(String(300))
    created_by_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    store: Mapped[Store] = relationship("Store", lazy="selectin")
    item: Mapped[Item] = relationship("Item", lazy="selectin")
