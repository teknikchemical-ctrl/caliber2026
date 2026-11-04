**Branch:** codex/ai | **Baseline:** 18ceea9 | **Commit:** see git log -1.
## Ready to merge
- Database -> evidence -> mock/Gemini reasoning -> validator -> backtest gate -> deterministic engine -> Forecast chart is wired through spi/ai/execute.js and POST /api/ai/plan. Handlers are server/ai/plan.mjs and health.mjs behind the single router. GET /api/ai/health probes the configured provider, with deployment identity and no key disclosure. SPI sync no longer requests absent Netlify routes.
- Forecast page: real part search, zero-filled history, direct engine p10/p50/p90 chart and table, selected plan/provider, evidence/validation/backtest trace, inventory/recommendation and driver Accept/Reject. Accepted inputs are revalidated before rerun; unaccepted AI proposals never alter the executed forecast. Stale predictions clear while rerunning.
- Campaign evidence and rule inputs are integrated from Claude A's campaign module. Every retained input keeps matching evidence IDs; truncation drops unsupported inputs. Structural and numeric guards remain in force.
- Codex Fin engine is now merged on main and integrated using its real exports. The normal production loader and all 237 fixture parts pass; six demand-class samples from the full database pass. No engine files edited. Claude A merges this branch and deploys for Vercel verification.
- Tests: 258 core checks; all 237 fixture parts passed actual database -> reasoning -> real engine integration. Browser verified real history, exact engine chart/table quantiles, accepted-input redraw, and pending-engine honesty. All seven SPI pages load with full API. Old-site live passed; quick build/static passed and regression remains blocked by file-URL policy.
## Interface notes
- Engine contract used: contextFor(db,id), runPlan(plan,context), backtest(plan,context). Compare candidate error against an independently evaluated rules plan. Orchestration owns adoption and sets enforce_backtest:false; do not silently apply a second engine baseline. Sparse/missing backtests are not a pass.
- No engine in production means result:null/status:engine_pending, never a fake forecast. Reasoning provider in the chart test was explicitly synthetic; ordinary mock/rules API mode was also tested with the real engine. Live Gemini and Vercel are not verified. Engine tests are tests/spi_ai_engine_integration.js; SPI_TEST_ENGINE may point to a published candidate for independent integration testing. The final browser test used the real merged engine.
## Next / waiting on
- Claude A: merge this branch and deploy Vercel; human: set AI_PROVIDER/AI_API_KEY/AI_MODEL securely and verify /api/ai/health plus a real part forecast. No key in chat, no main push, no PR.
- Remaining wider-role work: Ask AI/tool loop, resumable AI batch/results.sqlite and golden question evaluation. Latest inbox resolves target persistence and zero-history add_qty bounds; zero-history add_qty validation is now updated and tested (261 core checks). Current inbox read and acknowledged here because inbox is outside the human's edit list.

- Remaining account usage is not exposed by this client. Chart wiring is committed and pushed immediately; next pieces are Ask AI, batch and golden questions.
- Ready to merge: zero-history additions require installed-capacity bounds, two independent origins and sparse_history. Scope target schema is consumed unchanged.

## Ready to merge: Forecast extension after latest main
- Preserved Claude A's Forecast base page and integrated AI planning through SPI_FORECAST_HOOKS. The selected AI/rules plan has its own labelled chart, validated Accept/Reject ledger, evidence and adoption trace. Base inventory, backtest and assumptions panels remain intact.
- Browser verification passed against the real merged engine: exact SQL history and engine quantiles, malformed-response handling, accepted-input rerun and chart redraw.
- Chart integration was already pushed in 9850fc1; this merge resolves the later base-page addition. Ask AI and batch are the next working pieces. Remaining account usage is unavailable in this client.

## Ready to merge: Ask AI and golden evaluation
- Added server/ai/ask.mjs, bounded read-only tool loop, typed data/engine tools, fixed parameterised SQL metric catalogue and NDJSON transport. No raw SQL accepted. Citation, number, schema and proposal bounds are checked; model failures fall back with readable trace. Prompt budgeting preserves valid JSON.
- Ask page and legacy assistant in SPI mode use the new service. Safety refusal is preserved. Proposed inputs are never silently executed; browser Accept calls the validated plan endpoint and redraws from the real engine result.
- Golden evaluation after main's sample-CV2 update: mock 43/43 and local fake Gemini REST 43/43. Real Gemini is not tested. Production does not load the golden answers. Added workbook cautions for procurement proxy, assumed criticality order and on-hand inventory.
- Tests passed: Ask guardrails, NDJSON API, real-engine browser SQL answer/citations/acceptance/chart, all eight registered SPI pages. Prior chart test passed with the shared Forecast extension hook. Exact Vercel key setup is in docs/AI_ASSISTANT.md.
## Waiting on
- Claude A: merge and deploy; run npm run test:quick. Human: set the key securely in Vercel, redeploy and verify /api/ai/health. No real key is available here, and the environment proxy does not permit this Vercel host.
- Next: deterministic resumable batch and results persistence. Remaining account usage is unavailable in this client.

## Ready to merge: resumable offline batch
- Added spi/ai/batch.js. Deterministic material order, AI for demand/S/A eligibility when a key is configured, rules for the remaining portfolio. Namespaced identities fingerprint baseline data, code and provider settings. Each part transaction writes ai_run, forecast_plan, forecast_input (including scope target), forecast, inventory_param and recommendation through the existing engine output. Other writers' rows are preserved.
- Tests cover all contract tables, idempotent resume, source-data invalidation, preserved foreign rows, transaction rollback, failed-run retry and incomplete-result repair. Gemini token usage is logged; unreliable accounting is marked incomplete.
## Waiting on
- Next working piece: run the complete mock portfolio and publish its generated results artifact. Real-key M3/M5 runs and live Vercel health still require the human's securely configured environment. Remaining account usage is unavailable.

## Ready to merge: checked snapshot restore
- Added spi/ai/restore_results.js for the compressed batch snapshot. It verifies baseline, archive and restored SQLite SHA-256 checksums, restores atomically, and refuses to overwrite a different existing results file. Tests pass for restore, idempotence, baseline mismatch, archive corruption and another writer's file.
- The complete mock batch is still running without failures. Codex Fin's full portfolio batch completed separately; its engine-owned rows will be combined with the AI-owned snapshot after completion. A compressed artifact avoids GitHub's single-file size limit without removing traceability.
- Legacy Netlify live checks passed after the SPI assistant change. Latest SPI checks passed against merged main: 239 fixture integrations, all 14 pages, Forecast and Ask browser workflows. Account usage remains unavailable.
## Waiting on
- Claude A: when the snapshot lands, add `node spi/ai/restore_results.js` before deployment packaging so spi/db/results.sqlite is present. Do not overwrite a different active results file; merge its rows or rebuild instead. The snapshot and manifest are the next immediate push.

## Ready to merge: explicit health call result
- /api/ai/health now requires the configured model to return the explicit one-word result READY in structured JSON. It reports one_word_result, responding model, key_present boolean, attempts, last_error and deployment commit. Mock is explicitly labelled. Error/attempt strings redact any echoed configured key.
- One-word probe, cache, readable failures and credential-redaction tests pass, as does the updated single-router API test.
- Full mock reasoning batch completed 7,481/7,481, zero failures, zero Gemini calls. Snapshot combination and checksum verification are in progress. Real-key M3/M5 runs remain pending secure human configuration; usage balance is unavailable.
