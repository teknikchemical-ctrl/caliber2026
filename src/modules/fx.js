/* =====================================================================================================
   FIGURE LAYOUT AND MOTION HELPERS
   - svgFix: automatic label de-collision for every SVG figure. Large and bold labels stay where the drawing places them,
     smaller labels that would overlap another label are moved by the smallest step that frees them. Offsets are cached per figure,
     so figures that are repainted every animation frame are corrected without measuring again.
   - motion: shared animation primitives for the OPL simulator, the failure view and the scenario views (see FXM).
   ===================================================================================================== */
regMod("fx","1.0",[],"Layout fixes and figure motion");
const SVGFX={cache:{},skip:".ph1,.ph2,.ph3,.pl,.pl2,.pz,[data-fixed]"};
function svgLocalDelta(el,dx,dy){const m=el.getScreenCTM();if(!m)return[0,0];const det=m.a*m.d-m.b*m.c||1;return[(m.d*dx-m.c*dy)/det,(-m.b*dx+m.a*dy)/det]}
function svgShift(el,dx,dy){if(el.dataset.ft===undefined)el.dataset.ft=el.getAttribute("transform")||"";el.setAttribute("transform",`translate(${dx.toFixed(2)} ${dy.toFixed(2)})`+(el.dataset.ft?" "+el.dataset.ft:""))}
function svgKey(sv,n){let k=sv.dataset.fxkey;if(!k){if(sv.closest("#simFig")){const s=window.SIMX&&SIMX.S();k="sim:"+(s?s.no+":"+s.i:"")}else if(sv.closest("#simTrend")){const s=window.SIMX&&SIMX.S();k="trend:"+(s?s.no+":"+s.i:"")}else{const t=sv.querySelectorAll("text");k=(sv.id||sv.parentElement.id||String(sv.getAttribute("class")||""))+"|"+(t[0]?t[0].textContent:"")+"|"+(t[1]?t[1].textContent:"")+"|"+(t[t.length-1]?t[t.length-1].textContent:"")}}return k+"#"+n}
function svgFix(sv){
 if(!sv||sv.dataset.nofix!==undefined||sv.closest("[data-nofix]"))return;
 const all=[...sv.querySelectorAll("text")].filter(e=>e.textContent.trim()&&!e.closest("defs"));
 if(all.length<6||all.length>700)return;
 const key=svgKey(sv,all.length)+"@"+Math.round(sv.getBoundingClientRect().width/60),c=SVGFX.cache[key];
 if(c){c.forEach((o,i)=>{if(o)svgShift(all[i],o[0],o[1])});sv.dataset.fx="1";sv.dataset.fxn=String(all.length);svgHalo(sv);return}
 const R=sv.getBoundingClientRect();if(R.width<60||R.height<40)return;
 const items=all.map((e,i)=>{const cs=getComputedStyle(e);return{e,i,r:e.getBoundingClientRect(),fs:parseFloat(e.getAttribute("font-size")||cs.fontSize)||9,b:(parseInt(cs.fontWeight)||400)>=600?1:0,fixed:e.matches(SVGFX.skip)?1:0,hid:cs.opacity==="0"||cs.display==="none"||cs.visibility==="hidden"}}).filter(o=>o.r.width>.5&&o.r.height>.5&&!o.hid);
 const order=[...items].sort((a,b)=>(b.fixed-a.fixed)||(b.fs-a.fs)||(b.b-a.b)||(a.i-b.i)),placed=[],offs=new Array(all.length).fill(null);
 const hit=(r,list)=>list.some(q=>{const w=Math.min(r.right,q.right)-Math.max(r.left,q.left),h=Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top);return w>1.5&&h>1.5&&(w*h)/Math.min(r.width*r.height,q.width*q.height)>.12});
 for(const o of order){let r={left:o.r.left,right:o.r.right,top:o.r.top,bottom:o.r.bottom,width:o.r.width,height:o.r.height};
  if(!o.fixed&&hit(r,placed)){const h=r.height*1.02,w=r.width,tries=[];for(const m of[1,2,3,4,5])tries.push([0,h*m],[0,-h*m],[w*.6*m,0],[-w*.6*m,0],[w*.5*m,h*m*.8],[-w*.5*m,h*m*.8],[w*.5*m,-h*m*.8],[-w*.5*m,-h*m*.8]);
   for(const[dx,dy]of tries){const q={left:r.left+dx,right:r.right+dx,top:r.top+dy,bottom:r.bottom+dy,width:r.width,height:r.height};if(q.left<R.left||q.right>R.right||q.top<R.top||q.bottom>R.bottom)continue;if(!hit(q,placed)){offs[o.i]=svgLocalDelta(o.e,dx,dy);r=q;break}}}
  placed.push(r)}
 offs.forEach((o,i)=>{if(o)svgShift(all[i],o[0],o[1])});SVGFX.cache[key]=offs;sv.dataset.fx="1";sv.dataset.fxn=String(all.length);svgHalo(sv)}
