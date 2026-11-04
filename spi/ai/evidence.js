import {campaignModel,campaignInputs} from '../drivers/campaign.mjs';
const campaigns=new WeakMap();
// Read-only, bounded evidence. No free SQL or live-clock-dependent historical queries.
export const POLICY = Object.freeze({horizon:12, alpha:0.1, beta:0.1, service:{S:0.99,A:0.975,B:0.95,C:0.9}, insurance_lead_days:90});
export function evidence(db, material_no, {maxChars=6000}={}) {
 if(!Number.isSafeInteger(material_no)||material_no<=0)throw new Error('A valid material number is required');
 const one=(q,...p)=>db.prepare(q).get(...p), all=(q,...p)=>db.prepare(q).all(...p);
 const p=one('SELECT m.*,p.* FROM material m JOIN part_profile p USING(material_no) WHERE material_no=?',material_no);
 if(!p)throw new Error('Part not found in baseline data');
 const meta=Object.fromEntries(all('SELECT key,value FROM meta').map(r=>[r.key,r.value]));
 const cutoff=meta.data_cutoff, months=[];let date=new Date(meta.history_first_month+'-01T00:00:00Z');
 for(let i=0;i<Number(meta.history_months);i++){months.push(date.toISOString().slice(0,7));date.setUTCMonth(date.getUTCMonth()+1)}
 const quantities=new Map(all('SELECT month,qty FROM demand_month WHERE material_no=? AND month<=? ORDER BY month',material_no,cutoff.slice(0,7)).map(r=>[r.month,r.qty]));
 const series=months.map(month=>({month,qty:quantities.get(month)||0}));
 const eligible=all('SELECT id,lead_days FROM po_line WHERE material_no=? AND pr_date<=? AND po_delivery<=? AND lead_days BETWEEN 1 AND 400 ORDER BY lead_days',material_no,cutoff,cutoff);
 const percentile=(rows,f)=>{if(!rows.length)return null;const k=(rows.length-1)*f,a=Math.floor(k);return rows[a].lead_days+(rows[Math.ceil(k)].lead_days-rows[a].lead_days)*(k-a)};
 let lead=percentile(eligible,.5), basis='median', source='part completed PO lines';
 if(eligible.length<3){const pooled=p.family_id?all('SELECT po.lead_days FROM po_line po JOIN part_profile pp USING(material_no) WHERE pp.family_id=? AND po.pr_date<=? AND po.po_delivery<=? AND po.lead_days BETWEEN 1 AND 400 ORDER BY po.lead_days',p.family_id,cutoff,cutoff):[];
  const plant=pooled.length?pooled:all('SELECT lead_days FROM po_line WHERE pr_date<=? AND po_delivery<=? AND lead_days BETWEEN 1 AND 400 ORDER BY lead_days',cutoff,cutoff);
  lead=percentile(plant,.5);basis='assumption';source=pooled.length?'family completed PO median (Assumption)':'plant completed PO median (Assumption)';}
 if(!campaigns.has(db))campaigns.set(db,campaignModel(db));
 const campaign=campaigns.get(db),rule_inputs=campaignInputs(db,material_no,campaign);
 const facts=[];const add=(id,origin,value)=>facts.push({id,origin,value});
 const fields=['material_no','descr','unit','mrp_type','crit_max','demand_class','months_active','months_since_last','adi','cv2','stock','min_qty','max_qty','installed_total','n_funcloc','family_id','dq_flags','unit_price_idr','price_basis'];
 add('profile:'+material_no,'material',Object.fromEntries(fields.map(k=>[k,p[k]??null])));
 add('series:'+material_no,'movement',series);
 add('policy:forecast','policy',{...POLICY,basis:'Assumption: editable planning policy, not measured plant data'});
 add('lead:'+material_no,'po_line',{days:lead,basis,source,n:eligible.length,p10:percentile(eligible,.1)});
 for(const input of rule_inputs){const month=input.period_start;const load=campaign.outlook.find(x=>x.month===month);if(load&&!facts.some(f=>f.id==='campaign:'+month))add('campaign:'+month,'maint_item',{...load,assumption:campaign.assumption});}
 if(rule_inputs.length){const uplift=campaign.uplift_by_item_type.find(x=>x.item_type===p.item_type);const bounded=rule_inputs[0].value;add('itemtype:'+p.item_type,'movement',{...(uplift||{item_type:p.item_type,uplift:campaign.overall_uplift,basis:'Assumption: plant uplift used when item-type evidence is insufficient'}),bounded_uplift:bounded,display_uplift:Number(bounded.toFixed(1)),cap:3,campaign_months:campaign.campaign_months,reading:campaign.reading});}
 const bom=all('SELECT b.funcloc,b.installed_qty,f.criticality FROM bom b JOIN funcloc f USING(funcloc) WHERE b.material_no=? ORDER BY f.criticality,b.funcloc LIMIT 4',material_no);
 for(const r of bom)add('bom:'+r.funcloc,'bom',r);
 const pm=all("SELECT mi.item_no,mi.funcloc,mi.next_due FROM maint_item mi WHERE EXISTS(SELECT 1 FROM bom b WHERE b.material_no=? AND b.funcloc=mi.funcloc) AND mi.next_due BETWEEN ? AND date(?,'+12 months') ORDER BY mi.next_due,mi.item_no LIMIT 4",material_no,cutoff,cutoff);
 for(const r of pm)add('pm:'+r.funcloc+'#'+r.item_no,'maint_item',r);
 const notif=all("SELECT n.notif_no,n.priority,n.notif_date FROM notification n WHERE EXISTS(SELECT 1 FROM bom b WHERE b.material_no=? AND b.funcloc=n.funcloc) AND n.notif_date BETWEEN date(?,'-12 months') AND ? ORDER BY n.notif_date DESC,n.notif_no LIMIT 4",material_no,cutoff,cutoff);
 for(const r of notif)add('notif:'+r.notif_no,'notification',r);
 const orders=all('SELECT DISTINCT m.order_no FROM movement m WHERE m.material_no=? AND m.posting_date<=? AND EXISTS(SELECT 1 FROM notification n WHERE n.order_no=m.order_no AND n.notif_date<=?) ORDER BY m.order_no LIMIT 4',material_no,cutoff,cutoff);
 add('orders:'+material_no,'movement',orders);
 const po=all('SELECT id,pr_date,qty,lead_days,supplier,po_delivery,dq_flag FROM po_line WHERE material_no=? AND pr_date<=? ORDER BY pr_date DESC,id DESC LIMIT 8',material_no,cutoff);
 for(const r of po)add('po:'+r.id,'po_line',{...r,delivered_by_cutoff:r.po_delivery<=cutoff,note:'Delivery date is baseline procurement data, not proof of goods receipt'});
 const family=p.family_id?one('SELECT * FROM spec_family WHERE family_id=?',p.family_id):null;
 if(family){const pooled=all('SELECT d.month,SUM(d.qty) qty FROM demand_month d JOIN part_profile pp USING(material_no) WHERE pp.family_id=? AND d.material_no<>? AND d.month<=? GROUP BY d.month ORDER BY d.month',p.family_id,material_no,cutoff.slice(0,7));add('fam:'+p.family_id,'family_siblings',{...family,series:pooled,note:'Demand pooling does not establish interchangeability'});}
 let pack={material_no,data_cutoff:cutoff,synthetic_baseline:true,facts,rule_inputs,truncated:false};
 // Optional context is dropped as whole facts; core series, policy and profile always remain.
 while(JSON.stringify(pack).length>maxChars&&facts.length>4){facts.pop();pack.rule_inputs=pack.rule_inputs.filter(input=>input.evidence.every(id=>facts.some(f=>f.id===id)));pack.truncated=true}
 if(JSON.stringify(pack).length>maxChars)throw new Error('Core evidence exceeds the configured token budget');
 return pack;
}
export const fact=(pack,prefix)=>pack.facts.find(f=>f.id.startsWith(prefix))?.value;
export const promptEvidence=pack=>'<untrusted_evidence_json>\n'+JSON.stringify(pack).replace(/</g,'\\u003c').replace(/>/g,'\\u003e')+'\n</untrusted_evidence_json>';
export default evidence;
