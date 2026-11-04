import {provider} from '../../spi/ai/providers/index.js';
let last={at:0,result:null};
export default async function handler(req,res){
 res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');
 if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'Use GET for the AI health check'}))}
 const name=process.env.AI_PROVIDER||'mock';
 const out={provider:name,key_present:!!process.env.AI_API_KEY,deployment_commit:process.env.VERCEL_GIT_COMMIT_SHA||null,configured_model:process.env.AI_MODEL||null,ok:false,model:null,last_error:null};
 if(last.result&&Date.now()-last.at<30000)return res.end(JSON.stringify({...out,...last.result,cached:true}));
 try{const result=await provider().complete({system:'Connection test. Return the requested JSON object.',messages:[{role:'user',content:'Return {"ready":true}.'}],schema:{type:'object',properties:{ready:{type:'boolean'}},required:['ready']}});if(result.json?.ready!==true)throw new Error('The provider did not return a valid connection-test answer');out.ok=true;out.model=result.model;out.attempts=result.attempts||[];out.note=name==='mock'?'Mock mode works; no real Gemini call was made':'A real model answered';}
 catch(e){out.last_error=e.message;out.attempts=e.attempts||[]}
 last={at:Date.now(),result:out};res.end(JSON.stringify(out));
}
