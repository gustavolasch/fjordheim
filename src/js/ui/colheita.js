/* ================= UI da lavoura: painel do campo, caixa da saga com seta e Guia do Campo ================= */
function campoHTML(b){const r=farmoResumo(b),per=estacao().e,T=CAMPO.textos,livres=r.v+r.pr;
  let h=farmoSituacao(b).map(t=>`<p class="hint"><b>${t}</b></p>`).join('');
  if(r.pt)h+=`<div class="row"><button class="gbtn" data-a="farmop" data-v="harvest">🌾 Colher (${r.pt})</button></div>`;
  if(livres){if(!per.plantar)h+=`<p class="hint">${T.inverno_sem_plantio}</p>`;
    else{const tem=Object.keys(CAMPO.culturas).filter(k=>have(CAMPO.culturas[k].semente)>0);
      h+=tem.length?`<div class="row" style="flex-wrap:wrap"><b>Plantar:</b>${tem.map(k=>{const K=CAMPO.culturas[k];return`<button class="sbtn" data-a="farmop" data-v="plant:${k}">${K.emoji} ${K.n} (${have(K.semente)})</button>`}).join('')}</div>`:`<p class="hint">${T.sem_semente}</p>`}}
  return h}
// ao abrir o painel do campo, sobe a câmera para o anel não ficar escondido atrás do painel
function mostraCampo(b){const q=P(b.x+b.w/2,b.y+b.h/2);camGo={x:W/2-q[0]*cam.z,y:H*.44-q[1]*cam.z}}

// ---- caixa da saga e seta piscando ----
let sagaOculta=-1,sagaSig='';
function sagaEl(id,html){let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;if(html)el.innerHTML=html;document.getElementById('hud').appendChild(el)}return el}
function sagaBoxHUD(){const C=G&&G.colheita,on=!!(C&&!C.fim&&sagaOculta!==C.p);
  const el=sagaEl('saga');if(!el.className){el.className='glass';el.addEventListener('click',e=>{if(e.target.closest('button')){sagaOculta=G.colheita.p;sagaBoxHUD()}})}
  document.body.classList.toggle('saga-on',on);if(!on){sagaSig='';return}
  const S=CAMPO.textos.saga,t=preenche(S.passos[C.p].dica,{meta:S.sementes_meta,tem:Math.min(have('semente_cevada'),S.sementes_meta)});
  const sig=C.p+t;if(sig===sagaSig&&el.innerHTML)return;sagaSig=sig;
  el.innerHTML=`<div><b>🌾 ${S.nome} · ${C.p+1}/${S.passos.length}</b><span>${t}</span></div><button aria-label="Esconder">✕</button>`}
const noElemento=s=>{const e=document.querySelector(s);if(!e||e.disabled)return null;const r=e.getBoundingClientRect();return r.width&&r.right>0&&r.left<innerWidth?[r.left+r.width/2,r.top]:null};
const noMapa=(x,y,z)=>w2s(x,y,z||0);
const noPredio=b=>noMapa(b.x+b.w/2,b.y+b.h/2,b.type==='farm'?4:34);
function noCapim(){const u=PL();if(!u)return null;let best=null,bd=1e9;for(let i=0;i<TUFT.length;i++){if(!TUFT[i]||G.obj[i]||G.occ[i])continue;const x=i%N+.5,y=(i/N|0)+.5,d=Math.hypot(x-u.x,y-u.y);if(d<bd){bd=d;best=[x,y]}}return best?noMapa(best[0],best[1],4):null}
// rola a faixa de construções até o cartão pedido, uma vez por abertura (depois o jogador rola à vontade)
function rolaAte(tipo){const e=document.querySelector(`#sheet [data-a="build"][data-v="${tipo}"]`);if(!e||e.dataset.rolado)return;e.dataset.rolado='1';const f=e.closest('.strip');if(f)f.scrollLeft+=e.getBoundingClientRect().left+e.offsetWidth/2-innerWidth/2}
// onde construir algo: obra começada, botão ✓, cartão no menu ou aba Construir
function alvoConstruir(tipo){const obra=G.bld.find(b=>b.type===tipo&&!b.done);if(obra)return noPredio(obra);
  if(mode.t==='build')return mode.type===tipo?noElemento('#place [data-p="ok"]'):noElemento('#bar [data-tab="build"]');
  if(sheetKind==='build'){rolaAte(tipo);return noElemento(`#sheet [data-a="build"][data-v="${tipo}"]`)||noElemento('#sheet [data-a="cat"][data-v="struct"]')}
  return noElemento('#bar [data-tab="build"]')}
