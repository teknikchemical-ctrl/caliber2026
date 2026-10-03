/* Manual screenshots. node manual/shots.js [idPrefix]   Output: manual/img/<id>.png  (subject-cropped, callouts injected) */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const OUT=path.join(__dirname,'img'),APP='file://'+path.join(__dirname,'..','knowledge-hub-integrated_BAP5.html');fs.mkdirSync(OUT,{recursive:true});
const ONLYS=(process.argv[2]||'').split(',').filter(Boolean);const MATCH=id=>!ONLYS.length||ONLYS.some(o=>id.startsWith(o));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1.5});p.setDefaultTimeout(120000);p.setDefaultNavigationTimeout(120000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{
 document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='.mcall{position:absolute;z-index:99999;width:24px;height:24px;border-radius:50%;background:#e8793a;color:#fff;font:700 13px/24px Arial,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff,0 1px 4px rgba(0,0,0,.4);pointer-events:none}';document.head.appendChild(st)});
 window.vis=e=>{const r=e.getBoundingClientRect();if(r.width<4||r.height<4)return false;const cs=getComputedStyle(e);return cs.visibility!=='hidden'&&cs.display!=='none'};
 window.findT=(src,scope)=>{const re=new RegExp(src);let best=null,ba=1e12;for(const e of (scope||document.getElementById('app')||document.body).querySelectorAll('*')){const t=(e.textContent||'').trim().replace(/\s+/g,' ');if(t.length>120||!re.test(t))continue;if(!vis(e))continue;if([...e.children].some(c=>re.test((c.textContent||'').trim().replace(/\s+/g,' '))&&vis(c)))continue;const r=e.getBoundingClientRect(),a=r.width*r.height;if(a<ba){ba=a;best=e}}return best};
 window.clickT=(src,scope)=>{const re=new RegExp(src);const bt=[...(scope||document.getElementById('app')||document.body).querySelectorAll('button')].find(b=>re.test((b.textContent||'').trim().replace(/\s+/g,' '))&&window.vis(b));if(bt){bt.click();return true}const e=window.findT(src,scope);if(!e)return false;const tg=(e.closest('button,a,[onclick],summary,.tab,div[role=tab]')||e);tg.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return true};
 window.callout=(n,target,dx,dy)=>{let e=typeof target==='string'&&/^[#.\[]/.test(target)?document.querySelector(target):window.findT(target,document.body);if(!e){console.log('CALLOUT MISS',n,target);return false}const r=e.getBoundingClientRect();const d=document.createElement('div');d.className='mcall';d.textContent=n;d.style.left=Math.max(4,r.left+scrollX+(dx??-28))+'px';d.style.top=Math.max(2,r.top+scrollY+(dy??-9))+'px';document.body.appendChild(d);return true};
 window.clearCalls=()=>document.querySelectorAll('.mcall').forEach(e=>e.remove());
});
await p.goto(APP,{waitUntil:'commit'});await p.waitForFunction(()=>window.go&&document.getElementById('app')&&document.getElementById('app').children.length>0,null,{timeout:120000});await sleep(1500);

// seed three knowledge items so that My work, Library, Review queue and the audit trail show real content
try{const r=await p.evaluate(()=>{const out=[];const sv=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v};
 const mk=(title,set,f,submit,approve)=>{KS.tab='capture';KS.cap='tacit';go('ks');render();sv('kc_t',title);sv('kc_s',String(set));for(const k in f)sv(k,f[k]);const n0=UKB.items.length;ksSave(submit);const it=UKB.items[UKB.items.length-1];if(UKB.items.length>n0&&approve&&it){ksSt(it.id,'Approved')}out.push([title,UKB.items.length-n0])};
 mk('Open the seal flush line before starting GA-1201A',1,{kc_symptom:'Seal face overheats within minutes after a start with the flush line closed',kc_cause:'Flush isolation valve left closed after maintenance',kc_action:'Check that the flush line is open and that PDI-1201 reads above 1.5 bar before the start',kc_caution:'Do not start the pump with the flush line closed'},true,true);
 mk('Check the gearbox oil level on KC-4501 before a restart',4,{kc_symptom:'Gearbox oil temperature rises soon after a restart',kc_cause:'Oil level below the sight glass minimum after a long shutdown',kc_action:'Check the level and top up with the approved oil before the restart',kc_caution:'Isolate and lock out the driver before opening the filler cap'},true,false);
 mk('Dryer vent line drains slowly after a wet batch',2,{kc_symptom:'Vent line takes longer than usual to drain after a wet batch',kc_cause:'Partly blocked drain pot',kc_action:'Clear the drain pot at the next opportunity and record the time to drain',kc_caution:'Wear gas detection when opening the drain pot'},false,false);
 return out});console.log('seed',JSON.stringify(r))}catch(e){console.log('seed failed',e.message.split('\n')[0])}
