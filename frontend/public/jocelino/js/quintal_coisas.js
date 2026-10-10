// Jocelino — quintal_coisas.js — o que se põe no quintal (o "colocar" do Stardew; mapa_quintal.gd do Godot): cerca que se
// liga sozinha, portão, irrigador; machado ou picareta recolhe. O Tio Juca faz a cerca e o portão com madeira. As
// galinhas da vizinhança bicam a horta aberta (os corvos do Stardew), o irrigador do Tonico rega de manhã e os filhos
// ajudam a regar.

const COLOCAVEIS_QUINTAL = ['cerca', 'portao', 'irrigador'];
// Motivo para não colocar ('' = pode).
function podeColocar(b, x, y) {
  if (b.id !== 'quintal' || !b.livreEm(x, y)) return 'Aqui não dá.';
  if (b.saidaEm(x, y) || b.chaoEm(x, y) !== CH.GRAMA) return 'Na trilha não: o caminho até a Vila fica livre.';
  if (b.ocupado.has(chaveT(x, y))) return 'Já tem coisa aí.';
  const c = Horta.cova(x, y); if (c && c.planta) return 'Tem planta aí.';
  const p = G.jog.ladrilho(); if (p.x === x && p.y === y) return 'O Jocelino está em cima.';
  return '';
}
// A cerca se liga à vizinha (regra do Godot): com cerca à direita, ripa horizontal; sem cerca à esquerda e com cerca em
// cima ou embaixo, poste; senão a cerca simples. Com cerca em cima, a versão "_r" (a ripa sobe).
const temCerca = (x, y) => G.horta.colocados.some(c => c.x === x && c.y === y && (c.id === 'cerca' || c.id === 'portao'));
function arteCerca(x, y) {
  const dir = temCerca(x + 1, y), esq = temCerca(x - 1, y), cima = temCerca(x, y - 1), baixo = temCerca(x, y + 1);
  const base = dir ? 'objetos/cerca_h' : !esq && (cima || baixo) ? 'objetos/cerca_poste' : 'objetos/cerca';
  return base + (cima ? '_r' : '');
}
function poeColocados(b) {
  if (!b || b.id !== 'quintal') return;
  for (const o of b.objs.filter(o => o.id === 'colocado')) b.tirar(o);
  for (const c of G.horta.colocados) {
    const solido = c.id !== 'portao';
    const o = b.interativo('colocado', c.id === 'cerca' ? arteCerca(c.x, c.y) : 'objetos/' + c.id, c.x, c.y, 1, 1, solido ? [16, 10] : null, solido);
    Object.assign(o, { item: c.id, cx: c.x, cy: c.y });
    o.ferramenta = (p, id) => { if (id === 'machado' || id === 'picareta') recolher(p); };
    if (c.id === 'irrigador') o.acao = () => abrirPlaca('O irrigador do Seu Tonico: rega as 4 covas em volta toda manhã.');
  }
}
function colocar(id, x, y) {
  const m = podeColocar(G.mapa, x, y); if (m) { avisar(m); return false; }
  if (Horta.cova(x, y)) delete G.horta.covas[chaveH(x, y)];   // cova vazia vira chão de cerca
  G.horta.colocados.push({ id, x, y }); G.mochila.remover(id, 1);
  sons.tocar('pousar', 1, 0.05, -4); poeColocados(G.mapa); hudSujo(); return true;
}
function recolher(o) {
  G.horta.colocados = G.horta.colocados.filter(c => !(c.x === o.cx && c.y === o.cy));
  const sobra = G.mochila.adicionar(o.item, 1); if (sobra) soltar(o.item, 1, o.x, o.y - 10);
  sons.tocar('madeira', 1, 0.05, -4); poeColocados(G.mapa); hudSujo();
}
AO_MONTAR.push(b => { if (b.id === 'quintal') poeColocados(b); });

