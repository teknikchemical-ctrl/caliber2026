# Equipment sets and drawings from the spare part data

The human wants equipment sets and drawings kept. We keep the case-pack engine for them. The data has no drawings, so everything is **generated and labelled "Schematic generated from the baseline data (SYNTHETIC geometry), parts and stock are real records of the baseline dataset"**.

## What a set is here
A set is one equipment train picked from the FuncLoc and BoM data: its tag, name, system, criticality, the real parts list (BoM rows, with stock, Min, Max, consumption, forecast and recommendation per part), and a generated P&ID, general arrangement and 3D model from `src/modules/auto.js` and `auto3d.js`. The spare parts are shown ON the drawing: each part is placed in a zone of the machine by item type, coloured by stock status (red stockout risk, amber below Min, green OK, grey excess).

## Selection (script `spi/etl/pick_sets.py`, Claude A)
Up to 8 sets (the layouts are built for 8): score = criticality weight (S 4, A 3, B 2, C 1) x number of BoM parts x consumed parts, one best per equipment class so the demo shows variety. Planned: 2 compressor and turbine trains (KC with its KT, S, 170 to 230 parts each), 2 cracking furnaces (BF), 2 pumps (PP, one S, one A, API 610 and 682 style), 1 heat exchanger (HE), 1 control or safety valve with positioner (FCV or PRV). Result in `equipment_set`.

## Case pack generation (script `spi/etl/make_case.py`, Claude A) -> `cases/spi/`
Writes `plant/case.json` and `plant/sets/NN-tag.json` (the compact format of `docs/CASE_PACKS.md`), then `python3 tools/pack_build.py cases/spi`. Mapping:
- `tag, name, unit, area, crit`: from funcloc. `kind`: pump, comp, fan, valve, hx, fired, column, drum, from the equipment class (map in `spi/etl/eqclass_map.json`; KT turbines use `comp`).
- `bom` (parts list): real BoM rows for the set (all parts, the app pages them). `instruments`: the instrument locations under the equipment (PIT, TIT, FIT, LIT, DPT) with ISA-5.1 tag letters; `datasheet`: from class (API 610, 617, 612, 660, 560 headings with "per standard" and values only where the data gives them, else "Not in baseline data").
- `interlock`: only for S and A sets, trips generated from the instrument types, labelled SYNTHETIC and screening level; or leave empty and hide the page (preferred if short of time).
- `history`: `mh.json` built from Notif History (notifications as work orders; there is no cost field: show counts, durations, priority).
- Documents for assistant retrieval: one generated document per set (equipment summary with criticality, systems, spare part families, PM plan, procurement summary) marked "Generated from baseline data".
- `cases/spi/case.json`: title "Spare Part Intelligence", subtitle with the competition, example questions about parts and stock (not about trips).

## Part to zone map (`spi/etl/part_zone_map.json`, Claude A first version, Claude B refines)
By `eq_class` and `item_type`: pump (IMPELLER, WEAR RING, SLEEVE, SEAL, BEARING, COUPLING, GASKET), compressor and turbine (BEARING journal and thrust, SEAL labyrinth, BLADE rotor, GOVERNOR VALVE, COUPLING, SPRING), furnace (CASTABLE and refractory, BURNER, TUBE support, THERMOCOUPLE), exchanger (GASKET, TUBE BUNDLE, STUDBOLT), valve (TRIM SET, SEAT RING, POSITIONER, DIAPHRAGM, SPRING). Unmapped item types go to a generic "other parts" band. Claude B draws the zones in `cases/spi/geo/` or extends `auto.js` hooks via a request to Claude A.

## Pages kept, hidden, added
Kept: Dashboard (overview of sets), Equipment (sets with parts, P&ID, GA, 3D), Plot plan, Maintenance (from notifications), Documents, Assistant, Governance (evaluation). Hidden for this case unless time remains: Interlocks, OPL, Hazard, Scenario (process). Added: the `spi_*` pages (`TIMELINE.md`). Navigation order is set in `build.py` (Claude A).
