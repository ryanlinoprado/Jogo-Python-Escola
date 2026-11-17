'use strict';
/* =========================================================================
   OS DEUSES DE ARATHA  —  eventos divinos e outros eventos extras
   Cada deus pode conceder UMA bênção por aventura (fica na Ficha do herói).
   Novos efeitos usados aqui (definidos em salas.js):
     fx.bencao(id, mods, descricao)   fx.karma(n)   fx.cartaExtra()
   ========================================================================= */

const DEUSES = {
  lysara:   { nome: 'Lysara',    titulo: 'deusa da sorte',                  icone: '🍀' },
  nythria:  { nome: 'Nythria',   titulo: 'deusa dos sonhos e da noite',     icone: '🌙' },
  varthos:  { nome: 'Varthos',   titulo: 'deus das chamas e da renovação',  icone: '🔥' },
  arathor:  { nome: 'Arathor',   titulo: 'deus do sol',                     icone: '☀️' },
  aurikesh: { nome: 'Aurikesh',  titulo: 'deus da riqueza',                 icone: '💰' },
  serathis: { nome: 'Serathis',  titulo: 'deusa da justiça',                icone: '⚖️' },
  zyphera:  { nome: 'Zyphera',   titulo: 'deusa da magia caótica',          icone: '🌀' },
  aionvehr: { nome: 'Aion-vehr', titulo: 'deus da magia e do conhecimento', icone: '📜' },
  caramelo: { nome: 'Caramelo',  titulo: 'vira-lata guardião',              icone: '🐕' }, // não é deus, mas merece
};

const chefeDoAndar = a => CHEFES[(a / 5 - 1) % CHEFES.length];
const proxChefeAndar = () => Math.ceil(G.andar / 5) * 5;
const FINAL_ANDAR = CHEFES.length * 5;

/* ---------- NYTHRIA: o sonho que acontece ao dormir ----------
   É chamado quando o herói descansa (fogueira / acampamento). Cada sonho
   mostra uma visão mais profunda do fim da campanha. */
function sonhoNythria() {
  const n = G.flags.visoes || 0;
  const andarBoss = proxChefeAndar(), boss = chefeDoAndar(andarBoss), final = CHEFES[CHEFES.length - 1];
  const VISOES_EXTRAS = [
    'Uma porta vermelha sangra luz. Atrás dela, um baú dá risada de você. Depois, só escuridão.',
    'Você se vê atravessando um corredor de espelhos. Em um deles, seu reflexo segura um item lendário… e pisca.',
    'Um dragão boceja no escuro, vira de lado e murmura: “mais cinco minutinhos de sono”.',
    'Uma enorme balança, uma chama azul, um sol e uma moeda giram juntos como um relógio. Algo está para acontecer.',
  ];
  let visao;
  if (n === 0) {
    visao = `Você vê um portão gigante no <b>andar ${andarBoss}</b>. Atrás dele espera <b>${boss.icone} ${boss.nome}</b>. Ele usa <b>${boss.especial.nome}</b> a cada ${boss.especial.cada} turnos — prepare-se para esse golpe!`;
  } else if (n === 1) {
    visao = `A névoa muda de cor. Muito além, no <b>andar ${FINAL_ANDAR}</b>, uma serpente imensa feita de linhas de código, <b>${final.icone} ${final.nome}</b>, guarda uma porta dourada. Atrás dela não há descanso, mas um espelho: o ciclo recomeça, mais forte e mais difícil.`;
  } else if (n === 2) {
    visao = 'Você flutua sobre um salão imenso. Num quadro de ouro, nomes de aventureiros brilham, um abaixo do outro: o <b>Ranking</b>. Há um espaço vazio ao lado do nome de quem chegou mais longe, e uma voz diz: <i>“O fim da campanha não é a morte, é ser lembrado. Quem vai mais longe inspira quem vem depois.”</i>';
  } else {
    visao = pick(VISOES_EXTRAS);
  }
  return {
    titulo: 'Sonho com Nythria', icone: '🌙',
    texto: `Seu sono é profundo. Uma névoa prateada te envolve e uma mulher feita de céu estrelado sorri: <i>“Sou Nythria, senhora dos sonhos e da noite. Deixe-me mostrar o que a escuridão esconde…”</i><div class="visao">${visao}</div>`,
    escolhas: [
      { texto: '👁️ Aceitar a visão', acao: fx => {
        fx.flag('visoes', n + 1); fx.xp(15 + G.andar * 2);
        fx.bencao('nythria', { esq: 5, en: 4 }, '+5% esquiva e +4 energia máxima');
        return 'Nythria assente e desaparece como névoa. Você acorda lembrando de tudo.';
      } },
      { texto: '🌙 Pedir para ver mais', dica: 'Teste de Inteligência — pode virar pesadelo', acao: fx => {
        fx.flag('visoes', n + 1);
        if (fx.teste('int', 12)) { fx.attr('int', 1); fx.xp(25 + G.andar * 2); return 'Você mergulha mais fundo no sonho e aprende segredos que a maioria nunca vê.'; }
        fx.combate({ nome: 'Pesadelo Ambulante', icone: '😱', hp: 1.3, atk: 1.2, def: 1, xp: 1.8, ouro: 1, falas: ['Você esqueceu de estudar para a prova! HAHAHA!'] });
        return 'A névoa fica escura e o sonho vira pesadelo. Algo vem atrás de você!';
      } },
      { texto: '⏰ Acordar de repente', acao: fx => { fx.energia(4); return 'Você acorda suando frio. A visão se desfaz como fumaça, mas o sono foi bom.'; } },
    ],
  };
}

