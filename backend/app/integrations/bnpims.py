"""BNPIMS (Bangladesh Navy Procurement Information Management System) adapter.

CIMS only *reads* procurement item info from BNPIMS. The real contract is unknown, so this adapter
normalises whatever comes back into a small, stable dict shape and keeps the raw payload:

    {external_id, grn_no, transaction_date, imc, item_name, deno, receive_quantity, part_no, remarks, raw}

`get_client()` returns the mock client when `BNPIMS_BASE_URL` is empty (dev / demo), else the HTTP client.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation
from typing import Any, Protocol

import httpx

from app.core.config import settings

log = logging.getLogger(__name__)

# accepted external key aliases -> our field
_KEY_ALIASES: dict[str, tuple[str, ...]] = {
    "external_id": ("external_id", "id", "grn_item_id", "uuid", "item_id"),
    "grn_no": ("grn_no", "grnNo", "grn", "grn_number"),
    "transaction_date": ("transaction_date", "transactionDate", "trans_date", "date", "grn_date"),
    "imc": ("imc", "imc_code", "imcCode", "imc_no"),
    "item_name": ("item_name", "itemName", "name", "description", "item_description"),
    "deno": ("deno", "denomination", "unit", "uom"),
    "receive_quantity": ("receive_quantity", "receiveQuantity", "received_qty", "qty", "quantity"),
    "part_no": ("part_no", "partNo", "part_number"),
    "remarks": ("remarks", "remark", "note", "notes"),
}


def _first(row: dict[str, Any], keys: tuple[str, ...]) -> Any:
    for k in keys:
        if k in row and row[k] not in (None, ""):
            return row[k]
    return None


def _to_datetime(value: Any) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    s = str(value).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y %I:%M%p", "%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(s, fmt)
            return dt.replace(tzinfo=UTC)
        except ValueError:
            continue
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=UTC)
    except ValueError:
        log.warning("BNPIMS: unparseable date %r", value)
        return None


def _to_decimal(value: Any) -> Decimal | None:
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def _to_str(value: Any, max_len: int) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    return s[:max_len] if s else None


def normalize_row(row: dict[str, Any]) -> dict[str, Any] | None:
    """Map an external row of unknown shape into our stable dict. Returns None when no id can be derived."""
    ext = _first(row, _KEY_ALIASES["external_id"])
    grn = _first(row, _KEY_ALIASES["grn_no"])
    part = _first(row, _KEY_ALIASES["part_no"])
    if ext is None:
        # fall back to a composite key so re-syncs remain idempotent
        if grn is None:
            return None
        ext = f"{grn}:{part or ''}"
    return {
        "external_id": _to_str(ext, 100),
        "grn_no": _to_str(grn, 100),
        "transaction_date": _to_datetime(_first(row, _KEY_ALIASES["transaction_date"])),
        "imc": _to_str(_first(row, _KEY_ALIASES["imc"]), 100),
        "item_name": _to_str(_first(row, _KEY_ALIASES["item_name"]), 300),
        "deno": _to_str(_first(row, _KEY_ALIASES["deno"]), 50),
        "receive_quantity": _to_decimal(_first(row, _KEY_ALIASES["receive_quantity"])),
        "part_no": _to_str(part, 100),
        "remarks": _to_str(_first(row, _KEY_ALIASES["remarks"]), 500),
        "raw": row,
    }


class BnpimsClientProtocol(Protocol):
    async def fetch_items(self, since: datetime | None = None) -> list[dict[str, Any]]: ...


class BnpimsClient:
    """HTTP client: GET {base}/api/procurement/items?since=<iso> with X-API-Key."""

    def __init__(self, base_url: str, api_key: str = "", timeout: float = 20.0):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    async def fetch_items(self, since: datetime | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if since is not None:
            params["since"] = since.astimezone(UTC).isoformat()
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(f"{self.base_url}/api/procurement/items", params=params, headers=headers)
            resp.raise_for_status()
            payload = resp.json()
        out: list[dict[str, Any]] = []
        for r in _extract_rows(payload):
            if isinstance(r, dict):
                n = normalize_row(r)
                if n:
                    out.append(n)
        return out


def _extract_rows(payload: Any) -> list[Any]:
    """Tolerate `[...]`, `{items:[...]}`, `{data:[...]}`, `{results:[...]}`, `{data:{items:[...]}}`."""
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("items", "data", "results", "rows", "records"):
            v = payload.get(key)
            if isinstance(v, list):
                return v
            if isinstance(v, dict):
                inner = _extract_rows(v)
                if inner:
                    return inner
    return []


# ---- mock ------------------------------------------------------------------------------------------
_MOCK_ROWS: list[tuple[str, str, str, str, str, str, str]] = [
    # grn_no, imc, item_name, deno, qty, part_no, remarks
    ("0725.82647", "A.C. 0013.00374.0000", "Clamp, Air Cleaner", "No", "2", "11000615", "Meter"),
    ("0725.82648", "55.114", "Rope, Polyester, Cir: 1inch Dia: 8mm", "Meter", "500", "", "Deck stores"),
    ("0725.82649", "55.120", "Rope, Nylon, Cir: 2inch Dia: 16mm", "Meter", "300", "", "Mooring"),
    (
        "0725.82650",
        "A.C. 0021.00110.0000",
        "Filter, Fuel, Primary",
        "No",
        "12",
        "FF-5612",
        "Engine room spares",
    ),
    ("0725.82651", "A.C. 0021.00111.0000", "Filter, Lube Oil", "No", "24", "LF-3349", "Engine room spares"),
    (
        "0725.82652",
        "A.C. 0044.00902.0000",
        "Cable, Electric, 3-core 2.5 sqmm",
        "Meter",
        "1000",
        "CB-3C25",
        "Electrical",
    ),
    (
        "0725.82653",
        "A.C. 0044.00915.0000",
        "Cable, Coaxial, RG-213",
        "Meter",
        "200",
        "RG213",
        "Communication",
    ),
    ("0725.82654", "80.101", "Paint, Marine, Grey (Hull)", "Litre", "400", "MP-GRY-20", "Dockyard"),
    ("0725.82655", "80.102", "Paint, Anti-fouling, Red", "Litre", "250", "AF-RED-20", "Dockyard"),
    ("0725.82656", "80.110", "Thinner, Marine Paint", "Litre", "100", "TH-01", "Dockyard"),
    ("0825.82701", "A.C. 0031.00201.0000", "Valve, Gate, 2inch, Bronze", "No", "6", "GV-2B", "Hull systems"),
    (
        "0825.82702",
        "A.C. 0031.00205.0000",
        "Valve, Globe, 1inch, Bronze",
        "No",
        "8",
        "GLV-1B",
        "Hull systems",
    ),
    ("0825.82703", "A.C. 0031.00310.0000", "Gasket, Rubber, 3mm sheet", "Kg", "20", "GSK-3", "Hull systems"),
    ("0825.82704", "A.C. 0052.00420.0000", "Battery, Lead Acid, 12V 150Ah", "No", "10", "BAT-12150", "Power"),
    ("0825.82705", "A.C. 0052.00431.0000", "Lamp, Navigation, Masthead", "No", "4", "NL-MH", "Navigation"),
    ("0825.82706", "A.C. 0060.00512.0000", "Life Jacket, SOLAS Approved", "No", "60", "LJ-SOLAS", "Safety"),
    ("0825.82707", "A.C. 0060.00518.0000", "Fire Extinguisher, CO2, 5kg", "No", "15", "FE-CO2-5", "Safety"),
    ("0825.82708", "A.C. 0060.00520.0000", "Fire Hose, 2.5inch, 15m", "No", "12", "FH-25-15", "Safety"),
    ("0825.82709", "A.C. 0070.00601.0000", "Bearing, Ball, 6205 2RS", "No", "30", "6205-2RS", "Workshop"),
    ("0825.82710", "A.C. 0070.00610.0000", "Belt, V, B-52", "No", "20", "VB-B52", "Workshop"),
    ("0825.82711", "A.C. 0070.00622.0000", "Grease, Marine, Lithium", "Kg", "50", "GR-LI", "Workshop"),
    ("0825.82712", "55.130", "Wire Rope, Galvanised, 12mm", "Meter", "600", "WR-12G", "Deck stores"),
    ("0825.82713", "55.140", "Shackle, Bow, 1 ton", "No", "40", "SH-B1", "Deck stores"),
    ("0825.82714", "A.C. 0044.00930.0000", "Connector, RF, N-Type Male", "No", "50", "N-M", "Communication"),
    ("0825.82715", "A.C. 0044.00935.0000", "Antenna, VHF, Marine", "No", "3", "ANT-VHF", "Communication"),
]


class MockBnpimsClient:
    """Deterministic realistic naval-store rows so the Procurement Item Info screen works without BNPIMS."""

    async def fetch_items(self, since: datetime | None = None) -> list[dict[str, Any]]:
        base = datetime(2025, 7, 29, 14, 20, tzinfo=UTC)
        out: list[dict[str, Any]] = []
        for i, (grn, imc, name, deno, qty, part, remarks) in enumerate(_MOCK_ROWS):
            ts = base + timedelta(days=i, hours=(i * 3) % 8, minutes=(i * 17) % 60)
            raw = {
                "id": f"BNP-{grn}",
                "grn_no": grn,
                "transaction_date": ts.isoformat(),
                "imc": imc,
                "item_name": name,
                "deno": deno,
                "receive_quantity": qty,
                "part_no": part,
                "remarks": remarks,
                "source": "mock",
            }
            if since is not None and ts <= since:
                continue
            n = normalize_row(raw)
            if n:
                out.append(n)
        return out


def get_client() -> BnpimsClientProtocol:
    if settings.BNPIMS_BASE_URL:
        return BnpimsClient(
            settings.BNPIMS_BASE_URL, settings.BNPIMS_API_KEY, float(settings.BNPIMS_TIMEOUT_SECONDS)
        )
    return MockBnpimsClient()
