/* SPI case clean-up (owner: Claude B, requested by the human owner): take out what has no correlation with the spare part case.
   The generic engine of the first plant case still brings pages and cards that have no data here (plot plan, P&ID tab, interlocks, scenarios, simulated performance, costing without inputs, ...).
   Done in this module only, so the generic files stay untouched: hide the menu entries, send old links to the library, hide the cards on the equipment set page.
   For Claude A: the permanent fix is to drop these pages from base.html and build.py for case spi; this file can then be deleted. */
regMod("spi_zone_clean","1.0",["spi_core"],"Hide pages and cards that have no data in the spare part case");
const SPI_GONE=["dashboard","plot","mnt","perf","scn","il","ai","ks","fm","int","gov","fin","mywork","opl","quality"];
const SPI_GONE_CARD=/^(location of .* in the unit|place in the plant|key items on the p&id|plot plan|how it works)/i;
if(window.SPI_MODE){
 const _r=render;render=function(){if(SPI_GONE.indexOf(st.page)>=0)st={...st,page:"spi_space"};if(st.tab==="pid")st={...st,tab:"ga"};_r();spiCleanDom()};
 function spiCleanDom(){
  document.querySelectorAll(".nav").forEach(n=>{if(SPI_GONE.indexOf(n.dataset.page)>=0)n.style.display="none"});
  const app=document.getElementById("app");if(!app)return;
  app.querySelectorAll("h2,h3").forEach(h=>{if(!SPI_GONE_CARD.test((h.textContent||"").trim()))return;const c=h.closest(".card,section");if(c&&c!==app&&!c.contains(document.getElementById("speq"+(st.set||""))))c.style.display="none"});
  /* buttons and facts that lead to removed pages or show a value that is not in the data */
  app.querySelectorAll("button,a").forEach(b=>{if(/^(ask the assistant|open the p&id|p&id)/i.test((b.textContent||"").trim()))b.style.display="none"});
  app.querySelectorAll(".eqfs>*,.kv>*").forEach(e=>{if(/not in baseline data-\d/i.test(e.textContent||""))e.style.display="none"});
  app.querySelectorAll("span,div").forEach(e=>{if(e.children.length===0&&/^0 instruments$/.test((e.textContent||"").trim()))e.style.display="none"})}
 setTimeout(()=>{document.querySelectorAll(".nav").forEach(n=>{if(SPI_GONE.indexOf(n.dataset.page)>=0)n.style.display="none"})},400)}
