/* ===== Scenario engine: maintenance and OPL scenarios on the P&ID, and plant wide chain reactions across connected equipment ===== */
regMod("scn","1.0",["dl","fx","fm","pid2","pdm"],"Scenario engine");
const SCN={tab:"plant",forced:[],u:{cur:null,t:0,timer:null,src:"opl",set:1,sel:""},p:{res:null,t:0,play:false,timer:null,init:{unit:Math.min(4,K.sets.length),cause:"",mode:"trip",util:""},state:null,speed:1}};
const scnTagsOf=s=>DB.tagsOf(String(s||"").toUpperCase());
/* find the node of a tag on the P&ID: exact, then same letters and number ignoring a trailing letter */
function scnNodeIdx(n,tag){const N=D[n].n;let i=N.findIndex(x=>x[0]===tag);if(i>=0)return i;const base=String(tag).replace(/[A-Z]$/,"");i=N.findIndex(x=>String(x[0]).replace(/[A-Z]$/,"")===base);if(i>=0)return i;i=N.findIndex(x=>String(x[0]).startsWith(base));return i}
function scnClearForce(){SCN.forced.forEach(k=>delete LIVE.f[k]);SCN.forced=[]}
function scnForce(n,tag){const k=n+":"+tag;LIVE.f[k]=true;SCN.forced.push(k);if(!D[n].eff[tag]){const k2=n+":"+S(n).tag;LIVE.f[k2]=true;SCN.forced.push(k2)}}
/* ---------- unit scenarios: from an OPL troubleshooting case or from a work order ---------- */
function scnOplCases(set){const L=[];K.opl.filter(o=>o.set===set).forEach(o=>(o.ts||[]).forEach((t,i)=>L.push({id:o.no+"#"+i,src:"OPL",set,opl:o.no,title:o.title,symptom:t[0],cause:t[1],action:t[2],tags:o.tags,steps:o.steps})));
 UKB.items.filter(x=>x.set===set&&x.type==="lesson"&&x.status!=="Rejected"&&x.meta&&(x.meta.cases||[]).length).forEach(x=>x.meta.cases.forEach((t,i)=>L.push({id:x.id+"#"+i,src:"User lesson",set,opl:x.id,title:x.title,symptom:t[0],cause:t[1],action:t[2],tags:x.tags.join(", "),steps:(x.meta.steps||[]).map(s=>[s,""])})));return L}
function scnSplitAction(a){return String(a||"").split(/,\s+|;\s+|\s+and\s+|\.\s+/).map(s=>s.trim()).filter(s=>s.length>5).slice(0,6)}
function scnPhase(n,label,text,tags,o={}){const trip=[],alarm=[],ilt=ilD(n).trig.map(t=>t.tag);tags.forEach(t=>{if(o.trip&&(ilt.includes(t)||D[n].eff[t]))trip.push(t);else alarm.push(t)});return{label,text,tags:[...new Set(tags)],trip:o.trip?trip:[],alarm:o.trip?alarm:(o.alarm?tags:[]),note:o.note||""}}
function scnFromOplCase(c){const n=c.set,a=scnTagsOf(c.symptom),oplTags=scnTagsOf(c.tags),inSym=a.length?a:oplTags.slice(0,1),trip=/trip/i.test(c.symptom),parts=scnSplitAction(c.action),eq=S(n).tag;
 const cause=scnTagsOf(c.cause),causeTags=cause.length?cause:[eq],ph=[scnPhase(n,"Normal operation","Unit running normally. Press Play to start the "+c.src+" scenario.",[]),
  scnPhase(n,"Symptom",c.symptom,inSym,{trip,alarm:!trip,note:trip?"The trip is applied on the P&ID: drives stop and valves move as the interlock logic says.":"The instrument alarms."}),
  scnPhase(n,"Cause",c.cause,causeTags,{alarm:true}),
  ...parts.map((p,i)=>scnPhase(n,"Action "+(i+1),p,scnTagsOf(p).length?scnTagsOf(p):[eq],{})),
  ...((c.steps||[]).slice(0,2).map((s,i)=>scnPhase(n,"Verify "+(i+1),s[0]+(s[1]?" (check: "+s[1]+")":""),scnTagsOf(s[0]).length?scnTagsOf(s[0]):[eq],{}))),
  scnPhase(n,"Back to normal","Cause cleared. Unit back to normal.",[])];
 return{set:n,kind:"OPL",title:c.title,sub:`${c.src} ${c.opl}`,phases:ph,links:{opl:c.opl,symptom:c.symptom}}}
