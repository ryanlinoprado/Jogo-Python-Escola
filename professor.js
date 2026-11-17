'use strict';
/* ============================================================
   MODO PROFESSOR
   • 📺 Projetor: ranking gigante que se atualiza sozinho, para a lousa.
   • 📊 Estatísticas da turma: o que mais derrota os alunos, chefões
     mais letais, classes preferidas, epitáfios engraçados…
   • 🧹 Moderação: apagar uma partida, zerar o ranking, remover criações
     da Oficina e baixar tudo em planilha (CSV).
   Apagar só funciona no computador que roda o servidor.py — alunos
   em outros computadores veem tudo, mas não conseguem apagar.
   ============================================================ */

const Prof = { admin: false, servidor: false, lista: [], oficina: { inimigos: [], itens: [] }, timer: null, aba: 'stats' };

/* Apagar do ranking (servidor ou, sem servidor, o ranking guardado neste navegador) */
Rank.apaga = async function (id) {
  if (this.servidor) {
    const r = await fetch('/api/rank?id=' + encodeURIComponent(id), { method: 'DELETE' });
    if (!r.ok) throw new Error(r.status === 403 ? 'Só dá para apagar no computador do professor (onde o servidor roda).' : 'o servidor recusou');
  } else store.set('masmorra_rank', JSON.stringify(this.local().filter(e => e.id !== id)));
};
Rank.zerar = async function () {
  if (this.servidor) {
    const r = await fetch('/api/rank?todos=1', { method: 'DELETE' });
    if (!r.ok) throw new Error(r.status === 403 ? 'Só dá para zerar no computador do professor (onde o servidor roda).' : 'o servidor recusou');
  }
  store.del('masmorra_rank');
};

async function profCarrega() {
  Prof.lista = await Rank.listar(); Prof.servidor = Rank.servidor;
  Prof.admin = !Prof.servidor;                         // sem servidor, quem usa é o próprio professor
  if (Prof.servidor) {
    try { Prof.admin = !!(await (await fetch('/api/professor', { cache: 'no-store' })).json()).admin; } catch (e) { Prof.admin = false; }
    try { const j = await (await fetch('/api/oficina', { cache: 'no-store' })).json(); Prof.oficina = { inimigos: j.inimigos || [], itens: j.itens || [] }; } catch (e) { Prof.oficina = { inimigos: [], itens: [] }; }
  } else Prof.oficina = { inimigos: [], itens: [] };
}

