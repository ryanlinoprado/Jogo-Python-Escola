'use strict';
/* =========================================================================
   REGRAS — o personagem: stats() calcula vida, CA e crítico; novaRun() cria a aventura;
   ganhaXP() sobe de nível; sorteiaItem() decide o que cai.
   ========================================================================= */

/* ============ 3) REGRAS ============ */
let G = null;   // estado da aventura atual
let C = null;   // estado do combate atual
let ultimoId = null;
let modoNovo = 'normal';   // 'normal' ou 'diario' (desafio do dia)

const xpProx = n => 20 + n * 15;
const SLOTS = { arma: '⚔️ Arma', armadura: '🥋 Armadura', amuleto: '📿 Amuleto' };

/** Calcula todos os números derivados do personagem. */
function stats(p) {
  const s = { ...p.attr };
  const m = { def: 0, hp: 0, en: 0, atk: 0, crit: 0, esq: 0, ouro: 0, roubaVida: 0, acerto: 0, ca: 0, dano: 0 };
  const soma = mods => { if (!mods) return; for (const k in mods) { if (k in s) s[k] += mods[k]; else m[k] = (m[k] || 0) + mods[k]; } };
  for (const sl of ['arma', 'armadura', 'amuleto']) { const it = p.equip[sl]; if (it) { soma(it.mods); m.def += it.def || 0; } }
  for (const id of p.skills) { const h = HABILIDADES[id]; if (h.tipo === 'passiva') soma(h.mods); }
  soma(CLASSES[p.classe].passiva.mods);
  soma((RACAS[p.raca] || {}).mods);   // bônus da raça (Elfo, Anão, Vampiro...)
  for (const b of (p.bencaos || [])) soma(b.mods);   // bênçãos dos deuses
  for (const al of (p.aliados || [])) if (ALIADOS[al.id]) soma(ALIADOS[al.id].mods);   // bônus passivos dos companheiros
  for (const sn of sinergiasAtivas(p)) soma(sn.mods);  // sinergias (itens/habilidades que combinam)
  return {
    s,
    hpMax: Math.round((20 + s.vit * 6 + m.hp + (p.nivel - 1) * 5 + p.bonusHp) * ((p.mods || []).includes('vidro') ? 0.65 : 1)),
    enMax: 8 + s.int * 2 + m.en + p.nivel,
    atk: (p.equip.arma ? p.equip.arma.atk : 2) + m.atk + p.bonusAtk,
    crit: Math.min(75, 5 + s.des * 1.5 + s.sor * 0.7 + m.crit),
    esq: Math.min(40, s.des * 1.0 + m.esq),
    def: Math.floor(s.vit / 3) + m.def,
    /* --- Sistema d20 ---
       Acerto = d20 + (atributo/3) + (nível/2) + bônus  →  precisa igualar ou passar a CA do alvo.
       CA (Classe de Armadura) = 9 + Destreza/3 + Defesa/2 + Esquiva/5 + bônus.
       Crítico: d20 natural igual ou acima de "critMin" (20 normalmente; Destreza/Sorte baixam). */
    acertoBase: 2 + Math.floor(p.nivel / 2) + m.acerto,   // +2 de proficiência desde o início
    ca: 9 + Math.floor(s.des / 3) + Math.floor((Math.floor(s.vit / 3) + m.def) / 2) + Math.floor(Math.min(40, s.des + m.esq) / 5) + m.ca,
    critMin: Math.max(15, 20 - Math.floor(Math.max(0, Math.min(75, 5 + s.des * 1.5 + s.sor * 0.7 + m.crit) - 5) / 5)),
    ouro: m.ouro, roubaVida: m.roubaVida,
    danoMult: Math.max(0.5, 1 + m.dano),   // Bárbaro: -10% de dano em troca de muita resistência
    regen: m.regen ? m.regen + Math.floor(p.nivel / 3) : 0,   // vida recuperada no fim de cada turno de combate (Clérigo)
  };
}

const novoEst = () => ({ nat1: 0, nat20: 0, testeCrit: 0, bossLimpo: 0, fugas: 0, cons: 0, fio: 0, moeda: 0, bossRelampago: 0, bossUltimaFase: 0 });

