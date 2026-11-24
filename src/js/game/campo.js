/* ================= Campo e estações (0.8): estações, lavoura, animais e estrago =================
   Lavoura = Fazenda (3x3). Cada uma tem 9 canteiros: b.canteiros[i] = {st: 0 vazio | 1 preparado | 2 plantado, c: cultura, g: 0..1}.
   Cercado (pen) guarda animais: units kind 'domestic' com sp (galinha | ovelha) e pen (id do cercado).
   Números em data/campo.json (CAMPO). Dia = DIA() (pessoas.json). */
const ESTADO_CANTEIRO=['vazio','preparado','plantado'];
function novosCanteiros(){return Array.from({length:9},()=>({st:0,c:null,g:0}))}

// ---- estações: 4 dias cada, começa na primavera ----
function estacao(){const d=Math.floor(G.t/DIA());const n=CAMPO.dias_por_estacao;const i=Math.floor(d/n)%CAMPO.estacoes.length;return{i,e:CAMPO.estacoes[i],dia:d%n+1}}
function ehInverno(){return estacao().e.id==='inverno'}
function updSeason(){const el=document.getElementById('season');if(!el)return;const s=estacao(),txt=`${s.e.emoji} ${s.e.n} · dia ${s.dia} de ${CAMPO.dias_por_estacao}`;if(el.textContent!==txt)el.textContent=txt}

// ---- lavoura ----
function farmoNext(b,op,c){const seed=c&&CAMPO.culturas[c]?CAMPO.culturas[c].semente:null;
  for(let q=0;q<9;q++){const p=b.canteiros[q];if(!p)continue;
    if(op==='prep'&&p.st===0)return q;
    if(op==='plant'&&p.st===1&&estacao().e.plantar&&have(seed)>0)return q;
    if(op==='harvest'&&p.st===2&&p.g>=1)return q}
  return -1}
// o que o lavrador faz agora: colhe o pronto, planta o que tem semente, prepara o vazio
function farmoEscolhe(b){let q=farmoNext(b,'harvest');if(q>=0)return{op:'harvest',c:null,q};
  for(const c of Object.keys(CAMPO.culturas)){q=farmoNext(b,'plant',c);if(q>=0)return{op:'plant',c,q}}
  q=farmoNext(b,'prep');if(q>=0)return{op:'prep',c:null,q};return null}
// mensagem de erro para um pedido do jogador (null = pode fazer)
function farmoMsg(b,op,c){
  if(op==='prep')return farmoNext(b,'prep')>=0?null:'Nenhum canteiro vazio';
  if(op==='harvest')return farmoNext(b,'harvest')>=0?null:'Nada pronto para colher';
  if(op==='plant'){if(!CAMPO.culturas[c])return'Cultura inválida';
    if(!estacao().e.plantar)return'No inverno nada é plantado';
    const seed=CAMPO.culturas[c].semente;if(have(seed)<=0)return`Falta ${RES[seed][0].toLowerCase()}. Sementes vêm de frutinhas e da colheita.`;
    return farmoNext(b,'plant',c)>=0?null:'Nenhum canteiro preparado para plantar'}
  return'Ação inválida'}
function farmoResumo(b){const r={v:0,pr:0,pl:0,pt:0};for(const p of b.canteiros){if(p.st===0)r.v++;else if(p.st===1)r.pr++;else if(p.g>=1)r.pt++;else r.pl++}return r}
// aplica uma ação num canteiro (a simulação confere tudo)
function applyPlot(b,q,op,c){const p=b.canteiros[q];if(!p)return false;
  if(op==='prep'){if(p.st!==0)return false;p.st=1;return true}
  if(op==='plant'){const K=CAMPO.culturas[c];if(!K||p.st!==1||!estacao().e.plantar||!afford({[K.semente]:1}))return false;
    pay({[K.semente]:1});p.st=2;p.c=c;p.g=0;return true}
  if(op==='harvest'){if(p.st!==2||p.g<1)return false;const K=CAMPO.culturas[p.c];
    for(const k in K.colheita)addInv(k,K.colheita[k],b.x+1.5,b.y+1.5);
    p.st=0;p.c=null;p.g=0;return true}
  return false}
function farmoCrescer(dt){const m=estacao().e.crescimento;if(m<=0)return;
  for(const b of G.bld){if(b.type!=='farm'||!b.done||!b.canteiros)continue;
    for(const p of b.canteiros)if(p.st===2&&p.g<1)p.g=Math.min(1,p.g+dt*m/(CAMPO.culturas[p.c].dias*DIA()))}}

