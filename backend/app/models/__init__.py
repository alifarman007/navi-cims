"""Import all models so SQLAlchemy metadata (and Alembic autogenerate) sees them."""

from app.db.base import Base
from app.models.allocation import Allocation, Verification
from app.models.config import Appointment, Country, District, Division, FiscalYear, Office, Rank, Upazila
from app.models.enums import (
    AllocationStatus,
    AllocationType,
    FunctionalStatus,
    ShipBaseType,
    Status,
    StockSource,
    StockTxnType,
    UserType,
    VerificationAction,
)
from app.models.inventory import OpeningStock, Stock, StockTransaction, Store
from app.models.item import Brand, Item, ItemCategory, ItemModel, ItemUnit
from app.models.misc import AuditLog, Notification, ProcurementItem
from app.models.role import Module, Role, RolePermission
from app.models.ship_base import ShipBase, ShipBaseCategory
from app.models.user import PasswordResetToken, RefreshToken, User

__all__ = [
    "Base",
    "Allocation",
    "Verification",
    "Appointment",
    "Country",
    "District",
    "Division",
    "FiscalYear",
    "Office",
    "Rank",
    "Upazila",
    "AllocationStatus",
    "AllocationType",
    "FunctionalStatus",
    "ShipBaseType",
    "Status",
    "StockSource",
    "StockTxnType",
    "UserType",
    "VerificationAction",
    "OpeningStock",
    "Stock",
    "StockTransaction",
    "Store",
    "Brand",
    "Item",
    "ItemCategory",
    "ItemModel",
    "ItemUnit",
    "AuditLog",
    "Notification",
    "ProcurementItem",
    "Module",
    "Role",
    "RolePermission",
    "ShipBase",
    "ShipBaseCategory",
    "PasswordResetToken",
    "RefreshToken",
    "User",
]
