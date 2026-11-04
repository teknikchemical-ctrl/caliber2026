// GET /api/ws/report (owner: Claude B). The parts of the action report that are not in the engine payloads: stock to release and the data fixes.
// Release: parts held with no issue in 17 months or above the projected need, largest value first, with the insurance quantity kept for criticality S and A parts.
// Data fixes: every data quality finding of the import (dq_issue) with its handling, grouped by source table.
import { openDb, json, guard, fig, pay, CUTOFF } from "./_lib.mjs";
let cache = null;
function build(db) {
  const R = db.prepare(`select p.material_no, m.descr, m.unit, p.crit_max crit, p.stock, p.installed_total inst, p.n_issues, p.unit_price_idr price, p.stock_value_idr v, p.excess_value_idr x
    from part_profile p join material m using(material_no) where p.stock > 0 and p.unit_price_idr > 0 and (p.n_issues = 0 or p.excess_value_idr > 0) order by coalesce(p.excess_value_idr, 0) + case when p.n_issues = 0 then p.stock_value_idr else 0 end desc limit 400`).all();
  const rel = R.map((r) => { const keep = r.crit === "S" || r.crit === "A" ? Math.min(r.stock, Math.max(1, Math.ceil(r.inst || 1))) : 0, dead = !r.n_issues, qty = dead ? Math.max(0, r.stock - keep) : Math.max(0, Math.round((r.x || 0) / r.price)), value = qty * r.price;
    return { material_no: r.material_no, descr: r.descr, unit: r.unit, crit: r.crit, stock: r.stock, keep: dead ? keep : r.stock - qty, release_qty: qty, release_value: value, reason: dead ? "No issue in 17 months" + (keep ? `; keep ${keep} as insurance` : "") : "Above the projected need" }; }).filter((r) => r.release_qty > 0).sort((a, b) => b.release_value - a.release_value);
  const dq = db.prepare("select table_name t, issue, severity, detail, action from dq_issue order by case severity when 'error' then 0 when 'warn' then 1 else 2 end, table_name").all();
  return { cutoff: CUTOFF, release: rel.slice(0, 60), release_parts: rel.length, release_value: rel.reduce((t, r) => t + r.release_value, 0), data_fixes: dq };
}
export default guard((req, res) => { if (!cache) cache = build(openDb()); const o = cache;
  json(res, 200, pay("ws.report", {}, o, [fig("release_value", "Stock value that can be released", o.release_value, "IDR", "Estimate"), fig("release_parts", "Parts with stock to release", o.release_parts, "parts", "Estimate"), fig("data_fixes", "Data quality findings", o.data_fixes.length, "findings", "Data")], ["BoM", "Movement Material", "PR PO", "import checks"], ["Release quantity: all stock of a part with no issue in 17 months, minus an insurance quantity equal to the installed quantity for criticality S and A parts; for parts above the projected need, the excess value at the unit price."])); });
