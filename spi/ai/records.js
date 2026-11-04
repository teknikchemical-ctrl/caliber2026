// Dated records for the assistant (owner: Claude A): "what happened on 6 May 2025", "records for KT-383A in December 2025", "issues of 4100000238 in 2026-01".
// Reads the same event set as the symbols on every chart (server/data/marks.mjs): issues, notifications, purchase requests, receipts, PO lines due,
// planned tasks and recommended orders, each with its date, part, location, quantity and value. Counts are Data except recommended orders (Estimate).
import { marks } from '../../server/data/marks.mjs';
const MON = { jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12 };
const LBL = { issue: 'part issues', notification: 'notifications', po_raised: 'purchase requests', receipt: 'receipts', po_due: 'PO lines due', plan: 'planned tasks', recommended_order: 'recommended orders' };
const N = (x) => Number(x).toLocaleString('en-US'), M = (v) => v >= 1e9 ? 'IDR ' + (v / 1e9).toFixed(2) + ' bn' : v >= 1e6 ? 'IDR ' + (v / 1e6).toFixed(1) + ' mn' : 'IDR ' + N(Math.round(v));
const fmt = (ms) => new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).replace(',', '');
export function parsePeriod(q) {
  const t = String(q).toLowerCase(); let m;
  if ((m = t.match(/\b(20\d\d)-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/))) { const a = Date.UTC(+m[1], +m[2] - 1, +m[3]); return { a, b: a + 864e5 - 1, day: true }; }
  if ((m = t.match(/\b([0-3]?\d)(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(20\d\d)\b/)) && MON[m[2]]) { const a = Date.UTC(+m[3], MON[m[2]] - 1, +m[1]); return { a, b: a + 864e5 - 1, day: true }; }
  if ((m = t.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+([0-3]?\d)(?:st|nd|rd|th)?,?\s+(20\d\d)\b/)) && MON[m[1]]) { const a = Date.UTC(+m[3], MON[m[1]] - 1, +m[2]); return { a, b: a + 864e5 - 1, day: true }; }
  if ((m = t.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(20\d\d)\b/)) && MON[m[1]]) { const a = Date.UTC(+m[2], MON[m[1]] - 1, 1); return { a, b: Date.UTC(+m[2], MON[m[1]], 1) - 1 }; }
  if ((m = t.match(/\b(20\d\d)-(0[1-9]|1[0-2])\b/))) { const a = Date.UTC(+m[1], +m[2] - 1, 1); return { a, b: Date.UTC(+m[1], +m[2], 1) - 1 }; }
  return null;
}
export function recordsRoute(q, resolved = {}) {
  const t = String(q).toLowerCase(); if (/forecast|predict|projection|expected|will |next \d|scenario|how many|count|number of|total/.test(t)) return null;
  const per = parsePeriod(q); if (!per) return null;
  if (!/happen|event|record|activit|issued|issues|notification|received|receipt|request|purchase|order|planned|task|what was|what went|show|list|on |in /.test(t)) return null;
  const mat = (q.match(/\b4\d{9}\b/) || [])[0] || null, tag = mat ? null : ((q.toUpperCase().match(/\b[A-Z]{1,5}-\d+[A-Z]?\b/) || [])[0] || null);
  const kind = /notification/.test(t) ? 'notification' : /receiv|receipt/.test(t) ? 'receipt' : /request|purchase/.test(t) ? 'po_raised' : /planned|task/.test(t) ? 'plan' : /recommended order/.test(t) ? 'recommended_order' : /issue/.test(t) ? 'issue' : null;
  if (per.day && !mat && !tag && !kind) return null; // the activity route answers a plain day for the whole plant
  return ['records_on_date', { from: new Date(per.a).toISOString().slice(0, 10), to: new Date(per.b).toISOString().slice(0, 10), mat, tag, kind }];
}
export function recordsOnDate(db, { from, to, mat = null, tag = null, kind = null } = {}) {
  const d = marks(db), t0 = Date.parse(d.from + 'T00:00:00Z'), a = Date.parse(String(from).slice(0, 10) + 'T00:00:00Z'), b = Date.parse(String(to || from).slice(0, 10) + 'T00:00:00Z') + 864e5 - 1;
  if (!(a >= 0) || !(b >= a)) return { id: 'records:none', answer: 'Give a date such as 6 May 2025 or a month such as December 2025.' };
  const day = b - a < 864e5, n = mat ? Number(mat) : null, T = tag ? String(tag).toUpperCase().replace(/^PX_/, '') : null;
  const L = T ? new Set(d.F.map((f, i) => (f[0] === T || f[0].startsWith(T + '-')) ? i : -1).filter((i) => i >= 0)) : null, inst = n && d.M[n] ? new Set(d.M[n][6]) : null;
  const hit = (e) => (n ? e[2] === n || (!e[2] && inst && inst.has(e[3])) : true) && (L ? (e[3] >= 0 && L.has(e[3])) || (e[2] && d.M[e[2]] && d.M[e[2]][6].some((x) => L.has(x))) : true) && (!kind || d.K[e[1]] === kind) && d.K[e[1]] !== 'campaign';
  const sel = d.E.filter((e) => { const ms = t0 + e[0] * 864e5; return ms >= a && ms <= b && hit(e); });
  const scope = n ? `part ${n}${d.M[n] ? ' (' + d.M[n][0] + ')' : ''}` : T ? `location ${T}` : 'the whole plant', when = day ? fmt(a) : new Date(a).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  if (!sel.length) return { id: 'records:empty', answer: `There is no dated record for ${scope} ${day ? 'on' : 'in'} ${when}${kind ? ' of the kind ' + LBL[kind] : ''}. The records run from ${fmt(t0)} to the data cut-off ${d.cutoff}, with planned tasks, PO lines due and recommended orders after it.`, figures: { records: 0 } };
  const by = {}, val = {}; sel.forEach((e) => { const k = d.K[e[1]]; by[k] = (by[k] || 0) + 1; val[k] = (val[k] || 0) + (e[5] || 0); });
  const crit = (e) => (e[2] && d.M[e[2]] && d.M[e[2]][2]) || (e[3] >= 0 && d.F[e[3]][2]) || 'C', R = { S: 4, A: 3, B: 2, C: 1 };
  const top = sel.slice().sort((x, y) => (R[crit(y)] - R[crit(x)]) || (y[5] || 0) - (x[5] || 0)).slice(0, 6).map((e) => {
    const k = d.K[e[1]], m = e[2] ? d.M[e[2]] : null, f = e[3] >= 0 ? d.F[e[3]] : null, tx = String(d.T[e[6]] || '').split('|'), q2 = e[4] ? N(e[4]) + (m && m[1] ? ' ' + m[1] : '') : '';
    const what = k === 'notification' ? `notification ${e[7]} on ${f ? f[0] : 'a location'}: ${tx[1] || ''} (${tx[0] || ''} priority, ${String(tx[2] || '').toLowerCase()})` : k === 'plan' ? `planned task on ${f ? f[0] : 'a location'}: ${tx[0] || ''}${tx[1] ? ', ' + tx[1] : ''}` : `${LBL[k].replace(/s$/, '')}: ${q2} of ${e[2]} ${m ? m[0] : ''}${f ? ' to ' + f[0] : ''}${e[5] ? ', ' + M(e[5]) : ''}${e[7] ? ' (ref ' + e[7] + ')' : ''}`;
    return `${fmt(t0 + e[0] * 864e5)}, criticality ${crit(e)}: ${what}`;
  });
  const parts = Object.keys(LBL).filter((k) => by[k]).map((k) => `**${N(by[k])} ${LBL[k]}**${val[k] ? ' (' + M(val[k]) + (k === 'recommended_order' ? ', Estimate' : '') + ')' : ''}`);
  const answer = `${day ? 'On' : 'In'} ${when}, ${scope} has **${N(sel.length)} dated records**: ${parts.join(', ')}. The most critical and largest are:\n- ${top.join('\n- ')}\n\nValues are quantity times the last PO price (Estimate where no PO price exists). Every record is a symbol on the charts; set the chart scope to the part or tag to see them in place.`;
  return { id: 'records:' + (day ? 'day' : 'month'), answer, figures: { records: sel.length, ...by } };
}
