// GET|POST /api/ws/suppliers (owner: Claude B). Supplier and lead-time explorer over PR PO.
// Inputs: crit (part criticality list), type (item type), q (supplier name), min_orders, sort (spend | lead | ontime | spread | orders), supplier (one supplier for the detail).
// Per supplier: order lines, purchase value (IDR lines), median and 9-in-10 lead time, spread, share delivered by the requested date, parts supplied and how many serve S or A equipment.
import { openDb, json, guard, body, num, list, fig, pay, median, quant, months } from "./_lib.mjs";
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), w = ["o.lead_days > 0", "o.lead_days < 720", "o.supplier is not null"], a = [];
  const cr = list(i.crit).map((x) => x.toUpperCase()); if (cr.length) { w.push(`p.crit_max in (${cr.map(() => "?").join(",")})`); a.push(...cr); }
  if (i.type) { w.push("t.item_type = ?"); a.push(String(i.type).toUpperCase()); }
  if (i.q) { w.push("o.supplier like ?"); a.push("%" + String(i.q).slice(0, 60) + "%"); }
  const L = db.prepare(`select o.supplier s, o.lead_days l, o.amount*o.qty amt, o.currency cur, o.po_delivery d, o.pr_delivery r, o.pr_date pd, o.material_no m, t.descr, t.item_type ty, p.crit_max c from pol o left join part_profile p using(material_no) left join material t using(material_no) where ${w.join(" and ")}`).all(...a);
  const by = {}; L.forEach((x) => { (by[x.s] = by[x.s] || []).push(x); });
  const minO = num(i.min_orders, 5, 1, 1000);
  let rows = Object.entries(by).map(([s, v]) => { const ls = v.map((x) => x.l), ot = v.filter((x) => x.d && x.r && x.d <= x.r).length; return { p10_lead: quant(ls, 0.1), p25_lead: quant(ls, 0.25), p75_lead: quant(ls, 0.75), supplier: s, orders: v.length, spend: v.filter((x) => x.cur === "IDR").reduce((t, x) => t + (x.amt || 0), 0), median_lead: median(ls), p90_lead: quant(ls, 0.9), spread: quant(ls, 0.9) / (median(ls) || 1), on_time: v.length ? ot / v.length : null, late: v.length - ot, parts: new Set(v.map((x) => x.m)).size, critical_parts: new Set(v.filter((x) => x.c === "S" || x.c === "A").map((x) => x.m)).size }; }).filter((x) => x.orders >= minO);
  const S = { spend: (x, y) => y.spend - x.spend, lead: (x, y) => y.median_lead - x.median_lead, ontime: (x, y) => x.on_time - y.on_time, spread: (x, y) => y.spread - x.spread, orders: (x, y) => y.orders - x.orders }; rows.sort(S[i.sort] || S.spend);
  const all = L.map((x) => x.l), bk = [[0, 30], [30, 60], [60, 90], [90, 120], [120, 180], [180, 720]], lab = ["Under 30 d", "30 to 60 d", "60 to 90 d", "90 to 120 d", "120 to 180 d", "Over 180 d"];
  let detail = null; if (i.supplier && by[i.supplier]) { const v = by[i.supplier], M = months("2025-05", 17), ls = v.map((x) => x.l), P = {};
    v.forEach((x) => { const k = x.m; P[k] = P[k] || { material_no: k, descr: x.descr, crit: x.c, orders: 0, median_lead: [] }; P[k].orders++; P[k].median_lead.push(x.l); });
    detail = { supplier: i.supplier, histogram: { labels: lab, values: bk.map(([p, q]) => ls.filter((x) => x >= p && x < q).length) }, monthly: { labels: M, orders: M.map((m) => v.filter((x) => String(x.pd).slice(0, 7) === m).length), spend: M.map((m) => v.filter((x) => String(x.pd).slice(0, 7) === m && x.cur === "IDR").reduce((t, x) => t + (x.amt || 0), 0)) },
      parts: Object.values(P).map((x) => ({ ...x, median_lead: median(x.median_lead) })).sort((x, y) => y.orders - x.orders).slice(0, 12) }; }
  /* critical parts that depend on slow or unreliable suppliers: S or A parts whose orders from a supplier take longer than the plant's 9-in-10 lead time or arrive late more often than on time */
  const p90all = quant(L.map((x) => x.l), 0.9), slow = {}; Object.entries(by).forEach(([s0, v]) => { const ot = v.filter((x) => x.d && x.r && x.d <= x.r).length / v.length, med = median(v.map((x) => x.l)); v.filter((x) => x.c === "S" || x.c === "A").forEach((x) => { if (med >= p90all * 0.6 || ot < 0.4) { const k = x.m; const z = slow[k] = slow[k] || { material_no: k, descr: x.descr, crit: x.c, supplier: s0, orders: 0, median_lead: med, on_time: ot }; z.orders++; } }); });
  const critSlow = Object.values(slow).sort((a, b) => "SABC".indexOf(a.crit) - "SABC".indexOf(b.crit) || b.median_lead - a.median_lead).slice(0, 25);
  const spend = rows.reduce((t, x) => t + x.spend, 0), ot = L.filter((x) => x.d && x.r && x.d <= x.r).length;
  json(res, 200, pay("ws.suppliers", i, { suppliers: rows.length, order_lines: L.length, histogram: { labels: lab, values: bk.map(([p, q]) => all.filter((x) => x >= p && x < q).length) }, rows: rows.slice(0, num(i.limit, 60, 1, 300)), detail, critical_on_slow: critSlow, plant_p90: p90all },
    [fig("suppliers", "Suppliers", rows.length, "suppliers"), fig("median", "Median lead time", median(all), "days"), fig("p90", "9 in 10 orders delivered within", quant(all, 0.9), "days"), fig("ontime", "Delivered by the requested date", L.length ? ot / L.length : null, "share", "Estimate"), fig("spend", "Purchase value", spend, "IDR")],
    ["PR PO (table po_line)", "part_profile (criticality)"], ["Purchase value = PR quantity x PO-Item Amount read as a unit price, IDR lines (Estimate). Lead time = PR date to PO delivery date. On time = PO delivery date on or before the PR requested delivery date. Lines with a lead time above 720 days or below 1 day are left out."]));
});
