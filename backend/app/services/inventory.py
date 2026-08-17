"""Inventory Management services: Store (master), OpeningStock (writes the ledger), Stock + StockTransaction (read-only).

Stock balances are only ever changed through `app.services.stock_ledger.apply_stock_movement`.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, time
from decimal import Decimal
from typing import Any

from sqlalchemy import and_, func, select

from app.core.exceptions import ConflictError, NotFoundError
from app.models.allocation import Allocation
from app.models.enums import StockSource, StockTxnType
from app.models.inventory import OpeningStock, Stock, StockTransaction, Store
from app.models.item import Item
from app.schemas.inventory import OpeningStockCreate, OpeningStockUpdate, StoreCreate, StoreUpdate
from app.services.crud_base import CRUDService
from app.services.stock_ledger import apply_stock_movement, available_quantity
from app.services.stock_ledger import is_low as stock_is_low
from app.utils.query import ListParams, build_filters, build_search, combine, parse_sort


# ---- Store -----------------------------------------------------------------------
class StoreService(CRUDService[Store, StoreCreate, StoreUpdate]):
    model = Store
    entity_name = "Store"
    filterable = {
        "code": Store.code,
        "name": Store.name,
        "store_type": Store.store_type,
        "concern": Store.concern,
        "address": Store.address,
        "status": Store.status,
    }
    sortable = {
        "id": Store.id,
        "code": Store.code,
        "name": Store.name,
        "store_type": Store.store_type,
        "concern": Store.concern,
        "status": Store.status,
        "created_at": Store.created_at,
    }
    search_fields = [Store.code, Store.name, Store.concern]
    unique_fields = ("code",)
    referenced_by = (
        (Stock, Stock.store_id),
        (OpeningStock, OpeningStock.store_id),
        (Allocation, Allocation.store_id),
    )


# ---- Opening Stock ---------------------------------------------------------------
class OpeningStockService(CRUDService[OpeningStock, OpeningStockCreate, OpeningStockUpdate]):
    model = OpeningStock
    entity_name = "Opening Stock"
    filterable = {
        "store_id": OpeningStock.store_id,
        "item_id": OpeningStock.item_id,
        "quantity": OpeningStock.quantity,
        "entry_date": OpeningStock.entry_date,
        "low_stock_threshold": OpeningStock.low_stock_threshold,
        "remarks": OpeningStock.remarks,
        "store": Store.name,
        "item": Item.name,
        "store_code": Store.code,
        "item_code": Item.code,
    }
    sortable = {
        "id": OpeningStock.id,
        "quantity": OpeningStock.quantity,
        "entry_date": OpeningStock.entry_date,
        "low_stock_threshold": OpeningStock.low_stock_threshold,
        "store": Store.name,
        "item": Item.name,
        "created_at": OpeningStock.created_at,
    }
    search_fields = [Store.name, Store.code, Item.name, Item.code, OpeningStock.remarks]
    unique_fields = ()

    def base_query(self):
        return (
            select(OpeningStock)
            .join(Store, OpeningStock.store_id == Store.id)
            .join(Item, OpeningStock.item_id == Item.id)
        )

    async def before_create(self, data: dict[str, Any]) -> dict[str, Any]:
        if Decimal(str(data.get("quantity") or 0)) <= 0:
            raise ConflictError("Opening Quantity must be greater than zero")
        if not (await self.db.execute(select(Store.id).where(Store.id == data["store_id"]))).first():
            raise NotFoundError("Store", data["store_id"])
        if not (await self.db.execute(select(Item.id).where(Item.id == data["item_id"]))).first():
            raise NotFoundError("Item", data["item_id"])
        return data

    async def after_create(self, obj: OpeningStock) -> None:
        # The ledger is the single source of truth for balances: upsert stocks(store,item) + 'opening' row.
        await apply_stock_movement(
            self.db,
            store_id=obj.store_id,
            item_id=obj.item_id,
            quantity_delta=obj.quantity,
            txn_type=StockTxnType.OPENING,
            user_id=self.user_id,
            source=StockSource.MANUAL,
            ref_type="opening_stock",
            ref_id=obj.id,
            remarks=obj.remarks,
            low_stock_threshold=obj.low_stock_threshold,
        )

    async def before_update(self, obj: OpeningStock, data: dict[str, Any]) -> dict[str, Any]:
        # Only entry_date / remarks / low_stock_threshold are editable (schema enforces it); quantity is immutable.
        for k in ("quantity", "store_id", "item_id"):
            data.pop(k, None)
        if "low_stock_threshold" in data:
            stock = (
                (
                    await self.db.execute(
                        select(Stock).where(Stock.store_id == obj.store_id, Stock.item_id == obj.item_id)
                    )
                )
                .scalars()
                .first()
            )
            if stock is not None:
                stock.low_stock_threshold = data["low_stock_threshold"]
        return data

    async def before_delete(self, obj: OpeningStock) -> None:
        # Reverse the opening movement (negative adjustment). Blocked if that would make the balance negative.
        available = await available_quantity(self.db, obj.store_id, obj.item_id)
        qty = Decimal(obj.quantity)
        if available - qty < 0:
            raise ConflictError(
                f"Cannot delete Opening Stock: reversing {qty:.3f} would make the stock negative "
                f"(available {available:.3f}). Stock has already been issued from this entry."
            )
        await apply_stock_movement(
            self.db,
            store_id=obj.store_id,
            item_id=obj.item_id,
            quantity_delta=-qty,
            txn_type=StockTxnType.ADJUSTMENT,
            user_id=self.user_id,
            source=StockSource.MANUAL,
            ref_type="opening_stock_reversal",
            ref_id=obj.id,
            remarks=f"Reversal of opening stock #{obj.id}",
        )


# ---- Stock (read-only balance) ---------------------------------------------------
class StockService(CRUDService[Stock, Any, Any]):
    model = Stock
    entity_name = "Stock"
    filterable = {
        "store_id": Stock.store_id,
        "item_id": Stock.item_id,
        "quantity": Stock.quantity,
        "low_stock_threshold": Stock.low_stock_threshold,
        "status": Stock.status,
        "store": Store.name,
        "item": Item.name,
        "store_code": Store.code,
        "item_code": Item.code,
    }
    sortable = {
        "id": Stock.id,
        "quantity": Stock.quantity,
        "low_stock_threshold": Stock.low_stock_threshold,
        "status": Stock.status,
        "updated_at": Stock.updated_at,
        "store": Store.name,
        "item": Item.name,
    }
    search_fields = [Store.name, Store.code, Item.name, Item.code]
    unique_fields = ()

    def base_query(self):
        return select(Stock).join(Store, Stock.store_id == Store.id).join(Item, Stock.item_id == Item.id)

    @staticmethod
    def _is_low_clause():
        return and_(Stock.low_stock_threshold.isnot(None), Stock.quantity <= Stock.low_stock_threshold)

    async def list(self, params: ListParams) -> tuple[list[Stock], int]:
        # `is_low` is computed (quantity <= threshold) -> handled here instead of the generic column filter.
        is_low_filter: bool | None = None
        rest: list[tuple[str, str]] = []
        for field, value in params.filters:
            if field == "is_low":
                v = value.strip().lower()
                if v in ("1", "true", "yes", "low"):
                    is_low_filter = True
                elif v in ("0", "false", "no", "ok"):
                    is_low_filter = False
            else:
                rest.append((field, value))
        stmt = self.base_query()
        clauses = build_filters(rest, self.filterable)
        if is_low_filter is True:
            clauses.append(self._is_low_clause())
        elif is_low_filter is False:
            clauses.append(~self._is_low_clause())
        where = combine(*clauses, build_search(params.q, self.search_fields))
        if where is not None:
            stmt = stmt.where(where)
        total = (
            await self.db.execute(select(func.count()).select_from(stmt.order_by(None).subquery()))
        ).scalar_one()
        stmt = stmt.order_by(parse_sort(params.sort, self.sortable, self.default_sort), Stock.id.desc())
        stmt = stmt.offset(params.offset).limit(params.page_size)
        rows = (await self.db.execute(stmt)).scalars().unique().all()
        return list(rows), int(total)

    async def summary(self, store_id: int, item_id: int) -> dict[str, Any]:
        stock = (
            (await self.db.execute(select(Stock).where(Stock.store_id == store_id, Stock.item_id == item_id)))
            .scalars()
            .first()
        )
        if stock is None:
            return {
                "store_id": store_id,
                "item_id": item_id,
                "quantity": Decimal("0"),
                "low_stock_threshold": None,
                "is_low": False,
            }
        return {
            "store_id": store_id,
            "item_id": item_id,
            "quantity": Decimal(stock.quantity),
            "low_stock_threshold": stock.low_stock_threshold,
            "is_low": stock_is_low(stock),
        }


# ---- Stock transactions (read-only ledger) ---------------------------------------
class StockTransactionService(CRUDService[StockTransaction, Any, Any]):
    model = StockTransaction
    entity_name = "Stock Transaction"
    filterable = {
        "store_id": StockTransaction.store_id,
        "item_id": StockTransaction.item_id,
        "txn_type": StockTransaction.txn_type,
        "source": StockTransaction.source,
        "ref_type": StockTransaction.ref_type,
        "ref_id": StockTransaction.ref_id,
        "remarks": StockTransaction.remarks,
        "store": Store.name,
        "item": Item.name,
        "store_code": Store.code,
        "item_code": Item.code,
    }
    sortable = {
        "id": StockTransaction.id,
        "created_at": StockTransaction.created_at,
        "quantity_delta": StockTransaction.quantity_delta,
        "balance_after": StockTransaction.balance_after,
        "txn_type": StockTransaction.txn_type,
        "store": Store.name,
        "item": Item.name,
    }
    search_fields = [Store.name, Store.code, Item.name, Item.code, StockTransaction.remarks]
    unique_fields = ()

    def __init__(self, db, user_id=None, ip=None, date_from: date | None = None, date_to: date | None = None):
        super().__init__(db, user_id=user_id, ip=ip)
        self.date_from = date_from
        self.date_to = date_to

    def base_query(self):
        stmt = (
            select(StockTransaction)
            .join(Store, StockTransaction.store_id == Store.id)
            .join(Item, StockTransaction.item_id == Item.id)
        )
        if self.date_from:
            stmt = stmt.where(
                StockTransaction.created_at >= datetime.combine(self.date_from, time.min, tzinfo=UTC)
            )
        if self.date_to:
            stmt = stmt.where(
                StockTransaction.created_at <= datetime.combine(self.date_to, time.max, tzinfo=UTC)
            )
        return stmt
