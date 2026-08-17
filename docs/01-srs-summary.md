# SRS Summary — Central Inventory Management Software (CIMS)

Source: `files_given_by_client/CIMS Final SRS.pdf` (35 pages, RESTRICTED). This is a condensed, developer-oriented reading; the PDF remains authoritative.

## Purpose
Web application for Bangladesh Navy to manage inventory centrally: master data, items, ships/bases, stores & stock, **allocation/sanction** of items to ships/bases per fiscal year, and **compilation/verification** (approval) of those allocations, with dashboard, reports and role-based security. Procurement is a separate system (**BNPIMS**) — CIMS fetches procurement item info from it via API.

## Stakeholders / actors
| Actor | What they do (from "viewpoints" + use cases) |
|---|---|
| **DTS** (Office User) | Create / search / sort / edit / delete **Allocations** |
| **Directorate** (Office User) | Dashboard, view allocations, **compile/verify/approve** allocations, edit allocation before approving, generate allocation report, re-allocate item to Ship/Base |
| **CINS** (Office User) | Create / search / view / edit / delete **Items** |
| **Ship/Base** user | Create/view/edit/delete Item Category & Item, assign item to category (per Level-1.4 use case: Super Admin, Admin, Ship/Base act on Item Management) |
| **Super Admin / Admin** | Create Ship/Base, assign user to Ship/Base, create users (Super Admin → Admins → other users), roles, menu access by role |

User types (4): **Super Admin** (auto-created at installation), **Admin**, **Office User** (DTS, Directorate, CINS), **Ship/Base User**.

## Modules (usage scenario)
1. **Dashboard** — interactive, statistical diagrams; must show allocation info.
2. **User Management** — user CRUD (name, mobile, email, password, role); login by mobile/email + password; forgot password → email reset link valid ≤ 12 h (use-case diagram alternatively shows OTP); accounts never removed, only disabled; "all users authenticate by Central Profile Management application" (see open questions). Assign user to Ship/Base.
3. **Master Data Configuration** — Office, Appointment, Rank, Country, Division, District, Upazila.
4. **Item Management** — Create Item, Create Item Unit, Brand, Model, Create Item Category; view/edit/delete item & category; item must be assigned a category. Item nouns: Item ID, Item Name, Type, Category, Brand, Model, A/U (unit), Country of Manufacturer, Country of Origin, OEM, Warranty (months), Procurement Year, Local Supplier, Principal, Status.
5. **Ship/Base Management** — Create Ship/Base, Create Ship/Base Category; assign category on create; view/edit/delete. Nouns: ID, Type, Name, Category, Status.
6. **Procurement Item Info** — integrate with BNPIMS via API sharing.
7. **Inventory Management** — **Store** (dynamic, unlimited) and **Opening Stock** (add stock for any store). Nouns: Store ID/Name/Concern/Address, Item, Quantity, Status; Stock: quantity, low stock threshold, status.
8. **Allocation/Sanction** — allocate item to Ship/Base for a certain time → select **fiscal year**. Schema: ID, Type, Fiscal Year, Date, Store_Id, Item_Id, Ship/Base_Id, Allocation Qty (+ Complier/Verifier noun).
9. **Compilation/Verification** — every created allocation shows here; concerned user edits (if necessary) then verifies/approves. Schema: ID, Allocation_Id, Approver.
10. **Reports** — inventory reports with different filters.
11. **Security Management** — everything role based; permissions per role (create/edit/view role).

Expected (implicit) requirements: only authenticated users; role-based access to privileged functionality and to menu/sub-menu.

## Data objects (SRS chapter 5)
User(id, name, role, username, email, mobile, password, status) · Item(id, name, brand, OEM, model, warranty, country of manufacturer, country of origin, category, procurement year, [type, A/U, local supplier, principal, status]) · Ship/Base(id, type, name, category, status) · Allocation/Sanction(id, type, fiscal year, date, store_id, item_id, ship/base_id, allocation qty) · Compilation/Verification(id, allocation_id, approver) · Store(id, type, name, concern, address) · Stock(id, item_id, quantity, low stock threshold, status).

## Known defects in the SRS text (template leftovers)
Chapter 5 title says "Hall Management System"; Level-1.6 mentions "Provost or Accountant" deleting an allocation; Sign-in use case id is "HMS-L-1.1.2"; forgot-password described both as 12-h reset link and as OTP; schema types are loose (e.g. Address float, Low stock threshold date-time). We follow the intent, not the literal types.
