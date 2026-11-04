// GET /api/ws/status (owner: Claude B). Plant status in the shape asked from Claude A for /api/data/status (B's Status view reads A's first and falls back to this one).
// Groups: do_now (order now under the recommendation), shortage (zero stock or below Min with use), overstock (stock above the projected need), critical_exposure (S or A parts with a stockout chance of 20% or more before a new order can arrive), safe (stock covers the horizon).
import { openDb, json, guard, num, list, fig, pay, CUTOFF } from "./_lib.mjs";
import { ECON } from "../_lib/econ.mjs";
import { portfolioParts } from "./costrisk.mjs";
import { advise } from "./advice.mjs";
let cache = null;
export default guard((req, res) => {
  const db = openDb();
  if (!cache) { const A = { carrying_rate: ECON.carrying_rate ?? 0.22, order_cost_idr: ECON.order_cost_idr, emergency_premium: ECON.emergency_premium, lead_default: ECON.lead_default, lead_delay_days: 0, demand_factor: 1, downtime_idr_h: { ...ECON.downtime_idr_h }, hours_per_stockout: { ...ECON.hours_per_stockout }, downtime_share: { ...ECON.downtime_share } };
    const on = Object.fromEntries(db.prepare("select material_no, sum(qty) q from pol where po_delivery > ? group by 1").all(CUTOFF).map((r) => [r.material_no, r.q]));
    const R = portfolioParts(db, {}).map((p) => advise({ ...p, on_order: on[p.material_no] || 0 }, { horizon: 12, cover: 0, lead: "median", service: { ...(ECON.service || {}) } }, A));
    const crit = (a) => Object.fromEntries(["S", "A", "B", "C"].map((c) => [c, a.filter((x) => x.crit === c).length])), top = (a, k) => a.slice(0, 8).map((x) => ({ material_no: x.material_no, descr: x.descr, crit: x.crit, stock: x.stock, min_qty: x.min_qty, max_qty: x.max_qty, on_order: x.on_order, value_idr: k(x), order_qty: x.qty, order_by: x.order_by, stockout_chance: x.risk.stockout_in_lead_time, months_of_cover: x.risk.months_of_cover }));
    const G = [];
    const now = R.filter((x) => x.decision === "order_now").sort((a, b) => (b.crit < a.crit) - (a.crit < b.crit) || b.risk.stockout_in_lead_time - a.risk.stockout_in_lead_time);
    G.push({ id: "do_now", label: "Order now", parts: now.length, value_idr: now.reduce((s, x) => s + (x.order_value || 0), 0), value_label: "Value of the orders", by_crit: crit(now), top: top(now.sort((a, b) => "SABC".indexOf(a.crit) - "SABC".indexOf(b.crit) || b.risk.stockout_in_lead_time - a.risk.stockout_in_lead_time), (x) => x.order_value) });
    const sh = R.filter((x) => x.mean_month > 0 && (x.stock === 0 || (x.min_qty > 0 && x.stock < x.min_qty))).sort((a, b) => b.risk.downtime_cost_per_stockout - a.risk.downtime_cost_per_stockout);
    G.push({ id: "shortage", label: "Shortage", parts: sh.length, value_idr: sh.reduce((s, x) => s + x.risk.downtime_cost_per_stockout, 0), value_label: "Downtime cost of one stockout each (Assumption)", by_crit: crit(sh), top: top(sh, (x) => x.risk.downtime_cost_per_stockout) });
    const ov = R.filter((x) => x.risk.excess_value > 0).sort((a, b) => b.risk.excess_value - a.risk.excess_value);
    G.push({ id: "overstock", label: "Overstock", parts: ov.length, value_idr: ov.reduce((s, x) => s + x.risk.excess_value, 0), value_label: "Value above the projected need", by_crit: crit(ov), top: top(ov, (x) => x.risk.excess_value) });
    const ce = R.filter((x) => (x.crit === "S" || x.crit === "A") && x.mean_month > 0 && x.risk.stockout_in_lead_time >= 0.2).sort((a, b) => b.risk.stockout_in_lead_time - a.risk.stockout_in_lead_time);
    G.push({ id: "critical_exposure", label: "Critical exposure", parts: ce.length, value_idr: ce.reduce((s, x) => s + x.risk.downtime_cost_per_stockout, 0), value_label: "Downtime cost of one stockout each (Assumption)", by_crit: crit(ce), top: top(ce, (x) => x.risk.downtime_cost_per_stockout) });
    const sf = R.filter((x) => x.mean_month > 0 && x.decision === "no_order" && x.risk.excess_value === 0);
    G.push({ id: "safe", label: "Safe", parts: sf.length, value_idr: sf.reduce((s, x) => s + (x.price || 0) * x.stock, 0), value_label: "Stock value", by_crit: crit(sf), top: top(sf.sort((a, b) => b.mean_month * (b.price || 0) - a.mean_month * (a.price || 0)), (x) => (x.price || 0) * x.stock) });
    cache = { groups: G, parts: R.length, used: R.filter((x) => x.mean_month > 0).length, cutoff: CUTOFF };
  }
  json(res, 200, pay("ws.status", {}, cache, cache.groups.map((g) => fig(g.id, g.label, g.parts, "parts", "Estimate")), ["BoM", "Movement Material", "PR PO", "FuncLoc list"], ["Same decision rule as the Inventory planner. Parts can be in more than one group."]));
});
