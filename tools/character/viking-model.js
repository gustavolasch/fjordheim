// Personagem 3D do jogo, modelado a partir das fotos de referência em
// src/assets/sprites/personagem (personagem_01..08, turnaround).
// Estilo blocky: jaqueta azul com capuz, calça marrom, botas pretas, cabelo loiro, botões brancos.
// Origem = chão entre os pés (y=0). Frente = +Z. Altura total ≈ 1.8.
// Uso: const { root, j } = buildViking(THREE); applyPose(j, 'walk', 0.25);

export const COL = { jacket: '#2f6aa8', jacketDark: '#245488', pants: '#6e4a2d', boot: '#22201e', skin: '#f1c9a0', hair: '#dcb96e', eye: '#2a1d14', button: '#e8e8e8', wood: '#6b4423', steel: '#a9a49a' };

const HIP = .8; // altura do quadril (pivô das pernas)

export function buildViking(THREE) {
  const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .8, metalness: 0 });
  const grp = (parent, x = 0, y = 0, z = 0, name) => { const g = new THREE.Group(); g.position.set(x, y, z); if (name) g.name = name; parent.add(g); return g; };
  const box = (parent, w, h, d, col, x = 0, y = 0, z = 0, name) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(col)); m.position.set(x, y, z); if (name) m.name = name; parent.add(m); return m; };

  const root = grp(new THREE.Group(), 0, 0, 0, 'viking');
  const pelvis = grp(root, 0, HIP, 0, 'pelvis');

  // pernas: calça marrom + bota preta
  const legL = grp(pelvis, -.11, 0, 0, 'legL'), legR = grp(pelvis, .11, 0, 0, 'legR');
  for (const L of [legL, legR]) { box(L, .15, .7, .17, COL.pants, 0, -.35, 0); box(L, .16, .1, .21, COL.boot, 0, -.75, .02); }

  // tronco: jaqueta (spine gira e respira)
  const spine = grp(pelvis, 0, 0, 0, 'spine');
  box(spine, .44, .46, .3, COL.jacket, 0, .23, 0, 'torso');
  box(spine, .04, .04, .02, COL.button, 0, .2, .156);
  box(spine, .04, .04, .02, COL.button, 0, .32, .156);
  box(spine, .36, .2, .22, COL.jacketDark, 0, .5, -.12, 'hood');          // capuz nas costas

  // cabeça: bloco grande, cabelo loiro em cima e franja
  const head = grp(spine, 0, .6, 0, 'head');
  box(head, .36, .39, .34, COL.skin, 0, .195, 0, 'face');
  box(head, .38, .1, .36, COL.hair, 0, .36, 0, 'hairTop');
  box(head, .38, .06, .05, COL.hair, 0, .31, .17, 'fringe');
  for (const sx of [-1, 1]) box(head, .05, .05, .02, COL.eye, sx * .09, .21, .172);

  // braços: manga da jaqueta + mão de pele (pivô no ombro)
  const armL = grp(spine, -.24, .42, 0, 'armL'), armR = grp(spine, .24, .42, 0, 'armR');
  for (const A of [armL, armR]) { box(A, .12, .46, .14, COL.jacket, 0, -.23, 0); box(A, .12, .12, .12, COL.skin, 0, -.52, 0, 'hand'); }
  armL.rotation.z = .08; armR.rotation.z = -.08;

  // machado na mão direita (só nas poses de trabalho)
  const axe = grp(armR, 0, -.52, .04, 'axe');
  box(axe, .025, .55, .025, COL.wood, 0, .25, 0);
  box(axe, .04, .14, .1, COL.steel, 0, .5, .03);
  axe.visible = false;

  return { root, j: { root, pelvis, spine, head, legL, legR, armL, armR, axe } };
}

// keyframes lineares em t∈[0,1]
function key(t, frames) {
  for (let i = 0; i < frames.length - 1; i++) {
    const [t0, v0] = frames[i], [t1, v1] = frames[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * ((t - t0) / (t1 - t0 || 1));
  }
  return frames[frames.length - 1][1];
}

function reset(j) {
  j.pelvis.position.y = HIP; j.spine.rotation.set(0, 0, 0); j.head.rotation.set(0, 0, 0);
  j.legL.rotation.set(0, 0, 0); j.legR.rotation.set(0, 0, 0);
  j.armL.rotation.set(0, 0, .08); j.armR.rotation.set(0, 0, -.08); j.axe.visible = false;
}

// pose: 'idle' | 'walk' | 'work' ; t: fase do ciclo em [0,1)
export function applyPose(j, pose, t = 0) {
  reset(j);
  const s = Math.sin(2 * Math.PI * t);
  if (pose === 'idle') {
    j.pelvis.position.y = HIP + .004 * s;
    j.armL.rotation.z = .08 + .03 * s; j.armR.rotation.z = -.08 - .03 * s;
  } else if (pose === 'walk') {
    j.legL.rotation.x = .6 * s; j.legR.rotation.x = -.6 * s;
    j.armL.rotation.x = -.5 * s; j.armR.rotation.x = .5 * s;
    j.pelvis.position.y = HIP + .03 * Math.abs(Math.cos(2 * Math.PI * t));
  } else if (pose === 'work') {
    j.armR.rotation.x = key(t, [[0, -2.4], [.18, -.6], [.36, 1.25], [.7, 1.25], [1, -2.4]]);
    j.spine.rotation.y = key(t, [[0, -.35], [.36, .3], [1, -.35]]);
    j.armL.rotation.x = -.35; j.legL.rotation.x = .12; j.legR.rotation.x = -.12;
    j.axe.visible = true;
  }
}

// frames do sprite sheet: nome -> [pose, t]
export const FRAMES = {
  pl_idle_0: ['idle', 0], pl_idle_1: ['idle', .5],
  ...Object.fromEntries([...Array(8)].map((_, i) => [`pl_walk_${i}`, ['walk', i / 8]])),
  ...Object.fromEntries([[0, 0], [1, .18], [2, .36], [3, .7]].map(([i, t]) => [`pl_work_${i}`, ['work', t]])),
};
