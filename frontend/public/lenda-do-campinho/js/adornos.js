/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ✨ ADORNOS DE NÍVEL ALTO (v302), como os addons do Tibia: além das asas de anjo (nível 60),
   - nível 100: AURA DE CRAQUE — um círculo de luz girando no chão, embaixo de você;
   - nível 150: ASAS DOURADAS;
   - nível 200: HALO DE CAMPEÃO — uma coroa de louros dourada flutuando acima da cabeça;
   - nível 300: ASAS CÓSMICAS (com estrelinhas piscando).
   Artes do Higgsfield (a/ac_asas_ouro, ac_asa_lado_ouro, ac_asas_cosmo, ac_asa_lado_cosmo, ad_aura, ad_halo).
   O jogador escolhe o que mostrar em Equipamento → ✨ Adornos (asas: nenhuma/anjo/douradas/cósmicas;
   aura e halo: liga/desliga). Sem escolha, usa o melhor que já liberou. Fica salvo em save.adornos.
   Carregar DEPOIS de asas.js (e de pescoco_arte.js).
   ============================================================ */
{
  const ASAS = [
    { id: 'anjo', nome: 'Asas de Anjo', nv: 60, frente: 'ac_asas', lado: 'ac_asa_lado' },
    { id: 'ouro', nome: 'Asas Douradas', nv: 150, frente: 'ac_asas_ouro', lado: 'ac_asa_lado_ouro' },
    { id: 'cosmo', nome: 'Asas Cósmicas', nv: 300, frente: 'ac_asas_cosmo', lado: 'ac_asa_lado_cosmo' },
  ];
  const EXTRAS = [
    { id: 'aura', nome: 'Aura de Craque', nv: 100, img: 'ad_aura', desc: 'Um círculo de luz girando no chão, embaixo de você.' },
    { id: 'halo', nome: 'Halo de Campeão', nv: 200, img: 'ad_halo', desc: 'Uma coroa de louros dourada flutuando acima da cabeça.' },
  ];
  const ARTES = ['ac_asas_ouro', 'ac_asa_lado_ouro', 'ac_asas_cosmo', 'ac_asa_lado_cosmo', 'ad_aura', 'ad_halo'];
  for (const n of ARTES) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  setTimeout(() => { for (const n of ARTES) try { spr(n); } catch (e) { } }, 1500);

  const nivel = () => (G.save && G.save.nivel) || 1;
  const cfg = () => { const s = G.save; if (!s) return {}; if (!s.adornos || typeof s.adornos !== 'object') s.adornos = {}; return s.adornos; };
  function asaAtual() { // 'nenhuma' | id das asas
    const n = nivel(), c = cfg(); if (n < ASAS[0].nv) return 'nenhuma';
    if (c.asas === 'nenhuma') return 'nenhuma';
    const ok = ASAS.filter(a => n >= a.nv);
    if (c.asas && ok.some(a => a.id === c.asas)) return c.asas;
    return ok[ok.length - 1].id; // sem escolha: a melhor que já liberou
  }
  const extraOn = id => { const x = EXTRAS.find(a => a.id === id); if (!x || nivel() < x.nv) return false; const v = cfg()[id]; return v === undefined ? true : !!v; };
  // asas.js pergunta qual arte usar
  window.asaEscolhida = lado => { const a = ASAS.find(x => x.id === asaAtual()); return a ? (lado ? a.lado : a.frente) : null; };
  window.asaAlfa = () => asaAtual() === 'anjo' ? ASAS_ALFA : 0.75; // as douradas e cósmicas aparecem mais (translúcidas deixavam o ouro "sujo")

  // "nenhuma": o boneco (retrato, ficha...) também fica sem as asas
  const _lookAd = lookJogador;
  lookJogador = function () {
    const L = _lookAd.apply(this, arguments);
    try { if (L && L.costas === 'costas-anjo' && asaAtual() === 'nenhuma') { delete L.costas; delete L._kb; } } catch (e) { }
    return L;
  };

  /* ---------- desenho: aura (antes do boneco) e halo (depois) ---------- */
  function poseAgora(e) { // segue o pulo/giro das jogadas (como as asas)
    const j = G.jogada; if (!j || typeof poseDaJogada !== 'function') return null;
    try { return poseDaJogada(j, Math.min(1, (G.agora - j.t0) / j.dur)); } catch (err) { return null; }
  }
  function estrelinha(ctx, x, y, r, a) {
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#ffffff'; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.25, y - r * 0.25); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.25, y + r * 0.25);
    ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.25, y + r * 0.25); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.25, y - r * 0.25); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const _entAd = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    if (e !== G.p || !G.save || G.p.morto || G.fut || G.jogoC) return _entAd.apply(this, arguments);
    const montado = typeof montadoAgora === 'function' && montadoAgora();
    const agora = G.agora || 0, sobe = typeof alturaPonte === 'function' ? alturaPonte(e) : 0;
    try { // aura no chão
      if (extraOn('aura')) {
        const im = aSprite('ad_aura');
        if (im) { const r = T * 0.56 * (1 + 0.04 * Math.sin(agora / 500)); ctx.save(); ctx.globalAlpha *= 0.72; ctx.translate(e.x * T, e.y * T - sobe - 2); ctx.scale(1, 0.42); ctx.rotate(agora / 2600); ctx.drawImage(im, -r, -r, r * 2, r * 2); ctx.restore(); }
      }
    } catch (err) { }
    const res = _entAd.apply(this, arguments);
    try {
      const pose = poseAgora(e);
      const noCorpo = fn => { // com a pose da jogada (pulo, giro), se tiver
        ctx.save();
        if (pose) { ctx.translate((e.x + (pose.ox || 0)) * T, e.y * T - (pose.sobe || 0) * T); if (pose.rot) { const meio = alturaEnt(e) * T * 0.5; ctx.translate(0, -meio); ctx.rotate(pose.rot); ctx.translate(0, meio); } ctx.translate(-e.x * T, -e.y * T); }
        fn(); ctx.restore();
      };
      // halo acima da cabeça
      if (extraOn('halo') && !montado) {
        const im = aSprite('ad_halo');
        if (im) noCorpo(() => {
          const w = T * 0.62, h = w * im.height / im.width, bob = Math.sin(agora / 420) * 2.2;
          const y = e.y * T - sobe - alturaEnt(e) * T + h * 0.2 + bob;
          ctx.globalAlpha *= 0.95; ctx.drawImage(im, e.x * T - w / 2, y - h / 2, w, h);
        });
      }
      // asas cósmicas: estrelinhas piscando em volta das asas
      if (asaAtual() === 'cosmo' && !montado) noCorpo(() => {
        const alt = alturaEnt(e) * T, cx = e.x * T, cy = e.y * T - sobe - alt * 0.6;
        for (let i = 0; i < 5; i++) {
          const f = ((agora / 1300) + i / 5) % 1, a = Math.sin(f * Math.PI); if (a < 0.1) continue;
          const lote = Math.floor(agora / 1300 + i / 5), hx = Math.sin(lote * 12.9 + i * 7.1) * 0.5 + 0.5, hy = Math.sin(lote * 78.2 + i * 3.3) * 0.5 + 0.5;
          const lado = i % 2 ? 1 : -1; estrelinha(ctx, cx + lado * (T * 0.3 + hx * T * 0.45), cy - T * 0.25 + hy * T * 0.55, 2.2 + a * 2.2, a * 0.9);
        }
      });
    } catch (err) { }
    return res;
  };

  /* ---------- aviso quando libera um adorno ---------- */
  function confereNovos() {
    const s = G.save; if (!s) return; const vis = s.adornosVistos = s.adornosVistos || [];
    const novos = [...ASAS.slice(1), ...EXTRAS].filter(a => nivel() >= a.nv && !vis.includes(a.id));
    if (!novos.length) return;
    novos.forEach(a => vis.push(a.id));
    log(`✨ Novo adorno liberado: ${novos.map(a => a.nome + ' (nv ' + a.nv + ')').join(', ')}! Escolha o que mostrar em Equipamento → ✨ Adornos.`, 'l-lvl');
  }
  setInterval(() => { try { if (G.rodando) confereNovos(); } catch (e) { } }, 3000);

  /* ---------- janela de escolha ---------- */
  function amostra(nome, larg = 64) { const im = aSprite(nome); if (!im) return el('span', { class: 'ad-img' }, '✨'); const c = document.createElement('canvas'); const h = Math.round(larg * im.height / im.width); c.width = larg; c.height = h; c.getContext('2d').drawImage(im, 0, 0, larg, h); c.className = 'ad-img'; return c; }
  function abreAdornos() {
    const n = nivel(), c = cfg(), atual = asaAtual();
    const muda = fn => { fn(); G.uiSujo = true; try { salvar(); } catch (e) { } abreAdornos(); };
    const linhaAsa = (a) => {
      const liberada = n >= a.nv, marcada = atual === a.id;
      return el('button', { type: 'button', class: 'ad-op' + (marcada ? ' on' : '') + (liberada ? '' : ' fechado'), disabled: !liberada, onclick: () => muda(() => { c.asas = a.id; }) },
        amostra(a.frente), el('b', {}, a.nome), el('small', {}, liberada ? (marcada ? 'Usando' : 'Usar') : '🔒 Nível ' + a.nv));
    };
    const nenhuma = el('button', { type: 'button', class: 'ad-op' + (atual === 'nenhuma' ? ' on' : '') + (n >= ASAS[0].nv ? '' : ' fechado'), disabled: n < ASAS[0].nv, onclick: () => muda(() => { c.asas = 'nenhuma'; }) },
      el('span', { class: 'ad-img ad-nada' }, '🚫'), el('b', {}, 'Sem asas'), el('small', {}, atual === 'nenhuma' ? 'Usando' : 'Usar'));
    const linhaExtra = (x) => {
      const liberada = n >= x.nv, on = extraOn(x.id);
      return el('button', { type: 'button', class: 'ad-op' + (on ? ' on' : '') + (liberada ? '' : ' fechado'), disabled: !liberada, onclick: () => muda(() => { c[x.id] = !on; }) },
        amostra(x.img), el('b', {}, x.nome), el('small', {}, liberada ? (on ? 'Ligado (clique para desligar)' : 'Desligado (clique para ligar)') : '🔒 Nível ' + x.nv), el('i', {}, x.desc));
    };
    abreModal(el('div', { class: 'adornos' },
      el('h2', {}, '✨ Adornos'),
      el('p', {}, 'Enfeites que você libera subindo de nível. Escolha o que aparece no seu boneco.'),
      el('h3', {}, '🪽 Asas'), el('div', { class: 'ad-grade' }, nenhuma, ...ASAS.map(linhaAsa)),
      el('h3', {}, '🌟 Brilhos'), el('div', { class: 'ad-grade' }, ...EXTRAS.map(linhaExtra))));
  }
  window.abreAdornos = abreAdornos;
  // o botão fica no painel de Equipamento, embaixo do boneco
  const _painAd = atualizaPaineis;
  atualizaPaineis = function () {
    const r = _painAd.apply(this, arguments);
    try { if (!document.getElementById('btnAdornosTopo')) { const nav = document.querySelector('#topo nav') || document.querySelector('#topo'); const antes = document.getElementById('btnOpc') || (nav && nav.querySelector('.tb-mais')); const bt = el('button', { type: 'button', class: 'btn mini', id: 'btnAdornosTopo', title: 'Adornos: asas, aura, halo, mascotes e mais que você liberou', onclick: abreAdornos }, '✨ Adornos'); if (antes && antes.parentElement) antes.parentElement.insertBefore(bt, antes); else if (nav) nav.append(bt); } } catch (e) { } // v400 (dono: "o adorno passe para o topo da página, ao lado dos demais")
    return r;
  };
  const st = document.createElement('style');
  st.textContent = `.btn-adornos { display: block; margin: 8px auto 2px; }
  .adornos h2 { margin: 0 0 4px; } .adornos p { margin: 0 0 10px; } .adornos h3 { margin: 12px 0 6px; font-size: 16px; }
  .ad-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); gap: 8px; }
  .ad-op { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 6px; border-radius: 12px; border: 2px solid #d8c090; background: #fff8e6; cursor: pointer; font: inherit; color: #4a2a10; text-align: center; }
  .ad-op.on { border-color: #e0a010; background: #fff0c0; box-shadow: 0 0 0 2px #ffd25a inset; }
  .ad-op.fechado { opacity: .55; cursor: not-allowed; filter: grayscale(.6); }
  .ad-op b { font-size: 14px; } .ad-op small { font-size: 12px; opacity: .85; } .ad-op i { font-size: 11.5px; opacity: .75; font-style: normal; }
  .ad-img { width: 64px; height: auto; max-height: 56px; object-fit: contain; } .ad-nada { font-size: 30px; line-height: 44px; }`;
  document.head.append(st);
}
