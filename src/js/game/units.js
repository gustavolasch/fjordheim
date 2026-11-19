/* ================= Units ================= */
function spawnUnit(kind,x,y,extra){const fem=Math.random()<.5;
  const u={id:G.idc++,kind,x,y,ox:(Math.random()-.5)*.36,oy:(Math.random()-.5)*.36,path:null,act:null,cool:Math.random(),job:null,work:null,tool:null,carry:0,carryT:null,hp:40,max:40,speed:1.7,anim:Math.random()*6,face:1,name:pick(NAMES),fem,hair:pick(HAIRS),skin:pick(SKINS),tunic:pick(TUNICS),atkCd:0,thinkT:Math.random()};
  Object.assign(u,extra||{});G.units.push(u);UMAP.set(u.id,u);return u}
function removeUnit(u){const i=G.units.indexOf(u);if(i>=0)G.units.splice(i,1);UMAP.delete(u.id);if(sel&&sel.k==='u'&&sel.id===u.id){sel=null;closeSheet()}}
function blocksObj(o){return o&&(o.t==='stone'||o.t==='ore'||o.t==='log'||o.t==='falling'||(o.t==='tree'&&o.g>.5))}
function passV(x,y){if(!inb(x,y))return 0;const i=idx(x,y),id=G.occ[i];
  if(id){const b=BMAP.get(id);if(!b)return 0;const d=BD[b.type];if(d.pass&&(b.done||b.type!=='bridge'))return 1;if(d.gate&&b.done)return 1;return 0}
  if(!landT(G.tiles[i]))return 0;return blocksObj(G.obj[i])?0:1}
function passR(x,y){if(!inb(x,y))return 0;const i=idx(x,y),id=G.occ[i];
  if(id){const b=BMAP.get(id);if(!b)return 0;const d=BD[b.type];if(d.wall||d.gate)return 7;if(d.pass&&(b.done||b.type!=='bridge'))return 1;return 0}
  if(!landT(G.tiles[i]))return 0;return blocksObj(G.obj[i])?0:1}
/* A* */
const gS=new Float32Array(N*N),came=new Int32Array(N*N),seen=new Uint32Array(N*N),closed=new Uint32Array(N*N);let stamp=0;
const DIRS=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
function astar(sx,sy,goal,hx,hy,pass,maxIt){maxIt=maxIt||5000;stamp++;if(!inb(sx,sy))return null;
  const hk=[],hv=[];const push=(k,v)=>{hk.push(k);hv.push(v);let i=hk.length-1;while(i>0){const p=(i-1)>>1;if(hv[p]<=hv[i])break;[hk[p],hk[i]]=[hk[i],hk[p]];[hv[p],hv[i]]=[hv[i],hv[p]];i=p}};
  const pop=()=>{const k=hk[0],lk=hk.pop(),lv=hv.pop();if(hk.length){hk[0]=lk;hv[0]=lv;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<hk.length&&hv[l]<hv[m])m=l;if(r<hk.length&&hv[r]<hv[m])m=r;if(m===i)break;[hk[m],hk[i]]=[hk[i],hk[m]];[hv[m],hv[i]]=[hv[i],hv[m]];i=m}}return k};
  const h=(x,y)=>{const dx=Math.abs(x-hx),dy=Math.abs(y-hy);return Math.max(dx,dy)+.414*Math.min(dx,dy)};
  const s=idx(sx,sy);gS[s]=0;came[s]=-1;seen[s]=stamp;push(s,h(sx,sy));let it=0;
  while(hk.length&&it++<maxIt){const c=pop();if(closed[c]===stamp)continue;closed[c]=stamp;const cx=c%N,cy=(c/N)|0;
    if(goal(cx,cy)){const path=[];let k=c;while(k!==s&&k>=0){path.push([k%N,(k/N)|0]);k=came[k]}path.reverse();return path}
    for(const[dx,dy,dc]of DIRS){const nx=cx+dx,ny=cy+dy;const pc=pass(nx,ny);if(!pc)continue;if(dx&&dy&&(!pass(cx+dx,cy)||!pass(cx,cy+dy)))continue;
      const ni=idx(nx,ny);if(closed[ni]===stamp)continue;const ng=gS[c]+dc*pc;if(seen[ni]!==stamp||ng<gS[ni]){seen[ni]=stamp;gS[ni]=ng;came[ni]=c;push(ni,ng+h(nx,ny))}}}
  return null}
