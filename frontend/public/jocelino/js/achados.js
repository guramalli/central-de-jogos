// Jocelino — achados.js — a coleta do caminho (os forageables do Stardew, como no achados.gd do Godot): frutas, flores,
// conchas e pedras bonitas que aparecem toda manhã conforme a estação e o lugar, sem gastar energia (+3 de Fôlego).
// A sorte do dia (−0,10 a +0,10) muda a quantidade e a chance das raras; o horóscopo do rádio conta.
// As posições do dia ficam gravadas em G.achados (salvo): o que se catou não volta e nada muda de lugar ao recarregar.

const ACHADOS_POR_MAPA = { quintal: 3, vila: 4, praia: 4, mata: 6, serra: 5 };
const ACHADOS_ESTACAO = [   // quintal e Vila: [item, peso] por estação (Outono, Inverno, Primavera, Verão)
  [['goiaba', 5], ['coco', 3], ['flor', 2], ['pedra_bonita', 1]],
  [['coco', 4], ['flor', 2], ['goiaba', 2], ['pedra_bonita', 1]],
  [['flor', 5], ['caju', 4], ['coco', 2], ['pedra_bonita', 1]],
  [['caju', 5], ['coco', 4], ['concha', 2], ['pedra_bonita', 1]],
];
const ACHADOS_MATA = [
  [['araca', 4], ['cogumelo', 3], ['cambuci', 3], ['flor', 2]],
  [['cogumelo', 4], ['cambuci', 3], ['araca', 3], ['pedra_bonita', 1]],
  [['jabuticaba', 4], ['pitanga', 4], ['flor', 2], ['cogumelo', 2]],
  [['pitanga', 4], ['jabuticaba', 4], ['araca', 3], ['cogumelo', 2]],
];
const ACHADOS_PRAIA = [['concha', 6], ['coco', 3], ['pedra_bonita', 1]];
const ACHADOS_RAROS = ['pedra_bonita', 'concha'];
// (15/10, T5 da mata: spec 2026-10-15-mata-sitio-design.md, seção 4.3) A coleta da Mata da Serra, por estação. Como é no Stardew: a
// Floresta Secreta tem o que só nasce lá (a samambaia-fiddlehead do verão, o morel da primavera); aqui, as frutas nativas da Mata
// Atlântica (juçara, uvaia, grumixama) e o cipó, que só a serra dá. O cogumelo dobra com chuva, como na mata.
const ACHADOS_SERRA = [
  [['fruto_jucara', 4], ['cogumelo', 3], ['cipo', 3], ['araca', 2]],
  [['fruto_jucara', 4], ['cipo', 4], ['cogumelo', 3], ['cambuci', 2]],
  [['uvaia', 4], ['flor', 3], ['cipo', 3], ['cogumelo', 2]],
  [['grumixama', 4], ['jabuticaba', 3], ['uvaia', 2], ['cogumelo', 3]],
];
const ACHADOS_COGUMELO_CHUVA = ['mata', 'serra'];   // onde a chuva dobra o cogumelo
const ACHADOS_DO_FARO = ['praia', 'mata', 'serra'];  // onde o Faro de catador (Fôlego 4) dá achado a mais
// Os itens novos da serra (a arte é a do lote C: itens/<id>, 48 px). A corda sai do Fabricar (3 cipós; o Nhô Quim ensina, T6).
Object.assign(ITENS, {
  cipo: { nome: 'Cipó', pilha: 99, ferramenta: false, descricao: 'Da Mata da Serra. Trançado, vira corda no Fabricar (3 cipós dão 1 corda; quem ensina é o Nhô Quim, o mateiro).' },
  fruto_jucara: { nome: 'Fruto de juçara', pilha: 99, ferramenta: false, energia: 10, descricao: 'O fruto roxo da palmeira juçara, da Mata da Serra. A palmeira não se corta: o fruto é o jeito certo de aproveitar. Botão direito: +10 de energia.' },
  uvaia: { nome: 'Uvaia', pilha: 99, ferramenta: false, energia: 15, descricao: 'Fruta azedinha da Mata Atlântica, da serra na primavera e no verão. Botão direito: +15 de energia.' },
  grumixama: { nome: 'Grumixama', pilha: 99, ferramenta: false, energia: 15, descricao: 'A "cereja" da Mata Atlântica, da serra no verão. Botão direito: +15 de energia.' },
  corda: { nome: 'Corda', pilha: 99, ferramenta: false, descricao: 'Corda de cipó trançado (3 cipós, no Fabricar). Serve no poço do sítio e na escada de corda.' },
});
// O preço na caixa de venda (caixa_venda.js junta com o ECO.caixa; o que a T17 puser no ECO vale por cima). A conta da spec: ~Cr$ 25 a
// 35 por dia com 5 achados (outono ~33, inverno ~34, primavera ~31, verão ~39; o verão tem a grumixama, a jabuticaba e o cogumelo).
const PRECO_COLETA_SERRA = { cipo: 4, fruto_jucara: 6, uvaia: 6, grumixama: 7, corda: 15 };
// A 1ª vez de cada item novo da serra: o aviso diz o que é (uma vez por item, G.limpou.serra_<id>).
const FALA_ACHADO_SERRA = {
  cipo: 'Achou cipó! O mateiro da serra sabe trançar corda com ele.',
  fruto_jucara: 'Achou fruto de juçara! A palmeira fica em pé: o fruto é o jeito certo de aproveitar.',
  uvaia: 'Achou uvaia! Fruta da Mata Atlântica: vale na caixa de venda e mata a fome.',
  grumixama: 'Achou grumixama! A "cereja" da Mata Atlântica: só a serra dá, no verão.',
};
const FRASE_ACHADO_SERRA = 'Botão direito: catar. A serra dá fruta nativa e cipó (catar não cansa)';

