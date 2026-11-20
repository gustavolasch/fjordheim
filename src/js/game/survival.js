/* ================= Sobrevivência (0.4): fome, calor, energia, vida, morte e túmulo =================
   Barras do jogador (0..100): food (fome), warm (calor), energy (energia). Vida = u.hp.
   Fome: come sozinho abaixo de 35 e avisa quando a comida acaba. Morte: perde só a mochila (vai pro túmulo). */
const NEED_DEF={food:80,warm:100,energy:100};
const NEED_NAMES={hp:'Vida',food:'Fome',warm:'Calor',energy:'Energia',stam:'Fôlego'};
const WARN_GAP=60; // segundos de jogo entre avisos repetidos

function calmF(){return settings.calm?.5:1}
function nightDark(t){const ph=(t/240)%1,n=.5-.5*Math.cos(ph*6.283);return clamp((n-.62)/.3,0,1)*.62}
function foodStock(){return G.inv.food+G.res.food}
function isHeatNear(u){
  for(const d of G.decor)if(d.k==='campfire'&&Math.hypot(d.x-u.x,d.y-u.y)<3)return true;
  for(const b of G.bld){if(!b.done||!['house','longhouse','shelter','smithy'].includes(b.type))continue;if(Math.hypot(b.x+b.w/2-u.x,b.y+b.h/2-u.y)<3)return true}
  return false}
function nearWater(u){const x=Math.floor(u.x),y=Math.floor(u.y);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(inb(x+dx,y+dy)&&G.tiles[idx(x+dx,y+dy)]<=1)return true;return false}
// frio: noite (se o ciclo dia/noite estiver ligado), Costa Gelada e água por perto
function coldLevel(u){let c=0;if(settings.daynight&&nightDark(G.t)>0)c=1;else if(BIO.snowy)c=.6;if(BIO.snowy&&settings.daynight&&nightDark(G.t)>0)c=1;if(nearWater(u))c+=.3;return Math.min(1,c)}
// velocidade cai com energia ou calor zerados
function survivalSpeed(u){return(u.energy<20?.7:1)*(u.warm<=0?.8:1)}

function needsTick(u,dt){
  if(u.hp<=0){killPlayer(u);return}
  if(u.food==null)Object.assign(u,{food:NEED_DEF.food,warm:NEED_DEF.warm,energy:NEED_DEF.energy});
  const k=calmF(),acting=u.act&&u.act.type!=='idle'&&u.act.type!=='wait';
  u.food=Math.max(0,u.food-dt*(100/480)*k*(acting?1.5:1));                 // ~8 min sem comer; trabalho pesado 1.5x
  u.energy=Math.max(0,u.energy-dt*(100/600)*(acting?1.6:u.moving?1.1:1));  // ~10 min acordado; esforço 1.6x
  u.warm=clamp(u.warm-dt*coldLevel(u)*(100/300)*k+(isHeatNear(u)?dt*15:0),0,100);
  if(u.food<=0||u.warm<=0){if(!DEV.god)u.hp=Math.max(0,u.hp-dt*(100/200)*k)} // fome ou frio zerados: vida cai devagar
  else if(u.hp<u.max)u.hp=Math.min(u.max,u.hp+dt*1.5);
  eatIfNeeded(u);
  needWarn(u);
}
function eatIfNeeded(u){
  if(u.food>=35||foodStock()<=0)return;
  if(G.inv.food>0)G.inv.food--;else G.res.food--;
  u.food=Math.min(100,u.food+30);
  toast('[[recursos.food]] Você comeu','good');
}
function needWarn(u){
  if(!u.warnT)u.warnT={};
  const w=(key,cond,msg)=>{if(!cond)return;if(u.warnT[key]==null||G.t-u.warnT[key]>WARN_GAP){u.warnT[key]=G.t;toast(msg,'bad')}};
  w('food',u.food<35&&foodStock()<=0,'[[recursos.food]] Acabou a comida! Colha frutinhas, pesque ou plante uma lavoura.');
  w('warm',u.warm<25,'[[interface.fogo]] Frio! Chegue perto de uma fogueira ou casa.');
  w('energy',u.energy<20,'⚡ Cansado! Durma numa cama para recuperar a energia.');
  w('hp',u.hp<30,'❤️ Vida baixa!');
}

