# The data (synthetic baseline for CALIBER 2026), joins and known problems

Files are in `spi/data/raw/` (never edit). Diagram: `spi/data/raw/Data Context & Relationship Diagram.pdf`. If the human delivers an integrated spreadsheet it goes to `spi/data/integrated/` and Claude A adapts the ETL; the six raw files stay the reference.
Data cut-off: last record 2026-09-30. Everything "future" (next 12 months) is counted from there (`meta.data_cutoff`).

## Tables and joins
| File | Rows | One row is | Key |
|---|---|---|---|
| FuncLoc list | 14,484 | a functional location: site, system, equipment, instrument, line. Has criticality S, A, B, C (33 blank) | Functional Location |
| BoM | 20,653 | one material installed at one location, with Installed Qty, Min, Max, **Stock** (material level, same for every location), MRP Type | Functional Loc. + Material No |
| Movement Material | 17,518 | one issue transaction (all are 'Issue'), 2025-05-06 to 2026-09-30 | Material Number, Order |
| Notif History | 5,795 | one maintenance notification (N1, N2, N3, N6), priority Low, Medium, High, Emergency | Notification, Order, Functional Location |
| Mitem & Mplan | 10,153 | one planned maintenance item with cycle text ('5 YEARLY') and Start of cycle (2015 to 2029) | Maintenance Item, Functional Location |
| PR PO | 11,609 | one PR item linked to one PO item: dates, qty, supplier, amount, currency | Purchase Requisition + PR-Item, PR-Material |
Joins: FuncLoc to BoM, Notif, Mitem by location (1:N). BoM to Movement and to PR PO by material number. Notif to Movement by Order. Mitem to BoM only indirectly through the location (Mitem has no parts).

## Numbers we know (computed on the raw files, rounded)
- 7,481 BoM materials on 4,516 locations. Only **1,930 ever had an issue** (74% never moved). 1,475 of those have 2 or fewer active months; only 166 have 12 or more. History is 17 months. **Demand is overwhelmingly intermittent. No seasonality can be claimed (needs 24 months).**
- BoM rows: stock above Max 8,856, below Min 1,641, zero stock 5,687. Of 3,656 stock items, 2,492 never moved.
- Lead time (PR date to PO delivery): median 42 days, mean 71, p75 81, max 829. 6 negative, 201 above 365 days.
- 11,511 of 11,609 PO lines are IDR (JPY 41, USD 35, EUR 20, SGD 2). PO-Item Amount does NOT scale with PR quantity (within a material the log-log slope is 0.001, correlation 0.02 over 350 materials), so it is read as a UNIT price. Range 302 IDR to about 893 million IDR per unit: treat as estimate, flag zeros.
- Rough stock value IDR 356 bn on the 1,250 parts that have a purchase price; about IDR 317 bn of it above Max. **Label as estimate.**
- Only about 16% of issue transactions link to a notification through Order. The failure link is weak: attribute demand to equipment through BoM, the `FOR <tag>` text in descriptions and the order link, and say which source was used.
- Plant: a cracker complex. Systems S01 cracked gas compression, S02 drying, S03 condensate stripping, S04 caustic scrubbing, S05 quench and dilution steam, S06 fuel gas, S07 hydrogen recovery, S08 ethylene refrigeration, S09 propylene refrigeration, S10 steam generation, S11 flare, and further sites (PY cold section and others). Equipment prefixes by count: TEL 1315, PP 1235 (pumps), PGI 1033, PIT, PRV, FIT, FCV, BF 426 (cracking furnaces), HE 424 (heat exchangers), TIT, LIT, SDV, PCV, ROF, LCV, DPT, JBX, TCV, VD, KC 174 (compressors), MOV, CL, KT 14 (steam turbines for KC drivers, 170 to 230 parts each).
- Descriptions are structured: `BEARING,BALL,ANGULAR,NU319BDB`, `GASKET,RING,8IN,600#,GRAPHITE`, `TEE,8IN,SCH40,A105,SW`, and OEM parts `SEAL,LABYRINTH,DWG.108-6739,FOR KT-264A`. About 6% carry a pressure class and about 7% an ASTM grade. Many name the equipment tag after `FOR`.

## Known data problems (the ETL logs each in `dq_issue`, the app shows them on the Data page)
duplicate BoM rows (230), negative and over-long lead times, zero or absurd unit prices, mixed currencies, stock held at material level but listed under every location, PO delivery dates up to 2028, 33 locations without criticality, maintenance cycle text in several spellings ('YEARLY', 'Yearly', '1 YEARLY'), cycle starts back to 2015, Non Stock materials that still have stock, stock items without any consumption. Rule: **never silently drop or fix a record. Flag it, state the rule used, count it.**

## Derived layer
See `spi/db/schema.sql`: `part_profile` (one row per part with every feature the AI and the engine need), `demand_month`, `part_equipment`, `spec_family`, `equipment_set`, `dq_issue`, `eval_case`.
