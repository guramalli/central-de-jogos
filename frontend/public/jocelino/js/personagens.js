// Jocelino — personagens.js — gente andando: a folha de 4×4 (colunas: frente, costas, esquerda, direita; linhas: o
// passo — 1ª e 3ª com a perna à frente, 2ª e 4ª paradas; o tamanho do quadro vem de cada folha: crianças são menores), os moradores (alguns passeiam numa área) e o Jocelino,
// que anda com WASD, corre com Shift, bate na caixa do pé dos objetos e passa pelas saídas.

const DIR = { BAIXO: 0, CIMA: 1, ESQUERDA: 2, DIREITA: 3 };
const DIR_VET = [[0, 1], [0, -1], [-1, 0], [1, 0]];

class Personagem {
  constructor(id, nome, x, y, dir = DIR.BAIXO) {
    Object.assign(this, { id, nome, x, y, dir, andando: false, t: 0, vagueia: false, area: null, visivel: true, vel: 120,
      _alvo: null, _espera: rnd(1, 3) });
  }
  get folha() { return 'personagens/' + this.id + '/andar'; }
  virarPara(x, y) { const dx = x - this.x, dy = y - this.y; this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? DIR.ESQUERDA : DIR.DIREITA) : (dy < 0 ? DIR.CIMA : DIR.BAIXO); }
  parar() { this.andando = false; }
  _bate(x, y) { return !!G.mapa && bate({ x: x - 14, y: y - 14, w: 28, h: 14 }, G.mapa); }
  atualiza(dt) {
    this.t += dt;
    if (!this.vagueia || !this.area) return;
    if (this._alvo) {
      const dx = this._alvo.x - this.x, dy = this._alvo.y - this.y, d = Math.hypot(dx, dy);
      if (d < 3) { this._alvo = null; this.andando = false; this._espera = rnd(1.5, 4); return; }
      const v = this.velPasseio || 60, nx = this.x + dx / d * Math.min(d, v * dt), ny = this.y + dy / d * Math.min(d, v * dt);
      // Esbarrou em alguma coisa (o Jocelino largou um item, um objeto novo): desiste e escolhe outro canto.
      if (this._bate(nx, ny)) { this._alvo = null; this.andando = false; this._espera = rnd(0.5, 1.5); return; }
      this.x = nx; this.y = ny;
      this.andando = true; this.virarPara(this._alvo.x, this._alvo.y);
      return;
    }
    this._espera -= dt;
    if (this._espera <= 0) {
      // Um canto perto, dentro da área, com o caminho em linha reta livre (ninguém atravessa casa nem bancada).
      const a = this.area;
      for (let k = 0; k < 8 && !this._alvo; k++) {
        const L = this.passeioLongo ? 3 : 1;
        const alvo = { x: clamp(this.x + rnd(-2.5, 2.5) * L * TILE, a.x, a.x + a.w), y: clamp(this.y + rnd(-1.5, 1.5) * TILE, a.y, a.y + a.h) };
        let livre = true;
        for (let s = 1; s <= 8 && livre; s++) livre = !this._bate(lerp(this.x, alvo.x, s / 8), lerp(this.y, alvo.y, s / 8));
        if (livre) this._alvo = alvo;
      }
      if (!this._alvo) this._espera = rnd(1, 2);
    }
  }
  desenha(ctx) {
    const img = spr(this.folha);
    // Sombra no pé.
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(this.x, this.y - 2, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (!img) return;
    const qw = img.naturalWidth / 4, qh = img.naturalHeight / 4;
    const passo = this.andando ? Math.floor(this.t * 8) % 4 : 1;
    // No palco de lado a gente aparece maior (como no Bancho); a arte é a mesma.
    const e = G.mapa && G.mapa.palco ? PALCO.ESCALA_GENTE : 1;
    ctx.drawImage(img, this.dir * qw, passo * qh, qw, qh, this.x - qw * e / 2, this.y - (qh - 2) * e, qw * e, qh * e);
    // Coração subindo (carinho no Caramelo).
    if (this._coracao > 0) {
      this._coracao -= 1 / 60;
      const k = 1 - this._coracao / 1.2;
      desenhaFx(ctx, 'coracao', this.x, this.y - qh - 14 - k * 30, { alfa: Math.min(1, this._coracao * 2) });
    }
  }
}

