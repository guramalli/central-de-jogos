/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🗼 TORRE INFINITA e 🏺 RELÍQUIAS (v322) — no Estádio do Multiverso (multiverso.js)
   - Cada andar é uma arena com adversários de todos os mundos, mais fortes a cada andar:
     andar N = nível 400 + 6×N (andar 100 = nível 1000). A cada 10 andares, um chefão.
   - Vencer um andar pela 1ª vez dá XP, tostões e Fichas da Torre. O recorde fica guardado.
   - Seis andares especiais guardam um GUARDIÃO DA RELÍQUIA (34, 42, 50, 67, 84 e 100): muito mais
     forte que um chefão normal — sem as melhores poções, os melhores itens e habilidades altas,
     não passa. Junto com uma entrega de material raro, ele libera uma RELÍQUIA: o item mais forte
     daquele lugar no corpo, único. Pedido do dono: "missões de itens raríssimos do 400 ao 1000,
     realmente difíceis".
   - Também aqui: as 4 jogadas lendárias (uma por classe, níveis 420–450).
   Carregar DEPOIS de multiverso.js.
   ============================================================ */
const TORRE_W = 34, TORRE_H = 30;
const torreNivel = n => 400 + 6 * n;
const torreDados = () => { const s = G.save; if (!s.torre || typeof s.torre !== 'object') s.torre = { max: 0, andar: 0 }; return s.torre; };

/* ---------- relíquias ---------- */
// [id, nome, slot, nível, andar do guardião, dados do item, material da 1ª etapa, quantidade]
const RELIQUIAS = [
  ['chuteira_deuses', 'Chuteiras dos Deuses do Futebol', 'chuteira', 600, 34, { atk: 262, st: { vel: 58, chute: 24, drible: 24 } }, 'brasa_eterna', 120],
  ['caneleira_infinito', 'Caneleiras do Infinito', 'perna', 650, 42, { def: 78, st: { defesa: 24, hp: 3400 } }, 'gelo_eterno', 120],
  ['camisa_multiverso', 'Camisa do Multiverso', 'camisa', 700, 50, { def: 200, st: { hp: 9000, defesa: 28 }, avatar: 'roupa-futebol', cor: '#2a1a5a', cor2: '#ffcf3a', estampa: 'tx_camisa_galactica' }, 'coroa_raios', 5],
  ['calcao_cosmico', 'Calção Cósmico', 'calcao', 800, 67, { def: 58, st: { vel: 36, hp: 2200 }, avatar: 'baixo-shorts' }, 'ficha_torre', 150],
  ['amuleto_lenda', 'Amuleto da Lenda Suprema', 'acessorio', 900, 84, { def: 26, st: { foco: 2600, regen: 20, hp: 1800 }, avatar: 'pescoco-medalha' }, 'taca_multiverso', 4],
  ['coroa_eterna', 'Coroa Eterna do Rei do Futebol', 'cabeca', 1000, 100, { def: 48, st: { hp: 3600, drible: 24, chute: 24, visao: 26 }, avatar: 'chapeu-coroa' }, 'caco_coroa_cristal', 15],
];
const RELIQUIA_ANDAR = {}; RELIQUIAS.forEach(r => RELIQUIA_ANDAR[r[4]] = r);
Object.assign(ITENS, {
  ficha_torre: { nome: 'Ficha da Torre', tipo: 'loot', venda: 25000, desc: 'Ganha a cada andar vencido da Torre Infinita. O Mestre da Torre troca por prêmios.' },
  taca_multiverso: { nome: 'Taça do Multiverso', tipo: 'loot', venda: 3000000, desc: 'Troféu dos chefões da Torre Infinita (a cada 10 andares).' },
  bau_torre: { nome: 'Baú da Torre', tipo: 'consumivel', efeito: { bau: 1 }, lvl: 400, venda: 0, desc: 'Abra para ganhar poções, banquetes... e, muito raramente, uma peça de equipamento do Multiverso.' },
});
for (const [id, nome, slot, L, andar, x] of RELIQUIAS) {
  ITENS[id] = Object.assign({ nome, tipo: 'equip', slot, lvl: L, venda: L * L * 30, reliquia: true, desc: `🏺 RELÍQUIA (única): só sai da missão do Guardião do andar ${andar} da Torre Infinita.` }, x);
}
if (typeof MV_VISUAL !== 'undefined') Object.assign(MV_VISUAL, { amuleto_lenda: 'ankh_eterno', coroa_eterna: 'coroa' });
if (typeof MV_TX_CAL !== 'undefined') MV_TX_CAL.calcao_cosmico = 'tx_calcao_tempestade';
['i_ficha_torre', 'i_taca_multiverso', ...RELIQUIAS.map(r => 'i_' + r[0]), 'i_bau_torre'].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });

/* ---------- quem joga na torre ---------- */
// bichos de arte própria (Atlântida, espaço, Multiverso) — cada andar escolhe dois
function torrePool() {
  if (torrePool.cache) return torrePool.cache;
  const comuns = [], chefes = [];
  for (const [id, d] of Object.entries(MONSTROS)) {
    const l = d.look; if (!l || !l.spr || l.tipo === 'humano' || d.treino || /^tr_/.test(id)) continue;
    if ((d.nivel || 0) < 200) continue;
    (d.chefe ? chefes : comuns).push(id);
  }
  return torrePool.cache = { comuns, chefes };
}
function torreClone(base, n, papel) {
  const id = `tr_${base}_${n}${papel === 'guardiao' ? '_g' : ''}`; if (MONSTROS[id]) return id;
  const b = MONSTROS[base], L = torreNivel(n) + (papel === 'comum' ? 0 : 5);
  const arq = papel === 'comum' ? (b.ranged ? 'meia' : (b.vel || 0) >= 300 ? 'rapido' : 'zagueiro') : 'chefe';
  const rel = papel === 'guardiao' ? RELIQUIA_ANDAR[n] : null;
  const nome = rel ? `Guardião da Relíquia (${ITENS[rel[0]].nome})` : papel === 'chefe' ? `${b.nome}, Senhor do Andar ${n}` : `${b.nome} da Torre`;
  const m = montaMonstro(id, nome, arq, L, { falas: b.falas || ['Vem!'], proj: (b.ranged && b.ranged.proj) || 'bola' });
  m.look = Object.assign({}, b.look); m.torre = true; m.respawn = 999999999;
  m.ouro = [Math.round(0.8 * L ** 1.5), Math.round(1.2 * L ** 1.5)];
  // calibrado na s18 (melhor equipamento + 3 comidas + habilidades ~90): comum = peso dos mundos do Multiverso; chefe = 1,5–3 min;
  // GUARDIÃO = 5–10 min tomando 600–900% do fôlego por minuto: sem as melhores poções, comidas e itens, não passa
  if (papel === 'comum') { m.hp = Math.round(m.hp * 2.2); m.xp = Math.round(m.xp * 1.4); m.atk = Math.round(m.atk * 1.8); if (m.ranged) m.ranged.dano = Math.round(m.ranged.dano * 1.8); }
  else if (papel === 'chefe') { m.hp = Math.round(m.hp * 6); m.xp = Math.round(m.xp * 2.4); m.atk = Math.round(m.atk * 2.4); if (m.ranged) m.ranged.dano = Math.round(m.ranged.dano * 2.2); m.ouro = m.ouro.map(v => v * 3); }
  else { m.hp = Math.round(m.hp * 14); m.xp = Math.round(m.xp * 4); m.atk = Math.round(m.atk * 4.2); m.def = Math.round(m.def * 1.3); m.ouro = m.ouro.map(v => v * 6); if (m.ranged) m.ranged.dano = Math.round(m.ranged.dano * 3.8); }
  const faixa = typeof mvFaixaDe === 'function' ? mvFaixaDe(Math.min(L, 545)) : null, pecas = faixa ? Object.keys(faixa.pecas) : [];
  m.loot = papel === 'comum' ? [['ficha_torre', 0.06, 1, 1], ['elixir_multiverso', 0.06, 1, 1], ...pecas.slice(0, 2).map(p => [p, 0.0006, 1, 1])]
    : [['taca_multiverso', 1, 1, 1], ['ficha_torre', 1, 3, 6], ['bau_torre', 1, 1, 2], ...pecas.map(p => [p, papel === 'guardiao' ? 0.05 : 0.015, 1, 1])];
  return id;
}

