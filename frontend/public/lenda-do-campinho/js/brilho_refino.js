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
  const FAIXA = { cabeca: [0, 0.31], acessorio: [0.27, 0.37], camisa: [0.33, 0.6], calcao: [0.57, 0.72], perna: [0.7, 0.9], chuteira: [0.87, 1.01] };
  const SLOTS = Object.keys(FAIXA);
  const corDe = id => { try { return RARIDADE[raridadeItem(id)].cor || '#ffd23f'; } catch (e) { return '#ffd23f'; } };
  const refinos = () => { const s = G.save; if (!s || !s.equip) return []; return SLOTS.map(sl => ({ sl, id: s.equip[sl], r: (s.equipR && s.equipR[sl]) || 0 })).filter(p => p.id && p.r >= 7); };
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
  // a silhueta da faixa da peça num canvas à parte: pintada na COR (luz == null) ou só a FAIXA DE LUZ passando (luz 0..1)
  function camada(comp, f0, f1, cor, alfa, luz) {
    const c = comp.c, cx = caixa(c), H = cx.y1 - cx.y0 + 1, ya = Math.max(0, Math.floor(cx.y0 + H * f0)), yb = Math.min(c.height, Math.ceil(cx.y0 + H * f1));
    if (off.width !== c.width || off.height !== c.height) { off.width = c.width; off.height = c.height; } else oc.clearRect(0, 0, off.width, off.height);
    oc.save(); oc.beginPath(); oc.rect(0, ya, c.width, yb - ya); oc.clip(); oc.globalCompositeOperation = 'source-over'; oc.globalAlpha = 1; oc.drawImage(corpo(c), 0, 0);
    oc.globalCompositeOperation = 'source-in';
    if (luz == null) { oc.fillStyle = cor; oc.fillRect(0, 0, c.width, c.height); }
    else { const L = c.width + c.height, p = -c.height + luz * L, g = oc.createLinearGradient(p, c.height, p + c.height * 0.6, 0);
      g.addColorStop(0.38, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.85)'); g.addColorStop(0.62, 'rgba(255,255,255,0)'); oc.fillStyle = g; oc.fillRect(0, 0, c.width, c.height); }
    oc.restore();
    return { alfa, ya, yb };
  }
  function desenhaBrilho(ctx, e, atras) {
    const s = G.save, pecas = refinos(); if (!pecas.length) return;
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
    const t = G.agora || 0, completo = SLOTS.every(sl => s.equip[sl] && ((s.equipR && s.equipR[sl]) || 0) >= 10);
    ctx.save(); ctx.translate(x + hit + dir * golpe * 7, y - bob + dy); ctx.rotate(rot + dir * golpe * 0.12); ctx.scale(dir, sy);
    // aura do conjunto completo: contorno dourado do boneco inteiro, por trás
    if (completo && atras) {
      const k = 0.5 + 0.5 * Math.sin(t / 380); camada(comp, 0, 1.02, '#ffd23f', 0, null);
      ctx.globalAlpha = 0.45 + 0.3 * k; for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2]]) ctx.drawImage(off, -w / 2 + ox, -h + oy, w, h);
    }
    for (const p of pecas) {
      const [f0, f1] = FAIXA[p.sl], cor = corDe(p.id), fase = SLOTS.indexOf(p.sl) * 0.9;
      // força do efeito por refino: halo (por trás), tom (por cima), luz que passa (por cima)
      let halo = 0, tom = 0, luz = null;
      if (p.r === 7) { const ciclo = ((t / 1000 + fase) % 3.2) / 3.2; if (ciclo < 0.35) luz = ciclo / 0.35; else continue; }
      else if (p.r === 8) { tom = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(t / 600 + fase)); halo = 0.5; const ciclo = ((t / 1000 + fase) % 2.6) / 2.6; if (ciclo < 0.3) luz = ciclo / 0.3; }
      else if (p.r === 9) { tom = 0.2 + 0.12 * (0.5 + 0.5 * Math.sin(t / 420 + fase)); halo = 0.8 + 0.2 * Math.sin(t / 420 + fase); const ciclo = ((t / 1000 + fase) % 2) / 2; if (ciclo < 0.3) luz = ciclo / 0.3; }
      else { tom = 0.26 + 0.16 * (0.5 + 0.5 * Math.sin(t / 300 + fase)); halo = 1; luz = ((t / 1000 + fase) % 1.3) / 1.3; }
      if (atras) {
        if (!halo) continue;
        camada(comp, f0, f1, cor, 0, null); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, halo);
        const d = (p.r >= 10 ? 4 : p.r === 9 ? 3 : 2) * (1 + 0.15 * Math.sin(t / 260 + fase)); for (let a = 0; a < 8; a++) ctx.drawImage(off, -w / 2 + Math.cos(a * Math.PI / 4) * d, -h + Math.sin(a * Math.PI / 4) * d, w, h);
        if (p.r >= 10) { ctx.globalAlpha = 0.45; const d2 = d * 1.8; for (let a = 0; a < 8; a++) ctx.drawImage(off, -w / 2 + Math.cos(a * Math.PI / 4 + 0.4) * d2, -h + Math.sin(a * Math.PI / 4 + 0.4) * d2, w, h); }
        continue;
      }
      if (tom) { const L0 = camada(comp, f0, f1, cor, 0, null); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = tom; ctx.drawImage(off, -w / 2, -h, w, h); }
      const L = luz != null ? camada(comp, f0, f1, null, 0, luz) : { ya: 0, yb: 0 };
      if (luz != null) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = p.r >= 10 ? 0.8 : p.r === 9 ? 0.65 : 0.5; ctx.drawImage(off, -w / 2, -h, w, h); }
      // faíscas (+9 e +10) saindo da faixa da peça
      if (p.r >= 9 && Math.random() < (p.r >= 10 ? 0.45 : 0.2)) {
        const cxB = caixa(comp.c), fy = (cxB.y0 + (cxB.y1 - cxB.y0) * (f0 + Math.random() * (f1 - f0))) / comp.c.height; // na faixa da peça
        FAISCAS.push({ x: e.x * T + dir * (Math.random() - 0.5) * w * 0.55, y: e.y * T - h + fy * h + dy, vy: -(0.25 + Math.random() * 0.5), t0: t, dur: 700 + Math.random() * 500, cor, r: p.r >= 10 ? 2.8 : 2 });
      }
      if (p.sl === 'chuteira' && p.r >= 10 && e.mov && Math.random() < 0.6) FAISCAS.push({ x: e.x * T + (Math.random() - 0.5) * 8, y: e.y * T - 3, vy: -0.05, t0: t, dur: 600, cor, r: 3 });
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
    if (meu) { try { desenhaBrilho(ctx, e, true); } catch (err) { if (!window._brErr) { window._brErr = err; console.warn('brilho do refino', err); } } }
    const r = _entBr.apply(this, arguments);
    if (meu) { try { desenhaBrilho(ctx, e, false); } catch (err) { if (!window._brErr) { window._brErr = err; console.warn('brilho do refino', err); } } }
    return r;
  };
  // a Ficha e a dica do item contam o efeito
  if (typeof statsItemTxt === 'function') {
    const _sit = statsItemTxt;
    statsItemTxt = function (id, r) { const t = _sit.apply(this, arguments); if (!r || r < 7 || !ITENS[id] || ITENS[id].tipo !== 'equip') return t; const efeito = r >= 10 ? '✨ +10: a peça fica ACESA no seu boneco!' : r === 9 ? '✨ +9: brilho forte e faíscas no boneco' : r === 8 ? '✨ +8: a peça brilha no boneco' : '✨ +7: um reflexo de luz passa pela peça'; return Array.isArray(t) ? [...t, efeito] : typeof t === 'string' ? t + ' · ' + efeito : t; };
  }
}
