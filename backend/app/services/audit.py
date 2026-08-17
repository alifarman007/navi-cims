"""Audit-log writer and notification helper (kept together: both are 'side-effect' services)."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.misc import AuditLog, Notification


async def log_action(
    db: AsyncSession,
    *,
    user_id: int | None,
    action: str,
    entity: str,
    entity_id: int | str | None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    ip: str | None = None,
) -> None:
    def _clean(d: dict[str, Any] | None) -> dict[str, Any] | None:
        if not d:
            return None
        return {k: v for k, v in d.items() if k not in ("hashed_password",)}

    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id is not None else None,
            before=_clean(before),
            after=_clean(after),
            ip=ip,
        )
    )


async def notify(
    db: AsyncSession, *, user_ids: list[int], title: str, message: str, link: str | None = None
) -> None:
    for uid in {u for u in user_ids if u}:
        db.add(Notification(user_id=uid, title=title, message=message, link=link))
