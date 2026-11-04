# Plan for owner approval: rebuild Inventory, Maintenance, Forecasting and Simulation, Costs (Claude B)

Status: approved by the owner with changes (Forecasting and Simulation = replenishment and cost-effect simulator plus cost-risk scenarios). Built: see docs/spi/WS_TOOLS.md.
Rule for every view: no static infographic. Each view = an input panel (what the user wants to see or try) + outputs that recalculate from the inputs. Every figure says its basis: Data (from spi.sqlite), Estimate (calculated), Assumption (a default the user can change).

## 1. What the six files give (re-checked today in spi/db/spi.sqlite)
| Source file | Table | Rows | What it allows | What it does not have |
|---|---|---|---|---|
| FuncLoc list | funcloc | 14,484 locations, criticality S A B C | hierarchy by tag, class (PP, BF, HE, KC, LINE, FCV ...) | coordinates, process links |
| BoM | bom, part_equipment | 20,423 rows, 7,481 parts | installed population per part and location, stock, Min, Max snapshot | stock history |
| Mitem & Mplan | maint_item | 10,153 items, 3,823 plans, 5,785 locations | cycle (5 yearly to monthly), start of cycle, next due (calculated), ABC, priority. 5,454 items due in the next 12 months (1,123 in Oct 2026) | task duration, parts per task |
| Notif History | notification | 5,795, May 2025 to Sep 2026 | type N1 3,871, N3 1,788, N2 135; priority Emergency 135, High 410, Medium 3,581, Low 1,669; 1,305 still in progress; dates created, required start and end, completed (mean 61 days to complete); order number on 5,242 | downtime hours, failure code, cost |
| Movement Material | movement, demand_month | 17,518 issues | demand per part and month, 17 months; 2,791 issues link to a notification through the order | receipts |
| PR PO | po_line | 11,609 lines, 124 suppliers | lead time proxy (PR date to PO delivery, mean 71 days), unit price proxy, supplier | |

Demand classes (Syntetos-Boylan): no demand 5,551, single event 1,220, intermittent 336, lumpy 231, erratic 116, smooth 27.
Not in the data, so it becomes an editable Assumption, never a hidden number: downtime cost per hour, hours lost per stockout, emergency purchase premium, carrying rate, parts used per maintenance task.
`Maintenance History (All Equipment).xlsx` in the repo root is from the first plant case (TJC-LLD tags, interlocks). It is not used.

## 2. Foundation built first (shared by all four tabs)
1. **Workspace endpoints** `server/ws/*.mjs` (new area, read-only SQL on spi.sqlite plus the existing engine): `ws/notifications`, `ws/notification/<no>`, `ws/plan`, `ws/plan-calendar`, `ws/kit`, `ws/reliability`, `ws/series` (monthly demand, receipts, lead-time samples for a scope), `ws/policy`, `ws/simulate`, `ws/costs`, `ws/decisions-rules`. Each takes one typed input object and returns `{inputs, outputs, figures:[{id,label,value,unit,basis}], sources:[table and query id]}`.
2. **One scenario object** (`spi/contracts/ws_scenario.schema.json`): scope filters, demand multiplier by class and month, campaign months, failure-rate uplift, lead-time source and supplier delay days, service level by criticality, carrying rate, downtime cost per hour by criticality, hours lost per stockout by class, emergency premium, budget cap. Every view reads it, the user edits it in a side drawer that stays open across views, saves named scenarios (A, B, C) and compares them.
3. **AI-ready by design**: each endpoint is registered as a tool with the same JSON schema (`ws.notifications.query`, `ws.policy.design`, `ws.simulate.run`, ...). The AI sets inputs, runs, reads `figures` and `sources`. Pages and AI read the same payload, so text and charts cannot disagree.
4. **Storage**: all data from SQLite. The Vercel database is read only, so user scenarios and decisions are kept in the browser (IndexedDB) and exported as JSON or CSV. The schema of a writable store is ready (`spi/db/schema_ws.sql`: ws_scenario, ws_decision, ws_note); the local dev server writes it to SQLite. A hosted writable SQLite (Turso or similar) is a switch, not a rebuild.

## 3. Inventory
| View | Inputs | Outputs |
|---|---|---|
| I1 Stock (exists, extend) | category, criticality, item type, family, supplier, demand class, min value, sort | part list with stock bar against Min and Max, totals for the filter, select parts and send them to the decision list, export |
| I2 Part workbench (new) | any part (search), edit Min, Max, lead time, service level | reconstructed stock path of the last 17 months (stock now plus issues minus PO deliveries, Estimate), replay of the 17 months with the edited Min and Max: stockouts, days short, average stock, orders; installed population, where used (explorer), purchase history, family substitutes |
| I3 Locations (rebuild) | class, criticality, system, has open work, parts at zero, text | location list with parts, stock value, open notifications, next PM; row opens the explorer |
| I4 Find and Part types | stays, merged into one view | |