function scnFromWO(r){const n=r.n,tag=mhFailTag(r),eq=S(n).tag,bd=r.bd==="Yes",parts=scnSplitAction(r.act),ks=mhParts(r),comp=ks.length?mhPartName(n,ks[0]):"";
 const ph=[scnPhase(n,"Normal operation","The unit is running.",[]),scnPhase(n,"Reported "+dstr(r.t0),r.prob,[tag],{trip:bd,alarm:!bd,note:bd?"Breakdown: the initiating tag is forced to trip.":"Reported as a work request."}),
  scnPhase(n,"Root cause"+(comp?" ("+comp+")":""),r.root||"Not stated",scnTagsOf(r.root).length?scnTagsOf(r.root):[tag],{alarm:true}),
  ...parts.map((p,i)=>scnPhase(n,"Repair "+(i+1),p,scnTagsOf(p).length?scnTagsOf(p):[eq],{})),
  scnPhase(n,"Back to normal",`Completed ${dstr(r.t2)}${r.dt?", downtime "+r.dt+" h":""}. Spares: ${r.parts||"none"}.`,[])];
 return{set:n,kind:"Work order",title:r.wo+": "+(r.prob||"").slice(0,70),sub:`${r.tag} | ${r.type} | ${dstr(r.t0)}`,phases:ph,links:{wo:r.wo,symptom:[r.prob,r.root].join(". ")}}}
/* links between maintenance and OPL, both directions */
function scnOplFor(r){const q=[r.prob,r.root].join(". "),h=DB.search(q,{set:r.n,kinds:["opl"],k:12,anyRole:true}).filter(x=>x.sec==="Troubleshooting case"&&x.rel>=.45).slice(0,4);return h.map(x=>({opl:x.id,idx:+(String(x.cid).replace("ts","")),title:(OPL[x.id]||{}).title||x.id,rel:x.rel,text:x.text.replace(/^[^.]*\.\s*/,"").slice(0,170)}))}
function scnWoFor(c){const R=fmCases(c.symptom+" "+c.cause,{set:c.set});return R.cases.filter(x=>x.k==="wo").slice(0,4)}
/* ---------- plant chain reaction rules ---------- */
/* Rules are engineering assumptions per connected stream. Each rule names the instrument on the affected unit's P&ID, how the value moves, and the protective trip it reaches. */
/*@@CASE:scn@@*/
/* run a cascade: breadth first, earliest time wins, each unit trips once */
function scnCascade(init){const ev=[],tripAt={},fired=new Set(),deg=init.mode==="degrade",kf=deg?2.2:1,Q=[];
 const trip=(n,t,why,tag)=>{if(deg)return false;if(tripAt[n]!=null&&tripAt[n]<=t)return false;tripAt[n]=t;Q.push({n,t});return true};
 const push=e=>ev.push(e);
 if(init.mode==="util"){const util=init.util;push({t:0,unit:0,kind:"initiating",tag:util,text:`${SCN_UTIL[util]} is lost (external supply).`,rule:null});Q.push({util,t:0})}
 else{const n=init.unit,tg=init.cause||S(n).tag,trg=ilD(n).trig.find(x=>x.tag===tg);push({t:0,unit:n,kind:deg?"alarm":"trip",tag:tg,text:deg?`${S(n).tag} is degraded (${trg?trg.c:"partial loss of function"}); output falls by about half.`:`${S(n).tag} trips${trg?" on "+trg.c+" ("+trg.tag+" "+trg.sp+")":" (equipment failure)"}.`,rule:null,effects:(D[n].eff[tg]||[]).slice(0,6)});if(!deg){tripAt[n]=0;Q.push({n,t:0})}else Q.push({n,t:0,degraded:true})}
 const fire=(r,t0,from)=>{if(fired.has(r.id))return;fired.add(r.id);const tAl=t0+r.delay*kf*.6,tEnd=t0+r.delay*kf,hasTrip=!!r.trip&&!deg,rel=!!r.relief&&!deg;
  push({t:+tAl.toFixed(1),unit:r.unit,kind:"alarm",tag:r.tag,text:`${r.name} (${r.tag}) deviates ${r.dir}: ${r.from} to ${deg?((r.from+r.to)/2).toFixed(1):r.to} ${r.u}. ${r.why}`,rule:r.id,from});
  if(hasTrip){push({t:+tEnd.toFixed(1),unit:r.unit,kind:"trip",tag:r.trip.tag,text:`${r.trip.tag} (${r.trip.lim}) trips ${S(r.unit).tag}.`,rule:r.id,from,effects:(D[r.unit].eff[r.trip.tag]||[]).slice(0,6)});trip(r.unit,tEnd,r.why,r.trip.tag)}
  else if(rel)push({t:+tEnd.toFixed(1),unit:r.unit,kind:"relief",tag:r.relief.tag,text:`${r.relief.tag} lifts at ${r.relief.lim}.`,rule:r.id,from})};
 const seen=new Set();let g=0;while(Q.length&&g++<80){Q.sort((a,b)=>a.t-b.t);const x=Q.shift();if(x.util){OVL.filter(o=>o[2]===0&&o[4]===x.util).forEach(o=>SCN_RULES.filter(r=>r.ev==="util"&&r.stream===x.util).forEach(r=>fire(r,x.t,"util")));continue}
  const n=x.n,key=n+"@"+x.t;if(seen.has(key))continue;seen.add(key);
  OVL.filter(o=>o[2]===n&&o[2]!==0).forEach(o=>SCN_RULES.filter(r=>r.ev==="supply"&&r.stream===o[0]).forEach(r=>fire(r,x.t+.5*kf,n)));
  OVL.filter(o=>o[2]!==0&&(Array.isArray(o[3])?o[3].includes(n):o[3]===n)).forEach(o=>SCN_RULES.filter(r=>r.ev==="block"&&r.stream===o[0]).forEach(r=>fire(r,x.t+.5*kf,n)))}
 ev.sort((a,b)=>a.t-b.t||(a.kind==="alarm"?-1:1));ev.forEach(e=>{if(e.unit){const o=scnOplForTag(e.unit,e.tag,e.text);e.opl=o;if(e.from&&e.from!=="util"&&e.from!==e.unit)e.lag=scnLag(e.from,e.unit)}});
 const tripped=Object.keys(tripAt).map(Number),units=[...new Set(ev.filter(e=>e.unit).map(e=>e.unit))],end=Math.max(60,...ev.map(e=>e.t+10));
 return{init,events:ev,tripAt,tripped,units,end,impact:scnImpact(tripped,units,init)}}
