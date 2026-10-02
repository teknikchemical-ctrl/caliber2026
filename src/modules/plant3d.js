/* =====================================================================================================
   3D PLANT LAYOUT
   The eight machines are placed as on the plot plan (two rows either side of the main pipe rack), joined by the same process,
   gas, cooling water, nitrogen and steam streams as the plant P&ID overview. Floating labels show each unit's state. Drag to orbit,
   scroll to zoom, shift-drag to move. Selecting a unit flies the camera to it and then opens its equipment set. Trips from the
   simulator colour the unit, stop the flow out of it and show the upset downstream.
   Drawn on a canvas with a small software renderer; the models are the same solids as the equipment drawings.
   ===================================================================================================== */
regMod("plant3d","1.0",["g3d"],"3D plant layout");
const P3={built:false,cam:{yaw:-.62,pit:.6,dist:46,tx:0,ty:1.5,tz:0},to:null,sel:0,hover:0,pipe:null,orbit:true,labels:true,flow:true,motion:true,open:true,faces:[],units:{},pipes:[],t:0,dirty:true,cv:null,st:{},hit:[],pend:0,at:0,seq:0};
const P3POS={1:[-16.5,-9],2:[-5.5,-9],3:[5.5,-9],4:[16.5,-9],5:[-16.5,9],6:[-5.5,9],7:[5.5,9],8:[16.5,9]};
const P3SC={1:2.5,2:1.75,3:2.0,4:1.85,5:1.95,6:4.0,7:2.9,8:2.2};
const P3SKY=[[233,240,248],[203,218,236]],P3GR=[214,220,228];
function p3Prim(list,u,layer,id){const out=[];list.forEach(p=>g3Parts(p).forEach(f=>{g3Orient(p,f);let r=0;const c=f.mid;f.p.forEach(v=>{r=Math.max(r,Math.hypot(v[0]-c[0],v[1]-c[1],v[2]-c[2]))});f.rad=r;f.u=u;f.layer=layer||2;f.pid=id||null;out.push(f)}));return out}
function p3Place(n){const M=g3Mesh(n,.5),s=P3SC[n],[x0,z0]=P3POS[n],cx=(M.mn[0]+M.mx[0])/2,cz=(M.mn[2]+M.mx[2])/2,out=[];
 const T=v=>[x0+(v[0]-cx)*s,(v[1]-M.ymin)*s+.25,z0+(v[2]-cz)*s];
 M.faces.forEach(f=>{if(f.in)return;if(f.rad==null){let r=0;const c=f.mid;f.p.forEach(v=>{r=Math.max(r,Math.hypot(v[0]-c[0],v[1]-c[1],v[2]-c[2]))});f.rad=r}const g={p:f.p.map(T),n:f.n,mid:T(f.mid),rad:f.rad,c:f.c,m:f.m,sh:f.sh,k:f.k,u:n,layer:2,light:f.light,sm:f.sm,anim:f.anim?Object.assign({},f.anim,f.anim.at?{at:T(f.anim.at)}:{}, f.anim.type==="slide"?{amp:f.anim.amp*s}:{}):null};out.push(g)});
 P3.units[n]={x:x0,z:z0,s,top:(M.mx[1]-M.ymin)*s+.25,r:Math.hypot(M.mx[0]-M.mn[0],M.mx[2]-M.mn[2])*s/2,faces:out,lights:out.filter(f=>f.light)};return out}
