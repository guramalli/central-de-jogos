/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — áudio: trilha sonora + efeitos gravados
   - Envolve o som(tipo) sintetizado de game.js: se existe amostra
     para o tipo, toca a amostra (WebAudio); senão usa o sintetizador.
   - Gerenciador de música por contexto (tela inicial, mapa, partida),
     com crossfade, loop sem emenda e "duck" em nível/gol.
   - Volumes separados de música e efeitos (salvos em localStorage).
   Arquivos em a/som/ (gerados com Higgsfield: Sonilo Music + Seed Audio).
   ============================================================ */
(function () {
  const PASTA = 'a/som/';
  const CHAVE = 'rac_audio_v1';
  const CROSS = 1.8;      // segundos de crossfade entre músicas
  const PRE = 0.05;       // início do loop dentro do arquivo (folga para atraso do decodificador mp3)

  // duração exata do corpo do loop (o arquivo tem +0,5 s repetindo o começo, para emenda perfeita)
  const MUSICAS = { titulo: 18.5388, vila: 18.5388, cidade: 18.5388, mundo: 16.5788, europa: 18.5388 };
  const AMBIENTE = { torcida: 11.65 };

  // tipo do jogo -> [arquivo, volume, variação de pitch, intervalo mínimo (ms), vozes máx.]
  const SFX = {
    chute: ['chute', 0.75, 0.05, 70, 3],
    toque: ['drible', 0.45, 0.06, 90, 2],
    nivel: ['nivel', 0.75, 0, 400, 1],
    apito: ['apito', 0.5, 0.02, 250, 1],
    gol: ['gol', 0.8, 0.02, 600, 1],
    // moeda, cura, gole, erro e raro saíam com voz/"narração" do gerador: agora são sintetizados (SINT, abaixo)
  };
  const DUCK = { nivel: [0.35, 2.2], gol: [0.3, 3.2], raro: [0.6, 1.2] };

  const A = {
    ctx: null, master: null, sfxBus: null, musBus: null, duck: null, ambGain: null,
    buf: {}, carregando: {}, falhou: {},
    atual: null, fading: [], faixa: null, amb: null,
    vozes: {}, ultimo: {},
    vol: { musica: 0.45, sfx: 0.8, ambiente: 0.7 },
    gesto: false, somOnAnt: true,
  };
  window.RAC_AUDIO = A; // para depuração

  try { const v = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (v) { if (isFinite(v.musica)) A.vol.musica = Math.min(1, Math.max(0, v.musica)); if (isFinite(v.ambiente)) A.vol.ambiente = Math.min(1, Math.max(0, v.ambiente)); if (isFinite(v.sfx)) A.vol.sfx = Math.min(1, Math.max(0, v.sfx)); } } catch (e) { /* sem storage */ }
  function salvaVol() { try { localStorage.setItem(CHAVE, JSON.stringify(A.vol)); } catch (e) { /* sem storage */ } }
  const somLigado = () => typeof G === 'undefined' || G.somOn !== false;

  /* ---------- contexto e barramentos ---------- */
  function garanteCtx() {
    if (A.ctx) return A.ctx;
    try {
      // reaproveita o AudioContext do sintetizador (let AC em game.js), criando se preciso
      if (typeof AC !== 'undefined' && AC) A.ctx = AC;
      else { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); try { AC = A.ctx; } catch (e) { /* sem AC global */ } }
    } catch (e) { return null; }
    const c = A.ctx;
    const saida = c.destination;
    A.master = c.createGain(); A.master.connect(saida);
    A.sfxBus = c.createGain(); A.sfxBus.connect(A.master);
    A.duck = c.createGain(); A.duck.connect(A.master);
    A.musBus = c.createGain(); A.musBus.connect(A.duck);
    A.ambBus = c.createGain(); A.ambBus.connect(A.master);   // chuva, praia, passarinhos, torcida: volume próprio
    A.ambGain = c.createGain(); A.ambGain.gain.value = 0; A.ambGain.connect(A.ambBus);
    // o sintetizador antigo liga direto em AC.destination: redireciona para o barramento de efeitos
    try { Object.defineProperty(c, 'destination', { value: A.sfxBus, configurable: true }); } catch (e) { /* navegador antigo: segue sem volume no sintetizador */ }
    aplicaVolumes(true);
    return c;
  }
  function aplicaVolumes(ja) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime, on = somLigado();
    const alvo = (g, v) => { if (ja) g.gain.value = v; else g.gain.setTargetAtTime(v, t, 0.05); };
    alvo(A.master, on ? 1 : 0);
    alvo(A.sfxBus, A.vol.sfx);
    alvo(A.musBus, A.vol.musica);
    if (A.ambBus) alvo(A.ambBus, A.vol.ambiente);
  }

  /* ---------- carregamento ---------- */
  function carrega(nome) {
    if (A.buf[nome]) return Promise.resolve(A.buf[nome]);
    if (A.falhou[nome]) return Promise.resolve(null);
    if (A.carregando[nome]) return A.carregando[nome];
    const c = garanteCtx(); if (!c) return Promise.resolve(null);
    const p = fetch(PASTA + nome + '.mp3')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(ab => new Promise((ok, erro) => { const pr = c.decodeAudioData(ab, ok, erro); if (pr && pr.catch) pr.catch(erro); }))
      .then(b => { A.buf[nome] = b; return b; })
      .catch(() => { A.falhou[nome] = true; return null; })
      .finally(() => { delete A.carregando[nome]; });
    A.carregando[nome] = p;
    return p;
  }
  function carregaEfeitos() { const vistos = new Set(); for (const k in SFX) { const f = SFX[k][0]; if (!vistos.has(f)) { vistos.add(f); carrega('sfx_' + f); } } }

  /* ---------- efeitos ---------- */
  function duck(tipo) {
    const d = DUCK[tipo]; if (!d || !A.ctx) return;
    const g = A.duck.gain, t = A.ctx.currentTime;
    if (A.duckFim > t && A.duckNivel < d[0]) return;   // já há um duck mais forte rolando
    A.duckFim = t + d[1]; A.duckNivel = d[0];
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(d[0], t + 0.08);
    g.setValueAtTime(d[0], t + d[1] * 0.6);
    g.linearRampToValueAtTime(1, t + d[1]);
  }
  function tocaAmostra(tipo) {
    const cf = SFX[tipo]; if (!cf) return false;
    const b = A.buf['sfx_' + cf[0]]; if (!b) return false;
    const c = A.ctx, agora = performance.now();
    if (agora - (A.ultimo[tipo] || 0) < cf[3]) return true;          // spam: ignora
    const vivas = (A.vozes[tipo] || []).filter(v => !v.acabou);
    if (vivas.length >= cf[4]) { const v = vivas.shift(); try { v.g.gain.setTargetAtTime(0, c.currentTime, 0.02); v.s.stop(c.currentTime + 0.1); } catch (e) { /* já parou */ } v.acabou = true; }
    A.ultimo[tipo] = agora;
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = b;
    s.playbackRate.value = (cf[5] || 1) * (1 + (Math.random() * 2 - 1) * cf[2]);
    g.gain.value = cf[1];
    s.connect(g); g.connect(A.sfxBus);
    const voz = { s, g, acabou: false }; s.onended = () => { voz.acabou = true; };
    vivas.push(voz); A.vozes[tipo] = vivas;
    s.start();
    duck(tipo);
    return true;
  }

  /* ---------- efeitos sintetizados (camadas + eco), sem arquivos ---------- */
  let ECO = null;
  function eco() { // eco curto e suave para brilhos
    if (ECO) return ECO; const c = A.ctx;
    const ent = c.createGain(), d = c.createDelay(0.5), fb = c.createGain(), filtro = c.createBiquadFilter(), sai = c.createGain();
    d.delayTime.value = 0.11; fb.gain.value = 0.32; filtro.type = 'lowpass'; filtro.frequency.value = 5000; sai.gain.value = 0.35;
    ent.connect(d); d.connect(filtro); filtro.connect(fb); fb.connect(d); filtro.connect(sai); sai.connect(A.sfxBus);
    return ECO = ent;
  }
  // nota com envelope: tipo de onda, frequência (ou [de, para]), início, duração, volume
  function nota(onda, f, t0, dur, vol, opc = {}) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain(); o.type = onda;
    const [fa, fb] = Array.isArray(f) ? f : [f, f];
    o.frequency.setValueAtTime(fa, t0); if (fb !== fa) o.frequency.exponentialRampToValueAtTime(fb, t0 + (opc.glide || dur));
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + (opc.ataque || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let saida = g;
    if (opc.passaBaixa) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = opc.passaBaixa; g.connect(fl); saida = fl; }
    if (opc.pan != null && c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = opc.pan; saida.connect(pn); saida = pn; }
    if (opc.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = opc.vib[0]; lg.gain.value = opc.vib[1]; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.03); }
    o.connect(g); saida.connect(A.sfxBus); if (opc.eco) saida.connect(eco());
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  // ruído filtrado (chiado, brilho, "fwip")
  let RUIDO = null;
  function ruido(t0, dur, vol, tipoF, freq, freqFim, q = 1, comEco, pan) {
    const c = A.ctx;
    if (!RUIDO) { RUIDO = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = RUIDO.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = RUIDO; s.loop = true;
    f.type = tipoF; f.Q.value = q; f.frequency.setValueAtTime(freq, t0); if (freqFim) f.frequency.exponentialRampToValueAtTime(freqFim, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let saida = g; if (pan != null && c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = pan; g.connect(pn); saida = pn; }
    s.connect(f); f.connect(g); saida.connect(A.sfxBus); if (comEco) saida.connect(eco());
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.03);
  }
  const var_ = (k = 0.04) => 1 + (Math.random() * 2 - 1) * k; // variação para repetições não soarem iguais
  function gole(t, v = 1) { // "glup": bolha que sobe
    nota('sine', [260 * v, 520 * v], t, 0.09, 0.32, { glide: 0.07, passaBaixa: 1800 });
    ruido(t, 0.06, 0.05, 'bandpass', 700 * v, 1400 * v, 3);
  }
  const SINT = {
    moeda: { ms: 60, f(t) { const k = var_(0.02); nota('square', 1319 * k, t, 0.09, 0.07, { passaBaixa: 6000 }); nota('triangle', 1319 * k, t, 0.09, 0.14);
      nota('square', 1976 * k, t + 0.075, 0.32, 0.06, { passaBaixa: 7000, eco: true }); nota('triangle', 1976 * k, t + 0.075, 0.35, 0.14, { eco: true }); nota('sine', 3951 * k, t + 0.075, 0.2, 0.03); } },
    gole: { ms: 150, f(t) { const k = var_(0.06); gole(t, k); gole(t + 0.13, k * 1.08); } },
    cura: { ms: 150, f(t) { // poção: dois goles + brilho mágico subindo
      const k = var_(0.04); gole(t, k); gole(t + 0.12, k * 1.1); gole(t + 0.24, k * 1.2);
      [1568, 2093, 2637, 3136, 4186].forEach((fq, i) => nota('sine', fq * k, t + 0.36 + i * 0.055, 0.45, 0.07, { eco: true }));
      ruido(t + 0.36, 0.6, 0.035, 'highpass', 6000, 9000, 0.7, true); } },
    erro: { ms: 150, f(t) { nota('square', [240, 200], t, 0.11, 0.07, { passaBaixa: 1100 }); nota('square', [200, 160], t + 0.13, 0.16, 0.07, { passaBaixa: 1000 }); } },
    raro: { ms: 200, f(t) { // item raro: arpejo de sininhos com eco e brilho
      [1047, 1319, 1568, 2093, 2637, 3136].forEach((fq, i) => { nota('triangle', fq, t + i * 0.07, 0.6, 0.1, { eco: true }); nota('sine', fq * 2, t + i * 0.07, 0.25, 0.025); });
      ruido(t + 0.1, 0.9, 0.03, 'highpass', 7000, 10000, 0.7, true); duck('raro'); } },
    ai: { ms: 120, f(t) { nota('sine', [170, 70], t, 0.18, 0.35, { glide: 0.14 }); ruido(t, 0.08, 0.12, 'lowpass', 900, 300, 0.8); } },
    skill: { ms: 150, f(t) { ruido(t, 0.28, 0.12, 'bandpass', 500, 4000, 2); nota('triangle', [660, 1320], t + 0.05, 0.25, 0.08, { eco: true }); } },
    equip: { ms: 120, f(t) { ruido(t, 0.12, 0.14, 'bandpass', 1800, 700, 1.5); nota('square', 180, t + 0.1, 0.05, 0.05, { passaBaixa: 900 }); } },
    morte: { ms: 800, f(t) { [392, 370, 349, 294].forEach((fq, i) => nota('triangle', [fq, fq * (i === 3 ? 0.9 : 1)], t + i * 0.2, i === 3 ? 0.7 : 0.22, 0.14, { passaBaixa: 2500 })); } },
    porta: { ms: 150, f(t) { nota('sine', [140, 90], t, 0.09, 0.3); ruido(t, 0.05, 0.1, 'lowpass', 1200, 400, 1); nota('sine', [120, 80], t + 0.12, 0.08, 0.2); } },
  };
  // ---- dribles (dr_<id>) e habilidades de classe (cl_<id>): cada um com a sua cara ----
  const acorde = (t, fs, onda, dur, vol, passo = 0, opc = {}) => fs.forEach((f, i) => nota(onda, f, t + i * passo, dur, vol, opc));
  const whoosh = (t, dur, de, para, vol = 0.14, pan) => ruido(t, dur, vol, 'bandpass', de, para, 1.6, false, pan);
  const baque = (t, vol = 0.4, f = [150, 55]) => { nota('sine', f, t, 0.22, vol, { glide: 0.16 }); ruido(t, 0.05, vol * 0.3, 'lowpass', 2500, 600, 0.7); };
  Object.assign(SINT, {
    dr_pedalada: { ms: 200, f(t) { whoosh(t, 0.12, 900, 2600, 0.45, -0.6); whoosh(t + 0.13, 0.12, 900, 2600, 0.45, 0.6); nota('triangle', 880, t + 0.26, 0.1, 0.14); } },
    dr_respiro: { ms: 300, f(t) { ruido(t, 0.55, 0.16, 'bandpass', 700, 1100, 1.2); ruido(t + 0.55, 0.6, 0.13, 'bandpass', 1100, 600, 1.2); acorde(t + 0.5, [784, 988, 1175], 'sine', 0.7, 0.05, 0.06, { eco: true }); } },
    dr_chute_colocado: { ms: 200, f(t) { whoosh(t, 0.1, 600, 1800, 0.1); baque(t + 0.08, 0.35, [240, 90]); nota('sine', 1760, t + 0.12, 0.25, 0.05, { eco: true }); } },
    dr_arrancada: { ms: 300, f(t) { ruido(t, 0.5, 0.4, 'bandpass', 300, 5000, 1.4); nota('sawtooth', [220, 880], t, 0.45, 0.08, { passaBaixa: 2400, glide: 0.4 }); nota('triangle', [440, 1760], t + 0.05, 0.4, 0.12, { glide: 0.35 }); } },
    dr_chapeu: { ms: 250, f(t) { whoosh(t, 0.15, 500, 1500, 0.1); nota('sine', [330, 990], t + 0.05, 0.22, 0.2, { glide: 0.2 }); nota('sine', [990, 440], t + 0.27, 0.22, 0.16, { glide: 0.2 }); nota('triangle', 1320, t + 0.5, 0.15, 0.05); } },
    dr_voleio: { ms: 250, f(t) { whoosh(t, 0.14, 400, 2200, 0.13); baque(t + 0.12, 0.5, [180, 50]); ruido(t + 0.12, 0.09, 0.14, 'highpass', 3000, 6000, 0.8); } },
    dr_elastico: { ms: 250, f(t) { nota('sine', [420, 720], t, 0.16, 0.18, { vib: [28, 40], pan: -0.5 }); nota('sine', [720, 380], t + 0.17, 0.2, 0.18, { vib: [28, 40], pan: 0.5 }); nota('triangle', [300, 150], t + 0.4, 0.2, 0.12); } },
    dr_folego_campeao: { ms: 400, f(t) { acorde(t, [262, 330, 392, 523], 'triangle', 1.1, 0.07, 0.03, { ataque: 0.15 }); [1047, 1319, 1568, 2093, 2637].forEach((f, i) => nota('sine', f, t + 0.3 + i * 0.07, 0.6, 0.05, { eco: true })); ruido(t + 0.3, 0.9, 0.03, 'highpass', 6000, 9000, 0.7, true); } },
    dr_caneta: { ms: 250, f(t) { ruido(t, 0.22, 0.4, 'bandpass', 2400, 600, 2); nota('square', 523, t + 0.2, 0.08, 0.09, { passaBaixa: 3000 }); nota('square', 1047, t + 0.29, 0.16, 0.09, { passaBaixa: 4000, eco: true }); } },
    dr_tabela: { ms: 300, f(t) { baque(t, 0.25, [320, 140]); ruido(t, 0.05, 0.05, 'highpass', 2000, 3000, 1, false, -0.7); baque(t + 0.16, 0.25, [360, 150]); ruido(t + 0.16, 0.05, 0.05, 'highpass', 2000, 3000, 1, false, 0.7);
      whoosh(t + 0.28, 0.35, 700, 2800, 0.12); acorde(t + 0.35, [659, 880, 1109], 'triangle', 0.35, 0.06, 0.04, { eco: true }); } },
    dr_bicicleta: { ms: 400, f(t) { ruido(t, 0.45, 0.16, 'bandpass', 300, 3500, 1.3); baque(t + 0.45, 0.65, [140, 40]); ruido(t + 0.45, 0.14, 0.2, 'highpass', 2500, 7000, 0.8);
      acorde(t + 0.5, [523, 659, 784, 1047], 'triangle', 0.9, 0.07, 0.04, { eco: true }); if (typeof duck === 'function') duck('raro'); } },
    dr_relampago: { ms: 400, f(t) { for (let i = 0; i < 6; i++) { nota('sawtooth', [1800 + Math.random() * 1600, 300], t + i * 0.045, 0.06, 0.05, { passaBaixa: 6000, pan: Math.random() * 1.6 - 0.8 }); ruido(t + i * 0.045, 0.04, 0.12, 'highpass', 3000, 8000, 0.7); }
      nota('sine', [90, 40], t + 0.28, 0.8, 0.35, { glide: 0.7 }); ruido(t + 0.28, 0.9, 0.12, 'lowpass', 400, 120, 0.7); acorde(t + 0.3, [1568, 2093, 2637], 'sine', 0.6, 0.04, 0.05, { eco: true }); if (typeof duck === 'function') duck('raro'); } },
    cl_muralha: { ms: 500, f(t) { nota('square', [110, 90], t, 0.35, 0.12, { passaBaixa: 700 }); [880, 1245, 1760].forEach(f => nota('sine', f, t + 0.02, 1.0, 0.06, { eco: true })); ruido(t, 0.08, 0.12, 'bandpass', 1500, 900, 1.5); } },
    cl_firula: { ms: 500, f(t) { [784, 880, 1047, 1175, 1319, 1568].forEach((f, i) => nota('triangle', f, t + i * 0.045, 0.2, 0.05, { pan: -0.6 + i * 0.24 })); ruido(t + 0.25, 0.5, 0.035, 'highpass', 7000, 10000, 0.7, true); nota('sine', 2093, t + 0.3, 0.4, 0.05, { eco: true }); } },
    cl_leitura: { ms: 500, f(t) { acorde(t, [220, 330, 494, 587], 'sine', 1.4, 0.06, 0, { ataque: 0.35 }); nota('triangle', 1760, t + 0.4, 0.9, 0.05, { eco: true }); nota('triangle', 1319, t + 0.6, 0.9, 0.04, { eco: true }); } },
    cl_segundo_folego: { ms: 500, f(t) { ruido(t, 0.5, 0.08, 'bandpass', 600, 1300, 1.2); acorde(t + 0.35, [392, 494, 587, 784], 'triangle', 0.5, 0.08, 0.08); acorde(t + 0.7, [784, 988, 1175], 'sine', 0.8, 0.05, 0.03, { eco: true }); } },
  });
  function tocaSint(tipo) {
    const s = SINT[tipo]; if (!s || !A.ctx) return false;
    const agora = performance.now(); if (agora - (A.ultimo['s_' + tipo] || 0) < s.ms) return true; A.ultimo['s_' + tipo] = agora;
    s.f(A.ctx.currentTime + 0.01); return true;
  }

  const _somSynth = som;
  som = function (tipo) {
    if (!somLigado()) return;
    const c = garanteCtx();
    if (c) {
      if (c.state === 'suspended' && A.gesto && !document.hidden) c.resume().catch(() => { });
      try { if (tocaSint(tipo)) return; } catch (e) { /* cai no sintetizador antigo */ }
      if (SFX[tipo] && !A.buf['sfx_' + SFX[tipo][0]] && !A.falhou['sfx_' + SFX[tipo][0]]) carrega('sfx_' + SFX[tipo][0]);
      try { if (tocaAmostra(tipo)) return; } catch (e) { /* cai no sintetizador */ }
    }
    if (tipo === 'nivel' || tipo === 'gol') duck(tipo);
    _somSynth(tipo);
  };

  /* ---------- música ---------- */
  function tocaLoop(nome, corpo, gainDest, volIni) {
    const c = A.ctx, b = A.buf[nome];
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = b; s.loop = true;
    const ini = Math.min(PRE, Math.max(0, b.duration - corpo - 0.01));
    s.loopStart = ini; s.loopEnd = Math.min(b.duration, ini + corpo);
    g.gain.value = volIni; s.connect(g); g.connect(gainDest);
    s.start(c.currentTime + 0.02, ini);
    return { nome, s, g };
  }
  function trocaMusica(id) {
    if (A.faixa === id) return;
    A.faixa = id;
    const c = garanteCtx(); if (!c) return;
    const t = c.currentTime;
    // nunca empilha: o que já estava sumindo para agora
    for (const f of A.fading) { try { f.s.stop(); } catch (e) { /* ok */ } }
    A.fading = [];
    if (A.atual) {
      const f = A.atual; A.atual = null;
      f.g.gain.cancelScheduledValues(t); f.g.gain.setValueAtTime(f.g.gain.value, t); f.g.gain.linearRampToValueAtTime(0, t + CROSS);
      try { f.s.stop(t + CROSS + 0.05); } catch (e) { /* ok */ }
      f.s.onended = () => { A.fading = A.fading.filter(x => x !== f); };
      A.fading.push(f);
    }
    if (!id) return;
    const nome = 'musica_' + id;
    carrega(nome).then(b => {
      if (!b || A.faixa !== id || A.atual) return;
      const f = tocaLoop(nome, MUSICAS[id], A.musBus, 0);
      const t2 = c.currentTime; f.g.gain.setValueAtTime(0, t2); f.g.gain.linearRampToValueAtTime(1, t2 + CROSS);
      A.atual = f;
    });
  }
  function ambiente(ligado) {
    const c = A.ctx; if (!c) return;
    if (ligado && !A.amb) {
      if (A.buf.sfx_torcida) A.amb = tocaLoop('sfx_torcida', AMBIENTE.torcida, A.ambGain, 1);
      else carrega('sfx_torcida');
    }
    A.ambGain.gain.setTargetAtTime(ligado ? 0.45 : 0, c.currentTime, 0.6);
  }

  /* ---------- sessões de música: toca um pouco, dá um tempo, volta (às vezes outra faixa) ---------- */
  const ALTERNA = { vila: ['vila', 'vila', 'titulo'], cidade: ['cidade', 'cidade', 'vila'], mundo: ['mundo', 'mundo', 'titulo'], europa: ['europa', 'europa', 'mundo'] };
  const PAUSA = [50, 100];   // segundos de intervalo (só ambiente)
  const VOLTAS = 2;          // quantas voltas da faixa por sessão
  function sessao(base) {
    const S = A.ses || (A.ses = { base: null });
    const agora = performance.now() / 1000;
    if (S.base !== base) { S.base = base; S.fase = 'toca'; S.faixa = base; S.ate = agora + (MUSICAS[base] || 18) * VOLTAS; } // lugar novo: música na hora
    if (agora > S.ate) {
      if (S.fase === 'toca') { S.fase = 'pausa'; S.ate = agora + PAUSA[0] + Math.random() * (PAUSA[1] - PAUSA[0]); }
      else { const op = ALTERNA[base] || [base]; S.faixa = op[Math.floor(Math.random() * op.length)]; S.fase = 'toca'; S.ate = agora + (MUSICAS[S.faixa] || 18) * VOLTAS; }
    }
    return S.fase === 'toca' ? S.faixa : null;
  }

  /* ---------- ambiente natural sintetizado (vento, ondas, cidade, passarinhos, grilos) ---------- */
  const NAT = { ok: false };
  function montaNatureza() {
    if (NAT.ok || !A.ctx) return; const c = A.ctx;
    const n = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = n.getChannelData(0); let marrom = 0;
    for (let i = 0; i < d.length; i++) { marrom = (marrom + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = marrom * 3.5; }
    const camada = (tipo, freq, q) => { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = n; s.loop = true; f.type = tipo; f.frequency.value = freq; f.Q.value = q; g.gain.value = 0; s.connect(f); f.connect(g); g.connect(A.ambBus); s.start(0, Math.random() * 2); return g; };
    const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), bd = b.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
    { const s = c.createBufferSource(), f = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; s.loop = true; f.type = 'highpass'; f.frequency.value = 900; f2.type = 'lowpass'; f2.frequency.value = 7000; g.gain.value = 0; s.connect(f); f.connect(f2); f2.connect(g); g.connect(A.ambBus); s.start(); NAT.chuva = g; }
    NAT.vento = camada('lowpass', 500, 0.5); NAT.ondas = camada('bandpass', 700, 0.6); NAT.cidade = camada('lowpass', 180, 0.7);
    // ondas: volume sobe e desce devagar
    const lfo = c.createOscillator(), prof = c.createGain(); lfo.frequency.value = 0.11; prof.gain.value = 0.06; lfo.connect(prof); prof.connect(NAT.ondas.gain); lfo.start();
    NAT.ok = true;
  }
  function piado(t) { // passarinho: 2 a 4 assobios rápidos
    const c = A.ctx, pan = c.createStereoPanner ? c.createStereoPanner() : null; if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; pan.connect(A.ambBus); }
    const base = 2400 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) { const o = c.createOscillator(), g = c.createGain(), t0 = t + i * (0.09 + Math.random() * 0.05);
      o.type = 'sine'; o.frequency.setValueAtTime(base, t0); o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), t0 + 0.06);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.035, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
      o.connect(g); g.connect(pan || A.ambBus); o.start(t0); o.stop(t0 + 0.1); }
  }
  function grilo(t) { // grilos à noite: pulsos agudos
    const c = A.ctx; for (let i = 0; i < 3; i++) { const o = c.createOscillator(), g = c.createGain(), t0 = t + i * 0.055; o.type = 'triangle'; o.frequency.value = 4300 + Math.random() * 200;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.012, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04); o.connect(g); g.connect(A.ambBus); o.start(t0); o.stop(t0 + 0.05); }
  }
  function natureza(mapa, interior, noite, tocandoMusica) {
    montaNatureza(); if (!NAT.ok) return; const c = A.ctx, t = c.currentTime;
    const praia = mapa === 'praia', vila = mapa === 'vila', cidadeGrande = CIDADE.includes(mapa) || MUNDO.includes(mapa) || EUROPA.includes(mapa);
    const k = interior ? 0 : tocandoMusica ? 0.6 : 1; // com música, o ambiente fica um pouco mais baixo
    const tempo = (mapa && typeof G !== 'undefined' && G.climaCache && G.climaCache.tempo) || 'sol'; // fora do jogo: sem chuva
    const chove = tempo === 'chuva' ? 0.1 : tempo === 'tempestade' ? 0.18 : 0;
    NAT.chuva.gain.setTargetAtTime(interior ? chove * 0.25 : chove, t, 1.2); // dentro de casa, a chuva fica abafada
    if (chove && !interior && Math.random() < 0.8) for (let i = 0; i < 3; i++) { const o = c.createOscillator(), g = c.createGain(), t0 = t + Math.random(); o.type = 'sine'; o.frequency.setValueAtTime(1800 + Math.random() * 1800, t0); o.frequency.exponentialRampToValueAtTime(600, t0 + 0.04); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.02, t0 + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05); o.connect(g); g.connect(A.ambBus); o.start(t0); o.stop(t0 + 0.06); } // pingos
    const ventoExtra = tempo === 'neve' ? 0.07 : tempo === 'areia' ? 0.12 : tempo === 'tempestade' ? 0.05 : 0;
    NAT.vento.gain.setTargetAtTime(((vila || praia || cidadeGrande ? 0.05 : 0) + ventoExtra) * k, t, 1.5);
    NAT.ondas.gain.setTargetAtTime((praia ? 0.09 : 0) * k, t, 1.5);
    NAT.cidade.gain.setTargetAtTime((cidadeGrande && mapa !== 'estadio' ? 0.07 : 0) * k, t, 1.5);
    if (interior || !k) return;
    if (!noite && !chove && tempo !== 'neve' && (vila || praia || cidadeGrande) && Math.random() < (vila ? 0.35 : 0.15)) piado(t + Math.random() * 0.8);
    if (noite && (vila || praia) && Math.random() < 0.6) grilo(t + Math.random() * 0.5);
  }

  const VILA = ['vila', 'praia', 'casa', 'bazar', 'escola'];
  const CIDADE = ['cidade', 'ct', 'estadio', 'loja', 'refeitorio', 'rio', 'arena_copa'];
  const MUNDO = ['cairo', 'toquio', 'doha', 'miami', 'buenos'];
  const EUROPA = ['lisboa', 'madri', 'milao', 'munique', 'londres'];
  function faixaDoMapa(id) {
    if (VILA.includes(id)) return 'vila';
    if (CIDADE.includes(id)) return 'cidade';
    if (MUNDO.includes(id)) return 'mundo';
    if (EUROPA.includes(id)) return 'europa';
    for (const lista of [MUNDO, EUROPA]) for (const c of lista) if (id && id.indexOf(c) === 0) return lista === MUNDO ? 'mundo' : 'europa';
    return null;
  }
  function contexto() {
    const vis = sel => { const e = document.querySelector(sel); return !!(e && !e.hidden && getComputedStyle(e).display !== 'none'); };
    const hist = document.getElementById('historia');
    if (hist && hist.isConnected && getComputedStyle(hist).display !== 'none') return { musica: 'titulo', torcida: false };
    const modal = document.getElementById('modal');
    const partida = modal && !modal.hidden && modal.querySelector('.placar-ao-vivo');
    if (partida) return { musica: 'cidade', torcida: true };
    if (typeof G !== 'undefined' && G.rodando && G.mapa) {
      const id = G.mapa.id;
      let f = faixaDoMapa(id);
      if (!f && G.mapa.interior && A.faixa) f = A.faixa;   // interiores desconhecidos: mantém a faixa
      return { musica: f || A.faixa || 'vila', torcida: id === 'estadio' };
    }
    if (vis('#inicio')) return { musica: 'titulo', torcida: false };
    return { musica: A.faixa, torcida: false };
  }

  function tick() {
    const on = somLigado();
    if (on !== A.somOnAnt) {
      A.somOnAnt = on; aplicaVolumes();
      if (A.ctx) { if (on && A.gesto && !document.hidden) A.ctx.resume().catch(() => { }); else if (!on) setTimeout(() => { if (!somLigado() && A.ctx) A.ctx.suspend().catch(() => { }); }, 120); }
    }
    if (!A.gesto || !A.ctx) return;
    const cx = contexto();
    // no mapa (fora de partida/história/tela inicial) a música vem em sessões, com intervalos de ambiente
    const noMapa = typeof G !== 'undefined' && G.rodando && G.mapa && cx.musica !== 'titulo' && !cx.torcida;
    let faixa = cx.musica;
    if (noMapa) faixa = sessao(cx.musica); else if (A.ses) A.ses.base = null; // fora do mapa: próxima volta começa com música
    trocaMusica(on ? faixa : A.faixa);
    ambiente(on && cx.torcida);
    if (on && typeof G !== 'undefined' && G.rodando && G.mapa && G.save) { const h = G.save.hora / 60 % 24; natureza(G.mapa.id, !!G.mapa.interior, h >= 19 || h < 6, !!faixa); }
    else if (NAT.ok) natureza('', true, false, false);
  }

  /* ---------- primeiro gesto (autoplay) ---------- */
  function primeiroGesto() {
    if (A.gesto) return;
    A.gesto = true;
    const c = garanteCtx(); if (!c) return;
    if (somLigado()) c.resume().catch(() => { });
    carregaEfeitos();
    tick();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, primeiroGesto, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!A.ctx) return;
    if (document.hidden) A.ctx.suspend().catch(() => { });
    else if (A.gesto && somLigado()) A.ctx.resume().catch(() => { });
  });
  setInterval(tick, 1000);

  /* ---------- interface: botão 🎵 com volumes ---------- */
  const css = `
  .rac-audio-pop { position: fixed; z-index: 60; width: 230px; background: var(--papel, #f7e3b5); color: var(--tinta, #3b2410);
    border: 3px solid var(--madeira, #8a4b24); border-radius: 8px; box-shadow: 0 0 0 2px var(--madeira2, #5e2f14), 0 8px 18px rgba(0,0,0,.35);
    padding: 10px 12px; font-family: 'Fredoka', 'Nunito', sans-serif; font-size: 14px; }
  .rac-audio-pop h4 { margin: 0 0 8px; font-size: 16px; color: var(--madeira2, #5e2f14); }
  .rac-audio-pop label { display: grid; grid-template-columns: 62px 1fr 38px; align-items: center; gap: 6px; margin: 6px 0; font-weight: 600; }
  .rac-audio-pop output { text-align: right; font-variant-numeric: tabular-nums; }
  .rac-audio-pop input[type=range] { width: 100%; accent-color: var(--madeira, #8a4b24); cursor: pointer; }
  .rac-audio-pop small { display: block; margin-top: 6px; opacity: .75; font-size: 12px; }
  #btnAudio { min-width: 30px; }`;
  function montaUI() {
    const bs = document.getElementById('btnSom'); if (!bs || document.getElementById('btnAudio')) return;
    const st = document.createElement('style'); st.id = 'rac-audio-css'; st.textContent = css; document.head.append(st);
    const b = document.createElement('button');
    b.className = 'btn mini'; b.id = 'btnAudio'; b.type = 'button'; b.title = 'Volume da música e dos efeitos'; b.textContent = '🎵';
    bs.after(b);
    const pop = document.createElement('div'); pop.className = 'rac-audio-pop'; pop.hidden = true;
    const linha = (rot, chave) => {
      const l = document.createElement('label'); const s = document.createElement('span'); s.textContent = rot;
      const r = document.createElement('input'); r.type = 'range'; r.min = 0; r.max = 100; r.step = 5; r.value = Math.round(A.vol[chave] * 100);
      const o = document.createElement('output'); o.textContent = r.value + '%';
      r.addEventListener('input', () => { A.vol[chave] = r.value / 100; o.textContent = r.value + '%'; aplicaVolumes(); salvaVol(); if (chave === 'sfx') som('moeda'); });
      l.append(s, r, o); return l;
    };
    const h = document.createElement('h4'); h.textContent = 'Som do jogo';
    const dica = document.createElement('small'); dica.textContent = 'Ambiente = chuva, ondas, passarinhos e torcida. O botão "Som" liga e desliga tudo.';
    pop.append(h, linha('Música', 'musica'), linha('Ambiente', 'ambiente'), linha('Efeitos', 'sfx'), dica);
    document.body.append(pop);
    const posiciona = () => { const r = b.getBoundingClientRect(); pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = Math.max(8, Math.min(window.innerWidth - 238, r.right - 230)) + 'px'; };
    b.addEventListener('click', ev => { ev.stopPropagation(); pop.hidden = !pop.hidden; if (!pop.hidden) posiciona(); });
    document.addEventListener('pointerdown', ev => { if (!pop.hidden && !pop.contains(ev.target) && ev.target !== b) pop.hidden = true; }, true);
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') pop.hidden = true; });
    window.addEventListener('resize', () => { if (!pop.hidden) posiciona(); });
    // o botão Som (ui.js) muda G.somOn: aplica na hora
    bs.addEventListener('click', () => setTimeout(tick, 0));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montaUI); else montaUI();
})();
