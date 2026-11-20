/* ================= Ícones PNG→WebP =================
   Tabela: data/icones.json (grupos recursos, ferramentas, itens, slots, construcoes, interface, animais).
   Cada imagem é pedida só quando aparece na tela (loading lazy no HTML, Image() sob demanda no canvas).
   Sem ícone (status pendente): o emoji continua como texto. */
const ICON_DIR='icones/';
const ICON_CACHE={};
function iconEntry(g,k){const grp=ICONES[g];return grp&&grp[k]||null}
function iconPath(g,k){const e=iconEntry(g,k);return e&&e.icone?ICON_DIR+e.icone+'.webp':null}
function iconText(g,k){const e=iconEntry(g,k);return e&&e.emoji||''}
// HTML para painéis e barras. Só chaves fixas do jogo, nunca texto digitado pelo jogador.
function icon(g,k){const p=iconPath(g,k);if(!p)return iconText(g,k);return `<img class="ico" src="${p}" alt="" loading="lazy" decoding="async">`}
// Canvas: imagem já carregada ou null (na primeira vez começa o download).
function iconCanvas(g,k){const p=iconPath(g,k);if(!p)return null;let im=ICON_CACHE[p];if(!im){im=ICON_CACHE[p]=new Image();im.src=p}return im.complete&&im.naturalWidth?im:null}
// Mensagem com marcadores [[grupo.chave]] → nós do DOM (sem innerHTML).
function richNodes(msg){const frag=document.createDocumentFragment(),parts=String(msg).split(/\[\[([a-z]+)\.([a-z_]+)\]\]/);
  for(let i=0;i<parts.length;i+=3){frag.append(parts[i]||'');const g=parts[i+1];if(!g)continue;const k=parts[i+2],p=iconPath(g,k);
    if(p){const im=document.createElement('img');im.className='ico';im.src=p;im.alt='';im.decoding='async';frag.append(im)}else frag.append(iconText(g,k))}
  return frag}
