/* Every inline event handler on every page must compile (owner: Claude B). Catches broken onclick strings that a click test can miss.
   Usage: python3 build.py spi && node tests/spi_ui_b_handlers.js   Exit code 1 on any handler that does not compile or any page error. */
const { spawn } = require("child_process"), path = require("path"), { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, ".."), port = 8600 + Math.floor(Math.random() * 90);
(async () => {
  const srv = spawn("node", [path.join(ROOT, "tools/spi_dev.mjs"), String(port), "full"], { stdio: "ignore" }); await new Promise(r => setTimeout(r, 1500));
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), p = await b.newPage({ viewport: { width: 1440, height: 900 } }), errs = []; let bad = 0;
  p.on("pageerror", e => errs.push(e.message));
  await p.goto(`http://localhost:${port}/`); await p.waitForFunction(() => window.go && window.SPI_HUBS, null, { timeout: 60000 });
  const pages = await p.evaluate(() => SPI_HUBS.flatMap(h => h.tabs.map(t => t[0])).filter(id => SPI.pages[id]));
  for (const v of pages) {
    await p.evaluate(v => { document.querySelectorAll("#setbg,#notifbox,#tourcard").forEach(e => e.remove()); go(v) }, v); await p.waitForTimeout(3000);
    const out = await p.evaluate(() => { const o = []; document.querySelectorAll("*").forEach(el => { for (const a of el.attributes) if (/^on/.test(a.name)) { try { new Function("event", a.value) } catch (e) { o.push(a.name + ": " + a.value.slice(0, 120) + " | " + e.message) } } }); return o });
    if (out.length) { bad++; console.log("FAIL " + v + ": " + out.length + " handler(s) do not compile, first: " + out[0]) } else console.log("ok   " + v);
  }
  if (errs.length) console.log("FAIL page errors: " + errs.slice(0, 3).join(" | "));
  await b.close(); srv.kill(); process.exit(bad || errs.length ? 1 : 0);
})();
