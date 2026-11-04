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
function spiCls(n){if(window.SPIDYN&&SPIDYN[n])return SPIDYN[n].cls;return spiClsOf((((typeof S==="function"&&S(n))||{}).tag||"").toUpperCase().match(/^[A-Z]+/))}
function spiClsOf(t){const M={KT:"turbine",KC:"blower",BF:"furnace",PP:"pump",HE:"hx",FCV:"valve",PCV:"valve",LCV:"valve",TCV:"valve",PRV:"prv",SDV:"sdv",MOV:"mov",VD:"vessel",CL:"column",TEL:"instr",TIT:"instr",PIT:"instr",FIT:"instr",LIT:"instr",DPT:"instr",PGI:"instr",ROF:"orifice",JBX:"jbox",LINE:"line"};t=Array.isArray(t)?t[0]:t;return t?M[t]||"":""}
/* zone id, label, standard basis, test on the part text. First match wins; the last zone catches the rest. */
function spiZoneDefs(c){return Object.assign({},SPI_ZX(),{
 turbine:[["cas","Casing joint, flanges and bolting","Turbine driver casing (API 612 layout assumed), ASME B16.5, B16.20",/studbolt|gasket|nut\b/i],["seal","Static seals (O-rings)","API 612 end seals and covers",/o-ring/i],["brg","Journal and thrust bearings","API 612, API 614",/bearing/i],["sg","Seal gas conditioning","API 612 seal gas",/filter element[,\s]+seal/i],["lo","Lube oil filtration","API 614",/filter element[,\s]+lube/i],["flt","Air intake and fuel gas filters","Ancillary skid, as listed in the baseline data",/filter element[,\s]+(air|fuel)/i],["ins","Instruments","ISA-5.1",/transmitter|switch|thermocouple|gauge|sensor/i],["oth","Other parts","Baseplate and skid",/./]],
 furnace:[["ref","Refractory lining (castable, firebrick)","API 560 refractory",/castable|firebrick|brick/i],["fib","Ceramic fibre insulation","API 560 insulation",/ceramic fib|blanket/i],["anc","Anchors and lining fasteners","API 560 refractory anchors",/anchor|screw/i],["coil","Coil and transfer piping","API 560 tubes, ASME B31.3",/^pipe|^elbow|^tee|^reducer/i],["vlv","Isolation valves","ASME B16.34",/^valve/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/studbolt|gasket/i],["oth","Other parts","Structure and platforms",/./]],
 pump:[["fl","Casing flanges and bolting","API 610, ASME B16.5",/studbolt|gasket/i],["brg","Bearing housing","API 610",/bearing/i],["seal","Mechanical seal and O-rings","API 682",/seal[,\s]+mechanical|o-ring/i],["imp","Impeller","API 610",/impeller/i],["wr","Wear rings","API 610",/ring[,\s]+wear|wear ring/i],["cp","Coupling","API 610, coupling guard",/coupling/i],["oth","Other parts","Baseplate",/./]],
 hx:[["tube","Tube bundle (tube plugs)","TEMA, API 660",/tube plug|^tube/i],["pip","Connection piping","ASME B31.3, B36.10M",/^pipe/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/studbolt|gasket/i],["oth","Other parts","Shell, supports",/./]],
 valve:[["fl","Body flanges and bolting","ASME B16.5, B16.34",/studbolt|gasket/i],["trim","Trim and seat ring","ISA-75, IEC 60534",/trim set|seat ring/i],["pk","Packing","IEC 60534",/packing/i],["act","Actuator diaphragm","ISA-75",/diaphragm|actuator|spring/i],["pos","Positioner","ISA-75, ISA-5.1",/positioner/i],["oth","Other parts","Body and yoke",/./]]})[c]||[]}
