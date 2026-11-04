# Interactive tools of the Maintenance, Forecasting and Simulation, and Costs tabs (owner: Claude B)

Every view is a tool: inputs on the left, results on the right, recalculated on every change. All data comes from `spi/db/spi.sqlite` through read-only endpoints under `server/ws/`. Every value that the data does not contain is an Assumption that the user can edit (panel "Assumptions", saved in the browser).

## Tools
| Tab | Tool (page id) | Endpoint | Inputs | Outputs |
|---|---|---|---|---|
| Maintenance | Notification explorer (`spi_mnotif`) | `/api/ws/notifications`, `/api/ws/notification?no=` | text, month range, priority, type, status, overdue, criticality, class, order | totals, open and overdue, completion time, monthly chart by priority, classes, paged records; record: timeline, parts issued on its order with value, other notifications, plan items |
| Maintenance | Maintenance plan (`spi_mplan`) | `/api/ws/plan` | first month, horizon 3 to 36 months, ABC, plan priority, criticality, class, text | every occurrence in the horizon from start of cycle and cycle length, workload by month and class, items with their occurrence months |
| Maintenance | Work-pack calculator (`spi_mkit`) | `/api/ws/kit` | window, scope, replacement share per task and per part type (Assumption), default lead time | parts required against stock and open orders, shortage, order-by date, cost; remove lines; export |
| Maintenance | Reliability explorer (`spi_mrel`) | `/api/ws/reliability` | what counts as a failure (types, priorities), period, scope, repeat threshold | events, rate per 100 installed locations by class, monthly trend, repeat locations with time between events |
| Forecasting and Simulation | Replenishment simulator (`spi_ssim`) | `/api/ws/series?mat=` (simulation runs in the browser) | part, replay of 17 months or Monte Carlo ahead, horizon, runs, demand factor, campaign months and uplift, maintenance plan driver, lead time source and supplier delay, own Min and Max, starting stock, price, assumptions | three policies side by side (current, calculated, own): fill rate, stockout chance, stockout months, orders, average stock, holding, ordering, shortage and total cost per year; stock path with band |
| Forecasting and Simulation | Cost-risk scenarios (`spi_scr`) | `/api/ws/costrisk` | scope, service target or Min and Max scaling per criticality, demand factor, supplier delay, budget, Non Stock treatment, assumptions; save and compare scenarios | stock value, holding and ordering, stockout events, shortage and total cost against today; cost curve over service targets; by criticality; parts that save most or need more |
| Costs | Cost of holding and shortage (`spi_ccalc`) | `/api/ws/costs` | carrying rate parts (capital, storage, obsolescence), scope, shortage assumptions | holding by stock category (each part once), holding against shortage by criticality, top parts |
| Costs | Savings planner (`spi_csave`) | `/api/ws/savings` | categories to release and the share released, keep S and A, months of demand kept, recovery share, release period | bridge from releasable to released, carrying cost avoided, cash by month, largest releases |
| Costs | Purchase plan (`spi_cbuy`) | `/api/ws/buyplan` | policy (current or service targets), horizon, monthly budget, scope | parts reaching the reorder point, order quantity, order-by date, cash per month funded or deferred (S and A first); export |

## For the AI (read and run)
- `spiWsSnapshot()` returns `{assumptions, views:{<tool>:{title, inputs, figures, outputs, sources, updated}}}`: exactly what the user sees.
- `spiWsRun(<tool>, inputs)` sets inputs and recalculates (tools: `mnotif, mplan, mkit, mrel, ssim, scr, ccalc, csave, cbuy`).
- Every endpoint answers `{tool, inputs, outputs, figures:[{id,label,value,unit,basis}], sources, notes}`, so the same call can be registered as a server-side tool (`ws.notifications`, `ws.plan`, `ws.kit`, `ws.reliability`, `ws.series`, `ws.costrisk`, `ws.costs`, `ws.savings`, `ws.buyplan`).

## Model notes
- Demand over the lead time: normal approximation with the mean and spread of the 17 monthly totals. Calculated policy: reorder point = demand over lead time + z x spread over lead time (z from the service target of the criticality); order up to = reorder point + max(EOQ, one month).
- Shortage cost = units short x price x emergency premium + stockout events x share that stops equipment x hours per stockout x downtime cost per hour (all Assumptions by criticality).
- Lead time = PR date to PO delivery median; unit price = last PO amount read as a unit price (Estimate). Parts without a price add risk but no IDR.

## Added (second round)
- Maintenance timeline (`spi_mtime`, `/api/ws/timeline`): whole plant, a class, a criticality or one location. Layers switch on and off: notifications created by priority, completed, open and overdue backlog at month end, parts issued (value, quantity or count), planned task occurrences before and after the cut-off, purchase deliveries. One location also lists every dated event, filterable by kind.
- Every tool shows "Your selection": the inputs behind the result, in words.
- Replenishment simulator: reference run with the default inputs and the change of each result against it; monthly demand chart (17 months issued, simulated months with band); total cost and stockout chance against the reorder point (sweep), with the three policies marked.
- Cost-risk scenarios: sensitivity of the total cost to each assumption (25% lower and higher).
- Test `tests/spi_ui_b_handlers.js`: compiles every inline event handler on every page (the chip handlers were broken before this fix).

## Inventory planner (`spi_iplan`, first view of Inventory)
- Choose a part number, an equipment set (8 chips) or any location with parts. Inputs: look-ahead 6 to 24 months, order size (cheapest, or fixed months of use), use compared with the history, lead time (median, slow p90, own days), service targets and cost assumptions.
- Part: four numbered answers (stock now, projected use with range, recommendation with quantity, months covered and order-by date, cost reduction per year and over the horizon); projected stock with and without the recommendation (Monte Carlo, open orders on their delivery month); every cost line today against the recommendation; nine risk measures; use history and projection; purchase history.
- Set or location: every part of its bill of materials with decision, stock, use, order, cost reduction and risk level; select a part to open it with the set in the trail.
- Endpoint `/api/ws/advice` (mat, mats, set or loc). The recommendation is the cheapest of order sizes 1 to 24 months and service levels at or above the target, with today's Min and Max as a candidate, so it never costs more than today.

## Coverage of the case (third round)
- Four impacts of the case (emergency procurement, purchasing and carrying cost, tied-up working capital, downtime and production losses): `impacts()` in `server/ws/advice.mjs`, per part and summed; shown as the impact panel (`wsImpact`) in the Inventory planner (part, set, all parts) and in Costs > Impact reduction (`spi_cimp`). Inputs: scope, where the recommendation is applied (by criticality), cap at today's Max, release unused stock, use factor, lead time, assumptions.
- Inventory planner: demand drivers (planned maintenance at the part's locations, failure-driven use scaled, campaign months, abnormal months left out), demand pattern panel (ADI, CV squared, method, installed population and issue rate, failures and plan tasks at its locations), all-parts mode ranked (criticality, decision, risk) with export.
- Suppliers and lead time (`spi_sup`, `/api/ws/suppliers`): lead time against on-time share per supplier, lead-time histogram, supplier detail.
- Stock view: categories "At risk of a stockout" and "Becoming slow-moving".
- `/api/ws/questions?q=<id>`: one structured answer per point of the case (no page; for the AI). Each tool's SPIWS state carries `answers:[point ids]`.
