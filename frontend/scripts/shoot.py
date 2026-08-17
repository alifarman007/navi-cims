"""Screenshot CIMS pages with headless Edge (Playwright, channel=msedge).

Usage:  python scripts/shoot.py /login /items/brand ...   (from frontend/; dev server + API must be running)
Env:    CIMS_UI=http://localhost:5173  CIMS_USER=admin  CIMS_PASS=Admin@12345
Output: frontend/.screenshots/<route>.png (gitignored). Requires: pip install playwright
"""
import io
import os
import sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".screenshots")
os.makedirs(OUT, exist_ok=True)
BASE = os.environ.get("CIMS_UI", "http://localhost:5173")
paths = sys.argv[1:] or ["/login", "/items/brand"]

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    ctx = b.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))
    # login first
    page.goto(f"{BASE}/login", wait_until="networkidle")
    page.screenshot(path=f"{OUT}/login.png")
    page.fill("input[aria-label='User Id']", os.environ.get("CIMS_USER", "admin"))
    page.fill("input[aria-label='Password']", os.environ.get("CIMS_PASS", "Admin@12345"))
    page.click("button[type=submit]")
    page.wait_for_url(f"{BASE}/", timeout=15000)
    page.wait_for_load_state("networkidle")
    for path in paths:
        if path == "/login":
            continue
        page.goto(f"{BASE}{path}", wait_until="networkidle")
        page.wait_for_timeout(600)
        name = path.strip("/").replace("/", "_") or "dashboard"
        page.screenshot(path=f"{OUT}/{name}.png", full_page=False)
        print("shot", path)
    b.close()
    print("console errors/warnings:")
    for e in errors[:20]:
        print("  ", e[:200])
