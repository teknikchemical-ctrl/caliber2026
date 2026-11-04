// GET /api/engine/cashplan [?payment_lag_months=0&limit=50&offset=0] or POST
// include_forward=true (POST) or include_forward=1 (GET) also returns a separate
// forward_budget:{basis,proposed_purchase_cash_idr,months,assumptions} from the
// 12-month repeat-order model; actual current order dates remain unchanged.
// {inputs?:{scope,release_realisation},payment_lag_months?:0,limit?:50,offset?:0}
// -> {status,data_cutoff,release_start_month,release_end_month,payment_lag_months,
// total_orders,unpriced_orders,proposed_orders_idr,capital_release_idr,peak_capital_funding_idr,
// months:[{month,order_parts,order_qty,proposed_orders_idr,unpriced_orders,
// proposed_purchase_cash_idr,capital_release_idr,planned_maintenance_items,
// net_capital_cash_idr,cumulative_release_idr,cumulative_purchase_cash_idr,
// cumulative_net_capital_cash_idr}],orders:[{material_no,descr,crit_max,action,order_qty,
// order_by,estimated_arrival,lead_proxy_days,unit_price_idr,value_idr,campaign_months}],
// campaign,assumptions}. Summary includes all proposals; orders paginated <=100.
// Reads generated rules snapshot, never writes to DB and never approves a purchase.
import {readFileSync} from 'node:fs';
import {json,fail,integer} from './_shared.mjs';
import {economics} from '../../spi/engine/economics.js';
import {cashPlan} from '../../spi/engine/cashplan.js';
let forwardSource;
export default function handler(req,res){try{if(req.method&&!['GET','POST'].includes(req.method))return fail(res,405,'Method not allowed');
 const source=JSON.parse(readFileSync(new URL('../../spi/engine/cashplan_data.json',import.meta.url),'utf8')),config=JSON.parse(readFileSync(new URL('../../spi/engine/impact_data.json',import.meta.url),'utf8')).config,b=req.method==='POST'?(req.body||{}):(req.query||{});
 for(const[k,v]of Object.entries(b.inputs||{})){if(!['scope','release_realisation'].includes(k)||typeof v!=='number')throw new Error('Unsupported cash-plan input');config.inputs[k].value=v;}
 const result=cashPlan(source,config,{payment_lag_months:integer(b.payment_lag_months,0,12,0),limit:integer(b.limit,1,100,50),offset:integer(b.offset,0,100000,0)});if(b.include_forward===true||b.include_forward==='1'){forwardSource??=JSON.parse(readFileSync(new URL('../../spi/engine/economics_data.json',import.meta.url),'utf8'));const p=economics(forwardSource,{holding_cash_rate:config.inputs.holding_cash_rate.value,holding_economic_rate:config.inputs.holding_economic_rate.value}).policies.dynamic;result.forward_budget={basis:'Estimate: separate fixed-policy forecast of future review/order months, not rescheduled current recommendations',proposed_purchase_cash_idr:p.purchase_cash_idr,months:p.months.map(m=>({month:m.month,purchase_cash_idr:m.purchase_cash_idr,order_parts:m.order_parts,unpriced_order_parts:m.unpriced_order_parts})),assumptions:['Current order-by dates are unchanged. Repeat orders use the campaign-adjusted mean path, inventory position including simulated pipeline, and payment at order.','Future review months are a planning Assumption, not supplier commitments; no procurement is approved.']};}json(res,200,result);
 }catch(e){fail(res,400,e.message)}}
