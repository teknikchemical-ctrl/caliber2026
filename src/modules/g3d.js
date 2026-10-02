/* =====================================================================================================
   3D EQUIPMENT MODELS
   Every machine is assembled from boxes, cylinders and ellipsoids that carry the same part numbers as the 2D drawing, so a click on
   a solid selects the same BOM item or nozzle. A small software renderer projects the solids to SVG (no external library, works
   offline): drag to rotate, wheel to zoom, buttons for standard views, X-ray (shows internals) and fan motion.
   Wherever an equipment drawing is shown, gaFig() puts a 2D / 3D switch above it.
   ===================================================================================================== */
regMod("g3d","1.0",[],"3D equipment models");
const G3={cfg:{},inst:{},seq:0,mode:(()=>{try{return localStorage.getItem("akp_gmode")||"2d"}catch(e){return"2d"}})(),mesh:{}};
const g3c={steel:"#a9b8c9",body:"#c6d3e2",dark:"#56657a",blue:"#5f8fd0",gray:"#8f9cae",amber:"#e0a43a",brass:"#c9a24a",water:"#8cc3ea",red:"#cf6a62",green:"#6fb883",cat:"#8a6a4a",white:"#e9eef4"};
const g3B=(k,x,y,z,w,h,d,c,o)=>Object.assign({t:"b",k,x,y,z,w,h,d,c},o),
 g3C=(k,ax,x,y,z,len,r,c,o,r2)=>Object.assign({t:"c",k,ax,x,y,z,len,r,r2:r2==null?r:r2,c},o),
 g3E=(k,ax,x,y,z,ra,rb,c,a0,a1,o)=>Object.assign({t:"e",k,ax,x,y,z,ra,rb,c,a0,a1},o);
const G3M={};
/* 1 pump: casing, bearing housing, coupling and motor on a baseplate */
G3M[1]=[g3B("11",0,.06,0,1.95,.12,.6,"gray"),
 g3C("M","x",.8,.42,0,.9,.26,"blue"),g3C("M","x",1.3,.42,0,.1,.27,"dark"),g3B("M",.8,.74,0,.24,.1,.22,"steel"),g3B("M",.6,.2,0,.3,.14,.5,"blue"),g3B("M",1.0,.2,0,.3,.14,.5,"blue"),
 g3C("10","x",.22,.42,0,.22,.1,"dark"),g3C("8","x",-.1,.42,0,.4,.13,"steel"),
 g3C("3","x",-.42,.42,0,1.1,.03,"dark",{in:1}),g3C("6","x",-.02,.42,0,.1,.1,"brass",{in:1}),g3C("7","x",-.28,.42,0,.1,.1,"brass",{in:1}),
 g3C("5","x",-.42,.42,0,.1,.09,"amber",{in:1}),g3C("4","x",-.47,.42,0,.14,.05,"steel",{in:1}),g3C("12","x",-.2,.42,0,.03,.12,"dark",{in:1}),
 g3C("9","z",-.64,.42,0,.05,.22,"steel",{in:1}),g3C("2","z",-.64,.42,0,.1,.19,"brass",{in:1}),
 g3C("1","z",-.64,.42,0,.3,.31,"body",{sh:1}),
 g3C("N2","y",-.64,.9,0,.4,.07,"amber"),g3C("N1","x",-1.0,.42,0,.3,.09,"amber"),g3C("N3","y",-.4,.78,0,.16,.04,"amber"),g3C("N4","y",-.64,.08,0,.14,.05,"amber"),g3C("N5","y",-.5,.78,.1,.16,.04,"amber")];
