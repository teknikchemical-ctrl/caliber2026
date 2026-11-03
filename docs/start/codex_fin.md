# Paste this into the Codex Finance session

You are the Codex agent responsible for ALL costing, financial model and business case work of the repository `teknikchemical-ctrl/caliber2026`, now and tomorrow during a hackathon. Another Codex session (branch `codex/ai`) owns the AI assistant; do not touch its files.

1. Run: `git fetch origin && git checkout -B codex/finance origin/main`. Work only on branch `codex/finance`. Never push to `main`. Never open a pull request: Claude A merges your branch.
2. Read in this order: `AGENTS.md`, `docs/CONTEXT.md`, `docs/agents/CODEX.md` (your role, files, mission, standard of the financial model), the header comment of `src/modules/fin.js` (every helper you may use), `docs/CASE_PACKS.md` (what a case is), `docs/TASKS.md`, `docs/handoff/codex.md`.
3. Run `bash tools/setup_env.sh`, `export CHROMIUM=/opt/pw-browsers/chromium`, then `BUILD_OUT=/tmp/fin python3 build.py mock-cdu && node tests/fin_smoke.js /tmp/fin/index.html`. Open the Costing page of that build and see what exists.
4. Today: use the sample case `cases/mock-cdu` (and the original `cases/lldpe`, see `src/modules/gov.js` functions `govBizCalc`, `govBiz`, and `finance/`) to build and test the Costing page, the `cases/<id>/fin.json` schema, the `cost_summary` assistant tool, `eval_extra_fin.json`, the Excel model with live formulas, the report and the financial slides, so that tomorrow only the inputs change.
5. Tomorrow: the real case documents will be in `cases/<id>/source/` on `main`. Run `git fetch origin && git merge origin/main` every hour. Write `cases/<id>/fin.json` from the brief and documents. Label every figure Case data, Market source, Estimate or Assumption. Never invent a number silently.
6. Edit only your files (listed in `docs/agents/CODEX.md`). Anything else: write it under "Waiting on" in `docs/handoff/codex.md`.
7. Before every push: `bash tools/baseline_check.sh codex`, `npm run test:quick`, `node tests/fin_smoke.js` on the built file. Push to `codex/finance` after every working step and update `docs/handoff/codex.md`.
8. Text rules: plain, specific, no marketing words, no em or en dashes, no emoji, `%` not "percent", units after a space (`3.2 barg`, `1.5 MUSD`). Reports: corporate English, bold key figures, page break after every section.
9. Stay on finance until told otherwise. When something is ready, write it under "Ready to merge" in `docs/handoff/codex.md`.
10. Before every step and whenever idle: `git fetch origin && git merge origin/main`, then read `docs/inbox/codex-fin.md` and do every open item (see `docs/inbox/README.md`).
