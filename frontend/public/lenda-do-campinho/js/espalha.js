/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   MAPAS MAIORES (ESPALHADOS)
   Os mapas abertos (Vila, Praia, Cidade, CT, Estádio, cidades do mundo e da
   Europa) continuam sendo desenhados com as MESMAS coordenadas de sempre
   (as "de projeto"), mas o Construtor multiplica tudo por ESCALA_MAPA:
   o mapa fica maior, as coisas ficam mais afastadas e os bonecos parecem do
   tamanho certo. Interiores e arenas não mudam.
   Regras:
   - chão (ret, chao, campo, limpa): cada quadro de projeto vira o bloco inteiro
     de quadros novos — ruas e áreas continuam contínuas (e ficam mais largas);
   - objetos soltos (árvore, banco, poste...), NPCs, placas, pontos: 1 só, na posição nova;
   - objetos "de linha" (cerca, rede, arquibancada, parede invisível, grafite)
     e saídas preenchem o bloco todo — nada de buraco na cerca;
   - prédio: mesmo tamanho do desenho; a PORTA vai pra posição nova (fica alinhada com a rua);
   - beirada: os últimos quadros do mapa ficam colados na beirada nova.
   Carregar DEPOIS de world.js, europa.js e cidades.js e ANTES de arenas/armazem/casas/montarias.
   ============================================================ */
const ESCALA_MAPA = 1.3;
const OBJ_LINHA = new Set(['x', 'grade', 'rede', 'arquibancada', 'grafite']);
// tamanho de projeto de cada mapa aberto
function dimProjeto(id) {
  const fixos = { vila: [48, 38], praia: [48, 40], cidade: [50, 38], ct: [52, 40], estadio: [52, 40], lisboa: [52, 40], madri: [52, 40], londres: [52, 40] };
  if (fixos[id]) return fixos[id];
  if (typeof CIDADES !== 'undefined' && CIDADES.some(c => c.id === id)) return [52, 40];
  return null;
}
// coordenada de projeto → coordenada nova (inteira). D = tamanho de projeto; R = tamanho novo
function escalaCoord(v, D, R) { return v >= D - 3 ? R - (D - v) : Math.round(v * ESCALA_MAPA); }
function tamNovo(D) { return Math.round(D * ESCALA_MAPA); }
// posição (com fração) de um mapa: usada pra converter o lugar salvo no save antigo
function escalaPosMapa(id, x, y) {
  const d = dimProjeto(id); if (!d) return { x, y };
  const f = (v, D) => { const R = tamNovo(D), i = Math.floor(v); return escalaCoord(i, D, R) + (v - i) * ((escalaCoord(Math.min(i + 1, D), D, R) - escalaCoord(i, D, R)) || 1); };
  return { x: f(x, d[0]), y: f(y, d[1]) };
}

