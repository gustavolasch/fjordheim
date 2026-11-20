/* ================= Carrinho de mão ================= */
// Carrinho: fica em G.carts (não é construção: não ocupa tile e não bloqueia passagem).
// Parado = depósito portátil (guarda a mochila, descarrega no depósito).
// Conduzido ("Mover"): o personagem vira o condutor, o carrinho segue atrás dele na mesma velocidade.
// Quem simula é o anfitrião; o amigo recebe o estado.
function cartAt(wx,wy){for(const c of G.carts||[])if(Math.hypot(wx-c.x,wy-c.y)<.7)return c;return null}
function cartOf(u){return u&&u.ride!=null?G.carts.find(c=>c.id===u.ride)||null:null}
function cartW(c){let w=0;for(const k in c.inv)w+=c.inv[k]*WEIGHT[k];for(const k in c.items)w+=c.items[k]*(ITEMS[k]?.peso||0);return Math.round(w*10)/10}
function cartNear(u,c){return Math.hypot(u.x-c.x,u.y-c.y)<=1.6}
function cartPlace(x,y){const c={id:G.idc++,x:x+.5,y:y+.5,hp:CARRINHO.vida,max:CARRINHO.vida,inv:{},items:{},rider:null};G.carts.push(c);return c}
// tudo o que cabe (até a capacidade da mochila) vai para o carrinho; o resto fica na mochila
function cartStow(c){let sobra=false;
  for(const k in G.inv){const n=G.inv[k];if(n<=0)continue;const room=Math.max(0,Math.floor((BAG-cartW(c))/WEIGHT[k]+1e-6));const m=Math.min(n,room);if(m>0){G.inv[k]-=m;c.inv[k]=(c.inv[k]||0)+m}if(G.inv[k]>0)sobra=true}
  for(const k in G.items){const n=G.items[k];if(!n)continue;const w=ITEMS[k]?.peso||0;const room=w>0?Math.max(0,Math.floor((BAG-cartW(c))/w+1e-6)):n;const m=Math.min(n,room);if(m>0){G.items[k]-=m;c.items[k]=(c.items[k]||0)+m}if(G.items[k]>0)sobra=true}
  if(sobra)return{ok:true,msg:'Carrinho cheio. O resto ficou na mochila.',kind:'bad'};
  return{ok:true,msg:'🛒 Mochila guardada no carrinho',kind:'good'}}
// descarrega no depósito mais próximo do carrinho (precisa estar encostado no depósito)
function cartUnload(c){const b=G.bld.find(x=>x.done&&BD[x.type].store&&isNear(c,x));
  if(!b)return{ok:false,msg:'Leve o carrinho até um depósito',kind:'bad'};
  const cap=storeCap();let left=0;
  for(const k in c.inv){const m=Math.min(c.inv[k],Math.max(0,cap-G.res[k]));G.res[k]+=m;c.inv[k]-=m;left+=c.inv[k]}
  for(const k in c.items){G.items[k]=(G.items[k]||0)+c.items[k];c.items[k]=0}
  if(left>0)return{ok:true,msg:'Depósito cheio para alguns itens. Construa outro.',kind:'bad'};
  return{ok:true,msg:'📦 Carrinho descarregado no depósito',kind:'good'}}
function cartExec(c,op){return op==='stow'?cartStow(c):cartUnload(c)}
// movimento: o carrinho anda atrás do condutor, com a mesma velocidade; parado, fica onde está
function cartTick(dt){
  for(const c of G.carts.slice()){
    if(c.rider!=null){const r=UMAP.get(c.rider);
      if(!r||r.ride!==c.id){c.rider=null;continue}
      if(!r.moving||r.heading==null)continue;
      const tx=r.x-Math.cos(r.heading)*.75,ty=r.y-Math.sin(r.heading)*.75,dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy);
      const sp=r.speed*dt*survivalSpeed(r);if(d>.001){const s=Math.min(d,sp);c.x+=dx/d*s;c.y+=dy/d*s}
      continue}
    // parado e sem ninguém por perto: invasor rouba, animal quebra
    if(G.units.some(u=>u.kind==='player'&&Math.hypot(u.x-c.x,u.y-c.y)<5))continue;
    if(G.units.some(u=>u.kind==='raider'&&Math.hypot(u.x-c.x,u.y-c.y)<1.2)&&cartW(c)>0){c.inv={};c.items={};toast('🛒 Invasores roubaram o carrinho sem ninguém por perto','bad')}
    if(G.units.some(u=>u.kind==='animal'&&Math.hypot(u.x-c.x,u.y-c.y)<1.2)){c.hp-=dt*6;if(c.hp<=0){G.carts=G.carts.filter(x=>x!==c);puff(c.x,c.y,'debris');toast('🛒 O carrinho quebrou sem ninguém por perto','bad')}}
  }
}
// desenho (lido pelo render; mesmo formato de drawTomb)
function drawCart(c){const q=P(c.x,c.y);
  ell(q[0],q[1]+2,12,5,'rgba(0,0,0,.25)');
  ell(q[0]-7,q[1]+2,3.6,3.6,'#3b2a1a');ell(q[0]+7,q[1]+2,3.6,3.6,'#3b2a1a');
  ln([q[0]+11,q[1]-4],[q[0]+21,q[1]-12],'#6b4a26',2.2);
  pp([[q[0]-11,q[1]-6],[q[0]+11,q[1]-6],[q[0]+11,q[1]+1],[q[0]-11,q[1]+1]],'#9a6a3a');
  ln([q[0]-11,q[1]-2.5],[q[0]+11,q[1]-2.5],'rgba(0,0,0,.25)',1);
  if(Object.values(c.inv||{}).some(v=>v>0)||Object.values(c.items||{}).some(v=>v>0))ell(q[0],q[1]-9,6,3,'#c9a25a');
  if(c.hp<c.max*.5)ln([q[0]-3,q[1]-6],[q[0]+1,q[1]-2],'#3b2a1a',1);
}
