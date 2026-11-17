'use strict';
/* =========================================================================
   RAÇAS — a origem do herói (a CLASSE diz o que ele faz; a RAÇA diz de onde ele vem).
   Cada raça tem: bônus e penalidades de atributos, uma habilidade própria (ef), uma fraqueza,
   uma etiqueta para as sinergias, rivais e parentes entre os inimigos, amigos entre os companheiros
   e um evento exclusivo. Algumas raças ficam TRANCADAS até você cumprir um feito (desbloqueio).
   Para criar uma raça nova: copie uma linha de RACAS, dê um "ef" novo e programe o efeito
   nos ganchos deste arquivo (racaDanoMult, racaAposAcerto, racaVitoria...).
   ========================================================================= */

/* attr: soma (ou subtrai) atributos no começo da aventura      mods: bônus como os de itens
   ef: efeito especial (veja os ganchos abaixo)    contra: inimigos que você enfrenta com +15% de dano
   parentes: inimigos "da família" (atacam 15% mais fraco)      afins/rejeita: companheiros (vínculo mais rápido/lento) */
const RACAS = {
  humano: { nome: 'Humano', icone: '🧑', cor: '#94a3b8', attr: { vit: 1, sor: 1 }, mods: {}, ef: 'versatil', tags: [],
    passiva: { nome: 'Versátil', desc: '+10% de XP em tudo.' }, fraqueza: 'Nenhuma. Mas também nenhum superpoder.',
    desc: 'Pagou todas as contas e mesmo assim chegou à masmorra. Aprende rápido porque não tem escolha.',
    contra: [], parentes: [], afins: [], rejeita: [] },
  elfo: { nome: 'Elfo', icone: '🧝', cor: '#4ade80', attr: { des: 2, int: 1, vit: -2 }, mods: { acerto: 1, crit: 4 }, ef: null, tags: ['arcano'],
    passiva: { nome: 'Olhos de Elfo', desc: '+1 de acerto, +4% de crítico e conta como Arcano nas sinergias.' }, fraqueza: 'Frágil: −2 Vitalidade (menos vida e defesa).',
    desc: 'Tem 300 anos, 4 faculdades e nenhuma paciência para gente que erra o ponto e vírgula.',
    contra: ['orc', 'ogro', 'troll'], parentes: [], afins: ['genivaldo', 'gato'], rejeita: ['pedro'] },
  anao: { nome: 'Anão', icone: '⛏️', cor: '#f59e0b', attr: { vit: 2, for: 1, des: -1 }, mods: { ouro: 0.1 }, ef: 'estomago', tags: ['ouro'],
    passiva: { nome: 'Estômago de Ferro', desc: 'Veneno causa metade do dano, +10% de ouro e conta como Riqueza.' }, fraqueza: 'Pernas curtas: −1 Destreza (CA e esquiva menores).',
    desc: 'Barba de dois metros e uma opinião sobre tudo. Nasceu dentro de uma mina e saiu só para reclamar do preço do ouro.',
    contra: ['goblin', 'bandido', 'golem'], parentes: [], afins: ['pedro'], rejeita: ['gato'] },
  halfling: { nome: 'Halfling', icone: '🍀', cor: '#84cc16', attr: { sor: 2, des: 1, for: -2 }, mods: {}, ef: 'dedos_sorte', tags: ['sorte'],
    passiva: { nome: 'Dedos de Sorte', desc: 'Uma vez por andar, refaz um teste de evento que falhou. Conta como Sorte.' }, fraqueza: 'Mãozinha fraca: −2 Força.',
    desc: 'Pequeno, simpático e sempre perto da cozinha. Sorte demais para quem só queria um lanchinho.',
    contra: ['rat'], parentes: [], afins: ['caramelo', 'zelia'], rejeita: [] },
  orc: { nome: 'Orc', icone: '👹', cor: '#65a30d', attr: { for: 2, vit: 1, int: -1 }, mods: {}, ef: 'furia_orc', tags: [],
    passiva: { nome: 'Fúria Orc', desc: 'Com menos de 40% da vida, causa 25% mais dano.' }, fraqueza: 'Cabeça-dura: −1 Inteligência (menos energia).',
    desc: 'Resolve tudo na base da conversa. Quando a conversa falha, na base da clava.',
    contra: ['goblin', 'bandido', 'lobisomem'], parentes: ['orc', 'ogro', 'troll'], afins: ['pedro', 'caramelo'], rejeita: ['genivaldo'],
    desbloqueio: { conq: 'primeiro_chefe', texto: 'Derrote um chefão.', dica: 'Dizem que só respeitam quem já derrubou um rei.' } },
  goblin: { nome: 'Goblin', icone: '👺', cor: '#a3e635', attr: { sor: 2, des: 1, for: -1, vit: -1 }, mods: { ouro: 0.25 }, ef: 'barganha', tags: ['ouro'],
    passiva: { nome: 'Dedo Leve de Goblin', desc: '+25% de ouro, tudo 20% mais barato nas lojas e conta como Riqueza.' }, fraqueza: 'Pequeno e magrelo: −1 Força e −1 Vitalidade.',
    desc: 'Sabe o preço de tudo e o valor de nada. Já foi preso 4 vezes e ainda tem as 4 chaves.',
    contra: ['rat'], parentes: ['goblin'], afins: ['pedro', 'genivaldo'], rejeita: ['zelia'],
    desbloqueio: { conq: 'rico', texto: 'Junte 600 de ouro em uma aventura.', dica: 'Só confiam em quem tem o bolso cheio.' } },
  draconato: { nome: 'Draconato', icone: '🐲', cor: '#ef4444', attr: { for: 2, int: 1, des: -1, sor: -1 }, mods: { def: 1 }, ef: 'sopro', tags: ['arcano'],
    passiva: { nome: 'Sopro Ancestral', desc: 'O primeiro golpe de cada combate incendeia o inimigo por 3 turnos. +1 de defesa (escamas).' }, fraqueza: 'Estabanado e azarado: −1 Destreza e −1 Sorte.',
    desc: 'Metade gente, metade lagartixa gigante, 100% orgulhoso. Espirra fogo e pede desculpas depois.',
    contra: ['cobrão', 'aranha'], parentes: ['dragão', 'dragao'], afins: ['dragaozinho'], rejeita: ['gato'],
    desbloqueio: { conq: 'matou_dragao', texto: 'Derrote o Dragão Fofão (chefão do andar 15).', dica: 'O sangue de dragão só aceita quem enfrentou um.' } },
  morto_vivo: { nome: 'Morto-vivo', icone: '🧟', cor: '#6b7280', attr: { vit: 3, int: 1, des: -1, sor: -2 }, mods: {}, ef: 'nao_morto', tags: ['noite'],
    passiva: { nome: 'Já Estou Morto', desc: 'Uma vez por aventura, ao morrer, levanta com 35% da vida. Conta como Noite.' }, fraqueza: 'Poções de cura curam só metade. −2 Sorte, −1 Destreza.',
    desc: 'Morreu faz tempo e ninguém avisou o corpo. Dá bom dia aos esqueletos e é reconhecido pelos fantasmas.',
    contra: ['arauto', 'sagrad'], parentes: ['esqueleto', 'zumbi', 'fantasma', 'lich'], afins: ['camaradinha'], rejeita: ['zelia', 'caramelo'],
    desbloqueio: { conq: 'matou_lich', texto: 'Derrote o Lich Linguiça (chefão do andar 10).', dica: 'Só o necromante sabe como se faz um morto-vivo educado.' } },
  vampiro: { nome: 'Vampiro', icone: '🧛', cor: '#be123c', attr: { des: 2, for: 1, vit: -1, sor: -1 }, mods: { roubaVida: 0.1, esq: 3 }, ef: 'sede', tags: ['noite'],
    passiva: { nome: 'Fome Elegante', desc: '+10% de roubo de vida, +3% de esquiva e +8% de vida ao vencer um combate. Conta como Noite.' }, fraqueza: 'Alérgico à luz: a fogueira cura só 30% (em vez de 45%).',
    desc: 'Chegou com capa, sotaque e fome de meio-dia. Evita alho, sol e reuniões de condomínio.',
    contra: ['lobisomem'], parentes: ['morcego'], afins: ['gato', 'camaradinha'], rejeita: ['zelia', 'caramelo'],
    desbloqueio: { conq: 'mordido', texto: 'Morra para o Conde Vladislau, um chefão que aparece a partir do andar 6.', dica: 'Dizem que um conde muito educado serve jantares no fundo da masmorra… e que você é o cardápio.' } },
};

