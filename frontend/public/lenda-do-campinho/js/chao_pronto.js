/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🖼️ CHÃO PRONTO EM IMAGEM — v411.3 (desempenho, fase 2 aprovada pelo dono em 07/10: "chão pronto em imagem";
   ele ainda sente travadas "principalmente com personagens level alto", nível 705, monitor de 360 Hz).
   Medido: o chão pintado na hora (chao_blocos.js + chao_novo.js) era a maior causa que sobrou — entrada no Rio 158 ms,
   quadros de ~50 ms andando no rio/cidade/labirinto (um passo do chão novo ou a placa de vídeo atrasada), texturas
   decodificadas na entrada (37–48 ms).
   Agora, nos mapas que têm o chão já pronto (gerado UMA vez fora do jogo, pela ferramenta _teste/chao_pronto/gera.js,
   com os mesmos passos de desenho do jogo), cada bloco de 1024 px é uma IMAGEM (a/chao/<mapa>/<i>_<j>.webp) que o jogo
   só baixa e decodifica FORA do quadro (createImageBitmap) e guarda no mesmo lugar dos blocos pintados (GUARDADOS,
   com o mesmo teto de memória). Enquanto a imagem chega aparece a prévia (também pronta: previa.webp).
   SEGURANÇA (o chão que se vê tem que ser o chão de verdade): cada mapa tem uma ASSINATURA no índice
   (js/chao_pronto_indice.js) = a conta de TODOS os passos anotados na lousa do chão (cores, texturas, posições,
   formas, os passos especiais) + os quadradinhos do mapa. Se o código ou o mapa mudar, a assinatura muda e o jogo volta
   a pintar na hora, como antes (também: imagem que não chega em ~1,5 s, imagem com erro, mapa sem imagem).
   Prefixo cp. Carregar DEPOIS de chao_blocos.js, chao_novo.js, memoria_mapas.js e desempenho_v408.js
   (js/chao_pronto_indice.js logo antes deste).
   ============================================================ */
