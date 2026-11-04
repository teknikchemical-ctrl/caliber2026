# Case coverage of Claude B's pages

Each case point (11 stock, 9 demand) has a figure on the Summary tile (`spi_summ`, from `/api/ws/questions?q=<id>`) and opens a tool where the user can show the same point for any part, equipment, class or criticality. In every tool the user can switch between the recommended run and their own inputs.

## Stock levels, risk and cost

| Id | Case point | Summary tile | Tool and chart that answers it |
|---|---|---|---|
| s_stockout | Critical parts at risk of a stockout | Critical parts at risk | Status (critical parts at zero stock, by criticality); Inventory planner (stockout chance per part); Optimized Scenario (Monte Carlo chance of a stockout per month) |
| s_overstock | Stock above the projected need | Value above need | Status (overstock group); Savings planner (`spi_csave`) |
| s_reorder | Parts to order now | Parts to order now | Optimized Scenario (timeline markers and the work-order list); Status (order now) |
| s_minmax | New Min and Max | Parts with a new Min and Max | Inventory planner (bar of stock against today's and the recommended Min and Max; part card) |
| s_slow | Dead and slow stock | Dead stock value | Stock view (`spi_inv`); Status (dead stock) |
| s_carry | Holding cost | Holding cost per year | Carrying cost calculator (`spi_ccalc`); Impact reduction waterfall |
| s_procure | Purchase value | Purchase value in 17 months | Suppliers (spend, lead-time range per supplier); Optimized Scenario (purchase value by month and criticality) |
| s_crit | Criticality S exposure | Parts serving S equipment | Link map (`spi_link`); criticality filter and colour on every page |
| s_downtime | Downtime from stockouts | Downtime per year | Impact reduction (`spi_cimp`, four impacts and the waterfall) |
| s_tradeoff | Service level against cost | Lowest-cost service level | Cost-risk scenarios (`spi_scr`, cost against service curve) |
| s_scenario | What-if Min and Max | Stockouts at 80% Min and Max | Cost-risk scenarios; Replenishment simulator (`spi_ssim`) |

## Demand and its drivers

| Id | Case point | Summary tile | Tool and chart that answers it |
|---|---|---|---|
| d_history | Demand pattern (intermittent, lumpy) | Hard-to-forecast parts | Stock view (demand quadrant); part card (issues per month with forecast band) |
| d_failure | Failures as a demand driver | Share of issues on failures | Reliability (`spi_mrel`) |
| d_planned | Planned maintenance | Planned occurrences in 17 months | Maintenance plan (`spi_mplan`); Maintenance timeline (planned tasks layer) |
| d_preventive | Preventive plan ahead | Occurrences in the next 12 months | Maintenance plan; work pack for the months in view on the maintenance timeline |
| d_shutdown | Campaigns and shutdowns | Campaign uplift | Maintenance timeline (`spi_mtime`, campaign shading); Optimized Scenario (repeat campaign input) |
| d_population | Installed base | Installed quantity in the BoMs | Link map; part card (where it is used) |
| d_season | Seasonality | Highest month index | Maintenance timeline (monthly index) |
| d_abnormal | Abnormal months | Parts with abnormal months | Inventory planner (demand drivers, abnormal months marked) |
| d_lead | Lead time | Lead time of 9 in 10 orders | Suppliers (lead-time range p10, p25 to p75, median, p90; critical parts on slow suppliers) |

## Shared parts used by every page
- Search with a dropdown of matches (`kbSearchHtml`), keyboard and mouse.
- Timeline (`kbTimeline`): drag to pan, wheel or pinch to zoom, brush strip, every marker opens its details.
- Top input ribbon, the "Show the recommended projection" and "My inputs" toggle (`kbToggle`), and the AI box above each result (`kbAi`, which calls Claude A's `spiAiBox`).
- Data: Claude A's `/api/data/status` and `/api/data/golden` (Monte Carlo); B's `/api/ws/*` for the decision rule that matches the planner.
