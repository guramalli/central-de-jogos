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
  b.saida(MATA.PONTE_X, 23, 2, 1, 'serra', SERRA.CHEGADA.x, SERRA.CHEGADA.y);   // (T3) a trilha depois da ponte desce até a Mata da Serra
  const { RIO_Y, RIO_ALTURA, PONTE_X, TRONCO } = MATA;
  b.pinta(14, 12, 29, 2, CH.TERRA);                 // a trilha da Vila até a mata fechada
  b.pinta(PONTE_X, 14, 2, 3, CH.TERRA);             // o caminho até a ponte
  b.pinta(PONTE_X, RIO_Y + RIO_ALTURA, 2, b.alt - RIO_Y - RIO_ALTURA, CH.TERRA);   // (T3) a trilha continua até a borda de baixo: a saída da serra
  // O rio, com a ponte (chão de tábuas por cima da água, andável).
  b.agua(0, RIO_Y, PONTE_X, RIO_ALTURA, CH.RIO);
  b.agua(PONTE_X + 2, RIO_Y, b.larg - PONTE_X - 2, RIO_ALTURA, CH.RIO);
  b.pinta(PONTE_X, RIO_Y, 2, RIO_ALTURA, CH.RIO);
  // (14/10) Com o serviço de escorar a ponte aberto, a ponte bamba com a escora caída (empreitas_jogo.js).
  b.desenhaChao = ctx => { const img = spr(typeof arteDoServico === 'function' ? arteDoServico('escorar_ponte', 'objetos/pier') : 'objetos/pier'); if (img) ctx.drawImage(img, PONTE_X * TILE, (RIO_Y - 1) * TILE + 12, 2 * TILE, (RIO_ALTURA + 2) * TILE); };
  b.enfeite('objetos/cachoeira', 4, RIO_Y + 1, false);
  // Bordas de árvores (abertura na saída leste, y 11..15).
  for (let x = 0; x <= b.larg; x += 2) { b.enfeite('objetos/arvore_mata', x, 1, false); if (x !== PONTE_X) b.enfeite('objetos/arvore_mata', x, b.alt - 1, false); }   // (T3: embaixo, x 26–27 fica aberto para a trilha da serra)
  for (let y = 2; y < b.alt - 1; y += 2) { b.enfeite('objetos/arvore_mata', 0, y, false); if (y < 11 || y > 15) b.enfeite('objetos/arvore_mata', b.larg - 1, y, false); }
  // A clareira: cercada de árvores, com a passagem atrás do tronco caído.
  const C = MATA.CLAREIRA;
  for (let y = C.y; y <= C.y + C.h; y++) b.enfeite('objetos/arvore_mata', C.x + C.w, y, true, 16, 12);
  for (let x = C.x; x < C.x + C.w; x++) if (x < TRONCO.x || x > TRONCO.x + 1) b.enfeite('objetos/arvore_mata', x, C.y + C.h, true, 16, 12);
  b.enfeite('objetos/jabuticabeira', 5, 3, true, 14);
  const aberta = !!(G.lugares && G.lugares.clareira);
  if (!aberta) {
    const tronco = b.interativo('tronco_caido', 'objetos/tronco_caido', TRONCO.x, TRONCO.y, 2, 1, [32, 10]);
    tronco.acao = () => { abrirPlaca('Um tronco enorme, caído atravessando a trilha. Atrás dele dá para ver uma clareira... Precisa de um machado mais forte: o profissional (o Seu Tonico melhora com aço).'); return true; };
    // O tronco grande do Stardew: só o machado profissional (nível 2) entra; 6 golpes e a clareira fica aberta para sempre.
    tronco.vida = 6;
    tronco.ferramenta = (o, id) => {
      if (id !== 'machado') return;
      if (nivelFerramenta('machado') < 2) { o.treme = 0.25; sons.tocar('madeira', 1.6, 0.05, -8); avisar('O machado nem entra! Isso pede o machado profissional (o Seu Tonico melhora com aço).'); return; }
      o.vida--; o.treme = 0.3; lascas(o.x, o.y - 20, 'madeira'); sons.tocar('madeira', 1, 0.08, -4); G.tremor = Math.max(G.tremor || 0, 0.12);
      if (o.vida <= 0) abrirClareira(G.mapa);
    };
  }
  // Enfeites fixos e o mato da mata (sorteio sempre igual).
  for (const t of [[16, 4], [22, 7], [34, 4], [38, 9], [18, 21], [33, 22], [12, 21], [39, 20]]) b.enfeite('objetos/palmeira_jucara', t[0], t[1], true, 8);
  for (const t of [[20, 5], [30, 3], [36, 10], [15, 10], [23, 22], [8, 21], [37, 7], [3, 9]]) b.enfeite('objetos/bromelia', t[0], t[1], false);
  for (const t of [[25, 5], [31, 21], [17, 9]]) b.enfeite('objetos/arvore_mata', t[0], t[1], true, 14);
  const usados = new Set();
  for (let k = 0; k < 260; k++) {
    const x = 3 + Math.floor(b.rng() * (b.larg - 7)), y = 3 + Math.floor(b.rng() * (b.alt - 6)), r = b.rng();
    if (naClareira(x, y, 1) || (y >= 10 && y <= 15) || (y >= RIO_Y - 1 && y <= RIO_Y + RIO_ALTURA) || dentroR(MATA.BOSQUE, x, y)) continue;   // (o bosque de corte fica livre do mato de enfeite)
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
  b.trancadas = aberta ? [] : [{ x: C.x, y: C.y, w: C.w, h: C.h }];
  b.paredesDaBorda();
  repoeMata(b, true);   // (o mapa novo já vem com o bosque e a beira do rio cheios)
  b.aoMontar = () => {
    for (const [x, y] of MATA.TOCOS) if (!b.ocupado.has(chaveT(x, y))) b.detrito('toco_lei', x, y);
    if (!G.mataSemeada) { repoeMata(b, true); G.mataSemeada = true; }   // (o save de antes do bosque: enche uma vez)
    if (!G.mataSemeada2) { repoeMata(b, 'arvores'); G.mataSemeada2 = true; }   // (o save de antes de o bosque subir: as vagas de cima, uma vez; as árvores velhas de baixo ficam até cortar)
  };
  return b;
};

