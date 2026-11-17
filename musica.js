'use strict';
/* ============================================================
   MÚSICA POR ZONA — toda gerada por código (Web Audio), sem arquivos!
   • Cada zona tem uma escala, uma sequência de acordes, um andamento e
     um "jeitão" próprio (pad, baixo, arpejo, percussão e efeitos).
   • Em combate entra a bateria; no chefão o ritmo acelera e fica intenso.
   • Trocar de zona faz uma transição suave (crossfade).
   • Tem um botão 🎵 só para a música (o 🔊 desliga tudo).
   COMO FUNCIONA: a cada passo de 1/16 de compasso, eventos() decide
   quais notas tocam (uma lista de dados); tocaEvento() transforma cada
   evento em som. Quer uma música nova? Copie um item de MUSICAS!
   ============================================================ */

/* Escalas: distância em "semitons" (teclas do piano) a partir da nota-raiz */
const ESCALAS = {
  menor: [0, 2, 3, 5, 7, 8, 10], dorico: [0, 2, 3, 5, 7, 9, 10], frigio: [0, 1, 3, 5, 7, 8, 10],
  harmonica: [0, 2, 3, 5, 7, 8, 11], tons: [0, 2, 4, 6, 8, 10],
};
/* baixo: 16 passos por compasso. 0 = pausa, 1 = nota-raiz, 2 = quinta, 3 = oitava, 4 = terça */
const MUSICAS = {
  titulo: { nome: 'Tema do Castelo', raiz: 50, escala: 'menor', bpm: 76, prog: [0, 5, 2, 6], seed: 11,
    pad: { onda: 'sawtooth', filtro: 650, ataque: 0.9, gain: 0.05, det: 8 }, baixo: { onda: 'triangle', gain: 0.16, pad: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0] },
    arp: { onda: 'triangle', dens: 0.5, oitava: 2, dec: 0.5, gain: 0.07 }, extra: null, bateria: 0 },
  z0: { nome: 'Cavernas do Pastel', raiz: 52, escala: 'dorico', bpm: 92, prog: [0, 3, 5, 4], seed: 23,
    pad: { onda: 'triangle', filtro: 700, ataque: 0.7, gain: 0.06, det: 5 }, baixo: { onda: 'sine', gain: 0.2, pad: [1, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 0, 2, 0, 0, 0] },
    arp: { onda: 'triangle', dens: 0.6, oitava: 2, dec: 0.22, gain: 0.09 }, extra: 'gota', bateria: 0 },
  z1: { nome: 'Catacumbas Fofoqueiras', raiz: 48, escala: 'frigio', bpm: 66, prog: [0, 1, 6, 0], seed: 37,
    pad: { onda: 'square', filtro: 420, ataque: 1.3, gain: 0.035, det: 6 }, baixo: { onda: 'sine', gain: 0.2, pad: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0] },
    arp: { onda: 'sine', dens: 0.25, oitava: 3, dec: 0.9, gain: 0.08 }, extra: 'sino', bateria: 0 },
  z2: { nome: 'Floresta dos Bugs', raiz: 53, escala: 'dorico', bpm: 104, prog: [0, 4, 3, 0], seed: 41,
    pad: { onda: 'triangle', filtro: 900, ataque: 0.4, gain: 0.05, det: 10 }, baixo: { onda: 'triangle', gain: 0.17, pad: [1, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0, 3, 0, 2, 0] },
    arp: { onda: 'square', dens: 0.7, oitava: 2, dec: 0.14, gain: 0.045 }, extra: 'glitch', bateria: 0 },
  z3: { nome: 'Vulcão do Servidor Quente', raiz: 45, escala: 'harmonica', bpm: 112, prog: [0, 5, 3, 4], seed: 53,
    pad: { onda: 'sawtooth', filtro: 1000, ataque: 0.3, gain: 0.045, det: 9 }, baixo: { onda: 'sawtooth', gain: 0.13, pad: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 2, 3, 0] },
    arp: { onda: 'sawtooth', dens: 0.45, oitava: 2, dec: 0.2, gain: 0.04 }, extra: 'lava', bateria: 1 },
  z4: { nome: 'Abismo do Wi-Fi Fraco', raiz: 55, escala: 'tons', bpm: 84, prog: [0, 2, 4, 1], seed: 67,
    pad: { onda: 'sine', filtro: 1500, ataque: 1.0, gain: 0.07, det: 12 }, baixo: { onda: 'sine', gain: 0.2, pad: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0] },
    arp: { onda: 'sine', dens: 0.5, oitava: 3, dec: 0.7, gain: 0.08 }, extra: 'sonar', bateria: 0 },
  fim: { nome: 'Lamento', raiz: 45, escala: 'menor', bpm: 56, prog: [0, 5, 0, 6], seed: 79,
    pad: { onda: 'sine', filtro: 500, ataque: 1.5, gain: 0.07, det: 6 }, baixo: { onda: 'sine', gain: 0.18, pad: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    arp: { onda: 'triangle', dens: 0.12, oitava: 2, dec: 1.4, gain: 0.06 }, extra: null, bateria: 0 },
};

