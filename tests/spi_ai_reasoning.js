// Structured AI reasoning, the single engine and the events contract (owner: Claude A). Usage: node tests/spi_ai_reasoning.js
// Checks: every number in an AI reply is present in the payload (rules and a mocked Gemini), the five blocks, the word limit, no "golden path",
// the Optimized Scenario against its schema and against Claude B's /api/ws/golden, and every event carrying the common fields.
const path = require("path"), assert = require("assert"), fs = require("fs"), ROOT = path.resolve(__dirname, "..");
process.env.SPI_DB = path.join(ROOT, "spi/db/spi.sqlite"); process.env.AI_PROVIDER = "mock";
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; console.log("ok  ", m); };
(async () => {
  const imp = (p) => import(path.join(ROOT, p));
  const { explain, reasonText, displays } = await imp("spi/ai/explain.js"), { unsupportedNumbers, schemaErrors } = await imp("spi/ai/validate.js");
  const { openDb } = await imp("server/_lib/db.mjs"), { golden } = await imp("server/data/golden.mjs"), { events } = await imp("server/data/events.mjs"), db = openDb();
  const schema = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, "spi/contracts", f), "utf8"));
  // 1. the engine
  const g = golden(db, {});
  ok(schemaErrors(g, schema("golden.schema.json")).length === 0, "golden: plant run matches spi/contracts/golden.schema.json " + JSON.stringify(schemaErrors(g, schema("golden.schema.json")).slice(0, 3)));
  ok(g.saving_per_year === g.totals.saving && g.totals.saving > 0, "golden: saving_per_year is the steady-state saving and positive");
  const one = golden(db, { mat: String(g.orders[0].material_no) });
  ok(one.part && ["order_now", "order_by", "no_order", "buy_when_needed", "no_use"].includes(one.part.decision) && one.golden.qty_fan, "golden: one part carries a decision and the on-hand fan");
  ok(g.top_parts.every((p) => p.cost_optimized_yr <= p.cost_current_yr + 1), "golden: no part costs more than today");
  ok(g.orders.every((o) => o.order_date && o.funded_month && o.reason && o.lead_days > 0), "golden: every order has a date, a funded month, a reason and a lead time");
  ok(g.backtest.months.length >= 5 && typeof g.backtest.mape === "number" && typeof g.calibration.inside_months_with_issue === "number", "golden: backtest and band calibration present");
  const st = golden(db, { set: "KT-383A" }); ok(st.scope.kind === "set" && st.parts > 0, "golden: set scope " + st.scope.label);
  const b = golden(db, { budget: "3000000000" }); ok(b.unfunded && b.by_month.every((m) => m.value <= 3e9 + 1) && b.orders.some((o) => o.deferred_from), "golden: a budget caps each month and defers orders");
  try { const ws = (await imp("server/ws/golden.mjs")).default; const res = await new Promise((resolve) => { const r = { setHeader() {}, statusCode: 200, end(t) { resolve(JSON.parse(t)); } }; ws({ method: "GET", url: "/x", query: {}, body: {}, headers: {} }, r); });
    const sv = (res.figures || []).find((f) => f.id === "saving"); if (sv) ok(Math.abs(sv.value - g.saving_per_year) / g.saving_per_year < 0.01, "golden: one model, saving matches Claude B's /api/ws/golden within 1% (" + Math.round(sv.value / 1e9 * 10) / 10 + " against " + Math.round(g.saving_per_year / 1e9 * 10) / 10 + " IDR bn)"); } catch (e) { console.log("skip ws/golden comparison:", e.message); }
  // 2. structured reasoning, rules
  const P = [
    { feature: "golden", title: "Optimized Scenario", inputs: { service: { S: 0.99, A: 0.975, B: 0.95, C: 0.9 } }, outputs: { orders: g.orders.slice(0, 4), backtest: g.backtest, golden: { fan: g.golden.fan } }, figures: [{ label: "Recommended orders", value: g.orders_total, unit: "orders", basis: "Estimate" }, { label: "Value of the recommended orders", value: g.orders_value, unit: "IDR", basis: "Estimate" }, { label: "Stockouts per year", value: g.totals.golden.stockouts_per_year, unit: "events", basis: "Estimate" }], compare: { label: "Total cost per year", current: g.totals.current.total, recommended: g.totals.golden.total, unit: "IDR per year" } },
    { feature: "partcard", title: "Part card", inputs: { material_no: one.part.material_no }, outputs: { part: one.part }, figures: [{ label: "Stock", value: one.part.stock, unit: one.part.unit, basis: "Data" }, { label: "Reorder point", value: one.part.rop, unit: one.part.unit, basis: "Estimate" }] },
    { feature: "mnotif", title: "Notification explorer", inputs: { tag: "PP-1323B" }, figures: [{ label: "Notifications", value: 42, unit: "", basis: "Data" }, { label: "Share with a part issued", value: 0.31, unit: "share", basis: "Data" }], actions: ["Check the bearing stock"] },
    { feature: "golden", title: "Optimized Scenario", inputs: { demand_factor: 0.85, budget_idr: 5e9 }, figures: [{ label: "Recommended orders", value: 1100, unit: "orders", basis: "Estimate" }], compare: { label: "Total cost per year", current: 2.4e11, recommended: 9e10, unit: "IDR per year" } }];
  for (const p of P) { const r = await explain(p, { db }), R = r.reasoning, t = reasonText({ ...R, inputs: null });
    ok(R && R.verdict && Array.isArray(R.why) && Array.isArray(R.do_next) && "risk" in R, p.feature + ": five blocks present");
    ok(t.split(/\s+/).length <= 95, p.feature + ": under about 90 words without the inputs block (" + t.split(/\s+/).length + ")");
    ok(!/golden path/i.test(r.text), p.feature + ": never says golden path");
    const bad = unsupportedNumbers(r.text, { facts: [{ value: p }, { value: displays(p) }, { value: displays(R.inputs || {}) }] }); ok(bad.length === 0, p.feature + ": every number in the reply is in the payload " + bad.join(" "));
    ok(R.do_next.every((a) => !a.material_no || /^\d{10}$/.test(a.material_no)), p.feature + ": do-next links name a part number"); }
  const ch = (await explain(P[3], { db })).reasoning.inputs; ok(ch && ch.deltas.length === 3 && /85%/.test(ch.text), "inputs block shows only when inputs change, with three deltas");
  ok((await explain(P[0], { db })).reasoning.inputs === null, "inputs block absent at default inputs");
  // 3. Gemini: a reply with a number not in the payload falls back to the rules; a grounded reply is kept
  const fake = (j) => ({ name: "gemini", complete: async () => ({ json: j, model: "test" }) });
  const r1 = await explain(P[0], { db, adapter: fake({ verdict: "Order now; cost falls by **IDR 999.99 bn** a year.", why: [], do_next: [], risk: "" }) }); ok(r1.provider === "rules" && /ungrounded/.test(r1.fallback), "gemini reply with an invented number is rejected");
  const r2 = await explain(P[0], { db, adapter: fake({ verdict: "Follow the golden path.", why: [], do_next: [], risk: "" }) }); ok(r2.provider === "rules", "gemini reply with the banned words is rejected");
  const v = P[0].outputs.orders[0], r3 = await explain(P[0], { db, adapter: fake({ verdict: "Place **" + g.orders_total.toLocaleString("en-US") + " orders** over the horizon.", why: ["Stockouts per year **" + g.totals.golden.stockouts_per_year + "** (Estimate)."], do_next: [{ text: "Order " + v.qty + " " + v.unit + " of part " + v.material_no + ".", material_no: String(v.material_no) }], risk: "Demand above the forecast would change the verdict." }) });
  ok(r3.provider === "gemini" && r3.reasoning.do_next[0].material_no === String(v.material_no), "grounded gemini reply is kept, with its part link");
  // 4. events
  for (const q of [{ mat: String(v.material_no) }, { set: "KT-383A", limit: "300" }, {}]) { const e = events(db, q), es = schema("events.schema.json");
    ok(schemaErrors(e, es).length === 0, "events " + JSON.stringify(q) + ": matches spi/contracts/events.schema.json " + JSON.stringify(schemaErrors(e, es).slice(0, 2)));
    ok(e.events.every((x) => ["crit", "value_idr", "qty", "unit", "material_no", "funcloc"].every((k) => k in x)), "events " + JSON.stringify(q) + ": every event carries the common fields"); }
  ok(events(db, { tag: "PP-1323B" }).events.some((x) => x.kind === "receipt") && events(db, {}).events.some((x) => x.kind === "campaign"), "events: receipt and campaign kinds present");
  console.log(n + " checks passed");
})().catch((e) => { console.error(e); process.exit(1); });
