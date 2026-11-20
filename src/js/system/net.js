/* ================= Multijogador (PeerJS) ================= */
// Anfitrião: roda a simulação e manda o estado ao amigo (snapshot) NET_HZ vezes por segundo.
// Amigo: não simula. Manda comandos (sendCmd) e desenha o estado recebido.
// Sem servidor próprio: o PeerJS usa o servidor público só para o aperto de mão; o jogo passa direto entre os aparelhos.
// Um amigo por vez. O save fica só no aparelho do anfitrião.
const NET={role:null,peer:null,conn:null,code:null,pid:null,guestUid:null,timer:null,joined:false,pendingHost:false,tick:0};
const NET_V=1,NET_HZ=5,NET_WORLD_EVERY=10,NET_DT=1/5,NET_PREFIX='fjordheim-',NET_CHARS='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const netErr=e=>({'peer-unavailable':'Sala não encontrada. Confira o código.','network':'Sem conexão com o servidor de salas.','browser-incompatible':'Este navegador não suporta conexão entre aparelhos.'})[e&&e.type]||('Não foi possível conectar'+(e&&e.type?' ('+e.type+')':'')+'.');
function netCode(){let s='';for(let i=0;i<5;i++)s+=NET_CHARS[(Math.random()*NET_CHARS.length)|0];return s}
// estado rápido: tudo que muda com frequência (sem terreno, sem obj e sem wear, que vão no canal 'world')
function netFast(){return{units:G.units.map(u=>({...u,path:null,act:null,order:null,flee:false})),bld:G.bld.map(b=>({...b,pop:0})),decor:G.decor,tombs:G.tombs,carts:G.carts,res:G.res,inv:G.inv,items:G.items,equip:G.equip,t:G.t,speed:G.speed,idc:G.idc,nextRaid:isFinite(G.nextRaid)?G.nextRaid:1e12,raidN:G.raidN,raidOn:G.raidOn,regrow:G.regrow,fall:G.fall,hints:G.hints,flags:G.flags,pid:G.pid,start:G.start,rs:G.rs,animT:G.animT}}
function netWorld(){return{obj:G.obj,wear:Array.from(G.wear,v=>Math.round(v*10)/10)}}
function netStatus(){return NET.conn&&NET.conn.open?'amigo conectado':'aguardando amigo'}
function rebuildIndex(){BMAP=new Map();UMAP=new Map();if(G.occ&&G.occ.length===N*N)G.occ.fill(0);else G.occ=new Int32Array(N*N);
  for(const b of G.bld){BMAP.set(b.id,b);for(let dy=0;dy<b.h;dy++)for(let dx=0;dx<b.w;dx++)G.occ[idx(b.x+dx,b.y+dy)]=b.id}
  for(const u of G.units)UMAP.set(u.id,u)}

/* ---- anfitrião ---- */
function netHost(){
  if(!G||G.demo){toast('Comece um jogo antes de chamar um amigo','bad');return false}
  if(typeof Peer==='undefined'){toast('Multijogador indisponível neste navegador','bad');return false}
  netLeave(true);
  const code=netCode(),peer=new Peer(NET_PREFIX+code);
  Object.assign(NET,{role:'host',peer,code,conn:null,guestUid:null,joined:false});
  peer.on('connection',conn=>{if(NET.conn&&NET.conn.open){conn.close();return}netAttachHost(conn)});
  peer.on('error',e=>{toast(netErr(e),'bad');if(e.type!=='peer-unavailable')netLeave(true)});
  NET.timer=setInterval(netSend,1000/NET_HZ);
  return true}
function netSend(){const c=NET.conn;if(!(NET.role==='host'&&c&&c.open))return;
  c.send({t:'snap',state:netFast()});
  if(++NET.tick%NET_WORLD_EVERY===0)c.send({t:'world',state:netWorld()})}
function netSpawnFriend(){const me=PL();const x=me?Math.floor(me.x)+1:G.start[0],y=me?Math.floor(me.y):G.start[1];
  const q=freeNear(x,y,3)||[x,y];return spawnUnit('player',q[0]+.5,q[1]+.5,{...playerLook(),name:'Amigo',tunic:'#8a3b2f',guest:true})}
function netAttachHost(conn){
  NET.conn=conn;
  const go=()=>{const f=netSpawnFriend();NET.guestUid=f.id;
    conn.send({t:'hello',v:NET_V,pid:f.id,state:snapState()});
    toast('👥 Seu amigo entrou na ilha','good')};
  conn.on('data',netHostData);
  conn.on('close',()=>{if(NET.conn===conn){netDropFriend();toast('👥 Seu amigo saiu da ilha','bad')}});
  conn.on('error',()=>{});
  if(conn.open)go();else conn.on('open',go)}
