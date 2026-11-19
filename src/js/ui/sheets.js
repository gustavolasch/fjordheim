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
  case'build':{const cat=lastCat,cur=mode.type||mode.kind;const items=cat==='decor'?DECOR_ORDER:BUILD_ORDER.filter(k=>BD[k].cat===cat);
    return`<button class="grab" data-a="expand" aria-label="Expandir"></button><div class="cats">${CATS.map(([k,n])=>`<button class="cat ${k===cat?'on':''}" data-a="cat" data-v="${k}">${svg(k)}${n}</button>`).join('')}</div><div class="strip ${expanded?'grid':''}">${items.map(k=>{const isD=cat==='decor',def=isD?DECOR[k]:BD[k];return`<button class="pc ${k===cur?'sel':''} ${afford(def.cost)?'':'dis'}" data-a="${isD?'decor':'build'}" data-v="${k}"><img src="${isD?DTHUMB[k]:THUMB[k]}" alt=""><b>${def.n}</b><i>${costHTML(def.cost)}</i></button>`}).join('')}</div>`}
  case'edit':{const d=mode.sel;
    if(!d&&sel&&sel.k==='b'){const eb=BMAP.get(sel.id);if(eb){const ed=BD[eb.type];
      return head(ed.n,'Construção selecionada. Remover devolve parte do material.')+`<div class="row"><button class="sbtn red" data-a="bdel">🗑 Remover (devolve ${eb.done?'metade':'80%'})</button><button class="sbtn" data-a="done">Sair do modo edição</button></div>`}}
    if(!d)return head('Editar objetos','Toque numa decoração ou construção para selecionar. Arraste decoração para mover. Remover apaga qualquer peça, inclusive cercas e muros.')+`<div class="row"><button class="sbtn" data-a="done">Sair do modo edição</button></div>`;
    return head(DECOR[d.k].n,'Arraste o objeto para movê-lo livremente.')+`<div class="row"><button class="sbtn" data-a="flip">↔ Virar</button><button class="sbtn" data-a="small">➖</button><button class="sbtn" data-a="big">➕</button><button class="sbtn" data-a="dup">⧉ Duplicar (${costHTML(DECOR[d.k].cost)})</button><button class="sbtn red" data-a="del">🗑 Remover</button><button class="gbtn" data-a="done">Pronto</button></div>`}
  case'craft':{const sm=G.bld.find(b=>b.type==='smithy'&&b.done);return head('Criar','Ferramentas de pedra se fazem à mão. Armas pedem uma Ferraria pronta.')+
    `<div class="items">${Object.keys(ITEMS).map(k=>{const it=ITEMS[k],can=it.hand||sm,ok=can&&afford(it.cost);return`<div class="item"><div class="top"><span class="ic">${it.ic}</span><b>${it.n}</b><span class="cnt">${G.items[k]}</span></div><div class="small">${it.use}</div><div class="row" style="margin:2px 0 0"><span class="cost">${costHTML(it.cost)}</span><button class="sbtn" style="margin-left:auto;padding:5px 10px" data-a="craft" data-v="${k}" ${ok?'':'disabled'}>${it.hand?'Criar':sm?'Forjar':'🔒 Ferraria'}</button></div></div>`}).join('')}</div>`}
  case'bag':{const w=bagW(),cap=storeCap();
    return head('Mochila',`Peso ${w}/${BAG}. Toras pesam 5 · pedra e ferro 2 · galho 1 · comida 0,5.`)+`<div class="row" style="margin-top:0"><div class="meter"><i style="width:${Math.min(100,w/BAG*100)}%;background:${w>=BAG?'#e2533f':'#f3c969'}"></i></div></div>`+
      `<div class="inv">${Object.keys(RES).map(k=>`<div class="slot ${G.inv[k]?'':'z'}"><span>${RES[k][0]}</span><b>${G.inv[k]}</b><small>${RES[k][1]}</small></div>`).join('')}</div>`+
      `<h4>Nos depósitos ${cap?`· até ${cap} de cada`:''}</h4>`+(cap?`<div class="inv">${Object.keys(RES).map(k=>`<div class="slot ${G.res[k]?'':'z'}"><span>${RES[k][0]}</span><b>${G.res[k]}</b><small>${RES[k][1]}</small></div>`).join('')}</div>${w>0?'<div class="row"><button class="gbtn" data-a="godeposit">📦 Ir guardar tudo</button></div>':''}`:'<p class="hint">Nenhum depósito ainda. Construa uma Pilha de recursos.</p>')+
      `<h4>Ferramentas e armas</h4><div class="inv">${Object.keys(ITEMS).map(k=>`<div class="slot ${G.items[k]?'':'z'}"><span>${ITEMS[k].ic}</span><b>${G.items[k]}</b><small>${ITEMS[k].n.split(' ')[0]}</small></div>`).join('')}</div>`+
      `<h4>Assentamento</h4><table class="tbl"><tr><td>Construções</td><td>${G.bld.filter(b=>b.done&&!BD[b.type].line).length}</td></tr><tr><td>Peças de muro, cerca e piso</td><td>${G.bld.filter(b=>b.done&&BD[b.type].line).length}</td></tr><tr><td>Moradores</td><td>${popCount()} <span class="small">(em breve)</span></td></tr><tr><td>Dia</td><td>${Math.floor(G.t/240)+1} ${darkness()>.1?'🌙':'☀️'}</td></tr></table>`}
  case'tomb':{const t=sel&&sel.k==='t'?G.tombs.find(x=>x.id===sel.id):null;if(!t)return null;
    return head('Túmulo','Aqui ficou a sua mochila. Resgate para pegar tudo de volta.')+`<div class="row"><button class="gbtn" data-a="loot">🎒 Resgatar mochila</button></div>`}
  case'info':return infoHTML()}
  return null}
