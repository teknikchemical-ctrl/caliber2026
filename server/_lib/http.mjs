// Tiny response helpers (owner: Claude A). Errors are always {error:"plain words"}.
export const json = (res, status, body) => { res.statusCode = status; res.setHeader("content-type", "application/json; charset=utf-8"); res.setHeader("cache-control", status === 200 ? "public, max-age=60, s-maxage=60" : "no-store"); res.end(JSON.stringify(body)); };
export const fail = (res, status, msg) => json(res, status, { error: msg });
// Query helper: merges the URL query and Vercel's req.query (dynamic route params such as [id]).
export const qs = (req) => { const u = new URL(req.url || "/", "http://x"); const o = {}; u.searchParams.forEach((v, k) => { o[k] = v; }); return { ...o, ...(req.query || {}) }; };
export const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
export const guard = (fn) => (req, res) => { try { return fn(req, res); } catch (e) { const m = String((e && e.message) || e); res.statusCode = /SQLITE_CANTOPEN|unable to open/.test(m) ? 503 : 500; res.setHeader("content-type", "application/json"); res.setHeader("cache-control", "no-store"); res.end(JSON.stringify({ error: res.statusCode === 503 ? "the database file is not available on this deployment" : "the server could not answer this request", detail: m.slice(0, 160) })); } };
