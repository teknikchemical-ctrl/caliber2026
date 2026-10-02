/* =====================================================================================================
   P&ID: VALVES THAT OPEN AND CLOSE, LIQUID LEVELS, FLOW THAT STOPS
   Every operable valve on a P&ID carries a badge (OPEN, CLOSED or percent open). Select the valve and use the panel, press the badge,
   or double-click the valve to change its position. A closed valve stops the flow in the pipe after it and in the pipes that
   continue from there. Closing a valve that proves a start permissive (for example XV-1201 and ZSO-1201) trips the item that depends on it,
   through the same cause and effect logic as the simulator. Interlock trips close their shutdown valves by themselves.
   Vessels show a liquid level that moves with the level instrument.
   ===================================================================================================== */
regMod("pidv","1.0",[],"P&ID valves, levels and flow");
const VLV={};let VCN=0;
const vIs=n=>{const t=String(n[0]),k=n[1];return(k==="a"&&!/^(PT|TT|FT|LT|PDT|FIT|VT|ST)-/.test(t))||(k==="x"&&/^(XV|HV|BLOCK|BYPASS|SAMPLE|FORCE)/i.test(t))};
const vKey=(s,i)=>s+":"+i;
const vDefClosed=n=>/NORMALLY CLOSED/i.test(String(n[6]||""));
function vClosed(s,i){const nd=D[s].n[i];let L=null;if(P.set===s){try{L=read(nd[0])}catch(e){}}if(L&&L.v==="CLOSED"&&L.s!=="NORMAL")return true;const m=VLV[vKey(s,i)];return m?m==="closed":vDefClosed(nd)}
const vCtl=n=>/^(FV|LV|PV|TV|TCV|PCV|FY)\b|^FV-|^LV-|^PV-|^TV-/.test(String(n[0]));
function vPct(s,i){const nd=D[s].n[i];let L=null;try{L=P.set===s?read(nd[0]):null}catch(e){}const m=L&&/(\d+(?:\.\d+)?)\s*% open/.exec(L.v);return m?Math.round(+m[1]):45}
/* where each pipe passes a valve: index of the pipe, and how far along it the valve sits */
function vPipes(s){if(D[s]._vp)return D[s]._vp;const out={};D[s].n.forEach((nd,i)=>{if(!vIs(nd))return;const V=[nd[2],nd[3]],hit=[];D[s].p.forEach((p,j)=>{const pts=p[0];let best=null;
  for(let q=0;q<pts.length-2;q+=2){const ax=pts[q],ay=pts[q+1],bx=pts[q+2],by=pts[q+3],dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((V[0]-ax)*dx+(V[1]-ay)*dy)/L)),px=ax+t*dx,py=ay+t*dy,d=Math.hypot(V[0]-px,V[1]-py);if(d<13&&(!best||d<best.d))best={d,seg:q/2,px,py}}
  if(best)hit.push({j,seg:best.seg,px:best.px,py:best.py,end:Math.hypot(V[0]-pts[pts.length-2],V[1]-pts[pts.length-1])<15,start:Math.hypot(V[0]-pts[0],V[1]-pts[1])<15})});
  out[i]=hit});return D[s]._vp=out}
/* the start permissive that proves this valve: a ZS item with the same number */
function vProve(s,i){const t=String(D[s].n[i][0]),num=(/(\d{3,5})/.exec(t)||[])[1];if(!num)return null;const z=D[s].n.find(x=>/^ZS/.test(String(x[0]))&&String(x[0]).includes(num)&&x[1]!=="a");return z?z[0]:null}
function vSet(i,state){const s=P.set,nd=D[s].n[i];if(!nd)return;VLV[vKey(s,i)]=state;D[s].n.forEach((o,k)=>{if(o[0]===nd[0]&&k!==i&&vIs(o)&&!/A\/B/.test(o[0]))VLV[vKey(s,k)]=state});
 const z=vProve(s,i);if(z){const key=FK(z);if(state==="closed"&&!/^(FV|LV|PV|TV)/.test(nd[0]))LIVE.f[key]=true;else delete LIVE.f[key]}
 try{audit("Valve operated",nd[0]+" "+state+" on "+S(s).tag)}catch(e){}
 const g=document.getElementById("n"+i);if(g){g.classList.add("vmove");setTimeout(()=>g.classList.remove("vmove"),700)}try{tick();pUpd()}catch(e){}}
