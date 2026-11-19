/* ================= The player ================= */
function PL(){return G&&UMAP.get(G.pid)}
function adjT(u,x,y){const[tx,ty]=utile(u);return Math.abs(tx-x)<=1&&Math.abs(ty-y)<=1}
function order(o){const u=PL();if(!u||u.down)return;const old=u.order;if(old&&old.paid&&!old.done)refund(old.paid,1);u.order=o;u.path=null;u.act=null;u.idleT=0}
// replanejamentos: obstáculo que muda no meio do caminho (árvore cai, construção) não deve cancelar a ordem
function stepTo(u,o,rx,ry,rw,rh,inside){if(o.tries>4){u.order=null;if(!o.auto)toast('Não dá para chegar lá','bad');return false}o.tries=(o.tries||0)+1;if(!goRect(u,rx,ry,rw,rh,inside,passV,9000)){u.order=null;if(!o.auto)toast('Não dá para chegar lá','bad');return false}return true}
function faceTo(u,x,y){if(Math.abs((x-u.x)-(y-u.y))>.05)u.face=(x-u.x)-(y-u.y)>0?1:-1}
function updPlayer(u,dt){
  needsTick(u,dt);combateTick(u,dt);
  if(u.order&&u.order.type==='attack'&&ataqueOrdem(u,u.order,dt))return;
  if(moveUnit(u,dt))return;
  if(u.act){u.act.t+=dt;actTick(u,dt);if(u.act&&u.act.t>=u.act.dur){const a=u.act;u.act=null;finishP(u,a)}return}
  const o=u.order;
  if(!o){u.idleT=(u.idleT||0)+dt;
    if(G.demo){if(u.idleT>2.5){u.idleT=0;const q=freeNear(G.start[0]+((Math.random()*12-6)|0),G.start[1]+((Math.random()*12-6)|0),2);if(q){const p=astar(...utile(u),(x,y)=>x===q[0]&&y===q[1],q[0],q[1],passV,2000);if(p)u.path=p}}return}
    if(u.idleT>1){const s=nearestSite(u);if(s){u.order={type:'build',b:s.id,auto:true}}u.idleT=0}return}
  switch(o.type){
  case'move':u.order=null;return;
  case'obj':{const ob=G.obj[o.i],x=o.i%N,y=(o.i/N)|0;if(!ob){u.order=null;return}
    // alcance real: o personagem chega perto do centro do objeto (REACH tiles), não só "tile vizinho"
    const cx=x+.5,cy=y+.5,dd=Math.hypot(cx-u.x,cy-u.y),REACH=.62;
    if(!adjT(u,x,y)&&dd>REACH){stepTo(u,o,x,y,1,1);return}
    if(dd>REACH+.03){const sp=Math.min(dd-REACH,2.4*dt);u.x+=(cx-u.x)/dd*sp;u.y+=(cy-u.y)/dd*sp;u.moving=true;faceTo(u,cx,cy);return}
    o.tries=0;faceTo(u,cx,cy);startObj(u,o,ob);return}
  case'build':{const b=BMAP.get(o.b);if(!b||(b.done&&b.hp>=b.max)){u.order=null;return}
    if(!isNear(u,b)){if(!stepTo(u,o,b.x,b.y,b.w,b.h))b.unr=G.t+15;return}
    o.tries=0;faceTo(u,b.x+b.w/2,b.y+b.h/2);u.tb=b.id;u.act={type:'build',b:b.id,t:0,dur:2};return}
  case'deposit':{const b=BMAP.get(o.b);if(!b){u.order=null;return}if(!isNear(u,b)){stepTo(u,o,b.x,b.y,b.w,b.h);return}o.tries=0;deposit(b);u.order=null;return}
  case'fish':{const{x,y}=o;if(!G.items.rod){toast('Precisa de uma 🎣 Vara de pesca (Criar).','bad');u.order=null;return}
    const[tx,ty]=utile(u);const onSpot=adjT(u,x,y)&&passV(tx,ty);if(!onSpot){stepTo(u,o,x,y,1,1);return}
    if(!canCarry('food')){bagFull();u.order=null;return}o.tries=0;faceTo(u,x+.5,y+.5);u.act={type:'fish',t:0,dur:4,fx:x+.5,fy:y+.5};return}
  case'farm':{const b=BMAP.get(o.b);if(!b||!b.done){u.order=null;return}const[tx,ty]=utile(u);
    if(!(tx>=b.x&&ty>=b.y&&tx<b.x+3&&ty<b.y+3)){stepTo(u,o,b.x,b.y,3,3,true);return}o.tries=0;u.act={type:'farm',t:0,dur:3*(G.items.sickle>0?.62:1.25),b:b.id};return}
  case'sleep':{const b=BMAP.get(o.b);if(!b){u.order=null;return}if(!isNear(u,b)){stepTo(u,o,b.x,b.y,b.w,b.h);return}sleepNight(u);u.order=null;return}
  case'craft':{if(!o.started){o.started=true;u.act={type:'craft',item:o.item,t:0,dur:1.4}}return}
  case'forge':{const b=BMAP.get(o.b);if(!b){u.order=null;return}if(!isNear(u,b)){stepTo(u,o,b.x,b.y,b.w,b.h);return}if(!o.started){o.started=true;faceTo(u,b.x+1,b.y+1);u.act={type:'forge',item:o.item,t:0,dur:2.6}}return}
  case'repair':reparaOrdem(u,o);return;
  }}
