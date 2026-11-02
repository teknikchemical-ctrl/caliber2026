/* =====================================================================================================
   3D SITE VIEW FOR THE HAZARD SIMULATOR
   The plot plan in true scale: units, pipe rack, control room, roads, muster points and fire protection, drawn with the same
   depth-buffered renderer as the equipment models. The gas cloud is a volume: nested shells for 25, 50 and 100 per cent of the lower
   flammable limit grow and drift with the wind, with soft puffs inside. Flames, heat zones and blast waves are drawn in the same space,
   so a cloud passes behind a tank and in front of a building the way it would on site.
   ===================================================================================================== */
regMod("hse3d","1.0",["g3r","hse"],"3D site view");
const H3={built:false,cam:{yaw:.0,pit:.66,dist:175,tx:180,ty:2,tz:178},to:null,sel:0,drag:null};
/*@@CASE:h3@@*/
function hse3Build(){if(H3.built)return;const faces=[];let pi=0,cur="";
 const add=(prims,tf,rn)=>{prims.forEach(p=>{g3Parts(p).forEach(f=>{g3Orient(p,f);faces.push({p:f.p.map(tf),n:rn?rn(f.n):f.n,mid:tf(f.mid),c:f.c,m:f.m,sm:f.sm,k:cur,pi,light:f.light,sc:f.sc})});pi++})};
 const id=v=>v,B=(x,y,z,w,h,d,c,o)=>g3B("",x,y,z,w,h,d,c,o),C=(ax,x,y,z,l,r,c,o)=>g3C("",ax,x,y,z,l,r,c,o);
 /* ground, boundary kerb, road, pipe rack */
 add([B(180,-.2,180,330,.4,330,"#d9e0ea")],id);
 add([B(180,.25,102,160,.5,.5,"amber"),B(180,.25,246,160,.5,.5,"amber"),B(100,.25,174,.5,.5,144,"amber"),B(260,.25,174,.5,.5,144,"amber")],id);
 add([B(180,.05,238,160,.1,8,"dark",{r:.1}),...Array.from({length:16},(_,i)=>B(104+i*10,.11,238,4,.02,.3,"white"))],id);
 const rack=[];for(let e=100;e<=260;e+=10){[164.6,171.4].forEach(n=>rack.push(C("y",e,3,n,6,.16,"dark")));rack.push(B(e,4.3,168,.3,.25,7.2,"dark",{r:.03}),B(e,6,168,.3,.25,7.2,"dark",{r:.03}))}
 rack.push(B(180,4.3,164.6,160,.2,.2,"steel"),B(180,4.3,171.4,160,.2,.2,"steel"),B(180,6,164.6,160,.2,.2,"steel"),B(180,6,171.4,160,.2,.2,"steel"),B(180,6.15,168,160,.06,5.6,"gray"));
 [[4.7,166,"#4f86c9"],[4.7,168,"#6fb883"],[4.7,170,"#cc5f58"],[6.5,167,"#cfa84e"],[6.5,169,"#7fbbe6"]].forEach(([y,n,c])=>rack.push(C("x",180,y,n,160,.32,c,{seg:12,m:.4})));
 add(rack,id);
 /* control room, hydrants, muster points */
 add([B(103,2.1,186,8,4.2,14,"white",{r:.3,m:.1}),B(103,4.35,186,8.4,.3,14.4,"steel"),...[-4,-1.3,1.4,4].map(z=>B(107.05,2.4,186+z,.08,1.1,2,"blue"))],id);
 [120,150,180,210,240].forEach(e=>add([C("y",e,.5,236,1,.22,"red",{seg:10}),C("x",e,.8,236,.5,.1,"red",{seg:8})],id));
 Object.values(MUS).forEach(([e,n])=>add([C("y",e,.12,n,.25,3.2,"green",{seg:28}),C("y",e,3.2,n,6.4,.08,"gray",{seg:8}),B(e+.9,5.6,n,1.8,1.1,.05,"green")],id));
 /* units at their footprint, on a deck where the drawing gives an elevation */
 K.sets.forEach(s=>{const n=s.n,Mx=g3Mesh(n,.5),[E,N]=POS[n],[fw,fl]=ppFP(n),dx=Mx.mx[0]-Mx.mn[0],dz=Mx.mx[2]-Mx.mn[2],rot90=(fw<fl)!==(dx<dz),sc=Math.max(.5,Math.min(Math.sqrt(fw*fl/(dx*dz))*.95,Math.min(fw/(rot90?dz:dx),fl/(rot90?dx:dz))*1.3)),el=H3_EL[n]||0,cx=(Mx.mn[0]+Mx.mx[0])/2,cz=(Mx.mn[2]+Mx.mx[2])/2,cs=rot90?0:1,sn=rot90?1:0;
  const tf=v=>{const x=v[0]-cx,z=v[2]-cz;return[E+sc*(cs*x+sn*z),el+sc*(v[1]-Mx.ymin)+.05,N+sc*(-sn*x+cs*z)]},rn=m=>[cs*m[0]+sn*m[2],m[1],-sn*m[0]+cs*m[2]];
  cur="U"+n;const prims=[];Mx.faces.forEach(f=>{if(f.in)return;faces.push({p:f.p.map(tf),n:rn(f.n),mid:tf(f.mid),c:f.c,m:f.m,sm:f.sm,k:cur,pi:pi+(f.pi||0)%4096,light:f.light,sc:f.sc})});pi+=4100;
  H3.units=H3.units||{};H3.units[n]={x:E,z:N,top:el+sc*(Mx.mx[1]-Mx.ymin)+.5,r:Math.max(fw,fl)/2+2};
  cur="";if(el>0){const w=fw+1.2,l=fl+1.2;add([B(E,el-.15,N,w,.3,l,"steel",{r:.05}),...[[-1,-1],[1,-1],[-1,1],[1,1]].map(([a,b])=>C("y",E+a*w/2*.9,el/2,N+b*l/2*.9,el,.14,"dark",{seg:10})),B(E,el/2,N+l/2*.9,w*.9,.1,.1,"dark"),B(E,el/2,N-l/2*.9,w*.9,.1,.1,"dark")],id)}
  /* pipe from the unit to the rack */
  const up=N<168,rn_=up?164.6:171.4;add([C("z",E,el+.6,(N+rn_)/2,Math.abs(rn_-N),.13,"#8d6bd1",{seg:8}),C("y",E,(el+.6+4.7)/2,rn_,Math.abs(4.7-el-.6),.13,"#8d6bd1",{seg:8})],id)});
 /* pack into typed arrays with smooth normals */
 const M3={faces};faces.forEach(f=>{f.zb=0});H3.faces=faces;const pk=H3.pk=g3Pack(M3);
 const nF=faces.length,fr=new Float32Array(nF),fg=new Float32Array(nF),fb=new Float32Array(nF),fm=new Float32Array(nF),fao=new Float32Array(nF),frim=new Float32Array(nF);
 faces.forEach((f,i)=>{fr[i]=f.c[0];fg[i]=f.c[1];fb[i]=f.c[2];fm[i]=f.m||.18;fao[i]=1;frim[i]=f.sm?.12:.04});
 H3.fr=fr;H3.fg=fg;H3.fb=fb;H3.fm=fm;H3.fao=fao;H3.frim=frim;H3.base=faces.map(f=>f.c.slice(0,3));H3.built=true}