// morte: a mochila (recursos e ferramentas) vai para um túmulo no local; o equipamento não é perdido
function killPlayer(u){
  if(u.guest){toast('💀 Seu amigo caiu e voltou ao abrigo.','bad');respawnPlayer(u);return} // a mochila é do anfitrião: não vai para o túmulo
  if(!settings.calm){
    G.tombs.push({id:G.idc++,x:u.x,y:u.y,inv:{...G.inv},items:{...G.items}});
    for(const k in G.inv)G.inv[k]=0;
    for(const k in G.items)G.items[k]=0;
    toast('💀 Você morreu. Sua mochila ficou no túmulo.','bad');
  }else toast('💀 Você morreu. Modo tranquilo: nada foi perdido.','bad');
  respawnPlayer(u);
}
function respawnPlayer(u){
  u.hp=u.max;u.food=Math.max(u.food||0,50);u.warm=Math.max(u.warm||0,60);u.energy=Math.max(u.energy||0,60);
  u.act=null;u.order=null;u.path=null;u.moving=false;u.warnT={};u.sangue=0;u.stun=0;
  const s=G.bld.find(b=>b.done&&(b.type==='shelter'||b.type==='house'||b.type==='longhouse'));
  const p=s?freeNear(s.x+1,s.y+s.h,3):freeNear(G.start[0],G.start[1],3);
  if(p){u.x=p[0]+.5;u.y=p[1]+.5}
}
// túmulo: tocar e resgatar devolve a mochila inteira
function tombAt(wx,wy){for(const t of G.tombs)if(Math.hypot(wx-t.x,wy-t.y)<.7)return t;return null}
function lootTomb(t){
  for(const k in t.inv)G.inv[k]=(G.inv[k]||0)+t.inv[k];
  for(const k in t.items)G.items[k]=(G.items[k]||0)+t.items[k];
  G.tombs=G.tombs.filter(x=>x!==t);
  toast('[[interface.mochila]] Você pegou sua mochila de volta','good');
}
function drawTomb(t){const q=P(t.x,t.y);
  ell(q[0],q[1]+1,11,4.5,'rgba(0,0,0,.25)');
  for(let k=0;k<7;k++){const a=k/7*6.283;ell(q[0]+Math.cos(a)*7,q[1]-2+Math.sin(a)*3.4,2.6,2,k%2?'#8a8680':'#a5a19a')}
  ell(q[0],q[1]-4,5,3,'#6f6c66');
  ln([q[0],q[1]-4],[q[0],q[1]-22],C.woodD,2.2);ln([q[0]-5,q[1]-17],[q[0]+5,q[1]-17],C.woodD,2);
  const w=Math.sin(perfT*3)*1.5;pp([[q[0],q[1]-22],[q[0]+8+w,q[1]-20],[q[0],q[1]-17]],'#c8243a')}

// dormir numa cama: passa a noite (até o amanhecer) e enche a energia
function sleepNight(u){
  let delta=60;
  if(settings.daynight&&nightDark(G.t)>0){delta=0;while(nightDark(G.t+delta)>0&&delta<400)delta++}
  G.t+=delta;
  u.food=Math.max(0,u.food-delta*(100/480)*.5*calmF());
  u.energy=100;u.warm=Math.max(u.warm,60);
  toast('[[interface.dormir]] Você dormiu até o amanhecer','good');
}

// barras na tela (fora do topo, acima da barra de navegação)
function needsHUD(){const p=PL();if(!p||p.food==null)return;
  const bars=[[icon('interface','vida'),'hp',p.hp/p.max],[icon('recursos','food'),'food',p.food/100],[icon('interface','calor'),'warm',p.warm/100],[icon('interface','energia'),'energy',p.energy/100],[icon('interface','folego'),'stam',(p.stam??100)/100]];
  const sig=bars.map(b=>Math.round(b[2]*20)).join(',');
  let el=document.getElementById('needs');
  if(!el){el=document.createElement('div');el.id='needs';el.className='glass';document.body.appendChild(el)}
  if(el.dataset.sig===sig)return;el.dataset.sig=sig;
  el.innerHTML=bars.map(([ic,k,v])=>`<div class="nb ${v<.3?'low':''}" title="${NEED_NAMES[k]}"><span>${ic}</span><div class="trk"><i style="width:${Math.max(0,Math.min(100,v*100)).toFixed(0)}%"></i></div></div>`).join('')}
