/* =====================================================================================================
   AUTOMATIC 3D: models by equipment kind, placement in the 3D plant and elevations in the 3D site.
   Owned by the 3D UI stream. Function declarations only, called from the places a case's geo files normally fill
   (see auto.js and build.py AUTO). Selection keys follow the parts list and nozzle table of the set.
   ===================================================================================================== */
function autoG3mAll(){KB.sets.forEach(s=>{G3M[s.n]=autoG3m(s.n)})}
/* 3D model by equipment kind. Shell sections, parts and nozzles carry the keys of the parts list and nozzle table, so they select and show the same card as a drawn model. */
function autoG3m(n){const kind=autoKind(n),g=GA[n],B=g.bom,N=Math.max(1,B.length),vert=autoVertical(kind),key=i=>String(i+1),a=[],rings=(ax,x,y,z,r,list)=>list.map(t=>g3C("",ax,ax==="y"?x:t,ax==="y"?t:y,ax==="y"?z:z,.035,r*1.02,"steel",{m:.7,seg:36}));
 const nzTop=z=>/inlet|feed|top|vent|overhead|reflux|psv|man|supply|hot|steam|fuel|in\b/i.test(z.sv||"");
 if(vert){const col=kind==="column",tank=kind==="vessel",R=col?.6:tank?1.1:.75,H=col?4.2:tank?2.2:3.2,sk=tank?.25:col?.6:.5,h=H/N,y0=sk;
  a.push(g3C("",  "y",0,sk/2,0,sk,R*.94,"gray",{m:.3}),g3C("","y",0,.02,0,.04,R*1.12,"dark",{zb:.5}));
  B.forEach((b,i)=>a.push(g3C(key(i),"y",0,y0+h*(i+.5),0,h*.995,R,"paint",{sh:1,m:.5})));
  for(let i=1;i<N;i++)a.push(g3C("","y",0,y0+h*i,0,.03,R*1.015,"steel",{m:.7,seg:36}));
  if(tank){a.push(g3C("","y",0,y0+H+.25,0,.5,R,"paint",{sh:1,m:.5},.05),g3C("","y",0,y0+H+.55,0,.14,.09,"steel"))}
  else{a.push(g3E("","y",0,y0+H,0,R*.4,R,"paint",0,Math.PI/2,{sh:1,m:.5}),g3E("","y",0,y0,0,R*.4,R,"paint",Math.PI/2,Math.PI,{sh:1,m:.5}),...g3Ladder(R+.12,sk,y0+H,.2),
   ...[.35,.7].map(f=>g3C("","y",0,y0+H*f,0,.03,R*1.45,"gray",{m:.3,seg:30})),g3C("","y",0,y0+H+R*.4+.15,0,.3,.05,"steel"),g3C("","y",0,y0+H+R*.4+.35,0,.08,.05,"green",{light:1,seg:10}))}
  let up=0,dn=0;g.nz.forEach((z,i)=>{const top=nzTop(z),yy=top?y0+H*(.55+.12*(up++%3)):y0+.35+.4*(dn++%3),sd=i%2?1:-1;a.push(g3C(z.m,"x",sd*(R+.2),yy,0,.4,.07,"amber"),g3C(z.m,"x",sd*(R+.4),yy,0,.04,.13,"steel"))});
  return a}
 /* horizontal machines: place along x, centre at 0 */
 if(kind==="pump"){const bp=g3B("",0,.07,0,2.6,.14,.85,"gray",{r:.05}),cx=-.55;a.push(bp,g3B("",0,.012,0,2.7,.03,.95,"dark",{r:.04,zb:.6}));
  a.push(g3C(key(0),"x",cx,.52,0,.46,.38,"paint",{sh:1,m:.5}),g3C(key(Math.min(1,N-1)),"x",cx+.45,.52,0,.5,.17,"steel",{m:.6}),g3C("","x",cx-.3,.52,0,.1,.3,"steel",{m:.6}),g3B("",cx+.9,.34,0,.18,.34,.2,"gray",{r:.02}),g3B("",cx+.9,.52,0,.5,.34,.4,"dark",{r:.04,m:.2}));
  for(let i=2;i<N;i++)a.push(g3C(key(i),"x",cx+.25+(i-2)*.07,.52,0,.05,.2+(i%3)*.03,i%2?"brass":"steel",{m:.7,seg:24}));
  if(g.mot)a.push(...g3Motor("M",cx+1.65,.58,0,1.0,.3));
  g.nz.forEach((z,i)=>{const dn=/drain|boot|bottom/i.test(z.sv);a.push(...(/suction|inlet|in\b/i.test(z.sv)&&i===0?[g3C(z.m,"x",cx-.62,.52,0,.35,.1,"amber"),g3C(z.m,"x",cx-.8,.52,0,.04,.17,"steel")]:/discharge|outlet|out\b/i.test(z.sv)&&i===1?[g3C(z.m,"y",cx,.95,0,.5,.08,"amber"),g3C(z.m,"y",cx,1.2,0,.04,.15,"steel")]:[g3C(z.m,"y",cx-.2+i*.12,dn?.2:.95,.2,.2,.05,"amber")]))});return a}
 if(kind==="comp"){a.push(g3B("",0,.07,0,4.2,.14,1.4,"gray",{r:.05}),g3B("",0,.012,0,4.3,.03,1.5,"dark",{r:.04,zb:.8}),g3B(key(0),-.4,.7,0,1.5,.9,1.0,"paint",{sh:1,r:.06,m:.4}));
  for(let i=1;i<N;i++){const cyl=i<=2,x=-.4+(cyl?(i===1?-.35:.45):0);a.push(cyl?g3C(key(i),"x",x,.78,i===1?.8:-.8,.9,.28,"steel",{sh:1,m:.6}):g3C(key(i),"y",-1.0+((i-3)%4)*.45,.9+(i%2)*.2,(i%2?.52:-.52),.12,.1+((i%3)*.02),i%2?"brass":"steel",{m:.7,seg:16}))}
  if(g.mot)a.push(...g3Motor("M",1.8,.75,0,1.2,.38));
  g.nz.forEach((z,i)=>a.push(g3C(z.m,"y",-.9+i*.55,1.55,(i%2?.35:-.35),.5,.07,"amber"),g3C(z.m,"y",-.9+i*.55,1.8,(i%2?.35:-.35),.04,.13,"steel")));return a}
 if(kind==="fan"){const W=2.6,Hh=1.8;a.push(g3B("",0,.15,0,W+.4,.3,W+.4,"gray",{r:.04}),g3B(key(Math.min(N-1,4)),0,.7,0,W,.9,W,"blue",{r:.05,m:.3}),g3B(key(Math.min(N-1,3)),0,1.4,0,W,.5,W,"paint",{r:.04,m:.3}));
  a.push(g3C(key(0),"y",0,Hh+.55,0,.6,1.0,"paint",{sh:1,m:.4},.78));
  a.push(...[0,1].map(i=>g3B(key(0),0,Hh+.92,0,i?.16:1.3,.03,i?1.3:.16,"dark",{r:.01,anim:{ax:"y",rate:140,at:[0,Hh+.92,0]}})));
  a.push(g3C("","y",0,Hh+.92,0,.14,.12,"steel"));
  if(g.mot)a.push(g3C("M","y",0,Hh+.3,0,.22,.14,"blue"));
  for(let i=1;i<Math.min(N,3);i++)a.push(g3B(key(i),(i%2?1:-1)*1.0,.45,1.32,.3,.5,.05,"steel",{r:.01}));
  g.nz.forEach((z,i)=>a.push(g3C(z.m,"x",(i%2?1:-1)*(W/2+.2),.5+(i%2)*.6,0,.45,.1,"amber"),g3C(z.m,"x",(i%2?1:-1)*(W/2+.42),.5+(i%2)*.6,0,.04,.17,"steel")));return a}
  /* fired heater: radiant box on legs, coil and burners (coil shows in X-ray), convection section and stack */
 if(kind==="fired"){const W=2.8,Hh=2.2,Dp=1.7,y0=.5,k=i=>key(Math.min(i,N-1));a.push(g3B("",0,.06,0,W+.5,.12,Dp+.5,"gray",{r:.04}),g3B("",0,.012,0,W+.6,.03,Dp+.6,"dark",{r:.04,zb:.6}));
  [-1,1].forEach(sx=>[-1,1].forEach(sz=>a.push(g3C("","y",sx*W*.42,y0/2,sz*Dp*.4,y0,.07,"dark"))));
  a.push(g3B(k(0),0,y0+Hh/2,0,W,Hh,Dp,"paint",{sh:1,r:.05,m:.4}),g3B(k(0),0,y0+Hh+.04,0,W+.14,.08,Dp+.14,"steel",{r:.02}));
  for(let i=0;i<6;i++)a.push(g3C(k(1),"x",0,y0+.55+i*.28,(i%2?.28:-.28),W*.92,.05,"red",{in:1,seg:12}));
  [-.8,0,.8].forEach(x=>a.push(g3C(k(2),"y",x,y0-.14,0,.28,.13,"dark"),g3C(k(2),"y",x,y0-.3,0,.05,.09,"amber",{light:1,seg:10})));
  a.push(g3B(k(4),-W*.2,y0+Hh+.5,0,W*.6,.84,Dp*.7,"paint",{sh:1,r:.04,m:.4}),g3C(k(3),"y",-W*.2,y0+Hh+.92+1.3,0,2.6,.2,"steel",{m:.6},.16),g3C(k(3),"y",-W*.2,y0+Hh+.92+2.58,0,.05,.24,"steel"),...[-.8,0,.8].flatMap(x=>[1,-1].map(sd=>g3B("",x,y0+1.5,sd*(Dp/2+.02),.34,.3,.05,"dark",{r:.02}))));
  g.nz.forEach((z,i)=>{const sd=1,yy=y0+.35+(i%3)*.6,x=-W*.38+Math.floor(i/3)*W*.38+(i%3)*.12;a.push(g3C(z.m,"z",x,yy,sd*(Dp/2+.3),.6,.07,"amber"),g3C(z.m,"z",x,yy,sd*(Dp/2+.6),.04,.13,"steel"))});return a}
 /* drum, exchanger, dryer, fired heater and anything else: a horizontal shell on saddles */
 const L=kind==="dryer"?3.8:kind==="hx"?3.6:kind==="fired"?3.2:3.0,R=kind==="drum"?.62:kind==="hx"?.48:kind==="dryer"?.7:.6,cy=R+.42,w=L/N;
 B.forEach((b,i)=>a.push(g3C(key(i),"x",-L/2+w*(i+.5),cy,0,w*.995,R,kind==="hx"&&i===0?"steel":"paint",{sh:1,m:.5})));
 for(let i=1;i<N;i++)a.push(g3C("","x",-L/2+w*i,cy,0,.03,R*1.015,"steel",{m:.7,seg:36}));
 a.push(g3E("","x",-L/2,cy,0,R*.4,R,"paint",Math.PI/2,Math.PI,{sh:1,m:.5}),g3E("","x",L/2,cy,0,R*.4,R,"paint",0,Math.PI/2,{sh:1,m:.5}));
 [-.3,.3].forEach(f=>{a.push(g3B("",f*L,(cy-R)/2,0,.28,cy-R,R*1.7,"gray",{r:.04}),g3B("",f*L,.015,0,.5,.03,R*2,"dark",{zb:.5}))});
 if(kind==="hx")a.push(g3C("","x",-L/2-.35,cy,0,.3,R*1.15,"steel",{m:.6}),g3C("","x",-L/2-.18,cy,0,.04,R*1.3,"steel"));
 if(kind==="fired")a.push(g3C("","y",L/2-.3,cy+R+1.0,0,2.0,.25,"steel",{m:.6}));
 a.push(g3C("","y",0,cy+R+.1,0,.2,.2,"steel"),g3C("","y",0,cy+R+.22,0,.04,.28,"steel"));
 g.nz.forEach((z,i)=>{const dn=/drain|boot|bottom|outlet|product|out\b/i.test(z.sv)&&!/vent/i.test(z.sv),x=-L/2+.35+i*((L-.7)/Math.max(1,g.nz.length));a.push(g3C(z.m,"y",x,dn?cy-R-.25:cy+R+.25,0,.5,.07,"amber"),g3C(z.m,"y",x,dn?cy-R-.5:cy+R+.5,0,.04,.13,"steel"))});
 return a}
function autoP3(){const {C,R}=autoGrid();window.P3POS={};window.P3SC={};KB.sets.forEach((s,i)=>{P3POS[s.n]=[((i%C)-(C-1)/2)*11,(Math.floor(i/C)-(R-1)/2)*18];
  const k=autoKind(s.n);P3SC[s.n]=k==="comp"?1.9:k==="fan"?2.4:k==="pump"?3:autoVertical(k)?1.9:2.2})}
function autoH3(){window.H3_EL={};KB.sets.forEach(s=>{const h=((s.ga||{}).height_mm||0)/1000;H3_EL[s.n]=h>8?+(h*.8).toFixed(1):0})}
