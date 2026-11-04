// Every tab of the site shows the AI reasoning box (owner: Claude A). Run after build: node tests/spi_ai_boxes.js
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{const port=8891,server=spawn('node',['tools/spi_dev.mjs',String(port),'full'],{stdio:'ignore',env:{...process.env,AI_PROVIDER:'mock'}});let b;const errs=[];try{
for(let i=0;i<120;i++){try{if((await fetch(`http://localhost:${port}/api/data/health`)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
b=await chromium.launch({executablePath:process.env.CHROMIUM});const p=await b.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://localhost:${port}/`);await p.waitForFunction(()=>typeof SPI_HUBS!=='undefined'&&typeof SPI!=='undefined');await p.waitForTimeout(2000);
const tabs=await p.evaluate(()=>SPI_HUBS.flatMap(h=>h.tabs.filter(t=>SPI.pages[t[0]]).map(t=>[h.id,t[0],t[1]])));const out=[];
for(const [h,t,l] of tabs){await p.evaluate(([h,t])=>{SPIHUB.tab[h]=t;st.page=h;render()},[h,t]);await p.waitForTimeout(3500);const r=await p.evaluate(()=>{const b=document.querySelector('#spihb .spi-aibox');return b?b.innerText.slice(0,90).replace(/\n/g,' '):null});out.push((r?'BOX ':'---  ')+l+(r?' | '+r:''))}
const miss=out.filter(x=>x.startsWith('---')&&!/Ask the AI/.test(x));console.log(out.join('\n'));console.log(miss.length?miss.length+' tabs without an AI box':'every tab has an AI box','errors',errs.length);if(miss.length||errs.length)process.exitCode=1}finally{if(b)await b.close();server.kill()}})();