const p3B=(x,y,z,w,h,d,c,o)=>g3B("",x,y,z,w,h,d,c,o),p3C=(ax,x,y,z,len,r,c,o,r2)=>g3C("",ax,x,y,z,len,r,c,o,r2);
function p3Scene(){const F=[],add=(list,u,layer,id)=>F.push(...p3Prim(list,u||0,layer==null?1:layer,id));
 add([p3B(-1,-.2,0,70,.4,42,"#cdd6e2",{r:1.5,zb:3})],0,0);
 K.sets.forEach(s=>{const [x,z]=P3POS[s.n];add([p3B(x,.06,z,11,.2,9.5,"#e3e9f1",{r:.4,zb:1.2}),p3B(x,.17,z-4.65,11,.02,.12,"amber"),p3B(x,.17,z+4.65,11,.02,.12,"amber")],0,1)});
 /* road */
 add([p3B(0,.02,-22,92,.1,5,"dark",{r:.2,zb:1}),p3B(0,.02,22,92,.1,5,"dark",{r:.2,zb:1}),...Array.from({length:14},(_,i)=>p3B(-40+i*6.2,.09,-22,2.6,.02,.18,"white")),...Array.from({length:14},(_,i)=>p3B(-40+i*6.2,.09,22,2.6,.02,.18,"white"))],0,1);
 /* pipe rack: portal frames, two beam levels and a walkway */
 const cols=[-27,-18,-9,0,9,18,27];
 add(cols.flatMap(x=>[p3C("y",x,3.3,-2.6,6.6,.2,"dark"),p3C("y",x,3.3,2.6,6.6,.2,"dark"),p3B(x,4.0,0,.25,.22,5.4,"dark",{r:.03}),p3B(x,6.2,0,.25,.22,5.4,"dark",{r:.03}),p3B(x,2.0,-2.6,.12,.12,.12,"steel")]).concat([p3B(0,6.05,-2.6,56,.18,.2,"steel",{r:.02}),p3B(0,6.05,2.6,56,.18,.2,"steel",{r:.02}),p3B(0,3.85,-2.6,56,.18,.2,"steel",{r:.02}),p3B(0,3.85,2.6,56,.18,.2,"steel",{r:.02})]),0,2);
 /* control room, storage tank, flare, separator */
 add([p3B(-33,2.2,0,9,4.4,7,"white",{r:.3,m:.1}),p3B(-33,4.5,0,9.4,.35,7.4,"steel",{r:.1}),...[-3,-1,1,3].map(x=>p3B(-33+x,2.4,3.52,1.4,1.1,.06,"blue",{r:.03})),p3B(-33,1.2,3.52,1.3,2.1,.06,"dark",{r:.04}),p3C("y",-30,5.2,-2,1.6,.08,"steel")],0,2);
 add([p3C("y",-33,3.6,-15,7.2,4.2,"paint",{m:.4,seg:48}),g3E("",  "y",-33,7.2,-15,1.4,4.2,"paint",0,Math.PI/2,{m:.4}),p3C("y",-29,3.6,-15,7.2,.1,"gray"),p3C("y",-33,.35,-15,.5,4.5,"gray"),...Array.from({length:6},(_,i)=>p3C("y",-33,.9+i*1.1,-15,.08,4.25,"steel",{m:.6,seg:48}))],0,2);
 add([p3C("y",33,13,-17,26,.45,"white",{m:.3,seg:16},.3),p3B(33,.3,-17,3,.6,3,"gray",{r:.2}),...[0,1,2,3,4,5].map(i=>p3B(33,3+i*4,-17,1.4,.18,1.4,"steel",{r:.05})),p3C("x",33,25,-17,2.2,.08,"steel",{seg:8})],0,2);
 const [sx,sz]=P3POS[6];add([p3C("y",sx-5.2,4,sz+1.2,7.2,1.5,"paint",{m:.5,seg:36}),g3E("","y",sx-5.2,7.6,sz+1.2,.9,1.5,"paint",0,Math.PI/2,{m:.5}),g3E("","y",sx-5.2,.4,sz+1.2,.9,1.5,"paint",Math.PI/2,Math.PI,{m:.5}),p3B(sx-5.2,.2,sz+1.2,2.4,.4,2.4,"gray",{r:.2})],0,2);
 return F}
/* pipes: from a unit's top, up to a lane in the rack, along the rack, and down to the next unit */
const P3LANE=(L)=>({y:4.3+(L%3)*.8+(L>=3?.0:0),z:(L-4)*.52});
function p3Routes(){const R=[],tops=n=>P3.units[n].top+.5,anch=(n,off)=>[P3POS[n][0]+Math.max(-3.4,Math.min(3.4,(off||0)/42)),P3POS[n][1]],pad=[];
 const lanes={feed:0,slr:7,eff:1,pol:8,rg:2,rgr:9,cwk:3,cwf:10,sol:4,n2:5,stm:6};
 OVL.forEach(([id,lab,a,b,svc,ln_,off])=>{const L=P3LANE(lanes[id]);
  if(a===0){const tg=b.map((n,i)=>[...anch(n,off[1][i]),n]),xs=tg.map(t=>t[0]);const hdr=[[Math.min(...xs,-26),L.y,L.z],[Math.max(...xs),L.y,L.z]];
   R.push({id,lab,svc,from:0,to:b,pts:hdr,r:.22,hdr:1});tg.forEach(([x,z,n])=>{R.push({id:id+n,lab,svc,from:0,to:[n],pts:[[x,L.y,L.z],[x,L.y,z],[x,tops(n),z]],r:.14,stub:1,base:id})});return}
  const A=anch(a,off&&off[0]),B=anch(b,off&&off[1]);
  R.push({id,lab,svc,from:a,to:[b],pts:[[A[0],tops(a),A[1]],[A[0],L.y,A[1]],[A[0],L.y,L.z],[B[0],L.y,L.z],[B[0],L.y,B[1]],[B[0],tops(b),B[1]]],r:svc==="cw"?.26:svc==="gas"?.2:.18})});
 /* feed from the storage tank */
 const f1=P3.units[1],tk=[-33,-15];R.push({id:"tank",lab:"Hexane from 12-T-01",svc:"proc",from:0,to:[1],pts:[[tk[0]+4.2,1.2,tk[1]],[P3POS[1][0]-6,1.2,tk[1]],[P3POS[1][0]-6,1.2,P3POS[1][1]],[P3POS[1][0]-2.6,1.2,P3POS[1][1]]],r:.2});
 /* separator outlet to the control valve */
 const sp=P3POS[6];R.push({id:"sep",lab:"Separator outlet",svc:"proc",from:0,to:[6],pts:[[sp[0]-5.2,.9,sp[1]+1.2],[sp[0]-2.3,.9,sp[1]+1.2],[sp[0]-2.3,.9,sp[1]]],r:.18});
 return R}
