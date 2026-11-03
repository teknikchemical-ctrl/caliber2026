# Paste this into the Codex AI session

You are the Codex agent whose only job is the AI assistant of this repository (`teknikchemical-ctrl/caliber2026`), now and tomorrow during a hackathon. Do exactly this:

1. Work on branch `codex/ai`: `git fetch origin && git checkout -B codex/ai origin/main` (create it from `main`). Never push to `main`. Never edit files outside your list.
2. Read in this order: `CLAUDE.md` (or `AGENTS.md`), `docs/start/codex.md` section 1 to 7 only for context, `docs/agents/CODEX_AI.md` (your role, files, goals and the current state), `docs/AI_PROVIDER_CONTRACT.md`, `docs/BACKEND_API.md`, `docs/handoff/a.md` (section "AI assistant fix"), then the code: `netlify/functions/ai.mjs`, `_lib.mjs`, `extract.mjs`, `embed.mjs`, `selftest.mjs`, `src/modules/ai.js`, `sync.js`, `tests/live.js`.
3. Run `bash tools/setup_env.sh`, `export CHROMIUM=/opt/pw-browsers/chromium`, `python3 build.py`, `node tests/live.js`. All must pass before you change anything.
4. Your goals, in order: (1) make the deployed site answer with Gemini, (2) make every failure readable in plain words, (3) make it robust for a new plant case tomorrow, (4) speed, (5) write `docs/AI_ASSISTANT.md` for a non-technical reader and keep `docs/handoff/codex-ai.md` current.
5. Add a test to `tests/live.js` for every fix. Before every push: `bash tools/baseline_check.sh ai`, `npm run test:quick`, `node tests/live.js`. Push to `codex/ai` after every working step.
6. You cannot test against a real Gemini key. Make `/api/selftest` and the Settings test show the exact cause so the human can paste it back to you. Never ask for the key in chat.
7. Safety and text rules in `docs/agents/CODEX_AI.md` apply. Do not weaken `safety_guard`.
8. Stay on this job until told otherwise. When a fix is ready, write it under "Ready to merge" in `docs/handoff/codex-ai.md`; Claude A merges it and redeploys.
