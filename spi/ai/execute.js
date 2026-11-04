// Single orchestration boundary: only the deterministic engine creates forecast numbers.
import fs from 'node:fs';
import {evidence} from './evidence.js';
import {planPart} from './planner.js';
import {schemaErrors,validatePlan} from './validate.js';
const resultSchema=JSON.parse(fs.readFileSync(new URL('../contracts/forecast_result.schema.json',import.meta.url),'utf8'));
export async function loadEngine(){
 try{
  // A literal import lets Vercel trace and bundle the published engine dependency.
  const module=await import('../engine/index.js');
  if(typeof module.runPlan!=='function')throw new Error('The engine does not export runPlan');
  return module;
 }catch(e){
  if(e.code!=='ERR_MODULE_NOT_FOUND'||!String(e.url||'').endsWith('/spi/engine/index.js'))throw e;
  throw Object.assign(new Error('The deterministic forecasting engine is not available in this deployment. A validated plan is available; prediction values are not.'),{code:'ENGINE_PENDING'});
 }
}

function checkResult(result,plan,cutoff){
 const errors=schemaErrors(result,resultSchema);
 if(result?.material_no!==plan.material_no)errors.push('Engine returned another material');
 if(result?.method!==plan.method)errors.push('Engine returned a different method');
 if(result?.forecast?.length!==plan.horizon_months)errors.push('Engine forecast does not match the requested horizon');
 const expected=[];let month=new Date(cutoff.slice(0,7)+'-01T00:00:00Z');for(let i=0;i<plan.horizon_months;i++){month.setUTCMonth(month.getUTCMonth()+1);expected.push(month.toISOString().slice(0,7))}
 if(JSON.stringify((result?.forecast||[]).map(r=>r.month))!==JSON.stringify(expected))errors.push('Engine forecast months do not follow the evidence cutoff');
 for(const key of ['min_qty','max_qty','safety_stock','reorder_point','order_qty'])if(!(result?.inventory?.[key]>=0))errors.push('Negative or missing inventory parameter');
 if(result?.inventory?.max_qty<result?.inventory?.min_qty)errors.push('Inventory Max is below Min');
 if(plan.insurance_spare&&['REDUCE','REVIEW_OBSOLETE'].includes(result?.recommendation?.action))errors.push('Protected insurance spare cannot be disposed');
 for(const row of result?.forecast||[])if(!(row.p10>=0&&row.p10<=row.p50&&row.p50<=row.p90))errors.push('Forecast quantiles are unordered or negative');
 if(errors.length)throw new Error('Engine result rejected: '+errors.join('; '));
 return result;
}
export async function executePlan({db,material_no,adapter,engine,engineLoader=loadEngine,inputs_accepted=[],signal}){
 const pack=evidence(db,material_no),reasoning=await planPart(pack,{...(adapter?{adapter}:{}),signal});
 let {plan}=reasoning;const trace=[...reasoning.trace];
 // Browser proposals are untrusted on each request; validate again, including bound and evidence checks.
 if(!Array.isArray(inputs_accepted)||inputs_accepted.length>12)throw Object.assign(new Error('Accepted inputs must be an array with at most twelve entries'),{status:400});
 const accepted=inputs_accepted.map(input=>({...input,source:'user',status:'accepted'}));
 const checked=validatePlan({...plan,inputs:[...(plan.inputs||[]),...accepted]},pack);
 if(!checked.ok)throw Object.assign(new Error('Accepted inputs rejected: '+checked.errors.join('; ')),{status:400});
 let implementation;
 try{implementation=engine||await engineLoader()}catch(e){if(e.code!=='ENGINE_PENDING')throw e;trace.push({step:'engine_unavailable',reason:e.message});return {...reasoning,plan,result:null,proposed_result:null,trace,adopted:false,status:'engine_pending',evidence:pack,ledger:[...(plan.inputs||[]),...accepted]}}
 const context=typeof implementation.contextFor==='function'?{...implementation.contextFor(db,material_no),db}:{db,signal};
 let adopted=false,gate=null;
 if(reasoning.provider==='gemini'){
  if(typeof implementation.backtest==='function'){
   const candidate=await implementation.backtest(plan,context),reference=await implementation.backtest(reasoning.baseline,context);
   gate={...candidate,baseline_error:reference.plan_error,baseline_method:reasoning.baseline.method,baseline_origins:reference.n_origins};
   const valid=Number.isFinite(gate?.plan_error)&&Number.isFinite(gate?.baseline_error)&&gate.plan_error>=0&&gate.baseline_error>=0&&gate.n_origins===4&&gate.baseline_origins===4;
   adopted=valid&&gate.plan_error<=gate.baseline_error*1.1;
  }
  trace.push({step:'backtest',adopted,result:gate,reason:!gate?'Backtest unavailable; use the rules baseline':adopted?'AI plan is within the baseline error tolerance':'AI plan was not adopted'});
 }
 const proposedPlan=plan;
 if(!adopted&&reasoning.provider==='gemini')plan=reasoning.baseline;
 // Unaccepted AI proposals stay in the ledger; only explicit user acceptance changes the execution inputs.
 const execution={...plan,inputs:[...(plan.inputs||[]).filter(i=>i.source!=='ai'&&i.status!=='rejected'),...accepted]};
 const result=checkResult(await implementation.runPlan(execution,{...context,inputs:execution.inputs,signal,enforce_backtest:false}),execution,pack.data_cutoff);
 trace.push({step:'engine',material_no:result.material_no,plan_id:result.plan_id,method:result.method,input_ids:execution.inputs.map(i=>i.input_id).filter(Boolean)});
 return {...reasoning,plan:execution,proposed_plan:proposedPlan,result,proposed_result:null,trace,adopted,status:'ready',evidence:pack,ledger:[...(proposedPlan.inputs||[]),...accepted]};
}
