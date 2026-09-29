/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ✨ MAGIAS DOS ADVERSÁRIOS (v231), como no Tibia: fogo, veneno, onda de energia, ataques em área.
   FORMATOS: bola (3×3 em cima de você), onda (cone que abre à frente), raio (linha reta),
             anel (tudo em volta do adversário) e campo (chão que fica queimando/tóxico uns segundos).
   AVISO: os quadrados acendem na cor do elemento por 0,7 s antes do golpe — dá para desviar.
   ELEMENTOS: 🔥 fogo (queima 3 s) · 🟢 gosma tóxica (envenena 5 s) · ⚡ energia (tonto um instante)
     ❄️ gelo (mais lento) · 🏜️ areia (mais lento) · 🌊 água · 🐙 tinta (escurece a tela) · 🔊 sônico (tonto)
     🎉 confete (tonto) · 🪨 tremor (prende os pés).
   QUEM USA: cada cidade tem o seu elemento e cada arquétipo o seu formato; criaturas e ETs pelo que
   são (dragão = fogo, escorpião = gosma, polvo = tinta, yeti = gelo...). Abaixo do nível 20, ninguém.
   Artes: a/fx/fx_*.webp (chamas, veneno, energia, areia, tinta, sonico, confete, bolhas + as de antes).
   Carregar DEPOIS de fx.js e arquetipos.js.
   ============================================================ */
const MAG_EL = {
  fogo: { nome: '🔥 Chute de Fogo', cor: '255,120,40', fx: 'chamas', fx2: 'explosao', st: 'fogo' },
  veneno: { nome: '🟢 Gosma Tóxica', cor: '120,220,80', fx: 'veneno', st: 'veneno' },
  energia: { nome: '⚡ Onda de Energia', cor: '120,200,255', fx: 'energia', fx2: 'raio', st: 'tonto' },
  gelo: { nome: '❄️ Nevasca', cor: '190,235,255', fx: 'gelo', st: 'lento' },
  areia: { nome: '🏜️ Tempestade de Areia', cor: '232,200,120', fx: 'areia', st: 'lento' },
  agua: { nome: '🌊 Onda do Mar', cor: '80,170,255', fx: 'bolhas', fx2: 'onda', st: null },
  tinta: { nome: '🐙 Jato de Tinta', cor: '40,50,110', fx: 'tinta', st: 'tinta' },
  sonico: { nome: '🔊 Grito Sônico', cor: '200,170,255', fx: 'sonico', st: 'tonto' },
  confete: { nome: '🎉 Explosão de Confete', cor: '255,220,80', fx: 'confete', st: 'tonto' },
  terra: { nome: '🪨 Tremor', cor: '170,130,90', fx: 'poeira', fx2: 'raizes', st: 'preso' },
};
// cidade → elemento (Brasil: tremor; o mundo com a sua cara)
const MAG_CIDADE = { vila: 'terra', praia: 'agua', cidade: 'terra', ct: 'terra', estadio: 'energia', cairo: 'areia', toquio: 'energia', doha: 'fogo', miami: 'agua',
  lisboa: 'agua', madri: 'fogo', milao: 'veneno', munique: 'gelo', londres: 'sonico', paris: 'energia', buenos: 'fogo', rio: 'confete', santos: 'agua' };