/* 2 rotary steam-tube dryer */
G3M[2]=(()=>{const a=[g3C("1","x",0,1.2,0,3.6,.72,"body",{sh:1}),g3C("1","x",-1.95,1.2,0,.3,.3,"body",{sh:1},.72),g3C("1","x",1.95,1.2,0,.3,.72,"body",{sh:1},.3),
 g3C("2","x",0,1.2,0,5,.06,"dark",{in:1}),g3C("4","x",-.9,1.2,0,.1,.86,"dark"),
 g3B("3",-2.35,.62,0,.25,.4,.5,"steel"),g3B("3",2.35,.62,0,.25,.4,.5,"steel"),g3B("6",-1.0,.45,0,.3,.5,.95,"gray"),g3B("6",1.0,.45,0,.3,.5,.95,"gray"),
 g3C("5","x",-2.5,1.2,0,.3,.13,"brass"),g3C("7","x",-2.2,1.2,0,.07,.18,"dark"),g3C("8","x",2.2,1.2,0,.07,.18,"dark"),g3C("9","x",-2.28,1.2,0,.03,.2,"dark"),g3C("10","x",2.28,1.2,0,.03,.2,"dark"),g3C("11","x",-2.37,1.2,0,.02,.16,"red"),
 g3C("N1","y",-1.4,2.15,0,.35,.1,"amber"),g3C("N2","y",1.4,.18,0,.35,.1,"amber"),g3C("N3","y",-2.1,1.95,0,.3,.06,"amber"),g3C("N4","y",2.1,1.95,0,.3,.06,"amber"),g3C("N5","y",-1.1,2.1,.2,.25,.05,"amber"),g3C("N6","y",1.1,2.1,.2,.25,.05,"amber")];
 for(let i=0;i<8;i++){const t=i/8*Math.PI*2;a.push(g3C("12","x",0,1.2+.46*Math.cos(t),.46*Math.sin(t),3.4,.05,"red",{in:1}))}return a})();
/* 3 vertical catalyst reactor */
G3M[3]=[g3C("10","y",0,.35,0,.7,.5,"gray"),g3C("1","y",0,2.1,0,2.8,.5,"body",{sh:1}),g3E("2","y",0,3.5,0,.28,.5,"body",0,Math.PI/2,{sh:1}),g3E("3","y",0,.7,0,.28,.5,"body",Math.PI/2,Math.PI,{sh:1}),
 g3C("12","y",0,1.75,0,1.3,.46,"cat",{in:1}),g3C("5","y",0,2.45,0,.04,.46,"steel",{in:1}),g3C("4","y",0,1.1,0,.04,.46,"steel",{in:1}),g3C("7","y",0,3.2,0,.3,.04,"amber",{in:1},.3),
 g3C("6","y",0,2.3,0,2.4,.025,"red",{in:1}),g3C("8","y",0,3.8,0,.12,.17,"steel"),g3C("11","y",0,3.74,0,.03,.19,"dark"),g3C("9","x",.62,3.1,0,.3,.06,"amber"),
 g3C("N1","x",-.62,3.05,0,.3,.07,"amber"),g3C("N2","x",.62,.95,0,.3,.07,"amber"),g3C("N3","x",.62,3.2,0,.3,.06,"amber"),g3C("N4","x",-.62,2.1,0,.3,.06,"amber"),g3C("M1","y",0,3.9,0,.05,.18,"amber"),g3C("M2","x",-.55,.5,0,.2,.1,"amber")];
/* 4 reciprocating recycle gas compressor with motor and intercooler */
G3M[4]=[g3B("",0,.06,0,4.2,.12,1.4,"gray"),g3C("M","x",-1.55,.85,0,1.2,.48,"blue"),g3B("M",-1.55,1.4,0,.4,.14,.3,"steel"),
 g3B("1",0,.85,0,1.3,1,.9,"body",{sh:1}),g3C("2","z",0,.85,0,.8,.07,"dark",{in:1}),g3C("10","z",-.45,.85,.2,.1,.11,"brass",{in:1}),
 g3B("3",.35,.85,.15,.5,.05,.06,"steel",{in:1}),g3B("4",.8,.95,.28,.2,.12,.12,"steel",{in:1}),g3B("4",.8,.95,-.28,.2,.12,.12,"steel",{in:1}),
 g3C("5","x",1.5,.95,.28,1,.27,"body",{sh:1}),g3C("5","x",1.3,.95,.28,.25,.23,"steel",{in:1}),g3C("6","x",1.45,.95,-.28,.9,.2,"body",{sh:1}),g3C("6","x",1.3,.95,-.28,.25,.17,"steel",{in:1}),
 g3C("7","x",1.18,.95,.28,.04,.245,"amber",{in:1}),g3C("9","x",.98,.95,.28,.1,.1,"dark"),g3B("8",1.5,1.28,.28,.2,.12,.14,"steel"),g3B("8",1.6,1.2,-.28,.2,.1,.12,"steel"),
 g3B("11",.4,.3,.55,.3,.25,.2,"gray"),g3C("12","x",1.2,1.85,0,1.4,.2,"water"),g3B("12",.55,1.45,0,.12,.35,.12,"steel"),g3B("12",1.85,1.45,0,.12,.35,.12,"steel"),
 g3C("N1","y",1.4,1.35,.28,.2,.06,"amber"),g3C("N2","y",1.6,1.35,.28,.2,.06,"amber"),g3C("N3","y",1.9,1.25,-.28,.2,.05,"amber"),g3C("N4","x",2.05,.95,-.28,.25,.07,"amber"),g3C("N5","y",1.1,.2,.28,.2,.06,"amber"),g3C("N6","x",.3,.35,.7,.2,.05,"amber")];
