# Plan: refurbish the site into a quantitative, visual product (Claude A, 4 Nov 2026)

Status: PLAN, awaiting approval. Goal: every page answers one question with a chart first, a headline number and a short sentence; tables only behind a toggle or a drill-down.

## Diagnosis
Long explanatory sentences inside KPI tiles; bars with long labels; row tables as the main content; no ranking of what matters; same card everywhere; no comparison against a target or a baseline; raw part ids as the main label.

## Principles
1. Answer first: each page opens with one insight line computed from the data ("IDR 415 bn above Max, 72% in 10 parts").
2. At most 4 KPI tiles, each with a value, a comparison (change, share or target) and a sparkline when time-based. Notes move to an info tooltip.
3. Chart first, table second: every table is collapsed under "Show table" except the top 10 action list.
4. One visual language: criticality colours S, A, B, C; risk red, caution amber, in range green, excess grey; units fixed (IDR bn, parts, days); numbers compact; Estimate shown as a small badge.
5. Drill-down, not dump: click a bar, tile or cell to filter the page and open the part or location.
6. Global filter bar (criticality, equipment class, process system) kept across pages.
7. Performance: aggregate on the server, draw SVG for at most a few hundred marks, no libraries.

## Visual kit (new `src/modules/spi_viz.js`, Claude A, built first)
Treemap, waterfall, Pareto, heatmap, bullet (stock against Min, Max, reorder point), dumbbell (current against dynamic), quadrant scatter (demand against cover, size value, colour criticality), sparkline, calendar strip (campaign load), stacked health bar, funnel. Tooltips, click handlers, table toggle, colour-blind validated palette.

## Page by page
| Page | Headline visual | What goes |
|---|---|---|
| Overview | treemap of stock value by criticality and status; three "do first" action cards; campaign strip | tiles with sentences; top-10 tables |
| Inventory health | stacked health bar per criticality; quadrant scatter; Pareto of excess | category tile wall |
| Recommendations | action mix by criticality; order cash timeline; exposure Pareto; compact top 20 | 1,230-row first view |
| Demand outlook | history, p50 and band with campaign shading; small multiples by criticality | extra KPI row |
| Forecast | hero chart; bullet of stock against Min, Max, reorder point; decision card; AI reasoning collapsed | long assumption lists up front |
| Optimisation | dumbbell current against dynamic Min and Max; capital freed against added | raw columns |
| Scenario | curves (exist) plus a tornado of the sliders | table of results |
| Cost reduction and Impact | waterfall (stock to released), cash flow, tornado, two programmes side by side | tables |
| Locations and equipment | heatmap criticality by class, treemap of risk, then list; detail page with parts bullet charts | 14,484-row first view |
| Maintenance | calendar heat strip, backlog by criticality, open work at risk | three tables |
| Data and architecture | one diagram (sources, joins, derived, AI) and a quality scorecard | long tables |

## Delivery (about 9 hours left)
1. Chart kit and tokens: 2 h (Claude A). 2. Overview, Health, Recommendations: 3 h (A builds Overview; Claude B refits Health, Recommendations, Optimisation, Scenario to the kit). 3. Locations, Maintenance, Outlook, Cost reduction, Impact: 2 h (A; Codex Fin refits Impact). 4. Polish, phone width, performance, screenshots: 1 h. Freeze 3 hours before the deadline.

## Acceptance (every page)
Insight line; at most 4 tiles; at least one chart that answers the page question; tables collapsed; units on every number; first draw under 1 s; reviewed on a screenshot at laptop and phone width.

## Risks
Shared CSS collisions (kit first, others adopt page by page); data volume (server-side aggregation); time (kit, Overview and Recommendations first, the rest if time allows).
