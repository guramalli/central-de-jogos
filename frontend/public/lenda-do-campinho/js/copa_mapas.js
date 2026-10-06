/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏟️ COPA DOS ESQUECIDOS — MAPAS (v410, frente MAPAS; o dono aprovou a Copa dos Esquecidos em 06/10/2026).
   "Antes de a primeira bola se partir, o Multiverso jogava a Copa de Origem. Os times que nunca ganharam nada ficaram
   presos num estádio fora do tempo, à espera do apito final." Aqui ficam o estádio e as 4 alas (áreas de caça):
   - cq_estadio      SAGUÃO do Estádio dos Esquecidos (hub): bilheteria velha, roupeiro do Seu Saudade, arquibancada da
                     Dona Memória, troféus empoeirados, névoa e os 4 portões das alas. Sem adversários.
   - cq_vestiario    Ala 1 (700–760): armários, bancos, chuveiros, banco de reservas; corredores médios; capitão no fundo.
   - cq_tunel        Ala 2 (760–830): túneis estreitos e escuros com lâmpadas, retas para as faixas de impedimento;
                     o Xerife no fim do túnel.
   - cq_arquibancada Ala 3 (830–900): setores de arquibancada (degraus) em volta da pista; pista e campo abertos para a
                     "ola" atravessar; o Rei no camarote.
   - cq_gramado      Ala 4 (900–950): o gramado da final eterna (linhas apagadas, traves velhas, refletores), o Craque no
                     círculo central e a ARENA DA FINAL, cercada, que só abre com a flag cq_final_liberada.
   O PORTAL do Estádio aparece no Estádio do Multiverso, no lugar do portal selado "Em breve" (escondido na v407 por
   missoes_raiox.js), a partir do nível 700 (ou com a flag cq_portal).
   Os adversários (cq_*), os chefões, os NPCs seu_saudade/dona_memoria e as regras das alas são da frente MECÂNICAS
   (copa_esquecidos.js); os props cq_* são da frente ARTE (copa_arte.js) — se um prop não existir, usa um parecido do jogo
   (nunca fica "parede invisível"). Chão novo (CHAO2), em tom desbotado, com névoa por cima.
   Para as outras frentes: window.CQ_MAPAS (pontos de cada mapa: chefões, faixas do túnel, anel da ola, arena da final)
   e cqMapaConfere(m) (o crivo: tudo alcançável andando).
   Prefixo cqMapa / CQM_. Carregar DEPOIS de copa_esquecidos.js e copa_arte.js (e de multiverso.js, missoes_raiox.js,
   chao_novo.js). Ordem no index.html: copa_esquecidos → copa_arte → copa_mapas → copa_historia.
   ============================================================ */

/* ---------- chãos (tons desbotados; texturas que o jogo já tem) ---------- */
const CQM_CH = { CQ_PAR: 170, CQ_FACE: 171, CQ_PISO: 172, CQ_AZULEJO: 173, CQ_CONCRETO: 174, CQ_GRAMA: 175, CQ_PISTA: 176, CQ_DEGRAU_A: 177, CQ_DEGRAU_B: 178, CQ_MADEIRA: 179 };
for (const [k, v] of Object.entries(CQM_CH)) { if (Object.values(CH).includes(v) && CH[k] !== v) console.warn('copa_mapas: chão', v, 'já usado'); CH[k] = v; }
Object.assign(ESTILO_CHAO, {
  [CH.CQ_PAR]: { cor: '#2c3040', borda: '#161822', r: 0, e: 0, tex: 'pedra', o: 21.7, tinta: 'rgba(16,20,34,0.62)' },        // o alto da parede
  [CH.CQ_FACE]: { cor: '#6a6e7c', borda: '#3a3e4a', r: 0, e: 0, tex: 'liso', o: 19.7, tinta: 'rgba(70,82,104,0.5)' },          // a "frente" da parede (tijolo desbotado)
  [CH.CQ_PISO]: { cor: '#a9adb6', borda: '#7a7e88', r: 0, e: 0, tex: 'calcada', o: 5.81 },                                       // piso do saguão e dos corredores
  [CH.CQ_AZULEJO]: { cor: '#b6c4c8', borda: '#7e8e92', r: 0, e: 0, tex: 'calcada', o: 5.82 },                                    // azulejo do vestiário
  [CH.CQ_CONCRETO]: { cor: '#7c8088', borda: '#565a62', r: 0, e: 0, tex: 'calcada', o: 5.83 },                                   // concreto do túnel
  [CH.CQ_GRAMA]: { cor: '#8aa284', borda: '#6a8264', r: 0.2, e: 0.05, tex: 'grama', o: 1.71, tinta: 'rgba(160,172,178,0.42)' }, // grama desbotada
  [CH.CQ_PISTA]: { cor: '#a87a6e', borda: '#7a564c', r: 0.2, e: 0.04, tex: 'liso', o: 3.71, tinta: 'rgba(150,140,150,0.42)' },  // pista de atletismo desbotada
  [CH.CQ_DEGRAU_A]: { cor: '#8a8e98', borda: '#5a5e68', r: 0, e: 0, tex: 'calcada', o: 6.71 },                                    // degraus da arquibancada (duas cores alternadas)
  [CH.CQ_DEGRAU_B]: { cor: '#9ea2ac', borda: '#5a5e68', r: 0, e: 0, tex: 'calcada', o: 6.72 },
  [CH.CQ_MADEIRA]: { cor: '#9a8470', borda: '#6a5646', r: 0, e: 0, tex: 'madeira', o: 6.73, tinta: 'rgba(120,120,130,0.4)' },   // assoalho do roupeiro/camarote
});
Object.assign(TEX_CHAO, { [CH.CQ_PAR]: 't_concreto_escuro', [CH.CQ_FACE]: 't_tijolo', [CH.CQ_PISO]: 't_laje_londres_v408', [CH.CQ_AZULEJO]: 't_baldosa_v408', [CH.CQ_CONCRETO]: 't_concreto_escuro',
  [CH.CQ_GRAMA]: 't_grama', [CH.CQ_PISTA]: 't_pista', [CH.CQ_DEGRAU_A]: 't_concreto_escuro', [CH.CQ_DEGRAU_B]: 't_laje_londres_v408', [CH.CQ_MADEIRA]: 't_madeira' });
Object.assign(CH_MINI, { 170: '#22252f', 171: '#5a5e6a', 172: '#a9adb6', 173: '#b6c4c8', 174: '#7c8088', 175: '#8aa284', 176: '#a87a6e', 177: '#8a8e98', 178: '#9ea2ac', 179: '#9a8470' });
if (typeof chaoSuaviza === 'function') { const _chaoSuavizaCq = chaoSuaviza; chaoSuaviza = t => (t >= 170 && t <= 179 && t !== CH.CQ_GRAMA && t !== CH.CQ_PISTA) ? false : _chaoSuavizaCq(t); }
['t_concreto_escuro', 't_tijolo', 't_piso', 't_baldosa_v408', 't_grama', 't_pista', 't_madeira', 't_laje_londres_v408', 't2_laje_londres_v408', 't2_baldosa_v408', 't2_concreto_esc', 't2_grama'].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
// chão novo: paredes no quadradinho exato (com a tinta escura), o resto liso/arredondado
if (typeof CHAO2 !== 'undefined') {
  Object.assign(CHAO2.tex, { [CH.CQ_PISO]: ['t2_laje_londres_v408', 3.6], [CH.CQ_AZULEJO]: ['t2_baldosa_v408', 3], [CH.CQ_CONCRETO]: ['t2_concreto_esc', 4], [CH.CQ_GRAMA]: ['t2_grama', 7],
    [CH.CQ_PAR]: ['t2_concreto_esc', 4] /* (só quando a parede é o fundo do desenho: gramado e arquibancada) */, [CH.CQ_DEGRAU_A]: ['t2_concreto_esc', 4], [CH.CQ_DEGRAU_B]: ['t2_laje_londres_v408', 3.6] });
  for (const t of [CH.CQ_PISO, CH.CQ_AZULEJO, CH.CQ_CONCRETO, CH.CQ_DEGRAU_A, CH.CQ_DEGRAU_B]) CHAO2.piso.add(t);
  for (const t of [CH.CQ_PAR, CH.CQ_FACE, CH.CQ_MADEIRA]) CHAO2.cru.add(t);
  Object.assign(CHAO2.biomas, { cq_salao: { base: CH.CQ_PISO }, cq_vest: { base: CH.CQ_AZULEJO }, cq_tunel: { base: CH.CQ_CONCRETO }, cq_grama: { base: CH.CQ_PAR } }); // (no gramado o fundo é a parede: assim a grama recebe a tinta desbotada)
  Object.assign(CHAO2.mapas, { cq_estadio: 'cq_salao', cq_vestiario: 'cq_vest', cq_tunel: 'cq_tunel', cq_arquibancada: 'cq_grama', cq_gramado: 'cq_grama' });
  CHAO2.dc[CH.CQ_GRAMA] = ['dc2_floresta', 0.006, 0.22, 0.36]; // tufinhos raros
}

