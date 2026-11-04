// GET /api/data/stock-health[?cat=&crit=&sort=&limit=&offset=] : inventory health categories with counts and value, and the part list of one category.
// Rule based from the baseline data (no forecast needed). Definitions are returned with the answer. Money is IDR and an Estimate. (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, fail, guard, qs, num } from "../_lib/http.mjs";
const SI = "m.mrp_type = 'Stock Item'";
export const CATS = {
  zero_stock:   { label: "Zero stock", w: `${SI} and p.stock = 0 and p.max_qty > 0`, val: "p.max_qty * coalesce(p.unit_price_idr, 0)", valueLabel: "Value of the Max quantity (Estimate)", def: "Stock item with a Max set, stock on hand is zero." },
  below_min:    { label: "Below Min", w: `${SI} and p.min_qty > 0 and p.stock < p.min_qty and p.stock > 0`, val: "(p.min_qty - p.stock) * coalesce(p.unit_price_idr, 0)", valueLabel: "Value short of Min (Estimate)", def: "Stock item with stock above zero but below its Min." },
  excess:       { label: "Above Max (excess)", w: "p.max_qty > 0 and p.stock > p.max_qty", val: "p.excess_value_idr", valueLabel: "Excess value (Estimate)", def: "A Max is set and stock on hand is above it. Excess = (stock - Max) x unit price." },
  no_max:       { label: "Stock with no Max set", w: `${SI} and p.max_qty = 0 and p.stock > 0`, val: "p.stock_value_idr", valueLabel: "Stock value (Estimate)", def: "Stock item holding stock while Min and Max are both zero. Mostly OEM parts: insurance spare candidates, not stock to dispose of." },
  slow:         { label: "Slow-moving", w: "p.months_active > 0 and p.months_cover > 24", val: "p.stock_value_idr", valueLabel: "Stock value (Estimate)", def: "Issued in the history but stock covers more than 24 months of average demand." },
  non_moving:   { label: "Non-moving", w: `${SI} and p.months_active = 0 and p.stock > 0`, val: "p.stock_value_idr", valueLabel: "Stock value (Estimate)", def: "Stock item with stock on hand and no issue in the 17 months of history." },
  insurance:    { label: "Insurance spare candidates", w: "p.months_active = 0 and p.crit_max in ('S','A') and (p.lt_median is null or p.lt_median > 90)", val: "p.stock_value_idr", valueLabel: "Stock value (Estimate)", def: "No issue in the history, serves S or A criticality equipment, lead time above 90 days or unknown. Kept on purpose: never recommended for disposal without review." },
  review_obsolete: { label: "Potentially obsolete (review)", w: `${SI} and p.months_active = 0 and p.stock > 0 and (p.crit_max in ('B','C') or p.crit_max is null)`, val: "p.stock_value_idr", valueLabel: "Stock value (Estimate)", def: "Non-moving stock serving B or C or unclassified equipment: candidates for review, not for automatic disposal." },
  nonstock_with_stock: { label: "Non Stock items holding stock", w: "m.mrp_type = 'Non Stock' and p.stock > 0", val: "p.stock_value_idr", valueLabel: "Stock value (Estimate)", def: "Data finding: materials flagged Non Stock in the baseline still carry stock." }
};
export default guard((req, res) => {
  const q = qs(req), db = openDb(), crit = q.crit ? String(q.crit).toUpperCase().slice(0, 1) : null, cw = crit ? " and p.crit_max = ?" : "", ca = crit ? [crit] : [];
  const from = "from part_profile p join material m using(material_no)";
  const summary = Object.entries(CATS).map(([id, c]) => { const r = db.prepare(`select count(*) parts, sum(${c.val}) value ${from} where ${c.w}${cw}`).get(...ca); return { cat: id, label: c.label, definition: c.def, value_label: c.valueLabel, parts: r.parts, value_idr: r.value || 0 }; });
  if (!q.cat) return json(res, 200, { filter: { crit }, summary, notes: ["Counts are parts, not locations. Values are Estimates: price is the last purchase order item amount, read as a unit price, and exists only for parts with a usable PO line. Categories overlap (a part can be both below Min and a critical spare)."] });
  const c = CATS[q.cat]; if (!c) return fail(res, 400, "unknown category: " + Object.keys(CATS).join(", "));
  const order = { value: `(${c.val}) desc`, stock: "p.stock desc", crit: "p.crit_rank desc, p.stock desc", cover: "p.months_cover desc", id: "p.material_no" }[q.sort] || `(${c.val}) desc`, limit = num(q.limit, 50, 1, 200), offset = num(q.offset, 0, 0, 100000);
  const total = db.prepare(`select count(*) c ${from} where ${c.w}${cw}`).get(...ca).c;
  const rows = db.prepare(`select p.material_no, m.descr, m.unit, m.mrp_type, m.for_tag, p.crit_max, p.demand_class, p.months_active, p.total_qty, p.last_issue, p.stock, p.min_qty, p.max_qty, p.unit_price_idr, p.stock_value_idr, p.months_cover, p.lt_median, (${c.val}) as category_value_idr, p.family_id ${from} where ${c.w}${cw} order by ${order} limit ? offset ?`).all(...ca, limit, offset);
  json(res, 200, { cat: q.cat, label: c.label, definition: c.def, value_label: c.valueLabel, total, limit, offset, rows });
});
