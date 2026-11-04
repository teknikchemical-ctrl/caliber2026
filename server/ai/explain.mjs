// POST /api/ai/explain : a short reasoning paragraph for any feature result (spi/ai/explain.js). (owner: Claude A)
import {explain} from '../../spi/ai/explain.js';
import {provider} from '../../spi/ai/providers/index.js';
import {openDb} from '../_lib/db.mjs';
export default async function handler(req,res){res.setHeader('content-type','application/json');res.setHeader('cache-control','no-store');
 if(req.method!=='POST'){res.statusCode=405;return res.end(JSON.stringify({error:'Use POST'}))}
 const b=req.body||{};if(JSON.stringify(b).length>20000){res.statusCode=400;return res.end(JSON.stringify({error:'Payload too large'}))}
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),12000);
 try{const out=await explain(b,{adapter:provider(),signal:ctl.signal,db:openDb()});res.end(JSON.stringify(out))}catch(e){res.statusCode=500;res.end(JSON.stringify({error:e.message}))}finally{clearTimeout(t)}}
