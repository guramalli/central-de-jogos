/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🛒 LOJA DE PONTOS DAS TAREFAS DE CAÇA, AMPLIADA (v283)
   Antes: garrafas, isotônicos, tostões, figurinhas e bônus de XP. Agora também:
   - DO DIA A DIA: kit da forja (retalhos e couros), material raro da sua região, Fio de Ouro,
     bônus de XP de 1 hora;
   - ⭐ RAROS (só com MUITOS pontos; os exclusivos, uma vez só): troféu de arena da sua faixa,
     Boné do Caçador, Mochila do Caçador (+20 espaços), Faixa do Caçador, Estátua Dourada e
     Bateria da Torcida (móveis para a casa) e a Bola de Ouro do Caçador (item de coleção).
   Pontos: caçada da vez = 10; tarefa da semana = 6 (semana completa = +20).
   Carregar DEPOIS de tarefas.js, casas.js, luxo.js e brasil_vivo.js.
   ============================================================ */
{
  /* ---------- os itens exclusivos ---------- */
  const EXCL = 'EXCLUSIVO das Tarefas de caça (não se compra com tostões).';
  Object.assign(ITENS, {
    bone_cacador: { nome: 'Boné do Caçador', tipo: 'equip', slot: 'cabeca', def: 4, st: { visao: 2, vel: 4 }, lvl: 20, preco: 15000, venda: 0, raro: true, cacador: true, avatar: 'chapeu-bone', cor: '#2a7a3a', desc: `${EXCL} +2 visão de jogo, +4 velocidade.` },
    faixa_cacador: { nome: 'Faixa do Caçador', tipo: 'equip', slot: 'acessorio', def: 6, st: { foco: 120, regen: 3, drible: 2, chute: 2 }, lvl: 40, preco: 40000, venda: 0, raro: true, cacador: true, desc: `${EXCL} +120 foco, +3 recuperação, +2 drible e +2 chute.` },
    mochila_cacador: { nome: 'Mochila do Caçador', tipo: 'bolsa', espacos: 20, lvl: 20, preco: 0, venda: 0, raro: true, cacador: true, desc: `${EXCL} +20 espaços. Fica dentro da mochila (até 4 bolsas contam).` },
    bola_cacador: { nome: 'Bola de Ouro do Caçador', tipo: 'loot', venda: 0, raro: true, cacador: true, desc: `${EXCL} Item de coleção dos maiores caçadores. Exponha na sua casa (em cima de mesa, estante, balcão ou baú)!` },
    mv_estatua_dourada: { nome: 'Estátua Dourada da Lenda', tipo: 'movel', obj: 'estatua_dourada', preco: 0, venda: 0, raro: true, cacador: true, desc: `${EXCL} Móvel para a sua casa: a estátua de quem virou lenda. Dentro da sua casa, use (ou botão direito) para colocar na sua frente.` },
    mv_bateria_torcida: { nome: 'Bateria da Torcida', tipo: 'movel', obj: 'bateria_torcida', preco: 0, venda: 0, raro: true, cacador: true, desc: `${EXCL} Móvel para a sua casa: os surdos da torcida organizada. Dentro da sua casa, use (ou botão direito) para colocar na sua frente.` },
  });
  ICON_ALIAS.mv_estatua_dourada = 'estatua_dourada'; ICON_ALIAS.mv_bateria_torcida = 'bateria_torcida';
  for (const n of ['i_bone_cacador', 'i_faixa_cacador', 'i_mochila_cacador', 'i_bola_cacador']) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  if (typeof RAR_CACHE !== 'undefined' && RAR_CACHE) for (const k of ['bone_cacador', 'faixa_cacador', 'mochila_cacador', 'bola_cacador', 'mv_estatua_dourada', 'mv_bateria_torcida']) RAR_CACHE[k] = 'lendario';

  /* ---------- a loja nova ---------- */
  const nv = () => G.save.nivel;
  const raroRegiao = () => typeof materialRaroRefino === 'function' ? materialRaroRefino(nv()) : null;
  const trofeu = () => typeof trofeuRefino === 'function' ? trofeuRefino(nv()) : null;
  // os que já existiam ganham ícone e explicação
  const EXTRA_ANTIGOS = {
    folego: { icone: () => tarMelhor('hp'), desc: 'Garrafas de água para recuperar o fôlego (a melhor do seu nível).' },
    foco: { icone: () => tarMelhor('foco'), desc: 'Isotônicos para recuperar o foco (o melhor do seu nível).' },
    ouro: { emoji: '💰', desc: 'Tostões na hora (quanto maior o seu nível, mais tostões).' },
    figs: { icone: () => 'pacotinho', desc: 'Figurinhas para o seu álbum.' },
    xp: { emoji: '⭐', desc: 'Todo XP que você ganhar vale 30% a mais (só conta o tempo jogando).' },
  };
  for (const o of TAR_LOJA) Object.assign(o, EXTRA_ANTIGOS[o.id] || {});
  TAR_LOJA.push(
    { id: 'xp60', pts: 45, emoji: '🌟', nome: () => 'Bônus de XP: +30% por 1 HORA de jogo', desc: 'O dobro do tempo do bônus comum, por menos pontos.', da: () => { tarDados().bonusXpMs += 60 * 60000; } },
    { id: 'kit_forja', pts: 20, icone: () => 'retalho', nome: () => 'Kit da Forja: 6 Retalhos + 3 Couros', desc: 'Materiais para refinar do +4 ao +9 na Forja.', da: () => { recebeItem('retalho', 6); recebeItem('couro', 3); } },
    { id: 'raro_regiao', pts: 30, icone: raroRegiao, mostra: () => !!(raroRegiao() && ITENS[raroRegiao()]), nome: () => `3× ${ITENS[raroRegiao()].nome}`, desc: 'O material RARO da sua região, pedido na Forja do +5 em diante.', da: () => recebeItem(raroRegiao(), 3) },
    { id: 'fio_ouro', pts: 60, icone: () => 'fio_ouro', nome: () => '1 Fio de Ouro', desc: 'Material raríssimo para o refino +10.', da: () => recebeItem('fio_ouro', 1) },
    // ⭐ raros
    { id: 'trofeu', pts: 120, raro: true, icone: trofeu, mostra: () => !!(trofeu() && ITENS[trofeu()]), nome: () => `1 ${ITENS[trofeu()].nome}`, desc: 'O troféu de arena da sua faixa, pedido na Forja no +9 e no +10 (o chefão só dá 1 por dia!).', da: () => recebeItem(trofeu(), 1) },
    { id: 'bone_cacador', pts: 150, raro: true, unico: true, icone: () => 'bone_cacador', nome: () => ITENS.bone_cacador.nome, desc: '+2 visão de jogo, +4 velocidade. Para a cabeça.', lvl: 20, da: () => recebeItem('bone_cacador', 1) },
    { id: 'mv_bateria_torcida', pts: 160, raro: true, unico: true, icone: () => 'mv_bateria_torcida', nome: () => ITENS.mv_bateria_torcida.nome, desc: 'Móvel exclusivo para a sua casa: os surdos da torcida.', da: () => recebeItem('mv_bateria_torcida', 1) },
    { id: 'mochila_cacador', pts: 220, raro: true, unico: true, icone: () => 'mochila_cacador', nome: () => ITENS.mochila_cacador.nome, desc: '+20 espaços na mochila. Exclusiva dos caçadores!', lvl: 20, da: () => recebeItem('mochila_cacador', 1) },
    { id: 'mv_estatua_dourada', pts: 260, raro: true, unico: true, icone: () => 'mv_estatua_dourada', nome: () => ITENS.mv_estatua_dourada.nome, desc: 'Móvel exclusivo para a sua casa: a estátua dourada de quem virou lenda.', da: () => recebeItem('mv_estatua_dourada', 1) },
    { id: 'faixa_cacador', pts: 300, raro: true, unico: true, icone: () => 'faixa_cacador', nome: () => ITENS.faixa_cacador.nome, desc: '+120 foco, +3 recuperação, +2 drible e +2 chute. Para o pescoço.', lvl: 40, da: () => recebeItem('faixa_cacador', 1) },
    { id: 'bola_cacador', pts: 400, raro: true, unico: true, icone: () => 'bola_cacador', nome: () => ITENS.bola_cacador.nome, desc: 'O prêmio máximo das caçadas: só os maiores caçadores têm. Exponha na sua casa!', da: () => recebeItem('bola_cacador', 1) },
  );
  function cartao(o, t) {
    if (o.mostra && !o.mostra()) return null;
    const comprados = t.comprados || {};
    const ja = o.unico && comprados[o.id], falta = o.lvl && nv() < o.lvl;
    const idIc = o.icone ? o.icone() : null;
    const ic = idIc && ITENS[idIc] ? iconeClone(iconeItem(idIc)) : el('span', { class: 'tl-emoji' }, o.emoji || '🎁');
    const ico = el('div', { class: 'tl-ic' }, ic);
    if (idIc && ITENS[idIc] && typeof comTip === 'function' && typeof tipItem === 'function') comTip(ico, () => tipItem(idIc, 0));
    const botao = ja ? el('button', { class: 'btn mini', type: 'button', disabled: 'disabled' }, '✔ Já é seu')
      : falta ? el('button', { class: 'btn mini', type: 'button', disabled: 'disabled' }, `Nível ${o.lvl}`)
        : el('button', { class: 'btn amarelo mini', type: 'button', disabled: t.pts < o.pts ? 'disabled' : null, onclick: () => compra(o) }, `${o.pts} pontos`);
    return el('div', { class: 'tar-card tl-card' + (o.raro ? ' tl-raro' : '') }, ico,
      el('div', { class: 'tl-txt' }, el('b', {}, o.nome()), el('small', {}, o.desc || ''), o.unico ? el('small', { class: 'tl-unico' }, '⭐ Exclusivo — só dá para pegar uma vez') : null), botao);
  }
  function compra(o) {
    const t = tarDados(); if (t.pts < o.pts) return;
    if (o.unico && (t.comprados || {})[o.id]) return;
    if (o.lvl && nv() < o.lvl) return;
    const nome = o.nome();
    t.pts -= o.pts; o.da();
    if (o.unico) { t.comprados = t.comprados || {}; t.comprados[o.id] = true; }
    log(`🛒 Trocou ${o.pts} pontos por: ${nome}.`, o.raro ? 'l-lendario' : 'l-loot'); som(o.raro ? 'raro' : 'moeda');
    if (o.raro) banner(nome, 'Recompensa rara das Tarefas de caça!');
    salvar(); G.uiSujo = true; modalTarefas('loja');
  }
  const _modalTarefasLoja = modalTarefas;
  modalTarefas = function (aba = 'vez') {
    const r = _modalTarefasLoja.apply(this, arguments);
    if (aba !== 'loja') return r;
    const corpo = document.querySelector('#modalConteudo .tar-corpo'); if (!corpo) return r;
    const t = tarDados(); corpo.innerHTML = '';
    corpo.append(el('p', {}, `Você tem `, el('b', {}, `${t.pts} pontos`), ` de tarefa. Ganhe mais: caçada da vez = ${TAR_BOUNTY_PTS} · tarefa da semana = ${TAR_SEM_PTS} · semana completa = +${TAR_SEM_BONUS}.${t.bonusXpMs > 0 ? ` Bônus de XP ativo: faltam ${Math.ceil(t.bonusXpMs / 60000)} min.` : ''}`));
    corpo.append(el('h3', { class: 'tl-tit' }, '🛒 Do dia a dia'));
    for (const o of TAR_LOJA.filter(o => !o.raro)) { const c = cartao(o, t); if (c) corpo.append(c); }
    corpo.append(el('h3', { class: 'tl-tit tl-tit-raro' }, '⭐ Raros — só com muitos pontos'));
    for (const o of TAR_LOJA.filter(o => o.raro)) { const c = cartao(o, t); if (c) corpo.append(c); }
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `.tar-corpo{max-height:62vh;overflow-y:auto}
.tl-card{justify-content:flex-start}
.tar-card.tl-card .tl-ic{width:52px;height:52px;flex:0 0 52px!important;display:grid;place-items:center}
.tl-ic canvas,.tl-ic img{max-width:52px;max-height:52px}
.tl-emoji{font-size:30px}
.tar-card.tl-card .tl-txt{flex:1 1 auto!important;display:flex;flex-direction:column;gap:2px;min-width:0}
.tl-txt small{opacity:.85}
.tl-card .btn{min-width:92px}
.tl-unico{color:#a0662a;font-weight:700}
.tl-tit{margin:6px 0 0;font-size:1.05em}
.tl-tit-raro{color:#b07a10}
.tl-raro{background:linear-gradient(90deg,rgba(255,200,58,.22),rgba(255,200,58,.06));border:2px solid rgba(255,200,58,.7)}`;
  document.head.append(css);
}
