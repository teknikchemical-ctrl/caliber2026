/* =====================================================================================================
   SPI CASE: 3D MODELS OF THE EIGHT EQUIPMENT SETS (owner: Claude B)  Schematic, generated, SYNTHETIC geometry.
   Classes and the standard each layout follows (named for what it covers, no clause numbers):
     steam turbine driver  API 612, lube oil API 614, flanges ASME B16.5       sets KT-383A, KT-202
     cracking furnace      API 560 (fired heaters), refractory lining          sets BF-108, BF-110
     centrifugal pump      API 610 OH2 layout, API 682 seal and flush plan     sets PP-148A, PP-411A
     shell and tube        TEMA, API 660, ASME B16.5                           set HE-605
     control valve         ISA-75 / IEC 60534 globe valve, ASME B16.5, B16.34  set FCV-1905D
   Every real BoM line of a set is put into a ZONE by its text. A zone is one component of the machine and carries the number of its
   first BoM line as its part key, so selection, cards and tables of the equipment page keep working. Parts that match no zone go to
   "Other parts" (the baseplate or skid). Units are metres, y up, shaft or axis along x. Nothing here comes from a vendor drawing.
   ===================================================================================================== */
function spiCls(n){const M={KT:"turbine",KC:"turbine",BF:"furnace",PP:"pump",HE:"hx",FCV:"valve",PRV:"valve",PCV:"valve"},t=(((typeof S==="function"&&S(n))||{}).tag||"").toUpperCase().match(/^[A-Z]+/);return t?M[t[0]]||"":""}
/* zone id, label, standard basis, test on the part text. First match wins; the last zone catches the rest. */
function spiZoneDefs(c){return{
 turbine:[["cas","Casing joint, flanges and bolting","API 612 casing joint, ASME B16.5, B16.20",/studbolt|gasket|nut\b/i],["seal","Static seals (O-rings)","API 612 end seals and covers",/o-ring/i],["brg","Journal and thrust bearings","API 612, API 614",/bearing/i],["sg","Seal gas conditioning","API 612 seal gas",/filter element[,\s]+seal/i],["lo","Lube oil filtration","API 614",/filter element[,\s]+lube/i],["flt","Air intake and fuel gas filters","Ancillary skid, as listed in the baseline data",/filter element[,\s]+(air|fuel)/i],["ins","Instruments","ISA-5.1",/transmitter|switch|thermocouple|gauge|sensor/i],["oth","Other parts","Baseplate and skid",/./]],
 furnace:[["ref","Refractory lining (castable, firebrick)","API 560 refractory",/castable|firebrick|brick/i],["fib","Ceramic fibre insulation","API 560 insulation",/ceramic fib|blanket/i],["anc","Anchors and lining fasteners","API 560 refractory anchors",/anchor|screw/i],["coil","Coil and transfer piping","API 560 tubes, ASME B31.3",/^pipe|^elbow|^tee|^reducer/i],["vlv","Isolation valves","ASME B16.34",/^valve/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/studbolt|gasket/i],["oth","Other parts","Structure and platforms",/./]],
 pump:[["fl","Casing flanges and bolting","API 610, ASME B16.5",/studbolt|gasket/i],["brg","Bearing housing","API 610",/bearing/i],["seal","Mechanical seal and O-rings","API 682",/seal[,\s]+mechanical|o-ring/i],["imp","Impeller","API 610",/impeller/i],["wr","Wear rings","API 610",/ring[,\s]+wear|wear ring/i],["cp","Coupling","API 610, coupling guard",/coupling/i],["oth","Other parts","Baseplate",/./]],
 hx:[["tube","Tubes and piping","TEMA, API 660",/^pipe|^tube/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/studbolt|gasket/i],["oth","Other parts","Shell, supports",/./]],
 valve:[["fl","Body flanges and bolting","ASME B16.5, B16.34",/studbolt|gasket/i],["trim","Trim and seat ring","ISA-75, IEC 60534",/trim set|seat ring/i],["pk","Packing","IEC 60534",/packing/i],["act","Actuator diaphragm","ISA-75",/diaphragm|actuator|spring/i],["pos","Positioner","ISA-75, ISA-5.1",/positioner/i],["oth","Other parts","Body and yoke",/./]]}[c]||[]}
