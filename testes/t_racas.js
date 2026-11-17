'use strict';
/* TESTES DAS RAÇAS — dados, equilíbrio, efeitos de cada raça, desbloqueios (Conde Vladislau!),
   eventos exclusivos, tela de escolha e lápide. Mesmo estilo dos outros testes: dados viciados e UI de verdade. */
(() => {
  const { ok, igual, perto, heroi, luta, comDados } = Testes;
  const d20 = n => (n - 1) / 20 + 0.01, DANO = 0.5;
  const golpe = (rolagem, escala = 'for') => comDados([DANO, d20(rolagem), 0.5, 0.5, 0.5], () => golpeJogador(escala, 1));
  const slime = () => ({ ...INIMIGOS.find(i => i.nome.startsWith('Slime')) });   // inimigo "neutro" (nenhuma raça tem rivalidade com ele)
  const SEM_DEF = { hp: 99999, hpMax: 99999, ca: 5, def: 0, atk: 1 };
  const idsRaca = Object.keys(RACAS);

  Testes.suite('Raças: dados e equilíbrio', {
    'toda raça está completa e referencia coisas que existem': () => {
      ok(idsRaca.length >= 9, 'poucas raças');
      for (const [id, r] of Object.entries(RACAS)) {
        ok(r.nome && r.icone && r.cor && r.desc && r.passiva && r.passiva.nome && r.passiva.desc && r.fraqueza, `${id}: faltam campos`);
        for (const k of Object.keys(r.attr)) ok(ATRIBUTOS[k], `${id}: atributo inválido ${k}`);
        r.tags.forEach(t => ok(TAGS[t], `${id}: tag inexistente ${t}`));
        [...r.afins, ...r.rejeita].forEach(a => ok(ALIADOS[a], `${id}: companheiro inexistente ${a}`));
        ok(!r.afins.some(a => r.rejeita.includes(a)), `${id}: o mesmo companheiro é amigo e rejeitado`);
        if (r.desbloqueio) { ok(CONQUISTAS.some(c => c.id === r.desbloqueio.conq), `${id}: conquista de desbloqueio inexistente`); ok(r.desbloqueio.texto && r.desbloqueio.dica, `${id}: textos do desbloqueio`); }
      }
      ok(idsRaca.filter(id => !RACAS[id].desbloqueio).length >= 3, 'poucas raças liberadas desde o início');
    },
    'cada raça tem um efeito próprio e o código usa esse efeito': async () => {
      const fonte = await Testes.fonteDoJogo(), efs = idsRaca.map(id => RACAS[id].ef).filter(Boolean);
      igual(new Set(efs).size, efs.length, 'efeitos repetidos');
      for (const ef of efs) ok(fonte.split(`'${ef}'`).length - 1 >= 2, `o efeito "${ef}" só aparece na definição: ninguém o usa`);
    },
    'bônus e penalidades de atributo: sobra de 1 a 3 pontos (equilíbrio) e nenhum atributo fica negativo': () => {
      for (const id of idsRaca) {
        const soma = Object.values(RACAS[id].attr).reduce((a, b) => a + b, 0); ok(soma >= 1 && soma <= 3, `${id}: soma ${soma}`);
        const h = heroi('guerreiro', 1, { raca: id }); for (const k in ATRIBUTOS) ok(h.attr[k] >= 0, `${id}: ${k} negativo`);
        igual(Object.values(h.attr).reduce((a, b) => a + b, 0), 20 + soma, `${id}: total de atributos`);
      }
    },
    'ninguém começa com sinergia ativa, em nenhuma combinação classe × raça': () => {
      for (const c of Testes.todasAsClasses) for (const r of idsRaca) { heroi(c, 1, { raca: r }); igual(sinergiasAtivas(G).length, 0, `${c} ${r} já começa com sinergia`); }
    },
    'sinergias de raça só valem para a raça certa (e a raça conta como etiqueta)': () => {
      for (const s of SINERGIAS.filter(x => x.raca)) ok(RACAS[s.raca], `${s.id}: raça inexistente`);
      const prepara = raca => { heroi('guerreiro', 1, { raca }); G.skills.push('pele_pedra'); G.equip.armadura = { ...ITENS.find(i => i.id === 'armadura_latinhas') }; return sinergiasAtivas(G).map(s => s.id); };
      const anao = prepara('anao'), humano = prepara('humano');
      ok(anao.includes('forja_ana') && anao.includes('muralha'), 'Anão: ' + anao); ok(!humano.includes('forja_ana') && humano.includes('muralha'), 'Humano: ' + humano);
      heroi('mago', 1, { raca: 'elfo' }); G.skills.push('mente_afiada'); ok(sinergiasAtivas(G).some(s => s.id === 'sinal_forte'), 'Elfo conta como Arcano');
    },
  });

  Testes.suite('Raças: efeitos em jogo', {
    'Humano ganha 10% a mais de XP': () => { heroi('guerreiro'); ganhaXP(10); igual(G.xp, 10); heroi('guerreiro', 1, { raca: 'humano' }); ganhaXP(10); igual(G.xp, 11); },
    'Elfo ganha +1 de acerto e crítico; Goblin ganha +25% de ouro': () => {
      heroi('guerreiro'); const base = stats(G); heroi('guerreiro', 1, { raca: 'elfo' }); const el = stats(G);
      igual(el.acertoBase, base.acertoBase + 1); ok(el.crit > base.crit + 3, 'crítico');
      heroi('guerreiro', 1, { raca: 'goblin' }); igual(stats(G).ouro, 0.25);
    },
    'Anão sofre metade do dano do veneno': () => {
      const veneno = raca => { heroi('guerreiro', 5, { raca }); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 40, atkB: 20, traco: 'veneno' }); comDados([d20(15), 0.5, 0.1], () => ataqueInimigo()); return C.ps.veneno && C.ps.veneno.dano; };
      const normal = veneno('humano'), anao = veneno('anao'); ok(normal && anao, 'não envenenou'); igual(anao, Math.round(normal / 2));
    },
    'Halfling refaz um teste de evento que falhou, uma vez por andar': () => {
      heroi('guerreiro', 3, { raca: 'halfling' });
      ok(comDados([0, 0.99], () => criaFx().teste('for', 15)), 'a 1ª falha deve ser refeita'); igual(G.flags.refezNoAndar, 3);
      ok(!comDados([0, 0.99], () => criaFx().teste('for', 15)), 'a 2ª falha, no mesmo andar, fica falha'); G.andar = 4;
      ok(comDados([0, 0.99], () => criaFx().teste('for', 15)), 'no andar seguinte refaz de novo');
    },
    'Orc causa 25% a mais de dano com menos de 40% da vida e +15% contra rivais': () => {
      heroi('guerreiro', 1, { raca: 'orc' }); luta(slime(), {}, SEM_DEF); const normal = golpe(15); C.e.hp = 99999; G.hp = Math.floor(stats(G).hpMax * 0.3);
      perto(golpe(15), normal * 1.25, 1.5, 'fúria');
      heroi('guerreiro', 1, { raca: 'orc' }); luta(slime(), {}, SEM_DEF); const s = golpe(15);
      heroi('guerreiro', 1, { raca: 'orc' }); luta(INIMIGOS[0], {}, SEM_DEF); perto(golpe(15), s * 1.15, 1.5, 'goblin é rival do orc');
    },
    'parentes pegam leve: inimigo da família ataca 15% mais fraco': () => {
      const atk = raca => { heroi('guerreiro', 4, { raca }); luta(INIMIGOS.find(i => i.nome.startsWith('Orc ')), {}, {}); return C.e.atk; };
      igual(atk('orc'), Math.round(atk('humano') * 0.85));
    },
    'Draconato incendeia o inimigo no primeiro golpe de cada combate (só uma vez)': () => {
      heroi('guerreiro', 1, { raca: 'draconato' }); luta(slime(), {}, SEM_DEF); golpe(15);
      ok(C.e.st.dots.some(d => d.tipo === 'queima' && d.turnos === 3), 'sem queimadura'); const dano = C.e.st.dots[0].dano; golpe(15); igual(C.e.st.dots.length, 1); igual(C.e.st.dots[0].dano, dano);
    },
    'Morto-vivo levanta uma vez (35% da vida) e poções curam só metade': async () => {
      heroi('guerreiro', 2, { raca: 'morto_vivo' }); const max = stats(G).hpMax; G.hp = 0; await gameOver('teste', { tipo: 'evento', titulo: 'x' });
      ok(G && G.flags.levantou, 'não levantou'); igual(G.hp, Math.round(max * 0.35)); ok(!racaRevive(), 'não pode levantar duas vezes');
      C = null; G.hp = 1; G.cons.pastel = 1; aplicaConsumivel('pastel'); igual(G.hp, 1 + Math.round(max * 0.5), 'poção pela metade');
    },
    'Vampiro recupera 8% da vida ao vencer, mas a fogueira cura só 30%': async () => {
      heroi('guerreiro', 1, { raca: 'vampiro' }); const max = stats(G).hpMax; luta(slime(), {}, { hp: 0, hpMax: 10, ca: 5, atk: 1, xp: 0, ouro: 0 }); G.hp = Math.floor(max * 0.5);
      const antes = G.hp; await vitoria(); igual(G.hp - antes, Math.round(max * 0.08), 'Fome Elegante');
      G.hp = 1; const fx = criaFx(); fx.fogueira = true; curaFogueira(fx); igual(G.hp, 1 + Math.round(max * 0.3));
    },
    'Goblin paga 20% menos nas lojas': () => { heroi('guerreiro', 1, { raca: 'goblin' }); igual(precoLoja(100), 80); heroi('guerreiro'); igual(precoLoja(100), 100); },
    'companheiros amigos da raça ganham vínculo em dobro; os que desconfiam, metade': () => {
      heroi('guerreiro', 1, { raca: 'orc' }); igual(racaVinculo('pedro'), 2); igual(racaVinculo('gato'), 1);
      G.kills = 4; igual(racaVinculo('genivaldo'), 0); G.kills = 5; igual(racaVinculo('genivaldo'), 1);
      const fx = criaFx(); fx.aliado('pedro'); ok(fx.linhas.some(l => /vínculo cresce mais rápido/.test(l.t)), 'aviso de amizade');
    },
    'efeitos de raça não quebram quem não tem raça (saves antigos)': () => {
      heroi('guerreiro'); igual(G.raca, ''); ok(!temEf('sopro') && !temEf('furia_orc')); igual(precoLoja(50), 50); igual(racaVinculo('gato'), 1);
      luta(slime(), {}, SEM_DEF); ok(golpe(15) > 0);
    },
  });

  Testes.suite('Raças: desbloqueios e o Conde Vladislau', {
    'raças trancadas só abrem com a conquista certa': () => {
      const trancadas = idsRaca.filter(id => RACAS[id].desbloqueio); igual(trancadas.filter(racaLiberada), [], 'nenhuma deveria estar liberada no início');
      Conquistas.grava(['rico']); ok(racaLiberada('goblin') && !racaLiberada('orc'));
    },
    'derrotar o Lich e o Dragão registra conquistas que liberam raças': () => {
      heroi('guerreiro', 10); racaVitoria({ boss: true, nome: CHEFES[1].nome }, []); checaConquistas();
      ok(Conquistas.todas().matou_lich && racaLiberada('morto_vivo'), 'Lich → Morto-vivo'); ok(!racaLiberada('draconato'));
      racaVitoria({ boss: true, nome: CHEFES[2].nome + ' (Versão Remix)' }, []); checaConquistas(); ok(racaLiberada('draconato'), 'Dragão (até no remix) → Draconato');
      racaVitoria({ boss: false, nome: 'Goblin' }, []); igual(G.flags.chefesMortos.length, 2, 'só chefões contam');
    },
    'o evento do Conde aparece só do andar 6 em diante, fora do Desafio do Dia, e só enquanto o Vampiro está trancado': () => {
      const ev = EVENTOS.find(e => e.id === 'conde_vlad'); ok(ev, 'falta o evento');
      heroi('guerreiro', 5); ok(!ev.cond(G), 'andar 5'); heroi('guerreiro', 6); ok(ev.cond(G), 'andar 6');
      heroi('guerreiro', 6, { modo: 'diario', dia: '2026-11-14' }); ok(!ev.cond(G), 'Desafio do Dia precisa ser igual para todos');
      Conquistas.grava(['mordido']); heroi('guerreiro', 6); ok(!ev.cond(G), 'Vampiro já liberado');
    },
    'aceitar o jantar leva a um combate de chefão com fases contra o Conde': () => {
      const ev = EVENTOS.find(e => e.id === 'conde_vlad'); heroi('guerreiro', 6); resolveEvento(ev, 0); document.querySelector('#b-cont').click();
      ok(C && C.e.nome === CONDE_VLAD.nome && C.e.boss && C.e.fases.length === 2, 'não começou o duelo contra o Conde');
    },
    'perder para o Conde libera a raça Vampiro (e o epitáfio conta a história)': async () => {
      heroi('guerreiro', 7); ok(!racaLiberada('vampiro'));
      await gameOver(`Derrotado por ${CONDE_VLAD.nome}`, { tipo: 'combate', inimigo: CONDE_VLAD.nome, hpIni: 20, turnos: 6, boss: true, fase: 2, fases: 3 });
      ok(Conquistas.todas().mordido, 'conquista não gravada'); ok(racaLiberada('vampiro')); ok(/Vladislau/.test(ultimaLapide.epitafio), ultimaLapide.epitafio); ok(ultimaLapide.novas.includes('mordido'));
    },
    'perder para outro inimigo NÃO libera o Vampiro': async () => {
      heroi('guerreiro', 7); await gameOver('Derrotado por Goblin', { tipo: 'combate', inimigo: 'Goblin Pedro Henrique', hpIni: 5, turnos: 4 }); ok(!racaLiberada('vampiro'));
    },
  });

  Testes.suite('Raças: eventos, telas e lápide', {
    'cada raça tem seu evento exclusivo (e ele some no Desafio do Dia)': () => {
      const evs = EVENTOS.filter(e => /^r_/.test(e.id)); igual(evs.length, idsRaca.length, 'um evento por raça');
      for (const id of idsRaca) {
        heroi('guerreiro', 8, { raca: id }); igual(evs.filter(e => e.cond(G)).length, 1, `${id}: exatamente um evento exclusivo`);
        heroi('guerreiro', 8, { raca: id, modo: 'diario', dia: '2026-11-14' }); igual(evs.filter(e => e.cond(G)).length, 0, `${id}: no Desafio do Dia`);
      }
      heroi('guerreiro', 8); igual(evs.filter(e => e.cond(G)).length, 0, 'sem raça não aparece nenhum');
    },
    'todas as escolhas dos eventos de raça funcionam (sem erro) com bons e maus resultados': () => {
      const racaDoEvento = id => (id === 'r_morto' ? 'morto_vivo' : id === 'conde_vlad' ? 'humano' : id.replace('r_', ''));
      for (const ev of EVENTOS.filter(e => /^r_/.test(e.id) || e.id === 'conde_vlad')) for (const rolagem of [0, 0.99]) ev.escolhas.forEach((_, i) => {
        heroi('guerreiro', 8, { raca: racaDoEvento(ev.id) }); G.ouro = 200; G.hp = Math.floor(stats(G).hpMax / 2);
        comDados([rolagem], () => resolveEvento(ev, i)); ok(document.querySelector('#b-cont'), `${ev.id}/${i}: tela de resultado`);
      });
    },
    'tela de raça: 4 abertas, 5 trancadas; escolher a raça leva aos atributos com os bônus': () => {
      telaClasse(); document.querySelector('.classe[data-c="guerreiro"]').click();
      igual(document.querySelectorAll('.classe:not(.trancada)').length, idsRaca.filter(id => !RACAS[id].desbloqueio).length); igual(document.querySelectorAll('.trancada').length, idsRaca.filter(id => RACAS[id].desbloqueio).length);
      ok(/Conde Vladislau/.test(document.querySelector('#palco').textContent), 'a dica do Vampiro deve aparecer');
      document.querySelector('[data-r="elfo"]').click(); ok(racaNova === 'elfo' && /Elfo/.test(document.querySelector('#palco h2').textContent)); ok(document.querySelector('.attr-val .ruim'), 'penalidade visível');
    },
    'fluxo completo: classe → raça → atributos → regras → aventura começa com a raça': () => {
      modoNovo = 'normal'; telaClasse(); document.querySelector('.classe[data-c="mago"]').click(); document.querySelector('[data-r="anao"]').click();
      document.querySelector('#b-aleat').click(); document.querySelector('#b-ir').click(); document.querySelector('#b-ir').click();
      ok(G && G.raca === 'anao' && G.classe === 'mago', 'run sem a raça'); igual(Object.values(G.attr).reduce((a, b) => a + b, 0), 20 + 10 + 2); ok(HistoricoRacas.todas().anao, 'raça registrada');
      document.querySelector('[data-hud="ficha"]').click(); ok(/Estômago de Ferro/.test(document.querySelector('#modal').textContent), 'ficha mostra a raça'); fechaModal();
    },
    'conquistas de colecionador: 3 raças = Viajante, todas = Colecionador': () => {
      for (const id of idsRaca.slice(0, 3)) heroi('guerreiro', 1, { raca: id }); checaConquistas(); ok(Conquistas.todas().viajante && !Conquistas.todas().todas_racas);
      for (const id of idsRaca) heroi('guerreiro', 1, { raca: id }); checaConquistas(); ok(Conquistas.todas().todas_racas);
    },
    'lápide, texto e epitáfio mostram a raça': () => {
      const r = { nome: 'Teste', classe: 'mago', raca: 'elfo', andar: 4, score: 10, nivel: 2, epitafio: 'x', mods: [], conq: [], aliados: [] };
      ok(htmlLapide(r).includes('Elfo Mago'), 'lápide'); ok(textoLapide(r).includes('🧝'), 'texto');
      ok(!htmlLapide({ ...r, raca: 'inventada' }).includes('undefined'), 'raça desconhecida (ranking antigo ou editado) não quebra');
      for (const id of idsRaca) ok(EPI_RACA[id] && EPI_RACA[id].length >= 2, `${id}: epitáfios da raça`);
      ok(/Vladislau/.test(criaEpitafio({ tipo: 'combate', vlad: true, heroi: 'Ana', andar: 7 })));
    },
  });
})();
