/* Ferramentas de trabalho. Armas, armaduras e escudos ficam em data/combate.json (CDATA.itens). */
const ITEMS={
 pick:{n:'Picareta de pedra',ic:'⛏️',cost:{stick:2,stone:3},hand:1,use:'Quebra rochas grandes e minério'},
 hammer:{n:'Martelo',ic:'🔨',cost:{stick:1,stone:2},hand:1,use:'Constrói mais rápido'},
 rod:{n:'Vara de pesca',ic:'🎣',cost:{stick:3,food:1},hand:1,use:'Pesca na beira d’água'},
 sickle:{n:'Foice',ic:'🌾',cost:{stick:1,stone:2},hand:1,use:'Cuida da lavoura mais rápido'},
};
Object.assign(ITEMS,CDATA.itens);
const JOBTOOL={lumber:'axe',miner:'pick',farmer:'sickle',fisher:'rod',smith:'hammer',builder:'hammer'};
const JOBNAME={lumber:'Lenhador',miner:'Mineiro',farmer:'Fazendeiro',fisher:'Pescador',smith:'Ferreiro',builder:'Construtor'};
const WC={
 warrior:{n:'Guerreiro',hp:130,dmg:12,range:1.2,rate:1,speed:1.8,needs:{sword:1,shield:1}},
 archer:{n:'Arqueiro',hp:70,dmg:9,range:5.5,rate:1.5,speed:1.9,ranged:true,needs:{bow:1}}
};
