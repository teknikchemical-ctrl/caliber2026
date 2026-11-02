/* =====================================================================================================
   AUTOMATIC GEOMETRY
   A case pack (cases/<id>/) normally brings its own drawings in cases/<id>/geo/. For a pack that has none, build.py puts a call to the
   functions below in their place, so a plant described only by data (equipment, documents, instruments, interlocks, nozzles, parts list)
   still gets a P&ID, a general arrangement drawing, a 3D model, a plot plan, an overview layout and hazard defaults.
   Everything here is a function declaration so that it can be called from the places the case files normally fill.
   The drawings are schematic: good enough to demonstrate and to navigate from, and to be replaced by drawn sheets when time allows.
   ===================================================================================================== */
var AUTO_TAG=/\b[A-Z]{1,5}-?\d{3,5}[A-Z]?\b/g;
function autoSet(n){return KB.sets.find(s=>s.n===n)}
function autoWrap(t,w){const o=[];let l="";String(t||"").replace(/[\/,]+/g," / ").split(/\s+/).filter(Boolean).forEach(x=>{if((l+" "+x).trim().length>w&&l){o.push(l);l=x}else l=(l+" "+x).trim()});if(l)o.push(l);return o.slice(0,3).join("|")}
/* ------------------------------------------------------------------ equipment kind */
function autoKind(n){const s=autoSet(n),a=KB.assets.find(x=>x.tag===s.tag)||{},t=(s.name+" "+(a.type||"")).toLowerCase();
 if(/cooling tower|\bfan\b|air cooler/.test(t))return"fan";
 if(/pump/.test(t))return"pump";
 if(/compressor|blower|turbine/.test(t))return"comp";
 if(/control valve|\bvalve\b|\bprv\b|\bpsv\b/.test(t)&&!/drum|vessel|tank/.test(t))return"valve";
 if(/furnace|fired|boiler|reformer|incinerator/.test(t))return"fired";
 if(/exchanger|heater|cooler|condenser|reboiler|chiller|evaporator|vaporizer/.test(t))return"hx";
 if(/column|tower|splitter|stripper|absorber|scrubber|fractionator/.test(t))return"column";
 if(/dryer|kiln|oven/.test(t))return"dryer";
 if(/reactor|converter|digester|autoclave/.test(t))return"reactor";
 if(/drum|accumulator|separator|knock|receiver|decanter|settler|horizontal/.test(t))return"drum";
 if(/tank|silo|hopper|bin|sphere|vessel/.test(t))return"vessel";
 return"other"}
function autoRotating(k){return k==="pump"||k==="comp"||k==="fan"}
function autoVertical(k){return k==="column"||k==="reactor"||k==="vessel"}
/* ------------------------------------------------------------------ GA data (parts list and nozzles) when the pack has none */
function autoGaFill(){KB.sets.forEach(s=>{const g=GA[s.n]||(GA[s.n]={}),empty=!g.bom||!g.bom.length;
 if(empty){const rows=KB.bom.filter(b=>b.document_id===(s.ga||{}).document_id);g.bom=rows.length?rows.map(b=>({name:b.part_name,mat:b.material||"not stated",qty:String(b.qty||1)})):
  ({pump:["Casing","Impeller","Shaft","Mechanical seal","Bearing housing","Baseplate"],comp:["Frame","Cylinder","Piston","Valves","Packing","Baseplate"],fan:["Fan","Gearbox","Drive shaft","Fill","Casing","Basin"],valve:["Body","Bonnet","Trim","Actuator","Positioner"],
   column:["Shell","Top head","Trays or packing","Bottom head","Skirt"],reactor:["Shell","Top head","Internals","Bottom head","Support"],drum:["Shell","Head","Head","Saddle","Mist pad"],hx:["Shell","Tube bundle","Channel head","Saddle","Baffles"],fired:["Casing","Radiant coil","Burner","Stack"]}[autoKind(s.n)]||["Body","Support","Internals","Nameplate"]).map(x=>({name:x,mat:"not stated",qty:"1"}))}
 if(!g.nz||!g.nz.length){const rows=KB.nz.filter(z=>z.document_id===(s.ga||{}).document_id);g.nz=rows.length?rows.map(z=>({m:z.nozzle_mark,sv:z.service,sz:z.size_rating,r:z.connects_to_from||""})):[{m:"N1",sv:"Inlet",sz:"not stated",r:""},{m:"N2",sv:"Outlet",sz:"not stated",r:""}]}
 if(empty&&g.mot===undefined&&autoRotating(autoKind(s.n))){const p=(KB.assets.find(a=>a.tag===s.tag)||{}).power;g.mot="Motor"+(p?" "+p:"")}
 g.p=g.p||[];g.n=g.n||[]})}