/* ---------- camera and projection ---------- */
function hse3Cam(PW,PH){const c=H3.cam,cy=Math.cos(c.yaw),sy=Math.sin(c.yaw),cp=Math.cos(c.pit),sp=Math.sin(c.pit),F=PH*.95;
 return{c,cy,sy,cp,sp,F,PW,PH,v:p=>{const x=p[0]-c.tx,y=p[1]-c.ty,z=p[2]-c.tz,x1=x*cy+z*sy,z1=-x*sy+z*cy,y2=y*cp+z1*sp,z2=-y*sp+z1*cp,d=c.dist+z2;return d<1?null:[PW/2+x1*F/d,PH/2-y2*F/d,d]}}}
/* static scene: depth buffer, colours, outlines, distance haze. Redone only when the camera moves or a unit is selected. */
function hse3Static(K3,B){const pk=H3.pk,nF=pk.nF,V=pk.V,{c,cy,sy,cp,sp,F,PW,PH}=K3,off=pk.off,F_=H3.faces;
 let SX=H3.SX,SY=H3.SY,SW=H3.SW,NX=H3.NX,NY=H3.NY,NZ=H3.NZ;if(!SX||SX.length!==V){SX=H3.SX=new Float32Array(V);SY=H3.SY=new Float32Array(V);SW=H3.SW=new Float32Array(V);NX=H3.NX=new Float32Array(V);NY=H3.NY=new Float32Array(V);NZ=H3.NZ=new Float32Array(V)}
 B.W.fill(0);B.F.fill(0);B.img32=B.img32||new Uint32Array(B.img.data.buffer);B.img32.fill(0);
 for(let j=0;j<V;j++){const x=pk.vx[j]-c.tx,y=pk.vy[j]-c.ty,z=pk.vz[j]-c.tz,x1=x*cy+z*sy,z1=-x*sy+z*cy,y2=y*cp+z1*sp,z2=-y*sp+z1*cp,d=c.dist+z2;SW[j]=d<1?0:1/d;SX[j]=PW/2+x1*F/Math.max(d,1);SY[j]=PH/2-y2*F/Math.max(d,1);
  const nz1=-pk.nx[j]*sy+pk.nz[j]*cy;NX[j]=pk.nx[j]*cy+pk.nz[j]*sy;NY[j]=pk.ny[j]*cp+nz1*sp;NZ[j]=-pk.ny[j]*sp+nz1*cp}
 const S=g3Shader(H3.fr,H3.fg,H3.fb,H3.fm,H3.fao,H3.frim);let drawn=0;
 for(let i=0;i<nF;i++){const f=F_[i],a0=off[i],a1=off[i+1];let ok=true;for(let j=a0;j<a1;j++)if(SW[j]===0){ok=false;break}if(!ok)continue;
  const n=f.n,nz1=-n[0]*sy+n[2]*cy,nx=n[0]*cy+n[2]*sy,ny=n[1]*cp+nz1*sp,nzz=-n[1]*sp+nz1*cp,m=f.mid,x=m[0]-c.tx,y=m[1]-c.ty,z=m[2]-c.tz,x1=x*cy+z*sy,z1=-x*sy+z*cy,y2=y*cp+z1*sp,z2=-y*sp+z1*cp,d=c.dist+z2;
  if(nx*x1+ny*y2+nzz*d>=0)continue;
  let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;for(let j=a0;j<a1;j++){const X=SX[j],Y=SY[j];if(X<mnx)mnx=X;if(X>mxx)mxx=X;if(Y<mny)mny=Y;if(Y>mxy)mxy=Y}if(mxx<0||mnx>PW||mxy<0||mny>PH)continue;if(mxx-mnx<.6&&mxy-mny<.6)continue;
  drawn++;for(let j=1;j<a1-a0-1;j++){const u=a0,v=a0+j,w=a0+j+1;g3Tri(B,S,SX[u],SY[u],SW[u],SX[v],SY[v],SW[v],SX[w],SY[w],SW[w],[NX[u],NY[u],NZ[u]],[NX[v],NY[v],NZ[v]],[NX[w],NY[w],NZ[w]],i,0)}}
 const img32=B.img32,Wb=B.W,Fb=B.F,Nb=B.N,n=PW*PH,fog0=c.dist*.8,fog1=c.dist*3.2,sky=[226,234,244];
 for(let p=0;p<n;p++){const fi=Fb[p]-1;if(fi<0)continue;const o3=p*3;S.shade(fi,Nb[o3],Nb[o3+1],Nb[o3+2]);let r=S.sr,g=S.sg,b=S.sb;const d=1/Wb[p];if(d>fog0){const f=Math.min(.55,(d-fog0)/(fog1-fog0));r+=(sky[0]-r)*f;g+=(sky[1]-g)*f;b+=(sky[2]-b)*f}img32[p]=0xff000000|((b|0)<<16)|((g|0)<<8)|(r|0)}
 g3Outline(B,pk.fpi,PW,PH,PW/900);B.base=B.base&&B.base.length===n?B.base:new Uint32Array(n);B.base.set(img32);H3.drawn=drawn}