const nearRect=(rx,ry,rw,rh)=>(x,y)=>x>=rx-1&&x<=rx+rw&&y>=ry-1&&y<=ry+rh;
const inRect=(rx,ry,rw,rh)=>(x,y)=>x>=rx&&x<rx+rw&&y>=ry&&y<ry+rh;
function utile(u){return[Math.floor(u.x),Math.floor(u.y)]}
function goRect(u,rx,ry,rw,rh,inside,pass,maxIt){const[sx,sy]=utile(u);const g=inside?inRect(rx,ry,rw,rh):nearRect(rx,ry,rw,rh);const p=astar(sx,sy,g,rx+rw/2,ry+rh/2,pass||passV,maxIt);if(!p)return false;u.path=p;return true}
function isNear(u,b){const[x,y]=utile(u);return x>=b.x-1&&x<=b.x+b.w&&y>=b.y-1&&y<=b.y+b.h}
function moveUnit(u,dt){
  if(!u.path||!u.path.length){u.moving=false;return false}
  const[tx,ty]=u.path[0];
  if(u.kind==='raider'){const b=bAt(tx,ty);if(b&&(BD[b.type].wall||BD[b.type].gate)){u.attackB=b.id;u.moving=false;return true}}
  else{const[cx,cy]=utile(u);if((cx!==tx||cy!==ty)&&!passV(tx,ty)){u.path=null;u.moving=false;return false}}
  const gx=tx+.5,gy=ty+.5,dx=gx-u.x,dy=gy-u.y,d=Math.hypot(dx,dy);
  if(d>.01)u.heading=Math.atan2(dy,dx); // direção de movimento no mundo do jogo (usada pelo sprite do jogador)
  let sp=u.speed*dt;if(u.kind==='player')sp*=survivalSpeed(u);if(u.kind==='villager'&&G.res.food<=0)sp*=.7;if(u.kind==='player'&&bagW()>BAG*.75)sp*=.85;
  if(d<=sp){u.x=gx;u.y=gy;u.path.shift();wearTile(tx,ty)}else{u.x+=dx/d*sp;u.y+=dy/d*sp}
  if(Math.abs(dx-dy)>.01)u.face=(dx-dy)>0?1:-1;u.moving=true;return true}
function raidActive(){return G.units.some(u=>u.kind==='raider')}
function nearestUnit(x,y,R,f){let b=null,bd=R;for(const u of G.units){if(!f(u))continue;const d=Math.hypot(u.x-x,u.y-y);if(d<bd){bd=d;b=u}}return b}
/* ---- villagers (kept for future recruitment; none exist at start) ---- */
function updVillager(u,dt){
  if(u.hidden){if(!G.raidOn&&!raidActive()){u.hidden=false;const L=longhouse();const p=L&&freeNear(L.x+1,L.y+3,3);if(p){u.x=p[0]+.5;u.y=p[1]+.5}u.path=null;u.act=null}return}
  if(G.raidOn&&!u.flee){const r=nearestUnit(u.x,u.y,6,v=>v.kind==='raider');if(r){u.flee=true;u.act=null;const L=longhouse();u.path=null;if(L)goRect(u,L.x,L.y,L.w,L.h)}}
  if(u.flee){if(!moveUnit(u,dt)){u.hidden=true;u.flee=false}return}
  if(moveUnit(u,dt))return;
  if(u.act){u.act.t+=dt;actTick(u,dt);if(u.act&&u.act.t>=u.act.dur){const a=u.act;u.act=null;finishAct(u,a)}return}
  u.cool-=dt;if(u.cool>0)return;u.cool=.25+Math.random()*.3;think(u)}
function actTick(u,dt){const a=u.act;if(a.type==='build'){const b=BMAP.get(a.b);if(!b){u.act=null;return}const rate=1/toolF(u);
    if(!b.done){b.prog+=rate*dt;b.hp=Math.min(b.max,b.max*(.3+.7*b.prog/b.work));if(Math.random()<dt*2)puff(b.x+Math.random()*b.w,b.y+Math.random()*b.h,'dust');if(Math.random()<dt*1.2)sfx('hammer');if(b.prog>=b.work){completeB(b);u.act=null}}
    else{b.hp=Math.min(b.max,b.hp+rate*dt*8);if(b.hp>=b.max)u.act=null}}}
