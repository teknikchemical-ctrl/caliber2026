/* Text embeddings for meaning-based search. The page sends batches of record texts; vectors are cached on the server by content hash,
   so the first visitor pays the (free) embedding calls and everyone else reuses them. Gemini: batchEmbedContents with 256 dimensions. */
import { createHash } from "node:crypto";
import { J, cfgA, store, clientId, limit, cfg2, bump, statsToday } from "./_lib.mjs";
export const config = { path: "/api/embed" };
const DIM = 256;
const h = (m, t) => createHash("sha1").update(m + "|" + t).digest("hex").slice(0, 24);
const norm = v => { const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1; return v.map(x => +(x / n).toFixed(4)); };
function mockVec(t) { const v = new Array(64).fill(0); for (const w of String(t).toLowerCase().match(/[a-z0-9\-]{3,}/g) || []) { let x = 5381; for (const ch of w) x = ((x << 5) + x + ch.charCodeAt(0)) >>> 0; v[x % 64] += 1; } return norm(v); }
export default async (req, ctx) => {
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  const c = await cfgA();
  if (!(c.provider === "mock" || (c.provider === "gemini" && c.key))) return J({ error: "embeddings are not available on this server" }, 503);
  let p; try { p = JSON.parse(await req.text()); } catch { return J({ error: "invalid json" }, 400); }
  const texts = (Array.isArray(p.texts) ? p.texts : []).slice(0, 100).map(t => String(t).slice(0, 3000));
  if (!texts.length) return J({ error: "texts required" }, 400);
  const lm = await limit(clientId(req, ctx), { perMin: 40, perDay: 600, key: "emb" });
  if (!lm.ok) return J({ error: "too many requests", retry: lm.retry }, 429);
  const task = p.query ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT";
  const cacheModel = [c.provider, c.base, c.embedModel, task].join("|");
  const s = await store("emb"), out = new Array(texts.length).fill(null), miss = [];
  for (let i = 0; i < texts.length; i++) { const v = await s.get(h(cacheModel, texts[i])); if (v) out[i] = v; else miss.push(i); }
  if (miss.length) {
    const used = (await statsToday("emb")).n || 0;
    if (used + miss.length > c.embedDaily) return J({ error: "daily embedding budget used up" }, 429);
    try {
      let vecs;
      if (c.provider === "mock") vecs = miss.map(i => mockVec(texts[i]));
      else {
        const base = c.base || "https://generativelanguage.googleapis.com/v1beta", ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 22000);
        const r = await fetch(`${base}/models/${c.embedModel}:batchEmbedContents`, { method: "POST", signal: ctl.signal, headers: { "content-type": "application/json", "x-goog-api-key": c.key },
          body: JSON.stringify({ requests: miss.map(i => ({ model: "models/" + c.embedModel, content: { parts: [{ text: texts[i] }] }, outputDimensionality: DIM, taskType: task })) }) });
        clearTimeout(to);
        if (!r.ok) { let m = "HTTP " + r.status; try { m += ": " + JSON.parse(await r.text()).error.message.slice(0, 120); } catch {} throw new Error(m); }
        vecs = (await r.json()).embeddings.map(e => norm(e.values));
      }
      for (let k = 0; k < miss.length; k++) { out[miss[k]] = vecs[k]; await s.setJSON(h(cacheModel, texts[miss[k]]), vecs[k]); }
      await bump("emb", "n", miss.length);
    } catch (e) { return J({ error: "embedding error: " + String(e.message || e).slice(0, 160) }, 502); }
  }
  return J({ vectors: out, dim: out[0] ? out[0].length : 0, model: c.provider === "mock" ? "mock" : c.embedModel });
};
