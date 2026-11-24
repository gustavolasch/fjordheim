'use strict';
/* ================= Base ================= */
const HW=32,HH=16,N=68,SC=N/48,ZMIN=.32,ZMAX=3.2,SAVE_KEY='fjordheim_save_v2',SET_KEY='fjordheim_settings_v1',BAG=20;
const $=s=>document.querySelector(s);
const cv=$('#c');let ctx=cv.getContext('2d');
const lc=document.createElement('canvas'),lctx=lc.getContext('2d');
let W=0,H=0,DPR=1,bgGrad=null;
const isTouch=matchMedia('(pointer:coarse)').matches;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';lc.width=Math.ceil(W/2);lc.height=Math.ceil(H/2);bgGrad=null}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,300));if(window.visualViewport)visualViewport.addEventListener('resize',resize);resize();
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash2(x,y){const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)}
function makeNoise(seed){const r=mulberry32(seed),S=64,g=new Float32Array(S*S);for(let i=0;i<S*S;i++)g[i]=r();
  const at=(x,y)=>g[(((y%S)+S)%S)*S+(((x%S)+S)%S)],sm=t=>t*t*(3-2*t);
  function v(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=sm(x-xi),yf=sm(y-yi),a=at(xi,yi),b=at(xi+1,yi),c=at(xi,yi+1),d=at(xi+1,yi+1);return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf}
  return (x,y)=>{let s=0,amp=1,f=1,t=0;for(let o=0;o<4;o++){s+=v(x*f+o*17,y*f+o*31)*amp;t+=amp;amp*=.5;f*=2}return s/t}}
function hexRgb(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]}
function rgbS(r,g,b,a){return a==null?`rgb(${r|0},${g|0},${b|0})`:`rgba(${r|0},${g|0},${b|0},${a})`}
const _sh=new Map();
function shade(hex,f){const k=hex+f;let v=_sh.get(k);if(v)return v;const[r,g,b]=hexRgb(hex);v=f>=0?rgbS(r+(255-r)*f,g+(255-g)*f,b+(255-b)*f):rgbS(r*(1+f),g*(1+f),b*(1+f));_sh.set(k,v);return v}
function P(x,y,z){return[(x-y)*HW,(x+y)*HH-(z||0)]}
function pp(pts,fill,stroke,lw){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||1;ctx.stroke()}}
function ln(a,b,col,lw){ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=col;ctx.lineWidth=lw||1;ctx.stroke()}
function ell(x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill()}
function lp(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}
const pick=a=>a[(Math.random()*a.length)|0];
let perfT=0,LOD=false;
const ICON={
 build:'<path d="M14.5 5.5l4 4"/><path d="M13 4l2-2 6 6-2 2z"/><path d="M14 8l-9.5 9.5a1.5 1.5 0 0 0 2 2L16 10"/>',
 craft:'<path d="M4 20l9-9"/><path d="M12 4c3.5-.5 7 2.5 7.5 6l-3 .8-5.3-5.3z"/><path d="M15 13l5 5-2 2-5-5"/>',
 bag:'<path d="M5.5 9h13l-1 11h-11z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/><path d="M9.5 13h5"/>',
 edit:'<path d="M12 3v18M3 12h18"/><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
 loc:'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 struct:'<path d="M3 11l9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
 walls:'<path d="M4 20V8l2-3 2 3v12M10 20V8l2-3 2 3v12M16 20V8l2-3 2 3v12"/>',
 fences:'<path d="M5 20V6M12 20V6M19 20V6M3 10h18M3 15h18"/>',
 floors:'<path d="M3 14l9-5 9 5-9 5z"/><path d="M7.5 11.5l9 5M12 9l4.5 2.5"/>',
 doors:'<path d="M6 21V4.5A.5.5 0 0 1 6.5 4h11a.5.5 0 0 1 .5.5V21M3.5 21h17"/><path d="M14.5 12.5v1"/>',
 store:'<path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/>',
 decor:'<path d="M5 21V3.5"/><path d="M5 4h12l-2.5 4L17 12H5"/>'};
const svg=k=>`<svg class="i" viewBox="0 0 24 24">${ICON[k]}</svg>`;

