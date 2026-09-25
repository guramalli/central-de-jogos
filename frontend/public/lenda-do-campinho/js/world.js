/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — mundo (mapas montados por código)
   Objetos usam os sprites gerados (pasta a/). Prédios têm
   "pegada" bloqueada e uma porta que leva a um interior.
   ============================================================ */

// Tamanho de exibição dos objetos (largura em tiles) e se bloqueiam
const OBJ_INFO = {
  arvore: { w: 2.1, b: 1 }, mangueira: { w: 2.0, b: 1 }, arbusto: { w: 1.15, b: 1 }, banco: { w: 1.3, b: 1 }, poste: { w: 0.62, b: 1 },
  bau: { w: 1.0, b: 1 }, vaso: { w: 0.85, b: 1 }, placa: { w: 0.95, b: 1 }, ponto_onibus: { w: 0.62, b: 1 }, pedra: { w: 1.1, b: 1 },
  quadro: { w: 1.2, b: 1 }, banca: { w: 1.7, b: 1 },
  coqueiro: { w: 2.0, b: 1 }, coqueiro2: { w: 2.0, b: 1 }, guarda_sol: { w: 1.6, b: 1 }, torre: { w: 1.6, b: 1 }, quiosque: { w: 2.0, b: 1 },
  rede: { w: 1.25, b: 1 }, toalha: { w: 1.1, b: 0 }, isopor: { w: 0.8, b: 1 }, prancha: { w: 0.55, b: 1 }, castelo: { w: 1.0, b: 1 }, boia: { w: 0.8, b: 0 }, cadeira_praia: { w: 1.0, b: 1 },
  hidrante: { w: 0.55, b: 1 }, lixeira: { w: 0.65, b: 1 }, carro: { w: 1.7, b: 1 }, carro2: { w: 1.7, b: 1 }, rampa: { w: 1.4, b: 1 }, cone_deco: { w: 0.55, b: 1 },
  grade: { w: 1.08, b: 1 }, poste2: { w: 0.75, b: 1 }, maquina: { w: 0.9, b: 1 }, bicicletario: { w: 1.2, b: 1 }, caixa_correio: { w: 0.55, b: 1 }, canteiro: { w: 1.1, b: 1 },
  cones: { w: 0.8, b: 1 }, barreiras: { w: 1.2, b: 1 }, barra: { w: 1.3, b: 1 }, sacola_bolas: { w: 0.8, b: 1 }, bebedouro: { w: 0.9, b: 1 }, holofote: { w: 1.1, b: 1 },
  placar: { w: 1.9, b: 1 }, arquibancada: { w: 1.1, b: 1 }, prancheta_cav: { w: 0.9, b: 1 }, banco_reservas: { w: 2.1, b: 1 }, trofeu: { w: 0.8, b: 1 },
  cama: { w: 1.1, b: 1 }, mesa: { w: 1.35, b: 1 }, estante: { w: 1.0, b: 1 }, balcao: { w: 1.4, b: 1 }, carteira: { w: 0.95, b: 1 }, lousa: { w: 1.4, b: 1 },
  guarda_roupa: { w: 1.0, b: 1 }, tapete: { w: 1.7, b: 0 }, sofa: { w: 1.5, b: 1 }, tv: { w: 1.0, b: 1 }, palmeira_vaso: { w: 0.9, b: 1 }, geladeira: { w: 0.9, b: 1 },
  gol: { b: 1 }, x: { b: 1 }, // x = parede invisível
};
const OBJ_BLOQUEIA = new Set(Object.keys(OBJ_INFO).filter(k => OBJ_INFO[k].b));
const OBJ_MINI = { arvore: '#3f8a3a', mangueira: '#3f8a3a', coqueiro: '#4fae4a', coqueiro2: '#4fae4a', arbusto: '#4a9a3e', pedra: '#9a958d', gol: '#ffffff', grade: '#9a9aaa', x: '#2a2238', arquibancada: '#c04040', predio: '#b0603e' };

