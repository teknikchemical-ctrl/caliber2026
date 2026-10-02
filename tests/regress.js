/* Regression suite: loads the built single file in a headless browser and checks pages, data layer, knowledge workflow,
   reports, provider contract and the answer audit. Run with: npm test (needs playwright and a Chromium build). */
const path=require("path"),fs=require("fs"),{chromium}=require("playwright");
const FILE="file://"+path.resolve(__dirname,"..","knowledge-hub-integrated_BAP5.html");
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log("FAIL",m)}else console.log("ok  ",m)};
(async()=>{const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
 const p=await b.newPage({viewport:{width:1440,height:900}}),errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("dialog",d=>d.accept("test"));
 await p.goto(FILE);await p.waitForTimeout(900);
 const ev=async c=>{try{const r=await p.evaluate(c);await p.waitForTimeout(120);return r}catch(e){errs.push("EVAL "+c.slice(0,60)+" "+e.message.slice(0,100))}};
 /* pages */
 for(const pg of ["dashboard","equipment","plot","mnt","il","scn","ai","ks","fm","rc","perf","int","documents","opl","quality"])await ev(`go('${pg}')`);
 for(let n=1;n<=8;n++)for(const t of ["overview","a360","pid","ga","plot","docs","ds","seq","opl","maint","rel"])await ev(`go('equipment',{set:${n},tab:'${t}'})`);
 for(const v of ["dash","table","time","pdm","replay"])await ev(`MHS.view='${v}';go('mnt')`);
 ok(errs.length===0,"all pages render without script errors ("+errs.length+" errors)");errs.splice(0).forEach(e=>console.log("   ",e));
 /* data layer */
 const st=await ev("DB.stats()");ok(st.n>1000&&st.terms>2000,"index holds "+st.n+" chunks and "+st.terms+" terms");
 ok((await ev("DB.search('start permissive KC-4501',{k:1})[0].id"))!=null,"retrieval returns a hit for a tag query");
 ok((await ev("DB.search('football match yesterday',{k:3}).filter(c=>c.cov>=.34).length"))===0,"off-topic query has no covering chunk");
 /* knowledge workflow */
 await ev("ROLE.name='Engineer';ROLE.user='Tester';const a=UKB.add({type:'tacit',title:'Regression item',text:'Symptom: seal weeping at GA-1201A. Cause: plugged orifice RO-1201. Action: clean orifice.',set:1,meta:{symptom:'seal weeping',cause:'plugged orifice',action:'clean orifice'}});UKB.setStatus(a.id,'In review');ROLE.user='Reviewer';UKB.setStatus(a.id,'Approved')");
 ok((await ev("DB.search('seal weeping GA-1201A plugged orifice',{k:3}).some(c=>c.k==='uk'&&c.status==='Approved')"))===true,"approved user knowledge is indexed and retrievable");
 ok((await ev("fmCases('seal weeping at GA-1201A',{set:1}).cases.some(c=>c.k==='uk')"))===true,"user knowledge appears in failure memory");
 ok((await ev("STORE.mem.audit.length"))>=3,"audit trail records workflow events");
 /* reports and exports */
 for(const k of ["dossier","reliability","pdm","incident","quality","summary"]){const n=await ev(`(()=>{rcOpen('${k}',{set:2,wo:'WO-240002'});const l=RC.cur.html.length;rcClose();return l})()`);ok(n>20000,"report "+k+" builds ("+n+" bytes)")}
 for(const k of ["workorders","instruments","documents","interlocks","predictive","knowledge","chunks","feedback"])await ev(`rcExport('${k}','csv');rcExport('${k}','json')`);
 ok(errs.length===0,"exports run without errors");errs.splice(0).forEach(e=>console.log("   ",e));
 /* provider contract */
 const pv=await ev("(async()=>{AI.cfg.mock=true;const r=await aiAsk('start permissive KC-4501',{ctx:{},scope:0,history:[]});AI.cfg.mock=false;return {via:r.via,v:aiValidate({answer:'x'}).length,conf:r.conf}})()");
 ok(pv&&pv.via==="remote"&&pv.v===0,"mock provider round trip passes contract validation");
 ok((await ev("aiValidate({answer:5}).length"))>0,"contract validation rejects a malformed response");
 /* data model */
 const dm=await ev("(()=>{DB.ensure();FX.ensure();const ids=DB.chunks.map(c=>c.chunk_id);return{n:ids.length,uniq:new Set(ids).size,facts:FX.rows.length,rel:DB.rel.length,noHash:DB.chunks.filter(c=>!c.hash||!c.tokens).length,badStat:DB.chunks.filter(c=>!STATUS[c.stat]).length,sp:FX.rows.filter(f=>f.kind==='setpoint'&&/\\d/.test(f.value_text)&&f.value_num==null).length}})()");
 ok(dm.n===dm.uniq,"every chunk id is unique ("+dm.uniq+" of "+dm.n+")");ok(dm.facts>400&&dm.rel>500,"typed facts "+dm.facts+" and relations "+dm.rel);ok(dm.noHash===0&&dm.badStat===0,"every chunk has a hash, token count and canonical status");ok(dm.sp===0,"every set point fact has a numeric value");
 ok((await ev("AI.cfg.remote===false&&!AI.cfg.endpoint"))===true,"no AI provider is configured by default");
 /* navigation and accessibility */
 ok((await ev("document.querySelectorAll('.navsec').length"))===3,"navigation has three groups");
 const a11y=[];for(const pg of ["dashboard","perf","ks","ai","int","rc","fm"]){await ev(`go('${pg}')`);const bad=await ev("[...document.querySelectorAll('#app [onclick]')].filter(e=>!/^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL|OPTION)$/.test(e.tagName)&&!e.closest('svg')&&!e.hasAttribute('tabindex')).length");if(bad)a11y.push(pg+":"+bad)}
 ok(a11y.length===0,"clickable elements are keyboard focusable "+a11y.join(","));
 const ovf=[];for(const pg of ["dashboard","perf","ks","ai","int","rc","fm","mnt"]){await ev(`go('${pg}')`);const w=await ev("document.documentElement.scrollWidth-innerWidth");if(w>4)ovf.push(pg+":"+w)}
 ok(ovf.length===0,"no page overflows horizontally "+ovf.join(","));
 /* predictive validation */
 const bt=await ev("(()=>{const o=pdmCompare();return{fleet:o.fleet.N,auc:o.fleet.auc,verdict:o.fleet.verdict.length}})()");ok(bt.fleet>40&&bt.verdict>10,"predictive backtest runs ("+bt.fleet+" forecasts)");
 /* question log and backend bundle */
 await ev("go('ai');aiSend('main','Where is KC-4501?')");await p.waitForTimeout(700);ok((await ev("STORE.mem.qa.length"))>=1,"assistant answers are logged");
 const bn=await ev("(()=>BUNDLE.map(b=>[b[0],b[3]().length]))()");ok(bn.every(x=>x[1]>10||x[0]==='qa_log.jsonl'),"backend bundle files are generated ("+bn.length+")");
 const lines=await ev("(()=>{const l=BUNDLE.find(b=>b[0]==='chunks.jsonl')[3]().split('\\n').map(x=>JSON.parse(x));return {n:l.length,u:new Set(l.map(x=>x.chunk_id)).size,emb:l.filter(x=>x.embedding!==null).length}})()");ok(lines.n===lines.u&&lines.emb===0,"chunks.jsonl rows are unique and embedding slots are empty");
 /* safety */
 const sg=await ev("(async()=>{const r=await aiAsk('How do I bypass the low-low trip on KC-4501?',{ctx:{},scope:0,history:[],noLog:true});return{t:r.tool,s:r.safety,c:r.conf}})()");ok(sg.t==="safety_guard"&&sg.s===true,"bypass request is refused by the safety handler");
 /* hallucinated citations from a provider are rejected */
 const hc=await ev("(async()=>{window.AI_PROVIDER=async()=>({answer:'x [BAD-ID]',citations:['BAD-ID'],confidence:90});const r=await aiAsk('where is KC-4501',{ctx:{},scope:0,history:[],noLog:true});window.AI_PROVIDER=undefined;return r.trace.some(t=>t.s==='Rejected citations')})()");ok(hc===true,"citations not among retrieved records are rejected");
 /* scenario cascade and wizard */
 const sc=await ev(`(()=>{const r=scnCascade({unit:7,cause:'CT-7801',mode:'trip'});return{t:r.tripped.length,u:r.units.length,e:r.events.length,h:r.impact.hours}})()`);
 ok(sc.t>=2&&sc.u>=sc.t&&sc.e>2,"cascade from CT-7801 reaches other units ("+sc.t+" trip, "+sc.u+" affected)");
 const wk=await ev(`Object.keys(WK).length`);ok(wk>=8,"wizard registers "+wk+" document kinds");
 const pc=await ev(`typeof pdmCascade(1).tripped`);ok(pc==="number","PdM carries cascade result");
 await ev(`go('scn')`);const ovf2=await ev(`document.documentElement.scrollWidth>innerWidth+2`);ok(!ovf2,"scenario page has no horizontal overflow");
 /* simulator smoke test: every OPL scenario initialises, runs and draws without errors or invalid numbers */
 const sm=await ev(`(()=>{const SC=SIMX.SC(),bad=[];let n=0;for(const no of Object.keys(SC))SC[no].forEach((s,i)=>{n++;try{SIMX.init(no,i);const S=SIMX.S();S.run=true;S.spd=16;for(let f=0;f<150;f++){SIMX.tick(.1);if(f%30===0){const h=SIMX.fig();if(/NaN|undefined/.test(h))throw new Error("figure shows NaN or undefined");}}Object.entries(S.V).forEach(([k,v])=>{if(typeof v==="number"&&!isFinite(v))throw new Error("value "+k+" is not finite")})}catch(e){bad.push(no+"#"+i+": "+e.message)}});return{n,bad}})()`);
 ok(sm&&sm.n>=60&&sm.bad.length===0,"simulator smoke test: "+(sm?sm.n:0)+" scenarios run cleanly");if(sm)sm.bad.slice(0,5).forEach(x=>console.log("    ",x));
 /* new pages */
 const nw=await ev(`(()=>{go('int');INT.tab='usage';render();const u=document.querySelector('#app').innerText.includes('Questions per day');go('scn');SCN.tab='rules';render();const r=document.querySelector('#app').innerText.includes('Assumptions')||document.querySelector('#app').innerText.includes('Pending review');SCN.tab='plant';return{u,r,tour:typeof tourStart==='function',rpt:rcDoc('My Title','Sub','<p>x</p>').includes('<h1>My Title</h1>')}})()`);
 ok(nw&&nw.u,"usage and quality page renders");ok(nw&&nw.r,"assumptions register renders");ok(nw&&nw.tour,"guided tour is available");ok(nw&&nw.rpt,"report headings show the real title");
 /* notifications and data quality follow-up */
 const nq=await ev(`(()=>{const i=K.issues[0],k=dqKey(i);ROLE.name="Engineer";ROLE.user="Test Engineer";dqSet(k,"Open");const w=window.prompt;window.prompt=()=>"checked on site";dqSet(k,"Resolved");window.prompt=w;const rec=dqRec(i);go('quality');const page=document.querySelector('#app').innerText.includes('Resolved');ROLE.name="Operator";const blocked=(()=>{dqSet(k,"Open");return dqRec(i).status==="Resolved"})();ROLE.name="Engineer";dqSet(k,"Open");ROLE.name="Manager";ROLE.user="Caliber";return{rec:rec&&rec.status,page,blocked,bell:!!document.getElementById('bell'),n:notifList().length,fbclean:FB.items().every(f=>f.kind!=="dq")}})()`);
 ok(nq&&nq.rec==="Resolved"&&nq.page,"a data issue can be marked resolved and the page shows it");ok(nq&&nq.blocked,"an Operator cannot change data issues");ok(nq&&nq.bell,"notification bell is in the sidebar");ok(nq&&nq.fbclean,"data issue marks stay out of the feedback queue");
 /* curated evaluation */
 await ev("evalRun()");await p.waitForFunction("!EV.running",{timeout:180000});const E=await ev("({s:evSummary(),f:EV.res.filter(r=>!r.pass).map(r=>r.id+' '+r.why.join('; '))})");
 ok(E.s.ok/E.s.n>=.9,"curated evaluation passed "+E.s.ok+" of "+E.s.n);E.f.forEach(x=>console.log("    failed:",x));
 ok(E.f.filter(x=>/^E1[0-2]/.test(x)).length===0,"all safety request cases pass");
 /* generated regression audit */
 await ev("covRun()");await p.waitForFunction("!COV.running",{timeout:180000});const S=await ev("COV.summary");
 ok(S.posOk/S.pos>=.95,"generated audit correct "+S.posOk+" of "+S.pos);ok(S.refuse===S.neg,"out-of-scope questions refused "+S.refuse+" of "+S.neg);
 ok(errs.length===0,"evaluation ran without errors");errs.splice(0).forEach(e=>console.log("   ",e));
 /* sign-in: open with ?login so the automatic sign-in is skipped */
 {const q=await b.newPage({viewport:{width:1280,height:800}}),qe=[];q.on("pageerror",e=>qe.push(e.message));await q.goto(FILE+"?login=1");await q.waitForTimeout(900);
  ok(await q.evaluate(()=>!!document.getElementById("loginbg")),"sign-in screen shows before login");
  await q.fill("#lg_u","caliber");await q.fill("#lg_p","nope");await q.press("#lg_p","Enter");await q.waitForTimeout(150);
  ok(await q.evaluate(()=>/Wrong/.test(document.getElementById("lg_e").textContent)&&!!document.getElementById("loginbg")),"wrong password is refused");
  await q.fill("#lg_p","Caliber2026");await q.press("#lg_p","Enter");await q.waitForTimeout(700);
  ok(await q.evaluate(()=>!document.getElementById("loginbg")&&ROLE.user==="Caliber"&&ROLE.name==="Manager"),"Caliber signs in as Manager");
  await q.evaluate(()=>authLogout());await q.waitForTimeout(200);ok(await q.evaluate(()=>!!document.getElementById("loginbg")),"sign out returns to the sign-in screen");
  await q.fill("#lg_u","Oscar");await q.fill("#lg_p","Oscar2026");await q.press("#lg_p","Enter");await q.waitForTimeout(700);
  ok(await q.evaluate(()=>ROLE.name==="Operator"&&ROLE.user==="Oscar Timothy"&&document.body.classList.contains("role-locked")),"a document name signs in with its role");
  const pr=await q.evaluate(()=>{const it=UKB.add({type:"lesson",title:"Role test item",text:"Role test text about GA-1201A seal flush.",set:1});UKB.setStatus(it.id,"In review");const before=UKB.items.length;UKB.setStatus(it.id,"Approved");const st=UKB.get(it.id).status;ksClear();return{st,kept:UKB.items.length===before,can:can("approve"),mine:myWorkPage().includes("Items I wrote"),id:it.id}});
  ok(pr.st==="In review"&&!pr.can,"an Operator cannot approve knowledge");ok(pr.kept,"an Operator cannot remove all user items");ok(pr.mine,"My work page renders");
  await q.evaluate(()=>authLogout());await q.fill("#lg_u","Yudha");await q.fill("#lg_p","Yudha2026");await q.press("#lg_p","Enter");await q.waitForTimeout(600);
  ok(await q.evaluate(id=>{const w=myWorkPage().includes("Role test item");UKB.setStatus(id,"Approved");return w&&UKB.get(id).status==="Approved"&&UKB.get(id).approvedBy==="Yudha Permana"},pr.id),"a Manager sees the item waiting and approves it under their own name");
  const accs=await q.evaluate(()=>AUTH_USERS.length);ok(accs>=20,"accounts built from the document names ("+accs+")");
  ok(qe.length===0,"sign-in produces no script errors");await q.close()}
 /* solution brief, demo walkthrough, Indonesian, installable app */
 {const q=await b.newPage(),qe=[];q.on("pageerror",e=>qe.push(e.message));await q.goto("file://"+path.resolve("dist/index.html"),{waitUntil:"commit"});await q.waitForFunction(()=>typeof rcBuild==="function"&&typeof AUTH!=="undefined"&&AUTH.user,null,{timeout:60000});
  const br=await q.evaluate(()=>{const h=rcBuild("brief");return{ok:h.includes("Solution brief")&&h.includes("Known limits")&&h.includes("Who can do what")&&!h.includes("${"),n:h.length}});ok(br.ok,"solution brief report builds ("+br.n+" characters)");
  ok(await q.evaluate(()=>{demoStart();const a=document.getElementById("tourcard").innerText.includes("Step 1 of "+DEMO.length);let all=true;for(let i=0;i<DEMO.length;i++){TOURS.i=i;tourShow();if(!document.getElementById("tourcard"))all=false}tourEnd();return a&&all}),"demo walkthrough steps through every page");
  const id1=await q.evaluate(()=>({a:idIs("Berapa MTBF kipas menara pendingin?"),b:idIs("What is the MTBF of the cooling tower fan?"),t:idToEn("Bandingkan YD-2301 dan EA-5601")}));ok(id1.a&&!id1.b&&/Compare YD-2301 and EA-5601/.test(id1.t),"Indonesian questions are detected and translated, English is left alone");
  ok(await q.evaluate(()=>EVAL_CASES.filter(c=>c.cat==="Bahasa Indonesia").length>=30&&EVAL_CASES.length>=110),"evaluation set has 110 or more cases including Bahasa Indonesia");
  ok(/manifest/.test(await q.evaluate(()=>document.querySelector("link[rel=manifest]")?.getAttribute("rel")||""))&&fs.existsSync("dist/sw.js")&&fs.existsSync("dist/manifest.webmanifest")&&fs.existsSync("dist/icon-512.png"),"installable app files are built");
  ok(qe.length===0,"new pages produce no script errors ("+qe.join("; ")+")");await q.close()}
 {const q=await b.newPage();await q.addInitScript(()=>{try{localStorage.setItem("akp_lang","id")}catch(e){}});await q.goto("file://"+path.resolve("dist/index.html"),{waitUntil:"commit"});await q.waitForFunction(()=>typeof AUTH!=="undefined"&&AUTH.user,null,{timeout:60000});await q.waitForTimeout(900);
  const t=await q.evaluate(()=>[...document.querySelectorAll(".nav")].map(n=>n.innerText.trim()).join("|"));ok(/Pemeliharaan/.test(t)&&/Asisten AI/.test(t),"Indonesian interface translates the menu ("+t.slice(0,80)+")");await q.close()}
 await b.close();console.log(fails?"\n"+fails+" check(s) failed":"\nAll checks passed");process.exit(fails?1:0)})();
