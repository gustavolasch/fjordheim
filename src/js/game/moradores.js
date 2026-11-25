/* ================= Moradores (0.6): cama, comida, moral, habilidades, traços e rotina =================
   Morador = kind 'villager'. Campos próprios (salvos no save, todos com valor padrão na migração v6):
   cama (id do prédio ou null), moral (0..100), comeu (comeu no último amanhecer), fome (não conseguiu comer),
   hab ({job: xp}), tracos ([bom, ruim]), dormindo (bool).
   Todos os números vêm de data/pessoas.json (PESSOAS). */
const DIA=()=>PESSOAS.dia_segundos;
const TRAIT_KEYS=Object.keys(PESSOAS.tracos);
const HAB_ACOES=['chop','takelog','mine','pick','plot','fish','forge'];
const HAB_TRABALHOS=['lumber','miner','collector','farmer','fisher','smith'];

// noite: mesmo ciclo do dia e noite (independe da opção "dia e noite" estar ligada)
function isNoite(){return nightDark(G.t)>0}

// ---- moradias: ajudantes dormem na Barraca (coletiva). Abrigo e Casa têm um só dono (house:1) e
// são entregues por pedido de nível. O primeiro Abrigo fica reservado para o jogador. ----
function ocupacao(b){let c=0;for(const u of G.units)if(u.kind==='villager'&&u.cama===b.id)c++;return c}
function acharCama(){for(const b of G.bld){if(!b.done||!BD[b.type].coletiva)continue;if(ocupacao(b)<BD[b.type].house)return b}return null}
// vagas livres nas Barracas, descontando quem ainda espera uma
function vagasBarraca(){let v=0;for(const b of G.bld)if(b.done&&BD[b.type].coletiva)v+=BD[b.type].house-ocupacao(b);
  return v-G.units.filter(u=>u.kind==='villager'&&u.cama==null).length}
function abrigoDoJogador(){let b=G.abrigoJogador!=null?BMAP.get(G.abrigoJogador):null;
  if(!b){b=G.bld.find(x=>x.done&&x.type==='shelter'&&!ocupacao(x))||null;G.abrigoJogador=b?b.id:null}
  return b}
function camaDo(u){const b=u.cama!=null?BMAP.get(u.cama):null;return b&&b.done?b:null}
// tenta dar cama a quem não tem (ou perdeu a cama numa demolição)
// dá cama a quem nunca teve uma (cama=null). Cama destruída fica com o id antigo e não é reatribuída.
function acertaCamas(){for(const u of G.units){if(u.kind!=='villager')continue;if(u.cama==null){const b=acharCama();u.cama=b?b.id:null;if(b)u.carenciaAte=0}}}

// ---- pedidos de moradia: u.pedido = {tipo:'abrigo'|'casa', desde:G.t} ----
// o que o morador precisa e ainda não tem (ou null)
function moradiaDevida(u){const P=PESSOAS.pedidos,n=maiorNivel(u),b=camaDo(u),t=b?b.type:null;
  if(n>=P.casa.nivel&&t===P.abrigo.predio)return'casa';
  if(n>=P.abrigo.nivel&&t!==P.abrigo.predio&&t!==P.casa.predio)return'abrigo';
  return null}
function moradiaLivre(tipo){const meu=abrigoDoJogador();return G.bld.find(b=>b.done&&b.type===tipo&&b!==meu&&!ocupacao(b))||null}
function diasDoPedido(u){return u.pedido?Math.max(0,PESSOAS.pedidos.prazo_dias-(G.t-u.pedido.desde)/DIA()):0}
function mudaPara(u,b){u.cama=b.id;u.carenciaAte=0;u.pedido=null;u.moral=clamp(u.moral+PESSOAS.pedidos.bonus_moral,0,100);
  toast(`🏠 ${u.name} se mudou: ${BD[b.type].n}. A moral subiu.`,'good')}
