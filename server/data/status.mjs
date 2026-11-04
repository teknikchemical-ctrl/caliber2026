// GET /api/data/status : plant status now: what to do, what is safe, shortages, overstock, critical exposure, from the Optimized Scenario (/api/data/golden). (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
import { golden } from "./golden.mjs";
export function status(db) {
  const g = golden(db, { all: "1" }), P = g.top_parts && g; const parts = db.prepare("select m.material_no, m.descr, m.unit, m.stock, m.min_qty, m.max_qty, coalesce(m.last_unit_price_idr,0) price, coalesce(p.crit_max,'C') crit, coalesce(p.months_active,0) ma from material m left join part_profile p using(material_no)").all();
  const ml = Object.fromEntries(db.prepare("select material_no, sum(expected_qty) q from ml_forecast group by 1").all().map((r) => [r.material_no, r.q]));
  const now = new Set(g.orders.filter((o) => o.month === g.months[0]).map((o) => o.material_no));
  const cats = { order_now: [], short_critical: [], overstock: [], dead: [], safe: [] };
  for (const p of parts) { const f = ml[p.material_no] || 0, v = (p.stock || 0) * p.price;
    if ((p.stock || 0) <= 0 && f >= 1 && "SA".includes(p.crit)) cats.short_critical.push({ ...p, forecast: f, value: 0 });
    else if (now.has(p.material_no)) cats.order_now.push({ ...p, forecast: f });
    else if (p.max_qty > 0 && p.stock > Math.max(p.max_qty, f * 2)) cats.overstock.push({ ...p, forecast: f, value: (p.stock - Math.max(p.max_qty, f)) * p.price });
    else if ((p.stock || 0) > 0 && p.ma === 0) cats.dead.push({ ...p, forecast: f, value: v });
    else cats.safe.push(p); }
  const sum = (a, k) => a.reduce((s, x) => s + (x[k] || 0), 0), byC = (a) => Object.fromEntries("SABC".split("").map((c) => [c, a.filter((x) => x.crit === c).length]));
  const top = (a, k) => a.sort((x, y) => (y[k] || 0) - (x[k] || 0)).slice(0, 8).map((x) => ({ material_no: x.material_no, descr: x.descr, crit: x.crit, stock: x.stock, forecast_12m: Math.round((x.forecast || 0) * 10) / 10, value: Math.round(x.value || 0) }));
  const orderNowValue = g.by_month[0].value;
  return { cutoff: g.cutoff, groups: {
      short_critical: { label: "Critical parts at zero stock with expected demand", parts: cats.short_critical.length, by_crit: byC(cats.short_critical), top: top(cats.short_critical, "forecast") },
      order_now: { label: "Order now (Optimized Scenario, first month)", parts: g.by_month[0].parts, value: orderNowValue, by_crit: { S: g.by_month[0].S, A: g.by_month[0].A, B: g.by_month[0].B, C: g.by_month[0].C } },
      overstock: { label: "Overstocked: above Max and two years of learned demand", parts: cats.overstock.length, value: Math.round(sum(cats.overstock, "value")), by_crit: byC(cats.overstock), top: top(cats.overstock, "value") },
      dead: { label: "Dead stock: held, no issue in 17 months", parts: cats.dead.length, value: Math.round(sum(cats.dead, "value")), by_crit: byC(cats.dead), top: top(cats.dead, "value") },
      safe: { label: "Within policy", parts: cats.safe.length } },
    cost: { golden: g.totals.golden, current: g.totals.current, saving_per_year: g.saving_per_year, basis: g.totals.basis, first_12m: g.simulated_12m }, decisions: g.decisions, stockout_next_month: { golden: g.golden.stockout_chance[0], current: g.current.stockout_chance[0] },
    basis: "Estimate from the learned model, PO history and the Optimized Scenario; values at the last PO price." };
}
export default guard((req, res) => json(res, 200, status(openDb())));
