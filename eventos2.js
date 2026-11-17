'use strict';
/* =========================================================================
   MAIS EVENTOS ALEATÓRIOS — humor, escolhas com consequência e memória.
   Mesmo formato de eventos.js. Alguns eventos têm 3 truques extras:
     • cond: p => ...      só aparece se a condição for verdadeira (p = o herói)
     • unico: true         só acontece uma vez por aventura
     • montar(p)           monta o evento na hora (usado na Revisão de Código)
   Eventos "em cadeia" lembram o que você fez: o pombo-correio, a pizza e a
   carta voltam mais tarde, com recompensa ou vingança!
   ========================================================================= */

const zonaDe = p => Math.floor((p.andar - 1) / 5) % 5;   // 0 = Cavernas ... 4 = Abismo

/* ---------- Revisão de Código: bugs de Python de verdade ---------- */
const BUGS = [
  { codigo: 'idade = 15\nif idade = 18:\n    print("Maior de idade")', certo: 'Trocar = por ==', errados: ['Trocar if por while', 'Trocar 18 por "18"'], dica: 'SyntaxError: invalid syntax' },
  { codigo: 'for i in range(3)\n    print(i)', certo: 'Colocar dois-pontos depois do range(3)', errados: ['Trocar range por rage', 'Tirar o print'], dica: 'SyntaxError: expected \':\'' },
  { codigo: 'lista = [10, 20, 30]\nprint(lista[3])', certo: 'Usar lista[2] (o último índice é 2)', errados: ['Usar lista(3)', 'Escrever lista.3'], dica: 'IndexError: list index out of range' },
  { codigo: 'print("Idade: " + 15)', certo: 'Usar str(15) para virar texto', errados: ['Trocar + por -', 'Tirar as aspas'], dica: 'TypeError: can only concatenate str to str' },
  { codigo: 'def dobro(n):\n    n * 2\n\nprint(dobro(4))', certo: 'Escrever return n * 2', errados: ['Trocar def por function', 'Chamar print dentro do def'], dica: 'A função imprime None' },
  { codigo: 'nome = input("Nome: ")\nprint("Olá, nome")', certo: 'Usar print("Olá,", nome) (sem aspas na variável)', errados: ['Trocar input por print', 'Colocar nome entre colchetes'], dica: 'Imprime sempre a palavra "nome"' },
  { codigo: 'soma = 0\nfor n in [1, 2, 3]:\nsoma += n\nprint(soma)', certo: 'Indentar (dar espaços) a linha soma += n', errados: ['Trocar for por if', 'Apagar o print'], dica: 'IndentationError: expected an indented block' },
  { codigo: 'x = "5"\ny = x + 3\nprint(y)', certo: 'Converter com int(x) + 3', errados: ['Trocar 3 por "três"', 'Trocar + por *'], dica: 'TypeError: can only concatenate str to str' },
  { codigo: 'frutas = ["maçã"]\nfrutas.append["uva"]', certo: 'Usar parênteses: frutas.append("uva")', errados: ['Usar frutas.add("uva")', 'Escrever frutas = "uva"'], dica: 'TypeError: \'builtin_function_or_method\' object is not subscriptable' },
  { codigo: 'contador = 0\nwhile contador < 3:\n    print(contador)', certo: 'Somar 1 ao contador dentro do while', errados: ['Trocar < por >', 'Trocar while por for'], dica: 'O programa nunca termina (loop infinito)' },
  { codigo: 'nota = 7\nif nota >= 6:\nprint("Aprovado")', certo: 'Indentar o print dentro do if', errados: ['Trocar >= por =', 'Trocar 6 por "6"'], dica: 'IndentationError: expected an indented block' },
  { codigo: 'texto = "olá"\ntexto[0] = "O"', certo: 'Criar um novo texto: "O" + texto[1:] (strings não mudam)', errados: ['Trocar [0] por (0)', 'Usar texto.0'], dica: 'TypeError: \'str\' object does not support item assignment' },
];

