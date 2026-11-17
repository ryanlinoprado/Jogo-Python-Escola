'use strict';
/* =========================================================================
   DADOS DO JOGO  —  tudo que é "conteúdo" fica aqui.
   Quer criar uma classe, inimigo ou item novo? É só copiar um exemplo
   e mexer nos números e nos nomes. Sem precisar mexer no motor do jogo!
   ========================================================================= */

/* ---------- Atributos ---------- */
const ATRIBUTOS = {
  for: { nome: 'Força',        icone: '💪', desc: 'Dano e acerto de quem luta com Força (Guerreiro e Bárbaro). Também abre potes de conserva.' },
  des: { nome: 'Destreza',     icone: '🏹', desc: 'Dano e acerto do Ladino. Para todos: CA (difícil de acertar), esquiva e chance de crítico.' },
  int: { nome: 'Inteligência', icone: '🧠', desc: 'Dano e acerto do Mago. Para todos: energia, que paga as habilidades.' },
  vit: { nome: 'Vitalidade',   icone: '❤️', desc: 'Dano e acerto do Clérigo. Para todos: pontos de vida e defesa. Aguenta o tranco!' },
  sor: { nome: 'Sorte',        icone: '🍀', desc: 'Para todos: itens mais raros, chance de crítico e sucesso nos testes de eventos.' },
};

/* ---------- Raridades ---------- */
const RARIDADES = [
  { nome: 'Comum',    cor: '#9aa0a6', peso: 60,  venda: 10,  preco: 45,   pontos: 0 },
  { nome: 'Incomum',  cor: '#4ade80', peso: 26,  venda: 25,  preco: 100,  pontos: 5 },
  { nome: 'Raro',     cor: '#60a5fa', peso: 10,  venda: 60,  preco: 220,  pontos: 20 },
  { nome: 'Épico',    cor: '#c084fc', peso: 3.5, venda: 140, preco: 480,  pontos: 50 },
  { nome: 'Lendário', cor: '#fbbf24', peso: 0.7, venda: 320, preco: 1000, pontos: 150 },
];

/* ---------- Classes ---------- */
const CLASSES = {
  guerreiro: {
    nome: 'Guerreiro', icone: '🛡️', cor: '#ef4444', principal: 'for',
    base: { for: 7, des: 3, int: 1, vit: 6, sor: 3 },
    arma: 'esp_enferrujada', habilidade: 'golpe_poderoso',
    passiva: { nome: 'Casca Dura', desc: '+2 de defesa.', mods: { def: 2 } },
    foco: ['for', 'vit'],   // atributos que mais importam, em ordem (o ATRIBUTO PRINCIPAL dá dano e acerto)
    dica: 'Bate com Força e aguenta o tranco com Vitalidade. Inteligência quase não importa: a energia dele só paga umas poucas habilidades por luta.',
    desc: 'Entra de cabeça e sai de cabeça (quando dá). Muita vida, muito dano, pouco cérebro.',
  },
  ladino: {
    nome: 'Ladino', icone: '🥷', cor: '#22c55e', principal: 'des',
    base: { for: 3, des: 7, int: 3, vit: 4, sor: 3 },
    arma: 'adaga_barata', habilidade: 'golpe_furtivo',
    passiva: { nome: 'Olho de Gavião', desc: '+10% de chance de crítico.', mods: { crit: 10 } },
    foco: ['des', 'sor'],   // atributos que mais importam, em ordem (o ATRIBUTO PRINCIPAL dá dano e acerto)
    dica: 'Destreza faz tudo: dano, acerto, esquiva, CA e crítico. Sorte turbina ainda mais os críticos e os itens raros.',
    desc: 'Rápido, traiçoeiro e de dedos leves. Críticos e veneno são o idioma dele.',
  },
  mago: {
    nome: 'Mago', icone: '🧙', cor: '#a855f7', principal: 'int',
    base: { for: 2, des: 3, int: 8, vit: 3, sor: 4 },
    arma: 'cajado_galho', habilidade: 'bola_fogo',
    passiva: { nome: 'Fonte Mística', desc: '+4 de energia máxima.', mods: { en: 4 } },
    foco: ['int', 'vit'],   // atributos que mais importam, em ordem (o ATRIBUTO PRINCIPAL dá dano e acerto)
    dica: 'Inteligência dá o dano E a energia das magias (sem energia, sem magia!). Vitalidade protege um corpo de papel.',
    desc: 'Estudou 12 anos e esqueceu de estudar educação física. Magias fortes, corpo de papel.',
  },
  clerigo: {
    nome: 'Clérigo', icone: '🌞', cor: '#f59e0b', principal: 'vit',
    base: { for: 3, des: 3, int: 4, vit: 6, sor: 4 },
    arma: 'castical', habilidade: 'luz_sagrada',
    passiva: { nome: 'Graça de Arathor', desc: 'Recupera vida no fim de cada turno de combate (2, e mais a cada 3 níveis).', mods: { regen: 2 } },
    foco: ['vit', 'int'],   // atributos que mais importam, em ordem (o ATRIBUTO PRINCIPAL dá dano e acerto)
    dica: 'Vitalidade dá dano, vida e defesa de uma vez. Um pouco de Inteligência paga mais curas e bênçãos.',
    desc: 'Pregou tanto que virou o próprio milagre. Aguenta pancada, cura as feridas (as próprias) e acende o sol na cara dos inimigos. Seu poder vem da Vitalidade!',
    desbloqueio: { conq: 'andar10', texto: 'Chegue ao andar 10 em qualquer aventura.' },   // classe secreta
  },
  barbaro: {
    nome: 'Bárbaro', icone: '🪓', cor: '#b45309', principal: 'for',
    base: { for: 6, des: 2, int: 1, vit: 8, sor: 3 },
    arma: 'clava_tronco', habilidade: 'cabecada',
    passiva: { nome: 'Pele de Urso', desc: '+30 de vida máxima e +4 de defesa, mas causa 10% menos de dano.', mods: { hp: 30, def: 4, dano: -0.1 } },
    foco: ['vit', 'for'],   // atributos que mais importam, em ordem (o ATRIBUTO PRINCIPAL dá dano e acerto)
    dica: 'Vitalidade é a vida e a defesa; Força é o dano. Bate 10% menos, então o plano é aguentar mais que todo mundo.',
    desc: 'Não sabe ler o mapa, mas sabe aguentar. Leva porrada de cabeça erguida e cobra o troco com juros. É o mais resistente de todos, só que bate um pouco menos forte.',
  },
};

