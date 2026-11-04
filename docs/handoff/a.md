# Handoff note, Claude A (SPI case)

**Updated:** 2026-11-04 (afternoon UTC)   **Branch:** claude/great-tesla-l0uw33   **Deploy:** Vercel, `python3 build.py spi`, one function `api/router.mjs`, push to `main` only at checkpoints (free plan, one deployment per push; `vercel.json` stops builds of the other branches).

## State
- Five tabs (`spi_hub.js`, `SPI_HUBS`). Overview: Equipment library 3D, Summary (B), Brief coverage, Method and validation, Data and architecture. Inventory: Find, Stock health, Locations, Parts, Registers, Documents and log. Maintenance: board, Equipment and failures, Maintenance-driven demand, Turnaround readiness, Open work and spares, Equipment 3D, Protective devices. Forecasting and Simulation: Demand predictability, Portfolio forecast, Decision board, Part forecast, Parameters, Cost-risk optimiser, Scenario simulator, Policy backtest, Ask the AI. Costs: Cost-risk balance, Cost reduction, Cash plan, Business impact, Engine finance detail.
- Every new view draws from one payload `GET /api/view/<name>` (`server/_lib/views.mjs`, list in `docs/spi/VIEW_PAYLOADS.md`); the assistant reads the same payloads (`get_view` tool, `spi/ai/views_route.js`). Forecast results come from `spi/db/views.sqlite` (slim copy of the validated batch plans, `tools/spi_slim_results.py`). `results.sqlite` (168 MB) is untracked.
- Findings behind the views: `docs/spi/DATA_FINDINGS_2.md`. Plan: `docs/spi/PLAN_FORECAST_SIM.md`.
- Tests: `node tests/spi_views.js` (30), `tests/spi_data.js full` (40), `tests/spi_pages.js full`, `tests/spi_ai_views.js` (16), all spi_ai*/spi_engine* tests, `tests/live.js` after `python3 build.py lldpe`.

- Assistant knowledge layer (`spi/ai/scope.js`): FTS5 temp tables, glossary (pump->PP, heat exchanger->HE ...), date parser, tools find_entities, describe_scope, activity_on_date; `scopeRoute` runs before the search_parts fallback and for dates. Chat renders bold, links part numbers, folds evidence. Test: `node tests/spi_ai_scope_eval.js`.

- Assistant layer (all in `spi/ai/`): `scope.js` (FTS5, classes, dates, part codes, document numbers, suppliers), `pages.js` (every tab summarised from its own endpoint; the 21 case points from Claude B's `/api/ws/questions` as paragraphs; part plan from `/api/ws/advice`), `screen.js` (the tool on screen via `context.view`, answer buttons), `dbread.js` (data dictionary, safe record queries and counts over any table). Tests: `tests/spi_ai_scope_eval.js`, visible text audit `tests/spi_text_audit.js`.
- Database polish after the ETL: `spi/etl/polish_db.py` (whitespace, indexes, `data_dictionary`, three new quality findings).

- Learned demand model: `spi/ml/train.py` (numpy, python3.13, about 1 minute) writes ml_model, ml_eval, ml_forecast, ml_flag into spi.sqlite; read by `spi/ai/ml.js` (tools ml_summary, ml_part, ml_flags), `GET /api/data/ml`, and the Model validation tab (added to Forecasting and Simulation by `spi_hub.js`). Retrain after any data change; it runs in `spi/etl/run_all.sh`.

- Economics: one contract `spi/contracts/econ_assumptions.json` (service 99/97.5/95/90%, carrying 22%, order IDR 250,000, emergency premium 0, downtime IDR 100/30/5/1 mn per day). Read by `server/_lib/econ.mjs` (Claude B `server/ws/*`), `window.SPI_ECON_DEF` (build.py, for B's `SPA_DEF`); engine and finance checked by `tests/spi_econ_consistency.js`. Ledger tool `spi/ai/ledger.js` reconciles release, purchase and cost figures; `spi/ai/keyq.js` answers the two key questions.

- Timeline tab `spi_tl` (`GET /api/data/history?mat|tag|cls|all`): history (issues, value, notifications, planned tasks, PO receipts) and prediction (learned forecast and range, engine p50 and p10 to p90 for one part, campaign-repeat scenario, stock projection), switchable layers, CSV. Assistant tool `timeline` (`spi/ai/timeline.js`). Learned projection is calibrated by the held-out actual/predicted ratio (1.144).
- Review finding: the engine forecast steps up for 2026-10 to 2026-12 (about 116k a month, then 36k) because of the plan backlog stacked in the first month; shown as a separate layer and explained by the assistant.

- Golden path `server/data/golden.mjs` (optimized orders, Monte Carlo fan and stockout chance, golden against current, inputs), `status.mjs`, `events.mjs`; AI box `src/modules/spi_ai_box.js` + `POST /api/ai/explain` (`spi/ai/explain.js`, Gemini checked against the payload, rules otherwise); browser log of feature runs sent as `context.view.recent`; assistant tools golden_path, plant_status (`spi/ai/golden_ai.js`). Contracts for Claude B in docs/TASKS.md.

## Open
- Gemini not connected (owner sets AI_PROVIDER, AI_API_KEY, AI_MODEL in Vercel, then selftest).
- Dynamic Min outliers (424 parts above 3 times lead-time demand) are flagged on Parameters, not capped.
- Engine finance detail (Codex Fin) shows a different release figure (IDR 139 bn policy) from the Cost reduction view (B and C 14.7 bn gross, S and A under review): both are labelled; reconcile in the deck.
- Old-plant pages are hidden, not deleted. Deck and zip (`tools/spi_zip.sh`) still to do.

## Gotchas
- All spi modules share one global scope; prefix names (A: spfs, spmv, spcv, spmt, SPSIM). Static check flags duplicate CSS classes with style3d.css.
- Never run a build while a test that reads `dist/index.html` is running. Never `git add -A` with results.sqlite present (168 MB, GitHub rejects it); it is in .gitignore.

## 2026-11-04 round 6 (docs/spi/PROMPT_CLAUDE_A_ROUND6.md)
- `/api/data/golden` is the single engine (Optimized Scenario): per-part policy search shared with B's evalPart, never dearer than today; steady-state totals (headline, IDR 145.25 bn a year, equal to B's ws/golden) and first-12-month Monte Carlo; per-order and per-part decision fields, history series, backtest (new table `ml_backtest` from spi/ml/train.py) and band calibration, `set=` scope, seed. Contract `spi/contracts/golden.schema.json`.
- `/api/data/events`: common fields on every event, kinds receipt and campaign, `set=`. Contract `events.schema.json`.
- AI box: structured blocks (verdict, why, do next, risk and confidence, your inputs against the recommended run), Gemini checked number by number, rules fallback. Contract `explain_reasoning.schema.json`.
- Hover: `data-kb` on every point and bar of spiAxLine and spiAxBars, small readout when B's kit is absent.
- "Golden path" renamed "Optimized Scenario" in all my text. Test: `node tests/spi_ai_reasoning.js`.
- Data note: po_line repeats some lines; history and events count each once, open quantities still sum the repeats (noted to B).