function scnOplForTag(n,tag,text){const h=DB.search(tag+" "+text.slice(0,80),{set:n,kinds:["opl"],k:6,anyRole:true}).filter(x=>x.rel>=.5&&(x.hits||[]).some(t=>t===tag.toLowerCase()||tag.toLowerCase().split("-")[0]===t&&x.text.toLowerCase().includes(tag.toLowerCase().split("-")[1]||"@@")));const b=h[0];if(!b)return null;const o=OPL[b.id];return{opl:b.id,title:o?o.title:b.id,sec:b.sec,text:b.text.replace(/^[^.]*\.\s*/,"").slice(0,170),chunk:b.chunk_id}}
/* does history support the link? breakdowns on a unit followed by a breakdown on the connected unit within 7 days, against the chance rate */
function scnLag(a,b){const A=MH.filter(r=>r.n===a&&r.bd==="Yes"),B=MH.filter(r=>r.n===b&&r.bd==="Yes"),span=(T1-T0)/DAY;let hit=0;A.forEach(x=>{if(B.some(y=>y.t1>x.t1&&y.t1<=x.t1+7*DAY))hit++});const chance=Math.min(1,B.length*7/span);return{n:A.length,hit,chance:+chance.toFixed(2),obs:A.length?+(hit/A.length).toFixed(2):0}}
function scnImpact(tripped,units,init){const mean=(n,f,d)=>{const r=MH.filter(x=>x.n===n&&x.bd==="Yes");return r.length?sum(r,f)/r.length:d};const hrs=tripped.map(n=>({n,h:mean(n,r=>r.dt||0,8)})),cost=tripped.map(n=>({n,c:mean(n,r=>r.tc||0,0)}));
 return{tripped:tripped.length,affected:units.length,hours:Math.round(sum(hrs,x=>x.h)),cost:sum(cost,x=>x.c),perUnit:hrs,share:Math.round(units.length/K.sets.length*100)}}
/* state of the plant at time t */
function scnStateAt(res,t){const st={units:{},tags:{},streams:{}};res.events.filter(e=>e.t<=t&&e.unit).forEach(e=>{const u=e.unit;st.tags[u]=st.tags[u]||{};st.tags[u][e.tag]=e.kind==="trip"?"trip":e.kind==="relief"?"relief":(st.tags[u][e.tag]==="trip"?"trip":"alarm");const cur=st.units[u];if(e.kind==="trip")st.units[u]="trip";else if(cur!=="trip")st.units[u]="alarm"});
 Object.keys(res.tripAt).forEach(n=>{if(res.tripAt[n]<=t){st.units[n]="trip"}});
 OVL.forEach(o=>{const src=o[2],lost=src===0?(res.init.mode==="util"&&res.init.util===o[4]):(res.tripAt[src]!=null&&res.tripAt[src]<=t);const cons=Array.isArray(o[3])?o[3]:[o[3]];const blocked=cons.some(c=>res.tripAt[c]!=null&&res.tripAt[c]<=t);st.streams[o[0]]=lost?"lost":blocked?"blocked":"ok"});
 return st}