/* ---------- Habilidades ----------
   tipo 'ativa': usa energia em combate.
   tipo 'passiva': sempre ligada (mods somam nos atributos/estatísticas).
   Campos de habilidade ativa:
     custo, escala (atributo que dá o dano), mult (multiplicador), golpes,
     critGarantido, ignoraDef, atordoa (chance), dot {tipo,pct,turnos},
     buff {pct,turnos}, esquiva, escudo {base,escala,mult}, cura {pct}, energia
*/
const HABILIDADES = {
  /* ----- Guerreiro ----- */
  golpe_poderoso: { nome: 'Golpe Poderoso', icone: '💥', tipo: 'ativa', classe: 'guerreiro', custo: 4, escala: 'for', mult: 1.9, desc: 'Um golpe devastador: 190% de dano.' },
  grito_guerra:   { nome: 'Grito de Guerra', icone: '📢', tipo: 'ativa', classe: 'guerreiro', custo: 3, buff: { pct: 0.35, turnos: 3 }, desc: '+35% de dano por 3 turnos. Os vizinhos reclamam.' },
  escudada:       { nome: 'Escudada na Testa', icone: '🛡️', tipo: 'ativa', classe: 'guerreiro', custo: 3, escala: 'for', mult: 1.0, atordoa: 0.7, acerto: 2, desc: '+2 de acerto. Dano normal e 70% de chance de atordoar.' },
  giro_lamina:    { nome: 'Giro de Lâmina', icone: '🌪️', tipo: 'ativa', classe: 'guerreiro', custo: 5, escala: 'for', mult: 0.9, golpes: 2, desc: 'Dois golpes de 90% de dano cada.' },
  pele_pedra:     { nome: 'Pele de Pedra', icone: '🪨', tipo: 'passiva', classe: 'guerreiro', mods: { def: 4 }, desc: '+4 de defesa.' },
  sede_sangue:    { nome: 'Sede de Sangue', icone: '🩸', tipo: 'passiva', classe: 'guerreiro', mods: { roubaVida: 0.12 }, desc: 'Cura 12% do dano que causa.' },
  furia_almoco:   { nome: 'Fúria do Almoço Atrasado', icone: '🍖', tipo: 'passiva', classe: 'guerreiro', mods: { for: 3 }, desc: '+3 Força. Com fome ele fica perigoso.' },

  /* ----- Ladino ----- */
  golpe_furtivo:  { nome: 'Golpe Furtivo', icone: '🗡️', tipo: 'ativa', classe: 'ladino', custo: 3, escala: 'des', mult: 1.3, critGarantido: true, ignoraDef: true, acerto: 4, desc: '+4 de acerto. Se acertar, é crítico (dano dobrado) e ignora a defesa.' },
  veneno:         { nome: 'Veneno de Procedência Duvidosa', icone: '🧪', tipo: 'ativa', classe: 'ladino', custo: 3, escala: 'des', mult: 0.6, dot: { tipo: 'veneno', pct: 0.4, turnos: 4 }, acerto: 2, desc: '+2 de acerto. Pequeno dano + veneno por 4 turnos.' },
  fumaca:         { nome: 'Bomba de Fumaça', icone: '💨', tipo: 'ativa', classe: 'ladino', custo: 3, esquiva: true, desc: 'Esquiva do próximo ataque inimigo.' },
  punhalada_dupla:{ nome: 'Punhalada Dupla', icone: '⚔️', tipo: 'ativa', classe: 'ladino', custo: 4, escala: 'des', mult: 1.0, golpes: 2, desc: 'Duas punhaladas de 100% de dano.' },
  maos_leves:     { nome: 'Mãos Leves', icone: '🧤', tipo: 'passiva', classe: 'ladino', mods: { ouro: 0.5 }, desc: '+50% de ouro dos combates.' },
  sorte_ladrao:   { nome: 'Sorte de Ladrão', icone: '🎰', tipo: 'passiva', classe: 'ladino', mods: { sor: 3 }, desc: '+3 Sorte.' },

  /* ----- Mago ----- */
  bola_fogo:      { nome: 'Bola de Fogo (de Festa Junina)', icone: '🔥', tipo: 'ativa', classe: 'mago', custo: 4, escala: 'int', mult: 1.7, dot: { tipo: 'queima', pct: 0.25, turnos: 3 }, acerto: 2, desc: '+2 de acerto. Dano de 170% e queima por 3 turnos.' },
  raio_gelido:    { nome: 'Raio Gélido', icone: '❄️', tipo: 'ativa', classe: 'mago', custo: 3, escala: 'int', mult: 1.4, atordoa: 0.4, acerto: 3, desc: '+3 de acerto. Dano de 140% e 40% de chance de congelar.' },
  escudo_arcano:  { nome: 'Escudo Arcano', icone: '🔮', tipo: 'ativa', classe: 'mago', custo: 3, escudo: { base: 10, escala: 'int', mult: 2 }, desc: 'Cria uma barreira que absorve dano.' },
  meditacao:      { nome: 'Meditação (cochilo)', icone: '🧘', tipo: 'ativa', classe: 'mago', custo: 0, energia: 7, desc: 'Recupera 7 de energia. Custa o turno.' },
  meteoro:        { nome: 'Chuva de Meteoros', icone: '☄️', tipo: 'ativa', classe: 'mago', custo: 8, escala: 'int', mult: 3.4, acerto: 5, desc: '+5 de acerto. Destruição total: 340% de dano.' },
  mente_afiada:   { nome: 'Mente Afiada', icone: '📚', tipo: 'passiva', classe: 'mago', mods: { int: 3 }, desc: '+3 Inteligência.' },

  /* ----- Clérigo (o poder vem da Vitalidade) ----- */
  luz_sagrada:    { nome: 'Luz de Arathor', icone: '☀️', tipo: 'ativa', classe: 'clerigo', custo: 3, escala: 'vit', mult: 1.3, acerto: 2, cura: { pct: 0.1 }, desc: '+2 de acerto. Dano de 130% e cura 10% da vida máxima.' },
  mao_curadora:   { nome: 'Mão Curadora da Tia Zélia', icone: '🙌', tipo: 'ativa', classe: 'clerigo', custo: 4, cura: { pct: 0.4 }, desc: 'Recupera 40% da vida máxima.' },
  martelada_santa:{ nome: 'Martelada Santa', icone: '🔨', tipo: 'ativa', classe: 'clerigo', custo: 4, escala: 'vit', mult: 1.8, atordoa: 0.5, desc: 'Dano de 180% e 50% de chance de atordoar. Amém!' },
  chama_varthos:  { nome: 'Chama Purificadora de Varthos', icone: '🔥', tipo: 'ativa', classe: 'clerigo', custo: 4, escala: 'vit', mult: 0.9, dot: { tipo: 'queima', pct: 0.3, turnos: 3 }, acerto: 2, desc: '+2 de acerto. Dano de 90% e queima por 3 turnos.' },
  bencao_escudo:  { nome: 'Bênção do Escudo Dourado', icone: '🛡️', tipo: 'ativa', classe: 'clerigo', custo: 3, escudo: { base: 8, escala: 'vit', mult: 1.8 }, desc: 'Cria uma barreira sagrada que absorve dano.' },
  fe_inabalavel:  { nome: 'Fé Inabalável', icone: '🙏', tipo: 'passiva', classe: 'clerigo', mods: { vit: 3 }, desc: '+3 Vitalidade (mais vida e mais dano).' },
  vestes_bencao:  { nome: 'Vestes Abençoadas', icone: '👘', tipo: 'passiva', classe: 'clerigo', mods: { def: 2, ca: 1 }, desc: '+2 de defesa e +1 de CA.' },
  agua_benta:     { nome: 'Água Benta no Bolso', icone: '💧', tipo: 'passiva', classe: 'clerigo', mods: { hp: 15, roubaVida: 0.06 }, desc: '+15 de vida máx. e cura 6% do dano que causa.' },
  devocao:        { nome: 'Devoção Diária', icone: '📿', tipo: 'passiva', classe: 'clerigo', mods: { sor: 2, en: 3, regen: 1 }, desc: '+2 Sorte, +3 de energia máx. e +1 de regeneração por turno.' },

  /* ----- Bárbaro (o mais resistente, mas bate um pouco menos) ----- */
  cabecada:       { nome: 'Cabeçada Feroz', icone: '🐗', tipo: 'ativa', classe: 'barbaro', custo: 3, escala: 'for', mult: 1.3, atordoa: 0.35, acerto: 1, desc: '+1 de acerto. Dano de 130% e 35% de chance de atordoar. Dói mais em você do que no inimigo (mentira).' },
  pele_ferro:     { nome: 'Pele de Ferro', icone: '🦬', tipo: 'ativa', classe: 'barbaro', custo: 3, escudo: { base: 12, escala: 'vit', mult: 2.2 }, desc: 'Endurece a pele e cria uma barreira grande que absorve dano.' },
  sangue_quente:  { nome: 'Sangue Quente', icone: '🍗', tipo: 'ativa', classe: 'barbaro', custo: 3, cura: { pct: 0.3 }, desc: 'Devora uma coxa de frango crua e recupera 30% da vida máxima.' },
  machadada_dupla:{ nome: 'Machadada Dupla', icone: '🪓', tipo: 'ativa', classe: 'barbaro', custo: 5, escala: 'for', mult: 0.85, golpes: 2, desc: 'Dois golpes de 85% de dano cada.' },
  couro_grosso:   { nome: 'Couro Grosso', icone: '🧥', tipo: 'passiva', classe: 'barbaro', mods: { hp: 30, def: 2 }, desc: '+30 de vida máx. e +2 de defesa.' },
  teimosia:       { nome: 'Teimosia de Mula', icone: '🫏', tipo: 'passiva', classe: 'barbaro', mods: { regen: 1, vit: 2 }, desc: '+2 Vitalidade e +1 de regeneração por turno. Não cai nem se empurrar.' },
  costela_aco:    { nome: 'Costela de Aço', icone: '🦴', tipo: 'passiva', classe: 'barbaro', mods: { def: 3, ca: 1 }, desc: '+3 de defesa e +1 de CA.' },

  /* ----- Gerais (qualquer classe) ----- */
  casca_grossa:   { nome: 'Casca Grossa', icone: '🐢', tipo: 'passiva', mods: { hp: 25 }, desc: '+25 de vida máxima.' },
  respirar:       { nome: 'Respirar Fundo', icone: '😮‍💨', tipo: 'ativa', custo: 3, cura: { pct: 0.25 }, desc: 'Recupera 25% da vida máxima.' },
  pes_ligeiros:   { nome: 'Pés Ligeiros', icone: '👟', tipo: 'passiva', mods: { des: 3, esq: 4 }, desc: '+3 Destreza e +4% de esquiva.' },
  olho_tigre:     { nome: 'Olho de Tigre', icone: '🐯', tipo: 'passiva', mods: { crit: 8 }, desc: '+8% de chance de crítico.' },
  cofrinho:       { nome: 'Porquinho Cofrinho', icone: '🐷', tipo: 'passiva', mods: { ouro: 0.3 }, desc: '+30% de ouro dos combates.' },
  mira_certeira:  { nome: 'Mira Certeira', icone: '🎯', tipo: 'passiva', mods: { acerto: 3 }, desc: '+3 de acerto em todos os ataques.' },
  guarda_alta:    { nome: 'Guarda Alta', icone: '🤺', tipo: 'passiva', mods: { ca: 2 }, desc: '+2 de CA (fica mais difícil de acertar).' },
  foco_total:     { nome: 'Foco Total', icone: '🧿', tipo: 'ativa', custo: 3, buffAcerto: { v: 4, turnos: 3 }, desc: '+4 de acerto por 3 turnos.' },
  postura_defensiva: { nome: 'Postura Defensiva', icone: '🛡️', tipo: 'ativa', custo: 3, buffCA: { v: 4, turnos: 3 }, desc: '+4 de CA por 3 turnos.' },
  trevo:          { nome: 'Trevo de Quatro Folhas', icone: '☘️', tipo: 'passiva', mods: { sor: 3 }, desc: '+3 Sorte.' },
};

