# Plan: Maintenance, Forecasting and Simulation, Costs (Claude A, next 10 to 12 hours)

Goal: every view answers a decision question from the brief in three seconds (what to do, how much, by when, what happens if not), with figures from the case data, axes on every chart, and tables hidden until searched. AI is not the focus now: every view is built from a typed JSON payload that the assistant can read later.

## Why the Forecasting views give no information today
1. Most parts have no usable demand (5,551 never issued, 1,220 issued once), so a per-part forecast is a flat line. Nothing explains why, or what to do instead.
2. No portfolio forecast by decision group (criticality, item type, campaign).
3. Forecast quality is hidden: the engine beats the naive baseline by only 0.8%, and the page does not turn that into advice.
4. Drivers (maintenance plan, campaigns, equipment, lead time) are not shown next to the forecast.
5. Parameters, risks and recommendations are separate pages with tables, not one decision board.

## Brief deliverables and where each lands
| Brief item | View (tab) | Status |
|---|---|---|
| Key question 1: demand predictability for irregular demand | F1 Demand predictability | new |
| Key question 2: dynamic optimisation across cost, availability, risk | F5 Cost-risk optimiser, C1 | new |
| Part 1 Demand forecasting (consumption, failures, planned maintenance, preventive schedules, shutdowns, population, lead time) | F2 Portfolio forecast, F3 Part forecast, M1 to M3 | rebuild |
| Part 2 Dynamic inventory optimisation (Min, Max, safety stock, ROP, order qty) | F4 Parameters | rebuild |
| Part 3 Inventory health (excess, slow, non-moving, obsolete) | Inventory tab (exists), linked from F6 | keep |
| Part 4 Recommendation and cost-risk (reorder, maintain, reduce, monitor) | F6 Decision board | rebuild |
| Named outputs: Stockout Risk, Overstock Risk, Reorder Recommendation, Slow-Moving Alert, Dynamic Inventory Parameters, Cost-Risk Scenarios | F6 (first four), F4, F5 | new layout |
| Scenario simulation of raising and lowering stock | F5 | extend |
| Business impact in IDR, assumptions labelled, success metrics | C1 to C4 | rebuild |

## Step 0 (first hour): re-review all six files and decide the figures
Output `docs/spi/DATA_FINDINGS_2.md`, each finding with its SQL. Questions to settle:
- ADI and CV2 distribution of the 1,930 parts that were issued; share of issued value in smooth, erratic, intermittent, lumpy.
- How much consumption follows planned maintenance and work orders (16% of issues link to a notification): lag correlation by month and by item type.
- Failure frequency proxy from notifications (priority, type) by class and location; repeat locations.
- Which planned tasks map to which parts (via BoM and part_equipment), so a shutdown kit can be listed.
- Lead time proxy distribution by criticality and supplier; share of S and A with lead above 90 days.
- What the data cannot say (cost of downtime, emergency premium, failure codes): each becomes a labelled assumption.

## Forecasting and Simulation tab (about 5 hours)
- F1 Demand predictability: ADI against CV2 quadrant chart with the Syntetos-Boylan thresholds (1.32, 0.49); per class: parts, share of issued value, method, backtest error against baseline; "what we do per class" strip. Answers key question 1 with numbers.
- F2 Portfolio forecast: next 12 months quantity and IDR by criticality and item type, p10 to p90 band, campaign months marked, against the last 12 months. Needs a portfolio aggregation in the engine (Codex Fin).
- F3 Part forecast: history, forecast and band, planned maintenance markers, drivers ledger, family pool peers, stock projection over 12 months under current and dynamic policy with stockout probability, the decision and its reason.
- F4 Parameters: current against dynamic Min and Max as a portfolio shift (units and IDR by class), top movers as dumbbells, editable service target and lead time. Flags dynamic values above a sane multiple of lead-time demand (open item with Codex Fin).
- F5 Cost-risk optimiser and simulator: scenario library (campaign, supplier delay, budget cap, service target, S and A first) and a budget-constrained optimiser: with budget X, which parts to fund, risk bought per IDR, efficient frontier. Keeps the existing curve and sensitivity charts.
- F6 Decision board: Reorder now (with order-by calendar), Stockout Risk ranking, Overstock Risk ranking, Slow-Moving Alert, Maintain, Monitor: counts and IDR per action, click a part for F3.

## Maintenance tab (about 2.5 hours)
- M1 Equipment population and failure frequency: locations, installed parts and notifications per 100 locations by class; repeat-failure locations; priority mix as failure-severity proxy.
- M2 Maintenance-driven demand: planned load against consumption by month, measured lag and strength by item type, campaign uplift. This is the evidence that the forecast uses the maintenance plan.
- M3 Shutdown and turnaround readiness: per month and per equipment class, the parts the planned tasks need against stock and lead time, gap in IDR, order-by date. Extends Campaign readiness.
- M4 Open work against spare exposure (exists, refit). 3D library and protective devices stay as views.

## Costs tab (about 2.5 hours)
- C1 Cost-risk balance: holding cost, stockout exposure by criticality, working capital; the trade-off curve with today and target marked. Uses Codex Fin economics and loss model.
- C2 Savings waterfall: gross excess to realisable release by category (mutually exclusive), with the realisation factor as an editable assumption.
- C3 Cash plan: release and replenishment by month (Codex Fin to spread purchases by order-by date), net position, payback.
- C4 Business impact scorecard: success metrics with baseline and target (stockouts, service level, inventory turns, working capital, forecast error), expected benefits in IDR with every assumption labelled, sensitivity to the top assumptions.

## AI readiness (built into every view)
- Each view reads one payload from `/api/view/<name>`: `{title, insight, figures:[{id,label,value,unit,basis}], series, notes, source_ids}`. The page renders from it and the assistant reads the same payload, so words and charts cannot disagree.
- Codex AI registers each payload as a read-only tool with the `source_ids` as citations, using their typed data layer (`spi/ai/data.js`). No page-specific AI code.
- Every figure carries its basis (Estimate, Assumption, Data) and every default is listed in the Method view.

## Split of work with the other agents
- Codex Fin: portfolio forecast aggregation, budget optimiser and frontier endpoint, stock projection fan, cash plan spread, cap or explanation for high dynamic Min, cache `compare` and `optimise`.
- Codex AI: tool registration for the `/api/view/*` payloads, evidence ids, evaluation questions for the new views. No UI.
- Claude B: 3D views only; no changes to these three tabs except linking.
- Me: Step 0 analyses, payload contract, all view pages and charts, tests, deploy.

## Order and checkpoints (about 12 hours to submit at 03:00 WIB)
1. Hour 0 to 1: findings and payload contract, inbox requests to Codex Fin and Codex AI.
2. Hours 1 to 6: F1, F2, F6, F3, F4, F5 (in that order), push to main at each finished view.
3. Hours 6 to 8.5: Maintenance M1 to M3.
4. Hours 8.5 to 11: Costs C1 to C4.
5. Hours 11 to 12: tests, phone width, performance check, screenshot with timestamp, zip, feature freeze.
Each push: build, static, data, pages, engine and AI tests, one deployment (main only), check the build stamp in the sidebar.

## Open questions for the owner
1. Emergency purchase premium and downtime cost per day are not in the data. Use the labelled defaults already in the engine (downtime IDR 100 mn per day for S down to 1 mn for C) and show sensitivity?
2. Keep the existing Recommendations, Parameters and Scenario views as sub-views, or fold them into F4 to F6 and remove them?
