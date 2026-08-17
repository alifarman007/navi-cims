"""Notifications: per-user inbox (list newest first, unread count, mark read / read-all).

Creation happens through `app.services.audit.notify(...)` from the workflow services (allocation approve/send-back,
low stock, ...). This service only exposes the *own inbox* operations — a user can never see or mark another
user's notifications.
"""

from __future__ import annotations

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.misc import Notification
from app.utils.query import ListParams, build_filters, combine, parse_sort

_FILTERABLE = {"title": Notification.title, "message": Notification.message, "is_read": Notification.is_read}
_SORTABLE = {
    "id": Notification.id,
    "created_at": Notification.created_at,
    "is_read": Notification.is_read,
    "title": Notification.title,
}


class NotificationService:
    def __init__(self, db: AsyncSession, user_id: int):
        self.db = db
        self.user_id = user_id

    async def list(self, params: ListParams) -> tuple[list[Notification], int]:
        stmt = select(Notification).where(Notification.user_id == self.user_id)
        where = combine(*build_filters(params.filters, _FILTERABLE))
        if where is not None:
            stmt = stmt.where(where)
        total = (
            await self.db.execute(select(func.count()).select_from(stmt.order_by(None).subquery()))
        ).scalar_one()
        stmt = stmt.order_by(parse_sort(params.sort, _SORTABLE, "created_at:desc"), Notification.id.desc())
        stmt = stmt.offset(params.offset).limit(params.page_size)
        rows = (await self.db.execute(stmt)).scalars().all()
        return list(rows), int(total)

    async def unread_count(self) -> int:
        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == self.user_id, Notification.is_read.is_(False))
        )
        return int((await self.db.execute(stmt)).scalar_one())

    async def mark_read(self, notification_id: int) -> Notification:
        obj = (
            (
                await self.db.execute(
                    select(Notification).where(
                        Notification.id == notification_id, Notification.user_id == self.user_id
                    )
                )
            )
            .scalars()
            .first()
        )
        if obj is None:
            raise NotFoundError("Notification", notification_id)
        if not obj.is_read:
            obj.is_read = True
            await self.db.flush()
        return obj

    async def mark_all_read(self) -> int:
        res = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == self.user_id, Notification.is_read.is_(False))
            .values(is_read=True)
        )
        return int(res.rowcount or 0)