/* ------------------------------------------------------------------ P&ID */
/* built on first use: the parts list and nozzles (GA) are read when a sheet is first drawn */
function autoPidAll(){KB.sets.forEach(s=>{const set=v=>Object.defineProperty(D,s.n,{value:v,writable:true,configurable:true,enumerable:true});Object.defineProperty(D,s.n,{configurable:true,enumerable:true,get(){const v=autoPid(s.n);set(v);return v},set})})}
function autoLbl(r,def,w){let t=String(r||"").replace(/\(.*?\)/g," ").replace(/^\s*(n-)?[\w\s]*?\b(in|out)\b\s*-\s*/i,"").replace(/^\s*(from|to|via|into)\s+/i,"").replace(/[;,.].*$/,"").replace(/\s+/g," ").trim();return autoWrap(t.length>3?t.slice(0,34):def,w||13)}
function autoPid(n){
 const s=autoSet(n),kind=autoKind(n),il=(KB.IL&&KB.IL[n])||{trig:[],eff:[],perm:[],logic:"",sil:""},ga=GA[n]||{},inst=KB.inst.filter(i=>i.set===n);
 const ML=kind==="fan"?330:300,nodes=[],pipes=[],sigs=[],ann=[],have=new Set(),T=s.tag,mtag="M-"+(T.match(/\d+[A-Z]?$/)||[n])[0];
 const addN=x=>{nodes.push(x);have.add(x[0])};
 const nzOf=re=>(ga.nz||[]).find(z=>re.test(z.sv||""));
 const upl=nzOf(/suction|inlet|feed|in\b|supply|hot/i),dnl=nzOf(/discharge|outlet|product|out\b|return|cold/i);
 const from=autoLbl(upl&&upl.r,"Upstream"),to=autoLbl(dnl&&dnl.r,"Downstream");
 const fl=String(s.fluid||"").toUpperCase().replace(/\s+/g," ").slice(0,26);
 /* template: returns the process connection levels used by the accessories */
 let X=520,inY=ML,outY=ML,inX=[X-60],outX=[X+60],top=ML-60,bot=ML+60,gt=[T];
 const idn=s=>String(s).replace(/^[A-Z]+-/,"");
 if(kind==="pump"){addN([T,"p",X,ML,38,0," "]);addN([mtag,"m",X,ML+128,70,56]);outY=ML-120;inX=[X-52];outX=[X];top=ML-150;
  pipes.push([[X0(),inY,X-52,inY],{g:gt}],[[X,ML-48,X,outY,905,outY],{a:1,g:gt}]);sigs.push([X,ML+38,X,ML+100])}
 else if(kind==="comp"){addN([T,"c",X,ML,148,76]);addN([mtag,"m",X,ML+135,80,56]);inX=[X-74];outX=[X+74];top=ML-60;
  pipes.push([[X0(),inY,X-74,inY],{g:gt}],[[X+74,outY,905,outY],{a:1,g:gt}]);sigs.push([X,ML+38,X,ML+107])}
 else if(kind==="fan"){addN([T,"f",X,ML-120,220,0," "]);addN(["BASIN","bx",X,ML+40,330,170," "]);ann.push(tx(X,ML+40,"COOLING WATER BASIN",10,"middle",1),tx(X,ML-96,T+"|"+s.name,9,"middle",1,0,1));
  inY=ML-30;outY=ML+100;inX=[X-165];outX=[X+165];top=ML-170;pipes.push([[X0(),inY,X-165,inY],{g:gt,a:0}],[[X+165,outY,905,outY],{a:1,g:gt}]);addN([mtag,"m",X+190,ML-120,50,40])}
 else if(kind==="valve"){addN([T,"a",X,ML,0,0," ","big"]);inX=[X-70];outX=[X+70];top=ML-60;pipes.push([[X0(),ML,X-30,ML],{g:gt}],[[X+30,ML,905,ML],{a:1,g:gt}])}
 else if(autoVertical(kind)){const col=kind==="column",W=col?90:kind==="vessel"?170:120,H=col?340:kind==="vessel"?200:270;addN([T,"v",X,ML,W,H,s.tag+"|"+(kind==="reactor"?"":""),kind==="reactor"?"bed":""]);inY=ML-H*.2;outY=ML+H/2+36;inX=[X-W/2-10];outX=[X+W/2+10];top=ML-H/2;bot=ML+H/2;
  pipes.push([[X0(),inY,X-W/2,inY],{g:gt}],[[X,ML+H/2,X,outY,905,outY],{a:1,g:gt}],[[X,ML-H/2,X,ML-H/2-40,760,ML-H/2-40],{a:1,th:1}]);ann.push(tx(790,ML-H/2-48,col?"OVERHEAD":"VENT",8.5,"middle",1))}
 else{const hx=kind==="hx"||kind==="fired",W=kind==="dryer"?380:hx?260:240,H=kind==="dryer"?130:100,opt=kind==="dryer"?"dryer":kind==="hx"?"hx":kind==="fired"?"zz":"";addN([T,"h",X,ML,W,H," ",opt]);ann.push(tx(X,ML-H/2-12,T+"|"+s.name,9,"middle",1,0,1));
  inX=[X-W/2-10];top=ML-H/2;bot=ML+H/2;
  if(hx){outY=ML;outX=[X+W/2+10];pipes.push([[X0(),ML,X-W/2,ML],{g:gt}],[[X+W/2,ML,905,ML],{a:1,g:gt}]);
   const hot=/heater|reboiler|evaporator|vaporizer/i.test(s.name),ul=kind==="fired"?"FUEL|GAS":hot?"STEAM":"COOLING|WATER";pipes.push([[X-60,ML-H/2-70,X-60,ML-H/2],{th:1,a:1}],[[X+60,ML+H/2,X+60,ML+H/2+70,905,ML+H/2+70],{th:1,a:1}]);ann.push(tx(X-60,ML-H/2-82,ul,8.5,"middle",1),tx(X+160,ML+H/2+84,kind==="fired"?"FLUE|GAS":hot?"CONDENSATE":"RETURN",8.5,"middle",1))}
  else{outY=ML+H/2+60;pipes.push([[X0(),ML-20,X-W/2,ML-20],{g:gt}],[[X+60,ML+H/2,X+60,outY,905,outY],{a:1,g:gt}]);if(kind==="dryer")ann.push(tx(X,ML+H/2+14,"STEAM TUBE BUNDLE",8.5,"middle",1))}
  if(kind!=="hx"&&kind!=="fired"&&kind!=="dryer")ann.push();inY=hx?ML:ML-20}
 function X0(){return 116}
 /* battery limit, stream labels */
 ann.push(`<line x1="116" y1="14" x2="116" y2="${ML+260}" stroke="#111" stroke-dasharray="7 5" stroke-width="1.3"/>`,tx(112,12,"BATTERY LIMIT",9,"end"));
 addN(["FROM","e",58,inY,0,0,"FROM|"+from.replace(/\|/g,"|")]);addN(["TO","e",956,outY,0,0,"TO|"+to]);
 if(fl)ann.push(tx(210,inY-8,fl,8.5,"middle",1),tx(830,outY-8,fl,8.5,"middle",1));
 /* actuated valves, switches and relief devices attached to this set */
 const isV=t=>/^(XV|HV|FV|PV|LV|TV|PCV|FCV|LCV|TCV|ZV|SDV|ESDV|MOV|BDV|CV)-?\d/.test(t),isR=t=>/^(PSV|PRV|RV|SV)-?\d/.test(t),isTrip=t=>/^[A-Z]*S(HH|LL|H|L)-?\d/.test(t)||il.trig.some(x=>x.tag===t);
 const mainIn=[],mainOut=[],eftags=[];
 il.eff.forEach(e=>(String(e).match(AUTO_TAG)||[]).forEach(t=>eftags.push(t)));
 const vtags=[...new Set([...inst.map(i=>String(i.tag).split(/[\s\/()]+/)[0]),...eftags].filter(t=>isV(t)&&t!==T))].slice(0,6);
 vtags.forEach((t,i)=>{const inl=/suction|inlet|feed|isolat|block/i.test((inst.find(x=>x.tag.indexOf(t)===0)||{}).var||"")||i%2===0,x=inl?inX[0]-70-(mainIn.length)*70:outX[0]+70+(mainOut.length)*70,y=inl?inY:outY;
  (inl?mainIn:mainOut).push(t);addN([t,/^(XV|HV|MOV)/.test(t)?"a":"a",Math.max(150,Math.min(900,x)),y,0,0,t,"",[0,26]])});
 const psv=inst.map(i=>i.tag.split(/[\s\/()]+/)[0]).find(isR);if(psv)addN([psv,"psv",X+(autoVertical(kind)?95:120),top-8,0,0,psv,"v",[26,0,"start"]]);
 /* instrument bubbles beside the process lines */
 const bubbles=inst.map(i=>({t:String(i.tag).split(/[\s\/()]+/)[0],v:i.var||"",ty:i.type||""})).filter(i=>i.t&&i.t!==T&&!have.has(i.t)&&!isV(i.t)&&!isR(i.t)&&!isTrip(i.t)&&/^[A-Z]{2,4}-?\d/.test(i.t)).filter((x,i,a)=>a.findIndex(y=>y.t===x.t)===i).slice(0,20);
 const slotIn=[],slotOut=[];bubbles.forEach(b=>{const out=!/suction|inlet|feed|upstream|supply/i.test(b.v+" "+b.ty);(out?slotOut:slotIn).push(b)});
 const place=(list,x0,dir,y,up)=>list.forEach((b,i)=>{const x=x0+dir*(i>>1)*50,u=(i%2===0)===up,by=u?y-46:y+46;if(x<130||x>900)return;addN([b.t,"i",x,by]);sigs.push([x,u?by+19:by-19,x,y])});
 place(slotIn,inX[0]-30,-1,inY,true);place(slotOut,outX[0]+60,1,outY,true);
 /* trip initiators: label row at the top, drawn to the interlock panel */
 const tr=il.trig.slice(0,6);tr.forEach((t,i)=>{const x=210+i*122,y=64+((i%2)*0);addN([t.tag,"t",x,y,0,0,t.tag+"|"+(t.sp||"")]);sigs.push([x,y+16,x,y+34])});
 /* interlock panel */
 const PY=ML+ (kind==="pump"||kind==="comp"?190:autoVertical(kind)?190:130),ph=Math.max(110,tr.length*30+60);
 if(il.logic){const lx=16,ly=Math.min(PY,560);ann.push(`<rect x="${lx}" y="${ly}" width="470" height="${ph}" rx="5" fill="#fff" stroke="#111" stroke-width="1.5"/>`,tx(lx+235,ly+17,il.logic+(il.sil?" ("+il.sil+")":""),11,"middle",1),
  ...tr.map((t,i)=>{const y=ly+40+i*((ph-56)/Math.max(1,tr.length));return tx(lx+8,y+3,t.tag,8,"start")+bx(lx+78,y-10,44,20,t.vote||"",7,"#e4e7f5")+arr([lx+122,y,lx+176,ly+ph/2])}),
  bx(lx+176,ly+30,44,ph-46,"LOGIC",8.5,"#e9e9e9",1),
  ...il.eff.slice(0,5).map((e,i)=>{const y=ly+40+i*((ph-56)/Math.max(1,Math.min(5,il.eff.length)));return arr([lx+220,ly+ph/2,lx+268,y])+bx(lx+268,y-10,44,20,"EFF-"+(i+1),8,"#e9e9e9")+tx(lx+318,y+3,autoWrap(String(e).toLowerCase().replace(/^./,c=>c.toUpperCase()),22).split("|")[0],7,"start")}));
 }
 ann.push(legend(856,ML+200),refDwg(856,ML+270,(s.pid||{}).ref||"",130));
 /* cause and effect map: which trips act on which tags */
 const eff={},oot=[],main=[T];if(have.has(mtag))main.push(mtag);
 tr.forEach(t=>{const L=[];(t.fx||[]).forEach((f,i)=>{if(!f)return;const e=String(il.eff[i]||""),tg=(e.match(AUTO_TAG)||[]).filter(x=>have.has(x));if(tg.length)tg.forEach(x=>L.push(x));else if(/trip|stop|shut/i.test(e))main.forEach(x=>L.push(x));if(/^open/i.test(e))tg.forEach(x=>oot.push(x))});
  if(L.length)eff[t.tag]=[...new Set(L)]});
 if(have.has("HS-"+idn(T)))null;
 const hs=il.trig.length?"HS-"+idn(T):null;if(hs){addN([hs,"hs",880,ML+110,0,0,hs+"|Hand switch|emergency stop","",[0,32]]);eff[hs]=[...main]}
 if(autoRotating(kind)&&!LB.some(b=>b[0].test(T)))LB.unshift([new RegExp("^"+T.replace(/[^\w]/g,"\\$&")+"$"),1,"RUN"]);
 const VH=Math.max(660,Math.min(560,PY)+ph+44);
 return{vb:[1000,VH],ref:(s.pid||{}).ref||"",n:nodes,p:pipes,s:sigs,a:ann,notes:["Note: 1. Schematic generated from the equipment, instrument and interlock data of this case.","2. Refer to the datasheet and the interlock logic of "+T+"."],eff,oot:[...new Set(oot)]}}
