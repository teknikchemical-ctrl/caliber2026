import { J, store, cfg, budget } from "./_lib.mjs";
export const config = { path: "/api/health" };
export default async () => {
  const c = cfg();
  let st = "ok";
  try { const s = await store("kb"); await s.get("meta/rev"); } catch (e) { st = "error: " + String(e.message || e).slice(0, 80); }
  const configured = !!(c.provider === "mock" || (c.provider && c.key));
  let left = null;
  if (configured) { try { left = (await budget(c.daily, true)).left; } catch {} }
  return J({ ok: true, version: "1.0", store: st, ai: { configured, provider: c.provider || "", model: c.model, models: c.models.length ? c.models : [c.model], available: configured && left !== 0, budget_left: left } });
};