function finishAct(u,a){const w=BMAP.get(u.work);
  switch(a.type){
  case'chop':{const o=G.obj[a.i];if(o&&o.t==='tree')chopHit(a.i,o);wearTool(u);break}
  case'takelog':{const o=G.obj[a.i];if(o&&o.t==='log'){o.amt--;u.carry++;u.carryT='wood';if(o.amt<=0){toStump(a.i,o);u.tgt=null}}break}
  case'mine':{const o=G.obj[a.i];if(o&&(o.t==='stone'||o.t==='ore')){const iron=o.t==='ore';o.amt--;u.carry++;u.carryT=iron?'iron':'stone';for(let k=0;k<3;k++)puff(a.i%N+.5,(a.i/N|0)+.5,'rockchip');if(o.amt<=0){G.obj[a.i]=null;u.tgt=null}}wearTool(u);break}
  case'farm':{if(w){w.grow+=.12;if(w.grow>=1){w.grow=0;addRes('food',4,w.x+1.5,w.y+1.5)}}wearTool(u);break}
  case'fish':{if(w&&Math.random()<.7){addRes('food',1,a.fx,a.fy);fishJump(a.fx,a.fy)}wearTool(u);break}
  case'forge':{if(w){G.items[a.item]++;floater(w.x+1,w.y+1,`+1 ${ITEMS[a.item].ic}`);}wearTool(u);break}
  }}
function findObj(cx,cy,R,types,u){let best=null,bd=1e9;const x0=Math.max(0,Math.floor(cx-R)),x1=Math.min(N-1,Math.ceil(cx+R)),y0=Math.max(0,Math.floor(cy-R)),y1=Math.min(N-1,Math.ceil(cy+R));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const o=G.obj[idx(x,y)];if(!o||!types.includes(o.t))continue;if(o.t==='tree'&&o.g<.7)continue;if(o.bad&&o.bad>G.t)continue;if(Math.hypot(x-cx,y-cy)>R)continue;
    const d=Math.hypot(x+.5-u.x,y+.5-u.y)-(o.t==='log'?3:0);if(d<bd){bd=d;best=idx(x,y)}}return best}
