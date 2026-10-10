// Jocelino — achados.js — a coleta do caminho (os forageables do Stardew, como no achados.gd do Godot): frutas, flores,
// conchas e pedras bonitas que aparecem toda manhã conforme a estação e o lugar, sem gastar energia (+3 de Fôlego).
// A sorte do dia (−0,10 a +0,10) muda a quantidade e a chance das raras; o horóscopo do rádio conta.
// As posições do dia ficam gravadas em G.achados (salvo): o que se catou não volta e nada muda de lugar ao recarregar.

const ACHADOS_POR_MAPA = { quintal: 3, vila: 4, praia: 4, mata: 6 };
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
  tabela(mapaId, est, chove) {
    let t = mapaId === 'praia' ? ACHADOS_PRAIA : mapaId === 'mata' ? ACHADOS_MATA[est] : ACHADOS_ESTACAO[est];
    if (chove && mapaId === 'mata') t = t.map(([id, p]) => [id, id === 'cogumelo' ? p * 2 : p]);
    return t;
  },
  // Sorteia os achados do dia num mapa: em chão livre (sem objeto, saída nem água), fixo pelo dia e pelo mapa.
  sortear(dia, mapaId, m) {
    const base = ACHADOS_POR_MAPA[mapaId];
    if (!base || !m) return [];
    const est = Math.floor((dia - 1) / 28) % 4, chove = typeof Clima !== 'undefined' && Clima.chove(dia), s = Achados.sorte(dia);
    const f = mulberry(dia * 7919 + mapaId.length * 131 + mapaId.charCodeAt(0));
    const n = base + (s >= 0.06 ? 1 : s <= -0.06 ? -1 : 0) - (chove && mapaId === 'praia' ? 1 : 0);
    const t = Achados.tabela(mapaId, est, chove).map(([id, p]) => [id, ACHADOS_RAROS.includes(id) ? p * (1 + s * 5) : p]);
    const soma = t.reduce((a, x) => a + x[1], 0), r = [];
    for (let k = 0, tent = 0; r.length < n && tent < 300; tent++) {
      const x = m.livre.x + Math.floor(f() * m.livre.w), y = m.livre.y + Math.floor(f() * m.livre.h);
      const o = m.ocupado.get(chaveT(x, y));
      if ((o && !o.achado) || m.chaoEm(x, y) !== CH.GRAMA || m.saidaEm(x, y) || (m.trancadas || []).some(q => dentroR(q, x, y)) || r.some(a => a.x === x && a.y === y)) continue;
      let v = f() * soma, id = t[0][0];
      for (const [i, p] of t) { if (v < p) { id = i; break; } v -= p; }
      r.push({ id, x, y, k: k++ });
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
      if (r === 'ok') { b.tirar(o); sons.tocar('pegar', 1.1, 0.05, -4); avisar(`Achou ${Itens.nome(a.id).toLowerCase()}!`); hudSujo(); }
      else if (r === 'cheia') avisar('A mochila está cheia.');
      return true;
    };
  }
}
AO_MONTAR.push(b => poeAchados(b));
// O mapa montado num dia anterior (ficou na memória): refaz a coleta ao entrar.
AO_ENTRAR_MAPA.push(() => { if (G.mapa && G.mapa._achadosDia !== G.dia) poeAchados(G.mapa); });
