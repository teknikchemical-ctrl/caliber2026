/* =====================================================================================================
   3D EQUIPMENT MODELS
   Every machine is assembled from rounded boxes, cylinders and ellipsoids that carry the same part numbers as the 2D drawing, so a click
   on a solid selects the same BOM item or nozzle and opens the same information. A small software renderer projects the solids to SVG
   (no external library, works offline) with smooth shading, highlights and a soft ground shadow. Drag to rotate, scroll to zoom,
   shift-drag to move, buttons for standard views, X-ray (shows internals) and fan motion.
   Wherever an equipment drawing is shown, gaFig() puts a 2D / 3D switch above it.
   ===================================================================================================== */
regMod("g3d","2.0",[],"3D equipment models");
const G3={cfg:{},inst:{},seq:0,mode:(()=>{try{return localStorage.getItem("akp_gmode")||"2d"}catch(e){return"2d"}})(),mesh:{}};
const g3c={steel:"#b4c0cf",body:"#d3dce7",dark:"#4d5b70",blue:"#4f86c9",gray:"#98a4b5",amber:"#e3a93b",brass:"#cfa84e",water:"#7fbbe6",red:"#cc5f58",green:"#6fb883",cat:"#8a6a4a",white:"#eef2f7",paint:"#c9d6e3",black:"#2d3646"};
const g3B=(k,x,y,z,w,h,d,c,o)=>Object.assign({t:"r",k,x,y,z,w,h,d,c},o),
 g3C=(k,ax,x,y,z,len,r,c,o,r2)=>Object.assign({t:"c",k,ax,x,y,z,len,r,r2:r2==null?r:r2,c},o),
 g3E=(k,ax,x,y,z,ra,rb,c,a0,a1,o)=>Object.assign({t:"e",k,ax,x,y,z,ra,rb,c,a0,a1},o);
/* moving parts: rotation about an axis through a point, or a sliding stroke along an axis */
function g3Anim(a,v,t){if(!a)return v;if(a.type==="slide"){const d=Math.sin(t*a.rate+(a.ph||0))*a.amp,i=a.ax==="x"?0:a.ax==="y"?1:2,r=v.slice();r[i]+=d;return r}
 const g=a.rate*t*Math.PI/180,c=Math.cos(g),s=Math.sin(g),p=[v[0]-a.at[0],v[1]-a.at[1],v[2]-a.at[2]];let q;
 if(a.ax==="y")q=[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];else if(a.ax==="x")q=[p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c];else q=[p[0]*c-p[1]*s,p[0]*s+p[1]*c,p[2]];
 return[q[0]+a.at[0],q[1]+a.at[1],q[2]+a.at[2]]}
function g3AnimN(a,n,t){if(!a||a.type==="slide")return n;const g=a.rate*t*Math.PI/180,c=Math.cos(g),s=Math.sin(g);
 if(a.ax==="y")return[n[0]*c+n[2]*s,n[1],-n[0]*s+n[2]*c];if(a.ax==="x")return[n[0],n[1]*c-n[2]*s,n[1]*s+n[2]*c];return[n[0]*c-n[1]*s,n[0]*s+n[1]*c,n[2]]}
const G3M={};
/* assemblies reused by several machines */
const g3Motor=(k,x,y,z,len,r,o)=>{const a=[g3C(k,"x",x,y,z,len,r,"blue",{m:.5}),g3C(k,"x",x+len/2+.05,y,z,.1,r*.92,"dark"),g3C(k,"x",x+len/2+.16,y,z,.14,r*.84,"steel",{},r*.9),
  g3B(k,x-len*.1,y+r+.09,z,.28,.18,.24,"steel",{r:.03}),g3B(k,x-len*.28,y-r*.7,z+r*.8,.34,.16,.1,"blue",{r:.02}),g3B(k,x-len*.28,y-r*.7,z-r*.8,.34,.16,.1,"blue",{r:.02}),
  g3B(k,x+len*.28,y-r*.7,z+r*.8,.34,.16,.1,"blue",{r:.02}),g3B(k,x+len*.28,y-r*.7,z-r*.8,.34,.16,.1,"blue",{r:.02}),g3C(k,"x",x-len/2-.03,y,z,.06,r*1.0,"dark")];
 for(let i=0;i<10;i++)a.push(g3C(k,"x",x-len/2+.1+i*(len-.25)/9,y,z,.025,r*1.06,"blue",{seg:28}));return a};
