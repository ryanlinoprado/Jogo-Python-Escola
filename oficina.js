'use strict';
/* ============================================================
   OFICINA DO APRENDIZ — o aluno cria inimigos e itens por formulário.
   • O formulário mostra, ao vivo, o CÓDIGO que ele escreveria em dados.js.
   • O que ele cria entra no jogo (neste navegador) e pode ser
     PUBLICADO para a turma pelo servidor (servidor.py).
   • Tudo passa por regras de equilíbrio, para ninguém criar uma
     espada infinita: itens têm um ORÇAMENTO de pontos por raridade e
     o XP/ouro dos inimigos é calculado pela força deles.
   ============================================================ */

/* ---------- Regras de equilíbrio ---------- */
const OF_ICONES = ['👹', '👺', '🐲', '🧟', '👻', '🦇', '🕷️', '🐍', '🦂', '🐀', '🦖', '🤖', '👽', '🍄', '🌵', '🦈', '🐙', '🧛', '🧌', '🦝', '🐔', '🥟', '📦', '🌀', '🐊', '🦆', '🐑', '🪲'];
const OF_TRACOS = { '': 'Nenhum', veneno: '🧪 Veneno (pode te envenenar)', rouba_ouro: '🦹 Ladrão (rouba seu ouro)', rouba_vida: '🧛 Vampiro (se cura quando te fere)', esquiva: '💨 Escorregadio (CA +3)' };
const OF_RITMOS = { 0: 'Normal (ataca todo turno)', 2: 'Preguiçoso (ataca a cada 2 turnos, bem mais forte)', 3: 'Muito preguiçoso (a cada 3 turnos)' };
const OF_ATK = [5, 8, 12, 17, 26];          // ataque base de uma arma, por raridade
const OF_DEF = [2, 4, 7, 11, 16];           // defesa base de uma armadura, por raridade
const OF_ORCAMENTO = [2, 5, 8, 12, 18];     // pontos para gastar em bônus, por raridade
const OF_MODS = [                           // k = nome do bônus · passo = quanto sobe por clique · custo = pontos por clique
  { k: 'for', nome: 'Força', icone: '💪', passo: 1, max: 6, custo: 1 }, { k: 'des', nome: 'Destreza', icone: '🏹', passo: 1, max: 6, custo: 1 },
  { k: 'int', nome: 'Inteligência', icone: '🧠', passo: 1, max: 6, custo: 1 }, { k: 'vit', nome: 'Vitalidade', icone: '❤️‍🔥', passo: 1, max: 6, custo: 1 },
  { k: 'sor', nome: 'Sorte', icone: '🍀', passo: 1, max: 6, custo: 1 }, { k: 'hp', nome: 'Vida máx.', icone: '❤️', passo: 5, max: 50, custo: 1 },
  { k: 'en', nome: 'Energia máx.', icone: '⚡', passo: 2, max: 10, custo: 1 }, { k: 'crit', nome: '% Crítico', icone: '🎲', passo: 2, max: 14, custo: 1 },
  { k: 'esq', nome: '% Esquiva', icone: '💨', passo: 2, max: 14, custo: 1 }, { k: 'acerto', nome: 'Acerto', icone: '🎯', passo: 1, max: 4, custo: 2 },
  { k: 'ca', nome: 'CA (armadura)', icone: '🛡️', passo: 1, max: 3, custo: 3 }, { k: 'ouro', nome: '% Ouro', icone: '💰', passo: 10, max: 50, custo: 1, escala: 0.01 },
  { k: 'roubaVida', nome: '% Roubo de vida', icone: '🧛', passo: 3, max: 12, custo: 1, escala: 0.01 },
];
const OF_SLOTS = { arma: '⚔️ Arma', armadura: '🥋 Armadura', amuleto: '📿 Amuleto' };
const OF_MAX_LOCAL = 30;