/* ---------- props: os da ARTE (copa_arte.js) ou, se faltarem, um parecido que o jogo já tem ---------- */
const CQM_PROP = { cq_bilheteria: 'balcao', cq_catraca: 'grade', cq_placa: 'placar', cq_armarios: 'guarda_roupa', cq_banco_reservas: 'banco_reservas', cq_trave: 'gol_caixote_d',
  cq_refletor: 'holofote', cq_faixa: 'bandeirao', cq_trofeus: 'trofeu', cq_taca_pedestal: 'trofeu',
  // (pedidos à ARTE na v410 e já feitos por ela: chuveiro antigo, lâmpada de parede, maca, portal, cesto de bolas, relógio)
  cq_chuveiro: 'bebedouro', cq_lampada: 'holofote', cq_maca: 'banco', cq_portal: 'mv_portal_rio', cq_cesto_bolas: 'sacola_bolas', cq_relogio: 'placar' };
function cqMapaProp(n) {
  const tem = k => !!(OBJ_INFO[k] && (ASSET_SET.has(k) || k === 'x'));
  if (tem(n)) { if (OBJ_INFO[n].b !== 0) OBJ_BLOQUEIA.add(n); return n; }
  const f = CQM_PROP[n]; return f && tem(f) ? f : (f || n);
}
const cqMapaPortalSpr = () => (typeof ASSET_SET !== 'undefined' && ASSET_SET.has('cq_portal')) ? 'cq_portal' : 'mv_portal_rio';

/* ---------- kit dos mapas ---------- */
function cqMapaKit(id, nome, W, H, seed) {
  const b = new Construtor(id, nome, W, H, CH.CQ_PAR, seed), m = b.m, piso = new Uint8Array(W * H), r = mulberry(seed + 77);
  const K = {
    b, m, W, H, piso, r,
    ok: (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1,
    eh: (x, y) => x >= 0 && y >= 0 && x < W && y < H && piso[y * W + x] === 1,
    cava(x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (K.ok(i, j)) { piso[j * W + i] = 1; if (ch != null) m.chao[j * W + i] = ch; } },
    elipse(cx, cy, rx, ry, ch, so) { for (let j = Math.floor(cy - ry); j <= cy + ry; j++) for (let i = Math.floor(cx - rx); i <= cx + rx; i++) if (((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 <= 1) { if (so) { if (K.eh(i, j)) m.chao[j * W + i] = ch; } else K.cava(i, j, 1, 1, ch); } },
    chao(x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (K.eh(i, j)) m.chao[j * W + i] = ch; },
    livre: (x, y) => K.eh(x, y) && !m.obj[y * W + x],
    // prop: só em chão livre; os largos (≥ 2 quadradinhos) bloqueiam também os vizinhos (o desenho ocupa esse espaço)
    poe(x, y, n, extra) {
      if (!K.livre(x, y) || (K.prot && K.prot(x, y))) return false;
      const t = cqMapaProp(n); m.obj[y * W + x] = Object.assign({ t, v: (hash2(x, y) * 1000) | 0 }, extra || {});
      const w = (OBJ_INFO[t] && OBJ_INFO[t].w) || 1;
      if (w >= 2) for (const dx of [-1, 1]) if (K.livre(x + dx, y) && !(K.prot && K.prot(x + dx, y))) m.obj[y * W + x + dx] = Object.assign({ t: 'x', v: 0, largo: true }, extra && extra.fixo ? { fixo: true } : {});
      return true;
    },
    // o que não é chão vira parede (alto escuro; "frente" de tijolo logo acima do chão), às vezes com uma lâmpada na frente
    fecha(lamp, dens = 0.1, passo = 5) {
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        if (piso[j * W + i]) continue;
        const frente = j + 1 < H && piso[(j + 1) * W + i];
        m.chao[j * W + i] = frente ? CH.CQ_FACE : CH.CQ_PAR; m.obj[j * W + i] = { t: 'x', v: 0 };
        if (frente && lamp && (i % passo) === 0 && hash2(i * 11, j * 13) < dens * passo) { const t = cqMapaProp(lamp); if (OBJ_BLOQUEIA.has(t)) m.obj[j * W + i] = { t, v: 0 }; }
      }
    },
    // saída-prédio (a arte da escada/portal), com a saída ligada a outro mapa
    portaPara(spr, x, y, w, h, para, tx, ty, req) {
      const p = b.predio(spr, x, y, w, h); const d = p.porta;
      m.saidas.push(Object.assign({ x: d.x, y: d.y, para, tx, ty }, req ? { req } : {}));
      return p;
    },
    // zonas protegidas (frente de portas, NPCs, placas, chegada): nada de enfeite nem adversário colado
    protege() {
      const P = new Uint8Array(W * H), marca = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < W && y < H) P[y * W + x] = 1; };
      for (const s of m.saidas) marca(s.x - 1, s.y - 1, s.x + 1, s.y + 2);
      for (const n of m.npcs) marca(n.x - 1, n.y - 1, n.x + 1, n.y + 2);
      for (const p of m.placas) marca(p.x - 1, p.y - 1, p.x + 1, p.y + 1);
      if (m.inicio) marca(m.inicio.x - 2, m.inicio.y - 2, m.inicio.x + 2, m.inicio.y + 2);
      K.prot = (x, y) => !!P[y * W + x];
      return K.prot;
    },
    grupo(id, x, y, qtd, raio = 2) { b.spawn(id, x, y, qtd, raio); },
    placa(x, y, txt) { if (m.obj[y * W + x] && m.obj[y * W + x].t !== 'x') return; b.placa(x, y, txt); },
  };
  return K;
}
// garante o caminho: o que ficou fechado por enfeite (nunca parede, prédio, placa ou cerca) é liberado até tudo ser alcançável
function cqMapaBfs(m, comTrava) {
  const W = m.w, H = m.h, vis = new Uint8Array(W * H), bloq = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return true; if (!CH_ANDA(m.chao[y * W + x])) return true; const o = m.obj[y * W + x]; return !!(o && OBJ_BLOQUEIA.has(o.t)); };
  const ini = m.inicio; if (!ini || bloq(ini.x, ini.y)) return { vis, bloq };
  const fila = [ini.x + ini.y * W]; vis[fila[0]] = 1;
  const salta = {}; for (const s of m.saidas) if ((s.para === m.id || !s.para) && s.tx != null && (comTrava || !(s.req && s.req.flag))) salta[s.y * W + s.x] = s.ty * W + s.tx;
  for (let k = 0; k < fila.length; k++) {
    const p = fila[k], x = p % W, y = (p / W) | 0;
    const viz = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    if (salta[p] != null) viz.push([salta[p] % W, (salta[p] / W) | 0]);
    for (const [nx, ny] of viz) { if (bloq(nx, ny)) continue; const q = ny * W + nx; if (vis[q]) continue; vis[q] = 1; fila.push(q); }
  }
  return { vis, bloq };
}
function cqMapaGaranteCaminho(m, piso) {
  const W = m.w, H = m.h;
  for (let volta = 0; volta < 60; volta++) {
    const { vis, bloq } = cqMapaBfs(m, true);
    const fora = k => piso[k] && !vis[k] && !bloq(k % W, (k / W) | 0);           // chão livre que não se alcança
    const tira = k => { const o = m.obj[k]; return !!(o && piso[k] && !o.predio && !o.fixo && o.t !== 'placa' && bloq(k % W, (k / W) | 0)); };
    const ponte = [], borda = []; let falta = 0;
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = j * W + i; if (fora(k)) { falta++; continue; }
      if (!tira(k)) continue;
      const vz = [k - 1, k + 1, k - W, k + W];
      if (vz.some(fora)) { if (vz.some(q => vis[q])) ponte.push(k); else borda.push(k); }
    }
    if (!falta) break;
    const l = ponte.length ? ponte : borda; if (!l.length) break;
    for (const k of l) m.obj[k] = null;
  }
}
// O CRIVO (para as suítes e para as outras frentes): tudo alcançável a partir da chegada? nada colado em porta/placa/NPC?
function cqMapaConfere(m) {
  const P = [], W = m.w, { vis, bloq } = cqMapaBfs(m, true);
  const alc = (x, y) => x >= 0 && y >= 0 && x < W && y < m.h && vis[y * W + x] === 1;
  const vizAlc = (x, y) => alc(x + 1, y) || alc(x - 1, y) || alc(x, y + 1) || alc(x, y - 1);
  if (!m.inicio || bloq(m.inicio.x, m.inicio.y)) P.push('chegada bloqueada');
  if (m.renasce && bloq(m.renasce.x, m.renasce.y)) P.push('renasce bloqueado');
  for (const s of m.saidas) {
    if (!alc(s.x, s.y)) P.push(`saída (${s.x},${s.y}) → ${s.para} fora de alcance`);
    if (s.tx != null && s.para === m.id && bloq(s.tx, s.ty)) P.push(`saída (${s.x},${s.y}) chega em parede`);
  }
  for (const n of m.npcs) if (!vizAlc(n.x, n.y)) P.push(`NPC ${n.id} fora de alcance`);
  for (const p of m.placas) if (!vizAlc(p.x, p.y)) P.push(`placa (${p.x},${p.y}) fora de alcance`);
  for (const sp of m.spawns) {
    let ok = 0; for (let j = sp.y - sp.raio; j <= sp.y + sp.raio; j++) for (let i = sp.x - sp.raio; i <= sp.x + sp.raio; i++) if (alc(i, j)) ok++;
    if (!ok) P.push(`spawn ${sp.m} (${sp.x},${sp.y}) fora de alcance`); else if (ok < Math.min(sp.qtd, 3)) P.push(`spawn ${sp.m} (${sp.x},${sp.y}) apertado (${ok} lugares)`);
    if (m.inicio && Math.hypot(sp.x - m.inicio.x, sp.y - m.inicio.y) < 8) P.push(`spawn ${sp.m} (${sp.x},${sp.y}) a menos de 8 da chegada`);
    for (const s of m.saidas) if (Math.hypot(sp.x - s.x, sp.y - s.y) < 5) P.push(`spawn ${sp.m} (${sp.x},${sp.y}) colado na saída (${s.x},${s.y})`);
  }
  // frente das portas livre
  for (const s of m.saidas) { const f = s.y + 1; if (f < m.h && bloq(s.x, f) && !(s.para === m.id)) P.push(`frente da saída (${s.x},${s.y}) bloqueada`); }
  return P;
}
window.cqMapaConfere = cqMapaConfere;

