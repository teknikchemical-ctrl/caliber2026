# Prompt for Claude A (round 6, AI integration)

You are Claude A on teknikchemical-ctrl/caliber2026. You own the AI, the model, the database and `server/data`, `spi/ai` and `src/modules/spi_ai_box.js`. Claude B owns the charts and layout (plan: `docs/spi/PLAN_B_ROUND6.md`). Follow CLAUDE.md: plain engineering English, no em or en dashes, no emoji, `%` symbol, every default labelled Estimate or Assumption, never invent data.

The owner wants every tab to work like a monitoring terminal powered by one rigorous model and an AI that reasons in a structured way.

## 1. One model for every page (highest priority)
- **The conflict.** Today B's `/api/ws/golden` gives a cost reduction of IDR 160.6 bn per year and your `/api/data/golden` gives IDR 43.4 bn per year at default inputs.
- **The fix.** Make your `golden()` the single decision engine. B will retire its own optimiser and read yours on every page: Optimized Scenario, status, planner, part card, impacts, costs. To make that possible, extend `/api/data/golden` with:
  - **Per order:** `order_date`, `qty`, `unit`, `months_covered`, `value_idr`, `lead_days`, `stock`, `reason` (plain words), `saving_idr_yr`, `funded_month` and `deferred_from` when a budget is set.
  - **Per part, for `?mat=`:** the decision (`order_now`, `order_by`, `no_order`, `buy_when_needed`, `no_use`), `rop`, `order_up_to`, `min_now`, `max_now`, `stockout_chance_in_lead_time`, `months_of_cover`, `mean_month`, `sd_month`, `forecast_12m`, and the monthly fan of on-hand quantity.
  - **Totals, current against golden:**
    - cost per year by type: holding, ordering, shortage, downtime, purchase;
    - stockouts per year;
    - service level reached by criticality;
    - working capital;
    - emergency orders;
    - downtime hours.
    These are the four case impacts.
  - **Monthly series for the plant or a scope:** purchase value by criticality, stock value fan (p10, p50, p90), stockout chance or expected parts short, and cost per month.
  - **History series on the same axis:** issue value, PO value, receipt value, campaign months.
  - **A `?cls=` scope** (parts in the BoM of an equipment class) and a `set=` scope (equipment set).
  - **Speed:** about 1 s for the whole plant, cached per input set.
- **Model rigour:**
  - **Backtest.** Hold out the last 6 months, forecast them, and return `backtest:{months, actual, forecast, mape, bias}` per scope.
  - **Fan calibration.** Give the share of actual months that fell inside the 80% band.
  - **Service level.** Report the level reached, not only the target.
  - **Runs.** Give the number of Monte Carlo runs, and the seed for repeatability.
  - **Basis field.** Say which figure is Data, which is Estimate and which is Assumption.

## 2. Events for the terminal timelines
- **Endpoint.** `/api/data/events` already exists. Add `crit`, `value_idr`, `qty`, `unit`, `material_no` and `funcloc` to every event.
- **Kinds:** issue, notification (with priority), planned, pr, po_due, receipt, recommended_order, campaign.
- **Parameters:** `from`, `to` and `limit`, so a panned window can load only what is in view.

## 3. Structured AI reasoning (the owner says the sentences are not yet structured enough)
- **Current output.** `spiAiBox` writes one long paragraph today, for example: "Golden path for service levels S 99%, A 97.5% ... Figures are Estimates ...".
- **New output.** Return validated JSON and render it as these short blocks:
  1. **Verdict**: one line, the decision in plain words, for example "Order 1,171 parts over 12 months; cost falls by IDR 127.1 bn per year".
  2. **Why**: two or three bullets, each with one number and its basis, for example "Stockouts per year 1,180 today to 128 recommended (Estimate)".
  3. **Do next**: up to three actions with a part, quantity, date and value, each a link that opens the part card.
  4. **Risk and confidence**: the main uncertainty, such as fan width, backtest MAPE, lead-time spread or unpriced parts, and what would change the verdict.
  5. **Your inputs against the recommended run**: shown only when the user changed inputs, with the inputs written in words, for example "Demand at 85% of history" and the delta of each key figure.
- **Text rules.** Keep it under about 90 words in total. Put bold figures in running text. Do not repeat the inputs as a list, and do not use the words "golden path": the owner renamed it **Optimized Scenario**.
- **Rendering.** The box renders inside the host B gives (`#wsai_<frame>`, list in docs/TASKS.md). It stays collapsible, never throws offline, and replaces its content on a repeated call.
- **What it reads.** B passes `{title, inputs, outputs, figures, compare, actions}`. Use `compare` and `actions` when present.
- **Reasoning checks.** Gemini reasons over the evidence. Deterministic code checks every number in the reply against the payload, and a reply with a number not in the payload is rejected and falls back to the database rules.
- **Feature ids.** Use the same structure for every one of them: iplan, golden, mtime, mnotif, mplan, mrel, ssim, scr, cimp, ccalc, csave, cbuy, sup, links, status, summary, partcard.

## 4. Hover readouts on your charts
- **Where.** B is adding a hover readout (value, unit, caption) to every chart.
- **Your files.** Please either move `spiAxLine` and `spiAxBars` in `spi_viz.js` and `spi_tl.js` to B's `kbChart` (B will publish its API in the kit header), or add `data-kb='{"x":label,"s":[{"name","unit","basis","v"}]}'` per point or bar so B's overlay can read them.
- **Rename.** In `spi_tl.js` and in any text you produce, rename "Golden path" to "Optimized Scenario".

## 5. Contracts and handover
- **Shapes.** Write the new shapes into `spi/contracts/` and `docs/TASKS.md`.
- **Tests.** Keep `tests/spi_ai_views.js` and `tests/spi_econ_consistency.js` green, and add a test that the AI reply contains only numbers present in the payload.
- **Handover.** Tell B in `docs/TASKS.md` when `golden` carries the fields above, so B can switch all pages to the single model.
