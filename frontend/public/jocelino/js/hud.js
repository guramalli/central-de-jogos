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
  // (C4, 16/10; o teste crítico: o painel da esquerda cobria 1/3 da tela) Compacto, como o Stardew (o HUD pequeno nos cantos): o título
  // da meta com a barrinha numa linha, o Agora numa linha só (inteiro com o mouse por cima, e por 4 s quando muda); a conta do que se
  // está fazendo (o quintal: N de T) na barrinha de baixo; a lista do Bira vira a pílula "Lista do Bira 2/4 ▸".
  HUD.cartao = el('div', { class: 'painel cartao', hidden: true },
    el('div', { class: 'c-topo' }, HUD.cartaoTitulo = el('div', { class: 'c-titulo' }), el('div', { class: 'c-fundo' }, HUD.cartaoNivel = el('div', { class: 'c-nivel' }))),
    HUD.cartaoTexto = el('div', { class: 'c-texto' }), HUD.cartaoAgora = el('div', { class: 'c-agora' }),
    HUD.cartaoConta = el('div', { class: 'c-conta', hidden: true }, HUD.cartaoContaTexto = el('div', { class: 'c-conta-texto' }), el('div', { class: 'c-fundo' }, HUD.cartaoContaNivel = el('div', { class: 'c-nivel' }))));
  HUD.pilula = el('div', { class: 'pilula', hidden: true, title: 'A lista (L)', onclick: e => { e.stopPropagation(); alternaLista(); }, onmouseenter: () => abreLista() });
  HUD.colEsq = el('div', { class: 'col-esq' }, HUD.cartao, HUD.pilula, HUD.quadro);
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
  // (T4b) o fiado do Ananias fica à vista embaixo do dinheiro enquanto houver dívida (nada de dívida escondida)
  if (G.fiado > 0) HUD.dinheiro.append(el('div', { class: 'fiado-hud', title: 'O fiado no depósito do Seu Ananias: ele recebe no domingo à noite (ou pague no balcão).', style: 'font-size:13px;line-height:1.1;color:#a3271d' }, `fiado: Cr$ ${G.fiado}`));
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
      const e = el('div', { class: 'espaco' + (i === G.sel ? ' sel' : ''), title: s ? Itens.nome(s.id) + (Itens.energia(s.id) ? ' — botão direito: comer' : '') + valorNaCaixaTxt(s.id) : '', onclick: () => { G.sel = i; hudSujo(); },
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
  mapaRecente();   // (a hora da troca de mapa fica marcada no quadro em que ela acontece)
  if (HUD.quadro._txt !== txt) { HUD.quadro._txt = txt; HUD.quadro.innerHTML = ''; for (const t of txt ? txt.split('|') : []) HUD.quadro.append(el('div', {}, t));
    // (C4) a lista nova (outra tarefa, não só a conta andando) abre sozinha por 4 s, para o jogador ver o que o Bira pediu
    // (revisão da C4) a troca de mapa não abre (a lista muda só porque o mapa mudou)
    const semNum = txt.replace(/\d+/g, '#'); if (txt && semNum !== HUD.quadro._semNum && !mapaRecente()) abreLista(); HUD.quadro._semNum = semNum; }
  atualizaPilula(tarefas);
  // (C4) o Agora inteiro: com o mouse por cima do cartão, ou por 4 s quando a frase muda (sem contar os números)
  { const ag = HUD.cartaoAgora.textContent.replace(/\d+/g, '#'), agora = performance.now();
    // (revisão da C4) 2,5 s, e não quando a frase muda só porque o mapa mudou (mapaRecente: o primeiro segundo depois da troca)
    if (ag !== HUD._agoraSemNum) { if (HUD._agoraSemNum !== undefined && ag !== 'Agora: ' && !mapaRecente()) HUD._agoraAte = agora + 2500; HUD._agoraSemNum = ag; }
    const r = HUD.cartao.getBoundingClientRect(), m = G.mouse || {};
    const mouse = !HUD.cartao.hidden && m.dentro !== false && m.x >= r.left && m.x <= r.right && m.y >= r.top && m.y <= r.bottom;
    // (com o mouse, o cartão inteiro; a frase nova, só o Agora em mais linhas)
    const aberto = !HUD.cartao.hidden && mouse, novo = !HUD.cartao.hidden && !mouse && agora < (HUD._agoraAte || 0);
    if (HUD.cartao.classList.contains('aberto') !== aberto) HUD.cartao.classList.toggle('aberto', aberto);
    if (HUD.cartao.classList.contains('novo') !== novo) HUD.cartao.classList.toggle('novo', novo); }
  // A lista aberta: com o mouse por cima (da pílula ou da lista) ou nos 4 s depois de abrir.
  { const r = HUD.quadro.getBoundingClientRect(), m = G.mouse || {}, sobre = r.height > 0 && m.x >= r.left && m.x <= r.right && m.y >= r.top && m.y <= r.bottom;
    if (sobre) HUD._listaAte = Math.max(HUD._listaAte || 0, performance.now() + 1500);
    const aberta = !HUD.quadro.hidden && performance.now() < (HUD._listaAte || 0);
    if (HUD.colEsq.classList.contains('lista-aberta') !== aberta) HUD.colEsq.classList.toggle('lista-aberta', aberta); }
  // O tamanho compacto da coluna (sem o Agora aberto e sem a lista): a câmera desvia dele (paineisDaCamera), não do que abre e fecha.
  if (!HUD.cartao.classList.contains('aberto') && !HUD.cartao.classList.contains('novo') && !HUD.colEsq.classList.contains('lista-aberta')) {
    const r = HUD.colEsq.getBoundingClientRect(), vis = !HUD.cartao.hidden || !HUD.pilula.hidden;
    HUD._compacto = vis && r.height > 0 ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : null; }
  // (tarefa 7, o robô jogador) Como a barra do Stardew, que pula para o alto quando o fazendeiro anda embaixo dela: a coluna do cartão e
  // do quadro fica quase transparente quando o Jocelino ou o alvo da seta estão embaixo dela (o depósito e a pensão, no canto da Vila,
  // sumiam atrás do cartão).
  // (correção 2) a barrinha da meta sob o relógio recua do mesmo jeito (o canteiro da obra, no alto à direita da Vila, fica embaixo dela)
  // (C4, 16/10) Todo painel recua com o alvo da seta embaixo dele (o relógio, a barra, a energia, a mochila, os botões do topo): a câmera
  // tira o alvo de baixo deles (jogo.js); na borda do mapa, onde ela não passa, o painel fica quase transparente e o clique vale o mundo.
  const s = typeof setaAgora === 'function' ? setaAgora() : null;
  const z = G.zoom || 1, cx = (s && s.tipo === 'alvo' && G.cam && typeof caixaDoAlvo === 'function' && (!s.mapa || s.mapa === G.mapaId)) ? caixaDoAlvo(s) : null;
  const alvo = cx ? { l: (cx.x0 - G.cam.x) * z, t: (cx.y0 - G.cam.y) * z, r: (cx.x1 - G.cam.x) * z, b: (cx.y1 - G.cam.y) * z } : null;
  const jog = G.jog && G.cam ? { l: (G.jog.x - 16 - G.cam.x) * z, t: (G.jog.y - 70 - G.cam.y) * z, r: (G.jog.x + 16 - G.cam.x) * z, b: (G.jog.y - G.cam.y) * z } : null;
  for (const painel of paineisQueRecuam()) {
    const r = painel.getBoundingClientRect(), bate = (q, m) => !!q && q.l < r.right + m && q.r > r.left - m && q.t < r.bottom + m && q.b > r.top - m;
    // (o Jocelino a até 2 ladrilhos da coluna e da barrinha da meta: o que a ferramenta dele alcança pode estar embaixo, e o clique tem de
    // chegar lá; nos outros painéis, o Jocelino embaixo deles, como a barra do Stardew)
    const largo = painel === HUD.colEsq || painel === HUD.meta;
    const doAlvo = !painel.hidden && r.height > 0 && bate(alvo, 8), sob = doAlvo || (!painel.hidden && r.height > 0 && bate(jog, largo ? 2 * TILE * z : 0));
    if (painel.classList.contains('recua') !== sob) painel.classList.toggle('recua', sob);
    // (revisão da C4) o clique da barra, do relógio e dos botões só passa para o mundo com o alvo da seta embaixo (não com só o Jocelino)
    if (painel.classList.contains('recua-alvo') !== doAlvo) painel.classList.toggle('recua-alvo', doAlvo); }
  // (tarefa 7) O quadro não pega mais o clique (deixa passar para o depósito, que ficava embaixo dele): fica firme com o mouse por cima.
  { const r = HUD.quadro.getBoundingClientRect(), m = G.mouse, dentro = !HUD.quadro.hidden && m.x >= r.left && m.x <= r.right && m.y >= r.top && m.y <= r.bottom; if (HUD.quadro.classList.contains('firme') !== dentro) HUD.quadro.classList.toggle('firme', dentro); }
  // O cartão: recalculado quando o HUD suja ou a cada meio segundo de jogo.
  const ag = G.agora || 0;
  if (typeof atualizaCartao === 'function' && (HUD._cartaoSujo || ag - (HUD._tCartao || -9) > 0.5 || ag < (HUD._tCartao || 0))) { HUD._cartaoSujo = false; HUD._tCartao = ag; atualizaCartao(todas.filter(t => !noMapaDaLinha(t) && (!t.mapa || t.urgente)), noSalao); }   // (o Agora: os avisos e, do que tem lugar, só o urgente)
  if (typeof atualizaSeloPensao === 'function') atualizaSeloPensao(HUD.selo, noSalao);
}
// (C4) Os painéis do HUD que recuam com o alvo da seta (ou o Jocelino) embaixo, e o que a câmera evita (px de tela, com folga de 6 px).
const paineisQueRecuam = () => [HUD.colEsq, HUD.meta, HUD.relogio, HUD.energia, HUD.barra, HUD.botaoMochila, HUD.dicaBarra, HUD.botaoTela, HUD.botaoHab, HUD.botaoFab, HUD.botaoCad].filter(Boolean);
// (revisão da C4) guardado por quadro, como o faixasDoHud: a câmera pede uma vez por quadro e o getComputedStyle não roda à toa
let _paineisCam = null, _paineisCamChave = '';
function paineisDaCamera() {
  if (!HUD.relogio) return [];
  const k = `${G.quadros}:${G.agora}:${innerWidth}x${innerHeight}:${G.mapaId}`; if (k === _paineisCamChave && _paineisCam) return _paineisCam;
  _paineisCamChave = k; _paineisCam = paineisDaCamera0(); return _paineisCam;
}
function paineisDaCamera0() {
  const R = [], poe = (r, m = 6) => { if (r && r.r - r.l > 0 && r.b - r.t > 0) R.push({ l: r.l - m, t: r.t - m, r: r.r + m, b: r.b + m }); };
  const de = e => { if (!e || e.hidden || !e.isConnected) return null; const r = e.getBoundingClientRect(); return r.width > 0 && getComputedStyle(e).visibility !== 'hidden' ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : null; };
  poe(HUD._compacto && (!HUD.cartao.hidden || !HUD.pilula.hidden) ? HUD._compacto : null);
  for (const e of [HUD.meta, HUD.relogio, HUD.energia, HUD.barra, HUD.botaoMochila, HUD.botaoTela, HUD.botaoHab, HUD.botaoFab, HUD.botaoCad, HUD.selo]) poe(de(e));
  if (HUD.dicaBarra && HUD.dicaBarra.textContent) poe(de(HUD.dicaBarra));
  return R;
}
// As faixas de cima (o cartão compacto) e de baixo (a barra) em px de tela: o Jocelino fica no meio do que sobra (jogo.js, cameraBase).
let _faixas = null, _faixasChave = '';
function faixasDoHud() {
  const k = `${G.quadros}:${G.agora}:${innerWidth}x${innerHeight}:${G.mapaId}`; if (k === _faixasChave && _faixas) return _faixas;
  const c = HUD._compacto, b = HUD.barra && HUD.barra.style.visibility !== 'hidden' ? HUD.barra.getBoundingClientRect() : null;
  _faixasChave = k; _faixas = { cima: c ? Math.max(0, c.b) : 0, baixo: b && b.height > 0 ? Math.max(0, (G.alt || innerHeight) - b.top) : 0 };
  return _faixas;
}
// A lista do Bira (o quadro) atrás da pílula: abre por 4 s (o mouse por cima segura), o clique e a tecla L abrem e fecham.
function abreLista() { HUD._listaAte = performance.now() + 2500; }
// (revisão da C4) A troca de mapa muda a lista e o Agora sem nada novo para o jogador: no primeiro segundo (de jogo) depois dela, nada abre
// sozinho (o Agora é recalculado um quadro depois da troca: atualizaCartao, no fim do atualizaHud).
function mapaRecente() {
  if (HUD._mapaVisto !== G.mapaId) { HUD._mapaVisto = G.mapaId; HUD._mapaEm = G.agora || 0; }
  return (G.agora || 0) - (HUD._mapaEm || 0) < 1;
}
function alternaLista() { HUD._listaAte = HUD.colEsq && HUD.colEsq.classList.contains('lista-aberta') ? 0 : performance.now() + 4000; if (HUD.colEsq) HUD.colEsq.classList.toggle('lista-aberta', !!HUD._listaAte); }
function atualizaPilula(tarefas) {
  if (!HUD.pilula) return;
  let t = '';
  if (tarefas.length) {
    const l = tarefas.some(x => /^Obra: /.test(x.texto)) && typeof listaDeHoje === 'function' ? listaDeHoje() : null;
    if (l && l.metas) { const ids = Object.keys(l.metas), feitas = ids.filter(id => (l.feito[id] || 0) >= l.metas[id]).length; t = `Lista do Bira ${feitas}/${ids.length}`; }
    else { const p = tarefas[0], curto = p.texto.replace(/\s*\(.*$/, '').replace(/^★\s*/, ''); t = curto + (p.meta ? ` ${p.feito}/${p.meta}` : '') + (tarefas.length > 1 ? ` (+${tarefas.length - 1})` : ''); }
  }
  HUD.pilula.hidden = !t;
  const rot = t ? t + (HUD.colEsq.classList.contains('lista-aberta') ? ' ▾' : ' ▸') : '';
  if (HUD.pilula.textContent !== rot) HUD.pilula.textContent = rot;
}
addEventListener('keydown', e => {
  if (e.code !== 'KeyL' || e.repeat || !G.comecou || /^(TEXTAREA|INPUT)$/.test((e.target && e.target.tagName) || '') || (typeof menuAberto === 'function' && menuAberto())) return;
  if (HUD.pilula && !HUD.pilula.hidden) alternaLista();
});
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
      title: s ? dicaItem(s.id) : '',   // (T4b) com o Olho de comerciante, o valor na caixa
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