const hzDeMidi = m => 440 * Math.pow(2, (m - 69) / 12);
/** Nota da escala: grau 0 = raiz, grau 7 (numa escala de 7 notas) = oitava acima. Aceita graus negativos. */
function notaDaEscala(cfg, grau) {
  const e = ESCALAS[cfg.escala], n = e.length;
  return cfg.raiz + e[((grau % n) + n) % n] + 12 * Math.floor(grau / n);
}

/* ---------- Estado de uma "faixa" (uma música tocando) ---------- */
function criaFaixa(chave, destino, ctx, t0) {
  const cfg = MUSICAS[chave]; if (!cfg) return null;
  const rng = semente(cfg.seed * 977);
  /* motivo = melodia de 16 passos feita de "passeios aleatórios" na escala. Mesma semente = mesma música sempre. */
  const motivo = tipo => {
    const m = []; let pos = 2;
    for (let i = 0; i < 16; i++) {
      if (i === 0) { pos = [0, 2, 4][Math.floor(rng() * 3)]; m.push(pos); continue; }
      if (rng() > cfg.arp.dens) { m.push(null); continue; }
      pos = Math.max(-2, Math.min(9, pos + [-2, -1, -1, 0, 1, 1, 2, 3][Math.floor(rng() * 8)] + (tipo === 'B' && i > 8 ? 1 : 0))); m.push(pos);
    }
    return m;
  };
  const gain = ctx ? ctx.createGain() : null; if (gain) { gain.gain.value = 0; gain.connect(destino); }
  return { chave, cfg, gain, destino, passo: 0, tProx: t0, rng, A: motivo('A'), B: motivo('B') };
}

