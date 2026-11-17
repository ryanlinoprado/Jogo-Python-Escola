'use strict';
/* TESTES DE QUALIDADE DO CÓDIGO — olham os próprios arquivos do jogo (e não o jogo funcionando).
   Pegam erros que só aparecem quando alguém cria um arquivo novo: nome repetido, arquivo gigante,
   script esquecido no index.html, arquivo não listado no LEIA-ME…  */

/** Lê o index.html, descobre os scripts do jogo e baixa o texto de cada um (guardado em cache). */
Testes.arquivosDoJogo = async () => {
  if (Testes._arq) return Testes._arq;
  const html = await (await window.fetchReal('index.html', { cache: 'no-store' })).text();
  const nomes = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]), textos = {};
  for (const n of nomes) textos[n] = await (await window.fetchReal(n, { cache: 'no-store' })).text();
  Testes._arq = { html, nomes, textos }; return Testes._arq;
};
Testes.fonteDoJogo = async () => { const { nomes, textos } = await Testes.arquivosDoJogo(); return nomes.map(n => textos[n]).join('\n'); };

(() => {
  const { ok, igual } = Testes;
  const MAX_LINHAS = 650;   // arquivo maior que isto = hora de dividir em módulos

  Testes.suite('Qualidade do código', {
    'index.html e testes.html carregam os mesmos scripts do jogo, na mesma ordem': async () => {
      const { nomes } = await Testes.arquivosDoJogo(); const t = await (await window.fetchReal('testes.html', { cache: 'no-store' })).text();
      const dosTestes = [...t.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(n => !n.startsWith('testes/')); igual(dosTestes, nomes);
    },
    'todo script do jogo existe, começa com "use strict" e tem um comentário explicando para que serve': async () => {
      const { nomes, textos } = await Testes.arquivosDoJogo(); ok(nomes.length >= 10, 'poucos scripts encontrados');
      for (const n of nomes) { const t = textos[n].replace(/^﻿/, ''); ok(/^'use strict';/.test(t), `${n}: falta 'use strict' na primeira linha`); ok(/\/\*[\s\S]{40,}?\*\//.test(t.slice(0, 2500)), `${n}: falta o comentário de cabeçalho`); }
    },
    'nenhum nome global é declarado em dois arquivos (ou duas vezes no mesmo)': async () => {
      const { nomes, textos } = await Testes.arquivosDoJogo(), donos = {};
      for (const n of nomes) for (const m of textos[n].matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*[=;]/gm)) { const nome = m[1] || m[2]; (donos[nome] = donos[nome] || []).push(n); }
      const repetidos = Object.entries(donos).filter(([, a]) => a.length > 1).map(([k, a]) => `${k} (${a.join(', ')})`); igual(repetidos, [], 'nomes repetidos entre arquivos');
    },
    [`nenhum arquivo do jogo passa de ${MAX_LINHAS} linhas (arquivo gigante = difícil de manter)`]: async () => {
      const { nomes, textos } = await Testes.arquivosDoJogo(), grandes = nomes.filter(n => textos[n].split('\n').length > MAX_LINHAS).map(n => `${n} (${textos[n].split('\n').length} linhas)`);
      igual(grandes, [], 'divida estes arquivos em módulos');
    },
    'sem console.log, debugger nem alert esquecidos': async () => {
      const { nomes, textos } = await Testes.arquivosDoJogo();
      for (const n of nomes) for (const proibido of [/\bconsole\.log\(/, /\bdebugger\b/, /\balert\(/]) ok(!proibido.test(textos[n]), `${n}: encontrei ${proibido}`);
    },
    'todo script do jogo está descrito na tabela de arquivos do LEIA-ME': async () => {
      const { nomes } = await Testes.arquivosDoJogo(), leia = await (await window.fetchReal('LEIA-ME.md', { cache: 'no-store' })).text();
      const faltando = nomes.filter(n => !leia.includes('`' + n + '`')); igual(faltando, [], 'arquivos sem linha no LEIA-ME');
    },
    'textos digitados por alunos (nome do herói, autor) nunca entram no HTML sem esc()': async () => {
      const f = await Testes.fonteDoJogo(); const suspeitos = [...f.matchAll(/\$\{(G\.nome|S\.nome|e\.autor|it\.autor|d\.autor|resumo\.nome)\}/g)].map(m => m[0]);   // textos digitados pelo aluno
      igual(suspeitos, [], 'use ${esc(...)} para textos digitados por alunos');
    },
  });
})();
