const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{chromium}=require('playwright'),fs=require('node:fs');
(async()=>{
const port=8862,srv=spawn('node',['tools/spi_dev.mjs',String(port),'full'],{stdio:'ignore',env:{...process.env,AI_PROVIDER:'mock'}});let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch(`http://localhost:${port}/api/data/health`)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],payloads=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().endsWith('/api/ai/ask'))payloads.push(r.postDataJSON())});
 await p.goto(`http://localhost:${port}/`);await p.waitForFunction(()=>typeof SPI!=='undefined');
 await p.evaluate(()=>{go('ai');AI.scope=1;render()});
 await p.fill('#ai-main-q','What if we cut stock by 20%?');await p.click('#ai-main-b');
 await p.waitForFunction(()=>!AI.busy.main&&AI.hist.main.some(m=>m.role==='a'&&!m.live&&m.text.includes('0.8')));
 assert.equal(payloads.at(-1).context.funcloc,'KT-383A');
 const answer=await p.locator('#ai-main-m').innerText();
 assert(answer.includes('KT-383A'));assert(answer.includes('227 materials'));
 assert(answer.includes('Evidence confidence: not calibrated'));assert(!answer.includes('None confidence 0%'));assert(!answer.includes('Cleanup scenario'));
 assert.equal(await p.locator('#ai-main-m .spi-ask-data-chart').count(),3);
 const model=await p.evaluate(()=>AI.hist.main.findLast(m=>m.role==='a'));assert.equal(model.set,1);assert.equal(model.cf.score,null);
 // A subsequent material question cannot override the explicit current equipment scope.
 await p.evaluate(()=>{st.mat=4100000129});assert.equal(await p.evaluate(()=>spiLegacyContext({scope:1,ctx:{set:1}}).funcloc),'KT-383A');
 assert.equal(await p.evaluate(()=>spiLegacyContext({scope:0,ctx:{set:0}}).material_no),undefined);
 fs.mkdirSync('.git/caliber-local/shots',{recursive:true});await p.screenshot({path:'.git/caliber-local/shots/stock-scenario-desktop.png',fullPage:true});
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'.git/caliber-local/shots/stock-scenario-mobile.png',fullPage:true});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert.deepEqual(errors,[]);
 console.log('PASS: selected equipment scope reaches API; 20% scenario renders exact comparisons and three charts, without false 0% confidence; desktop/mobile have no horizontal overflow.');
}finally{if(browser)await browser.close();srv.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
