// GET /api/data/golden : the optimized purchasing pathway ("golden path") with Monte Carlo uncertainty. (owner: Claude A)
// Scope: ?mat= | ?tag= | ?cls= | ?crit=S,A | ?all=1 (default all). Inputs: service_S..C, demand (factor), lead (factor), carrying, budget (IDR per month), campaign=1, runs.
// Per part: learned monthly demand (ml_forecast) and its spread, lead time (median and p90 from PO history), service target by criticality,
// reorder point = lead-time demand + z x sd, order-up-to = reorder point + economic order size. Each month: if stock plus open orders is at or
// below the reorder point, order up to the target; the order arrives after the lead time. The same rules run against today's Min and Max.
// Monte Carlo: demand drawn from the learned distribution (issue chance x lognormal size), lead time drawn between median and p90.
// Output: orders by month and part, stock value fan p10/p50/p90, stockout chance per month, yearly cost of each policy. Money is an Estimate.
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
import { ECON } from "../_lib/econ.mjs";
const add = (ym, k) => { let [y, m] = ym.split("-").map(Number); m += k; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return `${y}-${String(m).padStart(2, "0")}`; };
const Z = (p) => { const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924], b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857], c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878], d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742]; const q = Math.min(0.9999, Math.max(0.5, p)); if (q > 0.97575) { const r = Math.sqrt(-2 * Math.log(1 - q)); return -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } const r = q - 0.5, s = r * r; return (((((a[0] * s + a[1]) * s + a[2]) * s + a[3]) * s + a[4]) * s + a[5]) * r / (((((b[0] * s + b[1]) * s + b[2]) * s + b[3]) * s + b[4]) * s + 1); };
let seed = 1; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }, gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
const cache = new Map();
export function golden(db, q = {}) {
  const key = JSON.stringify(q); if (cache.has(key)) return cache.get(key);
  const H = db.prepare("select max(month) m from movement").get().m, F = Array.from({ length: 12 }, (_, i) => add(H, i + 1));
  const svc = { ...ECON.service }; for (const c of "SABC") if (q["service_" + c]) svc[c] = Math.min(0.999, Math.max(0.5, Number(q["service_" + c])));
  const dem = Math.min(3, Math.max(0.2, Number(q.demand) || 1)), lf = Math.min(3, Math.max(0.3, Number(q.lead) || 1)), car = Math.min(0.6, Math.max(0.02, Number(q.carrying) || ECON.carrying_rate)), budget = Number(q.budget) > 0 ? Number(q.budget) : null, camp = String(q.campaign) === "1", runs = Number(q.runs) > 0 ? Math.min(500, Math.max(20, Number(q.runs))) : 0;
  let where = "1=1", args = [];
  if (q.mat) { where = "m.material_no=?"; args = [Number(q.mat)]; }
  else if (q.tag) { const t = String(q.tag).toUpperCase().replace(/^PX_/, ""); where = "m.material_no in (select material_no from part_equipment where funcloc=? or funcloc like ?)"; args = ["PX_" + t, "PX_" + t + "-%"]; }
  else if (q.cls) { where = "m.material_no in (select e.material_no from part_equipment e join funcloc f using(funcloc) where f.eq_class=?)"; args = [String(q.cls).toUpperCase()]; }
  if (q.crit) { const cs = String(q.crit).toUpperCase().split(/[ ,]+/).filter((c) => "SABC".includes(c) && c); if (cs.length) { where += ` and p.crit_max in (${cs.map(() => "?").join(",")})`; args.push(...cs); } }
  const parts = db.prepare(`select m.material_no, m.descr, m.unit, m.mrp_type, coalesce(m.stock,0) stock, coalesce(m.min_qty,0) min_qty, coalesce(m.max_qty,0) max_qty, coalesce(m.last_unit_price_idr,0) price, coalesce(p.crit_max,'C') crit, coalesce(p.lt_median,?) lt, coalesce(p.lt_p90,p.lt_median,?) lt90 from material m left join part_profile p using(material_no) where ${where}`).all(ECON.lead_default, ECON.lead_default, ...args);
  const ids = new Set(parts.map((p) => p.material_no)), fc = {};
  const fq = ids.size <= 900 ? db.prepare(`select material_no, month, p_issue, expected_qty, qty_if_issued_low, qty_if_issued_high from ml_forecast where material_no in (${[...ids].map(() => "?").join(",") || "0"})`).all(...ids) : db.prepare("select material_no, month, p_issue, expected_qty, qty_if_issued_low, qty_if_issued_high from ml_forecast").all();
  for (const r of fq) { if (!ids.has(r.material_no)) continue; (fc[r.material_no] = fc[r.material_no] || {})[r.month] = r; }
  const open = {}; for (const r of db.prepare("select material_no, substr(po_delivery,1,7) m, sum(qty) q from po_line where po_delivery > ? group by 1,2").all(H + "-31")) { if (ids.has(r.material_no)) (open[r.material_no] = open[r.material_no] || {})[r.m] = r.q; }
  const nR = runs || (parts.length > 2000 ? 30 : parts.length > 200 ? 60 : 300), M = 12;
  const val = { g: Array.from({ length: M }, () => new Float64Array(nR)), c: Array.from({ length: M }, () => new Float64Array(nR)) };
  const so = { g: new Float64Array(M), c: new Float64Array(M) }, cost = { g: { hold: 0, order: 0, short: 0, buy: 0 }, c: { hold: 0, order: 0, short: 0, buy: 0 } };
  const orders = [], byMonth = F.map((m) => ({ month: m, parts: 0, qty: 0, value: 0, S: 0, A: 0, B: 0, C: 0 })), perPart = [];
  const dtCost = (c) => (ECON.downtime_share[c] ?? 0) * (ECON.hours_per_stockout[c] || 0) * (ECON.downtime_idr_h[c] || 0);
  let budgetLeft = F.map(() => budget ?? Infinity); const queue = [];
  for (const p of parts) {
    const f = fc[p.material_no] || {}, mu = F.map((m, i) => (f[m]?.expected_qty || 0) * dem * (camp && /-(12|01)$/.test(m) ? 2.5 : 1)), pi = F.map((m) => Math.min(1, (f[m]?.p_issue || 0) * (dem > 1 ? Math.min(1.5, dem) : 1)));
    const lo = F.map((m) => f[m]?.qty_if_issued_low || 0), hi = F.map((m) => f[m]?.qty_if_issued_high || 0);
    const muM = mu.reduce((s, x) => s + x, 0) / M, sdM = Math.sqrt(F.reduce((s, m, i) => { const sz = (lo[i] + hi[i]) / 2 * dem, sd = (hi[i] - lo[i]) / 2.56 * dem; return s + (pi[i] * (1 - pi[i]) * sz * sz + pi[i] * sd * sd); }, 0) / M);
    const L = Math.max(0.3, p.lt * lf / 30.4), Lm = Math.max(1, Math.round(L)), z = Z(svc[p.crit] ?? 0.95);
    const rop = muM > 0 ? Math.ceil(muM * L + z * sdM * Math.sqrt(L)) : 0, eoq = muM > 0 && p.price > 0 ? Math.sqrt(2 * muM * 12 * ECON.order_cost_idr / (p.price * car)) : muM, upTo = muM > 0 ? Math.ceil(rop + Math.max(1, eoq, muM)) : 0;
    const pol = { g: { rop, upTo }, c: { rop: p.min_qty, upTo: Math.max(p.max_qty, p.min_qty) } };
    if (p.mrp_type !== "Stock Item" && muM === 0) continue;
    // expected (deterministic) path for the order list, Monte Carlo for the fan
    let pos = p.stock + Object.values(open[p.material_no] || {}).reduce((s, x) => s + x, 0), s = p.stock; const pipe = { ...(open[p.material_no] || {}) }, pOrders = [];
    for (let i = 0; i < M; i++) { s += pipe[F[i]] || 0; if (muM > 0 && pos <= rop && upTo > 0) { const qy = Math.ceil(upTo - pos), arr = F[Math.min(M - 1, i + Lm)]; queue.push({ p, i, qy, arr, risk: (svc[p.crit] ?? 0.95) * dtCost(p.crit) + qy * p.price * 1e-9 }); pOrders.push({ month: F[i], qty: qy, arrives: arr }); pos += qy; if (i + Lm < M) pipe[arr] = (pipe[arr] || 0) + qy; } s -= mu[i]; pos -= mu[i]; }
    for (const k of ["g", "c"]) {
      const { rop: R, upTo: U } = pol[k]; let hold = 0, ord = 0, sh = 0, buy = 0;
      for (let r = 0; r < nR; r++) { let st = p.stock, ps = st + Object.values(open[p.material_no] || {}).reduce((a, x) => a + x, 0); const pp = { ...(open[p.material_no] || {}) };
        for (let i = 0; i < M; i++) { st += pp[F[i]] || 0; if (U > 0 && ps <= R && (muM > 0 || k === "c")) { const qy = Math.ceil(U - ps), Ld = Math.max(1, Math.round((p.lt + rnd() * Math.max(0, p.lt90 - p.lt)) * lf / 30.4)); if (qy > 0) { ps += qy; ord += ECON.order_cost_idr; buy += qy * p.price; if (i + Ld < M) pp[F[i + Ld]] = (pp[F[i + Ld]] || 0) + qy; } }
          const d = rnd() < pi[i] ? Math.max(0, Math.exp(Math.log(Math.max(0.01, (lo[i] + hi[i]) / 2 * dem)) + gauss() * 0.5)) : 0; if (d > st) { sh += dtCost(p.crit) * Math.min(1, (d - Math.max(0, st)) / Math.max(1, d)) + (d - Math.max(0, st)) * p.price * ECON.emergency_premium; so[k][i] += 1 / nR * (d > 0 ? 1 : 0); }
          st = Math.max(0, st - d); ps -= d; hold += st * p.price * car / 12; val[k][i][r] += st * p.price; } }
      cost[k].hold += hold / nR; cost[k].order += ord / nR; cost[k].short += sh / nR; cost[k].buy += buy / nR; }
    perPart.push({ material_no: p.material_no, descr: p.descr, unit: p.unit, crit: p.crit, stock: p.stock, min_qty: p.min_qty, max_qty: p.max_qty, rop, order_up_to: upTo, lead_days: Math.round(p.lt * lf), forecast_12m: Math.round(muM * 12 * 10) / 10, orders: pOrders, price: p.price });
  }
  // budget: fund orders by criticality risk first, month by month
  queue.sort((a, b) => a.i - b.i || "SABC".indexOf(a.p.crit) - "SABC".indexOf(b.p.crit) || b.risk - a.risk);
  for (const o of queue) { const v = o.qy * o.p.price; if (v > budgetLeft[o.i]) continue; budgetLeft[o.i] -= v; const b = byMonth[o.i]; b.parts++; b.qty += o.qy; b.value += v; b[o.p.crit] = (b[o.p.crit] || 0) + 1; orders.push({ month: F[o.i], material_no: o.p.material_no, descr: o.p.descr, crit: o.p.crit, qty: o.qy, unit: o.p.unit, value: Math.round(v), arrives: o.arr }); }
  const pct = (a, x) => { const s = Array.from(a).sort((u, v) => u - v); return s[Math.min(s.length - 1, Math.floor(x * s.length))] || 0; };
  const fan = (k) => ({ p10: val[k].map((a) => Math.round(pct(a, 0.1))), p50: val[k].map((a) => Math.round(pct(a, 0.5))), p90: val[k].map((a) => Math.round(pct(a, 0.9))) });
  const tot = (c) => ({ ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v)])), total: Math.round(c.hold + c.order + c.short) });
  const out = { months: F, cutoff: H, parts: perPart.length, runs: nR, inputs: { service: svc, demand: dem, lead: lf, carrying: car, budget, campaign: camp }, orders: orders.sort((a, b) => a.month.localeCompare(b.month) || b.value - a.value).slice(0, 400), orders_total: orders.length, by_month: byMonth.map((b) => ({ ...b, value: Math.round(b.value) })),
    golden: { fan: fan("g"), stockout_measure: parts.length === 1 ? "chance of a stockout in the month" : "expected number of parts short in the month", stockout_chance: Array.from(so.g).map((x) => Math.round(x * 1000) / 1000), cost: tot(cost.g) }, current: { fan: fan("c"), stockout_chance: Array.from(so.c).map((x) => Math.round(x * 1000) / 1000), cost: tot(cost.c) },
    part: parts.length === 1 ? perPart[0] || null : null, top_parts: perPart.sort((a, b) => b.forecast_12m * b.price - a.forecast_12m * a.price).slice(0, 25).map(({ orders: o, ...r }) => ({ ...r, orders: o.length })),
    basis: "Estimate. Learned demand (ml_forecast), lead time from PO history, service by criticality; Monte Carlo of demand and lead time. Inputs are Assumptions." };
  out.saving_per_year = out.current.cost.total - out.golden.cost.total;
  if (cache.size > 40) cache.clear(); cache.set(key, out); return out;
}
export default guard((req, res) => { const q = req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams); json(res, 200, golden(openDb(), q)); });
