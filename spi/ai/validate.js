import fs from 'node:fs';
import {fact} from './evidence.js';
const load=name=>JSON.parse(fs.readFileSync(new URL('../contracts/'+name,import.meta.url),'utf8'));
export const planSchema=load('forecast_plan.schema.json'),inputSchema=load('forecast_input.schema.json');
export function schemaErrors(value,schema,path='$',errors=[]){
 if(schema.$ref)return schemaErrors(value,inputSchema,path,errors);
 const types=[].concat(schema.type||[]), matches=t=>t==='null'?value===null:t==='array'?Array.isArray(value):t==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):t==='integer'?Number.isSafeInteger(value):t==='number'?typeof value==='number'&&Number.isFinite(value):typeof value===t;
 if(types.length&&!types.some(matches)){errors.push(path+': invalid type');return errors}
 if(schema.enum&&!schema.enum.includes(value))errors.push(path+': unsupported value');
 if(typeof value==='number'){if(schema.minimum!=null&&value<schema.minimum)errors.push(path+': below minimum');if(schema.maximum!=null&&value>schema.maximum)errors.push(path+': above maximum')}
 if(typeof value==='string'){if(schema.maxLength&&value.length>schema.maxLength)errors.push(path+': text too long');if(schema.pattern&&!new RegExp(schema.pattern).test(value))errors.push(path+': invalid format')}
 if(Array.isArray(value)){if(schema.minItems&&value.length<schema.minItems)errors.push(path+': too few entries');if(schema.maxItems&&value.length>schema.maxItems)errors.push(path+': too many entries');if(schema.items)value.forEach((v,i)=>schemaErrors(v,schema.items,path+'['+i+']',errors))}
 if(value&&typeof value==='object'&&!Array.isArray(value)){for(const k of schema.required||[])if(!Object.hasOwn(value,k))errors.push(path+'.'+k+': required');for(const [k,v]of Object.entries(value)){if(schema.additionalProperties===false&&!Object.hasOwn(schema.properties||{},k))errors.push(path+'.'+k+': unknown field');if(schema.properties?.[k])schemaErrors(v,schema.properties[k],path+'.'+k,errors)}}
 return errors;
}
const numbers=text=>String(text).match(/-?\d+(?:\.\d+)?/g)||[];
export function unsupportedNumbers(text,pack){const allowed=new Set();const walk=v=>{if(typeof v==='number')allowed.add(Number(v));else if(typeof v==='string')numbers(v).forEach(n=>allowed.add(Number(n)));else if(v&&typeof v==='object')Object.values(v).forEach(walk)};pack.facts.forEach(f=>walk(f.value));return numbers(text).filter(n=>!allowed.has(Number(n)))}
export function validatePlan(plan,pack,{ai=false}={}){
 const errors=schemaErrors(plan,planSchema);if(errors.length)return {ok:false,errors};
 const p=fact(pack,'profile:'),lead=fact(pack,'lead:'),policy=fact(pack,'policy:'),ids=new Map(pack.facts.map(f=>[f.id,f]));
 const checkEvidence=(list,label)=>{if(!list.length)errors.push(label+': evidence is required');for(const id of list)if(!ids.has(id))errors.push(label+': unknown evidence '+id)};
 checkEvidence(plan.evidence,'plan');
 if(plan.material_no!==pack.material_no)errors.push('Plan names a different material');
 const levels=Object.values(policy.service).sort((a,b)=>a-b),base=policy.service[p.crit_max]??policy.service.C;
 const service=v=>levels.includes(v)&&Math.abs(levels.indexOf(v)-levels.indexOf(base))<=1;
 if(!service(plan.service_level))errors.push('Service level must stay within one policy step');
 if(lead.p10!=null&&plan.lead_time_days<lead.p10)errors.push('Lead time is below observed procurement p10');
 if(plan.method==='family_pooled_sba'&&(!fact(pack,'fam:')||plan.params?.pool_family_id!==p.family_id||String(p.family_id).startsWith('T|')||String(fact(pack,'fam:')?.basis).includes('weak')))errors.push('Pooling needs supported family evidence; OEM or weak families are not sufficient');
 if(p.demand_class==='no_demand'&&['S','A'].includes(p.crit_max)&&!plan.insurance_spare)errors.push('Critical no-demand parts require insurance protection');
 for(const input of plan.inputs||[]){
  checkEvidence(input.evidence,'input');if(ai&&(input.source!=='ai'||(input.status&&input.status!=='proposed')))errors.push('AI inputs must remain proposed with source ai');
  if(input.scope&&input.scope!=='part')errors.push('A part plan cannot silently change a broader scope');
  if(input.target&&input.target!==String(pack.material_no))errors.push('Input target differs from evidence scope');
  if(unsupportedNumbers(input.rationale,pack).length)errors.push('Input rationale contains unsupported numbers');
  const v=input.value;
  if(input.effect==='multiply'){if(v<.25||v>3)errors.push('Multiplier outside guardrail');if(v>2&&new Set(input.evidence.map(id=>ids.get(id)?.origin).filter(x=>x&&!['policy','material'].includes(x))).size<2)errors.push('Large multiplier requires independent evidence origins');}
  if(input.effect==='add_qty'&&(v<0||v>10*Math.max(0,...fact(pack,'series:').map(r=>r.qty))))errors.push('Added quantity exceeds history-based bound');
  if(input.effect==='set_lead_days'&&(v<1||v>400||(lead.p10!=null&&v<lead.p10)))errors.push('Lead-time driver outside guardrail');
  if(input.effect==='set_service_level'&&!service(v))errors.push('Service-level driver outside policy');
  if(input.effect==='set_zero_after'&&(input.driver!=='obsolescence'||p.months_since_last==null||p.months_since_last<12||['S','A'].includes(p.crit_max)))errors.push('Obsolescence is unsupported or part is protected');
  if(input.period_start&&input.period_end&&input.period_start>input.period_end)errors.push('Driver period is reversed');
  for(const d of [input.period_start,input.period_end].filter(Boolean)){const month=Number(d.slice(5,7));if(month<1||month>12)errors.push('Invalid driver month');}
 }
 if(unsupportedNumbers(plan.rationale,pack).length)errors.push('Plan rationale contains unsupported numbers');
 return {ok:errors.length===0,errors};
}