/* ---------- Itens ---------- */
const arma  = (id, nome, raridade, classe, atk, mods, flavor) => ({ id, nome, slot: 'arma', raridade, classe, atk, mods, flavor });
const armad = (id, nome, raridade, def, mods, flavor) => ({ id, nome, slot: 'armadura', raridade, def, mods, flavor });
const amul  = (id, nome, raridade, mods, flavor) => ({ id, nome, slot: 'amuleto', raridade, mods, flavor });

const ITENS = [
  /* Armas do Guerreiro */
  arma('esp_enferrujada', 'Espada Enferrujada do Vovô', 0, 'guerreiro', 4, {}, 'Ainda corta. Principalmente o seu orgulho.'),
  arma('colher_pau', 'Colher de Pau Gigante', 0, 'guerreiro', 5, {}, 'Receita da vovó: bater primeiro, perguntar depois.'),
  arma('machado_lenha', 'Machado de Cortar Lenha (e Sonhos)', 1, 'guerreiro', 8, { for: 1 }, 'Cortou muita lenha. E muitas esperanças.'),
  arma('esp_zecleiton', 'Espada Larga do Seu Zé Cleiton', 2, 'guerreiro', 12, { for: 2 }, 'Herança de um tio que "lutou na guerra" (do Paraguai? Do Fortnite?).'),
  arma('montante_churrasco', 'Montante Flamejante de Churrasco', 3, 'guerreiro', 17, { for: 3, crit: 5, acerto: 2 }, 'Serve para espetar linguiça e inimigos.'),
  arma('chinelo', 'Chinelo Voador da Mamãe', 4, 'guerreiro', 26, { for: 4, sor: 3, crit: 8, acerto: 3 }, 'Nenhum monstro resiste. Nem você, se virar de costas.'),

  /* Armas do Ladino */
  arma('adaga_barata', 'Adaga Barata Demais', 0, 'ladino', 4, {}, 'Comprada em promoção "leve 3 pague 2".'),
  arma('garfo_afiado', 'Garfo Afiado do Bar da Esquina', 0, 'ladino', 5, {}, 'Pega até o último grão de arroz. E de inimigo.'),
  arma('faca_pao', 'Faca de Pão Ninja', 1, 'ladino', 8, { des: 1 }, 'Corta pão em silêncio absoluto.'),
  arma('punhais_bruno', 'Punhais Gêmeos do Bruno Sombra', 2, 'ladino', 12, { des: 2, crit: 5, acerto: 1 }, 'Bruno disse que eram emprestados. Bruno sumiu.'),
  arma('adaga_esquecimento', 'Adaga do Esquecimento (esqueci onde pus)', 3, 'ladino', 17, { des: 3, crit: 8 }, 'Só aparece quando você não precisa dela.'),
  arma('katana_ninja', 'Katana do Ninja Aposentado (com reumatismo)', 4, 'ladino', 26, { des: 4, crit: 12, esq: 5, acerto: 3 }, 'Ainda corta rápido. Só reclama depois.'),

  /* Armas do Mago */
  arma('cajado_galho', 'Cajado de Galho', 0, 'mago', 4, {}, 'Encontrado no jardim. Ainda tem uma formiga.'),
  arma('varinha_pisca', 'Varinha de Pisca-Pisca de Natal', 0, 'mago', 5, {}, 'Brilha, pisca, e dá choquinho.'),
  arma('cajado_pardal', 'Cajado do Professor Pardal', 1, 'mago', 8, { int: 1 }, 'Inventado numa tarde de domingo.'),
  arma('cajado_wifi', 'Cajado de Wi-Fi Ancestral', 2, 'mago', 12, { int: 2, en: 4 }, 'Sinal forte só dentro do raio de 1 metro.'),
  arma('livro_pirata', 'Livro de Feitiços (versão pirata)', 3, 'mago', 17, { int: 3, en: 6, acerto: 2 }, 'Faltam as páginas 3, 7 e todas as de segurança.'),
  arma('varinha_zequinha', 'Varinha de Condão da Fada Padrinho Zequinha', 4, 'mago', 26, { int: 4, en: 8, sor: 2, acerto: 3 }, 'Realiza 3 desejos. O 4º é uma assinatura mensal.'),

  /* Armas do Clérigo */
  arma('castical', 'Castiçal Pesado da Capela', 0, 'clerigo', 4, {}, 'Ainda tem um pouco de cera. E de fé.'),
  arma('rosario_gigante', 'Rosário de Contas Gigantes', 0, 'clerigo', 5, {}, 'Cada conta é uma bolada na cabeça.'),
  arma('martelo_obra', 'Martelo de Obra Abençoado', 1, 'clerigo', 8, { vit: 1 }, 'Passou pela benção do padre e pelo pedreiro.'),
  arma('cetro_coral', 'Cetro da Tia Zélia do Coral', 2, 'clerigo', 12, { vit: 2, hp: 8 }, 'Dá o tom certo. Na nota e na testa.'),
  arma('maca_sol', 'Maça do Sol Nascente', 3, 'clerigo', 17, { vit: 3, crit: 4, acerto: 2 }, 'Acorda às 5 da manhã e quer que você acorde também.'),
  arma('maca_arathor', 'Maça Solar de Arathor (Edição Limitada)', 4, 'clerigo', 26, { vit: 4, for: 2, sor: 2, crit: 6, acerto: 3, hp: 15 }, 'Vem com certificado de autenticidade e protetor solar.'),

  /* Armas do Bárbaro (vida e defesa de sobra) */
  arma('clava_tronco', 'Clava de Tronco (com a casca)', 0, 'barbaro', 4, {}, 'Ainda tem uma folha. E um esquilo muito bravo.'),
  arma('osso_mamute', 'Osso de Mamute do Vovô das Cavernas', 0, 'barbaro', 5, {}, 'Quem comeu o mamute ninguém sabe. Quem bate com o osso, todos sabem.'),
  arma('machadinha_pedra', 'Machadinha de Pedra Lascada', 1, 'barbaro', 8, { vit: 1 }, 'Feita num sábado, entre uma soneca e outra.'),
  arma('machado_brutus', 'Machado Duplo do Tio Brutus', 2, 'barbaro', 12, { for: 1, hp: 12 }, 'Tio Brutus garante que é herança. A polícia também quer conversar.'),
  arma('marreta_demolidor', 'Marreta do Demolidor de Muros', 3, 'barbaro', 17, { for: 2, def: 2, hp: 15, acerto: 1 }, 'Derruba muralha, parede e a paciência do vizinho.'),
  arma('clava_titan', 'Clava do Titã Aposentado', 4, 'barbaro', 26, { for: 3, vit: 3, hp: 30, def: 2, crit: 5, acerto: 3 }, 'O titã se aposentou por causa do joelho. A clava, não.'),

  /* Armaduras */
  armad('camiseta_rival', 'Camiseta do Time Rival', 0, 1, {}, 'Os monstros ficam tão ofendidos que erram o golpe.'),
  armad('pijama_dino', 'Pijama de Dinossauro', 0, 2, {}, 'Fofo, quentinho e levemente ridículo.'),
  armad('panela_pressao', 'Armadura de Panela de Pressão', 1, 4, { hp: 8 }, 'Assobia quando a vida está acabando.'),
  armad('capa_cortina', 'Capa de Cortina da Vovó', 1, 3, { des: 1, esq: 2, ca: 1 }, 'Cheira a naftalina e a segurança.'),
  armad('colete_sofa', 'Colete de Couro de Sofá', 2, 7, { hp: 15 }, 'Confortável. Muito confortável.'),
  armad('manto_sem_wifi', 'Manto do Mago Sem Wi-Fi', 2, 5, { int: 2, en: 4 }, 'Sem conexão, mas cheio de poder.'),
  armad('armadura_latinhas', 'Armadura de Latinhas Recicladas', 3, 11, { hp: 25, vit: 2 }, 'Faz um barulho tremendo. Não dá pra ser furtivo.'),
  armad('capa_invisivel', 'Capa da Invisibilidade (só funciona às quartas)', 3, 8, { des: 4, esq: 8, ca: 2 }, 'Hoje é quarta? Talvez.'),
  armad('armadura_rei_churrasco', 'Armadura do Rei dos Churrascos', 4, 16, { hp: 40, for: 2, vit: 3 }, 'À prova de chama, de faca e de comentário de cunhado.'),
  armad('batina_kevlar', 'Batina Reforçada com Kevlar', 2, 6, { vit: 1, hp: 10 }, 'Tecnologia de ponta com cheirinho de incenso.'),
  armad('manto_solar', 'Manto Solar de Arathor', 3, 9, { vit: 2, hp: 20, ca: 1 }, 'Reflete a luz do sol. E a luz da lanterna do vizinho.'),

  /* Amuletos */
  amul('pe_coelho', 'Pé de Coelho Sintético', 0, { sor: 1 }, 'O coelho original não teve tanta sorte.'),
  amul('moeda_furada', 'Moeda Furada', 0, { sor: 1, ouro: 0.1 }, 'Tem um buraco no bolso e outro na moeda.'),
  amul('cueca_sorte', 'Cueca da Sorte', 1, { sor: 2 }, 'Não é lavada desde a Copa de 2002.'),
  amul('anel_chiclete', 'Anel de Chiclete', 1, { des: 1, vit: 1 }, 'Ainda está mascado. Ainda é útil.'),
  amul('amuleto_wifi', 'Amuleto do Wi-Fi Forte', 2, { int: 2, sor: 2, en: 3 }, 'Três barrinhas completas!'),
  amul('colar_goblin', 'Colar de Dentes de Goblin', 2, { for: 2, crit: 4 }, 'Os dentes não são do goblin. São do dentista dele.'),
  amul('relogio_atrasado', 'Relógio Que Sempre Atrasa', 3, { des: 3, esq: 6, ca: 2 }, 'Seus inimigos chegam sempre antes do horário.'),
  amul('coroa_papelao', 'Coroa de Papelão do Rei', 3, { sor: 4, ouro: 0.25 }, 'Feita por uma criança de 6 anos. É muito mais poderosa que a real.'),
  amul('medalha_santo', 'Medalhinha do Santo Casamenteiro', 1, { vit: 1, sor: 1 }, 'Atrai bênçãos. E pretendentes.'),
  amul('terco_vovo', 'Terço da Vovó (Original)', 2, { vit: 2, hp: 12, sor: 1 }, 'Já viu mais batalhas do que você.'),
  amul('sol_bolso', 'Sol de Bolso (Miniatura)', 3, { vit: 3, crit: 4, hp: 15 }, 'Esquenta as mãos. E os inimigos.'),
  amul('joia_camelo', 'Joia do Infinito (réplica do camelô)', 4, { for: 2, des: 2, int: 2, vit: 2, sor: 2, hp: 20 }, 'Estala os dedos e metade do cardápio desaparece.'),
];

