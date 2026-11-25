/* ================= Drawing: buildings ================= */
function door(x0,x1,y,z0,z1){pp([P(x0,y,z0),P(x1,y,z0),P(x1,y,z1),P(x0,y,z1)],'#2e1b0d')}
function dLonghouse(b){const x=b.x+.3,y=b.y+.45,w=2.4,h=2.1;
  box(x-.08,y-.08,w+.16,h+.16,0,3,shade(C.stone,.05),shade(C.stone,-.3),shade(C.stone,-.12));
  box(x,y,w,h,3,15,null,shade(C.wood,-.3),C.wood);
  for(let t=.22;t<w;t+=.22)ln(P(x+t,y+h,3),P(x+t,y+h,18),'rgba(0,0,0,.16)',1);
  for(let t=.22;t<h;t+=.22)ln(P(x+w,y+t,3),P(x+w,y+t,18),'rgba(0,0,0,.12)',1);
  door(x+w/2-.22,x+w/2+.22,y+h,3,13);
  for(const[t,c]of[[.45,'#b5352c'],[w-.45,'#2f5fa8']]){const q=P(x+t,y+h,10);ell(q[0],q[1],3.4,3.4,c);ell(q[0],q[1],1.1,1.1,'#d9c27a')}
  roofX(x,y,w,h,18,24,roofCol(),true);
  const pb=P(x+w+.35,y+h+.2,0),pt=P(x+w+.35,y+h+.2,40);ln(pb,pt,C.woodD,2);flag(pt[0]+1,pt[1]+1)}
// Barraca: tenda de couro em duas águas, aberta na frente
function dBarraca(b){const x=b.x+.25,y=b.y+.3,w=1.5,h=1.35,H=26,couro=BIO.snowy?'#cfc4b2':'#b08a5c';
  const r0=P(x,y+h/2,H),r1=P(x+w,y+h/2,H);
  pp([P(x,y),P(x+w,y),r1,r0],shade(couro,-.18));
  pp([P(x+w,y),P(x+w,y+h),r1],shade(couro,-.28));
  pp([P(x+w,y+h/2-.24),P(x+w,y+h/2+.24),P(x+w,y+h/2,H*.62)],'#2e1b0d');
  pp([P(x,y+h),P(x+w,y+h),r1,r0],shade(couro,.1));
  for(const t of[.25,.5,.75])ln(lp(P(x,y+h),P(x+w,y+h),t),lp(r0,r1,t),shade(couro,-.2),1);
  ln(r0,r1,C.woodD,2.2);
  for(const q of[r0,r1])for(const d of[-1,1])ln(q,[q[0]+d*4,q[1]-6],C.woodD,1.8);
  for(const[px,py]of[[x,y+h],[x+w,y+h]]){const a=P(px,py),c=P(px,py+.18);ln(a,c,C.woodD,1.4)}}
function dHouse(b){const x=b.x+.3,y=b.y+.3,w=1.4,h=1.4;
  box(x-.05,y-.05,w+.1,h+.1,0,2,null,shade(C.stone,-.3),shade(C.stone,-.1));
  box(x,y,w,h,2,12,null,shade(C.wood,-.3),C.wood);
  for(let t=.2;t<w;t+=.2)ln(P(x+t,y+h,2),P(x+t,y+h,14),'rgba(0,0,0,.15)',1);
  door(x+.45,x+.85,y+h,2,11);
  pp([P(x+w,y+.5,6),P(x+w,y+.85,6),P(x+w,y+.85,10),P(x+w,y+.5,10)],darkness()>.15?'#ffb54a':'#2e1b0d');
  roofY(x,y,w,h,14,18,roofCol(),true)}
function dShelter(b){const x=b.x+.25,y=b.y+.2,w=1.5,h=1.15,H=15,tw=C.twig;
  const fur=P(x+.75,y+.55,0);ell(fur[0],fur[1],13,5,'#8a6a4a');ell(fur[0]-2,fur[1]-1,8,3,'#a5835e');
  for(const px of[x+.05,x+w-.05])ln(P(px,y+h,0),P(px,y+h,H),C.woodD,2.6);
  const r=[P(x-.1,y-.05,0),P(x+w+.1,y-.05,0),P(x+w+.1,y+h+.15,H),P(x-.1,y+h+.15,H)];
  pp([P(x+w+.05,y,0),P(x+w+.05,y+h,H),P(x+w+.05,y+h,0)],shade(tw,-.1));
  for(let t=0;t<1;t+=.16)ln(lp(P(x+w+.05,y,0),P(x+w+.05,y+h,0),t),lp(P(x+w+.05,y,0),P(x+w+.05,y+h,H),t),shade(tw,-.35),1);
  pp(r,BIO.snowy?'#dfe6ec':shade(tw,.12));
  for(let t=.06;t<1;t+=.09)ln(lp(r[0],r[1],t),lp(r[3],r[2],t),BIO.snowy?'rgba(120,90,60,.35)':shade(tw,-.25),1.3);
  ln(r[3],r[2],C.woodD,2.4);
  const f=P(b.x+1.2,b.y+1.75,0);for(let k=0;k<7;k++){const a=k/7*6.283;ell(f[0]+Math.cos(a)*6,f[1]+Math.sin(a)*3,2,1.3,k%2?'#8a8680':'#a5a19a')}flame(f[0],f[1]-1,.75)}
