"""Item Management schemas: Brand (reference pattern), ItemCategory, ItemUnit, ItemModel, Item."""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import FunctionalStatus, Status
from app.schemas.common import AuditFields, ORMModel, Ref


# ---- Brand (REFERENCE PATTERN for every simple master) -----------------------
class BrandBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, description="Brand ID (business code)")
    name: str = Field(..., min_length=1, max_length=150)
    status: Status = Status.ACTIVE


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=150)
    status: Status | None = None


class BrandRead(AuditFields):
    id: int
    code: str
    name: str
    status: Status


# ---- Item Category ---------------------------------------------------------------
class ItemCategoryCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=150)
    status: Status = Status.ACTIVE


class ItemCategoryUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=150)
    status: Status | None = None


class ItemCategoryRead(AuditFields):
    id: int
    code: str
    name: str
    status: Status


# ---- Item Unit -------------------------------------------------------------------
class ItemUnitCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, description="Unit ID")
    name: str = Field(..., min_length=1, max_length=100)
    unit_code: str | None = Field(None, max_length=20)
    status: Status = Status.ACTIVE


class ItemUnitUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=100)
    unit_code: str | None = Field(None, max_length=20)
    status: Status | None = None


class ItemUnitRead(AuditFields):
    id: int
    code: str
    name: str
    unit_code: str | None = None
    status: Status


# ---- Item Model ------------------------------------------------------------------
class ItemModelCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=150)
    brand_id: int | None = None
    status: Status = Status.ACTIVE


class ItemModelUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=150)
    brand_id: int | None = None
    status: Status | None = None


class ItemModelRead(AuditFields):
    id: int
    code: str
    name: str
    brand_id: int | None = None
    brand: Ref | None = None
    status: Status


# ---- Item ------------------------------------------------------------------------
class ItemBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, description="Item ID")
    name: str = Field(..., min_length=1, max_length=200)
    category_id: int
    unit_id: int | None = None
    brand_id: int | None = None
    model_id: int | None = None
    oem: str | None = Field(None, max_length=200)
    warranty_months: int | None = Field(None, ge=0, le=1200)
    country_of_manufacture_id: int | None = None
    country_of_origin_id: int | None = None
    procurement_year: int | None = Field(None, ge=1900, le=2100)
    item_type: str | None = Field(None, max_length=100)
    local_supplier: str | None = Field(None, max_length=200)
    principal: str | None = Field(None, max_length=200)
    year_of_manufacture: int | None = Field(None, ge=1900, le=2100)
    unit_price: Decimal | None = Field(None, ge=0)
    functional_status: FunctionalStatus | None = None
    status: Status = Status.ACTIVE


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=200)
    category_id: int | None = None
    unit_id: int | None = None
    brand_id: int | None = None
    model_id: int | None = None
    oem: str | None = Field(None, max_length=200)
    warranty_months: int | None = Field(None, ge=0, le=1200)
    country_of_manufacture_id: int | None = None
    country_of_origin_id: int | None = None
    procurement_year: int | None = Field(None, ge=1900, le=2100)
    item_type: str | None = Field(None, max_length=100)
    local_supplier: str | None = Field(None, max_length=200)
    principal: str | None = Field(None, max_length=200)
    year_of_manufacture: int | None = Field(None, ge=1900, le=2100)
    unit_price: Decimal | None = Field(None, ge=0)
    functional_status: FunctionalStatus | None = None
    status: Status | None = None


class ItemRead(AuditFields):
    id: int
    code: str
    name: str
    category_id: int
    unit_id: int | None = None
    brand_id: int | None = None
    model_id: int | None = None
    oem: str | None = None
    warranty_months: int | None = None
    country_of_manufacture_id: int | None = None
    country_of_origin_id: int | None = None
    procurement_year: int | None = None
    item_type: str | None = None
    local_supplier: str | None = None
    principal: str | None = None
    year_of_manufacture: int | None = None
    unit_price: Decimal | None = None
    functional_status: FunctionalStatus | None = None
    status: Status
    category: Ref | None = None
    unit: Ref | None = None
    brand: Ref | None = None
    model: Ref | None = None
    country_of_manufacture: Ref | None = None
    country_of_origin: Ref | None = None


class ItemOption(ORMModel):
    id: int
    label: str
