/* =====================================================================================================
   SPARE PART INTELLIGENCE: SHELL (owner: Claude A). Every spi_* page module builds on this file. See docs/spi/agents/B.md for the page list.
   Page module pattern (one file per page, owner of that page edits only its own file):
     spiRegister("spi_forecast","Forecast",async host=>{ const d=await spiApi("/api/data/part/"+id); host.innerHTML=`...`; });
   The page id must be listed in spi/pages.json (navigation entry; hidden until a module registers it).
   Helpers: spiApi(path[,body]) the ONLY fetch; spiCss(id,css); spiMoney, spiNum; spiKpi; spiCard; spiTable; spiLine (history + forecast + p10..p90 band);
            spiBars (horizontal bars, direct labels); spiBadge; spiEmpty; spiGo(page,x) to open another page; st.mat holds the part chosen on another page.
   Rules: one axis per chart, a table view for every chart, no number without its source, estimates say "Estimate", no work at start-up (everything runs inside the page function).
   ===================================================================================================== */
regMod("spi_core","1.0",[],"Spare part pages shell");
const SPI={pages:{},css:{},cache:new Map(),base:(typeof window!=="undefined"&&window.SPI_BASE)||""};
function spiCss(id,css){if(SPI.css[id])return;SPI.css[id]=1;const s=document.createElement("style");s.dataset.spi=id;s.textContent=css;document.head.appendChild(s)}
function spiRegister(id,label,fn){SPI.pages[id]={id,label,fn}}
async function spiApi(path,body,o={}){
  if(typeof window!=="undefined"&&typeof window.SPI_STUB==="function"){const r=await window.SPI_STUB(path,body);if(r!==undefined)return r}
  const key=body?null:path,hit=key&&SPI.cache.get(key);if(hit&&Date.now()-hit.t<60000)return hit.v;
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),o.timeout||30000);
  try{const r=await fetch(SPI.base+path,body?{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),signal:ctl.signal}:{signal:ctl.signal});
    let j=null;try{j=await r.json()}catch(_){}
    if(!r.ok)throw new Error((j&&j.error)||("The server answered "+r.status));
    if(key)SPI.cache.set(key,{t:Date.now(),v:j});return j}
  catch(e){throw new Error(e.name==="AbortError"?"The server took too long to answer":(location.protocol==="file:"?"This page needs the deployed site or tools/spi_dev.mjs: the data comes from the server":e.message))}
  finally{clearTimeout(to)}}
const spiNum=(n,d=0)=>n==null||isNaN(n)?"Not in baseline data":Number(n).toLocaleString("en-US",{maximumFractionDigits:d,minimumFractionDigits:d});
const spiMoney=n=>n==null||isNaN(n)?"Not in baseline data":(Math.abs(n)>=1e12?"IDR "+(n/1e12).toFixed(2)+" tn":Math.abs(n)>=1e9?"IDR "+(n/1e9).toFixed(1)+" bn":Math.abs(n)>=1e6?"IDR "+(n/1e6).toFixed(1)+" mn":"IDR "+Math.round(n).toLocaleString("en-US"));
const spiGo=(page,x)=>go(page,x||{});
const spiBadge=(t,tone)=>`<span class="spi-badge spi-${tone||"n"}">${esc(t)}</span>`;
const spiCritBadge=c=>c?spiBadge(c,{S:"bad",A:"warn",B:"n",C:"n"}[c]):spiBadge("unknown","n");
const spiEmpty=(msg)=>`<div class="spi-empty">${esc(msg||"Nothing to show for this selection.")}</div>`;
const spiKpi=(big,label,tone,sub)=>`<div class="spi-kpi spi-k-${tone||"n"}"><div class="spi-kv">${esc(big)}</div><div class="spi-kl">${esc(label)}</div>${sub?`<div class="spi-ks">${esc(sub)}</div>`:""}</div>`;
const spiCard=(title,body,sub)=>`<section class="spi-card"><h3>${esc(title)}</h3>${sub?`<p class="spi-sub">${esc(sub)}</p>`:""}${body}</section>`;
function spiTable(rows,cols,o={}){if(!rows||!rows.length)return spiEmpty(o.empty);
  const raw=spiTableRaw(rows,cols,o);if(o.always||rows.length<=5)return raw;return `<div class="spi-ts"><input class="spi-tsi" type="search" placeholder="Search ${rows.length} rows to show them" aria-label="Search the table" oninput="spiTs(this)"><p class="spi-sub spi-tsh">The table stays hidden until you search.</p><div class="spi-tsb" hidden>${raw}</div></div>`}
