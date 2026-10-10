// Jocelino — horta_jogo.js — a horta no quintal (mapa_quintal.gd do Godot, horta): as covas desenhadas no chão (terra
// cavada e molhada), as plantas como objetos (a arte da fase), a pá cavando a grama, a semente plantando com o botão
// direito, o regador molhando (a água acaba e o barril enche), a colheita, a foice arrancando, a noite e as tarefas.

const xpColheita = id => Math.max(2, Math.round(CULTURAS[id].venda / 4));   // colher dá Roça pelo valor
const ALCANCE_HORTA = 1;   // ladrilhos em volta do Jocelino (o alvo do Stardew)
const perto1 = t => { const p = G.jog.ladrilho(); return Math.max(Math.abs(t.x - p.x), Math.abs(t.y - p.y)) <= ALCANCE_HORTA; };
function podeCavar(b, x, y) {
  return b.id === 'quintal' && b.livreEm(x, y) && b.chaoEm(x, y) === CH.GRAMA && !b.ocupado.has(chaveT(x, y)) && !b.saidaEm(x, y)
    && !dentroR(QUINTAL.TERRENO, x, y) && !Horta.cova(x, y);
}
// As plantas no mapa: um interativo (não sólido) por cova plantada, com a arte da fase.
function sincronizaHorta(b) {
  if (!b || b.id !== 'quintal') return;
  for (const o of b.objs.filter(o => o.id === 'planta')) { const c = Horta.cova(o.covaX, o.covaY); if (!c || !c.planta) b.tirar(o); }
  for (const k in G.horta.covas) {
    const c = G.horta.covas[k], [x, y] = k.split(',').map(Number);
    const ocup = b.ocupado.get(chaveT(x, y));
    if (ocup && ocup.tipo === 'detrito') b.tirar(ocup);            // save antigo: detrito em cima da cova sai
    if (!c.planta) continue;
    let o = b.objs.find(p => p.id === 'planta' && p.covaX === x && p.covaY === y);
    if (!o) { o = b.interativo('planta', '', x, y, 1, 1, null, false); o.covaX = x; o.covaY = y; o.acao = () => colherPlanta(o); o.ferramenta = (p, id) => ferramentaNaPlanta(p, id); }
    o.nome = `objetos/planta_${c.planta}_${Horta.estagio(c)}`;
  }
}
// O chão da horta: terra cavada, molhada quando regada (ou com chuva); o esterco por cima da cova adubada.
function desenhaCovas(ctx) {
  for (const k in G.horta.covas) {
    const c = G.horta.covas[k], [x, y] = k.split(',').map(Number);
    const img = spr(Horta.molhada(c, G.dia) ? 'texturas/terra_molhada' : 'texturas/terra_cavada');
    if (img) ctx.drawImage(img, x * TILE, y * TILE, TILE, TILE);
    if (c.adubo && !c.planta) desenhaPe(ctx, 'itens/esterco', (x + 0.5) * TILE, (y + 0.85) * TILE, 1, 0.5);
  }
}
function encherRegador() {
  if (G.mochila.total('regador') < 1) { abrirPlaca('O barril d\'água da chuva. Com o regador na mochila, enche aqui.'); return true; }
  Horta.encher(); sons.tocar('agua', 0.9, 0.05, -4); avisar(`Regador cheio: água para ${G.horta.agua} covas.`); hudSujo(); return true;
}
// O golpe no chão (o gancho do acertarUm): a pá cava a grama do quintal; o regador rega a cova (ou enche na água).
function chaoAcertado(id, alvo) {
  const b = G.mapa;
  if (id === 'regador' && b.ehAgua && b.ehAgua(alvo.x, alvo.y)) { encherRegador(); return true; }
  if (b.id !== 'quintal') return false;
  if (id === 'pa' && podeCavar(b, alvo.x, alvo.y)) { Horta.cavar(alvo.x, alvo.y); sons.tocar('terra', 1, 0.1, -6); lascas((alvo.x + 0.5) * TILE, (alvo.y + 0.5) * TILE, 'terra'); return true; }
  if (id === 'regador' && Horta.cova(alvo.x, alvo.y)) { regarCova(alvo.x, alvo.y); return true; }
  return false;
}
function regarCova(x, y) {
  const r = Horta.regar(x, y);
  if (r === 'vazio') { avisar('O regador está vazio: encha no barril d\'água.'); return; }
  if (r === 'ok') Habilidades.ganhar('roca', 1);
  lascas((x + 0.5) * TILE, (y + 0.5) * TILE, 'agua'); sons.tocar('agua', 1, 0.1, -4); hudSujo();
}
// O botão direito no chão: a semente planta na cova (e o esterco aduba, na entrega B).
function acaoNoChao(t) {
  if (!G.mapa || G.mapa.id !== 'quintal' || !G.jog) return false;
  const id = itemDaMao();
  if (typeof COLOCAVEIS_QUINTAL !== 'undefined' && COLOCAVEIS_QUINTAL.includes(id)) {
    if (G.jog.carga && G.jog.carga.id) { avisar('Primeiro largue o que está carregando.'); return true; }
    if (!perto1(t)) { avisar('Chegue mais perto.'); return true; }
    colocar(id, t.x, t.y); return true;
  }
  if (id === 'esterco') {
    if (G.jog.carga && G.jog.carga.id) { avisar('Primeiro largue o que está carregando.'); return true; }
    if (!perto1(t)) { avisar('Chegue mais perto.'); return true; }
    const r = Horta.adubar(t.x, t.y);
    if (r === 'ok') { G.mochila.remover('esterco', 1); sons.tocar('terra', 0.8, 0.05, -8); hudSujo(); }
    else avisar(r === 'sem_cova' ? 'O esterco vai na cova cavada.' : r === 'ocupado' ? 'O esterco vai antes de plantar.' : 'Essa cova já está adubada.');
    return true;
  }
  if (!culturaDaSemente(id)) return false;
  if (G.jog.carga && G.jog.carga.id) { avisar('Primeiro largue o que está carregando.'); return true; }
  if (!perto1(t)) { avisar('Chegue mais perto.'); return true; }
  const r = Horta.plantar(t.x, t.y, id, G.dia);
  if (r === 'sem_cova') { avisar('Primeiro cave a terra com a pá.'); return true; }
  if (r === 'ocupado') return false;
  if (r === 'fora_de_estacao') { avisar('Essa não dá nesta estação.'); return true; }
  G.mochila.remover(id, 1); Habilidades.ganhar('roca', 1); sons.tocar('terra', 1.4, 0.05, -8); sincronizaHorta(G.mapa); hudSujo();
  return true;
}
function colherPlanta(o) {
  const c = Horta.cova(o.covaX, o.covaY);
  if (!c || !c.planta) return true;
  if (!Horta.madura(c)) { abrirPlaca(`${Itens.nome(c.planta)}: ${c.dias} de ${Horta.diasPara(c.planta)} dias${Horta.molhada(c, G.dia) ? ' (regada hoje)' : ' — precisa de água'}.`); return true; }
  if (!G.mochila.cabe(c.planta)) { avisar('A mochila está cheia.'); return true; }
  const r = Horta.colher(o.covaX, o.covaY);
  const sobra = G.mochila.adicionar(r.id, r.qtd); if (sobra) soltar(r.id, sobra, G.jog.x, G.jog.y);
  Habilidades.ganhar('roca', xpColheita(r.id));
  sons.tocar('pegar', 1, 0.05, -4);
  if (r.qual === 2) { avisar(`Colheita caprichada! ${Itens.qtd(r.qtd, r.id)}.`); sons.tocar('carimbo', 1, 0.05, -4); CARIMBOS.push({ x: o.x, y: o.y - 30, t: 0 }); }
  else if (r.qual === 1) avisar(`Colheita boa! ${Itens.qtd(r.qtd, r.id)}.`);
  else avisar('+ ' + Itens.qtd(r.qtd, r.id));
  hudSujo();
  sincronizaHorta(G.mapa);
  return true;
}
function ferramentaNaPlanta(o, id) {
  if (id === 'regador') { regarCova(o.covaX, o.covaY); return; }
  if (id === 'foice') { const p = Horta.arrancar(o.covaX, o.covaY); if (p) { sons.tocar('foice', 1, 0.08, -4); lascas(o.x, o.y - 20, 'mato'); sincronizaHorta(G.mapa); } }
}
AO_MONTAR.push(b => { if (b.id === 'quintal') { b.desenhaChao = desenhaCovas; sincronizaHorta(b); } });
AO_ENTRAR_MAPA.push(id => { if (id === 'quintal') sincronizaHorta(G.mapa); });
NOITE.push(linhas => {
  const r = Horta.noite(G.dia, typeof Clima !== 'undefined' && Clima.chove(G.dia), mulberry(G.dia * 331 + 5));
  if (r.secaram.length) linhas.push(`Virou a estação: ${r.secaram.length} ${r.secaram.length === 1 ? 'pé secou' : 'pés secaram'} na horta.`);
  if (MAPAS.quintal) sincronizaHorta(MAPAS.quintal);
});
MANHA.push(() => { if (MAPAS.quintal) sincronizaHorta(MAPAS.quintal); });

