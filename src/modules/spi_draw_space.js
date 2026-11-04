/* SPI spatial library (owner: Claude B). The site opens in a game-like 3D world that holds every equipment set and every designed class template.
   Units sit on colour coded pads in six districts. Every unit is clickable (in 3D, in the list on the left, or by search) and opens a card with the real functional locations of its class
   from the baseline data, each one opening in Equipment 3D. Search flies the camera to the matching unit.
   Search sources: units (tag, name, class), the bill of materials of each set (local), and the location and part lists of the baseline data (server).
   Nothing here is invented: counts, statuses and location lists come from the baseline data; the layout and pads are schematic. */
regMod("spi_draw_space","3.0",["spi_core","spi_draw_parts","spi_overlay"],"Spatial library of equipment");
const SPSP={q:"",tok:0,tm:null,res:null,focus:null,ld:{},lb:{},fac:null,act:{},arrive:null};
/* districts: colour of the pad and the classes placed in them */
const SPCAT=[{id:"rot",n:"Rotating equipment",c:"#2f7fd0",cls:["pump","turbine","blower","motor"]},{id:"fir",n:"Fired heater",c:"#d9822b",cls:["furnace","burner","peepdoor","convsec","qfit","dsteam","coilout"]},
 {id:"sta",n:"Static equipment",c:"#3f9a5a",cls:["hx","vessel","column"]},{id:"val",n:"Valves",c:"#7b5fc4",cls:["valve","prv","sdv","mov"]},
 {id:"ins",n:"Instruments and electrical",c:"#c99a1b",cls:["instr","orifice","jbox"]},{id:"pip",n:"Piping and structures",c:"#6b7a90",cls:["line","foundation","cstation"]}];
