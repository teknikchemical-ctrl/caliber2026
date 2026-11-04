# Architecture

## Decisions (made, do not reopen without writing why in `docs/TASKS.md`)
1. **One product, two halves.** The existing engine (single HTML page, pages, equipment sets, drawings, plot plan, assistant UI, reports, roles) stays and is fed by case pack `cases/spi/`. New spare-part pages are new modules `src/modules/spi_*.js` calling new Vercel functions. Reuse beats rebuild. The old Netlify site and the `lldpe` and `mock-cdu` cases are not touched.
2. **Vercel + SQLite, genuinely dynamic.** The page is served as a static asset, but every spare-part screen gets its data from `/api/*` Vercel functions that query `spi/db/spi.sqlite` (read-only) and run the engine. This meets "MVP, not static HTML, SQLite".
3. **The math lives in one place: `spi/engine` (JavaScript ES modules).** It runs in the Vercel functions, in Node batch jobs and in the browser (scenario sliders). No second implementation in Python. Python is only for the ETL (pandas).
4. **The AI is a reasoning intermediary, never the calculator.** It reads evidence from the database, decides method, parameters and driver adjustments as structured JSON, a validator bounds that JSON, the engine computes. Every AI number must trace to an evidence id or a tool result.
5. **Stateless interactive calls.** Vercel's file system is read-only. Interactive AI results are returned to the browser, kept in browser storage and re-sent when needed. Batch results (AI and rules) are computed offline into `spi/db/results.sqlite` (schema in `schema_results.sql`), attached to the main database at run time as `res`, and shipped in the zip. The deck and the app say that production would use PostgreSQL.
6. **Works without a key.** Provider `mock` (rules planner) produces plans, forecasts and recommendations with no AI. With a Gemini key the agent takes over the reasoning. The UI always shows which one produced a result.
7. **Generated files rule exception:** `spi/db/spi.sqlite` (Claude A) and `spi/db/results.sqlite` (Codex AI and Codex Fin batch scripts) are committed, because the zip and Vercel need them. Two files so that commits never collide. Commit them only at milestones to keep git history small.

## Layers and data flow
```
spi/data/raw/*.xlsx
      | spi/etl (Python, Claude A)
      v
spi/db/spi.sqlite   clean tables, part_profile, demand_month, equipment_set, dq_issue     (schema.sql)
      |                                  ^ attached as 'res': spi/db/results.sqlite (ai_run, forecast_input, forecast_plan, forecast, inventory_param, recommendation)
      | api/data/* (read)                |
      v                                  |
spi/ai  Evidence Pack -> Reasoning Agent (Gemini or rules) -> ForecastPlan JSON -> Validator
      |                                                                   |
      |   Flow B: question -> tools (read-only) -> ForecastInput proposals |
      v                                                                   v
spi/engine  classify | methods | runPlan -> ForecastResult | optimise | recommend | simulate | backtest
      |
      v
api/engine/* , api/ai/*  (Vercel functions)  ->  src/modules/spi_*.js (pages, charts)  +  case pack pages (equipment, drawings)
```

## Repo layout and owners (one owner per folder; `tools/baseline_check.sh <role>` enforces it)
| Path | Owner | Content |
|---|---|---|
| `spi/data`, `spi/etl`, `spi/db`, `spi/fixtures`, `spi/contracts`, `spi/eval`, `api/_lib`, `api/data`, `vercel.json`, `package.json`, `build.py`, `cases/spi/*` (except `geo/`), `docs/spi/*.md` (except those listed below) | **Claude A** | data, contracts, integration, deploy |
| `src/modules/spi_*.js`, `src/modules/style_spi.css`, `cases/spi/geo/**`, the older 3D files | **Claude B** | all spare-part pages, charts, drawings, UI polish |
| `spi/ai`, `api/ai`, `src/modules/ai.js ai2.js sync.js intent.js facts.js`, `tests/spi_ai*.js`, `docs/spi/AI_REASONING.md`, old `netlify/functions` | **Codex AI** | reasoning agent, providers, tools, assistant |
| `spi/engine`, `api/engine`, `tests/spi_engine*.js`, `finance/spi`, `deck/spi`, `docs/spi/FORECASTING.md`, `docs/spi/BUSINESS_CASE.md`, `src/modules/fin.js` | **Codex Fin** | forecasting and optimisation engine, business case, deck |

## Vercel and SQLite specifics (verify in the spikes, `TIMELINE.md`)
- `vercel.json`: build command `python3 build.py spi` (produces `dist/index.html`), output directory `dist`, functions in `api/**` on Node 22, `includeFiles: "spi/db/*.sqlite"` for each function that opens it, `maxDuration` 60.
- DB access: `better-sqlite3` opened with `{ readonly: true, fileMustExist: true }` from `api/_lib/db.js` (one shared helper). Fallback if the native module fails on Vercel: `sql.js` (WASM) loading the same file.
- Fallback if Vercel cannot run `python3 build.py`: commit the built `public/index.html` for the final deploy only (Claude A decides).
- Secrets: `AI_API_KEY` (Gemini) as a Vercel environment variable, never in the repo, never in chat. `AI_PROVIDER=mock` is the safe default.
- Function budget: one model call 8 s, whole request 25 s, then fall back to the rules planner and say so.

## API surface (stable names; owners implement, UI codes against them)
- `GET /api/data/summary` (KPIs), `/api/data/parts?q=&class=&crit=&action=&limit=` , `/api/data/part/:material_no` (profile, series, bom, po, notifications, pm), `/api/data/equipment/:tag`, `/api/data/dq`, `/api/data/architecture` (A)
- `POST /api/engine/forecast` `{material_no, plan?, inputs?, horizon}` returns ForecastResult. `POST /api/engine/optimise` `{filters, policy}` portfolio view. `POST /api/engine/simulate` `{scope, stock_multiplier, service_level, lead_time_multiplier}` cost-risk curve. `GET /api/engine/health` inventory health lists (Codex Fin)
- `POST /api/ai/plan` `{material_no, mode}` returns ForecastPlan plus ForecastResult plus trace. `POST /api/ai/ask` `{question, history, inputs_accepted}` streams NDJSON `{delta}`, `{trace}`, `{inputs:[ForecastInput]}`, `{result: ForecastResult}`, `{done}`. `GET /api/ai/health` (provider, model, key present, last error) (Codex AI)
All responses are JSON, errors are `{error:"plain words"}` with a proper status. No endpoint accepts raw SQL.

## Vercel function format (decided, tested)
Every function is an ES module `api/<area>/<name>.mjs` with `export default function handler(req, res)` (Node runtime, Node 22). Shared code: `api/_lib/db.mjs` (`openDb()` read-only, attaches `res`), `api/_lib/http.mjs` (`json`, `fail`). The engine and the AI modules in `spi/` are plain ES modules (`.mjs` or `.js` with explicit imports) imported by the functions. `vercel.json` sets `outputDirectory: dist`, `buildCommand: python3 build.py` and `includeFiles` for `spi/**/*.{sqlite,sql,json}` on every function. Streaming: write NDJSON lines with `res.write()` and `res.end()`.
