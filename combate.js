'use strict';
/* =========================================================================
   COMBATE — d20 contra a CA, habilidades, poções, inimigos, fases dos chefões e companheiros.
   Tudo o que acontece dentro de uma luta está aqui.
   ========================================================================= */

/* ============ 5) COMBATE ============ */
function montaInimigo(t, o = {}) {
  const d = G.andar;
  const hp = Math.round((14 + d * 7 + d * d * 0.15) * t.hp * (o.mhp || 1));
  return {
    nome: t.nome, icone: t.icone, hpMax: hp, hp,
    atk: Math.max(2, Math.round((3 + d * 1.5) * t.atk * (o.matk || 1))),
    def: Math.floor(d * 0.4 * (t.def || 1)),
    /* Classe de Armadura do inimigo: cresce com o andar. Chefões e bichos blindados são mais difíceis de acertar. */
    ca: 8 + Math.round(d * 0.6) + Math.round(((t.def || 1) - 1) * 3) + (t.traco === 'esquiva' ? 3 : 0) + (o.boss ? 1 : 0) + (o.elite ? 1 : 0) + (temMod('ca_ouro') ? 2 : 0),
    atkB: 1 + Math.floor(d * 0.55) + (o.boss ? 1 : 0) + (o.elite ? 1 : 0),   // bônus de acerto do inimigo
    xp: Math.round((8 + d * 4) * (t.xp || 1) * (o.mxp || 1)),
    ouro: Math.round((6 + d * 3) * (t.ouro || 1) * (o.mouro || 1) * (temMod('ca_ouro') ? 2 : 1)),
    traco: t.traco, ritmo: t.ritmo, especial: t.especial, falas: t.falas,
    autor: t.autor || '', fases: t.fases || null, fase: 0, golpes: 1, escudo: 0, regen: 0, aura: 0, drenaEn: 0,   // chefões mudam de fase (veja entraFase)
    boss: !!o.boss, elite: !!o.elite, st: { dots: [], atordoado: 0 }, turno: 0,
  };
}

function iniciarCombate(def, o = {}) {
  const e = montaInimigo(def, o);
  C = { e, ps: { veneno: null, escudo: 0, esquiva: false, buff: null }, log: [], ocupado: false, fim: false, turno: 0, fugiu: false, tomou: false, ultimoCrit: false };
  telaCombate();
  log(e.boss ? `👑 <b>CHEFÃO!</b> ${esc(e.nome)} bloqueia o caminho!` : `${e.icone} <b>${esc(e.nome)}</b> apareceu!`);
  if (e.falas && e.falas.length) log(`💬 <i>“${esc(pick(e.falas))}”</i>`);
  if (e.autor) log(`🛠️ <small>Criado por <b>${esc(e.autor)}</b> na Oficina do Aprendiz.</small>`);
  racaPreCombate();   // parentes pegam leve, rivais são lembrados
  atualizarCombate(); Som.tocar('inicio');
}

function telaCombate() {
  const e = C.e;
  tela(`<div class="combate">
    <div class="arena ${e.boss ? 'arena-chefe' : ''}">
      <div class="lutador" id="l-heroi"><div class="badges" id="bd-heroi"></div><div class="sprite" id="s-heroi">${CLASSES[G.classe].icone}</div>
        <div class="nm">${esc(G.nome)}</div><div class="ca-tag">🛡️ CA ${stats(G).ca}</div><div class="barra hp"><i id="hp-heroi"></i><span id="hpt-heroi"></span></div></div>
      <div class="vs">${e.boss ? '👑' : 'VS'}</div>
      <div class="lutador inimigo ${e.boss ? 'chefe' : ''} ${e.elite ? 'elite' : ''}" id="l-ini"><div class="badges" id="bd-ini"></div><div class="sprite" id="s-ini">${e.icone}</div>
        <div class="nm">${esc(e.nome)}</div><div class="ca-tag">🛡️ CA ${e.ca}</div><div class="fase-tag" id="fase-tag"></div><div class="barra hp"><i id="hp-ini"></i>${(e.fases || []).map(f => `<u class="marca-fase" style="left:${f.hp * 100}%" title="${esc(f.titulo)}"></u>`).join('')}<span id="hpt-ini"></span></div></div>
    </div>
    <div class="aliados" id="aliados"></div>
    <div class="log" id="log"></div><div class="acoes" id="acoes"></div></div>`, 'combate-tela');
  $('#acoes').onclick = ev => {
    const b = ev.target.closest('button'); if (!b || b.disabled) return;
    const k = b.dataset.k;
    if (k === 'atk') acaoAtacar(); else if (k === 'hab') usarHabilidade(b.dataset.id);
    else if (k === 'cons') usarConsumivel(b.dataset.id); else if (k === 'fugir') fugir();
    else if (k === 'cont') avancar();
  };
}

function log(html) {
  C.log.push(html); if (C.log.length > 8) C.log.shift();
  const el = $('#log'); if (el) { el.innerHTML = C.log.map(l => `<div>${l}</div>`).join(''); el.scrollTop = el.scrollHeight; }
}
function flutua(id, txt, cls) {
  const el = document.getElementById(id); if (!el) return;
  const s = document.createElement('span'); s.className = 'num ' + cls; s.textContent = txt; s.style.left = rnd(25, 65) + '%';
  el.appendChild(s); setTimeout(() => s.remove(), 1100);
}
/** Mostra o dado rolado no centro da arena. */
function dado(valor, cls) {
  const v = $('.vs'); if (!v) return;
  const e = C.e;
  v.innerHTML = `<span class="dado ${cls}">${valor}</span>`;
  clearTimeout(dado.t); dado.t = setTimeout(() => { const x = $('.vs'); if (x) x.textContent = e.boss ? '👑' : 'VS'; }, 900);
}
function treme(id) { const el = document.getElementById(id); if (!el) return; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }

