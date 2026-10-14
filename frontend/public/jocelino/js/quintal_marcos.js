// Jocelino — quintal_marcos.js — o quintal em marcos (a fazenda do Stardew: limpar abre espaço para plantar — aqui a pá cava
// cova em qualquer grama limpa — e, além disso, o Tio Juca dá um prêmio a cada quarto do quintal limpo). O total sai do mapa
// novo (semente fixa); o que se tirou não volta (o save dos detritos).
const QUINTAL_DETS = ['mato', 'pedra', 'galho', 'toco', 'arvore', 'pedregulho'];
const FALA_MARCO = {
  25: 'Um quarto do quintal limpo, sobrinho! Toma sementes da estação e esterco. E repara: a pá cava cova em qualquer grama limpa. Quanto mais limpo, mais horta.',
  50: 'Metade! Com esse espaço todo, um irrigador ajuda: ele rega as 4 covas em volta toda manhã. Coloca do lado da horta.',
  75: 'Tá ficando bonito! Fiz cerca e um portão pra você: horta cercada, as galinhas não bicam.',
  100: 'Quintal arrumado, igualzinho ao do meu tempo! Toma o irrigador bom: rega as 8 covas em volta.' };
let _quintalTotal = 0;
const QuintalMarcos = {
  total() { if (!_quintalTotal) _quintalTotal = MAPAS_DEF.quintal().objs.filter(o => o.tipo === 'detrito' && QUINTAL_DETS.includes(o.det)).length; return _quintalTotal; },
  // (onda final) o que rebrotou à noite não conta: é novo (o que se tirou do quintal de antes não volta)
  restantes() { const rb = new Set(G.quintalRebrota || []); return getMapa('quintal').objs.filter(o => o.tipo === 'detrito' && QUINTAL_DETS.includes(o.det) && !o.empreitaDet && !rb.has(chaveT(o.tiles[0].x, o.tiles[0].y))).length; },
  pct() { const t = QuintalMarcos.total(); return t ? Math.floor(100 * Math.max(0, t - QuintalMarcos.restantes()) / t) : 100; },
  marcos() { return Object.keys(ECO.quintal.marcos).map(Number).sort((a, b) => a - b); },
  proximo() { return QuintalMarcos.marcos().find(m => !G.quintalMarcos.includes(m)) || null; },
  sementeDaEstacao() { const est = estacaoDoDia(G.dia), id = Object.keys(CULTURAS).find(c => CULTURAS[c].estacoes.includes(est) && CULTURAS[c].estacoes.length < 4) || 'mandioca'; return CULTURAS[id].semente; },
  conferir() {
    const p = QuintalMarcos.pct(), novos = [];
    for (const m of QuintalMarcos.marcos()) if (p >= m && !G.quintalMarcos.includes(m)) {
      G.quintalMarcos.push(m); novos.push(m);
      const P = ECO.quintal.marcos[m];
      for (const id in P) { const item = id === 'sementes' ? QuintalMarcos.sementeDaEstacao() : id, sobra = G.mochila.adicionar(item, P[id]); if (sobra && typeof soltar === 'function' && G.jog && G.mapa) soltar(item, sobra, G.jog.x, G.jog.y); }
    }
    return novos;
  },
};
INICIADORES.push(s => { G.quintalMarcos = (s.quintalMarcos || []).slice(); G.quintalRebrota = (s.quintalRebrota || []).slice(); });
COLETORES.push(s => { s.quintalMarcos = G.quintalMarcos.slice(); s.quintalRebrota = (G.quintalRebrota || []).slice(); });
// (onda final; o robô jogador #23 — Stardew: a fazenda rebrota galho, pedra e mato toda noite) A rebrota leve do quintal: toda noite
// nascem ECO.quintal.rebrota.porNoite pedras e galhos (até `maximo` vivos), só na grama aonde o pé do Jocelino chega, sem fechar
// passagem e fora do terreno da casa e dos aluguéis, da zona da casa do Tio Juca, do canteiro, da horta (as covas, 1 ladrilho em
// volta e o que a cerca fecha) e dos caminhos. Eles não contam nos marcos (G.quintalRebrota guarda onde estão). A lista do Bira
// pede pedras: sem a rebrota, depois de umas 2 semanas o quintal não tinha pedra nenhuma.
const _andaveisDoQuintal = b => andaveisDe(b, b.inicio.x, b.inicio.y);   // (a partir da porta da casa do Tio Juca)
function rebrotaDoQuintal(b) {
  const R = ECO.quintal.rebrota; if (!b || !R || b.id !== 'quintal') return 0;
  G.quintalRebrota = (G.quintalRebrota || []).filter(k => { const o = b.ocupado.get(k); return o && o.tipo === 'detrito' && (o.det === 'pedra' || o.det === 'galho'); });
  const covas = G.horta ? Object.keys(G.horta.covas).map(k => k.split(',').map(Number)) : [];
  const pertoDaHorta = (x, y) => covas.some(([cx, cy]) => Math.abs(cx - x) <= 1 && Math.abs(cy - y) <= 1);
  const pertoDoJocelino = (x, y) => G.mapaId === 'quintal' && G.jog && Math.hypot((x + 0.5) * TILE - G.jog.x, (y + 0.5) * TILE - G.jog.y) < 2 * TILE;
  // (correção 2) a porta de toda casa (a do Tio Juca e a nova: onde o Jocelino aparece ao sair, casa_dentro.js) e os ladrilhos em
  // volta: de manhã ele está dentro de casa e sairia preso dentro de uma pedra (sem picareta nem machado, sem saída)
  const portas = [{ x: 7, y: 10 }, b.inicio, typeof CasaFamilia !== 'undefined' ? CasaFamilia.porta() : null].filter(Boolean);
  const pertoDaPorta = (x, y) => portas.some(p => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1);
  const f = mulberry(G.dia * 613 + 5), L = b.livre || { x: 0, y: 0, w: b.larg, h: b.alt };
  let n = 0;
  for (let k = 0; k < 200 && n < R.porNoite && G.quintalRebrota.length < R.maximo; k++) {
    const x = L.x + Math.floor(f() * L.w), y = L.y + Math.floor(f() * L.h), det = f() < R.pedra ? 'pedra' : 'galho';
    if (b.ocupado.has(chaveT(x, y)) || b.chaoEm(x, y) !== CH.GRAMA || reservadoQuintal(x, y) || dentroR(QUINTAL.ZONA_LIMPA, x, y) || dentroR(QUINTAL.CANTEIRO, x, y)
      || pertoDaHorta(x, y) || pertoDoJocelino(x, y) || pertoDaPorta(x, y) || usavelEm(b, x, y)) continue;   // (nem na frente do que se usa: plaquinha, caixas, portão, barril)
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => b.ocupado.has(chaveT(x + dx, y + dy))).length > 1) continue;   // (não fecha a passagem)
    const vis = _andaveisDoQuintal(b); if (!alcancaLadrilho(vis, { x, y })) continue;
    if (typeof Horta !== 'undefined' && Horta.protegida && Horta.protegida(b, x, y)) continue;   // (dentro da cerca da horta)
    const o = b.detrito(det, x, y); if (!o) continue;
    // nasceu fechando o caminho de alguém (outro detrito ou a saída): desfaz
    const vis2 = _andaveisDoQuintal(b), saida = (b.saidas || [])[0];
    if ((saida && !alcancaLadrilho(vis2, { x: saida.x, y: saida.y })) || b.objs.some(d => d.tipo === 'detrito' && !alcancaLadrilho(vis2, d.tiles[0]) && alcancaLadrilho(vis, d.tiles[0]))) { b.tirar(o); continue; }
    G.quintalRebrota.push(chaveT(x, y)); n++;
  }
  return n;
}
MANHA.push(() => { if (G.quintalMarcos && typeof getMapa === 'function') rebrotaDoQuintal(getMapa('quintal')); });
// Cada detrito tirado do quintal: o aviso a cada 10 e a fala do Tio Juca no marco.
function quebrouNoQuintal(o) {
  if (G.mapaId !== 'quintal' || !QUINTAL_DETS.includes(o.det) || o.empreitaDet) return;
  const t = QuintalMarcos.total(), f = t - QuintalMarcos.restantes();
  if (f > 0 && f % 10 === 0) avisar(`Quintal: ${f} de ${t} limpos.`);
  const novos = QuintalMarcos.conferir();
  if (novos.length) { sons.tocar('feito', 1, 0.03, -6); abrirConversa('Tio Juca', urlArte('retratos/juca_alegre'), novos.map(m => FALA_MARCO[m])); hudSujo(); }
}
// De manhã também (o quintal limpo por outro caminho, o save antigo sem detrito sobrando): o presente fica na mochila e no resumo.
MANHA.push(() => { if (!G.quintalMarcos) return; const novos = QuintalMarcos.conferir(); if (novos.length && G.feitosHoje) G.feitosHoje.push(`O Tio Juca deixou um presente pelo quintal limpo (${novos.map(m => m + '%').join(', ')}).`); });