const SPSHORT={turbine:"Turbine driver",pump:"Centrifugal pump",furnace:"Cracking furnace",hx:"Heat exchanger",valve:"Control valve",prv:"Relief valve",sdv:"Shutdown valve",mov:"Motor valve",vessel:"Vessel",column:"Column",instr:"Instrument",blower:"Compressor train",orifice:"Orifice",jbox:"Junction box",line:"Piping line",motor:"Motor",cstation:"Switch station",foundation:"Foundation",burner:"Burner",peepdoor:"Peep door",convsec:"Convection section",qfit:"Quench fitting",dsteam:"Dilution steam",coilout:"Coil outlet"};
/* class codes of the baseline data per designed class (the location list is filtered by code) and, for sub-items, a text search */
const SPCODES={pump:["PP"],turbine:["KT"],blower:["KC"],furnace:["BF"],hx:["HE"],valve:["FCV","LCV","PCV","TCV"],prv:["PRV"],sdv:["SDV"],mov:["MOV"],vessel:["VD"],column:["CL"],instr:["TIT","PIT","FIT","LIT","DPT","PGI","TEL"],orifice:["ROF"],jbox:["JBX"],line:["LINE"]};
const SPTXT={motor:"MOTOR FOR",cstation:"CONTROL SWITCH STATION",foundation:"CONCRETE STRUCTURE",burner:"BURNER",peepdoor:"PEEP DOOR",convsec:"CONVECTION SECTION",qfit:"QUENCH FITTING",dsteam:"DILUTION STEAM",coilout:"COIL OUTLET"};
const spiSpCls=n=>typeof spiCls==="function"?spiCls(n):null;
const spiSpLab=n=>{const c=spiSpCls(n)||(spiSpU(n)||{}).cls;return (typeof SPI_CLASSLAB!=="undefined"&&SPI_CLASSLAB[c])||c||"Equipment"};
const spiSpBomN=n=>((GA[n]&&GA[n].bom)||[]).length;
const spiSpMat=b=>{const m=/(\d{5,})/.exec(b.mat||"");return m?+m[1]:null};
const spiSpK=v=>/^\d+$/.test(String(v))?+v:v;
const spiSpU=n=>(p3Units().find(u=>u.n===n))||K.sets.find(x=>x.n===n)||{n,tag:String(n),name:""};
const spiSpRep=n=>(P3.rep&&P3.rep[n]!=null)?P3.rep[n]:n;
const spiSpBlock=n=>{const r=spiSpRep(n),u=spiSpU(r),c=u.cls||spiSpCls(r);return (c&&(SPSHORT[c]||(typeof SPI_CLASSLAB!=="undefined"&&SPI_CLASSLAB[c])))||u.tag};
const spiSpSub=n=>{const a=P3.alts&&P3.alts[n];return a?a.map(m=>S(m).tag).join(" | "):""};
/* fly to a unit; a set that shares its block with another set (same designed class) flies to the block and becomes the active set of it */
function spiSpFly(n){const r=spiSpRep(n);if(P3.alts&&P3.alts[r])SPSP.act[r]=n;SPSP.arrive={n:r,t0:performance.now()};p3Fly(r,false)}
/* one unit per equipment set and one template for every designed class that has no set; laid out by district. Registered the first time the plant is built. */
function spiSpTemplates(){if(P3.tpl)return;P3.tpl=[];const have={};K.sets.forEach(x=>{have[spiSpCls(x.n)]=1});
 Object.keys(SPI_BUILD).filter(c=>!have[c]).forEach(c=>{const lab=(typeof SPI_CLASSLAB!=="undefined"&&SPI_CLASSLAB[c])||c;let key=null;try{key=spiLocRegister({cls:c,funcloc:"TEMPLATE-"+c,tag:SPSHORT[c]||lab,parts:[]})}catch(e){key=null}
  if(!key||!G3M[key]||!G3M[key].length)return;
  const b=spiBBox(key),w=Math.max(b.mx[0]-b.mn[0],b.mx[2]-b.mn[2]),h=b.mx[1]-b.mn[1];P3SC[key]=+Math.max(1,Math.min(3.4,8.4/w,14/h)).toFixed(2);
  P3.tpl.push({n:key,tag:SPSHORT[c]||lab,name:lab+" (template)",tpl:1,cls:c})});
 /* one block per designed class: the sets of the same class share it (no double blocks) */
 P3.rep={};P3.alts={};{const seen={};K.sets.forEach(s=>{const c=spiSpCls(s.n)||("set"+s.n);if(seen[c]===undefined){seen[c]=s.n;P3.alts[s.n]=[s.n]}else P3.alts[seen[c]].push(s.n);P3.rep[s.n]=seen[c]})}
 /* district rows, one block per class */
 const rows=SPCAT.map(k=>{const L=[];k.cls.forEach(c=>{const r=K.sets.find(s=>spiSpCls(s.n)===c&&P3.rep[s.n]===s.n);if(r)L.push(r.n);P3.tpl.filter(u=>u.cls===c).forEach(u=>L.push(u.n))});return L});
 P3.cat={};P3.dl=[];rows.forEach((L,r)=>{L.forEach((n,i)=>{P3POS[n]=[(i-(L.length-1)/2)*12.5,r*15];P3.cat[n]=SPCAT[r]});P3.dl.push({n:SPCAT[r].n,s:["Rotating","Fired heater","Static","Valves","Instruments","Piping"][r],c:SPCAT[r].c,x:-(L.length-1)/2*12.5-6.5,z:r*15+6,len:L.length,r})});
 K.sets.forEach(s=>{if(!P3.cat[s.n]&&P3.rep[s.n]!==s.n)P3.cat[s.n]=P3.cat[P3.rep[s.n]]});
 if(window.P3SITE){P3SITE.world=true;P3SITE.dist=110;P3SITE.cz=30;P3SITE.pit=.88;P3.cam.yaw=-.36}}
/* the world: dark floor with a faint grid, one round pad per unit in the colour of its district (no roads, no pipe rack) */
function spiWorldScene(){const B=p3B,L=[B(0,-.3,33,170,.4,100,"#e3e9f2",{r:.5,zb:3})];
 for(let x=-80;x<=80;x+=10)L.push(B(x,-.08,33,.05,.02,100,"#d3dce8"));for(let z=-17;z<=83;z+=10)L.push(B(0,-.08,z,170,.02,.05,"#d3dce8"));
 /* a slab per district with a coloured front edge, a white plinth with a coloured rim per block */
 (P3.dl||[]).forEach(d=>{const w=d.len*12.5+3;L.push(B(0,-.02,d.r*15,w,.18,11.6,"#d2dbe8",{r:.3}),B(0,.08,d.r*15+5.9,w,.05,.22,d.c))});
 p3Units().forEach(u=>{const [x,z]=P3POS[u.n]||[0,0],c=(P3.cat[u.n]||SPCAT[5]).c;
  L.push(B(x,.1,z,10.6,.3,10.6,"#f6f8fb",{r:.5}),B(x,.27,z-5.15,10.6,.04,.3,c),B(x,.27,z+5.15,10.6,.04,.3,c),B(x-5.15,.27,z,.3,.04,10.6,c),B(x+5.15,.27,z,.3,.04,10.6,c))});
 return L}
