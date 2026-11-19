/* ================= Update ================= */
function update(dt){G.t+=dt;
  const pop=popCount();G.foodAcc=(G.foodAcc||0)+pop*dt/32;while(G.foodAcc>=1){G.foodAcc--;if(G.res.food>0)G.res.food--}
  // raids only once there is a real village to defend (Casa Comunal + inhabitants)
  if(settings.raids&&!G.demo&&longhouse()&&pop>0){if(!G.raidOn&&!G.raidWarned&&G.t>=G.nextRaid-25){G.raidWarned=true;toast('🔭 Invasores avistados! Chegam em 25 segundos.','bad')}
    if(G.t>=G.nextRaid&&!G.raidOn){G.raidWarned=false;G.nextRaid=G.t+260+Math.random()*90;spawnRaid()}}
  else G.nextRaid=Math.max(G.nextRaid,G.t+300);
  for(const u of G.units.slice()){if(!UMAP.has(u.id))continue;sangueTick(u,dt);if((u.stun||0)>0){u.stun-=dt;u.moving=false;continue}
    if(u.kind==='player')updPlayer(u,dt);else if(u.kind==='villager')updVillager(u,dt);else if(u.kind==='warrior')updWarrior(u,dt);else if(u.kind==='animal')updAnimal(u,dt);else updRaider(u,dt);
    if(u.moving||(u.act&&u.act.type!=='idle'&&u.act.type!=='wait'))u.anim+=dt*10;if(u.swing>0)u.swing-=dt}
  for(const b of G.bld.slice()){if(!BMAP.has(b.id))continue;if(b.pop>0)b.pop-=dt;if(queimaTick(b,dt))continue;if(!b.done)continue;
    if(b.type==='tower'){b.cd-=dt;if(b.cd<=0){const t=nearestUnit(b.x+.5,b.y+.5,CB.torre.alcance,v=>v.kind==='raider');if(t){b.cd=CB.torre.recarga;AR.push({x:b.x+.5,y:b.y+.5,z:46,tid:t.id,dmg:CB.torre.dano,tipo:CB.torre.tipo,sp:10})}else b.cd=.3}}
    b.smokeT-=dt;if(b.smokeT<=0){b.smokeT=.6+Math.random()*.6;const c=chimney(b);if(c){puff(c[0],c[1],'chimney');const p=PT[PT.length-1];if(p)p.z=c[2]}}
    if(b.hp<b.max*.45&&Math.random()<dt*6)puff(b.x+Math.random()*b.w,b.y+Math.random()*b.h,Math.random()<.5?'fire':'smoke')}
  updFalling(dt);animaisTick(dt);
  for(let k=G.regrow.length-1;k>=0;k--){const i=G.regrow[k],o=G.obj[i];if(!o||G.occ[i]){G.regrow.splice(k,1);continue}
    if(o.t==='stump'){o.timer-=dt;if(o.timer<=0)G.obj[i]={t:'tree',k:o.k,c:o.c,ox:o.ox,oy:o.oy,s:o.s,hp:5,g:.2}}
    else if(o.t==='tree'){o.g=Math.min(1,o.g+dt/150);if(o.g>=1)G.regrow.splice(k,1)}
    else if(o.t==='bush'){o.rt=(o.rt||0)+dt;if(o.rt>100){o.rt=0;o.b++}if(o.b>=3){o.tr=0;G.regrow.splice(k,1)}}
    else G.regrow.splice(k,1)}
  // branches slowly drop from trees again (no instant respawn)
  G.brT=(G.brT||0)+dt;if(G.brT>30){G.brT=0;let n=0;for(let i=0;i<N*N;i++)if(G.obj[i]&&G.obj[i].t==='branch')n++;
    if(n<N*N*.02)for(let k=0;k<40;k++){const i=(Math.random()*N*N)|0,o=G.obj[i];if(!o||o.t!=='tree'||o.g<1)continue;const x=i%N+((Math.random()*3|0)-1),y=(i/N|0)+((Math.random()*3|0)-1);if(!inb(x,y))continue;const j=idx(x,y);if(G.obj[j]||G.occ[j]||!landT(G.tiles[j]))continue;G.obj[j]=BRANCH(Math.random);break}}
  for(const d of G.decor)if(d.k==='campfire'&&Math.random()<dt*1.2){puff(d.x,d.y,'chimney');const p=PT[PT.length-1];if(p)p.z=10*d.s}
  for(const o of G.obj)if(o&&o.shake>0)o.shake-=dt;
  if(Math.random()<dt*.4){const x=(Math.random()*N)|0,y=(Math.random()*N)|0;if(G.tiles[idx(x,y)]<=1&&!G.occ[idx(x,y)])fishJump(x+.5,y+.5)}
  updParticles(dt);
  if(!G.demo){G.saveT=(G.saveT||0)+dt;if(G.saveT>60){G.saveT=0;save(true)}}}
function chimney(b){switch(b.type){case'longhouse':return[b.x+1.5,b.y+1.5,42];case'house':return[b.x+1,b.y+1,30];case'smithy':return[b.x+.45,b.y+.45,34];case'shelter':return[b.x+1.2,b.y+2.05,6];default:return null}}

