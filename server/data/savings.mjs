// GET /api/data/savings : cost reduction opportunities from stock keeping, by category and criticality, with the top parts. (owner: Claude A)
// Categories are MUTUALLY EXCLUSIVE (each priced part is in at most one), assigned in this order: insurance spares, S and A above Max, non-moving B and C, B and C above Max, slow-moving B and C, Non Stock holding stock.
// A part that is both non-moving and above Max is counted once, as non-moving (its full stock value, the larger quantity). Gross figures only (Estimate); the page applies the realisation factor and holding rate (Assumptions).
// S and A parts are never counted as release; insurance spares (no demand, S or A) are excluded everywhere.
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
const BC = "(p.crit_max in ('B','C') or p.crit_max is null)";
const CATS = [
  { id: "excess_true", label: "Stock above a set Max (B and C equipment)", action: "Reduce to Max: stop replenishment, transfer or sell the surplus.", counted: 1 },
  { id: "excess_crit", label: "Stock above a set Max (S and A equipment, with demand)", action: "Review before any release: part of this is the right level for critical equipment.", counted: 0 },
  { id: "non_moving", label: "Non-moving stock on B and C equipment", action: "Review for obsolescence and disposal.", counted: 1 },
  { id: "slow", label: "Slow-moving B and C stock above 24 months of demand", action: "Lower Max to the demand-based level.", counted: 0 },
  { id: "nonstock_stock", label: "Non Stock items holding stock (data finding)", action: "Clean the master data: decide whether to keep, stock-manage or release.", counted: 0 },
  { id: "insurance", label: "Insurance spares kept on purpose (S and A, no demand)", action: "Keep. Not a saving.", counted: 0 }
];
const WITH = `with b as (select p.material_no, m.descr, p.crit_max, p.stock, p.min_qty, p.max_qty, p.unit_price_idr, p.months_active, p.last_issue, p.excess_value_idr, p.stock_value_idr, p.total_qty,
  case
    when p.months_active = 0 and p.crit_max in ('S','A') and (p.lt_median is null or p.lt_median > 90) then 'insurance'
    when p.max_qty > 0 and p.stock > p.max_qty and p.crit_max in ('S','A') then 'excess_crit'
    when m.mrp_type = 'Stock Item' and p.months_active = 0 and p.stock > 0 and ${BC} then 'non_moving'
    when p.max_qty > 0 and p.stock > p.max_qty and ${BC} then 'excess_true'
    when p.months_active > 0 and p.months_cover > 24 and ${BC} and p.stock > 24 * p.total_qty / 17.0 then 'slow'
    when m.mrp_type = 'Non Stock' and p.stock > 0 and ${BC} then 'nonstock_stock'
  end cat from part_profile p join material m using(material_no) where p.unit_price_idr is not null),
  v as (select b.*, case cat when 'excess_true' then excess_value_idr when 'excess_crit' then excess_value_idr when 'slow' then (stock - 24 * total_qty / 17.0) * unit_price_idr else stock_value_idr end value from b where cat is not null)`;
export default guard((req, res) => {
  const db = openDb();
  const cats = CATS.map(c => { const r = db.prepare(`${WITH} select count(*) parts, coalesce(sum(value),0) value from v where cat = ?`).get(c.id);
    const by = db.prepare(`${WITH} select coalesce(crit_max,'none') crit, count(*) parts, coalesce(sum(value),0) value from v where cat = ? group by 1 order by 1`).all(c.id);
    const top = db.prepare(`${WITH} select material_no, descr, crit_max, stock, min_qty, max_qty, unit_price_idr, months_active, last_issue, value value_idr from v where cat = ? order by value desc limit 15`).all(c.id);
    return { id: c.id, label: c.label, action: c.action, counted_in_total: !!c.counted, parts: r.parts, value_idr: r.value, by_criticality: by, top_parts: top }; });
  const gross = cats.filter(c => c.counted_in_total).reduce((s, c) => s + c.value_idr, 0);
  const sv = db.prepare("select sum(stock_value_idr) v, count(*) n from part_profile where unit_price_idr is not null").get();
  json(res, 200, { categories: cats, gross_release_candidates_idr: gross, priced_stock_value_idr: sv.v, priced_parts: sv.n, defaults: { holding_cost_rate: 0.22, realisation_factor: 0.3 },
    notes: ["Categories are mutually exclusive: a part appears once. A part that is both non-moving and above Max is counted once, as non-moving.", "Gross candidates are Estimates on parts with a usable purchase price. The realisation factor (the share that can really be released) and the holding cost rate are Assumptions that the page lets you change.", "Parts serving S and A equipment are never counted as release candidates. Insurance spares are shown only to make clear that they stay."] });
});
