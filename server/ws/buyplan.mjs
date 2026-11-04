// GET|POST /api/ws/buyplan (owner: Claude B). Purchase plan: which parts reach their reorder point in the horizon, how much to order, when to order it, and the cash per month against a budget.
// Inputs: scope {crit, type, dclass, q}, policy "current" | "service", service {S,A,B,C}, horizon (months), budget_month_idr (optional), lead_default, order_cost_idr, carrying_rate.
// Reorder month = months until stock on hand plus open orders falls to the reorder point at the mean monthly demand; order quantity = order-up-to level minus that position.
// Order-by date = reorder month minus the lead time. When a budget is set, lines are funded by criticality (S first) and date; the rest is deferred.
import { openDb, json, guard, body, num, fig, pay, months, addMonths, CUTOFF } from "./_lib.mjs";
import { ECON } from "../_lib/econ.mjs";
import { portfolioParts, evalPart } from "./costrisk.mjs";
const P = (v) => (typeof v === "string" ? (() => { try { return JSON.parse(v); } catch { return {}; } })() : v || {});
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), sc = P(i.scope), H = num(i.horizon, 6, 1, 24), budget = Number(i.budget_month_idr) || null;
  const A = { carrying_rate: num(i.carrying_rate, ECON.carrying_rate, 0, 1), order_cost_idr: num(i.order_cost_idr, ECON.order_cost_idr, 0, 1e9), emergency_premium: ECON.emergency_premium, lead_default: num(i.lead_default, ECON.lead_default, 1, 720), lead_delay_days: 0, demand_factor: 1, downtime_idr_h: {}, hours_per_stockout: {}, downtime_share: {} };
  const pol = { mode: i.policy === "current" ? "current" : "service", service: { ...ECON.service, ...P(i.service) } };
  const onOrder = Object.fromEntries(db.prepare("select material_no, sum(qty) q from po_line where po_delivery > ? group by 1").all(CUTOFF).map((r) => [r.material_no, r.q]));
  const from = addMonths(CUTOFF.slice(0, 7), 1), MM = months(from, H), lines = [];
  portfolioParts(db, sc).forEach((p) => { const mu = (p.total_qty || 0) / 17; if (!(mu > 0)) return; const r = evalPart(p, pol, A); if (!(r.max > 0)) return; const pos = (p.stock || 0) + (onOrder[p.material_no] || 0);
    const t = pos <= r.rop ? 0 : Math.ceil((pos - r.rop) / mu); if (t >= H) return; const q = Math.max(1, Math.ceil(r.max - (pos - mu * t))), lead = p.lt_median || A.lead_default, need = MM[t], ob = new Date(Date.parse(need + "-01") - lead * 864e5).toISOString().slice(0, 10);
    lines.push({ material_no: p.material_no, descr: p.descr, crit: p.crit, stock: p.stock, on_order: onOrder[p.material_no] || 0, rop: r.rop, max: r.max, month: need, order_by: ob, late: ob < CUTOFF, qty: q, price: p.price, cost: p.price ? q * p.price : null, lead_days: lead }); });
  const rank = { S: 0, A: 1, B: 2, C: 3 }; lines.sort((a, b) => a.month.localeCompare(b.month) || rank[a.crit] - rank[b.crit] || (b.cost || 0) - (a.cost || 0));
  const plan = MM.map((m) => ({ month: m, planned: 0, funded: 0, deferred_in: 0 })); let carry = [];
  MM.forEach((m, t) => { const due = carry.concat(lines.filter((l) => l.month === m)).sort((a, b) => rank[a.crit] - rank[b.crit] || (a.order_by.localeCompare(b.order_by))); let room = budget == null ? Infinity : budget; carry = [];
    due.forEach((l) => { const c = l.cost || 0; plan[t].planned += c; if (c <= room) { room -= c; plan[t].funded += c; l.funded_month = m; } else { carry.push(l); l.deferred = true; } }); plan[t].deferred_in = carry.reduce((s, l) => s + (l.cost || 0), 0); });
  const tot = lines.reduce((s, l) => s + (l.cost || 0), 0), funded = lines.filter((l) => l.funded_month).length;
  json(res, 200, pay("ws.buyplan", { scope: sc, policy: pol.mode, service: pol.service, horizon: H, budget_month_idr: budget, assumptions: A },
    { lines_total: lines.length, late: lines.filter((l) => l.late).length, cost_total: tot, unpriced: lines.filter((l) => l.cost == null).length, funded_lines: funded, unfunded_lines: lines.length - funded, plan, by_crit: ["S", "A", "B", "C"].map((k) => ({ k, lines: lines.filter((l) => l.crit === k).length, cost: lines.filter((l) => l.crit === k).reduce((s, l) => s + (l.cost || 0), 0) })), lines: lines.slice(0, num(i.limit, 300, 1, 2000)) },
    [fig("lines", "Parts to order in the horizon", lines.length, "parts", "Estimate"), fig("cost", "Purchase value in the horizon", tot, "IDR", "Estimate"), fig("late", "Parts whose order-by date has passed", lines.filter((l) => l.late).length, "parts", "Estimate")],
    ["part_profile", "PR PO (open orders, lead time, price)", "Movement Material (mean demand)"], ["Demand is the mean of the 17 months. Lead time is the purchase history median or the default."]));
});
