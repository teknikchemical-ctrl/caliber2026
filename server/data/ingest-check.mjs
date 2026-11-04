// POST /api/data/ingest-check {kind:"goods_issue"|"goods_receipt"|"stock_count", rows:[{material_no,qty,date,ref?,note?}]} (max 2000 rows)
// Validates rows against the baseline (material exists, quantity, date) and shows the effect on stock: before, after, status against Min and Max. Stateless: nothing is written. (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, fail, guard } from "../_lib/http.mjs";
const KINDS = { goods_issue: "Goods issue (stock decreases)", goods_receipt: "Goods receipt (stock increases)", stock_count: "Stock count (counted quantity replaces system stock)", stockout_observed: "Stockout observed (demand not met, stock unchanged)" };
const status = (s, mn, mx) => s <= 0 ? "Zero stock" : (mn > 0 && s < mn) ? "Below Min" : (mx > 0 && s > mx) ? "Above Max" : "Within Min and Max";
export default guard((req, res) => {
  if (req.method !== "POST") return fail(res, 405, "POST only");
  const b = req.body || {}, kind = b.kind, rows = Array.isArray(b.rows) ? b.rows : null;
  if (!KINDS[kind]) return fail(res, 400, "kind must be one of: " + Object.keys(KINDS).join(", "));
  if (!rows || !rows.length) return fail(res, 400, "rows is required");
  if (rows.length > 2000) return fail(res, 400, "at most 2000 rows per check");
  const db = openDb(), cut = (db.prepare("select value v from meta where key='data_cutoff'").get() || {}).v || "2026-09-30";
  const q = db.prepare("select p.material_no, m.descr, m.unit, p.crit_max, p.stock, p.min_qty, p.max_qty, p.unit_price_idr from part_profile p join material m using(material_no) where p.material_no = ?");
  const out = [], run = new Map(Object.entries(b.opening && typeof b.opening === "object" ? b.opening : {}).filter(([k, v]) => /^\d+$/.test(k) && Number.isFinite(Number(v))).map(([k, v]) => [k, Number(v)])); const sum = { rows: rows.length, ok: 0, rejected: 0, warnings: 0, qty_total: 0, value_idr: 0, parts: new Set(), unknown: 0, below_min_after: 0, zero_after: 0, above_max_after: 0 };
  rows.forEach((r, i) => {
    const err = [], warn = [], mat = String(r.material_no ?? "").trim().replace(/\.0+$/, ""), qty = (kind === "stockout_observed" && (r.qty === undefined || r.qty === "")) ? 0 : Number(String(r.qty ?? "").replace(/,/g, "")), date = String(r.date ?? "").trim();
    if (!/^\d{6,12}$/.test(mat)) err.push("material number is not a number"); const p = /^\d+$/.test(mat) ? q.get(Number(mat)) : null;
    if (/^\d{6,12}$/.test(mat) && !p) { err.push("material not in the baseline"); sum.unknown++; }
    if (!Number.isFinite(qty) || (kind === "stock_count" || kind === "stockout_observed" ? qty < 0 : qty <= 0)) err.push(kind === "stock_count" ? "counted quantity must be zero or more" : "quantity must be above zero");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) err.push("date must be YYYY-MM-DD"); else if (date > cut) warn.push("after the data cutoff " + cut + " (new activity)"); else if (date < "2025-05-01") warn.push("before the start of the baseline history (2025-05)");
    let before = null, after = null, st = null;
    if (!err.length && p) {
      before = run.has(mat) ? run.get(mat) : p.stock;
      after = kind === "goods_issue" ? before - qty : kind === "goods_receipt" ? before + qty : kind === "stockout_observed" ? before : qty;
      if (after < 0) { warn.push("issue is larger than stock on hand: stock would be negative"); after = 0; }
      run.set(mat, after); st = status(after, p.min_qty, p.max_qty);
      sum.parts.add(mat); sum.qty_total += kind === "stock_count" ? 0 : qty; if (p.unit_price_idr) sum.value_idr += (kind === "stock_count" ? Math.abs(qty - before) : qty) * p.unit_price_idr;
      if (st === "Zero stock") sum.zero_after++; else if (st === "Below Min") sum.below_min_after++; else if (st === "Above Max") sum.above_max_after++;
    }
    err.length ? sum.rejected++ : sum.ok++; if (warn.length) sum.warnings++;
    out.push({ row: i + 1, ok: !err.length, errors: err, warnings: warn, material_no: mat, descr: p && p.descr, unit: p && p.unit, crit: p && p.crit_max, qty, date, ref: r.ref || null, stock_before: before, stock_after: after, min_qty: p && p.min_qty, max_qty: p && p.max_qty, status_after: st });
  });
  json(res, 200, { kind, kind_label: KINDS[kind], data_cutoff: cut, summary: { ...sum, parts: sum.parts.size }, rows: out,
    notes: ["Stateless check: nothing is written to the baseline. Stock after is a running balance over the rows in order, starting from the baseline stock on hand.", "Value is quantity x last PO unit price (Estimate) and only for parts with a price."] });
});
