/* ================= Drawing: figures ================= */
const ACT_TOOL={chop:'axe',mine:'pick',fish:'rod',build:'hammer',farm:'sickle',forge:'hammer',craft:'hammer'};
function drawHeld(u,sw){let t=u.kind==='warrior'?u.wc:u.kind==='raider'?'raxe':u.tool;
  if(u.kind==='player'){t=u.act&&ACT_TOOL[u.act.type];if(t&&!G.items[t]&&t!=='axe'&&t!=='pick'&&t!=='rod')t=null}
  const a=-.6+(sw||0);const hx=3.5+Math.cos(a)*4,hy=-11+Math.sin(a)*4;ctx.lineCap='round';
  ln([2.4,-12],[hx,hy],u.skin,1.6);
  if(!t)return;const dir=[Math.cos(a-1.2),Math.sin(a-1.2)];
  const L=(l)=>[hx+dir[0]*l,hy+dir[1]*l];
  switch(t){
   case'axe':case'raxe':ln([hx-dir[0]*2,hy-dir[1]*2],L(9),'#6b4423',1.5);{const e=L(9);pp([e,[e[0]+3.5,e[1]+1],[e[0]+2,e[1]+4.5]],t==='raxe'?'#7d8288':'#a9a49a')}break;
   case'pick':ln([hx-dir[0]*2,hy-dir[1]*2],L(9),'#6b4423',1.5);{const e=L(9);ctx.beginPath();ctx.moveTo(e[0]-4,e[1]+1.5);ctx.quadraticCurveTo(e[0],e[1]-2.5,e[0]+4,e[1]+1.5);ctx.strokeStyle='#a9a49a';ctx.lineWidth=1.8;ctx.stroke()}break;
   case'sickle':ln(L(0),L(5),'#6b4423',1.5);{const e=L(5);ctx.beginPath();ctx.arc(e[0]+2.5,e[1],3,Math.PI,Math.PI*2.1);ctx.strokeStyle='#c9ced3';ctx.lineWidth=1.3;ctx.stroke()}break;
   case'rod':{const e=L(16);ln(L(-2),e,'#8a6a3a',1);if(u.act&&u.act.type==='fish'){ctx.strokeStyle='rgba(240,240,240,.7)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(e[0],e[1]);ctx.lineTo(e[0]+5,e[1]+12);ctx.stroke()}}break;
   case'hammer':ln([hx-dir[0]*2,hy-dir[1]*2],L(7),'#6b4423',1.5);{const e=L(7);ctx.fillStyle='#8f8b84';ctx.fillRect(e[0]-2.2,e[1]-1.8,4.4,3.6)}break;
   case'warrior':ln(L(0),L(11),'#d8dde2',1.8);ln([hx-1.5,hy+1],[hx+1.5,hy-1],'#8a6a3a',1.6);break;
   case'spear':ln([hx-dir[0]*5,hy-dir[1]*5],L(16),'#6b4423',1.4);{const e=L(16);pp([[e[0]+dir[0]*4,e[1]+dir[1]*4],[e[0]-dir[1]*1.6,e[1]+dir[0]*1.6],[e[0]+dir[1]*1.6,e[1]-dir[0]*1.6]],'#d8dde2')}break;
   case'archer':ctx.beginPath();ctx.arc(hx+1,hy,6,-1.3,1.3);ctx.strokeStyle='#7a4a22';ctx.lineWidth=1.4;ctx.stroke();break}}
function drawFigure(bx,by,u,sc){sc=sc||1;const mv=u.moving?Math.sin(u.anim)*2.2:0,f=u.face||1;
  ctx.save();ctx.translate(bx,by);ctx.scale(f*sc,sc);ctx.lineCap='round';
  ell(1,0,5,2.2,'rgba(0,0,0,.25)');
  if(u.kind==='player'){const w=G.inv;if(w.wood>0){ctx.save();ctx.rotate(-.12);ln([-7,-15],[5,-16.5],'#5e3b1f',3.6);ell(5,-16.5,1.5,1.9,'#c9a16a');ctx.restore()}
    if(w.stick+w.stone+w.food+w.iron>0){ell(-4.6,-10.5,3.2,3.6,'#7a5a34');ln([-4.6,-14],[-4.6,-13],'#4a2f1b',1)}
    pp([[-2.6,-13],[-5.6,-3.5],[-.5,-4.5]],'#9a2f24')}
  ln([-1.5,-6],[-1.5+mv,0],'#3b2a1d',1.9);ln([1.5,-6],[1.5-mv,0],'#3b2a1d',1.9);
  if(u.carry>0){if(u.carryT==='wood'){ctx.fillStyle='#7a4a22';ctx.fillRect(-6,-15,3.5,8)}else ell(-4.5,-11,3,3,u.carryT==='iron'?'#6a5a52':'#9a968e')}
  const war=u.kind==='warrior'||u.kind==='raider';
  ctx.beginPath();ctx.moveTo(-3.6,-5.5);ctx.lineTo(3.6,-5.5);ctx.lineTo(2.9,-13);ctx.lineTo(-2.9,-13);ctx.closePath();ctx.fillStyle=u.tunic;ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(-3.6,-8.6,7.2,1.3);
  if(war){ctx.fillStyle='rgba(200,205,210,.35)';ctx.fillRect(-2.9,-13,5.8,3)}
  ell(0,-15.6,2.9,2.9,u.skin);
  if(war){ctx.beginPath();ctx.arc(0,-16.2,3.2,Math.PI,0);ctx.fillStyle=u.kind==='raider'?'#3a3634':'#8d949b';ctx.fill();
    if(u.kind==='warrior'){ln([-3,-17],[-5,-20],'#e9e0c8',1.3);ln([3,-17],[5,-20],'#e9e0c8',1.3)}else ln([0,-16],[0,-13.5],'#3a3634',1)}
  else{ctx.beginPath();ctx.arc(0,-16.3,3.1,Math.PI*.95,Math.PI*2.05);ctx.fillStyle=u.hair;ctx.fill();if(u.fem){ln([-2.6,-15],[-3,-10.5],u.hair,1.6)}else{ctx.beginPath();ctx.arc(.3,-14.2,2,0,Math.PI);ctx.fillStyle=u.hair;ctx.fill()}}
  const sw=u.swing>0?Math.sin(u.swing*10)*1.4:(u.act&&u.act.type!=='idle'&&u.act.type!=='fish'&&u.act.type!=='wait'?Math.sin(u.act.t*9)*.9:0);
  drawHeld(u,sw);
  if((u.kind==='warrior'&&u.wc==='warrior')||u.kind==='raider'){ell(-3.2,-9.5,3.6,3.8,u.kind==='raider'?'#4a2a1e':'#b5352c');ell(-3.2,-9.5,1.1,1.1,'#d9c27a')}
  ctx.restore()}
// Jogador: frame do personagem 3D (assets/sprites/pl_*). Retorna false se o sprite ainda não carregou.
const PL_WORK=['chop','mine','fish','farm','build','craft','forge','pickup','takelog','berry'];
// 8 direções (k*45°, ângulo do heading no mundo do jogo) — sprites pl_<frame>_d<k>
function playerDir(u){return ((Math.round((u.heading||0)/(Math.PI/4))%8)+8)%8}
function playerFrame(u){const d=playerDir(u);
  if(u.act&&PL_WORK.includes(u.act.type))return 'pl_work_'+(Math.floor(u.act.t*5)%4)+'_d'+d;
  if(u.moving)return 'pl_walk_'+(Math.floor(u.anim*.7)%8)+'_d'+d;
  return 'pl_idle_'+(Math.floor(perfT*1.6)%2)+'_d'+d}
function drawPlayerSprite(bx,by,u){const s=sprFor(playerFrame(u));if(!s)return false;
  ctx.save();ctx.translate(bx,by);ctx.drawImage(s.img,-s.ax*.5,-s.ay*.5,s.w*.5,s.h*.5);ctx.restore();return true}
function drawUnit(u){const[bx,by]=P(u.x+u.ox,u.y+u.oy,0);
  if(u.kind==='player'){ctx.strokeStyle='rgba(243,201,105,.75)';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(bx,by,9,4.4,0,0,6.283);ctx.stroke();
    if(cam.z<.7){const k=1/cam.z;ctx.fillStyle='#f3c969';pp([[bx,by-24-8*k],[bx-4*k,by-24-14*k],[bx+4*k,by-24-14*k]],'#f3c969')}
    if(u.down){ctx.globalAlpha=.5}}
  if(!(u.kind==='player'&&drawPlayerSprite(bx,by,u)))drawFigure(bx,by,u,u.kind==='villager'||u.kind==='player'?1:1.08);ctx.globalAlpha=1;
  if(u.hp<u.max&&u.kind!=='player'||u.kind==='player'&&u.hp<u.max*.98){ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(bx-7,by-26,14,2.5);ctx.fillStyle=u.kind==='raider'?'#e2533f':'#6fd35b';ctx.fillRect(bx-7,by-26,14*Math.max(0,u.hp/u.max),2.5)}
  if(u.act&&u.kind==='player'&&u.act.dur>.6&&u.act.type!=='wait'&&u.act.type!=='build'){ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(bx-8,by-30,16,2.4);ctx.fillStyle='#f3c969';ctx.fillRect(bx-8,by-30,16*clamp(u.act.t/u.act.dur,0,1),2.4)}
  if(sel&&sel.k==='u'&&sel.id===u.id){ctx.strokeStyle='#f3c969';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(bx,by,8,4,0,0,6.283);ctx.stroke()}}

