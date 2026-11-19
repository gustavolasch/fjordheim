/* ================= Audio (synthesized, lightweight) ================= */
const SND={ctx:null};
function audioInit(){if(SND.ctx||!settings.sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const c=new AC();SND.ctx=c;SND.master=c.createGain();SND.master.gain.value=.7;SND.master.connect(c.destination);
  const len=c.sampleRate*2,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);let l=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;l=(l+.02*w)/1.02;d[i]=l*3.5}SND.brown=buf;
  const wb=c.createBuffer(1,len,c.sampleRate),wd=wb.getChannelData(0);for(let i=0;i<len;i++)wd[i]=Math.random()*2-1;SND.white=wb;
  const src=c.createBufferSource();src.buffer=buf;src.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=500;const g=c.createGain();g.gain.value=0;src.connect(f);f.connect(g);g.connect(SND.master);src.start();SND.wind={g,f}}catch(e){SND.ctx=null}}
document.addEventListener('pointerdown',()=>{audioInit();if(SND.ctx&&SND.ctx.state==='suspended')SND.ctx.resume().catch(()=>{})},{passive:true});
function sfx(type){const c=SND.ctx;if(!c||!settings.sound||menuOpen)return;const t=c.currentTime;
  const env=(node,a,d,peak,st)=>{st=st||t;const g=c.createGain();g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(peak,st+a);g.gain.exponentialRampToValueAtTime(.0001,st+a+d);node.connect(g);g.connect(SND.master)};
  const osc=(ty,f0,f1,dur,peak,st)=>{st=st||t;const o=c.createOscillator();o.type=ty;o.frequency.setValueAtTime(f0,st);o.frequency.exponentialRampToValueAtTime(f1,st+dur);env(o,.005,dur,peak,st);o.start(st);o.stop(st+dur+.05)};
  const nz=(fq,dur,peak,q,buf)=>{const s=c.createBufferSource();s.buffer=buf||SND.white;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=fq;f.Q.value=q||1;s.connect(f);env(f,.003,dur,peak);s.start(t,Math.random());s.stop(t+dur+.05)};
  switch(type){
   case'chop':nz(1100,.1,.35,1.4);osc('triangle',210,110,.08,.18);break;
   case'hammer':nz(2200,.05,.12,2);osc('triangle',380,260,.04,.06);break;
   case'pick':osc('sine',520,900,.08,.12);break;
   case'mine':nz(3000,.07,.25,3);osc('square',320,190,.04,.04);break;
   case'fall':nz(260,.7,.5,.7,SND.brown);osc('sine',90,36,.5,.35);break;
   case'place':osc('sine',150,70,.18,.28);nz(600,.12,.12,1,SND.brown);break;
   case'craft':osc('triangle',660,660,.07,.12);osc('triangle',990,990,.12,.1,t+.09);break;
   case'store':osc('sine',700,1050,.1,.1);osc('sine',1050,1400,.1,.07,t+.08);break;
   case'splash':nz(1500,.25,.22,.7);break;
   case'tick':osc('sine',1200,1000,.03,.04);break;
   case'bad':osc('sawtooth',200,140,.22,.05);break;
   case'bird':{const f=2300+Math.random()*1500,n=2+(Math.random()*3|0);for(let i=0;i<n;i++)osc('sine',f,f*1.3,.07,.025,t+i*.12)}break}}
function audioTick(dt){if(!SND.ctx||!SND.wind)return;const w=windStrength(),on=settings.sound&&!menuOpen&&G&&!G.demo;
  SND.wind.g.gain.setTargetAtTime(on?(.02+w*.045)*(BIO.snowy?1.6:1):0,SND.ctx.currentTime,.6);SND.wind.f.frequency.setTargetAtTime(280+w*480,SND.ctx.currentTime,.6);
  SND.birdT=(SND.birdT==null?3:SND.birdT)-dt;if(SND.birdT<=0){SND.birdT=4+Math.random()*9;if(on&&!BIO.snowy&&darkness()<.15)sfx('bird')}}

