// Jocelino — mapa_serra.js — a Mata da Serra (T3 da spec da mata e do sítio, 15/10): o mapa grande do outro lado da ponte da mata,
// a mata virgem do pé da Serra do Mar. Como é no Stardew (área de fora): a Floresta Secreta e as Montanhas — um mapa maior, uma
// trilha de terra que guia (entrada em cima, vinda da ponte; o fim, embaixo, na Cachoeira Grande) e os recantos para achar fora
// dela: o rancho do Nhô Quim, o jequitibá gigante, as clareiras feridas do palmiteiro, os poções do rio. Abre na manhã seguinte à
// 1ª vez que a ponte da mata é escorada (o serviço `escorar_ponte`, do Tio Juca), com a carta do Seu Lourival (mundo.js).
// Aqui nada se corta: o machado numa árvore dá o aviso da mata preservada (madeira, só no bosque da mata).
//
// O desenho (48×32, ladrilho de 48 px):
//   y 1      saída para a mata (x 24–25); y 2 a chegada (24, 2)
//   y 2–9    a trilha desce entre árvores, xaxins e bromélias; a placa da mata preservada; o RANCHO do Nhô Quim (x 31–35)
//   y 10–11  o rio da serra, com a PINGUELA (o tronco atravessado, x 24–25)
//   y 12–20  a trilha se abre em duas: a de oeste, pelo JEQUITIBÁ gigante; a de leste, pelas CLAREIRAS feridas
//   y 21–27  os POÇÕES do rio (dos dois lados); as duas trilhas descem até a beira do poço, uma de cada lado da queda
//   y 23–29  a CACHOEIRA GRANDE (x 22–25), o POÇO fundo na frente dela (y 27–29) e a LOCA (a pedra com a fresta, x 26–27); embaixo, a mata
//            (um ladrilho acima do que a spec desenhou: assim o poço fica à vista, acima da barra de ferramentas)

const SERRA = {
  LARG: 48, ALT: 32, SAIDA: { x: 24, y: 1, w: 2, h: 1 }, CHEGADA: { x: 24, y: 2 },
  RIO_Y: 10, RIO_ALTURA: 2,
  PINGUELA: { x: 24, y: 10, w: 2, h: 2 },                    // o tronco por cima do rio (chão de rio, mas se pisa)
  PINGUELA_TRONCO: { comprido: 4, largo: 1.5 },               // o tronco desenhado (ladrilhos): comprido no sentido da travessia
  PINGUELA_MARGEM: 0.45,                                      // quanto do tronco aparece em cada margem (as pontas cortadas somem na terra)
  // A trilha de terra, em pedaços (cada um { x, y, w, h }), da saída até a cachoeira.
  // Depois da pinguela ela se abre em duas: a de oeste passa pelo jequitibá e pelos poções e chega à beira esquerda do poço; a de
  // leste passa pelas clareiras e chega à loca. O meio, em cima do paredão, é mata.
  TRILHA: [{ x: 24, y: 0, w: 2, h: 10 }, { x: 24, y: 12, w: 2, h: 3 }, { x: 17, y: 15, w: 13, h: 2 }, { x: 17, y: 17, w: 2, h: 9 }, { x: 28, y: 17, w: 2, h: 10 }],
  RANCHO: { x: 31, y: 7, w: 5, h: 4 },                        // base (o ladrilho de baixo à esquerda), 5×4
  TERREIRO: { x: 26, y: 8, w: 10, h: 1 },                     // o caminho de terra da trilha até a porta do rancho
  PORTA: { x: 33, y: 8 },                                     // o ladrilho na frente da porta (o Nhô Quim na chuva: T6)
  JEQUITIBA: { x: 11, y: 18 },                                // o pé do gigante (a arte 4×6 em volta: x 9,5–13,5, y 13–18)
  RAMAL_JEQUITIBA: { x: 13, y: 18, w: 4, h: 1 },
  // As clareiras feridas (o palmiteiro cortou juçara): o chão de terra com os tocos; as `vagas` são onde se planta a muda (T6/T16).
  CLAREIRAS: [{ x: 30, y: 14, w: 5, h: 3, tocos: [[30, 14], [34, 16]] }, { x: 37, y: 18, w: 5, h: 3, tocos: [[37, 20], [41, 18]] }],
  // A clareira nova do arco do loteamento (T9, dia 3: a picada da turma do agrimensor): hoje é mata, sem enfeite sorteado em cima.
  CLAREIRA_NOVA: { x: 31, y: 21, w: 4, h: 3 },
  // O lugar da placa do arco (T9: a placa do "Jardim da Serra" e, depois, a de patrimônio), na entrada, à direita da trilha.
  PLACA_ARCO: { x: 27, y: 3 },
  PLACA: { x: 22, y: 3 },                                     // a placa da mata preservada (à esquerda da trilha)
  POCOES: [{ x: 5, y: 22, w: 3, h: 2 }, { x: 9, y: 25, w: 3, h: 2 }, { x: 37, y: 24, w: 3, h: 2 }, { x: 41, y: 22, w: 2, h: 2 }],
  CACHOEIRA: { x: 22, y: 28, w: 4, h: 6 },                    // o quadro 4×6 (pé na fileira 28); o desenho só ocupa x 22,7–25,3
  POCO: { x: 19, y: 27, w: 9, h: 3 },                         // o poço fundo, na frente da cachoeira (a pesca de fundo: T4); os cantos de cima (19 e 27, y 27) são beira
  LOCA: { x: 26, y: 26, w: 2, h: 2 },                         // base da pedra com a fresta (2×2), ao lado da cachoeira (T6)
  QUADRO_AGUA: 0.3,                                           // os 2 quadros da cachoeira se alternam a cada 0,3 s
};
const naSerraR = (r, x, y, folga = 0) => x >= r.x - folga && y >= r.y - folga && x < r.x + r.w + folga && y < r.y + r.h + folga;
// As árvores e plantas que o machado não corta (o aviso da mata preservada).
const SERRA_PRESERVADA = new Set(['objetos/arvore_mata', 'objetos/jequitiba', 'objetos/palmeira_jucara', 'objetos/xaxim']);
const FALA_PRESERVADA = 'Aqui é mata preservada. Madeira, só no bosque da mata.';
const FALA_TOCO_JUCARA = 'Toco de juçara: o palmiteiro cortou para tirar o palmito. A juçara não brota de novo — só replantando.';

