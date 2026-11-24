/* ================= UI: sheets ================= */
let THUMB={},DTHUMB={};
// Miniaturas dependem só do bioma (e de dados estáticos): gera uma vez por bioma.
const THUMB_CACHE={};
function makeThumbs(){const hit=THUMB_CACHE[G.biome];if(hit){THUMB=hit.t;DTHUMB=hit.d;return}
  THUMB={};DTHUMB={};LOD=false;const c=document.createElement('canvas');c.width=192;c.height=168;const tc=c.getContext('2d');const save=ctx;ctx=tc;
  for(const k of BUILD_ORDER){const d=BD[k];tc.setTransform(1,0,0,1,0,0);tc.clearRect(0,0,192,168);
    const fake={id:-1,type:k,x:0,y:0,w:d.w,h:d.h,done:true,prog:d.work,work:d.work,hp:1,max:1,grow:.8,queue:[],thumb:true};
    const minX=-d.h*HW-6,maxX=d.w*HW+6,minY=-(k==='tower'?78:k==='longhouse'?50:d.w===1?30:44),maxY=(d.w+d.h)*HH+6;const s=Math.min(180/(maxX-minX),156/(maxY-minY),2.6);
    tc.setTransform(s,0,0,s,96-(minX+maxX)/2*s,84-(minY+maxY)/2*s);
    pp([P(-.15,-.15),P(d.w+.15,-.15),P(d.w+.15,d.h+.15),P(-.15,d.h+.15)],d.water?BIO.shallow:BIO.grass[1]);
    if(d.flat)drawFlatB(fake);drawB(fake);THUMB[k]=c.toDataURL()}
  for(const k of DECOR_ORDER){const D=DECOR[k];tc.setTransform(1,0,0,1,0,0);tc.clearRect(0,0,192,168);const s=D.big?1.5:3;tc.setTransform(s,0,0,s,96,D.big?120:130);
    ell(0,0,18*(D.big?2:1),8*(D.big?2:1),D.water?BIO.shallow:shade(BIO.grass[1],-.05));D.d();DTHUMB[k]=c.toDataURL()}
  ctx=save;THUMB_CACHE[G.biome]={t:THUMB,d:DTHUMB}}
