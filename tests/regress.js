/* Regression suite: loads the built single file in a headless browser and checks pages, data layer, knowledge workflow,
   reports, provider contract and the answer audit. Run with: npm test (needs playwright and a Chromium build). */
const path=require("path"),{chromium}=require("playwright");
const FILE="file://"+path.resolve(__dirname,"..","knowledge-hub-integrated_BAP5.html");
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log("FAIL",m)}else console.log("ok  ",m)};
(async()=>{const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
 const p=await b.newPage({viewport:{width:1500,height:1000}}),errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("dialog",d=>d.accept("test"));
 await p.goto(FILE);await p.waitForTimeout(900);
 const ev=async c=>{try{const r=await p.evaluate(c);await p.waitForTimeout(120);return r}catch(e){errs.push("EVAL "+c.slice(0,60)+" "+e.message.slice(0,100))}};
 /* pages */
 for(const pg of ["dashboard","equipment","plot","mnt","il","ai","ks","fm","rc","cov","int","documents","opl","quality"])await ev(`go('${pg}')`);
 for(let n=1;n<=8;n++)for(const t of ["overview","a360","pid","ga","plot","docs","ds","seq","opl","maint","rel"])await ev(`go('equipment',{set:${n},tab:'${t}'})`);
 for(const v of ["dash","table","time","pdm","replay"])await ev(`MHS.view='${v}';go('mnt')`);
 ok(errs.length===0,"all pages render without script errors ("+errs.length+" errors)");errs.splice(0).forEach(e=>console.log("   ",e));
 /* data layer */
 const st=await ev("DB.stats()");ok(st.n>1000&&st.terms>2000,"index holds "+st.n+" chunks and "+st.terms+" terms");
 ok((await ev("DB.search('start permissive KC-4501',{k:1})[0].id"))!=null,"retrieval returns a hit for a tag query");
 ok((await ev("DB.search('football match yesterday',{k:3}).filter(c=>c.cov>=.34).length"))===0,"off-topic query has no covering chunk");
 /* knowledge workflow */
 await ev("ROLE.name='Engineer';ROLE.user='Tester';const a=UKB.add({type:'tacit',title:'Regression item',text:'Symptom: seal weeping at GA-1201A. Cause: plugged orifice RO-1201. Action: clean orifice.',set:1,meta:{symptom:'seal weeping',cause:'plugged orifice',action:'clean orifice'}});UKB.setStatus(a.id,'In review');ROLE.user='Reviewer';UKB.setStatus(a.id,'Approved')");
 ok((await ev("DB.search('seal weeping GA-1201A plugged orifice',{k:3}).some(c=>c.k==='uk'&&c.status==='Approved')"))===true,"approved user knowledge is indexed and retrievable");
 ok((await ev("fmCases('seal weeping at GA-1201A',{set:1}).cases.some(c=>c.k==='uk')"))===true,"user knowledge appears in failure memory");
 ok((await ev("STORE.mem.audit.length"))>=3,"audit trail records workflow events");
 /* reports and exports */
 for(const k of ["dossier","reliability","pdm","incident","quality","summary"]){const n=await ev(`(()=>{rcOpen('${k}',{set:2,wo:'WO-240002'});const l=RC.cur.html.length;rcClose();return l})()`);ok(n>20000,"report "+k+" builds ("+n+" bytes)")}
 for(const k of ["workorders","instruments","documents","interlocks","predictive","knowledge","chunks","feedback"])await ev(`rcExport('${k}','csv');rcExport('${k}','json')`);
 ok(errs.length===0,"exports run without errors");errs.splice(0).forEach(e=>console.log("   ",e));
 /* provider contract */
 const pv=await ev("(async()=>{AI.cfg.mock=true;const r=await aiAsk('start permissive KC-4501',{ctx:{},scope:0,history:[]});AI.cfg.mock=false;return {via:r.via,v:aiValidate({answer:'x'}).length,conf:r.conf}})()");
 ok(pv&&pv.via==="remote"&&pv.v===0,"mock provider round trip passes contract validation");
 ok((await ev("aiValidate({answer:5}).length"))>0,"contract validation rejects a malformed response");
 /* answer audit */
 await ev("covRun()");await p.waitForFunction("!COV.running",{timeout:180000});const S=await ev("COV.summary");
 ok(S.posOk/S.pos>=.95,"answer audit correct "+S.posOk+" of "+S.pos);ok(S.cited/S.pos>=.95,"answer audit cited "+S.cited+" of "+S.pos);ok(S.refuse===S.neg,"out-of-scope questions refused "+S.refuse+" of "+S.neg);
 ok(errs.length===0,"audit ran without errors");errs.splice(0).forEach(e=>console.log("   ",e));
 await b.close();console.log(fails?"\n"+fails+" check(s) failed":"\nAll checks passed");process.exit(fails?1:0)})();
