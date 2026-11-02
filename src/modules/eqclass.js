/* =====================================================================================================
   EQUIPMENT CLASS REFERENCE
   General engineering knowledge per equipment class (pump, compressor, fan, valve, exchanger, fired heater, column, reactor, drum, tank, dryer,
   motor, instrument loop): typical failure modes with a risk priority, inspection checklist, typical trips, spares, KPIs, hazards and the standards
   that normally apply. It is a reference, not a record of this plant, and it is labelled that way wherever it is shown. Data: src/data/eqclass.json.
   ===================================================================================================== */
regMod("eqclass","1.0",["dl","ai"],"Equipment class reference library");
const EQC_MAP={pump:"pump",comp:"comp",fan:"fan",valve:"valve",hx:"hx",fired:"fired",column:"column",reactor:"reactor",drum:"drum",vessel:"vessel",dryer:"dryer",other:"instrument"};
const eqcKey=n=>EQC_MAP[autoKind(n)]||"instrument";
const eqcOf=n=>EQC.classes[eqcKey(n)];
const eqcRpn=m=>m.S*m.O*m.D;
/* history in this plant that looks like the failure mode: words of the mode against the problem, cause and action text */
function eqcSeen(n,m){const w=m.mode.toLowerCase().replace(/\(.*?\)/g,"").split(/[^a-z]+/).filter(x=>x.length>4&&!/failure|damage|fault|loss/.test(x));if(!w.length)return 0;return MH.filter(r=>r.n===n&&w.some(x=>[r.prob,r.root,r.act].join(" ").toLowerCase().includes(x))).length}
function clsView(n){const s=S(n),c=eqcOf(n),mo=c.fm.slice().sort((a,b)=>eqcRpn(b)-eqcRpn(a)),li=a=>`<ul class="bul" style="margin:4px 0 0 16px">${a.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
 const std=c.standards.map(x=>`<li>${esc(x)}</li>`).join("");
 return `<div class="note-warn" style="margin-bottom:12px"><b>General reference for a ${esc(c.label.toLowerCase())}.</b> This is standard engineering knowledge, not a record of ${esc(s.tag)}. Check it against the datasheet, the OPLs and the maintenance history before acting.</div>
 <div class="card" style="margin-bottom:12px"><h3>Typical failure modes</h3><p class="muted" style="margin:2px 0 8px;font-size:12.5px">Risk priority = severity x occurrence x detection difficulty, each scored 1 to 10 for a typical installation. The last column shows how often the plant's own work orders mention the same words.</p>
 <table><tr><th>Failure mode</th><th>Effect</th><th>Usual causes</th><th>How it is found</th><th>Action</th><th>Priority</th><th>Seen at ${esc(s.tag)}</th></tr>${mo.map(m=>`<tr><td><b>${esc(m.mode)}</b></td><td>${esc(m.effect)}</td><td>${esc(m.causes)}</td><td>${esc(m.detect)}</td><td>${esc(m.action)}</td><td><b style="color:var(--${eqcRpn(m)>=200?"bad":eqcRpn(m)>=120?"warn":"ok"})">${eqcRpn(m)}</b><div class="muted" style="font-size:11px">${m.S} x ${m.O} x ${m.D}</div></td><td>${eqcSeen(n,m)} work orders</td></tr>`).join("")}</table></div>
 <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;align-items:start"><div class="card"><h3>Inspection checklist</h3>${li(c.inspect)}<h3 style="margin-top:12px">Start-up checks</h3>${li(c.startup)}</div>
 <div class="card"><h3>Typical protective functions</h3>${li(c.trips)}<h3 style="margin-top:12px">Common spares</h3>${li(c.spares)}<h3 style="margin-top:12px">Indicators to track</h3>${li(c.kpi)}<h3 style="margin-top:12px">Hazards</h3>${li(c.hazards)}</div></div>
 <div class="card" style="margin-top:12px"><h3>Standards that normally apply</h3><ul class="bul" style="margin:4px 0 0 16px">${std}</ul></div>`}
/* assistant: questions about a class of equipment in general, or about the standards behind it */
function eqcFind(l,set){let k=set?eqcKey(set):null,lab=null;Object.entries(EQC.classes).forEach(([key,c])=>{if(!k&&(c.aliases||[]).concat([c.label.toLowerCase()]).some(a=>new RegExp("\\b"+a.replace(/[^\w ]/g,"")+"s?\\b").test(l)))k=key});return k}
function aiClass({set,topic,cls}){const k=cls||(set?eqcKey(set):null),c=k&&EQC.classes[k];if(!c)return{empty:true,text:"",sources:[]};const t=topic||"modes",nm=set?S(set).tag+" ("+c.label.toLowerCase()+")":c.label.toLowerCase();let body="";
 if(t==="inspect")body=`<b>Inspection checklist for a ${esc(nm)}</b><ol class="ansl">${c.inspect.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`;
 else if(t==="spares")body=`<b>Common spares for a ${esc(nm)}</b><ol class="ansl">${c.spares.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`;
 else if(t==="standards")body=`<b>Standards that normally apply to a ${esc(nm)}</b><ol class="ansl">${c.standards.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`;
 else if(t==="startup")body=`<b>Start-up checks for a ${esc(nm)}</b><ol class="ansl">${c.startup.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`;
 else body=`<b>Typical failure modes of a ${esc(nm)}, by risk priority</b><ol class="ansl">${c.fm.slice().sort((a,b)=>eqcRpn(b)-eqcRpn(a)).slice(0,6).map(m=>`<li>${esc(m.mode)}: ${esc(m.effect.toLowerCase())}. Usual causes: ${esc(m.causes.toLowerCase())}. Priority <b>${eqcRpn(m)}</b></li>`).join("")}</ol>`;
 return{text:body+`<div class="muted note">This is a general engineering reference for the equipment class, not a record of this plant.${set?` <a class="alink" onclick="go('equipment',{set:${set},tab:'cls'})">Open the class reference for ${esc(S(set).tag)}</a>`:""}</div>`,
  sources:[{k:"data",id:"EQC:"+k,chunk_id:"data:EQC:"+k,title:"Equipment class reference | "+c.label,set:set||0,ver:"reference library",status:"Reference",text:c.label+" "+t,rows:[],score:0,rel:1}],conf:68,intent:"class_knowledge"}}
AI.tools.class_knowledge={description:"General engineering reference for a class of equipment (pump, compressor, fan, control valve, heat exchanger, fired heater, column, reactor, drum, tank, dryer, motor, instrument): typical failure modes, inspection checklist, start-up checks, common spares and the standards that apply. Not plant records.",parameters:{type:"object",properties:{set:{type:"integer",description:"Equipment set whose class to use, if one is named"},topic:{type:"string",description:"modes, inspect, spares, standards or startup"},cls:{type:"string",description:"Equipment class key such as pump or heat exchanger when no set is named"}},required:[]},run:aiClass};
{const _r=aiRoute;aiRoute=function(q,ctx){const l=q.toLowerCase();
  const gen=/\b(typical|usual|common|general|generic|standard)\b/.test(l)||/\b(what|which)\b.*\b(standards?|codes?)\b/.test(l)||/\bwhat should (i|we) inspect\b/.test(l)||/\b(inspection checklist|checklist for)\b/.test(l)||/\b(recommended|suggested|critical) spares?\b/.test(l);
  if(gen){const sets=K.sets.filter(s=>l.includes(s.tag.toLowerCase())),set=sets[0]?sets[0].n:0,k=eqcFind(l,set);if(k){const topic=/\bstandards?\b|\bcodes?\b/.test(l)?"standards":/\binspect|checklist/.test(l)?"inspect":/\bspares?\b/.test(l)?"spares":/start[- ]?up/.test(l)?"startup":"modes";return["class_knowledge",{set,topic,cls:k}]}}
  return _r.apply(this,arguments)}}
