/* =====================================================================================================
   SPI CASE: 2D GENERAL ARRANGEMENT SHEETS (owner: Claude B)  Schematic, generated, SYNTHETIC geometry.
   The sheet is the orthographic projection (front elevation and plan) of the same primitives as the 3D model (cases/spi/geo/g3m.js),
   so drawing, model, zones and part numbers always agree. Balloons carry the number of the first BoM line of a zone.
   gaSvg() of the equipment page is replaced for the SPI sets only; the element contract is kept (id gsvg, data-k, onclick gSel) so the
   selection panel, the work order highlight and the stock overlay (spi_stock.js) work on it.
   ===================================================================================================== */
const SPI_FILL={steel:"#d0d9e4",body:"#e4eaf1",paint:"#e4eaf1",dark:"#6b7a8c",gray:"#bcc6d2",blue:"#cfe0f5",brass:"#f3dfa6",amber:"#f6e3b4",red:"#f0c4c0",water:"#cfe5f7",green:"#a9d6b0",cat:"#d8c7b0",white:"#ffffff",black:"#6b7a8c"};
const SPI_STD={motor:"IEC 60034 (rotating electrical machines), IEC 60072 (frame dimensions); NEMA MG 1 where stated",cstation:"IEC 60947-5-1 (control circuit devices), IEC 60529 (enclosure protection)",foundation:"ACI 351.3R (foundations for dynamic equipment), API 686 (machinery installation and grouting)",burner:"API 535 (burners for fired heaters), API 560 (fired heaters)",peepdoor:"API 560 (fired heaters: observation doors)",convsec:"API 560 (fired heaters: convection section, tubes and supports)",qfit:"API 560, ASME B16.5 (flanges), ASME B31.3 (process piping)",dsteam:"API 560, ASME B16.5 (flanges), ASME B31.3 (process piping)",coilout:"API 560, ASME B16.5 (flanges), ASME B31.3 (process piping)",turbine:"TURBINE DRIVER, DRIVE TYPE NOT STATED IN THE BASELINE DATA; API 612 (STEAM TURBINE) LAYOUT ASSUMED, API 614 (LUBE OIL), ASME B16.5 (FLANGES)",furnace:"API 560 (fired heaters), ASME B31.3 (piping), ASME B16.5 (flanges)",pump:"API 610 OH2 layout, API 682 (seal and flush plan 11), ASME B16.5 (flanges)",hx:"TEMA AND API 660 (SHELL AND TUBE), TYPE ASSUMED (NOT STATED); TUBE PLUGS MARK THE TUBE BUNDLE; ASME B16.5 (FLANGES)",valve:"ISA-75 and IEC 60534 (control valve), ASME B16.5 and B16.34 (flanges and bodies)",prv:"API 520 and API 526 (pressure relief valves), ASME B16.5",sdv:"IEC 61511 (safety instrumented systems), ASME B16.34, API 598",mov:"ASME B16.34, API 600 (gate valves), IEC 60034 (motor)",vessel:"ASME VIII (pressure vessels), ASME B16.5",column:"ASME VIII, API 650 not applicable; column internals per vendor",instr:"ISA-5.1 (identification), IEC 60584, ASME PTC 19.3 TW",blower:"API 617 and API 673 (compressors and fans), API 614 (lube oil)",orifice:"ISO 5167, ASME B16.36 (orifice flanges)",jbox:"IEC 60079-14 (electrical installations), IEC 62444 (cable glands)",line:"ASME B31.3 (process piping), B36.10M, B16.9, B16.5"};
const SPI_CLAXIS={turbine:.95,pump:.62,hx:1.1,valve:.45,sdv:.4,mov:.4,blower:.8,orifice:.45,line:.45,instr:.4};
GAD_SPI_INIT();
function GAD_SPI_INIT(){KB.sets.forEach(s=>{const c=spiCls(s.n);if(!c)return;const P=spiPrep(s.n);
 GAD[s.n]={gy:410,dim:{x0:40,x1:860,yt:60},deco:[],bal:{},noz:GA[s.n].nz.map(z=>[z.m,0,0,"u"]),parts:P.zones.filter(z=>z.key).map(z=>({k:z.key,s:[]}))}})}
