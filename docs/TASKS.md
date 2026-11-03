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

B | taking tools/g3shots.js (new file, nobody else uses it) | tools/g3shots.js | `CHROMIUM=/opt/pw-browsers/chromium node tools/g3shots.js dist/index.html /tmp/g3s` writes model_set<N>.png for every set, plant3d.png, hazard3d.png, scenario3d.png and prints the equipment kind chosen for every set | none | none
B | Baseline on mock-cdu, before any 3D change: stress3d.js passes (0 bad, 6 to 17 ms per model); case_shots 0 errors; g3shots 0 errors. Hazard 3D site and scenario 3D view both work and are readable (units on decks, rack, muster points, legend); dashboard Plant in 3D is the weakest view (see T05 list).
B | Day-2 runbook, how I will make the 3D for the real case (nothing new to build, only to tune):
  1. `git pull origin main`; `BUILD_OUT=/tmp/x python3 build.py <case-id>`; `node tools/g3shots.js /tmp/x/index.html /tmp/g3s`. Read the printed kind per set. A set whose kind is wrong or falls to the horizontal-vessel default is a candidate for a hand-built model.
  2. Fix kind detection first: `autoKind` in src/modules/auto.js is Claude A's file. If a keyword is missing, I write the line in TASKS.md for A (one regex per kind). The 3D models themselves are in auto3d.js `autoG3m` (mine).
  3. Per set, in order of demo value: change the generated model in auto3d.js if the kind is common (benefits every set of that kind), or write `G3M[n]=[...]` in `cases/<id>/geo/g3m.js` for a one-off machine. Primitives: `g3B(key,x,y,z,w,h,d,color,{r,m,sh,in,anim})` rounded box, `g3C(key,axis,x,y,z,len,r,color,opts,r2)` cylinder or cone, `g3E(key,axis,x,y,z,ra,rb,color,a0,a1,opts)` ellipsoid or dished head; helpers `g3Motor`, `g3Ladder`. Units are metres, y up, machine centred on x=0 and z=0, floor at y=0. `key` is the BOM line number ("1") or the nozzle mark ("N1"), empty for decoration; keys make parts selectable and show the card. Colours: steel, body, dark, blue, gray, amber, brass, water, red, green, cat, white, paint, black, or any #rrggbb. Options: `in:1` internal part (shown in X-ray only), `anim:{ax,rate,at}` spin or `{type:"slide",ax,amp,rate}` stroke, `light:1` status light, `m` metal, `sh` shiny, `seg` segment count.
  3. Run `node tools/g3bridge.js` after any model change (it writes the short neck pieces in g3neck.js so no solid floats loose; `--check` fails when out of date). Then `node tests/stress3d.js`.
  4. Plant 3D view (dashboard): `autoP3` in auto3d.js sets `P3POS` (grid of 11 m by 18 m cells, up to 4 columns) and `P3SC` (scale by kind). The slab (70 m by 42 m), road, pipe rack columns, control room, tank, flare and the separator test (`/separator/i` on set 6) are hard-coded in `p3Scene` in plant3d.js. They come from the first plant. Day 2: make them follow the number of sets, drop the ones the new plant does not have. Pipe routes come from `OVL` (Claude A's overview data); `lanes` in `p3Routes` has fixed ids from the first plant, so a new case with other stream ids needs a lane map keyed by stream id or by service.
  5. Hazard 3D site (`hse3d.js`): ground, boundary, road, rack, control room, muster points are hard-coded in plot-plan metres (boundary E100 to E260, N102 to N246, rack at N168). `autoPlot` in auto.js produces two rows of up to four columns which fits; one row or three rows, or a pack with its own `geo/plot.js`, will not line up. Units themselves follow `POS` and footprint `ppFP`, so they are fine. Day 2: derive boundary, rack and road from `POS`, `HA`, `VA` and `MUS` instead of constants. Elevation per set comes from `H3_EL` (autoH3: 0.8 times height when taller than 8 m).
  6. Scenario 3D and replay (`sim3d.js`) reuse the plant 3D, so they inherit step 4.
  7. Look at every screenshot, fix, re-run steps 3 and `node tools/profile_load.js` (needs `mkdir -p /tmp/claude-0/t` once). Commit and push my branch after each working step, then write the handoff line.
B | Known limits to tell the integrator tomorrow: more than 8 sets crowd the 3D plant and plot; a set with no parts list or nozzle table gets the generic parts from `autoGaFill` (labelled schematic); no wording or data from the first plant is in my files except the hard-coded site items in point 4 and 5.
