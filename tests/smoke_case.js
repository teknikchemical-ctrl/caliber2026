/* Case-neutral smoke test: works on any built case pack.
   node tests/smoke_case.js [path/to/index.html] [--min-eval=70]
   Checks: no script errors while loading and paging, every set renders its P&ID, drawing and datasheet, the assistant answers a question about each set with sources,
   the evaluation questions of the pack score at least --min-eval percent, trips propagate on every P&ID, the scenario engine, hazard model and predictive model run for every set. */
const {chromium}=require('playwright'),path=require('path');
const file=path.resolve(process.argv.find(a=>/\.html$/.test(a))||path.join(__dirname,'..','dist','index.html'));
const minEval=+((process.argv.find(a=>a.startsWith('--min-eval='))||'--min-eval=70').split('=')[1]);
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}else console.log('ok  ',m)};
(async()=>{const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});const p=await b.newPage({viewport:{width:1440,height:900}});p.setDefaultTimeout(240000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FILE_NOT_FOUND/.test(m.text()))errs.push(m.text())});
await p.goto('file://'+file,{waitUntil:'commit'});await p.waitForFunction(()=>window.go&&document.getElementById('app')&&document.getElementById('app').children.length>0,null,{timeout:120000});await p.waitForTimeout(500);
const info=await p.evaluate(()=>({sets:K.sets.map(s=>({n:s.n,tag:s.tag,name:s.name})),title:CASE.title,wo:MH.length,ev:EVAL_CASES.length}));
console.log('pack:',info.title,'|',info.sets.length,'sets |',info.wo,'work orders |',info.ev,'evaluation questions');
ok(errs.length===0,'no script errors while loading ('+errs.slice(0,2).join(' / ')+')');
/* every set: P&ID, drawing, datasheet, interlocks, 3D model data */
const draw=await p.evaluate(()=>K.sets.map(s=>{const o={n:s.n};try{const d=D[s.n];o.pid=!!(d&&d.n.length>3&&d.p.length);o.eff=Object.keys(d.eff||{}).length;o.ga=!!(GAD[s.n]&&GAD[s.n].parts.length);o.g3=!!(G3M[s.n]&&G3M[s.n].length);o.ds=dsView(s.n).length>500;o.il=ilD(s.n)!=null;o.pos=!!POS[s.n]&&!!P3POS[s.n]}catch(e){o.err=e.message}return o}));
draw.forEach(o=>ok(!o.err&&o.pid&&o.ga&&o.g3&&o.ds&&o.il&&o.pos,'set '+o.n+': P&ID, drawing, 3D model, datasheet, interlock and layout present'+(o.err?' ('+o.err+')':'')+(o.eff===0?' [no cause and effect map]':'')));
/* trips propagate */
const trips=await p.evaluate(()=>K.sets.map(s=>{const il=ilD(s.n);if(!il.trig.length)return{n:s.n,skip:1};const t=il.trig[0].tag;P.set=s.n;LIVE.f[s.n+':'+t]=true;let seen=0;try{seen=D[s.n].n.filter(x=>{const r=read(x[0]);return r&&(r.s==='TRIP'||r.s==='EFFECT')}).length}catch(e){}delete LIVE.f[s.n+':'+t];return{n:s.n,t,seen}}));
trips.filter(t=>!t.skip).forEach(t=>ok(t.seen>0,'set '+t.n+': forcing '+t.t+' shows a trip or effect on the P&ID'));
/* assistant answers about each set, with sources */
for(const s of info.sets){const r=await p.evaluate(async tag=>{const x=await aiAsk('What are the start permissives of '+tag+'?',{ctx:{page:'Smoke',set:0,label:'',kw:''},scope:0,history:[],noLog:true});return{t:String(x.text).replace(/<[^>]+>/g,' ').slice(0,160),n:(x.sources||[]).length,c:x.conf}},s.tag);
 ok(r.n>0&&r.t.length>30,'assistant answers about '+s.tag+' with '+r.n+' sources (confidence '+r.c+')')}
/* scenario engine, hazard model, predictive model */
const eng=await p.evaluate(()=>{const o={scn:0,hse:0,pdm:0,err:[]};for(const s of K.sets){try{scnRun({unit:s.n,cause:'',mode:'trip',util:''});o.scn++}catch(e){o.err.push('scn '+s.n+' '+e.message)}
 try{if(hseKey(s.n)){HSE.n=s.n;hseCalc();o.hse++}}catch(e){o.err.push('hse '+s.n+' '+e.message)}try{const r=pdmUnit(s.n);if(r&&r.health!=null)o.pdm++}catch(e){o.err.push('pdm '+s.n+' '+e.message)}}return o});
ok(eng.scn===info.sets.length,'scenario engine runs for all '+info.sets.length+' sets');ok(eng.pdm===info.sets.length,'predictive model scores all sets');console.log('     hazard model ran for',eng.hse,'sets with a flammable fluid');
eng.err.forEach(e=>ok(false,e));
/* evaluation questions */
const ev=await p.evaluate(async()=>{await evalRun();const s=evSummary();return{n:s.n,ok:s.ok,fails:EV.res.filter(r=>!r.pass).slice(0,8).map(r=>r.id+' '+r.q+' => '+r.why.join('; '))}});
const pct=Math.round(ev.ok/Math.max(1,ev.n)*100);ok(pct>=minEval,'evaluation questions: '+ev.ok+' of '+ev.n+' pass ('+pct+'%, minimum '+minEval+'%)');ev.fails.forEach(f=>console.log('     -',f.slice(0,220)));
ok(errs.length===0,'no script errors during the checks ('+errs.slice(0,2).join(' / ')+')');
console.log(fails?'\nFAILED '+fails:'\nAll smoke checks passed');await b.close();process.exit(fails?1:0)})();
