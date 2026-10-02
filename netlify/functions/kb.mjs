/* Shared knowledge store. Collections: uk (knowledge items), wo (imported work orders), fb (feedback), audit, qa (answer log).
   Last write wins per item (by "updated"); deletes leave a tombstone so other browsers remove the item too. */
import { J, store, clientId, limit } from "./_lib.mjs";
export const config = { path: ["/api/kb/*", "/api/kb"] };
const ID = /^[A-Za-z0-9_.\-]{1,48}$/, MAX_BODY = 600000;
const touch = async s => { await s.setJSON("meta/rev", { rev: Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }); };
const rev = async s => ((await s.get("meta/rev")) || { rev: "0" }).rev;
const str = (v, n) => String(v == null ? "" : v).slice(0, n);
const stamp = o => str(o && (o.updated || o.u || o.t), 32);

async function all(s, prefix, cap = 5000) {
  const out = [], { blobs } = await s.list({ prefix });
  const keys = blobs.map(b => b.key).slice(0, cap);
  for (let i = 0; i < keys.length; i += 25) out.push(...await Promise.all(keys.slice(i, i + 25).map(k => s.get(k))));
  return out.filter(Boolean);
}
async function state(s) {
  const [uk, wo, fb, del] = await Promise.all([all(s, "uk/"), all(s, "wo/"), all(s, "fb/"), s.list({ prefix: "del/" })]);
  const lg = async p => { const { blobs } = await s.list({ prefix: p }); return (await Promise.all(blobs.slice(0, 300).map(b => s.get(b.key)))).filter(Boolean); };
  return { rev: await rev(s), uk, wo, fb, audit: await lg("audit/"), qa: await lg("qa/"), deleted: del.blobs.map(b => b.key.slice(4)) };
}
export default async (req, ctx) => {
  const url = new URL(req.url), parts = url.pathname.replace(/^\/api\/kb\/?/, "").split("/").filter(Boolean), s = await store("kb"), m = req.method;
  if (m === "OPTIONS") return J({});
  const [coll, id] = parts;
  if (m === "GET") {
    if (coll === "rev") return J({ rev: await rev(s) });
    if (coll === "state" || !coll) { const since = url.searchParams.get("since"), cur = await rev(s); return since && since === cur ? J({ rev: cur, changed: false }) : J({ changed: true, ...await state(s) }); }
    return J({ error: "not found" }, 404);
  }
  const cid = clientId(req, ctx), lm = await limit(cid, { perMin: 90, perDay: 3000, key: "kb" });
  if (!lm.ok) return J({ error: "rate limited", retry: lm.retry }, 429);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return J({ error: "too large" }, 413);
  let body = {}; if (raw) { try { body = JSON.parse(raw); } catch { return J({ error: "invalid json" }, 400); } }
  if (m === "POST" && (coll === "audit" || coll === "qa")) {
    const it = coll === "audit"
      ? { t: str(body.t, 24), who: str(body.who, 80), role: str(body.role, 24), act: str(body.act, 120), detail: str(body.detail, 600), ref: str(body.ref, 80) }
      : { ...body, q: str(body.q, 1000), answer: str(body.answer, 1500), id: str(body.id, 40), t: str(body.t, 24) };
    const key = coll + "/" + String(9e15 - Date.now()).padStart(16, "0") + "-" + Math.random().toString(36).slice(2, 6);
    await s.setJSON(key, it); return J({ ok: true });
  }
  if (!ID.test(id || "")) return J({ error: "bad id" }, 400);
  if (!["uk", "wo", "fb"].includes(coll)) return J({ error: "not found" }, 404);
  if (m === "PUT") {
    let item;
    if (coll === "uk") {
      if (!body || typeof body !== "object" || body.id !== id) return J({ error: "id mismatch" }, 400);
      item = { ...body, title: str(body.title, 200), text: str(body.text, 300000), status: str(body.status, 20) };
    } else if (coll === "wo") {
      if (!Array.isArray(body.rows) || body.rows.length > 5000) return J({ error: "bad rows" }, 400);
      item = { imp: id, rows: body.rows, updated: str(body.updated, 32) };
    } else item = { ...body, id, q: str(body.q, 600), note: str(body.note, 600) };
    const old = await s.get(coll + "/" + id), tomb = await s.get("del/" + id);
    if (tomb && !(body.revive)) return J({ ok: false, deleted: true }, 410);
    if (old && stamp(old) > stamp(item)) return J({ ok: true, item: old, kept: "server" });
    await s.setJSON(coll + "/" + id, item); if (tomb) await s.delete("del/" + id); await touch(s);
    return J({ ok: true, item });
  }
  if (m === "DELETE") {
    await s.delete(coll + "/" + id);
    if (coll === "uk") { await s.delete("wo/" + id); await s.setJSON("del/" + id, { t: new Date().toISOString() }); }
    await touch(s); return J({ ok: true });
  }
  return J({ error: "method not allowed" }, 405);
};
