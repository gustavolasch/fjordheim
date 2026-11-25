/* ================= Drawing: nature ================= */
function windStrength(){return clamp(.5+.3*Math.sin(perfT*.13)+.2*Math.sin(perfT*.41+1),0,1)}
function treeShape(cx,cy,k,s,c,shadow,shake){
  if(shadow!==false)ell(cx+5*s,cy+1,11*s,4.2*s,'rgba(0,0,0,.2)');
  const sps=treeSpr(k,c);if(sps){const w0=(.35+windStrength()*.9)+(shake>0?shake*8:0),p0=shake>0?perfT*40:perfT*1.4,sk=Math.sin(p0*.9+cx*.05)*.012*w0;for(const[sp,al]of sps)drawSpr(sp,cx,cy,s,sk,al);
    if(k==='oak'&&c%3===0&&estacao().e.id==='primavera'){const fl=sprFor('flower_0');if(fl){drawSpr(fl,cx-6*s,cy-30*s,.7*s,0);drawSpr(fl,cx+5*s,cy-34*s,.6*s,0);drawSpr(fl,cx,cy-22*s,.55*s,0)}}
    return}
  const wnd=(.35+windStrength()*.9)+(shake>0?shake*8:0),ph=shake>0?perfT*40:perfT*1.4;
  if(LOD){if(k==='oak'){ctx.fillStyle='#5a3a22';ctx.fillRect(cx-1.7*s,cy-15*s,3.4*s,15*s);const col=BIO.leaves[c%BIO.leaves.length];ell(cx,cy-22*s,11*s,10*s,col);ell(cx-3*s,cy-27*s,5*s,4*s,shade(col,.2))}else{const col=BIO.pines[c%BIO.pines.length];pp([[cx,cy-38*s],[cx-10*s,cy-4*s],[cx+10*s,cy-4*s]],col);pp([[cx,cy-38*s],[cx-10*s,cy-4*s],[cx,cy-2*s]],shade(col,-.22));if(BIO.snowy)pp([[cx,cy-38*s],[cx-4*s,cy-26*s],[cx+4*s,cy-26*s]],'#eef3f7')}return}
  if(k==='oak'){ctx.fillStyle='#5a3a22';ctx.fillRect(cx-1.7*s,cy-15*s,3.4*s,15*s);const col=BIO.leaves[c%BIO.leaves.length];const sw=Math.sin(ph+cx*.05)*.8*wnd;
    const bl=[[-6,-20,8],[6,-21,8],[0,-28,9.5],[-3,-16,6.5],[5,-14,6]];
    for(const[x,y,r]of bl)ell(cx+x*s+1+sw,cy+y*s+1.5,r*s,r*s*.92,shade(col,-.3));
    for(const[x,y,r]of bl)ell(cx+x*s+sw,cy+y*s,r*s*.92,r*s*.85,col);
    ell(cx-3*s+sw,cy-29*s,4.8*s,4*s,shade(col,.22));ell(cx+4*s+sw,cy-23*s,3.4*s,3*s,shade(col,.14));
    if(BIO.snowy){ell(cx+sw,cy-33*s,6*s,2.5*s,'#f2f6f9')}}
  else{ctx.fillStyle='#4a3020';ctx.fillRect(cx-1.4*s,cy-7*s,2.8*s,7*s);const col=BIO.pines[c%BIO.pines.length];const sw=Math.sin(ph*.9+cx*.05)*.7*wnd;
    for(let i=0;i<4;i++){const base=cy-(4+i*7.2)*s,top=base-13*s,w=(10.5-i*2.3)*s,ox=sw*(i/3);
      pp([[cx+ox,top],[cx-w,base],[cx,base+2*s]],shade(col,-.22));pp([[cx+ox,top],[cx+w,base],[cx,base+2*s]],col);
      if(BIO.snowy){pp([[cx+ox,top],[cx-w*.55,top+7*s],[cx,top+6*s],[cx+w*.6,top+7.5*s]],'#eef3f7');pp([[cx-w,base],[cx-w*.6,base-2.5*s],[cx,base+.5*s]],'rgba(240,245,250,.85)')}}}}
function oreDots(cx,cy,s,sd){for(let k=0;k<5;k++)ell(cx+(hash2(sd,k+20)-.5)*14*s,cy-6*s+(hash2(sd,k+40)-.5)*7*s,1.6*s,1.2*s,k%2?'#d27a3a':'#b5562a')}
function boulder(cx,cy,s,kind,sd){const rsp=BIO.snowy?null:sprFor('rock_'+(Math.floor(sd||0)%3));if(rsp){ell(cx+3*s,cy+1,10*s,4*s,'rgba(0,0,0,.22)');drawSpr(rsp,cx,cy,s,0);if(kind==='ore')oreDots(cx,cy,s,sd);return}const base=kind==='ore'?'#5d5a57':(BIO.snowy?'#9a9ea3':C.stone);ell(cx+3*s,cy+1,10*s,4*s,'rgba(0,0,0,.22)');
  const pts=[];for(let k=0;k<8;k++){const a=k/8*6.283,r=(8+hash2(sd,k)*3)*s;pts.push([cx+Math.cos(a)*r*1.15,cy-5*s+Math.sin(a)*r*.75])}
  pp(pts,shade(base,-.25));const top=pts.map(p=>[p[0]*.85+cx*.15,(p[1]-3*s)*.8+(cy-8*s)*.2]);pp(top,base);ell(cx-3*s,cy-10*s,3.5*s,2*s,shade(base,.25));
  if(kind==='ore'){for(let k=0;k<5;k++)ell(cx+(hash2(sd,k+20)-.5)*14*s,cy-6*s+(hash2(sd,k+40)-.5)*7*s,1.6*s,1.2*s,k%2?'#d27a3a':'#b5562a')}
  if(BIO.snowy)ell(cx-1*s,cy-12*s,6*s,2.2*s,'#f2f6f9')}
