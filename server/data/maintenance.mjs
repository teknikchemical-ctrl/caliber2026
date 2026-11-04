// GET /api/data/maintenance : notifications and planned maintenance from the baseline data (summary), or ?list=1&status=&priority=&crit=&limit=&offset= for the notification list. (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, guard, qs, num } from "../_lib/http.mjs";
export default guard((req, res) => {
  const q = qs(req), db = openDb(), all = (s, ...a) => db.prepare(s).all(...a), one = (s, ...a) => db.prepare(s).get(...a), cut = one("select value v from meta where key='data_cutoff'").v;
  if (q.list === "1") {
    const w = [], a = []; if (q.status) { w.push("n.status = ?"); a.push(String(q.status)); } if (q.priority) { w.push("n.priority = ?"); a.push(String(q.priority)); } if (q.crit) { w.push("f.criticality = ?"); a.push(String(q.crit).toUpperCase().slice(0, 1)); }
    if (q.class) { w.push("f.eq_class = ?"); a.push(String(q.class)); } if (/^\d{4}-\d{2}$/.test(q.from || "")) { w.push("substr(n.notif_date,1,7) >= ?"); a.push(q.from); } if (/^\d{4}-\d{2}$/.test(q.to || "")) { w.push("substr(n.notif_date,1,7) <= ?"); a.push(q.to); }
    const where = w.length ? "where " + w.join(" and ") : "", limit = num(q.limit, 50, 1, 200), offset = num(q.offset, 0, 0, 100000);
    const total = one(`select count(*) c from notification n left join funcloc f using(funcloc) ${where}`, ...a).c;
    const rows = all(`select n.notif_no, n.notif_date, n.type, n.priority, n.status, n.funcloc, f.descr loc_descr, f.criticality, n.descr, n.required_end, n.completed_on from notification n left join funcloc f using(funcloc) ${where} order by n.notif_date desc limit ? offset ?`.replace("n.required_end", "n.req_end"), ...a, limit, offset);
    return json(res, 200, { total, limit, offset, rows });
  }
  const kp = one(`select count(*) total, sum(notif_date > date(?, '-12 months')) last12, sum(status='In Progress') open_n, sum(priority='Emergency') emergency, sum(priority in ('High','Emergency')) high from notification`, cut);
  const lateOpen = one("select count(*) c from notification where status='In Progress' and req_end < ?", cut).c;
  const byMonth = all("select substr(notif_date,1,7) month, count(*) n, sum(priority in ('High','Emergency')) high from notification group by 1 order by 1");
  const byType = all("select type, count(*) n from notification group by 1 order by n desc"), byPrio = all("select priority, count(*) n from notification group by 1 order by n desc");
  const byClass = all("select f.eq_class k, max(f.eq_class_name) name, count(*) n, sum(n.priority in ('High','Emergency')) high from notification n join funcloc f using(funcloc) where n.notif_date > date(?, '-12 months') group by 1 order by n desc limit 12", cut);
  const byCrit = all("select coalesce(f.criticality,'none') k, count(*) n, sum(n.priority in ('High','Emergency')) high, sum(n.status='In Progress') open_n from notification n join funcloc f using(funcloc) group by 1 order by 1");
  const top = all("select funcloc, descr, criticality, eq_class, notif_12m, notif_high_12m, notif_open, n_parts, n_critical_zero from location_profile where notif_12m > 0 order by notif_12m desc limit 15");
  const exposed = all("select funcloc, descr, criticality, notif_open, n_critical_zero, n_zero_stock from location_profile where criticality in ('S','A') and notif_open > 0 and (n_critical_zero > 0 or n_zero_stock > 0) order by n_critical_zero desc, notif_open desc limit 15");
  const pm = all("select substr(next_due,1,7) month, count(*) items, sum(abc in ('S','A')) critical_items from maint_item where next_due > ? and next_due <= date(?, '+12 months') group by 1 order by 1", cut, cut);
  const pmClass = all("select f.eq_class k, max(f.eq_class_name) name, count(*) items from maint_item m join funcloc f using(funcloc) where m.next_due > ? and m.next_due <= date(?, '+12 months') group by 1 order by items desc limit 10", cut, cut);
  const pmType = all("select descr task, count(*) items from maint_item where next_due > ? and next_due <= date(?, '+12 months') group by 1 order by items desc limit 10", cut, cut);
  json(res, 200, { cutoff: cut, kpis: { ...kp, open_past_required_end: lateOpen }, by_month: byMonth, by_type: byType, by_priority: byPrio, by_class_12m: byClass, by_criticality: byCrit, top_locations: top, critical_locations_with_open_work_and_stock_risk: exposed, planned: { by_month: pm, by_class: pmClass, top_tasks: pmType },
    notes: ["Notification types N1, N2, N3 and N6 are shown as in the baseline data: their meaning is not given in the data and is not interpreted here.", "Planned due dates are calculated from the cycle start and cycle length (Estimate), not scheduled dates."] });
});
