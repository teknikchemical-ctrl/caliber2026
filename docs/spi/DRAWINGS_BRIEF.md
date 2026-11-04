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
