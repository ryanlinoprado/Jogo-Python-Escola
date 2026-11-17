# 🐍 A Masmorra do Pythonildo

Jogo de aventura roguelike para navegador. Sem instalação, sem dependências.

## Como jogar

**Sozinho / teste rápido:** abra o `index.html` no navegador (o ranking fica salvo só naquele navegador).

**Com a turma (ranking compartilhado):**
```
python servidor.py
```
O terminal mostra o endereço (ex.: `http://192.168.0.10:8080`). Os alunos, na mesma rede, abrem esse endereço.
O ranking fica no arquivo `ranking.json` (apague-o para zerar). As criações publicadas na Oficina ficam em `oficina.json` (apague o arquivo para zerar tudo, ou edite-o para remover uma criação específica).

## Regras em resumo
- 5 classes, cada uma com arma, habilidade e passiva próprias: Guerreiro, Ladino, Mago, o **Bárbaro 🪓** (o mais resistente de todos: muita vida e defesa, em troca de 10% menos de dano) e o **Clérigo 🌞** (classe secreta: cura, regenera vida e tira o dano da Vitalidade). O Clérigo é liberado ao chegar ao **andar 10** em qualquer aventura (fica gravado no navegador). Para demonstrar em aula sem jogar até lá, abra o jogo com `?liberar` no final do endereço (ex.: `http://localhost:8080/?liberar`).
- Distribua 10 pontos entre Força, Destreza, Inteligência, Vitalidade e Sorte.
- A cada nível, escolha 1 entre 3 cartas (nova habilidade, melhoria ou atributo).
- **🗺️ Mapa ramificado:** cada zona tem 5 andares: 4 de escolha e o chefão no fim. Você vê um mapa de salas (combate, elite, evento, loja, fogueira, tesouro) ligadas por caminhos, e só pode ir para as salas ligadas à que acabou de vencer. Planeje a rota: fugir das elites e passar por fogueiras, ou arriscar por mais recompensa? Antes do chefão há sempre uma fogueira (e às vezes uma loja). No Desafio do Dia o mapa também é igual para todos.
- **Combate com dados (d20):** todo ataque rola d20 + bônus de acerto contra a **CA** (Classe de Armadura) do alvo. **20 natural = crítico** (dano dobrado, acerta sempre); **1 natural = erro automático**. Destreza e Sorte altas ampliam a faixa de crítico (19–20, 18–20…). Armaduras, itens, passivas e habilidades (Foco Total, Postura Defensiva…) mexem em acerto e CA. Os inimigos também rolam d20 contra a sua CA.
- **Testes de eventos:** d20 + atributo contra a dificuldade. 20 natural = sucesso crítico (recompensas dobradas); 1 natural = falha crítica (dano +50%).
- Eventos têm escolhas com consequências (alguns lembram do que você fez antes!). Tem até pergunta de Python!
- **🎲 53 eventos aleatórios.** Os mais novos (`eventos2.js`):
  - **Code Review do Fantasma Sênior:** mostra um código Python com bug de verdade e 3 correções. Acertar dá XP e ouro, errar machuca e mostra a resposta certa (12 bugs, sem repetir). 3 acertos na aventura dão a conquista *Revisor de Código*.
  - **Eventos em cadeia (lembram do que você fez):** guardar a carta do *Pombo-Correio* leva ao *Destinatário da Carta*; ajudar o *Entregador de Pizza* traz *A Pizza Chegou!*, mas comer a pizza dele sem pagar traz *O Entregador Furioso*.
  - **Seguro de Vida do gnomo:** se você contratar, quando morrer volta com 25% de vida (uma vez; a Moeda de Lysara, se você tiver, é usada primeiro).
  - **Portal Cor-de-Rosa:** pode pular um andar inteiro (ou cair numa luta).
  - **Eventos de zona:** só aparecem na sua zona (coral de cogumelos nas Cavernas, karaokê de esqueletos nas Catacumbas, árvore falante na Floresta, churrasqueiro no Vulcão, roteador perdido no Abismo).
  - E ainda: máquina de refrigerante, reunião de condomínio dos monstros, poça de lama, loja de conveniência do além, pescaria no esgoto, aniversário do slime e "Você, mas mais velho".
