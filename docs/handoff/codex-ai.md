**Branch:** codex/ai | **Baseline:** 6151195 | **Commit:** see git log -1.
## Ready to merge
- SPI M1: providers/gemini.js and mock.js, bounded evidence.js, rules_planner.js, validate.js and planner.js. Mock is the default; Gemini ports discovery, 429/5xx retry, 8 s attempts and 25 s total budget, JSON schema mode, token usage and attempt traces. No real key used.
- All 237 fixture parts produce valid rules plans. 258 SPI AI checks pass, including unknown evidence, schema/bounds, independent evidence, proposed-only inputs, target isolation, injection delimiters, malformed JSON, rejected key and timeout recovery. Run AI_PROVIDER=mock node tests/spi_ai.js.
- Database evidence is read-only, zero-fills 17 months, retains IDs and flags truncation. Completed-by-cutoff lead times, weak/OEM pooling restrictions and conservative critical no-demand protection are documented in AI_REASONING.md. No stock or price totals are hardcoded.
- Baseline setup, old Netlify live suite, 17 SPI full-data checks and both SPI registered pages passed before edits. Shared test:quick passes build/static then is blocked by browser file-URL policy. Old provider and UI code remain unchanged in this step.
## Next
1. Plan and health Vercel endpoints, then Forecast page; tools/ask and proposal ledger, Ask AI page, resumable batch and golden evaluation. Use spiDesc and spiRegister per latest inbox. No Netlify endpoints on the SPI path.
2. Human supplies the real key securely in Vercel; verify health, then model-backed plan and question. No key in chat. I cannot report a remaining account-usage percentage from the tools available here.
## Waiting on
- Codex Fin: stable runPlan/backtest exports and policy contract (spi/engine still only OWNER.md on this baseline). Claude A: golden questions and Vercel deploy details; confirm scoped target persistence in forecast_input and add_qty policy when the historical maximum is zero.
- Current inbox read and acknowledged here; docs/inbox is outside the human's edit list. Claude A can mark M1 C1/C2 tasks and inbox rows after merging this commit. No main push or PR.
