/* ================= HUD / toasts ================= */
let hudSig='';
function updHUD(){if(!G)return;needsHUD();const w=bagW();
  const h=Object.keys(RES).map(k=>`<div class="chip" title="${RES[k][1]}">${RES[k][0]} ${Math.floor(have(k))}</div>`).join('')+`<button class="chip bag ${w>=BAG?'full':''}" data-bag="1">🎒 ${w}/${BAG}</button>`;
  if(h!==hudSig){hudSig=h;$('#res').innerHTML=h}
  const r=G.units.filter(u=>u.kind==='raider').length,el=$('#raid');if(r){el.classList.remove('hidden');el.textContent=`⚔️ Invasão: ${r} · tocar para ver`}else el.classList.add('hidden');
  $('#bSpeed').textContent=paused?'⏸':G.speed+'×'}
$('#res').addEventListener('click',e=>{if(e.target.closest('[data-bag]')){if(sheetKind==='bag')closeSheet();else{if(mode.t!=='none')cancelMode();openSheet('bag')}}});
$('#raid').addEventListener('click',()=>{const r=G.units.find(u=>u.kind==='raider');if(r)focusOn(r.x,r.y)});
$('#bLoc').addEventListener('click',()=>{const p=PL();if(p)focusOn(p.x,p.y)});
function toggleSpeed(){if(paused){paused=false;G.speed=1}else if(G.speed>=3){paused=true}else G.speed++;updHUD()}
$('#bSpeed').addEventListener('click',toggleSpeed);
$('#bMenu').addEventListener('click',()=>openMenu(true));
function toast(msg,kind){if(G&&G.demo)return;const box=$('#toasts');for(const c of box.children)if(c.textContent===msg)return;const el=document.createElement('div');el.className='toast glass '+(kind||'');el.textContent=msg;box.appendChild(el);while(box.children.length>2)box.firstChild.remove();setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),400)},kind==='bad'?3800:3000)}
function centerOn(x,y){const q=P(x,y);cam.x=W/2-q[0]*cam.z;cam.y=H*.48-q[1]*cam.z}
function focusOn(x,y){const q=P(x,y);camGo={x:W/2-q[0]*cam.z,y:H*.48-q[1]*cam.z}}
function centerCam(){const p=PL();if(p)centerOn(p.x,p.y);else centerOn(G.start[0],G.start[1])}