const racaDe = p => (p && RACAS[p.raca]) || null;
/** O herói atual tem este efeito de raça? */
const temEf = ef => { const r = racaDe(G); return !!r && r.ef === ef; };
let racaNova = '';   // raça escolhida na criação (como modoNovo, só vale até começar a aventura)
const racaAttr = (attr, id) => { const a = { ...attr }, r = RACAS[id]; if (r) for (const k in r.attr) a[k] = Math.max(0, a[k] + r.attr[k]); return a; };   // penalidade nunca deixa o atributo negativo
const casaNome = (nome, lista) => { const n = String(nome).toLowerCase(); return (lista || []).some(k => n.includes(k)); };
const racaLiberada = id => { const d = RACAS[id].desbloqueio; return !d || !!Conquistas.todas()[d.conq] || /[?&]liberar/.test(location.search); };

/* Quais raças este navegador já jogou (para as conquistas de colecionador). */
const HistoricoRacas = {
  todas() { try { return JSON.parse(store.get('masmorra_racas') || '{}'); } catch (e) { return {}; } },
  marca(id) { if (!RACAS[id]) return; const t = this.todas(); t[id] = t[id] || new Date().toISOString(); store.set('masmorra_racas', JSON.stringify(t)); },
  qtd() { return Object.keys(this.todas()).filter(k => RACAS[k]).length; },
};