const g3Ladder=(x,y0,y1,z,ax)=>{const a=[],n=Math.floor((y1-y0)/.12);a.push(g3C("","y",x,(y0+y1)/2,z-.1,y1-y0,.012,"gray",{seg:8}),g3C("","y",x,(y0+y1)/2,z+.1,y1-y0,.012,"gray",{seg:8}));for(let i=0;i<n;i++)a.push(g3C("","z",x,y0+.08+i*.12,z,.2,.008,"gray",{seg:8}));return a};
/*@@CASE:g3m@@*/
/* ---------- geometry ---------- */
const g3Seg=p=>Math.max(8,Math.round((p.seg||(p.r&&p.r<.07||p.len&&p.len<.06?14:34))*(G3.q||1)));
function g3Parts(p){const F=[],C=g3Parse(p.c.charAt(0)==="#"?p.c:(g3c[p.c]||"#b4c0cf")),cen=[p.x,p.y,p.z],sm=p.t!=="r",mk=(pts,s,sc)=>F.push({p:pts,k:p.k,c:C,sh:p.sh,in:p.in,zb:p.zb||0,light:p.light,cen,anim:p.anim,m:p.m||.18,sm:s!==undefined?s:sm,sc:sc||0});
 if(p.t==="r"){const hx=p.w/2,hz=p.d/2,hy=p.h/2,rr=Math.min(p.r==null?Math.min(hx,hz)*.18:p.r,hx*.95,hz*.95),o=p.off||[0,0,0],prof=[];
  const cs=[[hx-rr,hz-rr,0],[-(hx-rr),hz-rr,1],[-(hx-rr),-(hz-rr),2],[hx-rr,-(hz-rr),3]],K=rr>.001?4:1;
  cs.forEach(([cx,cz,q])=>{for(let i=0;i<=K;i++){const a=(q+i/K)*Math.PI/2;prof.push([cx+(rr>.001?Math.cos(a)*rr:Math.sign(cx||1)*0),cz+(rr>.001?Math.sin(a)*rr:0)])}});
  if(rr<=.001){prof.length=0;prof.push([hx,hz],[-hx,hz],[-hx,-hz],[hx,-hz])}
  const tr=(x,y,z)=>{let q=[x+o[0],y+o[1],z+o[2]];if(p.ry){const a=p.ry*Math.PI/180,c=Math.cos(a),s=Math.sin(a);q=[q[0]*c+q[2]*s,q[1],-q[0]*s+q[2]*c]}return[q[0]+p.x,q[1]+p.y,q[2]+p.z]};
  for(let i=0;i<prof.length;i++){const a=prof[i],b=prof[(i+1)%prof.length];mk([tr(a[0],-hy,a[1]),tr(b[0],-hy,b[1]),tr(b[0],hy,b[1]),tr(a[0],hy,a[1])],rr>.001&&K>1,0)}
  mk(prof.map(a=>tr(a[0],hy,a[1])),false,1);mk(prof.slice().reverse().map(a=>tr(a[0],-hy,a[1])),false,1);return F}
 const N=g3Seg(p),ax=p.ax,mp=(a,u,v)=>ax==="x"?[a,u,v]:ax==="y"?[u,a,v]:[u,v,a],at=(v)=>[v[0]+p.x,v[1]+p.y,v[2]+p.z];
 if(p.t==="c"){const h=p.len/2;
  for(let i=0;i<N;i++){const t0=i/N*Math.PI*2,t1=(i+1)/N*Math.PI*2;mk([at(mp(-h,p.r*Math.cos(t0),p.r*Math.sin(t0))),at(mp(-h,p.r*Math.cos(t1),p.r*Math.sin(t1))),at(mp(h,p.r2*Math.cos(t1),p.r2*Math.sin(t1))),at(mp(h,p.r2*Math.cos(t0),p.r2*Math.sin(t0)))],true,0)}
  [[-h,p.r],[h,p.r2]].forEach(([a,r])=>{if(r<=0)return;const f=[];for(let i=0;i<N;i++){const t=i/N*Math.PI*2;f.push(at(mp(a,r*Math.cos(t),r*Math.sin(t))))}mk(f,false,1)});return F}
 const LA=Math.max(6,Math.round(N/3)),LO=N,P=(a,t)=>at(mp(p.ra*Math.cos(a),p.rb*Math.sin(a)*Math.cos(t),p.rb*Math.sin(a)*Math.sin(t)));
 for(let i=0;i<LA;i++){const a0=p.a0+(p.a1-p.a0)*i/LA,a1=p.a0+(p.a1-p.a0)*(i+1)/LA;for(let j=0;j<LO;j++){const t0=j/LO*Math.PI*2,t1=(j+1)/LO*Math.PI*2;mk([P(a0,t0),P(a0,t1),P(a1,t1),P(a1,t0)],true,0)}}
 return F}