function vToggle(i,ev){if(ev){ev.stopPropagation();ev.preventDefault()}vSet(i,vClosed(P.set,i)?"open":"closed")}
function vAuto(i){const s=P.set;delete VLV[vKey(s,i)];const z=vProve(s,i);if(z)delete LIVE.f[FK(z)];try{tick();pUpd()}catch(e){}}
/* badge on each valve and liquid in each vessel are added when the sheet is drawn */
{const _ns=nodeSvg;nodeSvg=function(n,i){let s=_ns.apply(this,arguments);const nd=n;
  if(vIs(nd)){const x=nd[2],y=nd[3],big=/big/.test(nd[7]||"");s=s.replace(/<\/g>$/,`<g class="vb ok" data-vb="${i}" transform="translate(${x+(big?20:13)} ${y-(big?30:24)})" onclick="vToggle(${i},event)" ondblclick="event.stopPropagation()"><rect x="-1" y="-9" width="42" height="14" rx="7"/><text x="20" y="1" text-anchor="middle">OPEN</text></g></g>`).replace('<g class="pdn ','<g ondblclick="vToggle('+i+',event)" class="pdn ')}
  if(nd[1]==="v"||nd[1]==="h"){const[t,k,x,y,w,h,l,o]=nd;let d;if(k==="v"){const a=w/2,r=Math.min(a,34);d=`M${x-a} ${y-h/2+r}A${a} ${r} 0 0 1 ${x+a} ${y-h/2+r}V${y+h/2-r}A${a} ${r} 0 0 1 ${x-a} ${y+h/2-r}z`}else{const r=Math.min(h/2,30);d=`M${x-w/2+r} ${y-h/2}H${x+w/2-r}A${r} ${h/2} 0 0 1 ${x+w/2-r} ${y+h/2}H${x-w/2+r}A${r} ${h/2} 0 0 1 ${x-w/2+r} ${y-h/2}z`}
   const x0=x-w/2-40,W=w+80,yb=y+h/2,wv=`M${x0} ${y} q ${W/8} -5 ${W/4} 0 t ${W/4} 0 t ${W/4} 0 t ${W/4} 0 t ${W/4} 0 V${yb+4} H${x0} z`;
   s=s.replace(/<\/g>$/,`<defs><clipPath id="vc${P.set}_${i}_${++VCN}"><path d="${d}"/></clipPath></defs><g clip-path="url(#vc${P.set}_${i}_${VCN})" class="vliq" data-i="${i}" data-y="${y}" data-h="${h}"><g class="vlv" transform="translate(0 0)"><path class="vw" d="${wv}"/></g></g></g>`)}
  return s}}