// ---------- o bosque e a beira do rio (relato de 14/10; o bosque subiu no mesmo dia) ----------
// "Eu acabei com toda a madeira do quintal, não tinha mais onde pegar... preciso de mais local que possa pegar essas madeiras e
// pedras além do quintal." Como é no Stardew: a fazenda rebrota pouco; a Floresta da Seiva tem árvores que se cortam e voltam a
// crescer, o Bosque Secreto tem tocos que reaparecem todo dia, e a pedreira e a mina dão pedra: sempre há um lugar fixo para buscar
// material. Aqui: antes da ponte da mata (o gramado entre a trilha e o rio, que se vê da trilha), um bosque de árvores de corte (o detrito 'arvore', que vira toco) com galhos no chão, e
// pedras e pedregulhos na beira do rio (pedra antes de a pedreira abrir, no dia 5). Toda manhã a mata repõe até o máximo vivo
// (ECO.mata.repoe), no padrão das rochas da pedreira (rochasDaEntrada): árvore só em vaga sem toco (o toco da árvore cortada fica até
// ser tirado), nada em cima do Jocelino, de objeto usável, da trilha, da ponte ou da passagem, e nada que feche caminho.
// ("As árvores depois da ponte estão muito escondidas": ali era mata fechada, rente à barra de ferramentas; o gramado de cima é aberto.
// A árvore do quintal tem 3×4 ladrilhos: na fileira y 15 a copa cobre a trilha, o pé fica no gramado, e y 14 e y 16 sobram para andar.)
MATA.BOSQUE = { x: 14, y: 14, w: 27, h: 2 };
// O galho cai no chão da mata: o gramado do bosque, junto das árvores, e o de cima da trilha (fora do lugar da carroça do mascate).
MATA.CHAO_GALHOS = [{ x: 14, y: 14, w: 27, h: 2 }, { x: 14, y: 3, w: 28, h: 7 }];
MATA.CARROCA = { x: 26, y: 6, w: 8, h: 6 };
// (as vagas ficam a 3 ladrilhos umas das outras (o tronco é estreito: passa gente entre as copas), longe da passagem da ponte e da saída: sempre sobra passagem entre elas)
MATA.VAGAS_ARVORE = [[15, 15], [18, 15], [21, 15], [31, 15], [34, 15], [37, 15], [40, 15]];
MATA.BEIRAS = [{ y: 16, x: [[15, 22], [31, 40]] }, { y: 19, x: [[10, 22], [30, 40]] }];   // (sem a ponte, o poço da cachoeira e o lugar da ponte de pedra)
// A árvore de corte é a mesma do quintal (objetos/arvore, o detrito 'arvore' que vira toco). Testada com a arte das árvores da mata
// (objetos/arvore_mata): ficava igual às de enfeite em volta, que não se cortam, e o jogador não saberia qual cortar; a do quintal, mais
// clara, se lê como 'esta se corta' — a mesma que ele já derrubou em casa.
// (a vaga e os ladrilhos em volta ficam livres: a árvore tem onde voltar e não faz parede com o que está no chão — os 4 de lado para o
// galho, os 8 para a pedra, que fica na beira do rio, onde a passagem é estreita)
const _vagaDeArvore = (x, y, cantos = false) => MATA.VAGAS_ARVORE.some(([a, c]) => cantos ? Math.abs(a - x) <= 1 && Math.abs(c - y) <= 1 : Math.abs(a - x) + Math.abs(c - y) <= 1);
function _enfeiteNoLadrilho(b, x, y) { return b.objs.some(o => o.tipo === 'enfeite' && Math.floor(o.x / TILE) === x && Math.floor(o.y / TILE) - 1 === y); }
// O ladrilho onde pode nascer: grama da área livre, fora da clareira, da trilha e da ponte (que são terra), longe do Jocelino, sem
// enfeite, sem objeto usável em volta (a plaquinha, o achado, a carroça); com `vizinhos`, solto (nada em volta).
function _podeNascerNaMata(b, x, y, vizinhos) {
  if (!b.livreEm(x, y) || b.chaoEm(x, y) !== CH.GRAMA || b.saidaEm(x, y) || b.ocupado.has(chaveT(x, y))) return false;
  if (naClareira(x, y, 1) || (b.trancadas || []).some(q => dentroR(q, x, y)) || (x >= MATA.PONTE_X - 2 && x <= MATA.PONTE_X + 3)) return false;
  if (_enfeiteNoLadrilho(b, x, y)) return false;
  if (b.objs.some(o => o.tipo === 'inter' && (o.tiles || []).some(t => Math.abs(t.x - x) <= 1 && Math.abs(t.y - y) <= 1))) return false;
  if (G.mapa === b && G.jog && Math.hypot((x + 0.5) * TILE - G.jog.x, (y + 0.5) * TILE - G.jog.y) < 2 * TILE) return false;
  // (solto no chão: nada nos 8 ladrilhos em volta, nem enfeite — nada empilhado, e galho e pedra não fazem parede com as árvores)
  if (vizinhos) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if ((dx || dy) && (b.ocupado.has(chaveT(x + dx, y + dy)) || _enfeiteNoLadrilho(b, x + dx, y + dy))) return false;
  return true;
}
// Depois de pôr: a saída, a ponte e a frente do tronco continuam ao alcance, e nenhum detrito que se alcançava ficou preso.
function _naoFechaAMata(b, antes, depois) {
  const { PONTE_X, RIO_Y, RIO_ALTURA, TRONCO } = MATA, s = b.saidas[0];
  // (T3) e a saída da serra, embaixo da ponte (a trilha de terra: a reposição já não põe nada nela, mas fica conferido)
  if (![{ x: s.x, y: s.y + 1 }, { x: PONTE_X, y: RIO_Y + RIO_ALTURA + 1 }, { x: TRONCO.x, y: TRONCO.y + 1 }, { x: PONTE_X, y: 22 }].every(p => depois.has(chaveT(p.x, p.y)))) return false;
  return !b.objs.some(d => d.tipo === 'detrito' && alcancaLadrilho(antes, d.tiles[0]) && !alcancaLadrilho(depois, d.tiles[0]));
}
// A reposição: `cheia` enche tudo até o máximo (o mapa novo); senão, o que a manhã repõe. Devolve quantos nasceram.
// (`cheia` === 'arvores': só as vagas de árvore, para o save de antes de o bosque subir)
function repoeMata(b, cheia = false) {
  const R = ECO.mata && ECO.mata.repoe; if (!b || b.id !== 'mata' || !R) return 0;
  const M = R.maximo, f = mulberry(cheia ? 7717 : G.dia * 977 + 13);
  const vivos = dets => b.objs.filter(o => o.tipo === 'detrito' && dets.includes(o.det) && (o.det !== 'arvore' || MATA.VAGAS_ARVORE.some(([a, c]) => a === o.tiles[0].x && c === o.tiles[0].y))).length;   // (árvore velha de baixo não conta no máximo)
  let antes = andaveisDe(b, b.inicio.x, b.inicio.y), n = 0;
  const poe = (det, x, y) => {
    const o = b.detrito(det, x, y); if (!o) return false;
    const depois = andaveisDe(b, b.inicio.x, b.inicio.y);
    if (!_naoFechaAMata(b, antes, depois)) { b.tirar(o); return false; }
    antes = depois; n++;
    return true;
  };
  // 1. As árvores, nas vagas do bosque (a vaga com toco espera o toco sair).
  const vagas = MATA.VAGAS_ARVORE.map(v => [v, f()]).sort((a, c) => a[1] - c[1]).map(v => v[0]);
  for (let k = 0, q = cheia ? M.arvores : R.arvores; k < vagas.length && q > 0 && vivos(['arvore']) < M.arvores; k++) {
    const [x, y] = vagas[k]; if (_podeNascerNaMata(b, x, y, false) && poe('arvore', x, y)) q--; }
  if (cheia === 'arvores') return n;
  // 2. Os galhos no chão da mata (metade das tentativas em cima, metade embaixo).
  for (let k = 0, q = cheia ? M.galhos : R.galhos; k < (cheia ? 600 : 200) && q > 0 && vivos(['galho']) < M.galhos; k++) {
    const C = MATA.CHAO_GALHOS[f() < 0.5 ? 0 : 1], x = C.x + Math.floor(f() * C.w), y = C.y + Math.floor(f() * C.h);
    if (!_vagaDeArvore(x, y) && !dentroR(MATA.CARROCA, x, y) && _podeNascerNaMata(b, x, y, true) && poe('galho', x, y)) q--; }
  // 3. As pedras na beira do rio; às vezes um pedregulho (2×2) na beira de baixo.
  const beira = []; for (const L of MATA.BEIRAS) for (const [a, z] of L.x) for (let x = a; x <= z; x++) beira.push([x, L.y]);
  for (let k = 0, q = cheia ? M.pedras : R.pedras; k < (cheia ? 600 : 200) && q > 0 && vivos(['pedra', 'pedregulho']) < M.pedras; k++) {
    const [x, y] = beira[Math.floor(f() * beira.length)], grande = y === MATA.RIO_Y + MATA.RIO_ALTURA && f() < R.pedregulho;
    const solto = () => { for (let dx = -1; dx <= 2; dx++) for (let dy = -1; dy <= 2; dy++) if (b.ocupado.has(chaveT(x + dx, y + dy))) return false; return true; };   // (o pedregulho também solto)
    const cabe = grande ? solto() && [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dy]) => !_vagaDeArvore(x + dx, y + dy, true) && _podeNascerNaMata(b, x + dx, y + dy, false)) : !_vagaDeArvore(x, y) && _podeNascerNaMata(b, x, y, false) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => !b.ocupado.has(chaveT(x + dx, y + dy)) && !_enfeiteNoLadrilho(b, x + dx, y + dy));   // (a pedra pode ficar na diagonal da árvore, entre as copas: o pé da árvore e o vão de y 14 ficam livres)
    if (cabe && poe(grande ? 'pedregulho' : 'pedra', x, y)) q--; }
  return n;
}
MANHA.push(() => { if (MAPAS.mata || (G.save && G.save.mapas && G.save.mapas.mata)) repoeMata(getMapa('mata')); });
INICIADORES.push(s => { G.mataSemeada = !!s.mataSemeada; G.mataSemeada2 = !!s.mataSemeada2; });
COLETORES.push(s => { s.mataSemeada = !!G.mataSemeada; s.mataSemeada2 = !!G.mataSemeada2; });
// A primeira árvore de corte da mata (a primeira vez de cada coisa tem seta e frase): a seta mostra a mais perto até a primeira cair
// (G.limpou.mata_arvore, contado em quebrouNaMata). Só sem outra seta (guia_setas.js): a missão do dia vem antes.
const FALA_ARVORE_MATA = 'Árvore boa de cortar: o machado tira madeira, e a mata repõe de manhã.';
function alvoDaArvoreDaMata() {
  if (G.mapaId !== 'mata' || !G.mapa || !G.jog || !G.limpou || G.limpou.mata_arvore || !G.mochila || !G.mochila.total('machado')) return null;
  let o = null, d = 1e9;
  const deCima = x => MATA.VAGAS_ARVORE.some(([a, c]) => a === x.tiles[0].x && c === x.tiles[0].y);   // (a de cima, à vista; a velha de baixo só se não houver outra)
  const temDeCima = G.mapa.objs.some(x => x.tipo === 'detrito' && x.det === 'arvore' && deCima(x));
  for (const x of G.mapa.objs) if (x.tipo === 'detrito' && x.det === 'arvore' && (!temDeCima || deCima(x))) { const dd = Math.hypot(x.x - G.jog.x, x.y - G.jog.y); if (dd < d) { d = dd; o = x; } }
  return o && { mapa: 'mata', ponto: { x: o.x, y: o.y - 56 }, rotuloFixo: FALA_ARVORE_MATA };
}
function quebrouNaMata(o) { if (G.mapaId === 'mata' && o.det === 'arvore' && G.limpou) G.limpou.mata_arvore = (G.limpou.mata_arvore || 0) + 1; }

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
// O tronco caiu: solta a madeira, some do mapa e a clareira abre (G.lugares vai no save).
function abrirClareira(b) {
  const t = b.objs.find(o => o.id === 'tronco_caido'); if (t) { b.tirar(t); soltar('madeira', 5, t.x, t.y - 10); }
  G.lugares = G.lugares || {}; G.lugares.clareira = true; b.trancadas = [];
  sons.tocar('fanfarra', 1, 0, -4); avisar('O tronco caiu! A clareira escondida está aberta.');
}