function markTabs(){const on=sheetKind==='edit'||mode.t==='edit'?'edit':(mode.t==='build'||mode.t==='line'||mode.t==='decor')?'build':sheetKind;document.querySelectorAll('#bar button').forEach(b=>b.classList.toggle('on',b.dataset.tab===on))}
function openSheet(k){sheetKind=k;sheetSig='';if(k==='build'&&mode.t!=='none'&&mode.t!=='edit'){$('#place').classList.remove('open')}renderSheet();const el=$('#sheet');el.classList.toggle('bs',k==='build');el.classList.add('open');markTabs()}
function closeSheet(){sheetKind=null;$('#sheet').classList.remove('open');markTabs();if(mode.t==='build'||mode.t==='line'||mode.t==='decor')updPlace()}
function renderSheet(){if(!sheetKind||!G)return;const h=sheetHTML();if(h==null){closeSheet();return}if(h===sheetSig)return;sheetSig=h;const el=$('#sheet');const sx=el.querySelector('.strip')?.scrollLeft;el.innerHTML=h;const st=el.querySelector('.strip');if(st&&sx)st.scrollLeft=sx}
const head=(t,hint)=>`<div class="shead"><div><h2>${t}</h2>${hint?`<p class="hint">${hint}</p>`:''}</div><button class="x" data-a="close">✕</button></div>`;
function sheetHTML(){
  switch(sheetKind){
  case'build':{const cat=lastCat,cur=mode.type||mode.kind;const items=cat==='decor'?DECOR_ORDER:BUILD_ORDER.filter(k=>BD[k].cat===cat&&eraPredio(k)<=G.era);
    return`<button class="grab" data-a="expand" aria-label="Expandir"></button><div class="cats">${CATS.map(([k,n])=>`<button class="cat ${k===cat?'on':''}" data-a="cat" data-v="${k}">${svg(k)}${n}</button>`).join('')}</div><div class="strip ${expanded?'grid':''}">${items.map(k=>{const isD=cat==='decor',def=isD?DECOR[k]:BD[k];return`<button class="pc ${k===cur?'sel':''} ${afford(def.cost)?'':'dis'}" data-a="${isD?'decor':'build'}" data-v="${k}"><img src="${isD?DTHUMB[k]:THUMB[k]}" alt=""><b>${def.n}</b><i>${costHTML(def.cost)}</i></button>`}).join('')}</div>`}
  case'edit':{const d=mode.sel;
    if(!d&&sel&&sel.k==='b'){const eb=BMAP.get(sel.id);if(eb){const ed=BD[eb.type];
      return head(ed.n,'Construção selecionada. Remover devolve parte do material.')+`<div class="row"><button class="sbtn red" data-a="bdel">🗑 Remover (devolve ${eb.done?'metade':'80%'})</button><button class="sbtn" data-a="done">Sair do modo edição</button></div>`}}
    if(!d)return head('Editar objetos','Toque numa decoração ou construção para selecionar. Arraste decoração para mover. Remover apaga qualquer peça, inclusive cercas e muros.')+`<div class="row"><button class="sbtn" data-a="done">Sair do modo edição</button></div>`;
    return head(DECOR[d.k].n,'Arraste o objeto para movê-lo livremente.')+`<div class="row"><button class="sbtn" data-a="flip">↔ Virar</button><button class="sbtn" data-a="small">➖</button><button class="sbtn" data-a="big">➕</button><button class="sbtn" data-a="dup">⧉ Duplicar (${costHTML(DECOR[d.k].cost)})</button><button class="sbtn red" data-a="del">🗑 Remover</button><button class="gbtn" data-a="done">Pronto</button></div>`}
  case'craft':{const sm=G.bld.find(b=>b.type==='smithy'&&b.done);return head('Criar','Ferramentas de pedra se fazem à mão. Armas pedem uma Ferraria pronta.')+
    (()=>{const card=k=>{const it=ITEMS[k],can=it.hand||sm,ok=can&&afford(it.cost);return`<div class="item"><div class="top"><span class="ic">${itemIcon(k)}</span><b>${it.n}</b><span class="cnt">${G.items[k]}</span></div><div class="small">${it.use}</div>${isFerr(k)&&G.ferr&&G.ferr[k]&&G.ferr[k][0]?`<div class="small">${OFICIO.qualidade.efeito[G.ferr[k][0].q].n} · ${G.ferr[k][0].d}/${maxFerr(k,G.ferr[k][0].q)} usos</div>`:''}<div class="row" style="margin:2px 0 0"><span class="cost">${costHTML(it.cost)}</span><button class="sbtn" style="margin-left:auto;padding:5px 10px" data-a="craft" data-v="${k}" ${ok?'':'disabled'}>${it.hand?'Criar':sm?'Forjar':'🔒 Ferraria'}</button></div></div>`},
      tools=[...new Set(Object.values(JOBTOOL))].filter(k=>ITEMS[k]),ks=Object.keys(ITEMS).filter(k=>(!MUNDO.lugares.ruina.receitas.includes(k)||G.receitas.includes(k))&&eraItem(k)<=G.era),arm=ks.filter(k=>!tools.includes(k));
      return`<h4>Ferramentas de trabalho</h4><div class="items">${tools.map(card).join('')}</div>`+(arm.length?`<h4>Armas e equipamentos</h4><div class="items">${arm.map(card).join('')}</div>`:'')})()}
  case'bag':{const w=bagW(),cap=storeCap();
    return head('Mochila',`Peso ${w}/${BAG}. Toras pesam 5 · pedra e ferro 2 · galho 1 · comida 0,5.`)+`<div class="row" style="margin-top:0"><div class="meter"><i style="width:${Math.min(100,w/BAG*100)}%;background:${w>=BAG?'#e2533f':'#f3c969'}"></i></div></div>`+
      `<div class="inv">${Object.keys(RES).map(k=>`<div class="slot ${G.inv[k]?'':'z'}"><span>${icon('recursos',k)}</span><b>${G.inv[k]}</b><small>${RES[k][0]}</small></div>`).join('')}</div>`+
      `<h4>Nos depósitos ${cap?`· até ${capLabel()}`:''}</h4>`+(cap?`<div class="inv">${Object.keys(RES).map(k=>`<div class="slot ${G.res[k]?'':'z'}"><span>${icon('recursos',k)}</span><b>${G.res[k]}</b><small>${RES[k][0]}</small></div>`).join('')}</div>${w>0?'<div class="row"><button class="gbtn" data-a="godeposit">'+icon('interface','depositar')+' Ir guardar tudo</button></div>':''}`:'<p class="hint">Nenhum depósito ainda. Construa uma Pilha de recursos.</p>')+
      `<h4>Equipamento</h4>${equipHTML()}<h4>Ferramentas e armas</h4>${bagItemsHTML()}`+
      `<h4>Assentamento</h4><table class="tbl"><tr><td>Construções</td><td>${G.bld.filter(b=>b.done&&!BD[b.type].line).length}</td></tr><tr><td>Peças de muro, cerca e piso</td><td>${G.bld.filter(b=>b.done&&BD[b.type].line).length}</td></tr><tr><td>Moradores</td><td>${popCount()} <span class="small">(em breve)</span></td></tr><tr><td>Dia</td><td>${Math.floor(G.t/240)+1} ${darkness()>.1?'🌙':'☀️'}</td></tr></table>`}
  case'cart':{const c=sel&&sel.k==='c'?G.carts.find(x=>x.id===sel.id):null;if(!c)return null;const me=PL(),riding=me&&me.ride===c.id;
    const it=[...Object.keys(c.inv).filter(k=>c.inv[k]>0).map(k=>`${icon('recursos',k)} ${c.inv[k]} ${RES[k][0]}`),...Object.keys(c.items).filter(k=>c.items[k]>0).map(k=>`${itemIcon(k)} ${c.items[k]} ${ITEMS[k].n}`)];
    const near=G.bld.some(b=>b.done&&BD[b.type].store&&isNear(c,b));
    let btn='';
    if(riding)btn='<p class="hint">Você está conduzindo. Toque em Sair da carroça para descer.</p>';
    else if(c.rider!=null)btn='<p class="hint">Alguém está conduzindo o carrinho.</p>';
    else btn=`<button class="gbtn" data-a="cartop" data-v="ride">🛒 Mover</button> <button class="sbtn" data-a="cartop" data-v="stow">${icon('interface','mochila')} Guardar mochila</button>`+(near&&it.length?` <button class="sbtn" data-a="cartop" data-v="unload">📦 Descarregar tudo</button>`:'');
    return head('Carrinho de mão',`Mochila do carrinho: ${cartW(c)}/${BAG}.`)+(it.length?`<p class="hint">${it.join(' · ')}</p>`:'<p class="hint">Vazio.</p>')+`<div class="row">${btn}</div>`}
  case'tomb':{const t=sel&&sel.k==='t'?G.tombs.find(x=>x.id===sel.id):null;if(!t)return null;
    return head('Túmulo','Aqui ficou a sua mochila. Resgate para pegar tudo de volta.')+`<div class="row"><button class="gbtn" data-a="loot">${icon('interface','mochila')} Resgatar mochila</button></div>`}
  case'saga':return sagaHTML();
  case'era':return eraHTML();
  case'info':return infoHTML()}
  return null}