/* nozzle schedule per class. Sizes and ratings are not in the baseline data and are left as such. */
function spiNozzles(c){const r="Flange facing and rating not stated; drawn as an ASME B16.5 flange (schematic)",N=(m,sv)=>({m,sv,sz:"Not in baseline data",r});
 return{turbine:[N("N1","HP steam inlet"),N("N2","Exhaust"),N("N3","Gland leak-off"),N("N4","Casing drain"),N("N5","Lube oil supply")],
  furnace:[N("N1","Process feed inlet"),N("N2","Cracked gas outlet"),N("N3","Fuel gas to burners")],
  pump:[N("N1","Suction"),N("N2","Discharge"),N("N3","Seal flush"),N("N4","Casing drain")],
  hx:[N("N1","Shell side inlet"),N("N2","Shell side outlet"),N("N3","Tube side inlet"),N("N4","Tube side outlet"),N("N5","Vent"),N("N6","Drain")],
  valve:[N("N1","Inlet"),N("N2","Outlet"),N("N3","Instrument air to positioner")]}[c]||[]}
/* zones of one set: {n, cls, zones:[{id,label,ref,lines,key}], key:{id:key}, line2zone:{line:zone}} */
function spiPrep(n){window.SPIP=window.SPIP||{};if(SPIP[n])return SPIP[n];const cls=spiCls(n);if(!cls)return null;
 const bom=(GA[n]&&GA[n].bom)||[],zones=spiZoneDefs(cls).map(d=>({id:d[0],label:d[1],ref:d[2],re:d[3],lines:[]}));
 bom.forEach((b,i)=>{const z=zones.find(q=>q.re.test(b.name||""))||zones[zones.length-1];z.lines.push(i+1)});
 const key={},line2zone={};zones.forEach(z=>{z.key=z.lines.length?String(z.lines[0]):"";key[z.id]=z.key;z.lines.forEach(l=>line2zone[l]=z)});
 if(GA[n])GA[n].nz=spiNozzles(cls);
 return SPIP[n]={n,cls,zones,key,line2zone}}