/* ---------- Ganchos: onde cada raça mexe no jogo ---------- */
/** Multiplicador de dano de raça (Fúria Orc e inimigos rivais). Chamado em golpeJogador(). */
function racaDanoMult(e) {
  const r = racaDe(G); if (!r) return 1;
  let m = 1;
  if (r.ef === 'furia_orc' && G.hp <= stats(G).hpMax * 0.4) { m *= 1.25; if (!C.furia) { C.furia = true; log('😤 <b>Fúria Orc!</b> Você está ferido e muito bravo: +25% de dano.'); } }
  if (casaNome(e.nome, r.contra)) m *= 1.15;
  return m;
}
/** Depois de acertar um golpe: o Sopro Ancestral do Draconato (uma vez por combate). */
function racaAposAcerto() {
  if (!temEf('sopro') || C.sopro || C.e.hp <= 0) return;
  C.sopro = true; const st = stats(G), poder = st.atk + st.s[CLASSES[G.classe].principal] * 1.2;
  const dq = Math.max(1, Math.round(poder * 0.25 * (temSin('fornalha') ? 1.5 : 1)));
  C.e.st.dots = C.e.st.dots.filter(d => d.tipo !== 'queima'); C.e.st.dots.push({ tipo: 'queima', dano: dq, turnos: 3 });
  log(`🐲 <b>Sopro Ancestral!</b> Você cospe fogo: ${esc(C.e.nome)} queima (${dq}/turno).`);
}
/** Quando o combate começa: parentes pegam leve e rivais são lembrados. */
function racaPreCombate() {
  const r = racaDe(G); if (!r) return; const e = C.e;
  if (casaNome(e.nome, r.parentes)) { e.atk = Math.max(2, Math.round(e.atk * 0.85)); log(`${r.icone} ${esc(e.nome)} é quase da sua família e pega leve: ataque −15%.`); }
  else if (casaNome(e.nome, r.contra)) log(`${r.icone} Velhas rivalidades! Contra ${esc(e.nome)} você causa +15% de dano.`);
}
/** Depois de vencer: lembra quais chefões caíram (libera raças) e a Fome Elegante do Vampiro. */
function racaVitoria(e, extras) {
  if (e.boss) G.flags.chefesMortos = [...(G.flags.chefesMortos || []), e.nome];
  if (e.nome === CONDE_VLAD.nome) extras.push('🧛 O Conde vira uma nuvem de morcegos: <i>“Magnífico! Volte quando quiser ser o jantar.”</i>');
  if (temEf('sede') && !curaOff()) {
    const st = stats(G), antes = G.hp; G.hp = Math.min(st.hpMax, G.hp + Math.round(st.hpMax * 0.08));
    if (G.hp > antes) extras.push(`🧛 Você se alimenta: +${G.hp - antes} de vida.`);
  }
}
/** O Morto-vivo levanta uma vez (depois da moeda de Lysara e do seguro). Devolve true se tratou a morte. */
function racaRevive() {
  if (!temEf('nao_morto') || G.flags.levantou) return false;
  G.flags.levantou = true; C = null; G.fila = [];
  G.hp = Math.max(1, Math.round(stats(G).hpMax * 0.35)); hud(); Som.tocar('raro');
  tela(`<div class="evento"><div class="grande-ico">🧟</div><h2>Você já estava morto!</h2>
    <div class="texto-evento">Seu corpo desaba… e se levanta, estalando as juntas. <i>“Ué, eu não tinha morrido?”</i> Ser morto-vivo tem suas vantagens: você acorda com 35% de vida. Só funciona uma vez, então não abuse.</div>
    <button class="btn primario grande" id="b-cont">Continuar ➡️</button></div>`);
  $('#b-cont').onclick = () => { G.andar++; escolherSala(); };
  return true;
}
/** Descanso na fogueira (o Vampiro é alérgico à luz). */
function curaFogueira(fx) {
  if (temEf('sede')) { fx.curaPct(0.3); fx.linha('🧛 A luz do fogo incomoda: a cura é menor.', 'ruim'); } else fx.curaPct(0.45);
}
const precoLoja = p => Math.round(p * (temEf('barganha') ? 0.8 : 1));
/** Quanto de vínculo um companheiro ganha por vitória: amigos da sua raça ganham o dobro. */
function racaVinculo(id) {
  const r = racaDe(G); if (!r) return 1;
  if (r.afins.includes(id)) return 2;
  return r.rejeita.includes(id) ? G.kills % 2 : 1;
}
function racaLinhaAliado(fx, id) {
  const r = racaDe(G); if (!r) return;
  if (r.afins.includes(id)) fx.linha(`${r.icone} Vocês se dão muito bem: o vínculo cresce mais rápido.`, 'bom');
  else if (r.rejeita.includes(id)) fx.linha(`${r.icone} ${ALIADOS[id].nome} desconfia de você: o vínculo cresce mais devagar.`, 'ruim');
}

