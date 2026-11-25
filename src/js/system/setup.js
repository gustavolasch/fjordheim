/* ================= Game setup ================= */
const playerLook=()=>({name:'Você',tunic:'#2f5fa8',hair:'#d9a84e',skin:'#f1c9a0',fem:false,hp:100,max:100,speed:2,ox:0,oy:0});
function newGame(biome,seed,demo){if(NET.role==='host')netLeave(true);BIO=BIOMES[biome];
  G={biome,seed:seed||((Math.random()*1e9)|0),tiles:new Uint8Array(N*N),wear:new Float32Array(N*N),h:new Float32Array(N*N),obj:new Array(N*N).fill(null),occ:new Int32Array(N*N),bld:[],units:[],decor:[],tombs:[],carts:[],
    res:zerosRes(),inv:zerosRes(),items:zerosItems(),equip:emptyEquip(),animT:0,era:1,ferr:{},receitas:[],sagas:{},perdas:0,invasoesRepelidas:0,
    t:185,speed:1,idc:1,nextRaid:1e12,raidN:0,raidOn:false,regrow:[],fall:[],hints:{},flags:{},demo:!!demo};
  BMAP=new Map();UMAP=new Map();PT=[];AR=[];genMap();G.lugares=sorteiaLugares();
  const p=spawnUnit('player',G.start[0]+.5,G.start[1]+.5,playerLook());G.pid=p.id;G.rs=(G.seed|0)^0x9e3779b9;spawnAnimais();G.lugares.filter(p=>p.k==='acampamento'||p.k==='templo').forEach(spawnCampo);
  colocaPedra();
  initTiles();bgGrad=null;initWeather();makeThumbs();cam.z=isTouch?1.2:1.3;centerCam()}
function openMenu(inGame){menuOpen=true;$('#menu').classList.remove('hidden');$('#hud').classList.add('hidden');
  const guest=NET.role==='guest';let h='';
  if(guest)h='<div class="netinfo">👥 Ilha do amigo · sala '+NET.code+'</div><button class="gbtn" id="mResume">▶ Voltar ao jogo</button><button class="sbtn red" id="mNetLeave">Sair da ilha</button>';
  else{
    if(inGame)h+='<button class="gbtn" id="mResume">▶ Voltar ao jogo</button><button class="sbtn" id="mSave">💾 Salvar</button>';
    if(NET.role==='host')h+='<div class="netinfo">👥 Sala <b>'+NET.code+'</b> · '+netStatus()+'</div><button class="sbtn red" id="mNetEnd">Encerrar sala</button>';
    else h+='<button class="gbtn" id="mHost">👥 Jogar com amigo</button><button class="sbtn" id="mJoin">🔗 Entrar com código</button>';
    if(hasSave())h+='<button class="'+(inGame?'sbtn':'gbtn')+'" id="mLoad">📂 '+(inGame?'Carregar salvo':'Continuar jogo salvo')+'</button>';
  }
  h+='<button class="sbtn" id="mGuia">📖 Guia do Campo</button>';
  if(!guest)h+='<button class="sbtn" id="mTransfer">🧳 Levar mundo</button>';
  $('#mTop').innerHTML=h;
  $('#newSec').style.display=guest?'none':'';
  const on=(id,f)=>{const el=$('#'+id);if(el)el.onclick=f};
  if(!guest)ligaTransfer(inGame);else $('#transfer').classList.add('hidden');
  ligaGuia();
  on('mResume',closeMenu);on('mSave',()=>{save();openMenu(true)});on('mLoad',()=>{if(load())closeMenu()});
  on('mNetLeave',netGuestQuit);on('mNetEnd',()=>{netLeave(false);openMenu(inGame)});
  on('mHost',()=>{if(inGame){if(netHost()){toast('Sala '+NET.code+': diga o código ao seu amigo','good');openMenu(true)}}else{NET.pendingHost=true;toast('Escolha o cenário. A sala abre com ele.','')}});
  on('mJoin',()=>$('#joinBox').classList.toggle('hidden'));
  $('#biomes').innerHTML=Object.keys(BIOMES).map(k=>`<button class="bcard" data-b="${k}" style="background:${BIOMES[k].card}"><b>${BIOMES[k].name}</b><span>${BIOMES[k].desc}</span></button>`).join('');
  document.querySelectorAll('.bcard').forEach(el=>el.onclick=()=>{newGame(el.dataset.b);if(NET.pendingHost){NET.pendingHost=false;netHost()}closeMenu()});
  const opt=[...([['sound','Sons','Vento, pássaros e ações'],['raids','Invasões','Só depois de ter Casa Comunal e moradores'],['daynight','Dia e noite','Ciclo de luz com fogueiras acesas'],['tilt','Efeito miniatura','Desfoque tilt-shift nas bordas (pesa em celulares)'],['calm','Modo tranquilo','Fome e frio mais lentos e sem perda de itens na morte'],['dev','Modo desenvolvedor','Recursos infinitos, construção instantânea, invencível e itens']])].filter(o=>o[0]!=='dev'||typeof devApply==='function');
  $('#opts').innerHTML=opt.map(([k,n,s])=>`<div class="tg"><div>${n}<small>${s}</small></div><button class="sw ${settings[k]?'on':''}" data-o="${k}"></button></div>`).join('');
  document.querySelectorAll('.sw').forEach(el=>el.onclick=()=>{const k=el.dataset.o;settings[k]=!settings[k];el.classList.toggle('on',settings[k]);saveSettings();applySettings()})}
function closeMenu(){menuOpen=false;$('#menu').classList.add('hidden');$('#hud').classList.remove('hidden');hudSig='';updHUD();mode={t:'none'};sel=null;closeSheet();$('#place').classList.remove('open');audioInit()}
function applySettings(){document.body.classList.toggle('tilt-on',!!settings.tilt);if(typeof devApply==='function')devApply()}

