/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌟 AURA LENDÁRIA — adorno do NÍVEL 1000 (v411.9; dono: "acho que uma aura bem denotada no chão ficaria legal")
   Um selo grande no chão, embaixo do jogador, para quem olha perceber na hora que é um nível 1000:
   - CHÃO (desenhado logo depois do chão, antes dos avisos de golpe, do quadradinho do alvo, de prédios e bonecos):
     brilho dourado pulsando, duas ondas de luz saindo do centro, anel de energia azul com estrelas (gira para um lado),
     anel dourado de louros com 8 bolas (gira para o outro) e uma estrela de luz no meio, embaixo dos pés.
   - NO BONECO: um raio de luz suave subindo e faíscas subindo devagar (as de trás antes do boneco, as da frente depois).
   Artes do Higgsfield: a/ad_lenda_anel, ad_lenda_luz, ad_lenda_estrela (+ ad_lenda_icone na janela de Adornos).
   Liga/desliga em ✨ Adornos (adornos.js, EXTRAS id 'lenda'): fica NO LUGAR da Aura de Craque (uma aura por vez).
   DESEMPENHO (pedido do dono: nada de travadinhas): cada camada é pintada UMA vez numa tela guardada, já no tamanho em que
   aparece na tela (refeita só quando o zoom muda); o selo do chão é montado ~30 vezes por segundo numa tela guardada e
   copiado (1 drawImage sem giro) nos quadros; raio + faíscas = ~11 drawImage pequenos. Sem filtros, sem sombras desfocadas,
   sem gradientes novos por quadro, sem criar objetos. Só a do próprio jogador.
   Prefixo: aul. Carregar DEPOIS de adornos.js e adornos2.js (embrulha desenhaEnt e desenhaChaoClima).
   ============================================================ */
{
  const ARTES = ['ad_lenda_anel', 'ad_lenda_luz', 'ad_lenda_estrela'];
  for (const n of ARTES) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  // medidas em quadradinhos (T): metade da largura de cada camada
  const R_LUZ = 1.18, R_ANEL = 0.9, R_ESTRELA = 0.62, R_BRILHO = 1.3, R_ONDA = 1, ACH = 0.45; // ACH = achatado (o chão visto de cima, inclinado)
  const N_FAISCAS = 10, RAIO_L = 0.85, RAIO_A = 2.5; // raio de luz: largura e altura (em T)
  const PASSO_SELO = 33; // o selo do chão é recomposto ~30 vezes por segundo (giro lento: não dá para ver a diferença) e só COPIADO nos outros quadros
  const ligada = () => { try { const e = G.p; return !!(e && G.save && !e.morto && !G.fut && !G.jogoC && window.adAuraLendaria && window.adAuraLendaria()); } catch (err) { return false; } };
  let avisou = false; const erro = err => { if (!avisou) { avisou = true; console.warn('aura_lendaria', err); } };

  /* ---------- telas guardadas (pintadas uma vez por zoom) ---------- */
  const AUL = { esc: 0, c: null, n: 0 };
  const tela = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h)); return c; };
  function deImagem(im, meia, esc) { const c = tela(meia * 2 * T * esc, meia * 2 * T * esc); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height); return c; }
  function prepara() {
    const esc = Math.min(3, Math.max(0.5, Math.round((G.zoom || 1) * 4) / 4)); // tamanho de tela (px por px do mundo), em degraus
    if (AUL.c && AUL.esc === esc) return AUL.c;
    const anel = aSprite('ad_lenda_anel'), luz = aSprite('ad_lenda_luz'), est = aSprite('ad_lenda_estrela');
    if (!anel || !luz || !est) return null; // (ainda carregando)
    const c = { anel: deImagem(anel, R_ANEL, esc), luz: deImagem(luz, R_LUZ, esc), estrela: deImagem(est, R_ESTRELA, esc) };
    { // brilho do chão: dourado no meio, some na borda
      const d = R_BRILHO * 2 * T * esc, b = c.brilho = tela(d, d), x = b.getContext('2d'), r = b.width / 2;
      const g = x.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, 'rgba(255,244,190,0.95)'); g.addColorStop(0.35, 'rgba(255,214,90,0.6)'); g.addColorStop(0.7, 'rgba(120,200,255,0.28)'); g.addColorStop(1, 'rgba(120,200,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, b.width, b.height);
    }
    { // onda: um aro fino dourado-claro (cresce e some)
      const d = R_ONDA * 2 * T * esc, o = c.onda = tela(d, d), x = o.getContext('2d'), r = o.width / 2;
      x.lineWidth = Math.max(2, 5 * esc); x.strokeStyle = 'rgba(255,236,150,1)'; x.beginPath(); x.arc(r, r, r - x.lineWidth, 0, Math.PI * 2); x.stroke();
      x.lineWidth = Math.max(1, 2 * esc); x.strokeStyle = 'rgba(255,255,255,1)'; x.beginPath(); x.arc(r, r, r - x.lineWidth * 2.5, 0, Math.PI * 2); x.stroke();
    }
    { // raio de luz subindo: forte embaixo e no meio, some nas laterais e em cima
      const w = RAIO_L * T * esc, h = RAIO_A * T * esc, rr = c.raio = tela(w, h), x = rr.getContext('2d');
      const gh = x.createLinearGradient(0, 0, rr.width, 0);
      gh.addColorStop(0, 'rgba(255,240,180,0)'); gh.addColorStop(0.3, 'rgba(255,236,160,0.55)'); gh.addColorStop(0.5, 'rgba(255,255,235,1)'); gh.addColorStop(0.7, 'rgba(190,225,255,0.55)'); gh.addColorStop(1, 'rgba(190,225,255,0)');
      x.fillStyle = gh; x.fillRect(0, 0, rr.width, rr.height);
      x.globalCompositeOperation = 'destination-in';
      const gv = x.createLinearGradient(0, 0, 0, rr.height); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.55, 'rgba(0,0,0,0.45)'); gv.addColorStop(1, 'rgba(0,0,0,1)');
      x.fillStyle = gv; x.fillRect(0, 0, rr.width, rr.height);
    }
    { // faísca: estrelinha de 4 pontas com miolo claro
      const d = 0.3 * T * esc, f = c.faisca = tela(d, d), x = f.getContext('2d'), r = f.width / 2;
      const g = x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.3, 'rgba(255,220,110,0.8)'); g.addColorStop(1, 'rgba(255,200,80,0)');
      x.fillStyle = g; x.beginPath(); x.arc(r, r, r, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,1)'; x.beginPath(); x.moveTo(r, 0); x.lineTo(r + r * 0.16, r - r * 0.16); x.lineTo(f.width, r); x.lineTo(r + r * 0.16, r + r * 0.16);
      x.lineTo(r, f.height); x.lineTo(r - r * 0.16, r + r * 0.16); x.lineTo(0, r); x.lineTo(r - r * 0.16, r - r * 0.16); x.closePath(); x.fill();
    }
    AUL.c = c; AUL.esc = esc; AUL.n++; return c; // (AUL.n: quantas vezes pintou — só muda com o zoom)
  }
  const centro = (c, im, meia) => { const d = meia * 2 * T; c.drawImage(im, -d / 2, -d / 2, d, d); };
  const sobeDe = e => (typeof alturaPonte === 'function' ? alturaPonte(e) : 0) || 0;

  /* ---------- 1) o selo no chão ---------- */
  // as camadas giram/pulsam numa tela guardada já achatada (SELO); a tela do jogo só recebe UMA cópia sem giro por quadro
  // (no PC sem placa de vídeo, girar 5 camadas grandes a cada quadro custava ~1,6 ms de perto; assim fica bem abaixo)
  const SELO = { cv: null, x: null, esc: 0, t: -1e9 };
  function compoeSelo(c, t) {
    const esc = AUL.esc, L = R_BRILHO * 2 * T * esc;
    if (!SELO.cv || SELO.esc !== esc) { SELO.cv = tela(L, L * ACH); SELO.x = SELO.cv.getContext('2d'); SELO.esc = esc; }
    const x = SELO.x, cv = SELO.cv, pul = 0.5 + 0.5 * Math.sin(t / 520);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, cv.width, cv.height);
    x.setTransform(esc, 0, 0, esc * ACH, cv.width / 2, cv.height / 2); // (1 px do mundo = esc px; achatado na vertical)
    x.globalAlpha = 0.42 + 0.22 * pul; centro(x, c.brilho, R_BRILHO); // brilho pulsando
    x.globalCompositeOperation = 'lighter'; // ondas de luz saindo do centro (duas, defasadas)
    for (let k = 0; k < 2; k++) { const f = (t / 2600 + k * 0.5) % 1, m = R_ONDA * (0.55 + 0.75 * f); x.globalAlpha = (1 - f) * 0.55; centro(x, c.onda, m); }
    x.globalCompositeOperation = 'source-over';
    x.save(); x.rotate(-t / 3400); x.globalAlpha = 0.88; centro(x, c.luz, R_LUZ); x.restore(); // anel azul: anti-horário
    x.save(); x.rotate(t / 5200); x.globalAlpha = 0.95; centro(x, c.anel, R_ANEL); x.restore(); // anel dourado: horário
    x.rotate(t / 7000); const s = 1 + 0.07 * pul; x.scale(s, s); x.globalAlpha = 0.7 + 0.2 * pul; centro(x, c.estrela, R_ESTRELA); // estrela do meio
    SELO.t = t;
  }
  function desenhaChaoAura(ctx) {
    const c = prepara(); if (!c) return;
    const e = G.p, t = G.agora || 0;
    if (SELO.esc !== AUL.esc || t - SELO.t >= (G.leve ? PASSO_SELO * 2 : PASSO_SELO) || t < SELO.t) compoeSelo(c, t); // (⚡ Gráficos leves: 15 vezes por segundo)
    const L = R_BRILHO * 2 * T, A = L * ACH;
    ctx.drawImage(SELO.cv, e.x * T - L / 2, e.y * T - sobeDe(e) - 2 - A / 2, L, A);
  }
  const _dccAul = typeof desenhaChaoClima === 'function' ? desenhaChaoClima : null;
  // a aura vai ANTES do resto desta camada: os avisos de golpe no chão (arenas, grade de área), o quadradinho vermelho
  // do alvo, as ondas e o clima ficam POR CIMA dela — nada de combate fica escondido embaixo do selo
  desenhaChaoClima = function (ctx) {
    try { if (ligada()) desenhaChaoAura(ctx); } catch (err) { erro(err); }
    if (_dccAul) return _dccAul.apply(this, arguments);
  };

  /* ---------- 2) raio de luz e faíscas (junto do boneco) ---------- */
  function faiscas(ctx, e, c, t, frente) {
    const cx = e.x * T, cy = e.y * T - sobeDe(e), fd = 0.3 * T;
    for (let i = 0, n = G.leve ? N_FAISCAS >> 1 : N_FAISCAS; i < n; i++) { // (⚡ Gráficos leves: metade)
      const u = t / 2400 + i * 0.618, ph = u % 1, volta = Math.floor(u), ang = i * 2.39996 + volta * 1.7;
      const sn = Math.sin(ang); if ((sn >= 0) !== frente) continue;
      const a = Math.sin(ph * Math.PI); if (a < 0.08) continue;
      const rr = R_ANEL * T * (0.95 - 0.35 * ph), x = cx + Math.cos(ang) * rr + Math.sin(t / 400 + i) * 3, y = cy + sn * rr * ACH - ph * T * 1.9;
      const d = fd * (0.55 + 0.45 * a); ctx.globalAlpha = a * 0.95; ctx.drawImage(c.faisca, x - d / 2, y - d / 2, d, d);
    }
  }
  const _entAul = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    if (e !== G.p || !ligada()) return _entAul.apply(this, arguments);
    const c = AUL.c && AUL.esc ? prepara() : null, t = G.agora || 0;
    if (c) try {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const pul = 0.5 + 0.5 * Math.sin(t / 520), w = RAIO_L * T, h = RAIO_A * T;
      if (!G.leve) { ctx.globalAlpha = 0.14 + 0.1 * pul; ctx.drawImage(c.raio, e.x * T - w / 2, e.y * T - sobeDe(e) - h, w, h); } // raio de luz (atrás; sem ele nos ⚡ Gráficos leves)
      faiscas(ctx, e, c, t, false); ctx.restore();
    } catch (err) { ctx.restore(); erro(err); }
    const res = _entAul.apply(this, arguments);
    if (c) try { ctx.save(); ctx.globalCompositeOperation = 'lighter'; faiscas(ctx, e, c, t, true); ctx.restore(); } catch (err) { ctx.restore(); erro(err); }
    return res;
  };
  window.AURA_LENDARIA = { prepara, desenhaChaoAura, ligada, AUL, SELO }; // (testes e fotos)
}
