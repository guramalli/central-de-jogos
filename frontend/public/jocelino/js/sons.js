// Jocelino — sons.js — efeitos e músicas com WebAudio (como o audio.js do Lenda): quatro barramentos (música, ambiente,
// efeitos, interface) com o volume das opções; cada efeito sorteia uma das gravações (golpe_1..3: um golpe nunca soa
// igual ao outro, como no Stardew) e varia o tom; música do dia e da noite com troca suave; passos pelo piso.
// O navegador só libera o som depois do primeiro clique ou tecla.

// O rodízio das músicas (14/10: "a que está no jogo é muito agradável mas cansa rápido"). Fora da pensão, como no Stardew:
// toca uma faixa inteira, depois um silêncio de música (só o ambiente) de MUSICA_PAUSA_MIN a MUSICA_PAUSA_MAX segundos, depois
// outra sorteada, nunca a mesma em seguida. Na pensão, como no sushi bar do Dave: uma emenda na outra, sem silêncio.
const MUSICA_PAUSA_MIN = 20, MUSICA_PAUSA_MAX = 45;   // s de silêncio de música entre uma faixa e a próxima (fora da pensão)
const MUSICA_TROCA = 2;                               // s da troca suave (uma some enquanto a outra entra)
const MUSICAS = {
  dia: ['musica_dia', 'musica_dia_2', 'musica_dia_3', 'musica_dia_4'],   // bossa de violão; bossa da manhã; choro; baião
  noite: ['musica_noite', 'musica_noite_2', 'musica_noite_3'],            // violão e flauta; violão e flauta de bambu; seresta
  pensao: ['pensao_animada_1', 'pensao_animada_2', 'pensao_animada_3'],   // samba-choro (o escolhido); forró-xote; gafieira
  festa: ['musica_festa'],                                                // (guardada para a festa; hoje nada a chama)
};
const VOLUME_EFEITO = { passo_grama: -12, passo_chao: -14, passo_madeira: -12, letra: -6, cursor: -4, golpe: -4, foice: -2, dinheiro: -2 };
const SONS_INTERFACE = ['cursor', 'abrir', 'fechar', 'letra', 'feito', 'erro', 'dinheiro'];
const sons = {
  ctx: null, bus: {}, buffers: new Map(), musicaAtual: '', _fonteMusica: null, _ganhoMusica: null,
  volumes: { musica: 70, ambiente: 80, efeitos: 80, interface: 60 },
  iniciar() {
    if (!MODO_TESTE.som) return;   // modo de teste (?test=1): sem áudio nenhum (nada toca, nada é baixado)
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
  // Uma faixa inteira (sem laço), com troca suave (MUSICA_TROCA s): a anterior some enquanto esta entra. fadeFim: a faixa
  // some sozinha nos 3 s finais (fora da pensão, antes do silêncio). nome vazio: só apaga a que está tocando.
  // Quem escolhe a faixa é o rodízio (lá embaixo); se ela não carregar, o rodízio a deixa de lado e nada trava.
  _vezMusica: 0, _durMusica: 0, _posMusica: 0, _tMusica: 0, rodizio: null,
  async musica(nome, fadeFim = false) {
    if (!this.ctx) return;
    const vez = ++this._vezMusica;
    this.musicaAtual = nome; this._durMusica = 0;                           // enquanto a nova carrega, o rodízio não conta a velha
    const buf = nome ? await this.buffer(nome) : null;                      // ... e a velha segue tocando (sem buraco na pensão)
    if (vez !== this._vezMusica) return;                                    // outra troca chegou enquanto esta carregava
    const t0 = this.ctx.currentTime, velha = this._fonteMusica, gv = this._ganhoMusica;
    if (velha) {
      gv.gain.cancelScheduledValues(t0); gv.gain.setValueAtTime(gv.gain.value, t0); gv.gain.linearRampToValueAtTime(0, t0 + MUSICA_TROCA);
      setTimeout(() => { try { velha.stop(); } catch (e) {} }, MUSICA_TROCA * 1000 + 100);
    }
    this._fonteMusica = null;
    if (!nome) return;
    if (!buf) { if (this.rodizio) this.rodizio.falhou(nome, t0); return; }  // não carregou: o rodízio pula para outra
    const f = this.ctx.createBufferSource(); f.buffer = buf;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.55, t0 + MUSICA_TROCA);
    if (fadeFim && buf.duration > 8) { g.gain.setValueAtTime(0.55, t0 + buf.duration - 3); g.gain.linearRampToValueAtTime(0, t0 + buf.duration); }
    f.connect(g); g.connect(this.bus.musica); f.start();
    this._fonteMusica = f; this._ganhoMusica = g; this._durMusica = buf.duration; this._posMusica = 0; this._tMusica = t0;
    // Cada faixa aberta ocupa uns 35 MB: guarda só a que toca (a próxima vem do cache do navegador, o mp3 já baixado).
    for (const n of Object.values(MUSICAS).flat()) if (n !== nome) this.buffers.delete(n);
  },
  // Quanto falta da faixa, em segundos de verdade (anda com a velocidade: a "Última rodada" acelera a da pensão).
  // null enquanto nada toca ou a faixa ainda carrega.
  restanteMusica() {
    const f = this._fonteMusica;
    if (!f || !this._durMusica) return null;
    const t = this.ctx.currentTime, r = f.playbackRate.value || 1;
    this._posMusica += (t - this._tMusica) * r; this._tMusica = t;
    return Math.max(0, (this._durMusica - this._posMusica) / r);
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

// ---------- o rodízio das músicas ----------
// Lógica pura: o relógio (agora) e quanto falta da faixa (restante) chegam de fora, então a s36 testa sem áudio nenhum.
// passo(momento, agora, restante) devolve o que fazer: null (nada), { tocar: nome } (troca suave para essa faixa;
// '' = calar) ou { parar: true } (a faixa acabou e começa o silêncio).
//  - mudou o momento (18h, entrar ou sair da pensão): troca na hora para uma faixa da lista nova;
//  - fora da pensão: a faixa acabou -> silêncio de MUSICA_PAUSA_MIN..MAX s -> outra sorteada;
//  - na pensão: a MUSICA_TROCA + 1 s do fim já entra a próxima (emenda, sem silêncio).
// Nunca a mesma em seguida (nem a última daquele momento, quando a lista deixa). Faixa que não carregou fica de fora.
function criarRodizio(listas = MUSICAS, rand = Math.random) {
  return {
    momento: '', faixa: '', estado: 'parado', pausaAte: 0, ultimaDo: {}, ruins: new Set(),
    sortear(momento) {
      const l = (listas[momento] || []).filter(n => !this.ruins.has(n));
      if (!l.length) return '';
      const nova = l.filter(n => n !== this.faixa && n !== this.ultimaDo[momento]), outra = l.filter(n => n !== this.faixa);
      const c = nova.length ? nova : (outra.length ? outra : l);
      return c[Math.min(c.length - 1, Math.floor(rand() * c.length))];
    },
    _tocar(momento) {
      const n = this.sortear(momento);
      this.estado = n ? 'tocando' : 'parado';
      if (n) { this.faixa = n; this.ultimaDo[momento] = n; }
      return { tocar: n };
    },
    passo(momento, agora, restante) {
      if (momento !== this.momento) { this.momento = momento; return this._tocar(momento); }
      if (this.estado === 'pausa') return agora >= this.pausaAte ? this._tocar(momento) : null;
      if (this.estado !== 'tocando' || restante == null) return null;
      if (momento === 'pensao') return restante <= MUSICA_TROCA + 1 ? this._tocar(momento) : null;
      if (restante > 0) return null;
      this.estado = 'pausa'; this.pausaAte = agora + MUSICA_PAUSA_MIN + rand() * (MUSICA_PAUSA_MAX - MUSICA_PAUSA_MIN);
      return { parar: true };
    },
    // A faixa não carregou: sai do sorteio e, no próximo passo, entra outra (sem silêncio extra).
    falhou(nome, agora) { this.ruins.add(nome); if (nome === this.faixa && this.estado === 'tocando') { this.estado = 'pausa'; this.pausaAte = agora; } },
  };
}
sons.rodizio = criarRodizio();
// O momento da música: o salão da pensão; fora dela, a noite a partir das 18h; senão o dia.
function momentoMusica() { return noSalaoDaPensao() ? 'pensao' : (G.minutos >= 18 * 60 ? 'noite' : 'dia'); }

let _proxCanto = 8;
setInterval(() => {
  if (!G.comecou || !sons.ctx) return;
  const momento = momentoMusica(), resta = sons.restanteMusica();
  const ac = sons.rodizio.passo(momento, sons.ctx.currentTime, resta);
  if (ac) sons.musica(ac.tocar || '', !!ac.tocar && momento !== 'pensao');
  // (13/10, o Dave: a música acelera perto de fechar) Na "Última rodada!", a música da pensão anda mais ligeira.
  if (sons._fonteMusica) { const r = momento === 'pensao' && G.turno && G.turno._ultima ? 1.1 : 1; if (sons._fonteMusica.playbackRate.value !== r) sons._fonteMusica.playbackRate.value = r; }
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
