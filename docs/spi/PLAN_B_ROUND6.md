# Claude B round 6 plan (waiting for owner approval)

Goal: every tab reads like a monitoring terminal. Every chart is quantitative: hover shows the value, unit and caption. All figures come from one model. Claude A owns the model and the AI; Claude B owns the charts, layout and interaction.

## 1. One chart engine with hover readout (`kbChart`, B's kit)
- **Crosshair on hover.** A vertical line snaps to the nearest month, day or category. A readout card lists every visible series with its colour, value, unit and basis (Data, Estimate, Assumption), plus the date. For example: "Mar 2027 | Stock value, recommended median IDR 972.6 bn (Estimate) | 8 in 10 runs IDR 965.7 to 979.4 bn".
- **Bars, stacked bars, bands and markers.**
  - Bars show their own value, plus the total for a stacked bar.
  - Bands show low to high.
  - A marker shows its event text.
- **Value on the last point.** The last point of each line is labelled at the right edge, as in the reference.
- **Axes and units.**
  - Units are written on every axis, as in "IDR bn", "EA per month" or "parts".
  - Thousands separators are used.
  - Values below 1 bn are shown in mn, so a chart never shows only "0".
- **Touch and keyboard.** Tap shows the readout on touch screens. Arrow keys move the crosshair.
- **Pages covered.** Every B page moves to `kbChart`: timelines, the stock fan, cost bars, the waterfall, suppliers, status, the part card, the planner and maintenance. The 20 small Summary charts get a hover value.
- **A's charts.** A's `spiAxLine` and `spiAxBars` (`spi_viz.js`) and `spi_tl.js` are A's files. B asks A either to switch them to `kbChart` or to add a data attribute per point, so that B's hover layer works on them too.

## 2. Terminal layout for each tab (reference image)
Every landing view of the five tabs uses the same frame:
- **Top strip.** Four to six live KPIs, each with:
  - its value and unit;
  - the change against today's Min and Max;
  - a small sparkline;
  - a status colour.
- **Main area.** Two or three stacked panels that share one time axis, zoomed and panned together, with one crosshair across all panels:
  1. history and prediction with the 80% fan;
  2. purchases or work;
  3. stock or risk.
- **Range buttons.** All, 24M, 12M and 6M sit above the panels, with a "Today" button that jumps to the data cut-off.
- **Right side panel.**
  - Events in the window: orders, notifications and campaigns. Clicking one centres the timeline on it.
  - The AI box sits at the top of this panel.
- **Bottom.** The work-order or part list for the window in view. It filters live as the user pans.
- **Per tab:**
  - **Overview:** plant KPIs, status groups, stock value and risk through time.
  - **Inventory:** the Optimized Scenario purchases, stock value, stockouts.
  - **Maintenance:** notifications, backlog, the plan with its work pack.
  - **Forecasting:** issues with the learned forecast and fan, then stock and stockout chance.
  - **Costs:** cost per month by type and the impact waterfall.
- **Theme.** Default is the current light theme with the terminal density. A dark terminal theme is optional, behind a toggle, if the owner wants it.

## 3. Rename and wording
- "Golden path" becomes **Optimized Scenario** in every tab label, title, caption and test.
- The Inventory landing page becomes "Optimized Scenario: purchases". The Forecasting landing page becomes "Optimized Scenario".
- The SPIWS id stays `golden` so the AI and A's endpoint keep working. A is asked to rename the words in the AI text.

## 4. One model, more rigorous (B side only)
- **The problem today.** B's `/api/ws/golden` and A's `/api/data/golden` give different savings: IDR 160.6 bn against IDR 43.4 bn per year.
- **B stops running its own optimiser.** All B pages read A's model: the Optimized Scenario, status, the planner and part card, impacts and costs. B's `server/ws/golden.mjs` and `advice.mjs` become thin adapters over A's `golden()`, or are retired, so every page and the assistant quote the same figure.
- **Rigour B makes visible:**
  - Monte Carlo fan (p10, p50, p90) on every projection.
  - Stockout chance per month.
  - The service level actually reached against the target.
  - A backtest panel: forecast against actual for the last 6 months, with the error shown as a figure (MAPE and bias), as soon as A exposes it.
  - Every figure carries its basis label.
- **Inputs.** Each one re-runs A's model and shows the delta against the recommended run in the KPI strip and in the hover readout.

## 5. Tests
- **Chain test additions:**
  - hover shows a readout with a value and unit on every B chart type;
  - synced panels move together;
  - range buttons work;
  - the side event list centres the timeline;
  - "Optimized Scenario" appears and "Golden path" does not.
- **Handler test.** Updated for the adapters.
- **Performance budget kept.** The chart engine is SVG with one shared overlay per panel, and does no work while the tab is hidden.

## Order of work
1. `kbChart` and the hover readout.
2. Rename.
3. Terminal frame on Forecasting and Inventory.
4. Maintenance, Costs and Overview.
5. Move to A's single model, as A's endpoints extend.
6. Tests and docs.