function svgReset(sv){sv.querySelectorAll("text[data-ft]").forEach(e=>{const o=e.dataset.ft;if(o)e.setAttribute("transform",o);else e.removeAttribute("transform");delete e.dataset.ft});delete sv.dataset.fx}
const FXH={};
function fxLum(c){if(!c||c==="none"||c==="currentColor")return 1;if(c in FXH)return FXH[c];let r=1;const m=c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(m){let h=m[1];if(h.length===3)h=h.split("").map(x=>x+x).join("");const v=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);r=.2126*v[0]+.7152*v[1]+.0722*v[2]}return FXH[c]=r}
function svgHalo(sv){sv.querySelectorAll("text").forEach(e=>{if(e.classList.contains("halo")||e.classList.contains("nohalo"))return;const f=e.getAttribute("fill");if(f&&fxLum(f)<.5&&!e.closest("[data-nohalo]"))e.classList.add("halo")})}
function svgFixAll(root){(root||document).querySelectorAll("main svg, .modalbg svg").forEach(sv=>{if(sv.dataset.fx!=="1")try{svgFix(sv)}catch(e){console.error("svgFix",e)}})}
{const mo=new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.tagName==="svg"||n.querySelector&&n.querySelector("svg")))))svgFixAll()});
 const go=()=>mo.observe(document.body,{childList:true,subtree:true});if(document.body)go();else document.addEventListener("DOMContentLoaded",go)}
/* figures whose value badges appear after the first render are corrected again once their label count changes */
setInterval(()=>{if(document.hidden)return;document.querySelectorAll("main svg[data-fx='1'], .modalbg svg[data-fx='1']").forEach(sv=>{const n=[...sv.querySelectorAll("text")].filter(e=>e.textContent.trim()&&!e.closest("defs")).length;if(String(n)!==sv.dataset.fxn){svgReset(sv);try{svgFix(sv)}catch(e){}}})},500);
/* ===================================================================================================
   MOTION
   - ripples around any P&ID node or overview tile that is in alarm, effect or trip
   - OPL simulator: figure frame follows the plant state, changed readings flash, completed OPL steps tick in, alarms raise a notice
   - number count-up on KPI tiles when a page is drawn or a value changes
   =================================================================================================== */
const FXM={last:{},sim:{vals:{},log:"",steps:0,key:""},cu:{}};
function fxRipples(){
 document.querySelectorAll("main svg .pdn.al, main svg .pdn.alm, main svg .pdn.ef, .modalbg svg .pdn.al, .modalbg svg .pdn.alm, .modalbg svg .pdn.ef").forEach(g=>{
  if(g.querySelector(":scope > .rip"))return;let bb;try{bb=g.getBBox()}catch(e){return}if(!bb||bb.width<4)return;
  const amb=g.classList.contains("ef")||g.classList.contains("alm")&&!g.classList.contains("al"),r=Math.max(bb.width,bb.height)*.5;
  [0,1].forEach(k=>{const c=document.createElementNS("http://www.w3.org/2000/svg","circle");c.setAttribute("cx",bb.x+bb.width/2);c.setAttribute("cy",bb.y+bb.height/2);c.setAttribute("r",Math.max(8,r));c.setAttribute("class","rip"+(amb?" amb":"")+(k?" r2":""));c.setAttribute("data-fixed","1");g.insertBefore(c,g.firstChild)})});
 document.querySelectorAll("svg .pdn > .rip").forEach(c=>{const g=c.parentElement;if(!(g.classList.contains("al")||g.classList.contains("alm")||g.classList.contains("ef")))c.remove()});
 /* overview tiles: ripple while the tile is not in normal state */
 document.querySelectorAll("#ovsvg [id^='ovb']").forEach(b=>{const id="ovrip"+b.id.slice(3),bad=parseFloat(b.getAttribute("stroke-width"))>2,ex=document.getElementById(id);
  if(bad&&!ex){const c=b.cloneNode(false);c.id=id;c.removeAttribute("onclick");c.setAttribute("class","rip-t");c.setAttribute("fill","none");c.setAttribute("stroke",b.getAttribute("stroke"));c.setAttribute("data-fixed","1");b.parentNode.insertBefore(c,b.nextSibling)}
  else if(ex&&!bad)ex.remove();else if(ex)ex.setAttribute("stroke",b.getAttribute("stroke"))})}
