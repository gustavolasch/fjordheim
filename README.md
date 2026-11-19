# Fjordheim — Construa sua vila viking

Jogo em canvas 2D (isométrico), HTML único, sem dependências de runtime.

## Jogar

Abra `dist/fjordheim.html` no navegador (duplo clique). Não precisa de servidor.

## Editar

Edite só a pasta `src/`. `dist/fjordheim.html` é gerado — não edite à mão.

```
src/
  index.html          casca da página (markup do menu e HUD)
  styles/main.css     todo o CSS
  js/
    core/             base: helpers, SVG de ícones
    data/             CONTEÚDO editável (sem lógica)
      biomes.js       cenários: cores, árvores, clima
      buildings.js    construções (BD) e categorias do menu
      resources.js    recursos e peso na mochila
      items.js        ferramentas/armas (ITEMS), trabalhos, guerreiros (WC)
      world.js        nomes de objetos naturais
      people.js       nomes, roupas, cabelos, peles
      palette.js      cores de materiais (C)
      hints.js        dicas contextuais do tutorial
    game/             estado e regras
      state.js        mapa procedural e cores dos tiles
      economy.js      recursos, construções, objetos naturais
      units.js        aldeões, guerreiros, invasores, A*
      player.js       controle do jogador
      fx.js           dicas e partículas
      update.js       passo de simulação (update)
    draw/             desenho no canvas
      primitives.js   box, telhado, bandeira, barril…
      nature.js       árvores, pedras, arbustos
      buildings.js    desenho de cada construção
      figures.js      personagens
      decor.js        objetos de decoração (DECOR)
      render.js       loop de desenho, iluminação, clima
      sprites.js      sprites do pack 3D (árvores, arbustos, pedras, flores)
    ui/               interface
      ghost.js        prévia de construção
      input.js        toque/mouse/teclado, colocar peças
      sheets.js       painéis (Construir, Criar, Mochila, Editar)
      hud.js          barra de recursos e toasts
    system/
      audio.js        sons sintetizados
      save.js         salvar/carregar (localStorage)
      setup.js        novo jogo, menu
      loop.js         laço principal (roda por último)
assets/sprites/       PNGs gerados do pack (ver abaixo) + manifest.json
scripts/build.mjs     junta tudo em dist/fjordheim.html (embute sprites como data URI)
tools/sprite-bake/    gera os sprites a partir dos glTF do pack
Stylized_Nature_MegaKitStandard/  pack original (CC0, Quaternius) — não editar
legacy/               HTML original monolítico (referência, não usado)
```

### Fluxo

```
npm run build        # ou: node scripts/build.mjs
```

O build:
1. monta o JS na ordem de `JS_ORDER` em `scripts/build.mjs`;
2. checa a sintaxe do JS montado (erro aponta o build, não o navegador);
3. grava `dist/fjordheim.html` com CSS e JS embutidos.

### Onde mexer

- **Custo/HP/tempo de uma construção:** `src/js/data/buildings.js` (`BD`).
- **Nova construção:** adicione em `BD`, desenhe em `src/js/draw/buildings.js` (crie `dNome` e ligue no `drawB` (`src/js/draw/buildings.js`)) e, se tiver trabalho, em `economy.js`.
- **Novo objeto de decoração:** `src/js/draw/decor.js` (`DECOR`).
- **Novo bioma:** `src/js/data/biomes.js` e um ramo em `genMap` (`src/js/game/state.js`).
- **Cores:** `src/js/data/palette.js` e `biomes.js`.
- **Novo arquivo JS:** crie-o em `src/js/...` e adicione a `JS_ORDER` no build. A ordem importa para constantes de topo (`const`).

### Notas

- Todos os módulos compartilham um escopo global (como o original). Não use `import`/`export`: o jogo precisa rodar em `file://`.
- Salvamento: chave `fjordheim_save_v2` no localStorage do navegador.

## Arte do pack (Stylized Nature MegaKit, CC0)

Usado (sprites renderizados dos modelos 3D, câmera iso 2:1):
- Árvores de copa (`CommonTree`) no outono e de pinheiro (`Pine`) na floresta e na costa, com matiz trocado pela cor do bioma.
- Arbustos (`Bush_Common`) por bioma. As bagas continuam procedurais, porque são estado de jogo.
- Pedras (`Rock_Medium`) e seixos (`Pebble_Round`).
- Flores de decoração (`Flower_3_Group`).

Mantido procedural, porque não há par coerente no pack:
- Chão: `Grass.png` é um gradiente, sem textura de grama em tile.
- Caminho e cliffs: `PathRocks_Diffuse` e `Rocks_Diffuse` são atlas de pedras, não se encaixam no tile.
- Bioma de neve: o pack não tem visual de neve; árvores, rochas e arbustos seguem procedurais.
- Tufos de grama, troncos, tocos, galhos, construções e a decoração restante.

Regenerar: `npm run bake:sprites` (ver `tools/sprite-bake/README.md`).

## Personagem 3D (viking)

- Modelo: `tools/character/viking-model.js` (three.js, construído por código). Cores iguais ao desenho 2D do jogador.
- Poses: `idle`, `walk` (8 frames), `work` (4 frames, com machado).
- Export de referência: `tools/character/viking.glb` (pose de repouso).
- O jogo usa os frames `pl_*` em `src/assets/sprites`. Gerados por `npm run bake:sprites`.
- Limitação: o machado é o único item na mão. Picareta, martelo e vara ainda aparecem como machado nas poses de trabalho.
- NPCs (aldeões, invasores) continuam no desenho 2D.

## Alcance de interação

Árvores, pedras e itens são coletados a até 0,62 tile do centro do objeto (`src/js/game/player.js`, caso `obj`). Antes o personagem podia ficar até ~1,4 tile de distância.
