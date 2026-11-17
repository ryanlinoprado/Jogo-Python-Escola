'use strict';
/* =========================================================================
   SALAS — eventos aleatórios (criaFx, telaEvento, resolveEvento), fogueira, tesouro e loja.
   Os textos e escolhas dos eventos ficam em eventos.js, deuses.js, eventos2.js e aliados.js.
   ========================================================================= */

/* ============ 6) EVENTOS, LOJA, FOGUEIRA ============ */
const SALA_FOGUEIRA = {
  titulo: 'Fogueira Aconchegante', icone: '🏕️',
  texto: 'Uma fogueira crepita no meio da sala. Alguém deixou marshmallows e um violão desafinado. Hora de uma pausa.',
  escolhas: [
    { texto: '😴 Descansar', dica: 'Cura 45% da vida e restaura energia', acao: fx => {
      fx.fogueira = true; curaFogueira(fx); fx.fogueira = false; fx.energia(10);
      if (G.aliados.length) { curaAliados(); fx.linha('🐾 Seus companheiros também descansam e se recuperam.', 'bom'); }
      if (chance(0.3)) { fx.proximo = () => telaEvento(sonhoNythria()); return 'Você pega no sono perto do fogo… e algo estranho começa a acontecer em seu sonho.'; }
      return 'Você dorme como uma pedra. Sonhou que era uma pizza.';
    } },
    { texto: '🏋️ Treinar', dica: 'Ganha experiência', acao: fx => { fx.xp(12 + G.andar * 4); return 'Você treina até suar. O suor cai na fogueira e ela reclama.'; } },
    { texto: '🔧 Afiar a arma', dica: '+1 de ataque permanente', acao: fx => { G.bonusAtk++; fx.linha('+1 ⚔️ ataque permanente', 'bom'); return 'Você afia a arma com uma pedra. Ela fica melhor. Você fica com sono.'; } },
  ],
};
const SALA_TESOURO = {
  titulo: 'Sala do Tesouro', icone: '💎',
  texto: 'No centro da sala há um baú dourado brilhando, cercado por um cheiro suspeito de “promoção imperdível”. Dessa vez parece seguro.',
  escolhas: [{ texto: '✨ Abrir o baú dourado', acao: fx => { fx.item({ bonus: 0.6, min: 1 }); fx.ouro(rnd(15, 30) + G.andar * 2); return 'O baú se abre com música de fanfarra. Alguém, em algum lugar, bateu palmas.'; } }],
};

function escolheEvento() { return mundo('evento', escolheEventoBase); }
function escolheEventoBase() {
  const valido = e => (!e.cond || e.cond(G)) && !(e.unico && G.flags['v_' + e.id]);   // 'unico' = só acontece uma vez
  let pool = EVENTOS.filter(e => valido(e) && !G.recentes.includes(e.id));
  if (!pool.length) pool = EVENTOS.filter(valido);
  const total = pool.reduce((s, e) => s + e.peso, 0); let x = _r() * total, ev = pool[0];
  for (const e of pool) { x -= e.peso; if (x <= 0) { ev = e; break; } }
  if (ev.unico) G.flags['v_' + ev.id] = true;
  G.recentes.push(ev.id); if (G.recentes.length > 5) G.recentes.shift();
  return ev;
}

