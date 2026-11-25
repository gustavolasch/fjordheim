/* ================= Eras, ofício e ferramentas (0.7) =================
   Eras: G.era (1..5). Metas em data/eras.json (ERAS). Pedra rúnica (prédio 'runa') abre o painel.
   Ferramentas: G.ferr[k] = lista de instâncias {d: usos restantes, q: 'comum'|'bom'|'excelente'} (a primeira é a que está em uso).
   G.items[k] = quantidade (sempre igual ao tamanho da lista). Números em data/oficio.json (OFICIO).
   Estações: receitas (cavalete, curtume, fundição) e reparo na bancada. O jogador leva o tempo; ingredientes são pagos ao começar. */
const FERR_KEYS=()=>Object.keys(OFICIO.ferramentas);
function isFerr(k){return !!OFICIO.ferramentas[k]}
function eraPredio(k){return ERAS.predios[k]??1}
function eraItem(k){return ITEMS[k]?.era??1}
function usosMax(k){return OFICIO.ferramentas[k].usos}
function qualRoll(){const c=OFICIO.qualidade.chance,r=Math.random();return r<c.comum?'comum':r<c.comum+c.bom?'bom':'excelente'}
function novoFerr(k,q){q=q||qualRoll();const e=OFICIO.qualidade.efeito[q];return{d:Math.round(usosMax(k)*e.usos),q}}
// mantém a lista de ferramentas igual à contagem (carrinho, tumba e devmode mexem na contagem)
function garantiaFerr(k){if(!isFerr(k))return;G.ferr=G.ferr||{};const L=G.ferr[k]=G.ferr[k]||[];
  while(L.length<(G.items[k]||0))L.push(novoFerr(k));
  while(L.length>(G.items[k]||0))L.pop();}
function ferrAdd(k){if(!isFerr(k)){G.items[k]=(G.items[k]||0)+1;return}garantiaFerr(k);G.ferr[k].push(novoFerr(k));G.items[k]=G.ferr[k].length}
// tira uma ferramenta do estoque (para um morador levar); devolve a instância
function ferrPega(k){if(!isFerr(k)){G.items[k]--;return null}garantiaFerr(k);const inst=G.ferr[k].shift();G.items[k]=G.ferr[k].length;return inst}
function ferrDevolve(k,inst){if(!isFerr(k)){G.items[k]=(G.items[k]||0)+1;return}G.ferr[k]=G.ferr[k]||[];G.ferr[k].unshift(inst||novoFerr(k));G.items[k]=G.ferr[k].length}
function quebra(k,nome){toast(`💥 ${nome||ITEMS[k].n} quebrou`,'bad');sfx('bad')}
// jogador: gasta a ferramenta em uso (a primeira da lista)
function usaTop(k){if(!isFerr(k))return;garantiaFerr(k);const L=G.ferr[k];if(!L.length)return;L[0].d--;
  if(L[0].d<=0){L.shift();G.items[k]=L.length;quebra(k)}}
// morador: gasta a ferramenta que ele leva
function wearTool(u){if(!u.tool||!u.toolInst)return;u.toolInst.d--;
  if(u.toolInst.d<=0){quebra(u.tool,`${ITEMS[u.tool].n} de ${u.name}`);u.tool=null;u.toolInst=null;takeTool(u)}}
// velocidade pela qualidade (1 = comum)
function velQual(inst){return inst?OFICIO.qualidade.efeito[inst.q].vel:1}

// ---- eras: metas e painel ----
function metaOk(c){const aldeoes=G.units.filter(u=>u.kind==='villager').length;
  switch(c.tipo){
    case'predio':return G.bld.some(b=>b.done&&b.type===c.b);
    case'fogueira':return G.decor.some(d=>d.k==='campfire');
    case'moradores':return aldeoes>=c.n;
    case'dias':return G.t>=c.n*DIA();
    case'flag':return !!(G.flags&&G.flags[c.f]);
    case'invasoes':return (G.invasoesRepelidas||0)>=c.n;
    case'saga':return !!(G.sagas&&G.sagas[c.id])}
  return false}