/* ------------------------------------------------------------------ general arrangement drawing (GAD) and 3D model (G3M) */
function autoGadAll(){KB.sets.forEach(s=>{GAD[s.n]=autoGad(s.n)})}
function autoGad(n){const kind=autoKind(n),g=GA[n],B=g.bom,N=B.length,vert=autoVertical(kind),FILL=["body","steel","blue","green","gray","seal"],parts=[],bal={},noz=[],deco=[];
 let gy=410,x0,x1,yt;
 if(vert){const cx=450,W=kind==="column"?110:kind==="vessel"?200:150,H=kind==="column"?300:250;x0=cx-W/2-20;x1=cx+W/2+20;yt=gy-H-30;const sh=H/Math.max(1,N);
  deco.push(gl(cx,yt-20,cx,gy,CL));
  B.forEach((b,i)=>{const y=gy-30-H+i*sh;parts.push({k:String(i+1),s:[gr(cx-W/2,y,W,sh-2,i===0||i===N-1?18:2,{f:FILL[i%6]})]});bal[String(i+1)]=[cx+W/2+70,y+sh/2,cx+W/2,y+sh/2]});
  parts.push({k:"S",s:[gr(cx-W/2-10,gy-30,W+20,30,0,{f:"steel"})]});
  g.nz.forEach((z,i)=>{const top=/inlet|feed|top|vent|overhead|reflux/i.test(z.sv),m=/man/i.test(z.sv);noz.push([z.m,top||m?cx-W/2+(i%3)*W/3+10:cx+W/2+4,top||m?gy-30-H-2:gy-60-i*36,top||m?"u":"r"])})}
 else{const L=kind==="comp"?700:kind==="fan"?560:kind==="pump"?600:640,H=kind==="comp"?150:kind==="drum"?110:kind==="fan"?200:kind==="hx"?100:120;x0=450-L/2;x1=450+L/2;yt=gy-H-60;const w=L/Math.max(1,N);
  deco.push(gl(450,yt-20,450,gy,CL),gr(x0-10,gy-14,L+20,14,0,{f:"gray"}));
  B.forEach((b,i)=>{const hh=H*(.55+.45*((i*7)%5)/4),y=gy-14-hh;parts.push({k:String(i+1),s:[gr(x0+i*w,y,w-2,hh,i===0||i===N-1?10:2,{f:FILL[i%6]})]});bal[String(i+1)]=[x0+i*w+w/2,yt-30-((i%2)*22),x0+i*w+w/2,y]});
  if(g.mot){parts.push({k:"M",s:[gr(x1+4,gy-14-H*.55,90,H*.55,8,{f:"blue"})]});bal.M=[x1+50,yt-8,x1+50,gy-14-H*.55];x1+=94}
  g.nz.forEach((z,i)=>{const dir=/drain|boot|bottom/i.test(z.sv)?"d":/suction|inlet|feed|in\b/i.test(z.sv)&&i===0?"l":/discharge|outlet|product|out\b/i.test(z.sv)&&i===1?"r":"u";
   noz.push([z.m,dir==="l"?x0-14:dir==="r"?x1+14:x0+60+(i*(L-120)/Math.max(1,g.nz.length)),dir==="d"?gy:dir==="u"?gy-14-H-4:gy-14-H/2,dir])})}
 return{gy,dim:{x0,x1,yt},deco,parts,bal,noz}}
