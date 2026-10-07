/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ✨ ADORNOS NOVOS (v359 — dono: "algo diferente de asas... e alguns para premium na Steam")
   Em Equipamento → ✨ Adornos, além das asas/aura/halo:
   - 🔥 RASTRO ao correr: Grama (nv 150), Fogo (nv 250), Estrelas (nv 500), Arco-íris (⭐ Pacote Lendário)
   - 🐾 MASCOTE que te segue: Caramelo (Torre andar 25), Arara (10 itens míticos), Mini-Robô (vencer o Supremo da Galáxia),
     Dragãozinho (⭐)  — artes a/pet_<id>_c1..c4 (Higgsfield)
   - 👑 COROA: Chamas Azuis (nv 600), Auréola de Raios (nv 800)   (no lugar do Halo de Campeão)
   - 🎉 COMEMORAÇÃO ao derrubar um chefão: Confete e Fogos (nv 300), Fogos Dourados (⭐)
   - ✨ Bola Satélite (nv 350), Pegadas de Luz (nv 400), Capa do Herói (3 chefões de arena diferentes),
     Holofote (Torre andar 50), Bandeirão do seu clube (ter uma Lenda na Agência)
   - ⭐ Pacote Lendário (só Steam, compra): Prancha Flutuante, Moldura Lendária no nome, Arco-íris, Dragãozinho,
     Fogos Dourados — tudo só VISUAL (nenhuma vantagem no jogo).
   Fica salvo em save.adornos2. Quase tudo é desenhado por código (partículas); arte só nos mascotes, coroas e prancha.
   Carregar DEPOIS de adornos.js.
   ============================================================ */
{
  const PET_ARTE = { caramelo: 'pet_caramelo2' }; // v360: caramelo refeito (o 1º tinha patas a mais)
  const petNome = id => PET_ARTE[id] || `pet_${id}`;
  const ART = ['ad_coroa_chamas', 'ad_aureola_raios', 'ad_prancha', ...['sortudo', 'pipoca', 'caramelo', 'arara', 'robo', 'dragao', 'tricerinho', 'polvinho', 'corujinha'].flatMap(p => [1, 2, 3, 4].map(k => `${petNome(p)}_c${k}`))];
  for (const n of ART) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  const premium = () => typeof prem === 'function' && prem('lendario'); // (jogo_extra/premium.js, só na Steam)
  const nv = () => (G.save && G.save.nivel) || 1;
  const torreMax = () => { try { return (G.save.torre && G.save.torre.max) || 0; } catch (e) { return 0; } };
  const miticos = () => { try { return ARENAS.reduce((t, a) => t + regArena(a.id).itens.length, 0); } catch (e) { return 0; } };
  const arenasVencidas = () => { try { return ARENAS.filter(a => regArena(a.id).vitorias > 0).length; } catch (e) { return 0; } };
  const lendasAg = () => { try { return ((G.save.agencia && G.save.agencia.lendas) || []).length; } catch (e) { return 0; } };
  const PREM = { ok: premium, txt: '⭐ Legendary Pack (Steam)' };
  const porNivel = n => ({ ok: () => nv() >= n, txt: `🔒 Level ${n}` });
  // [grupo, id, nome, emoji, regra, descrição]
  const OPCOES = {
    rastro: [['grama', 'Grass Trail', '🌱', porNivel(150), 'Little leaves and dirt flying behind you as you run.'],
      ['fogo', 'Fire Trail', '🔥', porNivel(250), 'Flames left along your path when you run.'],
      ['estrelas', 'Star Trail', '⭐', porNivel(500), 'Little stars sparkling wherever you go.'],
      ['arcoiris', 'Rainbow Trail', '🌈', PREM, 'A rainbow stripe behind you.']],
    mascote: [['pipoca', 'Pipoca, the Little Mutt', '🐕', { ok: () => !!(G.save && G.save.flags && G.save.flags.pet_pipoca), txt: '🔒 Aunt Zuzu\'s Mission (Village, level 12)' }, 'A mutt puppy who loves popcorn. Brings extra coins from hunts.'], // v370
      ['sortudo', 'Sortudo, the Lucky Kitty', '🐱', { ok: () => !!(G.save && G.save.flags && G.save.flags.pet_sortudo), txt: '🔒 Dona Yuki\'s Mission (Tokyo, level 72)' }, 'A Japanese lucky kitty. Makes opponents drop more items.'], // v372
      ['caramelo', 'Caramelo', '🐶', { ok: () => torreMax() >= 25, txt: '🔒 Tower floor 25' }, 'The most loyal pup on the pitch.'],
      ['arara', 'Star Macaw', '🦜', { ok: () => miticos() >= 10, txt: '🔒 10 mythic items' }, 'Flies beside you with a fan banner.'],
      ['robo', 'Mini-Robot', '🤖', { ok: () => !!(G.save && G.save.flags && G.save.flags.venceu_ch_supremo), txt: '🔒 Beat the Galaxy Supreme' }, 'A ball for a head, a striker’s heart.'],
      ['dragao', 'Baby Dragon', '🐉', PREM, 'A baby dragon with a ball on the tip of its tail. Gives +damage like the Macaw, once you unlock the Macaw by playing.'],
      ['tricerinho', 'Tricy', '🦕', { ok: () => !!(G.save && G.save.flags && G.save.flags.pet_tricerinho), txt: '🔒 Hatch an egg from the Jurassic Valley' }, 'A baby triceratops hatched in the Jurassic Valley. Super rare!']], // v364
    coroa: [['chamas', 'Blue Flame Crown', '🔵', porNivel(600), 'Blue fire on top of your head (replaces the halo).'],
      ['raios', 'Lightning Halo', '⚡', porNivel(800), 'A ring of crackling lightning above you.']],
    comemora: [['confete', 'Confetti', '🎊', porNivel(300), 'A shower of confetti when you take down a boss.'],
      ['fogos', 'Fireworks', '🎆', porNivel(300), 'Colorful fireworks when you take down a boss.'],
      ['fogos_ouro', 'Golden Fireworks', '🎇', PREM, 'Golden fireworks and a shower of sparkles.']],
    extra: [['bola', 'Satellite Ball', '⚽', porNivel(350), 'A glowing ball orbiting around you.'],
      ['pegadas', 'Light Footprints', '👣', porNivel(400), 'Glowing footprints that fade behind you.'],
      ['capa', 'Hero’s Cape', '🦸', { ok: () => arenasVencidas() >= 3, txt: '🔒 Beat 3 arena bosses' }, 'A cape on your back (replaces the wings).'],
      ['holofote', 'Spotlight', '🔦', { ok: () => torreMax() >= 50, txt: '🔒 Tower floor 50' }, 'The stadium spotlight always on you.'],
      ['bandeira', 'Club Flag', '🚩', { ok: () => lendasAg() >= 1, txt: '🔒 Have an Agency Legend' }, 'A flag in your club’s colors.'],
      ['prancha', 'Hoverboard', '🛹', PREM, 'You glide around on a floating board (visual only).'],
      ['moldura', 'Legendary Frame', '🏅', PREM, 'Your name on a shiny golden plate.']],
  };
  const IMG = { sortudo: 'pet_sortudo_c1', pipoca: 'pet_pipoca_c1', polvinho: 'pet_polvinho_c1', corujinha: 'pet_corujinha_c1', tricerinho: 'pet_tricerinho_c1', caramelo: 'pet_caramelo2_c1', arara: 'pet_arara_c1', robo: 'pet_robo_c1', dragao: 'pet_dragao_c1', chamas: 'ad_coroa_chamas', raios: 'ad_aureola_raios', prancha: 'ad_prancha' };
  const UNICO = { rastro: true, mascote: true, coroa: true, comemora: true }; // escolhe um (ou nenhum)
  const cfg = () => { const s = G.save; if (!s) return {}; if (!s.adornos2 || typeof s.adornos2 !== 'object') s.adornos2 = {}; return s.adornos2; };
  const acha = (g, id) => (OPCOES[g] || []).find(o => o[0] === id);
  const liberado = (g, id) => { const o = acha(g, id); try { return !!(o && o[3].ok()); } catch (e) { return false; } };
  function atual(g) { // unicos: id escolhido (se ainda liberado); extras: lista dos ligados
    const c = cfg();
    if (UNICO[g]) return c[g] && liberado(g, c[g]) ? c[g] : null;
    return OPCOES.extra.filter(o => c[o[0]] && liberado('extra', o[0])).map(o => o[0]);
  }
  const ligado = id => atual('extra').includes(id);
  window.ADORNOS2 = { OPCOES, atual, liberado, cfg, get PET() { return PET; }, petNome, festa: (t, x, y) => festa(t, x, y) }; // (testes)

  /* ---------- partículas (rastro, pegadas, comemoração) ---------- */
  const P = [], PEG = []; let ultT = 0, ultPeg = null, ladoPeg = 1;
  const rnd = (a, b) => a + Math.random() * (b - a);
  function soltaRastro(tipo, x, y) {
    if (P.length > 260) return;
    const t = G.agora;
    if (tipo === 'grama') { P.push({ k: 'folha', x: x + rnd(-0.2, 0.2), y: y + rnd(-0.05, 0.1), vx: rnd(-0.6, 0.6), vy: rnd(-1.6, -0.8), g: 3.2, t0: t, dur: 650, cor: ['#4caf3a', '#7ad04a', '#3a8a2a', '#8a6a3a'][(Math.random() * 4) | 0], r: rnd(2, 3.5) }); }
    if (tipo === 'fogo') { P.push({ k: 'chama', x: x + rnd(-0.18, 0.18), y: y + rnd(-0.05, 0.05), vx: rnd(-0.1, 0.1), vy: rnd(-1.2, -0.6), g: 0, t0: t, dur: 600, r: rnd(7, 12) }); }
    if (tipo === 'estrelas') { P.push({ k: 'estrela', x: x + rnd(-0.3, 0.3), y: y - rnd(0, 0.6), vx: 0, vy: -0.15, g: 0, t0: t, dur: 900, r: rnd(2.5, 5), cor: Math.random() < 0.5 ? '#ffffff' : '#ffe56a' }); }
    if (tipo === 'arcoiris') { P.push({ k: 'arco', x, y: y - 0.25, vx: 0, vy: 0, g: 0, t0: t, dur: 700 }); }
  }
  function festa(tipo, x, y) {
    const t = G.agora;
    if (tipo === 'confete') for (let i = 0; i < 70; i++) P.push({ k: 'confete', x: x + rnd(-1.6, 1.6), y: y - rnd(2.2, 3.4), vx: rnd(-0.5, 0.5), vy: rnd(0, 0.6), g: 1.1, t0: t + rnd(0, 500), dur: 2200, cor: ['#ff4a6a', '#ffd23a', '#4ad0ff', '#6ae06a', '#c070ff'][i % 5], r: rnd(2.5, 4), rot: rnd(0, 6) });
    if (tipo === 'fogos' || tipo === 'fogos_ouro') for (let f = 0; f < 4; f++) {
      const cx = x + rnd(-2, 2), cy = y - rnd(2.5, 4), t1 = t + f * 380, cores = tipo === 'fogos_ouro' ? ['#ffd23a', '#fff0a0', '#ffb020'] : ['#ff4a6a', '#4ad0ff', '#6ae06a', '#ffd23a', '#c070ff'];
      P.push({ k: 'foguete', x: cx, y: y - 0.3, vx: 0, vy: -(y - 0.3 - cy) / 0.45, g: 0, t0: t1, dur: 450 });
      for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; P.push({ k: 'faisca', x: cx, y: cy, vx: Math.cos(a) * rnd(1.3, 2.2), vy: Math.sin(a) * rnd(1.3, 2.2), g: 0.9, t0: t1 + 450, dur: 1100, cor: cores[i % cores.length], r: rnd(2, 3.2) }); }
    }
    if (tipo === 'fogos_ouro') for (let i = 0; i < 40; i++) P.push({ k: 'estrela', x: x + rnd(-2, 2), y: y - rnd(0.5, 3.5), vx: 0, vy: 0.3, g: 0, t0: t + rnd(400, 1600), dur: 1200, r: rnd(2.5, 5), cor: '#ffe56a' });
  }
  function desenhaParticulas(ctx) {
    const agora = G.agora;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i], k = (agora - p.t0) / p.dur; if (k < 0) continue; if (k >= 1) { P.splice(i, 1); continue; }
      const s = (agora - p.t0) / 1000, x = (p.x + p.vx * s) * T, y = (p.y + p.vy * s + 0.5 * p.g * s * s) * T, a = 1 - k;
      ctx.save(); ctx.globalAlpha *= Math.min(1, a * 1.4);
      if (p.k === 'folha' || p.k === 'confete') { ctx.translate(x, y); ctx.rotate((p.rot || 0) + s * 6); ctx.fillStyle = p.cor; ctx.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9); }
      else if (p.k === 'chama') { const r = p.r * (1 - k * 0.45), g = ctx.createRadialGradient(x, y + r * 0.3, 0, x, y, r); g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(0.35, 'rgba(255,190,40,0.95)'); g.addColorStop(0.7, 'rgba(240,80,20,0.75)'); g.addColorStop(1, 'rgba(200,30,10,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
      else if (p.k === 'estrela' || p.k === 'faisca') { ctx.globalCompositeOperation = 'lighter'; const r = p.r * (p.k === 'estrela' ? Math.sin(k * Math.PI) : 1); ctx.fillStyle = p.cor; ctx.beginPath(); for (let j = 0; j < 8; j++) { const an = j / 8 * Math.PI * 2, rr = j % 2 ? r * 0.4 : r; ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } ctx.fill(); }
      else if (p.k === 'foguete') { ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); ctx.globalAlpha *= 0.5; ctx.fillRect(x - 1, y, 2, 14); }
      else if (p.k === 'arco') { const cores = ['#ff4a4a', '#ffa63a', '#ffe14a', '#5ad85a', '#4aa6ff', '#9a5aff']; ctx.globalAlpha *= 0.55; cores.forEach((c, j) => { ctx.fillStyle = c; ctx.fillRect(x - 7, y - 9 + j * 3, 14, 3); }); }
      ctx.restore();
    }
    // pegadas de luz
    for (let i = PEG.length - 1; i >= 0; i--) {
      const p = PEG[i], k = (agora - p.t0) / 2600; if (k >= 1) { PEG.splice(i, 1); continue; }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= (1 - k) * 0.85; ctx.translate(p.x * T, p.y * T); ctx.rotate(p.ang);
      ctx.fillStyle = 'rgba(140,230,255,0.9)'; ctx.beginPath(); ctx.ellipse(0, -2, 3.2, 5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 5, 2.4, 2.6, 0, 0, 7); ctx.fill(); ctx.restore();
    }
  }

  /* ---------- mascote ---------- */
  const PET = { x: null, y: null, fase: 0, mov: false, flip: false };
  const PET_VOA = new Set(['arara', 'dragao', 'corujinha', 'bolinha_esquecida']), PET_ALT = { sortudo: 0.6, pipoca: 0.58, caramelo: 0.62, arara: 0.55, robo: 0.7, dragao: 0.62, tricerinho: 0.56, polvinho: 0.55, corujinha: 0.55, bolinha_esquecida: 0.45 }; // v410: Bolinha Esquecida (copa_esquecidos.js) flutua
  function atualizaPet(e, dt) {
    const id = atual('mascote'); if (!id) { PET.x = null; return null; }
    const lado = e.flip ? 1 : -1, ax = e.x + lado * 0.9, ay = e.y + 0.15;
    if (PET.x == null || Math.hypot(PET.x - e.x, PET.y - e.y) > 6) { PET.x = ax; PET.y = ay; }
    const dx = ax - PET.x, dy = ay - PET.y, d = Math.hypot(dx, dy);
    PET.mov = d > 0.12; if (PET.mov) { const v = Math.min(d, Math.max(0.02, d * 0.08) * dt / 16); PET.x += dx / d * v; PET.y += dy / d * v; PET.fase += dt / 110; if (Math.abs(dx) > 0.03) PET.flip = dx > 0; }
    return id;
  }
  function desenhaPet(ctx, id) {
    const voa = PET_VOA.has(id), q = voa || PET.mov ? 1 + Math.floor(voa ? G.agora / 130 : PET.fase) % 4 : 1;
    const arte = (window.petArte && window.petArte(id)) || petNome(id), esc = (window.petEscala && window.petEscala(id)) || 1;
    // v377 (dono: "o caramelo parado fica em posição de correr"): parado, os mascotes do chão usam a POSE PARADA (_p)
    const im = (!voa && !PET.mov && (aSprite(`${arte}_p`) || aSprite(`${petNome(id)}_p`))) || aSprite(`${arte}_c${q}`) || aSprite(`${petNome(id)}_c${q}`); if (!im) return;
    const h = PET_ALT[id] * T * (voa ? 1.2 : 1) * esc, w = h * im.width / im.height, x = PET.x * T, y = PET.y * T - (voa ? T * 0.55 + Math.sin(G.agora / 300) * 4 : 0);
    if (!voa) { ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, PET.y * T, w * 0.3, 4, 0, 0, 7); ctx.fill(); ctx.restore(); }
    else { ctx.save(); ctx.globalAlpha *= 0.18; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, PET.y * T, w * 0.22, 3, 0, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.translate(x, y); if (PET.flip) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
  }

  /* ---------- desenho junto do jogador ---------- */
  const _entA2 = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    if (e !== G.p || !G.save || G.p.morto || G.fut || G.jogoC) return _entA2.apply(this, arguments);
    const agora = G.agora || 0, dt = Math.min(60, agora - (ultT || agora)); ultT = agora;
    const montado = typeof montadoAgora === 'function' && montadoAgora();
    let petId = null, prancha = false;
    try {
      const rastro = atual('rastro');
      if (rastro && e.mov && Math.random() < (rastro === 'arcoiris' ? 0.9 : 0.55)) soltaRastro(rastro, e.x, e.y);
      if (ligado('pegadas') && e.mov) { if (!ultPeg || Math.hypot(e.x - ultPeg.x, e.y - ultPeg.y) > 0.42) { ladoPeg = -ladoPeg; const ang = ultPeg ? Math.atan2(e.y - ultPeg.y, e.x - ultPeg.x) + Math.PI / 2 : 0; PEG.push({ x: e.x + Math.cos(ang) * 0.09 * ladoPeg, y: e.y + Math.sin(ang) * 0.09 * ladoPeg, ang, t0: agora }); ultPeg = { x: e.x, y: e.y }; } }
      if (ligado('holofote')) { // cone de luz vindo de cima
        const x = e.x * T, y = e.y * T; ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(x, y - T * 4, x, y); g.addColorStop(0, 'rgba(255,250,210,0)'); g.addColorStop(1, 'rgba(255,250,210,0.22)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - T * 0.25, y - T * 4); ctx.lineTo(x + T * 0.25, y - T * 4); ctx.lineTo(x + T * 0.75, y); ctx.lineTo(x - T * 0.75, y); ctx.closePath(); ctx.fill();
        const r = ctx.createRadialGradient(x, y, 2, x, y, T * 0.8); r.addColorStop(0, 'rgba(255,250,210,0.35)'); r.addColorStop(1, 'rgba(255,250,210,0)'); ctx.fillStyle = r; ctx.beginPath(); ctx.ellipse(x, y, T * 0.8, T * 0.32, 0, 0, 7); ctx.fill(); ctx.restore();
      }
      desenhaParticulas(ctx);
      if (ligado('bandeira') && !montado) desenhaBandeira(ctx, e, agora);
      petId = atualizaPet(e, dt); if (petId && PET.y <= e.y) desenhaPet(ctx, petId);
      if (ligado('bola')) desenhaBolaSat(ctx, e, agora, false);
      prancha = ligado('prancha') && !montado && !(G.mapa && G.mapa.interior);
      if (prancha) { const im = aSprite('ad_prancha'); if (im) { const w = T * 1.05, h = w * im.height / im.width, bob = Math.sin(agora / 350) * 1.5; ctx.drawImage(im, e.x * T - w / 2, e.y * T - h * 0.55 + bob, w, h); } }
    } catch (err) { if (!window._a2err) { window._a2err = err; console.warn('adornos2', err); } }
    let res;
    if (prancha) { ctx.save(); ctx.translate(0, -T * 0.16 + Math.sin(agora / 350) * 1.5); res = _entA2.apply(this, arguments); ctx.restore(); }
    else res = _entA2.apply(this, arguments);
    try {
      if (ligado('bola')) desenhaBolaSat(ctx, e, agora, true);
      if (petId && PET.y > e.y) desenhaPet(ctx, petId);
      const coroa = atual('coroa');
      if (coroa && !montado) { const im = aSprite(coroa === 'chamas' ? 'ad_coroa_chamas' : 'ad_aureola_raios'); if (im && !(typeof coroaNaCabeca === 'function' && e === G.p && coroaNaCabeca(ctx, e, im, coroa, prancha, agora))) { const w = T * (coroa === 'chamas' ? 0.74 : 0.82), h = w * im.height / im.width, sobe = prancha ? T * 0.16 : 0, bob = Math.sin(agora / 420) * 2.2; const topo = e.y * T - sobe - alturaEnt(e) * T + bob, y0 = coroa === 'chamas' ? topo - h * 0.42 : topo - h * 0.38; ctx.save(); if (coroa === 'raios') ctx.globalAlpha *= 0.85 + 0.15 * Math.sin(agora / 70); ctx.drawImage(im, e.x * T - w / 2, y0, w, h); ctx.restore(); } }
    } catch (err) { if (!window._a2err) { window._a2err = err; console.warn('adornos2', err); } }
    return res;
  };
  function desenhaBolaSat(ctx, e, agora, frente) {
    const a = agora / 520, s = Math.sin(a); if ((s > 0) !== frente) return;
    const x = e.x * T + Math.cos(a) * T * 0.62, y = e.y * T - alturaEnt(e) * T * 0.45 + s * T * 0.18, r = T * 0.11;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 1, x, y, r * 2.6); g.addColorStop(0, 'rgba(160,230,255,0.6)'); g.addColorStop(1, 'rgba(160,230,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, 7); ctx.fill(); ctx.restore();
    if (typeof desenhaBola === 'function') desenhaBola(ctx, x, y, r, agora / 120);
  }
  function desenhaBandeira(ctx, e, agora) {
    const t = G.save.time, c1 = (t && t.cor1) || '#1a9a3a', c2 = (t && t.cor2) || '#ffd23a';
    const lado = e.flip ? 1 : -1, px = e.x * T + lado * T * 0.3, base = e.y * T - T * 0.3, topo = base - T * 2.15;
    ctx.save(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, base); ctx.lineTo(px, topo); ctx.stroke();
    const W = T * 0.85, H = T * 0.55, n = 10, onda = (u) => Math.sin(agora / 180 - u * 5) * 4 * u;
    const borda = new Path2D();
    for (let f = 0; f < 2; f++) { // faixa de cima (cor1) e de baixo (cor2), ondulando
      ctx.fillStyle = f ? c2 : c1; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const u = i / n, x = px + lado * u * W, y = topo + f * H / 2 + Math.sin(agora / 180 - u * 5) * 4 * u; ctx.lineTo(x, y); }
      for (let i = n; i >= 0; i--) { const u = i / n, x = px + lado * u * W, y = topo + (f + 1) * H / 2 + Math.sin(agora / 180 - u * 5) * 4 * u; ctx.lineTo(x, y); }
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i <= n; i++) { const u = i / n; borda.lineTo(px + lado * u * W, topo + onda(u)); } for (let i = n; i >= 0; i--) { const u = i / n; borda.lineTo(px + lado * u * W, topo + H + onda(u)); } borda.closePath();
    ctx.strokeStyle = 'rgba(40,20,10,0.75)'; ctx.lineWidth = 1.6; ctx.stroke(borda);
    ctx.fillStyle = '#fff'; ctx.font = `${Math.round(T * 0.26)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', px + lado * W * 0.45, topo + H / 2 + onda(0.45)); ctx.restore();
  }
  // capa: usa a arte de capa do jogo (no lugar das asas)
  const _lookA2 = lookJogador;
  lookJogador = function () {
    const L = _lookA2.apply(this, arguments);
    try { if (L && ligado('capa')) { L.costas = 'costas-capa'; delete L._kb; } } catch (e) { }
    return L;
  };
  if (typeof window.asaEscolhida === 'function') { const _asaA2 = window.asaEscolhida; window.asaEscolhida = lado => { try { if (ligado('capa')) return null; } catch (e) { } return _asaA2(lado); }; }
  // coroa no lugar do halo de campeão
  // moldura lendária na plaquinha do nome
  const _rotA2 = rotulo;
  rotulo = function (ctx, txt, x, y, cor, tam) {
    try {
      const s = G.save; if (s && ligado('moldura') && txt === `Lv ${s.nivel} ${s.nome}`) {
        const f = tam * G.dpr; ctx.font = `700 ${f}px Fredoka, Nunito, sans-serif`; const w = ctx.measureText(txt).width + f * 1.2, h = f * 1.5, x0 = x - w / 2, y0 = y - f * 1.05;
        const g = ctx.createLinearGradient(x0, y0, x0 + w, y0); const k = (G.agora / 1600) % 1;
        g.addColorStop(0, '#8a5a10'); g.addColorStop(Math.max(0, k - 0.12), '#d8a020'); g.addColorStop(k, '#fff3b0'); g.addColorStop(Math.min(1, k + 0.12), '#d8a020'); g.addColorStop(1, '#8a5a10');
        ctx.save(); ctx.fillStyle = 'rgba(40,20,0,0.75)'; ctx.beginPath(); ctx.roundRect(x0 - 2, y0 - 2, w + 4, h + 4, h / 2); ctx.fill(); ctx.strokeStyle = g; ctx.lineWidth = 2.5 * G.dpr; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, h / 2); ctx.stroke(); ctx.restore();
        return _rotA2.call(this, ctx, txt, x, y, '#ffe680', tam);
      }
    } catch (e) { }
    return _rotA2.apply(this, arguments);
  };
  // comemoração ao derrubar um chefão
  const _matarA2 = matar;
  matar = function (m) {
    const chefe = m && m.d && m.d.chefe && !m.d.treino;
    const r = _matarA2.apply(this, arguments);
    try { const c = atual('comemora'); if (chefe && c && G.p) festa(c, G.p.x, G.p.y); } catch (e) { }
    return r;
  };

  /* ---------- aviso de adorno novo ---------- */
  setInterval(() => {
    try {
      const s = G.save; if (!s || !G.rodando) return; const vis = s.adornosVistos = s.adornosVistos || [];
      const novos = []; for (const g in OPCOES) for (const o of OPCOES[g]) { const k = 'a2_' + o[0]; if (!vis.includes(k) && o[3] !== PREM && liberado(g, o[0])) { vis.push(k); novos.push(o[2]); } }
      if (novos.length) log(`✨ New cosmetic unlocked: ${novos.join(', ')}! Choose it in Equipment → ✨ Cosmetics.`, 'l-lvl');
    } catch (e) { }
  }, 4000);

  /* ---------- na janela de Adornos ---------- */
  // a janela de Adornos (adornos.js) se redesenha sozinha; aqui só acrescento as seções novas quando ela abre
  const _modalA2 = abreModal;
  abreModal = function () {
    _modalA2.apply(this, arguments);
    try {
      const box = document.querySelector('#modalConteudo .adornos'); if (!box || box.querySelector('.ad2')) return;
      const c = cfg(), refaz = fn => { fn(); G.uiSujo = true; try { salvar(); } catch (e) { } if (window.abreAdornos) window.abreAdornos(); };
      const botao = (g, o) => {
        const [id, nome, emo, regra, desc] = o, ok = liberado(g, id), on = UNICO[g] ? atual(g) === id : ligado(id), ehPrem = regra === PREM;
        return el('button', { type: 'button', class: 'ad-op' + (on ? ' on' : '') + (ok ? '' : ' fechado') + (ehPrem ? ' ad-prem' : ''), disabled: !ok,
          onclick: () => refaz(() => {
            const a = G.save.adornos = G.save.adornos || {};
            if (UNICO[g]) { c[g] = on ? null : id; if (g === 'coroa' && !on) a.halo = false; } else c[id] = !on;
            if (id === 'capa' && !on) a.asas = 'nenhuma';
          }) },
          amostra(id, emo), el('b', {}, nome), el('small', {}, ok ? (on ? 'Using (click to remove)' : 'Use') : regra.txt), el('i', {}, desc));
      };
      const amostra = (id, emo) => { // a arte (mascotes, coroas, prancha) ou o emoji
        const im = (PET_ALT[id] && window.petArte && (aSprite(window.petArte(id) + '_p') || aSprite(window.petArte(id) + '_c1'))) || (IMG[id] && aSprite(IMG[id])); if (!im) return el('span', { class: 'ad-img ad-emo' }, emo);
        const c = document.createElement('canvas'), h = 56, w = Math.round(h * im.width / im.height); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); c.className = 'ad-img'; return c;
      };
      const secao = (titulo, g) => [el('h3', {}, titulo), el('div', { class: 'ad-grade' }, ...OPCOES[g].map(o => botao(g, o)))];
      box.append(el('div', { class: 'ad2' }, ...secao('🔥 Running trail', 'rastro'), ...secao('🐾 Pet', 'mascote'), ...secao('👑 Crown', 'coroa'),
        ...secao('🎉 Celebration (when you take down a boss)', 'comemora'), ...secao('✨ More cosmetics', 'extra'),
        el('p', { class: 'dica' }, '⭐ = Legendary Pack, Steam version only. Everything here is just for looks, EXCEPT the pets: each pet gives your player a bonus that grows as it evolves by hunting with you (baby → young → adult).')));
    } catch (e) { console.warn('adornos2', e); }
  };
  const st = document.createElement('style');
  st.textContent = `.ad-emo { font-size: 34px; line-height: 50px; width: auto; } .ad-op.ad-prem { border-color: #c8a0ff; background: #f6efff; } .ad-op.ad-prem.on { border-color: #9a5aff; box-shadow: 0 0 0 2px #c8a0ff inset; }`;
  document.head.append(st);
}
