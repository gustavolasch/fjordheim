// Build: src/ -> dist/fjordheim.html (um arquivo, abre com duplo clique).
// Sem dependências. Node >= 18.
//   node scripts/build.mjs
// Ordem dos módulos JS = ordem desta lista (todos compartilham um único escopo).
// Ao criar um arquivo novo em src/js, adicione-o aqui.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist', 'fjordheim.html');

const JS_ORDER = [
  'js/core/00-base.js',
  'GENERATED:sprites',
  'GENERATED:combate',
  'GENERATED:pessoas',
  'GENERATED:campo',
  'GENERATED:mundo',
  'GENERATED:eras',
  'GENERATED:oficio',
  'GENERATED:icones',
  'js/draw/icons.js',
  'js/data/biomes.js',
  'GENERATED:carrinho',
  'js/data/buildings.js',
  'js/data/resources.js',
  'js/data/items.js',
  'js/data/world.js',
  'js/data/people.js',
  'js/data/palette.js',
  'js/data/hints.js',
  'js/game/state.js',
  'js/game/economy.js',
  'js/game/units.js',
  'js/game/player.js',
  'js/game/fx.js',
  'js/game/update.js',
  'js/game/survival.js',
  'js/game/combat.js',
  'js/game/commands.js',
  'js/game/recruit.js',
  'js/game/moradores.js',
  'js/game/campo.js',
  'js/game/mundo.js',
  'js/game/oficio.js',
  'js/game/carrinho.js',
  'js/draw/sprites.js',
  'js/draw/primitives.js',
  'js/draw/nature.js',
  'js/draw/buildings.js',
  'js/draw/figures.js',
  'js/draw/decor.js',
  'js/draw/render.js',
  'js/ui/ghost.js',
  'js/ui/input.js',
  'js/ui/depmenu.js',
  'js/ui/sheets.js',
  'js/ui/hud.js',
  'js/system/audio.js',
  'js/system/save.js',
  'js/system/transfer.js',
  'vendor/peerjs.min.js',
  'js/system/net.js',
  'js/system/devmode.js',
  'js/system/setup.js',
  'js/system/loop.js',
];

// Versão mostrada no menu: versão do package.json + hash curto do Git (confirma qual build está no celular).
function buildVersion() {
  let hash = 'local';
  try { hash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch {}
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  return `v${pkg.version} · ${hash}`;
}

const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const template = read('index.html');
const css = read('styles/main.css');
// Sprites baked by tools/sprite-bake -> one generated chunk (data URIs, so the HTML stays single-file).
function genSprites() {
  const dir = path.join(SRC, 'assets', 'sprites');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const src = {}, meta = {};
  for (const [k, m] of Object.entries(manifest)) {
    src[k] = 'data:image/png;base64,' + fs.readFileSync(path.join(dir, k + '.png')).toString('base64');
    meta[k] = { w: m.w, h: m.h, ax: m.ax, ay: m.ay };
  }
  return `const SPR_SRC=${JSON.stringify(src)};\nconst SPR_META=${JSON.stringify(meta)};\n`;
}
// Tabelas em JSON (src/data/*.json) viram constantes: combate -> CDATA.
function genJson(name, varName) {
  const obj = JSON.parse(read(path.join('data', name)));
  return `const ${varName}=${JSON.stringify(obj)};\n`;
}
const ORDER = JS_ORDER;
const js = ORDER.map(rel => {
  if (rel === 'GENERATED:sprites') return genSprites();
  if (rel === 'GENERATED:combate') return genJson('combate.json', 'CDATA');
  if (rel === 'GENERATED:carrinho') return genJson('carrinho.json', 'CARRINHO');
  if (rel === 'GENERATED:pessoas') return genJson('pessoas.json', 'PESSOAS');
  if (rel === 'GENERATED:campo') return genJson('campo.json', 'CAMPO');
  if (rel === 'GENERATED:mundo') return genJson('mundo.json', 'MUNDO');
  if (rel === 'GENERATED:eras') return genJson('eras.json', 'ERAS');
  if (rel === 'GENERATED:oficio') return genJson('oficio.json', 'OFICIO');
  if (rel === 'GENERATED:icones') return genJson('icones.json', 'ICONES');
  return read(rel);
}).join('');

// Erro de sintaxe aparece aqui, com o nome do arquivo, antes de gerar o HTML.
try {
  new vm.Script(js, { filename: 'fjordheim.js' });
} catch (err) {
  console.error('Erro de sintaxe no JS montado:', err.message);
  process.exit(1);
}

// Função como replacer: evita que "$&" etc. no código sejam interpretados.
const html = template
  .replace('<!--@css-->\n', () => `<style>\n${css}</style>\n`)
  .replace('<!--@js-->\n', () => `<script>\n${js}</script>\n`)
  .replace('__VER__', () => buildVersion());

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
// Manifesto e ícones (src/pwa/) vão junto do HTML, para o app instalado e para dist/ abrir sem erro.
fs.cpSync(path.join(SRC, 'pwa'), path.dirname(OUT), { recursive: true });
// Ícones WebP vão para dist/icones/ (carregados sob demanda). Os PNG originais ficam fora do build.
fs.cpSync(path.join(SRC, 'icones'), path.join(path.dirname(OUT), 'icones'), { recursive: true, filter: (f) => !/[\\/]png([\\/]|$)/.test(f) && (fs.statSync(f).isDirectory() || f.endsWith('.webp')) });
console.log(`ok: ${path.relative(ROOT, OUT)} (${(html.length / 1024).toFixed(1)} KB, ${ORDER.length} módulos JS)`);
