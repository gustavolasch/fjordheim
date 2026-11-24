/* ================= Resources & storage ================= */
function have(k){return(G.inv[k]||0)+(G.res[k]||0)}
function afford(c){if(DEV.inf)return true;for(const k in c)if(have(k)<c[k])return false;return true}
function pay(c){if(DEV.inf)return;for(const k in c){let n=c[k];const a=Math.min(n,G.inv[k]);G.inv[k]-=a;n-=a;G.res[k]=Math.max(0,G.res[k]-n)}}
function refund(c,f){const cap=storeCap();for(const k in c){let v=Math.floor(c[k]*f);const s=Math.min(v,Math.max(0,cap-G.res[k]));G.res[k]+=s;G.inv[k]+=v-s}}
function costHTML(c){const ks=Object.keys(c);if(!ks.length)return'grátis';return ks.map(k=>`<span class="${have(k)<c[k]?'no':''}">${icon('recursos',k)}${c[k]}</span>`).join(' ')}
function storeCap(){let c=0;for(const b of G.bld)if(b.done&&BD[b.type].store)c+=BD[b.type].store;return c}
// texto do limite: "180 de cada (Armazém 150 + Pilha de recursos 30)"
function capLabel(){const cap=storeCap();if(!cap)return'';const parts={};for(const b of G.bld)if(b.done&&BD[b.type].store)parts[BD[b.type].n]=(parts[BD[b.type].n]||0)+BD[b.type].store;return`${cap} de cada (${Object.keys(parts).map(n=>`${n} ${parts[n]}`).join(' + ')})`}
function bagW(){let w=0;for(const k in G.inv)w+=G.inv[k]*WEIGHT[k];for(const k in G.items)if(G.items[k]>0)w+=G.items[k]*(ITEMS[k]?.peso||0);return Math.round(w*10)/10}
function canCarry(k,n){if(DEV.inf)return true;return bagW()+WEIGHT[k]*(n||1)<=BAG+1e-6}
function addInv(k,n,x,y){G.inv[k]+=n;if(x!=null)floater(x,y,`+${n} [[recursos.${k}]]`)}
function addRes(k,v,x,y){const cap=storeCap();G.res[k]=Math.min(cap,G.res[k]+v);if(x!=null)floater(x,y,`+${v} [[recursos.${k}]]`)}
// só recursos (G.inv) entram no depósito; ferramentas e armas ficam na mochila e não contam como "sobra"
function deposit(b){const cap=storeCap();let moved=0,left=0;for(const k in G.inv){const n=Math.min(G.inv[k],Math.max(0,cap-G.res[k]));if(n>0){G.inv[k]-=n;G.res[k]+=n;moved+=n}left+=G.inv[k]}
  if(moved){sfx('store');floater(b.x+b.w/2,b.y+b.h/2,'[[interface.depositar]] guardado');completeHint('full');G.flags.deposited=true;if(left>0)toast('Depósito cheio para alguns itens. Construa outro.')}
  else if(left>0)toast('Os depósitos estão cheios. Construa outro.','bad');else toast('Nada de recurso para guardar')}
function bagFull(k){const w=bagW();toast(k&&w<BAG?`[[interface.mochila]] Sem espaço para ${RES[k][0].toLowerCase()} (pesa ${WEIGHT[k]}). Mochila ${w}/${BAG}.`:`[[interface.mochila]] Mochila cheia (${w}/${BAG}). Guarde numa Pilha de recursos.`,'bad');showHint('full');sfx('bad')}

