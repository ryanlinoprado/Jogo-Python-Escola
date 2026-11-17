'use strict';
/* ============================================================
   SINERGIAS — itens e habilidades que ficam melhores JUNTOS.
   Dois tipos:
     1) TEMA: junte N coisas com a mesma etiqueta (tag). Ex.: 2 itens de "Cozinha".
        Itens equipados e habilidades aprendidas contam.
     2) COMBO: aprenda duas habilidades específicas. Ex.: Golpe Furtivo + Veneno.
   Cada sinergia dá bônus em números (mods) e/ou um efeito especial
   (flag), que é conferido no combate com temSin('nome-da-flag').
   Para criar uma nova: coloque tags em itens/habilidades e copie uma
   linha de SINERGIAS!
   ============================================================ */

const TAGS = {
  cozinha: { nome: 'Cozinha', icone: '🍳' },
  familia: { nome: 'Herança de Família', icone: '👵' },
  sorte: { nome: 'Sorte', icone: '🍀' },
  arcano: { nome: 'Arcano', icone: '📶' },
  sombra: { nome: 'Sombra', icone: '🌑' },
  ouro: { nome: 'Riqueza', icone: '💰' },
  fogo: { nome: 'Fogo', icone: '🔥' },
  pesado: { nome: 'Pesado', icone: '⚙️' },
  sagrado: { nome: 'Sagrado', icone: '☀️' },
  noite: { nome: 'Noite', icone: '🌙' },
};

/* Etiquetas de cada item (pelo id em dados.js) */
const TAGS_ITEM = {
  colher_pau: ['cozinha', 'familia'], garfo_afiado: ['cozinha'], faca_pao: ['cozinha', 'sombra'], panela_pressao: ['cozinha', 'pesado'],
  montante_churrasco: ['cozinha', 'fogo', 'pesado'], armadura_rei_churrasco: ['cozinha', 'fogo', 'pesado'],
  esp_enferrujada: ['familia'], esp_zecleiton: ['familia', 'pesado'], chinelo: ['familia', 'sorte'], capa_cortina: ['familia', 'sombra'], colete_sofa: ['familia'],
  machado_lenha: ['pesado'], armadura_latinhas: ['pesado'],
  /* sagrados (Clérigo) */
  martelo_obra: ['sagrado', 'pesado'], cetro_coral: ['sagrado'], maca_sol: ['sagrado', 'fogo'], maca_arathor: ['sagrado', 'fogo'], rosario_gigante: ['sagrado'],
  batina_kevlar: ['sagrado'], manto_solar: ['sagrado'], medalha_santo: ['sagrado', 'sorte'], terco_vovo: ['sagrado', 'familia'], sol_bolso: ['sagrado', 'fogo'],
  /* pesados (Bárbaro) */
  machado_brutus: ['pesado'], marreta_demolidor: ['pesado'], clava_titan: ['pesado'],
  pe_coelho: ['sorte'], moeda_furada: ['sorte', 'ouro'], cueca_sorte: ['sorte'], coroa_papelao: ['sorte', 'ouro'], varinha_zequinha: ['sorte', 'arcano'], joia_camelo: ['sorte'],
  varinha_pisca: ['arcano'], cajado_pardal: ['arcano'], cajado_wifi: ['arcano'], livro_pirata: ['arcano'], manto_sem_wifi: ['arcano'], amuleto_wifi: ['arcano'],
  punhais_bruno: ['sombra'], adaga_esquecimento: ['sombra'], katana_ninja: ['sombra'], capa_invisivel: ['sombra', 'noite'], relogio_atrasado: ['sombra', 'noite'],
};
/* Etiquetas de cada habilidade (pelo id em dados.js) */
const TAGS_HAB = {
  bola_fogo: ['fogo'], meteoro: ['fogo', 'arcano'], mente_afiada: ['arcano'], escudo_arcano: ['arcano'], meditacao: ['arcano'],
  golpe_furtivo: ['sombra'], fumaca: ['sombra', 'noite'], pes_ligeiros: ['sombra'], trevo: ['sorte'], sorte_ladrao: ['sorte'],
  maos_leves: ['ouro'], cofrinho: ['ouro'], pele_pedra: ['pesado'], escudada: ['pesado'], golpe_poderoso: ['pesado'],
  giro_lamina: ['pesado'], casca_grossa: ['pesado'], furia_almoco: ['cozinha'],
  luz_sagrada: ['sagrado'], mao_curadora: ['sagrado'], martelada_santa: ['sagrado', 'pesado'], chama_varthos: ['fogo'], bencao_escudo: ['sagrado'],
  pele_ferro: ['pesado'], machadada_dupla: ['pesado'], couro_grosso: ['pesado'], sangue_quente: ['cozinha'],
  fe_inabalavel: ['sagrado'], vestes_bencao: ['sagrado'], devocao: ['sagrado', 'sorte'],
};

