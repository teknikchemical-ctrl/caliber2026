/* ===== Dashboard and cross-module charts (all clickable) ===== */
const goMnt=(js)=>`${js};go('mnt')`;
function dashboard(){const hi=K.issues.filter(i=>i.severity==="High"),noApp=cnt(K.docs,d=>!d.status),bd=MH.filter(r=>r.bd==="Yes"),cell=(ok,t)=>ok?`<span style="color:var(--ok)">&#10003;${t?" "+t:""}</span>`:`<span style="color:var(--bad)">Missing</span>`;
 const types=[...new Set(MH.map(r=>r.type))],byType=TYS.map(t=>({l:t,v:MH.filter(r=>r.type===t).length,c:TYC[t],js:`MHS.set=0;MHS.p=null;mhFilt('type','${t}');go('mnt')`})).filter(x=>x.v);
 const dtSet=K.sets.map(s=>({l:s.tag,v:Math.round(sum(MH.filter(r=>r.n===s.n),r=>r.dt||0)),c:"#cf222e",js:`MHS.set=${s.n};MHS.p=null;MHS.f.bd='Yes';MHS.view='table';go('mnt')`}));
 const docSt=Object.entries(K.docs.reduce((o,d)=>(o[ds(d)]=(o[ds(d)]||0)+1,o),{})).sort((a,b)=>b[1]-a[1]).map(([k,v],i)=>({l:k,v,c:k==="Not stated"?"#9a6700":CPAL[(i+1)%CPAL.length],js:`st.f.dst='${k}';go('documents')`}));
 const mon=MONS.map(m=>({l:m.slice(2).replace("-","/"),v:MH.filter(r=>r.mon===m).length,c:"#0b5fd7",js:`MHS.set=0;mhPick('${m}','');go('mnt')`}));
 const instSet=K.sets.map(s=>({l:s.tag,js:`go('il',{il:${s.n}})`,vals:{Listed:cnt(K.inst,i=>i.set===s.n&&!i.flag),Review:cnt(K.inst,i=>i.set===s.n&&i.flag)}}));
 const oplCl=["Basic Knowledge","Improvement","Trouble Case"].map((c,i)=>({l:c,v:cnt(K.opl,o=>o.cls===c),c:CPAL[i],js:`st.f.oc='${c}';st.f.os='';go('opl')`}));
 return `<h1>Dashboard</h1><p class="sub">${K.sets.length} equipment sets | ${K.docs.length} documents | ${MH.length} work orders | ${KB.IL?8:8} interlock documents</p>${ovHero()}
 <div class="grid" style="grid-template-columns:repeat(6,1fr);gap:12px">${kpiTile(K.sets.length,"Equipment sets","","go('equipment',{set:null})")}${kpiTile(K.docs.length,"Documents","","go('documents')")}${kpiTile(MH.length,"Work orders","","MHS.set=0;MHS.p=null;go('mnt')")}${kpiTile(bd.length,"Breakdowns","bad","MHS.set=0;MHS.p=null;mhFilt('bd','Yes');go('mnt')")}${kpiTile(7,"Safety functions","","go('il')")}${kpiTile(K.opl.length,"One-point lessons","","go('opl')")}</div>
 <div class="split" style="margin-top:14px"><div class="card rel"><div class="row between"><h3>Plot plan: equipment locations</h3>${modeSel()}</div><p class="muted" style="margin-bottom:8px">Select a unit to open its equipment set.</p>${mapSvg(0,{vb:[30,70,830,680]})}</div>
 <div class="card"><h3>Items requiring attention</h3>
  <div class="row between click" style="padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer" onclick="go('il')"><span>Datasheets and interlock logic ingested</span>${tg("16 of 16","ok")}</div>
  <div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer" onclick="st.f.dst='Not stated';go('documents')"><span>Documents without approval status</span>${tg(noApp+" of "+K.docs.length,"warn")}</div>
  <div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer" onclick="go('quality')"><span>Instruments flagged for review</span>${tg(cnt(K.inst,i=>i.flag),"warn")}</div>
  <h3 style="margin-top:16px">High severity data issues (${hi.length})</h3>${hi.slice(0,5).map(i=>`<div style="padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer" onclick="st.f.qs='High';go('quality')"><span class="tag bad">${esc(i.source)}</span> <span class="muted">${esc(i.issue).slice(0,90)}</span></div>`).join("")}<p class="back" style="margin:10px 0 0" onclick="st.f.qs='';go('quality')">View all ${K.issues.length} issues &rarr;</p></div></div>
 <div class="grid" style="grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:14px;align-items:start">
  ${cCard("Work orders by type",cDonut(byType,{center:MH.length,sub:"work orders"}),"select a segment")}
  ${cCard("Breakdown downtime by equipment (h)",cHBar(dtSet),"select a bar")}
  ${cCard("Document approval status",cDonut(docSt,{center:K.docs.length,sub:"documents"}),"select a segment")}</div>
 <div class="grid" style="grid-template-columns:1.5fr 1fr 1fr;gap:14px;margin-top:14px;align-items:start">
  ${cCard("Work orders per month",cCols(mon,{h:150,w:640,fs:8.5}),"select a month")}
  ${cCard("Instrument status by equipment",cStackRows(instSet,[{k:"Listed",c:"#1a7f37",js:r=>r.js},{k:"Review",c:"#9a6700",js:r=>r.js}])+cLegend([{k:"Listed",c:"#1a7f37"},{k:"Review",c:"#9a6700"}]),"select a bar")}
  ${cCard("One-point lessons by class",cDonut(oplCl,{center:K.opl.length,sub:"lessons"}),"select a segment")}</div>
 <div class="card" style="margin-top:14px"><h3>Knowledge coverage per equipment set</h3><p class="muted" style="margin-bottom:6px">Select a row to open the equipment set.</p>
 <table><tr><th>Set</th><th>Equipment</th><th>P&amp;ID</th><th>GA</th><th>Datasheet</th><th>Plot plan</th><th>Interlock</th><th>OPL</th><th>Work orders</th></tr>
 ${K.sets.map(s=>`<tr class="click" onclick="go('equipment',{set:${s.n},tab:'overview'})"><td>${s.n}</td><td><b>${s.tag}</b><br><span class="muted">${s.name}</span></td><td>${cell(1)}</td><td>${cell(1)}</td><td>${cell(1,"Rev 3")}</td><td>${cell(1)}</td><td>${cell(1,ilIsLoop(s.n)?"loop only":ilD(s.n).logic)}</td><td>${cnt(K.opl,o=>o.set===s.n)}</td><td>${MH.filter(r=>r.n===s.n).length}</td></tr>`).join("")}</table></div>`}