/* ================= Buildings logic ================= */
function bAt(x,y){if(!inb(x,y))return null;const id=G.occ[idx(x,y)];return id?BMAP.get(id):null}
function longhouse(){return G.bld.find(b=>b.type==='longhouse')}
function houseCap(){let c=0;for(const b of G.bld)if(b.done&&BD[b.type].house)c+=BD[b.type].house;return c}
function popCount(){let c=0;for(const u of G.units)if(u.kind==='villager'||u.kind==='warrior')c++;return c}
function placeCheck(type,x,y){const d=BD[type];let water=0,land=0;
  for(let dy=0;dy<d.h;dy++)for(let dx=0;dx<d.w;dx++){const X=x+dx,Y=y+dy;if(!inb(X,Y))return'Fora do mapa';const i=idx(X,Y);
    if(G.occ[i])return'Local ocupado';const t=G.tiles[i];if(t===4)return'Rocha no caminho';
    if(t<=1){if(!d.water)return'Não dá para construir na água';water++}else{if(d.onlyWater)return'A ponte precisa ser sobre a água';land++;const o=G.obj[i];if(o&&o.t!=='bush'&&o.t!=='stump'&&o.t!=='branch'&&o.t!=='pebble')return`${OBJNAME[o.t]} no caminho`}}
  if(type==='dock'){if(water<2)return'O cais precisa de pelo menos 2 casas de água';if(!land){let adj=false;for(let dy=-1;dy<=d.h;dy++)for(let dx=-1;dx<=d.w;dx++){const X=x+dx,Y=y+dy;if(inb(X,Y)&&landT(G.tiles[idx(X,Y)]))adj=true}if(!adj)return'O cais precisa tocar a terra'}}
  if(!afford(d.cost))return'Faltam recursos';
  return true}
function placeB(type,x,y,done){const d=BD[type];if(DEV.instant)done=true;if(!done){pay(d.cost);sfx('place')}
  const b={id:G.idc++,type,x,y,w:d.w,h:d.h,done:!!done,prog:done?d.work:0,work:d.work,hp:done?d.hp:Math.round(d.hp*.3),max:d.hp,queue:[],mode:'stone',grow:Math.random()*.5,cd:0,smokeT:Math.random()*3,pop:.35};
  for(let dy=0;dy<d.h;dy++)for(let dx=0;dx<d.w;dx++){const i=idx(x+dx,y+dy);const o=G.obj[i];
    if(o){if(o.t==='branch')G.inv.stick++;else if(o.t==='pebble')G.inv.stone++;G.obj[i]=null}G.occ[i]=b.id}
  if(type==='farm')b.canteiros=novosCanteiros();
  G.bld.push(b);BMAP.set(b.id,b);
  if(!d.pass&&!(d.gate&&done))for(const u of G.units){const tx=Math.floor(u.x),ty=Math.floor(u.y);if(tx>=x&&ty>=y&&tx<x+d.w&&ty<y+d.h){const p=freeNear(x+(d.w>>1),y+d.h,4)||freeNear(x-1,y-1,4);if(p){u.x=p[0]+.5;u.y=p[1]+.5}u.path=null}}
  if(!done)for(let k=0;k<6;k++)puff(x+Math.random()*d.w,y+Math.random()*d.h,'dust');
  return b}
function completeB(b){const d=BD[b.type];b.done=true;b.hp=b.max;b.prog=b.work;b.pop=.3;sfx('place');
  if(!d.line&&!d.gate)toast(`✅ Pronto: ${d.n}`,'good');
  if(b.type==='shelter')completeHint('shelter');completeHint('build');
  if(d.grp)showHint('fence');
  if(d.jobs){for(let k=0;k<d.jobs;k++){if(idleVillagers().length>1)assignWorker(b,true)}}
  for(let k=0;k<8;k++)puff(b.x+Math.random()*b.w,b.y+Math.random()*b.h,'dust')}
function destroyB(b,msg){for(const u of G.units)if(u.work===b.id)unassign(u);
  for(let dy=0;dy<b.h;dy++)for(let dx=0;dx<b.w;dx++)G.occ[idx(b.x+dx,b.y+dy)]=0;
  G.bld.splice(G.bld.indexOf(b),1);BMAP.delete(b.id);
  for(let k=0;k<12;k++)puff(b.x+Math.random()*b.w,b.y+Math.random()*b.h,k%2?'debris':'smoke');
  if(sel&&sel.k==='b'&&sel.id===b.id){sel=null;closeSheet()}
  if(msg)toast(msg,'bad')}
function sack(){G.saqueT=G.t;const lost=[];for(const k in G.res){const v=Math.floor(G.res[k]*.3);G.res[k]-=v;if(v)lost.push(`[[recursos.${k}]]${v}`)}
  for(const u of G.units.slice())if(u.kind==='raider'&&u.camp==null){puff(u.x,u.y,'smoke');removeUnit(u)}
  G.raidOn=false;toast(`💰 Os invasores saquearam a Casa Comunal e fugiram com ${lost.join(' ')||'nada'}`,'bad')}
