/* SPI equipment views (owner: Claude A): the plant overview and the spare parts panel of an equipment set. Used when window.SPI_MODE is true (case spi). */
regMod("spi_equip","1.0",["spi_core"],"Equipment spare parts views");
/* Professional display form of the upper case SAP style descriptions: "BEARING,THRUST PAD,DWG.563-7426,FOR KT-4" becomes "Bearing, thrust pad, DWG.563-7426, for KT-4" */
const spiDesc=s=>{if(!s)return"";return String(s).replace(/,\s*FOR\s*$/i,"").split(",").map(x=>x.trim()).filter(x=>x&&!/^FOR$/i.test(x)).map((x,i)=>{if(/^FOR\s+/.test(x))return "for "+x.slice(4);if(/\d/.test(x)||/^[A-Z]{1,4}-[A-Z0-9]/.test(x))return x;const l=x.toLowerCase();return i===0?l.charAt(0).toUpperCase()+l.slice(1):l}).join(", ")};
function spiPlantOverview(){
 const sets=K.sets.map(s=>`<tr class="click" onclick="go('equipment',{set:${s.n},tab:'overview'})"><td><b>${esc(s.tag)}</b></td><td>${esc(s.name)}</td><td>${esc(s.type||"")}</td><td>${spiCritBadge(s.crit==="HIGH CRITICAL"?"S":"A")}</td></tr>`).join("");
 return `${ph("Plant overview",`${K.sets.length} equipment sets selected from the baseline data by criticality and parts list size. The layout is a schematic generated from the data.`)}${p3Hero()}
 <div class="card" style="margin-top:14px"><h3>Equipment sets</h3><p class="muted" style="margin-bottom:6px">Select a row to open the equipment set with its spare parts, schematic drawings and maintenance notifications.</p><table><tr><th>Tag</th><th>Description</th><th>Class</th><th>Criticality</th></tr>${sets}</table></div>
 <p class="spi-note">Spare part forecasts, stock health and recommendations are on the pages under Spare parts in the menu.</p>`}
function spiEquipPanel(n){const s=S(n),id="speq"+n;
 setTimeout(async()=>{const h=document.getElementById(id);if(!h)return;
  try{const d=await spiApi("/api/data/equipment/"+encodeURIComponent(s.tag)),P=d.parts||[],zero=P.filter(p=>p.stock===0&&p.max_qty>0).length,below=P.filter(p=>p.min_qty>0&&p.stock<p.min_qty).length,used=P.filter(p=>p.total_qty>0).length;
   const row=r=>`onclick="spiGo('spi_forecast',{mat:${r.material_no}})"`;
   h.innerHTML=`<div class="spi-grid4">${spiKpi(spiNum(P.length),"Spare parts in the bill of materials",null,P.length>=300?"first 300 shown":"")}${spiKpi(spiNum(used),"Parts issued in the history period")}${spiKpi(spiNum(below),"Parts below Min","warn")}${spiKpi(spiNum(zero),"Parts at zero stock with a Max set","bad")}</div>
   ${spiCard("Spare parts of "+s.tag,spiTable(P.slice(0,60),[{h:"Material",k:"material_no"},{h:"Description",f:r=>esc(spiDesc(r.descr))},{h:"Installed",f:r=>spiNum(r.installed_qty),num:1},{h:"Demand pattern",f:r=>esc((r.demand_class||"").replace("_"," "))},{h:"Issued",f:r=>spiNum(r.total_qty),num:1},{h:"Stock",f:r=>spiNum(r.stock),num:1},{h:"Min",f:r=>spiNum(r.min_qty),num:1},{h:"Max",f:r=>spiNum(r.max_qty),num:1},{h:"Lead time (d)",f:r=>r.lt_median==null?"Not in baseline data":spiNum(r.lt_median),num:1}],{row}),"Sorted by quantity issued. Select a part to open its forecast.")}
   <div class="spi-grid2">${spiCard("Recent maintenance notifications",spiTable(d.notifications,[{h:"Date",k:"notif_date"},{h:"Type",k:"type"},{h:"Priority",k:"priority"},{h:"Status",k:"status"},{h:"Description",f:r=>esc(spiDesc(r.descr))}],{empty:"No notifications recorded for this location in the baseline data."}))}
   ${spiCard("Planned maintenance",spiTable(d.planned_maintenance,[{h:"Next due (estimate)",k:"next_due"},{h:"Task",k:"descr"},{h:"Cycle",k:"cycle_text"}],{empty:"No planned maintenance items for this location in the baseline data."}),"Next due is calculated from the cycle start and cycle length: an estimate, not a scheduled date.")}</div>`}
  catch(e){const h=document.getElementById(id);if(h)h.innerHTML=`<div class="spi-err"><b>Spare part data could not load.</b><p>${esc(e.message)}</p></div>`}},0);
 return `<div id="${id}" class="spi-page" style="margin-top:14px"><p class="spi-sub">Loading spare parts</p></div>`}