- Ranking: maior pontuação (o andar vale muito, e os modificadores multiplicam), depois andar mais alto.

## Desafios (motivos para jogar de novo)
- **📅 Desafio do dia:** todo mundo enfrenta a mesma masmorra no dia (mesmas salas, inimigos, eventos e loja), com 1 modificador sorteado pela data. Tem ranking só do dia. Funciona porque o jogo usa um *gerador com semente* (a data de hoje).
- **😈 Modificadores:** antes de começar, escolha até 3 regras malucas (Só Cura em Fogueira, Armaduras Reforçadas, Invasão Gnômica, Canhão de Vidro…). Cada uma aumenta a pontuação (+10% a +40%).
- **🔗 Sinergias:** itens e habilidades têm *temas* (🍳 Cozinha, 🍀 Sorte, 🌑 Sombra, 📶 Arcano, ⚙️ Pesado…). Juntar 2–3 do mesmo tema, ou combinar certas habilidades (Golpe Furtivo + Veneno, Bola de Fogo + Raio Gélido…), liga uma de 23 sinergias com bônus e efeitos especiais. A ficha mostra as ativas e as quase completas, a tela do item avisa se ele liga/desliga uma, e as cartas de nível destacam as que completam uma.
- **🐾 Aliados e pets:** 7 companheiros (Caramelo, Dragãozinho, Pedro o Goblin Mercenário, Seu Genivaldo, o Gato de Botas, o Aluno Fantasma e a Tia Zélia) aparecem em eventos. Você leva até 2. Cada um dá bônus passivos, age em combate (ataca, cospe fogo, cria escudo, cura, protege), pode ser alvo dos inimigos e desmaia (volta depois do combate). Cada vitória que vive com você aumenta o *vínculo*, e ele sobe até o nível 5. Com 2 companheiros, ativa a sinergia Bando Unido.
- **⚡ Chefões com fases:** cada chefão muda de comportamento quando a vida dele cai (marcas na barra de vida: 50% e 20%; o Cobrão final tem 3 mudanças). Cada fase tem uma fala, um nome e efeitos: ataque maior, mais CA, golpe especial mais frequente, ataques duplos, escudo, regeneração, aura de dano ou drenagem da sua energia. A cada fase nova o chefão ruge e perde a vez, um respiro para você. Dá para derrotá-lo antes de uma fase começar (conquista **Matador Relâmpago**).
- **🛠️ Oficina do Aprendiz:** no menu, o aluno cria **inimigos** e **itens** num formulário (ícone, vida, ataque, traço, bônus, tema de sinergia, frases…). A tela mostra ao vivo o **código de `dados.js`** equivalente, com botão de copiar, e dá para testar o inimigo num **duelo de teste** (sem mexer no ranking). O que ele cria entra nas aventuras daquele navegador (menos no Desafio do Dia) e pode ser **publicado para a turma**: todos passam a enfrentar/achar as criações dos colegas (com o nome do autor). Para equilibrar, itens têm **orçamento de pontos por raridade** e o XP e o ouro de um inimigo são calculados pela força dele. Sem servidor, dá para trocar criações por **Exportar/Importar**.
- **👩‍🏫 Modo Professor** (botão discreto no fim do menu):
  - **📺 Projetar ranking:** ranking gigante para a lousa, que se atualiza sozinho a cada 8 segundos. Mostra o top 10, o Desafio do Dia, as últimas partidas e epitáfios engraçados. Partidas dos últimos 10 minutos piscam. Tem botão de tela cheia (Esc sai).
  - **📊 Estatísticas:** partidas e jogadores, até onde a turma chega por zona, classes preferidas, o que mais derrota a turma, chefões mais letais, modificadores, conquistas, companheiros e um mural de epitáfios.
  - **🧹 Moderação:** apagar uma partida, zerar o ranking, remover criações da Oficina e **baixar a planilha (CSV)** com os resultados.
  - **Segurança:** todos podem *ver* as telas, mas só o computador que roda o servidor consegue *apagar*. Abra o jogo por `http://localhost:8080` no computador do professor. Alunos em outros computadores não conseguem apagar nada.