class Construtor {
  constructor(id, nome, w, h, base, seed) {
    this.m = {
      id, nome, w, h,
      chao: new Uint8Array(w * h).fill(base),
      obj: new Array(w * h).fill(null),
      campos: [], spawns: [], npcs: [], saidas: [], placas: [], pontos: [], predios: [],
      renasce: null, inicio: null, interior: false,
    };
    this.r = mulberry(seed);
  }
  dentro(x, y) { return x >= 0 && y >= 0 && x < this.m.w && y < this.m.h; }
  chao(x, y, t) { if (this.dentro(x, y)) this.m.chao[y * this.m.w + x] = t; }
  ret(x, y, w, h, t) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.chao(i, j, t); }
  obj(x, y, tipo, meta) { if (!this.dentro(x, y)) return; this.m.obj[y * this.m.w + x] = tipo ? { t: tipo, v: (hash2(x, y) * 1000) | 0, meta } : null; }
  limpa(x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.obj(i, j, null); }
  livre(x, y) { return this.dentro(x, y) && !this.m.obj[y * this.m.w + x] && CH_ANDA(this.m.chao[y * this.m.w + x]); }
  borda(tipo, esp = 1, alt) {
    const { w, h } = this.m;
    for (let e = 0; e < esp; e++) {
      for (let x = 0; x < w; x++) { this.obj(x, e, alt && (x + e) % 3 === 0 ? alt : tipo); this.obj(x, h - 1 - e, alt && (x + e) % 4 === 1 ? alt : tipo); }
      for (let y = 0; y < h; y++) { this.obj(e, y, alt && (y + e) % 3 === 1 ? alt : tipo); this.obj(w - 1 - e, y, alt && (y + e) % 4 === 2 ? alt : tipo); }
    }
  }
  // Prédio com sprite: pegada (x,y,w,h) bloqueada, porta na base
  predio(spr, x, y, w, h, interior, portaX) {
    const px = portaX != null ? portaX : x + Math.floor(w / 2);
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.m.obj[j * this.m.w + i] = { t: 'x', v: 0, predio: true };
    const p = { spr, x, y, w, h, porta: { x: px, y: y + h - 1 }, interior };
    this.m.predios.push(p);
    this.m.obj[(y + h - 1) * this.m.w + px] = null;
    if (interior) this.m.saidas.push({ x: px, y: y + h - 1, para: interior, porta: true });
    return p;
  }
  campo(x, y, w, h, tipo = CH.CAMPO, linha, comGols = true) {
    this.ret(x, y, w, h, tipo);
    this.limpa(x, y, w, h);
    this.m.campos.push({ x, y, w, h, linha });
    if (comGols) {
      const cy = y + Math.floor(h / 2);
      for (let k = -1; k <= 1; k++) {
        this.obj(x, cy + k, 'gol', { lado: 'e', parte: k + 1 });
        this.obj(x + w - 1, cy + k, 'gol', { lado: 'd', parte: k + 1 });
      }
    }
  }
  espalha(tipo, n, x, y, w, h, filtro) {
    let tent = 0; const tipos = Array.isArray(tipo) ? tipo : [tipo];
    while (n > 0 && tent++ < n * 40) {
      const i = x + ((this.r() * w) | 0), j = y + ((this.r() * h) | 0);
      if (!this.livre(i, j)) continue;
      if (filtro && !filtro(this.m.chao[j * this.m.w + i])) continue;
      this.obj(i, j, tipos[(this.r() * tipos.length) | 0]); n--;
    }
  }
  spawn(monstro, x, y, qtd, raio = 4) { this.m.spawns.push({ m: monstro, x, y, qtd, raio }); }
  npc(id, x, y) { this.m.npcs.push({ id, x, y }); this.obj(x, y, null); }
  saida(x, y, para, tx, ty, req) { this.m.saidas.push({ x, y, para, tx, ty, req }); this.obj(x, y, null); }
  placa(x, y, texto) { this.obj(x, y, 'placa'); this.m.placas.push({ x, y, texto }); }
  ponto(x, y, tipo, extra) { this.m.pontos.push({ x, y, tipo, ...extra }); }
}

const FILTRO_GRAMA = t => t === CH.GRAMA || t === CH.GRAMA_FLOR;
const ARVORES = ['arvore', 'arvore', 'mangueira'];

/* ------------------------------------------------------------
   INTERIORES (Stardew: cada prédio tem sua sala)
   ------------------------------------------------------------ */
