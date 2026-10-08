/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👤 CRIAÇÃO SEM "FORMAS GEOMÉTRICAS" (v411.5)
   Jogador (Reddit, 08/10/2026): "Na criação do personagem ... algumas vezes, ao selecionar características, acontece um
   pequeno bug com o cabelo ou outros elementos aparecem inicialmente com formas geométricas e, depois de alguns
   segundos, carregam corretamente."
   Causa: desde a v407 cada folha do boneco (a/boneco_<penteado>.webp) só baixa quando é desenhada pela 1ª vez. Na criação,
   ao escolher um penteado/saia novo, a folha ainda não tinha chegado: montaRetrato pintava o desenho de reserva (vetorial,
   "geométrico") e o retrato só era refeito no próximo clique.
   Agora:
   1) ao abrir a criação (e já ao passar o mouse/dedo em "Novo jogo"), as folhas de TODAS as opções começam a baixar em
      segundo plano — a escolhida primeiro, depois as do mesmo corpo, depois as do outro (sem atrasar a abertura da tela);
   2) se a folha da opção escolhida ainda não chegou, o retrato mantém o boneco anterior com um "carregando" discreto
      (bolinha girando) e é refeito sozinho assim que ela chega (sem a reserva geométrica). Se a folha falhar ou demorar
      mais de 10 s, mostra o desenho de reserva, como antes (a tela nunca fica vazia).
   3) quem ainda não tem jogador salvo já recebe, na tela inicial, a folha do boneco padrão da criação.
   Carregar DEPOIS de ui.js, boneco.js, corpos.js e chapeus_arte.js (embrulha montaRetrato e abrirCriacao). Prefixo cpv.
   ============================================================ */
{
  const cpvEspera = new WeakMap(); // retrato → { t } (espera da folha)
  const cpvLook = cfg => Object.assign({ tipo: 'humano' }, cfg, { fundo: undefined });
  function cpvFolha(cfg) { try { const l = cpvLook(cfg); return FOLHAS[folhaDoLook(specDe(l), l)] || null; } catch (e) { return null; } }
  // folha que falhou (sem internet, arquivo faltando): não adianta esperar
  const cpvFalhou = f => !!(f && f.pedida && f.im && f.im.complete && !f.im.naturalWidth);
  // pede a folha (o "ok" é que dispara o download — folhaSobDemanda, boneco.js)
  const cpvPede = f => { try { if (f) void f.ok; } catch (e) { } };

  /* ---------- 2) retrato: espera a folha com o boneco anterior na tela ---------- */
  const _montaCpv = montaRetrato;
  montaRetrato = function (alvo, cfg, aura) {
    const ant = alvo && cpvEspera.get(alvo); if (ant) { clearTimeout(ant.t); cpvEspera.delete(alvo); }
    const f = cpvFolha(cfg); cpvPede(f);
    if (!alvo || !f || f.ok || cpvFalhou(f)) { if (alvo) alvo.classList.remove('cpv-carregando'); return _montaCpv.apply(this, arguments); }
    if (!alvo.querySelector('canvas')) { // ainda não há boneco anterior: só o fundo (sem a reserva geométrica)
      alvo.innerHTML = ''; if (aura) alvo.append(el('span', { class: 'aura' }));
      const c = mkCanvas(300, 400); c.style.width = '100%'; c.style.height = '100%'; c.style.objectFit = 'contain'; const x = c.getContext('2d');
      const fu = typeof FUNDOS_B !== 'undefined' && FUNDOS_B[cfg && cfg.fundo]; if (fu) { const g = x.createLinearGradient(0, 0, 0, 400); g.addColorStop(0, fu[0]); g.addColorStop(1, fu[1]); x.fillStyle = g; x.fillRect(0, 0, 300, 400); }
      alvo.append(c);
    }
    alvo.classList.add('cpv-carregando');
    const t0 = performance.now(), eu = this;
    const tenta = () => {
      if (cpvEspera.get(alvo) !== reg) return; // (outra escolha passou na frente)
      if (f.ok || cpvFalhou(f) || performance.now() - t0 > 10000) { cpvEspera.delete(alvo); alvo.classList.remove('cpv-carregando'); _montaCpv.call(eu, alvo, cfg, aura); }
      else reg.t = setTimeout(tenta, 80);
    };
    const reg = { t: setTimeout(tenta, 80) }; cpvEspera.set(alvo, reg);
  };

  /* ---------- 1) todas as folhas da criação, em segundo plano ---------- */
  let cpvPediu = false;
  function cpvPreCarrega(corpo) {
    if (typeof AVATAR === 'undefined' || typeof FOLHAS === 'undefined') return;
    const primeiro = corpo === 'f' ? 'f' : 'm', outro = primeiro === 'f' ? 'm' : 'f';
    const folhasDo = c => {
      const l = new Set();
      for (const cab of AVATAR.cabelos || []) for (const baixo of c === 'f' ? ['baixo-shorts', 'baixo-saia'] : ['baixo-shorts']) {
        const f = cpvFolha({ corpo: c, cabelo: cab.id, roupa: 'roupa-camiseta', baixo }); if (f) l.add(f);
      }
      return [...l];
    };
    folhasDo(primeiro).forEach(cpvPede);
    if (cpvPediu) return; cpvPediu = true;
    setTimeout(() => folhasDo(outro).forEach(cpvPede), 400); // o outro corpo logo depois (não disputa a internet com a escolhida)
  }
  window.cpvPreCarrega = cpvPreCarrega; // (para os testes)
  const _abreCpv = abrirCriacao;
  abrirCriacao = function () {
    const r = _abreCpv.apply(this, arguments); // (a escolhida já foi pedida pelo próprio retrato)
    try { setTimeout(() => cpvPreCarrega('m'), 0); } catch (e) { }
    return r;
  };
  // 3) tela inicial: "Novo jogo" com o mouse/dedo em cima já começa a baixar; sem jogador salvo, a folha do boneco padrão vem já
  const cpvInicio = () => {
    const b = document.getElementById('btnNovo');
    if (b) ['pointerenter', 'touchstart', 'focus'].forEach(ev => b.addEventListener(ev, () => cpvPreCarrega('m'), { once: true, passive: true }));
    setTimeout(() => { try { if (!lerSave()) cpvPede(cpvFolha({ corpo: 'm', cabelo: 'cabelo-cacheado', roupa: 'roupa-camiseta', baixo: 'baixo-shorts' })); } catch (e) { } }, 1500);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cpvInicio); else cpvInicio();

  /* ---------- "carregando" discreto ---------- */
  const st = document.createElement('style');
  st.textContent = `.retrato.cpv-carregando canvas { opacity: .6; filter: saturate(.75); transition: opacity .2s; }
  .retrato.cpv-carregando::after { content: '⚽'; position: absolute; right: 10px; bottom: 10px; font-size: 22px; line-height: 1; animation: cpvGira .9s linear infinite; filter: drop-shadow(0 1px 2px rgba(0,0,0,.35)); pointer-events: none; }
  @keyframes cpvGira { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .retrato.cpv-carregando::after { animation: none; } }`;
  document.head.append(st);
}
