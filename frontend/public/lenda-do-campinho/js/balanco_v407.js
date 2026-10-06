/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚖️ BALANÇO v407 — Raio-X do jogo (pedido do dono, 06/10/2026: "faça tudo menos I1"). Prefixo bz.
   Regras que se ajustam sozinhas, medidas contra o próprio jogo (não números fixos que quebram no nível alto):
   - A4  XP dos adversários: um adversário "padrão" do nível L vale no mínimo xpNivel(L) / 220 (220 vitórias por nível).
         Até o nível ~228 nada muda (lá já são ≤ 220 vitórias); acima, a parede some (no 600 eram ~600 vitórias por nível).
         Missões COMUNS dos níveis 100–199 dão no máximo 0,8 nível (chefão/final 1,4): cobriam 113% do XP da faixa,
         agora 74–80% (o jogador não passa mais do nível da região só com missões).
         Caçadas (40/120 vitórias, eram 80/250) e Coleções (10×/25×, eram 20×/50×) abaixo do nível 200: o prêmio acompanha
         o pedido (lá as missões SÃO o tempo de jogo). Do 200 em diante o prêmio fica cheio: ali o jogador já precisa de
         5–10× mais vitórias do que as missões pedem, então o tempo por nível depende do total de XP das missões, não do pedido.
         (A XP dos andares da Torre está em torre_infinita.js: teto "seu nível + 10" e repetição diária.)
   - A5  Classes: rendimento contra 3 adversários nos níveis 100/300/500 (suíte de classes): meta ±15% entre as classes.
   - A6  Economia em "vitórias do nível": R(L) = tostões + valor do loot que um adversário do nível L dá (mediana do jogo).
         Refino: custo = 12 × R(nível do item) × (r+1)^1,7 (nunca mais caro que antes). Luxo: no máximo 8.000 × R(nível).
         Missões do fim (nível 400+): tostões no máximo 150 × R (comum), 400 × R (chefão/final), 1.000 × R (lendária).
         Troca garantida de peças do Multiverso por Fichas da Torre (antes: 0,08% de chance por adversário e nenhuma loja).
         Garrafas de fôlego curam % do fôlego (tamanhos 1–3: 25%, 4–5: 40%, 6–8: 60%; nunca menos que antes) e o preço
         acompanha o quanto curam (o mesmo preço por ponto de fôlego de cada garrafa).
         Prêmio do Estádio: no mínimo 0,75 nível do estádio; chefão de arena: no mínimo 0,5 nível da arena.
   - T1  Ficha: "⚔️ Poder" com "seu poder vem de…" (bestiário e museu agora são só enfeite/título: bestiario.js, museu.js).
   - T3  Dragãozinho (pago, Steam): só visual — com ele vale o bônus e o nível da SUA Arara (ganha jogando).
   Saves antigos: nada é tirado; preços e XP novos valem daqui para frente.
   Carregar NO FIM: depois de bestiario.js (e de todos os arquivos que criam missões, adversários e itens).
   ============================================================ */
const BZ = { PEDIDO_ATE: 200, K_XP: 220, K_REFINO: 12, V_LUXO: 8000, MIS_OURO: { comum: 150, grande: 400, lendaria: 1000 }, MIS_OURO_DESDE: 400,
  TETO_100_200: { comum: 0.8, grande: 1.4 }, EST_FRAC: 0.75, ARENA_FRAC: 0.5 };
window.BZ = BZ;
const bzXpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));

