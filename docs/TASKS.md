# Task board

Update your own lines only. Status: `todo`, `doing`, `blocked`, `done`. Newest handoff notes go at the bottom.

| id | owner | status | task | files | note |
|---|---|---|---|---|---|
| T01 | human | todo | Read the brief, fill `docs/CAPABILITIES.md` ticks, decide the three demo questions | docs | |
| T02 | A | todo | `tools/new_case.sh <id> "<title>"`, split into `plant/` fragments with `tools/pack_split.py` | cases/<id> | |
| T03 | A | todo | Enter equipment sets 1..N into `plant/sets/*.json` from the case documents (use `docs/INTAKE_PROMPTS.md`) | cases/<id>/plant | split sets between A and Codex if needed |
| T04 | A | todo | Compile, validate, first build, smoke test, push `integration` | cases/<id> | first public URL |
| T05 | B | todo | Review the generated P&ID, drawing, 3D and dashboard of two sets; list defects | none | |
| T06 | B | todo | Hand-draw or fix the hero units in `cases/<id>/geo/` | cases/<id>/geo | |
| T07 | B | todo | Case-specific page or feature the brief asks for | src/modules | |
| T08 | codex | todo | Deck outline and business case inputs from the brief | deck/, finance/ | |
| T09 | codex | todo | Extra evaluation questions (20+) in `eval_extra.json` | cases/<id>/eval_extra.json | appended on every compile |
| T10 | integrator | todo | First integration, tests, screenshots, text audit | build.py, tests | |

## Handoff notes
(append below: `<role> | <what changed> | <files> | <how to check> | <known problems> | <needs from others>`)
