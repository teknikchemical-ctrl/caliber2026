// Dumps all visible page text (every page, tab and view) to a JSON map. node tools/text_audit.js out.json
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});const p=await b.newPage({viewport:{width:1440,height:900}});p.setDefaultTimeout(120000);
await p.goto('file://'+path.resolve(process.argv[3]||path.join(__dirname,'..','knowledge-hub-integrated_BAP5.html')),{waitUntil:'commit'});await p.waitForFunction(()=>window.go&&document.getElementById('app')&&document.getElementById('app').children.length>0);
const V=[['dashboard',()=>go('dashboard')],['dash analytics',()=>{go('dashboard');clickText('Analytics')}],['mywork',()=>go('mywork')],['equipment',()=>go('equipment')],['plot',()=>{PP.mode='explore';go('plot')}],['hazard',()=>{PP.mode='hazard';go('plot')}],['perf',()=>go('perf')],['scn',()=>go('scn')],['il',()=>go('il')],['ai',()=>go('ai')],['fm',()=>go('fm')],['documents',()=>go('documents')],['opl',()=>go('opl')],['rc',()=>go('rc')],['quality',()=>go('quality')]];
for(const v of ['dash','table','time','pdm','replay','plan'])V.push(['mnt '+v,`()=>{MHS.view='${v}';go('mnt')}`]);
for(const t of ['overview','pid','ga','perf','plot','ready','docs','ds','seq','opl','maint','rel'])V.push(['eq '+t,`()=>go('equipment',{set:4,tab:'${t}'})`]);
for(const t of ['overview','ingest','capture','library','review','quality','qa','audit'])V.push(['ks '+t,`()=>{KS.tab='${t}';go('ks')}`]);
for(const t of ['connectors','model','arch','prov','bundle','usage','graph'])V.push(['int '+t,`()=>{INT.tab='${t}';go('int')}`]);
for(const t of ['controls','feasible','roadmap','biz'])V.push(['gov '+t,`()=>{GOV.tab='${t}';go('gov')}`]);
for(const t of ['rel','know','spares','tgt'])V.push(['perf '+t,`()=>{PERF.tab='${t}';go('perf')}`]);
for(const t of [0,1,2])V.push(['scn tab'+t,()=>{go('scn')}]);
V.push(['opl sheet',()=>go('opl',{opl:K.opl[0].no})],['opl sim',()=>go('opl',{opl:K.opl[0].no,om:'sim',si:0})],['settings',()=>{go('mywork');document.querySelector('[aria-label="Settings"]').click()}],['notif',()=>{go('mywork');document.querySelector('[aria-label="Notifications"]').click()}],['tour',()=>{go('dashboard');document.querySelector('[aria-label="Guided tour"]').click()}]);
const out={};
for(const [n,f] of V){try{await p.evaluate(`(function(){window.clickText=t=>{const e=[...document.querySelectorAll('button,.tab')].find(x=>x.textContent.trim()===t);e&&e.click()};document.querySelectorAll('#setbg,#notifbox,#gsmodal,#tourcard').forEach(e=>e.remove());(${f.toString()})()})()`);await p.waitForTimeout(500);out[n]=await p.evaluate(()=>{const parts=[];for(const id of ['app','setbg','notifbox','tourcard']){const e=document.getElementById(id);if(e)parts.push(e.innerText)}return parts.join('\n')})}catch(e){out[n]='ERR '+e.message.slice(0,80)}}
fs.writeFileSync(process.argv[2]||'/tmp/claude-0/t/text.json',JSON.stringify(out));console.log(Object.keys(out).length,'views');await b.close()})();
