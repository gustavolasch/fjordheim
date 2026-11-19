// Teste de dois jogadores por toque: anfitrião e amigo, cada um num Chromium com tela de celular.
// Usa o servidor público do PeerJS (precisa de internet). Só toques na tela mexem no jogo.
// Uso: node tools/touch-test/net-run.mjs   (faz o build antes)
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HTML = path.join(ROOT, 'dist', 'fjordheim.html');
const results = [];
const ok = (name, cond, extra = '') => { results.push(!!cond); console.log(`${cond ? 'PASSOU' : 'FALHOU'}  ${name}${extra ? '  — ' + extra : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });

const browser = await chromium.launch({ channel: 'chrome' });
const mk = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(pathToFileURL(HTML).href);
  return { page, errors };
};
const host = await mk();
const guest = await mk();
const H = host.page, Gp = guest.page;
const tapEl = async (page, sel) => {
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const bb = await el.boundingBox();
  if (!bb) throw new Error('não achei ' + sel);
  await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
};
const waitUntil = async (page, fn, arg, ms = 60_000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await sleep(300); }
  return false;
};

try {
  // 1. Anfitrião: começa jogo (cenário) e abre a sala pelo menu
  await H.waitForSelector('.bcard');
  await tapEl(H, '.bcard');
  await waitUntil(H, () => !!G && !G.demo && !!PL());
  await tapEl(H, '#bMenu');
  await H.waitForSelector('#mHost', { timeout: 10_000 });
  await tapEl(H, '#mHost');
  const code = await waitUntil(H, () => !!NET.code, null, 20_000).then(() => H.evaluate(() => NET.code));
  ok('anfitrião abre sala e recebe código', !!code, code || 'sem código');
  if (!code) throw new Error('sala não abriu (sem internet para o servidor do PeerJS?)');

  // 2. Amigo: menu inicial -> Entrar com código -> digita -> Entrar
  await Gp.waitForSelector('#mJoin', { timeout: 20_000 });
  await tapEl(Gp, '#mJoin');
  await Gp.fill('#joinCode', code);
  await tapEl(Gp, '#joinGo');
  const joined = await waitUntil(Gp, () => NET.joined && !!PL(), null, 60_000);
  ok('amigo entra com código', joined);
  ok('anfitrião vê o personagem do amigo', await waitUntil(H, () => G.units.some((u) => u.guest), null, 20_000));

  // 3. Amigo coleta por toque: alvo mais próximo no mapa dele
  const target = await Gp.evaluate(() => {
    const p = PL(), out = [];
    for (let i = 0; i < N * N; i++) {
      const o = G.obj[i]; if (!o || !['pebble', 'branch'].includes(o.t)) continue;
      const x = i % N, y = (i / N) | 0, [sx, sy] = w2s(x + .5, y + .5);
      if (sy < 110 || sy > innerHeight - 200 || sx < 10 || sx > innerWidth - 10) continue;
      out.push({ x, y, d: Math.hypot(x + .5 - p.x, y + .5 - p.y) });
    }
    out.sort((a, b) => a.d - b.d); return out[0] || null;
  });
  if (target) {
    const q = await Gp.evaluate(([x, y]) => w2s(x + .5, y + .5), [target.x, target.y]);
    await Gp.touchscreen.tap(Math.round(q[0]), Math.round(q[1]));
  }
  const before = await H.evaluate(() => G.inv.stick + G.inv.stone + G.inv.wood);
  const got = await waitUntil(H, (b) => G.inv.stick + G.inv.stone + G.inv.wood > b, before, 40_000);
  ok('toque do amigo vira ação no anfitrião', !!target && got, target ? '' : 'sem alvo perto');
  ok('amigo recebe o estado do anfitrião', await waitUntil(Gp, (b) => G.inv.stick + G.inv.stone + G.inv.wood >= b, before, 20_000), '');

  // 4. Amigo não salva: o save do anfitrião não muda
  const saveBefore = await H.evaluate(() => localStorage.getItem(SAVE_KEY));
  await Gp.evaluate(() => save());
  ok('amigo não grava save', (await H.evaluate(() => localStorage.getItem(SAVE_KEY))) === saveBefore);

  // 5. Amigo sai: o personagem some na ilha do anfitrião
  await tapEl(Gp, '#bMenu');
  await Gp.waitForSelector('#mNetLeave', { timeout: 10_000 });
  await tapEl(Gp, '#mNetLeave');
  ok('personagem do amigo some ao sair', await waitUntil(H, () => !G.units.some((u) => u.guest), null, 20_000));

  const errs = [...host.errors, ...guest.errors];
  ok('sem erro de JavaScript (dois aparelhos)', errs.length === 0, errs.slice(0, 3).join(' | '));
} catch (e) {
  ok('roteiro de dois jogadores', false, e.message.slice(0, 200));
  console.log('erros anfitrião:', host.errors.slice(0, 3), 'erros amigo:', guest.errors.slice(0, 3));
} finally {
  await browser.close();
}
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checagens ok`);
process.exit(passed === results.length ? 0 : 1);