/* effects drawn over the world: district names, hover ring, selection ring, arrival wave (plain lines, no glow) */
/* process connections between blocks, from the piping line descriptions (FROM x TO y) */
async function spiSpFlows(){if(SPSP.flows!==undefined||location.protocol==="file:")return;SPSP.flows=null;try{const r=await spiApi("/api/ws/flows");const B={};
 const blockOf=c=>{const cl=typeof spiClsOf==="function"?spiClsOf(c):null;if(!cl)return null;const s0=K.sets.find(x=>spiSpCls(x.n)===cl);if(s0)return spiSpRep(s0.n);const t=(P3.tpl||[]).find(x=>x.cls===cl);return t?t.n:null};
 r.outputs.pairs.forEach(p=>{const a=blockOf(p.from),b=blockOf(p.to);if(a==null||b==null)return;const k=[a,b].sort().join("|");const x=B[k]=B[k]||{a,b,lines:0,self:a===b,codes:{}};x.lines+=p.lines;x.codes[p.from+" to "+p.to]=p.lines});
 SPSP.flows={pairs:Object.values(B),lines:r.outputs.lines_used};SPSP.flowMax=Math.max(1,...SPSP.flows.pairs.filter(x=>!x.self).map(x=>x.lines));spiWsSet("explorer_flows",{title:"Process connections between equipment classes",outputs:{pairs:r.outputs.pairs.slice(0,40),lines_used:r.outputs.lines_used},sources:r.sources});if(typeof p3Panel==="function")p3Panel()}catch(e){}}
function spiSpFlowList(n){const F=SPSP.flows;if(!F)return"";const L=F.pairs.filter(x=>x.a===n||x.b===n).sort((x,y)=>y.lines-x.lines);if(!L.length)return"";return `<div class="sp-g" style="padding-left:0">Process connections (piping lines)</div><div class="sp-fl">${L.slice(0,6).map(x=>{const o=x.a===n?x.b:x.a;return `<button class="sp-flr" onclick="spiSpGo('${o}')"><span>${x.self?"Within the class":wsE(spiSpBlock(o))}</span><i style="width:${Math.max(4,x.lines/(SPSP.flowMax||1)*100)}%"></i><b>${wsN(x.lines)}</b></button>`}).join("")}</div>`}
P3.fx=function(ctx,proj,t,cam,W,H){
 if(SPSP.flows&&SPSP.showFlows!==false){const sel=P3.sel;SPSP.flows.pairs.forEach(f=>{if(f.self)return;const A=P3.units[f.a],B=P3.units[f.b];if(!A||!B)return;const on=sel&&(f.a===sel||f.b===sel);if(sel&&!on&&SPSP.flowOnly)return;
   const d=Math.hypot(A.x-B.x,A.z-B.z),hgt=2+Math.min(10,d*0.12),pts=[];for(let k=0;k<=18;k++){const u=k/18,q=proj([A.x+(B.x-A.x)*u,(A.top*0.6)*(1-u)+(B.top*0.6)*u+Math.sin(u*Math.PI)*hgt,A.z+(B.z-A.z)*u]);if(!q)return;pts.push(q)}
   ctx.save();ctx.globalAlpha=on?0.9:sel?0.08:0.28;ctx.strokeStyle=on?"#1d6fd6":"#5f86c4";ctx.lineWidth=1+f.lines/SPSP.flowMax*(on?7:5);ctx.lineCap="round";ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();
   if(on){const m=pts[9];ctx.globalAlpha=1;ctx.font="600 11px system-ui,sans-serif";ctx.textAlign="center";const tx=wsN(f.lines)+" lines";const w=ctx.measureText(tx).width+10;ctx.fillStyle="#fff";ctx.fillRect(m[0]-w/2,m[1]-15,w,16);ctx.strokeStyle="#1d6fd6";ctx.lineWidth=1;ctx.strokeRect(m[0]-w/2,m[1]-15,w,16);ctx.fillStyle="#1d4f96";ctx.fillText(tx,m[0],m[1]-3)}ctx.restore()})}
 (P3.dl||[]).forEach(d=>{const q=proj([d.x,.6,d.z]);if(!q)return;const fs=Math.max(9,Math.min(16,1000/q[2]));ctx.font="700 "+fs+"px system-ui,sans-serif";ctx.textAlign="right";ctx.globalAlpha=P3.sel?.4:1;ctx.fillStyle=d.c;ctx.fillRect(q[0]+4,q[1]-fs*.8,4,fs);ctx.fillStyle="#33425a";ctx.fillText((d.s||d.n).toUpperCase(),q[0],q[1]);ctx.globalAlpha=1});
 const ring=(u,rad,col,w,a,y)=>{const pts=[];for(let i=0;i<=48;i++){const k=i/48*Math.PI*2,q=proj([u.x+Math.cos(k)*rad,y==null?.35:y,u.z+Math.sin(k)*rad]);if(!q)return;pts.push(q)}
  ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.restore()};
 const hv=P3.hover&&P3.units[P3.hover];if(hv&&P3.hover!==P3.sel)ring(hv,hv.r*1.2+1.2,(P3.cat[P3.hover]||SPCAT[5]).c,2.2,.85);
 const n=P3.sel,u=n&&P3.units[n];if(!u)return;const col=(P3.cat[n]||SPCAT[5]).c;
 ring(u,u.r*1.25+1.4,col,3,.95);
 const A=SPSP.arrive;if(A&&A.n===n){const e=(performance.now()-A.t0)/1300;if(e<1){ring(u,u.r*1.25+e*12,col,2.5,.7*(1-e),.3)}else SPSP.arrive=null}};