function dLumber(b){const x=b.x,y=b.y;
  box(x+.95,y+.2,.85,.85,0,10,null,shade(C.wood,-.3),C.wood);roofX(x+.95,y+.2,.85,.85,10,10,roofCol(),false);
  const q=P(x+.65,y+1.55,0);ell(q[0]+2,q[1]+1,14,4,'rgba(0,0,0,.18)');
  for(let r=0;r<3;r++)for(let i=0;i<3-r;i++){const X=q[0]-8+i*7.5+r*3.7,Y=q[1]-3.5-r*6.4;ell(X,Y,3.8,3.8,'#6e4322');ell(X,Y,2.8,2.8,'#d1a06a');ell(X,Y,1,1,'#9a6a3a')}
  const s=P(x+1.55,y+1.5,0);stump(s[0],s[1],1.1);ln([s[0]+1,s[1]-5],[s[0]+6,s[1]-15],'#6b4423',1.8);pp([[s[0]+.5,s[1]-6],[s[0]-3,s[1]-9],[s[0]+3,s[1]-8]],'#c9ced3')}
function dQuarry(b){const x=b.x,y=b.y,st=BIO.snowy?'#a9aaa8':C.stone;
  box(x+1.1,y+.15,.75,.75,0,9,null,shade(C.wood,-.3),C.wood);roofY(x+1.1,y+.15,.75,.75,9,9,roofCol(),false);
  box(x+.15,y+.3,.6,.55,0,6,shade(st,.15),shade(st,-.3),shade(st,-.1));box(x+.22,y+.38,.42,.38,6,5,shade(st,.2),shade(st,-.28),shade(st,-.08));
  box(x+.25,y+1.25,.5,.45,0,5,shade(st,.15),shade(st,-.3),shade(st,-.1));box(x+1.2,y+1.3,.45,.45,0,4,shade(st,.1),shade(st,-.3),shade(st,-.1));
  const ap=P(x+1,y+1,30);for(const[px,py]of[[x+.75,y+.75],[x+1.3,y+.9],[x+.9,y+1.3]])ln(P(px,py,0),ap,C.woodD,2);
  ln(ap,P(x+.6,y+1.05,30),C.woodD,2);ln(P(x+.6,y+1.05,30),P(x+.6,y+1.05,14),'#3a2a1a',1);box(x+.5,y+.95,.2,.2,10,4,shade(st,.2),shade(st,-.3),st)}
function dFarmFlat(b,p){const x=b.x+.08,y=b.y+.08,w=b.w-.16,h=b.h-.16,soil=BIO.snowy?'#8a7562':'#7b5a35';const hh=h*Math.min(1,p);
  pp([P(x,y),P(x+w,y),P(x+w,y+hh),P(x,y+hh)],soil);for(let t=.25;t<hh;t+=.28)ln(P(x+.05,y+t),P(x+w-.05,y+t),shade(soil,-.25),1.3)}
// 4 estágios visíveis: terra (sementes), broto, planta, madura (com brilho)
function estagio(g){return g>=1?3:g>=.55?2:g>=.15?1:0}
function dPlanta(pl,x,y,q){const K=CAMPO.culturas[pl.c],e=estagio(pl.g);
  if(e===3){const c=P(x+.5,y+.5,0),a=.28+.16*Math.sin(perfT*3+q);ell(c[0],c[1]-3,17,9,`rgba(255,228,110,${a})`)}
  for(let k=0;k<5;k++){const q0=P(x+.2+k*.15,y+.3+(k%2)*.4,0),X=q0[0],Y=q0[1],j=hash2(q,k)*1.5;
    if(e===0)ell(X,Y,1.5,.9,'#e6d3a0');
    else if(e===1){ln(q0,[X,Y-3-j],K.cor_broto,1.2);ell(X-1.8,Y-3.5-j,2,1.1,K.cor_broto);ell(X+1.8,Y-3.5-j,2,1.1,K.cor_broto)}
    else{const h=(e===3?10:8)+j,col=e===3&&pl.c==='cevada'?K.cor_madura:K.cor_planta;ln(q0,[X,Y-h],col,1.5);ln([X,Y-h*.4],[X-3,Y-h*.65],col,1.2);ln([X,Y-h*.55],[X+3,Y-h*.8],col,1.2);
      if(e===3){if(pl.c==='cevada')ell(X,Y-h-1.5,1.6,3,K.cor_madura);else if(pl.c==='nabo'){ell(X,Y-1,3,2.4,K.cor_madura);ell(X,Y+.3,1.8,1.2,'#f4eef4')}else ell(X,Y-h-1,2.4,2,K.cor_madura)}}}
  if(e===3&&Math.sin(perfT*4+q*1.7)>.8){const c=P(x+.35+hash2(q,3)*.3,y+.4,0);ln([c[0]-3,c[1]-14],[c[0]+3,c[1]-14],'#fffbe0',1.1);ln([c[0],c[1]-17],[c[0],c[1]-11],'#fffbe0',1.1)}}
