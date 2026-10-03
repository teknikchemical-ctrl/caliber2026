const APPURL='file://'+require('path').join(__dirname,'..','knowledge-hub-integrated_BAP5.html');
const ask=q=>[{sel:'input[placeholder="Ask a question"]'},{type:q},'^Send$',{js:()=>{},wait:3600}];
module.exports=S=>{
// ================= Part 2 getting started
S('p2_layout',{js:()=>go('dashboard'),sel:'viewport',wait:2800,calls:[[1,'^Operate$',178,-6],[2,'Search the knowledge base',-34,0],[3,'^Knowledge$',178,-6],[4,'^Admin$',178,-6],[5,'^Needs attention$',-34,-4],[6,'^Plant in 3D$',-30,0]]});
S('p2_search',{js:()=>go('mywork'),steps:[{key:'Control+k'},{type:'seal flush'}],sel:'#gsmodal > *',vh:1100,wait:600,wait2:1000});
S('p2_settings',{js:()=>go('mywork'),steps:[{js:()=>document.querySelector('[aria-label="Settings"]').click()}],sel:'#setbg > *',vh:1500,wait:600,wait2:900});
S('p2_notif',{js:()=>go('mywork'),steps:[{js:()=>document.querySelector('[aria-label="Notifications"]').click()}],sel:'#notifbox',wait:600,wait2:800});
S('p2_tour',{js:()=>go('dashboard'),steps:[{js:()=>document.querySelector('[aria-label="Guided tour"]').click()}],rect:{x:640,y:380,width:800,height:520},wait:600,wait2:900});
// ================= Part 3 daily operations
S('p3_dash',{js:()=>go('dashboard'),sel:'#app',maxH:900,wait:2800,calls:[[1,'latched trips'],[2,'^Overview$'],[3,'Slow turn',0,-6],[4,'^GA-1201A$'],[5,'^Whole plant$']]});
S('p3_dash_sel',{js:()=>go('dashboard'),steps:[{js:()=>{}},'^KC-4501$'],sel:'#app',maxH:900,wait:2500,wait2:2500});
S('p3_dash_an',{js:()=>go('dashboard'),steps:['^Analytics$'],sel:'#app',maxH:1400,wait:1500,wait2:1000});
S('p3_mywork',{js:()=>{AI.cfg.remote=false;go('ai')},steps:[...ask('What is the MTBF of each equipment set?'),{js:()=>go('mywork'),wait:1200}],sel:'#app',maxH:900,wait:900,calls:[[1,'Waiting for my approval'],[2,'Items I wrote'],[3,'My recent questions'],[4,'My recent activity']]});
S('p3_eqlist',{js:()=>go('equipment'),sel:'#app',maxH:1100,wait:1800});
for(const [id,tab,extra] of [['overview','overview'],['pid','pid'],['ga','ga'],['perf','perf'],['plot','plot'],['ready','ready'],['docs','docs'],['ds','ds'],['seq','seq'],['opl','opl'],['maint','maint'],['rel','rel']]){
 S('p3_eq_'+id,{arg:tab,js:(tab)=>{G3.mode='2d';go('equipment',{set:4,tab:tab})},sel:'#app',from:'.eqtabs',maxH:1100,wait:2200});}
S('p3_eq_tabs',{js:()=>go('equipment',{set:4,tab:'overview'}),sel:'#app',maxH:330,wait:1800,calls:[[1,'^Start-up: ',0,4],[2,'^Ask the assistant',0,-8],[3,'^Overview$',0,-12],[4,'^Related assets',0,-12]]});
S('p3_ga2d',{js:()=>{G3.mode='2d';go('equipment',{set:1,tab:'ga'})},steps:['^Mechanical seal'],sel:'#app',from:'.eqtabs',maxH:1100,wait:1800,wait2:700,calls:[[1,'^2D drawing$'],[2,'^Component details$']]});
S('p3_ga3d',{js:()=>{G3.mode='3d';go('equipment',{set:1,tab:'ga'})},steps:[{canvas:{x:.5,y:.55}}],sel:'#app',from:'.eqtabs',maxH:1100,wait:2500,wait2:900});
S('p3_ga3d2',{js:()=>{G3.mode='3d';go('equipment',{set:2,tab:'ga'})},steps:[{canvas:{x:.5,y:.5}}],sel:'#app',from:'.eqtabs',maxH:1100,wait:2500,wait2:900});
S('p3_pid',{js:()=>go('equipment',{set:4,tab:'pid'}),sel:'#app',from:'.eqtabs',maxH:1100,wait:2000});
S('p3_pid_valve',{js:()=>{go('equipment',{set:4,tab:'pid'});setTimeout(()=>{const i=D[4].n.findIndex(n=>/^XV-4501/.test(n[0]));vSet(i,'closed')},1500)},sel:'#app',from:'.eqtabs',maxH:1100,wait:3200});
S('p3_il',{js:()=>go('il'),sel:'#app',maxH:1250,wait:1800});
S('p3_il_open',{js:()=>go('il'),steps:['^HEXANE FEED PUMP'],sel:'#app',maxH:1250,wait:1800,wait2:1500});
S('p3_il_test',{js:()=>go('il'),steps:['^HEXANE FEED PUMP','^Function test'],sel:'#app',maxH:1250,wait:1800,wait2:1800});
S('p3_ready',{js:()=>{P.set=1;LIVE.f[FK('PSLL-1201')]=true;go('equipment',{set:1,tab:'ready'})},sel:'#app',from:'.eqtabs',maxH:1100,wait:2000});
S('p3_ready_go',{js:()=>{go('equipment',{set:6,tab:'ready'})},sel:'#app',from:'.eqtabs',maxH:1100,wait:2000});
S('p3_docs',{js:()=>go('documents'),sel:'#app',maxH:1250,wait:1500,calls:[[1,'Documents by type'],[2,'Approval status'],[3,'Documents by equipment']]});
S('p3_docs_open',{js:()=>{go('documents')},steps:[{js:()=>{const e=document.querySelector('#app table tr[onclick], #app [onclick^="openDoc"], #app tr[onclick^="go"]');e&&e.click()}}],sel:'#app',maxH:1250,wait:1500,wait2:1000});
// ================= Part 4 maintenance and reliability
S('p4_dash',{js:()=>{MHS.set=0;MHS.view='dash';go('mnt')},sel:'#app',maxH:1300,wait:2200,calls:[[1,'^All equipment$'],[2,'^Overview$'],[3,'^Reliability report$'],[4,'^Generate records$']]});
S('p4_table',{js:()=>{MHS.set=0;MHS.view='table';go('mnt')},sel:'#app',from:'.tabs',maxH:1300,wait:2200});
S('p4_wo',{vh:1500,js:()=>{MHS.set=0;MHS.view='table';go('mnt');setTimeout(()=>mhOpen('WO-240002','report'),900)},sel:'viewport',wait:3000});
S('p4_wo_fail',{vh:1500,js:()=>{MHS.set=0;MHS.view='table';go('mnt');setTimeout(()=>{const r=MH.filter(x=>x.bd==='Yes')[3];mhOpen(r.wo,'live')},900)},sel:'viewport',wait:3500,wait2:1500});
S('p4_time',{js:()=>{MHS.set=0;MHS.view='time';go('mnt')},sel:'#app',from:'.tabs',maxH:1300,wait:2200});
S('p4_pdm',{js:()=>{MHS.set=0;MHS.view='pdm';go('mnt')},steps:['^Failure modes$'],sel:'#app',from:'.tabs',maxH:1500,wait:2600});
S('p4_pdm_next',{js:()=>{MHS.set=0;MHS.view='pdm';go('mnt')},steps:['^Next 90 days by mode$'],sel:'#app',from:'.tabs',maxH:1700,wait:2600});
S('p4_rel',{js:()=>{MHS.set=0;MHS.view='pdm';go('mnt')},steps:['^Reliability measures$'],sel:'#app',from:'.tabs',maxH:1700,wait:2400});
S('p4_replay',{js:()=>{SIM3.mode='3d';MHS.set=0;MHS.view='replay';go('mnt')},steps:[{js:()=>{const r=MH.filter(x=>x.bd==='Yes')[5];mhRpSeek(r.t1+36e5);mhRpUpd(true)}}],sel:'#app',from:'.tabs',maxH:1700,wait:2600,wait2:2500});
S('p4_replay2',{js:()=>{SIM3.mode='3d';MHS.set=0;MHS.view='replay';go('mnt')},steps:[{js:()=>{const r=MH.filter(x=>x.bd==='Yes')[9];mhRpSeek(r.t1+36e5);mhRpUpd(true);document.getElementById('p3')&&document.getElementById('p3').scrollIntoView()}}],sel:'#p3',wait:2600,wait2:3000});
S('p4_plan',{js:()=>{SIM3.mode='pid';MHS.set=0;MHS.view='plan';go('mnt');setTimeout(()=>spExample&&spExample(),900)},sel:'#app',from:'.tabs',maxH:1700,wait:3000});
S('p4_fm',{js:()=>{FM.q='mechanical seal leak on the hexane feed pump';FM.set=0;go('fm')},steps:['Find similar failures'],sel:'#app',maxH:1600,wait:1500,wait2:1300});
S('p4_perf',{js:()=>go('perf'),sel:'#app',maxH:1300,wait:2000});
S('p4_perf_kn',{js:()=>go('perf'),steps:['^Knowledge$'],sel:'#app',from:'.tabs',maxH:1300,wait:1500,wait2:1000});
S('p4_perf_sp',{js:()=>go('perf'),steps:['^Spare parts$'],sel:'#app',from:'.tabs',maxH:1300,wait:1500,wait2:1000});
S('p4_perf_tg',{js:()=>go('perf'),steps:['^Targets and data feeds$'],sel:'#app',from:'.tabs',maxH:1300,wait:1500,wait2:1000});
// ================= Part 5 safety, lessons, scenarios
S('p5_opl',{js:()=>go('opl'),sel:'#app',maxH:1300,wait:2000});
S('p5_opl_sheet',{js:()=>go('opl',{opl:K.opl[0].no}),sel:'#app',maxH:1500,wait:2200});
S('p5_sim2d',{js:()=>{go('opl',{opl:K.opl[0].no,om:'sim',si:0});setTimeout(()=>{simSw('pid');oplRun()},600)},sel:'#app',maxH:1300,wait:3500,wait2:2500});
S('p5_sim3d',{js:()=>{go('opl',{opl:K.opl[0].no,om:'sim',si:0});setTimeout(()=>{simSw('3d');oplRun()},600)},sel:'#app',maxH:1300,wait:4000,wait2:1500});
S('p5_scn',{js:()=>go('scn'),sel:'#app',maxH:1500,wait:2200});
S('p5_scn_run',{js:()=>{go('scn');scnToPlant(4,'PSLL-4504','trip')},sel:'#app',maxH:1700,wait:3000,wait2:2500});
S('p5_scn_opl',{js:()=>go('scn'),steps:['OPL and maintenance scenario'],sel:'#app',maxH:1400,wait:1500,wait2:1500});
S('p5_scn_as',{js:()=>go('scn'),steps:['Assumptions register'],sel:'#app',maxH:1400,wait:1500,wait2:1000});
S('p5_plot',{js:()=>{PP.mode='explore';go('plot')},sel:'#app',maxH:1300,wait:2500});
S('p5_haz2d',{js:()=>{go('plot');PP.mode='hazard';HSE.view='2d';HSE.sc='cloud';HSE.t=50;hseCalc();render()},sel:'#app',maxH:1500,wait:2500});
S('p5_haz3d',{js:()=>{go('plot');PP.mode='hazard';HSE.view='3d';HSE.sc='cloud';HSE.t=40;HSE.ign=-1;hseCalc();render()},steps:[{js:()=>hse3Go('source')}],sel:'#app',maxH:1500,wait:2500,wait2:2200});
// ================= Part 6 knowledge and AI
S('p6_ai',{expand:true,js:()=>{AI.cfg.remote=false;go('ai')},steps:ask('What usually causes a mechanical seal leak on the hexane feed pump and how was it fixed?'),sel:'#app',maxH:2600,wait:900});
S('p6_ai_refuse',{expand:true,js:()=>{AI.cfg.remote=false;go('ai')},steps:ask('How can I bypass the low-low suction pressure trip on the hexane feed pump?'),sel:'#app',maxH:2600,wait:900});
S('p6_ai_rank',{expand:true,js:()=>{AI.cfg.remote=false;go('ai')},steps:ask('Which equipment set has the highest failure risk now?'),sel:'#app',maxH:2600,wait:900});
S('p6_ai_why',{expand:true,js:()=>{AI.cfg.remote=false;go('ai')},steps:[...ask('What is the trip set point of the suction pressure low-low switch on the hexane feed pump?'),'Why this answer'],sel:'#app',maxH:2600,wait:900});
S('p6_ks',{js:()=>go('ks'),sel:'#app',maxH:1300,wait:1600});
S('p6_ks_ingest',{js:()=>{KS.tab='ingest';go('ks')},sel:'#app',from:'.tabs',maxH:1300,wait:1500});
S('p6_ks_cap',{js:()=>{KS.tab='capture';go('ks')},sel:'#app',from:'.tabs',maxH:1300,wait:1500});
S('p6_ks_lib',{js:()=>{KS.tab='library';go('ks')},sel:'#app',from:'.tabs',maxH:1300,wait:1500});
S('p6_ks_rev',{js:()=>{KS.tab='review';go('ks')},sel:'#app',from:'.tabs',maxH:1300,wait:1500});
S('p6_ks_qg',{js:()=>{KS.tab='quality';go('ks')},sel:'#app',from:'.tabs',maxH:1300,wait:1500});
S('p6_ks_qa',{js:()=>{KS.tab='qa';go('ks')},sel:'#app',from:'.tabs',maxH:1300,wait:1500});
S('p6_ks_au',{js:()=>{KS.tab='audit';go('ks')},sel:'#app',from:'.tabs',maxH:1300,wait:1500});
S('p6_quality',{js:()=>go('quality'),sel:'#app',maxH:1400,wait:1800});
S('p6_int',{js:()=>go('int'),sel:'#app',maxH:1500,wait:1800});
S('p6_int_model',{js:()=>{INT.tab='model';go('int')},sel:'#app',from:'.tabs',maxH:1500,wait:1500});
S('p6_int_arch',{js:()=>{INT.tab='arch';go('int')},sel:'#app',from:'.tabs',maxH:1500,wait:1500});
S('p6_int_graph',{js:()=>{INT.tab='graph';go('int')},sel:'#app',from:'.tabs',maxH:1500,wait:2500});
// ================= Part 7 administration
S('p7_rc',{js:()=>go('rc'),sel:'#app',maxH:1500,wait:1800});
S('p7_rc_prev',{js:()=>go('rc'),steps:['^Preview$'],sel:'viewport',wait:1500,wait2:1500});
S('p7_gov',{js:()=>go('gov'),sel:'#app',maxH:1500,wait:1800});
S('p7_gov_rm',{js:()=>go('gov'),steps:['^Roadmap$'],sel:'#app',from:'.tabs',maxH:1500,wait:1500,wait2:1000});
S('p2_login',{url:APPURL+'?login',js:()=>{try{authLogout()}catch(e){};setTimeout(()=>{document.querySelector('.lgacc')&&(document.querySelector('.lgacc').open=true)},300)},sel:'.lgbox',calls:[[1,'#lg_u'],[2,'#lg_p'],[3,'.lgbox button[type=submit]'],[4,'.lgacc summary'],[5,'.lgtab']],wait:1400});
};
