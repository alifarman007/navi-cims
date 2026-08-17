"""Configuration routers: /config/{countries,divisions,districts,upazilas,offices,appointments,ranks} + /fiscal-years."""

# NOTE: no `from __future__ import annotations` (crud router relies on runtime annotations).
from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.v1.crud_router import make_crud_router
from app.core.deps import DB, ClientIP, CurrentUser, has_permission
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.permissions import Action, Module
from app.schemas.common import IdLabel, Page
from app.schemas.config import (
    OFFICE_TYPES,
    AppointmentCreate,
    AppointmentRead,
    AppointmentUpdate,
    CountryCreate,
    CountryRead,
    CountryUpdate,
    DistrictCreate,
    DistrictRead,
    DistrictUpdate,
    DivisionCreate,
    DivisionRead,
    DivisionUpdate,
    FiscalYearRead,
    OfficeCreate,
    OfficeRead,
    OfficeUpdate,
    RankCreate,
    RankRead,
    RankUpdate,
    UpazilaCreate,
    UpazilaRead,
    UpazilaUpdate,
)
from app.services.config import (
    AppointmentService,
    CountryService,
    DistrictService,
    DivisionService,
    FiscalYearService,
    OfficeService,
    RankService,
    UpazilaService,
)
from app.services.crud_base import paginate
from app.utils.query import ListParams

TAGS = ["configuration"]
_OPTS = (
    Module.USER_MANAGEMENT,
    Module.ITEM_MANAGEMENT,
    Module.SHIP_BASE_MANAGEMENT,
    Module.INVENTORY_MANAGEMENT,
    Module.ALLOCATION_SANCTION,
    Module.COMPILATION_VERIFICATION,
    Module.REPORT,
)


def _options_allowed(user: Any) -> None:
    if not (
        has_permission(user, Module.CONFIGURATION, Action.LIST)
        or any(has_permission(user, m, Action.LIST) for m in _OPTS)
    ):
        raise ForbiddenError(f"Permission denied: {Module.CONFIGURATION}.list")


# ---- custom routes (declared BEFORE the crud routers so they win path matching) --------
config_router = APIRouter(prefix="/config", tags=TAGS)


@config_router.get("/districts/options", response_model=list[IdLabel])
async def district_options(
    db: DB,
    user: CurrentUser,
    ip: ClientIP,
    q: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    division_id: int | None = Query(None, description="restrict to a division"),
):
    _options_allowed(user)
    return await DistrictService(db, user_id=user.id, ip=ip).options(
        q=q, limit=limit, division_id=division_id
    )


@config_router.get("/upazilas/options", response_model=list[IdLabel])
async def upazila_options(
    db: DB,
    user: CurrentUser,
    ip: ClientIP,
    q: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    district_id: int | None = Query(None, description="restrict to a district"),
):
    _options_allowed(user)
    return await UpazilaService(db, user_id=user.id, ip=ip).options(q=q, limit=limit, district_id=district_id)


@config_router.get("/office-types", response_model=list[str])
async def office_types(user: CurrentUser):
    """Static list of office types (HQ, Directorate, Command, Base, Depot, Other)."""
    return list(OFFICE_TYPES)


# ---- fiscal years (read-only; any authenticated user) --------------------------------
fiscal_router = APIRouter(prefix="/fiscal-years", tags=TAGS)


@fiscal_router.get("", response_model=Page[FiscalYearRead])
async def list_fiscal_years(db: DB, user: CurrentUser, params: ListParams = Depends()):
    rows, total = await FiscalYearService(db).list(params)
    return paginate([FiscalYearRead.model_validate(r) for r in rows], total, params)


@fiscal_router.get("/options", response_model=list[IdLabel])
async def fiscal_year_options(db: DB, user: CurrentUser):
    return await FiscalYearService(db).options()


@fiscal_router.get("/current", response_model=FiscalYearRead)
async def current_fiscal_year(db: DB, user: CurrentUser):
    row = await FiscalYearService(db).current()
    if row is None:
        raise NotFoundError("Current fiscal year")
    return FiscalYearRead.model_validate(row)


@fiscal_router.get("/{fy_id}", response_model=FiscalYearRead)
async def get_fiscal_year(fy_id: int, db: DB, user: CurrentUser):
    from sqlalchemy import select

    from app.models.config import FiscalYear

    row = (await db.execute(select(FiscalYear).where(FiscalYear.id == fy_id))).scalars().first()
    if row is None:
        raise NotFoundError("Fiscal year", fy_id)
    return FiscalYearRead.model_validate(row)


# ---- crud routers ------------------------------------------------------------------------
def _crud(prefix, service_cls, read, create, update, *, with_status=False):
    return make_crud_router(
        prefix=f"/config{prefix}",
        tags=TAGS,
        module=Module.CONFIGURATION,
        service_cls=service_cls,
        read_schema=read,
        create_schema=create,
        update_schema=update,
        with_status=with_status,
        options_modules=_OPTS,
    )


countries_router = _crud("/countries", CountryService, CountryRead, CountryCreate, CountryUpdate)
divisions_router = _crud("/divisions", DivisionService, DivisionRead, DivisionCreate, DivisionUpdate)
districts_router = _crud("/districts", DistrictService, DistrictRead, DistrictCreate, DistrictUpdate)
upazilas_router = _crud("/upazilas", UpazilaService, UpazilaRead, UpazilaCreate, UpazilaUpdate)
offices_router = _crud("/offices", OfficeService, OfficeRead, OfficeCreate, OfficeUpdate, with_status=True)
appointments_router = _crud(
    "/appointments",
    AppointmentService,
    AppointmentRead,
    AppointmentCreate,
    AppointmentUpdate,
    with_status=True,
)
ranks_router = _crud("/ranks", RankService, RankRead, RankCreate, RankUpdate)

# order matters: custom routes first
routers = [
    config_router,
    fiscal_router,
    countries_router,
    divisions_router,
    districts_router,
    upazilas_router,
    offices_router,
    appointments_router,
    ranks_router,
]
