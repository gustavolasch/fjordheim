/* ================= Game setup ================= */
const playerLook=()=>({name:'Você',tunic:'#2f5fa8',hair:'#d9a84e',skin:'#f1c9a0',fem:false,hp:100,max:100,speed:2,ox:0,oy:0});
function newGame(biome,seed,demo){BIO=BIOMES[biome];
  G={biome,seed:seed||((Math.random()*1e9)|0),tiles:new Uint8Array(N*N),wear:new Float32Array(N*N),h:new Float32Array(N*N),obj:new Array(N*N).fill(null),occ:new Int32Array(N*N),bld:[],units:[],decor:[],tombs:[],
    res:{stick:0,wood:0,stone:0,food:0,iron:0},inv:{stick:0,wood:0,stone:0,food:0,iron:0},items:{axe:0,pick:0,hammer:0,rod:0,sickle:0,sword:0,shield:0,spear:0,bow:0},
    t:185,speed:1,idc:1,nextRaid:1e12,raidN:0,raidOn:false,regrow:[],fall:[],hints:{},flags:{},demo:!!demo};
  BMAP=new Map();UMAP=new Map();PT=[];AR=[];genMap();
  const p=spawnUnit('player',G.start[0]+.5,G.start[1]+.5,playerLook());G.pid=p.id;
  initTiles();bgGrad=null;initWeather();makeThumbs();cam.z=isTouch?1.2:1.3;centerCam()}
function openMenu(inGame){menuOpen=true;$('#menu').classList.remove('hidden');$('#hud').classList.add('hidden');
  const top=$('#mTop');top.innerHTML=(inGame?'<button class="gbtn" id="mResume">▶ Voltar ao jogo</button><button class="sbtn" id="mSave">💾 Salvar</button>':'')+(hasSave()?'<button class="'+(inGame?'sbtn':'gbtn')+'" id="mLoad">📂 '+(inGame?'Carregar salvo':'Continuar jogo salvo')+'</button>':'');
  if(inGame){$('#mResume').onclick=closeMenu;$('#mSave').onclick=()=>{save();openMenu(true)}}
  const ml=$('#mLoad');if(ml)ml.onclick=()=>{if(load())closeMenu()};
  $('#biomes').innerHTML=Object.keys(BIOMES).map(k=>`<button class="bcard" data-b="${k}" style="background:${BIOMES[k].card}"><b>${BIOMES[k].name}</b><span>${BIOMES[k].desc}</span></button>`).join('');
  document.querySelectorAll('.bcard').forEach(el=>el.onclick=()=>{newGame(el.dataset.b);closeMenu()});
  const opt=[...([['sound','Sons','Vento, pássaros e ações'],['raids','Invasões','Só depois de ter Casa Comunal e moradores'],['daynight','Dia e noite','Ciclo de luz com fogueiras acesas'],['tilt','Efeito miniatura','Desfoque tilt-shift nas bordas (pesa em celulares)'],['calm','Modo tranquilo','Fome e frio mais lentos e sem perda de itens na morte'],['dev','Modo desenvolvedor','Recursos infinitos, construção instantânea, invencível e itens']])].filter(o=>o[0]!=='dev'||typeof devApply==='function');
  $('#opts').innerHTML=opt.map(([k,n,s])=>`<div class="tg"><div>${n}<small>${s}</small></div><button class="sw ${settings[k]?'on':''}" data-o="${k}"></button></div>`).join('');
  document.querySelectorAll('.sw').forEach(el=>el.onclick=()=>{const k=el.dataset.o;settings[k]=!settings[k];el.classList.toggle('on',settings[k]);saveSettings();applySettings()})}
function closeMenu(){menuOpen=false;$('#menu').classList.add('hidden');$('#hud').classList.remove('hidden');hudSig='';updHUD();mode={t:'none'};sel=null;closeSheet();$('#place').classList.remove('open');audioInit()}
function applySettings(){document.body.classList.toggle('tilt-on',!!settings.tilt);if(typeof devApply==='function')devApply()}

