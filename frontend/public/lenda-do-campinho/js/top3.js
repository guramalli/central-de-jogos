/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏆 TOP 3 NA TELA INICIAL (v321, pedido do dono): um pódio com os 3 jogadores de maior nível do site,
   cada um desenhado do jeito que está no jogo (pele, cabelo, equipamentos, skin em uso, asas).
   Dados: o ranking online (GET /api/lenda/ranking) e a ficha pública de cada um (GET /api/lenda/personagem/:apelido,
   que traz "visual" a partir da v321 do site; ficha antiga = boneco com os equipamentos e o visual padrão).
   Clicando num deles abre a página do personagem. Fora do site (sem ranking online) o pódio não aparece.
   Carregar DEPOIS de inicio.js e personagens.js.
   ============================================================ */
(function () {
  const menu = document.getElementById('inicioMenu'); if (!menu) return;
  if (typeof PORTAL === 'undefined' || !PORTAL.ativo) return;
  const caixa = el('div', { class: 'ini-top3', hidden: 'hidden' });
  const titulo = el('p', { class: 'ini-titulo' }, '🏆 Top 3 do jogo');
  const podio = el('div', { class: 'top3-podio' });
  caixa.append(titulo, podio);
  const poe = () => { const t = [...menu.children].find(c => c !== caixa && c.classList.contains('ini-titulo')); if (t && caixa.nextSibling !== t) menu.insertBefore(caixa, t); }; // logo antes do "Explore"

  // o boneco de outro jogador: monta um save "de mentira" com o que a ficha pública mostra e usa o mesmo
  // lookJogador do jogo (assim sai igual ao que ele vê: roupas, chapéu, colar, skin, asas...)
  function lookDaFicha(f, apelido) {
    const v = (f && f.visual) || {}, L = v.look || {}, fem = f && f.genero === 'f';
    const sv = novoSave({ nome: (f && f.nome) || apelido, corpo: fem ? 'f' : 'm', pele: L.pele || 'pele-morena', cabelo: L.cabelo || (fem ? 'cabelo-rabo' : 'cabelo-curto'),
      corCabelo: L.corCabelo || 'original', roupa: L.roupa || 'roupa-camiseta', baixo: L.baixo || 'baixo-shorts', rosto: L.rosto || null, classe: (f && f.classe) || null });
    sv.nivel = (f && f.nivel) || 1;
    for (const [slot, e] of Object.entries((f && f.equip) || {})) if (e && ITENS[e.id] && slot in sv.equip) { sv.equip[slot] = e.id; (sv.equipR = sv.equipR || {})[slot] = e.r || 0; }
    sv.skins = v.skin ? [v.skin] : []; sv.skin = v.skin || null;
    sv.adornos = Object.assign({}, v.adornos || {});
    const G0 = G.save;
    try { G.save = sv; return lookJogador(true); } finally { G.save = G0; }
  }
  function cartao(x, lugar) { // lugar 0 = 1º colocado
    const c = mkCanvas(300, 400); c.className = 'retrato-cv';
    const ret = el('div', { class: 'top3-ret' }, c);
    const b = el('button', { class: 'top3-cart top3-' + (lugar + 1), type: 'button', title: 'Ver a página de ' + x.apelido, onclick: () => { if (typeof modalPersonagens === 'function') modalPersonagens(x.apelido); } },
      el('span', { class: 'top3-med' }, ['🥇', '🥈', '🥉'][lugar]), ret, el('b', { class: 'top3-nome' }, x.apelido), el('small', {}, `Nível ${x.nivel}`));
    return { b, c, lugar };
  }
  async function carrega() {
    try {
      const r = await fetch(PORTAL.api + '/api/lenda/ranking'); if (!r.ok) return;
      const top = (await r.json()).slice(0, 3); if (!top.length) return;
      podio.innerHTML = '';
      const cards = top.map((x, k) => Object.assign(cartao(x, k), { x }));
      for (const k of [1, 0, 2]) if (cards[k]) podio.append(cards[k].b); // na tela: 2º, 1º (no meio, maior), 3º
      caixa.hidden = false; poe();
      for (const cd of cards) {
        let ficha = null;
        try { const rr = await fetch(PORTAL.api + '/api/lenda/personagem/' + encodeURIComponent(cd.x.apelido)); if (rr.ok) ficha = (await rr.json()).ficha; } catch (e) { }
        let look = null; try { look = lookDaFicha(ficha || { nivel: cd.x.nivel }, cd.x.apelido); } catch (e) { }
        if (!look) continue;
        // as folhas e roupas podem ainda estar chegando: redesenha algumas vezes (como o retrato do seu jogador)
        [0, 500, 1500, 3500, 7000].forEach(ms => setTimeout(() => { try { pintaAparencia(cd.c, look, { inteiro: true }); } catch (e) { } }, ms));
      }
    } catch (e) { }
  }
  new MutationObserver(poe).observe(menu, { childList: true });
  setTimeout(carrega, 600);

  const st = document.createElement('style');
  st.textContent = `
  .ini-top3 { display: flex; flex-direction: column; gap: 6px; }
  .top3-podio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; align-items: end; }
  .top3-cart { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 4px 6px; border-radius: 12px; cursor: pointer; min-width: 0;
    background: linear-gradient(135deg, #3a2780, #2b1b5e); color: #fff6e0; border: 2px solid #1c1140; box-shadow: 0 2px 0 rgba(0,0,0,.25); font: inherit; }
  .top3-cart:hover { filter: brightness(1.12); }
  .top3-1 { border-color: #f0b81a; box-shadow: 0 0 0 2px rgba(240,184,26,.35), 0 3px 0 rgba(0,0,0,.25); }
  .top3-med { font-size: 22px; line-height: 1; }
  .top3-ret { position: relative; width: 64px; height: 86px; border-radius: 10px; overflow: hidden; background: radial-gradient(circle at 50% 35%, #6ad86a, #2e8a3a 70%); border: 2px solid var(--amarelo, #ffd23f); }
  .top3-1 .top3-ret { width: 78px; height: 104px; }
  .top3-ret canvas { width: 100%; height: 100%; object-fit: contain; display: block; }
  .top3-nome { font-size: 13px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .top3-cart small { font-size: 11px; opacity: .85; }
  `;
  document.head.append(st);
})();