MAPAS_DEF.serra = () => {
  const S = SERRA, b = new Construtor('serra', S.LARG, S.ALT, 2604);
  b.livre = { x: 2, y: 1, w: S.LARG - 4, h: 29 };
  b.inicio = { x: S.CHEGADA.x, y: S.CHEGADA.y };
  b.saida(S.SAIDA.x, S.SAIDA.y, S.SAIDA.w, S.SAIDA.h, 'mata', 26, 21);
  // O chão: a trilha, o terreiro do rancho, o ramal do jequitibá e as clareiras (terra).
  for (const r of S.TRILHA.concat([S.TERREIRO, S.RAMAL_JEQUITIBA], S.CLAREIRAS)) b.pinta(r.x, r.y, r.w, r.h, CH.TERRA);
  // O rio da serra atravessa o mapa; na trilha, a pinguela (o chão é de rio, mas não bloqueia: o pé vai no tronco).
  b.agua(0, S.RIO_Y, S.PINGUELA.x, S.RIO_ALTURA, CH.RIO);
  b.agua(S.PINGUELA.x + S.PINGUELA.w, S.RIO_Y, b.larg - S.PINGUELA.x - S.PINGUELA.w, S.RIO_ALTURA, CH.RIO);
  b.pinta(S.PINGUELA.x, S.RIO_Y, S.PINGUELA.w, S.RIO_ALTURA, CH.RIO);
  for (const p of S.POCOES) b.agua(p.x, p.y, p.w, p.h, CH.RIO);
  b.agua(S.POCO.x + 1, S.POCO.y, S.POCO.w - 2, 1, CH.RIO); b.agua(S.POCO.x, S.POCO.y + 1, S.POCO.w, S.POCO.h - 1, CH.RIO);   // (o canto de cima arredondado)
  // A pinguela: o tronco caído da mata deitado de margem a margem, no sentido da travessia (a arte é deitada de lado: o código só gira,
  // alonga e recorta). Girado, a ponta cortada do tronco virava um "toco em pé" (rodada 1 da revisão): o tronco fica comprido e fino
  // (PINGUELA_TRONCO, em ladrilhos) e as duas pontas entram na terra das margens (o recorte para a PINGUELA_MARGEM além do rio).
  b.desenhaChao = ctx => {
    // A água da cachoeira mexe: os 2 quadros se alternam (só troca a arte do enfeite). Antes de tudo: não depende do tronco carregar.
    if (cach) cach.nome = 'objetos/cachoeira_grande_' + (1 + Math.floor((G.agora || 0) / S.QUADRO_AGUA) % 2);
    const img = spr('objetos/tronco_caido'); if (!img) return;
    const P = S.PINGUELA, T = S.PINGUELA_TRONCO, cx = (P.x + P.w / 2) * TILE, cy = (P.y + P.h / 2) * TILE, m = S.PINGUELA_MARGEM * TILE;
    ctx.save();
    ctx.beginPath(); ctx.rect(P.x * TILE - TILE, P.y * TILE - m, (P.w + 2) * TILE, P.h * TILE + 2 * m); ctx.clip();
    ctx.translate(cx, cy); ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -T.comprido * TILE / 2, -T.largo * TILE / 2, T.comprido * TILE, T.largo * TILE);
    ctx.restore();
  };
  // ---- A Cachoeira Grande: o quadro é de 4 ladrilhos, o desenho é a coluna do meio. O pé (o paredão) bloqueia só no miolo; o poço
  // embaixo é água (pesca de fundo). Os ladrilhos do paredão ficam ocupados (nada nasce escondido atrás da água).
  const C = S.CACHOEIRA, cach = b.enfeite('objetos/cachoeira_grande_1', C.x + 1, C.y, false);
  cach.x = (C.x + C.w / 2) * TILE;
  cach.serra = 'cachoeira';
  const paredao = { x: (C.x + 0.75) * TILE, y: (C.y - 5 + 0.4) * TILE, w: 2.5 * TILE, h: 3.6 * TILE };
  b.solidos.push(paredao);
  for (let y = C.y - 5; y < S.POCO.y; y++) for (let x = C.x; x < C.x + C.w; x++) b.ocupado.set(chaveT(x, y), cach);
  // A loca: a pedra com a fresta, colada no paredão (o botão direito é da T6: abrirLoca; sem ela, a pedra só se olha).
  const L = S.LOCA, loca = b.interativo('loca_entrada', 'objetos/loca_entrada', L.x, L.y, L.w, L.h, [28, 20]);
  loca.acao = () => typeof abrirLoca === 'function' ? abrirLoca() : (abrirPlaca('Uma pedra grande, de musgo, colada na queda d\'água. Tem uma fresta escura no meio... Lá dentro é fundo: sem uma escada de corda, não dá para descer.'), true);
  // ---- O rancho do Nhô Quim (pau a pique): o botão direito é da T6 (acaoDoRancho); sem ela, só a descrição.
  const R = S.RANCHO, rancho = b.interativo('rancho_mateiro', 'objetos/rancho_mateiro', R.x, R.y, R.w, R.h);
  rancho.acao = () => typeof acaoDoRancho === 'function' ? acaoDoRancho() : (abrirPlaca('Um rancho de pau a pique com telhado de sapé, no meio da mata. A porta está encostada: aqui mora o mateiro da serra, o Nhô Quim.'), true);
  // ---- A placa da mata preservada, na entrada.
  const placa = b.interativo('placa_serra', 'objetos/placa_mata_preservada', S.PLACA.x, S.PLACA.y, 1, 1, [16, 8]);
  placa.acao = () => { abrirPlaca('Mata da Serra. Mata virgem, do pé da Serra do Mar. Aqui não se corta árvore nenhuma: madeira, só no bosque da mata.'); return true; };
  // ---- O jequitibá gigante (o marco do mapa; o oco do tronco é o mel de jataí da T5).
  const jeq = b.enfeite('objetos/jequitiba', S.JEQUITIBA.x, S.JEQUITIBA.y, true, 30, 12);
  jeq.serra = 'jequitiba';
  // ---- As clareiras feridas: os tocos de juçara nas bordas (o resto é vaga de muda).
  S.CLAREIRAS.forEach((c, i) => c.tocos.forEach(([x, y], k) => { const t = b.enfeite('objetos/toco_' + (1 + (i + k) % 2), x, y, false); t.aviso = FALA_TOCO_JUCARA; t.serra = 'toco'; b.ocupado.set(chaveT(x, y), t); }));
  // ---- As bordas de árvores (abertura na saída de cima, x 24–25; embaixo do poço, só plantas baixas).
  for (let x = 0; x <= b.larg; x += 2) {
    if (x < S.SAIDA.x - 2 || x > S.SAIDA.x + S.SAIDA.w + 1) b.enfeite('objetos/arvore_mata', x, 1, false);
    if (x < S.POCO.x - 1 || x > S.POCO.x + S.POCO.w) b.enfeite('objetos/arvore_mata', x, b.alt - 1, false);   // (embaixo do poço, nada alto: a copa taparia a água)
    else if (x % 4 === 0) b.enfeite('objetos/samambaia', x, b.alt - 2, false); else b.enfeite('objetos/bromelia', x, b.alt - 2, false);
  }
  for (let y = 3; y < b.alt - 1; y += 2) { b.enfeite('objetos/arvore_mata', 0, y, false); b.enfeite('objetos/arvore_mata', b.larg - 1, y, false); }
  // Os de fora da área livre (y 1 e as fileiras de baixo) só enfeitam; dentro da área livre, a árvore da borda de cima bloqueia o pé.
  for (const o of b.objs.filter(o => o.tipo === 'enfeite' && o.nome === 'objetos/arvore_mata' && Math.floor(o.y / TILE) - 1 === 1)) {
    o.solido = true; o.caixa = b._caixa(o.x, o.y, 42, 24); b.solidos.push(o.caixa); b.ocupado.set(chaveT(Math.floor(o.x / TILE), 1), o); }
  // ---- Os enfeites fixos: a trilha desce entre árvores, xaxins, bromélias e samambaias; juçaras na beira do rio; o recanto dos poções.
  for (const t of [[20, 4], [29, 4], [19, 8], [14, 5], [39, 6], [8, 4], [44, 13], [6, 15], [15, 26], [32, 27], [42, 27], [3, 19], [22, 21], [25, 19], [21, 18]]) b.enfeite('objetos/arvore_mata', t[0], t[1], true, 14);
  for (const t of [[21, 7], [27, 6], [16, 13], [36, 12], [13, 22], [33, 25], [20, 25], [27, 23], [24, 21]]) b.enfeite('objetos/xaxim', t[0], t[1], true, 14, 10);
  for (const t of [[21, 13], [28, 13], [9, 9], [35, 9], [43, 17], [4, 25], [14, 28], [33, 22], [21, 23], [26, 20]]) b.enfeite('objetos/palmeira_jucara', t[0], t[1], true, 8);
  for (const t of [[23, 5], [26, 4], [22, 9], [27, 9], [19, 13], [16, 18], [20, 17], [27, 18], [8, 21], [12, 24], [36, 23], [40, 25], [30, 27], [43, 21], [23, 22], [20, 22]]) b.enfeite('objetos/bromelia', t[0], t[1], false);
  for (const t of [[23, 3], [26, 7], [23, 12], [26, 13], [20, 20], [16, 23], [30, 21], [19, 27], [27, 27], [7, 24], [38, 21], [10, 13], [26, 22], [21, 24]]) b.enfeite('objetos/samambaia', t[0], t[1], false);
  // As pedras do rio, na beira dos poções (não se tiram: pedra, só na pedreira e na beira do rio da mata).
  for (const t of [[8, 23], [4, 22], [12, 26], [40, 24], [36, 25]]) { const o = b.enfeite('objetos/pedregulho', t[0], t[1], true, 26, 12); o.serra = 'pedra'; }
  // ---- O mato da serra (sorteio sempre igual): fora da trilha e da água (e de um ladrilho em volta), dos recantos e das vagas.
  const usados = new Set(), perto = (x, y) => { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (b.chaoEm(x + dx, y + dy) !== CH.GRAMA) return true; return false; };
  const recantos = [{ x: R.x - 1, y: R.y - 4, w: R.w + 2, h: 6 }, { x: 8, y: 12, w: 8, h: 8 }, { x: C.x - 3, y: C.y - 11, w: C.w + 6, h: 13 }, S.CLAREIRA_NOVA,
    { x: S.PLACA.x - 1, y: S.PLACA.y - 1, w: 2, h: 2 }, { x: S.PLACA_ARCO.x - 1, y: S.PLACA_ARCO.y - 1, w: 3, h: 2 }, { x: 20, y: 1, w: 10, h: 3 }];
  for (let k = 0; k < 520; k++) {
    const x = 3 + Math.floor(b.rng() * (b.larg - 6)), y = 2 + Math.floor(b.rng() * (b.alt - 4)), r = b.rng();
    if (y > 29 || perto(x, y) || recantos.some(q => naSerraR(q, x, y)) || S.CLAREIRAS.some(q => naSerraR(q, x, y, 1))) continue;
    if (b.ocupado.has(chaveT(x, y)) || usados.has(chaveT(x, y)) || b.objs.some(o => o.tipo === 'enfeite' && Math.abs(Math.floor(o.x / TILE) - x) <= (o.nome === 'objetos/jequitiba' ? 2 : 0) && Math.floor(o.y / TILE) - 1 === y)) continue;
    const vizinho = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => usados.has(chaveT(x + dx, y + dy)) || b.ocupado.has(chaveT(x + dx, y + dy)));
    if (r < 0.42 && !vizinho) b.enfeite('objetos/arvore_mata', x, y, true, 14);
    else if (r < 0.55 && !vizinho) b.enfeite('objetos/palmeira_jucara', x, y, true, 8);
    else if (r < 0.62 && !vizinho) b.enfeite('objetos/xaxim', x, y, true, 14, 10);
    else if (r < 0.82) b.enfeite('objetos/bromelia', x, y, false);
    else b.enfeite('objetos/samambaia', x, y, false);
    usados.add(chaveT(x, y));
  }
  // Nenhum canto fechado: a árvore sorteada que deixa ladrilho livre sem caminho até a entrada sai (o sorteio é fixo: sai sempre a mesma).
  // (o mesmo critério da vistoria dos mapas, a s2: o pé no meio do ladrilho, com as paredes da borda)
  b.paredesDaBorda();
  const anda = (x, y) => b.livreEm(x, y) && !bate({ x: (x + 0.5) * TILE - 14, y: y * TILE + 30, w: 28, h: 14 }, b);
  for (let volta = 0; volta < 30; volta++) {
    const vis = new Set([chaveT(b.inicio.x, b.inicio.y)]), fila = [[b.inicio.x, b.inicio.y]], presos = [];
    while (fila.length) { const [cx, cy] = fila.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = chaveT(cx + dx, cy + dy); if (!vis.has(k) && anda(cx + dx, cy + dy)) { vis.add(k); fila.push([cx + dx, cy + dy]); } } }
    for (let y = b.livre.y; y < b.livre.y + b.livre.h; y++) for (let x = b.livre.x; x < b.livre.x + b.livre.w; x++) if (!vis.has(chaveT(x, y)) && anda(x, y)) presos.push([x, y]);
    if (!presos.length) break;
    const [px, py] = presos[0], o = b.objs.filter(o => o.tipo === 'enfeite' && o.solido && usados.has(chaveT(Math.floor(o.x / TILE), Math.floor(o.y / TILE) - 1)))
      .sort((p, q) => Math.hypot(p.x - (px + 0.5) * TILE, p.y - (py + 1) * TILE) - Math.hypot(q.x - (px + 0.5) * TILE, q.y - (py + 1) * TILE))[0];
    if (!o) break;
    b.tirar(o);
  }
  for (const o of b.objs) if (o.tipo === 'enfeite' && SERRA_PRESERVADA.has(o.nome)) o.preservada = true;
  return b;
};