const Achados = {
  sorte(dia) { return Math.round((mulberry(dia * 9137 + 77)() * 0.2 - 0.1) * 100) / 100; },
  horoscopo(dia) {
    const s = Achados.sorte(dia);
    if (s >= 0.06) return 'Hoje os astros estão com você! Dia ótimo para achar coisa boa pelo caminho.';
    if (s >= 0.02) return 'Boas energias hoje. Fique de olho no chão!';
    if (s > -0.02) return 'Dia normal, nem lá nem cá. Trabalho e paciência.';
    if (s > -0.06) return 'Os astros estão meio emburrados. Não espere muita sorte hoje.';
    return 'Ih... hoje é dia de ficar quietinho. Os astros não estão para brincadeira!';
  },
  tabela(mapaId, est, chove, clareira = false) {
    let t = mapaId === 'praia' ? ACHADOS_PRAIA : mapaId === 'mata' ? ACHADOS_MATA[est] : mapaId === 'serra' ? ACHADOS_SERRA[est] : ACHADOS_ESTACAO[est];
    if (chove && ACHADOS_COGUMELO_CHUVA.includes(mapaId)) t = t.map(([id, p]) => [id, id === 'cogumelo' ? p * 2 : p]);
    if (clareira) t = t.map(([id, p]) => [id, ['cambuci', 'cogumelo'].includes(id) ? p * 2 : p]);   // a clareira escondida (etapa 5)
    return t;
  },
  // Sorteia os achados do dia num mapa: em chão livre (sem objeto, saída nem água), fixo pelo dia e pelo mapa.
  sortear(dia, mapaId, m) {
    const base = ACHADOS_POR_MAPA[mapaId] && ACHADOS_POR_MAPA[mapaId] * (typeof Gremio !== 'undefined' ? Gremio.fatorAchados(mapaId) : 1);
    if (!base || !m) return [];
    const est = Math.floor((dia - 1) / 28) % 4, chove = typeof Clima !== 'undefined' && Clima.chove(dia), s = Achados.sorte(dia);
    const f = mulberry(dia * 7919 + mapaId.length * 131 + mapaId.charCodeAt(0));
    // (15/10, T4) o Faro de catador (Fôlego 4): mais achados por dia na praia, na mata e (T5 da mata) na serra
    const faro = ACHADOS_DO_FARO.includes(mapaId) && typeof Habilidades !== 'undefined' && Habilidades.ganho('faro_de_catador') ? ECO.niveis.faro : 0;
    const n = base + faro + (s >= 0.06 ? 1 : s <= -0.06 ? -1 : 0) - (chove && mapaId === 'praia' ? 1 : 0);
    const t = Achados.tabela(mapaId, est, chove).map(([id, p]) => [id, ACHADOS_RAROS.includes(id) ? p * (1 + s * 5) : p]);
    const soma = t.reduce((a, x) => a + x[1], 0), r = [];
    let k = 0;
    for (let tent = 0; r.length < n && tent < 300; tent++) {
      const x = m.livre.x + Math.floor(f() * m.livre.w), y = m.livre.y + Math.floor(f() * m.livre.h);
      const o = m.ocupado.get(chaveT(x, y));
      if ((o && !o.achado) || m.chaoEm(x, y) !== CH.GRAMA || m.saidaEm(x, y) || (m.trancadas || []).some(q => dentroR(q, x, y)) || r.some(a => a.x === x && a.y === y)) continue;
      if (mapaId === 'serra' && sobCopa(m).has(chaveT(x, y))) continue;   // (T5 da mata) nada nasce escondido embaixo da copa
      let v = f() * soma, id = t[0][0];
      for (const [i, p] of t) { if (v < p) { id = i; break; } v -= p; }
      r.push({ id, x, y, k: k++ });
    }
    // A clareira aberta (o tronco do machado profissional): mais 2 achados lá dentro, com cambuci e cogumelo dobrados.
    if (mapaId === 'mata' && G.lugares && G.lugares.clareira && typeof MATA !== 'undefined') {
      const C = MATA.CLAREIRA, tc = Achados.tabela(mapaId, est, chove, true), sc = tc.reduce((a, x) => a + x[1], 0);
      for (let n2 = 0, tent = 0; n2 < 2 && tent < 120; tent++) {
        const x = C.x + Math.floor(f() * C.w), y = C.y + Math.floor(f() * C.h), o = m.ocupado.get(chaveT(x, y));
        if ((o && !o.achado) || m.chaoEm(x, y) !== CH.GRAMA || r.some(a => a.x === x && a.y === y)) continue;
        let v = f() * sc, id = tc[0][0];
        for (const [i, p] of tc) { if (v < p) { id = i; break; } v -= p; }
        r.push({ id, x, y, k: k++ }); n2++;
      }
    }
    return r;
  },
  // Os achados do dia (gravados na primeira vez que o mapa é visto no dia).
  doDia(dia, mapaId, m) {
    if (!ACHADOS_POR_MAPA[mapaId] || !MAPAS_DEF[mapaId]) return [];
    if (dia !== G.dia) return Achados.sortear(dia, mapaId, m || MAPAS[mapaId] || getMapa(mapaId));   // outro dia: só calcula
    if (!G.achados || G.achados.dia !== dia) G.achados = { dia, catados: {}, pos: {} };
    G.achados.pos = G.achados.pos || {};
    if (!G.achados.pos[mapaId]) G.achados.pos[mapaId] = Achados.sortear(dia, mapaId, m || getMapa(mapaId));
    return G.achados.pos[mapaId];
  },
  catar(mapaId, k) {
    const a = Achados.doDia(G.dia, mapaId).find(x => x.k === k);
    const ja = G.achados.catados[mapaId] || (G.achados.catados[mapaId] = []);
    if (!a || ja.includes(k)) return 'ja';
    if (!G.mochila.cabe(a.id)) return 'cheia';
    G.mochila.adicionar(a.id, 1); ja.push(k);
    for (const f of AO_PEGAR) f(a.id, 1);   // (a coleta do recado; recados_jogo.js)
    if (typeof Habilidades !== 'undefined') Habilidades.ganhar('folego', 3);
    return 'ok';
  },
};
INICIADORES.push(s => { G.achados = s.achados && s.achados.dia === G.dia ? JSON.parse(JSON.stringify(s.achados)) : { dia: G.dia, catados: {}, pos: {} }; });
COLETORES.push(s => { s.achados = JSON.parse(JSON.stringify(G.achados)); });
MANHA.push(() => { G.achados = { dia: G.dia, catados: {}, pos: {} }; for (const id in MAPAS) poeAchados(MAPAS[id]); });