/* ---------- hazard geometry, drawn each frame ---------- */
const H3_RAD=(a,b,c)=>[a,b,c];
function hse3Hazard(R,t,K3,B,out){const M=R.M,v=K3.v,tris=[],tri=(a,b,c,col,al)=>{const A=v(a),Bq=v(b),C=v(c);if(!A||!Bq||!C)return;tris.push([A,Bq,C,col,al,A[2]+Bq[2]+C[2]])};
 const W=(x,y,z)=>{const p=hseToPlan(M,x,y);return[p[0],z,p[1]]};
 const ring=(pts,col,al)=>{for(let i=1;i<pts.length-1;i++)tri(pts[0],pts[i],pts[i+1],col,al)};
 const disc=(cx,cz,r,y,col,al,n)=>{n=n||40;const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;p.push([cx+Math.cos(a)*r,y,cz+Math.sin(a)*r])}ring(p,col,al)};
 const annulus=(cx,cz,r0,r1,y,col,al)=>{const n=48;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,p0=[cx+Math.cos(a)*r0,y,cz+Math.sin(a)*r0],p1=[cx+Math.cos(a)*r1,y,cz+Math.sin(a)*r1],q0=[cx+Math.cos(b)*r0,y,cz+Math.sin(b)*r0],q1=[cx+Math.cos(b)*r1,y,cz+Math.sin(b)*r1];tri(p0,p1,q1,col,al);tri(p0,q1,q0,col,al)}};
 const src=POS[M.cfg.n],burnt=HSE.ign>=0&&t>=HSE.ign+7&&HSE.sc==="cloud";
 /* gas cloud: nested shells */
 if(HSE.sc==="cloud"&&!burnt){const flash=HSE.ign>=0&&t>=HSE.ign&&t<HSE.ign+7,fl=flash?.5+.5*Math.sin(t*40):0;
  [[25,[246,205,50],.17],[50,[244,145,40],.24],[100,flash?[255,230,110]:[214,48,39],.34]].forEach(([lvl,col,al])=>{
   const rows=[];for(let x=3;x<=M.xmax;x+=Math.max(3,Math.round(hseReach(M,t,lvl,1.5)/22)||3)){const k=M.k(x,t);if(!k)continue;let zt=0;for(let z=0;z<=60;z+=.25){const g=Math.exp(-Math.pow(z-k.H,2)/(2*k.sz*k.sz))+Math.exp(-Math.pow(z+k.H,2)/(2*k.sz*k.sz));if(k.K*g/M.f.lfl*100>=lvl)zt=z}
    if(zt<=0&&k.K*2/M.f.lfl*100<lvl)continue;const NZ=7,ringp=[];const ys=zz=>{const g=Math.exp(-Math.pow(zz-k.H,2)/(2*k.sz*k.sz))+Math.exp(-Math.pow(zz+k.H,2)/(2*k.sz*k.sz)),vv=k.K*g/M.f.lfl*100;return vv>lvl?k.sy*Math.sqrt(2*Math.log(vv/lvl)):0};
    const zs=[];for(let j=0;j<NZ;j++){const zz=Math.max(.05,zt*Math.pow(j/(NZ-1),1.4));zs.push(zz)}
    const L=[],Rr=[];zs.forEach(zz=>{const y=ys(zz);L.push(W(x,-y,zz));Rr.push(W(x,y,zz))});rows.push(L.concat(Rr.reverse()))}
   for(let i=0;i+1<rows.length;i++){const a=rows[i],b=rows[i+1];for(let j=0;j<a.length;j++){const j2=(j+1)%a.length;tri(a[j],b[j],b[j2],col,al+fl*.15);tri(a[j],b[j2],a[j2],col,al+fl*.15)}}
   if(rows.length){const a=rows[0];ring(a,col,al*.8);const z=rows[rows.length-1];ring(z,col,al*.8)}
   const gr=hseSlices(M,t,lvl,1.5);if(gr.length>1)ring([...gr.map(r=>W(r[0],r[1],.1)),...gr.slice().reverse().map(r=>W(r[0],-r[1],.1))],col,al*.9)})}
 /* jet flame */
 const flame=(len,wid,al)=>{const n=12,st=8,fl=1+.06*Math.sin(t*26)+.04*Math.sin(t*41);const rows=[];for(let s=0;s<=st;s++){const q=s/st,x=len*fl*q,r=wid*Math.sin(Math.PI*Math.pow(q,.7))*(.9+.1*Math.sin(t*30+s)),row=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;row.push(W(x,Math.cos(a)*r,1.4+Math.sin(a)*r))}rows.push(row)}
  for(let s=0;s<st;s++)for(let i=0;i<n;i++){const j=(i+1)%n;tri(rows[s][i],rows[s+1][i],rows[s+1][j],[255,150,30],al);tri(rows[s][i],rows[s+1][j],rows[s][j],[255,150,30],al)}
  const core=[];for(let s=0;s<=st;s++){const q=s/st,x=len*fl*.62*q,r=wid*.5*Math.sin(Math.PI*Math.pow(q,.8)),row=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;row.push(W(x,Math.cos(a)*r,1.4+Math.sin(a)*r))}core.push(row)}
  for(let s=0;s<st;s++)for(let i=0;i<n;i++){const j=(i+1)%n;tri(core[s][i],core[s+1][i],core[s+1][j],[255,235,120],al*1.1);tri(core[s][i],core[s+1][j],core[s][j],[255,235,120],al*1.1)}};
 const sp=W(0,0,0);
 if(HSE.sc==="jet"){const J=R.jet,c=hseToPlan(M,J.mid,0);flame(J.L,J.L*.13,.5);J.r.forEach((r,i)=>{annulus(c[0],c[1],i===0?0:J.r[i-1],r,.12,i===0?[122,15,27]:i===1?[207,34,46]:[240,138,36],.14+.04*(2-i))})}
 if(HSE.sc==="pool"&&R.pool){const P=R.pool;[[1,[255,140,30],.45],[.62,[255,215,90],.55]].forEach(([k,col,al])=>{const n=28,hh=P.H*(.9+.1*Math.sin(t*14))*k,rows=[];for(let s=0;s<=6;s++){const q=s/6,r=P.D/2*k*(1-.55*q)*(1+.05*Math.sin(t*20+s*2)),row=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;row.push([src[0]+Math.cos(a)*r,q*hh+.1,src[1]+Math.sin(a)*r])}rows.push(row)}
   for(let s=0;s<6;s++)for(let i=0;i<n;i++){const j=(i+1)%n;tri(rows[s][i],rows[s+1][i],rows[s+1][j],col,al);tri(rows[s][i],rows[s+1][j],rows[s][j],col,al)}});
   P.r.forEach((r,i)=>annulus(src[0],src[1],i===0?P.D/2:P.r[i-1],r,.12,i===0?[122,15,27]:i===1?[207,34,46]:[240,138,36],.14+.04*(2-i)))}
 /* the fire that follows ignition while the leak is still running */
 if(HSE.sc==="cloud"&&HSE.ign>=0&&t>=HSE.ign&&M.qt(t)>0){const q=M.qt(t),L=Math.min(80,6.5*Math.sqrt(q));flame(L,L*.12,.5)}
 /* blast wave */
 if(R.blast&&t>=HSE.ign){const k=Math.min(1,(t-HSE.ign)/6),bc=hseToPlan(M,R.blast.x0,0);R.blast.r.forEach((r,i)=>{annulus(bc[0],bc[1],Math.max(0,r*k-1.2),r*k,.2,i===0?[122,15,27]:i===1?[207,34,46]:[240,138,36],.55)});
  const dome=R.blast.r[2]*k;if(k<1){const n=24,m=8;for(let a=0;a<m;a++)for(let i=0;i<n;i++){const p=a/m*Math.PI/2,p2=(a+1)/m*Math.PI/2,t0=i/n*Math.PI*2,t1=(i+1)/n*Math.PI*2,f=(pp,tt)=>[bc[0]+Math.cos(tt)*Math.cos(pp)*dome,Math.sin(pp)*dome*.6,bc[1]+Math.sin(tt)*Math.cos(pp)*dome];tri(f(p,t0),f(p2,t0),f(p2,t1),[255,200,120],.07);tri(f(p,t0),f(p2,t1),f(p,t1),[255,200,120],.07)}}
  if(t-HSE.ign<2.5)disc(bc[0],bc[1],Math.max(4,R.flash*.4)*(1+(t-HSE.ign)),.5,[255,220,100],.5,24)}
 /* sort the see-through faces back to front and draw them in front of what the scene already holds */
 tris.sort((a,b)=>b[5]-a[5]);const S2={fa:null,sr:0,sg:0,sb:0,shade(fi){const q=tris[fi];this.sr=q[3][0];this.sg=q[3][1];this.sb=q[3][2]}};S2.fa=new Float32Array(tris.length);tris.forEach((q,i)=>S2.fa[i]=Math.min(.9,q[4]));
 const nrm=[0,0,-1];B.PW=B.PW&&B.PW.length===B.W.length?B.PW:new Float32Array(B.W.length);
 tris.forEach((q,i)=>{const A=q[0],Bq=q[1],C=q[2];g3Tri(B,S2,A[0],A[1],1/A[2],Bq[0],Bq[1],1/Bq[2],C[0],C[1],1/C[2],nrm,nrm,nrm,i,1)});
 out.tris=tris.length}
