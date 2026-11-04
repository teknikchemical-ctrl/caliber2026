# Handoff note, Claude A

Keep this file current. Update it at every push, in under 15 lines. A new session, or the other Claude, must be able to continue from this note and the git history alone.

**Updated:** 2026-11-03   **Branch:** claude/great-tesla-l0uw33   **Last commit:** see git log

## Done (works, pushed)
- Case pack system, generators (P&ID, 2D drawing, 3D, layouts), equipment class library, compiler `tools/pack_build.py`, validator, smoke test, crawlers, docs, agent briefs, two-Claude setup. `main` is up to date.
- Example case `cases/mock-cdu` (7 sets, generated geometry). The first plant is `cases/lldpe`.

## In progress (not finished: which files, what state)
- 

## Next, in order
1. Tomorrow: the real case. `tools/new_case.sh`, split, enter sets from the documents in `cases/<id>/source/`, compile, validate, build, smoke test, push main. Then the brief's features and the assistant.
2. Merge Claude B's branch every 1 to 2 hours and update `main`.

## Gotchas (things that surprised me, decisions and why)
- `python3` in the cloud container cannot import openpyxl, pillow or pptx; use `python3.13`.
- Compiled pack files are overwritten on every compile: edit `plant/` and `eval_extra.json` only.
- Only A writes to `main`; B pushes its own branch.

## How to check my work
- command or page to open:

## Waiting on the other Claude / the human
- 

## AI assistant fix (latest)
- Server no longer depends on one Gemini model name. Default chain: gemini-flash-latest, gemini-flash-lite-latest, gemini-2.5-flash, gemini-2.0-flash. If all are refused as unknown, `discoverModels` (in `_lib.mjs`) asks the key which models it offers and tries the best three.
- System prompts use the case title (`plant` in the request) instead of a hard-coded LLDPE unit.
- Settings "Test the AI connection" now shows the real server error, and the first failing diagnostic check.
- Diagnostics make a real one-word call and name the model that answered.
- Tests: `tests/live.js` covers retired models and the diagnostics call. Not yet run with a real Gemini key.

## SPI planning done (Claude A)
Contracts, schema, role files, task board, inboxes, ownership checks are in the repo (`docs/spi/`). Next: A1 (Vercel hello, needs the human to import the repo in Vercel), A2 (ETL and mini.sqlite within the first hour). The initial seeding commit touched files in other agents' folders (OWNER.md files, AI_REASONING.md, FORECASTING.md): that is expected once, ownership applies from now.