function SPI_ZX(){const V=[["fl","Body flanges and bolting","ASME B16.5, B16.34",/studbolt|gasket/i],["trim","Trim and seat ring","ISA-75, IEC 60534",/trim set|seat ring/i],["pk","Packing","IEC 60534",/packing/i],["act","Actuator diaphragm","ISA-75",/diaphragm|actuator/i],["pos","Positioner","ISA-75, ISA-5.1",/positioner/i],["oth","Other parts","Body and yoke",/./]];
 return{valve:V,
  prv:[["noz","Nozzle","API 520, API 526",/nozzle/i],["disc","Disc and seat","API 520, API 526",/disc/i],["spr","Spring","API 520, API 526",/spring/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/studbolt|gasket/i],["oth","Other parts","Body and bonnet",/./]],
  sdv:[["sol","Solenoid valve","IEC 61511, ISA-84",/solenoid/i],["swt","Limit switches","ISA-5.1",/switch/i],["pk","Packing","API 622, ISO 15848",/packing/i],["seal","Static seals (O-rings)","ISO 3601",/o-ring/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/studbolt|gasket/i],["oth","Other parts","Body and actuator",/./]],
  mov:[["swt","Limit and torque switches","ISA-5.1, IEC 60947",/switch/i],["pk","Packing","API 622, ISO 15848",/packing/i],["lub","Lubricant","Gearbox and stem",/grease|oil/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/studbolt|gasket/i],["oth","Other parts","Body and actuator",/./]],
  vessel:[["dem","Demister and screens","Vessel internals, mesh pad",/demister|screen/i],["fl","Manway and flanged joints","ASME B16.5, B16.20",/studbolt|gasket|flange/i],["vlv","Drain and vent valves","ASME B16.34",/^valve/i],["ins","Instruments","ISA-5.1",/transmitter|gauge|thermo|switch/i],["oth","Other parts","Shell, supports",/./]],
  column:[["trv","Tray valves","Column internals",/tray valve/i],["dem","Demister pad and screens","Column internals",/demister|screen/i],["fl","Manways and flanged joints","ASME B16.5, B16.20",/studbolt|gasket|flange/i],["vlv","Valves","ASME B16.34",/^valve/i],["oth","Other parts","Shell, supports",/./]],
  instr:[["sens","Sensor and thermowell","IEC 60584, ASME PTC 19.3 TW",/thermo/i],["txm","Transmitter","ISA-5.1, IEC 61298",/transmitter/i],["gauge","Gauge","ASME B40.100",/gauge/i],["conn","Connections, valves and tubing","ASME B16.11, ISA-5.1",/connector|tubing|gland|^valve/i],["oth","Other parts","Pipe tapping",/./]],
  blower:[["brg","Bearings","API 617, API 614",/bearing/i],["seal","Shaft seals","API 617",/seal/i],["cp","Coupling","API 671",/coupling/i],["lub","Lube oil","API 614",/^oil/i],["flt","Filters","ISO 2941",/filter element/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/studbolt|gasket|o-ring/i],["oth","Other parts","Baseplate and motor",/./]],
  orifice:[["fl","Flanges, bolting and gaskets","ASME B16.5, B16.36",/studbolt|gasket|flange/i],["oth","Other parts","Orifice plate",/./]],
  jbox:[["gland","Cable glands","IEC 60079-14, IEC 62444",/gland/i],["term","Terminals","IEC 60947-7",/terminal/i],["cab","Cable","IEC 60228",/cable/i],["scr","Screws","Enclosure",/screw/i],["oth","Other parts","Enclosure",/./]],
  line:[["pipe","Pipe","ASME B36.10M, B31.3",/^pipe/i],["fit","Fittings","ASME B16.9, B16.11",/elbow|tee/i],["fl","Flanges, bolting and gaskets","ASME B16.5, B16.20",/studbolt|gasket|flange/i],["vlv","Valves","ASME B16.34",/^valve/i],["coat","Coating and tape","Protective coating",/antirust|tape/i],["oth","Other parts","Supports",/./]],
  motor:[["brg","Bearings","IEC 60034, ISO 15",/bearing/i],["fan","Cooling fan","IEC 60034-6",/^fan/i],["tb","Terminal box","IEC 60034-8",/terminal/i],["gl","Cable glands","IEC 62444",/gland/i],["gr","Grease","NLGI grade",/grease/i],["oth","Other parts","Frame and base",/./]],
  cstation:[["lamp","Indicator lamps","IEC 60947-5-1",/lamp/i],["sw","Switches","IEC 60947-5-1",/switch/i],["tb","Terminals","IEC 60947-7",/terminal/i],["gl","Cable glands","IEC 62444",/gland/i],["oth","Other parts","Enclosure and post",/./]],
  foundation:[["bolt","Anchor bolts","Anchoring to concrete",/bolt/i],["oth","Other parts","Concrete block",/./]],
  burner:[["bt","Burner tips","API 535",/burner tip/i],["ref","Refractory (brick, castable, fibre)","API 560",/firebrick|castable|ceramic fib/i],["tc","Thermocouples and thermowells","IEC 60584, ASME PTC 19.3 TW",/thermo/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/gasket|studbolt/i],["oth","Other parts","Casing and support",/./]],peepdoor:[["bt","Burner tips","API 535",/burner tip/i],["ref","Refractory (brick, castable, fibre)","API 560",/firebrick|castable|ceramic fib/i],["tc","Thermocouples and thermowells","IEC 60584, ASME PTC 19.3 TW",/thermo/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/gasket|studbolt/i],["oth","Other parts","Casing and support",/./]],convsec:[["bt","Burner tips","API 535",/burner tip/i],["ref","Refractory (brick, castable, fibre)","API 560",/firebrick|castable|ceramic fib/i],["tc","Thermocouples and thermowells","IEC 60584, ASME PTC 19.3 TW",/thermo/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/gasket|studbolt/i],["oth","Other parts","Casing and support",/./]],qfit:[["bt","Burner tips","API 535",/burner tip/i],["ref","Refractory (brick, castable, fibre)","API 560",/firebrick|castable|ceramic fib/i],["tc","Thermocouples and thermowells","IEC 60584, ASME PTC 19.3 TW",/thermo/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/gasket|studbolt/i],["oth","Other parts","Casing and support",/./]],dsteam:[["bt","Burner tips","API 535",/burner tip/i],["ref","Refractory (brick, castable, fibre)","API 560",/firebrick|castable|ceramic fib/i],["tc","Thermocouples and thermowells","IEC 60584, ASME PTC 19.3 TW",/thermo/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/gasket|studbolt/i],["oth","Other parts","Casing and support",/./]],coilout:[["bt","Burner tips","API 535",/burner tip/i],["ref","Refractory (brick, castable, fibre)","API 560",/firebrick|castable|ceramic fib/i],["tc","Thermocouples and thermowells","IEC 60584, ASME PTC 19.3 TW",/thermo/i],["fl","Flanged joints and bolting","ASME B16.5, B16.20",/gasket|studbolt/i],["oth","Other parts","Casing and support",/./]]}}
/* nozzle schedule per class. Sizes and ratings are not in the baseline data and are left as such. */
function spiNozzles(c){const N=(m,sv)=>({m,sv,sz:"Not in baseline data",r:""});
 return{turbine:[N("N1","HP steam inlet"),N("N2","Exhaust"),N("N3","Gland leak-off"),N("N4","Casing drain"),N("N5","Lube oil supply")],
  furnace:[N("N1","Process feed inlet"),N("N2","Cracked gas outlet"),N("N3","Fuel gas to burners")],
  pump:[N("N1","Suction"),N("N2","Discharge"),N("N3","Seal flush"),N("N4","Casing drain")],
  hx:[N("N1","Shell side inlet"),N("N2","Shell side outlet"),N("N3","Tube side inlet"),N("N4","Tube side outlet"),N("N5","Vent"),N("N6","Drain")],
  valve:[N("N1","Inlet"),N("N2","Outlet"),N("N3","Instrument air to positioner")],prv:[N("N1","Inlet (process)"),N("N2","Outlet (to flare or header)")],sdv:[N("N1","Inlet"),N("N2","Outlet"),N("N3","Instrument air to solenoid")],mov:[N("N1","Inlet"),N("N2","Outlet")],vessel:[N("N1","Feed inlet"),N("N2","Vapour outlet"),N("N3","Liquid outlet"),N("N4","Level instrument connection")],column:[N("N1","Feed inlet"),N("N2","Overhead vapour outlet"),N("N3","Bottoms outlet"),N("N4","Reflux return")],instr:[N("N1","Process tapping")],blower:[N("N1","Suction"),N("N2","Discharge")],orifice:[N("N1","Upstream tapping"),N("N2","Downstream tapping")],jbox:[],line:[N("N1","Upstream end"),N("N2","Downstream end")]}[c]||[]}
