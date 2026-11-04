// GET /api/engine/economics or POST {inputs?:{demand_factor:1,price_factor:1,
// lead_factor:1,holding_cash_rate:0.04,holding_economic_rate:0.22}}.
// -> {status,data_cutoff,settings,parts,priced_parts,forecast_active_parts,
// priced_forecast_active_parts,history:[{month,priced_consumption_value_idr}],
// policies:{current,workbook,dynamic},by_criticality:[{criticality,parts,priced_parts,policies}],
// assumptions}. Each policy returns 13 months (cut-off + 12 future), purchase_cash_idr,
// cash_holding_idr,economic_holding_indicator_idr,operating_funding_idr,
// consumption_value_idr,unfilled_demand_value_idr,priced_value_fill_rate,
// stockout_part_months,closing_stock_idr,unpriced_order_events.
// Site policies also have signed funding_difference_vs_current_idr and fill difference.
// Month rows contain these monetary fields plus order_parts,unpriced_order_parts,
// closing_stock_idr,stockout_part_months,cumulative_operating_funding_idr.
// Funding = purchase cash + cash holding only. This is not observed savings or a
// historical backtest. Handler reads generated rules source; no shared database write.
import {readFileSync} from 'node:fs';
import {json,fail} from './_shared.mjs';
import {economics} from '../../spi/engine/economics.js';
let source;
export default function handler(req,res){try{if(req.method&&!['GET','POST'].includes(req.method))return fail(res,405,'Method not allowed');source??=JSON.parse(readFileSync(new URL('../../spi/engine/economics_data.json',import.meta.url),'utf8'));json(res,200,economics(source,req.method==='POST'?(req.body?.inputs||{}):{}));}catch(e){fail(res,400,e.message)}}
