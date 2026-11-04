// GET /api/data/events : every dated event for a part, equipment, class or the plant, for the draggable timelines. (owner: Claude A)
// ?mat= | ?tag= | ?set= | ?cls= | ?all=1, optional from=YYYY-MM to=YYYY-MM, limit (default 2000).
// Kinds: issue, notification (priority), planned, pr, po_due, receipt, recommended_order, campaign. Every event carries date, kind, text, crit, value_idr, qty, unit, material_no, funcloc
// (null where it does not apply; the whole plant is aggregated per day, so material_no and funcloc are null there). Contract: spi/contracts/events.schema.json.
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
import { golden } from "./golden.mjs";
export function events(db, q = {}) {
  const lim = Math.min(5000, Number(q.limit) > 0 ? Math.floor(Number(q.limit)) : 2000), from = q.from || "2025-05", to = q.to || "2027-09";
  let locs = null, mats = null;
  if (q.set && !q.tag) { const t = String(q.set).toUpperCase().replace(/^PX_/, ""), st = db.prepare("select funcloc from equipment_set where tag=? or funcloc=?").get(t, "PX_" + t); q = { ...q, tag: (st ? st.funcloc : "PX_" + t).replace(/^PX_/, "") }; }
  if (q.mat) { mats = [Number(q.mat)]; locs = db.prepare("select funcloc from part_equipment where material_no=?").all(Number(q.mat)).map((r) => r.funcloc); }
  else if (q.tag) { const t = String(q.tag).toUpperCase().replace(/^PX_/, ""); locs = db.prepare("select funcloc from funcloc where funcloc=? or funcloc like ?").all("PX_" + t, "PX_" + t + "-%").map((r) => r.funcloc); mats = db.prepare(`select distinct material_no from part_equipment where funcloc in (${locs.map(() => "?").join(",") || "''"})`).all(...locs).map((r) => r.material_no); }
  else if (q.cls) { locs = db.prepare("select funcloc from funcloc where eq_class=?").all(String(q.cls).toUpperCase()).map((r) => r.funcloc); mats = null; }
  const inM = (c) => (mats ? `${c} in (${mats.map(() => "?").join(",") || "0"})` : q.cls ? `${c} in (select material_no from part_equipment e join funcloc f using(funcloc) where f.eq_class='${String(q.cls).toUpperCase().replace(/[^A-Z]/g, "")}')` : "1=1"), aM = mats || [];
  const inL = (c) => (locs ? `${c} in (${locs.map(() => "?").join(",") || "''"})` : "1=1"), aL = locs || [];
  const ev = [], g0 = db.prepare("select max(posting_date) d from movement").get().d;
  const big = !mats && !locs;  // whole plant: aggregate per day to keep the payload small
  if (big) {
    for (const r of db.prepare("select v.posting_date d, count(*) n, sum(v.qty) q, sum(v.qty*coalesce(p.unit_price_idr,m.last_unit_price_idr,0)) a from movement v join material m using(material_no) left join part_profile p using(material_no) where substr(v.posting_date,1,7) between ? and ? group by 1").all(from, to)) ev.push({ date: r.d, kind: "issue", n: r.n, qty: r.q, value_idr: Math.round(r.a || 0), text: r.n + " issue lines" });
    for (const r of db.prepare("select notif_date d, count(*) n, sum(priority in ('High','Very High')) h from notification where substr(notif_date,1,7) between ? and ? group by 1").all(from, to)) ev.push({ date: r.d, kind: "notification", n: r.n, priority: r.h ? "High" : null, text: r.n + " notifications" + (r.h ? ", " + r.h + " high priority" : "") });
    for (const r of db.prepare("select pr_date d, count(*) n, sum(qty*coalesce(unit_price,amount,0)) a from po_line_unique where substr(pr_date,1,7) between ? and ? group by 1").all(from, to)) ev.push({ date: r.d, kind: "pr", n: r.n, value_idr: Math.round(r.a || 0), text: r.n + " purchase lines raised" });
  } else {
    for (const r of db.prepare(`select v.posting_date d, v.material_no m, v.qty q, v.funcloc f, v.order_no o from movement v where ${inM("v.material_no")} and substr(v.posting_date,1,7) between ? and ? order by 1 limit ${lim}`).all(...aM, from, to)) ev.push({ date: r.d, kind: "issue", material_no: r.m, qty: r.q, funcloc: r.f, text: "Issued " + r.q + " of " + r.m + (r.f ? " for " + String(r.f).replace(/^PX_/, "") : "") });
    if (locs) for (const r of db.prepare(`select notif_date d, notif_no n, priority p, descr t, funcloc f, status s from notification where ${inL("funcloc")} and substr(notif_date,1,7) between ? and ? order by 1 limit ${lim}`).all(...aL, from, to)) ev.push({ date: r.d, kind: "notification", id: r.n, priority: r.p, funcloc: r.f, text: String(r.f).replace(/^PX_/, "") + ": " + r.t + " (" + r.p + ", " + String(r.s).toLowerCase() + ")" });
    for (const r of db.prepare(`select pr_date d, po_delivery due, material_no m, qty q, supplier s, po_no po, qty*coalesce(unit_price,amount) a from po_line_unique where ${inM("material_no")} and substr(pr_date,1,7) between ? and ? order by 1 limit ${lim}`).all(...aM, from, to)) { ev.push({ date: r.d, kind: "pr", material_no: r.m, qty: r.q, value_idr: r.a || null, text: "Requested " + r.q + " of " + r.m + (r.s ? " from " + r.s : "") }); if (r.due && r.due > g0) ev.push({ date: r.due, kind: "po_due", material_no: r.m, qty: r.q, value_idr: r.a || null, text: "PO " + (r.po || "") + " due: " + r.q + " of " + r.m }); }
    if (locs) for (const r of db.prepare(`select funcloc f, descr t, start_of_cycle s, cast(cycle_months as integer) c from maint_item where ${inL("funcloc")} and cycle_months>=1`).all(...aL)) { let [y, m] = r.s.slice(0, 7).split("-").map(Number), k = 0; while (k++ < 400) { const ym = `${y}-${String(m).padStart(2, "0")}`; if (ym > to) break; if (ym >= from) ev.push({ date: ym + "-01", kind: "planned", funcloc: r.f, text: String(r.f).replace(/^PX_/, "") + ": " + r.t }); m += r.c; while (m > 12) { m -= 12; y++; } } }
  }
  const g = golden(db, q.mat ? { mat: q.mat } : q.tag ? { tag: q.tag } : q.cls ? { cls: q.cls } : {});
  for (const o of g.orders.slice(0, 600)) ev.push({ date: o.order_date || o.month + "-01", kind: "recommended_order", material_no: o.material_no, qty: o.qty, unit: o.unit, crit: o.crit, value_idr: o.value_idr, value: o.value, text: "Recommended order: " + o.qty + " " + (o.unit || "") + " of " + o.material_no + " (" + o.crit + "), arrives " + o.arrives });
  // receipts: PO lines delivered up to the cutoff (Assumption: received on the delivery date)
  for (const r of db.prepare(`select po_delivery d, material_no m, qty q, qty*coalesce(unit_price,amount) a, po_no po from po_line_unique where ${inM("material_no")} and po_delivery <= ? and substr(po_delivery,1,7) between ? and ? ${big ? "" : "order by 1 limit " + lim}`).all(...aM, g.cutoff + "-31", from, to)) { if (big) continue; ev.push({ date: r.d, kind: "receipt", material_no: r.m, qty: r.q, value_idr: r.a || null, text: "Received " + r.q + " of " + r.m + " on PO " + (r.po || "") }); }
  if (big) for (const r of db.prepare("select po_delivery d, count(*) n, sum(qty*coalesce(unit_price,amount,0)) a from po_line_unique where po_delivery > ? and substr(po_delivery,1,7) between ? and ? group by 1").all(g0, from, to)) ev.push({ date: r.d, kind: "po_due", n: r.n, value_idr: Math.round(r.a || 0), text: r.n + " PO lines due" });
  if (big) for (const r of db.prepare("select po_delivery d, count(*) n, sum(qty*coalesce(unit_price,amount,0)) a from po_line_unique where po_delivery <= ? and substr(po_delivery,1,7) between ? and ? group by 1").all(g.cutoff + "-31", from, to)) ev.push({ date: r.d, kind: "receipt", n: r.n, value_idr: Math.round(r.a || 0), text: r.n + " PO lines received" });
  // campaign months: history (issues at least 1.5 times the median month) and the months the model expects ahead
  let ahead = []; try { ahead = JSON.parse(db.prepare("select value from ml_model where key='campaign_months_ahead'").get().value) || []; } catch { }
  for (const m of g.history.campaign_months) if (m >= from && m <= to) ev.push({ date: m + "-01", kind: "campaign", text: "Campaign month: issues at least 1.5 times the median month (Data)" });
  for (const m of ahead) if (m >= from && m <= to) ev.push({ date: m + "-01", kind: "campaign", text: "Campaign month expected by the model (Estimate)" });
  // the same fields on every event
  const info = new Map(db.prepare("select m.material_no, m.unit, coalesce(p.unit_price_idr, m.last_unit_price_idr) price, coalesce(p.crit_max,'C') crit from material m left join part_profile p using(material_no)").all().map((r) => [r.material_no, r]));
  const fcrit = new Map(db.prepare("select funcloc, criticality from funcloc").all().map((r) => [r.funcloc, r.criticality]));
  for (const e of ev) { const i = e.material_no ? info.get(e.material_no) : null; e.material_no = e.material_no ?? null; e.funcloc = e.funcloc ?? null; e.qty = e.qty ?? null; e.unit = e.unit ?? (i ? i.unit : null);
    e.crit = e.crit ?? (i ? i.crit : e.funcloc ? fcrit.get(e.funcloc) || null : null); if (e.value_idr === undefined) e.value_idr = i && i.price && e.qty != null ? Math.round(e.qty * i.price) : null; }
  ev.sort((a, b) => a.date.localeCompare(b.date));
  const counts = ev.reduce((c, e) => ((c[e.kind] = (c[e.kind] || 0) + 1), c), {});
  return { from, to, cutoff: g.cutoff, counts, events: ev.slice(0, lim), truncated: ev.length > lim };
}
export default guard((req, res) => { const q = req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams); json(res, 200, events(openDb(), q)); });
