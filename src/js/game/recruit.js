/* ================= Pessoas (0.6): andarilhos chegam pela praia e podem ficar na vila =================
   Andarilho = kind 'wanderer': não conta como morador até ser convidado. Só chega se houver cama livre.
   Cama = BD[tipo].house (abrigo 2, casa 4, casa comunal 6). Números em data/pessoas.json. */
function camasLivres(){return houseCap()-popCount()}
function andarilhos(){return G.units.filter(u=>u.kind==='wanderer')}
function spawnAndarilho(){
  const borda=PESSOAS.andarilho.borda;
  for(let k=0;k<400;k++){const x=(Math.random()*N)|0,y=(Math.random()*N)|0;
    if(Math.min(x,y,N-1-x,N-1-y)>=borda)continue;const i=idx(x,y);
    if(!landT(G.tiles[i])||G.occ[i]||G.obj[i])continue;
    return spawnUnit('wanderer',x+.5,y+.5,{vida:PESSOAS.andarilho.tempo_fica,cool:1})}
  return null}
function novoIntervalo(){const A=PESSOAS.andarilho;return A.intervalo_min+Math.random()*(A.intervalo_max-A.intervalo_min)}
// chegada de andarilhos: só com cama livre e no máximo um andarilho esperando por vez
function recruitTick(dt){
  if(G.demo)return;
  if(G.andT==null)G.andT=novoIntervalo();
  G.andT-=dt;
  if(G.andT>0)return;
  G.andT=novoIntervalo();
  if(andarilhos().length>0||camasLivres()<=0)return;
  const a=spawnAndarilho();
  if(a)toast(`🚶 ${a.name}: ${PESSOAS.andarilho.chegada}`,'good');
}
function updWanderer(u,dt){
  u.vida-=dt;
  if(u.vida<=0){removeUnit(u);return}
  if(moveUnit(u,dt))return;
  u.cool-=dt;if(u.cool>0)return;
  u.cool=2+Math.random()*3;
  const p=freeNear(Math.floor(u.x),Math.floor(u.y),3);
  if(p){const pa=astar(...utile(u),(x,y)=>x===p[0]&&y===p[1],p[0],p[1],passV,400);if(pa)u.path=pa}
}
// convite: o andarilho vira morador e ocupa uma cama
function recruitUnit(a){
  if(camasLivres()<=0)return cmdFail('Sem cama livre');
  const custo={food:PESSOAS.andarilho.custo_comida};
  if(!afford(custo))return cmdFail('Falta comida');
  pay(custo);
  Object.assign(a,{kind:'villager',vida:null,cool:0,path:null,act:null,hidden:false});
  sfx('craft');
  return{ok:true,toast:`${a.name} ficou na vila.`}}
CMDS.recruit=(u,c)=>{const a=UMAP.get(c.id);if(!a||a.kind!=='wanderer')return cmdFail('','');return recruitUnit(a)};