/* ---------- O compositor: que sons tocam neste passo? (função pura, fácil de testar) ---------- */
function eventos(f, intens) {
  const cfg = f.cfg, p = f.passo, compasso = Math.floor(p / 16), nc = compasso % 4, i = p % 16, grauAcorde = cfg.prog[nc];
  const ev = [], rng = f.rng, boss = intens >= 2, lut = intens >= 1;
  const passoDur = 60 / (cfg.bpm * (boss ? 1.15 : 1)) / 4;
  /* 1) PAD: acorde sustentado, um por compasso */
  if (i === 0) {
    [0, 2, 4].forEach(k => ev.push({ tipo: 'nota', midi: notaDaEscala(cfg, grauAcorde + k) + 12, onda: cfg.pad.onda, gain: cfg.pad.gain * (boss ? 1.25 : 1), dur: passoDur * 15, ataque: cfg.pad.ataque, rel: 0.8, filtro: cfg.pad.filtro * (lut ? 1.5 : 1), det: cfg.pad.det }));
  }
  /* 2) BAIXO: padrão de 16 passos (no chefão, dobrado uma oitava acima) */
  const b = cfg.baixo.pad[i];
  if (b) {
    const grau = grauAcorde + ({ 1: 0, 2: 4, 3: 7, 4: 2 })[b], midi = notaDaEscala(cfg, grau) - 12;
    ev.push({ tipo: 'nota', midi, onda: cfg.baixo.onda, gain: cfg.baixo.gain, dur: passoDur * 1.6, ataque: 0.01, rel: 0.12, filtro: 600 });
    if (boss) ev.push({ tipo: 'nota', midi: midi + 12, onda: 'sawtooth', gain: cfg.baixo.gain * 0.35, dur: passoDur * 1.2, ataque: 0.01, rel: 0.1, filtro: 900 });
  }
  /* 3) ARPEJO / MELODIA: o motivo A nos compassos 1-2 e o B nos 3-4, seguindo o acorde da vez */
  const motivo = nc < 2 ? f.A : f.B, off = motivo[i];
  if (off !== null) {
    ev.push({ tipo: 'pluck', midi: notaDaEscala(cfg, grauAcorde + off) + 12 * (cfg.arp.oitava - 1), onda: cfg.arp.onda, gain: cfg.arp.gain * (i % 4 === 0 ? 1.2 : 0.85), dec: cfg.arp.dec, filtro: 3200 });
  } else if (lut && rng() < (boss ? 0.45 : 0.22)) {   // em combate/chefão, preenche as pausas com notas do acorde: a música fica mais agitada
    ev.push({ tipo: 'pluck', midi: notaDaEscala(cfg, grauAcorde + [0, 2, 4, 7][Math.floor(rng() * 4)]) + 12 * (cfg.arp.oitava - 1), onda: cfg.arp.onda, gain: cfg.arp.gain * 0.7, dec: Math.min(cfg.arp.dec, 0.3), filtro: 3200 });
  }
  /* 4) BATERIA: sempre leve na zona do vulcão; em combate completa; no chefão pesada */
  const nivelBat = lut ? (boss ? 2 : 1) : cfg.bateria;
  if (nivelBat >= 1) {
    if (i === 0 || i === 8 || (boss && (i === 4 || i === 12))) ev.push({ tipo: 'bumbo', gain: boss ? 0.5 : 0.34 });
    if (nivelBat >= 1 && lut && (i === 4 || i === 12)) ev.push({ tipo: 'caixa', gain: boss ? 0.2 : 0.14 });
    if (lut && i % 2 === 0) ev.push({ tipo: 'chimbal', gain: (i % 4 === 0 ? 0.07 : 0.045) * (boss ? 1.4 : 1) });
    if (boss && i === 15) ev.push({ tipo: 'caixa', gain: 0.1 });
  }
  /* 5) EFEITOS DA ZONA */
  const compInicio = i === 0;
  if (cfg.extra === 'gota' && rng() < 0.05) ev.push({ tipo: 'pluck', midi: notaDaEscala(cfg, grauAcorde + [4, 7, 9][Math.floor(rng() * 3)]) + 24, onda: 'sine', gain: 0.07, dec: 0.5, filtro: 5000 });
  if (cfg.extra === 'sino' && (i === 0 || i === 8) && nc % 2 === 0) ev.push({ tipo: 'pluck', midi: notaDaEscala(cfg, grauAcorde + (i ? 4 : 7)) + 24, onda: 'sine', gain: 0.09, dec: 1.6, filtro: 6000 });
  if (cfg.extra === 'glitch' && rng() < 0.1) ev.push({ tipo: 'pluck', midi: cfg.raiz + 48 + Math.floor(rng() * 12), onda: 'square', gain: 0.03, dec: 0.06, filtro: 6000 });
  if (cfg.extra === 'lava' && compInicio && nc % 2 === 0) ev.push({ tipo: 'ruido', gain: 0.05, dur: passoDur * 10, filtro: 180 });
  if (cfg.extra === 'sonar' && compInicio && nc % 2 === 0) { ev.push({ tipo: 'ping', hz: 1320, gain: 0.07, dec: 0.9 }); ev.push({ tipo: 'ping', hz: 1320, gain: 0.03, dec: 0.9, atraso: passoDur * 3 }); }
  return { ev, passoDur };
}