/* ---------- o andar (arena redonda flutuando no espaço) ---------- */
function criaAndarTorre() {
  const n = Math.max(1, (G.save && torreDados().andar) || 1), L = torreNivel(n), r = mulberry(7777 + n * 131); // (sem jogo carregado: o índice dos mapas monta o andar 1)
  const W = TORRE_W, H = TORRE_H, cx = 17, cy = 14; const b = new Construtor('torre_infinita', `🗼 Torre Infinita — andar ${n} (nível ${L})`, W, H, CH.ESTRELAS, 7000 + n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, (y - cy) * 1.1);
    if (d <= 12.5) b.chao(x, y, d >= 11 ? CH.METAL : CH.MV_PRACA); else b.obj(x, y, 'x');
  }
  b.campo(11, 10, 13, 9, CH.CAMPO, null, false);
  for (const [x, y] of [[8, 6], [26, 6], [8, 22], [26, 22]]) b.obj(x, y, 'holofote');
  b.npc('porteiro_torre', 14, 24); b.m.inicio = { x: 17, y: 24 }; b.m.renasce = { x: 17, y: 24 };
  const { comuns, chefes } = torrePool(), pega = l => l[(r() * l.length) | 0];
  const rel = RELIQUIA_ANDAR[n];
  if (rel) {
    b.spawn(torreClone(pega(chefes), n, 'guardiao'), 17, 9, 1, 1);
    const g = torreClone(pega(comuns), n, 'comum'); b.spawn(g, 11, 12, 3, 2); b.spawn(g, 23, 12, 3, 2);
  } else if (n % 10 === 0) {
    b.spawn(torreClone(pega(chefes), n, 'chefe'), 17, 9, 1, 1);
    const g = torreClone(pega(comuns), n, 'comum'); b.spawn(g, 12, 12, 2, 2); b.spawn(g, 22, 12, 2, 2);
  } else {
    const a = torreClone(pega(comuns), n, 'comum'), c = torreClone(pega(comuns), n, 'comum'), q = Math.min(12, 6 + Math.floor(n / 10));
    const pos = [[11, 8], [23, 8], [9, 14], [25, 14], [17, 7], [17, 16]];
    for (let k = 0; k < q; k++) { const [x, y] = pos[k % pos.length]; b.spawn(k % 2 ? c : a, x, y, 1, 2); }
  }
  Object.assign(b.m, { torre: n, espaco: { tinta: rel ? 'rgba(255,80,80,0.08)' : n % 10 === 0 ? 'rgba(255,200,60,0.08)' : 'rgba(140,90,255,0.07)' } });
  return b.m;
}
MAPAS_DEF.torre_infinita = criaAndarTorre;
function torreEntra(n) {
  const t = torreDados(); t.andar = n;
  delete MAPAS.torre_infinita; // cada andar é montado de novo
  fechaModal(); som('porta'); trocaMapa('torre_infinita', 17.5, 24.5);
  const rel = RELIQUIA_ANDAR[n];
  banner(`🗼 Andar ${n}`, rel ? `⚠️ O GUARDIÃO DA RELÍQUIA está aqui!` : n % 10 === 0 ? 'Andar de chefão!' : `Nível ${torreNivel(n)}`);
  G.torreDesde = G.agora; G.torreLimpo = false;
}
function torreVoltaHub() { fechaModal(); som('porta'); const p = getMapa('multiverso'); trocaMapa('multiverso', 50.5, 23.5); }

