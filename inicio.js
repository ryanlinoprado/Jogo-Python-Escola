'use strict';
/* =========================================================================
   INÍCIO — liga os botões globais, as brasas do fundo e abre o menu.
   Este arquivo roda por último: tudo o que ele usa já foi definido pelos outros módulos.
   ========================================================================= */

/* ============ INICIALIZAÇÃO ============ */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-hud]'); if (!b) return;
  if (b.dataset.hud === 'ficha') abrirFicha();
  if (b.dataset.hud === 'som') { Som.mudo = !Som.mudo; store.set('mudo', Som.mudo ? '1' : '0'); mus('atualiza'); hud(); }
  if (b.dataset.hud === 'musica') { mus('alterna'); hud(); }
});
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') fechaModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') fechaModal(); });

(function brasas() {
  const el = $('#estrelas');
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('span');
    s.style.left = rnd(0, 100) + '%'; s.style.animationDuration = rnd(9, 20) + 's'; s.style.animationDelay = '-' + rnd(0, 20) + 's';
    s.style.width = s.style.height = rnd(2, 5) + 'px'; el.appendChild(s);
  }
})();

telaTitulo();
