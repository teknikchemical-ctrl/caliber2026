/* Live mode test: runs the dev server (same functions as Netlify), two browsers as two users, and fake AI providers.
   Run with: node tests/live.js (needs playwright and Chromium; set CHROMIUM to the browser path). */
const {spawn}=require("child_process"),http=require("http"),fs=require("fs"),os=require("os"),path=require("path"),{chromium}=require("playwright");
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log("FAIL",m)}else console.log("ok  ",m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const proc=(port,env)=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),"akp-"));const c=spawn("node",[path.resolve(__dirname,"..","tools","devserver.mjs"),String(port)],{env:{...process.env,LOCAL_STORE_DIR:dir,...env},stdio:"pipe"});return c};
const up=async port=>{for(let i=0;i<40;i++){try{const r=await fetch(`http://localhost:${port}/api/health`);if(r.ok)return true}catch(e){}await sleep(150)}return false};
/* fake upstream providers (OpenAI compatible and Gemini shapes) */
let LAST=null;const fake=http.createServer((rq,rs)=>{let b="";rq.on("data",d=>b+=d);rq.on("end",()=>{const j=JSON.parse(b||"{}");if(rq.url==="/__last"){rs.writeHead(200,{"content-type":"application/json"});return rs.end(JSON.stringify(LAST))}if(rq.method==="POST")LAST={url:rq.url,body:j,key:rq.headers["x-goog-api-key"]};if(rq.url.includes("/models/nothink:")&&j.generationConfig&&j.generationConfig.thinkingConfig){rs.writeHead(400,{"content-type":"application/json"});return rs.end(JSON.stringify({error:{message:"Thinking is not supported by this model"}}))}
 if(rq.headers["x-goog-api-key"]==="slow-diagnostics"||rq.url.includes("/models/slow-answer:")){return}
 if(rq.headers["x-goog-api-key"]==="rejected-diagnostics"){rs.writeHead(403,{"content-type":"application/json"});return rs.end(JSON.stringify({error:{message:"API key restrictions reject this request"}}))}
 if(rq.url.includes(":generateContent")&&["empty-diagnostics","blocked-diagnostics","invalid-diagnostics","slow-body-diagnostics"].includes(rq.headers["x-goog-api-key"])){
  rs.writeHead(200,{"content-type":"application/json"});
  if(rq.headers["x-goog-api-key"]==="slow-body-diagnostics"){rs.write('{');return}
  return rs.end(rq.headers["x-goog-api-key"]==="invalid-diagnostics"?"not JSON":JSON.stringify(rq.headers["x-goog-api-key"]==="blocked-diagnostics"?{promptFeedback:{blockReason:"SAFETY"}}:{candidates:[{content:{parts:[{thought:true,text:"hidden reasoning"}]}}]}));
 }
 if(rq.url.includes("chat/completions")&&j.stream===false){rs.writeHead(200,{"content-type":"application/json"});return rs.end(JSON.stringify({choices:[{message:{content:"OK"}}]}))}
 if(rq.method==="GET"&&rq.url.includes("/models")){rs.writeHead(200,{"content-type":"application/json"});return rs.end(JSON.stringify({models:[{name:"models/gemini-2.0-flash"},{name:"models/gemini-2.5-flash"},{name:"models/gemini-embedding-001",supportedGenerationMethods:["embedContent"]},{name:"models/gemini-9-flash",supportedGenerationMethods:["generateContent"]},{name:"models/gemini-9-flash-lite",supportedGenerationMethods:["generateContent"]}]}))}
 if(rq.url.includes("batchEmbedContents")){rs.writeHead(200,{"content-type":"application/json"});return rs.end(JSON.stringify({embeddings:(j.requests||[]).map((_,i)=>({values:[1,i%3,2,0.5]}))}))}
 if(/\/models\/busy-model:/.test(rq.url)){rs.writeHead(503,{"content-type":"application/json"});return rs.end(JSON.stringify({error:{message:"High demand"}}))}
 if(/\/models\/quota-\d:/.test(rq.url)){rs.writeHead(429,{"content-type":"application/json"});return rs.end(JSON.stringify({error:{message:"Quota exceeded for this model"}}))}
 if(/\/models\/(badmodel|gone-\d|gemini-2\.0-flash-gone):/.test(rq.url)){rs.writeHead(404,{"content-type":"application/json"});return rs.end(JSON.stringify({error:{message:"models/badmodel is not found for API version v1beta"}}))}
 if(rq.url.includes(":generateContent")){const tx=(((j.contents||[{}])[0].parts||[{}])[0].text||""),body=(/TEXT:\n([\s\S]*?)\n\nKnown equipment/.exec(tx)||[])[1]||"";
  const out={kind:"sop",confidence:88,title:"Start-up of KC-4501",summary:"Start-up checks for the recycle gas compressor.",tags:["KC-4501","PSLL-4504","XX-9999"],set_tag:"KC-4501",revision:"B",date:"2026-03-01",classification:"internal",
   steps:[{n:1,text:"Check lube oil level",quote:"1. Check lube oil level"},{n:2,text:"Open suction valve ZSO-4510",quote:"2. Open suction valve ZSO-4510"},{n:3,text:"Run the compressor for one hour",quote:"3. Run the compressor for one hour"}],
   warnings:[{text:"Do not start with lube oil pressure below 2 barg",quote:"WARNING: Do not start with lube oil pressure below 2 barg"}],
   facts:[{tag:"PSLL-4504",kind:"setpoint",name:"Lube oil pressure low-low trip",value:"2",unit:"barg",vote:"1oo1",quote:"PSLL-4504 trip set point: 2 barg"},{tag:"TSHH-4503",kind:"setpoint",name:"Discharge temperature trip",value:"140",unit:"degC",vote:"1oo1",quote:"TSHH-4503 trip: 140 degC"}],
   kv:[],opl:{objective:"",steps:[],symptom:"",cause:"",action:"",keypoints:[],caution:""},incident:{description:"",symptom:"",cause:"",action:"",prevent:"",impact:""},gaps:["no approver named"],_seen:body.length};
  rs.writeHead(200,{"content-type":"application/json"});return rs.end(JSON.stringify({candidates:[{content:{parts:[{text:/BADJSON/.test(body)?"not json at all":JSON.stringify(out)}]}}]}))}
 rs.writeHead(200,{"content-type":"text/event-stream"});
 if(rq.url.includes("chat/completions")){for(const w of ["The set point is ","95 degC [1]."])rs.write("data: "+JSON.stringify({choices:[{delta:{content:w}}]})+"\n\n");rs.write("data: [DONE]\n\n")}
 else if(j.tools&&/TOOLTEST/.test(JSON.stringify(j.contents))){rs.write("data: "+JSON.stringify({candidates:[{content:{parts:[{functionCall:{name:"maintenance_stats",args:{set:1}}}]}}]})+"\n\n")}
 else if(/BLOCKTEST/.test(JSON.stringify(j.contents))){rs.write("data: "+JSON.stringify({promptFeedback:{blockReason:"SAFETY"}})+"\n\n")}
 else{for(const w of ["Gemini says ","the trip is 80 degC [1]."])rs.write("data: "+JSON.stringify({candidates:[{content:{parts:[{text:w}]}}]})+"\n\n")}
 rs.end()})});