/* ---------- Eventos divinos e extras ---------- */
const EVENTOS_NOVOS = [
  /* ===== LYSARA: deusa da sorte ===== */
  {
    id: 'lysara_moeda', titulo: 'A Moeda de Lysara', icone: '🪙', peso: 7, unico: true,
    texto: 'Uma moeda dourada gira no ar sem cair. Uma voz risonha: <i>“Eu sou Lysara, deusa da sorte! Quer jogar? Cara ou coroa… quem sabe hoje não é seu dia?”</i>',
    escolhas: [
      { texto: '🙂 Escolher cara', dica: 'A sorte ajuda', acao: fx => lysaraMoeda(fx) },
      { texto: '👑 Escolher coroa', dica: 'A sorte ajuda', acao: fx => lysaraMoeda(fx) },
      { texto: '🎁 Pedir para guardar a moeda', dica: 'Um amuleto contra a morte?', acao: fx => {
        if (fx.teste('sor', 13)) { fx.flag('moedaLysara'); fx.linha('🍀 Lysara te salvará uma vez da morte!', 'raro'); return 'Lysara ri: “Gostei da sua ousadia!” A moeda esquenta no seu bolso. Ela vai te salvar quando você mais precisar… uma vez só.'; }
        return 'A moeda vira poeira dourada nos seus dedos. “Quem sabe da próxima!”, ri a deusa.';
      } },
    ],
  },

  /* ===== VARTHOS: deus das chamas e da renovação ===== */
  {
    id: 'varthos', titulo: 'Chamas Sagradas de Varthos', icone: '🔥', peso: 6, unico: true,
    texto: 'Uma fogueira azul e laranja arde sozinha num círculo de cinzas. Uma voz crepitante: <i>“Eu sou Varthos, senhor das chamas e da renovação. Tudo o que queima… renasce.”</i>',
    escolhas: [
      { texto: '🔥 Atravessar as chamas', dica: 'Teste de Vitalidade — dói, mas renova', acao: fx => {
        if (fx.teste('vit', 10)) {
          fx.curaPct(0.6); fx.energia(99);
          fx.bencao('varthos', { hp: 15, for: 1 }, '+15 vida máxima e +1 Força');
          return 'Você atravessa o fogo sem gritar. Quando sai do outro lado, está renovado, como se tivesse nascido de novo.';
        }
        fx.dano(14, 'Torrado pelas chamas de Varthos'); fx.attr('vit', 1);
        return 'Você sai chamuscado, com a sobrancelha pegando fogo. Dói muito, mas o corpo se fortalece.';
      } },
      { texto: '🪙 Oferecer 40 de ouro às chamas', req: p => p.ouro >= 40, reqTxt: 'precisa de 40 ouro', acao: fx => {
        fx.ouro(-40); fx.curaPct(1); fx.energia(99);
        fx.bencao('varthos', { hp: 15, for: 1 }, '+15 vida máxima e +1 Força');
        return 'O ouro derrete em gotas brilhantes. Varthos aceita a oferenda e te envolve em um calor acolhedor. Você renasce por inteiro.';
      } },
      { texto: '🧯 Apagar com a água do cantil', acao: fx => {
        fx.attr('sor', -1); fx.dano(5, 'Chamuscado por um deus ofendido');
        return 'A chama silva, tosse e te lança um olhar furioso. “Quem apaga o fogo de um deus…” A voz some, mas o azar fica.';
      } },
    ],
  },

  /* ===== ARATHOR: deus do sol ===== */
  {
    id: 'arathor', titulo: 'Templo do Sol de Arathor', icone: '☀️', peso: 6, unico: true, cond: p => p.andar >= 2,
    texto: 'Por uma rachadura no teto, um feixe de luz dourada ilumina um altar de pedra branca. Uma voz calorosa: <i>“Sou Arathor, o Sol. Nenhuma sombra me escapa e nenhum aventureiro cansado passa despercebido.”</i>',
    escolhas: [
      { texto: '🙏 Rezar sob a luz', acao: fx => {
        fx.curaPct(0.5); fx.inspirar(0.2, 2);
        fx.bencao('arathor', { def: 2, vit: 1 }, '+2 defesa e +1 Vitalidade');
        return 'O calor do sol alcança seus ossos. Você se sente leve, forte e (por alguns minutos) bronzeado.';
      } },
      { texto: '⚔️ Desafiar o Arauto do Sol', dica: 'Combate difícil, recompensa maior', acao: fx => {
        fx.combate({ nome: 'Arauto do Sol Seu Raimundo', icone: '🌞', hp: 2.2, atk: 1.4, def: 1.3, xp: 3.5, ouro: 3.5, falas: ['Meu protetor solar é FPS 1000!'] });
        return 'Um guerreiro de armadura dourada desce do raio de luz: “Mostre que merece a bênção de Arathor!”';
      } },
      { texto: '🕶️ Cobrir os olhos e passar', dica: 'Teste de Destreza', acao: fx => {
        if (fx.teste('des', 10)) { fx.xp(10 + G.andar * 2); return 'Você passa pelo templo com os olhos fechados e com ótima direção. Arathor ri e te dá um pouco de energia.'; }
        fx.dano(5, 'Cegado pelo sol de Arathor'); return 'Você tropeça no degrau e cai de cara no altar. O sol brilhou mais forte só de sacanagem.';
      } },
    ],
  },

  /* ===== AURIKESH: deus da riqueza ===== */
  {
    id: 'aurikesh', titulo: 'Cofre Dourado de Aurikesh', icone: '💰', peso: 6, unico: true, cond: p => p.andar >= 2,
    texto: 'Uma sala inteira de ouro maciço. No meio, uma balança de moedas e uma voz melosa: <i>“Aurikesh, deus da riqueza, recebe você! Aqui tudo tem preço… e todo preço rende juros.”</i>',
    escolhas: [
      { texto: '📈 Investir 50 de ouro', dica: 'Teste de Sorte', req: p => p.ouro >= 50, reqTxt: 'precisa de 50 ouro', acao: fx => {
        fx.ouro(-50);
        if (fx.teste('sor', 10)) {
          fx.ouro(140); fx.bencao('aurikesh', { ouro: 0.3 }, '+30% de ouro dos combates');
          return 'O mercado sobe! Aurikesh bate palmas e devolve seu investimento com juros altos. “Gosto de gente que sabe apostar!”';
        }
        return 'O mercado cai. “Eu avisei que havia riscos…”, sorri Aurikesh, contando o seu dinheiro.';
      } },
      { texto: '🤑 Pegar um punhado de moedas', dica: 'Nada é de graça', acao: fx => {
        fx.ouro(rnd(60, 90) + G.andar * 4); fx.hpMax(-8);
        return 'Você enche os bolsos, mas as moedas pesam mais do que deveriam. Aurikesh sorri: “Ganância sempre cobra a conta.”';
      } },
      { texto: '📝 Pedir um empréstimo', dica: 'Recebe 100 agora… e paga depois', acao: fx => {
        fx.ouro(100); fx.flag('divida'); fx.flag('dividaAndar', G.andar);
        return 'Você assina com letra miúda (que não leu). “Obrigado pela preferência”, diz Aurikesh. “Um cobrador vai passar para te visitar.”';
      } },
    ],
  },
  {
    id: 'cobrador', titulo: 'O Cobrador de Aurikesh', icone: '💼', peso: 60, unico: true,
    cond: p => p.flags.divida && p.andar >= (p.flags.dividaAndar || 0) + 3,
    texto: 'Um homem de terno dourado e prancheta surge do nada: <i>“Boa tarde! Aurikesh lembra do empréstimo de 100 de ouro. Com juros, são 130. Podemos parcelar em 1x.”</i>',
    escolhas: [
      { texto: '💸 Pagar 130 de ouro', req: p => p.ouro >= 130, reqTxt: 'precisa de 130 ouro', acao: fx => {
        fx.flag('divida', false); fx.ouro(-130); fx.karma(1);
        fx.bencao('aurikesh', { ouro: 0.3 }, '+30% de ouro dos combates');
        return 'O cobrador confere duas vezes, emite um recibo e chora de emoção. “Cliente exemplar!” Aurikesh te abençoa.';
      } },
      { texto: '🫳 Pagar o que tiver no bolso', acao: fx => {
        const v = G.ouro; fx.flag('divida', false); fx.ouro(-v); fx.dano(6, 'Espancado por um cobrador de terno');
        return 'O cobrador conta o que você tem, suspira, e te dá um tapa com a prancheta. “Considere a dívida… negociada.”';
      } },
      { texto: '⚔️ Recusar e lutar', acao: fx => {
        fx.flag('divida', false); fx.karma(-1);
        fx.combate({ nome: 'Cobrador de Aurikesh', icone: '💼', hp: 1.7, atk: 1.3, def: 1.3, xp: 2.2, ouro: 3, falas: ['Isso vai para o seu SPC… e pro seu inferno!'] });
        return 'O cobrador abre a maleta e tira dela uma calculadora. Que é também uma arma.';
      } },
    ],
  },

  /* ===== SERATHIS: deusa da justiça (usa o karma do herói) ===== */
  {
    id: 'serathis', titulo: 'Tribunal de Serathis', icone: '⚖️', peso: 7, unico: true, cond: p => p.andar >= 2,
    montar: p => {
      const k = p.flags.karma || 0;
      const sinal = k > 0 ? 'A balança pende para o lado da <b>luz</b>.' : k < 0 ? 'A balança pende para o lado das <b>sombras</b>.' : 'A balança permanece em <b>equilíbrio</b>.';
      return {
        titulo: 'Tribunal de Serathis', icone: '⚖️',
        texto: `Uma sala de bancos de pedra e uma balança gigante. Uma mulher de olhos vendados desce do estrado: <i>“Sou Serathis, deusa da justiça. Cada ato seu foi pesado. Vamos ver o que a balança diz…”</i><div class="visao">${sinal}</div>`,
        escolhas: [
          { texto: '⚖️ Aceitar o julgamento', dica: 'Suas ações decidem', acao: fx => {
            if (k > 0) { fx.curaPct(0.3); fx.item({ bonus: 0.3, min: 1 }); fx.bencao('serathis', { def: 2, sor: 1 }, '+2 defesa e +1 Sorte'); return 'Serathis bate o martelo: “Inocente! E digno de elogio.” Uma recompensa e a bênção da justiça.'; }
            if (k < 0) { fx.ouro(-Math.min(G.ouro, 40)); fx.attr('sor', -1); fx.dano(8, 'Condenado pelo Tribunal de Serathis'); return 'Serathis bate o martelo: “Culpado!” A multa é paga, o azar é entregue e o martelo atinge seu dedão.'; }
            fx.xp(20 + G.andar * 2); return '“Nem culpado, nem inocente: apenas humano”, sentencia Serathis. Ela libera você com um aviso sobre manter o equilíbrio.';
          } },
          { texto: '🗣️ Defender-se', dica: 'Teste de Inteligência', acao: fx => {
            if (fx.teste('int', 13)) { fx.xp(25 + G.andar * 2); if (k < 0) fx.karma(1); return 'Seus argumentos são tão bons que até a balança hesita. Serathis anota: “Um réu eloquente.”'; }
            fx.dano(6, 'Desacato ao Tribunal de Serathis'); return 'Você se enrola, gagueja e ainda xinga o martelo. Serathis aplica uma pena de “cala a boca”, literalmente.';
          } },
          { texto: '💰 Subornar o juiz (30 ouro)', dica: 'Péssima ideia', req: p => p.ouro >= 30, reqTxt: 'precisa de 30 ouro', acao: fx => {
            fx.ouro(-30); fx.karma(-2); fx.dano(8, 'Multado por Serathis');
            return 'O silêncio é de gelar. “Tentativa de suborno.” Serathis te multa, fica com o ouro e deixa a balança bem mais pesada para o lado das sombras.';
          } },
        ],
      };
    },
  },

  /* ===== ZYPHERA: deusa da magia caótica ===== */
  {
    id: 'zyphera', titulo: 'A Fenda de Zyphera', icone: '🌀', peso: 6, unico: true, cond: p => p.andar >= 3,
    texto: 'O ar vibra e se rasga como papel. Cores que não existem dançam à sua frente. Uma risada de mil vozes: <i>“Zyphera, a magia caótica, cumprimenta você! Tudo pode acontecer… e vai!”</i>',
    escolhas: [
      { texto: '🎲 Tocar na fenda', dica: 'Qualquer coisa pode acontecer', acao: fx => pick(CAOS_ZYPHERA)(fx) },
      { texto: '🪙 Jogar 20 de ouro na fenda', req: p => p.ouro >= 20, reqTxt: 'precisa de 20 ouro', acao: fx => {
        fx.ouro(-20); fx.bencao('zyphera', { int: 2, crit: 6, hp: -8 }, '+2 Inteligência, +6% crítico, −8 vida máx.');
        return 'A fenda engole a moeda e devolve uma risada. Zyphera te marca com uma runa torta no braço. Poder, mas com efeito colateral.';
      } },
      { texto: '🧐 Observar de longe', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 12)) { fx.xp(25 + G.andar * 3); return 'Você anota o padrão do caos e descobre que, no fundo, ele tem um padrão. Isso é muito estranho e muito útil.'; }
        fx.dano(5, 'Atingido por uma faísca caótica'); return 'Uma faísca arroxeada escapa da fenda e queima seu cabelo. Você agora tem um penteado novo.';
      } },
    ],
  },

  /* ===== AION-VEHR: deus da magia e do conhecimento ===== */
  {
    id: 'aionvehr', titulo: 'O Guardião do Saber de Aion-vehr', icone: '📜', peso: 7, unico: true, cond: p => p.andar >= 2,
    montar: p => {
      const q = pick(QUIZ), certo = q.o[q.c];
      const errados = shuffle(q.o.filter((_, i) => i !== q.c)).slice(0, 2);
      const ops = shuffle([{ t: certo, ok: true }, ...errados.map(t => ({ t, ok: false }))]);
      return {
        titulo: 'O Guardião do Saber de Aion-vehr', icone: '📜',
        texto: `Pergaminhos luminosos flutuam em uma biblioteca sem teto. Um olho gigante se abre: <i>“Sou Aion-vehr, senhor da magia e do conhecimento. O saber é o verdadeiro poder. Responda corretamente e eu te darei uma nova habilidade.”</i><div class="quiz">${q.p}</div>`,
        escolhas: [
          ...ops.map(o => ({
            texto: o.t,
            acao: fx => {
              if (o.ok) {
                fx.cartaExtra(); fx.bencao('aionvehr', { int: 2, en: 6 }, '+2 Inteligência e +6 energia máxima');
                return '✅ Correto! Os pergaminhos giram em festa. Aion-vehr sussurra: “O conhecimento foi bem aproveitado.” Você ganha uma escolha extra de habilidade.';
              }
              fx.dano(6, 'Humilhado por Aion-vehr');
              return `❌ Errado. A resposta certa era <b>${certo}</b>. Aion-vehr suspira: “Volte quando tiver estudado.” Um pergaminho te acerta na cabeça.`;
            },
          })),
          { texto: '🙇 Admitir que não sabe', dica: 'Honestidade também é sabedoria', acao: fx => { fx.xp(8 + G.andar); return 'O olho se suaviza: “Reconhecer a ignorância é o primeiro passo para a sabedoria.” Aion-vehr te dá um pouco de experiência.'; } },
        ],
      };
    },
  },

  /* ===== Eventos extras (sem deuses) ===== */
  {
    id: 'espelho', titulo: 'Espelho Falante Seu Narciso', icone: '🪞', peso: 7,
    texto: 'Um espelho de moldura dourada na parede. <i>“Espelho, espelho meu… eu é que sou o mais belo! Bem, depois de você, talvez.”</i>',
    escolhas: [
      { texto: '😍 Elogiar o espelho', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 9)) { fx.ouro(30 + G.andar * 2); return 'O espelho corre de felicidade e te dá moedas que caíram atrás da moldura.'; }
        return 'O espelho acha que você está sendo falso. “Hunf!” Ele vira o rosto para a parede.';
      } },
      { texto: '🤬 Insultar o reflexo', acao: fx => {
        fx.combate({ nome: 'Reflexo Revoltado', icone: '🪞', hp: 1.2, atk: 1.2, def: 1, xp: 1.7, ouro: 1.5, falas: ['Você me chamou do QUÊ?!'] });
        return 'O reflexo sai do espelho com uma cara de quem não gostou da brincadeira.';
      } },
      { texto: '🧘 Olhar profundamente', acao: fx => { fx.xp(15 + G.andar * 2); return 'Você se olha por muito tempo e entende algo sobre si mesmo. O espelho aplaude, comovido.'; } },
    ],
  },
  {
    id: 'caramelo', titulo: 'Cachorro Caramelo Perdido', icone: '🐕', peso: 7, cond: p => !p.flags.caramelo,
    texto: 'Um cachorro caramelo, de orelha caída e olhar triste, te segue pelo corredor. Ele tem uma coleira com a plaquinha: <i>“Me chamo Caramelo. Qualquer pessoa serve.”</i>',
    escolhas: [
      { texto: '🍖 Dar um carinho e comida', acao: fx => {
        fx.flag('caramelo'); fx.karma(1); fx.aliado('caramelo');
        return 'Caramelo abana o rabo com tanta força que quase decola. A partir de agora ele é seu companheiro: morde calcanhares inimigos e late de qualquer perigo.';
      } },
      { texto: '🚶 Seguir caminho', acao: fx => 'Caramelo te olha até você sumir de vista. Você sente uma pontada de culpa. Pequena, mas existe.' },
      { texto: '😠 Enxotar o cachorro', acao: fx => { fx.karma(-1); fx.dano(4, 'Mordido por um cachorro caramelo'); return 'Caramelo rosna, morde seu calcanhar e vai embora. Ele estava certo.'; } },
    ],
  },
  {
    id: 'concurso', titulo: 'Concurso de Comer Pastel', icone: '🥟', peso: 7,
    texto: 'Uma multidão de goblins aplaude uma mesa comprida cheia de pastéis. Um deles grita: <i>“Quem vai participar do campeonato? Valendo prêmio!”</i>',
    escolhas: [
      { texto: '🥟 Participar (15 ouro)', dica: 'Teste de Vitalidade', req: p => p.ouro >= 15, reqTxt: 'precisa de 15 ouro', acao: fx => {
        fx.ouro(-15);
        if (fx.teste('vit', 11)) { fx.ouro(60); fx.attr('vit', 1); return 'Você come 37 pastéis e vence! Os goblins carregam você nos ombros. Seu estômago pede arrego, mas é um campeão.'; }
        fx.dano(8, 'Indigestão em campeonato de pastel'); return 'No vigésimo pastel você começa a ver tudo girando. Perde feio e passa mal.';
      } },
      { texto: '👀 Torcer da arquibancada', acao: fx => { fx.curaPct(0.1); return 'Você grita, aplaude e come um pastel de graça que um goblin te ofereceu. Dia bom.'; } },
      { texto: '🕵️ Sabotar um concorrente', dica: 'Teste de Destreza', acao: fx => {
        if (fx.teste('des', 12)) { fx.ouro(35); fx.karma(-1); return 'Você troca o recheio dele por pimenta. Ele grita, você ganha apostas.'; }
        fx.karma(-1); fx.dano(6, 'Surrado por uma multidão de goblins'); return 'Você é pego no flagra. Os goblins ensinam o que acontece com sabotadores.';
      } },
    ],
  },
  {
    id: 'aluno_fantasma', titulo: 'Aluno Fantasma Atrasado', icone: '🎒', peso: 8,
    texto: 'Um fantasma de mochila nas costas aparece, ofegante: <i>“Professor(a)! Meu código deu <code>IndentationError: unexpected indent</code> e a entrega é hoje às 23h59!”</i>',
    escolhas: [
      { texto: '🛠️ Ajudar a depurar', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 11)) { fx.xp(25 + G.andar * 3); fx.karma(1); return 'Você acha o espaço a mais em 30 segundos. O fantasma chora de gratidão e te dá um abraço gelado.'; }
        fx.dano(4, 'Esgotado depurando código alheio'); return 'Você procura por meia hora… e o erro era um espaço a mais na linha 2. Você perde a paciência.';
      } },
      { texto: '📋 Passar a resposta pronta', acao: fx => { fx.ouro(20); fx.karma(-1); return 'O fantasma agradece e te dá 20 de ouro. Mas lá no fundo ele não aprendeu nada, e você sabe disso.'; } },
      { texto: '📚 Mandar estudar sozinho', acao: fx => { fx.xp(8 + G.andar); return '“Procure a documentação”, você aconselha. O fantasma suspira e sai se arrastando. Você se sente um professor de verdade.'; } },
      { texto: '🤝 Convidar para a aventura', req: p => !temAliado(p, 'camaradinha'), reqTxt: 'ele já está com você', acao: fx => { fx.karma(1); fx.aliado('camaradinha'); return 'O fantasma arregala os olhos: “Posso mesmo? Ninguém nunca me convidou pra nada!” Ele flutua para o seu lado, com a mochila e tudo.'; } },
    ],
  },
  {
    id: 'mapas', titulo: 'Dona Cleusa, Vendedora de Mapas', icone: '🗺️', peso: 6,
    texto: 'Uma senhora com carrinho de feira vende mapas enrolados: <i>“Mapa! Mapa fresquinho! Garanto que o chefão já está desenhado, só falta você chegar!”</i>',
    escolhas: [
      { texto: '🗺️ Comprar um mapa (25 ouro)', req: p => p.ouro >= 25, reqTxt: 'precisa de 25 ouro', acao: fx => {
        const a = proxChefeAndar(), b = chefeDoAndar(a); fx.ouro(-25); fx.flag('rumor'); fx.xp(10);
        return `O mapa mostra que no <b>andar ${a}</b> te espera <b>${b.icone} ${b.nome}</b>, que usa <b>${b.especial.nome}</b> a cada ${b.especial.cada} turnos. Informação cara, mas valiosa.`;
      } },
      { texto: '🤝 Pechinchar', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 12)) { fx.xp(15); return 'Você consegue o mapa de graça, pois a vendedora estava de bom humor. Ele mostra um atalho cheio de teias, então você nem usa.'; }
        return 'Ela diz que o mapa vale R$ 200 e você desiste. “Volte quando tiver dinheiro, meu bem!”';
      } },
      { texto: '🚶 Dispensar com educação', acao: fx => 'Dona Cleusa te dá um tchau e continua gritando: “Mapa! Mapa fresquinho!”' },
    ],
  },
];

