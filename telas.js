'use strict';
/* =========================================================================
   TELAS — tela() desenha, hud() mostra a barra do herói; menu, escolha de classe e
   atributos, modificadores, Desafio do Dia, conquistas e avisos de sinergia.
   ========================================================================= */

/* ============ 4) TELAS ============ */
function tela(html, cls = '') {
  mus('modo', cls === 'combate-tela' ? (C && C.e && C.e.boss ? 2 : 1) : 0);   // combate = bateria; chefão = ainda mais intenso
  const p = $('#palco'); p.className = 'palco ' + cls; p.innerHTML = html;
  void p.offsetWidth; p.classList.add('entra'); window.scrollTo(0, 0);
}
const zonaIdx = () => Math.floor((G.andar - 1) / 5) % ZONAS.length;

function hud() {
  const h = $('#hud');
  pintaCenario(G ? 'z' + zonaIdx() : 'titulo');
  mus('muda', G ? 'z' + zonaIdx() : 'titulo');   // a música acompanha o cenário
  document.body.classList.toggle('no-menu', !G);
  if (!G) { h.hidden = true; document.body.dataset.zona = '0'; return; }
  h.hidden = false; document.body.dataset.zona = zonaIdx();
  checaSinergias();
  const st = stats(G), cl = CLASSES[G.classe];
  const pc = (a, b) => Math.max(0, Math.min(100, a / b * 100));
  h.innerHTML = `
    <div class="hud-id"><span class="hud-ico">${cl.icone}</span>
      <div><b>${esc(G.nome)}</b><br><small>Nv ${G.nivel} ${RACAS[G.raca] ? RACAS[G.raca].nome + ' ' : ''}${cl.nome} · Andar ${G.andar} · ${ZONAS[zonaIdx()]}${G.modo === 'diario' ? ' · 📅' : ''}${(G.mods || []).length ? ' · ' + iconesMods(G.mods) : ''}${(G.aliados || []).length ? ' · ' + G.aliados.map(a => ALIADOS[a.id].icone).join('') : ''}</small></div></div>
    <div class="hud-barras">
      <div class="barra hp"><i style="width:${pc(G.hp, st.hpMax)}%"></i><span>❤️ ${G.hp}/${st.hpMax}</span></div>
      <div class="barra en"><i style="width:${pc(G.en, st.enMax)}%"></i><span>⚡ ${G.en}/${st.enMax}</span></div>
      <div class="barra xp"><i style="width:${pc(G.xp, xpProx(G.nivel))}%"></i><span>✨ ${G.xp}/${xpProx(G.nivel)}</span></div>
    </div>
    <div class="hud-dir"><span class="ouro">💰 ${G.ouro}</span>
      <button class="btn mini" data-hud="ficha">🎒 Ficha</button>
      <button class="btn mini" data-hud="musica" title="Ligar/desligar só a música" style="${typeof Musica !== 'undefined' && !Musica.ligada ? 'opacity:.45;text-decoration:line-through' : ''}">🎵</button>
      <button class="btn mini" data-hud="som" title="Ligar/desligar todo o som">${Som.mudo ? '🔇' : '🔊'}</button></div>`;
}