function dFarm(b,p){if(p<1)return;
  for(let q=0;q<9;q++){const pl=b.canteiros&&b.canteiros[q];const x=b.x+q%3,y=b.y+((q/3)|0);
    const soil=!pl||pl.st===0?'#7b5a35':pl.st===1?'#5e4125':'#6a4a2b';
    pp([P(x+.06,y+.06),P(x+.94,y+.06),P(x+.94,y+.94),P(x+.06,y+.94)],soil);
    if(pl&&pl.st===1)for(let t=.2;t<1;t+=.27)ln(P(x+.1,y+t),P(x+.9,y+t),'rgba(30,18,8,.45)',1.2);
    if(pl&&pl.st===2)dPlanta(pl,x,y,q)}
  const s=P(b.x+1.5,b.y+1.5,0);ln(s,[s[0],s[1]-20],C.woodD,1.8);ln([s[0]-6,s[1]-15],[s[0]+6,s[1]-15],C.woodD,1.6);ctx.fillStyle='#8c6d3f';ctx.fillRect(s[0]-2.5,s[1]-17,5,7);ell(s[0],s[1]-19,2.4,2.4,'#d9b44a');pp([[s[0]-4,s[1]-20],[s[0]+4,s[1]-20],[s[0],s[1]-25]],'#5a3a22');
  for(const[cx,cy]of[[b.x,b.y],[b.x+3,b.y],[b.x,b.y+3],[b.x+3,b.y+3]])stake(P(cx,cy,0),8,C.woodL)}
// cercado: chão, estacas em volta e um monte de feno
function dPen(b,p){if(p<1)return;const x=b.x,y=b.y;
  pp([P(x+.05,y+.05),P(x+2.95,y+.05),P(x+2.95,y+2.95),P(x+.05,y+2.95)],'#8a7a4a');
  for(const[a,c]of[[P(x,y,7),P(x+3,y,7)],[P(x+3,y,7),P(x+3,y+3,7)],[P(x+3,y+3,7),P(x,y+3,7)],[P(x,y+3,7),P(x,y,7)]])ln(a,c,C.woodL,2);
  for(let t=0;t<=3;t+=1)for(const[cx,cy]of[[x+t,y],[x+t,y+3],[x,y+t],[x+3,y+t]])stake(P(cx,cy,0),9,C.woodL);
  const f=P(x+2.4,y+2.4,0);ell(f[0],f[1]-1,6,2.5,'#d9b44a');ell(f[0],f[1]-3,4,1.6,'#e8c96a')}
function dDock(b,p){const x=b.x+.1,y=b.y+.1,w=1.8,h=1.8;
  for(const[px,py]of[[x,y],[x+w,y],[x,y+h],[x+w,y+h],[x+w/2,y+h],[x+w,y+h/2]])ln(P(px,py,-5),P(px,py,6),C.woodD,2.6);
  if(p>.35){const hh=h*Math.min(1,(p-.35)/.65);box(x,y,w,hh,2,2.5,C.plank,shade(C.plank,-.35),shade(C.plank,-.18));for(let t=.18;t<w;t+=.18)ln(P(x+t,y,4.5),P(x+t,y+hh,4.5),'rgba(60,35,15,.35)',1)}
  if(p>=1){const q=P(x+.3,y+.35,4.5);barrel(q[0],q[1],.8);const f=P(x+1.5,y+.4,4.5);ell(f[0],f[1]-2,5,3,'#9a7146');ell(f[0],f[1]-4,4,1.6,'#c4c9cf')}}
function dSmithy(b){const x=b.x+.3,y=b.y+.3,w=1.4,h=1.4;
  box(x+.1,y+.12,.35,.35,0,34,shade(C.stone,.08),shade(C.stone,-.3),shade(C.stone,-.12));
  box(x,y,w,h,0,7,null,shade(C.stone,-.32),shade(C.stone,-.08));box(x,y,w,h,7,7,null,shade(C.wood,-.3),C.wood);
  const fl=.6+.4*Math.sin(perfT*9)*Math.sin(perfT*5.3);pp([P(x+.3,y+h,1),P(x+.85,y+h,1),P(x+.85,y+h,6),P(x+.3,y+h,6)],rgbS(255,120+fl*80,30));
  roofX(x,y,w,h,14,14,roofCol(),false);
  const a=P(b.x+1.65,b.y+1.75,0);ell(a[0],a[1],6,2.2,'rgba(0,0,0,.2)');ctx.fillStyle='#3a3d42';ctx.fillRect(a[0]-2,a[1]-6,4,6);ctx.fillStyle='#55595f';ctx.beginPath();ctx.moveTo(a[0]-6,a[1]-8);ctx.lineTo(a[0]+5,a[1]-8);ctx.lineTo(a[0]+7,a[1]-6);ctx.lineTo(a[0]-5,a[1]-6);ctx.fill()}
function dStorage(b){const x=b.x+.3,y=b.y+.25,w=1.4,h=1.3;box(x,y,w,h,0,12,null,shade(C.wood,-.3),C.wood);for(let t=.2;t<w;t+=.2)ln(P(x+t,y+h,0),P(x+t,y+h,12),'rgba(0,0,0,.15)',1);
  door(x+.4,x+1,y+h,0,10);roofY(x,y,w,h,12,15,roofCol(),false);
  crate(b.x+1.85,b.y+.6);crate(b.x+1.85,b.y+1.15,.9);const q=P(b.x+.35,b.y+1.85,0);barrel(q[0],q[1]);const q2=P(b.x+.75,b.y+1.88,0);barrel(q2[0],q2[1],.9)}
