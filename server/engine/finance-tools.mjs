// GET /api/engine/finance-tools -> {version,read_only:true,definitions:[function schema]}.
// POST {tool:string,args?:object} -> {id,answer,data_cutoff,tool,scope,inputs,
// highlights:[{metric,value,display,id}],facts:[{id,origin,metric,value,display,unit,
// basis,source,data_cutoff}],assumptions,prohibitions}.
// Tools: get_financial_summary,forecast_inventory_budget,assess_cleanup_case,
// assess_availability_funding,get_policy_validation,rank_cleanup_candidates. All arithmetic is deterministic. Citation IDs are
// scenario/config specific; display fields contain permitted rounded numbers.
// null means Not in baseline data or threshold not attainable, never zero.
// This endpoint prepares tools for the AI owner; it does not edit/register AI tools.
import {readFileSync} from 'node:fs';
import {financeToolDefinitions,runFinanceTool} from '../../spi/engine/financeTools.js';
import {json,fail} from './_shared.mjs';
let context;
export function getFinanceContext(){return context??={impact:JSON.parse(readFileSync(new URL('../../spi/engine/impact_data.json',import.meta.url),'utf8')),validation:JSON.parse(readFileSync(new URL('../../spi/engine/validation_data.json',import.meta.url),'utf8')),source:JSON.parse(readFileSync(new URL('../../spi/engine/economics_data.json',import.meta.url),'utf8'))};}
export default function handler(req,res){try{
 if(req.method==='GET'||!req.method)return json(res,200,{version:'finance-tools-1.0',read_only:true,definitions:financeToolDefinitions});
 if(req.method!=='POST')return fail(res,405,'Method not allowed');
 json(res,200,runFinanceTool(req.body?.tool,req.body?.args??{},getFinanceContext()));
 }catch(e){fail(res,400,e.message)}}
