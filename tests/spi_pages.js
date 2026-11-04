// Loads every registered spi_* page through the dev server (real API on the full or fixture database) and fails on any script error or empty page. (owner: Claude A; page owners may add assertions below)
// Usage: python3 build.py spi && node tests/spi_pages.js [fixture|full] [--shots dir]
const { spawn } = require("child_process"), path = require("path"), fs = require("fs"), { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, ".."), mode = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "fixture", si = process.argv.indexOf("--shots"), shots = si > 0 ? process.argv[si + 1] : null, port = 8790 + Math.floor(Math.random() * 100);
const MIN = { spi_dash: /Spare part overview/, spi_arch: /Six sources, one database/i };   // text each page must show
(async () => {
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const srv = spawn("node", [path.join(ROOT, "tools/spi_dev.mjs"), String(port), mode], { stdio: "ignore" });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), p = await b.newPage({ viewport: { width: 1440, height: 900 } }), errs = [];
  p.on("response", r => { if (r.status() >= 400 && !/favicon|\/api\/(health|config|kb|embed|ai)\b/.test(r.url())) errs.push("http " + r.status() + " " + r.url()); }); p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console: " + m.text()); });
  await p.goto(`http://localhost:${port}/`, { waitUntil: "load" });
  await p.waitForFunction(() => window.go && document.getElementById("app") && document.getElementById("app").children.length > 0, null, { timeout: 60000 });
  const pages = await p.evaluate(() => Object.keys(SPI.pages)); let bad = 0;
  for (const id of pages) {
    await p.evaluate(x => { document.querySelectorAll("#setbg,#notifbox,#gsmodal,#tourcard").forEach(e => e.remove()); go(x); }, id);
    try { await p.waitForFunction(() => { const h = document.querySelector(".spi-page"); return h && !/^Loading/.test(h.textContent.replace(/^.*?Loading/, "Loading").slice(0, 0)) && !h.querySelector(".spi-sub")?.textContent.startsWith("Loading"); }, null, { timeout: 45000 }); } catch (e) {}
    await p.waitForTimeout(300);
    const txt = await p.evaluate(() => document.querySelector("#app").innerText), err = await p.evaluate(() => !!document.querySelector(".spi-err"));
    const okp = txt.length > 200 && !err && (!MIN[id] || MIN[id].test(txt));
    console.log(okp ? "ok  " : "FAIL", id, txt.length + " chars" + (err ? " (page error card)" : ""));
    if (!okp) bad++; if (shots) await p.screenshot({ path: path.join(shots, id + ".png") });
  }
  await b.close(); srv.kill();
  if (errs.length) { console.log(errs.slice(0, 10).join("\n")); }
  console.log(bad || errs.length ? `\nFAILED ${bad} page(s), ${errs.length} script error(s)` : `\nAll ${pages.length} spi pages load with the real API (${mode})`);
  process.exit(bad || errs.length ? 1 : 0);
})();
