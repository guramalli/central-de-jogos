// Jocelino — ui.js — as janelas em HTML por cima do jogo: placa (texto que fecha com um clique), conversa com
// retrato, pergunta com opções, avisos no canto e o #modal único (como no Lenda). Com o modal aberto o jogo pausa.

let _aoFecharModal = null;
// (a cena de prato tocando também pausa o jogo: o relógio da janta e a paciência param, cena_prato.js)
function menuAberto() { const ab = document.getElementById('abertura'); return !$('#modal').hidden || !$('#capa').hidden || (!!ab && !ab.hidden) || (typeof cenaPratoTocando === 'function' && cenaPratoTocando()); }

function abrirModal(conteudo, aoFechar) {
  if (typeof recolherLinha === 'function') recolherLinha();   // menu aberto recolhe a linha de pesca (o jogo pausa)
  const m = $('#modal');
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
    // (15/10, "1. Madeira de obra") o retrato numa moldura de madeira com a plaquinha de latão do nome embaixo (a arte em ui/madeira; o nome vem do CSS,
    // attr(data-nome), para o texto da placa não repetir o nome)
    opc.retrato ? el('div', { class: 'retrato-moldura' }, el('img', { class: 'retrato', src: opc.retrato }), opc.quem ? el('div', { class: 'plaquinha-nome', 'data-nome': opc.quem }) : null) : null,
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
// (onda final, o robô #29; o Dave: as dicas do Bancho ficam fora da lista) A faixa fixa da primeira vez numa tela do salão, como a
// do quadro do cardápio: o retrato da Rosa e a frase (guia_setas.js escreve nela; a seta fica no elemento). Escondida, não ocupa lugar.
function faixaDaTela(cls) { return el('div', { class: 'guia-faixa tela-faixa ' + cls, hidden: true }, el('img', { src: urlArte('retratos/rosa_normal'), alt: '' }), el('div', { class: 'guia-faixa-texto' })); }
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
  if (e.repeat) return true;   // segurar a tecla não repete nada dentro de uma janela
  // (15/10, níveis) a tela "Subiu de nível!" decide as teclas dela (habilidades.js: meio segundo sem nada; Esc deixa para a próxima noite)
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
