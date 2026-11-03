/* Settings diagnostics. A listed model is not proof that it can answer.
   Keep the whole check below the shortest deployment timeout, including response bodies. */
import { J, cfgA, store, discoverModels, isRetryable } from "./_lib.mjs";
export const config = { path: "/api/selftest" };
const TOTAL_MS = 6000, ATTEMPT_MS = 1500;
const timeoutText = "no answer within 1.5 s; try again or select a faster model in Netlify AI_MODEL";
const reason = e => /TimeoutError|AbortError/.test(e && e.name) ? timeoutText : String((e && e.message) || e).slice(0, 180);
export default async () => {
  const out = [], attempts = [], ctl = new AbortController(); let timer;
  const work = run(out, ctl.signal, attempts).catch(e => {
    out.push({ name: "Diagnostics", ok: false, detail: "The check failed: " + reason(e) });
    return J({ ok: false, checks: out, attempts });
  });
  const deadline = new Promise(resolve => { timer = setTimeout(() => {
    ctl.abort();
    resolve(J({ ok: false, attempts, checks: [...out, { name: "Diagnostics", ok: false, detail: "The 6 s diagnostics time limit was reached. " + (attempts.length ? "Latest model: " + attempts[attempts.length-1].model + ". " + attempts[attempts.length-1].detail : "No model call started; configuration or storage used the budget.") }] }));
  }, TOTAL_MS); });
  try { return await Promise.race([work, deadline]); } finally { clearTimeout(timer); }
};
async function run(out, signal, attempts) {
  const c = await cfgA();
  const add = (name, ok, detail) => out.push({ name, ok, detail });
  // A new attempt gets its own timeout, but can never outlive the overall check.
  const attemptSignal = () => AbortSignal.any([signal, AbortSignal.timeout(ATTEMPT_MS)]);
  try { const s = await store("rl"); await s.setJSON("selftest", { t: Date.now() }); const r = await s.get("selftest"); add("Shared storage", !!r, r ? "read and write work" : "write did not persist"); } catch (e) { add("Shared storage", false, reason(e)); }
  const configured = c.provider === "mock" || (c.provider && c.key);
  add("AI key", !!configured, configured ? "provider " + c.provider + ", model " + c.model : "AI_API_KEY is not set on the server. Set it in Netlify, then redeploy.");
  if (configured && c.provider !== "mock") {
    const base = c.provider === "openai" ? c.base.replace(/\/$/, "") : (c.base || "https://generativelanguage.googleapis.com/v1beta");
    const headers = c.provider === "openai" ? { authorization: "Bearer " + c.key } : { "x-goog-api-key": c.key };
    try {
      const r = await fetch(base + (c.provider === "openai" ? "/models" : "/models?pageSize=50"), { signal: attemptSignal(), headers });
      if (!r.ok) throw new Error("HTTP " + r.status + ([400, 401, 403].includes(r.status) ? ". Check the key and its API restrictions in Google AI Studio or the provider account." : ". Check the provider status and retry."));
      const j = await r.json(), names = (j.models || j.data || []).map(m => String(m.name || m.id).replace(/^models\//, ""));
      const has = names.includes(c.model);
      add("Provider connection", true, names.length + " models visible. This does not prove that an answer is available.");
      add("Model " + c.model, has || !names.length, has ? "listed by the provider; the answer check below tests a real call" : "not in this model-list page; configured fallbacks will be tried. Check AI_MODEL if no model answers.");
    } catch (e) { add("Provider connection", false, reason(e)); }
    const tried = new Set(), said = []; let answered = false, stop = false;
    const tryModel = async m => {
      if (signal.aborted || stop || tried.has(m)) return;
      tried.add(m);
      const attempt = { model: m, ok: false, detail: "Still waiting for provider response." }; attempts.push(attempt);
      try {
        const gemini = c.provider === "gemini";
        const body = gemini ? { contents: [{ role: "user", parts: [{ text: "Reply with the single word OK." }] }], generationConfig: { maxOutputTokens: 64, ...(/gemini-2\.5-flash/.test(m) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) } } : { model: m, messages: [{ role: "user", content: "Reply with the single word OK." }], max_tokens: 64, stream: false };
        const url = gemini ? `${base}/models/${encodeURIComponent(m)}:generateContent` : base + "/chat/completions";
        const r = await fetch(url, { method: "POST", signal: attemptSignal(), headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify(body) });
        if (!r.ok) {
          let msg = "HTTP " + r.status;
          try { const j = await r.json(); if (j.error && j.error.message) msg += ": " + String(j.error.message).slice(0, 140); } catch {}
          const e = Object.assign(new Error(msg), { status: r.status });
          // Trying another model cannot fix a rejected key or an invalid request.
          if (!isRetryable(e)) stop = true;
          throw e;
        }
        const j = await r.json(), cand = j.candidates && j.candidates[0];
        const text = gemini ? ((cand && cand.content && cand.content.parts) || []).filter(p => !p.thought && typeof p.text === "string").map(p => p.text).join("").trim() : String(j.choices?.[0]?.message?.content || "").trim();
        if (!text) {
          const block = j.promptFeedback?.blockReason || cand?.finishReason;
          throw new Error(block ? "no answer text (" + block + ")" : "no answer text in the provider response");
        }
        add("AI answer", true, "model " + m + " returned answer text" + (said.length ? ". Earlier attempt: " + said[0] : "") + ". If the assistant still fails, run Test the AI connection to check its full request.");
        answered = true; attempt.ok = true; attempt.detail = "Returned visible answer text.";
      } catch (e) { attempt.detail = reason(e); said.push(m + ": " + attempt.detail); }
    };
    const configuredModels = c.provider === "gemini" ? [...new Set([c.model, ...(c.fallbacks || [])])].slice(0, 4) : [c.model];
    let discovered = false;
    for (const m of configuredModels) {
      if (tried.size >= 2 && !discovered && c.provider === "gemini" && !signal.aborted) {
        discovered = true;
        try { const found = await discoverModels(c, attemptSignal()); for (const candidate of found.filter(x => !tried.has(x)).slice(0, 3)) { await tryModel(candidate); if (answered || stop || signal.aborted) break; } } catch (e) { said.push("Model discovery: " + reason(e)); }
        if (answered || stop || signal.aborted) break;
      }
      await tryModel(m); if (answered || stop || signal.aborted) break;
    }
    if (!answered && !stop && !signal.aborted && !discovered && c.provider === "gemini") {
      try { const found = await discoverModels(c, attemptSignal()); for (const m of found.filter(m => !tried.has(m)).slice(0, 3)) { await tryModel(m); if (answered || stop || signal.aborted) break; } } catch (e) { said.push("Model discovery: " + reason(e)); }
    }
    if (!answered) add("AI answer", false, (said.join(" | ").slice(0, 650) || "No model answered.") + " Check AI_MODEL, the key restrictions and the provider quota; then retry. Never share the key.");
  }
  if (c.provider === "mock") add("AI answer", true, "Test provider selected. No real Gemini connection was checked.");
  add("Access codes", true, ["edit", "approve", "admin"].map(k => k + ": " + (process.env[k.toUpperCase() + "_CODE"] ? "set" : "not set")).join(", "));
  return J({ ok: out.every(x => x.ok), checks: out, attempts });
}
