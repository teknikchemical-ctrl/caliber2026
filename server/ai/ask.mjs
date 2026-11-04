import {openDb} from '../_lib/db.mjs';
import {ask} from '../../spi/ai/ask.js';
const rate=new Map();
export default async function handler(req,res){
 res.setHeader('cache-control','no-store');
 if(req.method!=='POST'){res.statusCode=405;res.setHeader('content-type','application/json');return res.end(JSON.stringify({error:'Use POST to ask the AI'}))}
 if(typeof req.body?.question!=='string'||!req.body.question.trim()||req.body.question.length>2000||JSON.stringify(req.body).length>30000){res.statusCode=400;res.setHeader('content-type','application/json');return res.end(JSON.stringify({error:'A valid question of at most 2000 characters is required'}))}
 const key=String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'local').split(',')[0],now=Date.now(),old=rate.get(key),slot=old&&now-old.at<60000?old:{at:now,count:0};if(rate.size>2000)rate.clear();rate.set(key,slot);if(++slot.count>20){res.statusCode=429;res.setHeader('content-type','application/json');return res.end(JSON.stringify({error:'Too many questions; retry in a minute'}))}
 res.setHeader('content-type','application/x-ndjson; charset=utf-8');res.setHeader('x-accel-buffering','no');const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),25000),emit=event=>res.write(JSON.stringify(event)+'\n');
 try{const answer=await ask({db:openDb(),question:req.body.question,history:Array.isArray(req.body.history)?req.body.history:[],inputs_accepted:req.body.inputs_accepted||[],signal:ctl.signal,onEvent:emit});emit({done:true,...answer})}catch(e){emit({error:e.message,done:true})}finally{clearTimeout(timer);res.end()}
}
