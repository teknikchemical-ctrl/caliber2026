// Profiles the main thread while a page sits open (animation cost). node tools/profile_idle.js "<js to open the page>" [seconds]
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();p.setDefaultTimeout(120000);
await p.goto('file://'+path.join(__dirname,'..','knowledge-hub-integrated_BAP5.html'),{waitUntil:'commit'});await p.waitForFunction(()=>window.go&&document.getElementById('app')&&document.getElementById('app').children.length>0);
await p.evaluate(process.argv[2]||'go("dashboard")');await p.waitForTimeout(2500);
const cdp=await ctx.newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});await cdp.send('Profiler.start');
const fr=await p.evaluate(s=>new Promise(r=>{let n=0;const t=performance.now();const f=()=>{n++;if(performance.now()-t<s*1000)requestAnimationFrame(f);else r(n/s)};requestAnimationFrame(f)}),+(process.argv[3]||6));
const {profile}=await cdp.send('Profiler.stop');console.log('frames per second',fr.toFixed(1));
const nodes=new Map(profile.nodes.map(n=>[n.id,n]));const self=new Map();profile.samples.forEach((id,i)=>{const n=nodes.get(id);const k=n.callFrame.functionName+' '+(n.callFrame.url||'').split('/').pop()+':'+n.callFrame.lineNumber;self.set(k,(self.get(k)||0)+(profile.timeDeltas[i]||0))});
const tot=[...self.values()].reduce((a,b)=>a+b,0);console.log('total sampled ms',(tot/1000).toFixed(0));[...self.entries()].sort((a,b)=>b[1]-a[1]).slice(0,14).forEach(([k,v])=>console.log((v/1000).toFixed(0).padStart(7),'ms',k));await b.close()})();
