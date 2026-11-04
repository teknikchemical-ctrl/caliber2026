# Claude B round 7 plan: data re-analysis and overhaul of Inventory, Maintenance, Forecasting and Costs (waiting for owner approval)

Source: the five sheets uploaded on 2026-11-04 (FuncLoc list, Mitem Mplan, Movement Material, Notif History, PR PO). The BoM sheet (stock, Min, Max, installed quantity) was not in this upload; it stays the source of stock figures.

## 1. What the sheets say

### FuncLoc list (14,484 locations)
- **Areas:**
  - PX: 12,994 locations.
  - PY: 1,433.
  - UT: 57.
- **Criticality:**
  - C: 7,298 (50%).
  - A: 2,668.
  - B: 2,581.
  - S: 1,904.
  - Blank: 33.
- **Largest classes:**
  - Instruments: TEL 1,408, PGI 1,120, PIT 600, FIT 560, TIT 450, LIT 450, DPT 300.
  - Pumps (PP): 1,319.
  - Relief valves (PRV): 620.
  - Control valves: FCV 470, PCV 330, LCV 330, TCV 260.
  - Exchangers (HE): 459.
  - Furnaces and their items (BF): 426.
  - Shutdown valves (SDV): 420.
  - Orifices (ROF): 320.
  - Junction boxes (JBX): 300.
  - Vessels (VD): 267.
  - Compressors (KC): 180.
  - Motor valves (MOV): 80.
  - Columns (CL): 68.
  - Turbines (KT): 14.
- **Hierarchy is in the tag, not in a parent column.** Examples: PP-1807C-M is the motor of PP-1807C, and BF-108-QF21 is an item of furnace BF-108.

### Notif History (5,795 notifications, 2 May 2025 to 30 Sep 2026)
- **Types:**
  - N1: 3,871.
  - N3: 1,788.
  - N2: 135, which is exactly the Emergency notifications.
  - N6: 1.
- **Priority:**
  - Medium: 3,581.
  - Low: 1,669.
  - High: 410.
  - Emergency: 135.
- **Status:** 1,305 are still in progress (22.5%), and 533 of them are older than 180 days.
- **Completion time:**
  - Median 41 days overall.
  - Emergency median 4 days.
  - 33% to 41% of each priority finish after the required end date.
- **Opening spike:** May 2025 has 1,463 notifications, against 250 to 390 in later months. This looks like the opening backlog of the extract and must be labelled, not read as a trend.
- **Trends:**
  - Emergency clusters in Oct to Nov 2025 (38) and Mar to Apr 2026 (35).
  - Monthly totals rise from Jul 2026 (Sep 2026: 388).
- **Concentration:**
  - Two texts are 25% of all notifications: "Leak from packing" 732 and "Replace lamp as per PM finding" 706.
  - 233 locations hold 40% of all notifications.
  - The fired heaters lead, with BF-105 at 114.
  - 394 notifications are booked on site level, with no equipment.
- **By class:**
  - PP: 1,138.
  - BF: 724.
  - HE: 503.
  - KC: 431.
  - FCV: 259.
- **By location criticality:**
  - A: 2,098.
  - C: 1,289.
  - B: 1,158.
  - S: 856.
  - Blank or site level: 394.
- **Orders:** 90% of notifications carry an order. 1,003 of those orders also appear in Movement Material, which is what links notifications to part use.

### Mitem Mplan (10,153 maintenance items, 3,823 plans, 5,785 locations)
- **Task types:** 51 texts. The largest are calibration, thickness measurement, external piping inspection, element verification, SIL tests and the control valve final element set.
- **Cycle spellings:** 28 different spellings for about 16 real intervals, for example "YEARLY", "Yearly", "1 YEARLY" and "12 MONTHLY". The site shows them as separate cycles today, which is wrong.
- **Workload:** about 16,240 task occurrences per year.
  - By criticality: S 2,662, A 5,627, B 4,162, C 3,790.
  - The 5-yearly cycle is 37% of the items.
- **Start of cycle:** dates run from 2015 to 2029. 597 items start before 2020 and 487 start after the data cut-off.
- **ABC indicator:** it equals the location criticality in 100% of the rows, so it is not separate information.

### Movement Material (17,518 issue lines, 1,930 materials, 4,884 orders, 6 May 2025 to 30 Sep 2026)
- **Mixed units:** EA, KG, RL, LG, SET, L, CAN, M, SHT and ASS. **Adding quantities across units is meaningless**, and the site does it today (for example "1,226,950 units issued").
- **Campaign:**
  - Nov 2025 to Jan 2026 has **2.84 times** the issue lines of the other months.
  - The issue value peaks in Dec 2025, at IDR 6.5 bn with the price from PR PO.
- **Intermittent demand:**
  - 63% of materials are issued in only one month.
  - Only 47 materials are issued in every month.
- **Concentration:** 153 materials make 80% of the issue value.
- **Link to notifications:** 16% of issue lines link to a notification through the order. Order prefixes 2030, 2040 and 2090 never link, so they are other order types.
  - Of the linked lines: Medium 1,783, Low 837, High 212, Emergency 19.

### PR PO (11,609 lines, 4,805 PRs, 1,792 POs, 124 suppliers, PR dates 4 May 2025 to 22 Sep 2026)
- **PO-Item Amount behaves as a unit price.** The same studbolt costs about IDR 60,000 on lines of 1,557 to 4,776 pieces.
  - Read that way, the purchase value is **IDR 3,144 bn**.
  - Read as a line total it is IDR 168.8 bn.
  - The site uses both readings in different places: suppliers show 168.8 bn, while the planner, Optimized Scenario and costs use the amount as a unit price.
