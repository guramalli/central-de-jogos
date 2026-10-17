// Jocelino — ui.js — as janelas em HTML por cima do jogo: placa (texto que fecha com um clique), conversa com
// retrato, pergunta com opções, avisos no canto e o #modal único (como no Lenda). Com o modal aberto o jogo pausa.

let _aoFecharModal = null;
// (a cena de prato tocando também pausa o jogo: o relógio da janta e a paciência param, cena_prato.js)
// (T7) a história tocando também (historias.js): o relógio para, ninguém passeia e o jogador não anda
function menuAberto() { const ab = document.getElementById('abertura'); return !$('#modal').hidden || !$('#capa').hidden || (!!ab && !ab.hidden) || (typeof cenaPratoTocando === 'function' && cenaPratoTocando()) || (typeof historiaTocando === 'function' && historiaTocando()); }

// (C5, 16/10; o teste crítico B, dia 1: o clique de "avançar" na fala do Seu Ananias comprou 2 latas de tinta na loja que abriu logo
// embaixo) O CLIQUE-FANTASMA: a janela que abre até 300 ms depois de outra fechar (a fala, a pergunta, o resumo da noite) ignora o
// clique e a tecla de verdade nos 300 ms seguintes. Só a entrada de verdade (isTrusted): o clique do robô e das suítes é de propósito.
// Uma fala trocada direto por outra janela (sem fechar) conta como fechada. Foi assim que o "Beleza!" das telas de nível perdeu a
// trava própria de meio segundo (habilidades.js).
const TRAVA_FANTASMA_MS = 300;
let _modalFechouEm = -1e9, _travaModalAte = 0;
const travaFantasma = e => !!e && e.isTrusted === true && performance.now() < _travaModalAte;
function _instalaTravaFantasma(m) {
  if (m._travaFantasma) return; m._travaFantasma = true;
  const engole = e => { if (travaFantasma(e)) { e.stopPropagation(); e.preventDefault(); } };
  // (o soltar do botão passa: o 'segura' do mouse e o arrastar da mochila precisam dele)
  for (const t of ['click', 'dblclick', 'mousedown', 'pointerdown', 'contextmenu']) m.addEventListener(t, engole, true);
}
function abrirModal(conteudo, aoFechar) {
  if (typeof recolherLinha === 'function') recolherLinha();   // menu aberto recolhe a linha de pesca (o jogo pausa)
  const m = $('#modal');
  { const ag = performance.now(), ant = m.hidden ? null : m.firstElementChild;
    if (ant && ant !== conteudo && ant._avancar) _modalFechouEm = ag;   // (a fala trocada direto por outra janela)
    _travaModalAte = ag - _modalFechouEm < TRAVA_FANTASMA_MS ? ag + TRAVA_FANTASMA_MS : 0;
    _instalaTravaFantasma(m); }
  m.innerHTML = '';
  if (typeof vesteDoSalao === 'function') vesteDoSalao(conteudo);   // (13/10) dentro do salão da pensão, a caixa veste a lousa de giz (palco.js)
  m.append(conteudo);
  m.hidden = false;
  if (typeof folgaDaLousa === 'function') folgaDaLousa(conteudo);   // (tarefa 6) a lousa que passa poucos px cresce, sem barrinha (palco.js)
  poeFecharX(m, conteudo);
  _aoFecharModal = aoFechar || null;
  m.onclick = e => { if (e.target === m) fecharModal(); };
}
// (tarefa 7, o robô jogador: "nenhuma caixa sem botão de fechar") A caixa sem um Fechar à vista quando abre (o depósito, a lista do
// Grêmio, as melhorias e a pensão que rolam) ganha o ✕ no canto de cima, como o X dos menus do Stardew e das telas do Dave. Ele fica no
// #modal, fora da caixa (as caixas que se redesenham por inteiro não o apagam), e acompanha o tamanho dela. As falas e as perguntas não têm.
const FECHA_TEXTO = /^(✕|Fechar|Voltar|Sair|Pronto|Guardar o cardápio|Começar)/i;
function poeFecharX(m, conteudo) {
  if (!conteudo || !conteudo.classList || conteudo.classList.contains('placa') || conteudo.querySelector('.opcoes')) return;
  const aVista = b => { const r = b.getBoundingClientRect(), c = conteudo.getBoundingClientRect(); return r.width > 0 && r.top >= Math.max(0, c.top) && r.bottom <= Math.min(innerHeight, c.bottom); };
  if ([...conteudo.querySelectorAll('button, .botao, .tabua')].some(b => FECHA_TEXTO.test(b.textContent.trim()) && aVista(b))) return;
  const x = el('button', { class: (conteudo.classList.contains('lousa') ? 'tabua' : 'botao') + ' fechar-x', title: 'Fechar (Esc)', 'aria-label': 'Fechar',
    onclick: e => { e.stopPropagation(); fecharModal(); } }, '✕');
  m.append(x);
  // (na lousa do salão, dentro do canto da moldura: o título é centrado; nas outras, na quina de fora, sem tapar o título nem o dinheiro)
  const dentro = conteudo.classList.contains('lousa');
  const poe = () => { if (!x.isConnected || !conteudo.isConnected) return; const r = conteudo.getBoundingClientRect(); x.style.left = Math.round(r.right - (dentro ? 58 : 24)) + 'px'; x.style.top = Math.round(Math.max(4, r.top + (dentro ? 16 : -14))) + 'px'; };
  poe(); if (typeof ResizeObserver !== 'undefined') new ResizeObserver(poe).observe(conteudo);
}
function fecharModal() {
  const m = $('#modal');
  if (m.hidden) return;
  m.hidden = true;
  m.innerHTML = '';
  _modalFechouEm = performance.now(); _travaModalAte = 0;   // (C5) o clique-fantasma: quem abrir agora conta daqui
  const f = _aoFecharModal;
  _aoFecharModal = null;
  if (typeof sons !== 'undefined') sons.tocar('fechar', 1, 0.03, -8);
  if (f) f();
}

