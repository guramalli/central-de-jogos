// Jocelino — mapa_pensao.js — a Pensão da Rosa por dentro, em tela cheia (o sushi bar do Bancho): o cenário pintado
// (parede de azulejo, prateleira de garrafas, janela para a rua ao entardecer) enche a tela; por cima, o balcão
// corrido de azulejo, as banquetas (os clientes sentam atrás do balcão, de frente para a câmera), o fogão da Rosa
// na ponta, o quadro de giz, a despensa e a plaquinha da reforma. Antes de abrir, o salão vem sujo para limpar.

const SALAO = {
  CENARIO: { x: 240, y: 144, w: 960, h: 528 },        // x 5-24, y 3-13 em ladrilhos
  ASSENTOS: [[9, 9], [12, 9], [15, 9], [8, 9], [11, 9], [14, 9]],
  BALCAO: [7, 10], COZINHA: [18, 10], QUADRO: [5, 11], DESPENSA: [24, 11], PLAQUINHA: [22, 11],
  SUJEIRA: [['mato', 8, 11], ['mato', 13, 12], ['mato', 19, 12], ['mato', 10, 13], ['entulho', 11, 11], ['entulho', 17, 11], ['entulho', 20, 13], ['entulho', 7, 12]],
};

MAPAS_DEF.pensao_dentro = () => {
  const b = new Construtor('pensao_dentro', 30, 17, 7);
  b.dentro = true;
  b.cenario = 'cenarios/salao_pensao';
  b.enquadramento = SALAO.CENARIO;
  b.livre = { x: 5, y: 11, w: 20, h: 3 };
  b.inicio = { x: 14, y: 12 };
  b.saida(14, 13, 2, 1, 'vila', 15, 9);
  const S = SALAO;
  b.corrido = b.interativo('balcao_corrido', 'objetos/balcao_corrido', S.BALCAO[0], S.BALCAO[1], 10, 1, [156, 8]);
  b.corrido.acao = (o, px) => (typeof pensaoBalcaoCorrido === 'function' ? pensaoBalcaoCorrido(px) : false);
  b.cozinha = b.interativo('balcao_pensao', 'objetos/balcao_pensao', S.COZINHA[0], S.COZINHA[1], 4, 1, [60, 8]);
  b.cozinha.acao = () => (typeof pensaoBalcao === 'function' ? pensaoBalcao() : abrirPlaca('O fogão da Rosa.'));
  b.interativo('quadro_giz', 'objetos/quadro_giz', S.QUADRO[0], S.QUADRO[1], 2, 1, [28, 6]).acao = () => (typeof pensaoQuadro === 'function' ? pensaoQuadro() : false);
  b.interativo('despensa_pensao', 'objetos/despensa_pensao', S.DESPENSA[0], S.DESPENSA[1], 1, 1, [14, 8]).acao = () => (typeof guardarNaDespensa === 'function' ? guardarNaDespensa() : false);
  b.interativo('plaquinha_pensao', 'objetos/plaquinha', S.PLAQUINHA[0], S.PLAQUINHA[1], 1, 1, [8, 6]).acao = () => (typeof pensaoPlaquinha === 'function' ? pensaoPlaquinha() : false);
  for (const s of S.SUJEIRA) b.detrito(s[0], s[1], s[2]);
  b.banquetas = [];
  b.clientes = [];
  b.paredesDaBorda();
  return b;
};
