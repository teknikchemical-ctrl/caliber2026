/* Diagnostics for the Settings panel: checks storage, the AI call and embeddings and reports each in plain language. */
import { J, store, cfg2 } from "./_lib.mjs";
export const config = { path: "/api/selftest" };
export default async (req) => {
  const c = cfg2(), out = [];
  const add = (name, ok, detail) => out.push({ name, ok, detail });
  try { const s = await store("rl"); await s.setJSON("selftest", { t: Date.now() }); const r = await s.get("selftest"); add("Shared storage", !!r, r ? "read and write work" : "write did not persist"); } catch (e) { add("Shared storage", false, String(e.message || e).slice(0, 140)); }
  const configured = c.provider === "mock" || (c.provider && c.key);
  add("AI key", !!configured, configured ? "provider " + c.provider + ", model " + c.model : "AI_API_KEY is not set on the server (set it in Netlify, then redeploy)");
  if (configured && c.provider !== "mock") {
    try {
      const base = c.provider === "openai" ? c.base : (c.base || "https://generativelanguage.googleapis.com/v1beta");
      const url = c.provider === "openai" ? base.replace(/\/$/, "") + "/models" : base + "/models?pageSize=50";
      const r = await fetch(url, { headers: c.provider === "openai" ? { authorization: "Bearer " + c.key } : { "x-goog-api-key": c.key } });
      if (!r.ok) throw new Error("HTTP " + r.status + (r.status === 400 || r.status === 403 ? " (the key is not accepted)" : ""));
      const j = await r.json(), names = (j.models || j.data || []).map(m => String(m.name || m.id).replace(/^models\//, ""));
      const has = names.includes(c.model);
      add("Provider connection", true, "key accepted, " + names.length + " models visible");
      add("Model " + c.model, has || !names.length, has ? "available to this key" : "not in the list for this key; the fallbacks " + c.fallbacks.join(", ") + " will be tried. Example models: " + names.filter(n => /gemini|flash|pro/.test(n)).slice(0, 5).join(", "));
    } catch (e) { add("Provider connection", false, String(e.message || e).slice(0, 160)); }
  }
  add("Access codes", true, ["edit", "approve", "admin"].map(k => k + ": " + (process.env[k.toUpperCase() + "_CODE"] ? "set" : "not set")).join(", "));
  return J({ ok: out.every(x => x.ok), checks: out });
};