function infoHTML(){if(!sel)return null;
  if(sel.k==='u'){const u=UMAP.get(sel.id);if(!u)return null;
    if(u.kind==='raider')return head('Invasor','Saqueador inimigo.')+`<div class="row">❤️ <div class="meter"><i style="width:${u.hp/u.max*100}%;background:#e2533f"></i></div></div>`;
    const role=u.kind==='warrior'?WC[u.wc].n:(u.job?JOBNAME[u.job]:'Construtor');return head(u.name,role)+`<div class="row">❤️ <div class="meter"><i style="width:${u.hp/u.max*100}%"></i></div></div>`}
  const b=BMAP.get(sel.id);if(!b)return null;const d=BD[b.type];let h=head(d.n,d.desc);
  h+=`<div class="row">${b.done?'❤️':'🏗️'} <div class="meter"><i style="width:${(b.done?b.hp/b.max:b.prog/b.work)*100}%;${b.done?'':'background:#f3c969'}"></i></div><span class="small">${b.done?Math.round(b.hp)+'/'+b.max:Math.floor(b.prog/b.work*100)+'% construído'}</span></div>`;
  if(!b.done){const me=PL();h+=`<p class="hint">${me&&me.act&&me.act.type==='build'&&me.act.b===b.id?'🔨 Você está construindo.':'Toque na obra para construir. '+(G.items.hammer?'':'Um 🔨 Martelo acelera.')}</p>`}
  else{
    if(d.store){const cap=storeCap();h+=`<table class="tbl">${Object.keys(RES).map(k=>`<tr><td>${RES[k][0]} ${RES[k][1]}</td><td>${G.res[k]} / ${cap}</td></tr>`).join('')}</table><p class="hint">Toque aqui para guardar o que estiver na mochila.</p>`}
    if(d.jobs)h+=`<p class="hint">👥 Posto para ${d.jobs} trabalhador(es). Moradores poderão ser encontrados no futuro.</p>`;
    if(b.type==='quarry')h+=`<div class="row"><b>Extrair:</b><button class="sbtn ${b.mode==='stone'?'on':''}" data-a="qmode" data-v="stone">🪨 Pedra</button><button class="sbtn ${b.mode==='iron'?'on':''}" data-a="qmode" data-v="iron">🔩 Ferro</button></div>`;
    if(b.type==='smithy')h+=`<p class="hint">Abra Criar para forjar armas. Você caminha até a ferraria para trabalhar.</p>`;
    if(b.type==='tower')h+=`<p class="hint">🏹 Alcance de 6 casas. Funciona sozinha.</p>`}
  if(b.done&&['shelter','house','longhouse'].includes(b.type))h+=`<div class="row"><button class="sbtn" data-a="sleep">🛏 Dormir até o amanhecer</button></div>`;
  h+=`<div class="row"><button class="sbtn red" data-a="demolish">🔨 Desmontar (devolve ${b.done?'metade':'80%'})</button></div>`;
  return h}
