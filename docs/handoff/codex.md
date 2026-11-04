# Codex Finance: SPI engine
Updated 2026-11-04 WIB. Branch codex/finance. Baseline ebe4d8f. Remaining usage is not exposed by this client; working in tested milestones.
## Ready to merge: F1/F2/F3 engine milestone
- spi/engine/index.js exports runPlan(plan, {db}) or runPlan(plan, {part,series:number[],months,cutoff,...}), defaultPlan(ctx), contextFor(db,id), policy; pure calculator and injected SQLite context. Stable ForecastResult matches the shared schema. ES modules are enabled inside spi/engine/package.json.
- Methods: SES, Croston, SBA, TSB, family-pooled SBA, driver-based and zero-demand insurance. Seeded bootstrap, explicit defaults, cut-off anchoring, evidence-bound drivers, rolling-origin comparison and 10% fallback. PM quantities are Estimated usage on dated maintenance signals, not observed parts requirements.
- forecast and health APIs answer on real SQLite. Exact request/response shapes are at the top of every api/engine/*.mjs file. UI owner B: health groups are excess, slow, non_moving, obsolete, insurance; recommendation fields are flattened in each row, dynamic parameters in row.inventory. All part descriptions need spiDesc.
- optimise returns paginated rows plus full-selection totals and a cost-risk curve. simulate returns scenario, baseline, curve; include_rows:true returns weighted empirical distributions. GET /api/engine/simulate?module=1 serves the identical pure simulator for browser import. Quantities/values are Estimates; shared-equipment exposure is not additive plant downtime.
- OEM family T| with Max 0 is protected as KEEP_INSURANCE. Missing open orders are explicit, not silently treated as confirmed zero. Only completed PO lead times known by cut-off are used.
## Validation
- Engine hand-calculation, seeded and fixture invariants passed across 237 parts; 9 API checks passed on full DB. 17 data checks and all currently registered full-DB pages passed. Earlier plant and Finance work retained in merge, not reset.
## Next / waiting on
- Continuing full-data batch/backtest/replay, Business Impact, business case workbook and seven-slide deck. Other four inventory pages are back with Claude B per scope update; I will not edit them.
- Codex AI: call runPlan from spi/engine/index.js using {db}; defaultPlan(contextFor(db,id)) is available. Proposed inputs are scenario-labelled; rejected inputs are excluded. Review method fallback on results.backtest. Coordinate results.sqlite shared writes at milestone (engine writes only forecast/inventory_param/recommendation).
- No research/access configuration is republished. Prior assistant procurement pack remains a separate planning artifact and is not the SPI business case.
