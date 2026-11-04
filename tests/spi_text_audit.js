// Visible text audit of every tab (owner: Claude A). Flags dashes, raw long numbers, snake_case codes, placeholders,
// undefined/NaN/null, JSON, and tables showing more than 5 rows. Run: node tests/spi_text_audit.js [--strict]
const {spawn}=require('node:child_process'),{chromium}=require('playwright'),fs=require('fs');
(async()=>{const port=8873,server=spawn('node',['tools/spi_dev.mjs',String(port),'full'],{stdio:'ignore',env:{...process.env,AI_PROVIDER:'mock'}});let b,bad=0;const report=[];try{
for(let i=0;i<120;i++){try{if((await fetch(`http://localhost:${port}/api/data/health`)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});const p=await b.newPage({viewport:{width:1440,height:1000}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://localhost:${port}/`);await p.waitForFunction(()=>typeof SPI_HUBS!=='undefined'&&typeof SPI!=='undefined',null,{timeout:30000});await p.waitForTimeout(1500);
const tabs=await p.evaluate(()=>SPI_HUBS.flatMap(h=>h.tabs.filter(t=>SPI.pages[t[0]]).map(t=>[h.id,t[0],t[1]])));
const RULES=[['dash',/[–—]/],['raw long number',/(?<![\d.,A-Z#-])\d{7,}(?![\d.,])/],['snake_case code',/\b[a-z]+_[a-z_]+\b/],['placeholder',/\b(TODO|lorem|placeholder|FIXME|xxx)\b/i],['undefined/NaN/null',/\b(undefined|NaN|null|\[object Object\]|Infinity)\b/],['JSON',/[{\[]\s*"[a-z_]+"\s*:/],['word percent',/\d\s*percent\b/i],['emoji',/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u]];
for(const [hub,tab,label] of tabs){await p.evaluate(([h,t])=>{SPIHUB.tab[h]=t;st.page=h;render()},[hub,tab]);await p.waitForTimeout(tab==='spi_space'||tab==='spi_eq'?3500:2500);
 const r=await p.evaluate(()=>{const host=document.getElementById('spihb')||document.querySelector('main')||document.body;const vis=e=>!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length);const rows=[...host.querySelectorAll('table')].filter(vis).map(t=>[...t.querySelectorAll('tbody tr')].filter(vis).length);return {text:host.innerText,rows:Math.max(0,...rows)}});
 const hits=[];for(const [name,re] of RULES){const lines=r.text.split('\n').filter(l=>re.test(l)&&!/^\s*(Material|Part|Notification|Order|PO|PR)?\s*\d{10,12}\b/.test(l)&&!/\b4[0-3]\d{8}\b|\b10\d{10}\b|\b20\d{10}\b|\b92\d{10}\b|\b(43|12)\d{8}\b/.test(l.match(re)?.[0]||''));if(lines.length)hits.push(name+': '+lines.slice(0,2).map(l=>l.trim().slice(0,110)).join(' || '))}
 if(r.rows>5)hits.push('table shows '+r.rows+' rows');if(hits.length){bad++;report.push('['+label+'] '+hits.join(' ## '))}}
console.log(report.join('\n')||'clean');console.log(tabs.length+' tabs checked, '+bad+' with findings; page errors: '+errs.length);if(errs.length)console.log(errs.slice(0,3));
}finally{if(b)await b.close();server.kill()}if(process.argv.includes('--strict')&&bad)process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