function interior(id, nome, w, h, piso, tema, voltaPara) {
  const b = new Construtor(id, nome, w, h, piso, id.length * 17);
  b.m.interior = true; b.m.tema = tema;
  for (let x = 0; x < w; x++) { b.obj(x, 0, 'x'); b.obj(x, 1, 'x'); b.obj(x, h - 1, 'x'); }
  for (let y = 0; y < h; y++) { b.obj(0, y, 'x'); b.obj(w - 1, y, 'x'); }
  const px = Math.floor(w / 2);
  b.obj(px, h - 1, null);
  b.m.saidas.push({ x: px, y: h - 1, para: voltaPara, volta: true });
  b.m.inicio = { x: px, y: h - 2 }; b.m.renasce = { x: px, y: h - 2 };
  return b;
}
function mapaCasa() {
  const b = interior('casa', 'Sua casa', 11, 8, CH.MADEIRA, 'casa', 'vila');
  b.obj(1, 2, 'cama'); b.obj(3, 2, 'guarda_roupa'); b.obj(9, 2, 'geladeira'); b.obj(7, 2, 'tv'); b.obj(7, 4, 'sofa');
  b.obj(4, 4, 'mesa'); b.obj(9, 5, 'palmeira_vaso'); b.obj(4, 6, 'tapete');
  b.npc('mae', 5, 3);
  b.m.inicio = { x: 2, y: 3 }; b.m.renasce = { x: 2, y: 3 };
  return b.m;
}
function mapaBazar() {
  const b = interior('bazar', 'Bazar da Dona Cida', 10, 7, CH.MADEIRA, 'bazar', 'vila');
  b.obj(1, 2, 'estante'); b.obj(2, 2, 'estante'); b.obj(7, 2, 'estante'); b.obj(8, 2, 'geladeira');
  b.obj(3, 3, 'balcao'); b.obj(4, 3, 'balcao'); b.npc('cida', 5, 3); b.obj(8, 4, 'vaso');
  return b.m;
}
function mapaEscola() {
  const b = interior('escola', 'Escola Municipal', 13, 9, CH.PISO, 'escola', 'vila');
  b.obj(5, 2, 'lousa'); b.obj(7, 2, 'lousa'); b.obj(1, 2, 'estante'); b.obj(11, 2, 'estante');
  for (const y of [5, 7 - 1]) for (const x of [2, 4, 8, 10]) b.obj(x, y === 6 ? 6 : 5, 'carteira');
  b.npc('lucia', 6, 3); b.obj(11, 6, 'palmeira_vaso');
  return b.m;
}
function mapaLoja() {
  const b = interior('loja', 'Loja Esportiva da Neide', 10, 7, CH.PISO, 'loja', 'cidade');
  b.obj(1, 2, 'estante'); b.obj(2, 2, 'sacola_bolas'); b.obj(7, 2, 'estante'); b.obj(8, 2, 'maquina');
  b.obj(3, 3, 'balcao'); b.obj(4, 3, 'balcao'); b.npc('neide', 5, 3); b.obj(8, 5, 'trofeu');
  return b.m;
}
function mapaRefeitorio() {
  const b = interior('refeitorio', 'Refeitório do CT', 12, 8, CH.PISO, 'ct', 'ct');
  b.obj(1, 2, 'geladeira'); b.obj(2, 2, 'geladeira'); b.obj(9, 2, 'bebedouro'); b.obj(10, 2, 'palmeira_vaso');
  b.obj(4, 3, 'balcao'); b.obj(5, 3, 'balcao'); b.npc('bia', 6, 3);
  b.obj(3, 5, 'mesa'); b.obj(8, 5, 'mesa');
  return b.m;
}

/* ------------------------------------------------------------
   1) VILA DO CAMPINHO
   ------------------------------------------------------------ */
