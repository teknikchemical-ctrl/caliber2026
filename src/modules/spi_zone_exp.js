/* SPI equipment explorer (owner: Claude B). One workspace, no page jumps:
   Plant (3D world of blocks)  >  Block (one designed class, its sets and every functional location)  >  Equipment (3D with stock colours, opened in place)  >  Zone (parts of that zone)  >  Part (3D, stock, history, where used).
   A trail at the top shows where you are and every step is a button that goes back. Detail always opens in the panel at the right; the stage on the left swaps between the world and the equipment.
   A part opened from search or from "where used" lands in the same panel. Everything shown comes from the baseline data; positions in the world are schematic. */
regMod("spi_zone_exp","1.0",["spi_core","spi_draw_space","spi_draw_parts","spi_overlay"],"Equipment explorer");
const EXP={eq:false,key:null,loc:null,zone:null,part:null,items:[],h:600,busy:0};
spiRegister("spi_space","Equipment explorer",async host=>{
 const h=EXP.h=Math.max(520,(window.innerHeight||800)-250);
 spiSpTemplates();host.classList.add("sp-wrap","ex-wrap");P3.labs=null;Object.assign(EXP,{eq:false,key:null,loc:null,zone:null,part:null,items:[]});P3.sel=0;P3.focus=0;P3.pipe=null;SPSP.focus=null;SPIINS.pane="spi_ipane";
 host.innerHTML=`<div id="ex_root"><div class="ex-trail" id="ex_trail" aria-label="Where you are"></div>
 <div class="sp-top"><div class="sp-search"><input id="sp_q" type="search" autocomplete="off" placeholder="Search a tag, part or location, e.g. PP-148A, bearing, relief valve" aria-label="Search the equipment explorer" oninput="spiSpType(this.value)" onkeydown="if(event.key==='Enter')spiSpEnter();if(event.key==='Escape')spiSpClear()"><div id="sp_res" class="sp-res" hidden></div></div>
 <div class="sp-count"><b>${p3Units().length}</b> blocks, one per designed class (${K.sets.length} equipment sets in ${p3Units().length-P3.tpl.length} blocks, ${P3.tpl.length} class templates). Select a block, then an equipment, then a part.</div></div>
 <div class="ex-lay"><div class="ex-stage" id="ex_stage"><div id="ex_world">${p3Hero({embed:true,h,fn:()=>"ok",lab:n=>esc(spiSpSub(n))})}</div><div id="ex_equip" hidden></div></div><div class="ex-side" id="ex_side" style="max-height:${h}px"></div></div></div>`;
 {const q=(c,k)=>{const e=host.querySelector(c);if(e)e.classList.add(k)};q(".p3head","sp-ph");q(".p3tools","sp-pt");q(".p3key","sp-pk");const wb=host.querySelector(".sp-pt button");if(wb)wb.textContent="All blocks"}
 P3.orbit=true;spiSpDecorate();spiSpFacets();spiSpFlows();exSide();exTrail();{const t=host.querySelector(".sp-pt");if(t&&!t.querySelector(".sp-flt")){const l=document.createElement("label");l.className="sp-flt";l.innerHTML=`<input type="checkbox" ${SPSP.showFlows!==false?"checked":""} onchange="SPSP.showFlows=this.checked"> Process connections`;t.insertBefore(l,t.querySelector("button"))}}
 if(st.focus){const q=String(st.focus);st.focus=null;const i=document.getElementById("sp_q");if(i){i.value=q;spiSpType(q)}}
 if(st.funcloc){const f=st.funcloc,m=st.fmat;st.funcloc=null;st.fmat=null;exOpenFunc(f,m)}
});
/* the block card is not drawn over the 3D any more: it is the panel at the right */
{const _p=p3Panel;p3Panel=function(){_p();const c=document.getElementById("p3card");if(c&&document.getElementById("ex_root"))c.style.display="none";if(document.getElementById("ex_root")){if(!EXP.eq&&!EXP.part)exSide();exTrail()}}}
/* ---------- trail ---------- */
function exTrail(){const T=document.getElementById("ex_trail");if(!T)return;const c=[],blk=P3.sel,u=blk?spiSpU(blk):null;
 c.push(["Plant",blk||EXP.eq||EXP.part?"plant":""]);
 if(blk)c.push([spiSpBlock(blk),EXP.eq||EXP.part?"block":""]);
 if(EXP.eq&&EXP.loc)c.push([EXP.loc.tag,EXP.zone||EXP.part?"equip":""]);
 const z=exZoneObj();if(EXP.eq&&z)c.push([z.label,EXP.part?"zone":""]);
 if(EXP.part&&EXP.items[EXP.part.i])c.push([spiDesc(EXP.items[EXP.part.i].descr),""]);
 T.innerHTML=c.map((x,i)=>(i?'<i class="ex-sep" aria-hidden="true">&rsaquo;</i>':"")+(x[1]?`<button class="ex-cr" onclick="exTo('${x[1]}')">${esc(x[0])}</button>`:`<b class="ex-cr on">${esc(x[0])}</b>`)).join("")+(c.length>1?`<button class="ghost ex-back" onclick="exBack()">Back one step</button>`:"")}
