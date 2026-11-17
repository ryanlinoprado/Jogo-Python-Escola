'use strict';
/* =========================================================================
   EVENTOS ALEATÓRIOS  —  cada escolha tem consequências!
   Cada evento tem: titulo, icone, texto (HTML) e escolhas.
   Cada escolha tem uma função "acao(fx)" que usa os "efeitos" do objeto fx:
     fx.ouro(n)  fx.dano(n)  fx.cura(n)  fx.curaPct(0.3)  fx.energia(n)
     fx.attr('sor', 1)  fx.hpMax(10)  fx.xp(n)  fx.item({bonus, min})
     fx.consumivel('suco')  fx.flag('nome')  fx.inspirar(0.2, 2)
     fx.combate({...inimigo})   fx.teste('des', 12)  -> true/false (d20 + atributo)
   A função retorna o texto que conta o que aconteceu.
   ========================================================================= */

const EVENTOS = [
  {
    id: 'bau', titulo: 'O Baú Fofoqueiro', icone: '🧰', peso: 10,
    texto: 'No meio da sala há um baú que sussurra: <i>“psiu… abre aí… ninguém tá olhando… e eu não mordo… muito.”</i>',
    escolhas: [
      { texto: '🔓 Abrir o baú', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 11)) { fx.item({ bonus: 0.3 }); return 'O baú abre com um suspiro de alívio: “Finalmente alguém educado!” Dentro havia um tesouro.'; }
        fx.combate({ nome: 'Mímico Baú Fofoqueiro', icone: '📦', hp: 1.1, atk: 1.2, def: 1, xp: 1.6, ouro: 2, falas: ['Eu avisei que mordia!'] });
        return 'Surpresa! O baú tinha dentes. E opinião sobre você.';
      } },
      { texto: '🦶 Chutar o baú', dica: 'Teste de Força', acao: fx => {
        if (fx.teste('for', 11)) { fx.ouro(rnd(25, 45) + G.andar * 3); return 'O baú cospe moedas de susto. “Tá bom, tá bom, pega!”'; }
        fx.dano(6, 'Chutou um baú e perdeu'); return 'Doeu mais em você do que no baú. O baú está rindo.';
      } },
      { texto: '🚶 Ignorar', acao: fx => 'O baú grita: “Mal-educado!” enquanto você se afasta. Nada acontece.' },
    ],
  },
  {
    id: 'fonte', titulo: 'Fonte do Suco Misterioso', icone: '⛲', peso: 9,
    texto: 'Uma fonte borbulha um líquido roxo. Uma plaquinha diz: <i>“Beba por sua conta e risco. Não nos responsabilizamos.”</i>',
    escolhas: [
      { texto: '🥤 Beber', dica: 'Pode dar muito certo… ou não', acao: fx => {
        const r = Math.random();
        if (r < 0.35) { fx.curaPct(0.5); return 'Delicioso! Sabor uva com um toque de milagre.'; }
        if (r < 0.6) { fx.attrAleatorio(1); return 'Você sente uma energia estranha percorrer o corpo. Funcionou!'; }
        if (r < 0.85) { fx.dano(10, 'Bebeu líquido suspeito'); return 'Era suco de beterraba vencido. Seu estômago pede demissão.'; }
        fx.hpMax(-5); return 'O suco tinha efeito colateral permanente. Você está um pouquinho menor.';
      } },
      { texto: '🧴 Encher o cantil', acao: fx => { fx.consumivel('suco'); return 'Você enche o cantil. Vai que precisa depois.'; } },
      { texto: '🪙 Jogar uma moeda (10 ouro)', dica: 'Pedir um desejo', req: p => p.ouro >= 10, reqTxt: 'precisa de 10 ouro', acao: fx => {
        fx.ouro(-10);
        if (fx.teste('sor', 10)) { fx.attr('sor', 1); return 'Uma voz grave diz: “Desejo aceito.” Você se sente mais sortudo.'; }
        return 'A moeda afunda. A fonte arrota. Só isso.';
      } },
    ],
  },
  {
    id: 'gnomo', titulo: 'Gnomo Perdido Seu Genivaldo', icone: '🧙‍♂️', peso: 8, cond: p => !p.flags.gnomo && !p.flags.gnomoRaiva,
    texto: 'Um gnomo de gorro torto chora em um canto: <i>“Perdi minha casa! E meu GPS está sem sinal!”</i>',
    escolhas: [
      { texto: '🤝 Ajudar a achar a casa', dica: 'Custa um pouco de vida', acao: fx => {
        fx.dano(8, 'Ajudou um gnomo e caiu num buraco'); fx.flag('gnomo'); fx.karma(1); fx.xp(15);
        return 'Vocês procuram por horas. Você cai num buraco, mas acha a casa! O gnomo promete: “Não vou esquecer disso!”';
      } },
      { texto: '💰 Roubar o gorro dele', acao: fx => {
        fx.ouro(rnd(30, 50)); fx.attr('sor', -1); fx.flag('gnomoRaiva'); fx.karma(-1);
        return 'Dentro do gorro havia ouro! Mas o gnomo jura vingança… e dá azar (-1 Sorte).';
      } },
      { texto: '🚶 Ignorar', acao: fx => 'Você diz “boa sorte” e segue. O gnomo continua chorando.' },
    ],
  },
  {
    id: 'gnomoVolta', titulo: 'O Gnomo Agradecido', icone: '🎁', peso: 40, cond: p => p.flags.gnomo && !p.flags.gnomoPago,
    texto: 'Seu Genivaldo está ali, com um sorrisão! <i>“Eu disse que não esqueceria! Trouxe um presente!”</i>',
    escolhas: [
      { texto: '🎁 Aceitar o presente', acao: fx => { fx.flag('gnomoPago'); fx.item({ bonus: 0.6, min: 2 }); fx.attr('sor', 1); return 'O gnomo te dá um item raro e um abraço apertado. Quem faz o bem, recebe o bem!'; } },
      { texto: '🧙‍♂️ Pedir que ele venha junto', dica: 'Ele vira seu companheiro (sem presente)', req: p => !temAliado(p, 'genivaldo'), reqTxt: 'ele já está com você', acao: fx => { fx.flag('gnomoPago'); fx.karma(1); fx.aliado('genivaldo'); return '“Eu? Aventureiro? Sempre quis!” Ele ajeita o gorro torto e marcha atrás de você, com uma varinha que ele jura ser de verdade.'; } },
    ],
  },
  {
    id: 'gnomoVinganca', titulo: 'A Vingança do Gnomo', icone: '😈', peso: 40, cond: p => p.flags.gnomoRaiva && !p.flags.gnomoPago,
    texto: 'Seu Genivaldo voltou… com um exército de amigos gnomos. <i>“LEMBRA DO MEU GORRO?”</i>',
    escolhas: [
      { texto: '⚔️ Lutar', acao: fx => { fx.flag('gnomoPago'); fx.combate({ nome: 'Gnomo Genivaldo Furioso', icone: '🧙‍♂️', hp: 1.6, atk: 1.3, def: 1, xp: 2, ouro: 2, falas: ['Meu gorro! Meu GORRO!'] }); return 'Você aceita a briga. O gnomo ataca com um garfo.'; } },
      { texto: '💸 Devolver o ouro (40)', req: p => p.ouro >= 40, reqTxt: 'precisa de 40 ouro', acao: fx => { fx.flag('gnomoPago'); fx.ouro(-40); return 'Você devolve o dinheiro e pede desculpas. O gnomo aceita… e te dá um tapinha nas costas.'; } },
    ],
  },
  {
    id: 'dado', titulo: 'O Dado Amaldiçoado', icone: '🎲', peso: 8,
    texto: 'Um dado gigante flutua sobre um pedestal: <i>“Vem jogar! A casa sempre ganha. Mas hoje eu tô de bom humor.”</i>',
    escolhas: [
      { texto: '🎲 Apostar 20 de ouro', req: p => p.ouro >= 20, reqTxt: 'precisa de 20 ouro', acao: fx => {
        const d = rnd(1, 6); fx.linha(`🎲 O dado cai: ${d}`);
        fx.ouro(-20);
        if (d === 1) { fx.dano(8, 'Amaldiçoado por um dado'); return 'Número 1! O dado te amaldiçoa com uma coceira terrível.'; }
        if (d <= 3) return 'Você perdeu. O dado dá risada: “Ha-ha-ha! Mais um!”';
        if (d <= 5) { fx.ouro(50); return 'Você ganhou! O dado paga o dobro (e meio emburrado).'; }
        fx.item({ bonus: 0.5 }); return 'SEIS! O dado fica assustado e te dá um prêmio especial!';
      } },
      { texto: '😬 Apostar a dignidade', dica: 'Grátis, mas arriscado', acao: fx => {
        const d = rnd(1, 6); fx.linha(`🎲 O dado cai: ${d}`);
        if (d <= 2) { fx.dano(5, 'Perdeu a dignidade num dado'); return 'Você perdeu e teve que dançar a macarena. A dignidade foi embora.'; }
        if (d <= 5) return 'Empate. Ninguém ganha, só um constrangimento leve.';
        fx.ouro(35); return 'Você ganhou! O dado paga 35 de ouro e te chama de “mestre”.';
      } },
      { texto: '🚶 Ir embora', acao: fx => 'O dado resmunga: “Medroso!” e volta a flutuar.' },
    ],
  },
  {
    id: 'estatua', titulo: 'Estátua de Lysara, a Deusa da Sorte', icone: '🍀', peso: 7, unico: true,
    texto: 'Uma estátua de uma mulher risonha com um trevo na mão e um dado no bolso. Uma plaquinha: <i>“Lysara, deusa da sorte. Oferendas aceitas. Reclamações, não.”</i>',
    escolhas: [
      { texto: '🙏 Rezar', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 12)) { fx.attr('sor', 1); fx.bencao('lysara', { sor: 2 }, '+2 Sorte'); return 'Um raio de luz verde te ilumina. Lysara sorri e pisca para você.'; }
        return 'Um pombo faz cocô na sua cabeça. Isso também conta como sorte, dizem.';
      } },
      { texto: '🪙 Oferecer 30 de ouro', req: p => p.ouro >= 30, reqTxt: 'precisa de 30 ouro', acao: fx => { fx.ouro(-30); fx.attr('sor', 2); fx.bencao('lysara', { sor: 2 }, '+2 Sorte'); return 'Lysara aprecia a oferta. Seus bolsos pesam menos, mas a sorte, mais.'; } },
      { texto: '💥 Derrubar a estátua', dica: 'Teste de Força', acao: fx => {
        fx.karma(-1); fx.flag('derrubouEstatua');
        if (fx.teste('for', 13)) { fx.ouro(rnd(40, 70)); fx.attr('sor', -1); return 'A estátua cai e libera moedas… e uma maldição leve. Lysara não esquece.'; }
        fx.dano(12, 'Esmagado pela estátua de Lysara'); fx.attr('sor', -1); return 'A estátua cai em cima de você. Lysara não gostou.';
      } },
    ],
  },
  {
    id: 'bardo', titulo: 'Bardo Desafinado Seu Ednaldo', icone: '🎸', peso: 8,
    texto: 'Um bardo toca uma música que parece um gato sendo espremido. <i>“Gostou? É a minha nova composição: ‘Boleto de Amor’.”</i>',
    escolhas: [
      { texto: '👂 Ouvir até o fim', acao: fx => { fx.inspirar(0.2, 3); fx.dano(3, 'Morreu de vergonha alheia'); return 'Você sai com dor de ouvido, mas estranhamente motivado. (+20% de dano nos próximos 3 combates)'; } },
      { texto: '💸 Pagar 15 de ouro para ele parar', req: p => p.ouro >= 15, reqTxt: 'precisa de 15 ouro', acao: fx => { fx.ouro(-15); fx.attr('des', 1); return 'Ele aceita o dinheiro e, de brinde, te ensina um passinho de dança (+1 Destreza).'; } },
      { texto: '🎤 Cantar junto', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 11)) { fx.ouro(45); return 'A plateia (de morcegos) aplaude! Você ganha gorjetas.'; }
        fx.combate({ nome: 'Plateia de Morcegos Críticos', icone: '🦇', hp: 1, atk: 1.2, def: 1, xp: 1.3, ouro: 1, falas: ['Booooo!'] });
        return 'Você desafina tanto que atrai monstros de três andares de distância.';
      } },
    ],
  },
  {
    id: 'armadilha', titulo: 'Corredor das Armadilhas Malfeitas', icone: '🪤', peso: 8,
    texto: 'O corredor está cheio de armadilhas mal-acabadas. Uma delas tem um papelzinho: <i>“Não é pra pisar. Att, Gerência.”</i>',
    escolhas: [
      { texto: '🔧 Desarmar com cuidado', dica: 'Teste de Destreza', acao: fx => {
        if (fx.teste('des', 12)) { fx.ouro(rnd(20, 40) + G.andar * 2); fx.xp(10); return 'Você desarma tudo e ainda acha ouro escondido atrás da engrenagem.'; }
        fx.dano(10, 'Armadilha malfeita (mas funcionou)'); return 'Clique. Uma pedra cai no seu pé. Era malfeita, mas funcionou.';
      } },
      { texto: '🏃 Correr sem olhar', dica: 'Teste de Vitalidade', acao: fx => {
        if (fx.teste('vit', 11)) return 'Você sai do outro lado com a roupa rasgada, mas inteiro.';
        fx.dano(14, 'Correu para uma armadilha'); return 'Você correu direto para a única armadilha que funcionava.';
      } },
      { texto: '🦘 Pular tudo', dica: 'Teste de Força', acao: fx => {
        if (fx.teste('for', 12)) { fx.xp(12); return 'Um salto digno de olimpíadas! Os monstros aplaudem.'; }
        fx.dano(7, 'Pulou e caiu mal'); return 'Você pula, bate a cabeça no teto e cai de costas.';
      } },
    ],
  },
  {
    id: 'altar', titulo: 'Altar do Sacrifício de Segunda-Feira', icone: '🕯️', peso: 6,
    texto: 'Um altar sombrio com velas acesas. Uma voz sussurra: <i>“Dê um pouco da sua vida e receba poder. Segunda-feira é dia de sacrifício.”</i>',
    escolhas: [
      { texto: '🩸 Sacrificar 10 de vida máxima', dica: 'Recompensa: item raro ou melhor', acao: fx => { fx.hpMax(-10); fx.item({ bonus: 0.5, min: 2 }); return 'O altar brilha e te entrega um item. Você se sente um pouco mais frágil.'; } },
      { texto: '🙏 Rezar em silêncio', acao: fx => { fx.curaPct(0.25); return 'O altar não pede nada. Você descansa e se cura.'; } },
      { texto: '🔨 Quebrar o altar', dica: 'Teste de Força', acao: fx => {
        if (fx.teste('for', 14)) { fx.ouro(60 + G.andar * 4); return 'O altar cai e solta um monte de moedas amaldiçoadas (mas gastáveis).'; }
        fx.dano(12, 'Maldição de um altar'); return 'O altar revida com um raio. Foi uma escolha ruim.';
      } },
    ],
  },
  {
    id: 'acampamento', titulo: 'Acampamento do Mochileiro Sumido', icone: '⛺', peso: 9,
    texto: 'Um acampamento abandonado. A fogueira ainda está morna e há um bilhete: <i>“Fui comprar pão. Volto já. (faz 3 anos)”</i>',
    escolhas: [
      { texto: '😴 Descansar um pouco', acao: fx => {
        fx.curaPct(0.35);
        if (chance(0.3)) { fx.combate({ nome: 'Mochileiro Fantasma Voltando do Pão', icone: '👻', hp: 1, atk: 1, def: 1, xp: 1.2, ouro: 1.2, falas: ['Quem dormiu na minha cama?'] }); return 'Você cochila… e acorda com o dono do acampamento furioso!'; }
        if (chance(0.3)) { fx.proximo = () => telaEvento(sonhoNythria()); return 'Você cai no sono… e uma névoa prateada começa a se formar no seu sonho.'; }
        return 'Você dorme feito pedra. Acorda renovado.';
      } },
      { texto: '🔍 Vasculhar as mochilas', acao: fx => {
        if (chance(0.55)) { fx.item({ bonus: 0.1 }); return 'Entre meias fedidas, você acha algo útil!'; }
        fx.dano(8, 'Mordido por cobra numa mochila'); return 'Tinha uma cobra dentro da mochila. Ela estava de mau humor.';
      } },
      { texto: '🍖 Comer a comida esquecida', acao: fx => {
        if (chance(0.6)) { fx.curaPct(0.2); fx.consumivel('energetico'); return 'Estava até gostoso! Você ainda leva um energético.'; }
        fx.dano(6, 'Intoxicação alimentar'); return 'A comida tinha 3 anos. O estômago tem opinião.';
      } },
    ],
  },
  {
    id: 'dragao', titulo: 'Dragãozinho Dormindo no Tesouro', icone: '🐉', peso: 5, cond: p => p.andar >= 3,
    texto: 'Um dragãozinho dorme em cima de uma pilha de ouro, roncando e soltando fumacinha. Um tesouro e tanto…',
    escolhas: [
      { texto: '🤫 Roubar o tesouro', dica: 'Teste de Destreza', acao: fx => {
        if (fx.teste('des', 14)) { fx.ouro(80 + G.andar * 6); fx.item({ bonus: 0.4 }); return 'Você leva o tesouro na ponta dos pés. O dragão só vira para o outro lado.'; }
        fx.combate({ nome: 'Dragãozinho Soneca', icone: '🐉', hp: 2, atk: 1.4, def: 1.2, xp: 2.5, ouro: 3, falas: ['Quem pegou o meu ouro?! Eu estava SONHANDO com ele!'] });
        return 'Uma moeda cai. O dragão abre um olho. Depois o outro. Depois a boca.';
      } },
      { texto: '🎶 Cantar uma canção de ninar', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 12)) { fx.xp(30 + G.andar * 3); return 'O dragão dorme ainda mais fundo e você aproveita para estudar o jeito dele de roncar. (+XP)'; }
        fx.dano(6, 'Chamuscado por um dragão rabugento'); return 'O dragão acorda, solta uma chama de aviso e volta a dormir. Chamuscou o seu cabelo.';
      } },
      { texto: '🚶 Sair de fininho', acao: fx => 'Você finge que nada aconteceu e sai pé ante pé.' },
    ],
  },
  {
    id: 'taverna', titulo: 'Taverna do Gato Barman Miau', icone: '🍻', peso: 8,
    texto: 'Um gato de colete serve bebidas no balcão: <i>“Miau. O que vai ser, forasteiro? Aceitamos só ouro e atum.”</i>',
    escolhas: [
      { texto: '🍺 Beber algo (10 ouro)', req: p => p.ouro >= 10, reqTxt: 'precisa de 10 ouro', acao: fx => { fx.ouro(-10); fx.curaPct(0.25); fx.energia(8); fx.dano(4, 'Ressaca mágica'); return 'Bebida gelada e deliciosa! Só a ressaca mágica que vem junto é meio ruim.'; } },
      { texto: '👂 Ouvir rumores', acao: fx => {
        const prox = Math.ceil((G.andar + 1) / 5) * 5; fx.flag('rumor'); fx.xp(10);
        return `O gato sussurra: “Um chefão te espera no andar ${prox}. E está de mau humor.” Informação é poder.`;
      } },
      { texto: '🃏 Jogar cartas (20 ouro)', req: p => p.ouro >= 20, reqTxt: 'precisa de 20 ouro', dica: 'Teste de Sorte', acao: fx => {
        fx.ouro(-20);
        if (fx.teste('sor', 11)) { fx.ouro(60); return 'Você ganha! O gato está furioso e promete que vai olhar suas cartas na próxima vez.'; }
        return 'Você perde. O gato sorri: “Miau. Eu avisei.”';
      } },
    ],
  },
  {
    id: 'ponte', titulo: 'Ponte do Troll Cobrador', icone: '🌉', peso: 7,
    texto: 'Um troll de colete reflexivo barra a ponte. <i>“Pedágio: 25 de ouro. Aceito PIX, mas ninguém explicou o que é isso.”</i>',
    escolhas: [
      { texto: '💰 Pagar 25 de ouro', req: p => p.ouro >= 25, reqTxt: 'precisa de 25 ouro', acao: fx => { fx.ouro(-25); return 'O troll agradece e levanta a cancela. Vai em paz.'; } },
      { texto: '🗣️ Negociar', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 13)) { fx.item({ bonus: 0.2 }); return 'Você o convence com argumentos tão bons que ele ainda te dá um presente por ter perdido.'; }
        fx.ouro(-Math.min(G.ouro, 40)); return 'Você fala demais, ele se confunde e cobra “taxa de conveniência” de 40.';
      } },
      { texto: '⚔️ Lutar', acao: fx => { fx.combate({ nome: 'Troll Cobrador Zé do Pedágio', icone: '🧌', hp: 1.5, atk: 1.2, def: 1.2, xp: 1.8, ouro: 3, falas: ['Isso vai custar R$ 25 + multa!'] }); return 'O troll estala os dedos: “Então vai ser do jeito difícil.”'; } },
    ],
  },
  {
    id: 'biblioteca', titulo: 'Biblioteca Mal-Assombrada', icone: '📚', peso: 7,
    texto: 'Estantes antigas cheias de livros. Uma bibliotecária fantasma sussurra: <i>“Shhh!”</i> E ela sabe que você nem abriu a boca.',
    escolhas: [
      { texto: '📖 Ler um livro', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 12)) { fx.xp(25 + G.andar * 3); fx.attr('int', 1); return 'Você aprende algo de verdade. Parece até um dia de aula (+Inteligência).'; }
        fx.dano(5, 'Atacado por um livro de capa dura'); return 'O livro é um mímico. A capa dura dói.';
      } },
      { texto: '📕 Pegar o livro proibido', dica: 'Poder… com custo', acao: fx => { fx.attr('for', 2); fx.attr('vit', -1); return 'Você lê páginas obscuras e ganha músculos (+2 Força), mas esquece de comer direito (-1 Vitalidade).'; } },
      { texto: '🤐 Fazer silêncio', acao: fx => { fx.energia(6); return 'A bibliotecária faz um aceno de aprovação. Você descansa em silêncio.'; } },
    ],
  },
  {
    /* Evento especial: pergunta de Python gerada na hora! */
    id: 'quiz', titulo: 'Fantasma do Professor Pythonildo', icone: '🐍', peso: 12,
    montar: p => {
      const q = pick(QUIZ);
      const ops = shuffle(q.o.map((t, i) => ({ t, ok: i === q.c })));
      return {
        titulo: 'Fantasma do Professor Pythonildo', icone: '👻',
        texto: `Um fantasma de óculos aparece com uma caneta vermelha: <i>“Responda e eu deixo você passar! Errar custa vida!”</i><div class="quiz">${q.p}</div>`,
        escolhas: ops.map(o => ({
          texto: o.t,
          acao: fx => {
            if (o.ok) { fx.xp(20 + G.andar * 3); fx.attr('int', 1); fx.item({ bonus: 0.15 }); return '✅ Correto! O professor sorri (e anota um 10). Você ganha experiência, +1 Inteligência e um presente.'; }
            fx.dano(8 + Math.floor(G.andar / 2), 'Reprovado pelo Prof. Pythonildo');
            return `❌ Errado! A resposta certa era: <b>${q.o[q.c]}</b>. “Volte para a aula 1!”, grita o fantasma, e te dá uma bronca.`;
          },
        })),
      };
    },
  },
];