function g3Parse(h){const m=/^#?([0-9a-f]{6})$/i.exec(h||"");if(m){const n=parseInt(m[1],16);return[n>>16,(n>>8)&255,n&255]}const r=/rgba?\(([^)]+)\)/.exec(h||"");if(r){const q=r[1].split(",").map(Number);return[q[0],q[1],q[2],q[3]]}return[169,184,201]}
/* flanges with bolt heads on every nozzle, added at the free end */
function g3Extra(prims){const c=[0,0,0];prims.forEach(p=>{c[0]+=p.x;c[1]+=p.y;c[2]+=p.z});c[0]/=prims.length;c[1]/=prims.length;c[2]/=prims.length;const out=[];
 prims.forEach(p=>{if(p.t!=="c"||p.r2!==p.r||!/^(N\d|M\d)$/.test(p.k)||p.len<.12)return;const ax=p.ax,idx=ax==="x"?0:ax==="y"?1:2,pos=[p.x,p.y,p.z],sgn=(pos[idx]-c[idx])>=0?1:-1,end=pos.slice();end[idx]+=sgn*p.len/2;
  const fr=p.r*1.55,th=Math.max(.03,p.r*.4);const e2=end.slice();e2[idx]-=sgn*th/2;out.push(g3C(p.k,ax,e2[0],e2[1],e2[2],th,fr,"steel",{m:.7,seg:p.r<.06?14:30}));
  const nb=p.r<.06?4:8;for(let i=0;i<nb;i++){const t=i/nb*Math.PI*2,u=Math.cos(t)*fr*.78,v=Math.sin(t)*fr*.78,e3=end.slice();e3[idx]+=sgn*.004;const m=ax==="x"?[e3[0],e3[1]+u,e3[2]+v]:ax==="y"?[e3[0]+u,e3[1],e3[2]+v]:[e3[0]+u,e3[1]+v,e3[2]];out.push(g3C(p.k,ax,m[0],m[1],m[2],.025,p.r*.16,"dark",{seg:8,m:.6}))}});return out}
/* outward normal and centre of a face of primitive p */
function g3Orient(p,f){const q=f.p,u=[q[1][0]-q[0][0],q[1][1]-q[0][1],q[1][2]-q[0][2]],v=[q[2][0]-q[0][0],q[2][1]-q[0][1],q[2][2]-q[0][2]];
  let nm=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...nm)||1;nm=nm.map(x=>x/l);
  const c=[0,1,2].map(i=>q.reduce((a,b)=>a+b[i],0)/q.length);let off=f.cen;if(p.t==="r"&&p.off){const a=(p.ry||0)*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a);off=[f.cen[0]+p.off[0]*cs+p.off[2]*sn,f.cen[1]+p.off[1],f.cen[2]-p.off[0]*sn+p.off[2]*cs]}
  if(p.t==="c"){const ai=p.ax==="x"?0:p.ax==="y"?1:2,rel=[c[0]-f.cen[0],c[1]-f.cen[1],c[2]-f.cen[2]];if(f.sc===0)rel[ai]=0;off=[c[0]-rel[0],c[1]-rel[1],c[2]-rel[2]]}
  const d=(c[0]-off[0])*nm[0]+(c[1]-off[1])*nm[1]+(c[2]-off[2])*nm[2];if(d<0)nm=nm.map(x=>-x);f.n=nm;f.mid=c}