/* ---------- projection of one primitive into a view (f = front elevation x,y ; p = plan x,z). Returns {pts:[[u,w],...]} or {circle:[u,w,r]} in model metres ---------- */
function spiShape(p,v){const f=v==="f",X=p.x,W=f?p.y:p.z;if(p.t==="s")return{line:p.pts.map(q=>[q[0],f?q[1]:q[2]]),r:p.r};const rect=(cu,cw,du,dw)=>({pts:[[cu-du/2,cw-dw/2],[cu+du/2,cw-dw/2],[cu+du/2,cw+dw/2],[cu-du/2,cw+dw/2]]});
 if(p.t==="r")return rect(X,W,p.w,f?p.h:p.d);
 if(p.t==="c"||p.t==="a"){const r1=p.r,r2=p.r2==null?p.r:p.r2,L=p.len,ax=p.ax;
  if(ax==="x")return r1===r2?rect(X,W,L,2*r1):{pts:[[X-L/2,W-r1],[X+L/2,W-r2],[X+L/2,W+r2],[X-L/2,W+r1]]};
  if(ax==="y"){if(!f)return{circle:[X,W,Math.max(r1,r2)]};return r1===r2?rect(X,W,2*r1,L):{pts:[[X-r1,W-L/2],[X+r1,W-L/2],[X+r2,W+L/2],[X-r2,W+L/2]]}}
  if(f)return{circle:[X,W,Math.max(r1,r2)]};return rect(X,W,2*r1,L)}
 const ra=p.ra,rb=p.rb,a0=p.a0,a1=p.a1,N=14,up=[],dn=[];
 for(let i=0;i<=N;i++){const a=a0+(a1-a0)*i/N,ax=ra*Math.cos(a),rd=rb*Math.sin(a);
  if(p.ax==="x"){up.push([X+ax,W+rd]);dn.push([X+ax,W-rd])}else if(p.ax==="y"){if(!f)return{circle:[X,W,rb]};up.push([X+rd,W+ax]);dn.push([X-rd,W+ax])}else{if(f)return{circle:[X,W,rb]};up.push([X+rd,W+ax]);dn.push([X-rd,W+ax])}}
 return{pts:up.concat(dn.reverse())}}
