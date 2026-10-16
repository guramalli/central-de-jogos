// Jocelino — mapa_pedreira.js — a pedreira da Serra (jogo/mundo/mapa_pedreira.gd), só a entrada nesta etapa: rochas
// comuns que a picareta quebra (pedra, material de obra) e que se refazem toda manhã; o Seu Tonico na entrada no
// primeiro dia; a escada e o elevador de caçamba fechados até a etapa 5 (as bancadas, a forja e o ferreiro).

// A rocha comum da pedreira dá 1 pedra (pedreira.gd; o dados.js veio sem o que ela solta).
DETRITOS.rocha.solta = { pedra: 1 };
DETRITOS.ferro.solta = { ferro_velho: 2 };

MAPAS_DEF.pedreira = () => {
  const b = new Construtor('pedreira', 22, 15, 1979);
  b.fundo = 'texturas/chao_pedreira';
  b.livre = { x: 2, y: 3, w: 18, h: 10 };
  b.inicio = { x: 4, y: 7 };
  b.saida(2, 7, 1, 2, 'vila', 44, 13);
  for (let x = 0; x <= b.larg; x += 2) {
    b.enfeite('objetos/rocha_mina_1', x, 1, false); b.enfeite('objetos/rocha_mina_1', x + 1, 2, false);
    b.enfeite('objetos/rocha_mina_1', x, b.alt - 2, false);
  }
  for (let y = 3; y < b.alt - 2; y++) { if (y < 7 || y > 8) b.enfeite('objetos/rocha_mina_1', 1, y, false); b.enfeite('objetos/rocha_mina_1', b.larg - 2, y, false); }
  const fechado = () => { abrirPlaca(escadaFechada()); return true; };
  const minaFechada = () => !!G.mina && !G.mina.aberta;
  b.interativo('escada_mina', 'objetos/escada_mina', 11, 8, 1, 1, [10, 6]).acao = () => (typeof entrarNaMina === 'function' && !minaFechada() ? entrarNaMina() : fechado());
  b.interativo('elevador_mina', 'objetos/elevador_mina', 6, 4, 2, 1, [28, 8]).acao = () => (typeof abrirElevador === 'function' && !minaFechada() ? abrirElevador() : fechado());
  b.paredesDaBorda();
  b.aoMontar = () => rochasDaEntrada(b);
  return b;
};
// (C12, 16/10; o teste crítico: "a escada fechada no dia 5 e aberta no 7, sem aviso") A escada fechada diz quando abre e por quê: o Seu
// Tonico arruma no domingo e manda carta (tonico_bancadas, mina_jogo.js); com a carta na caixa, é só ler. O elevador diz o mesmo.
function escadaFechada() {
  const c = G.correio;
  if (c && c.caixa.includes('tonico_bancadas')) return 'A escada está arrumada! A carta do Seu Tonico está na caixa de correio, no quintal: leia e pode descer.';
  // o domingo do dia da carta (ECO.guia.dias.mina: o guia entrega a carta; guia.js); passado ele, "logo" (o guia cede a outra carta)
  const dm = ECO.guia.dias.mina; let d = dm; while ((d - 1) % 7 !== 6) d++;
  const quando = G.dia >= dm ? 'nestes dias' : `no domingo, dia ${(d - 1) % 28 + 1}`;
  return `O Seu Tonico arruma a escada ${quando}: ele manda carta quando ficar pronta. Lá embaixo tem ferro pras ferramentas.`;
}
// As rochas comuns da entrada: 12 sorteadas pelo dia (refazem toda manhã).
function rochasDaEntrada(b) {
  for (const o of b.objs.filter(o => o.det === 'rocha' || o.det === 'ferro')) b.tirar(o);
  const f = mulberry(G.dia * 211 + 5);
  for (let k = 0, n = 0; k < 120 && n < 12; k++) {
    const x = b.livre.x + 2 + Math.floor(f() * (b.livre.w - 3)), y = b.livre.y + Math.floor(f() * b.livre.h);
    if (b.saidaEm(x, y) || (x <= b.inicio.x + 1 && Math.abs(y - b.inicio.y) <= 1)) continue;
    if (Math.abs(x - 10) <= 1 && Math.abs(y - 9) <= 1) continue;   // onde chega quem sobe das bancadas (mina_jogo.js)
    if (b.detrito(f() < 0.1 ? 'ferro' : 'rocha', x, y)) n++;
  }
}
// O Seu Tonico recebe o Jocelino no primeiro dia em que ele entra na pedreira.
function tonicoNaPedreira(b) {
  const ja = b.moradores.find(m => m.id === 'tonico');
  if (!G.diaPedreira) G.diaPedreira = G.dia;
  if (G.dia === G.diaPedreira && !ja) {
    const t = b.morador('tonico', 'Seu Tonico', 7, 7, DIR.ESQUERDA);
    t.aoConversar = () => { abrirConversa('Seu Tonico', urlArte('retratos/tonico_normal'), ['Pedra boa, essa! Vale na obra do Bira e na caixa de venda.', 'Lá embaixo tem ferro, mas a escada ainda está quebrada. Quando eu arrumar, te aviso.']); return true; };
  } else if (G.dia !== G.diaPedreira && ja) b.moradores = b.moradores.filter(m => m !== ja);
}
AO_ENTRAR_MAPA.push(id => { if (id === 'pedreira') tonicoNaPedreira(G.mapa); });
MANHA.push(() => { if (MAPAS.pedreira) rochasDaEntrada(MAPAS.pedreira); });