/* ---------- pontos para as outras frentes ---------- */
const CQ_MAPAS = {
  hub: 'cq_estadio',
  alas: {
    cq_vestiario: { n: 1, nome: 'Vestiário Abandonado', nivel: [700, 760], especies: ['cq_reserva', 'cq_massagista', 'cq_gandula'], chefe: 'cq_cap_vestiario' },
    cq_tunel: { n: 2, nome: 'Túnel de Acesso', nivel: [760, 830], especies: ['cq_zagueiro', 'cq_bandeirinha', 'cq_arbitro'], chefe: 'cq_xerife_tunel' },
    cq_arquibancada: { n: 3, nome: 'Arquibancada Infinita', nivel: [830, 900], especies: ['cq_torcida', 'cq_bumbo', 'cq_mascote'], chefe: 'cq_rei_arquibancada' },
    cq_gramado: { n: 4, nome: 'Gramado da Final Eterna', nivel: [900, 950], especies: ['cq_craque', 'cq_goleiro', 'cq_tecnico'], chefe: 'cq_craque_final' },
  },
  // preenchidos quando cada mapa é montado (coordenadas em quadradinhos):
  // .portoes {ala: {x,y}} no saguão · .chefePos por ala · .tunelFaixas · .ola · .final
  portoes: {}, chefePos: {}, tunelFaixas: [], ola: null, final: null, multiverso: null,
};
window.CQ_MAPAS = CQ_MAPAS;
// as espécies que existem (a frente MECÂNICAS cria os adversários; sem eles, o grupo não entra no mapa)
const cqMapaTem = id => !!(typeof MONSTROS !== 'undefined' && MONSTROS[id]);
function cqMapaSpawn(K, id, x, y, qtd, raio = 2) { if (!cqMapaTem(id)) { if (!cqMapaSpawn.aviso) { cqMapaSpawn.aviso = 1; console.warn('copa_mapas: adversário ainda não existe:', id); } return; } K.grupo(id, x, y, qtd, raio); }
function cqMapaNpc(K, id, x, y) { if (typeof NPCS === 'undefined' || !NPCS[id]) { console.warn('copa_mapas: NPC ainda não existe:', id); return false; } K.b.npc(id, x, y); return true; }
// chegada de cada ala (a saída do saguão leva para cá) e a frente de cada portão no saguão
const CQM_CHEGA = { cq_vestiario: { x: 30, y: 46 }, cq_tunel: { x: 8, y: 46 }, cq_arquibancada: { x: 39, y: 54 }, cq_gramado: { x: 45, y: 62 } };
const CQM_PORTAO = { cq_vestiario: 9, cq_tunel: 20, cq_arquibancada: 36, cq_gramado: 47 }; // x do portão no saguão (porta em y 8)

/* ============================================================
   1) O SAGUÃO DO ESTÁDIO DOS ESQUECIDOS (hub) — 56×46
   ============================================================ */