/* ---------- Estatísticas ---------- */
const profCausa = c => String(c || '').replace(/^Derrotado por /, '').replace(' (Versão Remix)', '').trim().slice(0, 60);
const profConta = arr => { const m = {}; arr.forEach(k => { if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
function estatisticas(l) {
  const n = l.length, soma = l.reduce((s, e) => s + (+e.andar || 0), 0), recorde = l.reduce((m, e) => (+e.andar > (m ? +m.andar : -1) ? e : m), null);
  const nomesChefes = CHEFES.map(c => c.nome);
  const zonas = ZONAS.map((z, i) => [`${z} (andares ${i * 5 + 1}–${i * 5 + 5})`, l.filter(e => Math.floor((+e.andar - 1) / 5) % ZONAS.length === i).length]);
  return {
    n, jogadores: new Set(l.map(e => String(e.nome).toLowerCase())).size, media: n ? soma / n : 0, recorde,
    classes: profConta(l.map(e => e.classe)), racas: profConta(l.map(e => e.raca)), causas: profConta(l.map(e => profCausa(e.causa))).slice(0, 6),
    chefes: profConta(l.map(e => nomesChefes.find(nm => profCausa(e.causa).startsWith(nm)))).slice(0, 5),
    mods: profConta(l.flatMap(e => e.mods || [])), diario: l.filter(e => e.modo === 'diario').length,
    conq: profConta(l.flatMap(e => e.conq || [])).slice(0, 5), aliados: profConta(l.flatMap(e => e.aliados || [])).slice(0, 5), zonas,
    epitafios: l.filter(e => e.epitafio),
  };
}
function profBarras(pares, rotulo = x => x) {
  if (!pares.length) return '<p class="suave">Sem dados ainda.</p>';
  const max = Math.max(...pares.map(p => p[1]), 1);
  return pares.map(([k, v]) => `<div class="pbarra"><span class="pb-rot">${rotulo(k)}</span><span class="pb-trilho"><i style="width:${Math.round(v / max * 100)}%"></i></span><b>${v}</b></div>`).join('');
}

/* ---------- Tela principal do professor ---------- */
async function telaProfessor(aba = Prof.aba) {
  clearInterval(Prof.timer); Prof.aba = aba;
  tela('<h2>👩‍🏫 Modo Professor</h2><p class="suave centro">Carregando…</p>');
  await profCarrega();
  const avisoAdmin = Prof.admin ? '' : '<p class="painel pequeno centro">🔒 Você está vendo tudo, mas <b>apagar</b> só funciona no computador que roda o servidor. Abra <code>http://localhost:8080</code> lá.</p>';
  const corpo = aba === 'mod' ? profModeracaoHtml() : profEstatisticasHtml();
  tela(`<h2>👩‍🏫 Modo Professor</h2>
    <p class="suave centro">${Prof.servidor ? '🟢 Servidor da turma conectado.' : '🟡 Sem servidor: mostrando só as partidas deste navegador.'} ${Prof.lista.length} partida(s) no ranking.</p>
    <div class="linha centro"><button class="btn primario grande" id="p-proj">📺 Projetar ranking</button></div>
    <div class="linha centro"><button class="btn ${aba === 'stats' ? 'primario' : ''}" data-paba="stats">📊 Estatísticas</button><button class="btn ${aba === 'mod' ? 'primario' : ''}" data-paba="mod">🧹 Moderação</button><button class="btn" id="b-voltar">⬅️ Voltar</button></div>
    ${avisoAdmin}${corpo}`);
  $('#p-proj').onclick = () => telaProjetor();
  $('#b-voltar').onclick = telaTitulo;
  document.querySelectorAll('[data-paba]').forEach(b => b.onclick = () => telaProfessor(b.dataset.paba));
  if (aba === 'mod') profLigaModeracao(); else { const a = $('#p-atualiza'); if (a) a.onclick = () => telaProfessor('stats'); }
}

function profEstatisticasHtml() {
  const s = estatisticas(Prof.lista);
  if (!s.n) return '<div class="painel centro"><p class="suave">Ninguém jogou ainda. Peça aos alunos para fazerem uma aventura e volte aqui!</p></div>';
  const cl = k => (CLASSES[k] ? `${CLASSES[k].icone} ${CLASSES[k].nome}` : esc(k));
  const mural = [...s.epitafios].sort(() => Math.random() - 0.5).slice(0, 5);
  return `<div class="grid-prof">
    <div class="painel"><h3>📌 Resumo</h3><div class="grid-stats">
      <div class="stat"><b>${s.n}</b><small>Partidas</small></div><div class="stat"><b>${s.jogadores}</b><small>Jogadores</small></div>
      <div class="stat"><b>${s.media.toFixed(1)}</b><small>Andar médio</small></div><div class="stat"><b>${s.recorde ? +s.recorde.andar : 0}</b><small>Recorde${s.recorde ? ' · ' + esc(s.recorde.nome) : ''}</small></div></div>
      <small class="suave">📅 ${s.diario} partida(s) no Desafio do Dia</small></div>
    <div class="painel"><h3>🗺️ Até onde a turma chega</h3>${profBarras(s.zonas)}</div>
    <div class="painel"><h3>🎭 Classes preferidas</h3>${profBarras(s.classes, cl)}</div>
    <div class="painel"><h3>🧬 Raças preferidas</h3>${profBarras(s.racas, k => (RACAS[k] ? `${RACAS[k].icone} ${RACAS[k].nome}` : esc(k)))}</div>
    <div class="painel"><h3>💀 O que mais derrota a turma</h3>${profBarras(s.causas, esc)}</div>
    <div class="painel"><h3>👑 Chefões mais letais</h3>${profBarras(s.chefes, esc)}</div>
    <div class="painel"><h3>😈 Modificadores escolhidos</h3>${profBarras(s.mods, id => (MODIFICADORES[id] ? MODIFICADORES[id].icone + ' ' + MODIFICADORES[id].nome : esc(id)))}</div>
    <div class="painel"><h3>🏅 Conquistas mais comuns</h3>${profBarras(s.conq, id => (conquistaPorId(id) ? conquistaPorId(id).icone + ' ' + conquistaPorId(id).nome : esc(id)))}</div>
    <div class="painel"><h3>🐾 Companheiros mais levados</h3>${profBarras(s.aliados, id => (ALIADOS[id] ? ALIADOS[id].icone + ' ' + ALIADOS[id].nome : esc(id)))}</div>
    <div class="painel largo"><h3>⚰️ Mural de epitáfios</h3>${mural.length ? mural.map(e => `<p class="epi-mural">“${esc(e.epitafio)}” <small class="suave">— ${esc(e.nome)}, andar ${+e.andar}</small></p>`).join('') : '<p class="suave">Nenhum epitáfio ainda.</p>'}</div>
  </div><div class="linha centro"><button class="btn" id="p-atualiza">🔄 Atualizar</button></div>`;
}

/* ---------- Moderação ---------- */
const csvCelula = v => { let t = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };   // aspas + proteção contra fórmulas de planilha
function baixaCsv() {
  const cab = ['nome', 'classe', 'raca', 'andar', 'pontos', 'nivel', 'abates', 'chefoes', 'causa', 'modo', 'dia', 'data'];
  const linhas = Prof.lista.map(e => [e.nome, e.classe, e.raca || '', e.andar, e.score, e.nivel, e.kills, e.chefes, e.causa, e.modo || 'normal', e.dia || '', e.data].map(csvCelula).join(';'));
  const blob = new Blob(['﻿' + cab.join(';') + '\n' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ranking-${diaDeHoje()}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('📄 Planilha baixada!');
}

function profModeracaoHtml() {
  const dis = Prof.admin ? '' : 'disabled';
  const linhaRank = e => `<div class="tr-mod"><span>${CLASSES[e.classe] ? CLASSES[e.classe].icone : ''} <b>${esc(e.nome)}</b> ${e.titulo ? `<small class="ouro">${esc(e.titulo)}</small>` : ''}<br><small class="suave">${esc(e.causa || '')} · ${esc(String(e.data || '').slice(0, 16).replace('T', ' '))}</small></span><span>Andar <b>${+e.andar}</b></span><span>${+e.score} pts</span><button class="btn mini" data-del-rank="${esc(e.id)}" ${dis}>🗑️</button></div>`;
  const of = [...Prof.oficina.inimigos.map(x => ({ ...x, t: 'inimigo' })), ...Prof.oficina.itens.map(x => ({ ...x, t: 'item' }))];
  const linhaOf = x => `<div class="tr-mod"><span>${x.t === 'inimigo' ? ((x.dados && x.dados.icone) || '👹') : '⚔️'} <b>${esc((x.dados && x.dados.nome) || '?')}</b><br><small class="suave">${x.t} · por ${esc(x.autor || '?')}</small></span><span></span><span></span><button class="btn mini" data-del-of="${esc(x.id)}" ${dis}>🗑️</button></div>`;
  return `<div class="painel"><h3>🏆 Partidas no ranking</h3>
      <div class="linha"><button class="btn" id="p-csv" ${Prof.lista.length ? '' : 'disabled'}>📄 Baixar planilha (CSV)</button><button class="btn perigo" id="p-zera" ${dis}>🧨 Zerar o ranking</button></div>
      ${Prof.lista.length ? Prof.lista.slice(0, 80).map(linhaRank).join('') : '<p class="suave">Ranking vazio.</p>'}
      ${Prof.lista.length > 80 ? `<p class="suave centro">Mostrando as 80 primeiras de ${Prof.lista.length}.</p>` : ''}</div>
    <div class="painel"><h3>🛠️ Criações da turma (Oficina)</h3>
      ${Prof.servidor ? `<div class="linha"><button class="btn perigo" id="p-zera-of" ${dis || !of.length ? 'disabled' : ''}>🧨 Remover todas</button></div>${of.length ? of.map(linhaOf).join('') : '<p class="suave">Nada publicado.</p>'}` : '<p class="suave">Sem servidor não há criações compartilhadas.</p>'}</div>`;
}

function profLigaModeracao() {
  const refaz = () => telaProfessor('mod');
  const tenta = async fn => { try { await fn(); } catch (e) { toast('🚫 ' + (e.message === 'Failed to fetch' ? 'sem servidor' : e.message)); } };
  const csv = $('#p-csv'); if (csv) csv.onclick = baixaCsv;
  document.querySelectorAll('[data-del-rank]').forEach(b => b.onclick = () => tenta(async () => { if (!confirm('Apagar esta partida do ranking?')) return; await Rank.apaga(b.dataset.delRank); refaz(); }));
  const z = $('#p-zera'); if (z) z.onclick = () => tenta(async () => {
    if (!confirm(`Zerar TODO o ranking (${Prof.lista.length} partidas)? Isso não pode ser desfeito.`)) return;
    if (!confirm('Tem certeza mesmo? Baixe a planilha antes se quiser guardar os resultados.')) return;
    await Rank.zerar(); toast('🧨 Ranking zerado.'); refaz();
  });
  document.querySelectorAll('[data-del-of]').forEach(b => b.onclick = () => tenta(async () => {
    if (!confirm('Remover esta criação da turma?')) return;
    const r = await fetch(`/api/oficina?id=${encodeURIComponent(b.dataset.delOf)}&admin=1`, { method: 'DELETE' });
    if (!r.ok) throw new Error(r.status === 403 ? 'Só no computador do professor.' : 'o servidor recusou');
    await Oficina.baixaTurma(); refaz();
  }));
  const zo = $('#p-zera-of'); if (zo) zo.onclick = () => tenta(async () => {
    if (!confirm('Remover TODAS as criações publicadas pela turma?')) return;
    const r = await fetch('/api/oficina?todos=1&admin=1', { method: 'DELETE' });
    if (!r.ok) throw new Error(r.status === 403 ? 'Só no computador do professor.' : 'o servidor recusou');
    await Oficina.baixaTurma(); toast('🧨 Criações removidas.'); refaz();
  });
}

/* ---------- 📺 Projetor ---------- */
async function telaProjetor() {
  clearInterval(Prof.timer); if (typeof Musica !== 'undefined') Musica.muda('silencio');   // projetor silencioso
  tela('<div class="proj" id="proj"><h1>🏆 Carregando…</h1></div>', 'proj-tela');
  let n = 0;
  const render = async () => {
    const el = $('#proj'); if (!el) { clearInterval(Prof.timer); return; }
    const l = await Rank.listar(); Prof.lista = l;
    const dia = diaDeHoje(), md = MODIFICADORES[modDoDia(dia)], agora = Date.now();
    const vistos = new Set();
    const hoje = l.filter(e => e.modo === 'diario' && e.dia === dia).filter(e => { const k = String(e.nome).toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; });
    const recentes = [...l].sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 4);
    const epis = l.filter(e => e.epitafio), epi = epis.length ? epis[n++ % epis.length] : null;
    const linha = (e, i, grande) => `<div class="proj-linha ${agora - new Date(e.data).getTime() < 600000 ? 'novo' : ''} ${grande ? '' : 'peq'}"><span class="pos">${['🥇', '🥈', '🥉'][i] || (i + 1) + 'º'}</span>
      <span class="nm">${CLASSES[e.classe] ? CLASSES[e.classe].icone : ''} ${esc(e.nome)}${e.titulo ? ` <small>${esc(e.titulo)}</small>` : ''}${e.modo === 'diario' ? ' 📅' : ''}</span><span class="and">Andar ${+e.andar}</span><span class="pts">${+e.score}</span></div>`;
    el.innerHTML = `<div class="proj-topo"><h1>🏆 Ranking da Turma</h1><div class="proj-meta">${l.length} partida(s) · atualizado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}${Rank.servidor ? '' : ' · 🟡 sem servidor'}</div></div>
      <div class="proj-cols"><div class="proj-geral">${l.length ? l.slice(0, 10).map((e, i) => linha(e, i, true)).join('') : '<p class="proj-vazio">Ninguém jogou ainda. Quem será o primeiro?</p>'}</div>
        <div class="proj-lateral"><h2>📅 Desafio de hoje</h2><div class="proj-regra">${md.icone} <b>${md.nome}</b><br><small>${md.desc}</small></div>
          ${hoje.length ? hoje.slice(0, 5).map((e, i) => linha(e, i, false)).join('') : '<p class="proj-vazio peq">Ninguém ainda hoje.</p>'}
          <h2>🆕 Últimas partidas</h2>${recentes.length ? recentes.map(e => `<div class="proj-rec"><b>${CLASSES[e.classe] ? CLASSES[e.classe].icone : ''} ${esc(e.nome)}</b> · andar ${+e.andar}<br><small>${esc(e.epitafio || e.causa || '')}</small></div>`).join('') : ''}</div></div>
      ${epi ? `<div class="proj-rodape">💀 “${esc(epi.epitafio)}” <small>— ${esc(epi.nome)}</small></div>` : ''}
      <div class="proj-botoes"><button class="btn mini" id="pj-sair">⬅️ Sair</button><button class="btn mini" id="pj-tela">⛶ Tela cheia</button><button class="btn mini" id="pj-atual">🔄</button></div>`;
    $('#pj-sair').onclick = () => { clearInterval(Prof.timer); if (document.fullscreenElement) document.exitFullscreen(); telaProfessor(); };
    $('#pj-tela').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => toast('Seu navegador não liberou a tela cheia.')); };
    $('#pj-atual').onclick = render;
  };
  await render();
  Prof.timer = setInterval(render, 8000);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#proj')) { clearInterval(Prof.timer); telaProfessor(); } });
