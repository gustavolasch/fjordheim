/* ================= Loop ================= */
let last=performance.now(),uiT=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;perfT=now/1000;
  if(G&&!(paused&&!G.demo)&&!(menuOpen&&!G.demo&&NET.role!=='host')&&NET.role!=='guest'){const steps=G.demo?1:G.speed;for(let i=0;i<steps;i++)update(dt)}
  if(zT){const f=Math.pow(zT.z/cam.z,Math.min(1,dt*12));zoomAt(zT.px,zT.py,f);if(Math.abs(zT.z-cam.z)<.002)zT=null}
  if(camGo){const k=Math.min(1,dt*6);cam.x+=(camGo.x-cam.x)*k;cam.y+=(camGo.y-cam.y)*k;if(Math.abs(camGo.x-cam.x)+Math.abs(camGo.y-cam.y)<1)camGo=null}
  else if(G&&!menuOpen&&!ptrs.size){const p=PL();if(p&&p.moving){const[sx,sy]=w2s(p.x,p.y);const mx=W*.18,mt=H*.22,mb=H*.3;let dx=0,dy=0;if(sx<mx)dx=mx-sx;else if(sx>W-mx)dx=W-mx-sx;if(sy<mt)dy=mt-sy;else if(sy>H-mb)dy=H-mb-sy;const k=Math.min(1,dt*3);cam.x+=dx*k;cam.y+=dy*k}}
  if(NET.role==='guest'){netInterp();updParticles(dt)} // amigo não roda update(): só o visual envelhece aqui
  updWeather(dt);render();setaTick();audioTick(dt);
  uiT-=dt;if(uiT<=0&&!menuOpen){uiT=.25;updHUD();sagaBoxHUD();renderSheet();hintChecks()}
  requestAnimationFrame(frame)}
applySettings();
sprInit().then(()=>{newGame(pick(Object.keys(BIOMES)),null,true);cam.z=isTouch?.95:1.1;centerCam();openMenu(false)});
requestAnimationFrame(frame);
