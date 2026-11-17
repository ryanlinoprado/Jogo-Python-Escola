'use strict';
/* =========================================================================
   INVENTÁRIO — itens (telaItem, sinergias do item), cartas de nível (estilo roguelike)
   e a ficha do personagem (abrirFicha).
   ========================================================================= */

/* ============ 7) ITENS, CARTAS, FICHA ============ */
/** Sinergias que o item (ou habilidade) ligaria/desligaria + as que ele aproxima. */
function deltaSin(it) {
  const antes = G, depois = { ...G, equip: { ...G.equip, [it.slot]: it } };
  const a = new Set(sinergiasAtivas(antes).map(s => s.id)), d = new Set(sinergiasAtivas(depois).map(s => s.id));
  const ganha = SINERGIAS.filter(s => d.has(s.id) && !a.has(s.id)), perde = SINERGIAS.filter(s => a.has(s.id) && !d.has(s.id));
  const avanca = SINERGIAS.filter(s => !d.has(s.id) && progressoSin(depois, s)[0] > progressoSin(antes, s)[0]);
  return ganha.map(s => `<div class="bom">🔗 Ativa <b>${s.icone} ${s.nome}</b> — ${s.desc}</div>`).join('')
    + perde.map(s => `<div class="ruim">💔 Perde <b>${s.icone} ${s.nome}</b></div>`).join('')
    + avanca.map(s => { const [x, y] = progressoSin(depois, s); return `<div class="suave"><small>➕ Avança ${s.icone} ${s.nome} (${x}/${y})</small></div>`; }).join('');
}
/** Sinergias que ficam completas se o personagem aprender a habilidade "id". */
const sinPorHab = id => SINERGIAS.filter(s => !sinCompleta(G, s) && sinCompleta({ ...G, skills: [...G.skills, id] }, s));
const sinPorItem = it => SINERGIAS.filter(s => !sinCompleta(G, s) && sinCompleta({ ...G, equip: { ...G.equip, [it.slot]: it } }, s));

function htmlSinergias() {
  const ativas = sinergiasAtivas(G), prog = SINERGIAS.filter(s => !sinCompleta(G, s) && progressoSin(G, s)[0] > 0);
  const tg = Object.entries(contaTags(G)).filter(([, n]) => n > 0).map(([t, n]) => `<span class="tag-chip">${TAGS[t].icone} ${TAGS[t].nome} ×${n}</span>`).join('');
  return `<h3>🔗 Sinergias</h3>`
    + (ativas.length ? ativas.map(s => `<div class="slot sin-on">${s.icone} <b>${s.nome}</b><br><small>${s.desc}</small></div>`).join('') : '<p class="suave">Nenhuma ainda. Junte itens e habilidades do mesmo tema!</p>')
    + (prog.length ? '<div class="suave"><small>Em andamento:</small></div>' + prog.map(s => { const [a, b] = progressoSin(G, s); return `<div class="slot sin-off">${s.icone} ${s.nome} <b>${a}/${b}</b><br><small>${faltaSin(s)}</small></div>`; }).join('') : '')
    + (tg ? `<div class="tags-linha">${tg}</div>` : '');
}

function htmlAliados(emCombate) {
  if (!G.aliados.length) return `<h3>🐾 Companheiros (0/${MAX_ALIADOS})</h3><p class="suave">Ninguém ainda. Ajude quem encontrar pelo caminho!</p>`;
  return `<h3>🐾 Companheiros (${G.aliados.length}/${MAX_ALIADOS})</h3>` + G.aliados.map((a, i) => {
    const d = ALIADOS[a.id], prox = LIMIARES_VINCULO[a.nivel - 1];
    return `<div class="slot">${d.icone} <b>${esc(d.nome)}</b> <small class="suave">Nv ${a.nivel}${a.nivel < 5 ? ` · vínculo ${a.vinculo}/${prox}` : ' · máximo'}</small><br>
      <small>${d.desc}</small><br><small class="suave">❤️ ${a.hp}/${hpMaxAliado(a)}${tagsDe(d.tags).length ? ' · ' + tagsDe(d.tags).join(' ') : ''}</small>
      ${emCombate ? '' : `<br><button class="btn mini" data-dispensa="${i}">Dispensar</button>`}</div>`;
  }).join('');
}
const tagsDe = ts => (ts || []).map(t => TAGS[t].icone + ' ' + TAGS[t].nome);

