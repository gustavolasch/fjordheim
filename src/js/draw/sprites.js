/* ================= Sprites (Stylized Nature MegaKit, Quaternius, CC0) =================
   PNGs baked offline from the glTF pack (tools/sprite-bake). Keys:
   <biome>_oak_<c>, <biome>_pine_<c>, <biome>_bush, rock_<i>, pebble_<i>, flower_0.
   Snow biome keeps the procedural drawings: the pack has no matching snow look. */
const SPR={};
function sprInit(){return Promise.all(Object.keys(SPR_SRC).map(k=>{const img=new Image();img.src=SPR_SRC[k];SPR[k]={img,...SPR_META[k]};return img.decode().catch(()=>{})}))}
function sprFor(k){const s=SPR[k];return s&&s.img.complete&&s.img.naturalWidth?s:null}
// base point (x,y) = ground under the object; sc = same scale the procedural drawing uses (1 = targetH px)
function drawSpr(s,x,y,sc,skew){ctx.save();ctx.translate(x,y);if(skew)ctx.transform(1,0,skew,1,0,0);const k=sc*.5;ctx.drawImage(s.img,-s.ax*k,-s.ay*k,s.w*k,s.h*k);ctx.restore()}
function treeSpr(k,c){return BIO.snowy?null:sprFor(G.biome+'_'+(k==='oak'?'oak':'pine')+'_'+c)}