const spiBolts=(k,ax,x,y,z,R,N,len,r)=>Array.from({length:N},(_,i)=>{const t=i/N*Math.PI*2,u=Math.cos(t)*R,v=Math.sin(t)*R;return g3C(k,ax,ax==="x"?x:x+u,ax==="y"?y:ax==="x"?y+u:y+v,ax==="z"?z:ax==="x"?z+v:z+v,len,r,"steel",{m:.7,seg:8})});
/* ---------- pump, API 610 OH2 (end suction, top discharge, centreline supported) with API 682 seal, plan 11 flush ---------- */
function spiPump(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,cy=.62,a=[];
 a.push(B(k("oth"),.2,.09,0,3.7,.18,.95,"gray",{r:.04}),B("",.2,.012,0,3.8,.03,1.05,"dark",{r:.04,zb:.6}));
 a.push(B("",-.9,.32,0,.5,.28,.6,"gray",{r:.03}),B("",-.15,.34,0,.3,.32,.4,"gray",{r:.03}),B("",1.35,.3,0,1.0,.24,.5,"gray",{r:.03}));
 a.push(C("","x",-.9,cy,0,.44,.37,"paint",{sh:1,m:.5}),C("","x",-.62,cy,0,.2,.27,"paint",{sh:1,m:.5}));
 a.push(C("N1","x",-1.3,cy,0,.4,.11,"amber"),C("N2","y",-.9,cy+.5,0,.55,.09,"amber"),C("N3","y",-.5,cy+.3,0,.2,.03,"amber"),C("N4","y",-.9,cy-.45,.0,.2,.04,"amber"));
 a.push(C(k("fl"),"x",-1.36,cy,0,.05,.2,"steel",{m:.7}),...spiBolts(k("fl"),"x",-1.36,cy,0,.16,8,.09,.017),C(k("fl"),"y",-.9,cy+.72,0,.05,.17,"steel",{m:.7}),...spiBolts(k("fl"),"y",-.9,cy+.72,0,.135,8,.09,.015),C(k("fl"),"x",-.68,cy,0,.05,.38,"steel",{m:.7}),...spiBolts(k("fl"),"x",-.68,cy,0,.33,12,.09,.014));
 a.push(C(k("imp"),"x",-.9,cy,0,.2,.26,"cat",{in:1}));
 a.push(C(k("wr"),"x",-1.05,cy,0,.03,.29,"brass",{in:1}),C(k("wr"),"x",-.76,cy,0,.03,.29,"brass",{in:1}));
 a.push(C(k("seal"),"x",-.5,cy,0,.14,.23,"brass",{m:.7}),C(k("seal"),"x",-.52,cy,0,.2,.13,"steel",{in:1}),C("","y",-.5,cy+.5,0,.4,.018,"steel",{m:.6}),C("","x",-.7,cy+.7,0,.4,.018,"steel",{m:.6}));
 a.push(C(k("brg"),"x",-.15,cy,0,.5,.16,"steel",{m:.6}),C(k("brg"),"x",-.4,cy,0,.05,.2,"steel"),C(k("brg"),"x",.1,cy,0,.05,.2,"steel"),C(k("brg"),"y",-.15,cy-.22,0,.12,.045,"water",{m:.2}));
 a.push(C("","x",.2,cy,0,.28,.05,"dark"),C(k("cp"),"x",.3,cy,0,.34,.1,"red",{m:.4}),C(k("cp"),"x",.16,cy,0,.12,.14,"steel"),C(k("cp"),"x",.44,cy,0,.12,.14,"steel"),B("",.3,cy+.19,0,.46,.025,.26,"gray",{r:.01}),C("","x",.55,cy,0,.14,.05,"dark"));
 a.push(...g3Motor("",1.35,cy,0,1.0,.27));
 return a}
/* ---------- steam turbine driver, API 612 horizontal split casing, API 614 lube oil console ---------- */
function spiTurbine(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,cy=.95,a=[];
 a.push(B(k("oth"),.2,.1,.1,4.6,.2,1.9,"gray",{r:.05}),B("",.2,.012,.1,4.7,.03,2.0,"dark",{r:.05,zb:.7}));
 a.push(B("",-1.1,.4,0,.45,.4,.5,"gray",{r:.03}),B("",1.15,.4,0,.45,.4,.5,"gray",{r:.03}),B("",0,.4,.0,.9,.4,.6,"gray",{r:.03}));
 a.push(C("","x",0,cy,0,1.6,.5,"paint",{sh:1,m:.5}),B("",-.3,cy+.62,0,.55,.4,.5,"paint",{sh:1,r:.06,m:.5}));
 a.push(B(k("cas"),0,cy,0,1.7,.07,1.12,"steel",{r:.02,m:.7}),...[...Array(8).keys()].flatMap(i=>[-1,1].map(s=>C(k("cas"),"y",-.7+i*.2,cy+.05,s*.535,.1,.03,"steel",{m:.7,seg:8}))));
 a.push(C("N1","y",-.3,cy+1.0,0,.3,.1,"amber"),C("N2","y",.55,cy+.6,0,.7,.22,"amber"),C("N3","y",-.75,cy+.6,0,.4,.06,"amber"),C("N4","z",.2,cy-.3,.6,.45,.05,"amber"),C("N5","y",-1.1,cy+.45,.15,.3,.05,"amber"));
 a.push(C("","z",-.3,cy+.62,.45,.4,.07,"dark"),B("",-.3,cy+.62,.78,.3,.3,.3,"blue",{r:.04}));
 a.push(C(k("brg"),"x",-1.1,cy,0,.5,.3,"steel",{m:.6}),C(k("brg"),"x",-1.37,cy,0,.06,.34,"steel"),C(k("brg"),"x",1.15,cy,0,.55,.33,"steel",{m:.6}),C(k("brg"),"x",1.45,cy,0,.06,.37,"steel"),C(k("brg"),"y",-1.1,cy+.42,0,.2,.04,"brass"));
 a.push(C(k("seal"),"x",-.83,cy,0,.1,.37,"brass",{m:.7}),C(k("seal"),"x",.83,cy,0,.1,.37,"brass",{m:.7}));
 a.push(C("","x",1.55,cy,0,.2,.05,"dark"),C("","x",1.8,cy,0,.5,.07,"red"),B("",1.8,cy+.2,0,.7,.02,.3,"gray",{r:.01}),B("",2.15,cy,0,.1,.4,.4,"gray",{r:.03}));
 /* seal gas conditioning panel: duplex filters with a manifold */
 a.push(C(k("sg"),"y",-1.5,.6,.75,.8,.1,"blue",{m:.5}),C(k("sg"),"y",-1.2,.6,.75,.8,.1,"blue",{m:.5}),C(k("sg"),"x",-1.35,.98,.75,.5,.03,"steel"));
 /* lube oil console: reservoir with duplex filters */
 a.push(B("",1.35,.45,.62,1.0,.5,.55,"paint",{r:.05,m:.4}),C(k("lo"),"y",1.1,.97,.62,.5,.1,"blue",{m:.5}),C(k("lo"),"y",1.45,.97,.62,.5,.1,"blue",{m:.5}),C("","x",1.275,1.2,.62,.35,.03,"steel"));
 /* air intake and fuel gas filter housing (listed in the baseline data) */
 a.push(B(k("flt"),-1.3,.6,-.7,.7,.8,.5,"paint",{r:.05,m:.4}),C(k("flt"),"y",-1.5,1.15,-.7,.35,.1,"steel",{m:.6}),C(k("flt"),"y",-1.1,1.15,-.7,.35,.1,"steel",{m:.6}));
 /* instrument stand with transmitter */
 a.push(C("","y",.8,.65,.7,.9,.03,"gray"),B(k("ins"),.8,1.18,.7,.22,.3,.18,"blue",{r:.03}));
 return a}
