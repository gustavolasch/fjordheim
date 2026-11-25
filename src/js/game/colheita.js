/* ================= Lavoura explicada: mini-saga "A Primeira Colheita", dias que faltam e aviso de inverno =================
   Só lógica. G.colheita = {p: passo atual, colheu, pao, fim} ou null (ainda sem semente). Textos em data/campo.json. */
// dias de jogo que faltam no ritmo da estação atual; null = não cresce agora
function diasQueFaltam(p){const m=estacao().e.crescimento;if(m<=0)return null;return Math.max(1,Math.ceil((1-p.g)*CAMPO.culturas[p.c].dias/m-1e-6))}
// canteiro que representa o campo: maduro primeiro, senão o mais perto de ficar pronto
function farmoDestaque(b){let best=null,bd=-1;for(const p of b.canteiros||[])if(p.st===2){const falta=(1-Math.min(1,p.g))*CAMPO.culturas[p.c].dias,v=p.g>=1?1e9:1e6-falta;if(v>bd){bd=v;best=p}}return best}
function txtDias(n){return n===1?'1 dia':n+' dias'}
function preenche(t,v){return t.replace(/\{(\w+)\}/g,(m,k)=>v[k]??m)}
// linhas de situação, uma por planta que está no campo
function farmoSituacao(b){const T=CAMPO.textos,out=[],r=farmoResumo(b);if(r.pt)out.push(preenche(T.maduro,{n:r.pt}));
  for(const c in CAMPO.culturas){let best=null;for(const p of b.canteiros)if(p.st===2&&p.c===c&&p.g<1&&(!best||p.g>best.g))best=p;if(!best)continue;
    const n=diasQueFaltam(best),planta=CAMPO.culturas[c].n;out.push(n==null?preenche(T.nao_cresce,{planta}):preenche(n===1?T.falta:T.faltam,{planta,dias:txtDias(n)}))}
  if(!out.length)out.push(T.campo_vazio);return out}
function sementesTotal(){let n=0;for(const c in CAMPO.culturas)n+=have(CAMPO.culturas[c].semente);return n}
function camposProntos(){return G.bld.filter(b=>b.type==='farm'&&b.done&&b.canteiros)}
function passoFeito(id){const C=G.colheita,F=camposProntos(),tem=st=>F.some(b=>b.canteiros.some(st)),plantado=tem(p=>p.st===2);
  switch(id){
    case'semente':return have('semente_cevada')>=CAMPO.textos.saga.sementes_meta||F.length>0||!!C.colheu;
    case'campo':return F.length>0||!!C.colheu;
    case'plantar':return plantado||!!C.colheu;
    case'esperar':return tem(p=>p.st===2&&p.g>=1)||!!C.colheu;
    case'colher':return !!C.colheu;
    case'pao':return !!C.pao}
  return false}
function colheitaTick(){if(G.demo)return;
  if(!G.colheita){if(sementesTotal()<=0)return;G.colheita={p:0}}
  const C=G.colheita;if(C.fim)return;const S=CAMPO.textos.saga;
  const i=S.passos.findIndex(s=>!passoFeito(s.id));
  if(i<0){C.fim=true;for(const k in S.premio)ganhaEstoque(k,S.premio[k]);toast(S.concluida,'good');return}
  C.p=i}
// outono: avisa uma vez por ano, quando faltam poucos dias para o inverno e há um campo
function avisoInverno(){if(G.demo||menuOpen||!ehOutono()||!camposProntos().length)return;
  const s=estacao(),n=CAMPO.dias_por_estacao,faltam=n-s.dia+1;if(faltam>CAMPO.aviso_inverno_dias)return;
  const ano=Math.floor((Math.floor(G.t/DIA())+(G.estOff||0))/(n*CAMPO.estacoes.length));
  if(G.flags.avisoInverno===ano)return;G.flags.avisoInverno=ano;toast(preenche(CAMPO.textos.aviso_inverno,{dias:txtDias(faltam)}),'bad')}
