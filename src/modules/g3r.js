/* =====================================================================================================
   DEPTH-BUFFERED RENDERER FOR THE EQUIPMENT 3D VIEWER
   Every pixel keeps the nearest surface, so parts can never be drawn in the wrong order, vanish or pop while the model turns.
   Surfaces use smooth vertex normals, so round parts are round instead of faceted. Light is worked out per pixel, edges are drawn from
   the depth and part buffers, and the picture is rendered at a higher resolution when nothing is moving. The part under the pointer
   is read straight from the buffer, so picking matches exactly what is drawn.
   ===================================================================================================== */
regMod("g3r","1.0",["g3d"],"Depth-buffered 3D renderer");
const G3R={bufs:{},stat:{}};
/* typed copy of a mesh with smooth normals; built once per mesh */
function g3Pack(M){if(M.pk)return M.pk;const F=M.faces,nF=F.length;let V=0;F.forEach(f=>V+=f.p.length);
 const vx=new Float32Array(V),vy=new Float32Array(V),vz=new Float32Array(V),nx=new Float32Array(V),ny=new Float32Array(V),nz=new Float32Array(V),off=new Int32Array(nF+1),fk=new Int16Array(nF),fpi=new Int32Array(nF),keys=[],km={},acc=new Map(),kq=(f,v)=>f.pi+"|"+Math.round(v[0]*500)+"|"+Math.round(v[1]*500)+"|"+Math.round(v[2]*500);
 F.forEach(f=>{if(!f.sm)return;f.p.forEach(v=>{const k=kq(f,v);let a=acc.get(k);if(!a)acc.set(k,a=[]);a.push(f.n)})});
 let o=0;F.forEach((f,i)=>{off[i]=o;fpi[i]=f.pi||0;if(f.k){if(km[f.k]===undefined){km[f.k]=keys.length;keys.push(f.k)}fk[i]=km[f.k]}else fk[i]=-1;
  f.p.forEach(v=>{vx[o]=v[0];vy[o]=v[1];vz[o]=v[2];let n=f.n;
   if(f.sm){const a=acc.get(kq(f,v));let sx=0,sy=0,sz=0;a.forEach(m=>{if(m[0]*f.n[0]+m[1]*f.n[1]+m[2]*f.n[2]>.55){sx+=m[0];sy+=m[1];sz+=m[2]}});const l=Math.hypot(sx,sy,sz)||1;n=[sx/l,sy/l,sz/l]}
   nx[o]=n[0];ny[o]=n[1];nz[o]=n[2];o++})});off[nF]=o;
 return M.pk={vx,vy,vz,nx,ny,nz,off,fk,fpi,keys,V,nF,km}}