function autoG3mAll(){KB.sets.forEach(s=>{G3M[s.n]=autoG3m(s.n)})}
function autoG3m(n){const kind=autoKind(n),g=GA[n],B=g.bom,N=Math.max(1,B.length),vert=autoVertical(kind),C=["paint","steel","blue","gray","green","amber"],a=[];
 if(vert){const R=kind==="column"?.55:kind==="vessel"?.9:.7,H=kind==="column"?3.6:kind==="vessel"?2.4:3,h=H/N;
  a.push(g3B("S",0,.08,0,R*2.3,.16,R*2.3,"gray",{r:.05}));
  B.forEach((b,i)=>a.push(g3C(String(i+1),"y",0,.16+h*(i+.5),0,h*.98,R,C[i%6],{sh:1,m:.4})));
  g.nz.forEach((z,i)=>{const top=/inlet|feed|top|vent|overhead|reflux/i.test(z.sv);a.push(top?g3C(z.m,"y",R*.5*(i%2?1:-1),.16+H+.12,0,.26,.07,"amber"):g3C(z.m,"x",R+.15,.5+i*.3,0,.3,.07,"amber"))})}
 else{const L=kind==="comp"?3.6:kind==="fan"?3:kind==="pump"?2.2:3.2,R=kind==="comp"?.5:kind==="fan"?.9:kind==="pump"?.32:kind==="drum"?.6:.5,w=L/N;
  a.push(g3B("",0,.07,0,L+.5,.14,R*2.3,"gray",{r:.05}));
  B.forEach((b,i)=>a.push(g3C(String(i+1),"x",-L/2+w*(i+.5),.14+R+((i%2)*.04),0,w*.98,R*(.85+.15*((i*7)%5)/4),C[i%6],{sh:1,m:.4})));
  if(g.mot)a.push(g3C("M","x",L/2+.6,.14+R*.8,0,1.1,R*.8,"blue",{m:.5}));
  g.nz.forEach((z,i)=>{const dir=/drain|boot|bottom/i.test(z.sv);a.push(dir?g3C(z.m,"y",-L/2+.4+i*.5,.1,0,.2,.06,"amber"):g3C(z.m,"y",-L/2+.3+i*(L-.6)/Math.max(1,g.nz.length),.14+R*2+.12,0,.24,.06,"amber"))})}
 return a}