// arquétipo → formato
const MAG_FORMA = { zagueiro: 'anel', volante: 'onda', centroavante: 'raio', meia: 'bola', ponta: 'raio', goleiro: 'anel', torcedor: 'bola', arbitro: null };
// criaturas e ETs: [elemento, formato, deixa campo?]
const MAG_BICHO = {
  rato: ['veneno', 'bola'], minhocao: ['areia', 'anel'], morcego: ['sonico', 'onda'], aranha: ['veneno', 'raio'], toupeira: ['terra', 'bola'], mumia: ['areia', 'onda'],
  tanuki: ['confete', 'bola'], escorpiao: ['veneno', 'bola', true], jacare: ['agua', 'onda'], polvo: ['tinta', 'bola'], touro: ['terra', 'raio'], gargula: ['terra', 'anel'],
  yeti: ['gelo', 'anel'], fantasma: ['sonico', 'anel'], dragao: ['fogo', 'onda', true], dragao_anciao: ['fogo', 'onda', true],
  et_coelho: ['energia', 'bola'], et_rocha: ['terra', 'anel'], et_selenita: ['energia', 'raio'], et_marciano: ['energia', 'bola'], et_robo: ['fogo', 'raio'], et_rover: ['energia', 'onda'],
  et_anel: ['energia', 'anel'], et_cristal: ['gelo', 'bola'], et_medusa: ['energia', 'anel'], et_nuvem: ['agua', 'bola'], et_cometa: ['fogo', 'raio', true], et_cavaleiro: ['energia', 'onda'],
};
['chamas', 'veneno', 'energia', 'areia', 'tinta', 'sonico', 'confete', 'bolhas'].forEach(n => {
  if (typeof FX === 'undefined' || FX.img[n]) return;
  const im = new Image(); const o = FX.img[n] = { im, ok: false }; im.onload = () => { o.ok = true; }; im.src = `a/fx/fx_${n}.webp?v=231`;
});
// a magia de cada tipo (calculada uma vez)
function magiaDe(tipo) {
  const d = MONSTROS[tipo]; if (!d || d.treino || d.chefe) return null;
  if (d._mag !== undefined) return d._mag;
  let r = null;
  const nv = typeof nivelMonstro === 'function' ? nivelMonstro(d) : 0;
  if (nv >= 20) {
    const L = d.look || {};
    if (L.tipo && L.tipo !== 'humano' && MAG_BICHO[L.tipo]) { const [el, forma, campo] = MAG_BICHO[L.tipo]; r = { el, forma, campo: !!campo }; }
    else if (d._arq && MAG_FORMA[d._arq]) {
      const sp = indice().spawn[tipo]; let h = sp && sp.mapa;
      if (h && typeof CACA_POR_ID !== 'undefined' && CACA_POR_ID[h]) h = CACA_POR_ID[h].host;
      if (h && /^est_/.test(h)) h = h.slice(4); if (!h && d.estadio) h = d.estadio.slice(4);
      const el = MAG_CIDADE[h] || 'terra';
      r = { el, forma: MAG_FORMA[d._arq], campo: el === 'fogo' && d._arq === 'torcedor' };
    }
  }
  d._mag = r; return r;
}
// os quadrados que a magia pega
function tilesMagia(forma, m, alvo) {
  const mx = Math.floor(m.x), my = Math.floor(m.y), px = Math.floor(alvo.x), py = Math.floor(alvo.y);
  const dx = Math.sign(px - mx), dy = Math.sign(py - my); const out = [];
  const poe = (x, y) => { if (!tileBloq(x, y) && !out.some(t => t.x === x && t.y === y)) out.push({ x, y }); };
  if (forma === 'bola') { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) poe(px + i, py + j); }
  else if (forma === 'anel') { for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i || j) poe(mx + i, my + j); }
  else if (forma === 'raio') { for (let k = 1; k <= 5; k++) { const x = mx + dx * k, y = my + dy * k; if (tileBloq(x, y)) break; poe(x, y); } }
  else if (forma === 'onda') {
    const ex = -dy, ey = dx; // perpendicular
    for (let k = 1; k <= 4; k++) { const w = k === 1 ? 0 : k <= 3 ? 1 : 2; for (let s = -w; s <= w; s++) poe(mx + dx * k + ex * s, my + dy * k + ey * s); }
  }
  return out;
}
{
  G.magAdv = []; G.campoAdv = [];
  const agora = () => G.agora;
  const pTile = () => ({ x: Math.floor(G.p.x), y: Math.floor(G.p.y) });
  const naZona = () => typeof naZonaSegura === 'function' && naZonaSegura(G.p);
  function lanca(m, mg) {
    const d = dist(m, G.p), fm = mg.forma;
    if (fm === 'anel' ? d > 2.2 : d > 5.5) return false;
    if (fm !== 'anel' && typeof linhaVisao === 'function' && !linhaVisao(m, G.p)) return false;
    const tiles = tilesMagia(fm, m, G.p); if (!tiles.length) return false;
    const el = MAG_EL[mg.el]; const mult = { bola: 1.0, onda: 1.1, raio: 1.2, anel: 0.9 }[fm] || 1;
    G.magAdv.push({ m, tiles, el: mg.el, campo: mg.campo, t: agora() + 700, mult });
    m.golpe = agora(); m.flip = G.p.x < m.x; texto(m, el.nome + '!', `rgb(${el.cor})`, 1000); return true;
  }
  // v237 (rebalanceamento): a magia somava ~+100% no dano recebido; agora ~+20%: golpe mais fraco, defesa conta como no ataque normal
  const MAG_DANO = 0.55, MAG_DEF = 0.6;
  function danoDe(m, mult) { const s = stats(); return Math.max(1, Math.round(m.d.atk * MAG_DANO * mult * (0.85 + 0.3 * Math.random()) - s.def * MAG_DEF)); }
  function aplicaStatus(st, m) {
    const t = agora(), p = G.p;
    if (st === 'fogo') { p.stFogo = { ate: t + 3000, prox: t + 1000, m }; texto(p, 'queimando!', '#ff9a4a', 800, -0.3); }
    else if (st === 'veneno') { p.stVeneno = { ate: t + 5000, prox: t + 1000, m }; texto(p, 'envenenado!', '#8aff6a', 800, -0.3); }
    else if (st === 'tonto') { p.tontoAte = Math.max(p.tontoAte || 0, t + 500); }
    else if (st === 'preso') { p.tontoAte = Math.max(p.tontoAte || 0, t + 900); texto(p, 'preso!', '#d8b890', 800, -0.3); }
    else if (st === 'lento') { p.lentoAte = Math.max(p.lentoAte || 0, t + 2500); }
    else if (st === 'tinta') { G.tintaAte = t + 2500; }
  }
  const _atualizaMonstroMag = atualizaMonstro;
  atualizaMonstro = function (m) {
    const r = _atualizaMonstroMag.apply(this, arguments);
    if (!m.bravo || !G.p || G.save.hp <= 0 || m.voltando) return r;
    const mg = magiaDe(m.tipo); if (!mg) return r;
    const t = agora(); if (!m._cdMag) { m._cdMag = t + 4000 + Math.random() * 3000; return r; }
    if (t < m._cdMag || naZona()) return r;
    m._cdMag = t + (lanca(m, mg) ? 12000 + Math.random() * 4000 : 1200);
    return r;
  };
  const _atualizaMag = atualiza;
  atualiza = function (dt) {
    const r = _atualizaMag.apply(this, arguments);
    if (!G.rodando || G.pausado || !G.p || !G.save) return r;
    const t = agora(), pt = pTile();
    // golpes que chegaram
    G.magAdv = G.magAdv.filter(g => {
      if (t < g.t) return true;
      const el = MAG_EL[g.el];
      // um desenho por golpe: grande no centro e alguns pequenos (sem poluir)
      const c = g.tiles[Math.floor(g.tiles.length / 2)];
      fxAnim(el.fx, c.x + 0.5, c.y + 0.9, { tam: 2.2, dur: 700 });
      g.tiles.filter((_, i) => i % 3 === 0).slice(0, 5).forEach((q, i) => fxAnim(el.fx2 || el.fx, q.x + 0.5, q.y + 0.9, { tam: 1.2, dur: 600, atraso: i * 40 }));
      if (g.campo) G.campoAdv.push({ tiles: g.tiles, el: g.el, ate: t + 4000, prox: t + 1000, m: g.m });
      if (g.tiles.some(q => q.x === pt.x && q.y === pt.y) && G.save.hp > 0) {
        recebeDano(danoDe(g.m, g.mult), g.m); if (el.st) aplicaStatus(el.st, g.m);
        if (typeof tremeTela === 'function') tremeTela(4, 180);
      }
      return false;
    });
    // chão queimando / tóxico
    G.campoAdv = G.campoAdv.filter(c => {
      if (t >= c.ate) return false;
      if (t >= c.prox) { c.prox = t + 1000; const q = c.tiles[Math.floor(Math.random() * c.tiles.length)]; fxAnim(MAG_EL[c.el].fx, q.x + 0.5, q.y + 0.9, { tam: 1.1, dur: 700 });
        if (c.tiles.some(q => q.x === pt.x && q.y === pt.y) && G.save.hp > 0) recebeDano(Math.max(1, Math.round(c.m.d.atk * 0.1)), c.m); }
      return true;
    });
    // queimando / envenenado
    const p = G.p;
    for (const k of ['stFogo', 'stVeneno']) {
      const s = p[k]; if (!s) continue;
      if (t >= s.ate || G.save.hp <= 0) { p[k] = null; continue; }
      if (t >= s.prox) { s.prox = t + 1000; const dano = Math.max(1, Math.round(s.m.d.atk * (k === 'stFogo' ? 0.08 : 0.05))); recebeDano(dano, s.m); }
    }
    return r;
  };
  // os quadrados acendendo antes do golpe e a tela escura da tinta
  const _desenhaMag = desenha;
  desenha = function (dt) {
    const r = _desenhaMag.apply(this, arguments);
    if (!G.rodando || !G.mapa) return r;
    const ctx = CTX, z = G.zoom, cam = G.cam, t = agora();
    if (G.magAdv.length || G.campoAdv.length) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const pinta = (q, cor, a) => { const x = (q.x * T - cam.x) * z, y = (q.y * T - cam.y) * z, s = T * z; ctx.fillStyle = `rgba(${cor},${a})`; ctx.fillRect(x + 2, y + 2, s - 4, s - 4); ctx.strokeStyle = `rgba(${cor},${Math.min(1, a + 0.35)})`; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, s - 4, s - 4); };
      for (const g of G.magAdv) { const k = 1 - Math.max(0, g.t - t) / 700, a = 0.18 + 0.3 * k + 0.08 * Math.sin(t / 60); for (const q of g.tiles) pinta(q, MAG_EL[g.el].cor, a); }
      for (const c of G.campoAdv) for (const q of c.tiles) pinta(q, MAG_EL[c.el].cor, 0.16 + 0.05 * Math.sin(t / 150));
      ctx.restore();
    }
    if ((G.tintaAte || 0) > t) { // jato de tinta: tudo escuro, só um pouco em volta de você
      const f = Math.min(1, (G.tintaAte - t) / 600);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const px = (G.p.x * T - cam.x) * z, py = ((G.p.y - 0.6) * T - cam.y) * z, R = T * z * 2.2;
      const gr = ctx.createRadialGradient(px, py, R * 0.4, px, py, R * 2.2); gr.addColorStop(0, 'rgba(10,12,40,0)'); gr.addColorStop(1, `rgba(10,12,40,${0.88 * f})`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, CV.width, CV.height); ctx.restore();
    }
    return r;
  };
  // mudou de mapa: some tudo
  const _entrarMag = entrarMapa;
  entrarMapa = function () { G.magAdv = []; G.campoAdv = []; G.tintaAte = 0; if (G.p) { G.p.stFogo = G.p.stVeneno = null; } return _entrarMag.apply(this, arguments); };
}
