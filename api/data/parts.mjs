// GET /api/data/parts?q=&class=&crit=&family=&flag=&sort=&limit=&offset= : searchable part list with profile features. (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, guard, qs, num } from "../_lib/http.mjs";
const SORTS = { value: "p.stock_value_idr desc", excess: "p.excess_value_idr desc", demand: "p.total_qty desc", crit: "p.crit_rank desc, p.total_qty desc", id: "p.material_no", cover: "p.months_cover desc", months: "p.months_active desc" };
export default guard((req, res) => {
  const q = qs(req), db = openDb(), w = [], a = [];
  if (q.q) { const t = String(q.q).trim().slice(0, 60); if (/^\d{6,}$/.test(t)) { w.push("p.material_no = ?"); a.push(Number(t)); } else { w.push("(m.descr like ? or m.for_tag like ?)"); a.push("%" + t + "%", "%" + t + "%"); } }
  if (q.class) { w.push("p.demand_class = ?"); a.push(String(q.class)); }
  if (q.crit) { w.push("p.crit_max = ?"); a.push(String(q.crit).toUpperCase()); }
  if (q.family) { w.push("p.family_id = ?"); a.push(String(q.family)); }
  if (q.flag) { w.push("p.dq_flags like ?"); a.push("%" + String(q.flag).replace(/[^A-Z_]/g, "") + "%"); }
  if (q.stock === "zero") w.push("p.stock = 0 and m.mrp_type = 'Stock Item'");
  if (q.stock === "excess") w.push("p.excess_value_idr > 0");
  const where = w.length ? "where " + w.join(" and ") : "", order = SORTS[q.sort] || SORTS.crit, limit = num(q.limit, 50, 1, 200), offset = num(q.offset, 0, 0, 100000);
  const total = db.prepare(`select count(*) c from part_profile p join material m using(material_no) ${where}`).get(...a).c;
  const rows = db.prepare(`select p.material_no, m.descr, m.unit, m.mrp_type, m.item_type, m.for_tag, p.crit_max, p.demand_class, p.months_active, p.total_qty, p.last_issue, p.adi, p.cv2, p.stock, p.min_qty, p.max_qty, p.unit_price_idr, p.stock_value_idr, p.excess_value_idr, p.months_cover, p.lt_median, p.pm_due_12m, p.family_id, p.abc_class, p.xyz_class, p.dq_flags from part_profile p join material m using(material_no) ${where} order by ${order} limit ? offset ?`).all(...a, limit, offset);
  json(res, 200, { total, limit, offset, rows });
});
