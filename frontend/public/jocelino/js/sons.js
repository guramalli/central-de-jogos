// Jocelino — sons.js — efeitos e músicas com WebAudio (como o audio.js do Lenda): quatro barramentos (música, ambiente,
// efeitos, interface) com o volume das opções; cada efeito sorteia uma das gravações (golpe_1..3: um golpe nunca soa
// igual ao outro, como no Stardew) e varia o tom; música do dia e da noite com troca suave; passos pelo piso.
// O navegador só libera o som depois do primeiro clique ou tecla.

const VOLUME_EFEITO = { passo_grama: -12, passo_chao: -14, passo_madeira: -12, letra: -6, cursor: -4, golpe: -4, foice: -2, dinheiro: -2 };
const SONS_INTERFACE = ['cursor', 'abrir', 'fechar', 'letra', 'feito', 'erro', 'dinheiro'];
const sons = {
  ctx: null, bus: {}, buffers: new Map(), musicaAtual: '', _fonteMusica: null, _ganhoMusica: null,
  volumes: { musica: 70, ambiente: 80, efeitos: 80, interface: 60 },
  iniciar() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const mestre = this.ctx.createGain(); mestre.connect(this.ctx.destination);
    for (const b of ['musica', 'ambiente', 'efeitos', 'interface']) { const g = this.ctx.createGain(); g.connect(mestre); this.bus[b] = g; }
    this.aplicarVolumes();
  },
  aplicarVolumes() { for (const b in this.bus) this.bus[b].gain.value = (this.volumes[b] / 100) ** 2; },
  // As gravações de um efeito: nome_1, nome_2... (ou o arquivo único com o nome).
  variacoes(nome) {
    if (typeof SONS_LISTA === 'undefined') return [];
    const v = SONS_LISTA.filter(s => s.startsWith(nome + '_') && /^\d+$/.test(s.slice(nome.length + 1)));
    return v.length ? v : (SONS_LISTA.includes(nome) ? [nome] : []);
  },
  async buffer(arq) {
    if (!this.buffers.has(arq)) this.buffers.set(arq, fetch('a/som/' + arq + '.mp3?v=' + VERSAO_ARTE).then(r => r.arrayBuffer()).then(b => this.ctx.decodeAudioData(b)).catch(() => null));
    return this.buffers.get(arq);
  },
  async tocar(nome, tom = 1, variacao = 0.08, db = 0) {
    if (!this.ctx || !G.somLigado) return;
    const vs = this.variacoes(nome);
    if (!vs.length) return;
    const buf = await this.buffer(sorteio(vs));
    if (!buf) return;
    const f = this.ctx.createBufferSource(); f.buffer = buf;
    f.playbackRate.value = tom * (1 + rnd(-variacao, variacao));
    const g = this.ctx.createGain(); g.gain.value = Math.pow(10, (db + (VOLUME_EFEITO[nome] || 0)) / 20);
    f.connect(g); g.connect(this.bus[SONS_INTERFACE.includes(nome) ? 'interface' : 'efeitos']);
    f.start();
  },
  // Música em laço, com troca suave (2 s).
  async musica(nome) {
    if (!this.ctx || nome === this.musicaAtual) return;
    this.musicaAtual = nome;
    const velha = this._fonteMusica, gv = this._ganhoMusica;
    if (velha) { gv.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2); setTimeout(() => { try { velha.stop(); } catch (e) {} }, 2100); }
    this._fonteMusica = null;
    if (!nome) return;
    const buf = await this.buffer(nome);
    if (!buf || this.musicaAtual !== nome) return;
    const f = this.ctx.createBufferSource(); f.buffer = buf; f.loop = true;
    const g = this.ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(0.55, this.ctx.currentTime + 2);
    f.connect(g); g.connect(this.bus.musica); f.start();
    this._fonteMusica = f; this._ganhoMusica = g;
  },
  // Ambiente em laço (pássaros, vento): cada um com o próprio volume, que muda devagar (1 s).
  _amb: {},
  async ambiente(nome, alvo) {
    if (!this.ctx) return;
    let a = this._amb[nome];
    if (!a) {
      if (alvo <= 0) return;
      a = this._amb[nome] = { g: this.ctx.createGain(), carregando: true };
      a.g.gain.value = 0; a.g.connect(this.bus.ambiente);
      const buf = await this.buffer(nome);
      if (!buf) return;
      const f = this.ctx.createBufferSource(); f.buffer = buf; f.loop = true; f.connect(a.g); f.start();
      a.carregando = false;
    }
    a.g.gain.cancelScheduledValues(this.ctx.currentTime);
    a.g.gain.setValueAtTime(a.g.gain.value, this.ctx.currentTime);
    a.g.gain.linearRampToValueAtTime(Math.max(0, alvo), this.ctx.currentTime + 1);
  },
  // Som avulso do ambiente (um canto, uma rajada), num lado sorteado da tela: quebra a repetição do laço de fundo.
  async avulso(nome, lado = 0, db = -6) {
    if (!this.ctx || !G.somLigado || !this.variacoes(nome).length) return;
    const buf = await this.buffer(sorteio(this.variacoes(nome)));
    if (!buf) return;
    const f = this.ctx.createBufferSource(); f.buffer = buf; f.playbackRate.value = 1 + rnd(-0.04, 0.04);
    const g = this.ctx.createGain(); g.gain.value = Math.pow(10, db / 20);
    const p = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (p) { p.pan.value = clamp(lado, -1, 1); f.connect(g); g.connect(p); p.connect(this.bus.ambiente); } else { f.connect(g); g.connect(this.bus.ambiente); }
    f.start();
  },
};
for (const ev of ['pointerdown', 'keydown', 'click', 'touchend']) addEventListener(ev, () => sons.iniciar(), { once: false, capture: true });

