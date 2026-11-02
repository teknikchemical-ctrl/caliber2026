/* =====================================================================================================
   GUIDED TOUR AND HELP
   A short, non-blocking tour of the main areas. It starts once for a new visitor and can be reopened from the help button
   in the sidebar footer or from Settings. Automation (navigator.webdriver) never sees it start by itself.
   ===================================================================================================== */
regMod("help","1.0",[],"Guided tour");
const TOUR=[
 {page:"dashboard",sel:'.nav[data-page="dashboard"]',t:"Plant overview",x:"All "+NW(K.sets.length)+" P&IDs are laid out as on the plot plan and linked by their process lines. Pick a tile to see its state or open its P&ID, or simulate a trip and watch it spread through the plant."},
 {page:"equipment",sel:'.nav[data-page="equipment"]',t:"Equipment sets",x:"P&ID, GA drawing, datasheet, interlock logic, OPLs and maintenance history for each equipment set, in one place."},
 {page:"mnt",sel:'.nav[data-page="mnt"]',t:"Maintenance",x:"Work order history, timeline, forecasts and plant replay. Each forecast shows how much data is behind it."},
 {page:"scn",sel:'.nav[data-page="scn"]',t:"Scenarios",x:"Replay an OPL case or a work order on the P&ID, or trip a unit and follow the knock-on effects. The assumptions register lists every rule used."},
 {page:"ai",sel:'.nav[data-page="ai"]',t:"AI Assistant",x:"Ask about procedures, interlocks, locations, spare parts or maintenance history. Each answer lists sources, a confidence level and a check of its numbers against the records."},
 {page:"ks",sel:'.nav[data-page="ks"]',t:"Knowledge Studio",x:"Add documents, lessons and know-how with the wizard. New items need review and approval before the assistant treats them as trusted."},
 {sel:".foot .gear[aria-label=Settings]",t:"Settings",x:"Settings: shared database status, access codes, AI options, answer language and diagnostics."}];
/* the scripted walkthrough for a demonstration: one story, in order, each step opens the right page */
const DEMO=[
 {page:"dashboard",sel:'.nav[data-page="dashboard"]',t:"The plant at a glance",x:NW(K.sets.length).replace(/^./,c=>c.toUpperCase())+" equipment sets on one plot plan, joined by their process lines. Open any tile for its P&ID and state."},
 {page:"ai",sel:'.nav[data-page="ai"]',t:"Ask a question",x:"Ask: What is the start permissive for the recycle gas compressor KC-4501? The answer lists numbered sources with revision and approval status, a confidence level and a check of every number."},
 {page:"scn",sel:'.nav[data-page="scn"]',t:"Follow a failure through the plant",x:"Pick a unit, trip it, and watch the effect move along the process lines. Each rule used is listed in the assumptions register."},
 {page:"mnt",sel:'.nav[data-page="mnt"]',t:"Maintenance history and forecast",x:"Work orders by period, root causes, and which units are most likely to fail next, with the amount of data behind each forecast."},
 {page:"ks",sel:'.nav[data-page="ks"]',t:"Add what people know",x:"A new lesson or document goes in as a draft, is checked for gaps, and waits for review. Only an approved item is treated as trusted."},
 {page:"mywork",sel:'.nav[data-page="mywork"]',t:"Each person sees their own work",x:"Items waiting for approval, your own drafts and what changed since you last looked. What you can do depends on your role."},
 {page:"perf",sel:'.nav[data-page="perf"]',t:"Key indicators",x:"Availability, MTBF, repair time, cost, forecast risk and knowledge status for each equipment set and for the whole plant, against targets."},
 {page:"rc",sel:'.nav[data-page="rc"]',t:"Reports for sign-off",x:"Equipment dossiers, reliability and forecast reports, incident packs and a solution brief, all printable or exported to Word."}];
const TOURS={i:-1,demo:false};
const TL=()=>TOURS.demo?DEMO:TOUR;
function tourStart(demo){try{setClose()}catch(e){}TOURS.demo=!!demo;TOURS.i=0;tourShow()}
function demoStart(){tourStart(true)}
function tourEnd(){TOURS.i=-1;document.getElementById("tourcard")?.remove();document.querySelectorAll(".tour-hl").forEach(e=>e.classList.remove("tour-hl"));try{localStorage.setItem("akp_tour_done","1")}catch(e){}}
function tourShow(){const s=TL()[TOURS.i];if(!s){tourEnd();return}document.querySelectorAll(".tour-hl").forEach(e=>e.classList.remove("tour-hl"));if(s.page&&typeof go==="function")go(s.page);
 const el=document.querySelector(s.sel);if(el)el.classList.add("tour-hl");let c=document.getElementById("tourcard");if(!c){c=document.createElement("div");c.id="tourcard";c.setAttribute("role","dialog");c.setAttribute("aria-label","Guided tour");document.body.appendChild(c)}
 c.innerHTML=`<div class="muted" style="font-size:11.5px">Step ${TOURS.i+1} of ${TL().length}</div><h4 style="margin:4px 0 6px">${esc(s.t)}</h4><p style="margin:0 0 10px;font-size:13px;line-height:1.5">${esc(s.x)}</p><div class="row between"><button class="ghost" onclick="tourEnd()">Skip tour</button><span class="row" style="gap:6px">${TOURS.i?`<button class="ghost" onclick="TOURS.i--;tourShow()">Back</button>`:""}<button onclick="${TOURS.i===TOUR.length-1?"tourEnd()":"TOURS.i++;tourShow()"}">${TOURS.i===TOUR.length-1?"Finish":"Next"}</button></span></div>`}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&TOURS.i>=0)tourEnd()});
setTimeout(()=>{let done=false;try{done=localStorage.getItem("akp_tour_done")==="1"}catch(e){}if(!done&&!navigator.webdriver&&typeof AUTH!=="undefined"&&AUTH.user&&document.getElementById("app")&&!/[?&]notour/.test(location.search))tourStart()},1800);
