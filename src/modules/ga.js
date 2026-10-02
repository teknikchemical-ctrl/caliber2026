/* ===== Equipment drawing: general arrangement sheet assembled from simple shapes, component inspection and live condition ===== */
const G={n:1,sel:null,cond:true,hv:{},hh:{}};
const gKey=(d,i)=>d.mot&&i==="M"?"M":i;
const gBom=(n,k)=>k==="M"?(GA[n].mot?{name:GA[n].mot,mat:"n/a",qty:"1"}:null):GA[n].bom[+k-1];
/* compatibility with modules that test which BOM items are drawn */
Object.keys(GAD).forEach(n=>{GA[n].p=GAD[n].parts.map(p=>[p.k,"x"]);GA[n].n=GAD[n].noz})
/* ---- condition model (simulated; replace with plant data through window.LIVE_SOURCE) ---- */
const GM=[[/bearing/i,"Bearing temperature","°C",62,85,95,1],[/mechanical seal|oil seal|packing|gland|gasket|rotary joint|o-ring/i,"Leak rate","ml/min",.4,5,20,1],[/motor/i,"Winding temperature","°C",78,110,130,1],[/shaft|impeller|coupling|rotor|crank|rod|crosshead|sprocket|fan|gearbox|piston|blade/i,"Vibration","mm/s",2.4,7.1,9,1],[/valve|cage|plug|seat|diaphragm|positioner|spring|actuator/i,"Travel deviation","%",.8,3,6,1],[/tube|bundle|catalyst|grid|thermowell|distributor|shell|head|body|casing|baseplate|support|frame|housing|sleeve|ring|trap|intercooler|pump/i,"Condition index","%",94,75,55,-1]];
const gMon=(n,k)=>{const b=gBom(n,k);return b&&GM.find(m=>m[0].test(b.name))};
function gVal(n,k){const m=gMon(n,k);if(!m)return null;const id=n+"|"+k,h=G.hh[id]||(G.hh[id]=[m[3]]);return{m,v:h[h.length-1],h}}
function gTickVals(){const n=G.n;GA[n].bom.forEach((_,i)=>gStep(n,String(i+1)));if(GA[n].mot)gStep(n,"M")}
function gStep(n,k){const m=gMon(n,k);if(!m)return;const id=n+"|"+k,h=G.hh[id]||(G.hh[id]=[m[3]]);let v=h[h.length-1];v+=(m[3]-v)*.25+(Math.random()-.5)*Math.abs(m[3])*.04;h.push(Math.max(0,v));if(h.length>30)h.shift()}
const gState=(m,v)=>m[6]>0?(v>=m[5]?"trip":v>=m[4]?"warn":"ok"):(v<=m[5]?"trip":v<=m[4]?"warn":"ok"),GCOL={ok:"#c9efd1",warn:"#ffe3a3",trip:"#ffb3ad"};
const GSTOP=new Set(["assy","with","type"]),GAL=[[/misalign|alignment|motor feet|coupling/,/coupling|^motor/i],[/foundation settlement/,/baseplate/i],[/flush|orifice|seal gland|seal face|seal cartridge/,/mechanical seal/i],[/chain|sprocket/,/sprocket/i],[/thermocouple|tc point/,/thermowell/i]];
function gScore(name,txt){const nm=name.toLowerCase(),toks=nm.replace(/\(.*?\)/g,x=>" "+x.slice(1,-1)+" ").split(/[^a-z0-9]+/).filter(t=>t.length>=2&&!GSTOP.has(t));let s=toks.filter(t=>new RegExp("\\b"+t.replace(/s$/,"")+"s?\\b").test(txt)).length;if(txt.includes(nm.replace(/\s*\(.*\)/,"").replace(/s$/,"")))s+=2;GAL.forEach(([a,b])=>{if(a.test(txt)&&b.test(name))s+=3});return s}
/* ---- drawing ---- */
function gShapeSvg(s){const t=s[0],o=s[s.length-1]||{},fill=GF[o.f||"body"]||o.f,st=`fill:${fill};${o.d?`stroke-dasharray:${o.d};`:""}${o.w!=null?`stroke-width:${o.w};`:""}`;
 if(t==="r")return `<rect class="gs" x="${s[1]}" y="${s[2]}" width="${s[3]}" height="${s[4]}" rx="${s[5]}" style="${st}"/>`;
 if(t==="c")return `<circle class="gs" cx="${s[1]}" cy="${s[2]}" r="${s[3]}" style="${st}"/>`;
 if(t==="e")return `<ellipse class="gs" cx="${s[1]}" cy="${s[2]}" rx="${s[3]}" ry="${s[4]}" style="${st}"/>`;
 if(t==="l")return `<line class="gs gl" x1="${s[1]}" y1="${s[2]}" x2="${s[3]}" y2="${s[4]}" style="${o.cl?"":"stroke-linecap:round;"}${o.d?`stroke-dasharray:${o.d};`:""}${o.w!=null?`stroke-width:${o.w};`:""}" ${o.cl?'class="gd"':""}/>`;
 if(t==="pa")return `<path class="gs" d="${s[1]}" style="${st}"/>`;
 if(t==="pl")return `<polygon class="gs" points="${s[1].map(p=>p.join(",")).join(" ")}" style="${st}"/>`;
 return ""}