// entrega moradia livre a quem pediu; sem ela, abre o pedido. Retorna false se o morador foi embora.
function pedidoTick(u){const P=PESSOAS.pedidos;
  const tipo=moradiaDevida(u);
  if(!tipo){u.pedido=null;return true}
  // quem já está no nível da Casa e ainda mora na Barraca pode ir direto para uma Casa livre
  const livre=(maiorNivel(u)>=P.casa.nivel&&moradiaLivre(P.casa.predio))||moradiaLivre(P[tipo].predio);
  if(livre){mudaPara(u,livre);return true}
  if(!u.pedido||u.pedido.tipo!==tipo){u.pedido={tipo,desde:G.t,dias:null};
    toast(`🗣️ ${u.name} ${P[tipo].pede}. Prazo: ${P.prazo_dias} dias.`,'bad')}
  const falta=diasDoPedido(u),d=Math.ceil(falta);
  if(tipo==='abrigo'){
    if(falta<=0){unassign(u);removeUnit(u);toast(`🚶 ${u.name} foi embora: ficou sem um Abrigo.`,'bad');return false}
    if(d<P.prazo_dias&&u.pedido.dias!==d){u.pedido.dias=d;toast(`⏳ ${u.name} vai embora em ${d} dia${d>1?'s':''} sem um Abrigo.`,'bad')}}
  if(!u.fala&&!u.dormindo&&G.t>=(u.balaoT||0)){u.balaoT=G.t+P.balao_intervalo;u.fala={txt:P[tipo].fala,t:P.balao_seg}}
  return true}

// ---- traços: 1 bom e 1 ruim, sorteados da lista do JSON ----
function sorteiaTracos(){
  const bons=TRAIT_KEYS.filter(k=>PESSOAS.tracos[k].tipo==='bom'),ruins=TRAIT_KEYS.filter(k=>PESSOAS.tracos[k].tipo==='ruim');
  return[bons[(Math.random()*bons.length)|0],ruins[(Math.random()*ruins.length)|0]]}
function somaTraco(u,chave){let s=0;for(const t of u.tracos||[])s+=PESSOAS.tracos[t]?.efeito[chave]||0;return s}

// ---- habilidades: um nível por trabalho; cada nível custa um pouco mais que o anterior ----
// XP acumulado para chegar ao nível n: soma de (xp_base + k) para k de 1 a n-1
function xpDoNivel(n){return PESSOAS.habilidade.xp_base*(n-1)+n*(n-1)/2}
function nivelHab(u,job){const H=PESSOAS.habilidade;const xp=(u.hab&&u.hab[job])||0;let n=1;while(n<H.nivel_max&&xp>=xpDoNivel(n+1))n++;return n}
function maiorNivel(u){return Math.max(...HAB_TRABALHOS.map(j=>nivelHab(u,j)))}
function ganhaHab(u,job){const H=PESSOAS.habilidade;const antes=nivelHab(u,job);
  u.hab[job]=(u.hab[job]||0)+H.xp_por_acao*(1+somaTraco(u,'xp'));
  const depois=nivelHab(u,job);
  if(depois>antes)toast(`⬆️ ${u.name} chegou ao nível ${depois} de ${JOBNAME[job]}`,'good')}

// ---- moral: fatores de velocidade (alta trabalha mais rápido, baixa mais devagar) ----
function moralVel(u){const M=PESSOAS.moral;if(u.moral>=M.alta_acima)return 1+M.bonus_alta;if(u.moral<M.baixa_abaixo)return 1-M.penalidade_baixa;return 1}
// velocidade de trabalho do morador: habilidade do posto x moral x traços (divide a duração da ação)
function velocidadeMorador(u){const nv=HAB_TRABALHOS.includes(u.job)?nivelHab(u,u.job):1;
  const hab=1+(nv-1)*PESSOAS.habilidade.bonus_por_nivel;return Math.max(.3,hab*moralVel(u)*(1+somaTraco(u,'velocidade')))}

// ---- comida: no amanhecer cada morador come do estoque (depósito primeiro) ----
function comeDoEstoque(n){let k=n;const r=Math.min(k,G.res.food);G.res.food-=r;k-=r;const i=Math.min(k,G.inv.food);G.inv.food-=i;k-=i;return n-k}
function alimentaMoradores(){let semComer=0;
  for(const u of G.units){if(u.kind!=='villager')continue;
    const precisa=PESSOAS.necessidades.comida_dia+somaTraco(u,'comida_dia');
    if(foodStock()>=precisa){comeDoEstoque(precisa);u.comeu=true;u.fome=false}
    else{u.comeu=false;u.fome=true;semComer++}}
  return semComer}