function p3PipeFaces(R){const out=[];
 R.forEach((r,ri)=>{const col=(SVC[r.svc]||SVC.proc)[1],pts=r.pts,len=[0];
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],L=Math.hypot(...d);len.push(len[i]+L);if(L<.01)continue;const ax=Math.abs(d[0])>=Math.abs(d[1])&&Math.abs(d[0])>=Math.abs(d[2])?"x":Math.abs(d[1])>=Math.abs(d[2])?"y":"z",c=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
   out.push(...p3Prim([g3C("",ax,c[0],c[1],c[2],L,r.r,col,{m:.55,seg:9})],0,2,r.id));
   const nf=Math.floor(L/5);for(let k=1;k<=nf;k++){const t=k/(nf+1),q=[a[0]+d[0]*t,a[1]+d[1]*t,a[2]+d[2]*t];out.push(...p3Prim([g3C("",ax,q[0],q[1],q[2],.12,r.r*1.45,"steel",{m:.7,seg:12})],0,2,r.id))}
   if(i>0)out.push(...p3Prim([g3E("","y",a[0],a[1],a[2],r.r*1.08,r.r*1.08,col,0,Math.PI,{m:.55,seg:10})],0,2,r.id))}
  r.len=len;r.total=len[len.length-1]});return out}
function p3Build(){if(P3.built)return;K.sets.forEach(s=>{P3.faces.push(...p3Place(s.n))});P3.routes=p3Routes();const sc=p3Scene(),pf=p3PipeFaces(P3.routes);
 P3.faces.push(...sc,...pf);P3.built=true;
 P3.faces.forEach((f,i)=>{if(f.layer==null)f.layer=2;f.i=i})}
/* ---------- camera and drawing ---------- */
const p3Col=(c,lum,spec,fog,bg,tint,lift)=>{let r=c[0],g=c[1],b=c[2];if(tint){r=r*(1-tint[3])+tint[0]*tint[3];g=g*(1-tint[3])+tint[1]*tint[3];b=b*(1-tint[3])+tint[2]*tint[3]}
 r=r*lum+255*spec*.5+lift;g=g*lum+255*spec*.5+lift;b=b*lum+255*spec*.5+lift;if(fog>0){r+= (bg[0]-r)*fog;g+=(bg[1]-g)*fog;b+=(bg[2]-b)*fog}return"rgb("+(r<0?0:r>255?255:r|0)+","+(g<0?0:g>255?255:g|0)+","+(b<0?0:b>255?255:b|0)+")"};
