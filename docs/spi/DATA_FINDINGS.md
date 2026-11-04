# Data findings of the five sheets (Claude B, 2026-11-04)

These figures are recalculated from the sheets uploaded on 2026-11-04 and from `spi/db/spi.sqlite`. They are the same figures the pages show under "Figures and definitions" (`/api/ws/metrics`) and on the History and source data tab (`/api/ws/source`).

## FuncLoc list: 14,484 locations, no date field
- **Areas:** PX 12,994, PY 1,433, UT 57.
- **Criticality:**
  - C: 7,298.
  - A: 2,668.
  - B: 2,581.
  - S: 1,904.
  - Blank: 33.
- **Hierarchy:** it is only in the tag. PP-1807C-M is the motor of PP-1807C, PP-1830B-CSS is its switch station, and BF-108-QF21 is an item of furnace BF-108.

## Notif History: 5,795 notifications, 2 May 2025 to 30 Sep 2026
- **Date fields:** notification date, created on, required start, required end and completion. All five are charted on the History and source data tab of Maintenance.
- **Opening backlog:** May 2025 holds 1,463 notifications, against about 300 a month later. This is the backlog that was open when the extract started.
- **Open:** 1,305 are in progress; 533 of them are older than 180 days.
- **Completion:** median 41 days, Emergency 4 days. 33% to 41% of each priority finish after the required end date.
- **Types:**
  - N2 holds exactly the 135 Emergency notifications.
  - N1 has 3,871 and N3 has 1,788.
- **Concentration:**
  - "Leak from packing" (732) and "Replace lamp as per PM finding" (706) are 25% of all notifications.
  - 233 locations hold 40%.
  - Furnace BF-105 leads with 114.
- **Link to issues:** 16% of the issue lines link to a notification through the order number. Order types 2030, 2040 and 2090 never link.

## Mitem Mplan: 10,153 items, 3,823 plans, 5,785 locations
- **Cycles:** 28 cycle spellings for 23 real intervals. The pages group them by interval and keep the spellings in the breakdown.
- **Workload:** about 16,246 task occurrences per year.
- **Start of cycle:** dates run from 2015 to 2029. 597 items start before 2020 and 487 after the cut-off.
- **ABC indicator:** it equals the location criticality on every row.

## Movement Material: 17,518 issue lines, 1,930 materials, 6 May 2025 to 30 Sep 2026
- **Units:** ten units of measure. Quantities are never added across units on any B page.
- **Campaign:** Nov 2025 to Jan 2026 has 2.84 times the issue lines of a normal month.
- **Demand pattern:** 1,220 materials are issued in one month only, and 47 in every month.
- **Concentration:** 89 of 1,015 priced materials make 80% of the value issued.
- **Value issued:** IDR 258.3 bn, at the last purchase unit price (Estimate).

## PR PO: 11,609 rows, of which 5,420 are exact copies (6,189 distinct lines)
- **Duplicates:** every B figure counts each PR, PR item, PO and PO item line once (view `pol`).
- **PO-Item Amount is a unit price.** It stays the same on lines of very different quantity.
  - Purchase value is **IDR 1,634 bn**: PR quantity x unit price, IDR lines.
  - The same part's price varies by only about 1.1 times. Reading the amount as a line total suggested up to 5 times, which was wrong.
- **Lead time:** median 41 days, 9 in 10 within 155 days.
  - By PR type: PR01 111 days and PR05 90 days, against PR03 37 days and PR06 40 days.
- **Late deliveries:** 60% of the lines are due after the PR requested date.
- **Open lines:** 766 distinct lines are open after the cut-off, worth IDR 199 bn.
- **Suppliers:** 124, the top 5 hold 27% of the lines.
- **Bought against used:**
  - 900 issued materials were never bought in the period.
  - 220 materials were bought and never issued.
  - 355 materials were bought at more than twice their use.

## Fixed on the site
- Purchase value was read two ways, as a line total (suppliers, history) and as a unit price. It is now a unit price everywhere.
- Repeated PR PO rows are counted once.
- Cycles are grouped by interval.
- The May 2025 opening backlog is marked.
- The stockout risk list is valued per part (chance x downtime cost) instead of one flat assumption.
- Figures that differ between pages are explained in the definitions drawer.
