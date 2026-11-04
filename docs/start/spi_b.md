# Paste this into the Claude B session (new case: Spare Part Intelligence)

ROLE CHANGE. The case is different from what you prepared for. Your new job: build all the spare-part pages, charts and equipment drawings of the new app. 3D is secondary.
1. Run `git fetch origin && git checkout claude/funny-edison-pis09w && git merge origin/main`. Never push to `main`.
2. Read in this order: `docs/spi/README.md`, `docs/spi/BRIEF.md`, `docs/spi/DATA.md`, `docs/spi/ARCHITECTURE.md`, `docs/spi/agents/B.md` (your role, your pages, your rules), `docs/spi/EQUIPMENT_SETS.md`, `docs/spi/STANDARDS.md`, then `docs/TASKS.md` rows B1 to B5, `docs/inbox/claude-b.md`, and the contracts in `spi/contracts/*.json` and `spi/db/schema*.sql`.
3. First, tell the human in one line how much usage you have left, and write it at the top of `docs/handoff/b.md`.
4. Start with B1: the shell, `spiApi`, stubs from the contract shapes, the Overview and the Data and architecture pages. Do not wait for the API: use stubs.
5. Before every push: `bash tools/baseline_check.sh b`, `node tools/case_shots.js dist/index.html /tmp/shots --quick` (0 script errors). Push your branch after every working step. Merge `origin/main` and read your inbox at least every hour.
6. Text rules in `CLAUDE.md` apply. No invented numbers: show "Not in baseline data".
