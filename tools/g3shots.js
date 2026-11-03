// Screenshots of every 3D view of a built page: each set's 3D model, the dashboard plant, the hazard 3D site and the scenario 3D view.
// Usage: CHROMIUM=/opt/pw-browsers/chromium node tools/g3shots.js <index.html> <out-dir>
// Also prints, per set, the equipment kind chosen by autoKind and whether a hand-built model (geo/g3m.js) exists, so generic fallbacks are easy to spot.
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const file=path.resolve(process.argv[2]||'dist/index.html'),out=path.resolve(process.argv[3]||'/tmp/g3shots');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+file);await p.waitForFunction(()=>window.go&&document.getElementById('app').children.length>0,null,{timeout:90000});
const clean=()=>p.evaluate(`document.querySelectorAll('#setbg,#notifbox,#tourcard').forEach(e=>e.remove())`);
const info=await p.evaluate(()=>K.sets.map(s=>({n:s.n,tag:s.tag,name:s.name,kind:typeof autoKind==='function'?autoKind(s.n):'?',parts:(GA[s.n]&&GA[s.n].bom||[]).length,nozzles:(GA[s.n]&&GA[s.n].nz||[]).length})));
info.forEach(i=>console.log(`set ${i.n} ${i.tag} | kind ${i.kind} | ${i.parts} parts, ${i.nozzles} nozzles | ${i.name}`));
for(const i of info){await clean();await p.evaluate(`go('equipment',{set:${i.n},tab:'ga'})`);await p.waitForTimeout(500);await p.evaluate(`g3Mode('3d')`);await p.waitForTimeout(1500);
 const el=await p.$('.g3box:not([hidden])');if(el)await el.screenshot({path:path.join(out,'model_set'+i.n+'.png')})}
await p.evaluate(`g3Mode('2d')`);
await clean();await p.evaluate(`go('dashboard')`);await p.waitForTimeout(2500);await p.screenshot({path:path.join(out,'plant3d.png')});
await clean();await p.evaluate(`PP.mode='hazard';go('plot')`);await p.waitForTimeout(600);
await p.evaluate(`[...document.querySelectorAll('button')].find(b=>/3D site/.test(b.textContent)).click()`);await p.waitForTimeout(2000);await p.screenshot({path:path.join(out,'hazard3d.png')});
await clean();await p.evaluate(`go('scn')`);await p.waitForTimeout(800);
await p.evaluate(`[...document.querySelectorAll('button')].find(b=>/^3D view$/.test(b.textContent.trim())).click()`);await p.waitForTimeout(2000);await p.screenshot({path:path.join(out,'scenario3d.png')});
console.log('script errors:',errs.length);errs.forEach(e=>console.log(' ',e.slice(0,200)));await b.close();process.exit(errs.length?1:0)})();
