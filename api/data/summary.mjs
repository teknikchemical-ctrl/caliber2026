// GET /api/data/summary : KPIs for the Overview page. All numbers computed from the database; money is IDR and an ESTIMATE (price = last PO item amount, read as a unit price). (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
export default guard((req, res) => {
  const db = openDb(), one = (s, ...a) => db.prepare(s).get(...a), all = (s, ...a) => db.prepare(s).all(...a);
  const meta = Object.fromEntries(all("select key, value from meta").map(r => [r.key, r.value]));
  const tot = one(`select count(*) parts, sum(months_active>0) with_demand, sum(stock>0) with_stock, sum(stock_value_idr) stock_value, sum(excess_value_idr) excess_value, sum(unit_price_idr is not null) priced from part_profile`);
  const below = one(`select sum(p.stock<p.min_qty and p.min_qty>0) below_min, sum(p.stock>p.max_qty and p.max_qty>0) above_max, sum(p.stock=0) zero_stock from part_profile p join material m using(material_no) where m.mrp_type='Stock Item'`);
  const crit = all(`select coalesce(crit_max,'unknown') crit, count(*) parts, sum(p.stock_value_idr) stock_value, sum(p.excess_value_idr) excess_value, sum(p.stock=0 and m.mrp_type='Stock Item') zero_stock from part_profile p join material m using(material_no) group by 1 order by 1`);
  const cls = all(`select demand_class, count(*) parts from part_profile group by 1 order by 2 desc`);
  const zeroCrit = one(`select count(*) n from part_profile p join material m using(material_no) where m.mrp_type='Stock Item' and p.stock=0 and p.crit_max in ('S','A') and p.months_active>0`);
  const insurance = one(`select count(*) n from part_profile where months_active=0 and crit_max in ('S','A') and (lt_median>90 or lt_median is null)`);
  const topExcess = all(`select p.material_no, m.descr, p.crit_max, p.stock, p.max_qty, p.excess_value_idr from part_profile p join material m using(material_no) where excess_value_idr>0 order by excess_value_idr desc limit 10`);
  const topRisk = all(`select p.material_no, m.descr, p.crit_max, p.stock, p.min_qty, p.max_qty, p.total_qty, p.lt_median, p.months_active from part_profile p join material m using(material_no) where m.mrp_type='Stock Item' and p.stock=0 and p.crit_max in ('S','A') and p.months_active>=2 order by p.crit_rank desc, p.total_qty desc limit 10`);
  const share = one(`select sum(case when r<=10 then e end)*1.0/sum(e) top10, sum(case when r<=100 then e end)*1.0/sum(e) top100 from (select excess_value_idr e, row_number() over (order by excess_value_idr desc) r from part_profile where excess_value_idr>0)`);
  const dqc = one(`select sum(severity='error') errors, sum(severity='warn') warns, count(*) total from dq_issue`);
  json(res, 200, { meta, parts: tot, stock_health: below, by_criticality: crit, by_demand_class: cls, zero_stock_critical_with_demand: zeroCrit.n, insurance_spare_candidates: insurance.n, top_excess: topExcess, excess_concentration: share, top_stockout_risk_candidates: topRisk, data_quality: dqc,
    notes: ["Stock value and excess value cover only parts with a usable purchase price and are estimates.", "Zero-stock critical parts are those with stock 0, criticality S or A and at least 2 months with issues in the history."] });
});
