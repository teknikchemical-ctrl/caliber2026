# Note from Claude B to Claude A (2026-11-04)

Branch `claude/funny-edison-pis09w` is ready to merge; it merges cleanly with `origin/main` as of this note. Tests: `node tests/spi_ui_b_chain.js` (70 steps), `node tests/spi_ui_b_handlers.js` (every inline handler compiles), `npm run test:quick` (then `python3 build.py spi`).

## What B owns now (owner decision)
Tabs Overview (Equipment explorer, Summary), Inventory, Maintenance, Forecasting and Simulation, Costs. Hub tab lists are set from `src/modules/spi_zone_exp.js` and `src/modules/spi_zone_ws.js` (they overwrite `SPI_HUBS` after `spi_hub.js` loads). Your pages that are out of the menu (code untouched): spi_cov, spi_ready, spi_val, spi_arch, spi_maint, spi_m_*, spi_f_*, spi_c_*, spi_fo, spi_sim, spi_forecast, spi_reco, spi_opt, spi_outlook, spi_savings, spi_health.

## How the AI reads and drives the site
- `spiWsSnapshot()` returns `{assumptions, views:{<tool>:{title, answers, inputs, figures, outputs, sources, updated}}}`: exactly what the user sees. `answers` lists the case points the tool covers (ids as in `/api/ws/questions`).
- `spiWsRun(<tool>, inputs)` sets the inputs of a tool on screen and recalculates. Tools: iplan, mtime, mnotif, mplan, mkit, mrel, ssim, scr, cimp, ccalc, csave, cbuy, sup, links (plus explorer_economics, explorer_flows written by the explorer).
- Every endpoint under `server/ws/` answers `{tool, inputs, outputs, figures:[{id,label,value,unit,basis}], sources, notes}` and is read-only SQL on spi.sqlite: advice, series, costrisk, costs, savings, buyplan, notifications, notification, plan, kit, reliability, timeline, suppliers, links, flows, questions. They can be registered as AI tools one to one. Details and model notes: `docs/spi/WS_TOOLS.md`.
- `/api/ws/questions?q=<id>` gives one structured answer per point of the case (no page): d_* for key question 1, s_* for key question 2, data_sources for the six files.

## Connections between the views (all in place)
- 3D world of blocks, piping-line process connections between blocks (`ws/flows`), block card with every functional location of its class, search that opens a location or set in place.
- Equipment in the explorer: 3D model and 2D drawing side by side or alone, a zone selected on either selects it on the other and lists its parts with 2D thumbnails; economics panel (today against the recommendation, four case impacts); link map of its parts and the equipment that share them.
- Part panel (pop-up and explorer): 3D, stock, history, where used, link map of the equipment that install it, stock projection and order advice in the Inventory planner.
- Inventory planner: part, equipment set or location, all parts ranked; impact panel; link map of where the part is installed.

## Please
1. Merge the branch; keep `server/ws/` (add `server/ws/.*` to the B pattern in `tools/baseline_check.sh`).
2. Do not change the hub tab lists of the five tabs; tell B in `docs/TASKS.md` if a page of yours must return.
3. Cost assumptions (downtime per hour by criticality, share of stockouts that stop equipment, hours per stockout, emergency premium, carrying rate, order cost) are editable defaults in `SPA` (`spi_zone_ws.js`) and in each endpoint; if Codex Fin has better figures, change `SPA_DEF` and the endpoint defaults together.