function cqMapaEstadio() {
  const W = 56, H = 46, K = cqMapaKit('cq_estadio', '🏟️ Estádio dos Esquecidos', W, H, 41001), { b, m } = K;
  K.cava(3, 9, 50, 34, CH.CQ_PISO);                                        // o saguão
  K.elipse(28.5, 23.5, 5.2, 4.4, CH.CQ_GRAMA, true);                        // o círculo de grama velha no meio
  K.cava(4, 15, 12, 12); K.chao(4, 15, 12, 12, CH.CQ_MADEIRA);              // o roupeiro (assoalho)
  K.chao(39, 13, 13, 8, CH.CQ_DEGRAU_A);                                 // o piso da arquibancada da Dona Memória
  K.fecha('cq_faixa', 0.05, 7);
  // portões das 4 alas (túnel de estádio) — e a plaquinha com o nome de cada ala
  const NOMES = { cq_vestiario: '👕 ALA 1 — VESTIÁRIO ABANDONADO (níveis 700 a 760): armários, chuveiros e o banco de reservas. Lá no fundo espera o Capitão do Vestiário.',
    cq_tunel: '🚦 ALA 2 — TÚNEL DE ACESSO (níveis 760 a 830): túneis escuros, faixas de impedimento no chão e o Xerife do Túnel no fim.',
    cq_arquibancada: '📣 ALA 3 — ARQUIBANCADA INFINITA (níveis 830 a 900): a torcida de névoa faz a ola! O Rei da Arquibancada assiste do camarote.',
    cq_gramado: '⚽ ALA 4 — GRAMADO DA FINAL ETERNA (níveis 900 a 950): o jogo que nunca terminou. O Craque da Final espera no círculo central.' };
  for (const [ala, gx] of Object.entries(CQM_PORTAO)) {
    const ch = CQM_CHEGA[ala], p = K.portaPara('ent_tunel', gx - 1, 7, 3, 2, ala, ch.x, ch.y);
    const A = CQ_MAPAS.alas[ala]; p.cqRotulo = `${['👕', '🚦', '📣', '⚽'][A.n - 1]} Ala ${A.n} · ${A.nome} · nv ${A.nivel[0]}`;
    CQ_MAPAS.portoes[ala] = { x: gx, y: 8 };
    K.placa(gx + 3, 9, NOMES[ala]);
  }
  // o portal de volta ao Multiverso (embaixo, no meio) e a chegada na frente dele
  K.portaPara(cqMapaPortalSpr(), 26, 35, 4, 2, 'multiverso', 38, 7);
  m.inicio = { x: 28, y: 38 }; m.renasce = { x: 28, y: 38 };
  K.placa(24, 37, '🌀 PORTAL DO MULTIVERSO — volta para o Estádio do Multiverso.');
  K.placa(33, 39, '🏟️ ESTÁDIO DOS ESQUECIDOS — quando a primeira bola se partiu, a Copa de Origem nunca terminou. Os times que nunca ganharam nada ficaram aqui, jogando para sempre à espera do apito final. Vença cada time e ajude todo mundo a lembrar por que joga!');
  // NPCs: o roupeiro (Seu Saudade) e a torcedora mais antiga (Dona Memória)
  cqMapaNpc(K, 'seu_saudade', 9, 19); cqMapaNpc(K, 'dona_memoria', 45, 22);
  CQ_MAPAS.npcs = { seu_saudade: { mapa: 'cq_estadio', x: 9, y: 19 }, dona_memoria: { mapa: 'cq_estadio', x: 45, y: 22 } };
  K.placa(13, 24, '👕 ROUPEIRO — o Seu Saudade cuida dos uniformes de todos os times esquecidos. Traga Ingressos Esquecidos e ele troca por peças do Uniforme dos Esquecidos.');
  K.placa(41, 22, '📣 A ARQUIBANCADA DA DONA MEMÓRIA — ela viu todos os jogos da Copa de Origem e lembra a história de cada time.');
  const prot = K.protege();
  // roupeiro: a parede de armários (contínua), estantes e a sacola de bolas
  for (let x = 5; x <= 14; x += 2) K.poe(x, 15, 'cq_armarios', { fixo: true });
  for (let x = 6; x <= 14; x += 2) if (K.livre(x, 15)) m.obj[15 * W + x] = { t: 'x', v: 0, largo: true };
  K.poe(4, 18, 'estante'); K.poe(4, 21, 'estante'); K.poe(14, 18, 'cq_cesto_bolas'); K.poe(5, 25, 'banco'); K.poe(12, 21, 'cq_banco_reservas');
  // bilheteria velha e a fila das catracas (passagem larga no meio)
  K.poe(8, 39, 'cq_bilheteria'); K.poe(12, 40, 'banco'); K.poe(5, 34, 'lixeira');
  for (const x of [19, 21, 23, 33, 35, 37]) K.poe(x, 32, 'cq_catraca');
  // galeria de troféus empoeirados (em cima, no meio) e o emblema do estádio
  for (const x of [24, 26, 28, 30, 32]) K.poe(x, 12, 'cq_trofeus');
  K.poe(28, 10, 'cq_placa'); K.poe(20, 10, 'cq_relogio');
  // a arquibancada da Dona Memória: fileiras de cadeiras com a escadinha no meio
  for (const y of [13, 15, 17]) for (let x = 40; x <= 50; x++) if (x !== 45 && x !== 44) K.poe(x, y, 'arquibancada');
  K.poe(39, 21, 'cq_faixa'); K.poe(51, 21, 'cq_faixa');
  // refletores velhos em volta do círculo e bancos espalhados
  for (const [x, y] of [[22, 19], [35, 19], [22, 28], [35, 28]]) K.poe(x, y, 'cq_refletor');
  for (const [x, y] of [[17, 12], [40, 28], [48, 34], [18, 35], [50, 40]]) K.poe(x, y, 'banco');
  for (const [x, y] of [[44, 37], [46, 37], [15, 30], [42, 31]]) K.poe(x, y, 'cq_trofeus'); K.poe(49, 31, 'cq_cesto_bolas'); K.poe(5, 38, 'cq_cesto_bolas');
  for (const [x, y] of [[4, 11], [51, 11], [4, 31], [51, 26]]) K.poe(x, y, 'cq_faixa');
  cqMapaGaranteCaminho(m, K.piso);
  Object.assign(m, { cq: 'estadio', cqNevoa: 0.16, huntsProprios: true, semCentrinho: true });
  return m;
}

/* ============================================================
   2) ALA 1 — VESTIÁRIO ABANDONADO (700–760) — 60×50, fechado, corredores médios, capitão no fundo
   ============================================================ */
function cqMapaVestiario() {
  const W = 60, H = 50, K = cqMapaKit('cq_vestiario', '👕 Vestiário Abandonado', W, H, 41101), { b, m } = K, A = CH.CQ_AZULEJO, P = CH.CQ_PISO;
  const S = { // salas: [x, y, w, h]
    chuveiros: [3, 3, 14, 11], capitao: [22, 2, 16, 12], massagem: [43, 3, 14, 11],
    armariosA: [3, 20, 14, 10], reservas: [22, 20, 16, 10], armariosB: [43, 20, 14, 10],
    rouparia: [3, 36, 14, 10], entrada: [22, 36, 16, 11], fisica: [43, 36, 14, 10],
  };
  for (const [k, [x, y, w, h]] of Object.entries(S)) K.cava(x, y, w, h, k === 'capitao' || k === 'reservas' || k === 'entrada' ? P : A);
  // corredores (3 de largura): as linhas de baixo e do meio inteiras; em cima, o capitão só se alcança pelo banco de reservas
  K.cava(17, 23, 5, 3, P); K.cava(38, 23, 5, 3, P); K.cava(17, 39, 5, 3, P); K.cava(38, 39, 5, 3, P);
  K.cava(8, 14, 3, 6, P); K.cava(48, 14, 3, 6, P); K.cava(28, 14, 3, 6, P);
  K.cava(8, 30, 3, 6, P); K.cava(48, 30, 3, 6, P); K.cava(28, 30, 3, 6, P);
  K.chao(29, 3, 2, 11, CH.TAPETE);                                          // o tapete até o banco do capitão
  K.fecha('cq_lampada', 0.12, 4);
  // saída (a escada que sobe para o saguão)
  K.cava(29, 45, 3, 1, P); K.portaPara('sai_concreto', 29, 43, 3, 2, 'cq_estadio', CQM_PORTAO.cq_vestiario, 9);
  const ch = CQM_CHEGA.cq_vestiario; m.inicio = { x: ch.x, y: ch.y }; m.renasce = { x: ch.x, y: ch.y };
  K.placa(24, 45, '👕 VESTIÁRIO ABANDONADO — aqui os reservas esperam a vez de entrar desde a Copa de Origem. Está frio: o fôlego cansa mais rápido, traga comida de fôlego! O Capitão do Vestiário fica lá no fundo (suba pelo banco de reservas).');
  K.protege();
  // chuveiros antigos (na parede de cima) e toalhas no chão
  for (let x = 4; x <= 16; x += 3) K.poe(x, 3, 'cq_chuveiro');
  for (const [x, y] of [[6, 8], [12, 10], [9, 12]]) K.poe(x, y, 'toalha');
  // a sala do capitão: armários em volta, bancos e a prancheta
  for (const x of [23, 25, 27, 32, 34, 36]) K.poe(x, 2, 'cq_armarios');
  K.poe(25, 9, 'cq_banco_reservas'); K.poe(34, 9, 'cq_banco_reservas'); K.poe(31, 3, 'prancheta_cav'); K.poe(23, 12, 'cq_cesto_bolas'); K.poe(36, 12, 'cq_trofeus');
  // as salas de armários: duas fileiras com corredor no meio
  for (const [x0, y0] of [S.armariosA, S.armariosB].map(s => [s[0], s[1]])) {
    for (const dy of [2, 6]) for (let x = x0 + 1; x <= x0 + 12; x++) { // (fileira contínua: armário a cada 2, o vão entre eles fechado; corredor no meio)
      if (x - x0 === 6 || x - x0 === 7) continue;
      if ((x - x0) % 2) K.poe(x, y0 + dy, 'cq_armarios'); else if (K.livre(x, y0 + dy)) m.obj[(y0 + dy) * W + x] = { t: 'x', v: 0, largo: true };
    }
    K.poe(x0 + 1, y0 + 9, 'banco'); K.poe(x0 + 12, y0 + 9, 'banco');
  }
  // o banco de reservas (o salão do meio): dois bancos de cada lado, o caminho do meio livre
  for (const [x, y] of [[24, 22], [35, 22], [24, 27], [35, 27]]) K.poe(x, y, 'cq_banco_reservas');
  K.poe(27, 21, 'placar');
  // massagem, rouparia e preparação física
  for (const [x, y] of [[46, 6], [50, 6], [54, 6], [46, 10], [54, 10]]) K.poe(x, y, 'cq_maca');
  K.poe(44, 4, 'bebedouro'); K.poe(56, 12, 'sacola_bolas');
  for (const [x, y] of [[4, 37], [7, 37], [10, 37], [13, 37]]) K.poe(x, y, 'estante');
  K.poe(4, 43, 'guarda_roupa'); K.poe(15, 43, 'sacola_bolas'); K.poe(16, 38, 'cq_trofeus');
  for (const [x, y] of [[45, 38], [49, 38], [53, 38]]) K.poe(x, y, 'barra');
  K.poe(46, 43, 'barreiras'); K.poe(51, 43, 'cones'); K.poe(55, 42, 'sacola_bolas');
  K.poe(23, 37, 'banco'); K.poe(36, 37, 'bebedouro');
  // adversários: reservas (muitos), massagistas (recuperam os colegas) e gandulas (rápidos), por sala
  const G1 = (x, y, a, n) => cqMapaSpawn(K, 'cq_reserva', x, y, n || 3, a || 2);
  G1(9, 8, 2, 4); cqMapaSpawn(K, 'cq_massagista', 13, 6, 1, 1);
  for (const [x0, y0] of [S.armariosA, S.armariosB].map(s => [s[0], s[1]])) { G1(x0 + 3, y0 + 4, 2, 3); G1(x0 + 10, y0 + 4, 2, 3); cqMapaSpawn(K, 'cq_massagista', x0 + 6, y0 + 8, 1, 1); cqMapaSpawn(K, 'cq_gandula', x0 + 6, y0 + 4, 1, 1); }
  G1(26, 24, 2, 3); G1(33, 24, 2, 3); cqMapaSpawn(K, 'cq_massagista', 30, 25, 1, 1); cqMapaSpawn(K, 'cq_gandula', 30, 28, 2, 1);
  cqMapaSpawn(K, 'cq_massagista', 48, 8, 2, 2); G1(52, 9, 2, 3);
  G1(8, 41, 2, 3); cqMapaSpawn(K, 'cq_gandula', 12, 41, 1, 1); cqMapaSpawn(K, 'cq_massagista', 6, 40, 1, 1);
  G1(48, 41, 2, 3); cqMapaSpawn(K, 'cq_gandula', 53, 40, 2, 1);
  // o chefão no fundo, com 3 reservas de guarda
  cqMapaSpawn(K, 'cq_cap_vestiario', 30, 6, 1, 0); CQ_MAPAS.chefePos.cq_vestiario = { x: 30, y: 6 };
  cqMapaSpawn(K, 'cq_reserva', 24, 5, 1, 1); cqMapaSpawn(K, 'cq_reserva', 36, 5, 1, 1); cqMapaSpawn(K, 'cq_reserva', 30, 11, 1, 1);
  K.placa(27, 13, '👑 O CANTO DO CAPITÃO — o Capitão do Vestiário nunca entrou em campo. Ele é forte: entre preparado(a)!');
  cqMapaGaranteCaminho(m, K.piso);
  Object.assign(m, { cq: 'vestiario', cqAla: 'cq_vestiario', cqNevoa: 0.06, fechado: true, luzCor: '210,225,255', luzes: [cqMapaProp('cq_lampada'), 'holofote'], huntsProprios: true, semCentrinho: true });
  return m;
}

