// GET /api/data/campaign-readiness[?crit=S,A&limit=40] : stock against expected consumption in the coming high-load months of the maintenance plan. (owner: Claude A)
// Expected demand = base monthly issue quantity (non-campaign months of the history) x measured uplift of the part's item type (capped at 3) x number of high-load months. Estimate.
// The data cutoff is the start of the window, so lead times above the days to the window mean the order must already be open: open purchase orders are NOT in the data, so the page says "check open orders".
import { openDb } from "../_lib/db.mjs";
import { json, guard, qs, num } from "../_lib/http.mjs";
import { campaignModel } from "../../spi/drivers/campaign.mjs";
export default guard((req, res) => {
  const q = qs(req), db = openDb(), m = campaignModel(db, {}), crits = String(q.crit || "S,A").toUpperCase().split(",").filter(c => "SABC".includes(c) && c), limit = num(q.limit, 40, 5, 200);
  const hi = m.outlook.filter(o => o.high_load), H = hi.length, camp = m.campaign_months, nNorm = m.history.length - camp.length;
  const upBy = Object.fromEntries(m.uplift_by_item_type.filter(u => u.uplift).map(u => [u.item_type, Math.min(3, Math.max(1, u.uplift))])), upAll = Math.min(3, m.overall_uplift || 1);
  const ph = camp.map(() => "?").join(",") || "''";
  const rows = db.prepare(`select p.material_no, m.descr, m.unit, m.item_type, p.crit_max, p.stock, p.min_qty, p.max_qty, p.unit_price_idr, p.lt_median,
      (select sum(qty) from movement v where v.material_no = p.material_no and v.month not in (${ph})) / ${Math.max(1, nNorm)}.0 base
    from part_profile p join material m using(material_no) where m.mrp_type = 'Stock Item' and p.months_active > 0 and p.crit_max in (${(crits.length ? crits : ["S", "A"]).map(c => `'${c}'`).join(",")})`).all(...camp);
  const start = hi.length ? hi[0].month + "-01" : null, cutoff = (m.cutoff || "2026-09-30"), days = start ? Math.round((Date.parse(start) - Date.parse(cutoff)) / 864e5) : null;
  const out = rows.filter(r => r.base > 0).map(r => { const up = upBy[r.item_type] || upAll, need = r.base * up * H, gap = Math.max(0, need - r.stock), lead = r.lt_median == null ? null : r.lt_median;
    return { material_no: r.material_no, descr: r.descr, unit: r.unit, item_type: r.item_type, crit: r.crit_max, stock: r.stock, base_monthly: +r.base.toFixed(2), uplift: up, expected_demand: +need.toFixed(1), gap_qty: +gap.toFixed(1), gap_value_idr: r.unit_price_idr ? gap * r.unit_price_idr : null, cover_months: +(r.stock / (r.base * up)).toFixed(2), lead_days: lead, lead_basis: lead == null ? "not in baseline data" : "proxy: PR to PO delivery", could_arrive_for_second_month: lead != null && hi.length > 1 && lead <= Math.round((Date.parse(hi[1].month + "-01") - Date.parse(cutoff)) / 864e5) }; });
  const risk = out.filter(r => r.gap_qty > 0), byCrit = ["S", "A", "B", "C"].map(c => ({ crit: c, parts: out.filter(r => r.crit === c).length, at_risk: risk.filter(r => r.crit === c).length, gap_value_idr: risk.filter(r => r.crit === c).reduce((s, r) => s + (r.gap_value_idr || 0), 0) })).filter(r => r.parts);
  json(res, 200, { window: hi.map(o => ({ month: o.month, items: o.items, critical_items: o.critical_items, index: o.index })), months: H, window_start: start, days_to_window: days, cutoff, parts_checked: out.length, parts_at_risk: risk.length, gap_value_idr: risk.reduce((s, r) => s + (r.gap_value_idr || 0), 0), by_criticality: byCrit,
    rows: risk.sort((a, b) => (b.gap_value_idr || 0) - (a.gap_value_idr || 0) || b.gap_qty - a.gap_qty).slice(0, limit), assumption: m.assumption,
    notes: ["Estimate: base demand from non-campaign months, uplift measured in the last campaign by item type (capped at 3), applied to every high-load month of the plan.", "Open purchase orders are not in the baseline data, so a part shown here may already be covered: check open orders before acting.", "Lead time is a proxy (PR date to PO delivery date).", "Quantities are in the part base unit as issued. Pack sizes in the description (for example 0.4KG) are not converted, so check units on the largest gaps before ordering."] });
});
