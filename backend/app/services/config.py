"""Configuration (master data) services: Country, Division, District, Upazila, Office, Appointment, Rank, FiscalYear."""

from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError
from app.models.config import Appointment, Country, District, Division, FiscalYear, Office, Rank, Upazila
from app.models.item import Item
from app.models.user import User
from app.schemas.config import (
    AppointmentCreate,
    AppointmentUpdate,
    CountryCreate,
    CountryUpdate,
    DistrictCreate,
    DistrictUpdate,
    DivisionCreate,
    DivisionUpdate,
    OfficeCreate,
    OfficeUpdate,
    RankCreate,
    RankUpdate,
    UpazilaCreate,
    UpazilaUpdate,
)
from app.services.crud_base import CRUDService
from app.utils.query import ListParams, build_filters, build_search, combine, parse_sort


class CountryService(CRUDService[Country, CountryCreate, CountryUpdate]):
    model = Country
    entity_name = "Country"
    filterable = {"name": Country.name, "code": Country.code, "gmt": Country.gmt}
    sortable = {
        "id": Country.id,
        "name": Country.name,
        "code": Country.code,
        "gmt": Country.gmt,
        "created_at": Country.created_at,
    }
    search_fields = [Country.name, Country.code]
    unique_fields = ("name",)
    default_sort = "name:asc"
    referenced_by = (
        (Item, Item.country_of_manufacture_id),
        (Item, Item.country_of_origin_id),
        (Office, Office.country_id),
    )

    def option_label(self, obj: Country) -> str:  # plain name (code is an ISO code, not a business id)
        return obj.name


class DivisionService(CRUDService[Division, DivisionCreate, DivisionUpdate]):
    model = Division
    entity_name = "Division"
    filterable = {"name": Division.name, "name_bn": Division.name_bn}
    sortable = {
        "id": Division.id,
        "name": Division.name,
        "name_bn": Division.name_bn,
        "created_at": Division.created_at,
    }
    search_fields = [Division.name, Division.name_bn]
    unique_fields = ("name",)
    default_sort = "name:asc"
    referenced_by = ((District, District.division_id), (Office, Office.division_id))


