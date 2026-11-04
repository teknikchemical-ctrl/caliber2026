# Plan: economics, cost projection and inventory features (written by Claude A, 4 Nov 2026)

Status: PLAN. Build order at the end. Owners follow `docs/spi/agents/*`. Rule for every item: every figure is an Estimate with its source; no downtime or emergency saving is counted unless it is an explicit, labelled scenario input; S and A parts are never auto-released; insurance spares stay.

## 1. What the data supports (tested on the baseline data)
- **No rush-order price premium.** Unit price per part is the same in every lead-time band and purchase type (relative price 1.00). So no claim from avoided emergency buying. The value of readiness is avoided downtime risk, shown only as a labelled scenario.
- **No price-spread saving.** Unit price varies about 2% per part.
- **Purchase value does not match consumption.** PO lines total about IDR 3.1 tn (unit price x quantity, 17 months) against IDR 258 bn of issued value and IDR 617 bn of stock. Do not base any saving on PO spend; report it as a data finding.
- **Capital sits in critical, long-lead parts.** S and A parts with procurement lead time above 90 days hold about IDR 413 bn of stock.
- **Supplier concentration:** top 5 suppliers carry 67% of spend; their median lead times run 26 to 62 days. Purchase types PR01, PR05, PR04 have median lead times of 108, 89 and 59 days against about 40 for PR03 and PR06.
- **Spec-family pooling is small** (74 families, IDR 2.4 bn of stock): not a feature.
- Procurement lead time is a **proxy** (PR date to PO delivery date, not goods receipt). Criticality order S, A, B, C is **assumed** (not defined in the data). Open orders and backorders are not supplied.

## 2. Features
| # | Feature | Question | Owner | Source |
|---|---|---|---|---|
| E1 | **Cost-risk frontier**: total cost (holding + ordering + expected stockout exposure) against stock level by criticality, today's position marked | How much stock is the right amount? | Claude B (Scenario page) | engine `/api/engine/simulate` |
| E2 | **Campaign readiness gap**: critical parts whose campaign demand exceeds stock, with order quantity and cost | What to hold before the next maintenance load, and what does it cost? | Claude A | engine forecast + `spi/drivers/campaign.mjs` |
| E3 | **Capital waterfall**: priced stock, insurance spares kept, S and A for review, B and C releasable, released over 3 years | Where is the capital and how much can move? | Codex Fin (Impact page) | `/api/data/savings` (mutually exclusive categories) |
| E4 | **Two programmes shown separately**: low-risk cleanup (IDR 14.7 bn gross) and availability programme (about IDR 241 bn replenishment against 139 bn reduction ceiling) | Savings project or funding decision? | Codex Fin | engine report |
| E5 | **Purchase plan and cash timeline**: recommended orders by order-by month against capital released | When does money go out and come in? | Codex Fin batch, Claude A endpoint | `results.sqlite` |
| E6 | **Lead time and supplier lever**: lead time by supplier and purchase type, long-lead critical parts, "cut lead time by 20%" effect on safety stock | What does faster supply save? | Claude A | SQL + engine |
| E7 | **Insurance spare register**: each protected part with lead time, equipment and review date | Why do we keep this stock? | Claude A | SQL |
| E8 | **Data cleanup value**: Non Stock items holding stock, Max of zero, missing Min and Max | What does cleaning the master data release? | Claude A | SQL |
Cut order if time runs short: E8, E7, E6. Features E1 to E5 carry the story.

## 3. Features from the CALIBER Inventory Calculation Workbook
File: `spi/data/reference/CALIBER_Inventory_Calculation_Workbook.xlsx` (sheets: START HERE, Settings, Pilot 50, Monthly Demand, All Materials, Data Dictionary, Test Plan). It is an independent, transparent baseline: ROP = ROUNDUP(mean monthly demand x lead days / 30.4375 + safety stock), Max = MAX(ROP, ROUNDUP(ROP + one review period of demand)), inventory position = on-hand only, order quantity = Max minus position when position is at or below ROP, defaults lead 60 days and safety stock 2 units. **Reconciliation:** `python3.13 tests/spi_workbook_check.py` shows our database equals the workbook for all 7,481 materials on on-hand, Min, Max, issue events, total issued, active months, locations, ADI, CV2 and demand class. (CV2 uses the sample variance in the workbook and the engine; the import now does the same.)

| # | Feature | Why it helps | Owner |
|---|---|---|---|
| W1 | **Three-way policy comparison**: current Min and Max, the workbook's simple baseline, our dynamic policy, replayed over the 17 months (stock held, stockouts, orders, service level achieved). The workbook's own test plan says: claim savings only after an out-of-sample simulation | The proof that dynamic beats both the status quo and a naive formula | Codex Fin (replay) + page by Claude B |
| W2 | **Show your work worksheet** (Pilot 50 style): for any part, the calculation chain step by step (demand over lead time, ROP, Max, position, order quantity, excess) with our engine's numbers beside it, and **editable assumption cells** (lead days, safety stock, review period, service target) that recalculate live | Transparency for the judges; mirrors the yellow cells of the workbook | Claude A (Forecast page panel) |
| W3 | **Export calculation worksheet** (CSV or Excel) with the workbook's columns for the selected parts | Judges can audit in Excel | Claude A |
| W4 | **Validation page**: the workbook's 12 test-plan rows with live status and evidence (raw integrity, double-count prevention, demand aggregation, classification, backtest, proxy labelled, inventory position proxy flagged, criticality order flagged, PM not assumed to replace BoM parts, reorder arithmetic, scalability, business impact only after out-of-sample) | Shows quality and honesty; part of the data architecture slide | Claude A |
| W5 | **Pilot portfolio**: the same 50 pilot parts as the workbook (balanced across demand classes) as the demo list on every page | Judges can match our numbers to theirs | Claude A |
| W6 | **Limitations panel** drawn from the Data Dictionary cautions (proxy lead time, assumed criticality order, on-hand-only position, zero demand is not zero need) | Prevents over-claiming | Claude A (done in the data quality log; add to pages) |

## 4. Rules that come from the workbook (adopted)
Do not sum BoM stock across locations (stock is per material). Do not call the PO proxy a delivery lead time. Do not treat maintenance items or notifications as known material requirements. Do not approve purchases from an on-hand-only position. State that S, A, B, C order is assumed. Claim savings only after out-of-sample simulation.

## 5. Order of work (about 10 hours left)
1. Now: this document, workbook reconciliation (done), data quality rows for the three cautions (done).
2. On Codex Fin's push: merge, run all checks, then E3 and E4 (Fin), E1 (B), E5 (Fin and A).
3. Claude A: E2 and W2 first (highest value), then W4 and E6, then W3, W5, E7, E8 if time.
4. Final 3 hours: freeze, full checks, deploy, zip, screenshot.
