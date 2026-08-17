"""Item management: ItemCategory, ItemUnit, Brand, ItemModel, Item."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import BigInteger, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base
from app.models.config import Country
from app.models.enums import FunctionalStatus, Status, db_enum


class ItemCategory(AuditMixin, Base):
    __tablename__ = "item_categories"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status", create_type=False), default=Status.ACTIVE
    )


class ItemUnit(AuditMixin, Base):
    __tablename__ = "item_units"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # "Unit ID"
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    unit_code: Mapped[str | None] = mapped_column(String(20))  # short symbol e.g. "Nos", "Mtr"
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status", create_type=False), default=Status.ACTIVE
    )


class Brand(AuditMixin, Base):
    __tablename__ = "brands"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status", create_type=False), default=Status.ACTIVE
    )


class ItemModel(AuditMixin, Base):
    __tablename__ = "item_models"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    brand_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("brands.id", ondelete="SET NULL"))
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status", create_type=False), default=Status.ACTIVE
    )

    brand: Mapped[Brand | None] = relationship("Brand", lazy="selectin")


class Item(AuditMixin, Base):
    __tablename__ = "items"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # "Item ID"
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("item_categories.id", ondelete="RESTRICT"), nullable=False
    )
    unit_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("item_units.id", ondelete="SET NULL"))
    brand_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("brands.id", ondelete="SET NULL"))
    model_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("item_models.id", ondelete="SET NULL")
    )
    oem: Mapped[str | None] = mapped_column(String(200))
    warranty_months: Mapped[int | None] = mapped_column(Integer)
    country_of_manufacture_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("countries.id", ondelete="SET NULL")
    )
    country_of_origin_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("countries.id", ondelete="SET NULL")
    )
    procurement_year: Mapped[int | None] = mapped_column(Integer)
    item_type: Mapped[str | None] = mapped_column(String(100))
    local_supplier: Mapped[str | None] = mapped_column(String(200))
    principal: Mapped[str | None] = mapped_column(String(200))
    year_of_manufacture: Mapped[int | None] = mapped_column(Integer)
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    functional_status: Mapped[FunctionalStatus | None] = mapped_column(
        db_enum(FunctionalStatus, name="functional_status"), nullable=True
    )
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status", create_type=False), default=Status.ACTIVE
    )

    category: Mapped[ItemCategory] = relationship("ItemCategory", lazy="selectin")
    unit: Mapped[ItemUnit | None] = relationship("ItemUnit", lazy="selectin")
    brand: Mapped[Brand | None] = relationship("Brand", lazy="selectin")
    model: Mapped[ItemModel | None] = relationship("ItemModel", lazy="selectin")
    country_of_manufacture: Mapped[Country | None] = relationship(
        "Country", lazy="selectin", foreign_keys=[country_of_manufacture_id]
    )
    country_of_origin: Mapped[Country | None] = relationship(
        "Country", lazy="selectin", foreign_keys=[country_of_origin_id]
    )
