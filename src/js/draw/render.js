/* ================= Rendering ================= */
function darkness(){if(!settings.daynight||!G)return 0;const ph=(G.t/240)%1,n=.5-.5*Math.cos(ph*6.283);return clamp((n-.62)/.3,0,1)*.62}
function dusk(){if(!settings.daynight||!G)return 0;const ph=(G.t/240)%1,n=.5-.5*Math.cos(ph*6.283);return clamp(1-Math.abs(n-.6)/.14,0,1)}
let LIGHTS=[];
function clampCam(){const mw=N*HW*cam.z,mh=N*HH*2*cam.z;cam.x=clamp(cam.x,W/2-mw,W/2+mw);cam.y=clamp(cam.y,H/2-mh-40*cam.z,H/2+60*cam.z)}
function visRange(){const cs=[s2w(0,0),s2w(W,0),s2w(0,H),s2w(W,H)];let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const[a,b]of cs){x0=Math.min(x0,a);x1=Math.max(x1,a);y0=Math.min(y0,b);y1=Math.max(y1,b)}
  return[Math.max(0,Math.floor(x0)-2),Math.min(N-1,Math.ceil(x1)+4),Math.max(0,Math.floor(y0)-2),Math.min(N-1,Math.ceil(y1)+4)]}
function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(!bgGrad){bgGrad=ctx.createLinearGradient(0,0,0,H);bgGrad.addColorStop(0,BIO.bg[0]);bgGrad.addColorStop(1,BIO.bg[1])}
  ctx.fillStyle=bgGrad;ctx.fillRect(0,0,W,H);
  if(!G)return;clampCam();
  const z=cam.z;LOD=z<.55;ctx.setTransform(z*DPR,0,0,z*DPR,cam.x*DPR,cam.y*DPR);
  const vx0=-cam.x/z-80,vx1=(W-cam.x)/z+80,vy0=-cam.y/z-90,vy1=(H-cam.y)/z+60;
  const vis=(x,y)=>{const sx=(x-y)*HW,sy=(x+y)*HH;return sx>vx0&&sx<vx1&&sy>vy0&&sy<vy1};
  const[X0,X1,Y0,Y1]=visRange();
  // diorama sides
  for(let x=0;x<N;x++){if(!vis(x+.5,N))continue;const t=G.tiles[idx(x,N-1)];const c=t<=1?shade(t?BIO.shallow:BIO.deep,-.45):shade(BIO.soil,-.15);pp([P(x,N),P(x+1,N),P(x+1,N,-54),P(x,N,-54)],c)}
  for(let y=0;y<N;y++){if(!vis(N,y+.5))continue;const t=G.tiles[idx(N-1,y)];const c=t<=1?shade(t?BIO.shallow:BIO.deep,-.3):BIO.soil;pp([P(N,y),P(N,y+1),P(N,y+1,-54),P(N,y,-54)],c)}
  ln(P(0,N,-20),P(N,N,-20),'rgba(0,0,0,.15)',3);ln(P(N,N,-20),P(N,0,-20),'rgba(0,0,0,.12)',3);ln(P(0,N,-38),P(N,N,-38),'rgba(0,0,0,.12)',2);ln(P(N,N,-38),P(N,0,-38),'rgba(0,0,0,.1)',2);
  const edge=BIO.snowy?'#ffffff':shade(BIO.grass[0],-.2);ln(P(0,N,-1),P(N,N,-1),edge,2.5);ln(P(N,N,-1),P(N,0,-1),edge,2.5);
  // tiles (only the visible window of the island)
  const t=perfT,dk=hexRgb(BIO.deep),sh=hexRgb(BIO.shallow);
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){if(!vis(x+.5,y+.5))continue;const i=idx(x,y),tt=G.tiles[i];let c;
    if(tt<=1){const w=Math.sin(t*1.3+x*.7+y*.45)*7+Math.sin(t*.7-x*.3+y*.8)*5;const b=tt?sh:dk;c=rgbS(b[0]+w,b[1]+w,b[2]+w*1.2)}else c=G.tcs[i];
    const a=P(x,y),b2=P(x+1,y),c2=P(x+1,y+1),d=P(x,y+1);ctx.beginPath();ctx.moveTo(a[0],a[1]-.6);ctx.lineTo(b2[0]+.8,b2[1]);ctx.lineTo(c2[0],c2[1]+.6);ctx.lineTo(d[0]-.8,d[1]);ctx.closePath();ctx.fillStyle=c;ctx.fill()}
  if(!LOD)for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=idx(x,y);if(G.tiles[i]>1||!vis(x+.5,y+.5))continue;const al=.35+.25*Math.sin(t*2+x+y);const fc=`rgba(235,248,255,${al})`;
    if(y>0&&G.tiles[idx(x,y-1)]>=2)ln(P(x,y),P(x+1,y),fc,2);if(x<N-1&&G.tiles[idx(x+1,y)]>=2)ln(P(x+1,y),P(x+1,y+1),fc,2);if(y<N-1&&G.tiles[idx(x,y+1)]>=2)ln(P(x,y+1),P(x+1,y+1),fc,2);if(x>0&&G.tiles[idx(x-1,y)]>=2)ln(P(x,y),P(x,y+1),fc,2);
    const sp=Math.sin(t*1.7+hash2(x,y)*30);if(sp>.93){const q=P(x+.5,y+.5);ln([q[0]-4,q[1]],[q[0]+4,q[1]],'rgba(255,255,255,.55)',1.2)}}
  if(z>.65){const wsw=windStrength();for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=idx(x,y),tf=TUFT[i];if(!tf||G.wear[i]>10||G.obj[i]||G.occ[i]||!vis(x+.5,y+.5))continue;const q=P(x+.5+tf[0],y+.5+tf[1]);
    if(BIO.snowy){ell(q[0],q[1],2,1,'rgba(160,180,200,.35)');continue}
    const c=shade(BIO.grass[(tf[2]+1)%BIO.grass.length],-.28),bend=Math.sin(t*2.2+x*.6+y*.3)*1.3*wsw;ctx.strokeStyle=c;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q[0]-2+bend,q[1]-3);ctx.lineTo(q[0],q[1]);ctx.lineTo(q[0]+.5+bend,q[1]-4);ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0]+2.5+bend,q[1]-2.5);ctx.stroke();
    if(G.biome==='autumn'&&tf[2]===1)ell(q[0]+5,q[1]+2,1.4,.8,BIO.leaves[(x+y)%6]);else if(tf[2]===2&&G.biome!=='autumn')ell(q[0]+4,q[1]-1,1,1,['#f2f2f2','#e8c33a','#e05a7a'][(x*y)%3])}}
  for(const b of G.bld){if(vis(b.x+b.w/2,b.y+b.h/2))drawFlatB(b)}
  drawGhostFoot();
  // objects, depth-sorted
  const L=[];LIGHTS.length=0;
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=idx(x,y);if(!vis(x+.5,y+.5))continue;if(G.tiles[i]===4)L.push([x+y+1,1,i]);else if(G.obj[i])L.push([x+y+1+(G.obj[i].ox||0)+(G.obj[i].oy||0),0,i])}
  for(const b of G.bld){const d=BD[b.type];if(d.flat&&d.pass&&b.type!=='farm')continue;const cx=b.x+b.w/2,cy=b.y+b.h/2;if(vis(cx,cy))L.push([cx+cy,2,b])}
  for(const u of G.units)if(!u.hidden&&vis(u.x,u.y))L.push([u.x+u.ox+u.y+u.oy+.02,3,u]);
  for(const d of G.decor)if(vis(d.x,d.y))L.push([d.x+d.y,4,d]);
  for(const t of G.tombs)if(vis(t.x,t.y))L.push([t.x+t.y,5,t]);
  for(const c of G.carts)if(vis(c.x,c.y))L.push([c.x+c.y,6,c]);
  L.sort((a,b)=>a[0]-b[0]);
  for(const[,k,o]of L){
    if(k===0)drawObj(G.obj[o],o%N,(o/N)|0);
    else if(k===1){const x=o%N,y=(o/N)|0,h=G.h[o];const tc=G.tcs[o],cl=BIO.cliff;box(x,y,1,1,0,h,tc,shade(cl,-.28),cl);const hs=hash2(x*3,y*5);
      for(let j=1;j<4;j++){const f=j/4+(hash2(x+j,y)-.5)*.12;ln(P(x+f,y+1,0),P(x+f,y+1,h*(.55+hash2(x,y+j)*.4)),'rgba(0,0,0,.13)',1.1);ln(P(x+1,y+f,0),P(x+1,y+f,h*(.5+hash2(x+j,y+j)*.45)),'rgba(0,0,0,.1)',1.1)}
      ln(P(x,y+1,h),P(x+1,y+1,h),'rgba(255,255,255,.22)',1.4);ln(P(x+1,y+1,h),P(x+1,y,h),'rgba(255,255,255,.3)',1.4);if(hs>.5){const q=P(x+.3+hs*.4,y+.35,h);ell(q[0],q[1],2.2,1.2,'rgba(0,0,0,.14)')}}
    else if(k===2){if(o.pop>0){const c=P(o.x+o.w/2,o.y+o.h/2),s=o.pop/.35;ctx.save();ctx.translate(c[0],c[1]);ctx.scale(1+s*.12,1-s*.12);ctx.translate(-c[0],-c[1]);drawB(o);ctx.restore()}else drawB(o);
      if(o.done){if(o.type==='longhouse')LIGHTS.push([o.x+1.5,o.y+2.6,90]);else if(o.type==='smithy')LIGHTS.push([o.x+.9,o.y+1.7,80]);else if(o.type==='house')LIGHTS.push([o.x+1.7,o.y+1,45]);else if(o.type==='shelter')LIGHTS.push([o.x+1.2,o.y+1.75,80])}}
    else if(k===3){drawUnit(o);if(o.kind==='player')LIGHTS.push([o.x,o.y,38])}
    else if(k===5)drawTomb(o)
    else if(k===6)drawCart(o)
    else{const D=DECOR[o.k];if(!D)continue;const q=P(o.x,o.y);const onW=inb(Math.floor(o.x),Math.floor(o.y))&&G.tiles[idx(Math.floor(o.x),Math.floor(o.y))]<=1;
      ctx.save();ctx.translate(q[0],q[1]+(onW?Math.sin(perfT*1.6+o.x)*1.2:0));ctx.scale(o.s*o.f,o.s);if(onW)ell(0,2,D.big?40:16,D.big?9:5,'rgba(255,255,255,.18)');D.d();ctx.restore();
      if(D.light)LIGHTS.push([o.x,o.y,D.light*o.s]);
      if(mode.t==='edit'&&mode.sel===o){ctx.strokeStyle='#f3c969';ctx.lineWidth=1.6;ctx.setLineDash([4,3]);ctx.beginPath();ctx.ellipse(q[0],q[1],16*o.s*(D.big?2.4:1),7*o.s*(D.big?2:1),0,0,6.283);ctx.stroke();ctx.setLineDash([])}}}
  for(const p of PT){const q=P(p.x,p.y,p.z),a=p.life/p.max;
    switch(p.type){
    case'smoke':ell(q[0],q[1],p.r,p.r,`rgba(225,225,228,${.3*a})`);break;
    case'dust':ell(q[0],q[1],p.r,p.r*.7,`rgba(190,160,120,${.45*a})`);break;
    case'chip':ctx.fillStyle='#c49a64';ctx.fillRect(q[0],q[1],p.r*1.6,p.r);break;
    case'leaf':ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(p.life*5);ell(0,0,p.r,p.r*.5,p.c);ctx.restore();break;
    case'pop':ctx.fillStyle=`rgba(255,236,160,${a})`;ctx.fillRect(q[0]-1,q[1]-1,2.2,2.2);break;
    case'ring':ctx.strokeStyle=`rgba(243,201,105,${a})`;ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(q[0],q[1],4+(1-a)*14,2+(1-a)*7,0,0,6.283);ctx.stroke();break;
    case'rockchip':case'debris':ctx.fillStyle=p.type==='debris'?'#6e4322':'#9a968e';ctx.fillRect(q[0],q[1],p.r*1.6,p.r*1.6);break;
    case'blood':ctx.fillStyle='#d63a2a';ctx.fillRect(q[0],q[1],p.r,p.r);break;
    case'spark':ctx.fillStyle='#ffcf5a';ctx.fillRect(q[0],q[1],1.6,1.6);break;
    case'fire':ell(q[0],q[1],p.r*a+.5,p.r*a+.5,a>.5?'#ffd34a':'#ff6a1a');break;
    case'splash':ell(q[0],q[1],p.r,p.r,'rgba(230,245,255,.85)');break;
    case'fish':{const ph=1-a,zz=Math.sin(ph*Math.PI)*18,b=P(p.x,p.y,zz);ctx.save();ctx.translate(b[0],b[1]);ctx.rotate((ph-.5)*2.4);ell(0,0,5,1.8,p.c?'#c9d6df':'#d9a070');pp([[-5,0],[-8,-2.5],[-8,2.5]],p.c?'#9fb0bd':'#b8804e');ctx.restore();break}
    case'txt':{ctx.font='800 11px Nunito, sans-serif';ctx.textAlign='left';ctx.globalAlpha=Math.min(1,a*2);const SZ=13,segs=iconCanvasSegs(p.text);let w=0;for(const s of segs)w+=s.im?SZ+2:ctx.measureText(s.t).width;let x=q[0]-w/2;ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.fillStyle='#fff3c4';for(const s of segs){if(s.im){ctx.drawImage(s.im,x,q[1]-SZ+2,SZ,SZ);x+=SZ+2}else{ctx.strokeText(s.t,x,q[1]);ctx.fillText(s.t,x,q[1]);x+=ctx.measureText(s.t).width}}ctx.globalAlpha=1;break}}}
  for(const a of AR){const q=P(a.x,a.y,a.z);ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(a.ang||0);ln([-6,0],[3,0],'#5a3a22',1.4);pp([[3,-1.6],[6,0],[3,1.6]],'#cfd4d9');ctx.restore()}
  for(const b of G.bld){const cx=b.x+b.w/2,cy=b.y+b.h/2;if(!vis(cx,cy))continue;const d=BD[b.type];const top=P(cx,cy,(d.wallH||14)+(b.w>1?30:22));
    if(!b.done&&!d.line){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(top[0]-14,top[1],28,4);ctx.fillStyle='#f3c969';ctx.fillRect(top[0]-14,top[1],28*b.prog/b.work,4)}
    else if(b.hp<b.max&&b.done){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(top[0]-14,top[1],28,4);ctx.fillStyle=b.hp<b.max*.4?'#e2533f':'#6fd35b';ctx.fillRect(top[0]-14,top[1],28*b.hp/b.max,4)}
    if(!b.done&&d.line){const q=P(cx,cy,2);ctx.strokeStyle='rgba(243,201,105,.6)';ctx.setLineDash([3,3]);ctx.lineWidth=1;pp([P(b.x+.1,b.y+.1),P(b.x+.9,b.y+.1),P(b.x+.9,b.y+.9),P(b.x+.1,b.y+.9)],null,'rgba(243,201,105,.55)',1);ctx.setLineDash([])}
    if(sel&&sel.k==='b'&&sel.id===b.id){ctx.setLineDash([5,4]);pp([P(b.x,b.y),P(b.x+b.w,b.y),P(b.x+b.w,b.y+b.h),P(b.x,b.y+b.h)],null,'#f3c969',2);ctx.setLineDash([])}}
  drawGhost();
  ctx.setTransform(DPR,0,0,DPR,0,0);
  drawWeather();
  const dk2=darkness(),du=dusk();
  if(du>0){ctx.fillStyle=`rgba(255,120,50,${du*.1})`;ctx.fillRect(0,0,W,H)}
  if(dk2>.01){lctx.setTransform(1,0,0,1,0,0);lctx.globalCompositeOperation='source-over';lctx.clearRect(0,0,lc.width,lc.height);lctx.fillStyle=`rgba(8,14,40,${dk2})`;lctx.fillRect(0,0,lc.width,lc.height);lctx.globalCompositeOperation='destination-out';
    for(const[x,y,r]of LIGHTS){const q=P(x,y,8),sx=(q[0]*z+cam.x)/2,sy=(q[1]*z+cam.y)/2,R=r*z/2*(1+Math.sin(perfT*8+x)*.03);const g=lctx.createRadialGradient(sx,sy,0,sx,sy,R);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');lctx.fillStyle=g;lctx.fillRect(sx-R,sy-R,R*2,R*2)}
    lctx.globalCompositeOperation='source-over';ctx.drawImage(lc,0,0,W,H);
    ctx.globalCompositeOperation='lighter';for(const[x,y,r]of LIGHTS){const q=P(x,y,8),sx=q[0]*z+cam.x,sy=q[1]*z+cam.y,R=r*z*.55;const g=ctx.createRadialGradient(sx,sy,0,sx,sy,R);g.addColorStop(0,`rgba(255,150,60,${dk2*.45})`);g.addColorStop(1,'rgba(255,150,60,0)');ctx.fillStyle=g;ctx.fillRect(sx-R,sy-R,R*2,R*2)}ctx.globalCompositeOperation='source-over'}}
