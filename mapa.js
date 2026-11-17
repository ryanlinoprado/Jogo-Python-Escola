'use strict';
/* =========================================================================
   MAPA — salvamento, o mapa ramificado de cada zona (gerarMapa/escolherSala),
   entrarSala() e avancar(), que decide o que acontece depois de cada sala.
   ========================================================================= */

/* ---- Salvamento ---- */
function salvar() { if (G && G.hp > 0 && !G.fila.length) store.set('masmorra_save', JSON.stringify(G)); }
function lerSave() { try { const s = JSON.parse(store.get('masmorra_save') || 'null'); return s && s.nome && s.classe ? s : null; } catch (e) { return null; } }

/* ---- O MAPA: cada zona (5 andares) é um grafo de salas ligadas por caminhos ----
   Linhas 0 a 3 = 4 andares de escolha; linha 4 = o chefão (sempre uma sala só).
   Cada sala só leva às salas que estão ligadas a ela: planeje sua rota!
   Estrutura: G.mapa = { zona, linhas: [[{id, linha, i, tipo, nome, prox:[ids]}]], atual: id|null, trilha: [ids] } */
const achaNo = id => { for (const l of G.mapa.linhas) for (const n of l) if (n.id === id) return n; return null; };

function gerarMapa() {
  /* No Desafio do Dia o mapa também sai igual para todos: sorteamos com a semente do primeiro andar da zona. */
  const zona = Math.floor((G.andar - 1) / 5), real = G.andar;
  G.andar = zona * 5 + 1;
  try { return mundo('mapa', () => gerarMapaBase(zona)); } finally { G.andar = real; }
}

function gerarMapaBase(zona) {
  const larguras = [pick([2, 3, 3, 3, 4]), pick([2, 3, 3, 4]), pick([2, 3, 3, 4]), pick([2, 3, 3]), 1];
  const nomes = shuffle(NOMES_PORTAS);
  const linhas = larguras.map((w, l) => Array.from({ length: w }, (_, i) => ({ id: `z${zona}l${l}n${i}`, linha: l, i, w, tipo: 'combate', nome: nomes[(l * 4 + i) % nomes.length], prox: [] })));
  const x = n => (n.i + 0.5) / n.w;

  /* ---- tipos de sala ---- */
  linhas.forEach((linha, l) => {
    const a = zona * 5 + l + 1;                                  // andar absoluto desta linha
    if (l === 4) { linha[0].tipo = 'chefe'; linha[0].nome = 'Portão do Chefão'; return; }
    const podeLoja = a >= 2 && !temMod('sem_loja');
    if (l === 3) {                                               // antes do chefão: sempre há fogueira (e talvez uma loja)
      const tipos = linha.map((_, i) => (i === 0 ? 'fogueira' : (podeLoja && chance(0.5) ? 'loja' : 'fogueira')));
      shuffle(tipos).forEach((t, i) => { linha[i].tipo = t; });
      return;
    }
    const pesos = { combate: 40, evento: 28, fogueira: 11, tesouro: 6 };
    if (podeLoja) pesos.loja = 9;
    if (a >= 3) pesos.elite = 9;
    const raros = new Set();                                     // elite, loja, fogueira e tesouro: no máximo 1 de cada por linha
    for (const n of linha) {
      let t = 'combate';
      for (let tent = 0; tent < 12; tent++) {
        const total = Object.values(pesos).reduce((s, w) => s + w, 0); let r = _r() * total;
        for (const [tp, w] of Object.entries(pesos)) { r -= w; if (r <= 0) { t = tp; break; } }
        if (t === 'combate' || t === 'evento' || !raros.has(t)) break;
        t = 'combate';
      }
      if (t !== 'combate' && t !== 'evento') raros.add(t);
      n.tipo = t;
    }
  });

  /* ---- caminhos: cada sala liga à vizinha mais próxima da linha de cima (e, às vezes, a mais uma) ---- */
  for (let l = 0; l < 4; l++) {
    const prox = linhas[l + 1];
    for (const n of linhas[l]) {
      const ord = [...prox].sort((p, q) => Math.abs(x(p) - x(n)) - Math.abs(x(q) - x(n)));
      n.prox.push(ord[0].id);
      if (l < 3 && ord[1] && Math.abs(x(ord[1]) - x(n)) <= 0.36 && chance(0.5)) n.prox.push(ord[1].id);
    }
    for (const p of prox) {                                      // nenhuma sala fica sem entrada
      if (!linhas[l].some(n => n.prox.includes(p.id))) {
        const perto = [...linhas[l]].sort((a, b) => Math.abs(x(a) - x(p)) - Math.abs(x(b) - x(p)))[0]; perto.prox.push(p.id);
      }
    }
  }
  /* toda sala da linha 2 alcança pelo menos uma fogueira antes do chefão */
  for (const n of linhas[2]) {
    if (!n.prox.some(id => linhas[3].find(p => p.id === id).tipo === 'fogueira')) {
      const fog = linhas[3].filter(p => p.tipo === 'fogueira').sort((a, b) => Math.abs(x(a) - x(n)) - Math.abs(x(b) - x(n)))[0]; n.prox.push(fog.id);
    }
  }
  return { zona, linhas, atual: null, trilha: [] };
}

