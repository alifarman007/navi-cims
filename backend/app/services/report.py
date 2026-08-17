"""Report + Dashboard queries (read-only).

Stock summary / low stock read the `stocks` balance table (joined to store, item, category, unit);
the allocation report reads `allocations`. Both accept the standard ListParams (page/page_size/sort/filter/q)
plus explicit typed filters, and can return the *full* filtered set for the Excel export.
Ship/Base users only see allocations for their own ship/base.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import Select, and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.allocation import Allocation
from app.models.config import FiscalYear
from app.models.enums import AllocationStatus, AllocationType, Status, UserType
from app.models.inventory import Stock, Store
from app.models.item import Item, ItemCategory, ItemUnit
from app.models.ship_base import ShipBase
from app.models.user import User
from app.utils.query import ListParams, build_filters, build_search, combine, parse_sort

EXPORT_MAX_ROWS = 20_000


def _low_clause():
    return and_(Stock.low_stock_threshold.isnot(None), Stock.quantity <= Stock.low_stock_threshold)


def _ref(obj) -> dict[str, Any] | None:
    if obj is None:
        return None
    return {"id": obj.id, "code": getattr(obj, "code", None), "name": obj.name}


# ---------------------------------------------------------------------------- stock summary
@dataclass
class StockFilters:
    store_id: int | None = None
    item_id: int | None = None
    category_id: int | None = None
    low_only: bool = False


STOCK_FILTERABLE = {
    "store": Store.name,
    "store_code": Store.code,
    "item": Item.name,
    "item_code": Item.code,
    "category": ItemCategory.name,
    "unit": ItemUnit.name,
    "quantity": Stock.quantity,
    "low_stock_threshold": Stock.low_stock_threshold,
}
STOCK_SORTABLE = {
    "id": Stock.id,
    "store": Store.name,
    "item": Item.name,
    "item_code": Item.code,
    "category": ItemCategory.name,
    "unit": ItemUnit.name,
    "quantity": Stock.quantity,
    "low_stock_threshold": Stock.low_stock_threshold,
    "last_updated": Stock.updated_at,
}
STOCK_SEARCH = [Store.name, Store.code, Item.name, Item.code, ItemCategory.name]


def _stock_query(f: StockFilters) -> Select:
    stmt = (
        select(Stock)
        .join(Store, Stock.store_id == Store.id)
        .join(Item, Stock.item_id == Item.id)
        .outerjoin(ItemCategory, Item.category_id == ItemCategory.id)
        .outerjoin(ItemUnit, Item.unit_id == ItemUnit.id)
    )
    if f.store_id:
        stmt = stmt.where(Stock.store_id == f.store_id)
    if f.item_id:
        stmt = stmt.where(Stock.item_id == f.item_id)
    if f.category_id:
        stmt = stmt.where(Item.category_id == f.category_id)
    if f.low_only:
        stmt = stmt.where(_low_clause())
    return stmt


def stock_row(s: Stock) -> dict[str, Any]:
    it = s.item
    threshold = s.low_stock_threshold
    return {
        "id": s.id,
        "store": _ref(s.store),
        "item": {
            "id": it.id,
            "code": it.code,
            "name": it.name,
            "category": _ref(it.category),
            "unit": _ref(it.unit),
        },
        "quantity": s.quantity,
        "low_stock_threshold": threshold,
        "is_low": threshold is not None and Decimal(s.quantity) <= Decimal(threshold),
        "last_updated": s.updated_at,
    }


async def stock_summary(
    db: AsyncSession, f: StockFilters, params: ListParams, *, all_rows: bool = False
) -> tuple[list[dict[str, Any]], int]:
    stmt = _stock_query(f)
    where = combine(*build_filters(params.filters, STOCK_FILTERABLE), build_search(params.q, STOCK_SEARCH))
    if where is not None:
        stmt = stmt.where(where)
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = (await db.execute(count_stmt)).scalar_one()
    stmt = stmt.order_by(
        parse_sort(params.sort, STOCK_SORTABLE, "store:asc"), Item.name.asc(), Stock.id.desc()
    )
    stmt = stmt.limit(EXPORT_MAX_ROWS) if all_rows else stmt.offset(params.offset).limit(params.page_size)
    rows = (await db.execute(stmt)).scalars().unique().all()
    return [stock_row(s) for s in rows], int(total)


STOCK_EXPORT_HEADERS = [
    "Store Code",
    "Store",
    "Item ID",
    "Item Name",
    "Category",
    "Unit",
    "Quantity",
    "Low Stock Threshold",
    "Low Stock",
    "Last Updated",
]


def stock_export_row(r: dict[str, Any]) -> list[Any]:
    it, cat, unit = r["item"], r["item"]["category"], r["item"]["unit"]
    return [
        r["store"]["code"],
        r["store"]["name"],
        it["code"],
        it["name"],
        cat["name"] if cat else None,
        unit["name"] if unit else None,
        r["quantity"],
        r["low_stock_threshold"],
        r["is_low"],
        r["last_updated"],
    ]


# ---------------------------------------------------------------------------- allocation report
@dataclass
class AllocationFilters:
    fiscal_year_id: int | None = None
    ship_base_id: int | None = None
    store_id: int | None = None
    item_id: int | None = None
    status: AllocationStatus | None = None
    type: AllocationType | None = None
    date_from: date | None = None
    date_to: date | None = None
    # row-level scope for ship/base users
    scope_ship_base_id: int | None = field(default=None)


ALLOC_FILTERABLE = {
    "code": Allocation.code,
    "type": Allocation.allocation_type,
    "status": Allocation.status,
    "date": Allocation.allocation_date,
    "quantity": Allocation.quantity,
    "fiscal_year": FiscalYear.name,
    "store": Store.name,
    "item": Item.name,
    "ship_base": ShipBase.name,
}
ALLOC_SORTABLE = {
    "id": Allocation.id,
    "code": Allocation.code,
    "type": Allocation.allocation_type,
    "status": Allocation.status,
    "date": Allocation.allocation_date,
    "quantity": Allocation.quantity,
    "fiscal_year": FiscalYear.name,
    "store": Store.name,
    "item": Item.name,
    "ship_base": ShipBase.name,
    "approved_at": Allocation.approved_at,
}
ALLOC_SEARCH = [Allocation.code, Store.name, Item.name, Item.code, ShipBase.name, ShipBase.code]


def _alloc_query(f: AllocationFilters) -> Select:
    stmt = (
        select(Allocation)
        .join(FiscalYear, Allocation.fiscal_year_id == FiscalYear.id)
        .join(Store, Allocation.store_id == Store.id)
        .join(Item, Allocation.item_id == Item.id)
        .join(ShipBase, Allocation.ship_base_id == ShipBase.id)
    )
    if f.scope_ship_base_id:
        stmt = stmt.where(Allocation.ship_base_id == f.scope_ship_base_id)
    if f.fiscal_year_id:
        stmt = stmt.where(Allocation.fiscal_year_id == f.fiscal_year_id)
    if f.ship_base_id:
        stmt = stmt.where(Allocation.ship_base_id == f.ship_base_id)
    if f.store_id:
        stmt = stmt.where(Allocation.store_id == f.store_id)
    if f.item_id:
        stmt = stmt.where(Allocation.item_id == f.item_id)
    if f.status:
        stmt = stmt.where(Allocation.status == f.status)
    if f.type:
        stmt = stmt.where(Allocation.allocation_type == f.type)
    if f.date_from:
        stmt = stmt.where(Allocation.allocation_date >= f.date_from)
    if f.date_to:
        stmt = stmt.where(Allocation.allocation_date <= f.date_to)
    return stmt


def allocation_row(a: Allocation) -> dict[str, Any]:
    ab = a.approved_by
    return {
        "id": a.id,
        "code": a.code,
        "type": a.allocation_type,
        "fiscal_year": {"id": a.fiscal_year.id, "name": a.fiscal_year.name},
        "date": a.allocation_date,
        "store": _ref(a.store),
        "item": _ref(a.item),
        "ship_base": _ref(a.ship_base),
        "quantity": a.quantity,
        "status": a.status,
        "approved_by": {"id": ab.id, "username": ab.username, "full_name": ab.full_name} if ab else None,
        "approved_at": a.approved_at,
    }


def scope_for(user: User) -> int | None:
    """Ship/Base users are restricted to their own ship/base rows."""
    if user.user_type == UserType.SHIP_BASE_USER and user.ship_base_id:
        return user.ship_base_id
    return None


async def allocation_report(
    db: AsyncSession, f: AllocationFilters, params: ListParams, *, all_rows: bool = False
) -> tuple[list[dict[str, Any]], int]:
    stmt = _alloc_query(f)
    where = combine(*build_filters(params.filters, ALLOC_FILTERABLE), build_search(params.q, ALLOC_SEARCH))
    if where is not None:
        stmt = stmt.where(where)
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = (await db.execute(count_stmt)).scalar_one()
    stmt = stmt.order_by(parse_sort(params.sort, ALLOC_SORTABLE, "date:desc"), Allocation.id.desc())
    stmt = stmt.limit(EXPORT_MAX_ROWS) if all_rows else stmt.offset(params.offset).limit(params.page_size)
    rows = (await db.execute(stmt)).scalars().unique().all()
    return [allocation_row(a) for a in rows], int(total)


ALLOC_EXPORT_HEADERS = [
    "ID",
    "Type",
    "Fiscal Year",
    "Date",
    "Store",
    "Item ID",
    "Item",
    "Ship/Base",
    "Quantity",
    "Status",
    "Approved By",
    "Approved At",
]


def allocation_export_row(r: dict[str, Any]) -> list[Any]:
    ab = r["approved_by"]
    return [
        r["code"],
        r["type"],
        r["fiscal_year"]["name"],
        r["date"],
        r["store"]["name"],
        r["item"]["code"],
        r["item"]["name"],
        r["ship_base"]["name"],
        r["quantity"],
        r["status"],
        ab["full_name"] if ab else None,
        r["approved_at"],
    ]


# ---------------------------------------------------------------------------- dashboard
async def _count(db: AsyncSession, stmt: Select) -> int:
    return int((await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())


async def dashboard_summary(db: AsyncSession, user: User) -> dict[str, Any]:
    scope = scope_for(user)
    alloc_base = select(Allocation)
    if scope:
        alloc_base = alloc_base.where(Allocation.ship_base_id == scope)

    counts = {
        "items": await _count(db, select(Item.id).where(Item.status == Status.ACTIVE)),
        "ship_bases": await _count(db, select(ShipBase.id).where(ShipBase.status == Status.ACTIVE)),
        "stores": await _count(db, select(Store.id).where(Store.status == Status.ACTIVE)),
        "users": await _count(db, select(User.id).where(User.status == Status.ACTIVE)),
        "allocations_pending": await _count(
            db, alloc_base.where(Allocation.status == AllocationStatus.PENDING)
        ),
        "allocations_approved": await _count(
            db, alloc_base.where(Allocation.status == AllocationStatus.APPROVED)
        ),
        "allocations_sent_back": await _count(
            db, alloc_base.where(Allocation.status == AllocationStatus.SENT_BACK)
        ),
        "low_stock_items": await _count(db, select(Stock.id).where(_low_clause())),
    }

    # allocations by status (all four statuses, zero-filled)
    st_stmt = select(Allocation.status, func.count()).group_by(Allocation.status)
    if scope:
        st_stmt = st_stmt.where(Allocation.ship_base_id == scope)
    st_map = {s: int(c) for s, c in (await db.execute(st_stmt)).all()}
    allocations_by_status = [{"status": s, "count": st_map.get(s, 0)} for s in AllocationStatus]

    # by fiscal year (stacked allocation/sanction)
    fy_stmt = (
        select(
            FiscalYear.name,
            func.sum(case((Allocation.allocation_type == AllocationType.ALLOCATION, 1), else_=0)),
            func.sum(case((Allocation.allocation_type == AllocationType.SANCTION, 1), else_=0)),
            func.coalesce(func.sum(Allocation.quantity), 0),
        )
        .join(Allocation, Allocation.fiscal_year_id == FiscalYear.id)
        .group_by(FiscalYear.name, FiscalYear.start_date)
        .order_by(FiscalYear.start_date.asc())
    )
    if scope:
        fy_stmt = fy_stmt.where(Allocation.ship_base_id == scope)
    allocations_by_fiscal_year = [
        {"fiscal_year": n, "allocation": int(a or 0), "sanction": int(s or 0), "total_qty": Decimal(q or 0)}
        for n, a, s, q in (await db.execute(fy_stmt)).all()
    ]

    # by ship/base (top 10 by count)
    sb_stmt = (
        select(ShipBase.name, func.count(Allocation.id), func.coalesce(func.sum(Allocation.quantity), 0))
        .join(Allocation, Allocation.ship_base_id == ShipBase.id)
        .group_by(ShipBase.id, ShipBase.name)
        .order_by(func.count(Allocation.id).desc(), ShipBase.name.asc())
        .limit(10)
    )
    if scope:
        sb_stmt = sb_stmt.where(ShipBase.id == scope)
    allocations_by_ship_base = [
        {"ship_base": n, "count": int(c), "qty": Decimal(q or 0)}
        for n, c, q in (await db.execute(sb_stmt)).all()
    ]

    # items by category
    cat_stmt = (
        select(ItemCategory.name, func.count(Item.id))
        .join(Item, Item.category_id == ItemCategory.id)
        .where(Item.status == Status.ACTIVE)
        .group_by(ItemCategory.id, ItemCategory.name)
        .order_by(func.count(Item.id).desc(), ItemCategory.name.asc())
        .limit(12)
    )
    items_by_category = [{"category": n, "count": int(c)} for n, c in (await db.execute(cat_stmt)).all()]

    # stock by store
    store_stmt = (
        select(Store.name, func.count(Stock.id), func.coalesce(func.sum(Stock.quantity), 0))
        .join(Stock, Stock.store_id == Store.id)
        .group_by(Store.id, Store.name)
        .order_by(func.sum(Stock.quantity).desc(), Store.name.asc())
        .limit(12)
    )
    stock_by_store = [
        {"store": n, "items": int(c), "total_qty": Decimal(q or 0)}
        for n, c, q in (await db.execute(store_stmt)).all()
    ]

    recent_stmt = alloc_base.order_by(Allocation.created_at.desc(), Allocation.id.desc()).limit(8)
    recent = (await db.execute(recent_stmt)).scalars().unique().all()
    recent_allocations = [
        {k: v for k, v in allocation_row(a).items() if k not in ("approved_by", "approved_at")}
        for a in recent
    ]

    low_stmt = (
        _stock_query(StockFilters(low_only=True))
        .order_by((Stock.quantity - Stock.low_stock_threshold).asc(), Stock.updated_at.desc())
        .limit(8)
    )
    low = (await db.execute(low_stmt)).scalars().unique().all()

    return {
        "counts": counts,
        "allocations_by_status": allocations_by_status,
        "allocations_by_fiscal_year": allocations_by_fiscal_year,
        "allocations_by_ship_base": allocations_by_ship_base,
        "items_by_category": items_by_category,
        "stock_by_store": stock_by_store,
        "recent_allocations": recent_allocations,
        "low_stock": [stock_row(s) for s in low],
    }
