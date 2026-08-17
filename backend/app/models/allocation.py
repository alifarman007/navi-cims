"""Allocation/Sanction and Compilation/Verification."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base
from app.models.config import FiscalYear
from app.models.enums import AllocationStatus, AllocationType, VerificationAction, db_enum
from app.models.inventory import Store
from app.models.item import Item
from app.models.ship_base import ShipBase
from app.models.user import User


class Allocation(AuditMixin, Base):
    __tablename__ = "allocations"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # "ID" on the form
    allocation_type: Mapped[AllocationType] = mapped_column(
        db_enum(AllocationType, name="allocation_type"), nullable=False
    )
    fiscal_year_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("fiscal_years.id", ondelete="RESTRICT"), nullable=False
    )
    allocation_date: Mapped[date] = mapped_column(Date, nullable=False)
    store_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("stores.id", ondelete="RESTRICT"), nullable=False
    )
    item_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("items.id", ondelete="RESTRICT"), nullable=False
    )
    ship_base_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("ship_bases.id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    status: Mapped[AllocationStatus] = mapped_column(
        db_enum(AllocationStatus, name="allocation_status"), default=AllocationStatus.PENDING, nullable=False
    )
    remarks: Mapped[str | None] = mapped_column(String(500))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_by_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL")
    )

    fiscal_year: Mapped[FiscalYear] = relationship("FiscalYear", lazy="selectin")
    store: Mapped[Store] = relationship("Store", lazy="selectin")
    item: Mapped[Item] = relationship("Item", lazy="selectin")
    ship_base: Mapped[ShipBase] = relationship("ShipBase", lazy="selectin")
    approved_by: Mapped[User | None] = relationship("User", lazy="selectin", foreign_keys=[approved_by_id])
    verifications: Mapped[list[Verification]] = relationship(
        "Verification", back_populates="allocation", lazy="selectin", order_by="Verification.id"
    )


class Verification(AuditMixin, Base):
    __tablename__ = "verifications"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    allocation_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("allocations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    approver_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    action: Mapped[VerificationAction] = mapped_column(
        db_enum(VerificationAction, name="verification_action"), nullable=False
    )
    comment: Mapped[str | None] = mapped_column(String(500))
    acted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    allocation: Mapped[Allocation] = relationship("Allocation", back_populates="verifications")
    approver: Mapped[User] = relationship("User", lazy="selectin", foreign_keys=[approver_id])
