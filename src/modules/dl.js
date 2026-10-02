/* =====================================================================================================
   DATA LAYER: one governed model behind every page and the AI assistant
   - BUS      : tiny event bus (kb:changed, audit, role)
   - MODS     : module registry (name, version, dependencies)
   - SCHEMA   : typed entity registry (fields, keys, links) used by the data model view
   - STORE    : persistence for user knowledge, audit trail and feedback (IndexedDB with localStorage fallback)
   - UKB      : user knowledge items with an approval workflow (Draft, In review, Approved, Superseded, Rejected)
   - DB       : chunk builder over every source, BM25 retrieval with synonyms, tag awareness, status trust and scope
   The retrieval output is the single input to the AI provider contract (see ai.js).
   ===================================================================================================== */
const BUS=(()=>{const h={};return{on:(e,f)=>(h[e]=h[e]||[]).push(f),emit:(e,d)=>(h[e]||[]).forEach(f=>{try{f(d)}catch(x){console.error("BUS",e,x)}})}})();
const MODS=[],regMod=(name,ver,deps,desc)=>{MODS.push({name,ver,deps:deps||[],desc:desc||""})};
regMod("dl","2.0",[],"Data layer, retrieval index, persistence");
/* ---------- schema registry ---------- */
const SCHEMA=[
 {t:"Asset",key:"tag",src:"AIMS",fields:["tag","name","unit","area","type","criticality","fluid"],links:["Document","WorkOrder","Instrument","Interlock"],count:()=>K.sets.length+K.assets.length},
 {t:"Document",key:"id",src:"EDMS",fields:["id","name","type","rev","status","date","asset"],links:["Asset","Chunk"],count:()=>K.docs.length},
 {t:"Chunk",key:"id",src:"EDMS",fields:["id","k","ref","title","sec","text","set","tags","ver","status","date","trust"],links:["Document","Asset"],count:()=>DB.chunks.length},
 {t:"WorkOrder",key:"wo",src:"CMMS",fields:["wo","tag","type","disc","pri","prob","root","act","parts","bd","dt","tc","rd","sd","cd"],links:["Asset","Failure"],count:()=>MH.length},
 {t:"Failure",key:"wo",src:"CMMS",fields:["wo","symptom","root","action","parts","downtime"],links:["WorkOrder","Lesson"],count:()=>MH.filter(r=>r.bd==="Yes"||r.type==="Corrective").length},
 {t:"Interlock",key:"no",src:"EDMS",fields:["no","logic","sil","trigger","voting","setpoint","effects","permissives"],links:["Asset","Instrument"],count:()=>K.sets.length},
 {t:"Instrument",key:"tag",src:"AIMS",fields:["tag","type","variable","setpoint","action","equipment"],links:["Asset","Interlock"],count:()=>K.inst.length},
 {t:"OPL",key:"no",src:"Tacit",fields:["no","title","class","steps","cases","keypoints","reviewer","approver"],links:["Asset","Lesson"],count:()=>K.opl.length},
 {t:"Lesson",key:"id",src:"Knowledge Studio",fields:["id","type","title","text","set","tags","author","status","rev"],links:["Asset","Failure"],count:()=>UKB.items.length},
 {t:"Source",key:"id",src:"Data Ops",fields:["id","system","kind","owner","refresh","records"],links:[],count:()=>8}];
/* ---------- persistence ---------- */
const STORE={db:null,mem:{uk:[],audit:[],fb:[],cfg:{},qa:[],evalruns:[],emb:{}},ok:false,
 open(){return new Promise(res=>{try{const r=indexedDB.open("akp_kb",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>{STORE.db=r.result;res(true)};r.onerror=()=>res(false)}catch(e){res(false)}})},
 get(k){return new Promise(res=>{if(!STORE.db){try{res(JSON.parse(localStorage.getItem("akp_"+k)||"null"))}catch(e){res(null)}return}const q=STORE.db.transaction("kv").objectStore("kv").get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)})},
 put(k){const v=STORE.mem[k];if(!STORE.db){try{localStorage.setItem("akp_"+k,JSON.stringify(v))}catch(e){STORE.err="Storage is full. Export the knowledge base and remove old items."}return}try{STORE.db.transaction("kv","readwrite").objectStore("kv").put(JSON.parse(JSON.stringify(v)),k)}catch(e){STORE.err=String(e)}},
 async load(){STORE.ok=await STORE.open();for(const k of Object.keys(STORE.mem)){const v=await STORE.get(k);if(v)STORE.mem[k]=v}return STORE.ok}};