const gDeco=s=>{const o=s[s.length-1]||{};if(s[0]==="l"&&o.cl)return `<line class="gd" x1="${s[1]}" y1="${s[2]}" x2="${s[3]}" y2="${s[4]}" style="${o.w!=null?`stroke-width:${o.w}`:""}"/>`;return gShapeSvg(s).replace('class="gs"','class="gs gx"')};
function gaSvg(n){const d=GAD[n],s=S(n),gy=d.gy,{x0,x1,yt}=d.dim,U={u:[-8,-18,16,14],d:[-8,4,16,14],l:[-20,-7,16,14],r:[4,-7,16,14]};
 const body=d.parts.map(p=>{const b=gBom(n,p.k);return `<g class="pdn gp ${G.sel===p.k?"sel":""}" data-k="${p.k}" onclick="gSel('${p.k}')"><title>${esc(b?b.name:p.k)}</title>${p.s.map(gShapeSvg).join("")}</g>`}).join("");
 const bal=Object.entries(d.bal).map(([k,[bx,by,ax,ay]])=>`<g class="pdn ${G.sel===k?"sel":""}" data-k="${k}" onclick="gSel('${k}')"><line class="gd2" x1="${bx}" y1="${by+(ay>by?10:-10)}" x2="${ax}" y2="${ay}"/><circle class="bl" cx="${bx}" cy="${by}" r="11"/><text class="bn" x="${bx}" y="${by+4}">${k==="M"?"M":k}</text></g>`).join("");
 const nz=d.noz.map(([m,x,y,r])=>{const u=U[r],z=GA[n].nz.find(q=>q.m===m);return `<g class="pdn ${G.sel===m?"sel":""}" data-k="${m}" onclick="gSel('${m}')"><title>${m} | ${esc(z.sv)} ${esc(z.sz)}</title><rect class="nzb" x="${x+u[0]}" y="${y+u[1]}" width="${u[2]+4}" height="${u[3]}" rx="2"/><text class="nzt" x="${x+u[0]+(u[2]+4)/2}" y="${y+u[1]+10}">${m}</text></g>`}).join("");
 const ys=[yt,...Object.values(d.bal).map(b=>b[1]-16),...d.noz.map(q=>q[2]-24)],top=Math.max(0,Math.min(...ys)-14),bot=gy+78,L=s.ga.overall_length_mm,H=s.ga.height_mm;
 const gnd=Array.from({length:Math.ceil(760/14)},(_,i)=>`M${50+i*14} ${gy}l-7 8`).join("");
 const dim=`<path class="dim" d="M${x0} ${gy+36}H${x1}M${x0} ${gy+30}v12M${x1} ${gy+30}v12"/><path d="M${x0+1} ${gy+36}l8 -3v6zM${x1-1} ${gy+36}l-8 -3v6z" fill="#1f3864"/><text class="dt" x="${(x0+x1)/2}" y="${gy+52}" text-anchor="middle">OVERALL LENGTH ${L} mm</text>
  <path class="dim" d="M${x0-26} ${yt}V${gy}M${x0-32} ${yt}h12M${x0-32} ${gy}h12"/><path d="M${x0-26} ${yt+1}l-3 8h6zM${x0-26} ${gy-1}l-3 -8h6z" fill="#1f3864"/><text class="dt" transform="translate(${x0-33} ${(yt+gy)/2}) rotate(-90)" text-anchor="middle">HEIGHT ${H} mm</text>`;
 return `<svg id="gsvg" class="gsvg" viewBox="-34 ${top} 934 ${bot-top}" style="width:100%;height:auto"><defs><pattern id="ht" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#222" stroke-width="1"/></pattern><pattern id="xh" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0L8 8M8 0L0 8" stroke="#4a586c" stroke-width=".7"/></pattern></defs>
  <path d="M40 ${gy}H860" stroke="#111" stroke-width="1.6"/><path d="${gnd}" stroke="#111" stroke-width="1" fill="none"/><text x="896" y="${gy-4}" text-anchor="end" font-size="9" fill="#333">GRADE EL +0.00</text>${d.deco.map(gDeco).join("")}${body}${bal}${nz}${dim}
  <text x="450" y="${gy+70}" text-anchor="middle" font-size="10" fill="#222">C/L ELEVATION ${s.ga.cl_elevation_mm??"n/a"} mm  |  DRY WEIGHT ${s.ga.dry_weight_kg?fmt(s.ga.dry_weight_kg)+" kg":"n/a"}  |  SCHEMATIC, NOT TO SCALE</text></svg>`}
