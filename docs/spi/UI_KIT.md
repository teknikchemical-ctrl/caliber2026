# UI kit and visual rules (all agents, owner: Claude A)

Every page is a quantitative dashboard, not a table dump. Source: `src/modules/spi_viz.js`, styles `src/modules/style_spi.css`. Do not write your own chart code or colours.

## Page pattern
1. `spiHead(title, insightHtml, rightHtml)`: one sentence with the key figures in bold. The reader gets the answer first.
2. `spiTile({label,value,delta,tone,info,js})` row of 3 to 4 tiles. Short values only (`IDR 616.6 bn`, `93.3%`), no sentences.
3. Chart cards with `spiCard(title, chartHtml, caption)`. Caption says what the axes and units are and which figures are Estimates or Assumptions.
4. Tables only behind `spiMore("label", html)`.

## Charts (all inline SVG, one y scale per chart, ticks, gridlines, axis titles with units, legend)
- With axes: `spiAxLine` (time series, bands, reference lines, forecast divider), `spiAxBars` (grouped or stacked, from zero), `spiAxXY` (numeric x and y, trade-off curves).
- Without axes by design: `spiTreemap`, `spiPareto`, `spiHBars`, `spiHeat`, `spiBullet`, `spiDumbbell`, `spiStack`, `spiFunnel`, `spiCalStrip`.
- Never two y scales in one chart. Two measures means two charts.
- Chart width: pass `w` close to the real pixel width (about 1100 full width, 700 for two thirds, 300 for a quarter) so fonts stay readable.

## Colour (tokens in `SPI_TONE`)
Criticality: `crit_S` darkest blue to `crit_C` lightest. Status: `bad` red, `warn` amber, `ok` green, `n` grey, `acc` blue, `fc` violet for forecast. Stock status: `ins`, `nonmoving`, `slow`, `nonstock`, `excess`, `excess2`. Do not add new colours.

## Text
Plain engineer English, no marketing words, no em or en dashes, `%` symbol, units after numbers (`3.2 barg`), IDR with `bn` or `tn`. Every IDR figure says Estimate once on the page. Missing values read `Not in baseline data`.

## Performance
Pages render the first screen from fast endpoints, then fill slow sections (for example `/api/engine/compare`, about 18 s cold) into a placeholder div. Never block the whole page on a slow call.

## Flagship page
`spi_fo` (Forecasting and optimisation) is the page the jury should open second. Its sections: trade-off curve, action mix, out-of-sample policy test, capital, part explorer. Codex Fin owns the engine numbers behind it, Claude A the page.

## Colour update
Chart colours now follow the validated palette of the dataviz method: categorical blue, violet, aqua, yellow, magenta; status good, warning, critical; criticality as a blue sequential scale (S darkest). Neutral surfaces `#fcfcfb`, grid `#e1e0d9`. Tokens live in `SPI_TONE` (`spi_viz.js`); never hard-code a chart colour.

## Documents and log (spi_ingest)
Logging form and file check. Server: `POST /api/data/ingest-check` (stateless; kinds goods_issue, goods_receipt, stock_count, stockout_observed; optional `opening` balances). The host database is read only, so the log is kept in the browser and exported as CSV or JSON for the ETL.

## Site structure: five tabs (hubs)
Overview, Inventory, Maintenance, Forecasting and Simulation, Costs (`spi_hub.js`, ids `spi_h_ov`, `spi_h_inv`, `spi_h_mnt`, `spi_h_fc`, `spi_h_cost`). Every other page is a view inside one hub (list `SPI_HUBS`). `spiGo('<page id>')` still works: it opens the hub that holds the page and selects the view. To add a view, register the page as before and add it to a hub in `SPI_HUBS`; do not add a navigation item.

## Tables stay hidden until searched
`spiTable` hides tables of more than 5 rows behind a search box (client-side filter, minimum 2 characters). Pass `{always:true}` only for server-paged lists that you gate yourself (show nothing until a search or filter is set). Do not write raw `<table>` markup for lists: use `spiTable`. Heatmaps (`spiHeat`) and small key-value tables are fine.
