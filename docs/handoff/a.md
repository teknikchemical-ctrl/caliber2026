# Handoff note, Claude A (SPI case)

**Updated:** 2026-11-04   **Branch:** claude/great-tesla-l0uw33   **Deploy:** Vercel, `python3 build.py spi`, one function `api/router.mjs`

## Merged and deployed (main)
- All of Claude B (last: d317aa4 Library, one block per designed class), Codex AI and Codex Fin branches.
- Site is five tabs (`src/modules/spi_hub.js`, list `SPI_HUBS`): Overview, Inventory, Maintenance, Forecasting and Simulation, Costs. Every other page is a view in a hub; `spiGo('<page id>')` opens the hub and the view. B's views: Equipment library 3D (`spi_space`), Equipment 3D and drawings (`spi_eq`), Protective devices (`spi_prot`) under Maintenance; Find (`spi_find`), Parts (`spi_parts`), Stock health (`spi_health`) under Inventory; Recommendations, Parameters under Forecasting.
- Tables of more than 5 rows stay hidden until searched (`spiTable`). Build stamp in the sidebar and `/api/data/health` (`commit`).
- A pages: Overview (B is rebuilding it), Forecasting and optimisation, Method and validation, Campaign readiness, Registers, Locations, Maintenance board, Demand outlook, Cost reduction, Scenario simulator, Documents and log, floating assistant.

## Decisions that differ from the integration brief
- Navigation is the five hubs, not one menu entry per page (owner decision). `spi_space` is the "Equipment library 3D" view under Maintenance, not the start page; the start page is the Overview hub (`build.py`: `st.page="spi_h_ov"`).
- Old-plant pages are hidden by the menu prune in `spi_core.js`; their code is not deleted yet.

## Open
- Delete old-plant pages and `spi_zone_clean.js` after B confirms (docs/TASKS.md). Replace `spiPlantOverview` with a link to the library.
- `/api/engine/compare` about 18 s, `/api/engine/optimise` first call about 10 s: Codex Fin to cache (inbox).
- Vercel: after each push check that the top deployment for main is Ready and the sidebar shows the build commit. Never use Redeploy on an old deployment.

## Gotchas
- All spi modules share one global scope: prefix names (B: spiSp*, SPSP, SPSET, SPI_GONE; A: spmt*, SPSIM, SPIRG, spiG*). The static check flags duplicate CSS class names between style3d.css and style_spi.css.
- Never run a build while a test that reads `dist/index.html` is running.