const EVENTOS_MAIS = [
  /* ================= EVENTOS GERAIS ================= */
  {
    id: 'code_review', titulo: 'Code Review do Fantasma Sênior', icone: '👻', peso: 9,
    montar: p => {
      const vistos = p.flags.bugsVistos || [];
      let livres = BUGS.map((b, i) => i).filter(i => !vistos.includes(i)); if (!livres.length) livres = BUGS.map((b, i) => i);
      const idx = livres[Math.floor(Math.random() * livres.length)], b = BUGS[idx];
      const opcoes = shuffle([{ t: b.certo, ok: true }, ...b.errados.map(t => ({ t, ok: false }))]);
      return {
        titulo: 'Code Review do Fantasma Sênior', icone: '👻',
        texto: `Um fantasma de óculos e camiseta de programador te intercepta: <i>“Aprendiz! Antes de passar, faça o code review. O que há de errado neste código?”</i><pre class="codigo-evento">${esc(b.codigo)}</pre><small class="suave">Mensagem do computador: <code>${esc(b.dica)}</code></small>`,
        escolhas: opcoes.map(o => ({ texto: o.t, acao: fx => {
          G.flags.bugsVistos = [...vistos, idx];
          if (o.ok) { G.est.reviewOk = (G.est.reviewOk || 0) + 1; fx.xp(18 + G.andar * 3); fx.ouro(15 + G.andar * 2); fx.karma(1); return 'O fantasma limpa os óculos: “Aprovado! Você tem futuro… ou pelo menos um bom Stack Overflow.”'; }
          fx.dano(4 + Math.floor(G.andar / 2), 'Reprovado em code review'); return `“Reprovado!” O fantasma te acerta com um relatório de 40 páginas. <b>A resposta certa era:</b> ${esc(b.certo)}.`;
        } })),
      };
    },
  },
  {
    id: 'pombo_correio', titulo: 'Pombo-Correio com Mensagem Errada', icone: '🕊️', peso: 7, unico: true, cond: p => !p.flags.carta,
    texto: 'Um pombo gordo pousa no seu ombro com uma carta presa na perna: <i>“URGENTE — Para o Sr. Troll da Ponte, caverna 3, ao lado da padaria”</i>. Ele te olha como quem diz “não é problema meu”.',
    escolhas: [
      { texto: '📖 Ler a carta', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 11)) { fx.xp(10 + G.andar * 2); fx.ouro(20 + G.andar * 2); return 'É um boleto atrasado… com um mapa do tesouro rabiscado no verso! Você segue o mapa e acha uma bolsinha esquecida.'; }
        fx.dano(4, 'Corte de papel (muito profundo)'); return 'Era um boleto em papel-cartão. Você se corta lendo, e o pombo ri (sim, pombos riem).';
      } },
      { texto: '📮 Guardar a carta e procurar o destinatário', acao: fx => { fx.flag('carta'); fx.karma(1); fx.linha('📬 Você guarda a carta. Quem sabe encontre o troll pelo caminho…'); return 'O pombo suspira de alívio, bate asas e some. Agora o problema é seu. Carta no bolso!'; } },
      { texto: '🍞 Dar migalhas e seguir', acao: fx => { fx.energia(3); return 'O pombo come tudo, solta um arroto de pombo e te deixa em paz. Você ganha um pouco de energia pela boa ação.'; } },
    ],
  },
  {
    id: 'carta_entrega', titulo: 'O Destinatário da Carta', icone: '📬', peso: 45, cond: p => p.flags.carta && !p.flags.cartaFeita,
    texto: 'Um troll de chinelos abre uma portinha na parede: <i>“Ah, você trouxe a minha correspondência! Estou esperando o resultado do concurso de bigodes há semanas!”</i>',
    escolhas: [
      { texto: '📬 Entregar a carta com um sorriso', acao: fx => { fx.flag('cartaFeita'); fx.karma(1); fx.item({ bonus: 0.4, min: 1 }); fx.ouro(20); return 'Era mesmo o prêmio! O troll chora de felicidade e divide com você: um item e um pouco de ouro. Entrega feita, estrelinha no currículo.'; } },
      { texto: '🕵️ Abrir a carta antes de entregar', acao: fx => { fx.flag('cartaFeita'); fx.karma(-1); fx.ouro(40); fx.dano(6, 'Chinelada de troll'); return 'Era um cheque! Você troca por moedas na hora… e o troll grita “LADRÃO!” e arremessa um chinelo com uma pontaria absurda.'; } },
    ],
  },
  {
    id: 'maquina_refri', titulo: 'Máquina de Refrigerante Encantada', icone: '🥤', peso: 8,
    texto: 'No fim do corredor, uma máquina de refrigerante brilha em neon: <i>“INSIRA MOEDAS. OU A SUA ALMA. ACEITAMOS CARTÃO? NÃO.”</i>',
    escolhas: [
      { texto: '🪙 Inserir 15 de ouro', req: p => p.ouro >= 15, reqTxt: 'precisa de 15 ouro', acao: fx => {
        fx.ouro(-15); const r = rnd(1, 100);
        if (r <= 35) { fx.consumivel('energetico', 2); return 'PLIM! Duas latas de Energético Vencido caem. Uma delas está até gelada.'; }
        if (r <= 65) { fx.consumivel('suco'); return 'Cai um Suco de Uva Duvidoso. A máquina pisca: “Compre mais!”'; }
        if (r <= 85) { fx.energia(8); fx.xp(8); return 'A máquina solta um refrigerante que borbulha de um jeito suspeito. Você bebe e sente o corpo vibrar.'; }
        return 'A máquina engole a moeda e cospe um clipe de papel. Em letras miúdas: “Boa sorte na próxima.”';
      } },
      { texto: '👊 Dar um soco na máquina', dica: 'Teste de Força', acao: fx => {
        if (fx.teste('for', 12)) { fx.ouro(rnd(30, 55)); return 'A máquina arrota uma chuva de moedas! Parece que ela devolve tudo o que engoliu de outros aventureiros.'; }
        fx.dano(5 + Math.floor(G.andar / 2), 'Máquina de refrigerante revidou'); return 'A máquina aplica um choque elétrico. Sua mão fica formigando por três andares.';
      } },
      { texto: '🚶 Resistir à tentação', acao: fx => { fx.xp(5 + G.andar); return 'Você passa reto. Sua sede não perdoa, mas sua carteira agradece.'; } },
    ],
  },
  {
    id: 'reuniao_condominio', titulo: 'Reunião de Condomínio dos Monstros', icone: '🏢', peso: 6,
    texto: 'Dezenas de monstros de crachá discutem em volta de uma mesa: <i>“Pauta de hoje: o barulho dos aventureiros no corredor 7!”</i> De repente todos se viram para você.',
    escolhas: [
      { texto: '🗣️ Pedir a palavra', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 12)) { fx.xp(15 + G.andar * 2); fx.ouro(25); fx.karma(1); return 'Seu discurso emociona a assembleia: todos votam por “mais respeito entre as espécies”. Você é eleito síndico honorário e ganha um vale-pastel.'; }
        fx.dano(4, 'Vaiado e atingido por um pastel'); return 'Você gagueja, a plateia vaia e alguém arremessa um pastel frio. Dói mais no orgulho.';
      } },
      { texto: '🤫 Ficar quieto no fundo', acao: fx => { fx.curaPct(0.1); return 'Você cochila durante a leitura da ata. Foi o descanso mais tranquilo da masmorra.'; } },
      { texto: '🚪 Causar tumulto', acao: fx => { fx.karma(-1); fx.combate({ nome: 'Síndico Furioso Seu Valdir', icone: '🧑‍💼', hp: 1.4, atk: 1.2, def: 1.1, xp: 1.8, ouro: 2, falas: ['Isso vai para a ata!'] }); return 'Você vira a mesa. O síndico arregaça as mangas: “Vou te multar em TUDO que você tem!”'; } },
    ],
  },
  {
    id: 'entregador_pizza', titulo: 'Entregador de Pizza Perdido', icone: '🛵', peso: 7, unico: true, cond: p => p.andar >= 2,
    texto: 'Um entregador de capacete, suado, confere um papel: <i>“Rua das Masmorras, 666, ao lado do Vulcão. Será que é por aqui? A pizza esfria em cinco minutos!”</i> O cheiro de queijo derretido é irresistível.',
    escolhas: [
      { texto: '🗺️ Ajudar a achar o endereço', acao: fx => { fx.flag('pizzaAmigo'); fx.karma(1); fx.xp(10 + G.andar); return 'Vocês acham o endereço (era o portão de uma masmorra vizinha). O entregador agradece: “Se precisar, é só chamar!” Você sente que isso vai render.'; } },
      { texto: '😋 “Experimentar” uma fatia', acao: fx => { fx.curaPct(0.25); fx.karma(-1); fx.flag('pizzaRoubada'); return 'Delícia! Você some com meia pizza em dois minutos. O entregador anota a sua descrição em um caderninho: “Cliente (não pagante)”.'; } },
      { texto: '🚶 Dizer que não sabe', acao: fx => 'Você dá de ombros. O entregador segue pelo corredor murmurando o endereço, e você jura que ouve a pizza chorar.' },
    ],
  },
  {
    id: 'pizza_gorjeta', titulo: 'A Pizza Chegou!', icone: '🍕', peso: 45, cond: p => p.flags.pizzaAmigo && !p.flags.pizzaPago,
    texto: 'O entregador te encontra e abre uma caixa gigante, ainda quentinha: <i>“Cortesia da casa! Por você ter me salvado naquele dia!”</i>',
    escolhas: [
      { texto: '🍕 Comer agora', acao: fx => { fx.flag('pizzaPago'); fx.curaPct(0.5); fx.energia(8); return 'Quatro queijos, borda recheada, e um guaraná de brinde. Você se levanta como novo.'; } },
      { texto: '🎁 Levar para viagem', acao: fx => { fx.flag('pizzaPago'); fx.consumivel('pastel'); fx.ouro(15); return 'Ele embrulha tudo com carinho e ainda dá uma gorjeta. “Pastel de Vento Recheado” no bolso e ouro de troco.'; } },
    ],
  },
  {
    id: 'pizza_vinganca', titulo: 'O Entregador Furioso', icone: '🏍️', peso: 45, cond: p => p.flags.pizzaRoubada && !p.flags.pizzaPago,
    texto: 'Uma moto turbinada derrapa à sua frente. O entregador tira o capacete: <i>“VOCÊ COMEU MEIA PIZZA E NÃO PAGOU. ISSO É CRIME FISCAL!”</i>',
    escolhas: [
      { texto: '⚔️ Enfrentar', acao: fx => { fx.flag('pizzaPago'); fx.combate({ nome: 'Entregador Furioso (Moto Turbinada)', icone: '🏍️', hp: 1.5, atk: 1.3, def: 1.1, xp: 2, ouro: 2.2, falas: ['PIZZA É SAGRADA!'] }); return 'Ele arregaça as mangas e liga o motor da moto no talo.'; } },
      { texto: '💸 Pagar a pizza (25 ouro)', req: p => p.ouro >= 25, reqTxt: 'precisa de 25 ouro', acao: fx => { fx.flag('pizzaPago'); fx.ouro(-25); fx.karma(1); return 'Ele conta cada moeda duas vezes e te entrega o recibo. “Bom negócio.” Dignidade restaurada.'; } },
    ],
  },
  {
    id: 'poca_lama', titulo: 'Poça de Lama Suspeita', icone: '🟤', peso: 8,
    texto: 'Uma poça de lama gigante bloqueia o corredor. Ela borbulha. Tem uma bota de alguém boiando… com o pé dentro? (Provavelmente não.)',
    escolhas: [
      { texto: '🦘 Pular por cima', dica: 'Teste de Destreza', acao: fx => {
        if (fx.teste('des', 11)) { fx.xp(8 + G.andar); return 'Um salto digno de olimpíadas! Você aterra do outro lado sem uma gota de lama. A plateia imaginária aplaude.'; }
        fx.dano(4, 'Caiu de cara na lama'); return 'Seu pé escorrega no meio do salto. Você pousa de barriga na lama e come um pouco, sem querer.';
      } },
      { texto: '🚶 Atravessar pelo meio', acao: fx => {
        if (chance(0.5)) { fx.ouro(rnd(15, 35)); return 'A lama gruda nas botas, mas sob ela você sente algo duro: uma bolsinha de moedas esquecida por um aventureiro azarado.'; }
        fx.dano(2); return 'Você sai fedendo, de meias molhadas, e sem nada. Pelo menos o caminho está livre.';
      } },
      { texto: '⛏️ Cavar a lama', dica: 'Teste de Força', acao: fx => {
        if (fx.teste('for', 12)) { fx.item({ bonus: 0.2 }); return 'Embaixo da lama estava um baú enferrujado, cheio de limo. Dentro: algo útil.'; }
        fx.combate({ nome: 'Minhoca Gigante da Lama', icone: '🪱', hp: 1.2, atk: 1.1, def: 0.9, xp: 1.3, ouro: 1.2, falas: ['Quem cavou a minha casa?'] }); return 'A lama se mexe. Uma minhoca do tamanho de um caminhão emerge, MUITO ofendida.';
      } },
    ],
  },
  {
    id: 'loja_alem', titulo: 'Loja de Conveniência 24h do Além', icone: '🏪', peso: 6, cond: p => p.andar >= 6,
    texto: 'Uma lojinha de neon verde brilha entre as sombras: <i>“CONVENIÊNCIA DO ALÉM — aberto 24h (o mais do que isso, ninguém sabe)”</i>. O atendente é um fantasma de colete.',
    escolhas: [
      { texto: '🛍️ Sacola Misteriosa (35 ouro)', req: p => p.ouro >= 35, reqTxt: 'precisa de 35 ouro', acao: fx => {
        fx.ouro(-35); const r = rnd(1, 100);
        if (r <= 45) { fx.item({ bonus: 0.3, min: 1 }); return 'Dentro da sacola: um item! O atendente sussurra: “Sem troca, sem devolução, sem remorso.”'; }
        if (r <= 75) { fx.consumivel('suco', 2); fx.consumivel('energetico'); return 'Uma cesta de lanches vencidos há três séculos. Estranhamente, ainda funcionam.'; }
        fx.attr('sor', -1); return 'A sacola está cheia de… ar. E de um bilhete: “Obrigado pela preferência.” Você sente seu azar aumentar um pouco.';
      } },
      { texto: '🧃 Comprar só um suco (15 ouro)', req: p => p.ouro >= 15, reqTxt: 'precisa de 15 ouro', acao: fx => { fx.ouro(-15); fx.consumivel('suco'); return 'O fantasma passa o código de barras no seu braço. “Quer o recibo? Está na sua alma.”'; } },
      { texto: '🏷️ Pedir desconto', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 12)) { fx.consumivel('pastel'); return 'Você argumenta com firmeza sobre “taxa de existência”. Para se livrar de você, o fantasma entrega um pastel de graça.'; }
        fx.dano(3, 'Expulso da loja a vassouradas'); return 'O fantasma chama o segurança, que é um esqueleto com uma vassoura. Você sai correndo.';
      } },
    ],
  },
  {
    id: 'pescaria', titulo: 'Pescaria no Lago de Esgoto', icone: '🎣', peso: 6,
    texto: 'Um lago esverdeado borbulha no meio da sala. Um pescador de chapéu surrado oferece uma vara: <i>“Aqui tem peixe grande! Ou bota velha. Depende do dia.”</i>',
    escolhas: [
      { texto: '🎣 Pescar', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 11)) { const r = rnd(1, 3); if (r === 1) { fx.item({ bonus: 0.2 }); return 'A vara entorta! Você puxa um baú pingando limo, com um item dentro.'; } if (r === 2) { fx.ouro(rnd(25, 45)); return 'Fisgou uma carpa dourada que cospe moedas quando você a solta de volta.'; } fx.curaPct(0.3); return 'Um peixe-espada! O pescador assa na hora. Você come, e come, e come.'; }
        fx.dano(2); return 'Você fisga o próprio chapéu, a própria orelha e uma bota velha. O pescador morre de rir.';
      } },
      { texto: '🐟 Comprar um peixe assado (20 ouro)', req: p => p.ouro >= 20, reqTxt: 'precisa de 20 ouro', acao: fx => { fx.ouro(-20); fx.curaPct(0.35); fx.energia(4); return 'O pescador te vende um peixe quentinho, com limão e tudo. Você jura não perguntar de qual lago ele saiu.'; } },
      { texto: '🏊 Mergulhar no lago', dica: 'Teste de Vitalidade', acao: fx => {
        if (fx.teste('vit', 13)) { fx.item({ bonus: 0.5, min: 1 }); return 'Você prende a respiração e encontra um baú afundado há séculos. Sair do esgoto, porém, é outra história.'; }
        fx.dano(8 + Math.floor(G.andar / 2), 'Afogado no lago de esgoto'); return 'A água é mais densa do que parecia. Você sai tossindo, fedendo e furioso consigo mesmo.';
      } },
    ],
  },
  {
    id: 'aniversario', titulo: 'Festa de Aniversário do Slime', icone: '🎂', peso: 6,
    texto: 'Um slime enfeitado com chapéu de festa te chama: <i>“Blub blub! (Tradução: Hoje é meu aniversário e ninguém veio!)”</i> Atrás dele, uma mesa de bolo e balões.',
    escolhas: [
      { texto: '🎁 Dar um presente (20 ouro)', req: p => p.ouro >= 20, reqTxt: 'precisa de 20 ouro', acao: fx => { fx.ouro(-20); fx.karma(1); fx.curaPct(0.2); fx.inspirar(0.2, 2); return 'O slime chora de alegria (gelatina escorrendo). A festa dura o dia todo: bolo, dança e muito confete. Você sai com energia de sobra!'; } },
      { texto: '🎤 Cantar parabéns', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 10)) { fx.xp(12 + G.andar * 2); fx.curaPct(0.15); return 'Você acerta o tom, o ritmo e a letra! O slime vira seu fã número um e te dá uma fatia grande.'; }
        fx.combate({ nome: 'Slime Ofendido (Aniversariante)', icone: '🟣', hp: 1.3, atk: 1, def: 1, xp: 1.4, ouro: 1.3, falas: ['Blub! (Tradução: você desafinou meu aniversário!)'] }); return 'Você desafina TANTO que o slime fica ofendido. Ele não aceita desculpas.';
      } },
      { texto: '🍰 Roubar o bolo e sair correndo', acao: fx => { fx.karma(-1); fx.curaPct(0.4); fx.combate({ nome: 'Convidados Furiosos (Gelatina)', icone: '🟣', hp: 1.5, atk: 1.2, def: 1, xp: 1.8, ouro: 1.8, falas: ['BLUB BLUB!! (Tradução: o bolo é nosso!)'] }); return 'Delicioso, mas gelatina é mais rápida do que parece. Os convidados vêm atrás de você!'; } },
    ],
  },
  {
    id: 'seguro', titulo: 'Gnomo Vendedor de Seguro de Vida', icone: '💼', peso: 6, unico: true, cond: p => p.andar >= 3 && !p.flags.seguro,
    texto: 'Um gnomo de terno aperta o seu pulso e sorri com dentes demais: <i>“Bom dia! Você já pensou no que acontece se… bem, você sabe? Temos o Seguro Pythonildo Vida™: cobertura total!”</i>',
    escolhas: [
      { texto: '📝 Contratar o seguro (60 ouro)', dica: 'Se você morrer, volta com 25% de vida (uma vez)', req: p => p.ouro >= 60, reqTxt: 'precisa de 60 ouro', acao: fx => { fx.ouro(-60); fx.flag('seguro'); fx.linha('💼 Seguro de vida ativo (uma vez).', 'raro'); return 'Você assina 14 páginas sem ler. O gnomo guarda a caneta e sussurra: “Qualquer coisa… a gente aparece.” (Isso soa como uma ameaça?)'; } },
      { texto: '📖 Ler as letras miúdas', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 13)) { fx.flag('seguro'); fx.ouro(-25); fx.linha('💼 Seguro de vida ativo (uma vez).', 'raro'); return 'Na página 9, cláusula 47, você acha um desconto para “aventureiros que leem contratos”. Preço final: 25 de ouro! O gnomo faz uma careta.'; }
        fx.xp(6); return 'Você lê por meia hora e não entende nada. Mas ganha tempo para descansar os pés.';
      } },
      { texto: '🚶 Recusar', acao: fx => 'O gnomo anota o seu nome em uma lista de “futuros clientes”. Seu coração dá um pulinho.' },
    ],
  },
  {
    id: 'portal_atalho', titulo: 'Portal Cor-de-Rosa Duvidoso', icone: '🌀', peso: 5, cond: p => p.andar % 5 !== 4,
    texto: 'Um portal cor-de-rosa, com bordas de glitter, gira no meio da parede. Uma plaquinha: <i>“ATALHO! Sem garantias. Não nos responsabilizamos por perda de memória, dedos ou dignidade.”</i>',
    escolhas: [
      { texto: '🌀 Entrar no portal', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 11)) { G.andar += 1; fx.xp(10 + G.andar); fx.linha('⏩ Você pulou um andar!', 'raro'); return 'O portal te cospe dois andares à frente, com glitter nos cabelos e a sensação de ter trapaceado. Você pulou uma sala inteira!'; }
        fx.combate({ nome: 'Guarda do Portal Glitter', icone: '🧚', hp: 1.3, atk: 1.2, def: 1, xp: 1.5, ouro: 1.5, falas: ['Atalhos são só para sócios!'] }); return 'O portal te joga de cabeça numa sala cheia de guardas de uniforme rosa. Sem querer, você era um intruso.';
      } },
      { texto: '🪨 Jogar uma pedra para testar', acao: fx => { fx.xp(5 + G.andar); return 'A pedra entra… e volta com um pedido de desculpas em papel timbrado. Hmm. Você decide não confiar.'; } },
      { texto: '🚶 Ignorar o portal', acao: fx => 'Você segue o caminho normal. O portal faz um barulhinho de decepção.' },
    ],
  },
  {
    id: 'eu_futuro', titulo: 'Você, Mas Mais Velho', icone: '🧓', peso: 5, unico: true, cond: p => p.andar >= 4,
    texto: 'Um aventureiro grisalho, com a sua cara e uma barriga de pastel, te cumprimenta: <i>“Escuta, eu sou você daqui a trinta andares. Só tenho tempo para um conselho.”</i>',
    escolhas: [
      { texto: '⚔️ “Treine mais!”', acao: fx => { fx.attrAleatorio(1); fx.xp(10 + G.andar); return 'Você sente os músculos (ou os neurônios) mais fortes. O velho dá um tapinha no seu ombro: “Eu devia ter treinado mais.”'; } },
      { texto: '💰 “Economize!”', acao: fx => { fx.ouro(30 + G.andar * 2); return 'Ele tira um saquinho do bolso: “Isso aqui eu juntei por anos. Não gaste tudo em pastel!”'; } },
      { texto: '🛡️ “Sobreviva!”', acao: fx => { fx.hpMax(10); fx.curaPct(0.1); return 'O velho pede para você respirar fundo e fazer alongamento. Você sai com mais fôlego e a coluna melhor.'; } },
      { texto: '🏆 Perguntar quem vence o ranking', acao: fx => { fx.xp(8); return 'Ele sorri, olha para o além e diz: “Sempre o aluno do fundo da sala.” E some, como o bom visionário que é.'; } },
    ],
  },

  /* ================= EVENTOS DE ZONA ================= */
  {
    id: 'cogumelos_cantores', titulo: 'Coral de Cogumelos', icone: '🍄', peso: 9, cond: p => zonaDe(p) === 0,
    texto: 'No cantinho úmido da caverna, um coral de cogumelos de chapeuzinho colorido ensaia uma ópera em tom agudíssimo. O maestro, um cogumelo-bolinha, te aponta com o cajado: <i>“VOCÊ! Tenor?”</i>',
    escolhas: [
      { texto: '🎶 Cantar junto', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 10)) { fx.xp(10 + G.andar * 2); fx.curaPct(0.15); return 'Sua voz se junta ao coral e a caverna inteira vibra! O maestro chora esporos de emoção.'; }
        fx.dano(3, 'Dor de ouvido em ópera de cogumelo'); return 'Você solta uma nota tão horrenda que três cogumelos desmaiam. O maestro tapa os ouvidos (se tivesse ouvidos).';
      } },
      { texto: '🍄 Colher um cogumelo escondido', acao: fx => {
        if (chance(0.5)) { fx.attrAleatorio(1); return 'Você come o cogumelo… e sente algo despertar! Seus sentidos ficam mais afiados.'; }
        fx.dano(5, 'Alucinação com cogumelo'); return 'Você come o cogumelo e vê o teto virar um tobogã. Depois de uma hora de delírio, você acorda deitado, com dor de cabeça.';
      } },
      { texto: '👏 Só aplaudir', acao: fx => { fx.energia(6); return 'Os cogumelos fazem uma reverência e te dão um chá de brotos. Revigorante.'; } },
    ],
  },
  {
    id: 'karaoke_esqueletos', titulo: 'Karaokê dos Esqueletos', icone: '🎤', peso: 9, cond: p => zonaDe(p) === 1,
    texto: 'Em um canto das catacumbas, esqueletos com microfones cantam um sertanejo desafinado: <i>“Meus ossos… doem de saudade…”</i> Um deles te passa o microfone: <i>“Sua vez, vivo!”</i>',
    escolhas: [
      { texto: '🎤 Cantar um clássico', dica: 'Teste de Sorte', acao: fx => {
        if (fx.teste('sor', 11)) { fx.ouro(30 + G.andar * 2); fx.xp(8 + G.andar); return 'Você manda um clássico de arrepiar. Os esqueletos choram (de rir? de emoção?) e jogam moedas no palco.'; }
        fx.dano(4, 'Vaiado por esqueletos'); return 'Você esquece a letra, desafina e é vaiado por um coro de ossos batendo. Um fêmur voa na sua direção.';
      } },
      { texto: '💻 Cantar o “Hello, World!” de Python', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 11)) { fx.xp(20 + G.andar * 2); fx.karma(1); return 'Você canta: “print… ABRE parênteses, ABRE aspas…”. A plateia enlouquece. É o primeiro hit de programação da catacumba.'; }
        fx.dano(3, 'Cantar código em karaokê'); return 'Ninguém entende a letra. Silêncio total. Um esqueleto tosse (pó).';
      } },
      { texto: '🔇 Desligar o som', acao: fx => { fx.karma(-1); fx.combate({ nome: 'Esqueleto Cantor Indignado', icone: '💀', hp: 1.3, atk: 1.2, def: 1, xp: 1.6, ouro: 1.6, falas: ['Você interrompeu o meu solo!'] }); return 'O silêncio é tão repentino quanto a fúria de um esqueleto sem o seu solo.'; } },
    ],
  },
  {
    id: 'arvore_cotovelo', titulo: 'Árvore Falante com Dor de Cotovelo', icone: '🌳', peso: 9, cond: p => zonaDe(p) === 2,
    texto: 'Uma árvore antiga, com um rostinho no tronco, suspira fundo: <i>“Ela me deixou… foi embora com o vento. Não pensou em mim, que a abrigava das chuvas…”</i> Uma folha seca cai no seu ombro.',
    escolhas: [
      { texto: '🙉 Ouvir o desabafo', acao: fx => { fx.xp(12 + G.andar * 2); fx.karma(1); fx.curaPct(0.1); return 'Você escuta por uma hora inteira. A árvore se sente melhor e te dá uma folha de chá medicinal.'; } },
      { texto: '💡 Dar conselhos de vida', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 12)) { fx.item({ bonus: 0.3 }); fx.karma(1); return '“Plante novas raízes!” A árvore ri, chora e te recompensa com algo que estava escondido no oco do tronco.'; }
        fx.dano(3, 'Galho atingiu sua cabeça'); return 'Seu conselho foi péssimo (“mude de ares”). A árvore, que não anda, derruba um galho na sua cabeça.';
      } },
      { texto: '🍂 Pegar as folhas curativas escondido', acao: fx => { fx.karma(-1); fx.consumivel('suco', 2); return 'Você enche os bolsos de folhas enquanto ela chora de costas. Sua consciência pesa, mas o chá é potente.'; } },
    ],
  },
  {
    id: 'churrasqueiro_eterno', titulo: 'Churrasqueiro Eterno do Vulcão', icone: '🔥', peso: 9, cond: p => zonaDe(p) === 3,
    texto: 'Em uma borda de lava, um churrasqueiro de avental torra espetinhos em uma grelha de rocha: <i>“Aqui é o único lugar onde o carvão nunca acaba. Chega mais, o povo!”</i>',
    escolhas: [
      { texto: '🍢 Aceitar um espetinho', acao: fx => {
        fx.curaPct(0.35);
        if (chance(0.25)) { fx.dano(6, 'Indigestão de churrasco vulcânico'); return 'Delicioso! Só que a pimenta era… vulcânica. Você passa o resto da tarde pensando na sua vida.'; }
        return 'Picanha no ponto, farofa crocante e vinagrete. A masmorra deveria ter mais lugares assim.';
      } },
      { texto: '🥩 Ajudar a virar a carne', dica: 'Teste de Força', acao: fx => {
        if (fx.teste('for', 12)) { fx.ouro(25 + G.andar * 2); fx.xp(10 + G.andar); return 'Você vira uma picanha de cinco quilos com uma só mão. O churrasqueiro paga com orgulho (e ouro).'; }
        fx.dano(5, 'Queimadura de espeto'); return 'A carne escorrega, você tenta segurar e queima a mão numa chapa de rocha derretida. Ai.';
      } },
      { texto: '📜 Pedir a receita secreta', acao: fx => { fx.attr('vit', 1); fx.xp(8); return 'Ele sussurra: “O segredo é… sal grosso e paciência.” Você anota. Sente-se mais resistente só de ouvir.'; } },
    ],
  },
  {
    id: 'roteador_perdido', titulo: 'Roteador Perdido do Abismo', icone: '📶', peso: 9, cond: p => zonaDe(p) === 4,
    texto: 'Entre as ilhas flutuantes, um roteador gigante pisca uma luz laranja, enroscado em cabos soltos: <i>“Conexão limitada. Sem acesso à internet.”</i> Ele parece cansado.',
    escolhas: [
      { texto: '🔌 Desligar e ligar de novo', dica: 'Teste de Inteligência', acao: fx => {
        if (fx.teste('int', 12)) { fx.inspirar(0.25, 3); fx.xp(15 + G.andar * 2); return 'As luzes viram verdes, uma a uma! “Conectado!” O Abismo inteiro ganha sinal por um instante, e você sente a energia da internet te inspirar.'; }
        fx.dano(4, 'Choque do roteador'); return 'Você tira o cabo errado. O roteador dá um choque de despedida e apaga.';
      } },
      { texto: '👢 Dar um chute (funciona com TV, deve funcionar aqui)', dica: 'Teste de Força', acao: fx => {
        if (fx.teste('for', 11)) { fx.ouro(20 + G.andar); return 'O roteador cospe uma bolsinha de moedas e volta a piscar. Tecnologia é mágica (e violência).'; }
        fx.dano(4, 'Chutou um roteador mal-humorado'); return 'Você acerta o poste, não o roteador. Sua canela reclama por todo o caminho.';
      } },
      { texto: '🔑 Tentar a senha “12345678”', acao: fx => {
        if (chance(0.5)) { fx.ouro(25); fx.karma(-1); return 'Funciona! Você conecta no “WiFi_do_Vizinho”, baixa uns arquivos e vende por ouro. Antiético? Um pouquinho.'; }
        return 'Senha errada. O roteador pede um CAPTCHA de 40 semáforos. Você desiste e segue.';
      } },
    ],
  },
];
EVENTOS.push(...EVENTOS_MAIS);