// dia novo: come e avisa se faltou comida (um aviso por amanhecer)
function diaTick(){const d=Math.floor(G.t/DIA());if(G.dia==null){G.dia=d;return}
  if(d<=G.dia)return;const n=Math.min(d-G.dia,5);G.dia=d;
  for(let k=0;k<n;k++){const sem=alimentaMoradores();if(k===n-1&&sem>0)toast(`🍖 Sem comida para ${sem} morador(es). A moral vai cair.`,'bad')}}

// moral muda devagar, por dia de jogo, conforme cama, comida, fogueira, frio e traços
function moralTick(u,dt){const R=PESSOAS.moral.por_dia,k=dt/DIA();let d=0;
  d+=camaDo(u)?R.cama:(u.carenciaAte>G.t?0:R.sem_cama); // carência: quem perdeu a cama na mudança das moradias
  if(u.comeu)d+=R.comida;
  if(u.fome)d+=R.fome;
  const perto=isHeatNear(u);
  if(perto)d+=R.fogueira;
  else if(coldLevel(u)>=PESSOAS.moral.frio_limite)d+=R.frio;
  d+=somaTraco(u,'moral_dia');
  if(u.pedido&&u.pedido.tipo==='casa'&&diasDoPedido(u)<=0)d+=PESSOAS.pedidos.casa_penalidade_dia; // Casa não entregue no prazo
  u.moral=clamp((u.moral??PESSOAS.moral.inicial)+d*k,0,100)}

// moradores: moral, aviso, saída e camas (roda a cada quadro, barato)
function moradoresTick(dt){
  diaTick();
  G.bedT=(G.bedT||0)-dt;if(G.bedT<=0){G.bedT=2;abrigoDoJogador();acertaCamas();
    for(const u of G.units.slice())if(u.kind==='villager')pedidoTick(u)}
  for(const u of G.units)if(u.kind==='villager'&&u.fala){u.fala.t-=dt;if(u.fala.t<=0)u.fala=null}
  const M=PESSOAS.moral;
  for(const u of G.units.slice()){if(u.kind!=='villager')continue;
    moralTick(u,dt);
    if(u.moral<=M.sair_abaixo){
      unassign(u);removeUnit(u);toast(`😠 ${u.name} foi embora: a moral estava muito baixa.`,'bad');continue}
    if(u.moral<=M.aviso_abaixo){
      if(!u.warnT)u.warnT={};
      if(u.warnT.moral==null||G.t-u.warnT.moral>M.aviso_intervalo){u.warnT.moral=G.t;toast(`😟 ${u.name} está quase indo embora. Dê cama e comida.`,'bad')}}}}

// rotina da noite: vai para a cama e dorme. Sem cama, fica acordado como de dia.
function vaiDormir(u,dt){
  if(!isNoite()){u.dormindo=false;u.indo=false;return false}
  const b=camaDo(u);
  if(!b){ // sem cama: dorme perto de uma fogueira
    const fogo=G.decor.filter(d=>d.k==='campfire');
    let f=null,bd=1e9;for(const d of fogo){const dd=Math.hypot(d.x-u.x,d.y-u.y);if(dd<bd){bd=dd;f=[d.x,d.y]}}
    if(!f){u.dormindo=false;u.indo=false;return false}
    if(Math.hypot(u.x-f[0],u.y-f[1])<=2){if(!u.dormindo){u.dormindo=true;u.act=null;u.path=null;u.moving=false}return true}
    u.dormindo=false;
    if(!u.indo){u.indo=true;u.act=null;const p=astar(...utile(u),(x,y)=>Math.hypot(x+.5-f[0],y+.5-f[1])<=1.5,Math.round(f[0]),Math.round(f[1]),passV,600);
      if(!p){u.indo=false;return false}if(!p.length){u.dormindo=true;u.indo=false;return true}u.path=p}
    if(moveUnit(u,dt))return true;
    u.indo=false;return false}
  if(isNear(u,b)){if(!u.dentro)u.dentro=b.id;u.dormindo=true;u.act=null;u.path=null;u.moving=false;return true}
  u.dormindo=false;
  if(!u.indo){u.indo=true;u.act=null;if(!goRect(u,b.x,b.y,b.w,b.h)){u.indo=false;return false}}  // replaneja o caminho até a cama
  if(moveUnit(u,dt))return true;
  if(isNear(u,b)){u.dormindo=true;u.indo=false;u.act=null;return true}
  u.indo=false;return false}

