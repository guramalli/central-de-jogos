/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ✨ ITENS MAIS BONITOS NO BONECO (v296)
   1) ESTAMPA NA CAMISA: a camisa de futebol era pintada numa cor só. O boneco sabe exatamente quais pixels
      são a camisa (a cor-chave da folha), então a estampa é desenhada DENTRO dela, com a sombra de sempre:
      cada camisa ganha a do seu tema (Dracônica = chamas, Galáxia = galáxia, Abissal = ondas, Negra e Ouro =
      gola dourada...) na 2ª cor do item (antes ignorada); sem tema, a estampa vem da raridade.
   2) BRILHO POR RARIDADE (v298, refeito a pedido do dono): em vez de faíscas/aura, a SILHUETA da própria peça
      (camisa, calção, chuteira) ganha um contorno brilhando na cor da raridade dela, pulsando devagar:
      raro = azul, épico = roxo, lendário = dourado, mítico = rosa e ciano se alternando.
   A camisa do clube nas partidas da carreira e as fantasias (skins) continuam como são.
   Carregar NO FIM.
   ============================================================ */
{
  /* ---------- 1) estampa ---------- */
  const TEMAS = [
    [/lenda|negra/, 'negra_ouro'],
    [/campe|imortal|ouro|craque|\brei\b|lorde/, 'dourado'],
    [/dracon|fogo|lava|vulc|inferno|chama|flamen|dragao/, 'chamas'],
    [/galax|estel|cosm|nebul|lunar|marcian|orbit|espac|anel/, 'galaxia'],
    [/abiss|mare|coral|atlant|onda|ocean|surf|praia/, 'ondas'],
    [/sakura|flor|primav|tango/, 'petalas'],
    [/raio|trov|eletr|sonic|relamp/, 'raio'],
    [/tita|mundo|\bct\b|clube|copa|time|vila/, 'listras'],
  ];
  const POR_RARIDADE = { incomum: 'gola', raro: 'faixa', epico: 'raio', lendario: 'estrelas', mitico: 'galaxia' };
  const ESTAMPA_ITEM = { camisa_listrada: 'listras', camisa_galactica: 'galaxia' }; // escolhidas a dedo (o nome não diz o tema)
  function estampaDo(id) {
    const it = ITENS[id]; if (!it) return null; if (it.estampa !== undefined) return it.estampa;
    if (ESTAMPA_ITEM[id]) return ESTAMPA_ITEM[id];
    const txt = (id + ' ' + (it.nome || '')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (const [re, e] of TEMAS) if (re.test(txt)) return e;
    return POR_RARIDADE[typeof raridadeItem === 'function' ? raridadeItem(id) : 'comum'] || null;
  }
  // v296: os tecidos desenhados no Higgsfield (a/tex_*.webp); a estampa de código fica de reserva enquanto carregam
  const TECIDO = { negra_ouro: 'tex_negra_ouro', dourado: 'tex_dourado', chamas: 'tex_chamas', galaxia: 'tex_galaxia', ondas: 'tex_oceano', petalas: 'tex_sakura', raio: 'tex_raio', estrelas: 'tex_estrelas' };
  const RESERVA = { negra_ouro: 'gola', dourado: 'gola' };
  const TEX_PX = {};
  function pixelsTecido(tipo) {
    const nome = TECIDO[tipo]; if (!nome) return null; if (TEX_PX[nome]) return TEX_PX[nome];
    const im = typeof aSprite === 'function' ? aSprite(nome) : null; if (!im) return null;
    const c = mkCanvas(256, 256), x = c.getContext('2d'); x.drawImage(im, 0, 0, 256, 256);
    TEX_PX[nome] = x.getImageData(0, 0, 256, 256).data;
    try { if (typeof SPR_CACHE !== 'undefined') SPR_CACHE.clear(); } catch (e) { } // redesenha os bonecos com o tecido
    return TEX_PX[nome];
  }
  for (const n of Object.values(TECIDO)) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  setTimeout(() => { for (const n of Object.values(TECIDO)) try { spr(n); } catch (e) { } }, 1500); // já começa a carregar
  const escura = c => { const [r, g, b] = bRgb(c); return r * 0.3 + g * 0.59 + b * 0.11 < 110; };
  const _lookEst = lookJogador;
  lookJogador = function (retrato) {
    const L = _lookEst.apply(this, arguments);
    try {
      const s = G.save, id = s && s.equip && s.equip.camisa, it = id && ITENS[id];
      if (L && !L.folha && !G.jogoC && it && L.roupa === 'roupa-futebol' && id !== 'camisa_vila') {
        const e = estampaDo(id);
        if (e && !L.corRoupa) { if (!TECIDO[e]) return L; L.corRoupa = it.cor || '#22306a'; delete L._kb; } // camisa sem cor própria (ex.: das quests lendárias): o tecido dá a cor
        if (e && (L.estampa !== e || !L.cor2)) { L.estampa = e; L.cor2 = it.cor2 || (escura(L.corRoupa) ? '#e8b848' : '#ffffff'); delete L._kb; }
      }
    } catch (err) { }
    return L;
  };
  // o boneco é pintado célula a célula: durante a pintura do boneco com estampa, a camisa ganha o desenho
  let EST = null;
  const _sprEst = spriteBoneco;
  spriteBoneco = function (look, vista = 'frente', q = 0) {
    if (!look || !look.estampa) return _sprEst.apply(this, arguments);
    try {
      const sp = specDe(look), nome = folhaDoLook(sp, look), v = vista === 'costas' ? 'c' : vista === 'lado' ? 'l' : 'f';
      const idx = (v === 'f' ? 0 : v === 'l' ? 1 : 2) * 4 + (q % 4);
      EST = { tipo: look.estampa, cor2: look.cor2, meta: (META_BONECOS[nome] || [])[idx] || null, v };
      return _sprEst.apply(this, arguments);
    } finally { EST = null; }
  };
  const _tingeEst = tingeCelula;
  tingeCelula = function (base, cores) {
    const out = _tingeEst.apply(this, arguments);
    if (!EST || (typeof MODO_AGORA !== 'undefined' && MODO_AGORA === 'skin') || !cores || !cores[2]) return out;
    try { pintaEstampa(out, base, cores[2], EST); } catch (e) { }
    return out;
  };
  const estrela5 = (u, v, cx, cy, r) => { // ponto (u,v) dentro de uma estrelinha de 5 pontas?
    const dx = u - cx, dy = v - cy, d = Math.hypot(dx, dy); if (d > r) return false;
    const a = Math.atan2(dy, dx) + Math.PI / 2, k = Math.cos(Math.PI / 5) / Math.cos((a % (2 * Math.PI / 5) + 2 * Math.PI / 5) % (2 * Math.PI / 5) - Math.PI / 5);
    return d < r * 0.5 * k + r * 0.02;
  };
  function pintaEstampa(out, base, corA, E) {
    const x = out.getContext('2d'), W = FOLHA_CW, H = FOLHA_CH, img = x.getImageData(0, 0, W, H), o = img.data;
    const { rot, lum, ref } = base, tr = (E.meta && E.meta.tronco) || null; if (!tr) return;
    const tx0 = tr[0], ty0 = tr[1], tw = Math.max(1, tr[2] - tr[0]), th = Math.max(1, (tr[3] || tr[1] + 60) - tr[1]);
    const A = bRgb(corA), B = bRgb(E.cor2), BR = [255, 255, 255], lado = E.v === 'l';
    const tex = pixelsTecido(E.tipo), t = tex ? E.tipo : (RESERVA[E.tipo] || E.tipo), comGola = E.tipo === 'negra_ouro' || E.tipo === 'dourado';
    for (let i = 0; i < rot.length; i++) {
      if (rot[i] !== 2) continue;
      const px = i % W, py = (i / W) | 0, u = (px - tx0) / tw, v = (py - ty0) / th;
      let p = 0, cor = B;
      if (tex) { // o tecido cobre a camisa toda (a caixa do tronco pega ~80% do desenho: os motivos ficam grandes)
        const su = ((u * 0.8 + 0.1) % 1 + 1) % 1, sv = ((v * 0.8 + 0.1) % 1 + 1) % 1, k = ((sv * 255) | 0) * 256 + ((su * 255) | 0);
        cor = [tex[k * 4], tex[k * 4 + 1], tex[k * 4 + 2]]; p = 1;
        if (comGola) for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const j = (py + dy) * W + px + dx; if (j < 0 || j >= rot.length || rot[j] !== 2) { cor = B; break; } }
      }
      else if (t === 'listras') p = Math.floor(u * (lado ? 5 : 7)) % 2 === 0 ? 1 : 0;
      else if (t === 'faixa') p = Math.abs((u - 0.15) - v * 0.9) < 0.13 ? 1 : 0;
      else if (t === 'raio') { const f = u * 6 % 1, z = 0.45 + 0.12 * ((Math.floor(u * 6) % 2) ? f : 1 - f); p = Math.abs(v - z) < 0.065 ? 1 : 0; }
      else if (t === 'chamas') { const h = 0.6 + 0.13 * Math.sin(u * 22) + 0.06 * Math.sin(u * 51); if (v > h) { p = 1; cor = v > h + 0.13 ? [255, 214, 70] : [255, 110, 30]; } }
      else if (t === 'ondas') { const w = Math.sin(u * 14 + v * 3) * 0.05; const f = (v + w) * 5 % 1; p = f < 0.28 ? 1 : 0; }
      else if (t === 'estrelas') { const cx = (Math.floor(u * 4) + 0.5) / 4, cy = (Math.floor(v * 3) + 0.5) / 3 + (Math.floor(u * 4) % 2 ? 0.08 : -0.08); p = estrela5(u, v, cx, cy, 0.13) ? 1 : 0; }
      else if (t === 'petalas') { const cx = (Math.floor(u * 4) + 0.5) / 4, cy = (Math.floor(v * 3) + 0.5) / 3; const d = Math.hypot(u - cx, (v - cy) * 1.4); if (d < 0.07) { p = 1; cor = d < 0.03 ? [255, 230, 120] : [255, 150, 200]; } }
      else if (t === 'galaxia') { const h = Math.abs(Math.sin(px * 12.9898 + py * 78.233) * 43758.5453 % 1); p = 0.4 * (0.5 + 0.5 * Math.sin(u * 5 + v * 7)); cor = B; if (h > 0.982) { p = 1; cor = BR; } }
      else if (t === 'gola') { // gola e mangas na 2ª cor + um V no peito (só de frente)
        for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const j = (py + dy) * W + px + dx; if (j < 0 || j >= rot.length || rot[j] !== 2) { p = 1; break; } }
        if (!p && E.v === 'f' && Math.abs(v - (0.2 + Math.abs(u - 0.5) * 0.55)) < 0.05) p = 1;
      }
      if (!p) continue;
      const c = [0, 1, 2].map(j => A[j] * (1 - p) + cor[j] * p), fl = lum[i] / (ref[2] || 0.5);
      for (let j = 0; j < 3; j++) o[i * 4 + j] = fl <= 1 ? c[j] * fl : Math.min(255, c[j] + (255 - c[j]) * (fl - 1) * 0.9);
    }
    x.putImageData(img, 0, 0);
  }

  /* ---------- 2) brilho por raridade: a silhueta da peça ---------- */
  const NIVEL = { comum: 0, incomum: 1, raro: 2, epico: 3, lendario: 4, mitico: 5 };
  const COR_RAR = { raro: ['#4aa6ff'], epico: ['#c07aff'], lendario: ['#ffc83a'], mitico: ['#ff5ad8', '#5ae0ff'] };
  const PECA = { camisa: 2, calcao: 3, chuteira: 'pe' }; // 2 = pixels da camisa, 3 = do calção (cores-chave da folha)
  let chaveEq = '', brilhos = [];
  function confere() {
    const s = G.save; if (!s || !s.equip) { brilhos = []; return; }
    const k = JSON.stringify(s.equip); if (k === chaveEq) return; chaveEq = k; brilhos = [];
    for (const slot in PECA) { const id = s.equip[slot]; if (!id || !ITENS[id]) continue; const r = raridadeItem(id); if ((NIVEL[r] || 0) >= 2 && COR_RAR[r]) brilhos.push({ peca: PECA[slot], rar: r }); }
  }
  // cada boneco pronto guarda de qual folha/célula veio (para achar a peça depois)
  const _sprSil = spriteBoneco;
  spriteBoneco = function (look, vista = 'frente', q = 0) {
    const res = _sprSil.apply(this, arguments);
    try {
      if (res && res.c && !res.c._cel && look && !look.folha) {
        const sp = specDe(look), nome = folhaDoLook(sp, look), f = FOLHAS[nome], v = vista === 'costas' ? 2 : vista === 'lado' ? 1 : 0;
        if (f && f.ok) res.c._cel = { nome, idx: v * 4 + (q % 4) };
      }
    } catch (e) { }
    return res;
  };
  function mascara(cv, peca) {
    const cel = cv._cel, f = FOLHAS[cel.nome]; if (!f || !f.ok) return null;
    const b = rotulaCelula(f, cel.idx), W = FOLHA_CW, H = FOLHA_CH, cw = cv.width, ch = cv.height, topo = H - ch;
    let lim = 0;
    if (peca === 'pe') { // a chuteira: a faixa de baixo do boneco (sem a pele e o calção)
      let y0 = -1, y1 = -1;
      for (let y = 0; y < H; y++) { let tem = false; for (let x = 0; x < W; x += 2) if (b.d[(y * W + x) * 4 + 3] > 20) { tem = true; break; } if (tem) { if (y0 < 0) y0 = y; y1 = y; } }
      if (y0 < 0) return null; lim = y1 - (y1 - y0) * 0.085;
    }
    const m = new Uint8Array(cw * ch); let n = 0;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const i = (y + topo) * W + x + 10, k = b.rot[i];
      if (peca === 'pe' ? (y + topo >= lim && b.d[i * 4 + 3] > 20 && k !== 4 && k !== 3) : k === peca) { m[y * cw + x] = 1; n++; }
    }
    return n > 30 ? m : null;
  }
  function dilata(m, w, h, R) { // cresce a máscara R pixels, com um disco (cantos redondos)
    const o = new Uint8Array(w * h), disco = [];
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= R * R + R * 0.6) disco.push([dx, dy]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!m[i]) continue; o[i] = 1;
      if (x > 0 && x < w - 1 && y > 0 && y < h - 1 && m[i - 1] && m[i + 1] && m[i - w] && m[i + w]) continue; // só a borda carimba
      for (const [dx, dy] of disco) { const X = x + dx, Y = y + dy; if (X >= 0 && X < w && Y >= 0 && Y < h) o[Y * w + X] = 1; }
    }
    return o;
  }
  // o contorno brilhante da peça (feito 1 vez por pose e por cor)
  function contorno(cv, peca, cor) {
    const key = peca + cor; cv._silh = cv._silh || {}; if (key in cv._silh) return cv._silh[key];
    cv._silh[key] = null;
    const m = mascara(cv, peca); if (!m) return null;
    const w = cv.width, h = cv.height, fora = dilata(m, w, h, 4), inv = new Uint8Array(w * h);
    for (let i = 0; i < inv.length; i++) inv[i] = m[i] ? 0 : 1;
    const dentro = dilata(inv, w, h, 3); // perto da borda, por dentro
    const anel = mkCanvas(w, h), ax = anel.getContext('2d'), img = ax.createImageData(w, h), o = img.data, [r, g, bb] = bRgb(cor);
    for (let i = 0; i < m.length; i++) {
      let a = 0, br = 0;
      if (fora[i] && !m[i]) a = 255; else if (m[i] && dentro[i]) { a = 150; br = 0.55; } // a borda de dentro, mais clara
      if (!a) continue;
      o[i * 4] = r + (255 - r) * br; o[i * 4 + 1] = g + (255 - g) * br; o[i * 4 + 2] = bb + (255 - bb) * br; o[i * 4 + 3] = a;
    }
    ax.putImageData(img, 0, 0);
    const c = mkCanvas(w, h), x = c.getContext('2d');
    x.filter = 'blur(5px)'; x.drawImage(anel, 0, 0); x.drawImage(anel, 0, 0); x.filter = 'none'; // o halo
    x.globalAlpha = 0.9; x.drawImage(anel, 0, 0);                                                // e a linha nítida
    return cv._silh[key] = c;
  }
  function brilhaPecas(ctx, desenha, cv, args) {
    const agora = G.agora || 0;
    brilhos.forEach(b => {
      const cores = COR_RAR[b.rar], pulso = 0.5 + 0.5 * Math.sin(agora / 420); // todas as peças pulsam juntas
      cores.forEach((cor, j) => {
        const c = contorno(cv, b.peca, cor); if (!c) return;
        let a = b.rar === 'raro' ? 0.45 + 0.35 * pulso : b.rar === 'epico' ? 0.55 + 0.4 * pulso : 0.6 + 0.4 * pulso;
        if (cores.length > 1) a *= 0.65 + 0.35 * Math.sin(agora / 700 + j * Math.PI); // mítico: uma cor dá lugar à outra
        ctx.save(); ctx.globalAlpha *= a; desenha.call(ctx, c, ...args); ctx.restore();
      });
    });
  }
  const _entVis = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    if (e !== G.p || !G.save || G.p.morto) return _entVis.apply(this, arguments);
    try { confere(); } catch (err) { }
    if (!brilhos.length) return _entVis.apply(this, arguments);
    // o boneco é desenhado lá dentro (com o gingado e a inclinação): o contorno vai junto, logo por cima dele
    const desenha = ctx.drawImage; let feito = false;
    ctx.drawImage = function (im, ...args) {
      const r = desenha.call(this, im, ...args);
      if (!feito && im && im._cel) { feito = true; try { brilhaPecas(this, desenha, im, args); } catch (err) { } }
      return r;
    };
    try { return _entVis.apply(this, arguments); } finally { delete ctx.drawImage; }
  };
  window.estampaDoItem = estampaDo; // (para os testes e a wiki)
}