const itemPorId = id => ({ ...ITENS.find(i => i.id === id) });

/* ---------- Consumíveis ---------- */
const CONSUMIVEIS = {
  suco:      { nome: 'Suco de Uva Duvidoso', icone: '🧃', hpPct: 0.4, preco: 30, desc: 'Cura 40% da vida. Tem gosto de remédio.' },
  energetico:{ nome: 'Energético Vencido', icone: '🥤', en: 10, preco: 25, desc: 'Recupera 10 de energia. Efeitos colaterais: arrotos.' },
  pastel:    { nome: 'Pastel de Vento Recheado', icone: '🥟', hpPct: 1, preco: 90, desc: 'Cura 100% da vida. Receita do Zé.' },
};

/* ---------- Inimigos ----------
   hp/atk/def/xp/ouro são MULTIPLICADORES. O motor escala pelo andar.
   traco: veneno | rouba_ouro | rouba_vida | esquiva      ritmo: ataca a cada N turnos (mais forte)
*/
const INIMIGOS = [
  { nome: 'Goblin Pedro Henrique', icone: '👺', min: 1, hp: 1, atk: 1, def: 1, xp: 1, ouro: 1.3, falas: ['Passa o ouro, parça!', 'Eu só estou fazendo estágio de vilão.'] },
  { nome: 'Ratazana Gigante Dona Ratinha', icone: '🐀', min: 1, hp: 0.8, atk: 1.1, def: 0.8, xp: 0.9, ouro: 0.8, falas: ['Squeeeeek! (tradução: "me dá queijo")'] },
  { nome: 'Slime Gelatina de Morango', icone: '🟢', min: 1, hp: 1.3, atk: 0.8, def: 1, xp: 1, ouro: 1, falas: ['Blub blub... (sabor: morango)'] },
  { nome: 'Mosquito da Dengue Medieval', icone: '🦟', min: 1, hp: 0.5, atk: 1.2, def: 0.5, xp: 1, ouro: 0.8, traco: 'esquiva', falas: ['Zzzzzzzzz... (você ouve até no escuro)'] },
  { nome: 'Esqueleto Fofoqueiro', icone: '💀', min: 2, hp: 1, atk: 1.1, def: 1, xp: 1.1, ouro: 1, falas: ['Fiquei sabendo que você esqueceu os dois-pontos depois do if...'] },
  { nome: 'Bug Selvagem (na minha máquina funciona)', icone: '🐛', min: 2, hp: 0.9, atk: 1.1, def: 1, xp: 1.2, ouro: 1, traco: 'veneno', falas: ['Eu só aparecia na apresentação!'] },
  { nome: 'Zumbi Preguiçoso Seu Anselmo', icone: '🧟', min: 3, hp: 1.6, atk: 1, def: 1, xp: 1.3, ouro: 1, ritmo: 2, falas: ['Uuuuh... só mais cinco minutinhos...'] },
  { nome: 'Aranha Costureira Dona Maria', icone: '🕷️', min: 3, hp: 1, atk: 1.2, def: 1, xp: 1.2, ouro: 1.1, traco: 'veneno', falas: ['Quer um casaquinho de teia?'] },
  { nome: 'Orc Seu Josemar', icone: '👹', min: 4, hp: 1.3, atk: 1.3, def: 1.2, xp: 1.4, ouro: 1.3, falas: ['EU SOU O ORC! SOU O ORC DO CHURRASCO!'] },
  { nome: 'Morcego Conde Drácula Júnior', icone: '🦇', min: 4, hp: 0.9, atk: 1.1, def: 0.8, xp: 1.2, ouro: 1, traco: 'rouba_vida', falas: ['Eu só quero um golinho... de suco de uva.'] },
  { nome: 'Bandido Ladrão de Chinelo', icone: '🦹', min: 4, hp: 1, atk: 1, def: 1, xp: 1.2, ouro: 1.5, traco: 'rouba_ouro', falas: ['Passa o chinelo! E o ouro também.'] },
  { nome: 'Fantasma do Boleto Vencido', icone: '👻', min: 5, hp: 1.1, atk: 1.2, def: 0.6, xp: 1.4, ouro: 1.2, traco: 'esquiva', falas: ['Buuu! Você tem 3 parcelas em atraso!'] },
  { nome: 'Lobisomem de Plantão', icone: '🐺', min: 6, hp: 1.2, atk: 1.4, def: 1, xp: 1.5, ouro: 1.2, falas: ['Auuuu! (Estou trabalhando em noite de lua cheia.)'] },
  { nome: 'Cogumelo Alucinado', icone: '🍄', min: 6, hp: 1, atk: 1.2, def: 1, xp: 1.3, ouro: 1, traco: 'veneno', falas: ['Você também está vendo o céu em cores?'] },
  { nome: 'Golem de Argila do Oleiro', icone: '🗿', min: 7, hp: 2, atk: 1.1, def: 2, xp: 1.7, ouro: 1.3, falas: ['Eu fui feito por um aluno. Por isso sou meio torto.'] },
  { nome: 'Ogro Tiozão do Pavê', icone: '🧌', min: 8, hp: 1.8, atk: 1.5, def: 1.3, xp: 1.8, ouro: 1.5, falas: ['Quem quer pavê? Quem quer porrada?'] },
  { nome: 'Loop Infinito (while True)', icone: '🌀', min: 9, hp: 2, atk: 0.9, def: 1.5, xp: 1.8, ouro: 1.5, traco: 'rouba_vida', falas: ['while True: atacar()   # sem break, claro.'] },
];

