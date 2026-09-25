// ===== Barra de cima do jogo, arrumada =====
// Carregado por último: os outros arquivos já puseram os botões deles no topo
// (Arenas, Visual, Save, Bug, 🎵, nuvem). Aqui só mudamos o LUGAR de cada um —
// os botões são os mesmos, com os mesmos cliques.
//   [marca BETA] [📍 lugar · ☀️🍂 dia/hora · 🪙 tostões · ☁️] ....... [principais] [☰ Mais ▾] [🔊] [🎵]
(function () {
  const topo = document.getElementById('topo'); if (!topo) return;
  const info = topo.querySelector('.topo-info'), nav = topo.querySelector('.topo-nav');
  if (!info || !nav || document.getElementById('tbMais')) return;
  const $q = (s) => topo.querySelector(s) || document.querySelector(s);

  // ----- botões principais (sempre à vista) -----
  const arenas = $q('#btnArenas'); if (arenas) { arenas.innerHTML = '🏟️ <span class="tb-rot">Arenas</span>'; }
  ['#btnFicha', '[data-abre="mapa"]', '[data-abre="carreira"]', '[data-abre="time"]', '[data-abre="missoes"]', '#btnArenas']
    .forEach(s => { const b = $q(s); if (b) nav.append(b); });

  // ----- menu "Mais" (o resto) -----
  const vis = $q('#btnVisual'); if (vis) vis.textContent = '✨ Visual (montarias e skins)';
  const bak = $q('#btnBackup'); if (bak) bak.textContent = '💾 Exportar / importar save';
  const bug = $q('#btnBug'); if (bug) bug.textContent = '🐞 Informar bug';
  const caixa = el('div', { class: 'tb-mais' });
  const botao = el('button', { class: 'btn mini', id: 'tbMais', type: 'button', title: 'Mais opções', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, '☰ Mais');
  const lista = el('div', { class: 'tb-lista', hidden: 'hidden', role: 'menu' });
  ['#btnVisual', '[data-abre="album"]', '[data-abre="ranking"]', '#btnBackup', '[data-abre="atalhos"]', '[data-abre="ajuda"]', '#btnBug']
    .forEach(s => { const b = $q(s); if (b) { b.classList.remove('mini'); b.setAttribute('role', 'menuitem'); lista.append(b); } });
  caixa.append(botao, lista); nav.append(caixa);
  const fecha = () => { lista.hidden = true; botao.setAttribute('aria-expanded', 'false'); botao.classList.remove('aberto'); };
  botao.addEventListener('click', (ev) => { ev.stopPropagation(); const abrir = lista.hidden; lista.hidden = !abrir; botao.setAttribute('aria-expanded', String(abrir)); botao.classList.toggle('aberto', abrir); });
  lista.addEventListener('click', () => setTimeout(fecha, 0)); // escolheu: fecha (depois do clique do próprio botão)
  document.addEventListener('click', (ev) => { if (!caixa.contains(ev.target)) fecha(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !lista.hidden) fecha(); });

  // ----- som: ícones pequenos no fim -----
  const som = $q('#btnSom'), audio = $q('#btnAudio');
  const grupoSom = el('div', { class: 'tb-som' }); if (som) grupoSom.append(som); if (audio) grupoSom.append(audio); nav.append(grupoSom);
  if (som && typeof G !== 'undefined' && G.somOn === false) som.textContent = '🔇';

  // ----- informações num bloco só -----
  const lugar = $q('#nomeMapa'), rel = $q('#relogio'), moeda = info.querySelector('.moeda'), nuv = $q('#nuvemStatus');
  const bloco = el('div', { class: 'tb-info' });
  [lugar, rel, moeda, nuv].forEach(e => { if (e) { e.classList.remove('tag'); bloco.append(e); } });
  if (lugar) lugar.classList.add('tb-lugar');
  if (moeda) moeda.title = 'Tostões';
  info.append(bloco);

  // nuvem: só o ícone; a frase inteira fica no "passar o mouse"
  if (typeof nuvemStatus === 'function') {
    const _nuvemStatus = nuvemStatus;
    nuvemStatus = function (txt) {
      _nuvemStatus(txt);
      const e = document.getElementById('nuvemStatus'); if (!e) return;
      e.textContent = String(txt).split(' ')[0]; e.title = txt;
      e.classList.toggle('tb-alerta', !/Salvo online|Online/.test(txt));
    };
    if (nuv) { nuv.textContent = '☁️'; nuv.title = NUVEM.status || 'Seu progresso é salvo online na sua conta do Educação Gamer'; }
  }

  // relógio: "☀️🍂 Dia 1 · 23:30" (tempo e estação por extenso no "passar o mouse")
  const _barrasTopo = atualizaBarras;
  atualizaBarras = function () {
    _barrasTopo();
    const e = document.getElementById('relogio'); if (!e || !G.save) return;
    const s = G.save, h = Math.floor(s.hora / 60) % 24, mi = Math.floor(s.hora % 60);
    const hora = `Dia ${s.dia} · ${String(h).padStart(2, '0')}:${String(mi - mi % 10).padStart(2, '0')}`;
    const c = G.climaCache, t = c && typeof TEMPO !== 'undefined' ? TEMPO[c.tempo] : null;
    const tx = t ? `${t.icone}${ICONE_ESTACAO[c.estacao] || ''} ${hora}` : hora;
    if (e.textContent !== tx) e.textContent = tx;
    e.title = t ? `${t.nome} · ${c.estacao} — ${t.efeito || 'sem efeito no jogo'}` : '';
  };
  // nome do lugar comprido: corta com "…" e mostra inteiro no "passar o mouse"
  if (lugar) new MutationObserver(() => { if (lugar.title !== lugar.textContent) lugar.title = lugar.textContent; }).observe(lugar, { childList: true, characterData: true, subtree: true });

  const st = document.createElement('style');
  st.textContent = `
  #topo { flex-wrap: nowrap; gap: 10px; padding: 5px 12px; }
  #topo .marca { flex: none; font-size: 19px; white-space: nowrap; }
  #topo .topo-info { flex: 1 1 auto; min-width: 0; }
  .tb-info { display: inline-flex; align-items: center; min-width: 0; max-width: 100%; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15); border-radius: 999px; padding: 3px 4px 3px 12px; font-size: 14px; white-space: nowrap; }
  .tb-info > * { display: inline-flex; align-items: center; gap: 5px; flex: none; }
  .tb-info > * + *::before { content: ''; width: 1px; height: 14px; background: rgba(255,255,255,.22); margin: 0 9px 0 0; }
  .tb-info > * + * { margin-left: 9px; }
  .tb-info .tb-lugar { flex: 0 1 auto; min-width: 40px; display: block; overflow: hidden; text-overflow: ellipsis; }
  .tb-info .tb-lugar::before { content: none; }
  .tb-info .moeda { background: rgba(0,0,0,.25); border-radius: 999px; padding: 2px 10px; font-weight: 800; color: #ffe27a; }
  .tb-info #nuvemStatus { margin-left: 6px; cursor: help; }
  .tb-info #nuvemStatus::before { display: none; }
  .tb-info #nuvemStatus.tb-alerta { filter: grayscale(1); opacity: .7; }
  #topo .topo-nav { flex: none; flex-wrap: nowrap; align-items: center; gap: 5px; }
  #topo .topo-nav > .btn { white-space: nowrap; }
  .tb-mais { position: relative; }
  #tbMais.aberto { filter: brightness(1.15); box-shadow: inset 0 2px 0 rgba(0,0,0,.25); }
  .tb-lista { position: absolute; right: 0; top: calc(100% + 6px); z-index: 60; min-width: 230px; display: flex; flex-direction: column; gap: 4px; padding: 8px; background: #fff7e6; border: 3px solid var(--madeira, #8a4b24); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
  .tb-lista[hidden] { display: none; }
  .tb-lista .btn { width: 100%; justify-content: flex-start; text-align: left; font-size: 14px; padding: 7px 10px; }
  .tb-som { display: flex; gap: 3px; padding-left: 6px; margin-left: 2px; border-left: 1px solid rgba(255,255,255,.2); }
  .tb-som .btn { min-width: 32px; padding-left: 6px; padding-right: 6px; }
  /* telas mais estreitas: principais só com o ícone (o nome aparece ao passar o mouse) */
  @media (max-width: 1320px) { #topo .topo-nav .tb-rot { display: none; } }
  @media (max-width: 1180px) { #topo .marca b { display: none; } }
  `;
  document.head.append(st);
  if (typeof encaixaTela === 'function') setTimeout(() => { try { encaixaTela(); } catch (e) { } }, 50);
})();
