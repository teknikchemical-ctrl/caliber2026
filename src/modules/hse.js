/* =====================================================================================================
   HSE HAZARD SIMULATOR
   Screening models for a loss of containment on the plot plan: release rate through a hole, vapour from the flash and the pool,
   a Gaussian plume that moves with the wind (with the time lag from the source), jet fire and pool fire radiation, flash fire and
   vapour cloud explosion overpressure, gas detection and shutdown timing, who and what is inside each zone, and the walk to each
   muster point. Everything is computed on the real plot plan coordinates (metres), and drawn in 2D on the plot plan and in 3D on the
   site model. These are screening estimates for training and for ranking scenarios, not a replacement for a consequence study.
   ===================================================================================================== */
regMod("hse","1.0",[],"HSE hazard simulator");
const HSE_F={
 hexane:{name:"n-Hexane",M:86.2,lfl:1.2,ufl:7.4,hc:44.7e6,rl:659,tb:69,hv:335e3,cp:2300,g:1.06,pv:24000,dense:true,burn:.105,sep:140},
 ethylene:{name:"Ethylene",M:28.05,lfl:2.7,ufl:36,hc:47.1e6,g:1.24,gas:true,sep:200},
 hydrogen:{name:"Hydrogen",M:2.016,lfl:4,ufl:75,hc:120e6,g:1.41,gas:true,light:true,sep:100}};
const HSE_ST={A:"Very unstable (bright sun, light wind)",B:"Unstable (sunny)",C:"Slightly unstable",D:"Neutral (overcast, windy)",E:"Stable (evening)",F:"Very stable (clear calm night)"};
/* limits used for the zones */
const HSE_LIM={heat:[[37.5,"Equipment damage, steel loses strength","#7a0f1b"],[12.5,"Fatal in about a minute, ignition of wood","#cf222e"],[4.7,"Pain in about 15 seconds, protective clothing needed","#f08a24"]],
 blast:[[35,"Serious structural damage","#7a0f1b"],[21,"Heavy damage to buildings, ear drum rupture","#cf222e"],[7,"Windows break, light injury","#f08a24"]]};
const HSE={sc:"cloud",n:1,hole:50,u:2,st:"D",esd:"auto",ign:-1,t:0,play:false,speed:6,view:"2d",tmax:480,T:null,R:null,seq:0,sel:null,resp:45,inv:null};
/* ---------- source ---------- */
const HSE_P={1:[16,80,1500],3:[6,250,60],4:[16,150,600],5:[16,200,2500],6:[8,120,1800],8:[10,120,3000]};
function hseKey(n){const f=S(n).fluid||"";return/ethylene/i.test(f)?"ethylene":/hexane/i.test(f)?"hexane":/h2|hydrogen/i.test(f)?"hydrogen":null}
function hseSrc(n){const k=hseKey(n);if(!k)return null;const d=HSE_P[n]||[8,100,800],o=K.opl.find(x=>x.set===n&&/barg/.test(x.dp||""));
 const P=o&&parseFloat(o.dp)||d[0],T=o&&(/(\d+)\s*degC/.exec(o.dt||"")||[])[1]||d[1];return{n,k,f:HSE_F[k],P:+P,T:+T,inv:HSE.inv||d[2]}}
const hseUnits=()=>K.sets.filter(s=>hseKey(s.n));
/* ---------- dispersion ---------- */
function hseSig(x,st,dense,mass){x=Math.max(x,1);let sy,sz;
 if(st==="A"||st==="B"){sy=.32*x/Math.sqrt(1+.0004*x);sz=.24*x*Math.sqrt(1+.001*x)}else if(st==="C"){sy=.22*x/Math.sqrt(1+.0004*x);sz=.2*x}
 else if(st==="D"){sy=.16*x/Math.sqrt(1+.0004*x);sz=.14*x/Math.sqrt(1+.0003*x)}else{sy=.11*x/Math.sqrt(1+.0004*x);sz=.08*x/Math.sqrt(1+.0015*x)}
 if(dense){sy*=1.35;sz*=.55}
 const s0=2;return[Math.sqrt(sy*sy+s0*s0),Math.sqrt(sz*sz+s0*s0)]}
