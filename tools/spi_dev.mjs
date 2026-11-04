// Local server for the SPI app: serves the built page and routes /api/* to the Vercel function files. (owner: Claude A)
// Usage: python3 build.py spi && node tools/spi_dev.mjs [port] [fixture|full]     env SPI_DB / SPI_RES override the database files.
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { pathToFileURL } from "node:url";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const port = Number(process.argv[2]) || 8765, mode = process.argv[3] || "full";
if (!process.env.SPI_DB) process.env.SPI_DB = path.join(ROOT, mode === "fixture" ? "spi/fixtures/mini.sqlite" : "spi/db/spi.sqlite");
const router = (await import(pathToFileURL(path.join(ROOT, "api/[...route].mjs")).href)).default;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname.startsWith("/api/")) { let body = ""; for await (const c of req) body += c; try { req.body = body ? JSON.parse(body) : undefined; } catch { req.body = undefined; } return router(req, res); }
  let f = path.join(ROOT, "dist", u.pathname === "/" ? "index.html" : u.pathname); if (!f.startsWith(path.join(ROOT, "dist")) || !fs.existsSync(f)) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("content-type", TYPES[path.extname(f)] || "application/octet-stream"); fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log(`SPI dev server http://localhost:${port}  (database ${process.env.SPI_DB})`));
