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
  get folha() { return 'personagens/' + (this.pele || this.id) + '/andar'; }   // pele: outra folha (o dono do bairro usa a do personagem)
  virarPara(x, y) { const dx = x - this.x, dy = y - this.y; this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? DIR.ESQUERDA : DIR.DIREITA) : (dy < 0 ? DIR.CIMA : DIR.BAIXO); }
  parar() { this.andando = false; }
  _bate(x, y) { return !!G.mapa && bate({ x: x - 14, y: y - 14, w: 28, h: 14 }, G.mapa); }
  atualiza(dt) {
    this.t += dt;
    if (!this.vagueia || !this.area) return;
    // (14/10, relato: "o Zezinho travou na cerca") com o pé dentro de algo sólido (nasceu no ladrilho dele, onde o Jocelino pôs uma
    // cerca; o portão fechou com ele no vão) todo passo batia e ele ficava parado para sempre: vai para o ladrilho livre mais perto.
    if (this._bate(this.x, this.y)) { this.desencalhar(); return; }
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
        // (onda final, o robô #24 e #25) não para em cima (nem na frente) do que se usa, e só onde o Jocelino alcança para conversar
        const m = G.mapa, tx = Math.floor(alvo.x / TILE), ty = Math.floor(alvo.y / TILE);
        if (m && !m.palco && typeof usavelEm === 'function' && (usavelEm(m, tx, ty) || !alcancaConversar(m, tx, ty))) continue; if (this.podeIr && !this.podeIr(tx, ty)) continue;   // (15/10) os filhos: nunca um canto dentro de cerca
        for (let s = 1; s <= 8 && livre; s++) livre = !this._bate(lerp(this.x, alvo.x, s / 8), lerp(this.y, alvo.y, s / 8));
        if (livre) this._alvo = alvo;
      }
      if (!this._alvo) this._espera = rnd(1, 2);
    }
  }
  desencalhar() {
    const tx = Math.floor(this.x / TILE), ty = Math.floor(this.y / TILE);
    for (let r = 1; r <= 6; r++) {
      let melhor = null, dm = 1e9;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = (tx + dx + 0.5) * TILE, y = (ty + dy) * TILE + 42, d = Math.hypot(x - this.x, y - this.y);   // (o pé como o morador() põe)
        if (d < dm && !this._bate(x, y)) { melhor = { x, y }; dm = d; }
      }
      if (melhor) { this.x = melhor.x; this.y = melhor.y; this._alvo = null; this.andando = false; this._espera = rnd(0.5, 1.5); return; }
    }
  }
  desenha(ctx) {
    const img = spr(this.folha);
    // Sombra no pé.
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(this.x, this.y - 2, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (!img) return;
    // fw x fh: o quadro no arquivo; qw x qh: o quadro no mundo (o desenho original; a folha ampliada tem 3x os pixels, arte.js)
    const fw = img.naturalWidth / 4, fh = img.naturalHeight / 4, f = fatorGente(img), qw = fw / f, qh = fh / f;
    const passo = this.andando ? Math.floor(this.t * 8) % 4 : 1;
    // No palco de lado a gente aparece maior (como no Bancho); a arte é a mesma.
    const e = G.mapa && G.mapa.palco ? PALCO.ESCALA_GENTE : 1;
    // (14/10) giro: a camada inteira girada um pouquinho em volta da cintura (o freguês incomodado balançando a cabeça, palco.js)
    if (this.giro) { const py = this.y - qh * e * 0.4; ctx.save(); ctx.translate(this.x, py); ctx.rotate(this.giro); ctx.translate(-this.x, -py); }
    ctx.drawImage(img, this.dir * fw, passo * fh, fw, fh, this.x - qw * e / 2, this.y - (qh - 2) * e, qw * e, qh * e);
    if (this.giro) ctx.restore();
    // O "!" do Mestre Bira: lista nova, pagamento ou gratificação esperando.
    if (this.id === 'bira' && typeof biraTemNovidade === 'function' && biraTemNovidade()) desenhaFx(ctx, 'balao', this.x, this.y - qh * e - 18);
    else if (typeof guiaMarcaMorador === 'function' && guiaMarcaMorador(this.id)) desenhaFx(ctx, 'exclamacao', this.x, this.y - qh * e - 18 + Math.sin((G.agora || 0) * 5) * 4);   // o "!" do guia (Frente 4)
    // Coração subindo (carinho no Caramelo).
    if (this._coracao > 0) {
      this._coracao -= 1 / 60;
      const k = 1 - this._coracao / 1.2;
      desenhaFx(ctx, 'coracao', this.x, this.y - qh - 14 - k * 30, { alfa: Math.min(1, this._coracao * 2) });
    }
  }
}

