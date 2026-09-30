/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚽ DICAS DO FUTEBOL DA CARREIRA (v292): nas primeiras partidas, o jogo ensina na tela.
   - no começo de cada tipo de lance (ataque, passe, defesa, pênalti), as 3 primeiras vezes:
     um cartão em cima do campo explicando o que fazer (some sozinho, ou no ✖);
   - na hora certa, um aviso piscando em cima de você: "F · DRIBLE!" quando o marcador chega perto
     (e a finta está pronta) e "ESPAÇO · BOTE!" quando dá para desarmar. Some depois que você pegou o jeito.
   Carregar DEPOIS de carreira_futebol.js.
   ============================================================ */
{
  const VEZES_CARTAO = 3, VEZES_AVISO = 6;
  const dic = () => { const s = G.save; if (!s) return null; s.futDicas = s.futDicas || { ataque: 0, passe: 0, defesa: 0, penalti: 0, fintas: 0, botes: 0, chutes: 0 }; return s.futDicas; };
  const cel = () => document.body.classList.contains('cel3');
  const tecla = (pc, bt) => cel() ? bt : pc;
  const TEXTOS = {
    ataque: () => ['⚽ Lance de ATAQUE', `Corra com a bola até o gol (${tecla('setas ou W A S D', 'joystick')}). Quando o marcador chegar perto, ${tecla('aperte F', 'toque em 🌀 Driblar')} para DRIBLAR: ele cai na finta e fica parado. Chegou na área? ${tecla('ESPAÇO', '⚽ Chutar')} chuta!`, 'Dica: não pare na frente do marcador — quem corre e ginga escapa do bote.'],
    passe: () => ['🎯 Lance de PASSE', `Toque para o companheiro livre com ${tecla('C (ou E)', '🎯 Passar')} e corra para a frente: ${tecla('C', '🎯 Passar')} de novo PEDE a bola de volta. Na cara do gol, ${tecla('ESPAÇO', '⚽ Chutar')} chuta.`, 'Dica: o anel amarelo é do seu time; o vermelho, dos adversários.'],
    defesa: () => ['🛡️ Lance de DEFESA', `O adversário está com a bola! Corra até ele e ${tecla('aperte ESPAÇO', 'toque em 🦶 Desarmar')} bem colado para dar o BOTE e roubar a bola.`, 'Dica: se errar o bote, você fica um instante parado — chegue perto antes de tentar.'],
    penalti: () => ['🥅 PÊNALTI', `Escolha onde chutar: ${tecla('W = no alto, ESPAÇO = no meio, S = embaixo', '⬆ Alto, ⚽ Meio ou ⬇ Baixo')}. Tente enganar o goleiro!`, ''],
  };
  let cartao = null, some = 0;
  function tiraCartao() { if (cartao) { cartao.remove(); cartao = null; } }
  function mostraCartao(tipo) {
    tiraCartao(); const t = TEXTOS[tipo]; if (!t) return; const [tit, txt, extra] = t();
    cartao = el('div', { id: 'futDica' },
      el('button', { class: 'fd-x', type: 'button', title: 'Fechar', onclick: tiraCartao }, '✖'),
      el('b', {}, tit), el('p', {}, txt), extra ? el('small', {}, extra) : '');
    document.body.append(cartao); posiciona(); some = Date.now() + 11000;
  }
  function posiciona() {
    if (!cartao) return; const cv = document.getElementById('cv'); if (!cv) return; const r = cv.getBoundingClientRect();
    cartao.style.left = (r.left + r.width / 2) + 'px'; cartao.style.top = (r.top + (cel() ? 56 : 70)) + 'px';
  }
  setInterval(() => { if (cartao && (Date.now() > some || !G.fut || G.fut.acabou)) tiraCartao(); }, 400);
  window.addEventListener('resize', posiciona);

  // começo de cada lance: o cartão (3 primeiras vezes de cada tipo)
  const _comecaDica = futComeca;
  futComeca = function () {
    const r = _comecaDica.apply(this, arguments);
    try { const d = dic(), tipo = G.fut && G.fut.tipo; if (d && tipo && (d[tipo] || 0) < VEZES_CARTAO) { d[tipo] = (d[tipo] || 0) + 1; mostraCartao(tipo); } } catch (e) { }
    return r;
  };
  // conta as fintas e os botes de verdade (o aviso some quando você pegou o jeito)
  const _dribDica = futDriblar;
  futDriblar = function () {
    const F = G.fut, pronta = F && G.agora >= (F.fintaCd || 0) && futTemBola();
    const r = _dribDica.apply(this, arguments);
    try { if (pronta && F.atores.some(a => a.time === 'eles' && a.tonto > G.agora)) { const d = dic(); d.fintas++; } } catch (e) { }
    return r;
  };
  const _chuteDica = futChutar;
  futChutar = function () { const tinha = futTemBola(); const r = _chuteDica.apply(this, arguments); try { if (tinha && !futTemBola()) { const d = dic(); d.chutes = (d.chutes || 0) + 1; } } catch (e) { } return r; };
  const _boteDica = futBote;
  futBote = function () {
    const r = _boteDica.apply(this, arguments);
    try { const F = G.fut; if (F && F.bola.dono && F.bola.dono !== 'p' && F.bola.dono.tonto > G.agora) { const d = dic(); d.botes++; } } catch (e) { }
    return r;
  };
  // o aviso piscando em cima de você, na hora certa
  function aviso(ctx, e, txt) {
    const k = 1 + 0.08 * Math.sin(G.agora / 110), x = e.x * T, y = (e.y - (typeof alturaEnt === 'function' ? alturaEnt(e) : 1.6)) * T - 64; // acima do nome e das barras (que são desenhados depois, por cima)
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.font = '800 18px Fredoka, Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(txt).width + 22;
    ctx.fillStyle = 'rgba(40,20,0,.82)'; ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(-w / 2, -16, w, 32, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe14a'; ctx.fillText(txt, 0, 1); ctx.restore();
  }
  const _entDica = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    const r = _entDica.apply(this, arguments);
    try {
      const F = G.fut; if (e !== G.p || !F || F.acabou || F.tipo === 'penalti') return r;
      const d = dic(); if (!d) return r;
      const naArea = futTemBola() && Math.hypot(FUT.gx - G.p.x, FUT.cy - G.p.y) < 11;
      if (F.tipo !== 'defesa' && naArea && (d.chutes || 0) < VEZES_AVISO) aviso(ctx, e, tecla('ESPAÇO · CHUTE!', '⚽ CHUTE!'));
      else if (F.tipo !== 'defesa' && d.fintas < VEZES_AVISO && futTemBola() && G.agora >= (F.fintaCd || 0)
        && F.atores.some(a => a.time === 'eles' && a.papel !== 'gol' && a.tonto <= G.agora && Math.hypot(a.x - G.p.x, a.y - G.p.y) < 2.3)) aviso(ctx, e, tecla('F · DRIBLE!', '🌀 DRIBLE!'));
      else if (F.tipo === 'defesa' && d.botes < VEZES_AVISO && G.agora >= (F.boteCd || 0)) {
        const dono = F.bola.dono; if (dono && dono !== 'p' && dono.time === 'eles' && dono.papel !== 'gol' && Math.hypot(dono.x - G.p.x, dono.y - G.p.y) < 1.6) aviso(ctx, e, tecla('ESPAÇO · BOTE!', '🦶 BOTE!'));
      }
    } catch (err) { }
    return r;
  };
  const st = document.createElement('style');
  st.textContent = `#futDica { position: fixed; z-index: 60; transform: translateX(-50%); width: min(460px, 86vw); background: rgba(255,246,214,.97); color: #4a2a10;
    border: 3px solid #e0a020; border-radius: 14px; padding: 10px 34px 10px 14px; box-shadow: 0 6px 18px rgba(0,0,0,.35); animation: fdEntra .35s ease-out; pointer-events: auto; }
  #futDica b { display: block; font-size: 17px; margin-bottom: 3px; }
  #futDica p { margin: 0; font-size: 14.5px; line-height: 1.35; }
  #futDica small { display: block; margin-top: 5px; font-size: 12.5px; opacity: .8; }
  #futDica .fd-x { position: absolute; top: 6px; right: 8px; border: 0; background: none; font-size: 16px; cursor: pointer; color: #7a4a20; }
  @keyframes fdEntra { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }`;
  document.head.append(st);
}
