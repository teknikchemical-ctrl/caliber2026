import {addMonth} from './context.js';
// Capture the actual rules recommendations, not PO history or an invented repeat-buy stream.
export function purchasePlanRows(rows,cutoff){return rows.filter(r=>r.order_qty>0).map(r=>{
 const order_by=r.order_by||cutoff,date=new Date(order_by+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+Math.ceil(r.lead_time_days));
 return {material_no:r.material_no,descr:r.descr,crit_max:r.crit_max,action:r.action,order_qty:r.order_qty,order_by,estimated_arrival:date.toISOString().slice(0,10),lead_proxy_days:r.lead_time_days,unit_price_idr:r.unit_price_idr>0?r.unit_price_idr:null,value_idr:r.unit_price_idr>0?r.order_qty*r.unit_price_idr:null,campaign_months:(r.forecast||[]).filter(x=>x.drivers?.length).map(x=>x.month)};
});}
export function cashPlan(source,config,{payment_lag_months=0,limit=50,offset=0}={}){
 if(!Number.isInteger(payment_lag_months)||payment_lag_months<0||payment_lag_months>12)throw new Error('Payment lag must be an integer 0 to 12 months');
 const scope=config.inputs.scope.value,real=config.inputs.release_realisation.value;
 if(!Number.isFinite(scope)||scope<0||scope>1||!Number.isFinite(real)||real<0||real>1)throw new Error('Scope and realisation must be fractions');
 const n=36,first=addMonth(source.data_cutoff,1),last=addMonth(first,n-1),map=new Map();
 const month=k=>{if(!map.has(k))map.set(k,{month:k,order_parts:0,order_qty:0,proposed_orders_idr:0,unpriced_orders:0,proposed_purchase_cash_idr:0,capital_release_idr:0,planned_maintenance_items:source.campaign.outlook.find(x=>x.month===k)?.items??null});return map.get(k)};
 for(let i=0;i<n;i++)month(addMonth(first,i));
 let purchase=0,unpriced=0;for(const r of source.orders){const k=r.order_by.slice(0,7),m=month(k);m.order_parts++;m.order_qty+=r.order_qty;if(r.value_idr==null){m.unpriced_orders++;unpriced++}else{m.proposed_orders_idr+=r.value_idr;month(addMonth(k,payment_lag_months)).proposed_purchase_cash_idr+=r.value_idr;purchase+=r.value_idr}}
 const release=source.low_risk_candidates_idr*scope*real;
 for(let i=0;i<n;i++)month(addMonth(first,i)).capital_release_idr=release*(config.release_schedule[Math.floor(i/12)]||0)/12;
 let cumIn=0,cumOut=0;const months=[...map.values()].sort((a,b)=>a.month.localeCompare(b.month)).map(m=>{cumIn+=m.capital_release_idr;cumOut+=m.proposed_purchase_cash_idr;return {...m,net_capital_cash_idr:m.capital_release_idr-m.proposed_purchase_cash_idr,cumulative_release_idr:cumIn,cumulative_purchase_cash_idr:cumOut,cumulative_net_capital_cash_idr:cumIn-cumOut}});
 return {status:'Estimate: unapproved procurement and cleanup capital scenarios, not realised savings',data_cutoff:source.data_cutoff,release_start_month:first,release_end_month:last,payment_lag_months,total_orders:source.orders.length,unpriced_orders:unpriced,proposed_orders_idr:purchase,capital_release_idr:cumIn,peak_capital_funding_idr:Math.max(0,...months.map(m=>-m.cumulative_net_capital_cash_idr)),months,orders:source.orders.slice(offset,offset+limit),campaign:source.campaign,assumptions:[
 'Purchase proposals are exactly the rules batch order_qty and order_by, not historical PO spend. Values use positive snapshot IDR unit prices. Unpriced proposals are counted, not assigned a zero unit price.',
 'Order-by dates at the cut-off remain in their original month as a due-at-cut-off funding bucket; they are not silently deferred. Estimated arrival adds the PR-to-PO-delivery lead proxy and is not a supplier commitment or goods receipt.',
 'Cash is assumed paid in the order month plus the selected payment lag, default zero. Payment terms are Not in baseline data. This is a funding scenario, not an approved purchase schedule.',
 'Capital release is the scoped low-risk B/C ceiling times realisation, evenly allocated within annual shares 20%, 40%, 40% over three years after cut-off. Timing and recovery channel are Assumptions, not evidence of cash receipts. S and A are never auto-released; insurance remains.',
 'Full availability procurement and low-risk cleanup are shown separately. Their difference is a capital funding scenario, not project NPV or profit. Solution costs, operating costs, tax and financing are excluded here; the annual business case includes solution costs.',
 'Only current batch recommendations are scheduled. No invented future repeat orders: a blank future order month is not evidence that no purchases will be needed. Re-run the batch as demand, pipeline and maintenance evidence changes.',
 'Rules forecasts include dated maintenance campaign uplifts. December 2025 and January 2026 issues were about 2.8 times normal; 1,123 maintenance items are due October 2026. Maintenance counts are not known part quantities or proof that all proposed orders serve the campaign.',
 'On-hand-only inventory position excludes unavailable open orders. Confirm pipeline, criticality (S > A > B > C assumed) and due dates before any commitment. No emergency-premium, price-standardisation or PO-spend saving is counted.'
 ]};
}