/* ---------- R(L): quanto UMA vitória rende no nível L (tostões + valor do loot), mediana dos adversários do mundo ---------- */
const BZ_RENDA = new Map();
function bzRenda(L) {
  L = Math.max(1, Math.round(L / 5) * 5); if (BZ_RENDA.has(L)) return BZ_RENDA.get(L);
  if (!bzRenda.lista) {
    bzRenda.lista = [];
    for (const [k, d] of Object.entries(MONSTROS)) {
      if (!d || d.chefe || d.treino || d.pedra || d.arena || !(d.xp > 0) || !d.ouro || /^(tr_|ce_|est_|pedra_)/.test(k)) continue;
      let nv; try { nv = nivelMonstro(d); } catch (e) { continue; }
      const loot = (d.loot || []).reduce((a, [id, ch, mn, mx]) => a + ch * ((mn || 1) + (mx || mn || 1)) / 2 * ((ITENS[id] && ITENS[id].venda) || 0), 0);
      bzRenda.lista.push([nv, (d.ouro[0] + d.ouro[1]) / 2 + loot]);
    }
  }
  let v = [];
  for (let tol = 15; tol <= 400 && v.length < 3; tol += 10) v = bzRenda.lista.filter(([nv]) => Math.abs(nv - L) <= tol).map(x => x[1]);
  v.sort((a, b) => a - b);
  const r = v.length ? Math.max(1, Math.round(v[v.length >> 1])) : 20;
  BZ_RENDA.set(L, r); return r;
}
BZ.renda = bzRenda;
const bzRedondo = v => { if (v < 1000) return Math.round(v); const p = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.round(v / p) * p; }; // 2 algarismos

/* ======================= A4: XP dos adversários ligada à curva ======================= */
// fator sobre a XP de um adversário do nível L: um adversário padrão (statsNivel) do nível L passa a valer pelo menos
// xpNivel(L)/220. Abaixo do ~228 o fator é 1 (nada muda); no 300 ≈ 1,33; no 500 ≈ 2,2; no 684 ≈ 3,1.
function bzFatorXp(L) {
  if (!(L > 200)) return 1;
  const ref = typeof statsNivel === 'function' ? statsNivel(L).xp : 0.55 * L * L;
  return Math.max(1, bzXpNivel(L) / (BZ.K_XP * ref));
}
BZ.fatorXp = bzFatorXp;
{
  // aplicado NA HORA da vitória (vale para todo adversário: mundo, Torre, Ecos, dungeons), só na XP da própria vitória
  let BZ_XP_ALVO = null;
  const _matarBz = matar;
  matar = function (m) {
    let ant = BZ_XP_ALVO;
    try { const d = m && m.d; if (d && d.xp > 0 && !d.treino) { const f = bzFatorXp(nivelMonstro(d)); if (f > 1) BZ_XP_ALVO = { d, f }; } } catch (e) { }
    try { return _matarBz.apply(this, arguments); } finally { BZ_XP_ALVO = ant; }
  };
  const _ganhaXpBz = ganhaXp;
  ganhaXp = function (n) {
    // a XP esperada da vitória é calculada AGORA (dentro da vitória): a caça em grupo (caca_grupo.js) muda a penalidade
    // só durante o matar dela (CG_FATOR) — assim o fator vale igual sozinho e em grupo
    if (BZ_XP_ALVO && n > 0) { let esp = -1; try { esp = Math.round(BZ_XP_ALVO.d.xp * ((typeof penalidadeNivel === 'function' ? penalidadeNivel(BZ_XP_ALVO.d).xp : 1) || 0)); } catch (e) { }
      if (n === esp) { n = Math.round(n * BZ_XP_ALVO.f); BZ_XP_ALVO = null; } }
    return _ganhaXpBz.call(this, n);
  };
}

