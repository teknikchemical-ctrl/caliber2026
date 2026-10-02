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
export const cfg = () => ({
  provider: (process.env.AI_PROVIDER || (process.env.AI_API_KEY || process.env.GEMINI_API_KEY ? "gemini" : "")).toLowerCase(),
  key: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "",
  model: process.env.AI_MODEL || "gemini-2.5-flash",
  models: (process.env.AI_MODELS || "").split(",").map(s => s.trim()).filter(Boolean),
  base: process.env.AI_BASE_URL || "",
  daily: +process.env.AI_DAILY_MAX || 800,
  perMin: +process.env.AI_RATE_PER_MIN || 12,
  perDay: +process.env.AI_RATE_PER_DAY || 120
});
