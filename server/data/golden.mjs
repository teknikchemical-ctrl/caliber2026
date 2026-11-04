// GET /api/data/golden : the Optimized Scenario, the single decision engine of the site (owner: Claude A). Every page reads its orders, decisions and totals from here.
// Scope: ?mat= | ?tag= (funcloc and below) | ?set= (equipment set tag, its bill of materials) | ?cls= (equipment class) | ?crit=S,A | default all parts.
// Inputs (Assumptions): service_S..C, demand (factor), lead (factor), carrying, budget (IDR per month), campaign=1, runs, seed.
// Policy per part: learned demand (ml_part, ml_forecast), lead time from PO history (learned from supplier, group and item type where a part has none), service target by criticality. Candidate policies: reorder point =
// lead-time demand + z x spread, order-up-to = reorder point + 1 to 24 months of demand, at the target service or higher; today's Min and Max is a candidate
// too, so the recommendation never costs more than today (same rule and same yearly cost function as /api/ws/advice, evalPart in server/ws/costrisk.mjs).
// Two views of cost: steady state per year (the policy in place, the cost function above) and the first 12 months simulated from today's stock and open orders
// (Monte Carlo of demand and lead time, common random numbers for both policies). Backtest and band calibration come from ml_backtest (held-out months).
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
import { ECON } from "../_lib/econ.mjs";
import { evalPart } from "../ws/costrisk.mjs";
import { reviewPart, summarise, scopeCheck, GUARD } from "../../spi/ai/review.js";
const add = (ym, k) => { let [y, m] = ym.split("-").map(Number); m += k; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return `${y}-${String(m).padStart(2, "0")}`; };
const Z = (p) => { const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924], b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857], c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878], d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742]; const q = Math.min(0.9995, Math.max(0.5, p)); if (q > 0.97575) { const r = Math.sqrt(-2 * Math.log(1 - q)); return -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } const r = q - 0.5, s = r * r; return (((((a[0] * s + a[1]) * s + a[2]) * s + a[3]) * s + a[4]) * s + a[5]) * r / (((((b[0] * s + b[1]) * s + b[2]) * s + b[3]) * s + b[4]) * s + 1); };
const Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI), p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); return z >= 0 ? 1 - p : p; };
const MD = 30.4375, COVERS = [1, 2, 3, 4, 6, 9, 12, 18, 24], r0 = (x, k = 0) => (x == null || !isFinite(x) ? null : Math.round(x * 10 ** k) / 10 ** k);
const cache = new Map(), stat = new WeakMap();
// per-part review decisions of the last plant run (read by tools/spi_review_bake.mjs to write ml_review for the other tools)
export const LAST_REVIEW = new Map();
// per database: monthly issue value, PO value and receipt value per part, campaign months, backtest rows, issue statistics for the cost function
function statics(db) {
  if (stat.has(db)) return stat.get(db);
  const price = new Map(db.prepare("select m.material_no, coalesce(p.unit_price_idr, m.last_unit_price_idr, 0) price from material m left join part_profile p using(material_no)").all().map((r) => [r.material_no, r.price]));
  const months = db.prepare("select distinct month from movement order by 1").all().map((r) => r.month);
  const iss = db.prepare("select material_no, month, sum(qty) q, count(*) n from movement group by 1, 2").all();
  const po = db.prepare("select material_no, substr(pr_date,1,7) m, sum(qty*coalesce(unit_price,amount,0)) v from (select distinct pr_no, pr_item, po_no, po_item, material_no, qty, unit_price, amount, pr_date, po_delivery, supplier from po_line) where pr_date is not null group by 1, 2").all();
  const rc = db.prepare("select material_no, substr(po_delivery,1,7) m, sum(qty*coalesce(unit_price,amount,0)) v from (select distinct pr_no, pr_item, po_no, po_item, material_no, qty, unit_price, amount, pr_date, po_delivery, supplier from po_line) where po_delivery <= ? group by 1, 2").all(months[months.length - 1] + "-31");
  const cnt = {}; for (const r of iss) cnt[r.month] = (cnt[r.month] || 0) + r.n; const cs = Object.values(cnt).sort((a, b) => a - b), med = cs[Math.floor(cs.length / 2)] || 1;
  const camp = months.filter((m) => (cnt[m] || 0) >= med * 1.5);
  const bt = new Map(); try { for (const r of db.prepare("select material_no, month, actual, forecast, band_low, band_high, size_low, size_high from ml_backtest").all()) { (bt.get(r.material_no) || bt.set(r.material_no, []).get(r.material_no)).push(r); } } catch { }
  const sq = new Map(db.prepare("select material_no, sum(qty*qty) s from demand_month group by 1").all().map((r) => [r.material_no, r.s]));
  let calib = 1; try { calib = JSON.parse(db.prepare("select value from ml_model where key='calibration_factor'").get().value) || 1; } catch { }
  // learned equipment risk (spi/ml/train_more.py): the highest chance of a notification in 3 months among the part's locations
  const risk = new Map(); try { for (const r of db.prepare("select e.material_no, max(r.p_notif_3m) p, (select tag from ml_equip_risk x where x.funcloc = e.funcloc) t from part_equipment e join ml_equip_risk r using(funcloc) group by 1").all()) risk.set(r.material_no, r.p); } catch { }
  // for the AI review: last 12 months of use per part, months with use, planned maintenance on the part's locations in the next 12 months
  const last12 = months.slice(-12), hist = new Map(); for (const r of db.prepare(`select material_no, sum(qty) q, count(*) n from demand_month where month >= ? group by 1`).all(last12[0])) hist.set(r.material_no, { h12: r.q / 12, a12: r.n });
  const fut = new Set(Array.from({ length: 12 }, (_, i) => { let [y, m] = months[months.length - 1].split("-").map(Number); m += i + 1; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12) + 1; return `${y}-${String(m).padStart(2, "0")}`; })), dueLoc = new Map();
  for (const r of db.prepare("select funcloc, start_of_cycle s, cast(cycle_months as integer) c from maint_item where cycle_months >= 1 and start_of_cycle is not null").all()) { let [y, m] = r.s.slice(0, 7).split("-").map(Number), k = 0, n = 0; while (k++ < 300) { const ym = `${y}-${String(m).padStart(2, "0")}`; if (ym > [...fut].pop()) break; if (fut.has(ym)) n++; m += r.c; while (m > 12) { m -= 12; y++; } } if (n) dueLoc.set(r.funcloc, (dueLoc.get(r.funcloc) || 0) + n); }
  const planned = new Map(); for (const r of db.prepare("select material_no, funcloc from part_equipment").all()) { const n = dueLoc.get(r.funcloc); if (n) planned.set(r.material_no, (planned.get(r.material_no) || 0) + n); }
  let campRatio = 2.5; try { campRatio = JSON.parse(db.prepare("select value from ml_model where key='campaign_ratio_plant'").get().value) || 2.5; } catch { }
  const s = { price, months, iss, po, rc, camp, bt, sq, calib, risk, hist, planned, campRatio, campMM: new Set(camp.map((m) => m.slice(5))) }; stat.set(db, s); return s;
}
export function golden(db, q = {}) {
  const key = JSON.stringify(Object.keys(q).filter((k) => k !== "all" && q[k] !== "" && q[k] != null).sort().map((k) => [k, String(q[k])])); if (cache.has(key)) return cache.get(key);
  const S0 = statics(db), H = db.prepare("select max(month) m from movement").get().m, cutoffDay = db.prepare("select max(posting_date) d from movement").get().d, F = Array.from({ length: 12 }, (_, i) => add(H, i + 1)), M = 12;
  const svc = { ...ECON.service }; for (const c of "SABC") if (q["service_" + c]) svc[c] = Math.min(0.999, Math.max(0.5, Number(q["service_" + c])));
  const dem = Math.min(3, Math.max(0.2, Number(q.demand) || 1)), lf = Math.min(3, Math.max(0.3, Number(q.lead) || 1)), car = Math.min(0.6, Math.max(0.02, Number(q.carrying) || ECON.carrying_rate)), budget = Number(q.budget) > 0 ? Number(q.budget) : null, camp = String(q.campaign) === "1", runs = Number(q.runs) > 0 ? Math.min(500, Math.max(20, Number(q.runs))) : 0;
  const seed0 = Number(q.seed) > 0 ? Math.floor(Number(q.seed)) : 1; let seed = seed0; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }, gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  let where = "1=1", args = [], scope = { kind: "plant", label: "all parts" };
  if (q.mat) { where = "m.material_no=?"; args = [Number(q.mat)]; scope = { kind: "part", label: String(q.mat) }; }
  else if (q.set) { const t = String(q.set).toUpperCase().replace(/^PX_/, ""), st = db.prepare("select tag, name, funcloc from equipment_set where tag=? or funcloc=?").get(t, "PX_" + t), fl = st ? st.funcloc : "PX_" + t; where = "m.material_no in (select material_no from bom where funcloc=? or funcloc like ?)"; args = [fl, fl + "-%"]; scope = { kind: "set", label: st ? st.tag + " " + st.name : t }; }
  else if (q.tag) { const t = String(q.tag).toUpperCase().replace(/^PX_/, ""); where = "m.material_no in (select material_no from part_equipment where funcloc=? or funcloc like ?)"; args = ["PX_" + t, "PX_" + t + "-%"]; scope = { kind: "tag", label: t }; }
  else if (q.cls) { where = "m.material_no in (select e.material_no from part_equipment e join funcloc f using(funcloc) where f.eq_class=?)"; args = [String(q.cls).toUpperCase()]; scope = { kind: "class", label: String(q.cls).toUpperCase() }; }
  if (q.crit) { const cs = String(q.crit).toUpperCase().split(/[ ,]+/).filter((c) => "SABC".includes(c) && c); if (cs.length) { where += ` and coalesce(p.crit_max,'C') in (${cs.map(() => "?").join(",")})`; args.push(...cs); scope.label += " (criticality " + cs.join(", ") + ")"; } }
  // lead time: the part's PO history; without history the learned lead time (ml_leadtime, spi/ml/train_more.py) unless lead_model=default (the 60-day default of the contract)
  const LT = String(q.lead_model || "learned") !== "default" && !!db.prepare("select 1 from sqlite_master where name='ml_leadtime'").get();
  const parts = db.prepare(`select m.material_no, m.descr, m.unit, m.mrp_type, coalesce(p.stock,m.stock,0) stock, coalesce(p.min_qty,m.min_qty,0) min_qty, coalesce(p.max_qty,m.max_qty,0) max_qty, coalesce(p.unit_price_idr,m.last_unit_price_idr,0) price, coalesce(p.crit_max,'C') crit,
    p.lt_median, p.lt_p90, p.total_qty, p.n_issues, p.months_since_last, coalesce(p.installed_total,0) installed, x.mu ml_mu, x.sd ml_sd, x.p_any ml_p, x.campaign_uplift, ${LT ? "lt.lead_pred_days lt_ml, lt.lead_pred_p90_days lt_ml90" : "null lt_ml, null lt_ml90"} from material m left join part_profile p using(material_no) left join ml_part x using(material_no) ${LT ? "left join ml_leadtime lt using(material_no)" : ""} where ${where}`).all(...args);
  const ids = new Set(parts.map((p) => p.material_no)), fc = {};
  const fq = ids.size <= 900 ? db.prepare(`select material_no, month, p_issue, expected_qty, qty_if_issued_low, qty_if_issued_high from ml_forecast where material_no in (${[...ids].map(() => "?").join(",") || "0"})`).all(...ids) : db.prepare("select material_no, month, p_issue, expected_qty, qty_if_issued_low, qty_if_issued_high from ml_forecast").all();
  for (const r of fq) { if (!ids.has(r.material_no)) continue; (fc[r.material_no] = fc[r.material_no] || {})[r.month] = r; }
  const open = {}; for (const r of db.prepare("select material_no, substr(po_delivery,1,7) m, sum(qty) q from po_line where po_delivery > ? group by 1,2").all(H + "-31")) { if (ids.has(r.material_no)) (open[r.material_no] = open[r.material_no] || {})[r.m] = r.q; }
  const nR = runs || (parts.length > 2000 ? 30 : parts.length > 200 ? 60 : 300);
  // campaign: the calendar months of the history's campaign months repeat, with the learned uplift of each part (ml_part.campaign_uplift)
  const campF = F.map((m) => (camp && S0.campMM.has(m.slice(5)) ? S0.campRatio : 1)), campAvg = campF.reduce((s, x) => s + x, 0) / M;
  const useReview = String(q.review ?? "1") !== "0"; let adj = {}; try { adj = q.adj ? (typeof q.adj === "string" ? JSON.parse(q.adj) : q.adj) : {}; } catch { adj = {}; } const reviews = [];
  const A = { carrying_rate: car, order_cost_idr: ECON.order_cost_idr, emergency_premium: ECON.emergency_premium, lead_default: ECON.lead_default * lf, lead_delay_days: 0, demand_factor: dem * campAvg, downtime_idr_h: ECON.downtime_idr_h, hours_per_stockout: ECON.hours_per_stockout, downtime_share: ECON.downtime_share };
  const dtH = (c) => (ECON.downtime_share[c] ?? 0) * (ECON.hours_per_stockout[c] || 0), dtCost = (c) => dtH(c) * (ECON.downtime_idr_h[c] || 0);
  // simulated accumulators: k = g (Optimized Scenario), c (today's Min and Max)
  const blank = () => ({ hold: 0, order: 0, short: 0, down: 0, buy: 0, events: 0, dhours: 0, emerg: 0, wc: 0, mcost: new Float64Array(M), mbuy: new Float64Array(M), so: new Float64Array(M), dm: { S: 0, A: 0, B: 0, C: 0 }, ok: { S: 0, A: 0, B: 0, C: 0 } });
  const sim = { g: blank(), c: blank() }, val = { g: Array.from({ length: M }, () => new Float64Array(nR)), c: Array.from({ length: M }, () => new Float64Array(nR)) };
  const steady = { g: { hold: 0, order: 0, short: 0, down: 0, events: 0, dhours: 0, wc: 0, parts_changed: 0 }, c: { hold: 0, order: 0, short: 0, down: 0, events: 0, dhours: 0, wc: 0 } };
  const byMonth = F.map((m) => ({ month: m, parts: 0, qty: 0, value: 0, S: 0, A: 0, B: 0, C: 0, value_S: 0, value_A: 0, value_B: 0, value_C: 0 })), perPart = [], queue = [], decisions = { order_now: 0, order_by: 0, no_order: 0, buy_when_needed: 0, no_use: 0 };
  const single = parts.length === 1, qfan = single ? { g: Array.from({ length: M }, () => new Float64Array(nR)), c: Array.from({ length: M }, () => new Float64Array(nR)) } : null;
  const dQ = Array.from({ length: M }, () => new Float64Array(nR)), dV = Array.from({ length: M }, () => new Float64Array(nR)), dMean = new Float64Array(M), dArr = new Float64Array(nR * M), lArr = new Int32Array(nR * M), opA = new Float64Array(M), pp = new Float64Array(M), Fi = new Map(F.map((m, i) => [m, i]));
  for (const p0 of parts) {
    const f = fc[p0.material_no] || {}, upl = p0.campaign_uplift || S0.campRatio, campP = F.map((m) => (camp && S0.campMM.has(m.slice(5)) ? upl : 1)), campAvgP = campP.reduce((s, x) => s + x, 0) / M;
    // the AI review decides the demand basis before anything is calculated (spi/ai/review.js)
    const hs = S0.hist.get(p0.material_no) || { h12: 0, a12: 0 }, leadB0 = p0.lt_median ? "PO history" : p0.lt_ml ? "learned" : "default";
    let rv = useReview ? reviewPart({ material_no: p0.material_no, crit: p0.crit, stock: p0.stock, stock_item: p0.mrp_type === "Stock Item", mu: (p0.ml_mu || 0), hist12: hs.h12, n_issues: p0.n_issues || 0, months_since_last: p0.months_since_last, equip_risk_3m: S0.risk.get(p0.material_no), planned_12m: S0.planned.get(p0.material_no) || 0, lead_basis: leadB0, price: p0.price, installed: p0.installed, campaign: camp, campaign_uplift: upl }) : { basis: "learned", factor: 1, insurance: false, flags: [], reason: "Review switched off." };
    const ax = Number(adj[p0.material_no]); if (useReview && isFinite(ax) && ax > 0) rv = { ...rv, basis: "ai", factor: Math.min(GUARD.max, Math.max(GUARD.min, ax)), reason: "Factor proposed by the AI review and accepted inside the guardrails." };
    if (useReview) { reviews.push(rv); if (scope.kind === "plant") LAST_REVIEW.set(p0.material_no, { ...rv, hist12: hs.h12 }); }
    const fac = rv.basis === "history" ? 1 : rv.factor, hb = rv.basis === "history", piH = Math.min(0.95, Math.max(0.05, hs.a12 / 12)), szH = hs.h12 / piH;
    const mu = F.map((m, i) => (hb ? hs.h12 : (f[m]?.expected_qty || 0) * fac) * dem * campP[i]), pi = F.map((m) => Math.min(1, (hb ? piH : f[m]?.p_issue || 0) * (dem > 1 ? Math.min(1.5, dem) : 1)));
    const lo = F.map((m) => hb ? szH * 0.5 : (f[m]?.qty_if_issued_low || 0) * fac), hi = F.map((m) => hb ? szH * 1.5 : (f[m]?.qty_if_issued_high || 0) * fac);
    const Ap = { ...A, demand_factor: dem * campAvgP * fac };
    const muM = mu.reduce((s, x) => s + x, 0) / M, sdM = Math.sqrt(F.reduce((s, m, i) => { const sz = (lo[i] + hi[i]) / 2 * dem, sd = (hi[i] - lo[i]) / 2.56 * dem; return s + (pi[i] * (1 - pi[i]) * sz * sz + pi[i] * sd * sd); }, 0) / M);
    const leadBasis = p0.lt_median ? "PO history" : p0.lt_ml ? "learned" : "default", lt = (p0.lt_median || p0.lt_ml || ECON.lead_default) * lf, lt90 = (p0.lt_p90 || (p0.lt_median ? p0.lt_median : p0.lt_ml90 || p0.lt_ml) || ECON.lead_default) * lf;
    const L = Math.max(0.3, lt / MD), Lm = Math.max(1, Math.round(L)), crit = p0.crit, price = p0.price || 0;
    // the yearly cost function shared with /api/ws/advice; learned demand from ml_part
    const pe = { ...p0, lt_median: lt, lt_p90: lt90, sq: S0.sq.get(p0.material_no) || 0, ...(hb ? { ml_mu: hs.h12, ml_sd: Math.sqrt(piH * (1 - piH)) * szH, ml_p: 1 } : {}) }, cur = evalPart(pe, { mode: "current" }, Ap);
    const muY = cur.demand / 12, sdY = p0.ml_sd != null && p0.ml_mu != null && Math.abs(muY - p0.ml_mu * Ap.demand_factor) < 1e-9 ? p0.ml_sd * Ap.demand_factor : sdM, muL = muY * L, sdL = sdY * Math.sqrt(L);
    let best = null; if (muY > 0) { for (const cv of COVERS) for (const sv of [svc[crit] ?? 0.95, 0.99, 0.995, 0.999]) { if (sv < (svc[crit] ?? 0.95)) continue; const rp = Math.ceil(muL + Z(sv) * sdL), up = rp + Math.ceil(cv * muY), e = evalPart(pe, { mode: "fixed", rop: rp, max: up }, Ap); if (!best || e.total < best.e.total) best = { rop: rp, upTo: up, cover: cv, service: sv, e, source: "calculated" }; } }
    if (muY > 0 && (!best || cur.total <= best.e.total)) best = { rop: p0.min_qty, upTo: Math.max(p0.max_qty, p0.min_qty), cover: null, service: null, e: cur, source: "current" };
    // insurance spare decided by the review: keep at least one on hand for a critical part on equipment likely to need work
    if (rv.insurance && (!best || best.rop < 1)) { const rp = Math.max(1, best ? best.rop : 0), up = Math.max(rp, best ? best.upTo : 1); best = { rop: rp, upTo: up, cover: null, service: null, e: evalPart(pe, { mode: "fixed", rop: rp, max: up }, Ap), source: "insurance" }; }
    const rec = best ? best.e : cur, rop = best ? best.rop : 0, upTo = best ? best.upTo : 0;
    for (const [k, e] of [["c", cur], ["g", rec]]) { const s = steady[k], sh = e.shortUnits * price * A.emergency_premium; s.hold += e.hold; s.order += e.order; s.short += sh; s.down += e.shortCost - sh; s.events += e.events; s.dhours += e.events * dtH(crit); s.wc += e.value; }
    if (best && best.source === "calculated") steady.g.parts_changed++;
    opA.fill(0); for (const [m, x] of Object.entries(open[p0.material_no] || {})) if (Fi.has(m)) opA[Fi.get(m)] += x;
    const onOrder = Object.values(open[p0.material_no] || {}).reduce((s, x) => s + x, 0), pos0 = p0.stock + onOrder, nonStock = p0.mrp_type === "Non Stock";
    let decision, months_to_rop = null, order_by = null;
    if (muY <= 0) decision = "no_use"; else if (upTo <= 0) decision = nonStock ? "buy_when_needed" : "order_now"; else if (pos0 <= rop) decision = "order_now";
    else { months_to_rop = (pos0 - rop) / muY; if (months_to_rop <= M) { decision = "order_by"; order_by = new Date(Date.parse(cutoffDay) + (months_to_rop * MD - lt) * 864e5).toISOString().slice(0, 10); if (order_by <= cutoffDay) { order_by = cutoffDay; decision = "order_now"; } } else decision = "no_order"; }
    decisions[decision]++;
    const savingYr = cur.total - rec.total;
    // expected path for the order list (Optimized Scenario policy)
    let pos = pos0, s = p0.stock; const pipe = { ...(open[p0.material_no] || {}) }, pOrders = [];
    for (let i = 0; i < M; i++) { s += pipe[F[i]] || 0; if ((muM > 0 || rv.insurance) && upTo > 0 && pos <= rop) { const qy = Math.ceil(upTo - pos), arr = Math.min(M - 1, i + Lm); if (qy > 0) { const od = new Date(Date.parse(F[i] + "-01") - 864e5).toISOString().slice(0, 10), reason = i === 0 ? (pos0 <= rop ? "Stock and open orders are at or below the reorder point today" : "Stock and open orders reach the reorder point this month") : "Projected stock and open orders reach the reorder point in " + F[i];
      queue.push({ p: p0, i, qy, lag: arr - i, od, reason, stock: Math.max(0, Math.round(s)), cover: muY > 0 ? r0(qy / muY, 1) : null, lead: Math.round(lt), saving: savingYr, risk: dtCost(crit) * (svc[crit] ?? 0.95) + qy * price * 1e-9 }); pOrders.push({ month: F[i], order_date: od, qty: qy, arrives: F[arr], value_idr: Math.round(qy * price) }); pos += qy; if (i + Lm < M) pipe[F[arr]] = (pipe[F[arr]] || 0) + qy; } } s -= mu[i]; pos -= mu[i]; }
    // Monte Carlo: the same demand and lead-time draws for both policies
    const R = muM > 0 ? nR : 1;
    for (let r = 0; r < R; r++) for (let i = 0; i < M; i++) { dArr[r * M + i] = muM > 0 && rnd() < pi[i] ? Math.max(0, Math.exp(Math.log(Math.max(0.01, (lo[i] + hi[i]) / 2 * dem * campP[i])) + gauss() * 0.5)) : 0; lArr[r * M + i] = R > 1 ? Math.max(1, Math.round((lt + rnd() * Math.max(0, lt90 - lt)) / MD)) : Lm; }
    for (let i = 0; i < M; i++) { dMean[i] += mu[i]; if (R === nR) for (let r = 0; r < nR; r++) { const d = dArr[r * M + i]; dQ[i][r] += d; dV[i][r] += d * price; } }
    const pol = { g: { RP: rop, U: upTo, on: (muY > 0 || rv.insurance) && upTo > 0 }, c: { RP: p0.min_qty, U: Math.max(p0.max_qty, p0.min_qty), on: Math.max(p0.max_qty, p0.min_qty) > 0 } };
    const dc = dtCost(crit), dh = dtH(crit);
    for (const k of ["g", "c"]) { const { RP, U, on } = pol[k], A2 = sim[k], w = 1 / R;
      for (let r = 0; r < R; r++) { let st = p0.stock, ps = pos0; pp.set(opA);
        for (let i = 0; i < M; i++) { st += pp[i]; let mc = 0; if (on && ps <= RP) { const qy = Math.ceil(U - ps), Ld = lArr[r * M + i]; if (qy > 0) { ps += qy; A2.order += ECON.order_cost_idr * w; A2.buy += qy * price * w; A2.mbuy[i] += qy * price * w; mc += ECON.order_cost_idr; if (i + Ld < M) pp[i + Ld] += qy; } }
          const d = dArr[r * M + i]; if (d > 0) { A2.dm[crit] += w; if (d > st) { const shu = d - Math.max(0, st), fr = Math.min(1, shu / Math.max(1, d)), sc = dc * fr, pc = shu * price * ECON.emergency_premium; A2.down += sc * w; A2.short += pc * w; A2.events += w; A2.emerg += w; A2.dhours += dh * fr * w; A2.so[i] += w; mc += sc + pc; } else A2.ok[crit] += w; }
          st = Math.max(0, st - d); ps -= d; const hc = st * price * car / 12; A2.hold += hc * w; mc += hc; A2.mcost[i] += mc * w; A2.wc += st * price * w / M;
          if (R === nR) val[k][i][r] += st * price; else { const vi = val[k][i], x = st * price; for (let rr = 0; rr < nR; rr++) vi[rr] += x; }
          if (qfan) { if (R === nR) qfan[k][i][r] = st; else qfan[k][i].fill(st); } } } }
    perPart.push({ material_no: p0.material_no, descr: p0.descr, unit: p0.unit, crit, mrp_type: p0.mrp_type, stock: p0.stock, on_order: onOrder, min_qty: p0.min_qty, max_qty: p0.max_qty, min_now: p0.min_qty, max_now: p0.max_qty, rop, order_up_to: upTo, policy_source: best ? best.source : "none", cover_months: best ? best.cover : null, service_used: best ? best.service : null,
      decision, order_by, months_to_rop: r0(months_to_rop, 1), stockout_chance_in_lead_time: muY > 0 ? r0(sdL > 0 ? 1 - Phi((pos0 - muL) / sdL) : pos0 < muL ? 1 : 0, 3) : 0, months_of_cover: muY > 0 ? r0(pos0 / muY, 1) : null,
      mean_month: r0(muY, 3), sd_month: r0(sdY, 3), lead_days: Math.round(lt), lead_p90_days: Math.round(lt90), review: { basis: rv.basis, factor: rv.factor, insurance: rv.insurance, flags: rv.flags, reason: rv.reason }, lead_basis: leadBasis, equip_risk_3m: S0.risk.has(p0.material_no) ? r0(S0.risk.get(p0.material_no), 3) : null, forecast_12m: r0(muM * 12, 1), price, priced: price > 0, saving_idr_yr: Math.round(savingYr), cost_current_yr: Math.round(cur.total), cost_optimized_yr: Math.round(rec.total), orders: pOrders });
  }
  // budget: fund orders month by month, criticality first, then risk; an order that does not fit waits for the next month with room
  queue.sort((a, b) => a.i - b.i || "SABC".indexOf(a.p.crit) - "SABC".indexOf(b.p.crit) || b.risk - a.risk);
  const left = F.map(() => budget ?? Infinity), orders = []; let unfunded = 0, unfundedValue = 0, deferred = 0;
  for (const o of queue) { const v = o.qy * o.p.price; let j = o.i; while (j < M && v > left[j]) j++; if (j >= M) { unfunded++; unfundedValue += v; continue; } left[j] -= v; if (j > o.i) deferred++;
    const b = byMonth[j]; b.parts++; b.qty += o.qy; b.value += v; b[o.p.crit]++; b["value_" + o.p.crit] += v;
    orders.push({ month: F[j], order_date: j > o.i ? new Date(Date.parse(F[j] + "-01") - 864e5).toISOString().slice(0, 10) : o.od, material_no: o.p.material_no, descr: o.p.descr, crit: o.p.crit, qty: o.qy, unit: o.p.unit, months_covered: o.cover, value: Math.round(v), value_idr: o.p.price > 0 ? Math.round(v) : null, lead_days: o.lead, stock: o.stock, reason: o.reason, saving_idr_yr: Math.round(o.saving), funded_month: F[j], deferred_from: j > o.i ? F[o.i] : null, arrives: F[Math.min(M - 1, j + o.lag)] }); }
  const pct = (a, x) => { const s = Array.from(a).sort((u, v) => u - v); return s[Math.min(s.length - 1, Math.floor(x * s.length))] || 0; };
  const fan = (arr, k = 0) => ({ p10: arr.map((a) => r0(pct(a, 0.1), k)), p50: arr.map((a) => r0(pct(a, 0.5), k)), p90: arr.map((a) => r0(pct(a, 0.9), k)) });
  const simOut = (k) => { const s = sim[k], c = { hold: Math.round(s.hold), order: Math.round(s.order), short: Math.round(s.short), downtime: Math.round(s.down), buy: Math.round(s.buy) };
    return { fan: fan(val[k]), stockout_chance: Array.from(s.so).map((x) => r0(x, 3)), cost: { ...c, holding: c.hold, ordering: c.order, shortage: c.short, purchase: c.buy, total: c.hold + c.order + c.short + c.downtime },
      cost_month: Array.from(s.mcost).map((x) => Math.round(x)), purchase_month: Array.from(s.mbuy).map((x) => Math.round(x)), stockouts_per_year: r0(s.events, 1), emergency_orders: r0(s.emerg, 1), downtime_hours: r0(s.dhours, 1), working_capital: Math.round(s.wc),
      service_reached: Object.fromEntries("SABC".split("").map((c) => [c, s.dm[c] > 0 ? r0(s.ok[c] / s.dm[c], 3) : null])), ...(qfan ? { qty_fan: fan(qfan[k], 1) } : {}) }; };
  const stOut = (k) => { const s = steady[k]; return { holding: Math.round(s.hold), ordering: Math.round(s.order), shortage: Math.round(s.short), downtime: Math.round(s.down), total: Math.round(s.hold + s.order + s.short + s.down), stockouts_per_year: r0(s.events, 1), emergency_orders: r0(s.events, 1), downtime_hours: r0(s.dhours, 1), working_capital: Math.round(s.wc), ...(k === "g" ? { parts_changed: s.parts_changed } : {}) }; };
  // history on the same monthly axis, scoped to the parts
  const hm = S0.months, hix = new Map(hm.map((m, i) => [m, i])), history = { months: hm, issue_value: hm.map(() => 0), issue_qty: hm.map(() => 0), po_value: hm.map(() => 0), receipt_value: hm.map(() => 0), campaign_months: S0.camp, basis: "Data: issues (movement) at the last price, PO value (quantity x unit price) by request month, receipts by PO delivery date (Assumption: received on the delivery date). Campaign months: issues at least 1.5 times the median month." };
  for (const r of S0.iss) if (ids.has(r.material_no) && hix.has(r.month)) { const i = hix.get(r.month); history.issue_value[i] += r.q * (S0.price.get(r.material_no) || 0); history.issue_qty[i] += r.q; }
  for (const r of S0.po) if (ids.has(r.material_no) && hix.has(r.m)) history.po_value[hix.get(r.m)] += r.v || 0;
  for (const r of S0.rc) if (ids.has(r.material_no) && hix.has(r.m)) history.receipt_value[hix.get(r.m)] += r.v || 0;
  for (const k of ["issue_value", "po_value", "receipt_value"]) history[k] = history[k].map((x) => Math.round(x)); history.issue_qty = history.issue_qty.map((x) => r0(x, 1));
  // backtest on the held-out months for the parts in scope
  const btm = {}; let inAll = 0, nAll = 0, inIss = 0, nIss = 0, inSz = 0; for (const id of ids) for (const r of S0.bt.get(id) || []) { const b = btm[r.month] = btm[r.month] || { a: 0, f: 0 }; b.a += r.actual; b.f += r.forecast; nAll++; const inside = r.actual >= r.band_low && r.actual <= r.band_high; if (inside) inAll++; if (r.actual > 0) { nIss++; if (inside) inIss++; if (r.size_low != null && r.actual >= r.size_low && r.actual <= r.size_high) inSz++; } }
  const bms = Object.keys(btm).sort(), act = bms.map((m) => r0(btm[m].a, 1)), fcs = bms.map((m) => r0(btm[m].f, 1)), fcc = bms.map((m) => r0(btm[m].f * S0.calib, 1));
  const mape = (f) => { const v = bms.map((m, i) => (act[i] > 0 ? Math.abs(f[i] - act[i]) / act[i] : null)).filter((x) => x != null); return v.length ? r0(v.reduce((s, x) => s + x, 0) / v.length, 3) : null; }, sa = act.reduce((s, x) => s + x, 0);
  const backtest = { months: bms, actual: act, forecast: fcs, forecast_calibrated: fcc, mape: mape(fcs), mape_calibrated: mape(fcc), bias: sa > 0 ? r0((fcs.reduce((s, x) => s + x, 0) - sa) / sa, 3) : null, bias_calibrated: sa > 0 ? r0((fcc.reduce((s, x) => s + x, 0) - sa) / sa, 3) : null, calibration_factor: S0.calib, basis: "Data: issue quantity in the held-out months. Estimate: forecast made before them by the same model (ml_backtest); calibrated = forecast x calibration factor, as used for the projection." };
  const calibration = { band: "80% (10% to 90%)", inside_all_part_months: nAll ? r0(inAll / nAll, 3) : null, inside_months_with_issue: nIss ? r0(inIss / nIss, 3) : null, size_band_inside_when_issued: nIss ? r0(inSz / nIss, 3) : null, note: "The size band (quantity if issued, 10% to 90%) is the calibrated range; whether a rare part is issued at all is a chance, scored by the Brier score of the model.", part_months: nAll, part_months_with_issue: nIss };
  const gS = simOut("g"), cS = simOut("c"), gT = stOut("g"), cT = stOut("c"), meas = single ? "chance of a stockout in the month" : "expected number of parts short in the month";
  const out = { months: F, cutoff: H, scope, parts: perPart.length, runs: nR, seed: seed0, inputs: { service: svc, demand: dem, lead: lf, carrying: car, budget, campaign: camp, lead_model: LT ? "learned" : "default" },
    orders: orders.sort((a, b) => a.month.localeCompare(b.month) || b.value - a.value).slice(0, 400), orders_total: orders.length, orders_value: Math.round(orders.reduce((s, o) => s + o.value, 0)), unfunded: budget ? { orders: unfunded, value: Math.round(unfundedValue), deferred } : null,
    by_month: byMonth.map((b) => ({ ...b, value: Math.round(b.value), value_S: Math.round(b.value_S), value_A: Math.round(b.value_A), value_B: Math.round(b.value_B), value_C: Math.round(b.value_C) })), decisions,
    golden: { ...gS, stockout_measure: meas }, current: { ...cS, stockout_measure: meas },
    totals: { basis: "Estimate, per year with the policy in place (steady state): average stock from the reorder point and order size, stockouts from the spread of lead-time demand. Same cost function as /api/ws/advice.", current: cT, golden: gT, saving: cT.total - gT.total },
    simulated_12m: { basis: "Estimate, first 12 months simulated from today's stock and open orders, so excess stock already on hand still carries cost.", current: cS.cost, golden: gS.cost, saving: cS.cost.total - gS.cost.total },
    demand: { basis: "Estimate: demand after the AI review, Monte Carlo of the learned issue chance and size", mean_qty: Array.from(dMean).map((x) => r0(x, 1)), fan_qty: fan(dQ, 1), fan_value: fan(dV) },
    history, backtest, calibration,
    review_factors: useReview ? Object.fromEntries(perPart.filter((x) => x.review.basis !== "learned").map((x) => [x.material_no, { basis: x.review.basis, factor: x.review.factor, hist12: x.review.basis === "history" ? r0((S0.hist.get(x.material_no) || {}).h12 || 0, 3) : null }])) : {},
    review: useReview ? (() => { const sm = summarise(reviews), last12 = S0.months.slice(-12), cset = new Set(S0.camp); let iss12 = 0, ciss = 0; for (const r of S0.iss) if (ids.has(r.material_no) && last12.includes(r.month)) { iss12 += r.q; if (cset.has(r.month)) ciss += r.q; }
      const sc = scopeCheck({ forecast_12m: perPart.reduce((t, x) => t + (x.forecast_12m || 0), 0), issued_12m: iss12, campaign_issued_12m: ciss, campaign_months: S0.camp.filter((m) => last12.includes(m)), campaign_on: camp }); return { ...sm, scope_check: sc, text: sm.text + (sc ? " " + sc.text : "") }; })() : null,
    review_old: useReview ? { ...summarise(reviews), guardrail: GUARD, parts_flagged: perPart.filter((x) => x.review.flags.some((f) => f.severity === "warn") || x.review.basis !== "learned").sort((a, b) => "SABC".indexOf(a.crit) - "SABC".indexOf(b.crit) || Math.abs(b.review.factor - 1) - Math.abs(a.review.factor - 1)).slice(0, 60).map((x) => ({ material_no: x.material_no, descr: x.descr, crit: x.crit, ...x.review, forecast_12m: x.forecast_12m })) } : null,
    part: single ? perPart[0] || null : null, top_parts: [...perPart].sort((a, b) => b.saving_idr_yr - a.saving_idr_yr).slice(0, 25).map(({ orders: o, ...r }) => ({ ...r, orders: o.length })),
    basis: "Estimate. Learned demand (ml_forecast, ml_part), lead time from PO history, service target by criticality; policy per part never dearer than today's Min and Max; Monte Carlo of demand and lead time with seed " + seed0 + " and " + nR + " runs. Inputs are Assumptions; money uses the last price per part." };
  if (out.review_old) out.review = { ...out.review_old, ...out.review }; delete out.review_old;
  out.saving_per_year = out.totals.saving; out.saving_first_12m = out.simulated_12m.saving;
  if (cache.size > 40) cache.clear(); cache.set(key, out); return out;
}
export default guard((req, res) => { const q = req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams); json(res, 200, golden(openDb(), q)); });
