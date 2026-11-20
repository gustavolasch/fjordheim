/* ================= Input ================= */
function s2w(px,py){const ix=(px-cam.x)/cam.z,iy=(py-cam.y)/cam.z,a=ix/HW,c=iy/HH;return[(a+c)/2,(c-a)/2]}
function w2s(x,y,z){const q=P(x,y,z||0);return[q[0]*cam.z+cam.x,q[1]*cam.z+cam.y]}
function zoomAt(px,py,f){const nz=clamp(cam.z*f,ZMIN,ZMAX),ix=(px-cam.x)/cam.z,iy=(py-cam.y)/cam.z;cam.z=nz;cam.x=px-ix*nz;cam.y=py-iy*nz}
const ptrs=new Map();let gest=null;
cv.addEventListener('pointerdown',e=>{if(!G||menuOpen)return;camGo=null;if(e.button===2){cancelMode();return}try{cv.setPointerCapture(e.pointerId)}catch(_){}
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});zT=null;
  if(ptrs.size===1){gest={k:'tap',sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY,t0:performance.now()};
    if(mode.t==='edit'){const d=pickDecor(e.clientX,e.clientY);if(d){mode.sel=d;const[wx,wy]=s2w(e.clientX,e.clientY);gest={k:'drag',ox:d.x-wx,oy:d.y-wy};openSheet('edit')}}}
  else if(ptrs.size===2){const[a,b]=[...ptrs.values()];gest={k:'pinch',d0:Math.hypot(a.x-b.x,a.y-b.y)||1,z0:cam.z,mx:(a.x+b.x)/2,my:(a.y+b.y)/2}}});
cv.addEventListener('pointermove',e=>{if(!G||menuOpen)return;const p=ptrs.get(e.pointerId);
  if(!p){if(e.pointerType==='mouse')hover(e.clientX,e.clientY);return}
  p.x=e.clientX;p.y=e.clientY;if(!gest)return;
  if(gest.k==='pinch'&&ptrs.size>=2){const[a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;cam.x+=mx-gest.mx;cam.y+=my-gest.my;gest.mx=mx;gest.my=my;zoomAt(mx,my,clamp(gest.z0*d/gest.d0,ZMIN,ZMAX)/cam.z);return}
  if(gest.k==='drag'){const[wx,wy]=s2w(e.clientX,e.clientY);sendCmd({t:'decorOp',id:mode.sel.id,op:'move',x:wx+gest.ox,y:wy+gest.oy});return}
  const dx=e.clientX-gest.lx,dy=e.clientY-gest.ly;gest.lx=e.clientX;gest.ly=e.clientY;
  if(gest.k==='tap'){if(Math.hypot(e.clientX-gest.sx,e.clientY-gest.sy)>9){gest.k='pan';cam.x+=e.clientX-gest.sx;cam.y+=e.clientY-gest.sy}}
  else if(gest.k==='pan'){cam.x+=dx;cam.y+=dy}
  if(e.pointerType==='mouse')hover(e.clientX,e.clientY)});
function pUp(e){if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(gest&&gest.k==='tap'&&e.type==='pointerup')onTap(e.clientX,e.clientY,e.pointerType,performance.now()-(gest.t0||0));
  if(ptrs.size===0)gest=null;else if(ptrs.size===1){const[p]=[...ptrs.values()];gest={k:'pan',lx:p.x,ly:p.y,sx:p.x,sy:p.y}}}
cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',pUp);
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{e.preventDefault();if(menuOpen)return;const base=zT?zT.z:cam.z;zT={z:clamp(base*Math.exp(-e.deltaY*.0016),ZMIN,ZMAX),px:e.clientX,py:e.clientY}},{passive:false});
addEventListener('keydown',e=>{if(menuOpen||!G)return;const k=e.key;const s=40;
  if(k==='Escape'){if(mode.t!=='none')cancelMode();else closeSheet()}
  else if(k==='ArrowLeft'||k==='a')cam.x+=s;else if(k==='ArrowRight'||k==='d')cam.x-=s;else if(k==='ArrowUp'||k==='w')cam.y+=s;else if(k==='ArrowDown'||k==='s')cam.y-=s;
  else if(k==='r'&&mode.t==='edit'&&mode.sel){sendCmd({t:'decorOp',id:mode.sel.id,op:'flip'})}else if(k==='r'&&mode.t==='decor'){mode.f=-(mode.f||1)}
  else if((k==='Delete'||k==='Backspace')&&mode.t==='edit'&&mode.sel){act('del')}
  else if((k==='Delete'||k==='Backspace')&&mode.t==='edit'&&sel&&sel.k==='b'){act('bdel')}
  else if(k===' '){toggleSpeed()}});