/* ---- Título ---- */
function telaTitulo() {
  G = null; C = null; hud();
  const save = lerSave();
  tela(`<div class="titulo">
    <div class="logo">🐍⚔️🐉</div>
    <div class="pre-titulo">~ a lendária ~</div>
    <h1 class="nome-jogo">A Masmorra<br>do <span>Pythonildo</span></h1>
    <p class="sub">Escolha seu herói, tome decisões absurdas e descubra até onde você chega.<br>Quem for mais longe entra para a história da turma!</p>
    <div class="botoes-col">
      ${save ? `<button class="btn primario grande" id="b-cont">▶️ Continuar: ${esc(save.nome)} (andar ${save.andar})</button>` : ''}
      <button class="btn ${save ? '' : 'primario'} grande" id="b-novo">🎮 Nova aventura</button>
      <button class="btn grande diario-btn" id="b-diario">📅 Desafio do dia <small>${dataBonita(diaDeHoje())} · ${MODIFICADORES[modDoDia(diaDeHoje())].icone} ${MODIFICADORES[modDoDia(diaDeHoje())].nome}</small></button>
      <div class="linha centro"><button class="btn" id="b-rank">🏆 Ranking</button><button class="btn" id="b-conq">🏅 Conquistas <small>${Object.keys(Conquistas.todas()).length}/${CONQUISTAS.length}</small></button><button class="btn" id="b-oficina">🛠️ Oficina</button></div>
    </div>
    <div id="top5" class="mini-rank"></div>
    <div class="linha centro"><button class="btn mini discreto" id="b-mus">${typeof Musica !== 'undefined' && !Musica.ligada ? '🎵 Música: desligada' : '🎵 Música: ligada'}</button><button class="btn mini discreto" id="b-prof">👩‍🏫 Modo professor</button></div></div>`);
  $('#b-novo').onclick = () => { Som.tocar('click'); modoNovo = 'normal'; telaClasse(); };
  $('#b-diario').onclick = () => { Som.tocar('click'); telaDiario(); };
  $('#b-rank').onclick = () => { Som.tocar('click'); telaRanking(); };
  $('#b-conq').onclick = () => { Som.tocar('click'); telaConquistas(); };
  $('#b-oficina').onclick = () => { Som.tocar('click'); telaOficina(); };
  $('#b-prof').onclick = () => { Som.tocar('click'); telaProfessor(); };
  $('#b-mus').onclick = e => { mus('alterna'); e.target.textContent = typeof Musica !== 'undefined' && !Musica.ligada ? '🎵 Música: desligada' : '🎵 Música: ligada'; };
  if (save) $('#b-cont').onclick = () => {
    Som.tocar('click'); G = save; G.fila = []; G.bencaos = G.bencaos || [];
    G.mods = G.mods || []; G.modo = G.modo || 'normal'; G.est = { ...novoEst(), ...(G.est || {}) }; G.conq = G.conq || []; G.aliados = G.aliados || [];   // saves antigos
    escolherSala();
  };
  Rank.listar().then(l => {
    const el = $('#top5'); if (!el) return;
    el.innerHTML = `<h3>🏆 Top 5 ${Rank.servidor ? 'da turma' : '(neste navegador)'}</h3>` + (l.length
      ? l.slice(0, 5).map((e, i) => `<div class="linha-rank"><span>${['🥇', '🥈', '🥉', '4º', '5º'][i]} ${esc(e.nome)} ${CLASSES[e.classe] ? CLASSES[e.classe].icone : ''}${e.modo === 'diario' ? ' 📅' : ''}</span><b>${+e.score} pts · andar ${+e.andar}</b></div>`).join('')
      : '<p class="suave">Ninguém jogou ainda. Seja o primeiro!</p>');
  });
}

/* ---- Escolha de classe ---- */
/** Classes secretas ficam trancadas até a conquista certa (ou com ?liberar no endereço, para demonstrar). */
const classeLiberada = id => { const d = CLASSES[id].desbloqueio; return !d || !!Conquistas.todas()[d.conq] || /[?&]liberar/.test(location.search); };
/** Texto de ajuda para quem nunca jogou: com o que esta classe ataca e o que mais importa. */
const nomeAttr = k => `${ATRIBUTOS[k].icone} ${ATRIBUTOS[k].nome}`;
const guiaClasse = c => `<div class="info guia">🎯 <b>Ataca e lança habilidades com:</b> ${nomeAttr(c.principal)}</div>
      <div class="info guia">⭐ <b>Mais importantes:</b> ${c.foco.map(nomeAttr).join(' · ')}</div><p class="suave dica-classe">💡 ${c.dica}</p>`;
function telaClasse() {
  tela(`<h2>Escolha seu aventureiro</h2><div class="grid3 classes4">${Object.entries(CLASSES).map(([id, c]) => {
    const arma = itemPorId(c.arma), hab = HABILIDADES[c.habilidade];
    if (!classeLiberada(id)) return `<div class="card classe trancada" style="--cor:#555"><div class="grande-ico">🔒</div><h3>Classe secreta</h3>
      <p class="suave">Alguém contou que existe um quarto herói…</p><div class="info"><b>Para liberar:</b> ${c.desbloqueio.texto}</div></div>`;
    return `<div class="card classe" data-c="${id}" style="--cor:${c.cor}">
      <div class="grande-ico">${c.icone}</div><h3>${c.nome}</h3><p class="suave">${c.desc}</p>
      <div class="info"><b>Arma:</b> ${esc(arma.nome)}</div>
      <div class="info"><b>Habilidade:</b> ${hab.icone} ${hab.nome}</div>
      <div class="info"><b>Passiva:</b> ${c.passiva.nome} — ${c.passiva.desc}</div>
      ${guiaClasse(c)}
      <div class="mini-attrs">${Object.keys(ATRIBUTOS).map(a => `<span>${ATRIBUTOS[a].icone}${c.base[a]}</span>`).join('')}</div>
      <button class="btn primario">Escolher ${c.nome}</button></div>`;
  }).join('')}</div><button class="btn" id="b-voltar">⬅️ Voltar</button>`);
  document.querySelectorAll('.classe:not(.trancada)').forEach(el => el.onclick = () => { Som.tocar('click'); telaRaca(el.dataset.c); });   // classe → raça → atributos
  $('#b-voltar').onclick = telaTitulo;
}

