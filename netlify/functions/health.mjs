import { J, store, cfg2, budget, statsToday } from "./_lib.mjs";
export const config = { path: "/api/health" };
export default async () => {
  const c = cfg2();
  let st = "ok";
  try { const s = await store("kb"); await s.get("meta/rev"); } catch (e) { st = "error: " + String(e.message || e).slice(0, 80); }
  const configured = !!(c.provider === "mock" || (c.provider && c.key));
  let left = null;
  if (configured) { try { left = (await budget(c.daily, true)).left; } catch {} }
  const stats = await statsToday("ai");
  return J({ ok: true, version: "1.1", store: st,
    access: { edit: !!process.env.EDIT_CODE, approve: !!process.env.APPROVE_CODE, admin: !!process.env.ADMIN_CODE },
    ai: { configured, provider: c.provider || "", model: c.model, models: c.models.length ? c.models : [c.model], available: configured && left !== 0, budget_left: left, embed: configured, today: stats } });
};
