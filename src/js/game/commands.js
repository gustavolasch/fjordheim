/* ================= Comandos ================= */
// Toda ação que muda o mundo vira um comando {t:'tipo', ...} enviado por sendCmd().
// A tela não muda o mundo direto: lê o estado e manda comandos.
// Hoje só o jogador local envia. No multijogador (etapa 3+) o mesmo objeto vai pela rede
// e o anfitrião executa no personagem de quem enviou.
// Retorno: {ok:true,...} ou {ok:false,msg,kind}. msg vazio = sem aviso na tela.
const CMDS={};
function sendCmd(c,uid){
  // amigo (sem uid explícito): o comando vai ao anfitrião, que executa no personagem do amigo
  if(uid==null&&NET.role==='guest'){if(NET.conn&&NET.conn.open)NET.conn.send({t:'cmd',c});return{ok:true,pending:true}}
  const u=UMAP.get(uid==null?myPid():uid);if(!u)return{ok:false,msg:''};const h=CMDS[c.t];return h?h(u,c):{ok:false,msg:''}}
const cmdFail=(msg,kind)=>({ok:false,msg,kind:kind===undefined?'bad':kind});
// atalho usado pela tela para ordens de personagem (coletar, atacar, construir, etc.)
function order(o){return sendCmd({t:'order',o})}

CMDS.order=(u,c)=>{setOrder(u,c.o);return{ok:true}};
CMDS.walk=(u,c)=>{const p=astar(...utile(u),(x,y)=>x===c.x&&y===c.y,c.x,c.y,passV,9000)||astar(...utile(u),nearRect(c.x,c.y,1,1),c.x,c.y,passV,9000);
  if(!p)return cmdFail('Não dá para chegar lá','');setOrder(u,{type:'move'});u.path=p;return{ok:true}};

// construção: a simulação confere o terreno, cobra e cria a obra
CMDS.build=(u,c)=>{if(!BD[c.type])return cmdFail('','');const r=placeCheck(c.type,c.x,c.y);if(r!==true)return cmdFail(r);
  const b=placeB(c.type,c.x,c.y);setOrder(u,{type:'build',b:b.id,auto:true});return{ok:true,b}};
CMDS.line=(u,c)=>{if(!BD[c.type]||!c.a||!c.b)return cmdFail('','');let n=0,last='',first=null;
  for(const[x,y]of lineTiles(c.a,c.b)){const r=placeCheck(c.type,x,y);if(r===true){const b=placeB(c.type,x,y);first=first||b;n++}else last=r}
  if(!n)return cmdFail(last||'Nada pôde ser construído');setOrder(u,{type:'build',b:first.id,auto:true});return{ok:true}};

// enfeites (decoração)
CMDS.decor=(u,c)=>{const D=DECOR[c.kind];if(!D)return cmdFail('','');if(!afford(D.cost))return cmdFail('Faltam recursos');
  if(G.decor.length>=300)return cmdFail('Limite de 300 objetos','');
  pay(D.cost);const d={id:G.idc++,k:c.kind,x:c.x,y:c.y,s:1,f:c.f||1};G.decor.push(d);return{ok:true,d}};
CMDS.decorOp=(u,c)=>{const d=G.decor.find(x=>x.id===c.id);if(!d)return cmdFail('','');
  switch(c.op){
  case'flip':d.f*=-1;return{ok:true,d};
  case'big':d.s=Math.min(3,d.s*1.15);return{ok:true,d};
  case'small':d.s=Math.max(.35,d.s/1.15);return{ok:true,d};
  case'move':d.x=clamp(c.x,0,N);d.y=clamp(c.y,0,N);return{ok:true,d};
  case'dup':{const D=DECOR[d.k];if(!afford(D.cost))return cmdFail('Faltam recursos');pay(D.cost);
    const nd={...d,id:G.idc++,x:d.x+.6,y:d.y+.3};G.decor.push(nd);return{ok:true,d:nd}}
  case'del':refund(DECOR[d.k].cost,.5);G.decor.splice(G.decor.indexOf(d),1);return{ok:true}}
  return cmdFail('','')};

// criar e forjar
CMDS.craft=(u,c)=>{const it=ITEMS[c.item];if(!it)return cmdFail('','');if(!afford(it.cost))return cmdFail('Faltam recursos');
  if(it.hand){pay(it.cost);setOrder(u,{type:'craft',item:c.item,paid:it.cost});return{ok:true}}
  const sm=G.bld.find(x=>x.type==='smithy'&&x.done);if(!sm)return cmdFail('Construa uma Ferraria primeiro');
  pay(it.cost);setOrder(u,{type:'forge',b:sm.id,item:c.item,paid:it.cost});return{ok:true,toast:'Indo até a Ferraria…'}};

// guardar: vai até o depósito mais perto
CMDS.godeposit=(u)=>{let best=null,bd=1e9;for(const s of G.bld)if(s.done&&BD[s.type].store){const d=Math.hypot(s.x-u.x,s.y-u.y);if(d<bd){bd=d;best=s}}
  if(!best)return cmdFail('','');setOrder(u,{type:'deposit',b:best.id});return{ok:true}};
// desmontar depósito: o estoque fica (é global); só desmonta se o resto do estoque couber nos outros depósitos
CMDS.desmontarDep=(u,c)=>{const b=BMAP.get(c.b);if(!b||!b.done||!BD[b.type].store)return cmdFail('','');
  const left=storeCap()-BD[b.type].store;for(const k in G.res)if(G.res[k]>left)return cmdFail('Os outros depósitos não cabem tudo. Construa outro antes.');
  destroyB(b);refund(BD[b.type].cost,DESMONTAR_DEP);toast('Depósito desmontado. Tudo continua guardado.','good');return{ok:true}};
CMDS.equip=(u,c)=>{equipItem(c.item);return{ok:true}};
CMDS.unequip=(u,c)=>{unequip(c.slot);return{ok:true}};

// edifícios: modo da pedreira, reparo, sino, dormir, desmontar, saquear túmulo
CMDS.qmode=(u,c)=>{const b=BMAP.get(c.b);if(!b)return cmdFail('','');b.mode=c.v;return{ok:true}};
CMDS.repair=(u,c)=>{const b=BMAP.get(c.b);if(!b)return cmdFail('','');setOrder(u,{type:'repair',b:b.id});return{ok:true}};
CMDS.sleep=(u,c)=>{const b=BMAP.get(c.b);if(!b)return cmdFail('','');setOrder(u,{type:'sleep',b:b.id});return{ok:true}};
CMDS.ring=(u,c)=>{const b=BMAP.get(c.b);if(!b)return cmdFail('','');tocaSino(b);return{ok:true}};
CMDS.demolish=(u,c)=>{const b=BMAP.get(c.b);if(!b)return cmdFail('','');refund(BD[b.type].cost,b.done?.5:.8);destroyB(b);return{ok:true}};
CMDS.loot=(u,c)=>{const t=G.tombs.find(x=>x.id===c.id);if(!t)return cmdFail('','');lootTomb(t);return{ok:true}};