/* ---- Distribuição de atributos ---- */
function telaAtributos(classeId, estado) {
  const cl = CLASSES[classeId];
  const S = estado || { attr: { ...cl.base }, pontos: 10, nome: '' };
  const rc = RACAS[racaNova], bonus = rc ? rc.attr : {};   // bônus da raça escolhida (aparecem ao lado dos atributos)
  const falso = { attr: racaAttr(S.attr, racaNova), raca: racaNova, nivel: 1, equip: { arma: itemPorId(cl.arma) }, skills: [cl.habilidade], bonusHp: 0, bonusAtk: 0, classe: classeId };
  const st = stats(falso);
  tela(`<h2>Modele seu ${rc ? rc.nome + ' ' : ''}${cl.nome} ${rc ? rc.icone : cl.icone}</h2>
    ${rc ? `<p class="suave centro">${rc.icone} <b>${rc.nome}</b>: ${chipsAttrRaca(rc)} · ${rc.passiva.nome}</p>` : ''}
    <div class="painel">
      <label class="campo">Nome do herói
        <div class="linha"><input id="nome" maxlength="20" placeholder="Ex.: Sir Pastelão" value="${esc(S.nome)}"><button class="btn mini" id="b-dado">🎲 Sortear</button></div></label>
      <p class="suave centro dica-classe">💡 <b>Dica para ${cl.nome}:</b> ${cl.dica}</p>
      <details class="como-funciona"><summary>❓ Como os atributos funcionam?</summary>
        <p>⚔️ <b>Dano:</b> arma + atributo principal × 1,2. Seu principal é ${nomeAttr(cl.principal)}.</p>
        <p>🎯 <b>Acerto:</b> d20 + (atributo principal ÷ 3) + bônus, contra a CA do inimigo.</p>
        <p>⚡ <b>Energia:</b> vem da Inteligência (e do nível) e paga as habilidades. Toda classe usa energia!</p>
        <p>❤️ <b>Vida e defesa:</b> vêm da Vitalidade. 🏹 <b>CA e esquiva:</b> vêm da Destreza.</p>
        <p>🍀 <b>Sorte:</b> crítico, itens raros e eventos.</p></details>
      <p>Pontos para distribuir: <b class="ouro" id="pts">${S.pontos}</b></p>
      ${Object.entries(ATRIBUTOS).map(([k, a]) => `
        <div class="attr-linha"><div class="attr-nome">${a.icone} <b>${a.nome}</b> ${k === cl.principal ? '<span class="selo principal">⭐ Principal: dano e acerto</span>' : cl.foco.includes(k) ? '<span class="selo importante">👍 Importante</span>' : ''}<br><small class="suave">${a.desc}</small></div>
          <div class="attr-ctl"><button class="btn mini" data-a="${k}" data-d="-1" ${S.attr[k] <= cl.base[k] ? 'disabled' : ''}>−</button>
          <span class="attr-val">${S.attr[k]}${bonus[k] ? ` <small class="${bonus[k] > 0 ? 'bom' : 'ruim'}">${bonus[k] > 0 ? '+' : '−'}${Math.abs(bonus[k])}</small>` : ''}</span>
          <button class="btn mini" data-a="${k}" data-d="1" ${S.pontos <= 0 ? 'disabled' : ''}>+</button></div></div>`).join('')}
      <div class="preview">❤️ Vida <b>${st.hpMax}</b> · ⚡ Energia <b>${st.enMax}</b> · ⚔️ Ataque <b>${st.atk}</b> · 🛡️ Defesa <b>${st.def}</b> · 🎯 Acerto <b>+${Math.floor(st.s[cl.principal] / 3) + st.acertoBase}</b> · 🛡️ CA <b>${st.ca}</b> · 🎲 Crítico <b>${st.critMin}${st.critMin < 20 ? '–20' : ''}</b></div>
      <div class="linha"><button class="btn" id="b-aleat">🎲 Distribuir aleatório</button><button class="btn" id="b-reset">↩️ Zerar</button></div>
    </div>
    <div class="linha centro"><button class="btn" id="b-voltar">⬅️ Voltar</button><button class="btn primario grande" id="b-ir" ${S.pontos > 0 ? 'disabled' : ''}>⚔️ Começar aventura!</button></div>`);
  $('#nome').oninput = e => { S.nome = e.target.value; };
  $('#b-dado').onclick = () => { S.nome = pick(NOMES_HEROIS); telaAtributos(classeId, S); };
  document.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const d = +b.dataset.d, k = b.dataset.a;
    if (d > 0 && S.pontos > 0 && S.attr[k] < 16) { S.attr[k]++; S.pontos--; }
    if (d < 0 && S.attr[k] > cl.base[k]) { S.attr[k]--; S.pontos++; }
    Som.tocar('click'); telaAtributos(classeId, S);
  });
  $('#b-aleat').onclick = () => { while (S.pontos > 0) { const k = pick(Object.keys(ATRIBUTOS)); if (S.attr[k] < 16) { S.attr[k]++; S.pontos--; } } telaAtributos(classeId, S); };
  $('#b-reset').onclick = () => telaAtributos(classeId, { attr: { ...cl.base }, pontos: 10, nome: S.nome });
  $('#b-voltar').onclick = () => telaRaca(classeId);
  $('#b-ir').onclick = () => {
    const nome = (S.nome || '').trim().slice(0, 20) || pick(NOMES_HEROIS);
    if (modoNovo === 'diario') {   // no desafio do dia, o modificador já vem decidido
      const dia = diaDeHoje();
      novaRun(nome, classeId, S.attr, { modo: 'diario', dia, mods: [modDoDia(dia)], raca: racaNova }); Som.tocar('inicio'); escolherSala();
    } else telaModificadores(classeId, nome, S.attr);
  };
}