function atualizarCombate() {
  if (!C || !$('#hp-ini')) return;
  const e = C.e, st = stats(G);
  $('#hp-ini').style.width = Math.max(0, e.hp / e.hpMax * 100) + '%'; $('#hpt-ini').textContent = `${e.hp}/${e.hpMax}`;
  $('#hp-heroi').style.width = Math.max(0, G.hp / st.hpMax * 100) + '%'; $('#hpt-heroi').textContent = `${G.hp}/${st.hpMax}`;
  const tagH = $('#l-heroi .ca-tag'); if (tagH) tagH.textContent = '🛡️ CA ' + (st.ca + (C.ps.guarda ? C.ps.guarda.v : 0));
  const bh = [];
  if (C.ps.veneno) bh.push(`<span title="Envenenado">☠️${C.ps.veneno.turnos}</span>`);
  if (C.ps.escudo > 0) bh.push(`<span title="Escudo">🔮${C.ps.escudo}</span>`);
  if (C.ps.esquiva) bh.push('<span title="Esquivará o próximo ataque">💨</span>');
  if (C.ps.buff) bh.push(`<span title="Dano aumentado">📢${C.ps.buff.turnos}</span>`);
  if (C.ps.mira) bh.push(`<span title="Acerto aumentado">🎯${C.ps.mira.turnos}</span>`);
  if (C.ps.guarda) bh.push(`<span title="CA aumentada">🛡️${C.ps.guarda.turnos}</span>`);
  if (G.inspirado && G.inspirado.combates > 0) bh.push('<span title="Inspirado pelo bardo">🎵</span>');
  $('#bd-heroi').innerHTML = bh.join('');
  const bi = e.st.dots.map(d => `<span>${d.tipo === 'queima' ? '🔥' : '🧪'}${d.turnos}</span>`);
  if (e.st.atordoado > 0) bi.push('<span>😵</span>');
  if (e.escudo > 0) bi.push(`<span title="Escudo do chefão">🛡️${e.escudo}</span>`);
  if (e.regen) bi.push('<span title="Regenera vida">💚</span>');
  if (e.aura) bi.push('<span title="Aura: você sofre dano a cada turno">🔥aura</span>');
  if (e.drenaEn) bi.push('<span title="Drena sua energia">📡</span>');
  if (e.golpes > 1) bi.push(`<span title="Ataca várias vezes por turno">⚔️×${e.golpes}</span>`);
  const tagE = $('#l-ini .ca-tag'); if (tagE) tagE.textContent = '🛡️ CA ' + e.ca;
  const ft = $('#fase-tag'); if (ft) ft.textContent = e.fases ? `⚡ Fase ${e.fase + 1}/${e.fases.length + 1}` : '';
  $('#bd-ini').innerHTML = bi.join('');
  const box = $('#aliados');
  if (box) box.innerHTML = G.aliados.map(a => { const d = ALIADOS[a.id], max = hpMaxAliado(a); return `<div class="aliado ${a.hp <= 0 ? 'caido' : ''}" title="${esc(d.desc)}"><span class="ai">${d.icone}</span><div class="ainfo"><b>${esc(d.nome)}</b> <small>Nv ${a.nivel}</small><div class="barra hp mini"><i style="width:${Math.max(0, a.hp / max * 100)}%"></i></div></div></div>`; }).join('');
  hud();
  if (!C.fim) renderAcoes();
}

function renderAcoes() {
  const box = $('#acoes'); if (!box) return;
  const off = C.ocupado ? 'disabled' : '';
  let h = `<button class="btn acao" data-k="atk" ${off}>🗡️ Atacar<small>${esc(G.equip.arma.nome)}</small></button>`;
  for (const id of G.skills) {
    const hb = HABILIDADES[id]; if (hb.tipo !== 'ativa') continue;
    const lv = G.skillNiv[id] || 1, ok = G.en >= hb.custo;
    h += `<button class="btn acao hab" data-k="hab" data-id="${id}" ${(C.ocupado || !ok) ? 'disabled' : ''} title="${esc(hb.desc)}">${hb.icone} ${hb.nome}${lv > 1 ? ' Nv' + lv : ''}<small>${hb.custo} ⚡ · ${hb.desc}</small></button>`;
  }
  for (const id in G.cons) if (G.cons[id] > 0) {
    const c = CONSUMIVEIS[id];
    h += `<button class="btn acao cons" data-k="cons" data-id="${id}" ${off || consBloq(id) ? 'disabled' : ''}>${c.icone} ${c.nome} ×${G.cons[id]}<small>${c.desc}</small></button>`;
  }
  if (!C.e.boss && !temMod('sem_fuga')) h += `<button class="btn acao" data-k="fugir" ${off}>🏃 Fugir<small>${Math.round(chaFuga() * 100)}% de chance</small></button>`;
  box.innerHTML = h;
}
const chaFuga = () => temMod('sem_fuga') ? 0 : Math.min(0.85, 0.4 + stats(G).s.des * 0.02);
/** Com "Só Cura em Fogueira", poções que curam vida ficam bloqueadas. */
const consBloq = id => curaOff() && !!CONSUMIVEIS[id].hpPct;

