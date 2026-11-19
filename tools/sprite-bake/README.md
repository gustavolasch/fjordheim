# Sprite bake

Gera `src/assets/sprites/*.png` a partir dos modelos glTF do pack Stylized Nature MegaKit (Quaternius, CC0).

```
npm i -D three playwright
npx playwright install chromium
node tools/sprite-bake/gen-jobs.mjs   # lista de sprites (cores por bioma)
node tools/sprite-bake/run.mjs        # renderiza e grava PNG + manifest.json
npm run build
```

- Câmera ortográfica iso: yaw 45°, pitch 30° (mesma razão 2:1 de `P()` no jogo).
- Cada sprite tem âncora na base (ponto no chão). `targetH` é a altura em px no jogo, em zoom 1.
- Copas de árvore: a cor do bioma troca só os pixels verdes (matiz), mantendo luminosidade e alpha.
- Pack em outro lugar: `PACK_DIR=/caminho/glTF node tools/sprite-bake/run.mjs`.