function mapaVila() {
  const b = new Construtor('vila', 'Vila do Campinho', 48, 38, CH.GRAMA, 101);
  for (let i = 0; i < 180; i++) b.chao((b.r() * 48) | 0, (b.r() * 38) | 0, CH.GRAMA_FLOR);
  b.borda('arvore', 2, 'mangueira');
  // ruas de terra
  b.ret(2, 17, 46, 2, CH.TERRA);
  b.ret(13, 7, 2, 28, CH.TERRA);
  b.ret(6, 6, 2, 11, CH.TERRA);
  b.ret(20, 6, 2, 11, CH.TERRA);
  b.ret(34, 6, 2, 6, CH.TERRA);
  // casa, bazar, escola
  b.predio('b_casa', 4, 3, 5, 3, 'casa', 6);
  b.predio('b_bazar', 18, 3, 5, 3, 'bazar', 20);
  b.predio('b_escola', 31, 2, 7, 4, 'escola', 34);
  b.placa(22, 7, 'BAZAR DA CIDA — compra e venda de tudo');
  b.placa(36, 7, 'ESCOLA MUNICIPAL — aulas com a Professora Lúcia');
  // quintal com o baú da bola
  b.obj(10, 5, 'bau'); b.ponto(10, 5, 'bau_bola');
  b.obj(11, 4, 'vaso'); b.obj(9, 3, 'arbusto');
  // praça e banca do Juca
  b.ret(33, 12, 9, 5, CH.PEDRA);
  b.obj(33, 12, 'poste'); b.obj(41, 12, 'poste'); b.obj(34, 14, 'banco'); b.obj(40, 14, 'banco'); b.obj(37, 12, 'vaso');
  b.obj(36, 15, 'banca'); b.npc('juca', 38, 15);
  b.spawn('pombo', 38, 13, 5, 3);
  b.npc('remendo', 24, 7); b.obj(25, 7, 'mesa'); b.obj(25, 6, 'cones');
  b.npc('zuzu', 34, 16); b.obj(33, 15, 'guarda_sol');
  if (typeof NPC_COPA !== 'undefined') { b.npc('almanaque', 40, 16); b.placa(41, 16, 'COPA DOS SONHOS: monte um time dos sonhos e busque o 7 a 0!'); }
  // ônibus + quadro de desafios
  b.obj(44, 15, 'ponto_onibus'); b.npc('motorista', 43, 16);
  b.npc('quadro', 29, 16);
  // CAMPINHO
  b.campo(16, 21, 19, 11, CH.CAMPO_TERRA, 'rgba(255,250,235,0.85)');
  b.ret(15, 20, 21, 1, CH.TERRA); b.ret(15, 32, 21, 1, CH.TERRA);
  b.npc('ze', 15, 25);
  b.obj(15, 22, 'banco'); b.obj(15, 29, 'banco');
  b.ponto(19, 26, 'penalti');
  b.placa(18, 20, 'CAMPINHO — pise na marca amarela do pênalti e aperte E');
  b.spawn('moleque', 25, 25, 6, 5);
  b.spawn('pombo', 27, 13, 4, 3);
  b.spawn('tonhao', 32, 23, 1, 1);
  // treino livre
  b.ret(6, 20, 6, 11, CH.TERRA);
  b.spawn('boneco', 9, 22, 1, 0); b.spawn('boneco', 9, 25, 1, 0); b.spawn('boneco', 9, 28, 1, 0);
  b.placa(7, 20, 'TREINO LIVRE: desafie os bonecos para subir Drible e Chute (não dá XP)');
  // lagoa
  b.ret(38, 22, 7, 5, CH.AGUA); b.ret(39, 21, 5, 1, CH.AGUA); b.ret(39, 27, 4, 1, CH.AGUA);
  // mato leste
  b.espalha(ARVORES, 22, 36, 29, 10, 7, FILTRO_GRAMA);
  b.espalha('arbusto', 10, 36, 29, 10, 7, FILTRO_GRAMA);
  b.spawn('caramelo', 40, 31, 5, 4);
  b.spawn('zagueiro_rua', 40, 32, 3, 2);
  b.spawn('caramelo', 5, 34, 3, 3);
  // postes na rua
  for (let x = 4; x < 44; x += 8) if (b.livre(x, 16)) b.obj(x, 16, 'poste');
  b.espalha(ARVORES, 14, 2, 2, 44, 34, FILTRO_GRAMA);
  b.espalha('arbusto', 16, 2, 2, 44, 34, FILTRO_GRAMA);
  b.espalha('pedra', 5, 2, 2, 44, 34, FILTRO_GRAMA);
  // clareira no mato leste: os Zagueiros da Rua e o Caramelo precisam de espaço
  // (fica só uma árvore aqui e ali, mais na beirada)
  { // (coordenadas reais do mapa: b.X/b.Y convertem as de projeto quando o mapa é espalhado — espalha.js)
    const X = v => (b.X ? b.X(v) : v), Y = v => (b.Y ? b.Y(v) : v);
    for (let y = Y(28); y < Y(36); y++) for (let x = X(34); x < X(46); x++) {
      const o = b.m.obj[y * b.m.w + x]; if (!o || !/^(arvore|mangueira|arbusto|pedra)$/.test(o.t)) continue;
      const fica = (x >= X(45) || y < Y(29)) ? hash2(x, y) < 0.4 : false;
      if (!fica) b.m.obj[y * b.m.w + x] = null;
    }
  }
  // saída para a PRAIA
  b.ret(44, 17, 4, 2, CH.TERRA); b.limpa(44, 17, 4, 2);
  const req = { flag: 'libera_praia', msg: 'O caminho pra praia é longe! Vença o Tonhão (missão do Seu Zé) primeiro.' };
  b.saida(47, 17, 'praia', 2, 17, req); b.saida(47, 18, 'praia', 2, 18, req);
  b.m.inicio = { x: 6, y: 7 }; b.m.renasce = { x: 6, y: 7 };
  return b.m;
}

