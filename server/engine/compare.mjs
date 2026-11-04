// POST /api/engine/compare {filters?:{material_no,crit,class,q,family,system,equipment,supplier},
// workbook?:{lead_days:60,safety_stock:2,review_months:1},limit?:50,offset?:0}
// -> {status,data_cutoff,total,workbook_defaults,in_sample:{label,train_months,test_months,
// policies:{current,workbook,dynamic}},holdout:{label,train_months,test_months,policies},
// rows:[{material_no,descr,crit_max,unit_price_idr,initial_stock,in_sample:{current,workbook,dynamic},
// holdout:{current,workbook,dynamic}}],assumptions}. Aggregate policies include avg_stock_value_idr,
// unpriced_parts,orders,ordered_qty,stockout_part_months,shortage_qty,total_demand,filled_qty,
// fill_rate,service_level,part_months. Per-part policies include parameters,avg_onhand,
// avg_stock_value_idr,months_stockout,orders,fill_rate,service_level,timeline and ending pipeline.
// Summary covers every filtered part; rows paginated <=100. No actual savings assertion.
import {openDb,json,integer,endpoint} from './_shared.mjs';
import {comparePolicies} from '../../spi/engine/compare.js';
export default endpoint('POST',(req,res)=>{const b=req.body||{};json(res,200,comparePolicies(openDb(),{filters:b.filters||{},workbook:b.workbook||{},limit:integer(b.limit,1,100,50),offset:integer(b.offset,0,100000,0)}))});
