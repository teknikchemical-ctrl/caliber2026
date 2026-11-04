# Base features (Claude A) and how everything is linked

All pages are data driven from `spi/db/spi.sqlite`. Page ids are in `spi/pages.json`; `SPI_MODE` hides every page of the previous plant case.

| Page (id) | Owner | Question it answers | Endpoints |
|---|---|---|---|
| Overview (`spi_dash`) | A | What is the stock position, where is the excess and the risk, when is the next campaign? | `/api/data/summary`, `/campaigns` |
| Locations and equipment (`spi_loc`) | A | For any of the 14,484 functional locations: criticality, spare parts and stock keeping, notifications, planned maintenance, cost | `/api/data/locations`, `/location?funcloc=` |
| Maintenance (`spi_maint`) | A | What maintenance is open or planned, where, and which critical locations have stock risk? | `/api/data/maintenance` |
| Demand outlook (`spi_outlook`) | A | What will consumption be over the next 12 months, by criticality or part type (rules projection, Estimate)? | `/api/data/projection` |
| Cost reduction (`spi_savings`) | A | How much working capital and holding cost can be released, with S and A protected? | `/api/data/savings` |
| Equipment sets, drawings, 3D, Plant overview | B | Schematic drawings, 3D, stock overlay for the 8 demo sets | `/api/data/equipment/<tag>` |
| Forecast, Ask the AI | Codex AI | Per part forecast with AI reasoning; specific questions | `/api/ai/*` |
| Recommendations, Inventory health, Optimisation, Scenario | B | Actions, health lists, dynamic Min and Max, what-if | `/api/data/stock-health`, `/api/engine/*` |
| Business impact | Codex Fin | The business case | `finance/spi/impact.json` |
| Data and architecture | A | Sources, joins, quality, standards, AI flow | `/api/data/architecture`, `/dq` |

## Links between pages (use `spiGo(page, state)`)
- Part row anywhere: `spiGo('spi_forecast',{mat:<material_no>})`. Location row anywhere: `spiGo('spi_loc',{loc:'<funcloc>'})`. Equipment set page (B): `go('equipment',{set:<n>,tab:'overview'})`; sets 1 to 8 are pinned (KT-383A, KT-202, BF-108, BF-110, PP-148A, PP-411A, HE-605, FCV-1905D).
- The Locations detail has a button to the equipment set when the tag is one of the 8 sets. B may add a button on the set page back to `spiGo('spi_loc',{loc:'PX_<tag>'})`.

## Rules every page follows
Criticality S, A, B, C is shown as a badge (`spiCritBadge`). Money is IDR and an Estimate (`spiMoney`). Missing data reads Not in baseline data. S and A parts are never counted as release. Stock is held per material: location level stock figures are not additive.