function idleVillagers(){return G.units.filter(u=>u.kind==='villager'&&!u.job)}
// trabalhos sem posto: o morador trabalha em volta do depósito mais perto (Lenhador, Minerador, Coletor)
const DEPOT_JOBS=['lumber','miner','collector'];
function depotNear(u){let best=null,bd=1e9;for(const s of G.bld)if(s.done&&BD[s.type].store){const d=Math.hypot(s.x+s.w/2-u.x,s.y+s.h/2-u.y);if(d<bd){bd=d;best=s}}return best}
function setJob(u,job){unassign(u);if(job){u.job=job;takeTool(u)}}
function workersOf(b){return G.units.filter(u=>u.work===b.id)}
function assignWorker(b,silent){const d=BD[b.type];if(!d.jobs||!b.done)return;if(workersOf(b).length>=d.jobs)return;
  const idle=idleVillagers();if(!idle.length){if(!silent)toast('Ainda não há moradores. Eles serão encontrados pelo mundo em breve.','bad');return}
  const cx=b.x+b.w/2,cy=b.y+b.h/2;idle.sort((a,c)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(c.x-cx,c.y-cy));
  const u=idle[0];if(u.tool){G.items[u.tool]++;u.tool=null}u.job=d.job;u.work=b.id;u.path=null;u.act=null;u.tgt=null;takeTool(u)}
function unassign(u){if(u.tool){G.items[u.tool]++;u.tool=null}u.job=null;u.work=null;u.path=null;u.act=null;u.carry=0;u.tgt=null}
function takeTool(u){const t=JOBTOOL[u.job||'builder'];if(!u.tool&&G.items[t]>0){G.items[t]--;u.tool=t}}
function toolF(u){if(u.kind==='player')return G.items.hammer>0?.62:1.25;const base=u.tool&&u.tool===JOBTOOL[u.job||'builder']?.62:1.25;return u.kind==='villager'?base/velocidadeMorador(u):base}
function wearTool(u){if(u.tool&&Math.random()<.008){toast(`💥 ${itemMark(u.tool)} ${ITEMS[u.tool].n} de ${u.name} quebrou`);u.tool=null;takeTool(u)}}

/* ================= Natural objects ================= */
function chopHit(i,ob){ob.hp=(ob.hp==null?5:ob.hp)-1;ob.shake=.35;const x=i%N+.5,y=(i/N|0)+.5;
  for(let k=0;k<3;k++)puff(x,y,'leaf');puff(x,y,'chip');
  if(ob.hp<=0){ob.t='falling';ob.ft=0;G.fall.push(i)}}
function updFalling(dt){for(let k=G.fall.length-1;k>=0;k--){const i=G.fall[k],o=G.obj[i];if(!o||o.t!=='falling'){G.fall.splice(k,1);continue}
  o.ft+=dt*1.3;if(o.ft>=1){G.fall.splice(k,1);const x=i%N,y=(i/N)|0;
    G.obj[i]={t:'log',amt:3,k:o.k,c:o.c,ox:o.ox,oy:o.oy,s:o.s};sfx('fall');
    for(let j=0;j<6;j++)puff(x+.5+Math.random()*1.2,y+.5,'dust');for(let j=0;j<5;j++)puff(x+1.2,y+.5,'leaf');
    let nb=0;for(const[dx,dy]of[[1,0],[1,1],[2,0],[1,-1],[0,1],[-1,0]]){if(nb>=2+(Math.random()<.5))break;const X=x+dx,Y=y+dy;if(!inb(X,Y))continue;const j=idx(X,Y);if(G.obj[j]||G.occ[j]||!landT(G.tiles[j]))continue;G.obj[j]=BRANCH(Math.random);nb++}
    completeHint('chop');if(!G.hints.log)showHint('log',true)}}}
function toStump(i,ob){G.obj[i]={t:'stump',timer:240+Math.random()*120,k:ob.k,c:ob.c,ox:ob.ox,oy:ob.oy,s:ob.s};G.regrow.push(i)}

