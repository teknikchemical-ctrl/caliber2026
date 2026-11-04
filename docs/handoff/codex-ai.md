# Codex AI handoff

Branch: codex/ai. Baseline merged: 25d993e. Current commit: see git log -1.

## Ready to merge

- Database -> evidence -> mock/Gemini planner -> validator -> independently compared backtest -> real deterministic engine -> chart is implemented. Handlers are server/ai/health.mjs, plan.mjs and ask.mjs behind the single router. No new api/ functions, engine edits or baseline database edits.
- Health requires a real structured READY result through the model chain. Reports provider, model, key_present boolean, one_word_result, last_error, attempts and deployment commit. Mock explicitly states that it is not a real Gemini call. Echoed keys are redacted.
- Forecast preserves Claude A's base page and extends SPI_FORECAST_HOOKS with selected-plan chart/table, evidence, validator/backtest trace and Accept/Reject ledger. Base rules panels remain available. Accepted proposals are revalidated and rerun; selected chart values follow the engine response exactly. Unaccepted AI inputs never silently change the executed forecast.
- Ask AI streams NDJSON trace/delta/inputs/result/done. Typed, bounded read-only SQL/data/engine tools make at most five calls. Final citations and numbers are checked. Model or validation trouble falls back to available database facts with a readable trace. Legacy assistant routes to SPI in SPI mode; safety refusal stays active. Prompt budgeting retains valid JSON.
- Campaign module inputs and evidence are integrated. Workbook cautions appear in answers/docs: procurement lead time is a PR-to-PO-delivery proxy, S/A/B/C ordering is assumed, inventory position is on-hand only. Monetary values are Estimates; baseline data is synthetic.
- Batch code is published and tested: deterministic order, fingerprinted resume, per-part transactions, source targets, preserved foreign rows, rollback and incomplete-result repair. Generated snapshot metadata is excluded from runtime fingerprints. Invalid batch limits are rejected.
- Full mock reasoning batch: 7,481/7,481 completed, zero failures, zero Gemini calls/tokens. Full snapshot resume verified all 7,481 parts skipped with no duplicate results. Codex Fin's full portfolio batch also completed. Combined snapshot has 7,481 ai_run and forecast_plan rows, 22,443 forecast_input rows, 179,544 monthly forecasts, 14,962 inventory rows and 14,962 recommendations.
- Compressed snapshot: spi/ai/results.sqlite.gz (7,669,284 bytes); uncompressed SQLite is 168,067,072 bytes, above GitHub's file limit. Manifest includes baseline/archive/SQLite SHA-256 checksums and exact counts. Restore refuses a different baseline or existing result file. Published-snapshot tests restore it and verify integrity, full horizons, quantiles, inventory bounds and ledger targets.

## Validation

- 263 core checks, including 239 fixture parts; all fixture database -> reasoning -> actual engine integrations pass.
- 43/43 golden questions in mock mode; 43/43 through a local fake Gemini REST server. Production never imports golden answers. Real Gemini is unverified.
- 34 full-database API checks pass. An earlier full run loaded all 14 SPI pages. Final cold-page checks with the combined snapshot failed: Optimisation remained Loading past the 20 s test wait, then Outlook and Recommendations were delayed. Forecast and Ask passed. No script errors. Browser tests verify database history, exact engine p10/p50/p90 chart values, Accept rerun/redraw, streamed SQL answers/citations, Ask chart acceptance and no stale predictions after invalid responses.
- Ask guardrails, NDJSON API, one-word health/redaction, batch/resume/rollback and archive restore checks pass.
- Legacy Netlify live suite passes. Claude A runs npm run test:quick because the environment browser policy blocks file URLs.

## Waiting on

1. Claude A / Codex Fin: investigate cold full-portfolio Optimisation latency in server/engine/optimise.mjs -> portfolio before claiming the entire app is green. Final tests/spi_pages.js full failed on its Loading state and delayed later pages; owned AI pages and data/AI checks passed. No engine/page files outside AI ownership were changed.
2. Claude A: merge codex/ai and deploy. Before Vercel packaging, run `node spi/ai/restore_results.js` to materialize spi/db/results.sqlite. This restores the combined AI and Fin snapshot; preserve or merge any different active result file instead of overwriting it. Build/router ownership stays with Claude A.
3. Human: Vercel > project > Settings > Environment Variables: AI_PROVIDER=gemini, AI_API_KEY with Sensitive enabled, AI_MODEL=gemini-flash-latest. Select Production and Preview as needed, save, then Deployments > deployment menu > Redeploy. Open /api/ai/health and verify READY, model and deployed commit. Exact steps are in docs/AI_ASSISTANT.md. Never send the key in chat.
4. Real Gemini answers, Vercel execution and real-key M3/M5 batches are not verified. No real key is available here. The managed environment's enforced outbound policy does not allow the supplied Vercel host; a proxy denial does not establish that the site itself failed.
5. Existing inbox entries are acknowledged here, including sample-CV2 golden changes and shared Forecast extension. Inbox is outside the human's file ownership list, so it was not edited. No unresolved implementation request from that inbox remains; live deployment/key steps require Claude A and the human.

Remaining account usage is unavailable in this client. No main push and no pull request.