const hseH=(M,x)=>M.f.light?M.Hs+.28*Math.pow(x,.75):M.Hs;
/* source term over time: gas rate, flash vapour, pool and its evaporation */
function hseModel(cfg){const src=hseSrc(cfg.n);if(!src)return null;const f=src.f,u=Math.max(1.5,cfg.u),A=Math.PI*Math.pow(cfg.hole/2000,2),Tk=src.T+273.15,P0=src.P*1e5+101325;let Q0,Fv=1;
 if(f.gas){const g=f.g,k=Math.pow(2/(g+1),(g+1)/(g-1));Q0=.62*A*P0*Math.sqrt(g*(f.M/1000)/(8.314*Tk)*k)}
 else{Q0=.62*A*Math.sqrt(2*f.rl*src.P*1e5);const F=Math.max(0,f.cp*(Tk-(f.tb+273.15))/f.hv);Fv=Math.min(1,Math.max(.02,2*F))}
 const M={cfg,src,f,u,st:cfg.st,Q0,Fv,Hs:f.light?1.5:1,dense:!!f.dense&&Q0*Fv>.3,A,T:src.T};
 /* time to gas detection and to isolation */
 const dRing=12,sg=hseSig(dRing,cfg.st,M.dense),peakAtRing=(Q0*Fv)/(2*Math.PI*u*sg[0]*sg[1])*(Math.exp(-Math.pow(M.Hs,2)/(2*sg[1]*sg[1]))*2)/(f.M)/.0416*100;
 M.tDet=peakAtRing>=f.lfl*.2?dRing/u+4:null;
 const delay=cfg.esd==="auto"?30:cfg.esd==="manual"?240:900;M.tIso=M.tDet==null?(cfg.esd==="auto"?420:cfg.esd==="manual"?420:900):M.tDet+delay;
 M.tIso=Math.min(M.tIso,Math.max(20,src.inv/Math.max(Q0,.01)));
 const dt=2,N=Math.ceil(1500/dt)+1,Qt=new Float32Array(N),Qv=new Float32Array(N),PA=new Float32Array(N),PM=new Float32Array(N);let pm=0;
 const tau=Math.min(150,Math.max(20,.4*src.inv/Math.max(Q0,.01)));
 for(let i=0;i<N;i++){const t=i*dt;let q=t<M.tIso?Q0:Q0*Math.exp(-(t-M.tIso)/tau);if(q<Q0*.003)q=0;Qt[i]=q;
  let ev=0;if(!f.gas){const rain=(1-Fv)*q,area=Math.min(250,Math.max(0,pm/(f.rl*.02))),d=Math.max(1,Math.sqrt(4*area/Math.PI)),E=.0048*Math.pow(u,.78)*Math.pow(d,-.11)*(f.pv*(f.M/1000)/(8.314*303))*Math.pow(2,-.67);ev=Math.min(E*area,pm/dt+rain);
   pm=Math.max(0,pm+(rain-ev)*dt);PA[i]=Math.min(250,pm/(f.rl*.02));PM[i]=pm}
  Qv[i]=f.gas?q:Fv*q+ev}
 M.dt=dt;M.Qt=Qt;M.Qv=Qv;M.PA=PA;M.PM=PM;
 /* the cloud moves at wind speed, so the source rate at a distance is the rate from x/u seconds earlier */
 M.qv=(t)=>{if(t<0)return 0;const i=t/dt,a=Math.floor(i);if(a>=N-1)return Qv[N-1];return Qv[a]+(Qv[a+1]-Qv[a])*(i-a)};
 M.qt=(t)=>t<0?0:Qt[Math.min(N-1,Math.floor(t/dt))];
 /* concentration as % of the lower flammable limit at downwind x, crosswind y, height z, at time t */
 M.k=(x,t)=>{if(x<=0)return 0;const q=M.qv(t-x/u);if(q<=0)return 0;const[sy,sz]=hseSig(x,cfg.st,M.dense);return{q,sy,sz,K:q/(2*Math.PI*u*sy*sz)/(f.M)/.0416*100,H:hseH(M,x)}};
 M.c=(x,y,z,t)=>{const k=M.k(x,t);if(!k)return 0;const g=Math.exp(-Math.pow(z-k.H,2)/(2*k.sz*k.sz))+Math.exp(-Math.pow(z+k.H,2)/(2*k.sz*k.sz));return k.K*g*Math.exp(-y*y/(2*k.sy*k.sy))/f.lfl*100};
 M.xmax=900;
 return M}
/* outline of one concentration level at time t as {x, y half width at height} rows */
function hseSlices(M,t,lvl,z){const rows=[];for(let x=3;x<=M.xmax;x+=3){const k=M.k(x,t);if(!k)continue;const g=Math.exp(-Math.pow(z-k.H,2)/(2*k.sz*k.sz))+Math.exp(-Math.pow(z+k.H,2)/(2*k.sz*k.sz)),v=k.K*g/M.f.lfl*100;if(v<lvl)continue;rows.push([x,k.sy*Math.sqrt(2*Math.log(v/lvl))])}return rows}
/* farthest ground distance at which a level is reached, at time t */
function hseReach(M,t,lvl,z){let r=0;for(let x=3;x<=M.xmax;x+=3){const k=M.k(x,t);if(!k)continue;const g=Math.exp(-Math.pow((z||1.5)-k.H,2)/(2*k.sz*k.sz))+Math.exp(-Math.pow((z||1.5)+k.H,2)/(2*k.sz*k.sz));if(k.K*g/M.f.lfl*100>=lvl)r=x}return r}
/* mass of vapour inside the flammable range */
function hseFlamMass(M,t){let m=0;const f=M.f;for(let x=3;x<=M.xmax;x+=3){const k=M.k(x,t);if(!k)continue;const top=k.K*2/f.lfl*100;if(top<100)continue;
  const cq=k.q/(2*Math.PI*M.u*k.sy*k.sz);for(let z=.25;z<=Math.min(40,k.H+4*k.sz);z+=.5){const g=Math.exp(-Math.pow(z-k.H,2)/(2*k.sz*k.sz))+Math.exp(-Math.pow(z+k.H,2)/(2*k.sz*k.sz)),pk=k.K*g;if(pk<f.lfl)continue;
   for(let y=0;y<=5*k.sy;y+=Math.max(.5,k.sy/6)){const ph=pk*Math.exp(-y*y/(2*k.sy*k.sy));if(ph>=f.lfl&&ph<=f.ufl)m+=cq*g*Math.exp(-y*y/(2*k.sy*k.sy))*3*.5*Math.max(.5,k.sy/6)*2}}}
 return m}
/* ---------- fires and explosions ---------- */
function hseJet(M,t){const q=M.qt(t),f=M.f,L=Math.min(120,6.5*Math.sqrt(Math.max(q,.01))),qr=.2*q*f.hc;
 const rr=th=>Math.sqrt(Math.max(0,.8*qr/(4*Math.PI*th*1000)));return{q,L,qr,r:HSE_LIM.heat.map(h=>rr(h[0])),mid:L*.5}}
function hsePool(M,t){const f=M.f;if(f.gas)return null;const i=Math.min(M.PA.length-1,Math.round(t/M.dt)),area=Math.max(M.PA[i],M.PA[Math.max(0,i-5)],M.PA[Math.min(M.PA.length-1,i+5)]);if(area<1)return null;
 const D=Math.min(30,Math.sqrt(4*area/Math.PI)),mdot=f.burn*area,H=42*D*Math.pow(f.burn/(1.2*Math.sqrt(9.81*D)),.61),qr=.25*mdot*f.hc;
 const rr=th=>Math.max(D/2,Math.sqrt(.8*qr/(4*Math.PI*th*1000)));return{area,D,H,mdot,r:HSE_LIM.heat.map(h=>rr(h[0]))}}
