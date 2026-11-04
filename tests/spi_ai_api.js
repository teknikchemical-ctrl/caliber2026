const assert=require('node:assert/strict'),{spawn}=require('node:child_process');
(async()=>{const port=8851,s=spawn('node',['tools/spi_dev.mjs',String(port),'fixture'],{stdio:'ignore',env:{...process.env,AI_PROVIDER:'mock',VERCEL_GIT_COMMIT_SHA:'synthetic-deploy-test'}});try{
 for(let i=0;i<60;i++){try{if((await fetch(`http://localhost:${port}/api/data/health`)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 const base=`http://localhost:${port}/api/ai`,post=(body)=>fetch(base+'/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 const health=await fetch(base+'/health').then(r=>r.json());assert(health.ok);assert.equal(health.provider,'mock');assert.equal(health.deployment_commit,'synthetic-deploy-test');assert(!Object.hasOwn(health,'key'));console.log('ok   Vercel-style health explicitly verifies mock provider and deployment identity');
 assert.equal((await fetch(base+'/plan')).status,405);assert.equal((await post({material_no:'wrong'})).status,400);assert.equal((await post({material_no:9999999999})).status,404);
 const response=await post({material_no:4100000129}),body=await response.json();assert.equal(response.status,200);assert(body.plan&&body.trace&&body.evidence);assert(['engine_pending','ready'].includes(body.status));if(body.status==='engine_pending'){assert.equal(body.result,null);assert(!body.adopted)}else{assert.equal(body.result.material_no,body.plan.material_no);assert.equal(body.result.forecast.length,body.plan.horizon_months)}
 assert.equal((await post({material_no:4100000129,inputs_accepted:[{effect:'multiply',value:1e9}]})).status,400);console.log('ok   plan API validates requests, reads SQLite, plans and reports engine availability honestly');
 console.log('All SPI AI endpoint checks passed');
}finally{s.kill()}})().catch(e=>{console.error(e);process.exitCode=1});
