/* Document reading for the ingestion wizard. The page sends the text of an uploaded or pasted document; the model returns its structure
   (kind, title, tags, steps, warnings, typed facts, lessons) as JSON. Nothing the model returns is trusted blindly:
   - secrets and personal data are masked before the text leaves this server
   - every step, warning, fact and value must carry a quote that is found word for word in the source, otherwise it is dropped and reported
   - free text fields are kept only if most of their words occur in the source
   The page then shows the result for a person to review before anything is saved. */
import { createHash } from "node:crypto";
import { J, cfgA, store, clientId, limit, budget, bump, discoverModels, isModelError, plantName } from "./_lib.mjs";
export const config = { path: "/api/extract" };
const KINDS = ["sop", "datasheet", "interlock", "instruments", "maintenance", "opl", "incident", "pid", "notes"];
const FACT_KINDS = ["setpoint", "permissive", "instrument_range", "final_element", "datasheet"];
const CHUNK = 12000, MAX_CHUNKS = 6, MAX_TEXT = 140000;
const SYSTEM = plant => `You read documents from a process plant (${plant}) and return ONLY one JSON object, no prose, no code fences.
Rules: use only what the text says. Never invent a value, tag, revision or date. If something is not in the text, use an empty string or an empty list.
Every item in "steps", "warnings", "facts" and "kv" must include a "quote": a short span copied exactly, character for character, from the text.
Equipment tags look like KC-4501, PSLL-4504, GA-1201A. Known equipment of this plant may be listed after the text.
JSON shape:
{"kind":"sop|datasheet|interlock|instruments|maintenance|opl|incident|pid|notes","confidence":0-100,"title":"","summary":"max 400 characters","tags":["tags found in the text"],"set_tag":"main equipment tag or empty","revision":"","date":"YYYY-MM-DD or empty","classification":"public|internal|restricted",
"steps":[{"n":1,"text":"","quote":""}],"warnings":[{"text":"","quote":""}],
"facts":[{"tag":"","kind":"setpoint|permissive|instrument_range|final_element|datasheet","name":"","value":"","unit":"","vote":"","quote":""}],
"kv":[{"name":"","value":"","quote":""}],
"opl":{"objective":"","steps":[""],"symptom":"","cause":"","action":"","keypoints":[""],"caution":""},
"incident":{"description":"","symptom":"","cause":"","action":"","prevent":"","impact":""},
"gaps":["what a reviewer should add, for example no revision stated"]}
Meaning of kind: sop = numbered procedure; datasheet = parameter and value pairs; interlock = causes, set points, voting and actions; instruments = instrument list; maintenance = work order or log; opl = one point lesson; incident = incident or root cause report; pid = drawing or line description; notes = anything else.`;