const hsePs=(Z)=>808*(1+Math.pow(Z/4.5,2))/Math.sqrt((1+Math.pow(Z/.048,2))*(1+Math.pow(Z/.32,2))*(1+Math.pow(Z/1.35,2)));
function hseBlast(M,t,eta){const m=hseFlamMass(M,t),W=Math.max(.01,eta*m*M.f.hc/4.68e6),R=kPa=>{let lo=.5,hi=800;for(let i=0;i<50;i++){const mid=(lo+hi)/2,p=hsePs(mid/Math.cbrt(W))*101.3/1;(p>kPa?lo=mid:hi=mid)}return(lo+hi)/2};
 return{m,W,eta,r:HSE_LIM.blast.map(b=>R(b[0])),x0:Math.max(5,hseReach(M,t,100,1)*.45)}}
/* ---------- geometry on the plot plan ---------- */
const hseDir=()=>{const a=PP.wind*Math.PI/180;return[-Math.sin(a),Math.cos(a)]};
function hseToPlan(M,x,y){const d=hseDir(),s=POS[M.cfg.n];return[s[0]+d[0]*x-d[1]*y,s[1]+d[1]*x+d[0]*y]}
function hseFromPlan(M,p){const d=hseDir(),s=POS[M.cfg.n],rx=p[0]-s[0],ry=p[1]-s[1];return[rx*d[0]+ry*d[1],-rx*d[1]+ry*d[0]]}
/* full run: model plus the events at the chosen times */
function hseRun(){const cfg={n:HSE.n,hole:HSE.hole,u:HSE.u,st:HSE.st,esd:HSE.esd,sc:HSE.sc};const M=hseModel(cfg);if(!M)return null;
 const R={M,cfg,t:HSE.t};R.jet=hseJet(M,Math.min(30,M.tIso));R.pool=hsePool(M,HSE.ign>=0?HSE.ign:Math.min(120,M.tIso));
 R.eta=.03;R.blast=null;R.flash=null;
 if(HSE.sc==="cloud"&&HSE.ign>=0){R.blast=hseBlast(M,HSE.ign,R.eta);R.flash=hseReach(M,HSE.ign,100,1)}
 /* receptors */
 const rec=[],unitsR=K.sets.map(s=>({id:s.tag,p:POS[s.n],kind:"Unit",n:s.n})),extra=[{id:"Control room",p:CRP,kind:"Building"},{id:"Muster point A",p:MUS.A,kind:"Muster"},{id:"Muster point B",p:MUS.B,kind:"Muster"},{id:"Gate 1",p:[110,248],kind:"Gate"},{id:"Gate 2",p:[250,248],kind:"Gate"}];
 [...unitsR,...extra].forEach(r=>{const q=hseFromPlan(M,r.p);let pk=0;for(let t=0;t<=Math.min(900,M.tIso+300);t+=10){const c=M.c(q[0],q[1],1.5,t);if(c>pk)pk=c}
  const sameUnit=r.n===cfg.n,dist=Math.hypot(r.p[0]-POS[cfg.n][0],r.p[1]-POS[cfg.n][1]);let flux=0,op=0;
  if(HSE.sc==="jet"){const c=hseToPlan(M,R.jet.mid,0),dd=Math.max(2,Math.hypot(r.p[0]-c[0],r.p[1]-c[1]));flux=.8*R.jet.qr/(4*Math.PI*dd*dd)/1000}
  else if(HSE.sc==="pool"&&R.pool){const dd=Math.max(R.pool.D/2,dist);flux=.8*.25*R.pool.mdot*M.f.hc/(4*Math.PI*dd*dd)/1000}
  if(R.blast){const c=hseToPlan(M,R.blast.x0,0),dd=Math.max(2,Math.hypot(r.p[0]-c[0],r.p[1]-c[1]));op=hsePs(dd/Math.cbrt(R.blast.W))*101.3}
  rec.push(Object.assign({},r,{dist,pk,flux,op,sameUnit}))});
 R.rec=rec;return R}
/* the walk to a muster point, started after the response delay, checked against the cloud over time */
function hseWalk(R,k,from){const M=R.M,r=ppRoute(from,MUS[k]),L=plen(r),v=2.2,T=Math.ceil(L/v),cum=[0];for(let i=1;i<r.length;i++)cum.push(cum[i-1]+eu(r[i],r[i-1]));let pk=0,s50=0,s100=0,hot=0;
 for(let t=0;t<=T;t++){const s=Math.min(L,t*v);let i=1;while(i<cum.length-1&&cum[i]<s)i++;const f=cum[i]-cum[i-1]?(s-cum[i-1])/(cum[i]-cum[i-1]):1,p=[r[i-1][0]+(r[i][0]-r[i-1][0])*f,r[i-1][1]+(r[i][1]-r[i-1][1])*f],q=hseFromPlan(M,p),c=M.c(q[0],q[1],1.5,HSE.resp+t);
  if(c>pk)pk=c;if(c>=50)s50++;if(c>=100)s100++;
  if(HSE.sc==="jet"){const cc=hseToPlan(M,R.jet.mid,0),dd=Math.max(2,eu(p,cc)),fl=.8*R.jet.qr/(4*Math.PI*dd*dd)/1000;if(fl>4.7)hot++}}
 return{k,L:Math.round(L),T,pk:Math.round(pk),s50,s100,hot,route:ppDescr(r)}}
