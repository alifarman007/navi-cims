"""Notifications: the current user's inbox (list newest first, unread count, mark read, read-all)."""

from fastapi import APIRouter, Depends

from app.core.deps import DB, CurrentUser
from app.schemas.common import Message, Page
from app.schemas.misc import NotificationRead, UnreadCount
from app.services.crud_base import paginate
from app.services.notification import NotificationService
from app.utils.query import ListParams

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=Page[NotificationRead])
async def list_notifications(db: DB, user: CurrentUser, params: ListParams = Depends()):
    rows, total = await NotificationService(db, user.id).list(params)
    return paginate([NotificationRead.model_validate(r) for r in rows], total, params)


@router.get("/unread-count", response_model=UnreadCount)
async def unread_count(db: DB, user: CurrentUser):
    return UnreadCount(count=await NotificationService(db, user.id).unread_count())


@router.post("/read-all", response_model=Message)
async def read_all(db: DB, user: CurrentUser):
    n = await NotificationService(db, user.id).mark_all_read()
    return Message(detail=f"{n} notification(s) marked as read")


@router.patch("/{notification_id}/read", response_model=NotificationRead)
async def mark_read(notification_id: int, db: DB, user: CurrentUser):
    return NotificationRead.model_validate(await NotificationService(db, user.id).mark_read(notification_id))