/* Every part must touch the rest of the machine. Surface points of each solid are compared; a group that touches nothing
   gets a short neck or bracket to the nearest surface, so nothing hangs in the air. */
function g3BridgeCalc(prims){const H=.05,pts=[],owner=[];
 prims.forEach((p,pi)=>{g3Parts(p).forEach(f=>{const q=f.p;for(let i=1;i<q.length-1;i++){const a=q[0],b=q[i],c=q[i+1],e=Math.max(Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),Math.hypot(c[0]-b[0],c[1]-b[1],c[2]-b[2]),Math.hypot(a[0]-c[0],a[1]-c[1],a[2]-c[2])),m=Math.min(24,Math.max(1,Math.ceil(e/.05)));
   for(let u=0;u<=m;u++)for(let v=0;v<=m-u;v++){const wa=u/m,wb=v/m,wc=1-wa-wb;pts.push(a[0]*wc+b[0]*wa+c[0]*wb,a[1]*wc+b[1]*wa+c[1]*wb,a[2]*wc+b[2]*wa+c[2]*wb);owner.push(pi)}}})});
 const N=owner.length,par=prims.map((_,i)=>i),find=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x]}return x},grid=new Map(),key=(x,y,z)=>(((x+512)&1023)*1048576)+(((y+512)&1023)<<10)+((z+512)&1023),T=.046;
 for(let i=0;i<N;i++){const qx=pts[i*3],qy=pts[i*3+1],qz=pts[i*3+2],cx=Math.floor(qx/H),cy=Math.floor(qy/H),cz=Math.floor(qz/H),oi=owner[i];
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const L=grid.get(key(cx+dx,cy+dy,cz+dz));if(L)for(let j=0;j<L.length;j++){const o=L[j];if(owner[o]!==oi&&Math.abs(pts[o*3]-qx)<T&&Math.abs(pts[o*3+1]-qy)<T&&Math.abs(pts[o*3+2]-qz)<T){const a=find(owner[o]),b=find(oi);if(a!==b)par[a]=b}}}
  const k0=key(cx,cy,cz);let L=grid.get(k0);if(!L)grid.set(k0,L=[]);L.push(i)}
 const comps={};prims.forEach((p,i)=>{(comps[find(i)]=comps[find(i)]||[]).push(i)});const cl=Object.values(comps);if(cl.length<2)return[];
 const vol=p=>p.t==="r"?p.w*p.h*p.d:p.t==="c"?p.len*p.r*p.r*3:p.ra*p.rb*p.rb*3,size=c=>c.reduce((a,i)=>a+vol(prims[i]),0);
 cl.sort((a,b)=>size(b)-size(a));const cid={};cl.forEach((c,ci)=>c.forEach(i=>cid[i]=ci));
 const cp=cl.map(()=>[]),cmin=cl.map(()=>1e9);let gmin=1e9;
 for(let i=0;i<N;i++){const c=cid[owner[i]];cp[c].push(i);const y=pts[i*3+1];if(y<cmin[c])cmin[c]=y;if(y<gmin)gmin=y}
 const sample=(arr,m)=>{const st=Math.max(1,Math.floor(arr.length/m)),r=[];for(let i=0;i<arr.length;i+=st)r.push(arr[i]);return r};
 let done=sample(cp[0],2500);const out=[];let rest=[];for(let c=1;c<cl.length;c++)if(cmin[c]>=gmin+.06)rest.push(c);
 while(rest.length){let best=null;
  rest.forEach(c=>{const A=sample(cp[c],200);for(let i=0;i<A.length;i++){const a=A[i],ax=pts[a*3],ay=pts[a*3+1],az=pts[a*3+2];for(let j=0;j<done.length;j++){const b=done[j],dx=ax-pts[b*3],dy=ay-pts[b*3+1],dz=az-pts[b*3+2],dd=dx*dx+dy*dy+dz*dz;if(!best||dd<best.d)best={d:dd,a,b,c}}}});
  if(!best)break;
  const a=best.a,b=best.b,P=[pts[a*3],pts[a*3+1],pts[a*3+2]],Q=[pts[b*3],pts[b*3+1],pts[b*3+2]],dl=[Q[0]-P[0],Q[1]-P[1],Q[2]-P[2]],ax=Math.abs(dl[0])>=Math.abs(dl[1])&&Math.abs(dl[0])>=Math.abs(dl[2])?0:Math.abs(dl[1])>=Math.abs(dl[2])?1:2,len=Math.abs(dl[ax]);
  if(len>.02){const kk=prims[cl[best.c][0]].k||"",m=[(P[0]+Q[0])/2,(P[1]+Q[1])/2,(P[2]+Q[2])/2],r=Math.min(.035,Math.max(.018,Math.sqrt(best.d)*.1));out.push(g3C(kk,["x","y","z"][ax],m[0],m[1],m[2],len+.03,r,"steel",{seg:10,m:.5,br:1}))}
  done=done.concat(sample(cp[best.c],600));rest=rest.filter(c=>c!==best.c)}
 return out}