/* zones of one set: {n, cls, zones:[{id,label,ref,lines,key}], key:{id:key}, line2zone:{line:zone}} */
function spiPrep(n){window.SPIP=window.SPIP||{};if(SPIP[n])return SPIP[n];const cls=spiCls(n);if(!cls)return null;
 const bom=(GA[n]&&GA[n].bom)||[],zones=spiZoneDefs(cls).map(d=>({id:d[0],label:d[1],ref:d[2],re:d[3],lines:[]}));
 bom.forEach((b,i)=>{const z=zones.find(q=>q.re.test(b.name||""))||zones[zones.length-1];z.lines.push(i+1)});
 const key={},line2zone={};zones.forEach(z=>{z.key=z.lines.length?String(z.lines[0]):"";key[z.id]=z.key;z.lines.forEach(l=>line2zone[l]=z)});
 if(GA[n])GA[n].nz=spiNozzles(cls);
 return SPIP[n]={n,cls,zones,key,line2zone}}
const spiBolts=(k,ax,x,y,z,R,N,len,r)=>Array.from({length:N},(_,i)=>{const t=i/N*Math.PI*2,u=Math.cos(t)*R,v=Math.sin(t)*R;return g3C(k,ax,ax==="x"?x:x+u,ax==="y"?y:ax==="x"?y+u:y+v,ax==="z"?z:ax==="x"?z+v:z+v,len,r,"steel",{m:.7,seg:8})});
/* bounding box of the model of a set, metres: {mn:[x,y,z], mx:[x,y,z]} (cheap: from the primitives, no meshing) */
function spiBBox(n){window.SPIB=window.SPIB||{};if(SPIB[n])return SPIB[n];const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
 (G3M[n]||[]).forEach(p=>{if(p.t==="s"){p.pts.forEach(q=>[0,1,2].forEach(i=>{mn[i]=Math.min(mn[i],q[i]-p.r);mx[i]=Math.max(mx[i],q[i]+p.r)}));return}const m=Math.max(p.r||0,p.r2||0),h=p.t==="r"?[p.w/2,p.h/2,p.d/2]:(p.t==="c"||p.t==="a")?(p.ax==="x"?[p.len/2,m,m]:p.ax==="y"?[m,p.len/2,m]:[m,m,p.len/2]):(p.ax==="x"?[p.ra,p.rb,p.rb]:p.ax==="y"?[p.rb,p.ra,p.rb]:[p.rb,p.rb,p.ra]);[p.x,p.y,p.z].forEach((c,i)=>{mn[i]=Math.min(mn[i],c-h[i]);mx[i]=Math.max(mx[i],c+h[i])})});
 return SPIB[n]={mn,mx}}
