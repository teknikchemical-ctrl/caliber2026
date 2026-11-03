/* =====================================================================================================
   COSTING AND BUSINESS CASE PAGE (owner: Codex, see docs/agents/CODEX.md)
   One self-contained module. It adds the page "Costing" (data-page "fin") and, if you want, an assistant tool.
   Inputs: the case's financial assumptions in cases/<id>/fin.json (arrives here as window.FIN) and the plant data already in the page.
   Do not edit any other src/ file. If you need a change elsewhere, write it in your handoff file for Claude A.

   What you can use (read only):
     CASE            title, company, subtitle           K.sets, K.assets, K.docs, K.inst      the case data (K = KB)
     MH              work orders: r.n set, r.tag, r.type, r.bd ("Yes"/"No"/null), r.dt downtime h, r.lh labour h, r.lc labour cost, r.mc material cost, r.tc total cost, r.t0..t2 times
     pdmUnit(n)      predictive risk of a set: .health .level ("high"|"medium"|"low")      woOf(n)  work orders of set n
     S(n)            the set n                              sum(a,f) cnt(a,f)                    small helpers
     cCard(title,html,sub) cCols(items,{h,w}) kpiTile(big,label,tone,js)    cards, column chart, KPI tile (src/modules/ch.js, mh1.js)
     esc(s) fmt(n)                                          escaping and number format
     csvOf(headers,rows) dlFile(name,content,type) rcDoc(title,sub,html,{kind})  CSV, download, printable document with header (src/modules/rc.js, ks.js)
     STORE.mem.cfg  STORE.put("cfg")                        keep user inputs (see the old business case in gov.js: gbv, govSetBiz)
     can("review")                                          true if the signed-in role may change inputs
     AI.tools, aiRoute                                      add an assistant tool: see src/modules/eqclass.js for the pattern (tool object plus an aiRoute wrapper)
   Rules: text style in CLAUDE.md (no em dashes, % symbol, units after a space, label every assumption), performance budget (no work at load: do everything inside finPage()).
   ===================================================================================================== */
regMod("fin","1.0",["dl"],"Costing and business case");
if(typeof document!=="undefined")document.documentElement.dataset.fin=(window.FIN&&window.FIN.currency)?"1":"0";
function finPage(){
 if(!window.FIN||!FIN.currency)return `<h1>Costing</h1><p class="sub">${esc(CASE.title)}</p><div class="note-warn">No financial inputs for this case yet. Add <code>cases/&lt;id&gt;/fin.json</code> (see <code>cases/_template/fin.json</code>) and build again.</div>`;
 const cur=FIN.currency,tot=sum(MH,r=>r.tc||0),dt=sum(MH,r=>r.dt||0),bd=cnt(MH,r=>r.bd==="Yes");
 return `<h1>Costing</h1><p class="sub">${esc(CASE.title)} | amounts in ${esc(cur)}</p>
 <div class="grid" style="grid-template-columns:repeat(4,1fr);gap:10px;margin:10px 0">${kpiTile(fmt(tot),"Maintenance cost in the records")}${kpiTile(fmt(dt)+" h","Downtime in the records")}${kpiTile(bd,"Breakdowns")}${kpiTile((FIN.assumptions||[]).length,"Assumptions listed")}</div>
 ${cCard("Assumptions",`<table><tr><th>Assumption</th><th>Value</th><th>Basis</th></tr>${(FIN.assumptions||[]).map(a=>`<tr><td>${esc(a.name)}</td><td>${esc(a.value)} ${esc(a.unit||"")}</td><td>${esc(a.basis||"Assumption")}</td></tr>`).join("")}</table>`,"from fin.json")}
 <p class="muted" style="font-size:12.5px">This is the starting page. Replace it with the costing features of the case.</p>`}
