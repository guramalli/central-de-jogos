/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏙️ CIDADE ARRUMADA (v163)
   - ALAMBRADO: as quadras cercadas tinham cerca dupla e torta (o mapa ampliado
     transformava cada pedaço em bloco de 1–2 quadros). Agora é uma linha só,
     reta, em volta da quadra, com postes, tela e portão embaixo.
   - FEIRINHA: os NPCs que chegaram depois (porteiro da arena, oficina, estilista,
     corretora, marceneiro) ficavam amontoados na chegada; agora cada um tem a sua
     barraca, lado a lado, numa feirinha arrumada.
   - TAMANHO: pessoas (NPCs e adversários) na altura do seu boneco; zagueirão só
     10% maior, chefão ~20%; crianças e bichos continuam menores.
   Carregar no FIM (depois de todos os arquivos que mexem nos mapas).
   ============================================================ */

/* ---------- alambrado desenhado (reto, fino, com portão) ---------- */
OBJ_BLOQUEIA.add('alambrado');
function desenhaAlambrado(ctx, o, x, y) {
  // alambrado verde-escuro de quadra: postes, tubo de cima e tela em losango
  const d = (o.meta && o.meta.d) || 'h', H = 0.95 * T, base = (y + 0.92) * T;
  const POSTE = '#1f4a34', TUBO = '#2f6a4a', TELA = 'rgba(40,90,62,0.8)', FUNDO = 'rgba(60,120,85,0.16)';
  ctx.save();
  const poste = (px, topo) => { ctx.fillStyle = POSTE; ctx.fillRect(px - 2.5, topo, 5, base - topo); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(px - 1.5, topo, 1.5, base - topo); };
  if (d === 'h') {
    const x0 = x * T, topo = base - H;
    ctx.fillStyle = FUNDO; ctx.fillRect(x0, topo, T, H);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, topo, T, H); ctx.clip();
    ctx.strokeStyle = TELA; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let k = -H; k < T + H; k += 8) { ctx.moveTo(x0 + k, base); ctx.lineTo(x0 + k + H, topo); ctx.moveTo(x0 + k + H, base); ctx.lineTo(x0 + k, topo); }
    ctx.stroke(); ctx.restore();
    ctx.fillStyle = TUBO; ctx.fillRect(x0, topo - 2, T, 4); ctx.fillRect(x0, base - 3, T, 3);
    poste(x0, topo - 3); if (o.meta && o.meta.fim) poste(x0 + T, topo - 3);
  } else {
    // de lado: a tela vira uma faixa estreita e os postes ficam em fila
    const cx = (x + 0.5) * T, yTopo = y * T - H + 0.92 * T, yBase = base;
    ctx.fillStyle = FUNDO; ctx.fillRect(cx - 7, yTopo, 14, yBase - yTopo);
    ctx.save(); ctx.beginPath(); ctx.rect(cx - 7, yTopo, 14, yBase - yTopo); ctx.clip();
    ctx.strokeStyle = TELA; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = -14; k < yBase - yTopo + 14; k += 7) { ctx.moveTo(cx - 7, yTopo + k); ctx.lineTo(cx + 7, yTopo + k + 10); ctx.moveTo(cx + 7, yTopo + k); ctx.lineTo(cx - 7, yTopo + k + 10); } ctx.stroke(); ctx.restore();
    ctx.fillStyle = TUBO; ctx.fillRect(cx - 7, yTopo - 2, 14, 4); ctx.fillRect(cx - 2, yTopo - 2, 4, T);
    poste(cx, base - H - 3);
  }
  ctx.restore();
}
{ const _desenhaObjAl = desenhaObj; desenhaObj = function (ctx, o, x, y) { if (o && o.t === 'alambrado') return desenhaAlambrado(ctx, o, x, y); return _desenhaObjAl.apply(this, arguments); }; }