/* 5 shell and tube solvent heater */
G3M[5]=(()=>{const a=[g3C("1","x",0,.7,0,3.2,.3,"body",{sh:1}),g3C("2","x",-1.85,.7,0,.5,.34,"steel"),g3C("7","x",-2.12,.7,0,.04,.35,"dark"),g3C("8","x",-1.61,.7,0,.03,.36,"dark"),g3C("9","x",-2.08,.7,0,.03,.36,"red"),
 g3C("4","x",-1.58,.7,0,.04,.29,"steel",{in:1}),g3B("10",-.9,.28,0,.3,.45,.5,"gray"),g3B("10",.9,.28,0,.3,.45,.5,"gray"),g3C("11","y",1.3,.2,0,.2,.04,"amber"),g3B("12",1.55,.25,.35,.2,.2,.18,"dark"),
 g3C("N1","y",-1.85,1.15,0,.3,.08,"amber"),g3C("N2","y",-1.85,.25,0,.3,.08,"amber"),g3C("N3","y",1.2,1.1,0,.3,.08,"amber"),g3C("N4","y",.4,.25,0,.3,.08,"amber"),g3C("N5","y",-.6,1.1,0,.25,.06,"amber"),g3C("N6","y",1.5,.2,0,.2,.05,"amber")];
 [-.8,-.2,.4,1.0].forEach(x=>a.push(g3C("5","x",x,.7,0,.03,.27,"steel",{in:1})));
 [[0,0],[.1,.1],[-.1,.1],[.1,-.1],[-.1,-.1],[0,.17],[0,-.17]].forEach(([y,z])=>a.push(g3C("3","x",0,.7+y,z,3,.03,"brass",{in:1})));
 a.push(g3C("6","x",0,.93,.0,3,.012,"dark",{in:1}));return a})();
/* 6 control valve with diaphragm actuator */
G3M[6]=[g3C("N1","x",-.42,.38,0,.5,.09,"amber"),g3C("N2","x",.42,.38,0,.5,.09,"amber"),g3C("N1","x",-.62,.38,0,.04,.15,"dark"),g3C("N2","x",.62,.38,0,.04,.15,"dark"),
 g3C("1","y",0,.38,0,.42,.19,"body",{sh:1}),g3C("10","y",0,.6,0,.03,.14,"dark"),g3C("2","y",0,.72,0,.26,.11,"steel"),g3C("6","y",0,.88,0,.08,.05,"dark"),
 g3B("11",-.1,1.0,0,.03,.3,.05,"steel"),g3B("11",.1,1.0,0,.03,.3,.05,"steel"),g3C("4","y",0,.82,0,.9,.015,"dark",{in:1}),g3C("3","y",0,.38,0,.28,.1,"steel",{in:1}),g3C("5","y",0,.24,0,.04,.12,"brass",{in:1}),
 g3E("7","y",0,1.16,0,.16,.3,"blue",Math.PI/2,Math.PI,{sh:1}),g3E("7","y",0,1.16,0,.2,.3,"blue",0,Math.PI/2,{sh:1}),g3C("7","y",0,1.16,0,.02,.3,"dark",{in:1}),g3C("8","y",0,1.3,0,.25,.08,"brass",{in:1}),
 g3B("9",.4,1.0,0,.14,.14,.12,"steel"),g3C("9","x",.26,1.0,0,.2,.02,"dark"),g3B("12",.48,.65,.12,.12,.1,.1,"dark"),g3C("12","x",.2,.65,.12,.5,.012,"dark"),g3C("12","y",.4,.85,.12,.4,.012,"dark")];
