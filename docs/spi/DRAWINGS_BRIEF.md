# Equipment drawings and 3D for the SPI case: brief from Claude B to the other agents

Owner: Claude B. Updated at each push. Branch `claude/funny-edison-pis09w`. Claude A merges it into `main`.

## What B is doing (usage is about 98% left, the earlier "1%" was usage used, not left)
Real, class-specific drawings and 3D models for all 8 equipment sets, with the spare parts shown on them in their zone and coloured by stock status. Replaces the generic "40 bars" 2D drawing and the generic boxes in 3D.

| Class | Sets | Standard basis (named for what it covers) |
|---|---|---|
| Steam turbine driver | 1 KT-383A, 2 KT-202 | API 612 (turbine), API 614 (lube oil), ASME B16.5 (flanges) |
| Cracking furnace | 3 BF-108, 4 BF-110 | API 560 (fired heaters), refractory per the parts list |
| Centrifugal pump | 5 PP-148A, 6 PP-411A | API 610 OH2 layout, API 682 (mechanical seal and flush plan) |
| Shell and tube exchanger | 7 HE-605 | TEMA, API 660, ASME B16.5 |
| Control valve | 8 FCV-1905D | ISA-75 / IEC 60534 style globe valve with diaphragm actuator and positioner, ASME B16.5 |

Everything is labelled "Schematic generated from the baseline data (SYNTHETIC geometry)". No dimension, size or rating is invented: nozzle sizes stay "not stated".

## How the parts get onto the drawing
- Each real BoM line of a set is put into a zone by its text (bearing, seal, gasket and studbolt, filter, refractory, trim, and so on). A zone is drawn as one component of the machine. The zone carries the number of its first BoM line, so the existing drawing, card and tables keep working.
- Stock status per part (screening rule, shown in the legend): red = zero stock and (criticality S or A, or it has had demand); amber = below Min; grey = above Max (excess); green = within Min and Max; light = no stock record. A zone shows its worst status. Selecting a zone lists every part in it with stock, Min, Max and a link to the Forecast page.
- Data comes from `GET /api/data/equipment/<tag>` (fields `material_no, stock, min_qty, max_qty, total_qty, crit_max`). No new endpoint is needed. The material number is read from the BoM `mat` text ("Material 4100024158 | B8M").

## Files B touches (all inside B's ownership)
`cases/spi/geo/g3m.js`, `cases/spi/geo/gad.js` (new, case geo files), `src/modules/spi_overlay.js` (new), `src/modules/g3d.js`, `src/modules/style3d.css`, `docs/spi/shots/**`, `docs/handoff/b.md`. Nothing in `src/modules/ga.js`, `build.py` or the pack data is edited: B wraps functions at run time and replaces `GA[n].nz` (the generic "N1 Inlet, N2 Outlet") with class nozzle names in the geo file.

## What B needs from the others
- **Claude A:** nothing blocking. Please keep `/api/data/equipment/<tag>` returning `parts[]` with the fields above. FYI data observations: the KT parts lists contain air intake and fuel gas filters (a gas-turbine feature) although the class map says steam turbine; the maintenance page throws `Cannot read properties of undefined (reading 'slice')` in `mlab` (mh*.js) for the SPI pack when `case_shots.js` runs.
- **Codex AI (Forecast page):** the zone card links to `go("spi_forecast",{material_no:<id>})`. Tell B in your handoff if the page expects another parameter name.
- **Codex Fin:** nothing. If you add a recommendation per part in `/api/data/equipment`, B will show it in the zone card instead of the screening status.

## Status (2026-11-04, B)
Done and pushed: all 8 sets (2 turbines, 2 furnaces, 2 pumps, 1 exchanger, 1 control valve) have a class-specific 3D model, a 2D sheet (front elevation and plan, balloons, nozzle tags, dimensions, notes), the stock overlay with legend, zone table and zone card, and the plant 3D layout. Screenshots in `cases/spi/geo/shots/`.

How to check: build `python3 build.py spi`, start `node tools/spi_dev.mjs 8800 full` (run `npm install` once), open Equipment Sets, a set, tab "Drawing and 3D". Tests: `node tests/stress3d.js`, `npm run test:quick`.

Known limits: one set of nozzle names per class (sizes not in the data); the P&ID tab is still the generic generated one; zone colour is the worst status of its parts (the part list on the page has every part); stock status is the screening rule above, not the engine's recommendation.

Next for B: Recommendations and Inventory health pages (B3), then Optimisation and Scenario (B4).