function hover(px,py){const[wx,wy]=s2w(px,py),tx=Math.floor(wx),ty=Math.floor(wy);
  if(mode.t==='build'){const d=BD[mode.type];let gx=tx-((d.w-1)>>1),gy=ty-((d.h-1)>>1);[gx,gy]=snapSpot(mode.type,gx,gy);if(gx!==mode.gx||gy!==mode.gy||!mode.has){mode.gx=gx;mode.gy=gy;mode.has=true;updPlace()}}
  else if(mode.t==='line'){if(mode.a&&(mode.b[0]!==tx||mode.b[1]!==ty)){mode.b=[tx,ty];updPlace()}}
  else if(mode.t==='decor'){mode.wx=wx;mode.wy=wy;mode.has=true}}
// if the tapped spot is blocked by a tree/rock/building, slide the piece to the nearest free spot (within 2 tiles)
function snapSpot(type,gx,gy){const okAt=(x,y)=>{const r=placeCheck(type,x,y);return r===true||r==='Faltam recursos'};if(okAt(gx,gy))return[gx,gy];
  let best=null,bd=9;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const d=dx*dx+dy*dy;if(d<bd&&okAt(gx+dx,gy+dy)){bd=d;best=[gx+dx,gy+dy]}}return best||[gx,gy]}
function onTap(px,py,type,held){const[wx,wy]=s2w(px,py),tx=Math.floor(wx),ty=Math.floor(wy);
  if(mode.t==='build'){hover(px,py);if(type==='mouse')confirmPlace();return}
  if(mode.t==='line'){if(!mode.a){mode.a=[tx,ty];mode.b=[tx,ty]}else{mode.b=[tx,ty];if(type==='mouse')confirmPlace()}updPlace();return}
  if(mode.t==='decor'){mode.wx=wx;mode.wy=wy;mode.has=true;if(type==='mouse')confirmPlace();return}
  if(mode.t==='edit'){const d=pickDecor(px,py);
    if(d){mode.sel=d;sel=null}
    else{let eb=bAt(tx,ty);if(!eb)for(const o of[1,2]){const c=bAt(tx+o,ty+o);if(c&&!BD[c.type].flat&&!BD[c.type].line){eb=c;break}}
      mode.sel=null;sel=eb?{k:'b',id:eb.id}:null}
    openSheet('edit');return}
  const tmb=tombAt(wx,wy);if(tmb){sel={k:'t',id:tmb.id};openSheet('tomb');return}
  const me=PL();
  if(me){const[sx,sy]=w2s(me.x,me.y,9);if(Math.hypot(px-sx,py-sy)<Math.max(16,18*cam.z)){openSheet('bag');return}}
  let best=null,bd=20;for(const u of G.units){if(u.hidden||u.kind==='player')continue;const[sx,sy]=w2s(u.x+u.ox,u.y+u.oy,9);const d=Math.hypot(px-sx,py-sy)/Math.max(.8,cam.z);if(d<bd){bd=d;best=u}}
  if(best){if(best.kind==='animal'||best.kind==='raider'){ataqueAlvo(best,held>450);return}sel={k:'u',id:best.id};openSheet('info');return}
  // buildings: exact tile first, then tiles in front for tall ones
  let b=bAt(tx,ty);if(!b)for(const o of[1,2]){const c=bAt(tx+o,ty+o);if(c&&!BD[c.type].flat&&!BD[c.type].line){b=c;break}}
  if(b&&tapBuilding(b,tx,ty))return;
  const d=pickDecor(px,py);if(d){mode={t:'edit',sel:d};markTabs();openSheet('edit');return}
  // natural objects: exact tile, then canopy of a tree standing in front
  const oi=pickObj(px,py);
  closeSheet();sel=null;
  if(oi!=null){const ob=G.obj[oi];order({type:'obj',i:oi});puff(oi%N+.5,(oi/N|0)+.5,'ring');const lab={tree:'🪓 Derrubar',log:'Recolher toras',branch:'Pegar galho',pebble:'Pegar pedra',stone:'⛏️ Quebrar',ore:'⛏️ Minerar',bush:'Colher frutinhas'}[ob.t];if(lab)floater(oi%N+.5,(oi/N|0)+.5,lab);return}
  if(!inb(tx,ty))return;
  if(G.tiles[idx(tx,ty)]<=1){order({type:'fish',x:tx,y:ty});puff(tx+.5,ty+.5,'ring');return}
  if(me){const r=sendCmd({t:'walk',x:tx,y:ty});if(r.ok)puff(tx+.5,ty+.5,'ring');else toast(r.msg,r.kind)}}
