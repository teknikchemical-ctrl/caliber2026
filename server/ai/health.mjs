import {provider} from '../../spi/ai/providers/index.js';
export function createHealthHandler({getProvider=provider}={}){let last={at:0,result:null};return async function handler(req,res){
 res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');
 if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'Use GET for the AI health check'}))}
 const name=process.env.AI_PROVIDER||'mock';
 const out={provider:name,key_present:!!process.env.AI_API_KEY,deployment_commit:process.env.VERCEL_GIT_COMMIT_SHA||null,configured_model:process.env.AI_MODEL||null,ok:false,model:null,one_word_result:null,last_error:null};
 if(last.result&&Date.now()-last.at<30000)return res.end(JSON.stringify({...out,...last.result,cached:true}));
 try{const result=await getProvider().complete({system:'Connection test. Return the requested JSON object with the one-word result READY.',messages:[{role:'user',content:'Return {"ready":true,"word":"READY"}.'}],schema:{type:'object',properties:{ready:{type:'boolean'},word:{type:'string',enum:['READY']}},required:['ready','word']}});if(result.json?.ready!==true||result.json?.word!=='READY')throw new Error('The provider did not return a valid connection-test answer');out.ok=true;out.one_word_result=result.json.word;out.model=result.model;out.attempts=result.attempts||[];out.note=name==='mock'?'Mock mode works; no real Gemini call was made':'A real model answered';}
 catch(e){out.last_error=e.message;out.attempts=e.attempts||[]}
 const redact=v=>typeof v==='string'&&process.env.AI_API_KEY?v.replaceAll(process.env.AI_API_KEY,'[redacted]'):Array.isArray(v)?v.map(redact):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,redact(x)])):v;const safe=redact(out);last={at:Date.now(),result:safe};res.end(JSON.stringify(safe));
}}
export default createHealthHandler();
