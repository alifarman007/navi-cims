"""Procurement Item Info: read-only list over the BNPIMS cache + sync (upsert by external_id)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.bnpims import BnpimsClientProtocol, get_client
from app.models.misc import ProcurementItem
from app.services.audit import log_action
from app.services.crud_base import CRUDService

_UPSERT_FIELDS = (
    "grn_no",
    "transaction_date",
    "imc",
    "item_name",
    "deno",
    "receive_quantity",
    "part_no",
    "remarks",
    "raw",
)


class _NoWrite(BaseModel):
    """Placeholder: procurement items are never written through the API."""


class ProcurementItemService(CRUDService[ProcurementItem, _NoWrite, _NoWrite]):
    model = ProcurementItem
    entity_name = "Procurement Item"
    filterable = {
        "external_id": ProcurementItem.external_id,
        "grn_no": ProcurementItem.grn_no,
        "transaction_date": ProcurementItem.transaction_date,
        "imc": ProcurementItem.imc,
        "item_name": ProcurementItem.item_name,
        "deno": ProcurementItem.deno,
        "receive_quantity": ProcurementItem.receive_quantity,
        "part_no": ProcurementItem.part_no,
        "remarks": ProcurementItem.remarks,
    }
    sortable = {
        "id": ProcurementItem.id,
        "external_id": ProcurementItem.external_id,
        "grn_no": ProcurementItem.grn_no,
        "transaction_date": ProcurementItem.transaction_date,
        "imc": ProcurementItem.imc,
        "item_name": ProcurementItem.item_name,
        "deno": ProcurementItem.deno,
        "receive_quantity": ProcurementItem.receive_quantity,
        "part_no": ProcurementItem.part_no,
        "synced_at": ProcurementItem.synced_at,
    }
    search_fields = [
        ProcurementItem.grn_no,
        ProcurementItem.imc,
        ProcurementItem.item_name,
        ProcurementItem.part_no,
        ProcurementItem.remarks,
    ]
    default_sort = "transaction_date:desc"
    unique_fields = ("external_id",)
    label_field = "item_name"

    def option_label(self, obj: ProcurementItem) -> str:
        return f"{obj.grn_no or obj.external_id} - {obj.item_name or ''}".strip(" -")


async def sync(
    db: AsyncSession,
    user_id: int | None,
    *,
    client: BnpimsClientProtocol | None = None,
    ip: str | None = None,
    incremental: bool = False,
) -> dict[str, Any]:
    """Pull rows from BNPIMS and upsert them by `external_id`. Returns {fetched, created, updated, synced_at}.

    `incremental=True` passes the last transaction_date we know as `since` (the mock ignores nothing; a real
    BNPIMS may honour it). Default is a full pull so corrections upstream propagate.
    """
    client = client or get_client()
    since: datetime | None = None
    if incremental:
        since = (await db.execute(select(func.max(ProcurementItem.transaction_date)))).scalar_one_or_none()
    rows = await client.fetch_items(since)
    now = datetime.now(UTC)

    ext_ids = [r["external_id"] for r in rows if r.get("external_id")]
    existing: dict[str, ProcurementItem] = {}
    if ext_ids:
        res = await db.execute(select(ProcurementItem).where(ProcurementItem.external_id.in_(ext_ids)))
        existing = {p.external_id: p for p in res.scalars().all()}

    created = updated = 0
    seen: set[str] = set()
    for r in rows:
        ext = r.get("external_id")
        if not ext or ext in seen:
            continue
        seen.add(ext)
        obj = existing.get(ext)
        if obj is None:
            obj = ProcurementItem(external_id=ext, synced_at=now, **{k: r.get(k) for k in _UPSERT_FIELDS})
            db.add(obj)
            existing[ext] = obj
            created += 1
        else:
            changed = False
            for k in _UPSERT_FIELDS:
                if getattr(obj, k) != r.get(k):
                    setattr(obj, k, r.get(k))
                    changed = True
            obj.synced_at = now
            if changed:
                updated += 1
    await db.flush()
    result = {"fetched": len(rows), "created": created, "updated": updated, "synced_at": now}
    await log_action(
        db,
        user_id=user_id,
        action="sync",
        entity="procurement_items",
        entity_id=None,
        after={"fetched": len(rows), "created": created, "updated": updated, "synced_at": now.isoformat()},
        ip=ip,
    )
    return result
