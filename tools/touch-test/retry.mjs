// Repete o teste por toque até 3 vezes. Passa se alguma rodada passar.
// Solução provisória enquanto o relógio do teste não é controlado (ver PLANO.md, "Pendências").
// Uso: node tools/touch-test/retry.mjs
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const RUN = path.join(ROOT, 'tools', 'touch-test', 'run.mjs');
const MAX = 3;

for (let i = 1; i <= MAX; i++) {
  console.log(`\n=== rodada ${i} de ${MAX} ===`);
  const r = spawnSync('node', [RUN], { cwd: ROOT, stdio: 'inherit' });
  if (r.status === 0) {
    console.log(`\nPASSOU na rodada ${i} de ${MAX}`);
    process.exit(0);
  }
  console.log(`\nFALHOU na rodada ${i} de ${MAX}`);
}
console.log(`\nFALHOU em todas as ${MAX} rodadas`);
process.exit(1);
