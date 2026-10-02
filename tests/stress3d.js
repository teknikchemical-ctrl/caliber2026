/* Random drag, click, wheel and button use on every 3D equipment model; fails on script errors or broken geometry. */
const path=require("path"),{chromium}=require("playwright");
(async()=>{const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});const p=await b.newPage({viewport:{width:1300,height:900}});const errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()==="error")errs.push("console "+m.text())});
await p.goto("file://"+path.resolve(__dirname,"..","dist","index.html"),{waitUntil:"commit"});await p.waitForFunction(()=>typeof g3Mode==="function"&&AUTH.user,null,{timeout:60000});
let bad=0;
for(let n=1;n<=8;n++){await p.evaluate(n=>{go("equipment",{set:n,tab:"ga"});g3Mode("3d")},n);await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const b=document.querySelector(".gfig .g3box").getBoundingClientRect();return{x:b.x,y:b.y+60,w:b.width,h:b.height-100}});
 for(let i=0;i<14;i++){const x=r.x+30+Math.random()*(r.w-60),y=r.y+20+Math.random()*(r.h-60);
  const a=Math.random();
  if(a<.4){await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+(Math.random()-.5)*300,y+(Math.random()-.5)*200,{steps:4});await p.mouse.up()}
  else if(a<.7){await p.mouse.click(x,y)}
  else if(a<.8){await p.mouse.move(x,y);await p.mouse.wheel(0,(Math.random()-.5)*600)}
  else if(a<.9){await p.evaluate(()=>{const bs=[...document.querySelectorAll(".gfig .g3bar button")];bs[Math.floor(Math.random()*bs.length)].click()})}
  else{await p.mouse.move(x,y);await p.keyboard.down("Shift");await p.mouse.down();await p.mouse.move(x+80,y+40,{steps:3});await p.mouse.up();await p.keyboard.up("Shift")}
 }
 await p.waitForTimeout(300);
 const chk=await p.evaluate(()=>{const svg=document.querySelector(".gfig .g3svg");const pts=[...svg.querySelectorAll("polygon")].slice(0,4000).filter(x=>/NaN|Infinity/.test(x.getAttribute("points")||"")).length;return{pts,polys:svg.querySelectorAll("polygon").length,inst:Object.keys(G3.inst).length,boxes:document.querySelectorAll(".g3box").length}});
 if(chk.pts)bad++;console.log(n,JSON.stringify(chk))}
console.log("bad",bad,"errors",errs.slice(0,6));await b.close();process.exit(bad||errs.length?1:0)})()