- **Lead time:**
  - Median 42 days, middle half 24 to 81 days.
  - By PR type: PR01 111 days, PR05 90 days, PR03 37 days, PR06 40 days.
- **Delivery against the requested date:** 60.6% of lines arrive after the PR requested date, with a median slip of 3 days.
- **Open orders:** 1,467 PO lines are due after the cut-off.
- **Suppliers:** the top 5 hold 27% of the lines. The median lead time ranges from 19 days to 95 days by supplier.
- **Price spread:** prices for the same material vary by up to 5 times.
- **Other currencies:** 98 lines are in JPY, USD, EUR or SGD.
- **Data errors:** 6 lines are delivered before the PR date.
- **Purchases against issues:**
  - The median material is bought at 3 times its issued quantity.
  - 639 materials are bought at more than twice their use.
  - 900 issued materials were never purchased in the period.
  - 220 materials were purchased and never issued.
- **Unused fields:** PR type and purchasing group (19 groups) are not used anywhere on the site.

## 2. Where the site does not show the data accurately
1. **Quantities are summed across units.**
2. **Purchase value is read two ways** (IDR 168.8 bn and IDR 3,144 bn).
3. **The same figure has several values on different pages:**
   - Stock value: 616.6 bn (costs calculator), 430.3 bn (average stock in the impacts), about 990 bn (Monte Carlo stock value).
   - Stockouts per year: 1,581 and 1,366.
   - Shortages: 504 on the stock view against 273 and 699 elsewhere.
   - Cost reduction: IDR 160.6 bn per year against IDR 43.4 bn per year.
4. **Cycle spellings are not normalised**, so "Occurrences by cycle" lists duplicates.
5. **The May 2025 opening backlog is not marked.**
6. **The stockout risk list shows the same IDR 150 mn for every part.** That is the downtime assumption, not part data.
7. **Several fields are never shown:**
   - Notification type meaning, and required start and end dates against completion.
   - PR type, purchasing group and requested date against delivery.
   - The order link of issues to notifications.
   - Price spread by material.
   - Purchases against issues.
   - Open orders after the cut-off.
   - Plan start dates and their age.

## 3. Plan

### A. One metrics register (B, `server/ws/metrics.mjs`)
- Every headline figure has one definition, one unit and one source, and every page reads it from there.
- A "Definitions" drawer on each page lists the figures shown, how each is calculated and its basis.
- Quantities are always shown per unit of measure, or as value in IDR, never summed across units.
- PO-Item Amount is read as a unit price everywhere. The decision is recorded in the register and shown under each purchase figure.

### B. A "Source data" subtab in each of the four tabs
Each sheet gets one page in the tab it feeds, built the same way:
- record count;
- period;
- completeness;
- the monthly trend;
- the top items;
- breakdowns by every field;
- the data quality flags;
- a sample of raw rows behind a toggle.

The pages per tab:
- **Maintenance:** Notifications, Maintenance plan, FuncLoc list.
- **Inventory:** Movement Material, plus BoM from the database.
- **Costs:** PR PO.
- **Forecasting:** issue history against forecast, with a backtest.

### C. Charts rebuilt per tab (all with hover value, unit and basis)

**Maintenance**
- Notifications per month by priority, with the opening backlog marked.
- The backlog curve with an age profile (0 to 30, 30 to 90, 90 to 180, over 180 days).
- Completion time against the required end, by priority.
- The bad actors: top locations and top texts, as a Pareto.
- Notifications per class and criticality, as a heat map.
- Plan workload per month by normalised cycle and by task type.
- Plan against notifications on the same locations.
- Parts issued on notification orders, by priority.

**Inventory**
- Issues per month by unit and by value.
- Campaign months marked.
- Demand pattern counts, with an example part for each pattern.
- Pareto by value.
- Bought against used, per material (more than 2 times; never bought; never used).
- Stock against Min, Max and need, by criticality, from the BoM.

**Costs**
- Purchase value per month, by PR type and by purchasing group.
- Lead time distribution by PR type.
- Delivered against requested date (slip distribution).
- Open orders after the cut-off, by due month.
- Price spread for the same material.
- Supplier concentration.
- Holding, shortage and emergency cost, all from the register.

**Forecasting**
- History against the learned forecast, with a backtest of the last 6 months and the error as a figure (from Claude A).
- Monte Carlo range.
- Forecast error by demand pattern.

### D. Easier to read (from the user test in section 4)
- **The answer comes first.** Each landing view opens with 3 plain questions, each answered by one figure and one chart. Inputs collapse to a one-line summary after the first run.
- **At most 4 charts per screen**, each with a one-line takeaway written from the data, for example "Nov 2025 to Jan 2026 used 2.8 times a normal month".
- **Fewer tabs** (needs Claude A, who owns the hub file):
  - Inventory goes from 10 tabs to 5: Optimized Scenario, Planner, Stock, Suppliers, Source data. Find, Registers, Documents and log, Locations and equipment, and Part types move into Source data or the search.
  - Forecasting keeps a single landing view instead of Timeline plus Optimized Scenario.
- **Glossary on hover** for N1, N2, N3, PR types, ABC, Min, Max, reorder point and service level.
- **One colour meaning across the site:**
  - red: short or late;
  - amber: watch;
  - green: within policy or saving;
  - purple: forecast;
  - grey: history.

### E. Tests and docs
- Chain test steps:
  - every figure in the register shows the same value on every page that shows it;
  - no chart sums quantities across units;
  - a hover readout on every chart;
  - each Source data page loads.
- `docs/spi/DATA_FINDINGS.md`: the findings above, with the numbers.

### Needs from Claude A
- The tab list in spi_hub.js.
- The backtest in /api/data/golden.
- An AI box that adds insight instead of repeating the figures already on the page.
- The assistant reads the same metrics register.
