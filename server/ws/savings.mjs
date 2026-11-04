// GET|POST /api/ws/savings (owner: Claude B). Savings planner: stock that could be released, what is realistic, and when the cash comes back.
// Each part is assigned to one release category in this order so that value is never counted twice: above Max (excess part), no issue in 17 months, issued in one or two months, Non Stock item holding stock.
// Inputs: scope {crit, type, q}, take {excess, idle, slow, nonstock: true|false}, realise {excess, idle, slow, nonstock: share 0..1}, recovery (share of book value recovered on disposal), exclude_sa (keep S and A parts),
//         keep_months (months of demand kept on hand for slow movers), months (phasing period), carrying_rate.
import { openDb, json, guard, body, num, fig, pay, months, addMonths, CUTOFF } from "./_lib.mjs";
import { portfolioParts } from "./costrisk.mjs";
const P = (v) => (typeof v === "string" ? (() => { try { return JSON.parse(v); } catch { return {}; } })() : v || {});
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), sc = P(i.scope), take = { excess: true, idle: true, slow: false, nonstock: true, ...P(i.take) }, rl = { excess: 0.6, idle: 0.4, slow: 0.3, nonstock: 0.5, ...P(i.realise) };
  const rec = num(i.recovery, 0.3, 0, 1), exSA = String(i.exclude_sa) !== "0", keepM = num(i.keep_months, 6, 0, 36), M = num(i.months, 12, 3, 36), cr = num(i.carrying_rate, 0.22, 0, 1);
  const extra = Object.fromEntries(db.prepare("select p.material_no, p.months_active, t.mrp_type from part_profile p join material t using(material_no)").all().map((r) => [r.material_no, r]));
  const L = { excess: "Above Max", idle: "No issue in 17 months", slow: "Issued in one or two months", nonstock: "Non Stock items holding stock" }, cat = {}, rows = [];
  Object.keys(L).forEach((k) => (cat[k] = { k, label: L[k], gross: 0, kept_sa: 0, candidate: 0, realisable: 0, parts: 0 }));
  portfolioParts(db, sc).forEach((p) => { if (!p.price || !(p.stock > 0)) return; const e = extra[p.material_no] || {}, mu = (p.total_qty || 0) / 17; let k = null, units = 0;
    if (p.max_qty > 0 && p.stock > p.max_qty) { k = "excess"; units = p.stock - p.max_qty; } else if (!(p.total_qty > 0)) { k = e.mrp_type === "Non Stock" ? "nonstock" : "idle"; units = p.stock; } else if ((e.months_active || 0) <= 2) { k = "slow"; units = Math.max(0, p.stock - Math.ceil(mu * keepM)); } else if (e.mrp_type === "Non Stock") { k = "nonstock"; units = Math.max(0, p.stock - Math.ceil(mu * keepM)); }
    if (!k || units <= 0) return; const v = units * p.price, c = cat[k]; c.gross += v; c.parts++; const sa = exSA && (p.crit === "S" || p.crit === "A"); if (sa) { c.kept_sa += v; return; } if (!take[k]) return; c.candidate += v; const r = v * (rl[k] ?? 0); c.realisable += r;
    rows.push({ material_no: p.material_no, descr: p.descr, crit: p.crit, category: k, units, value: v, realisable: r }); });
  const C = Object.values(cat), gross = C.reduce((s, c) => s + c.gross, 0), keptSA = C.reduce((s, c) => s + c.kept_sa, 0), notTaken = C.filter((c) => !take[c.k]).reduce((s, c) => s + c.gross - c.kept_sa, 0), cand = C.reduce((s, c) => s + c.candidate, 0), real = C.reduce((s, c) => s + c.realisable, 0), cash = real * rec;
  const from = addMonths(CUTOFF.slice(0, 7), 1), MM = months(from, M); let cum = 0; const phasing = MM.map((m, t) => { const share = 1 / M; cum += real * share; return { month: m, released: real * share, cash: real * share * rec, carrying_saved_cum: cum * cr / 12 }; });
  json(res, 200, pay("ws.savings", { scope: sc, take, realise: rl, recovery: rec, exclude_sa: exSA, keep_months: keepM, months: M, carrying_rate: cr },
    { gross, kept_sa: keptSA, not_selected: notTaken, candidate: cand, not_realised: cand - real, realisable: real, cash_recovered: cash, carrying_saved_per_year: real * cr, categories: C, phasing, top: rows.sort((a, b) => b.realisable - a.realisable).slice(0, 15) },
    [fig("gross", "Stock value that could be released", gross, "IDR", "Estimate"), fig("realisable", "Value released under the plan", real, "IDR", "Estimate"), fig("carrying", "Carrying cost avoided per year", real * cr, "IDR per year", "Estimate"), fig("cash", "Cash recovered on disposal", cash, "IDR", "Estimate")],
    ["part_profile (BoM stock, Min and Max, PR PO price, Movement Material demand)"], ["Realisation shares, recovery share, months of demand kept and the phasing are Assumptions."]));
});