// save antigo (antes da v6): completa os campos dos moradores e dá cama a quem não tem
function migraV6(){
  if(G.dia==null)G.dia=Math.floor(G.t/DIA());
  for(const u of G.units){if(u.kind!=='villager')continue;
    u.moral??=PESSOAS.moral.inicial;u.comeu??=false;u.fome??=false;u.dormindo=false;u.indo=false;
    u.hab??={lumber:0,miner:0,collector:0};u.tracos??=sorteiaTracos()}
  acertaCamas()}

// save antes da v14: só Barraca abriga ajudantes. Ninguém é removido; quem dormia em outro lugar
// ganha PESSOAS.carencia_moradia_dias sem perder moral por falta de cama.
function migraV14(){let n=0;
  for(const u of G.units){if(u.kind!=='villager')continue;
    const b=camaDo(u);if(b&&BD[b.type].coletiva)continue;
    u.cama=null;u.carenciaAte=G.t+PESSOAS.carencia_moradia_dias*DIA();n++}
  abrigoDoJogador();acertaCamas();
  if(n)toast(`⛺ Agora os ajudantes dormem na Barraca (4 vagas). Construa em até ${PESSOAS.carencia_moradia_dias} dias.`,'bad')}

// vida na vila (morador sem trabalho): passeia pela vila, senta perto de fogo e conversa com outro sem trabalho
function fogosDaVila(){const f=G.decor.filter(d=>d.k==='campfire').map(d=>[d.x,d.y]);
  for(const b of G.bld)if(b.done&&['shelter','barraca','house','longhouse','smithy'].includes(b.type))f.push([b.x+b.w/2,b.y+b.h/2]);return f}
function centroVila(){const L=longhouse();return L?[L.x+L.w/2,L.y+L.h/2]:G.start}
function fraseVila(){const F=PESSOAS.vila.frases;return F[(Math.random()*F.length)|0]}
function vidaVila(u){const V=PESSOAS.vila;
  if(u.dest&&Math.hypot(u.x-u.dest[0],u.y-u.dest[1])<=1.2){u.dest=null;
    const conv=G.units.find(v=>v!==u&&v.kind==='villager'&&!v.job&&!v.dormindo&&!v.fala&&Math.hypot(v.x-u.x,v.y-u.y)<=V.conversa_raio);
    if(conv){u.fala={txt:fraseVila(),t:V.conversa_seg};conv.fala={txt:fraseVila(),t:V.conversa_seg};u.act={type:'idle',t:0,dur:V.conversa_seg}}
    else u.act={type:'idle',t:0,dur:V.espera_seg[0]+Math.random()*(V.espera_seg[1]-V.espera_seg[0])};
    return}
  const fogos=fogosDaVila();let tx,ty;
  if(fogos.length&&Math.random()<V.chance_fogueira){const f=fogos[(Math.random()*fogos.length)|0];tx=Math.round(f[0]+(Math.random()*2-1)*1.5);ty=Math.round(f[1]+(Math.random()*2-1)*1.5)}
  else{const c=centroVila();tx=Math.round(c[0]+(Math.random()*2-1)*V.raio_passeio);ty=Math.round(c[1]+(Math.random()*2-1)*V.raio_passeio)}
  if(!inb(tx,ty)||!passV(tx,ty)){u.act={type:'idle',t:0,dur:1};return}
  const p=astar(...utile(u),(x,y)=>x===tx&&y===ty,tx,ty,passV,600);
  if(p&&p.length){u.dest=[tx+.5,ty+.5];u.path=p}else u.act={type:'idle',t:0,dur:2}}

// dentro de casa: o morador some do mapa até amanhecer; de manhã sai pela porta (lado de baixo do prédio)
function sairDaCasa(u){const b=u.dentro!=null?BMAP.get(u.dentro):null;u.dentro=null;u.dormindo=false;
  const c=b?[b.x+(b.w>>1),b.y+b.h]:[u.x,u.y];const p=freeNear(c[0],c[1],3);if(p){u.x=p[0]+.5;u.y=p[1]+.5}u.path=null;u.act=null}
