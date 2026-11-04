"""Assemble knowledge-hub-integrated_BAP5.html from src/. Usage: python3 build.py"""
import re,subprocess,json,sys,os,tempfile
ROOT=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,os.path.join(ROOT,'tools'))
# case pack: python3 build.py [case-id]   (or CASE=case-id). Default: lldpe. See cases/README.md
CASE=(sys.argv[1] if len(sys.argv)>1 and not sys.argv[1].startswith('-') else os.environ.get('CASE','lldpe'))
CDIR=CASE if os.path.isabs(CASE) else os.path.join(ROOT,'cases',CASE)
OUT=os.environ.get('BUILD_OUT')   # build a throw-away copy to this folder instead of dist/ (used by tests and dry runs)
if not os.path.isdir(CDIR): sys.exit('case pack not found: '+CDIR)
cf=lambda *p:open(os.path.join(CDIR,*p)).read()
def _meta():
    m=json.loads(cf('case.json')) if os.path.exists(os.path.join(CDIR,'case.json')) else {}
    m.setdefault('id',os.path.basename(CDIR)); m.setdefault('title',m['id'])
    m.setdefault('product','Asset Knowledge Platform'); m.setdefault('subtitle',m['title']+' | Equipment Records'); m.setdefault('company',''); m.setdefault('brief','case'); m.setdefault('plotref','')
    m.setdefault('examples',[]); m.setdefault('failures',[]); m.setdefault('dsprefix',m.get('code','')+'-DS' if m.get('code') else 'DS')
    return m
META=_meta()
AUTO={'pid':'autoPidAll();','gad':'autoGadAll();','g3m':'autoG3mAll();','plot':'autoPlot();','p3':'autoP3();','ov':'autoOv();','hse':'autoHse();','h3':'autoH3();','alias':'autoAlias();','eqn':'autoEqn();','scn':'autoScn();'}
from theme import *
base=open(os.path.join(ROOT,'src','base.html')).read()
base=base.replace('@@BASE_CSS@@',open(os.path.join(ROOT,'src','base.css')).read()).replace('@@CASE:kb@@',cf('kb.json').strip()).replace('@@CASE:dsil@@',cf('dsil.json').strip()).replace('@@CASE:ga@@',cf('ga.json').strip()).replace('@@CASE:meta@@',json.dumps(META)).replace('@@CASE:fin@@',cf('fin.json').strip() if os.path.exists(os.path.join(CDIR,'fin.json')) else '{}')
def snip(t):
    def r(m):
        n=m.group(1);f=os.path.join(CDIR,'geo',n+'.js')
        return open(f).read() if os.path.exists(f) else AUTO[n]
    return re.sub(r'/\*@@CASE:(\w+)@@\*/',r,t)
w=lambda f:snip(open(os.path.join(ROOT,'src','modules',f)).read())
base=snip(base)
TMP=tempfile.mkdtemp()
h=base
def P(old,new,cnt=1):
    global h
    assert old in h,("PATCH MISSING",old[:80])
    h=h.replace(old,new)