function spiTableRaw(rows,cols,o={}){
  return `<div class="spi-tw"><table class="spi-t"><thead><tr>${cols.map(c=>`<th${c.num?' class="r"':""}>${esc(c.h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr${o.row?` ${o.row(r)}`:""}>${cols.map(c=>`<td${c.num?' class="r"':""}>${c.f?c.f(r):esc(r[c.k]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`}
/* horizontal bars, direct labels, one axis. items:[{label,value,tone,text}] */
function spiBars(items,o={}){if(!items||!items.length)return spiEmpty();const mx=Math.max(...items.map(i=>i.value||0),1e-9);
  return `<div class="spi-bars">${items.map(i=>`<div class="spi-br"><div class="spi-bl">${esc(i.label)}</div><div class="spi-bt"><div class="spi-bf spi-f-${i.tone||"acc"}" style="width:${Math.max(0.5,(i.value||0)/mx*100)}%"></div>${i.over!=null?`<div class="spi-bf spi-f-bad" style="width:${Math.max(0,i.over/mx*100)}%;margin-left:0;position:absolute;right:auto;left:${Math.max(0,((i.value||0)-i.over)/mx*100)}%"></div>`:""}</div><div class="spi-bv">${esc(i.text!=null?i.text:spiNum(i.value))}</div></div>`).join("")}</div>`}
/* line chart: history and forecast on one axis with an optional p10 to p90 band. o:{labels:[...], history:[...], forecast:[...], lo:[...], hi:[...], unit} arrays are aligned to labels, null where absent */
function spiLine(o){const L=o.labels||[],W=720,H=o.h||240,m={l:46,r:14,t:12,b:30},n=L.length;if(!n)return spiEmpty();
  const all=[...(o.history||[]),...(o.forecast||[]),...(o.hi||[]),...(o.lo||[])].filter(v=>v!=null),mx=Math.max(...all,1),x=i=>m.l+(n<2?0:i*(W-m.l-m.r)/(n-1)),y=v=>H-m.b-(v/mx)*(H-m.t-m.b);
  const path=a=>{let d="",pen=false;a.forEach((v,i)=>{if(v==null){pen=false;return}d+=(pen?"L":"M")+x(i).toFixed(1)+" "+y(v).toFixed(1);pen=true});return d};
  let band="";if(o.lo&&o.hi){const pts=[];o.hi.forEach((v,i)=>{if(v!=null)pts.push(x(i).toFixed(1)+","+y(v).toFixed(1))});const lo=[];o.lo.forEach((v,i)=>{if(v!=null)lo.push(x(i).toFixed(1)+","+y(v).toFixed(1))});if(pts.length)band=`<polygon points="${pts.join(" ")} ${lo.reverse().join(" ")}" class="spi-band"/>`}
  const ticks=[0,.5,1].map(f=>`<line x1="${m.l}" x2="${W-m.r}" y1="${y(mx*f)}" y2="${y(mx*f)}" class="spi-grid"/><text x="${m.l-6}" y="${y(mx*f)+4}" text-anchor="end" class="spi-ax">${spiNum(mx*f,mx<10?1:0)}</text>`).join("");
  const step=Math.ceil(n/9),xl=L.map((t,i)=>i%step===0?`<text x="${x(i)}" y="${H-10}" text-anchor="middle" class="spi-ax">${esc(String(t).slice(2))}</text>`:"").join("");
  const fx=(o.history&&o.forecast)?(()=>{const k=o.history.findIndex((v,i)=>v!=null&&o.history[i+1]==null);return k>=0?`<line x1="${x(k+.5)}" x2="${x(k+.5)}" y1="${m.t}" y2="${H-m.b}" class="spi-split"/><text x="${x(k+.5)+4}" y="${m.t+10}" class="spi-ax">forecast</text>`:""})():"";
  return `<svg viewBox="0 0 ${W} ${H}" class="spi-svg" role="img" aria-label="${esc(o.title||"Line chart")}">${ticks}${band}${fx}${o.history?`<path d="${path(o.history)}" class="spi-l spi-l-h"/>`:""}${o.forecast?`<path d="${path(o.forecast)}" class="spi-l spi-l-f"/>`:""}${xl}</svg><div class="spi-leg"><span><i class="spi-l-h"></i>History</span>${o.forecast?'<span><i class="spi-l-f"></i>Forecast (p50)</span>':""}${o.lo?'<span><i class="spi-band-k"></i>p10 to p90</span>':""}${o.unit?`<span class="spi-sub">${esc(o.unit)}</span>`:""}</div>`}
/* vertical columns, one axis, direct value labels. items:[{label,value,tone}] */
function spiCols(items,o={}){if(!items||!items.length)return spiEmpty();const W=720,H=o.h||200,m={l:8,r:8,t:18,b:30},n=items.length,mx=Math.max(...items.map(i=>i.value||0),1),bw=(W-m.l-m.r)/n,col={acc:"var(--acc)",bad:"var(--bad)",warn:"var(--warn)",n:"var(--muted)",ok:"var(--ok)"};
  return `<svg viewBox="0 0 ${W} ${H}" class="spi-svg" role="img" aria-label="${esc(o.title||"Column chart")}">${items.map((i,k)=>{const h=(i.value||0)/mx*(H-m.t-m.b),x=m.l+k*bw+bw*.15,w=bw*.7;return `<rect x="${x.toFixed(1)}" y="${(H-m.b-h).toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(h,0.5).toFixed(1)}" rx="3" fill="${col[i.tone||"acc"]}"/><text x="${(x+w/2).toFixed(1)}" y="${(H-m.b-h-4).toFixed(1)}" text-anchor="middle" class="spi-ax">${esc(i.text!=null?i.text:spiNum(i.value))}</text><text x="${(x+w/2).toFixed(1)}" y="${H-12}" text-anchor="middle" class="spi-ax">${esc(String(i.label).slice(2))}</text>`}).join("")}</svg>`}
function spiRoute(p){p=(typeof SPI_ALIAS!=="undefined"&&SPI_ALIAS[p])||p;const hb=typeof spiHubFor==="function"&&spiHubFor(p);if(hb){SPIHUB.tab[hb.id]=p;p=hb.id}const pg=SPI.pages[p];if(!pg)return `<h1>${esc((SPIPAGES.find(x=>x[0]===p)||[0,"Page"])[1])}</h1>${spiEmpty("This page is not available in this build.")}`;
  const id="spih"+Date.now();setTimeout(async()=>{const h=document.getElementById(id);if(!h)return;try{await pg.fn(h)}catch(e){if(document.getElementById(id))h.innerHTML=`<div class="spi-err"><b>This page could not load.</b><p>${esc(e.message)}</p><button class="btn" onclick="render()">Try again</button></div>`}},0);
  return `<div id="${id}" class="spi-page"><h1>${esc(pg.label)}</h1><p class="spi-sub">Loading</p></div>`}
if(typeof document!=="undefined"){document.documentElement.dataset.spi="1";const prune=()=>{const reg=SPI.pages;document.querySelectorAll("aside .nav").forEach(n=>{if(!/^spi_h_/.test(n.dataset.page)||!reg[n.dataset.page])n.style.display="none"});document.querySelectorAll("aside .navsec").forEach(n=>n.style.display="none")};setTimeout(prune,300);setTimeout(prune,1500)}
if(typeof document!=="undefined"&&window.SPI_MODE)document.documentElement.classList.add("spi");

/* build stamp in the sidebar so a deployment can be told apart at a glance */
if(typeof document!=="undefined"&&window.SPI_MODE)setTimeout(()=>{try{const a=document.querySelector("aside .brand");if(a&&window.SPI_STAMP&&!document.getElementById("spibuild")){const s=document.createElement("small");s.id="spibuild";s.style.cssText="display:block;margin-top:6px;opacity:.7";s.textContent="Build "+SPI_STAMP.sha+" | "+SPI_STAMP.time;a.appendChild(s)}}catch(e){}},600);
