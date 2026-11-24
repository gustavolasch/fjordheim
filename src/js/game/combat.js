/* ================= Combate (0.5) =================
   Armas e armaduras vêm de data/combate.json (CDATA). A simulação não sabe de tela: só recebe comandos
   (atacar, bloquear, reparar, tocar o sino) e muda o estado. Quatro tipos de dano: corte, perfuração,
   impacto e fogo. Fôlego, bloqueio, sangramento e atordoamento. Caça (animais), saqueadores que
   quebram construções, reparo, armadilha de estacas e sino de alarme. */
const CB=CDATA;
const SLOTS=CB.slots;
const ANIMAIS=CB.animais;

// Semente própria do combate (estado em G.rs, salvo no save): mesmos bichos e invasões em todo teste.
function rnd(){G.rs=(G.rs+0x6D2B79F5)|0;let t=Math.imul(G.rs^(G.rs>>>15),1|G.rs);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}
function emptyEquip(){const e={};for(const s of SLOTS)e[s]=null;return e}
function zerosRes(){const o={};for(const k in RES)o[k]=0;return o}
function zerosItems(){const o={};for(const k in ITEMS)o[k]=0;return o}

/* ---- equipamento: 8 espaços. Item equipado sai da mochila (e não pesa nela). ---- */
function equipped(k){return SLOTS.some(s=>G.equip[s]===k)}
function hasTool(k){return(G.items[k]||0)>0||equipped(k)}
function gastaFerramenta(k){if(G.items[k]>0){G.items[k]--;return}const s=SLOTS.find(s=>G.equip[s]===k);if(s)G.equip[s]=null}
function equipItem(k){const it=ITEMS[k];
  if(!it||!it.slot){toast('Isto não se veste','bad');return}
  if(!G.items[k])return;
  const s=it.slot;
  if(s==='mao'&&it.duas_maos&&G.equip.escudo){toast('Arma de duas mãos: tire o escudo antes','bad');return}
  if(s==='escudo'&&G.equip.mao&&ITEMS[G.equip.mao].duas_maos){toast('Tire a arma de duas mãos antes','bad');return}
  if(G.equip[s])G.items[G.equip[s]]++; // troca: o que estava no espaço volta para a mochila
  G.equip[s]=k;G.items[k]--;sfx('craft');toast(`${itemMark(k)} ${it.n} equipado`,'good')}
function unequip(s){const k=G.equip[s];if(!k)return;G.equip[s]=null;G.items[k]=(G.items[k]||0)+1;sfx('tick')}
function armaDe(u){const k=u.kind==='player'?G.equip.mao:null,it=k&&ITEMS[k];return it&&it.arma?{...it.arma,k}:{...CB.fol.mao_nua}}

/* ---- fôlego (0..100): atacar gasta no golpe, andar gasta pouco, cada golpe bloqueado gasta (em dmgUnit) ---- */
function folTick(u,dt){if(u.stam==null)u.stam=CB.fol.max;
  let r=CB.fol.regen_parado;
  if(u.moving)r=-CB.fol.gasto_andando;
  u.stam=clamp(u.stam+r*dt,0,CB.fol.max)}

/* ---- armadura: multiplica o dano pelo tipo (fator 1 = sem proteção) ---- */
function fatorArmadura(t,tipo){
  if(t.kind!=='player')return t.fator?(t.fator[tipo]??1):1;
  let f=1;for(const s of['cabeca','peito','pernas','pes']){const k=G.equip[s];if(k&&ITEMS[k].fator)f*=ITEMS[k].fator[tipo]??1}
  return Math.max(.12,f)}
/* ---- bloqueio automático: com escudo equipado, cada golpe tem uma chance (combate.json: bloqueio_chance).
   Precisa de fôlego e o escudo não pode estar quebrado. ---- */
function bloqueando(t){return!!(t.kind==='player'&&G.equip.escudo&&(t.stam||0)>0&&!((t.quebraT||0)>G.t)&&rnd()<CB.bloqueio_chance)}
function fracaoBloqueio(atq){
  let f=ITEMS[G.equip.escudo].bloqueio;
  if(atq&&(atq.efeito||[]).includes('ignora_escudo'))f*=CB.bloqueio_ignorado_por_lanca;
  return f}

