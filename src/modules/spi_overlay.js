/* =====================================================================================================
   STOCK STATUS ON THE EQUIPMENT DRAWINGS AND 3D MODELS (owner: Claude B)
   Reads GET /api/data/equipment/<tag> (parts with stock, min_qty, max_qty, total_qty, crit_max) through spiApi, gives every BoM line a status
   and every zone of the drawing its worst status. Used by: gaFig and g3Info in g3d.js (legend, 3D tint, zone card), gaSvg of the SPI sets
   (cases/spi/geo/gad.js), and the selection panel of the equipment page (gP is wrapped here).
   Status rule (screening, shown in the legend): red = zero stock and (criticality S or A, or the part has had demand); amber = below Min;
   grey = above Max (excess); green = within Min and Max; light = no stock record in the baseline data.
   ===================================================================================================== */
regMod("spi_overlay","1.0",["spi_core"],"Stock status on equipment drawings and 3D models");
const SPIST={d:{},load:{}};
const SPI_SC={red:{n:"Stock out",rgb:[208,59,59,.72],c:"#d03b3b"},amber:{n:"Below Min",rgb:[236,170,30,.68],c:"#e0a100"},green:{n:"Within Min and Max",rgb:[63,165,90,.5],c:"#3fa55a"},grey:{n:"Above Max, excess",rgb:[139,149,165,.7],c:"#8b95a5"},none:{n:"No stock record",rgb:null,c:"#dfe4ec"}};
const SPI_RANK={red:4,amber:3,grey:2,green:1,none:0};
function spiStat(p){if(!p||p.stock==null)return"none";const st=+p.stock,mn=+p.min_qty||0,mx=+p.max_qty||0,dem=(+p.total_qty||0)>0;
 if(st<=0&&(p.crit_max==="S"||p.crit_max==="A"||dem))return"red";if(mn>0&&st<mn)return"amber";if(mx>0&&st>mx)return"grey";return"green"}
const spiWorst=l=>l.reduce((a,b)=>SPI_RANK[b]>SPI_RANK[a]?b:a,"none");
/* load once per set; the paint step runs when the data is there */
function spiStockLoad(n){if(!(typeof spiCls==="function"&&spiCls(n)))return Promise.resolve(null);if(SPIST.load[n])return SPIST.load[n];if(location.protocol==="file:"){SPIST.d[n]={error:"open the deployed site or the local server to see it"};setTimeout(()=>spiStockPaint(n),0);return Promise.resolve(null)}
 return SPIST.load[n]=spiApi("/api/data/equipment/"+encodeURIComponent(S(n).tag)).then(r=>{const by={};(r.parts||[]).forEach(p=>by[p.material_no]=p);
  const lines={};(GA[n].bom||[]).forEach((b,i)=>{const m=/Material\s+(\d{5,})/.exec(b.mat||""),p=m?by[+m[1]]:null;lines[i+1]={mat:m?+m[1]:null,part:p||null,stat:spiStat(p)}});
  const P=spiPrep(n),zs={};P.zones.forEach(z=>{const st=z.lines.map(l=>lines[l].stat),c={red:0,amber:0,grey:0,green:0,none:0};st.forEach(x=>c[x]++);zs[z.id]={worst:spiWorst(st),counts:c}});
  SPIST.d[n]={lines,zones:zs};spiStockPaint(n);return SPIST.d[n]}).catch(e=>{SPIST.d[n]={error:e.message||"No stock data"};SPIST.load[n]=null;spiStockPaint(n);return null})}
const spiChip=(st,t)=>`<span class="spi-st ${st}" title="${esc(SPI_SC[st].n)}"><i></i>${esc(t||SPI_SC[st].n)}</span>`;
/* legend with counts for one set (inner html) */
function spiLegendInner(n){const D=SPIST.d[n],P=spiPrep(n);if(!P)return"";
 const cnt={red:0,amber:0,grey:0,green:0,none:0};if(D&&D.lines)Object.values(D.lines).forEach(l=>cnt[l.stat]++);
 const msg=!D?`<span class="muted">Loading stock status of the parts</span>`:D.error?`<span class="muted">Stock status is not available: ${esc(D.error)}</span>`:"";
 return `<div class="spi-lg"><b>Stock status of the parts on this drawing</b>${["red","amber","green","grey","none"].map(k=>spiChip(k,SPI_SC[k].n+(D&&D.lines?" ("+cnt[k]+")":""))).join("")}</div>${msg}
 <div class="muted spi-rule">Screening rule from the baseline data: red = zero stock and criticality S or A, or the part has had demand; amber = below Min; grey = above Max; green = within Min and Max. A zone shows its worst part. Select a zone for its parts.</div>${D&&D.lines?spiZoneTable(n):""}`}