/* ---------- Validação (nunca confie no que vem do armazenamento, de um arquivo ou do servidor) ---------- */
const ofNum = (v, a, b, passo = 1, padrao = a) => { v = Number(v); if (!isFinite(v)) return padrao; v = Math.round(v / passo) * passo; return Math.max(a, Math.min(b, +v.toFixed(2))); };
const ofTxt = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
const ofIcone = s => [...String(s == null ? '' : s).replace(/[<>&"'`\\]/g, '').trim()].slice(0, 6).join('') || '👹';
const ofId = () => 'c_' + Math.random().toString(36).slice(2, 8);
const ofIdOk = id => typeof id === 'string' && /^c_[a-z0-9]{4,10}$/.test(id);

function validaInimigo(e) {
  if (!e || typeof e !== 'object' || !ofIdOk(e.id)) return null;
  const nome = ofTxt(e.nome, 40); if (!nome) return null;
  return {
    id: e.id, tipo: 'inimigo', nome, icone: ofIcone(e.icone), min: ofNum(e.min, 1, 9, 1, 1),
    hp: ofNum(e.hp, 0.5, 2.5, 0.1, 1), atk: ofNum(e.atk, 0.5, 2, 0.1, 1), def: ofNum(e.def, 0.5, 2, 0.1, 1),
    traco: Object.prototype.hasOwnProperty.call(OF_TRACOS, e.traco || '') ? (e.traco || '') : '', ritmo: [0, 2, 3].includes(+e.ritmo) ? +e.ritmo : 0,
    fala: ofTxt(e.fala, 80), autor: ofTxt(e.autor, 20), token: typeof e.token === 'string' ? e.token.slice(0, 40) : '', publicado: !!e.publicado,
  };
}
const ofCustoItem = passos => OF_MODS.reduce((s, m) => s + (passos[m.k] || 0) * m.custo, 0);
function validaItem(e) {
  if (!e || typeof e !== 'object' || !ofIdOk(e.id)) return null;
  const nome = ofTxt(e.nome, 40); if (!nome || !OF_SLOTS[e.slot]) return null;
  const raridade = ofNum(e.raridade, 0, 4, 1, 0), passos = {};
  for (const m of OF_MODS) { const n = ofNum(e.passos && e.passos[m.k], 0, Math.floor(m.max / m.passo), 1, 0); if (n) passos[m.k] = n; }
  if (ofCustoItem(passos) > OF_ORCAMENTO[raridade]) return null;   // passou do orçamento: descarta
  const classe = e.slot === 'arma' ? (CLASSES[e.classe] ? e.classe : 'guerreiro') : '';
  return { id: e.id, tipo: 'item', nome, slot: e.slot, raridade, classe, passos, tag: TAGS[e.tag] ? e.tag : '', flavor: ofTxt(e.flavor, 100), autor: ofTxt(e.autor, 20), token: typeof e.token === 'string' ? e.token.slice(0, 40) : '', publicado: !!e.publicado };
}

/* ---------- Do formulário para o objeto que o jogo usa ---------- */
function ofPoder(e) { return 0.45 * e.hp + 0.4 * e.atk + 0.15 * e.def; }
const ofXp = e => Math.round(Math.max(0.7, Math.min(2.2, ofPoder(e) * 1.05)) * 10) / 10;       // XP e ouro vêm da força do inimigo
const ofOuro = e => Math.round(Math.max(0.6, Math.min(2.0, ofPoder(e) * 0.95)) * 10) / 10;
function defInimigo(e) {
  const d = { id: e.id, nome: e.nome, icone: e.icone, min: e.min, hp: e.hp, atk: e.atk, def: e.def, xp: ofXp(e), ouro: ofOuro(e), custom: true, autor: e.autor };
  if (e.traco) d.traco = e.traco; if (e.ritmo) d.ritmo = e.ritmo; if (e.fala) d.falas = [e.fala];
  return d;
}
function modsItem(passos) { const m = {}; for (const o of OF_MODS) if (passos[o.k]) m[o.k] = +(passos[o.k] * o.passo * (o.escala || 1)).toFixed(2); return m; }
function defItem(e) {
  const base = { id: e.id, nome: e.nome, slot: e.slot, raridade: e.raridade, mods: modsItem(e.passos), flavor: e.flavor || 'Feito na Oficina do Aprendiz.', custom: true, autor: e.autor, tag: e.tag };
  if (e.slot === 'arma') { base.classe = e.classe; base.atk = OF_ATK[e.raridade]; }
  if (e.slot === 'armadura') base.def = OF_DEF[e.raridade];
  return base;
}

/* ---------- O código equivalente em dados.js (para ensinar!) ---------- */
const ofJs = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
function codigoInimigo(e) {
  const d = defInimigo(e), p = [`nome: ${ofJs(d.nome)}`, `icone: ${ofJs(d.icone)}`, `min: ${d.min}`, `hp: ${d.hp}`, `atk: ${d.atk}`, `def: ${d.def}`, `xp: ${d.xp}`, `ouro: ${d.ouro}`];
  if (d.traco) p.push(`traco: ${ofJs(d.traco)}`); if (d.ritmo) p.push(`ritmo: ${d.ritmo}`); if (d.falas) p.push(`falas: [${ofJs(d.falas[0])}]`);
  return `/* em INIMIGOS (dados.js) */\n  { ${p.join(', ')} },`;
}
function codigoItem(e) {
  const d = defItem(e), mods = '{ ' + Object.entries(d.mods).map(([k, v]) => `${k}: ${v}`).join(', ') + ' }', mm = Object.keys(d.mods).length ? mods : '{}';
  const lin = d.slot === 'arma' ? `arma(${ofJs(d.id)}, ${ofJs(d.nome)}, ${d.raridade}, ${ofJs(d.classe)}, ${d.atk}, ${mm}, ${ofJs(d.flavor)}),`
    : d.slot === 'armadura' ? `armad(${ofJs(d.id)}, ${ofJs(d.nome)}, ${d.raridade}, ${d.def}, ${mm}, ${ofJs(d.flavor)}),`
      : `amul(${ofJs(d.id)}, ${ofJs(d.nome)}, ${d.raridade}, ${mm}, ${ofJs(d.flavor)}),`;
  return `/* em ITENS (dados.js) */\n  ${lin}` + (d.tag ? `\n/* em TAGS_ITEM (sinergias.js) */\n  ${d.id}: ['${d.tag}'],` : '');
}

/* ---------- Armazenamento, mesclagem com o jogo e API da turma ---------- */
const Oficina = {
  d: { inimigos: [], itens: [] },       // criações deste navegador
  turma: { inimigos: [], itens: [] },   // criações publicadas por todos (vêm do servidor)
  servidor: false,
  carrega() {
    try {
      const j = JSON.parse(store.get('masmorra_oficina') || '{}');
      this.d.inimigos = (j.inimigos || []).map(validaInimigo).filter(Boolean).slice(0, OF_MAX_LOCAL);
      this.d.itens = (j.itens || []).map(validaItem).filter(Boolean).slice(0, OF_MAX_LOCAL);
    } catch (e) { this.d = { inimigos: [], itens: [] }; }
  },
  salva() { store.set('masmorra_oficina', JSON.stringify(this.d)); this.aplica(); },
  async baixaTurma() {
    try {
      const r = await fetch('/api/oficina', { cache: 'no-store' }); if (!r.ok) throw new Error('sem servidor');
      const j = await r.json(), lim = l => (l || []).slice(-100);
      this.turma = { inimigos: lim(j.inimigos).map(x => validaInimigo({ ...x.dados, id: x.id, autor: x.autor })).filter(Boolean), itens: lim(j.itens).map(x => validaItem({ ...x.dados, id: x.id, autor: x.autor })).filter(Boolean) };
      this.servidor = true;
    } catch (e) { this.servidor = false; this.turma = { inimigos: [], itens: [] }; }
    this.aplica();
  },
  /** Coloca as criações (minhas + da turma) dentro das listas do jogo. */
  aplica() {
    const vistos = new Set(), inis = [], its = [];
    for (const e of [...this.d.inimigos, ...this.turma.inimigos]) if (!vistos.has(e.id)) { vistos.add(e.id); inis.push(defInimigo(e)); }
    for (const e of [...this.d.itens, ...this.turma.itens]) if (!vistos.has(e.id)) { vistos.add(e.id); its.push(defItem(e)); }
    INIMIGOS.splice(0, INIMIGOS.length, ...INIMIGOS.filter(i => !i.custom), ...inis);
    ITENS.splice(0, ITENS.length, ...ITENS.filter(i => !i.custom), ...its);
    for (const k of Object.keys(TAGS_ITEM)) if (k.startsWith('c_')) delete TAGS_ITEM[k];
    its.forEach(it => { if (it.tag) TAGS_ITEM[it.id] = [it.tag]; });
  },
  lista(tipo) { return tipo === 'inimigo' ? this.d.inimigos : this.d.itens; },
  acha(tipo, id) { return this.lista(tipo).find(e => e.id === id); },
  guarda(e) {
    const l = this.lista(e.tipo), i = l.findIndex(x => x.id === e.id);
    if (i >= 0) l[i] = e; else l.unshift(e);
    this.salva(); if (Conquistas.grava(['criador']).length) toast('🏅 <b>Conquista:</b> 🛠️ Criador', 'conq');
  },
  apaga(tipo, id) { const l = this.lista(tipo), i = l.findIndex(x => x.id === id); if (i >= 0) l.splice(i, 1); this.salva(); },
  async publica(e) {
    if (!e.autor) throw new Error('Escreva o seu nome em "Autor" antes de publicar.');
    if (!e.token) e.token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const { token, publicado, ...dados } = e;
    const r = await fetch('/api/oficina', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: e.tipo, id: e.id, autor: e.autor, token, dados }) });
    if (!r.ok) { let m = 'o servidor recusou'; try { m = (await r.json()).erro || m; } catch (x) { /* ok */ } throw new Error(m); }
    e.publicado = true; this.salva(); if (Conquistas.grava(['autor_turma']).length) toast('🏅 <b>Conquista:</b> 🌐 Autor da Turma', 'conq'); await this.baixaTurma();
  },
  async retira(e) {
    const r = await fetch(`/api/oficina?id=${encodeURIComponent(e.id)}&token=${encodeURIComponent(e.token)}`, { method: 'DELETE' });
    if (!r.ok && r.status !== 404) throw new Error('o servidor recusou');
    e.publicado = false; this.salva(); await this.baixaTurma();
  },
  exporta() {
    const limpa = ({ token, publicado, ...x }) => x;
    return JSON.stringify({ v: 1, inimigos: this.d.inimigos.map(limpa), itens: this.d.itens.map(limpa) });
  },
  importa(texto) {
    const j = JSON.parse(texto); let n = 0;
    for (const x of (j.inimigos || [])) { const e = validaInimigo({ ...x, id: ofId() }); if (e && this.d.inimigos.length < OF_MAX_LOCAL) { e.token = ''; e.publicado = false; this.d.inimigos.unshift(e); n++; } }
    for (const x of (j.itens || [])) { const e = validaItem({ ...x, id: ofId() }); if (e && this.d.itens.length < OF_MAX_LOCAL) { e.token = ''; e.publicado = false; this.d.itens.unshift(e); n++; } }
    this.salva(); return n;
  },
};
Oficina.carrega(); Oficina.aplica(); Oficina.baixaTurma();

