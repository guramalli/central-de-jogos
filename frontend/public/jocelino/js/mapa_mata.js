// Jocelino — mapa_mata.js — a mata (jogo/mundo/mapa_mata.gd, a floresta do Stardew): a trilha da Vila, o rio (y 17–18)
// com a ponte (x 26), a cachoeira e o poço a oeste, a clareira escondida atrás do tronco caído (com os tocos de
// madeira de lei, que pedem machado melhor: etapa 5) e a carroça do mascate às sextas e domingos.

const MATA = { RIO_Y: 17, RIO_ALTURA: 2, PONTE_X: 26, CLAREIRA: { x: 2, y: 2, w: 10, h: 8 }, TRONCO: { x: 6, y: 10 },
  TOCOS: [[3, 4], [8, 3], [4, 7], [9, 6]] };
const naClareira = (x, y, folga = 0) => { const c = MATA.CLAREIRA; return x >= c.x - folga && y >= c.y - folga && x < c.x + c.w + folga && y < c.y + c.h + folga; };

MAPAS_DEF.mata = () => {
  const b = new Construtor('mata', 44, 26, 1500);
  b.livre = { x: 2, y: 2, w: 40, h: 22 };
  b.inicio = { x: 39, y: 13 };
  b.saida(41, 12, 1, 3, 'vila', 3, 13);
  const { RIO_Y, RIO_ALTURA, PONTE_X, TRONCO } = MATA;
  b.pinta(14, 12, 29, 2, CH.TERRA);                 // a trilha da Vila até a mata fechada
  b.pinta(PONTE_X, 14, 2, 3, CH.TERRA);             // o caminho até a ponte
  b.pinta(PONTE_X, RIO_Y + RIO_ALTURA, 2, 2, CH.TERRA);
  // O rio, com a ponte (chão de tábuas por cima da água, andável).
  b.agua(0, RIO_Y, PONTE_X, RIO_ALTURA, CH.RIO);
  b.agua(PONTE_X + 2, RIO_Y, b.larg - PONTE_X - 2, RIO_ALTURA, CH.RIO);
  b.pinta(PONTE_X, RIO_Y, 2, RIO_ALTURA, CH.RIO);
  b.desenhaChao = ctx => { const img = spr('objetos/pier'); if (img) ctx.drawImage(img, PONTE_X * TILE, (RIO_Y - 1) * TILE + 12, 2 * TILE, (RIO_ALTURA + 2) * TILE); };
  b.enfeite('objetos/cachoeira', 4, RIO_Y + 1, false);
  // Bordas de árvores (abertura na saída leste, y 11..15).
  for (let x = 0; x <= b.larg; x += 2) { b.enfeite('objetos/arvore_mata', x, 1, false); b.enfeite('objetos/arvore_mata', x, b.alt - 1, false); }
  for (let y = 2; y < b.alt - 1; y += 2) { b.enfeite('objetos/arvore_mata', 0, y, false); if (y < 11 || y > 15) b.enfeite('objetos/arvore_mata', b.larg - 1, y, false); }
  // A clareira: cercada de árvores, com a passagem atrás do tronco caído.
  const C = MATA.CLAREIRA;
  for (let y = C.y; y <= C.y + C.h; y++) b.enfeite('objetos/arvore_mata', C.x + C.w, y, true, 16, 12);
  for (let x = C.x; x < C.x + C.w; x++) if (x < TRONCO.x || x > TRONCO.x + 1) b.enfeite('objetos/arvore_mata', x, C.y + C.h, true, 16, 12);
  b.enfeite('objetos/jabuticabeira', 5, 3, true, 14);
  const tronco = b.interativo('tronco_caido', 'objetos/tronco_caido', TRONCO.x, TRONCO.y, 2, 1, [32, 10]);
  const pedeMachado = () => { abrirPlaca('Um tronco enorme, caído atravessando a trilha. Atrás dele dá para ver uma clareira... Precisa de um machado mais forte (o Seu Tonico melhora).'); return true; };
  tronco.acao = pedeMachado;
  tronco.ferramenta = (o, id) => { if (id === 'machado') { o.treme = 0.25; sons.tocar('madeira', 1.6, 0.05, -8); avisar('O machado nem entra! Precisa de um machado mais forte (o Seu Tonico melhora).'); } };
  // Enfeites fixos e o mato da mata (sorteio sempre igual).
  for (const t of [[16, 4], [22, 7], [34, 4], [38, 9], [18, 21], [33, 22], [12, 21], [39, 20]]) b.enfeite('objetos/palmeira_jucara', t[0], t[1], true, 8);
  for (const t of [[20, 5], [30, 3], [36, 15], [15, 15], [23, 22], [8, 21], [37, 7], [3, 9]]) b.enfeite('objetos/bromelia', t[0], t[1], false);
  for (const t of [[25, 5], [31, 21], [17, 9]]) b.enfeite('objetos/arvore_mata', t[0], t[1], true, 14);
  const usados = new Set();
  for (let k = 0; k < 260; k++) {
    const x = 3 + Math.floor(b.rng() * (b.larg - 7)), y = 3 + Math.floor(b.rng() * (b.alt - 6)), r = b.rng();
    if (naClareira(x, y, 1) || (y >= 10 && y <= 15) || (y >= RIO_Y - 1 && y <= RIO_Y + RIO_ALTURA)) continue;
    if (b.chaoEm(x, y) !== CH.GRAMA || b.ocupado.has(chaveT(x, y)) || usados.has(chaveT(x, y)) || (x >= PONTE_X - 1 && x <= PONTE_X + 2)) continue;
    if (x >= 27 && x < 33 && y >= 7 && y < 11) continue;      // o lugar da carroça do mascate
    const vizinho = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => usados.has(chaveT(x + dx, y + dy)));
    if (r < 0.45 && !vizinho) b.enfeite('objetos/arvore_mata', x, y, true, 14);
    else if (r < 0.6 && !vizinho) b.enfeite('objetos/palmeira_jucara', x, y, true, 8);
    else if (r < 0.85) b.enfeite('objetos/bromelia', x, y, false);
    else b.enfeite('objetos/arbusto_' + (1 + k % 3), x, y, false);
    usados.add(chaveT(x, y));
  }
  // A clareira é escondida de propósito: só se entra depois que o tronco cair (etapa 5, machado melhor).
  b.trancadas = [{ x: C.x, y: C.y, w: C.w, h: C.h }];
  b.paredesDaBorda();
  b.aoMontar = () => { for (const [x, y] of MATA.TOCOS) if (!b.ocupado.has(chaveT(x, y))) b.detrito('toco_lei', x, y); };
  return b;
};

