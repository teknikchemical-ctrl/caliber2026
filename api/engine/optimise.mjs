// POST {filters?:{crit,class,q,family,system,equipment,supplier,action,material_no},policy?,limit?:100,offset?:0} -> {total,matched_actions,rows:[PartResult],actions:{ACTION:count},summary:{baseline,dynamic,working_capital_release_idr,risk_change_idr,unpriced_parts},curve:[Scenario],assumptions,data_cutoff}. Summary covers all filtered parts; rows paginated (limit <=500). Release is a gross candidate ceiling, not realised cash.
import {openDb,json,integer,endpoint} from './_shared.mjs';
import {portfolio} from '../../spi/engine/optimise.js';
export default endpoint('POST',(req,res)=>{const b=req.body||{};json(res,200,portfolio(openDb(),{filters:b.filters||{},policy:b.policy||{},limit:integer(b.limit,1,500,100),offset:integer(b.offset,0,100000,0)}))});
