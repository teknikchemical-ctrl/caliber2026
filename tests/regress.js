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
  const vv=await q.evaluate(async()=>{go("equipment",{set:1,tab:"pid"});await new Promise(r=>setTimeout(r,500));const i=D[1].n.findIndex(n=>n[0]==="XV-1201");const b0=document.querySelector("[data-vb=\""+i+"\"]").textContent;vSet(i,"closed");const c=document.querySelector("[data-vb=\""+i+"\"]").textContent,tripped=isF("ZSO-1201"),dead=document.querySelectorAll(".vdead").length;vAuto(i);const o=document.querySelector("[data-vb=\""+i+"\"]").textContent;go("equipment",{set:4,tab:"pid"});await new Promise(r=>setTimeout(r,500));return{b0,c,tripped,dead,o,liq:document.querySelectorAll(".vliq").length,tripped2:isF("ZSO-1201")}});
  ok(vv.b0==="OPEN"&&vv.c==="CLOSED"&&vv.tripped&&vv.dead>0&&vv.o==="OPEN"&&vv.liq>0,"P&ID valves close and open, stop the flow after them, trip their permissive and vessels show a liquid level ("+JSON.stringify(vv)+")");
  const sm=await q.evaluate(async()=>{go("scenarios");await new Promise(r=>setTimeout(r,600));return{tog:!!document.querySelector(".simwrap .simtog, .simwrap button"),fx:typeof scnFx==="function"&&typeof mhFx==="function"}});
  ok(sm.fx,"3D simulation views are available in scenarios and maintenance ("+JSON.stringify(sm)+")");
  const hz=await q.evaluate(async()=>{go("plot");PP.mode="hazard";HSE.view="2d";HSE.sc="cloud";HSE.ign=-1;HSE.n=1;HSE.hole=50;HSE.u=2;HSE.st="D";HSE.esd="auto";hseCalc();render();await new Promise(r=>setTimeout(r,400));
   const R=HSE.R,a=R.M.Q0;HSE.hole=100;hseCalc();const b=HSE.R.M.Q0;HSE.hole=50;HSE.u=6;hseCalc();const wind=HSE.R.reach.r25;HSE.u=2;hseCalc();const calm=HSE.R.reach.r25;HSE.hole=10;HSE.esd="auto";hseCalc();const ta=HSE.R.M.tIso;HSE.esd="fail";hseCalc();const nf=HSE.R.M.tIso;HSE.esd="auto";HSE.hole=50;hseCalc();
   const ov=document.getElementById("hseov"),t3=(HSE.t=40,hseOverlay(HSE.R,40));HSE.sc="jet";hseCalc();const jet=HSE.R.jet.L;HSE.sc="pool";hseCalc();const pool=HSE.R.pool&&HSE.R.pool.D;HSE.sc="cloud";HSE.ign=40;hseCalc();const bl=HSE.R.blast;HSE.ign=-1;hseCalc();
   return{a,b,calm,wind,tisoAuto:ta,nf,ov:!!ov,svgLen:t3.length,jet,pool,bl:bl&&bl.r.every((x,i,arr)=>x>0&&(i===0||x>=arr[i-1])),walk:HSE.R.walk.best.k,rec:HSE.R.rec.length}});
  ok(hz.b>hz.a*3&&hz.calm>hz.wind&&hz.nf>hz.tisoAuto,"hazard model: bigger hole means more release, calm air means a longer cloud, a failed shutdown means a longer release ("+JSON.stringify([hz.a,hz.b,hz.calm,hz.wind])+")");
  ok(hz.ov&&hz.svgLen>600&&hz.jet>10&&hz.pool>2&&hz.bl&&hz.rec>=12,"hazard simulator: plot plan overlay, jet flame, pool and blast zones are produced");
  const h3=await q.evaluate(async()=>{HSE.view="3d";HSE.t=40;hseCalc();render();await new Promise(r=>setTimeout(r,900));hse3Draw();const cv=document.querySelector("#hse3 canvas");let px=0;if(cv){const d=cv.getContext("2d").getImageData(0,0,cv.width,cv.height).data;for(let i=3;i<d.length;i+=40)if(d[i]>0)px++}return{ok:!!document.querySelector("#hse3[data-ok]"),ms:H3.ms,tris:H3.tris,px,w:cv&&cv.width}});
  ok(h3.ok&&h3.px>5000&&h3.tris>200,"the 3D site view draws the plant and a gas cloud ("+JSON.stringify(h3)+")");
  const pq=await q.evaluate(async()=>{PDM.sel=1;go("mnt");MHS.view="pdm";render();await new Promise(r=>setTimeout(r,600));const as=pdmAsof(),M=pd2Modes(0,as),R=K.sets.map(s=>pd2Rel(s.n,as)),F=pd2ModeFcst(1,as,90),bt=pd2Backtest(),html=document.body.innerText;
   return{modes:M.length,sorted:M.every((m,i)=>!i||M[i-1].rpn>=m.rpn),rel:R.every(r=>Number.isFinite(r.T)&&r.nb>=0),fc:F.length>3&&F.every(f=>f.p>=0&&f.p<=1&&f.lo<=f.p+1e-9&&f.p<=f.hi+1e-9),bt:bt.N>20&&bt.k>=0&&bt.k<=1,story:pd2Story(1).length>200,page:/Reliability analysis/.test(html),clip:pd2Clip("Hexane leak observed at GA-1201A seal gland during operation, seal dr.").endsWith("...")}});
  ok(pq.modes>=6&&pq.sorted&&pq.rel&&pq.fc&&pq.bt&&pq.story&&pq.page&&pq.clip,"predictive analysis: failure modes, reliability measures, mode forecasts with ranges, tested combined score and narrative ("+JSON.stringify(pq)+")");
  const rd=await q.evaluate(async()=>{const a=rdyChecks(1);P.set=1;LIVE.f[FK("PSLL-1201")]=true;const b=rdyChecks(1);delete LIVE.f[FK("PSLL-1201")];go("equipment",{set:3,tab:"ready"});await new Promise(r=>setTimeout(r,500));const html=document.body.innerText;
   PD2.all=true;const n0=UKB.items.length;pd2Draft("Electrical or motor",0);const d=UKB.items.length-n0;return{items:a.items.length,v1:a.verdict,v2:b.verdict,bad:b.bad,page:/Start-up readiness/.test(html)&&/Decision/.test(html),draft:d}});
  ok(rd.items>=12&&rd.v2==="NO-GO"&&rd.bad>=1&&rd.page&&rd.draft===1,"start-up readiness lists the checks, a latched trip makes it NO-GO, and a failure mode with no lesson gets a draft lesson ("+JSON.stringify(rd)+")");
  const pl=await q.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));go("dashboard");await w(500);const attn=!!document.querySelector(".plattn");go("equipment",{set:1,tab:"overview"});await w(700);const chip=/Start-up:/.test(document.body.innerText),title=document.title;
   HSE.n=1;HSE.sc="cloud";HSE.ign=-1;hseCalc();const ws=hseWindScan(),wi=hseWorstIgn();hseKeep();hseKeep();const cases=HSE.cases.length;HSE.cases=[];
   PD2.tab="use";const u=pd2Usage();PD2.disc="Mechanical";const mm=pd2Modes(0,pdmAsof()).length;PD2.disc="";const all=pd2Modes(0,pdmAsof()).length;PD2.tab="modes";
   go("quality");await w(300);const exp=/Export register/.test(document.body.innerText);const gl=plGloss("<p>LFL and RPN</p>").split("<abbr").length-1;
   return{attn,chip,title,ws:ws.length,wi:!!wi,cases,u:u.length,disc:mm<=all,exp,gl}});
  ok(pl.attn&&pl.chip&&/Asset Knowledge Platform/.test(pl.title)&&pl.ws===8&&pl.wi&&pl.cases===2&&pl.u>=50&&pl.disc&&pl.exp&&pl.gl===2,"polish: attention strip, header chips, page titles, worst wind and ignition time, kept cases, lesson use, discipline filter, exports and hover definitions ("+JSON.stringify(pl)+")");
  ok(qe.length===0,"new pages produce no script errors ("+qe.join("; ")+")");await q.close()}
 {const q=await b.newPage();await q.addInitScript(()=>{try{localStorage.setItem("akp_lang","id")}catch(e){}});await q.goto("file://"+path.resolve("dist/index.html"),{waitUntil:"commit"});await q.waitForFunction(()=>typeof AUTH!=="undefined"&&AUTH.user,null,{timeout:60000});await q.waitForTimeout(900);
  const t=await q.evaluate(()=>[...document.querySelectorAll(".nav")].map(n=>n.innerText.trim()).join("|"));ok(/Pemeliharaan/.test(t)&&/Asisten AI/.test(t),"Indonesian interface translates the menu ("+t.slice(0,80)+")");await q.close()}
 /* 3D models, performance, governance, coverage removed */
 {const q=await b.newPage({viewport:{width:1300,height:900}}),qe=[];q.on("pageerror",e=>qe.push(e.message));await q.goto("file://"+path.resolve("dist/index.html"),{waitUntil:"commit"});await q.waitForFunction(()=>typeof perfM==="function"&&typeof g3Mode==="function"&&AUTH.user,null,{timeout:60000});
  const m3=await q.evaluate(()=>{const r=[];for(const s of K.sets){const M=g3Mesh(s.n);const keys=new Set(M.faces.map(f=>f.k).filter(Boolean));const bom=new Set(GAD[s.n].parts.map(p=>p.k));const miss=[...bom].filter(k=>!keys.has(k));r.push({n:s.n,faces:M.faces.length,miss})}return r});
  ok(m3.every(x=>x.faces>200),"3D models exist for all 8 equipment sets ("+m3.map(x=>x.faces).join(", ")+" faces)");
  ok(m3.every(x=>x.miss.length===0),"every part of the 2D drawing exists in the 3D model "+JSON.stringify(m3.filter(x=>x.miss.length).map(x=>x.n+":"+x.miss.join("/"))));
  await q.evaluate(async()=>{go("equipment",{set:4,tab:"ga"});await new Promise(r=>setTimeout(r,400));g3Mode("3d");await new Promise(r=>setTimeout(r,600))});
  const pt=await q.evaluate(async()=>{await new Promise(r=>setTimeout(r,500));const box=document.querySelector(".gfig .g3box"),I=G3.inst[box.id],svg=box.querySelector("svg"),r=svg.getBoundingClientRect();let hit=null;for(let vy=120;vy<420&&!hit;vy+=9)for(let vx=200;vx<700&&!hit;vx+=9){const k=g3PickAt(I,vx,vy);if(k)hit={x:r.x+vx/900*r.width,y:r.y+vy/500*r.height,k}}let cov=0;for(const v of I.pickBuf.PF)if(v)cov++;return{x:hit.x,y:hit.y,k:hit.k,n:cov,mode:G3.mode,stored:localStorage.getItem("akp_gmode")}});
  ok(pt.n>8000&&pt.mode==="3d"&&pt.stored==="3d","the 3D view draws the machine and the choice is remembered ("+pt.n+" pixels)");
  await q.mouse.click(pt.x,pt.y);await q.waitForTimeout(400);
  const v3=await q.evaluate(()=>({sel:G.sel,card:!!document.querySelector(".g3card"),cardTxt:(document.querySelector(".g3card")||{}).innerText||"",panel:(document.querySelector("#gp")||{}).innerText||""}));
  ok(v3.sel===pt.k&&pt.k,"a real mouse click on a 3D solid selects the same part as the 2D drawing ("+pt.k+")");
  ok(v3.card&&v3.cardTxt.length>30&&v3.panel.includes(v3.cardTxt.split("\n")[0].slice(0,6)),"the 3D view shows the part information card and the side panel shows the same part");
  const sw=await q.evaluate(async()=>{g3Mode("2d");await new Promise(r=>setTimeout(r,100));return !!document.querySelector(".g2:not([hidden]) svg#gsvg")});ok(sw,"switching back to 2D shows the original drawing");
  const pf=await q.evaluate(()=>{const bad=[];for(const n of [0,...K.sets.map(s=>s.n)]){const m=perfM(n);if(![m.k.av,m.k.bd,m.k.cost,m.bdYr,m.health].every(Number.isFinite))bad.push(n)}return{bad,spares:perfSpares(0).length}});ok(pf.bad.length===0&&pf.spares>20,"performance numbers are finite for the plant and all sets ("+pf.spares+" spare parts)");
  for(const t of ["rel","know","spares","tgt"]){const h=await q.evaluate(t=>{PERF.set=0;PERF.tab=t;return perfPage().length},t);ok(h>800,"performance tab "+t+" renders")}
  const tg=await q.evaluate(()=>{ROLE.name="Operator";const a=perfSetT("avail");ROLE.name="Manager";return a===false||a===undefined});ok(tg,"an Operator cannot change a target");
  const gv=await q.evaluate(()=>["controls","feasible","roadmap","biz"].map(t=>{GOV.tab=t;return govPage().length>1500&&!govPage().includes("${")}).every(Boolean));ok(gv,"governance tabs render");
  const dk=await q.evaluate(()=>{go("dashboard");ovPick(2,{});return st.page==="equipment"&&st.set===2&&st.tab==="overview"});ok(dk,"selecting a P&ID tile on the dashboard opens that equipment set");
  const ds=await q.evaluate(()=>{go("equipment",{set:4,tab:"ds"});return document.querySelectorAll(".dsrow").length>20&&!!document.querySelector(".dskeys")});ok(ds,"the datasheet renders as grouped specifications");
  const hd=await q.evaluate(()=>{go("equipment",{set:4,tab:"overview"});return !!document.querySelector(".eqhero")&&document.querySelectorAll(".eqr").length===8&&!!document.querySelector(".g3mini")});ok(hd,"the equipment page shows the header, key indicators and eight record cards");
  /* 3D plant on the dashboard */
  await q.evaluate(()=>go("dashboard"));await q.waitForTimeout(1800);
  const pl=await q.evaluate(()=>({faces:P3.faces.length,labs:document.querySelectorAll(".p3lab").length,ms:P3.frameMs,order:document.getElementById("p3").compareDocumentPosition(document.getElementById("ovsvg"))&4,routes:P3.routes.length,units:Object.keys(P3.units).length}));
  ok(pl.faces>8000&&pl.labs===8&&pl.units===8&&pl.routes>=11,"the 3D plant is built with eight units, floating labels and the process streams ("+pl.faces+" faces, "+pl.routes+" pipes)");
  ok(pl.order===4&&Number.isFinite(pl.ms),"the 3D plant comes first on the dashboard and the P&ID overview follows below it");
  const hp=await q.evaluate(()=>{for(let y=60;y<580;y+=12)for(let x=20;x<1100;x+=12){const h=p3Pick(x,y);if(h&&h.u)return{x,y,u:h.u}}return null});ok(!!hp,"a unit can be picked in the 3D plant");
  await q.evaluate(()=>{p3Select(4,true)});await q.waitForTimeout(3500);
  ok(await q.evaluate(()=>st.page==="dashboard"&&P3.sel===4&&!!document.querySelector("#p3card button")),"selecting a unit flies to it and shows its card without leaving the dashboard");
  await q.evaluate(()=>{P3.open=true;p3Select(4,true)});await q.waitForTimeout(4500);
  ok(await q.evaluate(()=>st.page==="equipment"&&st.set===4&&st.tab==="overview"),"with Open set automatically ticked the equipment set opens on arrival");
  await q.evaluate(()=>{P3.open=false});
  await q.evaluate(()=>go("dashboard"));await q.waitForTimeout(1200);
  const tp=await q.evaluate(async()=>{ovTrip(4);p3State();const a=P3.st[4].st,b=P3.st[3].st;ovTrip(4);p3State();return{a,b,after:P3.st[4].st}});ok(tp.a==="trip"&&tp.after==="ok","a trip started in the simulator shows in the 3D plant and clears again ("+tp.a+", downstream "+tp.b+")");
  const cv=await q.evaluate(()=>!document.querySelector('.nav[data-page="cov"]')&&typeof covPage==="undefined");ok(cv,"the Case 1 Coverage page is gone");
  const kp=await q.evaluate(async()=>{AI.cfg.remote=false;const r=await aiAsk("Show me the KPIs of the plant",{noLog:true});return r.tool+" "+/Availability/.test(r.text)});ok(kp==="kpi_summary true","the assistant answers key indicator questions");
  ok(qe.length===0,"new pages produce no script errors ("+qe.join("; ")+")");await q.close()}
 await b.close();console.log(fails?"\n"+fails+" check(s) failed":"\nAll checks passed");process.exit(fails?1:0)})();
