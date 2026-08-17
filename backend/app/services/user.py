"""User Management service: soft delete (status=inactive), password hashing, user-type bindings, admin guards."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select

from app.core.exceptions import ConflictError, ForbiddenError
from app.core.security import hash_password
from app.models.enums import Status, UserType
from app.models.role import Role
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit import log_action
from app.services.crud_base import CRUDService
from app.utils.query import build_search


def _is_super(u: User | None) -> bool:
    return bool(u and (u.is_superuser or u.user_type == UserType.SUPER_ADMIN))


class UserService(CRUDService[User, UserCreate, UserUpdate]):
    model = User
    entity_name = "User"
    filterable = {
        "user_type": User.user_type,
        "username": User.username,
        "full_name": User.full_name,
        "email": User.email,
        "phone": User.phone,
        "role_id": User.role_id,
        "role": Role.name,
        "status": User.status,
        "office_id": User.office_id,
        "ship_base_id": User.ship_base_id,
    }
    sortable = {
        "id": User.id,
        "user_type": User.user_type,
        "username": User.username,
        "full_name": User.full_name,
        "email": User.email,
        "phone": User.phone,
        "role": Role.name,
        "status": User.status,
        "created_at": User.created_at,
        "last_login_at": User.last_login_at,
    }
    search_fields = [User.username, User.full_name, User.email, User.phone]
    unique_fields = ("username", "email", "phone")
    label_field = "username"

    def base_query(self):
        return select(User).outerjoin(Role, User.role_id == Role.id)

    # ---- helpers -----------------------------------------------------------------
    async def actor(self) -> User | None:
        if self.user_id is None:
            return None
        return (await self.db.execute(select(User).where(User.id == self.user_id))).scalars().first()

    async def _check_privilege(self, new_type: UserType | None, target: User | None = None) -> None:
        """Only super_admin/admin may create Admins; only a super_admin may create/modify Super Admin accounts."""
        act = await self.actor()
        if act is None:
            return
        if target is not None and _is_super(target) and not _is_super(act):
            raise ForbiddenError("Only a Super Admin can modify a Super Admin account")
        if new_type == UserType.SUPER_ADMIN and not _is_super(act):
            raise ForbiddenError("Only a Super Admin can create a Super Admin user")
        if new_type == UserType.ADMIN and not (_is_super(act) or act.user_type == UserType.ADMIN):
            raise ForbiddenError("Only a Super Admin or Admin can create an Admin user")

    @staticmethod
    def _validate_bindings(user_type: UserType, office_id: int | None, ship_base_id: int | None) -> None:
        if user_type == UserType.SHIP_BASE_USER and not ship_base_id:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, "Ship/Base is required for a Ship/Base User"
            )
        if user_type == UserType.OFFICE_USER and not office_id:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, "Office is required for an Office User"
            )

    def _guard_disable(self, target: User) -> None:
        if _is_super(target):
            raise ForbiddenError("Super Admin account cannot be disabled")
        if self.user_id is not None and target.id == self.user_id:
            raise ConflictError("You cannot disable your own account")

    # ---- options ---------------------------------------------------------------------
    async def options(self, q: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        stmt = select(User).where(User.status == Status.ACTIVE)
        if q:
            stmt = stmt.where(build_search(q, [User.username, User.full_name, User.email]))
        stmt = stmt.order_by(User.username.asc()).limit(limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [{"id": r.id, "label": self.option_label(r)} for r in rows]

    def option_label(self, obj: User) -> str:
        return f"{obj.username} - {obj.full_name}"

    # ---- CRUD hooks ------------------------------------------------------------------
    async def before_create(self, data: dict[str, Any]) -> dict[str, Any]:
        await self._check_privilege(data["user_type"])
        self._validate_bindings(data["user_type"], data.get("office_id"), data.get("ship_base_id"))
        data["hashed_password"] = hash_password(data.pop("password"))
        data["is_superuser"] = data["user_type"] == UserType.SUPER_ADMIN
        if data.get("email"):
            data["email"] = data["email"].lower()
        return data

    async def before_update(self, obj: User, data: dict[str, Any]) -> dict[str, Any]:
        new_type = data.get("user_type") or obj.user_type
        await self._check_privilege(data.get("user_type"), target=obj)
        if _is_super(obj) and new_type != UserType.SUPER_ADMIN:
            raise ConflictError("Super Admin account type cannot be changed")
        if data.get("status") == Status.INACTIVE and obj.status != Status.INACTIVE:
            self._guard_disable(obj)
        self._validate_bindings(
            new_type, data.get("office_id", obj.office_id), data.get("ship_base_id", obj.ship_base_id)
        )
        pw = data.pop("password", None)
        if pw:
            data["hashed_password"] = hash_password(pw)
            data["password_changed_at"] = datetime.now(UTC)
        if "user_type" in data and data["user_type"] is not None:
            data["is_superuser"] = new_type == UserType.SUPER_ADMIN
        else:
            data.pop("user_type", None)
        if data.get("email"):
            data["email"] = data["email"].lower()
        return data

    async def set_status(self, obj_id: int, status_value) -> User:
        obj = await self.get(obj_id)
        if status_value == Status.INACTIVE:
            self._guard_disable(obj)
        return await super().set_status(obj_id, status_value)

    async def delete(self, obj_id: int) -> None:
        """SRS: users are never removed — 'delete' disables the account (status=inactive)."""
        obj = await self.get(obj_id)
        self._guard_disable(obj)
        before = obj.to_dict()
        obj.status = Status.INACTIVE
        obj.updated_by_id = self.user_id
        await self.db.flush()
        await self.db.refresh(obj)
        await log_action(
            self.db,
            user_id=self.user_id,
            action="delete",
            entity=User.__tablename__,
            entity_id=obj.id,
            before=before,
            after=obj.to_dict(),
            ip=self.ip,
        )

    # ---- custom ---------------------------------------------------------------------------
    async def reset_password(self, obj_id: int, new_password: str) -> User:
        obj = await self.get(obj_id)
        if _is_super(obj) and not _is_super(await self.actor()):
            raise ForbiddenError("Only a Super Admin can reset a Super Admin password")
        obj.hashed_password = hash_password(new_password)
        obj.password_changed_at = datetime.now(UTC)
        obj.updated_by_id = self.user_id
        await self.db.flush()
        await self.db.refresh(obj)
        await log_action(
            self.db,
            user_id=self.user_id,
            action="reset_password",
            entity=User.__tablename__,
            entity_id=obj.id,
            ip=self.ip,
        )
        return obj