// No mapa: cada achado é um interativo baixo (a arte do item), sem bloquear; o botão direito cata.
function poeAchados(b) {
  for (const o of b.objs.filter(o => o.achado)) b.tirar(o);
  b._achadosDia = G.dia;
  if (b.dentro || !ACHADOS_POR_MAPA[b.id]) return;
  const lista = Achados.doDia(G.dia, b.id, b), ja = G.achados.catados[b.id] || [];
  for (const a of lista) {
    if (ja.includes(a.k)) continue;
    const o = b.interativo('achado_' + a.k, 'itens/' + a.id, a.x, a.y, 1, 1, null, false);
    o.achado = true;
    o.acao = () => {
      const r = Achados.catar(b.id, a.k);
      if (r === 'ok') { b.tirar(o); sons.tocar('pegar', 1.1, 0.05, -4); avisar(avisoDoAchado(b.id, a.id)); hudSujo(); falaDoPrimeiroAchado(a.id); }
      else if (r === 'cheia') avisar('A mochila está cheia.');
      return true;
    };
  }
}
// (dia cheio, Frente A) A primeira coleta (uma vez por save, G.limpou.achado): o Tio Juca diz o que é e quanto vale na caixa de venda
// (ou, com a pensão aberta e sendo ingrediente, que a Rosa usa). Como é no Stardew: "corte madeira e colha coisas do chão enquanto
// a primeira colheita não sai" — a coleta é dinheiro desde o dia 1.
function falaDoPrimeiroAchado(id) {
  if (!G.limpou || G.limpou.achado) return;
  G.limpou.achado = 1;
  const nome = Itens.nome(id).toLowerCase(), v = typeof CaixaVenda !== 'undefined' ? CaixaVenda.preco(id) : 0;
  const rosa = typeof Pratos !== 'undefined' && Pratos.INGREDIENTES[id] && G.pensao && G.pensao.estado === 'aberta';
  const valor = rosa ? 'A Rosa usa na cozinha da pensão: guarde na despensa dela.' : v ? `Na caixa de venda do quintal vale Cr$ ${v} cada.` : 'Guarde: serve de presente.';
  abrirConversa('Tio Juca', urlArte('retratos/juca_alegre'), [`Achou ${nome}! Todo dia nasce coisa assim pelo chão — fruta, flor, concha — e catar não cansa. ${valor} Enquanto a horta não dá, é um trocado garantido.`]);
}
// (T5 da mata) A serra é mata fechada: a copa da árvore (e a do jequitibá, da juçara e do xaxim) cobre os ladrilhos acima do pé, e o achado
// que nascesse ali ficaria invisível. Os ladrilhos cobertos (pelo tamanho da arte: a árvore 3,5×4,5, a juçara 2,25×4,5, o xaxim 2×2, o
// jequitibá 4×6) ficam fora do sorteio. Feito uma vez por mapa (os enfeites da serra não mudam).
const COPA_SERRA = { 'objetos/arvore_mata': [1, 4], 'objetos/palmeira_jucara': [1, 4], 'objetos/xaxim': [0, 1], 'objetos/jequitiba': [2, 5] };   // [meia largura, altura] em ladrilhos, acima do pé
function sobCopa(m) {
  if (m._sobCopa) return m._sobCopa;
  const s = new Set();
  for (const o of m.objs) { const c = o.tipo === 'enfeite' && COPA_SERRA[o.nome]; if (!c) continue;
    const fx = Math.floor(o.x / TILE), fy = Math.floor(o.y / TILE) - 1;
    for (let dy = 1; dy <= c[1]; dy++) for (let dx = -c[0]; dx <= c[0]; dx++) s.add(chaveT(fx + dx, fy - dy)); }
  return (m._sobCopa = s);
}
// (T5 da mata) O aviso da coleta: na serra, a 1ª vez de cada item novo diz o que ele é; e o 1º achado catado lá apaga a seta da serra.
function avisoDoAchado(mapaId, id) {
  const L = G.limpou, comum = `Achou ${Itens.nome(id).toLowerCase()}!`;
  if (mapaId !== 'serra' || !L) return comum;
  L.achado_serra = 1;
  if (!FALA_ACHADO_SERRA[id] || L['serra_' + id]) return comum;
  L['serra_' + id] = 1; return FALA_ACHADO_SERRA[id];
}
// A 1ª vez na coleta da serra (toda 1ª vez tem seta + frase; some depois de catar um): o achado mais perto, na frente das missões
// (guia_setas.js chama logo depois da seta da pinguela e da cachoeira, que vem antes). Vale sem o guia, como as setas da serra.
function alvoDoAchadoDaSerra() {
  if (G.mapaId !== 'serra' || !G.mapa || !G.jog || !G.limpou || G.limpou.achado_serra) return null;
  let o = null, d = 1e9;
  for (const x of G.mapa.objs) if (x.achado) { const dd = Math.hypot(x.x - G.jog.x, x.y - G.jog.y); if (dd < d) { d = dd; o = x; } }
  return o && { mapa: 'serra', ponto: { x: o.x, y: o.y - 40 }, rotuloFixo: FRASE_ACHADO_SERRA };
}
// A linha da Caderneta (a caderneta.js carrega depois): a coleta da serra de hoje, depois de conhecida a trilha até a cachoeira (antes,
// a linha "serra_conhecer" da mapa_serra.js manda). O Mostrar leva ao achado mais perto (de fora, até a saída da mata).
addEventListener('load', () => {
  if (typeof CADERNETA === 'undefined') return;
  CADERNETA.push(() => {
    if (typeof Mundo === 'undefined' || !Mundo.aberto('serra') || !G.limpou || !G.limpou.serra_cachoeira || !G.achados) return [];
    const lista = Achados.doDia(G.dia, 'serra'), ja = (G.achados.catados.serra || []).length; if (!lista.length || ja >= lista.length) return [];
    const est = Math.floor((G.dia - 1) / 28) % 4, nomes = ACHADOS_SERRA[est].map(([id]) => Itens.nome(id).toLowerCase()).join(', ');
    const corda = typeof Fabricar !== 'undefined' && Fabricar.conhecida('corda') ? ' · 3 cipós viram corda no Fabricar' : '';
    return [{ id: 'serra_coleta', aba: 'mata', texto: `A coleta da Mata da Serra hoje: ${ja} de ${lista.length} catados (${nomes})${corda}`, feito: ja, meta: lista.length,
      alvo: () => { if (G.mapaId === 'serra') { const o = G.mapa && G.mapa.objs.filter(x => x.achado).sort((p, q) => Math.hypot(p.x - G.jog.x, p.y - G.jog.y) - Math.hypot(q.x - G.jog.x, q.y - G.jog.y))[0];
        return o ? { mapa: 'serra', ponto: { x: o.x, y: o.y - 40 } } : null; }
        return G.mapaId === 'mata' ? { mapa: 'mata', ponto: { x: 27 * TILE, y: 22 * TILE } } : { mapa: 'mata' }; },
      rotulo: 'Botão direito: catar' }];
  });
});
AO_MONTAR.push(b => poeAchados(b));
// O mapa montado num dia anterior (ficou na memória): refaz a coleta ao entrar.
AO_ENTRAR_MAPA.push(() => { if (G.mapa && G.mapa._achadosDia !== G.dia) poeAchados(G.mapa); });
