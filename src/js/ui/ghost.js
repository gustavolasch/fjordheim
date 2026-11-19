/* ================= Ghost / placement ================= */
function ghostTiles(){if(mode.t==='build'&&mode.has){const d=BD[mode.type];return[[mode.gx,mode.gy,d.w,d.h]]}
  if(mode.t==='line'&&mode.a)return lineTiles(mode.a,mode.b).map(([x,y])=>[x,y,1,1]);return[]}
// straight, vertical and diagonal (= screen-horizontal) lines
function lineTiles(a,b){const dx=b[0]-a[0],dy=b[1]-a[1],ax=Math.abs(dx),ay=Math.abs(dy),out=[],mx=Math.max(ax,ay);if(!mx)return[[a[0],a[1]]];
  let sx,sy,n;if(Math.min(ax,ay)>=mx*.5){sx=Math.sign(dx);sy=Math.sign(dy);n=Math.round((ax+ay)/2)}else if(ax>ay){sx=Math.sign(dx);sy=0;n=ax}else{sx=0;sy=Math.sign(dy);n=ay}
  n=Math.min(n,40);for(let i=0;i<=n;i++)out.push([a[0]+i*sx,a[1]+i*sy]);return out}
function drawGhostFoot(){const type=mode.type;for(const[x,y,w,h]of ghostTiles()){const r=placeCheck(type,x,y);const ok=r===true;
  pp([P(x,y),P(x+w,y),P(x+w,y+h),P(x,y+h)],ok?'rgba(90,230,120,.3)':'rgba(240,80,70,.33)',ok?'rgba(150,255,170,.9)':'rgba(255,140,130,.9)',1.5)}
  if(mode.t==='line'&&mode.a){const q=P(mode.a[0]+.5,mode.a[1]+.5);ell(q[0],q[1],5,2.5,'#f3c969')}}
function fakeB(type,x,y,gs){const d=BD[type];return{id:-2,type,x,y,w:d.w,h:d.h,done:true,prog:d.work,work:d.work,hp:1,max:1,grow:.6,queue:[],gs}}
function drawGhost(){const bob=Math.sin(perfT*5)*1.5;
  if(mode.t==='build'&&mode.has){const d=BD[mode.type],f=fakeB(mode.type,mode.gx,mode.gy);ctx.globalAlpha=.62;ctx.save();ctx.translate(0,bob);if(d.flat)drawFlatB(f);drawB(f);ctx.restore();ctx.globalAlpha=1}
  else if(mode.t==='line'&&mode.a){const ts=lineTiles(mode.a,mode.b),gs=new Set(ts.map(([x,y])=>x+','+y));ctx.globalAlpha=.6;for(const[x,y]of ts){const f=fakeB(mode.type,x,y,gs);if(BD[mode.type].flat)drawFlatB(f);drawB(f)}ctx.globalAlpha=1}
  else if(mode.t==='decor'&&mode.has){const D=DECOR[mode.kind];const q=P(mode.wx,mode.wy);ctx.globalAlpha=.65;ctx.save();ctx.translate(q[0],q[1]+bob);ctx.scale(mode.f||1,1);D.d();ctx.restore();ctx.globalAlpha=1;ctx.strokeStyle='#f3c969';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(q[0],q[1],10,5,0,0,6.283);ctx.stroke()}}

