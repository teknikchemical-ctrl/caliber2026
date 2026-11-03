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
