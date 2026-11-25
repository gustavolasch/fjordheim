/* ================= Mundo vivo (0.9): névoa, lugares, eventos, mercador e sagas =================
   Lugares: G.lugares [{id,k:'ruina'|'naufragio'|'acampamento',x,y,feito,visitado}]. Sem névoa: o mapa inteiro aparece; 'visitado' some o '?'.
   Saqueadores de acampamento: units kind 'raider' com camp = id do lugar (não entram em invasão).
   Receitas aprendidas: G.receitas. Sagas concluídas: G.sagas {id:true}. Números em data/mundo.json (MUNDO). */
function lugarPorId(id){return(G.lugares||[]).find(p=>p.id===id)}
function lugarEm(x,y){return(G.lugares||[]).find(p=>p.x===x&&p.y===y)||null}
function nearAgua(x,y){for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(inb(x+dx,y+dy)&&G.tiles[idx(x+dx,y+dy)]<=1)return true;return false}
function sorteiaLugares(kinds){const r=mulberry32((G.seed^0x5a17)>>>0),L=MUNDO.lugares,out=[];
  for(const k of kinds||['ruina','naufragio','acampamento','templo']){
    for(let j=0;j<L[k].quantidade;j++){let spot=null;
      for(let t=0;t<4000&&!spot;t++){const x=(r()*N)|0,y=(r()*N)|0,i=idx(x,y);
        if(!landT(G.tiles[i])||G.obj[i]||G.occ[i])continue;
        if(Math.hypot(x-G.start[0],y-G.start[1])<MUNDO.distancia_minima)continue;
        if(out.some(p=>Math.hypot(p.x-x,p.y-y)<8))continue;
        if(k==='naufragio'&&!nearAgua(x,y))continue;
        spot=[x,y]}
      if(spot)out.push({id:G.idc++,k,x:spot[0],y:spot[1],feito:false})}}
  return out}
// acampamento: saqueadores paradinhos no lugar até alguém atacar
function spawnCampo(p){
  if(p.k==='templo'){const T=MUNDO.lugares.templo,n=T.guardas;
    for(let k=0;k<n;k++){const u=spawnSaqueador(p.x+.5+(k%2)*1.2,p.y+.5+((k/2)|0)*1.2,0);u.camp=p.id}
    const c=spawnSaqueador(p.x+.5,p.y+.5-1.2,0);c.hp*=T.chefe.hp_mult;c.max*=T.chefe.hp_mult;c.dmg*=T.chefe.dano_mult;c.name=T.chefe.nome;c.chefe=true;c.camp=p.id;
    if(p.prisioneiros==null)p.prisioneiros=T.prisioneiros.min+((Math.random()*(T.prisioneiros.max-T.prisioneiros.min+1))|0);
    return}
  const n=MUNDO.lugares.acampamento.saqueadores;
  for(let k=0;k<n;k++){const u=spawnSaqueador(p.x+.5+(k%2)*1.2,p.y+.5+((k/2)|0)*1.2,0);u.camp=p.id}}
function updCampRaider(u,dt){u.atkCd-=dt;u.thinkT-=dt;
  if(u.thinkT<=0){u.thinkT=.5+Math.random()*.3;
    const e=nearestUnit(u.x,u.y,4.5,v=>v.kind==='warrior'||(v.kind==='villager'&&!v.hidden)||(v.kind==='player'&&!v.down));
    u.target=e?e.id:null;
    if(e){if(Math.hypot(e.x-u.x,e.y-u.y)>u.range){const[tx,ty]=utile(e);u.path=astar(...utile(u),nearRect(tx,ty,1,1),tx,ty,passR,3000)}}
    else{const p=lugarPorId(u.camp);if(p&&Math.hypot(p.x+.5-u.x,p.y+.5-u.y)>2.5){const pa=astar(...utile(u),nearRect(p.x,p.y,1,1),p.x,p.y,passR,3000);if(pa)u.path=pa}}}
  const t=u.target&&UMAP.get(u.target);
  if(t&&!t.hidden&&!t.down&&Math.hypot(t.x-u.x,t.y-u.y)<=u.range){u.path=null;u.moving=false;u.face=(t.x-u.x)-(t.y-u.y)>0?1:-1;if(u.atkCd<=0){u.atkCd=u.rate;u.swing=.3;attack(u,t)}return}
  moveUnit(u,dt)}