/* ---------- Chefões (um a cada 5 andares) ----------
   Cada chefão tem FASES: quando a vida dele cai abaixo de "hp" (fração da vida máxima), ele muda!
   Efeitos que uma fase pode ter:
     titulo, fala        → o que aparece na tela
     matk: ×             → multiplica o ataque dele   (ex.: 1.2 = 20% mais forte; 0.75 = mais fraco, mas veja "golpes")
     caBonus: +n         → mais difícil de acertar (CA)
     especial {…}        → troca o golpe especial (ex.: passa a usar a cada 2 turnos)
     golpes: n           → ataca n vezes por turno
     escudo: fração      → ganha um escudo (fração da vida máxima) que absorve seus golpes
     regen: fração       → recupera essa fração da vida máxima a cada turno
     aura: fração        → você sofre (fração do ataque dele) de dano no fim de cada turno
     drenaEn: n          → drena n de energia sua a cada turno
     cura: fração        → se cura de uma vez (fração da vida máxima)                           */
const CHEFES = [
  { nome: 'Rei Goblin Dom Pedrinho dos Bigodes', icone: '👑', hp: 3, atk: 1.3, def: 1.3, xp: 3, ouro: 4,
    especial: { nome: 'Bigodada Real', mult: 2.2, cada: 3 }, falas: ['Ajoelhem-se perante o meu bigode!'],
    fases: [
      { hp: 0.5, titulo: 'Fase 2 — Bigode Furioso', fala: 'Vocês arrancaram um pedacinho do meu bigode! ISSO É CRIME DE LESA-MAJESTADE!', matk: 1.1 },
      { hp: 0.2, titulo: 'Fase 3 — Rei Sem Coroa', fala: 'GUARDAS! …ah, é verdade, eu demiti todos. Tá, eu mesmo resolvo!', matk: 1.1, escudo: 0.1, aura: 0.08 },
    ] },
  { nome: 'Lich Linguiça, o Necromante Defumado', icone: '☠️', hp: 3.2, atk: 1.4, def: 1.4, xp: 3, ouro: 4,
    especial: { nome: 'Maldição do Boleto', mult: 2.3, cada: 3 }, falas: ['Eu tenho 800 anos e ainda uso Internet Explorer!'],
    fases: [
      { hp: 0.5, titulo: 'Fase 2 — Defumação Profunda', fala: 'Você acha que me derrotou? Eu já morri umas oito vezes, e a pior foi no Natal!', caBonus: 1, aura: 0.1 },
      { hp: 0.2, titulo: 'Fase 3 — Lich Torrado', fala: 'Tá bom, agora é pessoal. Vou até abrir uma segunda aba!', especial: { nome: 'Maldição do Boleto', mult: 2.3, cada: 2 }, drenaEn: 2, cura: 0.08 },
    ] },
  { nome: 'Dragão Fofão Cuspidor de Brasa', icone: '🐲', hp: 3.4, atk: 1.5, def: 1.5, xp: 3.5, ouro: 5,
    especial: { nome: 'Bafo de Churrasqueira', mult: 2.4, cada: 3 }, falas: ['Quem acordou o dragão? Eu estava no meu cochilo da tarde!'],
    fases: [
      { hp: 0.5, titulo: 'Fase 2 — Cochilo Interrompido', fala: 'Eu estava SONHANDO com churrasco! Agora ninguém dorme!', matk: 1.1, aura: 0.1 },
      { hp: 0.2, titulo: 'Fase 3 — Fogo Alto', fala: 'EU SOU O FOGO! …(tosse)… EU SOU O FOGO!', matk: 0.65, golpes: 2, especial: { nome: 'Bafo de Churrasqueira', mult: 2.4, cada: 2 } },
    ] },
  { nome: 'Kraken Nhoque Gigante', icone: '🦑', hp: 3.6, atk: 1.6, def: 1.5, xp: 3.5, ouro: 5,
    especial: { nome: 'Abraço de Polvo', mult: 2.4, cada: 3 }, falas: ['Dia 29 do mês: é dia de nhoque (e de você virar nhoque)!'],
    fases: [
      { hp: 0.5, titulo: 'Fase 2 — Molho Extra', fala: 'Trouxe reforços: molho de tomate!', escudo: 0.1, regen: 0.01 },
      { hp: 0.2, titulo: 'Fase 3 — Tentáculos Demais', fala: 'Quem disse que polvo tem só oito braços? Eu li o manual errado!', matk: 0.65, golpes: 2, drenaEn: 1 },
    ] },
  { nome: 'O Temível Chefão do Wi-Fi Lento', icone: '📡', hp: 3.8, atk: 1.6, def: 1.6, xp: 4, ouro: 6,
    especial: { nome: 'Carregando... 99%', mult: 2.5, cada: 3 }, falas: ['Estou travando a sua vida... aguarde.'],
    fases: [
      { hp: 0.5, titulo: 'Fase 2 — Buffering', fala: 'Carregando… 50%… carregando…', caBonus: 2, drenaEn: 1 },
      { hp: 0.2, titulo: 'Fase 3 — Conexão Instável', fala: 'Reconectando… Reconectando… Reconectando…', matk: 0.65, golpes: 2, regen: 0.03 },
    ] },
  { nome: 'Cobrão Pythonildo, o Mestre dos Bugs', icone: '🐍', hp: 4, atk: 1.7, def: 1.7, xp: 5, ouro: 7,
    especial: { nome: 'IndentationError Fatal', mult: 2.6, cada: 3 }, falas: ['sssSSSerá que você sabe programar mesmo?'],
    fases: [
      { hp: 0.7, titulo: 'Fase 2 — SyntaxError', fala: 'sssSSSyntaxError: unexpected indent! Você esqueceu os dois-pontos!', caBonus: 1, aura: 0.1 },
      { hp: 0.4, titulo: 'Fase 3 — Loop Infinito', fala: 'while True: atacar()   # sssSSSem break!', matk: 0.65, golpes: 2, especial: { nome: 'IndentationError Fatal', mult: 2.6, cada: 2 } },
      { hp: 0.15, titulo: 'Fase 4 — Exception Não Tratada', fala: 'Eu… não… tenho… try/except… SSSSSSS!', matk: 1.1, escudo: 0.1, regen: 0.01, drenaEn: 1 },
    ] },
];