function drawWeather(){const w=BIO.weather;
  if(w==='leaves'){for(const p of SP){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.beginPath();ctx.ellipse(0,0,p.s,p.s*.5,0,0,6.283);ctx.fill();ctx.restore()}}
  else if(w==='snow'){ctx.fillStyle='rgba(255,255,255,.85)';for(const p of SP){ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.283);ctx.fill()}}
  else if(w==='motes'){for(const p of SP){ctx.fillStyle=darkness()>.2?`rgba(230,255,140,${.5+.4*Math.sin(perfT*3+p.r)})`:'rgba(255,255,230,.35)';ctx.beginPath();ctx.arc(p.x,p.y,p.s*.6,0,6.283);ctx.fill()}}
  else if(w==='clouds'){for(const p of SP){const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s);g.addColorStop(0,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(p.x-p.s,p.y-p.s,p.s*2,p.s*2)}}}
function initWeather(){SP=[];const w=BIO.weather,n=w==='snow'?80:w==='leaves'?18:w==='motes'?22:5;for(let i=0;i<n;i++)SP.push(newSP(true))}
function newSP(any){const w=BIO.weather,r=Math.random;const p={x:r()*W,y:any?r()*H:-10,r:r()*6,vr:(r()-.5)*2,c:pick(BIO.leaves),s:w==='snow'?.8+r()*1.8:w==='clouds'?120+r()*160:2.5+r()*2,vx:0,vy:0};
  if(w==='snow'){p.vy=20+r()*35;p.vx=-6+r()*4}else if(w==='leaves'){p.vy=18+r()*20;p.vx=10+r()*10}else if(w==='motes'){p.vy=-4+r()*8;p.vx=-5+r()*10}else{p.vx=6+r()*6;p.y=r()*H*.6;if(!any)p.x=-p.s}return p}
function updWeather(dt){const w=BIO.weather,ws=.6+windStrength()*.8;for(let i=0;i<SP.length;i++){const p=SP[i];p.x+=(p.vx*ws+(w==='leaves'?Math.sin(perfT*1.5+p.r)*14:0))*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;
  if(p.y>H+10||p.x>W+(p.s||10)+20||p.x<-260||p.y<-20)SP[i]=newSP(false);if(w==='motes'&&(p.y<0||p.y>H)){SP[i]=newSP(true)}}}