function netDropFriend(){const u=NET.guestUid!=null?UMAP.get(NET.guestUid):null;if(u)removeUnit(u);NET.guestUid=null;NET.conn=null}
// comandos do amigo entram pela mesma porta dos comandos locais; falhas voltam como aviso
function netHostData(d){if(!d||d.t!=='cmd'||!d.c||typeof d.c.t!=='string'||NET.guestUid==null)return;
  const r=sendCmd(d.c,NET.guestUid);if(!r.ok&&r.msg&&NET.conn)NET.conn.send({t:'msg',msg:r.msg,kind:r.kind||''})}

/* ---- amigo ---- */
function netJoin(raw){
  const code=(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(code.length!==5){toast('O código tem 5 letras e números','bad');return false}
  if(typeof Peer==='undefined'){toast('Multijogador indisponível neste navegador','bad');return false}
  netLeave(true);
  const peer=new Peer();
  Object.assign(NET,{role:'guest',peer,code,conn:null,pid:null,joined:false});
  peer.on('error',e=>{const was=NET.joined;toast(netErr(e),'bad');netLeave(true);if(was)netBackToWorld()});
  peer.on('open',()=>{const conn=peer.connect(NET_PREFIX+code,{reliable:true});NET.conn=conn;
    conn.on('data',netGuestData);
    conn.on('close',()=>{if(NET.conn===conn)netGone('A sala foi encerrada pelo anfitrião.')});
    conn.on('error',()=>{})});
  toast('Conectando à sala '+code+'…');return true}
function netGuestData(d){if(!d)return;
  if(d.t==='hello'){if(d.v!==NET_V){toast('Versão do jogo diferente. Atualize a página.','bad');netLeave(true);return}
    NET.pid=d.pid;NET.joined=true;applyState(d.state);centerCam();closeMenu();toast('👥 Você entrou na ilha','good')}
  else if(d.t==='snap'&&NET.joined)netApplyFast(d.state);
  else if(d.t==='world'&&NET.joined){G.obj=d.state.obj;G.wear=Float32Array.from(d.state.wear)}
  else if(d.t==='msg')toast(d.msg,d.kind)}
// aplica o estado rápido reaproveitando os objetos: cada personagem desliza do ponto anterior ao novo
function netApplyFast(s){
  const old=new Map(G.units.map(u=>[u.id,u]));
  G.units=s.units.map(d=>{let u=old.get(d.id);
    if(u){u._fx=u.x;u._fy=u.y;Object.assign(u,d)}else{u=d;u._fx=d.x;u._fy=d.y}
    u._gx=d.x;u._gy=d.y;u._t0=perfT;return u});
  G.bld=s.bld;G.decor=s.decor;G.tombs=s.tombs;G.carts=s.carts||[];G.res=s.res;G.inv=s.inv;G.items=s.items;G.equip=s.equip;
  G.t=s.t;G.speed=s.speed;G.raidOn=s.raidOn;G.nextRaid=s.nextRaid;G.raidN=s.raidN;G.regrow=s.regrow;G.fall=s.fall;
  G.hints=s.hints;G.flags=s.flags;G.idc=s.idc;G.animT=s.animT;G.pid=s.pid;G.start=s.start;G.rs=s.rs;
  rebuildIndex()}
// chamado a cada quadro no amigo: posição entre o último snapshot e o novo
function netInterp(){for(const u of G.units){if(u._t0==null)continue;const k=Math.min(1,Math.max(0,(perfT-u._t0)/NET_DT));u.x=u._fx+(u._gx-u._fx)*k;u.y=u._fy+(u._gy-u._fy)*k}}
// anfitrião saiu: o amigo volta a uma ilha nova (local, sem save)
function netGone(msg){const was=NET.joined;netLeave(true);toast(msg,'bad');if(was)netBackToWorld()}
function netBackToWorld(){newGame(pick(Object.keys(BIOMES)),null,true);openMenu(false)}

/* ---- comum ---- */
function netLeave(quiet){const was=NET.role,c=NET.conn,p=NET.peer;
  clearInterval(NET.timer);NET.conn=null;
  if(was==='host')netDropFriend();
  try{c&&c.close()}catch(e){}
  try{p&&p.destroy()}catch(e){}
  Object.assign(NET,{role:null,peer:null,conn:null,code:null,pid:null,guestUid:null,timer:null,joined:false});
  if(was&&!quiet)toast('Sala encerrada','');
}
// no menu de jogo, o amigo pode sair da ilha do anfitrião
function netGuestQuit(){netLeave(true);netBackToWorld();toast('Você saiu da ilha','')}

$('#joinGo').onclick=()=>{if(netJoin($('#joinCode').value))$('#joinBox').classList.add('hidden')};
