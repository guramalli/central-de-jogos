// Som do jogo sintetizado no navegador (Web Audio, sem arquivos): música de cada ambiente, toque do celular e
// efeitos. Navegadores só liberam áudio depois de um gesto do jogador: o som começa no primeiro toque/clique/tecla.
// API: NSF.Audio.iniciar() ; .trilha(nome) (apartamento | elevador | garagem | padaria) ; .musica(true|false) ;
//      .toque(true|false) ; .abafar(true|false) (música baixa durante a conversa) ; .clique(aparecendo)
//      (passagem de tela) ; .peido() ; .assobio() ; .curtida() ; .ding() (elevador chegou) ;
//      .ligado() ; .alternar() (botão Som). No modo de teste (?test=1) fica mudo.
(function (global) {
  "use strict";
  const AC = global.AudioContext || global.webkitAudioContext;
  let ctx = null, mestre = null, busMusica = null, busToque = null, busEfeitos = null;
  let ligadoSom = true, querMusica = false, querToque = false, abafado = false;
  let proximoTempo = 0, passo = 0, relogio = null, toqueRelogio = null;

  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // Uma trilha por ambiente: compasso de 16 semicolcheias, 4 acordes (2 compassos cada), "estilo" = arranjo.
  const TRILHAS = {
    // quarto/apartamento: lo-fi noturno (a que já estava)
    apartamento: { bpm: 84, estilo: "lofi", volume: 0.7,
      acordes: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 64]], baixo: [45, 41, 48, 43],
      melodia: [76, null, 74, null, 72, null, 74, 76, null, null, 79, null, 76, null, 74, null] },
    // elevador: "música de elevador" — piano elétrico suave em sétimas, sem bateria, bem baixinho
    elevador: { bpm: 92, estilo: "elevador", volume: 0.22,
      acordes: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]], baixo: [48, 45, 50, 43],
      melodia: [79, null, null, 76, null, 77, null, 79, 81, null, null, 79, null, 77, 76, null] },
    // garagem: lo-fi tranquilo e mais leve (provisório, até entrar uma música livre de verdade)
    garagem: { bpm: 78, estilo: "lofi", volume: 0.4,
      acordes: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]], baixo: [48, 45, 41, 43],
      melodia: [72, null, null, 74, null, 76, null, null, 79, null, 76, null, 74, null, null, null] },
    // casa do amigo: sertanejo de churrasco (original): baixo "dois pra lá", violão em batida e sanfoninha
    sertanejo: { bpm: 128, estilo: "sertanejo", volume: 0.6,
      acordes: [[55, 59, 62, 67], [50, 54, 57, 62], [52, 55, 59, 64], [48, 52, 55, 60]], baixo: [43, 38, 40, 36],
      melodia: [74, null, 76, 78, null, 79, null, 78, 76, null, 74, null, 71, null, 74, null] },
    // padaria: bossa nova de rádio de padaria
    padaria: { bpm: 118, estilo: "bossa", volume: 0.55,
      acordes: [[62, 65, 69, 72], [55, 59, 64, 65], [60, 64, 67, 71], [57, 61, 64, 67]], baixo: [50, 43, 48, 45],
      melodia: [74, null, 76, 77, null, 76, null, 74, null, 72, null, null, 71, null, 72, null] },
  };
  let trilha = TRILHAS.apartamento;

  function criar() {
    if (ctx || !AC) return !!ctx;
    ctx = new AC();
    mestre = ctx.createGain(); mestre.gain.value = ligadoSom ? 1 : 0; mestre.connect(ctx.destination);
    busMusica = ctx.createGain(); busMusica.gain.value = 0.0; busMusica.connect(mestre);
    busToque = ctx.createGain(); busToque.gain.value = 0.32; busToque.connect(mestre);
    busEfeitos = ctx.createGain(); busEfeitos.gain.value = 0.5; busEfeitos.connect(mestre);
    return true;
  }

  function nota(freq, inicio, dur, tipo, vol, destino, filtroHz) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, inicio);
    g.gain.exponentialRampToValueAtTime(vol, inicio + Math.min(0.06, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
    let saida = g;
    if (filtroHz) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filtroHz; g.connect(f); saida = f; }
    o.connect(g); saida.connect(destino);
    o.start(inicio); o.stop(inicio + dur + 0.05);
  }

  function bumbo(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g); g.connect(busMusica); o.start(t); o.stop(t + 0.3);
  }

  let ruido = null;
  function obterRuido() {
    if (!ruido) {
      ruido = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
      const d = ruido.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ruido;
  }
  function chimbal(t, vol, freq) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = obterRuido(); f.type = "highpass"; f.frequency.value = freq || 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(busMusica); s.start(t); s.stop(t + 0.06);
  }

  // Agenda os próximos 0,2 s de música (padrão "lookahead" — não depende do ritmo dos quadros do jogo).
  function agendar() {
    const PASSO_S = 60 / trilha.bpm / 4;
    while (proximoTempo < ctx.currentTime + 0.2) {
      const t = proximoTempo, p = passo % 128, compasso = Math.floor(p / 16), k = Math.floor(compasso / 2) % 4;
      const s = p % 16, acorde = trilha.acordes[k], baixo = trilha.baixo[k], mel = trilha.melodia[s];
      if (trilha.estilo === "lofi") {
        if (s === 0) for (const m of acorde) {
          nota(N(m), t, PASSO_S * 15, "sawtooth", 0.035, busMusica, 900);
          nota(N(m) * 1.005, t, PASSO_S * 15, "sawtooth", 0.025, busMusica, 700);
        }
        if (s % 4 === 0) nota(N(baixo), t, PASSO_S * 3, "triangle", 0.22, busMusica, 400);
        if (s === 0 || s === 8) bumbo(t);
        if (s % 2 === 1) chimbal(t, s % 4 === 3 ? 0.05 : 0.025);
        if (mel && compasso % 2 === 1) nota(N(mel), t, PASSO_S * 2.5, "square", 0.03, busMusica, 2200);
      } else if (trilha.estilo === "elevador") {
        if (s === 0 || s === 8) for (const m of acorde) nota(N(m), t, PASSO_S * 7, "sine", 0.05, busMusica, 3000); // piano elétrico
        if (s === 0 || s === 10) nota(N(baixo), t, PASSO_S * 5, "sine", 0.2, busMusica, 600);
        if (mel) nota(N(mel), t, PASSO_S * 2.2, "triangle", 0.06, busMusica, 2600);           // "vibrafone"
        if (s % 4 === 2) chimbal(t, 0.008, 9000);                                               // escovinha
      } else if (trilha.estilo === "ambiente") {
        if (s === 0 && compasso % 2 === 0) for (const m of acorde) {
          nota(N(m), t, PASSO_S * 32, "sawtooth", 0.03, busMusica, 380);
          nota(N(m) * 0.997, t, PASSO_S * 32, "sawtooth", 0.022, busMusica, 300);
        }
        if (s === 0) nota(N(baixo), t, PASSO_S * 14, "sine", 0.25, busMusica, 200);
        if ((p * 7) % 23 === 3) { // pingo d'água com eco
          const f = N(84 + (p % 5));
          nota(f, t, 0.18, "sine", 0.05, busMusica, 6000);
          nota(f, t + 0.32, 0.18, "sine", 0.02, busMusica, 6000);
        }
      } else if (trilha.estilo === "sertanejo") {
        if (s % 4 === 0) nota(N(s % 8 === 0 ? baixo : baixo + 7), t, PASSO_S * 1.8, "triangle", 0.24, busMusica, 450);
        if (s % 4 === 2) for (const m of acorde) nota(N(m), t, PASSO_S * 1.2, "sawtooth", 0.03, busMusica, 1800); // batida
        if (s % 2 === 1) nota(N(acorde[(s >> 1) % 4] + 12), t, PASSO_S * 0.9, "triangle", 0.035, busMusica, 3200); // dedilhado
        if (s % 4 === 0) chimbal(t, 0.03, 5000);
        if (s === 4 || s === 12) chimbal(t, 0.06, 1800); // caixa
        if (mel && compasso % 2 === 1) { // sanfona: dois quadrados levemente desafinados
          nota(N(mel), t, PASSO_S * 1.8, "square", 0.022, busMusica, 2400);
          nota(N(mel) * 1.006, t, PASSO_S * 1.8, "square", 0.018, busMusica, 2400);
        }
      } else if (trilha.estilo === "bossa") {
        // violão: batida da bossa (clave 3-2) com o acorde abafado; baixo na fundamental e na quinta
        if ([0, 3, 6, 10, 12].includes(s)) for (const m of acorde) nota(N(m), t, PASSO_S * 1.6, "triangle", 0.045, busMusica, 2400);
        if (s === 0 || s === 6) nota(N(baixo), t, PASSO_S * 4, "triangle", 0.2, busMusica, 500);
        if (s === 8 || s === 14) nota(N(baixo + 7), t, PASSO_S * 2.5, "triangle", 0.16, busMusica, 500);
        if ([0, 3, 6, 10, 12].includes(s)) chimbal(t, 0.03, 3500);                          // aro (rimshot)
        if (s % 2 === 0) chimbal(t, 0.012, 8000);                                            // chocalho
        if (mel && compasso % 2 === 1) nota(N(mel), t, PASSO_S * 1.8, "sine", 0.05, busMusica, 3000);
      }
      proximoTempo += PASSO_S;
      passo++;
    }
  }

  function volumeMusica() {
    if (!ctx) return;
    const alvo = querMusica ? (abafado || querToque ? 0.35 : 1) * trilha.volume : 0;
    busMusica.gain.setTargetAtTime(alvo, ctx.currentTime, 0.4);
  }

  // Toque de celular: trinado de dois tons, 1,2 s tocando e 1,4 s em silêncio, até parar.
  function tocarToque() {
    if (!querToque || !ctx) return;
    const t = ctx.currentTime + 0.02;
    for (let i = 0; i < 12; i++) nota(i % 2 ? 1320 : 1760, t + i * 0.1, 0.09, "square", 0.25, busToque, 4000);
    toqueRelogio = setTimeout(tocarToque, 2600);
  }

  const pronto = () => ctx && ctx.state === "running";

  // Passagem de tela: estalo curto + bip que desce (sumindo) ou sobe (aparecendo).
  function clique(aparecendo) {
    if (!pronto()) return;
    const t = ctx.currentTime + 0.01;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gs = ctx.createGain();
    s.buffer = obterRuido(); f.type = "highpass"; f.frequency.value = 2500;
    gs.gain.setValueAtTime(0.4, t); gs.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    s.connect(f); f.connect(gs); gs.connect(busToque); s.start(t); s.stop(t + 0.05);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(aparecendo ? 280 : 1500, t);
    o.frequency.exponentialRampToValueAtTime(aparecendo ? 1500 : 200, t + 0.2);
    g.gain.setValueAtTime(0.13, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(busToque); o.start(t); o.stop(t + 0.25);
  }

  // Peido: zumbido grave que treme (serra + modulação rápida no volume) com ruído abafado, caindo de tom.
  function peido() {
    if (!pronto()) return;
    const t = ctx.currentTime + 0.02, dur = 1.1;
    const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = "sawtooth"; o.frequency.setValueAtTime(105, t); o.frequency.linearRampToValueAtTime(70, t + dur * 0.7);
    o.frequency.linearRampToValueAtTime(88, t + dur);
    lfo.type = "square"; lfo.frequency.setValueAtTime(24, t); lfo.frequency.linearRampToValueAtTime(14, t + dur);
    lg.gain.value = 0.18; lfo.connect(lg); lg.connect(g.gain);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.05);
    g.gain.setValueAtTime(0.22, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.type = "lowpass"; f.frequency.value = 520;
    o.connect(g); g.connect(f); f.connect(busEfeitos);
    const s = ctx.createBufferSource(), sf = ctx.createBiquadFilter(), sg = ctx.createGain();
    s.buffer = obterRuido(); sf.type = "bandpass"; sf.frequency.value = 180; sf.Q.value = 1.2;
    sg.gain.setValueAtTime(0.0001, t); sg.gain.linearRampToValueAtTime(0.5, t + 0.04); sg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(sf); sf.connect(sg); sg.connect(busEfeitos);
    o.start(t); lfo.start(t); s.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05); s.stop(t + dur + 0.05);
  }

  // Assobio: senoide aguda com vibrato, deslizando entre as notas de uma frase alegre.
  function assobio() {
    if (!pronto()) return;
    const frase = [[79, 0.22], [83, 0.22], [86, 0.45], [84, 0.22], [83, 0.22], [81, 0.45], [79, 0.3], [83, 0.6]];
    let t = ctx.currentTime + 0.05;
    const o = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
    o.type = "sine"; vib.frequency.value = 6; vg.gain.value = 14; vib.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    for (const [m, d] of frase) {
      o.frequency.setTargetAtTime(N(m), t, 0.03);
      g.gain.setTargetAtTime(0.16, t, 0.02);
      g.gain.setTargetAtTime(0.05, t + d * 0.75, 0.03);
      t += d;
    }
    g.gain.setTargetAtTime(0.0001, t, 0.05);
    o.connect(g); g.connect(busEfeitos);
    o.start(); vib.start(); o.stop(t + 0.4); vib.stop(t + 0.4);
  }

  // Curtida: "pop" curtinho subindo.
  function curtida() {
    if (!pronto()) return;
    const t = ctx.currentTime + 0.01, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1600, t + 0.07);
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g); g.connect(busEfeitos); o.start(t); o.stop(t + 0.12);
  }

  // Porta do elevador deslizando: ruído filtrado que varre de grave para agudo.
  function portaElevador() {
    if (!pronto()) return;
    const t = ctx.currentTime + 0.25, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = obterRuido(); s.loop = true; f.type = "bandpass"; f.Q.value = 2;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1400, t + 0.7);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    s.connect(f); f.connect(g); g.connect(busEfeitos); s.start(t); s.stop(t + 0.85);
  }

  // Alarme do carro destravando: duas buzinadas curtas ("bip-bip").
  function alarmeCarro() {
    if (!pronto()) return;
    const t = ctx.currentTime + 0.02;
    for (const k of [0, 0.22]) {
      for (const f of [415, 520]) {
        const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
        o.type = "sawtooth"; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.value = 2200;
        g.gain.setValueAtTime(0.0001, t + k); g.gain.linearRampToValueAtTime(0.12, t + k + 0.01);
        g.gain.setValueAtTime(0.12, t + k + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + k + 0.12);
        o.connect(fl); fl.connect(g); g.connect(busEfeitos); o.start(t + k); o.stop(t + k + 0.14);
      }
    }
  }

  // Carne na grelha: chiado (ruído agudo) com estalinhos da gordura, ~2,5 s.
  function chiado() {
    if (!pronto()) return;
    const t = ctx.currentTime + 0.02, dur = 2.6, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = obterRuido(); s.loop = true; f.type = "highpass"; f.frequency.value = 3500;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.2); g.gain.setValueAtTime(0.09, t + dur - 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(busEfeitos); s.start(t); s.stop(t + dur);
    for (let i = 0; i < 14; i++) chimbal(t + Math.random() * dur, 0.08, 2500 + Math.random() * 3000);
  }

  // "Plim" do elevador chegando: duas notas de sino.
  function ding() {
    if (!pronto()) return;
    const t = ctx.currentTime + 0.02;
    nota(N(88), t, 1.2, "sine", 0.18, busEfeitos, 8000);
    nota(N(84), t + 0.35, 1.5, "sine", 0.16, busEfeitos, 8000);
  }

  const mudo = () => !!(global.NSF && global.NSF.estado && global.NSF.estado.modoTeste);

  const Audio = {
    iniciar() {
      if (mudo() || !criar()) return;
      if (ctx.state === "suspended") ctx.resume();
      if (!relogio) { proximoTempo = ctx.currentTime + 0.1; relogio = setInterval(agendar, 50); }
      volumeMusica();
      if (querToque && !toqueRelogio) tocarToque();
    },
    trilha(nome) { if (TRILHAS[nome]) { trilha = TRILHAS[nome]; volumeMusica(); } },
    musica(sim) { querMusica = sim; volumeMusica(); },
    toque(sim) {
      querToque = sim;
      clearTimeout(toqueRelogio); toqueRelogio = null;
      if (sim && ctx && ctx.state === "running") tocarToque();
      volumeMusica();
    },
    abafar(sim) { abafado = sim; volumeMusica(); },
    clique, peido, assobio, curtida, ding, portaElevador, alarmeCarro, chiado,
    ligado: () => ligadoSom,
    // para conferência/testes: estado do contexto e volumes
    estado: () => ({ contexto: ctx ? ctx.state : "sem", musica: busMusica ? +busMusica.gain.value.toFixed(2) : 0,
      trilha: Object.keys(TRILHAS).find((k) => TRILHAS[k] === trilha), querMusica, querToque, abafado, passosAgendados: passo }),
    alternar() {
      ligadoSom = !ligadoSom;
      if (ctx) mestre.gain.setTargetAtTime(ligadoSom ? 1 : 0, ctx.currentTime, 0.05);
      return ligadoSom;
    },
  };

  // Primeiro gesto do jogador libera o áudio.
  const liberar = () => Audio.iniciar();
  for (const ev of ["pointerdown", "keydown", "touchstart"]) global.addEventListener(ev, liberar, { capture: true, passive: true });

  if (global.NSF) global.NSF.Audio = Audio;
})(typeof window !== "undefined" ? window : globalThis);
