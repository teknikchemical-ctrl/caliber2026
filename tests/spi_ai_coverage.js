// Every tab of the built app must be answerable by the assistant (owner: Claude A). Fails when a new tab has no
// summary in spi/ai/pages.js, or when the answer is empty, raw or too long. Run after build: node tests/spi_ai_coverage.js
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});let bad=0;try{
 const p=await b.newPage();await p.goto('file://'+path.resolve(__dirname,'..','dist','index.html'),{waitUntil:'commit'});await p.waitForFunction(()=>typeof SPI_HUBS!=='undefined'&&typeof SPI!=='undefined',null,{timeout:30000});await p.waitForTimeout(800);
 const tabs=await p.evaluate(()=>SPI_HUBS.flatMap(h=>h.tabs.map(t=>[t[0],t[1]])));await b.close();
 const {openDb}=await import('../server/_lib/db.mjs'),{ask}=await import('../spi/ai/ask.js'),{PAGES}=await import('../spi/ai/pages.js');const db=openDb();
 for(const [id,label] of tabs){const f=[];if(!PAGES[id])f.push('no summary in PAGES');const r=await ask({db,question:'Explain this view: '+label+'. What matters?',context:{page:id}});const a=r.answer.replace(/\s*\[[a-z_]+:[^\]]*\]/g,'');
  if(a.length<40)f.push('answer too short');if(a.length>900)f.push('answer too long');if(/(?<![\d.,\[])\d{8,}(?![\d.,\]])/.test(a.replace(/\b(4[0-3]\d{8}|10\d{10}|20\d{10}|92\d{10})\b/g,'')))f.push('raw long number');if(/\b[a-z]+_[a-z_]+\b|undefined|NaN/.test(a))f.push('code or undefined in text');if(/could not be read|not known/.test(a))f.push('read failed: '+a.slice(0,80));
  console.log((f.length?'FAIL ':'ok   ')+label+(f.length?' -> '+f.join('; '):''));if(f.length)bad++}
}finally{try{await b.close()}catch{}}console.log(bad?bad+' tabs fail':'every tab is answerable');process.exit(bad?1:0)})().catch(e=>{console.error(e);process.exit(1)});
