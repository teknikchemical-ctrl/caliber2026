// GET /api/data/savings : cost reduction opportunities from stock keeping, by category and criticality, with the top parts. (owner: Claude A)
// Gross figures only (Estimate). The realisation factor and the holding cost rate are applied by the page (Assumptions the user can change).
// Rules: S and A parts are never counted as release (they need a review); insurance spares (no demand, S or A) are excluded everywhere.
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
const CATS = [
  { id: "excess_true", label: "Stock above a set Max (B and C equipment)", w: "p.max_qty > 0 and p.stock > p.max_qty and (p.crit_max in ('B','C') or p.crit_max is null)", v: "p.excess_value_idr", action: "Reduce to Max: stop replenishment, transfer or sell the surplus.", counted: 1 },
  { id: "excess_crit", label: "Stock above a set Max (S and A equipment)", w: "p.max_qty > 0 and p.stock > p.max_qty and p.crit_max in ('S','A')", v: "p.excess_value_idr", action: "Review before any release: part of this is the right level for critical equipment.", counted: 0 },
  { id: "non_moving", label: "Non-moving stock on B and C equipment", w: "m.mrp_type = 'Stock Item' and p.months_active = 0 and p.stock > 0 and (p.crit_max in ('B','C') or p.crit_max is null)", v: "p.stock_value_idr", action: "Review for obsolescence and disposal.", counted: 1 },
  { id: "slow", label: "Slow-moving stock (over 24 months of cover)", w: "p.months_active > 0 and p.months_cover > 24 and p.crit_max in ('B','C')", v: "(p.stock - p.max_qty) * p.unit_price_idr", action: "Lower Max to the demand-based level.", counted: 0 },
  { id: "nonstock_stock", label: "Non Stock items holding stock (data finding)", w: "m.mrp_type = 'Non Stock' and p.stock > 0 and (p.crit_max in ('B','C') or p.crit_max is null)", v: "p.stock_value_idr", action: "Clean the master data: decide whether to keep, stock-manage or release.", counted: 0 },
  { id: "insurance", label: "Insurance spares kept on purpose (S and A, no demand)", w: "p.months_active = 0 and p.crit_max in ('S','A')", v: "p.stock_value_idr", action: "Keep. Not a saving.", counted: 0 }
];
export default guard((req, res) => {
  const db = openDb(), from = "from part_profile p join material m using(material_no)";
  const cats = CATS.map(c => { const r = db.prepare(`select count(*) parts, coalesce(sum(${c.v}),0) value ${from} where ${c.w} and p.unit_price_idr is not null`).get(); const by = db.prepare(`select coalesce(p.crit_max,'none') crit, count(*) parts, coalesce(sum(${c.v}),0) value ${from} where ${c.w} and p.unit_price_idr is not null group by 1 order by 1`).all(); const top = db.prepare(`select p.material_no, m.descr, p.crit_max, p.stock, p.min_qty, p.max_qty, p.unit_price_idr, p.months_active, p.last_issue, (${c.v}) value_idr ${from} where ${c.w} and p.unit_price_idr is not null order by (${c.v}) desc limit 15`).all(); return { id: c.id, label: c.label, action: c.action, counted_in_total: !!c.counted, parts: r.parts, value_idr: r.value, by_criticality: by, top_parts: top }; });
  const gross = cats.filter(c => c.counted_in_total).reduce((s, c) => s + c.value_idr, 0);
  const sv = db.prepare("select sum(stock_value_idr) v, count(*) n from part_profile where unit_price_idr is not null").get();
  json(res, 200, { categories: cats, gross_release_candidates_idr: gross, priced_stock_value_idr: sv.v, priced_parts: sv.n, defaults: { holding_cost_rate: 0.22, realisation_factor: 0.3 },
    notes: ["Gross candidates are Estimates on parts with a usable purchase price. The realisation factor (the share that can really be released) and the holding cost rate are Assumptions that the page lets you change.", "Parts serving S and A equipment are never counted as release candidates. Insurance spares are shown only to make clear that they stay."] });
});
