// The AI is the reasoning step between the models and every projection (owner: Claude A). Usage: node tests/spi_projection.js
// Checks: the review runs inside the engine and changes what is calculated, factors stay in the guardrail, the projection service, the
// timeline and the engine give the same numbers, Gemini proposals are accepted only inside the guardrail and with evidence numbers,
// ml_review carries the same decisions for the other tools, and the contracts hold.
const path = require("path"), assert = require("assert"), fs = require("fs"), ROOT = path.resolve(__dirname, "..");
process.env.SPI_DB = path.join(ROOT, "spi/db/spi.sqlite"); process.env.AI_PROVIDER = "mock";
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; console.log("ok  ", m); };
(async () => {
  const imp = (p) => import(path.join(ROOT, p)), { openDb } = await imp("server/_lib/db.mjs"), db = openDb();
  const { golden } = await imp("server/data/golden.mjs"), { project } = await imp("server/data/project.mjs"), { review } = await imp("server/ai/review.mjs"), { schemaErrors } = await imp("spi/ai/validate.js");
  const sch = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, "spi/contracts", f), "utf8"));
  const g = golden(db, {}), off = golden(db, { review: "0" });
  ok(g.review && g.review.parts === g.parts, "review: every part in scope is checked (" + g.review.parts + ")");
  ok(g.review.parts_flagged.every((x) => x.factor >= g.review.guardrail.min && x.factor <= g.review.guardrail.max), "review: every factor stays in the guardrail");
  ok(g.review.scope_check && /reviewed forecast/.test(g.review.text), "review: the scope check compares the forecast with the last 12 months");
  const bl = g.review.parts_flagged.find((x) => x.basis === "blend"), a = golden(db, { mat: String(bl.material_no) }), b = golden(db, { mat: String(bl.material_no), review: "0" });
  ok(Math.abs(a.part.forecast_12m - b.part.forecast_12m * bl.factor) <= 0.2, "review: a blended part's forecast is the learned forecast times its factor (" + b.part.forecast_12m + " x " + bl.factor + " = " + a.part.forecast_12m + ")");
  ok(g.orders_total !== off.orders_total || g.saving_per_year !== off.saving_per_year, "review: the engine calculates on the reviewed demand (results differ with the review off)");
  const p = project(db, {}); ok(schemaErrors(p, sch("projection.schema.json")).length === 0, "project: matches spi/contracts/projection.schema.json " + JSON.stringify(schemaErrors(p, sch("projection.schema.json")).slice(0, 2)));
  ok(p.series.demand_qty.values.slice(p.history_months).every((v, i) => Math.abs(v - g.demand.mean_qty[i]) < 1e-6), "project: projected use equals the engine's reviewed demand");
  const h = (await imp("server/data/history.mjs")).default, hd = await new Promise((r) => h({ method: "GET", url: "/x?all=1", query: { all: "1" } }, { setHeader() {}, statusCode: 200, end(t) { r(JSON.parse(t)); } }));
  ok(hd.prediction.learned.every((v, i) => Math.abs(v - g.demand.mean_qty[i]) / Math.max(1, g.demand.mean_qty[i]) < 0.01), "timeline: the drawn forecast is the reviewed demand of the engine (within 1%)");
  ok(hd.review && hd.review.text === g.review.text, "timeline: carries the same review text");
  const fake = (j) => ({ name: "gemini", complete: async () => ({ json: j, model: "test" }) }), f0 = g.review.parts_flagged[0];
  const r1 = await review(db, {}, { adapter: fake({ proposals: [{ material_no: String(f0.material_no), factor: 1.5, reason: "Keep closer to the history." }, { material_no: String(f0.material_no), factor: 4, reason: "Far more." }, { material_no: "4999999999", factor: 1.2, reason: "Not flagged." }, { material_no: String(f0.material_no), factor: 1.2, reason: "Use rose to 999 a year." }] }) });
  ok(r1.provider === "gemini" && r1.accepted.length === 1 && r1.rejected.length === 3, "gemini review: one proposal accepted, outside guardrail, unflagged part and invented number rejected");
  ok(r1.effect && Array.isArray(r1.effect.saving_per_year), "gemini review: effect of the accepted factor on the key figures");
  const ap = golden(db, { mat: String(f0.material_no), adj: JSON.stringify(r1.adj) }); ok(ap.part.review.basis === "ai" && ap.part.review.factor === 1.5, "engine: applies an accepted Gemini factor with basis ai");
  ok(schemaErrors(r1, sch("review.schema.json")).length === 0, "gemini review: matches spi/contracts/review.schema.json");
  const r2 = await review(db, {}); ok(r2.provider === "rules" && r2.text === g.review.text, "review endpoint without Gemini returns the rules review");
  const mr = db.prepare("select * from ml_review where material_no=?").get(bl.material_no); ok(mr && mr.basis === "blend" && Math.abs(mr.factor - bl.factor) < 1e-6, "ml_review: carries the same decision for the other tools");
  const { ask } = await imp("spi/ai/ask.js"), ans = (await ask({ db, question: "Can I trust the forecast? What did the AI review change?" })).answer || "";
  ok(/AI review checked every part/.test(ans), "assistant: explains the review");
  console.log(n + " checks passed");
})().catch((e) => { console.error(e); process.exit(1); });
