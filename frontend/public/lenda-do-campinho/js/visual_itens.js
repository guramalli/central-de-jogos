/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ✨ ITENS MAIS BONITOS NO BONECO (v296)
   1) ESTAMPA NA CAMISA: a camisa de futebol era pintada numa cor só. O boneco sabe exatamente quais pixels
      são a camisa (a cor-chave da folha), então a estampa é desenhada DENTRO dela, com a sombra de sempre:
      cada camisa ganha a do seu tema (Dracônica = chamas, Galáxia = galáxia, Abissal = ondas, Negra e Ouro =
      gola dourada...) na 2ª cor do item (antes ignorada); sem tema, a estampa vem da raridade.
   2) CHUTEIRA: correndo, a chuteira rara deixa um rastro de faíscas na cor da raridade dela.
      (v299: a pedido do dono ficou SÓ o rastro — o brilho no corpo, as faíscas, a aura e o contorno das peças saíram.)
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
  const nomeTecido = t => TECIDO[t] || (/^tx_/.test(t || '') ? t : null); // v306: tx_<camisa> = tecido próprio de cada camisa (roupas_tecidos.js)
  function pixelsTecido(tipo) {
    const nome = nomeTecido(tipo); if (!nome) return null; if (TEX_PX[nome]) return TEX_PX[nome];
    const im = typeof aSprite === 'function' ? aSprite(nome) : null; if (!im) return null;
    const c = mkCanvas(256, 256), x = c.getContext('2d'); x.drawImage(im, 0, 0, 256, 256);
    TEX_PX[nome] = x.getImageData(0, 0, 256, 256).data;
    try { if (typeof SPR_CACHE !== 'undefined') SPR_CACHE.clear(); } catch (e) { } // redesenha os bonecos com o tecido
    return TEX_PX[nome];
  }
  for (const n of [...Object.values(TECIDO), 'fx_brilho_ouro', 'fx_brilho_roxo', 'fx_brilho_azul', 'fx_brilho_arco']) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  { const vai = () => (typeof G !== 'undefined' && G.rodando) ? [...Object.values(TECIDO), 'fx_brilho_ouro', 'fx_brilho_roxo', 'fx_brilho_azul', 'fx_brilho_arco'].forEach(n => { try { spr(n); } catch (e) { } }) : setTimeout(vai, 2000); setTimeout(vai, 1500); } // v407 (Raio-X A2): só depois que o jogo abre (não na tela inicial) // já começa a carregar
  const escura = c => { const [r, g, b] = bRgb(c); return r * 0.3 + g * 0.59 + b * 0.11 < 110; };
  const _lookEst = lookJogador;
  lookJogador = function (retrato) {
    const L = _lookEst.apply(this, arguments);
    try {
      const s = G.save, id = s && s.equip && s.equip.camisa, it = id && ITENS[id];
      const e0 = it ? estampaDo(id) : null, proprio = /^tx_/.test(e0 || '');
      if (L && !L.folha && !G.jogoC && it && (L.roupa === 'roupa-futebol' || proprio) && id !== 'camisa_vila') {
        const e = e0;
        if (e && !L.corRoupa) { if (!nomeTecido(e)) return L; L.corRoupa = it.cor || '#22306a'; delete L._kb; } // camisa sem cor própria (ex.: das quests lendárias): o tecido dá a cor
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

  /* ---------- 2) rastro da chuteira ---------- */
  const NIVEL = { comum: 0, incomum: 1, raro: 2, epico: 3, lendario: 4, mitico: 5 };
  const COR_RAR = { raro: ['#bfe6ff', '#ffffff'], epico: ['#c58cff', '#f0d8ff'], lendario: ['#ffd23f', '#fff4b0'], mitico: ['#ff5ad8', '#5ae0ff', '#ffe14a', '#7aff8a'] };
  let chaveEq = '', rarChut = null;
  function confere() {
    const s = G.save; if (!s || !s.equip) { rarChut = null; return; }
    const k = s.equip.chuteira || ''; if (k === chaveEq) return; chaveEq = k;
    const rc = k && ITENS[k] ? raridadeItem(k) : null; rarChut = (NIVEL[rc] || 0) >= 2 ? rc : null;
  }
  const rastro = []; let ultimoRastro = 0;
  const FX_RAR = { raro: 'fx_brilho_azul', epico: 'fx_brilho_roxo', lendario: 'fx_brilho_ouro', mitico: 'fx_brilho_arco' };
  function faisca(ctx, x, y, r, cor, a) {
    const im = typeof aSprite === 'function' ? aSprite(FX_RAR[rarChut]) : null;
    if (im) { const h = r * 3.2, w = h * im.width / im.height; ctx.globalAlpha = a; ctx.drawImage(im, x - w / 2, y - h / 2, w, h); return; }
    ctx.globalAlpha = a; ctx.fillStyle = cor; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.28, y - r * 0.28); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.28, y + r * 0.28);
    ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.28, y + r * 0.28); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.28, y - r * 0.28); ctx.closePath(); ctx.fill();
  }
  const _entVis = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    if (e !== G.p || !G.save || G.p.morto) return _entVis.apply(this, arguments);
    try {
      confere();
      if (rarChut) { // atrás do boneco
        const agora = G.agora || 0, px = e.x * T, py = e.y * T, sobe = typeof alturaPonte === 'function' ? alturaPonte(e) : 0, anda = !!(e.pas || e.mov);
        if (anda && agora - ultimoRastro > 40) { ultimoRastro = agora; rastro.push({ x: px + (Math.random() - 0.5) * 16, y: py - sobe - 2 + (Math.random() - 0.5) * 6, t0: agora, c: COR_RAR[rarChut][(Math.random() * COR_RAR[rarChut].length) | 0] }); if (rastro.length > 40) rastro.shift(); }
        ctx.save();
        for (let i = rastro.length - 1; i >= 0; i--) { const f = rastro[i], k = (agora - f.t0) / 650; if (k >= 1 || k < 0) { rastro.splice(i, 1); continue; } faisca(ctx, f.x, f.y - k * 18, (rarChut === 'raro' ? 5 : 7) * (1 - k * 0.5), f.c, 0.9 * (1 - k)); }
        ctx.restore();
      }
    } catch (err) { }
    return _entVis.apply(this, arguments);
  };
  window.estampaDoItem = estampaDo; // (para os testes e a wiki)
}
