// Lista de sprites a gerar. Paletas copiadas de src/js/data/biomes.js (neve fica procedural).
// Se mudar as cores de um bioma, atualize aqui e rode o bake de novo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAL = {
  autumn: { leaves: ['#e0631f', '#f0a020', '#c8401c', '#e8c33a', '#d9541a', '#b8321a'], pines: ['#3f6b3a', '#4b7a3e'], bush: '#c96a2a' },
  forest: { leaves: ['#4f8a34', '#5d9a3c', '#467d2f'], pines: ['#2c6a36', '#357a3d', '#2a5d31'], bush: '#3f7d2e' },
  coast:  { leaves: ['#4e8a36', '#5f9a3f', '#3f7a30'], pines: ['#2f6836', '#3a773d'], bush: '#467f32' },
};
const jobs = [];
for (const [biome, p] of Object.entries(PAL)) {
  for (let c = 0; c < 6; c++) {
    if (p.leaves) jobs.push({ name: `CommonTree_${(c % 5) + 1}`, targetH: 44, out: `${biome}_oak_${c}`, tint: { hue: p.leaves[c % p.leaves.length], lift: 1.35 } });
    jobs.push({ name: `Pine_${(c % 5) + 1}`, targetH: 44, out: `${biome}_pine_${c}`, tint: { hue: p.pines[c % p.pines.length], lift: 1.0 } });
  }
  jobs.push({ name: 'Bush_Common', targetH: 18, out: `${biome}_bush`, tint: { hue: p.bush, lift: 1.2 } });
}
for (let i = 0; i < 3; i++) jobs.push({ name: `Rock_Medium_${i + 1}`, targetH: 14, out: `rock_${i}` });
for (let i = 0; i < 5; i++) jobs.push({ name: `Pebble_Round_${i + 1}`, targetH: 5, out: `pebble_${i}` });
jobs.push({ name: 'Flower_3_Group', targetH: 16, out: 'flower_0' });
jobs.push({ type: 'character', targetH: 21 });
jobs.push({ type: 'export' });
fs.writeFileSync(path.join(HERE, 'jobs.json'), JSON.stringify(jobs, null, 1));
console.log('jobs:', jobs.length);