const spiLegendBox=n=>{if(!(typeof spiCls==="function"&&spiCls(n)))return"";setTimeout(()=>spiStockLoad(n),30);return `<div class="spi-stock" data-set="${n}">${spiLegendInner(n)}</div>`};
function spiZoneTable(n){const P=spiPrep(n),D=SPIST.d[n];if(!P||!D||!D.zones)return"";
 return `<div class="spi-zt"><table class="spi-t2"><thead><tr><th>No.</th><th>Zone on the drawing</th><th>Standard basis</th><th class="num">Parts</th><th>Status</th><th class="num">Red</th><th class="num">Amber</th><th class="num">Grey</th></tr></thead><tbody>${P.zones.filter(z=>z.key).map(z=>{const q=D.zones[z.id];return `<tr class="click" tabindex="0" onclick="gSel('${z.key}')" onkeydown="if(event.key==='Enter')this.click()"><td><b>${z.key}</b></td><td>${esc(z.label)}</td><td class="muted">${esc(z.ref)}</td><td class="num">${z.lines.length}</td><td>${spiChip(q.worst)}</td><td class="num">${q.counts.red}</td><td class="num">${q.counts.amber}</td><td class="num">${q.counts.grey}</td></tr>`}).join("")}</tbody></table></div>`}
/* card of one zone: every part in it with its stock status and a link to the Forecast page */
function spiZoneCard(n,k,card){const P=typeof spiPrep==="function"&&spiPrep(n);if(!P)return"";const z=P.zones.find(q=>q.key===k);if(!z)return"";const D=SPIST.d[n],ln=z.lines;
 const rows=ln.slice(0,12).map(l=>{const b=GA[n].bom[l-1],d=D&&D.lines&&D.lines[l],p=d&&d.part;
  return `<div class="spi-pr"><div class="top">${d?spiChip(d.stat,d.stat==="none"?"No record":null):""}<b>${l}</b><span class="nm">${esc(b.name)}</span></div><div class="nums muted">${p?`Stock <b>${spiNum(p.stock)}</b> | Min ${spiNum(p.min_qty)} | Max ${spiNum(p.max_qty)}`:"No stock figures in the baseline data"}${typeof spiPartOpen==="function"?` <button class="ghost" data-d="${esc(b.name).replace(/"/g,"&quot;")}" data-m="${d&&d.mat?d.mat:""}" onclick="spiPartOpen(this.dataset.d,+this.dataset.m||null)">3D</button>`:""}${d&&d.mat?` <button class="ghost" onclick="spiGo('spi_forecast',{mat:${d.mat}})">Forecast</button>`:""}</div></div>`}).join("");
 const zq=D&&D.zones&&D.zones[z.id],head=`<div class="row between"><b>${esc(z.key+" | "+z.label)}</b>${card?`<button class="ghost g3x" onclick="G3.pin=null;this.closest('.g3card').remove()" aria-label="Close">x</button>`:""}</div><div class="muted" style="font-size:11.5px;margin:2px 0 6px">${esc(z.ref)}. ${ln.length} part${ln.length===1?"":"s"} on this zone${zq?". Worst status: "+SPI_SC[zq.worst].n:""}.</div>`;
 const list=`<div class="spi-zc">${rows}${ln.length>12?`<div class="muted" style="font-size:11.5px">and ${ln.length-12} more in the parts list below</div>`:""}</div>`;
 return card?`<div class="g3card spi-g3c">${head}${list}</div>`:`<div class="spi-zp">${head}${list}</div><hr style="border:0;border-top:1px solid var(--line,#ddd);margin:10px 0">`}
/* 3D tint of a zone by its worst status */
function spiStockTint(n,orig){return k=>{const P=spiPrep(n),D=SPIST.d[n];if(P&&D&&D.zones){const z=P.zones.find(q=>q.key===k);if(z&&D.zones[z.id]){const c=SPI_SC[D.zones[z.id].worst].rgb;if(c)return c}}return orig?orig(k):null}}
function spiStockPaint(n){document.querySelectorAll('.spi-stock[data-set="'+n+'"]').forEach(e=>{e.innerHTML=spiLegendInner(n)});
 const P=spiPrep(n),D=SPIST.d[n];if(P&&D&&D.zones)P.zones.forEach(z=>{if(!z.key)return;const q=D.zones[z.id],c=SPI_SC[q.worst];document.querySelectorAll('.spi-ga [data-k="'+z.key+'"]').forEach(e=>{if(q.worst==="none"){e.removeAttribute("data-stock");e.style.removeProperty("--sc")}else{e.setAttribute("data-stock",q.worst);e.style.setProperty("--sc",c.c)}})});
 if(typeof G3!=="undefined"&&G3.inst)Object.values(G3.inst).forEach(I=>{I.dirty=true})}
/* the selection panel of the equipment page: zone card first */
{const _gP=gP;gP=function(){const k=G.sel,z=k&&spiZoneCard(G.n,k,0);return(z||"")+_gP()}}