/* ------------------------------------------------------------
   2) PRAIA
   ------------------------------------------------------------ */
function mapaPraia() {
  const b = new Construtor('praia', 'Praia do Futevôlei', 48, 40, CH.AREIA, 202);
  b.ret(0, 0, 12, 40, CH.GRAMA);
  b.ret(40, 0, 8, 40, CH.AGUA);
  for (let y = 0; y < 40; y++) { const k = Math.round(Math.sin(y / 3) * 1.5); b.ret(39 + k, y, 3, 1, CH.AGUA); b.chao(38 + k, y, CH.AREIA_MOLHADA); }
  b.borda('coqueiro', 1, 'coqueiro2');
  for (let y = 0; y < 40; y++) { b.obj(47, y, 'x'); b.obj(46, y, null); }
  b.ret(2, 16, 36, 3, CH.PEDRA);
  b.ret(6, 0, 3, 16, CH.PEDRA);
  b.limpa(0, 16, 2, 3); b.ret(0, 16, 2, 3, CH.PEDRA);
  b.saida(0, 17, 'vila', 46, 17); b.saida(0, 18, 'vila', 46, 18);
  b.m.inicio = { x: 2, y: 17 }; b.m.renasce = { x: 16, y: 14 };
  b.obj(16, 10, 'quiosque'); b.npc('bene', 17, 11);
  b.obj(14, 13, 'guarda_sol'); b.obj(19, 13, 'guarda_sol'); b.obj(13, 14, 'cadeira_praia');
  b.npc('marinho', 21, 12); b.obj(22, 9, 'torre');
  b.placa(18, 15, 'PRAIA DO FUTEVÔLEI — Quiosque do Bené');
  b.obj(3, 14, 'ponto_onibus'); b.npc('motorista', 4, 15);
  b.npc('quadro', 10, 15);
  const quadra = (x, y) => { for (let j = y; j < y + 5; j++) b.obj(x + 3, j, 'rede'); };
  quadra(23, 3); quadra(30, 3); quadra(23, 21); quadra(30, 21);
  b.npc('tata', 27, 9);
  b.spawn('futevoleiro', 27, 5, 4, 3); b.spawn('futevoleiro', 32, 23, 4, 3);
  b.spawn('caranguejo', 35, 8, 6, 3); b.spawn('caranguejo', 35, 30, 6, 3);
  b.spawn('gaivota', 25, 13, 5, 6); b.spawn('gaivota', 20, 26, 5, 6);
  b.spawn('salva_vidas', 18, 31, 4, 3); b.spawn('salva_vidas', 30, 13, 3, 3);
  b.obj(22, 33, 'torre'); b.obj(14, 25, 'guarda_sol'); b.obj(33, 18, 'guarda_sol'); b.obj(24, 19, 'guarda_sol');
  b.obj(15, 26, 'toalha'); b.obj(34, 19, 'toalha'); b.obj(20, 22, 'castelo'); b.obj(28, 15, 'isopor'); b.obj(36, 12, 'prancha'); b.obj(26, 30, 'boia');
  for (let x = 14; x <= 36; x++) { if (x < 24 || x > 26) b.obj(x, 34, x % 2 ? 'coqueiro' : 'coqueiro2'); }
  b.spawn('rei_areia', 25, 37, 1, 1);
  b.placa(27, 33, 'CUIDADO: domínio do REI DA AREIA');
  b.espalha(ARVORES, 8, 1, 1, 10, 14, FILTRO_GRAMA);
  b.espalha(ARVORES, 8, 1, 20, 10, 18, FILTRO_GRAMA);
  b.espalha('arbusto', 8, 1, 1, 10, 38, FILTRO_GRAMA);
  b.espalha(['coqueiro', 'coqueiro2'], 10, 14, 1, 22, 32, t => t === CH.AREIA);
  b.limpa(6, 0, 3, 2);
  const req = { flag: 'libera_cidade', msg: 'A estrada pra cidade só abre pra quem venceu o Rei da Areia.' };
  for (let x = 6; x <= 8; x++) b.saida(x, 0, 'cidade', 23 + (x - 6), 36, req);
  return b.m;
}

