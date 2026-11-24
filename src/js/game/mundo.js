/* ================= Mundo vivo (0.9): névoa, lugares, eventos, mercador e sagas =================
   Névoa: G.visto (Uint8Array N*N), 1 = visitado. Lugares: G.lugares [{id,k:'ruina'|'naufragio'|'acampamento',x,y,feito}].
   Saqueadores de acampamento: units kind 'raider' com camp = id do lugar (não entram em invasão).
   Receitas aprendidas: G.receitas. Sagas concluídas: G.sagas {id:true}. Números em data/mundo.json (MUNDO). */
const FOG_COR='#1c2a2e';
function visto(i){return !G.visto||!!G.visto[i]}
function lugarPorId(id){return(G.lugares||[]).find(p=>p.id===id)}
function lugarEm(x,y){return(G.lugares||[]).find(p=>p.x===x&&p.y===y)||null}
function nearAgua(x,y){for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(inb(x+dx,y+dy)&&G.tiles[idx(x+dx,y+dy)]<=1)return true;return false}
function revelaEm(cx,cy,r){const x0=Math.max(0,cx-r),x1=Math.min(N-1,cx+r),y0=Math.max(0,cy-r),y1=Math.min(N-1,cy+r);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if((x-cx)*(x-cx)+(y-cy)*(y-cy)<=r*r+r)G.visto[idx(x,y)]=1}
function sorteiaLugares(){const r=mulberry32((G.seed^0x5a17)>>>0),L=MUNDO.lugares,out=[];
  for(const k of ['ruina','naufragio','acampamento']){
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
function spawnCampo(p){const n=MUNDO.lugares.acampamento.saqueadores;
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
    case'ferro_invasao':return have('iron')>=1&&(G.invasoesRepelidas||0)>=1;
    case'moradores_mercador':return aldeoes>=c.n&&!!G.flags.mercador;
    case'predio':return G.bld.some(b=>b.done&&b.type===c.b)}
  return false}
function sagasTick(){G.sagas=G.sagas||{};
  for(const s of MUNDO.sagas){if(G.sagas[s.id]||!condOk(s.cond))continue;
    G.sagas[s.id]=true;const R=s.recompensa;
    for(const k in R.res||{})ganhaEstoque(k,R.res[k]);
    toast(`📜 Saga concluída: ${s.n}`,'good')}}

// tick do mundo (roda em update)
function mundoTick(dt){if(!G.lugares)return;
  G.revT=(G.revT||0)-dt;if(G.revT<=0){G.revT=.5;const pl=PL();if(pl)revelaEm(Math.floor(pl.x),Math.floor(pl.y),MUNDO.revela_raio);
    for(const b of G.bld)if(b.done&&b.type==='tower')revelaEm(b.x,b.y,MUNDO.torre_raio)}
  if(!G.demo&&!G.raidOn){if(G.evT==null)G.evT=novoEvento();G.evT-=dt;if(G.evT<=0){G.evT=novoEvento();disparaEvento()}}
  for(const p of G.lugares){if(p.k!=='acampamento'||p.feito)continue;
    if(!G.units.some(u=>u.kind==='raider'&&u.camp===p.id)){p.feito=true;ganhaSaque(MUNDO.lugares.acampamento.loot);
      toast(`🏕️ Acampamento vencido! Saque: ${lootTexto(MUNDO.lugares.acampamento.loot)}`,'good')}}
  if(G.raidPrev&&!G.raidOn&&!(G.saqueT!=null&&G.t-G.saqueT<2))G.invasoesRepelidas=(G.invasoesRepelidas||0)+1;
  G.raidPrev=G.raidOn;
  G.sagaT=(G.sagaT||0)-dt;if(G.sagaT<=0){G.sagaT=2;sagasTick()}}

// ---- o que o jogador faz ao chegar num lugar ----
CMDS.poi=(u,c)=>{const p=lugarPorId(c.id);if(!p||p.feito||p.k==='acampamento'||!visto(idx(p.x,p.y)))return cmdFail('','');setOrder(u,{type:'poi',id:p.id});return{ok:true}};
function aprendeReceita(){const R=MUNDO.lugares.ruina.receitas.filter(k=>!G.receitas.includes(k));if(!R.length)return null;G.receitas.push(R[0]);return R[0]}
function poiChegou(u,o){const p=lugarPorId(o.id);if(!p||p.feito){u.order=null;return}
  if(!(Math.hypot(p.x+.5-u.x,p.y+.5-u.y)<=1.6)){stepTo(u,o,p.x,p.y,1,1);return}
  o.tries=0;
  if(p.k==='ruina'){p.feito=true;u.order=null;const r=aprendeReceita();
    if(r)toast(`📜 Você aprendeu a receita: ${ITEMS[r].n}. Veja em Criar.`,'good');else toast('📜 Nada mais a aprender nestas ruínas.');return}
  u.act={type:'salvage',t:0,dur:2.5,id:p.id}}
function poiSalvo(u,a){const p=lugarPorId(a.id);if(!p||p.feito)return;p.feito=true;ganhaSaque(MUNDO.lugares.naufragio.loot);
  toast(`⛵ Naufrágio revistado: ${lootTexto(MUNDO.lugares.naufragio.loot)}`,'good')}
function drawLugar(p){const x=p.x,y=p.y,q=P(x+.5,y+.5,0),a=p.feito?.4:1;ctx.save();ctx.globalAlpha=a;
  if(p.k==='ruina'){ell(q[0],q[1],9,4,'rgba(0,0,0,.2)');for(const dx of[-5,0,5])ln([q[0]+dx,q[1]],[q[0]+dx,q[1]-14],'#c9c2b0',3.2);ln([q[0]-8,q[1]-14],[q[0]+6,q[1]-14],'#b0a894',2.4)}
  else if(p.k==='naufragio'){ell(q[0],q[1],10,3,'rgba(0,0,0,.2)');pp([[q[0]-8,q[1]],[q[0]+8,q[1]-3],[q[0]+6,q[1]+2]],'#7a4e2a');ln([q[0],q[1]],[q[0]+2,q[1]-22],'#5a3a22',1.6);pp([[q[0]+2,q[1]-22],[q[0]+9,q[1]-10],[q[0]+2,q[1]-8]],'#eee6d2')}
  else{ell(q[0],q[1],10,4,'rgba(0,0,0,.2)');pp([[q[0]-9,q[1]],[q[0],q[1]-16],[q[0]+9,q[1]]],'#8a5a3a');pp([[q[0]-3,q[1]],[q[0],q[1]-8],[q[0]+3,q[1]]],'#3a2414');ell(q[0]+12,q[1]-1,2.2,1.4,'#ff8a2a')}
  ctx.restore()}

// ---- painéis: lugar, mercador e sagas ----
function poiTap(p){if(p.k==='acampamento'||p.feito){sel={k:'p',id:p.id};openSheet('info');return}sendCmd({t:'poi',id:p.id});puff(p.x+.5,p.y+.5,'ring')}
function poiHTML(id){const p=lugarPorId(id);if(!p)return null;const L=MUNDO.lugares[p.k];
  if(p.k==='acampamento'){const n=G.units.filter(u=>u.kind==='raider'&&u.camp===p.id).length;
    return head(L.n,'Saqueadores acampados.')+`<p class="hint">${p.feito?'Acampamento vencido.':`Saqueadores vivos: ${n}. Ataque tocando neles. Vença todos para pegar o saque.`}</p><p class="small">Saque: ${lootTexto(L.loot)}</p>`}
  return head(L.n,p.feito?'Já visitado.':'Toque para visitar.')}
function merchantHTML(m){return head('Mercador','Trocas de barco. Só você decide.')+`<div class="row" style="flex-wrap:wrap">`+
  MUNDO.mercador.ofertas.map((o,i)=>`<button class="sbtn" data-a="trade" data-v="${i}" ${afford(o.dar)?'':'disabled'}>${costHTML(o.dar)} → ${Object.keys(o.receber).map(k=>`${icon('recursos',k)}${o.receber[k]}`).join(' ')}</button>`).join('')+`</div>`}
function sagaHTML(){const done=G.sagas||{};
  return head('Sagas','Missões da vila. A recompensa vai para o depósito.')+MUNDO.sagas.map(s=>{const R=Object.keys(s.recompensa.res||{}).map(k=>`${icon('recursos',k)}${s.recompensa.res[k]}`).join(' ');
    return `<div class="item"><div class="top"><b>${done[s.id]?'✅':'⬜'} ${s.n}</b></div><div class="small">${s.desc}</div><div class="small">Recompensa: ${R||'nada'}</div></div>`}).join('')}
// migração v8: mundo vivo para saves antigos (névoa começa com o que já foi visitado)
function migraV8(){if(!G.visto||G.visto.length!==N*N)G.visto=new Uint8Array(N*N);
  if(!G.lugares)G.lugares=sorteiaLugares();
  for(const p of G.lugares)if(p.k==='acampamento'&&!p.feito&&!G.units.some(u=>u.kind==='raider'&&u.camp===p.id))spawnCampo(p);
  const pl=PL();if(pl)revelaEm(Math.floor(pl.x),Math.floor(pl.y),MUNDO.revela_raio);
  G.receitas=G.receitas||[];G.sagas=G.sagas||{};G.perdas=G.perdas||0;G.invasoesRepelidas=G.invasoesRepelidas||0}
// troca com o mercador: paga a oferta e recebe os itens na mochila
CMDS.trade=(u,c)=>{const m=UMAP.get(c.id);if(!m||m.kind!=='merchant')return cmdFail('','');
  const o=MUNDO.mercador.ofertas[c.i];if(!o)return cmdFail('','');
  if(!afford(o.dar))return cmdFail('Faltam recursos');
  pay(o.dar);for(const k in o.receber)addInv(k,o.receber[k]);return{ok:true}};
