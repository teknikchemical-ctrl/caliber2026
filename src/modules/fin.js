/* =====================================================================================================
   COSTING AND BUSINESS CASE PAGE (owner: Codex, see docs/agents/CODEX.md)
   One self-contained module. It adds the page "Costing" (data-page "fin") and, if you want, an assistant tool.
   Inputs: the case's financial assumptions in cases/<id>/fin.json (arrives here as window.FIN) and the plant data already in the page.
   Do not edit any other src/ file. If you need a change elsewhere, write it in your handoff file for Claude A.

   What you can use (read only):
     CASE            title, company, subtitle           K.sets, K.assets, K.docs, K.inst      the case data (K = KB)
     MH              work orders: r.n set, r.tag, r.type, r.bd ("Yes"/"No"/null), r.dt downtime h, r.lh labour h, r.lc labour cost, r.mc material cost, r.tc total cost, r.t0..t2 times
     pdmUnit(n)      predictive risk of a set: .health .level ("high"|"medium"|"low")      woOf(n)  work orders of set n
     S(n)            the set n                              sum(a,f) cnt(a,f)                    small helpers
     cCard(title,html,sub) cCols(items,{h,w}) kpiTile(big,label,tone,js)    cards, column chart, KPI tile (src/modules/ch.js, mh1.js)
     esc(s) fmt(n)                                          escaping and number format
     csvOf(headers,rows) dlFile(name,content,type) rcDoc(title,sub,html,{kind})  CSV, download, printable document with header (src/modules/rc.js, ks.js)
     STORE.mem.cfg  STORE.put("cfg")                        keep user inputs (see the old business case in gov.js: gbv, govSetBiz)
     can("review")                                          true if the signed-in role may change inputs
     AI.tools, aiRoute                                      add an assistant tool: see src/modules/eqclass.js for the pattern (tool object plus an aiRoute wrapper)
   Rules: text style in CLAUDE.md (no em dashes, % symbol, units after a space, label every assumption), performance budget (no work at load: do everything inside finPage()).
   ===================================================================================================== */
// Cash flows use constant prices, before tax, all implementation at t=0 and year-end annual flows.
const FIN_FIELDS={horizon:'Horizon',discount:'Discount rate',historyYears:'History exposure',downtimeValue:'Downtime value',avoidMaintenance:'Maintenance avoidance',avoidDowntime:'Downtime avoidance',oneOff:'Shared one-off cost',perUnit:'Cost per set',units:'Costed implementation sets',contingency:'Implementation contingency',annualRunning:'Annual running cost',otherBenefit:'Other annual benefit'};
function finRecords(rows){
 const totals={maintenance:0,labour:0,materials:0,downtime:0,breakdowns:0,missingCost:0,missingDowntime:0};
 const equipment={},types={},months={};
 for(const r of rows){const cost=typeof r.tc==='number'&&Number.isFinite(r.tc)?r.tc:null,dt=typeof r.dt==='number'&&Number.isFinite(r.dt)?r.dt:null;
  totals.maintenance+=cost??0;totals.downtime+=dt??0;totals.labour+=Number(r.lc)||0;totals.materials+=Number(r.mc)||0;totals.breakdowns+=r.bd==='Yes';totals.missingCost+=cost===null;totals.missingDowntime+=dt===null;
  for(const [map,key] of [[equipment,r.tag||'Unassigned'],[types,r.type||'Unspecified'],[months,String(r.rd||'Undated').slice(0,7)]]){const x=map[key]||(map[key]={cost:0,downtime:0,count:0});x.cost+=cost??0;x.downtime+=dt??0;x.count++}
 }return{...totals,count:rows.length,equipment,types,months};
}
function finValidate(v){const errors=[];for(const k of Object.keys(FIN_FIELDS)){if(typeof v[k]!=='number'||!Number.isFinite(v[k])||v[k]<0)errors.push(FIN_FIELDS[k]+': supply a nonnegative number')}
 if(!Number.isInteger(v.horizon)||v.horizon<1||v.horizon>50)errors.push('Horizon must be an integer from 1 to 50');
 if(!(v.historyYears>0))errors.push('History exposure must be positive');
 if(!Number.isInteger(v.units)||v.units<1)errors.push('Rollout sets must be a positive integer');
 for(const k of ['avoidMaintenance','avoidDowntime'])if(v[k]>1)errors.push(FIN_FIELDS[k]+' must be between 0 and 1');return errors;}
