// Teste automático por toque (CLAUDE.md). Chromium com tela de celular.
// Só toques na tela (touchscreen.tap) mexem no jogo. O script lê o estado (G, PL…) só para
// escolher onde tocar e para conferir o resultado.
// Relógio controlado: o jogo só avança quando o teste pede quadros (__step). Cada quadro vale 1/60 s
// de jogo, sem relógio real. Assim o mesmo toque cai no mesmo momento do jogo em toda rodada.
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
const STEP_MS = 1000 / 60;          // um quadro = 1/60 s de jogo
const STEP_TIMEOUT = 150_000;       // limite de espera, em tempo de jogo

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
// Math.random determinístico e relógio controlado (antes de qualquer script do jogo).
await context.addInitScript((seed) => {
  let a = seed >>> 0;
  Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // som desligado só no teste: o Chromium headless não tem dispositivo de áudio
  localStorage.setItem('fjordheim_settings_v1', JSON.stringify({ sound: false }));
  window.__realNow = performance.now.bind(performance);
  let fakeNow = 0;
  const queue = [];
  performance.now = () => fakeNow;
  window.requestAnimationFrame = (cb) => { queue.push(cb); return queue.length };
  window.__step = (n) => { for (let i = 0; i < n; i++) { fakeNow += 1000 / 60; const cbs = queue.splice(0); for (const cb of cbs) cb(fakeNow) } };
}, SEED);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

