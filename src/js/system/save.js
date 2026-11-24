/* ================= Save / load / snapshot ================= */
// snapState() é o estado do mundo como objeto simples. Serve ao save (neste aparelho)
// e ao multijogador (o anfitrião manda ao amigo). Não leva a câmera nem nada que seja só deste aparelho.
// applyState() é o caminho inverso: reconstrói G a partir dele.
function snapState(){return{v:11,bandeira:G.bandeira,capimVolta:G.capimVolta,era:G.era,ferr:G.ferr,dia:G.dia,campoDia:G.campoDia,estAcc:G.estAcc,lugares:G.lugares,receitas:G.receitas,sagas:G.sagas,perdas:G.perdas,invasoesRepelidas:G.invasoesRepelidas,evT:G.evT,saqueT:G.saqueT,carts:G.carts.map(c=>({...c,rider:null})),biome:G.biome,seed:G.seed,tiles:Array.from(G.tiles),wear:Array.from(G.wear,v=>Math.round(v*10)/10),h:Array.from(G.h,v=>Math.round(v)),obj:G.obj,bld:G.bld.map(b=>({...b,pop:0})),units:G.units.map(u=>({...u,path:null,act:null,order:null,flee:false,ride:null})),decor:G.decor,tombs:G.tombs,res:G.res,inv:G.inv,items:G.items,t:G.t,speed:G.speed,idc:G.idc,nextRaid:isFinite(G.nextRaid)?G.nextRaid:1e12,raidN:G.raidN,raidOn:G.raidOn,regrow:G.regrow,fall:G.fall,hints:G.hints,flags:G.flags,pid:G.pid,start:G.start,equip:G.equip,rs:G.rs,animT:G.animT}}
function applyState(s){
  BIO=BIOMES[s.biome];G={biome:s.biome,seed:s.seed,tiles:Uint8Array.from(s.tiles),wear:Float32Array.from(s.wear),h:Float32Array.from(s.h),obj:s.obj,occ:new Int32Array(N*N),bld:s.bld,units:s.units,decor:s.decor||[],tombs:s.tombs||[],carts:s.carts||[],res:s.res,inv:s.inv,items:s.items,t:s.t,speed:s.speed||1,idc:s.idc,nextRaid:s.nextRaid,raidN:s.raidN||0,raidOn:s.raidOn,regrow:s.regrow||[],fall:s.fall||[],hints:s.hints||{},flags:s.flags||{},pid:s.pid,start:s.start,demo:false,equip:s.equip||emptyEquip(),rs:s.rs??((s.seed|0)^0x9e3779b9),animT:s.animT||0,bandeira:s.bandeira||null,era:s.era||1,ferr:s.ferr||{},lugares:s.lugares||null,receitas:s.receitas||[],sagas:s.sagas||{},perdas:s.perdas||0,invasoesRepelidas:s.invasoesRepelidas||0,evT:s.evT,saqueT:s.saqueT};
  BMAP=new Map();UMAP=new Map();for(const b of G.bld){BMAP.set(b.id,b);for(let dy=0;dy<b.h;dy++)for(let dx=0;dx<b.w;dx++)G.occ[idx(b.x+dx,b.y+dy)]=b.id}
  for(const u of G.units)UMAP.set(u.id,u);if(!G.units.some(u=>u.kind==='raider'))G.raidOn=false;
  if(!PL()){const p=spawnUnit('player',G.start[0]+.5,G.start[1]+.5,playerLook());G.pid=p.id}
  if((s.v||3)<4)migraV4(); // save antigo: completa os recursos e itens novos e povoa a região com animais
  G.dia=s.dia??null;G.campoDia=s.campoDia??null;G.estAcc=s.estAcc||{};
  if((s.v||3)<6)migraV6(); // save antigo: moradores ganham moral, traços, camas e habilidades
  if((s.v||3)<11)migraV11(); // save antigo: ganha o templo
  if((s.v||3)<9)migraV9(); // save antigo: eras, ferramentas com durabilidade e pedra rúnica
  if((s.v||3)<8)migraV8(); // save antigo: mundo vivo (névoa, lugares, receitas, sagas)
  if((s.v||3)<7)migraV7(); // save antigo: lavoura ganha canteiros e itens novos
  PT=[];AR=[];initTiles();for(const e of G.capimVolta||[])TUFT[e.i]=null;bgGrad=null;initWeather();makeThumbs()}
function save(silent){if(!G||G.demo||NET.role==='guest')return;try{const s=snapState();s.cam=cam;localStorage.setItem(SAVE_KEY,JSON.stringify(s));if(!silent)toast('💾 Jogo salvo neste navegador','good')}catch(e){if(!silent)toast('Não foi possível salvar neste navegador','bad')}}
function hasSave(){try{return!!localStorage.getItem(SAVE_KEY)}catch(e){return false}}
function load(){if(NET.role==='guest')return false;if(NET.role==='host')netLeave(true);let s;try{s=JSON.parse(localStorage.getItem(SAVE_KEY))}catch(e){s=null}if(!s){toast('Nenhum jogo salvo encontrado','bad');return false}
  applyState(s);if(s.cam)cam=s.cam;else centerCam();return true}