/* ---------- cracking furnace, API 560 style, cutaway: front wall open so the lining zones, coil and burners show ---------- */
function spiFurnace(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 [-1,1].forEach(sx=>[-1,1].forEach(sz=>a.push(C("","y",sx*1.65,2.7,sz*1.3,5.4,.1,"dark"),C("","y",sx*1.65,.02,sz*1.3,.04,.2,"dark",{zb:.5}))));
 a.push(B(k("oth"),0,1.0,0,3.5,.16,2.8,"gray",{r:.03}),B(k("oth"),0,5.0,0,3.5,.16,2.8,"gray",{r:.03}),B(k("oth"),0,3.0,-1.35,3.5,.1,.1,"dark"),B(k("oth"),0,3.0,1.35,3.5,.1,.1,"dark"));
 a.push(B(k("ref"),0,1.25,0,3.0,.25,2.4,"cat",{r:.02}),B(k("ref"),0,3.15,-1.1,3.0,3.8,.2,"cat",{r:.02}),B(k("ref"),-1.4,3.15,0,.2,3.8,2.4,"cat",{r:.02}),B(k("ref"),1.4,3.15,0,.2,3.8,2.4,"cat",{r:.02}));
 a.push(B(k("fib"),0,5.2,0,3.0,.25,2.4,"white",{r:.02}),B(k("fib"),-.5,5.95,0,2.0,1.25,2.0,"white",{r:.03}));
 for(let r=0;r<3;r++)for(let c=0;c<4;c++)a.push(C(k("anc"),"z",-1.05+c*.7,2.0+r*.9,-.93,.1,.025,"steel",{seg:8}));
 [-.9,-.3,.3,.9].forEach(x=>a.push(C(k("coil"),"y",x,3.15,.1,3.7,.065,"red",{m:.5})));
 a.push(C(k("coil"),"x",0,1.55,.1,2.1,.075,"red",{m:.5}),C(k("coil"),"x",0,4.85,.1,2.1,.075,"red",{m:.5}),...[0,1,2].map(r=>C(k("coil"),"x",-.5,5.5+r*.3,0,1.8,.05,"red",{in:1})));
 [-.8,0,.8].forEach(x=>a.push(C("","y",x,1.4,.1,.2,.12,"dark"),C("","y",x,1.52,.1,.05,.09,"amber",{light:1,seg:10})));
 a.push(C("N1","x",-2.2,4.85,.1,1.2,.1,"amber"),C("N2","x",1.8,1.55,.1,1.8,.1,"amber"),C("N3","x",2.0,1.9,.7,1.1,.07,"amber"));
 a.push(C(k("fl"),"x",-1.62,4.85,.1,.06,.2,"steel",{m:.7}),...spiBolts(k("fl"),"x",-1.62,4.85,.1,.16,8,.1,.017),C(k("fl"),"x",1.0,1.55,.1,.06,.2,"steel",{m:.7}),...spiBolts(k("fl"),"x",1.0,1.55,.1,.16,8,.1,.017));
 a.push(B(k("vlv"),-2.1,4.85,.1,.4,.3,.3,"steel",{r:.05,m:.6}),C(k("vlv"),"y",-2.1,5.15,.1,.35,.05,"steel"),C(k("vlv"),"y",-2.1,5.38,.1,.03,.2,"red"));
 a.push(C("","y",-.5,7.8,0,2.9,.4,"steel",{m:.6},.34),C("","y",-.5,9.3,0,.1,.44,"steel"));
 a.push(B("",0,3.1,1.55,3.4,.05,.6,"gray",{r:.01}),...[-1.6,-.5,.5,1.6].map(x=>B("",x,3.6,1.82,.04,1.0,.04,"gray")),B("",0,4.1,1.82,3.4,.04,.04,"gray"));
 return a}
