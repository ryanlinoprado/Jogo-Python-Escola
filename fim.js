'use strict';
/* =========================================================================
   FIM — game over (com a moeda de Lysara e o seguro), pontuação, lápide compartilhável e ranking.
   ========================================================================= */

/* ============ 8) FIM DE JOGO E RANKING ============ */
/** Pontuação = (andar, abates, chefões, itens, ouro) × multiplicador dos modificadores. */
const pontosBase = () => G.andar * 100 + G.kills * 10 + G.chefes * 150 + G.pontosItens + Math.floor(G.ouroTotal / 5);
const calculaScore = () => Math.round(pontosBase() * multMods(G.mods));

async function gameOver(causa, info = {}) {
  if (G && G.teste) { toast('💀 Você perdeu o duelo de teste. Ajuste o inimigo e tente de novo!'); return voltarDaOficina(); }
  /* A moeda de Lysara salva o herói da morte uma única vez. */
  if (G.flags.moedaLysara) {
    G.flags.moedaLysara = false; G.est.moeda++; checaConquistas(); C = null; G.fila = [];
    G.hp = Math.max(1, Math.round(stats(G).hpMax * 0.3)); hud(); Som.tocar('raro');
    tela(`<div class="evento"><div class="grande-ico">🍀</div><h2>Lysara te salva!</h2>
      <div class="texto-evento">Você sente a moeda dourada esquentar no bolso. O mundo escurece… e uma gargalhada ecoa: <i>“Ops! Ainda não é a sua hora!”</i> Você acorda em outro lugar, com 30% de vida. A moeda virou pó dourado.</div>
      <button class="btn primario grande" id="b-cont">Continuar ➡️</button></div>`);
    $('#b-cont').onclick = () => { G.andar++; escolherSala(); };
    return;
  }
  /* O Seguro de Vida do gnomo vendedor (evento "seguro" em eventos2.js) também salva uma vez. */
  if (G.flags.seguro) {
    G.flags.seguro = false; C = null; G.fila = [];
    G.hp = Math.max(1, Math.round(stats(G).hpMax * 0.25)); hud(); Som.tocar('raro');
    tela(`<div class="evento"><div class="grande-ico">💼</div><h2>Sinistro confirmado!</h2>
      <div class="texto-evento">Do nada, o gnomo aparece de terno e gravata, com uma prancheta: <i>“Sinistro registrado! Cobertura parcial: 25% de vida. Franquia: 100% da sua dignidade. Protocolo 4815162342.”</i> Você acorda em outro lugar. A apólice cancelou na hora.</div>
      <button class="btn primario grande" id="b-cont">Continuar ➡️</button></div>`);
    $('#b-cont').onclick = () => { G.andar++; escolherSala(); };
    return;
  }
  if (racaRevive()) return;   // o Morto-vivo levanta uma vez
  if (info.inimigo === CONDE_VLAD.nome) { G.flags.mordido = true; info = { ...info, vlad: true }; }   // perder para o Conde libera o Vampiro
  store.del('masmorra_save');
  fechaModal(); hud();
  checaConquistas(true);
  const epitafio = criaEpitafio({ ...info, heroi: G.nome, classe: G.classe, raca: G.raca, andar: G.andar, mods: G.mods, aliados: G.aliados.map(a => ALIADOS[a.id].nome) });
  const entrada = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    nome: G.nome, classe: G.classe, raca: G.raca || '', andar: G.andar, score: calculaScore(), nivel: G.nivel, kills: G.kills, chefes: G.chefes,
    item: G.melhor ? { nome: G.melhor.nome, raridade: G.melhor.raridade } : null,
    causa: String(causa).slice(0, 80), data: new Date().toISOString(),
    epitafio, titulo: tituloDaRun(G.conq), conq: [...G.conq], mods: [...G.mods], mult: Math.round(multMods(G.mods) * 100),
    modo: G.modo, dia: G.dia, aliados: G.aliados.map(a => a.id),
  };
  ultimoId = entrada.id;
  Conquistas.grava(G.conq);
  const novas = G.novas || [];   // conquistas que foram ganhas pela primeira vez nesta aventura
  const resumo = { ...entrada, ouro: G.ouroTotal, novas, ultimas: pick(EPITAFIOS) };
  tela('<div class="titulo"><div class="logo">💀</div><h2>Gravando sua lenda…</h2></div>');
  Som.tocar('lose');
  const lista = await Rank.salvar(entrada);
  const pos = lista.findIndex(e => e.id === entrada.id) + 1;
  G = null; hud(); mus('muda', 'fim');   // música triste na lápide
  ultimaLapide = resumo;
  tela(`<div class="titulo gameover"><h1>Fim da aventura</h1>
    ${htmlLapide(resumo)}
    <div class="linha centro"><button class="btn" id="b-copia">📋 Copiar para compartilhar</button><button class="btn" id="b-img">🖼️ Baixar imagem</button></div>
    ${novas.length ? `<div class="painel pequeno centro"><b class="ouro">🏅 Novas conquistas!</b><br>${novas.map(id => { const c = conquistaPorId(id); return c ? `${c.icone} <b>${c.nome}</b> <small class="suave">— ${c.desc}</small>` : ''; }).join('<br>')}</div>` : ''}
    <div class="grid-stats">
      <div class="stat"><b>${resumo.andar}</b><small>Andar alcançado</small></div><div class="stat"><b>${resumo.score}</b><small>Pontuação</small></div>
      <div class="stat"><b>${resumo.nivel}</b><small>Nível</small></div><div class="stat"><b>${resumo.kills}</b><small>Inimigos</small></div>
      <div class="stat"><b>${resumo.chefes}</b><small>Chefões</small></div><div class="stat"><b>#${pos || '?'}</b><small>No ranking ${Rank.servidor ? 'da turma' : 'local'}</small></div></div>
    ${resumo.item ? `<p>Melhor item: <b style="color:${RARIDADES[resumo.item.raridade].cor}">${esc(resumo.item.nome)}</b> (${RARIDADES[resumo.item.raridade].nome})</p>` : ''}
    <div class="botoes-col"><button class="btn primario grande" id="b-novo">🎮 Jogar de novo</button><button class="btn grande" id="b-rank">🏆 Ver ranking</button></div></div>`);
  $('#b-novo').onclick = () => { modoNovo = 'normal'; telaClasse(); }; $('#b-rank').onclick = () => telaRanking();
  $('#b-copia').onclick = () => copiarLapide(resumo);
  $('#b-img').onclick = () => baixarLapide(resumo);
}