const SHOTS=[];const S=(id,o)=>SHOTS.push({id,...o});
module.exports={S};
// ---------------------------------------------------------------- definitions
const defs=require('./shotdefs.js');defs(S);let CJ={};try{CJ=JSON.parse(fs.readFileSync(path.join(__dirname,'calls.json'),'utf8'))}catch(e){}
for(const s of SHOTS){if(!MATCH(s.id))continue;
 try{
  if(s.url||s.reload){await p.goto(s.url||APP,{waitUntil:'commit'});await p.waitForFunction(()=>window.go&&document.getElementById('app')&&document.getElementById('app').children.length>0,null,{timeout:120000});await sleep(800)}
  else{await p.evaluate(()=>{['setbg','gsmodal','notifbox','tourcard'].forEach(i=>{const e=document.getElementById(i);e&&e.remove()});if(document.getElementById('loginbg')){try{authApply(AUTH_USERS[0],true)}catch(e){}}document.querySelectorAll('button').forEach(b=>{if(/^Close$/.test(b.textContent.trim())&&b.getBoundingClientRect().width>6)b.click()});try{go('dashboard')}catch(e){}});await sleep(500)}
  await p.setViewportSize({width:s.vw||1440,height:s.vh||900});
  await p.evaluate(()=>{window.clearCalls();document.querySelectorAll('dialog[open],.modal').forEach(()=>{})});
  if(s.js)await p.evaluate(s.js,s.arg);
  await sleep(s.wait||1300);
  for(const st of (s.steps||[])){ if(typeof st==='string'){const ok=await p.evaluate(t=>window.clickT(t),st);if(!ok)console.log('  MISS click',s.id,st);await sleep(s.stepWait||700)} else if(st.js){await p.evaluate(st.js);await sleep(st.wait||700)} else if(st.type){await p.keyboard.type(st.type,{delay:20});await sleep(400)} else if(st.key){await p.keyboard.press(st.key);await sleep(500)} else if(st.sel){await p.click(st.sel);await sleep(st.wait||700)} else if(st.canvas){const r=await p.evaluate(sel=>{const cs=[...document.querySelectorAll('canvas')].filter(c=>{const r=c.getBoundingClientRect();return r.width>100&&r.height>100});cs.sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height);const c=cs[0];if(!c)return null;c.scrollIntoView({block:'center'});const b=c.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}},st.canvas.sel||'canvas');if(r){await p.mouse.click(r.x+r.w*st.canvas.x,r.y+r.h*st.canvas.y);await sleep(st.wait||900)}else console.log('  MISS canvas',s.id)} }
  if(s.expand){await p.evaluate(()=>{document.querySelectorAll('#app *').forEach(e=>{const cs=getComputedStyle(e);if((cs.overflowY==='auto'||cs.overflowY==='scroll')&&e.scrollHeight>e.clientHeight+20){e.style.maxHeight='none';e.style.height='auto';e.style.overflow='visible'}})});await sleep(500)}
  if(s.wait2)await sleep(s.wait2);
  await p.evaluate(()=>window.scrollTo(0,0));
  const placed=[];for(const [n,t,dx,dy] of (CJ[s.id]||s.calls||[])){if(!t)continue;const ok=await p.evaluate(([n,t,dx,dy])=>window.callout(n,t,dx,dy),[n,t,dx,dy]);if(!ok)console.log('  MISS callout',s.id,n,t);else placed.push(n)}fs.writeFileSync(path.join(OUT,s.id+'.placed.json'),JSON.stringify(placed));
  if(s.rect){await p.screenshot({path:path.join(OUT,s.id+'.png'),fullPage:true,clip:s.rect});console.log('ok',s.id,'rect');continue}
  // clip to the subject element
  const clip=await p.evaluate(([sel,maxH,off,from])=>{const e=sel==='viewport'?null:document.querySelector(sel||'#app');if(!e)return{x:0,y:0,width:innerWidth,height:innerHeight};const r=e.getBoundingClientRect();let o=off||0;if(from){const f=/^[.#]/.test(from)?document.querySelector('#app '+from):window.findT(from,document.body);if(f){o=f.getBoundingClientRect().top-r.top-8}}const y=r.top+scrollY+o;const h=Math.min(r.height-o,maxH||1e5);return{x:r.left+scrollX,y,width:r.width,height:h}},[s.sel,s.maxH,s.off,s.from]);
  await p.screenshot({path:path.join(OUT,s.id+'.png'),fullPage:true,clip});
  console.log('ok',s.id,Math.round(clip.width)+'x'+Math.round(clip.height));
 }catch(e){console.log('FAIL',s.id,e.message.split('\n')[0])}
}
console.log('errors',JSON.stringify(errs.slice(0,5)));await b.close()})();
