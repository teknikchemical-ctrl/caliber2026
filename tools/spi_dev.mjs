// Local server for the SPI app: serves the built page and routes /api/* to the Vercel function files. (owner: Claude A)
// Usage: python3 build.py spi && node tools/spi_dev.mjs [port] [fixture|full]     env SPI_DB / SPI_RES override the database files.
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { pathToFileURL } from "node:url";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const port = Number(process.argv[2]) || 8765, mode = process.argv[3] || "full";
if (!process.env.SPI_DB) process.env.SPI_DB = path.join(ROOT, mode === "fixture" ? "spi/fixtures/mini.sqlite" : "spi/db/spi.sqlite");
const find = (segs) => { let dir = path.join(ROOT, "api"), params = {};
  for (let i = 0; i < segs.length; i++) { const last = i === segs.length - 1, s = segs[i];
    if (last) { const f = path.join(dir, s + ".mjs"); if (fs.existsSync(f)) return { f, params }; const dyn = fs.existsSync(dir) && fs.readdirSync(dir).find(x => /^\[.+\]\.mjs$/.test(x)); if (dyn) return { f: path.join(dir, dyn), params: { [dyn.slice(1, -5)]: decodeURIComponent(s) } }; return null; }
    const sub = path.join(dir, s); if (fs.existsSync(sub) && fs.statSync(sub).isDirectory()) { dir = sub; continue; }
    const dyn = fs.existsSync(dir) && fs.readdirSync(dir).find(x => /^\[.+\]$/.test(x)); if (dyn) { dir = path.join(dir, dyn); params[dyn.slice(1, -1)] = decodeURIComponent(s); continue; } return null; }
  return null; };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname.startsWith("/api/")) { const r = find(u.pathname.split("/").filter(Boolean).slice(1));
    if (!r) { res.statusCode = 404; res.setHeader("content-type", "application/json"); return res.end('{"error":"no such endpoint"}'); }
    req.query = { ...Object.fromEntries(u.searchParams), ...r.params };
    let body = ""; for await (const c of req) body += c; try { req.body = body ? JSON.parse(body) : undefined; } catch { req.body = undefined; }
    try { const m = await import(pathToFileURL(r.f).href + "?t=" + Date.now()); return await m.default(req, res); } catch (e) { res.statusCode = 500; res.setHeader("content-type", "application/json"); return res.end(JSON.stringify({ error: "endpoint crashed", detail: String(e.message).slice(0, 200) })); } }
  let f = path.join(ROOT, "dist", u.pathname === "/" ? "index.html" : u.pathname); if (!f.startsWith(path.join(ROOT, "dist")) || !fs.existsSync(f)) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("content-type", TYPES[path.extname(f)] || "application/octet-stream"); fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log(`SPI dev server http://localhost:${port}  (database ${process.env.SPI_DB})`));
