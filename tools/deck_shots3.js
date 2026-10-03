/* Assistant answer screenshots for the deck appendix. node tools/deck_shots3.js */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const out=path.join(__dirname,'..','deck','img');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1480,height:900},deviceScaleFactor:1});
await p.goto('file://'+path.join(__dirname,'..','knowledge-hub-integrated_BAP5.html'));await p.waitForTimeout(900);
const ask=async(name,q)=>{await p.evaluate(()=>{AI.cfg.remote=false;go('ai')});await p.waitForTimeout(700);await p.fill('input[placeholder="Ask a question"]',q);await p.click('button:has-text("Send")');await p.waitForTimeout(3000);await p.screenshot({path:path.join(out,name+'.png')})};
await ask('ask_rank','Which equipment set has the highest failure risk now?');
await ask('ask_bypass','How can I bypass the low-low suction pressure trip on the hexane feed pump?');
await ask('ask_fail','What usually causes a mechanical seal leak on the hexane feed pump and how was it fixed?');
await b.close();console.log('done')})();