/** Executa a ação do jogador, depois o turno do inimigo. */
async function acao(fn) {
  if (!C || C.ocupado || C.fim) return;
  C.ocupado = true; C.turno++;
  fn(); atualizarCombate();
  if (await checaFim()) return;
  await sleep(550);
  tickInimigo(); atualizarCombate();
  if (await checaFim()) return;
  turnoAliados(); atualizarCombate();                 // os companheiros agem depois de você
  if (await checaFim()) return;
  ataqueInimigo(); atualizarCombate();
  if (await checaFim()) return;
  for (let k = 1; k < (C.e.golpes || 1) && !C.ataqueAnulado; k++) {   // chefão em fase de ataques múltiplos
    await sleep(450); ataqueInimigo(true); atualizarCombate();
    if (await checaFim()) return;
  }
  fimDoTurno(); atualizarCombate();
  if (await checaFim()) return;
  C.ocupado = false; atualizarCombate();
}

/** Todo dano no inimigo passa por aqui: o escudo (de chefões em fase nova) absorve primeiro. */
function danoNoInimigo(d) {
  const e = C.e;
  if (e.escudo > 0) { const a = Math.min(e.escudo, d); e.escudo -= a; d -= a; if (a) log(`🛡️ O escudo de ${esc(e.nome)} absorve ${a} de dano.`); }
  e.hp = Math.max(0, e.hp - d);
  return d;
}

/* ---- FASES DOS CHEFÕES: quando a vida cai abaixo do limite de uma fase, o chefão muda ---- */
function verificaFases() {
  const e = C.e;
  if (!e.fases || e.hp <= 0) return;      // morreu antes de mudar de fase? Então não ganha fase!
  while (e.fase < e.fases.length && e.hp / e.hpMax <= e.fases[e.fase].hp) { entraFase(e.fases[e.fase]); e.fase++; }
}
function entraFase(f) {
  const e = C.e, partes = [];
  if (f.matk) { e.atk = Math.max(1, Math.round(e.atk * f.matk)); if (f.matk > 1) partes.push(`⚔️ ataque +${Math.round((f.matk - 1) * 100)}%`); }
  if (f.caBonus) { e.ca += f.caBonus; partes.push(`🛡️ CA +${f.caBonus}`); }
  if (f.especial) { e.especial = f.especial; partes.push(`⚠️ ${f.especial.nome} a cada ${f.especial.cada} turnos`); }
  if (f.golpes) { e.golpes = f.golpes; partes.push(`⚔️ ataca ${f.golpes}× por turno`); }
  if (f.escudo) { const v = Math.round(e.hpMax * f.escudo); e.escudo += v; partes.push(`🛡️ escudo de ${v}`); }
  if (f.regen) { e.regen = f.regen; partes.push(`💚 regenera ${Math.round(f.regen * 100)}% por turno`); }
  if (f.aura) { e.aura = f.aura; partes.push(`🔥 aura: você sofre dano a cada turno`); }
  if (f.drenaEn) { e.drenaEn = f.drenaEn; partes.push(`📡 drena ${f.drenaEn} de energia por turno`); }
  if (f.cura) { const v = Math.round(e.hpMax * f.cura); e.hp = Math.min(e.hpMax, e.hp + v); partes.push(`💚 recupera ${v} de vida`); }
  log(`<span class="fase-log">⚡ <b>${f.titulo}</b></span>`);
  if (f.fala) log(`💬 <i>“${esc(f.fala)}”</i>`);
  if (partes.length) log(`<small>${partes.join(' · ')}</small>`);
  e.st.atordoado = Math.max(e.st.atordoado, 1);   // o chefão ruge ao mudar de fase e perde a vez: um respiro para você
  log(`🗣️ ${esc(e.nome)} ruge e perde a vez!`);
  mostraFase(f.titulo); Som.tocar('fase'); treme('s-ini');
  const cb = $('.combate'); if (cb) { cb.classList.remove('tremor'); void cb.offsetWidth; cb.classList.add('tremor'); }
}
/** Faixa grande no meio da arena anunciando a nova fase. */
function mostraFase(titulo) {
  const arena = $('.arena'); if (!arena) return;
  const b = document.createElement('div'); b.className = 'fase-banner'; b.textContent = titulo; arena.appendChild(b);
  setTimeout(() => b.remove(), 2400);
}

async function checaFim() {
  verificaFases();
  if (C.fugiu) { fugaConcluida(); return true; }
  if (C.e.hp <= 0) { await vitoria(); return true; }
  if (G.hp <= 0) { await derrota(); return true; }
  return false;
}

