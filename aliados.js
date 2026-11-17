'use strict';
/* ============================================================
   ALIADOS E PETS — companheiros que lutam ao seu lado.
   • Você pode ter até MAX_ALIADOS companheiros ao mesmo tempo.
   • Cada um dá bônus passivos (mods), tem uma ação própria em combate
     (acao) e conta nas etiquetas das sinergias (tags).
   • Eles têm vida, podem desmaiar (voltam depois do combate) e ficam
     mais fortes a cada vitória que vivem com você (vínculo → nível).
   Para criar um companheiro novo: copie um item de ALIADOS e crie um
   evento que chame fx.aliado('id-dele').
   ============================================================ */

const MAX_ALIADOS = 2;
const LIMIARES_VINCULO = [3, 7, 12, 18];   // vitórias para chegar aos níveis 2, 3, 4 e 5

/* acao.tipo:  ataque (todo turno) | sopro (queima o inimigo a cada N turnos) | escudo (a cada N turnos)
               cura (a cada N turnos) | protege (chance de atravessar um golpe; ataca fraquinho)
   hp: multiplicador de vida   chama: chance de o inimigo atacar ELE em vez de você */
const ALIADOS = {
  caramelo: { nome: 'Caramelo', icone: '🐕', pet: true, hp: 1.0, chama: 0.3, acao: { tipo: 'ataque', mult: 0.8 }, mods: { esq: 3, sor: 1 }, tags: ['familia'],
    desc: 'Vira-lata de orelha caída. Morde calcanhares e atrai a atenção dos inimigos.', verbo: 'morde', falas: ['Au au! (tradução: me dá pastel)'] },
  dragaozinho: { nome: 'Dragãozinho Pão de Queijo', icone: '🐲', pet: true, hp: 0.8, acao: { tipo: 'sopro', cada: 3, mult: 1.0 }, mods: { int: 1 }, tags: ['fogo'],
    desc: 'Cospe fogo a cada 3 turnos (queima o inimigo). No resto do tempo, dá umas mordidinhas.', verbo: 'dá uma mordidinha em', falas: ['Prrrrr… *espirra faísca*'] },
  pedro: { nome: 'Pedro Henrique, o Goblin Mercenário', icone: '👺', hp: 1.3, acao: { tipo: 'ataque', mult: 1.15 }, mods: { for: 1 }, tags: ['ouro'],
    desc: 'Estagiário de mercenário. Ataca com força e cobra caro, mas já pagou.', verbo: 'golpeia', falas: ['Isso não estava no contrato!'] },
  genivaldo: { nome: 'Seu Genivaldo, o Gnomo', icone: '🧙‍♂️', hp: 0.9, acao: { tipo: 'escudo', cada: 3, mult: 1.0 }, mods: { int: 1, en: 2 }, tags: ['arcano'],
    desc: 'Conjura um escudo mágico em você a cada 3 turnos. Ainda procura o gorro.', verbo: 'cutuca', falas: ['Abracadabra do gorro!'] },
  gato: { nome: 'Gato de Botas Usadas', icone: '🐱', pet: true, hp: 0.8, acao: { tipo: 'ataque', mult: 0.75, critMin: 17 }, mods: { des: 1, crit: 4 }, tags: ['sombra'],
    desc: 'Arranha rápido e acerta críticos com facilidade (17–20).', verbo: 'arranha', falas: ['Miau. (Eu estava só olhando.)'] },
  camaradinha: { nome: 'Camaradinha, o Aluno Fantasma', icone: '👻', hp: 0.7, acao: { tipo: 'protege', chance: 0.25, mult: 0.45 }, mods: { esq: 4 }, tags: ['sombra'],
    desc: '25% de chance de atravessar um golpe que iria te acertar. Atacar, ataca fraquinho.', verbo: 'assusta', falas: ['Entreguei o trabalho! (ou quase)'] },
  zelia: { nome: 'Tia Zélia do Coral', icone: '🧓', hp: 1.0, acao: { tipo: 'cura', cada: 3, pct: 0.08 }, mods: { vit: 1 }, tags: ['sagrado'],
    desc: 'Reza por você: cura 8% da vida máxima a cada 3 turnos.', verbo: 'abençoa', falas: ['Deus abençoe, meu filho!'] },
};

const temAliado = (p, id) => (p.aliados || []).some(a => a.id === id);
const hpMaxAliado = a => Math.round((14 + G.andar * 5) * ALIADOS[a.id].hp * (1 + 0.15 * (a.nivel - 1)));
const novoAliado = id => { const a = { id, nivel: 1, vinculo: 0, hp: 1 }; a.hp = hpMaxAliado(a); return a; };

