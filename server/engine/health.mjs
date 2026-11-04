// GET ?crit=&q=&family=&limit=100&offset=0 -> {total,groups:{excess|slow|non_moving|obsolete|insurance:{count,estimated_value_idr,rows:[PartResult]}},notes}. Rows: material_no,descr,crit_max,stock,inventory,recommendation fields flattened (action, urgency, order_qty, order_by, release_idr, rationale, flags). limit <=500. Groups overlap; values cannot be added.
import {openDb,json,integer,endpoint,qs} from './_shared.mjs';
import {health} from '../../spi/engine/health.js';
export default endpoint('GET',(req,res)=>{const q=qs(req);json(res,200,health(openDb(),{filters:{crit:q.crit,q:q.q,family:q.family},limit:integer(q.limit,1,500,100),offset:integer(q.offset,0,100000,0)}))});
