/* Manual screenshots. node manual/shots.js [idPrefix]   Output: manual/img/<id>.png  (subject-cropped, callouts injected) */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const OUT=path.join(__dirname,'img'),APP='file://'+path.join(__dirname,'..','knowledge-hub-integrated_BAP5.html');fs.mkdirSync(OUT,{recursive:true});
const ONLY=process.argv[2]||'';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1.5});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{
 document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='.mcall{position:absolute;z-index:99999;width:26px;height:26px;border-radius:50%;background:#e8793a;color:#fff;font:700 14px/26px Arial,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff,0 1px 4px rgba(0,0,0,.4);pointer-events:none}';document.head.appendChild(st)});
 window.vis=e=>{const r=e.getBoundingClientRect();if(r.width<4||r.height<4)return false;const cs=getComputedStyle(e);return cs.visibility!=='hidden'&&cs.display!=='none'};
 window.findT=(src,scope)=>{const re=new RegExp(src);let best=null,ba=1e12;for(const e of (scope||document.getElementById('app')||document.body).querySelectorAll('*')){const t=(e.textContent||'').trim().replace(/\s+/g,' ');if(t.length>120||!re.test(t))continue;if(!vis(e))continue;if([...e.children].some(c=>re.test((c.textContent||'').trim().replace(/\s+/g,' '))&&vis(c)))continue;const r=e.getBoundingClientRect(),a=r.width*r.height;if(a<ba){ba=a;best=e}}return best};
 window.clickT=(src,scope)=>{const e=window.findT(src,scope);if(!e)return false;(e.closest('button,a,[onclick],summary,.tab,div[role=tab]')||e).click();return true};
 window.callout=(n,target,dx,dy)=>{let e=typeof target==='string'&&/^[#.\[]/.test(target)?document.querySelector(target):window.findT(target,document.body);if(!e){console.log('CALLOUT MISS',n,target);return false}const r=e.getBoundingClientRect();const d=document.createElement('div');d.className='mcall';d.textContent=n;d.style.left=(r.left+scrollX+(dx??-10))+'px';d.style.top=(r.top+scrollY+(dy??-10))+'px';document.body.appendChild(d);return true};
 window.clearCalls=()=>document.querySelectorAll('.mcall').forEach(e=>e.remove());
});
await p.goto(APP,{waitUntil:'domcontentloaded'});await sleep(1500);
const SHOTS=[];const S=(id,o)=>SHOTS.push({id,...o});
module.exports={S};
// ---------------------------------------------------------------- definitions
const defs=require('./shotdefs.js');defs(S);
for(const s of SHOTS){if(ONLY&&!s.id.startsWith(ONLY))continue;
 try{
  await p.goto(s.url||APP,{waitUntil:'domcontentloaded'});await sleep(1400);
  if(s.vw){await p.setViewportSize({width:s.vw,height:s.vh||900})}else{await p.setViewportSize({width:1440,height:900})}
  await p.evaluate(()=>{window.clearCalls();document.querySelectorAll('dialog[open],.modal').forEach(()=>{})});
  if(s.js)await p.evaluate(s.js);
  await sleep(s.wait||1300);
  for(const st of (s.steps||[])){ if(typeof st==='string'){const ok=await p.evaluate(t=>window.clickT(t),st);if(!ok)console.log('  MISS click',s.id,st);await sleep(s.stepWait||700)} else if(st.js){await p.evaluate(st.js);await sleep(st.wait||700)} else if(st.type){await p.keyboard.type(st.type,{delay:20});await sleep(400)} else if(st.key){await p.keyboard.press(st.key);await sleep(500)} else if(st.sel){await p.click(st.sel);await sleep(st.wait||700)} else if(st.canvas){const r=await p.evaluate(sel=>{const c=document.querySelector(sel);if(!c)return null;const b=c.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}},st.canvas.sel||'canvas');if(r){await p.mouse.click(r.x+r.w*st.canvas.x,r.y+r.h*st.canvas.y);await sleep(st.wait||900)}else console.log('  MISS canvas',s.id)} }
  if(s.wait2)await sleep(s.wait2);
  await p.evaluate(()=>window.scrollTo(0,0));
  for(const [n,t,dx,dy] of (s.calls||[])){const ok=await p.evaluate(([n,t,dx,dy])=>window.callout(n,t,dx,dy),[n,t,dx,dy]);if(!ok)console.log('  MISS callout',s.id,n,t)}
  // clip to the subject element
  const clip=await p.evaluate(([sel,maxH,off])=>{const e=sel==='viewport'?null:document.querySelector(sel||'#app');if(!e)return{x:0,y:0,width:innerWidth,height:innerHeight};const r=e.getBoundingClientRect();const y=r.top+scrollY+(off||0);const h=Math.min(r.height-(off||0),maxH||1e5);return{x:r.left+scrollX,y,width:r.width,height:h}},[s.sel,s.maxH,s.off]);
  await p.screenshot({path:path.join(OUT,s.id+'.png'),fullPage:true,clip});
  console.log('ok',s.id,Math.round(clip.width)+'x'+Math.round(clip.height));
 }catch(e){console.log('FAIL',s.id,e.message.split('\n')[0])}
}
console.log('errors',JSON.stringify(errs.slice(0,5)));await b.close()})();
