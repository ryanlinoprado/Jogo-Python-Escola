'use strict';
/* TESTES DE COMBATE — d20, CA, críticos, habilidades, sinergias, modificadores, companheiros e fases dos chefões.
   Usamos "dados viciados": Testes.comDados([0.5, 0.99], ...) faz o jogo rolar 20 em vez de um número aleatório. */
(() => {
  const { ok, igual, perto, heroi, luta, comDados } = Testes;
  /* d20 desejado -> valor "0..1" que o jogo transforma nesse número (rnd(1,20) = floor(x*20)+1) */
  const d20 = n => (n - 1) / 20 + 0.01;
  const DANO = 0.5;                              // rnd(90,110) com 0.5 = 100% (sem variação)
  const termina = async () => { for (let i = 0; i < 80 && C && C.ocupado && !C.fim; i++) await Testes.espera(4); };
  const ultimoLog = () => (C.log[C.log.length - 1] || '').replace(/<[^>]+>/g, '');
  const logTudo = () => C.log.join(' ').replace(/<[^>]+>/g, '');
  const golpe = (rolagem, escala = 'for', mult = 1, o = {}) => comDados([DANO, d20(rolagem), 0.5, 0.5, 0.5], () => golpeJogador(escala, mult, o));

  Testes.suite('Combate: d20 do herói', {
    'um 1 natural sempre erra, mesmo com bônus enorme': () => {
      heroi('guerreiro', 1, {}, { for: 40 }); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 1, def: 0 }); const hp = C.e.hp;
      igual(golpe(1), 0, 'dano'); igual(C.e.hp, hp);
    },
    'um 20 natural sempre acerta e dobra o dano': () => {
      heroi('guerreiro'); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0 });
      const normal = golpe(15); C.e.hp = 9999; const crit = golpe(20);
      ok(normal > 0 && crit >= 2 * normal - 1 && crit <= 2 * normal + 1, `normal ${normal}, crítico ${crit}`);
      C.e.ca = 99; ok(golpe(20) > 0, 'o 20 natural deve acertar mesmo com CA 99');
    },
    'acerta se d20 + bônus ≥ CA; erra se faltar 1': () => {
      heroi('guerreiro'); const st = stats(G), bonus = Math.floor(st.s.for / 3) + st.acertoBase;
      luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 10 + bonus, def: 0 }); ok(golpe(10) > 0, 'igual à CA deve acertar');
      C.e.ca = 11 + bonus; igual(golpe(10), 0, 'um ponto abaixo da CA deve errar');
    },
    'Destreza alta amplia a faixa de crítico (ex.: 17 já é crítico)': () => {
      heroi('ladino', 1, {}, { des: 30 }); const cm = stats(G).critMin; ok(cm < 20, 'precisa ter critMin < 20');
      luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 99, def: 0 }); ok(golpe(cm, 'des') > 0, 'rolar o critMin deveria ser crítico e acertar');
      C.e.hp = 9999; igual(golpe(cm - 1, 'des'), 0, 'um abaixo do critMin não passa da CA 99');
    },
    'ignora a defesa quando a habilidade manda (Golpe Furtivo)': () => {
      heroi('guerreiro'); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 30 });
      const com = golpe(15, 'for', 1, { ignoraDef: false }); C.e.hp = 9999; const sem = golpe(15, 'for', 1, { ignoraDef: true });
      ok(sem > com, 'ignorar defesa deveria causar mais dano');
    },
    'roubo de vida cura o herói (e não cura com "Só Cura em Fogueira")': () => {
      heroi('guerreiro'); G.bencaos.push({ id: 'x', mods: { roubaVida: 0.5 }, desc: '' }); G.hp = 10; luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0 });
      golpe(15); ok(G.hp > 10, 'não roubou vida');
      heroi('guerreiro', 1, { mods: ['sem_cura'] }); G.bencaos.push({ id: 'x', mods: { roubaVida: 0.5 }, desc: '' }); G.hp = 10; luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0 });
      golpe(15); igual(G.hp, 10, 'curou apesar do modificador');
    },
  });

  Testes.suite('Combate: ataques dos inimigos', {
    'inimigo erra com 1 natural e acerta com crítico (dano dobrado)': () => {
      heroi('guerreiro', 5); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 20, atkB: 3 }); const hp = G.hp;
      comDados([0], () => ataqueInimigo()); igual(G.hp, hp, '1 natural deveria errar');
      C.e.turno = 0; comDados([d20(15), 0.5], () => ataqueInimigo()); const dano1 = hp - G.hp; ok(dano1 > 0, 'd20 15 deveria acertar');
      G.hp = hp; C.e.turno = 0; comDados([0.99, 0.5], () => ataqueInimigo()); const dano2 = hp - G.hp; ok(dano2 >= dano1 * 2 - 3, `crítico ${dano2} deveria ser ~2× ${dano1}`); ok(/CRÍTICO/.test(logTudo()), 'log do crítico');
    },
    'a CA do herói decide quem é acertado': () => {
      heroi('guerreiro', 5); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 10, atkB: 2 }); G.hp = 500;
      const ca = stats(G).ca; const roll = ca - 2 - 1;   // d20 + 2 = ca - 1 => erra
      comDados([d20(roll), 0.5], () => ataqueInimigo()); igual(G.hp, 500, 'um ponto abaixo da CA deveria errar');
      C.e.turno = 0; comDados([d20(roll + 1), 0.5], () => ataqueInimigo()); ok(G.hp < 500, 'igual à CA deveria acertar');
    },
    'inimigos ficam mais fortes a cada andar; chefão e elite são mais difíceis': () => {
      const at = a => { heroi('guerreiro', a); return montaInimigo(INIMIGOS[0]); };
      const a1 = at(1), a10 = at(10), a20 = at(20); ok(a1.hpMax < a10.hpMax && a10.hpMax < a20.hpMax, 'vida'); ok(a1.atk < a10.atk && a10.atk < a20.atk, 'ataque'); ok(a1.ca < a10.ca && a10.ca < a20.ca, 'CA');
      heroi('guerreiro', 10); const comum = montaInimigo(INIMIGOS[0]), boss = montaInimigo(INIMIGOS[0], { boss: true }), elite = montaInimigo(INIMIGOS[0], { elite: true, mhp: 1.8 });
      ok(boss.ca > comum.ca && boss.atkB > comum.atkB, 'chefão'); ok(elite.ca > comum.ca && elite.hpMax > comum.hpMax, 'elite');
    },
    'característica "rouba ouro" rouba ouro ao acertar': () => {
      heroi('guerreiro', 5); G.ouro = 100; luta({ ...INIMIGOS[0], traco: 'rouba_ouro' }, {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 5, atkB: 20, traco: 'rouba_ouro' });
      comDados([d20(15), 0.5], () => ataqueInimigo()); ok(G.ouro < 100, 'não roubou');
    },
    'característica "rouba vida" cura o inimigo': () => {
      heroi('guerreiro', 5); luta(INIMIGOS[0], {}, { hp: 100, hpMax: 9999, ca: 5, atk: 20, atkB: 20, traco: 'rouba_vida' }); comDados([d20(15), 0.5], () => ataqueInimigo()); ok(C.e.hp > 100, 'inimigo não se curou');
    },
    'característica "veneno" pode envenenar o herói': () => {
      heroi('guerreiro', 5); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 10, atkB: 20, traco: 'veneno' }); comDados([d20(15), 0.5, 0.1], () => ataqueInimigo()); ok(C.ps.veneno, 'não envenenou');
    },
    'inimigo preguiçoso (ritmo) só ataca a cada N turnos, mais forte': () => {
      heroi('guerreiro', 5); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 10, atkB: 20, ritmo: 2 }); G.hp = 500;
      comDados([d20(15), 0.5], () => ataqueInimigo()); igual(G.hp, 500, 'turno 1: deveria descansar'); comDados([d20(15), 0.5], () => ataqueInimigo()); ok(G.hp < 500, 'turno 2: deveria atacar');
    },
    'golpe especial a cada N turnos e atordoamento faz perder a vez': () => {
      heroi('guerreiro', 5); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 10, atkB: 20, especial: { nome: 'Superpancada', mult: 3, cada: 2 } });
      comDados([d20(15), 0.5], () => ataqueInimigo()); ok(!/Superpancada/.test(logTudo()), 'não era a hora'); comDados([d20(15), 0.5], () => ataqueInimigo()); ok(/Superpancada/.test(logTudo()), 'especial não disparou');
      G.hp = 500; C.e.st.atordoado = 1; comDados([d20(15), 0.5], () => ataqueInimigo()); igual(G.hp, 500, 'atordoado deveria perder a vez'); igual(C.e.st.atordoado, 0);
    },
    'fuga: chance limitada a 85% e impossível em "Sem Covardes"': () => {
      heroi('ladino', 1, {}, { des: 99 }); ok(chaFuga() <= 0.85, 'teto'); heroi('guerreiro', 1, { mods: ['sem_fuga'] }); igual(chaFuga(), 0);
    },
  });

  Testes.suite('Combate: habilidades, poções e fim da luta', {
    'habilidade gasta energia, causa efeito e termina o turno': async () => {
      heroi('guerreiro'); G.en = 10; luta(INIMIGOS[0]); usarHabilidade('golpe_poderoso'); await termina();
      ok(G.en <= 7, 'não gastou a energia'); ok(/Golpe Poderoso/.test(logTudo()), 'log'); ok(C.turno >= 1, 'turno');
    },
    'sem energia suficiente a habilidade não funciona': async () => {
      heroi('guerreiro'); G.en = 0; luta(INIMIGOS[0]); const t = C.turno; usarHabilidade('golpe_poderoso'); await termina(); igual(C.turno, t);
    },
    'poções: suco cura 40%, energético dá 10 de energia, pastel cura tudo': () => {
      heroi('guerreiro'); const max = stats(G).hpMax; G.hp = 1; G.cons.suco = 2; aplicaConsumivel('suco'); perto(G.hp, 1 + max * 0.4, 1, 'suco'); igual(G.cons.suco, 1);
      G.en = 0; G.cons.energetico = 1; aplicaConsumivel('energetico'); igual(G.en, Math.min(10, stats(G).enMax), 'energético');
      G.hp = 1; G.cons.pastel = 1; aplicaConsumivel('pastel'); igual(G.hp, max, 'pastel');
    },
    'vitória: dá XP, ouro, abate e libera o botão continuar': async () => {
      heroi('guerreiro', 3); luta(INIMIGOS[0]); C.e.hp = 0; const ouro = G.ouro, k = G.kills; await vitoria();
      ok(G.ouro > ouro && G.kills === k + 1 && C.fim, 'recompensas'); ok(document.querySelector('#acoes [data-k="cont"]'), 'botão continuar');
    },
    'vitória sobre um chefão sem tomar dano conta como "Intocável"': async () => {
      heroi('guerreiro', 5); luta(CHEFES[0], { boss: true }); C.e.hp = 0; C.e.fase = 0; await vitoria(); igual(G.est.bossLimpo, 1); igual(G.chefes, 1);
    },
    'fugir com sucesso encerra a luta sem recompensa': async () => {
      heroi('ladino', 1, {}, { des: 99 }); luta(INIMIGOS[0]); const ouro = G.ouro; comDados([0], () => fugir()); await termina();
      ok(C.fim && G.ouro === ouro, 'fuga'); igual(G.est.fugas, 1);
    },
    'derrota abre a lápide e grava no ranking local': async () => {
      heroi('guerreiro', 4); luta(INIMIGOS[0]); G.hp = 0; await derrota(); await Testes.espera(60);
      ok(document.querySelector('.lapide'), 'sem lápide'); igual(Rank.local().length, 1, 'ranking local'); ok(!lerSave(), 'o save deveria ser apagado');
    },
  });

  Testes.suite('Combate: sinergias em ação', {
    'Sombra Dançante: só o primeiro golpe do combate ganha a emboscada': () => {
      heroi('ladino'); G.equip.arma = itemPorId('punhais_bruno'); G.equip.armadura = itemPorId('capa_invisivel'); ok(temSin('emboscada'));
      luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0 }); golpe(15, 'des'); ok(/Emboscada/.test(logTudo()), '1º golpe'); const n = C.log.length; golpe(15, 'des'); ok(!/Emboscada/.test(C.log.slice(n).join(' ')), '2º golpe não deveria');
    },
    'Trevo Triplo: um 1 natural é rolado de novo, mas só uma vez': () => {
      heroi('guerreiro'); G.equip.arma = itemPorId('chinelo'); G.equip.amuleto = itemPorId('cueca_sorte'); G.skills.push('trevo'); ok(temSin('rerrola'));
      luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0 }); comDados([DANO, 0, 0.99, 0.5], () => golpeJogador('for', 1)); ok(/Trevo Triplo/.test(logTudo()), 'rerrolagem');
      const n = C.log.length; comDados([DANO, 0, 0.5, 0.5], () => golpeJogador('for', 1)); ok(!/Trevo Triplo/.test(C.log.slice(n).join(' ')), 'só uma vez por combate');
    },
    'Muralha de Ferro: o herói contra-ataca quando o inimigo erra': () => {
      heroi('guerreiro'); G.skills.push('pele_pedra', 'escudada'); G.equip.armadura = itemPorId('armadura_latinhas'); ok(temSin('contra'));
      luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 5, atkB: 1 }); const hp = C.e.hp; comDados([0], () => ataqueInimigo()); ok(C.e.hp < hp && /Contra-ataque/.test(logTudo()));
    },
    'Lâmina Envenenada: o Golpe Furtivo também envenena': async () => {
      heroi('ladino'); G.skills.push('veneno'); ok(temSin('lamina')); G.en = 20; luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0, atk: 1 });
      comDados([DANO, 0.99, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], () => usarHabilidade('golpe_furtivo')); await termina(); ok(/Lâmina Envenenada/.test(logTudo()) && C.e.st.dots.some(d => d.tipo === 'veneno'));
    },
    'Choque Térmico: o Raio Gélido congela quem está queimando': async () => {
      heroi('mago'); G.skills.push('raio_gelido'); ok(temSin('choque')); G.en = 20; luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0, atk: 1 }); C.e.st.dots.push({ tipo: 'queima', dano: 1, turnos: 3 });
      comDados([DANO, 0.99, 0.99, 0.99, 0.99, 0.99], () => usarHabilidade('raio_gelido')); await termina(); ok(/Choque Térmico/.test(logTudo()));
    },
    'Berserker: Grito de Guerra + Golpe Poderoso ignora a defesa': async () => {
      heroi('guerreiro'); G.skills.push('grito_guerra'); ok(temSin('berserker')); G.en = 20; luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0, atk: 1 }); C.ps.buff = { pct: 0.35, turnos: 3 };
      comDados([DANO, 0.99, 0.5, 0.5, 0.5, 0.5], () => usarHabilidade('golpe_poderoso')); await termina(); ok(/Berserker/.test(logTudo()));
    },
    'Zen de Combate: os bônus de Foco e Postura duram 2 turnos a mais': async () => {
      heroi('guerreiro'); G.skills.push('foco_total', 'postura_defensiva'); ok(temSin('zen')); G.en = 20; luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0, atk: 1 }); usarHabilidade('foco_total'); await termina();
      ok(C.ps.mira && C.ps.mira.turnos >= 5, 'duração: ' + (C.ps.mira && C.ps.mira.turnos));
    },
    'Banquete e Segundo Fôlego: poções e Respirar Fundo curam mais': () => {
      heroi('guerreiro'); G.equip.arma = itemPorId('colher_pau'); G.equip.armadura = itemPorId('panela_pressao'); ok(temSin('banquete')); const max = stats(G).hpMax; G.hp = 1; G.cons.suco = 1; aplicaConsumivel('suco'); perto(G.hp, 1 + max * 0.4 * 1.25, 1);
    },
    'Escudo Ardente: com escudo ativo os golpes causam +25%': () => {
      heroi('mago'); G.skills.push('escudo_arcano'); ok(temSin('escudo_ardente')); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0 });
      C.ps.escudo = 0; const sem = golpe(15, 'int'); C.e.hp = 9999; C.ps.escudo = 50; const com = golpe(15, 'int'); ok(com >= sem * 1.2 && com <= sem * 1.3, `${sem} -> ${com}`);
    },
    'Fornalha Acesa: queimadura +50% (bola de fogo queima mais)': async () => {
      heroi('mago'); G.skills.push('meteoro'); ok(temSin('fornalha')); G.en = 30;
      const queima = async com => { heroi('mago'); if (com) G.skills.push('meteoro'); G.en = 30; luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0, atk: 1 }); comDados([DANO, 0.99, 0.5, 0.5, 0.5, 0.5, 0.5], () => usarHabilidade('bola_fogo')); await termina(); return (C.e.st.dots.find(d => d.tipo === 'queima') || { dano: 0 }).dano; };
      const sem = await queima(false), com = await queima(true); ok(com > sem, `queimadura ${sem} -> ${com}`);
    },
    'Clérigo: Luz Redentora cura o dobro, Santuário cria escudo, Martelo Ardente incendeia': async () => {
      heroi('clerigo'); G.skills.push('mao_curadora'); ok(temSin('redentora')); G.hp = 5; G.en = 30; luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0, atk: 1 });
      comDados([DANO, 0.99, 0.5, 0.5, 0.5, 0.5], () => usarHabilidade('luz_sagrada')); await termina(); ok(/Luz Redentora/.test(logTudo()), 'redentora');
      heroi('clerigo'); G.skills.push('mao_curadora', 'bencao_escudo'); G.hp = 5; G.en = 30; luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0, atk: 1 }); C.ps.escudo = 0; usarHabilidade('mao_curadora'); await termina(); ok(C.ps.escudo > 0, 'santuário');
      heroi('clerigo'); G.skills.push('martelada_santa', 'chama_varthos'); G.en = 30; luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0, atk: 1 });
      comDados([DANO, 0.99, 0.5, 0.5, 0.5, 0.5], () => usarHabilidade('martelada_santa')); await termina(); ok(/Martelo Ardente/.test(logTudo()), 'martelo');
    },
  });

  Testes.suite('Combate: modificadores de partida', {
    'Só Cura em Fogueira: poções de vida e habilidades de cura ficam bloqueadas': async () => {
      heroi('guerreiro', 1, { mods: ['sem_cura'] }); ok(consBloq('suco') && consBloq('pastel') && !consBloq('energetico'));
      G.hp = 5; const fx = criaFx(); fx.cura(30); igual(G.hp, 5, 'evento'); const fx2 = criaFx(); fx2.fogueira = true; fx2.cura(30); ok(G.hp > 5, 'a fogueira cura');
      G.hp = 5; ganhaXP(10000); igual(G.hp, 5, 'subir de nível não cura');
      heroi('clerigo', 1, { mods: ['sem_cura'] }); luta(INIMIGOS[0]); G.hp = 5; const g = G.hp; fimDoTurno(); igual(G.hp, g, 'regeneração do Clérigo bloqueada');
    },
    'Canhão de Vidro: você bate 50% mais forte e apanha 50% mais': () => {
      const dano = mods => { heroi('guerreiro', 5, { mods }); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0, atk: 10, atkB: 20 }); const d = golpe(15); G.hp = 9999; C.e.turno = 0; comDados([d20(15), 0.5], () => ataqueInimigo()); return [d, 9999 - G.hp]; };
      const [b, s] = dano([]), [bv, sv] = dano(['vidro']); ok(bv >= b * 1.4 && bv <= b * 1.6, `golpe ${b}->${bv}`); ok(sv >= s * 1.4 && sv <= s * 1.8, `dano sofrido ${s}->${sv}`);   // a defesa não é multiplicada, então o aumento passa um pouco de 50%
    },
    'Noite Sem Fim: inimigos causam 30% a mais': () => {
      const dano = mods => { heroi('guerreiro', 5, { mods }); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 10, atkB: 20 }); G.hp = 9999; comDados([d20(15), 0.5], () => ataqueInimigo()); return 9999 - G.hp; };
      const a = dano([]), b = dano(['pesadelo']); ok(b >= a * 1.2 && b <= a * 1.4, `${a} -> ${b}`);
    },
    'Armaduras Reforçadas: CA +2 e o dobro de ouro': () => {
      heroi('guerreiro', 5); const a = montaInimigo(INIMIGOS[0]); heroi('guerreiro', 5, { mods: ['ca_ouro'] }); const b = montaInimigo(INIMIGOS[0]); igual(b.ca - a.ca, 2); perto(b.ouro, a.ouro * 2, 1);
    },
    'Chefões Parrudos: +60% de vida; Invasão Gnômica: só gnomos': () => {
      heroi('guerreiro', 5); entrarSala({ tipo: 'chefe' }); const hp0 = C.e.hpMax; heroi('guerreiro', 5, { mods: ['chefes_gordos'] }); entrarSala({ tipo: 'chefe' }); perto(C.e.hpMax / hp0, 1.6, 0.02);
      heroi('guerreiro', 3, { mods: ['gnomos'] }); for (let i = 0; i < 20; i++) { entrarSala({ tipo: 'combate' }); ok(GNOMOS.some(g => g.nome === C.e.nome), 'não é gnomo: ' + C.e.nome); }
    },
    'Sovinas Fechadas: não há loja no mapa (e a loja repetida segue a regra normal)': () => { heroi('guerreiro', 6, { mods: ['sem_loja'] }); ok(!gerarMapa().linhas.flat().some(n => n.tipo === 'loja')); },
  });

  Testes.suite('Combate: companheiros', {
    'cada tipo de ação: ataque, sopro, escudo, cura': () => {
      const base = (id, andar = 4) => { heroi('guerreiro', andar); const fx = criaFx(); fx.aliado(id); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, def: 0, atk: 1 }); C.turno = 3; };
      base('caramelo'); const h = C.e.hp; comDados([d20(15), DANO, 0.5], () => turnoAliados()); ok(C.e.hp < h, 'ataque');
      base('dragaozinho'); C.turno = 3; comDados([0.5, 0.5], () => turnoAliados()); ok(C.e.st.dots.some(d => d.tipo === 'queima'), 'sopro a cada 3 turnos');
      base('genivaldo'); C.turno = 2; C.ps.escudo = 0; turnoAliados(); igual(C.ps.escudo, 0, 'escudo fora do turno'); C.turno = 3; turnoAliados(); ok(C.ps.escudo > 0, 'escudo a cada 3 turnos');
      base('zelia'); G.hp = 5; C.turno = 3; turnoAliados(); ok(G.hp > 5, 'cura');
    },
    'o inimigo pode mirar no companheiro, que desmaia e volta depois': () => {
      heroi('guerreiro', 4); const fx = criaFx(); fx.aliado('caramelo'); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 60, atkB: 30 }); const a = G.aliados[0]; G.hp = 500;
      comDados([0.1, d20(15), DANO, 0.5], () => ataqueInimigo()); igual(G.hp, 500, 'o herói não deveria apanhar'); igual(a.hp, 0, 'o companheiro desmaiou');
      fimCombateAliados(true); ok(a.hp === Math.round(hpMaxAliado(a) * 0.3) && a.vinculo === 0, 'volta com 30% e sem ganhar vínculo');
    },
    'o Aluno Fantasma atravessa 25% dos golpes': () => {
      heroi('guerreiro', 4); criaFx().aliado('camaradinha'); luta(INIMIGOS[0], {}, { hp: 9999, hpMax: 9999, ca: 5, atk: 60, atkB: 30 }); G.hp = 500; comDados([0.1, 0.5], () => ataqueInimigo()); igual(G.hp, 500); ok(/atravessa o golpe/.test(logTudo()));
    },
    'vínculo e nível: 3, 7, 12 e 18 vitórias; máximo nível 5': () => {
      heroi('guerreiro', 4); criaFx().aliado('gato'); const a = G.aliados[0]; for (let i = 0; i < 3; i++) fimCombateAliados(true); igual(a.nivel, 2);
      for (let i = 0; i < 4; i++) fimCombateAliados(true); igual(a.nivel, 3); for (let i = 0; i < 40; i++) fimCombateAliados(true); igual(a.nivel, 5);
    },
    'descansar na fogueira cura os companheiros por inteiro': () => {
      heroi('guerreiro', 4); criaFx().aliado('gato'); G.aliados[0].hp = 1; const fx = criaFx(); SALA_FOGUEIRA.escolhas[0].acao(fx); igual(G.aliados[0].hp, hpMaxAliado(G.aliados[0]));
    },
    'grupo cheio: o terceiro companheiro abre a tela de troca': () => {
      heroi('guerreiro', 4); const fx = criaFx(); fx.aliado('gato'); fx.aliado('caramelo'); igual(G.aliados.length, MAX_ALIADOS); igual(fx.aliado('zelia'), false); igual(G.fila.length, 1);
      G.fila.shift()(); igual(document.querySelectorAll('.card.troca').length, 2); document.querySelector('.card.troca').click(); igual(G.aliados.length, MAX_ALIADOS); ok(temAliado(G, 'zelia'));
    },
    'não aceita o mesmo companheiro duas vezes; Bando Unido com dois': () => {
      heroi('guerreiro', 4); const fx = criaFx(); fx.aliado('gato'); igual(fx.aliado('gato'), false); igual(G.aliados.length, 1); fx.aliado('caramelo'); ok(temSin('bando'));
    },
  });

  Testes.suite('Combate: fases dos chefões', {
    'cruzar 50% e 20% de vida troca de fase, com efeitos': () => {
      heroi('guerreiro', 5); luta(CHEFES[0], { boss: true }, {}); const e = C.e, atk0 = e.atk, hp = e.hpMax;
      e.hp = Math.floor(hp * 0.55); verificaFases(); igual(e.fase, 0); e.hp = Math.floor(hp * 0.49); verificaFases(); igual(e.fase, 1); ok(e.atk > atk0, 'a fase 2 aumenta o ataque');
      e.hp = Math.floor(hp * 0.19); verificaFases(); igual(e.fase, 2); ok(e.escudo > 0, 'a fase 3 dá escudo'); ok(document.querySelector('.fase-banner'), 'faixa da fase');
    },
    'o chefão ruge e perde a vez ao mudar de fase': () => { heroi('guerreiro', 5); luta(CHEFES[0], { boss: true }, {}); C.e.hp = Math.floor(C.e.hpMax * 0.4); verificaFases(); igual(C.e.st.atordoado, 1); },
    'morrer de uma vez não dá fase; cruzar dois limites entra nas duas': () => {
      heroi('guerreiro', 5); luta(CHEFES[0], { boss: true }, {}); C.e.hp = 0; verificaFases(); igual(C.e.fase, 0);
      luta(CHEFES[0], { boss: true }, {}); C.e.hp = Math.floor(C.e.hpMax * 0.1); verificaFases(); igual(C.e.fase, 2);
    },
    'o escudo do chefão absorve dano de golpes, queimadura, aliados e contra-ataque': () => {
      heroi('guerreiro', 5); luta(CHEFES[0], { boss: true }, {}); C.e.escudo = 20; const hp = C.e.hp; igual(danoNoInimigo(15), 0); igual(C.e.escudo, 5); igual(danoNoInimigo(15), 10); igual(C.e.hp, hp - 10);
    },
    'regeneração, aura e drenagem de energia funcionam': () => {
      heroi('guerreiro', 10); luta(CHEFES[1], { boss: true }, {}); const e = C.e; e.hp = Math.floor(e.hpMax * 0.4); verificaFases(); G.hp = 1000; fimDoTurno(); ok(G.hp < 1000, 'aura');
      e.hp = Math.floor(e.hpMax * 0.15); verificaFases(); G.en = 10; fimDoTurno(); ok(G.en <= 9, 'drena energia');
      heroi('guerreiro', 20); luta(CHEFES[3], { boss: true }, {}); const k = C.e; k.hp = Math.floor(k.hpMax * 0.45); verificaFases(); k.hp = Math.floor(k.hpMax * 0.45); const antes = k.hp; tickInimigo(); ok(k.hp > antes, 'regeneração');
    },
    'ataques duplos: o chefão ataca de novo no mesmo turno': async () => {
      heroi('guerreiro', 15); G.hp = 9999; luta(CHEFES[2], { boss: true }, {}); C.e.golpes = 2; C.e.atk = 1; C.e.atkB = 0; acaoAtacar(); await termina(); ok(/ataca de novo/.test(logTudo()), 'segundo golpe');
    },
    'uma partida contra cada chefão passa por todas as fases sem erro': () => {
      for (let i = 0; i < CHEFES.length; i++) { heroi('guerreiro', (i + 1) * 5); luta(CHEFES[i], { boss: true }, {}); C.e.hp = 1; verificaFases(); igual(C.e.fase, CHEFES[i].fases.length, CHEFES[i].nome); }
    },
  });
})();