/* Mochila: 8 espaços de equipamento e a lista de itens (toque para vestir) */
function equipHTML(){return`<div class="inv">${SLOTS.map(s=>{const k=G.equip[s];
  return`<div class="slot ${k?'':'z'}" ${k?`data-a="unequip" data-v="${s}"`:''}><span>${k?itemIcon(k):icon('slots',s)}</span><b>${k?'':'—'}</b><small>${CB.slot_nome[s]}</small></div>`}).join('')}</div>`}
function bagItemsHTML(){return`<div class="inv">${Object.keys(ITEMS).map(k=>{const it=ITEMS[k],n=G.items[k]||0,eq=it.slot&&n>0;
  return`<div class="slot ${n?'':'z'}" ${eq?`data-a="equip" data-v="${k}" title="Toque para vestir"`:''}><span>${itemIcon(k)}</span><b>${n}</b><small>${it.n.split(' ')[0]}</small></div>`}).join('')}</div>`}
function infoHTML(){if(!sel)return null;
  if(sel.k==='p')return poiHTML(sel.id);
  if(sel.k==='u'){const u=UMAP.get(sel.id);if(!u)return null;
    if(u.kind==='wanderer')return head(u.name,PESSOAS.andarilho.nome)+`<p class="hint">${PESSOAS.andarilho.chegada}</p><div class="row"><button class="gbtn" data-a="recruit">🏠 Convidar a ficar (${costHTML({food:PESSOAS.andarilho.custo_comida})})</button></div><p class="small">Camas livres: ${Math.max(0,camasLivres())}</p>`;
    if(u.kind==='merchant')return merchantHTML(u);
    if(u.kind==='domestic'){const A=CAMPO.animais[u.sp];if(!A)return null;
      return head(u.name,A.n)+`<p class="hint">${A.emoji} ${u.fed===false?'Sem ração: não produz hoje.':'Comeu ração hoje.'}</p><p class="small">Produz 1 ${A.produz==='ovo'?'ovo':'lã'} a cada ${A.dias_producao} dia(s).</p>`}
    if(u.kind==='raider')return head('Invasor','Saqueador inimigo.')+`<div class="row">❤️ <div class="meter"><i style="width:${u.hp/u.max*100}%;background:#e2533f"></i></div></div>`;
    if(u.kind==='villager'){const semVaga=DEPOT_JOBS.includes(u.job)&&!depotNear(u);const st=u.dormindo?'Dormindo':!u.job?'Sem trabalho':semVaga?'Sem vaga':(u.status||'Trabalhando');
      const btn=(k,n)=>`<button class="sbtn ${u.job===k?'on':''}" data-a="setjob" data-v="${k}">${n}</button>`;
      const M=PESSOAS.moral,mt=Math.round(u.moral??M.inicial),cor=mt<M.aviso_abaixo?'#e2533f':mt>=M.alta_acima?'#7fd46a':'#f3c969';
      const nv=u.job&&DEPOT_JOBS.includes(u.job)?nivelHab(u,u.job):0,cama=camaDo(u);
      const tr=(u.tracos||[]).map(k=>PESSOAS.tracos[k]).filter(Boolean);
      return head(u.name,u.job?JOBNAME[u.job]:'Sem trabalho')+`<div class="row">😊 <div class="meter"><i style="width:${mt}%;background:${cor}"></i></div><span class="small">Moral ${mt}</span></div>`+
        `<table class="tbl"><tr><td>Nível</td><td>${nv?`${nv} de ${PESSOAS.habilidade.nivel_max} (${JOBNAME[u.job]})`:'—'}</td></tr><tr><td>Cama</td><td>${cama?BD[cama.type].n:'Sem cama'}</td></tr><tr><td>Ferramenta</td><td>${u.tool&&u.toolInst?`${ITEMS[u.tool].n} · ${OFICIO.qualidade.efeito[u.toolInst.q].n} · ${u.toolInst.d}/${maxFerr(u.tool,u.toolInst.q)}`:'Nenhuma'}</td></tr></table>`+
        `<div class="small">${tr.map(t=>`<div><b style="color:${t.tipo==='bom'?'#7fd46a':'#e2533f'}">${t.nome}</b> · ${t.desc}</div>`).join('')}</div>`+
        `<p class="hint"><b>${st}</b>${semVaga?' Construa um depósito (Pilha de recursos) para ter vaga.':''}</p><div class="row">${btn('lumber','🪓 Lenhador')}${btn('miner','⛏️ Minerador')}${btn('collector','🧺 Coletor')}<button class="sbtn ${!u.job?'on':''}" data-a="setjob" data-v="">Sem trabalho</button></div>`}
    const role=u.kind==='warrior'?WC[u.wc].n:(u.job?JOBNAME[u.job]:'Construtor');return head(u.name,role)+`<div class="row">❤️ <div class="meter"><i style="width:${u.hp/u.max*100}%"></i></div></div>`}
  const b=BMAP.get(sel.id);if(!b)return null;const d=BD[b.type];let h=head(d.n,d.desc);
  h+=`<div class="row">${b.done?'❤️':'🏗️'} <div class="meter"><i style="width:${(b.done?b.hp/b.max:b.prog/b.work)*100}%;${b.done?'':'background:#f3c969'}"></i></div><span class="small">${b.done?Math.round(b.hp)+'/'+b.max:Math.floor(b.prog/b.work*100)+'% construído'}</span></div>`;
  if(!b.done){const me=PL();h+=`<p class="hint">${me&&me.act&&me.act.type==='build'&&me.act.b===b.id?icon('interface','construindo')+' Você está construindo.':'Toque na obra para construir. '+(G.items.hammer?'':'Um '+icon('ferramentas','hammer')+' Martelo acelera.')}</p>`}
  else{
    if(d.store){const cap=storeCap();h+=`<table class="tbl">${Object.keys(RES).map(k=>`<tr><td>${icon('recursos',k)} ${RES[k][0]}</td><td>${G.res[k]} / ${cap}</td></tr>`).join('')}</table><p class="hint">Toque aqui para guardar o que estiver na mochila.</p>`}
    h+=estacaoHTML(b);
    if(b.type==='farm'){const r=farmoResumo(b),per=estacao().e,cult=Object.keys(CAMPO.culturas);
      h+=`<p class="hint">Vazios ${r.v} · Preparados ${r.pr} · Plantados ${r.pl} · Prontos ${r.pt}</p><div class="row">`+
        `<button class="sbtn" data-a="farmop" data-v="prep" ${r.v?'':'disabled'}>⛏️ Preparar terra</button>`+
        cult.map(k=>{const K=CAMPO.culturas[k],ok=r.pr&&per.plantar&&have(K.semente)>0;return`<button class="sbtn" data-a="farmop" data-v="plant:${k}" ${ok?'':'disabled'}>${K.emoji} Plantar ${K.n} (${have(K.semente)})</button>`}).join('')+
        `<button class="sbtn" data-a="farmop" data-v="harvest" ${r.pt?'':'disabled'}>🌾 Colher prontos (${r.pt})</button></div>`+
        `<p class="small">${per.emoji} ${per.n}: ${per.plantar?'as plantas crescem':'nada cresce ao ar livre'}. Sementes vêm de frutinhas e da colheita.</p>`}
    if(b.type==='pen'){const n=penCount(b),cap=CAMPO.cercado.capacidade;
      h+=`<p class="hint">Animais: ${n} de ${cap}. Comem ração (cevada ou nabo) todo dia.</p><div class="row">`+
        Object.keys(CAMPO.animais).map(k=>{const A=CAMPO.animais[k],ok=n<cap&&afford(A.custo);return`<button class="sbtn" data-a="buyAnimal" data-v="${k}" ${ok?'':'disabled'}>${A.emoji} ${A.n} ${costHTML(A.custo)}</button>`}).join('')+`</div>`}
    if(d.jobs)h+=`<p class="hint">👥 Posto para ${d.jobs} trabalhador(es). Moradores poderão ser encontrados no futuro.</p>`;
    if(b.type==='quarry')h+=`<div class="row"><b>Extrair:</b><button class="sbtn ${b.mode==='stone'?'on':''}" data-a="qmode" data-v="stone">${icon('recursos','stone')} Pedra</button><button class="sbtn ${b.mode==='iron'?'on':''}" data-a="qmode" data-v="iron">${icon('recursos','iron')} Ferro</button></div>`;
    if(b.type==='smithy')h+=`<p class="hint">Abra Criar para forjar armas. Você caminha até a ferraria para trabalhar.</p>`;
    if(b.type==='tower')h+=`<p class="hint">${icon('interface','alvo_arco')} Alcance de 6 casas. Funciona sozinha.</p>`}
  if(b.done&&b.hp<b.max)h+=`<div class="row"><button class="sbtn" data-a="repair">🔧 Reparar (${costHTML(repCusto(b))})</button></div>`;
  if(b.done&&b.type==='bell')h+=`<div class="row"><button class="sbtn" data-a="ring">🔔 Tocar o sino</button></div>`;
  if(b.done&&['shelter','house','longhouse'].includes(b.type))h+=`<div class="row"><button class="sbtn" data-a="sleep">${icon('interface','dormir')} Dormir até o amanhecer</button></div>`;
  h+=`<div class="row"><button class="sbtn red" data-a="demolish">${icon('interface','desmontar')} Desmontar (devolve ${b.done?'metade':'80%'})</button></div>`;
  return h}