// avança o jogo n quadros (tempo de jogo, não tempo real)
const step = (n = 1) => page.evaluate((n) => __step(n), n);
const stepMs = (ms) => step(Math.max(1, Math.round(ms / STEP_MS)));
// espera uma condição avançando o jogo quadro a quadro; false se não acontecer no limite
async function until(fn, arg, timeoutMs = STEP_TIMEOUT) {
  const maxFrames = Math.round(timeoutMs / STEP_MS);
  for (let f = 0; f <= maxFrames; f += 10) {
    if (await page.evaluate(fn, arg)) return true;
    await step(10);
  }
  return false;
}
const waitFor = async (fn, arg, timeoutMs = STEP_TIMEOUT) => {
  if (!(await until(fn, arg, timeoutMs))) throw new Error('tempo esgotado esperando condição');
  return true;
};
const waitSel = (sel, timeoutMs = 10_000) => until((s) => !!document.querySelector(s), sel, timeoutMs);

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

  // 2. Coletar: pedras e galhos (o mínimo do machado) -> criar ferramenta (machado) -> derrubar árvore -> juntar galhos
  // Alvo que não rende em 25 s de jogo é trocado por outro.
  const failed = [];
  const collect = async (label, cond, targetsOf) => {
    const t0 = await page.evaluate(() => G.t);
    while (!(await page.evaluate(cond))) {
      if ((await page.evaluate(() => G.t)) - t0 > STEP_TIMEOUT / 1000) break; // limite em segundos de jogo
      const target = (await nearestObj(targetsOf, failed)) || (await nearestObj(['pebble', 'branch'], failed));
      if (!target) { failed.length = 0; await step(60); continue }
      const before = await page.evaluate(() => G.inv.stick + G.inv.stone + G.inv.wood);
      await tapTile(target.x, target.y);
      const got = await until((b) => G.inv.stick + G.inv.stone + G.inv.wood > b, before, 25_000);
      if (!got) failed.push(target.x + ',' + target.y);
    }
    if (!(await page.evaluate(cond))) throw new Error('timeout ao ' + label + ' ' + JSON.stringify(await page.evaluate(() => ({ inv: G.inv, items: G.items, failed: 0 }))) + ' falhas ' + failed.join(';'));
  };
  await collect('coletar pedra e galhos', () => G.inv.stone >= 2 && G.inv.stick >= 2, ['pebble', 'branch']);
  ok('coletar pedras e galhos por toque', true);

  // 3. Criar ferramenta (machado) pela aba Criar
  await tapSel('#bar button[data-tab="craft"]');
  await waitSel('#sheet [data-a="craft"][data-v="axe"]:not([disabled])', 10_000);
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
    const fell = await until(() => G.obj.some(o => o && (o.t === 'log' || o.t === 'falling')), null, 60_000);
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
  await waitSel('#sheet [data-a="build"][data-v="stockpile"]', 10_000);
  await tapSel('#sheet [data-a="build"][data-v="stockpile"]');
  await waitSel('#place.open [data-p="ok"]:not([disabled])', 10_000);
  await tapSel('#place [data-p="ok"]');
  await waitFor(() => G.bld.some(b => b.type === 'stockpile'), null, 10_000);
  ok('construir pilha de recursos por toque', true);
  // a obra precisa ser terminada pelo jogador
  await waitFor(() => G.bld.some(b => b.type === 'stockpile' && b.done), null, STEP_TIMEOUT);
  ok('terminar a construção', true);
  await snap('03-construido');

  // 5b. Recrutar (antes de guardar: o material ainda está na mochila): juntar material, construir uma Barraca (4 vagas), esperar um andarilho e convidá-lo
  // atalho de teste (só existe aqui, não no jogo): põe direto na mochila o material da barraca e 2 de comida.
  // A coleta já foi testada nos passos 2 e 4.
  await page.evaluate(() => { G.inv.stick += 10; G.inv.wood += 4; G.inv.food += 2; });
  await tapSel('#bar button[data-tab="build"]');
  await tapSel('#sheet [data-a="cat"][data-v="struct"]'); // Barraca fica em "Estruturas"
  await waitSel('#sheet [data-a="build"][data-v="barraca"]', 10_000);
  await tapSel('#sheet [data-a="build"][data-v="barraca"]');
  await waitSel('#place.open [data-p="ok"]:not([disabled])', 10_000);
  await tapSel('#place [data-p="ok"]');
  await waitFor(() => G.bld.some(b => b.type === 'barraca' && b.done), null, STEP_TIMEOUT);
  // espera o andarilho chegar (fica sozinho: ele passeia perto da praia)
  await waitFor(() => G.units.some(u => u.kind === 'wanderer'), null, STEP_TIMEOUT);
  let recruited = false;
  for (let k = 0; k < 200 && !recruited; k++) {
    const wd = await page.evaluate(() => { const a = G.units.find(u => u.kind === 'wanderer'); if (!a) return null; const [sx, sy] = w2s(a.x, a.y, 9); return { x: a.x, y: a.y, sx, sy, d: Math.hypot(a.x - PL().x, a.y - PL().y) }; });
    if (!wd) { await waitFor(() => G.units.some(u => u.kind === 'wanderer'), null, STEP_TIMEOUT); continue; }
    if (wd.d > 2 || wd.sy < 110 || wd.sy > innerHeight - 200) {
      // andarilho longe ou fora da tela: anda em direção a ele tocando num ponto visível do caminho
      const pl = await page.evaluate(() => ({ x: PL().x, y: PL().y }));
      const dx = wd.x - pl.x, dy = wd.y - pl.y, d = Math.hypot(dx, dy) || 1, k = Math.min(6, Math.max(0, d - 1.5));
      await tapTile(Math.floor(pl.x + dx / d * k), Math.floor(pl.y + dy / d * k));
      await stepMs(1500);
      continue;
    }
    await tap(wd.sx, wd.sy);
    const open = await waitSel('#sheet [data-a="recruit"]:not([disabled])', 4000);
    if (open) { await tapSel('#sheet [data-a="recruit"]'); recruited = await until(() => G.units.some(u => u.kind === 'villager'), null, 10_000); }
  }
  ok('recrutar andarilho por toque', recruited, `moradores ${await page.evaluate(() => popCount())}`);
  await snap('06-morador');

  // 6. Guardar no depósito: toca na pilha e espera o material entrar
  const dep = await page.evaluate(() => { const b = G.bld.find(b => b.type === 'stockpile' && b.done); return { x: b.x, y: b.y, w: b.w, h: b.h }; });
  const sumRes = () => page.evaluate(() => Object.values(G.res).reduce((a, b) => a + b, 0));
  const res0 = await sumRes();
  await tapTile(dep.x + 1, dep.y + 1);
  // tocar no depósito abre o menu: "Guardar tudo"
  await waitSel('#depmenu.open [data-d="guardar"]', 10_000);
  await tapSel('#depmenu [data-d="guardar"]');
  await waitFor((r0) => Object.values(G.res).reduce((a, b) => a + b, 0) > r0, res0, STEP_TIMEOUT);
  ok('guardar no depósito por toque', (await sumRes()) > res0, `guardado ${(await sumRes()) - res0}`);
  await snap('04-deposito');

  // 7. Salvar e carregar
  await tapSel('#bMenu');
  await waitSel('#mSave', 10_000);
  await tapSel('#mSave');
  await waitFor(() => !!localStorage.getItem('fjordheim_save_v2'), null, 10_000);
  const saveVer = await page.evaluate(() => JSON.parse(localStorage.getItem('fjordheim_save_v2')).v);
  ok('salvar jogo por toque', saveVer >= 3, `versão ${saveVer}`);
  const before = await page.evaluate(() => ({ bld: G.bld.length, t: Math.round(G.t), inv: JSON.stringify(G.res) }));
  await page.reload();
  await waitFor(() => document.querySelectorAll('.bcard').length > 0);
  await waitSel('#mLoad', 10_000);
  await tapSel('#mLoad');
  await waitFor(() => document.querySelector('#menu').classList.contains('hidden'));
  await stepMs(500);
  const after = await page.evaluate(() => ({ bld: G.bld.length, t: Math.round(G.t), inv: JSON.stringify(G.res) }));
  ok('carregar jogo por toque', after.bld === before.bld && after.inv === before.inv, `construções ${after.bld}, recursos ${after.inv}`);

  // 8. Erros de JavaScript e desempenho
  await stepMs(1500);
  ok('sem erro de JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));
  // desempenho: quadros de verdade (tempo real) enquanto o jogo roda 3 s de jogo
  const fps = await page.evaluate(() => { const t0 = __realNow(); const f0 = G.t; __step(180); const dt = (__realNow() - t0) / 1000; return 180 / dt; });
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
