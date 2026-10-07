/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏎️ DESEMPENHO v408.6 (dono: "o jogo está travando mais que o normal depois das últimas atualizações, principalmente
   depois de entrar em algum mapa, ele fica travando, e quando vou andando também, fica dando travadas").
   Medido andando ~20 s logo depois de entrar em 9 mapas: as travadas eram
   1) o CHÃO EM BLOCOS pintando blocos de 1024 px enquanto você anda (cada bloco custa 15–50 ms) — chao_blocos.js e
      chao_novo.js agora dividem melhor o trabalho; e AQUI: ao entrar no mapa, os blocos que aparecem na tela são
      pintados de uma vez (como era antes da v407: uma pausa curta na porta em vez de várias travadas depois);
   2) BONECOS montados pela 1ª vez no quadro (cada um 10–35 ms; com as folhas sob demanda da v407 e os figurantes das
      praças, vários no mesmo quadro). Agora: no máximo ~4 ms de bonecos novos por quadro (quem passar do limite usa a
      pose anterior por um instante), os figurantes perto da tela são preparados nas folgas, e no computador as folhas
      de todos os bonecos voltam a ser baixadas em segundo plano logo depois que o jogo abre (no celular, ou com
      economia de dados, continuam sob demanda).
   Prefixo dsp. Carregar NO FIM (depois de vila_beiramar.js, cidades_onda2.js, chao_blocos.js, raiox_codigo.js).
   ============================================================ */
