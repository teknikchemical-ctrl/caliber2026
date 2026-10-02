/* =====================================================================================================
   3D VIEWS FOR THE SIMULATIONS
   The OPL and work order scenarios, the failure view of a work order, the plant chain reaction and the plant replay each get a 3D view
   next to the P&ID. The 3D model shows the same phase: a failing part pulses, the machine shakes and stops when it trips, steam and
   sparks rise from the fault, and the banner says what is happening. The choice (P&ID or 3D) is remembered.
   ===================================================================================================== */
regMod("sim3d","1.0",["g3d","plant3d"],"3D views for simulations");
const SIM3={mode:(()=>{try{return localStorage.getItem("akp_sim3")||"pid"}catch(e){return"pid"}})()};
function simSw(m){SIM3.mode=m;try{localStorage.setItem("akp_sim3",m)}catch(e){}
 document.querySelectorAll(".simwrap").forEach(w=>{w.querySelectorAll(":scope>.simpid").forEach(x=>x.hidden=m!=="pid");w.querySelectorAll(":scope>.sim3").forEach(x=>x.hidden=m!=="3d");w.querySelectorAll(":scope>.gtog button").forEach(b=>b.classList.toggle("on",b.dataset.m===m))});g3Scan();p3Scan()}
const simTog=m=>`<div class="gtog" role="group" aria-label="Simulation view"><button data-m="pid" class="${m==="pid"?"on":""}" onclick="simSw('pid')">P&amp;ID</button><button data-m="3d" class="${m==="3d"?"on":""}" onclick="simSw('3d')">3D simulation</button></div>`;
function simFig(n,pid,o){const id="g3_"+(++G3.seq);G3.cfg[id]=Object.assign({n},o||{});const m=SIM3.mode;
 return `<div class="simwrap">${simTog(m)}<div class="simpid" ${m==="pid"?"":"hidden"}>${pid}</div><div class="sim3" ${m==="3d"?"":"hidden"}><div class="g3box" id="${id}"></div></div></div>`}
function simPlant(pid,o){const m=SIM3.mode;return `<div class="simwrap">${simTog(m)}<div class="simpid" ${m==="pid"?"":"hidden"}>${pid}</div><div class="sim3" ${m==="3d"?"":"hidden"}>${p3Hero(Object.assign({embed:true,h:540},o||{}))}</div></div>`}
/* phase of an OPL or work order scenario */
function scnFx(n){const u=SCN.u,sc=u&&u.cur;if(!sc)return null;const ph=sc.phases[u.t]||sc.phases[0],state=ph.trip.length?"trip":ph.alarm.length?"alarm":"normal";
 if(!sc._hot){const pr={n:sc.set,prob:(sc.title||"")+" "+(sc.sub||""),root:sc.phases.map(p=>p.text||"").join(" "),act:"",parts:""};try{sc._hot=mhParts(pr)}catch(e){sc._hot=[]}}
 return{state,hot:state==="normal"?[]:sc._hot.slice(0,2),text:`<b>${esc(ph.label)}</b>. ${esc((ph.text||"").slice(0,170))}`}}
/* live failure view of a work order */
function mhFx(r){const L=typeof MHM!=="undefined"?MHM.lv:null;if(!L||r.bd!=="Yes")return{state:"normal",hot:[],text:esc((r.prob||"").slice(0,120))};
 const st=gState(L.m,L.h[L.h.length-1]);return{state:L.tripped?"trip":st==="warn"?"alarm":"normal",hot:mhParts(r).slice(0,2),text:L.tripped?`<b>Tripped.</b> ${esc((r.prob||"").slice(0,120))}`:st==="warn"?`<b>Condition rising.</b> ${esc((r.prob||"").slice(0,100))}`:`<b>Running normally.</b> The failure sequence starts in a moment.`}}

/* the OPL simulator: the live 2D figure and a 3D view of the same equipment, switched from the same control */
function oplFx(){const S=SIMX.S();if(!S)return null;let st="normal";try{if(S.trip)st="trip";else if(S.E.V.some(d=>OPLT.vs(S,d)!=="ok"))st="alarm"}catch(e){}
 if(!S._hot){const pr={n:S.n,prob:(S.s.d||"")+" "+(S.o.obj||""),root:"",act:"",parts:""};try{S._hot=mhParts(pr)}catch(e){S._hot=[]}}
 const stt=S.trip?"Tripped on "+S.trip.tag:st==="alarm"?"Alarm: a process value is outside its normal range":"Operating normally";
 return{state:st,hot:st==="normal"?[]:S._hot.slice(0,2),text:`<b>${esc(stt)}</b>`}}
function oplFig(S){const id="g3_opl";G3.cfg[id]={n:S.n,fx:oplFx};const m=SIM3.mode;
 return `<div class="simwrap sfigw">${simTog(m)}<div class="sfig simpid" id="simFig" ${m==="pid"?"":"hidden"}></div><div class="sim3" ${m==="3d"?"":"hidden"}><div class="g3box" id="${id}"></div></div></div>`}
