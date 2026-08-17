# Figma UI Specification — CIMS (extracted 2026-08-16)

Source: https://www.figma.com/design/w8FeXMDCkrCuWua6igdo8M/ (page "Main Page"). Extracted per node with `get_design_context` + screenshots. Screenshots for every screen are in `docs/figma/screens/`.
This document is the frontend's visual source of truth. Where the design is silent (dropdown options, ID formats), the API/DB decides — see `04-gap-analysis.md`.

## Design tokens (consolidated)

| Token | Value | Use |
|---|---|---|
| primary | `#1C3586` | Save/Login buttons, card titles, active breadcrumb, edit icon |
| primary-hover | `#1B45AD` | Save hover |
| primary-alt | `#2F4086` | pagination active page, Go, Create Role Permission button, logout role text |
| primary-600 / 400 / 200 / 500 | `#4558AE` / `#7C91F2` / `#BAC6FF` / `#5F73D0` | modal Confirm bg / primary button border / modal header border / checked radio fill |
| sidebar-bg | `#002652` + `rgba(0,0,0,.3)` overlay ≈ `#001B39` | sidebar |
| sidebar-text / active | `#DEDEDE` / `#F9FCFF` (parent) / `#FFFFFF` (submenu) | menu labels |
| sidebar-parent-open-bg | `rgba(255,255,255,.08)` | expanded parent row |
| sidebar-sub-active-bg | `rgba(0,48,102,.75)` | active submenu row |
| accent-orange | `#ED841A` | active submenu left pill (inactive pill `rgba(255,255,255,.6)`) |
| body-bg | `#FFFFFF` + `rgba(63,60,216,.05)` ≈ `#F3F3FD` | page background |
| header-strip | `#E3E8FF` | card header bar, table header row, permission-matrix header, modal action bar |
| header-strip-border | `#D1D6EB` | table header bottom border |
| zebra | `#F5F7FF` | odd rows |
| row-border | `#E5E5E5` | |
| fieldset-bg | `#F9F8F8` | inner form panel |
| card-border | `rgba(0,0,0,.1)` / `rgba(0,0,0,.08)` | cards / tables |
| input-border | `#D2D2D2` (forms) / `#DFDFDF` (filter row) / `#D1D5DB` (modals) / `#E5E7EB` (login) | |
| label / placeholder | `#4C4C4C` / `#3A3A3A @50%` | form fields |
| text-heading / body / cell | `#3C3C3C` / `#333333` / `#4B5563` | |
| breadcrumb-parent | `#585858` | |
| status-active / inactive | `#0E9F6E` / `#ACACAC` | table status text |
| action-view / edit / delete / approve / back / forward | `#89C74A` / `#1C3586` / `#CD3F32` / `#019204` / `#7C7D7D` / `#1C3586` | row action icons (40×30 hit area; hover bg `#D0F5AA` / `#E1E6F5` / `#FFE9E8` / `#D1F4D2` / `#D6D8D8` / `#E7EBF8`) |
| clear-all | bg `#FFEFED`, border `rgba(248,198,205,.6)`, text `#FF0000` (hover bg `#FFCBCB`) | Clear All button |
| badge-red | `#EF3F2E` | notification badge, Download button |
| toast title / body / cancel | `#575555` / `#474141` / `#A49C9C` | confirm dialog |
| footer text | `#7E7E7E`, CIMS `#4D4C4C`, TotalOfftec `#003066` | |
| login-card-bg / hero-accent | `#F4F7FF` / `#AFB58B` | login |

Fonts: **Roboto** (UI: sidebar 17/15, card title 20 Medium, list title 18 Medium, table header 16 Medium, cell 14 Medium, labels 14.5, buttons 16 Medium, pagination 14/16, footer 15), **Poppins** SemiBold 20 / Medium 16 (sidebar brand), **Barlow** 42 / Bold 60 (login hero), **Inter** SemiBold 14 / Regular 16 (modal titles, labels, textarea).
Sizes: sidebar 325, header 80, footer 40, content inset 24, content width 1546 @1920; card radius 8; card header h53; inputs h40 r5; buttons h44 r8 px20; table row h48, filter row h56; pagination atoms 36×36 r8; modal r8 shadow `0 20px 24px rgba(0,0,0,.08)`; detail popup width 792.

## Navigation (sidebar) — final
Dashboard · Configuration › Office, Appointment, Rank, Country, Division, District, Upazila · Item Management › Create Item, Create Item Unit, Brand, Model, Create Item Category · Ship/Base Management › Create Ship/Base, Create Ship/Base Category · Inventory Management › Store, Opening Stock · Allocation/Sanction › Allocation/Sanction · Compilation/Verification › Compilation/Verification · Report › (placeholders '1','2' in Figma) · User Management › User, Role Permission.
The legacy light-theme menu kit (Collections, Loan Management, ...) at the top of the Menu section is a leftover from another product — ignore.

## Screens


### Section: Menu & Sub-menu (navigation tree, status badges, action icons) — Figma section 4:521 (component/variant librar

#### [component] `4:521` Menu & Sub-menu SECTION (whole)
- Notes: Section canvas 3957x4775 on dark grey background. Contents (by metadata): 4:802 Main Menu (light kit, 4 variants), 4:823 Menu (light kit full list), 4:838 Sub-Menu (light, 3 variants), 4:2654 Sub-sub-Menu (light, 3 variants), 4:851 'User Management' (light, Default/Variant2 expanded with User/Role/Permission), 4:2673 'SUB-SUB' (light expanded '1' -> 111/12/13), 4:857 'User Management' sub list (User/Role/Permission), 4:2749 'SUB--SUB' (111/12/13), 4:2797 'SUB2' (1 -> 111/12/13), 12:926 'sub 2' (111/12/13), 6:3078 rows-per-page dropdown (10/20/30/40, 5 variants), 31:5790 dark main-menu item states (Default/active/Variant3/Variant4), 31:5815 'Main menu' (the real NAVI CIMS sidebar list), 31:5844 dark sub-menu item states (Default/Hover/Active), 31:5866 'User Management main menu' (actually a Configuration sub-list: Rack…Appointment), 42:4917 Report sub-list (1,2), 31:5868 Configuration menu (Default/expanded), 31:10580 Configuration menu (actually User Management, Default/expanded), 37:3452 Item Management, 38:3548 Ship/Base Management, 39:3811 Inventory Management, 39:4159 ALLOCATION/SANCTION, 42:5172 COMPILATION/VERIFICATION, 42:4810 Report, 41:3926 edit icon btn, 41:3931 delete ic

#### [component] `4:802` Main Menu (light kit, 4 states)
- Notes: OLDER LIGHT-THEME main-menu row component, 300px wide, padding 12px 16px, flex space-between: [24px dashboard icon + label] … [28px chevron]. Font Inter Regular 18px line-height 1.5. Variants: Default = white bg, border-bottom 1px rgba(73,109,172,0.15), text #505050, chevron-down (light grey). Hover = bg #E4EEFF, 1px border rgba(73,109,172,0.15), radius 8px, text #505050, chevron-down dark. Active = bg #204EA1 (Foundation/Blue/Normal), radius 8px, white text + white icon + white chevron-down. 'Active 2' (expanded) = bg #D3E3FF, radius 8px, text #28292B, chevron rotated 180 (points up).

#### [nav] `4:823` Menu symbol (light kit full sidebar list)
- Notes: OLDER LIGHT-THEME 300x835 stacked list of 15 'Main Menu' instances (52px each, 4px gap): Dashboard (no chevron), User Management, 11, Configuration, Item Management, Collections, Loan Management, Repayments, Withdrawals, Accounts, Supply Chain, HR Management, Reports, Customer Management, Notifications — each with an outline icon at left and chevron-down at right, white bg, text #505050 Inter 18px, thin bottom border. This is a template inherited from a co-operative/loan product (hidden nested sub-items in the layer tree reference 'Savings List', 'Loan Definition', 'GL Journal', 'Gender', 'Occupation Type', 'User Type', 'User Log', 'Financial Year', etc. — NOT NAVI-CIMS content). Only the visible labels are listed here; treat this node as reference/legacy, not the app menu.

#### [component] `4:838` Sub-Menu (light kit, 3 states)
- Notes: OLDER LIGHT-THEME sub-menu row: 280px wide, padding 10px, gap 4px, [28px right-chevron ('Right Arrow')] + label (Inter Regular 15px, line-height 1.27, wraps to 2 lines, width 221px). Default: white bg, border-bottom 1px rgba(95,114,208,0.10), text #636363. Hover: bg #E4EEFF radius 8px, text #505050. Active: bg #204EA1 radius 8px, white text + white chevron.

#### [component] `4:2654` Sub-sub-Menu (light kit, 3 states)
- Notes: Identical to Sub-Menu but 260px wide and 14px font (third nesting level). Default white/border-bottom rgba(95,114,208,0.10)/text #636363; Hover #E4EEFF r8 text #505050; Active #204EA1 r8 white text. Elsewhere in the section, light-kit expanded examples: '11' expanded -> sub items '1','2','23'; '1' expanded -> '111','12','13'; 'User Management' expanded (bg #D3E3FF, chevron up) -> 'User','Role','Permission' (sub rows 286px, gap 3px).