// Carga nos braços, como no Stardew: UMA pose de carregar (a folha jocelino_carregar_vazio, mãos juntas na frente do
// peito, sem nada nelas) e o ícone do próprio item desenhado nas mãos. (Relato de 14/10: com a massa e com a pedra ele
// aparecia carregando tijolo — a folha antiga tem os tijolos desenhados no peito.)
const FOLHA_CARREGAR = 'personagens/jocelino_carregar_vazio/andar';
// As mãos juntas no quadro de 66x114 da folha, por direção (baixo, cima, esquerda, direita) e por linha do passo (as
// linhas 0 e 2 são o passo, a 1 e a 3 o corpo parado; ele sobe e desce uns pixels com o passo). De costas as mãos não
// aparecem: o ponto é o peito, e o item fica escondido atrás do corpo.
const MAOS_CARGA = [
  [[34, 64], [34, 71], [34, 66], [34, 71]],
  [[33, 60], [33, 64], [33, 60], [33, 64]],
  [[15, 65], [16, 67], [15, 65], [17, 67]],
  [[47, 67], [49, 69], [47, 66], [49, 69]],
];
const ICONE_CARGA = { massa: 'itens/massa', ripa: 'itens/ripa', entulho: 'itens/entulho' };   // o que não é o ícone 'itens/<id>'
const PILHA_CARGA = { tijolo: 3, telha: 3, pedra: 2 };   // quantos ícones empilhados, no máximo, quando leva mais de um
const LADO_CARGA = 30;                                   // o ícone (48 px) desenhado com 30 px nos braços
const JEITO_CARGA = { ripa: { lado: 40, ang: 0.7 } };    // o feixe de ripas (deitado na diagonal no ícone) vai maior e atravessado nos braços

