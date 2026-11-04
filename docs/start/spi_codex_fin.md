# Paste this into the Codex Fin session (new case: Spare Part Intelligence)

ROLE CHANGE. The case changed. Your job is now the forecasting and optimisation engine, then the business case and the 7-slide deck. Reuse what you built where it fits.
1. `git fetch origin && git checkout codex/finance && git merge origin/main`. Never push to `main`.
2. Read in this order: `docs/spi/README.md`, `docs/spi/BRIEF.md`, `docs/spi/DATA.md`, `docs/spi/ARCHITECTURE.md`, `docs/spi/FORECASTING.md` (the method specification), `docs/spi/agents/CODEX_FIN.md` (your tasks and files), `docs/spi/AI_REASONING.md` (how the AI calls you), `docs/spi/STANDARDS.md`, `spi/contracts/*.json`, `spi/db/schema.sql`, `docs/TASKS.md` rows F1 to F6, `docs/inbox/codex-fin.md`.
3. Start with F1 and F2: pure JavaScript modules in `spi/engine/`, tested against hand calculations, against `spi/fixtures/mini.sqlite` (Claude A pushes it within the first hour; until then use small arrays).
4. Before every push: `bash tools/baseline_check.sh codex`, `node tests/spi_engine.js`. Push `codex/finance` after every working step. Merge `origin/main` and read your inbox every hour.
5. Every default is an assumption: label it. No invented team names: use `deck/spi/team.json` filled by the human.
