# DSIG Requirements Summary — "BN Communication Equipment Database Software"

Source: `files_given_by_client/CIMS_Requiremnets_DSIG.pdf` (10 scanned pages, RESTRICTED). Tender specification from the **Directorate of Signals (D SIG)**, revised 01/11/26, signed SO(IT) Asaduzzaman, for DNIT.
D SIG owns both **radio/communication equipment** (Module 1) and the Navy's **telephone systems — PABX + intercom** (Module 2). That is why "PABX" appears: it is the same inventory requirement set applied to telephone-exchange equipment. Both modules have identical structure.

## What is IN scope for CIMS from this document (absorbed as generic features / later phase)
- **Dashboard** with bar/pie charts: item counts by area (Dhaka / Chattogram / Khulna) and by **functional status: Operational, Non-Operational, Defect, Survey, Obsolete** (+ procurement items). "More charts as per requirement."
- **Real org structure**: System Administrator (NHQ Dhaka); Admin Authorities under the three commands **COMDHAKA** (HM, COMCEN DKA, SKM, PAGLA, SHAHEEN BAG), **COMCHIT** (IK, COMCEN CTG, BN FLEET HQ, BNA, AVIATION, NVK, ULKA, BTY, SM, COX'S BAZAR, SHEIKH HASINA, VASANCHAR, PEKUA, CANUA, ST MARTINS), **COMKHUL** (TMR, MNG, COMFLOTWEST MSO, SOLAM, SEB, HIRON POINT, JALKHATI, MNG R-SHOP); depots **CSD** (+ Dockyard Radio Shop), **NSD** CTG / KLN / DK; **all ships**; (PABX) all **Tel Exchanges** (Dhaka: NHQ, SKM, Shaheen Bag, Pagla · CTG: IK, BNA, Aviation, ULKA, NVK, Love Lane, BTY, SM, Cox's Bazar, Sheikh Hasina · KLN: TMR, SOLAM, MNG, SEB). Network: central BN Server; ~190 users (ships at harbour 130, COMCHIT 20, COMKHUL 15, D SIG 10, CSD/MNG 6, COMDHAKA 5, NSD 4).
- **Rights/Access matrix** per role × data area (Items info / Procurement / Stock / User Log / Advance search) with Read/Write/Update/Delete granularity — e.g. NSD depots full RWUD on Stock only; ships read-only; User Log only for admins. → CIMS role-permission matrix must be able to express this.
- **Item information**: name, type, power output (comm) / server line capacity (PABX), brand, model, country of origin, country of manufacture, OEM, procurement year, **year of manufacture**, local supplier, principal, **unit price**, **upload configuration document**. Many "(Dynamic Field)" = growing dropdown lists.
- **Stock management**: equipment + **spares**; stock **sources: Procurement / From Ships / Ex-Bhatiary**; **Update (Input/Output)** = stock in/out movements; **notifications when stock under limit range**.
- **Manufacturer info** (country, OEM, year, address, unit price, multiple attachments) and **Supplier info** (name & address, contract number, experience, license).
- **Monitoring User Action** — view last log of any action (create/delete...) by users → audit log.
- **Advance search** across equipment states/counts and spares.
- **Reports**: items by category per Ship/Base/Forward base; by functional status; by Area/Command/Ship (or Exchange); by brand/category; procured items by financial year (e.g. 21-22); item detail with **allocation/re-allocation history, defect/repair history, notes/remarks, supplier details**; (PABX) all systems with maintenance-bill info. All **printable + exportable to Word/Excel/PDF**.
- **Functionalities**: allocation/re-allocation to Ships / Estbs / Forward bases (Exchanges); **authorized allocation as per TO&E** (first-time entry of entitled holdings per ship/estb → compare actual vs authorized); **shortage calculation/analysis** with notifications (NSD stock shortage; item demands from ships/estbs/fwd bases); **database backup from the app** to a chosen location/file name.
- **Scope of works** (contractual, for the PM): system study of the existing BN Server; SRS approval cycle; install/test on existing BN server hardware (Linux DB mentioned); technical + user manuals; training all users; data-entry support; DB diagram + **source code on CD and printed**; 2-year warranty support; access control & data sharing facility.

## What is OUT of scope for CIMS (belongs to the procurement vendor / BNPIMS)
Procurement entry with budget code (financial year, budget code, budget allocation, expenditure, remaining balance), automatic budget forecasting, purchase plans / "present status of purchase", procurement document upload. CIMS only **displays procurement item info read-only via the BNPIMS API** (the DSIG access matrix itself marks Procurement as "Read" for almost every role).

## Impact on CIMS design (recorded decisions)
- Item model gets room for status lifecycle (`functional_status`) and richer attributes (year of manufacture, unit price, documents) — schema fields exist as nullable; UI exposes only Figma fields in phase 1.
- Stock ledger (`stock_transactions`) with `source` supports Procurement / From Ships / Ex-Bhatiary later.
- Audit log + notifications + xlsx export are first-class from phase 1.
- TO&E authorized allocation, shortage analysis, DB backup from UI, Word/PDF export → **phase 5 backlog** (`docs/08-open-questions.md`).
