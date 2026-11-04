// Every economic default must equal spi/contracts/econ_assumptions.json (owner: Claude A). Run: node tests/spi_econ_consistency.js
const fs=require('fs'),assert=require('assert');let bad=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)bad++};
(async()=>{const E=JSON.parse(fs.readFileSync('spi/contracts/econ_assumptions.json','utf8')),v=k=>E[k].value;
 const {DEFAULT_POLICY}=await import('../spi/engine/policy.js');
 ok(DEFAULT_POLICY.holding_rate===v('carrying_rate'),'engine carrying rate '+DEFAULT_POLICY.holding_rate);
 ok(DEFAULT_POLICY.ordering_cost_idr===v('order_cost_idr'),'engine order cost '+DEFAULT_POLICY.ordering_cost_idr);
 for(const c of ['S','A','B','C']){ok(DEFAULT_POLICY.service_levels[c]===v('service')[c],'engine service '+c);ok(DEFAULT_POLICY.downtime_idr_day[c]===v('downtime_idr_day')[c],'engine downtime per day '+c)}
 const fin=JSON.parse(fs.readFileSync('finance/spi/inputs.json','utf8')).inputs;
 ok(fin.holding_economic_rate.value===v('carrying_rate'),'finance carrying rate');ok(fin.holding_cash_rate.value===v('cash_holding_rate'),'finance cash holding rate');ok(fin.emergency_premium.value===v('emergency_premium'),'finance emergency premium');
 for(const c of ['S','A','B','C'])ok(fin['cost_day_'+c].value===v('downtime_idr_day')[c],'finance downtime per day '+c);
 for(const f of fs.readdirSync('server/ws').filter(f=>f.endsWith('.mjs'))){const s=fs.readFileSync('server/ws/'+f,'utf8');ok(!/750000|emergency_premium: 0\.35|4200000|S: 0\.98, A: 0\.95/.test(s),'no hard-coded economic default in server/ws/'+f)}
 const z=fs.readFileSync('src/modules/spi_zone_ws.js','utf8');ok(/window\.SPI_ECON_DEF/.test(z),'browser assumptions come from the contract');
 if(fs.existsSync('dist/index.html')){const d=fs.readFileSync('dist/index.html','utf8'),m=d.match(/SPI_ECON_DEF=(\{.*?\});/);ok(m&&JSON.parse(m[1]).emergency_premium===v('emergency_premium')&&JSON.parse(m[1]).service.S===v('service').S,'built page carries the contract values')}
 console.log(bad?bad+' failed':'all economic defaults match the contract');process.exit(bad?1:0)})();
