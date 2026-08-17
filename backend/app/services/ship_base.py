"""Ship/Base Management services."""

from __future__ import annotations

from sqlalchemy import select

from app.models.allocation import Allocation
from app.models.ship_base import ShipBase, ShipBaseCategory
from app.models.user import User
from app.schemas.ship_base import (
    ShipBaseCategoryCreate,
    ShipBaseCategoryUpdate,
    ShipBaseCreate,
    ShipBaseUpdate,
)
from app.services.crud_base import CRUDService


class ShipBaseCategoryService(CRUDService[ShipBaseCategory, ShipBaseCategoryCreate, ShipBaseCategoryUpdate]):
    model = ShipBaseCategory
    entity_name = "Ship/Base Category"
    filterable = {"code": ShipBaseCategory.code, "name": ShipBaseCategory.name}
    sortable = {
        "id": ShipBaseCategory.id,
        "code": ShipBaseCategory.code,
        "name": ShipBaseCategory.name,
        "created_at": ShipBaseCategory.created_at,
    }
    search_fields = [ShipBaseCategory.code, ShipBaseCategory.name]
    unique_fields = ("code",)
    referenced_by = ((ShipBase, ShipBase.category_id),)


class ShipBaseService(CRUDService[ShipBase, ShipBaseCreate, ShipBaseUpdate]):
    model = ShipBase
    entity_name = "Ship/Base"
    filterable = {
        "code": ShipBase.code,
        "name": ShipBase.name,
        "type": ShipBase.type,
        "category_id": ShipBase.category_id,
        "category": ShipBaseCategory.name,
        "status": ShipBase.status,
    }
    sortable = {
        "id": ShipBase.id,
        "code": ShipBase.code,
        "name": ShipBase.name,
        "type": ShipBase.type,
        "category": ShipBaseCategory.name,
        "status": ShipBase.status,
        "created_at": ShipBase.created_at,
    }
    search_fields = [ShipBase.code, ShipBase.name]
    unique_fields = ("code",)
    referenced_by = ((Allocation, Allocation.ship_base_id), (User, User.ship_base_id))

    def base_query(self):
        return select(ShipBase).outerjoin(ShipBaseCategory, ShipBase.category_id == ShipBaseCategory.id)
