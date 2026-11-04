// GET|POST /api/ws/golden (owner: Claude B). Golden path: the optimised purchase pathway and its stock projection, in the shape asked from Claude A for /api/data/golden (B's pages read A's endpoint first and fall back to this one).
// Inputs: scope {crit, type, q} or set / loc; service {S,A,B,C}; demand_factor; lead_factor; budget_idr (per month, optional); carrying_rate; campaign_repeat (repeat the campaign uplift of the history in the same calendar months); horizon (months, default 12).
// Model: per part the recommendation of /api/ws/advice (cheapest order size and service level, never dearer than today). Expected stock path month by month: on hand minus mean use plus arrivals,
//   orders placed when stock plus open orders reach the reorder point, arriving after the lead time. Band: normal approximation of the use uncertainty (p10, p90). Estimate.
import { openDb, json, guard, body, num, list, fig, pay, CUTOFF, months, addMonths } from "./_lib.mjs";
import { ECON } from "../_lib/econ.mjs";
import { portfolioParts } from "./costrisk.mjs";
import { advise, impacts } from "./advice.mjs";
const P = (v) => (typeof v === "string" ? (() => { try { return JSON.parse(v); } catch { return {}; } })() : v || {}), MD = 30.4375;
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), H = num(i.horizon, 12, 3, 24), lf = num(i.lead_factor, 1, 0.3, 4), df = num(i.demand_factor, 1, 0.2, 5), budget = Number(i.budget_idr) || null;
  const A = { carrying_rate: num(i.carrying_rate, ECON.carrying_rate ?? 0.22, 0, 1), order_cost_idr: ECON.order_cost_idr, emergency_premium: ECON.emergency_premium, lead_default: ECON.lead_default, lead_delay_days: 0, demand_factor: df, downtime_idr_h: { ...ECON.downtime_idr_h }, hours_per_stockout: { ...ECON.hours_per_stockout }, downtime_share: { ...ECON.downtime_share }, ...P(i.assumptions) };
  A.demand_factor = df;
  const svc = { ...(ECON.service || { ...ECON.service }), ...P(i.service) }, sc = P(i.scope);
  const on = Object.fromEntries(db.prepare("select material_no, sum(qty) q from pol where po_delivery > ? group by 1").all(CUTOFF).map((r) => [r.material_no, r.q]));
  let parts;
  if (i.set || i.loc) { const fl = i.loc ? String(i.loc) : (db.prepare("select funcloc from equipment_set where tag = ?").get(String(i.set)) || {}).funcloc || "PX_" + i.set; const mats = new Set(db.prepare("select material_no from bom where funcloc = ? or funcloc like ?").all(fl, fl + "-%").map((r) => r.material_no)); parts = portfolioParts(db, {}).filter((p) => mats.has(p.material_no)); }
  else parts = portfolioParts(db, { crit: list(sc.crit || i.crit), type: sc.type ? [String(sc.type).toUpperCase()] : [], q: sc.q });
  /* campaign months of the history (issues at least 1.5 times the median month) */
  const iss = db.prepare("select substr(posting_date,1,7) m, count(*) c from movement group by 1").all(), med = iss.map((r) => r.c).sort((a, b) => a - b)[Math.floor(iss.length / 2)] || 1, camp = iss.filter((r) => r.c >= med * 1.5), up = camp.length ? camp.reduce((s, r) => s + r.c, 0) / camp.length / med : 1, campMo = new Set(camp.map((r) => r.m.slice(5)));
  const M = months(addMonths(CUTOFF.slice(0, 7), 1), H), campIdx = M.map((m) => (String(i.campaign_repeat) === "1" && campMo.has(m.slice(5)) ? up : 1));
  const o = { horizon: H, cover: 0, lead: "median", service: svc };
  const val = { rec: M.map(() => 0), cur: M.map(() => 0), none: M.map(() => 0), var: M.map(() => 0) }, spend = M.map(() => 0), orders = [];
  let curT = null, recT = null; const IK = ["emergency_orders", "emergency_cost", "purchase_carry", "working_capital", "downtime_hours", "downtime_cost"], add = (a, b) => { IK.forEach((k) => (a[k] = (a[k] || 0) + b[k])); return a; };
  let costCur = 0, costRec = 0, evCur = 0, evRec = 0;
  parts.forEach((p0) => { const p = { ...p0, on_order: on[p0.material_no] || 0, lt_median: p0.lt_median ? p0.lt_median * lf : null, lt_p90: p0.lt_p90 ? p0.lt_p90 * lf : null }; const A2 = { ...A, lead_default: A.lead_default * lf };
    const x = advise(p, o, A2), price = p.price || 0, mu = x.mean_month, leadM = Math.max(1, Math.round(x.risk.lead_days / MD));
    costCur += x.cost_current.total; costRec += x.cost_recommended.total; evCur += x.cost_current.events; evRec += x.cost_recommended.events; curT = add(curT || {}, x.impact.current); recT = add(recT || {}, x.impact.recommended);
    const path = (min, max, record) => { let onh = p.stock || 0; const pipe = [{ t: 0, q: p.on_order || 0 }], out = []; for (let t = 0; t < H; t++) { for (let k = pipe.length - 1; k >= 0; k--) if (pipe[k].t <= t) { onh += pipe[k].q; pipe.splice(k, 1); }
        const pos = onh + pipe.reduce((s, z) => s + z.q, 0); if (max > 0 && mu > 0 && pos <= min) { const q = Math.ceil(max - pos); pipe.push({ t: t + leadM, q }); if (record) { const od = new Date(Date.parse(M[t] + "-01")).toISOString().slice(0, 10); record.push({ t, od, q }); } }
        onh = Math.max(0, onh - mu * campIdx[t]); out.push(onh); } return out; };
    const recO = [], pr = path(x.rop, x.order_up_to, recO), pc = path(p.min_qty || 0, Math.max(p.max_qty || 0, p.min_qty || 0), null), pn = path(0, 0, null);
    pr.forEach((v, t) => { val.rec[t] += v * price; val.cur[t] += pc[t] * price; val.none[t] += pn[t] * price; val.var[t] += (x.sd_month * x.sd_month * (t + 1)) * price * price; });
    recO.forEach((z) => { const first = z.t === 0 && x.decision === "order_now"; orders.push({ material_no: p.material_no, descr: p.descr, crit: p.crit, unit: p.unit, month: M[z.t], order_date: first ? CUTOFF : z.od, qty: z.q, months_covered: x.cover_months, value_idr: price ? z.q * price : null, saving_idr_yr: x.saving_per_year, lead_days: Math.round(x.risk.lead_days), stock: p.stock || 0, reason: first ? "Stock and open orders at or below the reorder point" : "Projected to reach the reorder point" }); }); });
  /* budget: fund by criticality then cost reduction, defer the rest to the next month */
  const rank = { S: 0, A: 1, B: 2, C: 3 }; orders.sort((a, b) => a.month.localeCompare(b.month) || rank[a.crit] - rank[b.crit] || (b.saving_idr_yr - a.saving_idr_yr));
  let carry = []; M.forEach((m, t) => { const due = carry.concat(orders.filter((x) => x.month === m && !x.deferred_from)).sort((a, b) => rank[a.crit] - rank[b.crit] || b.saving_idr_yr - a.saving_idr_yr); let room = budget == null ? Infinity : budget; carry = [];
    due.forEach((x) => { const c = x.value_idr || 0; if (c <= room) { room -= c; x.funded_month = m; spend[t] += c; } else { if (!x.deferred_from) x.deferred_from = x.month; carry.push(x); } }); });
  const z = 1.2816, band = val.rec.map((v, t) => [Math.max(0, v - z * Math.sqrt(val.var[t])), v + z * Math.sqrt(val.var[t])]);
  const hist = db.prepare("select substr(m.posting_date,1,7) mo, sum(m.qty * coalesce(p.unit_price_idr,0)) v from movement m left join part_profile p using(material_no) group by 1 order by 1").all();
  const poh = db.prepare("select substr(pr_date,1,7) mo, sum(qty*amount) v, count(*) n from pol where currency = 'IDR' group by 1 order by 1").all(), rch = db.prepare("select substr(po_delivery,1,7) mo, sum(qty*amount) v from pol where currency = 'IDR' and po_delivery <= ? group by 1 order by 1").all(CUTOFF);
  const spendCrit = Object.fromEntries(["S", "A", "B", "C"].map((c) => [c, M.map((m) => orders.filter((x) => x.crit === c && x.funded_month === m).reduce((s, x) => s + (x.value_idr || 0), 0))]));
  const funded = orders.filter((x) => x.funded_month), tot = { orders: orders.length, funded: funded.length, value_idr: orders.reduce((s, x) => s + (x.value_idr || 0), 0), funded_value_idr: funded.reduce((s, x) => s + (x.value_idr || 0), 0), saving_idr_yr: costCur - costRec, cost_current_yr: costCur, cost_recommended_yr: costRec, stockouts_current_yr: evCur, stockouts_recommended_yr: evRec, parts: parts.length };
  json(res, 200, pay("ws.golden", { scope: sc, set: i.set, loc: i.loc, service: svc, demand_factor: df, lead_factor: lf, budget_idr: budget, carrying_rate: A.carrying_rate, campaign_repeat: String(i.campaign_repeat) === "1", horizon: H },
    { months: M, orders: orders.slice(0, num(i.limit, 3000, 1, 8000)), totals: tot, impact: { current: curT || {}, recommended: recT || {} }, stock_value: { recommended: val.rec, current_policy: val.cur, no_orders: val.none, p10: band.map((b) => b[0]), p90: band.map((b) => b[1]) }, spend_by_month: spend, spend_by_crit: spendCrit, history_issue_value: hist, history_po_value: poh, history_receipt_value: rch, campaign_months: [...campMo], campaign_uplift: up },
    [fig("orders", "Recommended orders in the horizon", orders.length, "orders", "Estimate"), fig("value", "Value of the recommended orders", tot.value_idr, "IDR", "Estimate"), fig("saving", "Cost reduction per year against today's Min and Max", tot.saving_idr_yr, "IDR per year", "Estimate"), fig("stockouts", "Expected stockouts per year, today to recommended", evCur, "events", "Estimate")],
    ["BoM (stock, Min, Max)", "Movement Material (use)", "PR PO (open orders, lead time, price)"], ["Band: 80% range of the stock value from the spread of monthly use (normal approximation) until the Monte Carlo of /api/data/golden is live."]));
});