/* ---------- vencer o andar ---------- */
function torreLimpou() {
  const t = torreDados(), n = G.mapa.torre, L = torreNivel(n), s = G.save, primeira = n > t.max;
  const xpNivel = x => xpPara(x + 1) - xpPara(x);
  let txt;
  if (primeira) {
    t.max = n; const xp = Math.round(xpNivel(L) * (n % 10 === 0 ? 0.8 : 0.35)), ouro = L * (n % 10 === 0 ? 4000 : 1500), fichas = 1 + Math.floor(n / 10);
    ganhaXp(xp); s.ouro += ouro; recebeItem('ficha_torre', fichas);
    for (const k of [10, 25, 50, 75, 100]) if (n >= k) s.flags['torre_' + k] = true;
    txt = `Recorde novo! +${fmt(xp)} XP, +${fmt(ouro)} tostões e ${fichas} Ficha(s) da Torre.`;
  } else { recebeItem('ficha_torre', 1); txt = 'Andar já vencido antes: +1 Ficha da Torre.'; }
  const rel = RELIQUIA_ANDAR[n]; if (rel) { s.flags['guardiao_' + rel[0]] = true; txt += ` 🏺 Você venceu o Guardião da Relíquia! Volte ao Mestre da Torre.`; }
  log(`🗼 Andar ${n} vencido! ${txt}`, 'l-lvl'); som('nivel'); salvar(); G.uiSujo = true;
  abreModal(el('h2', {}, `🗼 Andar ${n} vencido!`), el('p', {}, txt), el('p', { class: 'dica' }, `Seu recorde: andar ${t.max} (nível ${torreNivel(t.max)}).`),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => torreEntra(n + 1) }, `⬆️ Subir para o andar ${n + 1}`), el('button', { class: 'btn', onclick: torreVoltaHub }, '🏟️ Voltar ao Estádio')));
}
{
  const _atualizaTorre = atualiza;
  atualiza = function () {
    const r = _atualizaTorre.apply(this, arguments);
    try { if (G.mapa && G.mapa.torre && !G.torreLimpo && G.mons.length === 0 && G.agora - (G.torreDesde || 0) > 1500 && G.save.hp > 0) { G.torreLimpo = true; torreLimpou(); } } catch (e) { }
    return r;
  };
  // quem passou não volta (cada andar é uma partida só)
  const _matarTorre = matar;
  matar = function (m) {
    const r = _matarTorre.apply(this, arguments);
    if (G.mapa && G.mapa.torre) G.respawns = G.respawns.filter(x => x.sp !== m.sp);
    return r;
  };
  // sem fôlego na torre: acorda no Estádio (o recorde continua)
  const _renascerTorre = renascer;
  renascer = function () { if (G.mapa && G.mapa.torre) G.mapa = getMapa('multiverso'); return _renascerTorre.apply(this, arguments); };
  // recarregou o jogo dentro da torre: monta o mesmo andar de novo
  const _entraTorre = entrarMapa;
  entrarMapa = function (id) { if (id === 'torre_infinita') { delete MAPAS.torre_infinita; G.torreDesde = G.agora; G.torreLimpo = false; } return _entraTorre.apply(this, arguments); };
}