/* ---------- Escolha de raça (entre a classe e os atributos) ---------- */
const chipsAttrRaca = r => Object.entries(r.attr).map(([k, v]) => `<span class="${v > 0 ? 'bom' : 'ruim'}">${ATRIBUTOS[k].icone}${v > 0 ? '+' : '−'}${Math.abs(v)}</span>`).join('');
function telaRaca(classeId) {
  const cl = CLASSES[classeId];
  tela(`<h2>De onde vem o seu ${cl.nome}? ${cl.icone}</h2>
    <p class="suave centro">A raça muda atributos, dá um poder próprio e uma fraqueza. Algumas só aparecem depois de grandes feitos!</p>
    <div class="grid3 classes4">${Object.entries(RACAS).map(([id, r]) => {
      if (!racaLiberada(id)) return `<div class="card classe trancada" style="--cor:#555"><div class="grande-ico">🔒</div><h3>Raça secreta</h3>
        <p class="suave">${r.desbloqueio.dica}</p><div class="info"><b>Para liberar:</b> ${r.desbloqueio.texto}</div></div>`;
      return `<div class="card classe" data-r="${id}" style="--cor:${r.cor}"><div class="grande-ico">${r.icone}</div><h3>${r.nome}</h3><p class="suave">${r.desc}</p>
        <div class="mini-attrs">${chipsAttrRaca(r)}</div>
        <div class="info"><b>${r.passiva.nome}:</b> ${r.passiva.desc}</div><div class="info"><b>Fraqueza:</b> ${r.fraqueza}</div>
        <button class="btn primario">Ser ${r.nome}</button></div>`;
    }).join('')}</div><button class="btn" id="b-voltar">⬅️ Voltar</button>`);
  document.querySelectorAll('.classe:not(.trancada)').forEach(el => el.onclick = () => { Som.tocar('click'); racaNova = el.dataset.r; telaAtributos(classeId); });
  $('#b-voltar').onclick = telaClasse;
}

