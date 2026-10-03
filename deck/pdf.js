/* Prints deck/render/deck.html to a PDF, one 1280x720 page per slide. node deck/pdf.js out.pdf */
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.goto('file://'+path.join(__dirname,'render','deck.html'));await p.waitForTimeout(500);
await p.addStyleTag({content:'@page{size:1280px 720px;margin:0}html,body{background:#fff!important}.slide{margin:0!important;break-after:page;page-break-after:always}'});
await p.pdf({path:process.argv[2],width:'1280px',height:'720px',printBackground:true,preferCSSPageSize:true});await b.close();console.log('pdf done')})();
