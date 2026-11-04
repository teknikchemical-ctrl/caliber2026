const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const {ask}=await import('../spi/ai/ask.js'),{openDb}=await import('../server/_lib/db.mjs'),{createTools}=await import('../spi/ai/tools.js'),{gemini}=await import('../spi/ai/providers/gemini.js');
 const db=openDb(),tools=createTools(db);
 const examples=JSON.parse(fs.readFileSync('cases/spi/case.json')).examples;
 const floating=vm.runInNewContext('('+fs.readFileSync('src/modules/spi_chat.js','utf8').match(/const SPIC_SUG=(\{.*\});/)[1]+')');
 const suite=[...examples.map(question=>({question,context:{}})),...Object.entries(floating).flatMap(([page,qs])=>Array.from(qs,question=>({question,context:{page,...(['spi_forecast','spi_calc'].includes(page)?{material_no:4100000129}:{})}})))];
 const expected={
 'Which critical spare parts are at risk of stockout?':'critical_risk',
 'Which parts are overstocked and by how much?':'excess',
 'What should we reorder first and how many?':'reorder',
 'Which parts are slow-moving or dead stock?':'slow_dead',
 'What are the Min and Max for a part?':'clarification',
 'What if we cut stock by 20%?':'simulate_scenario',
 "Why is this part's forecast shaped like this?":'run_forecast',
 'Should I reorder this part now?':'run_forecast',
 'What changes if the lead time doubles?':'simulate_scenario',
 'Is stock above Max?':'get_part_profile',
 'Which critical parts are at zero stock?':'critical_zero',
 'Which insurance spares are worth the most?':'insurance',
 'Where is the largest excess stock?':'excess',
 'Which B and C parts could be released?':'release',
 'Which critical parts are short for the campaign?':'campaign',
 'How is the dynamic policy different from the workbook?':'get_policy_validation',
 'What are the largest excess stock items?':'excess',
 'What is the lead time of the top reorder part?':'top_reorder_lead'};
 const adapter=gemini({key:'synthetic-scenario-test',model:'synthetic-model',fallbacks:[],fetcher:async(url,opt)=>{
  const b=JSON.parse(opt.body),source=JSON.parse(b.contents.find(c=>c.role==='user').parts[0].text),r=source.untrusted_tool_results[0];
  const answer=r.answer||(r.result?'Forecast for material '+r.result.material_no+'.':'Material '+r.material_no+'. Current Min '+r.min_qty+'; current Max '+r.max_qty+'. '+(r.stock>r.max_qty?'Stock is above current Max.':'Stock is not above current Max.'));
  return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:b.generationConfig.responseSchema?JSON.stringify({answer,citations:[r.id],inputs:[]}):'Use the supplied evidence.'}]}}]})};
 }});
 const report=[];
 for(const mode of ['mock','gemini'])for(const c of suite){
  const r=await ask({db,...c,...(mode==='gemini'?{adapter}:{})}),want=expected[c.question];assert(want,'New UI suggestion needs semantic coverage: '+c.question);
  assert(!r.answer.includes('Not in baseline data for this search'),c.question);
  const t=r.trace.find(t=>t.step==='tool');
  if(want==='clarification'){assert.equal(r.provider,'clarification');assert(!r.citations.length);assert(r.answer.includes('material number'))}
  else{assert.equal(t.name,want==='critical_risk'||['excess','reorder','slow_dead','critical_zero','insurance','release','campaign','top_reorder_lead'].includes(want)?'inventory_list':want);if(t.name==='inventory_list')assert.equal(t.args.kind,want);assert(r.citations.length);}
  if(c.question.includes('20%')){assert.equal(t.args.stock_multiplier,.8);assert.equal(r.tool_results[0].data.baseline.parts,7481)}
  if(c.question.includes('doubles')){assert.equal(t.args.lead_time_multiplier,2);assert.equal(t.args.scope.material_no,4100000129);assert(r.answer.includes('lead time multiplier: 2'))}
  if(want==='get_part_profile'){assert(r.answer.includes('Min 60'));assert(r.answer.includes('Max 115'));assert(r.answer.includes('above current Max'))}
  report.push({mode,...c,tool:t?.name,kind:t?.args.kind,provider:r.provider,citations:r.citations,answer:r.answer});
 }
 const zero=await tools.run('inventory_list',{kind:'critical_zero'});
 assert.equal(zero.total,db.prepare("select count(*) n from part_profile p join material m using(material_no) where m.mrp_type='Stock Item' and p.stock=0 and p.crit_max in ('S','A') and p.months_active>=2").get().n);
 assert.equal(zero.total,53);assert(zero.rows.every(r=>r.stock===0&&['S','A'].includes(r.crit_max)));
 const excess=await tools.run('inventory_list',{kind:'excess'});assert.equal(excess.total,db.prepare('select count(*) n from part_profile where max_qty>0 and stock>max_qty').get().n);assert(excess.rows.every(r=>r.excess_qty===r.stock-r.max_qty));
 const release=await tools.run('inventory_list',{kind:'release'});assert(release.rows.every(r=>!['S','A'].includes(r.crit_max)&&!r.insurance_spare));
 const {selected,evaluate}=await import('../spi/engine/optimise.js');
 const reorder=await tools.run('inventory_list',{kind:'reorder'});const all=selected(db).map(p=>evaluate(db,p));assert.equal(reorder.total,all.filter(r=>r.action==='REORDER').length);for(const r of reorder.rows)assert.equal(r.order_qty,all.find(x=>x.material_no===r.material_no).order_qty);
 const campaign=await tools.run('inventory_list',{kind:'campaign'});const handler=(await import('../server/data/campaign-readiness.mjs')).default;
 const reference=await new Promise(resolve=>handler({url:'/?limit=10'},{setHeader(){},end:s=>resolve(JSON.parse(s))}));assert.equal(campaign.total,reference.parts_at_risk);assert.deepEqual(campaign.rows.map(r=>[r.material_no,r.gap_qty]),reference.rows.map(r=>[r.material_no,r.gap_qty]));
 const tags=JSON.parse(fs.readFileSync('cases/spi/kb.json')).sets.map(s=>s.tag);
 for(const equipment of tags)for(const kind of ['critical_zero','critical_risk','excess','slow_dead','insurance','release','reorder','campaign']){
  const result=await tools.run('inventory_list',{kind,equipment});const ids=new Set(selected(db,{equipment}).map(p=>p.material_no));assert(result.rows.every(r=>ids.has(r.material_no)));assert(result.answer.includes(equipment));
 }
 for(const equipment of tags)for(const question of examples){const r=await ask({db,question,context:{funcloc:equipment}});if(question.includes('Min and Max'))assert.equal(r.provider,'clarification');else{const t=r.trace.find(t=>t.step==='tool');assert(t);assert.equal(t.name==='simulate_scenario'?t.args.scope.equipment:t.args.equipment,equipment);assert(r.answer.includes(equipment));}}
 const priorMaterial=await ask({db,question:'Which critical parts are at zero stock?',history:[{role:'user',text:'Describe material 4100000129'}],context:{page:'spi_ask',material_no:4100000129}});assert.equal(priorMaterial.tool_results[0].total,53);
 const help=await ask({db,question:examples[4],context:{funcloc:tags[0]}});assert.equal(help.provider,'clarification');
 const parameters=await ask({db,question:examples[4],context:{material_no:4100000129}});assert(parameters.answer.includes('60')&&parameters.answer.includes('115'));
 const stale=await ask({db,question:'Which critical parts are at zero stock?',context:{page:'spi_reg',material_no:4100000129}});assert.equal(stale.tool_results[0].total,53);
 fs.mkdirSync('.git/caliber-local',{recursive:true});fs.writeFileSync('.git/caliber-local/scenario-audit-verified.json',JSON.stringify(report,null,2));
 console.log('PASS: all '+suite.length+' shipped UI suggestions in mock and strict fake Gemini; independent SQL/engine/campaign reconciliation; inventory lists scoped to all '+tags.length+' equipment sets; Min/Max clarification and stale page selectors.');
})().catch(e=>{console.error(e);process.exitCode=1});
