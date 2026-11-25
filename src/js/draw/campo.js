/* ================= Marcas sobre o campo: anel de dias (campo tocado) e ícone de colheita pronta ================= */
function desenhaMarcasCampo(vis){
  for(const b of G.bld){if(b.type!=='farm'||!b.done||!b.canteiros)continue;const cx=b.x+b.w/2,cy=b.y+b.h/2;if(!vis(cx,cy))continue;
    const pl=farmoDestaque(b),tocado=sheetKind==='info'&&sel&&sel.k==='b'&&sel.id===b.id,pronto=pl&&pl.g>=1;
    if(!tocado&&!pronto)continue;
    const q=P(cx,cy,40),y=q[1]+(tocado?0:Math.sin(perfT*3+b.id)*2.5),R=tocado?19:12;
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    ell(q[0],y,R,R,'rgba(26,18,10,.86)');
    ctx.lineWidth=tocado?4:2.5;ctx.strokeStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.arc(q[0],y,R,0,6.283);ctx.stroke();
    if(pl){ctx.strokeStyle=pronto?'#ffd34a':'#7bd36b';ctx.beginPath();ctx.arc(q[0],y,R,-1.5708,-1.5708+6.283*Math.min(1,pl.g));ctx.stroke()}
    ctx.fillStyle='#fff';ctx.font=`${tocado?17:13}px sans-serif`;ctx.fillText(pl?CAMPO.culturas[pl.c].emoji:'🌱',q[0],y+1);
    if(tocado){const n=pl&&!pronto?diasQueFaltam(pl):0,t=!pl?'Vazio':pronto?'Pronto!':n==null?'❄️ parado':txtDias(n);
      ctx.font='900 11px Nunito, sans-serif';ctx.lineWidth=3.5;ctx.strokeStyle='rgba(20,14,8,.85)';ctx.strokeText(t,q[0],y+R+10);ctx.fillStyle='#fff3c4';ctx.fillText(t,q[0],y+R+10)}
    ctx.restore()}}