/* 7 cooling tower cell with fan and drive */
G3M[7]=[g3B("",0,.5,0,2.4,1,2.4,"body",{sh:1}),g3B("12",-1.22,.45,0,.05,.7,1.6,"dark"),g3B("8",0,.55,0,2.3,.5,2.2,"water",{in:1}),g3B("7",0,.98,0,2.3,.08,2.2,"steel",{in:1}),
 g3B("6",0,1.05,0,2.4,.08,2.4,"gray"),g3C("6","y",0,1.22,0,.3,.85,"white",{sh:1}),g3C("2","y",0,1.4,0,.18,.1,"dark"),g3B("3",0,1.18,0,.3,.2,.26,"steel"),
 g3C("4","x",.75,1.2,0,1.2,.035,"dark"),g3C("5","x",1.55,1.2,0,.5,.17,"blue"),g3C("10","y",0,1.1,0,.08,.1,"brass",{in:1}),g3C("9","y",0,1.2,0,.03,.12,"dark"),g3B("11",.3,1.35,.1,.08,.06,.06,"red"),
 ...[0,90,180,270].map(a=>g3B("1",0,1.42,0,.78,.025,.16,"steel",{ry:a,off:[.4,0,0],anim:{ax:"y",rate:140,at:[0,1.42,0]}})),
 g3C("N1","x",-1.35,.7,0,.3,.1,"amber"),g3C("N2","x",1.3,.2,0,.3,.1,"amber"),g3C("N3","y",-.6,.0,0,.2,.07,"amber"),g3C("N4","y",.6,.0,0,.2,.07,"amber")];
/* 8 horizontal reflux accumulator drum with water boot */
G3M[8]=[g3C("1","x",0,1,0,2.4,.55,"body",{sh:1}),g3E("2","x",-1.2,1,0,.28,.55,"body",Math.PI/2,Math.PI,{sh:1}),g3E("2","x",1.2,1,0,.28,.55,"body",0,Math.PI/2,{sh:1}),
 g3C("3","y",.8,.35,0,.7,.2,"body",{sh:1}),g3B("4",-.7,.4,0,.25,.75,.9,"gray"),g3B("4",.5,.4,0,.25,.75,.9,"gray"),
 g3C("5","y",-.45,1.6,0,.1,.18,"steel"),g3C("11","y",-.45,1.57,0,.03,.2,"dark"),g3B("6",-.9,.8,0,.3,.2,.25,"steel",{in:1}),g3C("7","x",-.2,1.1,0,.04,.38,"steel",{in:1}),
 g3C("8","y",1.05,1.0,.62,1.1,.05,"steel"),g3C("8","x",1.05,1.5,.31,.64,.04,"steel"),g3C("8","x",1.05,.55,.31,.64,.04,"steel"),g3B("10",-.1,1.05,.56,.2,.12,.03,"dark"),g3C("12","y",-.3,.5,0,.08,.04,"amber"),
 g3C("N1","y",.2,1.7,0,.3,.08,"amber"),g3C("N2","y",-.85,.25,0,.3,.08,"amber"),g3C("N3","y",-.1,.25,0,.3,.08,"amber"),g3C("N4","y",.8,.1,0,.2,.07,"amber"),g3C("N5","y",.65,1.7,0,.3,.06,"amber"),g3C("M1","y",-.45,1.7,0,.2,.07,"amber")];
