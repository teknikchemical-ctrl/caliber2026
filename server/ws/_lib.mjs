// Shared helpers of the workspace endpoints (owner: Claude B). Not an endpoint: the router never serves a file without a default export.
// Every ws endpoint answers {tool, inputs, outputs, figures:[{id,label,value,unit,basis}], sources:[...]} so that the page and the AI read one payload.
import { openDb as openDb0 } from "../_lib/db.mjs";
import { json, fail, qs, num, guard } from "../_lib/http.mjs";
/* PR PO repeats 5,420 rows as exact copies (11,609 rows, 6,189 distinct PR, PR item, PO, PO item lines): every B endpoint reads the view pol, one row per line. */
function openDb() { const d = openDb0(); if (!d.__pol) { d.exec("create temp view if not exists pol as select * from po_line where id in (select min(id) from po_line group by pr_no, pr_item, po_no, po_item)"); d.__pol = 1; } return d; }
export { openDb, json, fail, qs, num, guard };
export const CUTOFF = "2026-09-30";
export const meta = (db) => Object.fromEntries(db.prepare("select key, value from meta").all().map((r) => [r.key, r.value]));
export const fig = (id, label, value, unit, basis) => ({ id, label, value, unit: unit || "", basis: basis || "Data" });
export const pay = (tool, inputs, outputs, figures, sources, notes) => ({ tool, inputs, outputs, figures: figures || [], sources: sources || [], notes: notes || [] });
/* POST body or GET query, both accepted */
export async function body(req) {
  if (req.method !== "POST") return qs(req);
  if (req.body && typeof req.body === "object") return { ...qs(req), ...req.body };
  const chunks = []; for await (const c of req) chunks.push(c);
  try { return { ...qs(req), ...JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") }; } catch { return qs(req); }
}
export const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter(Boolean);
export const month = (d) => String(d || "").slice(0, 7);
export function addMonths(ym, k) { let [y, m] = ym.split("-").map(Number); m += k; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return `${y}-${String(m).padStart(2, "0")}`; }
export const months = (from, n) => Array.from({ length: n }, (_, i) => addMonths(from, i));
export const days = (a, b) => (a && b ? Math.round((Date.parse(b) - Date.parse(a)) / 86400000) : null);
export const median = (a) => { const s = a.filter((x) => x != null && isFinite(x)).sort((x, y) => x - y); if (!s.length) return null; const k = Math.floor(s.length / 2); return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
export const quant = (a, p) => { const s = a.filter((x) => x != null && isFinite(x)).sort((x, y) => x - y); if (!s.length) return null; return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; };