/* ---- Modificadores: regras malucas que dão pontos extras ---- */
function telaModificadores(classeId, nome, attr, sel = []) {
  const cl = CLASSES[classeId], mult = multMods(sel);
  tela(`<h2>Alguma regra maluca? 😈</h2>
    <p class="suave centro">Cada modificador deixa a aventura mais difícil, mas aumenta sua pontuação final. Escolha até ${MAX_MODS}.</p>
    <div class="grid3 mods">${Object.entries(MODIFICADORES).map(([id, m]) => {
      const on = sel.includes(id), cheio = !on && sel.length >= MAX_MODS;
      return `<button class="card mod ${on ? 'ativo' : ''}" data-m="${id}" ${cheio ? 'disabled' : ''}>
        <div class="grande-ico">${m.icone}</div><h3>${m.nome}</h3><p class="suave">${m.desc}</p>
        <b class="${on ? 'bom' : 'ouro'}">+${Math.round(m.bonus * 100)}% pontos</b></button>`;
    }).join('')}</div>
    <div class="painel pequeno centro">${cl.icone} <b>${esc(nome)}</b> · Multiplicador de pontos: <b class="ouro">×${mult.toFixed(2)}</b> ${sel.length ? iconesMods(sel) : '<span class="suave">(nenhum modificador)</span>'}</div>
    <div class="linha centro"><button class="btn" id="b-voltar">⬅️ Voltar</button>
      <button class="btn primario grande" id="b-ir">${sel.length ? '😈 Começar com as regras!' : '⚔️ Começar normal'}</button></div>`);
  document.querySelectorAll('.mod').forEach(b => b.onclick = () => {
    const id = b.dataset.m, i = sel.indexOf(id);
    Som.tocar('click'); telaModificadores(classeId, nome, attr, i >= 0 ? sel.filter(x => x !== id) : [...sel, id]);
  });
  $('#b-voltar').onclick = () => telaAtributos(classeId, { attr: { ...attr }, pontos: 0, nome });
  $('#b-ir').onclick = () => { novaRun(nome, classeId, attr, { mods: sel, raca: racaNova }); Som.tocar('inicio'); escolherSala(); };
}

