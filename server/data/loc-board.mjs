// GET /api/data/loc-board[?class=&crit=] : the picture of the 14,484 functional locations: tiles, a criticality x class risk matrix, a risk scatter, process systems and the ranked risk list. (owner: Claude A)
// Stock figures are parts installed at a location and are NOT additive across locations (stock is held per material). Values are Estimates.
import { openDb } from "../_lib/db.mjs";
import { json, guard, qs } from "../_lib/http.mjs";
export default guard((req, res) => {
  const q = qs(req), db = openDb(), all = (s, ...a) => db.prepare(s).all(...a), one = (s, ...a) => db.prepare(s).get(...a);
  const w = [], a = []; if (q.class) { w.push("eq_class = ?"); a.push(String(q.class)); } if (q.crit) { w.push("criticality = ?"); a.push(String(q.crit).toUpperCase().slice(0, 1)); }
  const W = w.length ? "where " + w.join(" and ") : "";
  const tiles = one(`select count(*) locations, sum(n_parts>0) with_parts, sum(criticality in ('S','A')) critical, sum(n_critical_zero>0) critical_zero, sum(notif_open>0) open_work, sum(notif_open>0 and n_critical_zero>0 and criticality in ('S','A')) work_and_risk from location_profile ${W}`, ...a);
  const classes = all("select eq_class k, max(eq_class_name) name, count(*) n, sum(n_parts>0) with_parts from location_profile where eq_class is not null group by 1 order by with_parts desc limit 10");
  const ck = classes.map(c => c.k), qm = ck.map(() => "?").join(",");
  const heat = all(`select coalesce(criticality,'none') crit, eq_class k, count(*) locs, sum(n_critical_zero>0) at_risk, sum(n_parts) parts from location_profile where eq_class in (${qm}) and n_parts>0 group by 1,2`, ...ck);
  const scatter = all(`select funcloc, tag, descr, criticality crit, eq_class cls, n_parts, stock_value_idr value, excess_value_idr excess, notif_12m n12, n_critical_zero zc from location_profile ${W ? W + " and" : "where"} n_parts > 0 and stock_value_idr > 0 order by stock_value_idr desc limit 300`, ...a);
  const systems = all(`select system_code k, max(descr) name, count(*) locs, sum(n_parts>0) with_parts, sum(n_critical_zero) critical_zero, sum(notif_open) open_work from location_profile ${W ? W + " and" : "where"} system_code is not null group by 1 order by critical_zero desc, open_work desc limit 12`, ...a);
  const risk = all(`select funcloc, tag, descr, criticality crit, eq_class cls, n_parts, n_critical_zero zc, n_zero_stock zs, n_below_min bm, notif_open, notif_12m, stock_value_idr value, excess_value_idr excess from location_profile ${W ? W + " and" : "where"} criticality in ('S','A') and (n_critical_zero > 0 or n_below_min > 0) order by n_critical_zero desc, notif_open desc limit 20`, ...a);
  const byCrit = all(`select coalesce(criticality,'none') crit, count(*) locs, sum(n_parts>0) with_parts, sum(n_critical_zero>0) at_risk, sum(stock_value_idr) value from location_profile ${W} group by 1 order by 1`, ...a);
  json(res, 200, { filter: { class: q.class || null, crit: q.crit || null }, tiles, classes, heat, scatter, systems, risk, by_criticality: byCrit,
    notes: ["Stock figures are the parts installed at a location, not additive across locations.", "Risk here means parts used in the history that are at zero stock on S or A equipment; it is a screening count, not a failure probability.", "Values are Estimates (last PO item amount read as a unit price)."] });
});