/* ============================ TELAS ============================ */
let ofAba = 'inimigos';
const ofCopia = async txt => {
  try { await navigator.clipboard.writeText(txt); }
  catch (e) { const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (x) { /* ok */ } ta.remove(); }
  toast('📋 Copiado!');
};
const ofAutor = () => store.get('masmorra_autor') || '';
const ofResumoIni = e => `❤️ ×${e.hp} · ⚔️ ×${e.atk} · 🛡️ ×${e.def} · a partir do andar ${e.min}${e.traco ? ' · ' + OF_TRACOS[e.traco].split(' ')[0] : ''}`;
const ofTagsHtml = e => (e.tag ? `<span class="tag-chip">${TAGS[e.tag].icone} ${TAGS[e.tag].nome}</span>` : '');
const ofResumoItem = e => { const d = defItem(e); return [d.atk ? `⚔️ +${d.atk}` : '', d.def ? `🛡️ +${d.def}` : '', ...linhasItem({ mods: d.mods }).map(esc)].filter(Boolean).join(' · '); };

async function telaOficina(aba = ofAba) {
  ofAba = aba;
  tela('<h2>🛠️ Oficina do Aprendiz</h2><p class="suave centro">Carregando…</p>');
  await Oficina.baixaTurma();
  const meus = (aba === 'inimigos' ? Oficina.d.inimigos : aba === 'itens' ? Oficina.d.itens : []);
  const cartao = e => `<div class="painel of-card" data-id="${e.id}" data-tipo="${e.tipo}">
      <div class="of-ico">${e.tipo === 'inimigo' ? e.icone : ({ arma: '⚔️', armadura: '🥋', amuleto: '📿' })[e.slot]}</div>
      <div class="of-info"><b>${e.tipo === 'item' ? nomeItem({ nome: e.nome, raridade: e.raridade }) : esc(e.nome)}</b> ${e.publicado ? '<span class="tag-chip">🌐 publicado</span>' : ''} ${e.tipo === 'item' ? ofTagsHtml(e) : ''}<br>
        <small class="suave">${e.tipo === 'inimigo' ? ofResumoIni(e) : `${OF_SLOTS[e.slot]}${e.classe ? ' de ' + CLASSES[e.classe].nome : ''} · ${RARIDADES[e.raridade].nome} · ${ofResumoItem(e)}`}</small></div>
      <div class="of-botoes"><button class="btn mini" data-act="editar">✏️ Editar</button>${e.tipo === 'inimigo' ? '<button class="btn mini" data-act="duelo">⚔️ Duelo</button>' : ''}
        <button class="btn mini" data-act="codigo">📋 Código</button>
        ${e.publicado ? '<button class="btn mini" data-act="retirar">↩️ Retirar da turma</button>' : '<button class="btn mini" data-act="publicar">🌐 Publicar</button>'}
        <button class="btn mini" data-act="apagar">🗑️</button></div></div>`;
  const dela = e => `<div class="painel of-card"><div class="of-ico">${e.tipo === 'inimigo' ? e.icone : ({ arma: '⚔️', armadura: '🥋', amuleto: '📿' })[e.slot]}</div>
      <div class="of-info"><b>${e.tipo === 'item' ? nomeItem({ nome: e.nome, raridade: e.raridade }) : esc(e.nome)}</b> <small class="suave">por ${esc(e.autor || '?')}</small><br>
        <small class="suave">${e.tipo === 'inimigo' ? ofResumoIni(e) : `${OF_SLOTS[e.slot]} · ${RARIDADES[e.raridade].nome} · ${ofResumoItem(e)}`}</small></div></div>`;
  const conteudo = aba === 'turma'
    ? (Oficina.servidor ? ([...Oficina.turma.inimigos, ...Oficina.turma.itens].map(dela).join('') || '<p class="suave centro">Ninguém publicou ainda. Seja o primeiro!</p>')
      : '<p class="suave centro">🟡 Sem servidor: não dá para ver as criações da turma. Rode <code>servidor.py</code>, ou use Exportar/Importar para trocar criações.</p>')
    : (meus.map(cartao).join('') || `<p class="suave centro">Você ainda não criou ${aba === 'inimigos' ? 'nenhum inimigo' : 'nenhum item'}.</p>`)
      + `<div class="linha centro"><button class="btn primario grande" id="of-novo">➕ Criar ${aba === 'inimigos' ? 'inimigo' : 'item'}</button></div>`;
  tela(`<h2>🛠️ Oficina do Aprendiz</h2>
    <p class="suave centro">Crie inimigos e itens para o jogo. Eles entram nas suas aventuras (menos no Desafio do Dia) e você pode publicá-los para a turma.</p>
    <div class="linha centro"><label class="campo">Autor <input id="of-autor" maxlength="20" placeholder="seu nome" value="${esc(ofAutor())}"></label></div>
    <div class="linha centro">${[['inimigos', '👹 Inimigos'], ['itens', '⚔️ Itens'], ['turma', '🌐 Da turma']].map(([k, n]) => `<button class="btn ${aba === k ? 'primario' : ''}" data-aba="${k}">${n}</button>`).join('')}</div>
    <div id="of-lista">${conteudo}</div>
    <div class="linha centro"><button class="btn" id="of-exp">📤 Exportar tudo</button><button class="btn" id="of-imp">📥 Importar</button><button class="btn" id="b-voltar">⬅️ Voltar</button></div>
    <div id="of-imp-box" hidden class="painel"><p class="suave">Cole aqui o texto exportado por um colega:</p><textarea id="of-imp-txt" rows="4" style="width:100%"></textarea><div class="linha centro"><button class="btn primario" id="of-imp-ok">Importar</button></div></div>`);
  $('#of-autor').oninput = e => store.set('masmorra_autor', ofTxt(e.target.value, 20));
  document.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => telaOficina(b.dataset.aba));
  const novo = $('#of-novo'); if (novo) novo.onclick = () => (aba === 'inimigos' ? telaEditaInimigo() : telaEditaItem());
  $('#b-voltar').onclick = telaTitulo;
  $('#of-exp').onclick = () => ofCopia(Oficina.exporta());
  $('#of-imp').onclick = () => { const b = $('#of-imp-box'); b.hidden = !b.hidden; };
  $('#of-imp-ok').onclick = () => { try { const n = Oficina.importa($('#of-imp-txt').value); toast(`📥 ${n} criação(ões) importada(s)!`); telaOficina(aba); } catch (e) { toast('🚫 Texto inválido. Cole o texto exatamente como foi exportado.'); } };
  $('#of-lista').onclick = async ev => {
    const bt = ev.target.closest('[data-act]'); if (!bt) return;
    const card = bt.closest('.of-card'), e = Oficina.acha(card.dataset.tipo, card.dataset.id); if (!e) return;
    const act = bt.dataset.act; Som.tocar('click');
    if (act === 'editar') return e.tipo === 'inimigo' ? telaEditaInimigo(e.id) : telaEditaItem(e.id);
    if (act === 'duelo') return dueloOficina(e);
    if (act === 'codigo') return ofCopia(e.tipo === 'inimigo' ? codigoInimigo(e) : codigoItem(e));
    if (act === 'apagar') { if (e.publicado) { toast('Retire da turma antes de apagar.'); return; } if (confirm(`Apagar "${e.nome}"?`)) { Oficina.apaga(e.tipo, e.id); telaOficina(aba); } return; }
    try {
      if (act === 'publicar') { e.autor = ofAutor() || e.autor; await Oficina.publica(e); toast('🌐 Publicado para a turma!'); }
      if (act === 'retirar') { await Oficina.retira(e); toast('↩️ Retirado da turma.'); }
      telaOficina(aba);
    } catch (err) { toast('🚫 ' + (err.message === 'Failed to fetch' ? 'Sem servidor: rode o servidor.py para publicar.' : err.message)); }
  };
}

