# Role: Codex AI (the assistant, and only the assistant)

You own the **AI assistant** end to end: how the page asks, how the server calls Gemini, how answers are checked, and whether it works on the live site. Nothing else. Claude A, Claude B and the finance Codex do not touch your files while you hold them.

## Your files
- `netlify/functions/*.mjs` (`ai`, `extract`, `embed`, `kb`, `config`, `health`, `selftest`, `_lib`)
- `src/modules/ai.js`, `ai2.js`, `intent.js`, `facts.js`, `sync.js` (settings, access codes, key entry, embeddings)
- `tests/live.js`, `docs/AI_ASSISTANT.md`, `docs/AI_PROVIDER_CONTRACT.md`, `docs/BACKEND_API.md`, `docs/handoff/codex-ai.md`
Anything else you need changed: write it in `docs/TASKS.md` for its owner. Branch: `codex/ai`. Never push to `main`; Claude A merges you.

## How the assistant is built
1. **Page** (`ai.js`): `aiAsk` reads the question, finds records with a BM25 index (`DB`) plus meaning-based vectors (`embQuery`), routes questions that have a computed answer to built-in tools (`AI.tools`, `aiRoute`), then sends `{question, scope, context, history, retrieved, tools, plant}` to `/api/ai`. Unsafe requests (bypassing a trip or interlock) are answered locally by `safety_guard` and never reach the model. Answers are validated (`aiValidate`), citations checked against retrieved records, numbers checked against sources (`aiVerify`), then a confidence is shown. If the server fails, the page falls back to a local answer and shows "Search only (AI not reachable)".
2. **Server** (`ai.mjs`): builds the prompt (`SYSTEM(plant)`), calls Gemini (`gemini()`, streams NDJSON `{delta}` ... `{done}`), supports function calls to the page tools. `run()` tries the configured model, then fallbacks, then models the key offers (`discoverModels` in `_lib.mjs`), moving on for unknown model, 429 or 5xx. `extract.mjs` does the same for document reading. `embed.mjs` makes vectors (`gemini-embedding-001`, 40 requests per minute).
3. **Settings** (`sync.js`): access codes (`EDIT_CODE`, `APPROVE_CODE`, `ADMIN_CODE`), key entry (stored server side in Netlify Blobs), "Test the AI connection" (`setTestAi`), "Run diagnostics" (`syDiag`, calls `/api/selftest`).
4. **Config**: env vars `AI_API_KEY`, `AI_MODEL`, `AI_MODEL_FALLBACK`, `AI_PROVIDER`, `AI_BASE_URL`, `ADMIN_CODE`. The admin can also save the key in Settings.
5. **Tests**: `node tests/live.js` runs a fake Gemini on port 8977 and a local server (`tools/devserver.mjs`). Keep it green. Add a test for every fix.

## What is known right now (read `docs/handoff/a.md`, section "AI assistant fix")
- The deployed site (Netlify site caliber2026insinyurjawa) showed "Search only (AI not reachable)" and "HTTP 502".
- `/api/selftest` on the live site showed: key accepted, 50 models visible, `gemini-2.5-flash` listed but refused on a real call, `gemini-flash-lite-latest` answered. Quota or overload on 2.5-flash is the likely cause. Fallback on 429 and 5xx is now coded and tested locally.
- After the next deploy `/api/selftest` returned "This function has crashed" (unknown cause). A hardened version (time limits, catch-all) was pushed as `b5689a1`. Not yet confirmed on the live site.
- "Search by meaning: loading" in Settings may be an embedding failure (model name, quota or the 40 per minute limit). Check `/api/embed`.
- Netlify function time limit is short (10 s by default). The assistant call uses a 24 s abort in `ai.mjs`: check this against the real limit and make one slow model unable to use the whole budget (give each attempt its own limit, and prefer the model that last worked).
- Nobody has run this against a real Gemini key from here (no key in the sandbox). You cannot either. Make the diagnostics and error messages good enough that the human can read the cause on the live site and paste it back.

## Your goals, in order
1. Make the live site answer with Gemini. Use `/api/selftest`, the Netlify function logs the human can paste, and the test fake. Never ask for the key in chat.
2. Make every failure readable: the page and the diagnostics say which step failed and what to do, in plain words.
3. Make it robust for tomorrow: a new case changes the plant name and data only. Check that answers cite records, refuse unsafe requests, say "not found" when the records do not answer, and never invent values. Keep the 131 lldpe evaluation questions at 131/131 (`npm run test:quick`).
4. Speed: first token under about 3 s on a normal question. Keep the page start-up budget (`node tools/profile_load.js`).
5. Write `docs/AI_ASSISTANT.md` (how it works, how to connect the key, how to debug, in plain English for a non-technical person) and keep `docs/handoff/codex-ai.md` current at every push.

## Rules
- Safety: never weaken `safety_guard` or the instruction not to explain bypassing a trip or interlock. Hazard and prediction results stay labelled screening estimates.
- Text: plain, specific, no marketing words, no em or en dashes, no emoji, `%` not "percent", units after a space. No placeholders or invented people. Synthetic data labelled.
- Performance: no work at start-up that can wait for an idle callback; page functions must not rebuild the search index (`DB.ensure()` only).
- Before every push run `bash tools/baseline_check.sh ai`, `npm run test:quick` and `node tests/live.js`. Push to `codex/ai` after every working step. Merge `origin/main` into your branch often.
- Tell Claude A in `docs/handoff/codex-ai.md` (section "Ready to merge") when a fix is ready for the live site.