function dStockFlat(b,p){const x=b.x+.06,y=b.y+.06,w=b.w-.12,h=b.h-.12;ctx.globalAlpha=.5+.5*p;pp([P(x,y),P(x+w,y),P(x+w,y+h),P(x,y+h)],BIO.snowy?'#b8ad9c':'#8a6a45');
  for(const[a,c]of[[P(x,y+h),P(x+w,y+h)],[P(x+w,y),P(x+w,y+h)]])ln(a,c,C.woodD,2.2);ctx.globalAlpha=1}
function dStockpile(b,p){if(!b.done&&b.id>=0)return;const cap=Math.max(1,storeCap()),R=b.id<0?{wood:20,stone:20,stick:20,food:10,iron:5}:G.res,f=k=>clamp(R[k]/Math.min(cap,60),0,1);
  for(const[cx,cy]of[[b.x+.1,b.y+.1],[b.x+1.9,b.y+.1],[b.x+.1,b.y+1.9]])stake(P(cx,cy),9,C.woodL);
  const nw=Math.ceil(f('wood')*6);const q=P(b.x+.6,b.y+.65);let k=0;for(let r=0;r<3&&k<nw;r++)for(let i=0;i<3-r&&k<nw;i++,k++){const X=q[0]-7+i*7+r*3.5,Y=q[1]-3-r*6;ell(X,Y,3.6,3.6,'#6e4322');ell(X,Y,2.6,2.6,'#d1a06a')}
  const ns=f('stone');if(ns>0){const s=P(b.x+1.45,b.y+.6);ell(s[0],s[1]-2,5+ns*7,2+ns*3,'#7f7b74');ell(s[0],s[1]-3-ns*2,3+ns*5,1.5+ns*2.4,'#a29e96')}
  const nt=Math.ceil(f('stick')*7);const t=P(b.x+.6,b.y+1.45);for(let i=0;i<nt;i++)ln([t[0]-8+i*1.2,t[1]-1-i*.6],[t[0]+5+i*1.2,t[1]-4-i*.6],C.twig,1.6);
  if(R.food>0){const c=P(b.x+1.4,b.y+1.4);ell(c[0],c[1]-3,6,3,'#8a6a3e');ell(c[0],c[1]-5,5,2,'#c8243a')}
  if(R.iron>0){const c=P(b.x+1.65,b.y+1.05);for(let i=0;i<Math.min(3,Math.ceil(R.iron/5));i++){ctx.fillStyle=i%2?'#5b6470':'#737c88';ctx.fillRect(c[0]-5+i*2,c[1]-3-i*2.4,9,2.4)}}}
function dBarracks(b){const x=b.x+.25,y=b.y+.3,w=2.5,h=1.4;box(x,y,w,h,0,14,null,shade(C.wood,-.3),C.wood);
  for(let t=.22;t<w;t+=.22)ln(P(x+t,y+h,0),P(x+t,y+h,14),'rgba(0,0,0,.15)',1);door(x+1.05,x+1.45,y+h,0,11);
  const cs=['#b5352c','#2f5fa8','#d9a520','#3d7a3a'];[.35,.75,1.75,2.15].forEach((t,i)=>{const q=P(x+t,y+h,8);ell(q[0],q[1],3.3,3.3,cs[i]);ell(q[0],q[1],1,1,'#e0d2a0')});
  roofX(x,y,w,h,14,17,roofCol(),true);
  for(let i=0;i<4;i++){const q=P(b.x+2.9,b.y+.5+i*.3,0);ln(q,[q[0]-3,q[1]-24],'#6b4423',1.4);pp([[q[0]-3,q[1]-24],[q[0]-4.5,q[1]-20],[q[0]-1.8,q[1]-20.5]],'#c9ced3')}
  const pb=P(b.x+.15,b.y+1.95,0),pt=P(b.x+.15,b.y+1.95,36);ln(pb,pt,C.woodD,2);flag(pt[0]+1,pt[1]+1,'#b5352c','#f0d98a')}
function dTower(b){const x=b.x+.18,y=b.y+.18,w=.64,h=.64,Z=34;
  for(const[px,py]of[[x,y],[x+w,y],[x,y+h],[x+w,y+h]])ln(P(px,py,0),P(px,py,Z),C.woodD,3);
  ln(P(x,y+h,3),P(x+w,y+h,Z-4),C.wood,1.6);ln(P(x+w,y+h,3),P(x,y+h,Z-4),C.wood,1.6);ln(P(x+w,y+h,3),P(x+w,y,Z-4),C.wood,1.6);ln(P(x+w,y,3),P(x+w,y+h,Z-4),C.wood,1.6);
  ln(P(x+.15,y+h+.12,0),P(x+.15,y+h+.12,Z),'#6b4423',1.3);ln(P(x+.4,y+h+.12,0),P(x+.4,y+h+.12,Z),'#6b4423',1.3);for(let z=4;z<Z;z+=4)ln(P(x+.15,y+h+.12,z),P(x+.4,y+h+.12,z),'#6b4423',1);
  box(x-.1,y-.1,w+.2,h+.2,Z,6,C.plank,shade(C.wood,-.3),C.wood);
  for(const[px,py]of[[x-.1,y-.1],[x+w+.1,y-.1],[x-.1,y+h+.1],[x+w+.1,y+h+.1]])ln(P(px,py,Z+6),P(px,py,Z+24),C.woodD,1.6);
  const tip=P(b.x+.5,b.y+.5,Z+38),c=roofCol();pp([P(x-.22,y+h+.22,Z+24),P(x+w+.22,y+h+.22,Z+24),tip],shade(c,-.12));pp([P(x+w+.22,y+h+.22,Z+24),P(x+w+.22,y-.22,Z+24),tip],c)}
