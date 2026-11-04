// GET /api/data/project : the one projection service of the site (owner: Claude A). Every projected figure on every page comes from here.
// Flow: inputs -> learned models (demand, equipment risk, lead time) -> AI projection review (spi/ai/review.js: checks each part and decides the
// basis) -> engine (server/data/golden.mjs: policy, Monte Carlo) -> this payload. History and projection share one monthly axis; every series
// carries its basis. Scope and inputs as /api/data/golden (mat | tag | set | cls | crit; service_S..C, demand, lead, carrying, budget, campaign, adj).
// Contract: spi/contracts/projection.schema.json.
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
import { golden } from "./golden.mjs";
const cache = new Map();
export function project(db, q = {}) {
  const key = JSON.stringify(Object.keys(q).filter((k) => k !== "all").sort().map((k) => [k, String(q[k])])); if (cache.has(key)) return cache.get(key);
  const g = golden(db, q), H = g.history, F = g.months;
  // locations in scope, for notifications (history and the learned expectation)
  let locs = null;
  if (q.mat) locs = db.prepare("select distinct funcloc from part_equipment where material_no=?").all(Number(q.mat)).map((r) => r.funcloc);
  else if (q.tag || q.set) { const t = String(q.tag || q.set).toUpperCase().replace(/^PX_/, ""), st = q.set ? db.prepare("select funcloc from equipment_set where tag=? or funcloc=?").get(t, "PX_" + t) : null, fl = st ? st.funcloc : "PX_" + t; locs = db.prepare("select funcloc from funcloc where funcloc=? or funcloc like ?").all(fl, fl + "-%").map((r) => r.funcloc); }
  else if (q.cls) locs = db.prepare("select funcloc from funcloc where eq_class=?").all(String(q.cls).toUpperCase()).map((r) => r.funcloc);
  const inL = locs ? ` where funcloc in (select value from json_each(?))` : "", aL = locs ? [JSON.stringify(locs)] : [];
  const nh = Object.fromEntries(db.prepare(`select substr(notif_date,1,7) m, count(*) n from notification${inL} group by 1`).all(...aL).map((r) => [r.m, r.n]));
  let er = { e: 0, n: 0, hi: 0 }; try { er = db.prepare(`select coalesce(sum(expected_notifs_12m),0) e, count(*) n, coalesce(sum(p_notif_3m>=0.5),0) hi from ml_equip_risk${inL}`).get(...aL); } catch { }
  const top = (() => { try { return db.prepare(`select tag, criticality, p_notif_3m, expected_notifs_12m from ml_equip_risk${inL} order by p_notif_3m desc limit 5`).all(...aL); } catch { return []; } })();
  const axis = [...H.months, ...F], nH = H.months.length, pad = (a) => [...a, ...F.map(() => null)], padF = (a) => [...H.months.map(() => null), ...a];
  const S = (name, values, unit, basis, extra = {}) => ({ name, values, unit, basis, ...extra });
  const out = {
    scope: g.scope, parts: g.parts, cutoff: g.cutoff, axis, history_months: nH, inputs: g.inputs, runs: g.runs, seed: g.seed,
    flow: ["inputs", "learned models (demand, equipment risk, lead time)", "AI projection review", "engine (policy and Monte Carlo)", "page"],
    series: {
      issue_qty: S("Issued quantity", pad(H.issue_qty), "units", "Data"), issue_value: S("Issued value", pad(H.issue_value), "IDR", "Data"),
      po_value: S("Purchase order value", pad(H.po_value), "IDR", "Data"), receipt_value: S("Receipts", pad(H.receipt_value), "IDR", "Data"),
      demand_qty: S("Projected use after the AI review", padF(g.demand.mean_qty), "units", "Estimate", { p10: padF(g.demand.fan_qty.p10), p90: padF(g.demand.fan_qty.p90) }),
      demand_value: S("Projected use value", padF(g.demand.fan_value.p50), "IDR", "Estimate", { p10: padF(g.demand.fan_value.p10), p90: padF(g.demand.fan_value.p90) }),
      stock_value_optimized: S("Stock value, Optimized Scenario", padF(g.golden.fan.p50), "IDR", "Estimate", { p10: padF(g.golden.fan.p10), p90: padF(g.golden.fan.p90) }),
      stock_value_today: S("Stock value, today's Min and Max", padF(g.current.fan.p50), "IDR", "Estimate", { p10: padF(g.current.fan.p10), p90: padF(g.current.fan.p90) }),
      purchase_optimized: S("Purchases, Optimized Scenario", padF(g.golden.purchase_month), "IDR", "Estimate"), purchase_today: S("Purchases, today's Min and Max", padF(g.current.purchase_month), "IDR", "Estimate"),
      cost_optimized: S("Cost, Optimized Scenario", padF(g.golden.cost_month), "IDR", "Estimate"), cost_today: S("Cost, today's Min and Max", padF(g.current.cost_month), "IDR", "Estimate"),
      stockout_optimized: S(g.golden.stockout_measure + ", Optimized Scenario", padF(g.golden.stockout_chance), g.parts === 1 ? "share" : "parts", "Estimate"), stockout_today: S(g.current.stockout_measure + ", today's Min and Max", padF(g.current.stockout_chance), g.parts === 1 ? "share" : "parts", "Estimate"),
      notifications: S("Notifications", [...H.months.map((m) => nh[m] || 0), ...F.map((_, i) => Math.round(er.e / 12 * 10) / 10)], "notifications", "Data to the cutoff, Estimate after", { split: nH }),
    },
    campaign_months: H.campaign_months, decisions: g.decisions, totals: g.totals, simulated_12m: g.simulated_12m, orders_total: g.orders_total, orders_value: g.orders_value, by_month: g.by_month, part: g.part,
    equipment: { locations: er.n, expected_notifs_12m: Math.round(er.e), high_risk_locations: er.hi, top },
    review: g.review,
    model_check: { backtest: g.backtest, calibration: g.calibration, lead_basis: g.review ? { learned: g.review.flags.lead_learned || 0, default: g.review.flags.lead_default || 0 } : null, unpriced: g.review ? g.review.flags.unpriced || 0 : null,
      models: (() => { try { const M = Object.fromEntries(db.prepare("select key, value from ml_model").all().map((r) => [r.key, JSON.parse(r.value)])); return { demand: { auc: M.auc_model, brier: M.brier_model, brier_base: M.brier_base_rate, top10_capture: M.top10_capture, holdout: M.holdout, calibration_factor: M.calibration_factor }, equipment: { auc: M.equip_auc_model, auc_baseline: M.equip_auc_baseline, validation: M.equip_validation_origins }, lead: { mae_days: M.lead_mae_days_model, mae_days_part_median: M.lead_mae_days_part_median, mae_days_overall_median: M.lead_mae_days_overall_median }, campaign: { months_history: M.campaign_months_history, ratio_plant: M.campaign_ratio_plant } }; } catch { return null; } })() },
    sets: (() => { try { return db.prepare("select tag, name from equipment_set order by set_no").all(); } catch { return []; } })(),
    basis: g.basis,
  };
  if (cache.size > 40) cache.clear(); cache.set(key, out); return out;
}
export default guard((req, res) => { const q = req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams); json(res, 200, project(openDb(), q)); });
