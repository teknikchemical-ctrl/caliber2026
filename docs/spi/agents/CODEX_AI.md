# Role: Codex AI, the reasoning agent between the database and the forecasting scripts

Branch `codex/ai`. This replaces your earlier assistant-only brief for this case (keep what you built: provider chain, discovery, diagnostics, `docs/AI_ASSISTANT.md`; port it to Vercel). Read `docs/spi/AI_REASONING.md` first: it is the design you implement. You may edit that file when the design changes; tell Claude A in your handoff.

## Your files
`spi/ai/**`, `api/ai/**`, `tests/spi_ai*.js`, `docs/spi/AI_REASONING.md`, `docs/AI_ASSISTANT.md`, `src/modules/ai.js ai2.js sync.js intent.js facts.js`, `netlify/functions/*` (old site, only if needed), `tests/live.js`, `docs/handoff/codex-ai.md`.
Not yours: `spi/engine` (Codex Fin) and `spi/db` (Claude A). Call the engine through its documented functions; until it exists, stub `runPlan` to return the contract shape from `spi/contracts/forecast_result.schema.json`.

## Tasks in order
1. **C1 Providers (M1).** `spi/ai/providers/{gemini,mock}.js` with the interface of `AI_REASONING.md`. Port the model chain, discovery, retry on 429 and 5xx, per-call timeout, JSON mode with schema from `netlify/functions`. `AI_PROVIDER=mock` is the default. Test with a fake Gemini server (reuse the one in `tests/live.js`).
2. **C2 Evidence pack (M1).** `spi/ai/evidence.js(db, material_no)` against `spi/fixtures/mini.sqlite` and the schema: ids on every fact, token budget, untrusted-text delimiters.
3. **C3 Rules planner and validator (M1).** `rules_planner.js` (also the backtest baseline) and `validate.js` implementing every bound in the schemas and in the guardrails.
4. **C4 `POST /api/ai/plan` (M2).** Evidence -> planner (Gemini, fallback rules) -> validator -> `engine.runPlan` -> backtest gate (engine provides `backtest(plan)`) -> response `{plan, result, trace, provider, adopted}`. Never return a 500 for model trouble: fall back to rules and say why in `trace`.
5. **C5 Tools and Flow B (M3).** `spi/ai/tools.js` (catalogue in `AI_REASONING.md`), `spi/ai/ask.js` the tool loop (max 5 calls), AI projection into ForecastInput proposals, validator, engine re-run, answer composed from tool results with citations and the number check. `POST /api/ai/ask` streams NDJSON as defined in `ARCHITECTURE.md`. Wire the new tools into the page assistant (`ai.js`: `AI.tools`, `aiRoute`) so the existing assistant UI keeps working.
6. **C6 Batch (M3).** `spi/ai/batch.js`: for every part with demand and every S or A part, run Flow A (AI if a key is present in the environment, else rules) and write `spi/db/results.sqlite` (`schema_results.sql`) together with Codex Fin's batch of the portfolio. Deterministic order, resumable, writes `ai_run` rows, logs cost in tokens. Run it with the human's key once at M3 and once at M5.
7. **C7 Evaluate (M4).** Run `spi/eval` golden questions through the assistant (mock and Gemini); report the pass rate and failures in your handoff; fix what you own.
8. **C8 Connect the key (M2, then M5).** `GET /api/ai/health` (provider, model, key present true or false, last error, a real one-word call with the model chain result, deployment commit). Write for a non-technical human the exact steps to set `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` in Vercel and read the health page, in `docs/AI_ASSISTANT.md` (Vercel section). Never ask for the key in chat.

## Pages you now also own (reassigned from Claude B, who is out of usage)
`src/modules/spi_forecast.js` (Forecast page) and `src/modules/spi_ask.js` (Ask AI page), exactly as specified in items 2 and 7 of `docs/spi/agents/B.md`, using the shell of Claude A (`spi_core.js`: `spiApi(path, body)`, `spiCss(id, css)`, chart helpers, page registration). Keep them simple and readable: one chart, one table, one panel. Tests `tests/spi_ui_ai*.js`; `node tools/case_shots.js dist/index.html /tmp/shots --quick` must show 0 script errors. Order: after C3 (plan endpoint), build the Forecast page; after C4 the Ask page.

## Tests (`tests/spi_ai*.js`)
As listed at the bottom of `AI_REASONING.md`. Run `AI_PROVIDER=mock node tests/spi_ai.js`, `node tests/live.js` (old Netlify path must still pass) and `npm run test:quick`; `bash tools/baseline_check.sh ai` before every push. Note: your browser policy blocks file URLs in `tests/regress.js`: Claude A runs it.

## Done when
`POST /api/ai/plan` and `/ask` work with mock and with Gemini on the Vercel URL, every AI output is validated and traceable, batch results are in `results.sqlite`, the health page is green with the human's key, golden questions pass.