const DSP = { gasto: 0, noDesenho: false, ult: new Map(), entrou: null, ultQuadro: 0, ORC_BONECO: 4, ORC_ENTRADA: 100, ORC_ENTRADA_Q: 25 }; // (v410.9: ORC_ENTRADA_Q = ms por quadro para o chão da tela logo depois de entrar)
DSP.economia = (typeof CEL !== 'undefined' && CEL) || !!(navigator.connection && navigator.connection.saveData);
{
  const vazio = { c: mkCanvas(1, 1) }; // (nada por um instante, quando não existe pose anterior)
  /* ---------- 2) bonecos novos: orçamento por quadro ---------- */
  const _desDsp = desenha;
  desenha = function () { DSP.gasto = 0; DSP.noDesenho = true; try { return _desDsp.apply(this, arguments); } finally { DSP.noDesenho = false; } };
  const _sbDsp = spriteBoneco;
  spriteBoneco = function (look) {
    if (!DSP.noDesenho || !look || typeof look !== 'object') return _sbDsp.apply(this, arguments);
    let k = null; try { k = chaveBoneco(look); } catch (e) { }
    if (DSP.gasto >= DSP.ORC_BONECO && k) { const u = DSP.ult.get(k); if (u) return u; if (DSP.gasto >= DSP.ORC_BONECO * 3) return vazio; } // (já passou muito: espera o próximo quadro)
    const a = performance.now(); const r = _sbDsp.apply(this, arguments); const d = performance.now() - a;
    if (d > 0.8) DSP.gasto += d;
    if (r && k) { DSP.ult.set(k, r); if (DSP.ult.size > 900) DSP.ult.delete(DSP.ult.keys().next().value); }
    return r;
  };

  /* ---------- figurantes perto da tela: prontos antes de aparecer (nas folgas entre um quadro e outro) ---------- */
  const figsDo = new WeakMap();
  function figurantes(m) {
    let l = figsDo.get(m); if (l) return l; l = [];
    try { for (let i = 0; i < (m.obj || []).length; i++) { const o = m.obj[i]; if (o && o.t === 'figurante' && o.meta && o.meta.look) l.push({ x: i % m.w, y: (i / m.w) | 0, md: o.meta }); } } catch (e) { }
    figsDo.set(m, l); return l;
  }
  function preparaFigurante() {
    const m = G.mapa; if (!m || !G.p || typeof SPR_CACHE === 'undefined') return;
    const l = figurantes(m); if (!l.length) return;
    for (const f of l) {
      if (Math.abs(f.x - G.p.x) > 22 || Math.abs(f.y - G.p.y) > 15) continue;
      const v = f.md.lado ? 'lado' : 'frente', k = (() => { try { return chaveBoneco(f.md.look) + '|' + v; } catch (e) { return null; } })();
      if (!k || DSP.ult.has(k)) continue;
      try { const fo = FOLHAS[folhaDoLook(specDe(f.md.look), f.md.look)]; if (fo && !fo.ok) continue; } catch (e) { continue; } // (folha chegando: depois)
      try { const r = _sbDsp(f.md.look, v, 0); DSP.ult.set(k, r); if (r) DSP.ult.set(chaveBoneco(f.md.look), r); } catch (e) { }
      return; // um por folga
    }
  }

  /* ---------- 1) chão: na entrada do mapa, os blocos da tela de uma vez ---------- */
  const _entDsp = entrarMapa;
  entrarMapa = function () { const r = _entDsp.apply(this, arguments); DSP.entrou = { m: G.mapa, t: performance.now() }; pedeFolhasDoMapa(G.mapa); return r; };
  function pintaEntrada() {
    const e = DSP.entrou, m = G.mapa; if (!e || e.m !== m) { DSP.entrou = null; return; }
    if (performance.now() - e.t > 15000) { DSP.entrou = null; return; }
    if (typeof CHAO_BLOCOS === 'undefined' || !CV || !G.cam || !G.zoom) return;
    const S = m._chao; if (!S || !(S instanceof CHAO_BLOCOS.ChaoBlocos) || S.soPrevia || !S.ops || !S.ops.length) return;
    if (window.CHAO2_FAZENDO && CHAO2_FAZENDO.has(m)) return; // (o desenho do chão ainda está sendo preparado)
    // v410.9 (desempenho, rastro da viagem 07/10): antes pintava os blocos da tela de uma vez (até 100 ms + o bloco que
    // estivesse no meio, sem parar = quadros de 150–400 ms ao entrar no Multiverso/Jurássico/Rio). Agora o chão da tela
    // ganha até 25 ms por quadro (o bloco pode parar no meio e continuar no quadro seguinte) até a tela ficar pronta
    // (no máximo 2 s; enquanto isso aparece a prévia do chão, como sempre apareceu fora da tela).
    const vw = CV.width / G.zoom, vh = CV.height / G.zoom;
    if (!e.t2) e.t2 = performance.now();
    if (S.prontoNaTela(G.cam.x, G.cam.y, vw, vh) || performance.now() - e.t2 > 2000) { DSP.entrou = null; window.CB_ORC_ENTRADA = 0; return; }
    // (a placa de vídeo pode ficar para trás: mandar os comandos é rápido, pintar não. Se o quadro anterior demorou,
    //  dá 2 quadros de folga com o orçamento normal — senão a página fica parada esperando a placa, como no rio)
    if (DSP.ivAnt > 30) DSP.folgaGpu = 2;
    window.CB_ORC_ENTRADA = DSP.folgaGpu > 0 ? (DSP.folgaGpu--, 0) : DSP.ORC_ENTRADA_Q;
  }

  /* ---------- folhas dos bonecos: no computador, todas em segundo plano; as do mapa novo primeiro ---------- */
  const filaF = []; let ativas = 0;
  function proxFolha() {
    while (ativas < 2 && filaF.length) {
      const n = filaF.shift(), f = FOLHAS[n]; if (!f || typeof f.pede !== 'function' || f.pedida) continue;
      f.pede(); ativas++; const t0 = performance.now();
      const vigia = () => { const im = f.im; if (f.ok || performance.now() - t0 > 20000 || (im && im.complete && !im.naturalWidth && im.getAttribute('src'))) { ativas--; proxFolha(); } else setTimeout(vigia, 150); };
      setTimeout(vigia, 150);
    }
  }
  function pedeFolhasDoMapa(m) {
    if (!m || typeof FOLHAS === 'undefined') return;
    const nomes = new Set(), poe = look => { try { if (look && look.tipo === 'humano' || (look && !look.tipo)) nomes.add(folhaDoLook(specDe(look), look)); } catch (e) { } };
    try {
      for (const n of m.npcs || []) poe(NPCS[n.id] && NPCS[n.id].look);
      for (const sp of m.spawns || []) poe(MONSTROS[sp.m] && MONSTROS[sp.m].look);
      for (const f of figurantes(m)) poe(f.md.look);
    } catch (e) { }
    const l = [...nomes].filter(n => FOLHAS[n] && !FOLHAS[n].pedida);
    if (!l.length) return;
    const s = new Set(l); const resto = filaF.filter(n => !s.has(n)); filaF.length = 0; filaF.push(...l, ...resto); proxFolha();
  }
  const _iniDsp = iniciarJogo;
  iniciarJogo = async function () {
    const r = await _iniDsp.apply(this, arguments);
    if (!DSP.economia) setTimeout(() => { try { for (const n of Object.keys(FOLHAS)) if (!filaF.includes(n)) filaF.push(n); proxFolha(); } catch (e) { } }, 3000);
    return r;
  };

  /* ---------- no laço: entrada do mapa + folgas ---------- */
  const _loopDsp = loop;
  loop = function () {
    { const ag = performance.now(); DSP.ivAnt = DSP.iniQ ? ag - DSP.iniQ : 0; DSP.iniQ = ag; } // (intervalo do quadro anterior: ver pintaEntrada)
    try { if (DSP.entrou) pintaEntrada(); else if (window.CB_ORC_ENTRADA) window.CB_ORC_ENTRADA = 0; } catch (e) { DSP.entrou = null; window.CB_ORC_ENTRADA = 0; }
    const a = performance.now();
    const r = _loopDsp.apply(this, arguments);
    const d = performance.now() - a; DSP.ultQuadro = d;
    if (d < 5 && G.rodando && !G.pausado) try { preparaFigurante(); } catch (e) { }
    return r;
  };
  window.DSP_TESTE = { figurantes, pedeFolhasDoMapa, filaF }; // (testes)
}
