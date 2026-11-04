/* SPI hubs (owner: Claude A). The site has five tabs: Overview, Inventory, Maintenance, Forecasting and Simulation, Costs. Every other page is a view inside one of them.
   A hub shows a strip of its views and draws the chosen one; spiGo('<any page id>') still works: it opens the hub that holds the page and selects the view. */
regMod("spi_hub","1.0",["spi_core","spi_viz"],"Hubs");
const SPI_HUBS=[
 {id:"spi_h_ov",label:"Overview",tabs:[["spi_space","Equipment library 3D"],["spi_dash","Summary"],["spi_cov","Brief coverage"],["spi_ready","Campaign readiness"],["spi_val","Method and validation"],["spi_arch","Data and architecture"]]},
 {id:"spi_h_inv",label:"Inventory",tabs:[["spi_find","Find"],["spi_health","Stock health"],["spi_loc","Locations and equipment"],["spi_parts","Parts"],["spi_reg","Registers"],["spi_ingest","Documents and log"]]},
 {id:"spi_h_mnt",label:"Maintenance",tabs:[["spi_maint","Maintenance board"],["spi_m_pop","Equipment and failures"],["spi_m_drv","Maintenance-driven demand"],["spi_m_ta","Turnaround readiness"],["spi_m_open","Open work and spares"],["spi_eq","Equipment 3D and drawings"],["spi_prot","Protective devices"]]},
 {id:"spi_h_fc",label:"Forecasting and Simulation",tabs:[["spi_f_pred","Demand predictability"],["spi_f_port","Portfolio forecast"],["spi_f_dec","Decision board"],["spi_f_part","Part forecast"],["spi_f_par","Parameters"],["spi_f_opt","Cost-risk optimiser"],["spi_sim","Scenario simulator"],["spi_fo","Policy backtest"],["spi_ask","Ask the AI"]]},
 {id:"spi_h_cost",label:"Costs",tabs:[["spi_c_bal","Cost-risk balance"],["spi_c_sav","Cost reduction"],["spi_c_cash","Cash plan"],["spi_c_score","Business impact"],["spi_impact","Engine finance detail"]]}];
const SPIHUB={tab:{}};
const SPI_EXPLAIN=["spi_f_pred","spi_f_port","spi_f_dec","spi_f_par","spi_f_opt","spi_m_pop","spi_m_drv","spi_m_ta","spi_m_open","spi_c_bal","spi_c_sav","spi_c_cash","spi_c_score","spi_reg"];
function spiExplain(tab,label){if(typeof spiChMount==="function")spiChMount();const b=document.getElementById("spichbox");if(b&&b.hidden)spiChToggle();spiChSend("Explain this view: "+label+". What matters and what should we do?")}
function spiAskAbout(q){if(typeof spiChMount==="function")spiChMount();const b=document.getElementById("spichbox");if(b&&b.hidden)spiChToggle();spiChSend(q)}
function spiHubTab(hub,id){SPIHUB.tab[hub]=id;st.page=hub;render()}
const SPI_ALIAS={spi_forecast:"spi_f_part",spi_reco:"spi_f_dec",spi_opt:"spi_f_par",spi_outlook:"spi_f_port",spi_ready:"spi_m_ta",spi_savings:"spi_c_sav"};/* removed views: links to them open the Forecasting and Simulation hub */
function spiHubFor(p){return SPI_HUBS.find(h=>h.tabs.some(t=>t[0]===p))}
SPI_HUBS.forEach(h=>spiRegister(h.id,h.label,async host=>{
 const avail=h.tabs.filter(t=>SPI.pages[t[0]]),cur=avail.find(t=>t[0]===SPIHUB.tab[h.id])||avail[0];
 document.querySelectorAll("aside .nav").forEach(n=>n.classList.toggle("active",n.dataset.page===h.id));
 host.innerHTML=`<div class="spi-hubtabs" role="tablist">${avail.map(t=>`<button role="tab" class="${t[0]===cur[0]?"on":""}" onclick="spiHubTab('${h.id}','${t[0]}')">${esc(t[1])}</button>`).join("")}${!['spi_ask','spi_find'].includes(cur[0])?`<button class="spi-explain" onclick="spiExplain('${cur[0]}','${esc(cur[1]).replace(/'/g,"")}')">Explain this view with AI</button>`:""}</div><div class="spi-hubbody" id="spihb"><p class="spi-sub">Loading</p></div>`;
 const sub=document.getElementById("spihb");try{await SPI.pages[cur[0]].fn(sub)}catch(e){if(document.getElementById("spihb"))sub.innerHTML=`<div class="spi-err"><b>This view could not load.</b><p>${esc(e.message)}</p><button class="btn" onclick="render()">Try again</button></div>`}}));
/* tables stay hidden until the reader searches: spiTable wraps tables of more than 5 rows in a search box (see spi_core) */
function spiTs(el){const w=el.closest(".spi-ts"),b=w.querySelector(".spi-tsb"),h=w.querySelector(".spi-tsh"),q=el.value.trim().toLowerCase(),rows=b.querySelectorAll("tbody tr");if(q.length<2){b.hidden=true;h.textContent="The table stays hidden until you search.";return}let n=0;rows.forEach(r=>{const m=r.textContent.toLowerCase().includes(q);r.hidden=!m;if(m)n++});b.hidden=n===0;h.innerHTML=n?n+" of "+rows.length+" rows match":"No rows match. <a href=\"#\" onclick=\"spiAskAbout(this.dataset.q);return false\" data-q=\""+esc(el.value.trim())+"\">Ask the AI about \""+esc(el.value.trim())+"\"</a>"}
