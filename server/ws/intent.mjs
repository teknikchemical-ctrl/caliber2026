// POST|GET /api/ws/intent?text=&tool= (owner: Claude B). A scenario written in plain words becomes the variables of a tool.
// The language model (Claude A's Gemini adapter, spi/ai/providers/gemini.js, when AI_API_KEY is set) reads the sentence into one fixed set of scenario
// variables; without the key, or when the model answer does not validate, a deterministic reader does the same. Every value is checked and clamped here;
// part and equipment names are resolved against the database. The page maps the variables onto its own inputs and re-runs.
import { openDb, json, guard, body } from "./_lib.mjs";
const VARS = { demand_factor: [0.1, 5], lead_factor: [0.2, 5], delay_days: [0, 365], budget_bn_month: [0, 500], horizon_months: [1, 36], carrying_rate: [0.01, 0.6], service: [0.5, 0.999], campaign_months_uplift: [0, 3] };
const CLS = [[/pumps?\b/i, "PP"], [/compressors?|blowers?|fans?\b/i, "KC"], [/turbines?/i, "KT"], [/furnaces?|heaters?/i, "BF"], [/exchangers?|coolers?/i, "HE"], [/control valves?|valves?\b/i, "FCV"], [/relief valves?|safety valves?|\bprv/i, "PRV"], [/vessels?|drums?/i, "VD"], [/columns?|towers?/i, "CL"], [/instruments?|transmitters?/i, "TIT"]];
const num = (s) => parseFloat(String(s).replace(/,/g, ""));
const clamp = (k, v) => { if (v == null || !isFinite(v)) return null; const [a, b] = VARS[k]; return Math.min(b, Math.max(a, v)); };
const NW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, a: 1 };
function rules(text) {
  const t = " " + String(text || "").toLowerCase().replace(/[’']/g, "").replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty)\b/g, (w) => String(NW[w])).replace(/\ba (week|month|year)\b/g, "1 $1") + " ", o = {}, said = [];
  const pc = (re) => { const m = re.exec(t); return m ? num(m[m.length - 1]) : null; };
  let m;
  if ((m = /demand[^.;,]*?(up|increase[sd]?|rises?|grows?|higher|more)[^.;,\d]*?(\d+(?:\.\d+)?)\s*%/.exec(t)) || (m = /(\d+(?:\.\d+)?)\s*%\s*(more|higher|extra)\s*(demand|use)/.exec(t))) o.demand_factor = 1 + num(m[2] && /\d/.test(m[2]) ? m[2] : m[1]) / 100;
  else if ((m = /demand[^.;,]*?(down|decrease[sd]?|falls?|drops?|lower|less)[^.;,\d]*?(\d+(?:\.\d+)?)\s*%/.exec(t)) || (m = /(\d+(?:\.\d+)?)\s*%\s*(less|lower)\s*(demand|use)/.exec(t))) o.demand_factor = 1 - num(/\d/.test(m[2]) ? m[2] : m[1]) / 100;
  else if ((m = /demand (?:at|to|of) (\d+(?:\.\d+)?)\s*%/.exec(t))) o.demand_factor = num(m[1]) / 100;
  else if (/double (the )?demand|demand doubles/.test(t)) o.demand_factor = 2; else if (/half (the )?demand|demand halves/.test(t)) o.demand_factor = 0.5;
  if ((m = /lead ?times?[^.;,]*?(up|longer|increase[sd]?|rises?|grows?|slower)[^.;,\d]*?(\d+(?:\.\d+)?)\s*%/.exec(t))) o.lead_factor = 1 + num(m[2]) / 100;
  else if ((m = /lead ?times?[^.;,]*?(down|shorter|decrease[sd]?|faster)[^.;,\d]*?(\d+(?:\.\d+)?)\s*%/.exec(t))) o.lead_factor = 1 - num(m[2]) / 100;
  else if (/lead ?times? double|double (the )?lead ?times?/.test(t)) o.lead_factor = 2;
  if ((m = /(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)\s*(late|delay|later|slower|behind)/.exec(t)) || (m = /delay(?:ed|s)?\s*(?:of|by)?\s*(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)/.exec(t))) { const n = num(m[1]), u = m[2]; o.delay_days = /week/.test(u) ? n * 7 : /month/.test(u) ? n * 30 : n; }
  if ((m = /budget[^.;,\d]*?(?:idr\s*)?(\d+(?:[.,]\d+)?)\s*(bn|billion|b\b|mn|million|m\b|tn|trillion)?/.exec(t))) { const n = num(m[1]), u = m[2] || "bn"; o.budget_bn_month = /mn|million|^m$/.test(u) ? n / 1000 : /tn|trillion/.test(u) ? n * 1000 : n; if (/year|annual/.test(t.slice(m.index, m.index + 60))) o.budget_bn_month /= 12; }
  if ((m = /(?:next|for|over|horizon(?: of)?)\s*(\d+)\s*(month|months|year|years)/.exec(t)) || (m = /(\d+)\s*(month|months|year|years)\s*(ahead|horizon|out)/.exec(t))) o.horizon_months = /year/.test(m[2]) ? num(m[1]) * 12 : num(m[1]);
  if ((m = /carrying (?:rate|cost)[^\d]*(\d+(?:\.\d+)?)\s*%/.exec(t))) o.carrying_rate = num(m[1]) / 100;
  const sv = {}; for (const c of ["s", "a", "b", "c"]) { const r = new RegExp("(\\d+(?:\\.\\d+)?)\\s*%\\s*(?:service|fill rate)?\\s*(?:for|on)\\s*(?:criticality\\s*)?" + c + "\\b|" + "criticality\\s*" + c + "\\b[^.;,\\d]*?(\\d+(?:\\.\\d+)?)\\s*%\\s*service"); const q = r.exec(t); if (q) sv[c.toUpperCase()] = num(q[1] || q[2]) / 100; }
  if ((m = /service (?:level|target)s?\s*(?:of|at|to)?\s*(\d+(?:\.\d+)?)\s*%/.exec(t)) && !Object.keys(sv).length) ["S", "A", "B", "C"].forEach((c) => sv[c] = num(m[1]) / 100);
  if (Object.keys(sv).length) o.service = sv;
  const cr = new Set(); if (/critical parts|critical spares|critical equipment/.test(t)) { cr.add("S"); cr.add("A"); }
  (t.match(/criticality\s+([sabc](?:\s*(?:,|and|&|or)\s*[sabc])*)\b/g) || []).forEach((x) => x.replace(/criticality/, "").split(/,|and|&|or/).forEach((c) => { c = c.trim().toUpperCase(); if (/^[SABC]$/.test(c)) cr.add(c); }));
  (t.match(/\b([sabc])(?:\s*(?:,|and|&)\s*([sabc]))?\s+parts\b/g) || []).forEach((x) => x.replace(/parts/, "").split(/,|and|&/).forEach((c) => { c = c.trim().toUpperCase(); if (/^[SABC]$/.test(c)) cr.add(c); }));
  if (cr.size) o.crit = [...cr].sort((a, b) => "SABC".indexOf(a) - "SABC".indexOf(b));
  if (/campaign|shutdown|turnaround|overhaul season/.test(t) && !/no campaign|without (the )?campaign/.test(t)) o.campaign = true;
  if (/replay|last 17 months|the history again|as it happened/.test(t)) o.replay = true;
  if (/release (the )?(dead|idle|unused|excess)|sell (the )?(dead|excess)|scrap/.test(t)) o.release_idle = true;
  if (/today'?s min and max|current min and max|current policy|as today/.test(t)) o.policy = "current";
  if ((m = /\b(4\d{9})\b/.exec(t))) o.material_no = +m[1];
  if ((m = /\b([a-z]{2,3}-\d{2,4}[a-z]?)\b/.exec(t))) o.tag = m[1].toUpperCase();
  for (const [re, c] of CLS) if (re.test(t)) { o.eq_class = c; break; }
  if (!o.material_no && (m = /(?:part|spare|for the|of the)\s+([a-z][a-z0-9 ,./-]{3,40}?)(?:\s+(?:with|at|if|when|and|for|by|over|in)\b|[.;]|$)/.exec(t))) { const q = m[1].trim(); if (!/^(plant|whole|all|parts|spares|equipment|next|last)/.test(q)) o.part_query = q; }
  /* a part named by its description: the words before the first scenario word, kept when they match a part type in the data */
  if (!o.material_no && !o.part_query && !o.tag) { const lead = t.trim().split(/\s+(?:with|at|if|when|where|and|for|in|over|under|on|by)\s+|[,:;]|\s+(?:demand|lead|supplier|budget|service|replay|next)\b/)[0].replace(/^(what if|simulate|try|show|plan|run|the|a|an)\s+/g, "").trim(); if (lead && lead.split(" ").length <= 6 && lead.length > 3) o.part_guess = lead; }
  return o;
}
const SCHEMA = { type: "object", properties: { demand_factor: { type: "number", nullable: true }, lead_factor: { type: "number", nullable: true }, delay_days: { type: "number", nullable: true }, budget_bn_month: { type: "number", nullable: true }, horizon_months: { type: "number", nullable: true }, carrying_rate: { type: "number", nullable: true }, service: { type: "object", nullable: true, properties: { S: { type: "number", nullable: true }, A: { type: "number", nullable: true }, B: { type: "number", nullable: true }, C: { type: "number", nullable: true } } }, crit: { type: "array", nullable: true, items: { type: "string", enum: ["S", "A", "B", "C"] } }, campaign: { type: "boolean", nullable: true }, replay: { type: "boolean", nullable: true }, release_idle: { type: "boolean", nullable: true }, policy: { type: "string", nullable: true, enum: ["current", "recommended"] }, material_no: { type: "number", nullable: true }, tag: { type: "string", nullable: true }, eq_class: { type: "string", nullable: true }, part_query: { type: "string", nullable: true } } };
const SYS = "You turn a plant engineer's scenario sentence into variables for a spare-parts planning tool. Fill only what the sentence states or clearly implies; leave the rest null. demand_factor and lead_factor are multipliers on history (30% more demand = 1.3). delay_days = extra supplier delay in days. budget_bn_month = purchase budget per month in IDR billion. horizon_months = months ahead. carrying_rate as a fraction. service = service level per criticality as fractions. crit = criticalities in scope. campaign = repeat the shutdown or campaign months. replay = replay the 17 months of history. release_idle = release stock with no use. policy = current when the user wants today's Min and Max. material_no = 10-digit material number. tag = equipment tag like PP-148A. eq_class = class code (PP pump, KC compressor, KT turbine, BF furnace, HE exchanger, FCV control valve, PRV relief valve, VD vessel, CL column). part_query = part description words when no number is given. Never invent numbers.";
function clean(o) { const r = {};
  for (const k of ["demand_factor", "lead_factor", "delay_days", "budget_bn_month", "horizon_months", "carrying_rate"]) { const v = clamp(k, o[k]); if (v != null) r[k] = Math.round(v * 1000) / 1000; }
  if (o.service && typeof o.service === "object") { const s = {}; for (const c of ["S", "A", "B", "C"]) { const v = clamp("service", o.service[c]); if (v != null) s[c] = v; } if (Object.keys(s).length) r.service = s; }
  if (Array.isArray(o.crit)) { const c = o.crit.map((x) => String(x).toUpperCase()).filter((x) => /^[SABC]$/.test(x)); if (c.length) r.crit = [...new Set(c)]; }
  for (const k of ["campaign", "replay", "release_idle"]) if (o[k] === true) r[k] = true;
  if (o.policy === "current" || o.policy === "recommended") r.policy = o.policy;
  if (o.material_no && /^4\d{9}$/.test(String(Math.round(o.material_no)))) r.material_no = Math.round(o.material_no);
  if (o.tag && /^[A-Z]{2,3}-\d{2,4}[A-Z]?$/.test(String(o.tag).toUpperCase())) r.tag = String(o.tag).toUpperCase();
  if (o.eq_class && /^[A-Z]{2,4}$/.test(String(o.eq_class).toUpperCase())) r.eq_class = String(o.eq_class).toUpperCase();
  if (o.part_query && !r.material_no) r.part_query = String(o.part_query).slice(0, 60);
  if (o.part_guess && !r.material_no && !r.part_query) r.part_guess = String(o.part_guess).slice(0, 60);
  return r; }
function resolve(db, r) {
  if (r.part_guess) { const w = r.part_guess.split(/[\s,]+/).filter((x) => x.length > 2), it = w.length ? db.prepare("select 1 from material where upper(item_type) like ? limit 1").get("%" + w[0].toUpperCase() + "%") : null; if (it) r.part_query = r.part_guess; delete r.part_guess; }
  if (r.part_query && !r.material_no) { const w = r.part_query.split(/[\s,]+/).filter((x) => x.length > 1).slice(0, 4); if (w.length) { const p = db.prepare(`select m.material_no, m.descr from material m left join part_profile p using(material_no) where ${w.map(() => "upper(m.descr) like ?").join(" and ")} order by coalesce(p.n_issues,0) desc limit 1`).get(...w.map((x) => "%" + x.toUpperCase() + "%")); if (p) { r.material_no = p.material_no; r.part = p.descr; } } }
  else if (r.material_no) { const p = db.prepare("select descr from material where material_no = ?").get(r.material_no); if (p) r.part = p.descr; else delete r.material_no; }
  if (r.tag) { const f = db.prepare("select funcloc, descr, eq_class from funcloc where tag = ?").get(r.tag); if (f) { r.funcloc = f.funcloc; r.tag_descr = f.descr; if (!r.eq_class) r.eq_class = f.eq_class; } else delete r.tag; }
  return r; }
function words(r) { const p = (v) => Math.round(v * 100) + "%", L = [];
  if (r.demand_factor != null) L.push("Demand at " + p(r.demand_factor) + " of history"); if (r.lead_factor != null) L.push("Lead time at " + p(r.lead_factor) + " of history"); if (r.delay_days) L.push("Suppliers " + Math.round(r.delay_days) + " days late on every order");
  if (r.budget_bn_month != null) L.push("Purchase budget IDR " + r.budget_bn_month + " bn a month"); if (r.horizon_months) L.push(r.horizon_months + " months ahead"); if (r.carrying_rate != null) L.push("Carrying rate " + p(r.carrying_rate) + " a year");
  if (r.service) L.push("Service " + Object.entries(r.service).map(([c, v]) => c + " " + (v * 100).toFixed(1) + "%").join(", ")); if (r.crit) L.push("Criticality " + r.crit.join(", ")); if (r.campaign) L.push("Campaign months repeat"); if (r.replay) L.push("Replay of the 17 months");
  if (r.release_idle) L.push("Stock with no use released"); if (r.policy === "current") L.push("Today's Min and Max"); if (r.material_no) L.push("Part " + r.material_no + (r.part ? " " + r.part : "")); if (r.tag) L.push("Equipment " + r.tag + (r.tag_descr ? " " + r.tag_descr : "")); if (r.eq_class && !r.tag) L.push("Class " + r.eq_class);
  return L; }
export default guard(async (req, res) => {
  const i = await body(req), text = String(i.text || "").slice(0, 600), db = openDb(); if (!text.trim()) return json(res, 400, { error: "Write the scenario first." });
  let out = null, provider = "rules", note = "";
  if (process.env.AI_API_KEY) { try { const { gemini } = await import("../../spi/ai/providers/gemini.js"); const r = await gemini({ totalMs: 12000 }).complete({ system: SYS, messages: [{ role: "user", content: "Tool: " + String(i.tool || "") + "\nScenario: " + text }], schema: SCHEMA, temperature: 0 }); if (r && r.json && typeof r.json === "object") { out = clean(r.json); provider = "gemini"; } } catch (e) { note = "language model not reachable, read by rules"; } }
  const ru = clean(rules(text)); if (!out) out = ru; else for (const [k, v] of Object.entries(ru)) if (out[k] == null) out[k] = v;
  resolve(db, out);
  json(res, 200, { tool: "ws.intent", inputs: { text, tool: i.tool || "" }, outputs: { variables: out, understood: words(out), provider, note }, figures: [], sources: [], notes: ["Every value is checked against its allowed range; part and equipment names are matched in the data."] });
});