/* ---------- Zonas (mudam a cada 5 andares) ---------- */
const ZONAS = ['Cavernas do Pastel', 'Catacumbas Fofoqueiras', 'Floresta dos Bugs', 'Vulcão do Servidor Quente', 'Abismo do Wi-Fi Fraco'];

/* ---------- Salas ---------- */
const TIPOS_SALA = {
  combate:  { icone: '⚔️', nome: 'Combate',   dica: 'Barulho de passos e rosnados...' },
  elite:    { icone: '💀', nome: 'Inimigo Elite', dica: 'Cheira a perigo. E a recompensa.' },
  evento:   { icone: '❓', nome: 'Evento',    dica: 'Algo estranho acontece ali dentro.' },
  loja:     { icone: '🛒', nome: 'Loja',      dica: 'Alguém assa pastel lá dentro.' },
  fogueira: { icone: '🏕️', nome: 'Fogueira',  dica: 'Dá para descansar um pouco.' },
  tesouro:  { icone: '💎', nome: 'Tesouro',   dica: 'Algo brilha no escuro!' },
  chefe:    { icone: '👑', nome: 'CHEFÃO',    dica: 'A porta é GIGANTE. Prepare-se.' },
};
const NOMES_PORTAS = ['Porta Rangente', 'Corredor Escuro', 'Túnel do Pastel', 'Escadaria Suspeita', 'Alçapão Misterioso', 'Cortina de Teias', 'Portão Sem Maçaneta', 'Buraco na Parede', 'Passagem Secreta (nem tão secreta)', 'Rampa Escorregadia'];

