// Tests for the view payloads (/api/view/*): figures carry a basis, numbers match the findings in docs/spi/DATA_FINDINGS_2.md. Usage: node tests/spi_views.js (full database and results.sqlite)
const path = require("path"), assert = require("assert"), ROOT = path.resolve(__dirname, "..");
process.env.SPI_DB = path.join(ROOT, "spi/db/spi.sqlite");
const run = async (name, query = {}) => { const m = await import(path.join(ROOT, "server/view/" + name + ".mjs")); return new Promise(r => { const res = { statusCode: 200, setHeader() {}, end(b) { r({ s: this.statusCode, j: JSON.parse(b) }); } }; m.default({ url: "/x?" + new URLSearchParams(query), method: "GET" }, res); }); };
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; console.log("ok  ", m); };
(async () => {
  const top = 4100000129, names = ["demand_predictability", "portfolio_forecast", "decision_board", "parameters_shift", "cost_risk", "part_forecast"];
  for (const k of names) { const r = await run(k, k === "part_forecast" ? { material_no: top } : {}); ok(r.s === 200 && r.j.insight && r.j.figures.every(f => ["Data", "Estimate", "Assumption"].includes(f.basis) && f.id && f.label), "payload " + k + ": insight and every figure has a basis"); }
  let r = (await run("demand_predictability")).j, er = r.classes.find(c => c.class === "erratic");
  ok(er.parts === 116 && er.share_value > 60 && r.classes.find(c => c.class === "single_event").parts === 1220, "demand predictability: 116 erratic parts carry over 60% of issued value, 1,220 single-event parts");
  ok(r.drivers.linked_issue_share > 15 && r.drivers.linked_issue_share < 17 && Math.abs(r.drivers.corr_planned_vs_orders) < 0.5, "demand predictability: 15.9% of issues linked, planned maintenance does not predict monthly orders");
  r = (await run("portfolio_forecast")).j; ok(r.forecast.length === 12 && r.history.length === 17 && r.forecast.every(f => f.p10 <= f.p50 && f.p50 <= f.p90), "portfolio forecast: 17 months history, 12 months forecast, ordered bands");
  r = (await run("decision_board")).j; ok(r.actions.reduce((s, a) => s + a.parts, 0) === 7481, "decision board: every one of the 7,481 parts has one action");
  r = (await run("cost_risk", { budget_bn: "20" })).j; ok(r.spent_idr <= 20e9 + 1 && r.frontier.length === 13 && r.frontier.every((f, i, a) => i === 0 || f.loss_avoided_idr >= a[i - 1].loss_avoided_idr), "cost-risk: budget respected, frontier is non-decreasing");
  r = (await run("part_forecast", { material_no: top })).j; ok(r.projection.dynamic.p50.stock.length === 12 && r.forecast.length === 12 && r.params.max >= r.params.min, "part forecast: 12 month forecast and projection, Max not below Min");
  r = await run("part_forecast", { material_no: 1 }); ok(r.j.error, "part forecast: unknown part gives a plain error");
  console.log(`\nAll ${n} view checks passed`);
})().catch(e => { console.error("FAIL", e.message); process.exit(1); });