function novaRun(nome, classeId, attr, opc = {}) {
  const cl = CLASSES[classeId];
  G = {
    modo: opc.modo || 'normal', dia: opc.dia || '', mods: opc.mods || [], est: novoEst(), conq: [], aliados: [],
    nome, classe: classeId, raca: RACAS[opc.raca] ? opc.raca : '', attr: racaAttr(attr, opc.raca), nivel: 1, xp: 0, ouro: 20, andar: 1, kills: 0, chefes: 0,
    equip: { arma: itemPorId(cl.arma), armadura: null, amuleto: null },
    skills: [cl.habilidade], skillNiv: {}, cons: { suco: 2 }, flags: {}, bonusHp: 0, bonusAtk: 0, inspirado: null,
    bencaos: [], fila: [], pendCartas: 0, pontosItens: 0, ouroTotal: 0, melhor: null, recentes: [], ultimaSala: null, loja: null, hp: 1, en: 1,
  };
  const st = stats(G); G.hp = st.hpMax; G.en = st.enMax;
  HistoricoRacas.marca(G.raca);   // lembra as raças já jogadas (conquistas de colecionador)
}

const limitaVida = () => { const st = stats(G); G.hp = Math.min(G.hp, st.hpMax); G.en = Math.min(G.en, st.enMax); };

function ganhaXP(n) {
  if (temEf('versatil')) n = Math.round(n * 1.1);   // raça Humano
  G.xp += n; let subiu = 0;
  while (G.xp >= xpProx(G.nivel)) {
    G.xp -= xpProx(G.nivel); G.nivel++; subiu++; G.pendCartas++;
    const st = stats(G); if (!curaOff()) G.hp = Math.min(st.hpMax, G.hp + Math.round(st.hpMax * 0.3)); G.en = Math.min(st.enMax, G.en + 3);
  }
  if (subiu) Som.tocar('level');
  return subiu;
}

/* ---- Itens ---- */
function sorteiaRaridade(p, { bonus = 0, min = 0 } = {}) {
  const luck = 1 + stats(p).s.sor * 0.06 + p.andar * 0.03 + bonus;
  const w = RARIDADES.map((r, i) => (i < min ? 0 : i === 0 ? r.peso : r.peso * Math.pow(luck, i)));
  let t = w.reduce((a, b) => a + b, 0), x = _r() * t;
  for (let i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return i; }
  return Math.max(min, 0);
}
function sorteiaItem(p, opts = {}) {
  let rar = sorteiaRaridade(p, opts), pool = [];
  while (rar >= 0) {
    pool = ITENS.filter(i => i.raridade === rar && (!i.classe || i.classe === p.classe) && (!i.custom || p.modo !== 'diario'));
    if (pool.length) break; rar--;
  }
  return { ...pick(pool) };
}
const corItem = it => RARIDADES[it.raridade].cor;
const nomeItem = it => `<span class="it r${it.raridade}" style="color:${corItem(it)}">${esc(it.nome)}</span>`;
const ROT = { for: 'Força', des: 'Destreza', int: 'Inteligência', vit: 'Vitalidade', sor: 'Sorte', hp: 'Vida máx.', en: 'Energia máx.', crit: '% Crítico', esq: '% Esquiva', acerto: 'Acerto', ca: 'CA (armadura)', ouro: '% Ouro', roubaVida: '% Roubo de vida' };
function linhasItem(it) {
  const l = [];
  if (it.atk) l.push(`⚔️ Ataque +${it.atk}`);
  if (it.def) l.push(`🛡️ Defesa +${it.def}`);
  for (const k in (it.mods || {})) {
    const v = (k === 'ouro' || k === 'roubaVida') ? Math.round(it.mods[k] * 100) : it.mods[k];
    l.push(`${ATRIBUTOS[k] ? ATRIBUTOS[k].icone : '✨'} ${ROT[k]} +${v}`);
  }
  return l;
}
const vendaItem = it => RARIDADES[it.raridade].venda;