/* working buffers for one viewer, reallocated when the size changes */
function g3Buf(id,w,h){let b=G3R.bufs[id];if(!b||b.w!==w||b.h!==h){const n=w*h;b=G3R.bufs[id]={w,h,W:new Float32Array(n),F:new Int32Array(n),N:new Int8Array(n*3),PF:new Int32Array(n),PW:new Float32Array(n),img:new ImageData(w,h),cv:null}}return b}
/* rasterise one triangle into the buffers. mode 0 writes depth, face and normal; mode 1 blends a see-through face over the picture; mode 2 does the same and also records the face for picking */
function g3Tri(B,S,ax,ay,aw,bx,by,bw,cx,cy,cw,na,nb,nc,fi,mode){
 let area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);if(area===0||!(area===area))return;
 if(area<0){let t=bx;bx=cx;cx=t;t=by;by=cy;cy=t;t=bw;bw=cw;cw=t;t=nb;nb=nc;nc=t;area=-area}
 const Wp=B.w,Hp=B.h;let y0=Math.max(0,Math.floor(Math.min(ay,by,cy)-.5)),y1=Math.min(Hp-1,Math.ceil(Math.max(ay,by,cy)-.5));if(y0>y1)return;
 const minx=Math.min(ax,bx,cx),maxx=Math.max(ax,bx,cx);if(maxx<0||minx>Wp)return;
 const bias=mode===0?.02:0,inv=1/area,Aab=-(by-ay),Abc=-(cy-by),Aca=-(ay-cy),W=B.W,F=B.F,N=B.N,PW=B.PW,PF=B.PF,img32=B.img32;
 for(let y=y0;y<=y1;y++){const py=y+.5;
  let eab=(bx-ax)*(py-ay)-(by-ay)*(.5-ax),ebc=(cx-bx)*(py-by)-(cy-by)*(.5-bx),eca=(ax-cx)*(py-cy)-(ay-cy)*(.5-cx);
  let xs=0,xe=Wp-1;eab+=bias;ebc+=bias;eca+=bias;
  if(Aab>1e-9){const t=Math.ceil(-eab/Aab);if(t>xs)xs=t}else if(Aab<-1e-9){const t=Math.floor(-eab/Aab);if(t<xe)xe=t}else if(eab<0)continue;
  if(Abc>1e-9){const t=Math.ceil(-ebc/Abc);if(t>xs)xs=t}else if(Abc<-1e-9){const t=Math.floor(-ebc/Abc);if(t<xe)xe=t}else if(ebc<0)continue;
  if(Aca>1e-9){const t=Math.ceil(-eca/Aca);if(t>xs)xs=t}else if(Aca<-1e-9){const t=Math.floor(-eca/Aca);if(t<xe)xe=t}else if(eca<0)continue;
  if(xs>xe)continue;
  let e1=eab+Aab*xs-bias,e2=ebc+Abc*xs-bias,e3=eca+Aca*xs-bias,idx=y*Wp+xs;
  for(let x=xs;x<=xe;x++,idx++,e1+=Aab,e2+=Abc,e3+=Aca){
   const wc=e1*inv,wa=e2*inv,wb=e3*inv,w=wa*aw+wb*bw+wc*cw;
   if(mode===0){if(w<=W[idx])continue;W[idx]=w;F[idx]=fi+1;const o3=idx*3;N[o3]=(wa*na[0]+wb*nb[0]+wc*nc[0])*127;N[o3+1]=(wa*na[1]+wb*nb[1]+wc*nc[1])*127;N[o3+2]=(wa*na[2]+wb*nb[2]+wc*nc[2])*127}
   else{if(w<=W[idx]&&F[idx]>0)continue;
    if(mode===2&&w>PW[idx]){PW[idx]=w;PF[idx]=fi+1}
    let nx=wa*na[0]+wb*nb[0]+wc*nc[0],ny=wa*na[1]+wb*nb[1]+wc*nc[1],nz=wa*na[2]+wb*nb[2]+wc*nc[2];S.shade(fi,nx,ny,nz);
    const a=S.fa[fi],p=img32[idx],pa=(p>>>24)/255,da=a+pa*(1-a);
    if(pa===0){img32[idx]=((a*255)<<24)|(S.sb<<16)|(S.sg<<8)|S.sr}
    else{const ia=1-a,r=(S.sr*a+(p&255)*ia)|0,g=(S.sg*a+((p>>>8)&255)*ia)|0,b=(S.sb*a+((p>>>16)&255)*ia)|0;img32[idx]=((da*255)<<24)|(b<<16)|(g<<8)|r}}}}}

/* shading of one surface point: three lights, hemisphere, rim and a tight highlight. The arrays hold each face's colour, gloss, height shade and rim strength. */
function g3Shader(fr,fg,fb,fm,fao,frim){const L1=[-.5,.72,-.48],L2=[.6,.25,-.5],l1=Math.hypot(...L1),l2=Math.hypot(...L2),Hv=[L1[0]/l1,L1[1]/l1,L1[2]/l1-1],hl_=Math.hypot(...Hv);
 return{fa:null,sr:0,sg:0,sb:0,shade(fi,nx,ny,nz){let l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;nx/=l;ny/=l;nz/=l;if(nz>0){nx=-nx;ny=-ny;nz=-nz}
   const d1=Math.max(0,(nx*L1[0]+ny*L1[1]+nz*L1[2])/l1),d2=Math.max(0,(nx*L2[0]+ny*L2[1]+nz*L2[2])/l2),hemi=ny*.5+.5;
   const x=Math.max(0,(nx*Hv[0]+ny*Hv[1]+nz*Hv[2])/hl_),x2=x*x,x4=x2*x2,x8=x4*x4,spec=x8*x8*x4*x2*fm[fi];
   const az=1-Math.abs(nz),rim=az*az*az*frim[fi],lum=(.36+.5*d1+.16*d2+.12*hemi)*fao[fi]+rim,sx=255*spec*.55+rim*60;
   const r=fr[fi]*lum+sx,g=fg[fi]*lum+sx,b=fb[fi]*lum+sx+rim*10;this.sr=r>255?255:r|0;this.sg=g>255?255:g|0;this.sb=b>255?255:b|0}}}
