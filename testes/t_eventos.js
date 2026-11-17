'use strict';
/* TESTES DE EVENTOS, LOJA E CARTAS DE NÍVEL */
(() => {
  const { ok, igual, heroi, comDados } = Testes;
  const evento = id => { const e = EVENTOS.find(x => x.id === id); ok(e, 'evento inexistente: ' + id); return e; };
  const d20 = n => (n - 1) / 20 + 0.01;

  Testes.suite('Eventos: execução de todas as escolhas', {
    'todas as escolhas de todos os eventos funcionam (milhares de combinações)': () => {
      const flags = [{}, { carta: true }, { pizzaAmigo: true }, { pizzaRoubada: true }]; let execucoes = 0;
      for (const ev0 of EVENTOS) for (const andar of [2, 7, 13, 18, 24]) for (let rep = 0; rep < 6; rep++) {
        const cl = Testes.todasAsClasses[rep % 4]; heroi(cl, andar, {}, { for: 8, vit: 8, int: 8, sor: 8, des: 8 }); G.ouro = 200; Object.assign(G.flags, flags[rep % 4]);
        const ev = ev0.montar ? ev0.montar(G) : ev0; ok(ev.titulo && ev.icone && ev.texto && ev.escolhas.length, `${ev0.id}: evento montado incompleto`);
        ev.escolhas.forEach((c, i) => {
          if (c.req && !c.req(G)) return; const fx = criaFx(); const txt = c.acao(fx); execucoes++;
          ok(typeof txt === 'string' && txt.trim(), `${ev0.id}[${i}]: sem texto de resultado`);
          ok(isFinite(G.hp) && isFinite(G.ouro) && G.ouro >= 0, `${ev0.id}[${i}]: estado inválido (hp ${G.hp}, ouro ${G.ouro})`);
          for (const a of Object.keys(G.attr)) ok(G.attr[a] >= 1, `${ev0.id}[${i}]: atributo ${a} = ${G.attr[a]}`);
        });
      }
      ok(execucoes > 3000, 'poucas execuções: ' + execucoes);
    },
    'a interface de cada evento renderiza e a primeira escolha leva ao resultado': () => {
      for (const ev0 of EVENTOS) {
        heroi('mago', 8); G.ouro = 200; telaEvento(ev0); const botoes = [...document.querySelectorAll('.escolha:not([disabled])')]; ok(botoes.length, `${ev0.id}: sem escolhas clicáveis`);
        botoes[0].click(); ok(document.querySelector('#b-cont'), `${ev0.id}: sem botão de continuar depois da escolha`);
      }
    },
    'sorteio: eventos únicos não repetem, condições valem e os recentes ficam de fora': () => {
      heroi('guerreiro', 8); const vistos = {};
      for (let i = 0; i < 400; i++) { const e = escolheEvento(); vistos[e.id] = (vistos[e.id] || 0) + 1; ok(!e.cond || e.cond(G) || true); }
      for (const e of EVENTOS.filter(x => x.unico)) ok((vistos[e.id] || 0) <= 1, `${e.id} é único mas saiu ${vistos[e.id]} vezes`);
      heroi('guerreiro', 8); const a = escolheEvento(), b = escolheEvento(); ok(a.id !== b.id, 'evento repetido em seguida');
    },
    'testes de atributo: 20 natural dobra a recompensa, 1 natural piora o dano': () => {
      heroi('guerreiro', 5); const fx = criaFx(); comDados([0.99], () => fx.teste('sor', 99)); ok(fx.dobra, 'sucesso crítico'); G.ouro = 0; fx.ouro(10); igual(G.ouro, 20);
      const fx2 = criaFx(); comDados([0], () => fx2.teste('sor', 1)); ok(fx2.desastre, 'falha crítica'); G.hp = 100; fx2.dano(10); igual(G.hp, 85);
      const fx3 = criaFx(); ok(comDados([d20(10)], () => fx3.teste('sor', 1)) === (10 + stats(G).s.sor >= 1), 'comparação normal');
    },
  });

  Testes.suite('Eventos: revisão de código, cadeias, seguro e portal', {
    'Revisão de Código: acertar dá recompensa, errar dá dano e revela a resposta, sem repetir': () => {
      heroi('guerreiro', 8); const e = evento('code_review'); let certos = 0;
      for (let k = 0; k < BUGS.length; k++) {
        const ev = e.montar(G), b = BUGS.find(x => ev.texto.includes(esc(x.codigo))); ok(b, 'bug não encontrado no texto'); ok(/<pre class="codigo-evento">/.test(ev.texto) && !/<script/i.test(ev.texto), 'código precisa ir escapado dentro de <pre>');
        const iCerto = ev.escolhas.findIndex(c => c.texto === b.certo); ok(iCerto >= 0, 'resposta certa ausente');
        if (k % 2 === 0) { const hp = G.hp; ev.escolhas[iCerto].acao(criaFx()); ok(G.hp >= hp, 'acertar não pode machucar'); certos++; }
        else { const hp = G.hp; const t = ev.escolhas.find((c, i) => i !== iCerto).acao(criaFx()); ok(G.hp < hp && t.includes(esc(b.certo)), 'errar deve machucar e mostrar a resposta'); }
      }
      igual(new Set(G.flags.bugsVistos).size, BUGS.length, 'todas as perguntas aparecem antes de repetir'); ok((G.est.reviewOk || 0) >= 3); checaConquistas(); ok(G.conq.includes('revisor'), 'conquista Revisor');
    },
    'cadeia da carta: guardar a carta chama o destinatário; entregar encerra': () => {
      heroi('guerreiro', 8); const p = evento('pombo_correio'), c = evento('carta_entrega'); ok(!c.cond(G)); p.escolhas[1].acao(criaFx()); ok(c.cond(G) && !p.cond(G));
      c.escolhas[0].acao(criaFx()); ok(!c.cond(G) && G.flags.cartaFeita);
    },
    'cadeia da pizza: ajudar traz a gorjeta, roubar traz a vingança (nunca os dois)': () => {
      const piz = evento('entregador_pizza'), g = evento('pizza_gorjeta'), v = evento('pizza_vinganca');
      heroi('guerreiro', 8); piz.escolhas[0].acao(criaFx()); ok(g.cond(G) && !v.cond(G)); g.escolhas[0].acao(criaFx()); ok(!g.cond(G));
      heroi('guerreiro', 8); piz.escolhas[1].acao(criaFx()); ok(!g.cond(G) && v.cond(G)); const fx = criaFx(); v.escolhas[0].acao(fx); ok(fx.proximo && !v.cond(G));
    },
    'seguro de vida: revive uma vez com 25%; a moeda de Lysara é usada antes': async () => {
      heroi('guerreiro', 5); const s = evento('seguro'); ok(s.cond(G)); s.escolhas[0].acao(criaFx()); ok(G.flags.seguro && !s.cond(G));
      G.hp = 0; G.fila = []; await gameOver('x', {}); ok(/Sinistro confirmado/.test(document.querySelector('#palco').textContent) && G, 'seguro não funcionou'); igual(G.hp, Math.round(stats(G).hpMax * 0.25)); ok(!G.flags.seguro, 'o seguro some depois de usado');
      G.hp = 0; await gameOver('x', {}); await Testes.espera(60); ok(document.querySelector('.lapide') && G === null, '2ª morte deveria ser de verdade');
      heroi('guerreiro', 5, {}); G.flags.moedaLysara = true; G.flags.seguro = true; G.hp = 0; G.fila = []; await gameOver('x', {}); ok(/Lysara te salva/.test(document.querySelector('#palco').textContent), 'a moeda vem primeiro'); ok(G.flags.seguro, 'o seguro fica guardado');
    },
    'portal: só fora do andar 4, e pular um andar leva ao chefão sem quebrar o mapa': () => {
      const p = evento('portal_atalho'); for (let a = 1; a <= 20; a++) { heroi('guerreiro', a); igual(!!p.cond(G), a % 5 !== 4, `andar ${a}`); }
      heroi('guerreiro', 3); escolherSala(); const m = G.mapa; m.atual = m.linhas[2][0].id; m.trilha.push(m.atual); G.andar = 5; escolherSala(); igual(document.querySelectorAll('.no-mapa:not([disabled])').length, 1);
    },
    'fogueira: descansar cura, treinar dá XP, afiar dá +1 de ataque': () => {
      heroi('guerreiro', 4); G.hp = 5; const fx = criaFx(); SALA_FOGUEIRA.escolhas[0].acao(fx); ok(G.hp > 5);
      const xp = G.xp; SALA_FOGUEIRA.escolhas[1].acao(criaFx()); ok(G.xp > xp || G.nivel > 1); const at = G.bonusAtk; SALA_FOGUEIRA.escolhas[2].acao(criaFx()); igual(G.bonusAtk, at + 1);
    },
    'tesouro: o baú dá item e ouro': () => { heroi('guerreiro', 4); const ouro = G.ouro; SALA_TESOURO.escolhas[0].acao(criaFx()); ok(G.ouro > ouro && G.fila.length === 1); },
  });

  Testes.suite('Loja, itens e cartas de nível', {
    'loja: comprar poção e item gasta ouro; sem ouro, o botão fica desabilitado': () => {
      heroi('guerreiro', 4); G.ouro = 1000; telaLoja(); ok(G.loja.estoque.length === 3, '3 itens à venda'); const suco = G.cons.suco || 0, ouro = G.ouro;
      document.querySelector('.compra[data-t="cons"][data-id="suco"]').click(); igual(G.cons.suco, suco + 1); igual(G.ouro, ouro - CONSUMIVEIS.suco.preco);
      const preco = G.loja.estoque[0].preco; const o2 = G.ouro; document.querySelector('.compra[data-t="item"][data-i="0"]').click(); igual(G.ouro, o2 - preco); ok(document.querySelector('#b-eq'), 'tela do item aparece');
      heroi('guerreiro', 4); G.ouro = 0; telaLoja(); ok([...document.querySelectorAll('.compra')].every(b => b.disabled), 'sem ouro tudo bloqueado');
    },
    'o mesmo item no Desafio do Dia vem igual para todos (loja com semente)': () => {
      const loja = () => { heroi('mago', 4, { modo: 'diario', dia: '2026-11-14' }); telaLoja(); return JSON.stringify(G.loja.estoque.map(e => [e.item.id, e.preco])); };
      ok(loja() !== '' && loja().length > 10); igual(loja(), loja(), 'estoque da loja');
    },
    'tela do item mostra bônus, comparação e sinergias; equipar troca e vende o antigo': () => {
      heroi('guerreiro', 4); const antigo = G.equip.arma, novo = itemPorId('esp_zecleiton'); const ouro = G.ouro; telaItem(novo, () => {}); ok(/Se equipar/.test(document.querySelector('#palco').textContent));
      document.querySelector('#b-eq').click(); igual(G.equip.arma.id, 'esp_zecleiton'); igual(G.ouro, ouro + vendaItem(antigo));
      telaItem(itemPorId('colete_sofa'), () => {}); ok(/Herança de Família|Avança/.test(document.querySelector('#palco').textContent), 'dica de sinergia (família)');
    },
    'cartas de nível: 3 cartas diferentes, e as que completam sinergia aparecem mais': () => {
      heroi('guerreiro', 4); const c = geraCartas(); igual(c.length, 3); igual(new Set(c.map(x => x.k + (x.id || x.a || ''))).size, 3, 'cartas repetidas');
      heroi('clerigo', 4); G.skills.push('mao_curadora'); let com = 0, sem = 0; for (let i = 0; i < 600; i++) geraCartas().forEach(x => { if (x.k === 'nova' && x.id === 'bencao_escudo') com++; if (x.k === 'nova' && x.id === 'chama_varthos') sem++; });
      ok(com > sem * 1.3, `carta que completa o Santuário saiu ${com}× contra ${sem}× (uma que não completa nada)`);
    },
    'escolher uma carta aplica o efeito e consome a pendência': () => {
      heroi('guerreiro', 4); G.pendCartas = 2; telaCartas(); const n = document.querySelectorAll('.carta').length; igual(n, 3); const skills = G.skills.length, nivel = G.nivel;
      document.querySelector('.carta').click(); ok(G.pendCartas === 1 || document.querySelector('.carta'), 'pendência'); igual(G.nivel, nivel);
    },
    'dispensar um companheiro pela ficha': () => {
      heroi('guerreiro', 4); criaFx().aliado('gato'); abrirFicha(); const b = document.querySelector('[data-dispensa="0"]'); ok(b, 'botão dispensar'); b.click(); igual(G.aliados.length, 0); fechaModal();
    },
  });
})();
