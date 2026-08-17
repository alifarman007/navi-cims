"""Role + permission-matrix service (Figma "Role Permission")."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select

from app.core.exceptions import ConflictError
from app.models.role import Module, Role, RolePermission
from app.models.user import User
from app.schemas.role import PermissionInput, RoleCreate, RoleUpdate
from app.services.audit import log_action
from app.services.crud_base import CRUDService

FLAGS = ("menu", "list", "view", "add", "edit", "delete")


class RoleService(CRUDService[Role, RoleCreate, RoleUpdate]):
    model = Role
    entity_name = "Role"
    filterable = {"name": Role.name, "status": Role.status, "is_system": Role.is_system}
    sortable = {
        "id": Role.id,
        "name": Role.name,
        "status": Role.status,
        "is_system": Role.is_system,
        "created_at": Role.created_at,
    }
    search_fields = [Role.name, Role.description]
    unique_fields = ("name",)
    label_field = "name"
    referenced_by = ((User, User.role_id),)

    _pending_perms: list[dict[str, Any]] | None = None

    # ---- modules ---------------------------------------------------------------
    async def list_modules(self) -> list[Module]:
        stmt = select(Module).order_by(Module.sort_order.asc(), Module.id.asc())
        return list((await self.db.execute(stmt)).scalars())

    async def _modules_by_code(self, codes: set[str]) -> dict[str, Module]:
        mods = {m.code: m for m in await self.list_modules()}
        unknown = sorted(codes - set(mods))
        if unknown:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, f"Unknown module code(s): {', '.join(unknown)}"
            )
        return mods

    async def _replace_permissions(self, role: Role, perms: list[dict[str, Any]]) -> None:
        """Replace the whole matrix. Rows with every flag False are not stored."""
        mods = await self._modules_by_code({p["module_code"] for p in perms})
        for old in list(role.permissions):
            await self.db.delete(old)
        await self.db.flush()
        merged: dict[str, dict[str, Any]] = {}
        for p in perms:  # last row wins if a module is sent twice
            merged[p["module_code"]] = p
        for code, p in merged.items():
            flags = {k: bool(p.get(k)) for k in FLAGS}
            if not any(flags.values()):
                continue
            self.db.add(
                RolePermission(
                    role_id=role.id,
                    module_id=mods[code].id,
                    can_menu=flags["menu"],
                    can_list=flags["list"],
                    can_view=flags["view"],
                    can_add=flags["add"],
                    can_edit=flags["edit"],
                    can_delete=flags["delete"],
                )
            )
        await self.db.flush()
        await self.db.refresh(role, attribute_names=["permissions"])

    @staticmethod
    def _matrix(role: Role) -> list[dict[str, Any]]:
        return [
            {
                "module": rp.module.code,
                "menu": rp.can_menu,
                "list": rp.can_list,
                "view": rp.can_view,
                "add": rp.can_add,
                "edit": rp.can_edit,
                "delete": rp.can_delete,
            }
            for rp in sorted(role.permissions, key=lambda r: r.module.sort_order)
        ]

    # ---- CRUD hooks --------------------------------------------------------------
    async def before_create(self, data: dict[str, Any]) -> dict[str, Any]:
        self._pending_perms = data.pop("permissions", None) or []
        data["is_system"] = False
        return data

    async def after_create(self, obj: Role) -> None:
        await self._replace_permissions(obj, self._pending_perms or [])
        self._pending_perms = None

    async def before_update(self, obj: Role, data: dict[str, Any]) -> dict[str, Any]:
        if obj.is_system and "name" in data and data["name"] is not None and data["name"] != obj.name:
            raise ConflictError("System role name cannot be changed")
        data.pop("is_system", None)
        self._pending_perms = data.pop("permissions", None)
        return data

    async def after_update(self, obj: Role) -> None:
        if self._pending_perms is not None:
            await self._replace_permissions(obj, self._pending_perms)
        self._pending_perms = None

    async def before_delete(self, obj: Role) -> None:
        if obj.is_system:
            raise ConflictError("System role cannot be deleted")
        await super().before_delete(obj)

    # ---- custom --------------------------------------------------------------------
    async def set_permissions(self, role_id: int, perms: list[PermissionInput]) -> Role:
        role = await self.get(role_id)
        before = self._matrix(role)
        await self._replace_permissions(role, [p.model_dump() for p in perms])
        role.updated_by_id = self.user_id
        await self.db.flush()
        await log_action(
            self.db,
            user_id=self.user_id,
            action="permissions",
            entity=Role.__tablename__,
            entity_id=role.id,
            before={"permissions": before},
            after={"permissions": self._matrix(role)},
            ip=self.ip,
        )
        return await self.get(role.id)
