// GET|POST /api/ws/costrisk (owner: Claude B). Portfolio cost-risk calculator.
// For every part in the scope it applies a stocking policy and estimates, per year: average stock and its holding cost, ordering cost, expected units short, expected stockout events, and the cost of those shortages
// (emergency premium on the units short plus downtime for the share of stockout events that stop equipment). Normal approximation of demand over the lead time, demand from the 17 months of issues.
// Inputs: scope {crit (list), type (item type list), dclass (demand class list), q}, policy mode "current" | "service" | "scale",
//   service {S,A,B,C} target service levels (mode service), scale {S,A,B,C} multipliers of the current Min and Max (mode scale),
//   assumptions {carrying_rate, order_cost_idr, emergency_premium, downtime_idr_h {S,A,B,C}, hours_per_stockout {S,A,B,C}, lead_default, lead_delay_days, demand_factor}, budget_idr (optional cap on average stock value), curve=1 to add the cost curve.
import { openDb, json, guard, body, list, fig, pay } from "./_lib.mjs";
import { ECON } from "../_lib/econ.mjs";
const M17 = 17, MD = 30.4375;
const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
const Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = phi(z), p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); return z >= 0 ? 1 - p : p; };
const zOf = (p) => { p = Math.min(0.9995, Math.max(0.5, p)); const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924], b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857], q = Math.sqrt(-2 * Math.log(1 - p)); const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878], d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  return p > 0.97575 ? -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1) : (() => { const r = p - 0.5, s = r * r; return (((((a[0] * s + a[1]) * s + a[2]) * s + a[3]) * s + a[4]) * s + a[5]) * r / (((((b[0] * s + b[1]) * s + b[2]) * s + b[3]) * s + b[4]) * s + 1); })(); };
const loss = (z) => phi(z) - z * (1 - Phi(z));
export function portfolioParts(db, sc) {
  const w = ["(p.stock > 0 or p.total_qty > 0)"], a = [];
  const cr = list(sc.crit).map((x) => x.toUpperCase()); if (cr.length) { w.push(`p.crit_max in (${cr.map(() => "?").join(",")})`); a.push(...cr); }
  const ty = list(sc.type).map((x) => x.toUpperCase()); if (ty.length) { w.push(`t.item_type in (${ty.map(() => "?").join(",")})`); a.push(...ty); }
  const dc = list(sc.dclass); if (dc.length) { w.push(`p.demand_class in (${dc.map(() => "?").join(",")})`); a.push(...dc); }
  if (sc.q) { w.push("t.descr like ?"); a.push("%" + String(sc.q).slice(0, 60) + "%"); }
  return db.prepare(`select p.material_no, t.descr, t.item_type, t.mrp_type, t.unit, p.lt_p90, p.supplier_count, p.months_since_last, p.last_issue, coalesce(p.crit_max,'C') crit, p.demand_class, p.stock, p.min_qty, p.max_qty, p.unit_price_idr price, p.lt_median, p.total_qty, p.n_issues,
    (select coalesce(sum(qty*qty),0) from demand_month d where d.material_no = p.material_no) sq from part_profile p join material t using(material_no) where ${w.join(" and ")}`).all(...a);
}
/* one part under one policy: yearly figures */
export function evalPart(p, pol, A) {
  const f = A.demand_factor || 1, mu = (p.total_qty || 0) / M17 * f, varM = Math.max(0, (p.sq || 0) / M17 - ((p.total_qty || 0) / M17) ** 2) * f * f, sd = Math.sqrt(varM);
  const L = ((p.lt_median || A.lead_default) + (A.lead_delay_days || 0)) / MD, muL = mu * L, sdL = sd * Math.sqrt(L), D = mu * 12;
  let rop, max; if (pol.mode === "fixed") { rop = pol.rop; max = Math.max(pol.max, pol.rop); } else if (pol.mode === "current") { rop = p.min_qty || 0; max = Math.max(p.max_qty || 0, rop); } else if (pol.mode === "scale") { const k = pol.scale[p.crit] ?? 1; rop = Math.round((p.min_qty || 0) * k); max = Math.max(Math.round((p.max_qty || 0) * k), rop); }
  else { const z = zOf(pol.service[p.crit] ?? 0.95), eoq = p.price && D > 0 ? Math.sqrt(2 * D * A.order_cost_idr / (p.price * A.carrying_rate)) : mu; rop = D > 0 ? Math.ceil(muL + z * sdL) : 0; max = D > 0 ? Math.ceil(rop + Math.max(1, eoq, mu)) : 0; }
  const occ = (p.n_issues || 0) * 12 / M17, Q = Math.max(1, max - rop), cycles = D > 0 ? Math.min(D / Q, Math.max(occ, 1)) : 0, ss = rop - muL;
  let shortUnits = 0, events = 0; if (D > 0) { if (sdL > 0) { const z = ss / sdL; shortUnits = cycles * sdL * loss(z); events = cycles * (1 - Phi(z)); } else { shortUnits = ss < 0 ? cycles * -ss : 0; events = ss < 0 ? cycles : 0; } if (max <= 0) { if (p.mrp_type === "Non Stock" && A.nonstock_to_order !== false) { shortUnits = 0; events = 0; } else { shortUnits = D; events = occ; } } shortUnits = Math.min(shortUnits, D); events = Math.min(events, Math.max(occ, 0)); }
  /* parts with no demand keep their stock; the policy cannot lower stock on hand below what is already there unless it is released */
  const avgStock = D > 0 ? Math.max(0, ss) + Q / 2 : (pol.mode === "current" ? p.stock || 0 : Math.min(p.stock || 0, max));
  const price = p.price || 0, hold = avgStock * price * A.carrying_rate, order = cycles * A.order_cost_idr, shortCost = shortUnits * price * A.emergency_premium + events * (A.downtime_share[p.crit] ?? 0) * (A.hours_per_stockout[p.crit] || 0) * (A.downtime_idr_h[p.crit] || 0);
  return { rop, max, avgStock, value: avgStock * price, hold, order, shortUnits, events, shortCost, total: hold + order + shortCost, priced: price > 0, demand: D };
}
export function sum(parts, pol, A) { const t = { parts: parts.length, priced: 0, value: 0, hold: 0, order: 0, shortCost: 0, events: 0, shortUnits: 0, total: 0, byCrit: {} };
  parts.forEach((p) => { const r = evalPart(p, pol, A); if (r.priced) t.priced++; ["value", "hold", "order", "shortCost", "events", "shortUnits", "total"].forEach((k) => (t[k] += r[k])); const c = t.byCrit[p.crit] = t.byCrit[p.crit] || { parts: 0, value: 0, hold: 0, shortCost: 0, events: 0, total: 0 }; c.parts++; c.value += r.value; c.hold += r.hold; c.shortCost += r.shortCost; c.events += r.events; c.total += r.total; });
  return t; }
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), sc = typeof i.scope === "string" ? JSON.parse(i.scope || "{}") : (i.scope || {}), A0 = typeof i.assumptions === "string" ? JSON.parse(i.assumptions) : (i.assumptions || {});
  const A = { carrying_rate: ECON.carrying_rate, order_cost_idr: ECON.order_cost_idr, emergency_premium: ECON.emergency_premium, lead_default: ECON.lead_default, lead_delay_days: 0, demand_factor: 1, downtime_idr_h: { ...ECON.downtime_idr_h }, hours_per_stockout: { ...ECON.hours_per_stockout }, downtime_share: { ...ECON.downtime_share }, ...A0 };
  const pol = { mode: i.mode || "service", service: { ...ECON.service, ...(typeof i.service === "string" ? JSON.parse(i.service) : i.service || {}) }, scale: { S: 1, A: 1, B: 1, C: 1, ...(typeof i.scale === "string" ? JSON.parse(i.scale) : i.scale || {}) } };
  const parts = portfolioParts(db, sc), cur = sum(parts, { mode: "current" }, A), sel = sum(parts, pol, A);
  let curve = null; if (String(i.curve) !== "0") { curve = [0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.93, 0.95, 0.97, 0.98, 0.99, 0.995].map((s) => { const r = sum(parts, { mode: "service", service: { S: s, A: s, B: s, C: s } }, A); return { service: s, value: r.value, hold: r.hold + r.order, shortCost: r.shortCost, total: r.total, events: r.events }; }); }
  const top = parts.map((p) => { const a = evalPart(p, { mode: "current" }, A), b = evalPart(p, pol, A); return { material_no: p.material_no, descr: p.descr, crit: p.crit, price: p.price, cur_min: p.min_qty, cur_max: p.max_qty, new_min: b.rop, new_max: b.max, d_value: b.value - a.value, d_short: b.shortCost - a.shortCost, d_total: b.total - a.total }; })
    .filter((x) => x.d_total !== 0).sort((x, y) => x.d_total - y.d_total);
  /* sensitivity: total cost when one assumption moves down or up by a quarter (supplier delay: none or plus 30 days) */
  let sens = null; if (String(i.sens) === "1") { const sc2 = (o, f) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v * f])), T = (A2) => sum(parts, pol, A2).total;
    sens = [["carrying_rate", "Carrying rate", (f) => ({ ...A, carrying_rate: A.carrying_rate * f })], ["order_cost_idr", "Cost per purchase order", (f) => ({ ...A, order_cost_idr: A.order_cost_idr * f })], ["emergency_premium", "Emergency purchase premium", (f) => ({ ...A, emergency_premium: A.emergency_premium * f })],
      ["downtime_idr_h", "Cost of downtime per hour", (f) => ({ ...A, downtime_idr_h: sc2(A.downtime_idr_h, f) })], ["hours_per_stockout", "Hours lost per stockout", (f) => ({ ...A, hours_per_stockout: sc2(A.hours_per_stockout, f) })], ["downtime_share", "Share of stockouts that stop equipment", (f) => ({ ...A, downtime_share: sc2(A.downtime_share, f) })],
      ["demand_factor", "Demand", (f) => ({ ...A, demand_factor: A.demand_factor * f })], ["lead_delay_days", "Supplier delay (none or plus 30 days)", (f) => ({ ...A, lead_delay_days: f < 1 ? 0 : (A.lead_delay_days || 0) + 30 })]]
      .map(([k, label, fn]) => ({ k, label, low: T(fn(0.75)), high: T(fn(1.25)) })).sort((x, y) => Math.abs(y.high - y.low) - Math.abs(x.high - x.low)); }
  const budget = Number(i.budget_idr) || null;
  json(res, 200, pay("ws.costrisk", { scope: sc, mode: pol.mode, service: pol.service, scale: pol.scale, assumptions: A, budget_idr: budget }, { current: cur, scenario: sel, curve, within_budget: budget ? sel.value <= budget : null, sensitivity: sens, savers: top.slice(0, 15), spenders: top.slice(-15).reverse() },
    [fig("value_cur", "Average stock value today", cur.value, "IDR", "Estimate"), fig("value_new", "Average stock value under the scenario", sel.value, "IDR", "Estimate"), fig("total_cur", "Total yearly cost today", cur.total, "IDR per year", "Estimate"), fig("total_new", "Total yearly cost under the scenario", sel.total, "IDR per year", "Estimate"), fig("events_new", "Expected stockout events per year under the scenario", sel.events, "events", "Estimate")],
    ["part_profile (Movement Material, PR PO, BoM)", "demand_month"], ["Demand over the lead time is treated as normal with the monthly mean and spread of the 17 months. Parts without a price add risk but no IDR. Downtime cost, hours per stockout, premium, carrying rate and order cost are Assumptions."]));
});