/* ---- connected pieces: walls, fences, gates (8 directions) ---- */
function grpAt(x,y,g){const c=bAt(x,y);return c&&BD[c.type].grp===g}
function conns(b){const g=BD[b.type].grp;if(b.thumb)return[[1,0],[-1,0]];
  const has=(x,y)=>(b.gs&&b.gs.has(x+','+y))||grpAt(x,y,g);const o=[];
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(has(b.x+dx,b.y+dy))o.push([dx,dy]);
  for(const[dx,dy]of[[1,1],[1,-1],[-1,1],[-1,-1]])if(has(b.x+dx,b.y+dy)&&!has(b.x+dx,b.y)&&!has(b.x,b.y+dy))o.push([dx,dy]);
  return o}
function segsOf(b,iso){const cx=b.x+.5,cy=b.y+.5;let cs=conns(b);const L=cs.length?.5:.3;if(!cs.length)cs=[[1,0],[-1,0]];
  return cs.map(d=>[[cx,cy],[cx+d[0]*L,cy+d[1]*L],d]).sort((s,t)=>(s[1][0]+s[1][1])-(t[1][0]+t[1][1]))}
function dWall(b,p){const cx=b.x+.5,cy=b.y+.5,cs=conns(b);let pts=[[cx,cy,0]];
  if(!cs.length)pts.push([cx-.25,cy,1],[cx+.25,cy,2]);
  for(const[dx,dy]of cs){const ts=dx&&dy?[.17,.34,.5]:[.25,.5];ts.forEach((t,k)=>pts.push([cx+dx*t,cy+dy*t,k+3]))}
  pts.sort((a,c)=>(a[0]+a[1])-(c[0]+c[1]));const n=Math.max(1,Math.ceil(pts.length*Math.min(1,p)));
  for(let k=0;k<n;k++){const[x,y]=pts[k];stake(P(x,y,0),17+hash2(Math.round(x*8),Math.round(y*8))*5)}}
function seg3(a,b,th,z1,cTop,cFront,cBack){const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;let nx=-dy/l*th/2,ny=dx/l*th/2;if(nx+ny<0){nx=-nx;ny=-ny}
  const A1=[a[0]+nx,a[1]+ny],A2=[a[0]-nx,a[1]-ny],B1=[b[0]+nx,b[1]+ny],B2=[b[0]-nx,b[1]-ny];
  const side=(p1,p2,c)=>pp([P(p1[0],p1[1],0),P(p2[0],p2[1],0),P(p2[0],p2[1],z1),P(p1[0],p1[1],z1)],c);
  side(A2,B2,cBack);side(A1,B1,cFront);if(dx+dy>=0)side(B1,B2,cBack);else side(A1,A2,cBack);
  pp([P(A1[0],A1[1],z1),P(B1[0],B1[1],z1),P(B2[0],B2[1],z1),P(A2[0],A2[1],z1)],cTop)}
function dStoneWall(b,p){const st=BIO.snowy?'#9a9ea3':'#8f8b84',top=BIO.snowy?'#eef3f7':shade(st,.18),hz=11*Math.min(1,.3+p*.7);const cx=b.x+.5,cy=b.y+.5;const segs=segsOf(b);
  const front=(d)=>Math.abs(d[1])>Math.abs(d[0])?shade(st,-.05):shade(st,-.3);
  for(const s of segs)if(s[1][0]+s[1][1]<cx+cy)seg3(s[0],s[1],.34,hz,top,front(s[2]),shade(st,-.4));
  box(cx-.19,cy-.19,.38,.38,0,hz+2,top,shade(st,-.3),shade(st,-.05));
  for(const s of segs)if(s[1][0]+s[1][1]>=cx+cy)seg3(s[0],s[1],.34,hz,top,front(s[2]),shade(st,-.4));
  for(const s of segs){const m=lp(P(s[0][0],s[0][1],hz*.5),P(s[1][0],s[1][1],hz*.5),1);ln(P(s[0][0],s[0][1],hz*.5),m,'rgba(0,0,0,.12)',1)}}
function panel(a,b,H,col,weave){const qa=P(a[0],a[1]),qb=P(b[0],b[1]);pp([qa,qb,[qb[0],qb[1]-H],[qa[0],qa[1]-H]],col);
  if(weave)for(const z of[2.5,5,7.5])ln([qa[0],qa[1]-z],[qb[0],qb[1]-z],'rgba(50,30,12,.45)',1);
  ln([qa[0],qa[1]-H],[qb[0],qb[1]-H],shade(C.twig,.25),1.2)}
function dFence(b,p){const cx=b.x+.5,cy=b.y+.5,segs=segsOf(b),H=9*Math.min(1,.3+p*.7),post=P(cx,cy),col=BIO.snowy?'#8a6a48':'#8a6a3e';
  for(const s of segs)if(s[1][0]+s[1][1]<cx+cy)panel(s[0],s[1],H,shade(col,-.12),true);
  ln(post,[post[0],post[1]-H-3],C.woodD,2.4);
  for(const s of segs)if(s[1][0]+s[1][1]>=cx+cy)panel(s[0],s[1],H,col,true);
  if(BIO.snowy)for(const s of segs)ln(P(s[0][0],s[0][1],H),P(s[1][0],s[1][1],H),'#f2f6f9',1.4)}
