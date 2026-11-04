// Universal search over the whole database and the site (owner: Claude A). One temporary FTS5 index (built once per connection, about
// 0.3 s) over parts, equipment, notification texts, maintenance tasks, suppliers, data quality findings, the data dictionary, tabs and
// case points. Used as the assistant's fallback, so any question that names something in the data gets an answer with where to look next.
import {PAGES} from './pages.js';
const built=new WeakMap();
function index(db){if(built.has(db))return built.get(db);let ok=false;
 try{db.exec("CREATE VIRTUAL TABLE temp.kb_all USING fts5(kind UNINDEXED, key UNINDEXED, title, body, tokenize='unicode61')");
  const ins=db.prepare("INSERT INTO temp.kb_all(kind,key,title,body) VALUES (?,?,?,?)");
  db.exec("INSERT INTO temp.kb_all(kind,key,title,body) SELECT 'part', material_no, descr, coalesce(item_type,'')||' '||coalesce(mrp_type,'')||' '||material_no FROM main.material");
  db.exec("INSERT INTO temp.kb_all(kind,key,title,body) SELECT 'equipment', funcloc, coalesce(tag,funcloc)||' '||coalesce(descr,''), coalesce(eq_class_name,'')||' criticality '||coalesce(criticality,'') FROM main.funcloc");
  db.exec("INSERT INTO temp.kb_all(kind,key,title,body) SELECT 'notification', notif_no, descr, replace(funcloc,'PX_','')||' '||coalesce(priority,'')||' '||coalesce(status,'')||' '||notif_date FROM main.notification");
  db.exec("INSERT INTO temp.kb_all(kind,key,title,body) SELECT 'task', item_no, descr, replace(funcloc,'PX_','')||' '||coalesce(cycle_text,'')||' next due '||coalesce(next_due,'') FROM main.maint_item");
  db.exec("INSERT INTO temp.kb_all(kind,key,title,body) SELECT 'supplier', supplier_code, supplier, count(*)||' PO lines' FROM main.po_line WHERE supplier IS NOT NULL GROUP BY supplier_code, supplier");
  try{db.exec("INSERT INTO temp.kb_all(kind,key,title,body) SELECT 'finding', id, issue, coalesce(detail,'')||' '||coalesce(action,'')||' '||table_name FROM main.dq_issue")}catch{}
  try{db.exec("INSERT INTO temp.kb_all(kind,key,title,body) SELECT 'field', table_name||'.'||column_name, label, table_name||' '||column_name FROM main.data_dictionary")}catch{}
  for(const [id,p] of Object.entries(PAGES))ins.run('tab',id,p[0],p[1]+' '+String(p[2]).replace(/[\\/^$|()?*+.\[\]]/g,' '));
  ok=true}catch{ok=false}
 built.set(db,ok);return ok}
const STOP=new Set('a an the of for on in at to is are was were what which who how many much show me tell about give list all any do does have has there with and or by from this that it its our we please find search where can i see get know data site page tab'.split(' '));
const KIND={part:'Parts',equipment:'Equipment',notification:'Notifications',task:'Maintenance tasks',supplier:'Suppliers',finding:'Data quality findings',field:'Data fields',tab:'Tabs'};
export function searchAll(db,{text=''}={}){const ws=(String(text).toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g)||[]).filter(w=>w.length>1&&!STOP.has(w)).slice(0,6);
 if(!ws.length||!index(db))return {id:'search:all',hits:[],answer:'Ask about a part number, a tag, a description word, a date, a supplier or a tab, and I will look it up.'};
 const q=ws.map(w=>'"'+w.replace(/"/g,'')+'"*').join(' AND '),qor=ws.map(w=>'"'+w.replace(/"/g,'')+'"*').join(' OR ');
 let rows=[];try{rows=db.prepare("SELECT kind,key,title,body FROM temp.kb_all WHERE kb_all MATCH ? ORDER BY rank LIMIT 60").all(q);if(rows.length<3)rows=rows.concat(db.prepare("SELECT kind,key,title,body FROM temp.kb_all WHERE kb_all MATCH ? ORDER BY rank LIMIT 40").all(qor))}catch{}
 const seen=new Set(),g={};for(const r of rows){const k=r.kind+':'+r.key;if(seen.has(k))continue;seen.add(k);(g[r.kind]=g[r.kind]||[]).push(r)}
 const meta=/\b(column|field|mean|means|definition|define|quality|finding|data|table)\b/i.test(text);if(!meta){delete g.field;delete g.finding}else{const keep=['field','finding','tab'];for(const k of Object.keys(g))if(!keep.includes(k)&&(g.field||g.finding))delete g[k]}
 const order=(meta?['field','finding','tab']:['tab','part','equipment','notification','task','supplier']).filter(k=>g[k]);
 if(!order.length)return {id:'search:all',hits:[],answer:`Nothing in the database or the site matches "${ws.join(' ')}". Try a part number, a tag such as PP-1323B, or a word from a description.`};
 const nice=(r)=>r.kind==='part'?'['+r.key+'] '+String(r.title).replace(/,\s*FOR\s*$/i,'').split(',').slice(0,3).map(x=>x.trim()).join(', ').toLowerCase():r.kind==='equipment'?String(r.title).replace(/^PX_/,''):r.kind==='notification'?'notification '+r.key+' "'+r.title+'" ('+String(r.body).split(' ').slice(0,1)+')':r.kind==='task'?'"'+r.title+'" on '+String(r.body).split(' ')[0]:r.kind==='tab'?'the '+r.title+' tab':r.title;
 const parts=order.slice(0,4).map(k=>{const a=g[k];return KIND[k]+' ('+a.length+(a.length>=40?'+':'')+'): '+a.slice(0,3).map(nice).join('; ')});
 const lead=g.tab?`The ${g.tab[0].title} tab is the place to look. `:'';
 return {id:'search:all',hits:order.flatMap(k=>g[k].slice(0,5).map(r=>({kind:r.kind,key:r.key,title:r.title}))),tab:g.tab?.[0]?.key,page:g.tab?.[0]?.key,label:g.tab?.[0]?.title,answer:lead+`For "${ws.join(' ')}" the database holds ${parts.join('. ')}.`+(g.part?.length===1?' Ask about that part number for its card, plan and timeline.':'')}}
export function siteHelp(q){const t=q.toLowerCase();if(/\b(notifications?|tasks?|work orders?|maintenance items?|suppliers?|findings?)\b.*\b(mention|about|with|containing|for|on)\b/.test(t)&&!/\b\d{10,12}\b|how many/.test(t))return ['search_all',{text:q}];if(!/\b(where (can|do) i|how (can|do) i (see|find|check)|which (tab|page|feature)|what does the site|what can (you|the site) do|help me (find|navigate))\b/.test(t))return null;return ['search_all',{text:q}]}