function ganhaSaque(loot){for(const k in loot)addInv(k,loot[k])}
function lootTexto(loot){return Object.keys(loot).map(k=>`[[recursos.${k}]]${loot[k]}`).join(' ')}

// ---- mercador (kind 'merchant'): fica um tempo na praia ----
function updMerchant(u,dt){u.vida-=dt;if(u.vida<=0){toast('⛵ O mercador partiu.');removeUnit(u)}}

// ---- eventos aleatórios ----
function novoEvento(){const E=MUNDO.eventos;return E.intervalo_min+Math.random()*(E.intervalo_max-E.intervalo_min)}
function praiaLivre(){for(let k=0;k<400;k++){const x=(Math.random()*N)|0,y=(Math.random()*N)|0,i=idx(x,y);
  if(!landT(G.tiles[i])||G.obj[i]||G.occ[i]||!nearAgua(x,y))continue;return[x,y]}return null}
function evTempestade(){let caem=0;
  for(let k=0;k<2000&&caem<MUNDO.tempestade.arvores;k++){const i=(Math.random()*N*N)|0,o=G.obj[i];if(!o||o.t!=='tree'||o.g<1)continue;o.hp=1;chopHit(i,o);caem++}
  const n=praiaLivre();let nau=false;if(n){const a=spawnUnit('wanderer',n[0]+.5,n[1]+.5,{vida:PESSOAS.andarilho.tempo_fica,cool:1});nau=!!a}
  toast(`⛈️ Tempestade! ${caem} árvore(s) caíram.${nau?' Um náufrago chegou pela praia.':''}`,'bad')}
function evMercador(){const n=praiaLivre();if(!n)return;
  spawnUnit('merchant',n[0]+.5,n[1]+.5,{name:'Mercador',vida:MUNDO.mercador.segundos,cool:0});
  G.flags.mercador=true;toast('⛵ Um mercador chegou de barco. Toque nele para ver as trocas.','good')}
function evLobos(){const M=MUNDO.lobos,pl=PL();if(!pl)return;let n=0;
  for(let k=0;k<600&&n<M.quantidade;k++){const d=M.distancia_min+Math.random()*(M.distancia_max-M.distancia_min),a=Math.random()*6.283;
    const x=Math.round(pl.x+Math.cos(a)*d),y=Math.round(pl.y+Math.sin(a)*d);if(!inb(x,y))continue;const i=idx(x,y);
    if(!landT(G.tiles[i])||G.obj[i]||G.occ[i])continue;spawnAnimal('lobo',x,y);n++}
  if(n)toast('🐺 Uma matilha de lobos apareceu por perto!','bad')}
function disparaEvento(){const P=MUNDO.eventos.pesos;let tot=0;for(const k in P)tot+=P[k];let r=Math.random()*tot;
  for(const k in P){r-=P[k];if(r<0){({tempestade:evTempestade,mercador:evMercador,lobos:evLobos})[k]();return}}}

// ---- sagas ----
function condOk(c){
  if(G.t<(c.dias||0)*DIA())return false;
  const aldeoes=G.units.filter(u=>u.kind==='villager').length;
  switch(c.tipo){
    case'casa_fogueira':return G.bld.some(b=>b.done&&b.type==='shelter')&&G.decor.some(d=>d.k==='campfire');
    case'moradores':return aldeoes>=c.n;
    case'sem_perdas_inverno':return (G.perdas||0)===0&&aldeoes>0&&foodStock()>=c.comida;
    case'ferro_invasao':return have('lingote')>=1&&(G.invasoesRepelidas||0)>=1;
    case'moradores_mercador':return aldeoes>=c.n&&!!G.flags.mercador;
    case'predio':return G.bld.some(b=>b.done&&b.type===c.b)}
  return false}
function sagasTick(){G.sagas=G.sagas||{};
  for(const s of MUNDO.sagas){if(G.sagas[s.id]||!condOk(s.cond))continue;
    G.sagas[s.id]=true;const R=s.recompensa;
    for(const k in R.res||{})ganhaEstoque(k,R.res[k]);
    toast(`📜 Saga concluída: ${s.n}`,'good')}}

