/* ================= Ícones PNG→WebP =================
   Tabela: data/icones.json (grupos recursos, ferramentas, itens, slots, construcoes, interface, animais).
   Cada imagem é pedida só quando aparece na tela (loading lazy no HTML, Image() sob demanda no canvas).
   Sem ícone (status pendente): o emoji continua como texto. */
const ICON_DIR='icones/';
const ICON_CACHE={};
function iconEntry(g,k){const grp=ICONES[g];return grp&&grp[k]||null}
function iconPath(g,k){const e=iconEntry(g,k);return e&&e.icone?ICON_DIR+e.icone+'.webp':null}
function iconText(g,k){const e=iconEntry(g,k);return e&&e.emoji||''}
// Itens: ferramentas (items.js) ou armas/equipamento (combate.json). Chave é única entre os dois.
function itemGroup(k){return ICONES.ferramentas[k]?'ferramentas':'itens'}
function itemIcon(k){return icon(itemGroup(k),k)}
function itemMark(k){return '[['+itemGroup(k)+'.'+k+']]'}
// HTML para painéis e barras. Só chaves fixas do jogo, nunca texto digitado pelo jogador.
function icon(g,k){const p=iconPath(g,k);if(!p)return iconText(g,k);return `<img class="ico" src="${p}" alt="" loading="lazy" decoding="async">`}
// Canvas: imagem já carregada ou null (na primeira vez começa o download).
function iconCanvas(g,k){const p=iconPath(g,k);if(!p)return null;let im=ICON_CACHE[p];if(!im){im=ICON_CACHE[p]=new Image();im.src=p}return im.complete&&im.naturalWidth?im:null}
// Mensagem com marcadores [[grupo.chave]] → partes: texto ou imagem (canvas) — um parser só.
const ICON_MARK=/\[\[([a-z]+)\.([a-z_]+)\]\]/;
function iconSplit(msg){const parts=String(msg).split(new RegExp(ICON_MARK.source,'g')),out=[];
  for(let i=0;i<parts.length;i+=3){if(parts[i])out.push({t:parts[i]});const g=parts[i+1];if(g)out.push({g,k:parts[i+2]})}
  return out}
// Nós do DOM (toasts, textos de tela). Sem innerHTML.
function richNodes(msg){const frag=document.createDocumentFragment();
  for(const s of iconSplit(msg)){if(s.t!=null){frag.append(s.t);continue}const p=iconPath(s.g,s.k);
    if(p){const im=document.createElement('img');im.className='ico';im.src=p;im.alt='';im.decoding='async';frag.append(im)}else frag.append(iconText(s.g,s.k))}
  return frag}
// Canvas: partes com a imagem já carregada (ou emoji enquanto carrega).
function iconCanvasSegs(msg){return iconSplit(msg).map(s=>s.t!=null?s:(iconCanvas(s.g,s.k)?{im:iconCanvas(s.g,s.k)}:{t:iconText(s.g,s.k)}))}
