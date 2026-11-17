'use strict';
/* TESTES DE DADOS — conferem se as listas do jogo (classes, itens, eventos…) estão coerentes.
   Estes são os testes que mais ajudam os alunos: criaram um item com id repetido? Um evento sem texto? Aparece aqui! */

/* Ajudantes compartilhados por todos os arquivos de teste */
Testes.heroi = (classe = 'guerreiro', andar = 1, opc = {}, attr = {}) => {
  novaRun('Teste', classe, { ...CLASSES[classe].base, ...attr }, opc); G.andar = andar;
  const st = stats(G); G.hp = st.hpMax; G.en = st.enMax; return G;
};
/** Começa uma luta contra "def" com um inimigo que aguenta muito (para testar sem a luta acabar). */
Testes.luta = (def = INIMIGOS[0], o = {}, ajuste = { hp: 99999, hpMax: 99999, ca: 5, atk: 1 }) => {
  iniciarCombate({ ...def }, o); Object.assign(C.e, ajuste); return C;
};
Testes.todasAsClasses = Object.keys(CLASSES);

(() => {
  const { ok, igual } = Testes;
  const unicos = (lista, nome) => { const vistos = new Set(); for (const x of lista) { if (vistos.has(x)) throw new Error(`${nome} repetido: ${x}`); vistos.add(x); } };

  Testes.suite('Dados: classes, habilidades e itens', {
    'toda classe está completa e soma 20 pontos de atributo': () => {
      for (const [id, c] of Object.entries(CLASSES)) {
        ok(c.nome && c.icone && c.cor && c.desc, `${id}: faltam campos`);
        igual(Object.values(c.base).reduce((a, b) => a + b, 0), 20, `${id}: soma dos atributos`);
        ok(ATRIBUTOS[c.principal], `${id}: atributo principal inválido`);
        ok(ITENS.some(i => i.id === c.arma && i.slot === 'arma' && i.classe === id), `${id}: arma inicial inexistente ou de outra classe`);
        ok(HABILIDADES[c.habilidade] && HABILIDADES[c.habilidade].tipo === 'ativa' && HABILIDADES[c.habilidade].classe === id, `${id}: habilidade inicial inválida`);
        ok(c.passiva && c.passiva.nome && c.passiva.mods, `${id}: passiva`);
        ok(Array.isArray(c.foco) && c.foco.length >= 2 && c.foco.every(k => ATRIBUTOS[k]) && c.dica && c.dica.length > 30, `${id}: faltam o guia de atributos (foco e dica) para iniciantes`);
        ok(c.foco.includes(c.principal) || id === 'barbaro', `${id}: o atributo principal deveria estar entre os importantes`);
      }
    },
    'habilidades: tipo, custo, escala e classe válidos': () => {
      for (const [id, h] of Object.entries(HABILIDADES)) {
        ok(h.nome && h.icone && h.desc, `${id}: faltam campos`);
        ok(h.tipo === 'ativa' || h.tipo === 'passiva', `${id}: tipo`);
        if (h.classe) ok(CLASSES[h.classe], `${id}: classe inexistente ${h.classe}`);
        if (h.tipo === 'ativa') ok(typeof h.custo === 'number' && h.custo >= 0, `${id}: custo`);
        if (h.tipo === 'passiva') ok(h.mods && Object.keys(h.mods).length, `${id}: passiva sem mods`);
        if (h.escala) ok(ATRIBUTOS[h.escala], `${id}: escala inválida`);
        if (h.mult) ok(h.escala, `${id}: tem dano mas não tem escala`);
      }
    },
    'cada classe tem habilidades próprias suficientes para as cartas de nível': () => {
      for (const id of Object.keys(CLASSES)) {
        const proprias = Object.values(HABILIDADES).filter(h => h.classe === id);
        ok(proprias.filter(h => h.tipo === 'ativa').length >= 3, `${id}: poucas ativas`);
        ok(proprias.filter(h => h.tipo === 'passiva').length >= 1, `${id}: sem passiva própria`);
      }
    },
    'itens: ids únicos, campos e raridades certos': () => {
      unicos(ITENS.filter(i => !i.custom).map(i => i.id), 'id de item');
      for (const i of ITENS.filter(x => !x.custom)) {
        ok(i.nome && i.flavor, `${i.id}: faltam textos`);
        ok(['arma', 'armadura', 'amuleto'].includes(i.slot), `${i.id}: slot`);
        ok(Number.isInteger(i.raridade) && i.raridade >= 0 && i.raridade < RARIDADES.length, `${i.id}: raridade`);
        if (i.slot === 'arma') ok(i.atk > 0 && CLASSES[i.classe], `${i.id}: arma precisa de atk e classe válida`);
        if (i.slot === 'armadura') ok(i.def > 0, `${i.id}: armadura sem def`);
        if (i.slot === 'amuleto') ok(!i.atk && !i.def, `${i.id}: amuleto não tem atk/def`);
      }
    },
    'cada classe tem arma de todas as raridades (nenhum drop impossível)': () => {
      for (const id of Object.keys(CLASSES)) for (let r = 0; r < RARIDADES.length; r++) ok(ITENS.some(i => i.slot === 'arma' && i.classe === id && i.raridade === r), `${id}: sem arma de raridade ${r}`);
    },
    'todo slot tem item em toda raridade (para o sorteio nunca cair num buraco)': () => {
      for (const sl of ['armadura', 'amuleto']) for (let r = 0; r < RARIDADES.length; r++) ok(ITENS.some(i => i.slot === sl && i.raridade === r), `${sl} sem raridade ${r}`);
    },
    'consumíveis: preço e efeito': () => {
      for (const [id, c] of Object.entries(CONSUMIVEIS)) ok(c.nome && c.icone && c.preco > 0 && (c.hpPct || c.en), `${id}: inválido`);
    },
  });

  Testes.suite('Dados: inimigos, chefões e zonas', {
    'inimigos comuns: campos e multiplicadores': () => {
      for (const e of INIMIGOS.filter(x => !x.custom)) {
        ok(e.nome && e.icone, `${e.nome}: faltam campos`);
        ok(e.min >= 1 && e.min <= 9, `${e.nome}: min`);
        for (const k of ['hp', 'atk', 'def', 'xp', 'ouro']) ok(e[k] > 0 && e[k] < 5, `${e.nome}: ${k}`);
        ok(!e.traco || ['veneno', 'rouba_ouro', 'rouba_vida', 'esquiva'].includes(e.traco), `${e.nome}: traço desconhecido`);
      }
      ok(INIMIGOS.some(e => e.min === 1), 'precisa de inimigos para o andar 1');
    },
    'gnomos (modificador Invasão Gnômica) têm o mesmo formato': () => { for (const g of GNOMOS) ok(g.nome && g.icone && g.hp && g.atk && g.def, g.nome); },
    'chefões: 6, fases em ordem decrescente de vida, com título e fala': () => {
      igual(CHEFES.length, 6); igual(FINAL_ANDAR, 30);
      for (const c of CHEFES) {
        ok(c.nome && c.icone && c.especial && c.especial.cada >= 2, `${c.nome}: campos`);
        ok(c.fases && c.fases.length >= 2, `${c.nome}: precisa de fases`);
        let ant = 1;
        for (const f of c.fases) { ok(f.hp > 0 && f.hp < ant, `${c.nome}: ordem das fases`); ant = f.hp; ok(f.titulo && f.fala, `${c.nome}: fase sem título/fala`); }
        ok(c.fases.some(f => f.matk || f.caBonus || f.especial || f.golpes || f.escudo || f.regen || f.aura || f.drenaEn || f.cura), `${c.nome}: fases sem nenhum efeito`);
      }
    },
    'zonas e cenários: 5 zonas, 1 cenário por zona + menu': () => {
      igual(ZONAS.length, 5);
      for (let i = 0; i < 5; i++) ok(typeof CENARIOS['z' + i] === 'function', `falta cenário z${i}`);
      ok(typeof CENARIOS.titulo === 'function', 'falta o cenário do menu');
      for (const k of Object.keys(CENARIOS)) ok(CENARIOS[k]().includes('<rect'), `${k}: SVG vazio`);
    },
    'tipos de sala e nomes de porta': () => {
      for (const t of ['combate', 'elite', 'evento', 'loja', 'fogueira', 'tesouro', 'chefe']) ok(TIPOS_SALA[t] && TIPOS_SALA[t].icone && TIPOS_SALA[t].nome && TIPOS_SALA[t].dica, `TIPOS_SALA.${t}`);
      ok(NOMES_PORTAS.length >= 8 && NOMES_HEROIS.length >= 8 && EPITAFIOS.length >= 5, 'listas de nomes pequenas demais');
    },
    'quiz de Python: pergunta, 4 opções e uma resposta certa válida': () => {
      ok(QUIZ.length >= 10, 'poucas perguntas');
      for (const q of QUIZ) { ok(q.p && q.o.length === 4 && q.c >= 0 && q.c < 4, q.p); ok(new Set(q.o).size === 4, 'opções repetidas: ' + q.p); }
    },
  });

  Testes.suite('Dados: eventos', {
    'ids únicos e campos obrigatórios': () => {
      unicos(EVENTOS.map(e => e.id), 'id de evento');
      for (const e of EVENTOS) {
        ok(e.titulo && e.icone, `${e.id}: título/ícone`);
        ok(e.peso > 0, `${e.id}: peso`);
        if (e.montar) ok(typeof e.montar === 'function', `${e.id}: montar`);
        else { ok(e.texto, `${e.id}: texto`); ok(e.escolhas && e.escolhas.length >= 1, `${e.id}: escolhas`); for (const c of e.escolhas) ok(c.texto && typeof c.acao === 'function', `${e.id}: escolha inválida`); }
      }
    },
    'a Revisão de Código: 12+ bugs, cada um com 1 certa e 2 erradas diferentes': () => {
      ok(BUGS.length >= 10, 'poucos bugs');
      for (const b of BUGS) { ok(b.codigo && b.dica && b.certo && b.errados.length === 2, 'bug incompleto'); ok(new Set([b.certo, ...b.errados]).size === 3, 'opções repetidas em: ' + b.codigo.slice(0, 30)); }
    },
    'eventos únicos e em cadeia usam flags que alguém liga': () => {
      const fontes = EVENTOS.map(e => (e.escolhas || []).map(c => String(c.acao)).join(' ')).join(' ');
      for (const f of ['carta', 'cartaFeita', 'pizzaAmigo', 'pizzaRoubada', 'pizzaPago', 'gnomoPago']) ok(fontes.includes(`'${f}'`), `ninguém liga a flag ${f}`);
    },
    'os 5 eventos de zona só existem na zona certa': () => {
      const zon = { cogumelos_cantores: 0, karaoke_esqueletos: 1, arvore_cotovelo: 2, churrasqueiro_eterno: 3, roteador_perdido: 4 };
      for (const [id, z] of Object.entries(zon)) { const e = EVENTOS.find(x => x.id === id); ok(e, 'falta ' + id); for (let a = 1; a <= 25; a++) { Testes.heroi('guerreiro', a); igual(!!e.cond(G), Math.floor((a - 1) / 5) === z, `${id} no andar ${a}`); } }
    },
  });

  Testes.suite('Dados: sinergias, companheiros, conquistas e modificadores', {
    'etiquetas (tags) apontam para itens e habilidades que existem': () => {
      for (const id of Object.keys(TAGS_ITEM)) { if (!id.startsWith('c_')) ok(ITENS.some(i => i.id === id), `TAGS_ITEM: item inexistente ${id}`); TAGS_ITEM[id].forEach(t => ok(TAGS[t], `tag inexistente ${t}`)); }
      for (const id of Object.keys(TAGS_HAB)) { ok(HABILIDADES[id], `TAGS_HAB: habilidade inexistente ${id}`); TAGS_HAB[id].forEach(t => ok(TAGS[t], `tag inexistente ${t}`)); }
    },
    'sinergias: ids únicos, requisitos e bônus válidos': () => {
      unicos(SINERGIAS.map(s => s.id), 'id de sinergia');
      for (const s of SINERGIAS) {
        ok(s.nome && s.icone && s.desc, `${s.id}: textos`);
        ok(s.mods || s.flag, `${s.id}: sem efeito algum`);
        if (s.req.tag) ok(TAGS[s.req.tag] && s.req.n >= 2, `${s.id}: tag/quantidade`);
        else if (s.req.skills) s.req.skills.forEach(h => ok(HABILIDADES[h], `${s.id}: habilidade inexistente ${h}`));
        else ok(s.req.aliados >= 2, `${s.id}: requisito desconhecido`);
      }
    },
    'ninguém começa com sinergia ativa': () => {
      for (const c of Testes.todasAsClasses) { Testes.heroi(c); igual(sinergiasAtivas(G).length, 0, `${c} já começa com sinergia`); }
    },
    'companheiros: ações conhecidas e etiquetas válidas': () => {
      const acoes = ['ataque', 'sopro', 'escudo', 'cura', 'protege'];
      for (const [id, a] of Object.entries(ALIADOS)) { ok(a.nome && a.icone && a.desc && a.verbo && a.mods && a.hp > 0, `${id}: campos`); ok(acoes.includes(a.acao.tipo), `${id}: ação desconhecida ${a.acao.tipo}`); (a.tags || []).forEach(t => ok(TAGS[t], `${id}: tag ${t}`)); }
    },
    'conquistas: ids únicos, função de teste e raridade': () => {
      unicos(CONQUISTAS.map(c => c.id), 'id de conquista');
      for (const c of CONQUISTAS) ok(c.nome && c.icone && c.titulo && c.desc && typeof c.teste === 'function' && c.rar >= 1 && c.rar <= 3, `${c.id}: inválida`);
    },
    'modificadores: bônus positivo e todos têm efeito no código': async () => {
      const fonte = await Testes.fonteDoJogo();
      for (const [id, m] of Object.entries(MODIFICADORES)) { ok(m.nome && m.icone && m.desc && m.bonus > 0 && m.bonus < 1, `${id}: campos`); ok(fonte.includes(`'${id}'`) && /temMod\(|includes\('/.test(fonte), `${id}: nenhum código usa este modificador`); }
    },
    'toda flag de sinergia é conferida em algum lugar do código': async () => {
      const fonte = await Testes.fonteDoJogo();
      for (const s of SINERGIAS.filter(x => x.flag)) ok(fonte.includes(`temSin('${s.flag}')`), `sinergia ${s.id}: flag "${s.flag}" nunca é usada em temSin()`);
    },
    'toda fala de aliado dos eventos aponta para um companheiro existente': async () => {
      const fonte = await Testes.fonteDoJogo();
      for (const m of fonte.matchAll(/fx\.aliado\('([a-z_]+)'\)/g)) ok(ALIADOS[m[1]], `fx.aliado('${m[1]}') não existe em ALIADOS`);
    },
    'músicas: escala, progressão de 4 acordes e baixo de 16 passos': () => {
      for (const k of ['titulo', 'z0', 'z1', 'z2', 'z3', 'z4', 'fim']) ok(MUSICAS[k], 'falta música ' + k);
      for (const [k, m] of Object.entries(MUSICAS)) { ok(ESCALAS[m.escala], `${k}: escala`); igual(m.prog.length, 4, `${k}: prog`); igual(m.baixo.pad.length, 16, `${k}: baixo`); ok(m.bpm >= 40 && m.bpm <= 160, `${k}: bpm`); }
    },
  });
})();
