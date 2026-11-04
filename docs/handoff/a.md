# Handoff note, Claude A (SPI case)

**Updated:** 2026-11-04 (afternoon UTC)   **Branch:** claude/great-tesla-l0uw33   **Deploy:** Vercel, `python3 build.py spi`, one function `api/router.mjs`, push to `main` only at checkpoints (free plan, one deployment per push; `vercel.json` stops builds of the other branches).

## State
- Five tabs (`spi_hub.js`, `SPI_HUBS`). Overview: Equipment library 3D, Summary (B), Brief coverage, Method and validation, Data and architecture. Inventory: Find, Stock health, Locations, Parts, Registers, Documents and log. Maintenance: board, Equipment and failures, Maintenance-driven demand, Turnaround readiness, Open work and spares, Equipment 3D, Protective devices. Forecasting and Simulation: Demand predictability, Portfolio forecast, Decision board, Part forecast, Parameters, Cost-risk optimiser, Scenario simulator, Policy backtest, Ask the AI. Costs: Cost-risk balance, Cost reduction, Cash plan, Business impact, Engine finance detail.
- Every new view draws from one payload `GET /api/view/<name>` (`server/_lib/views.mjs`, list in `docs/spi/VIEW_PAYLOADS.md`); the assistant reads the same payloads (`get_view` tool, `spi/ai/views_route.js`). Forecast results come from `spi/db/views.sqlite` (slim copy of the validated batch plans, `tools/spi_slim_results.py`). `results.sqlite` (168 MB) is untracked.
- Findings behind the views: `docs/spi/DATA_FINDINGS_2.md`. Plan: `docs/spi/PLAN_FORECAST_SIM.md`.
- Tests: `node tests/spi_views.js` (30), `tests/spi_data.js full` (40), `tests/spi_pages.js full`, `tests/spi_ai_views.js` (16), all spi_ai*/spi_engine* tests, `tests/live.js` after `python3 build.py lldpe`.

- Assistant knowledge layer (`spi/ai/scope.js`): FTS5 temp tables, glossary (pump->PP, heat exchanger->HE ...), date parser, tools find_entities, describe_scope, activity_on_date; `scopeRoute` runs before the search_parts fallback and for dates. Chat renders bold, links part numbers, folds evidence. Test: `node tests/spi_ai_scope_eval.js`.

## Open
- Gemini not connected (owner sets AI_PROVIDER, AI_API_KEY, AI_MODEL in Vercel, then selftest).
- Dynamic Min outliers (424 parts above 3 times lead-time demand) are flagged on Parameters, not capped.
- Engine finance detail (Codex Fin) shows a different release figure (IDR 139 bn policy) from the Cost reduction view (B and C 14.7 bn gross, S and A under review): both are labelled; reconcile in the deck.
- Old-plant pages are hidden, not deleted. Deck and zip (`tools/spi_zip.sh`) still to do.

## Gotchas
- All spi modules share one global scope; prefix names (A: spfs, spmv, spcv, spmt, SPSIM). Static check flags duplicate CSS classes with style3d.css.
- Never run a build while a test that reads `dist/index.html` is running. Never `git add -A` with results.sqlite present (168 MB, GitHub rejects it); it is in .gitignore.
