// GET|POST /api/ws/costs (owner: Claude B). Cost of holding and of shortage for the parts in a scope.
// Holding: stock on hand today x unit price x carrying rate (capital + storage + obsolescence, each an Assumption). Each part is placed in one stock category so that nothing is counted twice:
//   above Max (the excess part only), no issue in 17 months, slow moving (issued in at most two months), within policy.
// Shortage: expected yearly cost of stockouts under today's Min and Max (same model as /api/ws/costrisk).
// Inputs: scope {crit, type, dclass, q}, rates {capital, storage, obsolescence}, assumptions as in costrisk.
import { openDb, json, guard, body, fig, pay } from "./_lib.mjs";
import { ECON } from "../_lib/econ.mjs";
import { portfolioParts, evalPart } from "./costrisk.mjs";
const P = (v) => (typeof v === "string" ? (() => { try { return JSON.parse(v); } catch { return {}; } })() : v || {});
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), sc = P(i.scope), rt = { capital: 0.1, storage: 0.07, obsolescence: 0.05, ...P(i.rates) }, rate = rt.capital + rt.storage + rt.obsolescence;
  const A = { carrying_rate: rate, order_cost_idr: ECON.order_cost_idr, emergency_premium: ECON.emergency_premium, lead_default: ECON.lead_default, lead_delay_days: 0, demand_factor: 1, downtime_idr_h: { ...ECON.downtime_idr_h }, hours_per_stockout: { ...ECON.hours_per_stockout }, downtime_share: { ...ECON.downtime_share }, ...P(i.assumptions) };
  const parts = portfolioParts(db, sc), extra = Object.fromEntries(db.prepare("select material_no, months_active from part_profile").all().map((r) => [r.material_no, r.months_active]));
  const cats = { excess: { k: "excess", label: "Above Max", value: 0, parts: 0 }, idle: { k: "idle", label: "No issue in 17 months", value: 0, parts: 0 }, slow: { k: "slow", label: "Issued in one or two months", value: 0, parts: 0 }, policy: { k: "policy", label: "Within policy", value: 0, parts: 0 } };
  const crit = {}, rows = []; let stockV = 0, priced = 0, shortT = 0, evT = 0;
  parts.forEach((p) => { if (!p.price) { const r0 = evalPart(p, { mode: "current" }, A); shortT += r0.shortCost; evT += r0.events; const c0 = crit[p.crit] = crit[p.crit] || { k: p.crit, value: 0, hold: 0, short: 0, events: 0 }; c0.short += r0.shortCost; c0.events += r0.events; return; } /* downtime does not depend on price: unpriced parts count in the shortage cost */ priced++; const v = (p.stock || 0) * p.price, ex = p.max_qty > 0 && p.stock > p.max_qty ? (p.stock - p.max_qty) * p.price : 0, ma = extra[p.material_no] || 0; stockV += v;
    let rest = v; if (ex > 0) { cats.excess.value += ex; cats.excess.parts++; rest -= ex; } if (rest > 0) { const k = !(p.total_qty > 0) ? "idle" : ma <= 2 ? "slow" : "policy"; cats[k].value += rest; if (!(ex > 0)) cats[k].parts++; }
    const r = evalPart(p, { mode: "current" }, A); shortT += r.shortCost; evT += r.events; const c = crit[p.crit] = crit[p.crit] || { k: p.crit, value: 0, hold: 0, short: 0, events: 0 }; c.value += v; c.hold += v * rate; c.short += r.shortCost; c.events += r.events;
    rows.push({ material_no: p.material_no, descr: p.descr, crit: p.crit, stock: p.stock, value: v, hold: v * rate, short: r.shortCost, events: r.events }); });
  Object.values(cats).forEach((c) => { c.hold = c.value * rate; });
  const out = { rate, rates: rt, stock_value: stockV, holding_per_year: stockV * rate, shortage_per_year: shortT, events_per_year: evT, priced_parts: priced, parts: parts.length, categories: Object.values(cats), by_crit: ["S", "A", "B", "C"].map((k) => crit[k] || { k, value: 0, hold: 0, short: 0, events: 0 }),
    top_holding: rows.slice().sort((a, b) => b.hold - a.hold).slice(0, 12), top_shortage: rows.filter((r) => r.short > 0).sort((a, b) => b.short - a.short).slice(0, 12) };
  json(res, 200, pay("ws.costs", { scope: sc, rates: rt, assumptions: A }, out, [fig("stock_value", "Stock value on hand", stockV, "IDR", "Estimate"), fig("holding", "Holding cost per year", stockV * rate, "IDR per year", "Estimate"), fig("shortage", "Expected shortage cost per year", shortT, "IDR per year", "Estimate")],
    ["part_profile (BoM stock, PR PO price, Movement Material demand)"], ["Only parts with a purchase price carry IDR. Carrying rate components and shortage assumptions are editable Assumptions."]));
});
