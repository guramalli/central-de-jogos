/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧱 CHÃO EM BLOCOS — v407 (Raio-X A8, dono: "faça tudo menos I1").
   Antes o chão de cada mapa era pintado numa imagem só, do tamanho do mapa inteiro: a Vila tinha 5760×4096 pixels
   (94 MB), o Labirinto Jurássico 7680×5760 (177 MB). O Safari do iPhone não aceita imagem acima de ~16,7 milhões de
   pixels (o chão ficava em branco ou a aba fechava) e, passeando pelo mundo, o jogo chegava a segurar 1,5 GB.
   Agora:
   1) quem desenha o chão (assets.js, chao_novo.js, ruas.js, pontes.js, mercado.js...) continua igual, mas desenha numa
      "lousa" (ChaoBlocos) que só ANOTA os passos do desenho — não ocupa memória de imagem;
   2) a imagem é pintada em BLOCOS de 1024×1024 (no celular: meia resolução), só os blocos perto da câmera, um
      pouquinho por quadro (nada trava). Cada bloco é pintado com os mesmos passos e recortado no lugar, com 2 pixels
      sobrando em volta (sem emenda entre um bloco e outro);
   3) enquanto um bloco não fica pronto aparece uma PRÉVIA do mapa (1/8 do tamanho; antes dela, as cores dos
      quadradinhos) — não aparece mais o chão chapado de uma cor só;
   4) memória: UMA regra só para os blocos — um teto de memória (o bloco usado há mais tempo sai primeiro).
      Os mapas guardados (atual, 2 anteriores e o vizinho pré-desenhado) ficam em memoria_mapas.js.
   Carregar logo DEPOIS de assets.js.
   ============================================================ */
