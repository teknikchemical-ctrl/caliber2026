// Read any table of the database (owner: Claude A). No SQL from the model: a table name, column filters and a sort, all checked
// against the live schema, at most 20 rows back. data_dictionary gives a plain label for every table and column.
const OPS={eq:'=',ne:'<>',gt:'>',gte:'>=',lt:'<',lte:'<=',like:'LIKE'};
const HIDE=new Set(['eval_case']);
function schema(db){const t=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(x=>x.name).filter(x=>!HIDE.has(x));return Object.fromEntries(t.map(n=>[n,db.prepare('PRAGMA table_info('+n+')').all().map(c=>c.name)]))}
function dict(db){try{return db.prepare('SELECT * FROM data_dictionary').all()}catch{return []}}
const fmt=v=>typeof v==='number'?v.toLocaleString('en-US',{maximumFractionDigits:2}):v==null?'blank':String(v);
export function describeDatabase(db){const s=schema(db),d=dict(db),lab=(t,c='')=>(d.find(x=>x.table_name===t&&x.column_name===c)||{}).label;
 const tables=Object.entries(s).map(([t,cols])=>({table:t,label:lab(t)||t,rows:db.prepare('SELECT count(*) n FROM '+t).get().n,columns:cols.map(c=>({column:c,label:lab(t,c)||c}))}));
 const main=tables.filter(t=>['material','funcloc','bom','movement','notification','maint_item','po_line'].includes(t.table));
 return {id:'db:schema',tables,answer:'The database holds the six case files in '+main.length+' source tables: '+main.map(t=>({material:'spare parts',funcloc:'functional locations',bom:'bill of materials lines',movement:'material issues',notification:'notifications',maint_item:'maintenance items',po_line:'purchase lines'}[t.table])+' ('+t.rows.toLocaleString('en-US')+')').join(', ')+'. Derived tables add part and location profiles, monthly demand, equipment sets and a data quality register of '+(tables.find(t=>t.table==='dq_issue')?.rows||0)+' findings. Every table and column has a plain description in the data dictionary, and I can count or list records from any of them.'}}