function golpeJogador(escala, mult, o = {}) {
  const st = stats(G), e = C.e;
  let base = (st.atk + st.s[escala] * 1.2) * mult;
  base *= 1 + (C.ps.buff ? C.ps.buff.pct : 0) + (G.inspirado && G.inspirado.combates > 0 ? G.inspirado.pct : 0);
  base *= rnd(90, 110) / 100;
  base *= st.danoMult * racaDanoMult(e);   // classe (Bárbaro) e raça (Fúria Orc, rivais)
  if (temMod('vidro')) base *= 1.5;   // Canhão de Vidro: bate forte...
  /* ---- Rolagem de acerto: d20 + bônus contra a CA do inimigo ---- */
  let roll = rnd(1, 20);
  if (roll === 1 && !C.rerrolou && temSin('rerrola')) { C.rerrolou = true; roll = rnd(1, 20); log(`🍀 <b>Trevo Triplo!</b> Um 1 natural é rolado de novo: agora saiu ${roll}.`); }
  let extraAcerto = 0;
  if (temSin('emboscada') && !C.emboscou) { C.emboscou = true; extraAcerto = 3; base *= 1.5; log('🌑 <b>Sombra Dançante!</b> Emboscada: +3 de acerto e +50% de dano.'); }
  if (C.ps.escudo > 0 && temSin('escudo_ardente')) base *= 1.25;
  const bonus = Math.floor(st.s[escala] / 3) + st.acertoBase + (o.acerto || 0) + extraAcerto + (C.ps.mira ? C.ps.mira.v : 0);
  const total = roll + bonus;
  if (roll === 1) G.est.nat1++; if (roll === 20) G.est.nat20++;   // para as conquistas
  const critNat = roll >= st.critMin;                       // 20 natural (ou menos, com Destreza/Sorte altas)
  const acertou = roll !== 1 && (critNat || total >= e.ca); // 1 natural sempre erra, crítico sempre acerta
  const crit = acertou && (critNat || !!o.critGarantido);
  const txtRoll = `🎲 d20 (${roll}) ${bonus >= 0 ? '+' : '−'} ${Math.abs(bonus)} = <b>${total}</b> contra CA ${e.ca}`;
  dado(roll, !acertou ? (roll === 1 ? 'falha' : 'erro') : crit ? 'crit' : 'ok');
  if (!acertou) {
    log(`${txtRoll} — <b>ERROU</b>${roll === 1 ? ' (falha crítica! 😬)' : ''}.`); flutua('l-ini', 'ERROU', 'miss'); Som.tocar('miss'); return 0;
  }
  if (crit) base *= 2;                                       // crítico: dano dobrado
  const d = Math.max(1, Math.round(base - (o.ignoraDef ? 0 : e.def)));
  danoNoInimigo(d);
  flutua('l-ini', (crit ? '💥' : '') + '-' + d, crit ? 'crit' : 'dano'); treme('s-ini'); Som.tocar(crit ? 'crit' : 'hit');
  log(`${txtRoll} — ${crit ? '💥 <b>CRÍTICO!</b> Dano dobrado: ' : 'acertou! '}<b>${d}</b> de dano.`);
  racaAposAcerto();   // Sopro Ancestral do Draconato
  if (st.roubaVida && !curaOff()) { const c = Math.round(d * st.roubaVida); if (c > 0) { G.hp = Math.min(st.hpMax, G.hp + c); flutua('l-heroi', '+' + c, 'cura'); } }
  return d;
}

function acaoAtacar() {
  acao(() => { const esc_ = CLASSES[G.classe].principal; golpeJogador(esc_, 1); });
}

function usarHabilidade(id) {
  const h = HABILIDADES[id], lv = G.skillNiv[id] || 1, f = 1 + 0.25 * (lv - 1), st = stats(G);
  if (G.en < h.custo) return;
  acao(() => {
    G.en -= h.custo;
    log(`${h.icone} Você usa <b>${h.nome}</b>!`);
    let acertou = !h.mult;   // habilidades sem dano (buffs etc.) sempre "funcionam"
    const berserker = id === 'golpe_poderoso' && !!C.ps.buff && temSin('berserker');   // sinergia: Grito de Guerra + Golpe Poderoso
    if (berserker) log('😡 <b>Berserker!</b> O golpe ignora a defesa e ganha +4 de acerto.');
    const queimando = C.e.st.dots.some(d => d.tipo === 'queima');
    if (h.mult) {
      for (let i = 0; i < (h.golpes || 1); i++) if (C.e.hp > 0 && golpeJogador(h.escala, h.mult * f, { critGarantido: h.critGarantido, ignoraDef: h.ignoraDef || berserker, acerto: (h.acerto || 0) + (berserker ? 4 : 0) })) acertou = true;
    }
    const poder = st.atk + (h.escala ? st.s[h.escala] * 1.2 : 0);
    const choque = id === 'raio_gelido' && queimando && temSin('choque');                // sinergia: Bola de Fogo + Raio Gélido
    if (h.atordoa && acertou && C.e.hp > 0 && (choque || chance(Math.min(0.95, h.atordoa * f)))) { C.e.st.atordoado = 1; log(choque ? `🧊 <b>Choque Térmico!</b> ${esc(C.e.nome)} congela na hora!` : `😵 ${esc(C.e.nome)} ficou atordoado!`); }
    if (id === 'martelada_santa' && acertou && C.e.hp > 0 && temSin('martelo_ardente')) {   // sinergia: Martelada Santa + Chama de Varthos
      const dq = Math.max(1, Math.round(poder * 0.25 * f * (temSin('fornalha') ? 1.5 : 1)));
      C.e.st.dots = C.e.st.dots.filter(d => d.tipo !== 'queima'); C.e.st.dots.push({ tipo: 'queima', dano: dq, turnos: 3 });
      log(`🔥 <b>Martelo Ardente!</b> O martelo incendeia o alvo (${dq}/turno).`);
    }
    if (id === 'golpe_furtivo' && acertou && C.e.hp > 0 && temSin('lamina')) {            // sinergia: Golpe Furtivo + Veneno
      const dv = Math.max(1, Math.round(poder * 0.3 * f));
      C.e.st.dots = C.e.st.dots.filter(d => d.tipo !== 'veneno'); C.e.st.dots.push({ tipo: 'veneno', dano: dv, turnos: 3 });
      log(`☠️ <b>Lâmina Envenenada!</b> O alvo foi envenenado (${dv}/turno).`);
    }
    if (h.dot && acertou && C.e.hp > 0) {
      const dano = Math.max(1, Math.round(poder * h.dot.pct * f * (h.dot.tipo === 'queima' && temSin('fornalha') ? 1.5 : 1)));
      C.e.st.dots = C.e.st.dots.filter(d => d.tipo !== h.dot.tipo); C.e.st.dots.push({ tipo: h.dot.tipo, dano, turnos: h.dot.turnos });
      log(`${h.dot.tipo === 'queima' ? '🔥 Inimigo em chamas' : '🧪 Inimigo envenenado'} (${dano}/turno).`);
    }
    if (h.buff) { C.ps.buff = { pct: h.buff.pct * f, turnos: h.buff.turnos + 1 }; log(`📢 Seu dano aumenta ${Math.round(h.buff.pct * f * 100)}%!`); }
    if (h.buffAcerto) { C.ps.mira = { v: Math.round(h.buffAcerto.v * f), turnos: h.buffAcerto.turnos + 1 + (temSin('zen') ? 2 : 0) }; log(`🎯 Seus ataques ganham +${C.ps.mira.v} de acerto!`); }
    if (h.buffCA) { C.ps.guarda = { v: Math.round(h.buffCA.v * f), turnos: h.buffCA.turnos + 1 + (temSin('zen') ? 2 : 0) }; log(`🛡️ Sua CA sobe +${C.ps.guarda.v}!`); }
    if (h.esquiva) { C.ps.esquiva = true; log('💨 Você se esconde na fumaça.'); }
    if (h.escudo) { const v = Math.round((h.escudo.base + st.s[h.escudo.escala] * h.escudo.mult) * f); C.ps.escudo += v; log(`🔮 Escudo de ${v} pontos!`); flutua('l-heroi', '🔮' + v, 'cura'); }
    if (h.cura && curaOff()) log('🚫 A cura não funciona fora das fogueiras (regra maluca).');
    else if (h.cura) {
      const dobro = id === 'luz_sagrada' && temSin('redentora') ? 2 : 1;   // sinergia Luz Redentora
      const v = Math.round(st.hpMax * (h.cura.pct * dobro + (temSin('folego') ? 0.15 : 0)) * f);
      G.hp = Math.min(st.hpMax, G.hp + v); log(`💚 Você recupera ${v} de vida${dobro > 1 ? ' (<b>Luz Redentora</b>!)' : ''}.`); flutua('l-heroi', '+' + v, 'cura');
      if (id === 'mao_curadora' && temSin('santuario')) { const e = Math.round(v * 0.5); C.ps.escudo += e; log(`⛪ <b>Santuário!</b> A cura vira um escudo de ${e} pontos.`); }
    }
    if (h.energia) { const v = Math.round(h.energia * f); G.en = Math.min(st.enMax, G.en + v); log(`⚡ Você recupera ${v} de energia.`); }
  });
}

