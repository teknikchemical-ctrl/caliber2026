/* SPI Overview page (owner: Claude A). Data: GET /api/data/summary. */
regMod("spi_dash","1.0",["spi_core"],"Spare parts overview");
spiRegister("spi_dash","Overview",async host=>{
 const d=await spiApi("/api/data/summary"),p=d.parts,h=d.stock_health,m=d.meta;
 const crit=d.by_criticality.map(c=>({label:(c.crit==="unknown"?"Criticality unknown":"Criticality "+c.crit)+" ("+spiNum(c.parts)+" parts)",value:c.stock_value||0,over:c.excess_value||0,text:spiMoney(c.stock_value)+" | excess "+spiMoney(c.excess_value)}));
 const cls=d.by_demand_class.map(c=>({label:c.demand_class.replace("_"," "),value:c.parts,tone:c.demand_class==="no_demand"?"n":"acc",text:spiNum(c.parts)+" parts"}));
 const row=r=>`onclick="spiGo('spi_forecast',{mat:${r.material_no}})"`;
 host.innerHTML=`<h1>Spare part overview</h1><p class="spi-sub">${esc(CASE.title)} | baseline data to ${esc(m.data_cutoff)} (${esc(m.history_months)} months of issues) | amounts in IDR and an <b>Estimate</b>: price is the last purchase order item amount, read as a unit price, only for the ${spiNum(p.priced)} parts that have one.</p>
 <div class="spi-grid4">${spiKpi(spiNum(p.parts),"Spare parts in the baseline",null,spiNum(p.with_demand)+" were ever issued ("+Math.round(p.with_demand/p.parts*100)+"%)")}
 ${spiKpi(spiMoney(p.stock_value),"Stock value (Estimate)","acc","priced parts only")}
 ${spiKpi(spiMoney(p.excess_value),"Stock above Max (Estimate)","bad",Math.round(p.excess_value/p.stock_value*100)+"% of the priced stock value. True excess against a set Max: "+spiMoney(d.excess_split.with_max)+"; Non Stock items with no Max: "+spiMoney(d.excess_split.nonstock_no_max)+"; the 10 largest parts are "+Math.round(d.excess_concentration.top10*100)+"% of the total")}
 ${spiKpi(spiNum(h.below_min),"Stock items below Min","warn","of "+spiNum(h.zero_stock)+" at zero stock")}
 ${spiKpi(spiNum(d.zero_stock_critical_with_demand),"Critical (S, A) parts at zero stock with demand","bad","at least 2 months with issues")}
 ${spiKpi(spiNum(d.insurance_spare_candidates),"Insurance spare candidates","n","no demand, S or A equipment, lead time over 90 days or unknown")}</div>
 <div class="spi-grid2">${spiCard("Stock value by equipment criticality","<p class='spi-sub'>Red part of each bar is stock above Max.</p>"+spiBars(crit),"Criticality S, A, B, C is the highest of the locations the part is installed on.")}
 ${spiCard("Demand pattern of the parts",spiBars(cls),"ADI and CV2 classes over "+m.history_months+" months. Most parts never move, and most that do move in one month only: forecasting needs intermittent-demand methods and pooling.")}</div>
 <div class="spi-grid2">${spiCard("Largest excess stock (Estimate)",spiTable(d.top_excess,[{h:"Part",f:r=>esc(r.material_no)+"<br><span class='spi-sub'>"+esc(spiDesc(r.descr))+"</span>"},{h:"Crit",f:r=>spiCritBadge(r.crit_max)},{h:"Stock",k:"stock",num:1},{h:"Max",k:"max_qty",num:1},{h:"Excess value",f:r=>spiMoney(r.excess_value_idr),num:1}],{row}))}
 ${spiCard("Critical parts at zero stock that were used",spiTable(d.top_stockout_risk_candidates,[{h:"Part",f:r=>esc(r.material_no)+"<br><span class='spi-sub'>"+esc(spiDesc(r.descr))+"</span>"},{h:"Crit",f:r=>spiCritBadge(r.crit_max)},{h:"Issued",f:r=>spiNum(r.total_qty),num:1},{h:"Months used",k:"months_active",num:1},{h:"Lead time d",f:r=>r.lt_median==null?"Not in baseline data":spiNum(r.lt_median),num:1}],{row}),"Candidates only: the forecast page gives the risk and the action.")}</div>
 <p class="spi-note">Data quality: ${spiNum(d.data_quality.total)} findings logged (${spiNum(d.data_quality.errors)} errors, ${spiNum(d.data_quality.warns)} warnings). See the Data and architecture page. ${d.notes.map(esc).join(" ")}</p>`;
});
