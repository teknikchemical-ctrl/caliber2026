/* =====================================================================================================
   START-UP READINESS
   Before a unit is started or restarted, the checks that are scattered over the interlock logic, the P&ID, the work orders, the lessons and
   the data quality notes are put in one list. The start permissives of the interlock logic are read against the live model, any latched
   trip or valve left closed on the P&ID is a blocker, recent corrective work is flagged, the lessons for the start-up have to be read,
   past start-up problems from the work orders are shown, and open conflicts in the source documents are listed. The result is GO,
   GO WITH CHECKS or NO-GO, with the reason, and a sign-off is written to the audit trail.
   ===================================================================================================== */
regMod("ready","1.0",["il","fm"],"Start-up readiness");
const RDY=(()=>{let s={};try{s=JSON.parse(localStorage.getItem("akp_ready")||"{}")}catch(e){}return{ack:s.ack||{},man:s.man||{},sign:s.sign||{}}})();
const rdySave=()=>{try{localStorage.setItem("akp_ready",JSON.stringify(RDY))}catch(e){}};
const rdyUser=()=>{try{return AUTH.user?AUTH.user[4]+" ("+ROLE.name+")":ROLE.user}catch(e){return"user"}};
function rdyWithSet(n,fn){const k=P.set;P.set=n;try{return fn()}finally{P.set=k}}
function rdyChecks(n){const s=S(n),il=KIL[n],asof=pdmAsof(),items=[],add=(group,title,status,detail,extra)=>items.push(Object.assign({group,title,status,detail},extra||{}));
 /* 1 start permissives, read against the live model */
 (il.perm||[]).filter(p=>!/^=>/.test(p[1])).forEach(p=>{const tag=p[2];if(!/^[A-Z]{1,5}-?\d{2,5}[A-Z]?$/.test(tag)){add("Start permissives",`${p[0]}. ${p[1]}`,"info",`${tag}: confirm on the DCS.`,{src:il.no});return}let L=null;try{L=rdyWithSet(n,()=>read(tag))}catch(e){}
  const closed=D[n]&&D[n].n.some((nd,i)=>nd[0]===tag&&vIs(nd)&&vClosed(n,i));
  if(L&&(L.s==="TRIP"||L.s==="EFFECT"))add("Start permissives",`${p[0]}. ${p[1]}`,"bad",`${tag} reads ${L.v}. The unit cannot start until it is healthy.`,{src:il.no});
  else if(closed)add("Start permissives",`${p[0]}. ${p[1]}`,"bad",`${tag} is closed on the P&ID.`,{src:il.no});
  else add("Start permissives",`${p[0]}. ${p[1]}`,L?"ok":"warn",L?`${tag} reads ${L.v}.`:`No live signal for ${tag} in this model. Confirm in the field or on the DCS.`,{src:il.no})});
 /* 2 latched trips and valves left in a non-normal position */
 const trips=Object.keys(LIVE.f).filter(k=>LIVE.f[k]&&k.startsWith(n+":")).map(k=>k.slice(k.indexOf(":")+1));
 trips.forEach(t=>add("Trips and valves",`Trip on ${t} is latched`,"bad","Clear the cause, then reset the trip before starting.",{src:il.no}));
 Object.keys(VLV).filter(k=>k.startsWith(n+":")).forEach(k=>{const i=+k.slice(k.indexOf(":")+1),nd=D[n].n[i];if(nd&&vClosed(n,i)!==vDefClosed(nd))add("Trips and valves",`${nd[0]} is not in its normal position`,"warn",vClosed(n,i)?"Closed by an operator on the P&ID. Reopen it or note why it stays closed.":"Opened by an operator on the P&ID. Close it or note why it stays open.")});
 if(!trips.length&&!Object.keys(VLV).some(k=>k.startsWith(n+":")))add("Trips and valves","No latched trip and no valve out of position","ok","Checked on the P&ID model.");
 /* 3 recent corrective work */
 const rec=MH.filter(r=>r.n===n&&r.t1<=asof&&pd2Bad(r)).sort((a,b)=>b.t1-a.t1).slice(0,3);
 if(!rec.length)add("Recent work","No corrective work recorded","ok","");
 rec.forEach(r=>{const d=(asof-r.t2)/DAY;add("Recent work",`${r.wo}: ${r.prob}`,d<=14?"warn":"ok",`${dstr(r.t1)}. ${r.act||"No action text"}. ${d<=14?"Finished "+Math.round(d)+" days ago, so run it and check this repair first.":""}`.trim(),{wo:r.wo})});
 MH.filter(r=>r.n===n&&r.gen&&r.st!=="Completed").forEach(r=>add("Recent work",`Open work order ${r.wo}`,"bad",`${r.prob}. Close it or accept the risk before starting.`,{wo:r.wo}));
 /* 4 lessons that have to be read */
 K.opl.filter(o=>o.set===n&&(/start|prim|permissive|pre-?start|alarm response|minimum flow|deadhead|seal flush/i.test(o.title)||o.cls==="Trouble Case")).slice(0,4).forEach(o=>{
  const k=n+"|"+o.no+"|"+ROLE.user,ok=!!RDY.ack[k];add("Lessons to read",`${o.no}: ${o.title}`,ok?"ok":"warn",ok?"Read.":(o.obj||"").slice(0,150),{opl:o.no,ack:k,ok})});
 /* 5 earlier start-up problems from the work orders */
 MH.filter(r=>r.n===n&&r.t1<=asof&&/start|restart|trip|permissive|prim|cavitat|dry run|airlock/i.test([r.prob,r.root].join(" "))).sort((a,b)=>b.t1-a.t1).slice(0,3).forEach(r=>add("Seen before",`${r.prob}`,"info",`${dstr(r.t1)}. Cause: ${r.root}. What fixed it: ${r.act}.`,{wo:r.wo}));
 /* 6 conflicts in the source documents */
 const iss=K.issues.filter(i=>JSON.stringify(i).includes(s.tag)&&/High|Medium/i.test(i.severity||""));
 add("Document conflicts",iss.length?`${iss.length} open conflict${iss.length===1?"":"s"} touch ${s.tag}`:`No open conflict touches ${s.tag}`,iss.length?"warn":"ok",iss.length?"Check the field before relying on these drawings: "+iss.slice(0,2).map(i=>(i.issue||"").toString().slice(0,90)).join(" | "):"",{});
 /* 7 manual checks taken from the lessons' safety notes */
 const o0=K.opl.find(o=>o.set===n&&o.safety&&o.safety.length);if(o0)(o0.safety||[]).slice(1,5).forEach((t,i)=>{const k=n+"|m"+i+"|"+ROLE.user,ok=!!RDY.man[k];add("Field checks",t.replace(/\.$/,""),ok?"ok":"warn",ok?"Confirmed.":"Confirm on site.",{man:k,ok})});
 if(hseKey(n)){const k=n+"|haz|"+ROLE.user,ok=!!RDY.man[k];add("Field checks",`Flammable service (${S(n).fluid}): gas detectors healthy and fire monitors clear`,ok?"ok":"warn",ok?"Confirmed.":"Confirm on site.",{man:k,ok})}
 const bad=items.filter(x=>x.status==="bad").length,warn=items.filter(x=>x.status==="warn").length;
 return{items,bad,warn,verdict:bad?"NO-GO":warn?"GO WITH CHECKS":"GO"}}
