// GET /api/data/registers : four working lists built from the baseline with fixed, stated rules. (owner: Claude A)
//  insurance: no demand, S or A, lead time above 90 days or unknown (kept on purpose)   pilot: 50 parts to start the dynamic policy (25 B and C release candidates, 25 critical zero-stock parts with demand)
//  obsolete: stock items with stock and no issue in the history on B, C or unclassified equipment (review, never automatic disposal)   reorder: S or A stock items at zero stock with issues in at least 2 months
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
import { WITH } from "./savings.mjs";
export default guard((req, res) => {
  const db = openDb(), cols = "p.material_no, m.descr, m.unit, p.crit_max crit, p.stock, p.min_qty, p.max_qty, p.unit_price_idr price, p.stock_value_idr value, p.months_active, p.total_qty, p.last_issue, p.lt_median lead";
  const q = (w, ord, lim) => db.prepare(`select ${cols} from part_profile p join material m using(material_no) where ${w} order by ${ord} limit ${lim}`).all();
  const tot = (w) => db.prepare(`select count(*) n, coalesce(sum(p.stock_value_idr),0) v from part_profile p join material m using(material_no) where ${w}`).get();
  const W = { insurance: "p.months_active = 0 and p.crit_max in ('S','A') and (p.lt_median is null or p.lt_median > 90) and p.stock > 0", obsolete: "m.mrp_type = 'Stock Item' and p.months_active = 0 and p.stock > 0 and (p.crit_max in ('B','C') or p.crit_max is null)", reorder: "m.mrp_type = 'Stock Item' and p.stock = 0 and p.crit_max in ('S','A') and p.months_active >= 2" };
  const rel = db.prepare(`${WITH} select v.material_no, v.descr, m.unit, v.crit_max crit, v.stock, v.min_qty, v.max_qty, v.unit_price_idr price, v.stock_value_idr value, v.months_active, v.total_qty, v.last_issue, p.lt_median lead, v.value release, v.cat from v join part_profile p using(material_no) join material m using(material_no) where v.cat in ('excess_true','non_moving') order by v.value desc limit 25`).all();
  const crit = q(W.reorder, "p.crit_rank desc, p.total_qty desc", 25).map(r => ({ ...r, why: "S or A part at zero stock, issued in " + r.months_active + " months" }));
  const pilot = [...rel.map(r => ({ ...r, why: (r.cat === "non_moving" ? "Non-moving B or C stock: review for release, " : "Above Max on B or C equipment: reduce to Max, ") + "value IDR " + (r.release / 1e9).toFixed(2) + " bn (Estimate)" })), ...crit];
  json(res, 200, { insurance: { ...tot(W.insurance), rows: q(W.insurance, "p.stock_value_idr desc", 100), rule: "No issue in the 17 months of history, criticality S or A, lead time above 90 days or unknown, stock on hand. Kept on purpose: never recommended for disposal." },
    pilot: { n: pilot.length, value: rel.reduce((s, r) => s + (r.release || 0), 0), rows: pilot, rule: "25 largest B and C release candidates (above Max or non-moving, mutually exclusive categories as on Cost reduction) and 25 critical parts at zero stock with demand. A small set to prove the policy before the whole portfolio." },
    obsolete: { ...tot(W.obsolete), rows: q(W.obsolete, "p.stock_value_idr desc", 100), rule: "Stock item, stock on hand, no issue in the history, B or C or unclassified equipment. Candidates for review, not for automatic disposal." },
    reorder: { ...tot(W.reorder), rows: q(W.reorder, "p.crit_rank desc, p.total_qty desc", 100), rule: "S or A stock item at zero stock with issues in at least 2 months. Check open orders first: they are not in the data." },
    notes: ["Values are Estimates: last PO item amount read as a unit price, for parts that have a price only.", "Lead time is a proxy (PR date to PO delivery date)."] });
});
