// GET|POST /api/ws/timeline (owner: Claude B). Month-by-month history of a scope, joined across four source files, plus the planned maintenance ahead.
// Scope: loc (one functional location) or class, crit, system, q over the locations; empty = whole plant.
// Series per month (May 2025 to the end of the plan horizon): notifications created by priority, notifications completed, open backlog and overdue backlog at month end,
// part issues (count, quantity, value Estimate; for a location: issues booked on its orders), planned task occurrences (past and future), purchase order lines delivered for the parts installed in the scope.
// For one location the answer also lists every dated event in order.
import { openDb, json, guard, num, body, list, fig, pay, CUTOFF, months, addMonths } from "./_lib.mjs";
import { occurrences } from "./plan.mjs";
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), ahead = num(i.ahead, 12, 0, 24), M = months("2025-05", 17 + ahead), hist = M.slice(0, 17);
  const w = [], a = [];
  if (i.loc) { w.push("f.funcloc = ?"); a.push(String(i.loc)); }
  const cl = list(i.class).map((x) => x.toUpperCase()); if (cl.length) { w.push(`f.eq_class in (${cl.map(() => "?").join(",")})`); a.push(...cl); }
  const cr = list(i.crit).map((x) => x.toUpperCase()); if (cr.length) { w.push(`f.criticality in (${cr.map(() => "?").join(",")})`); a.push(...cr); }
  if (i.system) { w.push("f.system_code = ?"); a.push(String(i.system).toUpperCase()); }
  if (i.q) { const t = "%" + String(i.q).trim().slice(0, 60) + "%"; w.push("(f.funcloc like ? or f.descr like ?)"); a.push(t, t); }
  const scoped = w.length > 0, W = scoped ? "where " + w.join(" and ") : "";
  /* the scope as a set of locations, filtered in memory so that the endpoint also runs on a read-only database */
  const LS = new Set(db.prepare(`select f.funcloc from funcloc f ${W}`).all(...a).map((r) => r.funcloc)), nLoc = LS.size, inS = (f) => !scoped || LS.has(f);
  const S = (sql, ...x) => db.prepare(sql).all(...x), idx = Object.fromEntries(M.map((m, k) => [m, k])), z = () => M.map(() => 0);
  const pr = ["Emergency", "High", "Medium", "Low"], created = Object.fromEntries(pr.map((p) => [p, z()])), done = z(), open = z(), overdue = z();
  const nots = S("select notif_no, notif_date, priority, req_end, completed_on, status, descr, order_no, funcloc from notification").filter((n) => inS(n.funcloc));
  nots.forEach((n) => { const k = idx[n.notif_date.slice(0, 7)]; if (k != null && created[n.priority]) created[n.priority][k]++; if (n.completed_on) { const c = idx[n.completed_on.slice(0, 7)]; if (c != null) done[c]++; } });
  hist.forEach((m, k) => { const end = m + "-31"; let o = 0, od = 0; nots.forEach((n) => { if (n.notif_date <= end && !(n.completed_on && n.completed_on <= end)) { o++; if (n.req_end && n.req_end < (k === 16 ? CUTOFF : end)) od++; } }); open[k] = o; overdue[k] = od; });
  const issues = scoped ? S("select m.posting_date d, m.material_no, m.qty, m.order_no, m.funcloc, p.unit_price_idr pr, t.descr from movement m left join part_profile p using(material_no) left join material t using(material_no) where m.funcloc is not null").filter((r) => LS.has(r.funcloc))
    : S("select substr(m.posting_date,1,7) mo, count(*) n, sum(m.qty) q, sum(m.qty * coalesce(p.unit_price_idr,0)) v from movement m left join part_profile p using(material_no) group by 1");
  const iss = { n: z(), qty: z(), value: z() };
  if (scoped) issues.forEach((r) => { const k = idx[r.d.slice(0, 7)]; if (k == null) return; iss.n[k]++; iss.qty[k] += r.qty; iss.value[k] += (r.pr || 0) * r.qty; });
  else issues.forEach((r) => { const k = idx[r.mo]; if (k == null) return; iss.n[k] = r.n; iss.qty[k] = r.q; iss.value[k] = r.v; });
  const plan = z(), planItems = S("select * from maint_item").filter((it) => inS(it.funcloc)), planEv = [];
  planItems.forEach((it) => occurrences(it, "2025-05", M.length).forEach((d) => { const k = idx[d.slice(0, 7)]; if (k != null) { plan[k]++; if (i.loc) planEv.push({ d, kind: "plan", text: it.descr, ref: it.cycle_text }); } }));
  const po = scoped ? (() => { const ms = new Set(S("select funcloc, material_no from bom").filter((b) => LS.has(b.funcloc)).map((b) => b.material_no)); return S("select po_delivery d, qty, amount, material_no, supplier from po_line where po_delivery is not null").filter((r) => ms.has(r.material_no)); })()
    : S("select substr(po_delivery,1,7) mo, count(*) n, sum(amount) v from po_line where po_delivery is not null group by 1");
  const buy = { n: z(), value: z() };
  if (scoped) po.forEach((r) => { const k = idx[String(r.d).slice(0, 7)]; if (k == null) return; buy.n[k]++; buy.value[k] += r.amount || 0; });
  else po.forEach((r) => { const k = idx[r.mo]; if (k == null) return; buy.n[k] = r.n; buy.value[k] = r.v || 0; });
  let events = null;
  if (i.loc) { events = [];
    nots.forEach((n) => { events.push({ d: n.notif_date, kind: "notification", text: n.descr, ref: n.notif_no, priority: n.priority, status: n.status }); if (n.completed_on) events.push({ d: n.completed_on, kind: "completed", text: n.descr, ref: n.notif_no }); });
    (Array.isArray(issues) && scoped ? issues : []).forEach((r) => events.push({ d: r.d, kind: "issue", text: r.descr, ref: r.material_no, qty: r.qty, value: r.pr ? r.pr * r.qty : null }));
    planEv.filter((e) => e.d <= addMonths(CUTOFF.slice(0, 7), ahead) + "-31").forEach((e) => events.push(e));
    events.sort((x, y) => y.d.localeCompare(x.d)); events = events.slice(0, 400); }
  const loc = i.loc ? db.prepare("select funcloc, tag, descr, criticality, eq_class, eq_class_name from funcloc where funcloc = ?").get(String(i.loc)) : null;
  const sumH = (arr) => arr.slice(0, 17).reduce((s, v) => s + v, 0);
  json(res, 200, pay("ws.timeline", { ...i, ahead }, { months: M, history_months: 17, locations: nLoc, location: loc, notifications: { created, completed: done, open, overdue }, issues: iss, planned: plan, purchases: buy, events },
    [fig("created", "Notifications created in 17 months", pr.reduce((s, p) => s + sumH(created[p]), 0), "notifications"), fig("open_end", "Open at the data cut-off", open[16], "notifications"), fig("issued_value", "Value of parts issued in 17 months", sumH(iss.value), "IDR", "Estimate"), fig("planned_ahead", "Planned tasks in the months ahead", plan.slice(17).reduce((s, v) => s + v, 0), "tasks", "Estimate")],
    ["Notif History", "Movement Material", "Mitem & Mplan", "PR PO", "BoM", "FuncLoc list"], [scoped ? "For a scope, part issues are those booked on orders of its locations; purchases are deliveries of the parts installed there." : "Whole plant: every part issue and every purchase delivery.", "Backlog = notifications created and not completed at the month end."]));
});
