// Campaign model (owner: Claude A). Finds shutdown and turnaround campaigns in the consumption history, measures how much each item type is lifted in them,
// and reads the maintenance plan for the next 12 months to show where the next campaign load sits. Evidence based, every threshold is an Assumption and is returned.
export const CAMPAIGN_INDEX = 1.6;   // Assumption: a month is a campaign month when its distinct issue orders are at least 1.6 times the median month
const med = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
export function campaignModel(db, opt = {}) {
  const idx = opt.index || CAMPAIGN_INDEX, all = (s, ...a) => db.prepare(s).all(...a), cut = db.prepare("select value from meta where key='data_cutoff'").get().value;
  const hist = all("select month, count(distinct order_no) orders, count(*) issues, sum(qty) qty from movement group by month order by month");
  const mo = med(hist.map(h => h.orders));
  hist.forEach(h => { h.index = +(h.orders / mo).toFixed(2); h.campaign = h.index >= idx; });
  const camp = new Set(hist.filter(h => h.campaign).map(h => h.month)), nCamp = camp.size, nNorm = hist.length - nCamp;
  // uplift per item type: average issues per campaign month divided by average per normal month
  const byType = all("select mt.item_type t, m.month mo, count(*) n from movement m join material mt using(material_no) group by 1, 2"), agg = {};
  for (const r of byType) { const a = agg[r.t] || (agg[r.t] = { c: 0, n: 0 }); if (camp.has(r.mo)) a.c += r.n; else a.n += r.n; }
  const uplift = Object.entries(agg).map(([t, a]) => ({ item_type: t, campaign_issues: a.c, normal_issues: a.n, uplift: nCamp && nNorm && a.n > 0 ? +((a.c / nCamp) / (a.n / nNorm)).toFixed(2) : null })).filter(r => r.campaign_issues + r.normal_issues >= 60).sort((a, b) => (b.campaign_issues + b.normal_issues) - (a.campaign_issues + a.normal_issues));
  const overall = nCamp && nNorm ? +((hist.filter(h => h.campaign).reduce((s, h) => s + h.issues, 0) / nCamp) / (hist.filter(h => !h.campaign).reduce((s, h) => s + h.issues, 0) / nNorm)).toFixed(2) : null;
  const fut = all("select substr(next_due,1,7) month, count(*) items, sum(abc in ('S','A')) critical_items from maint_item where next_due > ? and next_due <= date(?, '+12 months') group by 1 order by 1", cut, cut);
  const base = med(fut.slice(3).map(f => f.items)); fut.forEach(f => { f.index = base ? +(f.items / base).toFixed(2) : null; f.high_load = f.index >= idx; });
  const peak = [...fut].sort((a, b) => b.items - a.items)[0] || null;
  return { cutoff: cut, assumption: { campaign_index: idx, rule: "campaign month = distinct issue orders at least " + idx + " times the median month; future load index = planned items divided by the median of months 4 to 12 of the horizon" },
    history: hist, campaign_months: [...camp], median_orders_per_month: mo, overall_uplift: overall, uplift_by_item_type: uplift, outlook: fut, outlook_baseline_items_per_month: base, outlook_peak: peak,
    reading: `Issue activity shows ${nCamp} campaign month(s) in ${hist.length}: ${[...camp].join(", ")}. In those months issues ran ${overall} times the normal month across every item type. The maintenance plan puts ${peak ? peak.items : "n/a"} planned items in ${peak ? peak.month : "n/a"} against a run rate of about ${Math.round(base)} per month later in the horizon (Estimate: next due dates are calculated from cycle starts).` };
}
// Ledger rows for one part (ForecastInput shape, source 'rule'): campaign uplift in the months where planned load is high. Engine and AI evidence pack call this.
export function campaignInputs(db, material_no, model) {
  const m = model || campaignModel(db), it = db.prepare("select item_type from material where material_no = ?").get(material_no);
  if (!it) return [];
  const u = m.uplift_by_item_type.find(x => x.item_type === it.item_type), up = u && u.uplift ? Math.min(3, Math.max(1, u.uplift)) : (m.overall_uplift ? Math.min(3, m.overall_uplift) : null);
  if (!up || up <= 1.05) return [];
  return m.outlook.filter(f => f.high_load).map(f => ({ input_id: `rule-campaign-${material_no}-${f.month}`, scope: "part", target: String(material_no), driver: "turnaround", effect: "multiply", value: +up.toFixed(2), unit: "x", period_start: f.month, period_end: f.month, source: "rule", confidence: 0.5,
    rationale: `Planned maintenance load ${f.items} items (index ${f.index}) in ${f.month}; in the last campaign this item type ran ${up.toFixed(1)} times its normal monthly issues (value capped at 3).`, evidence: [`campaign:${f.month}`, `itemtype:${it.item_type}`], status: "accepted" }));
}
