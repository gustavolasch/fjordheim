/* ================= State ================= */
let G=null,BIO=BIOMES.autumn,BMAP=new Map(),UMAP=new Map();
let cam={x:0,y:0,z:1},camGo=null,zT=null;
let mode={t:'none'},sel=null,sheetKind=null,sheetSig='',paused=false,menuOpen=true,lastCat='struct',expanded=false;
let PT=[],AR=[],SP=[],TC=[],TUFT=[];
const DEV={inf:false,instant:false,god:false}; // flags do modo dev (só ligadas no build --dev)
let settings={raids:true,daynight:true,tilt:!isTouch,sound:true,dev:false,calm:false};
try{const s=JSON.parse(localStorage.getItem(SET_KEY)||'null');if(s)Object.assign(settings,s)}catch(e){}
function saveSettings(){try{localStorage.setItem(SET_KEY,JSON.stringify(settings))}catch(e){}}
let rng=Math.random;

/* ================= Map generation ================= */
function idx(x,y){return y*N+x}
function inb(x,y){return x>=0&&y>=0&&x<N&&y<N}
function landT(t){return t===2||t===3}
function treeKind(r){let a=r();for(const[k,p]of BIO.tree){if(a<p)return k;a-=p}return BIO.tree[0][0]}
function newTree(r,g){return{t:'tree',k:treeKind(r),c:(r()*6)|0,ox:(r()-.5)*.35,oy:(r()-.5)*.35,s:.85+r()*.35,hp:5,g:g==null?1:g}}
const ROCK=(r,t)=>({t,amt:t==='ore'?4:6,s:.8+r()*.35,sd:r()*9});
const PEBBLE=r=>({t:'pebble',s:.8+r()*.4,sd:r()*9});
const BRANCH=r=>({t:'branch',s:.85+r()*.3,sd:r()*9});
function genMap(){
  const r=mulberry32(G.seed);rng=r;
  const n1=makeNoise(G.seed+1),n2=makeNoise(G.seed+7),n3=makeNoise(G.seed+13);
  const T=G.tiles;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const e=n1(x/11,y/11),f=n2(x/7,y/7),k=n3(x/5,y/5);let t=3;
    if(G.biome==='autumn'){const v=e*.7+(x/N)*.55+(y>N*.8?-.08:0);if(v<.53)t=0;else if(k>.75)t=4}
    else if(G.biome==='forest'){const cx=N*.36+(n1(y/9,3.3)-.5)*16*SC;if(Math.abs(x-cx)<1.8)t=1;else if(k>.74)t=4}
    else if(G.biome==='coast'){if(y+(e-.5)*16*SC<8*SC)t=0;else if(x>N-7*SC+(f-.5)*8*SC)t=4;else if(k>.77)t=4}
    else{if((N-x)+(e-.5)*14*SC<11*SC)t=0;else if(y<6*SC+(f-.5)*8*SC)t=4;else if(k>.79)t=4}
    T[idx(x,y)]=t;G.h[idx(x,y)]=12+hash2(x,y)*16+(t===4?k*10:0);
  }
  const T2=T.slice();
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=idx(x,y),t=T[i];let nl=false,nw=false;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const X=x+dx,Y=y+dy;if(!inb(X,Y))continue;const q=T[idx(X,Y)];if(q>=2)nl=true;if(q<=1)nw=true}
    if(t===0&&nl)T2[i]=1;if(t>=3&&nw&&G.biome!=='forest'&&t!==4)T2[i]=2}
  G.tiles.set(T2);
  // natural objects — densities lowered so the 2x island feels open, not twice as crowded
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=idx(x,y),t=G.tiles[i];if(!landT(t))continue;
    const fr=n2(x/6+50,y/6+50);let nearRock=false,nearW=false;
    for(let d=0;d<4;d++){const X=x+[1,-1,0,0][d],Y=y+[0,0,1,-1][d];if(inb(X,Y)){const q=G.tiles[idx(X,Y)];if(q===4)nearRock=true;if(q<=1)nearW=true}}
    if(t===3&&fr>.55&&r()<.45)G.obj[i]=newTree(r);
    else if(nearRock&&r()<.07)G.obj[i]=ROCK(r,'ore');
    else if(r()<.006||(G.biome==='forest'&&nearW&&r()<.1))G.obj[i]=ROCK(r,'stone');
    else if(r()<.006)G.obj[i]=ROCK(r,'ore');
    else if(t===3&&r()<.012)G.obj[i]={t:'bush',s:.8+r()*.4,c:r(),b:3};
    else if(r()<.011)G.obj[i]=PEBBLE(r)}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=idx(x,y);if(G.obj[i]||!landT(G.tiles[i]))continue;let nt=false;
    for(let dy=-1;dy<=1&&!nt;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(inb(X,Y)&&G.obj[idx(X,Y)]&&G.obj[idx(X,Y)].t==='tree'){nt=true;break}}
    if(nt&&r()<.1)G.obj[i]=BRANCH(r)}
  // start site: an open clearing near the middle of the island
  let best=null,bs=1e9;
  for(let y=8;y<N-10;y++)for(let x=8;x<N-10;x++){let ok=true;
    for(let dy=-3;dy<6&&ok;dy++)for(let dx=-3;dx<6;dx++){if(!landT(G.tiles[idx(x+dx,y+dy)])){ok=false;break}}
    if(!ok)continue;const d=Math.hypot(x-N/2+1,y-N/2+1);if(d<bs){bs=d;best=[x,y]}}
  if(!best)best=[N/2-1,N/2-1];
  const[sx,sy]=best;G.start=[sx+1,sy+1];
  for(let y=sy-5;y<sy+8;y++)for(let x=sx-5;x<sx+8;x++){if(inb(x,y)&&Math.hypot(x-sx-1,y-sy-1)<4.2)G.obj[idx(x,y)]=null}
  const ring=(mk,n,r0,r1)=>{let c=0;for(let k=0;k<500&&c<n;k++){const a=r()*6.283,d=r0+r()*(r1-r0),x=Math.round(sx+1+Math.cos(a)*d),y=Math.round(sy+1+Math.sin(a)*d);
    if(!inb(x,y))continue;const i=idx(x,y);if(!landT(G.tiles[i])||G.obj[i])continue;G.obj[i]=mk();c++}};
  ring(()=>BRANCH(r),6,1.5,5);ring(()=>PEBBLE(r),6,2,6);ring(()=>newTree(r),5,5,9);ring(()=>({t:'bush',s:.9,c:r(),b:3}),2,3,7);ring(()=>ROCK(r,'stone'),2,6,10);ring(()=>ROCK(r,'ore'),1,8,12);
}
function freeNear(cx,cy,R){for(let r=0;r<=R;r++)for(let k=0;k<20;k++){const x=cx+Math.round((Math.random()*2-1)*r),y=cy+Math.round((Math.random()*2-1)*r);if(passV(x,y))return[x,y]}return null}

