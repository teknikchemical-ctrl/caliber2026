/* Live mode test: runs the dev server (same functions as Netlify), two browsers as two users, and fake AI providers.
   Run with: node tests/live.js (needs playwright and Chromium; set CHROMIUM to the browser path). */
const {spawn}=require("child_process"),http=require("http"),fs=require("fs"),os=require("os"),path=require("path"),{chromium}=require("playwright");
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log("FAIL",m)}else console.log("ok  ",m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const proc=(port,env)=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),"akp-"));const c=spawn("node",[path.resolve(__dirname,"..","tools","devserver.mjs"),String(port)],{env:{...process.env,LOCAL_STORE_DIR:dir,...env},stdio:"pipe"});return c};
const up=async port=>{for(let i=0;i<40;i++){try{const r=await fetch(`http://localhost:${port}/api/health`);if(r.ok)return true}catch(e){}await sleep(150)}return false};
/* fake upstream providers (OpenAI compatible and Gemini shapes) */
const fake=http.createServer((rq,rs)=>{let b="";rq.on("data",d=>b+=d);rq.on("end",()=>{const j=JSON.parse(b||"{}");rs.writeHead(200,{"content-type":"text/event-stream"});
 if(rq.url.includes("chat/completions")){for(const w of ["The set point is ","95 degC [1]."])rs.write("data: "+JSON.stringify({choices:[{delta:{content:w}}]})+"\n\n");rs.write("data: [DONE]\n\n")}
 else{for(const w of ["Gemini says ","the trip is 80 degC [1]."])rs.write("data: "+JSON.stringify({candidates:[{content:{parts:[{text:w}]}}]})+"\n\n")}
 rs.end()})});