function g3Mesh(n,q){const key=n+(q?"q"+q:"");if(G3.mesh[key])return G3.mesh[key];const q0=G3.q;G3.q=q||1;try{let prims=(G3M[n]||[]).concat(g3Extra(G3M[n]||[])),faces=[];if(typeof G3NECK!=="undefined"&&G3NECK[n])prims=prims.concat(G3NECK[n].map(a=>g3C(a[0],a[1],a[2],a[3],a[4],a[5],a[6],"steel",{seg:10,m:.5,br:1})));
 prims.forEach((p,pi)=>{g3Parts(p).forEach(f=>{g3Orient(p,f);f.pi=pi;faces.push(f)})});
 let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];faces.forEach(f=>f.p.forEach(v=>{for(let i=0;i<3;i++){mn[i]=Math.min(mn[i],v[i]);mx[i]=Math.max(mx[i],v[i])}}));
 const ctr=[(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2],Rs=Math.hypot(...[0,1,2].map(i=>(mx[i]-mn[i])/2)),hz=Math.hypot((mx[0]-mn[0])/2,(mx[2]-mn[2])/2),Rf=Math.max((mx[1]-mn[1])/2*1.12+hz*.3,hz*.8);
 return G3.mesh[key]={faces,ctr,R:Rs,Rf,ymin:mn[1],mn,mx}}finally{G3.q=q0}}