function startObj(u,o,ob){
  switch(ob.t){
  case'tree':if(ob.g<.7){toast('Árvore jovem demais. Deixe crescer.');u.order=null;return}
    if(!hasTool('axe')){toast('Precisa de um 🪓 Machado de pedra (Criar).','bad');showHint('craft',true);u.order=null;return}
    u.act={type:'chop',i:o.i,t:0,dur:.85};return;
  case'falling':u.act={type:'wait',t:0,dur:.25};return;
  case'log':if(!canCarry('wood')){bagFull('wood');u.order=null;return}u.act={type:'takelog',i:o.i,t:0,dur:1.1};return;
  case'branch':if(!canCarry('stick')){bagFull('stick');u.order=null;return}u.act={type:'pickup',i:o.i,t:0,dur:.45,k:'stick'};return;
  case'pebble':if(!canCarry('stone')){bagFull('stone');u.order=null;return}u.act={type:'pickup',i:o.i,t:0,dur:.45,k:'stone'};return;
  case'stone':case'ore':{if(!G.items.pick){toast('Rocha grande demais para levar. Precisa de ⛏️ Picareta.','bad');showHint('pick',true);u.order=null;return}
    const k=ob.t==='ore'?'iron':'stone';if(!canCarry(k)){bagFull(k);u.order=null;return}u.act={type:'mine',i:o.i,t:0,dur:1.5,k};return}
  case'bush':if(!(ob.b>0)){if(!o.cont)toast('Sem frutinhas agora. Elas voltam com o tempo.');u.order=null;return}if(!canCarry('food')){bagFull('food');u.order=null;return}u.act={type:'berry',i:o.i,t:0,dur:.7};return;
  case'stump':if(!o.cont)toast('Um toco. A árvore volta a crescer com o tempo.');u.order=null;return;
  default:u.order=null}}
function ptool(k){if(hasTool(k)&&Math.random()<.012){gastaFerramenta(k);toast(`💥 Seu ${ITEMS[k].n} quebrou`,'bad');sfx('bad')}}
function finishP(u,a){const o=u.order;if(o&&o.type==='obj')o.cont=true;const ob=a.i!=null?G.obj[a.i]:null;const ox=a.i!=null?a.i%N+.5:0,oy=a.i!=null?(a.i/N|0)+.5:0;
  switch(a.type){
  case'chop':if(ob&&ob.t==='tree'){chopHit(a.i,ob);sfx('chop');ptool('axe')}break;
  case'takelog':if(ob&&ob.t==='log'&&canCarry('wood')){ob.amt--;addInv('wood',1,ox+.6,oy);sfx('pick');if(ob.amt<=0)toStump(a.i,ob);completeHint('log')}break;
  case'pickup':if(ob){G.obj[a.i]=null;addInv(a.k,1,ox,oy);sfx('pick');for(let k=0;k<3;k++)puff(ox,oy,'pop');completeHint('walk')}break;
  case'mine':if(ob&&(ob.t==='stone'||ob.t==='ore')){ob.amt--;addInv(a.k,1,ox,oy);sfx('mine');for(let k=0;k<3;k++)puff(ox,oy,'rockchip');if(ob.amt<=0){G.obj[a.i]=null;for(let k=0;k<5;k++)puff(ox,oy,'dust')}ptool('pick')}break;
  case'berry':if(ob&&ob.t==='bush'&&ob.b>0){ob.b--;addInv('food',1,ox,oy);sfx('pick');puff(ox,oy,'pop');if(ob.b===0)addInv('fibra',1,ox,oy);if(!ob.tr){ob.tr=1;G.regrow.push(a.i)}}break;
  case'repair':toast('🔧 Reparado','good');u.order=null;break;
  case'fish':if(Math.random()<.65){addInv('food',1,a.fx,a.fy);fishJump(a.fx,a.fy);sfx('splash')}ptool('rod');if(!canCarry('food')){u.order=null;bagFull()}break;
  case'farm':{const b=BMAP.get(a.b);if(b){b.grow+=.15;for(let k=0;k<2;k++)puff(b.x+Math.random()*3,b.y+Math.random()*3,'dust');if(b.grow>=1){b.grow=0;const n=Math.min(4,Math.floor((BAG-bagW())/WEIGHT.food+1e-6));if(n>0){addInv('food',n,b.x+1.5,b.y+1.5);sfx('store')}else{bagFull();u.order=null}}}break}
  case'craft':case'forge':G.items[a.item]++;floater(u.x,u.y,`+1 ${ITEMS[a.item].ic}`);sfx('craft');if(o)o.done=true;u.order=null;if(a.item==='axe')completeHint('craft');if(a.item==='pick')completeHint('pick');break}}