/* ---- golpe: d = dano base · tipo = corte|perfuracao|impacto|fogo · atq = {efeito:[...], src:quem bateu} ---- */
function dmgUnit(t,d,tipo,atq){
  if(DEV.god&&t.kind==='player')return;
  tipo=tipo||'corte';const efe=(atq&&atq.efeito)||[];
  let v=d*fatorArmadura(t,tipo);
  if(efe.includes('quebra'))v=d*Math.sqrt(fatorArmadura(t,tipo)); // martelo de guerra: quebra parte da armadura
  if(bloqueando(t)){
    v*=1-fracaoBloqueio(atq);t.stam=Math.max(0,t.stam-v*CB.fol.custo_bloqueio_por_dano);
    if(tipo==='impacto'||efe.includes('puxa_escudo')){t.quebraT=G.t+CB.escudo_quebrado_segundos;toast('[[itens.shield]] Escudo quebrado!','bad');sfx('bad')}
  }
  if(tipo==='impacto'&&(d>=CB.atordoar_dano||efe.includes('atordoa')||efe.includes('quebra')))t.stun=Math.max(t.stun||0,CB.atordoar_segundos);
  if((tipo==='corte'||tipo==='perfuracao')&&rnd()<CB.sangramento.chance)sangra(t);
  if(t.kind==='animal'){const A=ANIMAIS[t.sp];
    if(A.comportamento==='foge'){t.fleeT=G.t+5;t.target=null}
    else if(atq&&atq.src&&atq.src.kind==='player')t.target=atq.src.id}
  t.hp-=v;for(let k=0;k<3;k++)puff(t.x,t.y,'blood');
  if(t.kind==='player'){if(t.hp<=0)killPlayer(t);return}
  if(t.hp<=0)killUnit(t)}
function sangra(t){
  if(t.kind==='player'&&(G.items.curativo||0)>0){G.items.curativo--;toast('[[itens.curativo]] Curativo estancou o sangue','good');return}
  if(t.kind==='player')toast('🩸 Sangramento! Faça um curativo de fibra para estancar.','bad');
  t.sangue=CB.sangramento.segundos}
function sangueTick(u,dt){if(!(u.sangue>0))return;
  if(u.kind==='player'&&(G.items.curativo||0)>0){G.items.curativo--;u.sangue=0;toast('[[itens.curativo]] Você estancou o sangramento','good');return}
  u.sangue-=dt;u.hp-=CB.sangramento.dps*dt;
  if(u.hp<=0){if(u.kind==='player')killPlayer(u);else killUnit(u)}}

/* ---- morte de unidades (inimigos, animais) e drops ---- */
function killUnit(u){for(let k=0;k<8;k++)puff(u.x,u.y,'smoke');removeUnit(u);
  if(u.kind==='raider'){if(!raidActive()&&G.raidOn){G.raidOn=false;const iron=3+G.raidN*2;addInv('iron',iron);toast(`🏆 Invasores derrotados! Deixaram [[recursos.iron]]${iron}`,'good')}}
  else if(u.kind==='animal'){const A=ANIMAIS[u.sp],txt=[];
    for(const k in A.drop){const n=A.drop[k];if(!(n>0))continue;
      if(canCarry(k,n)){addInv(k,n,u.x,u.y);txt.push('[['+'recursos.'+k+']]'+n)}
      else toast(`[[interface.mochila]] Mochila cheia: ${RES[k][0].toLowerCase()} ficou no chão`,'bad')}
    toast(`${A.ic} ${A.n} abatido${txt.length?' · '+txt.join(' '):''}`,'good');sfx('pick')}
  else toast(`💀 ${u.name} caiu em combate`,'bad')}

