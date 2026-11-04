// GET /api/ws/notification?no=<notification number> (owner: Claude B). One notification with its location, the parts issued on its order (Movement Material, joined on the order number), and the other notifications on the same location.
import { openDb, json, fail, guard, body, fig, pay, CUTOFF, days } from "./_lib.mjs";
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), no = String(i.no || "").trim();
  const n = db.prepare("select n.*, f.tag, f.descr loc_descr, f.eq_class, f.eq_class_name, f.criticality, f.system_code from notification n left join funcloc f on f.funcloc = n.funcloc where n.notif_no = ?").get(no);
  if (!n) return fail(res, 404, "This notification is not in the baseline data.");
  const parts = n.order_no ? db.prepare(`select m.posting_date, m.material_no, m.qty, m.unit, t.descr, p.unit_price_idr, p.crit_max, p.stock, p.min_qty, p.max_qty from movement m left join material t on t.material_no = m.material_no left join part_profile p on p.material_no = m.material_no where m.order_no = ? order by m.posting_date`).all(n.order_no) : [];
  const value = parts.reduce((s, r) => s + (r.unit_price_idr ? r.unit_price_idr * r.qty : 0), 0), priced = parts.filter((r) => r.unit_price_idr).length;
  const others = db.prepare("select notif_no, notif_date, type, priority, status, descr, completed_on from notification where funcloc = ? and notif_no != ? order by notif_date desc limit 12").all(n.funcloc, no);
  const plan = db.prepare("select item_no, plan_no, descr, cycle_text, next_due from maint_item where funcloc = ? order by next_due limit 8").all(n.funcloc);
  const timeline = { created: n.created_on, notified: n.notif_date, required_start: n.req_start, required_end: n.req_end, completed: n.completed_on, days_to_complete: days(n.notif_date, n.completed_on), days_late: n.completed_on ? days(n.req_end, n.completed_on) : (n.req_end && n.req_end < CUTOFF ? days(n.req_end, CUTOFF) : null) };
  json(res, 200, pay("ws.notification", { no }, { notification: n, timeline, parts, parts_value_idr: value, parts_priced: priced, others, plan },
    [fig("parts_issued", "Part issues on the order", parts.length, "issues"), fig("parts_value", "Value of the parts issued", value, "IDR", "Estimate"), fig("days_to_complete", "Days from notification to completion", timeline.days_to_complete, "days")],
    ["Notif History", "Movement Material (order number)", "Mitem & Mplan", "PR PO (unit price, Estimate)"], ["Part value uses the last purchase order amount read as a unit price, so it is an Estimate."]));
});
