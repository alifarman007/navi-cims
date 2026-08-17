"""Inventory Management routers: stores, opening stocks (ledger-backed), stocks + stock transactions (read-only)."""

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.v1.crud_router import make_crud_router
from app.core.deps import DB, ClientIP, CurrentUser, has_permission
from app.core.exceptions import ForbiddenError
from app.core.permissions import Action, Module
from app.schemas.common import Page
from app.schemas.inventory import (
    OpeningStockCreate,
    OpeningStockRead,
    OpeningStockUpdate,
    StockRead,
    StockSummary,
    StockTransactionRead,
    StoreCreate,
    StoreRead,
    StoreUpdate,
)
from app.services.crud_base import paginate
from app.services.inventory import OpeningStockService, StockService, StockTransactionService, StoreService
from app.services.stock_ledger import is_low
from app.utils.query import ListParams

_OPTS = (Module.ALLOCATION_SANCTION, Module.COMPILATION_VERIFICATION, Module.REPORT)
_STOCK_READERS = (Module.INVENTORY_MANAGEMENT, *_OPTS)


async def require_stock_reader(user: CurrentUser):
    """Stock balances / ledger are readable by Inventory users and by Allocation / Verification / Report users."""
    if not any(has_permission(user, m, Action.LIST) for m in _STOCK_READERS):
        raise ForbiddenError(f"Permission denied: {Module.INVENTORY_MANAGEMENT}.list")
    return user


# ---- Store (master) ---------------------------------------------------------------
stores_router = make_crud_router(
    prefix="/stores",
    tags=["inventory-management"],
    module=Module.INVENTORY_MANAGEMENT,
    service_cls=StoreService,
    read_schema=StoreRead,
    create_schema=StoreCreate,
    update_schema=StoreUpdate,
    options_modules=_OPTS,
)

# ---- Opening Stock (create -> ledger; quantity immutable; delete -> reversal) -----
opening_stocks_router = make_crud_router(
    prefix="/opening-stocks",
    tags=["inventory-management"],
    module=Module.INVENTORY_MANAGEMENT,
    service_cls=OpeningStockService,
    read_schema=OpeningStockRead,
    create_schema=OpeningStockCreate,
    update_schema=OpeningStockUpdate,
    with_status=False,
)

# ---- Stocks (read-only balance) ---------------------------------------------------
stocks_router = APIRouter(prefix="/stocks", tags=["inventory-management"])


def _stock_read(s) -> StockRead:
    return StockRead.model_validate(s).model_copy(update={"is_low": is_low(s)})


@stocks_router.get("", response_model=Page[StockRead])
async def list_stocks(
    db: DB, ip: ClientIP, user: Any = Depends(require_stock_reader), params: ListParams = Depends()
):
    """Current balances. Filters: store_id, item_id, store, item, quantity, status, is_low (true/false). Sort: quantity, ..."""
    service = StockService(db, user_id=user.id, ip=ip)
    rows, total = await service.list(params)
    return paginate([_stock_read(r) for r in rows], total, params)


@stocks_router.get("/summary", response_model=StockSummary)
async def stock_summary(
    db: DB,
    ip: ClientIP,
    store_id: int = Query(..., ge=1),
    item_id: int = Query(..., ge=1),
    user: Any = Depends(require_stock_reader),
):
    """Available quantity of an item in a store (0 when no balance row exists yet)."""
    service = StockService(db, user_id=user.id, ip=ip)
    return StockSummary(**await service.summary(store_id, item_id))


@stocks_router.get("/{stock_id}", response_model=StockRead)
async def get_stock(stock_id: int, db: DB, ip: ClientIP, user: Any = Depends(require_stock_reader)):
    service = StockService(db, user_id=user.id, ip=ip)
    return _stock_read(await service.get(stock_id))


# ---- Stock transactions (read-only ledger) ----------------------------------------
stock_transactions_router = APIRouter(prefix="/stock-transactions", tags=["inventory-management"])


@stock_transactions_router.get("", response_model=Page[StockTransactionRead])
async def list_stock_transactions(
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_stock_reader),
    params: ListParams = Depends(),
    date_from: date | None = Query(None, description="created_at >= date_from"),
    date_to: date | None = Query(None, description="created_at <= date_to"),
):
    """Ledger. Filters: store_id, item_id, txn_type, source, ref_type, store, item; date range via date_from/date_to."""
    service = StockTransactionService(db, user_id=user.id, ip=ip, date_from=date_from, date_to=date_to)
    rows, total = await service.list(params)
    return paginate([StockTransactionRead.model_validate(r) for r in rows], total, params)


@stock_transactions_router.get("/{txn_id}", response_model=StockTransactionRead)
async def get_stock_transaction(txn_id: int, db: DB, ip: ClientIP, user: Any = Depends(require_stock_reader)):
    service = StockTransactionService(db, user_id=user.id, ip=ip)
    return StockTransactionRead.model_validate(await service.get(txn_id))


routers = [stores_router, opening_stocks_router, stocks_router, stock_transactions_router]
