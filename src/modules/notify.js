/* =====================================================================================================
   NOTIFICATIONS AND DATA QUALITY FOLLOW-UP
   The bell in the sidebar footer lists what needs attention for the signed-in person: approvals waiting, items they wrote that were
   rejected, answers marked wrong, high-risk forecasts, open data issues and changes by other people since they last looked.
   Data quality issues can be marked resolved or accepted by the roles that may review; the marks are stored with the feedback
   records, so they are shared like the rest of the knowledge.
   ===================================================================================================== */
regMod("notify","1.0",[],"Notifications and data quality follow-up");
const dqKey=i=>"DQ-"+cyrb((i.source||"")+"|"+(i.issue||"")).toString(36).toUpperCase();
const dqRec=i=>(STORE.mem.fb||[]).find(f=>f.kind==="dq"&&f.id===dqKey(i));
function dqSet(k,status){const i=K.issues.find(x=>dqKey(x)===k);if(!i)return;if(!can("review"))return needRole("review");let note="";if(status!=="Open"){note=prompt("Note (optional):")||""}
 const rec=dqRec(i),r={id:k,kind:"dq",t:rec?rec.t:nowIso(),u:nowIso(),who:ROLE.user,role:ROLE.name,status,note,q:(i.source+": "+i.issue).slice(0,300),verdict:status};
 STORE.mem.fb=(STORE.mem.fb||[]).filter(f=>f.id!==k);STORE.mem.fb.unshift(r);STORE.put("fb");audit("Data issue "+status.toLowerCase(),i.source+": "+String(i.issue).slice(0,80),k);BUS.emit("kb:changed");render()}
function quality(){const f=st.f,q=(f.qq||"").toLowerCase(),sf=f.qd||"",rows=K.issues.map(i=>({i,r:dqRec(i)})),open=rows.filter(x=>!x.r||x.r.status==="Open").length,
  l=rows.filter(({i,r})=>(!f.qs||i.severity===f.qs)&&(!q||(i.source+i.issue).toLowerCase().includes(q))&&(!sf||(sf==="open"?(!r||r.status==="Open"):(r&&r.status!=="Open"))));
 const ok=can("review"),act=(i,r)=>{const k=dqKey(i);if(!ok)return`<span class="muted" style="font-size:11.5px">${ROLE.name} cannot review</span>`;
  return(r&&r.status!=="Open")?`<button class="ghost" style="padding:3px 9px;font-size:12px" onclick="dqSet('${k}','Open')">Reopen</button>`:`<button class="ghost" style="padding:3px 9px;font-size:12px" onclick="dqSet('${k}','Resolved')">Mark resolved</button> <button class="ghost" style="padding:3px 9px;font-size:12px" onclick="dqSet('${k}','Accepted as is')">Accept as is</button>`};
 return `<h1>Data Quality</h1><p class="sub">${K.issues.length} inconsistencies and gaps found while building the knowledge base. ${open} still open. Resolve or accept each one before treating the knowledge as approved.</p>
  ${stats(["High","Medium","Low","Info"].map(s=>[cnt(K.issues,i=>i.severity===s),s+" severity"]))}<div class="row" style="margin:14px 0"><input id="qq" placeholder="Search issues" value="${esc(f.qq||"")}" oninput="st.f.qq=this.value;keep('qq')" style="flex:1">${filt("qs","",["High","Medium","Low","Info"],"All severities")}<select aria-label="Status" onchange="st.f.qd=this.value;render()"><option value="">All issues</option><option value="open" ${sf==="open"?"selected":""}>Open</option><option value="done" ${sf==="done"?"selected":""}>Resolved or accepted</option></select></div>
  ${tbl(["Source","Issue","Severity","Suggested action","Status",""],l.map(({i,r})=>[esc(i.source),esc(i.issue),tg(i.severity),esc(i.suggested_action),r&&r.status!=="Open"?`<span class="tag ok">${esc(r.status)}</span><div class="muted" style="font-size:11px">${esc(r.who||"")}, ${esc(String(r.u||r.t).slice(0,10))}${r.note?"<br>"+esc(r.note):""}</div>`:'<span class="tag warn">Open</span>',act(i,r)]))}`}