const CP = (() => {
  const CB = CHAO_BLOCOS, B = CB.B, ESC = CB.ESC, CEL = CB.CEL, P = CB.ChaoBlocos.prototype;
  const IND = (typeof CP_INDICE !== 'undefined' && CP_INDICE) || { mapas: {} };
  const IDX = IND.mapas || {}, DIR = IND.dir || 'a/chao/';
  const ESPERA = CEL ? 2500 : 1500;                   // ms esperando a imagem de um bloco que está NA TELA (depois: pinta)
  const MAX_BM = CEL ? 4 : 16, MAX_BLOB = (CEL ? 12 : 48) * 1048576; // guardados aqui (fora do teto dos blocos): imagens decodificadas / arquivos
  const desligado = () => !!window.CP_DESLIGA || /[?&]cp=0\b/.test(location.search);
  const EST = { usados: 0, previas: 0, pedidos: 0, baixados: 0, falhas: 0, recusados: 0, esperouDemais: 0, assinaturas: {}, baixaMs: [], decodMs: [] };

  /* ---------- a assinatura: conta incremental de cada passo anotado na lousa ---------- */
  const mA = (h, v) => { h = Math.imul(h ^ v, 0x9e3779b1); return (h << 13) | (h >>> 19); };
  const mB = (h, v) => { h = Math.imul(h ^ v, 0x85ebca6b); return (h << 15) | (h >>> 17); };
  const nomeArq = s => { s = String(s || ''); const k = s.lastIndexOf('/'); return k >= 0 ? s.slice(k + 1) : s; }; // (só o nome + ?v: o mesmo no site, na Steam e aqui)
  const FN = new WeakMap(); // texto de cada função (passos especiais)
  const TXT = new Map();    // conta de cada texto curto
  function acum(H, v, prof) {
    switch (typeof v) {
      case 'number': if (Number.isInteger(v) && Math.abs(v) < 2147483648) { H[0] = mA(H[0], v); H[1] = mB(H[1], v ^ 0x51); } else { const q = Number.isFinite(v) ? Math.round(v * 4096) : 7; const lo = q | 0, hi = (q / 4294967296) | 0; H[0] = mA(mA(H[0], lo), hi); H[1] = mB(mB(H[1], lo), hi ^ 0x33); } return;
      case 'string': { // (nomes de passos, cores e fontes se repetem milhares de vezes: a conta de cada texto curto fica guardada)
        let q = v.length <= 64 ? TXT.get(v) : undefined;
        if (q === undefined) { let a = mA(0x165667b1, v.length), b = mB(0x27d4eb2f, v.length + 0x77); for (let i = 0; i < v.length; i++) { const c = v.charCodeAt(i); a = mA(a, c); b = mB(b, c); } q = [a, b]; if (v.length <= 64 && TXT.size < 8192) TXT.set(v, q); }
        H[0] = mA(H[0], q[0]); H[1] = mB(H[1], q[1]); return;
      }
      case 'boolean': H[0] = mA(H[0], v ? 11 : 12); return;
      case 'undefined': H[0] = mA(H[0], 13); return;
      case 'function': { let t = FN.get(v); if (t == null) { t = String(v); FN.set(v, t); } acum(H, t, prof); return; }
    }
    if (v === null) { H[0] = mA(H[0], 14); return; }
    if (prof > 3) { H[0] = mA(H[0], 15); return; }
    if (v.__cpLousa) { H[0] = mA(H[0], 16); return; }                                         // (a própria lousa: copia de um pedaço)
    if (typeof HTMLImageElement !== 'undefined' && v instanceof HTMLImageElement) return acum(H, 'im:' + nomeArq(v.currentSrc || v.src), prof);
    if (v.__cp != null) return acum(H, v.__cp, prof);                                           // padrão ou degradê (marcados abaixo)
    if (v.__cpH != null) { H[0] = mA(H[0], v.__cpH); H[1] = mB(H[1], v.__cpH ^ 0x2d); return; } // forma (Path2D)
    if (typeof HTMLCanvasElement !== 'undefined' && v instanceof HTMLCanvasElement || typeof ImageBitmap !== 'undefined' && v instanceof ImageBitmap || typeof OffscreenCanvas !== 'undefined' && v instanceof OffscreenCanvas) return acum(H, 'cv:' + v.width + 'x' + v.height, prof);
    if (typeof CanvasPattern !== 'undefined' && v instanceof CanvasPattern) return acum(H, 'pat?', prof);
    if (typeof CanvasGradient !== 'undefined' && v instanceof CanvasGradient) return acum(H, 'grad?', prof);
    if (typeof Path2D !== 'undefined' && v instanceof Path2D) return acum(H, 'p2d0', prof);
    if (typeof DOMMatrixReadOnly !== 'undefined' && v instanceof DOMMatrixReadOnly) { for (const k of ['a', 'b', 'c', 'd', 'e', 'f']) acum(H, v[k], prof + 1); return; }
    if (typeof ImageData !== 'undefined' && v instanceof ImageData) { acum(H, 'id:' + v.width + 'x' + v.height, prof); const d = v.data; for (let i = 0; i < d.length; i += 997) acum(H, d[i], prof + 1); return; }
    if (Array.isArray(v) || ArrayBuffer.isView(v)) { acum(H, v.length, prof + 1); const n = Math.min(v.length, 4096); for (let i = 0; i < n; i++) acum(H, v[i], prof + 1); return; }
    for (const k of Object.keys(v).sort()) { acum(H, k, prof + 1); acum(H, v[k], prof + 1); }
  }
  // padrões, degradês e formas não contam o que têm dentro: marcamos na hora em que são feitos (barato)
  const marca = (o, s) => { try { o.__cp = s; } catch (e) { } return o; };
  const numTxt = a => [...a].map(v => typeof v === 'number' ? Math.round(v * 4096) : typeof v === 'object' && v ? (v instanceof HTMLImageElement ? nomeArq(v.currentSrc || v.src) : (v.width + 'x' + v.height)) : String(v)).join(',');
  for (const C of [typeof CanvasRenderingContext2D !== 'undefined' && CanvasRenderingContext2D, typeof OffscreenCanvasRenderingContext2D !== 'undefined' && OffscreenCanvasRenderingContext2D].filter(Boolean)) {
    const Q = C.prototype;
    const _cp = Q.createPattern; Q.createPattern = function (im, rep) { const p = _cp.apply(this, arguments); if (p) marca(p, 'P' + numTxt([im]) + ':' + rep); return p; };
    for (const n of ['createLinearGradient', 'createRadialGradient', 'createConicGradient']) { const f = Q[n]; if (f) Q[n] = function () { const g = f.apply(this, arguments); return marca(g, n[6] + numTxt(arguments)); }; }
  }
  if (typeof CanvasPattern !== 'undefined' && CanvasPattern.prototype.setTransform) { const f = CanvasPattern.prototype.setTransform; CanvasPattern.prototype.setTransform = function (m) { if (this.__cp != null && m) this.__cp += '|' + numTxt([m.a, m.b, m.c, m.d, m.e, m.f]); return f.apply(this, arguments); }; }
  if (typeof CanvasGradient !== 'undefined') { const f = CanvasGradient.prototype.addColorStop; CanvasGradient.prototype.addColorStop = function (o, c) { if (this.__cp != null) this.__cp += '|' + Math.round(o * 4096) + c; return f.apply(this, arguments); }; }
  if (typeof Path2D !== 'undefined') {
    const PP = Path2D.prototype;
    ['moveTo', 'lineTo', 'rect', 'roundRect', 'arc', 'arcTo', 'ellipse', 'bezierCurveTo', 'quadraticCurveTo', 'closePath', 'addPath'].forEach((n, id) => {
      const f = PP[n]; if (!f) return; const cod = 0x3c6ef372 + id * 977;
      PP[n] = function () { // (só números: nada de texto novo a cada chamada — as formas do chão têm milhares de retângulos)
        let h = mA(this.__cpH | 0, cod);
        for (let i = 0; i < arguments.length; i++) { const a = arguments[i]; if (typeof a === 'number') h = mA(h, (a * 4096) | 0); else if (a && a.__cpH != null) h = mA(h, a.__cpH); else if (Array.isArray(a)) for (const x of a) h = mA(h, ((+x || 0) * 4096) | 0); else if (a && typeof a === 'object') h = mA(mA(mA(h, ((+a.a || 0) * 4096) | 0), ((+a.d || 0) * 4096) | 0), ((+a.e || 0) + (+a.f || 0) * 7) | 0); }
        this.__cpH = h; return f.apply(this, arguments);
      };
    });
  }
  // cada lousa nova DE UM MAPA DO ÍNDICE: a conta começa vazia e cada passo anotado entra nela (o jogo anota; aqui só se
  // soma — ~0,3 µs por passo; os outros mapas não pagam nada). A ferramenta liga CP_ASSINA_TUDO para gerar mapas novos.
  const _nova = novoChaoBlocos;
  novoChaoBlocos = function (W, H, m, opc) {
    const S = _nova.apply(this, arguments);
    if (S.soPrevia || !m || !(IDX[m.id] || window.CP_ASSINA_TUDO)) return S;
    try {
      S.__cpLousa = true; S._cpH = [0x2545f491, 0x6c8e9cf5]; S._cpT0 = performance.now();
      const ops = S.ops, push = Array.prototype.push;
      Object.defineProperty(ops, 'push', { value: function (o) { try { acum(S._cpH, o, 0); } catch (e) { S._cpRuim = true; } return push.call(this, o); }, writable: true, configurable: true });
    } catch (e) { }
    return S;
  };
  const hex = v => (v >>> 0).toString(16).padStart(8, '0');
  function quadradinhos(m) { const H = [0x1b873593, 0x0fe7b3a1]; acum(H, m.w, 0); acum(H, m.h, 0); const c = m.chao; for (let k = 0; k < c.length; k++) { H[0] = mA(H[0], c[k] | 0); H[1] = mB(H[1], c[k] | 0); } return hex(H[0]) + hex(H[1]); }
  // a assinatura do chão como ele está agora (lousa completa): a ferramenta grava esta mesma conta no índice
  function assinatura(S) {
    if (!S || !S._cpH || S._cpRuim || !S.m) return null;
    if (S._cpSigVer === S.ver) return S._cpSig;
    if (!S._cpTiles) S._cpTiles = quadradinhos(S.m);
    S._cpSigVer = S.ver; S._cpSig = hex(S._cpH[0]) + hex(S._cpH[1]) + '-' + S.ops.length + '-' + S._cpTiles + '-' + S.width + 'x' + S.height;
    return S._cpSig;
  }
  // o índice vale para esta lousa? (conferido uma vez por versão da lousa)
  function entrada(S) {
    if (S.soPrevia || !S.m) return null;
    const e = IDX[S.m.id]; if (!e || e._ruim || !formatoOk(e)) return null;
    if (S._cpOkVer !== S.ver) {
      S._cpOkVer = S.ver; const sg = assinatura(S); S._cpOk = !!sg && sg === e.sig;
      EST.assinaturas[S.m.id] = { ok: S._cpOk, sig: sg, esperada: e.sig };
      if (!S._cpOk) EST.recusados++;
    }
    return S._cpOk ? e : null;
  }

  /* ---------- baixar e decodificar (fora do quadro, poucos de cada vez) ---------- */
  const CACHE = new Map(); // 'mapa:i:j' | 'mapa:previa' -> { k, url, sig, st: fila|baixando|blob|decod|pronto|falhou, blob, bm, pri, quer, tq, uso, rw, rh }
  let baixando = 0, decodificando = 0, bytesBlob = 0, nBm = 0;
  const urlDe = (id, nome, e) => DIR + id + '/' + nome + '.' + (e.ext || 'webp') + '?s=' + e.sig.slice(0, 16);
  // os mapas de textura grande vão em AVIF com a cor cheia (o webp com perda apagava pontinhos coloridos); navegador sem AVIF
  // (iPhone antes do iOS 16.4) fica com o chão pintado na hora, como antes
  let avifOk = null;
  try { const b64 = 'AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUEAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAIwAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAgAAAAIAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBIAAAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAK21kYXQSAAoHOAA2kBDQaTIWGUJjBMPPPPNAAACQQMkY4Jp6ObLjaA==';
    const u8 = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
    createImageBitmap(new Blob([u8], { type: 'image/avif' })).then(bm => { avifOk = bm.width === 2; bm.close(); }, () => { avifOk = false; });
  } catch (e) { avifOk = false; }
  const formatoOk = e => (e.ext || 'webp') !== 'avif' || avifOk === true;
  function pede(id, nome, e, pri, quer) { // quer = decodificar já (vai ser usada); senão só baixa o arquivo (vizinhos)
    const k = id + ':' + nome; let c = CACHE.get(k);
    if (c && c.sig !== e.sig) { solta(c); c = null; }
    let mudou = false;
    if (!c) { c = { k, id, url: urlDe(id, nome, e), sig: e.sig, st: 'fila', pri, quer: false, tq: 0, uso: 0, nome, W: e.W, H: e.H, ap: e.ap == null ? 2 : e.ap }; CACHE.set(k, c); EST.pedidos++; mudou = true; }
    c.uso = performance.now(); if (pri > c.pri) { c.pri = pri; mudou = true; }
    if (quer && !c.quer) { c.quer = true; c.tq = c.uso; mudou = true; }
    if (mudou) anda(); return c;
  }
  function toma(c) { const bm = c.bm; c.bm = null; CACHE.delete(c.k); nBm--; return bm; } // (a imagem sai daqui e passa a ser dos blocos guardados)
  function solta(c) { if (c.bm) { try { c.bm.close(); } catch (e) { } nBm--; } if (c.blob) bytesBlob -= c.blob.size; c.bm = c.blob = null; CACHE.delete(c.k); }
  function anda() {
    // baixar: no máximo 4 ao mesmo tempo, os de maior prioridade primeiro
    while (baixando < 4) {
      let mel = null; for (const c of CACHE.values()) if (c.st === 'fila' && (!mel || c.pri > mel.pri || (c.pri === mel.pri && c.quer && !mel.quer))) mel = c;
      if (!mel) break; baixa(mel);
    }
    // decodificar: no máximo 2 ao mesmo tempo (o navegador decodifica fora da página)
    while (decodificando < 2) {
      let mel = null; for (const c of CACHE.values()) if (c.st === 'blob' && c.quer && (!mel || c.pri > mel.pri)) mel = c;
      if (!mel) break; decodifica(mel);
    }
  }
  function baixa(c) {
    c.st = 'baixando'; baixando++; const t0 = performance.now();
    fetch(c.url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); }).then(b => {
      baixando--; if (CACHE.get(c.k) !== c) return anda();
      c.blob = b; bytesBlob += b.size; c.st = 'blob'; EST.baixados++; if (EST.baixaMs.length < 400) EST.baixaMs.push(Math.round(performance.now() - t0));
      limpa(); anda();
    }).catch(er => { baixando--; falhou(c, er); anda(); });
  }
  function decodifica(c) {
    c.st = 'decod'; decodificando++; const t0 = performance.now();
    let vai;
    if (ESC !== 1 && c.nome !== 'previa') { // (celular: blocos em meia resolução, como os pintados — o tamanho do bloco, com os pixels a mais em volta)
      const [i, j] = c.nome.split('_').map(Number), w = Math.min(c.W, i * B + B + c.ap) - Math.max(0, i * B - c.ap), h = Math.min(c.H, j * B + B + c.ap) - Math.max(0, j * B - c.ap);
      vai = createImageBitmap(c.blob, { resizeWidth: Math.ceil(w * ESC), resizeHeight: Math.ceil(h * ESC), resizeQuality: 'high' });
    } else vai = createImageBitmap(c.blob);
    vai.then(bm => {
      decodificando--; if (CACHE.get(c.k) !== c) { bm.close(); return anda(); }
      bytesBlob -= c.blob.size; c.blob = null; c.bm = bm; nBm++; c.st = 'pronto'; if (EST.decodMs.length < 400) EST.decodMs.push(Math.round(performance.now() - t0));
      limpa(); anda();
    }).catch(er => { decodificando--; falhou(c, er); anda(); });
  }
  function falhou(c, er) {
    c.st = 'falhou'; c.blob = null; EST.falhas++;
    const e = IDX[c.id]; if (e) { e._falhas = (e._falhas || 0) + 1; if (e._falhas >= 3) e._ruim = true; } // (3 erros no mesmo mapa: desiste dele nesta sessão)
    try { if (!EST.erro) EST.erro = c.url + ': ' + (er && er.message || er); } catch (e2) { }
  }
  // memória: decodificadas no máximo MAX_BM; arquivos no máximo MAX_BLOB (sai o usado há mais tempo, nunca o do mapa atual na tela)
  function limpa() {
    if (nBm <= MAX_BM && bytesBlob <= MAX_BLOB) return;
    const atual = typeof G !== 'undefined' && G.mapa ? G.mapa.id : null;
    const l = [...CACHE.values()].filter(c => c.bm || c.blob).sort((a, b) => (a.id === atual) - (b.id === atual) || a.uso - b.uso);
    for (const c of l) { if (nBm <= MAX_BM && bytesBlob <= MAX_BLOB) break; if (c.bm && nBm > MAX_BM) solta(c); else if (c.blob && bytesBlob > MAX_BLOB) solta(c); }
  }

  /* ---------- no desenho: antes de pintar um bloco, a imagem pronta ---------- */
  const _fresco = P.fresco;
  P.fresco = function (i, j) { if (this._cpEsc && this._cpEsc.has(i + ':' + j)) return true; return _fresco.call(this, i, j); }; // (só durante o desenhaEm: o bloco cuja imagem está chegando não é pintado)
  function prepara(S, sx, sy, sw, sh) {
    const e = entrada(S);
    if (!e) {
      // as pontes chegam um pouco depois (a arte delas): por ~1 s espera a lousa ficar completa em vez de pintar o que vai mudar
      const m = S.m, ie = m && IDX[m.id];
      if (ie && !ie._ruim && m.pontes && m.pontes.length && m._pontesEm !== S && performance.now() - S._cpT0 < 1000) { const esc = new Set(); for (const [i, j] of S.blocosEm(sx, sy, sw, sh)) esc.add(i + ':' + j); return esc; }
      return null;
    }
    const id = S.m.id, agora = performance.now(), esc = new Set();
    // a prévia pronta (o fundo enquanto um bloco não chega)
    if (e.prev && (!S.prev || S.prevVer !== S.ver)) { const c = pede(id, 'previa', e, 3, true); if (c.st === 'pronto') { S.prev = toma(c); S.prevVer = S.ver; EST.previas++; } }
    const vis = new Set(S.blocosEm(sx, sy, sw, sh).map(([i, j]) => i + ':' + j));
    let fora = 0;
    for (const [i, j] of S.blocosEm(sx - B * 0.6, sy - B * 0.6, sw + B * 1.2, sh + B * 1.2)) {
      if (_fresco.call(S, i, j)) continue;
      const kk = i + ':' + j, naTela = vis.has(kk), c = pede(id, i + '_' + j, e, naTela ? 2 : 1, true);
      if (c.st === 'pronto') {
        if (!naTela && fora++ >= 1) { esc.add(kk); continue; } // (um vizinho por quadro: a placa de vídeo recebe a imagem quando ela aparece)
        CB.guarda(S, i, j, toma(c), S.ver); EST.usados++; continue;
      }
      if (c.st === 'falhou') continue;                                   // (a imagem falhou: o jogo pinta, como antes)
      if (naTela && agora - c.tq > ESPERA) { if (!c.demorou) { c.demorou = true; EST.esperouDemais++; } continue; } // (demorou demais: pinta)
      esc.add(kk);
    }
    return esc;
  }
  const _des = P.desenhaEm;
  P.desenhaEm = function (ctx, sx, sy, sw, sh) {
    let esc = null;
    if (!this.soPrevia && !desligado()) try { esc = prepara(this, sx, sy, sw, sh); } catch (e) { if (!EST.erroPrep) EST.erroPrep = String(e && e.message || e); }
    if (!esc || !esc.size) return _des.apply(this, arguments);
    this._cpEsc = esc; try { return _des.apply(this, arguments); } finally { this._cpEsc = null; }
  };

  /* ---------- ao entrar num mapa: os blocos da tela já vão sendo pedidos (antes mesmo da lousa existir) ---------- */
  function blocosDaVista(e, cx, cy, mg) {
    const vw = (typeof CV !== 'undefined' && CV && G.zoom ? CV.width / G.zoom : 1920), vh = (typeof CV !== 'undefined' && CV && G.zoom ? CV.height / G.zoom : 1080);
    const x0 = Math.max(0, cx - vw / 2 - mg), y0 = Math.max(0, cy - vh / 2 - mg), x1 = Math.min(e.W - 1, cx + vw / 2 + mg), y1 = Math.min(e.H - 1, cy + vh / 2 + mg), l = [];
    for (let j = Math.floor(y0 / B); j <= Math.floor(y1 / B); j++) for (let i = Math.floor(x0 / B); i <= Math.floor(x1 / B); i++) l.push([i, j]);
    return l;
  }
  const _entCp = entrarMapa;
  entrarMapa = function () {
    const r = _entCp.apply(this, arguments);
    try {
      const m = G.mapa, e = m && IDX[m.id];
      if (e && !e._ruim && formatoOk(e) && !desligado()) {
        if (e.prev) pede(m.id, 'previa', e, 3, true);
        for (const [i, j] of blocosDaVista(e, G.p.x * T, G.p.y * T, 0)) pede(m.id, i + '_' + j, e, 2, true);
      }
      // o que era de outros mapas desce de prioridade
      for (const c of CACHE.values()) if (!m || c.id !== m.id) { c.pri = 0; if (c.st === 'pronto' && nBm > MAX_BM / 2) solta(c); }
    } catch (er) { }
    return r;
  };
  // vizinhos: perto de uma saída, os arquivos dos blocos da chegada já vão sendo baixados (sem decodificar)
  setInterval(() => {
    try {
      if (desligado() || typeof G === 'undefined' || !G.rodando || !G.mapa || !G.p) return;
      const m = G.mapa;
      for (const s of m.saidas || []) {
        const e = IDX[s.para]; if (!e || e._ruim || !formatoOk(e) || s.para === m.id || s.tx == null) continue;
        if (Math.abs(s.x - G.p.x) + Math.abs(s.y - G.p.y) > 30) continue;
        if (e.prev) pede(s.para, 'previa', e, 0, false);
        for (const [i, j] of blocosDaVista(e, (s.tx + 0.5) * T, (s.ty + 0.5) * T, 0)) pede(s.para, i + '_' + j, e, 0, false);
      }
      // o vizinho pré-desenhado (chao_novo.js): a prévia dele vem da imagem pronta, sem pintar
      const pre = typeof MEM_MAPAS !== 'undefined' && MEM_MAPAS.pre, S = pre && pre._chao;
      if (S && S instanceof CB.ChaoBlocos && !S.soPrevia && (!S.prev || S.prevVer !== S.ver)) { const e = entrada(S); if (e && e.prev) { const c = pede(pre.id, 'previa', e, 0, true); if (c.st === 'pronto') { S.prev = toma(c); S.prevVer = S.ver; EST.previas++; } } }
    } catch (er) { }
  }, 1000);

  return { IDX, EST, CACHE, assinatura, entrada, quadradinhos, desligado, pede, toma, acum, avif: () => avifOk };
})();
window.CP = CP; // (ferramenta _teste/chao_pronto/gera.js e testes)
