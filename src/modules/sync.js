/* =====================================================================================================
   SHARED DATABASE SYNC AND AI CONNECTION
   When the page is served by the Netlify site, /api/health answers and this module
   - pulls the shared knowledge base (knowledge items, imported work orders, feedback, audit, answer log) and polls for changes
   - pushes local changes to the server (per item, last write wins) and removes deleted items everywhere
   - switches the assistant to the server side AI proxy (/api/ai) when the server reports it is configured
   Opened as a plain file, or when the server is unreachable, everything keeps working from browser storage.
   ===================================================================================================== */
const SYNC={state:"off",label:"Local only (browser storage)",rev:"",last:0,err:"",ai:null,known:{uk:{},fb:{},wo:{}},dirty:false,applying:false,timer:null,poll:15000,busy:false};
const AIP={use:true,model:"",style:"concise"};
try{Object.assign(AIP,JSON.parse(localStorage.getItem("akp_ai_pref")||"{}"))}catch(e){}
const aipSave=()=>{try{localStorage.setItem("akp_ai_pref",JSON.stringify(AIP))}catch(e){}};
const syStamp=o=>String((o&&(o.updated||o.u||o.t))||"");
async function syApi(path,opt={}){const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),opt.timeout||9000);try{const r=await fetch("/api/"+path,{method:opt.method||"GET",headers:opt.body?{"Content-Type":"application/json"}:undefined,body:opt.body?JSON.stringify(opt.body):undefined,signal:ctl.signal});let j=null;try{j=await r.json()}catch(e){}if(!r.ok&&!(j&&(j.deleted||j.kept)))throw Object.assign(new Error((j&&j.error)||"HTTP "+r.status),{status:r.status});return j}finally{clearTimeout(to)}}
function syLabel(){const el=$("#syncstat"),dot=$("#syncdot");if(el)el.textContent=SYNC.state==="online"?"Shared database online":SYNC.state==="error"?"Shared database unreachable":"Local only";if(dot)dot.style.background=SYNC.state==="online"?"var(--ok)":SYNC.state==="error"?"var(--bad)":"var(--warn)"}
function syImpGroups(){const g={};MH.filter(r=>r.imp).forEach(r=>(g[r.imp]=g[r.imp]||[]).push(r));return g}
const syClean=r=>{const o={...r};["n","t0","t1","t2","mon","_p"].forEach(k=>delete o[k]);return o};
const syWoSig=rows=>rows.length+":"+rows.map(r=>r.wo).join(",").length;
SYNC.init=syInit;
async function syInit(){
  if(SYNC.on||location.protocol==="file:"||!/^https?:$/.test(location.protocol)){syLabel();return}
  SYNC.on=true;
  try{const h=await syApi("health",{timeout:6000});if(!h||!h.ok)throw new Error("no server");SYNC.state="online";SYNC.ai=h.ai;syAiSetup();await syPull(true);SYNC.timer=setInterval(()=>{if(!document.hidden)syTick()},SYNC.poll);document.addEventListener("visibilitychange",()=>{if(!document.hidden)syTick()})}
  catch(e){SYNC.state="off";SYNC.on=false;SYNC.ai=null}
  syLabel();aiStatus()}
function syAiSetup(){const a=SYNC.ai;if(a&&a.configured&&a.available&&AIP.use!==false&&!AI.cfg.mock){AI.cfg.remote=true;AI.cfg.endpoint="/api/ai";AI.cfg.model=AIP.model||"";AI.cfg.stream=true;AI.cfg.timeout=40000;AI.conn={state:"remote",label:"AI assistant live"}}
 else if(a&&a.configured&&!a.available){AI.cfg.remote=false;AI.conn={state:"local",label:"AI daily budget used, offline search active"}}
 else if(a&&!a.configured){AI.conn={state:"local",label:"Offline knowledge search (AI not configured on the server)"}}
 else if(AIP.use===false){AI.cfg.remote=false;AI.conn={state:"local",label:"Offline knowledge search (AI turned off in Settings)"}}}
