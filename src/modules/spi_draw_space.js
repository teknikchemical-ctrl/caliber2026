/* SPI spatial library (owner: Claude B). The site opens in a 3D space that holds every equipment set. Search flies the camera to the set that matches.
   Search sources: the equipment sets (tag, name, class), the bill of materials of each set (local), and the location and part lists of the baseline data (server).
   A location or part that has no set of its own is shown on the set of the same equipment class, which is the template for that class. Nothing here is invented: counts and statuses come from the baseline data. */
regMod("spi_draw_space","1.0",["spi_core","spi_draw_parts","spi_overlay"],"Spatial library of equipment sets");
const SPSP={q:"",tok:0,tm:null,res:null,focus:null,ld:{}};
const spiSpCls=n=>typeof spiCls==="function"?spiCls(n):null;
const spiSpLab=n=>{const c=spiSpCls(n);return (typeof SPI_CLASSLAB!=="undefined"&&SPI_CLASSLAB[c])||c||"Equipment"};
const spiSpBomN=n=>((GA[n]&&GA[n].bom)||[]).length;
const spiSpMat=b=>{const m=/(\d{5,})/.exec(b.mat||"");return m?+m[1]:null};
spiRegister("spi_space","Equipment library",async host=>{
 const h=Math.max(520,(window.innerHeight||800)-205);
 host.classList.add("sp-wrap");
 host.innerHTML=`<div class="sp-top"><div class="sp-search"><input id="sp_q" type="search" autocomplete="off" placeholder="Search a tag, part or location, e.g. KT-383A or bearing" aria-label="Search the equipment library" oninput="spiSpType(this.value)" onkeydown="if(event.key==='Enter')spiSpEnter();if(event.key==='Escape')spiSpClear()"><div id="sp_res" class="sp-res" hidden></div></div><div class="sp-count">All <b>${K.sets.length}</b> equipment sets are in the space below. Select one, or search.</div></div>
 <div class="sp-rail" role="group" aria-label="Equipment sets">${K.sets.map(s=>`<button class="sp-rb" data-n="${s.n}" onclick="spiSpGo(${s.n})"><b>${esc(s.tag)}</b><span>${esc(spiSpLab(s.n))} | ${spiNum(spiSpBomN(s.n))} parts</span></button>`).join("")}</div>
 ${p3Hero({embed:true,h,fn:()=>"ok"})}`;
 {const q=(c,k)=>{const e=host.querySelector(c);if(e)e.classList.add(k)};q(".p3head","sp-ph");q(".p3tools","sp-pt");q(".p3key","sp-pk")}
 const hint=document.createElement("div");hint.className="sp-hint";hint.textContent="Drag to look around. Select a unit to fly to it. Type above to search: the camera moves to the set that matches. Schematic layout, not a surveyed plot plan.";host.appendChild(hint);
 if(st.focus){const q=String(st.focus);st.focus=null;const i=document.getElementById("sp_q");if(i){i.value=q;spiSpType(q)}}
});
/* the plant 3D card for this page shows data of the baseline only */
{const _c=p3Card;p3Card=function(n){return st.page==="spi_space"?spiSpCard(n):_c(n)}}
function spiSpCard(n){const s=S(n),D=SPIST.d[n],f=SPSP.focus;
 if(!D&&!SPSP.ld[n]&&typeof spiStockLoad==="function"){SPSP.ld[n]=1;spiStockLoad(n)}
 let stock="";if(D&&D.lines){const c={red:0,amber:0,grey:0,green:0,none:0};Object.values(D.lines).forEach(l=>c[l.stat]++);stock=`<div class="sp-cs">${["red","amber","green","grey","none"].filter(k=>c[k]).map(k=>spiChip(k,c[k]+" "+SPI_SC[k].n.toLowerCase())).join(" ")}</div>`}
 else if(D&&D.error)stock=`<p class="muted" style="font-size:12px">Stock statuses need the server: ${esc(D.error)}</p>`;else stock=`<p class="muted" style="font-size:12px">Loading stock statuses</p>`;
 const fb=f&&f.n===n?`<div class="sp-fo"><div class="muted" style="font-size:12px">You searched</div><b>${esc(f.tag||"")}</b> ${esc(spiName?spiName(f.descr||""):f.descr||"")}<br><span class="muted" style="font-size:12px">${esc(f.note||"")}</span>${f.funcloc?`<div style="margin-top:6px"><button onclick="spiGo('spi_eq',{funcloc:'${esc(f.funcloc).replace(/'/g,"")}'})">Open ${esc(f.tag||"it")} in 3D</button></div>`:""}</div>`:"";
 return `<div class="row between"><div><span class="tag acc">${esc(s.tag)}</span> ${s.crit?`<span class="tag">${esc(s.crit==="HIGH CRITICAL"?"Criticality S":"Criticality A")}</span>`:""}</div><button class="ghost g3x" onclick="SPSP.focus=null;p3Reset()" aria-label="Back to the whole library">All sets</button></div>
 <h3 style="margin:8px 0 2px">${esc(s.name)}</h3><div class="muted" style="font-size:12px;margin-bottom:6px">${esc(spiSpLab(n))} | ${spiNum(spiSpBomN(n))} spare parts in the bill of materials</div>${stock}${fb}
 <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px"><button onclick="go('equipment',{set:${n},tab:'ga'})">Open drawing and 3D</button><button class="ghost" onclick="go('equipment',{set:${n},tab:'overview'})">Spare parts</button></div>`}
