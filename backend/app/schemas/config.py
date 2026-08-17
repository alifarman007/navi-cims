"""Configuration (master data) schemas: Country, Division, District, Upazila, Office, Appointment, Rank, FiscalYear."""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from app.models.enums import Status
from app.schemas.common import AuditFields, ORMModel, Ref

OfficeType = Literal["HQ", "Directorate", "Command", "Base", "Depot", "Other"]
OFFICE_TYPES: tuple[str, ...] = ("HQ", "Directorate", "Command", "Base", "Depot", "Other")


# ---- Country ---------------------------------------------------------------------
class CountryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str | None = Field(None, max_length=10)
    gmt: str | None = Field(None, max_length=20)


class CountryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, max_length=10)
    gmt: str | None = Field(None, max_length=20)


class CountryRead(AuditFields):
    id: int
    name: str
    code: str | None = None
    gmt: str | None = None


# ---- Division --------------------------------------------------------------------
class DivisionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    name_bn: str | None = Field(None, max_length=100)


class DivisionUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    name_bn: str | None = Field(None, max_length=100)


class DivisionRead(AuditFields):
    id: int
    name: str
    name_bn: str | None = None


# ---- District --------------------------------------------------------------------
class DistrictCreate(BaseModel):
    division_id: int
    name: str = Field(..., min_length=1, max_length=100)
    name_bn: str | None = Field(None, max_length=100)


class DistrictUpdate(BaseModel):
    division_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=100)
    name_bn: str | None = Field(None, max_length=100)


class DistrictRead(AuditFields):
    id: int
    division_id: int
    name: str
    name_bn: str | None = None
    division: Ref | None = None


# ---- Upazila ---------------------------------------------------------------------
class DistrictRef(ORMModel):
    """District reference that also carries its parent division (for display)."""

    id: int
    name: str
    division_id: int
    division: Ref | None = None


class UpazilaCreate(BaseModel):
    district_id: int
    name: str = Field(..., min_length=1, max_length=100)
    name_bn: str | None = Field(None, max_length=100)


class UpazilaUpdate(BaseModel):
    district_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=100)
    name_bn: str | None = Field(None, max_length=100)


class UpazilaRead(AuditFields):
    id: int
    district_id: int
    name: str
    name_bn: str | None = None
    district: DistrictRef | None = None


# ---- Office ----------------------------------------------------------------------
class OfficeBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, description="Office Code")
    name: str = Field(..., min_length=1, max_length=150)
    office_type: OfficeType
    country_id: int | None = None
    division_id: int | None = None
    district_id: int | None = None
    address: str | None = Field(None, max_length=300)
    status: Status = Status.ACTIVE


class OfficeCreate(OfficeBase):
    pass


class OfficeUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=150)
    office_type: OfficeType | None = None
    country_id: int | None = None
    division_id: int | None = None
    district_id: int | None = None
    address: str | None = Field(None, max_length=300)
    status: Status | None = None


class OfficeRead(AuditFields):
    id: int
    code: str
    name: str
    office_type: str | None = None
    country_id: int | None = None
    division_id: int | None = None
    district_id: int | None = None
    address: str | None = None
    status: Status
    country: Ref | None = None
    division: Ref | None = None
    district: Ref | None = None


# ---- Appointment -----------------------------------------------------------------
class AppointmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    status: Status = Status.ACTIVE


class AppointmentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    status: Status | None = None


class AppointmentRead(AuditFields):
    id: int
    name: str
    status: Status


# ---- Rank ------------------------------------------------------------------------
class RankCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    name_bn: str | None = Field(None, max_length=100)
    priority: int | None = Field(None, ge=0, le=100000)


class RankUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    name_bn: str | None = Field(None, max_length=100)
    priority: int | None = Field(None, ge=0, le=100000)


class RankRead(AuditFields):
    id: int
    name: str
    name_bn: str | None = None
    priority: int | None = None


# ---- Fiscal Year (read-only) -----------------------------------------------------
class FiscalYearRead(ORMModel):
    id: int
    name: str
    start_date: date
    end_date: date
    is_current: bool
