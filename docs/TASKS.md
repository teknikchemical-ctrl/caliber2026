# Task board

Branches: Claude A = `claude/great-tesla-l0uw33`, Claude B = `claude/funny-edison-pis09w`. Case id = `<fill in tomorrow>`.

Each Claude updates only its own rows (status: `todo`, `doing`, `blocked`, `done`). Longer notes go in your own handoff file (`docs/handoff/a.md` or `docs/handoff/b.md`), never at the bottom of this file, so the two branches do not edit the same lines.

| id | owner | status | task | files | note |
|---|---|---|---|---|---|
| T01 | human | todo | Read the brief, fill `docs/CAPABILITIES.md` ticks, decide the three demo questions | docs | |
| T02 | A | todo | `tools/new_case.sh <id> "<title>"`, split into `plant/` fragments with `tools/pack_split.py` | cases/<id> | |
| T03 | A | todo | Enter equipment sets 1..N into `plant/sets/*.json` from the case documents (use `docs/INTAKE_PROMPTS.md`) | cases/<id>/plant | split sets between A and Codex if needed |
| T04 | A | todo | Compile, validate, first build, smoke test, push `integration` | cases/<id> | first public URL |
| T05 | B | done | Look at the 3D of the example plant (`mock-cdu`) and list what is weak | none | |
| T06 | B | todo | Improve the 3D models by kind, the plant 3D view and the 3D interface | auto3d.js, plant3d.js, g3d.js, style3d.css | |
| T07 | A | todo | The features the brief asks for, and the AI assistant on this plant | src/modules | |
| T08 | codex | todo | Deck outline and business case inputs from the brief | deck/, finance/ | |
| T09 | codex | todo | Extra evaluation questions (20+) in `eval_extra.json` | cases/<id>/eval_extra.json | appended on every compile |
| T10 | integrator | todo | First integration, tests, screenshots, text audit | build.py, tests | |

## Handoff notes
Moved to `docs/handoff/a.md` and `docs/handoff/b.md`. Request something from the other Claude in the "Waiting on" section of your own handoff file and put its id in the `note` column of your row here.