function exBack(){if(EXP.part)return exTo(EXP.zone?"zone":EXP.eq?"equip":"block");if(EXP.zone)return exTo("equip");if(EXP.eq)return exTo("block");if(P3.sel)return exTo("plant")}
function exTo(w){
 if(w==="plant"){EXP.eq=false;EXP.part=null;EXP.zone=null;exStage("world");SPSP.focus=null;p3Reset();}
 else if(w==="block"){EXP.eq=false;EXP.part=null;EXP.zone=null;exStage("world")}
 else if(w==="equip"){EXP.part=null;EXP.zone=null;exRedraw()}
 else if(w==="zone"){EXP.part=null}
 exSide();exTrail()}
function exStage(w){const W=document.getElementById("ex_world"),E=document.getElementById("ex_equip");if(!W||!E)return;const eq=w==="equip";W.hidden=eq;E.hidden=!eq;(eq?E:W).classList.remove("ex-in");void (eq?E:W).offsetWidth;(eq?E:W).classList.add("ex-in")}
function exRedraw(){if(typeof G3!=="undefined")Object.values(G3.inst).forEach(I=>{I.dirty=true})}
/* ---------- open an equipment in place ---------- */
async function exOpenFunc(funcloc,mat){if(!document.getElementById("ex_root")){spiGo("spi_space",{funcloc});return}
 const S0=document.getElementById("ex_side");if(S0&&!EXP.eq)S0.innerHTML='<p class="muted spi-sub" style="padding:14px">Opening the equipment</p>';
 try{const a=await spiApi("/api/data/location?funcloc="+encodeURIComponent(funcloc)),e=a.equipment||{},cls=(typeof spiSubCls==="function"&&spiSubCls((e.eq_class||"").toUpperCase(),e.descr))||spiClsOf((e.eq_class||"").toUpperCase());
  if(!cls||!SPI_BUILD[cls]){EXP.eq=false;if(S0)S0.innerHTML=`<div class="ex-pad"><h3>${esc(e.tag||funcloc)}</h3><p class="muted">${esc(e.descr||"")}. This location is a ${esc(e.eq_class_name||"process node")} and has no 3D template. Its parts and maintenance are on the Locations page.</p><button class="ghost" onclick="spiGo('spi_loc',{loc:'${esc(funcloc).replace(/'/g,"")}'})">Open in Locations</button></div>`;return}
  const key=spiLocRegister({cls,funcloc:e.funcloc,tag:e.tag,parts:a.parts});spiStockFromParts(key,a.parts);
  Object.assign(EXP,{eq:true,key,zone:null,part:null,items:[],loc:{funcloc:e.funcloc,tag:e.tag||e.funcloc,descr:e.descr||"",crit:e.criticality,cname:e.eq_class_name||"",parts:a.parts||[],notif:a.notifications||[],pm:a.planned_maintenance||[]}});
  const bn=spiSpSetOfLoc(e);if(bn){const r=spiSpRep(bn);P3.sel=r;P3.focus=r;if(P3.alts&&P3.alts[r])SPSP.act[r]=P3.alts[r].indexOf(bn)>=0?bn:SPSP.act[r]}
  const id="g3_"+(++G3.seq);G3.cfg[id]={n:key,title:e.tag,sel:()=>EXP.zone,click:k=>exZonePick(k),tint:spiStockTint(key)};
  document.getElementById("ex_equip").innerHTML=`<div class="g3box ex-g3" id="${id}"></div>`;exStage("equip");spiStockPaint(key);
  exSide();exTrail();if(mat)exFocusPart(mat)}
 catch(err){if(S0)S0.innerHTML=`<div class="ex-pad"><p class="muted">The equipment could not be loaded: ${esc(err.message)}</p></div>`}}
