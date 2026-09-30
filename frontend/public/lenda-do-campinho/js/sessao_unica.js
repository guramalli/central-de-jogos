/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🔌 UM APARELHO POR VEZ (v169), como no Tibia.
   Antes: jogando em dois aparelhos com a mesma conta, cada um subia o
   seu save e o último a salvar apagava o progresso do outro.
   Agora: ao entrar no jogo, este aparelho "pega" o personagem (marca a
   sessão no save online). O aparelho antigo confere a nuvem antes de
   salvar (e a cada ~30 s): se outro aparelho entrou depois dele, ele
   para de salvar e mostra o aviso, com o botão para voltar a jogar ali.
   Só vale com login no site (nuvem ligada). Carregar DEPOIS de nuvem.js.
   ============================================================ */
const SESSAO = { id: null, inicio: 0, caiu: false, ultimaConferida: 0 };
if (typeof NUVEM !== 'undefined' && NUVEM.ativa) {
  // outro aparelho entrou com este personagem DEPOIS deste?
  // (cada conferência pede a nuvem de novo: reaproveitar uma consulta antiga, feita antes do outro
  // aparelho entrar, deixava este aparelho salvar por cima uma vez)
  const outroAparelho = async function () {
    try {
      const r = await nuvemPede('GET', '/save'); if (!r.ok || !r.dados || !r.dados.dados) return false;
      const s = JSON.parse(await descomprime(r.dados.dados));
      return !!(s.sessao && s.sessao !== SESSAO.id && (s.sessaoInicio || 0) > SESSAO.inicio);
    } catch (e) { return false; } // sem conexão: não derruba ninguém
    finally { SESSAO.ultimaConferida = Date.now(); }
  };
  const derrubado = function () {
    if (SESSAO.caiu) return; SESSAO.caiu = true; NUVEM.parada = true;
    try { if (G.estTreino && typeof paraEstacao === 'function') paraEstacao(); } catch (e) { }
    G.teclas && G.teclas.clear(); G.caminho = null; G.alvo = null;
    nuvemStatus('🔌 Personagem aberto em outro aparelho');
    abreModal(el('h2', {}, '🔌 Você entrou em outro aparelho'),
      el('p', {}, 'Seu personagem foi aberto em outro computador ou celular. Para o progresso não se misturar (e um aparelho não apagar o que o outro fez), o jogo continua só lá. Este aqui parou de salvar.'),
      el('p', { class: 'dica' }, 'Quer jogar neste aparelho? Toque no botão: o jogo recarrega com o save online mais novo, e o outro aparelho é que recebe este aviso.'),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => location.reload() }, '🔄 Jogar neste aparelho')));
    const f = document.querySelector('#modal .fechar'); if (f) f.hidden = true;
    $('#modal').onclick = null; G.pausado = true; G.rodando = false;
  };
  const confere = async function (forcar) {
    if (!SESSAO.id || SESSAO.caiu || !G.save || !saveDaConta()) return;
    if (!forcar && Date.now() - SESSAO.ultimaConferida < 25000) return;
    if (await outroAparelho()) derrubado();
  };
  // antes de subir o save: se já tem outro aparelho, não sobe (não apaga o progresso de lá)
  const _enviaSaveSes = enviaSave;
  enviaSave = async function () {
    if (SESSAO.caiu) return;
    if (!SESSAO.pegando) { await confere(true); if (SESSAO.caiu) return; } // sempre confere na hora, logo antes de subir
    return _enviaSaveSes.apply(this, arguments);
  };
  const _salvarSes = salvar;
  salvar = function () { if (SESSAO.caiu) return; return _salvarSes.apply(this, arguments); };
  // ao começar a jogar: este aparelho pega o personagem e sobe logo o save com a marca
  const _iniciarJogoSes = iniciarJogo;
  iniciarJogo = async function () {
    const r = await _iniciarJogoSes.apply(this, arguments);
    if (G.save && saveDaConta()) {
      SESSAO.id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); SESSAO.inicio = Date.now(); SESSAO.ultimaConferida = Date.now();
      G.save.sessao = SESSAO.id; G.save.sessaoInicio = SESSAO.inicio;
      const sobe = async (n) => {
        if (SESSAO.caiu || !G.rodando) return;
        NUVEM.ultimoEnvio = 0; SESSAO.pegando = true; // passa pelo protege.js (guarda o personagem antigo), só pula a conferência
        try { await enviaSave(true); } finally { SESSAO.pegando = false; }
        if (NUVEM.ultimoEnvio === 0 && n < 5) setTimeout(() => sobe(n + 1), 12000); // 429 (o outro acabou de salvar): tenta de novo
      };
      try { salvar(); } catch (e) { } setTimeout(() => sobe(0), 1500);
    }
    return r;
  };
  // aba escondida (minimizou / trocou de aba): a página continua viva, então confere antes de mandar.
  // O envio "na hora", sem conferir, fica só para quando a página está fechando.
  const fechando = () => { SESSAO.fechando = true; };
  addEventListener('beforeunload', fechando, true); addEventListener('pagehide', fechando, true);
  const _pacoteSes = enviaPacoteAgora;
  enviaPacoteAgora = function () {
    if (SESSAO.caiu) return;
    if (!SESSAO.fechando && SESSAO.id) { if (NUVEM.pacote && NUVEM.pacote.pendente) enviaSave(true); return; }
    return _pacoteSes.apply(this, arguments);
  };
  // conferir mesmo parado (treinando, com a aba escondida) e ao voltar para a aba
  setInterval(() => { if (G.rodando) confere(false); }, 30000);
  addEventListener('visibilitychange', () => { if (!document.hidden && G.rodando) confere(true); });
}

/* ---------- login do site venceu (v169) ----------
   O login do site dura 7 dias. Quando vencia, o jogo seguia salvando SÓ neste
   aparelho, com um avisinho que ninguém via — e em outro aparelho o save online
   estava velho. Agora aparece uma janela explicando, com o botão para entrar de novo. */
if (typeof NUVEM !== 'undefined' && NUVEM.ativa) {
  let avisouLogin = false;
  const avisaLogin = function () {
    if (avisouLogin || !G.rodando || SESSAO.caiu) return; avisouLogin = true;
    abreModal(el('h2', {}, '⚠️ Seu login do site venceu'),
      el('p', {}, 'Por isso o seu progresso NÃO está indo para o save online: ele está guardado só neste aparelho. Se você abrir o jogo em outro computador ou celular agora, vai achar o save antigo.'),
      el('p', { class: 'dica' }, 'Entre de novo no site e volte para o jogo NESTE aparelho: ele manda o progresso novo para a nuvem sozinho.'),
      el('div', { class: 'opcoes' },
        el('button', { class: 'btn amarelo', type: 'button', onclick: () => { try { salvar(); } catch (e) { } location.href = urlConta('entrar', 'sessao=expirada'); } }, '🔑 Entrar de novo'),
        el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Continuar jogando aqui')));
  };
  const _nuvemStatusSes = nuvemStatus;
  nuvemStatus = function (txt) {
    const r = _nuvemStatusSes.apply(this, arguments);
    const e = document.getElementById('nuvemStatus'); const ruim = /Entre de novo/.test(txt || '');
    if (e) e.classList.toggle('nuvem-ruim', ruim);
    if (ruim) setTimeout(avisaLogin, 400);
    return r;
  };
  const st = document.createElement('style'); st.textContent = '.nuvem-ruim { color: #fff !important; background: #c0392b; border-radius: 6px; padding: 1px 6px; font-weight: 800; }'; document.head.append(st);
}