# ---------- 1. AI assistant: remove original code, keep nav/buttons, rewire to ai.js ----------
P('<div class="nav" data-page="assistant">🤖 AI Assistant</div>','<div class="nav" data-page="ai">AI Assistant</div>\n  <div class="nav" data-page="ks">Knowledge Studio</div>\n  <div class="nav" data-page="fm">Failure Memory</div>\n  <div class="nav" data-page="rc">Report Center</div>\n\n  <div class="nav" data-page="int">Integrations</div>\n  <div class="nav" data-page="gov">Governance</div>\n  <div class="nav" data-page="mywork">My work</div>')
i=h.index('  <div class="foot">');j=h.index('</div>',i)+6;h=h[:i]+'  <div class="foot"><div class="fline"><span class="dot" id="syncdot" style="background:var(--warn)"></span><span id="syncstat">Local only</span></div><div class="fline between"><span class="fline"><span class="dot" id="aidot" style="background:var(--warn)"></span><span id="aistat">Offline knowledge search</span></span><span class="fline" style="gap:4px"><button class="gear" onclick="tourStart()" aria-label="Guided tour" title="Guided tour"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg></button><button class="gear" onclick="setOpen()" aria-label="Settings" title="Settings"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button></span></div></div>'+h[j:]
i=h.index('/* AI Assistant: retrieval');j=h.index('/* Render */');h=h[:i]+h[j:]
P('p==="quality"?quality():assistant();','p==="quality"?quality():p==="il"?ilPage():p==="ai"?aiPage():p==="ks"?ksPage():p==="fm"?fmPage():p==="rc"?rcPage():p==="int"?intPage():p==="scn"?scnPage():p==="mywork"?myWorkPage():dashboard();')
P('if(p==="assistant")$("#q")?.focus()','if(p==="ai")$("#q")?.focus()')
P('const m=$("#msgs");if(m)m.scrollTop=m.scrollHeight;','const m=$("#msgs");if(m)m.scrollTop=m.scrollHeight;')
h=h.replace("go('assistant'","go('ai'")
# ---------- 2. modules ----------
a=h.index('/* Plot-plan map:');b=h.index('const modeSel=');b=h.index('\n',b)+1
h=h[:a]+h[b:]
h=h.replace('const G={n:1,sel:null};\n','')
pp=w('pp.js')
for x,y in [('const vb=full?PP.vb:[0,0,880,830],o=[];','const vb=opt.vb||(full?PP.vb:[0,0,880,830]),o=[];'),
 ('c=L.heat?heat(v[i]):AREAC[i],','c=opt.fill?opt.fill(s.n):L.heat?heat(v[i]):AREAC[i],'),
 (':`go(\'equipment\',{set:${s.n},tab:\'overview\'})`;',':(opt.click?opt.click(s.n):`go(\'equipment\',{set:${s.n},tab:\'overview\'})`);'),
 ('<rect x="${x-W/2}" y="${y-Hh/2}" width="${W}" height="${Hh}" fill="${c}"','${opt.ring?opt.ring(s.n,x,y):""}<rect x="${x-W/2}" y="${y-Hh/2}" width="${W}" height="${Hh}" fill="${c}"'),
 ('${full?"":`<div class="row" style="font-size:12px','${full||opt.mini?"":`<div class="row" style="font-size:12px')]:
    assert x in pp,x; pp=pp.replace(x,y)
a=h.index('const gKey=(d,i)=>');b=h.index('const _r1=render;')
mods=[w('auto.js'),w('auto3d.js'),'const EQC='+open(os.path.join(ROOT,'src','data','eqclass.json')).read()+';\n',w('dl.js'),w('ui.js'),w('facts.js'),w('ai.js'),w('intent.js'),w('gad.js'),w('ga.js'),pp,'const MH='+cf('mh.json')+';\nconst EVAL_CASES='+cf('eval_cases.json')+';\nconst SCHEMA_SQL='+json.dumps(open(os.path.join(ROOT,'src','data','schema.sql')).read())+';\nconst PROMPT_TEMPLATE='+json.dumps(open(os.path.join(ROOT,'src','data','prompt_template.md')).read())+';\n']
for f in ['ch.js','mh1.js','mh2.js','mh3.js','mh4.js','rp.js','pid2.js','pidv.js','pdm.js','pdm2.js','ks.js','wiz.js','scn.js','scnui.js','fm.js','rc.js','cov.js','int.js','il.js','fx.js','help.js','auth.js','notify.js','ingest.js','gov.js','eq2.js','perf.js','ready.js','hse.js','hse3d.js','ai2.js','eqclass.js','fin.js','g3neck.js','g3d.js','g3r.js','plant3d.js','sim3d.js','plan.js','i18n.js','sync.js','dash.js','polish.js']:
    try: mods.append(w(f))
    except FileNotFoundError: pass
SPI=(CASE=='spi')
if SPI:  # spare part pages: shell first, then every spi_*.js (each owned by one agent), nav from spi/pages.json
    import glob
    for f in ['spi_core.js','spi_viz.js']+sorted(os.path.basename(g) for g in glob.glob(os.path.join(ROOT,'src','modules','spi_*.js')) if not g.endswith(('spi_core.js','spi_viz.js'))): mods.append(w(f))
h=h[:a]+''.join(mods)+h[b:]
for t,r in [('["ga","Equipment drawing"],','["ga","Equipment drawing"],["perf","Key indicators"],["plot","Plot plan"],'),('if(tab==="ga")b=gaView(n);','if(tab==="ga")b=gaView(n);if(tab==="plot")b=ppView(n);if(tab==="perf")b=perfSetView(n);if(tab==="ready")b=rdyView(n);'),('if(tab==="maint")b=maint(n);','if(tab==="maint")b=mhView(n);')]:
    P(t,r)