- **🎵 Música por zona:** cada zona tem a sua trilha, gerada por código (nada de arquivos de áudio): o menu e a lápide também têm a deles. Cada uma tem escala, acordes, andamento e instrumentos próprios (cavernas misteriosas, catacumbas com sinos, floresta com "bugs" eletrônicos, vulcão pesado, abismo com sonar de Wi-Fi). Em combate entra a bateria, e no chefão o ritmo acelera e fica intenso. A troca de zona faz uma transição suave. A música só começa depois do primeiro clique (regra dos navegadores). O botão **🎵** liga/desliga só a música (e fica gravado), e o **🔊** desliga tudo. O projetor do Modo Professor é silencioso.
- **💡 Guia para iniciantes:** cada classe mostra com qual atributo ataca e lança habilidades (ex.: Mago = Inteligência, Ladino = Destreza) e quais atributos mais importam. Na tela de atributos, o principal ganha o selo ⭐ e há um "Como os atributos funcionam?" com as fórmulas de dano, acerto, energia e defesa. Ao criar uma classe nova, preencha `foco` e `dica` em `CLASSES`.
- **🧬 9 raças** (escolha entre a classe e os atributos), que se combinam com qualquer classe. Cada uma tem bônus e penalidades de atributo, um poder próprio, uma fraqueza, etiqueta de sinergia, rivais e parentes entre os monstros, amigos e desafetos entre os companheiros e um evento exclusivo:
  - **Abertas desde o início:** 🧑 Humano (+10% de XP), 🧝 Elfo (acerto e crítico), ⛏️ Anão (veneno pela metade, mais ouro), 🍀 Halfling (refaz um teste de evento por andar).
  - **Secretas, liberadas por feitos:** 👹 Orc (derrote um chefão), 👺 Goblin (junte 600 de ouro), 🐲 Draconato (derrote o Dragão Fofão), 🧟 Morto-vivo (derrote o Lich Linguiça) e 🧛 **Vampiro**: perca para o **Conde Vladislau**, um chefão com fases que oferece um jantar de vez em quando a partir do andar 6!
  - Para demonstrar em aula sem cumprir os feitos, abra com `?liberar` no endereço (libera também a classe secreta).
- **🏅 Conquistas e títulos:** 34 conquistas (Intocável, Azarado Profissional, Derrubador de Estátuas…). Ficam guardadas no navegador, e a mais rara de cada aventura vira o título ao lado do nome no ranking.
- **⚰️ Lápide compartilhável:** ao morrer, um epitáfio engraçado conforme a causa da morte, com botões para copiar o texto e baixar a imagem.

## Como o código está organizado
O motor do jogo é dividido em **módulos** (arquivos pequenos, cada um com uma responsabilidade). O `index.html` os carrega nesta ordem:

`dados.js` → `eventos.js` → `deuses.js` → `cenario.js` → `desafios.js` → `sinergias.js` → `aliados.js` → `eventos2.js` → `racas.js` → **motor** (`nucleo.js` → `regras.js` → `telas.js` → `mapa.js` → `combate.js` → `salas.js` → `inventario.js` → `fim.js` → `inicio.js`) → `oficina.js` → `professor.js` → `musica.js`

- Os arquivos de **conteúdo** (`dados.js`, eventos, `desafios.js`, `sinergias.js`, `aliados.js`…) só têm listas de dados: é onde os alunos mexem mais.
- O **motor** transforma esses dados em jogo. Os módulos compartilham o mesmo espaço global (não usamos `import`, para o jogo continuar abrindo direto no navegador). Por isso **dois arquivos nunca podem declarar o mesmo nome**: o teste de qualidade confere isso.
- Regra de ouro: nenhum arquivo do jogo passa de 650 linhas. Passou? Hora de dividir.