## 4. Maintenance (full history and full plan)
| View | Inputs | Outputs |
|---|---|---|
| M1 Notification history (all 5,795) | date range, type, priority, status, class, criticality, system, location, text, overdue only | monthly timeline stacked by priority, counts, server-paged full table; a row opens the record: all dates, days to complete, overdue flag, order, parts issued on that order with value (movement join), location in the explorer |
| M2 Maintenance plan (all 10,153 items) | ABC, priority, cycle, class, location, horizon 3 to 36 months, due window | calendar of due tasks by month and class (every occurrence in the horizon, not only the next one), item list with last start, cycle, next due; item opens its location kit |
| M3 Shutdown and work-pack builder | time window or a list of plans, class, criticality, parts per task factor by item type (Assumption, editable), include open notifications | parts kit: required quantity, stock, open PO, shortage, order-by date from lead time, cost; untick lines; export the kit |
| M4 Reliability and failure frequency | which types and priorities count as a failure (user choice), class, criticality, minimum events | mean time between notifications per location and class, repeat locations, trend; result feeds the failure-rate driver of the forecast |
| M5 Open work exposure | priority, age, required end passed, criticality | open notifications whose location has a part at zero or under Min, action list |
| Equipment 3D and drawings, Protective devices | stay | |

## 5. Forecasting and Simulation (toggleable, based on the history)
| View | Inputs | Outputs |
|---|---|---|
| F1 Demand lab | part, family, class or location scope; method (auto, moving average, SES, Croston, SBA, TSB, bootstrap); horizon; holdout months; driver toggles: planned maintenance due (M2), failure rate (M4), campaign months, one-off event (month, qty), demand multiplier | history, forecast and p10 to p90 band, backtest error of the chosen method against naive, drivers ledger |
| F2 Predictability classifier (key question 1) | ADI and CV2 thresholds (default 1.32 and 0.49), minimum history, scope | class counts and issued value per class, method per class, error per class, parts that change class |
| F3 Policy designer (dynamic Min, Max, safety stock, ROP, order quantity) | scope, service level per criticality, lead time source (median, p90, manual, 60 d default), review period, order cost, holding rate, rounding | current against proposed per part and in total (units and IDR), largest changes, select parts and adopt into the decision list |
| F4 Stock simulator (Monte Carlo and replay) | part or group; policy (current, proposed, custom); toggle replay of the real 17 months or simulate the future; demand bootstrap from history with multiplier and campaign uplift; lead-time sampling from PO history plus supplier delay; horizon; runs | stock fan chart, stockout probability, days short, fill rate, average stock, orders and emergency orders |
| F5 Cost-risk scenario studio (key question 2) | stock level change by category and criticality (-50% to +50%), downtime cost per hour and hours per stockout (Assumptions), emergency premium, carrying rate, budget cap; save as scenario A, B, C | total cost curve (holding plus expected shortage), today and the chosen point, efficient frontier under the budget, side-by-side comparison of saved scenarios |
| F6 Decision board (the six named outputs) | scope, thresholds per alert; accept, reject or change quantity per line, note | Stockout Risk, Overstock Risk, Reorder Recommendation (quantity, order-by date), Slow-Moving Alert, Dynamic Parameters, Cost-Risk Scenario; decision log, export |
| Ask the AI | stays (Codex AI) | |

## 6. Costs
| View | Inputs | Outputs |
|---|---|---|
| C1 Carrying cost | carrying rate split (capital, storage, obsolescence), price basis | carrying cost by category, class, criticality |
| C2 Savings planner | which categories to release, realisation % per category, disposal recovery %, exclude S and A, phasing months | waterfall gross to realisable, cash release by month |
| C3 Stockout and downtime cost | downtime cost per hour by criticality, hours per stockout (default from notification required start to completion, labelled proxy), emergency premium | expected stockout cost per year now and under the scenario, top parts by risk IDR |
| C4 Purchase plan and cash | decisions from F6, budget per month | order lines by month and supplier, cash out, budget check |
| C5 Business impact | linked to the active scenario (Codex Fin model) | scorecard: service level, stockouts, turns, working capital, savings |

## 7. Order of work and cut line (about 13 hours to the deadline)
1. Foundation: scenario object, `ws` endpoints, contracts, side drawer (2 h).
2. Maintenance M1, M2, M3 (3 h).
3. Forecasting F3, F4, F5, F6 (4 h), then F1, F2 (1.5 h).
4. Costs C2, C3, C4, C1 (2 h).
5. Inventory I2, I3 (1 h), tests and deploy check (0.5 h at every step).
Cut line if time runs out: F1, F2, C1, I3 move to the end; M1 to M3, F3 to F6 and C2 to C4 are kept.

## 8. Decisions needed from the owner
1. Claude A's `docs/spi/PLAN_FORECAST_SIM.md` gives these three tabs to Claude A and says "Claude B: 3D views only". Who builds? Proposal: B builds all views and the `server/ws` endpoints; A keeps ETL, deploy, the router and the existing pages until replaced; Codex Fin keeps the engine and is asked only for the portfolio frontier; Codex AI registers the `ws` tools.
2. B needs write access to `server/ws/` and `spi/contracts/ws_*` (ownership check is A's file).
3. Storage of user scenarios and decisions: browser plus export now (recommended), or a hosted writable SQLite.
4. Default Assumptions to start with: downtime cost per hour by criticality, hours lost per stockout, emergency premium, parts per task factor. Engine defaults exist (downtime IDR 100 mn per day for S down to 1 mn for C); use them, labelled and editable?