function g3Info(n,k){if(!k)return"";const nz=GA[n]&&GA[n].nz.find(q=>q.m===k),b=nz?null:gBom(n,k),s=S(n);if(!nz&&!b)return"";
 const wo=MH.filter(m=>m.n===n&&mhParts(m).includes(k)),V=nz?null:gVal(n,k),rows=nz?[["Nozzle",k],["Service",nz.sv],["Size and rating",nz.sz],["Remarks",nz.r]]:[["Item",k==="M"?"Driver":k],["Material",b.mat],["Quantity",b.qty],["Drawing",s.ga.dwg_no]];
 let live="";if(V&&G.cond!==false){const st0=gState(V.m,V.v),cl=st0==="ok"?"ok":st0==="warn"?"warn":"bad";live=`<div class="g3live"><span class="tag ${cl}">${st0==="ok"?"Normal":st0==="warn"?"Alarm":"Trip"}</span> <b>${V.v.toFixed(V.m[3]<5?1:0)} ${V.m[2]}</b> <span class="muted">${esc(V.m[1])}</span></div>`}
 return `<div class="g3card"><div class="row between"><b>${esc(nz?k+" | "+nz.sv:(k==="M"?"":k+" | ")+b.name)}</b><button class="ghost g3x" onclick="G3.pin=null;this.closest('.g3card').remove()" aria-label="Close">x</button></div>${rows.map(r=>`<div class="g3r"><span>${esc(r[0])}</span><b>${esc(String(r[1]??"n/a"))}</b></div>`).join("")}${live}<div class="g3r"><span>Work orders</span><b>${wo.length}</b></div>${wo.length?`<div class="muted" style="font-size:11.5px;margin-top:2px">Latest ${esc(wo[wo.length-1].wo)}, ${esc((wo[wo.length-1].prob||"").slice(0,58))}</div>`:""}<div class="row" style="gap:6px;margin-top:8px"><button class="ghost" style="padding:2px 9px;font-size:12px" onclick="go('equipment',{set:${n},tab:'ga'});setTimeout(()=>gSel('${k}'),80)">Open in drawing</button><button class="ghost" style="padding:2px 9px;font-size:12px" onclick="go('mnt');MHS.set=${n};setTimeout(()=>mhPartFilter('${k}'),80)">Work orders</button></div></div>`}
function g3Name(n,k){const nz=GA[n]&&GA[n].nz.find(q=>q.m===k);if(nz)return k+" | "+nz.sv;const b=gBom(n,k);return b?(k==="M"?"":k+" | ")+b.name:k}
/* centre and size of one part (all solids that carry its number) */
function g3KeyC(n,k){const M=g3Mesh(n);M.kc=M.kc||{};if(M.kc[k])return M.kc[k];let fs=M.faces.filter(f=>f.k===k&&!f.in),inner=false;if(!fs.length){fs=M.faces.filter(f=>f.k===k);inner=true}if(!fs.length)return null;
 const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];fs.forEach(f=>f.p.forEach(v=>{for(let i=0;i<3;i++){mn[i]=Math.min(mn[i],v[i]);mx[i]=Math.max(mx[i],v[i])}}));
 return M.kc[k]={inner,c:[(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2],r:Math.max(mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2])/2}}