spiRegister("spi_space","Equipment library",async host=>{
 const h=Math.max(520,(window.innerHeight||800)-150);
 spiSpTemplates();host.classList.add("sp-wrap");
 host.innerHTML=`<div class="sp-top"><div class="sp-search"><input id="sp_q" type="search" autocomplete="off" placeholder="Search a tag, part or location, e.g. KT-383A, bearing, relief valve" aria-label="Search the equipment library" oninput="spiSpType(this.value)" onkeydown="if(event.key==='Enter')spiSpEnter();if(event.key==='Escape')spiSpClear()"><div id="sp_res" class="sp-res" hidden></div></div>
  <div class="sp-count"><b>${p3Units().length}</b> equipment blocks, one per designed class: <b>${K.sets.length}</b> equipment sets in ${p3Units().length-P3.tpl.length} blocks, plus <b>${P3.tpl.length}</b> class templates. Select a block in the world or in the list, or search.</div></div>
 <div class="sp-lay"><nav class="sp-nav" id="sp_nav" aria-label="All blocks">${spiSpNav()}</nav><div class="sp-main">${p3Hero({embed:true,h,fn:()=>"ok",lab:n=>esc(spiSpSub(n))})}</div></div>`;
 {const q=(c,k)=>{const e=host.querySelector(c);if(e)e.classList.add(k)};q(".p3head","sp-ph");q(".p3tools","sp-pt");q(".p3key","sp-pk");q("#p3card","sp-cd")}
 {const wb=host.querySelector(".sp-pt button");if(wb)wb.textContent="All blocks"}
 P3.orbit=true;spiSpDecorate();spiSpFacets();
 if(st.focus){const q=String(st.focus);st.focus=null;const i=document.getElementById("sp_q");if(i){i.value=q;spiSpType(q)}}
});
function spiSpDecorate(n){if(!P3.labs){if((n||0)<40)setTimeout(()=>spiSpDecorate((n||0)+1),150);return}
 p3Units().forEach(u=>{const e=P3.labs[u.n];if(!e)return;e.classList.add("sp-lb");if(u.tpl)e.classList.add("sp-tl");{const b=e.querySelector("b");if(b)b.textContent=spiSpBlock(u.n)}e.style.setProperty("--pc",(P3.cat[u.n]||SPCAT[5]).c)})}
/* number of locations per class code, once */
async function spiSpFacets(){if(SPSP.fac||location.protocol==="file:")return;try{const r=await spiApi("/api/data/locations?limit=1");SPSP.fac={};((r.facets&&r.facets.by_class)||[]).forEach(x=>SPSP.fac[x.k]=x.locations);SPSP.total=r.total;
  const n=document.getElementById("sp_nav");if(n)n.innerHTML=spiSpNav()}catch(e){}}
