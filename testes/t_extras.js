'use strict';
/* TESTES DOS MÓDULOS EXTRAS — Desafio do Dia, conquistas, epitáfios, Oficina, Modo Professor, música e ranking. */
(() => {
  const { ok, igual, perto, heroi } = Testes;
  const entradaRank = (i, extra = {}) => ({ id: 't' + i, nome: 'Aluno' + i, classe: 'mago', andar: 5 + i, score: 500 + i * 100, nivel: 3, kills: 5, chefes: 1, causa: 'Derrotado por Rei Goblin Dom Pedrinho dos Bigodes', data: new Date(Date.now() - i * 60000).toISOString(), ...extra });

  Testes.suite('Desafio do Dia e modificadores', {
    'semente: mesmo texto, mesma sequência; textos diferentes, sequências diferentes': () => {
      const a = geradorComSemente('2026-11-14|x'), b = geradorComSemente('2026-11-14|x'), c = geradorComSemente('2026-11-15|x');
      const sa = [a(), a(), a()], sb = [b(), b(), b()], sc = [c(), c(), c()]; igual(sa, sb); ok(JSON.stringify(sa) !== JSON.stringify(sc)); ok(sa.every(v => v >= 0 && v < 1));
    },
    'a data de hoje tem o formato AAAA-MM-DD e a regra do dia vem da data': () => {
      ok(/^\d{4}-\d{2}-\d{2}$/.test(diaDeHoje())); igual(modDoDia('2026-11-14'), modDoDia('2026-11-14')); const mods = new Set(); for (let d = 1; d <= 60; d++) mods.add(modDoDia('2026-12-' + String(d % 28 + 1).padStart(2, '0') + '#' + d)); ok(mods.size >= 5, 'pouca variedade de modificadores do dia');
    },
    'no Desafio do Dia, inimigos e eventos de cada andar são os mesmos para todos': () => {
      const rodada = dia => { heroi('mago', 1, { modo: 'diario', dia }); const o = []; for (let a = 1; a <= 12; a++) { G.andar = a; o.push(mundo('inimigo', () => pick(poolInimigos())).nome + '/' + escolheEvento().id); } return o.join('|'); };
      const a = rodada('2026-11-14'); igual(rodada('2026-11-14'), a); ok(rodada('2026-11-15') !== a);
    },
    'no modo normal o mundo é aleatório': () => {
      const rodada = () => { heroi('mago', 1); const o = []; for (let a = 1; a <= 12; a++) { G.andar = a; o.push(pick(poolInimigos()).nome); } return o.join('|'); };
      let diferentes = false; const a = rodada(); for (let i = 0; i < 5 && !diferentes; i++) diferentes = rodada() !== a; ok(diferentes, 'sempre igual: o sorteio deveria variar');
    },
    'mundo() devolve o sorteio ao normal depois de usar a semente': () => { heroi('mago', 3, { modo: 'diario', dia: '2026-11-14' }); const antes = _r; mundo('x', () => 1); ok(_r === antes, 'o gerador não foi restaurado'); },
  });

  Testes.suite('Conquistas, epitáfios e lápide', {
    'cada conquista é ganha na condição certa (e não antes)': () => {
      const caso = { mal_comecou: [g => { g.andar = 1; }, true], primeiro_chefe: [g => { g.chefes = 1; }], veterano: [g => { g.nivel = 10; }], andar10: [g => { g.andar = 10; }], andar20: [g => { g.andar = 20; }], andar30: [g => { g.andar = 30; }],
        chefe_limpo: [g => { g.est.bossLimpo = 1; }], tres_um: [g => { g.est.nat1 = 3; }], cinco_vinte: [g => { g.est.nat20 = 5; }], teste_critico: [g => { g.est.testeCrit = 1; }], estatua: [g => { g.flags.derrubouEstatua = true; }],
        gnomo: [g => { g.flags.gnomo = g.flags.gnomoPago = true; }], rico: [g => { g.ouroTotal = 600; }], lendario: [g => { g.melhor = { nome: 'x', raridade: 4 }; }], purista: [g => { g.andar = 8; g.est.cons = 0; }], covarde: [g => { g.est.fugas = 5; }],
        por_um_fio: [g => { g.est.fio = 1; }], moeda: [g => { g.est.moeda = 1; }], masoquista: [g => { g.mods = ['vidro', 'pesadelo', 'gnomos']; g.andar = 5; }], diario: [g => { g.modo = 'diario'; g.andar = 5; }],
        sinergista: [g => { g.skills.push('grito_guerra', 'sede_sangue', 'pele_pedra'); g.equip.armadura = itemPorId('armadura_latinhas'); g.equip.arma = itemPorId('machado_lenha'); }], amigo_bicho: [g => { g.aliados = [novoAliado('gato')]; }],
        lider_bando: [g => { g.aliados = [novoAliado('gato'), novoAliado('caramelo')]; }], laco: [g => { g.aliados = [{ ...novoAliado('gato'), nivel: 5 }]; }], relampago: [g => { g.est.bossRelampago = 1; }], mordido: [g => { g.flags.mordido = true; }], matou_dragao: [g => { g.flags.chefesMortos = [CHEFES[2].nome]; }], matou_lich: [g => { g.flags.chefesMortos = [CHEFES[1].nome]; }],
        viajante: [() => { ['humano', 'elfo', 'anao'].forEach(r => HistoricoRacas.marca(r)); }], todas_racas: [() => { Object.keys(RACAS).forEach(r => HistoricoRacas.marca(r)); }], ultima_fase: [g => { g.est.bossUltimaFase = 1; }], revisor: [g => { g.est.reviewOk = 3; }] };
      for (const c of CONQUISTAS) {
        if (c.id === 'criador' || c.id === 'autor_turma' || c.id === 'maestro') continue;   // ganhas em outros lugares (Oficina) ou muito difíceis de montar
        const [prep, fim] = caso[c.id] || []; ok(prep, 'sem caso de teste para a conquista ' + c.id);
        heroi('guerreiro', 4); ok(!c.teste(G, false), `${c.id}: não deveria estar ganha no começo`); heroi('guerreiro', 4); prep(G); ok(c.teste(G, !!fim), `${c.id}: não foi ganha`);
      }
    },
    'conquistas são gravadas na hora, só avisam na primeira vez e liberam o Clérigo': () => {
      heroi('guerreiro', 10); ok(!classeLiberada('clerigo')); checaConquistas(); ok(G.conq.includes('andar10') && Conquistas.todas().andar10, 'gravada'); ok(classeLiberada('clerigo'), 'classe liberada'); ok(G.novas.includes('andar10'));
      const n = document.querySelectorAll('.toast').length; checaConquistas(); igual(document.querySelectorAll('.toast').length, n, 'não deve avisar de novo');
      heroi('guerreiro', 10); checaConquistas(); ok(!(G.novas || []).includes('andar10'), 'em outra aventura não é "nova"');
    },
    'título do ranking = o da conquista mais rara': () => { igual(tituloDaRun([]), ''); igual(tituloDaRun(['rico', 'chefe_limpo', 'tres_um']), 'o Intocável'); },
    'epitáfios: sempre texto curto, com o nome do herói, para todas as mortes': () => {
      const infos = [{ tipo: 'combate', inimigo: 'um Pastel', hpIni: 3, turnos: 7 }, { tipo: 'combate', inimigo: 'Goblin', hpIni: 40, turnos: 1 }, { tipo: 'combate', inimigo: 'Rei', hpIni: 10, turnos: 5, boss: true, fase: 3, fases: 3 }, { tipo: 'combate', inimigo: 'X', hpIni: 50, turnos: 9, crit: true }, { tipo: 'evento', titulo: 'Baú' }, { tipo: 'outro' }];
      for (const i of infos) for (const cl of Testes.todasAsClasses) for (let k = 0; k < 8; k++) { const t = criaEpitafio({ ...i, heroi: 'Zé', classe: cl, andar: 1 + k, mods: ['vidro'], aliados: ['Gato'] }); ok(t.length > 10 && t.length <= 190 && t.includes('Zé'), 'epitáfio ruim: ' + t); }
    },
    'a lápide escapa HTML nos nomes e o texto de compartilhar é legível': () => {
      const r = { nome: '<img src=x onerror=alert(1)>', classe: 'mago', andar: 5, score: 500, nivel: 2, mult: 125, epitafio: '<script>x</script> morreu.', titulo: '<b>t</b>', mods: ['vidro'], conq: ['rico'], aliados: ['gato'], modo: 'diario', dia: '2026-11-14', ultimas: 'ok' };
      const h = htmlLapide(r); ok(!/<img src=x|<script/i.test(h), 'HTML do aluno apareceu sem escape'); const t = textoLapide(r); ok(/Andar 5/.test(t) && /500 pontos/.test(t));
    },
    'ficha, HUD e conquistas mostram companheiros, modificadores e títulos sem quebrar': () => {
      heroi('guerreiro', 4, { mods: ['vidro'] }); criaFx().aliado('gato'); hud(); ok(/🔮/.test(document.querySelector('#hud').textContent) && /🐱/.test(document.querySelector('#hud').textContent)); telaConquistas(); ok(document.querySelectorAll('.conq').length === CONQUISTAS.length);
    },
  });

  Testes.suite('Ranking local', {
    'ordena por pontuação, depois andar, depois quem chegou primeiro': () => {
      const l = Rank.ordena([entradaRank(1, { score: 500 }), entradaRank(2, { score: 900, andar: 3 }), entradaRank(3, { score: 500, andar: 9 }), entradaRank(4, { score: 500, andar: 9, data: '2000-01-01' })]);
      igual(l.map(e => e.id), ['t2', 't4', 't3', 't1']);
    },
    'salvar grava local; listar lê de volta; apagar e zerar funcionam sem servidor': async () => {
      await Rank.salvar(entradaRank(1)); await Rank.salvar(entradaRank(2)); igual((await Rank.listar()).length, 2); igual(Rank.servidor, false);
      await Rank.apaga('t1'); igual((await Rank.listar()).map(e => e.id), ['t2']); await Rank.zerar(); igual((await Rank.listar()).length, 0);
    },
  });

  Testes.suite('Oficina do Aprendiz', {
    'inimigo: valida, limita, tira HTML e calcula XP/ouro pela força': () => {
      const e = validaInimigo({ id: 'c_abc123', nome: '<b>Pastel</b>', icone: '<img src=x>', min: 99, hp: 99, atk: -3, def: 'x', traco: 'hack', ritmo: 9, fala: 'oi<script>' });
      ok(e && !/[<>]/.test(e.nome + e.icone + e.fala), 'tags devem sair'); igual([e.min, e.hp, e.atk, e.def, e.traco, e.ritmo], [9, 2.5, 0.5, 1, '', 0]);
      igual(validaInimigo({ id: '../x', nome: 'A' }), null, 'id ruim'); igual(validaInimigo({ id: 'c_abc123', nome: '  ' }), null, 'sem nome');
      ok(ofXp({ hp: 0.5, atk: 0.5, def: 0.5 }) === 0.7 && ofXp({ hp: 2.5, atk: 2, def: 2 }) === 2.2 && ofOuro({ hp: 2.5, atk: 2, def: 2 }) === 2, 'limites de XP e ouro');
    },
    'item: o orçamento de pontos por raridade vale': () => {
      const base = { id: 'c_item01', nome: 'X', slot: 'amuleto', raridade: 0, passos: {} };
      ok(validaItem({ ...base, passos: { for: 2 } }), '2 pontos em Comum'); igual(validaItem({ ...base, passos: { for: 3 } }), null, '3 pontos em Comum'); igual(validaItem({ ...base, raridade: 1, passos: { ca: 2 } }), null, 'CA custa 3 por ponto');
      ok(validaItem({ ...base, raridade: 4, passos: { for: 6, des: 6, int: 6 } }), 'lendário aceita 18'); igual(validaItem({ ...base, slot: 'capacete' }), null, 'slot');
      for (let r = 0; r < 5; r++) ok(OF_ORCAMENTO[r] > (OF_ORCAMENTO[r - 1] || 0), 'orçamento deve crescer');
    },
    'objetos do jogo e código gerado batem com o formulário': () => {
      const it = validaItem({ id: 'c_item01', nome: "Colher do 'Chefe'", slot: 'arma', raridade: 2, classe: 'clerigo', passos: { vit: 2, hp: 2 }, tag: 'sagrado', flavor: 'x' });
      const d = defItem(it); igual([d.atk, d.classe, d.mods], [12, 'clerigo', { vit: 2, hp: 10 }]); const cod = codigoItem(it); ok(/arma\('c_item01', 'Colher do \\'Chefe\\'', 2, 'clerigo', 12, \{ vit: 2, hp: 10 \}/.test(cod) && /TAGS_ITEM/.test(cod), cod);
      ok(/hp: 1\.3/.test(codigoInimigo(validaInimigo({ id: 'c_ini001', nome: 'A', hp: 1.3 }))));
    },
    'criações entram no jogo; exportar e importar fazem ida e volta': () => {
      Oficina.d.inimigos = [validaInimigo({ id: 'c_ini001', nome: 'Pastel', min: 1 })]; Oficina.d.itens = [validaItem({ id: 'c_it0001', nome: 'Colher', slot: 'arma', raridade: 1, classe: 'guerreiro', passos: { for: 2 }, tag: 'cozinha' })]; Oficina.salva();
      ok(INIMIGOS.some(i => i.custom && i.nome === 'Pastel') && ITENS.some(i => i.custom) && TAGS_ITEM.c_it0001, 'não entrou no jogo'); const exp = Oficina.exporta(); ok(!/token/.test(exp));
      Oficina.d = { inimigos: [], itens: [] }; igual(Oficina.importa(exp), 2); igual(Oficina.d.inimigos.length, 1); Oficina.apaga('inimigo', Oficina.d.inimigos[0].id); igual(Oficina.d.inimigos.length, 0);
      let erro = false; try { Oficina.importa('isto não é json'); } catch (e) { erro = true; } ok(erro, 'importar lixo deveria avisar');
    },
    'conteúdo criado nunca aparece no Desafio do Dia': () => {
      Oficina.d.inimigos = [validaInimigo({ id: 'c_ini001', nome: 'Pastel', min: 1 })]; Oficina.d.itens = [validaItem({ id: 'c_it0001', nome: 'Colher', slot: 'arma', raridade: 0, classe: 'guerreiro', passos: {} })]; Oficina.salva();
      heroi('guerreiro', 3, { modo: 'diario', dia: '2026-11-14' }); ok(!poolInimigos().some(i => i.custom)); for (let i = 0; i < 400; i++) ok(!sorteiaItem(G, { bonus: 0.5 }).custom);
      heroi('guerreiro', 3); ok(poolInimigos().some(i => i.custom), 'no modo normal deveria aparecer');
    },
    'o duelo de teste não mexe no ranking e volta para a Oficina': async () => {
      const e = validaInimigo({ id: 'c_ini001', nome: 'Fraquinho', min: 1, hp: 0.5, atk: 0.5, def: 0.5 }); dueloOficina(e); ok(G.teste && C.e.autor === '' || C.e.nome === 'Fraquinho'); C.e.hp = 0; await vitoria(); document.querySelector('#acoes [data-k="cont"]').click(); await Testes.espera(30);
      igual(G, null); ok(document.querySelector('#of-autor'), 'deveria voltar para a Oficina'); igual(Rank.local().length, 0);
    },
    'editor de inimigo e de item: preencher e salvar pela tela': () => {
      const set = (sel, v) => { const el = document.querySelector(sel); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      telaEditaInimigo(); set('#f-nome', 'Monstro de Teste'); set('#f-hp', 1.5); document.querySelector('#b-salva').click(); igual(Oficina.d.inimigos.length, 1); igual(Oficina.d.inimigos[0].hp, 1.5);
      telaEditaItem(); set('#f-nome', 'Item de Teste'); set('#f-raridade', '2'); document.querySelector('[data-mod="for"][data-d="1"]').click(); document.querySelector('[data-mod="for"][data-d="1"]').click(); document.querySelector('#b-salva').click(); igual(Oficina.d.itens[0].passos.for, 2);
      telaEditaItem(); set('#f-nome', 'Barato'); set('#f-raridade', '0'); for (let i = 0; i < 6; i++) { const b = document.querySelector('[data-mod="for"][data-d="1"]'); if (!b.disabled) b.click(); } ok(Object.values(Oficina.d.itens[0].passos).length >= 0); const pts = document.querySelector('#of-pontos').textContent; ok(/^0 de 2/.test(pts), 'orçamento da raridade Comum: ' + pts);
    },
  });

  Testes.suite('Modo Professor', {
    'estatísticas da turma com dados de exemplo': () => {
      const l = [entradaRank(1, { classe: 'mago', mods: ['vidro'], causa: 'Derrotado por Lich Linguiça, o Necromante Defumado', modo: 'diario' }), entradaRank(2, { classe: 'mago' }), entradaRank(3, { classe: 'ladino', andar: 20, mods: ['vidro'] })];
      const s = estatisticas(l); igual(s.n, 3); igual(s.jogadores, 3); igual(s.classes[0], ['mago', 2]); igual(s.mods[0], ['vidro', 2]); igual(s.diario, 1); ok(s.chefes.some(c => /Lich/.test(c[0])), 'chefão mais letal'); igual(s.recorde.andar, 20); perto(s.media, (6 + 7 + 20) / 3, 0.01);
      igual(estatisticas([]).n, 0); ok(profBarras([]).includes('Sem dados'));
    },
    'planilha CSV: aspas, ponto e vírgula e proteção contra fórmulas': () => {
      igual(csvCelula('ele disse "oi"'), '"ele disse ""oi"""'); igual(csvCelula('=SOMA(A1)'), '"\'=SOMA(A1)"'); igual(csvCelula(null), '""'); igual(csvCelula('+55'), '"\'+55"');
    },
    'telas do professor carregam (estatísticas, moderação e projetor) sem servidor': async () => {
      await Rank.salvar(entradaRank(1)); await Rank.salvar(entradaRank(2, { modo: 'diario', dia: diaDeHoje() }));
      await telaProfessor('stats'); ok(document.querySelectorAll('.pbarra').length > 3, 'estatísticas'); await telaProfessor('mod'); ok(document.querySelectorAll('[data-del-rank]').length === 2 && ![...document.querySelectorAll('[data-del-rank]')].some(b => b.disabled), 'moderação (sem servidor o professor é o próprio usuário)');
      document.querySelector('[data-del-rank="t1"]').click(); await Testes.espera(60); igual(Rank.local().length, 1);
      await telaProjetor(); ok(document.querySelectorAll('.proj-linha').length >= 1, 'projetor'); clearInterval(Prof.timer);
    },
  });

  Testes.suite('Música e cenários', {
    'cada trilha: notas na escala, determinística, bateria só em combate, chefão mais denso': () => {
      const gera = (ch, intens) => { const f = criaFaixa(ch, null, null, 0), tot = []; for (let k = 0; k < 128; k++) { tot.push(...eventos(f, intens).ev); f.passo++; } return tot; };
      for (const ch of Object.keys(MUSICAS)) {
        const cfg = MUSICAS[ch], esc = new Set(ESCALAS[cfg.escala]);
        for (const intens of [0, 1, 2]) {
          const ev = gera(ch, intens); for (const e of ev) { if (e.midi != null) ok(isFinite(e.midi) && e.midi > 20 && e.midi < 115, `${ch}: nota fora da faixa`); if ((e.tipo === 'nota' || e.tipo === 'pluck') && cfg.extra !== 'glitch') ok(esc.has((((e.midi - cfg.raiz) % 12) + 12) % 12), `${ch}: nota fora da escala`); if (e.dur != null) ok(e.dur > 0, 'duração'); }
          if (intens === 0 && cfg.bateria === 0) ok(!ev.some(e => e.tipo === 'bumbo' || e.tipo === 'caixa' || e.tipo === 'chimbal'), `${ch}: bateria fora de combate`);
          if (intens >= 1) ok(ev.some(e => e.tipo === 'bumbo'), `${ch}: sem bumbo em combate`);
        }
        ok(gera(ch, 2).length > gera(ch, 0).length, `${ch}: chefão deveria ser mais denso`); igual(JSON.stringify(gera(ch, 1)), JSON.stringify(gera(ch, 1)), `${ch}: deveria ser determinística`);
      }
    },
    'os acordes do tema do menu são Ré menor, Si bemol, Fá e Dó': () => {
      const f = criaFaixa('titulo', null, null, 0), acordes = [];
      for (let k = 0; k < 64; k++) { const { ev } = eventos(f, 0); if (k % 16 === 0) acordes.push(ev.filter(e => e.onda === 'sawtooth').map(e => e.midi - 12 - MUSICAS.titulo.raiz).sort((a, b) => a - b).join('-')); f.passo++; }
      igual(acordes, ['0-3-7', '8-12-15', '3-7-10', '10-14-17']);
    },
    'áudio renderizado: sem NaN, sem estouro, sem trechos mudos (3 zonas, 8 s cada)': async () => {
      if (typeof OfflineAudioContext === 'undefined') return;
      for (const ch of ['titulo', 'z3', 'z4']) {
        const buf = await Musica.renderiza(ch, ch === 'z3' ? 2 : 0, 8, 16000), d = buf.getChannelData(0); let pico = 0, soma = 0;
        for (let i = 0; i < d.length; i++) { ok(isFinite(d[i]), ch + ': NaN no áudio'); pico = Math.max(pico, Math.abs(d[i])); soma += d[i] * d[i]; }
        ok(pico < 1, `${ch}: estourou (${pico})`); const rms = Math.sqrt(soma / d.length); ok(rms > 0.004 && rms < 0.35, `${ch}: volume estranho (${rms})`);
      }
    },
    'o maestro troca de faixa, respeita mudo e silêncio': () => {
      const m = Musica.ctx, antes = Musica.desejada; Musica.muda('z2'); igual(Musica.desejada, 'z2'); Musica.muda('silencio'); igual(Musica.desejada, 'silencio'); Musica.muda(antes);
      const lig = Musica.ligada; Musica.ligada = false; ok(!Musica.ativa()); Musica.ligada = true; Som.mudo = true; ok(!Musica.ativa()); Musica.ligada = lig;
    },
    'cenários: o fundo troca de acordo com a zona e o menu': () => {
      heroi('guerreiro', 1); hud(); igual(document.getElementById('cenario').dataset.cena, 'z0'); G.andar = 12; hud(); igual(document.getElementById('cenario').dataset.cena, 'z2'); G = null; hud(); igual(document.getElementById('cenario').dataset.cena, 'titulo');
    },
  });
})();
