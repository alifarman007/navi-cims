"""Report module: stock summary, allocation report, low stock — each paginated JSON or `?export=xlsx`."""

from datetime import date
from typing import Any, Literal

from fastapi import APIRouter, Depends, Query

from app.core.deps import DB, ClientIP, require_permission
from app.core.permissions import Action, Module
from app.models.enums import AllocationStatus, AllocationType
from app.schemas.common import Page
from app.schemas.report import AllocationReportRow, StockSummaryRow
from app.services import report as svc
from app.services.audit import log_action
from app.services.crud_base import paginate
from app.utils.export import XLSX_MEDIA_TYPE, xlsx_response
from app.utils.query import ListParams

router = APIRouter(prefix="/reports", tags=["report"])

ExportParam = Literal["xlsx"] | None
_XLSX_RESPONSES = {200: {"content": {XLSX_MEDIA_TYPE: {}}}}


async def _stock_endpoint(
    db, user, ip, params: ListParams, filters: svc.StockFilters, export: ExportParam, report_name: str
) -> Any:
    if export == "xlsx":
        rows, _ = await svc.stock_summary(db, filters, params, all_rows=True)
        await log_action(
            db,
            user_id=user.id,
            action="export",
            entity=f"report:{report_name}",
            entity_id=None,
            after={"rows": len(rows), "filters": _clean(filters)},
            ip=ip,
        )
        return xlsx_response(svc.STOCK_EXPORT_HEADERS, (svc.stock_export_row(r) for r in rows), report_name)
    rows, total = await svc.stock_summary(db, filters, params)
    return paginate([StockSummaryRow.model_validate(r) for r in rows], total, params)


def _clean(f) -> dict[str, Any]:
    return {
        k: (v.isoformat() if isinstance(v, date) else (str(v) if v is not None else None))
        for k, v in vars(f).items()
        if v not in (None, False)
    }


@router.get("/stock-summary", response_model=Page[StockSummaryRow], responses=_XLSX_RESPONSES)
async def stock_summary(
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_permission(Module.REPORT, Action.LIST)),
    params: ListParams = Depends(),
    store_id: int | None = Query(None),
    item_id: int | None = Query(None),
    category_id: int | None = Query(None),
    low_only: bool = Query(False),
    export: ExportParam = Query(None),
):
    filters = svc.StockFilters(store_id=store_id, item_id=item_id, category_id=category_id, low_only=low_only)
    return await _stock_endpoint(db, user, ip, params, filters, export, "stock_summary")


@router.get("/low-stock", response_model=Page[StockSummaryRow], responses=_XLSX_RESPONSES)
async def low_stock(
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_permission(Module.REPORT, Action.LIST)),
    params: ListParams = Depends(),
    store_id: int | None = Query(None),
    item_id: int | None = Query(None),
    category_id: int | None = Query(None),
    export: ExportParam = Query(None),
):
    """Stocks where quantity <= low_stock_threshold."""
    filters = svc.StockFilters(store_id=store_id, item_id=item_id, category_id=category_id, low_only=True)
    return await _stock_endpoint(db, user, ip, params, filters, export, "low_stock")


@router.get("/allocations", response_model=Page[AllocationReportRow], responses=_XLSX_RESPONSES)
async def allocation_report(
    db: DB,
    ip: ClientIP,
    user: Any = Depends(require_permission(Module.REPORT, Action.LIST)),
    params: ListParams = Depends(),
    fiscal_year_id: int | None = Query(None),
    ship_base_id: int | None = Query(None),
    store_id: int | None = Query(None),
    item_id: int | None = Query(None),
    status: AllocationStatus | None = Query(None),
    type: AllocationType | None = Query(None),  # noqa: A002
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    export: ExportParam = Query(None),
):
    filters = svc.AllocationFilters(
        fiscal_year_id=fiscal_year_id,
        ship_base_id=ship_base_id,
        store_id=store_id,
        item_id=item_id,
        status=status,
        type=type,
        date_from=date_from,
        date_to=date_to,
        scope_ship_base_id=svc.scope_for(user),
    )
    if export == "xlsx":
        rows, _ = await svc.allocation_report(db, filters, params, all_rows=True)
        await log_action(
            db,
            user_id=user.id,
            action="export",
            entity="report:allocations",
            entity_id=None,
            after={"rows": len(rows), "filters": _clean(filters)},
            ip=ip,
        )
        rows_iter = (svc.allocation_export_row(r) for r in rows)
        return xlsx_response(svc.ALLOC_EXPORT_HEADERS, rows_iter, "allocations")
    rows, total = await svc.allocation_report(db, filters, params)
    return paginate([AllocationReportRow.model_validate(r) for r in rows], total, params)
