// GET|POST /api/ws/advice (owner: Claude B). Inventory planner: for one part, a list of parts, or every part of an equipment set or location,
// the stock position, the projected use, whether to order, how much and for how many months, every cost under today's Min and Max and under the recommendation, the cost reduction, and the risks.
// Inputs: mat (one part) | mats (list) | set (equipment set tag) | loc (functional location, its bill of materials); horizon (months, default 12); cover (months of demand bought per order; empty = economic order quantity);
//   service {S,A,B,C}; demand_factor; lead ("median" | "p90" | number of days); assumptions {carrying_rate, order_cost_idr, emergency_premium, downtime_idr_h, hours_per_stockout, downtime_share, lead_default}.
// Decision rule (same for every part): reorder point = demand over the lead time + z x spread over the lead time; order-up-to = reorder point + cover months of demand.
//   Position (stock + open orders) at or below the reorder point: order now. Position reaches the reorder point inside the horizon: order by (date the position reaches it minus the lead time). Otherwise no order in the horizon.
import { openDb, json, fail, guard, body, num, list, fig, pay, CUTOFF } from "./_lib.mjs";
import { evalPart } from "./costrisk.mjs";
const P = (v) => (typeof v === "string" ? (() => { try { return JSON.parse(v); } catch { return {}; } })() : v || {}), MD = 30.4375;
const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
const Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = phi(z), p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); return z >= 0 ? 1 - p : p; };
const zOf = (p) => { p = Math.min(0.9995, Math.max(0.5, p)); const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924], b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857], c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878], d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  if (p > 0.97575) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); } const r = p - 0.5, s = r * r; return (((((a[0] * s + a[1]) * s + a[2]) * s + a[3]) * s + a[4]) * s + a[5]) * r / (((((b[0] * s + b[1]) * s + b[2]) * s + b[3]) * s + b[4]) * s + 1); };
const addDays = (d, n) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);
export function advise(p, o, A) {
  const f = A.demand_factor || 1, mu = (p.total_qty || 0) / 17 * f, sd = Math.sqrt(Math.max(0, (p.sq || 0) / 17 - ((p.total_qty || 0) / 17) ** 2)) * f, crit = p.crit || "C";
  const leadD = (o.lead === "p90" ? (p.lt_p90 || p.lt_median) : Number(o.lead) > 0 ? Number(o.lead) : p.lt_median) || A.lead_default, L = leadD / MD, muL = mu * L, sdL = sd * Math.sqrt(L), svc = (o.service || {})[crit] ?? { S: 0.98, A: 0.95, B: 0.9, C: 0.85 }[crit], z = zOf(svc);
  const price = p.price || 0, D = mu * 12, eoq = price && D > 0 ? Math.sqrt(2 * D * A.order_cost_idr / (price * A.carrying_rate)) : mu, pos = (p.stock || 0) + (p.on_order || 0), H = o.horizon, cur = evalPart(p, { mode: "current" }, A);
  /* search: order size (months of demand) and service level at or above the target; today's Min and Max is a candidate too, so the recommendation never costs more than today */
  let best = null; if (mu > 0) { const covers = o.cover > 0 ? [o.cover] : [1, 2, 3, 4, 6, 9, 12, 18, 24], svcs = [svc, 0.99, 0.995, 0.999].filter((x, k, a) => x >= svc && a.indexOf(x) === k);
    covers.forEach((c) => svcs.forEach((sv) => { const r0 = Math.ceil(muL + zOf(sv) * sdL), S0 = r0 + Math.ceil(c * mu), e = evalPart(p, { mode: "fixed", rop: r0, max: S0 }, A); if (!best || e.total < best.e.total) best = { rop: r0, S: S0, cover: c, service: sv, e, source: "calculated" }; }));
    if (!(o.cover > 0) && cur.max > 0 && cur.total <= best.e.total) best = { rop: p.min_qty || 0, S: Math.max(p.max_qty || 0, p.min_qty || 0), cover: Math.max(1, Math.round(((p.max_qty || 0) - (p.min_qty || 0)) / mu)), service: null, e: cur, source: "current" }; }
  const rop = best ? best.rop : 0, S = best ? best.S : 0, cover = best ? best.cover : 0;
  let decision = "none", qty = 0, orderBy = null, months_to_rop = null;
  if (mu <= 0) decision = (p.stock || 0) > 0 ? "hold_no_use" : "none";
  else if (pos <= rop) { decision = "order_now"; qty = S - pos; orderBy = CUTOFF; months_to_rop = 0; }
  else { months_to_rop = (pos - rop) / mu; if (months_to_rop <= H) { decision = "order_by"; qty = S - rop; orderBy = addDays(addDays(CUTOFF, months_to_rop * MD), -leadD); if (orderBy < CUTOFF) { orderBy = CUTOFF; decision = "order_now"; } } else decision = "no_order"; }
  const use = mu * H, excessUnits = Math.max(0, (p.stock || 0) - Math.max(S, Math.ceil(use + rop))), rec = best ? best.e : evalPart(p, { mode: "fixed", rop: 0, max: 0 }, A);
  const pOutLead = mu > 0 ? (sdL > 0 ? 1 - Phi((pos - muL) / sdL) : pos < muL ? 1 : 0) : 0, coverM = mu > 0 ? pos / mu : null;
  const risk = { stockout_in_lead_time: pOutLead, months_of_cover: coverM, lead_days: leadD, lead_p90_days: p.lt_p90 || null, lead_spread: p.lt_median && p.lt_p90 ? p.lt_p90 / p.lt_median : null, suppliers: p.supplier_count || 0, demand_class: p.demand_class, crit,
    downtime_cost_per_stockout: (A.downtime_share[crit] ?? 0) * (A.hours_per_stockout[crit] || 0) * (A.downtime_idr_h[crit] || 0), excess_units: excessUnits, excess_value: excessUnits * price, priced: price > 0 };
  const level = decision === "order_now" && (crit === "S" || crit === "A") ? "high" : pOutLead > 0.2 || decision === "order_now" ? "medium" : excessUnits > 0 ? "excess" : "low";
  return { material_no: p.material_no, descr: p.descr, unit: p.unit, crit, mrp_type: p.mrp_type, stock: p.stock || 0, on_order: p.on_order || 0, position: pos, min_qty: p.min_qty, max_qty: p.max_qty, price: price || null,
    mean_month: mu, sd_month: sd, use_horizon: use, service: svc, service_used: best ? best.service : null, policy_source: best ? best.source : null, eoq, z, rop, order_up_to: S, cover_months: cover, decision, qty: Math.max(0, Math.ceil(qty)), order_by: orderBy, months_to_rop, order_value: price ? Math.max(0, Math.ceil(qty)) * price : null,
    cost_current: cur, cost_recommended: rec, saving_per_year: cur.total - rec.total, risk, level };
}
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), H = num(i.horizon, 12, 1, 36), cover = num(i.cover, 0, 0, 36);
  const A = { carrying_rate: 0.22, order_cost_idr: 750000, emergency_premium: 0.35, lead_default: 60, lead_delay_days: 0, demand_factor: num(i.demand_factor, 1, 0.1, 5), downtime_idr_h: { S: 4200000, A: 1250000, B: 330000, C: 42000 }, hours_per_stockout: { S: 72, A: 48, B: 24, C: 12 }, downtime_share: { S: 0.5, A: 0.25, B: 0.1, C: 0.02 }, ...P(i.assumptions) };
  A.demand_factor = num(i.demand_factor, A.demand_factor || 1, 0.1, 5);
  let mats = list(i.mats).map(Number).filter(Boolean), scope = null;
  if (i.mat) mats = [Number(i.mat)];
  if (i.set || i.loc) { const fl = i.loc ? String(i.loc) : (db.prepare("select funcloc from equipment_set where tag = ?").get(String(i.set)) || {}).funcloc || "PX_" + String(i.set); scope = db.prepare("select funcloc, tag, descr, criticality, eq_class_name from funcloc where funcloc = ?").get(fl);
    if (!scope) return fail(res, 404, "This location is not in the baseline data."); mats = db.prepare("select material_no from bom where funcloc = ?").all(fl).map((r) => r.material_no); }
  if (!mats.length) return fail(res, 400, "Choose a part, an equipment set or a location.");
  const rows = []; for (let k = 0; k < mats.length; k += 500) { const ch = mats.slice(k, k + 500); rows.push(...db.prepare(`select p.material_no, t.descr, t.unit, t.mrp_type, t.item_type, coalesce(p.crit_max,'C') crit, p.demand_class, p.stock, p.min_qty, p.max_qty, p.unit_price_idr price, p.lt_median, p.lt_p90, p.supplier_count, p.total_qty, p.n_issues,
    (select coalesce(sum(qty*qty),0) from demand_month d where d.material_no = p.material_no) sq, (select coalesce(sum(qty),0) from po_line o where o.material_no = p.material_no and o.po_delivery > ?) on_order
    from part_profile p join material t using(material_no) where p.material_no in (${ch.map(() => "?").join(",")})`).all(CUTOFF, ...ch)); }
  const o = { horizon: H, cover, lead: i.lead || "median", service: { S: 0.98, A: 0.95, B: 0.9, C: 0.85, ...P(i.service) } };
  const out = rows.map((p) => advise(p, o, A)), rank = { order_now: 0, order_by: 1, no_order: 2, hold_no_use: 3, none: 4 };
  out.sort((a, b) => rank[a.decision] - rank[b.decision] || (b.saving_per_year - a.saving_per_year));
  const t = { parts: out.length, order_now: out.filter((x) => x.decision === "order_now").length, order_by: out.filter((x) => x.decision === "order_by").length, no_order: out.filter((x) => x.decision === "no_order").length, no_use: out.filter((x) => x.decision === "hold_no_use").length,
    order_value: out.reduce((s, x) => s + (x.order_value || 0), 0), cost_current: out.reduce((s, x) => s + x.cost_current.total, 0), cost_recommended: out.reduce((s, x) => s + x.cost_recommended.total, 0), excess_value: out.reduce((s, x) => s + x.risk.excess_value, 0), stock_value: out.reduce((s, x) => s + (x.price || 0) * x.stock, 0), high_risk: out.filter((x) => x.level === "high").length };
  t.saving_per_year = t.cost_current - t.cost_recommended;
  json(res, 200, pay("ws.advice", { mat: i.mat, set: i.set, loc: i.loc, horizon: H, cover, lead: o.lead, service: o.service, assumptions: A }, { scope, totals: t, parts: out.slice(0, num(i.limit, 400, 1, 2000)) },
    [fig("order_now", "Parts to order now", t.order_now, "parts", "Estimate"), fig("order_value", "Value of the recommended orders", t.order_value, "IDR", "Estimate"), fig("saving", "Cost reduction per year against today's Min and Max", t.saving_per_year, "IDR per year", "Estimate")],
    ["BoM (stock, Min, Max, installed parts)", "Movement Material (demand)", "PR PO (open orders, lead time, price, suppliers)"], ["Costs per year: holding, ordering, and shortage (emergency premium plus downtime for the share of stockouts that stop equipment). All cost inputs are editable Assumptions."]));
});
