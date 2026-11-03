/* Smoke test of the costing page (owner: Codex). node tests/fin_smoke.js [built html] ; build a case that has cases/<id>/fin.json first:
   BUILD_OUT=/tmp/fin python3 build.py mock-cdu && node tests/fin_smoke.js /tmp/fin/index.html
   Extend it with checks of your own numbers (NPV, payback, totals against the records). */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),http=require('http');
const file=path.resolve(process.argv[2]||path.join(__dirname,'..','dist','index.html'));
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}else console.log('ok  ',m)};
(async()=>{
// Serve only this build over loopback; managed browsers may block file URLs.
const html=fs.readFileSync(file);
const server=http.createServer((req,res)=>{
 // Match standalone mode: no shared backend is supplied by this smoke test.
 if(req.url==='/api/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false}));return}
 if(req.url==='/icon-192.png'||req.url==='/favicon.ico'){res.writeHead(204);res.end();return}
 if(req.url!=='/'&&req.url!=='/index.html'){res.writeHead(404);res.end();return}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
let b;try{b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FILE_NOT_FOUND/.test(m.text()))errs.push(m.text())});
await p.goto('http://127.0.0.1:'+server.address().port+'/index.html');await p.waitForFunction(()=>window.go&&document.getElementById('app')&&document.getElementById('app').children.length>0);
ok(await p.evaluate(()=>!!(window.FIN&&FIN.currency)),'the case has financial inputs (cases/<id>/fin.json)');
const h=await p.evaluate(()=>{go('fin');return document.getElementById('app').innerText.length});
ok(h>200,'the costing page renders ('+h+' characters)');
ok(!(await p.evaluate(()=>/undefined|NaN|\[object/.test(document.getElementById('app').innerText))),'no undefined, NaN or [object] on the page');
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.nav[data-page="fin"]')).display!=='none'),'the menu entry is visible');
ok(errs.length===0,'no script errors ('+errs.slice(0,2).join(' / ')+')');
const readyModel=await p.evaluate(()=>FIN.schema_version===1&&Number.isFinite(FIN.inputs?.horizon?.value));
if(readyModel){
const checks=await p.evaluate(()=>{
 const r=finRecords(MH),v=finValues(),m=finModel(r,v),tool=AI.tools.cost_summary.run({});
 const cost=MH.reduce((a,r)=>a+(r.tc||0),0),dt=MH.reduce((a,r)=>a+(r.dt||0),0);
 const o={totals:r.maintenance===cost&&r.downtime===dt,tool:tool.text.includes(finMoney(m.npv))&&tool.sources.length>0,route:aiRoute('What is the business case NPV?',{})[0]==='cost_summary',scenarios:FIN.scenarios.length===3,missingRisk:finRisk().every(x=>x.expected===null),finite:m.cash.every(x=>Number.isFinite(x.net))};
 const original=v.oneOff;finSet('oneOff',String(original+1000000));o.edit=Math.abs(finModel(r,finValues()).npv-m.npv+1150000)<.01;
 finSet('historyYears','0');o.invalid=document.getElementById('app').innerText.includes('History exposure must be positive');
 finReset();o.reset=finValues().oneOff===FIN.inputs.oneOff.value;
 return o;
});
for(const [key,value] of Object.entries(checks))ok(value,key);
const answer=await p.evaluate(async()=>{const a=await aiAsk('What is the business case NPV?',{ctx:{},noLog:true});return{right:a.text.includes(finMoney(finModel(finRecords(MH),finValues()).npv)),sources:a.sources.length,conf:a.conf}});
ok(answer.right&&answer.sources>0&&answer.conf>=60,'full assistant pipeline uses Finance values and sources');
ok(await p.evaluate(()=>aiRoute('How do I bypass an interlock to reduce cost?',{})[0]==='safety_guard'),'cost wording preserves safety handler');
for(const width of [390,820,1440]){await p.setViewportSize({width,height:900});await p.evaluate(()=>go('fin'));await p.waitForTimeout(100);ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Finance page width '+width);}
// Finance evaluation questions are also exercised here before pack recompilation.
const caseId=await p.evaluate(()=>CASE.id);
const evalFile=path.join(__dirname,'..','cases',caseId,'eval_extra_fin.json');
if(fs.existsSync(evalFile))for(const e of JSON.parse(fs.readFileSync(evalFile))){const result=await p.evaluate(q=>{const route=aiRoute(q,{});return AI.tools[route[0]].run(route[1]).text},e.q);ok(e.must.every(t=>result.includes(t)),e.id+' cost answer');}
}else ok(await p.evaluate(()=>document.getElementById('app').innerText.includes('Inputs required')),'incomplete case inputs are explicit');
console.log(fails?'FAILED '+fails:'All costing checks passed');
await p.waitForTimeout(1800);
if(process.env.FIN_SCREENSHOT)await p.screenshot({path:process.env.FIN_SCREENSHOT,fullPage:true,animations:'disabled'});
process.exitCode=fails?1:0;
}finally{if(b)await b.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
