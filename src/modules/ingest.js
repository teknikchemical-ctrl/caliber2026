/* =====================================================================================================
   AI READING OF DOCUMENTS
   When the AI is connected, the ingestion wizard sends the text of each new document to /api/extract. The server masks secrets and
   personal numbers, asks the model for the structure as JSON, and drops everything that the text does not support (each step, value
   and fact must quote the source word for word). The result pre-fills the wizard. A person reviews it, and only then is the item
   saved: the item, its typed facts and a copy of the source text go to the shared database, are indexed for search, and
   show up for the assistant and on the equipment pages. Without the AI the wizard works as before with its own rules.
   ===================================================================================================== */
regMod("ingest","1.0",["wiz"],"AI reading of documents");
const AIX={use:true};
const aiXOn=()=>/^https?:$/.test(location.protocol)&&typeof SYNC!=="undefined"&&SYNC.state==="online"&&SYNC.ai&&SYNC.ai.configured&&SYNC.ai.available!==false&&AIX.use&&AIP.use!==false;
async function aiRead(it,force){if(!it||(it.ai&&!force))return;if(!aiXOn()){it.ai={state:"off"};return}
 it.ai={state:"running"};if(typeof render==="function"&&st.page==="ks")render();
 try{const r=await syApi("extract",{method:"POST",body:{text:String(it.raw||"").slice(0,140000),name:it.name,known:K.sets.map(s=>({tag:s.tag,name:s.name}))},timeout:65000});
  it.ai={state:"done",res:r.result,ver:r.verified,red:r.redacted,model:r.model,chunks:r.chunks,truncated:r.truncated,cached:r.cached,use:true,at:nowIso()};
  const x=r.result;if(x&&WK[x.kind]&&x.confidence>=60&&!it.rows&&!it.kindUser&&(it.conf<90||x.kind!==it.kind)){it.kind=x.kind;it.conf=Math.min(99,x.confidence);it.why=["read by the AI ("+r.model+")"]}
 }catch(e){it.ai={state:"error",msg:String(e.message||e)}}
 if(typeof render==="function"&&st.page==="ks")render()}
const aiUsed=it=>it&&it.ai&&it.ai.state==="done"&&it.ai.use;
{const _p=wzPaste;wzPaste=function(){const n=WZ.q.length;_p.apply(this,arguments);WZ.q.slice(n).forEach(it=>aiRead(it))};
 const _a=wzAddFiles;wzAddFiles=async function(){const n=WZ.q.length;await _a.apply(this,arguments);WZ.q.slice(n).forEach(it=>aiRead(it))};
 const _k=wzSetKind;wzSetKind=function(k){const it=wzCur();if(it)it.kindUser=true;return _k.apply(this,arguments)};
 const _m=wzMeta;wzMeta=function(it){if(aiUsed(it)&&!it.meta){const x=it.ai.res,m={},ruleTags=DB.tagsOf(String(it.raw||"").toUpperCase());if(x.title)m.title=x.title;
   const tg=[...new Set([...(x.tags||[]),...ruleTags])];if(tg.length)m.tags=tg.join(", ");const st0=K.sets.find(s=>s.tag===x.set_tag)||K.sets.find(s=>tg.includes(s.tag));if(st0)m.set=st0.n;
   if(x.revision)m.rev=x.revision;if(x.date)m.date=x.date;if(x.classification)m.cls=x.classification;it.meta=m}return _m.apply(this,arguments)};
 const _s=wzStructure;wzStructure=function(it){_s.apply(this,arguments);if(!aiUsed(it))return;const x=it.ai.res,k=it.kind,s=it.struct;
  if(k==="sop"){if(x.steps.length&&x.steps.length>=(s.steps||[]).length)s.steps=x.steps.map(q=>({n:q.n,text:q.text,tags:DB.tagsOf(q.text.toUpperCase())}));if(x.warnings.length)s.warnings=x.warnings.map(q=>q.text)}
  else if(k==="datasheet"){if(x.kv.length&&x.kv.length>=(s.kv||[]).length)s.kv=x.kv.map(q=>[q.name,q.value])}
  else if(k==="opl"){const o=x.opl;["objective","symptom","cause","action","caution"].forEach(f=>{if(o[f])s[f]=o[f]});if(o.steps.length)s.steps=o.steps;if(o.keypoints.length)s.keypoints=o.keypoints}
  else if(k==="incident"){const o=x.incident;["description","symptom","cause","action","prevent","impact"].forEach(f=>{if(o[f])s[f]=o[f]})}
  else if(k==="pid"||k==="notes")s.tags=[...new Set([...(s.tags||[]),...x.tags])]};
 const _b=wzBuild;wzBuild=function(it){const b=_b.apply(this,arguments);
  b.meta.sourceText=String(it.raw||"").slice(0,40000);if(String(it.raw||"").length>40000)b.meta.sourceTruncated=true;
  if(aiUsed(it)){const x=it.ai.res,A=b.set?S(b.set).tag:"";b.meta.ai={model:it.ai.model,at:it.ai.at,kept:it.ai.ver.kept,dropped:it.ai.ver.rejected,masked:it.ai.red.count,reviewedBy:ROLE.user};if(x.summary)b.meta.summary=x.summary;if(x.summary&&it.kind!=="maintenance")b.text="Summary: "+x.summary+"\n\n"+b.text;
   const have=new Set(b.facts.map(f=>(f.tag+"|"+f.name+"|"+f.value_text).toLowerCase()));
   (x.facts||[]).forEach(f=>{const v=FX.parse((f.value+" "+f.unit).trim()),key=(f.tag+"|"+f.name+"|"+(f.value+(f.unit?" "+f.unit:""))).toLowerCase();if(have.has(key))return;have.add(key);
    b.facts.push({set:b.set,tag:f.tag||A,asset:A,kind:f.kind,name:f.name,op:v.op,value_num:v.num,unit:v.unit||f.unit,value_text:f.value+(f.unit?" "+f.unit:""),vote:f.vote||"",logic:"",actuates:[],source:"UK",source_ref:b.title,status:"Draft",quote:f.quote})});
   b.meta.aiFacts=(x.facts||[]).length}
  return b};
 const _w=wzIngest;wzIngest=function(){let h=_w.apply(this,arguments);const it=wzCur();
  if(WZ.step===1)h=h.replace("Files are read in your browser and are not uploaded.","Files are opened in your browser. When the AI is connected and the option below is on, the text is also sent to the AI service so it can read the structure. Secrets and personal numbers are masked first.")+`<label class="row" style="gap:8px;margin-top:12px;font-size:13px"><input type="checkbox" ${AIX.use?"checked":""} onchange="AIX.use=this.checked"> Let the AI read new documents${aiXOn()?"":' <span class="muted">(not available now: '+(SYNC.state!=="online"?"the shared database is offline":"no AI is connected")+")</span>"}</label>`;
  if(it&&(WZ.step===2||WZ.step===3))h=aiCard(it)+h;return h}}
