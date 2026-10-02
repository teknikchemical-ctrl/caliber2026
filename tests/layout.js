/* Layout audit: opens every page, tab and key modal at several widths and reports overlapping text, clipped text,
   content spilling out of its card and horizontal page overflow. Run: node tests/layout.js [--strict] */
const path=require("path"),{chromium}=require("playwright");
const FILE="file://"+path.resolve(__dirname,"..","knowledge-hub-integrated_BAP5.html"),STRICT=process.argv.includes("--strict");
const AUDIT=`(()=>{
 const sel=e=>{let s=e.tagName.toLowerCase();if(e.id)s+="#"+e.id;else if(e.className&&typeof e.className==="string")s+="."+e.className.trim().split(/\\s+/).slice(0,2).join(".");return s};
 const vis=e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>2&&r.height>2&&cs.visibility!=="hidden"&&cs.display!=="none"&&cs.opacity!=="0"};
 const root=document.querySelector(".modalbg")||document.querySelector("main");
 const els=[...root.querySelectorAll("*")].filter(e=>!e.closest("svg")&&!e.closest("select,option,.noaudit")&&vis(e));
 const tb0=els.filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1)&&!["SCRIPT","STYLE"].includes(e.tagName));
 const tb=tb0.filter(e=>!e.closest("pre"));
 const out=[],seen=new Set();
 const clippedAway=e=>{const r=e.getBoundingClientRect();for(let p=e.parentElement;p&&p!==root;p=p.parentElement){const o=getComputedStyle(p);if(/auto|scroll|hidden|clip/.test(o.overflowX+o.overflowY)){const q=p.getBoundingClientRect();if(r.right>q.right+1||r.left<q.left-1||r.bottom>q.bottom+1||r.top<q.top-1)return true}}return false};
 const rects=tb.map(e=>{const rg=document.createRange();rg.selectNodeContents(e);const rs=[...rg.getClientRects()].filter(r=>r.width>1&&r.height>1);return{e,rs}});
 for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(a.e.contains(b.e)||b.e.contains(a.e))continue;
  let hit=false;for(const r of a.rs){for(const q of b.rs){const w=Math.min(r.right,q.right)-Math.max(r.left,q.left),h=Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top);if(w>3&&h>3&&(w*h)/Math.min(r.width*r.height,q.width*q.height)>.2){hit=true;break}}if(hit)break}
  if(hit&&!clippedAway(a.e)&&!clippedAway(b.e)){const k="overlap "+sel(a.e)+" x "+sel(b.e);if(!seen.has(k)){seen.add(k);out.push(k+" :: "+a.e.textContent.trim().slice(0,28)+" | "+b.e.textContent.trim().slice(0,28))}}}
 for(const e of tb){const cs=getComputedStyle(e);if(/hidden|clip/.test(cs.overflowX+cs.overflowY)&&cs.textOverflow!=="ellipsis"&&(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)&&!e.closest(".noclip")){const k="clipped "+sel(e);if(!seen.has(k)){seen.add(k);out.push(k+" :: "+e.textContent.trim().slice(0,40))}}}
 for(const e of tb){const c=e.closest(".card,.modal,.sbrief,.sside");if(!c||c===e||clippedAway(e))continue;const r=e.getBoundingClientRect(),q=c.getBoundingClientRect();if(/auto|scroll|hidden/.test(getComputedStyle(c).overflowX))continue;if(r.right>q.right+3||r.left<q.left-3){const k="spill "+sel(e)+" in "+sel(c);if(!seen.has(k)){seen.add(k);out.push(k+" :: "+e.textContent.trim().slice(0,40))}}}
 /* text inside SVG figures */
 for(const sv of root.querySelectorAll("svg")){const r0=sv.getBoundingClientRect();if(r0.width<80||r0.height<60||sv.closest(".noaudit"))continue;const thumb=r0.width<420;
  const tx=[...sv.querySelectorAll("text")].filter(e=>e.textContent.trim().length>0&&getComputedStyle(e).display!=="none"&&getComputedStyle(e).visibility!=="hidden"&&!e.closest("[data-noaudit]")).map(e=>({e,r:e.getBoundingClientRect()})).filter(o=>o.r.width>1&&o.r.height>1);
  const where=(sv.closest("[id]")?sv.closest("[id]").id:"")+"/"+(sv.parentElement.className||"");
  for(let i=0;i<tx.length;i++)for(let j=i+1;j<tx.length;j++){const a=tx[i].r,b=tx[j].r,w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
   if(w>2&&h>2&&(w*h)/Math.min(a.width*a.height,b.width*b.height)>.18){const k="svg-text "+where+" :: "+tx[i].e.textContent.trim().slice(0,22)+" x "+tx[j].e.textContent.trim().slice(0,22);if(!seen.has(k)){seen.add(k);out.push(k)}}}
  for(const o of tx){const ins=!(o.r.right<r0.left||o.r.left>r0.right||o.r.bottom<r0.top||o.r.top>r0.bottom);const vis=Math.max(0,Math.min(o.r.right,r0.right)-Math.max(o.r.left,r0.left))/o.r.width,visY=Math.max(0,Math.min(o.r.bottom,r0.bottom)-Math.max(o.r.top,r0.top))/o.r.height;if(ins&&vis*visY<.6&&!thumb&&(o.r.left<r0.left-6||o.r.right>r0.right+6||o.r.top<r0.top-6||o.r.bottom>r0.bottom+6)){const k="svg-clip "+where+" :: "+o.e.textContent.trim().slice(0,30);if(!seen.has(k)){seen.add(k);out.push(k)}}}}
 if(document.documentElement.scrollWidth>innerWidth+2)out.push("page overflows horizontally by "+(document.documentElement.scrollWidth-innerWidth)+"px");
 return out})()`;