/* ============================================================
   3) ALA 2 — TÚNEL DE ACESSO (760–830) — 66×50, escuro, túneis estreitos com retas para as faixas de impedimento
   ============================================================ */
function cqMapaTunel() {
  const W = 66, H = 50, K = cqMapaKit('cq_tunel', '🚦 Túnel de Acesso', W, H, 41201), { b, m } = K, C = CH.CQ_CONCRETO, P = CH.CQ_PISO;
  // 4 túneis compridos (2 de largura), em zigue-zague, e um poço no meio que corta caminho
  const TY = [43, 33, 23, 13];
  for (const y of TY) K.cava(4, y, 57, 2, C);
  K.cava(59, 35, 2, 8, C); K.cava(4, 25, 2, 8, C); K.cava(59, 15, 2, 8, C);   // as curvas
  K.cava(32, 15, 2, 28, C);                                                   // o poço do meio (atalho)
  // câmaras (onde os times ficam) penduradas nos túneis
  const CAM = [[15, 36, 9, 5, 18, 41], [42, 36, 9, 5, 46, 41], [14, 26, 9, 5, 18, 31], [44, 26, 9, 5, 48, 31], [14, 16, 9, 5, 18, 21], [42, 16, 9, 5, 46, 21], [44, 4, 10, 6, 48, 10]];
  for (const [x, y, w, h, ox, oy] of CAM) { K.cava(x, y, w, h, P); K.cava(ox, oy, 2, 3, C); }
  // a entrada (embaixo à esquerda) e a sala do Xerife (em cima à esquerda, onde o túnel sai para o campo)
  K.cava(3, 40, 9, 8, P);
  K.cava(3, 3, 16, 8, P); K.cava(8, 11, 2, 2, C);
  K.fecha('cq_lampada', 0.16, 6);
  K.portaPara('sai_concreto', 5, 44, 3, 2, 'cq_estadio', CQM_PORTAO.cq_tunel, 9);
  const ch = CQM_CHEGA.cq_tunel; m.inicio = { x: ch.x, y: ch.y }; m.renasce = { x: ch.x, y: ch.y };
  K.placa(10, 46, '🚦 TÚNEL DE ACESSO — escuro: só se vê bem de perto, traga comida de visão! Cuidado com as faixas de impedimento no chão (pisou, volta) e com os cartões do Árbitro Esquecido. O Xerife do Túnel espera lá no alto, onde o túnel sai para o campo.');
  K.protege();
  // faixas de impedimento: linhas atravessando as retas dos túneis (a frente MECÂNICAS desenha e usa)
  CQ_MAPAS.tunelFaixas = [];
  for (const y of TY) for (const x of [14, 24, 40, 51]) CQ_MAPAS.tunelFaixas.push({ x, y, w: 1, h: 2, eixo: 'v' });
  for (const y of [19, 28, 38]) CQ_MAPAS.tunelFaixas.push({ x: 32, y, w: 2, h: 1, eixo: 'h' });
  // enfeites só nas câmaras (os túneis ficam livres): cones, barreiras, bancos e sacolas
  const enf = ['cones', 'barreiras', 'sacola_bolas', 'banco', 'cones'];
  for (const [x, y, w, h] of CAM) { K.poe(x, y, enf[(x + y) % enf.length]); K.poe(x + w - 1, y, enf[(x * 3 + y) % enf.length]); }
  K.poe(4, 3, 'cq_faixa'); K.poe(17, 3, 'cq_faixa'); K.poe(10, 3, 'cq_relogio'); K.poe(13, 3, 'placar'); K.poe(4, 9, 'cq_banco_reservas'); K.poe(17, 9, 'cq_trofeus');
  // adversários: zagueiros (nas câmaras), bandeirinhas (perto das faixas) e árbitros
  const Z = (x, y, n) => cqMapaSpawn(K, 'cq_zagueiro', x, y, n, 2);
  const CEN = CAM.map(([x, y, w, h]) => [x + (w >> 1), y + (h >> 1)]);
  CEN.forEach(([x, y], i) => { Z(x, y, i === 6 ? 3 : 4); cqMapaSpawn(K, i % 2 ? 'cq_bandeirinha' : 'cq_arbitro', x + 2, y, 1, 1); });
  for (const [x, y] of [[24, 43], [51, 43], [14, 33], [40, 33], [24, 23], [51, 23], [14, 13], [40, 13]]) cqMapaSpawn(K, 'cq_bandeirinha', x + 1, y, 1, 1);
  for (const [x, y] of [[32, 28], [56, 33], [8, 23]]) cqMapaSpawn(K, 'cq_arbitro', x, y, 1, 1);
  cqMapaSpawn(K, 'cq_xerife_tunel', 11, 6, 1, 0); CQ_MAPAS.chefePos.cq_tunel = { x: 11, y: 6 };
  cqMapaSpawn(K, 'cq_zagueiro', 6, 5, 1, 1); cqMapaSpawn(K, 'cq_zagueiro', 16, 5, 1, 1);
  K.placa(11, 12, '⭐ O FIM DO TÚNEL — aqui manda o Xerife do Túnel: apita tudo e não deixa ninguém passar. Só suba preparado(a)!');
  cqMapaGaranteCaminho(m, K.piso);
  Object.assign(m, { cq: 'tunel', cqAla: 'cq_tunel', cqNevoa: 0.05, fechado: true, luzCor: '255,226,170', luzes: [cqMapaProp('cq_lampada'), 'holofote'], huntsProprios: true, semCentrinho: true });
  return m;
}