function aiCard(it){const a=it.ai||{state:"off"},btn=`<button class="ghost" style="padding:3px 10px" onclick="aiRead(wzCur(),true)">Read again</button>`;
 if(a.state==="off")return `<div class="pbar" style="margin-bottom:12px">The AI is not reading this document${aiXOn()?"":" (no AI is connected, or the shared database is offline)"}. The wizard uses its own rules. ${aiXOn()?btn:""}</div>`;
 if(a.state==="running")return `<div class="pbar" style="margin-bottom:12px"><b>Reading with the AI</b>. This takes a few seconds. You can carry on, the result fills in when it arrives.</div>`;
 if(a.state==="error")return `<div class="note-warn" style="margin-bottom:12px"><b>The AI could not read this document.</b> ${esc(a.msg)}. The wizard uses its own rules. ${btn}</div>`;
 const x=a.res,drop=a.ver.rejected;
 return `<div class="card" style="margin-bottom:12px"><div class="row between"><div><span class="tag ok">Read by the AI</span> <b style="font-size:13px">${esc(a.model)}</b>${a.cached?' <span class="tag">cached</span>':""}</div><label class="row" style="gap:6px;font-size:13px"><input type="checkbox" ${a.use?"checked":""} onchange="wzCur().ai.use=this.checked;wzCur().meta=null;if(WZ.step>=3){wzStructure(wzCur());wzMeta(wzCur())}render()"> Use the AI reading</label></div>
  <p style="margin:8px 0;font-size:13px;line-height:1.55">${esc(x.summary||"No summary.")}</p>
  <div class="row" style="gap:8px;flex-wrap:wrap;font-size:12.5px"><span class="tag acc">${esc((WK[x.kind]||{label:x.kind}).label)}, ${x.confidence}% sure</span><span class="tag">${x.steps.length} steps</span><span class="tag">${x.facts.length} facts</span><span class="tag">${x.kv.length} values</span><span class="tag">${x.tags.length} tags</span>${drop?`<span class="tag warn">${drop} dropped, not supported by the text</span>`:'<span class="tag ok">Everything quoted from the text</span>'}${a.red.count?`<span class="tag warn">${a.red.count} masked before sending</span>`:""}${a.truncated?'<span class="tag warn">Text was cut at 140000 characters</span>':""}${a.chunks>1?`<span class="tag">${a.chunks} parts</span>`:""}</div>
  ${x.gaps.length?`<p class="muted" style="font-size:12.5px;margin:8px 0 0">To add: ${x.gaps.map(esc).join("; ")}</p>`:""}
  <details style="margin-top:8px"><summary class="alink" style="cursor:pointer">Facts, quotes and what was dropped</summary>${x.facts.length?`<table class="mht" style="margin-top:6px"><tr><th>Tag</th><th>Kind</th><th>Name</th><th>Value</th><th>Quoted from the text</th></tr>${x.facts.map(f=>`<tr><td>${esc(f.tag)}</td><td>${esc(f.kind)}</td><td>${esc(f.name)}</td><td><b>${esc(f.value)} ${esc(f.unit)}</b>${f.vote?" "+esc(f.vote):""}</td><td style="white-space:normal">${esc(f.quote)}</td></tr>`).join("")}</table>`:'<p class="muted">No facts.</p>'}${drop?`<p style="margin:8px 0 2px;font-size:12.5px"><b>Dropped</b></p>${a.ver.items.map(r=>`<div class="muted" style="font-size:12px">${esc(r.type)}: ${esc(r.text)} (${esc(r.why)})</div>`).join("")}`:""}</details>
  <p class="muted" style="font-size:12px;margin:8px 0 0">The AI can be wrong. Check the structure against the source before saving. Nothing is saved until you finish the wizard, and the item starts as a draft that needs approval.</p></div>`}