function g3Parts(p){ /* faces of one solid */
 const F=[],N=22,C=g3Parse(p.c.charAt(0)==="#"?p.c:(g3c[p.c]||"#a9b8c9")),mk=(pts,cen)=>{F.push({p:pts,k:p.k,c:C,sh:p.sh,in:p.in,cen,anim:p.anim,al:p.sh})};
 let cen,pts=[];
 if(p.t==="b"){const hx=p.w/2,hy=p.h/2,hz=p.d/2,o=p.off||[0,0,0];cen=[p.x,p.y,p.z];
  const V=[];for(const sx of[-1,1])for(const sy of[-1,1])for(const sz of[-1,1])V.push([sx*hx,sy*hy,sz*hz]);
  const tr=v=>{let q=[v[0]+o[0],v[1]+o[1],v[2]+o[2]];if(p.ry){const a=p.ry*Math.PI/180,c=Math.cos(a),s=Math.sin(a);q=[q[0]*c+q[2]*s,q[1],-q[0]*s+q[2]*c]}return[q[0]+p.x,q[1]+p.y,q[2]+p.z]};
  [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]].forEach(f=>mk(f.map(i=>tr(V[i])),cen));return F}
 const ax=p.ax,mp=(a,u,v)=>ax==="x"?[a,u,v]:ax==="y"?[u,a,v]:[u,v,a];
 if(p.t==="c"){cen=[p.x,p.y,p.z];const h=p.len/2,r1=p.r,r2=p.r2;
  for(let i=0;i<N;i++){const t0=i/N*Math.PI*2,t1=(i+1)/N*Math.PI*2,c0=Math.cos(t0),s0=Math.sin(t0),c1=Math.cos(t1),s1=Math.sin(t1);
   const q=[mp(-h,r1*c0,r1*s0),mp(-h,r1*c1,r1*s1),mp(h,r2*c1,r2*s1),mp(h,r2*c0,r2*s0)].map(v=>[v[0]+p.x,v[1]+p.y,v[2]+p.z]);mk(q,cen)}
  [[-h,r1],[h,r2]].forEach(([a,r])=>{if(r<=0)return;const f=[];for(let i=0;i<N;i++){const t=i/N*Math.PI*2;const v=mp(a,r*Math.cos(t),r*Math.sin(t));f.push([v[0]+p.x,v[1]+p.y,v[2]+p.z])}mk(f,cen)});return F}
 if(p.t==="e"){cen=[p.x,p.y,p.z];const LA=10,LO=N;
  for(let i=0;i<LA;i++){const a0=p.a0+(p.a1-p.a0)*i/LA,a1=p.a0+(p.a1-p.a0)*(i+1)/LA;
   for(let j=0;j<LO;j++){const t0=j/LO*Math.PI*2,t1=(j+1)/LO*Math.PI*2;
    const P=(a,t)=>{const v=mp(p.ra*Math.cos(a),p.rb*Math.sin(a)*Math.cos(t),p.rb*Math.sin(a)*Math.sin(t));return[v[0]+p.x,v[1]+p.y,v[2]+p.z]};
    mk([P(a0,t0),P(a0,t1),P(a1,t1),P(a1,t0)],cen)}}
  return F}
 return F}
function g3Parse(h){const m=/^#?([0-9a-f]{6})$/i.exec(h||"");if(m){const n=parseInt(m[1],16);return[n>>16,(n>>8)&255,n&255]}const r=/rgba?\(([^)]+)\)/.exec(h||"");if(r){const q=r[1].split(",").map(Number);return[q[0],q[1],q[2],q[3]]}return[169,184,201]}
/* faces of a whole model, cached; cutting and orientation fixed once */
function g3Mesh(n){if(G3.mesh[n])return G3.mesh[n];const faces=[];(G3M[n]||[]).forEach(p=>{g3Parts(p).forEach(f=>{const q=f.p,u=[q[1][0]-q[0][0],q[1][1]-q[0][1],q[1][2]-q[0][2]],v=[q[2][0]-q[0][0],q[2][1]-q[0][1],q[2][2]-q[0][2]];
  let nm=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...nm)||1;nm=nm.map(x=>x/l);
  const c=[0,1,2].map(i=>q.reduce((a,b)=>a+b[i],0)/q.length),cn=f.cen||[0,0,0];let off=p.t==="b"&&p.off?[cn[0]+p.off[0],cn[1]+p.off[1],cn[2]+p.off[2]]:cn;
  if(p.ry&&p.off){const a=p.ry*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a);off=[cn[0]+p.off[0]*cs+p.off[2]*sn,cn[1]+p.off[1],cn[2]-p.off[0]*sn+p.off[2]*cs]}
  const d=(c[0]-off[0])*nm[0]+(c[1]-off[1])*nm[1]+(c[2]-off[2])*nm[2];if(d<0)nm=nm.map(x=>-x);f.n=nm;f.m=c;faces.push(f)})});
 let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];faces.forEach(f=>f.p.forEach(v=>{for(let i=0;i<3;i++){mn[i]=Math.min(mn[i],v[i]);mx[i]=Math.max(mx[i],v[i])}}));
 const ctr=[(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2],R=Math.max(...[0,1,2].map(i=>(mx[i]-mn[i])/2),.5)*1.25,Rs=Math.hypot(...[0,1,2].map(i=>(mx[i]-mn[i])/2));
 const Rf=Math.max((mx[1]-mn[1])/2*1.12,Math.hypot((mx[0]-mn[0])/2,(mx[2]-mn[2])/2)*.78);return G3.mesh[n]={faces,ctr,R:Rs,Rf,ymin:mn[1],mn,mx}}