function usarConsumivel(id) {
  if (!(G.cons[id] > 0)) return;
  if (consBloq(id)) { toast('🚫 Com “Só Cura em Fogueira”, essa poção não funciona.'); return; }
  acao(() => { aplicaConsumivel(id); log(`${CONSUMIVEIS[id].icone} Você usa <b>${CONSUMIVEIS[id].nome}</b>.`); });
}
function aplicaConsumivel(id) {
  if (consBloq(id)) { toast('🚫 Com “Só Cura em Fogueira”, essa poção não funciona.'); return; }
  const c = CONSUMIVEIS[id], st = stats(G); G.cons[id]--; G.est.cons++;
  if (c.hpPct) { const v = Math.round(st.hpMax * c.hpPct * (temSin('banquete') ? 1.25 : 1) * (temEf('nao_morto') ? 0.5 : 1)); const a = G.hp; G.hp = Math.min(st.hpMax, G.hp + v); if (C && !C.fim) flutua('l-heroi', '+' + (G.hp - a), 'cura'); }
  if (c.en) G.en = Math.min(st.enMax, G.en + c.en);
  Som.tocar('item');
}

function fugir() {
  acao(() => {
    if (chance(chaFuga())) { C.fugiu = true; G.est.fugas++; log('🏃 Você escapou por um triz!'); }
    else log('🏃 Você tentou fugir, mas tropeçou no próprio cadarço!');
  });
}
function fugaConcluida() {
  C.fim = true; mus('modo', 0); fimCombateAliados(false); if (G.inspirado) G.inspirado.combates--; atualizarCombate();
  $('#acoes').innerHTML = `<div class="resultado"><h3>🏃 Fuga!</h3><p>Você fugiu, sem recompensas.</p><button class="btn primario grande" data-k="cont">Continuar ➡️</button></div>`;
}

function tickInimigo() {
  const e = C.e;
  if (e.regen && e.hp > 0) {   // chefão em fase de regeneração
    const c = Math.max(1, Math.round(e.hpMax * e.regen)), antes = e.hp; e.hp = Math.min(e.hpMax, e.hp + c);
    if (e.hp > antes) { log(`💚 ${esc(e.nome)} regenera ${e.hp - antes} de vida.`); flutua('l-ini', '+' + (e.hp - antes), 'cura'); }
  }
  for (const d of e.st.dots) {
    danoNoInimigo(d.dano); d.turnos--;
    flutua('l-ini', '-' + d.dano, d.tipo === 'queima' ? 'fogo' : 'veneno');
    log(`${d.tipo === 'queima' ? '🔥' : '🧪'} ${esc(e.nome)} sofre ${d.dano} de ${d.tipo}.`);
  }
  e.st.dots = e.st.dots.filter(d => d.turnos > 0);
}