export function queryRecords(db,{table,filters={},sort,desc=false,limit=10,count_only=false}={}){const s=schema(db);if(!s[table])throw new Error('Unknown table '+table);const cols=s[table],where=[],args=[];
 for(const [c,cond] of Object.entries(filters||{})){if(!cols.includes(c))throw new Error('Unknown column '+c+' in '+table);const pairs=cond&&typeof cond==='object'&&!Array.isArray(cond)?Object.entries(cond):[['eq',cond]];for(const [op,v] of pairs){if(!OPS[op])throw new Error('Unknown operator '+op);if(v!=null&&typeof v==='object')throw new Error('Filter values must be plain');where.push((op==='like'?'upper('+c+')':c)+' '+OPS[op]+' ?');args.push(op==='like'?'%'+String(v).toUpperCase()+'%':v)}}
 if(sort&&!cols.includes(sort))throw new Error('Unknown sort column '+sort);const w=where.length?' WHERE '+where.join(' AND '):'';
 const total=db.prepare('SELECT count(*) n FROM '+table+w).get(...args).n;const n=Math.max(1,Math.min(20,Number(limit)||10));
 const rows=count_only?[]:db.prepare('SELECT * FROM '+table+w+(sort?' ORDER BY '+sort+(desc?' DESC':''):'')+' LIMIT '+n).all(...args);
 const d=dict(db),label=(d.find(x=>x.table_name===table&&!x.column_name)||{}).label||table,key=cols.find(c=>/descr|label|name/.test(c));
 const NOUNS={notification:['notification','notifications'],movement:['material issue','material issues'],po_line:['purchase line','purchase lines'],maint_item:['maintenance item','maintenance items'],funcloc:['location','locations'],material:['material','materials'],bom:['BoM line','BoM lines'],part_profile:['part','parts'],dq_issue:['data quality finding','data quality findings'],supplier:['supplier','suppliers']};
 const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
 const when=v=>{const m=String(v).match(/^(20\d\d)(?:-(\d\d))?(?:-(\d\d))?$/);return m?(m[3]?'on '+m[1]+'-'+m[2]+'-'+m[3]:m[2]?'in '+MON[+m[2]-1]+' '+m[1]:'in '+m[1]):String(v)};
 const phrase=(c,v)=>{const o=v&&typeof v==='object'?Object.entries(v)[0]:['eq',v],[op,x]=o;
  if(/date|due|_on$/.test(c))return op==='like'||op==='eq'?when(x):(op.startsWith('g')?'from ':'up to ')+x;
  if(c==='status'&&op==='ne'&&/complete/i.test(x))return 'that are still open';if(c==='status')return 'with status '+String(x).toLowerCase();
  if(c==='priority')return 'of '+String(x).toLowerCase()+' priority';if(c==='funcloc')return 'on '+String(x).replace(/^PX_/,'');if(c==='criticality')return 'of criticality '+x;
  if(c==='stock'&&x===0&&op==='eq')return 'at zero stock';if(c==='material_no')return 'for material '+x;if(c==='supplier'||c==='supplier_code')return 'from supplier '+x;
  const lab=((dict(db).find(r=>r.table_name===table&&r.column_name===c)||{}).label||c.replace(/_/g,' ')).toLowerCase();return 'where '+lab+({eq:' is ',ne:' is not ',gt:' is above ',gte:' is at least ',lt:' is below ',lte:' is at most ',like:' contains '}[op])+x};
 const cond=Object.entries(filters||{}).map(([c,v])=>phrase(c,v)).sort((a,b)=>a.startsWith('that')-b.startsWith('that')).join(' ');const nn=NOUNS[table]||[label.split(':')[0].toLowerCase(),label.split(':')[0].toLowerCase()];
 const show=rows.slice(0,3).map(r=>key&&r[key]?String(r[key]):cols.slice(0,3).map(c=>fmt(r[c])).join(' ')).filter(Boolean);
 return {id:'db:'+table,table,label,total,rows,answer:'There '+(total===1?'is':'are')+' **'+total.toLocaleString('en-US')+' '+(total===1?nn[0]:nn[1])+'**'+(cond?' '+cond:' in the data')+'.'+(show.length?' The first '+(show.length>1?show.length+' are ':'is ')+show.join('; ')+'.':'')}}
// Rules-mode parser for "how many ..." questions over the main tables.
const NOUN=[[/notifications?/,'notification','notif_date'],[/(material )?issues?|goods issues?|movements?/,'movement','posting_date'],[/po lines?|purchase (order )?lines?|pr lines?|purchase requisitions?/,'po_line','pr_date'],[/maintenance items?|planned items?|pm items?/,'maint_item','next_due'],[/locations?|functional locations?/,'funcloc',null],[/materials?|parts?/,'material',null]];
export function countRoute(q){const t=q.toLowerCase();if(!/^\s*(how many|count|number of)\b/.test(t))return null;const nn=NOUN.find(([re])=>re.test(t));if(!nn)return null;const [,table,date]=nn,f={};
 const ym=t.match(/\b(20\d\d)(?:-(\d\d))?\b/);if(ym&&date){f[date]={like:ym[2]?ym[1]+'-'+ym[2]:ym[1]}}
 const pr=t.match(/\b(very high|high|medium|low|emergency)\s+priority/);if(pr&&table==='notification')f.priority=pr[1].replace(/\b\w/g,c=>c.toUpperCase());
 if(/\bopen|in progress|outstanding/.test(t)&&table==='notification')f.status={ne:'Complete'};
 const tag=(q.toUpperCase().match(/\b[A-Z]{1,5}-\d+[A-Z]?\b/)||[])[0];if(tag&&['notification','maint_item','movement'].includes(table))f.funcloc='PX_'+tag;
 const cr=t.match(/\bcriticality\s+([sabc])\b|\b([sabc])-critical/);if(cr&&table==='funcloc')f.criticality=(cr[1]||cr[2]).toUpperCase();
 if(table==='material'&&/zero stock/.test(t))f.stock=0;
 return ['query_records',{table,filters:f,count_only:true}]}