const g3Cl=(v,a,b)=>v<a?a:v>b?b:v;
function g3Init(box){const id=box.id,o=G3.cfg[id];if(!o)return;box.setAttribute("data-ok","1");const mini=!!box.dataset.mini;
 box.innerHTML=(mini?"":`<div class="g3bar"><button class="ghost" data-v="iso">Isometric</button><button class="ghost" data-v="front">Front</button><button class="ghost" data-v="side">Side</button><button class="ghost" data-v="top">Top</button><button class="ghost" data-t="spin">Auto-rotate</button><button class="ghost" data-t="xray">X-ray</button>${(G3M[o.n]||[]).some(p=>p.anim)?'<button class="ghost on" data-t="run">Moving parts</button>':""}<button class="ghost" data-v="reset">Reset</button></div>`)+
 `<div class="g3stage"><canvas class="g3cv" width="900" height="500"></canvas><svg viewBox="0 0 900 500" class="g3svg" role="img" aria-label="3D model of ${esc(S(o.n).tag)}"><defs><filter id="g3b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter><filter id="g3glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="g3bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f9fc"/><stop offset="1" stop-color="#e4eaf2"/></linearGradient></defs><g class="g3s"></g></svg><div class="g3fxb"></div><div class="g3side"></div></div>${mini?"":'<div class="g3cap muted"></div>'}`;
 const I=G3.inst[id]={mini:mini,vis:true,qs:1,yaw:-.62,pit:.34,zoom:mini?1.05:1,px:0,py:0,spin:mini,xray:false,run:true,t:0,drag:null,hover:null,dirty:true,last:performance.now(),pin:null,cardKey:undefined};
 const svg=box.querySelector("svg"),dirty=()=>{I.dirty=true;I.lastMove=performance.now()},views={iso:[-.62,.34],front:[0,0],side:[-Math.PI/2,0],top:[0,Math.PI/2-.001]};
 box.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{const v=b.dataset.v;if(v==="reset"){I.yaw=-.62;I.pit=.34;I.zoom=1;I.px=I.py=0;I.userMoved=false}else{I.yaw=views[v][0];I.pit=views[v][1]}dirty()});
 box.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{const k=b.dataset.t;if(k==="spin")I.spin=!I.spin;else if(k==="xray")I.xray=!I.xray;else I.run=!I.run;b.classList.toggle("on",k==="spin"?I.spin:k==="xray"?I.xray:I.run);dirty()});
 const keyAt=e=>{const r=svg.getBoundingClientRect();return g3PickAt(I,(e.clientX-r.left)/r.width*900,(e.clientY-r.top)/r.height*500)};
 svg.addEventListener("pointerdown",e=>{I.drag={x:e.clientX,y:e.clientY,mv:0,pan:e.shiftKey||e.button===2};try{svg.setPointerCapture(e.pointerId)}catch(_){}});
 svg.addEventListener("contextmenu",e=>e.preventDefault());
 svg.addEventListener("pointermove",e=>{const d=I.drag;if(d){const dx=e.clientX-d.x,dy=e.clientY-d.y;d.mv+=Math.abs(dx)+Math.abs(dy);d.x=e.clientX;d.y=e.clientY;
   if(d.pan){const r=svg.getBoundingClientRect(),k=900/r.width;I.px+=dx*k;I.py+=dy*k;I.userMoved=true}else{I.yaw+=dx*.008;I.pit=Math.max(-1.5,Math.min(1.5,I.pit+dy*.006))}if(d.mv>5)I.spin=I.spin&&mini?false:I.spin;dirty()}
  else{const k=keyAt(e),cap=box.querySelector(".g3cap");if(k!==I.hover){I.hover=k||null;I.dirty=true;if(cap)cap.textContent=k?g3Name(o.n,k):(I.pin||(o.sel&&o.sel())?g3Name(o.n,I.pin||o.sel()):"Drag to rotate, scroll to zoom, select a part for its details");svg.style.cursor=k?"pointer":"grab"}}});
 svg.addEventListener("pointerup",e=>{const d=I.drag;I.drag=null;if(d&&d.mv<6&&!d.pan){const k=keyAt(e);if(mini){if(k)go("equipment",{set:o.n,tab:"ga"});return}
   I.pin=k&&k!==I.pin?k:null;if(k&&o.click){try{(typeof o.click==="function"?o.click:window[o.click])(k)}catch(_){}}else if(!k&&o.click&&o.sel&&o.sel()){}dirty()}});
 svg.addEventListener("wheel",e=>{if(mini)return;e.preventDefault();I.userMoved=true;I.zoom=Math.max(.5,Math.min(3.5,I.zoom*(e.deltaY<0?1.1:.9)));dirty()},{passive:false});
 svg.addEventListener("dblclick",()=>{I.zoom=1;I.px=I.py=0;I.userMoved=false;I.pin=null;dirty()});
 try{if(window.IntersectionObserver){const io=new IntersectionObserver(es=>{es.forEach(e=>{I.vis=e.isIntersecting;if(e.isIntersecting)I.dirty=true})});io.observe(box);I.io=io}}catch(e){}
 g3Draw(id)}