// missões comuns dos níveis 100–199: teto 0,75 nível (chefão/final 1,4; lendárias como estavam)
{
  const lendaria = q => /^⭐/.test(q.titulo || '') || /^rel_.*_2$/.test(q.id) || q.lendaria;
  const grande = q => { const k = q.req && q.req.kill && MONSTROS[q.req.kill]; return !!(k && k.chefe) || /_m[45]$|_rei5$|_lorde$|_chefe$|esp_m[2-6]$|atl_m4$|_final$|^mv_[agl]\d$/.test(q.id) || !!(q.rec && q.rec.flag); };
  // v407 (frente de missões, Raio-X A3): as Caçadas pedem 40/120 vitórias (eram 80/250) e as Coleções 10×/25× (eram 20×/50×).
  // Abaixo do nível 200 (onde as missões cobrem 80–113% do XP e são o tempo de jogo) o prêmio acompanha o pedido
  // (XP e tostões × pedido novo / pedido antigo), para a XP por hora não dobrar. Do 200 em diante fica cheio: medido, o
  // jogador precisa de ~21.000 vitórias na faixa 200–300 e as missões pedem ~2.800 — cortar o prêmio só aumentaria a parede.
  // Regra pelo próprio pedido: se ele mudar de novo, o prêmio acompanha sozinho. Itens do prêmio não mudam.
  let c = 0;
  for (const q of MISSOES) {
    if (!q.rec || !q.req) continue; let f = 1;
    if (/^guia_/.test(q.npc || '') && q.req.kill && q.req.n) { if (q.id === q.npc.slice(5) + '_m1') f = q.req.n / 80; else if (q.id === q.npc.slice(5) + '_m2') f = q.req.n / 250; }
    else if (q.req.itens && q.req.itens.length === 1) { const n0 = /^Coleção: /.test(q.titulo || '') ? 20 : /^Encomenda grande: /.test(q.titulo || '') ? 50 : 0; if (n0) f = q.req.itens[0][1] / n0; }
    if ((q.lvl || 1) < BZ.PEDIDO_ATE && f < 1 && f > 0) { if (typeof q.rec.xp === 'number') q.rec.xp = Math.max(1, Math.round(q.rec.xp * f)); if (q.rec.ouro > 0) q.rec.ouro = Math.max(1, Math.round(q.rec.ouro * f)); c++; }
  }
  BZ.missoesPedidoMenor = c;
  let n = 0;
  for (const q of MISSOES) {
    const L = q.lvl || 1; if (L < 100 || L >= 200 || !q.rec || typeof q.rec.xp !== 'number' || lendaria(q)) continue;
    const teto = Math.round(bzXpNivel(L) * (grande(q) ? BZ.TETO_100_200.grande : BZ.TETO_100_200.comum));
    if (q.rec.xp > teto) { q.rec.xp = teto; n++; }
  }
  BZ.missoesXp100_200 = n;
  // tostões das missões do fim (400+) pela régua de vitórias do nível
  let o = 0;
  for (const q of MISSOES) {
    const L = q.lvl || 1; if (L < BZ.MIS_OURO_DESDE || !q.rec || !(q.rec.ouro > 0)) continue;
    const teto = bzRedondo(bzRenda(L) * (lendaria(q) ? BZ.MIS_OURO.lendaria : grande(q) ? BZ.MIS_OURO.grande : BZ.MIS_OURO.comum));
    if (q.rec.ouro > teto) { q.rec.ouro = teto; o++; }
  }
  BZ.missoesOuroFim = o;
}