function pebble(cx,cy,s,sd){const psp=BIO.snowy?null:sprFor('pebble_'+(Math.floor(sd||0)%5));if(psp){drawSpr(psp,cx,cy,s,0);return}const base=BIO.snowy?'#8d9196':'#9a968e';for(let k=0;k<2;k++){const x=cx+(hash2(sd,k)-.5)*8*s,y=cy+(hash2(k,sd)-.5)*3*s,r=(2.2+hash2(sd+k,3)*1.4)*s;ell(x+.8,y+.6,r,r*.6,'rgba(0,0,0,.22)');ell(x,y-r*.35,r,r*.65,base);ell(x-r*.3,y-r*.6,r*.45,r*.25,shade(base,.3))}}
function branch(cx,cy,s,sd){const a=(hash2(sd,1)-.5)*.8,L=9*s,dx=Math.cos(a)*L,dy=Math.sin(a)*L*.5;ctx.lineCap='round';ln([cx-dx+1,cy-dy+1],[cx+dx+1,cy+dy+1],'rgba(0,0,0,.2)',2.4*s);ln([cx-dx,cy-dy],[cx+dx,cy+dy],C.twig,2*s);
  ln([cx+dx*.2,cy+dy*.2],[cx+dx*.2+3*s,cy+dy*.2-3.5*s],C.twig,1.3*s);ln([cx-dx*.4,cy-dy*.4],[cx-dx*.4-2.5*s,cy-dy*.4-2.5*s],C.twig,1.1*s);
  if(!BIO.snowy)ell(cx+dx*.2+3.4*s,cy+dy*.2-4*s,1.8*s,1.1*s,G&&G.biome==='autumn'?'#e0631f':'#5d9a3c')}
function bush(cx,cy,s,c,b){ell(cx+3*s,cy+1,7*s,3*s,'rgba(0,0,0,.18)');const bsp=BIO.snowy?null:sprFor(G.biome+'_bush');if(bsp)drawSpr(bsp,cx,cy,s,0);else{const col=BIO.bush;ell(cx-3*s,cy-4*s,5*s,4.2*s,shade(col,-.2));ell(cx+3*s,cy-4*s,5*s,4.4*s,col);ell(cx,cy-7*s,5*s,4*s,shade(col,.12))}
  const n=b==null?5:b*2;for(let k=0;k<n;k++)ell(cx+(hash2(c*9,k)-.5)*10*s,cy-5*s+(hash2(k,c*7)-.5)*6*s,1.3*s,1.3*s,BIO.snowy?'#7a2a4a':'#c8243a');if(BIO.snowy)ell(cx,cy-10*s,5*s,1.8*s,'#f2f6f9')}
function stump(cx,cy,s){ell(cx+1,cy,5*s,2.4*s,'rgba(0,0,0,.2)');ctx.fillStyle='#5a3a22';ctx.fillRect(cx-3.5*s,cy-4*s,7*s,4*s);ell(cx,cy,3.5*s,1.6*s,'#4a2f1b');ell(cx,cy-4*s,3.5*s,1.6*s,'#c9a16a');ell(cx,cy-4*s,1.6*s,.7*s,'#9a7146')}
function logShape(x,y,o){const s=o.s,len=.35+.65*o.amt/3;const a=P(x+.5+o.ox,y+.5+o.oy),b=P(x+.5+o.ox+len*1.05,y+.5+o.oy);stump(a[0],a[1],s);
  ctx.lineCap='butt';ln([a[0]+3,a[1]+1.5],[b[0]+3,b[1]+1.5],'rgba(0,0,0,.2)',7*s);
  ln([a[0]+2,a[1]-2.5*s],[b[0],b[1]-2.5*s],'#5e3b1f',6*s);ln([a[0]+2,a[1]-4.2*s],[b[0],b[1]-4.2*s],'#7a4c26',2.2*s);
  ell(b[0],b[1]-2.5*s,2.4*s,3.1*s,'#c9a16a');ell(b[0],b[1]-2.5*s,1*s,1.4*s,'#9a7146');if(BIO.snowy)ln([a[0]+4,a[1]-5.4*s],[b[0]-2,b[1]-5.4*s],'#f2f6f9',1.6)}
function drawObj(ob,x,y){const q=P(x+.5+(ob.ox||0),y+.5+(ob.oy||0));
  switch(ob.t){
  case'tree':treeShape(q[0],q[1],ob.k,ob.s*(.35+.65*ob.g),ob.c,true,ob.shake);break;
  case'falling':{const e=ob.ft*ob.ft;ell(q[0]+5*ob.s+e*18,q[1]+1,11*ob.s,4*ob.s,'rgba(0,0,0,.2)');stump(q[0],q[1],ob.s);ctx.save();ctx.translate(q[0],q[1]-3);ctx.rotate(e*2.0);ctx.translate(-q[0],-(q[1]-3));treeShape(q[0],q[1],ob.k,ob.s,ob.c,false);ctx.restore();break}
  case'log':logShape(x,y,ob);break;
  case'stone':case'ore':boulder(q[0],q[1],ob.s*(.55+.45*ob.amt/(ob.t==='ore'?4:6)),ob.t,ob.sd);break;
  case'bush':bush(q[0],q[1],ob.s,ob.c,ob.b);break;
  case'stump':stump(q[0],q[1],ob.s);break;
  case'pebble':pebble(q[0],q[1],ob.s,ob.sd);break;
  case'branch':branch(q[0],q[1],ob.s,ob.sd);break}}