(function () {
  const P = Construtor.prototype;
  // versões 'cruas' (coordenadas reais do mapa). Não chamam os métodos públicos,
  // então nada é convertido duas vezes.
  const cru = {
    dentro: (b, x, y) => x >= 0 && y >= 0 && x < b.m.w && y < b.m.h,
    chao: (b, x, y, t) => { if (cru.dentro(b, x, y)) b.m.chao[y * b.m.w + x] = t; },
    ret: (b, x, y, w, h, t) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) cru.chao(b, i, j, t); },
    obj: (b, x, y, tipo, meta) => { if (!cru.dentro(b, x, y)) return; b.m.obj[y * b.m.w + x] = tipo ? { t: tipo, v: (hash2(x, y) * 1000) | 0, meta } : null; },
    limpa: (b, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) cru.obj(b, i, j, null); },
    livre: (b, x, y) => cru.dentro(b, x, y) && !b.m.obj[y * b.m.w + x] && CH_ANDA(b.m.chao[y * b.m.w + x]),
    campo: (b, x, y, w, h, tipo = CH.CAMPO, linha, comGols = true) => {
      cru.ret(b, x, y, w, h, tipo); cru.limpa(b, x, y, w, h); b.m.campos.push({ x, y, w, h, linha });
      if (comGols) { const cy = y + Math.floor(h / 2); for (let k = -1; k <= 1; k++) { cru.obj(b, x, cy + k, 'gol', { lado: 'e', parte: k + 1 }); cru.obj(b, x + w - 1, cy + k, 'gol', { lado: 'd', parte: k + 1 }); } }
    },
    espalha: (b, tipo, n, x, y, w, h, filtro) => {
      let tent = 0; const tipos = Array.isArray(tipo) ? tipo : [tipo];
      while (n > 0 && tent++ < n * 40) {
        const i = x + ((b.r() * w) | 0), j = y + ((b.r() * h) | 0);
        if (!cru.livre(b, i, j)) continue;
        if (filtro && !filtro(b.m.chao[j * b.m.w + i])) continue;
        cru.obj(b, i, j, tipos[(b.r() * tipos.length) | 0]); n--;
      }
    },
  };
  const predioOriginal = P.predio; // só mexe direto em m.obj/m.predios/m.saidas: pode ser usado cru
  P.objBruto = function (x, y, t, meta) { return cru.obj(this, x, y, t, meta); };
  P.livreBruto = function (x, y) { return cru.livre(this, x, y); };

  // cada Construtor novo descobre se é de um mapa aberto e, se for, se prepara pra escalar
  const iniciaEscala = (b) => {
    if (b._esc !== undefined) return b._esc;
    const d = dimProjeto(b.m.id);
    if (!d || b.m.interior || b.m.w !== d[0] || b.m.h !== d[1]) return (b._esc = null);
    const R = [tamNovo(d[0]), tamNovo(d[1])];
    const base = b.m.chao[0];
    b.m.w = R[0]; b.m.h = R[1];
    b.m.chao = new Uint8Array(R[0] * R[1]).fill(base);
    b.m.obj = new Array(R[0] * R[1]).fill(null);
    b.m.projeto = { w: d[0], h: d[1] };
    b._esc = { D: d, R };
    // inicio/renasce e zonas são escritos direto pelos mapas, em coordenadas de projeto
    const conv = p => p && { x: escalaCoord(p.x, d[0], R[0]), y: escalaCoord(p.y, d[1], R[1]) };
    let ini = null, ren = null;
    Object.defineProperty(b.m, 'inicio', { get: () => ini, set: v => { ini = conv(v); }, enumerable: true, configurable: true });
    Object.defineProperty(b.m, 'renasce', { get: () => ren, set: v => { ren = conv(v); }, enumerable: true, configurable: true });
    const zonas = []; zonas.push = function (...zs) { for (const z of zs) { const x0 = b.X(z.x), y0 = b.Y(z.y); Array.prototype.push.call(this, Object.assign({}, z, { x: x0, y: y0, w: b.X(z.x + z.w) - x0, h: b.Y(z.y + z.h) - y0 })); } return this.length; };
    b.m.zonas = zonas;
    return b._esc;
  };
  P.X = function (v) { const e = iniciaEscala(this); return e ? escalaCoord(v, e.D[0], e.R[0]) : v; };
  P.Y = function (v) { const e = iniciaEscala(this); return e ? escalaCoord(v, e.D[1], e.R[1]) : v; };
  // bloco de quadros reais que um quadro de projeto ocupa (sem escala: o próprio quadro)
  const bloco = (b, x, y) => { const x0 = b.X(x), y0 = b.Y(y); return [x0, y0, Math.max(x0 + 1, b.X(x + 1)), Math.max(y0 + 1, b.Y(y + 1))]; };
  const rect = (b, x, y, w, h) => { const x0 = b.X(x), y0 = b.Y(y); return [x0, y0, b.X(x + w) - x0, b.Y(y + h) - y0]; };

  P.dentro = function (x, y) { return cru.dentro(this, this.X(x), this.Y(y)); };
  P.chao = function (x, y, t) { const [x0, y0, x1, y1] = bloco(this, x, y); for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) cru.chao(this, i, j, t); };
  P.ret = function (x, y, w, h, t) { cru.ret(this, ...rect(this, x, y, w, h), t); };
  P.obj = function (x, y, tipo, meta) {
    if (!tipo || OBJ_LINHA.has(tipo)) { const [x0, y0, x1, y1] = bloco(this, x, y); for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) cru.obj(this, i, j, tipo, meta); return; }
    cru.obj(this, this.X(x), this.Y(y), tipo, meta);
  };
  P.limpa = function (x, y, w, h) { cru.limpa(this, ...rect(this, x, y, w, h)); };
  P.livre = function (x, y) { return cru.livre(this, this.X(x), this.Y(y)); };
  P.borda = function (tipo, esp = 1, alt) {
    iniciaEscala(this); // tamanho real do mapa
    const { w, h } = this.m;
    for (let e = 0; e < esp; e++) {
      for (let x = 0; x < w; x++) { cru.obj(this, x, e, alt && (x + e) % 3 === 0 ? alt : tipo); cru.obj(this, x, h - 1 - e, alt && (x + e) % 4 === 1 ? alt : tipo); }
      for (let y = 0; y < h; y++) { cru.obj(this, e, y, alt && (y + e) % 3 === 1 ? alt : tipo); cru.obj(this, w - 1 - e, y, alt && (y + e) % 4 === 2 ? alt : tipo); }
    }
  };
  P.predio = function (spr, x, y, w, h, interior, portaX) {
    if (!iniciaEscala(this)) return predioOriginal.call(this, spr, x, y, w, h, interior, portaX);
    const px = portaX != null ? portaX : x + Math.floor(w / 2);
    const nx = this.X(px), ny = this.Y(y + h - 1); // a porta vai pro lugar novo; o prédio mantém o tamanho do desenho
    const ox = Math.max(0, Math.min(this.m.w - w, nx - (px - x))), oy = Math.max(0, Math.min(this.m.h - h, ny - (h - 1)));
    return predioOriginal.call(this, spr, ox, oy, w, h, interior, ox + (px - x));
  };
  P.campo = function (x, y, w, h, tipo, linha, comGols) { cru.campo(this, ...rect(this, x, y, w, h), tipo, linha, comGols); };
  P.espalha = function (tipo, n, x, y, w, h, filtro) { cru.espalha(this, tipo, iniciaEscala(this) ? Math.round(n * ESCALA_MAPA) : n, ...rect(this, x, y, w, h), filtro); };
  P.spawn = function (m, x, y, qtd, raio = 4) {
    const e = iniciaEscala(this);
    this.m.spawns.push({ m, x: this.X(x), y: this.Y(y), qtd: e && qtd > 1 ? Math.round(qtd * ESCALA_MAPA) : qtd, raio: e ? Math.round(raio * ESCALA_MAPA) : raio });
  };
  P.npc = function (id, x, y) { const nx = this.X(x), ny = this.Y(y); this.m.npcs.push({ id, x: nx, y: ny }); cru.obj(this, nx, ny, null); };
  P.saida = function (x, y, para, tx, ty, req) {
    let nx = tx, ny = ty;
    if (iniciaEscala(this)) { const dd = dimProjeto(para); if (dd && tx != null) { nx = escalaCoord(tx, dd[0], tamNovo(dd[0])); ny = escalaCoord(ty, dd[1], tamNovo(dd[1])); } } // destino nas coordenadas novas do outro mapa
    const [x0, y0, x1, y1] = bloco(this, x, y);
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) { this.m.saidas.push({ x: i, y: j, para, tx: nx, ty: ny, req }); cru.obj(this, i, j, null); }
  };
  P.placa = function (x, y, texto) { const nx = this.X(x), ny = this.Y(y); cru.obj(this, nx, ny, 'placa'); this.m.placas.push({ x: nx, y: ny, texto }); };
  P.ponto = function (x, y, tipo, extra) { this.m.pontos.push({ x: this.X(x), y: this.Y(y), tipo, ...extra }); };
})();

