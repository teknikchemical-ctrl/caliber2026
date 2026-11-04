// POST /api/ai/review : the AI projection review for a scope (owner: Claude A). The rules review (spi/ai/review.js) has already run inside the
// engine; here Gemini reads the flagged parts with their evidence and may propose a different demand factor for each, with a reason. Every
// proposal must stay inside the guardrail (factor 0.5 to 2), name a flagged part, and quote only numbers from the evidence; the rest are
// rejected. The response gives the accepted factors as `adj`, which any page passes back to /api/data/golden or /api/data/project to apply them,
// and the effect on the key figures. Without Gemini it returns the rules review and says so.
import { openDb } from "../_lib/db.mjs";
import { provider } from "../../spi/ai/providers/index.js";
import { golden } from "../data/golden.mjs";
import { GUARD } from "../../spi/ai/review.js";
import { unsupportedNumbers } from "../../spi/ai/validate.js";
import { unsafeProtectiveText as safety } from "../../spi/ai/safety.js";
const SYS = "You review a spare-parts demand projection for a petrochemical plant. For each flagged part you get the learned forecast, the last 12 months of use, the equipment risk and the rule the reviewer applied. Return JSON {proposals:[{material_no, factor, reason}]} only for parts where you would change the factor the rules chose; factor multiplies the learned forecast and must be between 0.5 and 2. The reason is one plain sentence that quotes only numbers from the evidence. Do not explain how to bypass any protective function.";
const SCHEMA = { type: "object", required: ["proposals"], properties: { proposals: { type: "array", maxItems: 15, items: { type: "object", required: ["material_no", "factor", "reason"], properties: { material_no: { type: "string", maxLength: 12 }, factor: { type: "number" }, reason: { type: "string", maxLength: 300 } } } } } };
export async function review(db, q = {}, { adapter = provider(), signal } = {}) {
  const g = golden(db, q); if (!g.review) return { provider: "rules", review: null, proposals: [], accepted: [], adj: {}, text: "The review is switched off for this run." };
  const flagged = g.review.parts_flagged.slice(0, 15), base = { provider: "rules", review: { ...g.review, parts_flagged: flagged }, proposals: [], accepted: [], rejected: [], adj: {}, text: g.review.text };
  if (!adapter || adapter.name !== "gemini" || !flagged.length) return base;
  try {
    const r = await adapter.complete({ system: SYS, messages: [{ role: "user", content: JSON.stringify({ scope: g.scope, guardrail: GUARD, parts: flagged }).slice(0, 12000) }], schema: SCHEMA, signal });
    const props = (r.json && r.json.proposals) || [], ids = new Set(flagged.map((x) => String(x.material_no))), acc = [], rej = [];
    for (const p of props) { const id = String(p.material_no), f = Number(p.factor), why = String(p.reason || "");
      const bad = !ids.has(id) ? "not a flagged part" : !(f >= GUARD.min && f <= GUARD.max) ? "factor outside the guardrail" : safety(why) ? "safety" : unsupportedNumbers(why, { facts: [{ value: flagged }, { value: GUARD }] }).length ? "number not in the evidence" : "";
      (bad ? rej : acc).push({ material_no: id, factor: Math.round(f * 1000) / 1000, reason: why, ...(bad ? { rejected: bad } : {}) }); }
    const adj = Object.fromEntries(acc.map((a) => [a.material_no, a.factor]));
    let effect = null; if (acc.length) { const g2 = golden(db, { ...q, adj: JSON.stringify(adj) }); effect = { saving_per_year: [g.saving_per_year, g2.saving_per_year], stockouts_per_year: [g.totals.golden.stockouts_per_year, g2.totals.golden.stockouts_per_year], orders_value: [g.orders_value, g2.orders_value] }; }
    return { ...base, provider: "gemini", model: r.model, proposals: props, accepted: acc, rejected: rej, adj, effect, text: g.review.text + (acc.length ? ` Gemini proposed ${acc.length} further changes inside the guardrails${rej.length ? " and " + rej.length + " were rejected" : ""}.` : " Gemini agreed with the rules review.") };
  } catch (e) { return { ...base, fallback: e.message }; }
}
export default async function handler(req, res) {
  res.setHeader("content-type", "application/json"); res.setHeader("cache-control", "no-store");
  const b = req.method === "POST" ? req.body || {} : req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams);
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
  try { res.end(JSON.stringify(await review(openDb(), b, { signal: ctl.signal }))); } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); } finally { clearTimeout(t); }
}