function metasDaEra(){return G.era>=5?ERAS.fim:ERAS.metas[G.era-1]}
function eraPronta(){return metasDaEra().every(metaOk)}
CMDS.eraAvanca=()=>{if(G.era>=5)return cmdFail('','');if(!eraPronta())return cmdFail('Ainda faltam metas');
  G.era++;novidadesEra(G.era);sfx('craft');toast(`👑 Nova era: ${ERAS.nomes[G.era-1]}. Novas construções e receitas apareceram.`,'good');return{ok:true}};
const META_TXT={predio:c=>`${BD[c.b]?BD[c.b].n:c.b} pronto`,fogueira:()=>'Fogueira acesa',moradores:c=>`${c.n} moradores`,dias:c=>`${c.n} dias sobrevividos`,flag:c=>({colheita:'Primeira colheita da lavoura',lingote:'Primeiro lingote de ferro',mercador:'Mercador recebido'})[c.f]||c.f,invasoes:c=>`${c.n} invasão repelida`,saga:c=>`Saga: ${MUNDO.sagas.find(s=>s.id===c.id)?.n||c.id}`};
function eraHTML(){const n=ERAS.nomes[G.era-1],metas=metasDaEra();
  const lista=metas.map(c=>`<div class="small">${metaOk(c)?'✅':'⬜'} ${META_TXT[c.tipo](c)}</div>`).join('');
  const acao=G.era>=5?'<p class="hint">Você é rei. A era do Reino chegou ao fim.</p>':`<div class="row"><button class="gbtn" data-a="eraAvanca" ${eraPronta()?'':'disabled'}>👑 Tocar na pedra rúnica e avançar</button></div>`;
  return head(`Era ${G.era}: ${n}`,'Cumpra as metas para a vila avançar.')+`<div class="item">${lista}</div>`+acao}
// pedra rúnica: prédio fixo perto do início (sem demolir, sem sumir)
function colocaPedra(){const x=G.start[0]-2,y=G.start[1]-2;if(!inb(x,y))return;placeB('runa',x,y,true)}

// ---- durabilidade: qualidades e reparo ----
function maxFerr(k,q){return Math.round(usosMax(k)*OFICIO.qualidade.efeito[q].usos)}
function piorFerr(k){const L=(G.ferr&&G.ferr[k])||[];let w=null;for(const f of L)if(!w||f.d/maxFerr(k,f.q)<w.d/maxFerr(k,w.q))w=f;return w}
function custoReparo(k){const o={};for(const r in ITEMS[k].cost)o[r]=Math.max(1,Math.floor(ITEMS[k].cost[r]*OFICIO.reparo.fracao_material));return o}
CMDS.reparaF=(u,c)=>{const b=BMAP.get(c.b);if(!b||!b.done||b.type!=='bancada')return cmdFail('','');
  if(!isFerr(c.k))return cmdFail('','');garantiaFerr(c.k);const w=piorFerr(c.k);
  if(!w||w.d>=maxFerr(c.k,w.q))return cmdFail('Nada para reparar');
  const cost=custoReparo(c.k);if(!afford(cost))return cmdFail('Faltam recursos');
  pay(cost);setOrder(u,{type:'proc',b:b.id,r:'reparo',k:c.k,paid:cost});return{ok:true}};
// estações: receitas (o jogador leva o tempo e paga ao começar)
CMDS.proc=(u,c)=>{const b=BMAP.get(c.b);if(!b||!b.done)return cmdFail('','');
  const R=(OFICIO.estacoes[b.type]||{})[c.r];if(!R)return cmdFail('','');
  if(!afford(R.entrada))return cmdFail('Faltam recursos');
  pay(R.entrada);setOrder(u,{type:'proc',b:b.id,r:c.r,paid:R.entrada});return{ok:true}};