/* ---- ataque do jogador: ordem 'attack'. Retorna true quando usou o quadro (andar ou golpear). ---- */
function ataqueOrdem(u,o,dt){
  const t=UMAP.get(o.uid);
  if(!t||t.hidden||t.hp<=0){u.order=null;return false}
  const d=Math.hypot(t.x-u.x,t.y-u.y);
  if(d>25){u.order=null;toast('Ele fugiu. Caçada cancelada.');return false}
  const W=armaDe(u),proj=!!W.dist&&d>W.alcance,alc=proj?W.dist:W.alcance;
  if(d>alc){
    o.rt=(o.rt||0)-dt;
    if(!u.path||!u.path.length||o.rt<=0){o.rt=.4;const[tx,ty]=utile(t);
      const p=astar(...utile(u),(x,y)=>Math.hypot(x+.5-t.x,y+.5-t.y)<=alc*.9,tx,ty,passV,4000);
      if(p)u.path=p;else{u.order=null;toast('Não dá para chegar lá','bad');return false}}
    moveUnit(u,dt);return true}
  u.path=null;u.moving=false;faceTo(u,t.x,t.y);
  if((u.atkCd||0)>0)return true;
  const forte=!!o.heavy,custo=forte?CB.fol.golpe_forte:(W.fol||12);
  if((u.stam||0)<custo){if(!o.semFolego){toast('Sem fôlego. Espere um instante.','bad');o.semFolego=true}u.atkCd=.4;return true}
  o.semFolego=false;
  if(W.municao==='stone'){if(G.inv.stone<=0){toast('Sem pedrinhas para a funda','bad');u.order=null;return false}G.inv.stone--}
  u.stam-=custo;u.swing=.3;o.heavy=false;
  u.atkCd=(W.vel||1)*(forte?CB.fol.golpe_forte_mult_vel:1);
  const dano=W.dmg*(forte?CB.fol.golpe_forte_mult_dano:1);
  if(proj)AR.push({x:u.x,y:u.y,z:14,tid:t.id,dmg:dano,tipo:W.dano,sp:10,efeito:W.efeito||[],src:u.id});
  else dmgUnit(t,dano,W.dano,{efeito:W.efeito||[],src:u});
  return true}

/* ---- reparo: pede material proporcional ao dano e gasta tempo; o reparo aparece na barra da obra ---- */
function repCusto(b){const d=BD[b.type],f=(b.max-b.hp)/b.max,c={};
  for(const k in d.cost){const v=Math.ceil(d.cost[k]*f*CB.reparo.fracao_custo);if(v>0)c[k]=v}return c}
function reparaOrdem(u,o){const b=BMAP.get(o.b);
  if(!b||!b.done||b.hp>=b.max){u.order=null;return}
  if(!isNear(u,b)){if(!stepTo(u,o,b.x,b.y,b.w,b.h))b.unr=G.t+15;return}
  if(o.started)return;
  const c=repCusto(b);if(!afford(c)){toast('Faltam materiais para reparar','bad');u.order=null;return}
  pay(c);o.started=true;faceTo(u,b.x+b.w/2,b.y+b.h/2);
  u.act={type:'repair',b:b.id,t:0,dur:Math.max(1.5,CB.reparo.tempo_total*(b.max-b.hp)/b.max)}}

/* ---- construções: material resiste de forma diferente; fogo queima madeira ---- */
function matOf(type){return CB.material_construcao[type]||'madeira'}
function damageB(b,d,tipo){tipo=tipo||'corte';
  const f=CB.materiais[matOf(b.type)][tipo]??1;b.hp-=d*f;
  puff(b.x+Math.random()*b.w,b.y+Math.random()*b.h,'debris');
  if(tipo==='fogo'&&matOf(b.type)==='madeira'&&b.done)b.burn=CB.queima.segundos;
  if(b.type==='longhouse'&&b.hp<=b.max*.1){sack();b.hp=Math.round(b.max*.3);return}
  if(b.hp<=0)destroyB(b,`[[interface.fogo]] ${BD[b.type].n} foi destruído!`)}
function queimaTick(b,dt){if(!(b.burn>0))return false;
  b.burn-=dt;b.hp-=CB.queima.dano_por_segundo*dt;
  if(Math.random()<dt*5)puff(b.x+Math.random()*b.w,b.y+Math.random()*b.h,'fire');
  if(b.hp<=0){destroyB(b,`[[interface.fogo]] ${BD[b.type].n} queimou`);return true}
  return false}