/* ------------------------------------------------------------
   3) CIDADE
   ------------------------------------------------------------ */
function mapaCidade() {
  const b = new Construtor('cidade', 'Cidade — Quadras de Futsal', 50, 38, CH.CALCADA, 303);
  b.ret(0, 17, 50, 3, CH.ASFALTO);
  b.ret(21, 0, 3, 38, CH.ASFALTO);
  for (let x = 0; x < 50; x++) { b.obj(x, 0, 'x'); b.obj(x, 37, 'x'); }
  for (let y = 0; y < 38; y++) { b.obj(0, y, 'x'); b.obj(49, y, 'x'); }
  // prédios do topo e de baixo
  b.predio('b_ap1', 1, 1, 6, 3); b.predio('b_padaria', 13, 1, 6, 3); b.predio('b_ap2', 1, 33, 6, 3); b.predio('b_ap1', 40, 33, 6, 3); b.predio('b_padaria', 8, 33, 5, 3);
  // saídas
  b.limpa(22, 36, 3, 2); b.ret(22, 36, 3, 2, CH.ASFALTO);
  for (let x = 22; x <= 24; x++) b.saida(x, 37, 'praia', 6 + (x - 22), 1);
  b.m.inicio = { x: 23, y: 35 }; b.m.renasce = { x: 26, y: 21 };
  b.limpa(49, 17, 1, 3);
  const req = { flag: 'libera_ct', msg: 'O CT só recebe quem venceu o Rei da Quadra.' };
  for (let y = 17; y <= 19; y++) b.saida(49, y, 'ct', 1, 17 + (y - 17), req);
  // skate park
  b.ret(2, 5, 17, 11, CH.CONCRETO);
  b.obj(4, 7, 'rampa'); b.obj(12, 12, 'rampa'); b.obj(16, 7, 'rampa'); b.obj(8, 13, 'cone_deco'); b.obj(15, 11, 'cone_deco');
  b.placa(10, 5, 'SKATE PARK');
  b.spawn('skatista', 10, 10, 7, 5);
  // loja da Neide
  b.predio('b_loja', 3, 22, 6, 3, 'loja', 6);
  b.placa(9, 25, 'LOJA ESPORTIVA DA NEIDE');
  // quadra 1 + escolinha do Ginga
  b.campo(27, 23, 15, 9, CH.QUADRA, 'rgba(255,255,255,0.9)');
  for (let x = 26; x <= 42; x++) { b.obj(x, 22, 'grade'); if (x !== 34) b.obj(x, 32, 'grade'); }
  for (let y = 22; y <= 32; y++) { b.obj(26, y, 'grade'); b.obj(42, y, 'grade'); }
  b.npc('ginga', 36, 33);
  b.spawn('pivo', 34, 27, 5, 4); b.spawn('ala', 31, 25, 4, 4);
  // quadra 2
  b.campo(13, 30, 7, 5, CH.QUADRA_AZUL, 'rgba(255,255,255,0.9)');
  b.spawn('goleiro_linha', 16, 32, 3, 2);
  // quadra do Rei (cercada)
  b.campo(29, 3, 17, 11, CH.QUADRA_AZUL, 'rgba(255,255,255,0.9)');
  for (let x = 28; x <= 46; x++) { b.obj(x, 2, 'grade'); if (x < 36 || x > 38) b.obj(x, 14, 'grade'); }
  for (let y = 2; y <= 14; y++) { b.obj(28, y, 'grade'); b.obj(46, y, 'grade'); }
  b.spawn('goleiro_linha', 34, 8, 3, 3); b.spawn('ala', 40, 6, 3, 3);
  b.spawn('rei_quadra', 43, 8, 1, 1);
  b.placa(35, 15, 'QUADRA DO REI — território do REI DA QUADRA');
  b.obj(25, 15, 'ponto_onibus'); b.npc('motorista', 26, 16);
  b.npc('quadro', 19, 16);
  b.npc('rodrigues', 29, 21); b.placa(30, 21, 'ESCRITÓRIO DO RODRIGUES — funde seu time no nível 25');
  b.obj(5, 18, 'carro'); b.obj(12, 19, 'carro2'); b.obj(40, 18, 'carro'); b.obj(22, 8, 'carro2');
  for (let x = 3; x < 48; x += 6) { if (b.livre(x, 16)) b.obj(x, 16, 'poste2'); if (b.livre(x, 20)) b.obj(x, 20, 'poste2'); }
  b.espalha(['lixeira', 'hidrante', 'canteiro', 'caixa_correio', 'bicicletario', 'maquina'], 18, 1, 1, 48, 36, t => t === CH.CALCADA);
  b.spawn('skatista', 44, 26, 3, 3);
  return b.m;
}