/* req: { tag, n }  → tema      |      req: { skills: [ids] } → combo de habilidades */
const SINERGIAS = [
  /* ----- Temas ----- */
  { id: 'banquete', nome: 'Banquete Completo', icone: '🍽️', req: { tag: 'cozinha', n: 2 }, mods: { hp: 20, vit: 1 }, flag: 'banquete', desc: '+20 vida máx., +1 Vitalidade e as poções de vida curam 25% a mais.' },
  { id: 'heranca', nome: 'Herança de Família', icone: '🏡', req: { tag: 'familia', n: 2 }, mods: { def: 2, ca: 1 }, desc: '+2 de defesa e +1 de CA. A vovó protege.' },
  { id: 'trevo_triplo', nome: 'Trevo Triplo', icone: '🍀', req: { tag: 'sorte', n: 3 }, mods: { crit: 8 }, flag: 'rerrola', desc: '+8% de crítico. Uma vez por combate, um 1 natural é rolado de novo.' },
  { id: 'sinal_forte', nome: 'Sinal Forte', icone: '📶', req: { tag: 'arcano', n: 2 }, mods: { en: 4, int: 1 }, desc: '+4 de energia máxima e +1 Inteligência. Quatro barrinhas!' },
  { id: 'sombra_dancante', nome: 'Sombra Dançante', icone: '🌑', req: { tag: 'sombra', n: 2 }, mods: { esq: 5, ca: 1 }, flag: 'emboscada', desc: '+5% de esquiva, +1 de CA. O primeiro golpe de cada combate: +3 de acerto e +50% de dano.' },
  { id: 'bolso_cheio', nome: 'Bolso Cheio', icone: '💰', req: { tag: 'ouro', n: 2 }, mods: { ouro: 0.3, sor: 1 }, desc: '+30% de ouro dos combates e +1 Sorte.' },
  { id: 'fornalha', nome: 'Fornalha Acesa', icone: '🔥', req: { tag: 'fogo', n: 2 }, mods: { for: 1, int: 1 }, flag: 'fornalha', desc: '+1 Força, +1 Inteligência e a queimadura causa 50% a mais de dano.' },
  { id: 'muralha', nome: 'Muralha de Ferro', icone: '⚙️', req: { tag: 'pesado', n: 2 }, mods: { def: 3 }, flag: 'contra', desc: '+3 de defesa. Quando um inimigo erra você, você contra-ataca com 60% do seu ataque.' },
  { id: 'comunhao', nome: 'Comunhão Radiante', icone: '🌅', req: { tag: 'sagrado', n: 3 }, mods: { vit: 2, regen: 1 }, desc: '+2 Vitalidade e +1 de regeneração por turno. A luz está com você.' },
  { id: 'luz_plena', nome: 'Luz Plena', icone: '🌞', req: { tag: 'sagrado', n: 5 }, mods: { roubaVida: 0.1, crit: 6 }, desc: '+10% de roubo de vida e +6% de crítico. Todo mundo semicerra os olhos.' },
  { id: 'criaturas_noite', nome: 'Criaturas da Noite', icone: '🌙', req: { tag: 'noite', n: 2 }, mods: { esq: 4, crit: 5 }, desc: '+4% de esquiva e +5% de crítico. A noite é sua amiga.' },
  /* ----- Sinergias de RAÇA (campo "raca": só valem para quem tem aquela raça; a raça também conta como etiqueta) ----- */
  { id: 'luz_estelar', nome: 'Luz Estelar', icone: '✨', raca: 'elfo', req: { tag: 'arcano', n: 3 }, mods: { int: 2, en: 3 }, desc: 'Elfo com magia de sobra: +2 Inteligência e +3 de energia máx.' },
  { id: 'forja_ana', nome: 'Forja Anã', icone: '⚒️', raca: 'anao', req: { tag: 'pesado', n: 2 }, mods: { def: 2, hp: 15 }, desc: 'Anão com ferro de verdade: +2 de defesa e +15 de vida máx.' },
  { id: 'sorte_pequena', nome: 'Sorte de Halfling', icone: '🍀', raca: 'halfling', req: { tag: 'sorte', n: 2 }, mods: { sor: 1, crit: 5 }, desc: '+1 Sorte e +5% de crítico. Pequeno, mas o destino gosta dele.' },
  { id: 'sangue_guerra', nome: 'Sangue de Guerra', icone: '🩸', raca: 'orc', req: { tag: 'pesado', n: 2 }, mods: { for: 2, hp: 10 }, desc: 'Orc com equipamento pesado: +2 Força e +10 de vida máx.' },
  { id: 'rei_goblin', nome: 'Rei dos Goblins', icone: '💰', raca: 'goblin', req: { tag: 'ouro', n: 3 }, mods: { ouro: 0.3, sor: 1 }, desc: '+30% de ouro e +1 Sorte. O bolso mais cheio da masmorra.' },
  { id: 'chama_ancestral', nome: 'Chama Ancestral', icone: '🐉', raca: 'draconato', req: { tag: 'fogo', n: 2 }, mods: { for: 1, int: 1 }, flag: 'fornalha', desc: '+1 Força, +1 Inteligência e a queimadura causa 50% a mais de dano.' },
  { id: 'cria_cripta', nome: 'Cria da Cripta', icone: '⚰️', raca: 'morto_vivo', req: { tag: 'noite', n: 2 }, mods: { def: 2, hp: 20 }, desc: '+2 de defesa e +20 de vida máx. A morte é só um começo.' },
  { id: 'filho_noite', nome: 'Filho da Noite', icone: '🦇', raca: 'vampiro', req: { tag: 'noite', n: 2 }, mods: { roubaVida: 0.05, crit: 6 }, desc: '+5% de roubo de vida e +6% de crítico. O escuro obedece você.' },
  { id: 'bando', nome: 'Bando Unido', icone: '🐾', req: { aliados: 2 }, mods: { ca: 1, acerto: 1 }, flag: 'bando', desc: 'Com 2 companheiros: +1 de CA, +1 de acerto e os efeitos deles ficam 25% mais fortes.' },
  /* ----- Combos de habilidades ----- */
  { id: 'redentora', nome: 'Luz Redentora', icone: '✨', req: { skills: ['luz_sagrada', 'mao_curadora'] }, flag: 'redentora', desc: 'A Luz de Arathor cura o dobro (20% da vida máxima).' },
  { id: 'martelo_ardente', nome: 'Martelo Ardente', icone: '🔨', req: { skills: ['martelada_santa', 'chama_varthos'] }, flag: 'martelo_ardente', desc: 'A Martelada Santa também incendeia o alvo por 3 turnos.' },
  { id: 'santuario', nome: 'Santuário', icone: '⛪', req: { skills: ['mao_curadora', 'bencao_escudo'] }, flag: 'santuario', desc: 'A Mão Curadora também cria um escudo igual a 50% da cura.' },
  { id: 'lamina', nome: 'Lâmina Envenenada', icone: '☠️', req: { skills: ['golpe_furtivo', 'veneno'] }, flag: 'lamina', desc: 'O Golpe Furtivo também envenena o alvo por 3 turnos.' },
  { id: 'choque', nome: 'Choque Térmico', icone: '🧊', req: { skills: ['bola_fogo', 'raio_gelido'] }, flag: 'choque', desc: 'O Raio Gélido sempre congela (atordoa) um inimigo que esteja queimando.' },
  { id: 'berserker', nome: 'Berserker', icone: '😡', req: { skills: ['grito_guerra', 'golpe_poderoso'] }, flag: 'berserker', desc: 'Com o Grito de Guerra ativo, o Golpe Poderoso ganha +4 de acerto e ignora a defesa.' },
  { id: 'escudo_ardente', nome: 'Escudo Ardente', icone: '🛡️', req: { skills: ['escudo_arcano', 'bola_fogo'] }, flag: 'escudo_ardente', desc: 'Enquanto o seu escudo arcano durar, todos os seus golpes causam +25% de dano.' },
  { id: 'vampiro_aco', nome: 'Vampiro de Aço', icone: '🧛', req: { skills: ['sede_sangue', 'pele_pedra'] }, mods: { roubaVida: 0.08, def: 1 }, desc: '+8% de roubo de vida e +1 de defesa.' },
  { id: 'predador', nome: 'Predador', icone: '🐯', req: { skills: ['olho_tigre', 'mira_certeira'] }, mods: { crit: 6, acerto: 1 }, desc: '+6% de crítico e +1 de acerto.' },
  { id: 'zen', nome: 'Zen de Combate', icone: '☯️', req: { skills: ['foco_total', 'postura_defensiva'] }, flag: 'zen', desc: 'Foco Total e Postura Defensiva duram 2 turnos a mais.' },
  { id: 'gatuno', nome: 'Gatuno Fantasma', icone: '🥷', req: { skills: ['pes_ligeiros', 'maos_leves'] }, mods: { ouro: 0.2, esq: 4 }, desc: '+20% de ouro e +4% de esquiva.' },
  { id: 'folego', nome: 'Segundo Fôlego', icone: '😮‍💨', req: { skills: ['casca_grossa', 'respirar'] }, mods: { hp: 15 }, flag: 'folego', desc: '+15 de vida máx. e Respirar Fundo cura 15% a mais.' },
];