$('#sheet').addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el||el.disabled)return;act(el.dataset.a,el.dataset.v)});
function act(a,v){const b=sel&&sel.k==='b'?BMAP.get(sel.id):null;
  switch(a){
  case'close':closeSheet();sel=null;if(mode.t==='edit')mode={t:'none'};markTabs();break;
  case'cat':lastCat=v;sfx('tick');break;
  case'expand':expanded=!expanded;break;
  case'build':sfx('tick');enterBuild(v);return;
  case'decor':sfx('tick');enterDecor(v);return;
  case'qmode':if(b)sendCmd({t:'qmode',b:b.id,v});break;
  case'craft':{const r=sendCmd({t:'craft',item:v});if(!r.ok){toast(r.msg,'bad');break}if(r.toast)toast(r.toast);closeSheet();break}
  case'godeposit':if(sendCmd({t:'godeposit'}).ok)closeSheet();break;
  case'trade':{const m=sel&&sel.k==='u'?UMAP.get(sel.id):null;if(m){const r=sendCmd({t:'trade',id:m.id,i:+v});if(!r.ok){if(r.msg)toast(r.msg,'bad')}else sfx('craft')}break}
  case'proc':{if(b){const r=sendCmd({t:'proc',b:b.id,r:v});if(!r.ok){if(r.msg)toast(r.msg,'bad')}}break}
  case'reparaF':{if(b){const r=sendCmd({t:'reparaF',b:b.id,k:v});if(!r.ok){if(r.msg)toast(r.msg,'bad')}}break}
  case'eraAvanca':{const r=sendCmd({t:'eraAvanca'});if(!r.ok){if(r.msg)toast(r.msg,'bad')}else closeSheet();break}
  case'farmop':{if(b){const[op,cc]=String(v).split(':');const r=sendCmd({t:'farmOp',b:b.id,op,c:cc});if(!r.ok&&r.msg)toast(r.msg,'bad')}break}
  case'buyAnimal':{if(b){const r=sendCmd({t:'buyAnimal',b:b.id,sp:v});if(!r.ok){if(r.msg)toast(r.msg,'bad')}else if(r.toast)toast(r.toast,'good')}break}
  case'setjob':{const a=sel&&sel.k==='u'?UMAP.get(sel.id):null;if(a)sendCmd({t:'setjob',id:a.id,job:v||null});break}
  case'recruit':{const a=sel&&sel.k==='u'?UMAP.get(sel.id):null;if(!a)break;const r=sendCmd({t:'recruit',id:a.id});if(!r.ok){toast(r.msg,'bad');break}if(r.toast)toast(r.toast,'good');closeSheet();sel=null;break}
  case'equip':sendCmd({t:'equip',item:v});break;
  case'unequip':sendCmd({t:'unequip',slot:v});break;
  case'repair':if(b&&sendCmd({t:'repair',b:b.id}).ok)closeSheet();break;
  case'ring':if(b)sendCmd({t:'ring',b:b.id});break;
  case'sleep':if(b&&sendCmd({t:'sleep',b:b.id}).ok)closeSheet();break;
  case'cartop':{if(sel&&sel.k==='c'){const r=sendCmd({t:'cartOp',id:sel.id,op:v});if(!r.ok){if(r.msg)toast(r.msg,'bad')}else if(v==='ride')closeSheet();}break}
  case'loot':{const t=sel&&sel.k==='t'?G.tombs.find(x=>x.id===sel.id):null;if(t)sendCmd({t:'loot',id:t.id});sel=null;break}
  case'demolish':if(b){sendCmd({t:'demolish',b:b.id});closeSheet()}break;
  case'bdel':if(b){sendCmd({t:'demolish',b:b.id});sel=null}break;
  case'flip':if(mode.sel)sendCmd({t:'decorOp',id:mode.sel.id,op:'flip'});break;
  case'big':if(mode.sel)sendCmd({t:'decorOp',id:mode.sel.id,op:'big'});break;
  case'small':if(mode.sel)sendCmd({t:'decorOp',id:mode.sel.id,op:'small'});break;
  case'dup':if(mode.sel){const r=sendCmd({t:'decorOp',id:mode.sel.id,op:'dup'});if(!r.ok){toast(r.msg,'bad');break}if(r.d)mode.sel=r.d;sfx('place')}break;
  case'del':if(mode.sel){sendCmd({t:'decorOp',id:mode.sel.id,op:'del'});mode.sel=null}break;
  case'done':mode={t:'none'};closeSheet();break}
  sheetSig='';renderSheet();markTabs()}
const TABS={build:['build','Construir'],craft:['craft','Criar'],bag:['bag','Mochila'],edit:['edit','Editar']};
document.querySelectorAll('#bar button').forEach(btn=>{const[ic,lb]=TABS[btn.dataset.tab];btn.innerHTML=svg(ic)+lb;btn.addEventListener('click',()=>{const t=btn.dataset.tab;sfx('tick');
  if(t==='edit'){if(mode.t==='edit'){mode={t:'none'};closeSheet()}else{$('#place').classList.remove('open');mode={t:'edit',sel:null};sel=null;openSheet('edit')}markTabs();return}
  if(t==='build'&&(mode.t==='build'||mode.t==='line'||mode.t==='decor')){if(sheetKind==='build')closeSheet();else{$('#place').classList.remove('open');openSheet('build')}return}
  if(mode.t!=='none')cancelMode();if(sheetKind===t){closeSheet();return}sel=null;openSheet(t)})});
$('#bLoc').innerHTML=svg('loc');$('#bMenu').innerHTML=svg('menu');

