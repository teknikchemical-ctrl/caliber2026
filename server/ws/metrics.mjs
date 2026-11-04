// GET /api/ws/metrics (owner: Claude B). The register of headline figures: one definition, one unit, one basis and one source per figure.
// Every page that shows one of these figures reads this definition; the "Figures and definitions" drawer lists them, and the notes say why model figures differ.
import { openDb, json, guard, pay, CUTOFF } from "./_lib.mjs";
let cache = null;
const q = (a, p) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(p * (s.length - 1))] : null; };
function build(db) {
  const g = (sql, ...a) => db.prepare(sql).get(...a), F = [];
  const add = (id, group, label, value, unit, basis, definition, source) => F.push({ id, group, label, value, unit, basis, definition, source });
  const pp = g("select sum(stock_value_idr) v, sum(excess_value_idr) x, sum(case when stock=0 and n_issues>0 then 1 else 0 end) z, sum(case when min_qty>0 and stock<min_qty and stock>0 then 1 else 0 end) bm, sum(case when max_qty>0 and stock>max_qty then 1 else 0 end) am, sum(case when stock>0 and n_issues=0 then 1 else 0 end) dead, count(*) n from part_profile");
  add("bom_parts", "Stock", "Spare parts in the BoMs", pp.n, "parts", "Data", "Distinct materials listed in at least one BoM.", "BoM");
  add("stock_value", "Stock", "Stock value on hand", pp.v, "IDR", "Estimate", "Stock at the cut-off x last purchase unit price (PO-Item Amount, IDR lines). Parts without a price count as zero.", "BoM, PR PO");
  add("excess_value", "Stock", "Stock value above the projected need", pp.x, "IDR", "Estimate", "Value of the stock above Max or above two years of use, whichever is the larger need.", "BoM, Movement Material, PR PO");
  add("zero_stock_used", "Stock", "Parts at zero stock that were used", pp.z, "parts", "Data", "Stock 0 at the cut-off and at least one issue in 17 months.", "BoM, Movement Material");
  add("below_min", "Stock", "Parts below Min (stock above zero)", pp.bm, "parts", "Data", "0 < stock < Min at the cut-off.", "BoM");
  add("above_max", "Stock", "Parts above Max", pp.am, "parts", "Data", "Stock > Max at the cut-off, Max set.", "BoM");
  add("dead", "Stock", "Parts held with no issue in 17 months", pp.dead, "parts", "Data", "Stock > 0 and no issue line in the period.", "BoM, Movement Material");
  const mv = g("select count(*) n, count(distinct material_no) m, count(distinct order_no) o from movement"), iv = g("select sum(v.qty*m.last_unit_price_idr) v from movement v join material m using(material_no)");
  add("issue_lines", "Use", "Issue lines in 17 months", mv.n, "lines", "Data", "Rows of Movement Material (movement type Issue). Quantities are never added across units.", "Movement Material");
  add("parts_issued", "Use", "Parts issued at least once", mv.m, "parts", "Data", "Distinct materials with an issue line.", "Movement Material");
  add("issue_value", "Use", "Value issued in 17 months", iv.v, "IDR", "Estimate", "Issued quantity x last purchase unit price, IDR.", "Movement Material, PR PO");
  const camp = db.prepare("select substr(posting_date,1,7) m, count(*) n from movement group by 1").all(), cm = camp.filter((x) => x.m >= "2025-11" && x.m <= "2026-01"), rest = camp.filter((x) => !(x.m >= "2025-11" && x.m <= "2026-01"));
  add("campaign_ratio", "Use", "Campaign months against a normal month", (cm.reduce((t, x) => t + x.n, 0) / cm.length) / (rest.reduce((t, x) => t + x.n, 0) / rest.length), "times", "Data", "Issue lines per month in Nov 2025 to Jan 2026 against the other months.", "Movement Material");
  const po = g("select count(*) n, sum(case when currency='IDR' then qty*amount else 0 end) v, sum(case when po_delivery > ? then 1 else 0 end) open, sum(case when po_delivery > ? and currency='IDR' then qty*amount else 0 end) ov, sum(case when po_delivery > pr_delivery then 1 else 0 end) late, count(distinct supplier) s from pol", CUTOFF, CUTOFF);
  const lt = db.prepare("select lead_days l from pol where lead_days > 0 and lead_days < 720").all().map((r) => r.l);
  add("purchase_value", "Purchasing", "Purchase value in 17 months", po.v, "IDR", "Estimate", "PR quantity x PO-Item Amount read as a unit price (it stays the same on lines of very different quantity), IDR lines.", "PR PO");
  add("po_lines", "Purchasing", "PR PO lines (each counted once)", po.n, "lines", "Data", "Distinct PR, PR item, PO and PO item lines; the sheet repeats 5,420 rows as exact copies.", "PR PO");
  add("lead_median", "Purchasing", "Median lead time", q(lt, 0.5), "days", "Data", "PR date to PO delivery date, lines between 1 and 720 days.", "PR PO");
  add("lead_p90", "Purchasing", "9 in 10 orders delivered within", q(lt, 0.9), "days", "Data", "90th percentile of the lead time.", "PR PO");
  add("late_share", "Purchasing", "Lines due after the requested date", po.late / po.n, "share", "Data", "PO delivery date later than the PR delivery date.", "PR PO");
  add("open_po", "Purchasing", "Open PO lines after the cut-off", po.open, "lines", "Data", "PO delivery date after " + CUTOFF + ".", "PR PO");
  add("open_po_value", "Purchasing", "Value of the open PO lines", po.ov, "IDR", "Estimate", "Quantity x unit price of the open lines, IDR.", "PR PO");
  add("suppliers", "Purchasing", "Suppliers", po.s, "suppliers", "Data", "Distinct PO supplier names.", "PR PO");
  const nt = g("select count(*) n, sum(case when status<>'Complete' then 1 else 0 end) open, sum(case when status<>'Complete' and julianday(?)-julianday(notif_date) > 180 then 1 else 0 end) old, sum(case when priority='Emergency' then 1 else 0 end) em from notification", CUTOFF);
  const cd = db.prepare("select julianday(completed_on)-julianday(notif_date) d from notification where completed_on is not null").all().map((r) => r.d);
  add("notifications", "Maintenance", "Notifications in 17 months", nt.n, "notifications", "Data", "Rows of Notif History. May 2025 holds the opening backlog of the extract.", "Notif History");
  add("notif_open", "Maintenance", "Open at the cut-off", nt.open, "notifications", "Data", "Status In Progress.", "Notif History");
  add("notif_old", "Maintenance", "Open and older than 180 days", nt.old, "notifications", "Data", "In Progress and notified more than 180 days before the cut-off.", "Notif History");
  add("notif_emergency", "Maintenance", "Emergency notifications", nt.em, "notifications", "Data", "Priority Emergency (all of type N2).", "Notif History");
  add("completion_median", "Maintenance", "Median time to complete", q(cd, 0.5), "days", "Data", "Notification date to completion date, completed notifications.", "Notif History");
  const pl = db.prepare("select cycle_months c from maint_item where cycle_months > 0").all();
  add("plan_items", "Maintenance", "Maintenance items", g("select count(*) n from maint_item").n, "items", "Data", "Rows of Mitem Mplan.", "Mitem Mplan");
  add("plan_per_year", "Maintenance", "Task occurrences per year", pl.reduce((t, r) => t + 12 / r.c, 0), "tasks per year", "Data", "Sum over the items of 12 / cycle length in months (cycle texts normalised).", "Mitem Mplan");
  add("locations", "Plant", "Functional locations", g("select count(*) n from funcloc").n, "locations", "Data", "Rows of the FuncLoc list.", "FuncLoc list");
  add("locations_s", "Plant", "Criticality S locations", g("select count(*) n from funcloc where criticality='S'").n, "locations", "Data", "FuncLoc criticality S.", "FuncLoc list");
  const notes = ["Model figures (cost reduction, stockouts per year, recommended orders) come from the Optimized Scenario and the planner; they use these data figures as their inputs and are Estimates.",
    "Average stock value under a policy (working capital in the impacts) is the mean of the projected stock over 12 months, not the stock on hand today.",
    "The Monte Carlo stock value of the Optimized Scenario covers every part with learned demand, valued at the last unit price; it is a projection, not the stock on hand."];
  return { cutoff: CUTOFF, figures: F, notes };
}
export default guard((req, res) => { if (!cache) cache = build(openDb()); json(res, 200, pay("ws.metrics", {}, cache, cache.figures.map(({ id, label, value, unit, basis }) => ({ id, label, value, unit, basis })), ["BoM", "Movement Material", "PR PO", "Notif History", "Mitem Mplan", "FuncLoc list"], cache.notes)); });