/* ---------- Conquistas das raças (entram na lista de desafios.js) ---------- */
const chefeMorto = (g, nome) => (g.flags.chefesMortos || []).some(n => n.includes(nome));
CONQUISTAS.push(
  { id: 'mordido', nome: 'Jantar do Conde', icone: '🧛', rar: 3, titulo: 'o Mordido', desc: 'Morrer para o Conde Vladislau. (Libera uma raça secreta!)', teste: g => !!g.flags.mordido },
  { id: 'matou_dragao', nome: 'Matador de Dragões', icone: '🐉', rar: 3, titulo: 'Matador de Dragões', desc: 'Derrotar o Dragão Fofão. (Libera uma raça!)', teste: g => chefeMorto(g, 'Dragão') },
  { id: 'matou_lich', nome: 'Quebra-Lich', icone: '☠️', rar: 2, titulo: 'o Quebra-Lich', desc: 'Derrotar o Lich Linguiça. (Libera uma raça!)', teste: g => chefeMorto(g, 'Lich') },
  { id: 'viajante', nome: 'Viajante de Origens', icone: '🧭', rar: 1, titulo: 'o Viajante', desc: 'Jogar com 3 raças diferentes.', teste: () => HistoricoRacas.qtd() >= 3 },
  { id: 'todas_racas', nome: 'Colecionador de Origens', icone: '🧬', rar: 3, titulo: 'Colecionador de Origens', desc: 'Jogar com todas as raças.', teste: () => HistoricoRacas.qtd() >= Object.keys(RACAS).length },
);
const EPI_RACA = {
  humano: ['Era só um humano. Isso explica tudo.', 'Humano até o fim. Inclusive no azar.'],
  elfo: ['Viveu 300 anos e morreu num corredor. Pelo menos o penteado estava ótimo.', 'Os elfos escreverão uma balada. Triste e muito longa.'],
  anao: ['Cavou fundo. Morreu mais fundo ainda.', 'Pediu para ser enterrado com todo o ouro. Já estava no bolso do goblin.'],
  halfling: ['Morreu de barriga cheia, o que dizem ser o melhor jeito.', 'Perdeu a sorte justo na hora do segundo café.'],
  orc: ['Gritou até o fim. Os vizinhos ficaram aliviados.', 'A clava voou longe. O orgulho, mais ainda.'],
  goblin: ['Morreu devendo. Os credores foram ao velório.', 'Tinha mil planos e um bolso furado.'],
  draconato: ['Cuspiu fogo, queimou a própria capa e perdeu a luta.', 'A lenda diz que ele ainda espirra faíscas no além.'],
  morto_vivo: ['Morreu de novo. Ninguém ficou surpreso, nem ele.', 'Desta vez ficou parado. Provavelmente é de verdade.'],
  vampiro: ['Pegou sol. Era previsível.', 'Elegante até o último golinho.'],
};

