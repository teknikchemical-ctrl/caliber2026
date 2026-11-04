/* SPI workspace foundation (owner: Claude B). Shared by the Maintenance, Forecasting and Simulation, and Costs tools.
   1. SPIWS: a registry of every tool on screen with its current inputs and outputs, so that the AI can read what the user sees (spiWsSnapshot) and run a tool with new inputs (spiWsRun).
   2. SPA: shared assumptions (cost of downtime, hours lost per stockout, emergency premium, carrying rate, lead time, service level). Every value is labelled Assumption and can be edited.
   3. Small form and layout helpers so that every tool reads the same way: inputs on the left, results on the right. */
regMod("spi_zone_ws","1.0",["spi_core","spi_viz"],"Workspace foundation");
const SPIWS={views:{},run:{}};
function spiWsSet(id,o){SPIWS.views[id]=Object.assign(SPIWS.views[id]||{},o,{updated:new Date().toISOString()})}
/* for the AI: everything the user currently sees, as data */
function spiWsSnapshot(){return JSON.parse(JSON.stringify({assumptions:SPA,views:SPIWS.views}))}
/* for the AI: run a tool with inputs (the tool must be on screen or registered) */
async function spiWsRun(id,inputs){const f=SPIWS.run[id];if(!f)throw new Error("No tool named "+id);return f(inputs||{})}
const SPA_DEF=(typeof window!=="undefined"&&window.SPI_ECON_DEF)?JSON.parse(JSON.stringify(window.SPI_ECON_DEF)):{downtime_idr_h:{S:4200000,A:1250000,B:330000,C:42000},hours_per_stockout:{S:72,A:48,B:24,C:12},downtime_share:{S:0.5,A:0.25,B:0.1,C:0.02},emergency_premium:0.35,carrying_rate:0.22,lead_default:60,service:{S:0.98,A:0.95,B:0.9,C:0.85},order_cost_idr:750000};
const SPA=(()=>{try{const s=JSON.parse(localStorage.getItem("spa2")||"null");if(s)return Object.assign(JSON.parse(JSON.stringify(SPA_DEF)),s)}catch(e){}return JSON.parse(JSON.stringify(SPA_DEF))})();
function spiSpaSave(){try{localStorage.setItem("spa2",JSON.stringify(SPA))}catch(e){}}
function spiSpaReset(){Object.assign(SPA,JSON.parse(JSON.stringify(SPA_DEF)));spiSpaSave()}
/* ---------- helpers ---------- */
const wsE=s=>esc(s==null?"":String(s));
const wsIdr=n=>n==null||!isFinite(n)?"Not priced":spiMoney(n);
const wsN=(n,d)=>n==null||!isFinite(n)?"n/a":spiNum(n,d||0);
const wsPct=(n,d)=>n==null||!isFinite(n)?"n/a":(n*100).toFixed(d==null?1:d)+"%";
function wsDeb(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms||300)}}
function wsQS(o){return Object.entries(o).filter(([k,v])=>v!==""&&v!=null&&!(Array.isArray(v)&&!v.length)).map(([k,v])=>encodeURIComponent(k)+"="+encodeURIComponent(Array.isArray(v)?v.join(","):typeof v==="object"?JSON.stringify(v):v)).join("&")}
/* chip group: multi or single choice */
function wsChips(name,opts,sel,on,single){sel=Array.isArray(sel)?sel:[sel];return `<div class="ws-chips" role="group" aria-label="${wsE(name)}">${opts.map(o=>{const v=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return `<button type="button" class="ws-chip ${sel.includes(v)?"on":""}" onclick="${on}'${String(v).replace(/'/g,"")}')">${wsE(l)}</button>`}).join("")}</div>`}
function wsTog(list,v){const i=list.indexOf(v);if(i>=0)list.splice(i,1);else list.push(v);return list}
const wsField=(label,html,hint)=>`<div class="ws-f"><label>${wsE(label)}</label>${html}${hint?`<div class="ws-hint">${wsE(hint)}</div>`:""}</div>`;
const wsSel=(opts,val,on,aria)=>`<select onchange="${on}" aria-label="${wsE(aria||"")}">${opts.map(o=>{const v=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return `<option value="${wsE(v)}" ${String(v)===String(val)?"selected":""}>${wsE(l)}</option>`}).join("")}</select>`;
const wsRange=(min,max,step,val,on,fmt)=>`<div class="ws-range"><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" oninput="this.nextElementSibling.textContent=${fmt||"this.value"};" onchange="${on}"><span>${wsE(fmt?(()=>{try{return new Function("return "+fmt).call({value:String(val)})}catch(e){return val}})():val)}</span></div>`;
/* tool frame: inputs left, results right */
function wsFrame(id,title,purpose,inputsHtml){return `<div class="ws" id="ws_${id}"><div class="ws-hd"><h1>${wsE(title)}</h1><p>${wsE(purpose)}</p></div><div class="ws-grid"><aside class="ws-in" id="wsi_${id}">${inputsHtml}</aside><section class="ws-out" id="wso_${id}"><div class="ws-wait">Calculating</div></section></div></div>`}
function wsTiles(figs){return `<div class="ws-tiles">${figs.map(f=>`<div class="ws-tile ${f.tone||""}"><div class="ws-tv">${wsE(f.v)}</div><div class="ws-tl">${wsE(f.l)}</div>${f.b?`<div class="ws-tb">${wsE(f.b)}</div>`:""}</div>`).join("")}</div>`}
const wsCard=(title,body,note)=>`<div class="ws-card"><div class="ws-ch"><h3>${wsE(title)}</h3>${note?`<span>${wsE(note)}</span>`:""}</div>${body}</div>`;
function wsPager(total,off,lim,on){if(total<=lim)return"";const p=Math.floor(off/lim)+1,n=Math.ceil(total/lim);return `<div class="ws-pager"><button class="ghost" ${off<=0?"disabled":""} onclick="${on}(${Math.max(0,off-lim)})">Previous</button><span>Page ${p} of ${spiNum(n)} (${spiNum(total)} records)</span><button class="ghost" ${off+lim>=total?"disabled":""} onclick="${on}(${off+lim})">Next</button></div>`}
function wsCsv(name,rows,cols){const q=v=>{const s=v==null?"":String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};const t=[cols.map(c=>q(c[1])).join(",")].concat(rows.map(r=>cols.map(c=>q(typeof c[0]==="function"?c[0](r):r[c[0]])).join(","))).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/csv"}));a.download=name+".csv";document.body.appendChild(a);a.click();a.remove()}
const wsDate=d=>{if(!d)return"";const t=new Date(String(d).slice(0,10)+"T00:00:00Z");return isNaN(t)?String(d):t.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"})};
const wsMonth=m=>{const t=new Date(m+"-01T00:00:00Z");return isNaN(t)?m:t.toLocaleDateString("en-GB",{month:"short",year:"2-digit",timeZone:"UTC"})};
/* notification text: the bracketed work reference is shown apart from the description */
function wsNotifText(d){const m=/^\s*\[([^\]]+)\]\s*(.*)$/.exec(d||"");return m?{ref:m[1],text:m[2]}:{ref:"",text:d||""}}
const wsPrioTone={Emergency:"bad",High:"warn",Medium:"acc",Low:"n"};
/* shared assumptions panel (editable everywhere it is shown) */
function wsAssump(on,keys){keys=keys||["downtime","hours","premium","carry","lead"];const crit=["S","A","B","C"],inp=(path,v,step)=>`<input type="number" step="${step||"any"}" value="${v}" onchange="spiSpaEdit('${path}',this.value);${on}()">`;
 return `<details class="ws-as" open><summary>Assumptions <span>editable, saved in this browser</span></summary>
 ${keys.includes("downtime")?`<div class="ws-at"><b>Cost of downtime per hour (IDR)</b>${crit.map(c=>`<label>${c}${inp("downtime_idr_h."+c,SPA.downtime_idr_h[c],100000)}</label>`).join("")}</div>`:""}
 ${keys.includes("share")?`<div class="ws-at"><b>Share of stockouts that stop equipment</b>${crit.map(c=>`<label>${c}${inp("downtime_share."+c,SPA.downtime_share[c],0.05)}</label>`).join("")}</div>`:""}
 ${keys.includes("hours")?`<div class="ws-at"><b>Hours lost per stockout</b>${crit.map(c=>`<label>${c}${inp("hours_per_stockout."+c,SPA.hours_per_stockout[c],1)}</label>`).join("")}</div>`:""}
 ${keys.includes("service")?`<div class="ws-at"><b>Target service level</b>${crit.map(c=>`<label>${c}${inp("service."+c,SPA.service[c],0.01)}</label>`).join("")}</div>`:""}
 <div class="ws-at">${keys.includes("premium")?`<label>Emergency purchase premium ${inp("emergency_premium",SPA.emergency_premium,0.05)}</label>`:""}${keys.includes("carry")?`<label>Carrying rate per year ${inp("carrying_rate",SPA.carrying_rate,0.01)}</label>`:""}${keys.includes("lead")?`<label>Lead time without history (days) ${inp("lead_default",SPA.lead_default,1)}</label>`:""}${keys.includes("order")?`<label>Cost per purchase order (IDR) ${inp("order_cost_idr",SPA.order_cost_idr,50000)}</label>`:""}</div>
 <button class="ghost ws-sm" onclick="spiSpaReset();${on}()">Restore the defaults</button></details>`}
function spiSpaEdit(path,v){const p=path.split("."),x=Number(v);if(!isFinite(x))return;let o=SPA;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p[p.length-1]]=x;spiSpaSave()}
/* hub tabs for the rebuilt hubs */
if(typeof SPI_HUBS!=="undefined"){const H=id=>SPI_HUBS.find(h=>h.id===id);
 const m=H("spi_h_mnt");if(m)m.tabs=[["spi_mtime","Maintenance timeline"],["spi_mnotif","Notification explorer"],["spi_mplan","Maintenance plan"],["spi_mkit","Work-pack calculator"],["spi_mrel","Reliability explorer"],["spi_eq","Equipment 3D"]];
 const f=H("spi_h_fc");if(f)f.tabs=[["spi_ssim","Replenishment simulator"],["spi_scr","Cost-risk scenarios"],["spi_ask","Ask the AI"]];
 const c=H("spi_h_cost");if(c)c.tabs=[["spi_cimp","Impact reduction"],["spi_ccalc","Cost of holding and shortage"],["spi_csave","Savings planner"],["spi_cbuy","Purchase plan"],["spi_impact","Business impact"]]}