/* ---------- Eventos que dão companheiros (os do Caramelo, do Fantasma e do Gnomo foram ampliados em outros arquivos) ---------- */
const EVENTOS_ALIADOS = [
  {
    id: 'ovo', titulo: 'Ovo Quentinho (Sem Dono)', icone: '🥚', peso: 7, unico: true, cond: p => p.andar >= 3 && !temAliado(p, 'dragaozinho'),
    texto: 'Num ninho abandonado há um ovo do tamanho de uma bola de futsal, quentinho e cheio de pintas laranja. Dele vem um som: <i>“tic… tic… tic…”</i> (ou é o seu relógio).',
    escolhas: [
      { texto: '🔥 Aquecer perto da fogueira', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 10)) { fx.aliado('dragaozinho'); fx.xp(10); return 'O ovo racha e sai um dragãozinho espirrando faíscas. Ele te adota na hora e tenta morder o seu cadarço.'; }
        fx.dano(4, 'Queimado por um ovo quente demais'); return 'O ovo esquenta demais e estoura em uma nuvem de farinha. Você sai chamuscado e sem dragão.';
      } },
      { texto: '🧣 Carregar no casaco com carinho (10 ouro, pela almofadinha)', req: p => p.ouro >= 10, reqTxt: 'precisa de 10 ouro', acao: fx => {
        fx.ouro(-10); fx.aliado('dragaozinho'); fx.flag('ovoCarinho');
        return 'Você anda o dia inteiro de braços cruzados, protegendo o ovo. Ao anoitecer ele choca: um dragãozinho ronrona no seu ombro.';
      } },
      { texto: '🍳 Fazer omelete', acao: fx => { fx.curaPct(0.3); fx.energia(5); return 'Rende uma omelete gigante. Alguém, em algum lugar, ouve um dragão chorando.'; } },
    ],
  },
  {
    id: 'mercenario', titulo: 'Pedro Henrique, Goblin Mercenário', icone: '👺', peso: 7, unico: true, cond: p => p.andar >= 2 && !temAliado(p, 'pedro'),
    texto: 'Um goblin de colete refletivo segura um cartaz: <i>“Aceito qualquer serviço. Estágio não remunerado: NÃO. Preço fixo: 40 de ouro. Sem reembolso.”</i>',
    escolhas: [
      { texto: '💰 Contratar (40 ouro)', req: p => p.ouro >= 40, reqTxt: 'precisa de 40 ouro', acao: fx => { fx.ouro(-40); fx.aliado('pedro'); return 'Ele aperta a sua mão com um aperto profissional. “Contrato assinado. Agora cadê meu vale-transporte?”'; } },
      { texto: '🗣️ Negociar o preço', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 12)) { fx.ouro(-15); fx.aliado('pedro'); return 'Você convence o goblin de que “experiência vale mais que dinheiro”. Ele topa por 15 de ouro e um pastel.'; }
        return 'Ele se ofende com a pechincha, vira o cartaz e some no corredor resmungando sobre “falta de respeito com o profissional”.';
      } },
      { texto: '🚶 Recusar', acao: fx => 'Você dá um tchauzinho. O goblin anota algo na prancheta: “cliente difícil”.' },
    ],
  },
  {
    id: 'curandeira', titulo: 'Tia Zélia, a Rezadeira do Coral', icone: '🧓', peso: 6, unico: true, cond: p => p.andar >= 3 && !temAliado(p, 'zelia'),
    texto: 'Uma senhora de lenço na cabeça tenta carregar um harmônio quebrado: <i>“Meu filho, me ajuda aqui que eu te benzo e ainda faço um quentão para a estrada.”</i>',
    escolhas: [
      { texto: '🎹 Carregar o harmônio', dica: 'Teste de Força', acao: fx => {
        if (fx.teste('for', 11)) { fx.aliado('zelia'); fx.xp(8 + G.andar * 2); return 'Você carrega o harmônio até o fim do corredor. Tia Zélia decide que a sua aventura precisa de uma reza diária e te segue com a bolsa de crochê.'; }
        fx.dano(5, 'Harmônio nas costas'); return 'O harmônio escorrega e cai no seu pé. Tia Zélia sai ofendida, murmurando um salmo meio desafinado.';
      } },
      { texto: '🪙 Fazer uma doação (50 ouro)', req: p => p.ouro >= 50, reqTxt: 'precisa de 50 ouro', acao: fx => { fx.ouro(-50); fx.karma(1); fx.aliado('zelia'); return 'Ela guarda o dinheiro no sutiã (tradição) e jura rezar por você todos os dias. E vem junto, pra garantir que a promessa seja cumprida.'; } },
      { texto: '🙏 Pedir só a bênção', acao: fx => { fx.curaPct(0.25); return 'Ela te benze com um ramo de arruda e te dá um quentão. Você segue mais leve (e levemente bêbado).'; } },
    ],
  },
  {
    id: 'gato_botas', titulo: 'Gato de Botas Usadas', icone: '🐱', peso: 7, unico: true, cond: p => p.andar >= 2 && !temAliado(p, 'gato'),
    texto: 'Um gato magrelo, calçando um par de botas de segunda mão, te encara sem piscar. Enquanto você decide o que fazer, ele rouba um pedaço do seu lanche sem nem disfarçar.',
    escolhas: [
      { texto: '🥟 Dar um pastelzinho (10 ouro)', req: p => p.ouro >= 10, reqTxt: 'precisa de 10 ouro', acao: fx => { fx.ouro(-10); fx.aliado('gato'); return 'O gato come, lambe a pata e se esfrega na sua perna. Pelas leis do mundo gatuno, agora você é o funcionário dele.'; } },
      { texto: '🏃 Perseguir o gatuno', dica: 'Teste de Destreza', acao: fx => {
        if (fx.teste('des', 12)) { fx.ouro(20); fx.aliado('gato'); return 'Você o encurrala num beco… e ele te encara com um respeito sincero. Ele devolve o lanche (e uma moeda que não era sua) e se junta a você.'; }
        fx.dano(3, 'Arranhado por um gato de botas'); return 'O gato escala uma parede, te dá um arranhão e some com o seu lanche. Respeito mútuo, nada mais.';
      } },
      { texto: '😾 Ignorar', acao: fx => 'O gato te olha com desprezo e vai embora. Você sente que acabou de perder uma entrevista de emprego.' },
    ],
  },
];
EVENTOS.push(...EVENTOS_ALIADOS);
