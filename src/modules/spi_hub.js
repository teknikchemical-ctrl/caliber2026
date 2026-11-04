/* SPI hubs (owner: Claude A). The site has five tabs: Overview, Inventory, Maintenance, Forecasting and Simulation, Costs. Every other page is a view inside one of them.
   A hub shows a strip of its views and draws the chosen one; spiGo('<any page id>') still works: it opens the hub that holds the page and selects the view. */
regMod("spi_hub","1.0",["spi_core","spi_viz"],"Hubs");
const SPI_HUBS=[
 {id:"spi_h_ov",label:"Overview",tabs:[["spi_space","Equipment library 3D"],["spi_dash","Summary"],["spi_ready","Campaign readiness"],["spi_val","Method and validation"],["spi_arch","Data and architecture"]]},
 {id:"spi_h_inv",label:"Inventory",tabs:[["spi_find","Find"],["spi_health","Stock health"],["spi_loc","Locations and equipment"],["spi_parts","Parts"],["spi_reg","Registers"],["spi_ingest","Documents and log"]]},
 {id:"spi_h_mnt",label:"Maintenance",tabs:[["spi_maint","Maintenance board"],["spi_eq","Equipment 3D and drawings"],["spi_prot","Protective devices"]]},
 {id:"spi_h_fc",label:"Forecasting and Simulation",tabs:[["spi_fo","Forecasting and optimisation"],["spi_forecast","Part forecast"],["spi_sim","Scenario simulator"],["spi_ask","Ask the AI"]]},
 {id:"spi_h_cost",label:"Costs",tabs:[["spi_savings","Cost reduction"],["spi_impact","Business impact"]]}];
const SPIHUB={tab:{}};
function spiHubTab(hub,id){SPIHUB.tab[hub]=id;st.page=hub;render()}
const SPI_MOVED={spi_reco:"spi_h_fc",spi_opt:"spi_h_fc",spi_outlook:"spi_h_fc"};/* removed views: links to them open the Forecasting and Simulation hub */
function spiHubFor(p){return SPI_HUBS.find(h=>h.tabs.some(t=>t[0]===p))||SPI_HUBS.find(h=>h.id===SPI_MOVED[p])}
SPI_HUBS.forEach(h=>spiRegister(h.id,h.label,async host=>{
 const avail=h.tabs.filter(t=>SPI.pages[t[0]]),cur=avail.find(t=>t[0]===SPIHUB.tab[h.id])||avail[0];
 document.querySelectorAll("aside .nav").forEach(n=>n.classList.toggle("active",n.dataset.page===h.id));
 host.innerHTML=`<div class="spi-hubtabs" role="tablist">${avail.map(t=>`<button role="tab" class="${t[0]===cur[0]?"on":""}" onclick="spiHubTab('${h.id}','${t[0]}')">${esc(t[1])}</button>`).join("")}</div><div class="spi-hubbody" id="spihb"><p class="spi-sub">Loading</p></div>`;
 const sub=document.getElementById("spihb");try{await SPI.pages[cur[0]].fn(sub)}catch(e){if(document.getElementById("spihb"))sub.innerHTML=`<div class="spi-err"><b>This view could not load.</b><p>${esc(e.message)}</p><button class="btn" onclick="render()">Try again</button></div>`}}));
/* tables stay hidden until the reader searches: spiTable wraps tables of more than 5 rows in a search box (see spi_core) */
function spiTs(el){const w=el.closest(".spi-ts"),b=w.querySelector(".spi-tsb"),h=w.querySelector(".spi-tsh"),q=el.value.trim().toLowerCase(),rows=b.querySelectorAll("tbody tr");if(q.length<2){b.hidden=true;h.textContent="The table stays hidden until you search.";return}let n=0;rows.forEach(r=>{const m=r.textContent.toLowerCase().includes(q);r.hidden=!m;if(m)n++});b.hidden=n===0;h.textContent=n?n+" of "+rows.length+" rows match":"No rows match."}
