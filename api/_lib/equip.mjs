// Shared answer for one functional location (used by api/data/location.mjs and api/data/equipment/[tag].mjs). (owner: Claude A)
export function equipmentAnswer(db, key) {
  const one = (s, ...a) => db.prepare(s).get(...a), all = (s, ...a) => db.prepare(s).all(...a);
  const f = one("select * from funcloc where funcloc = ? or tag = ? limit 1", key, key); if (!f) return null;
  const profile = one("select * from location_profile where funcloc = ?", f.funcloc);
  const parts = all("select b.material_no, m.descr, m.mrp_type, b.installed_qty, p.demand_class, p.total_qty, p.months_active, p.stock, p.min_qty, p.max_qty, p.crit_max, p.lt_median, p.unit_price_idr, p.stock_value_idr, p.excess_value_idr, p.months_cover from bom b join material m using(material_no) join part_profile p using(material_no) where b.funcloc = ? order by p.total_qty desc, p.stock_value_idr desc, m.descr limit 300", f.funcloc);
  const linked = all("select pe.material_no, m.descr, pe.source from part_equipment pe join material m using(material_no) where pe.funcloc = ? and pe.source != 'bom' limit 100", f.funcloc);
  const notifications = all("select notif_date, type, priority, status, descr, order_no, req_end, completed_on from notification where funcloc = ? order by notif_date desc limit 25", f.funcloc);
  const planned = all("select descr, cycle_text, next_due, abc, priority from maint_item where funcloc = ? order by next_due limit 30", f.funcloc);
  return { equipment: f, profile, parts, parts_by_drawing_text_or_order: linked, notifications, planned_maintenance: planned };
}