/* ---------- 2D drawing on the plot plan ---------- */
const hseMap=p=>[PX(p[0]),PY(p[1])];
function hseOverlay(R,t){if(!R)return"";const M=R.M,cfg=R.cfg,o=[],P=(x,y)=>hseMap(hseToPlan(M,x,y)),poly=(pts,fill,stroke,extra)=>`<polygon points="${pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="1.3" ${extra||""}/>`;
 const src=hseMap(POS[cfg.n]);
 /* gas detectors on a ring around the source */
 o.push(`<circle cx="${src[0]}" cy="${src[1]}" r="${12*PS}" fill="none" stroke="#2e6bd6" stroke-dasharray="2 4" opacity=".55"/>`);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=src[0]+Math.cos(a)*12*PS,y=src[1]+Math.sin(a)*12*PS;o.push(`<rect x="${x-3}" y="${y-3}" width="6" height="6" fill="#2e6bd6" transform="rotate(45 ${x} ${y})"/>`)}
 if(HSE.sc==="cloud"||HSE.ign>=0&&HSE.sc==="cloud"){
  [[25,"rgba(246,200,40,.30)","#b8860b"],[50,"rgba(244,140,40,.36)","#c2570c"],[100,"rgba(214,48,39,.46)","#a3151b"]].forEach(([lvl,fill,stroke])=>{const rows=hseSlices(M,t,lvl,1.5);if(rows.length<2)return;
   const pts=[...rows.map(r=>P(r[0],r[1])),...rows.slice().reverse().map(r=>P(r[0],-r[1]))];o.push(poly(pts,fill,stroke,`class="hsecl"`))});
  const r100=hseReach(M,t,100,1.5),r50=hseReach(M,t,50,1.5);
  if(r50>0){const q=P(r50+4,0);o.push(`<text x="${q[0]}" y="${q[1]}" font-size="9.5" font-weight="700" fill="#8a2a00" paint-order="stroke" stroke="#fff" stroke-width="2.6">${Math.round(r50)} m</text>`)}
  if(HSE.ign>=0&&t>=HSE.ign&&R.blast){const bc=hseMap(hseToPlan(M,R.blast.x0,0)),k=Math.min(1,(t-HSE.ign)/6);
   R.blast.r.forEach((rad,i)=>{const col=HSE_LIM.blast[i][2];o.push(`<circle cx="${bc[0]}" cy="${bc[1]}" r="${rad*PS*k}" fill="${i===2?"rgba(240,138,36,.07)":"none"}" stroke="${col}" stroke-width="2" ${i===2?'stroke-dasharray="7 4"':""}/>`);
    if(k>=1)o.push(`<text x="${bc[0]+rad*PS*.71}" y="${bc[1]-rad*PS*.71}" font-size="9" font-weight="700" fill="${col}" paint-order="stroke" stroke="#fff" stroke-width="2.6">${HSE_LIM.blast[i][0]} kPa ${Math.round(rad)} m</text>`)});
   if(t-HSE.ign<2.5)o.push(`<circle cx="${bc[0]}" cy="${bc[1]}" r="${Math.max(8,(R.flash||10)*PS*.5)}" fill="rgba(255,200,60,.55)"/>`)}
 }
 if(HSE.sc==="jet"){const J=R.jet,a=P(0,0),b=P(J.L,0),n=hseDir(),w=J.L*.14*PS,px=-n[1],py=n[0];
  o.push(`<polygon points="${a[0]},${a[1]} ${(a[0]+b[0])/2+px*w},${(a[1]+b[1])/2+py*w} ${b[0]},${b[1]} ${(a[0]+b[0])/2-px*w},${(a[1]+b[1])/2-py*w}" fill="rgba(255,150,30,.75)" stroke="#d1242f" class="hsefl"/>`);
  const c=hseMap(hseToPlan(M,J.mid,0));J.r.forEach((r,i)=>o.push(`<circle cx="${c[0]}" cy="${c[1]}" r="${r*PS}" fill="${i===2?"rgba(240,138,36,.07)":"none"}" stroke="${HSE_LIM.heat[i][2]}" stroke-width="2" ${i===2?'stroke-dasharray="7 4"':""}/><text x="${c[0]+r*PS*.71}" y="${c[1]+r*PS*.71}" font-size="9" font-weight="700" fill="${HSE_LIM.heat[i][2]}" paint-order="stroke" stroke="#fff" stroke-width="2.6">${HSE_LIM.heat[i][0]} kW/m² ${Math.round(r)} m</text>`))}
 if(HSE.sc==="pool"&&R.pool){const Pl=R.pool,c=src;o.push(`<circle cx="${c[0]}" cy="${c[1]}" r="${Pl.D/2*PS}" fill="rgba(255,140,30,.7)" stroke="#d1242f" class="hsefl"/>`);
  Pl.r.forEach((r,i)=>o.push(`<circle cx="${c[0]}" cy="${c[1]}" r="${r*PS}" fill="${i===2?"rgba(240,138,36,.07)":"none"}" stroke="${HSE_LIM.heat[i][2]}" stroke-width="2" ${i===2?'stroke-dasharray="7 4"':""}/><text x="${c[0]+r*PS*.71}" y="${c[1]+r*PS*.71}" font-size="9" font-weight="700" fill="${HSE_LIM.heat[i][2]}" paint-order="stroke" stroke="#fff" stroke-width="2.6">${HSE_LIM.heat[i][0]} kW/m² ${Math.round(r)} m</text>`))}
 /* the leak and the wind */
 o.push(`<g transform="translate(${src[0]} ${src[1]})"><circle r="${8+3*Math.sin(t*5)}" fill="rgba(209,36,47,.25)"/><circle r="4" fill="#d1242f"/></g>`);
 /* evacuee along the better route */
 if(R.walk&&t>=HSE.resp){const w=R.walk.best,r=ppRoute(ppAcc(cfg.n),MUS[w.k]),L=plen(r),s=Math.min(L,(t-HSE.resp)*2.2);let acc=0,pos=r[r.length-1];for(let i=1;i<r.length;i++){const d=eu(r[i],r[i-1]);if(acc+d>=s){const f=d?(s-acc)/d:0;pos=[r[i-1][0]+(r[i][0]-r[i-1][0])*f,r[i-1][1]+(r[i][1]-r[i-1][1])*f];break}acc+=d}
  const q=hseMap(pos);o.push(`<polyline points="${r.map(p=>hseMap(p).join(",")).join(" ")}" fill="none" stroke="#1a7f37" stroke-width="2" stroke-dasharray="5 4" opacity=".8"/><circle cx="${q[0]}" cy="${q[1]}" r="6" fill="#1a7f37" stroke="#fff" stroke-width="2"/>`)}
 return o.join("")}