function criaFx() {
  const fx = { linhas: [], proximo: null, causa: '' };
  fx.linha = (t, c = '') => fx.linhas.push({ t, c });
  fx.ouro = n => {
    n = Math.round(n); if (n > 0 && fx.dobra) n *= 2; if (n < 0) n = -Math.min(G.ouro, -n);
    G.ouro += n; if (n > 0) G.ouroTotal += n; fx.linha(`${n > 0 ? '+' : ''}${n} 💰 ouro`, n >= 0 ? 'bom' : 'ruim');
  };
  fx.dano = (n, causa) => { n = Math.round(n * (fx.desastre ? 1.5 : 1)); G.hp = Math.max(0, G.hp - n); if (causa) fx.causa = causa; fx.linha(`-${n} ❤️ vida`, 'ruim'); Som.tocar('hurt'); };
  fx.cura = n => {
    if (curaOff() && !fx.fogueira) { fx.linha('🚫 Sem cura fora da fogueira (regra maluca)', 'ruim'); return; }
    if (fx.dobra) n *= 2; const a = G.hp; G.hp = Math.min(stats(G).hpMax, G.hp + Math.round(n)); fx.linha(`+${G.hp - a} ❤️ vida`, 'bom'); };
  fx.curaPct = p => fx.cura(stats(G).hpMax * p);
  fx.energia = n => { if (n > 0 && fx.dobra) n *= 2; const a = G.en; G.en = Math.min(stats(G).enMax, G.en + n); fx.linha(`+${G.en - a} ⚡ energia`, 'bom'); };
  fx.attr = (a, n) => {
    if (n > 0 && fx.dobra) n *= 2;
    G.attr[a] = Math.max(1, G.attr[a] + n); limitaVida();
    fx.linha(`${n > 0 ? '+' : ''}${n} ${ATRIBUTOS[a].icone} ${ATRIBUTOS[a].nome}`, n > 0 ? 'bom' : 'ruim');
  };
  fx.attrAleatorio = n => fx.attr(pick(Object.keys(ATRIBUTOS)), n);
  fx.hpMax = n => { if (n > 0 && fx.dobra) n *= 2; G.bonusHp += n; limitaVida(); fx.linha(`${n > 0 ? '+' : ''}${n} ❤️ vida máxima`, n > 0 ? 'bom' : 'ruim'); };
  fx.xp = n => { if (fx.dobra) n *= 2; ganhaXP(n); fx.linha(`+${n} ✨ XP`, 'bom'); };
  fx.item = o => {
    o = { ...(o || {}) };
    if (fx.dobra) { o.min = Math.min(4, (o.min || 0) + 1); o.bonus = (o.bonus || 0) + 0.5; }   // crítico: item de raridade maior
    const it = sorteiaItem(G, o); G.fila.push(() => telaItem(it, avancar)); fx.linha('🎁 Você ganhou um item!', 'raro'); };
  fx.consumivel = (id, n = 1) => { if (fx.dobra) n *= 2; G.cons[id] = (G.cons[id] || 0) + n; fx.linha(`+${n} ${CONSUMIVEIS[id].icone} ${CONSUMIVEIS[id].nome}`, 'bom'); };
  fx.flag = (k, v = true) => { G.flags[k] = v; };
  fx.karma = n => { G.flags.karma = (G.flags.karma || 0) + n; };   // invisível: Serathis julga!
  fx.cartaExtra = () => { G.pendCartas++; fx.linha('📜 Uma escolha extra de habilidade!', 'raro'); };
  fx.bencao = (id, mods, desc) => {
    const d = DEUSES[id] || { nome: id, icone: '✨' };
    if (G.bencaos.some(b => b.id === id)) { fx.linha(`${d.icone} ${d.nome} já te abençoou antes.`); return false; }
    G.bencaos.push({ id, mods, desc }); limitaVida(); Som.tocar('raro');
    fx.linha(`${d.icone} Bênção de ${d.nome}: ${desc}`, 'raro'); return true;
  };
  /* Um companheiro entra no grupo. Se o grupo estiver cheio, o jogador escolhe quem sai (tela de troca). */
  fx.aliado = id => {
    const d = ALIADOS[id]; if (!d || temAliado(G, id)) return false;
    if (G.aliados.length < MAX_ALIADOS) { G.aliados.push(novoAliado(id)); Som.tocar('raro'); fx.linha(`${d.icone} ${d.nome} se juntou a você!`, 'raro'); racaLinhaAliado(fx, id); return true; }
    fx.linha(`${d.icone} ${d.nome} quer se juntar a você, mas o grupo está cheio…`, 'raro');
    G.fila.push(() => telaTrocaAliado(id)); return false;
  };
  fx.inspirar = (pct, n) => { G.inspirado = { pct, combates: n }; fx.linha(`🎵 +${Math.round(pct * 100)}% de dano nos próximos ${n} combates`, 'bom'); };
  fx.combate = (def, o = {}) => { fx.proximo = () => iniciarCombate(def, o); };
  /* Teste de atributo estilo RPG de mesa: d20 + atributo contra uma dificuldade.
     20 natural = SUCESSO CRÍTICO (recompensas dobradas). 1 natural = FALHA CRÍTICA (dano +50%). */
  fx.teste = (a, dif) => {
    let r = rnd(1, 20); const v = stats(G).s[a];
    if (temEf('dedos_sorte') && G.flags.refezNoAndar !== G.andar && r !== 20 && (r === 1 || r + v < dif)) {   // Halfling: refaz um teste por andar
      G.flags.refezNoAndar = G.andar; fx.linha(`🍀 <b>Dedos de Sorte!</b> O d20 deu ${r} e falharia, mas você rola de novo.`, 'raro'); r = rnd(1, 20);
    }
    const crit = r === 20, desastre = r === 1;
    if (crit) G.est.testeCrit++;
    const ok = crit || (!desastre && r + v >= dif);
    fx.dobra = crit; fx.desastre = desastre;
    fx.linha(`🎲 Teste de ${ATRIBUTOS[a].nome}: d20 (${r}) + ${v} = ${r + v} contra ${dif} — ${crit ? '🌟 SUCESSO CRÍTICO! Recompensas dobradas!' : desastre ? '💥 FALHA CRÍTICA! Dano aumentado.' : ok ? 'SUCESSO' : 'FALHA'}`, crit ? 'raro' : ok ? 'bom' : 'ruim');
    return ok;
  };
  return fx;
}

