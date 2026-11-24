/* ================= Modo desenvolvedor (Opções → Modo desenvolvedor) =================
   Recursos infinitos, construção grátis/instantânea, invencível, dar qualquer item/recurso.
   Só existe enquanto settings.dev estiver ligado. Não entra no save. */
let devEl=null,devOpen=false;
let devWasOn=false;
function devApply(){
  // ao ligar o modo dev, tudo liga por padrão (dá pra desligar cada um no painel)
  if(settings.dev&&!devWasOn){DEV.inf=DEV.instant=DEV.god=true}
  devWasOn=!!settings.dev;
  DEV.inf=!!(settings.dev&&DEV.inf);DEV.instant=!!(settings.dev&&DEV.instant);DEV.god=!!(settings.dev&&DEV.god);
  if(!settings.dev){if(devEl){devEl.remove();devEl=null}devOpen=false;return}
  if(!devEl){devEl=document.createElement('button');devEl.id='devBtn';devEl.className='rbtn glass';devEl.textContent='DEV';devEl.title='Painel do desenvolvedor';
    devEl.style.cssText='position:fixed;left:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);z-index:9;width:auto;padding:0 10px;height:34px;font-size:12px;color:#f8d985';
    devEl.onclick=()=>{devOpen=!devOpen;devPanel()};document.body.appendChild(devEl)}
  devPanel()}
function devSet(k,v){DEV[k]=v;devPanel()}
function devGive(kind,key,n){if(!G)return;if(kind==='res'){G.inv[key]+=n;toast(`+${n} ${RES[key][0]}`,'good')}else{G.items[key]=(G.items[key]||0)+n;toast(`+${n} ${ITEMS[key].n}`,'good')}devPanel()}
function devPanel(){
  let el=document.getElementById('devPanel');
  if(!devOpen||!settings.dev||!G){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='devPanel';el.className='panel';
    el.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 56px);max-height:55vh;overflow-y:auto;z-index:9;padding:10px;border-radius:14px;font-size:12px';document.body.appendChild(el)}
  const tg=(k,n)=>`<button class="sbtn ${DEV[k]?'on':''}" data-dev="t:${k}">${n}: ${DEV[k]?'ON':'off'}</button>`;
  const res=Object.keys(RES).map(k=>`<button class="sbtn" data-dev="r:${k}">${icon('recursos',k)} +100 ${RES[k][0]}</button>`).join(' ');
  const items=Object.keys(ITEMS).map(k=>`<button class="sbtn" data-dev="i:${k}">${itemIcon(k)} ${ITEMS[k].n}</button>`).join(' ');
  const s=estacao();
  el.innerHTML=`<b style="font-family:Cinzel,serif;color:#f3c969">Modo desenvolvedor</b>
    <p class="help"><b>Era ${G.era}: ${ERAS.nomes[G.era-1]}</b> · ${s.e.emoji} ${s.e.n} (dia ${s.dia}) · ${isNoite()?'🌙 noite':'☀️ dia'}</p>
    <div class="row">${tg('inf','Recursos infinitos')} ${tg('instant','Construção instantânea')} ${tg('god','Invencível')}</div>
    <h4>Era e tempo</h4><div class="row"><button class="sbtn" data-dev="era:-1">◀ Era anterior</button><button class="sbtn" data-dev="era:1">Próxima era ▶</button><button class="sbtn" data-dev="liberar">🔓 Liberar tudo</button><button class="sbtn" data-dev="dia:manha">☀️ Pular para manhã</button><button class="sbtn" data-dev="dia:noite">🌙 Pular para noite</button><button class="sbtn" data-dev="estacao">🍂 Próxima estação</button></div>
    <h4>Recursos</h4><div class="row"><button class="sbtn" data-dev="res:all">+100 de cada recurso</button></div><div class="row">${res}</div>
    <h4>Ferramentas e armas (+1)</h4><div class="row">${items}</div>
    <h4>Outros</h4><div class="row"><button class="sbtn" data-dev="clear">Esvaziar mochila</button><button class="sbtn" data-dev="heal">Curar jogador</button><button class="sbtn" data-dev="raid">Invasão agora</button><button class="sbtn" data-dev="all">Tudo</button></div>
    <p class="help">Construir: use o menu Construir normalmente (custa 0 com recursos infinitos).</p>`;
  el.onclick=e=>{const b=e.target.closest('[data-dev]');if(!b)return;const a=b.dataset.dev;
    if(a.startsWith('t:'))return devSet(a.slice(2),!DEV[a.slice(2)]);
    if(a.startsWith('r:'))return devGive('res',a.slice(2),100);
    if(a==='era:-1'||a==='era:1'){G.era=clamp(G.era+Number(a.slice(4)),1,5);toast(`Era: ${ERAS.nomes[G.era-1]}`,'good');return devPanel()}
    if(a==='liberar'){G.era=5;for(const k of MUNDO.lugares.ruina.receitas)if(!G.receitas.includes(k))G.receitas.push(k);toast('Tudo liberado: eras, receitas e construções','good');return devPanel()}
    if(a==='res:all'){for(const k in RES)G.inv[k]+=100;toast('+100 de cada recurso','good');return devPanel()}
    if(a==='dia:manha'||a==='dia:noite'){const alvo=a==='dia:noite';let n=0;while(isNoite()!==alvo&&n<1000){G.t+=1;n++}toast(alvo?'🌙 Noite':'☀️ Manhã','good');return devPanel()}
    if(a==='estacao'){const d=Math.floor(G.t/DIA());G.t=(Math.floor(d/CAMPO.dias_por_estacao)+1)*CAMPO.dias_por_estacao*DIA()+1;toast(`Estação: ${estacao().e.n}`,'good');return devPanel()}
    if(a.startsWith('i:'))return devGive('item',a.slice(2),1);
    if(a==='clear'){for(const k in G.inv)G.inv[k]=0;toast('Mochila esvaziada','good');devPanel()}
    if(a==='heal'){const p=PL();if(p){p.hp=p.max;p.down=0}toast('Curado','good')}
    if(a==='raid'){if(longhouse())spawnRaid();else toast('Precisa de Casa Comunal','bad')}
    if(a==='all'){for(const k in RES)G.inv[k]+=100;for(const k in ITEMS)G.items[k]=(G.items[k]||0)+1;toast('Tudo entregue','good');devPanel()}}}
