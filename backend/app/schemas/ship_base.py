"""Ship/Base Management schemas: ShipBaseCategory and ShipBase."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import ShipBaseType, Status
from app.schemas.common import AuditFields, Ref


# ---- Ship/Base Category ----------------------------------------------------------
class ShipBaseCategoryCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, description="Category ID (business code)")
    name: str = Field(..., min_length=1, max_length=150, description="Category Name")


class ShipBaseCategoryUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=150)


class ShipBaseCategoryRead(AuditFields):
    id: int
    code: str
    name: str


# ---- Ship/Base ---------------------------------------------------------------------
class ShipBaseCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, description="Ship/Base ID (business code)")
    name: str = Field(..., min_length=1, max_length=150)
    type: ShipBaseType
    category_id: int | None = None
    status: Status = Status.ACTIVE


class ShipBaseUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=150)
    type: ShipBaseType | None = None
    category_id: int | None = None
    status: Status | None = None


class ShipBaseRead(AuditFields):
    id: int
    code: str
    name: str
    type: ShipBaseType
    category_id: int | None = None
    category: Ref | None = None
    status: Status