function tapBuilding(b,tx,ty){const d=BD[b.type];
  if(d.flat&&d.pass&&b.type!=='farm')return false; // floors & paths: just walk on them
  if(!b.done){order({type:'build',b:b.id});puff(b.x+b.w/2,b.y+b.h/2,'ring');sel={k:'b',id:b.id};openSheet('info');return true}
  if(b.type==='bridge')return false;
  if(d.store){order({type:'deposit',b:b.id});sel={k:'b',id:b.id};openSheet('info');return true}
  if(b.type==='farm'){order({type:'farm',b:b.id});floater(b.x+1.5,b.y+1.5,'Cuidar da lavoura');return true}
  if(b.type==='dock'){let w=null;for(let dy=0;dy<b.h&&!w;dy++)for(let dx=0;dx<b.w;dx++)if(G.tiles[idx(b.x+dx,b.y+dy)]<=1){w=[b.x+dx,b.y+dy];break}if(w){order({type:'fish',x:w[0],y:w[1]})}return true}
  if(d.grp&&!d.gate)return false;
  sel={k:'b',id:b.id};openSheet('info');return true}
// hit-test natural objects by what is drawn on screen (tall trees, long logs, tiny pebbles), not just the tile under the finger
function pickObj(px,py){const[wx,wy]=s2w(px,py),tx=Math.floor(wx),ty=Math.floor(wy),z=cam.z;let best=null,bd=1e9;
  for(let y=ty-1;y<=ty+3;y++)for(let x=tx-1;x<=tx+3;x++){if(!inb(x,y))continue;const i=idx(x,y),o=G.obj[i];if(!o)continue;
    const[sx,sy]=w2s(x+.5+(o.ox||0),y+.5+(o.oy||0)),s=(o.s||1)*z,tall=o.t==='tree'||o.t==='falling';
    const top=sy-(tall?40*(o.t==='tree'?.35+.65*o.g:1):o.t==='stone'||o.t==='ore'?18:12)*s-4,bot=sy+7*z,cx=o.t==='log'?sx+16*z:sx,hw=(tall?13:o.t==='log'?22:12)*s+5;
    if(px<cx-hw||px>cx+hw||py<top||py>bot)continue;const d=Math.hypot(px-cx,py-(top+bot)/2)*(tall?1.2:1);if(d<bd){bd=d;best=i}}
  return best}
function pickDecor(px,py){let best=null,bd=1e9;for(const d of G.decor){const D=DECOR[d.k];const[sx,sy]=w2s(d.x,d.y);const s=d.s*cam.z*(D.big?2.4:1);const dx=px-sx,dy=py-sy;
  if(Math.abs(dx)<16*s+8&&dy<10*s+6&&dy>-34*s-8){const dd=Math.hypot(dx,dy+10*s);if(dd<bd){bd=dd;best=d}}}return best}
function enterBuild(type){const d=BD[type];closeSheet();sel=null;mode=d.line?{t:'line',type,a:null,b:null}:{t:'build',type,has:false,gx:0,gy:0};
  if(!d.line&&isTouch){const[wx,wy]=s2w(W/2,H*.45);[mode.gx,mode.gy]=snapSpot(type,Math.floor(wx)-((d.w-1)>>1),Math.floor(wy)-((d.h-1)>>1));mode.has=true}
  showHint('build');markTabs();updPlace()}