function deltaItem(it) {
  const antes = stats(G), depois = stats({ ...G, equip: { ...G.equip, [it.slot]: it } });
  const campos = [['atk', '⚔️ Ataque'], ['def', '🛡️ Defesa'], ['hpMax', '❤️ Vida'], ['enMax', '⚡ Energia'], ['ca', '🛡️ CA'], ['acertoBase', '🎯 Acerto']];
  const l = [];
  for (const [k, n] of campos) { const d = Math.round(depois[k] - antes[k]); if (d) l.push(`<span class="${d > 0 ? 'bom' : 'ruim'}">${n} ${d > 0 ? '+' : ''}${d}</span>`); }
  for (const a in ATRIBUTOS) { const d = depois.s[a] - antes.s[a]; if (d) l.push(`<span class="${d > 0 ? 'bom' : 'ruim'}">${ATRIBUTOS[a].icone} ${d > 0 ? '+' : ''}${d}</span>`); }
  return l.join(' · ') || '<span class="suave">sem mudança</span>';
}

function telaItem(it, volta) {
  G.pontosItens += RARIDADES[it.raridade].pontos;
  if (!G.melhor || it.raridade > G.melhor.raridade) G.melhor = { nome: it.nome, raridade: it.raridade };
  const atual = G.equip[it.slot], r = RARIDADES[it.raridade];
  hud(); Som.tocar(it.raridade >= 2 ? 'raro' : 'item');
  tela(`<div class="evento"><h2>${it.raridade >= 3 ? '🌟 ITEM ' + r.nome.toUpperCase() + '! 🌟' : '🎁 Novo item!'}</h2>
    <div class="item-card r${it.raridade}" style="--cor:${r.cor}">
      <div class="item-tipo">${SLOTS[it.slot]} · <b>${r.nome}</b></div><h3>${nomeItem(it)}</h3>
      <div class="item-stats">${linhasItem(it).map(l => `<div>${l}</div>`).join('')}</div>
      ${tagsItem(it).length ? `<div class="tags-linha">${chipsTags(tagsItem(it))}</div>` : ''}
      <p class="flavor">“${esc(it.flavor)}”</p>${it.autor ? `<small class="suave">🛠️ Criado por ${esc(it.autor)}</small>` : ''}</div>
    <div class="painel pequeno"><b>Se equipar:</b> ${deltaItem(it)}<br>${deltaSin(it)}
      <small class="suave">Atual: ${atual ? nomeItem(atual) : 'nada'}</small></div>
    <div class="linha centro"><button class="btn primario grande" id="b-eq">🧰 Equipar${atual ? ` (vende o antigo: +${vendaItem(atual)} 💰)` : ''}</button>
      <button class="btn grande" id="b-vende">💰 Vender (+${vendaItem(it)})</button></div></div>`);
  $('#b-eq').onclick = () => { if (atual) { G.ouro += vendaItem(atual); } G.equip[it.slot] = it; limitaVida(); Som.tocar('item'); volta(); };
  $('#b-vende').onclick = () => { G.ouro += vendaItem(it); Som.tocar('item'); volta(); };
}

/* ---- Cartas de nível (estilo roguelike) ---- */
function geraCartas() {
  const ativas = G.skills.filter(id => HABILIDADES[id].tipo === 'ativa');
  const novas = Object.entries(HABILIDADES)
    .filter(([id, h]) => !G.skills.includes(id) && (!h.classe || h.classe === G.classe) && (h.tipo === 'passiva' || ativas.length < 4))
    .map(([id]) => ({ k: 'nova', id }));
  const ups = ativas.filter(id => (G.skillNiv[id] || 1) < 3).map(id => ({ k: 'up', id }));
  const extras = [...shuffle(Object.keys(ATRIBUTOS)).slice(0, 3).map(a => ({ k: 'attr', a })), { k: 'vida' }];
  const comSin = novas.filter(c => sinPorHab(c.id).length);   // cartas que completam uma sinergia aparecem bem mais
  const pool = shuffle([...novas, ...novas, ...comSin, ...comSin, ...comSin, ...ups, ...extras]);
  const res = [], vistos = new Set();
  for (const c of pool) { const key = c.k + (c.id || c.a || ''); if (!vistos.has(key)) { vistos.add(key); res.push(c); } if (res.length === 3) break; }
  return res;
}