/* ---- side panel ---- */
function gSpark(h){if(h.length<2)return"";const mx=Math.max(...h),mn=Math.min(...h);return `<svg viewBox="0 0 200 40" style="width:100%;height:42px"><polyline fill="none" stroke="#0b5fd7" stroke-width="1.5" points="${h.map((v,i)=>`${i*6.9},${38-(mx===mn?19:(v-mn)/(mx-mn)*34)}`).join(" ")}"/></svg>`}
function gP(){const n=G.n,s=S(n),d=GA[n],k=G.sel;
 if(!k)return `<h3>Component details</h3><p class="muted" style="line-height:1.6">Select a numbered part or nozzle on the drawing, or a row in the tables below, for details. Turn on <b>Live condition</b> to show simulated component condition.</p><div style="margin-top:12px">${kv([["Parts in BOM",d.bom.length+(d.mot?1:0)],["Nozzles",d.nz.length],["Overall L x H",s.ga.overall_length_mm+" x "+s.ga.height_mm+" mm"],["Dry weight",s.ga.dry_weight_kg?fmt(s.ga.dry_weight_kg)+" kg":"illegible on drawing"]])}</div>`;
 const nzr=d.nz.find(q=>q.m===k),b=nzr?null:gBom(n,k),name=nzr?nzr.sv:b.name,kw=((name.toLowerCase().match(/[a-z]{4,}/g)||[""]).sort((a,c)=>c.length-a.length)[0]);
 const lk=K.nz.find(z=>z.document_id===s.ga.document_id&&z.nozzle_mark===k),has=(x,...f)=>kw&&f.map(y=>x[y]||"").join(" ").toLowerCase().includes(kw);
 const wo=MH.filter(m=>m.n===n&&mhParts(m).includes(k)).slice(-3).reverse(),ol=K.opl.filter(o=>o.set===n&&has(o,"title","obj")).slice(0,3);
 const steps=[...new Set(K.opl.filter(o=>o.set===n).flatMap(o=>o.steps.filter(x=>has({t:x[0]},"t")).map(x=>x[0])))].slice(0,3);
 const rows=nzr?[["Nozzle",k],["Service",nzr.sv],["Size / rating",esc(nzr.sz)],["Remarks",esc(nzr.r)],["Connects to / from",lk?esc(lk.connects_to_from.slice(0,170)):null]]:[["Item no.",k==="M"?"Driver":k],["Part",esc(b.name)],["Material / spec",esc(b.mat)],["Qty",b.qty],["Drawing",s.ga.dwg_no]];
 const V=nzr?null:gVal(n,k);let live="";
 if(V&&G.cond){const st=gState(V.m,V.v),c=st==="ok"?"ok":st==="warn"?"warn":"bad";live=`<h3 style="margin:14px 0 6px">Live condition</h3><div class="row between"><b style="font-size:24px;color:var(--${c})">${V.v.toFixed(V.m[3]<5?1:0)} ${V.m[2]}</b>${tg(st==="ok"?"NORMAL":st==="warn"?"ALARM":"TRIP",c)}</div><div class="muted" style="font-size:12px">${V.m[1]} | alarm ${V.m[4]} | trip ${V.m[5]}</div>${gSpark(V.h)}<p class="muted" style="font-size:11px;margin-top:4px">Simulated signal, not a live reading.</p>`}
 return `<span class="tag acc">${s.tag} | Set ${n}</span><h3 style="margin:8px 0">${nzr?k+" | "+esc(nzr.sv):(k==="M"?"":k+" | ")+esc(b.name)}</h3>${kv(rows)}${live}
 <h3 style="margin:14px 0 6px">Related records</h3>${steps.map(t=>`<div class="src"><div onclick="go('equipment',{set:${n},tab:'opl'})">OPL step: ${esc(t.slice(0,90))}</div></div>`).join("")}${ol.map(o=>`<div class="src"><div onclick="go('opl',{opl:'${o.no}'})">${esc(o.tag)} | ${esc(o.title)}</div></div>`).join("")}${wo.map(m=>`<div class="src"><div onclick="mhOpen('${m.wo}')">${m.wo} | ${dstr(m.t0)} | ${esc((m.prob||"").slice(0,64))}</div></div>`).join("")}${!steps.length&&!ol.length&&!wo.length?`<p class="muted">No OPL step or work order mentions this item.</p>`:""}`}