// (T2 das conversas) A emoção vai na página, como prefixo: "@alegre Que bom!" mostra "Que bom!" com o retrato <pessoa>_alegre
// (como o $h do Stardew). Sem prefixo, o retrato que veio (o _normal); se a arte da emoção não existe, volta para o _normal sem
// erro. As emoções: alegre, triste, bravo, surpreso, pensativo e, só da Rosa, emocionada e amorosa (@normal também vale).
const EMOCAO_PAGINA = /^@([a-z_]+)\s+/;
function emocaoDaPagina(t) { const m = typeof t === 'string' && t.match(EMOCAO_PAGINA); return m ? { emo: m[1], texto: t.slice(m[0].length) } : { emo: '', texto: t }; }
function retratoDaEmocao(url, emo) {
  const m = /^a\/(retratos\/.+)_[a-z]+\.webp/.exec(url || '');
  if (!emo || !m) return url;
  const tem = n => typeof ARTE_LISTA !== 'undefined' && ARTE_LISTA.includes(n);
  return tem(m[1] + '_' + emo) ? urlArte(m[1] + '_' + emo) : tem(m[1] + '_normal') ? urlArte(m[1] + '_normal') : url;
}
// Placa: um texto (ou várias páginas). Fecha com clique, E, Esc, Espaço ou Enter.
function abrirPlaca(texto, opc = {}) {
  const paginas = Array.isArray(texto) ? texto.slice() : [texto];
  let i = 0;
  const corpo = el('div', { class: 'texto' });
  const foto = opc.retrato ? el('img', { class: 'retrato', src: opc.retrato }) : null;
  // (a arte que não carrega volta para o _normal, uma vez só)
  if (foto) foto.onerror = () => { const n = retratoDaEmocao(opc.retrato, 'normal'); if (foto.getAttribute('src') !== n) foto.src = n; };
  const caixa = el('div', { class: 'painel placa' },
    // (15/10, "1. Madeira de obra") o retrato numa moldura de madeira com a plaquinha de latão do nome embaixo (a arte em ui/madeira; o nome vem do CSS,
    // attr(data-nome), para o texto da placa não repetir o nome)
    foto ? el('div', { class: 'retrato-moldura' }, foto, opc.quem ? el('div', { class: 'plaquinha-nome', 'data-nome': opc.quem }) : null) : null,
    opc.quem ? el('div', { class: 'quem' }, opc.quem) : null,
    corpo, el('div', { class: 'dica-fechar' }, paginas.length > 1 ? 'clique para continuar ▸' : 'clique para fechar'));
  const mostra = () => {
    const p = emocaoDaPagina(paginas[i]);
    corpo.textContent = p.texto; caixa.dataset.emocao = p.emo || 'normal';
    if (foto) { const src = p.emo ? retratoDaEmocao(opc.retrato, p.emo) : opc.retrato; if (foto.getAttribute('src') !== src) foto.src = src; }
    caixa.querySelector('.dica-fechar').textContent = i < paginas.length - 1 ? 'clique para continuar ▸' : 'clique para fechar';
  };
  caixa.onclick = e => { e.stopPropagation(); avancar(); };
  const avancar = () => { if (i < paginas.length - 1) { i++; mostra(); if (typeof sons !== 'undefined') sons.tocar('letra', 1, 0.03, -6); } else fecharModal(); };
  caixa._avancar = avancar;
  mostra();
  abrirModal(caixa, opc.depois);
  if (typeof sons !== 'undefined') sons.tocar('abrir', 1.1, 0.03, -8);
}
// (onda final, o robô #29; o Dave: as dicas do Bancho ficam fora da lista) A faixa fixa da primeira vez numa tela do salão, como a
// do quadro do cardápio: o retrato da Rosa e a frase (guia_setas.js escreve nela; a seta fica no elemento). Escondida, não ocupa lugar.
function faixaDaTela(cls) { return el('div', { class: 'guia-faixa tela-faixa ' + cls, hidden: true }, el('img', { src: urlArte('retratos/rosa_normal'), alt: '' }), el('div', { class: 'guia-faixa-texto' })); }
// Conversa: placa com o nome e o retrato de um morador.
function abrirConversa(quem, retrato, paginas, depois) { abrirPlaca(paginas, { quem, retrato, depois }); }

