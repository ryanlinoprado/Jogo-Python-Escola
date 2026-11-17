'use strict';
/* =========================================================================
   NÚCLEO — o alicerce do motor: utilidades, armazenamento, som e ranking.
   O MOTOR DO JOGO é dividido em módulos. Eles são carregados nesta ordem (veja o index.html):
     nucleo.js      utilidades, sorteios (com semente), armazenamento, som e ranking
     regras.js      o personagem: atributos, stats(), XP e sorteio de itens
     telas.js       tela(), HUD, menu, escolha de classe e atributos, modificadores, conquistas
     mapa.js        salvamento, mapa ramificado e entrada nas salas
     combate.js     combate d20, habilidades, inimigos, fases dos chefões e companheiros
     salas.js       eventos (fx), loja e fogueira
     inventario.js  itens, cartas de nível e ficha do personagem
     fim.js         fim de jogo, lápide e ranking
     inicio.js      liga tudo e abre o menu (precisa ser o último do motor!)
   Todos compartilham o mesmo espaço global (sem import/export), então nenhum nome pode
   se repetir entre arquivos: o testes.html confere isso para você.
   ========================================================================= */

/* ============ 1) UTILIDADES ============ */
const $ = (s, r = document) => r.querySelector(s);
/* Todo sorteio do jogo passa por "_r". Normalmente _r = Math.random.
   No Desafio do Dia, a função mundo() troca _r por um gerador com semente
   enquanto sorteia salas, inimigos, eventos e loja — assim todos veem o mesmo. */
let _r = Math.random;
const rnd = (a, b) => Math.floor(_r() * (b - a + 1)) + a;
const chance = p => _r() < p;
const pick = arr => arr[Math.floor(_r() * arr.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(_r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/** Executa fn() com sorteios "travados" na semente do dia (só no Desafio do Dia). */
function mundo(tag, fn) {
  if (!G || G.modo !== 'diario') return fn();
  const antes = _r; _r = geradorComSemente(`${G.dia}|${G.andar}|${tag}`);
  try { return fn(); } finally { _r = antes; }
}
const temMod = id => !!G && (G.mods || []).includes(id);
const curaOff = () => temMod('sem_cura');

/** Fala com a trilha sonora (musica.js), que carrega depois deste arquivo. */
const mus = (fn, ...args) => { if (typeof Musica !== 'undefined') Musica[fn](...args); };

/** Aviso rápido no topo da tela (conquistas, bloqueios). */
function toast(html, cls = '') {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + cls; t.innerHTML = html; box.appendChild(t);
  setTimeout(() => t.classList.add('sai'), 3800); setTimeout(() => t.remove(), 4400);
}

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ok */ } },
};

/* ---- Som (gerado pelo navegador, sem arquivos) ---- */
const Som = {
  ctx: null, mudo: store.get('mudo') === '1',
  seqs: {
    hit: [[220, .08]], crit: [[440, .06], [660, .1]], hurt: [[140, .15, 'sawtooth']], miss: [[600, .05]],
    win: [[523, .1], [659, .1], [784, .22]], lose: [[300, .2], [220, .2], [150, .45]],
    item: [[880, .08], [1175, .14]], click: [[500, .04]], level: [[392, .08], [523, .08], [659, .08], [784, .22]],
    fase: [[196, .18, 'sawtooth'], [147, .2, 'sawtooth'], [110, .4, 'sawtooth']],
    inicio: [[330, .08], [262, .14]], raro: [[523, .08], [784, .08], [1047, .08], [1319, .25]],
  },
  tocar(k) {
    if (this.mudo) return;
    try {
      const c = this.ctx || (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
      let t = c.currentTime;
      for (const [f, d, ty] of this.seqs[k] || []) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = ty || 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d); t += d * 0.9;
      }
    } catch (e) { /* sem áudio */ }
  },
};

/* ============ 2) RANKING ============
   Se o jogo estiver rodando pelo servidor Python (servidor.py), o ranking é
   compartilhado por toda a turma. Se abrir o index.html direto, usa o ranking
   salvo neste navegador (localStorage).  */
const Rank = {
  servidor: false,
  /* Ordem: maior pontuação (que já premia andar e modificadores), depois andar mais alto, depois quem chegou primeiro. */
  ordena(l) { return [...l].sort((a, b) => b.score - a.score || b.andar - a.andar || String(a.data).localeCompare(String(b.data))); },
  local() { try { return JSON.parse(store.get('masmorra_rank') || '[]'); } catch (e) { return []; } },
  async listar() {
    try {
      const r = await fetch('/api/rank', { cache: 'no-store' });
      if (!r.ok) throw new Error('sem servidor');
      const lista = await r.json();
      this.servidor = true;
      return this.ordena(lista);
    } catch (e) { this.servidor = false; return this.ordena(this.local()); }
  },
  async salvar(entrada) {
    const l = this.local(); l.push(entrada); store.set('masmorra_rank', JSON.stringify(this.ordena(l).slice(0, 100)));
    try {
      await fetch('/api/rank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entrada) });
    } catch (e) { /* fica só no local */ }
    return this.listar();
  },
};