// ---------- o mascate ----------
// A carroça itinerante do Stardew: sextas e domingos, 3 itens do dia com preço de 0,9 a 1,3 vez o normal.
const MASCATE_ITENS = ['semente_tomate', 'semente_milho', 'semente_abobora', 'cafe', 'pao', 'leite_coco', 'dende', 'linguica', 'carne_seca', 'garrafa_antiga'];
const Mascate = {
  vem(dia) { const wd = (dia - 1) % 7; return wd === 4 || wd === 6; },
  precoBase(id) { return (LOJA.PRECOS && LOJA.PRECOS[id]) || (typeof ENCOMENDA !== 'undefined' && ENCOMENDA[id]) || 10; },
  doDia(dia) {
    const f = mulberry(dia * 4111), pool = MASCATE_ITENS.slice(), r = [];
    while (r.length < 3 && pool.length) { const id = pool.splice(Math.floor(f() * pool.length), 1)[0]; r.push({ id, preco: Math.max(1, Math.round(Mascate.precoBase(id) * (0.9 + f() * 0.4))) }); }
    return r;
  },
};
function poeMascate(b) {
  const car = b.objs.find(o => o.id === 'mascate'), vem = Mascate.vem(G.dia);
  if (vem && !car) b.interativo('mascate', 'objetos/carroca_mascate', 29, 9, 4, 2, [56, 18]).acao = () => abrirMascate();
  else if (!vem && car) b.tirar(car);
}
AO_MONTAR.push(b => { if (b.id === 'mata') poeMascate(b); });
AO_ENTRAR_MAPA.push(id => { if (id === 'mata') poeMascate(G.mapa); });
function abrirMascate() {
  const caixa = el('div', { class: 'painel orelhao' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'A carroça do mascate'),
      el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:8px' }, 'Só às sextas e domingos, na mata. O que ele traz muda a cada vez.'));
    const grade = el('div', { class: 'orel-grade' });
    for (const it of Mascate.doDia(G.dia)) grade.append(el('div', { class: 'orel-item' }, el('img', { src: urlItem(it.id) }),
      el('div', {}, el('b', {}, Itens.nome(it.id)), el('div', { class: 'orel-preco' }, `Cr$ ${it.preco}`)),
      el('div', { class: 'orel-bts' }, el('button', { class: 'botao', onclick: e => { e.stopPropagation();
        if (G.dinheiro < it.preco) { avisar('Não dá: falta dinheiro.'); return; }
        if (!G.mochila.cabe(it.id)) { avisar('A mochila está cheia.'); return; }
        G.dinheiro -= it.preco; G.gastoHoje += it.preco; G.mochila.adicionar(it.id, 1); sons.tocar('moedas', 1, 0.05, -6); hudSujo(); desenha(); } }, '+1'))));
    caixa.append(grade, el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:10px' },
      el('div', { style: 'font-weight:900' }, `Cr$ ${G.dinheiro}`), el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Até mais!')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 0.9, 0.03, -6);
  return true;
}