function think(u){
  if(!u.job){
    const site=nearestSite(u,5);
    if(site){u.tb=site.id;if(!u.tool)takeTool(u);if(isNear(u,site)){u.act={type:'build',b:site.id,t:0,dur:3}}else if(!goRect(u,site.x,site.y,site.w,site.h)){site.unr=G.t+8;u.tb=null}return}
    u.tb=null;u.act={type:'idle',t:0,dur:1.5+Math.random()*2.5};return}
  const w=BMAP.get(u.work);if(!w||!w.done){unassign(u);return}
  if(!u.tool)takeTool(u);
  const cx=w.x+w.w/2,cy=w.y+w.h/2;
  if(u.job==='lumber'||u.job==='miner'){
    const types=u.job==='lumber'?['log','tree']:(w.mode==='iron'?['ore']:['stone']),cap=u.job==='lumber'?2:3;
    let ti=u.tgt;const o=ti!=null?G.obj[ti]:null;if(!o||!types.includes(o.t)||(o.t==='tree'&&o.g<.7))ti=null;
    if(u.carry>=cap||(u.carry>0&&ti==null&&findObj(cx,cy,12,types,u)==null)){if(isNear(u,w)){addRes(u.carryT,u.carry,w.x+w.w/2,w.y+w.h/2);u.carry=0}else if(!goRect(u,w.x,w.y,w.w,w.h)){u.carry=0}return}
    if(ti==null)ti=findObj(cx,cy,12,types,u);
    if(ti==null){u.status='Sem recursos por perto';u.act={type:'idle',t:0,dur:3};return}
    u.status=null;u.tgt=ti;const x=ti%N,y=(ti/N)|0,ob=G.obj[ti];
    if(Math.abs(Math.floor(u.x)-x)<=1&&Math.abs(Math.floor(u.y)-y)<=1){u.face=(x+.5-u.x)-(y+.5-u.y)>0?1:-1;u.act={type:ob.t==='log'?'takelog':ob.t==='tree'?'chop':'mine',i:ti,t:0,dur:1.6*toolF(u)}}
    else if(!goRect(u,x,y,1,1)){G.obj[ti].bad=G.t+25;u.tgt=null}
    return}
  if(u.job==='farmer'){const[x,y]=utile(u);if(x>=w.x&&y>=w.y&&x<w.x+3&&y<w.y+3&&Math.random()<.7){u.act={type:'farm',t:0,dur:3.6*toolF(u)}}else{const tx=w.x+((Math.random()*3)|0),ty=w.y+((Math.random()*3)|0);const p=astar(x,y,(a,b)=>a===tx&&b===ty,tx,ty,passV);if(p)u.path=p;else u.act={type:'idle',t:0,dur:2}}return}
  if(u.job==='fisher'){let spot=null;for(let dy=0;dy<w.h;dy++)for(let dx=0;dx<w.w;dx++){const i=idx(w.x+dx,w.y+dy);if(G.tiles[i]<=1){const busy=G.units.some(v=>v!==u&&v.work===w.id&&v.spot===i);if(!busy||!spot)spot=[w.x+dx,w.y+dy,i]}}
    if(!spot){u.act={type:'idle',t:0,dur:3};return}u.spot=spot[2];const[x,y]=utile(u);
    if(x===spot[0]&&y===spot[1]){u.act={type:'fish',t:0,dur:4.5*toolF(u),fx:spot[0]+1.5,fy:spot[1]+.5}}
    else{const p=astar(x,y,(a,b)=>a===spot[0]&&b===spot[1],spot[0],spot[1],passV);if(p)u.path=p;else u.act={type:'idle',t:0,dur:3}}return}
  if(u.job==='smith'){if(!isNear(u,w)){if(!goRect(u,w.x,w.y,w.w,w.h))u.act={type:'idle',t:0,dur:3};return}
    const it=w.queue[0];if(!it){u.status='Fila de forja vazia';u.act={type:'idle',t:0,dur:2};return}
    if(!afford(ITEMS[it].cost)){u.status='Faltam materiais';u.act={type:'idle',t:0,dur:2};return}
    u.status=null;pay(ITEMS[it].cost);w.queue.shift();u.act={type:'forge',item:it,t:0,dur:5.5*toolF(u)};return}
}
function nearestSite(u,maxBuilders){let site=null,bd=1e9;for(const b of G.bld){if(b.done&&b.hp>=b.max)continue;if(b.unr&&b.unr>G.t)continue;
    if(maxBuilders){const n=G.units.reduce((c,v)=>c+(v!==u&&v.tb===b.id?1:0),0);if(n>=maxBuilders)continue}
    const d=Math.hypot(b.x+b.w/2-u.x,b.y+b.h/2-u.y)+(b.done?8:0);if(d<bd&&d<30){bd=d;site=b}}return site}
function updWarrior(u,dt){u.atkCd-=dt;u.thinkT-=dt;
  if(u.thinkT<=0){u.thinkT=.35+Math.random()*.2;const t=nearestUnit(u.x,u.y,14,v=>v.kind==='raider');u.target=t?t.id:null;
    if(t){const d=Math.hypot(t.x-u.x,t.y-u.y);if(d>u.range*.9){const[tx,ty]=utile(t);u.path=astar(...utile(u),(x,y)=>Math.hypot(x-tx,y-ty)<=Math.max(1,u.range*.8),tx,ty,passV,3000)}else u.path=null}
    else if((!u.path||!u.path.length)&&u.post){const p=u.post;if(Math.hypot(p[0]+.5-u.x,p[1]+.5-u.y)>2.5){const pa=astar(...utile(u),nearRect(p[0],p[1],1,1),p[0],p[1],passV,3000);if(pa)u.path=pa}}}
  const t=u.target&&UMAP.get(u.target);
  if(t&&Math.hypot(t.x-u.x,t.y-u.y)<=u.range){u.path=null;u.moving=false;u.face=(t.x-u.x)-(t.y-u.y)>0?1:-1;if(u.atkCd<=0){u.atkCd=u.rate;u.swing=.3;attack(u,t)}return}
  moveUnit(u,dt)}
