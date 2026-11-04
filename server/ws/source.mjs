// GET /api/ws/source?sheet=notif|plan|movement|prpo|funcloc|bom (owner: Claude B). Everything one source sheet holds, for the "Source data" pages.
// Per sheet: record count, period, completeness of every field, monthly (and daily for the main date) counts of EVERY date field, breakdowns of every coded field,
// the derived views the case needs (completion time, backlog, cycle workload, demand pattern, lead time, slip, price spread ...), data quality flags, and raw rows (rows=1&offset=&q=).
// Values: PO-Item Amount is read as a unit price (it stays the same on lines of very different quantity); purchase value = PR quantity x unit price, IDR lines only.
import { openDb, json, guard, num, fig, pay, CUTOFF } from "./_lib.mjs";
const cache = {};
const mon = (db, t, c, w = "") => db.prepare(`select substr(${c},1,7) m, count(*) n from ${t} where ${c} is not null and ${c} <> '' ${w} group by 1 order by 1`).all();
const day = (db, t, c) => db.prepare(`select substr(${c},1,10) d, count(*) n from ${t} where ${c} is not null group by 1 order by 1`).all();
const top = (db, t, c, n = 20, w = "") => db.prepare(`select coalesce(${c},'(blank)') k, count(*) n from ${t} ${w ? "where " + w : ""} group by 1 order by 2 desc limit ${n}`).all();
const fill = (db, t, cols) => { const N = db.prepare(`select count(*) n from ${t}`).get().n; return cols.map(([c, l]) => { const r = db.prepare(`select count(${c}) nn, count(distinct ${c}) u from ${t} where ${c} is not null and ${c} <> ''`).get(); return { field: c, label: l, filled: r.nn, share: N ? r.nn / N : 0, distinct: r.u }; }); };
const hist = (vals, edges) => edges.slice(0, -1).map((a, i) => ({ k: edges[i + 1] >= 1e8 ? "over " + a : a + " to " + edges[i + 1], n: vals.filter((v) => v >= a && v < edges[i + 1]).length }));
const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))]; };
const dq = (db, t) => db.prepare("select issue, severity, detail, action from dq_issue where table_name = ?").all(t);
const CLS = "case when instr(funcloc,'-')>0 then substr(funcloc, instr(funcloc,'_')+1, instr(funcloc,'-')-instr(funcloc,'_')-1) else 'SITE' end";
function build(db, s) {
  const o = { sheet: s, cutoff: CUTOFF };
  if (s === "notif") {
    o.title = "Notif History"; o.table = "notification"; o.records = db.prepare("select count(*) n from notification").get().n;
    o.fields = fill(db, "notification", [["notif_date", "Notification date"], ["type", "Notification type"], ["order_no", "Order"], ["priority", "Priority"], ["funcloc", "Functional location"], ["descr", "Description"], ["created_on", "Created on"], ["req_start", "Required start"], ["req_end", "Required end"], ["completed_on", "Completion by date"], ["status", "Status"]]);
    o.dates = [["notif_date", "Notification date"], ["created_on", "Created on"], ["req_start", "Required start"], ["req_end", "Required end"], ["completed_on", "Completion by date"]].map(([c, l]) => ({ field: c, label: l, months: mon(db, "notification", c) }));
    o.daily = { field: "notif_date", label: "Notifications per day", days: day(db, "notification", "notif_date") };
    o.by_month_priority = db.prepare("select substr(notif_date,1,7) m, priority k, count(*) n from notification group by 1,2 order by 1").all();
    o.breakdowns = [["Priority", top(db, "notification", "priority")], ["Notification type", top(db, "notification", "type")], ["Status", top(db, "notification", "status")], ["Equipment class", db.prepare(`select ${CLS} k, count(*) n from notification group by 1 order by 2 desc limit 20`).all()], ["Location criticality", db.prepare("select coalesce(f.criticality,'(blank)') k, count(*) n from notification n left join funcloc f using(funcloc) group by 1 order by 2 desc").all()], ["Most frequent texts", top(db, "notification", "descr", 15)], ["Locations with most notifications", top(db, "notification", "funcloc", 15)]];
    const R = db.prepare("select priority p, status s, notif_date d, req_end e, completed_on c from notification").all(), dd = (a, b) => (Date.parse(b) - Date.parse(a)) / 864e5;
    o.completion = ["Emergency", "High", "Medium", "Low"].map((p) => { const x = R.filter((r) => r.p === p && r.c), d = x.map((r) => dd(r.d, r.c)); return { k: p, n: x.length, median: q(d, 0.5), p90: q(d, 0.9), late_share: x.length ? x.filter((r) => r.e && r.c > r.e).length / x.length : null }; });
    o.completion_hist = hist(R.filter((r) => r.c).map((r) => dd(r.d, r.c)), [0, 7, 14, 30, 60, 90, 180, 365, 1e9]);
    const open = R.filter((r) => r.s !== "Complete"); o.open_age = hist(open.map((r) => dd(r.d, CUTOFF)), [0, 30, 90, 180, 365, 1e9]).map((x) => ({ ...x, k: x.k + " days" }));
    o.open_age_by_priority = ["Emergency", "High", "Medium", "Low"].map((p) => ({ k: p, n: open.filter((r) => r.p === p).length, over_180: open.filter((r) => r.p === p && dd(r.d, CUTOFF) > 180).length }));
    const ms = [...new Set(R.map((r) => r.d.slice(0, 7)))].sort(); o.backlog = ms.map((m) => { const end = m + "-31"; return { m, n: R.filter((r) => r.d <= end && (!r.c || r.c > end)).length }; });
    o.heat = db.prepare(`select ${CLS} cls, coalesce(f.criticality,'-') crit, count(*) n from notification n left join funcloc f using(funcloc) group by 1,2`).all();
    o.parts_on_orders = db.prepare("select n.priority k, count(*) lines, count(distinct v.material_no) parts from movement v join notification n on n.notif_no = v.notif_no group by 1 order by 2 desc").all();
    o.notes = ["The first month of the extract (May 2025) holds the notifications open when the extract started; read it as the opening backlog, not as a trend.", "N2 notifications are exactly the Emergency ones.", "Late = completed after the required end date."];
    o.rows_sql = "select notif_no, notif_date, type, priority, funcloc, descr, req_start, req_end, completed_on, status from notification"; o.rows_q = ["descr", "funcloc", "notif_no"]; o.rows_order = "notif_date desc";
  } else if (s === "plan") {
    o.title = "Mitem Mplan"; o.table = "maint_item"; o.records = db.prepare("select count(*) n from maint_item").get().n;
    o.fields = fill(db, "maint_item", [["funcloc", "Functional location"], ["abc", "ABC indicator"], ["plan_no", "Maintenance plan"], ["item_no", "Maintenance item"], ["descr", "Maintenance item text"], ["priority", "Priority"], ["cycle_text", "Cycle description"], ["start_of_cycle", "Start of cycle"], ["next_due", "Next due (calculated)"]]);
    o.dates = [["start_of_cycle", "Start of cycle"], ["next_due", "Next due after the cut-off (calculated)"]].map(([c, l]) => ({ field: c, label: l, months: mon(db, "maint_item", c) }));
    o.start_by_year = db.prepare("select substr(start_of_cycle,1,4) k, count(*) n from maint_item group by 1 order by 1").all();
    const I = db.prepare("select cycle_months c, start_of_cycle s, abc, descr, funcloc from maint_item where cycle_months > 0 and start_of_cycle is not null").all(), M = []; { let y = 2025, m = 5; for (let k = 0; k < 41; k++) { M.push(y + "-" + String(m).padStart(2, "0")); m++; if (m > 12) { m = 1; y++; } } }
    const occ = {}; I.forEach((it) => { const st = new Date(it.s + "T00:00:00Z"); const step = it.c; for (let k = 0; k < 2000; k++) { const d = new Date(st); d.setUTCMonth(d.getUTCMonth() + Math.round(step * k)); if (step < 1) d.setTime(st.getTime() + k * step * 30.44 * 864e5); const key = d.toISOString().slice(0, 7); if (key > M[M.length - 1]) break; if (key >= M[0]) { const z = occ[key] = occ[key] || { n: 0, S: 0, A: 0, B: 0, C: 0 }; z.n++; z[it.abc] = (z[it.abc] || 0) + 1; } } });
    o.occurrences = M.map((m) => ({ m, ...(occ[m] || { n: 0, S: 0, A: 0, B: 0, C: 0 }) }));
    const lab = (c) => c < 1 ? Math.round(c * 4.345) + " weekly" : c < 12 ? c + " monthly" : c % 12 === 0 ? c / 12 + " yearly" : c + " monthly";
    const cy = {}; db.prepare("select cycle_months c, cycle_text t, count(*) n from maint_item group by 1,2").all().forEach((r) => { const k = r.c == null ? "unreadable" : lab(Math.round(r.c * 100) / 100); const z = cy[k] = cy[k] || { k, months: r.c, n: 0, spellings: [] }; z.n += r.n; z.spellings.push(r.t + " (" + r.n + ")"); });
    o.cycles = Object.values(cy).sort((a, b) => (a.months ?? 1e9) - (b.months ?? 1e9));
    o.per_year = Math.round(I.reduce((t, x) => t + 12 / x.c, 0));
    o.breakdowns = [["Cycle (normalised)", o.cycles.map((c) => ({ k: c.k, n: c.n, sub: c.spellings.join(", ") }))], ["ABC indicator", top(db, "maint_item", "abc")], ["Priority", top(db, "maint_item", "priority")], ["Task text", top(db, "maint_item", "descr", 25)], ["Equipment class", db.prepare(`select ${CLS} k, count(*) n from maint_item group by 1 order by 2 desc limit 20`).all()]];
    o.notes = ["Cycle texts are normalised to one interval each; the original spellings are kept in the breakdown.", "The ABC indicator equals the location criticality on every row.", "Occurrences are counted from the start of cycle in steps of the cycle length."];
    o.rows_sql = "select item_no, plan_no, funcloc, descr, abc, priority, cycle_text, cycle_months, start_of_cycle, next_due from maint_item"; o.rows_q = ["descr", "funcloc", "plan_no"]; o.rows_order = "next_due";
  } else if (s === "movement") {
    o.title = "Movement Material"; o.table = "movement"; o.records = db.prepare("select count(*) n from movement").get().n;
    o.fields = fill(db, "movement", [["posting_date", "Posting date"], ["material_no", "Material number"], ["qty", "Quantity"], ["unit", "Base unit"], ["order_no", "Order"], ["notif_no", "Notification (through the order)"], ["funcloc", "Location (through the notification)"]]);
    o.dates = [{ field: "posting_date", label: "Posting date (issue lines)", months: mon(db, "movement", "posting_date") }];
    o.daily = { field: "posting_date", label: "Issue lines per day", days: day(db, "movement", "posting_date") };
    o.by_unit = db.prepare("select substr(posting_date,1,7) m, unit k, sum(qty) q, count(*) n from movement group by 1,2 order by 1").all();
    o.value = db.prepare("select substr(v.posting_date,1,7) m, sum(v.qty*m.last_unit_price_idr) v, sum(case when m.last_unit_price_idr is null then 1 else 0 end) unpriced from movement v join material m using(material_no) group by 1 order by 1").all();
    o.value_by_crit = db.prepare("select substr(v.posting_date,1,7) m, coalesce(p.crit_max,'-') k, sum(v.qty*m.last_unit_price_idr) v from movement v join material m using(material_no) left join part_profile p using(material_no) group by 1,2 order by 1").all();
    const pat = db.prepare("select demand_class k, count(*) n from part_profile where n_issues > 0 group by 1 order by 2 desc").all(); o.patterns = pat.map((x) => ({ ...x, example: db.prepare("select p.material_no, m.descr from part_profile p join material m using(material_no) where demand_class = ? order by n_issues desc limit 1").get(x.k) }));
    o.months_active = db.prepare("select months_active k, count(*) n from part_profile where n_issues > 0 group by 1 order by 1").all();
    const pv = db.prepare("select v.material_no, m.descr, sum(v.qty*m.last_unit_price_idr) v from movement v join material m using(material_no) group by 1 having v > 0 order by v desc").all(), tot = pv.reduce((t, x) => t + x.v, 0); let c = 0; o.pareto = pv.slice(0, 400).map((x, i) => { c += x.v; return { i: i + 1, material_no: x.material_no, descr: x.descr, v: x.v, cum: c / tot }; }); o.pareto_80 = (() => { let s = 0, n = 0; for (const x of pv) { s += x.v; n++; if (s / tot >= 0.8) break; } return n; })(); o.priced_materials = pv.length;
    o.linked = db.prepare("select coalesce(n.priority,'Not linked') k, count(*) n from movement v left join notification n on n.notif_no = v.notif_no group by 1 order by 2 desc").all();
    o.order_prefix = db.prepare("select substr(order_no,1,4) k, count(*) n, sum(case when notif_no is null then 0 else 1 end) linked from movement group by 1 order by 2 desc").all();
    const BU = db.prepare("select x.material_no, x.iss, coalesce(y.pur,0) pur from (select material_no, sum(qty) iss from movement group by 1) x left join (select material_no, sum(qty) pur from po_line group by 1) y using(material_no)").all();
    o.bought_vs_used = [["Never bought in the period", BU.filter((r) => !r.pur).length], ["Bought less than half of the use", BU.filter((r) => r.pur && r.pur < 0.5 * r.iss).length], ["Bought 0.5 to 2 times the use", BU.filter((r) => r.pur >= 0.5 * r.iss && r.pur <= 2 * r.iss).length], ["Bought more than 2 times the use", BU.filter((r) => r.pur > 2 * r.iss).length]].map(([k, n]) => ({ k, n }));
    o.never_issued = db.prepare("select count(distinct material_no) n from po_line where material_no not in (select material_no from movement)").get().n;
    o.breakdowns = [["Base unit (lines)", top(db, "movement", "unit")], ["Item type (issue lines)", db.prepare("select m.item_type k, count(*) n from movement v join material m using(material_no) group by 1 order by 2 desc limit 20").all()], ["Most issued materials (lines)", db.prepare("select m.descr k, count(*) n from movement v join material m using(material_no) group by v.material_no order by 2 desc limit 15").all()], ["Order type (first digits of the order)", o.order_prefix]];
    o.notes = ["Quantities are never added across units; charts show lines, value in IDR, or quantity per unit.", "Value = quantity x last purchase unit price (PR PO, IDR lines), Estimate.", "Nov 2025 to Jan 2026 is the campaign: about 2.8 times a normal month."];
    o.rows_sql = "select v.posting_date, v.material_no, m.descr, v.qty, v.unit, v.order_no, v.notif_no, v.funcloc from movement v left join material m using(material_no)"; o.rows_q = ["m.descr", "v.material_no", "v.order_no"]; o.rows_order = "v.posting_date desc";
  } else if (s === "prpo") {
    o.title = "PR PO"; o.table = "po_line"; o.records = db.prepare("select count(*) n from po_line").get().n;
    o.fields = fill(db, "po_line", [["pr_type", "PR type"], ["pr_no", "Purchase requisition"], ["pr_date", "PR date"], ["material_no", "PR material"], ["qty", "PR quantity"], ["uom", "PR unit"], ["pr_delivery", "PR delivery date (requested)"], ["purch_group", "Purchasing group"], ["po_no", "Purchase order"], ["supplier", "Supplier"], ["amount", "PO item amount (unit price)"], ["currency", "Currency"], ["po_delivery", "PO delivery date"]]);
    o.dates = [["pr_date", "PR date"], ["pr_delivery", "PR delivery date (requested)"], ["po_delivery", "PO delivery date"]].map(([c, l]) => ({ field: c, label: l, months: mon(db, "po_line", c) }));
    o.daily = { field: "pr_date", label: "PR lines per day", days: day(db, "po_line", "pr_date") };
    o.value = db.prepare("select substr(pr_date,1,7) m, pr_type k, sum(qty*amount) v, count(*) n from po_line where currency='IDR' group by 1,2 order by 1").all();
    o.value_group = db.prepare("select purch_group k, sum(qty*amount) v, count(*) n from po_line where currency='IDR' group by 1 order by 2 desc").all();
    const P = db.prepare("select pr_type t, lead_days l, julianday(po_delivery)-julianday(pr_delivery) s, julianday(pr_delivery)-julianday(pr_date) r from po_line").all();
    o.lead_by_type = [...new Set(P.map((x) => x.t))].sort().map((t) => { const a = P.filter((x) => x.t === t); return { k: t, n: a.length, p10: q(a.map((x) => x.l), 0.1), p50: q(a.map((x) => x.l), 0.5), p90: q(a.map((x) => x.l), 0.9), requested: q(a.map((x) => x.r), 0.5), late_share: a.filter((x) => x.s > 0).length / a.length }; });
    o.lead_hist = hist(P.map((x) => x.l), [-60, 0, 15, 30, 45, 60, 90, 120, 180, 365, 1e9]);
    o.slip_hist = hist(P.map((x) => x.s), [-1e9, -30, -7, 0, 1, 7, 30, 90, 1e9]).map((x, i) => ({ ...x, k: ["30 or more days early", "8 to 30 days early", "1 to 7 days early", "On the date", "1 to 7 days late", "8 to 30 days late", "31 to 90 days late", "Over 90 days late"][i] }));
    o.open_orders = db.prepare("select substr(po_delivery,1,7) m, count(*) n, sum(case when currency='IDR' then qty*amount else 0 end) v from po_line where po_delivery > ? group by 1 order by 1").all(CUTOFF);
    o.price_spread = db.prepare("select p.material_no, m.descr, count(*) n, min(amount) lo, max(amount) hi, avg(amount) av from po_line p left join material m using(material_no) where currency='IDR' and amount > 0 group by 1 having n >= 5 order by hi*1.0/lo desc limit 15").all();
    const S = db.prepare("select supplier k, count(*) n, sum(case when currency='IDR' then qty*amount else 0 end) v from po_line group by 1 order by 2 desc").all(), Sn = S.reduce((t, x) => t + x.n, 0); let cs = 0; o.suppliers = S.map((x, i) => { cs += x.n; return { ...x, rank: i + 1, cum: cs / Sn }; });
    o.breakdowns = [["PR type", top(db, "po_line", "pr_type")], ["Purchasing group", top(db, "po_line", "purch_group")], ["Currency", top(db, "po_line", "currency")], ["Unit", top(db, "po_line", "uom")], ["Data flags", top(db, "po_line", "dq_flag")]];
    o.notes = ["PO-Item Amount is read as a unit price: it stays the same on lines of very different quantity. Purchase value = PR quantity x unit price, IDR lines.", "Lead time = PR date to PO delivery date. Slip = PO delivery date minus PR requested delivery date.", "PO delivery dates after the data cut-off are open orders."];
    o.rows_sql = "select pr_date, pr_type, pr_no, material_no, qty, uom, pr_delivery, purch_group, po_no, supplier, amount, currency, po_delivery, lead_days, dq_flag from po_line"; o.rows_q = ["supplier", "material_no", "po_no", "pr_no"]; o.rows_order = "pr_date desc";
  } else if (s === "funcloc") {
    o.title = "FuncLoc list"; o.table = "funcloc"; o.records = db.prepare("select count(*) n from funcloc").get().n;
    o.fields = fill(db, "funcloc", [["funcloc", "Functional location"], ["descr", "Description"], ["criticality", "Criticality"], ["tag", "Tag"], ["eq_class", "Equipment class (from the tag)"], ["has_bom", "Has a BoM"]]);
    o.dates = [];
    o.breakdowns = [["Criticality", top(db, "funcloc", "criticality")], ["Area", db.prepare("select case when funcloc like 'SITE_%' then 'Site and systems' else substr(funcloc,1,2) end k, count(*) n from funcloc group by 1 order by 2 desc").all()], ["Equipment class", top(db, "funcloc", "eq_class", 30)], ["Level in the hierarchy", top(db, "funcloc", "level")], ["Most frequent descriptions", top(db, "funcloc", "descr", 15)]];
    o.heat = db.prepare("select coalesce(eq_class,'-') cls, coalesce(criticality,'-') crit, count(*) n from funcloc group by 1,2").all();
    o.activity = db.prepare("select coalesce(f.eq_class,'-') k, count(*) n, sum(case when exists(select 1 from notification n where n.funcloc=f.funcloc) then 1 else 0 end) with_notif, sum(case when exists(select 1 from maint_item i where i.funcloc=f.funcloc) then 1 else 0 end) with_plan, sum(f.has_bom) with_bom from funcloc f group by 1 order by 2 desc").all();
    o.notes = ["The FuncLoc list has no date field. The hierarchy is in the tag: PP-1807C-M is the motor of PP-1807C."];
    o.rows_sql = "select funcloc, descr, criticality, eq_class, has_bom from funcloc"; o.rows_q = ["funcloc", "descr"]; o.rows_order = "funcloc";
  } else if (s === "bom") {
    o.title = "BoM (stock, Min, Max)"; o.table = "bom"; o.records = db.prepare("select count(*) n from bom").get().n;
    o.fields = fill(db, "material", [["stock", "Stock"], ["min_qty", "Min"], ["max_qty", "Max"], ["mrp_type", "MRP type"], ["last_unit_price_idr", "Unit price (from PR PO)"]]);
    o.dates = [];
    o.breakdowns = [["Stock position", db.prepare("select case when stock=0 then 'Zero stock' when min_qty>0 and stock<min_qty then 'Below Min' when max_qty>0 and stock>max_qty then 'Above Max' else 'Within Min and Max' end k, count(*) n from material where material_no in (select material_no from bom) group by 1 order by 2 desc").all()], ["MRP type", top(db, "material", "mrp_type", 10, "material_no in (select material_no from bom)")], ["Part criticality", top(db, "part_profile", "crit_max")], ["Item type", top(db, "material", "item_type", 20, "material_no in (select material_no from bom)")]];
    o.stock_value_by_crit = db.prepare("select coalesce(crit_max,'-') k, sum(stock_value_idr) v, sum(excess_value_idr) x, count(*) n from part_profile group by 1 order by 1").all();
    o.notes = ["The BoM has no date field: stock, Min and Max are the position at the data cut-off.", "Stock value = stock x last purchase unit price, Estimate."];
    o.rows_sql = "select b.funcloc, b.material_no, m.descr, b.installed_qty, m.stock, m.min_qty, m.max_qty, m.mrp_type from bom b left join material m using(material_no)"; o.rows_q = ["m.descr", "b.funcloc", "b.material_no"]; o.rows_order = "b.funcloc";
  } else return null;
  o.quality = dq(db, o.table);
  return o;
}
export default guard((req, res) => {
  const u = new URL(req.url, "http://x"), s = u.searchParams.get("sheet") || "notif", db = openDb();
  if (u.searchParams.get("rows")) { const o = cache[s] || (cache[s] = build(db, s)); if (!o) return json(res, 400, { error: "unknown sheet" });
    const qq = (u.searchParams.get("q") || "").slice(0, 60), off = num(u.searchParams.get("offset"), 0, 0, 1e6), lim = num(u.searchParams.get("limit"), 50, 1, 200), w = qq ? " where " + o.rows_q.map((c) => `cast(${c} as text) like ?`).join(" or ") : "", a = qq ? o.rows_q.map(() => "%" + qq + "%") : [];
    const total = db.prepare(`select count(*) n from (${o.rows_sql}${w})`).get(...a).n, rows = db.prepare(`${o.rows_sql}${w} order by ${o.rows_order} limit ${lim} offset ${off}`).all(...a);
    return json(res, 200, { sheet: s, total, offset: off, rows }); }
  const o = cache[s] || (cache[s] = build(db, s)); if (!o) return json(res, 400, { error: "unknown sheet" });
  const { rows_sql, rows_q, rows_order, ...out } = o;
  json(res, 200, pay("ws.source", { sheet: s }, out, [fig("records", "Records in " + o.title, o.records, "rows", "Data")], [o.title], o.notes || []));
});
