"""Master data configuration: Country, Division, District, Upazila, Office, Appointment, Rank, FiscalYear."""

from __future__ import annotations

from datetime import date

from sqlalchemy import BigInteger, Boolean, Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base
from app.models.enums import Status, db_enum


class Country(AuditMixin, Base):
    __tablename__ = "countries"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str | None] = mapped_column(String(10))
    gmt: Mapped[str | None] = mapped_column(String(20))


class Division(AuditMixin, Base):
    __tablename__ = "divisions"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name_bn: Mapped[str | None] = mapped_column(String(100))


class District(AuditMixin, Base):
    __tablename__ = "districts"
    __table_args__ = (UniqueConstraint("division_id", "name", name="uq_districts_division_name"),)

    division_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("divisions.id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_bn: Mapped[str | None] = mapped_column(String(100))

    division: Mapped[Division] = relationship("Division", lazy="selectin")


class Upazila(AuditMixin, Base):
    __tablename__ = "upazilas"
    __table_args__ = (UniqueConstraint("district_id", "name", name="uq_upazilas_district_name"),)

    district_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("districts.id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_bn: Mapped[str | None] = mapped_column(String(100))

    district: Mapped[District] = relationship("District", lazy="selectin")


class Office(AuditMixin, Base):
    __tablename__ = "offices"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    office_type: Mapped[str | None] = mapped_column(String(50))
    country_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("countries.id", ondelete="SET NULL")
    )
    division_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("divisions.id", ondelete="SET NULL")
    )
    district_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("districts.id", ondelete="SET NULL")
    )
    address: Mapped[str | None] = mapped_column(String(300))
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status", create_type=False), default=Status.ACTIVE
    )

    country: Mapped[Country | None] = relationship("Country", lazy="selectin")
    division: Mapped[Division | None] = relationship("Division", lazy="selectin")
    district: Mapped[District | None] = relationship("District", lazy="selectin")


class Appointment(AuditMixin, Base):
    __tablename__ = "appointments"

    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    status: Mapped[Status] = mapped_column(
        db_enum(Status, name="status", create_type=False), default=Status.ACTIVE
    )


class Rank(AuditMixin, Base):
    __tablename__ = "ranks"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name_bn: Mapped[str | None] = mapped_column(String(100))
    priority: Mapped[int | None] = mapped_column(Integer)


class FiscalYear(Base):
    __tablename__ = "fiscal_years"

    name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # "2025-2026"
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