const spiSpCount=u=>{const c=u.cls||spiSpCls(u.n);if(!SPSP.fac||!SPCODES[c])return null;return SPCODES[c].reduce((a,k)=>a+(SPSP.fac[k]||0),0)};
function spiSpNav(){return SPCAT.map(k=>{const us=p3Units().filter(u=>(P3.cat[u.n]||SPCAT[5])===k);return us.length?`<div class="sp-ng"><span class="sp-nd" style="background:${k.c}"></span>${esc(k.n)}</div>`+us.map(u=>{const c=spiSpCount(u),sub=u.tpl?"Template":spiSpSub(u.n);return `<button class="sp-ni" data-n="${u.n}" style="--pc:${k.c}" onclick="spiSpGo('${u.n}')"><b>${esc(spiSpBlock(u.n))}</b><span>${esc(sub)}${c!=null?(sub?" | ":"")+spiNum(c)+" locations":""}</span></button>`}).join(""):""}).join("")}
/* the plant 3D card of this page shows baseline data only */
{const _c=p3Card;p3Card=function(n){return st.page==="spi_space"?spiSpCard(n):_c(n)}}
function spiSpCard(n){const u=spiSpU(n),f=SPSP.focus,cat=P3.cat[n]||SPCAT[5],alts=P3.alts&&P3.alts[n],m=alts?(SPSP.act[n]&&alts.indexOf(SPSP.act[n])>=0?SPSP.act[n]:alts[0]):null;
 let head,body="",title=u.name||u.tag;
 if(u.tpl){head=`<span class="tag acc">Template</span>`;body=`<div class="muted" style="font-size:12px;margin-bottom:6px">Schematic 3D template of this equipment class, drawn from the parts descriptions of its locations. It has no equipment set of its own: stock and spare parts are shown on each real location.</div>`}
 else{const s=S(m),D=SPIST.d[m];title=s.name;if(!D&&!SPSP.ld[m]&&typeof spiStockLoad==="function"){SPSP.ld[m]=1;Promise.resolve(spiStockLoad(m)).then(()=>{if(P3.sel===n)p3Panel()})}
  let stock="";if(D&&D.lines){const c={red:0,amber:0,grey:0,green:0,none:0};Object.values(D.lines).forEach(l=>c[l.stat]++);stock=`<div class="sp-cs">${["red","amber","green","grey","none"].filter(k=>c[k]).map(k=>spiChip(k,c[k]+" "+SPI_SC[k].n.toLowerCase())).join(" ")}</div>`}
  else if(D&&D.error)stock=`<p class="muted" style="font-size:12px">Stock statuses need the server: ${esc(D.error)}</p>`;else stock=`<p class="muted" style="font-size:12px">Loading stock statuses</p>`;
  head=`<span class="tag acc">${esc(s.tag)}</span> ${s.crit?`<span class="tag">${esc(s.crit==="HIGH CRITICAL"?"Criticality S":"Criticality A")}</span>`:""}`;
  const chips=alts.length>1?`<div class="sp-g" style="padding-left:0">Equipment sets in this block</div><div class="sp-ex">${alts.map(a=>`<button class="ghost ${a===m?"on":""}" onclick="spiSpAct('${n}',${a})">${esc(S(a).tag)}</button>`).join("")}</div>`:"";
  body=`<div class="muted" style="font-size:12px;margin-bottom:6px">${esc(spiSpBlock(n))} | ${spiNum(spiSpBomN(m))} spare parts in the bill of materials</div>${chips}${stock}<div class="row" style="gap:6px;flex-wrap:wrap;margin:8px 0"><button onclick="exOpenSet(${m})">Open the equipment in 3D</button><button class="ghost" onclick="go('equipment',{set:${m},tab:'overview'})">Full set page</button></div>`}
 const fb=f&&f.n===n?`<div class="sp-fo"><div class="muted" style="font-size:12px">You searched</div><b>${esc(f.tag||"")}</b> ${esc(typeof spiName==="function"?spiName(f.descr||""):f.descr||"")}<br><span class="muted" style="font-size:12px">${esc(f.note||"")}</span>${f.funcloc?`<div style="margin-top:6px"><button onclick="exOpenFunc('${esc(f.funcloc).replace(/'/g,"")}')">Open ${esc(f.tag||"it")} in 3D</button></div>`:""}</div>`:"";
 return `<div class="row between"><div>${head}</div><button class="ghost g3x" onclick="SPSP.focus=null;p3Reset()" aria-label="Back to the whole world">All blocks</button></div><h3 style="margin:8px 0 2px;border-left:4px solid ${cat.c};padding-left:8px">${esc(title)}</h3>${body}${fb}${spiSpFlowList(n)}${spiSpLocBox(u)}`}