/* dark outlines from the buffers: silhouette, boundary between parts and sharp creases */
function g3Outline(B,pi_,PW,PH,q){const Fb=B.F,Nb=B.N,img32=B.img32,Wp=PW,st=Math.max(1,Math.round(q*.75));
 for(let y=st;y<PH-st;y++){for(let x=st;x<Wp-st;x++){const p=y*Wp+x,f0=Fb[p];if(f0===0)continue;const fl=Fb[p-st],fr_=Fb[p+st],fu=Fb[p-st*Wp],fd=Fb[p+st*Wp];let dk=1;
   if(fl===0||fr_===0||fu===0||fd===0)dk=.5;
   else{const a=pi_[f0-1];if((fl!==f0&&pi_[fl-1]!==a)||(fr_!==f0&&pi_[fr_-1]!==a)||(fu!==f0&&pi_[fu-1]!==a)||(fd!==f0&&pi_[fd-1]!==a))dk=.62;
    else if(fr_!==f0||fd!==f0){const o1=p*3,o2=(fr_!==f0?p+st:p+st*Wp)*3,dt=(Nb[o1]*Nb[o2]+Nb[o1+1]*Nb[o2+1]+Nb[o1+2]*Nb[o2+2])/16129;if(dt<.8)dk=.82}}
   if(dk<1){const c=img32[p];img32[p]=0xff000000|(((c>>>16&255)*dk)<<16)|(((c>>>8&255)*dk)<<8)|((c&255)*dk)}}}}
