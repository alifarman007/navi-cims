"""Item Management services. BrandService is the reference for all simple masters."""

from __future__ import annotations

from app.models.item import Brand, Item, ItemCategory, ItemModel, ItemUnit
from app.schemas.item import (
    BrandCreate,
    BrandUpdate,
    ItemCategoryCreate,
    ItemCategoryUpdate,
    ItemCreate,
    ItemModelCreate,
    ItemModelUpdate,
    ItemUnitCreate,
    ItemUnitUpdate,
    ItemUpdate,
)
from app.services.crud_base import CRUDService


class BrandService(CRUDService[Brand, BrandCreate, BrandUpdate]):
    model = Brand
    entity_name = "Brand"
    filterable = {"code": Brand.code, "name": Brand.name, "status": Brand.status}
    sortable = {
        "id": Brand.id,
        "code": Brand.code,
        "name": Brand.name,
        "status": Brand.status,
        "created_at": Brand.created_at,
    }
    search_fields = [Brand.code, Brand.name]
    unique_fields = ("code",)
    referenced_by = ((Item, Item.brand_id), (ItemModel, ItemModel.brand_id))


class ItemCategoryService(CRUDService[ItemCategory, ItemCategoryCreate, ItemCategoryUpdate]):
    model = ItemCategory
    entity_name = "Item Category"
    filterable = {"code": ItemCategory.code, "name": ItemCategory.name, "status": ItemCategory.status}
    sortable = {
        "id": ItemCategory.id,
        "code": ItemCategory.code,
        "name": ItemCategory.name,
        "status": ItemCategory.status,
        "created_at": ItemCategory.created_at,
    }
    search_fields = [ItemCategory.code, ItemCategory.name]
    referenced_by = ((Item, Item.category_id),)


class ItemUnitService(CRUDService[ItemUnit, ItemUnitCreate, ItemUnitUpdate]):
    model = ItemUnit
    entity_name = "Item Unit"
    filterable = {
        "code": ItemUnit.code,
        "name": ItemUnit.name,
        "unit_code": ItemUnit.unit_code,
        "status": ItemUnit.status,
    }
    sortable = {
        "id": ItemUnit.id,
        "code": ItemUnit.code,
        "name": ItemUnit.name,
        "unit_code": ItemUnit.unit_code,
        "status": ItemUnit.status,
        "created_at": ItemUnit.created_at,
    }
    search_fields = [ItemUnit.code, ItemUnit.name, ItemUnit.unit_code]
    referenced_by = ((Item, Item.unit_id),)


class ItemModelService(CRUDService[ItemModel, ItemModelCreate, ItemModelUpdate]):
    model = ItemModel
    entity_name = "Model"
    filterable = {
        "code": ItemModel.code,
        "name": ItemModel.name,
        "brand_id": ItemModel.brand_id,
        "brand": Brand.name,
        "status": ItemModel.status,
    }
    sortable = {
        "id": ItemModel.id,
        "code": ItemModel.code,
        "name": ItemModel.name,
        "brand": Brand.name,
        "status": ItemModel.status,
        "created_at": ItemModel.created_at,
    }
    search_fields = [ItemModel.code, ItemModel.name]
    referenced_by = ((Item, Item.model_id),)

    def base_query(self):
        from sqlalchemy import select

        return select(ItemModel).outerjoin(Brand, ItemModel.brand_id == Brand.id)


class ItemService(CRUDService[Item, ItemCreate, ItemUpdate]):
    model = Item
    entity_name = "Item"
    filterable = {
        "code": Item.code,
        "name": Item.name,
        "category_id": Item.category_id,
        "brand_id": Item.brand_id,
        "model_id": Item.model_id,
        "unit_id": Item.unit_id,
        "oem": Item.oem,
        "procurement_year": Item.procurement_year,
        "status": Item.status,
        "functional_status": Item.functional_status,
        "brand": Brand.name,
        "model": ItemModel.name,
        "category": ItemCategory.name,
    }
    sortable = {
        "id": Item.id,
        "code": Item.code,
        "name": Item.name,
        "oem": Item.oem,
        "procurement_year": Item.procurement_year,
        "status": Item.status,
        "brand": Brand.name,
        "model": ItemModel.name,
        "category": ItemCategory.name,
        "created_at": Item.created_at,
    }
    search_fields = [Item.code, Item.name, Item.oem]

    def base_query(self):
        from sqlalchemy import select

        return (
            select(Item)
            .outerjoin(Brand, Item.brand_id == Brand.id)
            .outerjoin(ItemModel, Item.model_id == ItemModel.id)
            .join(ItemCategory, Item.category_id == ItemCategory.id)
        )

    async def before_delete(self, obj: Item) -> None:
        from sqlalchemy import func, select

        from app.core.exceptions import ConflictError
        from app.models.allocation import Allocation
        from app.models.inventory import Stock

        for ref_model, col, what in (
            (Stock, Stock.item_id, "stock records"),
            (Allocation, Allocation.item_id, "allocations"),
        ):
            n = (
                await self.db.execute(select(func.count()).select_from(ref_model).where(col == obj.id))
            ).scalar_one()
            if n:
                raise ConflictError(f"Cannot delete Item: referenced by {n} {what}")
