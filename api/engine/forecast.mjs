// POST {material_no, plan?, inputs?, horizon?, policy?} -> ForecastResult per spi/contracts/forecast_result.schema.json. Quantities in material units, IDR estimates, dates anchored to data_cutoff. Invalid bounds: 400; unknown material: 404.
import {openDb,json,integer,endpoint} from './_shared.mjs';
import {contextFor} from '../../spi/engine/context.js';
import {runPlan,defaultPlan} from '../../spi/engine/runPlan.js';
export default endpoint('POST',(req,res)=>{const b=req.body||{},id=integer(b.material_no,1,1e12),ctx=contextFor(openDb(),id);ctx.policy=b.policy||{};const plan=b.plan?{...b.plan}:defaultPlan(ctx,{horizon_months:integer(b.horizon,1,18,12)});if(plan.material_no!==id)throw new Error('Material and plan must match');if(b.inputs)plan.inputs=b.inputs;const result=runPlan(plan,ctx);delete result._distribution;json(res,200,result)});