const CHAO_BLOCOS = (() => {
  const CEL = (() => { try { return matchMedia('(pointer: coarse)').matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); } catch (e) { return false; } })();
  const DM = navigator.deviceMemory || 4;
  const B = 1024;                                   // tamanho do bloco (em pixels do mapa)
  const ESC = CEL ? 0.5 : 1;                        // resolução dos blocos (celular: meia)
  const AP = 2;                                     // pixels a mais em volta de cada bloco (sem emenda)
  const MG = 128;                                   // margem extra quando o desenho copia dele mesmo (esquinas das ruas)
  const PE = 1 / 8;                                 // prévia: 1/8 do tamanho
  const TETO = (CEL ? 28 : DM >= 8 ? 160 : 112) * 1048576; // memória máxima dos blocos guardados
  const ORC_TELA = 12, ORC_OCIO = 4;                // ms por quadro: blocos que faltam na tela / adiantar os de perto
  const GUARDADOS = new Map();                      // chave -> { S, k, c, bytes, q }  (todos os mapas juntos)
  let bytes = 0, quadro = 0, seq = 0, job = null; const DBG = { l: null }; // (testes: DBG.l = [] anota cada etapa)
  const pendPrevia = new Set();                     // lousas que querem a prévia pronta (vizinho pré-desenhado)
  const escFiltro = (v, e) => typeof v === 'string' && e !== 1 ? v.replace(/(-?[\d.]+)px/g, (a, n) => (n * e) + 'px') : v;
  let TRAB = null;                                  // tela de trabalho (bloco com margem)
  const trab = (w, h) => { if (!TRAB || TRAB.width < w || TRAB.height < h) TRAB = mkCanvas(Math.max(w, TRAB ? TRAB.width : 0), Math.max(h, TRAB ? TRAB.height : 0)); return TRAB; };

  // ---- a lousa que anota os passos ----
  function gravador(S) {
    const sc = mkCanvas(4, 4).getContext('2d'); // (para padrões, degradês e medir texto)
    const g = {}, st = [{}];
    const P = CanvasRenderingContext2D.prototype;
    for (const k of Object.getOwnPropertyNames(P)) {
      if (k === 'constructor' || k === 'canvas') continue;
      const d = Object.getOwnPropertyDescriptor(P, k);
      if (typeof d.value === 'function') {
        if (/^(create|get|is|measureText)/.test(k)) g[k] = function (...a) {
          if (k === 'getImageData') throw new Error('chão em blocos: getImageData não existe na lousa');
          if (k === 'measureText') sc.font = g.font;
          if (k === 'getTransform') return new DOMMatrix();
          if (k === 'getLineDash') return st[st.length - 1].__dash || [];
          return sc[k](...a);
        };
        else g[k] = function (...a) {
          S.ops.push([k, a]); S.ver++;
          if (k === 'save') st.push(Object.assign({}, st[st.length - 1])); else if (k === 'restore') { if (st.length > 1) st.pop(); }
          else if (k === 'setLineDash') st[st.length - 1].__dash = a[0];
          else if (k === 'drawImage' && a[0] === S) S.margem = true;
        };
      } else if (d.get) Object.defineProperty(g, k, {
        get() { const v = st[st.length - 1][k]; return v !== undefined ? v : sc[k]; },
        set(v) { st[st.length - 1][k] = v; S.ops.push(['=', k, v]); S.ver++; },
      });
    }
    Object.defineProperty(g, 'canvas', { get: () => S });
    g.passo = fn => { S.ops.push(['f', fn]); S.ver++; }; // passo especial: fn(ctx, info) desenha o pedaço info.{x0,y0,w,h} na escala info.esc
    return g;
  }
  // as cores dos quadradinhos, esticadas (a primeiríssima prévia, instantânea)
  function previaCores(m) {
    if (!m || !m.chao || typeof ESTILO_CHAO === 'undefined') return null;
    const c = mkCanvas(m.w, m.h), x = c.getContext('2d'), im = x.createImageData(m.w, m.h), cache = {};
    for (let k = 0; k < m.w * m.h; k++) {
      const t = m.chao[k]; let rgb = cache[t];
      if (!rgb) { const e = ESTILO_CHAO[t]; try { rgb = cache[t] = hexRgb((e && e.cor) || '#5a6a4a'); } catch (er) { rgb = cache[t] = [90, 106, 74]; } }
      im.data[k * 4] = rgb[0]; im.data[k * 4 + 1] = rgb[1]; im.data[k * 4 + 2] = rgb[2]; im.data[k * 4 + 3] = 255;
    }
    x.putImageData(im, 0, 0); return c;
  }

  class ChaoBlocos {
    constructor(W, H, m, opc = {}) {
      this.width = Math.ceil(W); this.height = Math.ceil(H); this.m = m || null; this.id = ++seq;
      this.ops = []; this.ver = 0; this.margem = false; this.soPrevia = !!opc.soPrevia;
      this.nx = Math.ceil(this.width / B); this.ny = Math.ceil(this.height / B);
      this.prev0 = previaCores(m); this.prev = null; this.prevVer = -1; this.cor = opc.cor || '#2a2438';
      this._ctx = null;
    }
    getContext() { return this._ctx || (this._ctx = gravador(this)); }
    get grande() { return this.nx * this.ny > 4; }
    chave(i, j) { return this.id + ':' + i + ':' + j; }
    retBloco(i, j) { // o pedaço do mapa que o bloco guarda (com os pixels a mais)
      const bx = i * B, by = j * B, x0 = Math.max(0, bx - AP), y0 = Math.max(0, by - AP);
      return { bx, by, bw: Math.min(B, this.width - bx), bh: Math.min(B, this.height - by), x0, y0, x1: Math.min(this.width, bx + B + AP), y1: Math.min(this.height, by + B + AP) };
    }
    fresco(i, j) { const g = GUARDADOS.get(this.chave(i, j)); return !!(g && g.ver === this.ver); }
    blocosEm(sx, sy, sw, sh) {
      const l = [], i0 = Math.max(0, Math.floor(sx / B)), j0 = Math.max(0, Math.floor(sy / B)), i1 = Math.min(this.nx - 1, Math.floor((sx + sw) / B)), j1 = Math.min(this.ny - 1, Math.floor((sy + sh) / B));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) l.push([i, j]);
      return l;
    }
    prontoNaTela(sx, sy, sw, sh) { if (this.soPrevia) return false; return this.blocosEm(sx, sy, sw, sh).every(([i, j]) => this.fresco(i, j)); }
    // pinta (em etapas) o pedaço info do mapa na tela "alvo"
    *pinta(alvo, info, orc) {
      const ctx = alvo.getContext('2d'), e = info.esc, M0 = [e, 0, 0, e, -info.x0 * e, -info.y0 * e], ops = this.ops, S = this;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, alvo.width, alvo.height);
      ctx.setTransform(...M0); ctx.beginPath(); ctx.rect(info.x0, info.y0, info.w, info.h); ctx.clip();
      let prof = 0, t0 = performance.now();
      try { // (abandonado no meio — mudou de mapa — o finally devolve a tela limpa)
      for (let n = 0; n < ops.length; n++) {
        const o = ops[n];
        try {
          if (o[0] === '=') { let v = o[2]; const k = o[1]; if (k === 'filter') v = escFiltro(v, e); else if (k === 'shadowBlur' || k === 'shadowOffsetX' || k === 'shadowOffsetY') v *= e; ctx[k] = v; }
          else if (o[0] === 'f') { ctx.save(); o[1](ctx, info); ctx.restore(); ctx.setTransform(...M0); }
          else {
            const k = o[0]; let a = o[1];
            if (k === 'save') prof++;
            else if (k === 'restore') { if (!prof) continue; prof--; }
            else if (k === 'setTransform') { ctx.setTransform(...M0); if (a.length === 1) { const t = a[0]; ctx.transform(t.a, t.b, t.c, t.d, t.e, t.f); } else ctx.transform(...a); continue; }
            else if (k === 'resetTransform') { ctx.setTransform(...M0); continue; }
            else if (k === 'drawImage' && a[0] === S) { // copia de um pedaço já pintado (esquina das ruas)
              if (a.length !== 9) continue;
              a = [alvo, (a[1] - info.x0) * e, (a[2] - info.y0) * e, a[3] * e, a[4] * e, a[5], a[6], a[7], a[8]];
            }
            ctx[k](...a);
          }
        } catch (er) { if (!S._avisou) { S._avisou = true; console.warn('chão em blocos', o[0], er); } }
        if ((o[0] === 'f' || (n & 15) === 15) && performance.now() - t0 > orc.ms) { yield; t0 = performance.now(); } // (passo especial pesa: confere depois de cada um)
      }
      } finally { while (prof-- > 0) ctx.restore(); ctx.restore(); }
    }
    // começa a pintar um bloco (gerador; termina guardando)
    *fazBloco(i, j, orc) {
      const r = this.retBloco(i, j), ver = this.ver;
      const mg = this.margem ? MG : 0, x0 = Math.max(0, r.x0 - mg), y0 = Math.max(0, r.y0 - mg), x1 = Math.min(this.width, r.x1 + mg), y1 = Math.min(this.height, r.y1 + mg);
      const cw = Math.ceil((r.x1 - r.x0) * ESC), ch = Math.ceil((r.y1 - r.y0) * ESC);
      const c = mkCanvas(cw, ch);
      if (mg) { // pinta na tela de trabalho (com margem) e copia o miolo
        const tw = Math.ceil((x1 - x0) * ESC), th = Math.ceil((y1 - y0) * ESC), t = trab(tw, th);
        yield* this.pinta(t, { x0, y0, w: x1 - x0, h: y1 - y0, esc: ESC }, orc);
        c.getContext('2d').drawImage(t, (r.x0 - x0) * ESC, (r.y0 - y0) * ESC, cw, ch, 0, 0, cw, ch);
      } else yield* this.pinta(c, { x0: r.x0, y0: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0, esc: ESC }, orc);
      guarda(this, i, j, c, ver);
    }
    *fazPrevia(orc) {
      const ver = this.ver, c = mkCanvas(Math.ceil(this.width * PE), Math.ceil(this.height * PE));
      yield* this.pinta(c, { x0: 0, y0: 0, w: this.width, h: this.height, esc: PE }, orc);
      this.prev = c; this.prevVer = ver; pendPrevia.delete(this);
    }
    // desenha o chão que aparece na tela (sx..sx+sw, sy..sy+sh em pixels do mapa); o ctx já está na posição do mapa
    desenhaEm(ctx, sx, sy, sw, sh) {
      quadro++;
      const vis = this.soPrevia ? [] : this.blocosEm(sx, sy, sw, sh);
      for (const [i, j] of vis) { const g = GUARDADOS.get(this.chave(i, j)); if (g) g.q = quadro; }
      const falta = vis.filter(([i, j]) => !this.fresco(i, j));
      if (falta.length) trabalha(this, falta.slice(), sx + sw / 2, sy + sh / 2, ORC_TELA);
      const semBloco = this.soPrevia || vis.some(([i, j]) => !GUARDADOS.has(this.chave(i, j)));
      if (semBloco) { // o fundo: a prévia (ou as cores dos quadradinhos)
        const p = this.prev || null, fx = Math.max(0, sx), fy = Math.max(0, sy), fw = Math.min(this.width - fx, sw), fh = Math.min(this.height - fy, sh);
        if (fw > 0 && fh > 0) {
          ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
          if (p) ctx.drawImage(p, fx * PE, fy * PE, fw * PE, fh * PE, fx, fy, fw, fh);
          else if (this.prev0) { const k = this.prev0.width / this.width; ctx.drawImage(this.prev0, fx * k, fy * k, fw * k, fh * k, fx, fy, fw, fh); }
          else { ctx.fillStyle = this.cor; ctx.fillRect(fx, fy, fw, fh); }
          ctx.restore();
        }
      }
      for (const [i, j] of vis) {
        const g = GUARDADOS.get(this.chave(i, j)); if (!g) continue;
        const r = this.retBloco(i, j), dx0 = Math.max(r.x0, r.bx - 1), dy0 = Math.max(r.y0, r.by - 1), dx1 = Math.min(r.x1, r.bx + r.bw + 1), dy1 = Math.min(r.y1, r.by + r.bh + 1);
        ctx.drawImage(g.c, (dx0 - r.x0) * ESC, (dy0 - r.y0) * ESC, (dx1 - dx0) * ESC, (dy1 - dy0) * ESC, dx0, dy0, dx1 - dx0, dy1 - dy0);
      }
      if (!falta.length) ocioso(this, sx, sy, sw, sh);
    }
    // a imagem inteira numa escala (fotos e testes)
    solta() { for (const k of [...GUARDADOS.keys()]) if (GUARDADOS.get(k).S === this) tira(k); this.prev = null; this.prevVer = -1; pendPrevia.delete(this); if (job && job.S === this) larga(); }
  }
  function guarda(S, i, j, c, ver) {
    const k = S.chave(i, j); if (GUARDADOS.has(k)) tira(k);
    const b = c.width * c.height * 4; GUARDADOS.set(k, { S, k, c, bytes: b, q: quadro, ver }); bytes += b;
    if (bytes > TETO) { // o usado há mais tempo sai primeiro (nunca o que está na tela agora)
      const l = [...GUARDADOS.values()].filter(g => g.q < quadro - 1).sort((a, b2) => a.q - b2.q);
      for (const g of l) { if (bytes <= TETO) break; tira(g.k); }
    }
  }
  function larga() { if (job) { try { job.g.return(); } catch (e) { } job = null; } }
  function tira(k) { const g = GUARDADOS.get(k); if (!g) return; bytes -= g.bytes; g.c.width = g.c.height = 0; GUARDADOS.delete(k); }
  // trabalho com orçamento: termina o que está fazendo; depois o bloco que falta mais perto do meio da tela
  function trabalha(S, falta, cx, cy, ms) {
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      if (job && job.S !== S && falta.length) larga(); // (o trabalho de outro mapa é largado: este tem pressa)
      if (!job) {
        const orc = { ms };
        if (S.grande && (!S.prev || S.prevVer !== S.ver) && falta.some(([i, j]) => !GUARDADOS.has(S.chave(i, j)))) job = { S, k: 'previa', orc, g: S.fazPrevia(orc) }; // (primeiro a prévia: a tela inteira de uma vez)
        else {
          if (!falta.length) return;
          falta.sort((a, b) => Math.hypot((a[0] + 0.5) * B - cx, (a[1] + 0.5) * B - cy) - Math.hypot((b[0] + 0.5) * B - cx, (b[1] + 0.5) * B - cy));
          const [i, j] = falta.shift(); job = { S, k: i + ':' + j, orc, g: S.fazBloco(i, j, orc) };
        }
      }
      job.orc.ms = Math.max(1, ms - (performance.now() - t0));
      const tj = performance.now(), k = job.k, feito = job.g.next().done; if (DBG.l) DBG.l.push([k, Math.round(performance.now() - tj)]);
      if (feito) { job = null; if (!falta.length) return; }
    }
  }
  function continua(ms) { const t0 = performance.now(); while (job && performance.now() - t0 < ms) { job.orc.ms = Math.max(1, ms - (performance.now() - t0)); const tj = performance.now(), k = job.k; if (job.g.next().done) job = null; if (DBG.l) DBG.l.push(['o' + k, Math.round(performance.now() - tj)]); } }
  // sem nada faltando na tela: adianta os blocos em volta (andando, já estão prontos) e as prévias dos vizinhos
  function ocioso(S, sx, sy, sw, sh) {
    const viz = S.blocosEm(sx - B * 0.6, sy - B * 0.6, sw + B * 1.2, sh + B * 1.2).filter(([i, j]) => !S.fresco(i, j));
    if (viz.length) return trabalha(S, viz, sx + sw / 2, sy + sh / 2, ORC_OCIO);
    if (job) return continua(ORC_OCIO);
    for (const P of pendPrevia) { if (P.prev && P.prevVer === P.ver) { pendPrevia.delete(P); continue; } const orc = { ms: ORC_OCIO }; job = { S: P, k: 'previa', orc, g: P.fazPrevia(orc) }; return continua(ORC_OCIO); }
  }
  return {
    ChaoBlocos, B, ESC, PE, TETO, CEL, GUARDADOS, DBG,
    nova: (W, H, m, opc) => new ChaoBlocos(W, H, m, opc),
    querPrevia: S => { if (S && S.grande && !S.soPrevia) pendPrevia.add(S); },
    usoMB: () => Math.round(bytes / 1048576),
    // (testes e fotos) pinta tudo na hora numa tela, na escala pedida
    fotoInteira(S, esc = 1, rx = 0, ry = 0, rw = S.width, rh = S.height) { const c = mkCanvas(Math.ceil(rw * esc), Math.ceil(rh * esc)); if (S.soPrevia) return c; const g = S.pinta(c, { x0: rx, y0: ry, w: rw, h: rh, esc }, { ms: 1e9 }); while (!g.next().done); return c; },
  };
})();
// a lousa do chão de um mapa de W×H pixels (quem desenha usa getContext('2d') como numa tela comum)
function novoChaoBlocos(W, H, m, opc) { return CHAO_BLOCOS.nova(W, H, m, opc); }