function escolherSala() {
  C = null; G.loja = null; salvar(); hud();
  const zona = Math.floor((G.andar - 1) / 5), linha = (G.andar - 1) % 5, chefe = linha === 4;
  if (!G.mapa || G.mapa.zona !== zona) G.mapa = gerarMapa();
  const m = G.mapa, atual = m.atual ? achaNo(m.atual) : null;
  /* salas disponíveis: as ligadas à sala onde estamos (se pulamos um andar, vale qualquer sala da linha) */
  const disp = new Set(atual && atual.linha === linha - 1 ? atual.prox : m.linhas[linha].map(n => n.id));
  /* salas que ainda dá para alcançar a partir das disponíveis (as outras ficam apagadas) */
  const alcanca = new Set(disp); let front = [...disp];
  while (front.length) { const nx = []; for (const id of front) for (const p of achaNo(id).prox) if (!alcanca.has(p)) { alcanca.add(p); nx.push(p); } front = nx; }
  const X = n => 8 + 84 * (n.i + 0.5) / n.w, Y = n => 11 + n.linha * 20.5;   // entrada no topo, chefão embaixo (as salas disponíveis ficam visíveis sem rolar)
  const chefeDaZona = CHEFES[zona % CHEFES.length];
  let linhasSvg = '', nos = '';
  for (const lin of m.linhas) for (const n of lin) {
    for (const pid of n.prox) {
      const p = achaNo(pid), foi = m.trilha.includes(n.id) && m.trilha.includes(pid);
      const ativa = !!atual && n.id === atual.id && disp.has(pid);
      linhasSvg += `<line class="${foi ? 'feita' : ativa ? 'ativa' : alcanca.has(n.id) && alcanca.has(pid) ? 'futura' : 'longe'}" x1="${X(n).toFixed(1)}" y1="${Y(n)}" x2="${X(p).toFixed(1)}" y2="${Y(p)}" vector-effect="non-scaling-stroke"/>`;
    }
    const t = TIPOS_SALA[n.tipo], visitado = m.trilha.includes(n.id), ehDisp = disp.has(n.id), aqui = !!atual && atual.id === n.id;
    const estado = visitado ? 'visitado' : ehDisp ? 'disp' : alcanca.has(n.id) ? 'futuro' : 'longe';
    const nomeChefe = G.flags.rumor ? `${chefeDaZona.icone} ${chefeDaZona.nome}` : '???';
    nos += `<button class="no-mapa t-${n.tipo} ${estado} ${aqui ? 'aqui' : ''}" data-id="${n.id}" ${ehDisp && !visitado ? '' : 'disabled'} style="left:${X(n)}%;top:${Y(n)}%"
      title="${esc(n.nome)} — ${t.nome}: ${esc(t.dica)}"><span class="no-ico">${n.tipo === 'chefe' && G.flags.rumor ? chefeDaZona.icone : t.icone}</span><small>${n.tipo === 'chefe' ? esc(nomeChefe) : t.nome}</small>${aqui ? `<i class="marcador">${CLASSES[G.classe].icone}</i>` : ''}</button>`;
  }
  tela(`<div class="andar-tit"><small>${ZONAS[zonaIdx()]} · andar ${G.andar} de ${(zona + 1) * 5}</small><h2>${chefe ? 'O chefão espera' : 'Escolha seu caminho'}</h2>
      <p class="suave">${chefe ? 'Só resta uma porta. Boa sorte!' : 'Cada sala só leva às salas ligadas a ela. Planeje a rota!'}</p></div>
    <div class="mapa"><svg class="mapa-linhas" viewBox="0 0 100 100" preserveAspectRatio="none">${linhasSvg}</svg>${nos}<div class="mapa-entrada">🚪 Entrada da zona</div></div>
    <div class="mapa-info" id="mapa-info">Passe o mouse sobre uma sala para ver detalhes.</div>
    <div class="mapa-legenda">${Object.entries(TIPOS_SALA).map(([k, v]) => `<span>${v.icone} ${v.nome}</span>`).join('')}</div>
    ${G.flags.rumor && chefe ? '<p class="suave centro">🐱 O gato barman avisou sobre este chefão. Boa sorte!</p>' : ''}`);
  const info = $('#mapa-info');
  document.querySelectorAll('.no-mapa').forEach(b => {
    const n = achaNo(b.dataset.id), t = TIPOS_SALA[n.tipo];
    const mostra = () => { info.innerHTML = `<b>${t.icone} ${esc(n.nome)}</b> — ${t.nome}. <span class="suave">${esc(t.dica)}</span>`; };
    b.onmouseenter = b.onfocus = mostra;
    b.onclick = () => { if (b.disabled) return; Som.tocar('click'); m.atual = n.id; m.trilha.push(n.id); entrarSala(n); };
  });
}