/* ---------- O sintetizador: transforma um evento em som ---------- */
function ruidoDe(ctx) {
  if (!ctx._ruido) { const n = Math.floor(ctx.sampleRate * 0.6), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1; ctx._ruido = b; }
  return ctx._ruido;
}
function tocaEvento(ctx, saida, e, t) {
  t += e.atraso || 0;
  const env = (g, pico, ataque, fim) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pico, t + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t + fim); };
  if (e.tipo === 'nota' || e.tipo === 'pluck') {
    const f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = e.filtro || 2000; f.Q.value = 0.6;
    const fim = e.tipo === 'pluck' ? e.dec : Math.max(e.ataque, e.dur) + e.rel;
    if (e.tipo === 'pluck') { g.gain.setValueAtTime(e.gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + fim); }
    else { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(e.gain, t + e.ataque); g.gain.setValueAtTime(e.gain, t + Math.max(e.ataque, e.dur)); g.gain.exponentialRampToValueAtTime(0.0001, t + fim); }
    f.connect(g); g.connect(saida);
    const vozes = e.det ? [-e.det, e.det] : [0];
    for (const cents of vozes) { const o = ctx.createOscillator(); o.type = e.onda; o.frequency.value = hzDeMidi(e.midi); o.detune.value = cents; o.connect(f); o.start(t); o.stop(t + fim + 0.05); }
  } else if (e.tipo === 'bumbo') {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(e.gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(saida); o.start(t); o.stop(t + 0.22);
  } else if (e.tipo === 'caixa' || e.tipo === 'chimbal' || e.tipo === 'ruido') {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = ruidoDe(ctx);
    f.type = e.tipo === 'chimbal' ? 'highpass' : e.tipo === 'ruido' ? 'lowpass' : 'bandpass'; f.frequency.value = e.tipo === 'chimbal' ? 7000 : e.tipo === 'ruido' ? (e.filtro || 200) : 1800;
    const dur = e.tipo === 'chimbal' ? 0.05 : e.tipo === 'ruido' ? e.dur : 0.13;
    if (e.tipo === 'ruido') env(g, e.gain, dur * 0.4, dur); else { g.gain.setValueAtTime(e.gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    s.connect(f); f.connect(g); g.connect(saida); s.start(t); s.stop(t + dur + 0.05);
  } else if (e.tipo === 'ping') {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = e.hz;
    g.gain.setValueAtTime(e.gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + e.dec); o.connect(g); g.connect(saida); o.start(t); o.stop(t + e.dec + 0.05);
  }
}

/* ---------- Mixer: volume geral + um eco suave ---------- */
const VOL_MUSICA = 0.22;   // música é fundo: os efeitos sonoros (golpes, itens) precisam aparecer por cima dela
function criaMixer(ctx) {
  const mestre = ctx.createGain(); mestre.gain.value = VOL_MUSICA;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
  const eco = ctx.createDelay(1); eco.delayTime.value = 0.32; const fb = ctx.createGain(); fb.gain.value = 0.32; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; const molhado = ctx.createGain(); molhado.gain.value = 0.28;
  const entrada = ctx.createGain();
  entrada.connect(mestre); entrada.connect(eco); eco.connect(lp); lp.connect(fb); fb.connect(eco); lp.connect(molhado); molhado.connect(mestre);
  mestre.connect(comp); comp.connect(ctx.destination);
  return { entrada, mestre };
}

/* ---------- O maestro: escolhe a faixa, agenda as notas e faz as transições ---------- */
const Musica = {
  ligada: store.get('musica_off') !== '1', desejada: 'titulo', intens: 0, faixa: null, mixer: null, timer: null, ctx: null,
  ativa() { return this.ligada && !Som.mudo; },
  contexto() {
    if (!this.ctx) {
      try { this.ctx = Som.ctx || (Som.ctx = new (window.AudioContext || window.webkitAudioContext)()); this.mixer = criaMixer(this.ctx); }
      catch (e) { this.ctx = null; return null; }
    }
    return this.ctx;
  },
  /** Navegadores só liberam áudio depois de um clique: chamamos isto em qualquer clique/toque. */
  desperta() {
    if (!this.ativa()) return;
    const c = this.contexto(); if (!c) return;
    if (c.state === 'suspended') c.resume().then(() => this.inicia()).catch(() => { /* sem áudio */ }); else this.inicia();
    if (!this.timer) this.timer = setInterval(() => this.tick(), 90);
  },
  /** Qual música deve tocar: 'titulo', 'z0'..'z4', 'fim' ou 'silencio'. */
  muda(chave) { this.desejada = chave; if (this.ctx && this.ctx.state === 'running') this.inicia(); },
  /** 0 = explorando, 1 = combate (entra a bateria), 2 = chefão (mais rápido e pesado). */
  modo(n) { this.intens = n; },
  inicia() {
    const c = this.ctx; if (!c || !this.ativa()) return;
    const f = this.faixa;
    if (f && f.chave === this.desejada) return;
    const agora = c.currentTime;
    if (f && f.gain) { f.gain.gain.cancelScheduledValues(agora); f.gain.gain.setValueAtTime(f.gain.gain.value, agora); f.gain.gain.linearRampToValueAtTime(0, agora + 1.4); const g = f.gain; setTimeout(() => { try { g.disconnect(); } catch (e) { /* ok */ } }, 3200); }
    this.faixa = this.desejada === 'silencio' ? null : criaFaixa(this.desejada, this.mixer.entrada, c, agora + 0.15);
    if (this.faixa) { this.faixa.gain.gain.setValueAtTime(0, agora); this.faixa.gain.gain.linearRampToValueAtTime(1, agora + 1.6); }
  },
  tick() {
    const f = this.faixa, c = this.ctx; if (!f || !c || c.state !== 'running' || !this.ativa()) return;
    if (f.tProx < c.currentTime - 0.5) f.tProx = c.currentTime + 0.05;   // ficou muito atrás (aba em segundo plano): recomeça sem "rajada"
    while (f.tProx < c.currentTime + 0.4) {
      const { ev, passoDur } = eventos(f, this.intens);
      for (const e of ev) tocaEvento(c, f.gain, e, f.tProx);
      f.tProx += passoDur; f.passo++;
    }
  },
  /** Chamado ao ligar/desligar o som ou a música. */
  atualiza() {
    const c = this.ctx; if (!c || !this.mixer) { if (this.ativa()) this.desperta(); return; }
    const g = this.mixer.mestre.gain, agora = c.currentTime;
    g.cancelScheduledValues(agora); g.setValueAtTime(g.value, agora); g.linearRampToValueAtTime(this.ativa() ? VOL_MUSICA : 0, agora + 0.25);
    if (this.ativa()) { if (this.faixa) this.faixa.tProx = c.currentTime + 0.05; this.desperta(); }
  },
  alterna() { this.ligada = !this.ligada; store.set('musica_off', this.ligada ? '0' : '1'); this.atualiza(); return this.ligada; },

  /** Renderiza alguns segundos de uma faixa SEM tocar (para testes e análise). Devolve um AudioBuffer. */
  async renderiza(chave, intens, segundos, taxa = 22050) {
    const oc = new OfflineAudioContext(1, Math.ceil(segundos * taxa), taxa), mix = criaMixer(oc), f = criaFaixa(chave, mix.entrada, oc, 0);
    f.gain.gain.value = 1;
    while (f.tProx < segundos) { const { ev, passoDur } = eventos(f, intens); for (const e of ev) tocaEvento(oc, f.gain, e, f.tProx); f.tProx += passoDur; f.passo++; }
    return oc.startRendering();
  },
};
document.addEventListener('pointerdown', () => Musica.desperta());
document.addEventListener('keydown', () => Musica.desperta());
document.addEventListener('visibilitychange', () => {   // aba escondida: pausa o áudio (economiza bateria)
  const c = Musica.ctx; if (!c) return;
  if (document.hidden) c.suspend().catch(() => { /* ok */ }); else if (Musica.ativa()) c.resume().catch(() => { /* ok */ });
});
Musica.muda(typeof cenarioAtual === 'string' && cenarioAtual ? cenarioAtual : 'titulo');
