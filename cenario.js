'use strict';
/* ============================================================
   CENÁRIOS — fundos desenhados em SVG, um para o menu e um para
   cada zona da masmorra. Tudo é gerado por código (sem imagens!).
   Para criar um cenário novo: faça uma função em CENARIOS que
   devolva um texto SVG e chame-a pelo nome.
   ============================================================ */
const CEN = { W: 1200, H: 700 };

// gerador de números repetível: o cenário fica igual a cada visita
function semente(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function estrelasCeu(n, r, ymax = 360) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = r() * CEN.W, y = r() * ymax, t = 0.6 + r() * 1.6, d = (2 + r() * 4).toFixed(1);
    o += `<circle cx="${x | 0}" cy="${y | 0}" r="${t.toFixed(1)}" fill="#fff" class="pisca" style="animation-duration:${d}s;animation-delay:-${(r() * 5).toFixed(1)}s"/>`;
  }
  return o;
}

function pinheiros(n, r, base, h, cor, x0 = 0, x1 = CEN.W) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), a = h * (0.6 + r() * 0.7), l = a * 0.32;
    o += `<path d="M${x | 0} ${base - a | 0} l${l | 0} ${a * 0.45 | 0} h${-l * 0.5 | 0} l${l * 0.7 | 0} ${a * 0.3 | 0} h${-l * 0.6 | 0} l${l * 0.6 | 0} ${a * 0.25 | 0} h${-l * 2.5 | 0} l${l * 0.6 | 0} ${-a * 0.25 | 0} h${-l * 0.6 | 0} l${l * 0.7 | 0} ${-a * 0.3 | 0} h${-l * 0.5 | 0} z" fill="${cor}"/>`;
  }
  return o;
}

function colinas(base, amp, cor, r, passos = 8) {
  let d = `M0 ${CEN.H} L0 ${base}`;
  const w = CEN.W / passos;
  for (let i = 1; i <= passos; i++) d += ` Q${(i - 0.5) * w | 0} ${base - amp * (0.3 + r()) | 0} ${i * w | 0} ${base - amp * 0.4 * r() | 0}`;
  return `<path d="${d} L${CEN.W} ${CEN.H} Z" fill="${cor}"/>`;
}

function neblina(y, cor, cls) {
  return `<g class="${cls}"><ellipse cx="200" cy="${y}" rx="320" ry="26" fill="${cor}"/><ellipse cx="650" cy="${y + 14}" rx="380" ry="30" fill="${cor}"/><ellipse cx="1050" cy="${y - 6}" rx="300" ry="24" fill="${cor}"/></g>`;
}

function tocha(x, y) {
  return `<g transform="translate(${x} ${y})"><rect x="-3" y="0" width="6" height="40" fill="#3b2a1a"/>
    <circle r="34" cy="-8" fill="url(#brilhoTocha)" class="chama-brilho"/>
    <path d="M0 -26 C10 -14 8 -4 0 0 C-8 -4 -10 -14 0 -26Z" fill="#fbbf24" class="chama"/>
    <path d="M0 -16 C5 -9 4 -3 0 0 C-4 -3 -5 -9 0 -16Z" fill="#fff3b0" class="chama"/></g>`;
}

const DEFS = `<defs>
  <radialGradient id="brilhoTocha"><stop offset="0" stop-color="#fbbf24" stop-opacity=".55"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
  <radialGradient id="brilhoLua"><stop offset="0" stop-color="#e9e3ff" stop-opacity=".5"/><stop offset="1" stop-color="#e9e3ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="brilhoLava"><stop offset="0" stop-color="#fb923c" stop-opacity=".7"/><stop offset="1" stop-color="#ef4444" stop-opacity="0"/></radialGradient>
  <radialGradient id="brilhoVerde"><stop offset="0" stop-color="#86efac" stop-opacity=".6"/><stop offset="1" stop-color="#86efac" stop-opacity="0"/></radialGradient>
  <linearGradient id="ceuTitulo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0820"/><stop offset=".55" stop-color="#2a1550"/><stop offset="1" stop-color="#6b2d6b"/></linearGradient>
</defs>`;

