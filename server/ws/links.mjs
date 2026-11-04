// GET /api/ws/links (owner: Claude B). Link map between parts, functional locations and equipment, from the bill of materials (BoM) and the other part links.
//   ?mat=<material>  the part in the centre, the equipment that use it on the first ring, the functional locations (sub-items) of each equipment on the second ring.
//   ?loc=<funcloc>   the location in the centre, its parts on the first ring, and the other equipment that share those parts on the second ring.
// Equipment = the main tag of a location: a sub-item such as PP-148A-M (motor) or PP-148A-CSS belongs to PP-148A when that location exists.
// Answer: {center, nodes:[{id,kind,label,sub,crit,ring,parent,qty,weight}], edges:[{from,to,qty,label}], totals, truncated}.
import { openDb, json, fail, guard, body, num, fig, pay, CUTOFF } from "./_lib.mjs";
const parentOf = (fl, exists) => { let f = fl; for (let k = 0; k < 3; k++) { const m = /^(.*)-[A-Z]+\d*$/.exec(f); if (!m) break; if (exists(m[1])) return m[1]; f = m[1]; } return fl; };
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), maxEq = num(i.max, 18, 4, 60);
  const has = (() => { const st = db.prepare("select 1 from funcloc where funcloc = ?"); const c = new Map(); return (f) => { if (!c.has(f)) c.set(f, !!st.get(f)); return c.get(f); }; })();
  const notif = db.prepare("select count(*) c from notification where funcloc = ? and notif_date > date(?, '-12 months')");
  if (i.mat) {
    const mat = Number(i.mat), p = db.prepare("select t.material_no, t.descr, t.unit, p.crit_max, p.stock, p.min_qty, p.max_qty, p.total_qty, p.installed_total, p.n_funcloc from material t left join part_profile p using(material_no) where t.material_no = ?").get(mat);
    if (!p) return fail(res, 404, "This part is not in the baseline data.");
    const rows = db.prepare("select b.funcloc, b.installed_qty q, f.tag, f.descr, f.criticality c, f.eq_class from bom b join funcloc f using(funcloc) where b.material_no = ?").all(mat);
    const other = db.prepare("select pe.funcloc, pe.source, f.tag, f.descr, f.criticality c, f.eq_class from part_equipment pe join funcloc f using(funcloc) where pe.material_no = ? and pe.source != 'bom' limit 40").all(mat);
    const E = {}; rows.forEach((r) => { const e = parentOf(r.funcloc, has); const x = E[e] = E[e] || { funcloc: e, locs: [], qty: 0 }; x.locs.push(r); x.qty += r.q || 0; });
    const rank = { S: 0, A: 1, B: 2, C: 3 }; let eq = Object.values(E).map((x) => { const f = db.prepare("select tag, descr, criticality c, eq_class, eq_class_name from funcloc where funcloc = ?").get(x.funcloc) || {}; return { ...x, ...f, notif: notif.get(x.funcloc, CUTOFF).c }; });
    eq.sort((a, b) => (rank[a.c] ?? 4) - (rank[b.c] ?? 4) || b.qty - a.qty); const shown = eq.slice(0, maxEq);
    const nodes = [{ id: "p:" + mat, kind: "part", label: String(mat), sub: p.descr, crit: p.crit_max, ring: 0 }], edges = [];
    shown.forEach((e) => { nodes.push({ id: "e:" + e.funcloc, kind: "equipment", label: e.tag || e.funcloc, sub: e.descr, crit: e.c, ring: 1, funcloc: e.funcloc, qty: e.qty, notif: e.notif, cls: e.eq_class });
      edges.push({ from: "p:" + mat, to: "e:" + e.funcloc, qty: e.qty });
      e.locs.filter((l) => l.funcloc !== e.funcloc).slice(0, 4).forEach((l) => { nodes.push({ id: "l:" + l.funcloc, kind: "location", label: l.tag || l.funcloc, sub: l.descr, crit: l.c, ring: 2, parent: "e:" + e.funcloc, funcloc: l.funcloc, qty: l.q, cls: l.eq_class }); edges.push({ from: "e:" + e.funcloc, to: "l:" + l.funcloc, qty: l.q }); }); });
    const byCrit = ["S", "A", "B", "C"].map((c) => ({ k: c, equipment: eq.filter((e) => e.c === c).length }));
    return json(res, 200, pay("ws.links", { mat }, { mode: "part", center: p, nodes, edges, totals: { equipment: eq.length, locations: rows.length, installed: rows.reduce((s, r) => s + (r.q || 0), 0), other_links: other.length, by_crit: byCrit }, truncated: eq.length - shown.length, equipment: eq.map((e) => ({ funcloc: e.funcloc, tag: e.tag, descr: e.descr, crit: e.c, cls: e.eq_class, installed: e.qty, locations: e.locs.length, notifications_12m: e.notif })), other_links: other },
      [fig("equipment", "Equipment that use the part", eq.length, "equipment"), fig("locations", "Functional locations in the bill of materials", rows.length, "locations"), fig("installed", "Installed quantity", rows.reduce((s, r) => s + (r.q || 0), 0), p.unit)],
      ["BoM (table bom)", "FuncLoc list", "part_equipment (links by drawing text and orders)", "Notif History"], ["A sub-item (motor, switch station, foundation, burner) is drawn under its main equipment."]));
  }
  if (i.loc) {
    const fl = String(i.loc), L = db.prepare("select funcloc, tag, descr, criticality c, eq_class, eq_class_name from funcloc where funcloc = ?").get(fl);
    if (!L) return fail(res, 404, "This location is not in the baseline data.");
    const kids = db.prepare("select funcloc from funcloc where funcloc like ? and funcloc != ?").all(fl + "-%", fl).map((r) => r.funcloc).filter((f) => parentOf(f, has) === fl);
    const scope = [fl, ...kids], ph = scope.map(() => "?").join(",");
    const parts = db.prepare(`select b.material_no, sum(b.installed_qty) q, t.descr, p.crit_max, p.stock, p.min_qty, p.max_qty, p.n_funcloc from bom b join material t using(material_no) left join part_profile p using(material_no) where b.funcloc in (${ph}) group by b.material_no order by p.n_funcloc desc`).all(...scope);
    const maxP = num(i.max, 24, 4, 60), shownP = parts.slice(0, maxP), share = {};
    if (shownP.length) { const mp = shownP.map((x) => x.material_no); db.prepare(`select b.material_no, b.funcloc from bom b where b.material_no in (${mp.map(() => "?").join(",")})`).all(...mp).forEach((r) => { const e = parentOf(r.funcloc, has); if (e === fl) return; (share[e] = share[e] || new Set()).add(r.material_no); }); }
    const top = Object.entries(share).map(([e, s]) => ({ funcloc: e, parts: [...s] })).sort((a, b) => b.parts.length - a.parts.length).slice(0, num(i.peers, 10, 3, 30)).map((x) => ({ ...x, ...(db.prepare("select tag, descr, criticality c, eq_class from funcloc where funcloc = ?").get(x.funcloc) || {}) }));
    const nodes = [{ id: "e:" + fl, kind: "equipment", label: L.tag || fl, sub: L.descr, crit: L.c, ring: 0, funcloc: fl }], edges = [];
    shownP.forEach((x) => { nodes.push({ id: "p:" + x.material_no, kind: "part", label: String(x.material_no), sub: x.descr, crit: x.crit_max, ring: 1, qty: x.q, stock: x.stock, min: x.min_qty, max: x.max_qty, shared: (x.n_funcloc || 1) - 1 }); edges.push({ from: "e:" + fl, to: "p:" + x.material_no, qty: x.q }); });
    top.forEach((t) => { nodes.push({ id: "o:" + t.funcloc, kind: "peer", label: t.tag || t.funcloc, sub: t.descr, crit: t.c, ring: 2, funcloc: t.funcloc, weight: t.parts.length, cls: t.eq_class }); t.parts.forEach((m) => edges.push({ from: "p:" + m, to: "o:" + t.funcloc })); });
    return json(res, 200, pay("ws.links", { loc: fl }, { mode: "location", center: L, nodes, edges, totals: { parts: parts.length, sub_items: kids.length, shared_parts: parts.filter((x) => (x.n_funcloc || 1) > 1).length, peers: Object.keys(share).length }, truncated: parts.length - shownP.length, peers: top.map((t) => ({ funcloc: t.funcloc, tag: t.tag, descr: t.descr, crit: t.c, shared_parts: t.parts.length })) },
      [fig("parts", "Parts in the bill of materials (with sub-items)", parts.length, "parts"), fig("shared", "Parts also installed on other equipment", parts.filter((x) => (x.n_funcloc || 1) > 1).length, "parts"), fig("peers", "Other equipment sharing at least one part", Object.keys(share).length, "equipment")],
      ["BoM", "FuncLoc list"], ["Shared parts can be pooled: one stock serves every equipment that installs them."]));
  }
  return fail(res, 400, "Give a part (mat) or a location (loc).");
});
