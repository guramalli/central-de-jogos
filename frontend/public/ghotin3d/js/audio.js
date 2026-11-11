// O som: os efeitos recortados do efeitos.mp3 (pelo sons.json), o ambiente, a música e as vozes do arqueiro.
export class Som {
  constructor() {
    this.pronto = false; this.registro = []; this.tempoJogo = 0; this.ultimaVoz = -10; this.mudo = false;
    this.ouvinte = { x: 0, z: 0, dx: 1, dz: 0 };   // posição do herói e o "lado direito" da câmera
  }
  async carregar(base, progresso = () => { }) {
    const AC = window.AudioContext || window.webkitAudioContext; this.ac = new AC();
    this.mestre = this.ac.createGain(); this.mestre.gain.value = 0.9; this.mestre.connect(this.ac.destination);
    this.gEfeitos = this.ac.createGain(); this.gEfeitos.gain.value = 0.85; this.gEfeitos.connect(this.mestre);
    this.gVozes = this.ac.createGain(); this.gVozes.gain.value = 1.0; this.gVozes.connect(this.mestre);
    this.gMusica = this.ac.createGain(); this.gMusica.gain.value = 0.32; this.gMusica.connect(this.mestre);
    this.gAmb = this.ac.createGain(); this.gAmb.gain.value = 0.55; this.gAmb.connect(this.mestre);
    const buf = async (url) => { const r = await fetch(url); const a = await r.arrayBuffer(); const b = await this.ac.decodeAudioData(a); progresso(); return b; };
    const js = async (url) => (await fetch(url)).json();
    this.mapa = await js(base + 'sons.json'); this.mapaAmb = await js(base + 'ambiente.json');
    const vozes = ['venenosa', 'fogo', 'concentrado', 'chuva', 'passos'];
    const [ef, amb, m1, m2, m3, ...vz] = await Promise.all([buf(base + 'efeitos.mp3'), buf(base + 'ambiente.mp3'), buf(base + 'vila1.mp3'), buf(base + 'campo.mp3'), buf(base + 'combate.mp3'),
      ...vozes.flatMap(v => [buf(`${base}vozes/arqueiro_${v}_1.mp3`), buf(`${base}vozes/arqueiro_${v}_2.mp3`)])]);
    this.bEfeitos = ef; this.bAmb = amb; this.musicas = { vila: m1, campo: m2, combate: m3 }; this.vozes = {}; vozes.forEach((v, i) => this.vozes[v] = [vz[i * 2], vz[i * 2 + 1]]);
    this.arquivos = new Map([[ef, 'efeitos.mp3'], [amb, 'ambiente.mp3'], [m1, 'vila1.mp3'], [m2, 'campo.mp3'], [m3, 'combate.mp3']]); vozes.forEach((v) => { this.arquivos.set(this.vozes[v][0], `vozes/arqueiro_${v}_1.mp3`); this.arquivos.set(this.vozes[v][1], `vozes/arqueiro_${v}_2.mp3`); });
    this.pronto = true; this.loops = {}; this.musAtual = null;
  }
  destravar() { if (this.ac && this.ac.state !== 'running') this.ac.resume(); }
  _tocarBuf(b, ini, dur, vol, destino, vel = 1, pan = 0, atraso = 0, loop = false) {
    if (!loop) this.registro.push({ t: +(this.tempoJogo + atraso).toFixed(3), arq: this.arquivos.get(b), ini: +ini.toFixed(3), dur: +(dur).toFixed(3), vol: +vol.toFixed(3), vel: +vel.toFixed(3), loop });
    if (!this.pronto || this.mudo) return null;
    const s = this.ac.createBufferSource(); s.buffer = b; s.playbackRate.value = vel; const g = this.ac.createGain(); g.gain.value = vol; let no = g;
    if (pan && this.ac.createStereoPanner) { const p = this.ac.createStereoPanner(); p.pan.value = pan; g.connect(p); no = p; }
    s.connect(g); no.connect(destino);
    if (loop) { s.loop = true; s.loopStart = ini; s.loopEnd = ini + dur; s.start(this.ac.currentTime + atraso, ini); } else s.start(this.ac.currentTime + atraso, ini, dur);
    return { s, g };
  }
  // efeito pelo nome do sons.json; pos = {x,z} no mundo para atenuar e pôr no lado certo
  tocar(nome, { vol = 1, pos = null, vel = 1, atraso = 0, var: v = 0.06 } = {}) {
    const d = this.mapa?.[nome]; if (!d) return; const tr = d.trechos[(Math.random() * d.trechos.length) | 0]; let g = d.vol * vol, pan = 0;
    if (pos) { const dx = pos.x - this.ouvinte.x, dz = pos.z - this.ouvinte.z; const dist = Math.hypot(dx, dz); g *= 1 / (1 + (dist / 9) * (dist / 9)); if (dist > 34) return; pan = Math.max(-0.7, Math.min(0.7, (dx * this.ouvinte.dx + dz * this.ouvinte.dz) / 12)); }
    return this._tocarBuf(this.bEfeitos, tr[0], tr[1], g, this.gEfeitos, (d.vel || 1) * vel * (1 + (Math.random() - 0.5) * 2 * v), pan, atraso);
  }
  // grito da skill: sai em 40% dos usos, com 1,5 s entre falas (sempre = força a fala)
  voz(skill, sempre = false) {
    if (!sempre && Math.random() > 0.4) return; if (this.tempoJogo - this.ultimaVoz < 1.5) return; this.ultimaVoz = this.tempoJogo;
    const b = this.vozes?.[skill]?.[(Math.random() * 2) | 0]; if (b) this._tocarBuf(b, 0, b.duration, 1, this.gVozes);
  }
  // os fundos de ambiente: pesos por nome ({vila_loop:1, vento_loop:.4, ...})
  ambiente(pesos) {
    if (!this.pronto || this.mudo) return;
    for (const nome of Object.keys(this.mapaAmb)) {
      const alvo = (pesos[nome] || 0) * this.mapaAmb[nome].vol; let l = this.loops[nome];
      if (!l && alvo > 0.001) { const tr = this.mapaAmb[nome].trechos[0]; l = this.loops[nome] = this._tocarBuf(this.bAmb, tr[0], tr[1], 0, this.gAmb, 1, 0, 0, true); if (l) l.alvo = 0; else continue; }
      if (l && Math.abs((l.alvo ?? -1) - alvo) > 0.01) { l.alvo = alvo; l.g.gain.cancelScheduledValues(this.ac.currentTime); l.g.gain.setTargetAtTime(alvo, this.ac.currentTime, 0.9); }
    }
  }
  musica(nome) {
    if (!this.pronto || this.mudo || this.musAtual === nome) return; const t = this.ac.currentTime;
    if (this.mus) { const m = this.mus; m.g.gain.setTargetAtTime(0, t, 0.8); setTimeout(() => { try { m.s.stop(); } catch (e) { } }, 4000); }
    this.musAtual = nome; const b = this.musicas[nome]; if (!b) { this.mus = null; return; }
    this.mus = this._tocarBuf(b, 0, b.duration, 0, this.gMusica, 1, 0, 0, true); if (this.mus) this.mus.g.gain.setTargetAtTime(1, t, 1.2);
  }
  alternarMusica() { this.semMusica = !this.semMusica; this.gMusica.gain.setTargetAtTime(this.semMusica ? 0 : 0.32, this.ac.currentTime, 0.2); return !this.semMusica; }
}