function telaCartas() {
  const cartas = geraCartas(); hud(); Som.tocar('level');
  tela(`<div class="andar-tit"><h2>⬆️ Nível ${G.nivel}!</h2><p class="suave">Escolha uma melhoria para o seu herói.${G.pendCartas > 1 ? ` (${G.pendCartas} escolhas)` : ''}</p></div>
    <div class="grid3">${cartas.map((c, i) => {
      let ico, tit, tag, desc;
      if (c.k === 'nova') { const h = HABILIDADES[c.id]; ico = h.icone; tit = h.nome; tag = h.tipo === 'ativa' ? 'Nova habilidade ativa' : 'Nova passiva'; desc = h.desc + (h.tipo === 'ativa' ? ` Custa ${h.custo} ⚡.` : '')
        + (tagsHab(c.id).length ? `<span class="tags-linha">${chipsTags(tagsHab(c.id))}</span>` : '')
        + sinPorHab(c.id).map(s => `<span class="sin-dica">🔗 Sinergia: ${s.icone} <b>${s.nome}</b><br><small>${s.desc}</small></span>`).join(''); }
      else if (c.k === 'up') { const h = HABILIDADES[c.id]; ico = h.icone; tit = 'Aprimorar ' + h.nome; tag = `Nível ${(G.skillNiv[c.id] || 1)} → ${(G.skillNiv[c.id] || 1) + 1}`; desc = '+25% de potência nos efeitos desta habilidade.'; }
      else if (c.k === 'attr') { const a = ATRIBUTOS[c.a]; ico = a.icone; tit = `+2 ${a.nome}`; tag = 'Atributo'; desc = a.desc; }
      else { ico = '❤️‍🔥'; tit = 'Coração Valente'; tag = 'Bênção'; desc = '+20 de vida máxima e cura 20.'; }
      return `<button class="card carta ${c.k}" data-i="${i}"><div class="grande-ico">${ico}</div><small class="tag">${tag}</small><h3>${tit}</h3><p class="suave">${desc}</p></button>`;
    }).join('')}</div>`);
  document.querySelectorAll('.carta').forEach(b => b.onclick = () => {
    const c = cartas[+b.dataset.i];
    if (c.k === 'nova') G.skills.push(c.id);
    else if (c.k === 'up') G.skillNiv[c.id] = (G.skillNiv[c.id] || 1) + 1;
    else if (c.k === 'attr') G.attr[c.a] += 2;
    else { G.bonusHp += 20; G.hp += 20; }
    limitaVida(); G.pendCartas--; Som.tocar('item'); avancar();
  });
}

