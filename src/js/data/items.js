const ITEMS={
 axe:{n:'Machado de pedra',ic:'🪓',cost:{stick:2,stone:2},hand:1,use:'Derruba árvores'},
 pick:{n:'Picareta de pedra',ic:'⛏️',cost:{stick:2,stone:3},hand:1,use:'Quebra rochas grandes e minério'},
 hammer:{n:'Martelo',ic:'🔨',cost:{stick:1,stone:2},hand:1,use:'Constrói mais rápido'},
 rod:{n:'Vara de pesca',ic:'🎣',cost:{stick:3,food:1},hand:1,use:'Pesca na beira d’água'},
 sickle:{n:'Foice',ic:'🌾',cost:{stick:1,stone:2},hand:1,use:'Cuida da lavoura mais rápido'},
 sword:{n:'Espada',ic:'🗡️',cost:{wood:1,iron:3},use:'Arma de guerreiro'},
 shield:{n:'Escudo',ic:'🛡️',cost:{wood:3,iron:1},use:'Defesa de guerreiro'},
 spear:{n:'Lança',ic:'🔱',cost:{stick:2,wood:1,iron:1},use:'Arma de lanceiro'},
 bow:{n:'Arco',ic:'🏹',cost:{stick:3,wood:1},use:'Arma de arqueiro'}
};
const JOBTOOL={lumber:'axe',miner:'pick',farmer:'sickle',fisher:'rod',smith:'hammer',builder:'hammer'};
const JOBNAME={lumber:'Lenhador',miner:'Mineiro',farmer:'Fazendeiro',fisher:'Pescador',smith:'Ferreiro',builder:'Construtor'};
const WC={
 warrior:{n:'Guerreiro',hp:130,dmg:12,range:1.2,rate:1,speed:1.8,needs:{sword:1,shield:1}},
 spear:{n:'Lanceiro',hp:100,dmg:15,range:1.7,rate:1.2,speed:1.8,needs:{spear:1}},
 archer:{n:'Arqueiro',hp:70,dmg:9,range:5.5,rate:1.5,speed:1.9,ranged:true,needs:{bow:1}}
};
