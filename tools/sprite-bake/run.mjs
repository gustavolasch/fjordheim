// Renderiza os modelos glTF do pack em PNGs iso (2:1) para src/assets/sprites.
// Uso: node tools/sprite-bake/gen-jobs.mjs && node tools/sprite-bake/run.mjs
// Requer: npm i -D three playwright && npx playwright install chromium
// Variáveis: PACK_DIR (pasta glTF do pack), NODE_MODULES (onde estão three e playwright).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const PACK = process.env.PACK_DIR || path.join(ROOT, 'Stylized_Nature_MegaKitStandard', 'glTF');
const NM = process.env.NODE_MODULES || path.join(ROOT, 'node_modules');
const OUT = path.join(ROOT, 'src', 'assets', 'sprites');
const { chromium } = await import(pathToFileURL(path.join(NM, 'playwright', 'index.mjs')).href);
const ROOTS = { '/pack/': PACK, '/node_modules/': NM, '/character/': path.join(HERE, '..', 'character'), '/': HERE };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg' };
// Só serve as três pastas acima, em memória (sem porta aberta).
function resolveUrl(url) {
  const u = decodeURIComponent(new URL(url).pathname);
  for (const [prefix, root] of Object.entries(ROOTS)) {
    if (!u.startsWith(prefix)) continue;
    const f = path.resolve(root, u.slice(prefix.length));
    if (f.startsWith(path.resolve(root) + path.sep)) return f;
  }
  return null;
}
const JOBS = JSON.parse(fs.readFileSync(path.join(HERE, 'jobs.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
const ctx = await b.newContext({ viewport: { width: 800, height: 800 } });
await ctx.route('http://bake.local/**', async route => {
  const f = resolveUrl(route.request().url());
  if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: 'nf' });
  await route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
});
const p = await ctx.newPage();
p.on('pageerror', e => console.log('[pageerror]', e.message));
await p.goto('http://bake.local/bake.html');
await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const manifest = {};
for (const job of JOBS) {
  if (job.type === 'character') {
    const frames = await p.evaluate(j => window.bakeCharacter(j), job);
    for (const f of frames) {
      fs.writeFileSync(path.join(OUT, `${f.name}.png`), Buffer.from(f.data.split(',')[1], 'base64'));
      manifest[f.name] = { w: f.w, h: f.h, ax: +f.ax.toFixed(2), ay: +f.ay.toFixed(2) };
      console.log('ok', f.name, `${f.w}x${f.h}`);
    }
    continue;
  }
  if (job.type === 'views') {
    const views = await p.evaluate(j => window.bakeViews(j), job);
    fs.mkdirSync(job.dir, { recursive: true });
    views.forEach((v, i) => fs.writeFileSync(path.join(job.dir, `view_${i}.png`), Buffer.from(v.data.split(',')[1], 'base64')));
    console.log('views', views.length);
    continue;
  }
  if (job.type === 'export') {
    const bytes = await p.evaluate(() => window.exportViking());
    fs.writeFileSync(path.join(HERE, '..', 'character', 'viking.glb'), Buffer.from(bytes));
    console.log('ok viking.glb', bytes.length, 'bytes');
    continue;
  }
  const r = await p.evaluate(j => window.bake(j), job);
  fs.writeFileSync(path.join(OUT, `${job.out}.png`), Buffer.from(r.data.split(',')[1], 'base64'));
  manifest[job.out] = { w: r.w, h: r.h, ax: +r.ax.toFixed(2), ay: +r.ay.toFixed(2) };
  console.log('ok', job.out, `${r.w}x${r.h}`);
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
await b.close();
console.log('sprites:', JOBS.length);
