// Profiles the initial load of the app with the Chrome CPU profiler. node tools/profile_load.js [out.json]
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
const cdp=await ctx.newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});await cdp.send('Profiler.start');
const t0=Date.now();await p.goto('file://'+path.resolve(process.env.PAGE||path.join(__dirname,'..','knowledge-hub-integrated_BAP5.html')),{waitUntil:'commit'});
await p.waitForFunction(()=>window.go&&document.getElementById('app')&&document.getElementById('app').children.length>0,null,{timeout:180000});const t1=Date.now();
const {profile}=await cdp.send('Profiler.stop');console.log('time to first render ms',t1-t0);
const nodes=new Map(profile.nodes.map(n=>[n.id,n]));const self=new Map();const dt=profile.timeDeltas;
profile.samples.forEach((id,i)=>{const n=nodes.get(id);const k=n.callFrame.functionName+' '+(n.callFrame.url||'').split('/').pop()+':'+n.callFrame.lineNumber;self.set(k,(self.get(k)||0)+(dt[i]||0))});
const top=[...self.entries()].sort((a,b)=>b[1]-a[1]).slice(0,30);top.forEach(([k,v])=>console.log((v/1000).toFixed(0).padStart(7),'ms',k));
fs.writeFileSync(process.argv[2]||'/tmp/claude-0/t/load.cpuprofile',JSON.stringify(profile));await b.close()})();