setInterval(()=>{if(!document.hidden)try{fxRipples()}catch(e){}},450);
/* simulator hook: called from paint() after every frame */
function fxSim(S){
 const fig=document.getElementById("simFig");if(!fig||!S)return;const m=FXM.sim,key=S.no+":"+S.i;
 if(m.key!==key){m.key=key;m.vals={};m.log="";m.steps=0}
 const ban=document.querySelector("#simBan .sban"),cls=ban?[...ban.classList].find(c=>["tr","al","byp","run","stop"].includes(c)):"";
 ["tr","al","byp","run","stop"].forEach(c=>fig.classList.toggle("st-"+c,cls===c));
 document.querySelectorAll("#simVals .fp2").forEach(t=>{const tag=t.querySelector(".t b")?.textContent||"",s=t.classList.contains("tr")?2:t.classList.contains("al")?1:0,p=m.vals[tag]||0;if(s>p)t.classList.add("flash");m.vals[tag]=s});
 const top=S.log&&S.log[0]?S.log[0].join("|"):"";if(top&&top!==m.log){if(m.log&&["ALM","AL","BAD"].includes(S.log[0][1]))toast(S.log[0][2],S.log[0][1]==="AL"?"warn":"bad");m.log=top}
 const done=document.querySelectorAll("#simSteps li.ok");if(done.length>m.steps&&m.steps>=0){done.forEach((li,i)=>{if(i>=m.steps)li.classList.add("new")})}m.steps=done.length;
 const ck=document.getElementById("simClk");if(ck)ck.classList.toggle("live",!!S.run&&!S.out)}
function fxCountUp(root){(root||document).querySelectorAll("main .stat > b").forEach(b=>{if(b.dataset.cu)return;if(b.children.length){b.dataset.cu="0";return}const t=b.textContent.trim(),m=t.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);if(!m||t.length>14){b.dataset.cu="0";return}
  const key=location.hash+(b.nextElementSibling?b.nextElementSibling.textContent:""),to=parseFloat(m[2].replace(/,/g,"")),dec=(m[2].split(".")[1]||"").length,comma=m[2].includes(",");
  b.dataset.cu="1";if(FXM.cu[key]===to)return;FXM.cu[key]=to;if(!isFinite(to)||Math.abs(to)<2)return;const t0=performance.now(),D=650;
  const fmt=v=>{let s=v.toFixed(dec);if(comma)s=Number(s).toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec});return m[1]+s+m[3]};
  const step=now=>{const k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,3);b.textContent=fmt(to*e);if(k<1)requestAnimationFrame(step);else b.textContent=t};requestAnimationFrame(step)})}
{const _rFx=render;render=function(){const r=_rFx.apply(this,arguments);setTimeout(()=>{try{fxCountUp()}catch(e){}},30);return r}}
{const _go=go;go=function(){document.body.classList.add("enter");clearTimeout(FXM.enterT);FXM.enterT=setTimeout(()=>document.body.classList.remove("enter"),700);return _go.apply(this,arguments)}}
document.body.classList.add("enter");setTimeout(()=>document.body.classList.remove("enter"),1100);
