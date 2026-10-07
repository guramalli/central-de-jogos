/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📿 ACESSÓRIOS DO PESCOÇO E CHUTEIRA NO PÉ (v300)
   1) O apito/medalha no pescoço era um "V" de risco com um retângulo cinza, igual de frente e de lado.
      Agora cada acessório tem o SEU pingente (arte do Higgsfield, a/pg_*.webp) pendurado num cordão, fita
      ou corrente desenhados no formato certo para cada vista: de frente o cordão faz um "U" no peito;
      de lado ele desce do pescoço e o pingente fica na frente do peito; de costas só aparece o cordão na nuca.
      Colares de flores/pérolas, cachecóis e gravatas também foram redesenhados (com as 3 vistas).
   2) CHUTEIRA: o calçado do boneco ganha a cor da chuteira que você está usando (Chuteira de Ouro = dourada...).
   Carregar NO FIM (depois de boneco.js, game.js e visual_itens.js).
   ============================================================ */
{
  /* ---------- qual acessório é qual ---------- */
  // pingente: [arte, altura (unidades do boneco), tipo do cordão, cor(es) do cordão]
  const PING = {
    apito: ['apito_prata', 10, 'cordao', '#2a4aa0'], apito_ouro: ['apito_ouro', 10, 'cordao', '#d8282e'],
    apito_trovao: ['apito_trovao', 10, 'cordao', '#ffd23f'], apito_metro: ['apito_metro', 10.5, 'corrente', '#e8b830'],
    medalha_bronze: ['medalha_bronze', 11, 'fita', ['#2a5ad0', '#ffd23f']], medalha_prata: ['medalha_prata', 11, 'fita', ['#2a5ad0', '#f4f4f8']],
    medalha_ouro: ['medalha_ouro', 11, 'fita', ['#1a9a3a', '#ffd23f']], medalha_colecionador: ['medalha_colec', 11, 'fita', ['#ff5aa8', '#8a3ad0']],
    medalha_copa: ['medalha_copa', 12, 'fita', ['#1a9a3a', '#ffd23f']], estrela_campea: ['estrela', 11, 'corrente', '#f0c030'],
    amuleto_lunar: ['lua', 11, 'corrente', '#c8ccd8'], colar_perola: ['perola', 8.5, 'corrente', '#dcdce6'],
    amuleto_escaravelho: ['escaravelho', 10, 'corrente', '#e8b830'], bussola_dourada: ['bussola', 11, 'corrente', '#e8b830'],
    ankh_eterno: ['ankh', 12.5, 'corrente', '#e8b830'], colar_rubi: ['rubi', 11, 'cordao', '#8a1a22'],
  };
  const PING_PADRAO = { apito: 'apito', medalha: 'medalha_ouro' }; // NPCs (sem item): o apito prata e a medalha de ouro
  const SEM_AVATAR = { apito_metro: 'pescoco-apito', amuleto_escaravelho: 'pescoco-medalha', bussola_dourada: 'pescoco-medalha', ankh_eterno: 'pescoco-medalha', colar_rubi: 'pescoco-medalha' };
  const COLAR = { colar_havaiano: 'havaiano', colar_carnaval: 'carnaval', colar_perolas: 'perolas' };
  const CACHECOL = { cachecol: ['#f4f6fb', '#6ab0ff'], echarpe_paris: ['#2a3a7a', '#e8323c'], cachecol_nevasca: ['#9ad8ff', '#ffffff'] }; // [cor, listras]
  const GRAVATA = { gravata_londres: ['#1c2a5a', '#e8b830'] };

  const ARTES = [...new Set(Object.values(PING).map(p => 'pg_' + p[0]))];
  for (const n of ARTES) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  { const vai = () => (typeof G !== 'undefined' && G.rodando) ? ARTES.forEach(n => { try { spr(n); } catch (e) { } }) : setTimeout(vai, 2000); setTimeout(vai, 1200); } // v407 (Raio-X A2): só depois que o jogo abre (não na tela inicial)
  let faltou = false; // desenhou sem a arte (ainda carregando): quando chegar, redesenha os bonecos
  // v319: quem falhou de vez (sem internet) não segura os outros; o cache só é refeito quando tudo chegou ou desistiu
  setInterval(() => { if (faltou && ARTES.every(n => { const e = SPR[n]; return !e || e.ok || e.err; })) { faltou = false; try { SPR_CACHE.clear(); } catch (e) { } } }, 700);

  /* ---------- chuteira: a cor do calçado ---------- */
  const COR_PE = {
    tenis_velho: '#e6e2da', chuteira_couro: '#7a4424', chuteira_society: '#2ad96a', chuteira_travas: '#d92a5a', chuteira_pro: '#ff7a1a',
    chuteira_ouro: '#f0c030', chuteira_dunas: '#e0b050', chuteira_shinkansen: '#eef0f6', chuteira_surfista: '#3ad0e0', chuteira_elite: '#b8bcc8',
    chuteira_lenda: '#e2e6ee', chuteira_mundo: '#18a6b8', chuteira_tita: '#c0392b', chuteira_galaxia: '#4a34c8', chuteira_trovao: '#4f7ae0',
    chuteira_sol: '#ff9a10', chuteira_cristal: '#8ad8ff', chuteira_eterna: '#e8c060', chuteira_campea: '#f0c030', chuteira_coral: '#ff6f61',
    chuteira_abissal: '#1a3a8a', chuteira_draconica: '#d03a1a', chuteira_lunar: '#c8d0e0', chuteira_marciana: '#c0401a', chuteira_estelar: '#3a3aa8',
    chuteira_galactica: '#9a2aa8', chuteira_ultimo_trem: '#c89a38', sandalia_nilo: '#e0b040', chuteira_fogo: '#e0401a', chuteira_magma: '#b8341a',
    chuteira_supernova: '#ffd060',
  }; // chinelo e chuteira de pano: o calçado escuro de sempre

  const _lookPesc = lookJogador;
  lookJogador = function (retrato) {
    const L = _lookPesc.apply(this, arguments);
    try {
      const eq = G.save && G.save.equip; if (!L || !eq || L.folha) return L;
      const a = eq.acessorio;
      if (a && ITENS[a]) {
        if (!L.pescoco && SEM_AVATAR[a] && !retrato) L.pescoco = SEM_AVATAR[a];
        if (L.pescoco) { L.pescocoVar = a; delete L._kb; }
      }
      const ch = eq.chuteira, cor = ch && (ITENS[ch] && ITENS[ch].corPe || COR_PE[ch]);
      if (cor) { L.corPe = cor; delete L._kb; }
    } catch (e) { }
    return L;
  };
  const _specPesc = specDe;
  specDe = function (look) {
    const sp = _specPesc.apply(this, arguments);
    if (look && look.pescocoVar) sp.pescocoVar = look.pescocoVar;
    return sp;
  };

  /* ---------- desenho do pescoço (coordenadas do boneco: (50,80) = alto do tronco, ~29 de largura de frente) ---------- */
  const LINHA = '#2a1e2e';
  function risco(x, fn, cor, lw, contorno = true) {
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    if (contorno) { x.beginPath(); fn(); x.strokeStyle = LINHA; x.lineWidth = lw + 1.1; x.stroke(); }
    x.beginPath(); fn(); x.strokeStyle = cor; x.lineWidth = lw; x.stroke(); x.restore();
  }
  function corrente(x, fn, cor) {
    risco(x, fn, bEsc(cor, 0.35), 1.25);
    x.save(); x.setLineDash([1.1, 0.9]); x.lineCap = 'round'; x.beginPath(); fn(); x.strokeStyle = bClaro(cor, 0.45); x.lineWidth = 0.9; x.stroke(); x.restore();
  }
  // o cordão (fn = o caminho) no estilo do acessório
  function cordao(x, tipo, cor, fn, fnFita) {
    if (tipo === 'corrente') corrente(x, fn, cor);
    else if (tipo === 'fita') { const [c1, c2] = cor; fnFita(c1, c2); }
    else risco(x, fn, cor, 1.1);
  }
  function fitaV(x, lx, yb, c1, c2) { // fita de medalha, em "V", cada lado de uma cor
    const lado = (s, c) => { const p = P(); p.moveTo(lx + s * 6.8, 79.8); p.lineTo(lx + s * 4.1, 79.8); p.lineTo(lx + s * 0.2, yb + 0.6); p.lineTo(lx + s * 2.6, yb - 1.3); p.closePath(); pinta(x, p, c, { lw: 0.9, k: 0.25, dx: -0.8, dy: -0.6 }); };
    lado(-1, c1); lado(1, c2);
  }
  function pingente(x, nome, cx, cy, alt, sx = 1, halo = false) {
    if (halo) { x.save(); const g = x.createRadialGradient(cx, cy + alt * 0.5, 0, cx, cy + alt * 0.5, alt * 0.75); g.addColorStop(0, 'rgba(255,250,225,0.55)'); g.addColorStop(1, 'rgba(255,250,225,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy + alt * 0.5, alt * 0.75 * sx, alt * 0.75, 0, 0, 7); x.fill(); x.restore(); }
    const im = aSprite('pg_' + nome); if (!im) { faltou = true; x.save(); x.fillStyle = '#e8b830'; x.strokeStyle = LINHA; x.lineWidth = 0.9; x.beginPath(); x.arc(cx, cy + alt * 0.4, alt * 0.32, 0, 7); x.fill(); x.stroke(); x.restore(); return; }
    const meta = PG_META[nome] || [0.5], w = alt * im.width / im.height;
    x.save(); x.imageSmoothingQuality = 'high'; x.translate(cx, cy); x.scale(sx, 1); x.drawImage(im, -meta[0] * w, -0.4, w, alt); x.restore();
  }
  const PG_META = { apito_prata: [0.752], apito_ouro: [0.748], apito_trovao: [0.73], apito_metro: [0.55] };

  // v319: nome próprio — "flor" vazava para o global e trocava o flor() do arte.js (florzinhas dos desenhos)
  function florColar(x, cx, cy, r, cor, miolo) {
    x.save(); x.fillStyle = cor; x.strokeStyle = LINHA; x.lineWidth = 0.55;
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; x.beginPath(); x.arc(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.52, 0, 7); x.fill(); x.stroke(); }
    x.fillStyle = miolo; x.beginPath(); x.arc(cx, cy, r * 0.36, 0, 7); x.fill(); x.restore();
  }
  function perola(x, cx, cy, r) {
    x.save(); x.fillStyle = '#f6f2ee'; x.strokeStyle = '#8a8298'; x.lineWidth = 0.5; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx - r * 0.35, cy - r * 0.35, r * 0.35, 0, 7); x.fill(); x.restore();
  }
  // pontos ao longo de uma curva quadrática
  const qpt = (t, a, b, c) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]];
  function colar(x, tipo, v, lx) {
    const CORES = tipo === 'carnaval' ? [['#ff3a8a', '#ffe14a'], ['#ffd23f', '#ff6a1a'], ['#3ad0ff', '#ffffff'], ['#8a4aff', '#ffe14a'], ['#3ae07a', '#ffffff']] : [['#ff6ab0', '#ffe14a'], ['#ffffff', '#ffc83a'], ['#ffd23f', '#ff8a3a'], ['#ff8a3a', '#ffe14a']];
    let A, B, C, n, t0 = 0, t1 = 1;
    if (v === 'f') { A = [lx - 8.5, 80.6]; B = [lx, 95.5]; C = [lx + 8.5, 80.6]; n = tipo === 'perolas' ? 15 : 8; }
    else if (v === 'l') { A = [lx - 3.5, 80]; B = [lx + 3, 89.5]; C = [lx + 7.5, 83]; n = tipo === 'perolas' ? 9 : 4; t1 = 0.95; }
    else { A = [lx - 9, 80]; B = [lx, 84.5]; C = [lx + 9, 80]; n = tipo === 'perolas' ? 13 : 6; }
    if (tipo === 'perolas') { risco(x, () => { x.moveTo(...A); x.quadraticCurveTo(...B, ...C); }, '#c8c0d0', 0.5, false); }
    for (let i = 0; i < n; i++) {
      const t = t0 + (t1 - t0) * (n === 1 ? 0.5 : i / (n - 1)), [px, py] = qpt(t, A, B, C);
      if (tipo === 'perolas') perola(x, px, py, 1.45); else { const [c, m] = CORES[i % CORES.length]; florColar(x, px, py, 2.15, c, m); }
    }
  }
  function cachecol(x, var_, v, lx) {
    const [cor, lis] = CACHECOL[var_] || ['#e03a3a', '#ffffff'];
    const faixa = (p, lx0, lx1) => { pinta(x, p, cor, { lw: 1.1 }); x.save(); x.clip(p); x.fillStyle = lis; for (let xx = lx0; xx < lx1; xx += 5) x.fillRect(xx, 70, 1.6, 40); x.restore(); };
    if (v === 'c') { const p = pRR(lx - 11.5, 78.6, 23, 5.4, 2.7); faixa(p, lx - 11.5, lx + 11.5); const r = pRR(lx - 5, 82, 5, 12, 1.8); pinta(x, r, cor, { lw: 1 }); return; }
    if (v === 'l') { const p = pRR(lx - 8.5, 78.6, 16.5, 5.6, 2.8); faixa(p, lx - 8.5, lx + 8); const r = P(); r.moveTo(lx + 3, 83); r.lineTo(lx + 7.5, 83); r.lineTo(lx + 8.5, 95); r.lineTo(lx + 4, 95); r.closePath(); pinta(x, r, cor, { lw: 1 }); x.fillStyle = lis; x.fillRect(lx + 4.2, 91, 4.2, 1.4); franja(x, lx + 4, lx + 8.5, 95); return; }
    const p = pRR(lx - 12.5, 78.6, 25, 5.8, 2.9); faixa(p, lx - 12.5, lx + 12.5);
    const r = P(); r.moveTo(lx + 3, 83.5); r.lineTo(lx + 8.5, 83.5); r.lineTo(lx + 9.5, 97); r.lineTo(lx + 3.8, 97); r.closePath(); pinta(x, r, cor, { lw: 1 });
    x.fillStyle = lis; x.fillRect(lx + 4, 92.5, 5.4, 1.5); franja(x, lx + 3.8, lx + 9.5, 97);
  }
  function franja(x, x0, x1, y) { x.save(); x.strokeStyle = LINHA; x.lineWidth = 0.6; for (let xx = x0 + 0.6; xx <= x1; xx += 1.3) { x.beginPath(); x.moveTo(xx, y); x.lineTo(xx, y + 2); x.stroke(); } x.restore(); }
  function gravata(x, var_, v, lx) {
    if (v === 'c') return;
    const [cor, lis] = GRAVATA[var_] || ['#c02a3a', bEsc('#c02a3a', 0.3)];
    const cx = v === 'l' ? lx + 6 : lx, k = v === 'l' ? 0.55 : 1;
    const no = P(); no.moveTo(cx - 2.4 * k, 79.5); no.lineTo(cx + 2.4 * k, 79.5); no.lineTo(cx + 1.6 * k, 83); no.lineTo(cx - 1.6 * k, 83); no.closePath();
    const lam = P(); lam.moveTo(cx - 1.6 * k, 83); lam.lineTo(cx + 1.6 * k, 83); lam.lineTo(cx + 3 * k, 97); lam.lineTo(cx, 100); lam.lineTo(cx - 3 * k, 97); lam.closePath();
    pinta(x, lam, cor, { lw: 1 }); x.save(); x.clip(lam); x.strokeStyle = lis; x.lineWidth = 1.1; for (let y = 84; y < 104; y += 3.6) { x.beginPath(); x.moveTo(cx - 5, y); x.lineTo(cx + 5, y - 3); x.stroke(); } x.restore();
    pinta(x, no, cor, { lw: 1 });
  }

  pescoco = function (x, sp, v) {
    const n = sp.pescoco; if (!n) return;
    const it = sp.pescocoVar, lx = 50;
    try {
      if (n === 'apito' || n === 'medalha') {
        const [nome, alt, tipo, cor] = PING[it] && (PING[it][2] !== undefined) ? PING[it] : PING[PING_PADRAO[n]];
        if (v === 'c') { // de costas: só o cordão na nuca
          const c1 = Array.isArray(cor) ? cor[0] : cor;
          cordao(x, tipo === 'fita' ? 'cordao' : tipo, c1, () => { x.moveTo(lx - 6, 79.4); x.quadraticCurveTo(lx, 82.5, lx + 6, 79.4); });
          return;
        }
        if (v === 'l') { // de lado: o cordão desce do pescoço para a frente do peito, o pingente fica de perfil
          const bx = lx + 7.5, by = 87.5, c1 = Array.isArray(cor) ? cor[1] : cor;
          if (tipo === 'fita') { const p = P(); p.moveTo(lx + 0.8, 79.4); p.lineTo(lx + 3.4, 79.4); p.lineTo(bx + 1.2, by); p.lineTo(bx - 1.6, by + 0.3); p.closePath(); pinta(x, p, c1, { lw: 0.9, k: 0.25, dx: -0.8, dy: -0.6 }); }
          else cordao(x, tipo, c1, () => { x.moveTo(lx + 1.8, 79.4); x.quadraticCurveTo(lx + 6.5, 81.5, bx, by); });
          pingente(x, nome, bx, by - 0.4, alt * 1.0, 0.62, true);
          return;
        }
        const by = tipo === 'fita' ? 89 : 88.6;
        cordao(x, tipo, cor, () => { x.moveTo(lx - 5.8, 79.6); x.quadraticCurveTo(lx - 3.8, by - 0.5, lx, by); x.quadraticCurveTo(lx + 3.8, by - 0.5, lx + 5.8, 79.6); }, (c1, c2) => fitaV(x, lx, by, c1, c2));
        pingente(x, nome, lx, by - 0.4, alt * 1.08, 1, true);
        return;
      }
      if (n === 'havaiano') { colar(x, COLAR[it] || 'havaiano', v, lx); return; }
      if (n === 'cachecol') { cachecol(x, it, v, lx); return; }
      if (n === 'gravata') { gravata(x, it, v, lx); return; }
    } catch (e) { }
  };

  /* ---------- a chuteira pinta o calçado do boneco ---------- */
  let PE = null;
  const _sprPe = spriteBoneco;
  spriteBoneco = function (look) {
    if (!look || !look.corPe) return _sprPe.apply(this, arguments);
    PE = look.corPe; try { return _sprPe.apply(this, arguments); } finally { PE = null; }
  };
  const _tingePe = tingeCelula;
  tingeCelula = function (base, cores) {
    const out = _tingePe.apply(this, arguments);
    if (!PE || (typeof MODO_AGORA !== 'undefined' && MODO_AGORA === 'skin') || !cores || !base || !base.d) return out;
    try { pintaPe(out, base, PE); } catch (e) { }
    return out;
  };
  function pintaPe(out, base, cor) {
    const { d, rot, lum } = base, W = FOLHA_CW, H = FOLHA_CH;
    let y0 = -1, y1 = -1;
    for (let y = 0; y < H; y++) { let tem = false; for (let xx = 0; xx < W; xx += 2) if (d[(y * W + xx) * 4 + 3] > 20) { tem = true; break; } if (tem) { if (y0 < 0) y0 = y; y1 = y; } }
    if (y0 < 0) return;
    const lim = y1 - (y1 - y0) * 0.2, idx = []; // (no passo, o pé de trás sobe)
    for (let y = Math.floor(lim); y <= y1; y++) for (let xx = 0; xx < W; xx++) {
      const i = y * W + xx; if (d[i * 4 + 3] < 40 || rot[i] === 4 || rot[i] === 3) continue;
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], mx = Math.max(r, g, b) / 255;
      if (mx > 0.62 || mx < 0.2) continue; // meia branca e contorno ficam como estão
      let meia = false; // a borda lateral da meia (colada num pixel branco na mesma linha) também fica
      for (let dx = -2; dx <= 2 && !meia; dx++) { const j = (i + dx) * 4; if (dx && xx + dx >= 0 && xx + dx < W && Math.min(d[j], d[j + 1], d[j + 2]) > 190) meia = true; }
      for (let k = -2; k <= 2 && !meia; k++) if (k && (rot[i + k] === 4 || rot[i + k * W] === 4)) meia = true; // e o contorno da canela (colado na pele)
      if (!meia) idx.push(i);
    }
    if (idx.length < 20) return;
    const v = idx.map(i => lum[i] || Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) / 255).sort((a, b) => a - b), ref = v[v.length >> 1] || 0.3;
    const x = out.getContext('2d'), img = x.getImageData(0, 0, W, H), o = img.data, t = bRgb(cor);
    for (const i of idx) {
      const f = (lum[i] || Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) / 255) / ref;
      for (let j = 0; j < 3; j++) o[i * 4 + j] = f <= 1 ? t[j] * (0.35 + 0.65 * f) : Math.min(255, t[j] + (255 - t[j]) * (f - 1) * 0.7);
    }
    x.putImageData(img, 0, 0);
  }
  window.COR_PE_CHUTEIRA = COR_PE; // (para os testes)
}
