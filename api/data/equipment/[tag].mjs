// GET /api/data/equipment/<tag or funcloc> : one location with its parts, recent notifications and planned maintenance. (owner: Claude A)
import { openDb } from "../../_lib/db.mjs";
import { json, fail, guard, qs } from "../../_lib/http.mjs";
export default guard((req, res) => {
  const t = String(qs(req).tag || "").slice(0, 80); if (!t) return fail(res, 400, "tag required");
  const db = openDb(), one = (s, ...a) => db.prepare(s).get(...a), all = (s, ...a) => db.prepare(s).all(...a);
  const f = one("select * from funcloc where funcloc = ? or tag = ? limit 1", t, t); if (!f) return fail(res, 404, "location not found in the baseline data");
  const parts = all("select b.material_no, m.descr, b.installed_qty, p.demand_class, p.total_qty, p.stock, p.min_qty, p.max_qty, p.crit_max, p.lt_median, p.stock_value_idr from bom b join material m using(material_no) join part_profile p using(material_no) where b.funcloc = ? order by p.total_qty desc, m.descr limit 300", f.funcloc);
  const linked = all("select pe.material_no, m.descr, pe.source from part_equipment pe join material m using(material_no) where pe.funcloc = ? and pe.source != 'bom' limit 100", f.funcloc);
  const notif = all("select notif_date, type, priority, status, descr, order_no from notification where funcloc = ? order by notif_date desc limit 20", f.funcloc);
  const pm = all("select descr, cycle_text, next_due, abc, priority from maint_item where funcloc = ? order by next_due limit 30", f.funcloc);
  json(res, 200, { equipment: f, parts, parts_by_drawing_text_or_order: linked, notifications: notif, planned_maintenance: pm });
});