/* ---------- soft puffs, markers and labels on top of the shells ---------- */
function hse3Overlay(R,t,K3,B,ctx){const M=R.M,v=K3.v,PW=K3.PW,hidden=(p)=>{const x=p[0]|0,y=p[1]|0;if(x<0||y<0||x>=PW||y>=K3.PH)return true;const w=B.W[y*PW+x];return w>0&&1/w<p[2]-2};
 const burnt=HSE.ign>=0&&t>=HSE.ign+7&&HSE.sc==="cloud";
 /* puffs inside the cloud */
 if(HSE.sc==="cloud"&&!burnt){const reach=hseReach(M,t,25,1.5)||0;if(reach>0){let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
   for(let i=0;i<260;i++){const u1=rnd(),u2=rnd(),u3=rnd(),u4=rnd(),x=reach*Math.pow(u1,.75)+2*Math.sin(t*.9+i),k=M.k(x,t);if(!k)continue;const gy=Math.sqrt(-2*Math.log(u2+1e-6))*Math.cos(6.283*u3)*k.sy*.8,gz=Math.abs(k.H+Math.sqrt(-2*Math.log(u4+1e-6))*Math.cos(6.283*u2)*k.sz*.8);
    const cc=M.c(x,gy,gz,t);if(cc<12)continue;const pl=hseToPlan(M,x+Math.sin(t*.6+i*1.7)*1.5,gy+Math.cos(t*.5+i)*1.2),p=v([pl[0],gz,pl[1]]);if(!p||hidden(p))continue;
    const r=(2.6+k.sz*.35)*K3.F/p[2],col=cc>=100?"214,48,39":cc>=50?"244,145,40":"246,205,50",g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],r);g.addColorStop(0,"rgba("+col+","+Math.min(.16,.05+cc/900)+")");g.addColorStop(1,"rgba("+col+",0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1],r,0,7);ctx.fill()}}}
 /* smoke from fires */
 const smoke=(base,n,up,spread,dark)=>{let seed=3;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647},dir=hseDir();for(let i=0;i<n;i++){const age=((t*.35+i/n)%1),h=up*age+2,drift=age*age*18*HSE.u,j=(rnd()-.5)*spread*age,pl=[base[0]+dir[0]*drift+dir[1]*j,base[1]+dir[1]*drift-dir[0]*j],p=v([pl[0],h,pl[1]]);if(!p||hidden(p))continue;const r=(2+age*7)*K3.F/p[2],g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],r);g.addColorStop(0,"rgba("+dark+","+(.22*(1-age))+")");g.addColorStop(1,"rgba("+dark+",0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1],r,0,7);ctx.fill()}};
 if(HSE.sc==="pool"&&R.pool)smoke(POS[M.cfg.n],40,R.pool.H*2.2,8,"60,60,66");
 if(HSE.sc==="jet")smoke(hseToPlan(M,R.jet.L*.6,0),26,R.jet.L*.9,5,"70,70,76");
 /* gas detectors */
 for(let i=0;i<8;i++){const a=i*Math.PI/4,pl=[POS[M.cfg.n][0]+Math.cos(a)*12,POS[M.cfg.n][1]+Math.sin(a)*12],p=v([pl[0],2.2,pl[1]]);if(!p||hidden(p))continue;const s=Math.max(3,.7*K3.F/p[2]);ctx.fillStyle="#2e6bd6";ctx.strokeStyle="#fff";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(p[0],p[1]-s);ctx.lineTo(p[0]+s,p[1]);ctx.lineTo(p[0],p[1]+s);ctx.lineTo(p[0]-s,p[1]);ctx.closePath();ctx.fill();ctx.stroke()}
 /* leak point */
 {const p=v([POS[M.cfg.n][0],1.4,POS[M.cfg.n][1]]);if(p){const r=(5+2*Math.sin(t*6))*K3.F/p[2]*.2;ctx.fillStyle="rgba(209,36,47,.3)";ctx.beginPath();ctx.arc(p[0],p[1],r*1.8,0,7);ctx.fill();ctx.fillStyle="#d1242f";ctx.beginPath();ctx.arc(p[0],p[1],Math.max(3,r*.7),0,7);ctx.fill()}}
 /* walker */
 if(R.walk&&t>=HSE.resp){const w=R.walk.best,r=ppRoute(ppAcc(M.cfg.n),MUS[w.k]),L=plen(r),s=Math.min(L,(t-HSE.resp)*2.2);let acc=0,pos=r[r.length-1];for(let i=1;i<r.length;i++){const d=eu(r[i],r[i-1]);if(acc+d>=s){const f=d?(s-acc)/d:0;pos=[r[i-1][0]+(r[i][0]-r[i-1][0])*f,r[i-1][1]+(r[i][1]-r[i-1][1])*f];break}acc+=d}
  ctx.strokeStyle="rgba(26,127,55,.9)";ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();let st=false;r.forEach(q=>{const p=v([q[0],.3,q[1]]);if(!p)return;st?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);st=true});ctx.stroke();ctx.setLineDash([]);
  const p=v([pos[0],1.2,pos[1]]);if(p){ctx.fillStyle="#1a7f37";ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p[0],p[1],Math.max(4,1.2*K3.F/p[2]),0,7);ctx.fill();ctx.stroke()}}
 /* wind arrow on the ground upwind of the source */
 {const d=hseDir(),s=POS[M.cfg.n],a=[s[0]-d[0]*30,0.4,s[1]-d[1]*30],b=[s[0]-d[0]*14,0.4,s[1]-d[1]*14],pa=v(a),pb=v(b);if(pa&&pb){ctx.strokeStyle="#2f81f7";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(pa[0],pa[1]);ctx.lineTo(pb[0],pb[1]);ctx.stroke();const ang=Math.atan2(pb[1]-pa[1],pb[0]-pa[0]);ctx.fillStyle="#2f81f7";ctx.beginPath();ctx.moveTo(pb[0]+Math.cos(ang)*10,pb[1]+Math.sin(ang)*10);ctx.lineTo(pb[0]+Math.cos(ang+2.5)*9,pb[1]+Math.sin(ang+2.5)*9);ctx.lineTo(pb[0]+Math.cos(ang-2.5)*9,pb[1]+Math.sin(ang-2.5)*9);ctx.fill();ctx.font="600 12px system-ui,sans-serif";ctx.textAlign="center";ctx.fillStyle="#1d4f9c";ctx.fillText(HSE.u+" m/s",pa[0],pa[1]-8)}}
 /* unit labels */
 ctx.font="600 12px system-ui,sans-serif";ctx.textAlign="center";
 K.sets.forEach(s=>{const u=H3.units[s.n],p=v([u.x,u.top+2.5,u.z]);if(!p)return;const src=s.n===M.cfg.n,on=H3.sel===s.n,txt=s.tag,w=ctx.measureText(txt).width+14;ctx.fillStyle=src?"#d1242f":on?"#155ea3":"rgba(255,255,255,.94)";ctx.strokeStyle=src?"#d1242f":"#25324a";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect?ctx.roundRect(p[0]-w/2,p[1]-10,w,19,9):ctx.rect(p[0]-w/2,p[1]-10,w,19);ctx.fill();ctx.stroke();ctx.fillStyle=src||on?"#fff":"#1d2b3d";ctx.fillText(txt,p[0],p[1]+4)});
 const cr=v([103,6,186]);if(cr){ctx.fillStyle="rgba(255,255,255,.94)";ctx.strokeStyle="#25324a";const w=ctx.measureText("Control room").width+14;ctx.beginPath();ctx.roundRect?ctx.roundRect(cr[0]-w/2,cr[1]-10,w,19,9):ctx.rect(cr[0]-w/2,cr[1]-10,w,19);ctx.fill();ctx.stroke();ctx.fillStyle="#1d2b3d";ctx.fillText("Control room",cr[0],cr[1]+4)}
 Object.entries(MUS).forEach(([k,pp])=>{const p=v([pp[0],8,pp[1]]);if(!p)return;ctx.fillStyle="#1a7f37";const w=ctx.measureText("Muster "+k).width+14;ctx.beginPath();ctx.roundRect?ctx.roundRect(p[0]-w/2,p[1]-10,w,19,9):ctx.rect(p[0]-w/2,p[1]-10,w,19);ctx.fill();ctx.fillStyle="#fff";ctx.fillText("Muster "+k,p[0],p[1]+4)})}