// ---------- o golpe nas coisas da serra ----------
// O machado numa árvore (ou no xaxim, na juçara, no jequitibá): a árvore treme e vem o aviso; nada sai. A picareta nas pedras do rio e
// qualquer ferramenta no toco de juçara também explicam. (Envolve o acertarUm de ferramentas.js, como o correio envolve o desenhaMapa.)
// `vistos` é o conjunto do golpe (acertar, em ferramentas.js): no golpe em área (a pá, o regador reforçados) cada coisa treme uma vez e o
// aviso sai uma vez só por golpe. Sem `vistos` (uma chamada solta), vale como um golpe.
const _AVISO_DO_GOLPE = Symbol('aviso da serra');
function golpeNaSerra(id, alvo, vistos) {
  if (G.mapaId !== 'serra' || !G.mapa || !alvo) return false;
  const o = G.mapa.ocupado.get(chaveT(alvo.x, alvo.y));
  if (!o || o.tipo !== 'enfeite') return false;
  const pesada = ['machado', 'picareta', 'pa'].includes(id);
  const r = o.preservada && id === 'machado' ? { treme: 0.3, som: 'madeira', fala: FALA_PRESERVADA }
    : o.serra === 'toco' && pesada ? { treme: 0.25, som: 'madeira', fala: FALA_TOCO_JUCARA }
    : o.serra === 'pedra' && id === 'picareta' ? { treme: 0.25, som: 'pedra', fala: 'Pedra do rio fica no rio. Pedra, só na pedreira e na beira do rio da mata.' } : null;
  if (!r) return false;
  if (vistos && vistos.has(o)) return true;   // (a mesma coisa em dois ladrilhos do golpe)
  if (vistos) vistos.add(o);
  o.treme = r.treme;
  if (vistos && vistos.has(_AVISO_DO_GOLPE)) return true;
  if (vistos) vistos.add(_AVISO_DO_GOLPE);
  sons.tocar(r.som, r.som === 'pedra' ? 1.4 : 1.5, 0.05, -8); avisar(r.fala);
  return true;
}
// O envoltório repassa todos os argumentos ao acertarUm de ferramentas.js (hoje id, alvo, vistos; amanhã o que vier).
{ const _acertarUm = acertarUm; acertarUm = function (...args) { if (golpeNaSerra(args[0], args[1], args[2])) return; return _acertarUm.apply(this, args); }; }

