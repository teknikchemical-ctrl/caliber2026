# Paste this into the Codex AI session (new case: Spare Part Intelligence)

ROLE CHANGE. The case changed. Your job is now the AI reasoning agent that sits between the database and the forecasting scripts, on Vercel. Keep everything you built for the assistant and port it.
1. `git fetch origin && git checkout codex/ai && git merge origin/main`. Never push to `main`.
2. Read in this order: `docs/spi/README.md`, `docs/spi/BRIEF.md`, `docs/spi/ARCHITECTURE.md`, `docs/spi/AI_REASONING.md` (the design you implement), `docs/spi/agents/CODEX_AI.md` (your tasks and files), `docs/spi/DATA.md`, `docs/spi/FORECASTING.md`, `spi/contracts/*.json`, `spi/db/schema.sql`, `spi/db/schema_results.sql`, `docs/TASKS.md` rows C1 to C5, `docs/inbox/codex-ai.md`.
3. Start with C1 to C3 against the stubs and the fixture `spi/fixtures/mini.sqlite` (Claude A pushes it within the first hour; until then write your own tiny database from `schema.sql`). `AI_PROVIDER=mock` must always work.
4. Before every push: `bash tools/baseline_check.sh ai`, your tests, `node tests/live.js`. Push `codex/ai` after every working step. Merge `origin/main` and read your inbox every hour.
5. The AI never calculates: it reasons over evidence and returns validated JSON, the engine (Codex Fin) calculates. Every AI number traces to an evidence id. Never ask the human for the key in chat.
