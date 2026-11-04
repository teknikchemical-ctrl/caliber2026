// GET /api/data/maint-board[?class=&crit=&from=YYYY-MM&to=YYYY-MM] : everything the Maintenance page draws, filtered by equipment class, criticality and period. (owner: Claude A)
// Notifications and planned maintenance only (the data has no work order cost or downtime). Planned due dates are calculated from cycle start and length (Estimate).
import { openDb } from "../_lib/db.mjs";
import { json, guard, qs } from "../_lib/http.mjs";
export default guard((req, res) => {
  const q = qs(req), db = openDb(), all = (s, ...a) => db.prepare(s).all(...a), one = (s, ...a) => db.prepare(s).get(...a), cut = one("select value v from meta where key='data_cutoff'").v;
  const w = [], a = [];
  if (q.class) { w.push("f.eq_class = ?"); a.push(String(q.class)); }
  if (q.crit) { w.push("f.criticality = ?"); a.push(String(q.crit).toUpperCase().slice(0, 1)); }
  const wBase = w.length ? " and " + w.join(" and ") : "", aBase = [...a];
  if (/^\d{4}-\d{2}$/.test(q.from || "")) { w.push("substr(n.notif_date,1,7) >= ?"); a.push(q.from); }
  if (/^\d{4}-\d{2}$/.test(q.to || "")) { w.push("substr(n.notif_date,1,7) <= ?"); a.push(q.to); }
  const W = w.length ? "where " + w.join(" and ") : "", J = "from notification n left join funcloc f using(funcloc)";
  const months = all(`select substr(n.notif_date,1,7) month, count(*) n, sum(n.priority='Emergency') emergency, sum(n.priority='High') high from notification n left join funcloc f using(funcloc) where 1=1 ${wBase} group by 1 order by 1`, ...aBase);
  const prio = ["Emergency", "High", "Medium", "Low"], mp = all(`select substr(n.notif_date,1,7) month, n.priority p, count(*) c ${J} ${W} group by 1,2`, ...a), mset = [...new Set(months.map(m => m.month))];
  const byMonthPrio = Object.fromEntries(prio.map(p => [p, mset.map(m => (mp.find(r => r.month === m && r.p === p) || { c: 0 }).c)]));
  const types = all(`select n.type t, count(*) c ${J} ${W} group by 1 order by 2 desc limit 6`, ...a).map(r => r.t), tm = all(`select n.type t, substr(n.notif_date,1,7) month, count(*) c ${J} ${W} group by 1,2`, ...a);
  const kp = one(`select count(*) total, sum(n.priority in ('High','Emergency')) high, sum(n.priority='Emergency') emergency, sum(n.status='In Progress') open_n, sum(n.status='In Progress' and n.req_end < ?) late, count(distinct n.funcloc) locs ${J} ${W}`, cut, ...a);
  const byClass = all(`select f.eq_class k, max(f.eq_class_name) name, count(*) n, sum(n.priority in ('High','Emergency')) high, sum(n.status='In Progress') open_n, sum(n.status='In Progress' and n.req_end < ?) late, count(distinct n.funcloc) locs ${J} ${W} group by 1 order by n desc limit 14`, cut, ...a);
  const classes = all(`select f.eq_class k, max(f.eq_class_name) name, count(*) n from notification n join funcloc f using(funcloc) where 1=1 ${w.filter(x => x.startsWith("f.crit")).length ? " and " + w.filter(x => x.startsWith("f.crit")).join(" and ") : ""} group by 1 order by n desc limit 14`, ...(q.crit ? [String(q.crit).toUpperCase().slice(0, 1)] : []));
  const byCrit = all(`select coalesce(f.criticality,'none') k, count(*) n, sum(n.priority in ('High','Emergency')) high, sum(n.status='In Progress') open_n ${J} ${W} group by 1 order by 1`, ...a);
  const top = all(`select n.funcloc, max(f.descr) descr, max(f.criticality) crit, max(f.eq_class) cls, count(*) n, sum(n.priority in ('High','Emergency')) high, sum(n.status='In Progress') open_n ${J} ${W} group by 1 order by n desc limit 12`, ...a);
  const tl = all(`select n.notif_date d, n.priority p, f.eq_class c, n.funcloc l ${J} ${W} order by n.notif_date limit 6000`, ...a).map(r => [r.d, prio.indexOf(r.p), r.c || "", r.l]);
  const exposed = all(`select lp.funcloc, lp.descr, lp.criticality crit, lp.eq_class cls, lp.notif_open, lp.n_critical_zero, lp.n_zero_stock, lp.n_parts from location_profile lp where lp.criticality in ('S','A') and lp.notif_open > 0 and (lp.n_critical_zero > 0 or lp.n_zero_stock > 0) ${q.class ? "and lp.eq_class = ?" : ""} order by lp.n_critical_zero desc, lp.notif_open desc limit 15`, ...(q.class ? [q.class] : []));
  const pw = [], pa = []; if (q.class) { pw.push("f.eq_class = ?"); pa.push(q.class); } if (q.crit) { pw.push("f.criticality = ?"); pa.push(String(q.crit).toUpperCase().slice(0, 1)); }
  const PW = pw.length ? " and " + pw.join(" and ") : "", PJ = "from maint_item m join funcloc f using(funcloc) where m.next_due > ? and m.next_due <= date(?, '+12 months')";
  const pm = all(`select substr(m.next_due,1,7) month, count(*) items, sum(m.abc in ('S','A')) critical_items ${PJ}${PW} group by 1 order by 1`, cut, cut, ...pa);
  const pmClass = all(`select f.eq_class k, max(f.eq_class_name) name, count(*) items, sum(m.abc in ('S','A')) critical_items ${PJ}${PW} group by 1 order by items desc limit 10`, cut, cut, ...pa);
  const pmTask = all(`select m.descr task, count(*) items ${PJ}${PW} group by 1 order by items desc limit 10`, cut, cut, ...pa);
  const base = pm.length > 3 ? [...pm.map(x => x.items)].sort((x, y) => x - y)[Math.floor(pm.length / 2)] : null;
  json(res, 200, { cutoff: cut, filter: { class: q.class || null, crit: q.crit || null, from: q.from || null, to: q.to || null }, months, month_priority: { months: mset, ...byMonthPrio }, types, type_month: { months: mset, rows: types.map(t => mset.map(m => (tm.find(r => r.t === t && r.month === m) || { c: 0 }).c)) },
    kpis: kp, by_class: byClass, classes, by_criticality: byCrit, top_locations: top, timeline: tl, exposed, planned: { by_month: pm, by_class: pmClass, top_tasks: pmTask, median_month: base },
    notes: ["Notification types N1, N2, N3 and N6 are shown as in the baseline data; their meaning is not given and is not interpreted.", "The data has no work order cost, downtime or failure codes, so none is shown.", "Planned due dates are calculated from the cycle start and length (Estimate)."] });
});
