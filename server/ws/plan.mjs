// GET|POST /api/ws/plan (owner: Claude B). Maintenance plan explorer over all 10,153 items of Mitem & Mplan.
// Every occurrence in the chosen horizon is calculated from the start of cycle and the cycle length (not only the next due date).
// Inputs: from (YYYY-MM, default the month after the data cut-off), horizon (3 to 36 months), abc, priority, cycle (cycle text list), class, crit, system, q, loc, sort (next | location | cycle), limit, offset.
// Outputs: occurrence calendar by month and class, totals, breakdowns by cycle and ABC indicator, one page of items with their occurrence months.
import { openDb, json, guard, num, body, list, fig, pay, CUTOFF, addMonths, months } from "./_lib.mjs";
const DAY = 864e5, MLEN = 30.4375;
export function planItems(db, i) {
  const w = [], a = [];
  const ab = list(i.abc).map((x) => x.toUpperCase()); if (ab.length) { w.push(`m.abc in (${ab.map(() => "?").join(",")})`); a.push(...ab); }
  const pr = list(i.priority).map(Number).filter(isFinite); if (pr.length) { w.push(`m.priority in (${pr.map(() => "?").join(",")})`); a.push(...pr); }
  const cy = list(i.cycle); if (cy.length) { w.push(`upper(m.cycle_text) in (${cy.map(() => "?").join(",")})`); a.push(...cy.map((x) => x.toUpperCase())); }
  const cl = list(i.class).map((x) => x.toUpperCase()); if (cl.length) { w.push(`f.eq_class in (${cl.map(() => "?").join(",")})`); a.push(...cl); }
  const cr = list(i.crit).map((x) => x.toUpperCase()); if (cr.length) { w.push(`f.criticality in (${cr.map(() => "?").join(",")})`); a.push(...cr); }
  if (i.system) { w.push("f.system_code = ?"); a.push(String(i.system).toUpperCase()); }
  if (i.loc) { w.push("m.funcloc = ?"); a.push(String(i.loc)); }
  const locs = list(i.locs); if (locs.length) { w.push(`m.funcloc in (${locs.map(() => "?").join(",")})`); a.push(...locs); }
  if (i.q) { const t = "%" + String(i.q).trim().slice(0, 60) + "%"; w.push("(m.descr like ? or m.funcloc like ? or f.descr like ?)"); a.push(t, t, t); }
  return db.prepare(`select m.*, f.tag, f.descr loc_descr, f.eq_class, f.eq_class_name, f.criticality from maint_item m left join funcloc f on f.funcloc = m.funcloc ${w.length ? "where " + w.join(" and ") : ""}`).all(...a);
}
/* occurrence months of one item inside [from, from + horizon) */
export function occurrences(it, from, horizon) {
  const t0 = Date.parse(from + "-01"), t1 = Date.parse(addMonths(from, horizon) + "-01"), st = Date.parse(it.start_of_cycle), step = Math.max(1, it.cycle_months * MLEN) * DAY, out = [];
  if (!isFinite(st)) return out; let k = Math.max(0, Math.ceil((t0 - st) / step)); for (let t = st + k * step; t < t1 && out.length < 400; t += step) if (t >= t0) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), from = /^\d{4}-\d{2}$/.test(String(i.from || "")) ? String(i.from) : addMonths(CUTOFF.slice(0, 7), 1), horizon = num(i.horizon, 12, 3, 36);
  const items = planItems(db, i), M = months(from, horizon), cal = {}, cls = {}, cyc = {}, abc = {}; let occ = 0, active = 0; const locs = new Set();
  items.forEach((it) => { it.occ = occurrences(it, from, horizon); if (it.occ.length) { active++; locs.add(it.funcloc); } occ += it.occ.length; const c = it.eq_class || "Other";
    it.occ.forEach((d) => { const m = d.slice(0, 7); cal[m] = cal[m] || {}; cal[m][c] = (cal[m][c] || 0) + 1; cls[c] = (cls[c] || 0) + 1; });
    { const c = it.cycle_months, k = c == null ? "Unreadable cycle" : c < 1 ? Math.round(c * 4.345) + " weekly" : c < 12 ? Math.round(c) + " monthly" : c % 12 === 0 ? c / 12 + " yearly" : Math.round(c) + " monthly"; cyc[k] = (cyc[k] || 0) + it.occ.length; } abc[it.abc || "none"] = (abc[it.abc || "none"] || 0) + it.occ.length; });
  const topC = Object.entries(cls).sort((a, b) => b[1] - a[1]).slice(0, 7).map((x) => x[0]);
  const calendar = M.map((m) => { const r = { month: m, total: 0 }; Object.entries(cal[m] || {}).forEach(([c, n]) => { r.total += n; const k = topC.includes(c) ? c : "Other classes"; r[k] = (r[k] || 0) + n; }); return r; });
  const sort = i.sort === "location" ? (a, b) => String(a.funcloc).localeCompare(b.funcloc) : i.sort === "cycle" ? (a, b) => a.cycle_months - b.cycle_months : (a, b) => (a.occ[0] || "9999").localeCompare(b.occ[0] || "9999");
  const shown = (String(i.due) === "0" ? items : items.filter((x) => x.occ.length)).sort(sort), limit = num(i.limit, 25, 1, 100), offset = num(i.offset, 0, 0, 1e6);
  const rows = shown.slice(offset, offset + limit).map((x) => ({ item_no: x.item_no, plan_no: x.plan_no, funcloc: x.funcloc, tag: x.tag, loc_descr: x.loc_descr, eq_class: x.eq_class, criticality: x.criticality, descr: x.descr, abc: x.abc, priority: x.priority, cycle_text: x.cycle_text, cycle_months: x.cycle_months, start_of_cycle: x.start_of_cycle, next_due: x.next_due, occurrences: x.occ }));
  json(res, 200, pay("ws.plan", { ...i, from, horizon }, { items: items.length, items_due: active, occurrences: occ, locations: locs.size, classes: topC.concat(Object.keys(cls).length > topC.length ? ["Other classes"] : []), calendar,
    by_cycle: Object.entries(cyc).filter((x) => x[1]).sort((a, b) => b[1] - a[1]).map(([k, c]) => ({ k, c })), by_abc: Object.entries(abc).filter((x) => x[1]).map(([k, c]) => ({ k, c })), total_rows: shown.length, limit, offset, rows },
    [fig("items_due", "Maintenance items due in the horizon", active, "items"), fig("occurrences", "Task occurrences in the horizon", occ, "tasks", "Estimate"), fig("locations", "Locations with a task in the horizon", locs.size, "locations", "Estimate")],
    ["Mitem & Mplan (table maint_item)", "FuncLoc list"], ["Occurrences are calculated from the start of cycle and the cycle length; the plan file gives no task duration."]));
});
