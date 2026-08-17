"""Audit log (read-only): who did what, when — super_admin / admin only (DSIG "Monitoring User Action")."""

from datetime import UTC, date, datetime, time, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from app.core.deps import DB, require_user_types
from app.models.enums import UserType
from app.models.misc import AuditLog
from app.models.user import User
from app.schemas.common import Page
from app.schemas.misc import AuditLogRead
from app.services.crud_base import paginate
from app.utils.query import ListParams, build_filters, build_search, combine, parse_sort

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])

_FILTERABLE = {
    "user_id": AuditLog.user_id,
    "user": User.username,
    "username": User.username,
    "action": AuditLog.action,
    "entity": AuditLog.entity,
    "entity_id": AuditLog.entity_id,
    "ip": AuditLog.ip,
}
_SORTABLE = {
    "id": AuditLog.id,
    "created_at": AuditLog.created_at,
    "action": AuditLog.action,
    "entity": AuditLog.entity,
    "user": User.username,
}
_SEARCH = [AuditLog.action, AuditLog.entity, AuditLog.entity_id, User.username, User.full_name]

_ADMINS = require_user_types(UserType.SUPER_ADMIN, UserType.ADMIN)


@router.get("", response_model=Page[AuditLogRead])
async def list_audit_logs(
    db: DB,
    user: Any = Depends(_ADMINS),
    params: ListParams = Depends(),
    user_id: int | None = Query(None),
    entity: str | None = Query(None),
    action: str | None = Query(None),
    date_from: date | None = Query(None, description="inclusive (created_at >= date_from 00:00)"),
    date_to: date | None = Query(None, description="inclusive (created_at < date_to + 1 day)"),
):
    stmt = select(AuditLog).outerjoin(User, User.id == AuditLog.user_id)
    clauses = list(build_filters(params.filters, _FILTERABLE))
    if user_id is not None:
        clauses.append(AuditLog.user_id == user_id)
    if entity:
        clauses.append(AuditLog.entity.ilike(f"%{entity}%"))
    if action:
        clauses.append(AuditLog.action == action)
    if date_from:
        clauses.append(AuditLog.created_at >= datetime.combine(date_from, time.min, tzinfo=UTC))
    if date_to:
        clauses.append(
            AuditLog.created_at < datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=UTC)
        )
    where = combine(*clauses, build_search(params.q, _SEARCH))
    if where is not None:
        stmt = stmt.where(where)
    total = (await db.execute(select(func.count()).select_from(stmt.order_by(None).subquery()))).scalar_one()
    stmt = stmt.order_by(parse_sort(params.sort, _SORTABLE, "created_at:desc"), AuditLog.id.desc())
    stmt = stmt.offset(params.offset).limit(params.page_size)
    rows = (await db.execute(stmt)).scalars().unique().all()
    return paginate([AuditLogRead.model_validate(r) for r in rows], int(total), params)
