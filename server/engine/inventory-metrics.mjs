// POST {material_no,service_level?:0.95,underage_cost_idr_unit?,overage_cost_idr_unit?}
// -> {material_no,data_cutoff,id,method,unit,lead_proxy_days,decision,evidence}.
// decision contains current/service_target loss metrics, cost_optimum (null without
// both explicit costs), missing reason and <=~85 stock/service/shortage curve points.
// Metrics: no-shortage probability, expected unit fill, expected shortage/surplus,
// 95% shortage VaR/CVaR in material units. Cost is IDR per protection period.
import {openDb,json,integer,endpoint} from './_shared.mjs';
import {contextFor,runPlan,defaultPlan} from '../../spi/engine/index.js';
import {hash} from '../../spi/engine/runPlan.js';
import {inventoryDecision} from '../../spi/engine/inventoryMath.js';
export default endpoint('POST',(req,res)=>{const b=req.body||{},ctx=contextFor(openDb(),integer(b.material_no,1,99999999999)),r=runPlan(defaultPlan(ctx),ctx),map=new Map();for(const q of r._distribution)map.set(q,(map.get(q)||0)+1/r._distribution.length);
 const decision=inventoryDecision({distribution:[...map].map(([qty,probability])=>({qty,probability})),stock:ctx.part.stock||0,service_level:b.service_level??r.inventory.service_level,insurance_floor:r.inventory.insurance_spare?1:0,underage_cost_idr_unit:b.underage_cost_idr_unit??null,overage_cost_idr_unit:b.overage_cost_idr_unit??null});
 json(res,200,{id:'inventory-metrics:'+ctx.part.material_no+':'+hash(JSON.stringify(b)+'|'+r.plan_id),material_no:ctx.part.material_no,data_cutoff:ctx.cutoff,method:r.method,unit:ctx.part.unit,lead_proxy_days:r.inventory.lead_time_days,decision,evidence:r.provenance});});
