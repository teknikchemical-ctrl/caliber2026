import {inventoryList,inventoryKinds} from './inventory.js';
import {financeToolDefinitions,runFinanceTool} from '../engine/financeTools.js';
import {schemaErrors} from './validate.js';
import {executePlan} from './execute.js';
import {metricNames} from './metrics.js';
import {dataFor} from './data.js';
import {VIEW_NAMES,runView} from './views_route.js';
import {SCOPE_TOOLS,runScope} from './scope.js';
import {describeDatabase,queryRecords} from './dbread.js';
import {mlSummary,mlPart,mlFlags} from './ml.js';
import {PAGE_IDS,readPage,TOPICS,readTopic,planPart,CASE_IDS,caseQuestion} from './pages.js';
const id={type:'integer',minimum:1},str={type:'string',maxLength:100},filters={q:str,crit:str,class:str,system:str,limit:{type:'integer',minimum:1,maximum:20}};
const schemas={inventory_metric:{metric:{enum:metricNames},material_no:id,criticality:{enum:['S','A','B','C']},demand_class:str,tag:str},search_parts:{text:str,tag:str,family:str,class:str,criticality:str},get_part_profile:{material_no:id},get_demand_series:{material_no:id,months:{type:'integer',minimum:1,maximum:24}},get_equipment_context:{tag:str},get_pm_schedule:{tag:str,from:str,to:str},get_procurement:{material_no:id},get_inventory_position:filters,run_forecast:{material_no:id},run_optimise:{limit:{type:'integer',minimum:1,maximum:20}},simulate_scenario:{stock_multiplier:{type:'number',minimum:0,maximum:3},service_level:{type:'number',minimum:.8,maximum:.999},lead_time_multiplier:{type:'number',minimum:.25,maximum:3}},explain_recommendation:{material_no:id},search_locations:filters,get_location:{funcloc:str},get_maintenance_summary:{},get_projection:{by:{enum:['all','crit','item_type']}},get_savings:{},get_stock_health:{},get_campaigns:{},get_engine_report:{},get_procurement_findings:{}};
const scope={type:'object',additionalProperties:false,properties:{material_no:id,crit:str,class:str,q:str,family:str,system:str,equipment:str,supplier:str}};
schemas.run_optimise.filters=scope;schemas.run_optimise.policy={type:'object',additionalProperties:false,properties:{holding_rate:{type:'number',minimum:.01,maximum:1},ordering_cost_idr:{type:'number',minimum:1,maximum:100000000}}};schemas.simulate_scenario.scope=scope;schemas.simulate_scenario.material_no=id;schemas.simulate_scenario.demand_multiplier={type:'number',minimum:.25,maximum:3};delete schemas.get_inventory_position.system;
schemas.get_stock_health={cat:{enum:['zero_stock','below_min','excess','no_max','slow','non_moving','insurance','review_obsolete','nonstock_with_stock']},crit:{enum:['S','A','B','C']},limit:{type:'integer',minimum:1,maximum:20}};
schemas.inventory_list={kind:{enum:inventoryKinds},equipment:str,material_no:id,limit:{type:'integer',minimum:1,maximum:10}};
const required={inventory_list:['kind'],inventory_metric:['metric'],get_part_profile:['material_no'],get_demand_series:['material_no'],get_equipment_context:['tag'],get_pm_schedule:['tag'],get_procurement:['material_no'],run_forecast:['material_no'],explain_recommendation:['material_no'],get_location:['funcloc']};
Object.assign(schemas,SCOPE_TOOLS);required.activity_on_date=['date'];required.find_entities=['text'];
schemas.get_page={page:{enum:PAGE_IDS}};required.get_page=['page'];schemas.brief_topic={topic:{enum:Object.keys(TOPICS).filter(k=>TOPICS[k][1])}};required.brief_topic=['topic'];schemas.plan_part={material_no:id};required.plan_part=['material_no'];schemas.case_question={q:{enum:CASE_IDS}};required.case_question=['q'];
schemas.describe_database={};schemas.ml_summary={};schemas.ml_part={material_no:id};required.ml_part=['material_no'];schemas.ml_flags={kind:{enum:['critical_below_lead_demand','max_below_learned_demand','stock_far_above_learned_need','no_max_with_demand','min_above_max']}};schemas.query_records={table:{type:'string',maxLength:40},filters:{type:'object'},sort:{type:'string',maxLength:40},desc:{type:'boolean'},limit:{type:'integer',minimum:1,maximum:20},count_only:{type:'boolean'}};required.query_records=['table'];
schemas.get_view={name:{enum:VIEW_NAMES},material_no:id};required.get_view=['name'];
export const toolDefinitions=Object.entries(schemas).map(([name,properties])=>({name,description:name.replaceAll('_',' ')+' from the baseline database or deterministic engine; no SQL arguments accepted',parameters:{type:'object',properties,required:required[name]||[],additionalProperties:false}})).concat(financeToolDefinitions);
const endpoints={search_locations:()=>import('../../server/data/locations.mjs'),get_location:()=>import('../../server/data/location.mjs'),get_maintenance_summary:()=>import('../../server/data/maintenance.mjs'),get_projection:()=>import('../../server/data/projection.mjs'),get_savings:()=>import('../../server/data/savings.mjs'),get_stock_health:()=>import('../../server/data/stock-health.mjs'),get_campaigns:()=>import('../../server/data/campaigns.mjs'),get_inventory_position:()=>import('../../server/data/parts.mjs'),get_equipment_context:()=>import('../../server/data/equipment/[tag].mjs'),run_optimise:()=>import('../../server/engine/optimise.mjs'),simulate_scenario:()=>import('../../server/engine/simulate.mjs')};
async function callEndpoint(name,args,db){const {openDb}=await import('../../server/_lib/db.mjs');if(db!==openDb())throw new Error('Endpoint tool requires the shared database connection');const endpoint=(await endpoints[name]()).default;return new Promise((resolve,reject)=>{let status=200;const res={setHeader(){},get statusCode(){return status},set statusCode(x){status=x},end(text){try{const value=JSON.parse(text);if(status>=400)reject(new Error(value.error||'Data endpoint failed'));else resolve(value)}catch(e){reject(e)}}};const method=['run_optimise','simulate_scenario'].includes(name)?'POST':'GET';Promise.resolve(endpoint({method,url:'/api/data/tool?'+new URLSearchParams(args),query:args,body:args},res)).catch(reject)})}
export function createTools(db,{signal,inputs_accepted=[],adapter}={}){const clean=dataFor(db);return {definitions:toolDefinitions,async run(name,args={}){
 const definition=toolDefinitions.find(t=>t.name===name);if(!definition)throw new Error('Unknown read-only tool');const errors=schemaErrors(args,definition.parameters);if(errors.length)throw new Error('Invalid tool arguments: '+errors.join('; '));
 if(signal?.aborted)throw new Error('Request time budget reached');
 if(financeToolDefinitions.some(t=>t.name===name)){const {getFinanceContext}=await import('../../server/engine/finance-tools.mjs');return clean.stamp(runFinanceTool(name,args,getFinanceContext()),[],{money:'IDR (Estimate)',ratios:'fractions (Assumption or Estimate)'})}
 if(name==='inventory_list')return inventoryList(db,args);
 if(name==='inventory_metric')return clean.metric(args);
 if(name==='search_parts')return {id:'search:parts',...clean.parts(args)};
 if(name==='get_part_profile'){const part=clean.part(args.material_no);return {id:'profile:'+args.material_no,...part,facts:[{id:'profile:'+args.material_no,origin:'material',value:part}]}}
 if(name==='get_demand_series'){const series=clean.demand(args.material_no,args.months?{months:args.months}:{});return {id:'series:'+args.material_no,...series,months_returned:series.rows.length,facts:[{id:'series:'+args.material_no,origin:'movement',value:series.rows}]}}
 if(name==='get_procurement')return {id:'procurement:'+args.material_no,...clean.procurement(args.material_no),lead:clean.planningLead(args.material_no)};
 if(name==='get_pm_schedule')return {id:'pm:'+args.tag,...clean.pmSchedule(args.tag,{...(args.from?{from:args.from}:{}),...(args.to?{to:args.to}:{})})};
 if(name==='run_forecast'||name==='explain_recommendation'){const value=await executePlan({db,material_no:args.material_no,inputs_accepted,signal,...(adapter?{adapter}:{})});return {id:'forecast:'+args.material_no,...clean.stamp(value,['forecast:'+args.material_no],{forecast:'material units (Estimate)',inventory:'material units (Estimate)'})}}
 if(['run_optimise','simulate_scenario'].includes(name)){const {selected}=await import('../engine/optimise.js');const filters=args.filters||args.scope||(args.material_no?{material_no:args.material_no}:{});const limit=name==='simulate_scenario'?10000:50;if(selected(db,filters).length>limit)throw new Error('Select at most fifty parts for interactive optimisation, or at most 10000 parts for simulation.')}
 if(SCOPE_TOOLS[name])return runScope(db,name,args);
 if(name==='describe_database')return describeDatabase(db);
 if(name==='ml_summary')return mlSummary(db);
 if(name==='ml_part')return mlPart(db,args);
 if(name==='ml_flags')return mlFlags(db,args);
 if(name==='query_records')return queryRecords(db,args);
 if(name==='get_page')return readPage(db,args);
 if(name==='brief_topic')return readTopic(db,args);
 if(name==='plan_part')return planPart(db,args);
 if(name==='case_question')return caseQuestion(db,args);
 if(name==='get_view')return runView(db,args.name,args);
 if(name==='get_procurement_findings')return {id:'procurement:findings',...clean.procurementFindings()};
 if(name==='get_engine_report'){const {readFile}=await import('node:fs/promises');const data=JSON.parse(await readFile(new URL('./engine_report.json',import.meta.url),'utf8'));return {id:'engine:report',data:clean.cleanToolResult(data,'engine:report')}}
 const source=await callEndpoint(name,args,db),key=name==='get_location'||name==='get_equipment_context'?'loc:'+source.equipment.funcloc:name==='get_maintenance_summary'?'maint:summary':'data:'+name;
 const data=clean.cleanToolResult(source,key);
 if(name==='simulate_scenario'){
  const n=v=>Number(v).toLocaleString('en-US',{maximumFractionDigits:2});
  const scope=args.scope?.equipment||args.scope?.material_no||args.material_no||'all materials';
  const b=source.baseline,s=source.scenario;
  const bn=v=>v==null?'not priced':'IDR '+(v/1e9).toFixed(2)+' bn',sv=v=>v==null?'not available':n(v*100)+'%',set=s.settings,chg=[set.stock_multiplier!==1?'stock multiplier '+set.stock_multiplier:'',set.lead_time_multiplier!==1?'lead time multiplier '+set.lead_time_multiplier:'',set.demand_multiplier!==1?'demand multiplier '+set.demand_multiplier:''].filter(Boolean).join(', ')||'no change';
  const worse=s.expected_stockouts_yr>b.expected_stockouts_yr;
  return {id:key,data,answer:(scope==='all materials'?'Across all '+n(b.parts)+' materials':'For '+scope+' ('+n(b.parts)+' materials)')+', with '+chg+', priced inventory moves from **'+bn(b.stock_value_idr)+'** to **'+bn(s.stock_value_idr)+'** (Estimate). Modelled stockout cycles '+(worse?'rise':'change')+' from '+n(Math.round(b.expected_stockouts_yr))+' to **'+n(Math.round(s.expected_stockouts_yr))+' a year**, and average service goes from '+sv(b.service_level)+' to '+sv(s.service_level)+'. Insurance reserves keep their floor, and the result is a model estimate, not a release or purchase plan.'};
 }
 return {id:key,data};
}}}