// ---- cercado e animais ----
function penDe(u){const b=BMAP.get(u.pen);return b&&b.type==='pen'&&b.done?b:null}
function penCount(pen){let n=0;for(const u of G.units)if(u.kind==='domestic'&&u.pen===pen.id)n++;return n}
function penSpot(pen){for(let k=0;k<40;k++){const x=pen.x+((Math.random()*pen.w)|0),y=pen.y+((Math.random()*pen.h)|0);if(passV(x,y))return[x,y]}return[pen.x+1,pen.y+1]}
// anda devagar dentro do cercado
function updDomestic(u,dt){if(moveUnit(u,dt))return;
  u.cool=(u.cool??0)-dt;if(u.cool>0)return;u.cool=2+Math.random()*4;
  const pen=penDe(u);if(!pen)return;const tx=pen.x+((Math.random()*pen.w)|0),ty=pen.y+((Math.random()*pen.h)|0);
  const p=astar(...utile(u),(x,y)=>x===tx&&y===ty,tx,ty,passV,300);if(p)u.path=p}
// ração: cevada ou nabo, do depósito primeiro. Tudo ou nada.
function tomaRacao(n){const keys=CAMPO.racao;let total=0;for(const k of keys)total+=have(k);if(total<n)return false;
  let need=n;for(const k of keys){const r=Math.min(need,G.res[k]);G.res[k]-=r;need-=r;const i=Math.min(need,G.inv[k]);G.inv[k]-=i;need-=i;if(!need)break}return true}
function ganhaEstoque(k,n,x,y){const cap=storeCap();const s=Math.min(n,Math.max(0,cap-G.res[k]));G.res[k]+=s;G.inv[k]+=n-s;if(x!=null)floater(x,y,`+${n} [[recursos.${k}]]`)}
// amanhecer: cada animal come a ração; comeu = produz no tempo certo
function alimentaAnimais(){
  for(const u of G.units){if(u.kind!=='domestic')continue;const A=CAMPO.animais[u.sp];if(!A)continue;
    u.fed=tomaRacao(A.racao);
    if(u.fed){u.prodT=(u.prodT||0)+1;if(u.prodT>=A.dias_producao){u.prodT=0;ganhaEstoque(A.produz,1,u.x,u.y)}}}}
function compraAnimal(b,sp){const A=CAMPO.animais[sp];if(!A)return cmdFail('','');
  if(penCount(b)>=CAMPO.cercado.capacidade)return cmdFail('Cercado cheio');
  if(!afford(A.custo))return cmdFail('Faltam recursos');
  pay(A.custo);const q=penSpot(b);
  spawnUnit('domestic',q[0]+.5,q[1]+.5,{sp,pen:b.id,name:A.n,fed:true,prodT:0,cool:Math.random()*3});
  sfx('place');return{ok:true,toast:`${A.n} chegou ao cercado.`}}

// ---- estrago: comida perde um pouco por dia; devagar no depósito; parada no inverno ----
function estraga(dt){const E=CAMPO.estraga;const f=ehInverno()?E.inverno_fator:1;if(f<=0)return;
  if(!G.estAcc)G.estAcc={};
  for(const k of E.itens)for(const[lugar,taxa]of[['inv',E.mochila_dia],['res',E.deposito_dia]]){
    const st=G[lugar];const n=st[k]||0;if(n<=0)continue;
    const key=lugar+'_'+k;G.estAcc[key]=(G.estAcc[key]||0)+n*taxa*f*dt/DIA();
    if(G.estAcc[key]>=1){const q=Math.min(Math.floor(G.estAcc[key]),n);G.estAcc[key]-=q;st[k]-=q}}}

// tick geral (roda em update): amanhecer dos animais, crescimento, estrago, animais sem cercado
function campoTick(dt){
  updSeason();
  G.capimVolta=G.capimVolta||[];for(const e of G.capimVolta.slice())if(G.t>=e.t){TUFT[e.i]=e.tf;G.capimVolta.splice(G.capimVolta.indexOf(e),1)}
  const d=Math.floor(G.t/DIA());if(G.campoDia==null)G.campoDia=d;
  if(d>G.campoDia){const n=Math.min(d-G.campoDia,5);G.campoDia=d;for(let k=0;k<n;k++)alimentaAnimais()}
  farmoCrescer(dt);estraga(dt);
  for(const u of G.units.slice())if(u.kind==='domestic'&&!penDe(u)){removeUnit(u);toast(`${CAMPO.animais[u.sp]?.n||'Um animal'} fugiu: o cercado foi desmontado.`,'bad')}}

// migração v7: fazendas antigas ganham canteiros; itens novos começam em zero
function migraV7(){for(const k in RES){G.inv[k]??=0;G.res[k]??=0}
  for(const b of G.bld)if(b.type==='farm'&&!b.canteiros)b.canteiros=novosCanteiros();
  G.estAcc??={}}