function g3Name(n,k){const nz=GA[n]&&GA[n].nz.find(q=>q.m===k);if(nz)return k+" | "+nz.sv;const b=gBom(n,k);return b?(k==="M"?"":k+" | ")+b.name:k}
function g3Draw(id){const I=G3.inst[id],box=document.getElementById(id);if(!I||!box)return;const o=G3.cfg[id],M=g3Mesh(o.n),svg=box.querySelector("svg");if(!svg)return;
 const W=900,H=500,yaw=I.yaw,pit=I.pit,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pit),sp=Math.sin(pit),D=M.R*3.2,sc=I.zoom*(H*.46)/M.Rf,t=I.t;
 const sel=o.sel?o.sel():null,hl=o.hl||[],heat=o.heat||{},tint=o.tint;
 const rot=(v,at)=>{let x=v[0]-M.ctr[0],y=v[1]-M.ctr[1],z=v[2]-M.ctr[2];const x1=x*cy+z*sy,z1=-x*sy+z*cy,y2=y*cp-z1*sp,z2=y*sp+z1*cp;return[x1,y2,z2]};
 const out=[];const spin=(f,v)=>{const a=f.anim;if(!a||!I.run)return v;const ang=a.rate*t*Math.PI/180,c=Math.cos(ang),s=Math.sin(ang),dx=v[0]-a.at[0],dz=v[2]-a.at[2];return[dx*c+dz*s+a.at[0],v[1],-dx*s+dz*c+a.at[2]]};
 M.faces.forEach(f=>{if(f.in&&!I.xray)return;const anim=f.anim&&I.run;const pts=f.p.map(v=>rot(anim?spin(f,v):v));let nm=f.n;
  if(anim){const a=f.anim.rate*t*Math.PI/180,c=Math.cos(a),s=Math.sin(a);nm=[nm[0]*c+nm[2]*s,nm[1],-nm[0]*s+nm[2]*c]}
  const nx=nm[0]*cy+nm[2]*sy,nz1=-nm[0]*sy+nm[2]*cy,ny=nm[1]*cp-nz1*sp,nzz=nm[1]*sp+nz1*cp;
  const zc=pts.reduce((a,b)=>a+b[2],0)/pts.length;if(!(I.xray&&f.sh)&&(nzz>=0.0))return; /* camera sits at negative z, so visible faces point to -z */
  out.push({f,pts,zc,nx,ny,nz:nzz})});
 out.sort((a,b)=>b.zc-a.zc);
 const L=[-.45,.75,-.5],ll=Math.hypot(...L);const proj=p=>{const k=D/(D+p[2]);return[W/2+p[0]*sc*k+I.px,H/2-p[1]*sc*k+I.py]};
 let s="";
 /* ground grid under the model */
 const gy=M.ymin,gr=M.R*1.15,step=gr/4;let grid="";
 for(let i=-4;i<=4;i++){const a=rot([M.ctr[0]+i*step,gy,M.ctr[2]-gr]),b=rot([M.ctr[0]+i*step,gy,M.ctr[2]+gr]),c=rot([M.ctr[0]-gr,gy,M.ctr[2]+i*step]),d=rot([M.ctr[0]+gr,gy,M.ctr[2]+i*step]);
  const pa=proj(a),pb=proj(b),pc=proj(c),pd=proj(d);grid+=`M${pa[0].toFixed(1)} ${pa[1].toFixed(1)}L${pb[0].toFixed(1)} ${pb[1].toFixed(1)}M${pc[0].toFixed(1)} ${pc[1].toFixed(1)}L${pd[0].toFixed(1)} ${pd[1].toFixed(1)}`}
 s+=`<path d="${grid}" stroke="#c5ced9" stroke-width=".8" fill="none"/>`;
 out.forEach(({f,pts,nx,ny,nz})=>{let c=f.c.slice(0,3);const k=f.k;
  const tc=k&&(tint&&tint(k)||heat[k]);if(tc){const q=typeof tc==="string"?g3Parse(tc):tc,a=q[3]==null?.6:q[3];c=c.map((v,i)=>v*(1-a)+q[i]*a)}
  const lum=.42+.58*Math.max(0,(nx*L[0]+ny*L[1]+nz*L[2])/ll);
  const hlOn=k&&hl.includes(k),selOn=k&&k===sel;if(selOn||hlOn)c=c.map(v=>Math.min(255,v*1.08+22));
  const fill=`rgb(${Math.round(Math.min(255,c[0]*lum))},${Math.round(Math.min(255,c[1]*lum))},${Math.round(Math.min(255,c[2]*lum))})`;
  const al=I.xray&&f.sh?.2:1;
  s+=`<polygon points="${pts.map(p=>proj(p).map(v=>v.toFixed(1)).join(",")).join(" ")}" fill="${fill}" fill-opacity="${al}" stroke="${selOn?"#0b5fd7":hlOn?"#cf222e":"rgba(30,45,70,.35)"}" stroke-width="${selOn||hlOn?1.6:.5}" ${k?`data-k="${k}" style="cursor:pointer"`:""}${hlOn?' class="g3hl"':""}/>`});
 svg.querySelector(".g3s").innerHTML=s;
 const cap=box.querySelector(".g3cap");if(cap&&!I.hover)cap.textContent=sel?g3Name(o.n,sel):"Drag to rotate, scroll to zoom, select a part"}
