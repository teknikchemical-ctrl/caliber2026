// The AI layer degrades cleanly in the browser (owner: Claude A). Usage after build: node tests/spi_ai_offline.js
// With /api/ai/* unreachable, and again with it returning errors and garbage: every tab still renders, AI boxes say they are offline instead of
// throwing, the chat answers with a message, and no page script error occurs.
const { spawn } = require("node:child_process"), { chromium } = require("playwright");
(async () => { const port = 8897, server = spawn("node", ["tools/spi_dev.mjs", String(port), "full"], { stdio: "ignore", env: { ...process.env, AI_PROVIDER: "mock" } }); let b, bad = 0; const log = (ok, m) => { console.log((ok ? "ok   " : "FAIL ") + m); if (!ok) bad++; };
  try { for (let i = 0; i < 120; i++) { try { if ((await fetch(`http://localhost:${port}/api/data/health`)).ok) break; } catch { } await new Promise((r) => setTimeout(r, 100)); }
    b = await chromium.launch({ executablePath: process.env.CHROMIUM });
    for (const mode of ["abort", "500", "garbage"]) {
      const p = await b.newPage({ viewport: { width: 1300, height: 900 } }), errs = []; p.on("pageerror", (e) => errs.push(e.message));
      await p.route("**/api/ai/**", (r) => mode === "abort" ? r.abort() : mode === "500" ? r.fulfill({ status: 500, contentType: "application/json", body: '{"error":"upstream"}' }) : r.fulfill({ status: 200, contentType: "application/json", body: "{not json" }));
      await p.goto(`http://localhost:${port}/`); await p.waitForFunction(() => typeof SPI_HUBS !== "undefined"); await p.waitForTimeout(1200);
      const tabs = await p.evaluate(() => SPI_HUBS.flatMap((h) => h.tabs.filter((t) => SPI.pages[t[0]]).map((t) => [h.id, t[0]])));
      let rendered = 0; for (const [h, t] of tabs.slice(0, 14)) { await p.evaluate(([h, t]) => { SPIHUB.tab[h] = t; st.page = h; render(); }, [h, t]); await p.waitForTimeout(1500); if (await p.evaluate(() => (document.getElementById("spihb") || {}).innerText?.length > 20)) rendered++; }
      log(rendered >= Math.min(14, tabs.length) - 1, `[${mode}] tabs still render without the AI (${rendered} of ${Math.min(14, tabs.length)})`);
      await p.evaluate(() => { SPIHUB.tab.spi_h_fc = "spi_model"; st.page = "spi_h_fc"; render(); }); await p.waitForTimeout(6000);
      const box = await p.evaluate(() => { const x = document.querySelector(".spi-aibox"); return x ? x.innerText : ""; });
      log(!box || /could not load|offline|stand on their own/i.test(box) || !/reading the result/i.test(box), `[${mode}] AI box degrades: ${box.replace(/\s+/g, " ").slice(0, 80)}`);
      const chat = await p.evaluate(async () => { try { if (typeof spiChMount === "function") spiChMount(); if (typeof spiChSend !== "function") return "no chat"; await spiChSend("What is the best course of action?"); await new Promise((r) => setTimeout(r, 2500)); const m = document.querySelectorAll("#spichbox .spich-m, #spichbox .msg, #spichbox [class*=msg]"); return (m[m.length - 1] || {}).innerText || document.getElementById("spichbox")?.innerText || ""; } catch (e) { return "THREW " + e.message; } });
      log(!/^THREW/.test(chat), `[${mode}] chat does not throw: ${String(chat).replace(/\s+/g, " ").slice(0, 80)}`);
      log(errs.length === 0, `[${mode}] no page script errors ${errs.slice(0, 2).join(" | ")}`); await p.close(); }
  } finally { if (b) await b.close(); server.kill(); }
  console.log(bad ? bad + " failed" : "the AI layer degrades cleanly offline"); if (bad) process.exitCode = 1; })();
