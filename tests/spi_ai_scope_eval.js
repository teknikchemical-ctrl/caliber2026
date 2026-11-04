// Golden questions for the scope/date/class pipeline (rules mode, no network). Run: node tests/spi_ai_scope_eval.js
import {openDb} from '../server/_lib/db.mjs';
import {ask} from '../spi/ai/ask.js';
const db=openDb();let bad=0;
const cases=[
 ['Heat exchanger parts','describe_scope',/heat exchanger[\s\S]*459 locations[\s\S]*315/i,/enter a material number|specify a material/i],
 ['Fuel oil pump','describe_scope',/FUEL OIL PUMP/,/none found|Not in baseline/i],
 ['PP-952A gasoline pump','describe_scope',/no bill of materials[\s\S]*class-level analogues/i,/shown in the chart/],
 ['What everything happened at 30 Sept 2026','activity_on_date',/\*\*99 material issues\*\*[\s\S]*\*\*11 notifications\*\*[\s\S]*\*\*13 PO deliveries/,/Figures are Estimates/],
 ['What happened on 2026-09-30','activity_on_date',/99 material issues/],
 ['PP-1323B vibration measurement','describe_scope',/Vibration measurement \(monthly, next due 2026-10-01\)/,/chart/],
 ['compressor','describe_scope',/class KC/],
 ['What happened on 3 Jan 2020','activity_on_date',/No recorded activity/]];
for(const [q,tool,ok,no] of cases){const r=await ask({db,question:q});const t=r.trace.find(x=>x.step==='tool')?.name,fails=[];
 if(t!==tool)fails.push('tool '+t);if(!ok.test(r.answer))fails.push('missing pattern');if(no&&no.test(r.answer))fails.push('forbidden pattern');if(r.answer.length>1100)fails.push('too long '+r.answer.length);
 console.log((fails.length?'FAIL ':'ok   ')+q+(fails.length?' -> '+fails.join('; '):''));if(fails.length){bad++;console.log(r.answer)}}
console.log(bad?bad+' failed':'all passed');process.exit(bad?1:0);
