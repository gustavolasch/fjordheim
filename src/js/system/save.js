/* ================= Save / load ================= */
function save(silent){if(!G||G.demo)return;try{const s=JSON.stringify({v:4,biome:G.biome,seed:G.seed,tiles:Array.from(G.tiles),wear:Array.from(G.wear,v=>Math.round(v*10)/10),h:Array.from(G.h,v=>Math.round(v)),obj:G.obj,bld:G.bld.map(b=>({...b,pop:0})),units:G.units.map(u=>({...u,path:null,act:null,order:null,flee:false})),decor:G.decor,tombs:G.tombs,res:G.res,inv:G.inv,items:G.items,t:G.t,speed:G.speed,idc:G.idc,nextRaid:isFinite(G.nextRaid)?G.nextRaid:1e12,raidN:G.raidN,raidOn:G.raidOn,regrow:G.regrow,fall:G.fall,hints:G.hints,flags:G.flags,pid:G.pid,start:G.start,cam,equip:G.equip,rs:G.rs,animT:G.animT});
  localStorage.setItem(SAVE_KEY,s);if(!silent)toast('💾 Jogo salvo neste navegador','good')}catch(e){if(!silent)toast('Não foi possível salvar neste navegador','bad')}}
function hasSave(){try{return!!localStorage.getItem(SAVE_KEY)}catch(e){return false}}
function load(){let s;try{s=JSON.parse(localStorage.getItem(SAVE_KEY))}catch(e){s=null}if(!s){toast('Nenhum jogo salvo encontrado','bad');return false}
  BIO=BIOMES[s.biome];G={biome:s.biome,seed:s.seed,tiles:Uint8Array.from(s.tiles),wear:Float32Array.from(s.wear),h:Float32Array.from(s.h),obj:s.obj,occ:new Int32Array(N*N),bld:s.bld,units:s.units,decor:s.decor||[],tombs:s.tombs||[],res:s.res,inv:s.inv,items:s.items,t:s.t,speed:s.speed||1,idc:s.idc,nextRaid:s.nextRaid,raidN:s.raidN||0,raidOn:s.raidOn,regrow:s.regrow||[],fall:s.fall||[],hints:s.hints||{},flags:s.flags||{},pid:s.pid,start:s.start,demo:false,equip:s.equip||emptyEquip(),rs:s.rs??((s.seed|0)^0x9e3779b9),animT:s.animT||0};
  BMAP=new Map();UMAP=new Map();for(const b of G.bld){BMAP.set(b.id,b);for(let dy=0;dy<b.h;dy++)for(let dx=0;dx<b.w;dx++)G.occ[idx(b.x+dx,b.y+dy)]=b.id}
  for(const u of G.units)UMAP.set(u.id,u);if(!G.units.some(u=>u.kind==='raider'))G.raidOn=false;
  if(!PL()){const p=spawnUnit('player',G.start[0]+.5,G.start[1]+.5,playerLook());G.pid=p.id}
  if((s.v||3)<4)migraV4(); // save antigo: completa os recursos e itens novos e povoa a região com animais
  PT=[];AR=[];initTiles();bgGrad=null;initWeather();makeThumbs();if(s.cam)cam=s.cam;else centerCam();return true}

