// Jocelino — hud.js — o HUD em HTML por cima do canvas: quadro de tarefas (translúcido, firme com o mouse), relógio com
// o dia, a estação, a hora e o dinheiro, a barra de energia, a barra de 12 itens (1-0, roda do mouse, Tab troca a
// fileira) e, na pensão, o selo da fama. A mochila (E, ou o botão à direita da barra) mostra todos os espaços (48; 60 com a de
// couro): arrastar troca de lugar ou junta, clique pega/solta/troca, direito pega um, "Organizar" arruma as fileiras 2 em diante.

let _hudSujo = true;
function hudSujo() { _hudSujo = true; HUD._cartaoSujo = true; }
const HUD = {};
// (onda final; o Stardew: clicar no HUD não usa a ferramenta) O ponto (x, y) da tela em cima do quadro de tarefas ou do cartão da
// família à vista: o clique esquerdo ali não dá golpe (entrada.js), mesmo com o quadro deixando o clique passar para o mundo.
// Com a coluna recuada (quase transparente: o Jocelino ou o alvo da seta embaixo dela), o que se vê é o mundo, e o clique vale o mundo
// (o robô jogador: a plaquinha da cerca embaixo do cartão não recebia a pá).
// (correção 2) também a barrinha da meta sob o relógio (HUD.meta).
function mouseNoPainelDoHud(x, y) {
  const recuou = HUD.colEsq && HUD.colEsq.classList.contains('recua');
  return [recuou ? null : HUD.quadro, recuou ? null : HUD.cartao, HUD.meta && HUD.meta.classList.contains('recua') ? null : HUD.meta].some(p => { if (!p || p.hidden) return false; const r = p.getBoundingClientRect(); return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
}

function montaHud() {
  const h = $('#hud');
  h.innerHTML = ''; HUD.forca = null;
  HUD.quadro = el('div', { class: 'painel quadro' });
  // O cartão da família (13/10): a meta da casa e o "Agora"; o quadro de tarefas fica embaixo, só com o trabalho na mão.
  HUD.cartao = el('div', { class: 'painel cartao', hidden: true }, HUD.cartaoTitulo = el('div', { class: 'c-titulo' }), el('div', { class: 'c-fundo' }, HUD.cartaoNivel = el('div', { class: 'c-nivel' })),
    HUD.cartaoTexto = el('div', { class: 'c-texto' }), HUD.cartaoAgora = el('div', { class: 'c-agora' }));
  HUD.colEsq = el('div', { class: 'col-esq' }, HUD.cartao, HUD.quadro);
  HUD.relogio = el('div', { class: 'painel relogio' }, HUD.dia = el('div', { class: 'dia' }), HUD.estacao = el('div', { class: 'estacao' }),
    HUD.hora = el('div', { class: 'hora' }), HUD.dinheiro = el('div', { class: 'dinheiro' }));
  HUD.meta = el('div', { class: 'painel meta-bazar', hidden: true }, HUD.metaTexto = el('div', { class: 'meta-texto' }), el('div', { class: 'meta-fundo' }, HUD.metaNivel = el('div', { class: 'meta-nivel' })));
  HUD.energia = el('div', { class: 'painel energia', title: '' }, el('div', { class: 'letra' }, 'E'), el('div', { class: 'fundo' }, HUD.nivel = el('div', { class: 'nivel' })));
  HUD.barra = el('div', { class: 'painel barra' });
  HUD.dicaBarra = el('div', { class: 'dica-barra' });
  HUD.selo = el('div', { class: 'selo', hidden: true });
  HUD.botaoTela = el('button', { class: 'botao botao-tela', title: 'Tela cheia (F)', onclick: () => alternaTelaCheia() }, '⛶');
  HUD.botaoHab = el('button', { class: 'botao botao-hab', title: 'Habilidades (H)', onclick: () => abrirHabilidades() }, '★');
  HUD.botaoFab = el('button', { class: 'botao botao-fab', title: 'Fabricar (B)', onclick: () => abrirFabricar() }, el('img', { src: urlItem('colher'), style: 'height:18px;vertical-align:middle' }));
  HUD.botaoCad = el('button', { class: 'botao botao-cad', title: 'Caderneta: o que dá para fazer (J)', onclick: () => abrirCaderneta() }, '✎');
  // (14/10, o jogador: "dê a opção de abrir ele todo") O botão da mochila, à direita da barra (o Stardew: o botão do inventário).
  // O ícone é a mochila de lona (itens/mochila); se a arte não carregar, cai para o baú, sem quebrar nada.
  HUD.botaoMochila = el('button', { class: 'botao botao-mochila', title: 'Mochila inteira (E)', onclick: e => { e.stopPropagation(); if (!menuAberto()) abrirMochila(); } },
    el('img', { src: urlItem('mochila'), alt: 'Mochila', draggable: 'false', onerror: e => { if (!e.target.dataset.reserva) { e.target.dataset.reserva = '1'; e.target.src = urlItem('bau'); } } }));
  h.append(HUD.colEsq, HUD.relogio, HUD.meta, HUD.energia, HUD.barra, HUD.botaoMochila, HUD.dicaBarra, HUD.selo, HUD.botaoTela, HUD.botaoHab, HUD.botaoFab, HUD.botaoCad);
}

function atualizaHud() {
  if (!G.comecou || !HUD.relogio) return;
  HUD.dia.textContent = relogio.textoDia();
  HUD.estacao.textContent = ESTACOES[relogio.estacao()];
  HUD.hora.textContent = relogio.textoHora();
  HUD.dinheiro.textContent = 'Cr$ ' + G.dinheiro;
  // A meta de dinheiro do Bazar embaixo do relógio ("Bicicleta 180/450").
  // (revisão final) Da conversa da Rosa até a compra, a barrinha é a entrada da lojinha (o mesmo que o cartão), no lugar do Bazar.
  // (dia cheio, Frente A: "tem uma meta para comprar uma garrafa térmica mas eu não faço ideia o porquê") A barrinha é a meta da
  // família (metaDaBarrinha, cartao.js); o Bazar só quando o jogador escolhe "Juntar para", e com o efeito em poucas palavras.
  // (tarefa 7) Dentro do salão aberto, a do restaurante (o Dave: lá dentro a tela é da pensão).
  const mb = typeof metaDaBarrinha === 'function' ? metaDaBarrinha(noSalaoDaPensao() && !!G.pensao && G.pensao.estado === 'aberta') : null;
  HUD.meta.hidden = !mb;
  if (mb) { HUD.metaTexto.textContent = mb.curto; HUD.metaNivel.style.width = Math.min(100, Math.max(0, mb.feito) / mb.meta * 100) + '%'; }
  const f = G.energia / G.energiaMax;
  HUD.nivel.style.height = (Math.min(1, f) * 100) + '%';
  HUD.nivel.style.background = f > 0.5 ? 'var(--verde)' : f > 0.2 ? '#e8c22c' : 'var(--destaque)';
  HUD.energia.title = `Energia ${Math.round(G.energia)}/${G.energiaMax}`;
  if (_hudSujo) {
    _hudSujo = false;
    HUD.barra.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      const s = G.mochila.slots[i];
      const e = el('div', { class: 'espaco' + (i === G.sel ? ' sel' : ''), title: s ? Itens.nome(s.id) + (Itens.energia(s.id) ? ' — botão direito: comer' : '') : '', onclick: () => { G.sel = i; hudSujo(); },
        // (teste de 12/10) Botão direito numa comida da barra: escolhe e pergunta se quer comer (antes não fazia nada).
        oncontextmenu: ev => { ev.preventDefault(); ev.stopPropagation(); G.sel = i; hudSujo(); if (!menuAberto() && typeof comerDaMao === 'function') comerDaMao(); } },
        s ? el('img', { src: urlItem(s.id), draggable: 'false' }) : null, s && Itens.pilha(s.id) > 1 ? el('div', { class: 'qtd' }, s.qtd) : null,
        s && typeof Gremio !== 'undefined' && G.gremio && Gremio.serve(s.id) ? el('img', { class: 'selo-gremio', src: urlArte('ui/selo_gremio'), title: 'Serve para o Grêmio: ' + Gremio.serve(s.id).nome }) : null,
        s && s.id === 'regador' && G.horta ? el('div', { class: 'agua', title: `Água: ${G.horta.agua}` }, el('div', { style: `width:${Math.round(100 * G.horta.agua / Horta.aguaMax())}%` })) : null);
      HUD.barra.append(e);
    }
    const fora = G.mochila.slots.slice(12).filter(Boolean).length;
    HUD.dicaBarra.textContent = fora ? `Tab: próxima fileira (${fora} ${fora === 1 ? 'item' : 'itens'})` : '';
  }
  // O botão da mochila fica colado à direita da barra e some junto com ela (no salão, palco.js esconde a barra).
  if (HUD.botaoMochila) { const r = HUD.barra.getBoundingClientRect(), b = HUD.botaoMochila, x = Math.round(r.right + 6) + 'px', v = HUD.barra.style.visibility || '';
    if (r.width > 0 && b.style.left !== x) b.style.left = x;
    if (b.style.visibility !== v) b.style.visibility = v; }
  // Na pensão aberta, a tela é do restaurante (como no Dave): some o quadro de tarefas e o cartão.
  const noSalao = noSalaoDaPensao() && G.pensao && G.pensao.estado === 'aberta';
  const todas = noSalao ? [] : (typeof tarefasQuadro === 'function' ? tarefasQuadro() : []);
  // (13/10) O quadro só com o trabalho na mão (a linha no mapa dela); os avisos vão para o "Agora" e para a Caderneta.
  const tarefas = todas.filter(t => typeof noMapaDaLinha === 'function' ? noMapaDaLinha(t) : true);
  HUD.quadro.hidden = !tarefas.length;
  // (tarefa 7, o robô jogador) as linhas da lista da obra vêm primeiro, depois as ★ (as metas da pensão, que aparecem também na Vila): com o
  // corte de 6 linhas, as 3 metas da pensão empurravam a 4ª e a 5ª tarefa do Bira para fora do quadro
  const peso = t => /^Obra: /.test(t.texto) ? 2 : t.texto.startsWith('★') ? 1 : 0; tarefas.sort((a, b) => peso(b) - peso(a));
  const txt = tarefas.slice(0, 6).map(t => t.texto + (t.meta ? `  ${t.feito}/${t.meta}` : '')).join('|');
  if (HUD.quadro._txt !== txt) { HUD.quadro._txt = txt; HUD.quadro.innerHTML = ''; for (const t of txt ? txt.split('|') : []) HUD.quadro.append(el('div', {}, t)); }
  // (tarefa 7, o robô jogador) Como a barra do Stardew, que pula para o alto quando o fazendeiro anda embaixo dela: a coluna do cartão e
  // do quadro fica quase transparente quando o Jocelino ou o alvo da seta estão embaixo dela (o depósito e a pensão, no canto da Vila,
  // sumiam atrás do cartão).
  // (correção 2) a barrinha da meta sob o relógio recua do mesmo jeito (o canteiro da obra, no alto à direita da Vila, fica embaixo dela)
  const s = typeof setaAgora === 'function' ? setaAgora() : null;
  for (const painel of [HUD.colEsq, HUD.meta]) { if (!painel) continue;
    const r = painel.getBoundingClientRect(), z = G.zoom || 1, dentro = (x, y) => x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 10 && y <= r.bottom + 30;
    // (o Jocelino a até 2 ladrilhos do painel: o que a ferramenta dele alcança pode estar embaixo, e o clique tem de chegar lá)
    const m = 2 * TILE * z, perto = (x, y) => x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;
    const sob = !painel.hidden && r.height > 0 && !!G.jog && !!G.cam && (perto((G.jog.x - G.cam.x) * z, (G.jog.y - 40 - G.cam.y) * z)
      || (!!s && s.tipo === 'alvo' && dentro((s.x - G.cam.x) * z, (s.y + 30 - G.cam.y) * z)));
    if (painel.classList.contains('recua') !== sob) painel.classList.toggle('recua', sob); }
  // (tarefa 7) O quadro não pega mais o clique (deixa passar para o depósito, que ficava embaixo dele): fica firme com o mouse por cima.
  { const r = HUD.quadro.getBoundingClientRect(), m = G.mouse, dentro = !HUD.quadro.hidden && m.x >= r.left && m.x <= r.right && m.y >= r.top && m.y <= r.bottom; if (HUD.quadro.classList.contains('firme') !== dentro) HUD.quadro.classList.toggle('firme', dentro); }
  // O cartão: recalculado quando o HUD suja ou a cada meio segundo de jogo.
  const ag = G.agora || 0;
  if (typeof atualizaCartao === 'function' && (HUD._cartaoSujo || ag - (HUD._tCartao || -9) > 0.5 || ag < (HUD._tCartao || 0))) { HUD._cartaoSujo = false; HUD._tCartao = ag; atualizaCartao(todas.filter(t => !noMapaDaLinha(t) && (!t.mapa || t.urgente)), noSalao); }   // (o Agora: os avisos e, do que tem lugar, só o urgente)
  if (typeof atualizaSeloPensao === 'function') atualizaSeloPensao(HUD.selo, noSalao);
}
ATUALIZADORES.push(() => atualizaHud());
INICIADORES.push(() => { montaHud(); hudSujo(); });
setInterval(() => { if (G.comecou && G.pausado) atualizaHud(); }, 250);

// ---------- mochila (E) ----------
// O Stardew: o inventário inteiro numa tela; arrastar e soltar troca de lugar (ou junta o mesmo item); o clique pega e o
// outro clique solta; soltar fora da grade devolve o item ao lugar dele; "Organizar" junta as pilhas e ordena por tipo.
const RODAPE_MOCHILA = 'E abre e fecha · arraste para trocar de lugar · botão direito pega 1';
function abrirMochila() {
  if (G.limpou) G.limpou.mochila_aberta = (G.limpou.mochila_aberta || 0) + 1;   // (a primeira vez: a seta do botão some, bau.js)
  const M = G.mochila, caixa = el('div', { class: 'painel mochila-tela' });
  // O item que acompanha o mouse: o que está sendo arrastado ou o da mão.
  const fantasma = el('img', { class: 'mochila-fantasma', alt: '', draggable: 'false' }); fantasma.hidden = true; document.body.append(fantasma);
  let arrasto = null, ponteiro = false, px = -999, py = -999;
  const poeFantasma = () => {
    const s = arrasto ? M.slots[arrasto.de] : M.mao;
    fantasma.hidden = !s; if (!s) return;
    const src = urlItem(s.id); if (fantasma.getAttribute('src') !== src) fantasma.src = src;
    fantasma.style.left = px + 'px'; fantasma.style.top = py + 'px';
  };
  const espacoDo = e => { const t = e.target && e.target.closest ? e.target.closest('.moch-grade .espaco') : null; return t && caixa.contains(t) ? Number(t.dataset.i) : -1; };
  const mexeu = () => { sons.tocar('pegar', 1.1, 0.03, -8); hudSujo(); desenha(); };
  const desenha = () => {
    caixa.innerHTML = '';
    const usados = M.slots.filter(Boolean).length;
    caixa.append(el('div', { class: 'moch-topo' },
      el('div', { class: 'titulo moch-titulo' }, 'Mochila', el('span', { class: 'moch-conta' }, ` ${usados} de ${M.tam}`)),
      el('button', { class: 'botao moch-organizar', title: 'Junta as pilhas iguais e arruma por tipo (a barra não muda)', onclick: e => { e.stopPropagation(); M.organizar(); mexeu(); } }, 'Organizar')));
    const grade = el('div', { class: 'moch-grade' });
    M.slots.forEach((s, i) => grade.append(el('div', {
      class: 'espaco' + (i < Mochila.BARRA ? ' barra' : '') + (arrasto && arrasto.de === i ? ' origem' : ''), 'data-i': String(i),
      title: s ? Itens.nome(s.id) + ' — ' + Itens.descricao(s.id) : '',
      // (o clique sem ponteiro antes, como o dos testes e o do teclado, ainda pega e solta)
      onclick: e => { e.stopPropagation(); if (ponteiro) return; M.clicar(i); mexeu(); },
      oncontextmenu: e => { e.preventDefault(); e.stopPropagation(); M.clicarDireito(i); mexeu(); poeFantasma(); } },
      s ? el('img', { src: urlItem(s.id), draggable: 'false' }) : null,
      s && Itens.pilha(s.id) > 1 ? el('div', { class: 'qtd' }, s.qtd) : null,
      s && typeof Gremio !== 'undefined' && G.gremio && Gremio.serve(s.id) ? el('img', { class: 'selo-gremio', src: urlArte('ui/selo_gremio'), title: 'Serve para o Grêmio: ' + Gremio.serve(s.id).nome }) : null)));
    caixa.append(grade);
    const mao = M.mao;
    caixa.append(el('div', { class: 'moch-mao' }, mao ? `Na mão: ${Itens.qtd(mao.qtd, mao.id)} — clique num espaço para soltar` : ''),
      el('div', { class: 'rodape moch-rodape' }, RODAPE_MOCHILA));
    poeFantasma();
  };
  // Apertar num espaço: com algo na mão, solta ali (o clique de antes); senão, começa a arrastar o item.
  caixa.addEventListener('pointerdown', e => {
    const i = espacoDo(e); if (i < 0 || (e.button != null && e.button !== 0)) return;
    ponteiro = true; px = e.clientX; py = e.clientY;
    if (M.mao) { M.clicar(i); mexeu(); return; }
    if (M.slots[i]) { arrasto = { de: i }; desenha(); }
  });
  const aoMover = e => { if (!caixa.isConnected) return tira(); px = e.clientX; py = e.clientY; if (arrasto || M.mao) poeFantasma(); };
  // Soltar: no mesmo espaço, pega na mão (o clique); em outro, troca ou junta; fora da grade, o item fica onde estava.
  const aoSoltar = e => {
    if (!caixa.isConnected) return tira();
    if (arrasto) { const de = arrasto.de, para = espacoDo(e); arrasto = null;
      if (para === de) M.clicar(de); else if (para >= 0) M.mover(de, para);
      mexeu(); }
    setTimeout(() => { ponteiro = false; }, 0);   // (se o navegador não mandar o click, a marca some sozinha)
  };
  // O click que o navegador manda depois de apertar e soltar já foi feito no ponteiro: não repete a ação. E o que vem depois de um
  // arrasto (apertou num espaço, soltou em outro lugar) cai no fundo escuro e fecharia a tela.
  const engole = e => { if (!caixa.isConnected) return tira(); if (!ponteiro) return; ponteiro = false;
    if (!(e.target.closest && e.target.closest('button'))) { e.stopPropagation(); e.preventDefault(); } };
  const cancela = () => { if (arrasto) { arrasto = null; desenha(); } ponteiro = false; };
  const tira = () => { removeEventListener('pointermove', aoMover); removeEventListener('pointerup', aoSoltar); removeEventListener('pointercancel', cancela); removeEventListener('blur', cancela); removeEventListener('click', engole, true); fantasma.remove(); };
  addEventListener('pointermove', aoMover); addEventListener('pointerup', aoSoltar); addEventListener('pointercancel', cancela); addEventListener('blur', cancela); addEventListener('click', engole, true);
  desenha();
  abrirModal(caixa, () => { tira(); const r = M.guardarMao(); if (r) soltar(r.id, r.qtd, G.jog.x, G.jog.y); hudSujo(); });
  sons.tocar('abrir', 1, 0.03, -6);
}