/* ======================= A5: classes (rendimento contra 3 adversários juntos, níveis 100/300/500) ======================= */
// Medido com a suíte de classes no modo "dano por minuto" (3 adversários de corpo a corpo do nível com vida ×50, 6 lutas de
// 3 min por classe e nível; jogador preparado, habilidades reais). O XP por minuto com vitórias variava ±40% de uma luta para
// outra (poucas vitórias por luta); o dano por minuto varia ±5% e é o que vira XP. % = diferença para a média das 4 classes:
//            Paredão   Artilheiro  Cérebro   Motorzinho
//   v406 100:  −10%       −1%       +16%        −5%
//   v406 300:  −16%      +25%       +11%       −20%
//   v406 500:  −18%      +46%       +11%       −39%
//   v407 100:    0%      −15%        +6%        +9%
//   v407 300:   −6%      +11%        +3%        −8%
//   v407 500:   −3%      +11%        +2%       −10%     (meta: ±15%)
const BZ_CLASSES = {
  voc: { paredao: { dano: 1.25 }, driblador: { dano: 0.86 }, motorzinho: { dano: 1.12 } },
  magias: { raiz: { poder: 3.6, raio: 2.8 }, chute_tempestade: { poder: 7.0 }, muralha_titas: { poder: 8.5 } }, // (Cérebro já estava na média: sem mudança)
  // Motorzinho não tinha jogada de ataque nova depois do 45 (as outras classes ganham uma no 420–440): a Raiz cresce no 420
  raizForte: { lvl: 420, poder: 10.0, raio: 3.0 },
};
BZ.classes = BZ_CLASSES;
function bzAplicaClasses() {
  try {
    for (const [c, o] of Object.entries(BZ_CLASSES.voc)) if (typeof VOCACAO !== 'undefined' && VOCACAO[c]) Object.assign(VOCACAO[c], o);
    for (const [id, o] of Object.entries(BZ_CLASSES.magias)) if (DRIBLES[id]) Object.assign(DRIBLES[id], o);
    if (typeof VOCACAO !== 'undefined') {
      VOCACAO.paredao.forte = 'Golpe de perto muito forte (+85%), dano geral +25% e muito fôlego (+35%).';
      VOCACAO.driblador.forte = 'Chute de longe (+2 de alcance) e mais crítico.';
    }
  } catch (e) { console.warn('bz classes', e); }
}
bzAplicaClasses();
function bzRaiz() {
  const r = DRIBLES.raiz, s = G.save; if (!r || !s) return;
  const forte = (s.nivel || 1) >= BZ_CLASSES.raizForte.lvl, b = forte ? BZ_CLASSES.raizForte : BZ_CLASSES.magias.raiz;
  r.poder = b.poder; r.raio = b.raio;
  r.desc = forte ? 'O gramado inteiro segura todo mundo em volta (bem forte, raio grande): dano e ficam presos 2 s.' : 'O gramado segura todo mundo em volta: dano e ficam presos 2 s.';
}

/* ======================= A6: refino, luxo, materiais raros ======================= */
{
  // (materiais raros: já existem para todas as faixas — atlantida.js 200/232/268, espaco.js 300–380, multiverso.js 400–525+;
  //  o Raio-X tinha olhado só a lista do data.js, que para no 130. Nada a mudar.)
  const _custoRefinoBz = custoRefino;
  custoRefino = function (id, r) {
    const c = _custoRefinoBz.apply(this, arguments); const it = ITENS[id];
    try { if (it && c) { const novo = Math.round(BZ.K_REFINO * bzRenda(it.lvl || 1) * Math.pow(r + 1, 1.7)) + 20; if (novo < c.tostoes) c.tostoes = novo; } } catch (e) { }
    return c;
  };
  // luxo: no máximo 8.000 vitórias do nível
  const luxo = (o) => { if (o && o.luxo > 0 && o.lvl) { const teto = bzRedondo(BZ.V_LUXO * bzRenda(o.lvl)); if (teto < o.luxo) { o.luxoAntes = o.luxo; o.luxo = teto; } } };
  try { if (typeof MONT_LUXO !== 'undefined') MONT_LUXO.forEach(id => luxo(MONTARIAS[id])); } catch (e) { }
  try { if (typeof SKIN_LUXO !== 'undefined') SKIN_LUXO.forEach(id => luxo(SKINS[id])); } catch (e) { }
}

