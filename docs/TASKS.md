# Task board (SPI case: Spare Part Intelligence and Inventory Optimization)

Branches: Claude A `claude/great-tesla-l0uw33`, Claude B `claude/funny-edison-pis09w`, Codex AI `codex/ai`, Codex Fin `codex/finance`. Case id `spi`. Deadline Thu 5 Nov 2026 06:00. Read `docs/spi/README.md` first, then your file in `docs/spi/agents/`.

Update only your own rows (status `todo`, `doing`, `blocked`, `done`). Longer notes go in your handoff file `docs/handoff/<a|b|codex-ai|codex>.md`. Messages from Claude A to you: `docs/inbox/<agent>.md`. A contract change (schema, JSON contracts, API names) is announced here and in the inbox of every agent it affects.

| id | owner | status | task | milestone | files |
|---|---|---|---|---|---|
| A1 | A | todo | Vercel hello deploy with one DB endpoint (spikes S1, S2, S5); package.json, vercel.json, server/_lib/db.mjs | M0 | vercel.json, server/_lib, server/data/health.mjs |
| A2 | A | todo | ETL v1: clean tables, dq_issue, `mini.sqlite` fixture pushed in the first hour | M0 | spi/etl, spi/fixtures |
| A3 | A | todo | Derived layer: part_profile, part_equipment, spec parser, spec_family; commit spi.sqlite | M1 | spi/etl, spi/db |
| A4 | A | todo | `server/data/*` endpoints | M1 | server/data |
| A5 | A | todo | Equipment sets, case pack `cases/spi`, register spi modules in build.py | M2 | spi/etl, cases/spi, build.py |
| A6 | A | todo | Golden questions (40) in spi/eval and eval_case | M3 | spi/eval |
| A7 | A | todo | Integrate every 1 to 2 h, tests, deploy | all | main |
| A8 | A | todo | Ship: zip script, final deploy, screenshot steps, final audits | M5 | tools/spi_zip.sh |
| B1 | A | todo | App shell `spi_core.js`, Overview, Data and architecture pages, nav group (took over from B) | M1 | src/modules/spi_core.js, spi_dash.js, spi_arch.js |
| B2 | codex-ai | todo | Forecast page (chart with bands, ledger with source badges, how the AI reasoned) (took over from B) | M2 | src/modules/spi_forecast.js |
| B3 | B | done | Recommendations and Inventory health pages (the brief's named outputs), live by M3. Back to B: B has about 99% usage left | M3 | src/modules/spi_reco.js, spi_health.js |
| B4 | B / codex-ai | doing | Optimisation and Scenario simulator pages (B, M4); Ask AI page (codex-ai) | M3 to M4 | spi_opt.js, spi_scn.js (B); spi_ask.js (codex-ai) |
| B5 | B | done | Drawings and 3D for all 8 equipment sets to engineering standards (API, ASME, TEMA, ISA), with stock overlay; see docs/spi/DRAWINGS_BRIEF.md | M3 | cases/spi/geo, g3*.js, auto3d.js, spi_overlay.js | first complete version pushed; polish items in handoff b |
| C1 | codex-ai | todo | Providers (gemini, mock), model chain, tests with fake Gemini | M1 | spi/ai/providers |
| C2 | codex-ai | todo | Evidence pack and rules planner and validator | M1 | spi/ai |
| C3 | codex-ai | todo | `POST /api/ai/plan` and `GET /api/ai/health` on Vercel | M2 | server/ai |
| C4 | codex-ai | todo | Tools and Flow B `POST /api/ai/ask` (proposals into the ledger) | M3 | spi/ai, server/ai |
| C5 | codex-ai | todo | Batch precompute to results.sqlite; golden question evaluation; key connection guide for Vercel | M3 to M5 | spi/ai, docs/AI_ASSISTANT.md |
| F1 | codex | done | Engine core: classify, methods, bootstrap quantiles, unit tests | M1 | spi/engine |
| F2 | codex | done | `runPlan`, Policy object, optimiser, recommender | M1 to M2 | spi/engine |
| F3 | codex | done | `server/engine/*` endpoints | M2 | server/engine |
| F4 | codex | doing | Backtest, baseline replay, simulate, health lists, rules batch | M3 | spi/engine |
| F5 | codex | todo | Business case workbook, impact.json, BUSINESS_CASE.md | M4 | finance/spi |
| F6 | codex | todo | 7-slide deck in competition format; team.json for the human | M4 to M5 | deck/spi |
| E1 | B | todo | Cost-risk frontier on the Scenario page (docs/spi/PLAN_ECONOMICS.md) | M4 | spi_scn.js |
| E2 | A | todo | Campaign readiness gap (critical parts, order quantity and cost) | M4 | server/data, spi_dash or new page |
| E3 | codex | todo | Capital waterfall and two programmes on the Impact page | M4 | spi_impact.js, finance/spi |
| E5 | codex / A | todo | Purchase plan and cash timeline from batch results | M4 | spi/engine/batch.js, server/data |
| E6 | A | todo | Lead time and supplier lever | M4 | server/data |
| W1 | codex / B | todo | Three-way policy comparison (current, workbook baseline, dynamic) replayed over 17 months | M4 | spi/engine, page |
| W2 | A | todo | Show-your-work panel with editable assumption cells on the Forecast page | M4 | spi_forecast.js |
| W4 | A | todo | Validation page: the workbook's 12 test-plan rows with live status | M4 | server/data, new page |
| F4 | codex | done | Backtest, baseline replay, simulate, health lists, rules batch | M3 | spi/engine |
| F5 | codex | doing | Business case workbook, impact.json, BUSINESS_CASE.md | M4 | finance/spi |
| F6 | codex | blocked | 7-slide deck in competition format; team.json for the human | M4 to M5 | deck/spi |
| H1 | human | todo | Import the repo in Vercel and send the URL; set AI_PROVIDER, AI_API_KEY, AI_MODEL in Vercel env vars; fill `deck/spi/team.json`; confirm deadline time zone; tell Claude A the clock | M0 to M5 | |

## Open contract questions
(none yet)

---
## Archive: previous case rows

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
| T06 | B | doing | Improve the 3D models by kind, the plant 3D view and the 3D interface | auto3d.js, plant3d.js, g3d.js, style3d.css | |
| T11 | B | done | taking tools/g3shots.js (new tool: screenshots of every 3D view, prints equipment kind per set) | tools/g3shots.js | see handoff b |
| T07 | A | todo | The features the brief asks for, and the AI assistant on this plant | src/modules | |
| T08 | codex (finance) | todo | Costing page, `fin.json`, assistant cost tool, financial model and slides | src/modules/fin.js, cases/<id>/fin.json, finance/, deck/ | |
| T09 | codex | todo | 15+ cost evaluation questions in `eval_extra_fin.json` | cases/<id>/eval_extra_fin.json | appended on every compile |
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

Codex Finance | 2026-11-04 | Human deferred deck; prototype first. Engine/server APIs and Business Impact ready on codex/finance. Source savings overlap correction proposed in finance/spi/savings_source_correction.patch; source owners must reconcile it.
B | 2026-11-04 | For Claude A: new page spi_space (Equipment library, src/modules/spi_draw_space.js) is a full-height 3D space of all equipment sets with search that flies to the matching set. Please add it as the first entry of spi/pages.json (label Equipment library) and make it the start page in build.py (let st={page:"spi_dash"); my module already switches the start page when there is no hash and can be dropped then. Old spiPlantOverview in spi_equip.js still shows simulated Running and generic health figures; consider replacing it with a link to the library.
B | 2026-11-04 | For Claude A (permanent fix of what my `src/modules/spi_zone_clean.js` hides): remove these pages from base.html and the menu for case spi: dashboard (Plant overview), plot, mnt, perf, scn, il, ai, ks, fm, int, gov, fin, mywork, opl, quality; remove the P&ID tab and the cards "Location in the unit", "Place in the plant", "Key items on the P&ID" from the set overview (eq2.js); fix the pack field `pp.functional_location` ("SPI-Not in baseline data-01", the real value is PX_<tag>). Add `spi_space` first in spi/pages.json and make it the start page. Then delete spi_zone_clean.js. Also: my `spi_zone_set.js` replaces `spiEquipPanel` (spi_equip.js) on the set overview.