P('"go(\'documents\',{doc:\'"+s.pp.document_id+"\'})"','"st.tab=\'plot\';render()"')
P('<div class="nav" data-page="equipment">🏭 Equipment Sets</div>','<div class="nav" data-page="equipment">Equipment Sets</div>\n  <div class="nav" data-page="plot">Plot Plan</div>\n  <div class="nav" data-page="mnt">Maintenance</div>\n  <div class="nav" data-page="perf">Performance</div>\n  <div class="nav" data-page="scn">Scenarios</div>\n  <div class="nav" data-page="il">Interlock Library</div>')
P('p==="pid"?pidPage():','p==="pid"?pidPage():p==="plot"?plotPage():p==="mnt"?mhPage():p==="perf"?perfPage():p==="gov"?govPage():')
i=h.index('.pbar{padding'); h=h[:i]+w('style2.css')+w('style3.css')+(w('style4.css') if True else '')+w('style3d.css')+w('style_fin.css')+(w('style_spi.css') if SPI else '')+h[i:]

# ---------- contextual exports ----------
P('<button onclick="go(\'ai\',{scope:${n}})">🤖 Ask AI about ${s.tag}</button>','<div class="row" style="gap:8px"><button onclick="go(\'ai\',{scope:${n}})">🤖 Ask AI about ${s.tag}</button><button class="ghost" onclick="rcOpen(\'dossier\',{set:${n}})">Export dossier</button></div>')
P('[["overview","Overview"],["pid","P&ID"],','[["overview","Overview"],["a360","Asset 360"],["pid","P&ID"],["scn","Scenarios"],["cls","Class reference"],')
P('if(tab==="overview"){','if(tab==="scn")b=scnUnitTab(n);else if(tab==="cls")b=clsView(n);else if(tab==="a360")b=a360View(n);else if(tab==="overview"){')
# search box and role selector in sidebar
P('<div class="nav active" data-page="dashboard">','<div class="gsb" onclick="gsOpen()">Search the knowledge base <kbd>Ctrl K</kbd></div>\n  <div class="nav active" data-page="dashboard">')
# ---------- P&ID layout touch-ups ----------
# ---------- P&ID page uses the v2 sheet ----------
i=h.index('<div class="sheet"><svg id="psvg"');j=h.index('</svg></div>',i)+12
h=h[:i]+'<div class="sheet">${pidSvgOnly(P.set,{w:P.z+"%",keepSel:true})}</div>'+h[j:]
# ---------- interlock patches ----------
P('window.ilX=n=>{IS[n]=','window.ilState=S0;window.ilX=n=>{IS[n]=')
i=h.index('if(tab==="seq")b=ilView(n)+');j=h.index('\n',i)
h=h[:i]+'if(tab==="seq")b=ilSetTab(n);'+h[j:]
P('go(n.dataset.page,{set:null,doc:null,opl:null,wo:null})','go(n.dataset.page,{set:null,doc:null,opl:null,wo:null,il:null})')
for old,new in [('<b>OPERATOR TRAINING SIMULATOR</b> &nbsp;·&nbsp; ${tg0} &nbsp;·&nbsp; ${il.logic}','<b>INTERLOCK FUNCTION TEST</b> &nbsp;|&nbsp; ${tg0} &nbsp;|&nbsp; ${il.logic}'),
 ('<span class="lamp y" style="padding:3px 9px">SIMULATION MODE</span> <span class="muted">Not connected to live plant · Sample data</span>','<span class="lamp y" style="padding:3px 9px">TEST MODE</span> <span class="muted">Not connected to live plant. Sample data.</span>'),
 ('<button class="ghost" onclick="st.tab=\'ds\';render()">📋 Equipment data sheet</button> <button class="ghost" onclick="go(\'ai\',{scope:${n}})">✨ Instructor AI</button> <button class="ghost" onclick="ilX(${n})">⟲ Reset simulator</button>','<button class="ghost" onclick="ilX(${n})">Reset test</button>'),
 ('<h3>Training scenarios · Cause &amp; Effect Matrix</h3><p class="muted" style="margin:4px 0 8px">Select a scenario (cause) to load it into the simulator.','<h3>Test cases: Cause and Effect Matrix</h3><p class="muted" style="margin:4px 0 8px">Select a test case (cause) to load it into the function test.'),
 ('<th>Scenario</th>','<th>Test case</th>'),('No events. Select a scenario and begin the exercise.','No events recorded. Select a test case to begin.'),('<h3>Sequence of Events (SOE)</h3>','<h3>Sequence of Events</h3>'),
 ('Dynamic process mimic &amp; logic diagram','Process mimic and logic diagram'),('Live view of the selected scenario: flow stops','Live view of the selected test case: flow stops'),('<text y="6" text-anchor="middle" font-size="17" ${on?`class="bl2"`:""}>🔔</text>','<text y="5" text-anchor="middle" font-size="14" font-weight="700" ${on?`class="bl2"`:""}>ALM</text>'),
 ('Operator response procedure','Operator response procedure'),('Follow in order — a latched trip','Follow in order. A latched trip'),
 ('PROCESS MIMIC · ','PROCESS MIMIC | '),('LOGIC DIAGRAM · ${il.logic} · click an initiator to arm it','LOGIC DIAGRAM | ${il.logic} | select an initiator to arm it')]:
    if old in h: h=h.replace(old,new)
    else: print("WARN missing",old[:60])