/* draw one frame of a viewer */
function g3Draw(id){const I=G3.inst[id],box=document.getElementById(id);if(!I||!box)return;const o=G3.cfg[id],M=g3Mesh(o.n),svg=box.querySelector("svg"),cv=box.querySelector("canvas.g3cv");if(!svg||!cv)return;const mini=!!box.dataset.mini,t0=performance.now();
 const W=900,H=500,cy=Math.cos(I.yaw),sy=Math.sin(I.yaw),cp=Math.cos(I.pit),sp=Math.sin(I.pit),D=M.R*3.4,t=I.t,tm=I.clock||0;
 const fxo=o.fx?o.fx():null,fxs=fxo?fxo.state:"normal",hot=(fxo&&fxo.hot)||[],sel=I.pin||(o.sel?o.sel():null),hl=o.hl||[],heat=o.heat||{},tint=o.tint;
 const rot=v=>{const x=v[0]-M.ctr[0],y=v[1]-M.ctr[1],z=v[2]-M.ctr[2],x1=x*cy+z*sy,z1=-x*sy+z*cy;return[x1,y*cp+z1*sp,-y*sp+z1*cp]};
 {const kk=sel&&g3KeyC(o.n,sel),xb=box.querySelector('[data-t=xray]');if(kk&&kk.inner&&!I.xray){I.xray=true;I.autoX=true;if(xb)xb.classList.add('on')}else if(!sel&&I.autoX){I.xray=false;I.autoX=false;if(xb)xb.classList.remove('on')}}
 /* camera eases to the selected part: centred and zoomed, back to the whole machine when nothing is selected */
 if(sel!==I.focusKey){I.focusKey=sel;I.userMoved=false}
 if(!I.userMoved&&!mini){let tz=1,tpx=0,tpy=0;const kc=sel&&g3KeyC(o.n,sel);if(kc){tz=g3Cl(M.Rf*.62/Math.max(kc.r,.1),1.3,3.4);const pc=rot(kc.c),sct=tz*(H*.46)/M.Rf,k=D/(D+pc[2]);tpx=-pc[0]*sct*k;tpy=pc[1]*sct*k}
  const ez=1-Math.pow(.0004,1/60);I.zoom+=(tz-I.zoom)*ez;I.px+=(tpx-I.px)*ez;I.py+=(tpy-I.py)*ez;if(Math.abs(tz-I.zoom)>.004||Math.abs(tpx-I.px)>.4||Math.abs(tpy-I.py)>.4)I.dirty=true;I.lastMove=now_()}
 const sc=I.zoom*(H*.46)/M.Rf,shk=fxs==="trip"?1.6:fxs==="alarm"?.7:0,sdx=shk*Math.sin(tm*47),sdy=shk*Math.cos(tm*39);
 const proj=p=>{const k=D/(D+p[2]);return[W/2+p[0]*sc*k+I.px+sdx,H/2-p[1]*sc*k+I.py+sdy]},fx=v=>v.toFixed(1);
 /* resolution: modest while moving, high when still */
 const moving=!!I.drag||I.spin||(I.run&&(G3M[o.n]||[]).some(p=>p.anim)&&fxs!=="trip")||now_()-(I.lastMove||0)<300,dpr=Math.min(window.devicePixelRatio||1,2),cw=Math.max(160,box.clientWidth||W),qf=moving?(G3R.slow?1:1.5):(mini?1.6:2.1);
 let PW=Math.round(Math.min(cw*dpr*qf,moving?1400:1900));PW=Math.max(mini?240:360,PW);const PH=Math.round(PW*H/W),q=PW/W;
 const B=g3Buf(id,PW,PH),pk=g3Pack(M),F=M.faces,nF=pk.nF,n=PW*PH;
 B.W.fill(0);B.F.fill(0);B.img32=B.img32||new Uint32Array(B.img.data.buffer);B.img32.fill(0);
 /* per-frame transform of every vertex */
 const V=pk.V;let RX=B.RX,RY=B.RY,RZ=B.RZ,SX=B.SX,SY=B.SY,SW=B.SW,NX=B.NX,NY=B.NY,NZ=B.NZ;
 if(!RX||RX.length!==V){RX=B.RX=new Float32Array(V);RY=B.RY=new Float32Array(V);RZ=B.RZ=new Float32Array(V);SX=B.SX=new Float32Array(V);SY=B.SY=new Float32Array(V);SW=B.SW=new Float32Array(V);NX=B.NX=new Float32Array(V);NY=B.NY=new Float32Array(V);NZ=B.NZ=new Float32Array(V)}
 const cx0=M.ctr[0],cy0=M.ctr[1],cz0=M.ctr[2],run=I.run,off=pk.off;
 const fType=B.ft&&B.ft.length===nF?B.ft:(B.ft=new Uint8Array(nF)),fa=B.fa&&B.fa.length===nF?B.fa:(B.fa=new Float32Array(nF)),fr=B.fr&&B.fr.length===nF?B.fr:(B.fr=new Float32Array(nF)),fg=B.fg&&B.fg.length===nF?B.fg:(B.fg=new Float32Array(nF)),fb=B.fb&&B.fb.length===nF?B.fb:(B.fb=new Float32Array(nF)),fm=B.fm&&B.fm.length===nF?B.fm:(B.fm=new Float32Array(nF)),fao=B.fao&&B.fao.length===nF?B.fao:(B.fao=new Float32Array(nF)),frim=B.frim&&B.frim.length===nF?B.frim:(B.frim=new Float32Array(nF)),fz=B.fz&&B.fz.length===nF?B.fz:(B.fz=new Float32Array(nF));
 const H0=Math.max(.5,M.mx[1]-M.ymin),dim=!!sel&&!I.xray&&!hl.length,pulse=.5+.5*Math.sin(tm*6),xray=I.xray;
 const tris=[],cmemo=new Map();
 for(let i=0;i<nF;i++){const f=F[i];fType[i]=255;if(f.in&&!xray)continue;const anim=f.anim&&run?f.anim:null,a0=off[i],a1=off[i+1];
  for(let j=a0;j<a1;j++){let px_=pk.vx[j],py_=pk.vy[j],pz_=pk.vz[j],qx=pk.nx[j],qy=pk.ny[j],qz=pk.nz[j];if(anim){const p=g3Anim(anim,[px_,py_,pz_],t),nn=g3AnimN(anim,[qx,qy,qz],t);px_=p[0];py_=p[1];pz_=p[2];qx=nn[0];qy=nn[1];qz=nn[2]}
   const x=px_-cx0,y=py_-cy0,z=pz_-cz0,x1=x*cy+z*sy,z1=-x*sy+z*cy,ry=y*cp+z1*sp,rz=-y*sp+z1*cp;RX[j]=x1;RY[j]=ry;RZ[j]=rz;
   const nz1=-qx*sy+qz*cy;NX[j]=qx*cy+qz*sy;NY[j]=qy*cp+nz1*sp;NZ[j]=-qy*sp+nz1*cp;
   const w=1/(D+rz+(f.zb||0)*.012),k=D/(D+rz);SW[j]=w;SX[j]=(W/2+x1*sc*k+I.px+sdx)*q;SY[j]=(H/2-ry*sc*k+I.py+sdy)*q}
  /* facing: the stored face normal, turned like the rest */
  let fn=f.n;if(anim)fn=g3AnimN(anim,fn,t);const fnz=-fn[1]*sp+(-fn[0]*sy+fn[2]*cy)*cp;
  const shellX=xray&&f.sh;if(!shellX&&fnz>=0)continue;
  const selOn=f.k&&f.k===sel;let type=0,al=1;if(shellX){type=1;al=.18}else if(dim&&!selOn){type=2;al=.26}
  fType[i]=type;fa[i]=al;
  /* base colour */
  const k=f.k;let c;let mc=cmemo.get(f.c);if(mc&&!f.light){c=mc}else{c=f.light?(o.light?o.light():(fxs==="trip"?[225,60,55]:fxs==="alarm"?[240,170,40]:[63,185,80])):f.c.slice(0,3);
  const tc=k&&(tint&&tint(k)||heat[k]);if(tc){const qq=typeof tc==="string"?g3Parse(tc):tc,a=qq[3]==null?.6:qq[3];c=c.map((v,ii)=>v*(1-a)+qq[ii]*a)}
  if(fxs!=="normal"&&!f.light){const base=fxs==="trip"?[225,60,55]:[240,170,40],a=fxs==="trip"?.2:.14;c=c.map((v,ii)=>v*(1-a)+base[ii]*a);if(k&&hot.includes(k)){const b2=fxs==="trip"?[235,50,45]:[245,160,30],a2=.35+.4*pulse;c=c.map((v,ii)=>v*(1-a2)+b2[ii]*a2)}}
  const hlOn=k&&hl.includes(k),hov=k&&k===I.hover;if(selOn||hlOn)c=c.map(v=>Math.min(255,v*1.08+24));else if(hov)c=c.map(v=>Math.min(255,v*1.05+16));if(!f.light)cmemo.set(f.c,c)}
  fr[i]=c[0];fg[i]=c[1];fb[i]=c[2];fm[i]=f.m;fao[i]=.86+.14*g3Cl((f.mid[1]-M.ymin)/H0*2.6,0,1);frim[i]=f.sm?.15:.05;
  tris.push(i)}
 const S=g3Shader(fr,fg,fb,fm,fao,frim);S.fa=fa;
 /* triangles: opaque ones into the buffers first */
 const trans=[];
 const nrm=(j)=>[NX[j],NY[j],NZ[j]];
 for(let ti=0;ti<tris.length;ti++){const i=tris[ti],ty=fType[i];if(ty!==0){trans.push(i);continue}const a0=off[i],cnt=off[i+1]-a0;
  for(let j=1;j<cnt-1;j++){const u=a0,v=a0+j,w=a0+j+1;g3Tri(B,S,SX[u],SY[u],SW[u],SX[v],SY[v],SW[v],SX[w],SY[w],SW[w],nrm(u),nrm(v),nrm(w),i,0)}}
 /* deferred shading of the nearest surface at every pixel */
 const img32=B.img32,Wb=B.W,Fb=B.F,Nb=B.N;let cover=0;
 for(let p=0;p<n;p++){const fi=Fb[p]-1;if(fi<0)continue;cover++;const o3=p*3;S.shade(fi,Nb[o3],Nb[o3+1],Nb[o3+2]);img32[p]=0xff000000|(S.sb<<16)|(S.sg<<8)|S.sr}
 g3Outline(B,pk.fpi,PW,PH,q);
 /* see-through faces: the shells in X-ray and the parts that are dimmed around a selected one */
 B.PW.set(Wb);B.PF.set(Fb);
 if(trans.length){const idxs=trans.slice();const key={};idxs.forEach(i=>{let z=0;const a0=off[i],a1=off[i+1];for(let j=a0;j<a1;j++)z+=RZ[j];key[i]=z/(a1-a0)+(F[i].zb||0)});idxs.sort((a,b)=>key[b]-key[a]);
  idxs.forEach(i=>{const a0=off[i],cnt=off[i+1]-a0,mode=fType[i]===2?2:1;for(let j=1;j<cnt-1;j++){const u=a0,v=a0+j,w=a0+j+1;g3Tri(B,S,SX[u],SY[u],SW[u],SX[v],SY[v],SW[v],SX[w],SY[w],SW[w],nrm(u),nrm(v),nrm(w),i,mode)}})}
 /* outlines of the selected part and of highlighted parts */
 const keyIdx=k=>pk.km[k],selI=sel!=null?keyIdx(sel):undefined,hlI=hl.map(keyIdx).filter(v=>v!==undefined);
 B.mk32=B.mk32&&B.mk32.length===n?B.mk32:new Uint32Array(n);B.mk32.fill(0);const mk32=B.mk32;let marked=false;
 const mark=(ix,col)=>{marked=true;const fk=pk.fk;const th=Math.max(1,Math.round(q*1.3));for(let y=th;y<PH-th;y++)for(let x=th;x<PW-th;x++){const p=y*PW+x,f0=B.PF[p],a=f0>0&&fk[f0-1]===ix;const f1=B.PF[p+th],f2=B.PF[p+th*PW],f3=B.PF[p-th],f4=B.PF[p-th*PW],b1=f1>0&&fk[f1-1]===ix,b2=f2>0&&fk[f2-1]===ix,b3=f3>0&&fk[f3-1]===ix,b4=f4>0&&fk[f4-1]===ix;if(a&&(!b1||!b2||!b3||!b4)){img32[p]=col;mk32[p]=col}}};
 if(selI!==undefined)mark(selI,0xffd75f0b);
 if(hlI.length&&Math.floor(tm*2.4)%2===0)hlI.forEach(h=>mark(h,0xff2e22cf));
 const ctx=cv.getContext("2d");if(cv.width!==PW||cv.height!==PH){cv.width=PW;cv.height=PH}
 let oc=B.oc;if(!oc||oc.width!==PW||oc.height!==PH){oc=B.oc=document.createElement("canvas");oc.width=PW;oc.height=PH}
 oc.getContext("2d").putImageData(B.img,0,0);
 /* background, ground grid and contact shadow, then the model on top */
 const g=ctx.createLinearGradient(0,0,0,PH);g.addColorStop(0,"#f7f9fc");g.addColorStop(1,"#e1e8f1");ctx.fillStyle=g;ctx.fillRect(0,0,PW,PH);
 const gy=M.ymin,gr=M.R*1.2,step=gr/5;ctx.beginPath();
 const pj=p=>{const r=proj(rot(p));return[r[0]*q,r[1]*q]};
 for(let i=-5;i<=5;i++){const a=pj([M.ctr[0]+i*step,gy,M.ctr[2]-gr]),b=pj([M.ctr[0]+i*step,gy,M.ctr[2]+gr]),c=pj([M.ctr[0]-gr,gy,M.ctr[2]+i*step]),d=pj([M.ctr[0]+gr,gy,M.ctr[2]+i*step]);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.moveTo(c[0],c[1]);ctx.lineTo(d[0],d[1])}
 ctx.strokeStyle="#d3dbe6";ctx.lineWidth=Math.max(.8,q*.7);ctx.stroke();
 ctx.save();ctx.filter="blur("+Math.round(12*q)+"px)";ctx.beginPath();for(let i=0;i<24;i++){const a=i/24*Math.PI*2,p=pj([M.ctr[0]+Math.cos(a)*(M.mx[0]-M.mn[0])*.52,gy,M.ctr[2]+Math.sin(a)*(M.mx[2]-M.mn[2])*.6]);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])}ctx.closePath();ctx.fillStyle="rgba(34,48,71,.22)";ctx.fill();ctx.restore();
 ctx.drawImage(oc,0,0);
 if(marked){let om=B.om;if(!om||om.width!==PW||om.height!==PH){om=B.om=document.createElement("canvas");om.width=PW;om.height=PH}om.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(mk32.buffer),PW,PH),0,0);ctx.save();ctx.filter="blur("+Math.round(3*q)+"px)";ctx.globalAlpha=.9;ctx.drawImage(om,0,0);ctx.restore()}
 I.pickBuf={PF:B.PF,w:PW,h:PH,keys:pk.keys,fk:pk.fk};
 /* overlays that stay vector: ring and leader line for the selected part, plume and sparks for a fault */
 let extra="";const kc=sel&&g3KeyC(o.n,sel);
 if(kc&&!mini){const q0=proj(rot(kc.c)),r0=Math.max(10,kc.r*sc*D/(D+rot(kc.c)[2])*1.1),cwid=box.clientWidth||900,sk=900/cwid,cxx=W-(262)*sk,cyy=70*sk;
  extra+=`<circle cx="${fx(q0[0])}" cy="${fx(q0[1])}" r="${fx(r0+3*pulse)}" fill="none" stroke="#0b5fd7" stroke-width="1.4" stroke-dasharray="4 3" opacity=".8" pointer-events="none"/><circle cx="${fx(q0[0])}" cy="${fx(q0[1])}" r="3" fill="#0b5fd7" pointer-events="none"/>`;
  if(box.querySelector(".g3card"))extra+=`<path d="M${fx(q0[0])} ${fx(q0[1])}L${fx(q0[0]+(cxx-q0[0])*.5)} ${fx(q0[1])}L${fx(cxx)} ${fx(cyy)}" fill="none" stroke="#0b5fd7" stroke-width="1.1" opacity=".7" pointer-events="none"/>`}
 if(fxo&&fxs!=="normal"&&hot.length){const kk=g3KeyC(o.n,hot[0]);if(kk){const q0=rot(kk.c),qp=proj(q0),nn=fxs==="trip"?16:9;for(let i=0;i<nn;i++){const ph=((tm*(fxs==="trip"?.7:.45)+i/nn)%1),rx=Math.sin(i*12.9898)*.5,rs=ph*(18+kk.r*sc*.4);
    const xx=qp[0]+rx*40*ph,yy=qp[1]-ph*(46+kk.r*sc*.6),rr=3+rs*.5,a=(1-ph)*(fxs==="trip"?.55:.4);
    extra+=`<circle cx="${fx(xx)}" cy="${fx(yy)}" r="${fx(rr)}" fill="${fxs==="trip"&&i%3===0?"rgba(255,120,60,"+a+")":"rgba(235,240,246,"+a+")"}" pointer-events="none"/>`}}}
 if(o.over){try{extra+=o.over({rot,proj,fx,tm,sc,D,I,M})||""}catch(e){}}
 svg.querySelector(".g3s").innerHTML=extra;
 const cap=box.querySelector(".g3cap");if(cap&&!I.hover&&!mini)cap.textContent=sel?g3Name(o.n,sel):"Drag to rotate, scroll to zoom, select a part for its details";
 const fbx=box.querySelector(".g3fxb");if(fbx){const h=fxo&&fxo.text?`<span class="p3st ${fxs==="trip"?"trip":fxs==="alarm"?"alarm":"ok"}">${fxs==="trip"?"Trip":fxs==="alarm"?"Alarm":"Normal"}</span> ${fxo.text}`:"";if(fbx.dataset.h!==h){fbx.dataset.h=h;fbx.innerHTML=h}}
 const card=box.querySelector(".g3side");if(card&&I.cardKey!==sel){I.cardKey=sel;card.innerHTML=mini?"":g3Info(o.n,sel)}
 const ms=performance.now()-t0;I.ms=ms;G3R.stat={ms,w:PW,h:PH,cover,tris:tris.length,moving};G3R.slow=ms>38&&moving;
 if(moving)I.needHi=true}
function now_(){return performance.now()}
/* which part is under a point of the 900 by 500 picture */
function g3PickAt(I,vx,vy){const b=I&&I.pickBuf;if(!b)return null;const q=b.w/900,x=Math.round(vx*q),y=Math.round(vy*q);if(x<0||y<0||x>=b.w||y>=b.h)return null;const f=b.PF[y*b.w+x]-1;if(f<0)return null;const k=b.fk[f];return k<0?null:b.keys[k]}
