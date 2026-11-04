# Role: Claude B, drawings and 3D only (REDUCED: B is at 1% weekly usage)

**Update:** Claude B has almost no usage left. The spare-part pages below were reassigned: Claude A (shell, Overview, Data and architecture), Codex AI (Forecast, Ask AI), Codex Fin (Optimisation, Health, Recommendations, Scenario, Business impact). You keep only what is cheap and valuable if you still have usage: item 9 (drawings with stock overlay) for 2 or 3 demo sets, then 3D polish. If you cannot work, write one line in `docs/handoff/b.md` and stop; do not start anything you cannot finish. The page list below is the specification the new owners follow.

Branch `claude/funny-edison-pis09w`. You were the 3D agent. For this case the 3D work is secondary: the pages come first. Check with the human how much usage you have left and write it at the top of `docs/handoff/b.md`.

## Your files
`src/modules/spi_*.js`, `src/modules/style_spi.css`, `cases/spi/geo/**`, the 3D files you already own (`g3d.js g3r.js g3neck.js plant3d.js hse3d.js sim3d.js auto3d.js style3d.css`, `tools/g3*.js`, `tests/stress3d.js`), `docs/spi/shots/**`, `docs/handoff/b.md`. Ask Claude A to register a new module in `build.py`: the glob `src/modules/spi_*.js` is added at M0, so new files need no request.

## How to work without waiting
Code against `GET /api/data/*`, `POST /api/engine/*` and `POST /api/ai/*` as in `docs/spi/ARCHITECTURE.md`, with the shapes of `spi/contracts/*.json`. Until the endpoints exist, use a stub file `src/modules/spi_stub.js` that returns contract-shaped JSON built from `spi/fixtures/mini.sqlite` samples (write a few JSON files by hand in `tests/spi_ui_fixtures/`). One function `spiApi(path, body)` in `spi_core.js` is the only place that calls fetch, so the stub is replaced in one line.

## Pages (module per page, register with `regMod`, page names `spi_*`), in priority order
1. **Overview** (`spi_dash`): KPI tiles (stock value, excess value, parts below Min, zero-stock on S and A, parts with recommendation REORDER, REDUCE, dead stock), a chart of stock value by criticality, top 10 risks and top 10 excess, link into every page. Data from `/api/data/summary` and `/api/engine/health`.
2. **Forecast** (`spi_forecast`): part search and picker; chart of the 17-month history with the forecast and the p10 to p90 band; demand class badge; the drivers ledger as a table with a source badge (data, rule, AI, user) and Accept or Reject for AI proposals; dynamic parameters beside the current Min and Max; the recommendation card; the "How the AI reasoned" panel (evidence ids, plan, validator result, backtest result, which provider). Button "Ask the AI to plan this part" calls `/api/ai/plan`.
3. **Optimisation** (`spi_opt`): table of current Min, Max against dynamic Min, Max, safety stock, reorder point, order quantity for the filtered parts; cost-risk curve for one part; portfolio working-capital release and risk added.
4. **Inventory health** (`spi_health`): excess, slow-moving, non-moving, potentially obsolete, insurance spares, each a sortable list with value and months of cover and a chart.
5. **Recommendations** (`spi_reco`): the action queue (reorder now with quantity and order-by date, reduce, monitor, review obsolete, keep insurance), filters by criticality, system, equipment, supplier; CSV export; reason sentence per row.
6. **Scenario simulator** (`spi_scn`): sliders for stock level, service level, lead time and demand multipliers, scope selector; live curves of stock value, carrying cost, expected stockouts and exposure; runs `spi/engine/simulate.js` in the browser (copy of the module served as a static asset by Codex Fin) so it is instant.
7. **Ask AI** (`spi_ask`): chat panel on `POST /api/ai/ask` streaming NDJSON; shows tool steps, then the answer with citations, then the AI-proposed forecast inputs with Accept and Reject, then the resulting forecast chart. Reuses the existing assistant look (`ai.js` helpers are Codex AI's: use them, do not edit them).
8. **Data and architecture** (`spi_arch`): diagram of the six sources and the joins, the table counts, the data quality issues from `/api/data/dq`, the standards applied (`STANDARDS.md` table), the method list, the AI flow diagram of `AI_REASONING.md`, and the assumptions policy table. The brief prefers a well-justified data architecture: make this page clear and honest.
9. **Equipment drawings with stock overlay** (after the pages, P2): in the generated set pages show each part in its zone coloured by stock status; legend; click a part opens the Forecast page. Hand-tune `cases/spi/geo/` for the 2 or 3 sets that go in the demo. 3D only if hours remain.

## Rules
Performance budget in `CLAUDE.md` (first screen about 1 s, nothing at start-up that can wait for idle, no work when the tab is hidden). Charts: one axis only, no dual-axis, colour follows meaning (risk red, caution amber, OK green, excess grey), 2 px lines, direct labels, a table view for every chart, a legend for two or more series; use the `dataviz` skill and validate palettes. Text: plain engineer English, no em or en dashes, no emoji, `%` symbol, units after a space, label every assumption, estimates say "Estimate". No page may show an invented number: if the API gives none, show "Not in baseline data". Screenshots of every finished page into `docs/spi/shots/` for the deck (Codex Fin uses them).

## Tests
`node tools/case_shots.js dist/index.html /tmp/shots --quick` shows 0 script errors; `tests/spi_ui*.js` (you write): each page renders with the fixtures, empty state and error state are readable. Layout audit `node tests/layout.js --quick --strict` clean for the new pages.

## Done when
All pages live on Vercel with the real API, readable at laptop and phone width, screenshots delivered.