// Pergunta com opções; `aoEscolher(i)` recebe o índice (o modal já fechou).
function perguntar(texto, opcoes, aoEscolher) { perguntarCom(null, null, texto, opcoes, aoEscolher); }
// (T3 das conversas) A pergunta com retrato (o $q/$r do Stardew): a `perguntar` com a moldura de madeira do retrato e a plaquinha
// de latão do nome, as mesmas da conversa (sem retrato, é a pergunta de sempre). O texto pode ter @emoção (troca o retrato, como na
// conversa; sem a arte, volta ao _normal). Cada opção é um texto ou um objeto { t: 'texto', ... } (o resto — amizade, resposta,
// marca — é do Conversas.perguntar, conversas.js). `aoEscolher(i, opção)` recebe o índice (o modal já fechou). Fechar sem escolher
// (Esc, clique fora) vale a ÚLTIMA opção, como na perguntar: nenhuma pergunta trava o jogo.
// (revisão da T3) Com retrato, Enter e Espaço não valem nos primeiros 300 ms (quem vinha passando as páginas da conversa com Enter
// não responde a 1ª sem querer). opc.definitiva (a pergunta com id, conversas.js): E e X não fecham nem respondem; só o Esc (a última).
const PERGUNTA_TRAVA_MS = 300;
function perguntarCom(quem, retrato, texto, opcoes, aoEscolher, opc = {}) {
  const p = emocaoDaPagina(texto), rotulo = o => o && typeof o === 'object' && 't' in o ? emocaoDaPagina(o.t).texto : typeof o === 'string' ? emocaoDaPagina(o).texto : o;
  const foto = retrato ? el('img', { class: 'retrato', src: p.emo ? retratoDaEmocao(retrato, p.emo) : retrato }) : null;
  if (foto) foto.onerror = () => { const n = retratoDaEmocao(retrato, 'normal'); if (foto.getAttribute('src') !== n) foto.src = n; };
  let feito = false;
  const escolhe = i => { if (feito) return; feito = true; aoEscolher(i, opcoes[i]); };
  const caixa = el('div', { class: 'painel placa' + (foto ? ' pergunta-com' : '') },
    foto ? el('div', { class: 'retrato-moldura' }, foto, quem ? el('div', { class: 'plaquinha-nome', 'data-nome': quem }) : null) : null,
    foto && quem ? el('div', { class: 'quem' }, quem) : null,
    el('div', { class: 'texto' }, p.texto),
    el('div', { class: 'opcoes' }, opcoes.map((o, i) => el('button', { class: 'botao' + (i === 0 ? ' forte' : ''), onclick: e => {
      e.stopPropagation(); $('#modal').hidden = true; $('#modal').innerHTML = ''; _aoFecharModal = null; _modalFechouEm = performance.now(); escolhe(i); } }, rotulo(o)))));
  caixa.dataset.emocao = p.emo || 'normal';
  const abriu = performance.now();
  caixa._tecla = e => (foto && ['Space', 'Enter', 'NumpadEnter'].includes(e.code) && performance.now() - abriu < PERGUNTA_TRAVA_MS)
    || (!!opc.definitiva && ['KeyE', 'KeyX'].includes(e.code));   // (true = a tecla foi usada aqui, sem fazer nada)
  abrirModal(caixa, () => escolhe(opcoes.length - 1));
}