function procChegou(u,o){const b=BMAP.get(o.b);if(!b||!b.done){refund(o.paid,1);u.order=null;return}
  if(!isNear(u,b)){if(!stepTo(u,o,b.x,b.y,b.w,b.h))refund(o.paid,1);return}
  o.tries=0;const R=o.r==='reparo'?{tempo:OFICIO.reparo.tempo}:OFICIO.estacoes[b.type][o.r];
  faceTo(u,b.x+b.w/2,b.y+b.h/2);u.act={type:'proc',t:0,dur:R.tempo,b:b.id,r:o.r,k:o.k}}
function oficioFim(u,a){const o=u.order;
  if(a.r==='reparo'){const w=piorFerr(a.k);if(w){w.d=maxFerr(a.k,w.q)};toast(`🔧 ${ITEMS[a.k].n} consertado`,'good')}
  else{const R=OFICIO.estacoes[(BMAP.get(a.b)||{}).type||'']?.[a.r];if(!R)return;
    for(const k in R.saida)addInv(k,R.saida[k]);if(a.r==='lingote')G.flags.lingote=true;if(a.r==='pao'&&G.colheita)G.colheita.pao=true;toast(`✅ ${R.n} pronto`,'good')}
  sfx('craft');if(o)o.done=true;u.order=null}
// painel da estação (receitas e reparo)
function estacaoHTML(b){let h='';const R=OFICIO.estacoes[b.type];
  if(['house','shelter','longhouse'].includes(b.type)){const q=G.units.filter(u=>u.dentro===b.id).map(u=>u.name);
    h+=`<p class="hint">${q.length?'💤 Dormindo aqui: '+q.join(', '):'Ninguém dorme aqui agora.'}</p>`}
  if(R)h+=`<p class="hint">Estação de trabalho. Você leva o tempo da receita; ingredientes são pagos ao começar.</p><div class="row" style="flex-wrap:wrap">`+
    Object.keys(R).map(k=>{const X=R[k],ok=afford(X.entrada);return`<button class="sbtn" data-a="proc" data-v="${k}" ${ok?'':'disabled'}>${X.n}: ${costHTML(X.entrada)} → ${Object.keys(X.saida).map(s=>`${icon('recursos',s)}${X.saida[s]}`).join(' ')}</button>`}).join('')+`</div>`;
  if(b.type==='bancada')h+=`<p class="hint">Reparo: custa metade do material original e devolve a ferramenta a 100%.</p><div class="row" style="flex-wrap:wrap">`+
    FERR_KEYS().filter(k=>(G.items[k]||0)>0).map(k=>{const w=piorFerr(k),m=w?maxFerr(k,w.q):0,ok=w&&w.d<m&&afford(custoReparo(k));
      return`<button class="sbtn" data-a="reparaF" data-v="${k}" ${ok?'':'disabled'}>🔧 ${ITEMS[k].n} ${w?w.d:0}/${m} ${costHTML(custoReparo(k))}</button>`}).join('')+`</div>`;
  return h}
// pedra rúnica: fica no lugar; o painel mostra as metas
function drawRuna(b){const q=P(b.x+.5,b.y+.5,0);ell(q[0],q[1],9,4.5,'rgba(0,0,0,.22)');pp([[q[0]-7,q[1]],[q[0],q[1]-9],[q[0]+7,q[1]],[q[0],q[1]+4]],'#8d8a84');
  pp([[q[0]-7,q[1]],[q[0],q[1]+4],[q[0],q[1]+9],[q[0]-7,q[1]+5]],'#6c6963');
  for(let k=0;k<3;k++)ln([q[0]-3+k*3,q[1]-3],[q[0]-3+k*3,q[1]-1],'#e3c47a',1.2)}
// migração v9: eras, ferramentas (cada uma com durabilidade) e pedra rúnica para saves antigos
function migraV9(){G.era=G.era||1;G.ferr=G.ferr||{};for(const k of FERR_KEYS())garantiaFerr(k);
  if(!G.bld.some(b=>b.type==='runa'))colocaPedra()}

