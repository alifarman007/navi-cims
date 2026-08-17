"""Item Management routers: brands (reference), item categories, item units, models, items."""

from app.api.v1.crud_router import make_crud_router
from app.core.permissions import Module
from app.schemas.item import (
    BrandCreate,
    BrandRead,
    BrandUpdate,
    ItemCategoryCreate,
    ItemCategoryRead,
    ItemCategoryUpdate,
    ItemCreate,
    ItemModelCreate,
    ItemModelRead,
    ItemModelUpdate,
    ItemRead,
    ItemUnitCreate,
    ItemUnitRead,
    ItemUnitUpdate,
    ItemUpdate,
)
from app.services.item import (
    BrandService,
    ItemCategoryService,
    ItemModelService,
    ItemService,
    ItemUnitService,
)

_OPTS = (
    Module.INVENTORY_MANAGEMENT,
    Module.ALLOCATION_SANCTION,
    Module.COMPILATION_VERIFICATION,
    Module.REPORT,
)

brands_router = make_crud_router(
    prefix="/brands",
    tags=["item-management"],
    module=Module.ITEM_MANAGEMENT,
    service_cls=BrandService,
    read_schema=BrandRead,
    create_schema=BrandCreate,
    update_schema=BrandUpdate,
)
item_categories_router = make_crud_router(
    prefix="/item-categories",
    tags=["item-management"],
    module=Module.ITEM_MANAGEMENT,
    service_cls=ItemCategoryService,
    read_schema=ItemCategoryRead,
    create_schema=ItemCategoryCreate,
    update_schema=ItemCategoryUpdate,
    options_modules=_OPTS,
)
item_units_router = make_crud_router(
    prefix="/item-units",
    tags=["item-management"],
    module=Module.ITEM_MANAGEMENT,
    service_cls=ItemUnitService,
    read_schema=ItemUnitRead,
    create_schema=ItemUnitCreate,
    update_schema=ItemUnitUpdate,
)
item_models_router = make_crud_router(
    prefix="/item-models",
    tags=["item-management"],
    module=Module.ITEM_MANAGEMENT,
    service_cls=ItemModelService,
    read_schema=ItemModelRead,
    create_schema=ItemModelCreate,
    update_schema=ItemModelUpdate,
)
items_router = make_crud_router(
    prefix="/items",
    tags=["item-management"],
    module=Module.ITEM_MANAGEMENT,
    service_cls=ItemService,
    read_schema=ItemRead,
    create_schema=ItemCreate,
    update_schema=ItemUpdate,
    options_modules=_OPTS,
)

routers = [brands_router, item_categories_router, item_units_router, item_models_router, items_router]
