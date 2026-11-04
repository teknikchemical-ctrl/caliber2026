// Read-only inventory question tools. Calculations reuse the engine and baseline category definitions.
import {dataFor} from './data.js';
import {selected,evaluate} from '../engine/optimise.js';
import {CATS} from '../../server/data/stock-health.mjs';
import {campaignModel} from '../drivers/campaign.mjs';
import {WITH} from '../../server/data/savings.mjs';
export const inventoryKinds=['critical_risk','critical_zero','excess','slow_dead','insurance','release','reorder','top_reorder_lead','campaign'];
export function inventoryList(db,{kind,equipment,material_no,limit=10}={}){
 const clean=dataFor(db),scope={...(equipment?{equipment}:{}),...(material_no?{material_no}:{})};
 const matches=selected(db,scope),ids=new Set(matches.map(p=>p.material_no));
 const n=v=>v==null?'Not in baseline data':Number(v).toLocaleString('en-US',{maximumFractionDigits:2});
 let rows,definition;
 if(['critical_risk','reorder','top_reorder_lead'].includes(kind)){
  rows=matches.filter(p=>kind==='critical_risk'?['S','A'].includes(p.crit_max):true).map(p=>evaluate(db,p));
  rows=rows.filter(r=>kind==='critical_risk'?r.stockout_risk>1-r.service_target+1e-9:r.action==='REORDER').sort((a,b)=>a.urgency-b.urgency||b.stockout_risk-a.stockout_risk||a.material_no-b.material_no);
  definition=kind==='critical_risk'?'S/A materials whose engine stockout probability exceeds their criticality service target.':'Engine REORDER actions, ranked by urgency, then stockout probability, then material number. Order quantities use the dynamic policy; check open orders and Stock Item/Non Stock master data before purchasing.';
  rows=rows.map(r=>({...clean.part(r.material_no),order_qty:r.order_qty,order_by:r.order_by,stockout_risk:r.stockout_risk,reorder_point:r.inventory.reorder_point,action:r.action,planning_lead_days:r.lead_time_days,lead_basis:r.provenance?.lead_time_basis||'Engine planning proxy; inspect forecast evidence'}));
 }else if(kind==='campaign'){
  const model=campaignModel(db),hi=model.outlook.filter(o=>o.high_load),campaign=model.campaign_months;
  const normal=Math.max(1,model.history.length-campaign.length),uplifts=Object.fromEntries(model.uplift_by_item_type.filter(u=>u.uplift).map(u=>[u.item_type,Math.min(3,Math.max(1,u.uplift))]));
  const marks=campaign.map(()=>'?').join(',')||"''";
  const raw=db.prepare(`select p.material_no,(select sum(qty) from movement v where v.material_no=p.material_no and v.month not in (${marks})) / ${normal}.0 base from part_profile p join material m using(material_no) where m.mrp_type='Stock Item' and p.months_active>0 and p.crit_max in ('S','A')`).all(...campaign);
  rows=raw.filter(r=>ids.has(r.material_no)&&r.base>0).map(r=>{const p=clean.part(r.material_no),up=uplifts[p.item_type]||Math.min(3,model.overall_uplift||1),need=r.base*up*hi.length,gap=Math.max(0,need-p.stock);return {...p,expected_demand:Number(need.toFixed(1)),gap_qty:Number(gap.toFixed(1)),gap_value_idr:p.unit_price_idr==null?null:gap*p.unit_price_idr}}).filter(r=>r.gap_qty>0).sort((a,b)=>(b.gap_value_idr||0)-(a.gap_value_idr||0)||b.gap_qty-a.gap_qty);
  definition='Campaign window: '+hi.map(o=>o.month).join(', ')+'. Estimate from non-campaign monthly issues and measured item-type campaign uplift (capped at 3), applied to planned high-load months. Maintenance items are not confirmed spare orders; check open purchase orders and base units.';
 }else if(kind==='release'){
  rows=db.prepare(`${WITH} select material_no,cat,value release_candidate_idr from v where cat in ('excess_true','non_moving') and crit_max in ('B','C') order by value desc,material_no`).all().filter(r=>ids.has(r.material_no)).map(r=>({...clean.part(r.material_no),category:r.cat,release_candidate_idr:r.release_candidate_idr}));
  definition='Mutually exclusive B/C above-Max and non-moving review candidates, using the Cost reduction register. S/A and insurance reserves excluded. Not cash savings or disposal approval.';
 }else{
  const where={critical_zero:"m.mrp_type='Stock Item' and p.stock=0 and p.crit_max in ('S','A') and p.months_active>=2",excess:CATS.excess.w,slow_dead:'('+CATS.slow.w+') or ('+CATS.non_moving.w+')',insurance:'('+CATS.insurance.w+') and p.stock>0'}[kind];
  const order=kind==='excess'?'p.excess_value_idr desc':kind==='critical_zero'?'p.crit_rank desc,p.total_qty desc':'p.stock_value_idr desc';
  rows=db.prepare(`select p.material_no from part_profile p join material m using(material_no) where ${where} order by ${order},p.material_no`).all().filter(r=>ids.has(r.material_no)).map(r=>{const p=clean.part(r.material_no);return {...p,...(kind==='excess'?{excess_qty:p.stock-p.max_qty,static_excess_value_idr:p.unit_price_idr==null?null:(p.stock-p.max_qty)*p.unit_price_idr}:{}),...(kind==='slow_dead'?{movement_status:p.months_active===0?'Non-moving':'Slow-moving'}:{})}});
  definition={critical_zero:'S/A Stock Item materials at zero on-hand stock with issues in at least two historical months.',excess:CATS.excess.def,slow_dead:CATS.slow.def+' '+CATS.non_moving.def+' Non-moving is not proof of obsolescence; insurance reserves stay.',insurance:CATS.insurance.def}[kind];
 }
 const total=rows.length,shown=rows.slice(0,kind==='top_reorder_lead'?1:limit),label=equipment||material_no||'all materials';
 const idr=v=>v==null?'price Not in baseline data':Math.abs(v)>=1e9?'IDR '+(v/1e9).toFixed(2)+' bn':Math.abs(v)>=1e6?'IDR '+(v/1e6).toFixed(1)+' mn':'IDR '+n(v);
 const describe=r=>{const base='['+r.material_no+'] '+r.descr+': stock '+n(r.stock)+' '+r.unit;
  if(kind==='top_reorder_lead')return base+'; planning lead time '+n(r.planning_lead_days)+' days (proxy); '+r.lead_basis+'.';
  if(kind==='excess')return base+'; Max '+n(r.max_qty)+'; excess '+n(r.excess_qty)+' '+r.unit+'; excess value '+idr(r.static_excess_value_idr)+' (Estimate)';
  if(kind==='campaign')return base+'; estimated campaign demand '+n(r.expected_demand)+' '+r.unit+'; gap '+n(r.gap_qty)+' '+r.unit+'; gap value '+idr(r.gap_value_idr)+' (Estimate)';
  if(kind==='release')return base+'; review candidate '+idr(r.release_candidate_idr)+' (Estimate), '+r.category;
  if(['critical_risk','reorder'].includes(kind))return base+'; reorder point '+n(r.reorder_point)+'; proposed order '+n(r.order_qty)+' '+r.unit+'; modelled stockout probability '+n(r.stockout_risk*100)+'%.';
  return base+'; criticality '+r.crit_max+'; '+(kind==='slow_dead'?r.movement_status+'; ':'')+'stock value '+idr(r.stock_value_idr)+' (Estimate)';
 };
 const sh=r=>String(r.descr||'').split(',').slice(0,2).map(x=>x.trim()).join(', ').toLowerCase()+' ['+r.material_no+']';
 const phrase=r=>kind==='excess'?sh(r)+' ('+n(r.excess_qty)+' '+r.unit+' above Max, '+idr(r.static_excess_value_idr)+')':['critical_risk','reorder'].includes(kind)?sh(r)+' (stock '+n(r.stock)+', order '+n(r.order_qty)+' '+r.unit+')':kind==='slow_dead'?sh(r)+' ('+String(r.movement_status||'').toLowerCase()+', '+idr(r.stock_value_idr)+')':kind==='campaign'?sh(r)+' (gap '+n(r.gap_qty)+' '+r.unit+')':kind==='release'?sh(r)+' ('+idr(r.release_candidate_idr)+')':kind==='top_reorder_lead'?sh(r)+' ('+n(r.planning_lead_days)+' days lead time proxy)':sh(r)+(r.stock_value_idr?' ('+idr(r.stock_value_idr)+')':'');
 const lead={excess:' hold stock above their Max',critical_zero:' (S or A, with demand) are at zero stock',critical_risk:' (S or A) have a modelled stockout chance above their service target',slow_dead:' are slow-moving or have not moved in 17 months',insurance:' are insurance spares with stock',reorder:' should be reordered first',campaign:' are short for the next campaign window',release:' are B or C release candidates',top_reorder_lead:' lead the reorder list'}[kind]||' match';
 const close={excess:'Review them with engineering before releasing any stock; insurance spares stay.',critical_zero:'Order these first; open orders are not in the baseline data.',critical_risk:'The purchase plan gives the order-by date for each.',slow_dead:'Non-moving is not proof of obsolescence, so they go to engineering review, not disposal.',insurance:'They stay in stock whatever their movement.',reorder:'The purchase plan gives the order-by date for each.',campaign:'Order the ones with long lead times first.',release:'This is a review list, not realised cash.'}[kind]||'';
 const list=shown.slice(0,3).map(phrase),joined=list.length>1?list.slice(0,-1).join(', ')+' and '+list[list.length-1]:list[0];
 const answer='**'+n(total)+' parts**'+(label==='all materials'?'':' in '+label)+lead+'. '+(shown.length?(total>1?'The largest are ':'It is ')+joined+'. ':'None match this rule in the selected scope. ')+close+' Stock is on-hand only (Estimate values at the last PO price).';
 return {id:'inventory:'+kind,...clean.stamp({kind,scope,total,shown:shown.length,truncated:total>shown.length,definition,rows:shown.map(r=>Object.fromEntries(['material_no','descr','unit','stock','mrp_type','crit_max','min_qty','max_qty','excess_qty','static_excess_value_idr','order_qty','reorder_point','stockout_risk','action','planning_lead_days','lead_basis','movement_status','stock_value_idr','release_candidate_idr','category','expected_demand','gap_qty','gap_value_idr','insurance_spare','dq_flags','evidence_ids'].filter(k=>r[k]!==undefined).map(k=>[k,r[k]]))),answer},['inventory:'+kind],{count:'materials',stock:'material base units',money:'IDR (Estimate)'})};
}