function g3Scan(){document.querySelectorAll(".g3box:not([data-ok])").forEach(b=>{if(!b.hidden&&!b.closest("[hidden]"))g3Init(b)});
 const keep=new Set([...document.querySelectorAll(".g3box")].map(b=>b.id));Object.keys(G3.inst).forEach(id=>{if(!keep.has(id)){delete G3.inst[id];delete G3.cfg[id]}})}
function g3Loop(now){requestAnimationFrame(g3Loop);if(document.hidden)return;Object.keys(G3.inst).forEach(id=>{const I=G3.inst[id],box=document.getElementById(id);if(!box||box.hidden||box.closest("[hidden]"))return;const gap=I.drag?14:Math.max(I.mini?70:40,(I.ms||15)*2.4);if(now-(I.drawn||0)<gap)return;if(I.vis===false)return;const dt=Math.min(.1,(now-I.last)/1000);I.last=now;
  I.clock=(I.clock||0)+dt;const fo=G3.cfg[id].fx&&G3.cfg[id].fx();if(fo)I.dirty=true;if(I.spin&&!I.drag){I.yaw+=dt*.45;I.dirty=true}if(I.run&&!(fo&&fo.state==='trip')&&(G3M[G3.cfg[id].n]||[]).some(p=>p.anim)){I.t+=dt;I.dirty=true}
  const sel=I.pin||(G3.cfg[id].sel?G3.cfg[id].sel():null);if(sel!==I.lastSel){I.lastSel=sel;I.dirty=true}
  if(I.needHi&&now-(I.lastMove||0)>320&&!I.drag&&!I.spin&&!((G3M[G3.cfg[id].n]||[]).some(p=>p.anim)&&I.run)){I.needHi=false;I.dirty=true}
  if(I.dirty||now-(I.lt||0)>1500){I.dirty=false;I.lt=now;I.drawn=now;g3Draw(id)}})}
requestAnimationFrame(g3Loop);
{let tm=null;new MutationObserver(()=>{if(!tm)tm=setTimeout(()=>{tm=null;g3Scan()},40)}).observe(document.body,{childList:true,subtree:true})}
function g3Mode(m){G3.mode=m;try{localStorage.setItem("akp_gmode",m)}catch(e){}
 document.querySelectorAll(".gfig").forEach(f=>{const b=f.querySelector(".g3box"),t=f.querySelector(".g2");if(b)b.hidden=m!=="3d";if(t)t.hidden=m==="3d";f.querySelectorAll(".gtog button").forEach(x=>x.classList.toggle("on",x.dataset.m===m))});g3Scan()}
/* one switchable figure: svg2d is the existing drawing, o carries sel(), hl[], heat{}, tint(k) and click(k) for the 3D view */
function gaFig(n,svg2d,o){const id="g3_"+(++G3.seq);G3.cfg[id]=Object.assign({n},o||{});const m=G3.mode;
 return `<div class="gfig"><div class="gtog" role="group" aria-label="Drawing view"><button data-m="2d" class="${m==="2d"?"on":""}" onclick="g3Mode('2d')">2D drawing</button><button data-m="3d" class="${m==="3d"?"on":""}" onclick="g3Mode('3d')">${(o&&o.lab3)||"3D model"}</button></div><div class="g2" ${m==="3d"?"hidden":""}>${svg2d}</div><div class="g3box" id="${id}" ${m==="3d"?"":"hidden"}></div></div>`}
/* a small turning model for headers; a click opens the drawing */
function g3Mini(n){const id="g3_"+(++G3.seq);G3.cfg[id]={n};return `<div class="g3box g3mini" id="${id}" data-mini="1" title="Open the equipment drawing"></div>`}