function rdyAck(k,v){RDY.ack[k]=v;rdySave();render()}
function rdyMan(k,v){RDY.man[k]=v;rdySave();render()}
function rdySign(n){const r=rdyChecks(n);if(r.bad)return alert("A blocker is open. Clear it first.");RDY.sign[n]={who:rdyUser(),t:nowIso(),verdict:r.verdict,warn:r.warn};rdySave();try{audit("Start-up readiness signed off",S(n).tag+" "+r.verdict+" ("+r.warn+" checks open)")}catch(e){}render()}
function rdyView(n){const r=rdyChecks(n),s=S(n),col={ok:"ok",warn:"warn",bad:"bad",info:"muted"},ic={ok:"✓",warn:"!",bad:"✕",info:"i"},groups=[...new Set(r.items.map(x=>x.group))],vc=r.verdict==="GO"?"#1a7f37":r.verdict==="NO-GO"?"#cf222e":"#9a6700",sg=RDY.sign[n];
 const rowH=x=>`<tr><td style="width:26px"><span class="rdyic ${col[x.status]}">${ic[x.status]}</span></td><td style="width:42%"><b>${esc(x.title)}</b></td><td class="muted" style="white-space:normal">${esc(x.detail||"")} ${x.opl?`<a class="alink" onclick="go('opl',{opl:'${x.opl}'})">Open</a> ${x.ok?"":`<button class="ghost" style="padding:2px 9px;font-size:12px" onclick="rdyAck('${x.ack}',true)">I have read it</button>`}`:""}${x.man&&!x.ok?`<button class="ghost" style="padding:2px 9px;font-size:12px" onclick="rdyMan('${x.man}',true)">Confirm</button>`:""}${x.wo?` <a class="alink" onclick="mhOpen('${x.wo}')">${x.wo}</a>`:""}${x.src&&!x.opl?` <span class="tag">${esc(x.src)}</span>`:""}</td></tr>`;
 return `<div class="grid" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:14px;align-items:start"><div class="card"><div class="row between" style="flex-wrap:wrap;gap:8px"><div><h3 style="margin:0">Start-up readiness: ${esc(s.tag)} ${esc(s.name)}</h3><div class="muted" style="font-size:12.5px;margin-top:2px">Every check below comes from the interlock logic, the P&ID model, the work orders, the lessons and the document quality notes for this unit.</div></div><span class="rdyv" style="background:${vc}">${r.verdict}</span></div>
  ${groups.map(g=>`<h4 style="margin:14px 0 4px;font-size:13px">${g}</h4><table class="mht" style="width:100%">${r.items.filter(x=>x.group===g).map(rowH).join("")}</table>`).join("")}</div>
  <div><div class="card"><h3>Decision</h3><p style="line-height:1.6;margin:6px 0 10px">${r.bad?`<b>${r.bad} blocker${r.bad===1?"":"s"}.</b> The unit should not be started until ${r.bad===1?"it is":"they are"} cleared.`:r.warn?`<b>${r.warn} check${r.warn===1?"":"s"} still open.</b> Close them out, or accept them with a note, then sign off.`:"<b>All checks are clear.</b> Sign off to record the decision."}</p>
   <div class="row" style="gap:6px;flex-wrap:wrap"><button ${r.bad?"disabled":""} onclick="rdySign(${n})">Sign off as ${esc(ROLE.name)}</button><button class="ghost" onclick="pidGo(${n},-1)">Open the P&amp;ID</button><button class="ghost" onclick="go('ai',{scope:${n}})">Ask the assistant</button></div>
   ${sg?`<p class="muted" style="font-size:12.5px;margin-top:10px">Last sign-off: <b>${esc(sg.verdict)}</b> by ${esc(sg.who)} on ${esc(sg.t)}.</p>`:""}</div>
   <div class="card" style="margin-top:12px"><h3>How to use it</h3><ul class="hseul"><li>On the P&amp;ID, <b>Simulate trip</b> or close a valve and watch the blockers appear here.</li><li>Read each lesson, then press <b>I have read it</b>. The tick is kept for you only.</li><li>"Seen before" shows what went wrong at earlier starts and what fixed it.</li></ul></div></div></div>`}
