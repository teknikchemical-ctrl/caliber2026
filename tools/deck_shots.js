/* Screenshots of the prototype for the pitch deck. node tools/deck_shots.js */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const out=path.join(__dirname,'..','deck','img');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1480,height:900},deviceScaleFactor:1});
await p.goto('file://'+path.join(__dirname,'..','knowledge-hub-integrated_BAP5.html'));await p.waitForTimeout(800);
const shot=async(name,fn,wait,sel)=>{await p.evaluate(fn);await p.waitForTimeout(wait||900);const el=sel?await p.$(sel):null;await (el||p).screenshot({path:path.join(out,name+'.png')})};
await shot('dashboard',()=>{go('dashboard');window.scrollTo(0,0)},2500);
await p.evaluate(()=>{AI.cfg.remote=false;go('ai')});await p.waitForTimeout(700);
await p.fill('input[placeholder="Ask a question"]',"What is the trip set point of the suction pressure low-low switch on the hexane feed pump?");await p.click('button:has-text("Send")');await p.waitForTimeout(2500);await p.screenshot({path:path.join(out,'assistant.png')});
await shot('equipment3d',()=>{G3.mode='3d';go('equipment',{set:1,tab:'ga'})},1200);
await p.evaluate(()=>{const id=Object.keys(G3.inst).find(i=>!document.getElementById(i).dataset.mini);G3.inst[id].pin='8';G3.inst[id].dirty=true});await p.waitForTimeout(2500);await p.screenshot({path:path.join(out,'equipment3d.png')});
await shot('opl3d',()=>{go('opl',{opl:K.opl[0].no,om:'sim',si:0});setTimeout(()=>{simSw('3d');oplRun()},500)},3500);
await shot('pid',()=>{go('equipment',{set:4,tab:'pid'})},1200);
await p.evaluate(()=>{const i=D[4].n.findIndex(n=>/^XV-4501/.test(n[0]));vSet(i,'closed')});await p.waitForTimeout(900);await p.evaluate(()=>document.querySelector('#psvg').scrollIntoView());await p.waitForTimeout(300);await p.screenshot({path:path.join(out,'pid.png')});
await shot('hazard3d',()=>{go('plot');PP.mode='hazard';HSE.view='3d';HSE.sc='cloud';HSE.t=40;HSE.ign=-1;hseCalc();render()},1800);
await p.evaluate(()=>hse3Go('source'));await p.waitForTimeout(1800);await p.screenshot({path:path.join(out,'hazard3d.png')});
await shot('hazard2d',()=>{HSE.view='2d';HSE.t=50;render()},1500);
await shot('predict',()=>{PD2.tab='next';PDM.sel=1;go('mnt');MHS.view='pdm';render()},1800);
await p.evaluate(()=>{const e=[...document.querySelectorAll('h3')].find(h=>/Reliability analysis/.test(h.textContent));e&&e.scrollIntoView()});await p.waitForTimeout(300);await p.screenshot({path:path.join(out,'predict.png')});
await shot('studio',()=>{go('ks')},1200);
await shot('il',()=>{go('il')},1200);
await shot('perf',()=>{go('perf')},1500);
await shot('quality',()=>{go('quality')},1200);
await shot('int',()=>{go('int')},1200);
{const q=await b.newPage({viewport:{width:780,height:1150},deviceScaleFactor:1.6});await q.goto('file://'+path.join(__dirname,'..','knowledge-hub-integrated_BAP5.html'));await q.waitForTimeout(800);
 await q.evaluate(()=>{go('dashboard');P3.orbit=false;P3.labels=true;document.querySelector('.p3stage').style.height='1150px'});await q.waitForTimeout(2500);
 await q.evaluate(()=>{P3.cam.yaw=-.5;P3.cam.pit=.78;P3.cam.dist=64;P3.cam.tx=0;P3.cam.tz=0;P3.to=null});await q.waitForTimeout(1500);
 const c=await q.$('.p3stage canvas');await c.screenshot({path:path.join(out,'plant.png')});}
await b.close();console.log('done')})();