/* Case data tidy-up: the generic engine adds interlock documents and "issued" statuses for every set. This case has no such records, so they are removed rather than shown. */
if(window.SPI_MODE){KB.docs=KB.docs.filter(d=>d.type!=="Interlock Logic");KB.chunks=KB.chunks.filter(c=>!/^IL-/.test(c.doc));KB.docs.forEach(d=>{d.status="Generated from baseline data";d.rev="-";d.date="-";d.src="Generated from the baseline data set"})}
/* Professional display form of a location description ("TURBINE FOR KC-383A" becomes "Turbine for KC-383A"): words with digits or tag patterns stay as they are. */
const spiName=s=>{if(!s)return"";return String(s).trim().split(/\s+/).map((w,i)=>/\d/.test(w)||/^[A-Z]{1,4}-[A-Z0-9]/.test(w)||/^(TLE|KO|LP|MP|HP|DCS|API|ASME|FCC)$/.test(w)?w:(i===0?w.charAt(0)+w.slice(1).toLowerCase():w.toLowerCase())).join(" ")};
const spiStatus=r=>r.mrp_type==="Non Stock"&&r.stock>0?spiBadge("Non Stock, holds stock","warn"):r.stock===0&&r.max_qty>0?spiBadge("Zero stock","bad"):(r.min_qty>0&&r.stock<r.min_qty)?spiBadge("Below Min","warn"):(r.max_qty>0&&r.stock>r.max_qty)?spiBadge("Above Max","n"):r.stock===0?spiBadge("No stock","n"):spiBadge("In range","ok");
/* Last-line clean-up of old plant case controls that the generic engine renders on drawing pages (simulated live data, trip and interlock shortcuts, lesson links).
   Runs after each render in this case only; the drawings themselves are Claude B's, the generic P&ID is replaced per class when time allows. */
function spiPrune(){const hide=e=>{if(e)e.style.display="none"},short=e=>(e.textContent||"").trim();
 document.querySelectorAll("#app .pbar").forEach(e=>{if(/simulated|all items healthy/i.test(short(e)))hide(e)});
 document.querySelectorAll("#app .tag").forEach(e=>{if(/simulated live data/i.test(short(e)))hide(e)});
 document.querySelectorAll("#app button, #app .chip, #app .btn, #app label").forEach(e=>{const t=short(e);if(t.length<90&&(/^Values$/.test(t)||/interlock|\bOPLs?\b|lessons?|start-?up|simulate trip|live condition|\btrips?\b/i.test(t)))hide(e)});
 document.querySelectorAll("#app p, #app .muted").forEach(e=>{if(e.children.length<4&&/simulate trip|interlock effects|live condition/i.test(short(e))){e.textContent="Select a part on the drawing for its stock, Min, Max and forecast."}});
 document.querySelectorAll("#app svg text").forEach(e=>{const t=short(e);if(/^Health\s*(NaN|\d)|^RUNNING$|^TRIPPED$|^ALARM$/.test(t)){const g=e.closest("g");hide(g||e)}})}
if(window.SPI_MODE){const _rP=render;render=function(){const r=_rP.apply(this,arguments);setTimeout(spiPrune,60);setTimeout(spiPrune,500);setTimeout(spiPrune,1500);return r}}

/* The plot plan and hazard pages belong to the previous plant case and are removed: links go to the plant overview, plot plan documents are not listed. */
if(window.SPI_MODE){const _goP=go;go=function(p,x){if(p==="plot"||p==="hazard")p="dashboard";return _goP.call(this,p,x)};
 const rmPlot=new Set(KB.docs.filter(d=>d.type==="Plot Plan").map(d=>d.id));KB.docs=KB.docs.filter(d=>!rmPlot.has(d.id));KB.chunks=KB.chunks.filter(c=>!rmPlot.has(c.doc))}