// tick do mundo (roda em update)
function mundoTick(dt){if(!G.lugares)return;for(const k of FERR_KEYS())garantiaFerr(k);
  const pl=PL();if(pl)for(const p of G.lugares)if(!p.visitado&&Math.hypot(p.x+.5-pl.x,p.y+.5-pl.y)<=3)p.visitado=true;
  if(!G.demo&&!G.raidOn){if(G.evT==null)G.evT=novoEvento();G.evT-=dt;if(G.evT<=0){G.evT=novoEvento();disparaEvento()}}
  for(const p of G.lugares){if(p.feito||p.aguarda||(p.k!=='acampamento'&&p.k!=='templo'))continue;
    if(!G.units.some(u=>u.kind==='raider'&&u.camp===p.id)){
      if(p.k==='templo'){p.aguarda=true;toast('🛕 O chefe caiu. Escolha: libertar os prisioneiros ou deixá-los.','good');continue}
      p.feito=true;ganhaSaque(MUNDO.lugares.acampamento.loot);
      toast(`🏕️ Acampamento vencido! Saque: ${lootTexto(MUNDO.lugares.acampamento.loot)}`,'good')}}
  if(G.raidPrev&&!G.raidOn&&!(G.saqueT!=null&&G.t-G.saqueT<2))G.invasoesRepelidas=(G.invasoesRepelidas||0)+1;
  G.raidPrev=G.raidOn;
  G.sagaT=(G.sagaT||0)-dt;if(G.sagaT<=0){G.sagaT=2;sagasTick()}}

// ---- o que o jogador faz ao chegar num lugar ----
CMDS.poi=(u,c)=>{const p=lugarPorId(c.id);if(!p||p.feito||p.k==='acampamento')return cmdFail('','');setOrder(u,{type:'poi',id:p.id});return{ok:true}};
function aprendeReceita(){const R=MUNDO.lugares.ruina.receitas.filter(k=>!G.receitas.includes(k));if(!R.length)return null;G.receitas.push(R[0]);novidade('item',R[0]);return R[0]}
function poiChegou(u,o){const p=lugarPorId(o.id);if(!p||p.feito){u.order=null;return}
  if(!(Math.hypot(p.x+.5-u.x,p.y+.5-u.y)<=1.6)){stepTo(u,o,p.x,p.y,1,1);return}
  o.tries=0;
  if(p.k==='ruina'){p.feito=true;u.order=null;const r=aprendeReceita();
    if(r)toast(`📜 Você aprendeu a receita: ${ITEMS[r].n}. Veja em Criar.`,'good');else toast('📜 Nada mais a aprender nestas ruínas.');return}
  u.act={type:'salvage',t:0,dur:2.5,id:p.id}}
function poiSalvo(u,a){const p=lugarPorId(a.id);if(!p||p.feito)return;p.feito=true;ganhaSaque(MUNDO.lugares.naufragio.loot);
  toast(`⛵ Naufrágio revistado: ${lootTexto(MUNDO.lugares.naufragio.loot)}`,'good')}
function drawLugar(p){const x=p.x,y=p.y,q=P(x+.5,y+.5,0),a=p.feito?.4:1;ctx.save();ctx.globalAlpha=a;
  if(p.k==='templo'){ell(q[0],q[1],13,5,'rgba(0,0,0,.22)');pp([[q[0]-12,q[1]],[q[0]+12,q[1]],[q[0]+12,q[1]-3],[q[0]-12,q[1]-3]],'#9c9486');for(const dx of[-8,-3,2,7])ln([q[0]+dx,q[1]-3],[q[0]+dx,q[1]-20],'#d8d0bd',3);pp([[q[0]-11,q[1]-20],[q[0]+11,q[1]-20],[q[0]+7,q[1]-25],[q[0]-7,q[1]-25]],'#8a8272')}
  else if(p.k==='ruina'){ell(q[0],q[1],9,4,'rgba(0,0,0,.2)');for(const dx of[-5,0,5])ln([q[0]+dx,q[1]],[q[0]+dx,q[1]-14],'#c9c2b0',3.2);ln([q[0]-8,q[1]-14],[q[0]+6,q[1]-14],'#b0a894',2.4)}
  else if(p.k==='naufragio'){ell(q[0],q[1],10,3,'rgba(0,0,0,.2)');pp([[q[0]-8,q[1]],[q[0]+8,q[1]-3],[q[0]+6,q[1]+2]],'#7a4e2a');ln([q[0],q[1]],[q[0]+2,q[1]-22],'#5a3a22',1.6);pp([[q[0]+2,q[1]-22],[q[0]+9,q[1]-10],[q[0]+2,q[1]-8]],'#eee6d2')}
  else{ell(q[0],q[1],10,4,'rgba(0,0,0,.2)');pp([[q[0]-9,q[1]],[q[0],q[1]-16],[q[0]+9,q[1]]],'#8a5a3a');pp([[q[0]-3,q[1]],[q[0],q[1]-8],[q[0]+3,q[1]]],'#3a2414');ell(q[0]+12,q[1]-1,2.2,1.4,'#ff8a2a')}
  ctx.restore();
  if(!p.visitado){ctx.save();ctx.font='900 15px Nunito, sans-serif';ctx.textAlign='center';ctx.lineWidth=3.5;ctx.strokeStyle='rgba(20,14,8,.85)';ctx.fillStyle='#ffd34a';const qy=P(x+.5,y+.5,46);ctx.strokeText('?',qy[0],qy[1]);ctx.fillText('?',qy[0],qy[1]);ctx.restore()}
}