/* ============================================================
   4) ALA 3 — ARQUIBANCADA INFINITA (830–900) — 76×58, aberto: degraus em volta da pista, o Rei no camarote
   ============================================================ */
function cqMapaArquibancada() {
  const W = 76, H = 58, K = cqMapaKit('cq_arquibancada', '📣 Arquibancada Infinita', W, H, 41301), { b, m } = K;
  const cx = 38, cy = 29, PRX = 19, PRY = 12, ARX = 33, ARY = 22;            // pista (dentro) e arquibancada (fora): elipses
  // os degraus: anéis em volta da pista, de duas cores alternadas (cada anel = um degrau)
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const kx = (i + 0.5 - cx), ky = (j + 0.5 - cy), ko = (kx / ARX) ** 2 + (ky / ARY) ** 2; if (ko > 1) continue;
    K.cava(i, j, 1, 1); const d = Math.sqrt(ko) * ARX; // distância "na escala de x" até o meio
    m.chao[j * W + i] = CH.CQ_DEGRAU_B; m._degrau = m._degrau || new Uint8Array(W * H); m._degrau[j * W + i] = 1 + (Math.floor(d / 1.7) % 2); // (fileira de cadeiras: degrau ímpar)
  }
  K.elipse(cx, cy, PRX, PRY, CH.CQ_PISTA);                                   // a pista
  K.cava(26, 23, 24, 12, CH.CQ_GRAMA);                                      // o campo, no meio da pista
  m.campos.push({ x: 26, y: 23, w: 24, h: 12, linha: 'rgba(255,255,255,0.3)' });
  // escadas (corredores retos que sobem a arquibancada) nos 4 lados
  K.cava(37, 5, 2, 13, CH.CQ_PISO); K.cava(37, 40, 2, 13, CH.CQ_PISO); K.cava(5, 28, 15, 2, CH.CQ_PISO); K.cava(56, 28, 15, 2, CH.CQ_PISO);
  // o camarote (em cima, no meio) e a entrada (embaixo)
  K.cava(28, 1, 20, 5, CH.CQ_MADEIRA); K.chao(36, 1, 4, 5, CH.TAPETE);
  K.cava(31, 50, 14, 6, CH.CQ_PISO);
  K.fecha('cq_faixa', 0.06, 6);
  K.portaPara('sai_concreto', 41, 51, 3, 2, 'cq_estadio', CQM_PORTAO.cq_arquibancada, 9);
  const ch = CQM_CHEGA.cq_arquibancada; m.inicio = { x: ch.x, y: ch.y }; m.renasce = { x: ch.x, y: ch.y };
  K.placa(34, 54, '📣 ARQUIBANCADA INFINITA — a torcida de névoa canta sem parar: o barulho gasta foco, traga comida de foco! Quando vier a OLA, saia da frente. O Rei da Arquibancada assiste do camarote, lá em cima.');
  K.protege();
  // cadeiras nos degraus: blocos com vãos (as escadas e a pista ficam livres)
  for (let j = 2; j < H - 2; j++) for (let i = 2; i < W - 2; i++) {
    if (!m._degrau || m._degrau[j * W + i] !== 2 || m.chao[j * W + i] !== CH.CQ_DEGRAU_B || !K.livre(i, j)) continue;
    const ang = Math.atan2((j + 0.5 - cy) / ARY, (i + 0.5 - cx) / ARX), setor = Math.floor((ang + Math.PI) / (Math.PI / 12));
    if (setor % 3 === 2) continue;                                             // um vão a cada 2 blocos
    if (hash2(i, j * 3) < 0.12) continue;
    K.poe(i, j, 'arquibancada');
  }
  // refletores nos cantos, faixas e o placar
  for (const [x, y] of [[9, 9], [66, 9], [9, 48], [66, 48]]) K.poe(x, y, 'cq_refletor');
  K.poe(23, 29, 'cq_faixa'); K.poe(52, 29, 'cq_faixa'); K.poe(38, 21, 'placar');
  // o camarote: o trono do Rei, troféus e bandeiras
  K.poe(29, 1, 'cq_trofeus'); K.poe(46, 1, 'cq_trofeus'); K.poe(31, 1, 'cq_faixa'); K.poe(44, 1, 'cq_faixa'); K.poe(33, 4, 'sofa'); K.poe(43, 4, 'sofa');
  // adversários: torcida de névoa (bandos, nos degraus), bumbos (na pista) e mascotes (no campo)
  const T1 = (x, y, n) => cqMapaSpawn(K, 'cq_torcida', x, y, n || 4, 2);
  for (const [x, y] of [[16, 15], [27, 9], [49, 9], [60, 15], [12, 38], [63, 38], [24, 46], [52, 46], [9, 25], [67, 25]]) T1(x, y, 4);
  for (const [x, y] of [[22, 22], [54, 22], [22, 37], [54, 37], [38, 18]]) cqMapaSpawn(K, 'cq_bumbo', x, y, 1, 2);
  for (const [x, y] of [[30, 26], [46, 31], [38, 29]]) cqMapaSpawn(K, 'cq_mascote', x, y, 1, 2);
  cqMapaSpawn(K, 'cq_rei_arquibancada', 38, 3, 1, 0); CQ_MAPAS.chefePos.cq_arquibancada = { x: 38, y: 3 };
  cqMapaSpawn(K, 'cq_torcida', 31, 3, 2, 1); cqMapaSpawn(K, 'cq_torcida', 45, 3, 2, 1);
  K.placa(40, 7, '👑 O CAMAROTE DO REI — o Rei da Arquibancada nunca perdeu um jogo... porque nunca jogou! Só suba preparado(a).');
  cqMapaGaranteCaminho(m, K.piso); delete m._degrau;
  // a ola: dá a volta na arquibancada (o anel dos degraus) e atravessa a pista/campo (áreas abertas)
  CQ_MAPAS.ola = { centro: { x: cx, y: cy }, anel: { rxDentro: PRX, ryDentro: PRY, rxFora: ARX, ryFora: ARY }, abertas: [{ x: 26, y: 23, w: 24, h: 12 }, { x: cx - PRX, y: cy - PRY, w: PRX * 2, h: PRY * 2 }], escadas: [{ x: 37, y: 5, w: 2, h: 13 }, { x: 37, y: 40, w: 2, h: 13 }, { x: 5, y: 28, w: 15, h: 2 }, { x: 56, y: 28, w: 15, h: 2 }] };
  Object.assign(m, { cq: 'arquibancada', cqAla: 'cq_arquibancada', cqNevoa: 0.1, huntsProprios: true, semCentrinho: true });
  return m;
}

/* ============================================================
   5) ALA 4 — GRAMADO DA FINAL ETERNA (900–950) — 86×66: o campo (em pé, gol em cima e embaixo), o Craque no círculo
      central e a ARENA DA FINAL (à direita, cercada; o portão só abre com a flag cq_final_liberada)
   ============================================================ */
