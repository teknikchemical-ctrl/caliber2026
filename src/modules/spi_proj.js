/* Projection client (owner: Claude A). Every page that shows a projected figure reads it through spiProject: inputs -> learned models ->
   AI projection review -> engine -> page (/api/data/project). spiProjBasis draws the strip that says which model and which review stand behind
   a chart; spiReviewRun asks Gemini to review the flagged parts (/api/ai/review) and applies the accepted factors to every projection. */
regMod("spi_proj","1.0",["spi_core","spi_viz"],"One projection service for every page, with the AI review");
const SPIPJ={cache:{},adj:null,adjText:""};
function spiProjQs(scope={},inputs={}){const q={};for(const [k,v] of Object.entries({...scope,...inputs}))if(v!=null&&v!=="")q[k]=typeof v==="object"?JSON.stringify(v):String(v);if(SPIPJ.adj&&!q.adj)q.adj=JSON.stringify(SPIPJ.adj);return new URLSearchParams(q).toString()}
/* scope {mat|tag|set|cls|crit}, inputs {service_S.., demand, lead, carrying, budget, campaign}; resolves to the /api/data/project payload */
async function spiProject(scope={},inputs={}){const qs=spiProjQs(scope,inputs);if(SPIPJ.cache[qs])return SPIPJ.cache[qs];const p=spiApi("/api/data/project?"+qs).catch(e=>{delete SPIPJ.cache[qs];throw e});SPIPJ.cache[qs]=p;return p}
function spiProjBasis(d,o={}){if(!d)return"";const r=d.review,m=(d.model_check||{}).models||{},bt=(d.model_check||{}).backtest||{},n=x=>spiNum(x);
 const bits=[`<b>Projection basis</b> learned demand model${m.demand&&m.demand.auc?" (AUC "+m.demand.auc+")":""}, checked by the AI review, then the Optimized Scenario engine`];
 if(r)bits.push(`${n(r.parts)} parts checked, ${n(r.flagged)} flagged, ${n(r.basis.blend||0)} blended with history${r.insurance?", "+n(r.insurance)+" insurance spares":""}${r.basis.ai?", "+n(r.basis.ai)+" Gemini factors":""}`);
 if(typeof bt.mape==="number")bits.push(`backtest error ${Math.round(bt.mape*1000)/10}% a month`);
 return `<div class="spi-pbasis">${bits.map(b=>`<span>${b}</span>`).join("")}${o.link===false?"":`<button class="ghost" onclick="spiHubTab('spi_h_fc','spi_model')">See the review</button>`}</div>`}
/* Gemini review of the flagged parts; accepted factors apply to every later projection on every page */
async function spiReviewRun(scope={},el){if(el)el.innerHTML=`<p class="spi-sub">The AI is reviewing the flagged parts</p>`;try{const r=await spiApi("/api/ai/review?"+new URLSearchParams(Object.fromEntries(Object.entries(scope).filter(([,v])=>v)))) ;
  if(r.accepted&&r.accepted.length){SPIPJ.adj={...(SPIPJ.adj||{}),...r.adj};SPIPJ.cache={};SPIPJ.adjText=r.text}
  if(el)el.innerHTML=`<p>${esc(r.text||"")}</p>${r.provider!=="gemini"?`<p class="spi-sub">Gemini is not configured here, so the rules review stands${r.fallback?" ("+esc(r.fallback)+")":""}.</p>`:""}${(r.accepted||[]).length?spiTable(r.accepted,[{h:"Part",k:"material_no"},{h:"Factor",k:"factor",num:1},{h:"Reason",k:"reason"}],{always:1}):""}${(r.rejected||[]).length?`<p class="spi-sub">${r.rejected.length} proposals were rejected by the guardrails.</p>`:""}`;return r}catch(e){if(el)el.innerHTML=spiEmpty("The review could not run: "+e.message)}}
function spiReviewClear(){SPIPJ.adj=null;SPIPJ.cache={};SPIPJ.adjText="";if(typeof render==="function")render()}