function g3Init(box){const id=box.id,o=G3.cfg[id];if(!o)return;box.setAttribute("data-ok","1");
 box.innerHTML=`<div class="g3bar"><button class="ghost" data-v="iso">Isometric</button><button class="ghost" data-v="front">Front</button><button class="ghost" data-v="side">Side</button><button class="ghost" data-v="top">Top</button><button class="ghost" data-t="spin">Auto-rotate</button><button class="ghost" data-t="xray">X-ray</button>${(G3M[o.n]||[]).some(p=>p.anim)?'<button class="ghost on" data-t="run">Fan running</button>':""}<button class="ghost" data-v="reset">Reset</button></div>
 <svg viewBox="0 0 900 500" class="g3svg" role="img" aria-label="3D model of ${esc(S(o.n).tag)}"><rect width="900" height="500" fill="#f4f7fb"/><g class="g3s"></g></svg><div class="g3cap muted"></div>`;
 const I=G3.inst[id]={yaw:-.62,pit:.38,zoom:1,px:0,py:0,spin:false,xray:false,run:true,t:0,drag:null,hover:null,dirty:true,last:performance.now()};
 const svg=box.querySelector("svg"),dirty=()=>{I.dirty=true};
 const views={iso:[-.62,.38],front:[0,0],side:[-Math.PI/2,0],top:[0,Math.PI/2-.001]};
 box.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{const v=b.dataset.v;if(v==="reset"){I.yaw=-.62;I.pit=.38;I.zoom=1;I.px=I.py=0}else{I.yaw=views[v][0];I.pit=views[v][1]}dirty()});
 box.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{const k=b.dataset.t;if(k==="spin")I.spin=!I.spin;else if(k==="xray")I.xray=!I.xray;else I.run=!I.run;b.classList.toggle("on",k==="spin"?I.spin:k==="xray"?I.xray:I.run);dirty()});
 svg.addEventListener("pointerdown",e=>{I.drag={x:e.clientX,y:e.clientY,mv:0,pan:e.shiftKey||e.button===2};try{svg.setPointerCapture(e.pointerId)}catch(_){}});
 svg.addEventListener("contextmenu",e=>e.preventDefault());
 svg.addEventListener("pointermove",e=>{const d=I.drag;if(d){const dx=e.clientX-d.x,dy=e.clientY-d.y;d.mv+=Math.abs(dx)+Math.abs(dy);d.x=e.clientX;d.y=e.clientY;
   if(d.pan){const r=svg.getBoundingClientRect(),k=900/r.width;I.px+=dx*k;I.py+=dy*k}else{I.yaw+=dx*.008;I.pit=Math.max(-1.5,Math.min(1.5,I.pit+dy*.006))}dirty()}
  else{const k=e.target.getAttribute&&e.target.getAttribute("data-k"),cap=box.querySelector(".g3cap");if(k!==I.hover){I.hover=k||null;if(cap)cap.textContent=k?g3Name(o.n,k):(o.sel&&o.sel()?g3Name(o.n,o.sel()):"Drag to rotate, scroll to zoom, select a part")}}});
 svg.addEventListener("pointerup",e=>{const d=I.drag;I.drag=null;if(d&&d.mv<5&&!d.pan){const k=e.target.getAttribute&&e.target.getAttribute("data-k");if(k&&o.click){try{(typeof o.click==="function"?o.click:window[o.click])(k)}catch(_){}}dirty()}});
 svg.addEventListener("wheel",e=>{e.preventDefault();I.zoom=Math.max(.5,Math.min(3.5,I.zoom*(e.deltaY<0?1.1:.9)));dirty()},{passive:false});
 svg.addEventListener("dblclick",()=>{I.zoom=1;I.px=I.py=0;dirty()});
 g3Draw(id)}
