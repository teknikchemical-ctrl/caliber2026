// The single Vercel function of the application (owner: Claude A). vercel.json rewrites /api/<anything> to /api/router?path=<anything>; the router also accepts the plain pathname (local dev server). Vercel's free plan allows 12 functions per deployment, so every endpoint is a handler file under server/
// and this router dispatches /api/<area>/<name> to server/<area>/<name>.mjs and /api/<area>/<name>/<value> to server/<area>/<name>/[param].mjs. New endpoint = new file under server/<area>/, no change here.
import fs from "node:fs"; import path from "node:path"; import { pathToFileURL } from "node:url";
const SERVER = path.join(process.cwd(), "server"), cache = new Map(), SAFE = /^[A-Za-z0-9_-]+$/;
const send = (res, s, b) => { res.statusCode = s; res.setHeader("content-type", "application/json; charset=utf-8"); res.setHeader("cache-control", "no-store"); res.end(JSON.stringify(b)); };
const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch { return false; } }, isDir = (f) => { try { return fs.statSync(f).isDirectory(); } catch { return false; } };
export function resolveRoute(segs) {
  if (segs.length < 2 || !SAFE.test(segs[0]) || !SAFE.test(segs[1]) || segs[0].startsWith("_")) return null;
  const file = path.join(SERVER, segs[0], segs[1] + ".mjs"); if (isFile(file)) return { file, params: {} };
  const dir = path.join(SERVER, segs[0], segs[1]);
  if (segs.length >= 3 && isDir(dir)) { const dyn = fs.readdirSync(dir).find((x) => /^\[[A-Za-z0-9_]+\]\.mjs$/.test(x)); if (dyn) return { file: path.join(dir, dyn), params: { [dyn.slice(1, -5)]: segs.slice(2).join("/") } }; }
  return null;
}
export default async function handler(req, res) {
  try {
    const u = new URL(req.url || "/", "http://x"), pq = u.searchParams.get("path"); u.searchParams.delete("path");
    const raw = pq !== null ? pq : u.pathname.replace(/^\/api\/?/, ""), segs = raw.split("/").filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } }), r = resolveRoute(segs);
    if (!r) return send(res, 404, { error: "no such endpoint" });
    req.query = { ...Object.fromEntries(u.searchParams), ...r.params };
    if (!cache.has(r.file)) cache.set(r.file, import(pathToFileURL(r.file).href));
    return await (await cache.get(r.file)).default(req, res);
  } catch (e) { return send(res, 500, { error: "the server could not answer this request", detail: String((e && e.message) || e).slice(0, 160) }); }
}