/* ------------------------------------------------------------
   4) CT
   ------------------------------------------------------------ */
function mapaCT() {
  const b = new Construtor('ct', 'CT das Categorias de Base', 52, 40, CH.GRAMA, 404);
  b.borda('arvore', 1, 'mangueira');
  b.ret(0, 16, 12, 4, CH.CALCADA); b.limpa(0, 16, 1, 4);
  for (let y = 16; y <= 19; y++) b.saida(0, y, 'cidade', 47, Math.min(19, Math.max(17, y)));
  b.m.inicio = { x: 1, y: 17 }; b.m.renasce = { x: 9, y: 26 };
  b.predio('b_ct', 2, 21, 7, 4, 'refeitorio', 5);
  b.ret(4, 25, 3, 2, CH.CALCADA);
  b.placa(8, 26, 'REFEITÓRIO — Nutricionista Bia');
  b.ret(16, 3, 34, 16, CH.PISTA);
  b.campo(18, 5, 30, 12, CH.CAMPO);
  b.spawn('capitao_sub20', 45, 11, 1, 1);
  b.spawn('lateral', 30, 4, 5, 5); b.spawn('lateral', 30, 17, 4, 5);
  b.spawn('volante', 26, 10, 4, 4);
  b.limpa(15, 0, 3, 3); b.ret(15, 0, 3, 3, CH.CALCADA);
  const req = { flag: 'libera_estadio', msg: 'O estádio é só para profissionais. Vença o Capitão da Seleção Sub-20.' };
  for (let x = 15; x <= 17; x++) b.saida(x, 0, 'estadio', 25 + (x - 15), 38, req);
  b.campo(17, 23, 15, 9, CH.CAMPO); b.campo(35, 23, 15, 9, CH.CAMPO);
  b.obj(24, 22, 'banco_reservas'); b.obj(42, 22, 'banco_reservas');
  b.spawn('volante', 24, 27, 5, 4); b.spawn('preparador', 42, 27, 4, 4);
  b.spawn('zagueiro_sub20', 24, 35, 4, 3); b.spawn('zagueiro_sub20', 42, 35, 4, 3);
  b.spawn('preparador', 10, 34, 3, 3);
  b.ret(2, 31, 12, 7, CH.CONCRETO);
  b.obj(3, 32, 'barra'); b.obj(6, 32, 'barra'); b.obj(9, 32, 'barra'); b.obj(12, 32, 'bebedouro');
  b.spawn('boneco', 4, 35, 1, 0); b.spawn('boneco', 7, 35, 1, 0); b.spawn('boneco', 10, 35, 1, 0);
  b.npc('aurelio', 14, 12); b.obj(13, 11, 'prancheta_cav');
  b.obj(12, 15, 'ponto_onibus'); b.npc('motorista', 13, 15);
  b.npc('quadro', 11, 13);
  b.espalha(['cones', 'barreiras', 'sacola_bolas'], 14, 17, 22, 33, 16, t => t === CH.GRAMA);
  b.espalha(ARVORES, 12, 1, 1, 14, 14, FILTRO_GRAMA);
  b.espalha('arbusto', 10, 1, 1, 50, 38, FILTRO_GRAMA);
  return b.m;
}

/* ------------------------------------------------------------
   5) ESTÁDIO
   ------------------------------------------------------------ */
