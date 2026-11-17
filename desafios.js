'use strict';
/* ============================================================
   DESAFIOS — tudo que dá motivo para jogar de novo:
     1) Semente do dia (todo mundo joga a mesma masmorra)
     2) Modificadores de partida (regras malucas = mais pontos)
     3) Conquistas e títulos
     4) Epitáfios engraçados (e compartilháveis)
   Quer criar um modificador, conquista ou epitáfio novo?
   É só copiar um item das listas abaixo e mudar os textos!
   ============================================================ */

/* ---------- 1) SEMENTE DO DIA ----------
   Um gerador "pseudoaleatório" é uma conta que, partindo do mesmo número
   (a semente), sempre cospe a mesma sequência. Usamos a data de hoje como
   semente: por isso todos os alunos enfrentam as mesmas salas no mesmo dia. */
function hashTexto(t) {                       // transforma um texto em um número
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 2147483646) + 1;
}
function geradorComSemente(texto) {           // devolve uma função que "sorteia" sempre igual
  const r = semente(hashTexto(texto));
  r(); r(); r();                              // descarta os primeiros números (são parecidos)
  return r;
}
function diaDeHoje() {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
const dataBonita = dia => dia ? dia.split('-').reverse().join('/') : '';

/* ---------- 2) MODIFICADORES ----------
   bonus = quanto de pontuação extra (0.40 = +40%). Quanto mais arriscado, mais pontos. */
const MODIFICADORES = {
  sem_cura: { nome: 'Só Cura em Fogueira', icone: '🏕️', bonus: 0.40, desc: 'Poções de vida, roubo de vida, habilidades de cura, vitórias e subir de nível não curam. Só descansar na fogueira!' },
  ca_ouro: { nome: 'Armaduras Reforçadas', icone: '🛡️', bonus: 0.25, desc: 'Inimigos com +2 de CA (mais difíceis de acertar), mas soltam o dobro de ouro.' },
  gnomos: { nome: 'Invasão Gnômica', icone: '🧙‍♂️', bonus: 0.15, desc: 'Todos os inimigos comuns e elites são gnomos. Só gnomos. Sempre gnomos.' },
  vidro: { nome: 'Canhão de Vidro', icone: '🔮', bonus: 0.30, desc: 'Você causa 50% mais dano, mas sua vida máxima cai 35% e os golpes que você leva doem 50% mais.' },
  sem_loja: { nome: 'Sovinas Fechadas', icone: '🚫', bonus: 0.10, desc: 'A loja do Zé do Pastel nunca aparece. Só dá para contar com o que você achar.' },
  chefes_gordos: { nome: 'Chefões Parrudos', icone: '👑', bonus: 0.20, desc: 'Os chefões têm 60% mais vida.' },
  sem_fuga: { nome: 'Sem Covardes', icone: '🚷', bonus: 0.10, desc: 'Você não pode fugir de nenhum combate.' },
  pesadelo: { nome: 'Noite Sem Fim', icone: '🌑', bonus: 0.30, desc: 'Os inimigos causam 30% mais dano.' },
};
const MAX_MODS = 3;
const multMods = ids => 1 + (ids || []).reduce((s, id) => s + (MODIFICADORES[id] ? MODIFICADORES[id].bonus : 0), 0);
const iconesMods = ids => (ids || []).map(id => MODIFICADORES[id] ? MODIFICADORES[id].icone : '').join('');

/** O desafio do dia sempre vem com 1 modificador sorteado pela semente da data. */
function modDoDia(dia) { const r = geradorComSemente(dia + '|mod'); const ids = Object.keys(MODIFICADORES); return ids[Math.floor(r() * ids.length)]; }

/* Inimigos do modificador "Invasão Gnômica" (mesmo formato de INIMIGOS em dados.js) */
const GNOMOS = [
  { nome: 'Gnomo Seu Genivaldo Júnior', icone: '🧙‍♂️', min: 1, hp: 1, atk: 1, def: 1, xp: 1, ouro: 1.2, falas: ['Meu pai disse que você é o cara do gorro!'] },
  { nome: 'Gnomo Jardineiro Assassino', icone: '🧑‍🌾', min: 1, hp: 0.9, atk: 1.3, def: 0.9, xp: 1.1, ouro: 1, falas: ['As flores mandam lembranças.'] },
  { nome: 'Gnomo Estagiário (sem barba ainda)', icone: '👶', min: 1, hp: 0.7, atk: 0.9, def: 0.8, xp: 0.8, ouro: 0.9, falas: ['É meu primeiro dia, tenha dó!'] },
  { nome: 'Gnomo de Jardim Enfurecido', icone: '🪴', min: 1, hp: 1.4, atk: 0.9, def: 1.4, xp: 1.2, ouro: 1, falas: ['Nunca mais me deixe na chuva!'] },
  { nome: 'Gnomo Contador de Impostos', icone: '🧾', min: 1, hp: 1, atk: 1.1, def: 1, xp: 1.1, ouro: 1.5, traco: 'rouba_ouro', falas: ['Tem nota fiscal desse ouro aí?'] },
  { nome: 'Gnomo Programador (sem comentários)', icone: '👨‍💻', min: 1, hp: 0.9, atk: 1.2, def: 1, xp: 1.2, ouro: 1, traco: 'veneno', falas: ['Funciona e eu não sei por quê.'] },
  { nome: 'Gnomo DJ Gorrinho', icone: '🎧', min: 1, hp: 1.1, atk: 1, def: 1, xp: 1, ouro: 1.1, falas: ['Solta o beat, solta o beat!'] },
  { nome: 'Gnomo Vampiro de Churrascaria', icone: '🧛', min: 1, hp: 1.1, atk: 1.1, def: 1, xp: 1.3, ouro: 1, traco: 'rouba_vida', falas: ['Só um golinho de caldo de cana…'] },
];

/* ---------- 3) CONQUISTAS ----------
   teste(G, fim) devolve true quando a conquista é ganha.
   rar (1 a 3) decide qual título aparece no ranking: o mais raro vence. */
const CONQUISTAS = [
  { id: 'mal_comecou', nome: 'Mal Começou', icone: '🥚', rar: 1, titulo: 'o Efêmero', desc: 'Morrer no 1º andar.', teste: (g, fim) => fim && g.andar <= 1 },
  { id: 'primeiro_chefe', nome: 'Matador de Chefões', icone: '👑', rar: 1, titulo: 'Matador de Chefões', desc: 'Derrotar um chefão. (Libera uma raça!)', teste: g => g.chefes >= 1 },
  { id: 'veterano', nome: 'Veterano', icone: '🎖️', rar: 1, titulo: 'o Veterano', desc: 'Chegar ao nível 10.', teste: g => g.nivel >= 10 },
  { id: 'andar10', nome: 'Sobrevivente', icone: '🏔️', rar: 2, titulo: 'o Sobrevivente', desc: 'Chegar ao andar 10. (Libera uma classe secreta!)', teste: g => g.andar >= 10 },
  { id: 'andar20', nome: 'Lenda da Masmorra', icone: '🌟', rar: 3, titulo: 'Lenda da Masmorra', desc: 'Chegar ao andar 20.', teste: g => g.andar >= 20 },
  { id: 'andar30', nome: 'Domador de Serpentes', icone: '🐍', rar: 3, titulo: 'Domador de Serpentes', desc: 'Chegar ao andar 30, onde mora a Serpente de Código.', teste: g => g.andar >= 30 },
  { id: 'chefe_limpo', nome: 'Intocável', icone: '✨', rar: 3, titulo: 'o Intocável', desc: 'Derrotar um chefão sem tomar nenhum dano.', teste: g => g.est.bossLimpo >= 1 },
  { id: 'relampago', nome: 'Matador Relâmpago', icone: '⚡', rar: 3, titulo: 'o Relâmpago', desc: 'Derrotar um chefão sem deixar ele chegar à Fase 2.', teste: g => g.est.bossRelampago >= 1 },
  { id: 'ultima_fase', nome: 'Fim da Linha', icone: '🏁', rar: 2, titulo: 'o Persistente', desc: 'Derrotar um chefão que chegou à última fase.', teste: g => g.est.bossUltimaFase >= 1 },
  { id: 'tres_um', nome: 'Azarado Profissional', icone: '🎲', rar: 2, titulo: 'o Azarado', desc: 'Tirar 1 natural três vezes na mesma aventura.', teste: g => g.est.nat1 >= 3 },
  { id: 'cinco_vinte', nome: 'Bênção dos Dados', icone: '🍀', rar: 2, titulo: 'o Abençoado', desc: 'Tirar 20 natural cinco vezes na mesma aventura.', teste: g => g.est.nat20 >= 5 },
  { id: 'teste_critico', nome: 'Sucesso Absurdo', icone: '🌠', rar: 1, titulo: 'o Sortudo', desc: 'Tirar 20 natural em um teste de evento.', teste: g => g.est.testeCrit >= 1 },
  { id: 'estatua', nome: 'Derrubador de Estátuas', icone: '🗿', rar: 2, titulo: 'Derrubador de Estátuas', desc: 'Derrubar a estátua de Lysara. A deusa viu.', teste: g => !!g.flags.derrubouEstatua },
  { id: 'gnomo', nome: 'Amigo dos Gnomos', icone: '🎩', rar: 2, titulo: 'Amigo dos Gnomos', desc: 'Ajudar o Seu Genivaldo e receber o presente dele.', teste: g => !!g.flags.gnomo && !!g.flags.gnomoPago && !g.flags.gnomoRaiva },
  { id: 'rico', nome: 'Capitalista', icone: '💰', rar: 1, titulo: 'o Capitalista', desc: 'Juntar 600 de ouro no total. (Libera uma raça!)', teste: g => g.ouroTotal >= 600 },
  { id: 'lendario', nome: 'Colecionador de Lendas', icone: '🏺', rar: 3, titulo: 'Colecionador de Lendas', desc: 'Achar um item lendário.', teste: g => !!g.melhor && g.melhor.raridade >= 4 },
  { id: 'purista', nome: 'Purista', icone: '🧘', rar: 2, titulo: 'o Purista', desc: 'Chegar ao andar 8 sem usar nenhuma poção.', teste: g => g.andar >= 8 && g.est.cons === 0 },
  { id: 'covarde', nome: 'Covarde Estratégico', icone: '🐔', rar: 1, titulo: 'o Covarde', desc: 'Fugir de 5 combates.', teste: g => g.est.fugas >= 5 },
  { id: 'por_um_fio', nome: 'Por um Fio', icone: '🩹', rar: 2, titulo: 'o Teimoso', desc: 'Vencer um combate com menos de 10% de vida.', teste: g => g.est.fio >= 1 },
  { id: 'moeda', nome: 'Filho de Lysara', icone: '🪙', rar: 2, titulo: 'Filho de Lysara', desc: 'Ser salvo da morte pela moeda de Lysara.', teste: g => g.est.moeda >= 1 },
  { id: 'masoquista', nome: 'Masoquista Profissional', icone: '😈', rar: 3, titulo: 'o Masoquista', desc: 'Chegar ao andar 5 com 3 modificadores ativos.', teste: g => (g.mods || []).length >= 3 && g.andar >= 5 },
  { id: 'sinergista', nome: 'Sinergista', icone: '🔗', rar: 2, titulo: 'o Sinergista', desc: 'Ter 3 sinergias ativas ao mesmo tempo.', teste: g => sinergiasAtivas(g).length >= 3 },
  { id: 'maestro', nome: 'Maestro do Build', icone: '🎼', rar: 3, titulo: 'Maestro do Build', desc: 'Ter 6 sinergias ativas ao mesmo tempo.', teste: g => sinergiasAtivas(g).length >= 6 },
  { id: 'amigo_bicho', nome: 'Amigo dos Bichos', icone: '🐾', rar: 1, titulo: 'Amigo dos Bichos', desc: 'Ter um companheiro ao seu lado.', teste: g => (g.aliados || []).length >= 1 },
  { id: 'lider_bando', nome: 'Líder do Bando', icone: '🎺', rar: 2, titulo: 'Líder do Bando', desc: 'Ter 2 companheiros ao mesmo tempo.', teste: g => (g.aliados || []).length >= 2 },
  { id: 'laco', nome: 'Laço Inquebrável', icone: '💞', rar: 3, titulo: 'o Inseparável', desc: 'Fazer um companheiro chegar ao nível 5.', teste: g => (g.aliados || []).some(a => a.nivel >= 5) },
  { id: 'revisor', nome: 'Revisor de Código', icone: '🔍', rar: 2, titulo: 'o Revisor', desc: 'Acertar 3 revisões de código do Fantasma Sênior na mesma aventura.', teste: g => (g.est.reviewOk || 0) >= 3 },
  { id: 'criador', nome: 'Criador', icone: '🛠️', rar: 1, titulo: 'o Criador', desc: 'Criar um inimigo ou item na Oficina do Aprendiz.', teste: () => false },       // ganha ao salvar a primeira criação (veja oficina.js)
  { id: 'autor_turma', nome: 'Autor da Turma', icone: '🌐', rar: 2, titulo: 'o Autor', desc: 'Publicar uma criação para a turma jogar.', teste: () => false },              // ganha ao publicar (veja oficina.js)
  { id: 'diario', nome: 'Cumpridor do Dia', icone: '📅', rar: 1, titulo: 'o Pontual', desc: 'Chegar ao andar 5 no Desafio do Dia.', teste: g => g.modo === 'diario' && g.andar >= 5 },
];
const conquistaPorId = id => CONQUISTAS.find(c => c.id === id);

/** Título que aparece ao lado do nome: o da conquista mais rara da aventura. */
function tituloDaRun(ids) {
  let melhor = null;
  for (const id of ids || []) { const c = conquistaPorId(id); if (c && (!melhor || c.rar > melhor.rar)) melhor = c; }
  return melhor ? melhor.titulo : '';
}

/* Conquistas ganhas ficam guardadas neste navegador, para sempre. */
const Conquistas = {
  todas() { try { return JSON.parse(store.get('masmorra_conq') || '{}'); } catch (e) { return {}; } },
  grava(ids) { const t = this.todas(), novas = []; for (const id of ids) if (!t[id]) { t[id] = new Date().toISOString(); novas.push(id); } store.set('masmorra_conq', JSON.stringify(t)); return novas; },
};

/* ---------- 4) EPITÁFIOS ----------
   Escolhe a frase de acordo com COMO o herói morreu. {n}=inimigo, {h}=vida dele, {a}=andar. */
const EPI_CLASSE = {
  guerreiro: ['A armadura era decorativa.', 'Dizem que escudo também serve para se proteger.', 'Pelo menos morreu de pé. Ou caído, é difícil saber.'],
  ladino: ['Roubou de todo mundo, menos da morte.', 'Furtividade nota 0.', 'Deveria ter ficado nas sombras. Ficou no chão.'],
  mago: ['Esqueceu de memorizar a magia de sobreviver.', 'Calculou tudo, exceto o próprio azar.', 'A bola de fogo era para o outro lado.'],
  barbaro: ['Aguentou de tudo. Menos a conta.', 'Tinha vida de sobra. Faltou juízo.', 'Não caiu em combate. Caiu de cansaço.'],
  clerigo: ['Rezou por um milagre. Arathor estava em reunião.', 'Curou todo mundo, menos a si mesmo.', 'Dizem que o sol nasce de novo. Ele, nem tanto.'],
};
const EPI_EVENTO = ['Moral da história: nem toda porta misteriosa merece ser aberta.', 'Escolheu a opção que parecia boa. Parecia.', 'Os deuses riram. Alto.', 'Faltou ler a plaquinha.', 'A curiosidade matou o herói. A gata sobreviveu.'];
const EPI_MOD = {
  sem_cura: 'Lembrete: a cura só existe em fogueiras.', vidro: 'Vidro quebra. Foi só isso.', pesadelo: 'A noite sem fim venceu.',
  gnomos: 'Derrotado por gnomos. Digno de nota.', sem_fuga: 'Fugir nem era uma opção.', chefes_gordos: 'O chefão estava de dieta reversa.',
};

function criaEpitafio(i) {
  const n = i.inimigo || 'um inimigo', h = i.heroi || 'O herói';
  let frase;
  if (i.vlad) return `${h} aceitou jantar com o Conde Vladislau e foi o prato principal. A noite, porém, está só começando…`.slice(0, 190);
  if (i.tipo === 'combate') {
    const falta = i.hpIni;
    const opcoes = [];
    if (falta > 0 && falta <= 6) opcoes.push(`morreu para ${n} com apenas ${falta} de vida restando.`, `perdeu para ${n}, que sobreviveu com ${falta} de vida. Faltou um espirro de dano.`);
    if (i.turnos <= 2) opcoes.push(`durou ${i.turnos} turno${i.turnos === 1 ? '' : 's'} contra ${n}. Foi rápido e indolor. Para ${n}.`);
    if (i.crit) opcoes.push(`foi atingido por um crítico de ${n}. Dizem que o d20 ainda está rindo.`);
    if (i.boss) opcoes.push(`virou mais um troféu na parede de ${n}.`, `desafiou ${n} e descobriu o motivo de ele ser o chefão.`);
    if (i.boss && i.fase > 1) opcoes.push(`caiu na fase ${i.fase} de ${i.fases} de ${n}, que ainda tinha ${i.hpIni} de vida.`, `sobreviveu ${i.fase - 1} fase${i.fase > 2 ? 's' : ''} de ${n}… e tropeçou na seguinte.`);
    if (i.boss && i.fase === 1) opcoes.push(`nem viu a segunda fase de ${n}. Um fiasco.`);
    if (i.andar <= 2) opcoes.push(`morreu no andar ${i.andar}, para ${n}. A turma já ficou sabendo.`);
    if (!opcoes.length) opcoes.push(`perdeu a discussão com ${n}.`, `subestimou ${n}.`, `foi derrotado por ${n}, que nem estava no melhor dia.`, `encontrou ${n} no andar ${i.andar} e não gostou do final.`);
    frase = `${h} ${opcoes[Math.floor(Math.random() * opcoes.length)]}`;
  } else if (i.tipo === 'evento') {
    frase = `${h} não sobreviveu a “${i.titulo}”. ${EPI_EVENTO[Math.floor(Math.random() * EPI_EVENTO.length)]}`;
  } else {
    frase = `${h} chegou ao andar ${i.andar} e decidiu descansar. Para sempre.`;
  }
  const extra = [];
  const pc = EPI_CLASSE[i.classe]; if (pc) extra.push(pc[Math.floor(Math.random() * pc.length)]);
  const pr = EPI_RACA[i.raca]; if (pr && Math.random() < 0.4) extra.unshift(pr[Math.floor(Math.random() * pr.length)]);   // frase da raça (racas.js)
  const m = (i.mods || []).find(x => EPI_MOD[x]); if (m && Math.random() < 0.6) extra.push(EPI_MOD[m]);
  if ((i.aliados || []).length && Math.random() < 0.5) return `${frase} ${i.aliados[0]} ficou ao seu lado até o fim.`.slice(0, 190);
  return (frase + ' ' + (extra[0] || '')).trim().slice(0, 190);
}
