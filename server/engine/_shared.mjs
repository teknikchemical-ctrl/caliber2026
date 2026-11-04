import {openDb} from '../_lib/db.mjs';
import {fail,qs} from '../_lib/http.mjs';
export {openDb,fail,qs};
export function json(res,status,body){res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');res.end(JSON.stringify(body))}
export const integer=(x,lo,hi,def)=>{if(x==null){if(def===undefined)throw new Error('Required integer missing');return def;}const n=Number(x);if(!Number.isInteger(n)||n<lo||n>hi)throw new Error('Integer outside allowed range');return n};
export function endpoint(method,fn){return async(req,res)=>{res.setHeader('cache-control','no-store');if(req.method&&req.method!==method){res.setHeader('allow',method);return fail(res,405,'Method not allowed')}try{return await fn(req,res)}catch(e){return fail(res,e.status||(/not in baseline/i.test(e.message)?404:400),String(e.message).slice(0,200))}}}