function exOpenSet(n){const s=S(n);exOpenFunc("PX_"+s.tag)}
function exZoneObj(){if(!EXP.eq||!EXP.key||EXP.zone==null)return null;const P=spiPrep(EXP.key);return P&&P.zones.find(q=>q.key===EXP.zone)||null}
function exZonePick(k){if(k==null||String(k).charAt(0)==="@")return;EXP.zone=EXP.zone===k?null:k;EXP.part=null;exRedraw();exSide();exTrail()}
function exItems(z){const key=EXP.key,D=SPIST.d[key];if(!z)return[];return z.lines.map(l=>{const b=GA[key].bom[l-1],d=D&&D.lines&&D.lines[l],mm=/Material\s+(\d{5,})/.exec(b.mat||"");return{descr:b.name,mat:mm?+mm[1]:(d&&d.mat)||null,stat:d?d.stat:null,stock:d&&d.part?d.part.stock:null,min:d&&d.part?d.part.min_qty:null,max:d&&d.part?d.part.max_qty:null}})}
function exFocusPart(mat){const key=EXP.key;if(!key)return;const bom=GA[key].bom||[],i=bom.findIndex(b=>b.mat==="Material "+mat);if(i<0)return;const P=spiPrep(key),z=P.line2zone[i+1];if(!z||!z.key)return;EXP.zone=z.key;EXP.items=exItems(z);const j=EXP.items.findIndex(x=>x.mat===mat);exRedraw();if(j>=0)exPartPick(j);else{exSide();exTrail()}}
function exPartPick(i){const it=EXP.items[i];if(!it)return;EXP.part={i};SPIINS.items=EXP.items;SPIINS.pane="ex_part";exSide();exTrail();spiInspectShow(i)}
/* a part opened without an equipment (search, library, family): same panel */
function exOpenPart(descr,mat){EXP.items=[{descr,mat:mat||null}];EXP.part={i:0};SPIINS.items=EXP.items;SPIINS.pane="ex_part";exSide();exTrail();spiInspectShow(0)}
/* ---------- the panel at the right ---------- */
function exSide(){const S0=document.getElementById("ex_side");if(!S0)return;
 if(EXP.part){S0.innerHTML=`${EXP.eq?exHead():""}<div class="ex-pad"><div id="ex_part" class="spi-inp"></div></div>`;SPIINS.pane="ex_part";spiInspectShow(EXP.part.i);return}
 if(EXP.eq){S0.innerHTML=exHead()+`<div class="ex-pad" id="ex_eco"></div>`+exZones();exEco();if(EXP.loc&&typeof spiLinkInto==="function")spiLinkInto("ex_lk",{loc:EXP.loc.funcloc,max:12,peers:6},{w:420,h:360,rings:false});return}
 const n=P3.sel;S0.innerHTML=n?`<div class="ex-pad">${spiSpCard(n)}</div>`:exBlocks()}
function exHead(){const l=EXP.loc;if(!l)return"";const D=SPIST.d[EXP.key],c={red:0,amber:0,grey:0,green:0,none:0};if(D&&D.lines)Object.values(D.lines).forEach(x=>c[x.stat]++);
 return `<div class="ex-eh"><div class="row between"><div><span class="tag acc">${esc(l.tag)}</span> ${l.crit?spiCritBadge(l.crit):""}</div><button class="ghost" onclick="spiGo('spi_eq',{funcloc:'${esc(l.funcloc).replace(/'/g,"")}'})" title="Sheet, notifications and planned maintenance of this equipment">Full page</button></div><h3>${esc(spiName(l.descr))}</h3><div class="muted" style="font-size:12px">${esc(l.cname)} | ${spiNum(l.parts.length)} spare parts</div>
 ${D&&D.lines?`<div class="sp-cs">${["red","amber","green","grey","none"].filter(k=>c[k]).map(k=>spiChip(k,c[k]+" "+SPI_SC[k].n.toLowerCase())).join(" ")}</div>`:""}</div>`}
