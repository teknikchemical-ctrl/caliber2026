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
