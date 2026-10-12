// Jocelino — mapa_tela.js — o mapa da Vila Maré na tecla M (como o mapa do Stardew; teste de 12/10: o jogador não sabia
// onde ficava a pedreira nem a mata). A arte é ui/mapa_vila (Higgsfield); por cima, em HTML: o nome de cada lugar
// ("(fechada)" no que ainda não abriu), o rosto do Jocelino em "Você está aqui" e a seta didática no lugar da missão do guia.
// O M de novo (ou Esc) fecha. No salão, durante a janta, não abre (como a nota do N).

// O ponto de cada lugar na arte do mapa (fração da largura e da altura da imagem).
const MAPA_LUGARES = {
  quintal: { nome: 'Quintal', x: 0.475, y: 0.14 }, vila: { nome: 'Vila Maré', x: 0.50, y: 0.47 }, mata: { nome: 'Mata', x: 0.16, y: 0.42 },
  praia: { nome: 'Praia', x: 0.49, y: 0.90 }, pedreira: { nome: 'Pedreira', x: 0.84, y: 0.22 }, bairro: { nome: 'Bairro Novo', x: 0.83, y: 0.70 },
};
// Em que lugar do mapa fica cada mapa do jogo.
const LUGAR_DO_MAPA = { quintal: 'quintal', vila: 'vila', mata: 'mata', praia: 'praia', alto_mar: 'praia', pedreira: 'pedreira', bancada: 'pedreira',
  bairro: 'bairro', pensao_palco: 'vila', pensao_dentro: 'vila' };

function abrirMapa() {
  if (menuAberto()) return false;
  const tela = el('div', { class: 'mapa-tela' }, el('img', { class: 'mapa-fundo', src: urlArte('ui/mapa_vila'), alt: 'Mapa da Vila Maré', draggable: 'false' }));
  for (const [id, L] of Object.entries(MAPA_LUGARES)) {
    const fechada = typeof Mundo !== 'undefined' && !Mundo.aberto(id);
    tela.append(el('div', { class: 'mapa-rotulo' + (fechada ? ' fechada' : ''), style: `left:${L.x * 100}%;top:${L.y * 100}%` }, L.nome + (fechada ? ' (fechada)' : '')));
  }
  const aqui = LUGAR_DO_MAPA[G.mapaId], A = MAPA_LUGARES[aqui];
  if (A) tela.append(el('div', { class: 'mapa-voce', 'data-lugar': aqui, style: `left:${A.x * 100}%;top:${(A.y - 0.05) * 100}%` },
    el('img', { src: urlArte('retratos/jocelino_normal'), alt: '' }), el('div', {}, 'Você está aqui')));
  // A seta do guia: o lugar da missão que a seta do mapa segue (o mapa dela, ou a carta no quintal).
  if (G.guia && G.guia.ativo && typeof _missoesDaSeta === 'function') {
    for (const id of _missoesDaSeta()) {
      const a = _alvoDaMissao(id), lugar = a && (LUGAR_DO_MAPA[a.mapa] || a.mapa), L = MAPA_LUGARES[lugar];
      if (L) { tela.append(el('img', { class: 'mapa-seta', 'data-lugar': lugar, src: urlArte('ui/seta'), alt: '', style: `left:${L.x * 100}%;top:${(L.y - 0.04) * 100}%` })); break; }
    }
  }
  const caixa = el('div', { class: 'painel mapa-vila' }, el('div', { class: 'titulo' }, 'Mapa da Vila Maré'), tela,
    el('div', { class: 'rodape' }, 'M ou Esc fecha. As setas nas bordas de cada lugar mostram para onde leva cada saída.'));
  abrirModal(caixa);
  return true;
}
// A tecla M: abre (fora de menu, da capa e do serviço da janta); com o mapa aberto, fecha.
addEventListener('keydown', e => {
  if (e.code !== 'KeyM' || e.repeat || /^(TEXTAREA|INPUT)$/.test((e.target && e.target.tagName) || '')) return;
  if (!$('#modal').hidden && $('#modal .mapa-vila')) { fecharModal(); return; }
  if (!$('#capa').hidden || menuAberto() || (typeof noPalco === 'function' && noPalco() && G.turno)) return;
  abrirMapa();
});
