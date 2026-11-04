// Tests for the view payloads (/api/view/*): figures carry a basis, numbers match the findings in docs/spi/DATA_FINDINGS_2.md. Usage: node tests/spi_views.js (full database and results.sqlite)
const path = require("path"), assert = require("assert"), ROOT = path.resolve(__dirname, "..");
process.env.SPI_DB = path.join(ROOT, "spi/db/spi.sqlite");
const run = async (name, query = {}) => { const m = await import(path.join(ROOT, "server/view/" + name + ".mjs")); return new Promise(r => { const res = { statusCode: 200, setHeader() {}, end(b) { r({ s: this.statusCode, j: JSON.parse(b) }); } }; m.default({ url: "/x?" + new URLSearchParams(query), method: "GET" }, res); }); };
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; console.log("ok  ", m); };
(async () => {
  const top = 4100000129, names = ["demand_predictability", "portfolio_forecast", "decision_board", "parameters_shift", "cost_risk", "part_forecast", "maintenance_population", "maintenance_driven_demand", "turnaround_readiness", "open_work_exposure", "cost_balance", "savings_waterfall", "cash_plan", "business_scorecard"];
  for (const k of names) { const r = await run(k, k === "part_forecast" ? { material_no: top } : {}); ok(r.s === 200 && r.j.insight && r.j.figures.every(f => ["Data", "Estimate", "Assumption"].includes(f.basis) && f.id && f.label), "payload " + k + ": insight and every figure has a basis"); }
  let r = (await run("demand_predictability")).j, er = r.classes.find(c => c.class === "erratic");
  ok(er.parts === 116 && er.share_value > 60 && r.classes.find(c => c.class === "single_event").parts === 1220, "demand predictability: 116 erratic parts carry over 60% of issued value, 1,220 single-event parts");
  ok(r.drivers.linked_issue_share > 15 && r.drivers.linked_issue_share < 17 && Math.abs(r.drivers.corr_planned_vs_orders) < 0.5, "demand predictability: 15.9% of issues linked, planned maintenance does not predict monthly orders");
  r = (await run("portfolio_forecast")).j; ok(r.forecast.length === 12 && r.history.length === 17 && r.forecast.every(f => f.p10 <= f.p50 && f.p50 <= f.p90), "portfolio forecast: 17 months history, 12 months forecast, ordered bands");
  r = (await run("decision_board")).j; ok(r.actions.reduce((s, a) => s + a.parts, 0) === 7481, "decision board: every one of the 7,481 parts has one action");
  r = (await run("cost_risk", { budget_bn: "20" })).j; ok(r.spent_idr <= 20e9 + 1 && r.frontier.length === 13 && r.frontier.every((f, i, a) => i === 0 || f.loss_avoided_idr >= a[i - 1].loss_avoided_idr), "cost-risk: budget respected, frontier is non-decreasing");
  r = (await run("part_forecast", { material_no: top })).j; ok(r.projection.dynamic.p50.stock.length === 12 && r.forecast.length === 12 && r.params.max >= r.params.min, "part forecast: 12 month forecast and projection, Max not below Min");
  r = await run("part_forecast", { material_no: 1 }); ok(r.j.error, "part forecast: unknown part gives a plain error");
  r = (await run("turnaround_readiness")).j; ok(r.months.length >= 10 && r.months[0].tasks === 1123 && r.months.every(m => m.parts_short <= m.parts_linked), "turnaround readiness: 1,123 tasks in the peak month, short parts never exceed linked parts");
  r = (await run("maintenance_driven_demand")).j; ok(Math.abs(r.correlations.planned_vs_orders_no_campaign) < 0.5 && r.campaign.uplift > 2, "maintenance-driven demand: weak planned-task correlation, campaign uplift above 2");
  r = (await run("open_work_exposure")).j; ok(r.exposed.length > 0 && r.exposed.every(x => ["S", "A"].includes(x.crit) && x.zc > 0), "open work: S and A locations with a critical part at zero");
  r = (await run("maintenance_population")).j; ok(r.figures.find(f => f.id === "repeat_locations").value === 27 && r.by_class.length >= 8, "equipment and failures: 27 repeat-failure locations");
  r = (await run("savings_waterfall")).j; { const tot = r.steps[0].value, rest = r.steps[r.steps.length - 1].value, mins = r.steps.filter(s => s.kind === "minus").reduce((s, x) => s + x.value, 0); ok(Math.abs(tot - mins - rest) < 1 && rest > 0, "savings waterfall: steps add up to the priced stock value"); }
  r = (await run("savings_waterfall", { realisation: "0.5", sa_share: "0" })).j; ok(Math.abs(r.figures.find(f => f.id === "release_realised").value - r.figures.find(f => f.id === "bc_gross").value * 0.5) < 0.2, "savings waterfall: release follows the realisation assumption");
  r = (await run("cash_plan")).j; ok(r.series.months.length === 24 && Math.abs(r.series.cum_net[23] - (r.series.cum_release[23] - r.series.cum_purchase[23])) < 2 && r.variants.length === 3, "cash plan: 24 months, net = release - purchases");
  r = (await run("business_scorecard")).j; ok(r.metrics.length === 8 && r.metrics.every(m => m.basis) && Object.keys(r.sensitivity).length === 3, "scorecard: eight metrics with basis and three sensitivity sets");
  r = (await run("cost_balance")).j; ok(r.by_criticality.length === 4 && r.policy && r.policy.dynamic.expected_stockouts_yr < r.policy.today.expected_stockouts_yr, "cost-risk balance: four criticality rows, policy reduces expected stockouts");
  console.log(`\nAll ${n} view checks passed`);
})().catch(e => { console.error("FAIL", e.message); process.exit(1); });
