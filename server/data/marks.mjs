// GET /api/data/marks : every dated record in the case as one compact event set, for the symbols on every timeline and chart (owner: Claude A).
// One row per event, not per day: part issues (movement), notifications, purchase requests, PO receipts and PO lines still due, planned maintenance
// occurrences, the Optimized Scenario's recommended orders and the campaign months. Each row carries the exact date, the part number, the location,
// the quantity and the value, so a symbol can be selected and read. The page filters the set by scope (whole plant, equipment set, criticality,
// equipment class, part) without another request. Built once per server instance and cached.
// Shape: {v, from, cutoff, K:[kinds], S:[[tag,name]], U:[suppliers], F:[[location,descr,crit,class,setmask]], M:{part:[descr,unit,crit,price,setmask,classes,[F index]]},
//         E:[[day from `from`, kind index, part or 0, F index or -1, qty, value IDR, T index, ref: work order or notification for an issue, notification no, PR/PO, maintenance item]], T:[texts], counts:{kind:n}}
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
import { golden } from "./golden.mjs";
let CACHE = null;
export function marks(db) {
  if (CACHE) return CACHE;
  const FROM = "2025-05-01", TO = "2027-09-30", d0 = Date.parse(FROM + "T00:00:00Z"), day = (s) => Math.round((Date.parse(String(s).slice(0, 10) + "T00:00:00Z") - d0) / 864e5);
  const cutoff = db.prepare("select max(posting_date) d from movement").get().d;
  const K = ["issue", "notification", "po_raised", "receipt", "po_due", "plan", "recommended_order", "campaign"], KI = Object.fromEntries(K.map((k, i) => [k, i]));
  const has = (t) => !!db.prepare("select 1 from sqlite_master where name=?").get(t), sets = has("equipment_set") ? db.prepare("select tag, name, funcloc from equipment_set order by set_no").all() : [];
  const setOf = (fl) => { let m = 0; sets.forEach((s, i) => { if (fl === s.funcloc || String(fl).startsWith(s.funcloc + "-")) m |= 1 << i; }); return m; };
  // locations
  const F = [], FI = new Map(), floc = new Map(db.prepare("select funcloc, descr, criticality c, eq_class k from funcloc").all().map((r) => [r.funcloc, r]));
  const fidx = (fl) => { if (!fl) return -1; if (FI.has(fl)) return FI.get(fl); const r = floc.get(fl) || {}; FI.set(fl, F.length); F.push([String(fl).replace(/^PX_/, ""), String(r.descr || "").slice(0, 48), r.c || null, r.k || null, setOf(fl)]); return F.length - 1; };
  // parts
  const M = {}, part = new Map(db.prepare("select m.material_no n, m.descr d, m.unit u, coalesce(p.crit_max,'C') c, coalesce(nullif(p.unit_price_idr,0), nullif(m.last_unit_price_idr,0)) pr from material m left join part_profile p using(material_no)").all().map((r) => [r.n, r]));
  const inst = new Map(); for (const r of db.prepare("select e.material_no n, e.funcloc f, f.eq_class k from part_equipment e left join funcloc f using(funcloc)").all()) { if (!inst.has(r.n)) inst.set(r.n, []); inst.get(r.n).push(r); }
  const mref = (n) => { if (!n) return 0; if (!M[n]) { const r = part.get(n) || {}, L = inst.get(n) || []; let sm = 0; L.forEach((x) => { sm |= setOf(x.f); }); M[n] = [String(r.d || "").slice(0, 60), r.u || "", r.c || "C", r.pr || 0, sm, [...new Set(L.map((x) => x.k).filter(Boolean))].slice(0, 4).join(","), L.slice(0, 12).map((x) => fidx(x.f))]; } return n; };
  const T = [""], TI = new Map([["", 0]]), txt = (t) => { t = String(t || ""); if (!TI.has(t)) { TI.set(t, T.length); T.push(t); } return TI.get(t); };
  const price = (n) => (part.get(n) || {}).pr || 0, E = [], push = (d, k, n, fl, q, v, t, ref) => { const x = day(d); if (!(x >= 0) || d > TO) return; E.push([x, KI[k], mref(n), fidx(fl), q ?? 0, v ? Math.round(v) : 0, txt(t), ref || 0]); };
  for (const r of db.prepare("select posting_date d, material_no n, qty q, funcloc f, order_no o, notif_no nn from movement").all()) push(r.d, "issue", r.n, r.f, r.q, r.q * price(r.n), "", r.o || r.nn || 0);
  for (const r of db.prepare("select notif_date d, notif_no n, priority p, descr t, funcloc f, status s, completed_on c from notification").all()) push(r.d, "notification", 0, r.f, null, 0, (r.p || "") + "|" + (r.t || "") + "|" + (r.s || "") + (r.c ? " " + r.c : ""), r.n);
  const U = [], UI = new Map(), sup = (s) => { if (!s) return ""; if (!UI.has(s)) { UI.set(s, U.length); U.push(s); } return "s" + UI.get(s); };
  const POL = has("po_line_unique") ? "select pr_date d, pr_no p, po_no po, po_delivery due, material_no n, qty q, value_idr v, supplier s, lead_days l from po_line_unique" : "select pr_date d, pr_no p, po_no po, po_delivery due, material_no n, qty q, qty * coalesce(unit_price, amount) v, supplier s, lead_days l from po_line group by pr_no, pr_item, po_no, po_item, material_no, qty, pr_date, po_delivery";
  for (const r of db.prepare(POL).all()) {
    push(r.d, "po_raised", r.n, null, r.q, r.v, sup(r.s) + (r.l != null ? "|" + Math.round(r.l) + " days" : ""), r.po ? r.p + "/" + r.po : r.p);
    if (r.due) push(r.due, r.due <= cutoff ? "receipt" : "po_due", r.n, null, r.q, r.v, sup(r.s), r.po ? r.p + "/" + r.po : r.p);
  }
  for (const r of db.prepare("select item_no i, funcloc f, descr t, cycle_months c, next_due d from maint_item where next_due is not null and next_due <= ?").all(TO)) {
    let t = Date.parse(r.d + "T00:00:00Z"), k = 0; const step = r.c > 0 ? r.c * 30.44 * 864e5 : 0;
    while (k++ < 13 && t <= Date.parse(TO + "T00:00:00Z")) { push(new Date(t).toISOString().slice(0, 10), "plan", 0, r.f, null, 0, (r.t || "") + (r.c ? "|every " + (r.c >= 1 ? Math.round(r.c) + " months" : Math.round(r.c * 30.44) + " days") : ""), r.i); if (!step) break; t += step; }
  }
  try { const g = golden(db, { limit: 5000 }); for (const o of g.orders) push(o.order_date || o.month + "-01", "recommended_order", o.material_no, null, o.qty, o.value_idr, "arrives " + (o.arrives || ""), o.decision || ""); for (const m of g.history.campaign_months || []) push(m + "-01", "campaign", 0, null, null, 0, "Campaign month: issues at least 1.5 times the median month", ""); } catch { }
  let ahead = []; try { ahead = JSON.parse(db.prepare("select value from ml_model where key='campaign_months_ahead'").get().value) || []; } catch { }
  for (const m of ahead) push(m + "-01", "campaign", 0, null, null, 0, "Campaign month expected by the model (Estimate)", "");
  E.sort((a, b) => a[0] - b[0]);
  const counts = Object.fromEntries(K.map((k) => [k, 0])); E.forEach((e) => counts[K[e[1]]]++);
  CACHE = { v: 1, from: FROM, to: TO, cutoff, K, S: sets.map((s) => [s.tag, s.name]), U, T, F, M, E, counts };
  return CACHE;
}
export default guard((req, res) => { const db = openDb(); res.setHeader("Cache-Control", "public, max-age=600, s-maxage=86400"); json(res, 200, marks(db)); });
