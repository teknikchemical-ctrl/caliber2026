// GET|POST /api/ws/reliability (owner: Claude B). Failure frequency explorer built on Notif History.
// The data has no failure code, so the user chooses which notification types and priorities count as a failure event.
// Inputs: type (default N1), priority (default Emergency,High), from, to, class, crit, system, q, min_events (default 2), sort (events | mtbn | recent), limit, offset.
// Outputs: per location events, first and last date, mean days between events, open events; per class the event rate per 100 installed locations; monthly trend.
import { openDb, json, guard, num, body, list, fig, pay, median } from "./_lib.mjs";
import { where } from "./notifications.mjs";
export default guard(async (req, res) => {
  const i0 = await body(req), i = { ...i0, type: i0.type == null ? "N1" : i0.type, priority: i0.priority == null ? "Emergency,High" : i0.priority, status: "", overdue: "" }, db = openDb(), W = where(i), J = "from notification n left join funcloc f on f.funcloc = n.funcloc";
  const ev = db.prepare(`select n.funcloc, n.notif_date d, n.status, f.tag, f.descr, f.eq_class, f.eq_class_name, f.criticality ${J} ${W.sql} order by n.notif_date`).all(...W.args);
  const L = {}; ev.forEach((e) => { const x = L[e.funcloc] = L[e.funcloc] || { funcloc: e.funcloc, tag: e.tag, descr: e.descr, eq_class: e.eq_class, criticality: e.criticality, dates: [], open: 0 }; x.dates.push(e.d); if (e.status === "In Progress") x.open++; });
  const minE = num(i.min_events, 2, 1, 100);
  let locs = Object.values(L).map((x) => { const n = x.dates.length, span = (Date.parse(x.dates[n - 1]) - Date.parse(x.dates[0])) / 864e5; return { funcloc: x.funcloc, tag: x.tag, descr: x.descr, eq_class: x.eq_class, criticality: x.criticality, events: n, first: x.dates[0], last: x.dates[n - 1], mtbn_days: n > 1 ? Math.round(span / (n - 1)) : null, open: x.open, months: [...new Set(x.dates.map((d) => d.slice(0, 7)))].length }; });
  const pop = Object.fromEntries(db.prepare("select eq_class k, count(*) c from funcloc group by 1").all().map((r) => [r.k, r.c]));
  const C = {}; locs.forEach((l) => { const c = l.eq_class || "Other"; const x = C[c] = C[c] || { k: c, locations: 0, events: 0, repeat: 0, mt: [] }; x.locations++; x.events += l.events; if (l.events >= minE) x.repeat++; if (l.mtbn_days != null) x.mt.push(l.mtbn_days); });
  const by_class = Object.values(C).map((x) => ({ k: x.k, population: pop[x.k] || null, locations: x.locations, events: x.events, repeat_locations: x.repeat, per_100: pop[x.k] ? Math.round(x.events / pop[x.k] * 1000) / 10 : null, median_mtbn_days: median(x.mt) })).sort((a, b) => b.events - a.events);
  const monthly = Object.entries(ev.reduce((o, e) => { const m = e.d.slice(0, 7); o[m] = (o[m] || 0) + 1; return o; }, {})).sort().map(([month, events]) => ({ month, events }));
  const rep = locs.filter((l) => l.events >= minE), S = { events: (a, b) => b.events - a.events, mtbn: (a, b) => (a.mtbn_days ?? 1e9) - (b.mtbn_days ?? 1e9), recent: (a, b) => b.last.localeCompare(a.last) };
  rep.sort(S[i.sort] || S.events); const limit = num(i.limit, 25, 1, 200), offset = num(i.offset, 0, 0, 1e6);
  json(res, 200, pay("ws.reliability", i, { events: ev.length, locations: locs.length, repeat_locations: rep.length, by_class, monthly, total_rows: rep.length, limit, offset, rows: rep.slice(offset, offset + limit) },
    [fig("events", "Failure events in the selection", ev.length, "events", "Estimate"), fig("repeat", "Locations with repeat events", rep.length, "locations", "Estimate"), fig("mtbn", "Median days between events at repeat locations", median(rep.map((x) => x.mtbn_days)), "days", "Estimate")],
    ["Notif History", "FuncLoc list (population per class)"], ["A failure event is a notification of the chosen types and priorities; the data has no failure code. Mean days between events = span between the first and the last event divided by the number of gaps."]));
});