// Aviso que some sozinho (canto de baixo à esquerda).
// (E8) ms: quanto tempo o aviso fica (o padrão de sempre; a fala longa da Rosa de manhã fica mais)
function avisar(texto, ms = 3200) {
  const a = el('div', { class: 'aviso' }, texto);
  const box = $('#avisos');
  box.append(a);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => a.remove(), ms);
}

// Teclas que fecham/avançam o modal.
function teclaNoModal(e) {
  if ($('#modal').hidden) return false;
  if (e.repeat) return true;   // segurar a tecla não repete nada dentro de uma janela
  if (travaFantasma(e)) return true;   // (C5) a tecla que fechou a fala não cai na janela que abriu logo depois
  // (15/10, níveis) a tela "Subiu de nível!" decide as teclas dela (habilidades.js; Esc deixa para a próxima noite)
  { const nv = $('#modal .nivel-novo'); if (nv && nv._tecla) { nv._tecla(e); return true; } }
  // (15/10) a caixa que decide algumas teclas (o fechamento e o resumo do dia: Espaço pula a animação); devolve true se usou a tecla
  { const cx = $('#modal').firstElementChild; if (cx && cx._tecla && cx._tecla(e)) return true; }
  // (onda final; o Dave: confirmar o cardápio abre o restaurante) no quadro de giz da abertura, Enter é a ação acesa, "Abrir a
  // pensão"; o Esc fecha (a janta fica esperando)
  if (['Enter', 'NumpadEnter'].includes(e.code)) { const ab = $('#modal .quadro-cardapio.abertura .qc-abrir'); if (ab) { ab.click(); return true; } }
  // Enter/Espaço acionam só a opção destacada de uma pergunta; numa tela de compra/treino, fecham.
  if (['Space', 'Enter'].includes(e.code)) {
    const b = $('#modal .opcoes .forte');
    if (b) { b.click(); return true; }
  }
  // (a tecla da caderneta fecha a caderneta aberta, como a M fecha o mapa)
  if ($('#modal .caderneta') && typeof ehTecla === 'function' && ehTecla(e, 'caderneta')) { fecharModal(); return true; }
  if (['Escape', 'KeyE', 'Space', 'Enter', 'KeyX'].includes(e.code)) {
    const placa = $('#modal .placa');
    if (placa && placa._avancar && e.code !== 'Escape') placa._avancar(); else fecharModal();
    return true;
  }
  return true;
}
