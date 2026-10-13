/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ✨ BRILHO DO REFINO (v368, dono: "algo que mostre no boneco quando o player usa um item +10... como no Metin, o brilho
   começava no +7 e a animação mudava conforme subia"). Cada PEÇA brilha no lugar dela do boneco:
     +7  um reflexo de luz que passa pela peça de vez em quando
     +8  brilho contínuo, pulsando devagar, na cor da raridade do item
     +9  brilho forte + faíscas subindo da peça
     +10 a peça "acesa": brilho forte, luz correndo pela peça e partículas; a chuteira +10 deixa rastro de luz
   CONJUNTO LENDÁRIO: as 6 peças em +10 → aura dourada no personagem inteiro.
   O brilho segue a silhueta do boneco (faixas: cabeça, colar, camisa, calção, caneleira, chuteira).
   Carregar NO FIM (depois de adornos2.js, montarias.js e jogadas: só desenha por cima do jogador).
   ============================================================ */
{
  // faixas do corpo (fração da altura do desenho, de cima para baixo) — medidas no boneco de frente e de lado
  // (v413: só de reserva, medidas no CORPO sem chapéu/cabelo — cada peça agora brilha na forma dela: ver mascaras(), abaixo)
  const FAIXA = { cabeca: [0, 0.31], acessorio: [0.27, 0.37], camisa: [0.33, 0.6], calcao: [0.57, 0.72], perna: [0.7, 0.9], chuteira: [0.87, 1.01] };
  const SLOTS = Object.keys(FAIXA);
  const corDe = id => { try { return RARIDADE[raridadeItem(id)].cor || '#ffd23f'; } catch (e) { return '#ffd23f'; } };
  // v371 (dono: "imagina esses itens +10... ficará muita coisa"): RELÍQUIA não usa o brilho do refino — tem a marca própria
  // dela (relíquias, abaixo), que cresce com o refino. Cada peça tem UM efeito só.
  const ehReliquia = id => !!(ITENS[id] && ITENS[id].reliquia);
  const refinos = () => { const s = G.save; if (!s || !s.equip) return []; return SLOTS.map(sl => ({ sl, id: s.equip[sl], r: (s.equipR && s.equipR[sl]) || 0 })).filter(p => p.id && p.r >= 7 && !ehReliquia(p.id)); };
  const marcas = () => { const s = G.save; if (!s || !s.equip) return []; return SLOTS.map(sl => ({ sl, id: s.equip[sl], r: (s.equipR && s.equipR[sl]) || 0 })).filter(p => p.id && MARCA[p.id]); };
  window.brilhoRefino = { FAIXA, refinos };
  // caixa opaca do desenho (para as faixas pegarem o corpo, e não a folga em volta) — guardada por canvas
  const CAIXA = new WeakMap();
  function caixa(c) {
    let b = CAIXA.get(c); if (b) return b;
    try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let y0 = c.height, y1 = 0; for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x += 2) if (d[(y * c.width + x) * 4 + 3] > 40) { if (y < y0) y0 = y; if (y > y1) y1 = y; break; } b = { y0: Math.min(y0, y1), y1: Math.max(y0, y1) }; } catch (e) { b = { y0: 0, y1: c.height }; }
    CAIXA.set(c, b); return b;
  }
  // só o CORPO: pixels sólidos da coluna do meio (as asas e as bordas translúcidas ficam de fora: senão vira uma "caixa")
  const CORPO = new WeakMap();
  function corpo(c) {
    let k = CORPO.get(c); if (k) return k;
    k = document.createElement('canvas'); k.width = c.width; k.height = c.height;
    try {
      const x = k.getContext('2d'); x.drawImage(c, 0, 0); const im = x.getImageData(0, 0, c.width, c.height), d = im.data, W = c.width;
      // a coluna do corpo: onde há mais pixels sólidos (as asas são finas e translúcidas)
      const col = new Float32Array(W); for (let y = 0; y < c.height; y++) for (let xx = 0; xx < W; xx++) if (d[(y * W + xx) * 4 + 3] > 200) col[xx]++;
      const mx = Math.max(...col), meio = W / 2; let x0 = Math.floor(meio), x1 = Math.ceil(meio);
      while (x0 > 0 && col[x0 - 1] > mx * 0.22) x0--; while (x1 < W - 1 && col[x1 + 1] > mx * 0.22) x1++;
      x0 = Math.max(0, x0 - 2); x1 = Math.min(W - 1, x1 + 2);
      for (let y = 0; y < c.height; y++) for (let xx = 0; xx < W; xx++) { const i = (y * W + xx) * 4 + 3; if (xx < x0 || xx > x1 || d[i] < 170) d[i] = 0; }
      x.putImageData(im, 0, 0);
    } catch (e) { }
    CORPO.set(c, k); return k;
  }
  const off = document.createElement('canvas'), oc = off.getContext('2d');
  const FAISCAS = [];
  /* ---------- v413: MÁSCARA DE CADA PEÇA ----------
     Bug do jogador (13/10/2026): "O efeito de brilho no personagem está pegando apenas uma parte do rosto, deixando uma linha
     reta sem iluminar." Causa: as faixas (FAIXA, acima) eram frações da altura do DESENHO inteiro, e o desenho cresce para
     cima com a coroa/o chapéu (o recorte reserva o espaço do chapéu) e com o cabelo volumoso — a faixa da camisa (0,33..0,6)
     e a da cabeça (0..0,31) caíam no meio do rosto e cortavam reto. Agora cada peça brilha na forma DELA:
       cabeça e colar: os pixels que só existem no desenho COM a peça (o chapéu/a coroa/a faixa/o capacete inteiro; o colar);
       camisa e calção: os pixels da camisa/do calção, lidos das cores-chave da folha num desenho "rotulado" feito à parte;
       caneleira e chuteira: do fim do calção ao tornozelo e do tornozelo ao chão (esqueleto), com as bordas esfumadas.
     Sem o rótulo (skin, folha ainda chegando), as faixas medidas no CORPO (sem chapéu e sem cabelo) com a cabeça inteira até
     o pescoço e as bordas esfumadas — nunca uma linha reta atravessando o rosto. */
  let brRot = false; // (montando o desenho rotulado: camisa = magenta, calção = ciano, o resto preto; chapéu e colar por cima, como no boneco)
  const _tgBr = tingeCelula;
  tingeCelula = function (base, cores) {
    const out = _tgBr.apply(this, arguments);
    if (!brRot || !base || !base.rot || !out || out === base.c || (typeof MODO_AGORA !== 'undefined' && (MODO_AGORA === 'skin' || MODO_AGORA === 'fixo'))) return out;
    try {
      const x = out.getContext('2d'), img = x.getImageData(0, 0, out.width, out.height), o = img.data, rot = base.rot;
      if (rot.length * 4 === o.length) { for (let i = 0; i < rot.length; i++) { const k = rot[i], j = i * 4; o[j] = k === 2 ? 255 : 0; o[j + 1] = k === 3 ? 255 : 0; o[j + 2] = k === 2 || k === 3 ? 255 : 0; } x.putImageData(img, 0, 0); }
    } catch (e) { }
    return out;
  };
  const pxDe = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  // os desenhos feitos só para medir não ficam ocupando o lugar dos bonecos prontos (SPR_CACHE, boneco.js)
  const solta = (lk, vista, q) => { try { if (typeof SPR_CACHE !== 'undefined') SPR_CACHE.delete(chaveBoneco(lk) + '|S' + (vista === 'costas' ? 'c' : vista === 'lado' ? 'l' : 'f') + q); } catch (e) { } };
  const mesmo = (s, c) => s && s.c && s.c !== c && s.c.width === c.width ? s.c : null; // outro desenho do mesmo tamanho de largura
  // a peça = o que muda entre o desenho COM e SEM ela (alinhados pelos pés: o chapéu pode aumentar o desenho para cima)
  function difPeca(dC, c, cSem) {
    const W = c.width, H = c.height, out = new Uint8Array(W * H); if (!cSem) return null;
    const dS = pxDe(cSem), dh = H - cSem.height; let n = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; if (dC[i + 3] < 130) continue;
      const ys = y - dh, j = (ys * W + x) * 4, fora = ys < 0 || ys >= cSem.height;
      if (fora || Math.abs(dS[j + 3] - dC[i + 3]) > 40 || Math.abs(dC[i] - dS[j]) + Math.abs(dC[i + 1] - dS[j + 1]) + Math.abs(dC[i + 2] - dS[j + 2]) > 12) { out[y * W + x] = 255; n++; } // (o mesmo desenho: fora da peça os pixels são iguais; o contorno escuro da peça sobre cabelo escuro também conta)
    }
    if (n < 25) return null;
    // fecha os furinhos (contorno da peça igual ao contorno do cabelo de baixo): peça dos dois lados (até 2 pixels) vira peça, se for desenho
    const o2 = out.slice(), tem = (x, y) => x >= 0 && y >= 0 && x < W && y < H && out[y * W + x];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = y * W + x; if (out[p] || dC[p * 4 + 3] < 130) continue; if (((tem(x - 1, y) || tem(x - 2, y)) && (tem(x + 1, y) || tem(x + 2, y))) || ((tem(x, y - 1) || tem(x, y - 2)) && (tem(x, y + 1) || tem(x, y + 2)))) o2[p] = 255; }
    return o2;
  }
  // monta a máscara (canvas) a partir de um alfa por pixel; guarda as linhas de cima/de baixo (para as faíscas)
  function vaiCanvas(a, W, H) {
    let ya = H, yb = -1, xa = W, xb = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (a[y * W + x] > 20) { if (y < ya) ya = y; yb = y; if (x < xa) xa = x; if (x > xb) xb = x; }
    if (yb < 0) return null;
    const k = document.createElement('canvas'); k.width = W; k.height = H; const x = k.getContext('2d'), im = x.createImageData(W, H), d = im.data;
    for (let i = 0; i < a.length; i++) if (a[i]) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = a[i]; }
    x.putImageData(im, 0, 0); return { c: k, ya, yb: yb + 1, xa, xb: xb + 1 };
  }
  // peso de uma linha numa faixa [ya, yb] com a borda esfumada (sem linha reta)
  const pesoFaixa = (y, ya, yb, fa, fb) => { let w = 1; if (fa > 0 && y < ya + fa) w = Math.min(w, (y - (ya - fa)) / (2 * fa)); if (fb > 0 && y > yb - fb) w = Math.min(w, ((yb + fb) - y) / (2 * fb)); return Math.max(0, Math.min(1, w)); };
  // por desenho do boneco (o de verdade, com o item de costas): { ok (tudo medido de verdade), n (tentativas), t (quando), m: { slot: {c, ya, yb, xa, xb} } }
  const MASC = new WeakMap();
  // comp0 = o boneco como aparece (com capa/mochila/asas); comp = o mesmo SEM o item de costas (de onde as peças são lidas)
  // folga = fora do desenho do quadro (sem o orçamento de bonecos novos por quadro): mede tudo de uma vez
  function mascaras(comp0, comp, look, vista, quadro, folga) {
    const c = comp.c, chave = comp0.c, ant = MASC.get(chave), agora = performance.now();
    if (ant && (ant.ok || ant.n >= 6)) return ant.m; // (no máximo 6 tentativas: skin não tem rótulo)
    if (!folga || (ant && agora - ant.t < 300)) return null; // mede só nas folgas (preparaDepois), nunca no meio do quadro; de novo só depois de um tempinho (arte chegando)
    const W = c.width, H = c.height, dC = pxDe(c), lk = Object.assign({}, look, { costas: null }), m = {}; let ok = true;
    const vale = i => dC[i * 4 + 3] >= 130;
    // o que o item de costas cobre (a capa de costas): ali a peça não aparece, então não brilha
    let coberto = null;
    if (comp0.c !== c && comp0.c.width === W && comp0.c.height === H) { const d0 = pxDe(comp0.c); coberto = new Uint8Array(W * H); for (let p = 0; p < coberto.length; p++) { const j = p * 4; if (Math.abs(d0[j + 3] - dC[j + 3]) > 60 || Math.abs(d0[j] - dC[j]) + Math.abs(d0[j + 1] - dC[j + 1]) + Math.abs(d0[j + 2] - dC[j + 2]) > 40) coberto[p] = 1; } }
    const vai = a => { if (a && coberto) for (let p = 0; p < a.length; p++) if (coberto[p]) a[p] = 0; return a ? vaiCanvas(a, W, H) : null; };
    // o desenho rotulado (camisa/calção)
    let rot = null;
    if (!(look.folha && typeof MODO_FOLHA !== 'undefined' && MODO_FOLHA[look.folha] === 'skin')) {
      let s = null; const lr = Object.assign({}, lk, { _brRot: 1 }); brRot = true; try { s = spriteBoneco(lr, vista, quadro); } catch (e) { } finally { brRot = false; }
      const cr = mesmo(s, c); if (cr && cr.height === H) rot = pxDe(cr); solta(lr, vista, quadro);
    }
    const ehCam = j => rot[j] > 200 && rot[j + 1] < 60 && rot[j + 2] > 200, ehCal = j => rot[j] < 60 && rot[j + 1] > 200 && rot[j + 2] > 200;
    // cabeça (chapéu) e colar: COM x SEM a peça
    const tira = (o) => { const l2 = Object.assign({}, lk, o); try { return mesmo(spriteBoneco(l2, vista, quadro), c); } catch (e) { return null; } finally { solta(l2, vista, quadro); } }; // (o canvas continua valendo para a medida logo abaixo)
    const aCab = look.chapeu || look.chapeuVar ? difPeca(dC, c, tira({ chapeu: null, chapeuVar: null })) : null;
    const aCol = look.pescoco || look.pescocoVar ? difPeca(dC, c, tira({ pescoco: null, pescocoVar: null })) : null;
    if ((look.chapeu || look.chapeuVar) && !aCab) ok = false;
    // o corpo-base (sem chapéu e sem cabelo): alturas que não mudam com o penteado nem com o chapéu (presas pelos pés)
    let base = null, E = null;
    try { const r = spriteBoneco(Object.assign({}, lk, { chapeu: null, chapeuVar: null, cabelo: null }), 'frente', 0); // (o mesmo para todas as poses: a altura do corpo não muda)
      if (r && r.c && r.c.width === W && r.c !== c) { base = r.c; E = esqueleto(r.c); } } catch (e) { }
    if (!base || !E) ok = false;
    const dH = base ? H - base.height : 0, cxB = base ? caixa(base) : caixa(c), yb0 = cxB.y0 + dH, Hb = cxB.y1 - cxB.y0 + 1, yFim = cxB.y1 + dH;
    const fr = f => yb0 + Hb * f; // fração do CORPO (não do desenho todo)
    // pescoço: onde a camisa começa (rótulo); sem rótulo, a medida antiga no corpo
    let yCam0 = null, yCal1 = null, nCam = 0, nCal = 0;
    if (rot) { for (let y = 0; y < H; y++) { let a = 0, b = 0; for (let x = 0; x < W; x++) { const p = y * W + x; if (!vale(p)) continue; if (ehCam(p * 4)) a++; else if (ehCal(p * 4)) b++; } if (a >= 2 && yCam0 == null) yCam0 = y; if (b >= 2) yCal1 = y; nCam += a; nCal += b; } }
    const temCam = rot && nCam >= 40, temCal = rot && nCal >= 30;
    if (!temCam || !temCal) ok = false;
    const yPesc = temCam ? yCam0 : fr(0.31);
    const yTorn = E ? E.tornozelo + dH : fr(0.88), yCal = temCal ? yCal1 + 1 : fr(0.72);
    const cp = corpo(c), dK = pxDe(cp); // (a coluna do corpo: sem asa/capa)
    const faixa = (ya, yb, fa, fb, filtro) => { const a = new Uint8Array(W * H); for (let y = Math.max(0, Math.floor(ya - fa)); y < Math.min(H, Math.ceil(yb + fb)); y++) { const w = pesoFaixa(y, ya, yb, fa, fb); if (!w) continue; for (let x = 0; x < W; x++) { const p = y * W + x; if (dK[p * 4 + 3] < 170 || (filtro && !filtro(p))) continue; a[p] = Math.round(255 * w); } } return a; };
    const semPecas = p => !(rot && (ehCam(p * 4) || ehCal(p * 4))) && !(aCab && aCab[p]) && !(aCol && aCol[p]);
    const rotulo = f => { const a = new Uint8Array(W * H); for (let p = 0; p < a.length; p++) if (vale(p) && f(p * 4) && !(aCab && aCab[p]) && !(aCol && aCol[p])) a[p] = 255; return a; };
    // cabeça: o chapéu inteiro; sem ele medido, a cabeça inteira até o pescoço
    m.cabeca = vai(aCab || faixa(-H, yPesc, 0, Hb * 0.02, null));
    m.acessorio = vai(aCol || faixa(yPesc - Hb * 0.03, yPesc + Hb * 0.07, Hb * 0.015, Hb * 0.02, null));
    m.camisa = vai(temCam ? rotulo(ehCam) : faixa(yPesc, fr(0.6), Hb * 0.015, Hb * 0.02, null));
    m.calcao = vai(temCal ? rotulo(ehCal) : faixa(fr(0.57), fr(0.72), Hb * 0.02, Hb * 0.02, null));
    m.perna = vai(faixa(yCal, yTorn + (yFim - yTorn) * 0.25, Hb * 0.012, Hb * 0.015, semPecas));
    m.chuteira = vai(faixa(yTorn - Hb * 0.005, H, Hb * 0.015, 0, semPecas));
    const reg = { ok, t: agora, n: ant ? ant.n + 1 : 1, m }; MASC.set(chave, reg);
    return ok || reg.n >= 6 ? m : null; // provisória: melhor sem brilho por um instante do que um brilho no lugar errado
  }
  // mede as poses fora do desenho do quadro (nas folgas): as 4 da vista pedida, uma por vez
  const FILA = new Set();
  function preparaDepois(vista) {
    for (let q = 0; q < 4; q++) {
      const k = vista + q; if (FILA.has(k)) continue; FILA.add(k);
      const roda = () => {
        FILA.delete(k);
        try { if (!G.save || !G.p) return; const look = lookJogador(), c0 = spriteBoneco(look, vista, q); if (!c0 || !c0.c || c0.c.width < 8) return;
          let cp = c0; if (look.costas) { const c2 = spriteBoneco(Object.assign({}, look, { costas: null }), vista, q); if (c2 && c2.c && c2.c.width === c0.c.width && c2.c.height === c0.c.height) cp = c2; }
          mascaras(c0, cp, look, vista, q, true); } catch (e) { }
      };
      if (typeof requestIdleCallback === 'function') requestIdleCallback(roda, { timeout: 250 + q * 120 }); else setTimeout(roda, 30 + q * 40);
    }
  }
  window.brilhoRefino.mascaras = mascaras; // (testes e fotos de conferência)
  // a silhueta da peça num canvas à parte: pintada na COR (luz == null) ou só a FAIXA DE LUZ passando (luz 0..1)
  let CX = null; // v413: o retângulo da peça no canvas à parte (só ele é pintado e desenhado: a peça pequena custa pouco)
  function camada(M, cor, alfa, luz) {
    const c = M.c;
    if (off.width !== c.width || off.height !== c.height) { off.width = c.width; off.height = c.height; } else if (CX) oc.clearRect(CX.x, CX.y, CX.w, CX.h); else oc.clearRect(0, 0, off.width, off.height);
    const x0 = M.xa != null ? Math.max(0, M.xa - 1) : 0, y0 = M.ya != null ? Math.max(0, M.ya - 1) : 0, x1 = M.xb != null ? Math.min(c.width, M.xb + 1) : c.width, y1 = M.yb != null ? Math.min(c.height, M.yb + 1) : c.height;
    CX = { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
    oc.save(); oc.globalCompositeOperation = 'source-over'; oc.globalAlpha = 1; oc.drawImage(c, CX.x, CX.y, CX.w, CX.h, CX.x, CX.y, CX.w, CX.h);
    oc.globalCompositeOperation = 'source-in';
    if (luz == null) { oc.fillStyle = cor; oc.fillRect(CX.x, CX.y, CX.w, CX.h); }
    else { const bh = Math.max(8, y1 - y0), L = (x1 - x0) + bh, p = x0 - bh + luz * L, g = oc.createLinearGradient(p, y1, p + bh * 0.6, y0); // v413: a luz atravessa a PEÇA (num chapéu pequeno ela passava quase sempre fora)
      g.addColorStop(0.38, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.85)'); g.addColorStop(0.62, 'rgba(255,255,255,0)'); oc.fillStyle = g; oc.fillRect(CX.x, CX.y, CX.w, CX.h); }
    oc.restore();
    return { alfa, ya: M.ya, yb: M.yb };
  }
  // desenha o canvas à parte no boneco (w x h = o desenho inteiro), deslocado de (dx, dy) — só o retângulo da peça
  function poeOff(ctx, w, h, dx, dy) { const kx = w / off.width, ky = h / off.height; ctx.drawImage(off, CX.x, CX.y, CX.w, CX.h, -w / 2 + CX.x * kx + dx, -h + CX.y * ky + dy, CX.w * kx, CX.h * ky); }
  /* ---------- marcas das relíquias ---------- */
  // v375: o ESQUELETO do boneco, lido do próprio desenho (corpo-base: sem chapéu, sem cabelo e sem item de costas), de baixo
  // para cima — vale para corpo masculino/feminino, criança/adulto (cada um tem proporções diferentes):
  //   sapato (as linhas mais largas lá embaixo) → TORNOZELO (a largura cai) → canela/perna → CALÇÃO → CINTURA (onde as mãos
  //   encostam, o trecho do meio alarga de repente) → camisa. Guardado por canvas.
  // linhas de um canvas (máscara do corpo): os segmentos de cada linha e o "trecho do meio"
  const LIN = new WeakMap();
  function linhas(c) {
    let L = LIN.get(c); if (L) return L;
    const k = corpo(c), W = c.width, d = k.getContext('2d').getImageData(0, 0, W, c.height).data, meio = W / 2, cache = {};
    const segs = y => { if (cache[y]) return cache[y]; const out = []; let ini = -1; if (y >= 0 && y < c.height) for (let x = 0; x <= W; x++) { const on = x < W && d[(y * W + x) * 4 + 3] > 170; if (on) { if (ini < 0) ini = x; } else if (ini >= 0) { if (x - ini >= 2) out.push([ini, x - 1]); ini = -1; } } return cache[y] = out; };
    const centro = (y, folga = 30) => { const sg = segs(y).filter(q => q[1] >= meio - folga && q[0] <= meio + folga); if (!sg.length) return null; return { x0: Math.min(...sg.map(q => q[0])), x1: Math.max(...sg.map(q => q[1])), sg }; };
    L = { segs, centro, W, Hc: c.height }; LIN.set(c, L); return L;
  }
  // as ALTURAS (tornozelo, cintura) lidas no boneco de FRENTE e PARADO — onde aparecem claras; valem para todas as vistas e
  // quadros (o corpo tem a mesma altura em todos). Guardado por canvas de referência.
  const ESQ = new WeakMap();
  function esqueleto(ref) {
    let r = ESQ.get(ref); if (r !== undefined) return r; r = null;
    try {
      const cx = caixa(ref), L = linhas(ref), y1 = cx.y1, H = cx.y1 - cx.y0 + 1, larg = y => { const C = L.centro(y); return C ? C.x1 - C.x0 : 0; };
      // sapato: a linha mais larga lá embaixo; tornozelo: subindo dali, a 1ª linha bem mais estreita
      let ySap = y1, wSap = 0; for (let y = y1; y >= y1 - Math.round(H * 0.12); y--) { const w = larg(y); if (w > wSap) { wSap = w; ySap = y; } }
      let tornozelo = null; for (let y = ySap - 1; y >= y1 - Math.round(H * 0.3); y--) if (larg(y) < wSap * 0.92) { tornozelo = y; break; }
      if (tornozelo == null) return (ESQ.set(ref, null), null);
      const pernaW = larg(tornozelo - 3) || wSap * 0.85;
      // cintura: subindo pela perna e pelo calção, onde o trecho do meio alarga de repente (as mãos encostam)
      let cintura = null; for (let y = tornozelo - 3; y >= cx.y0 + H * 0.3; y--) { if (larg(y) > pernaW * 1.38) { cintura = y + 1; break; } }
      if (cintura == null) return (ESQ.set(ref, null), null);
      const C = L.centro(cintura); r = { y1, H, tornozelo, cintura, cintW: C ? C.x1 - C.x0 : pernaW * 1.2, cintX: C ? (C.x0 + C.x1) / 2 : ref.width / 2 };
    } catch (e) { r = null; }
    ESQ.set(ref, r); return r;
  }
  // os pés (entre o tornozelo e o chão), no quadro atual
  function pes(c, E) {
    const yy = Math.round(E.tornozelo + (E.y1 - E.tornozelo) * 0.45), C = linhas(c).centro(yy, 60);
    return { seg: C ? (C.sg.length >= 2 ? C.sg : [[C.x0, C.x1]]) : [], y: yy };
  }
  // as canelas (logo acima do tornozelo), no quadro atual; se as pernas estão juntas no desenho, divide ao meio
  function canelas(c, E, lado) {
    const L = linhas(c), ya = Math.round(E.tornozelo - E.H * 0.075), yb = Math.round(E.tornozelo - E.H * 0.02), W = c.width, col = new Uint16Array(W), rows = yb - ya + 1;
    for (let y = ya; y <= yb; y++) { const C = L.centro(y, 60); if (C) for (const [a, b] of C.sg) for (let x = a; x <= b; x++) col[x]++; }
    let seg = [], ini = -1; for (let x = 0; x <= W; x++) { if (x < W && col[x] >= rows * 0.5) { if (ini < 0) ini = x; } else if (ini >= 0) { if (x - ini >= 2) seg.push([ini, x - 1]); ini = -1; } }
    if (seg.length === 1 && !lado) { const [a, b] = seg[0], mid = (a + b) / 2; seg = [[a, mid - 1], [mid + 1, b]]; } // pernas juntas: uma de cada lado
    return { seg, y: (ya + yb) / 2 };
  }
  // pontos fixos dentro do tronco (acima da cintura), sorteados uma vez por canvas: onde as estrelinhas piscam
  const PONTOS_CAMISA = new WeakMap();
  function pontosCamisa(c, E) {
    let r = PONTOS_CAMISA.get(c); if (r) return r; r = [];
    try {
      const k = corpo(c), ya = Math.round(E.cintura - E.H * 0.2), yb = Math.round(E.cintura - E.H * 0.05), W = c.width, L = linhas(c);
      const d = k.getContext('2d').getImageData(0, ya, W, yb - ya + 1).data, cand = [];
      for (let y = 0; y <= yb - ya; y += 2) {
        const C = L.centro(ya + y); if (!C) continue; const m = (C.x0 + C.x1) / 2, meia = (C.x1 - C.x0) / 2 * 0.62; // longe da borda e dos braços
        for (let x = 0; x < W; x += 2) {
          if (Math.abs(x - m) > meia) continue;
          const ok = [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]].every(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && xx < W && yy >= 0 && yy <= yb - ya && d[(yy * W + xx) * 4 + 3] > 200; });
          if (ok) cand.push([x, ya + y]);
        }
      }
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 7 && cand.length; i++) r.push(cand.splice((rnd() * cand.length) | 0, 1)[0]);
    } catch (e) { }
    PONTOS_CAMISA.set(c, r); return r;
  }
  // uma asinha de 3 penas; lado = -1 abre para a esquerda, +1 para a direita
  function asinha(ctx, x, y, tam, lado, bate, r, t) {
    const ouro = r >= 8, brilho = r >= 9 ? (r >= 10 ? 1 : 0.55) : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(lado, 1); ctx.rotate(-0.15 - bate * 0.3);
    if (brilho) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(tam * 0.5, -tam * 0.2, 0, tam * 0.5, -tam * 0.2, tam * 1.3); g.addColorStop(0, `rgba(255,220,90,${0.55 * brilho})`); g.addColorStop(1, 'rgba(255,220,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tam * 0.5, -tam * 0.2, tam * 1.3, 0, 7); ctx.fill(); ctx.restore(); }
    const penas = [[-0.8, 1], [-0.42, 0.86], [-0.06, 0.7]]; // a de cima é a maior, como numa asa
    for (const [ang, comp] of penas) {
      ctx.save(); ctx.rotate(ang); const L = tam * comp, E = tam * 0.24;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -E, L, 0); ctx.quadraticCurveTo(L * 0.5, E * 0.75, 0, 0); ctx.closePath();
      ctx.fillStyle = ouro ? (r >= 10 ? '#ffe680' : '#f6d878') : '#fbf6ea'; ctx.fill();
      ctx.lineWidth = Math.max(1, tam * 0.07); ctx.strokeStyle = ouro ? '#b07a10' : '#c8a050'; ctx.stroke();
      ctx.restore();
    }
    // reflexo de luz passando (+7 em diante, cada vez mais vezes)
    if (r >= 7) { const per = r >= 10 ? 900 : r === 9 ? 1400 : r === 8 ? 2000 : 2800, k = (t % per) / per; if (k < 0.35) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7 * Math.sin(k / 0.35 * Math.PI); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(tam * (0.2 + k * 2), -tam * 0.05, tam * 0.14, tam * 0.08, 0, 0, 7); ctx.fill(); } }
    ctx.restore();
  }
  // o símbolo ∞, desenhado com uma linha só
  function infinito(ctx, x, y, tam, r, t, fase, ouro) {
    const brilho = r >= 9 ? (r >= 10 ? 1 : 0.55) : 0, pulso = 0.5 + 0.5 * Math.sin(t / 380 + fase);
    const traco = () => { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, d = 1 + Math.sin(a) ** 2; ctx.lineTo(x + tam * Math.cos(a) / d, y + tam * Math.sin(a) * Math.cos(a) / d); } ctx.closePath(); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (brilho) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = ouro ? `rgba(255,210,90,${(0.4 + 0.35 * pulso) * brilho})` : `rgba(120,220,255,${(0.35 + 0.35 * pulso) * brilho})`; ctx.lineWidth = tam * 0.55; traco(); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
    ctx.strokeStyle = 'rgba(10,40,80,0.85)'; ctx.lineWidth = tam * 0.34; traco(); ctx.stroke(); // contorno escuro (aparece em qualquer meião)
    ctx.strokeStyle = ouro ? '#ffe680' : r >= 8 ? (r >= 10 ? '#e8fbff' : '#9ae8ff') : '#7ac8f0'; ctx.lineWidth = tam * 0.18; traco(); ctx.stroke();
    if (r >= 7) { const per = r >= 10 ? 900 : r === 9 ? 1400 : r === 8 ? 2000 : 2800, k = ((t + fase * 300) % per) / per; if (k < 0.4) { const a = k / 0.4 * Math.PI * 2, d = 1 + Math.sin(a) ** 2; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.9 * Math.sin(k / 0.4 * Math.PI); ctx.beginPath(); ctx.arc(x + tam * Math.cos(a) / d, y + tam * Math.sin(a) * Math.cos(a) / d, tam * 0.2, 0, 7); ctx.fill(); } }
    ctx.restore();
  }
  function estrelinha(ctx, x, y, tam, a, cor, cruz) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = cor; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4 - Math.PI / 2, rd = i % 2 ? tam * 0.3 : tam; ctx.lineTo(x + Math.cos(ang) * rd, y + Math.sin(ang) * rd); }
    ctx.closePath(); ctx.fill();
    if (cruz) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.6; ctx.strokeStyle = cor; ctx.lineWidth = tam * 0.16; ctx.beginPath(); ctx.moveTo(x - tam * 2.2, y); ctx.lineTo(x + tam * 2.2, y); ctx.moveTo(x, y - tam * 2.2); ctx.lineTo(x, y + tam * 2.2); ctx.stroke(); }
    ctx.restore();
  }
  const MARCA = {
    // 👕 Camisa do Multiverso: estrelinhas que piscam na estampa de galáxia (mais estrelas e mais brilho com o refino)
    camisa_multiverso(ctx, B, vista, e, r, t) {
      if (!B.E) return; const P = pontosCamisa(B.c, B.E); if (!P.length) return;
      const h = B.h, n = r >= 10 ? 7 : r >= 9 ? 6 : r >= 8 ? 5 : r >= 7 ? 4 : 3;
      for (let i = 0; i < Math.min(n, P.length); i++) {
        const [px, py] = P[i], per = 1600 + i * 370, k = ((t + i * 911) % per) / per; if (k > 0.5) continue; // cada uma pisca no seu tempo
        const a = Math.sin(k / 0.5 * Math.PI), tam = h * (r >= 9 ? 0.026 : 0.02) * (0.6 + 0.4 * a);
        estrelinha(ctx, B.X(px), B.Y(py), tam * (B.desp ? 1.2 : 1), a * (r >= 8 ? 1 : 0.85), B.desp ? (i % 2 ? '#ffd23f' : '#fff2a8') : r >= 8 && i % 2 ? '#fff2a8' : '#ffffff', r >= 9); // desperta: estrelas douradas
      }
    },
    // 🦵 Caneleiras do Infinito: um ∞ azul-gelo em cada canela; no +7 em diante uma luz percorre o ∞, no +9/+10 ele brilha
    caneleira_infinito(ctx, B, vista, e, r, t) {
      if (!B.E) return; const C = canelas(B.c, B.E, vista === 'lado'); if (!C.seg.length) return;
      const Y = B.Y(C.y), tam = B.h * 0.032;
      const pernas = vista === 'lado' ? C.seg.slice(0, 2) : [C.seg[0], C.seg[C.seg.length - 1]].filter((v, i, a) => i === 0 || v !== a[0]);
      pernas.forEach(([a, b], i) => infinito(ctx, B.X((a + b) / 2), Y, tam * (B.desp ? 1.15 : 1), r, t, i * 1.7, B.desp)); // desperta: ∞ dourado
    },
    // 👟 Chuteiras dos Deuses: asinhas nos calcanhares (como as sandálias aladas). Parado batem devagar; correndo, rápido.
    chuteira_deuses(ctx, B, vista, e, r, t) {
      if (!B.E) return; const P = pes(B.c, B.E); if (!P.seg.length) return;
      const h = B.h, X = B.X, Y = B.Y(P.y), tam = h * (0.1 + Math.min(10, r) * 0.003) * (B.desp ? 1.3 : 1); // desperta: asas maiores
      const bate = 0.5 + 0.5 * Math.sin(t / (e.mov ? 70 : 260));
      if (vista === 'lado') { // de lado: uma asa atrás de cada calcanhar (o boneco olha para a direita no desenho)
        for (const [a] of P.seg.slice(0, 2)) asinha(ctx, X(a) + tam * 0.1, Y, tam, -1, bate, r, t);
      } else { // de frente/costas: uma asa para fora de cada pé
        const L = P.seg[0], R = P.seg[P.seg.length - 1];
        asinha(ctx, X(L[0]) + tam * 0.08, Y, tam, -1, bate, r, t); asinha(ctx, X(R[1]) - tam * 0.08, Y, tam, 1, bate, r, t);
      }
    },
    // 🩳 Calção Cósmico: um anel fino de poeira de estrelas girando na cintura (a metade de trás passa por trás do corpo)
    calcao_cosmico(ctx, B, vista, e, r, t) { anelCosmico(ctx, B, vista, r, t, true); if (B.desp) anelCosmico(ctx, B, vista, r, t + 5000, true, true); },
    // 🏅 Amuleto da Lenda Suprema: a medalha solta raios curtos de luz, girando devagar
    amuleto_lenda(ctx, B, vista, e, r, t) {
      if (vista === 'costas') return; // de costas o pingente não aparece (só o cordão na nuca)
      const M = pecaDif(B.c, B.semPescoco); if (!M) return;
      const cx = B.X(M.x), cy = B.Y(M.y), n = Math.min(10, 6 + Math.floor(r / 2.5)) + (B.desp ? 2 : 0), L0 = B.h * (0.03 + Math.min(10, r) * 0.0016) * (B.desp ? 1.4 : 1), giro = t / 2600, forte = r >= 9 ? 1 : r >= 7 ? 0.75 : 0.55;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const ang = giro + i * Math.PI * 2 / n, pul = 0.5 + 0.5 * Math.sin(t / 340 + i * 1.3), L = L0 * (0.75 + 0.45 * pul), a0 = B.h * 0.012;
        const g = ctx.createLinearGradient(cx + Math.cos(ang) * a0, cy + Math.sin(ang) * a0, cx + Math.cos(ang) * (a0 + L), cy + Math.sin(ang) * (a0 + L));
        g.addColorStop(0, `rgba(255,236,150,${0.75 * forte})`); g.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.strokeStyle = g; ctx.lineWidth = Math.max(1, B.h * (i % 2 ? 0.006 : 0.009)); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * a0, cy + Math.sin(ang) * a0); ctx.lineTo(cx + Math.cos(ang) * (a0 + L), cy + Math.sin(ang) * (a0 + L)); ctx.stroke();
      }
      if (B.desp) { const k = 0.5 + 0.5 * Math.sin(t / 420); ctx.strokeStyle = `rgba(255,215,90,${0.45 + 0.35 * k})`; ctx.lineWidth = Math.max(1, B.h * 0.006); ctx.beginPath(); ctx.arc(cx, cy, B.h * (0.034 + 0.004 * k), 0, 7); ctx.stroke(); } // desperta: anel dourado
      if (r >= 7) { const k = 0.5 + 0.5 * Math.sin(t / 300), gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, B.h * 0.03); gg.addColorStop(0, `rgba(255,245,200,${(r >= 10 ? 0.7 : 0.45) * (0.6 + 0.4 * k)})`); gg.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, B.h * 0.03, 0, 7); ctx.fill(); }
      ctx.restore();
    },
    // 👑 Coroa Eterna: as joias da coroa cintilam (mais joias e mais brilho com o refino)
    coroa_eterna(ctx, B, vista, e, r, t) {
      const J = joiasCoroa(B.cComChapeu, B.cSemChapeu, B.dHc); if (!J.length) return;
      if (B.desp) { // desperta: uma estrela dourada flutuando acima da coroa
        const k = 0.5 + 0.5 * Math.sin(t / 500), topo = J.topo != null ? J.topo : Math.min(...J.map(q => q[1])), x0 = J.topoX != null ? J.topoX : J.reduce((a, q) => a + q[0], 0) / J.length;
        estrelinha(ctx, B.X(x0), B.Y0(topo) - B.h * (0.045 + 0.012 * k), B.h * (0.03 + 0.006 * k), 0.85 + 0.15 * k, '#ffd23f', true);
      }
      const n = Math.min(J.length, r >= 10 ? 6 : r >= 8 ? 5 : r >= 7 ? 4 : 3);
      for (let i = 0; i < n; i++) {
        const per = 1500 + i * 410, k = ((t + i * 733) % per) / per; if (k > 0.45) continue;
        const a = Math.sin(k / 0.45 * Math.PI), tam = B.h * (r >= 9 ? 0.024 : 0.018) * (0.6 + 0.4 * a);
        estrelinha(ctx, B.X(J[i][0]), B.Y0(J[i][1]), tam, a, i % 2 ? '#fff2a8' : '#ffffff', r >= 9);
      }
    },
  };
  const MARCA_ATRAS = { calcao_cosmico(ctx, B, vista, e, r, t) { anelCosmico(ctx, B, vista, r, t, false); if (B.desp) anelCosmico(ctx, B, vista, r, t + 5000, false, true); } };
  function anelCosmico(ctx, B, vista, r, t, frente, segundo) { // segundo: o anel extra da relíquia desperta (inclinado, dourado)
    const E = B.E; if (!E) return; // a cintura: logo abaixo de onde as mãos encostam; a largura: o calção, no quadro atual
    const yc = Math.round(E.cintura + E.H * 0.03), C = linhas(B.c).centro(yc) || { x0: E.cintX - E.cintW / 2, x1: E.cintX + E.cintW / 2 }, larg = Math.min(C.x1 - C.x0, E.cintW * 1.15);
    const cx = B.X((C.x0 + C.x1) / 2), cy = B.Y(E.cintura + E.H * 0.012), rx = (B.X(larg) - B.X(0)) / 2 * (vista === 'lado' ? 1.7 : 1.55), ry = rx * (vista === 'lado' ? 0.34 : 0.25);
    const n = Math.min(18, 10 + r), vel = (r >= 9 ? 1.35 : 1) * (segundo ? -0.8 : 1), CORES = segundo ? ['#ffd23f', '#fff2a8', '#ffffff', '#ffb84a'] : ['#b48cff', '#5ac8ff', '#ffffff', '#ff8ad8'];
    ctx.save(); if (segundo) { ctx.translate(cx, cy); ctx.rotate(-0.28); ctx.translate(-cx, -cy - B.h * 0.012); }
    { // a faixa fina do anel (só a metade certa); fica mais forte com o refino
      ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = segundo ? 'rgba(255,200,70,0.5)' : `rgba(170,120,255,${r >= 10 ? 0.5 : r >= 8 ? 0.38 : 0.26})`; ctx.lineWidth = Math.max(1, B.h * 0.006);
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, frente ? 0 : Math.PI, frente ? Math.PI : Math.PI * 2); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) {
      const th = t / 1150 * vel + i * Math.PI * 2 / n + Math.sin(i * 7.3) * 0.25, sn = Math.sin(th);
      if ((sn > 0) !== frente) continue; // metade da frente (embaixo na tela) ou de trás
      const tw = 0.6 + 0.4 * Math.sin(t / 210 + i * 2.1), rr = B.h * (0.008 + (i % 3 === 0 ? 0.005 : 0)) * (0.75 + 0.25 * tw) * (r >= 10 ? 1.2 : 1);
      ctx.globalAlpha = (frente ? 1 : 0.75) * (r >= 7 ? 1 : 0.85) * tw; ctx.fillStyle = CORES[i % CORES.length];
      const x = cx + Math.cos(th) * rx, y = cy + sn * ry;
      if (r >= 7) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= r >= 10 ? 0.4 : 0.28; ctx.beginPath(); ctx.arc(x, y, rr * 1.7, 0, 7); ctx.fill(); ctx.restore(); }
      if (i % 3 === 0) { ctx.beginPath(); for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4, d = j % 2 ? rr * 0.38 : rr * 1.6; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } ctx.closePath(); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); }
    }
    ctx.restore();
  }
  // onde está a peça: os pixels que mudam entre o desenho COM e SEM ela (o pingente é a parte de baixo) — por canvas
  const DIF = new WeakMap();
  function pecaDif(cCom, cSem) {
    if (!cSem) return null; let r = DIF.get(cCom); if (r !== undefined) return r; r = null;
    try {
      if (cCom.width === cSem.width && cCom.height === cSem.height) {
        const W = cCom.width, H = cCom.height, a = cCom.getContext('2d').getImageData(0, 0, W, H).data, b = cSem.getContext('2d').getImageData(0, 0, W, H).data, pts = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (a[i + 3] > 150 && (b[i + 3] < 60 || Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 90)) pts.push([x, y]); }
        if (pts.length >= 25) {
          let y0 = H, y1 = 0; for (const q of pts) { if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }
          const corte = y1 - (y1 - y0) * 0.45, baixo = pts.filter(q => q[1] >= corte);
          r = { x: baixo.reduce((s, q) => s + q[0], 0) / baixo.length, y: baixo.reduce((s, q) => s + q[1], 0) / baixo.length };
        }
      }
    } catch (e) { }
    DIF.set(cCom, r); return r;
  }
  // as joias da coroa: pixels coloridos (não dourados) que só existem no desenho COM a coroa — agrupados em pontos
  const JOIAS = new WeakMap();
  function joiasCoroa(cCom, cSem, dH) {
    if (!cCom || !cSem) return []; let r = JOIAS.get(cCom); if (r) return r; r = [];
    try {
      const W = cCom.width, H = cCom.height, a = cCom.getContext('2d').getImageData(0, 0, W, H).data, b = cSem.getContext('2d').getImageData(0, 0, cSem.width, cSem.height).data;
      const coroa = [], joia = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4; if (a[i + 3] < 150) continue;
        const yb = y - dH, j = (yb * cSem.width + x) * 4, igual = yb >= 0 && yb < cSem.height && b[j + 3] > 150 && Math.abs(a[i] - b[j]) + Math.abs(a[i + 1] - b[j + 1]) + Math.abs(a[i + 2] - b[j + 2]) < 60;
        if (igual) continue; coroa.push([x, y]);
        const R = a[i] / 255, G2 = a[i + 1] / 255, Bb = a[i + 2] / 255, mx = Math.max(R, G2, Bb), mn = Math.min(R, G2, Bb), sat = mx ? (mx - mn) / mx : 0;
        let hue = 0; if (mx !== mn) { hue = mx === R ? ((G2 - Bb) / (mx - mn)) % 6 : mx === G2 ? (Bb - R) / (mx - mn) + 2 : (R - G2) / (mx - mn) + 4; hue = (hue * 60 + 360) % 360; }
        if (sat > 0.45 && mx > 0.35 && (hue < 22 || hue > 290 || (hue > 95 && hue < 270))) joia.push([x, y]); // vermelho, verde, azul, roxo (não o dourado)
      }
      const fonte = joia.length >= 12 ? joia : coroa, grade = {};
      for (const [x, y] of fonte) { const k = ((x / 9) | 0) + ',' + ((y / 9) | 0); (grade[k] = grade[k] || []).push([x, y]); }
      r = Object.values(grade).filter(g => g.length >= (fonte === joia ? 4 : 10)).sort((p, q) => q.length - p.length).slice(0, 6).map(g => [g.reduce((s, p) => s + p[0], 0) / g.length, g.reduce((s, p) => s + p[1], 0) / g.length]);
      if (fonte === coroa && r.length) { let topo = H, fundo = 0; for (const q of coroa) { if (q[1] < topo) topo = q[1]; if (q[1] > fundo) fundo = q[1]; } r = r.filter(q => q[1] < topo + (fundo - topo) * 0.6); } // sem joia: as pontas de cima
      window.brilhoRefino.joiasInfo = { joias: joia.length, coroa: coroa.length, fonte: fonte === joia ? 'joias' : 'coroa' };
      { let tp = H, sx = 0, n = 0; for (const q of coroa) if (q[1] < tp) tp = q[1]; for (const q of coroa) if (q[1] < tp + 12) { sx += q[0]; n++; } r.topo = tp; r.topoX = n ? sx / n : W / 2; } // o alto da coroa (para a estrela da desperta)
    } catch (e) { }
    JOIAS.set(cCom, r); return r;
  }
  window.brilhoRefino.MARCA = MARCA; window.brilhoRefino.medidas = { esqueleto, canelas, pes, pontosCamisa, linhas, corpo, caixa }; // (testes)
  function desenhaBrilho(ctx, e, atras) {
    const s = G.save, pecas = refinos(), mrc = marcas(), completo = SLOTS.every(sl => s.equip[sl] && ((s.equipR && s.equipR[sl]) || 0) >= 10);
    if (!pecas.length && !mrc.length && !completo) return;
    if (typeof montadoAgora === 'function' && montadoAgora()) return; // montado: o desenho é outro
    const look = lookJogador(); let vista = e.vista || 'frente';
    if (!e.mov && G.agora - (e.tVista || 0) > 2500) vista = 'frente';
    if (e.golpe && G.agora - e.golpe < 450) vista = 'lado';
    const quadro = e.mov ? Math.floor((e.fase || 0) / (Math.PI / 2)) % 4 : 0;
    const comp0 = typeof spriteBoneco === 'function' ? spriteBoneco(look, vista, quadro) : null; if (!comp0 || !comp0.c) return;
    // a máscara do brilho é o boneco SEM o item de costas (asas/capa ocupam a largura toda e o brilho virava uma "caixa")
    let comp = comp0; try { if (look.costas) { const c2 = spriteBoneco(Object.assign({}, look, { costas: null }), vista, quadro); if (c2 && c2.c && c2.c.width === comp0.c.width && c2.c.height === comp0.c.height) comp = c2; } } catch (err) { }
    // a mesma conta do desenho do boneco (game.js desenhaEnt)
    const x = e.x * T, y = e.y * T, alt = alturaEnt(e) * T, h = alt, w = h * comp.c.width / comp.c.height;
    const hit = e.hitT && G.agora - e.hitT < 180 ? Math.sin((G.agora - e.hitT) / 18) * 4 : 0;
    const golpe = e.golpe && G.agora - e.golpe < 220 ? Math.sin((G.agora - e.golpe) / 220 * Math.PI) : 0;
    const dir = e.flip ? -1 : 1, lado = e.mov && vista === 'lado', passo = Math.abs(Math.sin(e.fase)), bob = e.mov ? passo * h * 0.03 : 0;
    const rot = lado ? dir * 0.04 : e.mov ? Math.sin(e.fase) * 0.035 : 0, sy = e.mov ? 1 - (1 - passo) * 0.02 : 1 + Math.sin(G.agora / 450 + (e.uid || 0)) * 0.012;
    let dy = 0; try { if (typeof ADORNOS2 !== 'undefined' && ADORNOS2.atual('extra').includes('prancha') && !(G.mapa && G.mapa.interior)) dy = -T * 0.16 + Math.sin(G.agora / 350) * 1.5; } catch (err) { }
    const t = G.agora || 0;
    ctx.save(); ctx.translate(x + hit + dir * golpe * 7, y - bob + dy); ctx.rotate(rot + dir * golpe * 0.12); ctx.scale(dir, sy);
    // aura do conjunto completo: contorno dourado do boneco inteiro, por trás
    if (completo && atras) {
      const k = 0.5 + 0.5 * Math.sin(t / 380); camada({ c: corpo(comp.c) }, '#ffd23f', 0, null);
      ctx.globalAlpha = 0.45 + 0.3 * k; for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2]]) poeOff(ctx, w, h, ox, oy);
    }
    const MS = pecas.length ? mascaras(comp0, comp, look, vista, quadro) : null; // v413: a forma de cada peça (não mais uma faixa reta)
    if (pecas.length && !MS) preparaDepois(vista); // (ainda medindo esta pose: mede nas folgas)
    for (const p of pecas) {
      const M = MS && MS[p.sl]; if (!M) continue;
      const cor = corDe(p.id), fase = SLOTS.indexOf(p.sl) * 0.9;
      // força do efeito por refino: halo (por trás), tom (por cima), luz que passa (por cima)
      let halo = 0, tom = 0, luz = null;
      if (p.r === 7) { const ciclo = ((t / 1000 + fase) % 3.2) / 3.2; if (ciclo < 0.35) luz = ciclo / 0.35; else continue; }
      else if (p.r === 8) { tom = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(t / 600 + fase)); halo = 0.5; const ciclo = ((t / 1000 + fase) % 2.6) / 2.6; if (ciclo < 0.3) luz = ciclo / 0.3; }
      else if (p.r === 9) { tom = 0.2 + 0.12 * (0.5 + 0.5 * Math.sin(t / 420 + fase)); halo = 0.8 + 0.2 * Math.sin(t / 420 + fase); const ciclo = ((t / 1000 + fase) % 2) / 2; if (ciclo < 0.3) luz = ciclo / 0.3; }
      else { tom = 0.26 + 0.16 * (0.5 + 0.5 * Math.sin(t / 300 + fase)); halo = 1; luz = ((t / 1000 + fase) % 1.3) / 1.3; }
      if (atras) {
        if (!halo) continue;
        camada(M, cor, 0, null); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, halo);
        const d = (p.r >= 10 ? 4 : p.r === 9 ? 3 : 2) * (1 + 0.15 * Math.sin(t / 260 + fase)); for (let a = 0; a < 8; a++) poeOff(ctx, w, h, Math.cos(a * Math.PI / 4) * d, Math.sin(a * Math.PI / 4) * d);
        if (p.r >= 10) { ctx.globalAlpha = 0.45; const d2 = d * 1.8; for (let a = 0; a < 8; a++) poeOff(ctx, w, h, Math.cos(a * Math.PI / 4 + 0.4) * d2, Math.sin(a * Math.PI / 4 + 0.4) * d2); }
        continue;
      }
      if (tom) { camada(M, cor, 0, null); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = tom; poeOff(ctx, w, h, 0, 0); }
      if (luz != null) camada(M, null, 0, luz);
      if (luz != null) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = p.r >= 10 ? 0.8 : p.r === 9 ? 0.65 : 0.5; poeOff(ctx, w, h, 0, 0); }
      // faíscas (+9 e +10) saindo da faixa da peça
      if (p.r >= 9 && Math.random() < (p.r >= 10 ? 0.45 : 0.2)) {
        const fy = (M.ya + (M.yb - M.ya) * Math.random()) / comp.c.height; // na altura da peça
        FAISCAS.push({ x: e.x * T + dir * (Math.random() - 0.5) * w * 0.55, y: e.y * T - h + fy * h + dy, vy: -(0.25 + Math.random() * 0.5), t0: t, dur: 700 + Math.random() * 500, cor, r: p.r >= 10 ? 2.8 : 2 });
      }
      if (p.sl === 'chuteira' && p.r >= 10 && e.mov && Math.random() < 0.6) FAISCAS.push({ x: e.x * T + (Math.random() - 0.5) * 8, y: e.y * T - 3, vy: -0.05, t0: t, dur: 600, cor, r: 3 });
    }
    // as marcas das relíquias (por cima do boneco)
    if (mrc.length && (!atras || mrc.some(p => MARCA_ATRAS[p.id]))) {
      // as marcas medem o CORPO sem chapéu (o chapéu/capacete aumenta o desenho para cima e mudaria as alturas); o corpo
      // fica sempre preso pelos pés, então a linha py do corpo-base é a linha py + (diferença de altura) do desenho
      // corpo-base SEM chapéu e SEM cabelo (os dois aumentam o desenho para cima); para a coroa, a base COM cabelo
      const lkBase = Object.assign({}, look, { costas: null, chapeu: null, chapeuVar: null, cabelo: null }), lkCab = Object.assign({}, look, { costas: null, chapeu: null, chapeuVar: null });
      let cb = comp, cc = comp; try { const c3 = spriteBoneco(lkBase, vista, quadro); if (c3 && c3.c && c3.c.width === comp0.c.width) cb = c3; } catch (err) { }
      if (mrc.some(p => p.id === 'coroa_eterna')) { try { const c5 = spriteBoneco(lkCab, vista, quadro); if (c5 && c5.c && c5.c.width === comp0.c.width) cc = c5; } catch (err) { } }
      let ref = cb.c; try { const c6 = spriteBoneco(lkBase, 'frente', 0); if (c6 && c6.c && c6.c.height === cb.c.height) ref = c6.c; } catch (err) { }
      const dH = comp0.c.height - cb.c.height, B = { E: esqueleto(ref), c: cb.c, cComChapeu: comp.c, cSemChapeu: cc.c, dHc: comp0.c.height - cc.c.height, dH, h, X: px => -w / 2 + px * w / comp0.c.width, Y: py => -h + (py + dH) * h / comp0.c.height, Y0: py => -h + py * h / comp0.c.height };
      if (mrc.some(p => p.id === 'amuleto_lenda')) { try { const c4 = spriteBoneco(Object.assign({}, lkBase, { pescoco: null, pescocoVar: null }), vista, quadro); B.semPescoco = c4 && c4.c; } catch (err) { } }
      const tabela = atras ? MARCA_ATRAS : MARCA;
      for (const p of mrc) { if (!tabela[p.id]) continue; ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; const D = typeof despDesperta === 'function' && despDesperta(p.id); B.desp = D; try { tabela[p.id](ctx, B, vista, e, D ? Math.max(p.r, 10) : p.r, t); } catch (err) { if (!window._marcaErr) { window._marcaErr = err; console.warn('marca', p.id, err); } } }
    }
    ctx.restore();
    if (atras) return;
    // faíscas
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = FAISCAS.length - 1; i >= 0; i--) {
      const f = FAISCAS[i], k = (t - f.t0) / f.dur; if (k >= 1 || k < 0) { FAISCAS.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - k; ctx.fillStyle = f.cor; ctx.beginPath(); ctx.arc(f.x, f.y + f.vy * (t - f.t0) * 0.06, f.r * (1 - k * 0.5), 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = (1 - k) * 0.7; ctx.beginPath(); ctx.arc(f.x, f.y + f.vy * (t - f.t0) * 0.06, f.r * 0.45, 0, 7); ctx.fill();
    }
    if (FAISCAS.length > 160) FAISCAS.splice(0, FAISCAS.length - 160);
    // conjunto completo: brilho dourado no chão
    if (completo) { const k = 0.5 + 0.5 * Math.sin(t / 380), g = ctx.createRadialGradient(x, y, 2, x, y, T * 0.75); g.addColorStop(0, `rgba(255,215,80,${0.35 + 0.2 * k})`); g.addColorStop(1, 'rgba(255,215,80,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, T * 0.75, T * 0.3, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  const _entBr = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    const meu = e === G.p && G.save && !G.p.morto && !G.fut && !G.jogoC;
    if (meu) { try { desenhaBrilho(ctx, e, true); } catch (err) { if (!window._brErr) { window._brErr = err; console.warn('upgrade glow', err); } } }
    const r = _entBr.apply(this, arguments);
    if (meu) { try { desenhaBrilho(ctx, e, false); } catch (err) { if (!window._brErr) { window._brErr = err; console.warn('upgrade glow', err); } } }
    return r;
  };
  // a Ficha e a dica do item contam o efeito
  if (typeof statsItemTxt === 'function') {
    const _sit = statsItemTxt;
    statsItemTxt = function (id, r) { const t = _sit.apply(this, arguments); if (!r || r < 7 || !ITENS[id] || ITENS[id].tipo !== 'equip' || ehReliquia(id)) return t; const efeito = r >= 10 ? '✨ +10: the piece LIGHTS UP on your character!' : r === 9 ? '✨ +9: strong glow and sparks on your character' : r === 8 ? '✨ +8: the piece shines on your character' : '✨ +7: a flash of light sweeps across the piece'; return Array.isArray(t) ? [...t, efeito] : typeof t === 'string' ? t + ' · ' + efeito : t; };
  }
}
