'use strict';
/* =========================================================================
   FERRAMENTAS DE TESTE — um mini-framework (sem bibliotecas, sem instalar nada).
   Como usar: abra  testes.html  no navegador (com o servidor rodando:
   http://localhost:8080/testes.html). Os testes rodam sozinhos e mostram ✅/❌.

   Cada arquivo t_*.js registra "suítes" (grupos de testes):
       Testes.suite('Nome do grupo', {
         'o que este teste confere': () => { Testes.igual(1 + 1, 2); },
       });
   Funções para conferir:  ok(cond, msg)  igual(a, b)  perto(a, b, tol)  lanca(fn)
   Dados viciados:  comDados([0, 0.99], () => ...)  (0 = rola 1, 0.99 = rola 20)
   ========================================================================= */
const Testes = (() => {
  const suites = [];
  const falha = msg => { throw new Error(msg); };
  const ok = (cond, msg = 'esperava verdadeiro') => { if (!cond) falha(msg); };
  const igual = (a, b, msg = '') => { const A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) falha(`${msg ? msg + ': ' : ''}esperado ${B}, veio ${A}`); };
  const perto = (a, b, tol, msg = '') => { if (!(Math.abs(a - b) <= tol)) falha(`${msg ? msg + ': ' : ''}esperado ${b} ±${tol}, veio ${a}`); };
  const lanca = (fn, msg = 'esperava um erro') => { try { fn(); } catch (e) { return e; } falha(msg); };
  const suite = (nome, testes) => suites.push({ nome, testes });

  /** Dados viciados: cada sorteio do jogo devolve o próximo valor da lista (0 => rola 1; 0.99 => rola 20). */
  const comDados = (valores, fn) => {
    const antes = _r; let i = 0; _r = () => valores[Math.min(i++, valores.length - 1)];
    try { return fn(); } finally { _r = antes; }
  };

  /* ---------- Ambiente isolado: os testes nunca tocam no ranking, no save nem no servidor de verdade ---------- */
  let guardado = null;
  const setTimeoutReal = window.setTimeout.bind(window);
  /** Espera de verdade (as esperas do jogo ficam quase instantâneas durante os testes). */
  const espera = ms => new Promise(r => setTimeoutReal(r, ms));
  const abreAmbiente = () => {
    guardado = { ls: {}, fetch: window.fetch, mudo: Som.mudo, confirm: window.confirm, setTimeout: window.setTimeout };
    window.setTimeout = (f, ms, ...a) => setTimeoutReal(f, Math.min(ms || 0, 1), ...a);   // sleep(550) do combate vira ~1ms
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); guardado.ls[k] = localStorage.getItem(k); } localStorage.clear(); } catch (e) { /* sem armazenamento */ }
    const real = guardado.fetch.bind(window); window.fetchReal = real;
    window.fetch = (url, o) => (String(url).startsWith('/api/') ? Promise.reject(new Error('sem servidor (teste)')) : real(url, o));   // "API" indisponível
    Som.mudo = true; window.confirm = () => true;
  };
  const fechaAmbiente = () => {
    window.fetch = guardado.fetch; Som.mudo = guardado.mudo; window.confirm = guardado.confirm; window.setTimeout = guardado.setTimeout;
    try { localStorage.clear(); for (const [k, v] of Object.entries(guardado.ls)) localStorage.setItem(k, v); } catch (e) { /* ok */ }
    G = null; C = null; _r = Math.random; Oficina.carrega(); Oficina.aplica(); telaTitulo();
  };
  const limpa = () => {
    try { localStorage.clear(); } catch (e) { /* ok */ }   // cada teste começa com ranking, save e conquistas vazios
    G = null; C = null; _r = Math.random; Som.mudo = true; window.fetch = (url, o) => (String(url).startsWith('/api/') ? Promise.reject(new Error('sem servidor (teste)')) : window.fetchReal(url, o));
    document.querySelectorAll('.toast, #modal:not([hidden])').forEach(e => { if (e.id !== 'modal') e.remove(); });
    if (typeof Prof !== 'undefined') clearInterval(Prof.timer);
    try { Oficina.d = { inimigos: [], itens: [] }; Oficina.turma = { inimigos: [], itens: [] }; Oficina.aplica(); } catch (e) { /* ok */ }
  };

  /** Roda tudo. onTeste(suite, nome, erro|null) é chamado a cada teste. */
  async function roda(filtro, onTeste) {
    const res = { passou: 0, falhou: 0, falhas: [] };
    abreAmbiente();
    try {
      for (const s of suites) {
        if (filtro && !s.nome.toLowerCase().includes(filtro.toLowerCase())) continue;
        for (const [nome, fn] of Object.entries(s.testes)) {
          limpa(); let erro = null;
          try { await fn(); } catch (e) { erro = e; }
          limpa();
          if (erro) { res.falhou++; res.falhas.push({ suite: s.nome, teste: nome, erro: erro.message }); } else res.passou++;
          if (onTeste) onTeste(s.nome, nome, erro);
          await new Promise(r => setTimeout(r, 0));   // deixa o navegador respirar
        }
      }
    } finally { fechaAmbiente(); }
    return res;
  }
  return { suites, suite, ok, igual, perto, lanca, comDados, roda, falha, espera };
})();