function mapaEstadio() {
  const b = new Construtor('estadio', 'Estádio Lendário', 52, 40, CH.CONCRETO, 505);
  for (let x = 0; x < 52; x++) { b.obj(x, 0, 'x'); b.obj(x, 39, 'x'); }
  for (let y = 0; y < 40; y++) { b.obj(0, y, 'x'); b.obj(51, y, 'x'); }
  for (let x = 1; x < 51; x++) for (let y = 1; y < 4; y++) b.obj(x, y, 'arquibancada');
  for (let x = 1; x < 51; x++) for (let y = 31; y < 34; y++) b.obj(x, y, 'arquibancada');
  for (let y = 4; y < 31; y++) { b.obj(1, y, 'arquibancada'); b.obj(2, y, 'arquibancada'); b.obj(49, y, 'arquibancada'); b.obj(50, y, 'arquibancada'); }
  b.ret(3, 4, 46, 27, CH.PISTA);
  b.campo(5, 6, 42, 23, CH.CAMPO);
  b.obj(3, 4, 'holofote'); b.obj(48, 4, 'holofote');
  b.obj(24, 4, 'placar'); b.obj(16, 29, 'banco_reservas'); b.obj(34, 29, 'banco_reservas');
  b.limpa(24, 31, 4, 9); b.ret(24, 31, 4, 9, CH.CONCRETO);
  for (let x = 24; x <= 27; x++) b.obj(x, 39, null);
  for (let x = 25; x <= 27; x++) b.saida(x, 39, 'ct', 15 + (x - 25), 1);
  b.m.inicio = { x: 26, y: 37 }; b.m.renasce = { x: 20, y: 36 };
  b.ret(3, 34, 20, 5, CH.PISO); b.ret(29, 34, 21, 5, CH.PISO);
  b.obj(4, 35, 'estante'); b.obj(8, 35, 'banco'); b.obj(11, 35, 'banco'); b.obj(18, 35, 'trofeu');
  b.npc('dada', 16, 36); b.npc('presidente', 36, 36);
  b.obj(42, 35, 'trofeu'); b.obj(45, 35, 'bebedouro');
  b.obj(22, 37, 'ponto_onibus'); b.npc('motorista', 21, 37);
  b.npc('quadro', 30, 37);
  b.spawn('meia_armador', 15, 12, 5, 5); b.spawn('meia_armador', 36, 22, 4, 5);
  b.spawn('centroavante', 36, 12, 5, 5); b.spawn('centroavante', 15, 22, 4, 5);
  b.spawn('xerife', 26, 10, 4, 4); b.spawn('xerife', 26, 24, 4, 4);
  b.spawn('arbitro', 26, 17, 4, 5);
  b.spawn('paredao', 7, 17, 1, 1);
  b.placa(28, 30, 'GOL OESTE: guardado pelo PAREDÃO. Ninguém nunca marcou nele.');
  return b.m;
}

const MAPAS_DEF = { vila: mapaVila, praia: mapaPraia, cidade: mapaCidade, ct: mapaCT, estadio: mapaEstadio, casa: mapaCasa, bazar: mapaBazar, escola: mapaEscola, loja: mapaLoja, refeitorio: mapaRefeitorio };
const MAPAS_ORDEM = ['vila', 'praia', 'cidade', 'ct', 'estadio'];
const MAPAS_FLAG = { vila: null, praia: 'libera_praia', cidade: 'libera_cidade', ct: 'libera_ct', estadio: 'libera_estadio' };
const MAPAS = {};
function getMapa(id) {
  if (!MAPAS[id]) {
    const m = MAPAS_DEF[id]();
    // liga as portas dos prédios aos interiores e de volta
    // entrar pela porta: aparece logo depois da porta, por dentro (não no canto onde o jogo começa)
    for (const s of m.saidas) if (s.porta) {
      const int = getMapaInterior(s.para); const volta = int.saidas.find(v => v.volta);
      const livre = (x, y) => x >= 0 && y >= 0 && x < int.w && y < int.h && !int.obj[y * int.w + x] && CH_ANDA(int.chao[y * int.w + x]);
      if (volta && livre(volta.x, volta.y - 1)) { s.tx = volta.x; s.ty = volta.y - 1; } else { s.tx = int.inicio.x; s.ty = int.inicio.y; }
    }
    MAPAS[id] = m;
    for (const s of m.saidas) if (s.porta) { const int = MAPAS[s.para]; const volta = int.saidas.find(v => v.volta); if (volta) { volta.tx = s.x; volta.ty = s.y + 1; } }
  }
  return MAPAS[id];
}
function getMapaInterior(id) { if (!MAPAS[id]) MAPAS[id] = MAPAS_DEF[id](); return MAPAS[id]; }

function renderMini(m) {
  if (m._mini) return m._mini;
  const c = mkCanvas(m.w * 3, m.h * 3); const ctx = c.getContext('2d');
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const o = m.obj[y * m.w + x];
    ctx.fillStyle = (o && (o.predio ? OBJ_MINI.predio : (OBJ_MINI[o.t] || (OBJ_BLOQUEIA.has(o.t) ? '#6a5a4a' : null)))) || CH_MINI[m.chao[y * m.w + x]];
    ctx.fillRect(x * 3, y * 3, 3, 3);
  }
  m._mini = c; return c;
}