function spiSpAct(n,m){SPSP.act[spiSpK(n)]=m;SPSP.focus=null;p3Panel()}
/* all functional locations of the class of a unit: filter, page, open each one in Equipment 3D */
function spiSpLocBox(u){const c=u.cls||spiSpCls(u.n),codes=SPCODES[c],id=String(u.n);let B=SPSP.lb[id];if(!B)B=SPSP.lb[id]={code:codes?codes[0]:"",q:"",rows:null,total:null,off:0,busy:0};
 if(B.rows==null&&!B.busy&&location.protocol!=="file:")setTimeout(()=>spiSpLocLoad(id,c,true),0);
 const chips=codes&&codes.length>1?`<div class="sp-ex">${codes.map(k=>`<button class="ghost ${B.code===k?"on":""}" onclick="spiSpLocCode('${id}','${c}','${k}')">${k}${SPSP.fac&&SPSP.fac[k]!=null?" "+spiNum(SPSP.fac[k]):""}</button>`).join("")}</div>`:"";
 const rows=B.rows;
 return `<div class="sp-g" style="padding-left:0">Functional locations of this class${B.total!=null?" ("+spiNum(B.total)+")":""}</div>${chips}<input class="sp-lf" placeholder="Filter by tag or description" value="${esc(B.q)}" oninput="spiSpLocFilter('${id}','${c}',this.value)" aria-label="Filter the locations">
 <div class="sp-ll">${rows==null?`<p class="muted" style="font-size:12px">${location.protocol==="file:"?"The location list needs the server.":"Loading locations"}</p>`:rows.length?rows.map(r=>`<button class="sp-lr" data-f="${esc(r.funcloc).replace(/"/g,"&quot;")}" onclick="exOpenFunc(this.dataset.f)"><b>${esc(r.tag||r.funcloc)}</b><span>${esc(typeof spiName==="function"?spiName(r.descr||""):r.descr||"")}</span>${r.criticality?spiCritBadge(r.criticality):""}</button>`).join("")+(B.total>rows.length?`<button class="ghost sp-more" onclick="spiSpLocMore('${id}','${c}')">Show ${Math.min(30,B.total-rows.length)} more</button>`:""):`<p class="muted" style="font-size:12px">No location found.</p>`}</div>`}
async function spiSpLocLoad(id,c,reset){const B=SPSP.lb[id];if(!B||B.busy)return;B.busy=1;if(reset){B.off=0;B.rows=null}
 try{const codes=SPCODES[c],param=codes?"class="+B.code:"q="+encodeURIComponent(SPTXT[c]||""),qq=B.q?"&q="+encodeURIComponent(B.q):"",r=await spiApi("/api/data/locations?limit=30&offset="+B.off+"&"+(codes?param+qq:"q="+encodeURIComponent((SPTXT[c]||"")+(B.q?" "+B.q:""))));
  const rows=r.rows||r.locations||r.items||[];B.rows=(reset?[]:(B.rows||[])).concat(rows);B.total=r.total}catch(e){B.rows=B.rows||[];B.total=B.total||0}
 B.busy=0;if(String(P3.sel)===id){const i=document.activeElement&&document.activeElement.classList.contains("sp-lf");const v=i?document.activeElement.value:null,pos=i?document.activeElement.selectionStart:0;p3Panel();if(i){const nf=document.querySelector(".sp-lf");if(nf){nf.focus();try{nf.setSelectionRange(pos,pos)}catch(e){}}}}}
