/* Smoke test of the costing page (owner: Codex). node tests/fin_smoke.js [built html] ; build a case that has cases/<id>/fin.json first:
   BUILD_OUT=/tmp/fin python3 build.py mock-cdu && node tests/fin_smoke.js /tmp/fin/index.html
   Extend it with checks of your own numbers (NPV, payback, totals against the records). */
const {chromium}=require('playwright'),path=require('path');
const file=path.resolve(process.argv[2]||path.join(__dirname,'..','dist','index.html'));
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}else console.log('ok  ',m)};
(async()=>{const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FILE_NOT_FOUND/.test(m.text()))errs.push(m.text())});
await p.goto('file://'+file);await p.waitForFunction(()=>window.go&&document.getElementById('app')&&document.getElementById('app').children.length>0);
ok(await p.evaluate(()=>!!(window.FIN&&FIN.currency)),'the case has financial inputs (cases/<id>/fin.json)');
const h=await p.evaluate(()=>{go('fin');return document.getElementById('app').innerText.length});
ok(h>200,'the costing page renders ('+h+' characters)');
ok(!(await p.evaluate(()=>/undefined|NaN|\[object/.test(document.getElementById('app').innerText))),'no undefined, NaN or [object] on the page');
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.nav[data-page="fin"]')).display!=='none'),'the menu entry is visible');
ok(errs.length===0,'no script errors ('+errs.slice(0,2).join(' / ')+')');
console.log(fails?'FAILED '+fails:'All costing checks passed');await b.close();process.exit(fails?1:0)})();
