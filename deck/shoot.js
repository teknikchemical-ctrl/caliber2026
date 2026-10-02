const {chromium}=require("playwright"),path=require("path");
(async()=>{const [,, html, out, n]=process.argv;const b=await chromium.launch({executablePath:process.env.CHROMIUM||"/opt/pw-browsers/chromium"});const pg=await b.newPage({viewport:{width:1280,height:720}});
await pg.goto("file://"+html);await pg.waitForTimeout(600);let bad=0;
for(let i=1;i<=+n;i++){const el=await pg.$("#s"+i);await el.screenshot({path:path.join(out,"s"+String(i).padStart(2,"0")+".png")});
 const r=await pg.evaluate((i)=>{const s=document.getElementById("s"+i),r=[];s.querySelectorAll(".tf").forEach(t=>{const inn=t.firstChild;if(inn.scrollHeight>t.clientHeight+3)r.push(["H",Math.round(inn.scrollHeight-t.clientHeight),inn.innerText.slice(0,50)])});s.querySelectorAll("td").forEach(t=>{if(t.scrollHeight>t.clientHeight+3)r.push(["CELL",t.scrollHeight-t.clientHeight,t.innerText.slice(0,40)])});return r},i);
 r.forEach(x=>{bad++;console.log("overflow slide",i,JSON.stringify(x))})}
console.log("rendered",n,"slides;",bad,"overflows");await b.close()})();
