// Jocelino — mapa_quintal.js — o quintal do Tio Juca (jogo/mundo/mapa_quintal.gd): a casa (dormir), o rádio, o
// fogão da Rosa, a caixa de correio e a de venda, o terreno marcado da casa da família, mato, galho e pedra para
// tirar (sorteados sempre do mesmo jeito) e a saída para a Vila.

const QUINTAL = { ZONA_LIMPA: { x: 3, y: 3, w: 13, h: 12 }, TERRENO: { x: 18, y: 6, w: 8, h: 6 }, SAIDA: { x: 20, y: 27, w: 2, h: 1 }, CANTEIRO: { x: 3, y: 15, w: 5, h: 3 } };
const dentroR = (r, x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;

MAPAS_DEF.quintal = () => {
  const b = new Construtor('quintal', 40, 30, 1975);
  b.livre = { x: 2, y: 3, w: 36, h: 25 };
  b.inicio = { x: 7, y: 10 };
  b.saida(20, 27, 2, 1, 'vila', 23, 3);
  b.pinta(7, 9, 2, 5); b.pinta(7, 12, 15, 2); b.pinta(20, 12, 2, 18);      // até a borda de baixo (a Vila continua do outro lado)
  // Bordas: árvores e arbustos em volta (abertura embaixo, na saída).
  for (let x = 0; x <= b.larg; x += 2) {
    b.enfeite('objetos/arvore', x, 1, false); b.enfeite('objetos/arvore', x + 1, 2, false);
    if (x < QUINTAL.SAIDA.x - 2 || x > QUINTAL.SAIDA.x + QUINTAL.SAIDA.w) { b.enfeite('objetos/arvore', x, b.alt - 1, false); b.enfeite('objetos/arbusto_' + (1 + x % 3), x + 1, b.alt - 2, false); }
  }
  for (let y = 3; y < b.alt - 1; y += 2) {
    b.enfeite('objetos/arvore', 0, y, false); b.enfeite('objetos/arvore', b.larg - 1, y, false);
    b.enfeite('objetos/arbusto_' + (1 + y % 3), 1, y + 1, false); b.enfeite('objetos/arbusto_' + (1 + (y + 1) % 3), b.larg - 2, y + 1, false);
  }
  const casa = b.interativo('casa_juca', 'objetos/casa_juca', 5, 8, 5, 5);
  casa.acao = () => (typeof pedirDormir === 'function' ? pedirDormir() : abrirPlaca('A casa do Tio Juca.'));
  const radio = b.interativo('radio', 'objetos/radio', 10, 8, 1, 1, [10, 6]);
  radio.acao = () => { abrirPlaca(typeof previsaoDoRadio === 'function' ? previsaoDoRadio() : 'O rádio chia: "...amanhã, tempo bom em toda a Baixada Santista."'); };
  const fogao = b.interativo('fogao_lenha', 'objetos/fogao_lenha', 3, 9, 1, 1, [14, 8]);
  fogao.acao = () => abrirPlaca('O fogão a lenha da Rosa. Cheirinho de feijão no fogo.');
  const correio = b.interativo('caixa_correio', 'objetos/caixa_correio', 12, 9, 1, 1, [8, 6]);
  correio.acao = () => (typeof abrirCorreio === 'function' ? abrirCorreio() : abrirPlaca('A caixa de correio está vazia.'));
  const cx = b.interativo('caixa_venda', 'objetos/caixa_venda', 14, 10, 1, 1, [12, 7]);
  cx.acao = () => (typeof usarCaixaVenda === 'function' ? usarCaixaVenda() : abrirPlaca('A caixa de venda: o carroceiro passa de madrugada.'));
  b.enfeite('objetos/mangueira', 13, 6, true, 14);
  b.enfeite('objetos/coqueiro', 3, 7, true, 10);
  b.enfeite('objetos/arbusto_1', 11, 8, false);
  b.enfeite('objetos/arbusto_2', 4, 4, false);
  // O terreno marcado da casa da família (a obra vem na fase 2): bandeirinhas nos cantos e a plaquinha.
  const T = QUINTAL.TERRENO;
  for (const c of [[T.x - 1, T.y - 1], [T.x + T.w, T.y - 1], [T.x - 1, T.y + T.h], [T.x + T.w, T.y + T.h]]) b.enfeite('objetos/bandeirinha', c[0], c[1], false);
  const pl = b.interativo('plaquinha', 'objetos/plaquinha', T.x - 1, T.y + 3, 1, 1, [8, 6]);
  pl.acao = () => abrirPlaca('O terreno da casa da família. "Um dia a gente levanta aqui a nossa casa", diz o Tio Juca.');
  // O barril d'água da chuva, ao lado do canteiro da horta (enche o regador).
  const barril = b.interativo('barril_agua', 'objetos/barril_agua', 9, 16, 1, 1, [16, 10]);
  barril.acao = () => (typeof encherRegador === 'function' ? encherRegador() : abrirPlaca('O barril d\'água da chuva.'));
  // Detritos sorteados (sempre os mesmos: semente 1975).
  const sorteio = [['mato', 0.20], ['pedra', 0.06], ['galho', 0.05], ['toco', 0.015], ['arvore', 0.02], ['pedregulho', 0.008]];
  for (let y = b.livre.y; y < b.livre.y + b.livre.h; y++) for (let x = b.livre.x; x < b.livre.x + b.livre.w; x++) {
    let r = b.rng();
    if (dentroR(QUINTAL.ZONA_LIMPA, x, y) || dentroR(QUINTAL.CANTEIRO, x, y) || b.ocupado.has(chaveT(x, y)) || b.chaoEm(x, y) !== CH.GRAMA) continue;
    if (dentroR(QUINTAL.TERRENO, x, y)) r *= 0.55;
    for (const [tipo, p] of sorteio) {
      if (r < p) {
        if (tipo === 'arvore' && (pertoDeArvore(b, x, y) || copaNoCaminho(b, x, y))) break;
        b.detrito(tipo, x, y);
        break;
      }
      r -= p;
    }
  }
  b.morador('juca', 'Tio Juca', 10, 10, DIR.ESQUERDA);
  b.morador('rosa', 'Rosa', 4, 10, DIR.DIREITA);
  b.morador('zezinho', 'Zezinho', 6, 13, DIR.BAIXO, { vagueia: true, area: { x: 3 * TILE, y: 10 * TILE, w: 11 * TILE, h: 4 * TILE } });
  b.morador('ritinha', 'Ritinha', 12, 12, DIR.BAIXO, { vagueia: true, area: { x: 9 * TILE, y: 10 * TILE, w: 6 * TILE, h: 4 * TILE } });
  b.paredesDaBorda();
  return b;
};
// A copa da árvore sobe uns 3 ladrilhos e abre para os lados: nada de árvore cobrindo o caminho.
function copaNoCaminho(b, x, y) { for (let dy = -3; dy <= 0; dy++) for (let dx = -1; dx <= 1; dx++) if (b.chaoEm(x + dx, y + dy) !== CH.GRAMA) return true; return false; }
function pertoDeArvore(b, x, y) { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const o = b.ocupado.get(chaveT(x + dx, y + dy)); if (o && o.det === 'arvore') return true; } return false; }