// ---- painéis: lugar, mercador e sagas ----
function poiTap(p){if(p.k==='acampamento'||p.k==='templo'||p.feito){sel={k:'p',id:p.id};openSheet('info');return}sendCmd({t:'poi',id:p.id});puff(p.x+.5,p.y+.5,'ring')}
function poiHTML(id){const p=lugarPorId(id);if(!p)return null;const L=MUNDO.lugares[p.k];
  if(p.k==='templo'){const vivos=G.units.filter(u=>u.kind==='raider'&&u.camp===p.id).length;
    if(p.aguarda)return head(L.n,'O chefe caiu. Os prisioneiros são seus.')+`<p class="hint">Prisioneiros: ${p.prisioneiros}. Para acolher bem, a vila precisa de vaga na Barraca.</p><div class="row"><button class="gbtn" data-a="templo" data-v="libertar">⛓️ Libertar</button><button class="sbtn" data-a="templo" data-v="deixar">💰 Deixá-los (recompensa, moral cai)</button></div>`;
    return head(L.n,p.feito?'Já resolvido.':'Chefe e guardas defendem os prisioneiros.')+`<p class="hint">${p.feito?(p.escolha==='libertar'?'Você libertou os prisioneiros.':'Você deixou os prisioneiros.'):`Guardas e chefe vivos: ${vivos}. Vença todos para escolher.`}</p>`}
  if(p.k==='acampamento'){const n=G.units.filter(u=>u.kind==='raider'&&u.camp===p.id).length;
    return head(L.n,'Saqueadores acampados.')+`<p class="hint">${p.feito?'Acampamento vencido.':`Saqueadores vivos: ${n}. Ataque tocando neles. Vença todos para pegar o saque.`}</p><p class="small">Saque: ${lootTexto(L.loot)}</p>`}
  return head(L.n,p.feito?'Já visitado.':'Toque para visitar.')}
function merchantHTML(m){return head('Mercador','Trocas de barco. Só você decide.')+`<div class="row" style="flex-wrap:wrap">`+
  MUNDO.mercador.ofertas.map((o,i)=>`<button class="sbtn" data-a="trade" data-v="${i}" ${afford(o.dar)?'':'disabled'}>${costHTML(o.dar)} → ${Object.keys(o.receber).map(k=>`${icon('recursos',k)}${o.receber[k]}`).join(' ')}</button>`).join('')+`</div>`}
function sagaHTML(){const done=G.sagas||{};
  return MUNDO.sagas.map(s=>{const R=Object.keys(s.recompensa.res||{}).map(k=>`${icon('recursos',k)}${s.recompensa.res[k]}`).join(' ');
    return `<div class="item"><div class="top"><b>${done[s.id]?'✅':'⬜'} ${s.n}</b></div><div class="small">${s.desc}</div><div class="small">Recompensa: ${R||'nada'}</div></div>`}).join('')}
// migração v11: saves antigos ganham um templo (com guardas e chefe)
function migraV11(){if(!G.lugares)return;if(G.lugares.some(p=>p.k==='templo'))return;
  const novo=sorteiaLugares(['templo']);for(const p of novo){G.lugares.push(p);spawnCampo(p)}}
// migração v8: mundo vivo para saves antigos (névoa começa com o que já foi visitado)
function migraV8(){if(!G.lugares)G.lugares=sorteiaLugares();
  for(const p of G.lugares)if((p.k==='acampamento'||p.k==='templo')&&!p.feito&&!G.units.some(u=>u.kind==='raider'&&u.camp===p.id)&&!p.aguarda)spawnCampo(p);
  G.receitas=G.receitas||[];G.sagas=G.sagas||{};G.perdas=G.perdas||0;G.invasoesRepelidas=G.invasoesRepelidas||0}