(async()=>{
 /* A suspended cloud worker can delay every timer. Advance the deadline clock explicitly,
    then verify that the handler returns JSON even when its provider never responds. */
 {const {mock}=require("node:test"),saved={...process.env},originalFetch=global.fetch;
  process.env.LOCAL_STORE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),"akp-diagnostic-clock-"));process.env.AI_PROVIDER="gemini";process.env.AI_API_KEY="synthetic-clock-test";
  const {default:diagnostics}=await import("../netlify/functions/selftest.mjs");
  global.fetch=async()=>new Promise(()=>{});
  try{mock.timers.enable({apis:["setTimeout"]});const result=diagnostics();mock.timers.tick(6000);const response=await result,d=await response.json();
   ok(response.status===200&&!d.ok&&d.checks.some(c=>c.name==="Diagnostics"&&!c.ok&&/6 s diagnostics time limit/.test(c.detail)),"diagnostic deadline returns readable JSON at 6 s without a provider response");
  }finally{mock.timers.reset();global.fetch=originalFetch;for(const name of ["LOCAL_STORE_DIR","AI_PROVIDER","AI_API_KEY"]){if(saved[name]===undefined)delete process.env[name];else process.env[name]=saved[name]}}
 }
 await new Promise(r=>fake.listen(8977,r));
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
 r=await post(8902);ok(r.s===200&&/Gemini says/.test(r.j.answer),"Gemini adapter returns an answer");
 /* Reproduce the live chain: retired model, overloaded alias, then a stalled alias. */
 const recovery=proc(8928,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:8977/v1beta",AI_API_KEY:"k",AI_MODEL:"gone-1",AI_MODEL_FALLBACK:"busy-model,slow-answer,gone-2"});await up(8928);
 try{const recovered=await post(8928);ok(recovered.s===200&&recovered.j.model==="gemini-9-flash","retired and overloaded models trigger discovery before a stalled fallback")}finally{recovery.kill()}
 const slowRecovery=proc(8929,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:8977/v1beta",AI_API_KEY:"k",AI_MODEL:"slow-answer",AI_MODEL_FALLBACK:"gemini-2.0-flash"});await up(8929);
 try{const recovered=await post(8929);ok(recovered.s===200&&recovered.j.model==="gemini-2.0-flash","a stalled assistant model times out per attempt and a fallback answers")}finally{slowRecovery.kill()}
 /* AI reading of documents */
 {const EX="Start-up KC-4501 Rev B 2026-03-01\n1. Check lube oil level\n2. Open suction valve ZSO-4510\nWARNING: Do not start with lube oil pressure below 2 barg\nPSLL-4504 trip set point: 2 barg\nContact password: hunter22 or mail ops@example.com";
  const ex=await fetch("http://localhost:8902/api/extract",{method:"POST",body:JSON.stringify({text:EX,name:"startup.txt",known:[{tag:"KC-4501",name:"Recycle Gas Compressor"}]})}).then(async r=>({s:r.status,j:await r.json()}));
  ok(ex.s===200&&ex.j.ok&&ex.j.result.kind==="sop","extraction returns the structure the model read");
  ok(ex.j.result.steps.length===2&&ex.j.verified.rejected>=3,"steps and facts not found in the text are dropped ("+ex.j.verified.rejected+" dropped)");
  ok(ex.j.result.facts.length===1&&ex.j.result.facts[0].tag==="PSLL-4504"&&!ex.j.result.tags.includes("XX-9999"),"only quoted facts and tags that occur in the text are kept");
  const last=await fetch("http://localhost:8977/__last").then(r=>r.json());ok(!JSON.stringify(last.body).includes("hunter22")&&!JSON.stringify(last.body).includes("ops@example.com")&&ex.j.redacted.count===2,"secrets and email addresses are masked before the text reaches the model");
  const bj=await fetch("http://localhost:8902/api/extract",{method:"POST",body:JSON.stringify({text:"BADJSON ".repeat(10),name:"x"})}).then(r=>r.status);ok(bj===502,"an answer that is not JSON is reported as a provider error");
  const sh=await fetch("http://localhost:8902/api/extract",{method:"POST",body:JSON.stringify({text:"short"})}).then(r=>r.status);ok(sh===400,"too little text is rejected");
  const ex2=await fetch("http://localhost:8902/api/extract",{method:"POST",body:JSON.stringify({text:EX,name:"startup.txt"})}).then(r=>r.json());ok(ex2.cached===true,"the same text is answered from the cache")}
 s2.kill();
 let s3=proc(8903,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:1/v1beta",AI_API_KEY:"k"});await up(8903);r=await post(8903);ok(r.s===502,"provider failure returns 502 so the page falls back");s3.kill();
 let s4=proc(8904,{AI_PROVIDER:"",AI_API_KEY:"",GEMINI_API_KEY:""});await up(8904);r=await post(8904);ok(r.s===503,"unconfigured server answers 503");s4.kill();
 let s5=proc(8905,{AI_PROVIDER:"mock",AI_DAILY_MAX:"2",AI_RATE_PER_MIN:"50"});await up(8905);await post(8905,{...body});await post(8905,{...body});r=await post(8905,{...body});ok(r.s===429&&/budget/.test(r.j.error),"daily budget guard stops the AI");s5.kill();
  /* hardening: model fallback, function calling, blocked prompts, languages */
 let s6=proc(8906,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:8977/v1beta",AI_API_KEY:"k",AI_MODEL:"badmodel",AI_MODEL_FALLBACK:"gemini-2.0-flash",AI_RATE_PER_MIN:"60"});await up(8906);
 r=await post(8906);ok(r.s===200&&/Gemini says/.test(r.j.answer)&&r.j.model==="gemini-2.0-flash","unknown model falls back to the next configured model");
 let s6b=proc(8916,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:8977/v1beta",AI_API_KEY:"k",AI_MODEL:"gone-1",AI_MODEL_FALLBACK:"gone-2",AI_RATE_PER_MIN:"60"});await up(8916);
 r=await post(8916,{...body,plant:"Test Refinery"});ok(r.s===200&&/Gemini says/.test(r.j.answer)&&r.j.model==="gemini-9-flash","when every configured model is retired the server finds one the key offers");
 r=await fetch("http://localhost:8916/api/selftest").then(r=>r.json());ok(r.checks.some(c=>c.name==="AI answer"&&c.ok&&/gemini-9-flash/.test(c.detail)),"diagnostics make a real call and name the model that answered");
 let s6c=proc(8917,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:8977/v1beta",AI_API_KEY:"k",AI_MODEL:"quota-1",AI_MODEL_FALLBACK:"gemini-2.0-flash",AI_RATE_PER_MIN:"60"});await up(8917);
 r=await post(8917);ok(r.s===200&&r.j.model==="gemini-2.0-flash","quota exhausted on one model (429) falls back to the next model");
 r=await post(8906,{question:"TOOLTEST please",stream:false,tools:[{name:"maintenance_stats",description:"x",parameters:{type:"object",properties:{set:{type:"integer"}}}}],retrieved:[]});ok(r.s===200&&r.j.tool_calls&&r.j.tool_calls[0].name==="maintenance_stats","model tool call is returned to the page");
 r=await post(8906,{question:"BLOCKTEST",retrieved:[]});ok(r.s===502&&/declined/.test(r.j.error),"a blocked prompt returns a readable error");
 const st2=await fetch("http://localhost:8906/api/ai",{method:"POST",body:JSON.stringify({question:"TOOLTEST",stream:true,tools:[{name:"maintenance_stats",description:"x",parameters:{type:"object",properties:{}}}],retrieved:[]})}).then(r=>r.text());ok(/"tool_calls"/.test(st2),"streamed reply carries the tool call");
 r=await fetch("http://localhost:8906/api/selftest").then(r=>r.json());ok(r.checks.some(c=>/Shared storage/.test(c.name)&&c.ok)&&r.checks.some(c=>/Provider connection/.test(c.name)&&c.ok)&&r.checks.some(c=>/Model badmodel/.test(c.name)&&!c.ok),"diagnostics report storage, connection and an unavailable model");
 r=await fetch("http://localhost:8906/api/embed",{method:"POST",body:JSON.stringify({texts:["alpha","beta"]})}).then(r=>r.json());ok(r.vectors&&r.vectors.length===2&&r.dim>0,"embedding batch returns vectors");
 const e2=await fetch("http://localhost:8906/api/embed",{method:"POST",body:JSON.stringify({texts:["alpha","beta"]})}).then(r=>r.json());ok(JSON.stringify(e2.vectors)===JSON.stringify(r.vectors),"embeddings are cached on the server");
 /* Diagnostics must test actual text, handle stalled bodies and remain below deployment limits. */
 for(const [i,key,expected] of [[0,"empty-diagnostics",/no answer text/],[1,"blocked-diagnostics",/SAFETY/],[2,"invalid-diagnostics",/JSON/],[3,"slow-body-diagnostics",/1.5 s|6 s/],[4,"slow-diagnostics",/6 s/],[5,"rejected-diagnostics",/403/]]){
  const port=8920+i,ds=proc(port,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:8977/v1beta",AI_API_KEY:key,AI_MODEL:"gemini-2.5-flash",AI_MODEL_FALLBACK:"gemini-2.0-flash"});
  try{ok(await up(port),"diagnostic test server starts ("+key+")");const t=performance.now(),d=await fetch(`http://localhost:${port}/api/selftest`).then(r=>r.json());
   ok(!d.ok&&d.checks.some(c=>!c.ok&&expected.test(c.detail)),"diagnostics explain "+key+" without claiming an answer");
   const elapsed=Math.round(performance.now()-t);console.log("    diagnostics elapsed (including worker scheduling): "+elapsed+" ms for "+key);
  }finally{ds.kill()}
 }
 const ds=proc(8926,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:8977/v1beta",AI_API_KEY:"k",AI_MODEL:"slow-answer",AI_MODEL_FALLBACK:"gemini-2.0-flash"});await up(8926);
 try{const d=await fetch("http://localhost:8926/api/selftest").then(r=>r.json());ok(d.checks.some(c=>c.name==="AI answer"&&c.ok&&/gemini-2.0-flash/.test(c.detail)&&/1.5 s/.test(c.detail)),"a slow diagnostic model leaves time for a working fallback")}finally{ds.kill()}
 const ods=proc(8927,{AI_PROVIDER:"openai",AI_BASE_URL:"http://localhost:8977/v1",AI_API_KEY:"k",AI_MODEL:"m1"});await up(8927);
 try{const d=await fetch("http://localhost:8927/api/selftest").then(r=>r.json());ok(d.checks.some(c=>c.name==="AI answer"&&c.ok&&/m1/.test(c.detail)),"OpenAI compatible diagnostics also require actual answer text")}finally{ods.kill()}
 s6.kill();s6b.kill();s6c.kill();
 let s7=proc(8907,{AI_PROVIDER:"mock",AI_RATE_PER_MIN:"60"});await up(8907);
 r=await post(8907,{question:"TOOLTEST",tools:[{name:"maintenance_stats",description:"x",parameters:{type:"object"}}],retrieved:[]});ok(r.j.tool_calls&&r.j.tool_calls.length===1,"mock provider returns a tool call");
 r=await post(8907,{question:"TOOLTEST",tool_results:[{name:"maintenance_stats",result:"26 work orders"}],tools:[{name:"maintenance_stats",description:"x",parameters:{type:"object"}}],retrieved:[]});ok(/26 work orders/.test(r.j.answer),"tool results are used to write the answer");
 r=await fetch("http://localhost:8907/api/health").then(r=>r.json());ok(r.ai.today&&r.ai.today.q>=2,"health reports today's AI usage");
 s7.kill();
  /* Gemini request details and key entry from Settings */
 let s10=proc(8912,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:8977/v1beta",AI_API_KEY:"k",AI_MODEL:"gemini-2.5-flash",AI_RATE_PER_MIN:"60"});await up(8912);
 await post(8912);let last=await fetch("http://localhost:8977/__last").then(r=>r.json());ok(last.body.generationConfig.thinkingConfig&&last.body.generationConfig.thinkingConfig.thinkingBudget===0&&last.key==="k","2.5 flash is called with reasoning switched off and the key header");
 await post(8912,{question:"x",model:"gemini-2.5-flash",tools:[{name:"noargs_tool",description:"d",parameters:{type:"object",properties:{},required:[]}},{name:"with_args",description:"d",parameters:{type:"object",properties:{set:{type:"integer",description:"s"},metric:{type:"string",enum:["a","b"]}},required:["set"],additionalProperties:false}}],retrieved:[]});
 last=await fetch("http://localhost:8977/__last").then(r=>r.json());const fd=last.body.tools[0].functionDeclarations;ok(!fd[0].parameters&&fd[1].parameters.type==="OBJECT"&&fd[1].parameters.properties.set.type==="INTEGER"&&!("additionalProperties" in fd[1].parameters),"tool schemas are cleaned for Gemini (no empty objects, upper case types)");
 s10.kill();
 let s11=proc(8913,{AI_PROVIDER:"gemini",AI_BASE_URL:"http://localhost:8977/v1beta",AI_API_KEY:"k",AI_MODEL:"nothink",AI_MODEL_FALLBACK:"",AI_RATE_PER_MIN:"60"});await up(8913);
 r=await post(8913);ok(r.s===502||r.s===200,"model that rejects reasoning settings is handled");r=await post(8913);ok(r.s===200&&/Gemini says/.test(r.j.answer),"request is repeated without the reasoning setting");s11.kill();
 let s12=proc(8914,{AI_PROVIDER:"",AI_API_KEY:"",GEMINI_API_KEY:"",AI_BASE_URL:"http://localhost:8977/v1beta",ADMIN_CODE:"adm",AI_RATE_PER_MIN:"60"});await up(8914);
 const cfgc=(m,b,h)=>fetch("http://localhost:8914/api/config",{method:m,body:b?JSON.stringify(b):undefined,headers:h||{}}).then(async r=>({s:r.status,j:await r.json().catch(()=>null)}));
 r=await fetch("http://localhost:8914/api/health").then(r=>r.json());ok(!r.ai.configured&&r.canSetKey,"no key yet, key entry is offered");
 r=await cfgc("POST",{key:"abcdefghijklmnop"});ok(r.s===401,"saving a key needs the administrator code");
 r=await cfgc("POST",{key:"short"},{"x-admin-code":"adm"});ok(r.s===400,"a malformed key is refused");
 r=await cfgc("POST",{provider:"gemini",key:"AIzaSyTESTKEY1234567890"},{"x-admin-code":"adm"});ok(r.s===200,"administrator saves a key");
 r=await fetch("http://localhost:8914/api/health").then(r=>r.json());ok(r.ai.configured&&r.ai.source==="saved","health shows the saved key is in use");
 r=await cfgc("GET",null,{"x-admin-code":"adm"});ok(r.j.hasKey&&r.j.keyEnd==="7890"&&!JSON.stringify(r.j).includes("AIzaSy"),"the saved key is never sent back");
 r=await post(8914);ok(r.s===200&&/Gemini says/.test(r.j.answer),"the assistant answers with the saved key");
 last=await fetch("http://localhost:8977/__last").then(r=>r.json());ok(last.key==="AIzaSyTESTKEY1234567890","the saved key is the one sent to the provider");
 r=await cfgc("DELETE",null,{"x-admin-code":"adm"});r=await fetch("http://localhost:8914/api/health").then(r=>r.json());ok(!r.ai.configured,"removing the saved key turns the AI off again");
 s12.kill();
 /* access codes, conflicts, backup */
 let s8=proc(8908,{AI_PROVIDER:"mock",EDIT_CODE:"ed1",APPROVE_CODE:"ap1",ADMIN_CODE:"ad1"});await up(8908);
 const kb=(m,p,b,h)=>fetch("http://localhost:8908/api/kb/"+p,{method:m,body:b?JSON.stringify(b):undefined,headers:h||{}}).then(async r=>({s:r.status,j:await r.json().catch(()=>null)}));
 const item={id:"UK-T1",title:"t",text:"x",status:"Draft",updated:"2026-10-02 10:00:00"};
 r=await kb("PUT","uk/UK-T1",item);ok(r.s===401&&r.j.need==="edit","write without the edit code is refused");
 r=await kb("PUT","uk/UK-T1",item,{"x-edit-code":"ed1"});ok(r.s===200,"write with the edit code is accepted");
 r=await kb("PUT","uk/UK-T1",{...item,status:"Approved",updated:"2026-10-02 10:05:00"},{"x-edit-code":"ed1"});ok(r.s===401&&r.j.need==="approve","approval without the approve code is refused");
 r=await kb("PUT","uk/UK-T1",{...item,status:"Approved",updated:"2026-10-02 10:05:00"},{"x-edit-code":"ed1","x-approve-code":"ap1"});ok(r.s===200,"approval with the approve code is accepted");
 r=await kb("PUT","uk/UK-T1",{...item,text:"stale edit",updated:"2026-10-02 10:06:00",base:"2026-10-02 10:00:00"},{"x-edit-code":"ed1","x-approve-code":"ap1"});ok(r.s===409&&r.j.conflict,"editing from an outdated version is reported as a conflict");
 r=await kb("GET","export");ok(r.s===401,"backup without the admin code is refused");
 const bk=await kb("GET","export",null,{"x-admin-code":"ad1"});ok(bk.s===200&&bk.j.format==="akp-backup-1"&&bk.j.uk.length===1,"backup with the admin code returns the data");
 r=await kb("DELETE","uk/UK-T1",null,{"x-edit-code":"ed1"});r=await kb("GET","state");ok(r.j.uk.length===0,"item removed");
 r=await kb("POST","import",bk.j,{"x-admin-code":"ad1"});r=await kb("GET","state");ok(r.j.uk.length===1,"restore from backup brings the item back");
 r=await kb("POST","purge",{what:"qa"},{"x-admin-code":"ad1"});ok(r.j.ok,"admin can purge the answer log");
 s8.kill();
 let s9=proc(8909,{AI_PROVIDER:"mock"});await up(8909);r=await fetch("http://localhost:8909/api/kb/export").then(r=>r.status);ok(r===403,"admin routes stay disabled when no admin code is set");s9.kill();
 /* two users in two browsers */
 const srv=proc(8910,{AI_PROVIDER:"mock",AI_RATE_PER_MIN:"60",AI_RATE_PER_DAY:"500"});ok(await up(8910),"dev server up");
 const b=await chromium.launch({args:["--disable-background-timer-throttling","--disable-renderer-backgrounding","--disable-backgrounding-occluded-windows","--disable-features=IntensiveWakeUpThrottling"],...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{})}),errs=[];
 const mk=async()=>{const c=await b.newContext({viewport:{width:1440,height:900}}),p=await c.newPage();p.on("pageerror",e=>errs.push(e.message));p.on("dialog",d=>d.accept("t"));await p.goto("http://localhost:8910/",{waitUntil:"commit"});await p.waitForFunction(()=>typeof SYNC!=="undefined"&&typeof setOpen==="function",null,{timeout:60000});await p.waitForTimeout(1800);return p};
 const A=await mk(),B=await mk();
 const evalContext=await b.newContext(),ep=await evalContext.newPage();
 try{await ep.goto("http://localhost:8910/");await ep.waitForFunction(()=>typeof evalRun==="function"&&SYNC.state==="online");
  await ep.evaluate(()=>{AIP.use=false;AI.cfg.remote=false;AI.cfg.mock=false;evalRun()});await ep.waitForFunction(()=>!EV.running,null,{timeout:180000});
  const evaluation=await ep.evaluate(()=>({summary:evSummary(),failed:EV.res.filter(r=>!r.pass).map(r=>r.id)}));
  ok(evaluation.summary.n===131&&evaluation.summary.ok===131,"original plant assistant evaluation: "+evaluation.summary.ok+"/"+evaluation.summary.n+" passed "+evaluation.failed.join(","));
 }finally{await evalContext.close()}

 ok(await A.evaluate(()=>SYNC.state)==="online","user A connected to the shared database");
 ok(await A.evaluate(()=>AI.cfg.remote&&AI.conn.label)==="AI connected","assistant switched to the server AI automatically");
 ok(await A.evaluate(()=>!document.body.innerText.includes("Provider endpoint")),"no AI connection fields on the page");
 await A.evaluate(()=>go("ai"));await A.waitForTimeout(300);ok(await A.evaluate(()=>!document.querySelector("#app").innerText.includes("Provider endpoint")&&!document.querySelector("#app").innerText.includes("Connection")),"assistant page has no connection card");
 await A.click(".foot .gear[aria-label=Settings]");await A.waitForTimeout(200);ok(await A.evaluate(()=>!!document.querySelector("#setbg")&&document.querySelector("#setbody").innerText.includes("Shared database")),"gear opens the Settings panel");
 await A.evaluate(()=>setTestAi());await A.waitForTimeout(800);ok(/Working/.test(await A.evaluate(()=>document.querySelector("#aitest").textContent)),"Test the AI connection works");
 const diagnosticFailure=await A.evaluate(async()=>{const call=aiCallProvider,api=syApi;try{aiCallProvider=async()=>{throw new Error("HTTP 502: provider quota exhausted")};syApi=async()=>({checks:[{name:"Model retired",ok:false,detail:"not listed"},{name:"AI answer",ok:false,detail:"quota exceeded; retry later"}]});await setTestAi();return document.querySelector("#aitest").textContent}finally{aiCallProvider=call;syApi=api}});
 ok(/HTTP 502: provider quota exhausted/.test(diagnosticFailure)&&/AI answer: quota exceeded/.test(diagnosticFailure),"Settings preserves the actual call error and appends the answer diagnostic");
 const emptyConnection=await A.evaluate(async()=>{const call=aiCallProvider,api=syApi;try{aiCallProvider=async()=>({answer:""});syApi=async()=>({checks:[]});await setTestAi();return document.querySelector("#aitest").textContent}finally{aiCallProvider=call;syApi=api}});
 ok(/No answer:.*no answer text/.test(emptyConnection),"Settings does not call an empty answer a working connection");
 await A.evaluate(()=>setTestAi());await A.keyboard.press("Escape");
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
 await A.evaluate(()=>syFlush());await B.evaluate(()=>syNow());await B.waitForTimeout(800);
 ok(await B.evaluate(()=>MH.some(r=>r.wo==="WO-IMP-1")),"imported work order shared to B");
 /* feedback */
 await A.evaluate(()=>FB.add({verdict:"Wrong",q:"test question",note:""}));await A.waitForTimeout(1500);await B.evaluate(()=>syNow());await B.waitForTimeout(800);
 ok(await B.evaluate(()=>STORE.mem.fb.some(f=>f.q==="test question")),"feedback shared to B");
 /* AI ingestion in the wizard: read, review, save, share */
 await A.evaluate(()=>{ROLE.name="Engineer";ROLE.user="Ingest Tester"});
 const wz=await A.evaluate(async()=>{const it={id:"wt1",name:"startup-kc4501.txt",raw:"Start-up KC-4501 Rev C 2026-04-01\n1. Check lube oil level\n2. Open suction valve ZSO-4510\n3. Start the lube oil pump\nWARNING: Do not start with lube oil pressure below 2 barg\nPSLL-4504 trip set point: 2 barg",rows:null};
  wzDetect(it);WZ.q=[it];WZ.i=0;await aiRead(it);const st=it.ai.state;wzStructure(it);wzMeta(it);it.gates=wzGates(it);wzCreate("In review");
  const ui=UKB.items.find(x=>x.fname==="startup-kc4501.txt");return{st,kind:it.kind,model:it.ai.model,id:ui&&ui.id,ai:ui&&ui.meta.ai,src:ui&&ui.meta.sourceText&&ui.meta.sourceText.length,facts:ui&&ui.meta.facts&&ui.meta.facts.length,steps:ui&&ui.meta.steps&&ui.meta.steps.length,set:ui&&ui.set,rev:ui&&ui.meta.docRev}});
 ok(wz.st==="done"&&wz.kind==="sop"&&wz.model==="mock","the wizard reads a pasted document with the AI ("+wz.st+", "+wz.kind+")");
 ok(wz.steps===3&&wz.facts>=1&&wz.set===4&&wz.rev==="C","steps, a typed fact, the equipment set and the revision are filled from the reading");
 ok(wz.ai&&wz.ai.reviewedBy==="Ingest Tester"&&wz.src>100,"the saved item records the AI reading and keeps the source text");
 await A.waitForTimeout(1500);await B.evaluate(()=>syNow());await B.waitForTimeout(800);
 ok(await B.evaluate(id=>{const u=UKB.get(id);return !!u&&u.meta&&u.meta.ai&&u.meta.facts&&u.meta.facts.length>=1},wz.id),"the AI-read item and its facts reach the other user");
 const as=await B.evaluate(async()=>{AI.cfg.remote=false;const r=await aiAsk("What is the trip set point of PSLL-4504?",{noLog:true});return r.text});ok(/2\s*barg/i.test(as),"the assistant can answer from the facts that were read");
 /* delete */
 await A.evaluate(i=>UKB.remove(i),id);await A.evaluate(()=>syFlush());await B.evaluate(()=>syNow());await B.waitForTimeout(800);
 ok(await B.evaluate(i=>!UKB.get(i)&&!MH.some(r=>r.imp===i),id),"deleting on A removes the item and its work orders on B");
 /* editing the same item from two browsers: the later save becomes a conflict copy */
 const cid=await A.evaluate(()=>{const it=UKB.add({type:"lesson",title:"Conflict test",text:"base",set:1});return it.id});await A.waitForTimeout(1500);await B.evaluate(()=>syNow());await B.waitForTimeout(900);
 await A.evaluate(i=>UKB.update(i,{text:"edit by A"}),cid);await A.waitForTimeout(1500);
 await B.evaluate(i=>UKB.update(i,{text:"edit by B"}),cid);await B.waitForTimeout(2000);
 const cf=await B.evaluate(i=>({copy:UKB.items.some(x=>/conflict copy/.test(x.title)),keep:UKB.get(i)&&UKB.get(i).text}),cid);
 ok(cf.copy&&cf.keep==="edit by A","simultaneous edit: the other version is kept and this edit is saved as a conflict copy");
 /* meaning-based search data */
 let waited=0;while(waited<45000&&!(await A.evaluate(()=>DB.hasEmb))){await A.waitForTimeout(1500);waited+=1500}
 ok(await A.evaluate(()=>DB.hasEmb),"record embeddings are prepared in the background");
 const qv=await A.evaluate(async()=>{const v=await embQuery("recycle compressor start permissive");return v?v.length:0});ok(qv>0,"a question can be embedded for meaning-based search");
 const sem=await A.evaluate(async()=>{const r=await aiAsk("What are the start permissives of the recycle compressor?",{noLog:true});return{n:r.sources.length}});ok(sem.n>0,"search with embeddings still returns sources");
 /* new visitor sees the shared state on first load */
 const id2=await A.evaluate(()=>UKB.add({type:"lesson",title:"Persisted lesson",text:"x",set:2}).id);await A.waitForTimeout(1500);
 const C=await mk();ok(await C.evaluate(i=>!!UKB.get(i),id2),"a new visitor loads the shared knowledge on first open");
 /* answer log and audit shared */
 await A.evaluate(async()=>{await aiAsk("Where is CT-7801 located?")});await A.waitForTimeout(1200);await C.evaluate(()=>syNow());await C.waitForTimeout(800);
 ok(await C.evaluate(()=>STORE.mem.qa.some(q=>/CT-7801/.test(q.q))),"answer log shared");
 const partialStream=await A.evaluate(async()=>{const original=window.fetch,cfg={...AI.cfg};try{AI.cfg.mock=false;AI.cfg.stream=true;window.fetch=async()=>new Response('{"delta":"incomplete answer"}\n{"error":"provider timed out"}\n',{headers:{"content-type":"application/x-ndjson"}});try{await aiCallProvider({question:"test"},{onToken:()=>{}});return false}catch(e){return /provider timed out/.test(e.message)}}finally{window.fetch=original;Object.assign(AI.cfg,cfg)}});
 ok(partialStream,"a provider error after partial streamed text is rejected instead of accepted as an answer");
 /* safety request is never rewritten by the AI */
 const sf=await A.evaluate(async()=>{const r=await aiAsk("How do I bypass the trip on KC-4501?",{noLog:true});return{via:r.via,s:r.safety}});ok(sf.via==="local"&&sf.s,"bypass request is answered by the local safety handler");
 /* tool question: computed draft passes to the AI */
 const tq=await A.evaluate(async()=>{const r=await aiAsk("What is the MTBF of each equipment?",{noLog:true});return{via:r.via,t:r.text}});ok(tq.via==="remote"&&/\d/.test(tq.t),"computed result is explained by the AI (draft passed)");
 /* access codes in the browser */
 const sc=proc(8911,{AI_PROVIDER:"mock",EDIT_CODE:"ed9"});await up(8911);
 const bc=await b.newContext({viewport:{width:1280,height:800}}),D=await bc.newPage();D.on("pageerror",e=>errs.push(e.message));await D.goto("http://localhost:8911/",{waitUntil:"commit"});await D.waitForFunction(()=>typeof SYNC!=="undefined"&&typeof setOpen==="function",null,{timeout:60000});await D.waitForTimeout(1800);
 await D.evaluate(()=>{ACC.edit="";UKB.add({type:"lesson",title:"Needs code",text:"x",set:1})});await D.waitForTimeout(2200);
 ok(await D.evaluate(()=>SYNC.codeNeeded==="edit"),"a save without the edit code is reported to the user");
 await D.evaluate(()=>{ACC.edit="ed9";accSave();SYNC.codeNeeded=null;syPush()});await D.waitForTimeout(2200);
 const ks=await fetch("http://localhost:8911/api/kb/state").then(r=>r.json());ok(ks.uk.some(x=>x.title==="Needs code"),"after entering the edit code the item reaches the shared database");
 await D.evaluate(()=>setOpen());await D.waitForTimeout(300);ok(await D.evaluate(()=>document.querySelector("#setbody").innerText.includes("Access codes")),"Settings shows the access code fields when the site requires codes");
 await bc.close();sc.kill();
 /* entering the AI key from Settings */
 const sk=proc(8915,{AI_PROVIDER:"",AI_API_KEY:"",GEMINI_API_KEY:"",AI_BASE_URL:"http://localhost:8977/v1beta",ADMIN_CODE:"adm",AI_RATE_PER_MIN:"60"});await up(8915);
 const kc=await b.newContext({viewport:{width:1280,height:900}}),K=await kc.newPage();K.on("pageerror",e=>errs.push(e.message));await K.goto("http://localhost:8915/",{waitUntil:"commit"});await K.waitForFunction(()=>typeof SYNC!=="undefined"&&typeof setOpen==="function",null,{timeout:60000});await K.waitForTimeout(1800);
 ok(await K.evaluate(()=>SYNC.state==="online"&&!SYNC.ai.configured&&AI.conn.state==="local"),"site without a key starts in search-only mode");
 await K.evaluate(()=>{ACC.admin="adm";accSave();setOpen()});await K.waitForTimeout(300);
 ok(await K.evaluate(()=>document.querySelector("#setbody").innerText.includes("Connect the AI")),"Settings offers to connect the AI");
 await K.fill("#cfg_k","AIzaSyBROWSERTEST123456");await K.click("text=Save and test");await K.waitForTimeout(2500);
 ok(await K.evaluate(()=>SYNC.ai.configured&&AI.conn.state==="remote"&&AI.conn.label==="AI connected"),"after saving the key the assistant switches to the AI");
 ok(await K.evaluate(()=>/Working:/.test(document.querySelector("#aitest").textContent)),"Save and test retains the connection result after refreshing Settings");
 const ka=await K.evaluate(async()=>{const r=await aiAsk("Where is CT-7801 located?",{noLog:true});return{via:r.via}});ok(ka.via==="remote","a question is answered by the AI with the saved key");
 await kc.close();sk.kill();
 /* offline fallback */
 srv.kill();await sleep(300);
 const off=await A.evaluate(async()=>{const r=await aiAsk("Where is CT-7801 located?",{noLog:true});SYNC.busy=false;await syTick();return{via:r.via,txt:r.text.length>20,st:SYNC.state}});
 ok(off.via==="local"&&off.txt,"server down: assistant falls back to offline answers");ok(off.st==="error","server down: shared database status shows unreachable");
 ok(errs.length===0,"no script errors ("+errs.length+")");errs.forEach(e=>console.log("   ",e));
 await b.close();fake.close();console.log(fails?"\nFAILED "+fails:"\nAll live checks passed");process.exit(fails?1:0)})();