/* ---------- frame ---------- */
function hse3Draw(){const root=document.getElementById("hse3");if(!root||!HSE.R||!root.dataset.ok)return;hse3Build();const cv=root.querySelector("canvas"),cw=root.clientWidth||900,ch=root.clientHeight||560,dpr=Math.min(2,window.devicePixelRatio||1),now=performance.now();
 if(H3.busy)return;H3.busy=true;try{const moving=H3.drag||now-(H3.lastMove||0)<260,PW0=Math.round(Math.min(1500,cw*dpr*(moving?.8:1.1))),PH0=Math.round(PW0*ch/cw);const PW=PW0,PH=PH0;if(cv.width!==PW||cv.height!==PH){cv.width=PW;cv.height=PH;H3.key=null}
  const B=g3Buf("hse3",PW,PH),K3=hse3Cam(PW,PH),c=H3.cam,key=[PW,PH,c.yaw.toFixed(4),c.pit.toFixed(4),c.dist.toFixed(2),c.tx.toFixed(2),c.ty,c.tz.toFixed(2),H3.sel].join("|");
  if(H3.key!==key){const t0=performance.now();H3.sel!==H3.selDone&&hse3Tint();hse3Static(K3,B);H3.key=key;H3.selDone=H3.sel;H3.statMs=performance.now()-t0}
  B.img32.set(B.base);const out={};const tt=HSE.t,clock=now/1000;const R=HSE.R;
  const save=HSE.t;HSE.t=tt;hse3Hazard(R,tt+clock*0,K3,B,out);
  const ctx=cv.getContext("2d");const g=ctx.createLinearGradient(0,0,0,PH);g.addColorStop(0,"#bcd0e8");g.addColorStop(.5,"#e2eaf4");g.addColorStop(1,"#eef2f7");ctx.fillStyle=g;ctx.fillRect(0,0,PW,PH);
  let oc=B.oc;if(!oc||oc.width!==PW||oc.height!==PH){oc=B.oc=document.createElement("canvas");oc.width=PW;oc.height=PH}oc.getContext("2d").putImageData(B.img,0,0);ctx.drawImage(oc,0,0);
  hse3Overlay(R,tt,K3,B,ctx);H3.ms=performance.now()-now;H3.tris=out.tris;
  const k=root.querySelector(".hse3k");if(k){const h=hse3Key();if(k.dataset.h!==h){k.dataset.h=h;k.innerHTML=h}}
 }finally{H3.busy=false}}
