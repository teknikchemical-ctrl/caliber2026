# Task board

Branches: Claude A = `claude/great-tesla-l0uw33`, Claude B = `claude/funny-edison-pis09w`. Case id = `<fill in tomorrow>`.

Update your own lines only. Status: `todo`, `doing`, `blocked`, `done`. Newest handoff notes go at the bottom.

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
(append below: `<role> | <what changed> | <files> | <how to check> | <known problems> | <needs from others>`)

B | T05 3D review of mock-cdu (7 sets, built with `BUILD_OUT=/tmp/x python3 build.py mock-cdu`; smoke test and static checks pass, 0 script errors in case_shots) | docs/TASKS.md only | Open Equipment Sets, any set, tab "Drawing and 3D", button "3D model"; dashboard "Plant in 3D"; Plot Plan, Hazard simulator, "3D site" | weak points below | needs from A: none yet
B | T05 weak in the 3D, in order of impact:
  1. Fired heater F-101 (set 2) is built as a horizontal drum with a stack. It has no radiant box, burners, tube coil or convection section, so it does not read as a heater. Also loose small fragments float around it (stray nozzle stubs and flanges not attached to the body).
  2. Column C-101 (set 3) is narrow and plain: no trays or manways shown, no skirt detail, pipe stubs are thin, ladder is a hairline. It looks small next to the plot plan footprint.
  3. Tank T-101 (set 6) and cooling tower CT-701 (set 7) are cropped by the model frame: base and platform cut off at the bottom edge. Camera distance and framing do not account for large equipment. Tank has no roof nozzles, stairs or dike; cooling tower has no fill, louvres or multiple fan cells.
  4. Drum V-102 (set 5) and exchanger E-102 (set 4) look almost identical: same horizontal vessel, same saddles. E-102 needs a visible channel, shell and floating head, tube bundle hint and different colour; V-102 needs a boot, demister or level gauge cue.
  5. Materials: everything is the same light grey with orange nozzles. No colour coding by service, no insulation or paint variation, no flange bolts, no pipe stubs with labels. Models look generic.
  6. Part labels and callouts: no part numbers shown on the 3D model by default, only on click. Nozzle marks (N1..) are not shown. Empty light grey background with a faint grid; no ground shadow on tall items.
  7. Dashboard "Plant in 3D": opens on a close, tilted view where the pipe rack, road and plot edge dominate and only half the units fit; labels overlap pipes (E-102, C-101). The first view should be a full plant overview. Large empty grey plot slab. Equipment sits far apart with thin lines between them; pipe rack steel is dark and heavy next to the pale equipment. A tall diagonal structure (flare or stack) on the right edge is cut off.
  8. Hazard 3D site and scenario replay were not checked in this pass (2D plan only in the crawler). To do next.
  9. Speed not measured yet: run `node tools/profile_load.js` and `node tests/stress3d.js` before changing anything.
  Next for B (T06): 1, 3, 7 first (largest visible gain on the dashboard and first impression), then 2, 4, 5. All fixes fit in auto3d.js, g3d.js, plant3d.js and style3d.css. No change needed in files owned by others.
