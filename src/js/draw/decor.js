/* ================= Decor (costs resources; pieces that connect live in Build) ================= */
const DECOR={
 barrel:{n:'Barril',cost:{wood:1},d:()=>barrel(0,0,1)},
 crate:{n:'Caixote',cost:{wood:1},d:()=>crate(0,0,1)},
 campfire:{n:'Fogueira',cost:{stick:3,stone:3},light:110,d:()=>{for(let k=0;k<8;k++){const a=k/8*6.283;ell(Math.cos(a)*7,Math.sin(a)*3.5-1,2.4,1.6,k%2?'#8a8680':'#a5a19a')}ln([-5,-1],[5,-3],'#5a3a22',2.4);ln([-5,-3],[5,-1],'#4a2f1b',2.4);flame(0,-3,1.1)}},
 torch:{n:'Tocha',cost:{stick:2},light:70,d:()=>{ln([0,0],[0,-16],'#5a3a22',2);flame(0,-17,.7)}},
 lantern:{n:'Lampião',cost:{stick:1,iron:1},light:60,d:()=>{ln([0,0],[0,-20],C.woodD,1.8);ln([0,-20],[5,-20],C.woodD,1.6);ctx.fillStyle='#2a2a2a';ctx.fillRect(3,-18,4,5);ctx.fillStyle='rgba(255,190,90,.95)';ctx.fillRect(3.8,-17.3,2.4,3.6)}},
 banner:{n:'Estandarte',cost:{stick:2,wood:1},d:()=>{ln([0,0],[0,-34],C.woodD,2);flag(1,-33)}},
 redbanner:{n:'Bandeira',cost:{stick:2,wood:1},d:()=>{ln([0,0],[0,-30],C.woodD,2);flag(1,-29,'#b5352c','#f0d98a')}},
 logs:{n:'Pilha de toras',cost:{wood:3},d:()=>{for(let r=0;r<2;r++)for(let i=0;i<3-r;i++){const X=-7+i*7+r*3.5,Y=-3.5-r*6;ell(X,Y,3.6,3.6,'#6e4322');ell(X,Y,2.6,2.6,'#d1a06a')}}},
 axestump:{n:'Toco c/ machado',cost:{wood:1,stone:1},d:()=>{stump(0,0,1.2);ln([1,-5],[6,-15],'#6b4423',1.8);pp([[.5,-6],[-3,-9],[3,-8]],'#a9a49a')}},
 tent:{n:'Tenda de pele',cost:{stick:5,food:2},d:()=>{const tip=P(0,0,24),c='#a5794f';ell(4,1,14,5,'rgba(0,0,0,.18)');pp([P(-.45,.45),P(.45,.45),tip],shade(c,-.18));pp([P(.45,.45),P(.45,-.45),tip],c);pp([P(-.1,.45),P(.15,.45),P(.02,.45,12)],'#2e1b0d');ln(tip,[tip[0]-3,tip[1]-5],C.woodD,1.5);ln(tip,[tip[0]+3,tip[1]-5],C.woodD,1.5)}},
 hay:{n:'Feno',cost:{food:3},d:()=>{ell(2,1,11,4,'rgba(0,0,0,.18)');ell(0,-4,10,6,'#c79a3a');ell(0,-8,8,5.5,'#d9b44a');ell(-1,-12,5,3.5,'#e6c65a');if(BIO.snowy)ell(0,-14,5,2,'#f2f6f9')}},
 flowers:{n:'Flores',cost:{food:1},d:()=>{const fsp=sprFor('flower_0');if(fsp){drawSpr(fsp,0,0,1,0);return}const cs=['#e8c33a','#e05a7a','#f2f2f2','#a070d0','#ff8a3a'];for(let k=0;k<11;k++){const x=(hash2(k,1)-.5)*20,y=(hash2(k,2)-.5)*9;ln([x,y],[x,y-4],'#4f7a2a',1);ell(x,y-4.5,1.6,1.6,cs[k%5])}}},
 cart:{n:'Carroça',cost:{wood:4,stick:2},d:()=>{box(-.4,-.22,.8,.44,4,6,'#a5733f','#7a4c26','#8f6234');const w1=P(-.25,.22,4),w2=P(.25,.22,4);for(const w of[w1,w2]){ctx.beginPath();ctx.arc(w[0],w[1],4.2,0,6.283);ctx.strokeStyle='#4a2f1b';ctx.lineWidth=1.8;ctx.stroke()}ln(P(.4,0,6),P(.85,0,3),C.woodD,1.8)}},
 well:{n:'Poço',cost:{stone:6,wood:2},d:()=>{const st=BIO.snowy?'#a9aaa8':C.stone;ell(0,0,9,4.5,shade(st,-.3));ctx.fillStyle=shade(st,-.15);ctx.fillRect(-9,-7,18,7);ell(0,-7,9,4.5,st);ell(0,-7,6.5,3,'#1d4a5e');ln([-8,-7],[-8,-22],C.woodD,1.8);ln([8,-7],[8,-22],C.woodD,1.8);ln([-9,-21],[9,-21],C.wood,1.8);pp([[-11,-20],[11,-20],[0,-28]],roofCol())}},
 totem:{n:'Totem',cost:{wood:3},d:()=>{const cs=['#b5352c','#2f5fa8','#d9a520','#3d7a3a'];for(let i=0;i<4;i++){ctx.fillStyle=shade(C.wood,i%2?-.1:.05);ctx.fillRect(-3.2,-8-i*7,6.4,7);ctx.fillStyle=cs[i];ctx.fillRect(-3.2,-6-i*7,6.4,1.4);ell(-1.2,-4.2-i*7,.8,.8,'#1a1a1a');ell(1.2,-4.2-i*7,.8,.8,'#1a1a1a')}pp([[-3,-36],[-10,-40],[-3,-33]],C.woodL);pp([[3,-36],[10,-40],[3,-33]],C.woodL)}},
 runestone:{n:'Pedra rúnica',cost:{stone:4},d:()=>{const c=BIO.snowy?'#9a9ea3':'#8f8c85';ell(3,1,8,3,'rgba(0,0,0,.2)');pp([[-6,0],[6,0],[5,-18],[1,-24],[-4,-21],[-6,-10]],c);pp([[1,-24],[5,-18],[6,0],[3,0],[2,-19]],shade(c,-.2));ctx.strokeStyle='#b5352c';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-3,-4);ctx.lineTo(-3,-17);ctx.lineTo(0,-13);ctx.moveTo(-3,-12);ctx.lineTo(0,-8);ctx.moveTo(1,-5);ctx.lineTo(1,-15);ctx.stroke()}},
 rack:{n:'Suporte de armas',cost:{wood:2,stick:2,iron:1},d:()=>{const a=P(-.3,0),b=P(.3,0);ln(a,[a[0],a[1]-15],C.woodD,2);ln(b,[b[0],b[1]-15],C.woodD,2);ln([a[0],a[1]-13],[b[0],b[1]-13],C.wood,2);for(let i=0;i<4;i++){const q=lp(a,b,.15+i*.23);ln([q[0]+2,q[1]+2],[q[0]-1,q[1]-22],'#6b4423',1.3);pp([[q[0]-1,q[1]-22],[q[0]-2.6,q[1]-17],[q[0]+.4,q[1]-17.5]],'#cfd4d9')}}},
 shields:{n:'Escudos',cost:{wood:3,iron:1},d:()=>{[['#b5352c',-6],['#2f5fa8',0],['#d9a520',6]].forEach(([c,x])=>{ell(x,-5,4.5,5,shade(c,-.3));ell(x,-5.5,4,4.6,c);ell(x,-5.5,1.2,1.2,'#e0d2a0')})}},
 anvil:{n:'Bigorna',cost:{iron:3},d:()=>{ell(1,0,6,2.2,'rgba(0,0,0,.2)');ctx.fillStyle='#3a3d42';ctx.fillRect(-2,-6,4,6);ctx.fillStyle='#55595f';ctx.beginPath();ctx.moveTo(-7,-9);ctx.lineTo(5,-9);ctx.lineTo(8,-6.5);ctx.lineTo(-5,-6.5);ctx.fill()}},
 rowboat:{n:'Bote',cost:{wood:5},water:true,d:()=>{ctx.save();ctx.transform(1,.5,0,1,0,0);ctx.beginPath();ctx.moveTo(-16,-4);ctx.quadraticCurveTo(0,6,16,-4);ctx.lineTo(13,-7);ctx.lineTo(-13,-7);ctx.closePath();ctx.fillStyle='#6e4322';ctx.fill();ctx.fillStyle='#8b5a2b';ctx.fillRect(-13,-8,26,2);ctx.restore()}},
 drakkar:{n:'Drakkar',cost:{wood:24,iron:2},water:true,big:true,d:()=>drakkar(1)}
};
const DECOR_ORDER=Object.keys(DECOR);
function flame(x,y,s){const t=perfT*10,f=Math.sin(t)*.8+Math.sin(t*1.7)*.6;ctx.beginPath();ctx.moveTo(x-4*s,y);ctx.quadraticCurveTo(x-4*s,y-8*s,x+f*s,y-13*s);ctx.quadraticCurveTo(x+4*s,y-7*s,x+4*s,y);ctx.closePath();ctx.fillStyle='#ff7a1a';ctx.fill();
  ctx.beginPath();ctx.moveTo(x-2.2*s,y);ctx.quadraticCurveTo(x-2*s,y-5*s,x+f*.6*s,y-8.5*s);ctx.quadraticCurveTo(x+2.4*s,y-4*s,x+2.2*s,y);ctx.closePath();ctx.fillStyle='#ffd34a';ctx.fill()}
