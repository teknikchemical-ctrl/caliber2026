// Knowledge layer for the assistant (owner: Claude A). Pipeline: question -> resolveEntities (SQLite FTS5 + glossary + dates)
// -> read-only tool -> short deterministic answer. The model (Gemini) may re-word it; every figure comes from SQL.
const GLOSS=[
 [/heat exchangers?|exchangers?|coolers?|condensers?|reboilers?|chillers?/i,'HE'],[/\bpumps?\b/i,'PP'],[/compressors?|blowers?|\bfans?\b/i,'KC'],[/furnaces?|crackers?|burners?/i,'BF'],
 [/steam turbines?|turbines?/i,'KT'],[/relief valves?|\bpsvs?\b|\bprvs?\b/i,'PRV'],[/shutdown valves?|\bsdvs?\b/i,'SDV'],[/motor operated valves?|\bmovs?\b/i,'MOV'],
 [/flow control valves?/i,'FCV'],[/level control valves?/i,'LCV'],[/pressure control valves?/i,'PCV'],[/temperature control valves?/i,'TCV'],
 [/pressure transmitters?/i,'PIT'],[/flow transmitters?/i,'FIT'],[/level transmitters?/i,'LIT'],[/temperature transmitters?/i,'TIT'],[/differential pressure/i,'DPT'],
 [/pressure gauges?|gauges?/i,'PGI'],[/temperature elements?|thermocouples?/i,'TEL'],[/vessels?|drums?/i,'VD'],[/columns?|strippers?|towers?/i,'CL'],[/junction box(?:es)?/i,'JBX'],[/orifices?/i,'ROF']];
const STOP=new Set('a an the of for on in at to is are was were what which who how many much show me tell about give list all any parts part spares spare materials material equipment location locations items item do does have has there with and or by from this that it its our we please find search whats where stock bom installed can could would should'.split(' '));
const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12,january:1,february:2,march:3,april:4,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const pad=n=>String(n).padStart(2,'0'),fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:0}),bn=v=>'IDR '+(v/1e9).toFixed(2)+' bn';
export function parseDate(q){let m;
 if(m=q.match(/\b(20\d\d)-(\d\d)-(\d\d)\b/))return m[1]+'-'+m[2]+'-'+m[3];
 if(m=q.match(/\b(\d{1,2})[\/.](\d{1,2})[\/.](20\d\d)\b/))return m[3]+'-'+pad(m[2])+'-'+pad(m[1]);
 if(m=q.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\.?,?\s+(20\d\d)\b/i)){const mo=MONTHS[m[2].toLowerCase()];if(mo)return m[3]+'-'+pad(mo)+'-'+pad(m[1])}
 if(m=q.match(/\b([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d\d)\b/i)){const mo=MONTHS[m[1].toLowerCase()];if(mo)return m[3]+'-'+pad(mo)+'-'+pad(m[2])}
 return null}
const cache=new WeakMap();
// Temporary FTS5 tables (built once per connection, about 25 ms). Falls back to LIKE when the connection cannot create them.
function kb(db){if(cache.has(db))return cache.get(db);let ok=false;
 try{db.exec("CREATE VIRTUAL TABLE temp.kb_loc USING fts5(descr,tag,cls,tokenize='unicode61')");db.exec("INSERT INTO temp.kb_loc(rowid,descr,tag,cls) SELECT rowid,coalesce(descr,''),coalesce(tag,''),coalesce(eq_class,'') FROM main.funcloc");
  db.exec("CREATE VIRTUAL TABLE temp.kb_mat USING fts5(descr,item_type,tokenize='unicode61')");db.exec("INSERT INTO temp.kb_mat(rowid,descr,item_type) SELECT material_no,coalesce(descr,''),coalesce(item_type,'') FROM main.material");ok=true}catch{ok=false}
 cache.set(db,ok);return ok}
