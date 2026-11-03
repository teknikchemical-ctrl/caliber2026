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
console.log(fails?'FAILED '+fails:'All costing checks passed');
if(process.env.FIN_SCREENSHOT)await p.screenshot({path:process.env.FIN_SCREENSHOT,fullPage:true,animations:'disabled'});
process.exitCode=fails?1:0;
}finally{if(b)await b.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
