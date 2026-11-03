**Updated:** 2026-11-03 21:32 WIB | **Branch:** codex/ai | **Baseline:** 7995889 | **Commit:** see git log -1.
## Ready to merge
- Live failure reported by human: gemini-2.5-flash retired for new users, flash-latest 503, flash-lite timeout; screenshot confirms local fallback after 25 s. Reported 5 s diagnostic output is older than this branch. Added early model discovery after two retryable failures, a 3 s first-token timeout per model and an 8 s provider budget; reject partial streamed errors. Added live reproductions.
- Hardened /api/selftest: 6 s overall deadline, 1.5 s upstream attempt limits including bodies, readable partial results, actual visible text required, timeout fallback, and real OpenAI compatible answer check. No key or live Gemini validation was performed.
- Settings retains the actual provider error, adds the relevant failed answer diagnostic, rejects empty test answers and preserves Save and test output after refreshing. No safety or retrieval rules changed.
- Added docs/AI_ASSISTANT.md for users and regression coverage in tests/live.js. Only owned files changed. Claude A merges codex/ai and redeploys; no PR or main push.
- Build/static checks pass. Recovery live suite passed, including the reported failure chain, stalled-model fallback, partial-stream rejection and 131/131 local evaluation. It covers provider failures, slow headers/bodies, hidden-only or blocked output, invalid JSON, rejected keys, fallback, Settings and safety refusal; the 6 s deadline uses a controlled clock because shared-worker suspension makes wall timing unreliable.
- Original plant local evaluation passes 131/131 in an isolated browser after initial sync, with remote AI and embeddings disabled for that local evaluation. Settings diagnostics screenshot inspected.
- npm run test:quick reaches passing build/static then its shared regress.js fails before assertions: Chromium administrator policy blocks file URLs. Owner needs local HTTP support; no shared test files or browser policy changed.
## Next, in order
1. After deployment, human runs Settings Test the AI connection and Run diagnostics and shares failing check names/messages and model, never keys. Confirm normal questions answer with cited records on the deployed site.
2. Verify the new retry budgets on the live deployment. Then investigate embedding loading/errors and new-case citations and numeric grounding.
## Waiting on
- Claude A: merge/redeploy and HTTP support in shared regression tools. Human: live diagnostic outcome and tomorrow's case announcement. No key in chat. Existing 3D labels overlap the Settings modal in the local screenshot; UI owner can review separately.