function finNPV(flows,r){return flows.reduce((a,x,t)=>a+x/Math.pow(1+r,t),0)}
function finIRR(flows){if(!(flows[0]<0)||flows.slice(1).some(x=>x<0)||!flows.slice(1).some(x=>x>0))return null;
 let lo=-.9999,hi=1;while(finNPV(flows,hi)>0&&hi<1e9)hi*=2;if(finNPV(flows,hi)>0)return null;
 for(let i=0;i<160;i++){const mid=(lo+hi)/2;if(finNPV(flows,mid)>0)lo=mid;else hi=mid}return(lo+hi)/2;}
function finModel(records,v,scenario={benefit:1,cost:1}){
 const errors=finValidate(v);if(errors.length)return{errors};
 if(!(scenario.benefit>=0&&Number.isFinite(scenario.benefit)&&scenario.cost>=0&&Number.isFinite(scenario.cost)))return{errors:['Invalid scenario multipliers']};
 const levers={maintenance:records.maintenance/v.historyYears*v.avoidMaintenance,downtime:records.downtime/v.historyYears*v.downtimeValue*v.avoidDowntime,other:v.otherBenefit};
 const shared=v.oneOff*scenario.cost,perSet=v.perUnit*v.units*scenario.cost,contingency=(shared+perSet)*v.contingency,investment=shared+perSet+contingency;
 const benefit=Object.values(levers).reduce((a,b)=>a+b,0)*scenario.benefit,running=v.annualRunning*scenario.cost;
 const flows=[-investment,...Array(v.horizon).fill(benefit-running)];let cumulative=0,payback=investment===0?0:null;
 const cash=flows.map((flow,t)=>{const before=cumulative;cumulative+=flow;if(t>0&&payback===null&&before<0&&cumulative>=0)payback=t-1-before/flow;return{year:t,benefit:t?benefit:0,cost:t?running:investment,net:flow,cumulative,discounted:flow/Math.pow(1+v.discount,t)}});
 const pvBenefits=cash.reduce((a,x)=>a+x.benefit/Math.pow(1+v.discount,x.year),0),pvCosts=cash.reduce((a,x)=>a+x.cost/Math.pow(1+v.discount,x.year),0);
 return{errors:[],levers,shared,perSet,contingency,investment,benefit,running,cash,flows,npv:finNPV(flows,v.discount),irr:finIRR(flows),payback,bcr:pvCosts>0?pvBenefits/pvCosts:null};
}
function finValues(){const saved=typeof STORE!=='undefined'&&STORE.mem.cfg.fin;const overrides=saved&&saved.caseId===CASE.id&&saved.signature===JSON.stringify(FIN.inputs)?saved.values:{};
 return Object.fromEntries(Object.keys(FIN_FIELDS).map(k=>[k,Object.prototype.hasOwnProperty.call(overrides,k)?overrides[k]:FIN.inputs?.[k]?.value]));}
