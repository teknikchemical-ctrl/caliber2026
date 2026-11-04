// GET /api/data/history : history and prediction timeline for a part, an equipment tag, an equipment class or the whole plant. (owner: Claude A)
//   ?mat=<material>  ?tag=<tag or functional location>  ?cls=<class code>  ?all=1
// History (2025-05 to the cutoff): issued quantity and value, issue lines, notifications and planned tasks on the locations, PO receipts.
// Prediction (12 months): learned model expected quantity with a likely range, engine forecast (p50, and p10 to p90 for one part), planned tasks,
// a campaign-repeat scenario (Assumption: the Dec 2025 and Jan 2026 uplift measured on these parts recurs a year later) and, for one part,
// the stock projection from stock, open PO receipts and expected use, against Min and Max.
import { openDb, hasRes } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
const add = (ym, k) => { let [y, m] = ym.split("-").map(Number); m += k; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return `${y}-${String(m).padStart(2, "0")}`; };
export default guard((req, res) => {
  const q = req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams), db = openDb();
  const H = db.prepare("select distinct month from movement order by 1").all().map((r) => r.month), last = H[H.length - 1], F = Array.from({ length: 12 }, (_, i) => add(last, i + 1)), ALL = [...H, ...F];
  // per-part series: ?parts=m1,m2 (at most 12) gives each part its own history and prediction
  if (q.parts) { const ids = String(q.parts).split(",").map(Number).filter((x) => Number.isSafeInteger(x) && x > 0).slice(0, 12); if (!ids.length) return json(res, 400, { error: "Give one to twelve material numbers" });
    const ph = ids.map(() => "?").join(","), meta = Object.fromEntries(db.prepare(`select material_no, descr, unit, stock, min_qty, max_qty from material where material_no in (${ph})`).all(...ids).map((r) => [r.material_no, r]));
    const hq = {}, ml = {}, lo = {}, hi = {}, en = {};
    for (const r of db.prepare(`select material_no m, month k, qty v from demand_month where material_no in (${ph})`).all(...ids)) (hq[r.m] = hq[r.m] || {})[r.k] = r.v;
    try { for (const r of db.prepare(`select material_no m, month k, expected_qty e, p_issue p, qty_if_issued_low l, qty_if_issued_high h from ml_forecast where material_no in (${ph})`).all(...ids)) { (ml[r.m] = ml[r.m] || {})[r.k] = r.e; const sd = Math.sqrt(Math.max(0, r.p * (1 - r.p) * ((r.l + r.h) / 2) ** 2 + r.p * ((r.h - r.l) / 2.56) ** 2)); (lo[r.m] = lo[r.m] || {})[r.k] = Math.max(0, r.e - 1.28 * sd); (hi[r.m] = hi[r.m] || {})[r.k] = r.e + 1.28 * sd; } } catch {}
    if (hasRes()) try { for (const r of db.prepare(`select material_no m, month k, p50 v from res.forecast where plan_id like 'ai-batch:%' and material_no in (${ph})`).all(...ids)) (en[r.m] = en[r.m] || {})[r.k] = r.v; } catch {}
    const rr = (o, ms, z) => ms.map((m) => (o && o[m] != null ? Math.round(o[m] * 100) / 100 : z ? 0 : null));
    return json(res, 200, { cutoff: last, months: H, future: F, series: ids.filter((i) => meta[i]).map((i) => ({ material_no: i, descr: meta[i].descr, unit: meta[i].unit, stock: meta[i].stock, min_qty: meta[i].min_qty, max_qty: meta[i].max_qty, history: rr(hq[i], H, 1), learned: rr(ml[i], F, 1), learned_low: rr(lo[i], F, 1), learned_high: rr(hi[i], F, 1), engine: rr(en[i], F, 0) })) }); }
  let scope, mats, locs, label;
  if (q.mat) { const m = db.prepare("select material_no, descr, unit, stock, min_qty, max_qty from material where material_no=?").get(Number(q.mat)); if (!m) return json(res, 404, { error: "Not in baseline data: material " + q.mat });
    scope = "part"; label = m.descr; mats = [m.material_no]; locs = db.prepare("select distinct funcloc from part_equipment where material_no=?").all(m.material_no).map((r) => r.funcloc); scope = { kind: "part", ...m }; }
  else if (q.tag) { const t = String(q.tag).toUpperCase().replace(/^PX_/, ""), f = db.prepare("select funcloc, tag, descr, eq_class from funcloc where tag=? or funcloc=? limit 1").get(t, "PX_" + t); if (!f) return json(res, 404, { error: "Not in baseline data: equipment " + t });
    locs = db.prepare("select funcloc from funcloc where funcloc=? or funcloc like ?").all(f.funcloc, f.funcloc + "-%").map((r) => r.funcloc); label = f.tag + " " + f.descr; scope = { kind: "equipment", tag: f.tag, descr: f.descr, eq_class: f.eq_class, locations: locs.length }; }
  else if (q.cls) { const c = String(q.cls).toUpperCase(), n = db.prepare("select eq_class_name n from funcloc where eq_class=? limit 1").get(c); if (!n) return json(res, 404, { error: "Not in baseline data: class " + c });
    locs = db.prepare("select funcloc from funcloc where eq_class=?").all(c).map((r) => r.funcloc); label = n.n; scope = { kind: "class", eq_class: c, name: n.n, locations: locs.length }; }
  else { scope = { kind: "plant" }; label = "Whole plant"; locs = null; }
  if (!mats) mats = locs ? [...new Set(db.prepare(`select material_no from part_equipment where funcloc in (${locs.map(() => "?").join(",") || "''"})`).all(...locs).map((r) => r.material_no))] : null;
  const inM = (col) => (mats ? `${col} in (${mats.map(() => "?").join(",") || "0"})` : "1=1"), inL = (col) => (locs ? `${col} in (${locs.map(() => "?").join(",") || "''"})` : "1=1"), aM = mats || [], aL = locs || [];
  const byMonth = (rows, k = "v") => Object.fromEntries(rows.map((r) => [r.m, r[k]]));
  const iss = db.prepare(`select d.month m, sum(d.qty) q, sum(d.n_issues) n, sum(d.qty*coalesce(p.last_unit_price_idr,0)) v from demand_month d join material p using(material_no) where ${inM("d.material_no")} group by 1`).all(...aM);
  const qty = byMonth(iss, "q"), lines = byMonth(iss, "n"), val = byMonth(iss, "v");
  const notif = byMonth(db.prepare(`select substr(notif_date,1,7) m, count(*) v from notification where ${inL("funcloc")} group by 1`).all(...aL));
  const rec = byMonth(db.prepare(`select substr(po_delivery,1,7) m, sum(qty) v from po_line where po_delivery is not null and ${inM("material_no")} group by 1`).all(...aM));
  // planned tasks per month on the locations (start of cycle plus whole cycles)
  const plan = Object.fromEntries(ALL.map((m) => [m, 0]));
  for (const r of db.prepare(`select start_of_cycle s, cast(cycle_months as integer) c from maint_item where cycle_months>=1 and start_of_cycle is not null and ${inL("funcloc")}`).all(...aL)) {
    let m = r.s.slice(0, 7); if (m < ALL[0]) { const [y0, m0] = m.split("-").map(Number), [y1, m1] = ALL[0].split("-").map(Number), gap = (y1 - y0) * 12 + (m1 - m0); m = add(m, Math.ceil(gap / r.c) * r.c); }
    while (m <= ALL[ALL.length - 1]) { if (m in plan) plan[m]++; m = add(m, r.c); } }
  // learned model: expected and likely range (normal approximation of the sum of the part distributions)
  let mlE = {}, mlLo = {}, mlHi = {}; const hasMl = !!db.prepare("select 1 from sqlite_master where name='ml_forecast'").get();
  if (hasMl) for (const r of db.prepare(`select month m, sum(expected_qty) e, sum(p_issue*(1-p_issue)*((qty_if_issued_low+qty_if_issued_high)/2)*((qty_if_issued_low+qty_if_issued_high)/2) + p_issue*((qty_if_issued_high-qty_if_issued_low)/2.56)*((qty_if_issued_high-qty_if_issued_low)/2.56)) var from ml_forecast where ${inM("material_no")} group by 1`).all(...aM)) {
    const sd = Math.sqrt(Math.max(0, r.var)); mlE[r.m] = r.e; mlLo[r.m] = Math.max(0, r.e - 1.28 * sd); mlHi[r.m] = r.e + 1.28 * sd; }
  let eng = {}, engLo = {}, engHi = {};
  if (hasRes()) try { for (const r of db.prepare(`select month m, sum(p50) e, sum(p10) l, sum(p90) h from res.forecast where plan_id like 'ai-batch:%' and ${inM("material_no")} group by 1`).all(...aM)) { eng[r.m] = r.e; engLo[r.m] = r.l; engHi[r.m] = r.h; } } catch { eng = {}; }
  // campaign-repeat scenario: uplift of these parts in Dec 2025 and Jan 2026 against their other months, applied to Dec 2026 and Jan 2027
  const camp = ["2025-12", "2026-01"], other = H.filter((m) => !camp.includes(m)), mean = (ms) => ms.reduce((s, m) => s + (qty[m] || 0), 0) / ms.length;
  const uplift = mean(other) > 0 ? Math.min(5, Math.max(1, mean(camp) / mean(other))) : 1, campAhead = F.filter((m) => /-(12|01)$/.test(m));
  const scen = Object.fromEntries(F.map((m) => [m, (mlE[m] || 0) * (campAhead.includes(m) ? uplift : 1)]));
  // stock projection for one part
  let stock = null;
  if (scope.kind === "part") { let s = scope.stock || 0; const open = byMonth(db.prepare("select substr(po_delivery,1,7) m, sum(qty) v from po_line where material_no=? and po_delivery>? group by 1").all(scope.material_no, last + "-31"));
    stock = F.map((m) => { s = s + (open[m] || 0) - (mlE[m] || 0); return Math.round(s * 10) / 10; }); }
  const z0 = (o, ms) => ms.map((m) => Math.round((o[m] || 0) * 100) / 100);
  const plist = (() => { const qq = String(q.q || "").trim().toUpperCase(), lim = Math.min(400, Number(q.limit) || 200);
    const rows = db.prepare(`select m.material_no, m.descr, m.unit, coalesce(p.total_qty,0) q17, (select coalesce(sum(qty),0) from demand_month d where d.material_no=m.material_no and d.month>?) q12, (select coalesce(sum(expected_qty),0) from ml_forecast f where f.material_no=m.material_no) f12 from material m left join part_profile p using(material_no) where ${inM("m.material_no")} ${qq ? "and (upper(m.descr) like ? or cast(m.material_no as text) like ?)" : ""} order by f12 desc, q17 desc limit ${lim}`).all(H[H.length - 13] || H[0], ...aM, ...(qq ? ["%" + qq + "%", qq + "%"] : []));
    return rows.map((r) => ({ material_no: r.material_no, descr: r.descr, unit: r.unit, issued_12m: r.q12, forecast_12m: Math.round(r.f12 * 10) / 10 })); })();
  const r0 = (o, ms) => ms.map((m) => (o[m] == null ? null : Math.round(o[m] * 100) / 100));
  const sum = (o, ms) => ms.reduce((t, m) => t + (o[m] || 0), 0);
  const out = { scope, label, parts: mats ? mats.length : db.prepare("select count(*) n from material").get().n, cutoff: last, history: { months: H, qty: z0(qty, H), lines: z0(lines, H), value: z0(val, H), notifications: z0(notif, H), planned: H.map((m) => plan[m]), receipts: z0(rec, H) },
    prediction: { months: F, learned: r0(mlE, F), learned_low: r0(mlLo, F), learned_high: r0(mlHi, F), engine: r0(eng, F), engine_low: scope.kind === "part" ? r0(engLo, F) : null, engine_high: scope.kind === "part" ? r0(engHi, F) : null, planned: F.map((m) => plan[m]), campaign_scenario: r0(scen, F), campaign_uplift: Math.round(uplift * 100) / 100, stock },
    part_list: plist,
    min_qty: scope.kind === "part" ? scope.min_qty : null, max_qty: scope.kind === "part" ? scope.max_qty : null,
    totals: { history_12m: sum(qty, H.slice(-12)), history_17m: sum(qty, H), learned_12m: sum(mlE, F), engine_12m: sum(eng, F), scenario_12m: sum(scen, F), planned_12m: F.reduce((t, m) => t + plan[m], 0), notifications_17m: sum(notif, H) },
    basis: "History is Data. Learned and engine forecasts are Estimates. The campaign scenario is an Assumption: the measured Dec 2025 and Jan 2026 uplift recurs a year later." };
  json(res, 200, out);
});
