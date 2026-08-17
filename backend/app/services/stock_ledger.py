"""Stock ledger core — the ONLY place that mutates `stocks.quantity`.

Every movement (opening stock, allocation approval, receipt, adjustment, transfer) goes through
`apply_stock_movement`, which upserts the (store,item) balance row and appends a `stock_transactions`
ledger entry with the resulting balance. Negative balances are rejected (409) unless allow_negative=True.
"""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError
from app.models.enums import StockSource, StockTxnType
from app.models.inventory import Stock, StockTransaction


async def get_or_create_stock(
    db: AsyncSession, store_id: int, item_id: int, *, for_update: bool = True
) -> Stock:
    stmt = select(Stock).where(Stock.store_id == store_id, Stock.item_id == item_id)
    if for_update:
        stmt = stmt.with_for_update()
    stock = (await db.execute(stmt)).scalars().first()
    if stock is None:
        stock = Stock(store_id=store_id, item_id=item_id, quantity=Decimal("0"))
        db.add(stock)
        await db.flush()
    return stock


async def apply_stock_movement(
    db: AsyncSession,
    *,
    store_id: int,
    item_id: int,
    quantity_delta: Decimal | int | float,
    txn_type: StockTxnType,
    user_id: int | None,
    source: StockSource | None = None,
    ref_type: str | None = None,
    ref_id: int | None = None,
    remarks: str | None = None,
    low_stock_threshold: Decimal | None = None,
    allow_negative: bool = False,
) -> Stock:
    """Apply a signed quantity change to (store,item). Returns the updated Stock row."""
    delta = Decimal(str(quantity_delta))
    stock = await get_or_create_stock(db, store_id, item_id)
    new_balance = Decimal(stock.quantity or 0) + delta
    if new_balance < 0 and not allow_negative:
        raise ConflictError(
            f"Insufficient stock: available {Decimal(stock.quantity or 0):.3f}, requested {abs(delta):.3f}"
        )
    stock.quantity = new_balance
    if low_stock_threshold is not None:
        stock.low_stock_threshold = low_stock_threshold
    db.add(
        StockTransaction(
            store_id=store_id,
            item_id=item_id,
            txn_type=txn_type,
            quantity_delta=delta,
            balance_after=new_balance,
            source=source,
            ref_type=ref_type,
            ref_id=ref_id,
            remarks=remarks,
            created_by_id=user_id,
        )
    )
    await db.flush()
    return stock


async def available_quantity(db: AsyncSession, store_id: int, item_id: int) -> Decimal:
    stock = (
        (await db.execute(select(Stock).where(Stock.store_id == store_id, Stock.item_id == item_id)))
        .scalars()
        .first()
    )
    return Decimal(stock.quantity) if stock else Decimal("0")


def is_low(stock: Stock) -> bool:
    return stock.low_stock_threshold is not None and Decimal(stock.quantity) <= Decimal(
        stock.low_stock_threshold
    )
