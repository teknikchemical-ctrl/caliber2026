// AI projection review (owner: Claude A): the reasoning step between the learned models and every projection on the site.
// For each part it weighs the learned forecast against the part's own history, the equipment risk of its locations, the planned maintenance,
// the campaign months and the lead-time basis, flags conflicts, and decides which demand basis to trust (learned, blend or history) and whether
// a critical part needs an insurance spare. The decision is applied by the engine (server/data/golden.mjs) before anything is calculated, and
// returned with every projection so each chart and AI box can say why the figures are trusted. Rules are deterministic; Gemini may propose a
// different factor through /api/ai/review, inside the same guardrails (factor 0.5 to 2, evidence named, every number checked).
export const GUARD = { min: 0.5, max: 2 };
const r1 = (x) => Math.round(x * 10) / 10, P = (x) => Math.round(x * 100) + '%';
// p: {material_no, crit, stock, stock_item, mu (learned per month), hist12 (mean per month, last 12), n_issues, months_since_last, equip_risk_3m, planned_12m,
//     lead_basis, price, installed, campaign, campaign_uplift}
export function reviewPart(p) {
  const flags = [], mu = p.mu || 0, h = p.hist12 || 0; let basis = 'learned', factor = 1, insurance = false, reason = 'The learned forecast agrees with the part\'s own history.';
  if (p.n_issues >= 3 && h > 0 && mu > 0) {
    const ratio = mu / h;
    if (ratio < 0.5) { factor = Math.min(GUARD.max, Math.max(GUARD.min, (0.5 * mu + 0.5 * h) / mu)); basis = 'blend'; flags.push({ code: 'forecast_below_history', severity: 'warn', text: `learned forecast ${r1(mu * 12)} a year against ${r1(h * 12)} issued in the last 12 months` }); reason = 'The learned forecast is less than half of the last 12 months of use, so the review blends it with the history.'; }
    else if (ratio > 2 && (p.months_since_last ?? 0) <= 6) { factor = Math.min(GUARD.max, Math.max(GUARD.min, (0.5 * mu + 0.5 * h) / mu)); basis = 'blend'; flags.push({ code: 'forecast_above_history', severity: 'warn', text: `learned forecast ${r1(mu * 12)} a year against ${r1(h * 12)} issued in the last 12 months` }); reason = 'The learned forecast is more than twice the last 12 months of use, so the review blends it with the history.'; }
  } else if (mu <= 0 && h > 0) { basis = 'history'; flags.push({ code: 'no_learned_demand', severity: 'warn', text: `no learned demand although ${r1(h * 12)} were issued in the last 12 months` }); reason = 'The model expects no use but the part was issued in the last 12 months, so the review uses the history.'; }
  if (p.crit === 'S' && (p.equip_risk_3m ?? 0) >= 0.7 && (p.installed || 0) > 0 && (p.stock || 0) <= 0 && p.stock_item !== false && (p.n_issues || 0) >= 1 && mu * 12 < 1) { insurance = true; flags.push({ code: 'risk_without_demand', severity: 'warn', text: `equipment it serves has a ${P(p.equip_risk_3m)} chance of a notification in 3 months, little expected use` }); if (basis === 'learned') reason = 'Little use is expected, but the critical equipment it serves is likely to need work soon, so the review keeps one spare in stock.'; }
  if ((p.planned_12m || 0) > 0 && mu * 12 < 0.5 && h === 0) flags.push({ code: 'planned_work_no_forecast', severity: 'info', text: `${p.planned_12m} planned tasks on its locations in the next 12 months, no expected use` });
  if (p.lead_basis === 'learned') flags.push({ code: 'lead_learned', severity: 'info', text: 'never bought, lead time is learned from similar purchases' });
  else if (p.lead_basis === 'default') flags.push({ code: 'lead_default', severity: 'info', text: 'no lead time history or model, contract default used' });
  if (!(p.price > 0)) flags.push({ code: 'unpriced', severity: 'info', text: 'no price, money figures leave it out' });
  if (p.campaign && (p.campaign_uplift || 0) >= 2) flags.push({ code: 'campaign_uplift', severity: 'info', text: `use in campaign months is about ${r1(p.campaign_uplift)} times a normal month` });
  return { material_no: p.material_no, basis, factor: Math.round(factor * 1000) / 1000, insurance, flags, reason };
}
// scope check: the reviewed forecast against the last 12 months, and how much of those months came from the campaign months
export function scopeCheck({ forecast_12m, issued_12m, campaign_issued_12m, campaign_months, campaign_on }) {
  if (!(issued_12m > 0)) return null; const ratio = forecast_12m / issued_12m, share = campaign_issued_12m / issued_12m, r = (x) => Math.round(x).toLocaleString('en-US');
  let text = `For this scope the reviewed forecast is ${r(forecast_12m)} units for the next 12 months against ${r(issued_12m)} issued in the last 12 months (${Math.round(ratio * 100)}%).`;
  if (ratio < 0.8 && share > 0.25 && !campaign_on) text += ` ${Math.round(share * 100)}% of the last 12 months was issued in the campaign months (${campaign_months.join(', ')}); the forecast assumes no repeat, so switch on the campaign input if the shutdown work comes back.`;
  else if (ratio < 0.8) text += ' The model expects a quieter year than the last one; check the parts in the flagged list before cutting stock.';
  else if (ratio > 1.25) text += ' The model expects more use than last year, driven by the parts on equipment with rising notifications.';
  else text += ' The two agree within 25%.';
  return { forecast_12m: Math.round(forecast_12m), issued_12m: Math.round(issued_12m), ratio: Math.round(ratio * 1000) / 1000, campaign_share: Math.round(share * 1000) / 1000, text };
}
export function summarise(list) {
  const by = {}, basis = { learned: 0, blend: 0, history: 0, ai: 0 }; let ins = 0;
  for (const r of list) { basis[r.basis] = (basis[r.basis] || 0) + 1; if (r.insurance) ins++; for (const f of r.flags) by[f.code] = (by[f.code] || 0) + 1; }
  const warn = list.filter((r) => r.flags.some((f) => f.severity === 'warn')).length;
  const lines = [], pl = (n, a, b) => n.toLocaleString('en-US') + ' ' + (n === 1 ? a : b);
  if (basis.blend) lines.push(`${pl(basis.blend, 'part', 'parts')} where the learned forecast and the last 12 months disagree by more than a factor of two ${basis.blend === 1 ? 'is' : 'are'} blended with the history`);
  if (basis.history) lines.push(`${pl(basis.history, 'part', 'parts')} with recent use but no learned demand ${basis.history === 1 ? 'uses' : 'use'} the history`);
  if (basis.ai) lines.push(`${pl(basis.ai, 'part uses', 'parts use')} a factor proposed by Gemini and accepted inside the guardrails`);
  if (ins) lines.push(`${pl(ins, 'critical part', 'critical parts')} on equipment likely to need work ${ins === 1 ? 'keeps' : 'keep'} an insurance spare`);
  if (by.lead_learned) lines.push(`${pl(by.lead_learned, 'part', 'parts')} never bought ${by.lead_learned === 1 ? 'uses' : 'use'} a learned lead time`);
  return { parts: list.length, flagged: warn, basis, insurance: ins, flags: by, text: lines.length ? 'The AI review checked every part before the projection: ' + lines.join('; ') + '.' : 'The AI review checked every part; the learned forecast agrees with the history everywhere.' };
}