/* ---- Desafio do dia ---- */
async function telaDiario() {
  const dia = diaDeHoje(), md = MODIFICADORES[modDoDia(dia)];
  tela(`<h2>📅 Desafio do dia — ${dataBonita(dia)}</h2><p class="suave centro">Carregando…</p>`);
  const lista = (await Rank.listar()).filter(e => e.modo === 'diario' && e.dia === dia);
  const vistos = new Set(), melhores = lista.filter(e => { const k = String(e.nome).toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; });
  tela(`<h2>📅 Desafio do dia — ${dataBonita(dia)}</h2>
    <p class="suave centro">Hoje <b>todos</b> enfrentam a mesma masmorra: mesmas salas, mesmos inimigos, mesmos eventos. Só muda o que cada um escolhe fazer!</p>
    <div class="painel centro"><div class="grande-ico">${md.icone}</div><h3>Regra de hoje: ${md.nome}</h3><p class="suave">${md.desc}</p>
      <b class="ouro">+${Math.round(md.bonus * 100)}% pontos</b></div>
    <div class="painel"><h3>🏆 Quem foi mais longe hoje</h3>${melhores.length ? melhores.slice(0, 10).map((e, i) => `
      <div class="linha-rank"><span>${['🥇', '🥈', '🥉'][i] || (i + 1) + 'º'} ${CLASSES[e.classe] ? CLASSES[e.classe].icone : ''} <b>${esc(e.nome)}</b>${e.titulo ? ` <small class="suave">${esc(e.titulo)}</small>` : ''}</span><b>${+e.score} pts · andar ${+e.andar}</b></div>`).join('')
      : '<p class="suave centro">Ninguém jogou hoje ainda. Seja o primeiro!</p>'}
      ${Rank.servidor ? '' : '<p class="suave centro"><small>🟡 Sem servidor: só aparecem os jogos feitos neste navegador.</small></p>'}</div>
    <div class="linha centro"><button class="btn" id="b-voltar">⬅️ Voltar</button><button class="btn primario grande" id="b-ir">⚔️ Aceitar o desafio</button></div>`);
  $('#b-voltar').onclick = telaTitulo;
  $('#b-ir').onclick = () => { Som.tocar('click'); modoNovo = 'diario'; telaClasse(); };
}

/* ---- Galeria de conquistas ---- */
function telaConquistas() {
  const tem = Conquistas.todas(), n = Object.keys(tem).length;
  tela(`<h2>🏅 Conquistas <small>${n}/${CONQUISTAS.length}</small></h2>
    <p class="suave centro">Conquistas ganhas ficam guardadas neste navegador. A mais rara de cada aventura vira o seu <b>título</b> no ranking!</p>
    <div class="grid3 conqs">${CONQUISTAS.map(c => `
      <div class="painel conq ${tem[c.id] ? 'ganha' : 'trancada'}"><div class="grande-ico">${tem[c.id] ? c.icone : '🔒'}</div>
        <h3>${tem[c.id] ? c.nome : '???'}</h3><p class="suave">${c.desc}</p>
        <small class="${tem[c.id] ? 'ouro' : 'suave'}">${'⭐'.repeat(c.rar)} ${tem[c.id] ? 'Título: ' + c.titulo : ''}</small></div>`).join('')}</div>
    <div class="linha centro"><button class="btn primario" id="b-voltar">⬅️ Voltar</button></div>`);
  $('#b-voltar').onclick = telaTitulo;
}

/** Avisa quando uma sinergia liga (ou desliga) por causa de um item ou habilidade novo. */
function checaSinergias() {
  const ids = sinergiasAtivas(G).map(s => s.id);
  if (!G.sinAtivas) { G.sinAtivas = ids; return; }   // primeira vez (ou save antigo): sem aviso
  for (const id of ids) if (!G.sinAtivas.includes(id)) {
    const s = SINERGIAS.find(x => x.id === id);
    toast(`🔗 <b>Sinergia ativada:</b> ${s.icone} ${s.nome}<br><small>${s.desc}</small>`, 'conq'); Som.tocar('raro');
  }
  for (const id of G.sinAtivas) if (!ids.includes(id)) {
    const s = SINERGIAS.find(x => x.id === id); if (s) toast(`💔 Sinergia perdida: ${s.icone} ${s.nome}`);
  }
  G.sinAtivas = ids;
}

/** Confere se alguma conquista foi ganha agora e avisa na tela. */
function checaConquistas(fim = false) {
  if (!G) return;
  for (const c of CONQUISTAS) {
    if (G.conq.includes(c.id)) continue;
    let ok = false; try { ok = c.teste(G, fim); } catch (e) { ok = false; }
    if (ok) {
      G.conq.push(c.id); toast(`${c.icone} <b>Conquista:</b> ${c.nome}`, 'conq'); Som.tocar('raro');
      if (Conquistas.grava([c.id]).length) {          // primeira vez que ganha, em qualquer aventura
        (G.novas = G.novas || []).push(c.id);
        for (const [cid, cl] of Object.entries(CLASSES)) if (cl.desbloqueio && cl.desbloqueio.conq === c.id) toast(`🔓 <b>Nova classe liberada:</b> ${cl.icone} ${cl.nome}!`, 'conq');
        for (const [rid, rc] of Object.entries(RACAS)) if (rc.desbloqueio && rc.desbloqueio.conq === c.id) toast(`🔓 <b>Nova raça liberada:</b> ${rc.icone} ${rc.nome}!`, 'conq');
      }
    }
  }
}

