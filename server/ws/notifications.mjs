// GET|POST /api/ws/notifications (owner: Claude B). Notification explorer over all 5,795 records of Notif History.
// Inputs: from, to (YYYY-MM-DD), type (N1,N2,N3,N6 list), priority (list), status (Complete | In Progress), class (list), crit (S,A,B,C,none list), system, q (text in description or location), loc (exact functional location),
//         overdue=1 (in progress and the required end has passed at the data cut-off), sort (date | priority | age | location), limit, offset.
// Outputs: total for the filter, monthly counts by priority, breakdowns by type, status, class and criticality, completion-time statistics, one page of records.
import { openDb, json, guard, num, body, list, fig, pay, CUTOFF, median, quant } from "./_lib.mjs";
const PR = ["Emergency", "High", "Medium", "Low"];
export function where(i) {
  const w = [], a = [];
  if (i.from) { w.push("n.notif_date >= ?"); a.push(String(i.from).slice(0, 10)); }
  if (i.to) { w.push("n.notif_date <= ?"); a.push(String(i.to).slice(0, 10)); }
  const ty = list(i.type); if (ty.length) { w.push(`n.type in (${ty.map(() => "?").join(",")})`); a.push(...ty); }
  const pr = list(i.priority); if (pr.length) { w.push(`n.priority in (${pr.map(() => "?").join(",")})`); a.push(...pr); }
  if (i.status) { w.push("n.status = ?"); a.push(String(i.status)); }
  const cl = list(i.class).map((x) => x.toUpperCase()); if (cl.length) { w.push(`f.eq_class in (${cl.map(() => "?").join(",")})`); a.push(...cl); }
  const cr = list(i.crit).map((x) => x.toUpperCase()); if (cr.length) { const nn = cr.includes("NONE"), c2 = cr.filter((x) => x !== "NONE"); w.push("(" + [c2.length ? `f.criticality in (${c2.map(() => "?").join(",")})` : "", nn ? "f.criticality is null" : ""].filter(Boolean).join(" or ") + ")"); a.push(...c2); }
  if (i.system) { w.push("f.system_code = ?"); a.push(String(i.system).toUpperCase()); }
  if (i.loc) { w.push("n.funcloc = ?"); a.push(String(i.loc)); }
  if (i.q) { const t = "%" + String(i.q).trim().slice(0, 60) + "%"; w.push("(n.descr like ? or n.funcloc like ? or n.notif_no like ? or n.order_no like ?)"); a.push(t, t, t, t); }
  if (String(i.overdue) === "1") { w.push("n.status = 'In Progress' and n.req_end < ?"); a.push(CUTOFF); }
  return { sql: w.length ? "where " + w.join(" and ") : "", args: a };
}
const SORT = { date: "n.notif_date desc", priority: "case n.priority when 'Emergency' then 1 when 'High' then 2 when 'Medium' then 3 else 4 end, n.notif_date desc", age: "n.notif_date asc", location: "n.funcloc, n.notif_date desc" };
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), W = where(i), J = "from notification n left join funcloc f on f.funcloc = n.funcloc";
  const total = db.prepare(`select count(*) c ${J} ${W.sql}`).get(...W.args).c;
  const monthly = db.prepare(`select substr(n.notif_date,1,7) m, n.priority p, count(*) c ${J} ${W.sql} group by 1,2 order by 1`).all(...W.args);
  const mm = [...new Set(monthly.map((r) => r.m))].sort(), byM = mm.map((m) => ({ month: m, ...Object.fromEntries(PR.map((p) => [p, (monthly.find((r) => r.m === m && r.p === p) || {}).c || 0])) }));
  const grp = (col) => db.prepare(`select coalesce(${col},'none') k, count(*) c, sum(n.status='In Progress') open ${J} ${W.sql} group by 1 order by c desc`).all(...W.args);
  const done = db.prepare(`select julianday(n.completed_on)-julianday(n.notif_date) d, julianday(n.completed_on)-julianday(n.req_end) late ${J} ${W.sql}${W.sql ? " and" : " where"} n.completed_on is not null`).all(...W.args);
  const open = db.prepare(`select count(*) c, sum(n.req_end < ?) overdue ${J} ${W.sql}${W.sql ? " and" : " where"} n.status = 'In Progress'`).get(CUTOFF, ...W.args);
  const limit = num(i.limit, 25, 1, 100), offset = num(i.offset, 0, 0, 1e6);
  const rows = db.prepare(`select n.notif_no, n.notif_date, n.type, n.priority, n.status, n.funcloc, n.descr, n.order_no, n.req_start, n.req_end, n.completed_on, f.tag, f.descr loc_descr, f.eq_class, f.eq_class_name, f.criticality,
    (select count(*) from movement m where m.order_no = n.order_no and n.order_no is not null) n_issues ${J} ${W.sql} order by ${SORT[i.sort] || SORT.date} limit ? offset ?`).all(...W.args, limit, offset)
    .map((r) => ({ ...r, days_to_complete: r.completed_on ? Math.round((Date.parse(r.completed_on) - Date.parse(r.notif_date)) / 864e5) : null, overdue: r.status === "In Progress" && r.req_end && r.req_end < CUTOFF }));
  const d = done.map((x) => x.d), late = done.filter((x) => x.late > 0).length;
  const outputs = { total, limit, offset, monthly: byM, by_type: grp("n.type"), by_priority: grp("n.priority"), by_status: grp("n.status"), by_class: grp("f.eq_class").slice(0, 14), by_crit: grp("f.criticality"),
    completion: { completed: done.length, median_days: median(d), p90_days: quant(d, 0.9), completed_after_required_end: late }, open: { count: open.c || 0, overdue: open.overdue || 0 }, rows };
  json(res, 200, pay("ws.notifications", i, outputs, [fig("notifications", "Notifications in the selection", total, "notifications"), fig("open", "Still in progress", open.c || 0, "notifications"), fig("overdue", "In progress past the required end", open.overdue || 0, "notifications"), fig("median_days", "Median days from notification to completion", median(d), "days", "Estimate")],
    ["Notif History (table notification)", "FuncLoc list (table funcloc)", "Movement Material (table movement, issues on the same order)"], ["Overdue means still in progress and the required end date is before the data cut-off of " + CUTOFF + "."]));
});
