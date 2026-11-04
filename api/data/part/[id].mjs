// GET /api/data/part/<material_no> : everything about one part: profile, 17-month series, equipment served, procurement, notifications, planned maintenance, family. (owner: Claude A)
import { openDb } from "../../_lib/db.mjs";
import { json, fail, guard, qs } from "../../_lib/http.mjs";
export default guard((req, res) => {
  const id = Number(qs(req).id); if (!Number.isInteger(id)) return fail(res, 400, "material number required");
  const db = openDb(), one = (s, ...a) => db.prepare(s).get(...a), all = (s, ...a) => db.prepare(s).all(...a);
  const part = one("select m.*, p.* from material m join part_profile p using(material_no) where material_no = ?", id); if (!part) return fail(res, 404, "part not found in the baseline data");
  const meta = Object.fromEntries(all("select key, value from meta").map(r => [r.key, r.value]));
  const first = meta.history_first_month, T = Number(meta.history_months), months = []; { let [y, m] = first.split("-").map(Number); for (let i = 0; i < T; i++) { months.push(`${y}-${String(m).padStart(2, "0")}`); if (++m > 12) { m = 1; y++; } } }
  const dm = Object.fromEntries(all("select month, qty, n_issues from demand_month where material_no = ?", id).map(r => [r.month, r]));
  const series = months.map(mo => ({ month: mo, qty: dm[mo] ? dm[mo].qty : 0, n_issues: dm[mo] ? dm[mo].n_issues : 0 }));
  const bom = all("select b.funcloc, f.descr, f.criticality, f.eq_class, b.installed_qty from bom b join funcloc f using(funcloc) where b.material_no = ? order by case f.criticality when 'S' then 1 when 'A' then 2 when 'B' then 3 when 'C' then 4 else 5 end, b.funcloc limit 40", id);
  const equipment = all("select pe.funcloc, f.descr, f.criticality, pe.source from part_equipment pe join funcloc f using(funcloc) where pe.material_no = ? and pe.source != 'bom' limit 20", id);
  const po = all("select pr_date, qty, uom, supplier, amount, currency, po_delivery, lead_days, unit_price, dq_flag from po_line where material_no = ? order by pr_date desc limit 20", id);
  const fl = bom.map(b => b.funcloc);
  const marks = fl.length ? fl.map(() => "?").join(",") : "''";
  const notif = fl.length ? all(`select priority, count(*) n from notification where funcloc in (${marks}) and notif_date > date(?, '-12 months') group by priority`, ...fl, meta.data_cutoff) : [];
  const pm = fl.length ? all(`select funcloc, descr, cycle_text, next_due, abc from maint_item where funcloc in (${marks}) and next_due between ? and date(?, '+12 months') order by next_due limit 15`, ...fl, meta.data_cutoff, meta.data_cutoff) : [];
  const family = part.family_id ? all("select p.material_no, m.descr, p.demand_class, p.months_active, p.total_qty, p.stock from part_profile p join material m using(material_no) where p.family_id = ? and p.material_no != ? order by p.total_qty desc limit 10", part.family_id, id) : [];
  const famInfo = part.family_id ? one("select family_id, label, standard_ref, members, basis from spec_family where family_id = ?", part.family_id) : null;
  json(res, 200, { part, series, data_cutoff: meta.data_cutoff, served_by_bom: bom, served_by_other_links: equipment, procurement: po, notifications_12m_on_served_equipment: notif, planned_maintenance_next_12m: pm, family: famInfo, family_members: family,
    notes: ["Stock is held at material level in the baseline data: the same stock figure appears under every location the part is installed on.", "Unit price is an estimate: the last PO item amount, read as a unit price (the amount does not scale with quantity), IDR lines only."] });
});