/* ---------- masking ---------- */
const MASKS = [
  ["key", /\bAIza[0-9A-Za-z_\-]{20,}\b/g], ["key", /\b(sk|pk|ghp|xox[abp])[-_][0-9A-Za-z_\-]{16,}\b/g],
  ["credential", /\b(password|passwd|pwd|secret|api[ _-]?key|token)\b\s*[:=]\s*\S{3,}/gi],
  ["email", /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g],
  ["id number", /\b\d{16}\b/g],
  ["phone", /(?<![\w-])(?:\+62|0)8\d{8,11}\b/g]
];
function mask(text) {
  let n = 0; const types = {};
  for (const [t, re] of MASKS) text = text.replace(re, () => { n++; types[t] = (types[t] || 0) + 1; return "[REDACTED]"; });
  return { text, count: n, types };
}
const norm = s => String(s || "").toLowerCase().replace(/[\s ]+/g, " ").replace(/[“”"'`]/g, "").trim();
const words = s => new Set((String(s || "").toLowerCase().match(/[a-z0-9][a-z0-9\-]{3,}/g) || []));
const TAG = /\b[A-Z]{1,5}-?\d{3,5}[A-Z]?\b/g;

/* ---------- provider calls (one JSON answer, no streaming) ---------- */
class PErr extends Error { constructor(m, s) { super(m); this.status = s; } }
async function failText(r) { let m = "provider HTTP " + r.status; try { const j = JSON.parse(await r.text()); if (j.error && j.error.message) m += ": " + String(j.error.message).slice(0, 140); } catch {} return new PErr(m, r.status); }
async function geminiJson(c, model, user, signal, sys) {
  const base = c.base || "https://generativelanguage.googleapis.com/v1beta";
  const mk = think => { const b = { systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { temperature: 0, maxOutputTokens: 6000, responseMimeType: "application/json" } };
    if (think && /gemini-2\.5-flash/.test(model)) b.generationConfig.thinkingConfig = { thinkingBudget: 0 }; return b; };
  const call = b => fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", signal, headers: { "content-type": "application/json", "x-goog-api-key": c.key }, body: JSON.stringify(b) });
  let r = await call(mk(true));
  if (r.status === 400) { const e = await failText(r); if (/thinking/i.test(e.message)) r = await call(mk(false)); else throw e; }
  if (!r.ok) throw await failText(r);
  const j = await r.json(), cand = j.candidates && j.candidates[0], parts = (cand && cand.content && cand.content.parts) || [];
  const t = parts.filter(x => x.text && !x.thought).map(x => x.text).join("");
  if (!t) throw new PErr(j.promptFeedback && j.promptFeedback.blockReason ? "the provider declined this request (" + j.promptFeedback.blockReason + ")" : "the provider returned no answer", 502);
  return t;
}
async function openaiJson(c, model, user, signal, sys) {
  const r = await fetch(`${c.base.replace(/\/$/, "")}/chat/completions`, { method: "POST", signal, headers: { "content-type": "application/json", authorization: "Bearer " + c.key },
    body: JSON.stringify({ model, temperature: 0, max_tokens: 4000, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }) });
  if (!r.ok) throw await failText(r);
  const j = await r.json(); return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
}
/* deterministic stand-in used by the tests and the mock provider: reads simple "Name: value" lines and numbered steps */
function mockJson(text, name) {
  const L = String(text).split(/\r?\n/).map(s => s.trim()).filter(Boolean), tags = [...new Set(text.match(TAG) || [])];
  const steps = L.map(l => /^(\d+)[.)]\s+(.*)$/.exec(l)).filter(Boolean).map(m => ({ n: +m[1], text: m[2], quote: m[0] }));
  const kv = L.map(l => /^([A-Za-z][\w \/().%-]{1,40}):\s*(.+)$/.exec(l)).filter(Boolean).map(m => ({ name: m[1], value: m[2], quote: m[0] }));
  const kind = steps.length >= 2 ? "sop" : /root cause|incident/i.test(text) ? "incident" : /objective|symptom/i.test(text) ? "opl" : kv.length >= 3 ? "datasheet" : "notes";
  const facts = L.map(l => /^(.*?\b(?:trip|alarm|set ?point|range)\b.*?)[:=]\s*([<>]?\s*-?\d[\d.,-]*)\s*([A-Za-z%\/]*)/i.exec(l)).filter(Boolean).map(m => ({ tag: (m[1].match(TAG) || [""])[0], kind: /range/i.test(m[1]) ? "instrument_range" : "setpoint", name: m[1].trim(), value: m[2].trim(), unit: m[3], vote: "", quote: m[0] }));
  return JSON.stringify({ kind, confidence: 80, title: (name || L[0] || "Document").replace(/\.[a-z0-9]+$/i, "").slice(0, 80), summary: L.slice(0, 2).join(" ").slice(0, 300), tags, set_tag: tags[0] || "", revision: (/\bRev(?:ision)?\.?\s*[:\-]?\s*([A-Z0-9]{1,3})\b/i.exec(text) || [])[1] || "", date: (/\b(20\d{2}-\d{2}-\d{2})\b/.exec(text) || [])[1] || "", classification: "internal", steps, warnings: L.filter(l => /^(warning|caution)\b/i.test(l)).map(l => ({ text: l, quote: l })), facts, kv, opl: { objective: "", steps: [], symptom: "", cause: "", action: "", keypoints: [], caution: "" }, incident: { description: "", symptom: "", cause: "", action: "", prevent: "", impact: "" }, gaps: [] });
}
function parseJson(t) {
  t = String(t).trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const i = t.indexOf("{"), j = t.lastIndexOf("}"); if (i < 0 || j < i) throw new PErr("the answer was not JSON", 502);
  try { return JSON.parse(t.slice(i, j + 1)); } catch { throw new PErr("the answer was not valid JSON", 502); }
}
async function callModel(c, user, signal) {
  if (c.provider === "mock") return mockJson(user.text, user.name);
  const sys = SYSTEM(user.plant);
  if (c.provider === "openai") return openaiJson(c, c.model, user.prompt, signal, sys);
  const tried = new Set(); let last;
  const go = async m => { tried.add(m); const t = await geminiJson(c, m, user.prompt, signal, sys); c.used = m; return t; };
  for (const m of [c.model, ...(c.fallbacks || []).filter(m => m !== c.model)]) {
    try { return await go(m); } catch (e) { last = e; if (!(e instanceof PErr) || !isModelError(e)) throw e; }
  }
  let found = []; try { found = await discoverModels(c, signal); } catch {}
  for (const m of found.filter(m => !tried.has(m)).slice(0, 3)) {
    try { return await go(m); } catch (e) { last = e; if (!(e instanceof PErr) || !isModelError(e)) throw e; }
  }
  throw last;
}

/* ---------- verification ---------- */
function verify(r, src) {
  const S = norm(src), W = words(src), rej = []; let kept = 0;
  const ground = (txt, what) => { const q = norm(txt); if (!q) return ""; if (S.includes(q)) return txt; const w = [...words(txt)]; if (w.length < 3) return txt; const hit = w.filter(x => W.has(x)).length / w.length; if (hit >= .7) return txt; rej.push({ type: what, text: String(txt).slice(0, 120), why: "not supported by the text" }); return ""; };
  const withQuote = (arr, what, ok) => (Array.isArray(arr) ? arr : []).filter(x => x && typeof x === "object").map(x => { const q = norm(x.quote); if (!q || !S.includes(q)) { rej.push({ type: what, text: String(x.text || x.name || "").slice(0, 120), why: q ? "quote not found in the text" : "no quote given" }); return null; } if (ok && !ok(x)) { rej.push({ type: what, text: String(x.name || x.text || "").slice(0, 120), why: "not a valid entry" }); return null; } kept++; return x; }).filter(Boolean);
  const o = { kind: KINDS.includes(r.kind) ? r.kind : "notes", confidence: Math.max(0, Math.min(100, +r.confidence || 0)), title: String(r.title || "").slice(0, 160), summary: ground(String(r.summary || "").slice(0, 500), "summary"), set_tag: "", revision: "", date: "", classification: ["public", "internal", "restricted"].includes(r.classification) ? r.classification : "internal", gaps: (Array.isArray(r.gaps) ? r.gaps : []).map(x => String(x).slice(0, 160)).slice(0, 8) };
  const tagsInText = new Set(src.match(TAG) || []);
  o.tags = [...new Set((Array.isArray(r.tags) ? r.tags : []).map(x => String(x).toUpperCase().trim()).filter(x => tagsInText.has(x)))].slice(0, 40);
  const missingTags = (Array.isArray(r.tags) ? r.tags : []).filter(x => !tagsInText.has(String(x).toUpperCase().trim()));
  if (missingTags.length) rej.push({ type: "tag", text: missingTags.slice(0, 5).join(", "), why: "tag does not appear in the text" });
  o.set_tag = tagsInText.has(String(r.set_tag || "").toUpperCase()) ? String(r.set_tag).toUpperCase() : "";
  if (r.revision && S.includes(norm(r.revision))) o.revision = String(r.revision).slice(0, 4);
  if (/^\d{4}-\d{2}-\d{2}$/.test(r.date || "") && S.includes(r.date)) o.date = r.date; else if (/^\d{4}-\d{2}-\d{2}$/.test(r.date || "")) { const [y, m, d] = r.date.split("-"); if (S.includes(d + "/" + m + "/" + y) || S.includes(d + "-" + m + "-" + y) || S.includes(d + "." + m + "." + y)) o.date = r.date; }
  o.steps = withQuote(r.steps, "step", x => String(x.text || "").trim()).map((x, i) => ({ n: +x.n || i + 1, text: String(x.text).slice(0, 400), quote: String(x.quote).slice(0, 300) })).slice(0, 80);
  o.warnings = withQuote(r.warnings, "warning", x => String(x.text || "").trim()).map(x => ({ text: String(x.text).slice(0, 300), quote: String(x.quote).slice(0, 300) })).slice(0, 30);
  o.facts = withQuote(r.facts, "fact", x => FACT_KINDS.includes(x.kind) && String(x.value || "").trim() && String(x.name || "").trim() && (!x.tag || tagsInText.has(String(x.tag).toUpperCase()))).map(x => ({ tag: String(x.tag || "").toUpperCase(), kind: x.kind, name: String(x.name).slice(0, 120), value: String(x.value).slice(0, 80), unit: String(x.unit || "").slice(0, 16), vote: String(x.vote || "").slice(0, 12), quote: String(x.quote).slice(0, 300) })).slice(0, 120);
  o.kv = withQuote(r.kv, "value", x => String(x.name || "").trim() && String(x.value || "").trim()).map(x => ({ name: String(x.name).slice(0, 100), value: String(x.value).slice(0, 160), quote: String(x.quote).slice(0, 300) })).slice(0, 120);
  const op = r.opl || {}, ic = r.incident || {};
  o.opl = { objective: ground(op.objective, "objective"), steps: (Array.isArray(op.steps) ? op.steps : []).map(x => ground(String(x), "lesson step")).filter(Boolean).slice(0, 40), symptom: ground(op.symptom, "symptom"), cause: ground(op.cause, "cause"), action: ground(op.action, "action"), keypoints: (Array.isArray(op.keypoints) ? op.keypoints : []).map(x => ground(String(x), "key point")).filter(Boolean).slice(0, 20), caution: ground(op.caution, "caution") };
  o.incident = { description: ground(ic.description, "description"), symptom: ground(ic.symptom, "symptom"), cause: ground(ic.cause, "root cause"), action: ground(ic.action, "corrective action"), prevent: ground(ic.prevent, "preventive action"), impact: ground(ic.impact, "impact") };
  return { o, rej, kept };
}
function merge(parts) {
  if (parts.length === 1) return parts[0];
  const m = parts[0], dedupe = (a, f) => { const s = new Set(); return a.filter(x => { const k = f(x); if (s.has(k)) return false; s.add(k); return true; }); };
  m.tags = [...new Set(parts.flatMap(p => p.tags))].slice(0, 40);
  m.steps = dedupe(parts.flatMap(p => p.steps), x => norm(x.text)).map((x, i) => ({ ...x, n: i + 1 }));
  m.warnings = dedupe(parts.flatMap(p => p.warnings), x => norm(x.text));
  m.facts = dedupe(parts.flatMap(p => p.facts), x => norm(x.tag + x.name + x.value));
  m.kv = dedupe(parts.flatMap(p => p.kv), x => norm(x.name + x.value));
  for (const f of ["objective", "symptom", "cause", "action", "caution"]) m.opl[f] = parts.map(p => p.opl[f]).find(Boolean) || "";
  m.opl.steps = parts.flatMap(p => p.opl.steps).slice(0, 40); m.opl.keypoints = parts.flatMap(p => p.opl.keypoints).slice(0, 20);
  for (const f of ["description", "symptom", "cause", "action", "prevent", "impact"]) m.incident[f] = parts.map(p => p.incident[f]).find(Boolean) || "";
  m.summary = m.summary || parts.map(p => p.summary).find(Boolean) || ""; m.revision = m.revision || parts.map(p => p.revision).find(Boolean) || ""; m.date = m.date || parts.map(p => p.date).find(Boolean) || "";
  m.gaps = [...new Set(parts.flatMap(p => p.gaps))].slice(0, 8);
  return m;
}
function chunks(t) {
  if (t.length <= CHUNK) return [t];
  const out = []; let i = 0;
  while (i < t.length && out.length < MAX_CHUNKS) { let j = Math.min(t.length, i + CHUNK); if (j < t.length) { const k = t.lastIndexOf("\n\n", j); if (k > i + CHUNK * .5) j = k; else { const k2 = t.lastIndexOf("\n", j); if (k2 > i + CHUNK * .5) j = k2; } } out.push(t.slice(i, j)); i = j; }
  return out;
}
export default async (req, ctx) => {
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  const c = await cfgA();
  if (!(c.provider === "mock" || (c.provider && c.key))) return J({ error: "AI is not configured on the server" }, 503);
  const raw = await req.text();
  if (raw.length > 400000) return J({ error: "request too large" }, 413);
  let p; try { p = JSON.parse(raw); } catch { return J({ error: "invalid json" }, 400); }
  if (!p || typeof p.text !== "string" || p.text.trim().length < 20) return J({ error: "text required" }, 400);
  const lm = await limit(clientId(req, ctx), { perMin: 8, perDay: 80, key: "ext" });
  if (!lm.ok) { await bump("ai", "limited"); return J({ error: lm.why === "daily" ? "daily limit reached for this visitor" : "too many requests", retry: lm.retry }, 429, { "retry-after": String(lm.retry) }); }
  const truncated = p.text.length > MAX_TEXT, text0 = p.text.slice(0, MAX_TEXT), m = mask(text0), name = String(p.name || "").slice(0, 120);
  const known = (Array.isArray(p.known) ? p.known : []).slice(0, 40).map(k => `${String(k.tag).slice(0, 20)} ${String(k.name).slice(0, 40)}`).join("; ");
  const key = createHash("sha1").update((c.model || "") + "|" + m.text).digest("hex").slice(0, 28), cs = await store("ext");
  if (c.provider !== "mock") { const hit = await cs.get(key); if (hit) return J({ ...hit, cached: true }); }
  const pieces = chunks(m.text), outs = [], rej = []; let kept = 0;
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 55000);
  try {
    for (let i = 0; i < pieces.length; i++) {
      const bg = await budget(c.daily); if (!bg.ok) { await bump("ai", "budget"); throw new PErr("daily AI budget used up", 429); }
      const prompt = `Document name: ${name || "(none)"}${pieces.length > 1 ? `\nPart ${i + 1} of ${pieces.length}` : ""}\n\nTEXT:\n${pieces[i]}\n\nKnown equipment: ${known || "(not supplied)"}`;
      const t = await callModel(c, { prompt, text: pieces[i], name, plant: plantName(p) }, ctl.signal);
      const v = verify(parseJson(t), pieces[i]); outs.push(v.o); rej.push(...v.rej); kept += v.kept; await bump("ai", "q"); await bump("ai", "ok");
    }
  } catch (e) {
    clearTimeout(to); if (!(e instanceof PErr && e.status === 429)) { await bump("ai", "q"); await bump("ai", "err"); }
    const msg = e && e.name === "AbortError" ? "the AI provider took too long" : String((e && e.message) || e).slice(0, 160);
    return J({ error: "AI provider error: " + msg }, e instanceof PErr && e.status === 429 ? 429 : 502);
  }
  clearTimeout(to);
  const result = merge(outs);
  const body = { ok: true, result, verified: { kept, rejected: rej.length, items: rej.slice(0, 25) }, redacted: { count: m.count, types: m.types }, chunks: pieces.length, truncated, model: c.provider === "mock" ? "mock" : (c.used || c.model) };
  if (c.provider !== "mock") await cs.setJSON(key, body);
  return J(body);
};