/* ---------- bell ---------- */
const NOTIF={open:false,timer:null};
const seenKey=()=>"akp_seen_"+ROLE.user;
function notifList(){const L=[],me=ROLE.user;let seen="";try{seen=localStorage.getItem(seenKey())||""}catch(e){}
 const wait=UKB.items.filter(x=>x.status==="In review"&&can("approve")&&x.author!==me);if(wait.length)L.push({k:"wait",t:wait.length+" item"+(wait.length>1?"s":"")+" waiting for your approval",d:wait.slice(0,3).map(x=>x.title).join("; "),go:"mywork",tone:"warn"});
 const rej=UKB.items.filter(x=>x.author===me&&x.status==="Rejected"&&String(x.updated)>seen);if(rej.length)L.push({k:"rej",t:rej.length+" of your items "+(rej.length>1?"were":"was")+" rejected",d:rej.map(x=>x.title).slice(0,3).join("; "),go:"mywork",tone:"bad",unseen:1});
 const oth=UKB.items.filter(x=>x.author!==me&&String(x.updated)>seen);if(oth.length)L.push({k:"oth",t:oth.length+" new or changed by others",d:oth.slice(0,3).map(x=>x.author+": "+x.title).join("; "),go:"ks",tone:"",unseen:1});
 const bad=(STORE.mem.fb||[]).filter(f=>f.kind!=="dq"&&f.status==="Open"&&(f.verdict==="Wrong"||f.verdict==="Incomplete"));if(bad.length&&can("remove"))L.push({k:"fb",t:bad.length+" answer"+(bad.length>1?"s":"")+" marked wrong or incomplete",d:bad.slice(0,2).map(f=>f.q).join("; "),go:"ks",tone:"warn",tab:"review"});
 try{const hi=pdmAll().filter(u=>u.level==="High"||u.risk>=PDM.thr);if(hi.length)L.push({k:"pdm",t:hi.length+" unit"+(hi.length>1?"s":"")+" above the forecast risk threshold",d:hi.slice(0,4).map(u=>S(u.n).tag).join(", "),go:"mnt",tone:"warn",view:"pdm"})}catch(e){}
 const dq=K.issues.filter(i=>i.severity==="High"&&(!dqRec(i)||dqRec(i).status==="Open")).length;if(dq&&can("review"))L.push({k:"dq",t:dq+" high severity data issue"+(dq>1?"s":"")+" still open",d:"Data Quality",go:"quality",tone:"warn"});
 return L}
function notifPaint(){const L=notifList(),n=document.getElementById("bellN");if(n){n.textContent=L.length?String(L.length):"";n.style.display=L.length?"":"none"}
 const box=document.getElementById("notifbox");if(box&&NOTIF.open)box.innerHTML=notifHtml(L)}
function notifHtml(L){return `<div class="row between" style="margin-bottom:6px"><b>Notifications</b><button class="ghost" style="padding:2px 8px;font-size:12px" onclick="notifToggle()">Close</button></div>${L.length?L.map((x,i)=>`<div class="nitem ${x.tone}" role="button" tabindex="0" onclick="notifGo(${i})"><b>${esc(x.t)}</b><div class="muted" style="font-size:12px">${esc(String(x.d||"").slice(0,110))}</div></div>`).join(""):'<p class="muted" style="margin:6px 0">Nothing needs your attention.</p>'}`}
function notifGo(i){const x=notifList()[i];if(!x)return;notifToggle();if(x.view){MHS.set=0;MHS.view=x.view}if(x.tab){KS.tab=x.tab}go(x.go)}
function notifToggle(){NOTIF.open=!NOTIF.open;let box=document.getElementById("notifbox");if(NOTIF.open){if(!box){box=document.createElement("div");box.id="notifbox";box.setAttribute("role","dialog");box.setAttribute("aria-label","Notifications");document.body.appendChild(box)}box.innerHTML=notifHtml(notifList());try{localStorage.setItem(seenKey(),nowIso())}catch(e){}setTimeout(notifPaint,50)}else if(box)box.remove()}
{const _al=authLine;authLine=function(){_al.apply(this,arguments);const l=document.getElementById("authline");if(!l||!AUTH.user)return;const b=document.createElement("button");b.className="gear";b.id="bell";b.setAttribute("aria-label","Notifications");b.title="Notifications";b.style.position="relative";b.onclick=notifToggle;b.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg><i id="bellN" style="display:none"></i>';const out=l.querySelector("button");l.insertBefore(b,out);setTimeout(notifPaint,300)}}
BUS.on("kb:changed",()=>setTimeout(notifPaint,200));BUS.on("audit",()=>setTimeout(notifPaint,200));setInterval(()=>{if(!document.hidden)notifPaint()},20000);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&NOTIF.open)notifToggle()});
if(typeof AUTH!=="undefined"&&AUTH.user)authLine();
