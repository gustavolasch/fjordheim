/* ================= Sprites (Stylized Nature MegaKit, Quaternius, CC0) =================
   PNGs baked offline from the glTF pack (tools/sprite-bake). Keys:
   <biome>_oak_<c>, <biome>_pine_<c>, <biome>_bush, rock_<i>, pebble_<i>, flower_0.
   Snow biome keeps the procedural drawings: the pack has no matching snow look. */
const SPR={};
function sprInit(){return Promise.all(Object.keys(SPR_SRC).map(k=>{const img=new Image();img.src=SPR_SRC[k];SPR[k]={img,...SPR_META[k]};return img.decode().catch(()=>{})}))}
function sprFor(k){const s=SPR[k];return s&&s.img.complete&&s.img.naturalWidth?s:null}
// base point (x,y) = ground under the object; sc = same scale the procedural drawing uses (1 = targetH px)
function drawSpr(s,x,y,sc,skew,al){ctx.save();if(al!=null)ctx.globalAlpha=al;ctx.translate(x,y);if(skew)ctx.transform(1,0,skew,1,0,0);const k=sc*.5;ctx.drawImage(s.img,-s.ax*k,-s.ay*k,s.w*k,s.h*k);ctx.restore()}
// Árvore da estação atual (sprites bakeados por estação). Durante o 1º dia da estação mistura com a anterior.
// Devolve [[sprite, alfa], ...] ou null (sem sprite: desenho procedural).
// pinheiro de inverno = pinheiro verde com neve por cima (camada branca só nas folhas, feita uma vez por sprite)
function sprArvore(key){const s=sprFor(key);if(!s||key.indexOf('inverno_pine_')!==0)return s;if(!s.neve){const cv=document.createElement('canvas');cv.width=s.img.naturalWidth;cv.height=s.img.naturalHeight;const g=cv.getContext('2d');g.drawImage(s.img,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(236,243,247,.88)';g.fillRect(0,0,cv.width,cv.height);s.neve={img:cv,w:s.w,h:s.h,ax:s.ax,ay:s.ay}}return s.neve}
function treeSpr(k,c){if(BIO.snowy)return null;const tr=transicao();const b=sprArvore(prefixoArvore(k)+c);
  if(!tr)return b?[[b,1]]:null;const a=sprArvore(prefixoArvore(k,tr.anterior)+c);const out=[];if(a)out.push([a,1-tr.p]);if(b)out.push([b,tr.p]);return out.length?out:null}
