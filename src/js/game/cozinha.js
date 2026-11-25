/* ================= Cozinheiro: tarefa na Cozinha =================
   Um cozinheiro por Cozinha. O jogador define quanta cevada ele pode usar (b.tarefa.resta).
   Os ingredientes saem só do depósito e só são gastos quando a receita fica pronta (interromper não perde nada).
   A comida vai para o depósito. Cozinhar não dá experiência: 'cook' fica fora de HAB_TRABALHOS. */
const COZ_RECEITA='pao';
const receitaCoz=()=>OFICIO.estacoes.cozinha[COZ_RECEITA];
const passoCoz=()=>receitaCoz().entrada.cevada;
const COZ_MAX=998;
function cozinheiroDe(b){return G.units.find(u=>u.kind==='villager'&&u.job==='cook'&&u.work===b.id)||null}
function cozinhaLivre(u){return maisPerto(u,b=>b.type==='cozinha'&&!cozinheiroDe(b))}
function restaDe(b){return(b.tarefa&&b.tarefa.resta)||0}
// o que impede cozinhar agora: 'sem_tarefa' | 'falta' | 'cheio' | null
function cozinhaImpede(b){const R=receitaCoz();
  if(restaDe(b)<passoCoz())return'sem_tarefa';
  for(const k in R.entrada)if((G.res[k]||0)<R.entrada[k])return'falta';
  for(const k in R.saida)if((G.res[k]||0)+R.saida[k]>storeCap())return'cheio';
  return null}
const COZ_STATUS={sem_tarefa:'Sem tarefa. Defina a cevada no painel da Cozinha.',falta:'Falta cevada no depósito.',cheio:'Depósito cheio de comida.'};
function pensaCozinheiro(u,b){
  if(!isNear(u,b)){if(!goRect(u,b.x,b.y,b.w,b.h))u.act={type:'idle',t:0,dur:3};return}
  const motivo=cozinhaImpede(b);
  if(motivo){u.status=COZ_STATUS[motivo];
    if(motivo!=='sem_tarefa'&&u.avisoCoz!==motivo)toast(`🍳 ${u.name}: ${COZ_STATUS[motivo]}`,'bad');
    u.avisoCoz=motivo;u.act={type:'idle',t:0,dur:3};return}
  u.status='Cozinhando';u.avisoCoz=null;faceTo(u,b.x+b.w/2,b.y+b.h/2);
  u.act={type:'cook',b:b.id,t:0,dur:receitaCoz().tempo*toolF(u)}}
function cozinhaPronto(u,a){const b=BMAP.get(a.b);if(!b||cozinhaImpede(b))return;const R=receitaCoz();
  for(const k in R.entrada)G.res[k]-=R.entrada[k];
  for(const k in R.saida)addRes(k,R.saida[k],b.x+b.w/2,b.y+b.h/2);
  b.tarefa.resta-=passoCoz();if(G.colheita)G.colheita.pao=true;
  if(restaDe(b)<passoCoz()){b.tarefa=null;toast(`✅ ${u.name} terminou a tarefa na Cozinha.`,'good')}}
// quanto de cevada o cozinheiro pode usar: d = passos a somar (negativo diminui); d = 0 cancela
CMDS.cozinhaQtd=(u,c)=>{const b=BMAP.get(c.b);if(!b||!b.done||b.type!=='cozinha')return cmdFail('','');
  const n=c.d?clamp(restaDe(b)+c.d*passoCoz(),0,COZ_MAX):0;b.tarefa=n?{resta:n}:null;
  const chef=cozinheiroDe(b);if(chef){chef.avisoCoz=null;if(chef.act&&chef.act.type==='idle')chef.act=null}
  return{ok:true}};
function cozinhaHTML(b){if(b.type!=='cozinha')return'';const chef=cozinheiroDe(b),n=restaDe(b),R=receitaCoz(),vezes=n/passoCoz();
  return`<h4>Tarefa do cozinheiro</h4><p class="hint">${chef?`👨‍🍳 ${chef.name} · ${chef.dormindo?'Dormindo':chef.status||'A caminho'}`:'Sem cozinheiro. Toque num morador e escolha 🍳 Cozinheiro.'}</p>`+
    `<div class="row"><span>Cevada que ele pode usar:</span><button class="sbtn" data-a="cozqtd" data-v="-1" aria-label="Menos cevada" ${n?'':'disabled'}>−</button><b>${icon('recursos','cevada')} ${n}</b><button class="sbtn" data-a="cozqtd" data-v="1" aria-label="Mais cevada">+</button>${n?'<button class="sbtn" data-a="cozqtd" data-v="0">Cancelar</button>':''}</div>`+
    `<p class="small">${n?`Vai render ${icon('recursos','food')} ${vezes*R.saida.food}. `:''}No depósito: ${icon('recursos','cevada')} ${G.res.cevada||0}. A comida vai para o depósito. Cozinhar não dá experiência.</p>`}