function spiSpLocCode(id,c,k){const B=SPSP.lb[id];B.code=k;spiSpLocLoad(id,c,true);p3Panel()}
function spiSpLocMore(id,c){const B=SPSP.lb[id];B.off=B.rows.length;spiSpLocLoad(id,c,false)}
function spiSpLocFilter(id,c,v){const B=SPSP.lb[id];B.q=v.trim();clearTimeout(B.tm);B.tm=setTimeout(()=>{B.busy=0;spiSpLocLoad(id,c,true)},320)}
/* ---------- search ---------- */
function spiSpToks(q){return q.toLowerCase().split(/[\s,]+/).filter(Boolean)}
function spiSpLocal(q){const T=spiSpToks(q),sets=[],inside=[];if(!T.length)return{sets,inside};
 K.sets.concat(P3.tpl||[]).forEach(u=>{const hay=(u.tag+" "+u.name+" "+(u.tpl?"":spiSpLab(u.n))+" "+(u.fluid||"")+" "+((P3.cat[u.n]||P3.cat[spiSpRep(u.n)]||{}).n||"")).toLowerCase();if(T.every(t=>hay.indexOf(t)>=0))sets.push(u.n)});
 K.sets.forEach(s=>{const hits=[];((GA[s.n]&&GA[s.n].bom)||[]).forEach(b=>{const hh=((b.name||"")+" "+(b.mat||"")).toLowerCase();if(T.every(t=>hh.indexOf(t)>=0))hits.push(b)});if(hits.length)inside.push({n:s.n,hits})});
 const ql=q.trim().toLowerCase(),ex=n=>String(spiSpU(n).tag).toLowerCase()===ql?0:1;sets.sort((a,b)=>ex(a)-ex(b));
 return{sets,inside}}
function spiSpClear(){const i=document.getElementById("sp_q"),r=document.getElementById("sp_res");if(i)i.value="";if(r){r.hidden=true;r.innerHTML=""}SPSP.q="";SPSP.res=null;SPSP.focus=null;p3Reset()}
function spiSpType(v){clearTimeout(SPSP.tm);const q=v.trim();SPSP.q=q;const R=document.getElementById("sp_res");if(!R)return;if(q.length<2){R.hidden=true;R.innerHTML="";return}
 const L=spiSpLocal(q);SPSP.res={L,loc:null,parts:null};
 /* automatic divert: the first matching unit, or else the set with most matching bill of material lines */
 if(L.sets.length>=1){SPSP.focus=null;spiSpFly(L.sets[0])}else if(L.inside.length){SPSP.focus=null;spiSpFly(L.inside.slice().sort((a,b)=>b.hits.length-a.hits.length)[0].n)}
 spiSpPaint();const tok=++SPSP.tok;SPSP.tm=setTimeout(()=>spiSpRemote(q,tok),280)}
async function spiSpRemote(q,tok){if(location.protocol==="file:")return;
 try{const words=spiSpToks(q),primary=words.slice().sort((a,b)=>b.length-a.length)[0],enc=encodeURIComponent(primary);
  const [lc,pt]=await Promise.all([spiApi("/api/data/locations?limit=6&q="+encodeURIComponent(q)).catch(()=>null),spiApi("/api/data/parts?limit=30&q="+enc).catch(()=>null)]);
  if(tok!==SPSP.tok||!SPSP.res)return;
  let rows=(pt&&pt.rows)||[];if(words.length>1)rows=rows.filter(p=>{const h=((p.descr||"")+" "+(p.for_tag||"")+" "+p.material_no).toLowerCase();return words.every(w=>h.indexOf(w)>=0)});
  SPSP.res.loc=(lc&&(lc.locations||lc.rows||lc.items))||[];SPSP.res.parts=rows.slice(0,6);SPSP.res.pt=pt&&pt.total;
  const L=SPSP.res.L;if(!L.sets.length&&!L.inside.length&&SPSP.res.loc.length){const n=spiSpSetOfLoc(SPSP.res.loc[0]);if(n)spiSpFly(n)}
  spiSpPaint()}catch(e){}}
function spiSpSetOfLoc(x){const tag=(x.tag||"").toUpperCase(),own=K.sets.find(s=>s.tag.toUpperCase()===tag);if(own)return own.n;
 const cls=(typeof spiSubCls==="function"&&spiSubCls((x.eq_class||"").toUpperCase(),x.descr))||(typeof spiClsOf==="function"&&spiClsOf((x.eq_class||"").toUpperCase()));if(!cls)return 0;
 const s=K.sets.find(q=>spiSpCls(q.n)===cls);if(s)return s.n;const t=(P3.tpl||[]).find(q=>q.cls===cls);return t?t.n:0}
