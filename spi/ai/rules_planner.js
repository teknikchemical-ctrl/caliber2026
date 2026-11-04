import {fact} from './evidence.js';
export function rulesPlan(pack){
 const p=fact(pack,'profile:'),policy=fact(pack,'policy:'),lead=fact(pack,'lead:'),family=fact(pack,'fam:');
 if(!Number.isFinite(lead?.days))throw new Error('No supported lead-time assumption is available');
 const critical=['S','A'].includes(p.crit_max),noDemand=p.demand_class==='no_demand';
 const strongFamily=family&&!String(family.basis).includes('weak')&&!String(family.family_id).startsWith('T|')&&family.series.some(x=>x.qty>0);
 let method={smooth:'ses',erratic:'ses',intermittent:'sba',lumpy:'tsb',single_event:'tsb',no_demand:critical?'zero_demand_insurance':'driver_based'}[p.demand_class];
 if(!method)throw new Error('Unknown demand class in baseline data');
 if(['lumpy','single_event'].includes(p.demand_class)&&p.months_active<3&&strongFamily)method='family_pooled_sba';
 const flags=[];if(p.months_active<3)flags.push('sparse_history');if(!p.unit_price_idr)flags.push('price_missing');if(JSON.parse(p.dq_flags||'[]').length)flags.push('data_quality');
 const params={alpha:policy.alpha};if(method==='tsb')params.beta=policy.beta;
 if(method==='family_pooled_sba'){params.pool_family_id=family.family_id;params.pool_weight=.5;}
 return {material_no:pack.material_no,method,params,horizon_months:policy.horizon,service_level:policy.service[p.crit_max]??policy.service.C,lead_time_days:Math.max(1,Math.min(400,Math.max(lead.days,lead.p10||0))),lead_time_basis:lead.basis,inputs:[],insurance_spare:noDemand&&critical,rationale:'Rules baseline selects the method from the recorded demand class. Service level and smoothing are labelled planning assumptions. Critical non-moving parts require insurance review; family grouping alone does not prove interchangeability.',confidence:p.months_active>=3?.7:.4,evidence:pack.facts.filter(f=>/^(profile:|series:|policy:|lead:|fam:)/.test(f.id)).map(f=>f.id),flags};
}
export default rulesPlan;
