/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚡ CARGA RÁPIDA (v351 — "os primeiros 10 minutos", item 1 do dono)
   Antes: ao clicar em Nascer/Continuar, a tela "Carregando o mundo" pedia TODAS as ~1.000 artes do jogo de uma vez
   (~54 MB) e esperava até 15 s — quem chegava pela primeira vez esperava ~20 s no total, baixando coisa que só usaria horas depois.
   Agora:
   1) Já na tela inicial as artes começam a baixar em SEGUNDO PLANO, poucas por vez (não atrapalha o resto).
   2) "Carregando o mundo" espera só o boneco do jogador; aí entra no mapa e a tela de carga fica por cima só até
      chegar o que a PRIMEIRA TELA pediu (gravamos o que o mapa pede nos primeiros quadros) — no máximo 6 s.
   3) O resto continua baixando enquanto se joga (o jogo já desenha cada arte quando ela chega).
   Carregar DEPOIS de assets.js e ui.js.
   ============================================================ */
const CR = { simult: 6, fila: [], rodando: 0, gravando: null, iniciou: false };
{
  // ---- 1) fila em segundo plano (usa o spr "cru": o que ela baixa não conta como pedido da 1ª tela) ----
  const sprCru = spr;
  const pronto = e => e && (e.ok || e.err);
  function proximo() {
    while (CR.rodando < CR.simult && CR.fila.length) {
      const n = CR.fila.shift(); if (SPR[n] && pronto(SPR[n])) continue;
      const e = sprCru(n); if (pronto(e)) continue;
      CR.rodando++; const t0 = performance.now();
      const espera = () => { if (pronto(e) || performance.now() - t0 > 20000) { CR.rodando--; proximo(); } else setTimeout(espera, 80); };
      setTimeout(espera, 80);
    }
  }
  // v407 (Raio-X A2): a fila NÃO começa mais na tela inicial (lá ela baixava dezenas de MB antes de o jogador clicar).
  // Começa depois que o jogo abre: primeiro as artes do MAPA ATUAL e dos vizinhos já montados, depois o resto.
  // No celular, ou com "economia de dados" ligada no aparelho, baixa SÓ o do mapa atual e vizinhos (a cada troca de mapa).
  CR.economia = (typeof CEL !== 'undefined' && CEL) || !!(navigator.connection && navigator.connection.saveData);
  const crArtesMapa = new WeakMap();
  function crDoMapa(m) {
    if (!m) return [];
    let l = crArtesMapa.get(m); if (l) return l;
    const s = new Set(); const poe = n => { if (n && ASSET_SET.has(n)) s.add(n); };
    try {
      for (const o of m.obj || []) if (o && o.t) poe(o.t);
      for (const b of m.predios || []) poe(b.spr);
      if (m.chao && typeof TEX_CHAO !== 'undefined') { const vistos = new Set(); for (let i = 0; i < m.chao.length; i += 7) vistos.add(m.chao[i]); for (const c of vistos) poe(TEX_CHAO[c]); }
      for (const sp of m.spawns || []) { const l2 = MONSTROS[sp.m] && MONSTROS[sp.m].look; const t = l2 && l2.tipo; if (t && t !== 'humano') { poe(t); poe(t + '2'); for (let k = 1; k <= 4; k++) poe(t + '_c' + k); } }
    } catch (e) { }
    l = [...s]; crArtesMapa.set(m, l); return l;
  }
  function crPrioridade() {
    const m = typeof G !== 'undefined' && G.mapa; if (!m) return [];
    const l = [...crDoMapa(m)];
    for (const sa of m.saidas || []) { const v = sa && sa.para && MAPAS[sa.para]; if (v && v !== m) l.push(...crDoMapa(v)); }
    return l.filter(n => !SPR[n]);
  }
  CR.prioridade = crPrioridade;
  CR.comeca = function () {
    if (CR.iniciou) return; CR.iniciou = true;
    const frente = crPrioridade();
    if (CR.economia) { CR.fila = frente; proximo(); return; }
    // depois do mapa atual: o que quase toda tela usa (chão, prédios da Vila), depois o resto
    const prio = n => /^t_/.test(n) ? 0 : /^(b_|arvore|arbusto|banca|banco)/.test(n) ? 1 : 2;
    const ja = new Set(frente);
    CR.fila = frente.concat(ASSETS.filter(n => !SPR[n] && !ja.has(n)).sort((a, b) => prio(a) - prio(b))); proximo();
    // efeitos das lutas (~2,6 MB): no computador, baixam logo no começo (no celular, na 1ª vez que aparecem)
    setTimeout(() => { try { for (const k in FX.img) void FX.img[k].ok; } catch (e) { } }, 6000);
  };
  // trocou de mapa: as artes dele (e dos vizinhos) passam para a frente da fila
  if (typeof entrarMapa === 'function') {
    const _entrarCR = entrarMapa;
    entrarMapa = function () {
      const r = _entrarCR.apply(this, arguments);
      try { if (CR.iniciou) { const f = crPrioridade(); if (f.length) { const s = new Set(f); CR.fila = f.concat(CR.fila.filter(n => !s.has(n))); proximo(); } } } catch (e) { }
      return r;
    };
  }

  // ---- grava o que o mapa pede (para saber o que a 1ª tela precisa) ----
  spr = function (nome) { if (CR.gravando && !CR.gravando.has(nome)) CR.gravando.add(nome); return sprCru.apply(this, arguments); };

  // ---- 2) "Carregando o mundo": só o boneco do jogador (até 4 s) ----
  telaCarregando = function (save) {
    const box = $('#inicioMenu'); $('#criacao').hidden = true; box.hidden = false; box.innerHTML = '';
    const barra = el('i'); barra.style.width = '0%';
    box.append(el('p', { class: 'resumo' }, 'Loading the world...'), el('div', { class: 'progresso', style: 'width:min(360px,80vw)' }, barra));
    // v407 (Raio-X A2): a fila de segundo plano só começa depois da 1ª tela (não disputa a internet com ela)
    const imgs = [...camadasDe(lookJogador(true)), ...camadasDe(lookJogador())].map(l => pegaImg(l.url));
    // v407 (Raio-X A2): a folha do boneco do jogador já começa a baixar aqui (as folhas agora só baixam quando usadas)
    try { for (const l of [lookJogador(true), lookJogador()]) { const f = FOLHAS[folhaDoLook(specDe(l), l)]; if (f) void f.ok; } } catch (e) { }
    return new Promise(res => {
      const t0 = performance.now();
      const tick = () => {
        const ok = imgs.filter(e => e.ok || e.err).length; barra.style.width = Math.round(15 + 25 * ok / Math.max(1, imgs.length)) + '%';
        if (ok >= imgs.length || performance.now() - t0 > 4000) res(); else setTimeout(tick, 60);
      };
      tick();
    });
  };

  // ---- depois de entrar no mapa: cortina por cima até chegar o que a 1ª tela pediu (máx. 6 s) ----
  const _iniciarCR = iniciarJogo;
  iniciarJogo = async function () {
    CR.gravando = new Set();
    const r = await _iniciarCR.apply(this, arguments);
    if (document.hidden) { CR.gravando = null; CR.comeca(); return r; } // aba escondida: o navegador não desenha, não há o que esperar
    const cort = el('div', { id: 'cargaMundo' }, el('div', { class: 'cm-caixa' }, el('p', {}, 'Loading the world...'), el('div', { class: 'progresso' }, el('i', { style: 'width:40%' }))));
    document.body.append(cort); const barra = cort.querySelector('.progresso i');
    const t0 = performance.now();
    await new Promise(res => {
      const tick = () => {
        const dt = performance.now() - t0, pedidos = [...CR.gravando].map(n => SPR[n]).filter(Boolean);
        // v407 (Raio-X A2): conta também as folhas de boneco que a 1ª tela pediu (jogador, NPCs e adversários à vista)
        const fol = typeof FOLHAS !== 'undefined' ? Object.values(FOLHAS).filter(f => f.pedida) : [];
        const ok = pedidos.filter(pronto).length + fol.filter(f => f.ok).length; barra.style.width = Math.round(40 + 60 * ok / Math.max(1, pedidos.length + fol.length)) + '%';
        // espera ao menos 3 quadros de desenho (para o mapa pedir as artes) e depois que tudo o que foi pedido chegue
        if ((dt > 250 && ok >= pedidos.length + fol.length) || dt > 6000) res(); else setTimeout(tick, 60);
      };
      setTimeout(tick, 120);
    });
    CR.ultimaTela = [...CR.gravando]; CR.esperou = Math.round(performance.now() - t0); CR.gravando = null; cort.classList.add('some'); setTimeout(() => cort.remove(), 350);
    CR.comeca(); // v407 (Raio-X A2): agora sim, o resto em segundo plano (mapa atual e vizinhos primeiro)
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `#cargaMundo { position: fixed; inset: 0; z-index: 9000; display: grid; place-items: center; background: radial-gradient(circle at 50% 40%, #3a2a6a, #140c2a); transition: opacity .3s; }
  #cargaMundo.some { opacity: 0; pointer-events: none; }
  #cargaMundo .cm-caixa { width: min(360px, 80vw); text-align: center; color: #fff4d0; font-weight: 800; font-size: 18px; }
  #cargaMundo .progresso { height: 14px; border-radius: 8px; background: rgba(255,255,255,.15); overflow: hidden; }
  #cargaMundo .progresso i { display: block; height: 100%; background: linear-gradient(90deg, #ffd23f, #ff9a3a); transition: width .15s; }`;
  document.head.append(css);
}
