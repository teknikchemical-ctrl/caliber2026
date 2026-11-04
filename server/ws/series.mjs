// GET /api/ws/series?mat=<material number> (owner: Claude B). Everything the replenishment simulator needs for one part, straight from the six source files:
// monthly issues (17 months), every issue with its date, lead-time samples and prices from PR PO, stock, Min and Max, installed population, planned maintenance occurrences at its locations, notifications at its locations.
import { openDb, json, fail, guard, body, fig, pay, CUTOFF, addMonths, months } from "./_lib.mjs";
import { occurrences } from "./plan.mjs";
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), mat = Number(i.mat);
  const p = db.prepare("select t.material_no, t.descr, t.unit, t.mrp_type, t.item_type, t.spec_family, p.* from material t left join part_profile p using(material_no) where t.material_no = ?").get(mat);
  if (!p) return fail(res, 404, "This part is not in the baseline data.");
  const M = months("2025-05", 17), dm = Object.fromEntries(db.prepare("select month, qty, n_issues from demand_month where material_no = ?").all(mat).map((r) => [r.month, r]));
  const monthly = M.map((m) => ({ month: m, qty: dm[m] ? dm[m].qty : 0, issues: dm[m] ? dm[m].n_issues : 0 }));
  const issues = db.prepare("select posting_date d, qty, order_no from movement where material_no = ? order by posting_date").all(mat);
  const po = db.prepare("select pr_date, qty, supplier, lead_days, unit_price, po_delivery, pr_delivery from po_line where material_no = ? order by pr_date").all(mat);
  const leads = po.map((r) => r.lead_days).filter((x) => x != null && x > 0 && x < 720), prices = po.map((r) => r.unit_price).filter((x) => x > 0);
  const locs = db.prepare("select b.funcloc, b.installed_qty, f.criticality, f.descr from bom b left join funcloc f using(funcloc) where b.material_no = ?").all(mat);
  const from = addMonths(CUTOFF.slice(0, 7), 1), plan = {};
  if (locs.length) { const L = locs.map((l) => l.funcloc), inst = Object.fromEntries(locs.map((l) => [l.funcloc, l.installed_qty || 1]));
    for (let k = 0; k < L.length; k += 400) { const ch = L.slice(k, k + 400); db.prepare(`select * from maint_item where funcloc in (${ch.map(() => "?").join(",")})`).all(...ch).forEach((it) => occurrences(it, from, 24).forEach((d) => { const m = d.slice(0, 7); plan[m] = plan[m] || { tasks: 0, installed: 0 }; plan[m].tasks++; plan[m].installed += inst[it.funcloc]; })); } }
  const fail = Object.fromEntries(db.prepare("select substr(m.posting_date,1,7) mo, sum(m.qty) q from movement m join notification n on n.order_no = m.order_no where m.material_no = ? and n.priority in ('Emergency','High') group by 1").all(mat).map((r) => [r.mo, r.q]));
  const ontime = po.length ? po.filter((r) => r.po_delivery && r.pr_delivery && r.po_delivery <= r.pr_delivery).length / po.length : null;
  const fails12 = locs.length ? db.prepare(`select count(*) c from notification where funcloc in (select funcloc from bom where material_no = ?) and priority in ('Emergency','High') and notif_date > date(?, '-12 months')`).get(mat, CUTOFF).c : 0;
  const notif = locs.length ? db.prepare(`select count(*) c from notification where funcloc in (select funcloc from bom where material_no = ?) and notif_date > date(?, '-12 months')`).get(mat, CUTOFF).c : 0;
  const outputs = { part: p, monthly, issues, purchases: po.slice(-30), lead_samples: leads, price_samples: prices, suppliers: [...new Set(po.map((r) => r.supplier).filter(Boolean))], locations: locs.length, installed_total: locs.reduce((s, l) => s + (l.installed_qty || 0), 0), crit_max: p.crit_max,
    plan_next_24m: months(from, 24).map((m) => ({ month: m, tasks: (plan[m] || {}).tasks || 0, installed: (plan[m] || {}).installed || 0 })), notifications_12m_at_locations: notif, failures_12m_at_locations: fails12, failure_monthly: M.map((m) => fail[m] || 0), on_time_share: ontime };
  json(res, 200, pay("ws.series", { mat }, outputs, [fig("issued_17m", "Quantity issued in 17 months", monthly.reduce((s, m) => s + m.qty, 0), p.unit), fig("lead_samples", "Lead-time observations", leads.length, "orders"), fig("stock", "Stock on hand", p.stock, p.unit)],
    ["Movement Material", "PR PO", "BoM", "Mitem & Mplan", "Notif History"], ["Lead time = PR date to PO delivery date, a proxy. Unit price = PO item amount read as a unit price, an Estimate."]));
});