export function inventoryRoute(question,resolved={}){
 if(/^(?:how many|count|number of|berapa|total)\b/i.test(question)||/^what is.*(?:value|count|number)/i.test(question)||/\b(?:npv|cash|cleanup|review cost|rank)\b/i.test(question))return null;
 const q=question.toLowerCase(),scope={...(resolved.material_no?{material_no:resolved.material_no}:resolved.funcloc?{equipment:resolved.funcloc}:{})};let kind;
 if(/campaign|turnaround/.test(q)&&/short|critical|gap|ready|readiness/.test(q))kind='campaign';
 else if(/lead.*top reorder|top reorder.*lead/.test(q))kind='top_reorder_lead';
 else if(/critical|kritis/.test(q)&&/zero stock|stock.*zero|stok.*(?:nol|kosong)/.test(q))kind='critical_zero';
 else if(/critical|kritis/.test(q)&&/stockout|at risk|shortage|kehabisan/.test(q))kind='critical_risk';
 else if(/insurance/.test(q)&&/spare|worth|value/.test(q))kind='insurance';
 else if(/(?:b and c|b\/c).*releas/.test(q))kind='release';
 else if(/overstock|excess stock/.test(q))kind='excess';
 else if(/slow.moving|dead stock|non.moving/.test(q))kind='slow_dead';
 else if(/reorder.*(?:first|how many|priorit)|(?:what|which).*reorder first/.test(q))kind='reorder';
 return kind?['inventory_list',{kind,...scope}]:null;
}