const tagsItem = it => (it && TAGS_ITEM[it.id]) || [];
const tagsHab = id => TAGS_HAB[id] || [];

/** Conta quantas coisas de cada tema o personagem tem (itens equipados + habilidades). */
function contaTags(p) {
  const c = {};
  const soma = ts => ts.forEach(t => { c[t] = (c[t] || 0) + 1; });
  for (const sl of ['arma', 'armadura', 'amuleto']) soma(tagsItem(p.equip && p.equip[sl]));
  for (const id of (p.skills || [])) soma(tagsHab(id));
  for (const a of (p.aliados || [])) soma((ALIADOS[a.id] || {}).tags || []);   // os companheiros também têm temas
  soma((RACAS[p.raca] || {}).tags || []);                                       // e a raça do herói também
  return c;
}

/** [quanto já tem, quanto precisa] para uma sinergia. */
function progressoSin(p, s) {
  if (s.raca && p.raca !== s.raca) return [0, s.req.n];   // sinergia de outra raça: nunca aparece para você
  if (s.req.aliados) return [Math.min((p.aliados || []).length, s.req.aliados), s.req.aliados];
  if (s.req.tag) return [Math.min(contaTags(p)[s.req.tag] || 0, s.req.n), s.req.n];
  const tem = (p.skills || []);
  return [s.req.skills.filter(id => tem.includes(id)).length, s.req.skills.length];
}
const sinCompleta = (p, s) => { const [a, b] = progressoSin(p, s); return a >= b; };
const sinergiasAtivas = p => SINERGIAS.filter(s => sinCompleta(p, s));
/** O personagem atual tem o efeito especial "flag" ligado? */
const temSin = flag => !!G && sinergiasAtivas(G).some(s => s.flag === flag);

/** Texto "o que falta" de uma sinergia em andamento. */
function faltaSin(s) {
  if (s.req.aliados) return `🐾 ${s.req.aliados} companheiros`;
  if (s.req.tag) return `${TAGS[s.req.tag].icone} ${TAGS[s.req.tag].nome} ×${s.req.n}`;
  return s.req.skills.map(id => HABILIDADES[id] ? `${HABILIDADES[id].icone} ${HABILIDADES[id].nome}` : id).join(' + ');
}
const chipsTags = ts => ts.map(t => `<span class="tag-chip" title="${TAGS[t].nome}">${TAGS[t].icone} ${TAGS[t].nome}</span>`).join('');
