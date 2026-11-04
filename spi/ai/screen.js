// What the user sees (owner: Claude A). Claude B's tools publish their inputs and figures in SPIWS.views; the chat sends the
// one on screen as context.view, so "explain this" is answered from the user's own selection. Also builds the action
// buttons (open the part pop-up, the inventory planner, the equipment, the tab) that come with every answer.
const N=v=>typeof v==='number'?v.toLocaleString('en-US',{maximumFractionDigits:Math.abs(v)<10?2:0}):String(v);
const money=(v,u)=>/idr/i.test(u||'')&&typeof v==='number'&&Math.abs(v)>=1e6?'IDR '+(Math.abs(v)>=1e9?(v/1e9).toFixed(2)+' bn':(v/1e6).toFixed(1)+' mn')+(/year/i.test(u)?' per year':''):N(v)+(u?' '+u:'');
export function checkView(v){if(v==null)return;if(typeof v!=='object'||Array.isArray(v))throw new Error('Context view must be an object');if(JSON.stringify(v).length>12000)throw new Error('Context view is too large')}
const KEY={mat:v=>'part '+v,material_no:v=>'part '+v,set:v=>'equipment set '+v,loc:v=>'location '+String(v).replace(/^PX_/,''),funcloc:v=>'location '+String(v).replace(/^PX_/,''),horizon:v=>v+' months ahead',crit:v=>'criticality '+v,scope:v=>'scope '+v,service:v=>'service level '+(v<=1?Math.round(v*100)+'%':v),factor:v=>'demand at '+Math.round(v*100)+'%',demand_factor:v=>'demand at '+Math.round(v*100)+'%',lead:v=>v+' lead time',q:v=>'search "'+v+'"',supplier:v=>'supplier '+v,type:v=>'item type '+v,mode:()=>''};
function inputsInWords(inp){if(!inp||typeof inp!=='object')return '';const parts=Object.entries(inp).filter(([k,v])=>v!=null&&v!==''&&typeof v!=='object'&&KEY[k]).map(([k,v])=>KEY[k](v)).filter(Boolean).slice(0,4);return parts.length?' ('+parts.join(', ')+')':''}
const art=w=>/^[aeiou]/i.test(w)?'an':'a';
export function readScreen(view){const title=String(view.title||'This view').slice(0,80),figs=(Array.isArray(view.figures)?view.figures:[]).filter(f=>f&&f.label!=null&&f.value!=null).slice(0,12);
 if(!figs.length)return {id:'screen:'+title.toLowerCase().replace(/[^a-z0-9]+/g,'_'),title,figures:[],answer:'The '+title+' has no result on screen yet. Choose a part, set or filter and run it, and I will explain the result.'};
 const est=figs.slice(0,4).some(f=>f.basis&&f.basis!=='Data');
 const said=figs.slice(0,4).map(f=>{const l=String(f.label).replace(/\.$/,'').replace(/^./,c=>c.toLowerCase());return art(l)+' '+l+' of **'+money(f.value,f.unit)+'**'});
 const list=said.length>1?said.slice(0,-1).join(', ')+' and '+said[said.length-1]:said[0];
 const notes=(view.notes||[]).map(String).filter(n=>n.length<220).slice(0,1);
 return {id:'screen:'+title.toLowerCase().replace(/[^a-z0-9]+/g,'_'),title,inputs:view.inputs||{},figures:figs,notes,answer:'With your selection'+inputsInWords(view.inputs)+', the '+title+' shows '+list+(est?' (Estimates)':'')+'.'+(notes.length?' '+notes[0].replace(/^./,c=>c.toUpperCase()).replace(/([^.])$/,'$1.'):'')}}
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
