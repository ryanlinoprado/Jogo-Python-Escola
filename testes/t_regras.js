'use strict';
/* TESTES DE REGRAS — personagem, XP, pontuação, itens, salvamento e o mapa. */
(() => {
  const { ok, igual, perto, heroi } = Testes;

  Testes.suite('Regras: personagem, XP e pontuação', {
    'cada ponto de Vitalidade dá +6 de vida máxima': () => {
      heroi('guerreiro'); const antes = stats(G).hpMax; G.attr.vit += 1; igual(stats(G).hpMax - antes, 6);
    },
    'subir de nível dá +5 de vida máxima e +1 de energia': () => {
      heroi('mago'); const a = stats(G); G.nivel++; const d = stats(G); igual(d.hpMax - a.hpMax, 5); igual(d.enMax - a.enMax, 1);
    },
    'a CA sobe com Destreza e com armadura': () => {
      heroi('ladino'); const base = stats(G).ca; G.attr.des += 3; ok(stats(G).ca > base, 'Destreza não aumenta a CA');
      const antes = stats(G).ca; G.equip.armadura = { ...ITENS.find(i => i.id === 'armadura_rei_churrasco') }; ok(stats(G).ca >= antes + 6, 'armadura pesada deveria dar bastante CA');
    },
    'chance de crítico e esquiva têm teto': () => {
      heroi('ladino', 1, {}, { des: 99, sor: 99 }); const st = stats(G); ok(st.crit <= 75, 'crítico passou de 75%'); ok(st.esq <= 40, 'esquiva passou de 40%');
    },
    'a faixa de crítico começa em 20 e desce até 15 com Destreza e Sorte': () => {
      heroi('guerreiro', 1, {}, { des: 1, sor: 1 }); igual(stats(G).critMin, 20, 'com pouca Destreza/Sorte é 20'); heroi('ladino', 1, {}, { des: 60, sor: 60 }); igual(stats(G).critMin, 15, 'piso em 15');
      heroi('ladino', 1, {}, { des: 12 }); ok(stats(G).critMin < 20 && stats(G).critMin >= 15, 'Destreza alta deveria ampliar a faixa');
    },
    'bônus de itens, bênçãos e companheiros entram em stats()': () => {
      heroi('guerreiro'); const base = stats(G);
      G.equip.amuleto = { ...ITENS.find(i => i.id === 'cueca_sorte') }; igual(stats(G).s.sor - base.s.sor, 2, 'item');
      G.bencaos.push({ id: 'x', mods: { for: 2 }, desc: '' }); igual(stats(G).s.for - base.s.for, 2, 'bênção');
      const fx = criaFx(); fx.aliado('caramelo'); ok(stats(G).esq > base.esq, 'companheiro');
    },
    'só o Clérigo tem regeneração, e ela cresce com o nível': () => {
      heroi('guerreiro'); igual(stats(G).regen, 0); heroi('clerigo'); igual(stats(G).regen, 2); G.nivel = 6; igual(stats(G).regen, 4);
    },
    'o Bárbaro é o mais resistente de todos, mas causa menos dano': () => {
      heroi('barbaro'); const b = stats(G); igual(b.danoMult, 0.9, 'dano -10%');
      for (const id of Testes.todasAsClasses.filter(c => c !== 'barbaro')) {
        heroi(id); const o = stats(G); ok(b.hpMax > o.hpMax + 20, `vida contra ${id}: ${b.hpMax} x ${o.hpMax}`); ok(b.def > o.def, `defesa contra ${id}`); igual(o.danoMult, 1, `${id} sem redutor`);
      }
    },
    'o modificador Canhão de Vidro reduz a vida máxima em 35%': () => {
      heroi('guerreiro'); const normal = stats(G).hpMax; heroi('guerreiro', 1, { mods: ['vidro'] }); perto(stats(G).hpMax, normal * 0.65, 1);
    },
    'XP: sobe de nível, acumula cartas pendentes e cura 30%': () => {
      heroi('guerreiro'); G.hp = 10; const max = stats(G).hpMax; const subiu = ganhaXP(xpProx(1)); igual(subiu, 1); igual(G.nivel, 2); igual(G.pendCartas, 1);
      ok(G.hp >= 10 + Math.round(max * 0.3) - 1, 'não curou 30% ao subir de nível');
      ganhaXP(10000); ok(G.nivel > 5 && G.pendCartas > 3, 'vários níveis de uma vez');
    },
    'o XP necessário só cresce': () => { for (let n = 1; n < 40; n++) ok(xpProx(n + 1) > xpProx(n)); },
    'pontuação = (andar, abates, chefões, itens, ouro) × modificadores': () => {
      heroi('guerreiro', 7); G.kills = 3; G.chefes = 1; G.pontosItens = 20; G.ouroTotal = 100;
      igual(pontosBase(), 7 * 100 + 30 + 150 + 20 + 20); igual(calculaScore(), pontosBase());
      G.mods = ['vidro', 'pesadelo']; igual(calculaScore(), Math.round(pontosBase() * 1.6)); igual(multMods(['sem_cura', 'ca_ouro']), 1.65);
    },
    'sorteio de itens: só da classe do herói e respeitando a raridade mínima': () => {
      heroi('mago'); for (let i = 0; i < 400; i++) { const it = sorteiaItem(G, { min: 3, bonus: 1 }); ok(!it.classe || it.classe === 'mago', 'item de outra classe: ' + it.nome); ok(it.raridade >= 3, 'raridade abaixo do mínimo'); }
    },
    'Sorte alta melhora a raridade média dos itens': () => {
      const media = sor => { heroi('guerreiro', 10, {}, { sor }); let s = 0; for (let i = 0; i < 1500; i++) s += sorteiaRaridade(G, {}); return s / 1500; };
      ok(media(40) > media(1) + 0.15, 'Sorte não influencia o sorteio');
    },
    'a ficha do herói não quebra e mostra os números principais': () => {
      heroi('guerreiro'); abrirFicha(); const m = document.querySelector('#modal'); ok(!m.hidden && /Atributos/.test(m.textContent) && /CA/.test(m.textContent), 'ficha vazia'); fechaModal();
    },
  });

  Testes.suite('Regras: salvamento', {
    'salvar e lerSave devolvem o mesmo herói (com mapa e companheiros)': () => {
      heroi('clerigo', 3); const fx = criaFx(); fx.aliado('gato'); escolherSala(); salvar();
      const lido = lerSave(); ok(lido, 'save não foi lido'); igual(lido.nome, G.nome); igual(lido.aliados.map(a => a.id), ['gato']); igual(JSON.stringify(lido.mapa), JSON.stringify(G.mapa));
    },
    'lerSave aguenta lixo no armazenamento': () => {
      store.set('masmorra_save', 'isto não é json'); igual(lerSave(), null); store.set('masmorra_save', '{"a":1}'); igual(lerSave(), null);
    },
    'não salva no meio de um drop pendente nem com o herói morto': () => {
      heroi('guerreiro'); G.fila = [() => {}]; store.del('masmorra_save'); salvar(); igual(lerSave(), null); G.fila = []; G.hp = 0; salvar(); igual(lerSave(), null);
    },
  });

  Testes.suite('Mapa ramificado', {
    'em 600 mapas: 5 linhas, chefão sozinho, sem becos e sem salas órfãs': () => {
      for (let t = 0; t < 600; t++) {
        heroi('guerreiro', 1 + 5 * (t % 6), { mods: t % 7 === 0 ? ['sem_loja'] : [] }); const m = gerarMapa(), L = m.linhas, por = {}; L.forEach(l => l.forEach(n => { por[n.id] = n; }));
        igual(L.length, 5, 'linhas'); igual(L[4].length, 1); igual(L[4][0].tipo, 'chefe');
        for (let l = 0; l < 4; l++) for (const n of L[l]) { ok(n.prox.length >= 1, 'sala sem saída'); igual(new Set(n.prox).size, n.prox.length, 'aresta duplicada'); n.prox.forEach(id => ok(por[id] && por[id].linha === l + 1, 'aresta para linha errada')); }
        for (let l = 1; l < 5; l++) for (const n of L[l]) ok(L[l - 1].some(p => p.prox.includes(n.id)), 'sala sem entrada');
        const chega = id => (por[id].tipo === 'chefe' ? true : por[id].prox.every(chega)); ok(L[0].every(n => chega(n.id)), 'caminho que não chega ao chefão');
      }
    },
    'antes do chefão: só fogueira ou loja, com fogueira alcançável de toda sala': () => {
      for (let t = 0; t < 200; t++) {
        heroi('mago', 1 + 5 * (t % 4)); const L = gerarMapa().linhas, por = {}; L.forEach(l => l.forEach(n => { por[n.id] = n; }));
        ok(L[3].some(n => n.tipo === 'fogueira') && L[3].every(n => ['fogueira', 'loja'].includes(n.tipo)), 'linha 3 inválida');
        for (const n of L[2]) ok(n.prox.some(id => por[id].tipo === 'fogueira'), 'sala da linha 2 sem fogueira à frente');
      }
    },
    'regras por andar: elite só do andar 3, loja só do andar 2, no máximo 1 raro por linha': () => {
      for (let t = 0; t < 300; t++) {
        heroi('ladino', 1 + 5 * (t % 5)); const m = gerarMapa();
        m.linhas.slice(0, 4).forEach((l, li) => {
          const a = m.zona * 5 + li + 1; l.forEach(n => { if (n.tipo === 'elite') ok(a >= 3, 'elite cedo'); if (n.tipo === 'loja') ok(a >= 2, 'loja cedo'); });
          if (li < 3) ['elite', 'loja', 'tesouro', 'fogueira'].forEach(tp => ok(l.filter(n => n.tipo === tp).length <= 1, 'tipo raro repetido: ' + tp));
        });
      }
    },
    'o modificador "sem loja" tira as lojas': () => { for (let t = 0; t < 100; t++) { heroi('guerreiro', 6, { mods: ['sem_loja'] }); ok(!gerarMapa().linhas.flat().some(n => n.tipo === 'loja')); } },
    'no Desafio do Dia o mapa é igual para todos, mesmo gerado no meio da zona': () => {
      const mk = (dia, andar) => { heroi('mago', andar, { modo: 'diario', dia }); return JSON.stringify(gerarMapa()); };
      const a = mk('2026-11-14', 1); igual(mk('2026-11-14', 1), a); igual(mk('2026-11-14', 4), a, 'gerado no andar 4'); ok(mk('2026-11-15', 1) !== a, 'outro dia, mesmo mapa'); ok(mk('2026-11-14', 6) !== a, 'outra zona, mesmo mapa');
      const g = heroi('mago', 8); const andar = G.andar; gerarMapa(); igual(G.andar, andar, 'gerarMapa deve devolver o andar como estava');
    },
    'a tela do mapa só libera as salas ligadas à sala anterior': () => {
      heroi('guerreiro', 1); escolherSala(); const m = G.mapa; const linha0 = m.linhas[0].map(n => n.id).sort();
      igual([...document.querySelectorAll('.no-mapa:not([disabled])')].map(b => b.dataset.id).sort(), linha0, 'no início, toda a linha 0');
      const alvo = m.linhas[0][0]; m.atual = alvo.id; m.trilha.push(alvo.id); G.andar = 2; escolherSala();
      igual([...document.querySelectorAll('.no-mapa:not([disabled])')].map(b => b.dataset.id).sort(), [...alvo.prox].sort(), 'depois: só as ligadas');
    },
    'pular um andar (moeda de Lysara, portal) libera qualquer sala da nova linha': () => {
      heroi('guerreiro', 1); escolherSala(); const m = G.mapa; m.atual = m.linhas[0][0].id; m.trilha.push(m.atual); G.andar = 3; escolherSala();
      igual(document.querySelectorAll('.no-mapa:not([disabled])').length, m.linhas[2].length);
    },
    'zona nova gera um mapa novo; o do chefão tem 1 sala': () => {
      heroi('guerreiro', 5); escolherSala(); igual(document.querySelectorAll('.no-mapa:not([disabled])').length, 1); const z0 = G.mapa.zona; G.andar = 6; escolherSala(); ok(G.mapa.zona !== z0, 'mapa da zona antiga reaproveitado');
    },
  });
})();