// ---- bloqueios: o que impede um item ou construção (cadeado + motivo) ----
function bloqueado(tipo,k){return tipo==='build'?eraPredio(k)>G.era:(eraItem(k)>G.era||(MUNDO.lugares.ruina.receitas.includes(k)&&!G.receitas.includes(k)))}
function bloqMotivo(tipo,k){if(tipo==='item'&&MUNDO.lugares.ruina.receitas.includes(k)&&!G.receitas.includes(k)&&eraItem(k)<=G.era)return'Aprenda numa ruína';
  return`Era ${tipo==='build'?eraPredio(k):eraItem(k)}`}
let BLOQ=null; // item bloqueado que o jogador tocou
function bloqueadoHTML(){if(!BLOQ)return null;const{tipo,k}=BLOQ,nome=tipo==='build'?BD[k].n:ITEMS[k].n;
  let falta='';
  if(MUNDO.lugares.ruina.receitas.includes(k)&&!G.receitas.includes(k)&&(tipo==='item'))falta='<p class="hint">Encontre uma ruína no mapa e toque nela para aprender a receita.</p>';
  else{const n=tipo==='build'?eraPredio(k):eraItem(k);const ms=n>=2?(ERAS.metas[n-2]||ERAS.fim):[];
    falta=`<p class="hint">Libera na Era ${n}: ${ERAS.nomes[n-1]||''}. Para chegar lá:</p><div class="item">${ms.map(c=>`<div class="small">${metaOk(c)?'✅':'⬜'} ${META_TXT[c.tipo](c)}</div>`).join('')}</div>`}
  return head(`🔒 ${nome}`,bloqMotivo(tipo,k))+falta}
// "Zzz" pequeno flutuando acima da casa onde há gente dormindo
function drawZzz(b){const t=perfT,q=P(b.x+b.w/2,b.y+b.h/2,(BD[b.type].wallH||12)+22);
  ctx.save();ctx.font='800 9px Nunito, sans-serif';ctx.textAlign='center';
  for(let k=0;k<2;k++){const ph=(t*.6+k*.5)%1;ctx.globalAlpha=.8*(1-ph);ctx.fillStyle='#fff3d6';ctx.fillText('Zz',q[0]+k*6+ph*4,q[1]-ph*16)}
  ctx.restore()}

// ---- aviso de liberação: "i" pulsando no canto; a lista leva direto ao menu certo ----
function novidade(tipo,k){G.novidades=G.novidades||[];if(!G.novidades.some(n=>n.tipo===tipo&&n.k===k))G.novidades.push({tipo,k})}
function novidadesEra(n){for(const k of Object.keys(ERAS.predios))if(ERAS.predios[k]===n&&BD[k])novidade('build',k);
  for(const k of Object.keys(ITEMS))if((ITEMS[k].era||1)===n)novidade('item',k)}
let novoEl=null,NOVO_LISTA=[];
function updNovo(){const n=(G.novidades||[]).length;
  if(!n){if(novoEl)novoEl.style.display='none';return}
  if(!novoEl){novoEl=document.createElement('button');novoEl.id='novo';novoEl.className='glass';novoEl.textContent='i';novoEl.title='O que foi liberado';
    novoEl.onclick=()=>{NOVO_LISTA=G.novidades.slice();G.novidades=[];novoEl.style.display='none';openSheet('novo')};
    const h=document.getElementById('hud');(h||document.body).appendChild(novoEl)}
  novoEl.style.display=''}
function novoHTML(){const L=NOVO_LISTA;if(!L.length)return head('Nada novo','Você já viu tudo que foi liberado.');
  return head('Liberado','Toque num item para ir até ele.')+`<div class="row" style="flex-wrap:wrap">`+
    L.map(n=>n.tipo==='build'?`<button class="sbtn" data-a="novoIr" data-v="build:${n.k}">🏗️ ${BD[n.k].n}</button>`:`<button class="sbtn" data-a="novoIr" data-v="item:${n.k}">🔨 ${ITEMS[n.k].n}</button>`).join('')+`</div>`}