// O Tio Juca faz cerca (2 madeiras) e portão (5) — "cerca boa segura galinha e segura menino".
function falaDe(p) {
  const f = FALAS[p.id], paginas = typeof f === 'function' ? f() : (f || ['Bom dia, Jocelino!']);
  return Array.isArray(paginas[0]) ? paginas[0] : paginas;
}
function conversarJuca(p) {
  const fala = falaDe(p);
  if (G.mochila.total('madeira') < 2) { abrirConversa(p.nome, urlArte('retratos/juca_normal'), fala); return true; }
  abrirConversa(p.nome, urlArte('retratos/juca_normal'), fala.concat(['Cerca boa segura galinha e segura menino. Quer que eu faça com a sua madeira?']), () =>
    perguntar('Tio Juca: "Faço o quê?"', ['Fazer cerca (2 madeiras)', 'Fazer portão (5 madeiras)', 'Agora não'], i => {
      const custo = [2, 5][i], item = ['cerca', 'portao'][i];
      if (!custo) return;
      if (G.mochila.total('madeira') < custo) { avisar(`Precisa de ${custo} madeiras.`); return; }
      if (!G.mochila.cabe(item)) { avisar('A mochila está cheia.'); return; }
      G.mochila.remover('madeira', custo); G.mochila.adicionar(item, 1); sons.tocar('madeira', 1, 0.05, -4); avisar(`O Tio Juca fez ${Itens.qtd(1, item)}.`); hudSujo();
    }));
  return true;
}
AO_MONTAR.push(b => { if (b.id !== 'quintal') return; const j = b.moradores.find(m => m.id === 'juca'); if (j) j.aoConversar = () => conversarJuca(j); });

// ---------- as galinhas de manhã: aparecem na cova bicada e fogem quando o Jocelino chega a 3 ladrilhos ----------
NOITE.push(linhas => {
  G.horta.galinha = null;
  const id = Horta.galinhas(getMapa('quintal'), mulberry(G.dia * 613 + 3));
  if (id) { linhas.push(`As galinhas da vizinhança bicaram um pé de ${Itens.nome(id).toLowerCase()}. Cerca resolve.`); if (MAPAS.quintal) sincronizaHorta(MAPAS.quintal); }
});
let _galinha = null;   // {x, y, foge, lado, t} em pixels
ATUALIZADORES.push(dt => {
  if (!G.horta || !G.horta.galinha || G.mapaId !== 'quintal') { _galinha = null; return; }
  if (!_galinha) _galinha = { x: (G.horta.galinha.x + 0.5) * TILE, y: (G.horta.galinha.y + 1) * TILE, foge: false, lado: 1, t: 0 };
  const g = _galinha; g.t += dt;
  if (!g.foge && Math.hypot(G.jog.x - g.x, G.jog.y - g.y) < 3 * TILE) { g.foge = true; g.lado = G.jog.x < g.x ? 1 : -1; sons.tocar('pegar', 1.6, 0.1, -8); }
  if (g.foge) { g.x += g.lado * 260 * dt; const L = G.mapa.livre; if (g.x < L.x * TILE || g.x > (L.x + L.w) * TILE) { G.horta.galinha = null; _galinha = null; } }
});
AO_MONTAR.push(b => { if (b.id === 'quintal') b.extras = () => _galinha ? [{ y: _galinha.y, desenha(ctx) {
  const g = _galinha, quadro = g.foge || Math.floor(g.t * 3) % 2 ? 'objetos/galinha_1' : 'objetos/galinha_2';
  ctx.save(); ctx.translate(g.x, g.y); if (g.lado < 0 || (!g.foge && Math.floor(g.t / 2) % 2)) ctx.scale(-1, 1); desenhaPe(ctx, quadro, 0, 0, 1); ctx.restore(); } }] : []; });
// ---------- o irrigador: as 4 covas vizinhas começam o dia molhadas ----------
function regarComIrrigadores() {
  let n = 0;
  for (const c of G.horta.colocados.filter(c => c.id === 'irrigador')) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const cv = Horta.cova(c.x + dx, c.y + dy); if (cv && !cv.regada) { cv.regada = true; n++; } }
  return n;
}
MANHA.push(() => { if (G.horta) regarComIrrigadores(); });
