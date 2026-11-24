/* ================= Moradores (0.6): cama, comida, moral, habilidades, traços e rotina =================
   Morador = kind 'villager'. Campos próprios (salvos no save, todos com valor padrão na migração v6):
   cama (id do prédio ou null), moral (0..100), comeu (comeu no último amanhecer), fome (não conseguiu comer),
   hab ({job: xp}), tracos ([bom, ruim]), dormindo (bool).
   Todos os números vêm de data/pessoas.json (PESSOAS). */
const DIA=()=>PESSOAS.dia_segundos;
const TRAIT_KEYS=Object.keys(PESSOAS.tracos);
const HAB_ACOES=['chop','takelog','mine','pick'];

// noite: mesmo ciclo do dia e noite (independe da opção "dia e noite" estar ligada)
function isNoite(){return nightDark(G.t)>0}

// ---- camas: cada morador dorme num prédio com vaga (house) ----
function ocupacao(b){let c=0;for(const u of G.units)if(u.kind==='villager'&&u.cama===b.id)c++;return c}
function acharCama(){for(const b of G.bld){if(!b.done||!BD[b.type].house)continue;if(ocupacao(b)<BD[b.type].house)return b}return null}
function camaDo(u){const b=u.cama!=null?BMAP.get(u.cama):null;return b&&b.done?b:null}
// tenta dar cama a quem não tem (ou perdeu a cama numa demolição)
function acertaCamas(){for(const u of G.units){if(u.kind!=='villager')continue;if(!camaDo(u)){const b=acharCama();u.cama=b?b.id:null}}}

// ---- traços: 1 bom e 1 ruim, sorteados da lista do JSON ----
function sorteiaTracos(){
  const bons=TRAIT_KEYS.filter(k=>PESSOAS.tracos[k].tipo==='bom'),ruins=TRAIT_KEYS.filter(k=>PESSOAS.tracos[k].tipo==='ruim');
  return[bons[(Math.random()*bons.length)|0],ruins[(Math.random()*ruins.length)|0]]}
function somaTraco(u,chave){let s=0;for(const t of u.tracos||[])s+=PESSOAS.tracos[t]?.efeito[chave]||0;return s}

// ---- habilidades: XP sobe ao agir no posto (lenhador, minerador, coletor) ----
function nivelHab(u,job){const H=PESSOAS.habilidade;const xp=(u.hab&&u.hab[job])||0;return Math.min(H.nivel_max,1+Math.floor(xp/H.xp_para_nivel))}
function ganhaHab(u,job){const H=PESSOAS.habilidade;const antes=nivelHab(u,job);
  u.hab[job]=(u.hab[job]||0)+H.xp_por_acao*(1+somaTraco(u,'xp'));
  const depois=nivelHab(u,job);
  if(depois>antes)toast(`⬆️ ${u.name} chegou ao nível ${depois} de ${JOBNAME[job]}`,'good')}

// ---- moral: fatores de velocidade (alta trabalha mais rápido, baixa mais devagar) ----
function moralVel(u){const M=PESSOAS.moral;if(u.moral>=M.alta_acima)return 1+M.bonus_alta;if(u.moral<M.baixa_abaixo)return 1-M.penalidade_baixa;return 1}
// velocidade de trabalho do morador: habilidade do posto x moral x traços (divide a duração da ação)
function velocidadeMorador(u){const nv=u.job&&DEPOT_JOBS.includes(u.job)?nivelHab(u,u.job):1;
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
  d+=camaDo(u)?R.cama:R.sem_cama;
  if(u.comeu)d+=R.comida;
  if(u.fome)d+=R.fome;
  const perto=isHeatNear(u);
  if(perto)d+=R.fogueira;
  else if(coldLevel(u)>=PESSOAS.moral.frio_limite)d+=R.frio;
  d+=somaTraco(u,'moral_dia');
  u.moral=clamp((u.moral??PESSOAS.moral.inicial)+d*k,0,100)}

// moradores: moral, aviso, saída e camas (roda a cada quadro, barato)
function moradoresTick(dt){
  diaTick();
  G.bedT=(G.bedT||0)-dt;if(G.bedT<=0){G.bedT=2;acertaCamas()}
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
  if(!b){u.dormindo=false;u.indo=false;return false}
  if(isNear(u,b)){if(!u.dormindo){u.dormindo=true;u.act=null;u.path=null;u.moving=false}return true}
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
