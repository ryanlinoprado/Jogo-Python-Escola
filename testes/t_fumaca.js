'use strict';
/* TESTE DE FUMAÇA — um "robô" joga partidas inteiras clicando nos botões de verdade.
   Se alguma tela, evento ou combate quebrar no meio de uma aventura, o robô descobre. (Mais lento que os outros.) */
(() => {
  const { ok } = Testes;
  const rnd01 = Math.random;

  async function robo(classe, opc = {}, maxPassos = 5000) {
    const attr = { ...CLASSES[classe].base }; let p = 10; const ks = Object.keys(attr); while (p > 0) { attr[ks[Math.floor(rnd01() * ks.length)]]++; p--; }
    novaRun('Robô ' + classe, classe, attr, opc); escolherSala(); let passos = 0;
    for (; passos < maxPassos; passos++) {
      await Testes.espera(1);
      if (document.querySelector('.gameover')) return { fim: true, andar: ultimoAndar, passos };
      if (G) ultimoAndar = G.andar;
      const P = document.querySelector('#palco'), clica = el => { el.click(); return true; };
      const nos = [...P.querySelectorAll('.no-mapa:not([disabled])')]; if (nos.length) { clica(nos[Math.floor(rnd01() * nos.length)]); continue; }
      if (P.querySelector('.card.troca')) { clica(P.querySelector('.card.troca')); continue; }
      const ac = document.querySelector('#acoes');
      if (ac && ac.querySelector('button')) {
        const bs = [...ac.querySelectorAll('button:not([disabled])')], cont = bs.find(b => b.dataset.k === 'cont'); if (cont) { clica(cont); continue; }
        const hab = bs.filter(b => b.dataset.k === 'hab'), atk = bs.find(b => b.dataset.k === 'atk'), cons = bs.filter(b => b.dataset.k === 'cons');
        if (G && G.hp < stats(G).hpMax * 0.4 && cons.length) { clica(cons[0]); continue; }
        if (hab.length && rnd01() < 0.6) { clica(hab[Math.floor(rnd01() * hab.length)]); continue; }
        if (atk) { clica(atk); continue; }
        continue;
      }
      const esc_ = [...P.querySelectorAll('.escolha:not([disabled])')]; if (esc_.length) { clica(esc_[Math.floor(rnd01() * esc_.length)]); continue; }
      const car = [...P.querySelectorAll('.carta')]; if (car.length) { clica(car.find(c => c.querySelector('.sin-dica')) || car[0]); continue; }
      const bc = P.querySelector('#b-cont'); if (bc) { clica(bc); continue; }
      const eq = P.querySelector('#b-eq'); if (eq) { clica(eq); continue; }
      const btn = [...P.querySelectorAll('button:not([disabled])')].find(b => !/voltar/i.test(b.id)); if (btn) clica(btn);
    }
    return { fim: false, andar: ultimoAndar, passos };
  }
  let ultimoAndar = 1;

  /** Roda uma partida e falha se houver erro de JavaScript ou se o robô travar. */
  const partida = (classe, opc) => async () => {
    const erros = []; const aoErro = e => erros.push(e.message || String(e.reason && e.reason.message || e.reason));
    window.addEventListener('error', aoErro); window.addEventListener('unhandledrejection', aoErro);
    try { const r = await robo(classe, opc); ok(r.fim, `o robô travou no andar ${r.andar} depois de ${r.passos} passos`); }
    finally { window.removeEventListener('error', aoErro); window.removeEventListener('unhandledrejection', aoErro); }
    ok(erros.length === 0, 'erros de JavaScript durante a partida: ' + erros.slice(0, 3).join(' | '));
  };

  Testes.suite('Fumaça: partidas completas por robô', {
    'guerreiro joga uma aventura inteira': partida('guerreiro'),
    'ladino joga uma aventura inteira': partida('ladino'),
    'mago joga com modificadores (vidro + sem cura)': partida('mago', { mods: ['vidro', 'sem_cura'] }),
    'bárbaro joga uma aventura inteira sem travar': partida('barbaro'),
    'elfo mago, anão guerreiro e halfling ladino jogam sem travar': async () => { for (const [c, r] of [['mago', 'elfo'], ['guerreiro', 'anao'], ['ladino', 'halfling']]) await partida(c, { raca: r })(); },
    'draconato, morto-vivo, vampiro, orc e goblin jogam sem travar': async () => { for (const [c, r] of [['guerreiro', 'draconato'], ['clerigo', 'morto_vivo'], ['barbaro', 'vampiro'], ['ladino', 'orc'], ['mago', 'goblin']]) await partida(c, { raca: r })(); },
    'clérigo joga o Desafio do Dia': partida('clerigo', { modo: 'diario', dia: '2026-11-14', mods: ['pesadelo'] }),
  });
})();