## Testes
O jogo tem testes automáticos (mais de 190), para você mexer sem medo de quebrar algo escondido.
- **Navegador:** com o servidor rodando, abra `http://localhost:8080/testes.html`. Os testes rodam sozinhos e mostram ✅/❌ (a versão `testes.html?rapido` pula as partidas completas do robô). Eles **não** mexem no seu ranking nem no seu save.
- **Servidor (Python):** `python testes_servidor.py` (usa uma pasta temporária, só a biblioteca padrão).
- O que eles conferem: dados do jogo (itens, eventos, sinergias…), regras de combate d20, mapa, eventos, Oficina, música, Modo Professor, qualidade do código (nomes repetidos, arquivos gigantes, `'use strict'`) e partidas inteiras jogadas por um robô.
- Conferem também que as regras do servidor (Python) e do navegador (JavaScript) continuam iguais.

## Versionamento (git)
A pasta é um repositório **git**: ele guarda o histórico do projeto, para você poder desfazer mudanças e comparar versões.
```
git status                 # o que mudou desde o último commit
git diff                   # ver as linhas alteradas
git add .                  # preparar tudo para o commit
git commit -m "mensagem"   # gravar uma versão (escreva o que mudou)
git log --oneline          # histórico
git restore arquivo.js     # desfazer as mudanças de UM arquivo (volta ao último commit)
```
- **Antes de commitar, rode os testes** (`testes.html`): se tudo estiver ✅, pode gravar.
- `ranking.json` e `oficina.json` (dados da turma) ficam fora do histórico de propósito: veja o `.gitignore`.
- Primeira vez no computador? Configure o seu nome: `git config user.name "Seu Nome"` e `git config user.email "voce@exemplo.com"`.
- Com a turma: cada aluno pode criar um *branch* (`git switch -c minha-criacao`) para testar uma ideia sem estragar o jogo principal.

## Arquivos (ótimos para as aulas!)
| Arquivo | O que tem |
|---|---|
| `dados.js` | Classes, habilidades, itens, inimigos, chefes, perguntas de Python. **Comece por aqui.** |
| `eventos.js` | Eventos aleatórios e suas consequências. |
| `deuses.js` | Os 8 deuses, bênçãos, o sonho de Nythria e eventos extras. |
| `desafios.js` | Semente do dia, modificadores, conquistas e epitáfios. Fácil de estender! |
| `musica.js` | A trilha sonora: escalas, músicas de cada zona, sintetizador e maestro. |
| `professor.js` | O Modo Professor: projetor, estatísticas e moderação. |
| `oficina.js` | A Oficina do Aprendiz: regras de equilíbrio, validação, telas e a API da turma. |
| `eventos2.js` | Mais eventos aleatórios, a lista `BUGS` do Code Review e os eventos em cadeia. |
| `aliados.js` | Os companheiros (ALIADOS) e os eventos que os dão. Fácil de estender! |
| `racas.js` | As 9 raças (RACAS), os ganchos de cada efeito, o Conde Vladislau, os eventos de raça e a tela de escolha. Fácil de estender! |
| `sinergias.js` | Temas (tags) de itens e habilidades e a lista de sinergias. Fácil de estender! |
| `cenario.js` | Os fundos animados (menu e uma cena por zona), desenhados em SVG por código. |
| `nucleo.js` | Motor 1/9: utilidades, sorteios, armazenamento, som e ranking. |
| `regras.js` | Motor 2/9: o personagem (`stats()`, XP, sorteio de itens). |
| `telas.js` | Motor 3/9: `tela()`, HUD, menu, classe e atributos, modificadores, conquistas. |
| `mapa.js` | Motor 4/9: salvamento, mapa ramificado, `entrarSala()` e `avancar()`. |
| `combate.js` | Motor 5/9: combate d20, habilidades, fases dos chefões, companheiros. |
| `salas.js` | Motor 6/9: eventos (`criaFx`), fogueira, tesouro e loja. |
| `inventario.js` | Motor 7/9: itens, cartas de nível e ficha do personagem. |
| `fim.js` | Motor 8/9: game over, lápide e ranking. |
| `inicio.js` | Motor 9/9: liga tudo e abre o menu (sempre o último do motor). |
| `style.css` | Visual. |
| `servidor.py` | Servidor em Python (só biblioteca padrão) + API do ranking e da Oficina. |
| `testes.html` e pasta `testes/` | A suíte de testes do jogo (veja a seção **Testes** abaixo). |
| `testes_servidor.py` | Os testes do servidor, em Python. |

