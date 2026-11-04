// POST /api/engine/compare {filters?:{material_no,crit,class,q,family,system,equipment,supplier},
// workbook?:{lead_days:60,safety_stock:2,review_months:1},limit?:50,offset?:0}
// -> {status,data_cutoff,total,workbook_defaults,in_sample:{label,train_months,test_months,
// policies:{current,workbook,dynamic}},holdout:{label,train_months,test_months,policies},
// rows:[{material_no,descr,crit_max,unit_price_idr,initial_stock,in_sample:{current,workbook,dynamic},
// holdout:{current,workbook,dynamic}}],assumptions}. Aggregate policies include avg_stock_value_idr,
// unpriced_parts,orders,ordered_qty,stockout_part_months,shortage_qty,total_demand,filled_qty,
// fill_rate,service_level,part_months. Per-part policies include parameters,avg_onhand,
// avg_stock_value_idr,months_stockout,orders,fill_rate,service_level,timeline and ending pipeline.
// Default policy uses a precomputed compact cache (no timelines); include_timeline:true
// requests live detailed replay. Non-default workbook assumptions recompute.
// Summary covers every filtered part; rows paginated <=100. No actual savings assertion.
import {openDb,json,integer,endpoint} from './_shared.mjs';
import {readFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import {selected} from '../../spi/engine/optimise.js';
import {comparePolicies,compareCached} from '../../spi/engine/compare.js';
let cached;
export default endpoint('POST',(req,res)=>{const b=req.body||{},limit=integer(b.limit,1,100,50),offset=integer(b.offset,0,100000,0),filters=b.filters||{},w=b.workbook||{},defaults=Object.keys(w).every(k=>({lead_days:60,safety_stock:2,review_months:1})[k]===w[k]),file=new URL('../../spi/engine/compare_data.json.gz',import.meta.url),full=!process.env.SPI_DB||path.resolve(process.env.SPI_DB)===path.resolve('spi/db/spi.sqlite');
 if(full&&defaults&&!b.include_timeline&&existsSync(file)){cached??=JSON.parse(gunzipSync(readFileSync(file)));const complex=['system','equipment','supplier'].some(k=>filters[k]);return json(res,200,compareCached(cached,{filters,limit,offset,ids:complex?new Set(selected(openDb(),filters).map(p=>p.material_no)):null}));}
 json(res,200,comparePolicies(openDb(),{filters,workbook:w,limit,offset}));});
