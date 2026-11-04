// Pure and dependency-free: the exact same simulator runs on the server and as an ES module in the browser.
export function simulate(rows,settings={}){
 const stock_multiplier=settings.stock_multiplier??1,demand_multiplier=settings.demand_multiplier??1,lead_time_multiplier=settings.lead_time_multiplier??1,service_level=settings.service_level??.95;
 for(const x of [stock_multiplier,demand_multiplier,lead_time_multiplier])if(!Number.isFinite(x)||x<.1||x>3)throw new Error('Scenario multipliers must be between 0.1 and 3');if(!Number.isFinite(service_level)||service_level<.8||service_level>.999)throw new Error('Service level must be 0.8 to 0.999');
 const out={parts:rows.length,priced:0,stock_value_idr:0,carrying_cost_idr_yr:0,expected_stockouts_yr:0,exposure_idr:0,service_level:0,target_stock_value_idr:0};
 for(const r of rows){const stock=Math.max(r.insurance_spare?1:0,r.stock*stock_multiplier),factor=demand_multiplier*lead_time_multiplier,lead=Math.max(1,r.lead_time_days*lead_time_multiplier);let risk=0,short=0,target=0,cumulative=0;
  for(const d of r.distribution){const demand=d.qty*factor;if(demand>stock)risk+=d.probability;short+=Math.max(0,demand-stock)*d.probability;cumulative+=d.probability;if(cumulative<service_level)target=demand;else if(target===0)target=demand}
  let acc=0;for(const d of r.distribution){acc+=d.probability;if(acc>=service_level){target=d.qty*factor;break}}
  const days=r.monthly_rate*demand_multiplier>0?Math.min(lead,short/(r.monthly_rate*demand_multiplier/30)):0;
  out.expected_stockouts_yr+=risk*365/lead;out.exposure_idr+=days*r.downtime_idr_day;out.service_level+=1-risk;
  if(r.unit_price_idr>0){out.priced++;out.stock_value_idr+=stock*r.unit_price_idr;out.target_stock_value_idr+=Math.max(r.insurance_spare?1:0,Math.ceil(target))*r.unit_price_idr;out.carrying_cost_idr_yr+=stock*r.unit_price_idr*r.holding_rate}}
 out.service_level=rows.length?out.service_level/rows.length:null;
 return{...out,settings:{stock_multiplier,demand_multiplier,lead_time_multiplier,service_level},notes:['Estimate: scaled empirical lead-time demand, not a new sampling of lead-time uncertainty.','Stockout cycles per year assumes independent lead-time cycles; not observed annual failures.','Exposure sums part-level scores; shared equipment and correlated losses can overlap. Do not claim this sum as plant downtime loss.','Changing the service target changes target stock; existing-stock risk changes only when stock or demand is changed.','Insurance reserves are never reduced below one in this scenario.']};
}
export function costRiskCurve(rows,settings={}){return[.25,.5,.75,1,1.25,1.5,2,3].map(stock_multiplier=>simulate(rows,{...settings,stock_multiplier}));}
export default simulate;
