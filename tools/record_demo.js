/* Records the silent captioned demo video. node tools/record_demo.js  -> deck/video/raw/*.webm */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const out=path.join(__dirname,'..','deck','video','raw');fs.mkdirSync(out,{recursive:true});
const W=1280,H=720,sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:W,height:H},recordVideo:{dir:out,size:{width:W,height:H}}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'..','knowledge-hub-integrated_BAP5.html'));await p.waitForTimeout(600);
await p.evaluate(()=>{const css=document.createElement('style');css.textContent=`#vcap{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:rgba(11,42,74,.94);color:#fff;font:600 21px/1.3 Arial,sans-serif;padding:14px 28px;text-align:center;min-height:46px;transition:opacity .3s}#vcap.off{opacity:0}#vcard{pointer-events:none;position:fixed;inset:0;z-index:100000;background:linear-gradient(135deg,#0b2a4a,#155ea3);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:Arial,sans-serif;padding:60px;transition:opacity .5s}#vcard.off{opacity:0;pointer-events:none}#vcard h1{font-size:54px;margin:0 0 18px}#vcard p{font-size:25px;margin:6px 0;color:#dce8f5;max-width:900px}`;document.head.appendChild(css);
const c=document.createElement('div');c.id='vcap';c.className='off';document.body.appendChild(c);const d=document.createElement('div');d.id='vcard';document.body.appendChild(d);
window.cap=t=>{c.textContent=t;c.className=t?'':'off'};window.card=(h,l)=>{if(!h){d.className='off';return}d.className='';d.innerHTML='<h1>'+h+'</h1>'+l.map(x=>'<p>'+x+'</p>').join('')}});
const cap=t=>p.evaluate(t=>cap(t),t),card=(h,l)=>p.evaluate(([h,l])=>card(h,l),[h,l]);
const T0=Date.now();const mark=n=>console.log(n,((Date.now()-T0)/1000).toFixed(1));
// 0 title card, while the assistant answers are prepared behind it
await card('Asset Knowledge Platform',['Case 1: Manufacturing Knowledge Hub','LLDPE unit']);
await p.evaluate(()=>{AI.cfg.remote=false;go('ai')});await sleep(600);
for(const q of ['What usually causes a mechanical seal leak on the hexane feed pump and how was it fixed?','How can I bypass the low-low suction pressure trip on the hexane feed pump?']){await p.fill('input[placeholder="Ask a question"]',q);await p.click('button:has-text("Send")');await sleep(3200)}
await p.evaluate(()=>{go('dashboard');window.scrollTo(0,0)});await sleep(1500);mark('title');
await card();await sleep(500);
// 1 dashboard
await p.evaluate(()=>{const s=document.querySelector('.p3stage');if(s){window.scrollTo(0,s.getBoundingClientRect().top+window.scrollY-60)}});
await cap('The problem: plant knowledge is scattered. Here every unit sits in one 3D plant, linked by its equipment tag.');await sleep(7000);
await p.click('button:has-text("KC-4501")').catch(()=>{});await sleep(6500);mark('s1');
// 2 equipment page
await p.evaluate(()=>{go('equipment',{set:4,tab:'overview'});window.scrollTo(0,0)});await cap('Each unit page joins its P&ID, datasheet, interlocks, lessons and maintenance history.');await sleep(6500);
await p.evaluate(()=>window.scrollTo({top:420,behavior:'smooth'}));await sleep(4500);
await p.evaluate(()=>{G3.mode='3d';go('equipment',{set:4,tab:'ga'});window.scrollTo(0,0)});await cap('Every part of the 3D model can be selected, with its material, drawing and condition.');await sleep(8000);mark('s2');
// 3 assistant, answers already on the page
await p.evaluate(()=>{go('ai');window.scrollTo(0,0)});await sleep(800);
await p.evaluate(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.children.length===0&&/failure_memory/.test(x.textContent));e&&e.scrollIntoView({block:'center'})});
await cap('AI assistant: the answer cites approved sources and shows a confidence score.');await sleep(8000);
await p.evaluate(()=>{const a=[...document.querySelectorAll('a,button,span')].find(x=>/Why this answer/.test(x.textContent));a&&a.click()});await sleep(1500);
await cap('AI layer: Gemini 2.5 Flash (free tier) words the answer, with a local fallback.');await sleep(9000);
await p.evaluate(()=>{window.scrollTo({top:0})});mark('s3');
// 4 refusal
await p.evaluate(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.children.length===0&&/safety_guard/.test(x.textContent));e&&e.scrollIntoView({block:'center'})});
await cap('Unsafe requests are refused. The reply names the approved route: bypass permit and management of change.');await sleep(14500);mark('s4');
// 5 failure memory and predictive
await p.evaluate(()=>{FM.q='mechanical seal leak on the hexane feed pump';FM.set=0;go('fm');window.scrollTo(0,0)});await cap('Failure memory: past repairs and lessons appear at the point of fault.');await sleep(9000);
await p.evaluate(()=>{PD2.tab='next';PDM.sel=0;go('mnt');MHS.view='pdm';render();window.scrollTo(0,0)});await sleep(500);
await p.evaluate(()=>{const e=[...document.querySelectorAll('h3')].find(h=>/Reliability analysis/.test(h.textContent));e&&e.scrollIntoView()});
await cap('Predictive maintenance: the chance of each failure mode, with its range and its limits.');await sleep(10500);mark('s5');
// 6 OPL simulator
await p.evaluate(()=>{go('opl',{opl:K.opl[0].no,om:'sim',si:0});setTimeout(()=>{simSw('3d');oplRun()},500)});await sleep(700);
await cap('OPL simulator: each lesson becomes an exercise that uses the real set points and interlock logic.');await sleep(5000);
await p.click('button:has-text("4×")').catch(()=>{});await sleep(19500);mark('s6');
// 7 P&ID and readiness
await p.evaluate(()=>{go('equipment',{set:4,tab:'pid'})});await sleep(1200);await p.evaluate(()=>document.querySelector('#psvg')&&document.querySelector('#psvg').scrollIntoView());
await cap('Live P&ID: close a valve and the flow stops downstream.');await sleep(3500);
await p.evaluate(()=>{const i=D[4].n.findIndex(n=>/^XV-4501/.test(n[0]));vSet(i,'closed')});await sleep(5000);
await p.evaluate(()=>{P.set=1;LIVE.f[FK('PSLL-1201')]=true;go('equipment',{set:1,tab:'ready'});window.scrollTo(0,0)});await cap('Start-up readiness: one decision per unit, GO, GO with checks or NO-GO.');await sleep(6500);
await p.evaluate(()=>{delete LIVE.f[FK('PSLL-1201')]});mark('s7');
// 8 hazard and chain reaction
await p.evaluate(()=>{go('plot');PP.mode='hazard';HSE.view='3d';HSE.sc='cloud';HSE.t=20;HSE.ign=-1;hseCalc();render();window.scrollTo(0,0)});await sleep(1200);
await cap('Hazard simulator: a gas release drifts over the true-scale plot plan.');await p.click('button:has-text("Play")').catch(()=>{});await sleep(8000);
await p.evaluate(()=>{go('scn');scnToPlant(4,'PSLL-4504','trip');window.scrollTo(0,0)});await sleep(1500);await p.click('button:has-text("Play")').catch(()=>{});
await cap('Chain reaction: a trip on one unit shows which connected units are affected.');await sleep(9000);mark('s8');
// 9 knowledge studio
await p.evaluate(()=>{KS.tab='ingest';go('ks');window.scrollTo(0,0)});await cap('Knowledge Studio: documents pass checks and approval before they become searchable.');await sleep(4500);
await p.evaluate(()=>{go('quality');window.scrollTo(0,0)});await cap('A data quality register tracks every conflict between documents until it is resolved.');await sleep(4500);mark('s9');
// 10 closing card
await cap('');await card('Asset Knowledge Platform',['Link, verify and use plant knowledge','A pilot is proposed on the LLDPE unit']);await sleep(7000);mark('end');
await ctx.close();await b.close();console.log('errors',errs);})();