/* ---- Duelo de teste: enfrenta o seu inimigo sem mexer no ranking nem no save ---- */
function dueloOficina(e) {
  const def = defInimigo(e);
  novaRun('Testador', 'guerreiro', { ...CLASSES.guerreiro.base, for: 11, vit: 9 }, {});
  G.teste = true; G.andar = Math.max(1, e.min); G.nivel = Math.max(1, Math.round(G.andar * 0.8)); G.cons.suco = 2;
  const st = stats(G); G.hp = st.hpMax; G.en = st.enMax; hud();
  iniciarCombate(def, {});
}
function voltarDaOficina() { G = null; C = null; hud(); telaOficina(); }

/* ---- Editor de inimigo ---- */
function telaEditaInimigo(id) {
  const orig = id ? Oficina.acha('inimigo', id) : null;
  const S = orig ? { ...orig } : { id: ofId(), tipo: 'inimigo', nome: '', icone: '👹', min: 1, hp: 1, atk: 1, def: 1, traco: '', ritmo: 0, fala: '', autor: ofAutor(), token: '', publicado: false };
  const slider = (k, nome, a, b) => `<label class="campo">${nome}: <b id="v-${k}">${S[k]}</b><input type="range" id="f-${k}" min="${a}" max="${b}" step="0.1" value="${S[k]}"></label>`;
  tela(`<h2>👹 ${orig ? 'Editar' : 'Criar'} inimigo</h2>
    <div class="of-editor"><div class="painel">
      <label class="campo">Nome<input id="f-nome" maxlength="40" placeholder="Ex.: Pastel Zumbi da Cantina" value="${esc(S.nome)}"></label>
      <div class="campo">Ícone <small class="suave">(escolha ou digite um emoji)</small>
        <div class="of-icones">${OF_ICONES.map(i => `<button class="btn mini ${i === S.icone ? 'primario' : ''}" data-icone="${i}">${i}</button>`).join('')}<input id="f-icone" maxlength="6" value="${esc(S.icone)}" style="width:70px"></div></div>
      <label class="campo">Aparece a partir do andar: <b id="v-min">${S.min}</b><input type="range" id="f-min" min="1" max="9" step="1" value="${S.min}"></label>
      ${slider('hp', '❤️ Vida (× o normal)', 0.5, 2.5)}${slider('atk', '⚔️ Ataque (× o normal)', 0.5, 2)}${slider('def', '🛡️ Defesa (× o normal)', 0.5, 2)}
      <label class="campo">Característica<select id="f-traco">${Object.entries(OF_TRACOS).map(([k, n]) => `<option value="${k}" ${S.traco === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="campo">Ritmo<select id="f-ritmo">${Object.entries(OF_RITMOS).map(([k, n]) => `<option value="${k}" ${+S.ritmo === +k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="campo">Fala ao aparecer<input id="f-fala" maxlength="80" placeholder="Ex.: Quem mexeu no meu recheio?" value="${esc(S.fala)}"></label>
    </div><div class="painel" id="of-prev"></div></div>
    <div class="linha centro"><button class="btn" id="b-voltar">⬅️ Voltar</button><button class="btn" id="b-duelo">⚔️ Duelo de teste</button><button class="btn primario grande" id="b-salva">💾 Salvar</button></div>`);
  const pega = () => validaInimigo({ ...S, id: S.id });
  const atualiza = () => {
    const e = pega(); const el = $('#of-prev'); if (!el) return;
    if (!e) { el.innerHTML = '<p class="suave centro">Dê um nome ao inimigo para ver a prévia.</p>'; return; }
    const d = e.min, hp = Math.round((14 + d * 7 + d * d * 0.15) * e.hp), atk = Math.max(2, Math.round((3 + d * 1.5) * e.atk)), ca = 8 + Math.round(d * 0.6) + Math.round((e.def - 1) * 3) + (e.traco === 'esquiva' ? 3 : 0);
    el.innerHTML = `<div class="of-prev-card"><div class="sprite" style="font-size:4rem">${e.icone}</div><b>${esc(e.nome)}</b>
      <small class="suave">No andar ${d}: ❤️ ${hp} · ⚔️ ${atk} · 🛡️ CA ${ca}<br>Recompensa: ✨ ×${ofXp(e)} XP · 💰 ×${ofOuro(e)} ouro <i>(calculados pela força dele)</i></small>
      ${e.fala ? `<i>“${esc(e.fala)}”</i>` : ''}</div><h3>📜 O código disso em dados.js</h3><pre class="codigo">${esc(codigoInimigo(e))}</pre><button class="btn mini" id="b-cod">📋 Copiar código</button>`;
    $('#b-cod').onclick = () => ofCopia(codigoInimigo(e));
  };
  const liga = (k, f = v => v) => { const el = $('#f-' + k); el.oninput = () => { S[k] = f(el.value); const v = $('#v-' + k); if (v) v.textContent = S[k]; atualiza(); }; };
  liga('nome'); liga('fala'); liga('min', Number); liga('hp', Number); liga('atk', Number); liga('def', Number); liga('traco'); liga('ritmo', Number);
  $('#f-icone').oninput = e => { S.icone = e.target.value; atualiza(); };
  document.querySelectorAll('[data-icone]').forEach(b => b.onclick = () => { S.icone = b.dataset.icone; $('#f-icone').value = S.icone; document.querySelectorAll('[data-icone]').forEach(x => x.classList.toggle('primario', x === b)); atualiza(); });
  $('#b-voltar').onclick = () => telaOficina('inimigos');
  $('#b-duelo').onclick = () => { const e = pega(); if (!e) return toast('Dê um nome ao inimigo primeiro.'); dueloOficina(e); };
  $('#b-salva').onclick = () => { const e = pega(); if (!e) return toast('Dê um nome ao inimigo primeiro.'); e.autor = ofAutor() || e.autor; e.token = S.token; e.publicado = S.publicado; Oficina.guarda(e); Som.tocar('item'); toast('💾 Inimigo salvo! Ele já pode aparecer nas suas aventuras.'); telaOficina('inimigos'); };
  atualiza();
}

/* ---- Editor de item (com orçamento de pontos) ---- */
function telaEditaItem(id) {
  const orig = id ? Oficina.acha('item', id) : null;
  const S = orig ? { ...orig, passos: { ...orig.passos } } : { id: ofId(), tipo: 'item', nome: '', slot: 'arma', raridade: 1, classe: 'guerreiro', passos: {}, tag: '', flavor: '', autor: ofAutor(), token: '', publicado: false };
  tela(`<h2>⚔️ ${orig ? 'Editar' : 'Criar'} item</h2>
    <div class="of-editor"><div class="painel">
      <label class="campo">Nome<input id="f-nome" maxlength="40" placeholder="Ex.: Colher de Pau do Chefe" value="${esc(S.nome)}"></label>
      <div class="linha"><label class="campo">Tipo<select id="f-slot">${Object.entries(OF_SLOTS).map(([k, n]) => `<option value="${k}" ${S.slot === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="campo">Raridade<select id="f-raridade">${RARIDADES.map((r, i) => `<option value="${i}" ${S.raridade === i ? 'selected' : ''}>${r.nome}</option>`).join('')}</select></label>
        <label class="campo" id="w-classe">Classe da arma<select id="f-classe">${Object.entries(CLASSES).map(([k, c]) => `<option value="${k}" ${S.classe === k ? 'selected' : ''}>${c.icone} ${c.nome}</option>`).join('')}</select></label></div>
      <label class="campo">Tema (sinergias) <small class="suave">opcional</small><select id="f-tag"><option value="">Nenhum</option>${Object.entries(TAGS).map(([k, t]) => `<option value="${k}" ${S.tag === k ? 'selected' : ''}>${t.icone} ${t.nome}</option>`).join('')}</select></label>
      <div class="campo"><b>Bônus</b> <span id="of-pontos" class="ouro"></span><div id="of-mods"></div></div>
      <label class="campo">Frase de efeito<input id="f-flavor" maxlength="100" placeholder="Ex.: Receita secreta da vovó." value="${esc(S.flavor)}"></label>
    </div><div class="painel" id="of-prev"></div></div>
    <div class="linha centro"><button class="btn" id="b-voltar">⬅️ Voltar</button><button class="btn primario grande" id="b-salva">💾 Salvar</button></div>`);
  const orc = () => OF_ORCAMENTO[S.raridade], gasto = () => ofCustoItem(S.passos);
  const modsHtml = () => OF_MODS.map(m => {
    const n = S.passos[m.k] || 0, maxN = Math.floor(m.max / m.passo), val = n * m.passo, pode = n < maxN && gasto() + m.custo <= orc();
    return `<div class="of-mod"><span>${m.icone} ${m.nome}</span><small class="suave">${m.custo} pt/clique</small>
      <button class="btn mini" data-mod="${m.k}" data-d="-1" ${n <= 0 ? 'disabled' : ''}>−</button><b class="of-val">+${val}</b><button class="btn mini" data-mod="${m.k}" data-d="1" ${pode ? '' : 'disabled'}>+</button></div>`;
  }).join('');
  const atualiza = () => {
    if (gasto() > orc()) { S.passos = {}; }   // trocou para uma raridade menor: zera os bônus
    $('#of-pontos').textContent = `${orc() - gasto()} de ${orc()} pontos livres`;
    $('#of-mods').innerHTML = modsHtml();
    $('#w-classe').style.display = S.slot === 'arma' ? '' : 'none';
    document.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => { const k = b.dataset.mod; S.passos[k] = Math.max(0, (S.passos[k] || 0) + Number(b.dataset.d)); if (!S.passos[k]) delete S.passos[k]; Som.tocar('click'); atualiza(); });
    const e = validaItem({ ...S, id: S.id }), el = $('#of-prev');
    if (!e) { el.innerHTML = '<p class="suave centro">Dê um nome ao item para ver a prévia.</p>'; return; }
    const d = defItem(e), r = RARIDADES[e.raridade];
    el.innerHTML = `<div class="item-card r${e.raridade}" style="--cor:${r.cor}"><div class="item-tipo">${OF_SLOTS[e.slot]} · <b>${r.nome}</b></div><h3>${nomeItem(d)}</h3>
      <div class="item-stats">${[d.atk ? `⚔️ Ataque +${d.atk}` : '', d.def ? `🛡️ Defesa +${d.def}` : '', ...linhasItem({ mods: d.mods })].filter(Boolean).map(l => `<div>${esc(l)}</div>`).join('')}</div>
      ${e.tag ? `<div class="tags-linha">${ofTagsHtml(e)}</div>` : ''}<p class="flavor">“${esc(d.flavor)}”</p></div>
      <h3>📜 O código disso</h3><pre class="codigo">${esc(codigoItem(e))}</pre><button class="btn mini" id="b-cod">📋 Copiar código</button>`;
    $('#b-cod').onclick = () => ofCopia(codigoItem(e));
  };
  const liga = (k, f = v => v) => { $('#f-' + k).oninput = ev => { S[k] = f(ev.target.value); atualiza(); }; };
  liga('nome'); liga('flavor'); liga('slot'); liga('raridade', Number); liga('classe'); liga('tag');
  $('#b-voltar').onclick = () => telaOficina('itens');
  $('#b-salva').onclick = () => { const e = validaItem({ ...S, id: S.id }); if (!e) return toast('Dê um nome ao item (e confira os pontos).'); e.autor = ofAutor() || e.autor; e.token = S.token; e.publicado = S.publicado; Oficina.guarda(e); Som.tocar('item'); toast('💾 Item salvo! Ele já pode cair nas suas aventuras.'); telaOficina('itens'); };
  atualiza();
}
