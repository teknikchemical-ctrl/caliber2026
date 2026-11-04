/* SPI Brief coverage (owner: Claude A): where each deliverable of the case brief is answered in the app, with the live headline from the view payload. */
regMod("spi_cov","1.0",["spi_core","spi_viz","spi_fs"],"Brief coverage");
const SPCOV=[
 ["Key question 1","How can the Company improve demand predictability for spare parts with irregular and uncertain consumption?","spi_f_pred","demand_predictability"],
 ["Key question 2","How can the Company dynamically optimise spare part inventory while balancing cost, availability and operational risk?","spi_f_opt","cost_risk"],
 ["Solution 1: Demand forecasting","Consumption, failures, planned maintenance, preventive schedules, shutdowns, installed population, lead time.","spi_f_port","portfolio_forecast"],
 ["Solution 1: drivers","Failure frequency, planned maintenance, shutdown and turnaround, equipment population.","spi_m_drv","maintenance_driven_demand"],
 ["Solution 2: Dynamic inventory optimisation","Min and Max, safety stock, reorder point, replenishment quantity.","spi_f_par","parameters_shift"],
 ["Solution 3: Inventory health monitoring","Excess, slow-moving, non-moving, potentially obsolete.","spi_health",null],
 ["Solution 4: Recommendation and cost-risk","Reorder, maintain, reduce or monitor; stockout, downtime and production-loss risk.","spi_f_dec","decision_board"],
 ["Output: Stockout Risk","Critical parts ranked by chance of stockout and exposure.","spi_f_dec","decision_board"],
 ["Output: Overstock Risk","Largest stock above Max with the value above Max.","spi_f_dec","decision_board"],
 ["Output: Reorder Recommendation","Parts to reorder with quantity and arrival month.","spi_f_dec","registers"],
 ["Output: Slow-Moving Alert","Non-moving and slow-moving stock, insurance spares excluded.","spi_f_dec","decision_board"],
 ["Output: Dynamic Inventory Parameters","Current, workbook and dynamic Min, Max, reorder point and safety stock per part and portfolio.","spi_f_par","parameters_shift"],
 ["Output: Cost-Risk Optimization Scenarios","Budget frontier and the scenario simulator (stock, demand, lead time, service level).","spi_sim",null],
 ["Business impact","Success metrics, benefits in IDR with assumptions, sensitivity, cash plan.","spi_c_score","business_scorecard"],
 ["Maintenance and shutdown readiness","Turnaround parts gap, open work against zero-stock parts.","spi_m_ta","turnaround_readiness"],
 ["Data architecture and quality","Six sources, one database, joins, data quality findings.","spi_arch",null]];
spiRegister("spi_cov","Brief coverage",async host=>{
 host.innerHTML=spiHead("Brief coverage")+`<p class="spi-sub">Loading...</p>`;
 const names=[...new Set(SPCOV.map(r=>r[3]).filter(Boolean))],pay=Object.fromEntries(await Promise.all(names.map(async n=>[n,await spiApi("/api/view/"+n).catch(()=>null)])));
 host.innerHTML=spiHead("Brief coverage","Every deliverable of the case brief, where it is answered in the app, and the live headline from the same data.")+
 `<div class="spi-covg">${SPCOV.map(r=>{const p=r[3]&&pay[r[3]];return `<div class="spi-cov" onclick="spiGo('${r[2]}',{})"><div class="spi-covk">${esc(r[0])}</div><div class="spi-covq">${esc(r[1])}</div>${p?`<div class="spi-covh">${esc(p.insight)}</div>`:""}<span class="spi-covl">Open the view</span></div>`}).join("")}</div>`;
});
