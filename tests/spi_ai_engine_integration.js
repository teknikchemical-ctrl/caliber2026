// Run against the real engine on main, or an explicitly supplied published candidate archive.
const assert=require('node:assert/strict'),Database=require('better-sqlite3');
(async()=>{const {executePlan,loadEngine}=await import('../spi/ai/execute.js');const engine=process.env.SPI_TEST_ENGINE?await import(process.env.SPI_TEST_ENGINE):await loadEngine(),db=new Database(process.env.SPI_DB||'spi/fixtures/mini.sqlite',{readonly:true});let n=0;try{
 for(const row of db.prepare(process.env.SPI_SAMPLE_CLASSES?'SELECT MIN(material_no) material_no,demand_class FROM part_profile GROUP BY demand_class ORDER BY demand_class':'SELECT material_no,demand_class FROM part_profile ORDER BY material_no').all()){
 const response=await executePlan({db,material_no:row.material_no,engine});assert.equal(response.status,'ready');assert.equal(response.provider,'mock');assert.equal(response.result.material_no,row.material_no);assert.equal(response.result.forecast.length,response.plan.horizon_months);assert(response.result.provenance.engine_version);assert(response.trace.some(t=>t.step==='engine'));for(const f of response.result.forecast)assert(f.p10>=0&&f.p10<=f.p50&&f.p50<=f.p90);n++;
 }
 console.log('All '+n+' actual SQLite -> reasoning -> real engine integration cases passed ('+(process.env.SPI_TEST_ENGINE||'main engine')+')');
 }finally{db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