function dRailFence(b,p){const cx=b.x+.5,cy=b.y+.5,segs=segsOf(b),post=P(cx,cy),k=Math.min(1,.3+p*.7);
  const rails=(s,c)=>{for(const z of[4,8.5])ln(P(s[0][0],s[0][1],z*k),P(s[1][0],s[1][1],z*k),c,2.2)};
  for(const s of segs)if(s[1][0]+s[1][1]<cx+cy)rails(s,shade(C.woodL,-.15));
  ctx.fillStyle=C.woodD;ctx.fillRect(post[0]-1.6,post[1]-12*k,3.2,12*k);ctx.fillStyle=C.woodL;ctx.fillRect(post[0]-1.6,post[1]-12*k-1,3.2,1.6);
  for(const s of segs)if(s[1][0]+s[1][1]>=cx+cy)rails(s,C.woodL)}
// Portões: as pontas ficam exatamente nas bordas do tile (L=.5), onde as peças vizinhas terminam, e a folha vai de ponta a ponta.
function gateGeom(b){const cs=conns(b);let d=cs.length?cs[0]:[1,0];for(const c of cs)if(cs.some(e=>e[0]===-c[0]&&e[1]===-c[1])){d=c;break}
  const cx=b.x+.5,cy=b.y+.5,e0=[cx-d[0]*.5,cy-d[1]*.5],e1=[cx+d[0]*.5,cy+d[1]*.5];
  return(e0[0]+e0[1]<=e1[0]+e1[1])?{A:e0,B:e1}:{A:e1,B:e0}}
function dGate(b,p){const{A,B}=gateGeom(b),qa0=P(A[0],A[1]),qb0=P(B[0],B[1]),k=1-(b.anim||0),f=Math.min(1,.3+p*.7),up=(q,z)=>[q[0],q[1]-z],full=p>=1,leaf=p>.4;
  // as folhas recolhem para o centro dos dois lados ao abrir (k=1 fechado, k=0 aberto)
  const qa=lp(qa0,qb0,(1-k)/2),qb=lp(qa0,qb0,(1+k)/2),qa_=qa0,qb_=qb0,mid=t=>lp(qa,qb,t);
  if(b.type==='gate'){ // portão de paliçada: mesmas estacas e cor da paliçada
    if(leaf)for(const t of[.125,.25,.375,.5,.625,.75,.875])stake(mid(t),(17+hash2(Math.round(t*64),b.x*7+b.y)*5)*f,C.wood);
    if(leaf){ln(up(qa,12*f),up(qb,12*f),C.woodD,2.2);ln(up(qa,5*f),up(qb,5*f),C.woodD,1.8)}
    if(full)ln(up(mid(.5),0),up(mid(.5),17),'#3a2312',1.2);
    stake(qa_,24*f,C.woodD);stake(qb_,24*f,C.woodD)}
  else if(b.type==='stonegate'){ // portão de pedra: pilares de pedra + grade de ferro
    for(const q of[qa_,qb_]){pp([[q[0]-3.2,q[1]],[q[0]+3.2,q[1]],[q[0]+3.2,q[1]-22*f],[q[0]-3.2,q[1]-22*f]],shade(C.stone,-.12));ell(q[0],q[1]-22*f,3.6,1.9,C.stone)}
    if(leaf){for(let t=.2;t<=.81;t+=.15)ln(up(mid(t),1),up(mid(t),15*f),C.iron,1.3);ln(up(qa,15*f),up(qb,15*f),C.iron,2);ln(up(qa,1.5),up(qb,1.5),C.iron,1.6)}}
  else if(b.type==='railgate'){ // porteira de tábuas: tábuas verticais + diagonal + postes
    if(leaf){pp([up(qa,1),up(qb,1),up(qb,11*f),up(qa,11*f)],C.plank);for(const t of[.2,.4,.6,.8])ln(up(mid(t),1),up(mid(t),11*f),shade(C.plank,-.35),1);ln(up(qa,11*f),up(qb,11*f),C.woodD,1.8);ln(up(qa,1),up(qb,11*f),C.woodD,1.4)}
    for(const q of[qa_,qb_]){ctx.fillStyle=C.woodD;ctx.fillRect(q[0]-1.8,q[1]-15*f,3.6,15*f);ctx.fillStyle=C.woodL;ctx.fillRect(q[0]-1.8,q[1]-15*f-1,3.6,1.6)}}
  else{ // fgate: porteira de galhos — treliça em X, travessa de topo e trinco
    if(leaf){panel(A,B,9*f,shade(C.twig,.1),true);ln(up(qa,0),up(qb,9*f),C.woodD,1.2);ln(up(qa,9*f),up(qb,0),C.woodD,1.2);ln(up(qa,9*f),up(qb,9*f),C.woodL,2.2);const lt=mid(.86);ell(lt[0],lt[1]-5*f,1.4,1.4,'#e0c070')}
    for(const q of[qa_,qb_])ln(q,up(q,13*f),C.woodD,2.6)}}
