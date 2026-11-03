/* Shared helpers for the Netlify Functions: storage, limits, responses.
   Storage is Netlify Blobs in production (free, no extra account). Set LOCAL_STORE_DIR to use a folder instead (local development and tests). */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const J = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });

function fileStore(name) {
  const dir = path.join(process.env.LOCAL_STORE_DIR, name);
  fs.mkdirSync(dir, { recursive: true });
  const f = k => path.join(dir, encodeURIComponent(k));
  return {
    async get(k) { try { return JSON.parse(fs.readFileSync(f(k), "utf8")); } catch { return null; } },
    async setJSON(k, v) { fs.writeFileSync(f(k), JSON.stringify(v)); },
    async delete(k) { try { fs.unlinkSync(f(k)); } catch {} },
    async list(o = {}) { const p = o.prefix || ""; return { blobs: fs.readdirSync(dir).map(decodeURIComponent).filter(k => k.startsWith(p)).sort().map(key => ({ key })) }; }
  };
}
const cache = {};
export async function store(name) {
  if (cache[name]) return cache[name];
  if (process.env.LOCAL_STORE_DIR) return (cache[name] = fileStore(name));
  const { getStore } = await import("@netlify/blobs");
  const s = getStore(name);
  return (cache[name] = {
    get: k => s.get(k, { type: "json" }).catch(() => null),
    setJSON: (k, v) => s.setJSON(k, v),
    delete: k => s.delete(k),
    list: o => s.list(o)
  });
}

