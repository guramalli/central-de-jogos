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
  atualiza(dt) {
    this.t += dt;
    if (!this.vagueia || !this.area) return;
    if (this._alvo) {
      const dx = this._alvo.x - this.x, dy = this._alvo.y - this.y, d = Math.hypot(dx, dy);
      if (d < 3) { this._alvo = null; this.andando = false; this._espera = rnd(1.5, 4); return; }
      this.x += dx / d * Math.min(d, 60 * dt); this.y += dy / d * Math.min(d, 60 * dt);
      this.andando = true; this.virarPara(this._alvo.x, this._alvo.y);
      return;
    }
    this._espera -= dt;
    if (this._espera <= 0) {
      const a = this.area;
      this._alvo = { x: clamp(this.x + rnd(-2, 2) * TILE, a.x, a.x + a.w), y: clamp(this.y + rnd(-1.5, 1.5) * TILE, a.y, a.y + a.h) };
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
    ctx.drawImage(img, this.dir * qw, passo * qh, qw, qh, this.x - qw / 2, this.y - qh + 2, qw, qh);
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
    const pose = this.golpe > 0 ? spr('personagens/jocelino/golpe') : null;
    if (pose) {
      const qw = pose.naturalWidth, qh = pose.naturalHeight / 4;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(this.x, this.y - 2, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
      if (this.dir === DIR.CIMA && typeof desenhaGolpe === 'function') desenhaGolpe(ctx, this);
      ctx.drawImage(pose, 0, this.dir * qh, qw, qh, this.x - qw / 2, this.y - qh + 2, qw, qh);
      if (this.dir !== DIR.CIMA && typeof desenhaGolpe === 'function') desenhaGolpe(ctx, this);
      return;
    }
    super.desenha(ctx);
    // Carga nos braços (o prato da pensão, o tijolo da obra...).
    if (this.carga && this.carga.icone) desenhaPe(ctx, this.carga.icone, this.x, this.y - 112, 1, 0.7);
    if (typeof desenhaGolpe === 'function') desenhaGolpe(ctx, this);
  }
}

ATUALIZADORES.push(dt => {
  if (!G.mapa) return;
  if (G.jog) G.jog.atualiza(dt);
  for (const p of G.mapa.moradores) p.atualiza(dt);
});