/* ---------- O Conde Vladislau: o chefão que libera o Vampiro (se você perder para ele) ---------- */
const CONDE_VLAD = { nome: 'Conde Vladislau, o Sanguessuga Cortês', icone: '🧛', hp: 3, atk: 1.4, def: 1.3, xp: 4, ouro: 5, traco: 'rouba_vida',
  especial: { nome: 'Mordida Elegante', mult: 2.3, cada: 3 }, falas: ['Boa noite. Você chegou a tempo: o jantar está servido. Você é o prato principal.'],
  fases: [
    { hp: 0.6, titulo: 'Fase 2 — Nuvem de Morcegos', fala: 'Você acha que me atingiu? Eu sou 50 morcegos e uma capa!', caBonus: 2, aura: 0.06 },
    { hp: 0.25, titulo: 'Fase 3 — Sede Insaciável', fala: 'Chega de etiqueta! SOBREMESA!', matk: 0.7, golpes: 2, regen: 0.02 },
  ] };

/* ---------- Eventos exclusivos de cada raça (só fora do Desafio do Dia, para ele ser igual para todos) ---------- */
const soRaca = (id, extra) => p => p.raca === id && p.modo !== 'diario' && (!extra || extra(p));
const EVENTOS_RACAS = [
  { id: 'r_humano', titulo: 'Feira de Talentos Humanos', icone: '🎪', peso: 6, unico: true, cond: soRaca('humano'),
    texto: 'Uma barraquinha de lona anuncia: <i>“Feira de Talentos! Humanos têm desconto no ingresso (porque somos poucos aqui).”</i> Cheira a pastel e a oportunidade.',
    escolhas: [
      { texto: '🎤 Subir ao palco e se apresentar', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 11)) { fx.ouro(20 + G.andar * 3); fx.xp(10 + G.andar * 2); return 'A plateia de monstros chora de emoção (ou de dor de ouvido). Você ganha o prêmio e uns aplausos molhados.'; }
        fx.dano(3, 'Vaiado por monstros'); return 'Você esquece a letra e inventa uma nova. Os monstros não perdoam: chuva de pastéis frios.'; } },
      { texto: '🍰 Experimentar o bolo da feira', acao: fx => { fx.curaPct(0.25); return 'Sabor de bolo de aniversário de criança. Cura a alma (e 25% da vida).'; } },
      { texto: '🚶 Passar reto', acao: fx => { fx.xp(5 + G.andar); return 'Você prefere economizar energia. Aprendeu a lição de que a feira existe.'; } },
    ] },
  { id: 'r_elfo', titulo: 'Dríade Dramática', icone: '🌳', peso: 6, unico: true, cond: soRaca('elfo'),
    texto: 'Uma dríade surge entre as raízes, de braços cruzados: <i>“Você é um elfo! Finalmente alguém que entende de poesia! Ouça meu soneto de 400 versos.”</i>',
    escolhas: [
      { texto: '🎶 Responder com uma canção élfica', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 11)) { fx.curaPct(0.5); fx.energia(8); fx.xp(8 + G.andar); return 'Sua voz faz as folhas dançarem. A dríade soluça de emoção e te abençoa com seiva fresca.'; }
        fx.dano(3, 'Desafinou para uma árvore'); return 'Você desafina feio. A dríade tapa os ouvidos e te acerta com um galho.'; } },
      { texto: '🍃 Pedir uma folha mágica', acao: fx => { fx.consumivel('energetico'); return 'Ela arranca a folha de má vontade: “Tá, mas só porque você é elfo.” Tem gosto de energético.'; } },
    ] },
  { id: 'r_anao', titulo: 'Veio de Minério Cantante', icone: '⛏️', peso: 6, unico: true, cond: soRaca('anao'),
    texto: 'A parede da caverna <i>canta</i> uma melodia grave e conhecida. Todo anão reconhece: é um veio de minério precioso, tocando a canção da família!',
    escolhas: [
      { texto: '⛏️ Cavar com tudo', dica: 'Teste de Vitalidade', acao: fx => {
        if (fx.teste('vit', 11)) { fx.ouro(30 + G.andar * 5); fx.item({ bonus: 0.3 }); return 'Você bate, a pedra cede e jorra ouro e um objeto brilhante. Os ancestrais aplaudem do além.'; }
        fx.dano(6, 'Desabamento de minério'); return 'A parede desaba em cima de você. Os ancestrais fingem que não viram.'; } },
      { texto: '👂 Só ouvir e levar umas lascas', acao: fx => { fx.ouro(15 + G.andar * 2); return 'Você cantarola junto e leva só as lascas soltas. Humilde, rentável e sem dor nas costas.'; } },
    ] },
  { id: 'r_halfling', titulo: 'Segundo Café da Manhã (e o Terceiro)', icone: '🥐', peso: 6, unico: true, cond: soRaca('halfling'),
    texto: 'Uma mesa posta no meio do corredor: pão, queijo, geleia e um bule fumegante. Um bilhete diz: <i>“Para o halfling que passar. Sim, é para você.”</i>',
    escolhas: [
      { texto: '🍳 Sentar e comer com calma', acao: fx => { fx.curaPct(0.4); fx.energia(6); return 'Você come por uma hora e meia. Ninguém reclama. A masmorra respeita a hora do almoço dos halflings.'; } },
      { texto: '🥧 Levar a torta do vizinho também', dica: 'Teste de Destreza', acao: fx => {
        if (fx.teste('des', 10)) { fx.consumivel('pastel'); return 'Mãos rápidas! A torta some para dentro da sua mochila. Ninguém viu (acho).'; }
        fx.dano(5, 'Levou uma panelada'); return 'Uma frigideira voadora te acerta: “Essa é a torta do SEU VIZINHO!”'; } },
    ] },
  { id: 'r_orc', titulo: 'Torneio de Queda de Braço', icone: '💪', peso: 6, unico: true, cond: soRaca('orc'),
    texto: 'Orcs berram em volta de uma mesa de pedra. O campeão, cheio de cicatrizes, estende o braço: <i>“Um irmão! Vem, vamos ver se você é forte ou só barulhento!”</i>',
    escolhas: [
      { texto: '💪 Aceitar o desafio', dica: 'Teste de Força', acao: fx => {
        if (fx.teste('for', 12)) { fx.item({ min: 1 }); fx.xp(10 + G.andar * 2); return 'A mesa racha, o braço do campeão vira macarrão. A plateia explode em rugidos e te dá um prêmio.'; }
        fx.dano(8, 'Braço torcido num torneio'); return 'Seu braço faz um barulho de galho seco. O orc te dá um tapinha de consolo (que dói mais).'; } },
      { texto: '🍖 Dividir o churrasco com eles', acao: fx => { fx.curaPct(0.3); return 'Todos comem, riem e batem nas costas uns dos outros. Dói, mas é amizade.'; } },
    ] },
  { id: 'r_goblin', titulo: 'Mercado Negro dos Goblins', icone: '🛒', peso: 6, unico: true, cond: soRaca('goblin'),
    texto: 'Atrás de uma pilha de caixas, goblins de colete esperto sussurram: <i>“Psiu, primo! Tenho uns negócios de ocasião. Preço de família!”</i>',
    escolhas: [
      { texto: '🛒 Comprar o “item de ocasião” (60 ouro)', req: p => p.ouro >= 60, reqTxt: 'precisa de 60 ouro', acao: fx => { fx.ouro(-60); fx.item({ bonus: 0.8, min: 2 }); return 'Os primos embrulham tudo com jornal e um sorriso suspeito. Você jura que é um item de qualidade.'; } },
      { texto: '🤝 Barganhar com a família', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 10)) { fx.ouro(35 + G.andar * 3); return 'Você vende o que nem tinha. Os primos choram de orgulho e te pagam em moedas quentinhas.'; }
        fx.ouro(-10); return 'Os primos te passam a perna. Parente é para essas coisas.'; } },
    ] },
  { id: 'r_draconato', titulo: 'Ovo de um Parente Distante', icone: '🥚', peso: 7, unico: true, cond: soRaca('draconato', p => !temAliado(p, 'dragaozinho')),
    texto: 'Um ovo laranja pintado de brasas, com o seu cheiro (de fumaça e de churrasco). Ao tocá-lo, ele <i>reconhece</i> você: <i>“tic… tic… tic…”</i>',
    escolhas: [
      { texto: '🤗 Adotar o sobrinho', acao: fx => { fx.aliado('dragaozinho'); fx.xp(8 + G.andar); return 'O ovo racha e sai um dragãozinho que te chama de tio. Ele já sabe soltar fumaça pelo nariz.'; } },
      { texto: '🔥 Aquecer com o sopro e seguir', acao: fx => { fx.xp(12 + G.andar * 2); return 'Você cospe um bafo morno. O ovo ronrona e vai embora rolando. Ganhou um amigo para depois.'; } },
    ] },
  { id: 'r_morto', titulo: 'Reunião de Família na Cripta', icone: '⚰️', peso: 6, unico: true, cond: soRaca('morto_vivo'),
    texto: 'Um jantar de esqueletos, zumbis e uma tia múmia: <i>“Você chegou! Sempre fala de você nos aniversários de morte!”</i> Todos erguem canecas de ossos.',
    escolhas: [
      { texto: '🍻 Brindar com os parentes', acao: fx => { fx.item({ min: 1 }); fx.xp(10 + G.andar * 2); return 'A tia múmia te dá um embrulho velho: <i>“Era do seu tio-avô. Tem um defeitinho, mas pode usar.”</i>'; } },
      { texto: '💀 Pedir a herança do tio-avô', acao: fx => { fx.ouro(30 + G.andar * 4); return 'Eles reviram os bolsos de todos os defuntos da sala. Ninguém sabe de quem era, mas todos concordam que é seu.'; } },
    ] },
  { id: 'r_vampiro', titulo: 'Banco de Sangue Vencido', icone: '🩸', peso: 6, unico: true, cond: soRaca('vampiro'),
    texto: 'Uma geladeira de farmácia no meio do corredor, com etiqueta: <i>“Validade: ontem. Mas o gosto é bom.”</i> Um morcego de jaleco observa de cima.',
    escolhas: [
      { texto: '🩸 Beber à vontade', acao: fx => { fx.curaPct(0.6); fx.dano(4, 'Tipo O vencido'); return 'Você bebe três bolsas. Sente a força voltar, e também um revirar no estômago.'; } },
      { texto: '🦇 Chamar os morcegos para o lanche', acao: fx => { fx.energia(10); fx.xp(6 + G.andar); return 'Os morcegos fazem uma festa. Em troca, te deixam uma dose de coragem.'; } },
    ] },
  /* O evento que libera o Vampiro: só aparece se você ainda não o tem, e nunca no Desafio do Dia. */
  { id: 'conde_vlad', titulo: 'Convite para Jantar', icone: '🏰', peso: 9, unico: true, cond: p => p.andar >= 6 && p.modo !== 'diario' && !racaLiberada('vampiro'),
    texto: 'Uma carruagem negra para diante de você. Dela desce um homem pálido, de capa, que faz uma reverência: <i>“Conde Vladislau. Preparei um jantar à luz de velas… e você é o prato principal. Aceita?”</i>',
    escolhas: [
      { texto: '🍷 Aceitar o convite e enfrentá-lo', dica: 'Chefão! Perder para ele pode ter consequências… interessantes.', acao: fx => { fx.combate(CONDE_VLAD, { boss: true, mhp: 0.85 }); return 'O Conde sorri, mostra as presas e ajeita a capa: <i>“Que ótimo! Detesto jantar sozinho.”</i>'; } },
      { texto: '🧄 Mostrar o alho e recuar', acao: fx => { fx.ouro(-Math.min(G.ouro, 5)); return 'O Conde ri: <i>“Que fofo. Você deixou cair 5 moedas.”</i> A carruagem some na neblina.'; } },
    ] },
];
EVENTOS.push(...EVENTOS_RACAS);