/* ---------- shell and tube exchanger, TEMA type AES style, two tube passes, API 660 ---------- */
function spiHx(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,E=g3E,cy=1.1,a=[];
 a.push(B(k("oth"),-1.0,.3,0,.4,.6,.8,"gray",{r:.04}),B(k("oth"),1.0,.3,0,.4,.6,.8,"gray",{r:.04}),B("",-1.0,.012,0,.6,.03,1.0,"dark",{zb:.5}),B("",1.0,.012,0,.6,.03,1.0,"dark",{zb:.5}));
 a.push(C(k("oth"),"x",0,cy,0,3.2,.5,"paint",{sh:1,m:.5}),C("","x",-1.85,cy,0,.5,.5,"paint",{sh:1,m:.5}),C("","x",-2.14,cy,0,.08,.52,"steel",{m:.7}),E("","x",1.6,cy,0,.4,.5,"paint",0,Math.PI/2,{sh:1,m:.5}));
 a.push(C(k("fl"),"x",-1.6,cy,0,.07,.62,"steel",{m:.7}),...spiBolts(k("fl"),"x",-1.6,cy,0,.56,16,.15,.022),C(k("fl"),"x",1.6,cy,0,.07,.62,"steel",{m:.7}),...spiBolts(k("fl"),"x",1.6,cy,0,.56,16,.15,.022));
 [[-.18,0],[.18,0],[0,.2],[0,-.2],[-.3,.12],[.3,-.12],[.3,.12],[-.3,-.12]].forEach(([dy,dz])=>a.push(C(k("tube"),"x",0,cy+dy,dz,3.0,.035,"steel",{in:1,seg:10})));
 a.push(C("","x",-1.6,cy,0,.06,.48,"steel",{in:1}),C("","x",1.6,cy,0,.06,.48,"steel",{in:1}),...[-1,-.3,.4,1.1].map(x=>C("","x",x,cy,0,.03,.44,"gray",{in:1})));
 a.push(C("N1","y",-.9,cy+.75,0,.5,.12,"amber"),C("N2","y",.9,cy-.75,0,.5,.12,"amber"),C("N3","y",-1.85,cy+.7,0,.45,.1,"amber"),C("N4","y",-1.85,cy-.7,0,.45,.1,"amber"),C("N5","y",.4,cy+.6,0,.2,.03,"amber"),C("N6","y",-.4,cy-.6,0,.2,.03,"amber"));
 a.push(B("",0,cy+.52,.0,.2,.05,.12,"steel",{r:.01}));
 return a}