/* ---- Lápide compartilhável ---- */
let ultimaLapide = null;
const chipsMods = r => (r.mods || []).filter(id => MODIFICADORES[id]).map(id => `${MODIFICADORES[id].icone} ${MODIFICADORES[id].nome}`);
const iconesConq = r => (r.conq || []).map(id => (conquistaPorId(id) || {}).icone || '').join('');

function htmlLapide(r) {
  const cl = CLASSES[r.classe] || { icone: '🧑', nome: '' };
  return `<div class="lapide"><div class="lapide-rip">⚰️ Aqui jaz</div>
    <div class="lapide-ico">${cl.icone}</div><h2>${esc(r.nome)}</h2>
    ${r.titulo ? `<div class="lapide-titulo">${esc(r.titulo)}</div>` : ''}
    ${RACAS[r.raca] ? `<div class="lapide-mods">${RACAS[r.raca].icone} ${RACAS[r.raca].nome} ${esc(cl.nome)}</div>` : ''}
    <p class="lapide-epi">“${esc(r.epitafio)}”</p>
    <div class="lapide-info">🏔️ Andar <b>${+r.andar}</b> · 🏆 <b>${+r.score}</b> pontos${r.mult > 100 ? ` <small>(×${(r.mult / 100).toFixed(2)})</small>` : ''} · Nv ${+r.nivel}</div>
    ${r.modo === 'diario' ? `<div class="lapide-mods">📅 Desafio do dia ${dataBonita(r.dia)}</div>` : ''}
    ${chipsMods(r).length ? `<div class="lapide-mods">${chipsMods(r).map(esc).join(' · ')}</div>` : ''}
    ${(r.aliados || []).filter(id => ALIADOS[id]).length ? `<div class="lapide-mods">🐾 ${r.aliados.filter(id => ALIADOS[id]).map(id => ALIADOS[id].icone + ' ' + ALIADOS[id].nome).map(esc).join(' · ')}</div>` : ''}
    ${iconesConq(r) ? `<div class="lapide-conq">${iconesConq(r)}</div>` : ''}
    <div class="lapide-ultimas">${r.ultimas ? esc(r.ultimas) : ''}</div>
    <div class="lapide-rodape">⚔️ A Masmorra do Pythonildo</div></div>`;
}

