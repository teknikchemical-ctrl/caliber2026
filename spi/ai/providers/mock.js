import {rulesPlan} from '../rules_planner.js';
export function mock(){return {name:'mock',async complete({messages=[],schema}={}){
 if(schema?.properties?.ready)return {json:{ready:true},model:'mock',usage:{input_tokens:0,output_tokens:0},tool_calls:[]};
 const content=messages.at(-1)?.content||'{}';
 const pack=JSON.parse(content.slice(content.indexOf('{'),content.lastIndexOf('}')+1));
 return {json:rulesPlan(pack),model:'rules',usage:{input_tokens:0,output_tokens:0},tool_calls:[]};
}}}
export default mock;