const words=t=>(t.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>w.length>1&&!STOP.has(w));
const fts=ws=>ws.map(w=>'"'+w.replace(/"/g,'')+'"*').join(' AND ');
export function resolveEntities(db,q){
 const out={date:parseDate(q),classes:[],tag:null,material_no:null,words:[]};
 const mat=(q.match(/\b\d{10}\b/)||[])[0];if(mat)out.material_no=Number(mat);
 const tag=(q.toUpperCase().match(/\b(?:[A-Z]{2}_)?[A-Z]{1,5}-\d+[A-Z]?\b/)||[])[0];if(tag)out.tag=tag.replace(/^PX_/,'');
 let rest=q;for(const [re,c] of GLOSS)if(re.test(rest)){if(!out.classes.includes(c))out.classes.push(c);rest=rest.replace(re,' ')}
 out.words=words(rest.replace(/\b20\d\d\b/g,' ').replace(/\b[A-Z]{1,5}-\d+[A-Z]?\b/gi,' '));return out}
function classInfo(db,c){return db.prepare('SELECT eq_class,eq_class_name,count(*) n,sum(has_bom) with_bom FROM funcloc WHERE eq_class=? GROUP BY 1,2').get(c)}
function locSearch(db,cls,ws,limit=12){
 if(kb(db)&&ws.length){try{const sql=`SELECT f.funcloc,f.tag,f.descr,f.eq_class,f.has_bom FROM temp.kb_loc k JOIN funcloc f ON f.rowid=k.rowid WHERE temp.kb_loc MATCH ?${cls.length?' AND f.eq_class IN ('+cls.map(()=>'?').join(',')+')':''} ORDER BY f.has_bom DESC,f.tag LIMIT ${limit}`;
  const r=db.prepare(sql).all('descr:('+fts(ws)+')',...cls);if(r.length)return r}catch{}}
 const like=ws.map(()=> 'descr LIKE ?').join(' AND ');const args=ws.map(w=>'%'+w+'%');
 return db.prepare(`SELECT funcloc,tag,descr,eq_class,has_bom FROM funcloc WHERE ${[like,cls.length?'eq_class IN ('+cls.map(()=>'?').join(',')+')':''].filter(Boolean).join(' AND ')||'1=1'} ORDER BY has_bom DESC,tag LIMIT ${limit}`).all(...args,...cls)}
function partsFor(db,funclocs,limit=6){if(!funclocs.length)return [];const ph=funclocs.map(()=>'?').join(',');
 return db.prepare(`SELECT m.material_no,m.descr,m.stock,m.unit,m.last_unit_price_idr price,coalesce(p.n_issues,0) issues,p.crit_max crit,sum(b.installed_qty) installed,count(DISTINCT b.funcloc) locs FROM bom b JOIN material m USING(material_no) LEFT JOIN part_profile p USING(material_no) WHERE b.funcloc IN (${ph}) GROUP BY m.material_no ORDER BY issues DESC,locs DESC LIMIT ${limit}`).all(...funclocs)}
const partLine=p=>'['+p.material_no+'] '+p.descr+' (stock '+fmt(p.stock??0)+(p.issues?', '+fmt(p.issues)+' issues':'')+')';
// ---- tools ----
export function findEntities(db,{text=''}={}){const r=resolveEntities(db,String(text));const cls=r.classes.map(c=>classInfo(db,c)).filter(Boolean);
 const locs=(r.words.length||cls.length)?locSearch(db,r.classes,r.words,8):[];
 let mats=[];if(r.words.length){try{if(kb(db))mats=db.prepare('SELECT m.material_no,m.descr,m.stock FROM temp.kb_mat k JOIN material m ON m.material_no=k.rowid WHERE temp.kb_mat MATCH ? LIMIT 6').all(fts(r.words));else throw 0}catch{mats=db.prepare('SELECT material_no,descr,stock FROM material WHERE '+r.words.map(()=>'descr LIKE ?').join(' AND ')+' LIMIT 6').all(...r.words.map(w=>'%'+w+'%'))}}
 const lines=[];if(cls.length)lines.push('Equipment class: '+cls.map(c=>c.eq_class_name+' ('+c.eq_class+', '+fmt(c.n)+' locations)').join('; ')+'.');
 if(locs.length)lines.push('Closest equipment: '+locs.slice(0,5).map(l=>l.tag+' '+l.descr).join('; ')+'.');
 if(mats.length)lines.push('Matching materials: '+mats.slice(0,4).map(m=>'['+m.material_no+'] '+m.descr).join('; ')+'.');
 return {id:'scope:find',entities:r,classes:cls,locations:locs,materials:mats,answer:lines.length?lines.join(' '):'Not in baseline data: nothing matches those words.'}}
export function describeScope(db,{cls,text,funcloc,focus}={}){
 const r=resolveEntities(db,[cls,text].filter(Boolean).join(' '));const classes=cls?[String(cls).toUpperCase()]:r.classes;
 if(funcloc){const tag=String(funcloc).replace(/^PX_/,'');const f=db.prepare('SELECT * FROM funcloc WHERE funcloc=? OR tag=? LIMIT 1').get('PX_'+tag,tag)||db.prepare('SELECT * FROM funcloc WHERE funcloc=? LIMIT 1').get(funcloc);
  if(!f)return {id:'scope:none',answer:'Not in baseline data: no equipment tagged '+tag+'.'};
  const id='scope:'+f.funcloc;
  if(focus==='maintenance'){const items=db.prepare('SELECT descr,cycle_text,next_due FROM maint_item WHERE funcloc=? ORDER BY next_due LIMIT 6').all(f.funcloc),ns=db.prepare('SELECT notif_date,descr,priority,status FROM notification WHERE funcloc=? ORDER BY notif_date DESC LIMIT 3').all(f.funcloc);
   const answer='**'+f.tag+'** ('+f.descr+'): '+(items.length?'**'+items.length+' planned maintenance item'+(items.length>1?'s':'')+'**: '+items.slice(0,4).map(i=>i.descr+' ('+String(i.cycle_text).toLowerCase()+', next due '+i.next_due+')').join('; ')+'.':'no planned maintenance items in the data.')+(ns.length?' Latest notifications: '+ns.map(n=>n.notif_date+' '+n.descr+' ('+String(n.status).toLowerCase()+')').join('; ')+'.':' No notifications recorded.');
   return {id,equipment:f,planned:items,notifications:ns,answer}}
  const parts=partsFor(db,[f.funcloc]);
  const n=db.prepare('SELECT count(*) n FROM notification WHERE funcloc=?').get(f.funcloc).n,pm=db.prepare('SELECT count(*) n FROM maint_item WHERE funcloc=?').get(f.funcloc).n,iss=db.prepare('SELECT count(*) n,coalesce(sum(qty),0) q FROM movement WHERE funcloc=?').get(f.funcloc);
  let answer;
  if(parts.length)answer='**'+f.tag+'** ('+f.descr+', class '+f.eq_class+') has **'+parts.length+(parts.length>=6?'+':'')+' installed spare parts** in its bill of materials. Top by issue history: '+parts.slice(0,3).map(partLine).join('; ')+'. It has '+n+' notifications, '+pm+' planned maintenance items and '+iss.n+' recorded issues.';
  else{const peers=db.prepare("SELECT funcloc FROM funcloc WHERE eq_class=? AND has_bom=1 AND funcloc<>? ORDER BY tag LIMIT 40").all(f.eq_class,f.funcloc).map(x=>x.funcloc);const pp=partsFor(db,peers,4);
   answer='**'+f.tag+'** ('+f.descr+') has **no bill of materials** in the data, so no spare part is linked to it. Its activity: '+n+' notifications, '+pm+' planned items, '+iss.n+' recorded issues. '+(pp.length?'Parts used on other '+f.eq_class+' equipment that do have a BoM, for reference: '+pp.slice(0,3).map(partLine).join('; ')+'. These are class-level analogues, not a confirmed fit.':'No comparable equipment with a BoM was found.')+' Add its BoM through the Documents and log page to enable forecasting.';
   return {id,equipment:f,parts:[],analogues:pp,counts:{notifications:n,planned:pm,issues:iss.n},answer,empty:true}}
  return {id,equipment:f,parts,counts:{notifications:n,planned:pm,issues:iss.n},answer}}
 const ws=r.words;let locs=[],label;
 if(classes.length&&!ws.length){const ci=classInfo(db,classes[0]);if(!ci)return {id:'scope:none',answer:'Not in baseline data: class '+classes[0]+'.'};
  const ids=db.prepare('SELECT funcloc FROM funcloc WHERE eq_class=? AND has_bom=1').all(classes[0]).map(x=>x.funcloc);const tot=db.prepare('SELECT count(DISTINCT b.material_no) parts,coalesce(sum(m.stock*m.last_unit_price_idr),0) val FROM bom b JOIN material m USING(material_no) JOIN funcloc f USING(funcloc) WHERE f.eq_class=?').get(classes[0]);
  const top=db.prepare(`SELECT m.material_no,m.descr,m.stock,m.unit,p.n_issues issues,p.crit_max crit,count(DISTINCT b.funcloc) locs FROM bom b JOIN funcloc f USING(funcloc) JOIN material m USING(material_no) LEFT JOIN part_profile p USING(material_no) WHERE f.eq_class=? GROUP BY m.material_no ORDER BY coalesce(p.n_issues,0) DESC,locs DESC LIMIT 5`).all(classes[0]);
  const answer='**'+ci.eq_class_name+'** (class '+ci.eq_class+'): **'+fmt(ci.n)+' locations**, of which **'+fmt(ci.with_bom)+'** have a bill of materials, using **'+fmt(tot.parts)+' distinct spare parts** with stock worth **'+bn(tot.val)+'** (Estimate, last PO price). Most used: '+top.slice(0,3).map(partLine).join('; ')+'. Ask about a tag (for example '+(db.prepare('SELECT tag FROM funcloc WHERE eq_class=? AND has_bom=1 LIMIT 1').get(classes[0])||{}).tag+') for one unit.';
  return {id:'scope:class:'+ci.eq_class,class:ci,distinct_parts:tot.parts,stock_value_idr:Math.round(tot.val),top_parts:top,answer}}
 locs=locSearch(db,classes,ws,40);label=[...ws].join(' ');
 if(!locs.length){const fb=ws.length?locSearch(db,[],ws.slice(0,1),8):[];
  return {id:'scope:none',answer:'Not in baseline data: no equipment matches "'+(label||classes.join(' '))+'".'+(fb.length?' Closest by "'+ws[0]+'": '+fb.slice(0,5).map(l=>l.tag+' '+l.descr).join('; ')+'.':'')}}
 const withBom=locs.filter(l=>l.has_bom),parts=partsFor(db,withBom.map(l=>l.funcloc),5);
 const answer='**'+locs.length+(locs.length>=40?'+':'')+' equipment items** match "'+label+(classes.length?' ('+classes.join(', ')+')':'')+'": '+locs.slice(0,6).map(l=>l.tag+' '+l.descr+(l.has_bom?'':' [no BoM]')).join('; ')+'. **'+withBom.length+'** have a bill of materials'+(parts.length?'. Main spare parts: '+parts.slice(0,3).map(partLine).join('; ')+'.':'; none of them has a linked spare part in the data, so ask for the class (for example "'+(classes[0]||locs[0].eq_class)+' parts") for class-level analogues.');
 return {id:'scope:text:'+label.replace(/\s+/g,'_'),locations:locs.slice(0,12),top_parts:parts,answer}}
export function activityOnDate(db,{date}={}){if(!/^20\d\d-\d\d-\d\d$/.test(date||''))return {id:'activity:none',answer:'Please give a full date, for example 30 Sep 2026.'};
 const mv=db.prepare('SELECT count(*) n,coalesce(sum(qty),0) q,count(DISTINCT material_no) mats FROM movement WHERE posting_date=?').get(date);
 const nt=db.prepare('SELECT count(*) n,sum(priority=\'High\' OR priority=\'Very High\') hi FROM notification WHERE notif_date=?').get(date);
 const pr=db.prepare('SELECT count(*) n,count(DISTINCT po_no) pos FROM po_line WHERE pr_date=?').get(date);const dl=db.prepare('SELECT count(*) n FROM po_line WHERE po_delivery=?').get(date);
 const top=db.prepare('SELECT m.material_no,m.descr,sum(v.qty) q FROM movement v JOIN material m USING(material_no) WHERE v.posting_date=? GROUP BY 1 ORDER BY q DESC LIMIT 3').all(date);
 const locs=db.prepare('SELECT f.tag,f.descr,count(*) n FROM movement v JOIN funcloc f ON f.funcloc=v.funcloc WHERE v.posting_date=? GROUP BY 1,2 ORDER BY n DESC LIMIT 3').all(date);
 if(!mv.n&&!nt.n&&!pr.n&&!dl.n)return {id:'activity:'+date,answer:'No recorded activity on '+date+' (data runs 2025-05 to 2026-09).'};
 const answer='On **'+date+'**: **'+fmt(mv.n)+' material issues** ('+fmt(mv.mats)+' distinct materials), **'+nt.n+' notifications**'+(nt.hi?' ('+nt.hi+' high priority)':'')+', '+(pr.n?'**'+pr.n+' purchase requisition lines** raised'+(dl.n?' and ':''):'')+(dl.n?'**'+dl.n+' PO deliveries** due':'')+'.'+(top.length?' Largest issues: '+top.map(t=>'['+t.material_no+'] '+t.descr+' ('+fmt(t.q)+')').join('; ')+'.':'')+(locs.length?' Busiest equipment: '+locs.map(l=>l.tag+' '+l.descr).join('; ')+'.':'');
 return {id:'activity:'+date,date,issues:mv.n,notifications:nt.n,pr_lines:pr.n,po_deliveries:dl.n,top_materials:top,answer}}
export const SCOPE_TOOLS={find_entities:{text:{type:'string',maxLength:200}},describe_scope:{focus:{enum:['parts','maintenance']},cls:{type:'string',maxLength:12},text:{type:'string',maxLength:200},funcloc:{type:'string',maxLength:80}},activity_on_date:{date:{type:'string',maxLength:10}}};
export function runScope(db,name,a){return name==='find_entities'?findEntities(db,a):name==='describe_scope'?describeScope(db,a):activityOnDate(db,a)}
// Deterministic planner used in rules mode (and as the first call in Gemini mode).
export function scopeRoute(db,q,resolved={}){
 const r=resolveEntities(db,q);
 if(r.date&&/happen|activity|event|issue|notif|order|record|everything|what|how many/i.test(q))return ['activity_on_date',{date:r.date}];
 if(/\b(min|max|forecast|reorder|safety|lead time|recommend|cost|saving|scenario|what if)\b/i.test(q))return null;
 if(resolved.funcloc&&!resolved.material_no&&r.tag){if(/vibration|measure|inspect|notif|\bpm\b|maintenance|schedule|due|task|failure|breakdown/i.test(q))return ['describe_scope',{funcloc:resolved.funcloc,focus:'maintenance'}];if(q.trim().split(/\s+/).length<=6||/part|spare|bom|bill|install|use|have|fit/i.test(q))return ['describe_scope',{funcloc:resolved.funcloc,focus:'parts'}]}
 if(!r.tag&&!r.material_no&&(r.classes.length||r.words.length)&&q.trim().split(/\s+/).length<=8&&!/\b(zero|below|excess|slow|dead|obsolete|insurance|critical|campaign|turnaround|shutdown|procure|supplier|spend|stockout|overstock|budget|cash|health)\b/i.test(q))return ['describe_scope',{text:q.slice(0,200)}];
 return null}