/* ---------- search ---------- */
function spiSpToks(q){return q.toLowerCase().split(/[\s,]+/).filter(Boolean)}
function spiSpLocal(q){const T=spiSpToks(q),sets=[],inside=[];if(!T.length)return{sets,inside};
 K.sets.forEach(s=>{const hay=(s.tag+" "+s.name+" "+spiSpLab(s.n)+" "+(s.fluid||"")).toLowerCase();if(T.every(t=>hay.indexOf(t)>=0))sets.push(s.n);
  const hits=[];((GA[s.n]&&GA[s.n].bom)||[]).forEach(b=>{const hh=((b.name||"")+" "+(b.mat||"")).toLowerCase();if(T.every(t=>hh.indexOf(t)>=0))hits.push(b)});if(hits.length)inside.push({n:s.n,hits})});
 return{sets,inside}}
function spiSpClear(){const i=document.getElementById("sp_q"),r=document.getElementById("sp_res");if(i)i.value="";if(r){r.hidden=true;r.innerHTML=""}SPSP.q="";SPSP.res=null;SPSP.focus=null;p3Reset()}
function spiSpType(v){clearTimeout(SPSP.tm);const q=v.trim();SPSP.q=q;const R=document.getElementById("sp_res");if(!R)return;if(q.length<2){R.hidden=true;R.innerHTML="";return}
 const L=spiSpLocal(q);SPSP.res={L,loc:null,parts:null};
 /* automatic divert: one matching set, or else the set with most matching bill of material lines */
 if(L.sets.length>=1){SPSP.focus=null;p3Fly(L.sets[0],false)}else if(L.inside.length){SPSP.focus=null;p3Fly(L.inside.slice().sort((a,b)=>b.hits.length-a.hits.length)[0].n,false)}
 spiSpPaint();const tok=++SPSP.tok;SPSP.tm=setTimeout(()=>spiSpRemote(q,tok),280)}
async function spiSpRemote(q,tok){if(location.protocol==="file:")return;
 try{const words=spiSpToks(q),primary=words.slice().sort((a,b)=>b.length-a.length)[0],enc=encodeURIComponent(primary);
  const [lc,pt]=await Promise.all([spiApi("/api/data/locations?limit=6&q="+encodeURIComponent(q)).catch(()=>null),spiApi("/api/data/parts?limit=30&q="+enc).catch(()=>null)]);
  if(tok!==SPSP.tok||!SPSP.res)return;
  let rows=(pt&&pt.rows)||[];if(words.length>1)rows=rows.filter(p=>{const h=((p.descr||"")+" "+(p.for_tag||"")+" "+p.material_no).toLowerCase();return words.every(w=>h.indexOf(w)>=0)});
  SPSP.res.loc=(lc&&(lc.locations||lc.rows||lc.items))||[];SPSP.res.parts=rows.slice(0,6);SPSP.res.pt=pt&&pt.total;
  /* a location with no set match still diverts to the set of its class */
  const L=SPSP.res.L;if(!L.sets.length&&!L.inside.length&&SPSP.res.loc.length){const n=spiSpSetOfLoc(SPSP.res.loc[0]);if(n)p3Fly(n,false)}
  spiSpPaint()}catch(e){}}
function spiSpSetOfLoc(x){const tag=(x.tag||"").toUpperCase(),own=K.sets.find(s=>s.tag.toUpperCase()===tag);if(own)return own.n;
 const cls=(typeof spiSubCls==="function"&&spiSubCls((x.eq_class||"").toUpperCase(),x.descr))||(typeof spiClsOf==="function"&&spiClsOf((x.eq_class||"").toUpperCase()));if(!cls)return 0;
 const s=K.sets.find(q=>spiSpCls(q.n)===cls);return s?s.n:0}