/* ---- armadilha de estacas: o invasor que pisa leva um golpe e ela recarrega ---- */
function armadilhaCheck(u,tx,ty){const b=bAt(tx,ty);if(!b||b.type!=='trap'||!b.done||(b.disp||0)>G.t)return;
  const A=CB.armadilha;b.disp=G.t+A.recarga;b.hp-=A.desgaste;
  dmgUnit(u,A.dano,A.tipo,{efeito:[],src:null});for(let k=0;k<4;k++)puff(tx+.5,ty+.5,'rockchip');
  if(b.hp<=0)destroyB(b,'🪤 A armadilha quebrou')}

/* ---- sino de alarme: manda os moradores se esconderem enquanto há invasão ---- */
function tocaSino(b){
  if((b.cd||0)>G.t){toast('O sino ainda vibra. Espere um pouco.');return}
  b.cd=G.t+CB.sino.recarga;
  if(!G.raidOn){toast('🔔 O sino tocou. Sem invasão por enquanto.');return}
  let n=0;const L=longhouse();
  for(const u of G.units)if(u.kind==='villager'&&!u.hidden){u.flee=true;u.act=null;u.path=null;if(L)goRect(u,L.x,L.y,L.w,L.h);n++}
  toast(`🔔 Alarme! ${n} morador(es) correm para se esconder`,'good');sfx('bad')}

/* ---- animais: presas fogem, predadores atacam quem chega perto (lobos em bando) ---- */
function animaisCfg(){return CB.animais_por_bioma[G.biome]||CB.animais_padrao}
function animalSpot(minDist){for(let t=0;t<80;t++){const x=(rnd()*N)|0,y=(rnd()*N)|0,i=idx(x,y);
    if(!landT(G.tiles[i])||G.obj[i]||G.occ[i])continue;
    if(Math.hypot(x-G.start[0],y-G.start[1])<minDist)continue;
    const pl=PL();if(pl&&Math.hypot(x-pl.x,y-pl.y)<minDist)continue;return[x,y]}return null}
function spawnAnimal(sp,x,y){const A=ANIMAIS[sp];
  return spawnUnit('animal',x+.5,y+.5,{sp,name:A.n,hp:A.hp,max:A.hp,speed:A.vel,range:A.alcance||1,rate:A.vel_ataque||1,
    dmg:A.dano,tipo:A.tipo||'corte',efeito:[],atkCd:0,home:[x+.5,y+.5],idleT:rnd()*3,thinkT:rnd(),fleeT:0,target:null,repath:true})}
function spawnAnimais(){const cfg=animaisCfg();for(const sp in cfg)for(let k=0;k<cfg[sp];k++){const p=animalSpot(12);if(p)spawnAnimal(sp,p[0],p[1])}}
function animaisTick(dt){G.animT=(G.animT||0)+dt;if(G.animT<CB.animais_reaparece_segundos)return;G.animT=0;
  const cfg=animaisCfg(),cont={};for(const u of G.units)if(u.kind==='animal')cont[u.sp]=(cont[u.sp]||0)+1;
  const faltam=Object.keys(cfg).filter(sp=>(cont[sp]||0)<cfg[sp]);if(!faltam.length)return;
  const sp=faltam[(rnd()*faltam.length)|0],p=animalSpot(15);if(p)spawnAnimal(sp,p[0],p[1])}
function engage(u,t){const d=Math.hypot(t.x-u.x,t.y-u.y);
  if(d<=u.range){u.path=null;u.moving=false;u.face=(t.x-u.x)-(t.y-u.y)>0?1:-1;if(u.atkCd<=0){u.atkCd=u.rate;u.swing=.3;attack(u,t)}return true}
  if(u.repath||!u.path||!u.path.length){u.repath=false;const[tx,ty]=utile(t);const p=astar(...utile(u),nearRect(tx,ty,1,1),tx,ty,u.kind==='raider'?passR:passV,3000);if(p)u.path=p}
  return false}