function g3Scan(){document.querySelectorAll(".g3box:not([data-ok])").forEach(b=>{if(!b.hidden&&!b.closest("[hidden]"))g3Init(b)});
 const keep=new Set([...document.querySelectorAll(".g3box")].map(b=>b.id));Object.keys(G3.inst).forEach(id=>{if(!keep.has(id)){delete G3.inst[id];delete G3.cfg[id]}})}
function g3Loop(now){requestAnimationFrame(g3Loop);Object.keys(G3.inst).forEach(id=>{const I=G3.inst[id],box=document.getElementById(id);if(!box||box.hidden||box.closest("[hidden]"))return;const dt=Math.min(.1,(now-I.last)/1000);I.last=now;
  if(I.spin&&!I.drag){I.yaw+=dt*.5;I.dirty=true}if(I.run&&(G3M[G3.cfg[id].n]||[]).some(p=>p.anim)){I.t+=dt;I.dirty=true}
  if(I.dirty||now-(I.lt||0)>1500){I.dirty=false;I.lt=now;g3Draw(id)}})}
requestAnimationFrame(g3Loop);
{let tm=null;new MutationObserver(()=>{if(!tm)tm=setTimeout(()=>{tm=null;g3Scan()},40)}).observe(document.body,{childList:true,subtree:true})}
function g3Mode(m){G3.mode=m;try{localStorage.setItem("akp_gmode",m)}catch(e){}
 document.querySelectorAll(".gfig").forEach(f=>{const b=f.querySelector(".g3box"),t=f.querySelector(".g2");if(b)b.hidden=m!=="3d";if(t)t.hidden=m==="3d";f.querySelectorAll(".gtog button").forEach(x=>x.classList.toggle("on",x.dataset.m===m))});g3Scan()}
/* one switchable figure: svg2d is the existing drawing, o carries sel(), hl[], heat{}, tint(k) and click(k) for the 3D view */
function gaFig(n,svg2d,o){const id="g3_"+(++G3.seq);G3.cfg[id]=Object.assign({n},o||{});const m=G3.mode;
 return `<div class="gfig"><div class="gtog" role="group" aria-label="Drawing view"><button data-m="2d" class="${m==="2d"?"on":""}" onclick="g3Mode('2d')">2D drawing</button><button data-m="3d" class="${m==="3d"?"on":""}" onclick="g3Mode('3d')">3D model</button></div><div class="g2" ${m==="3d"?"hidden":""}>${svg2d}</div><div class="g3box" id="${id}" ${m==="3d"?"":"hidden"}></div></div>`}