function cqMapaGramado() {
  const W = 82, H = 66, K = cqMapaKit('cq_gramado', '⚽ Gramado da Final Eterna', W, H, 41401), { b, m } = K;
  // gramado (com a beirada) e o campo de linhas apagadas
  K.cava(4, 4, 62, 54, CH.CQ_GRAMA);
  const F = { x: 15, y: 8, w: 40, h: 46 }; m.campos.push(Object.assign({ linha: 'rgba(255,255,255,0.22)', emPe: true }, F));
  K.cava(4, 4, 6, 54); K.chao(4, 4, 6, 54, CH.CQ_PISTA); K.chao(60, 4, 6, 54, CH.CQ_PISTA);       // as pistas dos lados
  // a entrada (embaixo) e a arena da final (à direita)
  K.cava(36, 58, 14, 6, CH.CQ_PISO);
  const AR = { x: 67, y: 12, w: 13, h: 34 }; K.cava(AR.x - 1, AR.y, AR.w + 1, AR.h, CH.CQ_GRAMA);
  K.fecha('cq_faixa', 0.05, 7);
  // a CERCA da arena (grade de verdade: o que se vê é o que bloqueia) com dois vãos: o portão de ENTRADA (trancado até a flag
  // cq_final_liberada; leva para dentro) e o de SAÍDA (leva para fora). Pisar num vão vindo do lado "errado" só devolve.
  const ENT = { x: AR.x - 1, y: 28 }, SAI = { x: AR.x - 1, y: 34 };
  for (let y = AR.y; y < AR.y + AR.h; y++) if (y !== ENT.y && y !== SAI.y) m.obj[y * W + ENT.x] = { t: 'grade', v: (hash2(ENT.x, y) * 1000) | 0, fixo: true };
  b.saida(ENT.x, ENT.y, 'cq_gramado', AR.x + 1, ENT.y, { flag: 'cq_final_liberada', msg: '🔒 O portão da Final dos Onze Esquecidos só abre depois que a Bola de Origem estiver inteira.' });
  b.saida(SAI.x, SAI.y, 'cq_gramado', SAI.x - 2, SAI.y);
  m.campos.push({ x: AR.x + 1, y: AR.y + 1, w: AR.w - 2, h: AR.h - 2, linha: 'rgba(255,255,255,0.6)', emPe: true });
  K.portaPara('sai_concreto', 42, 59, 3, 2, 'cq_estadio', CQM_PORTAO.cq_gramado, 9);
  const ch = CQM_CHEGA.cq_gramado; m.inicio = { x: ch.x, y: ch.y }; m.renasce = { x: ch.x, y: ch.y };
  K.placa(38, 61, '⚽ GRAMADO DA FINAL ETERNA — aqui a final da Copa de Origem nunca terminou! Frio, escuro e barulho de uma vez: traga as 3 melhores comidas. O Craque da Final espera no círculo central.');
  K.placa(64, 26, '🏆 PORTÃO DA FINAL — atrás da cerca está o campo onde os Onze Esquecidos esperam o apito final. Só abre com a Bola de Origem inteira.');
  K.protege();
  // traves velhas (gol de cima e de baixo), refletores, bancos de reservas e o placar
  K.poe(35, 8, 'cq_trave', { fixo: true }); K.poe(35, 53, 'cq_trave', { fixo: true });
  for (const [x, y] of [[13, 6], [57, 6], [13, 55], [57, 55], [12, 22], [58, 22], [12, 40], [58, 40]]) K.poe(x, y, 'cq_refletor');
  K.poe(7, 26, 'cq_banco_reservas'); K.poe(7, 36, 'cq_banco_reservas'); K.poe(7, 31, 'prancheta_cav'); K.poe(26, 5, 'placar'); K.poe(46, 5, 'placar');
  for (const [x, y] of [[5, 10], [5, 50], [64, 10], [64, 50]]) K.poe(x, y, 'cq_faixa');
  // a arena: gols, a taça no pedestal, refletores e a cerca (grade) por dentro
  const acx = AR.x + (AR.w >> 1);
  K.poe(acx, AR.y + 1, 'cq_trave', { fixo: true }); K.poe(acx, AR.y + AR.h - 2, 'cq_trave', { fixo: true });
  K.poe(AR.x + 1, AR.y + 1, 'cq_refletor', { fixo: true }); K.poe(AR.x + AR.w - 2, AR.y + 1, 'cq_refletor', { fixo: true });
  K.poe(AR.x + 1, AR.y + AR.h - 2, 'cq_refletor', { fixo: true }); K.poe(AR.x + AR.w - 2, AR.y + AR.h - 2, 'cq_refletor', { fixo: true });
  K.poe(AR.x + AR.w - 2, AR.y + (AR.h >> 1), 'cq_taca_pedestal', { fixo: true });
  // adversários em "formações": técnico no meio, craques e goleiro em volta (o técnico fortalece quem está perto)
  const FORM = [[22, 15], [48, 15], [26, 23], [44, 23], [20, 31], [50, 31], [26, 40], [44, 40], [22, 48], [48, 48]];
  for (const [x, y] of FORM) { cqMapaSpawn(K, 'cq_tecnico', x, y, 1, 1); cqMapaSpawn(K, 'cq_craque', x, y, 2, 2); }
  for (const [x, y] of [[35, 11], [35, 50], [18, 22], [52, 40]]) cqMapaSpawn(K, 'cq_goleiro', x, y, 2, 2);
  for (const [x, y] of [[35, 19], [35, 42], [29, 27], [41, 35], [29, 45], [41, 17]]) cqMapaSpawn(K, 'cq_craque', x, y, 2, 2);
  cqMapaSpawn(K, 'cq_craque_final', 35, 31, 1, 0); CQ_MAPAS.chefePos.cq_gramado = { x: 35, y: 31 };
  // o chefão da FINAL (pós-950): fica na arena cercada; o portão só abre com a flag cq_final_liberada (pedido da frente MISSÕES:
  // sem um spawn, a missão dos Onze não tinha "onde achar"). A frente MECÂNICAS cuida da volta semanal (respawn) e da formação.
  cqMapaSpawn(K, 'cq_onze', acx, AR.y + (AR.h >> 1), 1, 0); CQ_MAPAS.chefePos.final = { x: acx, y: AR.y + (AR.h >> 1) };
  K.placa(31, 33, '⭐ O CÍRCULO CENTRAL — o Craque da Final nunca ergueu uma taça. Dizem que ele dribla até a sombra. Só entre preparado(a)!');
  cqMapaGaranteCaminho(m, K.piso);
  // a arena da final: pontos para a frente MECÂNICAS (os Onze em formação: goleiro, zaga, meio e ataque)
  const fy = AR.y + 2;
  CQ_MAPAS.final = { mapa: 'cq_gramado', area: AR, centro: { x: acx, y: AR.y + (AR.h >> 1) }, entrada: { x: AR.x + 1, y: ENT.y }, portao: ENT, saida: SAI, volta: { x: SAI.x - 2, y: SAI.y }, taca: { x: AR.x + AR.w - 2, y: AR.y + (AR.h >> 1) },
    formacao: [{ pos: 'goleiro', x: acx, y: fy + 1 },
      { pos: 'zaga', x: acx - 4, y: fy + 6 }, { pos: 'zaga', x: acx - 1, y: fy + 5 }, { pos: 'zaga', x: acx + 2, y: fy + 5 }, { pos: 'zaga', x: acx + 4, y: fy + 6 },
      { pos: 'meio', x: acx - 4, y: fy + 11 }, { pos: 'meio', x: acx, y: fy + 10 }, { pos: 'meio', x: acx + 4, y: fy + 11 },
      { pos: 'ataque', x: acx - 3, y: fy + 15 }, { pos: 'ataque', x: acx, y: fy + 16 }, { pos: 'ataque', x: acx + 3, y: fy + 15 }] };
  Object.assign(m, { cq: 'gramado', cqAla: 'cq_gramado', cqNevoa: 0.1, huntsProprios: true, semCentrinho: true });
  return m;
}

Object.assign(MAPAS_DEF, { cq_estadio: cqMapaEstadio, cq_vestiario: cqMapaVestiario, cq_tunel: cqMapaTunel, cq_arquibancada: cqMapaArquibancada, cq_gramado: cqMapaGramado });
if (typeof CHAO2 !== 'undefined' && CHAO2.mapas) for (const id of Object.keys(CQ_MAPAS.alas)) CHAO2.mapas[id] = CHAO2.mapas[id] || 'cq_grama';

/* ---------- o campo "em pé" (gol em cima e embaixo): as linhas giradas ---------- */
{
  const _linhasCq = drawLinhasCampo;
  drawLinhasCampo = function (ctx, f) {
    if (!f || !f.emPe) return _linhasCq.apply(this, arguments);
    const cx = (f.x + f.w / 2) * T, cy = (f.y + f.h / 2) * T;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 2); ctx.translate(-cx, -cy);
    const g = { x: f.x + f.w / 2 - f.h / 2, y: f.y + f.h / 2 - f.w / 2, w: f.h, h: f.w, linha: f.linha };
    try { _linhasCq.call(this, ctx, g); } finally { ctx.restore(); }
  };
}