// ---------- a aba Sementes do Ananias, a carta do Tio Juca, as tarefas ----------
const PRECO_HORTA = {};         // esterco (entrega B) e regadorzinho (entrega D)
const PRECO_HORTA_SO_SE = {};   // condição para o item aparecer (o regadorzinho só depois do pedido do Zezinho)
function precoSemente(id) { const c = culturaDaSemente(id); const base = c ? CULTURAS[c].preco : PRECO_HORTA[id]; return Math.max(1, Math.round(base * (G.fatorPreco || 1) * descontoHab())); }
function sementesDaLoja() { return Object.values(CULTURAS).filter(C => C.estacoes.includes(estacaoDoDia(G.dia))).map(C => C.semente).concat(Object.keys(PRECO_HORTA).filter(id => !PRECO_HORTA_SO_SE[id] || PRECO_HORTA_SO_SE[id]())); }
CARTAS.juca_horta = { de: 'Tio Juca', dia: 2, anexo: { semente_alface: 10 },
  texto: 'Jocelino, arrumei um canteirinho do lado de casa. Planta, rega todo dia, que a Rosa aproveita na pensão. Vai junto um pacote de semente de alface. Pá cava, semente planta, regador rega. A chuva rega por você.' };
TAREFAS.push(() => {
  if (!G.horta) return [];
  const pl = Object.values(G.horta.covas).filter(c => c.planta), r = [];
  const secas = pl.filter(c => !Horta.molhada(c, G.dia)).length, prontas = pl.filter(c => Horta.madura(c)).length;
  if (secas && G.horta.agua <= 0) r.push({ texto: 'Horta: encher o regador no barril' });
  else if (secas) r.push({ texto: 'Horta: regar', feito: pl.length - secas, meta: pl.length });
  if (prontas) r.push({ texto: `Horta: ${prontas} ${prontas === 1 ? 'pronta' : 'prontas'} para colher` });
  return r;
});
PRECO_HORTA.esterco = 5;
PRECO_HORTA.regadorzinho = 30;
PRECO_HORTA_SO_SE.regadorzinho = () => G.horta && G.horta.pedidoFilhos && !G.horta.filhos && G.mochila.total('regadorzinho') < 1;
// O carimbo de caprichado sobe por cima da planta colhida e some (a arte ui/carimbo_caprichado, só posição e transparência).
const CARIMBOS = [];
ATUALIZADORES.push(dt => { for (const c of CARIMBOS) c.t += dt; for (let i = CARIMBOS.length - 1; i >= 0; i--) if (CARIMBOS[i].t > 1.2) CARIMBOS.splice(i, 1); });
AO_MONTAR.push(b => { if (b.id === 'quintal') b.desenhaPorCima = ctx => { for (const c of CARIMBOS) desenhaPe(ctx, 'ui/carimbo_caprichado', c.x, c.y - c.t * 40, Math.max(0, 1 - c.t / 1.2), 0.5); }; });
