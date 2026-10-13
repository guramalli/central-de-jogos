// Jocelino — abertura.js — a abertura do jogo novo (13/10: "a pessoa entra no jogo e sabe exatamente do que se trata"). Como é
// no Stardew: o avô entrega a carta, anos depois o neto a abre num cubículo da Joja e pega o ônibus para a fazenda — o motivo
// vem antes de qualquer mecânica. Aqui: Aracaju em 1975, a carta do Tio Juca (serviço e um terreno), a viagem e a chegada no
// quintal. Os quadros são arte do Higgsfield (a/abertura/*); o texto é HTML por cima. Continuar (Enter/Espaço) e Pular (Esc).
const ABERTURA = [
  ['aracaju', 'Aracaju, 1975. A obra onde o Jocelino trabalhava parou, e o dinheiro do aluguel ficou curto. A Rosa cozinha para fora quando dá; a Ritinha e o Zezinho crescem depressa.'],
  ['carta', 'Chegou carta do Tio Juca, de Praia Grande, lá em São Paulo: "Aqui tem obra pra todo lado, e o Mestre Bira precisa de servente. E o terreno do lado da minha casa é de vocês: um dia vocês levantam a casa de vocês ali."'],
  ['viagem', 'Dois dias de ônibus, com tudo o que tinham amarrado no bagageiro. A Ritinha e o Zezinho nunca tinham visto o mar daquele lado.'],
  ['chegada', 'Vila Maré, Praia Grande. O quintal do Tio Juca está tomado de mato, mas o terreno das bandeirinhas é deles. Começa a vida da Família Santos: o ofício, a horta, a pensão da Rosa e, um dia, a casa própria.'],
];
function mostrarAbertura(aoFim) {
  let d = document.getElementById('abertura');
  if (!d) { d = el('div', { id: 'abertura', hidden: true }); document.body.append(d); }
  let i = 0;
  const fim = () => { d.hidden = true; d.innerHTML = ''; aoFim(); };
  const avanca = () => { if (++i >= ABERTURA.length) fim(); else desenha(); };
  const desenha = () => {
    const [img, txt] = ABERTURA[i];
    d.innerHTML = '';
    d.append(el('img', { src: urlArte('abertura/' + img), alt: '' }), el('div', { class: 'ab-texto' }, txt),
      el('div', { class: 'ab-botoes' }, el('button', { class: 'botao', onclick: fim }, 'Pular'),
        el('button', { class: 'botao forte', onclick: avanca }, i === ABERTURA.length - 1 ? 'Começar' : 'Continuar')));
  };
  d._avanca = avanca; d._pula = fim;
  desenha(); d.hidden = false;
}
// O teclado na abertura: Enter/Espaço continua, Esc pula (antes do jogo, que ainda não começou).
addEventListener('keydown', e => {
  const d = document.getElementById('abertura'); if (!d || d.hidden) return;
  if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); d._avanca(); }
  else if (e.code === 'Escape') { e.preventDefault(); d._pula(); }
}, true);
// O jogo novo: a abertura e depois o quintal (com o guia: o mesmo jogo para todo mundo, como o Stardew, que não pergunta).
function novoJogo() {
  $('#capa').hidden = true;
  mostrarAbertura(() => { const s = novoSave(); s.guia = Guia.novo(true); iniciarJogo(s); });
}