async function syTick(){if(SYNC.busy)return;SYNC.busy=true;try{await syFlush();await syPull(false);if(SYNC.state!=="online"){SYNC.state="online";syLabel();const h=await syApi("health",{timeout:6000}).catch(()=>null);if(h){SYNC.ai=h.ai;syAiSetup();aiStatus()}}}catch(e){SYNC.err=e.message;if(SYNC.state==="online"){SYNC.state="error";syLabel()}}finally{SYNC.busy=false}}
/* ---- pull: merge the server state into the local state ---- */
async function syPull(first){const s=await syApi("kb/state"+(SYNC.rev&&!first?"?since="+encodeURIComponent(SYNC.rev):""));if(!s)return;SYNC.last=Date.now();if(s.changed===false)return;SYNC.rev=s.rev;SYNC.applying=true;let changed=false,mhChanged=false;
 try{const del=new Set(s.deleted||[]),srv=new Map((s.uk||[]).map(x=>[x.id,x]));
  const keep=[];UKB.items.forEach(l=>{if(del.has(l.id)){changed=true;return}const r=srv.get(l.id);if(r&&syStamp(r)>syStamp(l)){keep.push(r);changed=true;SYNC.known.uk[r.id]=syStamp(r)}else{keep.push(l);if(r&&syStamp(r)===syStamp(l))SYNC.known.uk[l.id]=syStamp(l)}});
  srv.forEach((r,id)=>{if(!keep.some(x=>x.id===id)&&!del.has(id)){keep.push(r);changed=true;SYNC.known.uk[id]=syStamp(r)}});
  for(let i=MH.length-1;i>=0;i--){if(MH[i].imp&&del.has(MH[i].imp)){MH.splice(i,1);mhChanged=true}}
  if(changed)UKB.items=keep;
  /* imported work orders */
  const g=syImpGroups();(s.wo||[]).forEach(w=>{SYNC.known.wo[w.imp]=syWoSig(w.rows);if(!g[w.imp]&&!del.has(w.imp)){w.rows.forEach(r=>MH.push({...r,gen:true,imp:w.imp}));mhChanged=true}});
  /* feedback */
  const fl=new Map(STORE.mem.fb.map(f=>[f.id,f]));(s.fb||[]).forEach(f=>{const l=fl.get(f.id);if(!l||syStamp(f)>syStamp(l)){fl.set(f.id,f);changed=true}SYNC.known.fb[f.id]=syStamp(fl.get(f.id))});
  if(fl.size!==STORE.mem.fb.length||changed)STORE.mem.fb=[...fl.values()].sort((a,b)=>String(b.t).localeCompare(String(a.t)));
  /* audit and answer log: union by content */
  const au=new Map(STORE.mem.audit.map(a=>[a.t+"|"+a.act+"|"+a.detail+"|"+a.who,a]));(s.audit||[]).forEach(a=>au.set(a.t+"|"+a.act+"|"+a.detail+"|"+a.who,a));STORE.mem.audit=[...au.values()].sort((a,b)=>String(b.t).localeCompare(String(a.t))).slice(0,800);
  const qm=new Map(STORE.mem.qa.map(a=>[a.id,a]));(s.qa||[]).forEach(a=>{if(!qm.has(a.id))qm.set(a.id,a)});STORE.mem.qa=[...qm.values()].sort((a,b)=>String(b.t).localeCompare(String(a.t))).slice(0,500);
  if(changed||mhChanged){STORE.mem.uk=UKB.items;STORE.put("uk");STORE.put("fb");if(mhChanged){mhReindex();mhSaveGen()}DB.dirty();BUS.emit("kb:changed");if(!document.activeElement?.matches?.("input,textarea,select")&&["dashboard","fm","rc","cov","documents","opl"].includes(st.page))render()}
  STORE.put("audit");STORE.put("qa")}
 finally{SYNC.applying=false}
 syFlush().catch(()=>{})}