// refaz a cerca de cada quadra cercada: tira a grade velha em volta e desenha uma linha só, com portão embaixo (3 quadros)
function refazAlambrados(m) {
  const W = m.w, i = (x, y) => y * W + x;
  for (const c of m.campos) {
    const r = [c.x - 4, c.y - 4, c.x + c.w + 3, c.y + c.h + 3]; let tinha = 0;
    for (let y = Math.max(0, r[1]); y <= Math.min(m.h - 1, r[3]); y++) for (let x = Math.max(0, r[0]); x <= Math.min(W - 1, r[2]); x++) { const o = m.obj[i(x, y)]; if (o && o.t === 'grade') { m.obj[i(x, y)] = null; tinha++; } }
    if (!tinha) continue;
    const x0 = c.x - 1, x1 = c.x + c.w, y0 = c.y - 1, y1 = c.y + c.h, meio = Math.round((x0 + x1) / 2);
    const livre = (x, y) => x > 0 && y > 0 && x < W - 1 && y < m.h - 1 && !m.npcs.some(n => n.x === x && n.y === y) && !m.saidas.some(s => s.x === x && s.y === y) && !m.predios.some(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
    const poe = (x, y, d, fim) => { if (livre(x, y)) m.obj[i(x, y)] = { t: 'alambrado', v: 0, meta: { d, fim } }; };
    for (let x = x0; x <= x1; x++) { poe(x, y0, 'h', x === x1); if (Math.abs(x - meio) > 1) poe(x, y1, 'h', x === x1 || x === meio - 2); } // portão de 3 embaixo, no meio
    for (let y = y0 + 1; y < y1; y++) { poe(x0, y, 'v'); poe(x1, y, 'v'); }
  }
}

/* ---------- feirinha: uma barraca para cada NPC que ficava amontoado ---------- */
const FEIRA_BARRACAS = { port_terrao: 'fe_bilheteria', rita: 'fe_oficina', vera: 'fe_atelie', sonia: 'fe_imobiliaria', tonico: 'fe_marcenaria' };
['fe_bilheteria', 'fe_oficina', 'fe_atelie', 'fe_imobiliaria', 'fe_marcenaria', 'fe_frutas', 'fe_esporte', 'fe_sucos'].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
function montaFeirinha(m) {
  const W = m.w, H = m.h, i = (x, y) => y * W + x;
  const quem = Object.keys(FEIRA_BARRACAS).filter(id => m.npcs.some(n => n.id === id)); if (quem.length < 3) return;
  const ordem = [...quem, 'fe_frutas', 'fe_sucos'].slice(0, Math.max(quem.length, 5)); // completa com barracas sem vendedor, para a fileira ficar bonita
  const LB = 3, HB = 2, GAP = 1, larg = ordem.length * LB + (ordem.length - 1) * GAP;
  // tira os NPCs (e a placa do porteiro) de onde estavam
  const antigos = m.npcs.filter(n => quem.includes(n.id)); m.npcs = m.npcs.filter(n => !quem.includes(n.id));
  for (const n of antigos) for (const [dx, dy] of [[1, 0]]) { const pl = m.placas.findIndex(p => p.x === n.x + dx && p.y === n.y + dy && /ARENA/.test(p.texto)); if (pl >= 0) { const p = m.placas[pl]; if (m.obj[i(p.x, p.y)] && m.obj[i(p.x, p.y)].t === 'placa') m.obj[i(p.x, p.y)] = null; m.placas.splice(pl, 1); } }
  // procura uma calçada livre perto da chegada (retângulo da fileira + a frente, sem rua)
  const ruas = typeof faixasRua === 'function' ? faixasRua(m, tiposRua(m.id)).tipo : null;
  const ok = (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2 && !m.obj[i(x, y)] && CH_ANDA(m.chao[i(x, y)]) && m.chao[i(x, y)] !== CH.AGUA && !(ruas && ruas[i(x, y)])
    && !m.saidas.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1) && !m.npcs.some(n => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1)
    && !m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h) && !m.predios.some(p => x >= p.x - 1 && x <= p.x + p.w && y >= p.y - 2 && y <= p.y + p.h)
    && !m.spawns.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);
  const ref = m.renasce || m.inicio || { x: W >> 1, y: H >> 1 }; const cands = [];
  for (let y = 3; y < H - HB - 3; y++) for (let x = 2; x < W - larg - 2; x++) {
    let bom = true; for (let yy = y - 2; yy <= y + HB + 1 && bom; yy++) for (let xx = x - 1; xx <= x + larg && bom; xx++) if (!ok(xx, yy)) bom = false;
    if (bom) cands.push({ x, y, d: Math.hypot(x + larg / 2 - ref.x, y - ref.y) });
  }
  cands.sort((a, b) => a.d - b.d);
  const inicio = m.renasce || m.inicio; const antes = alcancaveis(m, inicio), imp = pontosImportantes(m).filter(pt => antes[pt.y * W + pt.x]);
  for (const { x, y } of cands.slice(0, 30)) {
    const marcas = [];
    ordem.forEach((id, k) => { const bx = x + k * (LB + GAP); for (let yy = y; yy < y + HB; yy++) for (let xx = bx; xx < bx + LB; xx++) { marcas.push(i(xx, yy)); m.obj[i(xx, yy)] = { t: 'x', v: 0, predio: true }; } });
    const dep = alcancaveis(m, inicio);
    if (imp.every(pt => dep[pt.y * W + pt.x]) && ordem.every((id, k) => dep[i(x + k * (LB + GAP) + 1, y + HB)])) {
      ordem.forEach((id, k) => {
        const bx = x + k * (LB + GAP), spr = FEIRA_BARRACAS[id] || id;
        m.predios.push({ spr, x: bx, y, w: LB, h: HB, porta: { x: bx + 1, y: y + HB - 1 }, alto: 2, barraca: true });
        if (FEIRA_BARRACAS[id]) m.npcs.push({ id, x: bx + 1, y: y + HB }); // o vendedor fica na frente do balcão
      });
      m.placas.push({ x: x - 1, y: y + HB, texto: '🧺 FEIRINHA DO CAMPINHO — oficina, ateliê, imóveis, marcenaria e a bilheteria da Arena' }); m.obj[i(x - 1, y + HB)] = { t: 'placa', v: 1 };
      // o porteiro mudou de lugar: a saída da arena volta para a frente dele
      const port = m.npcs.find(n => n.id === 'port_terrao'); if (port && typeof ARENA_POR_ID !== 'undefined' && ARENA_POR_ID.arena_terrao) ARENA_POR_ID.arena_terrao.porta = { x: port.x, y: port.y };
      return true;
    }
    for (const k of marcas) m.obj[k] = null;
  }
  m.npcs.push(...antigos); console.warn('feirinha sem lugar em', m.id); return false; // não coube: tudo volta como era
}
{
  const base = MAPAS_DEF.cidade;
  MAPAS_DEF.cidade = function () { const m = base(); try { refazAlambrados(m); } catch (e) { console.error('alambrado', e); } try { montaFeirinha(m); } catch (e) { console.error('feirinha', e); } return m; };
}

/* ---------- tamanho das pessoas: o padrão é o seu boneco ---------- */
{
  const _alturaEntTam = alturaEnt;
  alturaEnt = function (e) {
    const h = _alturaEntTam.apply(this, arguments);
    if (!e || e === G.p || !G.save) return h;
    const d = e._dV || e.d; const l = d && d.look; if (!l || (l.tipo && l.tipo !== 'humano') || l.folha === undefined && !l.pele && !l.cabelo) return h;
    const eu = Math.max(ALT_FASE[faseIdx(G.save.nivel)], 1.5);
    const rel = Math.min(1, Math.max(0.72, (l.alt || 1.66) / 1.66)); // criança continua menor
    let alvo = eu * rel;
    if (l.grande) alvo *= 1.1;
    if (d.chefe) alvo *= l.grande ? 1.1 : 1.2; // chefão: ~20% maior no total
    return alvo;
  };
}