/* ---------- Ajudantes dos eventos divinos ---------- */
function lysaraMoeda(fx) {
  const ganha = chance(0.5 + stats(G).s.sor * 0.02);
  fx.linha(`🪙 A moeda cai: ${ganha ? 'a sorte sorriu!' : 'não foi dessa vez.'}`, ganha ? 'bom' : 'ruim');
  if (ganha) { fx.item({ bonus: 0.4 }); fx.bencao('lysara', { sor: 2 }, '+2 Sorte'); return 'A moeda cai de lado e fica de pé! Lysara dá gargalhadas de alegria: “Isso nunca acontece!” Ela te presenteia.'; }
  fx.dano(6, 'Atingido por uma moeda divina'); return 'A moeda cai bem na sua testa. “Opa, desculpa!”, ri Lysara.';
}

/** Possíveis resultados ao tocar na Fenda de Zyphera (chaos!). */
const CAOS_ZYPHERA = [
  fx => {
    const [a, b] = shuffle(Object.keys(ATRIBUTOS)).slice(0, 2);
    [G.attr[a], G.attr[b]] = [G.attr[b], G.attr[a]]; limitaVida();
    fx.linha(`🔀 ${ATRIBUTOS[a].nome} e ${ATRIBUTOS[b].nome} trocaram de valor!`, 'raro');
    return 'A fenda gira seus atributos como um cubo mágico. Você se sente diferente. E meio tonto.';
  },
  fx => { fx.attrAleatorio(2); fx.attrAleatorio(-1); return 'Uma onda de energia atravessa seu corpo. Algo cresceu… e algo encolheu.'; },
  fx => { fx.curaPct(1); fx.energia(99); return 'A fenda explode em purpurina e te cura por inteiro. “Surpresa!”, ri Zyphera.'; },
  fx => { fx.ouro(rnd(30, 70) + G.andar * 3); fx.dano(10, 'Atingido por magia caótica'); return 'Moedas caem do céu, mas algumas vêm com muita velocidade. Doeu, mas valeu o dinheiro.'; },
  fx => { G.en = 0; fx.linha('⚡ Sua energia foi zerada!', 'ruim'); fx.attr('sor', 1); return 'Você vira um sapo por três segundos. Perde toda a energia mágica, mas ganha uma sorte de principiante.'; },
  fx => { fx.item({ bonus: 0.3 }); return 'A fenda cospe um objeto brilhante na sua mão. “Reembalado e sem garantia!”, grita Zyphera.'; },
  fx => {
    fx.combate({ nome: 'Duplicata Caótica de ' + G.nome, icone: '🧿', hp: 1.4, atk: 1.2, def: 1, xp: 2.2, ouro: 2, falas: ['Eu sou você, só que com mais estilo!'] });
    return 'A fenda cospe uma cópia sua… com cara de poucos amigos.';
  },
];

EVENTOS.push(...EVENTOS_NOVOS);