## Desafios para os alunos
1. Criar um inimigo novo em `INIMIGOS` (copie um e mude nome, ícone e números).
2. Criar um item lendário novo em `ITENS`.
3. Criar uma habilidade nova em `HABILIDADES`.
4. Escrever um evento novo em `eventos.js` com 3 escolhas.
5. Adicionar mais perguntas em `QUIZ`.
6. (Python) Fazer o `servidor.py` guardar também a data/hora formatada, ou criar uma rota `/api/top3`.
7. (Avançado) Criar a classe "Bardo" (use o Clérigo como modelo em `CLASSES`: arma, habilidades, itens, tags e uma passiva própria).
8. Criar um modificador novo em `MODIFICADORES` (e programar o efeito com `temMod('id')` em `combate.js`, `mapa.js` ou `regras.js`).
9. Criar uma conquista nova em `CONQUISTAS` (o `teste` é uma função que devolve true/false).
10. Escrever frases novas de epitáfio em `criaEpitafio()`.
11. Criar uma sinergia nova em `SINERGIAS` (`sinergias.js`): escolha um tema ou duas habilidades, os bônus em `mods` e, se quiser um efeito especial, uma `flag` conferida com `temSin()` no `combate.js`.
12. Colocar tags em mais itens (`TAGS_ITEM`) ou criar um tema novo em `TAGS`.
13. Mexer em `gerarMapaBase()` (`mapa.js`): mudar a largura das linhas, os pesos dos tipos de sala ou a chance de um caminho se ramificar. (Desafio: criar uma sala nova, como "Cassino da Lysara".)
14. Criar um companheiro novo em `ALIADOS` (`aliados.js`) e um evento que chame `fx.aliado('id')`. Quer uma ação nova (ex.: "rouba ouro")? Programe um `tipo` novo em `turnoAliados()` no `combate.js`.
15. Dar fases novas a um chefão em `CHEFES` (`dados.js`): copie um item de `fases` e mude `hp`, `titulo`, `fala` e os efeitos. Quer um efeito novo? Programe em `entraFase()` no `combate.js`.
16. Criar um inimigo e um item na Oficina, copiar o código gerado e colar nas listas `INIMIGOS`/`ITENS` do `dados.js`. Depois, comparar: o que o formulário não deixa fazer?
17. Estender a Oficina: criar companheiros ou eventos por formulário (`oficina.js` e `servidor.py`). Lembre de validar tudo no servidor!
18. Criar uma estatística nova no Modo Professor (`estatisticas()` em `professor.js`), por exemplo "o horário em que mais se morre" ou "o item que mais aparece nos melhores".
19. (Python) Entender `eh_professor()` no `servidor.py`: por que só o computador do servidor pode apagar? Que ataque isso evita?
20. Compor a música de uma zona nova em `MUSICAS` (`musica.js`): escolha uma escala, uma sequência de acordes (`prog`), um andamento (`bpm`) e o padrão do baixo. Mude só o `seed` e ouça outra melodia! Depois crie uma escala nova em `ESCALAS` (ex.: pentatônica).
21. (Matemática + Python) Em `hzDeMidi()`, a fórmula `440 * 2^((m-69)/12)` converte a nota em frequência. Por que a nota do piano dobra de frequência a cada 12 teclas?
22. Adicionar bugs novos à lista `BUGS` (`eventos2.js`): escreva um código com um erro que você viu na aula, a mensagem do computador, a correção certa e duas erradas. Seus colegas vão ser "reprovados" pelo seu bug!
23. Criar um evento em cadeia: um evento que ativa uma `flag` (ex.: `fx.flag('ajudei')`) e outro com `cond: p => p.flags.ajudei` que aparece depois, com recompensa ou vingança.
24. (Python) Criar uma rota `/api/hoje` no `servidor.py` que devolva só o ranking do dia.

23. Rodar os testes (`testes.html`), quebrar algo de propósito (ex.: apague a `habilidade` de uma classe em `dados.js`) e ver qual teste avisa. Depois escreva um teste novo em `testes/` para uma regra que você criou!

24. Usar o git: crie um *branch* (`git switch -c meu-monstro`), adicione um inimigo, rode os testes, grave um commit e veja o histórico com `git log --oneline`.
