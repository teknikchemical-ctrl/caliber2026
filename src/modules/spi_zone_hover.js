/* Hover readout for every chart (owner: Claude B).
   The axis charts of the visual kit (spiAxLine, spiAxBars, spiAxXY in spi_viz.js) are wrapped here, without changing that file: each chart keeps its options under an id,
   and a pointer over the chart shows a crosshair, a dot on every series and a readout card with the date or category, every series with its colour, value, unit and basis,
   the 80% range of a band, and the total of a stacked bar. Line charts also print the value of the last point of each series at the right.
   Units: o.unit, else the text in brackets of the y-axis title ("Stock value (IDR bn)"), else the y-axis title. Basis: se.basis, else read from the series name
   (forecast, projected, recommended, median, runs, expected: Estimate; issued, raised, history, actual: Data; Assumption when the name says so).
   Touch: tap shows the readout. The shared timeline (kbTimeline) gets the same readout through kbTlHover. */
regMod("spi_zone_hover","1.0",["spi_core"],"Chart hover readout");
const KBH={n:0,o:{},keys:[]};
function kbhUnit(o){if(o.unit)return o.unit;const y=String(o.ylabel||""),m=/\(([^)]+)\)/.exec(y);return m?m[1]:y}
function kbhBasis(se,o){if(se.basis)return se.basis;if(o.basis)return o.basis;const n=String(se.name||"").toLowerCase();if(/assumption/.test(n))return"Assumption";if(/forecast|projected|projection|recommended|median|runs|expected|estimate|plan|optimi|8 in 10|80%/.test(n))return"Estimate";if(/issued|raised|history|actual|received|receipts|created|backlog|notifications|today/.test(n))return"Data";return""}
function kbhNum(v){if(v==null||!isFinite(v))return"n/a";const a=Math.abs(v);return a>=100?Math.round(v).toLocaleString("en-US"):a>=10?(+v.toFixed(1)).toLocaleString("en-US"):(+v.toFixed(2)).toLocaleString("en-US")}
/* value with its unit: "IDR bn" -> "IDR 12.4 bn", "%" -> "12.4%", "EA" -> "12.4 EA" */
function kbhVal(v,u,yfmt){if(v==null||!isFinite(v))return"n/a";u=String(u||"").trim();if(/^IDR\b/.test(u)){let r=u.replace(/^IDR\s*/,"");if(/^bn\b/.test(r)&&Math.abs(v)<1&&v!==0){v*=1000;r=r.replace(/^bn/,"mn")}else if(/^mn\b/.test(r)&&Math.abs(v)>=1000){v/=1000;r=r.replace(/^mn/,"bn")}return"IDR "+kbhNum(v)+(r?" "+r:"")}
 if(u==="%"||/^share|chance of|%\)?$/.test(u)){const f=yfmt?yfmt(v):"";return /%$/.test(f)?(+v).toFixed(Math.abs(v)<10?1:0)+"%":kbhNum(v)+"%"}
 if(!u&&yfmt){const f=String(yfmt(v));if(/[a-z%]/i.test(f))return f}return kbhNum(v)+(u?" "+u:"")}
function kbhTag(html,kind,o){const id="h"+(++KBH.n);KBH.o[id]={kind,o:{...o,labels:(o.labels||[]).map(typeof spiML==="function"?spiML:x=>x)}};KBH.keys.push(id);if(KBH.keys.length>600)delete KBH.o[KBH.keys.shift()];
 let h=html.replace("<svg ",`<svg data-kbh="${id}" `);
 if(kind==="line"&&!o.nolast){const G=kbhGeo(kind,KBH.o[id].o),u=kbhUnit(o);if(G){let t="";const used=[];o.series.slice(0,4).forEach(se=>{let i=se.values.length-1;while(i>=0&&(se.values[i]==null||!isFinite(se.values[i])))i--;if(i<0)return;let y=G.Y(se.values[i])-7;used.forEach(z=>{if(Math.abs(z-y)<12)y=z-12});used.push(y);
   t+=`<text x="${(G.X(i)-5).toFixed(1)}" y="${y.toFixed(1)}" text-anchor="end" class="kbh-last" style="fill:${spiCol(se.tone||"acc")}">${esc(kbhVal(se.values[i],u,o.yfmt))}</text>`});h=h.replace("</svg>",t+"</svg>")}}
 return h}