/* ---- push: send what is new or changed locally ---- */
function syPush(){if(!SYNC.on||SYNC.applying)return;SYNC.dirty=true;clearTimeout(SYNC.pt);SYNC.pt=setTimeout(()=>syFlush().catch(e=>{SYNC.err=e.message}),700)}
async function syFlush(){if(!SYNC.on||SYNC.flushing)return;SYNC.flushing=true;try{SYNC.dirty=false;let wrote=false;
  for(const it of UKB.items){if(SYNC.known.uk[it.id]!==syStamp(it)){const r=await syApi("kb/uk/"+encodeURIComponent(it.id),{method:"PUT",body:it});if(r&&r.deleted){UKB.items=UKB.items.filter(x=>x.id!==it.id);STORE.mem.uk=UKB.items;STORE.put("uk")}else{SYNC.known.uk[it.id]=syStamp((r&&r.item)||it);wrote=true}}}
  const ids=new Set(UKB.items.map(x=>x.id));for(const id of Object.keys(SYNC.known.uk)){if(!ids.has(id)){await syApi("kb/uk/"+encodeURIComponent(id),{method:"DELETE"});delete SYNC.known.uk[id];delete SYNC.known.wo[id];wrote=true}}
  const g=syImpGroups();for(const imp of Object.keys(g)){const sig=syWoSig(g[imp]);if(SYNC.known.wo[imp]!==sig&&ids.has(imp)){await syApi("kb/wo/"+encodeURIComponent(imp),{method:"PUT",body:{imp,rows:g[imp].map(syClean),updated:nowIso()}});SYNC.known.wo[imp]=sig;wrote=true}}
  for(const f of STORE.mem.fb){if(SYNC.known.fb[f.id]!==syStamp(f)){await syApi("kb/fb/"+encodeURIComponent(f.id),{method:"PUT",body:f});SYNC.known.fb[f.id]=syStamp(f);wrote=true}}
  if(wrote){const s=await syApi("kb/rev");if(s)SYNC.rev=s.rev}
 }finally{SYNC.flushing=false}}
