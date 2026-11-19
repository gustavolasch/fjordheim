# Fjordheim — regras do projeto

Jogo de sobrevivência e construção viking, em português do Brasil, jogado no navegador (celular primeiro).
O plano completo de jogabilidade está em `PLANO.md`. Leia só a seção da atualização em andamento.

## Como trabalhar
- Uma atualização do roteiro por vez (veja "Roteiro de atualizações" no PLANO.md).
- Antes de programar, apresente um plano em etapas pequenas e espere aprovação.
- Uma etapa por vez. Ao fim de cada etapa: rode o teste automático por toque, corrija o que quebrar e faça um commit no Git com mensagem clara.
- Nunca mude a jogabilidade que não faz parte da etapa atual.
- Se algo do PLANO.md estiver ambíguo, pergunte antes de decidir.

## Arquitetura (obrigatória)
- **Lógica separada do desenho.** A simulação (mundo, pessoas, coleta, construção, combate, tempo) não sabe se a tela é 2D, 3D ou primeira pessoa. O visual só lê o estado.
- **Dados em tabelas** (arquivos JSON): construções, itens, receitas, comidas, equipamentos, profissões e eras. Equilibrar o jogo deve ser editar números, não código.
- **Posições com altura e direção** (x, y, z e para onde olha) para tudo no mundo, mesmo que o 2D ignore a altura.
- **Grade interna** em toda construção fechada, salva no save desde já (para a futura atualização de interiores).
- **Ações como comandos:** andar, coletar, atacar e construir são pedidos à simulação. Toque hoje e controles de primeira pessoa depois enviam os mesmos comandos.
- **Save com versão e migração.** Nenhuma atualização pode apagar o progresso de quem já joga.
- **Sorteio com semente única**, para o mesmo mapa e os mesmos eventos se repetirem nos testes.

## Teste automático por toque
Ao fim de cada etapa, o teste deve jogar só tocando na tela, num Chromium com tela de celular:
começar do zero, coletar, criar ferramenta, derrubar árvore, construir, guardar no depósito, salvar e carregar.
Também deve checar que não houve erro de JavaScript e que o desempenho continua bom.

## Regras de jogo que não mudam
- O jogador começa sem nada: sem itens, sem moradores, sem construções.
- Cada recurso tem origem física no mundo e quantidade realista (um galho = 1 galho).
- A mochila tem limite de peso; itens pesados exigem depósito.
- Cercas e muros se conectam em 8 direções.
- Interface pensada para celular em pé.

## Gráficos
Por enquanto, o jogo continua em 2D isométrico. O 3D (three.js) só entra depois da versão 1.0.
