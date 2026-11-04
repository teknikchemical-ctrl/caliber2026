import {mean} from './classify.js';
import {defaultPlan,runPlan} from './runPlan.js';
import {contextFor,createStore} from './context.js';
import {selected} from './optimise.js';
export const WORKBOOK_DEFAULTS=Object.freeze({lead_days:60,safety_stock:2,review_months:1});
export function workbookPolicy(series,options={}) {
 const a={...WORKBOOK_DEFAULTS,...options};
 for(const [k,v] of Object.entries(a))if(!Number.isFinite(v)||v<0||(k==='lead_days'&&(v<1||v>400)))throw new Error('Invalid workbook assumption');
 const monthly_mean=mean(series),lead_demand=monthly_mean*a.lead_days/30.4375,rop=Math.ceil(lead_demand+a.safety_stock);
 return {...a,monthly_mean,lead_demand,min_qty:rop,max_qty:Math.max(rop,Math.ceil(rop+a.review_months*monthly_mean))};
}
// All three policies use the same monthly event order and on-hand-only order rule.
// Synthetic receipts are tracked, but pipeline is excluded from the decision position,
// exactly as in Pilot 50. This can order again while an earlier order is in transit.
export function policyReplay(demand,policy,{initial_stock=0}={}) {
 let stock=Math.max(0,initial_stock),pipeline=[],held=0,short=0,orders=0,ordered=0,events=0;
 const lag=Math.max(1,Math.ceil(policy.lead_days/30.4375)),timeline=[];
 for(let t=0;t<demand.length;t++){
  const receipts=pipeline.filter(p=>p.due===t).reduce((s,p)=>s+p.qty,0);pipeline=pipeline.filter(p=>p.due>t);stock+=receipts;
  const filled=Math.min(stock,demand[t]),shortage=demand[t]-filled;stock-=filled;short+=shortage;events+=shortage>0;held+=stock;
  const quantity=stock<=policy.min_qty?Math.max(0,policy.max_qty-stock):0;
  if(quantity>0){pipeline.push({due:t+lag,qty:quantity});orders++;ordered+=quantity;}
  timeline.push({period:t,receipts,demand:demand[t],filled,shortage,onhand:stock,order_qty:quantity});
 }
 const total=demand.reduce((s,v)=>s+v,0);
 return {avg_onhand:demand.length?held/demand.length:0,months_stockout:events,shortage_qty:short,orders,ordered_qty:ordered,total_demand:total,filled_qty:total-short,fill_rate:total?1-short/total:null,service_level:demand.length?1-events/demand.length:null,n_months:demand.length,ending_stock:stock,pipeline_qty:pipeline.reduce((s,p)=>s+p.qty,0),timeline};
}
export function comparePart(ctx,{workbook={},train_months=13}={}) {
 const assumptions=workbookPolicy(ctx.series,workbook),lead=assumptions.lead_days;
 function experiment(n,start){
  const y=ctx.series.slice(0,n),months=ctx.months.slice(0,n);
  // No future PO samples, campaign fit, maintenance counts or demand-derived profile
  // fields enter the model. Common fixed lead assumption avoids proxy look-ahead.
  const train={...ctx,db:undefined,series:y,months,family:(ctx.family||[]).slice(0,n),cutoff:months.at(-1)+'-01',lead_days:lead,leadSamples:[],lead_unknown:true,lead_basis:'Assumption: common workbook lead, not future PO observations',campaign_inputs:[],campaign:undefined,pm:[],failure_events:0,part:{...ctx.part,months_active:y.filter(v=>v>0).length,total_qty:y.reduce((s,v)=>s+v,0),months_since_last:0,pm_due_12m:0,notif_rate_12m:0}};
  const dynamic=runPlan(defaultPlan(train,{inputs:[],lead_time_days:lead,lead_time_basis:'assumption'}),train).inventory;
  const policies={current:{min_qty:Math.max(0,ctx.part.min_qty||0),max_qty:Math.max(0,ctx.part.max_qty||0),lead_days:lead},workbook:workbookPolicy(y,workbook),dynamic:{min_qty:dynamic.min_qty,max_qty:dynamic.max_qty,lead_days:lead}};
  const test=ctx.series.slice(start),price=ctx.part.unit_price_idr>0?ctx.part.unit_price_idr:null;
  return Object.fromEntries(Object.entries(policies).map(([name,p])=>{const r=policyReplay(test,p,{initial_stock:ctx.part.stock||0});return [name,{parameters:p,...r,avg_stock_value_idr:price==null?null:r.avg_onhand*price}]}));
 }
 return {material_no:ctx.part.material_no,descr:ctx.part.descr,crit_max:ctx.part.crit_max,unit_price_idr:ctx.part.unit_price_idr,initial_stock:ctx.part.stock||0,in_sample:experiment(ctx.series.length,0),holdout:experiment(train_months,train_months)};
}
export function summarise(rows,key){return Object.fromEntries(['current','workbook','dynamic'].map(name=>{
 const r=rows.map(p=>p[key][name]),sum=k=>r.reduce((s,v)=>s+(v[k]||0),0),demand=sum('total_demand'),periods=sum('n_months');
 return [name,{avg_stock_value_idr:sum('avg_stock_value_idr'),unpriced_parts:r.filter(p=>p.avg_stock_value_idr==null).length,orders:sum('orders'),ordered_qty:sum('ordered_qty'),stockout_part_months:sum('months_stockout'),shortage_qty:sum('shortage_qty'),total_demand:demand,filled_qty:sum('filled_qty'),fill_rate:demand?sum('filled_qty')/demand:null,service_level:periods?1-sum('months_stockout')/periods:null,part_months:periods}];
}));}
export function comparePolicies(db,{filters={},workbook={},limit=50,offset=0}={}){
 const store=createStore(db);if(store.months.length!==17)throw new Error('Comparison requires the 17-month baseline');
 const rows=selected(db,filters).map(p=>comparePart(contextFor(db,p.material_no),{workbook}));
 return {status:'Estimate: policy experiment, not observed savings',data_cutoff:store.meta.data_cutoff,total:rows.length,workbook_defaults:workbookPolicy([],workbook),in_sample:{label:'In-sample Estimate: parameters fitted on all 17 months',train_months:store.months,test_months:store.months,policies:summarise(rows,'in_sample')},holdout:{label:'Out-of-sample demand holdout: first 13 months fit, last 4 months test',train_months:store.months.slice(0,13),test_months:store.months.slice(13),policies:summarise(rows,'holdout')},rows:rows.slice(offset,offset+limit),assumptions:[
 'Identical September 2026 stock snapshot starts each policy and each experiment. Historical starting balances, open orders and receipts are Not in baseline data. Holdout is out-of-sample for demand fitting only; it is not a historical inventory reconstruction or proof of realised savings.',
 'Current Min and Max are fixed snapshot master data, not proven historical settings. No stock is disposed in any replay; S and A parts are never auto-released and insurance stays.',
 'All policies use common lead 60 days by default (Assumption), monthly receipts then demand then reorder at month end, lost sales, and lead rounded up to monthly periods. Position is on-hand only; synthetic pipeline is tracked but excluded from ordering, so duplicate orders in transit are possible.',
 'Workbook: ROUNDUP(mean demand * lead days / 30.4375 + safety stock 2); Max = MAX(ROP, ROUNDUP(ROP + review months 1 * mean demand)); order when on-hand <= ROP. Editable values are Assumptions.',
 'Dynamic holdout excludes future demand, future family demand, PO samples, campaign uplifts and maintenance signals with no as-of availability. No parameters tuned on test months.',
 'Fill rate is units filled / units demanded. Service level is 1 minus stockout part-months / all part-months, including zero-demand months. Mixed material units make aggregate fill rate a descriptive indicator; inspect per-part results.',
 'Stock held is mean month-end on-hand valued at snapshot positive IDR unit prices, not a recoverable cash amount. Unpriced parts remain in service metrics. No emergency price premium, downtime or PO-spend saving is claimed. Criticality S > A > B > C is assumed.'
 ]};
}

// Fast default-policy summaries from batch-generated per-part metrics. Timelines
// remain available through an explicit live request, not a first-screen dependency.
export function compareCached(snapshot,{filters={},limit=50,offset=0,ids=null}={}){
 const rows=snapshot.rows.filter(p=>(!ids||ids.has(p.material_no))&&(!filters.material_no||p.material_no===Number(filters.material_no))&&(!filters.crit||p.crit_max===filters.crit)&&(!filters.class||p.demand_class===filters.class)&&(!filters.family||p.family_id===filters.family)&&(!filters.q||(String(p.material_no)+' '+p.descr).toLowerCase().includes(String(filters.q).toLowerCase().slice(0,150))));
 return {...snapshot,total:rows.length,rows:rows.slice(offset,offset+limit),in_sample:{...snapshot.in_sample,policies:summarise(rows,'in_sample')},holdout:{...snapshot.holdout,policies:summarise(rows,'holdout')},cache:{basis:'Precomputed full rules batch',timelines_included:false}};
}
