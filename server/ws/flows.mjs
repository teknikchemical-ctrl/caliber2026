// GET /api/ws/flows (owner: Claude B). Process connections between equipment classes, read from the piping line descriptions of FuncLoc list ("PIPE-10 FROM PP-807B TO PP-148A").
// Answer: pairs [{from,to,lines,examples}] by equipment class prefix, and per class the number of lines in and out. Only descriptions with both ends named are used.
import { openDb, json, guard, num, fig, pay } from "./_lib.mjs";
export default guard((req, res) => {
  const db = openDb(), R = db.prepare("select funcloc, tag, descr from funcloc where eq_class = 'LINE'").all(), cls = (t) => (/^([A-Z]+)-/.exec(t || "") || [])[1] || null, P = {}; let used = 0;
  R.forEach((r) => { const m = /FROM\s+([A-Z]+-[A-Z0-9]+)\s+TO\s+([A-Z]+-[A-Z0-9]+)/.exec(r.descr || ""); if (!m) return; const a = cls(m[1]), b = cls(m[2]); if (!a || !b) return; used++; const k = a + ">" + b; const x = P[k] = P[k] || { from: a, to: b, lines: 0, examples: [] }; x.lines++; if (x.examples.length < 3) x.examples.push({ line: r.tag || r.funcloc, from: m[1], to: m[2] }); });
  const pairs = Object.values(P).sort((x, y) => y.lines - x.lines), C = {}; pairs.forEach((p) => { (C[p.from] = C[p.from] || { k: p.from, out: 0, in: 0 }).out += p.lines; (C[p.to] = C[p.to] || { k: p.to, out: 0, in: 0 }).in += p.lines; });
  json(res, 200, pay("ws.flows", {}, { lines: R.length, lines_used: used, pairs, classes: Object.values(C).sort((x, y) => y.out + y.in - x.out - x.in) },
    [fig("lines", "Piping lines in the FuncLoc list", R.length, "lines"), fig("used", "Lines with both ends named", used, "lines")], ["FuncLoc list (piping line descriptions)"], ["A connection is a piping line whose description names the equipment at both ends."]));
});
