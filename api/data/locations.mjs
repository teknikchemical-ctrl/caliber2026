// GET /api/data/locations?q=&crit=&class=&system=&parts=1&sort=&limit=&offset= : all functional locations with criticality, stock keeping, maintenance and cost figures. (owner: Claude A)
// Stock figures are the parts installed at the location. Stock is held at material level, so figures are NOT additive across locations.
import { openDb } from "../_lib/db.mjs";
import { json, guard, qs, num } from "../_lib/http.mjs";
const SORTS = { crit: "case criticality when 'S' then 1 when 'A' then 2 when 'B' then 3 when 'C' then 4 else 5 end, n_parts desc", parts: "n_parts desc", stock: "stock_value_idr desc", excess: "excess_value_idr desc", notif: "notif_12m desc", pm: "pm_due_12m desc", zero: "n_critical_zero desc, n_zero_stock desc", tag: "funcloc" };
export default guard((req, res) => {
  const q = qs(req), db = openDb(), w = [], a = [];
  if (q.q) { const t = String(q.q).trim().slice(0, 60); w.push("(funcloc like ? or descr like ?)"); a.push("%" + t + "%", "%" + t + "%"); }
  if (q.crit) { if (q.crit === "none") w.push("criticality is null"); else { w.push("criticality = ?"); a.push(String(q.crit).toUpperCase().slice(0, 1)); } }
  if (q.class) { w.push("eq_class = ?"); a.push(String(q.class).toUpperCase().slice(0, 6)); }
  if (q.system) { w.push("system_code = ?"); a.push(String(q.system).toUpperCase().slice(0, 4)); }
  if (q.parts === "1") w.push("n_parts > 0");
  if (q.risk === "1") w.push("(n_critical_zero > 0 or n_zero_stock > 0)");
  const where = w.length ? "where " + w.join(" and ") : "", order = SORTS[q.sort] || SORTS.crit, limit = num(q.limit, 50, 1, 200), offset = num(q.offset, 0, 0, 100000);
  const total = db.prepare(`select count(*) c from location_profile ${where}`).get(...a).c;
  const rows = db.prepare(`select * from location_profile ${where} order by ${order} limit ? offset ?`).all(...a, limit, offset);
  const facets = { by_criticality: db.prepare("select coalesce(criticality,'none') k, count(*) locations, sum(n_parts>0) with_parts, sum(notif_12m) notif_12m, sum(pm_due_12m) pm_12m from location_profile group by 1 order by 1").all(),
    by_class: db.prepare("select eq_class k, max(eq_class_name) name, count(*) locations, sum(n_parts>0) with_parts, sum(n_parts) parts, sum(notif_12m) notif_12m from location_profile group by 1 order by locations desc limit 25").all(),
    by_system: db.prepare("select system_code k, max(descr) name from location_profile where system_code is not null group by 1 order by 1").all() };
  json(res, 200, { total, limit, offset, facets: q.facets === "0" ? undefined : facets, rows, notes: ["Stock value and excess are Estimates for the parts installed at the location; the same stock appears under every location a part is installed on, so do not add locations together.", "Notifications and planned maintenance counts are for the 12 months after the data cut-off (planned) and the 12 months before it (notifications)."] });
});
