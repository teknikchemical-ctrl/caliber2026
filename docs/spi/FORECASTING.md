# Forecasting and optimisation (owner: Codex Fin)

Everything is in `spi/engine`, pure functions, tested in `tests/spi_engine*.js` against hand calculations. Every default is an **assumption**: label it in `provenance.assumptions`, show it in the UI, keep it editable in a policy object.

## 1. Classify demand (per part, monthly series over 17 months, zeros included)
ADI = months / months with demand. CV2 = (sd of non-zero demand sizes / mean)^2. Cut-offs ADI 1.32 and CV2 0.49 (Syntetos, Boylan and Croston 2005): smooth, erratic, intermittent, lumpy. Extra classes: `no_demand` (never issued), `single_event` (one issue only). ABC by annual consumption value, XYZ by CV, criticality S, A, B, C from the equipment served.

## 2. Methods (menu the AI chooses from, all in `methods.js`)
`ses` simple exponential smoothing; `croston` (1972); `sba` Syntetos-Boylan approximation, Croston times (1 - alpha/2); `tsb` Teunter-Syntetos-Babai 2011, updates demand probability every month so it decays for obsolete parts; `family_pooled_sba` pools the family's series (spec family, same item type and size class) and shares it with weight w; `driver_based` known demand from the ledger (PM due, turnaround, failure rate) on a low base; `zero_demand_insurance`. Quantiles (p10, p50, p90) by bootstrapping the lead-time demand from the part's own non-zero sizes and the modelled occurrence rate (document the seed so results are reproducible).

## 3. Known demand from the maintenance plan and failures
`maint_item.next_due` on equipment the part serves, times the typical issue per event for that part (from history around past events when available, else a labelled family or class rate). Failure rate from notifications per year on the served equipment (N1 breakdown and N2 as failure-type, N3 as planned or minor: confirm in the data), converted to parts per failure by family. Both go into the ledger as `forecast_input` rows (source `rule`) so the AI can see and adjust them.

## 4. Dynamic inventory parameters
Lead time L (days): median of the part's PO lead times if n >= 3, else family median, else plant median, flagged; also its standard deviation. Demand during L: mean and sd from the bootstrap. Service level by criticality (assumption policy table): S 99%, A 97.5%, B 95%, C 90%. Safety stock = quantile at the service level minus mean. Reorder point ROP = mean LT demand + safety stock. Min = ROP (rounded up, at least 1 for stock items). Max = Min + order quantity. Order quantity: EOQ = sqrt(2 D S / (h C)) with ordering cost S per PO (assumption, IDR), holding rate h (assumption 22% of unit value per year), unit cost C from the last PO; clamp to a minimum lot of 1 and to the part's Max history. Compare with current Min and Max and with stock.

## 5. Health and recommendation (the named outputs)
- **Stockout risk** = probability that demand during lead time exceeds stock on hand plus open PR/PO quantity (if known), weighted by criticality into an exposure in IDR (downtime cost per day assumption by criticality times expected days short).
- **Overstock risk and excess value** = max(0, stock - max(Max_dynamic, months-of-cover rule)) times price.
- **Slow-moving** = turnover below threshold or months of cover above 24; **non-moving** = no issue in the 17 months with stock > 0; **potentially obsolete** = non-moving and no equipment demand signal and not an insurance spare.
- **Action**: REORDER (stock + open orders below ROP), REDUCE (excess above Max_dynamic, not insurance), MAINTAIN, MONITOR (low confidence or sparse), REVIEW_OBSOLETE, KEEP_INSURANCE (no demand, S or A equipment, lead time above 90 days). Urgency 1 to 3. Always give the reason in one plain sentence.
- **Cost-risk optimisation**: for a part or a portfolio, curve of total expected cost (holding + ordering + expected stockout exposure) against stock level; the optimum and the current position; portfolio view gives working capital released and risk added when going from current to dynamic parameters.
- **Scenario simulation** (`simulate.js`, runs in the browser too): stock multiplier, service level, lead-time multiplier, demand multiplier, scope (part, family, system, plant); output stock value, carrying cost per year, expected stockouts per year, exposure, service level achieved.

## 6. Validation (what we show the judges)
Rolling-origin backtest on the last 4 months for all parts with at least 3 active months: scaled error (MASE-style against the in-sample mean, because zeros break MAPE), pinball loss for the quantiles, and service level actually achieved by the dynamic parameters against the current Min/Max in a replay of the 17 months. Report the baseline (current static Min/Max replay) against ours with numbers. If our method does not beat the baseline on some class, say so and show where it does.

## 7. What the data cannot support (state it, do not fake it)
No seasonality (17 months), no price history beyond PO lines, no stock history (stock is a snapshot: replay of stock over time needs reconstruction from issues and receipts, label it estimate), no downtime cost in the data (assumption per criticality, editable), failure link only for about 16% of issues.