class Jogador extends Personagem {
  constructor() { super('jocelino', '', 0, 0); this.carga = {}; this.golpe = 0; this.golpeItem = ''; this.travado = 0; }
  static VEL = 240;
  static VEL_CORRENDO = 336;
  // Caixa do pé (o que bate nos objetos).
  caixa(x = this.x, y = this.y) { return { x: x - 14, y: y - 14, w: 28, h: 14 }; }
  ladrilho() { return { x: Math.floor(this.x / TILE), y: Math.floor((this.y - 6) / TILE) }; }
  // Ponto à frente (um ladrilho na direção em que olha).
  frente() { const v = DIR_VET[this.dir]; return { x: this.x + v[0] * TILE * 0.9, y: this.y - 12 + v[1] * TILE * 0.9 }; }
  atualiza(dt) {
    this.t += dt;
    if (this.travado > 0) this.travado -= dt;
    if (this.golpe > 0) { this.golpe -= dt; this.andando = false; return; }
    let vx = 0, vy = 0;
    const k = G.teclas;
    if (k.has(TECLAS.esquerda) || k.has('ArrowLeft')) vx -= 1;
    if (k.has(TECLAS.direita) || k.has('ArrowRight')) vx += 1;
    if (k.has(TECLAS.cima) || k.has('ArrowUp')) vy -= 1;
    if (k.has(TECLAS.baixo) || k.has('ArrowDown')) vy += 1;
    if (G.mapa && G.mapa.palco) vy = 0;          // no palco de lado, só para a esquerda e para a direita
    this.andando = vx !== 0 || vy !== 0;
    if (!this.andando) return;
    if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; }
    this.dir = vx < 0 ? DIR.ESQUERDA : vx > 0 ? DIR.DIREITA : vy < 0 ? DIR.CIMA : DIR.BAIXO;
    if (Math.abs(vy) > Math.abs(vx) + 0.01) this.dir = vy < 0 ? DIR.CIMA : DIR.BAIXO;
    const v = (k.has(TECLAS.correr) || k.has('ShiftRight') ? Jogador.VEL_CORRENDO : Jogador.VEL) * (this.velExtra || 1) * dt;
    // Eixo por eixo: escorrega na parede em vez de grudar.
    if (vx && !bate(this.caixa(this.x + vx * v, this.y))) this.x += vx * v;
    if (vy && !bate(this.caixa(this.x, this.y + vy * v))) this.y += vy * v;
    const t = this.ladrilho();
    const s = G.mapa.saidaEm(t.x, t.y);
    if (s) entrarMapa(s.destino, s.chegada);
  }
  desenha(ctx) {
    // No golpe, o corpo na pose de golpe (folha jocelino/golpe: as 4 direções na vertical; mãos vazias, a ferramenta
    // é desenhada por cima girando).
    // A animação desenhada quadro a quadro (o Jocelino segurando a ferramenta de verdade).
    if (this.golpe > 0 && typeof desenhaGolpeDesenhado === 'function' && desenhaGolpeDesenhado(ctx, this)) {
      for (const l of LASCAS) desenhaFx(ctx, l.fx, l.x, l.y, { ang: l.t * 9, alfa: Math.max(0, 1 - l.t * 1.6) });
      return;
    }
    const pose = this.golpe > 0 ? spr('personagens/jocelino/golpe') : null;
    if (pose) {
      const qw = pose.naturalWidth, qh = pose.naturalHeight / 4;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(this.x, this.y - 2, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
      desenhaFerramenta(ctx, this, true);
      const c = poseCorpo(this);
      ctx.save();
      ctx.translate(this.x, this.y + 2 + c.dy); ctx.rotate(c.inc); ctx.scale(c.sx, c.sy);
      ctx.drawImage(pose, 0, this.dir * qh, qw, qh, -qw / 2, -qh, qw, qh);
      ctx.restore();
      desenhaGolpe(ctx, this);
      return;
    }
    super.desenha(ctx);
    // Carga nos braços (o prato da pensão, o tijolo da obra...).
    if (this.carga && this.carga.icone) { const e = G.mapa && G.mapa.palco ? PALCO.ESCALA_GENTE : 1; desenhaPe(ctx, this.carga.icone, this.x, this.y - 112 * e, 1, 0.7 * e + (e > 1 ? 0.3 : 0)); }
    if (typeof desenhaGolpe === 'function') desenhaGolpe(ctx, this);
  }
}

ATUALIZADORES.push(dt => {
  if (!G.mapa) return;
  if (G.jog) G.jog.atualiza(dt);
  for (const p of G.mapa.moradores) p.atualiza(dt);
});
