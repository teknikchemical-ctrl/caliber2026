# SPI business case and prototype financial basis

## Scope and evidence

This case is Spare Part Intelligence and Inventory Optimization. The base financial view is a **low-risk B/C stock-keeping pilot**, not approval to execute every forecast order and not a promise to sell strategic spares. The data cut-off is 2026-09-30; history covers 17 months. All monetary inventory values are **Estimates** from the last IDR purchase-order item amount read as a unit price. Strictly positive prices exist for 1,229 of 7,481 materials; unpriced requirements are excluded from value totals.

Baseline priced stock is **IDR 616,617,267,812**. Stock above static Max is **IDR 546,420,437,310**. The ten largest materials are **72.1%** of that static excess. The number is not a disposal budget. A Max of zero on an OEM part means no ceiling was set, not that every unit is excess.

## Mutually exclusive opportunity cohorts

- Low-risk B/C candidates: **IDR 14,733,770,130 across 72 materials**. A material in both excess and non-moving lists is counted once, using the larger eligible quantity.
- Double-counted B/C excess removed from the summed source categories: **IDR 1,258,628,365**. This is why the finance ceiling differs from adding the category tiles on the source savings page.
- Active critical S/A stock above a positive Max: **IDR 117,879,258,941**. A 10% after-review hypothesis is shown as an Assumption but is disabled in base cash flow. A scenario toggle does not grant approval.
- Insurance stock protected: **IDR 398,717,822,756**. This includes S/A non-moving stock and OEM Max-zero reserves. It is broader than the source page's S/A no-demand category.

Independent SQL found 12 materials shared by the B/C excess and non-moving groups, and 27 S/A insurance materials also above a set Max (IDR 285,253,164,604 excess). **Do not add overlapping categories or count insurance stock as released capital.** The integrator has now made the counted source categories mutually exclusive; the source B/C total reconciles exactly with Finance. The engine protects a broader strategic cohort (all S/A no-demand and OEM Max-zero) than the source page's lead-time-based insurance category, so their insurance/review reference values are deliberately distinguished.

## Financial assumptions and result

The editable input register is `finance/spi/inputs.json`. Every input carries unit, basis and source. Base realisation is **30%**, the total economic carrying indicator is **22%/year**, and the conditional critical review share is **10%**. These are Assumptions, not measured performance. Insurance is excluded before applying them.

The base realisation scenario is **IDR 4,420,131,039**, phased 20%, 40%, 40% over years 1 to 3. It could arise from approved transfers, disposal recovery or avoided replenishment. Those channels and timing are not established by the snapshot and require finance validation. There is no assumed emergency-purchase or downtime saving because baseline incremental cost and production-loss data are absent.

One-off solution cost is **IDR 480,000,000** and annual operation **IDR 408,000,000**, both Estimates. The one-off allowance covers integration, data QA, security and training with 20% contingency. Managed inference and existing browser clients need no new GPU in this prototype scope. Hosting/model/database/logs/support/evaluation budgets are editable allowances, not supplier quotations.

At **12% discount** over **5 years**, before tax and at constant prices, the scenario cash NPV is **IDR 1,961,180,418**, simple payback **0.94 years**, and BCR **2.01**. IRR is not reported when the cash flow changes sign more than once; the base has later operating costs after the finite capital release. Use NPV.

The **4% avoidable cash storage/handling rate** is separate from the 22% economic carrying indicator. The latter includes capital/opportunity components and is never added again to cash NPV. Capital release is a balance-sheet cash movement, not recurring operating profit. The post-release cash operating balance is **IDR -231,194,758/year**. A positive project NPV does not establish a profitable perpetual service: revalidate the ongoing budget or additional operational benefits after the cleanup phase.

## Full availability programme is a separate decision

The engine also calculates a complete service-policy backlog. Its gross reduction ceiling is **IDR 138,662,471,817**, while proposed priced replenishment is **IDR 254,337,142,785**. Unknown open orders, approved baseline buying and unpriced items prevent calling all of this incremental project spend. It is not charged automatically to the narrow B/C pilot and is not approved procurement. Include only the reviewed incremental fraction when modelling an availability programme.

The primary inventory value is readiness for the maintenance campaign, not blanket stock reduction. Historical issue campaigns are December 2025 and January 2026; the known October 2026 maintenance load has 1,123 planned items. Campaign multipliers are dated Estimates, not annual seasonality or proof of demand for each spare.

## Validation and limitations

`spi/engine` is the single JavaScript calculator for forecasting and policy; `spi/engine/businessCase.js` (re-exported by `finance/spi/model.mjs`) is the single JavaScript cash calculator used by the saved impact and live API. An independent hand-calculation test verifies NPV and the break-even equation. The Business Impact page changes its assumptions through a stateless API, recalculates scenarios and sensitivity, and does not mutate SQLite.

Demand backtesting uses the last four monthly origins only for parts with at least three active months. Ties are not called wins; zero training-scale origins are unscored. Pinball loss is scaled by training mean for comparison across part units. Most of the baseline is too sparse for a defensible per-part score. The report is `finance/spi/engine_report.json`; no held-out service claim is made.

The 17-month inventory replay is an **in-sample Estimate**: the current stock snapshot is used as a common initial condition, completed-history lead time is assumed and dynamic parameters are fit on the full history. It is not observed service improvement and cannot prove causal savings. Part-level exposures overlap on shared equipment and are not added as actual plant downtime benefit.