/* ---------- o PORTAL no Estádio do Multiverso (no lugar do portal selado "Em breve") ---------- */
const CQM_MV = { x: 36, y: 5, w: 4, h: 2 };                                  // onde ficava o portal selado (multiverso.js ps1)
const cqMapaPortalAberto = () => { const s = G.save; return !!(s && ((s.nivel || 0) >= 700 || (s.flags && s.flags.cq_portal))); };
function cqMapaPoePortal(m) {
  if (!m || m._cqPortal) return;
  const W = m.w, { x, y, w, h } = CQM_MV, px = x + (w >> 1);
  if (m.predios.some(p => p.x === x && p.y === y)) return;                    // (alguém já pôs outro portal aqui)
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) m.obj[j * W + i] = { t: 'x', v: 0, predio: true };
  m.obj[(y + h - 1) * W + px] = null;
  for (let j = y + h; j <= y + h + 1; j++) { const o = m.obj[j * W + px]; if (o && !o.predio) m.obj[j * W + px] = null; }   // a frente livre
  const p = { spr: cqMapaPortalSpr(), x, y, w, h, porta: { x: px, y: y + h - 1 }, cqRotulo: '🏟️ Estádio dos Esquecidos · nv 700' };
  m.predios.push(p);
  m.saidas.push({ x: px, y: y + h - 1, para: 'cq_estadio', tx: 28, ty: 38 });
  const pl = { x: px + 2, y: y + h, texto: '🏟️ PORTAL DO ESTÁDIO DOS ESQUECIDOS — um ingresso antigo abriu este portal! Do outro lado, um estádio fora do tempo, onde os times esquecidos jogam a final que nunca terminou (níveis 700 a 950).' };
  if (!m.obj[pl.y * W + pl.x]) { m.obj[pl.y * W + pl.x] = { t: 'placa', v: 1 }; m.placas.push(pl); }
  m._cqPortal = p; delete m._mini;
  CQ_MAPAS.multiverso = { portal: { x: px, y: y + h - 1 }, frente: { x: px, y: y + h } };
}
if (MAPAS_DEF.multiverso) {
  const _mvCq = MAPAS_DEF.multiverso;
  MAPAS_DEF.multiverso = function () {
    const m = _mvCq.apply(this, arguments);
    try {
      if (cqMapaPortalAberto()) {
        // a passarela até o portal (missoes_raiox.js tinha devolvido para praça)
        const px = CQM_MV.x + (CQM_MV.w >> 1);
        for (let j = CQM_MV.y + CQM_MV.h; j <= 13; j++) { const k = j * m.w + px; if (m.chao[k] === CH.MV_PRACA && !m.obj[k]) m.chao[k] = CH.METAL; }
        cqMapaPoePortal(m);
      }
    } catch (e) { console.warn('copa_mapas: portal', e); }
    return m;
  };
}
// subiu para o 700 com o mapa do Multiverso já montado: o portal aparece na hora; perto dele = "portal visto"
setInterval(() => {
  try {
    if (!G.rodando || !G.save || !cqMapaPortalAberto()) return;
    const m = MAPAS.multiverso; if (m && !m._cqPortal) cqMapaPoePortal(m);
    if (G.mapa && G.mapa.id === 'multiverso' && m && m._cqPortal && G.p && !G.save.flags.cq_portal && Math.hypot(G.p.x - 38, G.p.y - 7) < 9) G.save.flags.cq_portal = true;
  } catch (e) { }
}, 3000);

/* ---------- plaquinha com o nome embaixo dos portões (como nas entradas de caça) ---------- */
{
  const _predCq = desenhaPredio;
  desenhaPredio = function (ctx, b) {
    const r = _predCq.apply(this, arguments);
    if (b && b.cqRotulo && aSprite(b.spr)) {
      const x = (b.porta.x + 0.5) * T, y = (b.porta.y + 1) * T + T * 0.28, s = T * 0.27;
      ctx.font = `700 ${s}px Fredoka, Nunito, sans-serif`; const tw = ctx.measureText(b.cqRotulo).width + s * 1.1, th = s * 1.55;
      ctx.fillStyle = 'rgba(40,46,70,0.9)'; ctx.strokeStyle = '#c8d4ff'; ctx.lineWidth = s * 0.12;
      ctx.beginPath(); ctx.roundRect(x - tw / 2, y - th / 2, tw, th, th / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#eef2ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.cqRotulo, x, y + s * 0.05); ctx.textBaseline = 'alphabetic';
    }
    return r;
  };
}

/* ---------- névoa e tom desbotado (fora do tempo: sem dia e noite) ---------- */
let CQM_NEVOA = null;
function cqMapaNevoa() { // uma "nuvem" macia, feita uma vez só (barato: só drawImage por quadro)
  if (CQM_NEVOA) return CQM_NEVOA;
  const c = mkCanvas(256, 256), x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, 'rgba(225,232,245,1)'); g.addColorStop(0.55, 'rgba(225,232,245,0.45)'); g.addColorStop(1, 'rgba(225,232,245,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256); return (CQM_NEVOA = c);
}
{
  const _noiteCq = desenhaNoite;
  desenhaNoite = function (ctx, cam, vw, vh) {
    const m = G.mapa;
    if (!m || !m.cq) return _noiteCq.apply(this, arguments);
    if (m.fechado) _noiteCq.apply(this, arguments);                            // escuro com as lâmpadas (cacadas.js)
    else { ctx.fillStyle = 'rgba(150,165,190,0.10)'; ctx.fillRect(cam.x, cam.y, vw, vh); } // o tom desbotado
    const a = m.cqNevoa || 0; if (!a) return;
    const nv = cqMapaNevoa(), t = G.agora / 1000, S = T * 9;
    ctx.save(); ctx.globalAlpha = a;
    // nuvens grandes presas ao mapa (andam devagar), só as que caem na tela
    const i0 = Math.floor(cam.x / S) - 1, j0 = Math.floor(cam.y / S) - 1, i1 = Math.ceil((cam.x + vw) / S) + 1, j1 = Math.ceil((cam.y + vh) / S) + 1;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const h = hash2(i, j, 7), dx = Math.sin(t * 0.07 + h * 6.3) * S * 0.35, dy = Math.cos(t * 0.05 + h * 4.1) * S * 0.2, k = 1.3 + h * 0.9;
      ctx.drawImage(nv, i * S + dx - S * k * 0.5 + S * 0.5, j * S + dy - S * k * 0.5 + S * 0.5, S * k, S * k);
    }
    ctx.restore();
  };
}

/* ---------- regras de mapa das alas ---------- */
// portão dentro do mesmo mapa (a arena da final): só leva o jogador, sem remontar o mapa (senão todo mundo voltava a aparecer)
{
  const _trocaCq = trocaMapa;
  trocaMapa = function (id, x, y) {
    if (G.mapa && G.mapa.cq && id === G.mapa.id && Number.isFinite(x) && Number.isFinite(y)) {
      Object.assign(G.p, { x, y }); G.p.mov = false; G.p.pas = null; G.caminho = null; G.alvo = null; G.acaoChegar = null;
      const cam = alvoCamera(); G.cam.x = cam.x; G.cam.y = cam.y; try { som('porta'); } catch (e) { } G.uiSujo = true;
      return;
    }
    return _trocaCq.apply(this, arguments);
  };
}
// cansou lá dentro: acorda no saguão do estádio (como nas áreas de caça)
{
  const _renCq = renascer;
  renascer = function () { if (G.mapa && G.mapa.cqAla) G.mapa = getMapa('cq_estadio'); return _renCq.apply(this, arguments); };
}
// ao entrar numa ala: avisa se é forte demais
{
  const _entCq = entrarMapa;
  entrarMapa = function (id) {
    const r = _entCq.apply(this, arguments);
    try {
      const A = CQ_MAPAS.alas[id];
      if (A && G.save && G.rodando) {
        log(`${['👕', '🚦', '📣', '⚽'][A.n - 1]} Ala ${A.n} do Estádio dos Esquecidos: ${A.nome} (níveis ${A.nivel[0]} a ${A.nivel[1]}).`, 'l-sis');
        if (G.save.nivel < A.nivel[0] - 6) log(`⚠️ Cuidado! Os times daqui são nível ${A.nivel[0]} ou mais e você é nível ${G.save.nivel}.`, 'l-dano');
      }
    } catch (e) { }
    return r;
  };
}