# ---------- 3. language ----------
for old,new in [('<title>AI Manufacturing Knowledge Hub</title>','<title>Asset Knowledge Platform</title>'),('⚙️ Knowledge Hub<small>CALIBER 2026 · Case 1</small>','Asset Knowledge Platform<small>'+META['subtitle']+'</small>'),
 ('["seq","OTS · Interlock simulator"]','["seq","Interlock Logic"]')]:
    P(old,new)
P('(!f.ds||d.set==f.ds)&&(!q||(d.name+d.id).toLowerCase().includes(q)));','(!f.ds||d.set==f.ds)&&(!f.dst||ds(d)===f.dst)&&(!q||(d.name+d.id).toLowerCase().includes(q)));')
P('${filt("ds","",setOpts,"All sets")}</div>${docTbl(l)}','${filt("ds","",setOpts,"All sets")}${filt("dst","",[...new Set(K.docs.map(ds))],"All statuses")}</div>${docTbl(l)}')
_i=h.rindex('</body>');h=h[:_i]+'<script>\n'+w('late.js')+'</script>\n'+h[_i:]

# ---------- 3b. wording patches ----------
EM="\u2014"
for old,new in [
 ('${k==="ds"?"⚡ Open OTS interlock simulator":"📋 Open equipment data sheet"}','${k==="ds"?"Open interlock logic":"Open equipment data sheet"}'),
 
 ('Everything in this equipment set '+EM+' click to open','Equipment set records. Select a tile to open.'),
 (' · click another node to jump to that set',' | select another unit to switch'),
 ('Click any pump, vessel, valve or instrument on the sheet to see its datasheet context and live condition.','Select any pump, vessel, valve or instrument on the sheet to view its datasheet context and live condition.'),
 ('Live twin: flow runs along the process lines and rotating equipment turns while healthy. Use <b>Simulate trip</b> on an initiating instrument and the interlock effects follow (valves move, drives stop, flow halts).','Digital twin view: product flow is animated along the process lines and rotating equipment turns while healthy. Use <b>Simulate trip</b> on an initiating instrument to display the resulting interlock actions (valves move, drives stop, flow halts).'),
 ('Click a faceplate to drive that signal beyond its set point.','Select a transmitter faceplate to drive that signal beyond its set point.'),
 ('Practise this lesson','Related scenarios'),('Practise this step in the simulator','Run this step in the scenario simulator'),
 ('each with live training scenarios (','each with interactive scenarios ('),('Open a sheet to read it as issued, or run a scenario to practise it.','Open a sheet to review it as issued, or run a scenario to test the procedure.'),
 ('Field &amp; panel actions '+EM+' choose what you would do','Field and panel actions: select the action to take'),('Field & panel actions '+EM+' choose what you would do','Field and panel actions: select the action to take'),
 ('DUMMY training values','sample values'),(' (mixed!)',' (mixed)'),('"CLOSED!"','"CLOSED"'),('Weep at channel flange!','Weep at channel flange'),('"Knocking!"','"Knocking"'),
 ('s==="tr"?"#ffb3ad":s==="al"?"#f0cf7a":"#d6dde5"','s==="tr"?"#a4161a":s==="al"?"#8a5a00":"#2f3b4a"'),
 ('["CL elevation",g.cl_elevation_mm+" mm"]','["CL elevation",g.cl_elevation_mm==null?"n/a":g.cl_elevation_mm+" mm"]'),
 ('${mapSvg(n)}','${mapSvg(n,{vb:[30,70,830,680]})}'),
 ('click to filter','select to filter'),('click a bar to open','select a bar to open'),('click a column for history','select a column for history'),('click to open in Maintenance','select to open in Maintenance'),('click to open','select to open'),
 ('Open interlock table','Open interlock logic'),('Simulated feed · connect DCS/OPC via window.LIVE_SOURCE(tag)','Simulated signal. Not connected to a live data source.'),('Simulated · connect DCS/OPC via window.LIVE_SOURCE(tag)','Simulated signal. Not connected to a live data source.'),
 ('`Click the <b>','`Select the <b>'),('"Click the <b>','"Select the <b>'),
 ]:
    if old in h: h=h.replace(old,new)
    elif CASE=="lldpe": print("WARN text patch missing:",old[:60])

