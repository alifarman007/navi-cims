"""Idempotent seed: modules, system roles, super admin (SRS: created at installation), base master data.

Run: python -m app.db.seed
"""

from __future__ import annotations

import asyncio
import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.permissions import ALL_ACTIONS, MODULE_DEFINITIONS, Module
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models import (
    Country,
    Division,
    FiscalYear,
    ItemUnit,
    Role,
    RolePermission,
    ShipBaseCategory,
    User,
    UserType,
)
from app.models import (
    Module as ModuleModel,
)

log = logging.getLogger("cims.seed")

BD_DIVISIONS = [
    ("Dhaka", "ঢাকা"),
    ("Chattogram", "চট্টগ্রাম"),
    ("Khulna", "খুলনা"),
    ("Rajshahi", "রাজশাহী"),
    ("Barishal", "বরিশাল"),
    ("Sylhet", "সিলেট"),
    ("Rangpur", "রংপুর"),
    ("Mymensingh", "ময়মনসিংহ"),
]
COUNTRIES = [
    ("Bangladesh", "BD", "+6"),
    ("China", "CN", "+8"),
    ("United Kingdom", "GB", "+0"),
    ("United States", "US", "-5"),
    ("Germany", "DE", "+1"),
    ("Japan", "JP", "+9"),
    ("Turkey", "TR", "+3"),
    ("Netherlands", "NL", "+1"),
    ("Italy", "IT", "+1"),
    ("India", "IN", "+5.5"),
]
UNITS = [
    ("U-01", "Numbers", "Nos"),
    ("U-02", "Meter", "Mtr"),
    ("U-03", "Kilogram", "Kg"),
    ("U-04", "Litre", "Ltr"),
    ("U-05", "Set", "Set"),
    ("U-06", "Pair", "Pr"),
    ("U-07", "Box", "Box"),
    ("U-08", "Roll", "Roll"),
]
SB_CATEGORIES = [
    ("SBC-01", "Frigate"),
    ("SBC-02", "Corvette"),
    ("SBC-03", "Patrol Craft"),
    ("SBC-04", "Submarine"),
    ("SBC-05", "Auxiliary"),
    ("SBC-06", "Naval Base"),
    ("SBC-07", "Depot"),
    ("SBC-08", "Forward Base"),
]

# Default role permission templates: module -> set of actions
ROLE_TEMPLATES: dict[str, dict[str, set[str]]] = {
    "Admin": {m["code"]: set(a.value for a in ALL_ACTIONS) for m in MODULE_DEFINITIONS},
    "Office User": {
        Module.DASHBOARD: {"menu", "list", "view"},
        Module.ITEM_MANAGEMENT: {"menu", "list", "view", "add", "edit", "delete"},
        Module.INVENTORY_MANAGEMENT: {"menu", "list", "view", "add", "edit"},
        Module.PROCUREMENT_ITEM_INFO: {"menu", "list", "view"},
        Module.ALLOCATION_SANCTION: {"menu", "list", "view", "add", "edit", "delete"},
        Module.COMPILATION_VERIFICATION: {"menu", "list", "view", "add", "edit"},
        Module.REPORT: {"menu", "list", "view"},
    },
    "Ship/Base User": {
        Module.DASHBOARD: {"menu", "list", "view"},
        Module.ITEM_MANAGEMENT: {"menu", "list", "view", "add", "edit"},
        Module.ALLOCATION_SANCTION: {"menu", "list", "view"},
        Module.REPORT: {"menu", "list", "view"},
    },
}


async def seed_modules(db: AsyncSession) -> dict[str, ModuleModel]:
    existing = {m.code: m for m in (await db.execute(select(ModuleModel))).scalars()}
    for d in MODULE_DEFINITIONS:
        if d["code"] in existing:
            existing[d["code"]].name = d["name"]
            existing[d["code"]].sort_order = d["sort_order"]
        else:
            m = ModuleModel(code=d["code"], name=d["name"], sort_order=d["sort_order"])
            db.add(m)
            existing[d["code"]] = m
    await db.flush()
    return existing


