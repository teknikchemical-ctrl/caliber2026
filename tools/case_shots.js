// Case-neutral crawler: opens every page, tab and equipment set of a built page, records script errors and takes screenshots.
// Usage: node tools/case_shots.js <path/to/index.html> <out-dir> [--quick]
// Exit code 1 if any page throws. Used by tests/smoke_case.js and for visual checks of a new case pack.
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const file=path.resolve(process.argv[2]||'dist/index.html'),out=path.resolve(process.argv[3]||'/tmp/case_shots'),quick=process.argv.includes('--quick');
fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1440,height:900}});p.setDefaultTimeout(60000);
const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FILE_NOT_FOUND/.test(m.text()))errs.push('console: '+m.text())});
await p.goto('file://'+file,{waitUntil:'commit'});
await p.waitForFunction(()=>window.go&&document.getElementById('app')&&document.getElementById('app').children.length>0,null,{timeout:90000});
await p.waitForTimeout(800);
const sets=await p.evaluate(()=>K.sets.map(s=>s.n));
const V=[['dashboard',`go('dashboard')`],['equipment',`go('equipment')`],['plot',`PP.mode='explore';go('plot')`],['hazard',`PP.mode='hazard';go('plot')`],['maintenance',`go('mnt')`],['scenarios',`go('scn')`],['interlocks',`go('il')`],['assistant',`go('ai')`],['studio',`go('ks')`],['performance',`go('perf')`],['governance',`go('gov')`],['documents',`go('documents')`],['opl',`go('opl')`],['quality',`go('quality')`]];
const tabs=quick?['overview','pid','ga']:['overview','pid','ga','plot','docs','ds','seq','opl','maint'];
for(const n of sets.slice(0,quick?2:99))for(const t of tabs)V.push([`set${n}_${t}`,`go('equipment',{set:${n},tab:'${t}'})`]);
const bad=[];
for(const [name,code] of V){const before=errs.length;
 try{await p.evaluate(`(function(){document.querySelectorAll('#setbg,#notifbox,#gsmodal,#tourcard').forEach(e=>e.remove());${code}})()`);await p.waitForTimeout(450);
  await p.screenshot({path:path.join(out,name+'.png')});
  if(/_(pid|ga)$/.test(name)){const el=await p.$(name.endsWith('pid')?'.sheet svg':'#gsvg');if(el)await el.screenshot({path:path.join(out,name+'_sheet.png')})}}catch(e){errs.push(name+': '+e.message.split('\n')[0])}
 if(errs.length>before)bad.push(name)}
fs.writeFileSync(path.join(out,'errors.txt'),errs.join('\n'));
console.log('views',V.length,'errors',errs.length);errs.slice(0,25).forEach(e=>console.log(' ',e.slice(0,220)));
await b.close();process.exit(errs.length?1:0)})();
