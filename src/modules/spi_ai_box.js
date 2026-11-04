/* AI reasoning box (owner: Claude A). spiAiBox(host, featureId, {title, inputs, figures, compare, actions}) shows a short paragraph that
   explains the inputs and the result, from POST /api/ai/explain (Gemini when configured, otherwise the database rules). Every run is logged in
   the browser (last 50) and the latest one per feature is sent to the assistant as context, so it can reason over what the user ran. */
regMod("spi_ai_box","1.0",["spi_core"],"AI reasoning box for every feature");
const SPIAB={log:(()=>{try{return JSON.parse(localStorage.getItem("spi_ai_log")||"[]")}catch(e){return[]}})(),seq:{}};
function spiAiLogAdd(e){SPIAB.log=[e,...SPIAB.log.filter(x=>x.feature!==e.feature)].slice(0,50);try{localStorage.setItem("spi_ai_log",JSON.stringify(SPIAB.log))}catch(x){}}
function spiAiLatest(){return SPIAB.log.slice(0,6).map(x=>({feature:x.feature,title:x.title,inputs:x.inputs,figures:(x.figures||[]).slice(0,6),text:x.text,at:x.at}))}
function spiAiFmt(t){return esc(t).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\b(4\d{9})\b/g,(a,n)=>`<a href="#" onclick="typeof spiPartOpen==='function'?spiPartOpen('${n}',${n}):0;return false">${n}</a>`)}
async function spiAiBox(host,feature,payload){if(!host)return;let box=host.querySelector(":scope > .spi-aibox");if(!box){box=document.createElement("div");box.className="spi-aibox";host.appendChild(box)}
 const n=(SPIAB.seq[feature]=(SPIAB.seq[feature]||0)+1);box.innerHTML=`<div class="spi-aibox-h"><b>AI reasoning</b><span>reading the result</span></div><p class="spi-aibox-t"><i>Explaining the inputs and the result</i></p>`;
 const body={feature,...payload,figures:(payload.figures||[]).slice(0,12).map(f=>({label:String(f.label).slice(0,120),value:f.value,unit:String(f.unit||"").slice(0,30),basis:f.basis||""}))};
 try{const r=await fetch("/api/ai/explain",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}).then(x=>x.json());if(SPIAB.seq[feature]!==n)return;
  box.innerHTML=`<div class="spi-aibox-h"><b>AI reasoning</b><span>${r.provider==="gemini"?"Gemini, checked against the data":"database rules"}</span></div><p class="spi-aibox-t">${spiAiFmt(r.text||"")}</p><div class="spi-aibox-a"><button onclick="spiAiAsk('${esc(feature)}')">Ask a follow-up</button></div>`;
  spiAiLogAdd({feature,title:payload.title,inputs:payload.inputs,figures:body.figures,text:r.text,at:new Date().toISOString()})}catch(e){box.innerHTML=`<div class="spi-aibox-h"><b>AI reasoning</b></div><p class="spi-aibox-t">The explanation could not load: ${esc(e.message)}</p>`}}
function spiAiAsk(feature){const e=SPIAB.log.find(x=>x.feature===feature);if(typeof spiChMount==="function")spiChMount();const b=document.getElementById("spichbox");if(b&&b.hidden)spiChToggle();const i=document.getElementById("spichi");if(i){i.value="About "+(e&&e.title||feature)+": ";i.focus()}}
