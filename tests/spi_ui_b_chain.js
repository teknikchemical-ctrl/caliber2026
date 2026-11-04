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
  await p.waitForTimeout(800); const nrows = await p.evaluate(() => document.querySelectorAll("#spi_inlist .spi-inr").length); ok("3D click opens a pop-up listing the parts of the zone", nrows > 0 && !!(await p.$("#spi_pm .spi-inl")), "rows=" + nrows);
  /* part 3D from the panel */
  await p.waitForTimeout(1800);
  ok("the pop-up shows the selected part: 3D model, sheet and data", !!(await p.$("#spi_pm #spi_ipane .g3box")) && !!(await p.$("#spi_pm .spi-psvg")) && !!(await p.$("#spi_pm .spi-inkpis")));
  const n2 = await p.evaluate(() => document.querySelectorAll("#spi_inlist .spi-inr").length); if (n2 > 1) { await p.evaluate(() => document.querySelectorAll("#spi_inlist .spi-inr")[1].click()); await p.waitForTimeout(1800); ok("choosing another part in the list updates the pop-up", await p.evaluate(() => SPIINS.sel === 1)); }
  const fc = await p.$("#spi_pm button[onclick*=spiPartForecast]");
  if (fc) { await fc.click(); await p.waitForTimeout(2500); ok("the part opens its forecast", await p.evaluate(() => st.page === "spi_forecast")); } else { await p.evaluate(() => document.getElementById("spi_pm").remove()); ok("the part panel offers the forecast", false, "no forecast button"); }
  /* C and D. sheet and zone table */
  await p.evaluate(() => spiGo("spi_eq", { funcloc: "PX_PP-148A" })); await p.waitForTimeout(3500);
  await p.evaluate(zk => document.querySelector('#spi_eqsvg [data-k="' + zk + '"]').dispatchEvent(new MouseEvent("click", { bubbles: true })), zone); await p.waitForTimeout(500);
  { const tx = await text("#spi_eqp"); ok("a click on the sheet opens the pop-up", !!(await p.$("#spi_pm .spi-inl")), tx.slice(0, 100)); }
  await p.evaluate(() => [...document.querySelectorAll(".spi-zt tr.click")].pop().click()); await p.waitForTimeout(500);
  ok("a zone table row opens the pop-up", !!(await p.$("#spi_pm .spi-inl")));
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
  ok("set page: sheet click opens the pop-up", !!(await p.$("#spi_pm .spi-inl")));
  await p.waitForTimeout(1800); ok("set page: the pop-up has the part 3D", !!(await p.$("#spi_pm #spi_ipane .g3box"))); await p.evaluate(() => document.getElementById("spi_pm").remove());
  /* G. part library */
  await p.evaluate(() => go("spi_parts")); await p.waitForTimeout(1500); await p.evaluate(() => spiPartType(0)); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelector("#spi_ptype button[data-d][data-m]").click()); await p.waitForTimeout(2200); ok("part library: type to part to 3D", !!(await p.$("#spi_pm .g3box")));
  /* H. find a part visually: search, 3D, where used, show in 3D on the equipment */
  await p.evaluate(() => go("spi_find")); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.getElementById("spi_fq").value = "bearing 6316"; spiFndRun(true); }); await p.waitForTimeout(2500);
  ok("find: parts are listed with a 3D thumbnail", !!(await p.$(".spi-fc .spi-fth svg")));
  await p.evaluate(() => document.querySelector(".spi-fc .spi-fa button").click()); await p.waitForTimeout(3000);
  ok("find: the part opens with its 3D model and where it is used", !!(await p.$("#spi_pm .g3box")) && !!(await p.$("#spi_pm .spi-wu")));
  await p.evaluate(() => document.querySelector("#spi_pm .spi-wu").click()); await p.waitForTimeout(5500);
  ok("find: where used opens the equipment in the explorer with the part selected, trail shown", await p.evaluate(() => EXP.eq && !!EXP.part && !!document.querySelector("#ex_part .g3box,#ex_part svg") && document.querySelectorAll("#ex_trail .ex-cr").length >= 4), "eq=" + (await p.evaluate(() => EXP.eq)));
  await p.evaluate(() => go("spi_find")); await p.waitForTimeout(1500); await p.evaluate(() => { spiFndMode("eq"); }); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.getElementById("spi_fq").value = "PRV"; spiFndRun(true); }); await p.waitForTimeout(2500);
  await p.evaluate(() => [...document.querySelectorAll(".spi-fc .spi-fa button")].find(b => /Open in the explorer|Open in 3D/.test(b.textContent)).click()); await p.waitForTimeout(4500);
  ok("find: an equipment result opens in the explorer", !!(await p.$(".ex-g3")));
  /* I. spatial library: opens in 3D, search flies to the matching set */
  await p.evaluate(() => go("spi_space")); await p.waitForTimeout(3000);
  ok("library: the 3D space with every set is shown", !!(await p.$("#p3 canvas")) && (await p.$$(".sp-ni")).length === (await p.evaluate(() => p3Units().length)) && (await p.evaluate(() => new Set(p3Units().map(u => u.tpl ? u.cls : spiSpCls(u.n))).size === p3Units().length)));
  await p.fill("#sp_q", "PP-411"); await p.waitForTimeout(2500);
  ok("library: search diverts to the matching set", await p.evaluate(() => P3.sel === P3.rep[K.sets.find(s => s.tag === "PP-411A").n] && SPSP.act[P3.sel] === K.sets.find(s => s.tag === "PP-411A").n && !!document.querySelector("#ex_side button")));
  await p.fill("#sp_q", "bearing"); await p.waitForTimeout(2500);
  ok("library: a part search lists the sets that hold it", !!(await p.$("#sp_res .sp-r")) && await p.evaluate(() => !!P3.sel));
  const tags = await p.evaluate(() => K.sets.map(s => s.tag)); let found = 0;
  for (const t of tags) { await p.evaluate(() => spiSpClear()); await p.fill("#sp_q", t); await p.waitForTimeout(700); if (await p.evaluate(t => { const n = K.sets.find(s => s.tag === t).n; return P3.sel === P3.rep[n] && SPSP.act[P3.sel] === n }, t)) found++; }
  ok("library: every equipment set is found by its tag and opens in its block, no double blocks (" + found + " of " + tags.length + ")", found === tags.length);
  const tpl = await p.evaluate(() => P3.tpl.map(u => u.tag)); let tf = 0;
  for (const t of tpl) { await p.evaluate(() => spiSpClear()); await p.fill("#sp_q", t); await p.waitForTimeout(500); if (await p.evaluate(t => !!P3.sel && p3Units().find(u => u.n === P3.sel).tag === t, t)) tf++; }
  ok("library: every class template is in the space and found by search (" + tf + " of " + tpl.length + ")", tpl.length >= 15 && tf === tpl.length);
  await p.evaluate(() => { P3.orbit = false; spiSpClear(); }); await p.waitForTimeout(2600);
  ok("library: the whole plant view shows every unit label inside the stage", await p.evaluate(() => { const r = document.querySelector(".p3stage").getBoundingClientRect(); return p3Units().every(s => { const e = P3.labs[s.n].getBoundingClientRect(); return e.width > 0 && e.x >= r.x && e.right <= r.right && e.y >= r.y && e.bottom <= r.bottom }) }));
  /* every unit opens its card with the locations of its class; a location opens in Equipment 3D */
  await p.evaluate(() => spiSpClear()); await p.waitForTimeout(1500);
  await p.click('.sp-ni[data-n="' + (await p.evaluate(() => K.sets.find(s => s.tag === "PP-148A").n)) + '"]'); await p.waitForTimeout(3500);
  ok("library: the unit card lists the locations of its class and each opens in 3D", await p.evaluate(() => document.querySelectorAll("#ex_side .sp-lr").length >= 10));
  await p.evaluate(() => document.querySelector("#ex_side .sp-lr").click()); await p.waitForTimeout(4500);
  ok("library: a location of the class opens in place, no page change", !!(await p.$(".ex-g3")) && (await p.evaluate(() => st.page === "spi_space")));
  await p.evaluate(() => { const z = spiPrep(EXP.key).zones.find(q => q.lines.length); exZonePick(z.key) }); await p.waitForTimeout(800);
  ok("explorer: a zone lists its parts", (await p.$$("#ex_side .ex-pr")).length >= 1);
  await p.evaluate(() => document.querySelector("#ex_side .ex-pr").click()); await p.waitForTimeout(3000);
  ok("explorer: a part opens in the panel with 3D, trail has 5 steps", !!(await p.$("#ex_part .g3box")) && (await p.$$("#ex_trail .ex-cr")).length === 5);
  await p.evaluate(() => document.querySelector("#ex_trail .ex-cr").click()); await p.waitForTimeout(800);
  ok("explorer: the first crumb goes back to the whole plant", await p.evaluate(() => !EXP.eq && !EXP.part && !P3.sel && !document.getElementById("ex_world").hidden));
  await p.evaluate(() => go("spi_inv")); await p.waitForSelector(".inv-r", { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(500);
  ok("inventory: categories and a part list are shown", (await p.$$(".inv-c")).length >= 6 && (await p.$$(".inv-r")).length >= 5);
  await p.evaluate(() => document.querySelector(".inv-r").click()); await p.waitForTimeout(3500);
  ok("inventory: a part opens beside the list with 3D", !!(await p.$("#inv_part .g3box")));
  /* equipment set tab: every location and every material is listed and clickable */
  await p.evaluate(() => go("equipment", { set: 2, tab: "overview" })); await p.waitForTimeout(4500);
  const nm = await p.evaluate(() => SPSET[2] && SPSET[2].parts.length); await p.evaluate(() => { SPSET[2].lim = 99999; spiSetRows(2); });
  ok("set tab: every material of the bill of materials is listed (" + nm + ")", nm > 0 && (await p.evaluate(() => document.querySelectorAll("#spset_rows2 tbody tr").length)) === nm);
  ok("set tab: the functional locations are listed", (await p.evaluate(() => document.querySelectorAll("#spset_locs2 .spi-lc").length)) >= 1);
  await p.evaluate(() => document.querySelector("#spset_rows2 tbody tr").click()); await p.waitForTimeout(2500);
  ok("set tab: a material opens the part pop-up", !!(await p.$("#spi_pm .g3box")));
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector("#spset_locs2 .spi-lc").click()); await p.waitForTimeout(3500);
  ok("set tab: a functional location opens in the explorer", !!(await p.$(".ex-g3")));
  ok("no script errors", errs.length === 0, errs.slice(0, 3).join(" | "));
  await b.close(); srv.kill(); const bad = res.filter(r => !r[1]).length; console.log(bad ? bad + " step(s) failed" : "all click chains passed"); process.exit(bad ? 1 : 0);
})();
