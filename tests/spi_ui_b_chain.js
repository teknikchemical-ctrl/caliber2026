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
  if (fc) { await fc.click(); await p.waitForTimeout(2500); ok("the part opens its stock projection in the planner", await p.evaluate(() => st.page === "spi_iplan" || st.page === "spi_h_inv")); } else { await p.evaluate(() => document.getElementById("spi_pm").remove()); ok("the part panel offers the forecast", false, "no forecast button"); }
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
  await p.fill("#kbs_ex_q input", "PP-411"); await p.waitForTimeout(2500);
  ok("library: search diverts to the matching set", await p.evaluate(() => P3.sel === P3.rep[K.sets.find(s => s.tag === "PP-411A").n] && SPSP.act[P3.sel] === K.sets.find(s => s.tag === "PP-411A").n && !!document.querySelector("#ex_side button")));
  await p.fill("#kbs_ex_q input", "bearing"); await p.waitForTimeout(2500);
  ok("library: a part search lists the sets that hold it", !!(await p.waitForSelector("#kbs_ex_q .kb-o",{timeout:8000}).catch(()=>null)) && await p.evaluate(() => !!P3.sel));
  const tags = await p.evaluate(() => K.sets.map(s => s.tag)); let found = 0;
  for (const t of tags) { await p.evaluate(() => spiSpClear()); await p.fill("#kbs_ex_q input", t); await p.waitForTimeout(700); if (await p.evaluate(t => { const n = K.sets.find(s => s.tag === t).n; return P3.sel === P3.rep[n] && SPSP.act[P3.sel] === n }, t)) found++; }
  ok("library: every equipment set is found by its tag and opens in its block, no double blocks (" + found + " of " + tags.length + ")", found === tags.length);
  const tpl = await p.evaluate(() => P3.tpl.map(u => u.tag)); let tf = 0;
  for (const t of tpl) { await p.evaluate(() => spiSpClear()); await p.fill("#kbs_ex_q input", t); await p.waitForTimeout(500); if (await p.evaluate(t => !!P3.sel && p3Units().find(u => u.n === P3.sel).tag === t, t)) tf++; }
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
  /* rebuilt tabs: every tool calculates from inputs and registers its state for the AI */
  for (const v of ["spi_mnotif", "spi_mplan", "spi_mkit", "spi_mrel", "spi_ssim", "spi_scr", "spi_ccalc", "spi_csave", "spi_cbuy"]) {
    await p.evaluate(v => go(v), v); await p.waitForFunction(() => document.querySelector(".ws-out .ws-tile"), null, { timeout: 30000 }).catch(() => {});
    ok("tool " + v + " shows results from its inputs", !!(await p.$(".ws-out .ws-tile")) && !!(await p.$(".ws-in")));
  }
  ok("AI can read the state of the tools", await p.evaluate(() => { const s = spiWsSnapshot(); return !!s.views.mnotif && !!s.views.ssim && !!s.views.scr && !!s.views.cbuy && !!s.assumptions.downtime_idr_h }));
  await p.evaluate(() => go("spi_mnotif")); await p.waitForTimeout(2500);
  const n0 = await p.evaluate(() => SPIWS.views.mnotif.outputs.total); await p.evaluate(() => mnTog("priority", "Emergency")); await p.waitForTimeout(2500);
  ok("notification filter changes the result", await p.evaluate(n0 => SPIWS.views.mnotif.outputs.total < n0 && SPIWS.views.mnotif.outputs.total > 0, n0));
  await p.evaluate(() => mnOpen(WSN.d.outputs.rows[0].notif_no)); await p.waitForTimeout(2500);
  ok("a notification record opens with its timeline", !!(await p.$("#mn_det .ws-tl2")));
  await p.evaluate(() => go("spi_scr")); await p.waitForTimeout(3000);
  const t0 = await p.evaluate(() => SPIWS.views.scr.outputs.scenario.total); await p.evaluate(() => spiWsRun("scr", { mode: "scale", scale: { S: 0.5, A: 0.5, B: 0.5, C: 0.5 } })); await p.waitForTimeout(2500);
  ok("AI can run a cost-risk scenario and the result changes", await p.evaluate(t0 => SPIWS.views.scr.inputs.mode === "scale" && SPIWS.views.scr.outputs.scenario.total !== t0, t0));
  await p.evaluate(() => go("spi_ssim")); await p.waitForTimeout(4000);
  ok("replenishment simulator compares three policies", await p.evaluate(() => { const P = SPIWS.views.ssim.outputs.policies; return P.current && P.calc && P.custom && P.calc.fill_rate >= 0 }));
  /* inventory planner: one part and one equipment set */
  await p.evaluate(() => { IP.mode = "part"; IP.mat = 4100000129; go("spi_iplan") }); await p.waitForFunction(() => document.querySelector(".ip-steps"), null, { timeout: 30000 }).catch(() => {});
  ok("planner: a part shows stock, projected use, recommendation and cost reduction", (await p.$$(".ip-step")).length === 4 && await p.evaluate(() => !!SPIWS.views.iplan.outputs.part && SPIWS.views.iplan.outputs.projection.months.length === 12));
  ok("planner: the cost table and the risk analysis are shown", !!(await p.$(".ws-cmp .tot")) && (await p.$$(".ip-risk")).length >= 8);
  await p.evaluate(() => { IP.mode = "set"; IP.set = "PP-148A"; ipInputs(); ipRun() }); await p.waitForFunction(() => document.querySelector(".ip-row"), null, { timeout: 30000 }).catch(() => {});
  ok("planner: an equipment set lists every part with its decision", await p.evaluate(() => document.querySelectorAll(".ip-row").length === SPIWS.views.iplan.outputs.totals.parts && SPIWS.views.iplan.outputs.totals.parts > 0));
  await p.evaluate(() => document.querySelector(".ip-row").click()); await p.waitForFunction(() => document.querySelector(".ip-steps"), null, { timeout: 30000 }).catch(() => {});
  ok("planner: a part of the set opens with the set in the trail", !!(await p.$(".ip-steps")) && !!(await p.$("#wso_ip .ex-trail")));
  ok("planner: the recommendation never costs more than today", await p.evaluate(() => SPIWS.views.iplan.outputs.part.saving_per_year >= -1));
  /* impacts, suppliers, new stock categories, planner drivers and all-parts mode */
  await p.evaluate(() => go("spi_cimp")); await p.waitForFunction(() => document.querySelector(".imp-c"), null, { timeout: 30000 }).catch(() => {});
  ok("impact reduction shows the four impacts", (await p.$$(".imp-c")).length === 4);
  const dt0 = await p.evaluate(() => SPIWS.views.cimp.outputs.impact.recommended.downtime_hours); await p.evaluate(() => spiWsRun("cimp", { apply: [] })); await p.waitForTimeout(3000);
  ok("impact reduction responds to where the recommendation is applied", await p.evaluate(dt0 => SPIWS.views.cimp.outputs.impact.recommended.downtime_hours > dt0, dt0));
  await p.evaluate(() => go("spi_sup")); await p.waitForFunction(() => document.querySelector(".su-h.ip-row"), null, { timeout: 30000 }).catch(() => {});
  ok("suppliers list with lead time and on-time share", (await p.$$(".su-h.ip-row")).length > 5);
  await p.evaluate(() => go("spi_inv")); await p.waitForSelector(".inv-c", { timeout: 30000 }).catch(() => {});
  ok("stock view has the stockout-risk and becoming-slow categories", await p.evaluate(() => SPINV.cats.some(c => c.cat === "risk") && SPINV.cats.some(c => c.cat === "slowing")));
  await p.evaluate(() => { IP.mode = "part"; IP.mat = 4100000129; IP.s = null; go("spi_iplan") }); await p.waitForFunction(() => document.querySelector(".imp-c"), null, { timeout: 30000 }).catch(() => {});
  const mu0 = await p.evaluate(() => SPIWS.views.iplan.outputs.demand.mean_month); await p.evaluate(() => { IP.drv.plan = true; IP.drv.planShare = 0.2; ipRun() }); await p.waitForTimeout(3500);
  ok("planner: the maintenance plan driver raises the planned use", await p.evaluate(mu0 => SPIWS.views.iplan.outputs.demand.mean_month > mu0, mu0));
  await p.evaluate(() => { IP.drv.plan = false; IP.mode = "all"; ipInputs(); ipRun() }); await p.waitForFunction(() => document.querySelector(".ip-row"), null, { timeout: 30000 }).catch(() => {});
  ok("planner: all parts are ranked with the impact panel", (await p.$$(".ip-row")).length > 10 && !!(await p.$(".imp-c")));
  /* link map, explorer search opens a location in place, economics panel */
  await p.evaluate(() => spiGo("spi_link", { lk: "mat", lkv: "4100000129" })); await p.waitForFunction(() => document.querySelector("#wso_lk .lk-svg"), null, { timeout: 30000 }).catch(() => {});
  ok("link map: a part is drawn with the equipment that use it", (await p.$$("#wso_lk .lk-n")).length > 10);
  await p.evaluate(() => lkGo("loc", "PX_PP-148A")); await p.waitForTimeout(2500);
  ok("link map: an equipment is drawn with its parts and the equipment that share them", await p.evaluate(() => SPIWS.views.links.outputs.mode === "location" && SPIWS.views.links.outputs.peers.length > 0));
  await p.evaluate(() => go("spi_space")); await p.waitForTimeout(2500); await p.fill("#kbs_ex_q input", "BF-105"); await p.waitForTimeout(2500);
  await p.evaluate(() => [...document.querySelectorAll("#kbs_ex_q .kb-o")].find(x => /BF-105/.test(x.textContent)).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))); await p.waitForFunction(() => EXP.eq && document.querySelector("#ex_eco .ip-risk"), null, { timeout: 30000 }).catch(() => {});
  ok("explorer: a location found by search opens in 3D with its economics", await p.evaluate(() => EXP.eq && !!document.querySelector("#ex_eco .ip-risk")));
  ok("overview has the explorer, the status, the summary and the link map; inventory has five tabs", await p.evaluate(() => SPI_HUBS.find(h => h.id === "spi_h_ov").tabs.map(t => t[0]).join() === "spi_space,spi_status,spi_summ,spi_link" && SPI_HUBS.find(h => h.id === "spi_h_inv").tabs.length === 5));
  /* explorer: the 2D drawing and the 3D model follow the same zone */
  await p.evaluate(() => { go("spi_space") }); await p.waitForTimeout(2500); await p.evaluate(() => exOpenFunc("PX_PP-148A")); await p.waitForFunction(() => EXP.eq && document.getElementById("ex_svg"), null, { timeout: 30000 }).catch(() => {});
  await p.evaluate(() => { exView("both"); const z = spiPrep(EXP.key).zones.find(q => q.lines.length); document.querySelector('#ex_svg [data-k="' + z.key + '"]').dispatchEvent(new MouseEvent("click", { bubbles: true })) }); await p.waitForTimeout(1200);
  ok("explorer: a zone selected on the 2D drawing selects it in 3D and lists its parts", await p.evaluate(() => EXP.zone != null && document.querySelectorAll("#ex_svg .sel").length > 0 && document.querySelectorAll("#ex_side .ex-pr").length > 0));
  /* round 5: dropdown while typing, timeline drag and zoom, recommended toggle, AI box, status, summary, part card */
  await p.evaluate(() => { IP.mode = "part"; go("spi_iplan") }); await p.waitForSelector("#kbs_ip_part input", { timeout: 20000 }).catch(() => {});
  await p.fill("#kbs_ip_part input", "bearing 63"); await p.waitForSelector("#kbs_ip_part .kb-o", { timeout: 10000 }).catch(() => {});
  ok("search: a dropdown of matches appears while typing", (await p.$$("#kbs_ip_part .kb-o")).length > 0);
  await p.press("#kbs_ip_part input", "ArrowDown"); await p.press("#kbs_ip_part input", "Enter"); await p.waitForTimeout(3500);
  ok("search: choosing a match with the keyboard opens that part", await p.evaluate(() => !!IP.d && !!document.querySelector(".ip-steps")));
  await p.evaluate(() => go("spi_golden")); await p.waitForFunction(() => window.KBT && KBT.gd_tl, null, { timeout: 30000 }).catch(() => {});
  const v0 = await p.evaluate(() => KBT.gd_tl.v0); const bx = await p.evaluate(() => { document.querySelector("#gd_tl").scrollIntoView({ block: "center" }); const r = document.querySelector("#gd_tl .kb-svg").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.7 } });
  await p.mouse.move(bx.x, bx.y); await p.mouse.down(); await p.mouse.move(bx.x + 220, bx.y, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(300);
  ok("timeline: dragging moves the time window", await p.evaluate(v0 => KBT.gd_tl.v0 !== v0, v0));
  const w0 = await p.evaluate(() => KBT.gd_tl.v1 - KBT.gd_tl.v0); await p.mouse.move(bx.x, bx.y); await p.mouse.wheel(0, -300); await p.waitForTimeout(300);
  ok("timeline: the wheel zooms in", await p.evaluate(w0 => KBT.gd_tl.v1 - KBT.gd_tl.v0 < w0, w0));
  await p.evaluate(() => { const m = document.querySelector("#gd_tl .kb-m"); if (m) m.dispatchEvent(new MouseEvent("click", { bubbles: true })) }); await p.waitForTimeout(300);
  ok("timeline: a marker opens its details", await p.evaluate(() => { const P = document.querySelector("#gd_tl .kb-pop"); return !!P && !P.hidden }));
  await p.evaluate(() => { GD.mine.demand = 1.5; gdMine() }); await p.waitForTimeout(3500);
  ok("optimized scenario: my inputs re-run the model and differ from the recommended run", await p.evaluate(() => GD.view === "mine" && GD.d.mine && GD.d.mine.outputs.totals.value_idr !== GD.d.rec.outputs.totals.value_idr));
  ok("AI box host is filled after a run", await p.evaluate(() => !!document.querySelector("#wsai_gd") && document.querySelector("#wsai_gd").innerHTML.length > 0));
  await p.evaluate(() => go("spi_status")); await p.waitForSelector(".st-c", { timeout: 20000 }).catch(() => {});
  ok("status: five groups are shown", (await p.$$(".st-c")).length === 5);
  await p.evaluate(() => go("spi_summ")); await p.waitForTimeout(5000);
  ok("summary: a tile with a figure for each of the 20 case points", await p.evaluate(() => [...document.querySelectorAll(".sm-t .sm-v")].filter(e => e.textContent !== "...").length === 20));
  await p.evaluate(() => go("spi_cimp")); await p.waitForSelector(".kb-wf", { timeout: 20000 }).catch(() => {});
  ok("costs: the waterfall and the impact bars are drawn", !!(await p.$(".kb-wf")) && (await p.$$(".kb-hbr")).length > 3);
  /* round 6: hover readout, linked panels, range buttons, rename, explorer connections */
  const hov = async (sel, fx = 0.6) => { const e = (await p.$$(sel))[0]; if (!e) return ""; await e.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); const r = await e.boundingBox(); await p.mouse.move(r.x + r.width * (fx - 0.05), r.y + r.height * 0.45); await p.mouse.move(r.x + r.width * fx, r.y + r.height * 0.45); await p.waitForTimeout(250); return p.evaluate(() => { const t = document.getElementById("kbh_tip"); return t && !t.hidden ? t.innerText : "" }) };
  const tw = await hov(".kb-wf"); ok("hover: the waterfall shows a value with its unit", /IDR [\d.,]+ bn/.test(tw), tw.slice(0, 80));
  const tb = await hov("svg.spi-svg[data-kbh]"); ok("hover: a bar chart shows its category and value", tb.split("\n").length >= 2 && /\d/.test(tb), tb.slice(0, 80));
  await p.evaluate(() => go("spi_golden")); await p.waitForFunction(() => window.KBT && KBT.gd_tl && KBT.gd_tl2, null, { timeout: 30000 }).catch(() => {});
  const tt = await hov("#gd_tl2 .kb-svg", 0.85); ok("hover: the linked timeline readout lists the other panels too", /Stock value/.test(tt) && /Value per month/.test(tt), tt.slice(0, 120));
  await p.evaluate(() => kbRange("gd_tl", 6)); await p.waitForTimeout(300);
  ok("timeline: 6M shows about six months and the linked panel follows", await p.evaluate(() => { const w = (KBT.gd_tl.v1 - KBT.gd_tl.v0) / 864e5; return w > 150 && w < 215 && KBT.gd_tl2.v0 === KBT.gd_tl.v0 }));
  ok("timeline: the side panel lists the events in the window", await p.evaluate(() => /event\(s\) in the window/.test(document.getElementById("gd_ev").innerText)));
  ok("Optimized Scenario replaces Golden path", await p.evaluate(() => /Optimized Scenario/.test(document.body.innerText) && !/Golden path|Purchase pathway/.test(document.querySelector("#app").innerText)));
  await p.evaluate(() => go("spi_space")); await p.waitForFunction(() => window.SPSP && SPSP.conn, null, { timeout: 30000 }).catch(() => {});
  ok("explorer: every block has a connection", await p.evaluate(() => p3Units().every(u => SPSP.flows.pairs.some(f => !f.self && (f.a === u.n || f.b === u.n)))));
  /* round 7: every date field of every sheet on a timeline, the figures register */
  for (const [pg, sh, n] of [["spi_src_mnt", "notif", 6], ["spi_src_mnt", "plan", 2], ["spi_src_cost", "prpo", 4], ["spi_src_inv", "movement", 2]]) {
    await p.evaluate(([g, s]) => { SRC.sel[g] = s; go(g) }, [pg, sh]); await p.waitForFunction(s => window.SRC && SRC.d[s] && document.querySelector("#src_dt0 .kb-svg"), sh, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(600);
    ok(`source data ${sh}: every date field has its own timeline (${n})`, await p.evaluate(() => document.querySelectorAll("[id^=src_dt] .kb-svg, #src_dd .kb-svg").length) === n);
  }
  await p.evaluate(() => { const d = document.querySelector(".src-raw"); if (d) d.open = true }); await p.waitForTimeout(300);
  ok("source data: raw rows load with paging behind a toggle", await p.evaluate(() => document.querySelectorAll("#src_rt tbody tr").length === 50 && !!document.querySelector("details.src-raw")));
  await p.evaluate(() => kbDefs()); await p.waitForFunction(() => document.querySelector("#kb_defs .kb-dt"), null, { timeout: 20000 }).catch(() => {});
  ok("figures register: the drawer lists definitions with values", await p.evaluate(() => document.querySelectorAll("#kb_defs .kb-dt tr").length > 25));
  await p.evaluate(() => { document.getElementById("kb_defs").hidden = true });
  /* round 8: the landing tab of each hub opens with the projection answer, no setting needed, no "AI projection" label */
  for (const pg of ["spi_golden", "spi_fgold", "spi_mtime", "spi_cimp"]) {
    await p.evaluate(g => go(g), pg); await p.waitForFunction(() => document.querySelector(".aiv .aiv-ans") && document.querySelectorAll(".aiv .aiv-t").length === 4, null, { timeout: 40000 }).catch(() => {});
    ok(`${pg}: opens with the projection answer, four figures and the first actions`, await p.evaluate(() => !!document.querySelector(".aiv .aiv-ans") && document.querySelectorAll(".aiv .aiv-t").length === 4 && document.querySelectorAll(".aiv .aiv-a").length >= 3 && !/AI projection/.test(document.querySelector("#app").innerText)));
  }
  await p.evaluate(() => ciView("rec")); await p.waitForTimeout(6000);
  ok("costs: the answer band and the impact tool show the same yearly saving", await p.evaluate(() => { const a = [...document.querySelectorAll(".aiv-t b")].map(e => e.textContent), k = [...document.querySelectorAll(".kb-kpi .kb-kv")].map(e => e.textContent); return a[1] && k.includes(a[1]) }));
  ok("no script errors", errs.length === 0, errs.slice(0, 3).join(" | "));
  await b.close(); srv.kill(); const bad = res.filter(r => !r[1]).length; console.log(bad ? bad + " step(s) failed" : "all click chains passed"); process.exit(bad ? 1 : 0);
})();