const nowIso=()=>new Date().toISOString().slice(0,19).replace("T"," ");
function audit(act,detail,ref){const a={t:nowIso(),who:ROLE.user,role:ROLE.name,act,detail:detail||"",ref:ref||""};STORE.mem.audit.unshift(a);STORE.mem.audit=STORE.mem.audit.slice(0,800);STORE.put("audit");BUS.emit("audit",a)}
const ROLE={name:"Engineer",user:"Engineer on duty",list:["Operator","Engineer","Reliability","HSE","Manager"]};
try{Object.assign(ROLE,JSON.parse(localStorage.getItem("akp_role")||"{}"))}catch(e){}
function setRole(n){ROLE.name=n;try{localStorage.setItem("akp_role",JSON.stringify({name:n,user:ROLE.user}))}catch(e){}audit("Role changed",n);BUS.emit("role",n);if(typeof render==="function")render()}
/* ---------- user knowledge with approval workflow ---------- */
const UKB={items:[],TYPES:{document:"Ingested document",tacit:"Tacit knowledge",lesson:"Lesson learned",failure:"Failure report"},FLOW:["Draft","In review","Approved","Superseded","Rejected"],
 next(){let id;do{id="UK-"+Date.now().toString(36).toUpperCase().slice(-5)+Math.random().toString(36).toUpperCase().slice(2,4)}while(UKB.items.some(x=>x.id===id));return id},
 add(o){const it={id:UKB.next(),type:o.type||"document",title:o.title||"Untitled",text:o.text||"",set:+o.set||0,tags:o.tags||[],author:o.author||ROLE.user,role:ROLE.name,status:"Draft",rev:"A",created:nowIso(),updated:nowIso(),src:o.src||"manual",fname:o.fname||"",meta:o.meta||{},hist:[{t:nowIso(),who:ROLE.user,act:"Created",note:o.src==="upload"?"Ingested from "+(o.fname||"file"):"Entered manually"}]};
  it.tags=[...new Set([...(it.tags||[]),...DB.tagsOf(it.title+" "+it.text)])];UKB.items.push(it);UKB.save();audit("Knowledge item created",it.title,it.id);return it},
 get:id=>UKB.items.find(x=>x.id===id),
 setStatus(id,st,note){const it=UKB.get(id);if(!it)return;const old=it.status;it.status=st;it.updated=nowIso();it.hist.push({t:nowIso(),who:ROLE.user,act:old+" to "+st,note:note||""});if(st==="Approved"){it.approvedBy=ROLE.user;it.approvedOn=nowIso();UKB.items.filter(x=>x.id!==id&&x.supersedes===undefined&&x.title===it.title&&x.status==="Approved").forEach(x=>{x.status="Superseded";x.hist.push({t:nowIso(),who:ROLE.user,act:"Superseded",note:"Replaced by "+id})})}UKB.save();audit("Status "+old+" to "+st,it.title,id)},
 update(id,patch,note){const it=UKB.get(id);if(!it)return;Object.assign(it,patch);it.updated=nowIso();it.rev=String.fromCharCode(Math.min(90,it.rev.charCodeAt(0)+1));it.hist.push({t:nowIso(),who:ROLE.user,act:"Edited",note:note||"Revision "+it.rev});if(it.status==="Approved"){it.status="In review";it.hist.push({t:nowIso(),who:"System",act:"Approved to In review",note:"Content changed, re-approval required"})}UKB.save();audit("Knowledge item edited",it.title,id)},
 remove(id){const it=UKB.get(id);if(typeof MH!=="undefined"&&MH.some(r=>r.imp===id)){for(let i=MH.length-1;i>=0;i--)if(MH[i].imp===id)MH.splice(i,1);try{mhReindex();mhSaveGen()}catch(e){}}UKB.items=UKB.items.filter(x=>x.id!==id);UKB.save();audit("Knowledge item deleted",it?it.title:id,id)},
 save(){STORE.mem.uk=UKB.items;STORE.put("uk");DB.dirty();BUS.emit("kb:changed")}};