/* ---- equipment set records overview ---- */
function setCharts(n){const rows=MH.filter(r=>r.n===n),byT=TYS.map(t=>({l:t,v:rows.filter(r=>r.type===t).length,c:TYC[t],js:`MHS.set=${n};MHS.p=null;MHS.f.type='${t}';MHS.view='table';go('equipment',{set:${n},tab:'maint'})`})).filter(x=>x.v),
 mon=MONS.map(m=>({l:m.slice(2).replace("-","/"),v:rows.filter(r=>r.mon===m).length,c:"#0b5fd7",js:`MHS.set=${n};mhPick('${m}','');go('equipment',{set:${n},tab:'maint'})`})),ins=K.inst.filter(i=>i.set===n),opl=["Basic Knowledge","Improvement","Trouble Case"].map((c,i)=>({l:c,v:cnt(K.opl,o=>o.set===n&&o.cls===c),c:CPAL[i],js:`go('equipment',{set:${n},tab:'opl'})`}));
 return `<div class="grid" style="grid-template-columns:1fr 1.4fr 1fr;gap:14px;margin-top:14px;align-items:start">${cCard("Maintenance by work type",cDonut(byT,{center:rows.length,sub:"work orders"}),"select a segment")}${cCard("Work orders per month",cCols(mon,{h:150,w:560,fs:8.5}),"select a month")}${cCard("Instrument and lesson records",cDonut([{l:"Listed instruments",v:ins.filter(i=>!i.flag).length,c:"#1a7f37",js:`go('equipment',{set:${n},tab:'seq'})`},{l:"Instruments to review",v:ins.filter(i=>i.flag).length,c:"#9a6700",js:`go('equipment',{set:${n},tab:'seq'})`},...opl.filter(x=>x.v)],{center:ins.length+cnt(K.opl,o=>o.set===n),sub:"records"}),"select a segment")}</div>`}

const _rDash=render;render=function(){const r=_rDash.apply(this,arguments);if(st.page==="dashboard")setTimeout(ovStart,0);else clearInterval(OV.timer);return r}

dbBootstrap();