function updRaider(u,dt){u.atkCd-=dt;u.thinkT-=dt;
  if(u.thinkT<=0){u.thinkT=.5+Math.random()*.3;
    const e=nearestUnit(u.x,u.y,4.5,v=>(v.kind==='warrior')||(v.kind==='villager'&&!v.hidden)||(v.kind==='player'&&!v.down));
    if(e){u.target=e.id;if(Math.hypot(e.x-u.x,e.y-u.y)>u.range){const[tx,ty]=utile(e);u.path=astar(...utile(u),nearRect(tx,ty,1,1),tx,ty,passR,3000);u.attackB=null}}
    else{u.target=null;let b=u.tb&&BMAP.get(u.tb);if(!b){let bd=1e9;for(const c of G.bld){const d0=BD[c.type];if(d0.wall||d0.gate||d0.pass)continue;const d=Math.hypot(c.x+c.w/2-u.x,c.y+c.h/2-u.y);if(d<bd){bd=d;b=c}}u.tb=b?b.id:null}
      if(b&&!isNear(u,b)&&!u.attackB&&(!u.path||!u.path.length)){if(!goRect(u,b.x,b.y,b.w,b.h,false,passR))u.tb=null}}}
  const t=u.target&&UMAP.get(u.target);
  if(t&&!t.hidden&&!t.down&&Math.hypot(t.x-u.x,t.y-u.y)<=u.range){u.moving=false;u.face=(t.x-u.x)-(t.y-u.y)>0?1:-1;if(u.atkCd<=0){u.atkCd=u.rate;u.swing=.3;attack(u,t)}return}
  if(u.attackB){const wb=BMAP.get(u.attackB);if(wb){u.moving=false;if(u.atkCd<=0){u.atkCd=u.rate;u.swing=.3;damageB(wb,u.dmg)}return}u.attackB=null}
  const b=u.tb&&BMAP.get(u.tb);if(b&&isNear(u,b)){u.path=null;u.moving=false;if(u.atkCd<=0){u.atkCd=u.rate;u.swing=.3;damageB(b,u.dmg)}return}
  moveUnit(u,dt)}
function attack(a,t){if(a.ranged){AR.push({x:a.x,y:a.y,z:14,tid:t.id,dmg:a.dmg,sp:9});return}dmgUnit(t,a.dmg)}
function dmgUnit(t,d){if(DEV.god&&t.kind==='player')return;t.hp-=d;for(let k=0;k<3;k++)puff(t.x,t.y,'blood');
  if(t.kind==='player'){if(t.hp<=0)killPlayer(t);return}
  if(t.hp<=0)killUnit(t)}
function killUnit(u){for(let k=0;k<8;k++)puff(u.x,u.y,'smoke');removeUnit(u);
  if(u.kind==='raider'){if(!raidActive()&&G.raidOn){G.raidOn=false;const iron=3+G.raidN*2;addInv('iron',iron);toast(`🏆 Invasores derrotados! Deixaram 🔩${iron}`,'good')}}
  else toast(`💀 ${u.name} caiu em combate`,'bad')}
function spawnRaid(){G.raidN++;const n=Math.min(14,2+Math.floor(G.raidN*1.6));const L=longhouse();if(!L)return;let sp=null;
  for(let k=0;k<50&&!sp;k++){const s=(Math.random()*4)|0,t=(Math.random()*N)|0;const x=s===0?0:s===1?N-1:t,y=s===2?0:s===3?N-1:t;if(!passR(x,y))continue;
    if(astar(x,y,nearRect(L.x,L.y,L.w,L.h),L.x+1,L.y+1,passR,12000))sp=[x,y]}
  if(!sp){G.nextRaid=G.t+90;return}
  for(let i=0;i<n;i++){const hp=60+G.raidN*8;spawnUnit('raider',sp[0]+.5+(Math.random()-.5)*.8,sp[1]+.5+(Math.random()-.5)*.8,{hp,max:hp,dmg:7+G.raidN,range:1.2,rate:1.1,speed:1.45,tunic:pick(['#7d2219','#5a1a14','#2e2a28','#6b2a1e']),hair:pick(['#2a1d14','#6b3d1f','#3b2a1d'])})}
  G.raidOn=true;toast(`⚔️ ${n} invasores atacam a vila!`,'bad')}