const spiFx=(v,d)=>Number(v).toFixed(d==null?1:d);
/* ---------- the sheet ---------- */
function spiGaSvg(n){const P=spiPrep(n),prims=G3M[n]||[],ZK=new Set(P.zones.filter(z=>z.key).map(z=>z.key));
 const BB=spiBBox(n),mn=BB.mn,mx=BB.mx,Wm=mx[0]-mn[0],Hm=mx[1]-mn[1],Dm=mx[2]-mn[2];
 const s=Math.min(740/Wm,(Hm/Wm>1.5?400:250)/Hm,215/Dm),L0=80,gy=100+Hm*s,ox=L0+(740-Wm*s)/2-mn[0]*s,oy=gy+mn[1]*s,pTop=gy+84,pz0=pTop-mn[2]*s,Ht=pTop+Dm*s+104,
  X=u=>ox+u*s,YF=w=>oy-w*s,YP=w=>pz0+w*s,pt=(v,[u,w])=>X(u).toFixed(1)+","+(v==="f"?YF(w):YP(w)).toFixed(1);
 const out={f:[],p:[]},anch={},tags=[];
 ["f","p"].forEach(v=>{const list=prims.map((p,i)=>({p,i,d:v==="f"?p.z:p.y})).sort((a,b)=>(!!a.p.in-!!b.p.in)||(a.d-b.d));
  list.forEach(({p})=>{const sh=spiShape(p,v),k=p.k||"",sel=k&&(ZK.has(k)||/^N\d+$/.test(k)||k==="M"),fill=SPI_FILL[p.c]||(/^#/.test(p.c)?p.c:"#e4eaf1"),cl="gs spi-sh"+(p.in?" spi-in":"")+(sel?" gp":""),at=sel?` data-k="${k}" onclick="gSel('${k}')"`:"";
   let el;if(sh.line){el=`<polyline class="${cl}"${at} points="${sh.line.map(q=>X(q[0]).toFixed(1)+","+(v==="f"?YF(q[1]):YP(q[1])).toFixed(1)).join(" ")}" style="fill:none;stroke:#1c2733;stroke-width:${Math.max(1,sh.r*2*s).toFixed(1)}"/>`}
   else if(sh.circle){const[u,w,r]=sh.circle;el=`<circle class="${cl}"${at} cx="${X(u).toFixed(1)}" cy="${(v==="f"?YF(w):YP(w)).toFixed(1)}" r="${Math.max(.6,r*s).toFixed(1)}" style="fill:${fill}"/>`}
   else el=`<polygon class="${cl}"${at} points="${sh.pts.map(q=>pt(v,q)).join(" ")}" style="fill:${fill}"/>`;
   out[v].push(el);
   if(v==="f"&&k){const a0=p.in?.2:1,a=a0*(p.t==="r"?p.w*p.h:p.t==="c"?(p.ax==="x"?p.len*2*p.r:p.ax==="y"?p.len*2*p.r:Math.PI*p.r*p.r):p.ra*p.rb)||0;if(!anch[k]||a>anch[k].a)anch[k]={a,u:p.x,w:p.y}}
   if(/^N\d+$/.test(k)&&p.t==="c"&&!tags.some(t=>t.k===k&&t.v===v)&&((v==="f"&&p.ax!=="z")||(v==="p"&&p.ax!=="y"))){const ctr=(mn[0]+mx[0])/2,cz=(mn[2]+mx[2])/2,L=p.len/2;
    let u=p.x,w=v==="f"?p.y:p.z,du=0,dw=0;if(p.ax==="x"){du=(p.x>ctr?1:-1);u=p.x+du*L}else if(p.ax==="y"){dw=1;w=p.y+L}else{dw=(p.z>cz?1:-1);w=p.z+dw*L}
    tags.push({k,v,x:X(u)+du*14,y:(v==="f"?YF(w):YP(w))-(v==="f"?dw*14:-dw*14)})}})});
 /* balloons above the elevation, leader lines to the zone */
 const bk=Object.keys(anch).filter(k=>ZK.has(k)).map(k=>({k,ax:X(anch[k].u),ay:YF(anch[k].w)})).sort((a,b)=>a.ax-b.ax);let prev=-1e9;bk.forEach(b=>{b.bx=Math.max(b.ax,prev+30);prev=b.bx});let nxt=900-30;for(let i=bk.length-1;i>=0;i--){bk[i].bx=Math.min(bk[i].bx,nxt);nxt=bk[i].bx-30}
 const bal=bk.map((b,i)=>{const by=34+(i%2)*26;return `<g class="pdn spi-bal" data-k="${b.k}" onclick="gSel('${b.k}')"><line class="gd2" x1="${b.bx.toFixed(1)}" y1="${by+11}" x2="${b.ax.toFixed(1)}" y2="${b.ay.toFixed(1)}"/><circle class="spi-dot" cx="${b.ax.toFixed(1)}" cy="${b.ay.toFixed(1)}" r="2.6"/><circle class="bl" cx="${b.bx.toFixed(1)}" cy="${by}" r="11"/><text class="bn" x="${b.bx.toFixed(1)}" y="${by+4}">${b.k}</text></g>`}).join("");
 const tg=tags.map(t=>`<g class="pdn" data-k="${t.k}" onclick="gSel('${t.k}')"><rect class="nzb" x="${(t.x-11).toFixed(1)}" y="${(t.y-7).toFixed(1)}" width="22" height="14" rx="2"/><text class="nzt" x="${t.x.toFixed(1)}" y="${(t.y+3.5).toFixed(1)}">${t.k}</text></g>`).join("");
 const cla=SPI_CLAXIS[P.cls],cl=[];if(cla!=null){cl.push(`<line class="gd" x1="${X(mn[0])-14}" y1="${YF(cla)}" x2="${X(mx[0])+14}" y2="${YF(cla)}"/>`,`<line class="gd" x1="${X(mn[0])-14}" y1="${YP(0)}" x2="${X(mx[0])+14}" y2="${YP(0)}"/>`)}
 if(P.cls==="valve"||P.cls==="furnace"){cl.push(`<line class="gd" x1="${X(0)}" y1="${YF(mx[1])-10}" x2="${X(0)}" y2="${YF(mn[1])+10}"/>`,`<line class="gd" x1="${X(0)}" y1="${YP(mn[2])-10}" x2="${X(0)}" y2="${YP(mx[2])+10}"/>`)}
 const g1=YF(mn[1]),dimTxt=(x,y,t,rot)=>`<text class="dt" ${rot?`transform="translate(${x} ${y}) rotate(-90)"`:`x="${x}" y="${y}"`} text-anchor="middle">${t}</text>`,
  dims=`<path class="dim" d="M${X(mn[0])} ${g1+28}H${X(mx[0])}M${X(mn[0])} ${g1+22}v12M${X(mx[0])} ${g1+22}v12"/>${dimTxt((X(mn[0])+X(mx[0]))/2,g1+42,"OVERALL LENGTH "+spiFx(Wm)+" m (SCHEMATIC)")}
  <path class="dim" d="M${X(mx[0])+34} ${YF(mn[1])}V${YF(mx[1])}M${X(mx[0])+28} ${YF(mn[1])}h12M${X(mx[0])+28} ${YF(mx[1])}h12"/>${dimTxt(X(mx[0])+46,(YF(mn[1])+YF(mx[1]))/2,"HEIGHT "+spiFx(Hm)+" m",1)}
  <path class="dim" d="M${X(mx[0])+34} ${YP(mn[2])}V${YP(mx[2])}M${X(mx[0])+28} ${YP(mn[2])}h12M${X(mx[0])+28} ${YP(mx[2])}h12"/>${dimTxt(X(mx[0])+46,(YP(mn[2])+YP(mx[2]))/2,"WIDTH "+spiFx(Dm)+" m",1)}`,
  gnd=Array.from({length:Math.ceil(Wm*s/14)+4},(_,i)=>`M${X(mn[0])-20+i*14} ${g1}l-7 8`).join(""),
  notes=["NOTES","1. SCHEMATIC GENERATED FROM THE BASELINE DATA (SYNTHETIC GEOMETRY). NOT A VENDOR DRAWING. DIMENSIONS ARE THOSE OF THE SCHEMATIC.","2. PARTS AND STOCK ARE RECORDS OF THE BASELINE DATA SET. A BALLOON NUMBER IS THE FIRST BOM LINE OF THE ZONE; SELECT IT FOR ALL PARTS OF THE ZONE.","3. NOZZLE SIZES AND RATINGS ARE NOT IN THE BASELINE DATA. FLANGES ARE DRAWN AS ASME B16.5 FLANGES (SCHEMATIC).","4. LAYOUT BASIS: "+SPI_STD[P.cls]+". DASHED = INTERNAL PARTS."];
 return `<svg id="gsvg" class="gsvg spi-ga" viewBox="0 0 900 ${Ht.toFixed(0)}" style="width:100%;height:auto"><rect x="2" y="2" width="896" height="${(Ht-4).toFixed(0)}" fill="none" stroke="#1c2733" stroke-width="1"/>
 <path d="M${X(mn[0])-30} ${g1}H${X(mx[0])+30}" stroke="#111" stroke-width="1.6"/><path d="${gnd}" stroke="#111" stroke-width="1" fill="none"/><text x="${X(mx[0])+30}" y="${g1-4}" text-anchor="end" font-size="9" fill="#333">GRADE EL +0.00</text>
 ${cl.join("")}<g class="spi-v" id="spi_vf">${out.f.join("")}</g>${bal}${tg}${dims}
 <text class="spi-vt" x="${L0-40}" y="112">FRONT ELEVATION</text>
 <g class="spi-v" id="spi_vp">${out.p.join("")}</g><text class="spi-vt" x="${L0-40}" y="${pTop+12}">PLAN</text>
 ${notes.map((t,i)=>`<text x="${L0-52}" y="${(pTop+Dm*s+38+i*12).toFixed(0)}" font-size="${i?8.2:9}" font-weight="${i?400:700}" fill="#222">${t}</text>`).join("")}</svg>`}
{const _gaSvg=gaSvg;gaSvg=function(n){return spiCls(n)&&G3M[n]&&G3M[n].length?spiGaSvg(n):_gaSvg(n)}}
