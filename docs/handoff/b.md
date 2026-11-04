# Handoff note, Claude B

**USAGE (2026-11-04):** about 98% left (the earlier "1%" was usage used, not left). Claude A restored the full role.

## Parked head start for B1 (not in src/, so it cannot collide with A's files)
`(removed)` (copy to `src/modules/` and drop the `.txt`): `spi_core.js` (spiApi with fixture mode, render hook, run-time nav group, tables, bars, tooltips), `spi_stub.js` (sample data in API shape), `spi_dash.js` (Overview), `spi_arch.js` (Data and architecture), `style_spi.css`. Written, not yet built or looked at. Data shapes assumed are in `spi_stub.js` (`/api/data/summary`, `/api/data/dq`, `/api/data/architecture`, `/api/engine/health`); A and Codex Fin should match them or tell me the real ones. Needs build.py to include `src/modules/spi_*.js` and `style_spi.css`; no dispatch or nav patch needed.

Keep this file current. Update it at every push, in under 15 lines. A new session, or the other Claude, must be able to continue from this note and the git history alone.

**Updated:** 2026-11-03   **Branch:** claude/funny-edison-pis09w   **Last commit:** see git log

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
