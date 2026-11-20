// Teste automático por toque (CLAUDE.md). Chromium com tela de celular.
// Só toques na tela (touchscreen.tap) mexem no jogo. O script lê o estado (G, PL…) só para
// escolher onde tocar e para conferir o resultado.
// Uso: node tools/touch-test/run.mjs   (faz o build antes)
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HTML = path.join(ROOT, 'dist', 'fjordheim.html');
const SHOTS = path.join(os.tmpdir(), 'fjordheim-touch');
const SEED = 20260;                 // semente fixa: mesmo mapa e mesma sorte em todo teste
const STEP_TIMEOUT = 150_000;

const results = [];
const log = (msg) => console.log(msg);
function ok(name, cond, extra = '') {
  results.push({ name, pass: !!cond, extra });
  console.log(`${cond ? 'PASSOU' : 'FALHOU'}  ${name}${extra ? '  — ' + extra : ''}`);
}

execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
fs.mkdirSync(SHOTS, { recursive: true });

// Usa o Google Chrome instalado (channel chrome). Sem ele, troque por chromium.launch().
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, // celular em pé
  deviceScaleFactor: 2, hasTouch: true, isMobile: true,
});
// Math.random determinístico: o mesmo mapa e os mesmos eventos em toda rodada.
await context.addInitScript((seed) => {
  let a = seed >>> 0;
  Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}, SEED);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

const tap = async (x, y) => page.touchscreen.tap(Math.round(x), Math.round(y));
const tapTile = async (x, y) => {
  const q = await page.evaluate(([x, y]) => { const s = w2s(x + .5, y + .5); return s; }, [x, y]);
  await tap(q[0], q[1]);
};
const tapSel = async (sel) => {
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded().catch(() => {}); // faixa de categorias rola na horizontal
  const bb = await el.boundingBox();
  if (!bb) throw new Error('não achei ' + sel);
  await tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
};
const waitFor = (fn, arg, timeout = STEP_TIMEOUT) => page.waitForFunction(fn, arg, { timeout, polling: 200 });
// objetos mais próximos (ordenados), sem os que já falharam nesta etapa
const nearestObjs = (types, skip = []) => page.evaluate(([types, skip]) => {
  const p = PL(), out = [];
  for (let i = 0; i < N * N; i++) {
    const o = G.obj[i]; if (!o || !types.includes(o.t)) continue;
    if (o.t === 'tree' && o.g < .7) continue;
    const x = i % N, y = (i / N) | 0;
    // só alvos tocáveis: fora da faixa de cima (HUD) e de baixo (barra de abas e de necessidades)
    const [sx, sy] = w2s(x + .5, y + .5);
    if (sy < 110 || sy > innerHeight - 200 || sx < 10 || sx > innerWidth - 10) continue;
    if (skip.includes(x + ',' + y)) continue;
    out.push({ x, y, t: o.t, d: Math.hypot(x + .5 - p.x, y + .5 - p.y) });
  }
  return out.sort((a, b) => a.d - b.d).slice(0, 12);
}, [types, skip]);
const nearestObj = async (types, skip = []) => (await nearestObjs(types, skip))[0] || null;
const snap = (name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });

