/* ================= Levar o mundo para outro app/aparelho: exportar e importar o save =================
   O arquivo (ou código) é o mesmo JSON do save, com versão; a migração normal vale na importação. */
const SAVE_BACKUP_KEY=SAVE_KEY+'_antes_import';
function textoDoSave(inGame){if(inGame)save(true);try{return localStorage.getItem(SAVE_KEY)}catch(e){return null}}
// devolve a mensagem de erro, ou null se o texto parece um save que este jogo sabe abrir
function erroDoSave(txt){let s;try{s=JSON.parse(txt)}catch(e){return 'Isso não é um mundo do Fjordheim (texto incompleto?).'}
  if(!s||!BIOMES[s.biome]||!Array.isArray(s.tiles)||s.tiles.length!==N*N||!Array.isArray(s.units)||!Array.isArray(s.bld)||!s.res)return 'Isso não é um mundo do Fjordheim (texto incompleto?).';
  if((s.v||3)>SAVE_VER)return 'Este mundo é de uma versão mais nova do jogo. Atualize antes de importar.';
  return null}
async function exportarArquivo(txt,msg){const nome='fjordheim-mundo.json';
  try{const f=new File([txt],nome,{type:'application/json'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});msg('Arquivo enviado. Guarde em "Arquivos".');return}}
  catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);msg('Arquivo baixado: '+nome)}
async function copiarCodigo(txt,msg,area){
  try{await navigator.clipboard.writeText(txt);msg('Código copiado. No novo app, cole no campo e toque em "Importar código".')}
  catch(e){area.value=txt;area.focus();area.select();msg('Não consegui copiar sozinho. Selecione todo o texto do campo e copie.')}}
function importarMundo(txt,msg){txt=(txt||'').trim();const erro=erroDoSave(txt);if(erro){msg(erro);return false}
  if(hasSave()&&!confirm('Importar substitui o mundo salvo neste app. Continuar?'))return false;
  let antes=null;
  try{antes=localStorage.getItem(SAVE_KEY);if(antes)localStorage.setItem(SAVE_BACKUP_KEY,antes);localStorage.setItem(SAVE_KEY,txt)}
  catch(e){msg('Não foi possível gravar neste aparelho.');return false}
  try{if(!load())throw new Error('load')}
  catch(e){if(antes)localStorage.setItem(SAVE_KEY,antes);else localStorage.removeItem(SAVE_KEY);alert('Não foi possível abrir esse mundo. O mundo anterior foi mantido.');location.reload();return false}
  closeMenu();toast('🧳 Mundo importado','good');return true}
// painel dentro do menu
function ligaTransfer(inGame){const box=$('#transfer');box.classList.add('hidden');
  const msg=t=>{$('#trMsg').textContent=t};msg('');$('#trText').value='';
  const comSave=inGame||hasSave();for(const id of ['trFile','trCopy'])$('#'+id).disabled=!comSave;
  $('#mTransfer').onclick=()=>box.classList.toggle('hidden');
  $('#trFile').onclick=()=>{const t=textoDoSave(inGame);if(t)exportarArquivo(t,msg)};
  $('#trCopy').onclick=()=>{const t=textoDoSave(inGame);if(t)copiarCodigo(t,msg,$('#trText'))};
  $('#trPick').onclick=()=>$('#trInput').click();
  $('#trInput').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(f)importarMundo(await f.text(),msg)};
  $('#trPaste').onclick=()=>importarMundo($('#trText').value,msg)}