/* valve and vessel state on every update */
function vUpd(){const s=P.set,d=D[s];if(!d)return;const svg=document.getElementById("psvg");if(!svg)return;const pipes=vPipes(s);let dead=new Set(),part={};
 d.n.forEach((nd,i)=>{if(!vIs(nd))return;const cl=vClosed(s,i),g=document.getElementById("n"+i),b=svg.querySelector(`[data-vb="${i}"]`);if(!g||!b)return;const ctl=vCtl(nd),pct=ctl?vPct(s,i):null;
  g.classList.toggle("vclosed",cl);const txt=cl?"CLOSED":ctl?pct+"%":"OPEN";const te=b.querySelector("text");if(te.textContent!==txt)te.textContent=txt;b.setAttribute("class","vb "+(cl?"bad":ctl&&pct<5?"warn":"ok"));
  const w=txt.length*6+10,re=b.querySelector("rect");re.setAttribute("width",w);re.setAttribute("x",20-w/2);
  if(cl)(pipes[i]||[]).forEach(h=>{if(h.end)return;if(h.start||h.seg===0&&false)dead.add(h.j);else part[h.j]=h})});
 /* upstream of a closed valve keeps flowing; the rest of the line does not */
 Object.entries(part).forEach(([j,h])=>{const pts=d.p[j][0];if(h.seg===0&&Math.hypot(pts[0]-h.px,pts[1]-h.py)<4){dead.add(+j);delete part[j];}});
 let changed=true,guard=0;while(changed&&guard++<6){changed=false;d.p.forEach((p,k)=>{if(dead.has(k))return;const f=[p[0][0],p[0][1]];const isDown=[...dead].some(j=>{const q=d.p[j][0],e=[q[q.length-2],q[q.length-1]];return Math.hypot(e[0]-f[0],e[1]-f[1])<8})||Object.entries(part).some(([j,h])=>{const q=d.p[j][0],e=[q[q.length-2],q[q.length-1]];return Math.hypot(e[0]-f[0],e[1]-f[1])<8});if(isDown){dead.add(k);changed=true}})}
 d.p.forEach((p,j)=>{const f=document.getElementById("f"+j);if(!f)return;const was=f.dataset.vd;const isDead=dead.has(j),isPart=!!part[j];
  if(isDead)f.classList.add("off");else if(isPart)f.classList.add("off");else if(was==="1"||was==="2"){if(!(((p[1]||{}).g||[]).some(t=>isF(t)||isE(t)))&&!((p[1]||{}).o&&!(p[1].o.some(t=>isF(t)||isE(t)))))f.classList.remove("off")}
  f.dataset.vd=isDead?"1":isPart?"2":"";
  let up=svg.querySelector(`[data-vup="${j}"]`),dn=svg.querySelector(`[data-vdn="${j}"]`);
  if(isPart){const h=part[j],pts=p[0],a=[];for(let q=0;q<=h.seg;q++)a.push(pts[q*2]+","+pts[q*2+1]);a.push(h.px.toFixed(1)+","+h.py.toFixed(1));const b=[h.px.toFixed(1)+","+h.py.toFixed(1)];for(let q=h.seg+1;q<pts.length/2;q++)b.push(pts[q*2]+","+pts[q*2+1]);
   if(!up){up=document.createElementNS("http://www.w3.org/2000/svg","polyline");up.setAttribute("class","fl");up.setAttribute("data-vup",j);f.parentNode.insertBefore(up,f.nextSibling);dn=document.createElementNS("http://www.w3.org/2000/svg","polyline");dn.setAttribute("class","pipe vdead");dn.setAttribute("data-vdn",j);f.parentNode.insertBefore(dn,up.nextSibling)}
   up.setAttribute("points",a.join(" "));dn.setAttribute("points",b.join(" "));up.style.display="";dn.style.display=""}
  else{if(up)up.style.display="none";if(dn)dn.style.display="none"}
  const pc=svg.querySelectorAll(".pipe.pc")[j];if(pc)pc.classList.toggle("vdead",isDead)});
 /* liquid in vessels follows the level instrument */
 const lv=(()=>{const n=d.n.find(x=>/^(LT|LI|LSHH|LSLL|LIT)/.test(String(x[0])));if(!n)return 55;let L=null;try{L=read(n[0])}catch(e){}const m=L&&/(\d+(?:\.\d+)?)\s*%/.exec(L.v);return m?+m[1]:55})();
 svg.querySelectorAll(".vliq").forEach(g=>{const h=+g.dataset.h,y=+g.dataset.y,fill=lv/100,top=y+h/2-h*fill,lvg=g.querySelector(".vlv");lvg.setAttribute("transform","translate(0 "+(top-y).toFixed(1)+")")})}
{const _pu=pUpd;pUpd=function(){_pu.apply(this,arguments);try{vUpd()}catch(e){console.error(e)}}}
/* valve controls in the side panel */
{const _pp=pPanel;pPanel=function(){const h=_pp.apply(this,arguments),n=D[P.set].n[P.sel];if(!n||!vIs(n))return h;const i=P.sel,s=P.set,cl=vClosed(s,i),man=VLV[vKey(s,i)],z=vProve(s,i),ctl=vCtl(n);
  const trip=P.set===s&&(()=>{try{const L=read(n[0]);return L&&L.v==="CLOSED"&&L.s!=="NORMAL"}catch(e){return false}})();
  return `<div class="vpanel"><div class="row between"><b>Valve ${esc(String(n[0]))}</b><span class="tag ${cl?"bad":"ok"}">${cl?"CLOSED":ctl?vPct(s,i)+" % open":"OPEN"}</span></div>
  <div class="row" style="gap:6px;margin:8px 0"><button ${!cl?'class="ghost"':""} onclick="vSet(${i},'open')" ${trip?"disabled":""}>Open</button><button ${cl?'class="ghost"':""} onclick="vSet(${i},'closed')">Close</button><button class="ghost" onclick="vAuto(${i})" ${man?"":"disabled"}>Automatic</button></div>
  <p class="muted" style="font-size:12px;margin:0">${trip?"Closed by the interlock. Reset the trip to reopen it.":cl?"The flow in the pipe after this valve has stopped.":"Close it to stop the flow in the pipe after it."}${z?` It proves ${esc(z)}: closing it ${/^(FV|LV|PV|TV)/.test(n[0])?"does not":"will"} trip the item that needs it.`:""} Double-click the valve or press its badge to toggle.</p></div>`+h}}