/* ---------- Nomes engraçados para heróis ---------- */
const NOMES_HEROIS = ['Sir Pastelão', 'Dona Tereza Bravura', 'Zé Fumaça', 'Lady Cebolinha', 'Mestre Biscoito', 'Capitão Pão de Queijo', 'Tio Guto, o Destemido', 'Valentina Chinelada', 'Barão Von Cuscuz', 'Joaquim Sem-Medo', 'Princesa Brigadeiro', 'Dom Paçoca'];

const EPITAFIOS = [
  'Seu último pensamento foi: "devia ter comprado mais suco".',
  'Dizem que o fantasma dele ainda reclama do lag.',
  'Descanse em paz. Ou em pedaços.',
  'Pelo menos morreu fazendo o que gostava: apertando botões.',
  'Seu código tinha um bug. O herói também.',
  'Faltou só mais um andar. Sempre falta.',
];

/* ---------- Perguntas de Python (evento do Fantasma do Prof. Pythonildo) ----------
   p = pergunta (HTML permitido), o = opções, c = índice da resposta certa */
const QUIZ = [
  { p: 'O que o código <code>print(len([10, 20, 30]))</code> mostra?', o: ['3', '30', '60', 'Erro'], c: 0 },
  { p: 'Qual palavra-chave cria uma função em Python?', o: ['function', 'def', 'fun', 'define'], c: 1 },
  { p: 'Qual símbolo inicia um comentário de uma linha?', o: ['//', '--', '#', '/*'], c: 2 },
  { p: 'Quanto vale <code>"ab" * 3</code>?', o: ['"ababab"', '"ab3"', 'Erro', '"aaabbb"'], c: 0 },
  { p: 'Quanto é <code>7 // 2</code> em Python?', o: ['3.5', '4', '3', '2'], c: 2 },
  { p: 'Qual estrutura é <b>imutável</b> em Python?', o: ['lista', 'dicionário', 'tupla', 'conjunto'], c: 2 },
  { p: 'Qual método adiciona um item no fim de uma lista?', o: ['add()', 'append()', 'push()', 'insertEnd()'], c: 1 },
  { p: 'Qual o tipo retornado pela função <code>input()</code>?', o: ['int', 'float', 'str', 'bool'], c: 2 },
  { p: 'Quanto vale <code>2 ** 3</code>?', o: ['6', '5', '9', '8'], c: 3 },
  { p: 'Quem criou a linguagem Python?', o: ['Guido van Rossum', 'Bill Gates', 'Linus Torvalds', 'Pythonildo'], c: 0 },
  { p: 'O que <code>bool("")</code> retorna?', o: ['True', 'False', 'None', 'Erro'], c: 1 },
  { p: 'Quantas vezes <code>for i in range(4):</code> repete o bloco?', o: ['3', '4', '5', 'Infinitas'], c: 1 },
  { p: 'Qual comando interrompe um laço (loop) imediatamente?', o: ['stop', 'exit', 'break', 'end'], c: 2 },
  { p: 'Como se escreve um "senão se" em Python?', o: ['else if', 'elseif', 'elif', 'elsif'], c: 2 },
  { p: 'Qual biblioteca é famosa para criar jogos 2D em Python?', o: ['pygame', 'numpy', 'requests', 'flask'], c: 0 },
];