/* ---------- run, redraw, time ---------- */
function hseCalc(){HSE.R=hseRun();const R=HSE.R;if(!R)return;const from=ppAcc(HSE.n),w=["A","B"].map(k=>hseWalk(R,k,from)),score=x=>x.s100*1000+x.s50*100+x.pk+x.hot*500+x.L*.01;R.walk={A:w[0],B:w[1],best:score(w[0])<=score(w[1])?w[0]:w[1]};
 /* worst case over the whole event */
 let r100=0,r50=0,r25=0,tr=0;for(let t=0;t<=Math.min(HSE.tmax,900);t+=10){const a=hseReach(R.M,t,100,1.5),b=hseReach(R.M,t,50,1.5),c=hseReach(R.M,t,25,1.5);if(a>r100)r100=a;if(b>r50)r50=b;if(c>r25){r25=c;tr=t}}
 R.reach={r100,r50,r25,tmax:tr};const cr=R.rec.find(x=>x.id==="Control room");R.crT=null;if(cr){const q=hseFromPlan(R.M,cr.p);for(let t=0;t<=900;t+=5){if(R.M.c(q[0],q[1],1.5,t)>=25){R.crT=t;break}}}}
function hseDraw(){const R=HSE.R;if(!R)return;const g=document.getElementById("hseov");if(g)g.innerHTML=hseOverlay(R,HSE.t);const s=document.getElementById("hsedyn");if(s)s.innerHTML=hseDyn();const sl=document.getElementById("hsesl");if(sl)sl.value=HSE.t;const tl=document.getElementById("hsetl");if(tl)tl.textContent=Math.round(HSE.t)+" s";if(typeof hse3Draw==="function"&&HSE.view==="3d")hse3Draw()}
function hseSet(k,v){HSE[k]=typeof HSE[k]==="number"?+v:v;if(k==="n"){HSE.inv=null}HSE.t=Math.min(HSE.t,HSE.tmax);hseCalc();if(HSE.view!=="3d")ppUpd(true);hsePanelRefresh()}
function hsePanelRefresh(){const p=document.getElementById("ppp");if(p)p.innerHTML=ppPanel();hseDraw()}
function hsePlay(){HSE.play=!HSE.play;clearInterval(HSE.timer);if(HSE.play){if(HSE.t>=HSE.tmax)HSE.t=0;HSE.timer=setInterval(()=>{if(!document.getElementById("hsesl")&&!document.getElementById("hse3")){clearInterval(HSE.timer);HSE.play=false;return}HSE.t=Math.min(HSE.tmax,HSE.t+.1*HSE.speed);if(HSE.t>=HSE.tmax){HSE.play=false;clearInterval(HSE.timer);const b=document.getElementById("hseplay");if(b)b.textContent="Replay"}hseDraw()},100)}
 const b=document.getElementById("hseplay");if(b)b.textContent=HSE.play?"Pause":"Play"}
function hseSeek(v){HSE.t=+v;hseDraw()}
function hseIgnite(){HSE.sc="cloud";HSE.ign=Math.round(HSE.t);hseCalc();if(HSE.view!=="3d")ppUpd(true);hsePanelRefresh()}
function hseClearIgn(){HSE.ign=-1;hseCalc();if(HSE.view!=="3d")ppUpd(true);hsePanelRefresh()}
function hseView(v){HSE.view=v;render();setTimeout(()=>{if(v==="3d")hse3Init()},30)}
/* ---------- panel ---------- */
const hseF=(v,d)=>Number.isFinite(v)?v.toFixed(d==null?0:d):"n/a";
function hseDyn(){const R=HSE.R;if(!R)return"";const M=R.M,t=HSE.t,r100=hseReach(M,t,100,1.5),r50=hseReach(M,t,50,1.5),r25=hseReach(M,t,25,1.5);let rel=0;for(let i=0;i*M.dt<=t&&i<M.Qt.length;i++)rel+=M.Qt[i]*M.dt;
 const st=t<M.tIso?"Release running":M.qt(t)>0?"Isolated, line draining":"Release finished";
 return `<div class="hsegrid"><div><b>${Math.round(t)} s</b><span>time</span></div><div><b>${hseF(rel)} kg</b><span>released so far</span></div><div><b>${r100?r100+" m":"none"}</b><span>cloud above 100% LFL</span></div><div><b>${r50?r50+" m":"none"}</b><span>above 50% LFL</span></div><div><b>${r25?r25+" m":"none"}</b><span>above 25% LFL</span></div><div><b>${st}</b><span>status</span></div></div>`}
