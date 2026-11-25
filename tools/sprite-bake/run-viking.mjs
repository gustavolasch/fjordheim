// Sprites do jogador (KayKit Barbarian) em 8 direções + folha de prévia.
// Uso: node tools/sprite-bake/run-viking.mjs <pasta de saída dos quadros>   (só prévia)
//      node tools/sprite-bake/run-viking.mjs --install                       (troca os pl_* do jogo)
// A folha vai para tools/receita_viking/folha_sprites.png.
// Requer three e playwright (variáveis CHROME_PATH e NODE_MODULES, como em run.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const NM = process.env.NODE_MODULES || path.join(ROOT, 'node_modules');
const INSTALL = process.argv[2] === '--install';
const OUT = INSTALL ? path.join(ROOT, 'src', 'assets', 'sprites') : process.argv[2];
if (!OUT) { console.error('informe a pasta de saída ou --install'); process.exit(1); }
const TALL = 23, SS = 3; // morador ≈ 19 unidades de altura; 3 pixels por unidade
const ANIMS = [
  { key: 'idle', titulo: 'Parado', clip: 'Idle_A', frames: 4, loop: true },
  { key: 'walk', titulo: 'Andar', clip: 'Walking_A', frames: 8, loop: true, mostra: 2 },
  { key: 'work', titulo: 'Cortar/coletar', clip: process.env.WORK_CLIP || 'Use_Item', frames: 6, loop: false, mostra: 2 },
  { key: 'hit', titulo: 'Levar dano', clip: 'Hit_A', frames: 4, loop: false, mostra: 1 },
];
const { chromium } = await import(pathToFileURL(path.join(NM, 'playwright', 'index.mjs')).href);
const ROOTS = { '/kaykit/': path.join(ROOT, 'src', 'assets', 'kaykit-adventurers'), '/node_modules/': NM, '/': HERE };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.png': 'image/png' };
const b = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
const ctx = await b.newContext();
await ctx.route('http://bake.local/**', async route => {
  const u = decodeURIComponent(new URL(route.request().url()).pathname);
  const [prefix, root] = Object.entries(ROOTS).find(([p]) => u.startsWith(p));
  const f = path.resolve(root, u.slice(prefix.length));
  if (!f.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nf' });
  await route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
});
const p = await ctx.newPage();
p.on('pageerror', e => console.log('[pageerror]', e.message));
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.text()); });
await p.goto('http://bake.local/viking.html');
await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const frames = await p.evaluate(a => window.bakeViking(a), { anims: ANIMS, tall: TALL, ss: SS });
fs.mkdirSync(OUT, { recursive: true });
if (INSTALL) for (const f of fs.readdirSync(OUT)) if (/^pl_.*\.png$/.test(f)) fs.rmSync(path.join(OUT, f));
for (const f of frames) fs.writeFileSync(path.join(OUT, f.name + '.png'), Buffer.from(f.data.split(',')[1], 'base64'));
if (INSTALL) {
  const file = path.join(OUT, 'manifest.json');
  const manifest = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(file, 'utf8'))).filter(([k]) => !k.startsWith('pl_')));
  for (const f of frames) manifest[f.name] = { w: f.w, h: f.h, ax: +f.ax.toFixed(2), ay: +f.ay.toFixed(2) };
  fs.writeFileSync(file, JSON.stringify(manifest, null, 1) + '\n');
}
// Morador desenhado pelo próprio código do jogo, para comparar o tamanho.
const base = fs.readFileSync(path.join(ROOT, 'src/js/core/00-base.js'), 'utf8').split('\n').filter(l => /^function (pp|ln|ell)\(/.test(l)).join('\n');
const fig = fs.readFileSync(path.join(ROOT, 'src/js/draw/figures.js'), 'utf8');
const villagerSrc = `const ctx=g;\n${base}\n${fig.slice(0, fig.indexOf('// Jogador: frame'))}\nreturn (x,y,k,tunic,fem)=>{ctx.save();ctx.translate(x,y);ctx.scale(k,k);drawFigure(0,0,{kind:'villager',tunic,fem,skin:'#e8b890',hair:fem?'#c9a15a':'#5a3a20',face:1,carry:0,swing:0},1);ctx.restore()}`;
const sheet = await p.evaluate(a => window.sheet(a), { frames, anims: ANIMS, ss: SS, villagerSrc });
fs.writeFileSync(path.join(ROOT, 'tools/receita_viking/folha_sprites.png'), Buffer.from(sheet.split(',')[1], 'base64'));
const bytes = frames.reduce((s, f) => s + f.data.length, 0);
console.log(`quadros: ${frames.length} ${frames[0].w}x${frames[0].h} âncora ${frames[0].ax.toFixed(1)},${frames[0].ay.toFixed(1)} base64 ${(bytes / 1024) | 0} KB`);
await b.close();