/* ======================= A6: garrafas de fôlego em % do fôlego ======================= */
const BZ_POC = { agua: 0.25, acai: 0.25, vitamina: 0.25, energetico: 0.4, kit_massagista: 0.4, elixir_mar: 0.6, soro_estelar: 0.6, elixir_multiverso: 0.6 };
const BZ_POC_BASE = {};
for (const id of Object.keys(BZ_POC)) { const it = ITENS[id]; if (it && it.efeito && it.efeito.hp) BZ_POC_BASE[id] = { hp: it.efeito.hp, preco: it.preco || 0, k: (typeof LINHAS_RECUP !== 'undefined' ? LINHAS_RECUP[0].ids.indexOf(id) : -1) }; }
function bzAtualizaPocoes() {
  const s = G.save; if (!s) return; let mx; try { mx = stats().maxHp; } catch (e) { return; }
  for (const [id, b] of Object.entries(BZ_POC_BASE)) {
    const it = ITENS[id], pc = BZ_POC[id], v = Math.max(b.hp, Math.round(pc * mx));
    it.efeito.hp = v; if (b.preco) it.preco = Math.max(b.preco, Math.round(b.preco * v / b.hp));
    it.desc = `Recupera ${Math.round(pc * 100)}% do seu fôlego (agora: ${fmt(v)}; nunca menos que ${fmt(b.hp)}).` + (b.k >= 0 ? ` Tamanho ${b.k + 1} de 7: quanto maior, mais recupera.` : '');
  }
}
BZ.pocoes = bzAtualizaPocoes;
{
  const _usarItemBz = usarItem; usarItem = function (id) { if (BZ_POC_BASE[id]) bzAtualizaPocoes(); return _usarItemBz.apply(this, arguments); };
  const _bebeBz = bebeMelhor; bebeMelhor = function () { bzAtualizaPocoes(); return _bebeBz.apply(this, arguments); };
  const _abrirNPCBz = abrirNPC; abrirNPC = function () { bzAtualizaPocoes(); return _abrirNPCBz.apply(this, arguments); };
  const _iniBz = iniciarJogo; iniciarJogo = async function () { const r = await _iniBz.apply(this, arguments); try { bzAtualizaPocoes(); bzRaiz(); } catch (e) { } return r; };
  const _subBz = subiuNivel; subiuNivel = function () { const r = _subBz.apply(this, arguments); try { bzAtualizaPocoes(); bzRaiz(); } catch (e) { } return r; };
  const _eqBz = equipar; equipar = function () { const r = _eqBz.apply(this, arguments); try { bzAtualizaPocoes(); } catch (e) { } return r; };
}

/* ======================= prêmios do Estádio e chefões de arena como fração do nível ======================= */
if (typeof premioEstadio === 'function') {
  const _premioEstadioBz = premioEstadio;
  premioEstadio = function (e) { const p = _premioEstadioBz.apply(this, arguments); try { p.xp = Math.max(p.xp, Math.round(BZ.EST_FRAC * bzXpNivel(e.L))); } catch (x) { } return p; };
}
try { if (typeof ARENAS !== 'undefined') for (const a of ARENAS) { const d = MONSTROS[a.chefe.id]; if (d) d.xp = Math.max(d.xp, Math.round(BZ.ARENA_FRAC * bzXpNivel(a.L))); } } catch (e) { }

/* ======================= baú do cartão Hoje (hoje.js, frente de design) pela mesma régua ======================= */
// era 3 × (50 + 20 × nível) tostões: 22 vitórias no nível 20, mas menos de 2 vitórias no 600. Agora no mínimo 15 vitórias do
// seu nível (nunca menos que antes). hoje.js carrega DEPOIS deste arquivo: o embrulho entra quando a página termina de carregar.
addEventListener('load', () => {
  if (typeof hjPremio !== 'function' || hjPremio._bz) return;
  const _hjPremioBz = hjPremio;
  hjPremio = function (s = G.save) { const p = _hjPremioBz.apply(this, arguments); try { p.ouro = Math.max(p.ouro, bzRedondo(15 * bzRenda((s && s.nivel) || 1))); } catch (e) { } return p; };
  hjPremio._bz = true;
});
// (revanche de arena do dia, arenas.js: 20% do prêmio do chefão = 0,1 nível com o piso de 0,5 nível abaixo — cabe na régua)