// templo: libertar (prisioneiros viram moradores com cama) ou deixar (recompensa e moral da vila caem)
CMDS.temploEsc=(u,c)=>{const p=lugarPorId(c.id);if(!p||p.k!=='templo'||!p.aguarda||p.feito)return cmdFail('','');
  const T=MUNDO.lugares.templo;
  if(c.c==='libertar'){let solto=0;const n=p.prisioneiros||0;
    let semCama=0;
    for(let k=0;k<n;k++){const cama=acharCama();if(!cama)semCama++;
      spawnUnit('villager',p.x+.5+(k%2)*.8,p.y+1.5,{vida:null,cool:0,path:null,act:null,hidden:false,cama:cama?cama.id:null,moral:cama?PESSOAS.moral.inicial:T.libertar.moral_sem_cama,comeu:false,fome:false,hab:{lumber:0,miner:0,collector:0},tracos:sorteiaTracos(),dormindo:false,indo:false});solto++}
    toast(`⛓️ ${solto} prisioneiro(s) viraram moradores.${semCama?` ${semCama} sem vaga: dormem perto da fogueira até haver lugar na Barraca.`:''}`,'good')}
  else if(c.c==='deixar'){const R=T.deixar.recompensas[(Math.random()*T.deixar.recompensas.length)|0];
    if(R.res)for(const k in R.res)ganhaEstoque(k,R.res[k]);
    if(R.item){ferrAdd(R.item)}
    for(const v of G.units)if(v.kind==='villager')v.moral=Math.max(0,(v.moral??PESSOAS.moral.inicial)-T.deixar.moral_perda);
    toast(`🛕 Você deixou os prisioneiros. Recompensa: ${R.res?lootTexto(R.res):ITEMS[R.item].n}. A vila ficou inquieta.`,'good')}
  else return cmdFail('','');
  p.feito=true;p.aguarda=false;p.escolha=c.c;return{ok:true}};
// troca com o mercador: paga a oferta e recebe os itens na mochila
CMDS.trade=(u,c)=>{const m=UMAP.get(c.id);if(!m||m.kind!=='merchant')return cmdFail('','');
  const o=MUNDO.mercador.ofertas[c.i];if(!o)return cmdFail('','');
  if(!afford(o.dar))return cmdFail('Faltam recursos');
  pay(o.dar);for(const k in o.receber)addInv(k,o.receber[k]);return{ok:true}};

// ---- portões: abrem sozinhos quando jogador, amigo ou morador chega perto; animais e inimigos não abrem ----
function gateTick(dt){const Q=MUNDO.portoes;
  for(const b of G.bld){if(!b.done||!BD[b.type].gate)continue;
    const cx=b.x+.5,cy=b.y+.5;
    const perto=G.units.some(u=>(u.kind==='player'||(u.kind==='villager'&&!u.hidden))&&Math.hypot(u.x-cx,u.y-cy)<=Q.raio_abre);
    if(perto){b.aberto=true;b.fechaT=Q.fecha_depois_seg}
    else if(b.aberto){b.fechaT=(b.fechaT??0)-dt;if(b.fechaT<=0)b.aberto=false}
    const alvo=b.aberto?1:0,v=Q.tempo_abre_seg>0?dt/Q.tempo_abre_seg:1;
    b.anim=(b.anim||0)+clamp(alvo-(b.anim||0),-v,v)}}
// portão fechado bloqueia animais (inimigos já atacam portões)
function gateFechado(x,y){const c=bAt(x,y);return!!c&&!!BD[c.type].gate&&c.done&&!c.aberto}