/* ---------- control valve, globe body, bonnet, yoke, diaphragm actuator and positioner (ISA-75 / IEC 60534 style) ---------- */
function spiValve(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,E=g3E,cy=.45,a=[];
 a.push(C("","x",0,cy,0,.8,.17,"paint",{sh:1,m:.5}),E("","y",0,cy,0,.3,.26,"paint",0,Math.PI,{sh:1,m:.5}));
 a.push(C("N1","x",-.8,cy,0,.9,.13,"amber"),C("N2","x",.8,cy,0,.9,.13,"amber"),C("N3","y",.55,1.78,.2,.2,.03,"amber"));
 a.push(B(k("oth"),-1.1,.2,0,.2,.4,.2,"gray",{r:.02}),B(k("oth"),1.1,.2,0,.2,.4,.2,"gray",{r:.02}));
 a.push(C(k("fl"),"x",-.3,cy,0,.06,.22,"steel",{m:.7}),C(k("fl"),"x",.3,cy,0,.06,.22,"steel",{m:.7}),...spiBolts(k("fl"),"x",-.3,cy,0,.17,8,.1,.015),...spiBolts(k("fl"),"x",.3,cy,0,.17,8,.1,.015),C(k("fl"),"y",0,.76,0,.05,.2,"steel",{m:.7}),...spiBolts(k("fl"),"y",0,.76,0,.16,6,.09,.014));
 a.push(C("","y",0,.95,0,.4,.11,"steel",{m:.6}),C(k("pk"),"y",0,1.2,0,.18,.08,"brass",{m:.7}),C(k("pk"),"y",0,1.3,0,.04,.14,"steel"));
 a.push(C(k("trim"),"y",0,.8,0,.9,.025,"steel",{in:1,seg:10}),C(k("trim"),"y",0,.52,0,.12,.1,"brass",{in:1}),C(k("trim"),"y",0,.4,0,.05,.15,"steel",{in:1}));
 a.push(B("",-.18,1.5,0,.05,.5,.08,"steel",{r:.01}),B("",.18,1.5,0,.05,.5,.08,"steel",{r:.01}));
 a.push(C(k("act"),"y",0,1.95,0,.45,.35,"blue",{sh:1,m:.4}),E(k("act"),"y",0,2.17,0,.14,.35,"blue",0,Math.PI/2,{sh:1,m:.4}),C(k("act"),"y",0,2.0,0,.04,.38,"steel",{m:.7}),...spiBolts(k("act"),"y",0,2.0,0,.34,10,.07,.014),C("","y",0,2.38,0,.05,.05,"steel"));
 a.push(B("",.35,1.5,.1,.3,.03,.06,"steel",{r:.005}),B(k("pos"),.55,1.55,.2,.26,.3,.2,"black",{r:.03}),C("","x",.38,1.85,.2,.4,.012,"steel"));
 return a}
{const f={turbine:spiTurbine,furnace:spiFurnace,pump:spiPump,hx:spiHx,valve:spiValve};
 KB.sets.forEach(s=>{const c=spiCls(s.n);if(c&&f[c]){spiPrep(s.n);G3M[s.n]=f[c](s.n).map(q=>{q.z=-q.z;return q})}else G3M[s.n]=autoG3m(s.n)});
 /* floating parts get short necks, computed the first time a model is drawn (not at start-up). The necks of the first plant do not apply. */
 Object.keys(G3NECK).forEach(q=>delete G3NECK[q]);
 KB.sets.forEach(s=>{if(!spiCls(s.n))return;Object.defineProperty(G3NECK,s.n,{configurable:true,enumerable:true,get(){const pr=(G3M[s.n]||[]),v=g3BridgeCalc(pr.concat(g3Extra(pr))).map(x=>[x.k,x.ax,x.x,x.y,x.z,x.len,x.r]);Object.defineProperty(G3NECK,s.n,{value:v,configurable:true,enumerable:true});return v}})})}