class DistrictService(CRUDService[District, DistrictCreate, DistrictUpdate]):
    model = District
    entity_name = "District"
    filterable = {
        "name": District.name,
        "name_bn": District.name_bn,
        "division_id": District.division_id,
        "division": Division.name,
    }
    sortable = {
        "id": District.id,
        "name": District.name,
        "name_bn": District.name_bn,
        "division": Division.name,
        "created_at": District.created_at,
    }
    search_fields = [District.name, District.name_bn]
    unique_fields = ()  # uniqueness is (division_id, name) -> checked in before_create/before_update
    default_sort = "name:asc"
    referenced_by = ((Upazila, Upazila.district_id), (Office, Office.district_id))

    def base_query(self):
        return select(District).outerjoin(Division, District.division_id == Division.id)

    async def _check_pair_unique(self, division_id: int, name: str, exclude_id: int | None = None) -> None:
        stmt = select(District.id).where(District.division_id == division_id, District.name == name)
        if exclude_id is not None:
            stmt = stmt.where(District.id != exclude_id)
        if (await self.db.execute(stmt)).first():
            raise ConflictError(f"District '{name}' already exists in this division")

    async def before_create(self, data: dict[str, Any]) -> dict[str, Any]:
        await self._check_pair_unique(data["division_id"], data["name"])
        return data

    async def before_update(self, obj: District, data: dict[str, Any]) -> dict[str, Any]:
        await self._check_pair_unique(
            data.get("division_id", obj.division_id), data.get("name", obj.name), obj.id
        )
        return data

    async def options(
        self, q: str | None = None, limit: int = 50, division_id: int | None = None
    ) -> list[dict[str, Any]]:
        stmt = select(District)
        if division_id is not None:
            stmt = stmt.where(District.division_id == division_id)
        if q:
            stmt = stmt.where(build_search(q, [District.name]))
        stmt = stmt.order_by(District.name.asc()).limit(limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [{"id": r.id, "label": r.name} for r in rows]


class UpazilaService(CRUDService[Upazila, UpazilaCreate, UpazilaUpdate]):
    model = Upazila
    entity_name = "Upazila"
    filterable = {
        "name": Upazila.name,
        "name_bn": Upazila.name_bn,
        "district_id": Upazila.district_id,
        "district": District.name,
        "division": Division.name,
    }
    sortable = {
        "id": Upazila.id,
        "name": Upazila.name,
        "name_bn": Upazila.name_bn,
        "district": District.name,
        "division": Division.name,
        "created_at": Upazila.created_at,
    }
    search_fields = [Upazila.name, Upazila.name_bn]
    unique_fields = ()
    default_sort = "name:asc"

    def base_query(self):
        return (
            select(Upazila)
            .outerjoin(District, Upazila.district_id == District.id)
            .outerjoin(Division, District.division_id == Division.id)
        )

    async def _check_pair_unique(self, district_id: int, name: str, exclude_id: int | None = None) -> None:
        stmt = select(Upazila.id).where(Upazila.district_id == district_id, Upazila.name == name)
        if exclude_id is not None:
            stmt = stmt.where(Upazila.id != exclude_id)
        if (await self.db.execute(stmt)).first():
            raise ConflictError(f"Upazila '{name}' already exists in this district")

    async def before_create(self, data: dict[str, Any]) -> dict[str, Any]:
        await self._check_pair_unique(data["district_id"], data["name"])
        return data

    async def before_update(self, obj: Upazila, data: dict[str, Any]) -> dict[str, Any]:
        await self._check_pair_unique(
            data.get("district_id", obj.district_id), data.get("name", obj.name), obj.id
        )
        return data

    async def options(
        self, q: str | None = None, limit: int = 50, district_id: int | None = None
    ) -> list[dict[str, Any]]:
        stmt = select(Upazila)
        if district_id is not None:
            stmt = stmt.where(Upazila.district_id == district_id)
        if q:
            stmt = stmt.where(build_search(q, [Upazila.name]))
        stmt = stmt.order_by(Upazila.name.asc()).limit(limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [{"id": r.id, "label": r.name} for r in rows]


class OfficeService(CRUDService[Office, OfficeCreate, OfficeUpdate]):
    model = Office
    entity_name = "Office"
    filterable = {
        "code": Office.code,
        "name": Office.name,
        "office_type": Office.office_type,
        "status": Office.status,
        "country_id": Office.country_id,
        "division_id": Office.division_id,
        "district_id": Office.district_id,
        "country": Country.name,
        "division": Division.name,
        "district": District.name,
    }
    sortable = {
        "id": Office.id,
        "code": Office.code,
        "name": Office.name,
        "office_type": Office.office_type,
        "status": Office.status,
        "country": Country.name,
        "division": Division.name,
        "district": District.name,
        "created_at": Office.created_at,
    }
    search_fields = [Office.code, Office.name, Office.address]
    unique_fields = ("code",)
    referenced_by = ((User, User.office_id),)

    def base_query(self):
        return (
            select(Office)
            .outerjoin(Country, Office.country_id == Country.id)
            .outerjoin(Division, Office.division_id == Division.id)
            .outerjoin(District, Office.district_id == District.id)
        )


class AppointmentService(CRUDService[Appointment, AppointmentCreate, AppointmentUpdate]):
    model = Appointment
    entity_name = "Appointment"
    filterable = {"name": Appointment.name, "status": Appointment.status}
    sortable = {
        "id": Appointment.id,
        "name": Appointment.name,
        "status": Appointment.status,
        "created_at": Appointment.created_at,
    }
    search_fields = [Appointment.name]
    unique_fields = ("name",)
    referenced_by = ()


class RankService(CRUDService[Rank, RankCreate, RankUpdate]):
    model = Rank
    entity_name = "Rank"
    filterable = {"name": Rank.name, "name_bn": Rank.name_bn, "priority": Rank.priority}
    sortable = {
        "id": Rank.id,
        "name": Rank.name,
        "name_bn": Rank.name_bn,
        "priority": Rank.priority,
        "created_at": Rank.created_at,
    }
    search_fields = [Rank.name, Rank.name_bn]
    unique_fields = ("name",)
    default_sort = "priority:asc"
    referenced_by = ()


# ---- Fiscal years (read-only, seeded) --------------------------------------------
class FiscalYearService:
    sortable = {
        "id": FiscalYear.id,
        "name": FiscalYear.name,
        "start_date": FiscalYear.start_date,
        "end_date": FiscalYear.end_date,
        "is_current": FiscalYear.is_current,
    }
    filterable = {"name": FiscalYear.name, "is_current": FiscalYear.is_current}

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, params: ListParams) -> tuple[list[FiscalYear], int]:
        stmt = select(FiscalYear)
        where = combine(*build_filters(params.filters, self.filterable))
        if where is not None:
            stmt = stmt.where(where)
        total = (await self.db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
        stmt = stmt.order_by(parse_sort(params.sort, self.sortable, "start_date:desc"), FiscalYear.id.desc())
        stmt = stmt.offset(params.offset).limit(params.page_size)
        rows = (await self.db.execute(stmt)).scalars().all()
        return list(rows), int(total)

    async def options(self) -> list[dict[str, Any]]:
        stmt = select(FiscalYear).order_by(FiscalYear.is_current.desc(), FiscalYear.start_date.desc())
        rows = (await self.db.execute(stmt)).scalars().all()
        return [{"id": r.id, "label": r.name} for r in rows]

    async def current(self) -> FiscalYear | None:
        row = (
            (await self.db.execute(select(FiscalYear).where(FiscalYear.is_current.is_(True))))
            .scalars()
            .first()
        )
        if row is None:  # fall back to the fiscal year containing today
            today = date.today()
            row = (
                (
                    await self.db.execute(
                        select(FiscalYear).where(FiscalYear.start_date <= today, FiscalYear.end_date >= today)
                    )
                )
                .scalars()
                .first()
            )
        return row