function kbhGeo(kind,o){const W=o.w||720,H=o.h||300,m={l:o.ml||58,r:o.mr||14,t:12,b:o.xlabel?48:34};let lo,hi;
 if(kind==="line"){const all=o.series.flatMap(s=>s.values).concat((o.bands||[]).flatMap(b=>[...b.lo,...b.hi]),(o.hlines||[]).map(h=>h.v)).filter(v=>v!=null&&isFinite(v));lo=Math.min(0,...all);hi=Math.max(...all,1e-9)}
 else if(kind==="bars"){const n=o.labels.length,tot=i=>o.series.reduce((s,x)=>s+(x.values[i]||0),0);hi=Math.max(...(o.stack?o.labels.map((_,i)=>tot(i)):o.series.flatMap(s=>s.values)),...(o.hlines||[]).map(h=>h.v),1e-9);lo=Math.min(0,...o.series.flatMap(s=>s.values))}
 else{const P=o.series.flatMap(s=>s.pts);lo=Math.min(0,...P.map(p=>p.y));hi=Math.max(...P.map(p=>p.y))}
 const yt=spiTicks(lo,hi),y0=yt[0],y1=yt[yt.length-1],Y=v=>H-m.b-(v-y0)/(y1-y0||1)*(H-m.t-m.b),n=(o.labels||[]).length,X=i=>m.l+(n<2?0:i*(W-m.l-m.r)/(n-1)),gw=(W-m.l-m.r)/Math.max(1,n);
 return{W,H,m,Y,X,gw,n,gx:i=>m.l+i*gw+gw/2}}
{const _L=spiAxLine,_B=spiAxBars,_X=spiAxXY;spiAxLine=function(o){return kbhTag(_L(o),"line",o)};spiAxBars=function(o){return kbhTag(_B(o),"bars",o)};spiAxXY=function(o){return kbhTag(_X(o),"xy",o)}}
function kbhTip(){let t=document.getElementById("kbh_tip");if(!t){t=document.createElement("div");t.id="kbh_tip";t.className="kbh-tip";t.hidden=true;document.body.appendChild(t)}return t}
function kbhHide(){const t=document.getElementById("kbh_tip");if(t)t.hidden=true;document.querySelectorAll(".kbh-o").forEach(g=>g.remove())}
function kbhPlace(t,cx,cy){t.hidden=false;const w=t.offsetWidth,h=t.offsetHeight,vw=window.innerWidth,vh=window.innerHeight;let x=cx+16,y=cy+14;if(x+w>vw-8)x=cx-w-16;if(y+h>vh-8)y=Math.max(8,cy-h-14);t.style.left=x+"px";t.style.top=y+"px"}
function kbhRow(c,name,val,basis,dash){return `<div class="kbh-r"><i style="background:${c}${dash?";opacity:.55":""}"></i><span>${esc(name)}</span><b>${esc(val)}</b>${basis?`<em>${esc(basis)}</em>`:""}</div>`}
function kbhMove(e){const svg=e.target&&e.target.closest?e.target.closest("svg[data-kbh]"):null;if(!svg){if(KBH.on){KBH.on=0;kbhHide()}return}const R=KBH.o[svg.dataset.kbh];if(!R)return;
 const ctm=svg.getScreenCTM();if(!ctm)return;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(ctm.inverse()),o=R.o;
 if(R.kind==="wf"){const i=Math.floor((p.x-o.m.l)/o.bw);if(i<0||i>=o.bars.length){kbhHide();KBH.on=0;return}KBH.on=1;const x=o.bars[i];let g=svg.querySelector(".kbh-o");if(!g){g=document.createElementNS("http://www.w3.org/2000/svg","g");g.setAttribute("class","kbh-o");svg.appendChild(g)}g.innerHTML=`<rect x="${o.m.l+i*o.bw}" y="${o.m.t}" width="${o.bw}" height="${o.H-o.m.b-o.m.t}" class="kbh-band"/>`;
  const t=kbhTip();t.innerHTML=`<div class="kbh-h">${esc(x.label)}${x.sub?" ("+esc(x.sub)+")":""}</div>${o.ylabel?`<div class="kbh-c">${esc(o.ylabel)}</div>`:""}${x.total?kbhRow("#33425a","Total",o.f(x.v),"Estimate"):kbhRow(x.v<0?"#3fa55a":"#c53030",x.v<0?"Lowers the cost by":"Raises the cost by",o.f(Math.abs(x.v)),"Estimate")+kbhRow("#9aa8bb","Running total after this step",o.f(x.b),"")}`;kbhPlace(t,e.clientX,e.clientY);return}
 const G=kbhGeo(R.kind,o),u=kbhUnit(o);
 if(p.x<G.m.l-4||p.x>G.W-G.m.r+4||p.y<0||p.y>G.H-G.m.b+6){kbhHide();KBH.on=0;return}KBH.on=1;
 let g=svg.querySelector(".kbh-o");if(!g){g=document.createElementNS("http://www.w3.org/2000/svg","g");g.setAttribute("class","kbh-o");svg.appendChild(g)}
 let rows="",head="",cap=o.title||o.ylabel||"",ov="";
 if(R.kind==="line"){const i=Math.max(0,Math.min(G.n-1,Math.round((p.x-G.m.l)/((G.W-G.m.l-G.m.r)/Math.max(1,G.n-1))))),x=G.X(i);head=o.labels[i];
  ov=`<line x1="${x}" x2="${x}" y1="${G.m.t}" y2="${G.H-G.m.b}" class="kbh-x"/>`;
  o.series.forEach(se=>{const v=se.values[i];if(v==null||!isFinite(v))return;const c=spiCol(se.tone||"acc");ov+=`<circle cx="${x}" cy="${G.Y(v)}" r="4.2" fill="${c}" stroke="#fff" stroke-width="2"/>`;rows+=kbhRow(c,se.name,kbhVal(v,u,o.yfmt),kbhBasis(se,o),se.dash)});
  (o.bands||[]).forEach(b=>{const a=b.lo[i],z=b.hi[i];if(a==null||z==null)return;rows+=kbhRow(spiCol(b.tone||"fc"),b.name||"Range",kbhVal(a,u,o.yfmt)+" to "+kbhVal(z,u,o.yfmt),b.basis||"Estimate",1)});
  (o.hlines||[]).forEach(h=>{rows+=kbhRow(spiCol(h.tone||"n"),h.label,kbhVal(h.v,u,o.yfmt),"",1)});
  if(o.vline!=null&&i>o.vline)head+=" | after the data cut-off"}
 else if(R.kind==="bars"){const i=Math.max(0,Math.min(G.n-1,Math.floor((p.x-G.m.l)/G.gw)));head=o.labels[i];ov=`<rect x="${G.m.l+i*G.gw}" y="${G.m.t}" width="${G.gw}" height="${G.H-G.m.b-G.m.t}" class="kbh-band"/>`;let tot=0,k=0;
  o.series.forEach(se=>{if(se.base)return;const v=se.values[i];if(v==null)return;tot+=v||0;k++;rows+=kbhRow(spiCol((se.colors&&se.colors[i])||(o.colors?o.colors[i]:null)||se.tone),se.name,kbhVal(v,u,o.yfmt),kbhBasis(se,o))});
  if(o.stack&&k>1)rows+=`<div class="kbh-t"><span>Total</span><b>${esc(kbhVal(tot,u,o.yfmt))}</b></div>`}
 else{let best=null,bd=1e9;const P=o.series.flatMap(se=>se.pts.map(q=>({q,se})));const xs=P.map(z=>z.q.x),x0=Math.min(0,...xs),x1=Math.max(...xs),xt=spiTicks(x0,x1),X=v=>G.m.l+(v-xt[0])/(xt[xt.length-1]-xt[0]||1)*(G.W-G.m.l-G.m.r);
  if(o.xlog)return;P.forEach(z=>{const d=Math.hypot(X(z.q.x)-p.x,G.Y(z.q.y)-p.y);if(d<bd){bd=d;best=z}});if(!best||bd>40){kbhHide();return}
  const xu=/\(([^)]+)\)/.exec(String(o.xlabel||""));head=best.q.label||best.se.name;ov=`<circle cx="${X(best.q.x)}" cy="${G.Y(best.q.y)}" r="7" fill="none" stroke="#1b2733" stroke-width="2"/>`;
  rows=kbhRow(spiCol(best.se.tone||"acc"),o.xlabel||"x",kbhVal(best.q.x,xu?xu[1]:"",o.xfmt),"")+kbhRow(spiCol(best.se.tone||"acc"),o.ylabel||"y",kbhVal(best.q.y,u,o.yfmt),"")}
 g.innerHTML=ov;const t=kbhTip();t.innerHTML=`<div class="kbh-h">${esc(String(head||""))}</div>${cap?`<div class="kbh-c">${esc(cap)}</div>`:""}${rows}`;kbhPlace(t,e.clientX,e.clientY)}
