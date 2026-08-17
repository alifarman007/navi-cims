"""Allocation/Sanction + Compilation/Verification services.

Workflow (docs/04-gap-analysis.md §C):
    pending --approve--> approved (stock deducted, verification row, notification)
    pending --send back {comment}--> sent_back --resubmit--> pending
    pending | sent_back --cancel--> cancelled
The approve/send-back logic lives ONLY here (`AllocationService.approve` / `.send_back`); both the
`/allocations/{id}/approve|send-back` endpoints and `POST /verifications` call into it.
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.core.permissions import Action, Module
from app.models.allocation import Allocation, Verification
from app.models.config import FiscalYear
from app.models.enums import AllocationStatus, Status, StockTxnType, UserType, VerificationAction
from app.models.inventory import Store
from app.models.item import Item
from app.models.role import Module as ModuleModel
from app.models.role import Role, RolePermission
from app.models.ship_base import ShipBase
from app.models.user import User
from app.schemas.allocation import (
    AllocationCreate,
    AllocationUpdate,
    VerificationCreate,
    VerificationUpdate,
)
from app.services.audit import log_action, notify
from app.services.crud_base import CRUDService
from app.services.stock_ledger import apply_stock_movement
from app.utils.query import ListParams, build_search

EDITABLE_STATUSES = (AllocationStatus.PENDING, AllocationStatus.SENT_BACK)
ADMIN_TYPES = (UserType.SUPER_ADMIN, UserType.ADMIN)


def _is_admin(user: User | None) -> bool:
    return bool(user and (user.is_superuser or user.user_type in ADMIN_TYPES))


async def _load_user(db, user_id: int | None) -> User | None:
    if user_id is None:
        return None
    return (await db.execute(select(User).where(User.id == user_id))).scalars().first()


async def _verifier_user_ids(db) -> list[int]:
    """Active users whose role grants Compilation/Verification edit (they get 'new allocation' notifications)."""
    stmt = (
        select(User.id)
        .join(Role, User.role_id == Role.id)
        .join(RolePermission, RolePermission.role_id == Role.id)
        .join(ModuleModel, RolePermission.module_id == ModuleModel.id)
        .where(
            ModuleModel.code == Module.COMPILATION_VERIFICATION,
            RolePermission.can_edit.is_(True),
            User.status == Status.ACTIVE,
            Role.status == Status.ACTIVE,
        )
    )
    return list((await db.execute(stmt)).scalars().all())


class AllocationService(CRUDService[Allocation, AllocationCreate, AllocationUpdate]):
    model = Allocation
    entity_name = "Allocation"
    filterable = {
        "code": Allocation.code,
        "allocation_type": Allocation.allocation_type,
        "fiscal_year_id": Allocation.fiscal_year_id,
        "fiscal_year": FiscalYear.name,
        "allocation_date": Allocation.allocation_date,
        "store_id": Allocation.store_id,
        "store": Store.name,
        "item_id": Allocation.item_id,
        "item": Item.name,
        "ship_base_id": Allocation.ship_base_id,
        "ship_base": ShipBase.name,
        "quantity": Allocation.quantity,
        "status": Allocation.status,
        "created_by_id": Allocation.created_by_id,
    }
    sortable = {
        "id": Allocation.id,
        "code": Allocation.code,
        "allocation_type": Allocation.allocation_type,
        "fiscal_year": FiscalYear.name,
        "allocation_date": Allocation.allocation_date,
        "store": Store.name,
        "item": Item.name,
        "ship_base": ShipBase.name,
        "quantity": Allocation.quantity,
        "status": Allocation.status,
        "created_at": Allocation.created_at,
    }
    search_fields = [Allocation.code, Allocation.remarks, Item.name, ShipBase.name, Store.name]
    unique_fields = ("code",)

    _scope_user: User | None = None

    def base_query(self):
        return (
            select(Allocation)
            .outerjoin(FiscalYear, Allocation.fiscal_year_id == FiscalYear.id)
            .outerjoin(Store, Allocation.store_id == Store.id)
            .outerjoin(Item, Allocation.item_id == Item.id)
            .outerjoin(ShipBase, Allocation.ship_base_id == ShipBase.id)
        )

    # ---- scoping: ship/base users see only their own ship/base -------------------------
    async def current_user(self) -> User | None:
        if self._scope_user is None:
            self._scope_user = await _load_user(self.db, self.user_id)
        return self._scope_user

    def apply_scope(self, stmt, params: ListParams):
        u = self._scope_user
        if u is not None and u.user_type == UserType.SHIP_BASE_USER and not u.is_superuser:
            stmt = stmt.where(Allocation.ship_base_id == (u.ship_base_id or -1))
        return stmt

    async def list(self, params: ListParams):
        await self.current_user()
        return await super().list(params)

    async def get(self, obj_id: int) -> Allocation:
        obj = await super().get(obj_id)
        u = await self.current_user()
        if u is not None and u.user_type == UserType.SHIP_BASE_USER and not u.is_superuser:
            if obj.ship_base_id != u.ship_base_id:
                raise NotFoundError(self.entity_name, obj_id)
        return obj

    async def options(self, q: str | None = None, limit: int = 50, status: AllocationStatus | None = None):
        await self.current_user()
        stmt = self.apply_scope(self.base_query(), None)  # type: ignore[arg-type]
        if status is not None:
            stmt = stmt.where(Allocation.status == status)
        if q:
            stmt = stmt.where(build_search(q, [Allocation.code, Item.name, ShipBase.name]))
        stmt = stmt.order_by(Allocation.id.desc()).limit(limit)
        rows = (await self.db.execute(stmt)).scalars().unique().all()
        return [{"id": r.id, "label": self.option_label(r)} for r in rows]

    def option_label(self, obj: Allocation) -> str:
        item = obj.item.name if obj.item else ""
        sb = obj.ship_base.name if obj.ship_base else ""
        qty = f"{Decimal(obj.quantity).normalize():f}"
        return f"{obj.code} - {item} -> {sb} ({qty})"

    # ---- create/update/delete guards --------------------------------------------------
    async def before_create(self, data: dict[str, Any]) -> dict[str, Any]:
        data["status"] = AllocationStatus.PENDING
        return data

    async def after_create(self, obj: Allocation) -> None:
        await notify(
            self.db,
            user_ids=await _verifier_user_ids(self.db),
            title="New allocation pending",
            message=f"Allocation {obj.code} is awaiting verification.",
            link="/verification",
        )

    async def before_update(self, obj: Allocation, data: dict[str, Any]) -> dict[str, Any]:
        if obj.status not in EDITABLE_STATUSES:
            raise ConflictError(f"Allocation {obj.code} is {obj.status.value} and cannot be edited")
        return data

    async def before_delete(self, obj: Allocation) -> None:
        if obj.status not in EDITABLE_STATUSES:
            raise ConflictError(f"Allocation {obj.code} is {obj.status.value} and cannot be deleted")

    # ---- workflow ------------------------------------------------------------------------
    async def _new_verification(
        self,
        obj: Allocation,
        *,
        approver_id: int,
        action: VerificationAction,
        comment: str | None,
        code: str | None = None,
    ) -> Verification:
        if code:
            dup = (await self.db.execute(select(Verification.id).where(Verification.code == code))).first()
            if dup:
                raise ConflictError(f"Verification with code '{code}' already exists")
        ver = Verification(
            code=code or f"VRF-TMP-{uuid4().hex[:12]}",
            allocation_id=obj.id,
            approver_id=approver_id,
            action=action,
            comment=comment,
            acted_at=datetime.now(UTC),
            created_by_id=self.user_id,
            updated_by_id=self.user_id,
        )
        self.db.add(ver)
        await self.db.flush()
        if not code:
            ver.code = f"VRF-{ver.id:05d}"
            await self.db.flush()
        await self.db.refresh(ver)
        await log_action(
            self.db,
            user_id=self.user_id,
            action="create",
            entity="verifications",
            entity_id=ver.id,
            after=ver.to_dict(),
            ip=self.ip,
        )
        return ver

    async def approve(
        self,
        obj_id: int,
        *,
        approver_id: int | None = None,
        comment: str | None = None,
        verification_code: str | None = None,
    ) -> Allocation:
        obj = await self.get(obj_id)
        if obj.status != AllocationStatus.PENDING:
            raise ConflictError(
                f"Only pending allocations can be approved (current status: {obj.status.value})"
            )
        approver = approver_id or self.user_id
        if approver is None:
            raise ForbiddenError("Approver is required")
        before = obj.to_dict()
        # deduct stock (409 when insufficient) — the ledger is the only place stock changes
        await apply_stock_movement(
            self.db,
            store_id=obj.store_id,
            item_id=obj.item_id,
            quantity_delta=-Decimal(obj.quantity),
            txn_type=StockTxnType.ALLOCATION_OUT,
            user_id=self.user_id,
            ref_type="allocation",
            ref_id=obj.id,
            remarks=f"{obj.allocation_type.value} {obj.code} → {obj.ship_base.name if obj.ship_base else obj.ship_base_id}",
        )
        obj.status = AllocationStatus.APPROVED
        obj.approved_at = datetime.now(UTC)
        obj.approved_by_id = approver
        obj.updated_by_id = self.user_id
        await self.db.flush()
        await self._new_verification(
            obj,
            approver_id=approver,
            action=VerificationAction.APPROVED,
            comment=comment,
            code=verification_code,
        )
        await self.db.refresh(obj)
        await log_action(
            self.db,
            user_id=self.user_id,
            action="approve",
            entity="allocations",
            entity_id=obj.id,
            before=before,
            after=obj.to_dict(),
            ip=self.ip,
        )
        await notify(
            self.db,
            user_ids=[obj.created_by_id] if obj.created_by_id else [],
            title="Allocation approved",
            message=f"Allocation {obj.code} has been approved.",
            link="/allocation",
        )
        return await self.get(obj.id)

    async def send_back(
        self,
        obj_id: int,
        *,
        comment: str,
        approver_id: int | None = None,
        verification_code: str | None = None,
    ) -> Allocation:
        obj = await self.get(obj_id)
        if obj.status != AllocationStatus.PENDING:
            raise ConflictError(
                f"Only pending allocations can be sent back (current status: {obj.status.value})"
            )
        if not comment or not comment.strip():
            raise ConflictError("A comment is required to send an allocation back")
        approver = approver_id or self.user_id
        if approver is None:
            raise ForbiddenError("Approver is required")
        before = obj.to_dict()
        obj.status = AllocationStatus.SENT_BACK
        obj.updated_by_id = self.user_id
        await self.db.flush()
        await self._new_verification(
            obj,
            approver_id=approver,
            action=VerificationAction.SENT_BACK,
            comment=comment.strip(),
            code=verification_code,
        )
        await self.db.refresh(obj)
        await log_action(
            self.db,
            user_id=self.user_id,
            action="send_back",
            entity="allocations",
            entity_id=obj.id,
            before=before,
            after=obj.to_dict(),
            ip=self.ip,
        )
        await notify(
            self.db,
            user_ids=[obj.created_by_id] if obj.created_by_id else [],
            title="Allocation sent back",
            message=f"Allocation {obj.code} was sent back: {comment.strip()}",
            link="/allocation",
        )
        return await self.get(obj.id)

    async def cancel(self, obj_id: int, *, user: User) -> Allocation:
        obj = await self.get(obj_id)
        if obj.status not in EDITABLE_STATUSES:
            raise ConflictError(
                f"Only pending or sent-back allocations can be cancelled (current: {obj.status.value})"
            )
        if not (_is_admin(user) or obj.created_by_id == user.id):
            raise ForbiddenError("Only the creator or an admin can cancel this allocation")
        before = obj.to_dict()
        obj.status = AllocationStatus.CANCELLED
        obj.updated_by_id = self.user_id
        await self.db.flush()
        await self.db.refresh(obj)
        await log_action(
            self.db,
            user_id=self.user_id,
            action="cancel",
            entity="allocations",
            entity_id=obj.id,
            before=before,
            after=obj.to_dict(),
            ip=self.ip,
        )
        return await self.get(obj.id)

    async def resubmit(self, obj_id: int, *, user: User) -> Allocation:
        from app.core.deps import has_permission

        obj = await self.get(obj_id)
        if obj.status != AllocationStatus.SENT_BACK:
            raise ConflictError(
                f"Only sent-back allocations can be resubmitted (current: {obj.status.value})"
            )
        if not (
            obj.created_by_id == user.id or has_permission(user, Module.ALLOCATION_SANCTION, Action.EDIT)
        ):
            raise ForbiddenError("Permission denied: allocation_sanction.edit")
        before = obj.to_dict()
        obj.status = AllocationStatus.PENDING
        obj.updated_by_id = self.user_id
        await self.db.flush()
        await self.db.refresh(obj)
        await log_action(
            self.db,
            user_id=self.user_id,
            action="resubmit",
            entity="allocations",
            entity_id=obj.id,
            before=before,
            after=obj.to_dict(),
            ip=self.ip,
        )
        await notify(
            self.db,
            user_ids=await _verifier_user_ids(self.db),
            title="Allocation resubmitted",
            message=f"Allocation {obj.code} was resubmitted and is awaiting verification.",
            link="/verification",
        )
        return await self.get(obj.id)


class VerificationService(CRUDService[Verification, VerificationCreate, VerificationUpdate]):
    model = Verification
    entity_name = "Verification"
    filterable = {
        "code": Verification.code,
        "allocation_id": Verification.allocation_id,
        "allocation": Allocation.code,
        "approver_id": Verification.approver_id,
        "approver": User.full_name,
        "action": Verification.action,
        "acted_at": Verification.acted_at,
    }
    sortable = {
        "id": Verification.id,
        "code": Verification.code,
        "allocation": Allocation.code,
        "approver": User.full_name,
        "action": Verification.action,
        "acted_at": Verification.acted_at,
        "created_at": Verification.created_at,
    }
    search_fields = [Verification.code, Verification.comment, Allocation.code, User.full_name]
    unique_fields = ("code",)
    label_field = "code"

    def base_query(self):
        return (
            select(Verification)
            .outerjoin(Allocation, Verification.allocation_id == Allocation.id)
            .outerjoin(User, Verification.approver_id == User.id)
            .options(selectinload(Verification.allocation))
        )

    def option_label(self, obj: Verification) -> str:
        return obj.code

    async def create(self, payload: VerificationCreate) -> Verification:  # type: ignore[override]
        """Single code path: creating a verification == approving / sending back the allocation."""
        alloc_svc = AllocationService(self.db, user_id=self.user_id, ip=self.ip)
        approver = payload.approver_id or self.user_id
        if payload.approver_id is not None:
            if (await _load_user(self.db, payload.approver_id)) is None:
                raise NotFoundError("Approver", payload.approver_id)
        if payload.action == VerificationAction.SENT_BACK:
            if not payload.comment or not payload.comment.strip():
                raise ConflictError("A comment is required to send an allocation back")
            alloc = await alloc_svc.send_back(
                payload.allocation_id,
                comment=payload.comment,
                approver_id=approver,
                verification_code=payload.code,
            )
        else:
            alloc = await alloc_svc.approve(
                payload.allocation_id,
                approver_id=approver,
                comment=payload.comment,
                verification_code=payload.code,
            )
        ver = alloc.verifications[-1]
        return await self.get(ver.id)

    async def before_delete(self, obj: Verification) -> None:
        user = await _load_user(self.db, self.user_id)
        if not _is_admin(user):
            raise ForbiddenError("Only admins can delete verifications")
        if obj.action == VerificationAction.APPROVED:
            raise ConflictError("Approved verifications cannot be deleted (stock has already been deducted)")
