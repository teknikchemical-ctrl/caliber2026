import {addMonth} from './context.js';
import {workbookPolicy} from './compare.js';
// Forecast means are not quantiles: stress factors are Assumptions, not confidence limits.
export function economicSource(rows,store){return {data_cutoff:store.meta.data_cutoff,engine_version:'spi-engine-1.1',history_months:store.months,rows:rows.map(r=>({material_no:r.material_no,crit_max:r.crit_max||'unknown',stock:r.stock||0,price:r.unit_price_idr>0?r.unit_price_idr:null,insurance:r.insurance_spare,lead_days:r.lead_time_days,current:{min_qty:r.min_qty||0,max_qty:r.max_qty||0},workbook:workbookPolicy(store.series.get(r.material_no)),dynamic:{min_qty:r.inventory.min_qty,max_qty:r.inventory.max_qty},history:store.series.get(r.material_no),forecast:r.forecast.map(f=>({month:f.month,mean:f.mean}))}))};}
function budget(rows,source,settings,policy){
 const months=Array.from({length:13},(_,t)=>({month:addMonth(source.data_cutoff,t),purchase_cash_idr:0,cash_holding_idr:0,economic_holding_indicator_idr:0,opening_stock_idr:0,receipts_value_idr:0,filled_demand_value_idr:0,closing_stock_idr:0,consumption_value_idr:0,unfilled_demand_value_idr:0,order_parts:0,unpriced_order_parts:0,stockout_part_months:0}));
 for(const r of rows){
  let stock=r.stock,pipeline=[];const price=r.price==null?null:r.price*settings.price_factor,limits=r[policy],lag=Math.max(1,Math.ceil(r.lead_days*settings.lead_factor/30.4375));
  const order=t=>{const position=stock+pipeline.reduce((s,p)=>s+p.qty,0);const qty=position<=limits.min_qty?Math.max(0,limits.max_qty-position):0;if(qty>0){pipeline.push({due:t+lag,qty});months[t].order_parts++;if(price==null)months[t].unpriced_order_parts++;else months[t].purchase_cash_idr+=qty*price;}};
  // Time zero = cut-off month. Unknown real open orders start at zero; thereafter
  // synthetic orders are included in position to prevent repeated transit orders.
  order(0);if(price!=null){months[0].closing_stock_idr+=stock*price;months[0].opening_stock_idr+=stock*price;}
  for(let t=1;t<=12;t++){
   const opening=stock,arrivals=pipeline.filter(p=>p.due===t).reduce((s,p)=>s+p.qty,0);pipeline=pipeline.filter(p=>p.due>t);stock+=arrivals;
   const demand=(r.forecast[t-1]?.mean||0)*settings.demand_factor,filled=Math.min(stock,demand),short=demand-filled;stock-=filled;months[t].stockout_part_months+=short>1e-9;
   if(price!=null){const m=months[t],held=(opening+arrivals+stock)/2*price;m.opening_stock_idr+=opening*price;m.receipts_value_idr+=arrivals*price;m.filled_demand_value_idr+=filled*price;m.consumption_value_idr+=demand*price;m.unfilled_demand_value_idr+=short*price;m.closing_stock_idr+=stock*price;m.cash_holding_idr+=held*settings.holding_cash_rate/12;m.economic_holding_indicator_idr+=held*settings.holding_economic_rate/12;}
   order(t);
  }
 }
 let cum=0;for(const m of months){m.operating_funding_idr=m.purchase_cash_idr+m.cash_holding_idr;cum+=m.operating_funding_idr;m.cumulative_operating_funding_idr=cum;}
 const sum=k=>months.reduce((s,m)=>s+m[k],0),demand=sum('consumption_value_idr'),unfilled=sum('unfilled_demand_value_idr');
 return {months,purchase_cash_idr:sum('purchase_cash_idr'),cash_holding_idr:sum('cash_holding_idr'),economic_holding_indicator_idr:sum('economic_holding_indicator_idr'),operating_funding_idr:cum,consumption_value_idr:demand,unfilled_demand_value_idr:unfilled,priced_value_fill_rate:demand>0?1-unfilled/demand:null,stockout_part_months:sum('stockout_part_months'),closing_stock_idr:months.at(-1).closing_stock_idr,unpriced_order_events:sum('unpriced_order_parts')};
}
export function economics(source,overrides={}){
 const settings={demand_factor:1,price_factor:1,lead_factor:1,holding_cash_rate:.04,holding_economic_rate:.22};
 for(const [k,v] of Object.entries(overrides)){if(!(k in settings)||typeof v!=='number'||!Number.isFinite(v))throw new Error('Invalid economic scenario input');settings[k]=v;}
 for(const k of ['demand_factor','price_factor','lead_factor'])if(settings[k]<.25||settings[k]>3)throw new Error('Scenario factor must be between 0.25 and 3');
 for(const k of ['holding_cash_rate','holding_economic_rate'])if(settings[k]<0||settings[k]>1)throw new Error('Holding rate must be a fraction');
 const policies=Object.fromEntries(['current','workbook','dynamic'].map(p=>[p,budget(source.rows,source,settings,p)]));
 for(const p of Object.values(policies)){p.funding_difference_vs_current_idr=p.operating_funding_idr-policies.current.operating_funding_idr;p.priced_value_fill_difference_vs_current=p.priced_value_fill_rate==null||policies.current.priced_value_fill_rate==null?null:p.priced_value_fill_rate-policies.current.priced_value_fill_rate;}
 const groups=[...new Set(source.rows.map(r=>r.crit_max))].sort().map(crit=>{const rows=source.rows.filter(r=>r.crit_max===crit);return {criticality:crit,parts:rows.length,priced_parts:rows.filter(r=>r.price!=null).length,policies:Object.fromEntries(['current','workbook','dynamic'].map(p=>[p,budget(rows,source,settings,p)]))};});
 const history=source.history_months.map((month,i)=>({month,priced_consumption_value_idr:source.rows.reduce((s,r)=>s+(r.price==null?0:r.history[i]*r.price),0)}));
 return {status:'Estimate: forward budget scenario, not validated savings',data_cutoff:source.data_cutoff,settings,parts:source.rows.length,priced_parts:source.rows.filter(r=>r.price!=null).length,forecast_active_parts:source.rows.filter(r=>r.forecast.some(f=>f.mean>0)).length,priced_forecast_active_parts:source.rows.filter(r=>r.price!=null&&r.forecast.some(f=>f.mean>0)).length,history,policies,by_criticality:groups,assumptions:[
 'All 7,481 materials are modelled once. Positive snapshot IDR unit prices value both historical and future consumption. Historical values are revalued Estimates, not accounting expense or PO spend. Unpriced parts remain in order-event and stockout counts, but their money value is Not in baseline data.',
 'The 12-month campaign-adjusted per-part engine mean path is shared by all policies. Demand, price and lead multipliers are explicit stress Assumptions, not probabilities or confidence intervals. Price shocks revalue the inventory indicator and future buys; a revaluation is not profit. Unit prices are flat in base; no price-standardisation or rush premium saving is claimed.',
 'All policies share each part\'s PR-to-PO-delivery receipt lead proxy; the workbook ROP/Max formula retains its default 60-day Assumption. Changing lead affects receipt timing only; policy ROP and Max are held fixed. It does not estimate recalibrated safety-stock savings.',
 'Month zero is the September 2026 cut-off funding bucket. Orders are tested there and after each future monthly demand. Receipts precede monthly demand after lead rounded up using 30.4375 days. Monthly lost sales and no backorders are Assumptions.',
 'Actual open orders are Not in baseline data and start at zero. Thereafter simulated orders in transit are included in decision position to prevent duplicate repeat buys. This future budget differs from the strict on-hand-only workbook replay; neither authorises purchases.',
 'Fixed current, workbook and dynamic Min/Max settings are not re-fitted on forecast-generated observations. No inventory disposal or automatic release occurs. Insurance remains, S and A are never auto-released, and criticality S > A > B > C is assumed.',
 'Purchase cash is assumed paid at order; payment terms are Not in baseline data. Cash holding uses mean opening-plus-arrivals and closing stock x 4% / 12 by default. The 22% economic carrying indicator is separate and is not added to cash funding or NPV.',
 'Consumption value is demand x price, including unmet demand; it is not added to purchase cash, which would double count inventory conversion. Service is priced-value fill, not a calibrated plant availability rate. Stockout counts include unpriced parts.',
 'Funding differences can reflect worse service or more stock. They are not cost-reduction claims. No downtime, revenue, profit, PO-spend benefit or terminal inventory salvage is inferred. Cleanup release and solution costs are separate from this operating inventory budget.',
 'Future demand is not observed and the policies are tested on the same model-generated path. Use the separate chronological historical holdout to assess demand generalisation. Sums of individual quantiles are not portfolio confidence bands.'
 ]};
}
