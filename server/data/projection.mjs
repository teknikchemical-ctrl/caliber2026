// GET /api/data/projection?by=all|crit|item_type : monthly consumption history and a 12 month rules based projection (Estimate). (owner: Claude A)
// Method (rules, replaced by the engine forecasts when available): base = median monthly quantity of the non-campaign months; projected month = base, multiplied by the group's campaign uplift in months where the
// maintenance plan shows a high load. Value = quantity x last unit price, for parts that have a price (coverage is returned). Every threshold is an Assumption.
import { openDb } from "../_lib/db.mjs";
import { json, guard, qs } from "../_lib/http.mjs";
import { campaignModel } from "../../spi/drivers/campaign.mjs";
const med = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
const addMonths = (mo, k) => { let [y, m] = mo.split("-").map(Number); m += k; while (m > 12) { m -= 12; y++; } return `${y}-${String(m).padStart(2, "0")}`; };
export default guard((req, res) => {
  const q = qs(req), by = ["all", "crit", "item_type"].includes(q.by) ? q.by : "all", db = openDb(), cm = campaignModel(db), camp = new Set(cm.campaign_months), months = cm.history.map(h => h.month), last = months[months.length - 1];
  const key = { all: "'All parts'", crit: "coalesce(p.crit_max, 'none')", item_type: "m.item_type" }[by];
  const rows = db.prepare(`select ${key} g, mv.month, sum(mv.qty) qty, sum(mv.qty * coalesce(p.unit_price_idr, 0)) value, sum(case when p.unit_price_idr is not null then mv.qty else 0 end) priced_qty from movement mv join material m using(material_no) join part_profile p using(material_no) group by 1, 2`).all();
  const groups = {}; for (const r of rows) { const g = groups[r.g] || (groups[r.g] = { name: r.g, hist: {}, total: 0 }); g.hist[r.month] = r; g.total += r.qty; }
  const top = Object.values(groups).sort((a, b) => b.total - a.total).slice(0, by === "all" ? 1 : 8), out = [];
  const outlook = cm.outlook.map(o => o.month);
  for (const g of top) {
    const hist = months.map(mo => ({ month: mo, qty: g.hist[mo] ? g.hist[mo].qty : 0, value: g.hist[mo] ? g.hist[mo].value : 0, campaign: camp.has(mo) }));
    const norm = hist.filter(h => !h.campaign), cq = hist.filter(h => h.campaign);
    const baseQ = med(norm.map(h => h.qty)), baseV = med(norm.map(h => h.value)), upQ = baseQ > 0 && cq.length ? (cq.reduce((s, h) => s + h.qty, 0) / cq.length) / (norm.reduce((s, h) => s + h.qty, 0) / norm.length) : 1, upV = baseV > 0 && cq.length ? (cq.reduce((s, h) => s + h.value, 0) / cq.length) / (norm.reduce((s, h) => s + h.value, 0) / norm.length) : 1;
    const up = Math.min(3, Math.max(1, upQ)), upv = Math.min(3, Math.max(1, upV));
    const proj = Array.from({ length: 12 }, (_, i) => { const mo = addMonths(last, i + 1), hi = cm.outlook.find(o => o.month === mo && o.high_load); return { month: mo, qty: Math.round(baseQ * (hi ? up : 1)), value: Math.round(baseV * (hi ? upv : 1)), campaign_load: !!hi }; });
    const pq = hist.reduce((s, h) => s + (g.hist[h.month] ? g.hist[h.month].priced_qty : 0), 0), tq = hist.reduce((s, h) => s + h.qty, 0);
    out.push({ group: g.name, history: hist, projection: proj, base_qty_per_month: baseQ, base_value_idr_per_month: baseV, campaign_uplift_qty: +up.toFixed(2), priced_share: tq ? +(pq / tq).toFixed(2) : null, projected_12m_qty: proj.reduce((s, p) => s + p.qty, 0), projected_12m_value_idr: proj.reduce((s, p) => s + p.value, 0), history_12m_value_idr: hist.slice(-12).reduce((s, h) => s + h.value, 0) });
  }
  json(res, 200, { by, cutoff: cm.cutoff, campaign_months: cm.campaign_months, groups: out, method: "Base = median monthly quantity of non-campaign months. Months in which the maintenance plan shows at least " + cm.assumption.campaign_index + " times the later run rate are multiplied by the uplift measured in the last campaign (capped at 3). Rules projection (Estimate): it is replaced per part by the engine forecasts and does not use failure or lead time data.", notes: ["Value uses the last purchase order item amount read as a unit price and covers only parts that have one (priced_share).", "17 months of history: no seasonality is modelled."] });
});