const hseCls=(v,a,b)=>v>=b?"bad":v>=a?"warn":"ok";
function hseRecRows(R){return R.rec.map(r=>{let tag="ok",txt="No effect expected";
  if(HSE.sc==="cloud"){if(r.pk>=100){tag="bad";txt=`Inside the flammable cloud (${Math.round(r.pk)}% of LFL)`}else if(r.pk>=25){tag="warn";txt=`Gas reaches it (${Math.round(r.pk)}% of LFL). Ignition risk`}else if(r.pk>=5){txt=`Traces only (${Math.round(r.pk)}% of LFL)`}
   if(R.blast&&r.op>=7){tag=r.op>=21?"bad":"warn";txt+=`${txt==="No effect expected"?"":". "}Blast ${hseF(r.op,0)} kPa`}}
  else{if(r.flux>=37.5){tag="bad";txt=`${hseF(r.flux,1)} kW/m². Equipment damage, escalation`}else if(r.flux>=12.5){tag="bad";txt=`${hseF(r.flux,1)} kW/m². Fatal within a minute`}else if(r.flux>=4.7){tag="warn";txt=`${hseF(r.flux,1)} kW/m². Pain within 15 s`}else if(r.flux>=1.6){txt=`${hseF(r.flux,1)} kW/m². Tolerable for long periods`}}
  return `<tr><td><b>${esc(r.id)}</b><div class="muted" style="font-size:11px">${r.kind}${r.sameUnit?" | source":""}, ${Math.round(r.dist)} m away</div></td><td><span class="tag ${tag}">${esc(txt)}</span></td></tr>`}).join("")}
function hseActions(R){const M=R.M,a=[],cr=R.rec.find(x=>x.id==="Control room"),mA=R.rec.find(x=>x.id==="Muster point A"),mB=R.rec.find(x=>x.id==="Muster point B"),tag=S(HSE.n).tag;
 if(M.tDet==null)a.push(`The release is too small for the gas detectors to see at 12 m. Operators would find it by smell or by the leak itself, so check the area on rounds and add detectors closer to ${tag}.`);
 else a.push(`The detectors alarm about ${Math.round(M.tDet)} s after the leak starts. ${HSE.esd==="auto"?"Shutdown closes the isolation valves "+Math.round(M.tIso-M.tDet)+" s later, at "+Math.round(M.tIso)+" s.":HSE.esd==="manual"?"With manual shutdown the operator closes the valves at about "+Math.round(M.tIso)+" s, after "+hseF(M.Q0*M.tIso)+" kg has gone out.":"With shutdown failed the leak runs until the inventory is gone."}`);
 if(HSE.sc==="cloud"){if(R.crT!=null)a.push(`Gas reaches the control room air intake at ${R.crT} s. Close the intake dampers and stop ignition sources before then.`);else a.push("Gas does not reach 25% of the LFL at the control room in this wind.");
  if(mA&&mA.pk>=25&&mB&&mB.pk<25)a.push("Muster point A is in the gas. Send people to muster point B and keep them crosswind of the cloud.");else if(mB&&mB.pk>=25&&mA&&mA.pk<25)a.push("Muster point B is in the gas. Send people to muster point A.");else if(mA&&mA.pk>=25&&mB&&mB.pk>=25)a.push("Both muster points see gas. Move to the gates upwind and call for outside help.");
  if(R.reach.r50>0)a.push(`Keep ignition sources out of the ${R.reach.r50} m zone. Stop vehicles on the road if it falls inside.`);
  if(R.blast)a.push(`If the cloud ignites at ${HSE.ign} s about ${hseF(R.blast.m)} kg of vapour is in the flammable range, which equals about ${hseF(R.blast.W,1)} kg of TNT. Blast damage of 21 kPa reaches ${hseF(R.blast.r[1])} m.`)}
 if(HSE.sc==="jet")a.push(`The flame is about ${hseF(R.jet.L)} m long. Turn the fire monitors on the neighbouring units and keep the area within ${hseF(R.jet.r[1])} m clear of people.`);
 if(HSE.sc==="pool"&&R.pool)a.push(`The pool is about ${hseF(R.pool.D)} m across and the flame about ${hseF(R.pool.H)} m high. Use foam and cool the nearest vessels.`);
 if(HSE.sc==="pool"&&!R.pool)a.push("No pool forms in this case, so there is no pool fire. Try a liquid hexane source or a larger hole.");
 const w=R.walk.best;a.push(`The better walk to a muster point is ${w.k}: ${w.L} m, ${w.T} s, ${w.pk?`peak ${w.pk}% of LFL on the way`:"clear of gas on the way"}.`);return a}
function hseBarriers(R){const M=R.M,n=HSE.n,xv=(D[n]&&D[n].n.find(x=>/^XV-/.test(String(x[0]))))||null;
 return [["Gas detection",M.tDet==null?["Does not see this leak","bad"]:["Alarms at "+Math.round(M.tDet)+" s (20% of LFL)","ok"]],
  ["Shutdown valve"+(xv?" "+xv[0]:""),[HSE.esd==="auto"?"Closes at "+Math.round(M.tIso)+" s":HSE.esd==="manual"?"Operator closes at "+Math.round(M.tIso)+" s":"Failed. Release runs on",HSE.esd==="auto"?"ok":HSE.esd==="manual"?"warn":"bad"]],
  ["Fire monitors and hydrants",["Fixed monitors beside each flammable unit","ok"]],
  ["Muster points",[R.rec.find(x=>x.id==="Muster point A").pk>=25&&R.rec.find(x=>x.id==="Muster point B").pk>=25?"Both reached by gas":"At least one is clear",R.rec.find(x=>x.id==="Muster point A").pk>=25&&R.rec.find(x=>x.id==="Muster point B").pk>=25?"bad":"ok"]],
  ["Control room",[R.crT!=null?"Gas arrives at "+R.crT+" s":"Gas does not arrive",R.crT!=null?"warn":"ok"]]]}
