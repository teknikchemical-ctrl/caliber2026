/* AI connection settings, entered by an administrator in Settings. Saved on the server (never sent back to the browser) and used
   instead of the environment variables. Needs ADMIN_CODE to be set on the site. */
import { J, guard, saveCfg, storedCfg, cfgA } from "./_lib.mjs";
export const config = { path: "/api/config" };
const PROVIDERS = ["gemini", "openai"];
export default async (req) => {
  const g = guard(req, "admin");
  if (!g.ok) return J({ error: g.error, need: g.need }, g.status);
  if (req.method === "GET") {
    const o = await storedCfg(true), c = await cfgA();
    return J({ source: c.source, provider: c.provider, model: c.model, base: c.base, hasKey: !!c.key, keyEnd: c.key ? c.key.slice(-4) : "", saved: !!o.key });
  }
  if (req.method === "DELETE") { await saveCfg(null); return J({ ok: true }); }
  if (req.method !== "POST") return J({ error: "method not allowed" }, 405);
  let b; try { b = JSON.parse(await req.text()); } catch { return J({ error: "invalid json" }, 400); }
  const key = String(b.key || "").trim(), provider = String(b.provider || "gemini").toLowerCase(), model = String(b.model || "").trim().slice(0, 80), base = String(b.base || "").trim().slice(0, 200);
  if (!PROVIDERS.includes(provider)) return J({ error: "provider must be gemini or openai" }, 400);
  if (key.length < 12 || key.length > 300 || /\s/.test(key)) return J({ error: "that does not look like an API key" }, 400);
  if (provider === "openai" && !/^https:\/\//.test(base)) return J({ error: "an OpenAI compatible provider needs a base URL starting with https://" }, 400);
  await saveCfg({ provider, key, model, base });
  return J({ ok: true });
};