## Prototype status

Forecast, optimisation, simulation, health and impact APIs run against the real SQLite data. The identical dependency-free simulator can be imported by the browser from `/api/engine/simulate?module=1`. The AI owner's validated rules plans execute in this engine on every fixture part. Gemini-backed planning and the other inventory pages remain with their respective owners. No real API key or Vercel deployment is claimed by this financial milestone.

**The human deferred deck work and requested prototype focus with about ten hours remaining.** New workbook/deck rendering is not on the critical prototype path. The cash model and input register are ready for later workbook reconciliation without duplicating the calculator.

Financial source snapshot generated at 2026-11-04T03:46:12.274Z (UTC). Rebuild the engine report and impact JSON when baseline data or model policy changes.

Runtime business-case data ships as `spi/engine/impact_data.json` within the existing Vercel include pattern; `finance/spi/impact.json` is the identical review copy. Rebuild both with `node finance/spi/build_impact.mjs`.

## Three-policy replay and chronological holdout
`POST /api/engine/compare` compares current Min and Max, the case owner's Pilot 50 workbook formula, and the dynamic engine. See the handler header for the response contract. Full-history parameters fitted on all 17 months are explicitly in-sample Estimates. The separate holdout fits on May 2025 through May 2026 and tests June through September 2026. Test demand, future family demand, PO lead samples and campaign/maintenance signals without historical availability are excluded from fitting.

For a fair controlled comparison all policies use the workbook's 60-day lead Assumption by default. This differs from the operational engine's PR-to-PO-delivery proxy. The workbook uses 30.4375 days per month, safety stock 2 units, review 1 month, rounded-up ROP and Max, and on-hand-only position with the `<= ROP` order trigger. Monthly simulated receipts precede demand; lost sales are counted and replenishment is ordered at month end. Pipeline quantities are tracked for simulated arrivals but excluded from all three decision positions to match the workbook. This can create repeat orders while earlier orders are in transit.

The September stock snapshot starts each policy and each experiment identically. Historical stock, receipts, open orders and historical master settings are Not in baseline data. The holdout validates demand fitting out-of-sample, conditional on snapshot initial stock and current Min and Max. It does not establish historical stockouts, causal improvements or realised savings. No automatic disposal occurs; critical stock and insurance reserves remain. Stock value uses positive snapshot IDR prices. Service is reported as both unit fill rate and non-stockout part-month fraction; mixed-unit aggregate fill rate is descriptive. Zero-demand months count in the latter denominator. No emergency-premium saving or benefit based on PO spend is included.

## Capital waterfall and two separate programmes
The Impact waterfall uses the mutually exclusive `/api/data/savings` categories. From priced stock it sets aside source-defined insurance, S/A review excess, and all other retained stock, leaving the B/C candidate ceiling. The scoped realisation Assumption then separates unrealised candidates from a three-year release scenario. Required stock within a candidate material remains in the retained residual. This is a capital allocation bridge, not an automatic disposal instruction. Source insurance differs from the broader conservative insurance definition in the dynamic engine; both are named on the page.

Programme 1 is the B/C cleanup: gross IDR 14.73 bn from excess and non-moving categories counted once. Programme 2 is full availability replenishment versus a dynamic reduction ceiling. Its incremental spend must be approved independently, with open orders reconciled. The programmes may overlap and their reduction ceilings must not be added. No rush-order price premium is supported by the data, so emergency-purchase savings are locked at zero, including local financial scenarios.

## Monthly purchase plan and capital timeline
`GET /api/engine/cashplan` reads the generated rules snapshot, with POST scenario overrides for B/C scope and realisation and an optional 0 to 12 month payment lag. The response contract is documented in `server/engine/cashplan.mjs`. The batch captures each positive recommended order quantity once per material, its actual order-by date, positive snapshot IDR unit price, indicative arrival from the lead proxy, and dated forecast campaign months. Unpriced orders remain listed and counted. Purchase proposals reconcile exactly to the full rules replenishment funding total.

Orders due at the September 2026 cut-off remain a separate September funding bucket. They are not silently rescheduled into the future. No invented repeating order stream is added. Future order months without recommendations are unscheduled, not a zero-purchase forecast. The dated campaign rules are already included in the batch forecasts. Historical issues ran about 2.8 times normal in December 2025 and January 2026; 1,123 maintenance items due in October 2026 indicate load, not known part requirements. A calculated arrival is not a supplier commitment.

Cash payment in the order month is an Assumption because payment terms and open orders are Not in baseline data. The cleanup release scenario starts in October 2026 and allocates each annual share evenly by month: 20%, 40%, 40% over 36 months. Only scoped B/C candidates are eligible; critical review scenarios never auto-release S/A stock. The chart gives full availability purchase funding and low-risk cleanup inflows separate labelled panels and scales. Their cumulative difference is a capital funding scenario, not profit, a discounted business case, or money already received. Solution/operating costs remain in the annual financial model and are excluded from this capital-only timeline.

Regenerate all cash-plan evidence with `node spi/engine/batch.js full --out /tmp/spi-rules-results.sqlite --report finance/spi/engine_report.json` then `node finance/spi/build_impact.mjs`. The latter generates the review and runtime copies; do not edit generated JSON by hand. The shared results database remains untouched to protect AI-owned rows.