/* ================= Tile colors ================= */
function initTiles(){
  const gn=makeNoise(G.seed+21);TC=new Array(N*N);TUFT=new Array(N*N);
  for(let i=0;i<N*N;i++){const x=i%N,y=(i/N)|0,v=hash2(x,y),t=G.tiles[i];
    TUFT[i]=t===3&&v>.45?[(hash2(x+7,y)-.5)*.6,(hash2(x,y+9)-.5)*.6,(hash2(x+3,y+5)*3)|0]:null;
    if(t===3){const pal=BIO.grass;TC[i]=hexRgb(pal[clamp((gn(x/6,y/6)*1.6-.3)*pal.length|0,0,pal.length-1)]).map(c=>c+(v-.5)*14)}
    else if(t===2)TC[i]=hexRgb(BIO.sand).map(c=>c+(v-.5)*12);
    else if(t===4)TC[i]=hexRgb(BIO.cliffTop).map(c=>c+(v-.5)*16);
    else TC[i]=null}
  G.tcs=new Array(N*N);for(let i=0;i<N*N;i++)refreshTile(i);
}
const DIRT=()=>hexRgb(BIO.dirt);
function refreshTile(i){const b=TC[i];if(!b){G.tcs[i]=null;return}const w=Math.min(1,G.wear[i]/26);const d=DIRT();G.tcs[i]=rgbS(lerp(b[0],d[0],w),lerp(b[1],d[1],w),lerp(b[2],d[2],w))}
function wearTile(x,y){const i=idx(x,y);if(G.tiles[i]!==3&&G.tiles[i]!==2)return;const o=G.wear[i];if(o>=30)return;G.wear[i]=o+.35;if((o/2|0)!==(G.wear[i]/2|0))refreshTile(i)}