/** extra = true: golpe adicional de um chefão que ataca várias vezes por turno (sem especial, sem atordoamento). */
function ataqueInimigo(extra = false) {
  const e = C.e, st = stats(G);
  if (e.hp <= 0) return;
  let mult = 1;
  if (!extra) {
    C.ataqueAnulado = false; e.turno++;
    if (e.st.atordoado > 0) { e.st.atordoado--; C.ataqueAnulado = true; log(`😵 ${esc(e.nome)} está atordoado e perde a vez.`); return; }
    if (e.ritmo) {
      if (e.turno % e.ritmo !== 0) { C.ataqueAnulado = true; log(`💤 ${esc(e.nome)} ${pick(['boceja.', 'olha o celular.', 'coça a cabeça.', 'tira uma soneca em pé.'])}`); return; }
      mult = 1.8;
    }
    if (e.especial && e.turno % e.especial.cada === 0) { mult = e.especial.mult; log(`⚠️ ${esc(e.nome)} usa <b>${e.especial.nome}</b>!`); }
  } else log(`⚡ ${esc(e.nome)} ataca de novo!`);
  /* ---- Companheiros: o inimigo pode mirar neles, ou um fantasma pode atravessar o golpe ---- */
  const vivos = G.aliados.filter(a => a.hp > 0);
  if (vivos.length) {
    const prot = vivos.find(a => ALIADOS[a.id].acao.tipo === 'protege');
    if (prot && chance(ALIADOS[prot.id].acao.chance)) { log(`${ALIADOS[prot.id].icone} <b>${ALIADOS[prot.id].nome}</b> atravessa o golpe para te proteger! O ataque erra.`); flutua('l-heroi', 'PROTEGIDO', 'miss'); return; }
    const pChama = Math.max(0.15, ...vivos.map(a => ALIADOS[a.id].chama || 0));
    if (chance(pChama)) { ataqueAoAliado(pick(vivos), mult); return; }
  }
  if (C.ps.esquiva) { C.ps.esquiva = false; log('💨 O ataque atravessa a fumaça e acerta o vazio.'); flutua('l-heroi', 'ESQUIVOU', 'miss'); return; }
  /* ---- O inimigo também rola d20 contra a CA do herói ---- */
  const roll = rnd(1, 20), total = roll + e.atkB, ca = st.ca + (C.ps.guarda ? C.ps.guarda.v : 0);
  const critNat = roll === 20, acerta = roll !== 1 && (critNat || total >= ca);
  const txt = `🎲 ${e.icone} d20 (${roll}) + ${e.atkB} = <b>${total}</b> contra sua CA ${ca}`;
  dado(roll, !acerta ? 'erro' : critNat ? 'crit' : 'ok');
  if (!acerta) {
    log(`${txt} — <b>errou</b>${roll === 1 ? ' (falha crítica dele! 😂)' : ''}.`); flutua('l-heroi', 'ERROU', 'miss'); Som.tocar('miss');
    if (temSin('contra')) {   // sinergia Muralha de Ferro: contra-ataque
      const dc = Math.max(1, Math.round(st.atk * 0.6)); danoNoInimigo(dc);
      log(`⚙️ <b>Contra-ataque!</b> Você revida e causa ${dc} de dano.`); flutua('l-ini', '-' + dc, 'dano');
    }
    return;
  }
  C.ultimoCrit = critNat;
  const bruto = e.atk * mult * rnd(85, 115) / 100 * (critNat ? 2 : 1) * (temMod('pesadelo') ? 1.3 : 1) * (temMod('vidro') ? 1.5 : 1);
  if (critNat) log(`${txt} — 💥 <b>CRÍTICO inimigo!</b> Dano dobrado.`); else log(`${txt} — acertou.`);
  let d = Math.max(Math.ceil(bruto * 0.2), 1, Math.round(bruto - st.def * 0.4));
  if (C.ps.escudo > 0) { const a = Math.min(C.ps.escudo, d); C.ps.escudo -= a; d -= a; log(`🔮 O escudo absorve ${a} de dano.`); }
  if (d > 0) { C.tomou = true; G.hp = Math.max(0, G.hp - d); flutua('l-heroi', '-' + d, 'dano'); treme('s-heroi'); $('.combate').classList.remove('tremor'); void $('.combate').offsetWidth; $('.combate').classList.add('tremor'); Som.tocar('hurt'); }
  log(`${e.icone} ${esc(e.nome)} causa <b>${d}</b> de dano em você.`);
  if (d > 0 && e.traco === 'veneno' && !C.ps.veneno && chance(0.4)) { C.ps.veneno = { dano: Math.max(1, Math.round(e.atk * 0.25 * (temEf('estomago') ? 0.5 : 1))), turnos: 3 }; log('☠️ Você foi envenenado!'); }
  if (d > 0 && e.traco === 'rouba_ouro' && G.ouro > 0) { const r = Math.min(G.ouro, 5 + G.andar * 2); G.ouro -= r; log(`🦹 Ele roubou ${r} de ouro!`); }
  if (d > 0 && e.traco === 'rouba_vida') { const c = Math.round(d * 0.5); e.hp = Math.min(e.hpMax, e.hp + c); log(`🧛 ${esc(e.nome)} se cura em ${c}.`); }
}

/* ---- Companheiros em combate ---- */
const fatorAliado = a => (1 + 0.15 * (a.nivel - 1)) * (temSin('bando') ? 1.25 : 1);
const caAliado = () => 10 + Math.floor(G.andar * 0.5);

