/* ================= Menus de toque: depósito e escolha entre objetos sobrepostos ================= */
// Tocar num depósito abre um menu pequeno ao lado dele. Só "Ver estoque" abre a janela.
let depId=null;
function closeDepMenu(){depId=null;const el=document.getElementById('depmenu');if(el)el.classList.remove('open')}
function openDepMenu(b){let el=document.getElementById('depmenu');
  if(!el){el=document.createElement('div');el.id='depmenu';el.className='glass';
    el.innerHTML='<button class="sbtn" data-d="guardar">Guardar tudo</button><button class="sbtn" data-d="ver">Ver estoque</button><button class="sbtn red" data-d="desmontar">Desmontar</button>';
    el.addEventListener('click',e=>{const a=e.target.closest('[data-d]');if(!a)return;const bb=depId!=null&&BMAP.get(depId);closeDepMenu();if(!bb)return;
      if(a.dataset.d==='guardar')order({type:'deposit',b:bb.id});
      else if(a.dataset.d==='ver')openSheet('bag');
      else sendCmd({t:'desmontarDep',b:bb.id})});
    document.body.appendChild(el)}
  depId=b.id;const[sx,sy]=w2s(b.x+b.w/2,b.y+b.h/2,0);
  el.style.left=Math.max(8,Math.min(innerWidth-200,sx-90))+'px';el.style.top=Math.max(8,sy-120)+'px';el.classList.add('open')}

// ---- escolha entre objetos sobrepostos ----
// prioridade: recursos e objetos pequenos primeiro; construções e decoração por último
const PICK_PRI={pebble:0,branch:0,bush:1,log:1,stone:2,ore:2,stump:3,falling:3,tree:4};
// acerto por tela, sem escolher só um (pickObj escolhe um; aqui pegamos todos)
function objHits(px,py){const[wx,wy]=s2w(px,py),tx=Math.floor(wx),ty=Math.floor(wy),z=cam.z,out=[];
  for(let y=ty-1;y<=ty+3;y++)for(let x=tx-1;x<=tx+3;x++){if(!inb(x,y))continue;const i=idx(x,y),o=G.obj[i];if(!o)continue;
    const[sx,sy]=w2s(x+.5+(o.ox||0),y+.5+(o.oy||0)),s=(o.s||1)*z,tall=o.t==='tree'||o.t==='falling';
    const top=sy-(tall?40*(o.t==='tree'?.35+.65*o.g:1):o.t==='stone'||o.t==='ore'?18:12)*s-4,bot=sy+7*z,cx=o.t==='log'?sx+16*z:sx,hw=(tall?13:o.t==='log'?22:12)*s+5;
    if(px<cx-hw||px>cx+hw||py<top||py>bot)continue;out.push(i)}
  return out}
function decorHits(px,py){const out=[];for(const d of G.decor){const D=DECOR[d.k];const[sx,sy]=w2s(d.x,d.y);const s=d.s*cam.z*(D.big?2.4:1);const dx=px-sx,dy=py-sy;
  if(Math.abs(dx)<16*s+8&&dy<10*s+6&&dy>-34*s-8)out.push(d)}return out}
// construção que o toque realmente usa (ou que só se seleciona): mesma regra de tapBuilding
function bTapInter(b){const d=BD[b.type];if(d.flat&&d.pass&&b.type!=='farm')return false;if(b.type==='bridge')return false;
  return!b.done||!!d.store||b.type==='farm'||b.type==='dock'||!(d.grp&&!d.gate)}
function tapCands(px,py,tx,ty){const out=[];
  let b=bAt(tx,ty);if(!b)for(const o of[1,2]){const c=bAt(tx+o,ty+o);if(c&&!BD[c.type].flat&&!BD[c.type].line){b=c;break}}
  if(b&&!(BD[b.type].flat&&BD[b.type].pass&&b.type!=='farm')&&b.type!=='bridge')out.push({k:'b',ref:b,inter:bTapInter(b),pri:6,name:BD[b.type].n+(b.done?'':' (obra)')});
  for(const d of decorHits(px,py))out.push({k:'d',ref:d,inter:true,pri:5,name:DECOR[d.k].n});
  for(const i of objHits(px,py)){const o=G.obj[i];out.push({k:'o',ref:i,inter:true,pri:PICK_PRI[o.t]??3,name:OBJNAME[o.t]||o.t})}
  return out.sort((a,c)=>a.pri-c.pri)}
// age sobre o alvo escolhido (mesmo comportamento de antes para cada tipo)
function runCand(c,tx,ty){
  if(c.k==='b'){if(tapBuilding(c.ref,tx,ty))return;sel={k:'b',id:c.ref.id};openSheet('info');return}
  if(c.k==='d'){mode={t:'edit',sel:c.ref};markTabs();openSheet('edit');return}
  const oi=c.ref;closeSheet();sel=null;const ob=G.obj[oi];order({type:'obj',i:oi});puff(oi%N+.5,(oi/N|0)+.5,'ring');
  const lab={tree:'[[itens.axe]] Derrubar',log:'Recolher toras',branch:'Pegar galho',pebble:'Pegar pedra',stone:'[[ferramentas.pick]] Quebrar',ore:'[[ferramentas.pick]] Minerar',bush:'Colher frutinhas'}[ob.t];if(lab)floater(oi%N+.5,(oi/N|0)+.5,lab)}
function closePickMenu(){const el=document.getElementById('pickmenu');if(el)el.remove()}
function openPickMenu(cands,px,py,tx,ty){closePickMenu();const list=cands.slice(0,6);
  const el=document.createElement('div');el.id='pickmenu';el.className='glass';
  el.innerHTML=list.map((c,i)=>`<button class="sbtn" data-i="${i}">${c.name}</button>`).join('');
  el.addEventListener('click',e=>{const a=e.target.closest('[data-i]');if(!a)return;const c=list[+a.dataset.i];closePickMenu();if(c)runCand(c,tx,ty)});
  document.body.appendChild(el);
  el.style.left=Math.max(8,Math.min(innerWidth-190,px-80))+'px';el.style.top=Math.max(8,py-60-list.length*40)+'px'}