(async()=>{const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});let total=0;const all={};
 for(const [W,H] of (process.env.WIDTHS||"1440x900,1100x800,820x900").split(",").map(s=>s.split("x").map(Number))){
  const p=await b.newPage({viewport:{width:W,height:H}}),errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("dialog",d=>d.accept("t"));
  await p.goto(FILE);await p.waitForTimeout(900);
  const run=async(name,fn)=>{try{if(fn)await p.evaluate(fn);await p.waitForTimeout(800);const r=await p.evaluate(AUDIT);r.forEach(x=>{const k=x;(all[k]=all[k]||new Set()).add(W+" "+name)});total+=r.length}catch(e){errs.push(name+": "+e.message.slice(0,80))}};
  const tabsOf=async()=>p.evaluate(()=>[...document.querySelectorAll("main .tabs > *, main .seg button, main .tab")].map((e,i)=>i));
  const crawl=async(name,fn)=>{await run(name,fn);const n=(await tabsOf()).length;for(let i=0;i<n;i++){await p.evaluate(fn||"0");await p.evaluate(i=>{const t=[...document.querySelectorAll("main .tabs > *, main .seg button, main .tab")][i];if(t)t.click()},i);await run(name+" tab"+i)}};
  for(const pg of ["dashboard","plot","mnt","scn","il","ai","ks","fm","documents","rc","cov","int","quality"])await crawl(pg,`go('${pg}')`);
  for(let n=1;n<=8;n++)await crawl("equipment"+n,`go('equipment',{set:${n},tab:'overview'})`);
  const oplN=await p.evaluate(()=>Object.keys(OPL).length);
  for(const no of await p.evaluate(()=>Object.keys(OPL).slice(0,40))){await run("opl "+no+" sheet",`go('opl',{opl:'${no}',om:'sheet'})`);await run("opl "+no+" sim",`go('opl',{opl:'${no}',om:'sim',si:0})`)}
  await run("opl sim run",`oplRun();`);await p.waitForTimeout(2500);await run("opl sim running");
  await run("work order modal",`go('mnt');mhOpen(MH[5].wo)`);
  await run("settings",`setOpen()`);
  console.log("viewport",W,"errors",errs.length,errs.slice(0,3));await p.close()}
 const keys=Object.keys(all).sort();console.log("\nlayout findings:",keys.length);keys.forEach(k=>console.log(" -",k,"\n     in:",[...all[k]].slice(0,4).join("; ")));
 await b.close();process.exit(STRICT&&keys.length?1:0)})();
