"""Module codes and permission actions (the Role Permission matrix)."""

from enum import StrEnum


class Module(StrEnum):
    DASHBOARD = "dashboard"
    CONFIGURATION = "configuration"
    ITEM_MANAGEMENT = "item_management"
    SHIP_BASE_MANAGEMENT = "ship_base_management"
    INVENTORY_MANAGEMENT = "inventory_management"
    PROCUREMENT_ITEM_INFO = "procurement_item_info"
    ALLOCATION_SANCTION = "allocation_sanction"
    COMPILATION_VERIFICATION = "compilation_verification"
    REPORT = "report"
    USER_MANAGEMENT = "user_management"


class Action(StrEnum):
    MENU = "menu"
    LIST = "list"
    VIEW = "view"
    ADD = "add"
    EDIT = "edit"
    DELETE = "delete"


# Display metadata used by seed + /modules endpoint. Order == sidebar order.
MODULE_DEFINITIONS: list[dict] = [
    {"code": Module.DASHBOARD, "name": "Dashboard", "sort_order": 1},
    {"code": Module.CONFIGURATION, "name": "Configuration", "sort_order": 2},
    {"code": Module.ITEM_MANAGEMENT, "name": "Item Management", "sort_order": 3},
    {"code": Module.SHIP_BASE_MANAGEMENT, "name": "Ship/Base Management", "sort_order": 4},
    {"code": Module.INVENTORY_MANAGEMENT, "name": "Inventory Management", "sort_order": 5},
    {"code": Module.PROCUREMENT_ITEM_INFO, "name": "Procurement Item Info", "sort_order": 6},
    {"code": Module.ALLOCATION_SANCTION, "name": "Allocation/Sanction", "sort_order": 7},
    {"code": Module.COMPILATION_VERIFICATION, "name": "Compilation/Verification", "sort_order": 8},
    {"code": Module.REPORT, "name": "Report", "sort_order": 9},
    {"code": Module.USER_MANAGEMENT, "name": "User Management", "sort_order": 10},
]

ALL_ACTIONS: tuple[Action, ...] = tuple(Action)