## Plan 2 (2026-11-04, B): every spare part in 3D, and visuals designed from all six data files
Decided with the human. Everything stays in B's files; no new engine, no new data source. Each item lists the files B touches and what B needs from the others.

| # | What B builds | Data it uses | B files | Needs from others |
|---|---|---|---|---|
| P1 | **3D model and 2D sheet for every spare part type** (53 item types: bearing, seal, gasket, O-ring, stud bolt, valve, pipe, elbow, tee, flange, trim set, seat ring, positioner, coupling, spring, impeller, blade, transmitter, thermowell, thermocouple, filter element, refractory and more). Built from the description (size, rating, schedule, grade, dimensions where the text gives them), labelled "Schematic from the description". Viewer function `spiPart3D(host, material_no)` that any page can call, thumbnails in the zone card, a part sheet with standard references (ASME B16.5, B16.20, B16.21, B36.10M, ISO 15, API 682 ...). | BoM, material descriptions, `material` table fields nps, rating, grade, schedule | `src/modules/spi_draw_parts.js` (new) | Codex AI (Forecast page): call `spiPart3D(el, mat)` to show the part. A: nothing. |
| P2 | **Inventory health page**: status distribution, criticality by status matrix (clickable), "no Min and Max set" gap, shared-part commonality (where used), demand class quadrant (ADI against CV2). | BoM stock, Min, Max, Movement history | `src/modules/spi_health.js` | A: `/api/data/stock-health` (exists). Codex Fin: `/api/engine/health` row shape (exists). |
| P3 | **Recommendations page** (action queue, filters, CSV, reason per row) and **campaign readiness timeline** (today, order-by, needed-by against lead time and stock). | Mitem and Mplan, PR PO lead times, Movement campaigns, engine recommendations | `src/modules/spi_reco.js` | Codex Fin: recommendation rows in the engine answers. A: `/api/data/campaigns` (exists). |
| P4 | **Drawings and 3D for every equipment class** (relief valve, shutdown valve, level control valve, transmitters, gauge, thermocouple, exchanger variants) so any location opened from the Locations page gets a drawing, plus an equipment timeline lane chart (planned maintenance, notifications, issues, orders on one axis) and a plant explorer. Line text "FROM x TO y" is checked for connection coverage first. | FuncLoc list, Notif History, Mitem and Mplan, Movement, piping line text | `cases/spi/geo/*`, `src/modules/spi_draw_equip.js`, `spi_zone_*.js` | A: the Locations page (`spi_loc.js`) may call `spiEquipDrawing(funcloc)`; endpoint `/api/data/location` (exists) for the lanes. |
| P5 | **Optimisation** and **Scenario simulator** pages. | Engine optimise and simulate | `src/modules/spi_opt.js`, `spi_scn.js` | Codex Fin: `/api/engine/optimise`, `/api/engine/simulate` shapes (exist). |
| P6 | **Supplier and lead time views**: lead time distribution and spread, supplier concentration, delivery slip. | PR PO | `src/modules/spi_opt_supply.js` | A: one read endpoint for supplier and lead time statistics (B writes the wanted shape in the handoff). |

Order of work: P1 first (the human asked for every part in 3D), then P2, P3, P4, P5, P6. B pushes its branch after every working step and updates `docs/handoff/b.md`.

## Status of plan 2 (2026-11-04, B)
Done and pushed (all on real data, `node tools/spi_dev.mjs 8800 full`):
- **P1 part models:** `src/modules/spi_draw_parts.js`. 3D model, 2D sheet (front and top, overall dimensions) and standards line for all 53 item types, from the description. `spiPart3D(description,{h})` returns the viewer html, `spiPartOpen(description, material_no)` opens the panel (3D, parameters, sheet, stock facts, link to the forecast), `spiPartThumb`, `spiPartSvg`. The zone card, the health, recommendation and optimisation tables have a 3D button. Page `spi_parts` (Part library, 53 cards, parts of a type). The renderer got two solids: annulus (rings, sectors) and tube sweep (O-ring, spring, bent pipe).
- **P2 `spi_health`**, **P3 `spi_reco`** (queue, filters, CSV, reasons, order-by timeline and planned load), **P5 `spi_opt`** and **`spi_scn`** (sliders against `/api/engine/simulate`).
Not done yet: P4 drawings for the other equipment classes, equipment timeline and plant explorer; P6 supplier and lead time views.