function golpeAliado(a, mult, critMin = 20) {
  const d = ALIADOS[a.id], e = C.e;
  const roll = rnd(1, 20), bonus = 3 + Math.floor(G.andar * 0.5) + a.nivel, total = roll + bonus;
  const crit = roll >= critMin, acerta = roll !== 1 && (crit || total >= e.ca);
  if (!acerta) { log(`${d.icone} ${d.nome} tenta ${roll === 1 ? 'atacar e tropeça' : 'atacar'} (d20 ${roll} + ${bonus} = ${total} contra CA ${e.ca}) — errou.`); return 0; }
  let dano = Math.max(1, Math.round((1.5 + G.andar * 0.8) * mult * rnd(90, 110) / 100) - Math.floor(e.def * 0.5));
  if (crit) dano *= 2;
  danoNoInimigo(dano); flutua('l-ini', (crit ? '💥' : '') + '-' + dano, crit ? 'crit' : 'dano'); treme('s-ini');
  log(`${d.icone} ${d.nome} ${d.verbo} ${esc(e.nome)} (d20 ${roll} + ${bonus} = ${total}) — ${crit ? '💥 <b>crítico!</b> ' : ''}<b>${dano}</b> de dano.`);
  return dano;
}

function turnoAliados() {
  const e = C.e, st = stats(G);
  for (const a of G.aliados) {
    if (a.hp <= 0 || e.hp <= 0) continue;
    const d = ALIADOS[a.id], ac = d.acao, f = fatorAliado(a), t = C.turno;
    if (ac.tipo === 'ataque' || ac.tipo === 'protege') golpeAliado(a, ac.mult * f, ac.critMin || 20);
    else if (ac.tipo === 'sopro') {
      if (t % ac.cada === 0) {
        const dano = Math.max(1, Math.round((2 + G.andar * 0.5) * ac.mult * f * (temSin('fornalha') ? 1.5 : 1)));
        e.st.dots = e.st.dots.filter(x => x.tipo !== 'queima'); e.st.dots.push({ tipo: 'queima', dano, turnos: 3 });
        log(`${d.icone} <b>${d.nome}</b> cospe fogo em ${esc(e.nome)}! Queimando (${dano}/turno).`); flutua('l-ini', '🔥', 'fogo');
      } else golpeAliado(a, 0.5 * f);
    } else if (ac.tipo === 'escudo') {
      if (t % ac.cada === 0) { const v = Math.round((4 + G.andar * 1.0) * ac.mult * f); C.ps.escudo += v; log(`${d.icone} <b>${d.nome}</b> conjura um escudo de ${v} pontos em você.`); flutua('l-heroi', '🔮' + v, 'cura'); }
    } else if (ac.tipo === 'cura') {
      if (t % ac.cada === 0) {
        if (curaOff()) log(`🚫 ${d.nome} reza, mas a cura não funciona fora das fogueiras.`);
        else { const v = Math.round(st.hpMax * ac.pct * f), antes = G.hp; G.hp = Math.min(st.hpMax, G.hp + v); log(`${d.icone} <b>${d.nome}</b> reza por você: +${G.hp - antes} de vida.`); flutua('l-heroi', '+' + (G.hp - antes), 'cura'); }
      }
    }
  }
}

/** O inimigo ataca um companheiro (em vez de você). */
function ataqueAoAliado(a, mult) {
  const e = C.e, d = ALIADOS[a.id], roll = rnd(1, 20), total = roll + e.atkB, ca = caAliado();
  const crit = roll === 20, acerta = roll !== 1 && (crit || total >= ca);
  if (!acerta) { log(`${e.icone} ${esc(e.nome)} ataca ${d.icone} <b>${d.nome}</b> (d20 ${roll} + ${e.atkB} = ${total} contra CA ${ca}) — errou.`); return; }
  const dano = Math.max(1, Math.round(e.atk * mult * 0.7 * rnd(85, 115) / 100 * (crit ? 2 : 1)));
  a.hp = Math.max(0, a.hp - dano);
  log(`${e.icone} ${esc(e.nome)} ataca ${d.icone} <b>${d.nome}</b> (d20 ${roll} + ${e.atkB} = ${total}) — ${crit ? '💥 crítico! ' : ''}<b>${dano}</b> de dano nele.`);
  if (a.hp <= 0) log(`😵 <b>${d.nome}</b> desmaiou! Ele volta depois do combate.`);
}

/** Depois do combate: vínculo, subida de nível e recuperação dos companheiros. */
function fimCombateAliados(ganhou) {
  for (const a of G.aliados) {
    const d = ALIADOS[a.id], caiu = a.hp <= 0;
    if (ganhou && !caiu) {
      a.vinculo += racaVinculo(a.id);   // amigos da sua raça ganham vínculo em dobro
      while (a.nivel < 5 && a.vinculo >= LIMIARES_VINCULO[a.nivel - 1]) { a.nivel++; toast(`⭐ ${d.icone} <b>${d.nome}</b> subiu para o nível ${a.nivel}!`, 'conq'); Som.tocar('level'); }
    }
    const max = hpMaxAliado(a);
    a.hp = caiu ? Math.round(max * 0.3) : Math.min(max, a.hp + Math.round(max * 0.25));
  }
}
const curaAliados = () => G.aliados.forEach(a => { a.hp = hpMaxAliado(a); });

function telaTrocaAliado(id) {
  const novo = ALIADOS[id];
  const cartao = (d, extra = '') => `<span class="al-ico">${d.icone}</span><b>${d.nome}</b><small>${d.desc}</small>${extra}`;
  tela(`<div class="evento"><div class="grande-ico">${novo.icone}</div><h2>O grupo está cheio!</h2>
    <div class="texto-evento"><b>${novo.nome}</b> quer se juntar a você, mas você só pode ter ${MAX_ALIADOS} companheiros. Quem fica no lugar?</div>
    <div class="grid3 trocas">${G.aliados.map((a, i) => `<button class="card troca" data-i="${i}">${cartao(ALIADOS[a.id], `<small class="suave">Nv ${a.nivel} · sai para dar lugar a ${novo.nome}</small>`)}</button>`).join('')}</div>
    <button class="btn grande" id="b-recusa">Manter o grupo como está</button></div>`);
  document.querySelectorAll('.troca').forEach(b => b.onclick = () => { Som.tocar('item'); G.aliados[+b.dataset.i] = novoAliado(id); avancar(); });
  $('#b-recusa').onclick = () => { Som.tocar('click'); avancar(); };
}