function exZones(){return exZones0()+`<div class="ex-pad"><div class="ex-zh"><b>Link map</b><span class="muted">Parts of this equipment and the other equipment that share them</span></div><div id="ex_lk" class="lk-box"></div></div>`}
function exZones0(){const P=spiPrep(EXP.key),D=SPIST.d[EXP.key];
 if(EXP.zone!=null){const z=P.zones.find(q=>q.key===EXP.zone);if(z){EXP.items=exItems(z);return `<div class="ex-pad"><div class="ex-zh"><b>${esc(z.label)}</b><span class="muted">${EXP.items.length} part${EXP.items.length===1?"":"s"} | ${esc(z.ref||"")}</span></div><input class="sp-lf" placeholder="Filter these parts" oninput="exFilter(this.value)" aria-label="Filter these parts"><div class="ex-pl" id="ex_pl">${exPartRows("")}</div></div>`}}
 const zs=P.zones.filter(z=>z.lines&&z.lines.length);
 if(!zs.length){EXP.items=(EXP.loc.parts||[]).map(p=>({descr:p.descr,mat:p.material_no,stat:spiStat(p),stock:p.stock,min:p.min_qty,max:p.max_qty}));return `<div class="ex-pad"><div class="ex-zh"><b>Parts</b><span class="muted">${EXP.items.length}</span></div><div class="ex-pl" id="ex_pl">${exPartRows("")}</div></div>`}
 return `<div class="ex-pad"><div class="ex-zh"><b>Zones of this equipment</b><span class="muted">Select a zone here or on the 3D model</span></div><div class="ex-zl">${zs.map(z=>{const q=D&&D.zones&&D.zones[z.id],w=q?q.worst:"none";return `<button class="ex-z" onclick="exZonePick('${z.key}')"><span class="spi-st ${w}"><i></i></span><span class="nm">${esc(z.label)}</span><span class="muted">${z.lines.length}</span></button>`}).join("")}</div></div>`}
function exPartRows(q){q=(q||"").toLowerCase();const rows=EXP.items.map((it,i)=>({it,i})).filter(x=>!q||x.it.descr.toLowerCase().indexOf(q)>=0||String(x.it.mat||"").indexOf(q)>=0);
 return rows.map(({it,i})=>`<button class="ex-pr" onclick="exPartPick(${i})"><span class="spi-st ${it.stat||"none"}"><i></i></span><span class="nm">${esc(spiDesc(it.descr))}</span><span class="muted num">${it.stock!=null?spiNum(it.stock):""}</span></button>`).join("")||'<div class="muted spi-sub">No part matches.</div>'}
function exFilter(v){const L=document.getElementById("ex_pl");if(L)L.innerHTML=exPartRows(v)}
/* nothing selected: every block, grouped by district */
function exBlocks(){return `<div class="ex-pad"><div class="ex-zh"><b>Blocks</b><span class="muted">${p3Units().length} in ${SPCAT.length} districts</span></div>${SPCAT.map(k=>{const us=p3Units().filter(u=>(P3.cat[u.n]||SPCAT[5])===k);return us.length?`<div class="sp-ng" style="padding-left:0"><span class="sp-nd" style="background:${k.c}"></span>${esc(k.n)}</div>`+us.map(u=>{const c=spiSpCount(u),sub=u.tpl?"Template":spiSpSub(u.n);return `<button class="sp-ni" data-n="${u.n}" style="--pc:${k.c}" onclick="spiSpGo('${u.n}')"><b>${esc(spiSpBlock(u.n))}</b><span>${esc(sub)}${c!=null?(sub?" | ":"")+spiNum(c)+" locations":""}</span></button>`}).join(""):""}).join("")}</div>`}
/* part opens in place while the explorer is on screen */
{const _po=spiPartOpen;spiPartOpen=function(d,m){if(document.getElementById("ex_root"))return exOpenPart(d,m);return _po(d,m)}}
/* hub tabs: the explorer first, the stock view first in Inventory */
if(typeof SPI_HUBS!=="undefined"){const ov=SPI_HUBS.find(h=>h.id==="spi_h_ov"),iv=SPI_HUBS.find(h=>h.id==="spi_h_inv");
 if(ov)ov.tabs=[["spi_space","Equipment explorer"],["spi_dash","Summary"]];
 if(iv)iv.tabs=[["spi_iplan","Inventory planner"],["spi_inv","Stock"],["spi_sup","Suppliers and lead time"],["spi_link","Link map"],["spi_find","Find"],["spi_loc","Locations and equipment"],["spi_parts","Part types"],["spi_reg","Registers"],["spi_ingest","Documents and log"]]}
