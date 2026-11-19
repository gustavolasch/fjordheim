/* ================= Drawing: primitives ================= */
function box(x,y,w,h,z0,zh,cT,cL,cR){const z1=z0+zh;
  if(cL)pp([P(x,y+h,z0),P(x+w,y+h,z0),P(x+w,y+h,z1),P(x,y+h,z1)],cL);
  if(cR)pp([P(x+w,y+h,z0),P(x+w,y,z0),P(x+w,y,z1),P(x+w,y+h,z1)],cR);
  if(cT)pp([P(x,y,z1),P(x+w,y,z1),P(x+w,y+h,z1),P(x,y+h,z1)],cT)}
function roofCol(){return BIO.snowy?'#eef3f7':C.thatch}
function crossAt(tip,e1,e2){const k=.24;ctx.lineCap='round';ln(tip,[tip[0]+(tip[0]-e1[0])*k,tip[1]+(tip[1]-e1[1])*k],C.woodD,2.4);ln(tip,[tip[0]+(tip[0]-e2[0])*k,tip[1]+(tip[1]-e2[1])*k],C.woodD,2.4)}
function roofX(x,y,w,h,z,rise,col,cross){const o=.18,x0=x-o,x1=x+w+o,y0=y-o,y1=y+h+o,ym=y+h/2;
  const r0=P(x0,ym,z+rise),r1=P(x1,ym,z+rise),a0=P(x0,y0,z),a1=P(x1,y0,z),b0=P(x0,y1,z),b1=P(x1,y1,z);
  if(rise<(h/2+o)*HH)pp([a0,a1,r1,r0],shade(col,.12));
  pp([P(x+w,y,z),P(x+w,y+h,z),P(x+w,ym,z+rise*.92)],shade(C.wood,-.08));
  pp([r0,r1,b1,b0],shade(col,-.06));
  for(let t=.22;t<1;t+=.22)ln(lp(r0,b0,t),lp(r1,b1,t),'rgba(70,40,10,.2)',1);
  if(BIO.snowy)ln(b0,b1,C.thatch,2.2);
  ln(r1,b1,shade(col,-.32),2);ln(r0,r1,shade(col,.2),1.5);
  if(cross)crossAt(r1,b1,a1)}
function roofY(x,y,w,h,z,rise,col,cross){const o=.18,x0=x-o,x1=x+w+o,y0=y-o,y1=y+h+o,xm=x+w/2;
  const r0=P(xm,y0,z+rise),r1=P(xm,y1,z+rise),a0=P(x0,y0,z),a1=P(x0,y1,z),b0=P(x1,y0,z),b1=P(x1,y1,z);
  if(rise<(w/2+o)*HH)pp([a0,a1,r1,r0],shade(col,-.15));
  pp([P(x,y+h,z),P(x+w,y+h,z),P(xm,y+h,z+rise*.92)],shade(C.wood,-.3));
  pp([r0,r1,b1,b0],shade(col,.04));
  for(let t=.22;t<1;t+=.22)ln(lp(r0,b0,t),lp(r1,b1,t),'rgba(70,40,10,.2)',1);
  if(BIO.snowy)ln(b0,b1,C.thatch,2.2);
  ln(r1,a1,shade(col,-.35),2);ln(r0,r1,shade(col,.25),1.5);
  if(cross)crossAt(r1,a1,b1)}
function flag(x,y,c1,c2){const t=perfT*3,w=.7+windStrength()*.8;ctx.beginPath();ctx.moveTo(x,y);for(let i=0;i<=6;i++)ctx.lineTo(x+i*2.3,y+Math.sin(t+i*.8)*1.2*w*(i/6));for(let i=6;i>=0;i--)ctx.lineTo(x+i*2.3,y+10+Math.sin(t+i*.8)*1.2*w*(i/6));ctx.closePath();ctx.fillStyle=c1||'#2f5fa8';ctx.fill();
  ctx.beginPath();for(let i=0;i<=6;i++)ctx.lineTo(x+i*2.3,y+3.6+Math.sin(t+i*.8)*1.2*w*(i/6));for(let i=6;i>=0;i--)ctx.lineTo(x+i*2.3,y+6.4+Math.sin(t+i*.8)*1.2*w*(i/6));ctx.closePath();ctx.fillStyle=c2||'#eef0f2';ctx.fill()}
function barrel(cx,cy,s){s=s||1;ell(cx+1,cy,5*s,2.2*s,'rgba(0,0,0,.2)');ctx.fillStyle='#8a5a2e';ctx.fillRect(cx-4*s,cy-10*s,8*s,10*s);ctx.fillStyle='rgba(0,0,0,.2)';ctx.fillRect(cx-4*s,cy-10*s,3*s,10*s);
  ell(cx,cy,4*s,1.8*s,'#7a4c26');ctx.fillStyle='#3a3330';ctx.fillRect(cx-4*s,cy-2.6*s,8*s,1.1*s);ctx.fillRect(cx-4*s,cy-8.4*s,8*s,1.1*s);ell(cx,cy-10*s,4*s,1.8*s,'#b07b46')}
function crate(x,y,s){s=s||1;const q=.24*s;box(x-q,y-q,2*q,2*q,0,9*s,'#c49563','#85592f','#a5733f');const a=P(x-q,y+q,0),b=P(x+q,y+q,9*s),c=P(x+q,y+q,0),d=P(x-q,y+q,9*s);ln(a,b,'rgba(60,35,15,.5)',1);ln(c,d,'rgba(60,35,15,.5)',1)}
function stake(q,h,col){const c=col||C.wood;ctx.fillStyle=shade(c,-.25);ctx.fillRect(q[0]-2.4,q[1]-h,2.4,h);ctx.fillStyle=c;ctx.fillRect(q[0],q[1]-h,2.4,h);
  ctx.beginPath();ctx.moveTo(q[0]-2.4,q[1]-h);ctx.lineTo(q[0],q[1]-h-4.5);ctx.lineTo(q[0]+2.4,q[1]-h);ctx.closePath();ctx.fillStyle=shade(c,.15);ctx.fill();if(BIO.snowy){ctx.fillStyle='#f2f6f9';ctx.fillRect(q[0]-1,q[1]-h-2,2,2)}}

