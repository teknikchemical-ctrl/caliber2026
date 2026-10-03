/* Records the silent captioned demo video. node tools/record_demo.js  -> deck/video/raw/*.webm
   DRY=1 runs the same script quickly without video and writes a screenshot per caption to /tmp/dry. */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const DRY=!!process.env.DRY,out=path.join(__dirname,'..','deck','video','raw');if(!DRY)fs.mkdirSync(out,{recursive:true});if(DRY)fs.mkdirSync('/tmp/dry',{recursive:true});
const W=1600,H=900,K=DRY?0.2:1,sleep=ms=>new Promise(r=>setTimeout(r,ms*K));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:W,height:H},...(DRY?{}:{recordVideo:{dir:out,size:{width:W,height:H}}})});const p=await ctx.newPage();const errs=[],miss=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'..','knowledge-hub-integrated_BAP5.html'));await p.waitForTimeout(700);
await p.evaluate(()=>{const css=document.createElement('style');css.textContent=`#vcap{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:rgba(11,42,74,.94);color:#fff;font:600 25px/1.3 Arial,sans-serif;padding:14px 28px;text-align:center;min-height:46px;transition:opacity .3s;pointer-events:none}#vcap.off{opacity:0}#vcard{pointer-events:none;position:fixed;inset:0;z-index:100000;background:linear-gradient(135deg,#0b2a4a,#155ea3);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:Arial,sans-serif;padding:60px;transition:opacity .4s}#vcard.off{opacity:0}#vcard h1{font-size:54px;margin:0 0 14px}#vcard h2{font-size:30px;margin:4px 0 18px;color:#8fd3cc}#vcard p{font-size:24px;margin:5px 0;color:#dce8f5;max-width:1000px}#vcard small{font-size:18px;color:#9fb6d0;margin-top:18px}#vcur{position:fixed;z-index:100001;width:22px;height:22px;border-radius:50%;border:3px solid #fff;background:rgba(232,121,58,.85);box-shadow:0 0 0 2px rgba(11,42,74,.6);pointer-events:none;left:-40px;top:-40px;transform:translate(-50%,-50%);transition:transform .12s}#vcur.dn{transform:translate(-50%,-50%) scale(.7)}`;document.head.appendChild(css);
const c=document.createElement('div');c.id='vcap';c.className='off';document.body.appendChild(c);const d=document.createElement('div');d.id='vcard';d.className='off';document.body.appendChild(d);const cur=document.createElement('div');cur.id='vcur';document.body.appendChild(cur);
addEventListener('mousemove',e=>{cur.style.left=e.clientX+'px';cur.style.top=e.clientY+'px'},true);addEventListener('mousedown',()=>cur.classList.add('dn'),true);addEventListener('mouseup',()=>cur.classList.remove('dn'),true);
window.cap=t=>{c.textContent=t;c.className=t?'':'off'};window.card=html=>{if(!html){d.className='off';return}d.className='';d.innerHTML=html};
window.findT=(src,scope)=>{const re=new RegExp(src);let best=null,ba=1e12;for(const e of document.querySelectorAll(scope||'*')){if(e.closest('#vcap,#vcard,#vcur'))continue;const t=(e.textContent||'').trim();if(t.length>90||!re.test(t))continue;const r=e.getBoundingClientRect();if(r.width<6||r.height<6)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none')continue;if([...e.children].some(ch=>re.test((ch.textContent||'').trim())&&ch.getBoundingClientRect().width>6))continue;const a=r.width*r.height;if(a<ba){ba=a;best=e}}return best}});
let mx=640,my=360;let TS=Date.now();let n=0;
const ev=(f,a)=>p.evaluate(f,a);
const cap=async t=>{await ev(t=>cap(t),t);if(DRY&&t){await sleep(500);await p.screenshot({path:`/tmp/dry/${String(++n).padStart(2,'0')}.png`});console.log(n,t.slice(0,60))}};
const card=h=>ev(h=>card(h),h);
const until=async s=>{if(DRY)return;const w=TS+s*1000-Date.now();if(w>0)await new Promise(r=>setTimeout(r,w));else if(w<-800)console.log('OVERRUN',s,(-w/1000).toFixed(1))};
const mv=async(x,y)=>{const N=14;for(let i=1;i<=N;i++){const t=i/N,e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;await p.mouse.move(mx+(x-mx)*e,my+(y-my)*e);await sleep(16)}mx=x;my=y};
const ck=async(src,o={})=>{const r=await ev(([src,scope,sc])=>{const e=findT(src,scope);if(!e)return null;if(sc!==false)e.scrollIntoView({block:'center',behavior:'instant'});const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}},[src,o.scope,o.scroll]);
 if(!r){miss.push(src);console.log('MISS',src);return false}await mv(r.x,r.y);await p.mouse.down();await sleep(70);await p.mouse.up();await sleep(o.after??350);return true};
const ckAt=async(sel,fx,fy,after)=>{const r=await ev(([sel,fx,fy])=>{const e=document.querySelector(sel);if(!e)return null;const b=e.getBoundingClientRect();return{x:b.x+b.width*fx,y:b.y+b.height*fy}},[sel,fx,fy]);if(!r){miss.push(sel);console.log('MISS',sel);return false}await mv(r.x,r.y);await p.mouse.down();await sleep(70);await p.mouse.up();await sleep(after??500);return true};
const ckS=async(sel,idx,after)=>{const r=await ev(([sel,idx])=>{const l=[...document.querySelectorAll(sel)].filter(e=>{const b=e.getBoundingClientRect();return b.width>6&&b.height>6});const e=l[idx||0];if(!e)return null;e.scrollIntoView({block:'center',behavior:'instant'});const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}},[sel,idx]);if(!r){miss.push(sel);console.log('MISS',sel);return false}await mv(r.x,r.y);await p.mouse.down();await sleep(70);await p.mouse.up();await sleep(after??500);return true};
const snap=async nm=>{if(DRY){await sleep(300);await p.screenshot({path:`/tmp/dry/${String(++n).padStart(2,'0')}_${nm}.png`})}};
const scr=(y,ms)=>ev(y=>window.scrollTo({top:y,behavior:'smooth'}),y).then(()=>sleep(ms||700));
const go=(js)=>ev(js);
const type=async(sel,text,d)=>{await ck(sel,{scope:'input,textarea'}).catch(()=>{});await p.keyboard.type(text,{delay:(d||35)*K})};

// ---- prepare: assistant answers behind the scenes (trimmed away from the final video)
await go(()=>{AI.cfg.remote=false;go('ai')});await p.waitForTimeout(600);
for(const q of ['What usually causes a mechanical seal leak on the hexane feed pump and how was it fixed?','How can I bypass the low-low suction pressure trip on the hexane feed pump?']){await p.fill('input[placeholder="Ask a question"]',q);await p.click('button:has-text("Send")');await p.waitForTimeout(3200)}
await go(()=>{authLogout()});await p.waitForTimeout(500);
// 0:00 cover
TS=Date.now();console.log('COVER_AT',new Date().toISOString());
await card('<h1>Asset Knowledge Platform</h1><h2>Team Insinyur Jawa</h2><p>Alniko Arya S.</p><p>Anas Fauzan</p><p>Rainar Athalla W. P.</p><small>CALIBER 2026 | Case 1: Manufacturing Knowledge Hub</small>');
await until(5);await card();await sleep(300);
// 0:05 sign in
await cap('Role-based sign-in (demo accounts).');
await ev(()=>{document.getElementById('lg_p').type='text'});
await ck('^Username$',{scope:'span'});await p.keyboard.type('Caliber',{delay:45*K});await ck('^Password$',{scope:'span'});await p.keyboard.type('Caliber2026',{delay:40*K});await sleep(250);
await ck('^Sign in$',{scope:'button',scroll:false});await sleep(300);
await until(7);
// 0:07 dashboard
await ev(()=>{const s=document.querySelector('.p3stage');if(s)window.scrollTo(0,s.getBoundingClientRect().top+scrollY-70)});
await cap('Dashboard: the whole LLDPE plant in 3D. Select a unit to fly to it.');await sleep(1800);
await ck('^GA-1201A$',{scope:'button',scroll:false});await sleep(2200);await ck('^KC-4501$',{scope:'button',scroll:false});await until(15);
// 0:15 equipment tabs
await go(()=>{go('equipment',{set:4,tab:'overview'});window.scrollTo(0,220)});await sleep(500);
const tabs=[['^Overview$','Equipment page: every unit opens its overview, key figures and 3D model.'],['^P&ID$',null],['^Drawing and 3D',null],['^Indicators',"Indicators: availability, mean repair time and downtime by unit."],['^Plot plan',null],['^Start-up readiness','Start-up readiness and the plot plan location of the unit.'],['^Documents',null],['^Datasheet','Documents and the datasheet linked to the same equipment tag.'],['^Interlock logic',null],['^Lessons','Interlock logic and lessons from the shift.'],['^Maintenance',null],['^Related assets','Maintenance history and related assets.']];
for(const [t,c] of tabs){if(c)await cap(c);await ck(t,{scope:'div',scroll:false,after:200});await scr(180,200);await new Promise(r=>setTimeout(r,DRY?100:880))}
await until(35);
// 0:35 drawing selection, 2D then 3D, several machines
await go(()=>{G3.mode='2d';go('equipment',{set:1,tab:'ga'});window.scrollTo(0,330)});await sleep(700);
await cap('Every part is selectable in 2D, with its material, drawing and live condition.');
await ck('^Casing',{scope:'g,text',scroll:false,after:900});await ck('^Mechanical seal',{scope:'g,text',scroll:false,after:900});await ck('^Bearing housing',{scope:'g,text',scroll:false,after:900});
await ck('^3D model$',{scope:'button',scroll:false,after:900});await cap('And in 3D: select one part, then another.');
await ckAt('.g3 canvas, canvas',.45,.5,1000);await ckAt('.g3 canvas, canvas',.62,.55,1000);await ckAt('.g3 canvas, canvas',.3,.6,900);
await until(45);
await go(()=>{G3.mode='3d';go('equipment',{set:2,tab:'ga'});window.scrollTo(0,330)});await sleep(900);await cap('Eight machines, each built from its datasheet bill of materials.');
await ckAt('.g3 canvas, canvas',.5,.5,1000);await ckAt('.g3 canvas, canvas',.65,.45,900);
await go(()=>{G3.mode='3d';go('equipment',{set:7,tab:'ga'});window.scrollTo(0,330)});await sleep(900);await ckAt('.g3 canvas, canvas',.45,.55,900);await ck('^2D drawing$',{scope:'button',scroll:false,after:600});await ck('^Fan|^Motor|^Gearbox',{scope:'g,text',scroll:false,after:900});
await until(51);
// 0:51 AI assistant (answers already on screen, nothing sent)
await go(()=>{go('ai');window.scrollTo(0,0)});await sleep(700);
await go(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.children.length===0&&/failure_memory/.test(x.textContent));e&&e.scrollIntoView({block:'center'})});
await cap('AI assistant: cited sources, a confidence score, unsafe requests refused.');await sleep(2200);await ck('Why this answer',{scroll:false,after:1500});
await cap('Gemini 2.5 Flash (free tier) words the answer, with a local fallback.');await sleep(1500);
await go(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.children.length===0&&/safety_guard/.test(x.textContent));e&&e.scrollIntoView({block:'center',behavior:'smooth'})});await until(61);
// 1:01 maintenance
await go(()=>{MHS.view='dash';go('mnt');window.scrollTo(0,0)});await sleep(500);await cap('Maintenance: work orders open a failure view on the P&ID.');
await ck('^Work orders$',{scope:'div',scroll:false,after:900});await ckS('tr[onclick^="mhOpen"]',2,1800);await snap('wo');await ck('^Failure view',{scope:'button,div',scroll:false,after:2600});await snap('wo2');await ck('^Close$',{scope:'button',scroll:false,after:700});
await go(()=>{window.scrollTo({top:0,behavior:'smooth'})});await sleep(1000);
await ck('^Timeline$',{scope:'div',scroll:false,after:600});await cap('Timeline of breakdowns by unit and failure mode.');await sleep(1200);await ckS('[onclick*="mhOpen"]',3,1800);await snap('tl');await ck('^Close$',{scope:'button',scroll:false,after:700});
await go(()=>{window.scrollTo({top:0,behavior:'smooth'})});await ck('^Predictive$',{scope:'div',scroll:false,after:700});await cap('Predictive: the chance of each failure mode, with its range.');
await ck('^YD-2301$',{after:900});await ck('^KC-4501$',{after:900});await ck('^Next 90 days',{after:1200});await snap('pdm');
await until(83);
await go(()=>{window.scrollTo({top:0})});await ck('^Plant replay$',{scope:'div',scroll:false,after:900});await cap('Plant replay: step through history and watch units alarm.');
await go(()=>{const r=MH.filter(x=>x.bd==='Yes')[5];mhRpSeek(r.t1+36e5);mhRpUpd(true);document.getElementById('p3')&&document.getElementById('p3').scrollIntoView()});await sleep(1800);
await ck('^3D plant$',{scope:'button',after:1500});await snap('rp1');await ck('^Play$',{scope:'button',after:2500});await snap('rp2');await go(()=>{const r=MH.filter(x=>x.bd==='Yes')[9];mhRpSeek(r.t1+36e5);mhRpUpd(true)});await sleep(1800);
await until(94);
await go(()=>{window.scrollTo({top:0})});await ck('^Site plan$',{scope:'div',scroll:false,after:900});await cap('Site plan with permits, clashes and crew hours.');await go(()=>{spExample&&spExample()});await sleep(1200);await ckS('#plgantt [onclick], .spbar, [onclick^="spSel"]',2,1000);await snap('site');
await until(97);
// 1:37 OPL
await go(()=>{go('opl');window.scrollTo(0,0)});await sleep(500);await cap('One point lessons link to the datasheet, P&ID and interlock.');
await ck('Open sheet',{scope:'button',after:1500});await scr(400,900);
await snap('opl1');await ck('^Datasheet',{scope:'button,a,div',after:1800});await snap('opl_ds');
await go(()=>{go('opl',{opl:K.opl[0].no});window.scrollTo(0,0)});await sleep(600);await ck('Scenario simulator',{scope:'button',scroll:false,after:900});await cap('Each lesson becomes an exercise on the P&ID and in 3D.');
await ck('^P&ID$',{scope:'button',after:900});await ck('^3D view$',{scope:'button',after:700});await ck('^4×$',{scope:'button',after:300});await ck('^Run$',{scope:'button',after:3000});await snap('sim');
await until(115);
// 1:55 failure memory
await go(()=>{FM.q='';FM.set=0;go('fm');window.scrollTo(0,0)});await sleep(500);await cap('Failure memory: similar cases, root causes and fixes.');
await ck('Mechanical seal leak',{scope:'button,span,div',after:900});await ck('Find similar failures',{scope:'button',after:1500});await snap('fm1');await scr(380,1100);await ck('^WO-24',{scope:'a',after:1500});await snap('fm2');
await until(123);
// 2:03 interlocks
await go(()=>{go('il');window.scrollTo(0,0)});await sleep(500);await cap('Interlock library: cause and effect, voting, proof tests.');
await ck('^HEXANE FEED PUMP',{scope:'div',after:1700});await snap('il1');await scr(420,1300);await scr(800,1200);await snap('il2');
await until(131);
// 2:11 reliability analysis
await go(()=>{PD2.tab='modes';PDM.sel=0;MHS.view='pdm';go('mnt');window.scrollTo(0,0)});await sleep(600);
await go(()=>{const e=[...document.querySelectorAll('h3')].find(h=>/Reliability analysis/.test(h.textContent));e&&e.scrollIntoView()});await cap('Reliability analysis: risk priority, MTBF, MTTR and forecast.');
await ck('^Failure modes$',{scope:'button',scroll:false,after:1700});await ck('^Reliability measures',{scope:'button',scroll:false,after:1900});await ck('^Next 90 days',{scope:'button',scroll:false,after:1900});await ck('^Combined score',{scope:'button',scroll:false,after:1600});
await until(141);
// 2:21 reports
await go(()=>{go('rc');window.scrollTo(0,0)});await sleep(500);await cap('Reports can be generated for any unit and exported.');
await ck('^Preview$',{scope:'button',after:1500});await snap('rc');await scr(300,200);await sleep(1200);await ck('^Close$',{scope:'button',scroll:false,after:700});
await until(147);
// 2:27 hazard
await go(()=>{go('plot');window.scrollTo(0,0)});await sleep(500);await ck('Hazard simulator',{scope:'button',after:800});await ck('^3D site$',{scope:'button',after:900});await cap('Hazard screening: a gas cloud drifts over the true-scale plot plan.');
await ck('^Play$',{scope:'button',after:600});await sleep(2500);
await snap('hz1');await ck('^From above$',{scope:'button',after:1600});await snap('hz2');await ck('^Side$',{scope:'button',after:1500});await ck('^Leak$',{scope:'button',after:1300});await ck('^2D plan$',{scope:'button',after:1500});await snap('hz3');
await until(159);
// 2:39 ingestion
await go(()=>{KS.tab='overview';go('ks');window.scrollTo(0,0)});await sleep(600);await cap('Document ingestion: parse, map to the equipment tag, check, then approve.');
await ck('Ingest documents',{scope:'div',after:900});await ckS('input[placeholder^="For example"]',0,200);await p.keyboard.type('SOP start-up of GA-1201A',{delay:35*K});
await ckS('textarea',0,200);await p.keyboard.type('1. Confirm suction valve XV-1201A is open.\n2. Confirm seal flush dP above 1.5 bar on PDI-1201.\n3. Reset the interlock SEQ-1201 and start GA-1201A.',{delay:14*K});await sleep(500);
await ck('^Add$',{scope:'button',after:900});await snap('ks1');
for(let i=0;i<5;i++){await ck('^(Next|Create|Finish)$',{scope:'button',after:1300});await snap('ks_n'+i)}
await cap('Quality gates flag conflicts before anything is searchable.');await ck('Quality gates',{scope:'div',after:1500});await ck('Review queue',{scope:'div',after:1200});
await until(177);
// 2:57 end card
await cap('');await card('<h1>Asset Knowledge Platform</h1><h2>Team Insinyur Jawa</h2>');await until(180);
console.log('misses',JSON.stringify(miss),'errors',JSON.stringify(errs));
await ctx.close();await b.close();})();