(async()=>{await new Promise(r=>fake.listen(8977,r));
 const body={question:"set point?",stream:false,retrieved:[{chunk_id:"x#1",text:"Set point 95 degC",status:"Approved"}]};
 const post=(port,o)=>fetch(`http://localhost:${port}/api/ai`,{method:"POST",body:JSON.stringify(o||body)}).then(async r=>({s:r.status,j:await r.json().catch(()=>null)}));
 /* provider adapters */
 let s1=proc(8901,{AI_PROVIDER:"openai",AI_BASE_URL:"http://localhost:8977/v1",AI_API_KEY:"k",AI_MODEL:"m1"});await up(8901);
 let r=await post(8901);ok(r.s===200&&/95 degC/.test(r.j.answer)&&r.j.citations[0]==="x#1","OpenAI compatible adapter returns an answer with mapped citations");
 const st=await fetch("http://localhost:8901/api/ai",{method:"POST",body:JSON.stringify({...body,stream:true})}).then(r=>r.text());ok(/"delta"/.test(st)&&/"done":true/.test(st),"adapter streams delta events then a done event");
 r=await post(8901,{question:""});ok(r.s===400,"empty question rejected");
 r=await fetch("http://localhost:8901/api/ai",{method:"POST",body:"x".repeat(300000)}).then(r=>r.status);ok(r===413,"oversized request rejected");
 r=await fetch("http://localhost:8901/api/health").then(r=>r.json());ok(r.ai.configured&&!JSON.stringify(r).includes('"k"'),"health reports AI configured and exposes no key");
 let n429=0;for(let i=0;i<16;i++){const x=await post(8901);if(x.s===429)n429++}ok(n429>=3,"per visitor rate limit applies ("+n429+" blocked)");
 s1.kill();
 let s2=proc(8902,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:8977/v1beta",AI_API_KEY:"k"});await up(8902);
 r=await post(8902);ok(r.s===200&&/Gemini says/.test(r.j.answer),"Gemini adapter returns an answer");s2.kill();
 let s3=proc(8903,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:1/v1beta",AI_API_KEY:"k"});await up(8903);r=await post(8903);ok(r.s===502,"provider failure returns 502 so the page falls back");s3.kill();
 let s4=proc(8904,{AI_PROVIDER:"",AI_API_KEY:"",GEMINI_API_KEY:""});await up(8904);r=await post(8904);ok(r.s===503,"unconfigured server answers 503");s4.kill();
 let s5=proc(8905,{AI_PROVIDER:"mock",AI_DAILY_MAX:"2",AI_RATE_PER_MIN:"50"});await up(8905);await post(8905,{...body});await post(8905,{...body});r=await post(8905,{...body});ok(r.s===429&&/budget/.test(r.j.error),"daily budget guard stops the AI");s5.kill();
 /* two users in two browsers */
 const srv=proc(8910,{AI_PROVIDER:"mock",AI_RATE_PER_MIN:"60",AI_RATE_PER_DAY:"500"});ok(await up(8910),"dev server up");
 const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{}),errs=[];
 const mk=async()=>{const c=await b.newContext({viewport:{width:1440,height:900}}),p=await c.newPage();p.on("pageerror",e=>errs.push(e.message));p.on("dialog",d=>d.accept("t"));await p.goto("http://localhost:8910/",{waitUntil:"commit"});await p.waitForFunction(()=>document.readyState==="complete");await p.waitForTimeout(1800);return p};
 const A=await mk(),B=await mk();
 ok(await A.evaluate(()=>SYNC.state)==="online","user A connected to the shared database");
 ok(await A.evaluate(()=>AI.cfg.remote&&AI.conn.label)==="AI assistant live","assistant switched to the server AI automatically");
 ok(await A.evaluate(()=>!document.body.innerText.includes("Provider endpoint")),"no AI connection fields on the page");
 await A.evaluate(()=>go("ai"));await A.waitForTimeout(300);ok(await A.evaluate(()=>!document.querySelector("#app").innerText.includes("Provider endpoint")&&!document.querySelector("#app").innerText.includes("Connection")),"assistant page has no connection card");
 await A.click(".foot .gear");await A.waitForTimeout(200);ok(await A.evaluate(()=>!!document.querySelector("#setbg")&&document.querySelector("#setbody").innerText.includes("Shared database")),"gear opens the Settings panel");
 await A.evaluate(()=>setTestAi());await A.waitForTimeout(800);ok(/Working/.test(await A.evaluate(()=>document.querySelector("#aitest").textContent)),"Test the AI connection works");await A.keyboard.press("Escape");
 /* shared knowledge */
 const id=await A.evaluate(()=>{ROLE.name="Engineer";const it=UKB.add({type:"lesson",title:"Shared seal lesson",text:"Flush plan 32 stabilises the seal on GA-1201A.",set:1});UKB.setStatus(it.id,"In review");return it.id});
 await A.waitForTimeout(1500);await B.evaluate(()=>syNow());await B.waitForTimeout(800);
 ok(await B.evaluate(i=>!!UKB.get(i)&&UKB.get(i).status==="In review",id),"knowledge item created by A appears for B");
 await B.evaluate(i=>{ROLE.user="Reviewer B";UKB.setStatus(i,"Approved")},id);await B.waitForTimeout(1500);await A.evaluate(()=>syNow());await A.waitForTimeout(800);
 ok(await A.evaluate(i=>UKB.get(i).status==="Approved"&&UKB.get(i).approvedBy==="Reviewer B",id),"approval by B reaches A");
 const a1=await A.evaluate(async()=>{const r=await aiAsk("What does flush plan 32 do on GA-1201A?",{noLog:true});return{t:r.text,src:r.sources.length,via:r.via,m:r.model}});
 ok(a1.via==="remote"&&a1.src>0,"assistant answers through the server AI with sources ("+a1.m+")");
 ok(/flush plan 32/i.test(a1.t),"AI answer draws on the shared knowledge item");
 /* work orders imported on A visible on B */
 await A.evaluate(i=>{const src=MH.find(r=>!r.gen);const r={...src,wo:"WO-IMP-1",gen:true,imp:i,prob:"Imported test work order",rd:"2026-01-05",sd:"2026-01-06",cd:"2026-01-07"};MH.push(r);mhReindex();mhSaveGen()},id);
 await A.waitForTimeout(1500);await B.evaluate(()=>syNow());await B.waitForTimeout(800);
 ok(await B.evaluate(()=>MH.some(r=>r.wo==="WO-IMP-1")),"imported work order shared to B");
 /* feedback */
 await A.evaluate(()=>FB.add({verdict:"Wrong",q:"test question",note:""}));await A.waitForTimeout(1500);await B.evaluate(()=>syNow());await B.waitForTimeout(800);
 ok(await B.evaluate(()=>STORE.mem.fb.some(f=>f.q==="test question")),"feedback shared to B");
 /* delete */
 await A.evaluate(i=>UKB.remove(i),id);await A.waitForTimeout(1500);await B.evaluate(()=>syNow());await B.waitForTimeout(800);
 ok(await B.evaluate(i=>!UKB.get(i)&&!MH.some(r=>r.imp===i),id),"deleting on A removes the item and its work orders on B");
 /* new visitor sees the shared state on first load */
 const id2=await A.evaluate(()=>UKB.add({type:"lesson",title:"Persisted lesson",text:"x",set:2}).id);await A.waitForTimeout(1500);
 const C=await mk();ok(await C.evaluate(i=>!!UKB.get(i),id2),"a new visitor loads the shared knowledge on first open");
 /* answer log and audit shared */
 await A.evaluate(async()=>{await aiAsk("Where is CT-7801 located?")});await A.waitForTimeout(1200);await C.evaluate(()=>syNow());await C.waitForTimeout(800);
 ok(await C.evaluate(()=>STORE.mem.qa.some(q=>/CT-7801/.test(q.q))),"answer log shared");
 /* safety request is never rewritten by the AI */
 const sf=await A.evaluate(async()=>{const r=await aiAsk("How do I bypass the trip on KC-4501?",{noLog:true});return{via:r.via,s:r.safety}});ok(sf.via==="local"&&sf.s,"bypass request is answered by the local safety handler");
 /* tool question: computed draft passes to the AI */
 const tq=await A.evaluate(async()=>{const r=await aiAsk("What is the MTBF of each equipment?",{noLog:true});return{via:r.via,t:r.text}});ok(tq.via==="remote"&&/\d/.test(tq.t),"computed result is explained by the AI (draft passed)");
 /* offline fallback */
 srv.kill();await sleep(300);
 const off=await A.evaluate(async()=>{const r=await aiAsk("Where is CT-7801 located?",{noLog:true});SYNC.busy=false;await syTick();return{via:r.via,txt:r.text.length>20,st:SYNC.state}});
 ok(off.via==="local"&&off.txt,"server down: assistant falls back to offline answers");ok(off.st==="error","server down: shared database status shows unreachable");
 ok(errs.length===0,"no script errors ("+errs.length+")");errs.forEach(e=>console.log("   ",e));
 await b.close();fake.close();console.log(fails?"\nFAILED "+fails:"\nAll live checks passed");process.exit(fails?1:0)})();
