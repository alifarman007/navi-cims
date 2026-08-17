"""Dashboard summary: stat-card counts + chart aggregates + recent allocations + low stock."""

from typing import Any

from fastapi import APIRouter, Depends

from app.core.deps import DB, require_permission
from app.core.permissions import Action, Module
from app.schemas.report import DashboardSummary
from app.services import report as svc

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def summary(db: DB, user: Any = Depends(require_permission(Module.DASHBOARD, Action.LIST))):
    return DashboardSummary.model_validate(await svc.dashboard_summary(db, user))
