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

## Ready to merge: brief 2, step A refresh
- Merged main 98b1f5c and recomputed both complete AI/mock and Fin portfolio batches. All 7,481 materials completed, zero failures. Rebuilt results.sqlite.gz and checksum manifest; no old result rows were reused.
- Manifest explicitly records sample-variance CV2, class counts (intermittent 336, lumpy 231), workbook reconciliation for 7,481 materials, and mutually exclusive B/C gross candidates IDR 14,733,770,130 (Estimate from /api/data/savings).
- Golden evaluation: mock 43/43; fake Gemini REST 43/43; no failures. Workbook reconciliation passed using Python 3.13 with temporary dependencies. Real Gemini remains unverified.
- Before this push: 263 AI core checks, 34 full API checks, all 14 SPI pages and legacy live suite passed. Snapshot integrity/horizon/quantile checks passed. The earlier page latency failure did not recur in this run.
## Waiting on
- Next: clean read-only data.js layer, shared by evidence and tools, then expanded tools and injection tests as specified in spi_codex_ai_2.md. No key requested. Remaining account usage is unavailable.

## Ready to merge: brief 2, typed read-only data boundary
- Added spi/ai/data.js and wired evidence.js and material-reading tools through it. Typed part_profile/location_profile objects, source IDs, dq_issue/profile flags, cut-off, units, explicit assumptions and missing-value display. Material stock is never summed across locations; location values are non-additive. Last usable IDR PO item amount stays an estimated unit price; missing prices stay null.
- Completed planning proxy intervals exclude negative/zero and >365-day values, report n and pool_n, and retain the procurement-proxy label. On-hand-only inventory, assumed criticality order, zero-demand caution and insurance protection are explicit. Non Stock holdings and Max 0 are flagged and excluded from release-candidate arithmetic; no object authorises disposal.
- Bounded lists, strict unknown-filter rejection, cache cap and copy isolation. No free SQL; evidence/tools no longer execute material SQL directly. Rules planner consumes typed quality arrays.
- Tests reconcile all 7,481 material stocks, prices and classifications, all 43 golden values and the workbook. Both drivers pass, including an interface exposing only prepare/get/all/run and exec. Core and real-engine fixture integration and Ask guards pass. Required pre-push suites are being completed before publication.
## Waiting on
- Next: finish typed wrappers for all aggregate and engine endpoints, contextual assumptions in answers and database-text injection tests. Fin/A own engine release policy: data objects clearly protect Non Stock/Max 0 and never authorise disposal; keep that protection when engine recommendations are reviewed. No real Gemini key available; no key requested. Remaining account usage is unavailable.
- Typed-boundary publication checks completed: AI core 263, full data API 34, all 14 SPI pages, legacy live suite, all-material typed/workbook tests and golden 43/43 mock plus fake Gemini REST all pass.

## Ready to merge: brief 2, aggregate and engine tools
- Typed wrappers now cover locations/location, maintenance, projection, savings, stock-health, campaigns, validated forecast, scoped optimise/simulate and the generated Fin engine report. Records carry source IDs, cut-off, quality, units and assumptions; lists are bounded. Location evidence uses canonical loc:<funcloc>; monthly maintenance evidence uses maint:<month>.
- Added procurement findings from fixed SQL: within-material price bands, PO spend versus issued/stock values, and an explicit policy that no demonstrated rush-order premium supports a saving. No savings are based on PO spend. Gross B/C candidates reconcile to IDR 14,733,770,130 (Estimate).
- Answers state relevant proxy, assumed-criticality, on-hand-only and synthetic-estimate caveats. Number validation accepts supported thousands separators and rejects invented figures. Unsafe model answers fall back rather than displaying protective-function bypass instructions. Untrusted descriptions are not echoed by deterministic profile answers.
- Tool tests exercise all twelve endpoint/report/finding families, typed metadata, canonical IDs, scope limits, exact savings/campaign values, procurement ratios and contextual caveats. Golden evaluation remains 43/43 mock and fake Gemini REST.
## Waiting on
- Next working piece: hostile database text tests, contextual follow-ups and chart responses requested by the human. The structured data and engine remain the only source of plotted numbers. Real Gemini and live deployment remain unverified without secure human configuration. Remaining account usage is unavailable.
- Aggregate-tool pre-push checks completed: AI core, full data API, all 14 SPI pages, golden evaluation and legacy live suite pass.

## Ready to merge: contextual chart answers and hostile-text guards
- Conversation/page context selects a material or location for follow-ups; explicit entities override it. History searches, forecasts and stock questions read the database and emit sourced chart payloads. Unknown context fields return 400 before NDJSON streaming.
- Ask and the existing assistant render tool-derived history, stock thresholds, limited search results, location indicators, campaign orders, planned items, maintenance counts, mutually exclusive savings, overlapping stock flags, rules value projections and engine portfolio counts. Material p10/p50/p90 remains the actual engine output. Gemini cannot invent chart values. Legacy u/a history is normalised and Stop cancels the transport; footer identifies the last answer's provider.
- Tests poison actual material and notification text in a copied database. Delimiters stay escaped; fake SQL tools cannot write; forged citations, unsafe answers/plans/driver rationales and invented model charts are rejected. Safety guard was strengthened, not weakened.
- Browser tests verify pronoun follow-up -> same material -> six-month SQL chart -> engine forecast chart; accepted proposal -> validated rerun -> chart redraw. Existing assistant history, charts, cancellation and safety refusal also pass. API tests verify chart NDJSON and context validation. Golden questions remain 43/43 mock and fake Gemini REST; health one-word/redaction tests pass.
## Waiting on
- Final full mock recomputation is running against the typed-boundary code, so the published artifact can match the final reasoning pipeline. Claude A must restore the compressed results before Vercel packaging, merge this branch and deploy. Human sets the key securely and checks /api/ai/health; real Gemini is still unverified. Remaining account usage is unavailable.
- Context/chart publication checks completed: AI core 263, full API 34, real-engine fixture 239, all 14 SPI pages, Ask/Forecast browser workflows, golden 43/43 mock and fake Gemini REST, injection/context/API/health checks and legacy live suite all pass. Final typed-boundary mock batch also completed 7,481/7,481 with zero failures; its refreshed artifact is the next push.