function drakkar(s){ctx.save();ctx.transform(1,.5,0,1,0,0);ctx.scale(s,s);
  ctx.beginPath();ctx.moveTo(-38,-10);ctx.quadraticCurveTo(-30,8,0,9);ctx.quadraticCurveTo(30,8,38,-10);ctx.lineTo(34,-12);ctx.lineTo(-34,-12);ctx.closePath();ctx.fillStyle='#5e3a1d';ctx.fill();
  ctx.fillStyle='#7a4c26';ctx.fillRect(-34,-13,68,3);
  ctx.strokeStyle='#5e3a1d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(36,-11);ctx.quadraticCurveTo(44,-22,39,-30);ctx.quadraticCurveTo(35,-33,36,-27);ctx.stroke();ctx.beginPath();ctx.moveTo(-36,-11);ctx.quadraticCurveTo(-43,-20,-39,-27);ctx.stroke();
  const cs=['#b5352c','#eef0f2','#2f5fa8','#d9a520'];for(let i=0;i<8;i++){const x=-26+i*7.4;ell(x,-8,3.2,3.2,cs[i%4]);ell(x,-8,1,1,'#7a5a2a')}
  ctx.restore();ln([0,0],[0,-50*s],'#4a2f1b',2.4*s);
  ctx.save();ctx.transform(1,.5,0,1,0,0);ctx.scale(s,s);const sw=Math.sin(perfT*1.5)*1.5*windStrength();
  ctx.beginPath();ctx.moveTo(-15,-48);ctx.quadraticCurveTo(-17-sw,-30,-15,-16);ctx.lineTo(15,-16);ctx.quadraticCurveTo(17+sw,-30,15,-48);ctx.closePath();ctx.fillStyle='#eef0f2';ctx.fill();ctx.save();ctx.clip();ctx.fillStyle='#2f5fa8';for(let i=-15;i<15;i+=8)ctx.fillRect(i,-50,4,36);ctx.restore();
  ctx.restore()}

