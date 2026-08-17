# Open Questions for the Client (Bangladesh Navy / project owner)

Answers change scope; until answered we implement the stated assumption (see `04-gap-analysis.md`).

## Must-answer before UAT
1. **Central Profile Management** — SRS says all users authenticate via a "Central Profile Management application". Is that an existing Navy SSO/identity service we must integrate (protocol? SAML/OIDC/REST?), or does CIMS own authentication? *Assumption: CIMS owns auth (JWT); an SSO adapter can be added behind `auth` service.*
2. **BNPIMS API contract** — endpoint list, auth, payload for "procurement item info"; push or pull; refresh frequency. *Assumption: pull, JSON, API key; adapter with mock.*
3. **Stock lifecycle** — confirm: approval of an allocation deducts stock from the store; how does new stock enter (only opening stock + BNPIMS receipts?); are transfers between stores/ships needed now? *Assumption: opening stock + manual receipt/adjustment; deduction on approval.*
4. **Allocation approval authority** — who approves: only Directorate (Compilation/Verification module) or also DTS via the check icon on the Allocation list? Should approval hide/lock the record? *Assumption: permission-gated; approved records read-only.*
5. **Item identity** — quantity-only stock or **serial-number level** tracking (DSIG asks per-item defect/repair/allocation history)? *Assumption: quantity per store/item in phase 1; schema leaves room for serials.*
6. **Password reset** — emailed 12-h link (SRS text) or OTP (use-case)? Which SMTP/relay is available on the BN Server? *Assumption: 12-h link.*
7. **Reports** — exact list and columns expected under "Report" (Figma placeholders "1", "2"). *Assumption: Stock Summary, Allocation Report, Low Stock; Excel export.*
8. **Dashboard** — which KPIs/charts (Figma has none; DSIG suggests status/area pies). *Assumption: see gap analysis.*

## Nice-to-confirm
9. Fiscal year format ("2025-26" vs "2025-2026") and whether allocations may span years.
10. Store types and Office types option lists; Ship/Base categories list; User Type ↔ Role coupling (is Role free-form per user type?).
11. Should master deletes be hard deletes or soft (status inactive) everywhere? *Assumption: hard delete blocked when referenced (409); users soft only.*
12. Bangla names (Rank/Division/District/Upazila) — display language toggle needed?
13. Deployment: intranet only? HTTPS certificate? Backup policy (DSIG asks for in-app DB backup) — server-side `pg_dump` trigger from admin UI acceptable?
14. Are DSIG's TO&E authorized allocation, shortage analysis, item functional-status lifecycle and Word/PDF export required in the CIMS contract, or only for D SIG's own system?
15. Footer credit: "TotalOfftec." vs "SIMEC System Ltd." (both appear in Figma).
16. Header "Back" button semantics (browser back vs module list) and the hidden "Search"/"Chatbox" layers — implement or not? *Assumption: browser history back; hidden layers not built.*
