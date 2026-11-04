// Figures register and source sheets for the assistant (owner: Claude A). Reads Claude B's /api/ws/metrics (every headline figure with its
// definition and source) and /api/ws/source?sheet= (what each of the six case sheets holds and how it is read), so "how is X calculated"
// and "what is in the PR PO sheet" are answered from the same definitions the pages use.
async function ws(name,args={}){const ep=(await import('../../server/ws/'+name+'.mjs')).default;return new Promise((resolve,reject)=>{let st=200;const res={setHeader(){},get statusCode(){return st},set statusCode(x){st=x},end(t){try{const v=JSON.parse(t);st>=400?reject(new Error(v.error)):resolve(v)}catch(e){reject(e)}}};Promise.resolve(ep({method:'GET',url:'/x?'+new URLSearchParams(args),query:args,body:args,headers:{}},res)).catch(reject)})}
const N=(v,u='')=>/idr/i.test(u)?(Math.abs(v)>=1e9?'IDR '+(v/1e9).toFixed(1)+' bn':'IDR '+(v/1e6).toFixed(1)+' mn'):/share/i.test(u)?Math.round(v*1000)/10+'%':Number(v).toLocaleString('en-US',{maximumFractionDigits:1})+(u?' '+u:'');
const STOP=new Set('how is are the a an of what does do we calculated calculate defined define definition measured measure mean means figure metric value number count for in on and to from site'.split(' '));
export async function siteMetric(db,{q=''}={}){let m;try{m=await ws('metrics')}catch(e){return {id:'register:none',answer:'The figures register is not available: '+e.message}}
 const F=(m.outputs&&m.outputs.figures)||[],ws_=(String(q).toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>w.length>2&&!STOP.has(w));
 const sc=f=>{const t=(f.label+' '+f.id.replace(/_/g,' ')+' '+(f.definition||'')).toLowerCase();return ws_.reduce((s,w)=>s+(t.includes(w)?(f.label.toLowerCase().includes(w)?2:1):0),0)};
 const hits=F.map(f=>[sc(f),f]).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>x[1]);
 if(!hits.length)return {id:'register:list',answer:`The figures register holds ${F.length} headline figures in ${[...new Set(F.map(f=>f.group))].join(', ')}, each with its definition and source sheet. Name one, for example stock value, lead time or open orders.`};
 const [h,...o]=hits;return {id:'register:'+h.id,answer:`**${h.label}: ${N(h.value,h.unit)}** (${h.basis}, source ${h.source}). ${h.definition}${o.length?' Related: '+o.map(f=>f.label.toLowerCase()+' '+N(f.value,f.unit)).join('; ')+'.':''}`}}
const SHEET={notif:/notif/,plan:/mitem|mplan|maintenance (plan|item)/,movement:/movement/,prpo:/pr ?po|purchase (order|requisition)|procurement/,funcloc:/funcloc|functional location/,bom:/\bbom\b|bill of material/};
export async function sourceSheet(db,{sheet}={}){let s;try{s=await ws('source',{sheet})}catch(e){return {id:'source:none',answer:'That sheet is not known: notif, plan, movement, prpo, funcloc or bom.'}}const o=s.outputs||{};
 const empty=(o.fields||[]).filter(f=>f.share<0.5).map(f=>f.label.toLowerCase()).slice(0,3);
 return {id:'source:'+sheet,page:'spi_source',answer:`The ${o.title} sheet holds **${Number(o.records).toLocaleString('en-US')} records**${o.raw_rows&&o.raw_rows!==o.records?' ('+Number(o.raw_rows).toLocaleString('en-US')+' rows before exact copies were removed)':''} in ${(o.fields||[]).length} fields${(()=>{const d=Array.isArray(o.dates)&&o.dates[0]&&o.dates[0].months;return d&&d.length?', '+d[0].m+' to '+d[d.length-1].m:''})()}.${empty.length?' Mostly empty: '+empty.join(', ')+'.':''} ${(o.notes||[]).slice(0,2).join(' ')}`.replace(/\s+/g,' ').trim()}}
export function registerRoute(q){const t=q.toLowerCase();
 if(/(what is in|what does|describe|fields|columns|records|how (is|are) .* read|summar)/.test(t)&&/sheet|file|excel|source data/.test(t)){for(const [k,r] of Object.entries(SHEET))if(r.test(t))return ['source_sheet',{sheet:k}]}
 if(/how (is|are|do you|does the site) .*(calculated|defined|measured|counted|worked out)|definition of|figures register|headline figures|where does the .* (figure|number) come from/.test(t))return ['site_metric',{q}];
 return null}
