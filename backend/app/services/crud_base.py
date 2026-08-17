"""Generic async CRUD service with list (filter/sort/paginate/search), options, uniqueness and FK-in-use checks."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any, TypeVar

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from app.core.exceptions import ConflictError, NotFoundError
from app.db.base import Base
from app.services.audit import log_action
from app.utils.query import ListParams, build_filters, build_search, combine, parse_sort

ModelT = TypeVar("ModelT", bound=Base)
CreateT = TypeVar("CreateT", bound=BaseModel)
UpdateT = TypeVar("UpdateT", bound=BaseModel)


class CRUDService[ModelT: Base, CreateT: BaseModel, UpdateT: BaseModel]:
    """Subclass and set the class attributes. Everything is overridable."""

    model: type[ModelT]
    entity_name: str = "Resource"
    # field name -> column (also accepts dotted names like "brand.name" mapped to a joined column)
    filterable: dict[str, InstrumentedAttribute] = {}
    sortable: dict[str, InstrumentedAttribute] = {}
    search_fields: list[InstrumentedAttribute] = []
    default_sort: str = "id:desc"
    unique_fields: Sequence[str] = ("code",)
    label_field: str = "name"
    # optional list of (Model, fk_column) that reference this model -> block delete when in use
    referenced_by: Sequence[tuple[type[Base], InstrumentedAttribute]] = ()

    def __init__(self, db: AsyncSession, user_id: int | None = None, ip: str | None = None):
        self.db = db
        self.user_id = user_id
        self.ip = ip

    # ---- query hooks -------------------------------------------------------
    def base_query(self):
        return select(self.model)

    def apply_scope(self, stmt, params: ListParams):
        """Hook for row-level scoping (e.g. ship/base users see only their own rows)."""
        return stmt

    # ---- read ----------------------------------------------------------------
    async def list(self, params: ListParams) -> tuple[list[ModelT], int]:
        stmt = self.base_query()
        stmt = self.apply_scope(stmt, params)
        where = combine(
            *build_filters(params.filters, self.filterable), build_search(params.q, self.search_fields)
        )
        if where is not None:
            stmt = stmt.where(where)
        total = (
            await self.db.execute(select(func.count()).select_from(stmt.order_by(None).subquery()))
        ).scalar_one()
        stmt = stmt.order_by(parse_sort(params.sort, self.sortable, self.default_sort), self.model.id.desc())
        stmt = stmt.offset(params.offset).limit(params.page_size)
        rows = (await self.db.execute(stmt)).scalars().unique().all()
        return list(rows), int(total)

    async def get(self, obj_id: int) -> ModelT:
        obj = (await self.db.execute(self.base_query().where(self.model.id == obj_id))).scalars().first()
        if obj is None:
            raise NotFoundError(self.entity_name, obj_id)
        return obj

    async def options(self, q: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        label_col = getattr(self.model, self.label_field)
        stmt = select(self.model)
        status_col = getattr(self.model, "status", None)
        if status_col is not None:
            stmt = stmt.where(status_col == "active")
        if q:
            cols = [label_col] + ([self.model.code] if hasattr(self.model, "code") else [])
            stmt = stmt.where(build_search(q, cols))
        stmt = stmt.order_by(label_col.asc()).limit(limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [{"id": r.id, "label": self.option_label(r)} for r in rows]

    def option_label(self, obj: ModelT) -> str:
        code = getattr(obj, "code", None)
        name = getattr(obj, self.label_field, "")
        return f"{code} - {name}" if code else str(name)

    # ---- write ---------------------------------------------------------------
    async def _check_unique(self, data: dict[str, Any], exclude_id: int | None = None) -> None:
        for field in self.unique_fields:
            if field in data and data[field] is not None and hasattr(self.model, field):
                col = getattr(self.model, field)
                stmt = select(self.model.id).where(col == data[field])
                if exclude_id is not None:
                    stmt = stmt.where(self.model.id != exclude_id)
                if (await self.db.execute(stmt)).first():
                    raise ConflictError(f"{self.entity_name} with {field} '{data[field]}' already exists")

    async def before_create(self, data: dict[str, Any]) -> dict[str, Any]:
        return data

    async def after_create(self, obj: ModelT) -> None:  # noqa: B027
        pass

    async def before_update(self, obj: ModelT, data: dict[str, Any]) -> dict[str, Any]:
        return data

    async def after_update(self, obj: ModelT) -> None:  # noqa: B027
        pass

    async def before_delete(self, obj: ModelT) -> None:
        for ref_model, fk_col in self.referenced_by:
            n = (
                await self.db.execute(select(func.count()).select_from(ref_model).where(fk_col == obj.id))
            ).scalar_one()
            if n:
                raise ConflictError(
                    f"Cannot delete {self.entity_name}: referenced by {n} {ref_model.__tablename__.replace('_', ' ')}"
                )

    async def create(self, payload: CreateT) -> ModelT:
        data = payload.model_dump(exclude_unset=False)
        data = await self.before_create(data)
        await self._check_unique(data)
        obj = self.model(**data)
        if hasattr(obj, "created_by_id"):
            obj.created_by_id = self.user_id  # type: ignore[attr-defined]
            obj.updated_by_id = self.user_id  # type: ignore[attr-defined]
        self.db.add(obj)
        try:
            await self.db.flush()
        except IntegrityError as exc:
            await self.db.rollback()
            raise ConflictError(self._integrity_message(exc)) from exc
        await self.db.refresh(obj)
        await self.after_create(obj)
        await log_action(
            self.db,
            user_id=self.user_id,
            action="create",
            entity=self.model.__tablename__,
            entity_id=obj.id,
            after=obj.to_dict(),
            ip=self.ip,
        )
        return await self.get(obj.id)

    async def update(self, obj_id: int, payload: UpdateT) -> ModelT:
        obj = await self.get(obj_id)
        before = obj.to_dict()
        data = payload.model_dump(exclude_unset=True)
        data = await self.before_update(obj, data)
        await self._check_unique(data, exclude_id=obj_id)
        for k, v in data.items():
            setattr(obj, k, v)
        if hasattr(obj, "updated_by_id"):
            obj.updated_by_id = self.user_id  # type: ignore[attr-defined]
        try:
            await self.db.flush()
        except IntegrityError as exc:
            await self.db.rollback()
            raise ConflictError(self._integrity_message(exc)) from exc
        await self.db.refresh(obj)
        await self.after_update(obj)
        await log_action(
            self.db,
            user_id=self.user_id,
            action="update",
            entity=self.model.__tablename__,
            entity_id=obj.id,
            before=before,
            after=obj.to_dict(),
            ip=self.ip,
        )
        return await self.get(obj.id)

    async def set_status(self, obj_id: int, status_value) -> ModelT:
        obj = await self.get(obj_id)
        if not hasattr(obj, "status"):
            raise ConflictError(f"{self.entity_name} has no status")
        before = obj.to_dict()
        obj.status = status_value  # type: ignore[attr-defined]
        if hasattr(obj, "updated_by_id"):
            obj.updated_by_id = self.user_id  # type: ignore[attr-defined]
        await self.db.flush()
        await self.db.refresh(obj)  # server-side onupdate (updated_at) expires attributes
        await log_action(
            self.db,
            user_id=self.user_id,
            action="status",
            entity=self.model.__tablename__,
            entity_id=obj.id,
            before=before,
            after=obj.to_dict(),
            ip=self.ip,
        )
        return obj

    async def delete(self, obj_id: int) -> None:
        obj = await self.get(obj_id)
        await self.before_delete(obj)
        before = obj.to_dict()
        await self.db.delete(obj)
        try:
            await self.db.flush()
        except IntegrityError as exc:
            await self.db.rollback()
            raise ConflictError(
                f"Cannot delete {self.entity_name}: it is referenced by other records"
            ) from exc
        await log_action(
            self.db,
            user_id=self.user_id,
            action="delete",
            entity=self.model.__tablename__,
            entity_id=obj_id,
            before=before,
            ip=self.ip,
        )

    @staticmethod
    def _integrity_message(exc: IntegrityError) -> str:
        msg = str(exc.orig) if exc.orig else str(exc)
        if "unique" in msg.lower() or "duplicate" in msg.lower():
            return "A record with the same unique value already exists"
        if "foreign key" in msg.lower():
            return "Referenced record does not exist or is still in use"
        return "Database integrity error"


def paginate(items: list[Any], total: int, params: ListParams) -> dict[str, Any]:
    pages = (total + params.page_size - 1) // params.page_size if total else 0
    return {
        "items": items,
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
        "pages": pages,
    }