/* ---------- pump, API 610 OH2 (end suction, top discharge, centreline supported) with API 682 seal, plan 11 flush ---------- */
function spiPump(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,cy=.62,a=[];
 a.push(B(k("oth"),.2,.09,0,3.7,.18,.95,"gray",{r:.04}),B("@foundation",.2,.012,0,3.8,.03,1.05,"#b9b3a6",{r:.04,zb:.6}));
 a.push(B("",-.9,.32,0,.5,.28,.6,"gray",{r:.03}),B("",-.15,.34,0,.3,.32,.4,"gray",{r:.03}),B("",1.35,.3,0,1.0,.24,.5,"gray",{r:.03}));
 a.push(C("","x",-.9,cy,0,.44,.37,"paint",{sh:1,m:.5}),C("","x",-.62,cy,0,.2,.27,"paint",{sh:1,m:.5}));
 a.push(C("N1","x",-1.3,cy,0,.4,.11,"amber"),C("N2","y",-.9,cy+.5,0,.55,.09,"amber"),C("N3","y",-.5,cy+.3,0,.2,.03,"amber"),C("N4","y",-.9,cy-.45,.0,.2,.04,"amber"));
 a.push(C(k("fl"),"x",-1.36,cy,0,.05,.2,"steel",{m:.7}),...spiBolts(k("fl"),"x",-1.36,cy,0,.16,8,.09,.017),C(k("fl"),"y",-.9,cy+.72,0,.05,.17,"steel",{m:.7}),...spiBolts(k("fl"),"y",-.9,cy+.72,0,.135,8,.09,.015),C(k("fl"),"x",-.68,cy,0,.05,.38,"steel",{m:.7}),...spiBolts(k("fl"),"x",-.68,cy,0,.33,12,.09,.014));
 a.push(C(k("imp"),"x",-.9,cy,0,.2,.26,"cat",{in:1}));
 a.push(C(k("wr"),"x",-1.05,cy,0,.03,.29,"brass",{in:1}),C(k("wr"),"x",-.76,cy,0,.03,.29,"brass",{in:1}));
 a.push(C(k("seal"),"x",-.5,cy,0,.14,.23,"brass",{m:.7}),C(k("seal"),"x",-.52,cy,0,.2,.13,"steel",{in:1}),C("","y",-.5,cy+.5,0,.4,.018,"steel",{m:.6}),C("","x",-.7,cy+.7,0,.4,.018,"steel",{m:.6}));
 a.push(C(k("brg"),"x",-.15,cy,0,.5,.16,"steel",{m:.6}),C(k("brg"),"x",-.4,cy,0,.05,.2,"steel"),C(k("brg"),"x",.1,cy,0,.05,.2,"steel"),C(k("brg"),"y",-.15,cy-.22,0,.12,.045,"water",{m:.2}));
 a.push(C("","x",.2,cy,0,.28,.05,"dark"),C(k("cp"),"x",.3,cy,0,.34,.1,"red",{m:.4}),C(k("cp"),"x",.16,cy,0,.12,.14,"steel"),C(k("cp"),"x",.44,cy,0,.12,.14,"steel"),B("",.3,cy+.19,0,.46,.025,.26,"gray",{r:.01}),C("","x",.55,cy,0,.14,.05,"dark"));
 a.push(...g3Motor("@motor",1.35,cy,0,1.0,.27),B("@cstation",2.45,.55,.55,.22,.5,.14,"#3b6ab0",{r:.02}),C("","y",2.45,.2,.55,.4,.03,"gray"));
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
 a.push(B(k("fib"),0,5.2,0,3.0,.25,2.4,"white",{r:.02}),B("@convsec",-.5,5.95,0,2.0,1.25,2.0,"white",{r:.03}));
 for(let r=0;r<3;r++)for(let c=0;c<4;c++)a.push(C(k("anc"),"z",-1.05+c*.7,2.0+r*.9,-.93,.1,.025,"steel",{seg:8}));
 [-.9,-.3,.3,.9].forEach(x=>a.push(C(k("coil"),"y",x,3.15,.1,3.7,.065,"red",{m:.5})));
 a.push(C(k("coil"),"x",0,1.55,.1,2.1,.075,"red",{m:.5}),C(k("coil"),"x",0,4.85,.1,2.1,.075,"red",{m:.5}),...[0,1,2].map(r=>C(k("coil"),"x",-.5,5.5+r*.3,0,1.8,.05,"red",{in:1})));
 [-.8,0,.8].forEach(x=>a.push(C("@burner","y",x,1.4,.1,.2,.12,"dark"),C("@burner","y",x,1.52,.1,.05,.09,"amber",{light:1,seg:10})));a.push(B("@peepdoor",-1.53,3.0,.4,.06,.4,.3,"#bcc8d6",{r:.01}),B("@peepdoor",-1.56,3.0,.4,.02,.2,.15,"#2f3744",{r:0}),B("@qfit",2.75,1.55,.1,.3,.34,.34,"#a9b6c6",{r:.02}),C("@dsteam","y",-1.0,5.45,.1,.5,.05,"#a3afbd"),C("@coilout","x",1.3,4.85,.1,.6,.09,"#c8a0a0"));
 a.push(C("N1","x",-2.2,4.85,.1,1.2,.1,"amber"),C("N2","x",1.8,1.55,.1,1.8,.1,"amber"),C("N3","x",2.0,2.9,.7,1.1,.07,"amber"));
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
 a.push(B("",0,cy+.52,.0,.2,.05,.12,"steel",{r:.01}),C(k("pip"),"y",-.9,cy+1.12,0,.35,.07,"steel",{m:.6}),C(k("pip"),"y",.9,cy-1.12,0,.35,.07,"steel",{m:.6}),C(k("pip"),"y",-1.85,cy+1.1,0,.35,.06,"steel",{m:.6}),C(k("pip"),"y",-1.85,cy-1.1,0,.35,.06,"steel",{m:.6}));
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
/* ---------- templates for the other equipment classes (tiers 1 to 4). Same zone mechanism: a zone carries the number of its first BoM line. ---------- */
function spiA(k,ax,x,y,z,len,ro,ri,c,o){return Object.assign({t:"a",k,ax,x,y,z,len,r:ro,ri,c},o)}
function spiS(k,pts,r,c,o){const q=pts.reduce((a,p)=>[a[0]+p[0]/pts.length,a[1]+p[1]/pts.length,a[2]+p[2]/pts.length],[0,0,0]);return Object.assign({t:"s",k,pts,r,c,x:q[0],y:q[1],z:q[2]},o)}
const spiHelix=(x,y0,y1,z,R,turns)=>{const n=turns*18,o=[];for(let i=0;i<=n;i++){const a=i/18*Math.PI*2;o.push([x+Math.cos(a)*R,y0+(y1-y0)*i/n,z+Math.sin(a)*R])}return o};
/* pressure relief valve: spring loaded, angle pattern, API 526 style */
function spiRelief(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(C("N1","y",0,.25,0,.5,.12,"amber"),C(k("fl"),"y",0,.03,0,.05,.2,"steel",{m:.7}),...spiBolts(k("fl"),"y",0,.03,0,.16,8,.08,.016),C("","y",0,.72,0,.5,.19,"paint",{sh:1,m:.5}),C("N2","x",.4,.72,0,.55,.14,"amber"),C(k("fl"),"x",.66,.72,0,.05,.19,"steel",{m:.7}),...spiBolts(k("fl"),"x",.66,.72,0,.15,8,.08,.016));
 a.push(C(k("noz"),"y",0,.52,0,.2,.1,"steel",{in:1}),C(k("disc"),"y",0,.74,0,.03,.09,"brass",{in:1}),C("","y",0,.96,0,.04,.19,"steel",{m:.7}),C("","y",0,1.46,0,.04,.19,"steel",{m:.7}),...[[1,1],[1,-1],[-1,1],[-1,-1]].map(([x,z])=>C("","y",x*.15,1.21,z*.15,.5,.02,"steel",{seg:10})));
 a.push(spiS(k("spr"),spiHelix(0,.99,1.43,0,.09,8),.012,"#d4b27a",{seg:8}),C("","y",0,1.5,0,.12,.1,"steel"),C("","y",0,1.6,0,.1,.03,"steel"),B("",0,1.68,0,.22,.03,.03,"steel"),B(k("oth"),0,.0,0,.5,.03,.5,"gray",{r:.01}));return a}
/* shutdown valve: ball body, pneumatic spring return actuator, solenoid and limit switches (IEC 61511 style) */
function spiSdv(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,E=g3E,a=[];
 a.push(C("","x",0,.4,0,.8,.17,"paint",{sh:1,m:.5}),E("","y",0,.4,0,.3,.26,"paint",0,Math.PI,{sh:1,m:.5}),C("N1","x",-.8,.4,0,.9,.13,"amber"),C("N2","x",.8,.4,0,.9,.13,"amber"),B(k("oth"),-1.1,.2,0,.2,.4,.2,"gray",{r:.02}),B(k("oth"),1.1,.2,0,.2,.4,.2,"gray",{r:.02}));
 a.push(C(k("fl"),"x",-.3,.4,0,.06,.22,"steel",{m:.7}),C(k("fl"),"x",.3,.4,0,.06,.22,"steel",{m:.7}),...spiBolts(k("fl"),"x",-.3,.4,0,.17,8,.1,.015),...spiBolts(k("fl"),"x",.3,.4,0,.17,8,.1,.015));
 a.push(C(k("pk"),"y",0,.74,0,.14,.07,"brass",{m:.7}),C("","y",0,.95,0,.3,.1,"steel"),C("","y",0,1.25,0,.5,.2,"blue",{sh:1,m:.4}),C("","y",0,1.55,0,.06,.22,"steel"),C("","y",0,1.62,0,.12,.1,"blue"));
 a.push(C(k("seal"),"y",0,.66,0,.02,.1,"#46505f",{seg:30}),B(k("sol"),.36,1.4,0,.14,.12,.12,"black",{r:.02}),C("N3","x",.5,1.4,0,.2,.012,"amber"),B(k("swt"),-.3,1.7,0,.16,.1,.1,"#e3a93b",{r:.02}),C("","y",-.3,1.55,0,.2,.012,"steel"));return a}
/* motor operated gate valve: gate body, yoke, electric actuator with limit switches and gearbox (grease) */
function spiMov(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(C("","x",0,.4,0,.8,.17,"paint",{sh:1,m:.5}),C("N1","x",-.8,.4,0,.9,.13,"amber"),C("N2","x",.8,.4,0,.9,.13,"amber"),B(k("oth"),-1.1,.2,0,.2,.4,.2,"gray"),B(k("oth"),1.1,.2,0,.2,.4,.2,"gray"),C(k("fl"),"x",-.3,.4,0,.06,.22,"steel",{m:.7}),C(k("fl"),"x",.3,.4,0,.06,.22,"steel",{m:.7}),...spiBolts(k("fl"),"x",-.3,.4,0,.17,8,.1,.015),...spiBolts(k("fl"),"x",.3,.4,0,.17,8,.1,.015));
 a.push(C("","y",0,.75,0,.5,.12,"paint",{m:.5}),C(k("pk"),"y",0,.98,0,.08,.08,"brass",{m:.7}),B("",.0,1.35,0,.08,.7,.3,"steel",{r:.01}),B("",0,1.35,.0,.3,.7,.08,"steel",{r:.01}),B(k("lub"),0,1.85,0,.5,.3,.4,"#d4b27a",{r:.04,m:.5}),C("","x",.42,1.85,0,.35,.14,"blue",{sh:1,m:.5}),B(k("swt"),-.1,2.1,.22,.14,.1,.1,"#e3a93b",{r:.02}),C("","y",0,2.2,0,.2,.04,"steel"),C("","y",0,2.32,0,.04,.16,"#d14b44"));return a}
/* vertical process vessel with demister, manway, level instruments and a drain valve */
function spiVessel(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,E=g3E,a=[],R=.9;
 a.push(C(k("oth"),"y",0,.35,0,.7,R*.95,"gray",{m:.3}),B("",0,.015,0,R*2.5,.03,R*2.5,"dark",{zb:.5,r:.05}),C("","y",0,2.2,0,3,R,"paint",{sh:1,m:.5}),E("","y",0,3.7,0,.35,R,"paint",0,Math.PI/2,{sh:1,m:.5}),E("","y",0,.7,0,.35,R,"paint",Math.PI/2,Math.PI,{sh:1,m:.5}));
 [1.4,2.6].forEach(y=>a.push(C("","y",0,y,0,.03,R*1.015,"steel",{m:.7,seg:40})));
 a.push(spiA(k("dem"),"y",0,3.15,0,.12,R*.97,0,"#cdd6e0",{in:1,m:.2,seg:40}),spiA(k("dem"),"y",0,3.03,0,.03,R*.97,R*.9,"#a3afbd",{in:1}));
 a.push(C("N1","x",R+.3,2.0,0,.6,.12,"amber"),C("N2","y",0,4.3,0,.5,.12,"amber"),C("N3","y",0,-.0,0,.01,.01,"amber",{seg:6}),C("N3","x",-R-.3,.9,0,.6,.1,"amber"));
 a.push(C(k("fl"),"x",R+.02,1.4,0,.06,.28,"steel",{m:.7}),C(k("fl"),"x",R+.2,1.4,0,.05,.32,"steel",{m:.7}),...spiBolts(k("fl"),"x",R+.2,1.4,0,.24,12,.09,.014));
 a.push(C(k("ins"),"y",R+.35,2.4,.45,1.4,.05,"#8fa1b5"),B(k("ins"),R+.35,3.2,.45,.18,.28,.14,"#3b6ab0",{r:.03}),C("N4","x",R+.1,3.0,.45,.3,.04,"amber"),C("N4","x",R+.1,1.8,.45,.3,.04,"amber"));
 a.push(C(k("vlv"),"x",-R-.8,.9,0,.25,.1,"#bcc8d6"),C(k("vlv"),"y",-R-.8,1.1,0,.25,.04,"steel"),C(k("vlv"),"y",-R-.8,1.28,0,.04,.14,"#d14b44"),...g3Ladder(-R-.12,.7,4.1,.4),B("",0,.2,R+.6,.4,.4,.4,"gray",{r:.02}));return a}
/* distillation column: tall shell, skirt, trays with valves (internals shown in X-ray), manways, overhead and bottoms nozzles */
function spiColumn(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,E=g3E,a=[],R=.7,H=8;
 a.push(C(k("oth"),"y",0,.5,0,1,R*.95,"gray",{m:.3}),B("",0,.015,0,R*3,.03,R*3,"dark",{zb:.5,r:.05}),C("","y",0,1+H/2,0,H,R,"paint",{sh:1,m:.5}),E("","y",0,1+H,0,.35,R,"paint",0,Math.PI/2,{sh:1,m:.5}),E("","y",0,1,0,.3,R,"paint",Math.PI/2,Math.PI,{sh:1,m:.5}));
 for(let i=0;i<6;i++){const y=1.6+i*1.1;a.push(C("","y",0,y,0,.03,R*1.015,"steel",{m:.7,seg:36}),spiA(k("trv"),"y",0,y-.1,0,.025,R*.97,0,"#a3afbd",{in:1,seg:36}),...[-.4,0,.4].map(x=>C(k("trv"),"y",x,y-.07,0,.03,.07,"#cdd6e0",{in:1,seg:12})))}
 a.push(spiA(k("dem"),"y",0,8.55,0,.12,R*.97,0,"#cdd6e0",{in:1,seg:36}));
 a.push(C("N1","x",R+.3,4.2,0,.6,.1,"amber"),C("N2","y",0,9.75,0,.6,.12,"amber"),C("N3","y",0,-.2,0,.01,.01,"amber",{seg:6}),C("N3","x",-R-.3,1.5,0,.6,.1,"amber"),C("N4","x",R+.3,7.6,0,.6,.07,"amber"));
 [3.0,6.0].forEach(y=>a.push(C(k("fl"),"x",R+.02,y,0,.06,.25,"steel",{m:.7}),C(k("fl"),"x",R+.2,y,0,.05,.29,"steel",{m:.7}),...spiBolts(k("fl"),"x",R+.2,y,0,.21,12,.09,.014)));
 a.push(...g3Ladder(-R-.12,1,9,.3),C(k("vlv"),"x",-R-.7,2.6,0,.25,.09,"#bcc8d6"),C(k("vlv"),"y",-R-.7,2.78,0,.04,.14,"#d14b44"));return a}
/* field instrument on a process pipe: thermowell with sensor, transmitter on a stand, gauge with root valve and tubing */
function spiInstr(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(C(k("oth"),"x",0,.4,0,2.2,.09,"paint",{m:.5}),C(k("oth"),"x",-1.1,.4,0,.05,.16,"steel"),C(k("oth"),"x",1.1,.4,0,.05,.16,"steel"),B("",-.7,.2,0,.2,.4,.2,"gray"),B("",.7,.2,0,.2,.4,.2,"gray"),C("N1","y",0,.62,0,.25,.04,"amber"));
 a.push(C(k("sens"),"y",0,.72,0,.5,.022,"#cdd6e0",{m:.8},.012),C(k("sens"),"y",0,.98,0,.03,.06,"steel"),C(k("sens"),"y",0,1.1,0,.2,.045,"#8fa1b5"),C(k("sens"),"y",0,1.24,0,.06,.07,"#cdd6e0"));
 a.push(C("","y",.6,.8,.35,.8,.03,"gray"),B(k("txm"),.6,1.3,.35,.22,.3,.18,"#3b6ab0",{r:.03}),C(k("conn"),"x",.45,.95,.3,.3,.012,"steel"),C(k("conn"),"y",.3,.7,.1,.5,.012,"steel"),B(k("conn"),.3,.5,.05,.1,.1,.1,"#8fa1b5"));
 a.push(C(k("gauge"),"z",-.6,1.1,.12,.08,.14,"#2f3744"),C(k("gauge"),"z",-.6,1.1,.17,.01,.12,"#f6f7f9"),C(k("gauge"),"y",-.6,.82,.04,.35,.015,"#a9b6c6"),C(k("conn"),"y",-.6,.55,0,.15,.03,"#8fa1b5"));return a}
/* centrifugal blower or compressor train item with motor, bearings, coupling and lube oil */
function spiBlower(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,E=g3E,cy=.8,a=[];
 a.push(B(k("oth"),.4,.1,0,4.6,.2,1.3,"gray",{r:.05}),B("",.4,.012,0,4.7,.03,1.4,"dark",{r:.05,zb:.6}),B("",-.8,.35,0,.5,.3,.7,"gray"),B("",1.6,.35,0,.5,.3,.7,"gray"));
 a.push(C("","x",-.2,cy,0,.7,.65,"paint",{sh:1,m:.5}),C("","x",-.2,cy,0,.2,.78,"paint",{m:.5}),C("N1","x",-.95,cy,0,.5,.18,"amber"),C("N2","y",-.2,cy+.85,.0,.7,.14,"amber"),C(k("fl"),"x",-1.22,cy,0,.05,.28,"steel",{m:.7}),...spiBolts(k("fl"),"x",-1.22,cy,0,.22,12,.09,.016));
 a.push(C(k("brg"),"x",.5,cy,0,.5,.2,"steel",{m:.6}),C(k("brg"),"x",.25,cy,0,.05,.26,"steel"),C(k("seal"),"x",.18,cy,0,.12,.28,"brass",{m:.7}),C(k("brg"),"y",.5,cy-.28,0,.12,.045,"water"),C("","x",.9,cy,0,.3,.05,"dark"),C(k("cp"),"x",1.05,cy,0,.34,.11,"red",{m:.4}),B("",1.05,cy+.2,0,.46,.025,.26,"gray",{r:.01}),...g3Motor("@motor",2.2,cy,0,1.1,.3));
 a.push(B(k("lub"),1.0,.5,.55,.6,.45,.4,"#d4b27a",{r:.04,m:.4}),C(k("flt"),"y",.9,.9,.55,.4,.08,"blue",{m:.5}),C(k("flt"),"y",1.15,.9,.55,.4,.08,"blue",{m:.5}));return a}
/* orifice assembly: pipe with a flanged orifice plate and two pressure tappings */
function spiOrifice(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(C(k("oth"),"x",-.9,.45,0,1.4,.1,"paint",{m:.5}),C(k("oth"),"x",.9,.45,0,1.4,.1,"paint",{m:.5}),C(k("fl"),"x",-.1,.45,0,.06,.2,"steel",{m:.7}),C(k("fl"),"x",.1,.45,0,.06,.2,"steel",{m:.7}),...spiBolts(k("fl"),"x",-.1,.45,0,.16,8,.26,.014),C(k("oth"),"x",0,.45,0,.02,.19,"#cdd6e0",{m:.8}),B(k("oth"),0,.66,0,.02,.12,.06,"#cdd6e0",{r:0}),C("N1","y",-.2,.65,0,.25,.02,"amber"),C("N2","y",.2,.65,0,.25,.02,"amber"),B("",-.9,.2,0,.2,.4,.2,"gray"),B("",.9,.2,0,.2,.4,.2,"gray"));return a}
/* instrument junction box: enclosure with cable glands, terminal rail (shown in X-ray), cable and screws */
function spiJbox(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(B(k("oth"),0,.7,0,.7,.5,.3,"#bcc8d6",{r:.03,m:.5}),B(k("oth"),0,.7,.16,.66,.46,.02,"#a9b6c6",{r:.01}),C("","y",0,.2,0,.4,.04,"gray"),B("",0,.015,0,.4,.03,.3,"dark",{zb:.4}));
 [-.25,-.08,.08,.25].forEach((x,i)=>a.push(C(k("gland"),"y",x,.38,0,.12,.03,"#e3a93b",{seg:20}),C(k("gland"),"y",x,.3,0,.06,.025,"#8fa1b5"),C(k("cab"),"y",x,.15,0,.25,.012,"#2f3744",{seg:10})));
 a.push(B(k("term"),0,.7,0,.5,.06,.1,"#3b6ab0",{in:1}),...[-.2,-.1,0,.1,.2].map(x=>B(k("term"),x,.7,.02,.06,.1,.08,"#c9d1da",{in:1,r:.005})));
 [[-.3,.9],[.3,.9],[-.3,.5],[.3,.5]].forEach(([x,y])=>a.push(C(k("scr"),"z",x,y,.17,.015,.015,"steel",{seg:10})));return a}
/* piping run: straight pipe, elbow, tee, valve and a flanged joint */
function spiPipeRun(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[],r=.1;
 a.push(C(k("pipe"),"x",-1,.45,0,2,r,"paint",{m:.5}),C("N1","x",-2.05,.45,0,.1,r,"amber"));
 const pts=[];for(let i=0;i<=12;i++){const t=i/12*Math.PI/2;pts.push([.4+Math.sin(t)*.35,.45+(1-Math.cos(t))*.35,0])}a.push(spiS(k("fit"),pts,r,"#bcc8d6",{seg:16,m:.6}),C(k("fit"),"y",.75,1.1,0,.8,r,"#bcc8d6",{m:.6}),C(k("pipe"),"y",.75,1.75,0,.6,r,"paint",{m:.5}),C("N2","y",.75,2.1,0,.1,r,"amber"));
 a.push(C(k("fit"),"y",-.2,.7,0,.5,r,"#bcc8d6"),C(k("fit"),"x",-.2,.9,0,.4,r*.8,"#bcc8d6"));
 a.push(C(k("fl"),"x",-.55,.45,0,.05,r*1.9,"steel",{m:.7}),C(k("fl"),"x",-.45,.45,0,.05,r*1.9,"steel",{m:.7}),...spiBolts(k("fl"),"x",-.5,.45,0,r*1.5,6,.14,.012));
 a.push(C(k("vlv"),"y",.75,1.45,0,.3,r*1.5,"#8fa1b5",{m:.6}),C(k("vlv"),"y",.75,1.7,0,.2,.03,"steel"),C(k("vlv"),"y",.75,1.82,0,.03,.12,"#d14b44"),C(k("coat"),"x",.95,.45,0,.3,r*1.12,"#e8c96b",{m:.1}),B("",-1.5,.2,0,.2,.4,.2,"gray"),B("",.1,.2,0,.2,.4,.2,"gray"));return a}
const SPI_BUILD={turbine:spiTurbine,furnace:spiFurnace,pump:spiPump,hx:spiHx,valve:spiValve,prv:spiRelief,sdv:spiSdv,mov:spiMov,vessel:spiVessel,column:spiColumn,instr:spiInstr,blower:spiBlower,orifice:spiOrifice,jbox:spiJbox,line:spiPipeRun};

/* sub-item templates (assemblies of the pump, compressor and furnace sets): electric motor, control switch station, concrete foundation, burner, peep door, convection section and furnace fittings */
function spiMotorT(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[],cy=.6;
 a.push(B(k("oth"),0,.09,0,1.6,.18,.7,"gray",{r:.04}),C(k("oth"),"x",0,cy,0,1.2,.3,"#3b6ab0",{sh:1,m:.5}),...[...Array(10).keys()].map(i=>C(k("oth"),"x",-.5+i*.11,cy,0,.025,.315,"#2f5fa3",{seg:30})),C(k("brg"),"x",.66,cy,0,.12,.2,"steel",{m:.7}),C(k("brg"),"x",-.66,cy,0,.12,.22,"steel",{m:.7}),C("","x",.8,cy,0,.2,.05,"dark"));
 a.push(C(k("fan"),"x",-.78,cy,0,.2,.28,"#2f3744",{m:.3}),C(k("fan"),"x",-.9,cy,0,.04,.3,"#8fa1b5"),B(k("tb"),.1,cy+.38,0,.3,.2,.26,"#a3afbd",{r:.02}),C(k("gl"),"y",.1,cy+.53,.0,.12,.035,"#e3a93b"),C(k("gl"),"y",.0,cy+.53,.06,.1,.03,"#e3a93b"),C(k("gr"),"y",.4,cy-.33,.0,.07,.015,"#d9b23c"),B("",.0,.2,.0,.2,.2,.3,"gray"));return a}
function spiCStation(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(C(k("oth"),"y",0,.5,0,1,.04,"gray"),B("",0,.015,0,.4,.03,.4,"dark",{zb:.4}),B(k("oth"),0,1.2,0,.5,.7,.2,"#bcc8d6",{r:.03,m:.5}),B(k("oth"),0,1.2,.11,.46,.66,.02,"#a9b6c6",{r:.01}));
 [-.14,0,.14].forEach((x,i)=>a.push(C(k("lamp"),"z",x,1.42,.13,.04,.03,["#3fa55a","#d14b44","#e3a93b"][i],{light:1,seg:16})));
 [-.12,.12].forEach(x=>a.push(C(k("sw"),"z",x,1.22,.14,.05,.035,"#2f3744",{seg:16}),B(k("sw"),x,1.22,.17,.015,.07,.02,"#cdd6e0",{r:0})));
 a.push(B(k("sw"),0,1.02,.14,.14,.08,.04,"#d14b44",{r:.01}),B(k("tb"),0,1.22,0,.34,.1,.04,"#3b6ab0",{in:1,r:.005}),...[-.12,0,.12].map(x=>C(k("gl"),"y",x,.82,0,.1,.025,"#e3a93b",{seg:16})));return a}
function spiFoundation(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(B(k("oth"),0,.25,0,2,.5,1.2,"#b9b3a6",{r:.03,m:.05}),B(k("oth"),0,.52,0,2.1,.04,1.3,"#a39d90",{r:.01}));[[-.8,.45],[.8,.45],[-.8,-.45],[.8,-.45]].forEach(([x,z])=>a.push(C(k("bolt"),"y",x,.65,z,.3,.016,"#a3afbd",{seg:12}),C(k("bolt"),"y",x,.82,z,.03,.03,"#8fa1b5",{seg:6}),spiA(k("bolt"),"y",x,.57,z,.014,.05,.017,"#8fa1b5")));return a}
function spiBurnerT(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(B(k("oth"),0,.15,0,1.4,.3,1.4,"gray",{r:.03}),spiA(k("ref"),"y",0,.5,0,.4,.5,.2,"#d8c7b0",{m:.05}),spiA(k("ref"),"y",0,.72,0,.1,.38,.2,"#cdb88f",{m:.05}),C(k("bt"),"y",0,.55,0,.5,.1,"#aab5c2",{m:.8},.14));
 spiRad(8,0,(an)=>a.push(C(k("bt"),"y",Math.cos(an)*.07,.82,Math.sin(an)*.07,.03,.012,"#2f3744",{seg:8})));
 a.push(C(k("fl"),"y",0,.12,0,.05,.22,"steel",{m:.7}),...spiBolts(k("fl"),"y",0,.12,0,.18,8,.08,.016),C("","y",0,-.1,0,.3,.1,"#e3a93b"),C(k("tc"),"y",.3,.7,0,.6,.012,"#cdd6e0",{seg:8}),C(k("tc"),"y",.3,1.05,0,.06,.04,"#a3afbd"),C(k("tc"),"y",.3,.9,0,.4,.03,"#bcc8d6",{in:1}));return a}
function spiPeepDoor(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(B(k("oth"),0,.5,0,1,1,.08,"#a3afbd",{r:.02}),B(k("oth"),0,.5,.05,.66,.66,.04,"#bcc8d6",{r:.02}),spiA(k("ref"),"z",0,.5,-.08,.1,.3,.14,"#d8c7b0",{m:.05}),C(k("ref"),"z",0,.5,-.04,.04,.14,"#2f3744"),C("","z",0,.5,.08,.04,.09,"#8fb7d6",{m:.9}),C(k("fl"),"y",.28,.5,.1,.04,.03,"steel"),B(k("oth"),.36,.5,.09,.08,.3,.05,"#8fa1b5",{r:.01}),B(k("oth"),-.5,.5,.0,.04,.7,.12,"steel"),B("",0,.015,0,1.1,.03,.4,"dark",{zb:.4}),C(k("tc"),"x",.0,.9,.12,.5,.012,"#cdd6e0",{seg:8}),C(k("bt"),"z",-.3,.8,.1,.03,.03,"#2f3744"));return a}
function spiConvSec(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(B(k("oth"),0,.15,0,2.4,.3,1.6,"gray",{r:.03}),B(k("ref"),0,1.1,0,2.2,1.6,1.4,"#e9e4d8",{r:.03,m:.05}),B(k("oth"),0,1.1,0,2.26,.04,1.46,"#a3afbd",{r:.01}));
 for(let r=0;r<5;r++)a.push(C(k("bt"),"x",0,.55+r*.28,r%2?.25:-.25,2.3,.05,"#c8a0a0",{in:1,seg:12}));
 a.push(C(k("fl"),"x",1.25,.9,0,.06,.18,"steel",{m:.7}),...spiBolts(k("fl"),"x",1.25,.9,0,.14,8,.1,.014),C("","x",1.6,.9,0,.7,.14,"amber"),B("",0,2.0,0,.6,.4,.6,"#e9e4d8",{r:.03}),C("","y",0,2.7,0,1,.25,"steel",{m:.6}),C(k("tc"),"y",.7,1.95,.4,.5,.012,"#cdd6e0",{seg:8}),C(k("tc"),"y",.7,2.25,.4,.06,.04,"#a3afbd"));return a}
function spiFurnFit(n){const P=spiPrep(n),k=id=>P.key[id]||"",B=g3B,C=g3C,a=[];
 a.push(C(k("oth"),"x",0,.5,0,1.8,.1,"paint",{m:.5}),B("",-.5,.2,0,.2,.4,.2,"gray"),B("",.5,.2,0,.2,.4,.2,"gray"),spiA(k("ref"),"x",-.3,.5,0,.6,.22,.1,"#d8c7b0",{m:.05}),C(k("fl"),"x",.35,.5,0,.06,.2,"steel",{m:.7}),C(k("fl"),"x",.45,.5,0,.06,.2,"steel",{m:.7}),...spiBolts(k("fl"),"x",.4,.5,0,.16,8,.16,.014),C(k("fl"),"y",0,.8,0,.05,.12,"steel"));
 a.push(C(k("oth"),"y",0,.8,0,.5,.05,"paint"),C(k("tc"),"y",-.7,.7,0,.6,.02,"#cdd6e0",{m:.8},.012),C(k("tc"),"y",-.7,1.04,0,.1,.04,"#a3afbd"),C(k("bt"),"y",.0,1.12,0,.15,.06,"#aab5c2"));return a}
Object.assign(SPI_BUILD,{motor:spiMotorT,cstation:spiCStation,foundation:spiFoundation,burner:spiBurnerT,peepdoor:spiPeepDoor,convsec:spiConvSec,qfit:spiFurnFit,dsteam:spiFurnFit,coilout:spiFurnFit});
function spiSubCls(eqc,d){d=(d||"").toUpperCase();if(/^MOTOR FOR/.test(d))return"motor";if(/CONTROL SWITCH STATION/.test(d))return"cstation";if(/CONCRETE STRUCTURE/.test(d))return"foundation";if(eqc==="BF"){if(/^BURNER/.test(d))return"burner";if(/PEEP DOOR/.test(d))return"peepdoor";if(/CONVECTION SECTION/.test(d))return"convsec";if(/QUENCH FITTING/.test(d))return"qfit";if(/DILUTION STEAM/.test(d))return"dsteam";if(/COIL OUTLET/.test(d))return"coilout"}return""}
const SPI_SUBLAB={motor:"Electric motor",cstation:"Control switch station",foundation:"Concrete foundation",burner:"Burner",peepdoor:"Peep door",convsec:"Convection section",qfit:"Quench oil fitting",dsteam:"Dilution steam connection",coilout:"Coil outlet"};
/* register the model of any location under a private key. loc = {cls, funcloc, tag, parts:[{material_no,descr,installed_qty,...}]} */
function spiLocRegister(loc){window.SPIDYN=window.SPIDYN||{};window.SPILK=(window.SPILK||0)+1;const key="loc"+window.SPILK;
 SPIDYN[key]={cls:loc.cls,funcloc:loc.funcloc,tag:loc.tag};GA[key]={bom:(loc.parts||[]).map(p=>({name:p.descr||"",mat:"Material "+p.material_no,qty:String(p.installed_qty||1)})),nz:[],mot:null};
 const P=spiPrep(key),b=SPI_BUILD[loc.cls];G3M[key]=(b?b(key):autoG3m(key)).map(q=>{q.z=-q.z;return q});if(window.SPIB)delete SPIB[key];return key}
{KB.sets.forEach(s=>{const c=spiCls(s.n),f=SPI_BUILD[c];if(c&&f){spiPrep(s.n);G3M[s.n]=f(s.n).map(q=>{q.z=-q.z;return q})}else G3M[s.n]=autoG3m(s.n)});
 /* floating parts get short necks, computed the first time a model is drawn (not at start-up). The necks of the first plant do not apply. */
 Object.keys(G3NECK).forEach(q=>delete G3NECK[q]);
 KB.sets.forEach(s=>{if(!spiCls(s.n))return;Object.defineProperty(G3NECK,s.n,{configurable:true,enumerable:true,get(){const pr=(G3M[s.n]||[]),v=g3BridgeCalc(pr.concat(g3Extra(pr))).map(x=>[x.k,x.ax,x.x,x.y,x.z,x.len,x.r]);Object.defineProperty(G3NECK,s.n,{value:v,configurable:true,enumerable:true});return v}})})}
