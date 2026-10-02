/* Local server that mimics Netlify: serves the built page and runs the functions in netlify/functions. Used by the tests and for local trials.
   usage: LOCAL_STORE_DIR=/tmp/akp node tools/devserver.mjs [port]   (set AI_PROVIDER=mock for an offline AI) */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.LOCAL_STORE_DIR ||= fs.mkdtempSync("/tmp/akp-store-");
const dir = path.join(root, "netlify/functions"), routes = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".mjs") && !f.startsWith("_"))) {
  const m = await import(pathToFileURL(path.join(dir, f)).href);
  for (const p of [].concat(m.config.path)) routes.push([new RegExp("^" + p.replace(/\*/g, ".*") + "$"), m.default]);
}
export function start(port = 8888) {
  const srv = http.createServer(async (rq, rs) => {
    const u = new URL(rq.url, "http://localhost");
    if (u.pathname === "/" || u.pathname === "/index.html") { const html = fs.readFileSync(path.join(root, "knowledge-hub-integrated_BAP5.html")); rs.writeHead(200, { "content-type": "text/html; charset=utf-8", "content-length": html.length }); return rs.end(html); }
    const h = routes.find(([re]) => re.test(u.pathname));
    if (!h) { rs.writeHead(404); return rs.end("not found"); }
    const chunks = []; for await (const c of rq) chunks.push(c);
    const req = new Request(u, { method: rq.method, headers: rq.headers, body: ["GET", "HEAD"].includes(rq.method) ? undefined : Buffer.concat(chunks) });
    try {
      const res = await h[1](req, { ip: rq.headers["x-test-ip"] || rq.socket.remoteAddress });
      rs.writeHead(res.status, Object.fromEntries(res.headers));
      if (res.body) { const rd = res.body.getReader(); for (;;) { const { value, done } = await rd.read(); if (done) break; rs.write(value); } }
      rs.end();
    } catch (e) { rs.writeHead(500); rs.end(String(e)); }
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { const port = +process.argv[2] || 8888; await start(port); console.log("dev server on http://localhost:" + port); }