function textoLapide(r) {
  const cl = CLASSES[r.classe] || { icone: '', nome: '' };
  return [`💀 ${r.nome} ${cl.icone}${(RACAS[r.raca] || {}).icone || ''}${r.titulo ? ', ' + r.titulo : ''}`, `“${r.epitafio}”`,
    `🏔️ Andar ${r.andar} · 🏆 ${r.score} pontos${r.mult > 100 ? ` (×${(r.mult / 100).toFixed(2)})` : ''}`,
    r.modo === 'diario' ? `📅 Desafio do dia ${dataBonita(r.dia)}` : '',
    chipsMods(r).length ? `😈 ${chipsMods(r).join(', ')}` : '', (r.aliados || []).filter(id => ALIADOS[id]).length ? `🐾 ${r.aliados.filter(id => ALIADOS[id]).map(id => ALIADOS[id].icone + ' ' + ALIADOS[id].nome).join(', ')}` : '', iconesConq(r) ? `🏅 ${iconesConq(r)}` : '',
    '⚔️ A Masmorra do Pythonildo — consegue ir mais longe?'].filter(Boolean).join('\n');
}

async function copiarLapide(r) {
  const txt = textoLapide(r);
  try { await navigator.clipboard.writeText(txt); }
  catch (e) {   // páginas http:// (sem https) não deixam usar o clipboard moderno: plano B
    const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) { /* ok */ } ta.remove();
  }
  toast('📋 Copiado! Cole no WhatsApp, Discord ou onde quiser.');
}

