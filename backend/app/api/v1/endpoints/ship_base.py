"""Ship/Base Management routers: ship-base-categories and ship-bases."""

from app.api.v1.crud_router import make_crud_router
from app.core.permissions import Module
from app.schemas.ship_base import (
    ShipBaseCategoryCreate,
    ShipBaseCategoryRead,
    ShipBaseCategoryUpdate,
    ShipBaseCreate,
    ShipBaseRead,
    ShipBaseUpdate,
)
from app.services.ship_base import ShipBaseCategoryService, ShipBaseService

_OPTS = (
    Module.USER_MANAGEMENT,
    Module.ALLOCATION_SANCTION,
    Module.COMPILATION_VERIFICATION,
    Module.REPORT,
    Module.INVENTORY_MANAGEMENT,
)

ship_base_categories_router = make_crud_router(
    prefix="/ship-base-categories",
    tags=["ship-base-management"],
    module=Module.SHIP_BASE_MANAGEMENT,
    service_cls=ShipBaseCategoryService,
    read_schema=ShipBaseCategoryRead,
    create_schema=ShipBaseCategoryCreate,
    update_schema=ShipBaseCategoryUpdate,
    with_status=False,
    options_modules=_OPTS,
)
ship_bases_router = make_crud_router(
    prefix="/ship-bases",
    tags=["ship-base-management"],
    module=Module.SHIP_BASE_MANAGEMENT,
    service_cls=ShipBaseService,
    read_schema=ShipBaseRead,
    create_schema=ShipBaseCreate,
    update_schema=ShipBaseUpdate,
    options_modules=_OPTS,
)

routers = [ship_base_categories_router, ship_bases_router]
