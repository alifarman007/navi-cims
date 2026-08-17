# Gap Analysis — SRS vs Figma vs DSIG, and the decisions we made

Legend: ✅ consistent · ⚠️ partial / inconsistent · ❌ missing. "Decision" = what the code does today. Anything the client must confirm is also listed in `08-open-questions.md`.

## A. Module-by-module

| SRS module | Figma | Verdict | Decision |
|---|---|---|---|
| Login (email/mobile + password) | "Login new": User Id, Password, Remember me, Forgot your password?, Login | ✅ | `POST /auth/login` accepts username **or** email **or** phone in `identifier`. Remember me → refresh token persisted in localStorage (else sessionStorage). |
| Forgot password (12 h link / OTP) | ❌ no screen | ⚠️ | Implement **12 h emailed reset link** (SRS text). Pages `/forgot-password` and `/reset-password/:token` reuse the login layout. |
| Dashboard | ❌ no screen (menu item only) | ⚠️ | Build a dashboard page in the same design language: stat cards (items, ships/bases, stores, pending/approved allocations, low-stock items) + charts (allocations by fiscal year, allocations by ship/base, items by category, DSIG-style status pie). |
| User Management (create/view/edit, assign to Ship/Base) | User screen: User Type, User Name, Email, Phone, Role, Password; list w/ Status + edit/delete | ⚠️ | Add **Ship/Base** select (shown when User Type = Ship/Base User) and **Office** select (Office User) to the form — needed to enforce SRS "assign user to Ship/Base". Delete icon = **disable** (SRS: never remove accounts) → `DELETE /users/{id}` sets status inactive; super admin cannot be disabled. |
| Security Management (roles) | Role Permission list + Create/Edit with matrix Menu/Edit/List/Add/Delete/View over modules | ✅ | Matrix rows = all modules incl. Dashboard, Configuration, User Management (Figma variant B omitted some rows — treated as incomplete mock). Header checkbox = select all; row checkbox = select row. |
| Master Data (Office, Appointment, Rank, Country, Division, District, Upazila) | 7 screens present | ✅ | Fields as drawn. Rank table has "Priority" with no form field → **add Priority (number) field** to the form. Appointment "Designation" column = Appointment Name. Country: name, code, GMT. |
| Item Management (Item, Unit, Brand, Model, Category) | 5 screens present | ✅ | Item form as drawn (Item ID, Name, Brand, Model, OEM, Warranty, Country of Manufacture, Country of Origin, Category, Procurement Year, Status). SRS/DSIG extras (Unit/A-U, Type, Local Supplier, Principal, year of manufacture, unit price) exist in DB as nullable; **Unit** is added to the form (Item Unit master exists, so items must reference it). Warranty = integer months. Procurement Year = year (int) — Figma date picker becomes a year picker. |
| Ship/Base Management | Create Ship/Base (ID, Type, Name, Category), Category (ID, Name) | ✅ | Type options = **Ship / Base** (SRS "Type"). Category optional as drawn (no asterisk) — kept optional. |
| Procurement Item Info (BNPIMS API) | ❌ no screen (Item Details/GRN popups look procurement-ish) | ⚠️ | Read-only list page + detail popup (reusing "Item Details" popup with GRN No, Transaction Date, IMC, Item Name, Deno, Receive Quantity, Part No, Remarks) fed by `procurement_items` cache; `POST /procurement-items/sync` pulls from BNPIMS adapter (mock until contract known). Top-level sidebar module after Inventory Management. |
| Inventory — Store | Store: ID, Name, Type, Concern, Address | ✅ | Type options: Central / Depot / Ship-Base / Other (assumption). |
| Inventory — Opening Stock | Two variants: (Item ID, Store ID, Opening Quantity, Stock Entry Date) and (ID, Item ID, Quantity, Low stock threshold, Status) | ⚠️ | Merge: form = Store (select), Item (select), Opening Quantity, Stock Entry Date, **Low stock threshold** (optional). Saving creates an `opening_stocks` row, upserts `stocks(store,item)` and writes an `opening` ledger transaction. Table = merged columns. |
| Allocation/Sanction | ID, Type, Fiscal Year, Date, Store Id, Item Id, Ship/Base Id, Allocation Qty; list w/ view + approve icon; "Are you sure? You want to Approve this!" | ✅ | Type = **Allocation / Sanction** select. Fiscal Year = select of `fiscal_years` (Figma date icon; FY is a range). Store/Item/Ship-Base = selects (Figma text boxes with "Id" labels). Duplicate "Store Id" column in Figma list = mock error → columns: ID, Type, Fiscal Year, Date, Store, Item, Ship/Base, Qty, **Status**, Action. Approve icon calls `POST /allocations/{id}/approve` (permission Compilation/Verification:edit) and hides when not pending. |
| Compilation/Verification | list (ID, Allocation Id, Approver) + create form (ID, Allocation Id, Approver) + row actions view/edit/back/delete; "Demand Back" comment modal | ✅ | `verifications` table; create = pick a pending allocation → approve (approver = current user unless overridden). Back = `POST /allocations/{id}/send-back {comment}` → allocation `sent_back`, DTS can edit & resubmit. Edit opens the allocation form. |
| Reports | menu placeholders "1", "2" | ❌ | Report page with 3 reports: Stock Summary (by store/item), Allocation Report (by ship/base, fiscal year, status), Low Stock; filters + table + Excel export. |
| Notifications | bell with badge only | ⚠️ | Notifications table + `GET /notifications`; generated on allocation submit/approve/send-back and low stock; bell dropdown lists latest. |
| Audit log | (DSIG "Monitoring User Action") | ❌ in SRS/Figma | `audit_logs` table written by services; `GET /audit-logs` (super admin/admin). No dedicated screen in phase 1 (list under Report later). |