async def seed_roles(db: AsyncSession, modules: dict[str, ModuleModel]) -> dict[str, Role]:
    roles = {r.name: r for r in (await db.execute(select(Role))).scalars()}
    if "Super Admin" not in roles:
        r = Role(name="Super Admin", description="Full access (system role)", is_system=True)
        db.add(r)
        roles["Super Admin"] = r
    for name, template in ROLE_TEMPLATES.items():
        if name not in roles:
            r = Role(name=name, description=f"Default {name} role", is_system=True)
            db.add(r)
            await db.flush()
            for code, actions in template.items():
                db.add(
                    RolePermission(
                        role_id=r.id,
                        module_id=modules[code].id,
                        can_menu="menu" in actions,
                        can_list="list" in actions,
                        can_view="view" in actions,
                        can_add="add" in actions,
                        can_edit="edit" in actions,
                        can_delete="delete" in actions,
                    )
                )
            roles[name] = r
    # super admin role gets everything
    await db.flush()
    sa = roles["Super Admin"]
    have = set(
        (await db.execute(select(RolePermission.module_id).where(RolePermission.role_id == sa.id)))
        .scalars()
        .all()
    )
    for m in modules.values():
        if m.id not in have:
            db.add(
                RolePermission(
                    role_id=sa.id,
                    module_id=m.id,
                    can_menu=True,
                    can_list=True,
                    can_view=True,
                    can_add=True,
                    can_edit=True,
                    can_delete=True,
                )
            )
    await db.flush()
    return roles


async def seed_superadmin(db: AsyncSession, roles: dict[str, Role]) -> None:
    exists = (
        (await db.execute(select(User).where(User.username == settings.SEED_SUPERADMIN_USERNAME)))
        .scalars()
        .first()
    )
    if exists:
        return
    db.add(
        User(
            user_type=UserType.SUPER_ADMIN,
            username=settings.SEED_SUPERADMIN_USERNAME,
            full_name="System Administrator",
            email=settings.SEED_SUPERADMIN_EMAIL,
            phone=settings.SEED_SUPERADMIN_PHONE,
            hashed_password=hash_password(settings.SEED_SUPERADMIN_PASSWORD),
            role_id=roles["Super Admin"].id,
            is_superuser=True,
        )
    )
    log.info("Created super admin '%s'", settings.SEED_SUPERADMIN_USERNAME)


async def seed_masters(db: AsyncSession) -> None:
    if not (await db.execute(select(Country.id))).first():
        for name, code, gmt in COUNTRIES:
            db.add(Country(name=name, code=code, gmt=gmt))
    if not (await db.execute(select(Division.id))).first():
        for name, bn in BD_DIVISIONS:
            db.add(Division(name=name, name_bn=bn))
    if not (await db.execute(select(ItemUnit.id))).first():
        for code, name, short in UNITS:
            db.add(ItemUnit(code=code, name=name, unit_code=short))
    if not (await db.execute(select(ShipBaseCategory.id))).first():
        for code, name in SB_CATEGORIES:
            db.add(ShipBaseCategory(code=code, name=name))
    if not (await db.execute(select(FiscalYear.id))).first():
        today = date.today()
        cur_start_year = today.year if today.month >= 7 else today.year - 1
        for y in range(cur_start_year - 2, cur_start_year + 3):
            db.add(
                FiscalYear(
                    name=f"{y}-{y + 1}",
                    start_date=date(y, 7, 1),
                    end_date=date(y + 1, 6, 30),
                    is_current=(y == cur_start_year),
                )
            )
    await db.flush()


async def run() -> None:
    async with AsyncSessionLocal() as db:
        modules = await seed_modules(db)
        roles = await seed_roles(db, modules)
        await seed_superadmin(db, roles)
        await seed_masters(db)
        await db.commit()
    log.info("Seed complete")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run())
