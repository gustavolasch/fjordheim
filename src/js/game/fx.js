/* ================= Hints (contextual, dismiss on completion) ================= */
let hintCur=null,hintAt=0;
function showHint(id,force){if(!G||G.demo||G.hints[id])return;if(hintCur===id)return;if(hintCur&&!force)return;hintCur=id;hintAt=perfT;$('#hintT').replaceChildren(richNodes(HINTS[id]));$('#hint').classList.remove('off')}
function completeHint(id){if(!G)return;G.hints[id]=1;if(hintCur===id){hintCur=null;$('#hint').classList.add('off')}}
$('#hintX').addEventListener('click',()=>{if(hintCur)completeHint(hintCur)});
function hintChecks(){if(!G||G.demo||menuOpen)return;
  if(hintCur&&(hintCur==='night'||hintCur==='fence')&&perfT-hintAt>14)completeHint(hintCur);
  if(hintCur)return;
  if(!G.hints.walk)return showHint('walk');
  if(!G.hints.craft&&have('stick')>=2&&have('stone')>=2&&!G.items.axe)return showHint('craft');
  if(!G.hints.chop&&G.items.axe>0)return showHint('chop');
  if(!G.hints.shelter&&G.flags.deposited&&!G.bld.some(b=>b.type==='shelter'))return showHint('shelter');
  if(!G.hints.night&&darkness()>.25)return showHint('night')}

/* ================= Particles ================= */
function puff(x,y,type){if(PT.length>500)return;const r=Math.random;
  const p={type,x:x+(r()-.5)*.3,y:y+(r()-.5)*.3,z:4,vx:0,vy:0,vz:0,life:1,max:1,r:3,g:0};
  if(type==='smoke'){p.z=8+r()*10;p.vz=14+r()*8;p.vx=.15+r()*.1;p.vy=-.1;p.r=3+r()*3;p.life=p.max=2.5+r()*1.5}
  else if(type==='chimney'){p.type='smoke';p.vz=12+r()*5;p.vx=.12+windStrength()*.15;p.vy=-.1;p.r=2.5;p.life=p.max=3+r()}
  else if(type==='dust'){p.z=2;p.vz=6+r()*6;p.vx=(r()-.5)*.6;p.vy=(r()-.5)*.6;p.r=2+r()*3;p.life=p.max=1+r()*.6}
  else if(type==='leaf'){p.z=16+r()*20;p.vz=-4;p.g=8;p.vx=(r()-.3)*.8;p.vy=(r()-.5)*.6;p.r=1.8+r();p.life=p.max=1.4+r();p.c=pick(G&&G.biome==='autumn'?BIO.leaves:BIO.pines)}
  else if(type==='pop'){p.z=10;p.vz=24+r()*10;p.vx=(r()-.5)*.8;p.vy=(r()-.5)*.8;p.life=p.max=.5}
  else if(type==='ring'){p.z=0;p.life=p.max=.6}
  else if(type==='chip'||type==='rockchip'||type==='debris'||type==='blood'||type==='spark'){p.z=8+r()*6;p.vz=20+r()*25;p.g=90;p.vx=(r()-.5)*1.6;p.vy=(r()-.5)*1.6;p.r=1.4+r();p.life=p.max=.6+r()*.4}
  else if(type==='fire'){p.z=6+r()*10;p.vz=18+r()*10;p.r=2+r()*2.5;p.life=p.max=.5+r()*.4}
  PT.push(p)}
function floater(x,y,text){PT.push({type:'txt',x,y,z:26,vz:16,vx:0,vy:0,life:1.5,max:1.5,text,g:0})}
function fishJump(x,y){PT.push({type:'fish',x,y,z:0,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6,vz:0,life:.9,max:.9,g:0,c:Math.random()<.5});for(let k=0;k<4;k++)PT.push({type:'splash',x,y,z:1,vx:(Math.random()-.5),vy:(Math.random()-.5),vz:20+Math.random()*15,g:80,life:.5,max:.5,r:1.3})}
function updParticles(dt){for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.life-=dt;if(p.life<=0){PT.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.g){p.vz-=p.g*dt;if(p.z<0){p.z=0;p.vz*=-.3;p.vx*=.5;p.vy*=.5}}if(p.type==='smoke')p.r+=dt*3.5}
  for(let i=AR.length-1;i>=0;i--){const a=AR[i],t=UMAP.get(a.tid);if(!t){AR.splice(i,1);continue}const dx=t.x-a.x,dy=t.y-a.y,d=Math.hypot(dx,dy);a.ang=Math.atan2((dx+dy)*HH,(dx-dy)*HW);
    if(d<.3){dmgUnit(t,a.dmg,a.tipo,{efeito:a.efeito||[],src:UMAP.get(a.src)});AR.splice(i,1);continue}const s=a.sp*dt;a.x+=dx/d*s;a.y+=dy/d*s;a.z=lerp(a.z,10,.1)}}