function dFloorFlat(b,p){ctx.globalAlpha=.45+.55*Math.min(1,p);box(b.x+.02,b.y+.02,.96,.96,0,1.6,C.plank,shade(C.plank,-.4),shade(C.plank,-.25));
  for(let t=.2;t<.98;t+=.2)ln(P(b.x+t,b.y+.03,1.6),P(b.x+t,b.y+.97,1.6),'rgba(60,35,15,.4)',1);ctx.globalAlpha=1}
function dPathFlat(b,p){ctx.globalAlpha=.45+.55*Math.min(1,p);const d=BIO.dirt;pp([P(b.x,b.y),P(b.x+1,b.y),P(b.x+1,b.y+1),P(b.x,b.y+1)],shade(d,-.08));
  const st=BIO.snowy?'#a5a9ae':'#a29e96';for(let k=0;k<4;k++){const q=P(b.x+.27+(k%2)*.46+(hash2(b.x,k)-.5)*.1,b.y+.27+(k>>1)*.46+(hash2(k,b.y)-.5)*.1);ell(q[0],q[1]+.8,8.5,4.4,shade(st,-.35));ell(q[0],q[1],8,4,st);ell(q[0]-2,q[1]-1,3.5,1.6,shade(st,.22))}ctx.globalAlpha=1}
function dBridge(b,p){const ok=(x,y)=>{if(!inb(x,y))return false;const c=bAt(x,y);return(c&&c.type==='bridge')||landT(G.tiles[idx(x,y)])};
  const ax=b.id<0?'x':(ok(b.x-1,b.y)||ok(b.x+1,b.y))&&!(ok(b.x,b.y-1)&&ok(b.x,b.y+1)&&!(ok(b.x-1,b.y)&&ok(b.x+1,b.y)))?'x':'y';
  const x=ax==='x'?b.x:b.x+.2,y=ax==='x'?b.y+.2:b.y,w=ax==='x'?1:.6,h=ax==='x'?.6:1;
  for(const[px,py]of[[x+.1,y],[x+.1,y+h],[x+w-.1,y],[x+w-.1,y+h]])ln(P(px,py,-5),P(px,py,4),C.woodD,2.4);
  if(p>.3){box(x,y,w,h,2,2.5,C.plank,shade(C.plank,-.35),shade(C.plank,-.18));for(let t=.12;t<1;t+=.14){if(ax==='x')ln(P(x+t,y,4.5),P(x+t,y+h,4.5),'rgba(60,35,15,.35)',1);else ln(P(x,y+t,4.5),P(x+w,y+t,4.5),'rgba(60,35,15,.35)',1)}
    if(p>=1){if(ax==='x'){ln(P(x,y+h,11),P(x+w,y+h,11),C.woodD,1.6);ln(P(x+.5,y+h,4.5),P(x+.5,y+h,11),C.woodD,1.5);ln(P(x,y,11),P(x+w,y,11),C.woodD,1.4)}else{ln(P(x+w,y,11),P(x+w,y+h,11),C.woodD,1.6);ln(P(x+w,y+.5,4.5),P(x+w,y+.5,11),C.woodD,1.5);ln(P(x,y,11),P(x,y+h,11),C.woodD,1.4)}}}}
function drawSite(b){const p=b.prog/b.work,d=BD[b.type],x=b.x+.25,y=b.y+.25,w=b.w-.5,h=b.h-.5,Hh=Math.min(d.wallH||14,20);
  pp([P(x-.1,y-.1),P(x+w+.1,y-.1),P(x+w+.1,y+h+.1),P(x-.1,y+h+.1)],'rgba(120,90,55,.55)');
  const per=[];for(let t=0;t<w;t+=.28)per.push([x+t,y]);for(let t=0;t<h;t+=.28)per.push([x+w,y+t]);for(let t=w;t>0;t-=.28)per.push([x+t,y+h]);for(let t=h;t>0;t-=.28)per.push([x,y+t]);
  per.sort((a,c)=>(a[0]+a[1])-(c[0]+c[1]));for(const[px,py]of per){const q=P(px,py,0);ell(q[0],q[1]-1.5,3,2,shade(C.stone,-.25));ell(q[0],q[1]-2.4,2.4,1.5,C.stone)}
  if(p>.66){const q=(p-.66)/.34;box(x,y,w,h,0,Hh*Math.max(.35,q),null,shade(C.wood,-.3),C.wood)}
  if(p>.3){const ph=Math.min(1,(p-.3)/.3)*Hh;const posts=[[x,y],[x+w,y],[x,y+h],[x+w,y+h],[x+w/2,y+h],[x+w,y+h/2]];for(const[px,py]of posts)ln(P(px,py,0),P(px,py,ph),C.woodD,2.6);
    if(p>.5){ln(P(x,y+h,ph),P(x+w,y+h,ph),C.woodL,2);ln(P(x+w,y,ph),P(x+w,y+h,ph),C.woodL,2);ln(P(x,y,ph),P(x+w,y,ph),C.woodL,1.6);ln(P(x,y,ph),P(x,y+h,ph),C.woodL,1.6)}
    if(p>.7){const rh=Hh+14*Math.min(1,(p-.7)/.3);const alongX=w>=h;for(const t of[0,.5,1]){if(alongX){const xx=x+w*t;ln(P(xx,y,Hh),P(xx,y+h/2,rh),C.woodL,1.8);ln(P(xx,y+h,Hh),P(xx,y+h/2,rh),C.woodL,1.8)}else{const yy=y+h*t;ln(P(x,yy,Hh),P(x+w/2,yy,rh),C.woodL,1.8);ln(P(x+w,yy,Hh),P(x+w/2,yy,rh),C.woodL,1.8)}}
      if(alongX)ln(P(x,y+h/2,rh),P(x+w,y+h/2,rh),C.woodD,2);else ln(P(x+w/2,y,rh),P(x+w/2,y+h,rh),C.woodD,2)}}
  const lg=P(b.x+b.w-.2,b.y+b.h-.1,0);for(let k=0;k<3;k++)ln([lg[0]-6,lg[1]-k*2.6],[lg[0]+4,lg[1]-k*2.6+2],k%2?C.woodL:C.wood,2.4)}
