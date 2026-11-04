/* SPI Overview (owner: Claude A). Answer first: one insight line, four tiles, a treemap of stock by criticality and status, three actions, campaign strip, Pareto of excess. */
regMod("spi_dash","2.0",["spi_core","spi_viz"],"Spare parts overview");
const SPI_STAT={excess_true:["Above Max","excess"],excess_crit:["Above Max (S, A)","excess2"],non_moving:["Non-moving","nonmoving"],slow:["Slow-moving","slow"],nonstock_stock:["Non Stock holding stock","nonstock"],insurance:["Insurance spares","ins"],normal:["Within policy","normal"]};
spiRegister("spi_dash","Overview",async host=>{
 const [d,o]=await Promise.all([spiApi("/api/data/summary"),spiApi("/api/data/overview")]),p=d.parts,m=d.meta,sp=d.excess_split;
 const ex=p.excess_value,sv=p.stock_value,top10=Math.round(d.excess_concentration.top10*100);
 const crits=["S","A","B","C","none"],cn=c=>c==="none"?"Unknown":c,stk=["normal","insurance","excess_crit","excess_true","non_moving","slow","nonstock_stock"];
 const ser=stk.map(k=>({name:SPI_STAT[k][0],tone:SPI_STAT[k][1],values:crits.map(c=>{const r=o.stock_by_status.find(x=>x.crit===c&&x.cat===k);return r?r.stock_value/1e9:0})}));
 const chart=spiAxBars({title:"Stock value by criticality and status",labels:crits.map(cn),series:ser,stack:true,yfmt:v=>Math.round(v),ylabel:"Stock value (IDR bn, Estimate)",xlabel:"Equipment criticality (S highest)",h:320,w:1100,ml:60,maxbar:110});
 host.innerHTML=spiHead("Spare part overview","",`<span class="spi-sub">Data to ${esc(m.data_cutoff)} | ${esc(m.history_months)} months | IDR, Estimate</span>`)+
 `<div class="spi-tiles">${spiTile({label:"Spare parts in baseline",value:spiNum(p.parts),delta:spiNum(p.with_demand)+" ever issued ("+spiPct(p.with_demand,p.parts)+")"})}
 ${spiTile({label:"Stock value",value:spiIdr(sv),delta:"priced parts only",info:"Price is the last purchase order item amount, read as a unit price. Estimate."})}
 ${spiTile({label:"Stock above Max",value:spiIdr(ex),tone:"bad",delta:"set Max "+spiIdr(sp.with_max)+" | no Max "+spiIdr(sp.nonstock_no_max),js:"spiGo('spi_savings')"})}
 ${spiTile({label:"Critical parts at zero stock",value:spiNum(d.zero_stock_critical_with_demand),tone:"bad",delta:"S or A, used in 2+ months",js:"spiGo('spi_forecast')"})}</div>
 <div class="spi-actions">
  <div class="spi-act bad" onclick="spiGo('spi_forecast')"><span>Protect first</span><b>${spiNum(o.actions.zero_crit)} critical parts</b><span>at zero stock with demand. Check reorder before the next campaign.</span></div>
  <div class="spi-act warn" onclick="spiGo('spi_savings')"><span>Release first</span><b>${spiIdr(sp.with_max)}</b><span>above a set Max. Review the largest parts, S and A equipment last.</span></div>
  <div class="spi-act" onclick="spiGo('spi_arch')"><span>Fix the data</span><b>${spiNum(d.data_quality.total)} findings</b><span>${spiNum(d.data_quality.errors)} error${d.data_quality.errors===1?"":"s"} and ${spiNum(d.data_quality.warns)} warnings change what the numbers can claim.</span></div></div>`+
 spiCard("Where the stock value sits",chart,"Each column is the stock value on equipment of that criticality, split by what the stock is doing. Estimate on priced parts that hold stock.")+
 `<div class="spi-panel2">${spiCard("Largest excess parts",spiPareto(o.excess_pareto.map(r=>({label:r.material_no,sub:spiDesc(r.descr),value:r.value,tone:"excess",js:`spiGo('spi_forecast',{mat:${r.material_no}})`})),{top:10,show:10,total:o.excess_total_idr}),"Share of the total excess at the right.")}
 ${spiCard("Demand pattern",spiHBars(d.by_demand_class.map(c=>({label:c.demand_class.replace("_"," "),value:c.parts,tone:c.demand_class==="no_demand"?"n":"acc",text:spiNum(c.parts)}))),"Most parts never move. Forecasting needs intermittent methods and pooling.")}</div>
 <div id="spicamp"></div>
 ${spiMore("Parts to look at first (tables)",`<div class="spi-grid2">${spiTable(d.top_excess,[{h:"Part",f:r=>esc(r.material_no)+"<br><span class='spi-sub'>"+esc(spiDesc(r.descr))+"</span>"},{h:"Crit",f:r=>spiCritBadge(r.crit_max)},{h:"Excess",f:r=>spiIdr(r.excess_value_idr),num:1}],{row:r=>`onclick="spiGo('spi_forecast',{mat:${r.material_no}})"`})}
 ${spiTable(d.top_stockout_risk_candidates,[{h:"Part",f:r=>esc(r.material_no)+"<br><span class='spi-sub'>"+esc(spiDesc(r.descr))+"</span>"},{h:"Crit",f:r=>spiCritBadge(r.crit_max)},{h:"Months used",k:"months_active",num:1},{h:"Lead time d",f:r=>r.lt_median==null?"n/a":spiNum(r.lt_median),num:1}],{row:r=>`onclick="spiGo('spi_forecast',{mat:${r.material_no}})"`})}</div>`)}`;
 spiCampaignCard();
});
async function spiCampaignCard(){const h=document.getElementById("spicamp");if(!h)return;try{const c=await spiApi("/api/data/campaigns");
 h.innerHTML=spiCard("Maintenance load: history and next 12 months",`<div class="spi-panel2"><div><div class="spi-mt">Work orders issuing parts per month (red = campaign month)</div>${spiAxBars({title:"Orders per month",labels:c.history.map(r=>r.month),series:[{name:"Orders",tone:"acc",values:c.history.map(r=>r.orders)}],yfmt:v=>spiNum(v),ylabel:"Orders per month",h:230,w:640,ml:46,colors:c.history.map(r=>r.campaign?"bad":"acc")})}</div><div><div class="spi-mt">Planned maintenance items due (red = high load)</div>${spiAxBars({title:"Planned items",labels:c.outlook.map(r=>r.month),series:[{name:"Items",tone:"acc",values:c.outlook.map(r=>r.items)}],yfmt:v=>spiNum(v),ylabel:"Items due per month",h:230,w:400,ml:46,colors:c.outlook.map(r=>r.high_load?"bad":"acc")})}</div></div>`,esc(c.reading)+" Campaign threshold "+c.assumption.campaign_index+" times the median month (Assumption).")}catch(e){h.innerHTML=""}}