function hsePanel(){const R=HSE.R,units=hseUnits(),sel=(k,opts,cur)=>`<select onchange="hseSet('${k}',this.value)">${opts.map(([v,l])=>`<option value="${v}" ${String(cur)===String(v)?"selected":""}>${l}</option>`).join("")}</select>`;
 if(!R)return `<h3>Hazard simulator</h3><p class="muted">Choose a flammable unit.</p>`;
 const M=R.M,src=M.src,w=R.walk,fireRows=[];
 const eff=[];
 eff.push(["Release",`${hseF(M.Q0,1)} kg/s through a ${HSE.hole} mm hole at ${src.P} barg, ${src.T} °C`]);
 if(!M.f.gas)eff.push(["Flash and pool",`${Math.round(M.Fv*100)}% of the liquid becomes vapour at once; the rest forms a pool`]);
 eff.push(["Mass out by shutdown",`${hseF(M.Q0*Math.min(M.tIso,src.inv/Math.max(M.Q0,.01)))} kg (inventory ${hseF(src.inv)} kg)`]);
 if(HSE.sc==="cloud"){eff.push(["Cloud over 100% of LFL",R.reach.r100?`up to ${R.reach.r100} m downwind`:"never"]);eff.push(["Cloud over 50% of LFL",R.reach.r50?`up to ${R.reach.r50} m`:"never"]);eff.push(["Cloud over 25% of LFL",R.reach.r25?`up to ${R.reach.r25} m, reached at ${R.reach.tmax} s`:"never"]);
  if(R.blast){eff.push(["Ignited at",HSE.ign+" s"]);eff.push(["Vapour in flammable range",hseF(R.blast.m)+" kg"]);R.blast.r.forEach((r,i)=>eff.push([HSE_LIM.blast[i][0]+" kPa",`${hseF(r)} m. ${HSE_LIM.blast[i][1]}`]))}}
 if(HSE.sc==="jet"){eff.push(["Flame length",hseF(R.jet.L)+" m"]);R.jet.r.forEach((r,i)=>eff.push([HSE_LIM.heat[i][0]+" kW/m²",`${hseF(r)} m. ${HSE_LIM.heat[i][1]}`]))}
 if(HSE.sc==="pool"&&R.pool){eff.push(["Pool",`${hseF(R.pool.D)} m across, flame ${hseF(R.pool.H)} m high`]);R.pool.r.forEach((r,i)=>eff.push([HSE_LIM.heat[i][0]+" kW/m²",`${hseF(r)} m. ${HSE_LIM.heat[i][1]}`]))}
 const opl=K.opl.find(o=>o.set===HSE.n);
 return `<div class="hsebox"><div class="row between"><h3 style="margin:0">Hazard simulator</h3><span class="tag warn">Screening model</span></div>
 <div class="hseform"><label>What happens${sel("sc",[["cloud","Gas cloud (can be ignited)"],["jet","Jet fire (ignited at once)"],["pool","Pool fire (liquid hexane)"]],HSE.sc)}</label>
  <label>Where${sel("n",units.map(s=>[s.n,s.tag+" | "+HSE_F[hseKey(s.n)].name]),HSE.n)}</label>
  <label>Hole size${sel("hole",[[10,"10 mm (small flange leak)"],[25,"25 mm (gasket blowout)"],[50,"50 mm (large leak)"],[100,"100 mm (line rupture)"]],HSE.hole)}</label>
  <label>Wind speed <b>${HSE.u} m/s</b><input type="range" min="1.5" max="12" step=".5" value="${HSE.u}" onchange="hseSet('u',this.value)"></label>
  <label>Wind from${sel("wind",[["N",0],["NE",45],["E",90],["SE",135],["S",180],["SW",225],["W",270],["NW",315]].map(([l,a])=>[a,l]),PP.wind).replace("hseSet('wind',this.value)","hseWind(this.value)")}</label>
  <label>Weather${sel("st",[["B","Sunny day (unstable)"],["D","Overcast (neutral)"],["F","Clear calm night (stable)"]],HSE.st)}</label>
  <label>Shutdown${sel("esd",[["auto","Automatic on gas alarm"],["manual","Manual, operator acts"],["fail","Fails to close"]],HSE.esd)}</label>
  <label>Operator reacts after <b>${HSE.resp} s</b><input type="range" min="10" max="180" step="5" value="${HSE.resp}" onchange="hseSet('resp',this.value)"></label></div>
 ${HSE.sc==="cloud"?`<div class="row" style="gap:6px;margin:8px 0">${HSE.ign>=0?`<span class="tag bad">Ignited at ${HSE.ign} s</span><button class="ghost" onclick="hseClearIgn()">Remove ignition</button>`:`<button onclick="hseIgnite()">Ignite the cloud at ${Math.round(HSE.t)} s</button><span class="muted" style="font-size:12px">Move the time slider first to choose when</span>`}</div>`:""}
 <div id="hsedyn" class="hsedyn">${hseDyn()}</div>
 <h4>Effects</h4><table class="mht">${eff.map(e=>`<tr><td style="width:44%">${esc(e[0])}</td><td>${esc(e[1])}</td></tr>`).join("")}</table>
 <h4>Who and what is affected</h4><table class="mht">${hseRecRows(R)}</table>
 <h4>Walk to muster</h4><table class="mht"><tr><th>Muster</th><th>Distance</th><th>Time</th><th>Peak gas</th><th>Time above 50%</th></tr>${["A","B"].map(k=>{const x=w[k];return `<tr class="${w.best.k===k?"cur":""}"><td><b>${k}</b>${w.best.k===k?" (better)":""}</td><td>${x.L} m</td><td>${x.T} s</td><td>${x.pk}% of LFL</td><td>${x.s50?`<span class="tag bad">${x.s50} s</span>`:'<span class="tag ok">none</span>'}</td></tr>`}).join("")}</table>
 <h4>Barriers in this case</h4><table class="mht">${hseBarriers(R).map(b=>`<tr><td>${esc(b[0])}</td><td><span class="tag ${b[1][1]}">${esc(b[1][0])}</span></td></tr>`).join("")}</table>
 <h4>What to do</h4><ul class="hseul">${hseActions(R).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
 ${opl?`<h4>From the one point lesson</h4><p class="muted" style="font-size:12.5px;margin:0">${esc(opl.no)}: ${esc((opl.safety||[])[0]||"")} <a class="alink" onclick="go('opl',{opl:'${opl.no}'})">Open the lesson</a></p>`:""}
 <p class="muted" style="font-size:11.5px;margin:8px 0 0">Gaussian plume for an industrial site, orifice flow, Burgess pool burning rate, point-source flame radiation and a TNT equivalent blast. The cloud is treated as passing over the units without being blocked. Use it to compare cases, and take real decisions from a consequence study.</p></div>`}

