// GET /api/data/overview : the numbers behind the Overview charts: stock value by criticality and status, action counts, excess concentration. (owner: Claude A)
// Status uses the same mutually exclusive categories as the savings page; stock not in any category is "normal". Money is IDR and an Estimate.
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
import { WITH } from "./savings.mjs";
export default guard((req, res) => {
  const db = openDb();
  const rows = db.prepare(`${WITH} select coalesce(crit_max,'none') crit, coalesce(cat,'normal') cat, count(*) parts, sum(stock_value_idr) stock_value, sum(case when cat in ('excess_true','excess_crit') then excess_value_idr else 0 end) excess_value from b where stock > 0 group by 1,2`).all();
  const pareto = db.prepare(`select p.material_no, m.descr, p.crit_max, p.excess_value_idr value from part_profile p join material m using(material_no) where p.excess_value_idr > 0 order by 4 desc limit 12`).all();
  const tot = db.prepare(`select sum(excess_value_idr) e from part_profile where excess_value_idr > 0`).get().e;
  const act = db.prepare(`select
    sum(m.mrp_type='Stock Item' and p.stock=0 and p.crit_max in ('S','A') and p.months_active>=2) zero_crit,
    sum(m.mrp_type='Stock Item' and p.min_qty>0 and p.stock<p.min_qty and p.stock>0 and p.crit_max in ('S','A')) below_min_crit
    from part_profile p join material m using(material_no)`).get();
  json(res, 200, { stock_by_status: rows, excess_pareto: pareto, excess_total_idr: tot, actions: act,
    notes: ["Status categories are mutually exclusive and rule based; they are Estimates on priced parts that hold stock."] });
});
