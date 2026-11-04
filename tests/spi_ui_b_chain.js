/* Click chains of the 3D equipment pages (owner: Claude B). Real mouse clicks on the 3D model, the sheet and the tables.
   Usage: python3 build.py spi && node tests/spi_ui_b_chain.js [fixture|full]   Exit code 1 on any failed step. */
const { spawn } = require("child_process"), path = require("path"), { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, ".."), mode = process.argv[2] || "full", port = 8700 + Math.floor(Math.random() * 90);
const res = [], ok = (n, c, d) => { res.push([n, !!c]); console.log((c ? "ok   " : "FAIL ") + n + (c ? "" : "  " + (d || ""))); };
(async () => {
  const srv = spawn("node", [path.join(ROOT, "tools/spi_dev.mjs"), String(port), mode], { stdio: "ignore" }); await new Promise(r => setTimeout(r, 1500));
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), p = await b.newPage({ viewport: { width: 1440, height: 1000 } }), errs = [];
  p.on("pageerror", e => errs.push("pageerror " + e.message)); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console " + m.text().slice(0, 160)); });
  await p.goto(`http://localhost:${port}/`); await p.waitForFunction(() => window.go && document.getElementById("app").children.length > 0, null, { timeout: 60000 });
  await p.evaluate(() => document.querySelectorAll("#setbg,#notifbox,#tourcard").forEach(e => e.remove()));
  const text = s => p.evaluate(s => (document.querySelector(s) || {}).innerText || "", s);
  /* screen point of a model key: scan the picking buffer of the 3D box */
  const pointsOf = async (sel, key) => p.evaluate(({ sel, key }) => { const box = document.querySelector(sel), I = G3.inst[box.id], svg = box.querySelector("svg"), r = svg.getBoundingClientRect(), out = []; for (let y = 20; y < 480; y += 8) for (let x = 20; x < 880; x += 8) { if (g3PickAt(I, x, y) === key) out.push({ x: r.left + x / 900 * r.width, y: r.top + y / 500 * r.height }); } return out; }, { sel, key });
  const clickKey = async (sel, key) => { const bx = await p.$(sel); await bx.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
    let pts = []; for (let t = 0; t < 4 && !pts.length; t++) { pts = await pointsOf(sel, key); if (!pts.length) await p.waitForTimeout(900); } if (!pts.length) return false;
    for (const pt of [pts[Math.floor(pts.length / 2)], pts[0], pts[pts.length - 1], pts[Math.floor(pts.length / 4)]]) { await p.evaluate(() => { SPIEQ.sel = null; }); await p.mouse.move(pt.x, pt.y); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(600); if (await p.evaluate(k => SPIEQ.sel === k, key)) return true; }
    return false; };
  /* A. Locations detail has the Open in 3D button */
  await p.evaluate(() => spiGo("spi_loc", { loc: "PX_PP-148A" })); await p.waitForTimeout(2500);
  ok("Locations detail shows Open in 3D", (await text("#app")).includes("Open in 3D"));
  await p.evaluate(() => document.querySelector(".spi-eqbtn button").click()); await p.waitForTimeout(3500);
  ok("Open in 3D opens the equipment page", (await text("#app")).includes("Equipment 3D") && !!(await p.$(".spi-eq3")));
  /* B. real click on a zone in 3D */
  const zone = await p.evaluate(() => { const P = spiPrep(SPIEQ.key); const z = P.zones.find(z => z.key && z.id !== "oth"); return z && z.key; });
  const hit = await clickKey(".spi-eq3", zone); ok("a zone is found and clicked in 3D", hit);
  const pan = await text("#spi_eqp"); ok("3D click lists the parts of the zone", /on this zone/.test(pan) && /Stock/.test(pan), pan.slice(0, 120));
  /* part 3D from the panel */
  await p.evaluate(() => document.querySelector("#spi_eqp .spi-pr button[data-d]").click()); await p.waitForTimeout(2500);
  ok("a part opens its 3D model and sheet", !!(await p.$("#spi_pm .g3box")) && !!(await p.$("#spi_pm .spi-psvg")));
  const fc = await p.$("#spi_pm button[onclick*=spi_forecast]");
  if (fc) { await fc.click(); await p.waitForTimeout(2500); ok("the part opens its forecast", await p.evaluate(() => st.page === "spi_forecast")); } else { await p.evaluate(() => document.getElementById("spi_pm").remove()); ok("the part panel offers the forecast", false, "no forecast button"); }
  /* C and D. sheet and zone table */
  await p.evaluate(() => spiGo("spi_eq", { funcloc: "PX_PP-148A" })); await p.waitForTimeout(3500);
  await p.evaluate(() => document.querySelector("#spi_eqsvg [data-k].gp").dispatchEvent(new MouseEvent("click", { bubbles: true }))); await p.waitForTimeout(500);
  ok("a click on the sheet lists the parts", /on this zone|Nozzle/.test(await text("#spi_eqp")));
  await p.evaluate(() => [...document.querySelectorAll(".spi-zt tr.click")].pop().click()); await p.waitForTimeout(500);
  ok("a zone table row lists the parts", /on this zone/.test(await text("#spi_eqp")));
  /* E. assembly: motor in 3D, child page, back to the parent (fresh page: no zone focus from the steps above) */
  await p.evaluate(() => spiGo("spi_eq", { funcloc: "PX_PP-148A" })); await p.waitForTimeout(4500);
  const kidsOk = await p.evaluate(() => !!(SPIEQ.kids && SPIEQ.kids.motor)); ok("sub-items of the pump are found", kidsOk);
  if (kidsOk) { const h2 = await clickKey(".spi-eq3", "@motor"); ok("the motor is clickable in 3D", h2);
    ok("the motor click lists its location", /Electric motor/.test(await text("#spi_eqp")));
    await p.evaluate(() => document.querySelector("#spi_eqp .spi-eqlist button").click()); await p.waitForTimeout(3500);
    ok("the motor page opens with its own template", /Electric motor/.test(await text("#app")) && !!(await p.$(".spi-eq3")));
    ok("the motor page links back to the pump", !!(await p.$("#spi_eqk button")));
    await p.evaluate(() => document.querySelector("#spi_eqk button").click()); await p.waitForTimeout(3000); ok("back to the pump", /PP-148A/.test(await text("#app"))); }
  /* F. equipment set page: sheet click and part 3D */
  await p.evaluate(() => go("equipment", { set: 5, tab: "ga" })); await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelector("#gsvg [data-k].gp").dispatchEvent(new MouseEvent("click", { bubbles: true }))); await p.waitForTimeout(600);
  ok("set page: sheet click shows the zone card", /on this zone/.test(await text("#gp")));
  await p.evaluate(() => document.querySelector("#gp .spi-pr button[data-d]").click()); await p.waitForTimeout(2200); ok("set page: part 3D opens", !!(await p.$("#spi_pm .g3box"))); await p.evaluate(() => document.getElementById("spi_pm").remove());
  /* G. part library */
  await p.evaluate(() => go("spi_parts")); await p.waitForTimeout(1500); await p.evaluate(() => spiPartType(0)); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelector("#spi_ptype button[data-d][data-m]").click()); await p.waitForTimeout(2200); ok("part library: type to part to 3D", !!(await p.$("#spi_pm .g3box")));
  ok("no script errors", errs.length === 0, errs.slice(0, 3).join(" | "));
  await b.close(); srv.kill(); const bad = res.filter(r => !r[1]).length; console.log(bad ? bad + " step(s) failed" : "all click chains passed"); process.exit(bad ? 1 : 0);
})();
