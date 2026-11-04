// What the user sees (owner: Claude A). Claude B's tools publish their inputs and figures in SPIWS.views; the chat sends the
// one on screen as context.view, so "explain this" is answered from the user's own selection. Also builds the action
// buttons (open the part pop-up, the inventory planner, the equipment, the tab) that come with every answer.
const N=v=>typeof v==='number'?v.toLocaleString('en-US',{maximumFractionDigits:Math.abs(v)<10?2:0}):String(v);
const money=(v,u)=>/idr/i.test(u||'')&&typeof v==='number'&&Math.abs(v)>=1e6?'IDR '+(Math.abs(v)>=1e9?(v/1e9).toFixed(2)+' bn':(v/1e6).toFixed(1)+' mn')+(/year/i.test(u)?' per year':''):N(v)+(u?' '+u:'');
export function checkView(v){if(v==null)return;if(typeof v!=='object'||Array.isArray(v))throw new Error('Context view must be an object');if(JSON.stringify(v).length>12000)throw new Error('Context view is too large')}
function inputsInWords(inp){if(!inp||typeof inp!=='object')return '';const parts=Object.entries(inp).filter(([k,v])=>v!=null&&v!==''&&typeof v!=='object').slice(0,5).map(([k,v])=>k.replace(/_/g,' ')+' '+v);return parts.length?' for '+parts.join(', '):''}
export function readScreen(view){const title=String(view.title||'This view').slice(0,80),figs=(Array.isArray(view.figures)?view.figures:[]).filter(f=>f&&f.label!=null&&f.value!=null).slice(0,12);
 const head=title+inputsInWords(view.inputs)+(figs.length?':':' shows no figures yet.');
 const said=figs.slice(0,4).map(f=>String(f.label).replace(/\.$/,'').toLowerCase()+' '+money(f.value,f.unit)+(f.basis&&f.basis!=='Data'?' ('+f.basis+')':''));
 const body=said.length?' '+said.slice(0,-1).join(', ')+(said.length>1?' and ':'')+said[said.length-1]+'.':'';
 return {id:'screen:'+title.toLowerCase().replace(/[^a-z0-9]+/g,'_'),title,inputs:view.inputs||{},figures:figs,notes:(view.notes||[]).slice(0,3),answer:head+body}}
export function screenFor(question,context={}){const v=context.view;if(!v||!v.title)return false;return /\b(this|these|here|on screen|current|my selection|the result)\b|^explain this/i.test(question)}
// Action buttons: parts, equipment and tabs named in the answer or the evidence. Each is {label,kind,page,args}.
export function buildActions(db,final,results){const out=[],seen=new Set(),add=a=>{const k=a.kind+':'+(a.args.mat||a.args.funcloc||a.page);if(seen.has(k)||out.length>=5)return;seen.add(k);out.push(a)};
 const text=String(final.answer||'');for(const r of results)if(r.material_no&&/^(plan|part):/.test(r.id||''))final.material_no=final.material_no||r.material_no;const mats=[...new Set((text.match(/\b4[0-9]{9}\b/g)||[]).map(Number))];if(final.material_no)mats.unshift(final.material_no);
 for(const m of [...new Set(mats)].slice(0,2)){const r=db.prepare('SELECT descr FROM material WHERE material_no=?').get(m);if(!r)continue;const short=String(r.descr).split(',').slice(0,2).join(' ').toLowerCase();
  add({kind:'part',label:'Open '+m+' ('+short+')',page:'spi_iplan',args:{mat:m},descr:r.descr});}
 const tags=new Set();for(const r of results){const f=r.equipment?.funcloc||(typeof r.funcloc==='string'?r.funcloc:null);if(f)tags.add(f)}
 for(const t of (text.toUpperCase().match(/\b[A-Z]{1,5}-\d+[A-Z]?\b/g)||[]).slice(0,4)){const f=db.prepare('SELECT funcloc FROM funcloc WHERE tag=? OR funcloc=? LIMIT 1').get(t,'PX_'+t);if(f)tags.add(f.funcloc)}
 for(const f of [...tags].slice(0,2))add({kind:'equipment',label:'Show '+f.replace(/^PX_/,'')+' in the equipment explorer',page:'spi_space',args:{funcloc:f}});
 for(const r of results){if(r.page&&r.label)add({kind:'tab',label:'Go to '+r.label,page:r.page,args:{}});if(/^activity:20/.test(r.id))add({kind:'tab',label:'Open the maintenance timeline',page:'spi_mtime',args:{}});if(/^inventory:(excess|slow_dead)/.test(r.id))add({kind:'tab',label:'Open the stock tab',page:'spi_inv',args:{}});if(/^inventory:(critical_zero|reorder|critical_risk)/.test(r.id))add({kind:'tab',label:'Open the purchase plan',page:'spi_cbuy',args:{}});if(/^record:(po|pr|supplier)/.test(r.id))add({kind:'tab',label:'Open the purchase plan',page:'spi_cbuy',args:{}});if(/^record:notif/.test(r.id))add({kind:'tab',label:'Open the notification explorer',page:'spi_mnotif',args:{}})}
 return out}
