/* Final tab lists of the five hubs (owner: Claude B, owner approved round 7). Runs after every other module has added its tabs.
   Inventory: 5 tabs (the data lookup pages Find, Locations and equipment, Part types, Registers, Documents and log stay reachable from search and from the Source data tab).
   Forecasting: one landing view (Optimized Scenario); the Timeline of Claude A stays as "History by part". The floating Ask the AI button replaces the Ask the AI tab. */
regMod("spi_zone_ztabs","1.0",["spi_core"],"Tab lists");
setTimeout(()=>{if(typeof SPI_HUBS==="undefined")return;const H=id=>SPI_HUBS.find(h=>h.id===id),set=(id,t)=>{const h=H(id);if(h)h.tabs=t};
 set("spi_h_ov",[["spi_space","Equipment explorer"],["spi_status","Status"],["spi_summ","Summary"],["spi_link","Link map"]]);
 set("spi_h_inv",[["spi_golden","Optimized Scenario"],["spi_iplan","Inventory planner"],["spi_inv","Stock"],["spi_sup","Suppliers and lead time"],["spi_src_inv","Source data"]]);
 set("spi_h_fc",[["spi_fgold","Optimized Scenario"],["spi_tl","History by part"],["spi_ssim","Replenishment simulator"],["spi_scr","Cost-risk scenarios"],["spi_src_fc","Source data"]]);
 {const c=H("spi_h_cost");if(c){const keep=c.tabs.filter(t=>!["spi_src_cost"].includes(t[0]));c.tabs=keep.concat([["spi_src_cost","Source data"]])}}
 {const m=H("spi_h_mnt");if(m&&!m.tabs.some(t=>t[0]==="spi_src_mnt"))m.tabs.push(["spi_src_mnt","Source data"])}},20);