**Needs from A:** (1) add `["spi_parts","Part library", <icon>]` to `spi/pages.json` (the page is registered, nav is hidden until listed); (2) read endpoints, so B can build P6 and the commonality view: `/api/data/item-types` (item type, parts, stock value), `/api/data/commonality` (parts by number of locations served), `/api/data/suppliers` (supplier, PO lines, median and p90 lead time, spend). (3) `case_shots.js` still throws in `mlab` (maintenance) for the pack.
**Needs from Codex Fin:** the first `/api/engine/optimise` call computes every part and takes about 10 s (then 40 ms); on Vercel every cold start pays it. Precompute into `results.sqlite` or cache the portfolio.
**For Codex AI:** call `spiPartOpen(descr, mat)` or embed `spiPart3D(descr,{h:320})` in the Forecast page.

## Plan 3 (2026-11-04, B), agreed with the human: every location clickable in 3D, every distinct material in 3D
Goal: from the plant, a system, a class or the Locations page, any of the 14,451 equipment locations opens a clickable 3D model; clicking a zone lists its parts; clicking a part opens its 3D model, sheet, stock, history, lead time and recommendation. All 7,481 materials already have a 3D model (636 distinct shapes: 591 sized from the description, 45 generic type templates for the 5,777 parts that carry only a type code).

Design: one **template per distinct equipment type** (about 31: 24 classes plus 7 sub-item types), instantiated for each tag with its own real parts from `/api/data/location`. Assemblies (pump with motor and seal system, furnace with coils, burners, quench fittings, ducts and peep doors, compressor with motor) are one model with clickable sub-items. Tiers, with the share of the 4,516 locations that carry spare parts: done 32% (pump, exchanger, furnace, turbine, flow control valve); tier 1 57% (relief, shutdown, pressure, level, temperature control and motor operated valves); tier 2 84% (vessels, columns, generic instrument); tier 3 about 87% (compressor train, pump and furnace sub-items); tier 4 100% (piping lines, junction boxes, orifices). Corrections first: the turbine drive type, the exchanger "tube" zone and the compressor train reuse of the turbine model are not supported by the data and get neutral wording.

New page `spi_eq` (Equipment 3D, any location): `spiGo('spi_eq',{funcloc:'PX_PRV-123'})`. Files: `src/modules/spi_draw_equip.js`, `cases/spi/geo/g3m.js` (templates), `src/modules/style3d.css`.

**Needs from Claude A:** (1) in the location detail view of `spi_loc.js` add a button on every location: `spiGo('spi_eq',{funcloc:<funcloc>})` (today it only opens the 8 pinned sets); (2) add `["spi_eq","Equipment 3D",<icon>]` and `["spi_parts","Part library",<icon>]` to `spi/pages.json` if you want them in the menu (both pages work without it); (3) keep `/api/data/location?funcloc=` returning `parts[]` with material_no, descr, stock, min_qty, max_qty, total_qty, crit_max, plus notifications and planned_maintenance as now. **Needs from Codex AI:** call `spiPartOpen(descr, mat)` from the Forecast page. **Needs from Codex Fin:** nothing.

## Status of plan 3 (2026-11-04, B): tiers 1, 2 and most of 3 and 4 are in
Page `spi_eq` (Equipment 3D, any location) works on the real database for every class: pump, exchanger, furnace item, turbine, control valve, **relief valve, shutdown valve, motor operated valve, vessel, column, field instrument (all seven instrument classes), compressor train item, orifice, junction box, piping line**. 15 templates in `cases/spi/geo/g3m.js` (`SPI_BUILD`), zones per class by part type, a 2D sheet and the stock overlay for each. `spiLocRegister(loc)` builds the model of any location under a private key; `spiEqShow` fills it from `/api/data/location`. Click a zone in 3D, on the sheet or in the zone table: parts with stock, Min, Max and status; each part has its own 3D and sheet. Below: spare parts table, maintenance notifications, planned maintenance, parts linked by drawing text or order.

**Entry points:** `spiGo('spi_eq',{funcloc:'PX_PRV-1188B'})`; the search box on the page; the Locations page detail view (B wraps `spiLocDetail` at run time to add an "Open in 3D" button on every location; A may add the button natively, B's wrapper skips it when present).

**Not yet:** pump motor and seal-system sub-items, furnace sub-items (coils, burners, quench fittings, ducts, peep doors) as their own clickable assemblies; process block flow explorer; equipment timeline lane chart; the corrections to the turbine drive type, the exchanger tube zone (tube plugs are the tube bundle, PIPE is connection piping) and the first-plant leftovers in the plant view.

Corrections done (B): turbine labelled "drive type not stated, API 612 layout assumed"; exchanger: tube plugs mark the tube bundle and PIPE parts are "connection piping"; the plant 3D view no longer draws the first plant's control room, tank or separator (rack and flare are illustrative).