try{document.body.dataset.kbtip="1"}catch(e){}document.addEventListener("DOMContentLoaded",()=>{try{document.body.dataset.kbtip="1"}catch(e){}});
document.addEventListener("pointermove",kbhMove,{passive:true});document.addEventListener("pointerdown",e=>{if(e.pointerType==="touch")kbhMove(e)},{passive:true});
document.addEventListener("scroll",()=>{if(KBH.on){KBH.on=0;kbhHide()}},{passive:true,capture:true});
/* readout for the shared timeline: every visible series in the month under the pointer */
function kbTlRows(id,mk){const T=KBT[id],o=T.o,u=kbhUnit(o);let rows="";
 (o.series||[]).forEach((s,k)=>{if(T.hide["s"+k])return;const q=(s.points||[]).find(p=>String(p[0]).slice(0,7)===mk),b=(s.band||[]).find(p=>String(p[0]).slice(0,7)===mk);if(!q&&!b)return;
  const c=spiCol(s.tone);if(q&&q[1]!=null)rows+=kbhRow(c,s.name,kbhVal(q[1],s.unit||u),kbhBasis(s,o),s.dash);if(b)rows+=kbhRow(c,s.bandName||"80% range",kbhVal(b[1],s.unit||u)+" to "+kbhVal(b[2],s.unit||u),"Estimate",1)});
 const evs={};(o.events||[]).forEach(x=>{if(String(x.date).slice(0,7)===mk&&!T.hide[x.kind])evs[x.kind]=(evs[x.kind]||0)+1});
 Object.entries(evs).forEach(([k,n])=>{rows+=kbhRow((KB_EV[k]||["","#6b7a90"])[1],(KB_EV[k]||[k])[0],wsN(n)+" in the month","")});return rows}