const P3STC={ok:[63,185,80],alarm:[240,170,40],upset:[240,170,40],trip:[225,60,55]};
function p3Frame(now,tick){const cv=P3.cv;if(!cv||!cv.isConnected){P3.cv=null;return}requestAnimationFrame(tick);
 if(document.hidden||cv.offsetParent===null)return;const dt=Math.min(.1,(now-(P3.last||now))/1000);P3.last=now;const cam=P3.cam;
 /* camera easing and auto orbit */
 if(P3.to){const k=1-Math.pow(.0009,dt),T=P3.to;let dy=T.yaw-cam.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));cam.yaw+=dy*k;cam.pit+=(T.pit-cam.pit)*k;cam.dist+=(T.dist-cam.dist)*k;cam.tx+=(T.tx-cam.tx)*k;cam.ty+=(T.ty-cam.ty)*k;cam.tz+=(T.tz-cam.tz)*k;
  if(Math.abs(dy)<.01&&Math.abs(T.dist-cam.dist)<.4&&Math.abs(T.tx-cam.tx)<.1&&Math.abs(T.tz-cam.tz)<.1){P3.to=null;if(P3.pend){const n=P3.pend;P3.pend=0;go("equipment",{set:n,tab:"overview"});return}}}
 else if(P3.orbit&&!P3.drag){cam.yaw+=dt*.06}
 if(P3.motion)P3.t+=dt;
 const W=cv.clientWidth,H=cv.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}
 const ctx=cv.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
 const cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw),cp=Math.cos(cam.pit),sp=Math.sin(cam.pit),F=H*.95,t=P3.t;
 const trn=n=>{const z1=-n[0]*sy+n[2]*cy;return[n[0]*cy+n[2]*sy,n[1]*cp+z1*sp,-n[1]*sp+z1*cp]};
 /* sky */
 const proj=v=>{const x=v[0]-cam.tx,y=v[1]-cam.ty,z=v[2]-cam.tz,x1=x*cy+z*sy,z1=-x*sy+z*cy,y2=y*cp+z1*sp,z2=-y*sp+z1*cp,d=cam.dist+z2;return d<1?null:[W/2+x1*F/d,H/2-y2*F/d,d]};
 const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,"rgb("+P3SKY[1].join(",")+")");gr.addColorStop(.55,"rgb("+P3SKY[0].join(",")+")");gr.addColorStop(1,"rgb(244,247,251)");ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
 const L0=[-.42,.8,.38],ll=Math.hypot(...L0),Ls=[L0[0]/ll,L0[1]/ll,L0[2]/ll];const Lc=trn(Ls),Hv=(()=>{const h=[Lc[0],Lc[1],Lc[2]-1],l=Math.hypot(...h);return[h[0]/l,h[1]/l,h[2]/l]})();
 const st=P3.st,foc=P3.focus,list=P3.list=[],Q=P3.Q||(P3.Q=new Float64Array(3)),tx=cam.tx,ty=cam.ty,tz=cam.tz,D=cam.dist;
 const pq=v=>{const x=v[0]-tx,y=v[1]-ty,z=v[2]-tz,x1=x*cy+z*sy,z1=-x*sy+z*cy,y2=y*cp+z1*sp,z2=-y*sp+z1*cp,d=D+z2;Q[0]=W/2+x1*F/d;Q[1]=H/2-y2*F/d;Q[2]=d;return d>=1};
 P3.pq=pq;
 const pool=P3.pool||(P3.pool=[]);let cnt=0;
 for(let i=0;i<P3.faces.length;i++){const f=P3.faces[i];let nrm=f.n,mid=f.mid,pts=null;
  if(f.anim&&P3.motion){pts=f.p.map(v=>g3Anim(f.anim,v,t));nrm=g3AnimN(f.anim,f.n,t);mid=g3Anim(f.anim,f.mid,t)}
  const x=mid[0]-tx,y=mid[1]-ty,z=mid[2]-tz,x1=x*cy+z*sy,z1=-x*sy+z*cy,y2=y*cp+z1*sp,z2=-y*sp+z1*cp,d=D+z2;if(d<1.5||f.rad*F/d<.9)continue;
  const nz1=-nrm[0]*sy+nrm[2]*cy,nx=nrm[0]*cy+nrm[2]*sy,ny=nrm[1]*cp+nz1*sp,nzz=-nrm[1]*sp+nz1*cp;
  if(-(nx*x1+ny*y2)-nzz*d<=0)continue;
  const e=pool[cnt]||(pool[cnt]={xs:[],ys:[]});cnt++;e.f=f;e.pts=pts;e.nrm=nrm;e.nx=nx;e.ny=ny;e.nz=nzz;const d2=x1*x1+y2*y2+d*d;e.d2=d2;e.key=f.layer*1e9-d2;e.skip=false;list.push(e)}
 list.sort((a,b)=>a.key-b.key);
 /* contact shadows */
 for(const n in P3.units){const u=P3.units[n],ring=[];let ok=true;for(let i=0;i<20;i++){const a=i/20*Math.PI*2;if(!pq([u.x+Math.cos(a)*u.r*1.05,.3,u.z+Math.sin(a)*u.r*.8])){ok=false;break}ring.push([Q[0],Q[1]])}
  if(ok){ctx.beginPath();ring.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fillStyle="rgba(30,45,70,.16)";ctx.fill()}}
 const fog0=cam.dist*.55;
 for(const e of list){const f=e.f,pts=e.pts||f.p,m=pts.length;let ok=true,mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;const xs=e.xs,ys=e.ys;xs.length=m;ys.length=m;
  for(let i=0;i<m;i++){if(!pq(pts[i])){ok=false;break}const X=Q[0],Y=Q[1];xs[i]=X;ys[i]=Y;if(X<mnx)mnx=X;if(X>mxx)mxx=X;if(Y<mny)mny=Y;if(Y>mxy)mxy=Y}
  e.skip=true;if(!ok||mxx<0||mnx>W||mxy<0||mny>H)continue;if(mxx-mnx<.7&&mxy-mny<.7)continue;e.skip=false;
  const nrm=e.nrm,d1=Math.max(0,(nrm[0]*Ls[0]+nrm[1]*Ls[1]+nrm[2]*Ls[2])),hemi=nrm[1]*.5+.5,spec=Math.pow(Math.max(0,e.nx*Hv[0]+e.ny*Hv[1]+e.nz*Hv[2]),22)*(f.m||.18);let lum=.4+.5*d1+.14*hemi;
  const u=f.u,s=u?st[u]:null;let tint=null,lift=0,col=f.c;
  if(f.light){col=P3STC[(s&&s.st)||"ok"];lum=1.1;if(s&&(s.st==="trip"||s.st==="alarm"))lum=.7+.5*Math.abs(Math.sin(t*5))}
  else if(s&&s.st==="trip")tint=[225,60,55,.5];else if(s&&(s.st==="alarm"||s.st==="upset"))tint=[240,170,40,.32];
  if(f.pid&&(P3.pipe===f.pid))lift=30;
  if(u&&(u===P3.sel||u===P3.hover))lift=u===P3.sel?22:12;
  const fog=Math.min(.55,Math.max(0,(Math.sqrt(e.d2)-fog0)/(cam.dist*1.7)))*.9;
  let alpha=1;if(foc&&u!==foc&&f.layer>0)alpha=.22;else if(foc&&f.layer===0)alpha=.7;
  ctx.globalAlpha=alpha;ctx.fillStyle=p3Col(col,lum,spec,fog,P3SKY[0],tint,lift);ctx.beginPath();ctx.moveTo(xs[0],ys[0]);for(let i=1;i<m;i++)ctx.lineTo(xs[i],ys[i]);ctx.closePath();ctx.fill();
  if(f.sm){ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.6;ctx.stroke()}else if(f.layer>0&&m<=8&&(mxx-mnx>5||mxy-mny>5)){ctx.strokeStyle="rgba(25,40,65,.35)";ctx.lineWidth=.5;ctx.stroke()}}
 ctx.globalAlpha=1;
 /* status rings on the ground */
 for(const n in P3.units){const u=P3.units[n],s=st[n]||{st:"ok"},ring=[],pulse=.5+.5*Math.sin(t*(s.st==="trip"?6:s.st==="ok"?1.4:3.5));
  for(let i=0;i<36;i++){const a=i/36*Math.PI*2,q=proj([u.x+Math.cos(a)*(u.r*1.25+pulse*.35),.34,u.z+Math.sin(a)*(u.r*1.0+pulse*.3)]);if(!q){ring.length=0;break}ring.push(q)}
  if(!ring.length)continue;const c=P3STC[s.st]||P3STC.ok,sel=+n===P3.sel;ctx.beginPath();ring.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.lineWidth=sel?3:2;ctx.strokeStyle="rgba("+c.join(",")+","+(sel?.95:.35+.35*pulse)+")";ctx.globalAlpha=foc&&+n!==foc?.3:1;ctx.stroke()}
 ctx.globalAlpha=1;
 /* flow pulses along the pipes; none out of a tripped unit */
 if(P3.flow){P3.routes.forEach(r=>{const s=r.from?st[r.from]:null;if(s&&s.st==="trip")return;const col=(SVC[r.svc]||SVC.proc)[1],sp0=r.svc==="gas"?5:r.svc==="cw"?3.5:3,n=Math.max(1,Math.round(r.total/5));
   for(let k=0;k<n;k++){let d=((t*sp0+k*r.total/n)%r.total);let i=1;while(i<r.len.length-1&&r.len[i]<d)i++;const a=r.pts[i-1],b=r.pts[i],seg=r.len[i]-r.len[i-1]||1,q=(d-r.len[i-1])/seg,w=[a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q+r.r*.0,a[2]+(b[2]-a[2])*q],pr=proj(w);if(!pr)continue;
    const rad=Math.max(1.4,r.r*F/pr[2]*.9);const g2=ctx.createRadialGradient(pr[0],pr[1],0,pr[0],pr[1],rad*2.2);g2.addColorStop(0,"rgba(255,255,255,.95)");g2.addColorStop(.35,col);g2.addColorStop(1,"rgba(255,255,255,0)");ctx.globalAlpha=foc&&!(r.to.includes(foc)||r.from===foc)?.15:.9;ctx.fillStyle=g2;ctx.beginPath();ctx.arc(pr[0],pr[1],rad*2.2,0,7);ctx.fill()}});ctx.globalAlpha=1}
 /* flare flame */
 {const q=proj([33,26.2,-17]);if(q){const h=Math.max(6,F/q[2]*1.4*(1+.2*Math.sin(t*14)+.1*Math.sin(t*23)));const g3=ctx.createRadialGradient(q[0],q[1]-h*.3,0,q[0],q[1]-h*.3,h);g3.addColorStop(0,"rgba(255,240,150,.95)");g3.addColorStop(.5,"rgba(255,140,40,.7)");g3.addColorStop(1,"rgba(255,90,20,0)");ctx.fillStyle=g3;ctx.beginPath();ctx.ellipse(q[0],q[1]-h*.3,h*.38,h*.62,0,0,7);ctx.fill()}}
 /* pipe name flags */
 if((P3.sel||P3.pipe)&&cam.dist<44){ctx.font="600 11px system-ui,sans-serif";ctx.textAlign="center";P3.routes.forEach(r=>{if(r.stub||r.id==="sep")return;if(!P3.pipe&&!(r.from===P3.sel||r.to.includes(P3.sel)))return;const m=r.pts[Math.floor(r.pts.length/2)-1]||r.pts[0],m2=r.pts[Math.floor(r.pts.length/2)]||r.pts[0],mid=[(m[0]+m2[0])/2,(m[1]+m2[1])/2+.5,(m[2]+m2[2])/2],q=proj(mid);if(!q||q[0]<0||q[0]>W)return;const w=ctx.measureText(r.lab).width+12;ctx.globalAlpha=foc?.3:.92;ctx.fillStyle="#fff";ctx.strokeStyle=(SVC[r.svc]||SVC.proc)[1];ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect?ctx.roundRect(q[0]-w/2,q[1]-9,w,17,8):ctx.rect(q[0]-w/2,q[1]-9,w,17);ctx.fill();ctx.stroke();ctx.fillStyle="#1d2b3d";ctx.fillText(r.lab,q[0],q[1]+3.5)});ctx.globalAlpha=1}
 /* floating unit labels */
 K.sets.forEach(s=>{const el=P3.labs&&P3.labs[s.n];if(!el)return;const u=P3.units[s.n],q=proj([u.x,u.top+2.0+(cam.dist<30?.4:0),u.z]),base=proj([u.x,u.top+.2,u.z]);
  if(!q||!P3.labels||q[0]<-80||q[0]>W+80||q[1]<-40||q[1]>H+40){el.style.display="none";return}
  el.style.display="";el.style.transform="translate("+(q[0]|0)+"px,"+(q[1]|0)+"px) translate(-50%,-100%)";el.style.opacity=foc&&foc!==s.n?.25:1;el.classList.toggle("sel",P3.sel===s.n);el.classList.toggle("full",cam.dist<30||P3.sel===s.n||P3.hover===s.n);el.style.zIndex=1000-Math.round(q[2]);
  if(base){ctx.strokeStyle="rgba(21,94,163,.55)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(base[0],base[1]);ctx.stroke()}});
 P3.frameMs=performance.now()-now}
function p3State(){K.sets.forEach(s=>{let st="ok";try{st=ovState(s.n)}catch(e){}const u=pdmUnit(s.n),m=perfM(s.n);P3.st[s.n]={st,health:u.health,level:u.level,av:m.k.av,bd:m.k.bd};
  const el=P3.labs&&P3.labs[s.n];if(el){const T={ok:"Running",alarm:"Alarm",trip:"Trip",upset:"Upset"}[st];el.querySelector(".p3st").className="p3st "+st;el.querySelector(".p3st").textContent=T;el.querySelector("small").innerHTML=`Health <b>${u.health}</b> | ${m.k.av.toFixed(2)}% available`}});
 const el=document.getElementById("p3card");if(el&&P3.sel)el.innerHTML=p3Card(P3.sel);else if(el&&P3.pipe)el.innerHTML=p3PipeCard(P3.pipe)}
/* ---------- interaction ---------- */
function p3Fly(n,open){const u=P3.units[n];P3.orbit=false;P3.sel=n;P3.focus=n;P3.pipe=null;P3.pend=open?n:0;P3.to={tx:u.x,ty:u.top*.45,tz:u.z,dist:Math.max(13,u.r*5.2),yaw:P3.cam.yaw,pit:.42};p3Panel()}
function p3Reset(){P3.sel=0;P3.focus=0;P3.pipe=null;P3.pend=0;P3.to={tx:0,ty:1.5,tz:0,dist:46,yaw:P3.cam.yaw,pit:.6};p3Panel()}
function p3Select(n,fly){if(fly)return p3Fly(n,P3.open);P3.sel=n;P3.focus=0;P3.pipe=null;P3.pend=0;P3.orbit=false;const u=P3.units[n];P3.to={tx:u.x,ty:2,tz:u.z,dist:Math.max(28,P3.cam.dist*.7),yaw:P3.cam.yaw,pit:P3.cam.pit};p3Panel()}
function p3Card(n){const s=S(n),a=P3.st[n]||{st:"ok"},T={ok:"Running",alarm:"Alarm",trip:"Trip active",upset:"Upset from a supply loss"}[a.st];
 return `<div class="row between"><div><span class="tag acc">${esc(s.tag)}</span> <span class="p3st ${a.st}">${T}</span></div><button class="ghost g3x" onclick="p3Reset()" aria-label="Back to the whole plant">Whole plant</button></div><h3 style="margin:8px 0 2px">${esc(s.name)}</h3><div class="muted" style="font-size:12px;margin-bottom:8px">Area ${s.area}, ${esc(s.unit)}</div>
 <div class="p3m"><div><b>${a.health??"n/a"}</b><span>Health index</span></div><div><b>${a.av!=null?a.av.toFixed(2)+"%":"n/a"}</b><span>Availability</span></div><div><b>${a.bd??"n/a"}</b><span>Breakdowns</span></div><div><b>${(a.level||"").toUpperCase()}</b><span>Forecast risk</span></div></div>
 <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px"><button onclick="go('equipment',{set:${n},tab:'overview'})">Open equipment set</button><button class="ghost" onclick="ovTrip(${n});p3State()">${typeof ovState_==="function"&&ovState_(n)?"Clear trip":"Simulate trip"}</button><button class="ghost" onclick="go('equipment',{set:${n},tab:'ga'})">Drawing and 3D</button></div>`}
function p3PipeCard(id){const r=P3.routes.find(x=>x.id===id);if(!r)return"";const base=r.base?P3.routes.find(x=>x.id===r.base):r,src=base.from?S(base.from).tag:"Header or tank",dst=base.to.map(t=>S(t).tag).join(", ");
 return `<div class="row between"><span class="tag" style="border-color:${(SVC[r.svc]||SVC.proc)[1]};color:${(SVC[r.svc]||SVC.proc)[1]}">${(SVC[r.svc]||SVC.proc)[0]}</span><button class="ghost g3x" onclick="p3Reset()">Close</button></div><h3 style="margin:8px 0 4px">${esc(r.lab)}</h3><p class="muted" style="font-size:12.5px;margin:0">From <b>${esc(src)}</b> to <b>${esc(dst)}</b>. Stream links are taken from the battery limit notes on the P&amp;IDs; routing in the rack is schematic.</p>`}
function p3Panel(){const el=document.getElementById("p3card");if(!el)return;el.style.display=(P3.sel||P3.pipe)?"":"none";el.innerHTML=P3.sel?p3Card(P3.sel):P3.pipe?p3PipeCard(P3.pipe):"";
 document.querySelectorAll(".p3chips button").forEach(b=>b.classList.toggle("on",+b.dataset.n===P3.sel));const live=document.getElementById("p3live");if(live)live.textContent=P3.sel?S(P3.sel).tag+" selected":""}
function p3Pick(x,y){const L=P3.list,pq=P3.pq,Q=P3.Q;if(!L||!pq)return null;
 for(let i=L.length-1;i>=0;i--){const e=L[i],f=e.f;if(!(f.u||f.pid)||e.skip)continue;const xs=e.xs,ys=e.ys;if(!xs)continue;let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;for(let k=0;k<xs.length;k++){if(xs[k]<mnx)mnx=xs[k];if(xs[k]>mxx)mxx=xs[k];if(ys[k]<mny)mny=ys[k];if(ys[k]>mxy)mxy=ys[k]}
  if(x<mnx||x>mxx||y<mny||y>mxy)continue;let c=false;for(let a=0,b=xs.length-1;a<xs.length;b=a++){if(((ys[a]>y)!==(ys[b]>y))&&(x<(xs[b]-xs[a])*(y-ys[a])/(ys[b]-ys[a])+xs[a]))c=!c}if(c)return{u:f.u,pid:f.pid}}return null}
function p3Init(root){if(root.dataset.ok)return;root.dataset.ok="1";p3Build();const cv=root.querySelector("canvas");P3.cv=cv;P3.last=0;P3.to=null;
 P3.labs={};const lay=root.querySelector(".p3labs");K.sets.forEach(s=>{const el=document.createElement("div");el.className="p3lab";el.setAttribute("role","button");el.setAttribute("tabindex","0");el.setAttribute("aria-label",s.tag+" "+s.name);el.innerHTML=`<b>${esc(s.tag)}</b><span class="p3st ok">Running</span><small></small>`;
  el.onclick=e=>p3Select(s.n,!e.shiftKey);el.onkeydown=e=>{if(e.key==="Enter")p3Select(s.n,!e.shiftKey)};lay.appendChild(el);P3.labs[s.n]=el});
 p3State();clearInterval(P3.timer);P3.timer=setInterval(()=>{if(!P3.cv||!P3.cv.isConnected)return clearInterval(P3.timer);p3State()},1000);
 const ptr=new Map();let down=null;
 cv.addEventListener("pointerdown",e=>{ptr.set(e.pointerId,[e.clientX,e.clientY]);try{cv.setPointerCapture(e.pointerId)}catch(_){}down={x:e.clientX,y:e.clientY,mv:0,pan:e.shiftKey||e.button===2};P3.drag=true;P3.orbit=false;if(P3.to&&!P3.pend){P3.to=null}if(P3.pend){P3.pend=0;P3.to=null}});
 cv.addEventListener("contextmenu",e=>e.preventDefault());
 cv.addEventListener("pointermove",e=>{const r=cv.getBoundingClientRect();const prev=ptr.get(e.pointerId);
  if(ptr.size===2&&prev){const o=[...ptr.entries()].find(([id])=>id!==e.pointerId)[1],d0=Math.hypot(prev[0]-o[0],prev[1]-o[1]),d1=Math.hypot(e.clientX-o[0],e.clientY-o[1]);if(d0>0)P3.cam.dist=Math.max(10,Math.min(150,P3.cam.dist*d0/d1));ptr.set(e.pointerId,[e.clientX,e.clientY]);return}
  if(prev)ptr.set(e.pointerId,[e.clientX,e.clientY]);
  if(down&&P3.drag&&prev){const dx=e.clientX-down.x,dy=e.clientY-down.y;down.mv+=Math.abs(dx)+Math.abs(dy);down.x=e.clientX;down.y=e.clientY;const cam=P3.cam;
   if(down.pan){const k=cam.dist/ (r.height*.95),cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw);cam.tx-=(dx*cy)*k;cam.tz-=(dx*sy)*k;cam.tx-= (dy*sy)*k*1.3;cam.tz+=(dy*cy)*k*1.3}
   else{cam.yaw+=dx*.006;cam.pit=Math.max(.08,Math.min(1.45,cam.pit+dy*.005))}}
  else{const now=performance.now();if(now-(P3.hv||0)>50){P3.hv=now;const h=p3Pick(e.clientX-r.left,e.clientY-r.top),n=h&&h.u?h.u:0;if(n!==P3.hover){P3.hover=n;cv.style.cursor=h?"pointer":"grab"}}}});
 const up=e=>{const r=cv.getBoundingClientRect();ptr.delete(e.pointerId);P3.drag=false;if(down&&down.mv<6&&!down.pan){const h=p3Pick(e.clientX-r.left,e.clientY-r.top);if(h&&h.u)p3Select(h.u,!e.shiftKey);else if(h&&h.pid){P3.pipe=h.pid;P3.sel=0;P3.focus=0;p3Panel()}else if(P3.sel||P3.pipe){p3Reset()}}down=null};
 cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",e=>{ptr.delete(e.pointerId);P3.drag=false;down=null});
 cv.addEventListener("wheel",e=>{e.preventDefault();P3.orbit=false;P3.to=null;P3.cam.dist=Math.max(10,Math.min(150,P3.cam.dist*(e.deltaY<0?.9:1.1)))},{passive:false});
 cv.addEventListener("dblclick",()=>p3Reset());
 root.querySelectorAll(".p3chips button[data-n]").forEach(b=>b.onclick=()=>p3Select(+b.dataset.n,true));
 const id=P3.loop=(P3.loop||0)+1,tick=now=>{if(id!==P3.loop)return;p3Frame(now,tick)};requestAnimationFrame(tick);p3Panel()}
function p3Scan(){const r=document.getElementById("p3");if(r&&!r.dataset.ok)p3Init(r)}
{let tm=null;new MutationObserver(()=>{if(!tm)tm=setTimeout(()=>{tm=null;p3Scan()},40)}).observe(document.body,{childList:true,subtree:true})}
function p3Hero(){return `<div class="card p3" id="p3" style="padding:0;overflow:hidden;margin-top:12px"><div class="p3head"><div><h2 style="margin:0">Plant in 3D</h2><div class="muted" style="font-size:12.5px;margin-top:2px">All eight units as laid out on the plot plan, joined by their process, gas, water, nitrogen and steam lines. Drag to look around. Select a unit to fly to it and open its equipment set.</div></div>
  <div class="p3tools"><label><input type="checkbox" id="p3o" ${P3.orbit?"checked":""} onchange="P3.orbit=this.checked">Slow turn</label><label><input type="checkbox" ${P3.labels?"checked":""} onchange="P3.labels=this.checked">Labels</label><label><input type="checkbox" ${P3.flow?"checked":""} onchange="P3.flow=this.checked">Flow</label><label><input type="checkbox" ${P3.motion?"checked":""} onchange="P3.motion=this.checked">Moving parts</label><label title="After the camera arrives, open the equipment set"><input type="checkbox" ${P3.open?"checked":""} onchange="P3.open=this.checked">Open set on arrival</label><button class="ghost" onclick="p3Reset()">Whole plant</button></div></div>
  <div class="p3chips" role="group" aria-label="Units">${K.sets.map(s=>`<button class="ghost" data-n="${s.n}">${esc(s.tag)}</button>`).join("")}</div>
  <div class="p3stage"><canvas aria-label="Interactive 3D model of the plant. Use the unit buttons above to move to a unit." style="width:100%;height:100%;display:block;touch-action:none;cursor:grab"></canvas><div class="p3labs"></div><div class="p3card" id="p3card" style="display:none"></div><div class="p3key"><span><i style="background:#3fb950"></i>Running</span><span><i style="background:#f0aa28"></i>Alarm or upset</span><span><i style="background:#e13c37"></i>Trip</span>${Object.entries(SVC).filter(e=>e[0]!=="sig").map(e=>`<span><u style="background:${e[1][1]}"></u>${e[1][0]}</span>`).join("")}</div></div><div id="p3live" class="sr" aria-live="polite"></div></div>`}
