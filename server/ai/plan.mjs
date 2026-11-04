import {openDb} from '../_lib/db.mjs';
import {executePlan} from '../../spi/ai/execute.js';
const visitors=new Map();
export function createPlanHandler(deps={}){return async(req,res)=>{
 res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');
 const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body))};
 if(req.method!=='POST')return send(405,{error:'Use POST for a forecast plan'});
 const body=req.body,material_no=body?.material_no;
 if(!Number.isSafeInteger(material_no)||material_no<=0)return send(400,{error:'A valid material_no integer is required'});
 if(JSON.stringify(body).length>30000)return send(413,{error:'The plan request is too large'});
 const id=String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'local').split(',')[0],now=Date.now(),current=visitors.get(id);
 if(visitors.size>2000)for(const[k,v]of visitors)if(now-v.start>=60000)visitors.delete(k);
 const usage=current&&now-current.start<60000?current:{start:now,count:0};visitors.set(id,usage);
 if(++usage.count>20){res.setHeader('retry-after','60');return send(429,{error:'Too many plan requests. Wait a minute and retry.'})}
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),25000);
 try{
  const response=await executePlan({db:(deps.openDb||openDb)(),material_no,inputs_accepted:body.inputs_accepted||[],signal:ctl.signal,...(deps.adapter?{adapter:deps.adapter}:{}),...(deps.engine?{engine:deps.engine}:{})});
  return send(200,response);
 }catch(e){return send(e.status||(/not found/i.test(e.message)?404:503),{error:e.message})}finally{clearTimeout(timer)}
}}
export default createPlanHandler();