// ---- Casa Comunal: aviso do primeiro assentamento e bandeira ----
function bandeiraAtual(){return G.bandeira||{...MUNDO.bandeira.inicial}}
// desenha o pano da bandeira (fundo, padrão na cor 1, símbolo com a cor 2)
function desenhaBandeira(x,y,w,h,B){const D=MUNDO.bandeira;
  pp([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],B.fundo);
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.fillStyle=B.cor1;ctx.strokeStyle=B.cor1;
  if(B.padrao==='listras')ctx.fillRect(x,y+h*.4,w,h*.2);
  else if(B.padrao==='cruz'){ctx.fillRect(x+w*.4,y,w*.2,h);ctx.fillRect(x,y+h*.4,w,h*.2)}
  else if(B.padrao==='diagonal'){ctx.lineWidth=Math.max(1.2,h*.18);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y+h);ctx.stroke()}
  ctx.restore();
  ell(x+w/2,y+h/2,h*.4,h*.4,B.cor2);
  ctx.save();ctx.font=`${Math.round(h*.6)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(D.simbolos[B.simbolo]||'',x+w/2,y+h/2+.5);ctx.restore()}
// mastro e bandeira no alto da Casa Comunal
function dBandeira(b){const z=BD.longhouse.wallH;const base=P(b.x+1.5,b.y+1.5,z+16),top=P(b.x+1.5,b.y+1.5,z+46);
  ln(base,top,'#4a3420',1.6);desenhaBandeira(top[0]+1,top[1],13,10,bandeiraAtual())}
function assentoHTML(){return head('Primeiro assentamento',MUNDO.assento.aviso)+`<div class="row"><button class="gbtn" data-a="bandeiraAbre">🏴 ${MUNDO.assento.botao}</button></div>`}
// miniatura da bandeira no painel (mesmas regras do desenho)
function svgBandeira(B){const D=MUNDO.bandeira;
  let pad='';if(B.padrao==='listras')pad=`<rect x="0" y="${64*.4}" width="96" height="${64*.2}" fill="${B.cor1}"/>`;
  else if(B.padrao==='cruz')pad=`<rect x="${96*.4}" y="0" width="${96*.2}" height="64" fill="${B.cor1}"/><rect x="0" y="${64*.4}" width="96" height="${64*.2}" fill="${B.cor1}"/>`;
  else if(B.padrao==='diagonal')pad=`<line x1="0" y1="0" x2="96" y2="64" stroke="${B.cor1}" stroke-width="10"/>`;
  return `<svg width="96" height="64" viewBox="0 0 96 64" style="border-radius:6px;background:${B.fundo}"><rect width="96" height="64" fill="${B.fundo}"/>${pad}<circle cx="48" cy="32" r="${64*.4}" fill="${B.cor2}"/><text x="48" y="34" font-size="36" text-anchor="middle" dominant-baseline="middle">${D.simbolos[B.simbolo]||''}</text></svg>`}
function bandeiraHTML(){const B=bandeiraAtual(),D=MUNDO.bandeira;
  const sw=(k,v,on)=>`<button class="sbtn" data-a="bandeiraSet" data-v="${k}:${v}" style="background:${v};width:34px;height:30px;padding:0;border:${on?'3px solid #f3c969':'1px solid #555'}"></button>`;
  const bt=(k,v,label,on)=>`<button class="sbtn ${on?'on':''}" data-a="bandeiraSet" data-v="${k}:${v}">${label}</button>`;
  return head('Sua bandeira','Escolha as cores, o padrão e o símbolo. Ela aparece na Casa Comunal.')+
    `<div class="row" style="justify-content:center">${svgBandeira(B)}</div>`+
    `<h4>Cor de fundo</h4><div class="row">${D.fundos.map(c=>sw('fundo',c,B.fundo===c)).join('')}</div>`+
    `<h4>Padrão</h4><div class="row">${Object.keys(D.padroes).map(k=>bt('padrao',k,D.padroes[k],B.padrao===k)).join('')}</div>`+
    `<h4>Símbolo</h4><div class="row">${Object.keys(D.simbolos).map(k=>bt('simbolo',k,D.simbolos[k],B.simbolo===k)).join('')}</div>`+
    `<h4>Cor do padrão</h4><div class="row">${D.cores.map(c=>sw('cor1',c,B.cor1===c)).join('')}</div>`+
    `<h4>Cor do símbolo</h4><div class="row">${D.cores.map(c=>sw('cor2',c,B.cor2===c)).join('')}</div>`}
// só aceita valores da lista do JSON
CMDS.bandeiraSet=(u,c)=>{const D=MUNDO.bandeira;const ok={fundo:D.fundos,padrao:Object.keys(D.padroes),simbolo:Object.keys(D.simbolos),cor1:D.cores,cor2:D.cores}[c.k];
  if(!ok||!ok.includes(c.v))return cmdFail('','');G.bandeira={...bandeiraAtual(),[c.k]:c.v};return{ok:true}};
