"""Parse list query params (sort / filter / q) into SQLAlchemy clauses — safely (whitelists)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from enum import Enum
from typing import Any

from fastapi import HTTPException, Query, status
from sqlalchemy import Enum as SAEnum
from sqlalchemy import String, Text, and_, cast, or_
from sqlalchemy.orm import InstrumentedAttribute
from sqlalchemy.sql import ColumnElement


class ListParams:
    """FastAPI dependency collecting the standard list query parameters."""

    def __init__(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=200),
        sort: str | None = Query(None, description="field:asc|desc"),
        filter: list[str] | None = Query(None, description="field:value (repeatable)"),  # noqa: A002
        q: str | None = Query(None, description="global search"),
    ):
        self.page = page
        self.page_size = page_size
        self.sort = sort
        self.filters: list[tuple[str, str]] = []
        for f in filter or []:
            if ":" not in f:
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_CONTENT, f"Invalid filter '{f}', expected field:value"
                )
            field, _, value = f.partition(":")
            if value.strip() != "":
                self.filters.append((field.strip(), value.strip()))
        self.q = q.strip() if q else None

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def parse_sort(sort: str | None, allowed: dict[str, InstrumentedAttribute], default: str) -> ColumnElement:
    raw = sort or default
    field, _, direction = raw.partition(":")
    direction = (direction or "asc").lower()
    if field not in allowed:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Cannot sort by '{field}'")
    if direction not in ("asc", "desc"):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Sort direction must be asc or desc")
    col = allowed[field]
    return col.desc() if direction == "desc" else col.asc()


def _coerce(col: InstrumentedAttribute, value: str) -> Any:
    """Convert a filter string to the column's python type; raise 422 on failure."""
    try:
        py = col.property.columns[0].type.python_type  # type: ignore[union-attr]
    except (NotImplementedError, AttributeError):
        return value
    try:
        if py is bool:
            return value.lower() in ("1", "true", "yes", "active", "y")
        if py is int:
            return int(value)
        if py is float:
            return float(value)
        if py is Decimal:
            return Decimal(value)
        if py is date:
            return date.fromisoformat(value)
        if py is datetime:
            return datetime.fromisoformat(value)
        if isinstance(py, type) and issubclass(py, Enum):
            return py(value)
    except (ValueError, InvalidOperation) as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, f"Invalid value '{value}' for {col.key}"
        ) from exc
    return value


def build_filters(
    filters: list[tuple[str, str]],
    allowed: dict[str, InstrumentedAttribute],
) -> list[ColumnElement]:
    clauses: list[ColumnElement] = []
    for field, value in filters:
        if field not in allowed:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Cannot filter by '{field}'")
        col = allowed[field]
        col_type = col.property.columns[0].type if hasattr(col, "property") else None
        if isinstance(col_type, SAEnum):
            # enum: exact match on value (case-insensitive), 422 on unknown value
            enum_cls = col_type.enum_class
            try:
                clauses.append(col == (enum_cls(value.lower()) if enum_cls else value))
            except ValueError as exc:
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_CONTENT, f"Invalid value '{value}' for {field}"
                ) from exc
        elif isinstance(col_type, (String, Text)):
            clauses.append(col.ilike(f"%{value}%"))
        else:
            # enums / numbers / dates / bools -> equality; also allow ilike on the text cast for partial matches
            try:
                clauses.append(col == _coerce(col, value))
            except HTTPException:
                clauses.append(cast(col, String).ilike(f"%{value}%"))
    return clauses


def build_search(q: str | None, search_cols: list[InstrumentedAttribute]) -> ColumnElement | None:
    if not q or not search_cols:
        return None
    return or_(*[cast(c, String).ilike(f"%{q}%") for c in search_cols])


def combine(*clauses: ColumnElement | None) -> ColumnElement | None:
    real = [c for c in clauses if c is not None]
    if not real:
        return None
    return and_(*real) if len(real) > 1 else real[0]