function kbTlLine(id,sx){const E=document.getElementById(id),T=KBT[id];if(!E||!T||!T.geo)return;const svg=E.querySelector(".kb-svg");let ln=svg.querySelector(".kbh-x");if(!ln){ln=document.createElementNS("http://www.w3.org/2000/svg","line");ln.setAttribute("class","kbh-x");svg.appendChild(ln)}ln.setAttribute("x1",sx);ln.setAttribute("x2",sx);ln.setAttribute("y1",T.geo.m.t);ln.setAttribute("y2",T.geo.plotB||((T.o.h||300)-T.geo.m.b))}
function kbTlHover(id,e){const T=KBT[id],E=document.getElementById(id);if(!T||!E||!T.geo)return;const svg=E.querySelector(".kb-svg"),g0=T.geo,r=svg.getBoundingClientRect(),sx=(e.clientX-r.left)/r.width*g0.W;
 if(sx<g0.m.l||sx>g0.W-g0.m.r){kbTlHoverOff(id);return}const t=T.v0+(sx-g0.m.l)/(g0.W-g0.m.l-g0.m.r)*(T.v1-T.v0),d=new Date(t),mk=d.toISOString().slice(0,7),o=T.o,ids=o.link&&KBL[o.link]?KBL[o.link].filter(k=>KBT[k]&&document.getElementById(k)):[id];
 let body="";ids.forEach(k=>{const rw=kbTlRows(k,mk);if(rw)body+=(ids.length>1&&KBT[k].o.ylabel?`<div class="kbh-c">${esc(KBT[k].o.ylabel)}</div>`:"")+rw;const g=KBT[k].geo;if(g)kbTlLine(k,sx/g0.W*g.W)});
 const tp=kbhTip();tp.innerHTML=`<div class="kbh-h">${d.toLocaleDateString("en-GB",{month:"long",year:"numeric",timeZone:"UTC"})}${o.cut&&t>kbMs(o.cut)?" | after the data cut-off":""}</div>${ids.length===1&&o.ylabel?`<div class="kbh-c">${esc(o.ylabel)}</div>`:""}${body||'<div class="kbh-c">No value in this month</div>'}`;kbhPlace(tp,e.clientX,e.clientY)}
function kbTlHoverOff(id){const T=KBT[id],ids=T&&T.o.link&&KBL[T.o.link]?KBL[T.o.link]:[id];ids.forEach(k=>{const E=document.getElementById(k);if(E){const l=E.querySelector(".kbh-x");if(l)l.remove()}});const t=document.getElementById("kbh_tip");if(t)t.hidden=true}