export const clientId = (req, ctx) => {
  const ip = (ctx && ctx.ip) || req.headers.get("x-nf-client-connection-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  return createHash("sha256").update(ip + "|akp").digest("hex").slice(0, 16);
};

/* One small record per visitor: minute and day counters. Approximate by design (no locking), which is enough to stop casual abuse. */
export async function limit(id, { perMin, perDay, key = "ip" }) {
  const s = await store("rl"), now = Date.now(), min = Math.floor(now / 60000), day = new Date(now).toISOString().slice(0, 10);
  const k = key + "/" + id, r = (await s.get(k)) || {};
  if (r.m !== min) { r.m = min; r.mc = 0; }
  if (r.d !== day) { r.d = day; r.dc = 0; }
  if (r.mc >= perMin) return { ok: false, why: "rate", retry: 60 - Math.floor((now / 1000) % 60) };
  if (r.dc >= perDay) return { ok: false, why: "daily", retry: 3600 };
  r.mc++; r.dc++; await s.setJSON(k, r);
  return { ok: true };
}
export async function budget(max, peek = false) {
  const s = await store("rl"), day = new Date().toISOString().slice(0, 10), r = (await s.get("global")) || {};
  if (r.d !== day) { r.d = day; r.c = 0; }
  if (r.c >= max) return { ok: false, left: 0 };
  if (!peek) { r.c++; await s.setJSON("global", r); }
  return { ok: true, left: max - r.c };
}
export const cfg = (o = {}) => ({
  provider: (o.provider || process.env.AI_PROVIDER || (o.key || process.env.AI_API_KEY || process.env.GEMINI_API_KEY ? "gemini" : "")).toLowerCase(),
  key: o.key || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "",
  model: o.model || process.env.AI_MODEL || "gemini-flash-latest",
  models: (process.env.AI_MODELS || "").split(",").map(s => s.trim()).filter(Boolean),
  base: o.base || process.env.AI_BASE_URL || "",
  daily: +process.env.AI_DAILY_MAX || 800,
  perMin: +process.env.AI_RATE_PER_MIN || 12,
  perDay: +process.env.AI_RATE_PER_DAY || 120
});
export const cfg2 = (o = {}) => ({ ...cfg(o), fallbacks: (process.env.AI_MODEL_FALLBACK || "gemini-flash-latest,gemini-flash-lite-latest,gemini-2.5-flash,gemini-2.0-flash").split(",").map(s => s.trim()).filter(Boolean), embedModel: process.env.AI_EMBED_MODEL || "gemini-embedding-001", embedDaily: +process.env.AI_EMBED_DAILY || 4000 });
/* AI settings saved from the Settings page (admin) are kept on the server and win over the environment variables. */
let _stored = { at: 0, v: {} };
export async function storedCfg(force) {
  if (!force && Date.now() - _stored.at < 15000) return _stored.v;
  try { const s = await store("rl"); _stored = { at: Date.now(), v: (await s.get("aicfg")) || {} }; } catch { _stored = { at: Date.now(), v: {} }; }
  return _stored.v;
}
export async function cfgA() { const o = await storedCfg(); const c = cfg2(o); c.source = o.key ? "saved" : "environment"; return c; }
export async function saveCfg(v) { const s = await store("rl"); if (v) await s.setJSON("aicfg", v); else await s.delete("aicfg"); _stored = { at: 0, v: {} }; }

/* Optional access codes. All unset = fully open (default). EDIT_CODE protects every write, APPROVE_CODE protects approving
   knowledge items, ADMIN_CODE enables backup, restore, bulk removal and the AI settings (admin routes stay disabled while it is unset). */
export function guard(req, level) {
  const want = { edit: process.env.EDIT_CODE, approve: process.env.APPROVE_CODE, admin: process.env.ADMIN_CODE }[level];
  if (level === "admin" && !want) return { ok: false, status: 403, error: "admin routes are disabled: set ADMIN_CODE on the server" };
  if (!want) return { ok: true };
  const got = req.headers.get("x-" + level + "-code") || "";
  if (got.length !== want.length) return { ok: false, status: 401, error: level + " code required", need: level };
  let d = 0; for (let i = 0; i < want.length; i++) d |= want.charCodeAt(i) ^ got.charCodeAt(i);
  return d === 0 ? { ok: true } : { ok: false, status: 401, error: level + " code incorrect", need: level };
}
export async function bump(name, field, n = 1) {
  try { const s = await store("rl"), day = new Date().toISOString().slice(0, 10), k = "stats/" + name + "/" + day, r = (await s.get(k)) || {}; r[field] = (r[field] || 0) + n; await s.setJSON(k, r); } catch {}
}
export async function statsToday(name) {
  try { const s = await store("rl"); return (await s.get("stats/" + name + "/" + new Date().toISOString().slice(0, 10))) || {}; } catch { return {}; }
}

/* Google retires model names over time. When the configured model and its fallbacks are all refused as unknown, ask the key which models it can use
   and rank them: newest flash first, then flash-lite, then pro. Cached for ten minutes per key. */
let DISC = { at: 0, key: "", list: [] };
/* errors where the next model may still work: unknown model, quota used up on this model, or provider overloaded */
export const isRetryable = e => !!e && ([429, 500, 502, 503, 504].includes(e.status) || isModelError(e));
export const isModelError = e => !!e && [400, 404].includes(e.status) && /model|not found|not supported|no longer|deprecat|retired/i.test(String(e.message || ""));
export async function discoverModels(c, signal) {
  if (DISC.key === c.key && Date.now() - DISC.at < 600000 && DISC.list.length) return DISC.list;
  const base = c.base || "https://generativelanguage.googleapis.com/v1beta";
  const r = await fetch(base + "/models?pageSize=200", { headers: { "x-goog-api-key": c.key }, signal: signal || AbortSignal.timeout(5000) });
  if (!r.ok) return [];
  const j = await r.json(), score = n => {
    const v = (/gemini-(\d+(?:\.\d+)?)/.exec(n) || [0, 0])[1], fam = /flash-lite/.test(n) ? 1 : /flash/.test(n) ? 3 : /pro/.test(n) ? 2 : 0;
    return fam * 1000 + (/latest/.test(n) ? 500 : 0) + parseFloat(v) * 10 - (/preview|exp/.test(n) ? 5 : 0);
  };
  const list = (j.models || []).filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes("generateContent"))
    .map(m => String(m.name || "").replace(/^models\//, "")).filter(n => /^gemini-/.test(n) && !/embedding|image|tts|live|audio|vision|robotics|computer-use|learnlm|imagen|veo|aqa|thinking-exp|customtools/.test(n))
    .sort((a, b) => score(b) - score(a));
  DISC = { at: Date.now(), key: c.key, list };
  return list;
}
export const plantName = p => String((p && p.plant) || "process plant").replace(/[^\w .,&()\/|-]/g, "").slice(0, 80) || "process plant";