const gCtx=()=>{const n=G.n,s=S(n),k=G.sel,nzr=k&&GA[n].nz.find(q=>q.m===k),b=k&&!nzr&&gBom(n,k),nm=nzr?nzr.sv:b?b.name:null;
 return{page:"Equipment drawing",set:n,kw:nm?nm.replace(/[()]/g,""):"",label:nm?`${s.tag} | ${nm}`:`${s.tag} | whole machine`,
  prompts:nm?[`What does the ${nm} do and how is it inspected?`,`Which failures involved the ${nm} of ${s.tag}?`,`What safety precautions apply before working on the ${nm}?`]:[`Summarise the construction of ${s.tag}`,`What are the main failure modes of ${s.tag}?`,`Which interlocks protect ${s.tag}?`]}};
/* ---- actions ---- */
const gTint=()=>{document.querySelectorAll(".gp[data-k]").forEach(g=>{const k=g.dataset.k,v=G.cond?gVal(G.n,k):null;if(v){g.style.setProperty("--hc",GCOL[gState(v.m,v.v)]);g.setAttribute("data-tint","1")}else{g.style.removeProperty("--hc");g.removeAttribute("data-tint")}})};
function gRefresh(){const p=$("#gp");if(p)p.innerHTML=gP();document.querySelectorAll("[data-k]").forEach(g=>g.classList.toggle("sel",g.dataset.k===G.sel));aiSetCtx("ga",gCtx())}
function gSel(k){G.sel=G.sel===k?null:k;gRefresh()}
const gIsOn=()=>st.page==="equipment"&&st.set&&st.tab==="ga"&&$("#gsvg");
setInterval(()=>{if(!gIsOn())return;gTickVals();if(G.cond)gTint();if(G.sel&&G.cond){const p=$("#gp");if(p)p.innerHTML=gP()}},1500);
function gaView(n){if(G.n!==n){G.n=n;G.sel=null;G.hh={}}const s=S(n),d=GA[n],g=s.ga,r=s.revs;setTimeout(gTint,0);
 return `<div class="split" style="margin-bottom:14px;grid-template-columns:minmax(0,1fr) 340px"><div class="card" style="min-width:0"><div class="row between" style="margin-bottom:8px"><h3>Equipment drawing | ${esc(s.name)} <span class="tag">${g.dwg_no}</span></h3><label class="row muted" style="gap:6px"><input type="checkbox" ${G.cond?"checked":""} onchange="G.cond=this.checked;gTint();gRefresh()"> Live condition</label></div>
 <div class="gasheet"><div class="ttl">GENERAL ARRANGEMENT DRAWING - ${esc(s.name.toUpperCase())} (${esc(s.tag)})</div><div class="sub2">Area ${s.area} - ${esc(s.unit)} &nbsp;|&nbsp; Fluid: ${esc(s.fluid)}</div>${gaSvg(n)}
  <div class="tblk"><div><b>TITLE:</b> GENERAL ARRANGEMENT DRAWING<br><span>${esc(s.name.toUpperCase())} | ${esc(s.tag)}</span></div><div><b>DWG No.</b> ${g.dwg_no}<br>Rev ${esc(g.revision)} | Sheet 1 of 1</div><div class="stamp">This is sample data provided for CALIBER purposes only</div></div></div>
 <div class="row muted" style="font-size:12px;margin-top:8px"><span style="color:#9a6700">Balloon: BOM item number</span><span style="color:#9a6700">Amber box: nozzle or manway</span><span>Dashed outline = hidden or internal part</span><span>Shading = simulated condition (green normal, amber alarm, red trip)</span></div></div>
 <div><div class="card" id="gp">${gP()}</div>${gCompChart(n)}${aiPanel("ga",gCtx())}</div></div>
 <div class="grid" style="grid-template-columns:1fr 1fr"><div><h3 style="margin-bottom:8px">Bill of material</h3>${tbl(["#","Part","Material","Qty"],[...(d.mot?[["M",esc(d.mot),"n/a","1"]]:[]),...d.bom.map((b,i)=>[i+1,esc(b.name),esc(b.mat),b.qty])],i=>`gSel('${d.mot?(i===0?"M":i):i+1}')`)}</div>
 <div><h3 style="margin-bottom:8px">Nozzle / connection schedule</h3>${tbl(["Mark","Service","Size","Remarks"],d.nz.map(z=>[z.m,z.sv,esc(z.sz),esc(z.r)]),i=>`gSel('${d.nz[i].m}')`)}
 <h3 style="margin:14px 0 8px">Revision history</h3>${tbl(["Rev","Description","By","Date"],r.map(x=>[x.rev,x.desc,x.by,x.date]))}</div></div>
 <p class="muted" style="margin-top:10px;font-size:12px">Notes: 1 Material per WPN-MAT-001 | 2 Surface prep and painting per WPN-PAINT-001 | 3 Dimensions in mm | 4 Weights estimated (dry/erection) | 5 Nozzle loads per vendor drawing | 6 Associated docs: ${s.pid.ref}, interlock ${esc(g.assoc_interlock_ref)}. Sample data for CALIBER only. Schematic redraw assembled from simple shapes; parts are not individually dimensioned.</p>`}
function gaPage(){return `<h1>Equipment Drawings</h1><p class="sub">General arrangement drawings with component inspection and simulated condition</p>
 <div class="chips">${K.sets.map(x=>`<span class="chip" style="${x.n===G.n?"color:var(--acc);border-color:var(--acc)":""}" onclick="G.n=${x.n};G.sel=null;render()">${x.tag}</span>`).join("")}</div>${gaView(G.n)}`}
function gCompChart(n){const c={};MH.filter(r=>r.n===n).forEach(r=>mhParts(r).forEach(k=>c[k]=(c[k]||0)+1));const it=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>({l:mhPartName(n,k),v,c:"#cf222e",js:`gSel('${k}')`}));
 return it.length?`<div class="card" style="margin-top:12px"><div class="row between" style="margin-bottom:6px"><h3 style="margin:0">Work orders by component</h3><span class="muted" style="font-size:11.5px">select a bar</span></div>${cHBar(it)}</div>`:""}