function alvoSaga(){const id=CAMPO.textos.saga.passos[G.colheita.p].id,F=camposProntos(),aberto=sheetKind==='info'&&sel&&sel.k==='b'?BMAP.get(sel.id):null;
  const noCampo=teste=>{const b=F.find(teste)||F[0];return b?noPredio(b):null};
  switch(id){
    case'semente':return noCapim();
    case'campo':return alvoConstruir('farm');
    case'plantar':if(!sementesTotal())return noCapim();if(!estacao().e.plantar)return null;
      if(aberto&&aberto.type==='farm')return noElemento('#sheet [data-v^="plant:"]');return noCampo(b=>farmoResumo(b).v+farmoResumo(b).pr>0);
    case'esperar':return aberto&&aberto.type==='farm'?null:noCampo(b=>farmoResumo(b).pl>0);
    case'colher':if(aberto&&aberto.type==='farm')return noElemento('#sheet [data-v="harvest"]');return noCampo(b=>farmoResumo(b).pt>0);
    case'pao':{const k=G.bld.find(b=>b.type==='cozinha'&&b.done);if(!k)return alvoConstruir('cozinha');
      if(have('cevada')<OFICIO.estacoes.cozinha.pao.entrada.cevada)return noCampo(()=>true);
      if(aberto===k)return noElemento('#sheet [data-v="pao"]');return noPredio(k)}}
  return null}
function setaTick(){const el=sagaEl('seta','<i>👇</i>');const C=G&&G.colheita;
  const p=!menuOpen&&C&&!C.fim&&sagaOculta!==C.p&&!(PL()&&PL().order)?alvoSaga():null;
  el.style.display=p?'block':'none';if(!p)return;
  // fora da tela: encosta na borda do lado certo
  el.style.left=Math.max(22,Math.min(innerWidth-22,p[0]))+'px';el.style.top=Math.max(110,Math.min(innerHeight-40,p[1]))+'px'}
function colheitaSagaHTML(){const C=G.colheita,S=CAMPO.textos.saga;
  return`<div class="item"><div class="top"><b>${C&&C.fim?'✅':'⬜'} ${S.nome}</b></div><div class="small">${C&&!C.fim?`Passo ${C.p+1} de ${S.passos.length}`:C?'Concluída':'Começa com a primeira semente.'} · ${S.desc}</div></div>`}

// ---- Guia do Campo (no menu) ----
function guiaHTML(){const T=CAMPO.textos.guia,plantaveis=CAMPO.estacoes.filter(e=>e.plantar&&e.crescimento>0),verao=CAMPO.estacoes.find(e=>e.id==='verao');
  const est=plantaveis.map(e=>`${e.emoji} ${e.n}`).join(', ');
  return Object.keys(CAMPO.culturas).map(k=>{const K=CAMPO.culturas[k],G_=T.plantas[k];return`<div class="gcard"><b>${K.emoji} ${K.n}</b><dl><dt>${T.semente}</dt><dd>${G_.semente}</dd><dt>${T.crescer}</dt><dd>${String(K.dias).replace('.',',')} dias</dd><dt>${T.estacoes}</dt><dd>${est}</dd><dt>${T.uso}</dt><dd>${G_.uso}</dd></dl></div>`}).join('')+
    `<p>${preenche(T.nota,{verao:String(verao.crescimento).replace('.',',')+'×'})}</p>`}
function ligaGuia(){const box=$('#guia');box.classList.add('hidden');$('#mGuia').onclick=()=>{if(box.classList.toggle('hidden'))return;box.innerHTML=guiaHTML();$('#transfer').classList.add('hidden')}}