const CENARIOS = {

  /* ---------- MENU: o castelo do Pythonildo ---------- */
  titulo() {
    const r = semente(7);
    const janelas = [[560, 330], [600, 330], [640, 330], [580, 385], [620, 385], [600, 440], [520, 420], [680, 420]]
      .map(([x, y], i) => `<rect x="${x}" y="${y}" width="10" height="18" rx="4" fill="#fbbf24" class="janela" style="animation-delay:-${i * 0.7}s"/>`).join('');
    return `${DEFS}
      <rect width="${CEN.W}" height="${CEN.H}" fill="url(#ceuTitulo)"/>
      ${estrelasCeu(90, r, 300)}
      <circle cx="930" cy="150" r="120" fill="url(#brilhoLua)"/>
      <circle cx="930" cy="150" r="58" fill="#f4efff"/>
      <circle cx="912" cy="136" r="10" fill="#d8d0f0"/><circle cx="950" cy="168" r="14" fill="#d8d0f0"/><circle cx="936" cy="124" r="6" fill="#d8d0f0"/>
      <g class="dragao"><g transform="translate(0 150)"><path d="M0 0 q18 -22 40 -6 q-12 -2 -20 10 q-6 -8 -20 -4z M40 -6 q14 -16 34 -4 q-16 -2 -24 8z M-6 4 q-12 4 -22 -2 q10 -2 14 -8z" fill="#0d0820"/>
        <path d="M22 2 q4 14 14 20 q-6 -8 -4 -18z" fill="#0d0820"/></g></g>
      <g class="morcegos">${[0, 1, 2, 3].map(i => `<path class="morcego" style="animation-delay:-${i * 2.3}s;--y:${60 + i * 55}px" d="M0 0 q8 -10 18 -2 q-4 4 -8 2 q-2 6 -4 8 q-2 -4 -6 -8z" fill="#07041a"/>`).join('')}</g>
      <g class="far">${colinas(520, 120, '#1c1040', r)}${pinheiros(26, r, 560, 150, '#150b33')}</g>
      <!-- o castelo -->
      <g class="castelo">
        <path d="M430 560 L470 470 L470 400 L490 400 L490 370 L505 370 L505 392 L520 392 L520 360 L545 360 L545 300 L535 300 L560 255 L585 300 L575 300 L575 340 L625 340 L625 290 L615 290 L640 235 L665 290 L655 290 L655 340 L690 340 L690 392 L705 392 L705 370 L720 370 L720 400 L740 400 L740 470 L780 560 Z" fill="#0f0a28"/>
        <path d="M560 255 l0 -40 l24 12 l-24 10z" fill="#c2410c" class="bandeira"/>
        <rect x="559" y="215" width="3" height="45" fill="#0f0a28"/>
        <path d="M580 560 v-60 a20 20 0 0 1 40 0 v60z" fill="#241040"/>
        ${janelas}
        ${tocha(540, 520)}${tocha(660, 520)}
      </g>
      ${neblina(600, '#6b3d8f33', 'nevoa-a')}
      <g class="perto">${colinas(610, 70, '#0a0620', r)}${pinheiros(18, r, 680, 220, '#07041a', 0, 400)}${pinheiros(18, r, 680, 220, '#07041a', 800, 1200)}</g>
      ${neblina(660, '#c4a3ff22', 'nevoa-b')}`;
  },

  /* ---------- 0: Cavernas do Pastel ---------- */
  z0() {
    const r = semente(11);
    let esta = '', cris = '', cogu = '';
    for (let i = 0; i < 20; i++) {
      const x = r() * CEN.W, w = 20 + r() * 44, h = 60 + r() * 190;
      esta += `<path d="M${x | 0} 0 h${w | 0} l${-w / 2 | 0} ${h | 0}z" fill="#150c08"/>`;
    }
    for (let i = 0; i < 7; i++) {
      const x = 80 + r() * 1040, h = 40 + r() * 90, c = ['#f472b6', '#c084fc', '#67e8f9'][i % 3];
      cris += `<g transform="translate(${x | 0} 650)" class="cristal" style="animation-delay:-${i}s"><circle cy="${-h / 2 | 0}" r="${h * 0.9 | 0}" fill="${c}" opacity=".16"/><path d="M0 0 l-14 0 l6 ${-h | 0} l8 ${-h * 0.3 | 0} l8 ${h * 0.3 | 0} l6 ${h | 0}z" fill="${c}" opacity=".85"/></g>`;
    }
    for (let i = 0; i < 9; i++) {
      const x = r() * CEN.W, s = 0.6 + r();
      cogu += `<g transform="translate(${x | 0} 670) scale(${s.toFixed(2)})"><rect x="-4" y="-26" width="8" height="26" fill="#d6c3a4"/><path d="M-22 -24 a22 18 0 0 1 44 0z" fill="#ef6f8a"/><circle cx="-9" cy="-30" r="3" fill="#fde7ee"/><circle cx="8" cy="-34" r="2.5" fill="#fde7ee"/></g>`;
    }
    return `${DEFS}
      <rect width="${CEN.W}" height="${CEN.H}" fill="#1a0e08"/>
      <circle cx="600" cy="300" r="380" fill="url(#brilhoTocha)" opacity=".35"/>
      <g class="far">${colinas(560, 90, '#26150c', r, 10)}</g>
      ${esta}${tocha(150, 560)}${tocha(1050, 560)}
      <g class="perto">${colinas(650, 50, '#120a06', r, 9)}${cogu}${cris}</g>
      ${neblina(640, '#f0abfc14', 'nevoa-a')}`;
  },

  /* ---------- 1: Catacumbas Fofoqueiras ---------- */
  z1() {
    const r = semente(23);
    let arcos = '', lapides = '', velas = '';
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 215;
      arcos += `<path d="M${x} 560 V330 a90 90 0 0 1 180 0 V560 h-30 V335 a60 60 0 0 0 -120 0 V560z" fill="#1c1030"/>`;
    }
    for (let i = 0; i < 12; i++) {
      const x = r() * CEN.W, h = 40 + r() * 40;
      lapides += `<g transform="translate(${x | 0} 660)"><path d="M-16 0 V${-h | 0} a16 16 0 0 1 32 0 V0z" fill="#0e0820"/><path d="M-2 ${-h + 14 | 0} h4 M0 ${-h + 10 | 0} v12" stroke="#2a1b48" stroke-width="3"/></g>`;
    }
    for (let i = 0; i < 8; i++) {
      const x = 60 + r() * 1080, y = 540 + r() * 100;
      velas += `<g transform="translate(${x | 0} ${y | 0})"><rect x="-5" y="0" width="10" height="22" fill="#e8dfc7"/><path d="M0 -16 C7 -8 6 -2 0 0 C-6 -2 -7 -8 0 -16Z" fill="#fbbf24" class="chama"/><circle cy="-6" r="26" fill="url(#brilhoTocha)" class="chama-brilho"/></g>`;
    }
    return `${DEFS}
      <rect width="${CEN.W}" height="${CEN.H}" fill="#120a24"/>
      <circle cx="260" cy="130" r="90" fill="url(#brilhoLua)"/><circle cx="260" cy="130" r="40" fill="#ece6ff"/>
      ${estrelasCeu(40, r, 250)}
      <g class="far">${arcos}</g>
      <g class="fantasmas">${[0, 1, 2].map(i => `<g class="fantasma" style="animation-delay:-${i * 4}s;--y:${220 + i * 70}px"><path d="M0 0 a22 24 0 0 1 44 0 v38 l-8 -8 l-7 8 l-7 -8 l-7 8 l-7 -8 l-8 8z" fill="#e0e7ff" opacity=".28"/><circle cx="14" cy="-1" r="3" fill="#312e81"/><circle cx="30" cy="-1" r="3" fill="#312e81"/></g>`).join('')}</g>
      <rect y="560" width="${CEN.W}" height="140" fill="#0a061a"/>
      ${neblina(590, '#a78bfa22', 'nevoa-a')}
      <g class="perto">${lapides}${velas}</g>
      ${neblina(670, '#ddd6fe1a', 'nevoa-b')}`;
  },

  /* ---------- 2: Floresta dos Bugs ---------- */
  z2() {
    const r = semente(31);
    let bichos = '', vagas = '';
    for (let i = 0; i < 26; i++) {
      const x = r() * CEN.W, y = 220 + r() * 400;
      vagas += `<circle cx="${x | 0}" cy="${y | 0}" r="${(2 + r() * 2).toFixed(1)}" fill="#bef264" class="vaga" style="animation-delay:-${(r() * 6).toFixed(1)}s;animation-duration:${(4 + r() * 5).toFixed(1)}s"/>`;
    }
    for (let i = 0; i < 7; i++) {
      const x = r() * CEN.W, y = 360 + r() * 260;
      bichos += `<g transform="translate(${x | 0} ${y | 0})" class="olhos" style="animation-delay:-${(r() * 7).toFixed(1)}s"><circle cx="-9" r="4" fill="#f87171"/><circle cx="9" r="4" fill="#f87171"/><circle cx="-9" r="12" fill="#ef444433"/><circle cx="9" r="12" fill="#ef444433"/></g>`;
    }
    return `${DEFS}
      <rect width="${CEN.W}" height="${CEN.H}" fill="#07140d"/>
      <circle cx="900" cy="130" r="110" fill="url(#brilhoVerde)" opacity=".5"/><circle cx="900" cy="130" r="42" fill="#d9f99d" opacity=".9"/>
      ${estrelasCeu(30, r, 220)}
      <g class="far">${colinas(520, 100, '#0c2216', r)}${pinheiros(30, r, 560, 230, '#0b1f13')}</g>
      ${neblina(560, '#4ade8014', 'nevoa-a')}
      <g class="meio">${pinheiros(16, r, 640, 340, '#071a0f')}</g>
      ${bichos}
      <g class="perto">${colinas(660, 50, '#04100a', r)}${pinheiros(10, r, 720, 420, '#030b06', 0, 260)}${pinheiros(10, r, 720, 420, '#030b06', 940, 1200)}</g>
      ${vagas}${neblina(680, '#86efac12', 'nevoa-b')}`;
  },

  /* ---------- 3: Vulcão do Servidor Quente ---------- */
  z3() {
    const r = semente(43);
    let rios = '', rochas = '';
    for (let i = 0; i < 5; i++) {
      const x = 540 + i * 30 - 60;
      rios += `<path d="M${x} 270 C${x - 40 + i * 30} 380 ${x + 80 - i * 40} 470 ${x - 100 + i * 70} 640" stroke="#fb923c" stroke-width="${5 - i * 0.5}" fill="none" opacity=".8" class="lava-rio"/>`;
    }
    for (let i = 0; i < 12; i++) {
      const x = r() * CEN.W, h = 30 + r() * 70;
      rochas += `<path d="M${x | 0} 700 l${-30 - r() * 20 | 0} 0 l${15 | 0} ${-h | 0} l${24 | 0} ${h * 0.3 | 0} l${18 | 0} ${h * 0.7 | 0}z" fill="#100605"/>`;
    }
    return `${DEFS}
      <rect width="${CEN.W}" height="${CEN.H}" fill="#2a0a08"/>
      <rect width="${CEN.W}" height="${CEN.H}" fill="#7f1d1d" opacity=".35"/>
      <circle cx="600" cy="230" r="360" fill="url(#brilhoLava)" class="chama-brilho"/>
      <g class="far"><path d="M250 640 L520 250 L560 230 L640 230 L680 250 L950 640Z" fill="#1a0705"/>
        <path d="M545 232 l55 38 l55 -38 l-12 -14 h-86z" fill="#fb923c" class="chama"/>
        ${rios}</g>
      <g class="fumaca">${[0, 1, 2].map(i => `<circle class="fumo" style="animation-delay:-${i * 3.5}s" cx="${590 + i * 14}" cy="220" r="${50 + i * 12}" fill="#2b1512" opacity=".6"/>`).join('')}</g>
      ${colinas(600, 80, '#160807', r)}
      <g class="perto">${rochas}${colinas(670, 40, '#0b0403', r, 7)}</g>
      ${neblina(690, '#f9731622', 'nevoa-b')}`;
  },

  /* ---------- 4: Abismo do Wi-Fi Fraco ---------- */
  z4() {
    const r = semente(59);
    let ilhas = '';
    [[160, 480, 1], [420, 560, 1.4], [820, 500, 1.2], [1040, 590, 0.9], [660, 640, 0.8]].forEach(([x, y, s], i) => {
      ilhas += `<g class="ilha" style="animation-delay:-${i * 1.7}s"><g transform="translate(${x} ${y}) scale(${s})">
        <path d="M-70 0 h140 l-30 30 l-30 36 l-20 -20 l-30 -16z" fill="#0b1230"/><path d="M-70 0 h140 l-6 -8 h-128z" fill="#1d3a8a"/></g></g>`;
    });
    const sinal = `<g class="wifi" transform="translate(600 300)" fill="none" stroke="#60a5fa" stroke-width="10" stroke-linecap="round">
      <path d="M-150 -40 a210 210 0 0 1 300 0" class="onda o1"/><path d="M-100 10 a140 140 0 0 1 200 0" class="onda o2"/><path d="M-52 58 a70 70 0 0 1 104 0" class="onda o3"/><circle cy="100" r="9" fill="#60a5fa" stroke="none"/></g>`;
    return `${DEFS}
      <rect width="${CEN.W}" height="${CEN.H}" fill="#050a1e"/>
      <g class="aurora"><path d="M0 220 C250 120 450 300 700 180 S1050 120 1200 210 V80 H0z" fill="#22d3ee" opacity=".12"/><path d="M0 260 C300 170 500 330 760 230 S1050 200 1200 260 V140 H0z" fill="#a78bfa" opacity=".12"/></g>
      ${estrelasCeu(110, r, 480)}
      ${sinal}
      ${ilhas}
      <g class="perto">${colinas(700, 20, '#030616', r, 6)}</g>
      ${neblina(690, '#60a5fa14', 'nevoa-b')}`;
  }
};

/* troca o cenário só quando a chave muda (evita redesenhar toda hora) */
let cenarioAtual = '';
function pintaCenario(chave) {
  if (chave === cenarioAtual) return;
  cenarioAtual = chave;
  const el = document.getElementById('cenario');
  if (!el || !CENARIOS[chave]) return;
  el.classList.remove('troca'); void el.offsetWidth; el.classList.add('troca');
  el.innerHTML = `<svg viewBox="0 0 ${CEN.W} ${CEN.H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${CENARIOS[chave]()}</svg>`;
  el.dataset.cena = chave;
}