function hseWind(v){PP.wind=+v;hseCalc();if(HSE.view!=="3d")ppUpd(true);hsePanelRefresh()}
/* ---------- plot plan page: the hazard simulator replaces the old release drill ---------- */
const hseMapHTML=()=>PP.mode==="hazard"&&HSE.view==="3d"?`<div id="hse3" class="hse3"><canvas></canvas><div class="hse3k"></div><div class="hse3tip">Drag to look around, scroll to zoom, right-drag to move</div></div>`:mapSvg(0,{full:true});
const hseTL=()=>`<div class="hsetl"><button id="hseplay" onclick="hsePlay()">${HSE.play?"Pause":HSE.t>=HSE.tmax?"Replay":"Play"}</button><input id="hsesl" type="range" min="0" max="${HSE.tmax}" step="1" value="${HSE.t}" oninput="hseSeek(this.value)" aria-label="Time since the leak started"><b id="hsetl">${Math.round(HSE.t)} s</b><label class="muted">Speed <select onchange="HSE.speed=+this.value">${[[2,"slow"],[6,"normal"],[15,"fast"]].map(([v,l])=>`<option value="${v}" ${HSE.speed===v?"selected":""}>${l}</option>`).join("")}</select></label><span class="hsetog"><button class="${HSE.view==="2d"?"on":""}" onclick="hseView('2d')">2D plan</button><button class="${HSE.view==="3d"?"on":""}" onclick="hseView('3d')">3D site</button></span></div>`;
function ppUpd(full){const p=$("#ppp");if(p)p.innerHTML=ppPanel();const t=$("#pptask");if(t)t.innerHTML=ppTaskBar();if(full){const m=$("#ppmap");if(m&&!(PP.mode==="hazard"&&HSE.view==="3d"&&m.querySelector("#hse3"))){m.innerHTML=hseMapHTML();if(PP.mode==="hazard"&&HSE.view==="3d")setTimeout(hse3Init,0)}}aiSetCtx("pp",ppCtx());
 const a=$("#ppat");if(a)a.textContent=PP.at;if(PP.mode==="hazard")hseDraw()}
const _ppPanel=ppPanel;ppPanel=function(){return PP.mode==="hazard"?(HSE.R?hsePanel():(hseCalc(),hsePanel())):_ppPanel()};
const _mapSvg=mapSvg;mapSvg=function(sel,opt){let s=_mapSvg.apply(this,arguments);if(opt&&opt.full&&PP.mode==="hazard"&&HSE.R)s=s.replace('<g id="ppcloud"></g>',`<g id="hseov">${hseOverlay(HSE.R,HSE.t)}</g><g id="ppcloud"></g>`);return s};
function ppBody(){const M=[["explore","Site overview"],["hazard","Hazard simulator"]],LY=[["areas","Areas"],["heat","Heat map"],["haz","Hazard zones"],["esc","Muster and gates"],["fire","Fire protection"],["walk","Walkways"]];
 if(PP.mode==="release")PP.mode="hazard";if(PP.mode==="hazard"&&!HSE.R)hseCalc();
 return `<div class="split" style="grid-template-columns:minmax(0,1fr) 380px"><div class="card" style="min-width:0"><div class="row between" style="margin-bottom:8px"><h3>Plot plan | LLDPE unit <span class="tag">TJC-LLD-PP-XXXX</span></h3><span class="row" style="gap:4px">${M.map(([k,l])=>`<button class="${PP.mode===k?"":"ghost"}" style="padding:5px 11px;font-size:12.5px" onclick="PP.mode='${k}';ppUpd(true);render()">${l}</button>`).join("")}</span></div>
  <div id="pptask">${ppTaskBar()}</div>
  ${PP.mode==="hazard"?hseTL():`<div class="chips" style="margin:8px 0 6px;align-items:center">${LY.map(([k,l])=>`<span class="chip" style="${PP.L[k]?"color:var(--acc);border-color:var(--acc)":""}" onclick="PP.L['${k}']=PP.L['${k}']?0:1;ppUpd(true);render()">${l}</span>`).join("")}<span style="margin-left:auto" class="row"><button class="ghost" style="padding:3px 10px" onclick="ppZoom(1.25)">-</button><button class="ghost" style="padding:3px 10px" onclick="ppZoom(0)">Fit</button><button class="ghost" style="padding:3px 10px" onclick="ppZoom(.8)">+</button>${PP.L.heat?modeSel():""}</span></div>`}
  <div id="ppmap">${hseMapHTML()}</div>
  <div class="row muted" style="font-size:12px;margin-top:6px"><span>${PP.mode==="hazard"?"Zones are drawn on the real plot plan in metres. Yellow, orange and red show 25%, 50% and 100% of the lower flammable limit":"Footprints to scale (E x N, metres). Drag to pan, scroll to zoom"}</span><span>The overlay layers are approximate</span></div></div>
  <div><div class="card" id="ppp">${ppPanel()}</div>${aiPanel("pp",ppCtx())}</div></div>`}
const _ppTaskBar=ppTaskBar;ppTaskBar=function(){if(PP.mode!=="hazard")return _ppTaskBar();return `<div class="otsbar"><span class="tag warn">Hazard simulator</span><span class="muted">${HSE.R?S(HSE.n).tag+" | "+HSE.R.M.f.name+" | "+({cloud:"gas cloud",jet:"jet fire",pool:"pool fire"})[HSE.sc]:"choose a source"}</span><span class="muted" style="margin-left:auto">Wind ${HSE.u} m/s from ${ppWindName(PP.wind)}</span></div>`};
/* leaving the page stops the clock */