function finSet(k,raw){if(!can('review')||!Object.prototype.hasOwnProperty.call(FIN_FIELDS,k))return;const values=finValues();values[k]=raw===''?null:Number(raw);STORE.mem.cfg.fin={caseId:CASE.id,signature:JSON.stringify(FIN.inputs),values};STORE.put('cfg');go('fin');}
function finReset(){if(!can('review'))return;delete STORE.mem.cfg.fin;STORE.put('cfg');go('fin');}
function finMoney(n){return n==null?'Not defined':Number(n).toLocaleString('en-US',{maximumFractionDigits:0})+' '+FIN.currency;}
function finTable(headers,rows){return `<div class="fin-scroll"><table class="fin-table"><thead><tr>${headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function finPlot(labels,values){
 const max=Math.max(1,...values.map(Math.abs));
 return `<div class="fin-bars" role="img" aria-label="${esc(labels.map((x,i)=>x+': '+values[i].toFixed(0)).join('; '))}">${labels.map((x,i)=>`<div><span>${esc(x)}</span><div class="fin-bar" style="width:${Math.max(0.5,Math.abs(values[i])/max*100)}%;background:${values[i]<0?'#a52222':'#155ea3'}"></div><span>${finMoney(values[i])}</span></div>`).join('')}</div>`;
}
function finRisk(){return K.sets.map(s=>{const prediction=pdmUnit(s.n),a=(FIN.risk||[]).find(x=>x.set===s.n),valid=a&&['Case data','Market source','Estimate','Assumption'].includes(a.basis)&&a.source&&Number.isFinite(a.annualProbability)&&a.annualProbability>=0&&a.annualProbability<=1&&Number.isFinite(a.consequence)&&a.consequence>=0;
 return{tag:s.tag,health:prediction.health,level:prediction.level,expected:valid?a.annualProbability*a.consequence:null,basis:valid?a.basis+': '+a.source:'Annual probability and event consequence not supplied'};});}
function finPage(){
 if(!window.FIN||!FIN.currency)return '<h1>Costing</h1><p>No financial inputs supplied for this case.</p>';
 const r=finRecords(MH),v=finValues(),m=finModel(r,v),money=finMoney;
 let body=`<h1>Costing and business case</h1><p>${esc(CASE.title)} | ${esc(FIN.currency)} | ${v.horizon??'Unspecified'} years | discount rate ${v.discount==null?'Unspecified':(v.discount*100).toFixed(1)+'%'}</p><p class="note-warn">${esc(FIN.status||'Review input sources before using this model.')}</p>`;
 body+=`<div class="fin-kpis">${kpiTile(money(r.maintenance),'Recorded maintenance cost')}${kpiTile(fmt(r.downtime)+' h','Recorded asset downtime')}${kpiTile(r.breakdowns,'Recorded breakdowns')}${kpiTile(r.count,'Work orders')}</div><p>Case data: maintenance history. Missing total costs: ${r.missingCost}; missing downtime values: ${r.missingDowntime}. Missing values are excluded from sums. Asset downtime can overlap and is not plant outage time. Labour and materials are components of total cost, never added twice.</p>`;
 const group=(title,map)=>cCard(title,finTable(['Group','Work orders','Maintenance cost','Downtime'],Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,x])=>[esc(k),x.count,money(x.cost),fmt(x.downtime)+' h'])));
 body+=cCard('Maintenance cost by equipment chart',finPlot(Object.keys(r.equipment),Object.values(r.equipment).map(x=>x.cost)));
 body+=`<div class="fin-columns">${group('Cost by equipment',r.equipment)}${group('Cost by work type',r.types)}</div>`+group('Cost by month',r.months);
 body+=cCard('Financial inputs',`<p>Blue fields are editable assumptions; black figures are calculated. Local edits are labelled Assumption and are kept only in this browser. Rates are fractions (0.2 = 20%).</p>`+finTable(['Input','Value','Unit','Basis and source'],Object.entries(FIN_FIELDS).map(([k,label])=>{const a=FIN.inputs?.[k]||{},edited=v[k]!==a.value;return[esc(label),`<input class="fin-input" aria-label="${esc(label)}" type="number" step="any" min="0" value="${v[k]??''}" ${can('review')?'':'disabled'} onchange="finSet('${k}',this.value)">`,esc(a.unit||''),esc(edited?'Assumption: local user override':(a.basis||'Unspecified')+': '+(a.source||'Source not supplied'))]}))+`<button onclick="finReset()" ${can('review')?'':'disabled'}>Reset to case inputs</button>`);
 if(m.errors.length)return body+cCard('Inputs required',m.errors.map(x=>`<p>${esc(x)}</p>`).join(''));
 body+=`<div class="fin-kpis">${kpiTile(money(m.npv),'NPV, before tax')}${kpiTile(m.irr===null?'Not defined':(m.irr*100).toFixed(1)+'%','IRR')}${kpiTile(m.payback===null?'Beyond horizon':m.payback.toFixed(2)+' years','Simple payback')}${kpiTile(m.bcr===null?'Not defined':m.bcr.toFixed(2),'Benefit-cost ratio')}</div>`;
 body+=cCard('Cost build-up',finTable(['Item','Amount'],[['Shared implementation',money(m.shared)],['Per-set implementation',money(m.perSet)],['Contingency',money(m.contingency)],['Total year-zero investment',money(m.investment)],['Annual running cost',money(m.running)]]));
 body+=cCard('Annual benefit levers',finTable(['Lever','Base annual amount'],Object.entries(m.levers).map(([k,x])=>[esc(k),money(x)]))+'<p>Maintenance savings use total recorded maintenance cost divided by stated exposure. Downtime uses asset-hours times an assumed contribution per hour. Other benefit must exclude these two levers. Benefits cover the whole supplied history; the costed set count only changes implementation cost. For partial rollout, supply the corresponding case history and assumptions. Constant prices, no tax, debt, terminal value or escalation; full annual benefit begins in year 1. No event timing is predicted.</p>');
 body+=cCard('Scenarios',finTable(['Scenario','Basis','Annual benefit','Investment','NPV','IRR','Payback','BCR'],(FIN.scenarios||[]).map(s=>{const x=finModel(r,v,s);if(x.errors.length)return[esc(s.name),'Invalid multipliers','','','','','',''];return[esc(s.name),esc(s.basis+': '+s.source),money(x.benefit),money(x.investment),money(x.npv),x.irr===null?'Not defined':(x.irr*100).toFixed(1)+'%',x.payback===null?'Beyond horizon':x.payback.toFixed(2)+' years',x.bcr===null?'Not defined':x.bcr.toFixed(2)]})));
 body+=cCard('Cumulative cash flow chart',finPlot(m.cash.map(x=>'Year '+x.year),m.cash.map(x=>x.cumulative)));
 body+=cCard('Annual and cumulative cash flow',finTable(['Year','Benefit','Cost','Net cash flow','Cumulative','Discounted net'],m.cash.map(x=>[x.year,money(x.benefit),money(x.cost),money(x.net),money(x.cumulative),money(x.discounted)])));
 const sensitivity=['downtimeValue','avoidMaintenance','annualRunning'].map(k=>[FIN_FIELDS[k],... [.8,1,1.2].map(f=>money(finModel(r,{...v,[k]:v[k]*f}).npv))]);
 body+=cCard('NPV sensitivity',finTable(['Input varied','-20%','Base','+20%'],sensitivity)+'<p>Assumption: one-at-a-time variation by 20%, all other inputs held constant.</p>');
 body+=cCard('Risk-adjusted view',finTable(['Equipment','Predictive health','Risk category','Annual expected loss','Basis'],finRisk().map(x=>[esc(x.tag),fmt(x.health),esc(x.level),x.expected===null?'Not valued':money(x.expected),esc(x.basis)]))+'<p>Risk categories are rankings, not event probabilities. Expected loss requires an explicitly sourced annual event probability and incremental consequence. It is shown separately and is never added to the cash-flow benefits.</p>');
 return body+`<div class="fin-actions"><button onclick="finExport()">Export cash flow CSV</button><button onclick="finReport()">Print financial report</button></div>`;
}
function finExport(){const m=finModel(finRecords(MH),finValues());if(m.errors.length)return;const rows=[['Currency',FIN.currency],['Horizon years',finValues().horizon],['Discount rate',finValues().discount],['Status',FIN.status||''],['Year','Benefit','Cost','Net cash flow','Cumulative','Discounted net'],...m.cash.map(x=>[x.year,x.benefit,x.cost,x.net,x.cumulative,x.discounted]),[],['Input','Value','Unit','Basis','Source'],...Object.entries(FIN_FIELDS).map(([k,label])=>[label,finValues()[k],FIN.inputs[k]?.unit,finValues()[k]!==FIN.inputs[k]?.value?'Assumption: local override':FIN.inputs[k]?.basis,FIN.inputs[k]?.source])];dlFile('financial-cash-flow.csv',rows.map(r=>r.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\r\n'),'text/csv');}
function finReport(){rcDoc('Financial business case',CASE.title,finPage(),{kind:'fin'});}
function finSummary({set=0}={}){set=K.sets.some(s=>s.n===set)?set:0;if(!window.FIN?.currency)return{text:'Financial inputs are not supplied for this case.',sources:[],conf:40};
 const rows=set?MH.filter(r=>r.n===set||r.tag===S(set)?.tag):MH,r=finRecords(rows),m=finModel(finRecords(MH),finValues());
 const text=`<b>${set?esc(S(set).tag):'Whole case'} cost summary</b>: recorded maintenance cost ${finMoney(r.maintenance)}, downtime ${r.downtime.toFixed(2)} h, ${r.breakdowns} breakdowns, ${r.count} work orders. ${m.errors.length?'Business case inputs incomplete.':`Whole-case NPV ${finMoney(m.npv)} over ${finValues().horizon} years at ${(finValues().discount*100).toFixed(1)}% discount rate; annual benefit ${finMoney(m.benefit)}, investment ${finMoney(m.investment)}, annual running cost ${finMoney(m.running)}, IRR ${m.irr===null?'Not defined':(m.irr*100).toFixed(2)+'%'}, simple payback ${m.payback===null?'Beyond horizon':m.payback.toFixed(2)+' years'}, benefit-cost ratio ${m.bcr===null?'Not defined':m.bcr.toFixed(2)}.`} ${esc(FIN.status||'Review assumptions.')} Asset downtime is not plant outage time; risk rankings are not probabilities.`;return{text,sources:[{k:'data',id:'FIN:history',chunk_id:'data:FIN:history',title:'Maintenance history and financial inputs',set,ver:'case pack',status:'Assumption',text:text.replace(/<[^>]+>/g,' ')}],conf:80,intent:'cost_summary'};}
if(typeof document!=='undefined'){
 regMod('fin','2.0',['dl'],'Costing and business case');document.documentElement.dataset.fin=(window.FIN&&FIN.currency)?'1':'0';
 AI.tools.cost_summary={description:'Recorded maintenance cost, downtime and labelled business case assumptions, NPV and costs. Monetary figures match the Costing page.',parameters:{type:'object',properties:{set:{type:'integer',description:'Equipment set, or 0 for whole case'}},required:[]},run:finSummary};
 const finPreviousRoute=aiRoute;aiRoute=function(q,ctx){if(typeof aiIntent==='function'&&aiIntent(q).t==='bypass')return finPreviousRoute.apply(this,arguments);if(/\b(cost|costing|downtime cost|npv|irr|payback|business case|benefit.cost)\b/i.test(q)){const s=K.sets.find(x=>q.toLowerCase().includes(x.tag.toLowerCase()));return['cost_summary',{set:s?s.n:ctx?.set||0}]}return finPreviousRoute.apply(this,arguments)};
}
if(typeof module!=='undefined'&&module.exports)module.exports={finRecords,finValidate,finNPV,finIRR,finModel,FIN_FIELDS};