function fimDoTurno() {
  const st = stats(G);
  if (C.ps.veneno) {
    C.tomou = true; G.hp = Math.max(0, G.hp - C.ps.veneno.dano); flutua('l-heroi', '-' + C.ps.veneno.dano, 'veneno'); log(`☠️ O veneno causa ${C.ps.veneno.dano} de dano.`);
    if (--C.ps.veneno.turnos <= 0) C.ps.veneno = null;
  }
  if (C.ps.buff && --C.ps.buff.turnos <= 0) C.ps.buff = null;
  if (C.ps.mira && --C.ps.mira.turnos <= 0) C.ps.mira = null;
  if (C.ps.guarda && --C.ps.guarda.turnos <= 0) C.ps.guarda = null;
  G.en = Math.min(st.enMax, G.en + 1);
  const e = C.e;
  if (e.aura && e.hp > 0 && G.hp > 0) {   // aura do chefão: dano direto, ignora defesa
    const d = Math.max(1, Math.round(e.atk * e.aura)); C.tomou = true; G.hp = Math.max(0, G.hp - d);
    log(`🔥 A aura de ${esc(e.nome)} queima você: -${d} de vida.`); flutua('l-heroi', '-' + d, 'fogo');
  }
  if (e.drenaEn && e.hp > 0 && G.en > 0) { const d = Math.min(G.en, e.drenaEn); G.en -= d; log(`📡 ${esc(e.nome)} drena ${d} de energia sua.`); }
  if (st.regen && !curaOff() && G.hp > 0) {   // Graça de Arathor
    const a = G.hp; G.hp = Math.min(st.hpMax, G.hp + st.regen);
    if (G.hp > a) flutua('l-heroi', '+' + (G.hp - a), 'cura');
  }
}

async function vitoria() {
  C.fim = true; const e = C.e, st = stats(G);
  mus('modo', 0); Som.tocar('win'); atualizarCombate();
  const ouro = Math.round(e.ouro * (1 + st.ouro)), xp = e.xp;
  G.ouro += ouro; G.ouroTotal += ouro; G.kills++; if (e.boss) G.chefes++;
  G.en = Math.min(st.enMax, G.en + 3);
  fimCombateAliados(true);
  if (G.inspirado) G.inspirado.combates--;
  const subiu = ganhaXP(xp);
  const extras = [];
  if (e.boss && !curaOff()) { G.hp = Math.min(stats(G).hpMax, G.hp + Math.round(stats(G).hpMax * 0.3)); extras.push('💚 Você recupera 30% da vida.'); }
  if (e.boss && !C.tomou) { G.est.bossLimpo++; extras.push('✨ <b>Intocável!</b> Você não levou um arranhão.'); }
  if (e.boss && e.fases) {
    if (e.fase === 0) { G.est.bossRelampago++; extras.push('⚡ <b>Relâmpago!</b> Ele nem chegou à segunda fase.'); }
    if (e.fase >= e.fases.length) G.est.bossUltimaFase++;
  }
  if (G.hp <= stats(G).hpMax * 0.1) G.est.fio++;
  racaVitoria(e, extras);   // chefões derrotados (liberam raças) e a Fome Elegante do Vampiro
  if (chance(0.15 + st.s.sor * 0.01)) { G.cons.suco = (G.cons.suco || 0) + 1; extras.push('🧃 Você achou um Suco de Uva Duvidoso!'); }
  let item = null;
  if (e.boss) item = sorteiaItem(G, { bonus: 0.5, min: 2 });
  else if (e.elite) item = sorteiaItem(G, { bonus: 0.3, min: 1 });
  else if (chance(0.2 + st.s.sor * 0.01)) item = sorteiaItem(G, {});
  if (item) { G.fila.push(() => telaItem(item, avancar)); extras.push('🎁 O inimigo deixou um item!'); }
  log(`🏆 <b>${esc(e.nome)}</b> foi derrotado!`);
  hud();
  $('#acoes').innerHTML = `<div class="resultado"><h3>${e.boss ? '👑 CHEFÃO DERROTADO!' : '🏆 Vitória!'}</h3>
    <p>+${xp} ✨ XP · +${ouro} 💰 ouro${subiu ? ` · <b class="ouro">⬆️ Subiu para o nível ${G.nivel}!</b>` : ''}</p>
    ${extras.map(x => `<p>${x}</p>`).join('')}
    <button class="btn primario grande" data-k="cont">Continuar ➡️</button></div>`;
  const spr = $('#s-ini'); if (spr) spr.classList.add('morre');
}

async function derrota() {
  C.fim = true; Som.tocar('lose'); log('💀 <b>Você caiu...</b>'); atualizarCombate();
  const spr = $('#s-heroi'); if (spr) spr.classList.add('morre');
  const e = C.e;
  await sleep(1400);
  gameOver(`Derrotado por ${e.nome}`, { tipo: 'combate', inimigo: e.nome, hpIni: e.hp, turnos: C.turno, boss: e.boss, crit: C.ultimoCrit, fase: e.fases ? e.fase + 1 : 0, fases: e.fases ? e.fases.length + 1 : 0 });
}