function hse3Tint(){const faces=H3.faces;faces.forEach((f,i)=>{const sel=f.k==="U"+H3.sel,src=f.k==="U"+HSE.n,b=H3.base[i],a=sel?.28:src?.18:0,tc=sel?[40,120,220]:[220,60,50];H3.fr[i]=b[0]*(1-a)+(a?tc[0]*a:0);H3.fg[i]=b[1]*(1-a)+(a?tc[1]*a:0);H3.fb[i]=b[2]*(1-a)+(a?tc[2]*a:0)})}
function hse3Key(){const R=HSE.R;let h=`<b>${S(HSE.n).tag}</b> leaking<br>`;if(HSE.sc==="cloud")h+=`<i style="background:rgba(246,205,50,.7)"></i>25% LFL<br><i style="background:rgba(244,145,40,.8)"></i>50% LFL<br><i style="background:rgba(214,48,39,.85)"></i>100% LFL (burns or explodes)`;else h+=`<i style="background:rgba(240,138,36,.8)"></i>4.7 kW/m²<br><i style="background:rgba(207,34,46,.8)"></i>12.5 kW/m²<br><i style="background:rgba(122,15,27,.9)"></i>37.5 kW/m²`;if(R&&R.blast)h+=`<br><i style="background:rgba(207,34,46,.9)"></i>Blast 7, 21, 35 kPa`;return h+`<br><i style="background:#2e6bd6"></i>Gas detector<br><i style="background:#1a7f37"></i>Walk to muster`}
/* ---------- controls ---------- */
function hse3Go(v){const c=H3.cam,s=POS[HSE.n],T=v==="site"?{yaw:0,pit:.66,dist:175,tx:180,ty:2,tz:178}:v==="source"?{yaw:-.55,pit:.5,dist:80,tx:s[0]+14,ty:3,tz:s[1]+14}:v==="top"?{yaw:0,pit:1.5,dist:250,tx:180,ty:0,tz:176}:{yaw:.9,pit:.35,dist:70,tx:s[0],ty:6,tz:s[1]};H3.to=T;H3.lastMove=performance.now();H3.anim=H3.anim||requestAnimationFrame(hse3Tween)}
function hse3Tween(){H3.anim=0;if(!H3.to)return;const c=H3.cam,T=H3.to,k=.16;let dy=T.yaw-c.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));c.yaw+=dy*k;["pit","dist","tx","ty","tz"].forEach(a=>c[a]+=(T[a]-c[a])*k);H3.lastMove=performance.now();hse3Draw();if(Math.abs(dy)>.004||["pit","dist","tx","tz"].some(a=>Math.abs(T[a]-c[a])>(a==="pit"?.004:.2)))H3.anim=requestAnimationFrame(hse3Tween);else H3.to=null}
function hse3Init(){const root=document.getElementById("hse3");if(!root||root.dataset.ok)return;root.dataset.ok="1";hse3Build();const cv=root.querySelector("canvas");
 const bar=document.createElement("div");bar.className="hse3bar";bar.innerHTML=`<button onclick="hse3Go('site')">Whole site</button><button onclick="hse3Go('source')">Leak</button><button onclick="hse3Go('top')">From above</button><button onclick="hse3Go('side')">Side</button>`;root.appendChild(bar);
 try{if(window.IntersectionObserver){const io=new IntersectionObserver(es=>es.forEach(e=>{H3.vis=e.isIntersecting}));io.observe(root)}}catch(e){}
 let down=null;const ptr=new Map();
 cv.addEventListener("pointerdown",e=>{down={x:e.clientX,y:e.clientY,mv:0,pan:e.shiftKey||e.button===2};H3.drag=true;H3.to=null;try{cv.setPointerCapture(e.pointerId)}catch(_){}});
 cv.addEventListener("contextmenu",e=>e.preventDefault());
 cv.addEventListener("pointermove",e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;down.mv+=Math.abs(dx)+Math.abs(dy);down.x=e.clientX;down.y=e.clientY;const c=H3.cam,r=cv.getBoundingClientRect();
  if(down.pan){const k=c.dist/(r.height*.95);c.tx-=(dx*Math.cos(c.yaw)+dy*Math.sin(c.yaw)*1.3)*k;c.tz-=(dx*Math.sin(c.yaw)-dy*Math.cos(c.yaw)*1.3)*k}else{c.yaw+=dx*.006;c.pit=Math.max(.08,Math.min(1.5,c.pit+dy*.005))}H3.lastMove=performance.now();hse3Draw()});
 cv.addEventListener("pointerup",e=>{const d=down;down=null;H3.drag=false;if(d&&d.mv<6&&!d.pan){const r=cv.getBoundingClientRect(),B=g3Buf("hse3",cv.width,cv.height),x=Math.round((e.clientX-r.left)/r.width*cv.width),y=Math.round((e.clientY-r.top)/r.height*cv.height),f=B.F[y*cv.width+x]-1;
   if(f>=0){const k=H3.pk.fk[f],name=k>=0?H3.pk.keys[k]:"";if(/^U\d$/.test(name)){const n=+name.slice(1);H3.sel=n;if(hseKey(n)&&n!==HSE.n)hseSet("n",n);else{hsePanelRefresh()}}else H3.sel=0}else H3.sel=0;H3.lastMove=0;hse3Draw()}else{H3.lastMove=performance.now();setTimeout(hse3Draw,300)}});
 cv.addEventListener("wheel",e=>{e.preventDefault();H3.to=null;H3.cam.dist=Math.max(14,Math.min(420,H3.cam.dist*(e.deltaY<0?.9:1.1)));H3.lastMove=performance.now();hse3Draw();clearTimeout(H3.wt);H3.wt=setTimeout(hse3Draw,320)},{passive:false});
 cv.addEventListener("dblclick",()=>hse3Go("site"));
 clearInterval(H3.timer);H3.timer=setInterval(()=>{const r=document.getElementById("hse3");if(!r){clearInterval(H3.timer);return}if(document.hidden||H3.vis===false)return;hse3Draw()},110);hse3Draw()}
{let tm=null;new MutationObserver(()=>{if(!tm)tm=setTimeout(()=>{tm=null;const r=document.getElementById("hse3");if(r&&!r.dataset.ok)hse3Init()},40)}).observe(document.body,{childList:true,subtree:true})}