/** Desenha a lápide num <canvas> e baixa como imagem PNG. */
function baixarLapide(r) {
  const c = document.createElement('canvas'); c.width = 900; c.height = 600; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#0b0820'); g.addColorStop(0.6, '#2a1550'); g.addColorStop(1, '#4a2160');
  x.fillStyle = g; x.fillRect(0, 0, 900, 600);
  for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + (i * 37 % 7) / 10})`; x.fillRect((i * 149) % 900, (i * 71) % 300, 2, 2); }
  x.fillStyle = '#0a0620'; x.fillRect(0, 540, 900, 60);
  x.fillStyle = '#6b6b83'; x.beginPath(); x.moveTo(170, 560); x.lineTo(170, 150); x.arc(450, 150, 280, Math.PI, 0); x.lineTo(730, 560); x.closePath(); x.fill();
  x.strokeStyle = '#8a8aa3'; x.lineWidth = 6; x.stroke();
  x.fillStyle = '#55556b'; x.beginPath(); x.moveTo(200, 560); x.lineTo(200, 160); x.arc(450, 160, 250, Math.PI, 0); x.lineTo(700, 560); x.closePath(); x.fill();
  const linhas = (t, mx, f) => { x.font = f; const ps = String(t).split(' '), ls = []; let l = ''; for (const p of ps) { if (x.measureText(l + p).width > mx && l) { ls.push(l.trim()); l = ''; } l += p + ' '; } ls.push(l.trim()); return ls; };
  x.textAlign = 'center'; x.fillStyle = '#e8e4f7';
  x.font = 'bold 22px Georgia'; x.fillText('⚰️ AQUI JAZ', 450, 118);
  x.font = 'bold 40px Georgia'; x.fillText(`${(CLASSES[r.classe] || {}).icone || ''}${(RACAS[r.raca] || {}).icone || ''} ${r.nome}`.slice(0, 26), 450, 172);
  let y = 205;
  if (r.titulo) { x.fillStyle = '#fbbf24'; x.font = 'italic 22px Georgia'; x.fillText(r.titulo, 450, y); y += 14; }
  x.fillStyle = '#f1ecff'; y += 30;
  for (const l of linhas(`“${r.epitafio}”`, 440, 'italic 24px Georgia').slice(0, 5)) { x.font = 'italic 24px Georgia'; x.fillText(l, 450, y); y += 32; }
  y += 8; x.fillStyle = '#fcd34d'; x.font = 'bold 24px Georgia';
  x.fillText(`🏔️ Andar ${r.andar}  ·  🏆 ${r.score} pts${r.mult > 100 ? ` (×${(r.mult / 100).toFixed(2)})` : ''}`, 450, y); y += 32;
  x.fillStyle = '#d6cdf5'; x.font = '19px Georgia';
  if (r.modo === 'diario') { x.fillText(`📅 Desafio do dia ${dataBonita(r.dia)}`, 450, y); y += 26; }
  if (chipsMods(r).length) { x.fillText(iconesMods(r.mods) + ' ' + chipsMods(r).map(s => s.replace(/^\S+\s/, '')).join(', ').slice(0, 44), 450, y); y += 26; }
  const al = (r.aliados || []).filter(id => ALIADOS[id]);
  if (al.length) { x.fillText('🐾 ' + al.map(id => ALIADOS[id].icone + ' ' + ALIADOS[id].nome.split(',')[0]).join(' · ').slice(0, 46), 450, y); y += 26; }
  if (iconesConq(r)) { x.font = '24px Georgia'; x.fillText(iconesConq(r).slice(0, 24), 450, y); }
  x.fillStyle = '#a79fc4'; x.font = 'bold 20px Georgia'; x.fillText('⚔️ A Masmorra do Pythonildo', 450, 585);
  const a = document.createElement('a'); a.download = `lapide-${String(r.nome).replace(/[^\w]+/g, '-').toLowerCase()}.png`; a.href = c.toDataURL('image/png');
  document.body.appendChild(a); a.click(); a.remove();
  toast('🖼️ Imagem baixada!');
}

/* ---- Ranking (geral e do dia) ---- */
async function telaRanking(aba = 'geral') {
  tela('<h2>🏆 Ranking</h2><p class="suave centro">Carregando…</p>');
  let lista = await Rank.listar();
  const dia = diaDeHoje();
  if (aba === 'hoje') {
    const vistos = new Set();
    lista = lista.filter(e => e.modo === 'diario' && e.dia === dia).filter(e => { const k = String(e.nome).toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; });
  }
  tela(`<h2>🏆 Ranking ${Rank.servidor ? 'da turma' : '(neste navegador)'}</h2>
    <div class="linha centro"><button class="btn ${aba === 'geral' ? 'primario' : ''}" data-aba="geral">🏆 Geral</button><button class="btn ${aba === 'hoje' ? 'primario' : ''}" data-aba="hoje">📅 Desafio de hoje (${dataBonita(dia)})</button></div>
    <p class="suave centro">${Rank.servidor ? '🟢 Conectado ao servidor da turma.' : '🟡 Sem servidor: mostrando só os jogos feitos neste navegador. Rode <code>servidor.py</code> para um ranking compartilhado.'}<br>Ordem: maior pontuação (o andar vale muito, e os modificadores multiplicam!).</p>
    <div class="painel tabela">${lista.length ? `<div class="th"><span>#</span><span>Aventureiro</span><span>Andar</span><span>Pontos</span><span class="oculta-m">Melhor item</span></div>` + lista.slice(0, 50).map((e, i) => `
      <div class="tr ${e.id === ultimoId ? 'eu' : ''}"><span>${['🥇', '🥈', '🥉'][i] || i + 1}</span>
      <span>${CLASSES[e.classe] ? CLASSES[e.classe].icone : ''} <b>${esc(e.nome)}</b>${e.titulo ? ` <small class="ouro">${esc(e.titulo)}</small>` : ''}${e.modo === 'diario' ? ' 📅' : ''}
        <br><small class="suave">Nv ${+e.nivel || 1} ${iconesMods(e.mods)} ${iconesConq(e)}</small>
        <br><small class="suave epi">${esc(e.epitafio || e.causa || '')}</small></span>
      <span><b>${+e.andar}</b></span><span>${+e.score}</span>
      <span class="oculta-m">${e.item && RARIDADES[e.item.raridade] ? `<small style="color:${RARIDADES[e.item.raridade].cor}">${esc(e.item.nome)}</small>` : '-'}</span></div>`).join('') : `<p class="suave centro">${aba === 'hoje' ? 'Ninguém fez o desafio de hoje ainda.' : 'Ninguém jogou ainda.'}</p>`}</div>
    <div class="linha centro"><button class="btn primario" id="b-voltar">⬅️ Voltar</button></div>`);
  document.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => telaRanking(b.dataset.aba));
  $('#b-voltar').onclick = telaTitulo;
}

