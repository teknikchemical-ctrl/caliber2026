import {dataFor} from './data.js';
// Project the typed read-only boundary into a bounded evidence pack. IDs and units stay traceable.
export const POLICY = Object.freeze({horizon:12, alpha:0.1, beta:0.1, service:{S:0.99,A:0.975,B:0.95,C:0.9}, insurance_lead_days:90});
const pick=(row,keys)=>Object.fromEntries(keys.map(k=>[k,row[k]??null]));
export function evidence(db,material_no,{maxChars=6000}={}){
 const data=dataFor(db),context=data.planning(material_no),p=context.part,cutoff=p.data_cutoff,campaign=context.campaign;
 const facts=[],add=(id,origin,value)=>facts.push({id,origin,value});
 const fields=['material_no','descr','unit','mrp_type','crit_max','demand_class','months_active','months_since_last','adi','cv2','stock','min_qty','max_qty','installed_total','n_funcloc','family_id','dq_flags','unit_price_idr','price_basis','inventory_position','open_orders','insurance_spare','release_review_eligible'];
 add('profile:'+material_no,'material',pick(p,fields));
 add('series:'+material_no,'movement',context.series.map(r=>pick(r,['month','qty'])));
 add('policy:forecast','policy',{...POLICY,basis:'Assumption: criticality order S, A, B, C; inventory position is on-hand only; zero observed demand is not zero need.'});
 add('lead:'+material_no,'po_line',pick(context.lead,['days','basis','source','n','p10','pool_n']));
 for(const input of context.rule_inputs){const month=input.period_start,load=campaign.outlook.find(x=>x.month===month);if(load&&!facts.some(f=>f.id==='campaign:'+month))add('campaign:'+month,'maint_item',{...load,assumption:campaign.assumption})}
 if(context.rule_inputs.length){const uplift=campaign.uplift_by_item_type.find(x=>x.item_type===p.item_type),bounded=context.rule_inputs[0].value;add('itemtype:'+p.item_type,'movement',{...(uplift||{item_type:p.item_type,uplift:campaign.overall_uplift,basis:'Assumption: plant uplift when item-type evidence is insufficient'}),bounded_uplift:bounded,display_uplift:Number(bounded.toFixed(1)),cap:3,campaign_months:campaign.campaign_months,reading:campaign.reading})}
 for(const r of context.bom)add(r.evidence_ids[0],'bom',pick(r,['funcloc','installed_qty','criticality']));
 for(const r of context.pm)add(r.evidence_ids[0],'maint_item',pick(r,['item_no','funcloc','next_due','descr']));
 for(const r of context.notifications)add(r.evidence_ids[0],'notification',pick(r,['notif_no','priority','notif_date','descr']));
 add('orders:'+material_no,'movement',context.orders.map(r=>pick(r,['order_no'])));
 for(const r of context.po)add(r.evidence_ids[0],'po_line',pick(r,['id','pr_date','qty','lead_days','supplier','po_delivery','data_quality','delivered_by_cutoff','excluded_from_lead_statistics','note']));
 if(context.family)add(context.family.evidence_ids[0],'family_siblings',pick(context.family,['family_id','label','item_type','standard_ref','members','basis','series','note']));
 const pack={material_no,data_cutoff:cutoff,units:{qty:p.unit||'Not in baseline data',lead:'days (proxy)',money:'IDR (Estimate)'},data_quality:p.data_quality,synthetic_baseline:true,facts,rule_inputs:context.rule_inputs,truncated:false};
 while(JSON.stringify(pack).length>maxChars&&facts.length>4){facts.pop();pack.rule_inputs=pack.rule_inputs.filter(input=>input.evidence.every(id=>facts.some(f=>f.id===id)));pack.truncated=true}
 if(JSON.stringify(pack).length>maxChars)throw new Error('Core evidence exceeds the configured token budget');return pack;
}
export const fact=(pack,prefix)=>pack.facts.find(f=>f.id.startsWith(prefix))?.value;
export const promptEvidence=pack=>'<untrusted_evidence_json>\n'+JSON.stringify(pack).replace(/</g,'\\u003c').replace(/>/g,'\\u003e')+'\n</untrusted_evidence_json>';
export default evidence;