/* ======================= troca garantida: peças do Multiverso por Fichas da Torre ======================= */
const BZ_TROCA = { runica: 120, brasa: 150, titanica: 180, tempestade: 220 };
BZ.troca = BZ_TROCA;
function bzTrocaPeca(id, custo, npc) {
  const it = ITENS[id]; if (!it) return;
  const faz = () => {
    if (contaItem('ficha_torre') < custo) { log(`🎟️ Faltam ${fmt(custo - contaItem('ficha_torre'))} Fichas da Torre.`, 'l-sis'); som('erro'); return; }
    removeItem('ficha_torre', custo); recebeItem(id, 1);
    log(`🛡️ Troca garantida: ${fmt(custo)} Fichas da Torre por ${it.nome}!`, 'l-loot'); som('raro'); salvar(); G.uiSujo = true;
    if (npc) modalTorre(npc);
  };
  if (typeof perguntaJogo === 'function') perguntaJogo(`Trocar ${fmt(custo)} Fichas da Torre por ${it.nome}?`, { sim: 'Trocar' }).then(ok => { if (ok) faz(); });
  else faz();
}
if (typeof modalTorre === 'function') {
  const _modalTorreBz = modalTorre;
  modalTorre = function (npc) {
    const r = _modalTorreBz.apply(this, arguments);
    try {
      if (!npc || !npc.d || npc.d.torre !== 'mestre' || typeof MV_FAIXAS === 'undefined') return r;
      const s = G.save, fichas = contaItem('ficha_torre'), box = document.getElementById('modalConteudo'); if (!box) return r;
      const faixas = MV_FAIXAS.filter(f => BZ_TROCA[f.id] && s.nivel >= f.L - 10);
      const sec = el('div', { class: 'bz-troca' }, el('h3', {}, '🛡️ Troca garantida: peças do Multiverso'),
        el('p', { class: 'dica' }, faixas.length ? 'Escolha a peça que você quer: sem sorteio. As Fichas vêm de cada andar vencido (e repetido).' : 'A partir do nível 400 você pode trocar Fichas por peças do Multiverso que escolher.'),
        ...faixas.map(f => el('div', { class: 'opcoes', style: 'flex-wrap:wrap' }, el('b', { style: 'width:100%' }, `${f.nome} (nível ${f.L}) — ${fmt(BZ_TROCA[f.id])} fichas cada`),
          ...Object.keys(f.pecas).filter(id => ITENS[id]).map(id => el('button', { class: 'btn mini' + (fichas >= BZ_TROCA[f.id] ? ' amarelo' : ''), type: 'button', disabled: fichas >= BZ_TROCA[f.id] ? null : 'disabled', onclick: () => bzTrocaPeca(id, BZ_TROCA[f.id], npc) }, ITENS[id].nome)))));
      const antes = [...box.querySelectorAll('h3')].find(h => /Guardiões/.test(h.textContent));
      if (antes) antes.before(sec); else box.append(sec);
    } catch (e) { console.warn('bz troca', e); }
    return r;
  };
}

/* ======================= T3: Dragãozinho só visual ======================= */
if (typeof mascBonus === 'function') {
  const _mascBonusBz = mascBonus;
  // com o Dragãozinho (comprado) vale o bônus da SUA Arara, no nível e na fase dela (0 se a Arara não foi liberada jogando)
  mascBonus = function (tipo) {
    try {
      if (typeof mascAtual === 'function' && mascAtual() === 'dragao') {
        if (MASC.arara.bonus !== tipo || !mascDragaoBonus()) return 0;
        return MASC.arara.v * mascFase(mascDados('arara').nv).k;
      }
    } catch (e) { return 0; }
    return _mascBonusBz.apply(this, arguments);
  };
  try { const o = ADORNOS2.OPCOES.mascote.find(x => x[0] === 'dragao'); if (o) o[4] = 'Um filhote de dragão com a ponta do rabo de bola. Só visual: com ele vale o bônus da SUA Arara (o nível dela), que você libera jogando.'; } catch (e) { }
}