/** Inimigos que podem aparecer agora. O que foi criado na Oficina não entra no Desafio do Dia (todos precisam ver a mesma masmorra). */
const poolInimigos = () => INIMIGOS.filter(i => i.min <= G.andar && (!i.custom || G.modo !== 'diario'));

function entrarSala(s) {
  G.ultimaSala = s.tipo;
  switch (s.tipo) {
    case 'combate': iniciarCombate(mundo('inimigo', () => pick(temMod('gnomos') ? GNOMOS : poolInimigos()))); break;
    case 'elite': {
      const t = mundo('elite', () => pick(temMod('gnomos') ? GNOMOS : poolInimigos()));
      iniciarCombate({ ...t, nome: 'Valente ' + t.nome }, { mhp: 1.8, matk: 1.3, mxp: 2.2, mouro: 2, elite: true }); break;
    }
    case 'chefe': {
      const idx = G.andar / 5 - 1, c = CHEFES[idx % CHEFES.length], ciclo = Math.floor(idx / CHEFES.length);
      iniciarCombate({ ...c, nome: c.nome + (ciclo ? ' (Versão Remix)' : '') }, { boss: true, mhp: (1 + ciclo * 0.6) * (temMod('chefes_gordos') ? 1.6 : 1), matk: 1 + ciclo * 0.4 }); break;
    }
    case 'evento': telaEvento(escolheEvento()); break;
    case 'loja': telaLoja(); break;
    case 'fogueira': telaEvento(SALA_FOGUEIRA); break;
    case 'tesouro': telaEvento(SALA_TESOURO); break;
  }
}

/** Decide o que acontece depois de terminar uma sala. */
function avancar() {
  if (G && G.teste) return voltarDaOficina();   // duelo de teste da Oficina: volta para lá, sem ranking nem save
  hud();
  checaConquistas();
  if (G.hp <= 0) return gameOver('Foi derrotado', { tipo: 'outro' });
  if (G.fila.length) return G.fila.shift()();
  if (G.pendCartas > 0) return telaCartas();
  G.andar++; escolherSala();
}

