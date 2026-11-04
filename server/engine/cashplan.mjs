// GET /api/engine/cashplan [?payment_lag_months=0&limit=50&offset=0] or POST
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
import {cashPlan} from '../../spi/engine/cashplan.js';
export default function handler(req,res){try{if(req.method&&!['GET','POST'].includes(req.method))return fail(res,405,'Method not allowed');
 const source=JSON.parse(readFileSync(new URL('../../spi/engine/cashplan_data.json',import.meta.url),'utf8')),config=JSON.parse(readFileSync(new URL('../../spi/engine/impact_data.json',import.meta.url),'utf8')).config,b=req.method==='POST'?(req.body||{}):(req.query||{});
 for(const[k,v]of Object.entries(b.inputs||{})){if(!['scope','release_realisation'].includes(k)||typeof v!=='number')throw new Error('Unsupported cash-plan input');config.inputs[k].value=v;}
 json(res,200,cashPlan(source,config,{payment_lag_months:integer(b.payment_lag_months,0,12,0),limit:integer(b.limit,1,100,50),offset:integer(b.offset,0,100000,0)}));
 }catch(e){fail(res,400,e.message)}}