# ---------- costing page (module fin.js, owned by Codex) ----------
P('<div class="nav" data-page="gov">Governance</div>','<div class="nav" data-page="gov">Governance</div>\n  <div class="nav" data-page="fin">Costing</div>')
P('p==="gov"?govPage():','p==="gov"?govPage():p==="fin"?finPage():')
if SPI:  # spare part navigation group, routing and start page
    PG=json.load(open(os.path.join(ROOT,'spi','pages.json')))
    P('<div class="nav active" data-page="dashboard">▦ Dashboard</div>',''.join('<div class="nav" data-page="%s">%s</div>\n  '%(pid,lab) for pid,lab,_ in PG)+'<div class="nav active" data-page="dashboard">Plant overview</div>')
    P('const NAVG=[["Operate",','const SPIPAGES='+json.dumps(PG)+';\nconst NAVG=[["Spare parts",SPIPAGES.map(r=>[r[0],r[2]])],["Operate",')
    P('app.innerHTML=p==="dashboard"?','app.innerHTML=p.startsWith("spi_")?spiRoute(p):p==="dashboard"?')
    P('let st={page:"dashboard",','let st={page:"spi_dash",')
    h=h.replace('All eight P&IDs are laid out as on the plot plan and linked by their process lines.','All equipment sets are shown in a schematic layout generated from the data.')
    h=h.replace('slot("Plot Plan",DOC[s.pp.document_id]),','').replace(',slot("Interlock Logic (SEQ)",DOC["IL-"+n])','')
    P('Each set = P&ID + GA drawing + datasheet + plot plan + interlock logic + OPLs + maintenance history, for one main equipment item','Each set = schematic P&ID, equipment drawing and 3D model, datasheet, spare parts list and maintenance notifications, for one main equipment item')
    P('<span class="tag">🧩 ${cnt(K.opl,o=>o.set===s.n)} lessons</span>','')
    h=h.replace('Ask about procedures, interlocks, equipment details, locations or maintenance history.','Ask about spare parts, stock, equipment details or maintenance history.').replace('plot plans, interlock documents, OPLs, instrument data and ','spare part records, datasheets and ')
    P('window.NW=n=>','window.SPI_MODE=true;window.NW=n=>')
    P('All ${NW(K.sets.length)} units as laid out on the plot plan, joined by their process, gas, water, nitrogen and steam lines. Drag to look around. Select a unit to fly to it and see its figures, then open its equipment set from the card.','All ${NW(K.sets.length)} equipment sets in a schematic site layout generated from the data. Drag to look around. Select a unit to fly to it, then open its equipment set from the card.')

# ---------- 4. theme + cleanup ----------
h=remap(h)
if SPI: h=h.replace('Asset Knowledge Platform','Spare Part Intelligence').replace('AI Manufacturing Knowledge Hub','Spare Part Intelligence')
h=h.replace(ROOT_OLD,ROOT_NEW)
h=h.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0" />','<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<meta name="theme-color" content="#155ea3" />\n<link rel="manifest" href="manifest.webmanifest" />\n<link rel="icon" href="icon-192.png" />',1)
h=strip_emoji(h); h=dashes(h)
if OUT:
    os.makedirs(OUT,exist_ok=True); open(os.path.join(OUT,'index.html'),'w').write(h)
else:
    open(os.path.join(ROOT,'knowledge-hub-integrated_BAP5.html'),'w').write(h)
    os.makedirs(os.path.join(ROOT,'dist'),exist_ok=True)
    open(os.path.join(ROOT,'dist','index.html'),'w').write(h)
    import shutil
    for f in os.listdir(os.path.join(ROOT,'src','pwa')):
        shutil.copy(os.path.join(ROOT,'src','pwa',f),os.path.join(ROOT,'dist',f))
bad=0
for k,m in enumerate(re.finditer(r'<script>(.*?)</script>',h,re.S)):
    open(os.path.join(TMP,f'sc{k}.js'),'w').write(m.group(1))
    r=subprocess.run(['node','--check',os.path.join(TMP,f'sc{k}.js')],capture_output=True,text=True)
    if r.returncode: print(k,r.stderr[:800]);bad=1
print('built',len(h),'em-dashes left:',h.count('—'))
if bad:sys.exit(1)