/* ---- Ficha do personagem (modal) ---- */
function abrirFicha() {
  if (!G) return;
  const st = stats(G), cl = CLASSES[G.classe], emCombate = C && !C.fim;
  const m = $('#modal'); m.hidden = false;
  m.innerHTML = `<div class="modal-caixa"><button class="btn mini fechar" id="b-fechar">✖</button>
    <h2>${cl.icone} ${esc(G.nome)} — Nv ${G.nivel} ${RACAS[G.raca] ? RACAS[G.raca].nome + ' ' : ''}${cl.nome}</h2>
    <div class="grid-ficha">
      <div><h3>Atributos</h3>${Object.entries(ATRIBUTOS).map(([k, a]) => `<div class="linha-rank"><span>${a.icone} ${a.nome}</span><b>${st.s[k]}${st.s[k] !== G.attr[k] ? ` <small class="bom">(${G.attr[k]}${st.s[k] > G.attr[k] ? '+' : ''}${st.s[k] - G.attr[k]})</small>` : ''}</b></div>`).join('')}
        <h3>Combate</h3>
        <div class="linha-rank"><span>⚔️ Ataque</span><b>${st.atk}</b></div><div class="linha-rank"><span>🛡️ Defesa</span><b>${st.def}</b></div>
        <div class="linha-rank"><span>🛡️ CA (Classe de Armadura)</span><b>${st.ca}</b></div><div class="linha-rank"><span>🎯 Acerto (${ATRIBUTOS[cl.principal].nome})</span><b>+${Math.floor(st.s[cl.principal] / 3) + st.acertoBase}</b></div>
        <div class="linha-rank"><span>🎲 Crítico (d20 natural)</span><b>${st.critMin}${st.critMin < 20 ? '–20' : ''}</b></div>
        ${st.regen ? `<div class="linha-rank"><span>💚 Regeneração (por turno)</span><b>+${st.regen}</b></div>` : ''}
        <div class="linha-rank"><span>🏆 Pontuação</span><b>${calculaScore()}${multMods(G.mods) > 1 ? ` <small class="ouro">(×${multMods(G.mods).toFixed(2)})</small>` : ''}</b></div>
        ${G.modo === 'diario' ? `<div class="linha-rank"><span>📅 Desafio do dia</span><b>${dataBonita(G.dia)}</b></div>` : ''}
        ${(G.mods || []).map(id => `<div class="slot">${MODIFICADORES[id].icone} <b>${MODIFICADORES[id].nome}</b><br><small>${MODIFICADORES[id].desc}</small></div>`).join('')}
        ${G.conq.length ? `<h3>Conquistas desta aventura</h3><div>${G.conq.map(id => `<span title="${esc(conquistaPorId(id).nome)}" style="font-size:1.6rem">${conquistaPorId(id).icone}</span>`).join(' ')}</div>` : ''}</div>
      <div><h3>Equipamento</h3>${['arma', 'armadura', 'amuleto'].map(s => { const it = G.equip[s]; return `<div class="slot"><small class="suave">${SLOTS[s]}</small><br>${it ? `${nomeItem(it)}<br><small>${linhasItem(it).join(' · ')}</small>` : '<span class="suave">vazio</span>'}</div>`; }).join('')}
        <h3>Habilidades</h3>${G.skills.map(id => { const h = HABILIDADES[id]; return `<div class="slot">${h.icone} <b>${h.nome}</b>${(G.skillNiv[id] || 1) > 1 ? ` Nv${G.skillNiv[id]}` : ''} <small class="suave">${h.tipo}</small><br><small>${h.desc}</small></div>`; }).join('')}
        <div class="slot">⭐ <b>${cl.passiva.nome}</b> <small class="suave">classe</small><br><small>${cl.passiva.desc}</small></div>
        ${RACAS[G.raca] ? `<div class="slot">${RACAS[G.raca].icone} <b>${RACAS[G.raca].passiva.nome}</b> <small class="suave">raça ${RACAS[G.raca].nome}</small><br><small>${RACAS[G.raca].passiva.desc}</small><br><small class="ruim">${RACAS[G.raca].fraqueza}</small></div>` : ''}
        ${htmlSinergias()}
        ${htmlAliados(emCombate)}
        ${(G.bencaos || []).length ? `<h3>Bênçãos</h3>${G.bencaos.map(b => { const d = DEUSES[b.id] || { nome: b.id, titulo: '', icone: '✨' }; return `<div class="slot">${d.icone} <b>${d.nome}</b> <small class="suave">${d.titulo}</small><br><small>${b.desc}</small></div>`; }).join('')}` : ''}
        <h3>Mochila</h3>${Object.entries(G.cons).filter(([, n]) => n > 0).map(([id, n]) => `<div class="slot linha">${CONSUMIVEIS[id].icone} ${CONSUMIVEIS[id].nome} ×${n} ${emCombate ? '' : `<button class="btn mini" data-usa="${id}">Usar</button>`}</div>`).join('') || '<p class="suave">Vazia.</p>'}
      </div></div></div>`;
  $('#b-fechar').onclick = fechaModal;
  m.querySelectorAll('[data-usa]').forEach(b => b.onclick = () => { aplicaConsumivel(b.dataset.usa); hud(); abrirFicha(); });
  m.querySelectorAll('[data-dispensa]').forEach(b => b.onclick = () => {
    const a = G.aliados[+b.dataset.dispensa];
    if (a && confirm(`Dispensar ${ALIADOS[a.id].nome}? Ele vai embora de vez.`)) { G.aliados.splice(+b.dataset.dispensa, 1); hud(); abrirFicha(); }
  });
}
const fechaModal = () => { $('#modal').hidden = true; };

