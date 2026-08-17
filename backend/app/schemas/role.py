"""User Management schemas: Module, Role + permission matrix (Figma "Assign Permission")."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import Status
from app.schemas.common import AuditFields, ORMModel


class ModuleRead(ORMModel):
    id: int
    code: str
    name: str
    sort_order: int


class PermissionInput(BaseModel):
    """One matrix row as sent by the UI (Menu | Edit | List | Add | Delete | View)."""

    module_code: str = Field(..., min_length=1, max_length=50)
    menu: bool = False
    list: bool = False
    view: bool = False
    add: bool = False
    edit: bool = False
    delete: bool = False


class PermissionRead(ORMModel):
    module: ModuleRead
    can_menu: bool
    can_list: bool
    can_view: bool
    can_add: bool
    can_edit: bool
    can_delete: bool


class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=300)
    status: Status = Status.ACTIVE
    permissions: list[PermissionInput] = []


class RoleUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=300)
    status: Status | None = None
    permissions: list[PermissionInput] | None = None


class RolePermissionsUpdate(BaseModel):
    permissions: list[PermissionInput]


class RoleRead(AuditFields):
    id: int
    name: str
    description: str | None = None
    status: Status
    is_system: bool
    permissions: list[PermissionRead] = []