/* ======================= T1: "⚔️ Poder" na Ficha + títulos do bestiário e do museu ======================= */
function bzTitulos() {
  const s = G.save, t = [];
  try { if (typeof bstResumo === 'function') { const c = bstResumo().comp; const nv = [[100, '📚 Lenda do Bestiário'], [50, '📚 Mestre Caçador(a)'], [25, '📚 Caçador(a)'], [10, '📚 Aprendiz de Caçador(a)']].find(([n]) => c >= n); if (nv) t.push(nv[1]); } } catch (e) { }
  try { const m = s.museu; if (m && m.colecoes && typeof MU_COLECOES !== 'undefined') { if (s.flags && s.flags.museu_completo) t.push('🏛️ Curador(a) Mestre'); else for (const [k, nome] of MU_COLECOES) if (m.colecoes[k]) t.push(`🏛️ Curador(a) de ${nome}`); } } catch (e) { }
  return t;
}
function bzPoder() {
  const s = G.save, st = stats(), modo = G.modo === 'chute' ? 'chute' : 'drible', pct = v => (v >= 0 ? '+' : '') + Math.round(v * 100) + '%';
  const poder = Math.round(danoMaxJogador(modo));
  let atk0 = 0; for (const slot in s.equip) { const it = ITENS[s.equip[slot]]; if (it) atk0 += it.atk || 0; }
  const fontes = [];
  fontes.push(['👕', 'Equipamento', `ataque ${fmt(st.atk)}${st.atk > atk0 + 0.5 ? ` (o refino dá +${fmt(st.atk - atk0)})` : ''} — peças raras já vêm mais fortes`]);
  fontes.push(['🎓', 'Habilidades', `${modo === 'chute' ? 'chute' : 'drible'} ${fmt(modo === 'chute' ? st.chute : st.drible)}`]);
  fontes.push(['💪', 'Atributos', `Habilidade ${pct(st.atr.habilidade * 0.006)} de dano · Inteligência ${pct(st.atr.inteligencia * 0.008)} nas jogadas`]);
  const v = typeof VOCACAO !== 'undefined' && VOCACAO[s.classe]; if (v) fontes.push(['🎽', `Classe (${CLASSES[s.classe].nome})`, `dano ${pct((v.dano || 1) - 1)} · de perto ${pct(v.perto - 1)} · de longe ${pct(v.longe - 1)}`]);
  if (s.posicao && POSICOES[s.posicao]) fontes.push(['🧭', 'Posição', `${POSICOES[s.posicao].nome}: dano ${pct((POSICOES[s.posicao].dano || 1) - 1)}`]);
  try { const b = mascBonus('dano'); if (b) fontes.push(['🐾', 'Mascote', `${pct(b)} de dano`]); } catch (e) { }
  try { const b = typeof despBonus === 'function' ? despBonus('dano') : 0; if (b) fontes.push(['🌟', 'Despertar', `${pct(b)} de dano`]); } catch (e) { }
  try { const rel = Object.values(s.equip).filter(id => ITENS[id] && ITENS[id].reliquia).map(id => ITENS[id].nome); if (rel.length) fontes.push(['🏺', 'Relíquias', rel.join(', ')]); } catch (e) { }
  try { const c = comidasAtivas(s); if (c.length) fontes.push(['🍽️', 'Comidas', c.map(x => ITENS[x.id] ? ITENS[x.id].nome : x.id).join(', ')]); } catch (e) { }
  fontes.push(['📚', 'Bestiário e 🏛️ Museu', 'dão enfeites e títulos (não mudam o poder)']);
  return { poder, fontes };
}
if (typeof abreFicha === 'function') {
  const _abreFichaBz = abreFicha;
  abreFicha = function () {
    const r = _abreFichaBz.apply(this, arguments);
    try {
      const box = document.getElementById('modalConteudo'); if (!box || box.querySelector('.bz-poder')) return r;
      const P = bzPoder(), tit = bzTitulos();
      box.append(el('details', { class: 'bz-poder', style: 'margin:8px 0;padding:6px 10px;border:2px solid #d8c09a;border-radius:10px;background:#fffaf0;color:#3d2b3a' },
        el('summary', { style: 'cursor:pointer;font-weight:800' }, `⚔️ Poder: ${fmt(P.poder)} `, el('small', { style: 'font-weight:600' }, '— seu poder vem de… (clique)')),
        el('ul', { style: 'margin:6px 0 0;padding-left:18px' }, ...P.fontes.map(([ic, nome, txt]) => el('li', {}, `${ic} `, el('b', {}, nome), `: ${txt}`))),
        tit.length ? el('p', { style: 'margin:6px 0 0' }, el('b', {}, '🎖️ Títulos: '), tit.join(' · ')) : ''));
    } catch (e) { console.warn('bz poder', e); }
    return r;
  };
}
BZ.poder = () => bzPoder(); BZ.titulos = () => bzTitulos();