function drawFlatB(b){const p=b.done?1:b.prog/b.work;switch(b.type){case'farm':dFarmFlat(b,p);return dFarm(b,p);case'floor':return dFloorFlat(b,p);case'path':return dPathFlat(b,p);case'stockpile':return dStockFlat(b,p)}
  const d=BD[b.type];if(b.done&&!d.water&&!d.line&&!d.gate)pp([P(b.x+.15,b.y+.05),P(b.x+b.w+.35,b.y+.05),P(b.x+b.w+.35,b.y+b.h+.1),P(b.x+.15,b.y+b.h+.1)],'rgba(0,0,0,.13)')}
function drawB(b){const p=b.done?1:b.prog/b.work;
  switch(b.type){case'wall':return dWall(b,p);case'stonewall':return dStoneWall(b,p);case'fence':return dFence(b,p);case'railfence':return dRailFence(b,p);case'gate':case'fgate':case'stonegate':case'railgate':return dGate(b,p);
    case'bridge':return dBridge(b,p);case'farm':return;case'pen':return dPen(b,p);case'dock':return dDock(b,p);case'floor':case'path':return;case'stockpile':return dStockpile(b,p);case'cart':return drawCart({x:b.x+.5,y:b.y+.5,inv:{},items:{}})}
  if(!b.done)return drawSite(b);
  ({runa:drawRuna,bancada:dOficina,cavalete:dOficina,cozinha:dOficina,curtume:dOficina,fundicao:dOficina,salao:dLonghouse,longhouse:dLonghouse,house:dHouse,barraca:dBarraca,shelter:dShelter,lumber:dLumber,quarry:dQuarry,smithy:dSmithy,storage:dStorage,barracks:dBarracks,tower:dTower,trap:dTrap,bell:dBell})[b.type](b);if(b.type==='longhouse'&&b.done)dBandeira(b)}


/* armadilha de estacas (no chão, estacas inclinadas) e sino de alarme (poste com sino) */
function dTrap(b){const q=P(b.x+.5,b.y+.5);ell(q[0],q[1]+1,11,4.5,'rgba(0,0,0,.2)');
  for(let k=0;k<6;k++){const a=k/6*6.283+.3,r=7;const bx=q[0]+Math.cos(a)*r*.7,by=q[1]+Math.sin(a)*r*.35;ln([bx,by+2],[bx+1.5,by-7],C.woodD,1.8)}
  const armed=(b.disp||0)<=(G?G.t:0);if(armed)ell(q[0],q[1],3,1.5,'#c8243a')}
function dBell(b){const x=b.x+.5,y=b.y+.5,q=P(x,y);ell(q[0],q[1]+1,8,3.5,'rgba(0,0,0,.25)');
  ln([q[0],q[1]],[q[0],q[1]-30],C.woodD,2.4);ln([q[0]-6,q[1]-26],[q[0]+6,q[1]-26],C.woodD,2);
  const w=(b.cd||0)>(G?G.t:0)?Math.sin(perfT*18)*.25:0;
  pp([[q[0]-6,q[1]-24],[q[0]+6,q[1]-24],[q[0]+4+w,q[1]-14],[q[0]-4+w,q[1]-14]],'#c9a24a');ell(q[0],q[1]-13,3.6,1.5,'#8a6a2a')}
// oficinas (bancada, cavalete, curtume, fundição): casa baixa com uma marca de cada ofício
function dOficina(b){const x=b.x+.3,y=b.y+.25,w=b.w-.6,h=b.h-.5;box(x,y,w,h,0,12,null,shade(C.wood,-.3),C.wood);
  roofY(x,y,w,h,12,15,roofCol(),false);
  const q=P(b.x+b.w/2,b.y+b.h-.4,0);
  if(b.type==='bancada'){ell(q[0],q[1],6,2.5,'#8a6a45');ln([q[0]-5,q[1]-4],[q[0]+5,q[1]-4],C.woodL,2)}
  else if(b.type==='cavalete'){ln([q[0]-6,q[1]],[q[0]+6,q[1]-4],C.woodD,2.4);ln([q[0]-6,q[1]-4],[q[0]+6,q[1]],C.woodD,2.4)}
  else if(b.type==='curtume'){ell(q[0],q[1],6,2.5,'#7a4e2a');ell(q[0]+4,q[1]-2,3,1.5,'#9a6a40')}
  else{const f=P(b.x+.6,b.y+.6,0);ell(f[0],f[1]-2,5,4,'#ff8a2a');box(b.x+1.5,b.y+1.2,.7,.7,0,14,null,shade(C.stone,-.3),C.stone)}}
