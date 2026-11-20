/* cat: struct|walls|fences|floors|doors|store · grp: connection group for wall-like pieces */
// Desmontar um depósito: os itens guardados vão para o outro depósito; devolve esta fração do custo.
const DESMONTAR_DEP=.6;
const BD={
 shelter:{n:'Abrigo',cat:'struct',w:2,h:2,cost:{stick:8,wood:2},hp:150,work:6,wallH:8,desc:'Seu primeiro teto: uma cobertura de galhos com fogueira.'},
 house:{n:'Casa',cat:'struct',w:2,h:2,cost:{wood:10,stone:4},hp:250,house:4,work:16,wallH:14,desc:'Uma casa de verdade, com lareira.'},
 longhouse:{n:'Casa Comunal',cat:'struct',w:3,h:3,cost:{wood:24,stone:12,stick:6},hp:800,house:6,store:100,work:30,wallH:18,desc:'Coração da vila. Guarda 100 de cada recurso.'},
 lumber:{n:'Lenhador',cat:'struct',w:2,h:2,cost:{wood:6,stick:4},hp:200,jobs:2,job:'lumber',work:12,wallH:10,desc:'Posto de trabalho para lenhadores (futuros moradores).'},
 quarry:{n:'Pedreira',cat:'struct',w:2,h:2,cost:{wood:6,stone:2},hp:220,jobs:2,job:'miner',work:12,wallH:10,desc:'Posto de trabalho para mineiros (futuros moradores).'},
 farm:{n:'Fazenda',cat:'struct',w:3,h:3,cost:{stick:6,wood:2},hp:150,jobs:2,job:'farmer',work:10,pass:true,flat:true,desc:'Toque na lavoura para cuidar dela. A colheita dá comida.'},
 dock:{n:'Cais de Pesca',cat:'struct',w:2,h:2,cost:{wood:8},hp:200,jobs:2,job:'fisher',work:12,pass:true,water:true,desc:'Na beira d’água. Toque para pescar daqui.'},
 smithy:{n:'Ferraria',cat:'struct',w:2,h:2,cost:{wood:10,stone:10},hp:300,jobs:1,job:'smith',work:18,wallH:12,desc:'Permite forjar armas com madeira e ferro.'},
 barracks:{n:'Quartel',cat:'struct',w:3,h:2,cost:{wood:16,stone:10},hp:400,work:22,wallH:14,desc:'Treina guerreiros quando houver moradores.'},
 tower:{n:'Torre de Vigia',cat:'struct',w:1,h:1,cost:{wood:8,stone:3},hp:260,work:12,wallH:34,desc:'Atira flechas nos invasores próximos.'},
 wall:{n:'Paliçada',cat:'walls',grp:'wall',w:1,h:1,cost:{wood:1},hp:160,work:2,line:true,wall:true,desc:'Estacas de madeira. Conecta em linha, na diagonal e nos cantos.'},
 stonewall:{n:'Muro de pedra',cat:'walls',grp:'wall',w:1,h:1,cost:{stone:2},hp:260,work:3,line:true,wall:true,desc:'Muro baixo e resistente.'},
 fence:{n:'Cerca de galhos',cat:'fences',grp:'fence',w:1,h:1,cost:{stick:2},hp:60,work:1.5,line:true,wall:true,desc:'Cerca trançada de galhos.'},
 railfence:{n:'Cerca de tábuas',cat:'fences',grp:'fence',w:1,h:1,cost:{wood:1},hp:90,work:2,line:true,wall:true,desc:'Postes e tábuas.'},
 floor:{n:'Piso de madeira',cat:'floors',w:1,h:1,cost:{wood:1},hp:60,work:1,line:true,flat:true,pass:true,desc:'Assoalho de tábuas.'},
 path:{n:'Caminho de pedra',cat:'floors',w:1,h:1,cost:{stone:1},hp:60,work:1,line:true,flat:true,pass:true,desc:'Pedras assentadas no chão.'},
 bridge:{n:'Ponte',cat:'floors',w:1,h:1,cost:{wood:2},hp:120,work:3,line:true,water:true,onlyWater:true,pass:true,desc:'Atravesse rios e lagos.'},
 gate:{n:'Portão',cat:'doors',grp:'wall',w:1,h:1,cost:{wood:3},hp:280,work:4,gate:true,desc:'Encaixa na paliçada. Você passa, invasores não.'},
 fgate:{n:'Porteira',cat:'doors',grp:'fence',w:1,h:1,cost:{stick:3},hp:80,work:2,gate:true,desc:'Encaixa nas cercas.'},
 stonegate:{n:'Portão de pedra',cat:'doors',grp:'wall',w:1,h:1,cost:{stone:4},hp:380,work:5,gate:true,stone:true,desc:'Encaixa no muro de pedra. Você passa, invasores não.'},
 railgate:{n:'Porteira de tábuas',cat:'doors',grp:'fence',w:1,h:1,cost:{wood:2},hp:120,work:3,gate:true,desc:'Encaixa na cerca de tábuas.'},
 cart:{n:'Carrinho de mão',cat:'store',w:1,h:1,cost:CARRINHO.custo,hp:CARRINHO.vida,mobile:true,desc:'Leva a mochila. Toque em Mover para conduzir. Estacionado, guarda a mochila com um toque.'},
 stockpile:{n:'Pilha de recursos',cat:'store',w:2,h:2,cost:{stick:4},hp:80,work:3,flat:true,store:30,desc:'Toque para guardar o que carrega. 30 de cada recurso.'},
 storage:{n:'Armazém',cat:'store',w:2,h:2,cost:{wood:12,stone:4},hp:260,work:14,wallH:12,store:150,desc:'Guarda 150 de cada recurso.'}
};
Object.assign(BD,CDATA.construcoes); // sino e armadilha (data/combate.json)
const BUILD_ORDER=Object.keys(BD);
const CATS=[['struct','Estruturas'],['walls','Muros'],['fences','Cercas'],['floors','Pisos'],['doors','Portas'],['store','Depósitos'],['decor','Decoração']];