// ---------- a primeira vez (toda 1ª vez tem seta + frase no lugar exato; some depois de feita uma vez) ----------
// Na mata, com a serra aberta e nunca visitada: a seta na saída de baixo. Na serra, até chegar à Cachoeira Grande: primeiro a pinguela,
// depois o fim da trilha, na beira do poço. (guia_setas.js chama as duas: alvoDaSerra na frente, alvoDaSerraNaMata sem outra seta.)
const FALA_SERRA_MATA = 'A ponte está firme: por aqui, a trilha da Mata da Serra';
const FALA_SERRA_PINGUELA = 'A pinguela: atravesse o rio pelo tronco e siga a trilha de terra';
const FALA_SERRA_CACHOEIRA = 'Siga a trilha de terra até o fim: a Cachoeira Grande';
const PONTO_CACHOEIRA = { x: 20 * TILE, y: 26.5 * TILE };   // a beira esquerda do poço, no fim da trilha de oeste
function alvoDaSerraNaMata() {
  if (G.mapaId !== 'mata' || !G.limpou || G.limpou.serra_entrou || typeof Mundo === 'undefined' || !Mundo.aberto('serra')) return null;
  return { mapa: 'mata', ponto: { x: 27 * TILE, y: 22 * TILE }, rotuloFixo: FALA_SERRA_MATA };
}
function alvoDaSerra() {
  if (G.mapaId !== 'serra' || !G.jog || !G.limpou || G.limpou.serra_cachoeira) return null;
  const t = G.jog.ladrilho(), P = SERRA.PINGUELA;
  if (t.y < P.y) return { mapa: 'serra', ponto: { x: (P.x + P.w / 2) * TILE, y: P.y * TILE - 6 }, rotuloFixo: FALA_SERRA_PINGUELA };
  return { mapa: 'serra', ponto: { x: PONTO_CACHOEIRA.x, y: PONTO_CACHOEIRA.y - 30 }, rotuloFixo: FALA_SERRA_CACHOEIRA };
}
// Chegou à cachoeira: a seta some para sempre (G.limpou vai no save).
ATUALIZADORES.push(() => {
  if (G.mapaId !== 'serra' || !G.jog || !G.limpou || G.limpou.serra_cachoeira) return;
  if (Math.hypot(G.jog.x - PONTO_CACHOEIRA.x, G.jog.y - PONTO_CACHOEIRA.y) < 3 * TILE) { G.limpou.serra_cachoeira = 1; avisar('A Cachoeira Grande! O poço da frente é fundo: peixe grande mora aí.'); }
});
AO_ENTRAR_MAPA.push(id => {
  if (id !== 'serra' || !G.limpou) return;
  if (!G.limpou.serra_entrou) { G.limpou.serra_entrou = 1; avisar('A Mata da Serra: mata virgem, do pé da Serra do Mar.'); }
});
// A linha da Caderneta (a caderneta.js carrega depois): enquanto a serra aberta não foi conhecida até a cachoeira.
addEventListener('load', () => {
  if (typeof CADERNETA === 'undefined') return;
  CADERNETA.push(() => {
    if (typeof Mundo === 'undefined' || !Mundo.aberto('serra') || !G.limpou || G.limpou.serra_cachoeira) return [];
    return [{ id: 'serra_conhecer', aba: 'vila', texto: 'A Mata da Serra abriu: atravesse a ponte da mata e siga a trilha até a Cachoeira Grande',
      alvo: () => G.mapaId === 'serra' ? alvoDaSerra() : G.mapaId === 'mata' ? { mapa: 'mata', ponto: { x: 27 * TILE, y: 22 * TILE } } : { mapa: 'mata' } }];
  });
});
