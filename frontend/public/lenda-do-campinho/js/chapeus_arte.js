/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎩 CHAPÉUS DE VERDADE (v307): os 33 itens de cabeça eram 9 desenhos simples repetidos (as 9 coroas
   eram iguais, o Elmo do Cavaleiro Negro virava um gorro...). Agora cada um tem a sua arte do Higgsfield
   em 3 vistas — de frente, de lado e de costas (a/ch_<item>_f|l|c.webp) — encaixada na cabeça pelo tipo
   (boné, faixa, fone, coroa, chapéu de aba, gorro, cartola, capacete, máscara...).
   Carregar DEPOIS de pescoco_arte.js.
   ============================================================ */
{
  // tipo: [largura (unidades do boneco; a cabeça tem 48), onde fica a base do desenho]
  const CAB = { cx: 50, cy: 52, ry: 22.5 }, TOPO = CAB.cy - CAB.ry;
  const TIPO = {
    bone: [53, TOPO + 21], faixa: [50, TOPO + 24], fone: [60, CAB.cy + 13], louros: [54, TOPO + 27], coroa: [40, TOPO + 8], tiara: [50, TOPO + 17],
    aba: [62, TOPO + 22], gorro: [52, TOPO + 20], cartola: [58, TOPO + 15], tricorne: [58, TOPO + 20], nemes: [64, CAB.cy + 26], mascara: [62, CAB.cy + 30], elmo: [57, CAB.cy + CAB.ry + 6],
  };
  const CHAPEU = {
    bone: 'bone', bone_maraca: 'bone', bone_cacador: 'bone', bone_maquinista: 'bone',
    faixa_suor: 'faixa', faixa_capitao: 'faixa', faixa_saibro: 'faixa', faixa_trovao: 'faixa', faixa_ronin: 'faixa',
    headset: 'fone', headset_neon: 'fone', headset_classico: 'fone',
    louros: 'louros', louros_rei: 'louros', coroa: 'coroa', coroa_imortal: 'coroa', coroa_dragao: 'coroa', coroa_galactica: 'coroa', coroa_estelar: 'tiara',
    chapeu_dunas: 'aba', panama_miami: 'aba', chapeu_tejo: 'aba', panama_milao: 'aba', gorro_tango: 'gorro', gorro_alpes: 'gorro',
    cartola_londres: 'cartola', chapeu_capitao: 'tricorne', nemes_dourado: 'nemes', faixa_farao: 'nemes', mascara_farao: 'mascara',
    elmo_negro: 'elmo', capacete_dragao: 'elmo', capacete_estelar: 'elmo',
  };
  // v310: artes refeitas com o mesmo nome (o navegador guardava a antiga): nemes/faixa do faraó fechados atrás, dragão com o rosto aberto
  if (typeof ASSET_VER !== 'undefined') Object.assign(ASSET_VER, { ch_nemes_dourado_c: 310, ch_faixa_farao_c: 310, ch_capacete_dragao_f: 310, ch_capacete_dragao_l: 310 });
  const ALTO = new Set(['faixa', 'tricorne', 'elmo', 'mascara', 'nemes', 'fone', 'aba', 'louros']);
  let faltou = false;
  setInterval(() => { if (faltou) { faltou = false; try { SPR_CACHE.clear(); } catch (e) { } } }, 800);

  const _lookCh = lookJogador;
  lookJogador = function () {
    const L = _lookCh.apply(this, arguments);
    try {
      const id = G.save && G.save.equip && G.save.equip.cabeca;
      if (L && !L.folha && id && CHAPEU[id] && L.chapeu) {
        L.chapeuVar = id; if (ALTO.has(CHAPEU[id])) L.chapeu = 'chapeu-cartola'; // o recorte do boneco reserva o espaço de um chapéu alto (senão cortava a pluma/as pontas)
        delete L._kb;
      }
    } catch (e) { }
    return L;
  };
  const _specCh = specDe;
  specDe = function (look) { const sp = _specCh.apply(this, arguments); if (look && look.chapeuVar) sp.chapeuVar = look.chapeuVar; return sp; };

  // v311: ajuste fino por item (largura, base e deslocamento), medido com todos os penteados
  const AJ = { capacete_mergulho: { larg: 76, base: CAB.cy + CAB.ry + 22, dx: 4.5, dxl: -15 }, capacete_astro: { larg: 62, base: CAB.cy + CAB.ry + 15 }, elmo_negro: { dx: 4 } };
  const COBRE_TUDO = new Set(['mascara', 'elmo', 'nemes']); // cobrem a cabeça inteira: o cabelo de fora some (abaixo)
  // onde o chapéu fica (unidades da cabeça) e de que parte da arte
  function geometria(id, vis) {
    const tipo = CHAPEU[id]; if (!tipo) return null;
    const fr = aSprite('ch_' + id + '_f'), im = vis === 'f' ? fr : aSprite('ch_' + id + '_' + vis); if (!fr || !im) return null;
    const aj = AJ[id] || {}, [larg0, base0] = TIPO[tipo], larg = aj.larg || larg0, base = aj.base || base0, s = larg / fr.width;
    // v311: o que cobre a cabeça toda é medido pela "cabeça virtual" (abaixo), igual para qualquer penteado
    const cobre = COBRE_TUDO.has(tipo), k = 1;
    const w = im.width * s * k, cx = CAB.cx + (aj.dx || 0) + (vis === 'l' ? (cobre ? (aj.dxl || 0) : 1.5) : 0);
    const corte = tipo !== 'faixa' ? 0 : id === 'faixa_trovao' ? 0.18 : 0.48; // faixa: a arte é o anel inteiro; na cabeça só aparece a frente dele
    const sy = im.height * corte, sh = im.height - sy, h = sh * s * k;
    return { im, sy, sh, x0: cx - w / 2, y0: base - h, w, h, tipo };
  }
  let CORTE = null; // (cabeça da célula sendo desenhada, para os capacetes fechados)
  const _chapeuVetor = chapeu;
  chapeu = function (x, sp, v) {
    const id = sp && sp.chapeuVar, tipo = id && CHAPEU[id];
    if (!tipo) return _chapeuVetor.apply(this, arguments);
    const vis = v === 'l' ? 'l' : v === 'c' ? 'c' : 'f', g = geometria(id, vis);
    if (!g) { faltou = true; return _chapeuVetor.apply(this, arguments); } // enquanto a arte chega: o desenho de antes
    x.save(); x.imageSmoothingQuality = 'high';
    if (COBRE_TUDO.has(tipo) && CORTE && CORTE.V) { // sai da caixa da cabeça (que cresce com o cabelo) e vai para a cabeça virtual
      const cab = CORTE.cab, kc = (cab[2] - cab[0]) / 54, cxc = (cab[0] + cab[2]) / 2 + (v === 'l' ? -2 * kc : 0), V = CORTE.V;
      x.translate(50, 27); x.scale(1 / kc, 1 / kc); x.translate(-cxc, -cab[1]);
      x.translate(V.cx, V.y0); x.scale(V.k, V.k); x.translate(-50, -27);
    }
    x.drawImage(g.im, 0, g.sy, g.im.width, g.sh, g.x0, g.y0, g.w, g.h); x.restore();
  };
  // a cabeça "de verdade" (sem o volume do cabelo): pelo tronco, que não muda com o penteado
  // (de costas o cabelo comprido cobre o tronco e engana a medida: usa a medida da vista de frente)
  function cabecaVirtual(meta, v, metaFrente) {
    const tr = (v === 'c' && metaFrente && metaFrente.tronco) || (meta && meta.tronco); if (!tr) return null;
    const k = (tr[2] - tr[0]) * (v === 'l' ? 2.55 : 1.53) / 54;
    return { k, cx: (tr[0] + tr[2]) / 2 + (v === 'l' ? 2 : 0), y0: tr[1] - 52 * k };
  }
  /* ---------- v311: capacete fechado não deixa cabelo escapar ----------
     Com o elmo, a máscara, o nemes e os capacetes de viagem, o cabelo grande (black power, rabo de cavalo,
     liso longo) aparecia em volta. Antes de pôr o capacete, o cabelo (e o contorno dele) que fica FORA da
     forma do capacete é apagado; o de dentro continua (nos capacetes de vidro ele aparece lá dentro). */
  const _sprCorte = spriteBoneco;
  spriteBoneco = function (look, vista = 'frente', q = 0) {
    const id = look && look.chapeuVar, tipo = id && CHAPEU[id];
    if (!tipo || !COBRE_TUDO.has(tipo)) return _sprCorte.apply(this, arguments);
    try {
      const sp = specDe(look), nome = folhaDoLook(sp, look), v = vista === 'costas' ? 'c' : vista === 'lado' ? 'l' : 'f';
      const meta = (META_BONECOS[nome] || [])[(v === 'f' ? 0 : v === 'l' ? 1 : 2) * 4 + (q % 4)], g = geometria(id, v);
      if (meta && meta.cabeca && g) CORTE = { cab: meta.cabeca, v, g, V: cabecaVirtual(meta, v, (META_BONECOS[nome] || [])[q % 4]) };
      return _sprCorte.apply(this, arguments);
    } finally { CORTE = null; }
  };
  const _tingeCorte = tingeCelula;
  tingeCelula = function (base, cores) {
    const out = _tingeCorte.apply(this, arguments);
    if (!CORTE || !base || !base.rot) return out;
    try { cortaCabelo(out, base, CORTE); } catch (e) { }
    return out;
  };
  const ALFA = new WeakMap(); // canal alfa de cada arte (para saber o que o capacete cobre)
  function alfaDe(im) {
    let A = ALFA.get(im); if (A) return A;
    const c = mkCanvas(im.width, im.height), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    const W = im.width, H = im.height, dd = x.getImageData(0, 0, W, H).data; A = new Uint8Array(W * H);
    // dentro do contorno conta como coberto (vidro do capacete, abertura do rosto): enche cada linha entre a 1ª e a última parte opaca
    for (let y = 0; y < H; y++) {
      let a = -1, b = -1; for (let xx = 0; xx < W; xx++) if (dd[(y * W + xx) * 4 + 3] >= 10) { if (a < 0) a = xx; b = xx; }
      if (a >= 0) for (let xx = a; xx <= b; xx++) A[y * W + xx] = 255;
    }
    ALFA.set(im, A); return A;
  }
  function cortaCabelo(out, base, C) {
    const { rot, d } = base, W = FOLHA_CW, H = FOLHA_CH, V = C.V; if (!V) return;
    // a forma do capacete = a própria arte: fica só o cabelo que a arte cobre (o vidro conta: o cabelo aparece lá dentro)
    const g = C.g, k = V.k, A = alfaDe(g.im); if (!A) return;
    const fora = (x, y) => {
      const u = (x - V.cx) / k + 50, v = (y - V.y0) / k + 27;
      const ix = Math.floor((u - g.x0) / g.w * g.im.width), iy = Math.floor(g.sy + (v - g.y0) / g.h * g.sh);
      if (ix < 0 || iy < 0 || ix >= g.im.width || iy >= g.im.height) return true;
      return A[iy * g.im.width + ix] < 10;
    };
    const x = out.getContext('2d'), img = x.getImageData(0, 0, W, H), o = img.data, apagou = new Uint8Array(W * H);
    for (let i = 0; i < rot.length; i++) if (rot[i] === 1 && fora(i % W, (i / W) | 0)) { o[i * 4 + 3] = 0; apagou[i] = 1; }
    // o contorno escuro do cabelo apagado (não tem a cor-chave): some também, se estiver fora do capacete
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < rot.length; i++) {
      if (apagou[i] || rot[i] || o[i * 4 + 3] < 20) continue; const px = i % W, py = (i / W) | 0; if (!fora(px, py)) continue;
      if (Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) > 110) continue;
      let viz = false; for (let dy = -2; dy <= 2 && !viz; dy++) for (let dx = -2; dx <= 2 && !viz; dx++) { const j = i + dy * W + dx; if (j >= 0 && j < apagou.length && apagou[j]) viz = true; }
      if (viz) { o[i * 4 + 3] = 0; apagou[i] = 1; }
    }
    x.putImageData(img, 0, 0);
  }
  window.CHAPEUS_ARTE = CHAPEU; // (para os testes)
}
