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
function devGive(kind,key,n){if(!G)return;if(kind==='res'){G.inv[key]+=n;toast(`+${n} ${RES[key][1]}`,'good')}else{G.items[key]=(G.items[key]||0)+n;toast(`+${n} ${ITEMS[key].n}`,'good')}devPanel()}
function devPanel(){
  let el=document.getElementById('devPanel');
  if(!devOpen||!settings.dev||!G){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='devPanel';el.className='panel';
    el.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 56px);max-height:55vh;overflow-y:auto;z-index:9;padding:10px;border-radius:14px;font-size:12px';document.body.appendChild(el)}
  const tg=(k,n)=>`<button class="sbtn ${DEV[k]?'on':''}" data-dev="t:${k}">${n}: ${DEV[k]?'ON':'off'}</button>`;
  const res=Object.keys(RES).map(k=>`<button class="sbtn" data-dev="r:${k}">${RES[k][0]} +100 ${RES[k][1]}</button>`).join(' ');
  const items=Object.keys(ITEMS).map(k=>`<button class="sbtn" data-dev="i:${k}">${ITEMS[k].ic} ${ITEMS[k].n}</button>`).join(' ');
  el.innerHTML=`<b style="font-family:Cinzel,serif;color:#f3c969">Modo desenvolvedor</b>
    <div class="row">${tg('inf','Recursos infinitos')} ${tg('instant','Construção instantânea')} ${tg('god','Invencível')}</div>
    <h4>Recursos</h4><div class="row">${res}</div>
    <h4>Ferramentas e armas (+1)</h4><div class="row">${items}</div>
    <h4>Outros</h4><div class="row"><button class="sbtn" data-dev="clear">Esvaziar mochila</button><button class="sbtn" data-dev="heal">Curar jogador</button><button class="sbtn" data-dev="raid">Invasão agora</button><button class="sbtn" data-dev="all">Tudo</button></div>
    <p class="help">Construir: use o menu Construir normalmente (custa 0 com recursos infinitos).</p>`;
  el.onclick=e=>{const b=e.target.closest('[data-dev]');if(!b)return;const a=b.dataset.dev;
    if(a.startsWith('t:'))return devSet(a.slice(2),!DEV[a.slice(2)]);
    if(a.startsWith('r:'))return devGive('res',a.slice(2),100);
    if(a.startsWith('i:'))return devGive('item',a.slice(2),1);
    if(a==='clear'){for(const k in G.inv)G.inv[k]=0;toast('Mochila esvaziada','good');devPanel()}
    if(a==='heal'){const p=PL();if(p){p.hp=p.max;p.down=0}toast('Curado','good')}
    if(a==='raid'){if(longhouse())spawnRaid();else toast('Precisa de Casa Comunal','bad')}
    if(a==='all'){for(const k in RES)G.inv[k]+=100;for(const k in ITEMS)G.items[k]=(G.items[k]||0)+1;toast('Tudo entregue','good');devPanel()}}}
