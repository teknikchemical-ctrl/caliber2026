/* Final tab lists of the five hubs (owner: Claude B, owner approved round 7). Runs after every other module has added its tabs.
   The landing tab of each hub opens with the projection answer (spi_zone_aiview.js); History and source data is the second tab. Inventory: 5 tabs (the data lookup pages Find, Locations and equipment, Part types, Registers, Documents and log stay reachable from search and from the Source data tab).
   Forecasting: one landing view (Optimized Scenario); the Timeline of Claude A stays as "History by part". The floating Ask the AI button replaces the Ask the AI tab. */
regMod("spi_zone_ztabs","1.0",["spi_core"],"Tab lists");
setTimeout(()=>{if(typeof SPI_HUBS==="undefined")return;const H=id=>SPI_HUBS.find(h=>h.id===id),set=(id,t)=>{const h=H(id);if(h)h.tabs=t};
 set("spi_h_ov",[["spi_space","Equipment explorer"],["spi_status","Status"],["spi_summ","Summary"],["spi_report","Action report"],["spi_link","Link map"]]);
 set("spi_h_inv",[["spi_golden","Optimized Scenario"],["spi_src_inv","History and source data"],["spi_iplan","Inventory planner"],["spi_inv","Stock"],["spi_sup","Suppliers and lead time"]]);
 set("spi_h_fc",[["spi_fgold","Optimized Scenario"],["spi_src_fc","History and source data"],["spi_tl","History by part"],["spi_ssim","Replenishment simulator"],["spi_scr","Cost-risk scenarios"]]);
 ["spi_h_cost:spi_src_cost","spi_h_mnt:spi_src_mnt"].forEach(x=>{const [h,id]=x.split(":"),c=H(h);if(c){const r=c.tabs.filter(t=>t[0]!==id);c.tabs=[r[0],[id,"History and source data"]].concat(r.slice(1))}})},20);