/* ---------- o Mestre da Torre e o porteiro ---------- */
const LOOK_MESTRE_TORRE = { tipo: 'humano', corpo: 'f', alt: 1.8, folha: 'ancia', pele: 'pele-media', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#f4f4f8', baixo: 'baixo-saia', chapeu: 'chapeu-cartola', chapeuVar: 'coroa_estelar', mvManterChapeu: true };
Object.assign(NPCS, {
  mestre_torre: { nome: 'Mestra Altina, da Torre Infinita', torre: 'mestre', look: LOOK_MESTRE_TORRE, ola: 'Ninguém nunca chegou ao topo desta torre. Cada andar é mais difícil que o anterior... até o nível 1000, e dizem que além. Quer tentar?' },
  porteiro_torre: { nome: 'Porteiro da Torre', torre: 'porteiro', look: { tipo: 'humano', corpo: 'm', alt: 1.75, pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: '#4a2a8a', baixo: 'baixo-jeans' }, ola: 'Vença todos os adversários deste andar para subir. Se quiser desistir, eu levo você de volta ao Estádio.' },
});
if (typeof PAPEL !== 'undefined') Object.assign(PAPEL, { mestre_torre: 'adulta', porteiro_torre: 'adulto' });
const TORRE_TROCAS = [['elixir_multiverso', 10, 2], ['foco_multiverso', 10, 2], ['banquete_anao', 4, 3], ['bau_torre', 1, 12]];
function modalTorre(npc) {
  const s = G.save, t = torreDados(), d = npc.d, prox = t.max + 1;
  if (d.torre === 'porteiro') {
    return abreModal(el('h2', {}, d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, d.ola))),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: torreVoltaHub }, '🏟️ Desistir e voltar ao Estádio'), el('button', { class: 'btn amarelo', onclick: fechaModal }, 'Continuar jogando')));
  }
  const fichas = contaItem('ficha_torre');
  const voltar = el('input', { type: 'number', min: 1, max: Math.max(1, t.max), value: Math.max(1, t.max), style: 'width:80px' });
  const relTxt = RELIQUIAS.map(([id, nome, , L, andar]) => el('li', {}, `${s.flags['guardiao_' + id] ? '✅' : '🏺'} Andar ${andar} (nível ${torreNivel(andar)}): Guardião de ${nome}`));
  abreModal(el('h2', {}, d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, d.ola))),
    el('p', {}, `🏆 Seu recorde: andar ${t.max} ${t.max ? `(nível ${torreNivel(t.max)})` : ''} · Fichas da Torre: ${fmt(fichas)}`),
    el('div', { class: 'opcoes', style: 'flex-direction:column;align-items:stretch' },
      el('button', { class: 'btn amarelo', onclick: () => torreEntra(prox) }, `⬆️ Subir para o andar ${prox} (nível ${torreNivel(prox)})${RELIQUIA_ANDAR[prox] ? ' — GUARDIÃO!' : prox % 10 === 0 ? ' — chefão' : ''}`),
      t.max ? el('div', { style: 'display:flex;gap:6px;align-items:center;justify-content:center' }, '🔁 Repetir o andar', voltar, el('button', { class: 'btn', onclick: () => torreEntra(Math.max(1, Math.min(t.max, voltar.value | 0))) }, 'Ir')) : ''),
    el('h3', {}, '🎟️ Trocar Fichas da Torre'),
    el('div', { class: 'opcoes' }, ...TORRE_TROCAS.map(([id, n, custo]) => el('button', { class: 'btn', disabled: fichas >= custo ? null : 'disabled', onclick: () => { removeItem('ficha_torre', custo); recebeItem(id, n); log(`🎟️ Trocou ${custo} Fichas por ${n}x ${ITENS[id].nome}.`, 'l-loot'); salvar(); modalTorre(npc); } }, `${n}x ${ITENS[id].nome} (${custo} fichas)`))),
    el('h3', {}, '🏺 Os Guardiões das Relíquias'), el('ul', { class: 'dica' }, ...relTxt),
    el('p', { class: 'dica' }, 'As Relíquias são as peças mais fortes do jogo. Cada uma pede uma entrega de material raro e vencer o Guardião do andar dela. Fale com a Mestra sobre as missões.'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Tchau!')));
}
{
  const _abrirNPCTorre = abrirNPC;
  abrirNPC = function (npc) {
    if (npc && npc.d && npc.d.torre === 'porteiro') return modalTorre(npc);
    if (npc && npc.d && npc.d.torre === 'mestre') {
      // missões das relíquias primeiro (se houver alguma para entregar/aceitar), senão a janela da torre
      const tem = MISSOES.some(q => q.npc === 'mestre_torre' && ['pronta', 'disponivel'].includes(statusMissao(q)));
      if (!tem) return modalTorre(npc);
    }
    return _abrirNPCTorre.apply(this, arguments);
  };
  if (typeof iconeNPC === 'function') { const _iconeNPCTorre = iconeNPC; iconeNPC = function (n) { const d = n.d || NPCS[n.id] || {}; return d.torre ? '🗼' : _iconeNPCTorre(n); }; }
  // a fala normal do NPC (missões) ganha o botão da torre
  if (typeof abrirNPC === 'function') {
    const _abrirTorreBtn = abrirNPC;
    abrirNPC = function (npc) {
      const r = _abrirTorreBtn.apply(this, arguments);
      try { if (npc && npc.d && npc.d.torre === 'mestre') { const ops = document.querySelector('#modalConteudo .opcoes'); if (ops && !ops.querySelector('.btn-torre')) ops.prepend(el('button', { class: 'btn amarelo btn-torre', onclick: () => modalTorre(npc) }, '🗼 A Torre Infinita')); } } catch (e) { }
      return r;
    };
  }
}
// Baú da Torre: poções, comida... e muito raramente uma peça do Multiverso
{
  const _usaTorre = typeof usarItem === 'function' ? usarItem : null;
  if (_usaTorre) usarItem = function (id) {
    if (id !== 'bau_torre') return _usaTorre.apply(this, arguments);
    if (!removeItem('bau_torre', 1)) return;
    const ganhos = [['elixir_multiverso', 6], ['foco_multiverso', 6], ['banquete_anao', 2]]; ganhos.forEach(([i, n]) => recebeItem(i, n));
    let msg = '6 Elixires, 6 Cristais de Foco e 2 Banquetes';
    if (Math.random() < 0.02 && typeof MV_ITENS_EQUIP !== 'undefined') { const p = MV_ITENS_EQUIP[(Math.random() * MV_ITENS_EQUIP.length) | 0]; recebeItem(p, 1); msg += ` e... ${ITENS[p].nome}!!!`; banner('🎁 Baú da Torre', ITENS[p].nome); som('raro'); }
    log(`🎁 Baú da Torre: ${msg}`, 'l-loot'); G.uiSujo = true; salvar();
  };
}