const FB={items:()=>STORE.mem.fb.filter(f=>f.kind!=="dq"),add(o){STORE.mem.fb.unshift({id:"FB-"+Date.now().toString(36).toUpperCase().slice(-5)+Math.random().toString(36).toUpperCase().slice(2,4),t:nowIso(),u:nowIso(),who:ROLE.user,status:"Open",...o});STORE.put("fb");audit("Answer feedback",o.verdict+": "+(o.q||"").slice(0,80));BUS.emit("kb:changed")},resolve(id,note){const f=STORE.mem.fb.find(x=>x.id===id);if(f){f.status="Resolved";f.note=note||"";f.u=nowIso();STORE.put("fb");BUS.emit("kb:changed")}}};
/* ---------- text analysis ---------- */
const TAGX=/\b[A-Z]{1,5}-\d{3,5}[A-Z]?(?:-\d)?\b/g;
const STOP=new Set("the a an is are was were what do does did i how of to for on in and or why we should be with my our need can this that it at when which tell me about give show list please there their from by as if not no any all into than then also".split(" "));
const SYN=[["seal","gland","sealing"],["leak","leakage","drip","weep","leaking"],["trip","shutdown","esd","tripped"],["vibration","vibr","vibrating","vsh"],["bearing","brg"],["start","startup","start-up","commissioning","startup"],["permissive","permit","interlock"],["temperature","temp","thermal"],["pressure","press","barg"],["level","lvl"],["flow","rate","throughput"],["fail","failure","breakdown","fault","defect","damaged","broken"],["cause","reason","rca","root"],["action","fix","remedy","repair","corrective","resolution","solve"],["spare","part","parts","spares"],["cost","expense","idr","spend"],["downtime","outage","stoppage"],["oil","lube","lubricant","lubrication"],["steam","condensate"],["nitrogen","n2","purge","inert"],["cooling","cw"],["fan","blower"],["compressor","recycle","surge"],["pump","feed"],["heater","exchanger","hx","fouling"],["reactor","catalyst"],["dryer","drying"],["separator","drum","accumulator","reflux"],["valve","actuator","positioner"],["alarm","alert","annunciate"],["maintenance","wo","workorder"],["procedure","sop","steps","instruction"],["lesson","opl","tacit","experience"],["location","where","grid","coordinates","plot"],["datasheet","specification","spec","design"],["power","output","rating","rated","kw"],["capacity","volume","size"],["weight","mass"]];
const SYNM=new Map();SYN.forEach(g=>g.forEach(w=>{if(!SYNM.has(w))SYNM.set(w,new Set());g.forEach(x=>{if(x!==w)SYNM.get(w).add(x)})}));
const stem=w=>w.length>5&&/(ing|ies)$/.test(w)?w.replace(/(ing|ies)$/,""):w.length>4&&/(ed|es)$/.test(w)?w.replace(/(ed|es)$/,""):w.length>3&&/s$/.test(w)&&!/ss$/.test(w)?w.slice(0,-1):w;
function tok(s,exp){const out=[];String(s||"").toLowerCase().replace(/[^a-z0-9\-\/. ]/g," ").split(/\s+/).forEach(w=>{w=w.replace(/^[.\-\/]+|[.\-\/]+$/g,"");if(!w||STOP.has(w)||w.length<2)return;out.push([stem(w),1]);if(/-/.test(w)&&/\d/.test(w)){w.split("-").forEach(p=>{if(p.length>1)out.push([stem(p),.5])})}if(exp&&SYNM.has(w))SYNM.get(w).forEach(x=>out.push([stem(x),.55]))});return out}
/* ---------- chunk builder and BM25 index ---------- */
/* controlled status vocabulary: every record maps to one canonical code used for trust, filtering and the SQL schema */
const STATUS={approved:{label:"Approved or issued",trust:1,roles:"all"},completed:{label:"Completed",trust:.9,roles:"all"},listed:{label:"Listed",trust:.9,roles:"all"},not_stated:{label:"Approval not stated",trust:.8,roles:"all"},review_flag:{label:"Flagged for review",trust:.75,roles:"all"},in_review:{label:"In review",trust:.7,roles:"staff"},planned:{label:"Planned",trust:.7,roles:"all"},in_progress:{label:"In progress",trust:.8,roles:"all"},draft:{label:"Draft",trust:.55,roles:"staff"},superseded:{label:"Superseded",trust:.35,roles:"staff"},rejected:{label:"Rejected",trust:0,roles:"none"}};
const STAT_MAP={"Issued for Construction":"approved","Issued for Operation":"approved","Approved":"approved","Issued":"approved","Completed":"completed","Listed":"listed","Not stated":"not_stated","REVIEW":"review_flag","In review":"in_review","Draft":"draft","Superseded":"superseded","Planned":"planned","In Progress":"in_progress","Rejected":"rejected"};
const statCode=s=>STAT_MAP[s]||"not_stated";
const TRUST=new Proxy({},{get:(_,s)=>STATUS[statCode(s)].trust});
const cyrb=s=>{let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (4294967296*(2097151&h2)+(h1>>>0)).toString(16).padStart(14,"0")};
const isoDate=v=>{if(v==null||v===""||v==="None")return null;const d=typeof v==="number"?new Date(v):new Date(String(v).replace(" ","T"));return isNaN(+d)?null:d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const KIND_PRIOR={doc:1,wo:1,il:1.05,ga:1,pp:.95,inst:.85,opl:1.05,dq:.55,uk:1,pdm:.9};
const SYS={doc:"EDMS",il:"EDMS",ga:"EDMS",pp:"EDMS",wo:"CMMS",inst:"AIMS",opl:"Tacit knowledge (OPL)",dq:"Data Ops",uk:"Knowledge Studio",pdm:"Analytics"};
const DB={chunks:[],byId:new Map(),byCid:new Map(),rel:[],hasEmb:false,df:new Map(),N:0,avg:1,tf:[],built:-1,ver:0,_d:true,
 dirty(){DB._d=true;DB.ver++},
 tagsOf(s){return [...new Set(String(s||"").match(TAGX)||[])]},
 build(){const C=[],add=c=>{c.tags=c.tags||DB.tagsOf(c.title+" "+c.text);C.push(c)};
  K.chunks.forEach(c=>{const d=DOC[c.doc]||{name:c.doc,type:"Datasheet",set:null,rev:null};add({k:"doc",id:c.doc,cid:c.id,title:d.name,set:d.set||0,page:c.page,sec:c.sec,text:c.text,ver:"Rev "+(d.rev??"n/a"),status:typeof ds==="function"&&DOC[c.doc]?ds(d):"Issued for Operation",who:d.type})});
  MH.forEach(m=>add({k:"wo",id:m.wo,title:`Work order ${m.wo} | ${m.type} | ${m.tag}`,set:m.n,sec:dstr(m.t0),text:`${m.tag} ${m.nm||""}. ${m.type} ${m.disc||""}. Problem: ${m.prob}. Root cause: ${m.root}. Action: ${m.act}. Parts: ${m.parts||"none"}. Downtime ${m.dt??"n/a"} h. ${m.bd==="Yes"?"Breakdown.":""}`,ver:dstr(m.t0),status:m.st||"Completed",who:"Maintenance history",date:m.t0}));
  K.inst.forEach(i=>add({k:"inst",id:i.id,title:`Instrument ${i.tag}`,set:i.set,sec:"Instrument list",text:`${i.tag} ${i.type}: ${i.var}. Set point: ${i.sp}. On trip: ${i.act}. Equipment ${i.eq}. ${i.notes||""}`,ver:"n/a",status:i.flag?"REVIEW":"Listed",who:"Instrument index"}));
  K.sets.forEach(s=>{const d=ilD(s.n),loop=ilIsLoop(s.n);
   add({k:"il",id:d.no,title:`Interlock ${loop?"control loop":d.logic} | ${s.tag}`,set:s.n,sec:"Overview and permissives",text:`${d.desc}. ${loop?"Control loop, no SIS":d.logic+" "+d.sil}. Start permissives: ${d.perm.map(p=>p[1]+" ("+p[2]+")").join("; ")}. Final elements: ${d.eff.join("; ")}. ${d.notes||""}`,ver:"Rev 3",status:"Issued for Operation",who:"Interlock library"});
   d.trig.forEach(t=>add({k:"il",id:d.no,cid:t.id,title:`Interlock ${d.logic} | ${s.tag} | ${t.id} ${t.tag}`,set:s.n,sec:"Cause and effect "+t.id,text:`${t.c}: ${t.tag} ${t.sp}, voting ${t.vote}. Actuates: ${t.fx.map((x,j)=>x?d.eff[j]:null).filter(Boolean).join("; ")||"alarm only"}. Logic ${d.logic} ${d.sil}.`,ver:"Rev 3",status:"Issued for Operation",who:"Interlock library"}));
   const g=GA[s.n];
   add({k:"ga",id:s.ga.dwg_no,title:`Equipment drawing ${s.tag} | bill of material`,set:s.n,sec:"Bill of material",text:`${s.name} (${s.tag}). BOM: ${g.bom.map(b=>`${b.name} (${b.mat})`).join("; ")}.`,ver:"Rev "+s.ga.revision,status:"Issued for Construction",who:"Equipment drawing"});
   add({k:"ga",id:s.ga.dwg_no,title:`Equipment drawing ${s.tag} | nozzles`,set:s.n,sec:"Nozzle schedule",text:`${s.tag} nozzles: ${g.nz.map(z=>`${z.m} ${z.sv} ${z.sz} ${z.r}`).join("; ")}.`,ver:"Rev "+s.ga.revision,status:"Issued for Construction",who:"Equipment drawing"});
   add({k:"pp",id:s.pp.dwg_no,title:`Plot plan location ${s.tag}`,set:s.n,sec:"Location",text:`${s.tag} ${s.name} is in ${s.pp.area_subtitle}, grid ${s.pp.grid_ref}, ${s.pp.elevation_label}, E${POS[s.n][0]}/N${POS[s.n][1]}, footprint ${s.pp.footprint_text}, functional location ${s.pp.functional_location}.`,ver:"Rev "+s.pp.revision,status:"Issued for Construction",who:"Plot plan"})});
  K.opl.forEach(o=>{const base={k:"opl",id:o.no,set:o.set,ver:"OPL "+o.date,status:o.app?"Approved":"In review",who:"One point lesson",date:+new Date(o.date)};
   add({...base,title:`OPL ${o.no} | ${o.title}`,sec:"Objective and procedure",text:`${o.tag} ${o.title}. ${o.obj} Steps: ${(o.steps||[]).map((s,i)=>`${i+1}. ${s[0]} (check: ${s[1]})`).join(" ")}`});
   (o.ts||[]).forEach((t,i)=>add({...base,title:`OPL ${o.no} | troubleshooting case ${i+1}`,sec:"Troubleshooting case",cid:"ts"+i,text:`${o.tag}. Symptom: ${t[0]} Cause: ${t[1]} Action: ${t[2]}`}));
   add({...base,title:`OPL ${o.no} | key points`,sec:"Key points and safety",text:`${o.tag}. ${(o.kp||[]).map(k=>k[0]).join(" ")} ${(o.safety||[]).slice(0,3).join(" ")}`})});
  K.issues.forEach((q,i)=>add({k:"dq",id:"DQ-"+(i+1),title:`Data quality note ${q.source}`,set:0,sec:"Data Quality Note",text:`${q.issue}. Suggested action: ${q.suggested_action}`,ver:"n/a",status:"REVIEW",who:"Data Ops"}));
  UKB.items.filter(x=>x.status!=="Rejected").forEach(it=>{const paras=String(it.text).split(/\n{2,}|\r\n\r\n/).map(s=>s.trim()).filter(Boolean),parts=[];let cur="";paras.forEach(p=>{if((cur+" "+p).length>700&&cur){parts.push(cur);cur=p}else cur=cur?cur+"\n"+p:p});if(cur)parts.push(cur);
   const m=it.meta||{},head=it.type==="tacit"||it.type==="lesson"||it.type==="failure"?`Symptom: ${m.symptom||""}. Cause: ${m.cause||""}. Action: ${m.action||""}. ${m.caution?"Caution: "+m.caution+".":""} `:"";
   (parts.length?parts:[""]).forEach((p,i)=>add({k:"uk",id:it.id,cid:i,title:`${UKB.TYPES[it.type]} | ${it.title}`,set:it.set,sec:parts.length>1?"Part "+(i+1):"Content",text:(i===0?head:"")+p,ver:"Rev "+it.rev,status:it.status,who:it.author,date:+new Date(it.updated.replace(" ","T")),tags:[...it.tags,...DB.tagsOf(p)]}))});
  if(typeof pdmUnit==="function"){try{K.sets.forEach(s=>{const u=pdmUnit(s.n);add({k:"pdm",id:"PDM-"+s.n,title:`Predictive maintenance ${s.tag}`,set:s.n,sec:"Forecast",text:`${s.tag} health index ${u.health}, ${u.level} risk. Probability of failure in ${PDM.h} days ${Math.round(u.p*100)} percent. Median predicted failure ${dstr(u.p50)}. Highest risk components: ${u.comps.slice(0,3).map(c=>c.name).join(", ")}.`,ver:"Model "+dstr(pdmAsof()),status:"Issued",who:"Predictive model"})})}catch(e){}}
  const ord={};C.forEach((c,i)=>{c.i=i;const key=c.k+":"+c.id;ord[key]=(ord[key]||0)+1;c.chunk_id=key+"#"+String(ord[key]).padStart(2,"0");c.rid=c.id;c.stat=statCode(c.status);c.trust=STATUS[c.stat].trust;c.date_iso=isoDate(c.date);c.hash=cyrb(c.title+"|"+c.text);c.tokens=Math.ceil(c.text.length/4);c.emb=c.emb||null;const staff=STATUS[c.stat].roles==="staff";c.acl={cls:c.k==="dq"?"restricted":"internal",roles:c.k==="dq"?["Engineer","Reliability","HSE","Manager"]:staff?["Engineer","Reliability","HSE","Manager"]:ROLE.list};c.valid_to=c.stat==="superseded"?c.date_iso:null;c.sys=SYS[c.k]||"Other"});
  DB.byId=new Map();DB.byCid=new Map();C.forEach(c=>{if(!DB.byId.has(c.id))DB.byId.set(c.id,c);DB.byCid.set(c.chunk_id,c)});DB.chunks=C;
  DB.df=new Map();DB.tf=C.map(c=>{const m=new Map();let len=0;const add2=(arr,w)=>arr.forEach(([t,x])=>{m.set(t,(m.get(t)||0)+x*w);len+=x*w});add2(tok(c.title),2);add2(tok(c.sec),1.5);add2(tok(c.text),1);add2(c.tags.map(t=>[t.toLowerCase(),1]),2.5);c.len=len;m.forEach((_,t)=>DB.df.set(t,(DB.df.get(t)||0)+1));return m});
  DB.N=C.length;DB.avg=C.reduce((a,c)=>a+c.len,0)/Math.max(1,C.length);DB._d=false;DB.built=Date.now()},
 ensure(){if(DB._d||!DB.chunks.length)DB.build()},
 detectSet(q){const l=String(q).toLowerCase();const m=K.sets.find(s=>l.includes(s.tag.toLowerCase())||l.includes(s.name.toLowerCase())||(s.pid.tags||"").toLowerCase().split(/,\s*/).some(t=>t.length>4&&l.includes(t)));if(m)return m.n;const t=DB.tagsOf(String(q).toUpperCase());for(const x of t){const nn=+((x.match(/(\d{2})\d{2}/)||[])[1]);const s=K.sets.find(z=>String(z.area).slice(0,2)===String(nn));if(s)return s.n}
  const words={dryer:2,heater:5,compressor:4,reactor:3,separator:6,"cooling tower":7,fan:7,accumulator:8,reflux:8,"feed pump":1,"charge pump":1};for(const[w,n]of Object.entries(words))if(l.includes(w))return n;return 0},
 search(q,o={}){DB.ensure();const qt=tok(q,true),qs=new Map();qt.forEach(([t,w])=>qs.set(t,Math.max(qs.get(t)||0,w)));DB.tagsOf(String(q).toUpperCase()).forEach(t=>qs.set(t.toLowerCase(),2.2));
  const set=o.set||0,det=set||DB.detectSet(q),k1=1.4,b=.75,res=[],Q0=[...new Set(tok(q).map(x=>x[0]))],role=ROLE.name,lam=o.qemb&&DB.hasEmb?.35:0;
  DB.chunks.forEach((c,i)=>{if(o.kinds&&!o.kinds.includes(c.k))return;if(!o.anyRole&&!c.acl.roles.includes(role))return;if(set&&c.set&&c.set!==set&&c.k!=="dq")return;let s=0;const m=DB.tf[i],hits=[];qs.forEach((w,t)=>{const f=m.get(t);if(!f)return;const df=DB.df.get(t)||1,idf=Math.log(1+(DB.N-df+.5)/(df+.5));s+=w*idf*f*(k1+1)/(f+k1*(1-b+b*c.len/DB.avg));hits.push(t)});
   /* meaning-based recall: a record with no shared words can still qualify when its embedding is close to the question */
   let cs=0;if(lam&&c.emb){cs=DB.cos(o.qemb,c.emb);if(!s&&cs>=DB.EMB_MIN&&!(det&&c.set&&c.set!==det)){s=(cs-DB.EMB_MIN+.05)*40*c.trust*(KIND_PRIOR[c.k]||1);res.push({...c,score:s,hits:[],cov:0,cs,sem:true});return}}
   if(!s)return;
   s*=c.trust*(KIND_PRIOR[c.k]||1);if(det&&c.set===det)s*=1.45;else if(det&&c.set&&c.set!==det)s*=.7;
   if(role==="Reliability"&&(c.k==="wo"||c.k==="pdm"))s*=1.15;if(role==="Operator"&&(c.k==="opl"||c.k==="il"))s*=1.15;if(role==="HSE"&&(c.k==="il"||c.k==="opl"))s*=1.12;if(role==="Manager"&&c.k==="pdm")s*=1.1;
   if(lam&&c.emb){s=s*(1-lam)+lam*Math.max(0,cs)*40}
   res.push({...c,score:s,hits,cs,cov:Q0.length?Q0.filter(t=>m.has(t)).length/Q0.length:1})});
  res.sort((a,b)=>b.score-a.score);const top=res[0]?res[0].score:1;res.forEach(r=>{r.rel=r.score/top;r.score=+(r.score).toFixed(2)});const seen={},out=[];for(const r of res){const key=r.id+"|"+r.k;if((seen[key]=(seen[key]||0)+1)>2)continue;out.push(r);if(out.length>=(o.k||6))break}return out},
 EMB_MIN:.6,
 cos(a,b){let s=0,x=0,y=0;for(let i=0;i<a.length;i++){s+=a[i]*b[i];x+=a[i]*a[i];y+=b[i]*b[i]}return s/(Math.sqrt(x*y)||1)},
 async embedAll(fn,batch=32){DB.ensure();const todo=DB.chunks.filter(c=>!c.emb);for(let i=0;i<todo.length;i+=batch){const part=todo.slice(i,i+batch),v=await fn(part.map(c=>c.title+"\n"+c.text));part.forEach((c,j)=>c.emb=v[j])}DB.hasEmb=DB.chunks.some(c=>c.emb);return todo.length},
 facts(o={}){FX.ensure();return FX.rows.filter(f=>(!o.set||f.set===o.set)&&(!o.kind||f.kind===o.kind)&&(!o.name||f.name.toLowerCase().includes(String(o.name).toLowerCase())||f.tag.toLowerCase()===String(o.name).toLowerCase()))},
 relations(o={}){FX.ensure();return DB.rel.filter(r=>(!o.type||r.from_type===o.type||r.to_type===o.type)&&(!o.id||r.from_id===o.id||r.to_id===o.id))},
 stats(){DB.ensure();const by=f=>DB.chunks.reduce((a,c)=>(a[f(c)]=(a[f(c)]||0)+1,a),{});return{n:DB.N,kind:by(c=>c.k),sys:by(c=>c.sys),status:by(c=>STATUS[c.stat].label),statCode:by(c=>c.stat),facts:(typeof FX!=="undefined"?FX.ensure().length:0),rels:DB.rel.length,tagged:DB.chunks.filter(c=>c.tags.length).length,terms:DB.df.size}}};
function dbBootstrap(){return STORE.load().then(()=>{UKB.items=STORE.mem.uk||[];DB.dirty();BUS.emit("kb:changed");if(typeof SYNC!=="undefined")SYNC.init()})}
/* compatibility wrappers used by older modules */
const aiCorpus=()=>{DB.ensure();return DB.chunks};