## B. Figma-only elements and how they are treated
- **Item Details popups** (Item/Unit/Brand/Category/Model, GRN variant) → generic `DetailModal` used by every "View" eye action; GRN variant used for Procurement Item Info.
- **Obsolete Request modal** (Item Image, Item Info, Item Specification, Documents, Entry Details, Print/Download) → refers to an item-obsolescence workflow not in the SRS. Implemented as a component (`ObsoleteRequestModal`) shown in the UI-kit page only; wiring to a real workflow is backlog (DSIG "Obsolete" status).
- **Demand Forwarded / Are you sure? "cancel this demand"** → belong to a demand workflow (ships demanding items) not in the SRS. Generic `CommentDialog` and `ConfirmDialog` components are built and reused (Demand Back, Approve, Delete confirmations).
- **Row actions Transfer / Forward** → components exist; Forward is not wired (no forward step in the SRS workflow); Transfer reserved for future re-allocation.
- **Legacy light-theme menu kit, old header with search + hamburger, "SIMEC System Ltd." footer variant** → ignored; current dark kit + "TotalOfftec." footer used.
- **Hidden layers** (header Search box, floating Chatbox) → not built.
- **Typos in Figma** ("Showing 1 to 10 **or** 11 results", "District  Name" double space, "Tender Ocation", "Parametar") → corrected in UI text.

## C. Workflow (final)
```
DTS/Office user            Directorate                          Store stock
Allocation form ──save──▶ allocations(status=pending) ─────────────────────────┐
                            │  Compilation/Verification list                    │
                            ├─ view / edit (allocation form)                    │
                            ├─ approve (check icon or create Verification) ─▶ status=approved, verifications row,
                            │                                                    stock_transactions(allocation_out, -qty), notification to creator
                            └─ Demand Back {comment} ─▶ status=sent_back, notification; DTS edits → resubmit (status=pending)
DTS may cancel own pending allocation (status=cancelled).
```
Insufficient stock at approval → 409 with message; approver may still edit quantity.

## D. Terminology mapping (UI label → API field)
Office Code/Item ID/Unit ID/Brand ID/Model ID/Category ID/Ship-Base ID/Store ID → `code` · Rank Name(Bangla)/Division Name (Bangla)/... → `name_bn` · A/U → `unit_id` · Concern → `concern` · Allocation Qty → `quantity` · Approver → `approver_id` · User Type → `user_type` · Phone Number → `phone`.

## E. Implementation decisions recorded during the build (2026-08-17)
- **Item form**: only Item ID, Item Name, Category are mandatory (Figma asterisks on Brand/Model/OEM/Warranty/Countries/Year treated as design noise; DB nullable). Countries are selects from the Country master; Procurement Year is a year select; Warranty is integer months; a Unit select was added.
- **Store**: `store_type` options Central / Depot / Ship-Base / Other (validated server-side); no Status field on the form (Figma has none) — status stays active, changeable via `PATCH /stores/{id}/status`.
- **Opening Stock**: quantity/store/item are immutable after creation (only entry date, threshold, remarks editable; threshold propagates to the stock row); delete = reversing `adjustment` movement, refused (409) if the balance would go negative.
- **Stock Balance page** (no Figma): read-only list with Low/OK badge + ledger modal (last 20 transactions).
- **Ship/Base**: no Status on form/list (as drawn); Type filter is a select; Category optional.
- **Users**: a required *Full Name* field was added next to *User Name* (needed for the header chip); Delete = disable (SRS); Super Admin cannot be disabled; Office/Ship-Base selects appear based on User Type; email validation is permissive (intranet domains such as `*.local` allowed).
- **Roles**: matrix rows = all 10 modules; system roles cannot be renamed/deleted; role deletion blocked while users reference it.
- **Allocation**: create → `pending`; edit/delete only while pending/sent_back; approve/send-back require `compilation_verification.edit`; approving deducts stock through the ledger and writes a `VRF-xxxxx` verification; ship/base users only see their own ship's allocations.
- **Verification page**: form = pick a *pending* allocation (+ approver, comment) → approve; list shows verification history with view / back (Demand Back comment dialog on the allocation) actions.
- **Reports**: Stock Summary, Allocation Report, Low Stock — filters card + table + `Export Excel` (xlsx via openpyxl).
- **Dashboard**: 8 stat tiles, allocations by fiscal year (allocation vs sanction), by status, items by category, stock by store, allocations by ship/base, recent allocations, low stock (palette validated for colour-vision safety).
- **Procurement**: mock BNPIMS client returns 25 deterministic rows until `BNPIMS_BASE_URL` is set; `Sync from BNPIMS` button (edit permission).
- **Notifications** on approve/send-back/low stock; bell popover in the header; **audit log** endpoint restricted to super admin/admin.