let _proxCanto = 8;
// Música: de dia a do dia, da noite a da noite (a partir das 18h); na pensão, a calma da Vila.
setInterval(() => {
  if (!G.comecou || !sons.ctx) return;
  sons.musica(noSalaoDaPensao() ? 'vila_calma' : (G.minutos >= 18 * 60 ? 'musica_noite' : 'musica_dia'));
  // Fora de casa: o fundo do dia (passarinhos) ou da noite (grilos, sapos), e a brisa acompanhando o vento (vida.js).
  // Os fundos são laços longos emendados sem pausa (produzir_ambiente.sh); dentro de casa, só um fio do lado de fora.
  const fora = G.mapa && !G.mapa.dentro && !G.mapa.cenario, dia = G.minutos >= 5 * 60 + 30 && G.minutos < 18 * 60 + 30;
  const vento = typeof VIDA !== 'undefined' ? VIDA.vento : 0.5;
  sons.ambiente('amb_dia', fora && dia ? 0.45 : (dia ? 0.06 : 0));
  sons.ambiente('amb_noite', fora && !dia ? 0.5 : (!dia ? 0.07 : 0));
  sons.ambiente('amb_vento', fora ? 0.1 + 0.25 * vento : 0);
  // Cantos avulsos de dia, em horas sorteadas e de lados diferentes (nunca o mesmo desenho do laço).
  _proxCanto -= 1;
  if (fora && dia && _proxCanto <= 0) { _proxCanto = Math.round(rnd(6, 18)); sons.avulso(sorteio(['avulso_bemtevi', 'avulso_sabia', 'avulso_rolinha']), rnd(-0.85, 0.85), rnd(-12, -5)); }
}, 1000);
// Passos pelo piso (grama, chão de terra/calçada, madeira dentro da pensão).
let _passoT = 0;
ATUALIZADORES.push(dt => {
  const j = G.jog;
  if (!j || !j.andando) { _passoT = 0.2; return; }
  _passoT -= dt;
  if (_passoT > 0) return;
  _passoT = G.teclas.has(TECLAS.correr) ? 0.24 : 0.32;
  const t = j.ladrilho();
  const piso = G.mapa.dentro ? 'passo_madeira' : (G.mapa.chaoEm(t.x, t.y) === CH.GRAMA ? 'passo_grama' : 'passo_chao');
  sons.tocar(piso, 1, 0.1, 0);
});