/* ------------------------------------------------------------------ layout on the plot plan, in 3D, on the overview and for hazards */
function autoGrid(){const N=KB.sets.length,C=Math.min(4,N),R=Math.ceil(N/C);return{N,C,R}}
function autoPlot(){const {C,R}=autoGrid();window.PPS=Math.min(4.6,4.6*2/Math.max(2,R));window.POS={};KB.sets.forEach((s,i)=>{POS[s.n]=[124+36*(i%C),132+72*Math.floor(i/C)]});
 const xs=[...Array(C).keys()].map(c=>124+36*c),ys=[...Array(R).keys()].map(r=>132+72*r);
 window.HA=[];ys.forEach((y,r)=>{HA.push(y+18);if(r<R-1)HA.push(ys[r+1]-18)});HA.push(ys[R-1]+34);
 window.VA=[xs[0]-14];xs.forEach(x=>VA.push(x+18));
 window.CRP=[VA[0],HA[Math.min(1,HA.length-1)]];window.MUS={A:[VA[0],ys[R-1]+48],B:[VA[VA.length-1],ys[R-1]+48]}}
function autoP3(){const {C,R}=autoGrid();window.P3POS={};window.P3SC={};KB.sets.forEach((s,i)=>{P3POS[s.n]=[((i%C)-(C-1)/2)*11,(Math.floor(i/C)-(R-1)/2)*18];
  const k=autoKind(s.n);P3SC[s.n]=k==="comp"?1.9:k==="fan"?2.4:k==="pump"?3:autoVertical(k)?1.9:2.2})}
