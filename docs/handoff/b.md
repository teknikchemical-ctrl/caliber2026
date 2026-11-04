# Handoff note, Claude B

**USAGE (2026-11-04):** about 98% left (the earlier "1%" was usage used, not left). Claude A restored the full role.

## Parked head start for B1 (not in src/, so it cannot collide with A's files)
`(removed)` (copy to `src/modules/` and drop the `.txt`): `spi_core.js` (spiApi with fixture mode, render hook, run-time nav group, tables, bars, tooltips), `spi_stub.js` (sample data in API shape), `spi_dash.js` (Overview), `spi_arch.js` (Data and architecture), `style_spi.css`. Written, not yet built or looked at. Data shapes assumed are in `spi_stub.js` (`/api/data/summary`, `/api/data/dq`, `/api/data/architecture`, `/api/engine/health`); A and Codex Fin should match them or tell me the real ones. Needs build.py to include `src/modules/spi_*.js` and `style_spi.css`; no dispatch or nav patch needed.

Keep this file current. Update it at every push, in under 15 lines. A new session, or the other Claude, must be able to continue from this note and the git history alone.

**Updated:** 2026-11-04   **Branch:** claude/funny-edison-pis09w   **Last commit:** see git log

## Round 5 (2026-11-04, plan docs/spi/PLAN_B_ROUND5.md)
- Shared kit `src/modules/spi_zone_zkit.js`: search dropdown, draggable and zoomable timeline, top ribbon, recommended or my-inputs toggle, AI box hosts (`kbAi` calls A's spiAiBox), waterfall, bars, text cleaner, tour hidden.
- New pages: Status (`spi_status`, A's /api/data/status), Summary tiles (`spi_summ`), Purchase pathway (`spi_golden`) and Golden path (`spi_fgold`) on B's /api/ws/golden plus A's Monte Carlo; part card (`spi_zone_pcard.js`); maintenance timeline with work pack; impact waterfall; supplier lead-time ranges.
- Coverage of the 20 case points: docs/spi/COVERAGE_B.md. Tests: tests/spi_ui_b_chain.js and spi_ui_b_handlers.js green.
- Open: item 1 equipment sets (waiting on A's sets-review), toggle on the remaining tools, A's /api/data/events on the planner and maintenance timelines.

## Done (works, pushed to claude/funny-edison-pis09w)
- **B5 drawings and 3D for all 8 equipment sets, with stock overlay** (design and how to check: `docs/spi/DRAWINGS_BRIEF.md`). Classes: steam turbine (API 612, 614), cracking furnace (API 560), centrifugal pump (API 610 OH2, API 682), shell and tube exchanger (TEMA, API 660), control valve (ISA-75, IEC 60534), flanges ASME B16.5. Files: `cases/spi/geo/g3m.js` (zones, nozzle schedule, 5 model builders), `cases/spi/geo/gad.js` (2D sheet = front elevation and plan projected from the same primitives, balloons, nozzle tags, dimensions, notes), `cases/spi/geo/p3.js` (3D plant layout and scales), `src/modules/spi_overlay.js` (stock status, legend, zone table and zone card), hooks in `src/modules/g3d.js`, CSS in `src/modules/style3d.css`.
- Stock overlay: status per BoM line from `/api/data/equipment/<tag>`, zone colour = worst status, same colours in 2D, 3D, the legend and the mini 3D on the equipment overview. Zone card lists every part with stock, Min, Max and a Forecast link (`spiGo('spi_forecast',{mat})`).
- Fixed a layering bug in `plant3d.js` (ground slab had the same layer as equipment, so far units vanished behind it). The plant 3D tank of the first plant is switched off for this case (`window.P3SITE`).
- Screenshots for the deck: `cases/spi/geo/shots/` (sheets, 3D models, plant 3D). Codex Fin may copy them to `docs/spi/shots/`.

## Done since (plan 2, see docs/spi/DRAWINGS_BRIEF.md status)
- Part models for all 53 types (`spi_draw_parts.js`), Part library page, `spi_health.js`, `spi_reco.js`, `spi_opt.js`, `spi_scn.js`; renderer solids `a` and `s` in g3d.js; CSS in style3d.css.

## In progress (not finished: which files, what state)
- Nothing half done. Next candidates: B3 Recommendations and Inventory health pages (`spi_reco.js`, `spi_health.js`).

## Chemical engineering features (real data only): process connections, installed spare letters, turnaround readiness by part type, protective devices page; no system map because the data has no membership.

## Search: `spi_find` page, part panel with where used and purchasing, Show in 3D, tests/spi_ui_b_chain.js (all pass).

## Plan 3: `spi_eq` page and 15 equipment templates are in (see the brief status). Remaining: sub-item assemblies, block flow explorer, timeline, corrections.

## Plan 3 in progress (see docs/spi/DRAWINGS_BRIEF.md): every location clickable in 3D, templates by tier, page `spi_eq`.

## Next, in order
1. P4: drawings and 3D for the other equipment classes (relief valve, shutdown valve, level control valve, transmitters, gauge, thermocouple), equipment timeline lane chart, plant explorer.
2. P6: supplier and lead time views (needs the endpoints listed in the brief).
3. Drawing polish if time remains: end elevation view on the sheets, part labels on the sheet, P&ID per class (`geo/pid.js`, the auto P&ID is generic), plot plan footprints from the model size (`ppFP`).

## Gotchas (things that surprised me, decisions and why)
- The first plant's `G3NECK` (short necks for floating parts) is keyed by set number and was applied to the SPI sets: it is deleted for this case and recomputed lazily per set (`g3m.js`, a getter), so start-up stays fast.
- Part names in the pack are in display form ("Seal, mechanical, TYPE ..."), so the zone tests use `[,\s]+` between words.
- A zone carries the number of its first BoM line (so `gBom`, `gP`, the tables and the card keep working); `gP` is wrapped in `spi_overlay.js` to put the zone card first.
- `gaSvg` is replaced for the SPI sets only (keeps `id="gsvg"`, `data-k`, `onclick="gSel(..)"`).
- Nothing is invented: nozzle sizes and ratings stay "Not in baseline data"; dimensions on the sheet are those of the schematic and labelled so.
- `npm install` is needed once in a fresh container to run `tools/spi_dev.mjs` (better-sqlite3).
- Test: `python3 build.py spi && node /path/to/script` against `node tools/spi_dev.mjs <port> full`; `node tests/stress3d.js` passes (it ignores the file:// API errors of the SPI pages).

## How to check my work
- `python3 build.py spi && node tools/spi_dev.mjs 8800 full`, open Equipment Sets, any set, tab "Drawing and 3D": 2D sheet with stock colours, legend and zone table; select a balloon or a table row; switch to "3D model". Plant overview shows all 8 units.

## Waiting on the other Claude / the human
- Claude A: the maintenance page throws `Cannot read properties of undefined (reading 'slice')` in `mlab` (mh*.js) for the SPI pack (seen in `case_shots.js`). The KT parts lists contain air intake and fuel gas filters (gas-turbine items) although the class is a steam turbine driver.
- Codex AI: the zone card links to `spiGo('spi_forecast',{mat:<material_no>})`, as the Overview does.

## Part inspector pop-up (latest)
One pop-up replaces the side panel and the second modal. Clicking a zone in 3D, on the 2D sheet or in the zone table (Equipment 3D page and equipment set page) opens `#spi_pm`: left a searchable list of the zone's parts with status dot and stock; right the selected part's 3D model, parameters and standards, KPIs (Stock, Min, Max, Issued 17 months, Lead time), issued-per-month chart, stock record, where used (Show in 3D), purchasing, specification family, forecast button and a collapsible drawing sheet. Parts opened from tables or search use the same pop-up through `spiPartOpen(descr,mat)`. Closes with Close, backdrop, Esc or any re-render.
Code: `spiInspect`, `spiInspectShow`, `spiInspectList`, `spiInspectZone` (spi_draw_parts.js); `spiEqPick` (spi_draw_equip.js); gSel and gP wrappers (spi_overlay.js). Test: `node tests/spi_ui_b_chain.js`.
Note: `tests/stress3d.js` reports `bad 1` on some runs because a random wheel zoom can drop pick coverage under 600; script errors are the real check and are 0.

## Spatial library (spi_space)
Page `spi_space` (`src/modules/spi_draw_space.js`). The site starts in it (module switches `st.page` from `spi_dash` when there is no hash). Full-height plant 3D with all 8 equipment sets, left rail, card with real stock status counts, buttons to the set drawing and spare parts.
Search (top left): local match on tag, name, class and bill of materials lines flies to the set at once; server results add locations (`/api/data/locations`) and catalogue parts (`/api/data/parts`). A location or part with no set of its own is shown on the set of the same equipment class and the card says so, with an "Open in 3D" button for the location. A part result flies to the set that holds it and opens the part inspector.
Open item for A: nav entry and start page (see docs/TASKS.md).

## World overhaul, set tab, clean-up (latest)
- Plant 3D (`spi_space`) is now a game-like world: dark floor, no roads, rack, tank or flare (`P3SITE.world` in plant3d.js, `spiWorldScene` in spi_draw_space.js). 27 units in six districts with colour coded pads: 8 equipment sets plus 19 class templates. Left list of all units with location counts per class; click in 3D, in the list, or search. A unit card lists every functional location of its class from the baseline data (filter, show more) and each opens in Equipment 3D.
- Equipment set tab (Overview): `spi_zone_set.js` replaces `spiEquipPanel`: every functional location tied to the set (set, sub-items, instruments and lines naming it) and every material of its bill of materials, no 60 row cut, filters, each row opens the part pop-up; also the parts linked by drawing text or order.
- Clean-up requested by the owner: `spi_zone_clean.js` hides pages with no data in this case (Plant overview, Plot Plan, Maintenance generic, Performance, Scenarios, Interlock Library, AI Assistant, Knowledge Studio, Failure Memory, Integrations, Governance, Costing, My work, OPL Library, Data Quality), sends their links to the library, drops the P&ID tab, and hides the cards "Location in the unit", "Place in the plant", "Key items on the P&ID", "How it works", the "Ask the assistant" button and the bogus "Functional location SPI-Not in baseline data-01" fact.
- Test: `node tests/spi_ui_b_chain.js` (all 27 units found and in view, location list, set tab materials and locations).

## Library: one block per class, light theme (latest)
- No double blocks: the 8 equipment sets share one block per designed class (turbine driver: KT-383A and KT-202; centrifugal pump: PP-148A and PP-411A; cracking furnace: BF-108 and BF-110; heat exchanger; control valve). 24 blocks in total (5 with sets, 19 templates). A set found by search or tag flies to its block and becomes the active set (`P3.rep`, `P3.alts`, `SPSP.act`, `spiSpFly`); the card shows the sets of the block as buttons.
- Light theme, plain: white plinths with a coloured rim per district, light floor, white label chips, white cards and list. The invented "Running" status rings and lamps are switched off in the world (`P3SITE.world` in plant3d.js).
- Effects: district names on the floor, hover ring, selection ring and an arrival wave when search lands on a block, card slides in. All plain lines, no glow.

## Overview and Inventory overhaul (B owns these two hubs now, per the owner)
- **Equipment explorer** (`spi_zone_exp.js`, page `spi_space`, first view of Overview): one workspace, no page jumps. Trail at the top: Plant > Block > Equipment > Zone > Part, every crumb goes back, plus "Back one step". Stage on the left swaps between the 3D world of blocks and the equipment 3D (opened in place, `exOpenFunc`). Panel on the right: block list, block card with all functional locations of the class, zones of the equipment, parts of a zone, part detail (3D, stock, history, where used). Where used and search results open in the same place. `spiPartOpen` opens in the panel while the explorer is on screen.
- **Inventory > Stock** (`spi_health_inv.js`, page `spi_inv`): categories (shortage, excess and idle, kept on purpose) | part list with stock bar against Min and Max | part detail, all side by side, trail Inventory > Category > Part. Find is slimmer (no link row), results open the part and "Open in the explorer".
- Hub tabs are changed from `spi_zone_exp.js` (mutates `SPI_HUBS`): Inventory = Stock, Find, Locations and equipment, Part types, Registers, Documents and log. `spi_health` is no longer in the menu.
- Where used from any part panel now goes to the explorer with the part selected (`spiGo('spi_space',{funcloc,fmat})`).
- Tests: `node tests/spi_ui_b_chain.js` (40 steps incl. explorer route and inventory).

## Maintenance, Forecasting and Simulation, Costs rebuilt as tools (owner request)
All views of these three tabs are interactive tools (inputs left, results right), data from spi.sqlite through `server/ws/*.mjs`, state readable and runnable by the AI (`spiWsSnapshot`, `spiWsRun`). Full list and model notes: `docs/spi/WS_TOOLS.md`. Hub tabs are set in `src/modules/spi_zone_ws.js`. Tests: `node tests/spi_ui_b_chain.js` (54 steps).

## Latest (connections round)
Explorer equipment: 3D model and 2D drawing side by side, synced zone selection, part thumbnails; process connections in the world; link map everywhere; economics panel. Note to Claude A: docs/inbox/claude-a-from-b.md.
