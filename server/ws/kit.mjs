// GET|POST /api/ws/kit (owner: Claude B). Work-pack calculator: the spare parts that the planned tasks in a window need, against stock and open purchase orders.
// Inputs: the plan filters of /api/ws/plan (from, horizon, abc, priority, cycle, class, crit, system, q, loc, locs), factor (share of the installed quantity replaced per task, 0 to 1, Assumption),
//         factors {ITEM_TYPE: share} per item type overrides, lead_default (days when a part has no purchase history), include (comma list of part numbers to keep, optional), sort (shortage | cost | date | qty).
// Outputs: one line per part with required quantity, stock, quantity on order, shortage, first need date, order-by date, cost of the shortage; totals and a summary by item type.
import { openDb, json, guard, num, body, fig, pay, CUTOFF, addMonths } from "./_lib.mjs";
import { planItems, occurrences } from "./plan.mjs";
export default guard(async (req, res) => {
  const i = await body(req), db = openDb(), from = /^\d{4}-\d{2}$/.test(String(i.from || "")) ? String(i.from) : addMonths(CUTOFF.slice(0, 7), 1), horizon = num(i.horizon, 3, 1, 24);
  const f0 = num(i.factor, 0.25, 0, 1), fx = typeof i.factors === "string" ? (() => { try { return JSON.parse(i.factors); } catch { return {}; } })() : (i.factors || {}), lead0 = num(i.lead_default, 60, 1, 720);
  const items = planItems(db, i).map((it) => ({ ...it, occ: occurrences(it, from, horizon) })).filter((it) => it.occ.length);
  const byLoc = {}; items.forEach((it) => { (byLoc[it.funcloc] = byLoc[it.funcloc] || []).push(it); });
  const locs = Object.keys(byLoc); if (!locs.length) return json(res, 200, pay("ws.kit", { ...i, from, horizon }, { lines: [], totals: { lines: 0 }, tasks: 0, locations: 0, by_type: [] }, [], ["Mitem & Mplan", "BoM"]));
  const bom = []; for (let k = 0; k < locs.length; k += 400) { const ch = locs.slice(k, k + 400); bom.push(...db.prepare(`select b.funcloc, b.material_no, b.installed_qty from bom b where b.funcloc in (${ch.map(() => "?").join(",")})`).all(...ch)); }
  const need = {}; bom.forEach((b) => { byLoc[b.funcloc].forEach((it) => it.occ.forEach((d) => { const n = need[b.material_no] = need[b.material_no] || { qty_inst: 0, occ: 0, first: d, locs: new Set(), tasks: new Set() }; n.qty_inst += b.installed_qty || 1; n.occ++; if (d < n.first) n.first = d; n.locs.add(b.funcloc); n.tasks.add(it.item_no); })); });
  const mats = Object.keys(need).map(Number), info = {};
  for (let k = 0; k < mats.length; k += 500) { const ch = mats.slice(k, k + 500); db.prepare(`select t.material_no, t.descr, t.unit, t.item_type, t.mrp_type, p.stock, p.min_qty, p.max_qty, p.lt_median, p.unit_price_idr, p.crit_max, p.total_qty,
    (select coalesce(sum(qty),0) from pol o where o.material_no = t.material_no and o.po_delivery > ?) on_order,
    (select coalesce(sum(qty),0) from movement m where m.material_no = t.material_no and m.posting_date > date(?, '-12 months')) issued_12m
    from material t left join part_profile p on p.material_no = t.material_no where t.material_no in (${ch.map(() => "?").join(",")})`).all(CUTOFF, CUTOFF, ...ch).forEach((r) => { info[r.material_no] = r; }); }
  const types = {};
  let lines = mats.map((m) => { const n = need[m], p = info[m] || {}, share = fx[(p.item_type || "").toUpperCase()] != null ? Number(fx[(p.item_type || "").toUpperCase()]) : f0, req = Math.ceil(n.qty_inst * share), lead = p.lt_median || lead0;
    const avail = (p.stock || 0) + (p.on_order || 0), short = Math.max(0, req - avail), ob = new Date(Date.parse(n.first) - lead * 864e5).toISOString().slice(0, 10);
    const t = p.item_type || "OTHER"; types[t] = types[t] || { k: t, lines: 0, required: 0, short_lines: 0, cost: 0 }; types[t].lines++; types[t].required += req; if (short > 0) types[t].short_lines++; types[t].cost += short * (p.unit_price_idr || 0);
    return { material_no: m, descr: p.descr, unit: p.unit, item_type: t, crit_max: p.crit_max, share, required: req, stock: p.stock || 0, on_order: p.on_order || 0, shortage: short, first_need: n.first, lead_days: lead, lead_basis: p.lt_median ? "Purchase history median" : "Assumption",
      order_by: ob, late: ob < CUTOFF && short > 0, unit_price_idr: p.unit_price_idr, shortage_cost_idr: p.unit_price_idr ? short * p.unit_price_idr : null, issued_12m: p.issued_12m, locations: n.locs.size, tasks: n.tasks.size }; }).filter((l) => l.required > 0);
  const S = { shortage: (a, b) => (b.shortage_cost_idr || 0) - (a.shortage_cost_idr || 0) || b.shortage - a.shortage, cost: (a, b) => (b.shortage_cost_idr || 0) - (a.shortage_cost_idr || 0), date: (a, b) => a.order_by.localeCompare(b.order_by), qty: (a, b) => b.required - a.required };
  lines.sort(S[i.sort] || S.shortage);
  const tot = { lines: lines.length, short_lines: lines.filter((l) => l.shortage > 0).length, late_lines: lines.filter((l) => l.late).length, required: lines.reduce((s, l) => s + l.required, 0), shortage_cost_idr: lines.reduce((s, l) => s + (l.shortage_cost_idr || 0), 0), unpriced_short: lines.filter((l) => l.shortage > 0 && !l.unit_price_idr).length };
  json(res, 200, pay("ws.kit", { ...i, from, horizon, factor: f0, lead_default: lead0 }, { tasks: items.reduce((s, it) => s + it.occ.length, 0), items: items.length, locations: locs.length, totals: tot, by_type: Object.values(types).sort((a, b) => b.cost - a.cost), lines: lines.slice(0, num(i.limit, 400, 1, 2000)) },
    [fig("tasks", "Planned task occurrences in the window", items.reduce((s, it) => s + it.occ.length, 0), "tasks", "Estimate"), fig("short_lines", "Parts short for the window", tot.short_lines, "parts", "Estimate"), fig("late_lines", "Parts whose order-by date has already passed", tot.late_lines, "parts", "Estimate"), fig("shortage_cost", "Cost to cover the shortage", tot.shortage_cost_idr, "IDR", "Estimate")],
    ["Mitem & Mplan", "BoM (installed quantity)", "PR PO (open orders, lead time, unit price)", "Movement Material (issued in the last 12 months)"],
    ["The plan file does not list parts per task. Required quantity = installed quantity at the location x the replacement share (Assumption, editable) x task occurrences.", "On order = purchase order quantity with a delivery date after the data cut-off."]));
});
