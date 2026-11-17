'use strict';
/* Mostra os resultados dos testes na tela e roda tudo automaticamente ao abrir a página.
   Endereços úteis:  testes.html            -> roda tudo
                     testes.html?rapido     -> pula as partidas do robô (mais rápido)
                     testes.html?filtro=mapa -> só as suítes cujo nome tem "mapa"  */
(() => {
  const params = new URLSearchParams(location.search);
  if (params.has('rapido')) { for (let i = Testes.suites.length - 1; i >= 0; i--) if (Testes.suites[i].nome.startsWith('Fumaça')) Testes.suites.splice(i, 1); }
  const esc2 = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const el = document.getElementById('resultado');
  el.innerHTML = '<h1>🧪 Testes — A Masmorra do Pythonildo</h1><p id="t-resumo">Rodando…</p><div id="t-botoes"><button id="t-de-novo">🔄 Rodar de novo</button> <button id="t-falhas">Mostrar só falhas</button> <small>(<a href="?rapido">rápido</a> · <a href="testes.html">tudo</a>)</small></div><div id="t-lista"></div>';
  const lista = document.getElementById('t-lista'), resumo = document.getElementById('t-resumo');

  async function executar() {
    lista.innerHTML = ''; resumo.textContent = 'Rodando…'; resumo.className = ''; const blocos = {}; const t0 = performance.now(); let n = 0;
    const total = Testes.suites.reduce((s, x) => s + Object.keys(x.testes).length, 0);
    const res = await Testes.roda(params.get('filtro'), (suite, nome, erro) => {
      n++; resumo.textContent = `Rodando… ${n}/${total}`;
      if (!blocos[suite]) { const d = document.createElement('details'); d.open = true; d.innerHTML = `<summary><b>${esc2(suite)}</b> <span class="cont"></span></summary>`; lista.appendChild(d); blocos[suite] = { d, ok: 0, mal: 0 }; }
      const b = blocos[suite]; erro ? b.mal++ : b.ok++;
      const li = document.createElement('div'); li.className = erro ? 'mal' : 'bem'; li.innerHTML = (erro ? '❌ ' : '✅ ') + esc2(nome) + (erro ? `<pre>${esc2(erro.message)}</pre>` : ''); b.d.appendChild(li);
      b.d.querySelector('.cont').textContent = `(${b.ok} ✅${b.mal ? ' · ' + b.mal + ' ❌' : ''})`;
    });
    const seg = ((performance.now() - t0) / 1000).toFixed(1);
    resumo.className = res.falhou ? 'mal' : 'bem'; resumo.textContent = res.falhou ? `❌ ${res.falhou} teste(s) falharam, ${res.passou} passaram (${seg}s)` : `✅ Todos os ${res.passou} testes passaram (${seg}s)`;
    document.title = (res.falhou ? '❌ ' : '✅ ') + 'Testes'; window.__testes = { ...res, segundos: +seg, terminou: true };
  }
  document.getElementById('t-de-novo').onclick = () => { window.__testes = null; executar(); };
  document.getElementById('t-falhas').onclick = () => { lista.classList.toggle('so-falhas'); };
  window.__testes = null;
  executar();
})();