function autoOv(){const N=KB.sets.length,C=Math.min(6,Math.max(4,Math.ceil(N/2)));window.OVX=c=>20+c*480;window.OVY=r=>r?680:56;window.OVCOL={};KB.sets.forEach((s,i)=>{OVCOL[s.n]=[i%C,Math.floor(i/C)]});
 OV.vb=OV.vb0=[0,0,20+C*480,1070];window.OVN={};KB.sets.forEach(s=>{if(s.name.length>21)OVN[s.n]=s.name.replace(/\b(system|unit|equipment)\b/ig,'').replace(/\s+/g,' ').trim().slice(0,21)});window.OVL=[];KB.sets.forEach((s,i)=>{if(i===KB.sets.length-1)return;const t=KB.sets[i+1];OVL.push([s.tag.toLowerCase().replace(/\W/g,""),"Process stream",s.n,t.n,"proc",OVCOL[s.n][1]===OVCOL[t.n][1]?null:0,[110,60]])})}
function autoHse(){window.HSE_P={}}
function autoH3(){window.H3_EL={};KB.sets.forEach(s=>{const h=((s.ga||{}).height_mm||0)/1000;H3_EL[s.n]=h>8?+(h*.8).toFixed(1):0})}
function autoAlias(){window.SET_ALIAS={};KB.sets.forEach(s=>{const nm=String(s.name||"").toLowerCase(),a=[nm,nm.replace(/[\/\-]/g," "),String(s.tag).toLowerCase().replace(/-.*/,"")+" "+String(s.tag).toLowerCase().replace(/^[a-z]+-/,"")];
  nm.split(/[\s\/]+/).filter(w=>w.length>4&&!/system|unit|equipment|control/.test(w)).forEach(w=>{if(KB.sets.filter(o=>o.name.toLowerCase().split(/[\s\/]+/).includes(w)).length===1)a.push(w)});SET_ALIAS[s.n]=[...new Set(a)]})}
