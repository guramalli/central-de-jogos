/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏛️ MUSEU DOS COLECIONÁVEIS (v365, dono: "esses colecionáveis servem para quê? a sensação é que são só para guardar
   no armazém" → escolheu "Museu + trocas com o Professor Coral" e a sorte acumulada).
   - ☰ Mais › 🏛️ Museu: os colecionáveis de cada região (lr_<região>_4), em 7 coleções. DOAR (da mochila ou do
     armazém) deixa o item exposto para sempre. Coleção completa → troféu para a casa + título (v407, Raio-X T1: antes dava +5% de XP
     e +5% de tostões contra os adversários daquele mundo; o jogo parou de criar fontes de poder). Museu completo → Troféu de Ouro + mascote Corujinha Curadora.
   - SORTE ACUMULADA: cada região conta os adversários vencidos desde o último colecionável dela; em 6.000 ele cai
     garantido (antes disso vale a chance normal, ~1 em 5.000).
   - PROFESSOR CORAL (Atlântida): colecionável REPETIDO vira pontos de coleção (1 a 5, pelo nível da região) e os pontos
     viram prêmios: poções, Baú da Torre, Fichas, Brasas Eternas e os mascotes Polvinho Malabarista e Corujinha Curadora.
     Nada sorteado se compra aqui (regra da Steam: ver RISCOS_STEAM.md).
   Salvo em save.museu = { doados: {região: 1}, sorte: {região: n}, pts, premios: {}, colecoes: {} }.
   Carregar DEPOIS de loot_regioes.js, jurassico.js e adornos2.js.
   ============================================================ */
{
  const MU_COLECOES = [
    ['brasil', '🇧🇷 Brazil', ['vila', 'praia', 'cidade', 'ct', 'estadio', 'rio', 'santos']],
    ['mundo', '🌍 Middle of the World', ['cairo', 'doha', 'toquio', 'miami', 'buenos']],
    ['europa', '🏰 Europe', ['lisboa', 'paris', 'munique', 'milao', 'madri', 'londres']],
    ['cacadas', '🗺️ Earth Hunts', ['caca_esgotos', 'caca_dunas', 'caca_morcegos', 'caca_aranha', 'caca_minas', 'caca_piramide', 'caca_tanukis', 'caca_deserto', 'caca_jacares', 'caca_recife', 'caca_touros', 'caca_catedral', 'caca_yeti', 'caca_fantasma', 'caca_vulcao', 'caca_covil']],
    ['espaco', '🚀 Space', ['lua', 'marte', 'saturno', 'nebulosa']],
    ['multiverso', '🌀 Multiverse', ['caca_mv_minas', 'caca_mv_grutas', 'caca_mv_lava', 'caca_mv_trono', 'caca_mv_nuvens', 'caca_mv_floresta', 'caca_mv_ponte', 'caca_mv_pico']],
    ['jurassico', '🦖 Jurassic Valley', ['jur_labirinto']],
  ];
  for (const c of MU_COLECOES) c[2] = c[2].filter(r => typeof LOOT_REG !== 'undefined' && LOOT_REG[r]);
  const MU_REGIOES = MU_COLECOES.flatMap(c => c[2]), MU_TOTAL = MU_REGIOES.length;
  const MU_COL_DE = {}; for (const [k, , regs] of MU_COLECOES) for (const r of regs) MU_COL_DE[r] = k;
  const MU_GARANTIA = 6000, MU_BONUS = 0; // v407 (Raio-X T1): coleção completa dá troféu e TÍTULO, não mais +5% de XP/tostões (era 0.05)
  const colItem = r => `lr_${r}_4`;
  window.MU_COLECOES = MU_COLECOES;

  // troféus das coleções (dá para expor na casa: contam muito prestígio)
  for (const [k, nome] of MU_COLECOES) ITENS['trofeu_museu_' + k] = { nome: `Museum Trophy: ${nome.replace(/^\S+\s/, '')}`, tipo: 'loot', venda: 0, raro: true, desc: `🏆 You completed the ${nome} collection at the Collectibles Museum! Display it in your house.`, icon: { k: 'trofeu', c: '#e0b020' } };
  ITENS.trofeu_museu_ouro = { nome: '🏆 Museum Gold Trophy', tipo: 'loot', venda: 0, raro: true, desc: '🏆 You completed the WHOLE Collectibles Museum. Very few stars in the world have one of these!', icon: { k: 'trofeu', c: '#ffd23f' } };
  if (typeof ICON_ALIAS !== 'undefined') { for (const [k] of MU_COLECOES) ICON_ALIAS['trofeu_museu_' + k] = 'i_medalha_ouro'; ICON_ALIAS.trofeu_museu_ouro = 'i_medalha_colecionador'; }

  const mu = () => { const s = G.save; if (!s.museu || typeof s.museu !== 'object') s.museu = {}; const m = s.museu; m.doados = m.doados || {}; m.sorte = m.sorte || {}; m.premios = m.premios || {}; m.colecoes = m.colecoes || {}; m.pts = m.pts || 0; return m; };
  const doados = () => Object.keys(mu().doados).filter(r => MU_REGIOES.includes(r)).length;
  const colecaoCompleta = k => { const c = MU_COLECOES.find(x => x[0] === k); return !!(c && c[2].length && c[2].every(r => mu().doados[r])); };
  window.museuDados = () => ({ doados: doados(), total: MU_TOTAL });
  // pontos de cada colecionável pelo nível da região (média dos adversários dela)
  const NIVEL_REG = {};
  function nivelReg(r) {
    if (NIVEL_REG[r] != null) return NIVEL_REG[r];
    const ls = Object.values(MONSTROS).filter(d => d && d.lootReg === r && !d.chefe).map(d => nivelMonstro(d));
    return (NIVEL_REG[r] = ls.length ? Math.round(ls.reduce((a, b) => a + b, 0) / ls.length) : 1);
  }
  const ptsReg = r => { const L = nivelReg(r); return L >= 400 ? 5 : L >= 300 ? 4 : L >= 150 ? 3 : L >= 60 ? 2 : 1; };
  const nomeReg = r => (LOOT_REG[r] && LOOT_REG[r][0]) || r;

  /* ---------- doar ---------- */
  const noArmazem = id => (G.save.armazem || []).filter(e => e.id === id && e.c == null).reduce((a, e) => a + (e.q || 1), 0);
  function tiraDoArmazem(id) { const a = G.save.armazem || []; const i = a.findIndex(e => e.id === id && e.c == null); if (i < 0) return false; if ((a[i].q || 1) > 1) a[i].q--; else a.splice(i, 1); return true; }
  function doar(r) {
    const id = colItem(r), m = mu(); if (m.doados[r]) return;
    if (contaItem(id)) removeItem(id, 1); else if (!tiraDoArmazem(id)) { log('You don\'t have that collectible in your backpack or in storage.', 'l-sis'); return; }
    m.doados[r] = 1; som('nivel'); efeito('estrelas', G.p.x, G.p.y, '#ffd23f');
    log(`🏛️ You donated ${ITENS[id].nome} to the Museum! (${doados()}/${MU_TOTAL})`, 'l-lvl');
    const k = MU_COL_DE[r];
    if (k && colecaoCompleta(k) && !m.colecoes[k]) {
      m.colecoes[k] = 1; const c = MU_COLECOES.find(x => x[0] === k);
      recebeItem('trofeu_museu_' + k, 1);
      banner(`🏆 ${c[1]} collection complete!`, `Trophy for your house and the title "Curator of ${c[1]}" on your Profile!`);
      log(`🏆 ${c[1]} collection complete! You got a trophy to display in your house and the title "Curator of ${c[1]}" (it shows on your Profile).`, 'l-lvl');
    }
    if (doados() >= MU_TOTAL && !m.premios.museu_ouro) {
      m.premios.museu_ouro = 1; G.save.flags.museu_completo = true; recebeItem('trofeu_museu_ouro', 1);
      banner('🏛️ MUSEUM COMPLETE!', 'The Gold Trophy and the Curator Owlet are yours!'); G.save.flags.pet_corujinha = true;
    }
    salvar(); G.uiSujo = true; modalMuseu();
  }

  /* ---------- a janela do Museu ---------- */
  function icone(id, px) { const o = iconeItem(id), c = document.createElement('canvas'); c.width = o.width; c.height = o.height; c.getContext('2d').drawImage(o, 0, 0); c.style.cssText = `width:${px}px;height:${px}px`; const n = (typeof ICON_ALIAS !== 'undefined' && ICON_ALIAS[id]) || 'i_' + id, sp = spr(n); if (sp && !sp.ok && !sp.err) { let t = 0; const iv = setInterval(() => { if (spr(n).ok || ++t > 50) { clearInterval(iv); setTimeout(() => { const o2 = iconeItem(id); c.getContext('2d').clearRect(0, 0, c.width, c.height); c.getContext('2d').drawImage(o2, 0, 0); }, 60); } }, 200); } return c; }
  function modalMuseu(aba) {
    const s = G.save; if (!s) return; const m = mu();
    const blocos = MU_COLECOES.map(([k, nome, regs]) => {
      const feitos = regs.filter(r => m.doados[r]).length, completa = feitos === regs.length;
      const itens = regs.map(r => {
        const id = colItem(r), tem = contaItem(id) + noArmazem(id), doou = !!m.doados[r], sorte = Math.min(MU_GARANTIA, m.sorte[r] || 0);
        const ic = icone(id, 46); if (!doou) ic.classList.add('mu-falta');
        return el('div', { class: 'mu-item' + (doou ? ' doou' : '') },
          ic, el('div', { class: 'mu-txt' }, el('b', {}, doou ? ITENS[id].nome : '???'), el('small', {}, nomeReg(r)),
            doou ? el('small', { class: 'mu-ok' }, '✅ In the museum') : el('div', { class: 'mu-barra', title: 'Built-up luck: after 6,000 opponents from this region without finding the collectible, it drops for sure.' }, el('i', { style: `width:${Math.round(sorte / MU_GARANTIA * 100)}%` }), el('span', {}, `🍀 ${fmt(sorte)}/${fmt(MU_GARANTIA)}`))),
          !doou && tem ? el('button', { class: 'btn mini amarelo', type: 'button', onclick: () => doar(r) }, 'Donate') : '');
      });
      return el('details', { class: 'mu-col', open: !completa && feitos ? 'open' : null },
        el('summary', {}, `${completa ? '🏆' : '🏛️'} ${nome} (${feitos}/${regs.length})${completa ? ' · trophy and title' : ''}`), el('div', { class: 'mu-grade' }, ...itens));
    });
    // v411.9 (dono: "o sistema do museu está meio confuso"): no topo, o que fazer agora — repetidos para trocar e as regiões
    // mais perto do colecionável garantido (antes só dava para ver abrindo coleção por coleção)
    const rep = repetidos(), nRep = rep.reduce((a, x) => a + x.q, 0);
    const perto = MU_REGIOES.filter(r => !m.doados[r] && (m.sorte[r] || 0) > 0).sort((a, b) => (m.sorte[b] || 0) - (m.sorte[a] || 0)).slice(0, 3);
    const topo = el('div', { class: 'mu-topo' },
      el('div', {}, el('b', {}, `🔁 Duplicates: ${nRep}`), el('small', {}, ` · collection points: ${m.pts}`), ' ',
        el('button', { class: 'btn mini' + (nRep || m.pts ? ' amarelo' : ''), type: 'button', onclick: () => modalTrocaCoral(null) }, 'Trade with Professor Coral')),
      perto.length ? el('div', {}, el('b', {}, '🍀 Closest to a guaranteed drop: '), perto.map(r => `${nomeReg(r)} (${fmt(m.sorte[r] || 0)}/${fmt(MU_GARANTIA)})`).join(' · ')) : '');
    abreModal(el('h2', {}, `🏛️ Collectibles Museum (${doados()}/${MU_TOTAL})`),
      el('p', { class: 'dica' }, `Each region of the game hides ONE super-rare collectible (about a 1 in 5,000 chance per opponent; after ${fmt(MU_GARANTIA)} opponents in that region without finding it, it drops guaranteed). Donate it to the museum (from your backpack or storage): completing a collection gives you a trophy for your house and a Curator title on your Profile. Duplicates become collection points with Professor Coral — right here, with the button below, or with him in Atlantis.`),
      topo, ...blocos, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Close')));
  }
  window.modalMuseu = modalMuseu;
  window.muTrocaCoral = () => modalTrocaCoral(null); // v411.9: as trocas também pelo Museu (o Professor Coral manda os pontos por carta)

  /* ---------- sorte acumulada + bônus das coleções completas ---------- */
  let BONUS_AGORA = 1;
  { const _gx = ganhaXp; ganhaXp = function (n) { if (BONUS_AGORA > 1 && n > 0) n = Math.round(n * BONUS_AGORA); return _gx.call(this, n); }; }
  {
    const _matar = matar;
    matar = function (m) {
      const s = G.save, d = m && m.d, r = d && d.lootReg;
      if (!s || !r || !MU_REGIOES.includes(r) || d.chefe) return _matar.apply(this, arguments);
      const M = mu(), id = colItem(r), antes = contaItem(id), ouro0 = s.ouro, k = MU_COL_DE[r];
      BONUS_AGORA = k && M.colecoes[k] ? 1 + MU_BONUS : 1;
      let res; try { res = _matar.apply(this, arguments); } finally { BONUS_AGORA = 1; }
      try {
        if (k && M.colecoes[k] && s.ouro > ouro0) s.ouro += Math.round((s.ouro - ouro0) * MU_BONUS);
        if (contaItem(id) > antes) M.sorte[r] = 0; // achou do jeito normal: a sorte recomeça
        else {
          M.sorte[r] = (M.sorte[r] || 0) + 1;
          if (M.sorte[r] >= MU_GARANTIA) {
            M.sorte[r] = 0; recebeItem(id, 1);
            banner('🍀 BUILT-UP LUCK!', `${ITENS[id].nome} — the collectible from ${nomeReg(r)}!`); som('nivel');
            log(`🍀 After ${fmt(MU_GARANTIA)} opponents, all that built-up luck brought you: ${ITENS[id].nome}! Donate it to the Museum (☰ Menu › 📒 Star’s Notebook › Museum).`, 'l-lvl'); // v408 (Raio-X I6): o Museu agora é uma aba do Caderno
          }
        }
      } catch (e) { }
      return res;
    };
  }

  /* ---------- o Professor Coral troca os repetidos ---------- */
  const potForte = () => { const L = (G.save && G.save.nivel) || 1; return L >= 400 ? 'elixir_multiverso' : L >= 300 ? 'soro_estelar' : L >= 200 ? 'elixir_mar' : 'kit_massagista'; };
  const MU_PREMIOS = [
    { id: 'pocoes', nome: () => `10x ${ITENS[potForte()].nome}`, pts: 2, da: () => recebeItem(potForte(), 10) },
    { id: 'fichas', nome: () => '10 Tower Tokens', pts: 5, lvl: 400, da: () => recebeItem('ficha_torre', 10) },
    { id: 'bau', nome: () => '1 Tower Chest', pts: 4, lvl: 400, da: () => recebeItem('bau_torre', 1) },
    { id: 'brasas', nome: () => '5 Eternal Embers', pts: 6, lvl: 500, da: () => recebeItem('brasa_eterna', 5) },
    { id: 'polvinho', nome: () => '🐙 Juggler Octopus Pet', pts: 30, uma: true, da: () => { G.save.flags.pet_polvinho = true; } },
    { id: 'corujinha', nome: () => '🦉 Curator Owlet Pet', pts: 60, uma: true, da: () => { G.save.flags.pet_corujinha = true; } },
  ];
  function repetidos() { // colecionáveis que já estão no museu (v411.9, dono: "o museu está confuso": mochila E armazém, como na doação)
    const m = mu(); return MU_REGIOES.filter(r => m.doados[r] && contaItem(colItem(r)) + noArmazem(colItem(r)) > 0).map(r => ({ r, q: contaItem(colItem(r)) + noArmazem(colItem(r)), pts: ptsReg(r) }));
  }
  const entregaUm = r => { const id = colItem(r); if (contaItem(id)) { removeItem(id, 1); return true; } return tiraDoArmazem(id); };
  function modalTrocaCoral(npc) {
    const m = mu(), s = G.save, rep = repetidos();
    const entrega = rep.length ? el('div', { class: 'mu-grade' }, ...rep.map(({ r, q, pts }) => el('div', { class: 'mu-item doou' }, icone(colItem(r), 40), el('div', { class: 'mu-txt' }, el('b', {}, `${ITENS[colItem(r)].nome} ×${q}`), el('small', {}, `${pts} point(s) each`)),
      el('button', { class: 'btn mini amarelo', type: 'button', onclick: () => { if (!entregaUm(r)) return; m.pts += pts; som('moeda'); log(`🔁 Professor Coral took ${ITENS[colItem(r)].nome}: +${pts} collection point(s) (${m.pts}).`, 'l-loot'); salvar(); modalTrocaCoral(npc); } }, 'Hand in 1'))))
      : el('p', { class: 'vazio' }, 'You have no duplicate collectibles (not in your backpack or storage). Only ones ALREADY in the museum become points: the first one from each region goes to the museum!');
    const premios = el('div', { class: 'opcoes' }, ...MU_PREMIOS.map(p => {
      const pegou = p.uma && m.premios[p.id], trava = p.lvl && s.nivel < p.lvl;
      return el('button', { class: 'btn' + (m.pts >= p.pts && !pegou && !trava ? ' amarelo' : ''), type: 'button', disabled: pegou || trava || m.pts < p.pts ? 'disabled' : null,
        onclick: () => { m.pts -= p.pts; if (p.uma) m.premios[p.id] = 1; p.da(); som('nivel'); log(`🔁 Trade with Professor Coral: ${p.nome()}!`, 'l-lvl'); if (p.uma) banner(`${p.nome()}!`, 'Pick it in Equipment → ✨ Cosmetics → pet.'); salvar(); modalTrocaCoral(npc); } },
        `${p.nome()} — ${p.pts} pts${pegou ? ' (already yours)' : trava ? ` (level ${p.lvl})` : ''}`);
    }));
    abreModal(el('h2', {}, '🔁 Professor Coral\'s Trades'),
      el('div', { class: 'npc-topo' }, npc ? retratoNPC(npc) : '', el('div', { class: 'fala' }, el('p', {}, '"A duplicate collectible? How wonderful! The museum only needs one of each... I\'ll trade the others for collection points, and you can trade the points for whatever you want."'),
        el('p', {}, el('b', {}, `Your collection points: ${m.pts}`)))),
      el('h3', {}, 'Hand in duplicates'), entrega, el('h3', {}, 'Trade points'), premios,
      el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => modalMuseu() }, '🏛️ See the Museum'), el('button', { class: 'btn', onclick: () => npc ? abrirNPC(npc) : modalMuseu() }, 'Back')));
  }
  {
    const _ab = abrirNPC;
    abrirNPC = function (npc) {
      const r = _ab.apply(this, arguments);
      try {
        if (npc && npc.id === 'prof_coral') {
          const ops = document.querySelector('#modalConteudo .opcoes');
          if (ops) { ops.insertBefore(el('button', { class: 'btn amarelo', type: 'button', onclick: () => modalTrocaCoral(npc) }, '🔁 Trade duplicate collectibles'), ops.lastChild); ops.insertBefore(el('button', { class: 'btn', type: 'button', onclick: () => modalMuseu() }, '🏛️ Collectibles Museum'), ops.lastChild); }
        }
      } catch (e) { }
      return r;
    };
  }

  /* ---------- os mascotes de prêmio ---------- */
  try {
    if (typeof ADORNOS2 !== 'undefined') {
      const mas = ADORNOS2.OPCOES.mascote;
      if (!mas.some(o => o[0] === 'polvinho')) mas.push(['polvinho', 'Juggler Octopus', '🐙', { ok: () => !!(G.save && G.save.flags && G.save.flags.pet_polvinho), txt: '🔒 Professor Coral\'s Trades' }, 'Juggles three little balls without dropping any!']);
      if (!mas.some(o => o[0] === 'corujinha')) mas.push(['corujinha', 'Curator Owlet', '🦉', { ok: () => !!(G.save && G.save.flags && G.save.flags.pet_corujinha), txt: '🔒 Complete museum or Professor Coral\'s trades' }, 'With glasses and a magnifying glass, it checks out everything you find.']);
    }
  } catch (e) { }

  /* ---------- botão no ☰ Mais ---------- */
  (function poeBotao(t = 0) {
    const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => poeBotao(t + 1), 500); return; }
    if (document.getElementById('btnMuseu')) return;
    const b = el('button', { class: 'btn', id: 'btnMuseu', type: 'button', role: 'menuitem' }, '🏛️ Collectibles Museum'); b.onclick = () => modalMuseu();
    lista.append(b);
  })();
  // a descrição dos colecionáveis passa a falar do museu
  for (const r of MU_REGIOES) { const it = ITENS[colItem(r)]; if (it) it.desc = `⭐ COLLECTIBLE from ${nomeReg(r)}: very, very rare. DONATE it to the Collectibles Museum (☰ Menu › 📒 Star’s Notebook › Museum; v408) to complete the collection — or, if it’s a duplicate, trade it with Professor Coral, in Atlantis.`; }

  const css = document.createElement('style');
  css.textContent = `
  .mu-col { border: 1px solid rgba(120,80,40,.25); border-radius: 8px; padding: 6px 10px; margin: 6px 0; background: rgba(255,255,255,.35); }
  .mu-col summary { cursor: pointer; font-weight: 800; }
  .mu-topo { display: flex; flex-direction: column; gap: 4px; padding: 6px 8px; margin: 4px 0 8px; border-radius: 8px; background: rgba(255,210,63,.18); border: 1px solid rgba(160,110,20,.35); font-size: 13px; }
  .mu-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 6px; margin-top: 6px; }
  .mu-item { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border-radius: 6px; background: rgba(0,0,0,.05); }
  .mu-item.doou { background: rgba(255,210,63,.18); }
  .mu-item canvas.mu-falta { filter: grayscale(1) brightness(.5); opacity: .55; }
  .mu-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: 12.5px; }
  .mu-txt b { font-size: 13px; } .mu-ok { color: #2a7a2a; font-weight: 700; }
  .mu-barra { position: relative; height: 14px; background: rgba(0,0,0,.12); border-radius: 7px; overflow: hidden; margin-top: 2px; }
  .mu-barra i { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg,#7ad07a,#3aa04a); }
  .mu-barra span { position: relative; font-size: 10.5px; padding-left: 6px; font-weight: 700; }`;
  document.head.append(css);
}