try {
  // 1. Começar do zero: menu -> escolher cenário
  await page.goto(pathToFileURL(HTML).href);
  await waitFor(() => document.querySelectorAll('.bcard').length > 0);
  await tapSel('.bcard');
  await waitFor(() => !document.querySelector('#menu') || document.querySelector('#menu').classList.contains('hidden'));
  const started = await page.evaluate(() => !!G && !G.demo && !!PL());
  ok('começar do zero por toque', started);

  // 2. Coletar: pedras e galhos (o mínimo do machado) -> criar machado -> derrubar árvore -> juntar galhos
  // Alvo que não rende em 25 s (fora de alcance, por exemplo) é trocado por outro.
  const failed = [];
  const collect = async (label, cond, targetsOf) => {
    const t0 = Date.now();
    while (!(await page.evaluate(cond))) {
      if (Date.now() - t0 > STEP_TIMEOUT) throw new Error('timeout ao ' + label + ' ' + JSON.stringify(await page.evaluate(() => ({ inv: G.inv, items: G.items, bag: bagW(), pl: [PL().x, PL().y], order: PL().order, act: PL().act && PL().act.type, failed: 0 }))) + ' falhas ' + failed.join(';'));
      const target = (await nearestObj(targetsOf, failed)) || (await nearestObj(['pebble', 'branch'], failed));
      if (!target) { failed.length = 0; await page.waitForTimeout(1000); continue }
      const before = await page.evaluate(() => G.inv.stick + G.inv.stone + G.inv.wood);
      await tapTile(target.x, target.y);
      const got = await page.waitForFunction((b) => G.inv.stick + G.inv.stone + G.inv.wood > b, before, { timeout: 25_000, polling: 200 }).then(() => true).catch(() => false);
      if (!got) failed.push(target.x + ',' + target.y);
    }
  };
  await collect('coletar pedra e galhos', () => G.inv.stone >= 2 && G.inv.stick >= 2, ['pebble', 'branch']);
  ok('coletar pedras e galhos por toque', true);

  // 3. Criar ferramenta (machado) pela aba Criar
  await tapSel('#bar button[data-tab="craft"]');
  await page.waitForSelector('#sheet [data-a="craft"][data-v="axe"]:not([disabled])', { timeout: 10_000 });
  await tapSel('#sheet [data-a="craft"][data-v="axe"]');
  await waitFor(() => G.items.axe > 0, null, 10_000);
  ok('criar machado de pedra por toque', true);
  await tapSel('#sheet [data-a="close"]');

  // 4. Derrubar uma árvore e pegar as toras que caem
  // toca em árvores até uma cair (árvore fora de alcance é trocada por outra)
  const treeFails = [];
  for (let k = 0; k < 6; k++) {
    const tree = await nearestObj(['tree'], treeFails);
    if (!tree) throw new Error('sem árvore perto do início');
    await tapTile(tree.x, tree.y);
    const fell = await page.waitForFunction(() => G.obj.some(o => o && (o.t === 'log' || o.t === 'falling')), null, { timeout: 60_000, polling: 200 }).then(() => true).catch(() => false);
    if (fell) break;
    treeFails.push(tree.x + ',' + tree.y);
  }
  await waitFor(() => G.obj.some(o => o && o.t === 'log'), null, 60_000);
  const log = await nearestObj(['log']);
  await tapTile(log.x, log.y);
  await waitFor(() => G.inv.wood + G.res.wood > 0, null, 60_000);
  ok('derrubar árvore por toque', true);
  // juntar galhos até o depósito (4) mais a construção
  await collect('juntar galhos', () => G.inv.stick >= 4, ['branch']);

  await snap('02-arvore');

  // 5. Construir: Pilha de recursos (depósito) na aba Construir
  await tapSel('#bar button[data-tab="build"]');
  await tapSel('#sheet [data-a="cat"][data-v="store"]'); // Pilha fica na categoria "Depósitos"
  await page.waitForSelector('#sheet [data-a="build"][data-v="stockpile"]', { timeout: 10_000 });
  await tapSel('#sheet [data-a="build"][data-v="stockpile"]');
  await page.waitForSelector('#place.open [data-p="ok"]:not([disabled])', { timeout: 10_000 });
  await tapSel('#place [data-p="ok"]');
  await waitFor(() => G.bld.some(b => b.type === 'stockpile'), null, 10_000);
  ok('construir pilha de recursos por toque', true);
  // a obra precisa ser terminada pelo jogador
  await waitFor(() => G.bld.some(b => b.type === 'stockpile' && b.done), null, STEP_TIMEOUT);
  ok('terminar a construção', true);
  await snap('03-construido');

  // 6. Guardar no depósito: toca na pilha e espera o material entrar
  const dep = await page.evaluate(() => { const b = G.bld.find(b => b.type === 'stockpile' && b.done); return { x: b.x, y: b.y, w: b.w, h: b.h }; });
  const sumRes = () => page.evaluate(() => Object.values(G.res).reduce((a, b) => a + b, 0));
  const res0 = await sumRes();
  await tapTile(dep.x + 1, dep.y + 1);
  // tocar no depósito abre o menu: "Guardar tudo"
  await page.waitForSelector('#depmenu.open [data-d="guardar"]', { timeout: 10_000 });
  await tapSel('#depmenu [data-d="guardar"]');
  await waitFor((r0) => Object.values(G.res).reduce((a, b) => a + b, 0) > r0, res0, STEP_TIMEOUT);
  ok('guardar no depósito por toque', (await sumRes()) > res0, `guardado ${(await sumRes()) - res0}`);
  await snap('04-deposito');

  // 7. Salvar e carregar
  const before = await page.evaluate(() => ({ bld: G.bld.length, t: Math.round(G.t), inv: JSON.stringify(G.res) }));
  await tapSel('#bMenu');
  await page.waitForSelector('#mSave', { timeout: 10_000 });
  await tapSel('#mSave');
  await waitFor(() => !!localStorage.getItem('fjordheim_save_v2'), null, 10_000);
  const saveVer = await page.evaluate(() => JSON.parse(localStorage.getItem('fjordheim_save_v2')).v);
  ok('salvar jogo por toque', saveVer >= 3, `versão ${saveVer}`);
  await page.reload();
  await waitFor(() => document.querySelectorAll('.bcard').length > 0);
  await page.waitForSelector('#mLoad', { timeout: 10_000 });
  await tapSel('#mLoad');
  await waitFor(() => !document.querySelector('#menu').classList.contains('hidden') === false);
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({ bld: G.bld.length, t: Math.round(G.t), inv: JSON.stringify(G.res) }));
  ok('carregar jogo por toque', after.bld === before.bld && after.inv === before.inv, `construções ${after.bld}, recursos ${after.inv}`);

  // 8. Erros de JavaScript e desempenho
  await page.waitForTimeout(1500);
  ok('sem erro de JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));
  const fps = await page.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n / 3) }; requestAnimationFrame(f);
  }));
  ok('desempenho (quadros por segundo ≥ 20 em Chromium headless)', fps >= 20, `${fps.toFixed(1)} fps`);
  await snap('05-final');
} catch (err) {
  ok('roteiro completo sem exceção', false, err.message);
  await snap('erro');
} finally {
  await browser.close();
}

const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passos ok · capturas em ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
