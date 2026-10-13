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
  restantes() { return getMapa('quintal').objs.filter(o => o.tipo === 'detrito' && QUINTAL_DETS.includes(o.det) && !o.empreitaDet).length; },
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
INICIADORES.push(s => { G.quintalMarcos = (s.quintalMarcos || []).slice(); });
COLETORES.push(s => { s.quintalMarcos = G.quintalMarcos.slice(); });
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