/* ---------- as missões das relíquias (com a Mestra da Torre) ---------- */
{
  const xpNivel = x => xpPara(x + 1) - xpPara(x);
  RELIQUIAS.forEach(([id, nome, , L, andar, , mat, qtd], i) => {
    MISSOES.push(
      { id: `rel_${id}_1`, npc: 'mestre_torre', titulo: `🏺 Relíquia: ${nome} (1/2)`, lvl: L - 20, lendaria: true, texto: `Para despertar ${nome}, o Guardião do andar ${andar} exige uma oferenda: ${qtd}x ${ITENS[mat].nome}.`, req: { item: mat, n: qtd }, rec: { xp: Math.round(xpNivel(L) * 1.5), ouro: L * 40000 } },
      { id: `rel_${id}_2`, npc: 'mestre_torre', titulo: `🏺 Relíquia: ${nome} (2/2)`, lvl: L - 10, lendaria: true, pre: `rel_${id}_1`, texto: `A oferenda foi aceita. Agora suba até o andar ${andar} da Torre Infinita (nível ${torreNivel(andar)}) e vença o GUARDIÃO DA RELÍQUIA. Ele é muito mais forte que qualquer chefão: leve as melhores poções.`, req: { flag: 'guardiao_' + id, desc: `Vença o Guardião da Relíquia no andar ${andar} da Torre Infinita` }, rec: { xp: Math.round(xpNivel(L) * 4), ouro: L * 150000, itens: [[id, 1]] } },
    );
  });
  // desafios lendários da torre (com o Grão-Guardião)
  MISSOES.push(
    { id: 'mv_t25', npc: 'guardiao_mv', titulo: '⭐ Lendário: andar 25 da Torre', lvl: 420, lendaria: true, texto: 'Chegue ao andar 25 da Torre Infinita (nível 550).', req: { flag: 'torre_25', desc: 'Vença o andar 25 da Torre Infinita' }, rec: { xp: Math.round(xpNivel(470) * 3), ouro: 60000000 } },
    { id: 'mv_t50', npc: 'guardiao_mv', titulo: '⭐ Lendário: andar 50 da Torre', lvl: 520, lendaria: true, pre: 'mv_t25', texto: 'Chegue ao andar 50 da Torre Infinita (nível 700).', req: { flag: 'torre_50', desc: 'Vença o andar 50 da Torre Infinita' }, rec: { xp: Math.round(xpNivel(600) * 4), ouro: 200000000 } },
    { id: 'mv_t100', npc: 'guardiao_mv', titulo: '⭐ Lendário: o topo do mundo', lvl: 700, lendaria: true, pre: 'mv_t50', texto: 'Chegue ao andar 100 da Torre Infinita (nível 1000). Ninguém nunca conseguiu.', req: { flag: 'torre_100', desc: 'Vença o andar 100 da Torre Infinita' }, rec: { xp: Math.round(xpNivel(900) * 6), ouro: 1000000000, itens: [['taca_multiverso', 5]] } },
  );
}