/* the inputs behind the result, in words, shown above the results of every tool */
function wsSummary(items){const it=items.filter(Boolean);return `<div class="ws-sum"><span>Your selection</span>${it.length?it.map(x=>`<b>${wsE(x)}</b>`).join(""):"<b>Everything, no filter</b>"}</div>`}
/* a value with its change against a reference */
function wsDelta(now,ref,fmt,goodDown){if(ref==null||now==null||!isFinite(now)||!isFinite(ref))return"";const d=now-ref;if(Math.abs(d)<1e-9)return"Same as the reference";const up=d>0,good=goodDown?!up:up;return `<span class="${good?"ok":"bad"}">${up?"+":"-"}${fmt(Math.abs(d))}</span> against the reference`}
/* the four impacts of the case: today against the recommendation, with the decrease in figures and in percent */
const WS_IMP=[["emergency","Emergency procurement",c=>c.emergency_orders,v=>wsN(v,v<10?1:0)+" orders per year",c=>c.emergency_cost,"Emergency premium per year"],["purchase","Higher purchasing and carrying costs",c=>c.purchase_carry,v=>spiMoney(v)+" per year",null,"Holding plus ordering cost"],["capital","Excess tied-up working capital",c=>c.working_capital,v=>spiMoney(v),null,"Average stock value"],["downtime","Prolonged downtime and production losses",c=>c.downtime_hours,v=>wsN(v,v<10?1:0)+" hours per year",c=>c.downtime_cost,"Downtime cost per year"]];
function wsImpact(cur,rec,title){if(!cur||!rec)return"";return `<div class="imp"><div class="imp-h">${wsE(title||"Effect on the four impacts of the case")}<span>today against the recommendation, per year, Estimate</span></div><div class="imp-g">${WS_IMP.map(m=>{const a=m[2](cur),b=m[2](rec),d=a-b,pc=a>0?d/a:0,ca=m[4]?m[4](cur):null,cb=m[4]?m[4](rec):null;
 return `<div class="imp-c ${d>0?"ok":d<0?"bad":""}"><div class="imp-t">${wsE(m[1])}</div><div class="imp-v">${a>0||b>0?(d>=0?"-":"+")+Math.abs(Math.round(pc*100))+"%":"None"}</div><div class="imp-bars"><div><span>Today</span><i style="width:${a>0?100:0}%"></i><b>${m[3](a)}</b></div><div><span>Plan</span><i class="r" style="width:${a>0?Math.max(0,Math.min(100,b/a*100)):b>0?100:0}%"></i><b>${m[3](b)}</b></div></div><div class="imp-s">${m[5]}${ca!=null?": "+spiMoney(ca)+" to "+spiMoney(cb):""}</div></div>`}).join("")}</div></div>`}