function syLog(coll,item){if(!SYNC.on||SYNC.state==="off")return;syApi("kb/"+coll,{method:"POST",body:item}).catch(()=>{})}
BUS.on("kb:changed",syPush);BUS.on("audit",a=>syLog("audit",a));
{const _mg=mhSaveGen;mhSaveGen=function(){const r=_mg.apply(this,arguments);syPush();return r}}
{const _al=aiLog;aiLog=function(){const r=_al.apply(this,arguments);const q=STORE.mem.qa[0];if(q)syLog("qa",q);return r}}
async function syNow(){const b=$("#sy-now");if(b)b.textContent="Syncing";SYNC.busy=false;SYNC.rev="";await syTick();setOpenRefresh()}
/* ---- Settings panel (gear in the sidebar) ---- */
function setOpen(){if($("#setbg"))return;const bg=document.createElement("div");bg.className="modalbg";bg.id="setbg";bg.onclick=e=>{if(e.target===bg)setClose()};bg.innerHTML=`<div class="modal" style="max-width:620px" role="dialog" aria-label="Settings"><div class="row between" style="padding:16px 20px;border-bottom:1px solid var(--line)"><b style="font-size:16px">Settings</b><button class="ghost" onclick="setClose()">Close</button></div><div id="setbody" style="padding:16px 20px"></div></div>`;document.body.appendChild(bg);setOpenRefresh()}
function setClose(){const b=$("#setbg");if(b)b.remove()}
function setOpenRefresh(){const el=$("#setbody");if(!el)return;const a=SYNC.ai||{},on=SYNC.state==="online",ago=SYNC.last?Math.max(0,Math.round((Date.now()-SYNC.last)/1000))+" s ago":"never";
 el.innerHTML=`<div class="card" style="box-shadow:none;margin-bottom:12px"><h3 style="margin:0 0 8px">Shared database</h3><div class="row" style="gap:8px"><span class="dot" style="background:var(${on?"--ok":SYNC.state==="error"?"--bad":"--warn"})"></span><b>${on?"Online":SYNC.state==="error"?"Unreachable, working locally":"Not connected (local browser storage only)"}</b></div>
 <p class="muted" style="font-size:12.5px;margin:6px 0">${on?`Knowledge items, imported work orders, feedback, audit trail and the answer log are shared with everyone who opens this site and refresh about every ${SYNC.poll/1000} seconds. Last check ${ago}. ${UKB.items.length} knowledge items.`:"Open the Netlify site to share knowledge between users. Changes made here stay in this browser."}</p><button class="ghost" id="sy-now" onclick="syNow()" ${on?"":"disabled"}>Sync now</button></div>
 <div class="card" style="box-shadow:none;margin-bottom:12px"><h3 style="margin:0 0 8px">AI assistant</h3><div class="row" style="gap:8px"><span class="dot" style="background:var(${AI.conn.state==="remote"?"--ok":"--warn"})"></span><b>${esc(AI.conn.label)}</b></div>
 <p class="muted" style="font-size:12.5px;margin:6px 0">The assistant reads the plant records and writes an answer in plain language, with sources. The key stays on the server. If the AI is unavailable the assistant answers from the records directly.</p>
 <label class="row" style="gap:6px;margin:8px 0;font-size:13px"><input type="checkbox" ${AIP.use!==false?"checked":""} onchange="AIP.use=this.checked;aipSave();AI.cfg.remote=false;syAiSetup();aiStatus();setOpenRefresh()"> Use the AI for answers</label>
 <div class="row" style="gap:14px;flex-wrap:wrap"><label class="fld" style="min-width:200px"><span>Answer style</span><select onchange="AIP.style=this.value;aipSave()"><option value="concise" ${AIP.style!=="detailed"?"selected":""}>Concise</option><option value="detailed" ${AIP.style==="detailed"?"selected":""}>Detailed with reasoning</option></select></label>
 ${(a.models||[]).length>1?`<label class="fld" style="min-width:200px"><span>Model</span><select onchange="AIP.model=this.value;aipSave();AI.cfg.model=this.value">${a.models.map(m=>`<option ${AIP.model===m||(!AIP.model&&m===a.model)?"selected":""}>${esc(m)}</option>`).join("")}</select></label>`:`<div class="muted" style="font-size:12.5px;align-self:end">Model: ${esc(a.model||"not set")}</div>`}</div>
 <div class="row" style="gap:8px;margin-top:10px"><button class="ghost" onclick="setTestAi()" ${SYNC.ai&&SYNC.ai.configured?"":"disabled"}>Test the AI connection</button><span class="muted" id="aitest" style="font-size:12px"></span></div></div>
 <div class="card" style="box-shadow:none;margin-bottom:12px"><h3 style="margin:0 0 8px">Your name</h3><p class="muted" style="font-size:12.5px;margin:0 0 6px">Shown in the audit trail and on the knowledge items you create. The site is open, so this is a label and not a login.</p><input value="${qa(ROLE.user)}" onchange="ROLE.user=this.value.trim()||ROLE.user;try{localStorage.setItem('akp_role',JSON.stringify({name:ROLE.name,user:ROLE.user}))}catch(e){}" style="width:100%;max-width:320px"></div>
 <details><summary class="alink" style="cursor:pointer">Advanced</summary><div style="margin-top:8px"><label class="fld"><span>Custom AI endpoint (overrides the server, for developers)</span><input value="${qa(AI.cfg.endpoint)}" onchange="AI.cfg.endpoint=this.value;AI.cfg.remote=!!this.value;aiSaveCfg()"></label><label class="row" style="gap:6px;margin:8px 0;font-size:13px"><input type="checkbox" ${AI.cfg.mock?"checked":""} onchange="AI.cfg.mock=this.checked;aiSaveCfg();aiStatus();setOpenRefresh()"> Use the built-in mock provider (contract test)</label></div></details>`}
async function setTestAi(){const o=$("#aitest");o.textContent="Testing";try{const r=await aiCallProvider({question:"Reply with the single word ready.",scope:{set:0},context:{page:"Settings"},history:[],retrieved:[{chunk_id:"test#1",id:"test",text:"Connection test record.",status:"Approved"}],tools:[]});o.textContent="Working: "+String(r.answer||"").slice(0,60)+(r.model?" ("+r.model+")":"");AI.conn={state:"remote",label:"AI assistant live"}}catch(e){o.textContent="No answer: "+(e.message||"error");AI.conn={state:"local",label:"Offline knowledge search (AI unavailable)"}}aiStatus()}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#setbg"))setClose()});
