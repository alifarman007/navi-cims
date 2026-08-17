from enum import StrEnum


class Status(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class UserType(StrEnum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    OFFICE_USER = "office_user"  # DTS, Directorate, CINS
    SHIP_BASE_USER = "ship_base_user"


class ShipBaseType(StrEnum):
    SHIP = "ship"
    BASE = "base"


class AllocationType(StrEnum):
    ALLOCATION = "allocation"
    SANCTION = "sanction"


class AllocationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    SENT_BACK = "sent_back"
    CANCELLED = "cancelled"


class VerificationAction(StrEnum):
    APPROVED = "approved"
    SENT_BACK = "sent_back"


class StockTxnType(StrEnum):
    OPENING = "opening"
    ALLOCATION_OUT = "allocation_out"
    RECEIPT = "receipt"
    ADJUSTMENT = "adjustment"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"


class StockSource(StrEnum):
    PROCUREMENT = "procurement"
    FROM_SHIP = "from_ship"
    EX_BHATIARY = "ex_bhatiary"
    MANUAL = "manual"


class FunctionalStatus(StrEnum):
    """DSIG item functional-status lifecycle (optional in phase 1)."""

    OPERATIONAL = "operational"
    NON_OPERATIONAL = "non_operational"
    DEFECT = "defect"
    SURVEY = "survey"
    OBSOLETE = "obsolete"


def db_enum(enum_cls, name: str, **kwargs):
    """PostgreSQL enum column that stores the enum *values* (lowercase) rather than member names."""
    from sqlalchemy import Enum as SAEnum

    return SAEnum(enum_cls, name=name, values_callable=lambda e: [m.value for m in e], **kwargs)