// objetos largos (cidades e Europa): centro na posição nova, vizinhos colados (quadros reais)
objLargo = function (b, x, y, tipo, largura) {
  const cx = b.X(x), cy = b.Y(y); b.objBruto(cx, cy, tipo); const meia = Math.floor(largura / 2);
  for (let i = 1; i <= meia; i++) { if (b.livreBruto(cx - i, cy)) b.objBruto(cx - i, cy, 'x'); if (b.livreBruto(cx + i, cy)) b.objBruto(cx + i, cy, 'x'); }
};
// parede invisível na beirada: tamanho real do mapa
bordaInvisivel = function (b) { b.X(0); const { w, h } = b.m; for (let x = 0; x < w; x++) { b.objBruto(x, 0, 'x'); b.objBruto(x, h - 1, 'x'); } for (let y = 0; y < h; y++) { b.objBruto(0, y, 'x'); b.objBruto(w - 1, y, 'x'); } };

// save antigo: a posição guardada num mapa aberto estava na escala antiga
(function () {
  const _iniciarJogoEsp = iniciarJogo;
  iniciarJogo = async function (save, ...r) {
    if (save && !save.mapasEspalhados) {
      if (save.mapa && dimProjeto(save.mapa) && Number.isFinite(save.x) && Number.isFinite(save.y)) { const p = escalaPosMapa(save.mapa, save.x, save.y); save.x = p.x; save.y = p.y; }
      save.mapasEspalhados = ESCALA_MAPA;
    }
    return _iniciarJogoEsp.call(this, save, ...r);
  };
})();