function telaEvento(ev0) {
  const ev = ev0.montar ? ev0.montar(G) : ev0;
  hud();
  tela(`<div class="evento"><div class="grande-ico">${ev.icone}</div><h2>${ev.titulo}</h2>
    <div class="texto-evento">${ev.texto}</div>
    <div class="escolhas">${ev.escolhas.map((c, i) => {
      const bloq = c.req && !c.req(G);
      return `<button class="btn escolha" data-i="${i}" ${bloq ? 'disabled' : ''}>${c.texto}${c.dica ? `<small>${c.dica}</small>` : ''}${bloq ? `<small class="ruim">${c.reqTxt || 'indisponível'}</small>` : ''}</button>`;
    }).join('')}</div></div>`);
  document.querySelectorAll('.escolha').forEach(b => b.onclick = () => { Som.tocar('click'); resolveEvento(ev, +b.dataset.i); });
}

function resolveEvento(ev, i) {
  const fx = criaFx();
  const texto = ev.escolhas[i].acao(fx);
  hud();
  const morreu = G.hp <= 0;
  tela(`<div class="evento"><div class="grande-ico">${ev.icone}</div><h2>${ev.titulo}</h2>
    <div class="texto-evento resultado-txt">${texto}</div>
    <div class="efeitos">${fx.linhas.map(l => `<div class="efeito ${l.c}">${l.t}</div>`).join('')}</div>
    ${morreu ? '<p class="ruim centro"><b>Você não resistiu…</b></p>' : ''}
    <button class="btn primario grande" id="b-cont">${morreu ? '💀 Continuar' : fx.proximo ? '⚔️ Preparar-se!' : 'Continuar ➡️'}</button></div>`);
  $('#b-cont').onclick = () => {
    Som.tocar('click');
    if (G.hp <= 0) return gameOver(fx.causa || ev.titulo, { tipo: 'evento', titulo: ev.titulo });
    if (fx.proximo) return fx.proximo();
    avancar();
  };
}

/* ---- Loja do Zé do Pastel ---- */
function telaLoja() {
  if (!G.loja) {
    G.loja = mundo('loja', () => ({ estoque: Array.from({ length: 3 }, () => { const it = sorteiaItem(G, { bonus: 0.3 }); return { item: it, preco: Math.round(RARIDADES[it.raridade].preco * (0.8 + _r() * 0.4)), vendido: false }; }) }));
  }
  hud();
  tela(`<div class="evento"><div class="grande-ico">🥟</div><h2>Loja do Zé do Pastel</h2>
    <div class="texto-evento">${pick(['“Pastel quentinho! Espada fria! Tudo pelo melhor preço!”', '“Tenho de tudo, menos troco.”', '“Aceito ouro, prata e reclamação construtiva.”'])}</div>
    <h3>Suprimentos</h3><div class="loja">${Object.entries(CONSUMIVEIS).map(([id, c]) => `
      <button class="btn compra" data-t="cons" data-id="${id}" ${G.ouro < precoLoja(c.preco) ? 'disabled' : ''}>${c.icone} ${c.nome}<small>${c.desc}</small><b class="ouro">💰 ${precoLoja(c.preco)}</b></button>`).join('')}</div>
    <h3>Equipamentos</h3><div class="loja">${G.loja.estoque.map((e, i) => `
      <button class="btn compra item-compra" data-t="item" data-i="${i}" style="border-color:${corItem(e.item)}" ${e.vendido || G.ouro < precoLoja(e.preco) ? 'disabled' : ''}>
        ${e.vendido ? '<b>VENDIDO</b>' : `${nomeItem(e.item)}<small>${SLOTS[e.item.slot]} · ${RARIDADES[e.item.raridade].nome}</small><small>${linhasItem(e.item).join(' · ')}</small>${tagsItem(e.item).length ? `<small>${tagsItem(e.item).map(t => TAGS[t].icone + ' ' + TAGS[t].nome).join(' · ')}</small>` : ''}${sinPorItem(e.item).length ? `<small class="ouro">🔗 Completa: ${sinPorItem(e.item).map(s => s.nome).join(', ')}</small>` : ''}<b class="ouro">💰 ${precoLoja(e.preco)}</b>`}</button>`).join('')}</div>
    <button class="btn primario grande" id="b-sair">Sair da loja ➡️</button></div>`);
  document.querySelectorAll('.compra').forEach(b => b.onclick = () => {
    if (b.dataset.t === 'cons') {
      const c = CONSUMIVEIS[b.dataset.id]; if (G.ouro < precoLoja(c.preco)) return;
      G.ouro -= precoLoja(c.preco); G.cons[b.dataset.id] = (G.cons[b.dataset.id] || 0) + 1; Som.tocar('item'); telaLoja();
    } else {
      const e = G.loja.estoque[+b.dataset.i]; if (e.vendido || G.ouro < precoLoja(e.preco)) return;
      G.ouro -= precoLoja(e.preco); e.vendido = true; Som.tocar('item'); telaItem(e.item, () => telaLoja());
    }
  });
  $('#b-sair').onclick = () => { G.loja = null; avancar(); };
}