class Jogador extends Personagem {
  // Com carga nos braços (tijolo, pedra, telha, ripa, massa...), a folha de carregar de mãos vazias; o ícone vai nas mãos.
  // Enquanto ela não carregou, a folha de andar de sempre (nunca a dos tijolos). O prato da pensão vai na mão de sempre.
  get folha() { return this.carregando() && spr(FOLHA_CARREGAR) ? FOLHA_CARREGAR : 'personagens/jocelino/andar'; }
  carregando() { return !!(this.carga && this.carga.id && this.carga.id !== 'prato'); }
  // O ícone da carga nas mãos (pilha de 2 ou 3 quando leva vários); sem a arte carregada, não desenha nada.
  desenhaCarga(ctx) {
    const c = this.carga, img = spr(ICONE_CARGA[c.id] || c.icone || 'itens/' + c.id);
    if (!img || !spr(FOLHA_CARREGAR)) return;
    const e = G.mapa && G.mapa.palco ? PALCO.ESCALA_GENTE : 1;
    const passo = this.andando ? Math.floor(this.t * 8) % 4 : 1, m = MAOS_CARGA[this.dir][passo];
    const j = JEITO_CARGA[c.id] || {}, L = (j.lado || LADO_CARGA) * e;
    const hx = this.x + (m[0] - 33) * e, hy = this.y + (m[1] - 112) * e;
    const n = (c.qtd || 1) > 1 ? Math.min(PILHA_CARGA[c.id] || 1, c.qtd) : 1;
    for (let i = 0; i < n; i++) {
      // Cada cópia da pilha um pouco acima da outra (e meio de lado); o centro do item fica logo acima das mãos.
      const cx = hx + (i % 2 ? 2 : 0) * e, cy = hy - LADO_CARGA * e * 0.12 - i * 6 * e;
      if (!j.ang) { ctx.drawImage(img, cx - L / 2, cy - L / 2, L, L); continue; }
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(j.ang); ctx.drawImage(img, -L / 2, -L / 2, L, L); ctx.restore();
    }
  }
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
    if (this._avisouFechado > 0) this._avisouFechado -= dt;
    if (this.pescando || this.deitado) { this.andando = false; return; }   // segurando a força ou no minijogo da pesca; deitado na cama
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
    const v = (k.has(TECLAS.correr) || k.has('ShiftRight') ? Jogador.VEL_CORRENDO : Jogador.VEL) * (this.velExtra || 1) * (this === G.jog && typeof Habilidades !== 'undefined' ? Habilidades.velocidade() : 1) * (this === G.jog && typeof Bazar !== 'undefined' && Bazar.tem('bicicleta') ? ECO.bazar.bicicleta : 1) * dt;
    // Eixo por eixo: escorrega na parede em vez de grudar.
    const x0 = this.x, y0 = this.y;
    if (vx && !bate(this.caixa(this.x + vx * v, this.y))) this.x += vx * v;
    if (vy && !bate(this.caixa(this.x, this.y + vy * v))) this.y += vy * v;
    // Na quina de um vão (o portão, uma porta), andando reto, escorrega de lado até entrar, como no Stardew: sem isso era
    // preciso acertar o vão de 1 ladrilho no pixel (teste de 13/10, o portão da horta).
    if (this === G.jog && (vx === 0) !== (vy === 0) && this.x === x0 && this.y === y0) {
      const fx = vx ? Math.sign(vx) * v : 0, fy = vy ? Math.sign(vy) * v : 0;
      fora: for (let d = 2; d <= 22; d += 2) for (const s of [-1, 1]) {
        const lx = vy ? s : 0, ly = vx ? s : 0;
        if (bate(this.caixa(this.x + lx * d + fx, this.y + ly * d + fy))) continue;
        const p = Math.min(d, v);
        if (!bate(this.caixa(this.x + lx * p, this.y + ly * p))) { this.x += lx * p; this.y += ly * p; }
        break fora;
      }
    }
    const t = this.ladrilho();
    const s = G.mapa.saidaEm(t.x, t.y);
    if (s) {
      // Lugar que ainda não abriu (a carta não chegou): explica e não deixa passar.
      const nao = typeof Mundo !== 'undefined' ? Mundo.fechado(s.destino) : '';
      if (nao) { this.x = x0; this.y = y0; if (!(this._avisouFechado > 0)) { avisar(nao); this._avisouFechado = 3; } }
      else entrarMapa(s.destino, s.chegada);
    }
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
      const fw = pose.naturalWidth, fh = pose.naturalHeight / 4, f = fatorGente(pose), qw = fw / f, qh = fh / f;   // (arquivo / mundo)
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(this.x, this.y - 2, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
      desenhaFerramenta(ctx, this, true);
      const c = poseCorpo(this);
      ctx.save();
      ctx.translate(this.x, this.y + 2 + c.dy); ctx.rotate(c.inc); ctx.scale(c.sx, c.sy);
      ctx.drawImage(pose, 0, this.dir * fh, fw, fh, -qw / 2, -qh, qw, qh);
      ctx.restore();
      desenhaGolpe(ctx, this);
      return;
    }
    // De costas, a carga vai antes do corpo (fica escondida atrás dele); nas outras direções, por cima, nas mãos.
    const carregando = this.carregando();
    if (carregando && this.dir === DIR.CIMA) this.desenhaCarga(ctx);
    super.desenha(ctx);
    if (carregando && this.dir !== DIR.CIMA) this.desenhaCarga(ctx);
    // O prato da pensão, na mão de sempre (por cima, como antes).
    else if (!carregando && this.carga && this.carga.icone) { const e = G.mapa && G.mapa.palco ? PALCO.ESCALA_GENTE : 1; desenhaPe(ctx, this.carga.icone, this.x, this.y - 112 * e, 1, 0.7 * e + (e > 1 ? 0.3 : 0)); }
    if (typeof desenhaVara === 'function') desenhaVara(ctx, this);   // pescando, a vara na mão
    if (typeof desenhaGolpe === 'function') desenhaGolpe(ctx, this);
  }
}

ATUALIZADORES.push(dt => {
  if (!G.mapa) return;
  if (G.jog) G.jog.atualiza(dt);
  for (const p of G.mapa.moradores) p.atualiza(dt);
});