function autoEqn(){window.EQN={};KB.sets.forEach(s=>{EQN[s.n]=s.name.toUpperCase()})}
/* generic chain-reaction rules from the stream list: each stream that stops starves its receiver and blocks its sender. They are assumptions and are listed as such in the scenario register. */
function autoScn(){window.SCN_UTIL={};window.SCN_RULES=[];const num=sp=>{const m=/(-?\d+(?:\.\d+)?)\s*([A-Za-z%\/0-9]*)/.exec(String(sp||""));return m?[parseFloat(m[1]),m[2]||""]:null};
 const pick=(n,re)=>{const il=KB.IL[n]||{trig:[]},t=il.trig.filter(x=>num(x.sp));return t.find(x=>re.test(x.c+" "+x.sp))||null};
 OVL.forEach(([id,lab,a,b],i)=>{if(typeof a!=="number"||typeof b!=="number")return;const sa=autoSet(a),sb=autoSet(b);if(!sa||!sb)return;
  const lo=pick(b,/low|<|min/i),hi=pick(a,/high|>|max/i);
  if(lo){const [v,u]=num(lo.sp);SCN_RULES.push({id:"S-"+id,ev:"supply",stream:id,unit:b,tag:lo.tag,name:lo.c,dir:"low",from:+(v*1.8||1).toFixed(2),to:+(v*.4).toFixed(2),u,trip:{tag:lo.tag,lim:lo.sp},delay:4+i,why:"The stream from "+sa.tag+" to "+sb.tag+" stops, so "+lo.c.toLowerCase()+" is reached at "+sb.tag+"."})}
  if(hi){const [v,u]=num(hi.sp);SCN_RULES.push({id:"B-"+id,ev:"block",stream:id,unit:a,tag:hi.tag,name:hi.c,dir:"high",from:+(v*.6).toFixed(2),to:+(v*1.3).toFixed(2),u,trip:{tag:hi.tag,lim:hi.sp},delay:5+i,why:sb.tag+" is down and the stream from "+sa.tag+" cannot leave, so "+hi.c.toLowerCase()+" is reached at "+sa.tag+"."})}})}
