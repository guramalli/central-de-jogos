// Som do jogo sintetizado no navegador (Web Audio, sem arquivos): música de fundo em loop e toque do celular.
// Navegadores só liberam áudio depois de um gesto do jogador: o som começa no primeiro toque/clique/tecla.
// API: NSF.Audio.iniciar() ; .musica(true|false) ; .toque(true|false) ; .abafar(true|false) (música baixa
//      durante a conversa) ; .ligado() ; .alternar() (botão Som). No modo de teste (?test=1) fica mudo.
(function (global) {
  "use strict";
  const AC = global.AudioContext || global.webkitAudioContext;
  let ctx = null, mestre = null, busMusica = null, busToque = null;
  let ligadoSom = true, querMusica = false, querToque = false, abafado = false;
  let proximoTempo = 0, passo = 0, relogio = null, toqueRelogio = null;

  const BPM = 84, PASSO_S = 60 / BPM / 4;              // semicolcheia
  // Progressão Am7 - Fmaj7 - Cmaj7 - G6 (2 compassos cada), em Hz
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const ACORDES = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 64]];
  const BAIXO = [45, 41, 48, 43];
  const MELODIA = [76, null, 74, null, 72, null, 74, 76, null, null, 79, null, 76, null, 74, null];

  function criar() {
    if (ctx || !AC) return !!ctx;
    ctx = new AC();
    mestre = ctx.createGain(); mestre.gain.value = ligadoSom ? 1 : 0; mestre.connect(ctx.destination);
    busMusica = ctx.createGain(); busMusica.gain.value = 0.0; busMusica.connect(mestre);
    busToque = ctx.createGain(); busToque.gain.value = 0.32; busToque.connect(mestre);
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
  function chimbal(t, vol) {
    if (!ruido) {
      ruido = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const d = ruido.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido; f.type = "highpass"; f.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(busMusica); s.start(t); s.stop(t + 0.06);
  }

  // Agenda os próximos 0,2 s de música (padrão "lookahead" — não depende do ritmo dos quadros do jogo).
  function agendar() {
    while (proximoTempo < ctx.currentTime + 0.2) {
      const t = proximoTempo, p = passo % 128, compasso = Math.floor(p / 16), acorde = Math.floor(compasso / 2) % 4;
      const noCompasso = p % 16;
      if (noCompasso === 0) {
        for (const m of ACORDES[acorde]) {
          nota(N(m), t, PASSO_S * 15, "sawtooth", 0.035, busMusica, 900);
          nota(N(m) * 1.005, t, PASSO_S * 15, "sawtooth", 0.025, busMusica, 700);
        }
      }
      if (noCompasso % 4 === 0) nota(N(BAIXO[acorde]), t, PASSO_S * 3, "triangle", 0.22, busMusica, 400);
      if (noCompasso === 0 || noCompasso === 8) bumbo(t);
      if (noCompasso % 2 === 1) chimbal(t, noCompasso % 4 === 3 ? 0.05 : 0.025);
      const mel = MELODIA[noCompasso];
      if (mel && compasso % 2 === 1) nota(N(mel), t, PASSO_S * 2.5, "square", 0.03, busMusica, 2200);
      proximoTempo += PASSO_S;
      passo++;
    }
  }

  function volumeMusica() {
    if (!ctx) return;
    const alvo = querMusica ? (abafado || querToque ? 0.25 : 0.7) : 0;
    busMusica.gain.setTargetAtTime(alvo, ctx.currentTime, 0.4);
  }

  // Toque de celular: trinado de dois tons, 1,2 s tocando e 1,4 s em silêncio, até parar.
  function tocarToque() {
    if (!querToque || !ctx) return;
    const t = ctx.currentTime + 0.02;
    for (let i = 0; i < 12; i++) nota(i % 2 ? 1320 : 1760, t + i * 0.1, 0.09, "square", 0.25, busToque, 4000);
    toqueRelogio = setTimeout(tocarToque, 2600);
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
    musica(sim) { querMusica = sim; volumeMusica(); },
    toque(sim) {
      querToque = sim;
      clearTimeout(toqueRelogio); toqueRelogio = null;
      if (sim && ctx && ctx.state === "running") tocarToque();
      volumeMusica();
    },
    abafar(sim) { abafado = sim; volumeMusica(); },
    ligado: () => ligadoSom,
    // para conferência/testes: estado do contexto e volumes
    estado: () => ({ contexto: ctx ? ctx.state : "sem", musica: busMusica ? +busMusica.gain.value.toFixed(2) : 0,
      querMusica, querToque, abafado, passosAgendados: passo }),
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