#### [nav] `31:5815` Main menu symbol (CURRENT dark sidebar list)
- Sidebar: (none in symbol — all collapsed) — submenu ['Dashboard', 'Configuration', 'Item Management', 'Ship/Base Management', 'Inventory Management', 'Allocation/Sanction', 'Compilation/Verification', 'Report', 'User Management']
- Notes: THE actual NAVI-CIMS sidebar menu list. Outer 325px wide centered container; inner column 295px, vertical gap 4px. Each item 295x40, padding 0 15px, radius 6px, transparent bg (sits on the dark sidebar), left 18px icon at 75% opacity + label (Roboto Regular 17px, letter-spacing 0.17px, color #DEDEDE, CSS capitalize) + 24px chevron at right:3px. Collapsed items show a RIGHT-pointing chevron ('chevron_down 1', fill #DEDEDE); Dashboard has NO chevron (leaf link). Order top→bottom: Dashboard, Configuration, Item Management, Ship/Base Management, Inventory Management, Allocation/Sanction, Compilation/Verification, Report, User Management. (Note: last item is an instance of the 'Configuration menu' component 31:10581 whose text is literally 'User M'+'ANAGEMENT' with capitalize -> renders 'User Management'; ALLOCATION/SANCTION and COMPILATION/VERIFICATION are typed upper-case in Figma but rendered via CSS capitalize as 'Allocation/Sanction', 'Compilation/Verification'.) Icons: Dashboard = 4-tile grid; Configuration = gear/head; Item Management = box/gift; Ship/Base = ship; Inventory = clipboard/list; Allocation/Sanction = gavel; Compilation/Verification = document-check; Report = folder; 

#### [component] `31:5790` Dark main-menu item states (Frame 1707478615) — supporting component
- Notes: State variants of the dark sidebar TOP-LEVEL item (295x40, r6, px15): Default = transparent bg, icon opacity 75%, text #DEDEDE, chevron pointing RIGHT (fill #DEDEDE) at right:3px. 'active' (open/expanded) = bg rgba(255,255,255,0.08), py 3px, icon full opacity (white), text #F9FCFF, chevron rotated 90° -> pointing DOWN (fill #D2C3C3) at right:4px. Variant3 / Variant4 = same bg rgba(255,255,255,0.08) with chevron down but text #9CB1C9 (muted blue-grey; likely disabled/no-permission or 'has active child' states — semantics not labeled).

#### [component] `31:5844` Dark sub-menu item states (Frame 1707478616) — supporting component
- Notes: State variants of the dark sidebar SUB item (280x40, r6, padding-left 20px, padding-right 15px). A 3px x 20px vertical pill (radius 10) sits at the far left, vertically centered. Label Roboto Regular 15px, letter-spacing 0.15px, capitalize. Default: bg transparent (rgba(47,64,134,0)), pill rgba(255,255,255,0.6), text #DEDEDE (line-height 21px). Hover: bg rgba(255,255,255,0.10), pill rgba(237,132,26,0.6) (orange 60%), text #DEDEDE. Active: bg rgba(0,48,102,0.75) (deep navy), pill #ED841A (orange), text #FFFFFF.

#### [nav] `31:5866` User Management main menu (dark sub-list: Rack…Appointment)
- Notes: Despite the layer name, this is a 280px-wide column (gap 4px) of 9 dark sub-menu rows in Default state (white 60% pill, #DEDEDE 15px Roboto), inner frame named 'Configuration main menu'. Looks like an alternate/extended Configuration sub-list. Labels exactly as typed (incl. typos): Rack, Admin Authority, Department, Directorate, Port, Terms & Conditions, Tender Ocation, Parametar, Appointment.

#### [nav] `31:5868` Configuration menu (Default + expanded)
- Sidebar: Configuration — submenu ['Office', 'Appointment', 'Rank', 'Country', 'Division', 'District', 'Upazila']
- Notes: Two variants of the Configuration accordion. Default (31:5869): collapsed row 'Configuration' with gear icon + right chevron. Variant2 (31:5871, expanded): header row bg rgba(255,255,255,0.08), text #F9FCFF, icon full-opacity, chevron DOWN; below it (gap 10px, right-aligned column 280px wide, gap 4px) the sub rows in Default state: Office, Appointment, Rank, Country, Division, District, Upazila. Each sub row 40px, pl 20px, white-60% left pill, #DEDEDE 15px.

#### [nav] `31:10580` Configuration menu 2 (actually User Management accordion)
- Sidebar: User Management — submenu ['User', 'Role Permission']
- Notes: Layer is named 'Configuration menu' but the label reads 'User Management' (people-group icon). Default = collapsed with right chevron; Variant2 = expanded header (bg rgba(255,255,255,0.08), chevron down) + sub rows: User, Role Permission. Sub rows are <a> links (cursor pointer).

#### [nav] `37:3452` Item Management menu
- Sidebar: Item Management — submenu ['Create Item', 'Create Item Unit', 'Brand', 'Model', 'Create Item Category']
- Notes: Default collapsed + Variant2 expanded. Icon: box/parcel. Sub rows in order: Create Item, Create Item Unit, Brand, Model, Create Item Category.

#### [nav] `38:3548` Ship/Base Management menu
- Sidebar: Ship/Base Management — submenu ['Create Ship/Base', 'Create Ship/Base Category']
- Notes: Default collapsed + Variant2 expanded. Icon: ship silhouette. Sub rows: Create Ship/Base, Create Ship/Base Category.

#### [nav] `39:3811` Inventory Management menu
- Sidebar: Inventory Management — submenu ['Store', 'Opening Stock']
- Notes: Default collapsed + Variant2 expanded. Icon: clipboard/inventory list. Sub rows: Store, Opening Stock.

#### [nav] `39:4159` ALLOCATION/SANCTION menu
- Sidebar: Allocation/Sanction — submenu ['Allocation/Sanction']
- Notes: Default collapsed + Variant2 expanded (Variant2 height 90 = header + one sub row). Icon: gavel. Header text typed 'ALLOCATION/SANCTION' rendered via capitalize as 'Allocation/Sanction'. Single sub row: Allocation/Sanction.

#### [nav] `42:5172` COMPILATION/VERIFICATION menu
- Sidebar: Compilation/Verification — submenu ['Compilation/Verification']
- Notes: Default collapsed + Variant2 expanded (one sub row). Icon: document with magnifier/check. Header typed 'COMPILATION/VERIFICATION' rendered 'Compilation/Verification'. Single sub row: Compilation/Verification.

#### [nav] `42:4810` Report menu
- Sidebar: Report — submenu ['1', '2']
- Notes: Default collapsed + Variant2 expanded. Icon: folder. Sub rows are PLACEHOLDERS: '1' and '2' (report names not yet defined in the design).

#### [component] `42:4917` Report symbol (sub-list only)
- Notes: 280x84 column (gap 4px) of two dark sub-menu rows in Default state with placeholder labels '1' and '2'. Used inside 42:4813 (Report expanded).

#### [component] `41:3926` Frame 1707478886 — Edit row-action icon button
- Buttons: Edit (icon only)
- Notes: 40x30 icon button, padding 10, centered 16px 'edit' (pencil-in-square) icon, icon fill #1C3586 (Primary). Default: no bg, radius top-left 8 / bottom-right 8 (asymmetric). Variant2 (hover/pressed): bg #E1E6F5, radius 4px.

#### [component] `41:3931` Frame 1707478887 — Delete row-action icon button
- Buttons: Delete (icon only)
- Notes: 40x30 icon button, 15x16 'trash' icon fill #CD3F32. Default: no bg, radius tl8/br8. Variant2 (hover): bg #FFE9E8, radius 4px.

#### [component] `68:4614` View row-action icon button
- Buttons: View (icon only)
- Notes: 40x30 icon button, 18x15 eye icon fill #89C74A (green). Default: no bg. Variant2 (hover): bg #D0F5AA, radius 4px.

#### [component] `154:7244` Active status badge/action
- Notes: 40x30, 18px 'check-circle' icon (circle outline + check, fill #019204 green, white inner). Default: no bg, padding 8, radius 8. Variant2: bg #D1F4D2 (light green), padding 12px 9px, radius top-left 8 / bottom-right 8. Icon-only — no text; represents the ACTIVE status (or 'set active' toggle).

#### [component] `154:7253` Inactive status badge/action
- Notes: 40x30, 18px 'cross-circle' icon fill #EC4F4F (red). Default: no bg, padding 8, radius 8. Variant2: bg #F9E6E6 (light red), padding 12px 9px, radius tl8/br8. Icon-only; represents INACTIVE status (or 'set inactive').

#### [component] `154:7264` back (row action)
- Notes: 40x30, padding 8, 18px curved 'backward' arrow icon (points LEFT) fill #7C7D7D grey. Default: no bg, radius 8. Variant2: bg #D6D8D8, radius tl8/br8. Meaning: send the record BACK to the previous step/approver (reverse of forward).

#### [component] `154:7275` Transfer (row action)
- Notes: 40x30, padding 8, same 'backward' arrow asset flipped (rotate 180 + scaleY -1) so it points RIGHT, fill #1C3586 (Primary blue). Default: no bg, radius 8. Variant2: bg #E7EBF8, radius tl8/br8. Visually IDENTICAL to 'forward' — only the component name differs (transfer = move item/record to another ship/base/store).

#### [component] `154:7286` forward (row action)
- Notes: 40x30, padding 8, right-pointing curved arrow, fill #1C3586. Default: no bg, radius 8. Variant2: bg #E7EBF8, radius tl8/br8. Meaning: forward the record to the next step/approver in the workflow (pairs with 'back').

#### [component] `42:5091` Save button
- Buttons: Save
- Notes: Primary button 99x44, padding 8px 20px, radius 8, gap 8: text 'Save' (Roboto Medium 16px, white, line-height 1.5) + 16px white check-circle outline icon at right. Default bg #1C3586 (Primary); Variant2 (hover) bg #1B45AD.

#### [component] `42:5127` Clear All button
- Buttons: Clear All
- Notes: Secondary/danger-light button 127x44, padding ~10.7px 20px, radius 8, 0.97px border, gap 5: text 'Clear All' (Roboto Medium 16px, color var(--btn-2) = #FF0000) + 18x17 eraser icon (#FF0000 outline). Default: bg #FFEFED, border rgba(248,198,205,0.6). Variant2 (hover): bg #FFCBCB, border #FFE3E7.

#### [component] `6:3078` Rows-per-page dropdown (Frame 2147224019) — supporting component
- Form **Rows per page**:
  - Rows per page [select] options=['10', '20', '30', '40'] — default 10; menu opens upward
- Notes: Table page-size selector: 68x33 white box, 1px border #D2D2D2, radius 5, padding 10px 7px, value (Roboto Medium 15px #363333) + 24px arrow-down icon. Variants show values 10 (Default), 10 with dropdown OPEN (Variant2: an 'Action Dropdown' 68px wide, radius 8, drop-shadow 0 0 4px rgba(0,0,0,0.2), positioned ABOVE the field (top:-107px) listing 20 / 30 / 40 as 33px rows with border-bottom #EBEBEB), 30 (Variant3), 40 (Variant4), 20 (Variant5). Options: 10, 20, 30, 40.

**Open questions from this section:**
- The section contains TWO menu kits (legacy light Inter kit at 4:xxx vs. current dark Roboto kit at 31:xxxx+). Assumed the dark Roboto kit is the one to build; confirm the light kit (4:802/4:823/4:838/4:2654) is legacy and not used.
- 4:823 'Menu' contains cooperative/loan-product labels (Collections, Loan Management, Repayments, Withdrawals, HR Management, Customer Management, Notifications, plus hidden nested items like Savings List, GL Journal, Financial Year). These are almost certainly template leftovers — confirm they are out of scope for NAVI-CIMS.
- Report menu (42:4810 / 42:4917) sub-items are placeholders '1' and '2' — the real report names are not in the design.
- 31:5866 is named 'User Management main menu' but lists Rack, Admin Authority, Department, Directorate, Port, Terms & Conditions, Tender Ocation, Parametar, Appointment (inner frame named 'Configuration main menu'). Unclear whether these are additional Configuration sub-menu items (beyond Office/Appointment/Rank/Country/Division/District/Upazila) or a different module; 'Appointment' appears in both
- 31:10580 is named 'Configuration menu' but its label/content is User Management (User, Role Permission).
- The main-menu item component (31:5790) has Variant3/Variant4 states with muted text #9CB1C9 and open chevron; their semantics (disabled? no-permission? child-active?) are not labelled.
- Sidebar sub-item Active bg rgba(0,48,102,0.75) is translucent — the exact rendered color depends on the sidebar background color (defined in the app-shell section, not here).
- 'Transfer' (154:7275) and 'forward' (154:7286) components are pixel-identical (same asset, same colors); only names differ — confirm whether Transfer should have a distinct icon.
- Active/Inactive components (154:7244/7253) are icon-only; unclear whether they are read-only status indicators in table cells or clickable toggle actions (both have a hover-like Variant2 with tinted bg).
- Row-action icon buttons use asymmetric radius (top-left 8 / bottom-right 8) in Default and 4px radius on hover — verify this is intentional and not a Figma artifact.
- Clear All text uses variable btn-2 = #FF0000 (pure red) while its icon/border palette is softer pink; confirm the exact red.


### Section: Login screen + app shell (header, logout menu, user chip) + design tokens

#### [page] `129:6683` Login new
- Title: Central Inventory Management Software (login hero)
- Sidebar: (no sidebar on login) — submenu []
- Form **Login card (right, 488px wide, bg #F4F7FF, 10px border rgba(255,255,255,0.15), radius 15px**:
  - User Id [text] placeholder=`User Id` — No visible label; placeholder only. Input: white bg, 1px border #E5E7EB, 410x50, radius 8, placeholder Roboto Regular 16 #726D6D at 19px left inset.
  - Password [password] placeholder=`Password` — Same style as User Id (410x50, white, #E5E7EB border, radius 8). No eye/show-password icon drawn. 21px gap between the two inputs.
  - Remember me [checkbox] — Unchecked 16x16 checkbox (rounded), 7px gap to label. Label Roboto Regular 15 #666666 (token Base Color/Text), line-height 22.
- Buttons: Login; Forgot your password?
- Notes: Full-screen 1920x1080. Background: solid rgb(45,60,130) #2D3C82 base, then photo 'bg 1' (navy ships/helicopter) with overlay rgba(42,64,133,0.3), then image 'new-bg 4' overlay, plus a decorative wave group (129:6684, 3042x528 at left -587 top 627). Left hero block at left 239px, vertically centered, width 817, column gap 30: 'Welcome to' Barlow Regular 42px #AFB58B (olive/khaki) tracking 1.68 line-height 28; title 'Central Inventory / Management Software' Barlow Bold 60px white tracking 2.4 line-height 65 (2 lines). Login card: navy crest logo 145x137 centered at top, 52px gap to form; form column gap 21. Row 'Remember me' (left) / 'Forgot your password?' (right, Roboto Regular 15 #1C3586 underline, centered text). Login button: full width 410x46, bg #1C3586 (Primary), radius 8, px 32 py 10, text 'Login' Roboto Medium 17 #F9FAFB capitalize. Footer line at top 1023, centered: Roboto Regular 14 #FFEFEF tracking 0.7 with 'CIMS' and 'TotalOfftec.' in Roboto SemiBold 16: 'All Rights Reserved © 2026 CIMS  |   Designed & Developed by TotalOfftec.'

#### [page] `31:7044` 01_User Management- User (main app screen used as app-shell/token reference)
- Breadcrumb: [Back] User Management > User
- Title: User
- Sidebar: User Management (expanded) > User (active) — submenu ['User', 'Role Permission']
- Form **User (form card; header bar bg #E3E8FF h53 with chevron-right icon + 'User' Roboto Medium **:
  - User Type [select] **required** placeholder=`Please Choose` — Chevron-down icon on right (27px). Options not drawn.
  - User Name [text] **required** placeholder=`-`
  - Email [text] **required** placeholder=`-`
  - Phone Number [text] **required** placeholder=`-`
  - Role [select] **required** placeholder=`--` — Chevron-down icon on right. Options not drawn.
  - Password [password] **required** placeholder=`-` — Eye (view) icon 22px inside a 40x40 button at right end of the input.
- Buttons: Back; Clear All; Save; Columns; Go
- Table **User List** — columns: SL | User Type | User Name | Email | Phone Number | Role | Status | Action
  - row actions: edit (pencil-square icon, blue #1C3586-ish, 16px in 40x30 button with radius top; delete (trash icon, red, 15x16 in 40x30 button)
  - status values: Active = #0E9F6E (green text); Inactive = #ACACAC (grey text)
  - features: sort icon (double up/down arrows, 18px) on User Type, User Name, Email, Phone Number, Role, Status (not on SL/Action); per-column filter row under header: search input (border #DFDFDF, radius 6, padding 9, search icon 18 @50% opacity) for ; Columns chooser button top-right ('Columns' + chevron-down, 143px wide, border rgba(0,0,0,0.1), radius 4); pagination: text 'Showing 1 to 10 or 11 results' (bold numbers; note 'or' typo for 'of') + first/prev/1/2/3/next/last bu; rows-per-page: label 'Rows per page' + select showing '10' (68x33, border #D2D2D2, radius 5); zebra rows: odd rows bg #F5F7FF, even rows white, row border-bottom #E5E5E5; header row bg #E3E8FF, border-bottom #D1D6EB, header text Roboto Medium 16 #3C3C3C tracking 0.5; body cells Roboto Mediu; column widths: SL 60, User Type 250, User Name 200, Email 220, Phone Number 150, Role 250, Status 150-160, Action flex; ; vertical scrollbar drawn: track #F2F2F2 7px wide radius 100, thumb #DEDEDE
- Notes: APP SHELL LAYOUT (1920x1080): Sidebar fixed left, width 325px, full height, bg rgb(0,38,82) #002652 with rgba(0,0,0,0.3) black overlay (effective ~#001B39). Sidebar logo block height 107, px 20: crest logo 69x65 + 12px gap + app name in white: 'Central Inventory ' Poppins SemiBold 20 / 'Management System' Poppins Medium 16 (text node named Outfit SemiBold, capitalize). Menu list starts at top 117 (h 476, vertical scroll), inner column width 295 centered, item gap 4. Parent menu item: h 40, px 15, radius 6, 18px icon at 75% opacity, label Roboto Regular 17 #DEDEDE tracking 0.17 capitalize, chevron-down 24px at right 4 (all except Dashboard have a chevron; Dashboard has no chevron). Expanded/active parent (User Management): bg rgba(255,255,255,0.08), text #F9FCFF, chevron rotated to point up/open. Submenu list width 280 right-aligned, gap 4; submenu item h 40, pl 20 pr 15, radius 6, text Roboto Regular 15 #DEDEDE tracking 0.15, 3x20 rounded left indicator bar rgba(255,255,255,0.6); ACTIVE submenu (User): bg rgba(0,48,102,0.75), text white, indicator bar #ED841A (orange). Menu order: Dashboard, Configuration, Item Management, Ship/Base Management, Inventory Management, Allocation/Sanc

#### [nav] `4:1438` Header symbol
- Breadcrumb: [Back] (breadcrumb block only contains the Back button)
- Form **Header search**:
  - Search here [search] placeholder=`Search here` — Drawn as plain placeholder text Inter Regular 16 #959597 followed by a 24px search icon (ep:search); no visible box border.
- Buttons: Back; Search here (search field placeholder + icon); bell icon; name+role chip (System Admin / John Abraham)
- Notes: Older-style header component (Inter font, #2B5299 accents). Size 1600x80 (1604x84 incl. shadow), white bg, drop-shadow 0 0 1px rgba(0,0,0,0.25), px 20, gap 20, items centered. Left to right: hamburger icon 24px (ic:round-menu, dark grey); Breadcrumb block 452x32 containing a 'Back' pill button (bg #F3F7FF, px 8 py 4, radius 6, 16px back-arrow icon + 'Back' Inter Regular 15 #2B5299 line-height 22); right area 841px wide, right-aligned, gap 20: 'Search here' + search icon 24, bell icon 24 (mynaui:bell) with a small red dot at top-right; then name+role chip (4:1490, 185px wide). NOTE: this differs from the header actually used on the app screens (31:7335: Back button + text breadcrumb + bell with numeric badge + User chip 31:10388, no hamburger, no search).

#### [nav] `4:1464` Dashboard Header symbol
- Breadcrumb: [Back]
- Form **Header search**:
  - Search here [search] placeholder=`Search here`
- Buttons: Back; Search here (search field placeholder + icon); bell icon; dash name+role chip (System Admin / John Abraham)
- Notes: Visually identical to 4:1438 Header symbol (same 1600x80 white bar, hamburger, Back pill, Search here, bell, name+role). Only structural difference: the user chip is 'dash name+role' (4:1323), a non-button div (no cursor-pointer), whereas Header uses the button variant 4:1490. Same styles: chip w 185, left+right 1px borders rgba(32,78,161,0.5), radius 8, pl 16 pr 8 py 8; 'System Admin' Inter Medium 16 #2B5299; 'John Abraham' Inter Regular 12 #787777, right-aligned; avatar 40px radius 19 with 12px green online dot bottom-right.

#### [component] `4:1490` name+role
- Buttons: name+role chip (clickable button; opens Logout popup)
- Modals/popups: Logout popup (4:1498) is the associated dropdown
- Notes: 185x56 button. Layout: text block (right-aligned, gap 4) then avatar, gap 8; padding pl 16 pr 8 py 8; radius 8; left and right 1px borders rgba(32,78,161,0.5) (no top/bottom border); transparent background (screenshot dark bg is the canvas). Role line 'System Admin' Inter Medium 16 #2B5299 line-height 24; name line 'John Abraham' Inter Regular 12 #787777 line-height 24. Avatar 40x40, radius 19, grey #D9D9D9 fallback under photo, 12px green status dot at bottom-right (px 2 inset). Older-style (Inter) counterpart of User chip 31:10388.

#### [popup] `4:1498` Logout popup
- Buttons: Log Out
- Modals/popups: Logout popup itself: 250x270, bg #FEFEFE, radius 8, py 30, column gap 24, items centered. Avatar 82px round (radius 41) with 25.9px green status dot bottom-right; then 'System Admin' Inter Medium 20 #2B5299 tracking 1.6;
- Notes: Older-style logout dropdown (Inter, #2B5299/#204EA1). No caret/arrow, no shadow defined in the node itself. Pairs with name+role 4:1490 / Header 4:1438.

#### [component] `31:10388` User chip
- Buttons: User chip (clickable button; opens Logout popup 2)
- Modals/popups: Logout popup 2 (31:10400) is the associated dropdown
- Notes: 171x46 button, transparent bg (screenshot dark bg is canvas), pl 15 pr 8 py 4, radius 5, no borders. Layout: avatar 38px round (photo, radius 100) then text block, gap 8, LEFT-aligned. Role 'Admin' Roboto Medium 13 #797474 (line-height 1.5, -6px bottom margin), name 'Kamal Hossain' Roboto Medium 15 #555555 line-height 24. No online-status dot. This is the chip actually used in the app header 31:7335 (top-right of every main screen).

#### [popup] `31:10400` Logout popup 2
- Buttons: Log Out
- Modals/popups: Logout popup 2 itself: 237x247, bg #F5F5F5, radius 8, py 30, column gap 24, items centered. Avatar 60px round (photo, no status dot); 'Admin' Roboto Medium 20 #2F4086 (Heading 2 token) tracking 1.6; 'Kamal Hossain' Robot
- Notes: Current-style logout dropdown (Roboto, Primary #1C3586). Pairs with User chip 31:10388. No caret, no shadow defined on the node. Only content is avatar + role + name + Log Out button (no profile/settings links).

#### [component] `26:5133` Tables/Cell
- Buttons: Active (status toggle segment)
- Notes: Table cell 295x53 containing a centered status toggle/segmented pill 111.2x34.37: full-width white track with 1.011px border #E5E7EB radius 8; the RIGHT segment (70.76px wide) is filled bg rgba(14,159,110,0.1) with 1.011px border #0E9F6E, radius 8, label 'Active' Inter Medium 12.13 #0E9F6E centered; the LEFT ~40px segment is empty white (implies an Inactive/off position). Only the Active state is drawn — no Inactive variant exists in the file.

#### [component] `26:5194` Tables/Cell 2
- Buttons: Active (status toggle segment)
- Notes: Identical status toggle pill to 26:5133 (111.2x34.37, white track #E5E7EB border, right green segment rgba(14,159,110,0.1) / border #0E9F6E, 'Active' Inter Medium 12.13 #0E9F6E), but the cell is narrower: 111x53 (pill fills the cell). Same single 'Active' state only.

**Open questions from this section:**
- Which header should be implemented: the 'Header symbol' 4:1438 / 'Dashboard Header symbol' 4:1464 (hamburger + Back pill + 'Search here' + bell + Inter-styled name+role 'System Admin / John Abraham') or the header actually placed on the app screens 31:7335 (Back button + text breadcrumb + bell with '11' badge + Roboto User chip 'Admin / Kamal Hossain', no hamburger/search)? The two are visually di
- Similarly two logout popups exist (4:1498 Inter/#204EA1 with online-status dot vs 31:10400 Roboto/#1C3586 without dot). Presumably 31:10400 pairs with the User chip 31:10388 used on the screens — confirm.
- Login screen has no visible field labels (placeholder-only 'User Id' / 'Password'), no show-password eye icon, no error/validation state, and no 'Forgot your password?' destination screen was provided.
- Login footer says 'All Rights Reserved © 2026 CIMS | Designed & Developed by TotalOfftec.' while the app footer says 'Copyright ©2026 CIMS. Design and Developed by TotalOfftec.  All rights reserved.' — confirm which wording to standardize (or keep both as drawn).
- Pagination summary text is drawn as 'Showing 1 to 10 or 11 results' ('or' likely a typo for 'of'); the page-jump box shows '1-2' — confirm intended behavior (page range input?).
- Tables/Cell (26:5133, 26:5194) status toggle only has an 'Active' state drawn (right green segment); the Inactive/off appearance is not defined. Also the User List table shows status as plain colored text (Active #0E9F6E / Inactive #ACACAC), not this pill — confirm which representation to use where.
- Sidebar 'Report' submenu component contains placeholder items '1' and '2' only; Allocation/Sanction and Compilation/Verification submenus each contain a single item with the same name as the parent — confirm real submenu items.
- Sample table data on 31:7044 has 'User Name' = 01975337001 (a phone number) and Email '--'; the User Type/Role dropdown options are not drawn anywhere.
- Header 'Back' button on 31:7044 is drawn at 50% opacity — is that a disabled state (no history) or just the default look?
- The sidebar app name text node is named 'Outfit SemiBold' but its spans use Poppins; the login footer wrapper is 'SF Pro Display' with Roboto spans — confirm Poppins/Roboto are the intended fonts (Roboto for UI, Barlow for the login hero, Poppins for the sidebar brand).


### Section: Configuration module (7 master-data screens)

#### [page] `93:9288` 01_Configuration - Office
- Breadcrumb: Back | Configuration > Office
- Title: Office
- Sidebar: Configuration > Office — submenu ['Office', 'Appointment', 'Rank', 'Country', 'Division', 'District', 'Upazila']
- Form **Office (collapsible section header with right-pointing chevron; card title 'Office' in #1C**:
  - Office Code [text] **required** placeholder=`-` — Row 1 col 1 of 3-column grid
  - Office Name [text] **required** placeholder=`-` — Row 1 col 2
  - Office Type [select] **required** placeholder=`--` — Row 1 col 3; dropdown with chevron; no options drawn
  - District [select] **required** placeholder=`--` — Row 2 col 1; no options drawn
  - Division [select] **required** placeholder=`--` — Row 2 col 2; no options drawn
  - Country [select] **required** placeholder=`--` — Row 2 col 3; no options drawn
  - Address [text] **required** placeholder=`-` — Row 3, spans 2 columns (960px wide)
  - Status [radio] options=['Active', 'Inactive'] — Row 3 col 3; bordered box (39px) containing two 18px square-style check controls; 'Active' checked by default (filled #5F73D0 inner square), 'Inactive' unchecked (round outline). Component name 'Check Box Square' but beh
- Buttons: Back; Clear All (light red bg #FFEFED, red text, eraser/clear icon); Save (primary #1C3586, white text, check-circle icon); Columns (dropdown chooser); Go; pagination: first, prev, 1, 2, 3, next, last, '1-2' page-jump; Rows per page: 10 (select)
- Table **Office List** — columns: SL | Office Code | Office Name | Office Type | District | Division | Country | Status | Action
  - row actions: View (green eye icon); Edit (blue pencil icon); Delete (red trash icon)
  - status values: Active (#0E9F6E green); Inactive (#ACACAC grey)
  - features: sort icon (double up/down arrow) on Office Code, Office Name, Office Type, District, Division, Country, Status (not on S; per-column filter row directly under header: '--' under SL, search-icon input under each data column, '--' under Action; Columns chooser button (top right of card); alternating row bg (#F5F7FF / white); pagination: 'Showing 1 to 10 or 11 results' (numbers bold), first/prev/1/2/3/next/last, page-jump box '1-2' + 'Go' butto; Rows per page select showing '10' (options 20/30/40/50 in dropdown component)
- Notes: Section header strip uses #E3E8FF with a right-pointing chevron (arrow-down rotated 90) even though the section is shown expanded. Table header bg #E3E8FF. Filter inputs show only a magnifier icon (no placeholder). Design-context layer names call the form '(BN) Create Office Admin'.

#### [page] `93:10090` 02_Configuration - Appointment
- Breadcrumb: Back | Configuration > Appointment
- Title: Appointment
- Sidebar: Configuration > Appointment — submenu ['Office', 'Appointment', 'Rank', 'Country', 'Division', 'District', 'Upazila']
- Form **Appointment (collapsible section header, right-pointing chevron; header bg rgba(227,232,25**:
  - Appointment Name [text] placeholder=`--` — Left half (713px); NO required asterisk drawn; label color #363333
  - Status [radio] options=['Active', 'Inactive'] — Right half; 'Active' checked by default (filled #5F73D0), 'Inactive' unchecked
- Buttons: Back; Clear All; Save; Columns; Go; pagination: prev, 1, 2, 3, next, '1-2' page-jump; Rows per page: 10 (select; options 20, 30, 40, 50)
- Table **Appointment Name** — columns: SL | Designation | Status | Action
  - row actions: View (green eye); Edit (blue pencil); Delete (red trash)
  - status values: Active (#0E9F6E); Inactive (#878888)
  - features: sort icon on Designation and Status; per-column filter row: '--' under SL, search inputs with placeholder 'Search..' under Designation and Status, '--' under; Columns chooser; alternating row bg rgba(245,247,255,0.8) / white; pagination: 'Showing 1 - 10 results' (note: different wording from other screens; no first/last buttons - only prev, 1, ; Rows per page select '10' with dropdown options 20/30/40/50 (component 'Pagignation' Default variant shows the open drop
- Notes: Table title is 'Appointment Name' (not 'Appointment List'); table header bg #EAEDFE with header text 15px #363333 (slightly different from other screens). Form field is 'Appointment Name' but table column is 'Designation'. Filter row inputs are the 'Search 330' component (border #D2D2D2, shadow, 'Search..' placeholder) unlike the icon-only filter inputs elsewhere.

#### [page] `93:10835` 03_Configuration - Rank
- Breadcrumb: Back | Configuration > Rank
- Title: Rank
- Sidebar: Configuration > Rank — submenu ['Office', 'Appointment', 'Rank', 'Country', 'Division', 'District', 'Upazila']
- Form **Rank (collapsible section header, right-pointing chevron)**:
  - Rank Name [text] **required** placeholder=`-` — Left half
  - Rank Name(Bangla) [text] placeholder=`-` — Right half; label has no space before '(Bangla)'
- Buttons: Back; Clear All; Save; Columns; Go; pagination: first, prev, 1, 2, 3, next, last, '1-2'; Rows per page: 10
- Table **Rank Information List** — columns: SL | Rank Name | Rank Name Bangla | Priority | Action
  - row actions: View (green eye); Edit (blue pencil); Delete (red trash)
  - features: sort icon on Rank Name, Rank Name Bangla, Priority; per-column filter row: '--' under SL, search-icon inputs under Rank Name / Rank Name Bangla / Priority, '--' under Actio; Columns chooser; alternating row bg; pagination 'Showing 1 to 10 or 11 results', first/prev/1/2/3/next/last, '1-2' + Go; Rows per page 10
- Notes: Table has a 'Priority' column that has no corresponding form field. Column widths fixed: Rank Name 400, Rank Name Bangla 350, Priority 438, Action 210. No Status column/field on this screen.

#### [page] `93:11562` 04_Configuration - Country
- Breadcrumb: Back | Configuration > Country
- Title: Country Information
- Sidebar: Configuration > Country — submenu ['Office', 'Appointment', 'Rank', 'Country', 'Division', 'District', 'Upazila']
- Form **Country Information (collapsible section header, UP chevron '^')**:
  - Country Name [text] **required** placeholder=`-` — Row 1 left; asterisk #FE1E1E with no space before it
  - Country Code [text] placeholder=`-` — Row 1 right
  - GMT [text] placeholder=`-` — Row 2 left (710px wide), right half empty
- Buttons: Back; Clear All; Save; Columns; Go; pagination: first, prev, 1, 2, 3, next, last, '1-2'; Rows per page: 10
- Table **Country Information List** — columns: SL | Country Name | Country Code | Action
  - row actions: View (green eye); Edit (blue pencil); Delete (red trash)
  - features: sort icon on Country Name and Country Code; per-column filter row: '--' under SL, search-icon inputs under Country Name / Country Code, '--' under Action (icon rend; Columns chooser; alternating row bg; pagination 'Showing 1 to 10 or 11 results', first/prev/1/2/3/next/last, '1-2' + Go; Rows per page 10
- Notes: Section header title is 'Country Information' (differs from breadcrumb 'Country'). Form card is 1540 wide (vs 1546 on other screens) so the Clear All/Save buttons sit ~6px further left. In the layer tree the Country Name / Country Code / GMT inputs contain a chevron-down 'Icon-up' instance, but no chevron is visible in the render - treat as plain text inputs. Filter-row search icons render as a circle glyph. No Status field/column.

#### [page] `93:12055` 05_Configuration - Division
- Breadcrumb: Back | Configuration > Division
- Title: Division
- Sidebar: Configuration > Division — submenu ['Office', 'Appointment', 'Rank', 'Country', 'Division', 'District', 'Upazila']
- Form **Division (collapsible section header, UP chevron '^')**:
  - Division Name [text] **required** placeholder=`-` — Left half; asterisk #FE1E1E
  - Division Name (Bangla) [text] placeholder=`-` — Right half
- Buttons: Back; Clear All; Save; Columns; Go; pagination: first, prev, 1, 2, 3, next, last, '1-2'; Rows per page: 10
- Table **Division List** — columns: SL | Division Name | Division Name (Bangla) | Action
  - row actions: View (green eye); Edit (blue pencil); Delete (red trash)
  - features: sort icon on Division Name and Division Name (Bangla); per-column filter row: '--' under SL, search-icon inputs (rendered as circle glyph) under both name columns, '--' under ; Columns chooser; alternating row bg; pagination 'Showing 1 to 10 or 11 results', first/prev/1/2/3/next/last, '1-2' + Go; Rows per page 10
- Notes: Sample data oddly puts 'Chattogram'/'Dhaka' (English) in the 'Division Name (Bangla)' column while 'Division Name' shows '-'. Layer tree again contains invisible chevron instances inside the two text inputs. No Status field/column.

#### [page] `93:13070` 06_Configuration - District
- Breadcrumb: Back | Configuration > District
- Title: District  Name
- Sidebar: Configuration > District — submenu ['Office', 'Appointment', 'Rank', 'Country', 'Division', 'District', 'Upazila']
- Form **District  Name (collapsible section header, UP chevron '^'; note double space in source te**:
  - District  Name [text] **required** placeholder=`-` — Row 1 left; label has a double space 'District  Name'; asterisk #FE1E1E
  - District  Name (Bangla) [text] placeholder=`-` — Row 1 right; double space in label
  - Select Division [select] **required** placeholder=`Please Choose-` — Row 2 left (710px); 'Dropdown Example' component with chevron; no options drawn (component variants show 'Please Choose' / '--')
- Buttons: Back; Clear All; Save; Columns; Go; pagination: first, prev, 1, 2, 3, next, last, '1-2'; Rows per page: 10
- Table **District  Name List** — columns: SL | Division Name | District Name | District  Name (Bangla) | Action
  - row actions: View (green eye); Edit (blue pencil); Delete (red trash)
  - features: sort icon on Division Name, District Name, District Name (Bangla); per-column filter row: '--' under SL, search-icon inputs under the three data columns, '--' under Action; Columns chooser; alternating row bg; pagination 'Showing 1 to 10 or 11 results', first/prev/1/2/3/next/last, '1-2' + Go; Rows per page 10
- Notes: Column widths: Division Name 400, District Name 350, District Name (Bangla) 438, Action 210. Form card 1540 wide. Table lists Division Name first (parent), then District Name.

#### [page] `93:13815` 07_Configuration - Upazila
- Breadcrumb: Back | Configuration > Upazila
- Title: Upazila Name
- Sidebar: Configuration > Upazila — submenu ['Office', 'Appointment', 'Rank', 'Country', 'Division', 'District', 'Upazila']
- Form **Upazila Name (collapsible section header, UP chevron '^')**:
  - Upazila Name [text] **required** placeholder=`-` — Row 1 left; asterisk #FE1E1E, no space before it
  - Upazila Name (Bangla) [text] placeholder=`-` — Row 1 right
  - District Name [select] **required** placeholder=`Please Choose-` — Row 2 left (710px); 'Dropdown Example' component with chevron; no options drawn
- Buttons: Back; Clear All; Save; Columns; Go; pagination: first, prev, 1, 2, 3, next, last, '1-2'; Rows per page: 10
- Table **Upazila List** — columns: SL | Upazila Name | District Name | Upazila Name (Bangla) | Action
  - row actions: View (green eye); Edit (blue pencil); Delete (red trash)
  - features: sort icon on Upazila Name, District Name, Upazila Name (Bangla); per-column filter row: '--' under SL, search-icon inputs under the three data columns, '--' under Action; Columns chooser; alternating row bg; pagination 'Showing 1 to 10 or 11 results', first/prev/1/2/3/next/last, '1-2' + Go; Rows per page 10
- Notes: Column widths: Upazila Name 400, District Name 350, Upazila Name (Bangla) 438, Action 210. Column order puts Upazila Name before its parent District Name (opposite of District screen). Form card 1540 wide.

#### [component] `233:6666` Frame 1707478654 (footer row variant)
- Notes: Standalone footer bar, 1602x48, white bg, drop-shadow 0 0 2px rgba(0,0,0,0.15), px 20, content centered. Text Roboto Regular 15px #7E7E7E; 'CIMS' in #4D4C4C; ' SIMEC System Ltd.' in #003066 (navy); two spaces before 'All rights reserved.'. This is a variant of the per-screen footer (which reads 'TotalOfftec.' instead of 'SIMEC System Ltd.' and is 1594x40).

**Open questions from this section:**
- Footer developer credit is inconsistent: every screen footer says 'Design and Developed by TotalOfftec.' while standalone frame 233:6666 says 'SIMEC System Ltd.' - which one is final?
- Section-header collapse chevron is inconsistent: Office/Appointment/Rank draw a right-pointing chevron ('>') on an expanded section, while Country/Division/District/Upazila draw an up chevron ('^'). Confirm the expanded/collapsed icon convention.
- Pagination summary wording differs: 'Showing 1 to 10 or 11 results' (probably intended 'of 11') on 6 screens vs 'Showing 1 - 10 results' on Appointment; Appointment also lacks first/last page buttons.
- Table title naming is inconsistent: 'Office List', 'Appointment Name' (not 'Appointment List'), 'Rank Information List', 'Country Information List', 'Division List', 'District  Name List', 'Upazila List'.
- Appointment: form field 'Appointment Name' has no required asterisk and the table column is labelled 'Designation' - confirm the field/column name mapping and whether it is required.
- Rank table has a 'Priority' column with no corresponding form input - is a Priority field missing from the form?
- Status radio/checkbox: the control is a 'Check Box Square' component (checked = filled blue square, unchecked = round outline). Confirm whether it should behave as radio (single-select) - the visual suggests radio semantics.
- Country/Division/District/Upazila text inputs contain an invisible chevron-down icon instance in the Figma layer tree; render shows plain text inputs. Confirm they are plain text inputs, not selects.
- Filter-row search icon renders as a magnifier on Office/Rank/District/Upazila but as a plain circle glyph on Country/Division (clipped instance) - assume magnifier everywhere?
- Appointment filter inputs have a 'Search..' placeholder and #D2D2D2 border; other screens are icon-only with #DFDFDF border - unify?
- Dropdown option lists (Office Type, District, Division, Country, Select Division, District Name) are not drawn anywhere; only placeholders '--' / 'Please Choose-'. Rows-per-page dropdown component reveals options 20/30/40/50 (plus displayed 10).
- 'Inactive' status text color differs: #ACACAC on Office vs #878888 on Appointment. Table header bg differs: #E3E8FF vs #EAEDFE (Appointment). Alternating row bg: #F5F7FF vs rgba(245,247,255,0.8).
- Double spaces exist in source strings 'District  Name', 'District  Name (Bangla)', 'District  Name List' - typo or intentional?
- Division sample rows show 'Chattogram'/'Dhaka' under 'Division Name (Bangla)' and '-' under 'Division Name' - placeholder data only.
- The Back button component is drawn at 50% opacity on all screens - is it disabled or just styled subtle?
- A hidden 'Chatbox' floating button (bottom-right, 54x54) and a hidden header 'Search' field exist in every frame - should they be implemented?
- Sidebar 'Main menu' component (from design-context text extraction) also contains sub-items for other modules that are collapsed on these screens: Item Management (Create Item, Create Item Category, Create Item Unit, Brand, Model, Store, Opening Stock), Ship/Base Management (Create Ship/Base, Create Ship/Base Category), User Management (User, Role Permission) - not visible here; verify in the logi
- Which action does 'View' (eye) open - a modal or a detail page? No modal/popup is drawn in this section.


### Section: User Management (User + Role Permission variants)

#### [page] `31:7044` 01_User Management- User
- Breadcrumb: [< Back] User Management > User  (Back is a small outlined pill button, opacity 50%; 'User Management' #585858 16px; last crumb 'User' in primary #1c3586 15px)
- Title: User (collapsible card header: '>' chevron + 'User' 20px Roboto Medium #1c3586 on #e3e8ff bar, 53px tall)
- Sidebar: User Management (expanded, chevron rotated down, bg rgba(255,255,255,0.08)) > User (active submenu: bg rgba(0,48,102,0.7 — submenu ['User', 'Role Permission']
- Form **User (create/edit form card; grey #f9f8f8 inner panel with 24px padding, 2-column grid, 24**:
  - User Type [select] **required** placeholder=`Please Choose` — Row 1 col 1. Dropdown with chevron-down icon on the right; no options visible in design. Height 39px, border 0.97px #d2d2d2, radius ~4.85px.
  - User Name [text] **required** placeholder=`-` — Row 1 col 2. Height 40px.
  - Email [text] **required** placeholder=`-` — Row 2 col 1.
  - Phone Number [text] **required** placeholder=`-` — Row 2 col 2.
  - Role [select] **required** placeholder=`--` — Row 3 col 1. Dropdown with chevron; no options visible.
  - Password [password] **required** placeholder=`-` — Row 3 col 2. Has an eye (show/hide password) icon button at the right end of the input (40x40 icon area, 22px eye icon).
- Buttons: Back; Clear All; Save; Columns; Go; << (first page); < (prev); 1; 2; 3; > (next); << (last, mirrored); 1-2; 10 (rows per page selector)
- Table **User List** — columns: SL | User Type | User Name | Email | Phone Number | Role | Status | Action
  - row actions: edit (pencil-square icon, blue #1c3586-ish, 40x30 hit area); delete (trash icon, red)
  - status values: Active (#0e9f6e green); Inactive (#acacac grey)
  - features: sort icon (up/down double arrow, 18px) on User Type, User Name, Email, Phone Number, Role, Status (not on SL/Action); per-column filter row directly under header: '--' under SL, search-icon input (border #dfdfdf, radius 6px, 18px magnifie; 'Columns' chooser dropdown button (white, border rgba(0,0,0,0.1), radius 4px, 143px wide, chevron-down) at top-right of ; zebra rows: odd rows bg #f5f7ff, even rows white; row bottom border #e5e5e5; header row bg #e3e8ff with bottom border #d1d6eb, header text 16px Roboto Medium #3c3c3c tracking 0.5px; body text 14px ; pagination footer: 'Showing 1 to 10 or 11 results' (numbers bold) left; center controls: first(<<), prev(<), page 1 (act; column widths as drawn: SL 60, User Type 250, User Name 200, Email 220, Phone Number 150, Role 250, Status 160/150, Acti; vertical scrollbar indicator drawn at right edge of body (7px track #f2f2f2, thumb #dedede)
- Notes: 1920x1080 frame. Layout: sidebar 325px wide full height (bg rgb(0,38,82) with 30% black overlay ≈ #001b39; logo block 107px tall: 69x65 crest logo + 'Central Inventory' Poppins SemiBold 20px / 'Management System' Poppins Medium 16px white); top header 80px tall white with 0 0 2px rgba(0,0,0,0.15) shadow containing breadcrumb (left) and bell icon with red badge '11' + avatar/user block ('Admin' 13px #797474 over 'Kamal Hossain' 15px #555, Roboto Medium) on the right; footer bar 40px at y=1040 white with same shadow; page background rgba(63,60,216,0.05) tint over white. Body content column x=349 (24px inset), width 1546. Card 1 = form card: header bar #e3e8ff radius-top 6px, body white with border rgba(0,0,0,0.1), radius-bottom 8px, padding 24, gap 30; footer row right-aligned buttons Clear All (bg #ffefed, border rgba(248,198,205,0.6), red text 'Clear All' + eraser icon, 44px tall, radius 8) and Save (bg #1c3586, white 16px Medium 'Save' + check-circle icon, 44px, radius 8). Card 2 = list card: white, border rgba(0,0,0,0.1), radius 8, padding 24/20/30. Sidebar main menu items: 17px Roboto Regular #dedede with 18px icons; parent items with submenus show right chevron; other (collapse

#### [page] `31:7474` 02_User Management- Role Permission (variant A: Role Permission List)
- Breadcrumb: [< Back] User Management > Role Permission (last crumb #1c3586)
- Title: Role Permission List (18px Roboto Medium #1c3586, inside the list card — no separate collapsible header bar on this screen)
- Sidebar: User Management (expanded) > Role Permission (active submenu with orange bar) — submenu ['User', 'Role Permission']
- Buttons: Back; Create Role Permission (+ icon; bg #2f4086, white 16px Medium, 44px tall, radius 8, top-ri; Go; << first; < prev; 1; 2; 3; > next; >> last; 1-2; 10 (rows per page)
- Table **Role Permission List** — columns: SL | Role Name | Status | Action
  - row actions: edit (pencil-square, blue); delete (trash, red)
  - status values: Active (#0ba735 green — note: slightly different green than 
  - features: sort icons on Role Name and Status; per-column filter row: '--' under SL, search-icon inputs under Role Name and Status, '--' under Action; zebra rows: odd #f5f7ff, even white; row bottom border #e5e5e5; header bg #e3e8ff, radius-top 8px; outer table border rgba(0,0,0,0.1) radius 8; pagination footer identical to User List: 'Showing 1 to 10 or 11 results', << < 1 2 3 > >>, '1-2' jump box, 'Go', 'Rows ; column widths as drawn: SL 60, Role Name 617, Status flex, Action 250 (centered); NO 'Columns' chooser on this table (unlike User List); vertical scrollbar indicator at right edge
- Notes: List-only state of the Role Permission module. Single white card (border rgba(0,0,0,0.1), radius 8, padding 24 sides / 20 top / 30 bottom, gap 40) at x=349,y=104 width 1546. Card header row: title left, 'Create Role Permission +' button right. Below the card the page is empty (page bg tint). Same shell (sidebar/header/footer) as the User screen. Edit row action presumably opens variant B (breadcrumb 'Edit'), Create button opens variant C (breadcrumb 'Create Role').

#### [page] `31:7798` 02_User Management- Role Permission (variant B: Edit role — permission matrix with pre-checked values)
- Breadcrumb: [< Back] User Management > Role Permission > Edit (last crumb 'Edit' #1c3586)
- Title: Role Permission (collapsible card header: '>' chevron + 'Role Permission' 20px Medium #1c3586 on #e3e8ff bar)
- Sidebar: User Management (expanded) > Role Permission (active) — submenu ['User', 'Role Permission']
- Form **Role Permission (form panel, grey #f9f8f8, 24px padding)**:
  - Role Name [text] **required** placeholder=`Employee Role` — Full-width single input (39px tall, border 0.97px #d2d2d2, radius ~4.85). Value 'Employee Role' is drawn at 50% opacity in #1a1a1a (looks like placeholder styling but represents the existing role's name being edited).
- Form **Assign Permission (permission matrix)**:
  - Assign Permission (header select-all checkbox) [checkbox] — Header row bg #e3e8ff, 50px tall, bottom border #9eaff9, radius-top 6px. Header cells left→right: [checkbox] 'Assign Permission' (314px), [menu/hamburger icon] 'Menu' (232px), [edit/pencil icon] 'Edit' (159px), [list ico
  - Item Management [checkbox] — Row 1 (bg #f5f7ff, border rgba(166,180,237,0.46), radius 8, 50px tall, rows separated by 4px). Row-select checkbox + label; then 6 checkboxes: Menu=unchecked, Edit=CHECKED, List=unchecked, Add=CHECKED, Delete=CHECKED, Vi
  - Ship/Base Management [checkbox] — Row 2 (bg #e3e8ff). All 6 permission checkboxes unchecked; row checkbox unchecked.
  - Inventory Management [checkbox] — Row 3 (bg #f5f7ff). All unchecked.
  - Allocation/Sanction [checkbox] — Row 4 (bg #e3e8ff). All unchecked. (Text layer is 'ALLOCATION/SANCTION' rendered via capitalize → displays 'Allocation/Sanction'.)
  - Compilation/Verification [checkbox] — Row 5 (bg #f5f7ff). All unchecked. (Layer 'COMPILATION/VERIFICATION' capitalized.)
  - Report [checkbox] — Row 6 (bg #e3e8ff). All unchecked. NOTE: this variant has only 6 module rows — no 'User Management' row (variant C has 7).
- Buttons: Back; Clear All (bg #ffefed, red text, eraser icon); Save (bg #1c3586, white, check-circle icon)
- Table **Assign Permission matrix (checkbox grid, not a data table)** — columns: Assign Permission (module name + row checkbox) | Menu | Edit | List | Add | Delete | View
  - features: header select-all checkbox before 'Assign Permission'; each module row has its own row-level checkbox before the module name; permission cells are 18px checkboxes: unchecked = 1.99px border #8c8c8c, radius 4px, transparent; checked = filled blue ; permission column cell widths as drawn: Menu 200, Edit 200, List 180, Add 200, Delete 180, View 180; label cell 339; alternating row backgrounds #f5f7ff / #e3e8ff, each row its own rounded (8px) bordered pill; 4px gap between rows
- Notes: Edit state of a role. Same collapsible card structure as the User form card (header bar #e3e8ff + white body border rgba(0,0,0,0.1), radius-bottom 8, padding 24, gap 30). Order inside card body: Role Name panel → permission matrix (width 1498) → button row (Clear All, Save right-aligned). No pagination/list on this screen. Below the card the page is empty.

#### [page] `41:4113` 02_User Management- Role Permission (variant C: Create Role — empty permission matrix)
- Breadcrumb: [< Back] User Management > Role Permission > Create Role (last crumb 'Create Role' #1c3586)
- Title: Role Permission (collapsible card header with '>' chevron)
- Sidebar: User Management (expanded) > Role Permission (active) — submenu ['User', 'Role Permission']
- Form **Role Permission (form panel)**:
  - Role Name [text] **required** placeholder=`--` — Full-width input, empty state placeholder '--' (#3a3a3a at 50% opacity).
- Form **Assign Permission (permission matrix — all unchecked)**:
  - Assign Permission (header select-all checkbox) [checkbox] — Same header as variant B: [☐] Assign Permission | Menu | Edit | List | Add | Delete | View, each with icon.
  - Item Management [checkbox] — Row 1 bg #f5f7ff. All unchecked.
  - Ship/Base Management [checkbox] — Row 2 bg #e3e8ff. All unchecked.
  - Inventory Management [checkbox] — Row 3 bg #f5f7ff. All unchecked.
  - Allocation/Sanction [checkbox] — Row 4 bg #e3e8ff. All unchecked.
  - Compilation/Verification [checkbox] — Row 5 bg #f5f7ff. All unchecked.
  - Report [checkbox] — Row 6 bg #e3e8ff. All unchecked.
  - User Management [checkbox] — Row 7 bg #f5f7ff. All unchecked. This 7th row exists only in variant C.
- Buttons: Back; Clear All; Save
- Table **Assign Permission matrix** — columns: Assign Permission (module + row checkbox) | Menu | Edit | List | Add | Delete | View
  - features: header select-all checkbox; row-level checkboxes; all 7x6 permission checkboxes unchecked (empty create state); alternating row bg #f5f7ff / #e3e8ff, rounded 8px rows with border rgba(166,180,237,0.46), 4px gap; header bg #e3e8ff bottom border #9eaff9
- Notes: Create state reached from 'Create Role Permission +' on variant A. Identical layout to variant B except: breadcrumb 'Create Role', Role Name empty ('--'), all checkboxes unchecked, and an extra 7th module row 'User Management'. Card body height 692px; buttons row at y≈625 within card. Header contains a hidden 'Search' frame (not rendered) and a hidden 'Chatbox' floating button bottom-right (hidden in this frame).

**Open questions from this section:**
- User Type and Role dropdowns show no option lists in the design — options must come from the backend/other specs.
- Pagination text reads 'Showing 1 to 10 or 11 results' — 'or' is almost certainly a typo for 'of'.
- User List sample rows put a phone-like value (01975337001) in the User Name column and '--' in Email — placeholder data; column semantics should follow headers.
- Status green differs between screens (#0e9f6e in User List vs #0ba735 in Role Permission List) — pick one token.
- The '1-2' box next to 'Go' in the pagination bar is ambiguous (page-jump input placeholder vs. a range label).
- Role Permission edit variant (B) has 6 module rows while create variant (C) has 7 (adds 'User Management'); also 'Configuration' and 'Dashboard' modules are absent from the matrix — confirm the authoritative module list.
- In variant B the Role Name value 'Employee Role' is drawn at 50% opacity (placeholder style) — confirm it is a filled value, not a placeholder.
- No delete-confirmation modal, toast, or empty-state is drawn for these screens.
- Row-level checkbox before each module name and header 'Assign Permission' checkbox: assumed to be select-all for row / whole matrix; not documented in the file.
- 'Menu' permission column semantics (likely: show module in sidebar) is not defined in the design.


### Section: Item Management main screens

#### [page] `68:2915` 01_Item Management- Create Item
- Breadcrumb: [← Back] Item Management > Create Item (Back = outlined 30px button, 13px Roboto Medium, uppercase-ish tracking 1.3px, border #c5c5c5, shown at 50% opacity; 'Item Management' #585858 16px; chevron; 'Create Item' #1c3586 
- Title: Create Item (collapsible card header: bg #e3e8ff, h 53px, right-pointing chevron icon + title 20px Roboto Medium #1c3586, radius 6px top)
- Sidebar: Item Management (expanded, row bg rgba(255,255,255,0.08), text #f9fcff 17px, chevron rotated to point down) → active sub — submenu ['Create Item', 'Create Item Unit', 'Brand', 'Model', 'Create Item Category']
- Form **Create Item (form area: outer white card p24 radius 8 border rgba(0,0,0,0.1); inner field **:
  - Item ID [text] **required** placeholder=`-`
  - Item Name [text] **required** placeholder=`-`
  - Brand [select] **required** placeholder=`--` — chevron-down at right; no options drawn
  - Model [select] **required** placeholder=`--` — chevron-down at right; no options drawn
  - OEM [text] **required** placeholder=`-`
  - Warranty [text] **required** placeholder=`-`
  - Country of Manufacture [text] **required** placeholder=`-`
  - Country of Origin [text] **required** placeholder=`-`
  - Category [select] **required** placeholder=`--` — chevron-down at right; no options drawn
  - Procurement Year [date] **required** placeholder=`--` — calendar icon (solar:calendar-date-linear, 18px) at right inside the input; input h39
  - Status [radio] options=['Active', 'Inactive'] — Rendered as a bordered box (h39, same input styling) containing two square check-box style radios (18px, 'Check Box Square' component; selected = square with 8px #5f73d0 filled inner square). 'Active' is selected by defa
- Buttons: Clear All (secondary/danger: bg #ffefed, border 0.97px rgba(248,198,205,0.6), text red #ff; Save (primary: bg #1c3586, white 16px Roboto Medium, h44 radius 8, px20, check-circle icon; Columns (dropdown button top-right of list card: white, border rgba(0,0,0,0.1), radius 4, ; Back (header)
- Table **Item List** — columns: SL | Item ID | Item Name | Brand | Model | OEM | Country of Manufacture | Procurement Year | Status | Action
  - row actions: View (eye icon, green); Edit (pencil/edit icon, blue); Delete (trash icon, red)
  - status values: Active (#0e9f6e, 14px Roboto Medium); Inactive (#acacac, 14px Roboto Medium)
  - features: sort icon (up/down double arrow, 18px) on every column except SL and Action; per-column filter row directly under header: '--' under SL and Action, search input (border #dfdfdf radius 6, p9, magnif; header row bg #e3e8ff, border-bottom #d1d6eb, text #3c3c3c 16px Roboto Medium tracking 0.5, py5 px20, radius 6 top; data rows h48, py4 px20, border-bottom #e5e5e5, alternating bg: row1 #f5f7ff, row2 white, row3 #f5f7ff; cell text #4b556; column widths (px): SL 60, Item ID 152, Item Name 200, Brand 144, Model 146, OEM 110, Country of Manufacture 231, Procur; pagination footer (in design, below the fold on this screen — clipped by the 1080 viewport; a 7px vertical scrollbar is ; Rows per page: label 14px #333 80% + select showing '10' (68x33, border #d2d2d2, radius 5, arrow-down icon); Columns chooser dropdown (top-right); list card: white bg, border rgba(0,0,0,0.1), radius 8, pt20 pb30 px24; table container border rgba(0,0,0,0.08) radius 8;
- Notes: Layout: 1920x1080. Sidebar 325px wide, full height, bg = rgb(0,38,82) with a 30% black overlay (≈#001B39); logo block h107 (anchor/crest logo 69x65 + 'Central Inventory' Poppins SemiBold 20px white / 'Management System' Poppins Medium 16px white); menu list starts y=117, items 295px wide, h40, radius 6, gap 4, 18px icons, labels Roboto Regular 17px #dedede tracking 0.17, top-level chevron-right (chevron_down rotated) on collapsible items; Dashboard has no chevron. Header (Frame 19): white, h80, drop-shadow 0 0 2px rgba(0,0,0,0.15), px20; left = Back button + breadcrumb; right = bell icon (24px) with red badge circle 15px containing '11' (10px SemiBold white), then user chip (38px round avatar photo, 'Admin' 13px #797474 Roboto Medium, 'Kamal Hossain' 15px #555 Roboto Medium). A hidden 'Search' input frame exists in the header (hidden=true) and a hidden 'Chatbox' floating button (bottom-right, hidden=true). Body bg #f9f8f8-ish light grey (screenshot) starting y=82; content padding 24/21; content width 1546. Footer: white bar h40 at y=1040, drop-shadow 0 0 2px rgba(0,0,0,0.15), centered text 15px Roboto Regular #7e7e7e with 'CIMS' #4d4c4c and ' TotalOfftec.' #003066. Form card gap be

#### [page] `88:5387` 02_Item Management- Create Item Unit
- Breadcrumb: [← Back] Item Management > Create Item Unit
- Title: Create Item Unit (card header bg #e3e8ff, chevron + 20px #1c3586 title)
- Sidebar: Item Management (expanded) → active submenu 'Create Item Unit' (bg rgba(0,48,102,0.75), orange #ed841a indicator) — submenu ['Create Item', 'Create Item Unit', 'Brand', 'Model', 'Create Item Category']
- Form **Create Item Unit (2-column grid, each column 713px, gap 24; same field/label/input styling**:
  - Unit ID [text] **required** placeholder=`-`
  - Unit Name [text] **required** placeholder=`-`
  - Unit Code [text] **required** placeholder=`-`
  - Status [radio] options=['Active', 'Inactive'] — Bordered box with two square check-box style radios; Active selected by default (#5f73d0 fill), Inactive unselected. Sits in the right column of row 2.
- Buttons: Clear All; Save; Columns; Back; Go
- Table **Item Unit List** — columns: SL | Unit ID | Unit Name | Unit Code | Status | Action
  - row actions: View (green eye); Edit (blue pencil); Delete (red trash)
  - status values: Active (#0e9f6e); Inactive (#acacac)
  - features: sort icons on Unit ID, Unit Name, Unit Code, Status; per-column filter row: '--' under SL and Action; search inputs under Unit ID, Unit Name, Unit Code, Status; header bg #e3e8ff; alternating rows (#f5f7ff / white / #f5f7ff); column widths: SL 60, Unit ID 309.5, Unit Name 309.5, U; pagination fully visible on this screen: 'Showing 1 to 10 or 11 results' | «  ‹  [1] 2 3 ›  »  [1-2]  [Go] | 'Rows per p; Columns chooser dropdown
- Notes: Identical shell (sidebar/header/footer) to screen 01. Form card is shorter (2 rows), so the list card and its pagination row are fully visible. Rows-per-page select shows '10' with the arrow pointing UP in this screenshot (arrow-down icon rendered flipped) — treat as a select. Right-side vertical scrollbar (7px, at x=1581 within Body) is drawn.

#### [page] `88:6802` 03_Item Management- Brand
- Breadcrumb: [← Back] Item Management > Brand
- Title: Brand (card header bg #e3e8ff, chevron + 20px #1c3586 title)
- Sidebar: Item Management (expanded) → active submenu 'Brand' — submenu ['Create Item', 'Create Item Unit', 'Brand', 'Model', 'Create Item Category']
- Form **Brand (2-column grid; row 2 has only Status in the left column, 713px wide)**:
  - Brand ID [text] **required** placeholder=`-`
  - Brand Name [text] **required** placeholder=`-`
  - Status [radio] options=['Active', 'Inactive'] — Bordered box; Active selected by default; left column of row 2, right column empty.
- Buttons: Clear All; Save; Columns; Back; Go
- Table **Brand List** — columns: SL | Brand ID | Brand Name | Status | Action
  - row actions: View (green eye); Edit (blue pencil); Delete (red trash)
  - status values: Active (#0e9f6e); Inactive (#acacac)
  - features: sort icons on Brand ID, Brand Name, Status; filter row: '--' under SL and Action; search inputs under Brand ID, Brand Name, Status; column widths: SL 60, Brand ID 412.67, Brand Name 412.67, Status 160/150, Action 412.67 (icons centered); alternating rows #f5f7ff/white; pagination visible: 'Showing 1 to 10 or 11 results', « ‹ [1] 2 3 › », [1-2] [Go], 'Rows ; Columns chooser
- Notes: Same shell as 01/02. Note: page title in header/breadcrumb is 'Brand' (not 'Create Brand').

#### [page] `88:7508` 04_Item Management- Model
- Breadcrumb: [← Back] Item Management > Model
- Title: Model (card header bg #e3e8ff, chevron + 20px #1c3586 title)
- Sidebar: Item Management (expanded) → active submenu 'Model' — submenu ['Create Item', 'Create Item Unit', 'Brand', 'Model', 'Create Item Category']
- Form **Model (2-column grid, columns 713px, gap 24)**:
  - Model ID [text] **required** placeholder=`-`
  - Model Name [text] **required** placeholder=`-`
  - Brand Name [select] placeholder=`--` — dropdown with chevron-down at right; NO required asterisk drawn; no options drawn
  - Status [radio] options=['Active', 'Inactive'] — Bordered box; Active selected by default; right column of row 2.
- Buttons: Clear All; Save; Columns; Back; Go
- Table **Model List** — columns: SL | Model ID | Model Name | Brand Name | Status | Action
  - row actions: View (green eye); Edit (blue pencil); Delete (red trash)
  - status values: Active (#0e9f6e); Inactive (#acacac)
  - features: sort icons on Model ID, Model Name, Brand Name, Status; filter row: '--' under SL and Action; search inputs under Model ID, Model Name, Brand Name, Status; column widths: SL 60, Model ID 309.5, Model Name 309.5, Brand Name 309.5, Status 160/150, Action 309.5; alternating rows; pagination visible: 'Showing 1 to 10 or 11 results', « ‹ [1] 2 3 › », [1-2] [Go], 'Rows per page' [10]; Columns chooser
- Notes: Same shell as others. Brand Name is a select (links Model to a Brand) and is drawn without a required asterisk, unlike Model ID / Model Name.

#### [page] `88:8239` 05_Item Management- Create Item Category
- Breadcrumb: [← Back] Item Management > Create Item Category
- Title: Create Item Category (card header bg #e3e8ff, chevron + 20px #1c3586 title)
- Sidebar: Item Management (expanded) → active submenu 'Create Item Category' — submenu ['Create Item', 'Create Item Unit', 'Brand', 'Model', 'Create Item Category']
- Form **Create Item Category (2-column grid; row 2 has only Status in the left column)**:
  - Category ID [text] **required** placeholder=`-`
  - Category Name [text] **required** placeholder=`-`
  - Status [radio] options=['Active', 'Inactive'] — Bordered box; Active selected by default; left column of row 2, right column empty.
- Buttons: Clear All; Save; Columns; Back; Go
- Table **Item Category List** — columns: SL | Category ID | Category Name | Status | Action
  - row actions: View (green eye); Edit (blue pencil); Delete (red trash)
  - status values: Active (#0e9f6e); Inactive (#acacac)
  - features: sort icons on Category ID, Category Name, Status; filter row: '--' under SL and Action; search inputs under Category ID, Category Name, Status; column widths: SL 60, Category ID 349.5, Category Name 349.5, Status 349.5, Action 349.5 (icons centered); alternating rows; pagination visible: 'Showing 1 to 10 or 11 results', « ‹ [1] 2 3 › », [1-2] [Go], 'Rows per page' [10]; Columns chooser
- Notes: Same shell as others. List title is 'Item Category List' while page/breadcrumb title is 'Create Item Category'. Note: on this screen the Status filter search box in the table filter row is full column width (349.5) unlike other screens where Status column is 160.

#### [component] `68:3682` Frame 7313
- Form **Standalone date-picker field (loose element on canvas, 713x58.7, at page coords x=737 y=37**:
  - Effective From [date] **required** placeholder=`--` — Label 14.5px Roboto Regular #4c4c4c with asterisk colored #fe1e1e (slightly different red than the 'red' used elsewhere); input h39 white, border 0.97px #d2d2d2, radius 4.85, pl10 pr15, calendar icon (solar:calendar-date
- Notes: This is an orphaned form-field frame (a date input labelled 'Effective From'), not a screen. It is not referenced by any of the five Item Management screens (none of them has an 'Effective From' field). Screenshot background appears dark because the frame is transparent over the canvas.

**Open questions from this section:**
- Pagination text reads 'Showing 1 to 10 or 11 results' in every screen — likely a typo for 'of'; confirm which to implement.
- '1-2' box next to Go: unclear whether it is a page-jump input (placeholder showing valid range) or a static label; the design shows it as a white bordered box with 'Go' primary button beside it.
- Status radio control uses a square 'Check Box Square' component (checkbox look) but behaves as a mutually exclusive Active/Inactive pair — confirm radio semantics.
- On screen 01 (Create Item) the pagination/rows-per-page row exists in the layer tree but is clipped below the 1080 viewport (only a scrollbar is drawn); confirm the list card scrolls with the page.
- Screen 04 (Model): 'Brand Name' select has no required asterisk while all other ID/Name fields are required — confirm whether Brand Name is optional.
- Frame 7313 ('Effective From' date field) is a loose component on the canvas not used by any of these five screens — confirm whether it belongs to a different screen or is a leftover.
- Dropdown options for Brand, Model, Category (screen 01) and Brand Name (screen 04) are not drawn — options come from data.
- Rows-per-page select shows '10' with the arrow pointing up on screens 02–05 (component 'arrow-down' rendered flipped) — treat as a normal select.
- Sidebar submenus for Configuration (Office, Appointment, Rank, Country, Division, District, Upazila), Ship/Base Management (Create Ship/Base, Create Ship/Base Category), Inventory Management (Store, Opening Stock), User Management (User, Role Permission) are defined in the sidebar component set but collapsed on these screens; Allocation/Sanction, Compilation/Verification and Report submenus were n
- Header contains a hidden 'Search' input and a hidden bottom-right 'Chatbox' floating button (hidden=true layers) — confirm they are out of scope.
- Sidebar submenu items are grouped in a 280px-wide container inset from the 295px parent items; sort icons and column widths listed are from the design metadata; the Status column is 160px in header/filter rows but 150px in data rows (minor inconsistency in the design).


### Section: Item Management modals / popups / toasts

#### [modal] `83:4979` Obsolete Request modal
- Title: Obsolete Request
- Form **Item Image**:
  - Item Image thumbnails [file] — Read-only gallery: 3 tiles 102x102, gap 20 — first tile is a real photo (rope image, masked to 102x102), tiles 2 and 3 are grey #E8E4E4-ish placeholder tiles with an image-placeholder glyph. Container bg #FCFCFC, dashed 
- Form **Item Info**:
  - Title of Item [text] — Read-only label : value row. Value: 'Rope, Polyester, Cir: 1inch Dia: 8mm'
  - IMC/Spec [text] — Value: '55.114'
  - Deno [text] — Value: 'Meter' — same row also contains 'Acct Status : Quasi Permanent' and 'Item Type : Other' (3 label:value pairs on one line, single text node with space padding)
  - Group [text] — Value: 'D' — same row also contains 'Sub Group : Quasi Permanent' and 'Directorate : DNS'
- Form **Item Specification**:
  - Item [text] — Value ': Rope'
  - Type [text] — Value ': Polyester'
  - Size : Cir: 1inch Dia [text] — Value ': 8mm'
  - Minimum Breaking Strength [text] — Value ': 9.1kn'
  - Safe Load (Safety Factor 12) [text] — Value ': 0.760kn'
  - Weight [text] — Value ': 0.045kg/m'
  - Part No [text] — Value empty (':' only)
  - Additional Part No [text] — Value empty
  - Model No [text] — Value empty
  - Brand [text] — Value empty
  - Manufacturer's Name [text] — Value empty
  - Manufacturer Country [text] — Value empty
  - Country of Origin [text] — Value empty
- Form **Documents**:
  - 1. Delivery Report [file] — Ordered-list row (list-decimal), right side has View (green eye icon 40x30) + Download icon, gap 12. Row borders top+bottom rgba(28,53,134,0.05). Section container uses SOLID border rgba(210,210,210,0.6) (unlike other da
  - 2. Delivery Report [file] — Same as row 1
  - 3. Delivery Report [file] — Same as row 1
- Buttons: Print (dark grey #484848 button, white Roboto Medium 16, printer icon 16px on right, 93x40; Download (red #EF3F2E button, white Roboto Medium 16, download icon 20x16 on right, h40, p; X close icon (24px, top-right of Action Bar header); View (green eye icon, 40x30) per document row; Download (Material 3 download icon) per document row
- Table **Entry Details** — columns: Entered By | Date | Approved By | Approved Date | Ship Code | Status | Edit Remarks
  - features: plain bordered table, no sort/filter/pagination; text Roboto Regular 11 #121212
- Notes: Read-only detail modal, 792px wide (frame 800x1330), white bg, radius 8. STICKY HEADER 'Action Bar': bg #E9EBF6, border 1px #BAC6FF, px20 py12, top radius 8, title 'Obsolete Request' Inter Semi Bold 14 #4B5563 (grey/600), X icon 24px right. BODY: white, px22 py30, vertical gap 16 between sections, scrollable (overflow-y auto). Each section = header strip (bg #F5F5F5, px20 py2, top radius 4, title Roboto Medium 18 #1C3586 Primary) + content box (padding top16 left20 right16, bottom radius 4). Content boxes for Item Image/Item Info/Item Specification/Entry Details use DASHED borders rgba(28,53,134,0.2) left/right/bottom; Documents box uses SOLID rgba(210,210,210,0.6). Detail rows: Roboto Regular 11px, line-height 20px, letter-spacing 0.5px, color #121212, py4, hairline borders rgba(28,53,134,0.05) top/bottom; label and value are ONE text string with space padding and a ':' separator (labels align at ~col 30, i.e. label column ~155px). STICKY FOOTER: bg #F3F4F6 (grey/100), h84, px20 py16, drop-shadow 0 -2px 2px rgba(0,0,0,0.08), buttons right-aligned gap 20: 'Print' then 'Download'. Print/Download buttons are named 'Save' component instances in Figma.

#### [popup] `83:5132` view popup (Item Details — GRN/receipt spec + Item Info)
- Title: Item Details
- Form **Specification**:
  - GRN No [text] — : 0725.82647
  - Transaction Date [text] — : 29/07/2025  02:20PM
  - IMC [text] — : A.C. 0013.00374.0000
  - Item Name [text] — : Clamp, Air Cleaner
  - Deno [text] — : No
  - Receive Quantity [text] — : 2
  - Part No [text] — : 11000615
  - Remarks [text] — : Meter
- Form **Item Info**:
  - Title of Item [text] — : Rope, Polyester, Cir: 1inch Dia: 8mm
  - IMC/Spec [text] — : 55.114
  - Deno [text] — : Meter | Acct Status : Quasi Permanent | Item Type : Other (single line)
  - Group [text] — : D | Sub Group : Quasi Permanent | Directorate : DNS (single line)
- Buttons: Print icon (17px 'Subtract' printer glyph, in header right); X close (24px, header right, gap 16 from print icon)
- Notes: Read-only 'view' popup, 792x545, white, radius 8, column layout with gap 16, content width 747 centered. Action Bar: bg #E3E8FF, h48, pl25 pr30 py15, border rgba(0,0,0,0.08) top/left/right, top radius 6; title 'Item Details' Inter Semi Bold 14 #4B5563; right cluster: printer icon 17px + X 24px (gap 16). Section header strip bg #F5F5F5 with SOLID border rgba(210,210,210,0.6) top/left/right, title Roboto Medium 18 #1C3586; Specification content box solid border rgba(210,210,210,0.6), pl20 pr16 py16; rows Roboto Regular 11/20 #121212 tracking 0.5, hairline rgba(28,53,134,0.05). The Item Info block reuses the DASHED rgba(28,53,134,0.2) container style (same as Obsolete Request modal). The frame height (545) clips the Item Info block at its last row in the screenshot; no footer/buttons in this popup.

#### [popup] `83:5259` Frame 2147224463 (Item Details — item master spec)
- Title: Item Details
- Form **Specification**:
  - Item ID [text] — : 0725.82647
  - Item Name [text] — : Ship
  - Brand [text] — : A.C. 0013.00374.0000
  - Model [text] — : Clamp, Air Cleaner
  - OEM [text] — : No
  - Warranty [text] — : 2
  - Country of Manufacturer [text] — : 11000615
  - Country of Origin [text] — : Meter
  - Category [text] — : Meter
  - Procurement Year [text] — : Meter
- Buttons: Print icon (17px, header right); X close (24px, header right)
- Notes: Item master 'view' popup, 792x419, white, radius 8, pb12, gap 16. Same Action Bar as 83:5132 (bg #E3E8FF, h48, 'Item Details', printer 17px + X 24px). One 'Specification' section (747 wide) with solid rgba(210,210,210,0.6) borders; 10 label:value rows. Sample values are obviously placeholder (e.g. Country of Origin ': Meter'); treat as dummy data.

#### [popup] `88:8930` Frame 2147224464 (Item Details — image + info + GRN spec)
- Title: Item Details
- Form **Item Image**:
  - Item Image thumbnails [file] — 3 tiles 102x102 gap 20: photo tile (rope) + 2 grey placeholder tiles. Container bg #FCFCFC, SOLID border rgba(210,210,210,0.6), h134.
- Form **Item Info**:
  - Title of Item [text] — : Rope, Polyester, Cir: 1inch Dia: 8mm
  - IMC/Spec [text] — : 55.114
  - Deno [text] — : Meter | Acct Status : Quasi Permanent | Item Type : Other
  - Group [text] — : D | Sub Group : Quasi Permanent | Directorate : DNS
- Form **Specification**:
  - GRN No [text] — : 0725.82647
  - Transaction Date [text] — : 29/07/2025  02:20PM
  - IMC [text] — : A.C. 0013.00374.0000
  - Item Name [text] — : Clamp, Air Cleaner
  - Deno [text] — : No
  - Receive Quantity [text] — : 2
  - Part No [text] — : 11000615
  - Remarks [text] — : Meter
- Buttons: Print icon (17px, header right); X close (24px, header right)
- Notes: Fuller Item Details popup, 792x734, white, radius 8, pb12. Same Action Bar (bg #E3E8FF h48, 'Item Details', printer + X). Three sections stacked with gap 16, each 747 wide, ALL using solid rgba(210,210,210,0.6) borders (header strip has top/left/right border, content box has left/right/bottom): Item Image (3 thumbnails), Item Info (4 rows), Specification (8 GRN rows). Row/typography identical to other popups (Roboto Regular 11/20 #121212 tracking 0.5).

#### [popup] `93:9186` Frame 2147224465 (Item Details — Unit)
- Title: Item Details
- Form **Specification**:
  - Unit ID [text] — : 0725.82647
  - Unit Name [text] — : Ship
  - Unit Code [text] — : A.C. 0013.00374.0000
- Buttons: Print icon (17px, header right); X close (24px, header right)
- Notes: Unit master view popup, 792x223, same shell (Action Bar 'Item Details' bg #E3E8FF + printer + X; Specification section, solid rgba(210,210,210,0.6) borders). 3 rows.

#### [popup] `93:9222` Frame 2147224466 (Item Details — Brand)
- Title: Item Details
- Form **Specification**:
  - Brand ID [text] — : 0725.82647
  - Brand Name [text] — : Ship
- Buttons: Print icon (17px, header right); X close (24px, header right)
- Notes: Brand master view popup, 792x195, same shell as 93:9186. 2 rows.

#### [popup] `93:9244` Frame 2147224467 (Item Details — Category)
- Title: Item Details
- Form **Specification**:
  - Category ID [text] — : 0725.82647
  - Category Name [text] — : Ship
- Buttons: Print icon (17px, header right); X close (24px, header right)
- Notes: Category master view popup, 792x195, same shell as 93:9186. 2 rows.

#### [popup] `93:9264` Frame 2147224468 (Item Details — Model)
- Title: Item Details
- Form **Specification**:
  - Model ID [text] — : 0725.82647
  - Model Name [text] — : Ship
  - Brand Name [text] — : Ship
- Buttons: Print icon (17px, header right); X close (24px, header right)
- Notes: Model master view popup, 792x223, same shell as 93:9186. 3 rows (Model ID, Model Name, Brand Name).

#### [modal] `209:6701` Group Demand Forwarded (comment modal)
- Title: Demand Forwarded
- Form **Demand Forwarded**:
  - Comment [textarea] **required** placeholder=`-` — Label 'Comment' Inter Semi Bold 14 #4B5563 followed by red asterisk. Textarea 450x91, white bg, border 1px #D1D5DB (grey/300), radius 8, px20 py16; text shown is '-' in Inter Regular 16 #646C7A (grey/550) — likely placeh
- Buttons: Cancel (outlined: border 1px #D1D5DB, transparent/white bg, h44, px20 py8, radius 8, Inter; Confirm (filled: bg #4558AE Primary 600, border 1px #7C91F2 Primary 400, h44, px20 py8, ra; X close (24px, absolute top-right at left 426 / top 0 of the 450px content)
- Notes: Confirmation dialog for forwarding a group demand (Forward action → asks for a mandatory comment, then Confirm). Card: white, p20, radius 8, shadow 0 20px 24px rgba(0,0,0,0.08) (token D1), content width 450 (card ~490 wide). Title row 'Demand Forwarded' Inter Semi Bold 14 #4B5563 with bottom border 1px rgba(0,0,0,0.1), pb10; gap 16 to label; gap 16 to textarea; gap 28 to button row; buttons right-aligned, gap 20, order Cancel then Confirm. Screenshot shows the dialog over a dark backdrop (rgba overlay) — the overlay is canvas context, not part of the node.

#### [toast] `209:6717` Group-DemandItemToast (Are you sure? cancel-demand confirm)
- Title: Are you sure?
- Buttons: Yes (bg #1C3586 Primary, border 1px #7C91F2, h44, px25 py8, radius 8, Roboto Medium 17 whi; Cancel (bg #A49C9C grey, border 1px #D1D5DB, h44, px20 py8, radius 8, Inter Medium 17 whit
- Notes: SweetAlert-style confirmation (named 'toast' in Figma but drawn as a centered dialog): white card, radius 8, shadow 0 20px 24px rgba(0,0,0,0.08), pt45 pb50 px20, content column 400 wide, gap 15. Top: octicon 'alert-24' warning triangle icon 100x97 in red/salmon (#EF3F2E family, light stroke). Heading 'Are you sure?' Roboto Medium 32 #575555 letter-spacing 0.96. Body 'You want to cancel this demand!' Roboto Regular 18 #474141. Buttons centered, gap 20, order Yes (primary dark blue) then Cancel (grey). No close X. Screenshot shows dark backdrop around the card (canvas context).

**Open questions from this section:**
- 83:5132 (view popup) is 545px tall and visually clips its Item Info section at the bottom in the render — unclear whether the popup is meant to scroll or the frame is simply truncated in the design.
- Label:value rows are single Figma text strings with space padding (e.g. 'Deno : Meter   Acct Status : Quasi Permanent   Item Type : Other'); exact label-column width is inferred (~155px). Confirm the intended column widths for the 3-pairs-per-line rows in Item Info.
- Sample values in the Item Details variants are placeholder/dummy (e.g. 'Country of Origin : Meter', 'Country of Manufacturer : 11000615', 'Brand : A.C. 0013.00374.0000') — do not treat as real data mappings.
- Section container border style is inconsistent: Obsolete Request uses dashed rgba(28,53,134,0.2) for Item Image/Item Info/Item Specification/Entry Details but solid rgba(210,210,210,0.6) for Documents; the Item Details popups use solid throughout. Confirm which is canonical.
- Entry Details table in the Obsolete Request modal shows a header row plus one body row that repeats the header labels — actual body values unknown.
- Group-DemandItemToast is named 'toast' but is drawn as a centered SweetAlert-style confirmation dialog (with backdrop) — confirm it is a modal confirm, not a corner toast.
- 'Group Demand Forwarded' has no visible textarea placeholder other than '-' — confirm whether '-' is placeholder text or an empty-value display.
- Print/Download button behaviour in Obsolete Request (what gets printed/downloaded — the request PDF?) is not specified in the design.
- Document row 'View' icon is a green eye glyph and 'download' is a Material 3 Download icon component (Code Connect snippet) — confirm icon set to use in the React build.


### Section: Ship/Base Management

#### [page] `93:22990` 01_Ship/Base Management- Create Ship/Base
- Breadcrumb: [← Back button] Ship/Base Management > Create Ship/Base (last crumb in primary #1C3586, 15px; parent crumb #585858 16px; Back button is 30px tall, border #c5c5c5, radius 5, 13px medium uppercase-tracking text, drawn at 5
- Title: Create Ship/Base (card header bar: bg #E3E8FF, h 53px, chevron-right icon then title Roboto Medium 20px #1C3586)
- Sidebar: Ship/Base Management (expanded, bg rgba(255,255,255,0.08), chevron-down) → active submenu 'Create Ship/Base' (bg rgba(0, — submenu ['Create Ship/Base', 'Create Ship/Base Category']
- Form **Create Ship/Base (inner form panel: bg #F9F8F8, border rgba(0,0,0,0.08), radius 6, padding**:
  - ID [text] **required** placeholder=`-` — Row 1, left column
  - Type [select] **required** placeholder=`--` — Row 1, right column; chevron-down at right; no options drawn in the design
  - Name [text] **required** placeholder=`-` — Row 2, left column
  - Category [select] placeholder=`--` — Row 2, right column; no asterisk (optional); chevron-down; no options drawn. Presumably populated from Ship/Base Category master (screen 02)
- Buttons: Clear All (with red 'x-square/clear' icon; bg #FFEFED, border rgba(248,198,205,0.6), text ; Save (with white check-circle icon; bg #1C3586, white 16px medium text, h 44, radius 8, px; Columns (dropdown/column chooser: white, border rgba(0,0,0,0.1), radius 4, w 143, chevron-; Go (pagination jump; bg #2F4086, white text, radius 8); Back (header, left of breadcrumb); Pagination: first («), prev (‹), 1 (active, bg #2F4086), 2, 3, next (›), last (»)
- Table **Ship/Base List** — columns: SL | ID | Name | Type | Category | Action
  - row actions: View (eye icon, green #89C74A); Edit (pencil-square icon, #1C3586); Delete (trash icon, red #CD3F32)
  - features: sort icon (up/down arrows, 18px, #282828) on ID, Name, Type, Category; per-column filter row under header: '--' under SL, search inputs (search icon, border #DFDFDF, radius 6) under ID/Name/T; header bg #E3E8FF, bottom border #D1D6EB, header text Roboto Medium 16px #3C3C3C tracking 0.5; zebra rows: odd rows bg #F5F7FF, even rows white; row bottom border #E5E5E5; cell text Roboto Medium 14px #4B5563; pagination text 'Showing 1 to 10 or 11 results' (numbers semibold); pagination controls: first/prev/1/2/3/next/last + page-range box '1-2' + 'Go' button; Rows per page selector showing '10' (w 68, border #D2D2D2, radius 5, chevron); Columns chooser dropdown top-right of the card; vertical scrollbar track drawn at right of the body (#F2F2F2 track, #DEDEDE thumb); table outer border rgba(0,0,0,0.08), radius 8; SL column w 60; Category column fixed w 160
- Notes: Layout: 1920x1080. Sidebar w 325px, full height, bg rgb(0,38,82) overlaid with rgba(0,0,0,0.3) (≈ #001A39 effective); logo (69x65) + brand text 'Central Inventory' (Poppins SemiBold 20 white) / 'Management System' (Poppins Medium 16 white) in a 107px tall block; menu items h 40, radius 6, Roboto Regular 17px #DEDEDE (active #F9FCFF), 18px icons, chevron-right for collapsed groups. Header: white, h 80px, drop-shadow 0 0 2px rgba(0,0,0,0.15), left = Back + breadcrumb, right = bell (24px, #555 stroke) with red #EF3F2E badge '11' (10px semibold white) + user block (38px round avatar, 'Admin' 13px #797474 above 'Kamal Hossain' 15px #555 medium). Body area bg = white with rgba(63,60,216,0.05) overlay; content column left 24 / top 21, w 1546, vertical gap 30 between cards. Card 1 = form card (header bar #E3E8FF + white body p 24, radius 8, border rgba(0,0,0,0.1)); Clear All / Save right-aligned below the grey form panel with gap ~19px. Card 2 = list card (white, border rgba(0,0,0,0.1), radius 8, pt 20 pb 30 px 24). Footer: white bar h 40 at bottom of content area, centered text 15px #7E7E7E with 'CIMS' #4D4C4C and 'TotalOfftec.' #003066. Row action cells: three 40x30 icon buttons. Filter 

#### [page] `93:23603` 02_Ship/Base Management- Create Ship/Base Category
- Breadcrumb: [← Back button] Ship/Base Management > Create Ship/Base Category (same styling as screen 01)
- Title: Create Ship/Base Category (card header bar #E3E8FF, chevron-right icon, Roboto Medium 20px #1C3586)
- Sidebar: Ship/Base Management (expanded) → active submenu 'Create Ship/Base Category' (bg rgba(0,48,102,0.75), white text, orange — submenu ['Create Ship/Base', 'Create Ship/Base Category']
- Form **Create Ship/Base Category (inner panel bg #F9F8F8, border rgba(0,0,0,0.08), radius 6, p 24**:
  - Category ID [text] **required** placeholder=`-` — Left column; h 40, border 0.97px #D2D2D2, radius ~4.85
  - Category Name [text] **required** placeholder=`-` — Right column
- Buttons: Clear All (red text + red clear icon, bg #FFEFED, border rgba(248,198,205,0.6), h 44, radi; Save (white check-circle icon, bg #1C3586, white text, h 44, radius 8); Columns (column chooser dropdown, w 143, chevron-down); Go (pagination jump, bg #2F4086); Back (header); Pagination: first («), prev (‹), 1 (active), 2, 3, next (›), last (»)
- Table **Ship/Base Category List** — columns: SL | Category ID | Category Name | Action
  - row actions: View (eye, green #89C74A); Edit (pencil-square, #1C3586); Delete (trash, red #CD3F32)
  - features: sort icon on Category ID and Category Name; per-column filter row: '--' under SL, search input under Category ID, search input under Category Name, '--' under Actio; header bg #E3E8FF, border-bottom #D1D6EB, Roboto Medium 16px #3C3C3C; zebra rows (#F5F7FF / white), row border #E5E5E5, cell text Roboto Medium 14px #4B5563; pagination text 'Showing 1 to 10 or 11 results'; pagination first/prev/1/2/3/next/last + '1-2' range box + 'Go'; Rows per page '10' selector; Columns chooser; vertical scrollbar track/thumb drawn at right (#F2F2F2 / #DEDEDE); outer table border rgba(0,0,0,0.08), radius 8; SL col w 60; Action column flex-1 centered
- Notes: Identical shell (sidebar, header, footer, body background, card styling, pagination, action icons) to screen 01. Only differences: page title/breadcrumb, a single-row form with two required text inputs (Category ID, Category Name), no dropdowns, and a 4-column list table titled 'Ship/Base Category List'. Form card is shorter so the list card starts higher (~y 418 vs 501). No modal/toast/confirmation drawn.

**Open questions from this section:**
- Type and Category dropdowns on Create Ship/Base show only '--' placeholder; no option lists are drawn — option values (Ship vs Base? categories from screen 02?) must be confirmed.
- Pagination text literally reads 'Showing 1 to 10 or 11 results' — likely a typo for 'of'; confirm intended wording.
- Pagination shows a '1-2' range box next to a 'Go' button — its exact behaviour (page range display vs page-number input for Go) is not specified.
- In the Ship/Base List, rows 01 and 03 show '-' in green (#0E9F6E) in the Category column while row 02 shows '--' in grey (#ACACAC) — unclear whether Category is meant to be a colored status-like value or this is placeholder inconsistency.
- The Back button in the header is drawn at 50% opacity — unclear if it represents a disabled state or just styling.
- No modals/toasts (e.g., delete confirmation, save success) are drawn on either frame; behaviour of View/Edit/Delete row actions is not shown.
- Filter row shows '--' under SL and Action columns — presumably decorative placeholders rather than inputs.
- Rows-per-page selector shows '10' but no option list is drawn.
- Sidebar sub-menu items for other groups exist in the component set (Configuration: Office, Appointment, Rank, Country, Division, District, Upazila; Item Management: Create Item, Create Item Unit, Brand, Model, Create Item Category; Inventory Management: Store, Opening Stock; User Management: User, Role Permission) but only Ship/Base Management is expanded on these screens.


### Section: Inventory Management (Store, Opening Stock + popup)

#### [page] `93:24212` 01_Inventory Management- Store
- Breadcrumb: [< Back button] Inventory Management > Store
- Title: Store
- Sidebar: Inventory Management (expanded, chevron up) > Store (active, orange #ED841A left indicator bar, row bg rgba(0,48,102,0.7 — submenu ['Store', 'Opening Stock']
- Form **Store (collapsible card header: chevron-right icon + 'Store' in #1C3586 20px Roboto Medium**:
  - ID [text] **required** placeholder=`-` — Row 1 left column; input h 40px, bg white, border 0.97px #D2D2D2, radius 4.85px; placeholder #3A3A3A at 50% opacity 13.58px
  - Name [text] **required** placeholder=`-` — Row 1 right column
  - Type [select] **required** placeholder=`--` — Row 2 left column; dropdown with chevron-down icon on right; no options drawn (closed)
  - Concern [text] placeholder=`-` — Row 2 right column
  - Address [textarea] placeholder=`-` — Row 3 full width; taller input h 60px
- Buttons: Back; Clear All; Save; Columns; Go
- Table **Store List** — columns: SL | ID | Name | Type | Concern | Action
  - row actions: view (eye icon, green #89C74A); edit (pencil icon, blue #1C3586); delete (trash icon, red #CD3F32)
  - features: sort icon (double up/down arrows, 18px) on ID, Name, Type, Concern headers (not on SL/Action); per-column filter row under header: search inputs with magnifier icon for ID, Name, Type, Concern; SL and Action filter ; header bg #E3E8FF, header text #3C3C3C 16px Roboto Medium, bottom border #D1D6EB; zebra rows: odd rows bg #F5F7FF, even rows white; row bottom border #E5E5E5; cell text #4B5563 14px Roboto Medium; 'Columns' chooser button top-right (white, border rgba(0,0,0,0.1), radius 4px, w 143px, chevron-down); pagination: first (<<), prev (<), 1 (active, bg #2F4086, text #F9F9F9), 2, 3, next (>), last (>>), '1-2' page-jump input; results text: 'Showing 1 to 10 or 11 results' (bold 1, 10, 11); Rows per page select showing '10' with chevron (white, border #D2D2D2, radius 5px, h 33px); vertical scrollbar drawn at right edge of body (track #F2F2F2, thumb #DEDEDE, 7px wide)
- Notes: 1920x1080 page. Layout: sidebar 325px wide full height, bg = #002652 overlaid with rgba(0,0,0,0.3) (renders ~#001A39 dark navy); logo (69x65) + 'Central Inventory' (Poppins SemiBold 20) / 'Management System' (Poppins Medium 16) white, logo block h 107px. Sidebar menu items h 40px, radius 6px, 18px icon at 75% opacity, text #DEDEDE 17px Roboto Regular, chevron-right for collapsible groups; expanded group row bg rgba(255,255,255,0.08), text #F9FCFF; submenu items 15px, 3px x 20px left indicator bar (white 60% for inactive, #ED841A orange for active), active submenu row bg rgba(0,48,102,0.75). Top header: 80px tall, white, drop shadow 0 0 2px rgba(0,0,0,0.15), left = 'Back' button (border #C5C5C5, radius 5px, h 30px, arrow-back icon 14px, text 13px Roboto Medium black, tracking 1.3px, whole button at 50% opacity) + breadcrumb 'Inventory Management' (#585858 16px) > 'Store' (#1C3586 15px); right = bell icon 24px with red badge '11' (white 10px SemiBold), avatar 38px round + 'Admin' (#797474 13px) / 'Kamal Hossain' (#555 15px). Body area left 325px top 82px, 1594x999, page bg white with overlay rgba(63,60,216,0.05); inner content column 1546px wide with 24px left offset, 21px top, gap 3

#### [page] `93:24569` 02_Inventory Management- Opening Stock
- Breadcrumb: [< Back button] Inventory Management > Opening Stock
- Title: Opening Stock
- Sidebar: Inventory Management (expanded) > Opening Stock (active, orange indicator, row bg rgba(0,48,102,0.75)) — submenu ['Store', 'Opening Stock']
- Form **Opening Stock (collapsible card header, same style as Store)**:
  - Item ID [select] **required** placeholder=`--` — Row 1 left; dropdown with chevron-down; options not drawn
  - Store ID [select] **required** placeholder=`--` — Row 1 right; dropdown with chevron-down; options not drawn
  - Opening Quantity [number] placeholder=`-` — Row 2 left; plain text input (numeric expected from label; design shows plain input)
  - Stock Entry Date [date] placeholder=`--` — Row 2 right; input with calendar icon (solar:calendar-date-linear, 18px) at right, h 39px
- Buttons: Back; Clear All; Save; Columns; Go
- Table **Opening Stock List** — columns: SL | Item ID | Store ID | Opening Quantity | Stock Entry Date | Action
  - row actions: view (green eye); edit (blue pencil); delete (red trash)
  - features: sort icon on Item ID, Store ID, Opening Quantity, Stock Entry Date; per-column search filter row (magnifier inputs) for Item ID, Store ID, Opening Quantity, Stock Entry Date; SL and Action; zebra rows (#F5F7FF / white), header bg #E3E8FF; 'Columns' chooser button; pagination << < 1 2 3 > >> [1-2] Go; 'Showing 1 to 10 or 11 results'; 'Rows per page' 10; vertical scrollbar at right edge of body
- Notes: Identical shell (sidebar, header, footer, card styling, buttons, table styling, pagination) to the Store screen; only the form fields, list title, and columns differ. Form has 2 rows x 2 columns (no full-width row). All table cell values in the mockup are placeholders '--'.

#### [component] `117:10129` Frame 7374 (Opening Stock content variant, 1546x935)
- Breadcrumb: (none — frame has no sidebar/header/breadcrumb)
- Title: Opening Stock
- Sidebar: (none drawn) — submenu []
- Form **Opening Stock (collapsible card header, same style: bg #E3E8FF, chevron-right + title #1C3**:
  - ID [text] **required** placeholder=`-` — Row 1 left
  - Item ID [text] **required** placeholder=`-` — Row 1 right; drawn as a plain text input here (NOT a dropdown, unlike screen 02)
  - Quantity [number] placeholder=`-` — Row 2 left; plain input
  - Low stock threshold [number] placeholder=`-` — Row 2 right; plain input
  - Status [checkbox] options=['Active', 'Inactive'] — Row 3, left column only (w 713px). Rendered as one white bordered box (h 39px, border 0.97px #D2D2D2, radius 4.85px) containing two square tick-box options 18px: 'Active' checked (square outline stroke #7C91F2 with 8px #
- Buttons: Clear All; Save; Columns; Go
- Table **Opening Stock List** — columns: SL | ID | Item ID | Quantity | Low stock threshold | Status | Action
  - row actions: view (green eye); edit (blue pencil); delete (red trash)
  - status values: Active (text #0E9F6E green, Roboto Medium 14px); Inactive (text #999999 grey, Roboto Medium 14px)
  - features: sort icon on ID, Item ID, Quantity, Low stock threshold, Status; per-column search filter inputs for ID, Item ID, Quantity, Low stock threshold, Status; SL and Action cells show '--'; zebra rows (#F5F7FF / white), header bg #E3E8FF; 'Columns' chooser button; pagination << < 1 2 3 > >> [1-2] Go; 'Showing 1 to 10 or 11 results'; 'Rows per page' 10
- Notes: This 1546x935 frame is exactly the size of the body content column of the full pages (form card + 30px gap + list card, no sidebar/header/footer). Root frame has NO fill — the dark grey band visible between the two cards in the screenshot is the Figma canvas showing through the 30px gap, not a designed element. It is an alternate Opening Stock content design with a different field set (ID, Item ID, Quantity, Low stock threshold, Status) than screen 02 (Item ID dropdown, Store ID dropdown, Opening Quantity, Stock Entry Date). Table header 'ID' text node literally contains a leading space (' ID').

**Open questions from this section:**
- Store List 'Concern' column: rows 01/03 show '-' in green #0E9F6E and row 02 shows '--' in grey #ACACAC — looks like a status-column style leftover; confirm whether Concern is a plain text column or a status-like value.
- Node 117:10129 (Frame 7374) is titled 'popup' but is a bare 1546x935 content frame with no modal chrome (no overlay, close button, or dialog title bar) — it duplicates the Opening Stock form + list with a DIFFERENT field set (ID, Item ID, Quantity, Low stock threshold, Status) than screen 93:24569 (Item ID/Store ID dropdowns, Opening Quantity, Stock Entry Date). Which field set is the intended Ope
- In Frame 7374, Status 'Active/Inactive' is drawn with square check boxes but semantically should be a single-choice (radio) — confirm exclusivity behaviour.
- Screen 02 'Item ID' and 'Store ID' are dropdowns but Frame 7374 'Item ID' is a plain text input — confirm.
- Dropdown options for Type (Store), Item ID and Store ID (Opening Stock) are not drawn — option lists must come from API/spec.
- Pagination text reads 'Showing 1 to 10 or 11 results' (literal 'or', probably a typo for 'of'); the '1-2' box next to 'Go' appears to be a page-jump input — confirm.
- 'Back' button in header is drawn at 50% opacity (disabled look?) — confirm whether it is disabled or just styled.
- Table sample values are all '--' placeholders; no real Type/Concern/Store values are provided in the design.
- Store 'Address' field is a taller (60px) input — treat as textarea; confirm rows/maxlength.


### Section: Allocation/Sanction screen + toast

#### [page] `98:8104` 01_Allocation/Sanction- Allocation/Sanction
- Breadcrumb: [← Back button] Allocation/Sanction > Allocation/Sanction (first crumb #585858 16px Roboto Regular; last crumb #1C3586 15px)
- Title: Allocation/Sanction (card header bar #E3E8FF, 53px tall, right-pointing chevron icon + title Roboto Medium 20px #1C3586)
- Sidebar: Allocation/Sanction (expanded, row bg rgba(255,255,255,0.08), chevron rotated to point down) — submenu ['Allocation/Sanction (active submenu item: bg rgba(0,48,102,0.75), white 15px text, 3px x 20px orange #ED841A left indicator bar)']
- Form **Allocation/Sanction (form card; inner panel bg #F9F8F8, border rgba(0,0,0,0.08), radius 6p**:
  - ID [text] **required** placeholder=`-` — Row 1 col 1. Red asterisk (#FF0000) after label.
  - Type [text] **required** placeholder=`-` — Row 1 col 2. Red asterisk. Drawn as a plain text box (no dropdown chevron) — may actually be a select; see openQuestions.
  - Fiscal Year [date] placeholder=`--` — Row 1 col 3. Has calendar icon (solar:calendar-date-linear, 18px, stroke #949699) at right, input height 39px.
  - Date [date] placeholder=`--` — Row 2 col 1. Calendar icon at right, 39px tall.
  - Store Id [text] placeholder=`-` — Row 2 col 2.
  - Item Id [text] placeholder=`-` — Row 2 col 3.
  - Ship/Base Id [text] placeholder=`-` — Row 3 col 1 (fixed 467.333px width).
  - Allocation Qty [text] placeholder=`-` — Row 3 col 2; row 3 col 3 is empty. Numeric field presumably but drawn as plain text box.
- Buttons: Back (header, 30px tall, border #C5C5C5, radius 5px, left-arrow icon, text 13px Roboto Med; Clear All (bg #FFEFED, border 0.97px rgba(248,198,205,0.6), radius 8px, 44px tall, px 20px; Save (bg #1C3586, radius 8px, 44px tall, px 20px, white Roboto Medium 16px text, white che; Columns (dropdown trigger, 143px wide, white, border rgba(0,0,0,0.1), radius 4px, text Rob; Pagination: first («), prev (‹), 1 (active, bg #2F4086, text #F9F9F9), 2, 3, next (›), las; Rows per page select showing '10' (68x33px, white, border #D2D2D2, radius 5px, Roboto Medi; Notification bell (24px icon) with red #EF3F2E badge (15px circle, white 10px SemiBold tex; User menu (avatar 38px round + 'Admin' 13px #797474 / 'Kamal Hossain' 15px #555 Roboto Med
- Table **Allocation/Sanction List** — columns: SL | ID | Type | Fiscal Year | Date | Store Id | Item Id | Store Id | Ship/Base Id | Allocation Qty | Action
  - row actions: View (eye icon 18x15, fill #89C74A light green, 40x30 hit area); Active / Approve (check-circle icon 18px, fill #019204 green, 40x30 hit area, ra
  - status values: No status column; only value-color variation: #0E9F6E green 
  - features: Sort icon (double up/down arrows, 18px, stroke #282828) on every column except SL and Action; Per-column filter row directly under header: '--' text under SL and Action, a search input (border #DFDFDF, radius 6px, ; Header row bg #E3E8FF, bottom border #D1D6EB, text Roboto Medium 16px #3C3C3C tracking 0.5px, header px 20px; Table container border rgba(0,0,0,0.08), radius 8px, width 1498px; Zebra rows: row 1 & 3 bg #F5F7FF, row 2 bg white; row bottom border #E5E5E5; rows 48px tall; Cell text Roboto Medium 14px tracking 0.5px #4B5563; SL values 01/02/03; Columns 8-10 (Store Id, Ship/Base Id, Allocation Qty) placeholders drawn in green #0E9F6E ('-') in rows 1 & 3, and grey ; Columns chooser button ('Columns' with chevron) top-right of card; Pagination bar: 'Showing 1 to 10 or 11 results' (numbers SemiBold, text 14px #333 at 80% opacity), first/prev/1/2/3/next; Rows per page: label 'Rows per page' 14px #333 80% + select showing 10; Vertical scrollbar track drawn at right edge of body (7px wide, Group 6803)
- Modals/popups: Approve confirmation dialog (Sanction- Toast, node 209:6738) — opened from the green check-circle row action
- Notes: Layout: 1920x1080. Sidebar 325px wide, full height, bg = rgb(0,38,82) with a rgba(0,0,0,0.3) overlay (renders ~#001A39 dark navy); logo block 107px tall (navy crest logo 69x65 + 'Central Inventory' Poppins SemiBold 20px white / 'Management System' Poppins Medium 16px white). Sidebar menu items 40px tall, radius 6px, 18px icons, Roboto Regular 17px #DEDEDE (active parent #FDFBFB), chevron-right on expandable items; menu list width 295px, submenu width 280px. Sidebar top-level order as drawn: Dashboard, Configuration >, Item Management >, Ship/Base Management >, Inventory Management >, Allocation/Sanction v (expanded), Compilation/Verification >, Report >, User Management >. Header 80px tall, white, drop-shadow 0 0 2px rgba(0,0,0,0.15), px 20px. Body area (x=325..1919, y=82..1081) bg rgba(63,60,216,0.05) (very light lavender), content padded 24px/21px. Form card: header bar #E3E8FF (rounded top 6px, borders rgba(0,0,0,0.08)) + white body (border rgba(0,0,0,0.1), rounded bottom 8px, padding 24px, gap 30px) containing the #F9F8F8 field panel and a right-aligned button row (Clear All, Save; gap ~19px). List card: white, border rgba(0,0,0,0.1), radius 8px, padding 20px top / 30px bottom 

#### [modal] `209:6738` Sanction- Toast
- Title: Are you sure?
- Buttons: Yes (bg #1C3586, border 1px #7C91F2, radius 8px, 44px tall, px 25px, white Roboto Medium 1; Cancel (bg #A49C9C, border 1px #D1D5DB, radius 8px, 44px tall, px 20px, white Inter Medium
- Notes: Despite the layer name 'Toast', this is a centered confirmation dialog: 548x396 white panel, radius 8px, shadow 0 20px 24px rgba(0,0,0,0.08) (token D1), padding top 45px / bottom 50px / sides 20px, content centered vertically with 15px gap. Icon: white 12-point starburst/badge shape (~92x88px) with a soft drop shadow, overlaid with a blue check mark 35x27 fill #3F569E. Title 'Are you sure?' Roboto Medium 32px #575555 tracking 0.96px; subtitle 'You want to Approve this !' Roboto Regular 18px #474141; 25px gap to the button row (450px wide, buttons centered with 20px gap). Screenshot shows it over a dark grey overlay (canvas background), implying a dimmed backdrop. Triggered by the green check-circle 'Active/Approve' row action in the Allocation/Sanction List.

**Open questions from this section:**
- The table header lists 'Store Id' twice (columns 6 and 8) — column 8 is probably meant to be a different field (e.g. Store name / Sanction Qty). Confirm the intended header for the 8th column.
- Form field 'Type' is drawn as a plain text input with '-' placeholder, no dropdown chevron — is it a select (Allocation vs Sanction)? Options are not shown in the design.
- Fiscal Year and Date both use calendar/date-picker inputs — confirm Fiscal Year is a date/year picker rather than a select.
- Values in the last three data columns (Store Id / Ship/Base Id / Allocation Qty) are green (#0E9F6E) in rows 1 & 3 and grey (#ACACAC) in row 2 — meaning of this color state (e.g. approved vs pending) is not labeled.
- Both action icons are drawn on every row: eye = View, green check-circle = 'Active' (layer name) which triggers the 'You want to Approve this !' dialog. Confirm the semantics (Approve/Sanction) and whether the check icon should hide after approval.
- Pagination text reads 'Showing 1 to 10 or 11 results' — likely a typo for 'of'.
- The node named 'Sanction- Toast' is visually a centered confirmation modal, not a toast; no success toast after Yes is drawn.
- 'ID' field on the form is required — is it user-entered or auto-generated? Design shows an editable required text box.
- The Back button in the header is drawn at 50% opacity — disabled state or just styling?
- Filter row inputs have no placeholder text; only a search icon.
- Sidebar submenu items for other menus (Configuration: Office, Appointment, Rank, Country, Division, District, Upazila; Item Management: Create Item Category, Brand, Model, Create Item Unit, Create Item; Ship/Base Management: Create Ship/Base Category, Create Ship/Base; Inventory Management: Opening Stock, Store; User Management: User, Role Permission) exist in the component variants but are collap


### Section: Compilation/Verification screen + create-form body + Demand Back popup (Figma section 98:8103 "Compilation/Ver

#### [page] `107:8871` 01_Compilation/Verification- Compilation/Verification
- Breadcrumb: [Back] Compilation/Verification > Compilation/Verification (first crumb #585858 16px; last crumb #1C3586 15px; separator = thin chevron stroke #858687; Back button = 30px-high white pill, border #C5C5C5, radius 5, 14px a
- Title: Compilation/Verification List (card title, Roboto Medium 18 #3C3C3C)
- Sidebar: Compilation/Verification (expanded; parent row bg rgba(255,255,255,0.08), text #FDFBFB 17px, chevron rotated to point do — submenu ['Compilation/Verification (active submenu row: bg rgba(0,48,102,0.75), white 15px text, left orange indicator bar 3x20 #ED841A radius 10, row 280w x 40h padded-left 20)']
- Buttons: Back (header, 50% opacity); Columns; << (first page); < (prev page); 1 (active page); 2; 3; > (next page); >> (last page); 1-2 (page-jump box); Go; Rows per page: 10 (select); View (icon); Edit (icon); Back/Demand back (icon); Delete (icon); Bell notification (badge 11); User menu (Admin / Kamal Hossain)
- Table **Compilation/Verification List** — columns: SL | ID | Allocation Id | Approver | Action
  - row actions: View (eye icon, fill #89C74A green, 40x30 hit area); Edit (pencil icon, fill #1C3586 blue, 16px, 40x30 hit area radius tl/br 8); Back / Demand back (backward-arrow icon, fill #7C7D7D grey, 18px, 40x30 radius 8; Delete (trash icon, fill #CD3F32 red, 15x16, 40x30)
  - features: sort icon (two-arrow up/down, 18px, stroke #282828) on ID, Allocation Id, Approver; per-column filter row under header: SL cell '--', search inputs (border #DFDFDF radius 6 h36 p9, search icon 18px @50% o; 'Columns' chooser button top-right (white, border rgba(0,0,0,0.1), radius 4, 143x37, 'Columns' Roboto Medium 16 #3C3C3C ; pagination bar: 'Showing 1 to 10 or 11 results' (Roboto 14 #333 @80%, numbers SemiBold); buttons first(<<) prev(<) [1 ac; 'Rows per page' label + select showing '10' (68x33, border #D2D2D2 radius 5, Roboto Medium 15 #363333, arrow-down icon); zebra rows: odd rows bg #F5F7FF, even rows white; row height 48; border-bottom #E5E5E5; header row bg #E3E8FF, border-bottom #D1D6EB, text Roboto Medium 16 #3C3C3C tracking 0.5, radius top 6; table container 1498w, border rgba(0,0,0,0.08), radius 8; SL column fixed 60px, other 4 columns flex-equal (~349.5px eac; decorative vertical scrollbar at right of body: track #F2F2F2 7x454, thumb #DEDEDE 7x325
- Modals/popups: Group Demand back (209:6763) — see separate screen entry; Hidden layers present but not drawn: header 'Search' input (107:9240 hidden=true), floating 'Chatbox' button bottom-right (107:8875 hidden=true)
- Notes: Frame 1920x1080. Layout: sidebar 325px wide full height (bg = rgb(0,38,82) #002652 with a rgba(0,0,0,0.3) black overlay => effective ~#001A39); logo block 107px high (69x65 navy crest logo + 'Central Inventory' Poppins SemiBold 20 white / 'Management System' Poppins Medium 16 white); menu list starts at y=117, items 295w x 40h radius 6 gap 4, Roboto Regular 17 #DEDEDE tracking 0.17 with 18px icons at 75% opacity, chevron-down 24px at right for expandable items (Dashboard has none). Header: x=325, 1594x80 white, drop-shadow 0 0 2px rgba(0,0,0,0.15), px 20; right side bell (24px, stroke #555) with red badge (#EF3F2E, white stroke, 15px) '11' Roboto SemiBold 10 white, then user block (38px round avatar, 'Admin' Roboto Medium 13 #797474 above 'Kamal Hossain' Roboto Medium 15 #555). Body: x=325 y=82 1594x999, page bg = white + rgba(63,60,216,0.05) overlay (very light lavender ~#F7F7FD); content frame 1546x935 at (24,21) inside body. Card: white, border rgba(0,0,0,0.1), radius 8, padding 20/24/30/24, gap 40 between table block and pagination. Footer: y=1040 1594x40 white with same shadow, centered text Roboto Regular 15 #7E7E7E, 'CIMS' #4D4C4C, ' TotalOfftec.' #003066. Table cell text Ro

#### [component] `154:7039` Frame 2147224469 (create/edit form + list body, 1546x935)
- Breadcrumb: (none — body-only frame; no header/sidebar drawn)
- Title: Compilation/Verification (collapsible form panel header, Roboto Medium 20 #1C3586, preceded by a 24px chevron pointing right, stroke #4B5563)
- Sidebar: (not drawn in this frame — same page as 107:8871, so Compilation/Verification) — submenu []
- Form **Compilation/Verification (create form; internal Figma component name '(BN) Create Office A**:
  - ID [text] **required** placeholder=`-` — Row 1, left half (flex 1). Label Roboto Regular 14.55 #4C4C4C, red asterisk. Input 40px high, white, border 0.97px #D2D2D2, radius 4.85, px 10, placeholder Roboto Regular 13.58 #3A3A3A @50% opacity. Drawn as plain input;
  - Allocation Id [text] **required** placeholder=`-` — Row 1, right half (flex 1). Same styling as ID. Possibly a select of existing allocations — not indicated in design.
  - Approver [text] placeholder=`-` — Row 2, left half only (fixed 713px = half width), no required asterisk. Same input styling.
- Buttons: Clear All (bg #FFEFED, border 0.97px rgba(248,198,205,0.6), radius 8, h44, px20, text Robo; Save (bg #1C3586, radius 8, h44, px20, text Roboto Medium 16 white + check-circle icon whi; Columns; << < 1 2 3 > >> 1-2 Go; Rows per page 10; View / Edit / Delete row icons
- Table **Compilation/Verification List** — columns: SL | ID | Allocation Id | Approver | Action
  - row actions: View (eye, #89C74A); Edit (pencil, #1C3586); Delete (trash, #CD3F32)
  - features: identical table/pagination/columns-chooser to 107:8871 (sort icons on ID/Allocation Id/Approver, per-column search filte
- Notes: Frame 1546x935 with NO background fill (renders dark/transparent in screenshot) — it is the same size/position as the body content frame (107:8879) of the main screen, i.e. this is the page-body state when creating/editing an entry (form panel stacked above the list, vertical gap 30), not a floating modal. Form panel: header bar h53 bg #E3E8FF, border top/left/right rgba(0,0,0,0.08), radius top 6, px20 py15, gap 6; body white, border bottom/left/right rgba(0,0,0,0.1), radius bottom 8, p24, gap 30; inner fieldset bg #F9F8F8, border rgba(0,0,0,0.08), radius 6, p24, field rows gap 24, columns gap 24, label-to-input gap ~9.7. Buttons row right-aligned, gap ~19.4. The list card below is identical to the main screen except the Action column has 3 icons (no grey 'back' arrow).

#### [modal] `209:6763` Group Demand back
- Title: Demand Back
- Form **Demand Back**:
  - Comment [textarea] **required** placeholder=`-` — Label Inter SemiBold 14 #4B5563 with red asterisk. Textarea 450x91, white, border 1px #D1D5DB, radius 8, px20 py16, placeholder Inter Regular 16 #646C7A.
- Buttons: Cancel (outline: border #D1D5DB, radius 8, h44, px20, Inter Medium 16 #4B5563); Confirm (bg #4558AE, border 1px #7C91F2, radius 8, h44, px20, Roboto Medium 16 white); x close (24px, fill #9CA3AF, top-right)
- Modals/popups: This IS the popup: 500x287, white, radius 8, padding 20, drop shadow 0 20px 24px rgba(0,0,0,0.08); inner content width 450; title 'Demand Back' Inter SemiBold 14 #4B5563 with border-bottom rgba(0,0,0,0.1) and 10px bottom
- Notes: Meaning: presumably opened from the grey backward-arrow 'back' row action in the Compilation/Verification list (send/demand the record back to the previous stage with a mandatory Comment). No confirmation/toast for this action exists in the section. Uses Inter font + grey/Primary-600 tokens (#4B5563, #646C7A, #D1D5DB, #4558AE, #7C91F2, #9CA3AF) which differ from the Roboto/#1C3586 system used on the main screen.

**Open questions from this section:**
- No toast node exists in the Compilation/Verification Figma section (98:8103): its only children are the sidebar menu symbol 42:5277, the screen 107:8871, the form-body frame 154:7039 and the Demand back modal 209:6763. Toasts elsewhere in the file (209:6717 'Group-DemandItemToast' with text 'You want to cancel this demand!', 209:6738 'Sanction- Toast', 209:6701 'Group Demand Forwarded') belong to 
- 154:7039 ('popup 1546x935') is not a floating modal: it is a transparent body-content frame the exact size of the page body (create form panel stacked above the list). Confirm it is the in-page create/edit state (form appears above the list) rather than an overlay.
- Main screen list rows show 4 actions (View, Edit, grey Back arrow, Delete) while the list in 154:7039 shows only 3 (no Back arrow). Confirm which is intended, and under what condition the Back action appears.
- The grey backward-arrow row action is unlabeled; assumed to open the 'Demand Back' modal (Comment required, Cancel/Confirm). Confirm the mapping and what 'Demand Back' does (returns the compilation/verification record to the previous stage?).
- Pagination summary reads 'Showing 1 to 10 or 11 results' — 'or' is likely a typo for 'of'.
- All table cell values are '--' placeholders; real formats of ID / Allocation Id / Approver are unknown. Form inputs are drawn as plain text inputs with '-' placeholder — ID and Allocation Id may actually be selects/auto-generated; Approver may be a user select. Not indicated in the design.
- Header 'Back' button is drawn at 50% opacity — disabled state on this (top-level) screen, or just styling?
- Mock-data mismatch: Rows per page = 10 and 3 pages/11 results, but only 3 rows drawn.
- The '1-2' pagination box next to 'Go' — confirm it is a page-jump input (placeholder showing range) and 'Go' navigates to the typed page.
- Hidden layers in 107:8871: header 'Search' input (107:9240) and floating 'Chatbox' button (107:8875) are hidden=true — exclude from build unless requested.
- Sidebar: collapsed submenu components carry placeholder labels in their masters (Report → '1','2'; User Management → 'User','Role Permission'; Inventory Management → 'Store', ...); only the Compilation/Verification submenu is expanded/visible on this screen.
- Modal 209:6763 uses Inter font and a different primary (#4558AE / #7C91F2) than the Roboto/#1C3586 system of the main screen — confirm whether to normalize to the app theme.