$('#sheet').addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el||el.disabled)return;act(el.dataset.a,el.dataset.v)});
function act(a,v){const b=sel&&sel.k==='b'?BMAP.get(sel.id):null;
  switch(a){
  case'close':closeSheet();sel=null;if(mode.t==='edit')mode={t:'none'};markTabs();break;
  case'cat':lastCat=v;sfx('tick');break;
  case'expand':expanded=!expanded;break;
  case'build':sfx('tick');enterBuild(v);return;
  case'decor':sfx('tick');enterDecor(v);return;
  case'qmode':if(b)b.mode=v;break;
  case'craft':{const it=ITEMS[v];if(!afford(it.cost)){toast('Faltam recursos','bad');break}
    if(it.hand){pay(it.cost);order({type:'craft',item:v,paid:it.cost})}else{const sm=G.bld.find(x=>x.type==='smithy'&&x.done);if(!sm){toast('Construa uma Ferraria primeiro','bad');break}pay(it.cost);order({type:'forge',b:sm.id,item:v,paid:it.cost});toast('Indo até a Ferraria…')}
    closeSheet();break}
  case'godeposit':{const me=PL();let best=null,bd=1e9;for(const s of G.bld)if(s.done&&BD[s.type].store){const d=Math.hypot(s.x-me.x,s.y-me.y);if(d<bd){bd=d;best=s}}if(best){order({type:'deposit',b:best.id});closeSheet()}break}
  case'sleep':if(b){order({type:'sleep',b:b.id});closeSheet()}break;
  case'loot':{const t=sel&&sel.k==='t'?G.tombs.find(x=>x.id===sel.id):null;if(t)lootTomb(t);sel=null;break}
  case'demolish':if(b){refund(BD[b.type].cost,b.done?.5:.8);destroyB(b);closeSheet()}break;
  case'bdel':if(b){refund(BD[b.type].cost,b.done?.5:.8);destroyB(b);sel=null}break;
  case'flip':if(mode.sel)mode.sel.f*=-1;break;
  case'big':if(mode.sel)mode.sel.s=Math.min(3,mode.sel.s*1.15);break;
  case'small':if(mode.sel)mode.sel.s=Math.max(.35,mode.sel.s/1.15);break;
  case'dup':if(mode.sel){const D=DECOR[mode.sel.k];if(!afford(D.cost)){toast('Faltam recursos','bad');break}pay(D.cost);const d={...mode.sel,id:G.idc++,x:mode.sel.x+.6,y:mode.sel.y+.3};G.decor.push(d);mode.sel=d;sfx('place')}break;
  case'del':if(mode.sel){refund(DECOR[mode.sel.k].cost,.5);G.decor.splice(G.decor.indexOf(mode.sel),1);mode.sel=null}break;
  case'done':mode={t:'none'};closeSheet();break}
  sheetSig='';renderSheet();markTabs()}
const TABS={build:['build','Construir'],craft:['craft','Criar'],bag:['bag','Mochila'],edit:['edit','Editar']};
document.querySelectorAll('#bar button').forEach(btn=>{const[ic,lb]=TABS[btn.dataset.tab];btn.innerHTML=svg(ic)+lb;btn.addEventListener('click',()=>{const t=btn.dataset.tab;sfx('tick');
  if(t==='edit'){if(mode.t==='edit'){mode={t:'none'};closeSheet()}else{$('#place').classList.remove('open');mode={t:'edit',sel:null};sel=null;openSheet('edit')}markTabs();return}
  if(t==='build'&&(mode.t==='build'||mode.t==='line'||mode.t==='decor')){if(sheetKind==='build')closeSheet();else{$('#place').classList.remove('open');openSheet('build')}return}
  if(mode.t!=='none')cancelMode();if(sheetKind===t){closeSheet();return}sel=null;openSheet(t)})});
$('#bLoc').innerHTML=svg('loc');$('#bMenu').innerHTML=svg('menu');