function spiSpPaint(){const R=document.getElementById("sp_res");if(!R||!SPSP.res)return;const {L,loc,parts}=SPSP.res;let h="";
 if(L.sets.length)h+=`<div class="sp-g">Equipment sets</div>`+L.sets.map(n=>`<button class="sp-r" onclick="spiSpGo(${n})"><b>${esc(S(n).tag)}</b><span>${esc(S(n).name)} | ${esc(spiSpLab(n))}</span></button>`).join("");
 if(L.inside.length)h+=`<div class="sp-g">Parts inside the sets</div>`+L.inside.slice(0,3).map(g=>g.hits.slice(0,3).map(b=>`<button class="sp-r" onclick="spiSpPart(${g.n},${spiSpMat(b)||0},'${esc(b.name).replace(/'/g,"")}')"><b>${esc(S(g.n).tag)}</b><span>${esc(typeof spiDesc==="function"?spiDesc(b.name):b.name)}</span></button>`).join("")).join("");
 if(loc&&loc.length)h+=`<div class="sp-g">Locations in the plant</div>`+loc.map(x=>{const n=spiSpSetOfLoc(x);return `<button class="sp-r" data-f="${esc(x.funcloc).replace(/"/g,"&quot;")}" onclick="spiSpLoc(this.dataset.f)"><b>${esc(x.tag||x.funcloc)}</b><span>${esc(typeof spiName==="function"?spiName(x.descr||""):x.descr||"")}${n?" | shown on "+esc(S(n).tag):" | no 3D template"}</span></button>`}).join("");
 if(parts&&parts.length)h+=`<div class="sp-g">Parts in the catalogue${SPSP.res.pt?" ("+spiNum(SPSP.res.pt)+" match)":""}</div>`+parts.map(p=>`<button class="sp-r" onclick="spiSpCat(${p.material_no})"><b>${esc(p.material_no)}</b><span>${esc(typeof spiDesc==="function"?spiDesc(p.descr):p.descr)}</span></button>`).join("");
 if(!h)h=loc==null&&location.protocol!=="file:"?`<div class="sp-g">Searching</div>`:`<div class="sp-g">Nothing matches "${esc(SPSP.q)}"</div>`;
 R.innerHTML=h;R.hidden=false}
function spiSpEnter(){const b=document.querySelector("#sp_res .sp-r");if(b)b.click()}
function spiSpGo(n){SPSP.focus=null;p3Fly(n,false);const R=document.getElementById("sp_res");if(R)R.hidden=true}
function spiSpPart(n,mat,descr){spiSpGo(n);setTimeout(()=>{if(typeof spiPartOpen==="function")spiPartOpen(descr,mat||null)},1100)}
async function spiSpLoc(funcloc){const R=document.getElementById("sp_res"),x=((SPSP.res&&SPSP.res.loc)||[]).find(q=>q.funcloc===funcloc);if(R)R.hidden=true;if(!x)return;
 const n=spiSpSetOfLoc(x);if(!n){spiGo("spi_eq",{funcloc});return}
 const own=S(n).tag.toUpperCase()===(x.tag||"").toUpperCase();
 SPSP.focus=own?null:{n,funcloc:x.funcloc,tag:x.tag,descr:x.descr,note:"No set of its own. Shown on "+S(n).tag+", the template for this equipment class."};p3Fly(n,false)}
async function spiSpCat(mat){const R=document.getElementById("sp_res");if(R)R.hidden=true;
 const row=((SPSP.res&&SPSP.res.parts)||[]).find(p=>p.material_no===mat),descr=row?row.descr:"";
 /* the set whose bill of materials holds the part, else the set of the class of the first location that uses it */
 let n=0;for(const s of K.sets){if(((GA[s.n]&&GA[s.n].bom)||[]).some(b=>spiSpMat(b)===mat)){n=s.n;break}}
 if(!n){try{const d=await spiApi("/api/data/part/"+mat);for(const b of (d.served_by_bom||[])){n=spiSpSetOfLoc({tag:"",eq_class:b.eq_class,descr:b.descr});if(n)break}}catch(e){}}
 if(n){SPSP.focus=null;p3Fly(n,false)}
 setTimeout(()=>{if(typeof spiPartOpen==="function")spiPartOpen(descr,mat)},n?1100:0)}
/* the site opens in the library: first load only, any link to another page is untouched */
if(window.SPI_MODE&&typeof st!=="undefined"&&st.page==="spi_dash"&&!(location.hash&&location.hash.length>1))st.page="spi_space";
{const _p=p3Panel;p3Panel=function(){_p();document.querySelectorAll(".sp-rb").forEach(b=>b.classList.toggle("on",+b.dataset.n===P3.sel))}}