function spiSpPaint(){const R=document.getElementById("sp_res");if(!R||!SPSP.res)return;const {L,loc,parts}=SPSP.res;let h="";
 if(L.sets.length)h+=`<div class="sp-g">Units in the library</div>`+L.sets.map(n=>`<button class="sp-r" onclick="${spiSpU(n).tpl?`spiSpGo('${n}')`:`spiSpGo('${n}');setTimeout(()=>exOpenSet(${n}),600)`}"><b>${esc(spiSpU(n).tag)}</b><span>${esc(spiSpU(n).name)}${spiSpU(n).tpl?"":" | "+esc(spiSpLab(n))}</span></button>`).join("");
 if(L.inside.length)h+=`<div class="sp-g">Parts inside the sets</div>`+L.inside.slice(0,3).map(g=>g.hits.slice(0,3).map(b=>`<button class="sp-r" onclick="spiSpPart('${g.n}',${spiSpMat(b)||0},'${esc(b.name).replace(/'/g,"")}')"><b>${esc(S(g.n).tag)}</b><span>${esc(typeof spiDesc==="function"?spiDesc(b.name):b.name)}</span></button>`).join("")).join("");
 if(loc&&loc.length)h+=`<div class="sp-g">Locations in the plant</div>`+loc.map(x=>{const n=spiSpSetOfLoc(x);return `<button class="sp-r" data-f="${esc(x.funcloc).replace(/"/g,"&quot;")}" onclick="spiSpLoc(this.dataset.f)"><b>${esc(x.tag||x.funcloc)}</b><span>${esc(typeof spiName==="function"?spiName(x.descr||""):x.descr||"")}${n?" | shown on "+esc(spiSpU(n).tag)+(spiSpU(n).tpl?" template":""):" | no 3D template"}</span></button>`}).join("");
 if(parts&&parts.length)h+=`<div class="sp-g">Parts in the catalogue${SPSP.res.pt?" ("+spiNum(SPSP.res.pt)+" match)":""}</div>`+parts.map(p=>`<button class="sp-r" onclick="spiSpCat(${p.material_no})"><b>${esc(p.material_no)}</b><span>${esc(typeof spiDesc==="function"?spiDesc(p.descr):p.descr)}</span></button>`).join("");
 if(!h)h=loc==null&&location.protocol!=="file:"?`<div class="sp-g">Searching</div>`:`<div class="sp-g">Nothing matches "${esc(SPSP.q)}"</div>`;
 R.innerHTML=h;R.hidden=false}
function spiSpEnter(){const b=document.querySelector("#sp_res .sp-r");if(b)b.click()}
function spiSpGo(n){n=spiSpK(n);SPSP.focus=null;spiSpFly(n);const R=document.getElementById("sp_res");if(R)R.hidden=true}
function spiSpPart(n,mat,descr){n=spiSpK(n);spiSpGo(n);setTimeout(()=>{if(typeof spiPartOpen==="function")spiPartOpen(descr,mat||null)},1100)}
async function spiSpLoc(funcloc){const R=document.getElementById("sp_res"),x=((SPSP.res&&SPSP.res.loc)||[]).find(q=>q.funcloc===funcloc);if(R)R.hidden=true;if(!x)return;
 const n=spiSpSetOfLoc(x);if(!n){exOpenFunc(funcloc);return}
 const own=!spiSpU(n).tpl&&S(n).tag.toUpperCase()===(x.tag||"").toUpperCase();
 SPSP.focus=null;spiSpFly(n);if(typeof exOpenFunc==="function")setTimeout(()=>exOpenFunc(funcloc),600)}
async function spiSpCat(mat){const R=document.getElementById("sp_res");if(R)R.hidden=true;
 const row=((SPSP.res&&SPSP.res.parts)||[]).find(p=>p.material_no===mat),descr=row?row.descr:"";
 /* the set whose bill of materials holds the part, else the unit of the class of the first location that uses it */
 let n=0;for(const s of K.sets){if(((GA[s.n]&&GA[s.n].bom)||[]).some(b=>spiSpMat(b)===mat)){n=s.n;break}}
 if(!n){try{const d=await spiApi("/api/data/part/"+mat);for(const b of (d.served_by_bom||[])){n=spiSpSetOfLoc({tag:"",eq_class:b.eq_class,descr:b.descr});if(n)break}}catch(e){}}
 if(n){SPSP.focus=null;spiSpFly(n)}
 setTimeout(()=>{if(typeof spiPartOpen==="function")spiPartOpen(descr,mat)},n?1100:0)}
/* the site opens in the library: first load only, any link to another page is untouched */
if(window.SPI_MODE&&typeof st!=="undefined"&&st.page==="spi_dash"&&!(location.hash&&location.hash.length>1))st.page="spi_space";
{const _p=p3Panel;p3Panel=function(){_p();document.querySelectorAll(".sp-ni").forEach(b=>b.classList.toggle("on",spiSpK(b.dataset.n)===P3.sel))}}