/* economics of the equipment opened: stock, orders due, cost per year today and with the recommended Min and Max, and the four impacts */
async function exEco(){const E=document.getElementById("ex_eco");if(!E||!EXP.loc)return;const fl=EXP.loc.funcloc;if(EXP.eco&&EXP.eco.fl===fl){exEcoDraw();return}E.innerHTML='<div class="ws-wait">Calculating the economics</div>';
 try{const r=await spiApi("/api/ws/advice?"+wsQS({loc:fl,horizon:12,service:SPA.service,assumptions:{carrying_rate:SPA.carrying_rate,order_cost_idr:SPA.order_cost_idr,emergency_premium:SPA.emergency_premium,lead_default:SPA.lead_default,downtime_idr_h:SPA.downtime_idr_h,hours_per_stockout:SPA.hours_per_stockout,downtime_share:SPA.downtime_share}}));EXP.eco={fl,d:r.outputs};
  spiWsSet("explorer_economics",{title:"Economics of "+(EXP.loc.tag||fl),inputs:r.inputs,figures:r.figures,outputs:{totals:r.outputs.totals},sources:r.sources});exEcoDraw()}catch(e){E.innerHTML=`<p class="muted">${wsE(e.message)}</p>`}}
function exEcoDraw(){const E=document.getElementById("ex_eco");if(!E||!EXP.eco)return;const t=EXP.eco.d.totals,I=t.impact,pc=(a,b)=>{if(!(a>0))return b>0?"new":"0%";const v=Math.round((a-b)/a*100);return v>=0?"-"+v+"%":"+"+(-v)+"%"},k=(l,v,s,tone)=>`<div class="ip-risk ${tone||""}"><b>${v}</b><span>${wsE(l)}</span>${s?`<small>${s}</small>`:""}</div>`;
 E.innerHTML=`<div class="ex-zh"><b>Economics of the spare parts</b><span class="muted">12 months, Estimate</span></div><div class="ip-risks ex-eco">${k("Stock value",spiMoney(t.stock_value),wsN(t.parts)+" parts")}${k("Parts to order now",wsN(t.order_now),wsN(t.order_by)+" later | "+spiMoney(t.order_value),t.order_now?"bad":"ok")}${k("Cost reduction per year",t.saving_per_year>0?spiMoney(t.saving_per_year):"None","with the recommended Min and Max",t.saving_per_year>0?"ok":"")}
 ${k("Emergency orders per year",wsN(I.current.emergency_orders,1)+" to "+wsN(I.recommended.emergency_orders,1),pc(I.current.emergency_orders,I.recommended.emergency_orders))}${k("Downtime hours per year",wsN(I.current.downtime_hours,0)+" to "+wsN(I.recommended.downtime_hours,0),pc(I.current.downtime_hours,I.recommended.downtime_hours)+" | "+(I.current.downtime_cost>=I.recommended.downtime_cost?spiMoney(I.current.downtime_cost-I.recommended.downtime_cost)+" avoided":spiMoney(I.recommended.downtime_cost-I.current.downtime_cost)+" more"))}${k("Working capital",spiMoney(I.current.working_capital)+" to "+spiMoney(I.recommended.working_capital),"average stock value")}</div>
 <div class="ws-tools" style="margin-top:8px"><button class="ghost ws-sm" onclick="IP.mode='set';IP.loc='${wsE(EXP.loc.funcloc).replace(/'/g,"")}';IP.set='';spiGo('spi_iplan')">Plan every part of this equipment</button><button class="ghost ws-sm" onclick="spiGo('spi_link',{lk:'loc',lkv:'${wsE(EXP.loc.funcloc).replace(/'/g,"")}'})">Full link map</button></div>`}
