from __future__ import annotations

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base
from app.models.enums import ShipBaseType, Status, db_enum


class ShipBaseCategory(AuditMixin, Base):
    __tablename__ = "ship_base_categories"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)


class ShipBase(AuditMixin, Base):
    __tablename__ = "ship_bases"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    type: Mapped[ShipBaseType] = mapped_column(db_enum(ShipBaseType, name="ship_base_type"), nullable=False)
    category_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("ship_base_categories.id", ondelete="SET NULL")
    )
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status", create_type=False), default=Status.ACTIVE
    )

    category: Mapped[ShipBaseCategory | None] = relationship("ShipBaseCategory", lazy="selectin")