// fogueira acesa: animal não entra a menos de 3 tiles dela
function pertoFogo(x,y){return G.decor.some(d=>d.k==='campfire'&&Math.hypot(d.x-x,d.y-y)<3)}
function updAnimal(u,dt){
  u.atkCd-=dt;u.thinkT-=dt;const A=ANIMAIS[u.sp],pl=PL(),veP=!!pl&&!pl.down;
  if(pertoFogo(u.x,u.y)){u.target=null;u.path=null}
  if(u.path&&u.path.length&&pertoFogo(u.path[0][0]+.5,u.path[0][1]+.5))u.path=null;
  if(u.thinkT<=0){u.thinkT=.35+rnd()*.25;u.repath=true;
    const dP=veP?Math.hypot(pl.x-u.x,pl.y-u.y):1e9;
    if(A.comportamento==='foge'){const silencioso=veP&&(armaDe(pl).efeito||[]).includes('silencioso');
      if(dP<A.medo&&!(silencioso&&dP>2))u.fleeT=Math.max(u.fleeT,G.t+3)}
    else if(veP&&dP<=A.aggro&&G.t>=(u.desistiuT||0)&&!pertoFogo(pl.x,pl.y)){if(!u.target)u.chaseT=G.t;u.target=pl.id;
      if(A.bando)for(const v of G.units)if(v!==u&&v.kind==='animal'&&v.sp===u.sp&&!v.target&&Math.hypot(v.x-u.x,v.y-u.y)<6)v.target=pl.id}
    if(u.target){const t=UMAP.get(u.target);const longe=!t||t.hp<=0||t.down||Math.hypot(t.x-u.x,t.y-u.y)>12||G.t-(u.chaseT||0)>10;if(longe){u.target=null;u.desistiuT=G.t+20}}}
  if(u.target){const t=UMAP.get(u.target);
    if(t){if(engage(u,t))return;if(moveUnit(u,dt))return}}
  if(u.fleeT>G.t&&veP){
    if(!u.path||!u.path.length){const dx=u.x-pl.x,dy=u.y-pl.y,d=Math.hypot(dx,dy)||1;
      const tx=clamp(Math.floor(u.x+dx/d*7),0,N-1),ty=clamp(Math.floor(u.y+dy/d*7),0,N-1);
      const p=astar(...utile(u),(x,y)=>x===tx&&y===ty,tx,ty,passV,800);if(p)u.path=p}
    if(moveUnit(u,dt))return}
  if(moveUnit(u,dt))return;
  u.idleT=(u.idleT||0)-dt;
  if(u.idleT<=0){u.idleT=2.5+rnd()*4;const tx=clamp(Math.floor(u.home[0])+((rnd()*9)|0)-4,0,N-1),ty=clamp(Math.floor(u.home[1])+((rnd()*9)|0)-4,0,N-1);
    if(passV(tx,ty)){const p=astar(...utile(u),(x,y)=>x===tx&&y===ty,tx,ty,passV,400);if(p)u.path=p}}}

/* ---- saqueadores: o da onda define vida, dano e se leva tocha (fogo contra construção de madeira) ---- */
function spawnSaqueador(x,y,onda){const S=CB.saqueador,tocha=onda>=S.tocha_a_partir_da_onda&&rnd()<S.chance_tocha;
  const hp=S.hp_base+onda*S.hp_por_onda;
  return spawnUnit('raider',x,y,{hp,max:hp,dmg:tocha?S.dano_tocha:S.dano_base+onda*S.dano_por_onda,tipo:tocha?'fogo':S.tipo,tipoB:tocha?'fogo':S.tipo,
    range:S.alcance,rate:S.vel_ataque,speed:S.vel,efeito:[],
    tunic:pick(['#7d2219','#5a1a14','#2e2a28','#6b2a1e']),hair:pick(['#2a1d14','#6b3d1f','#3b2a1d'])})}

/* ---- tick de combate do jogador (chamado a cada quadro antes de agir) ---- */
function combateTick(u,dt){folTick(u,dt);u.atkCd=Math.max(0,(u.atkCd||0)-dt)}

/* save da versão 3 para a 4: recursos e itens novos começam em zero; animais são espalhados */
function migraV4(){for(const k in RES){G.inv[k]??=0;G.res[k]??=0}for(const k in ITEMS)G.items[k]??=0;
  if(!G.units.some(u=>u.kind==='animal'))spawnAnimais()}
