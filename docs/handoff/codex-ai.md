# Codex AI handoff

Branch: codex/ai. Merged baseline: 34f8a77. Backend/UI integration: 42e35d4. Artifact commit: see git log -1.

## Ready to merge

- Brief 2 A to E is implemented in owned files. Merged origin/main and origin/claude/great-tesla-l0uw33; the latter was already included. Handlers remain server/ai/{health,plan,ask}.mjs behind the single router. No api/ functions, engine edits or baseline database edits.
- Final full AI/mock batch completed 7,481/7,481 with zero failures against the current merged backend fingerprint. Fin's documented batch export produced the matching current rules portfolio without writing Finance-owned generated files. Combined snapshot has 7,481 ai_run/forecast_plan rows, 22,443 inputs, 179,544 forecast months and 14,962 inventory/recommendation rows. Manifest pins source/code/archive/SQLite hashes and writer commit. Sample-variance CV2: intermittent 336, lumpy 231. B/C mutually exclusive gross candidates: IDR 14,733,770,130 (Estimate). No real Gemini calls or tokens in this mock run.
- spi/ai/data.js is the shared typed read-only boundary for evidence and material tools. Material stock is not summed across locations. Location views are non-additive. Prices are last usable IDR PO item amounts read as unit prices (Estimate), missing remains null. Completed planning proxy intervals exclude negative/zero and >365-day values, report own/pool n and label fallback Assumptions. On-hand-only position, assumed criticality order, Max 0, Non Stock holdings, insurance and zero-demand cautions are explicit. Every record has IDs, quality, units and cut-off. Bounded cache/lists, copied values and unknown-filter 400s; both SQLite drivers supported.
- Data and engine tools cover locations/location, maintenance, projection, savings, stock health, campaigns, forecast, scoped optimise/simulate, engine report and procurement findings. No free SQL or database mutations. No rush-price/PO-spend saving is inferred. Answers state relevant proxies and assumptions. Finance's six strict calculators are lazily registered with natural-language routing, stable scenario citations, safe displays and their own caveats. All financial arithmetic stays with Finance.
- Contextual follow-ups retain the selected material or infer it from bounded prior user turns. Explicit material/tag switches override context. API rejects unknown context fields before streaming. Ask and legacy assistant normalise histories, stream NDJSON and render charts from tool values; legacy Stop cancels and the footer identifies the last provider.
- Chart responses cover history, stock thresholds, searches, location indicators, campaigns, maintenance, savings, stock flags, rules value projection, portfolio actions and financial highlights. Mixed units are kept separate. Material p10/p50/p90 is the validated engine output. Accept validates and reruns before redraw. Model-generated chart fields are rejected.
- Shared visual kit adopted on Ask and the AI Forecast panel: spiHead/spiTile, spiAxLine/spiAxBars and compact tables behind spiMore. Exact values and source units retained. Forecast first view paints immediately; delayed old-material replies cannot replace current context. The flagship explorer still links to the full Forecast; no spi_fo.js edit was made.
- Hostile material and notification text tests verify escaped delimiters, rejected SQL tools, no mutation, rejected fabricated citations, unsafe plans/answers/rationales and invented charts. Safety guard strengthened. Key echoes are redacted from provider failures/attempts and health.
- Health returns provider, model, key_present boolean, real READY call result, last error, attempts and deployment commit. Mock explicitly does not verify Gemini. Exact Vercel click path is in docs/AI_ASSISTANT.md; no key requested in chat.

## Validation

- AI core: 263 checks, including 239 fixture parts. Actual database -> reasoning -> real engine fixture integration passes.
- Typed boundary reconciles all 7,481 materials and last IDR prices, all 43 golden metrics and the independent workbook. Native node:sqlite and a minimal driver interface pass.
- Golden evaluation: mock 43/43 and fake Gemini REST 43/43, zero failures. Production does not import golden answers. Real Gemini unverified.
- Full data API: 34 checks pass. Context, injection, Finance routes/citations, API streaming, health/redaction, batch rollback/resume and verified archive restore checks pass.
- Browser checks pass for contextual history -> same material -> exact SQL chart -> real engine forecast; accepted-input redraw; existing assistant history/Stop/safety; selected source units; and delayed A -> selected B response ordering.
- Legacy live suite passes. A timing-sensitive access-code test now waits for actual sync readiness/flush instead of a fixed sleep, retaining negative and positive permission assertions. No app permission rule was weakened.
- Full-page run after the current UI merge found one non-AI cold-loading failure: spi_health stayed at its 25-character Loading view beyond the test wait, zero script errors. Owned Ask and Forecast pages pass. A final rerun is recorded below when complete.

## Waiting on

1. Claude A: merge codex/ai and deploy. Run `node spi/ai/restore_results.js` before Vercel packaging to create spi/db/results.sqlite from the published gzip. It verifies baseline/archive/output checksums and refuses to overwrite a different existing result file. The uncompressed file is about 168 MB, above GitHub's file limit.
2. Claude B/A/Fin: fix Inventory health first paint and cold full-portfolio latency. The observed failure is a loading state, not an AI schema or model error. No files outside AI ownership were changed.
3. Human: Vercel > project > Settings > Environment Variables: AI_PROVIDER=gemini, AI_API_KEY with Sensitive enabled, AI_MODEL=gemini-flash-latest. Select Production/Preview as appropriate, Save, then Deployments > deployment menu > Redeploy. Open /api/ai/health and verify READY, responding model and deployment commit. Never paste the key in chat.
4. Real Gemini/Vercel success and real-key M3/M5 batches remain unverified. No real key is available in this environment. Its enforced outbound policy does not allow the supplied Vercel host; a proxy refusal is not a diagnosis of the site.

Inbox instructions are acknowledged here because the human's ownership list excludes editing the inbox. Remaining account usage is unavailable. No main push or PR.

## Final artifact publication
- Refreshed gzip is 7,646,902 bytes; restored SQLite is 168,062,976 bytes. Integrity, full horizon/quantile checks and checksum-protected restore pass. Current sample-CV2 counts and gross B/C candidates are in the generated manifest. Backend fingerprint matches the full run; no stale result rows reused.
- Latest pre-push suites: AI core 263, full API 34, all-material boundary/workbook, golden 43/43 mock and fake Gemini, Finance and legacy live pass. Final full-page check is 16/17: only spi_health remains at its Loading view, zero script errors. Ask, Forecast, contextual charts and stale-response regression pass. This unresolved non-AI first-paint issue is handed to Claude B/A/Fin above.
