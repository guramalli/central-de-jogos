// Jocelino — ui.js — as janelas em HTML por cima do jogo: placa (texto que fecha com um clique), conversa com
// retrato, pergunta com opções, avisos no canto e o #modal único (como no Lenda). Com o modal aberto o jogo pausa.

let _aoFecharModal = null;
function menuAberto() { return !$('#modal').hidden || !$('#capa').hidden; }

function abrirModal(conteudo, aoFechar) {
  const m = $('#modal');
  m.innerHTML = '';
  m.append(conteudo);
  m.hidden = false;
  _aoFecharModal = aoFechar || null;
  m.onclick = e => { if (e.target === m) fecharModal(); };
}
function fecharModal() {
  const m = $('#modal');
  if (m.hidden) return;
  m.hidden = true;
  m.innerHTML = '';
  const f = _aoFecharModal;
  _aoFecharModal = null;
  if (typeof sons !== 'undefined') sons.tocar('fechar', 1, 0.03, -8);
  if (f) f();
}

// Placa: um texto (ou várias páginas). Fecha com clique, E, Esc, Espaço ou Enter.
function abrirPlaca(texto, opc = {}) {
  const paginas = Array.isArray(texto) ? texto.slice() : [texto];
  let i = 0;
  const corpo = el('div', { class: 'texto' });
  const caixa = el('div', { class: 'painel placa' },
    opc.retrato ? el('img', { class: 'retrato', src: opc.retrato }) : null,
    opc.quem ? el('div', { class: 'quem' }, opc.quem) : null,
    corpo, el('div', { class: 'dica-fechar' }, paginas.length > 1 ? 'clique para continuar ▸' : 'clique para fechar'));
  const mostra = () => { corpo.textContent = paginas[i]; caixa.querySelector('.dica-fechar').textContent = i < paginas.length - 1 ? 'clique para continuar ▸' : 'clique para fechar'; };
  caixa.onclick = e => { e.stopPropagation(); avancar(); };
  const avancar = () => { if (i < paginas.length - 1) { i++; mostra(); if (typeof sons !== 'undefined') sons.tocar('letra', 1, 0.03, -6); } else fecharModal(); };
  caixa._avancar = avancar;
  mostra();
  abrirModal(caixa, opc.depois);
  if (typeof sons !== 'undefined') sons.tocar('abrir', 1.1, 0.03, -8);
}
// Conversa: placa com o nome e o retrato de um morador.
function abrirConversa(quem, retrato, paginas, depois) { abrirPlaca(paginas, { quem, retrato, depois }); }

// Pergunta com opções; `aoEscolher(i)` recebe o índice (o modal já fechou).
function perguntar(texto, opcoes, aoEscolher) {
  const caixa = el('div', { class: 'painel placa' }, el('div', { class: 'texto' }, texto),
    el('div', { class: 'opcoes' }, opcoes.map((o, i) => el('button', { class: 'botao' + (i === 0 ? ' forte' : ''), onclick: e => {
      e.stopPropagation(); $('#modal').hidden = true; $('#modal').innerHTML = ''; _aoFecharModal = null; aoEscolher(i); } }, o))));
  abrirModal(caixa, () => aoEscolher(opcoes.length - 1));
}

// Aviso que some sozinho (canto de baixo à esquerda).
function avisar(texto) {
  const a = el('div', { class: 'aviso' }, texto);
  const box = $('#avisos');
  box.append(a);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => a.remove(), 3200);
}

// Teclas que fecham/avançam o modal.
function teclaNoModal(e) {
  if ($('#modal').hidden) return false;
  // Enter/Espaço acionam o botão principal: "Pronto!" no montar, a opção destacada numa pergunta, o botão forte de um painel.
  if (['Space', 'Enter'].includes(e.code)) {
    const b = $('#modal .pronto') || $('#modal .opcoes .forte') || (!$('#modal .placa') && $('#modal .botao.forte'));
    if (b) { b.click(); return true; }
  }
  if (['Escape', 'KeyE', 'Space', 'Enter', 'KeyX'].includes(e.code)) {
    const placa = $('#modal .placa');
    if (placa && placa._avancar && e.code !== 'Escape') placa._avancar(); else fecharModal();
    return true;
  }
  return true;
}