/* ---------- jogadas lendárias: uma por classe, só para nível altíssimo ---------- */
// (as jogadas das classes iam só até o nível 45 — do 55 ao 1000 não havia nada novo para aprender)
{
  const NOVAS = {
    muralha_titas: { nome: 'Muralha dos Titãs', tipo: 'area', lvl: 420, foco: 260, cd: 9000, raio: 2.5, poder: 7.0, skill: 'drible', fx: 'area', cor: '#4a8ae8', classe: 'paredao', atordoa: 2500, desc: 'O chão treme: dribla todo mundo em volta (bem forte) e deixa tontos por 2,5 s.' },
    chute_tempestade: { nome: 'Chute da Tempestade', tipo: 'dist', lvl: 430, foco: 300, cd: 7000, alcance: 8, poder: 12.0, skill: 'chute', fx: 'explosao', cor: '#ffe14a', classe: 'driblador', areaAlvo: 2.0, desc: 'Uma bomba cheia de raios, de muito longe, que explode em volta do alvo.' },
    jogada_multiverso: { nome: 'Jogada do Multiverso', tipo: 'dist', lvl: 440, foco: 380, cd: 8000, alcance: 8, poder: 9.5, skill: 'drible', fx: 'raio', cor: '#b07aff', classe: 'cerebro', areaAlvo: 3.0, atordoa: 1500, desc: 'Abre um portal: dribla todos em volta do alvo e eles ficam confusos por 1,5 s.' },
    fonte_runica: { nome: 'Fonte Rúnica', tipo: 'cura', lvl: 450, foco: 300, cd: 12000, poder: 6.0, fx: 'curaforte', cor: '#5aff9a', classe: 'motorzinho', efeitoMagia: 'torcida', desc: 'Uma fonte rúnica dos anões: cura enorme, e você fica mais rápido e regenera por 12 s.' },
  };
  Object.assign(DRIBLES, NOVAS);
  if (typeof VOCACAO !== 'undefined') for (const [id, d] of Object.entries(NOVAS)) { const v = VOCACAO[d.classe]; if (v && !v.magias.includes(id)) v.magias.push(id); }
  if (typeof EMOJI_DRIBLE !== 'undefined') Object.assign(EMOJI_DRIBLE, { muralha_titas: '🗿', chute_tempestade: '⛈️', jogada_multiverso: '🌀', fonte_runica: '⛲' });
  Object.keys(NOVAS).forEach(k => { const n = 'd_' + k; if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
}