function enterDecor(k){closeSheet();sel=null;mode={t:'decor',kind:k,has:false,f:1};if(isTouch){const[wx,wy]=s2w(W/2,H*.45);mode.wx=wx;mode.wy=wy;mode.has=true}markTabs();updPlace()}
function cancelMode(){mode={t:'none'};$('#place').classList.remove('open');markTabs();if(sheetKind==='edit')closeSheet()}
function confirmPlace(){
  if(mode.t==='build'){if(!mode.has)return;const r=sendCmd({t:'build',type:mode.type,x:mode.gx,y:mode.gy});if(!r.ok){toast(r.msg,'bad');sfx('bad');return}const b=r.b;if(b)floater(b.x+b.w/2,b.y+b.h/2,'−'+Object.entries(BD[b.type].cost).map(([k,v])=>v+RES[k][0]).join(' '));if(!afford(BD[mode.type].cost))cancelMode()}
  else if(mode.t==='line'){if(!mode.a)return;const r=sendCmd({t:'line',type:mode.type,a:mode.a,b:mode.b});
    if(!r.ok){toast(r.msg,'bad');sfx('bad')}mode.a=null;mode.b=null}
  else if(mode.t==='decor'){if(!mode.has)return;const r=sendCmd({t:'decor',kind:mode.kind,x:mode.wx,y:mode.wy,f:mode.f});if(!r.ok){toast(r.msg,'bad');sfx('bad');return}puff(mode.wx,mode.wy,'dust');sfx('place');if(mode.kind==='campfire'||mode.kind==='torch')completeHint('night')}
  updPlace()}
// innerHTML só é reescrito quando o conteúdo muda: hover() chama updPlace a cada troca de tile,
// e cada reescrita re-parseia as miniaturas (data URLs grandes).
let placeSig='';
function updPlace(){const el=$('#place');if(mode.t==='none'||mode.t==='edit'){el.classList.remove('open');return}el.classList.add('open');let name='',cost={},st='',ok=true,extra='',img='';
  if(mode.t==='build'){const d=BD[mode.type];name=d.n;cost=d.cost;img=THUMB[mode.type];const r=mode.has?placeCheck(mode.type,mode.gx,mode.gy):'Toque no mapa';ok=r===true;st=ok?`<span class="ok">${isTouch?'Toque para mover · ✓ constrói':'Clique para construir'}</span>`:`<span class="err">${r}</span>`}
  else if(mode.t==='line'){const d=BD[mode.type];name=d.n;cost=d.cost;img=THUMB[mode.type];const n=mode.a?lineTiles(mode.a,mode.b).length:0;ok=!!mode.a;st=!mode.a?'Toque no ponto inicial':`<span class="ok">${n} peça${n>1?'s':''} · ${isTouch?'toque o fim e ✓':'clique no fim'}</span>`;extra=mode.a?'<button class="sbtn" data-p="reset" title="Recomeçar">↺</button>':''}
  else if(mode.t==='decor'){const D=DECOR[mode.kind];name=D.n;cost=D.cost;img=DTHUMB[mode.kind];ok=afford(D.cost);st=ok?`<span class="ok">${isTouch?'Toque em qualquer lugar · ✓':'Clique para colocar · R vira'}</span>`:'<span class="err">Faltam recursos</span>';extra='<button class="sbtn" data-p="flip">↔</button>'}
  const html=`<img src="${img}" alt=""><div class="txt"><b>${name} · ${costHTML(cost)}</b>${st}</div>${extra}<button class="sbtn" data-p="pieces" title="Peças">▦</button>${isTouch||mode.t!=='build'?`<button class="gbtn" data-p="ok" ${ok?'':'disabled'}>✓</button>`:''}<button class="sbtn" data-p="cancel">✕</button>`;if(html!==placeSig){placeSig=html;el.innerHTML=html}}
$('#place').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b)return;const a=b.dataset.p;if(a==='ok')confirmPlace();else if(a==='cancel')cancelMode();else if(a==='reset'){mode.a=null;mode.b=null;updPlace()}else if(a==='flip'){mode.f=-(mode.f||1)}else if(a==='pieces'){const keep=mode;$('#place').classList.remove('open');openSheet('build');mode=keep}});


/* ---- combate: tocar em animal ou invasor ataca; segurar um pouco dá golpe forte ---- */
function ataqueAlvo(t,forte){const me=PL();if(!me||me.down)return;closeSheet();sel=null;
  order({type:'attack',uid:t.id,heavy:!!forte});puff(t.x,t.y,'ring');floater(t.x,t.y,forte?'⚔️ Golpe forte':'⚔️ Atacar')}
