// Jocelino — horta_jogo.js — a horta no quintal (mapa_quintal.gd do Godot, horta): as covas desenhadas no chão (terra
// cavada e molhada), as plantas como objetos (a arte da fase), a pá cavando a grama, a semente plantando com o botão
// direito, o regador molhando (a água acaba e o barril enche), a colheita, a foice arrancando, a noite e as tarefas.

const xpColheita = id => Math.max(2, Math.round(CULTURAS[id].venda / 4));   // colher dá Roça pelo valor
const ACOES_NO_CHAO = [];   // outras ações no chão (o covo da pesca)
const ALCANCE_HORTA = 1;   // ladrilhos em volta do Jocelino (o alvo do Stardew)
const perto1 = t => { const p = G.jog.ladrilho(); return Math.max(Math.abs(t.x - p.x), Math.abs(t.y - p.y)) <= ALCANCE_HORTA; };
function podeCavar(b, x, y) {
  return b.id === 'quintal' && b.livreEm(x, y) && b.chaoEm(x, y) === CH.GRAMA && !b.ocupado.has(chaveT(x, y)) && !b.saidaEm(x, y)
    && !reservadoQuintal(x, y) && !Horta.cova(x, y);
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
    if (!o) { o = b.interativo('planta', '', x, y, 1, 1, null, false); o.covaX = x; o.covaY = y; o.acao = () => colherPlanta(o); o.ferramenta = (p, id) => ferramentaNaPlanta(p, id);
      o.desenha = ctx => desenhaFolhas(ctx, o); o.ordemY = (y + 0.5) * TILE; }
    o.nome = `objetos/planta_${c.planta}_${Horta.estagio(c)}`;
  }
}
// (13/10: "o Jocelino parece afundado na terra") A arte da planta traz o montinho de terra pintado embaixo; desenhada inteira na
// ordem por altura, o montinho cobria as pernas de quem estava na cova. Como no Stardew (a terra cavada é chão; só a planta entra
// na ordem), a arte é desenhada em duas faixas, sem pintar nada: os TERRA_PLANTA px de baixo (o montinho) no chão, junto com as
// covas, e o resto (as folhas) na ordem, pelo meio do ladrilho — quem pisa na metade de cima da cova fica atrás das folhas, na de
// baixo fica na frente. A muda (fase 1, menos a do tomate, que já tem a estaca) e a abóbora (rasteira, num quadrado de terra que
// é a arte inteira) vão todas para o chão: nunca cobrem as pernas de ninguém.
const TERRA_PLANTA = 26;
const plantaRasteira = c => c.planta === 'abobora' || (Horta.estagio(c) === 1 && c.planta !== 'tomate');
// (13/10: "a de café não dá para regar, não muda a cor") A arte da planta traz o montinho de terra pintado, que cobre a cova: a
// terra molhada ficava por baixo dele (na abóbora, um quadrado de terra cor de pó de café, 88% a 96% do ladrilho; nas outras,
// de 45% a 83%), e regar não mudava nada à vista. Como no Stardew (a terra regada escurece debaixo da planta), a cova molhada
// escurece também a terra da arte: só luz, sem pintar nada — a mesma arte, com os pixels de terra (marrons e escuros: nem
// folha, nem flor, nem fruto, nem a estaca clara do tomate) multiplicados pela razão terra molhada/terra cavada. A máscara
// escurecida é feita uma vez por arte e desenhada por cima do mesmo pedaço. (revisão: só na faixa de baixo, a base TERRA_PLANTA —
// a espiga, as raízes, a estaca e as sombras de cima não escurecem; a planta rasteira é toda chão, a máscara pega a arte inteira)
const LUZ_MOLHADA = [0.68, 0.66, 0.8];   // terra_molhada ÷ terra_cavada (a média das duas texturas: 74/110, 34/52, 14/17)
const _terraMolhada = {};
const ehTerra = (r, g, b) => r > g && g >= b && Math.max(r, g, b) < 150 && r - b > 25;
function terraMolhadaDe(nome) {
  if (_terraMolhada[nome] !== undefined) return _terraMolhada[nome];
  const img = spr(nome); if (!img || !img.naturalWidth) return null;   // (a arte ainda carregando: tenta no próximo quadro)
  let cv = null;
  try {
    cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const c2 = cv.getContext('2d'); c2.drawImage(img, 0, 0);
    const d = c2.getImageData(0, 0, cv.width, cv.height), p = d.data, rasteira = /planta_abobora_/.test(nome) || (/_1$/.test(nome) && !/tomate/.test(nome));
    const base = rasteira ? 0 : cv.height - Math.min(TERRA_PLANTA, cv.height);
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] && i / 4 / cv.width >= base && ehTerra(p[i], p[i + 1], p[i + 2])) { p[i] *= LUZ_MOLHADA[0]; p[i + 1] *= LUZ_MOLHADA[1]; p[i + 2] *= LUZ_MOLHADA[2]; }
      else p[i + 3] = 0;
    }
    c2.putImageData(d, 0, 0);
  } catch (e) { cv = null; }
  _terraMolhada[nome] = cv; return cv;
}
// Desenha o pedaço (sx, sy, sw, sh) da arte e, com a cova molhada, a terra escurecida por cima.
function desenhaPedacoPlanta(ctx, c, nome, img, sx, sy, sw, sh, dx, dy) {
  const m = Horta.molhada(c, G.dia) ? terraMolhadaDe(nome) : null, inteira = !sy && sh === img.naturalHeight;
  for (const a of m ? [img, m] : [img]) if (inteira) ctx.drawImage(a, dx, dy, sw, sh); else ctx.drawImage(a, sx, sy, sw, sh, dx, dy, sw, sh);
}
function desenhaTerraDaPlanta(ctx, c, x, y) {
  const nome = `objetos/planta_${c.planta}_${Horta.estagio(c)}`, img = spr(nome); if (!img) return;
  const w = img.naturalWidth, h = img.naturalHeight, px = (x + 0.5) * TILE - w / 2, base = (y + 1) * TILE;
  if (plantaRasteira(c)) { desenhaPedacoPlanta(ctx, c, nome, img, 0, 0, w, h, px, base - h); return; }
  const t = Math.min(TERRA_PLANTA, h);
  desenhaPedacoPlanta(ctx, c, nome, img, 0, h - t, w, t, px, base - t);
}
function desenhaFolhas(ctx, o) {
  const c = Horta.cova(o.covaX, o.covaY), img = spr(o.nome); if (!c || !c.planta || !img || plantaRasteira(c)) return;
  const w = img.naturalWidth, h = img.naturalHeight, t = Math.min(TERRA_PLANTA, h);
  if (h > t) desenhaPedacoPlanta(ctx, c, o.nome, img, 0, 0, w, h - t, o.x - w / 2, o.y - h);
}
// O chão da horta: terra cavada, molhada quando regada (ou com chuva); o esterco por cima da cova adubada.
function desenhaCovas(ctx) {
  for (const k in G.horta.covas) {
    const c = G.horta.covas[k], [x, y] = k.split(',').map(Number);
    const img = spr(Horta.molhada(c, G.dia) ? 'texturas/terra_molhada' : 'texturas/terra_cavada');
    if (img) ctx.drawImage(img, x * TILE, y * TILE, TILE, TILE);
    if (c.adubo && !c.planta) desenhaPe(ctx, 'itens/esterco', (x + 0.5) * TILE, (y + 0.85) * TILE, 1, 0.5);
  }
  // o montinho de terra das plantas (e a planta rasteira inteira), por cima das covas e por baixo de quem anda (de cima para baixo:
  // a abóbora, 6 px mais alta que o ladrilho, fica por baixo do montinho da cova de baixo)
  const plantadas = Object.keys(G.horta.covas).filter(k => G.horta.covas[k].planta).map(k => k.split(',').map(Number)).sort((a, b) => a[1] - b[1]);
  for (const [x, y] of plantadas) desenhaTerraDaPlanta(ctx, G.horta.covas[chaveH(x, y)], x, y);
  if (typeof desenhaAlcanceIrrigador === 'function') desenhaAlcanceIrrigador(ctx);   // (quintal_coisas.js) o irrigador na mão
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
  if (id === 'pa' && podeCavar(b, alvo.x, alvo.y)) { Horta.cavar(alvo.x, alvo.y); if (G.limpou) G.limpou.aula_pa_chao = (G.limpou.aula_pa_chao || 0) + 1; sons.tocar('terra', 1, 0.1, -6); lascas((alvo.x + 0.5) * TILE, (alvo.y + 0.5) * TILE, 'terra'); return true; }
  if (id === 'regador' && Horta.cova(alvo.x, alvo.y)) { regarCova(alvo.x, alvo.y); return true; }
  // (o barril na mochila: o regador na grama procurando onde encher ouve onde está o barril)
  if (id === 'regador' && !G.horta.barril && G.horta.agua < Horta.aguaMax()) { avisar(AVISO_BARRIL_NA_MOCHILA + '.'); return false; }
  return false;
}
function regarCova(x, y) {
  const r = Horta.regar(x, y);
  if (r === 'vazio') { avisar(G.horta.barril ? 'O regador está vazio: encha no barril d\'água.' : AVISO_BARRIL_NA_MOCHILA + '.'); return; }
  if (r === 'ok') { Habilidades.ganhar('roca', 1); if (G.limpou) G.limpou.aula_regador_chao = (G.limpou.aula_regador_chao || 0) + 1; }
  lascas((x + 0.5) * TILE, (y + 0.5) * TILE, 'agua'); sons.tocar('agua', 1, 0.1, -4); hudSujo();
}
// O botão direito no chão: a semente planta na cova (e o esterco aduba, na entrega B).
function acaoNoChao(t) {
  for (const f of ACOES_NO_CHAO) if (f(t)) return true;
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
// O que a planta da cova é (a placa do botão direito e a etiqueta do mouse): o nome, os dias e a água.
function estadoDaPlanta(c) {
  if (!c || !c.planta) return null;
  const nome = Itens.nome(c.planta);
  if (Horta.madura(c)) return { nome, fase: 'pronta para colher', molhada: true, agua: '' };
  const molhada = Horta.molhada(c, G.dia);
  return { nome, fase: `${c.dias} de ${Horta.diasPara(c.planta)} dias`, molhada, agua: molhada ? 'regada hoje' : 'precisa de água' };
}
function colherPlanta(o) {
  const c = Horta.cova(o.covaX, o.covaY);
  if (!c || !c.planta) return true;
  if (!Horta.madura(c)) { const e = estadoDaPlanta(c); abrirPlaca(`${e.nome}: ${e.fase}${e.molhada ? ' (regada hoje)' : ' — precisa de água'}.`); return true; }
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
  if (id === 'foice' && Horta.madura(Horta.cova(o.covaX, o.covaY))) { colherPlanta(o); return; }   // a foice do Stardew colhe a madura
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
function precoSemente(id) { const c = culturaDaSemente(id); const base = c ? CULTURAS[c].preco * ECO.horta.fatorSemente : PRECO_HORTA[id]; return Math.max(1, Math.round(base * (G.fatorPreco || 1) * descontoHab())); }
function sementesDaLoja() { return Object.values(CULTURAS).filter(C => C.estacoes.includes(estacaoDoDia(G.dia))).map(C => C.semente).concat(Object.keys(PRECO_HORTA).filter(id => !PRECO_HORTA_SO_SE[id] || PRECO_HORTA_SO_SE[id]())); }
CARTAS.juca_horta = { de: 'Tio Juca', dia: 2, anexo: { semente_alface: 10 },
  texto: 'Jocelino, arrumei um canteirinho do lado de casa. Planta, rega todo dia, que a Rosa aproveita na pensão. Vai junto um pacote de semente de alface. Pá cava, semente planta, regador rega. A chuva rega por você.' };
TAREFAS.push(() => {
  if (!G.horta) return [];
  const pl = Object.values(G.horta.covas).filter(c => c.planta), r = [];
  const secas = pl.filter(c => !Horta.molhada(c, G.dia)).length, prontas = pl.filter(c => Horta.madura(c)).length;
  if (secas && G.horta.agua <= 0) r.push({ texto: G.horta.barril ? 'Horta: encher o regador no barril' : 'Horta: colocar o barril no quintal (o regador enche nele)', mapa: 'quintal' });
  else if (secas) r.push({ texto: 'Horta: regar', feito: pl.length - secas, meta: pl.length, mapa: 'quintal' });
  if (prontas) r.push({ texto: `Horta: ${prontas} ${prontas === 1 ? 'pronta' : 'prontas'} para colher`, mapa: 'quintal' });
  return r;
});
PRECO_HORTA.esterco = 5;
PRECO_HORTA.regadorzinho = 30;
PRECO_HORTA_SO_SE.regadorzinho = () => G.horta && G.horta.pedidoFilhos && !G.horta.filhos && G.mochila.total('regadorzinho') < 1;
// O carimbo de caprichado sobe por cima da planta colhida e some (a arte ui/carimbo_caprichado, só posição e transparência).
const CARIMBOS = [];
ATUALIZADORES.push(dt => { for (const c of CARIMBOS) c.t += dt; for (let i = CARIMBOS.length - 1; i >= 0; i--) if (CARIMBOS[i].t > 1.2) CARIMBOS.splice(i, 1); });
// ---------- a etiqueta da planta (pedido de 13/10: "colocar o mouse em cima da plantação e mostrar qual plantação é aquela") ----------
// Como é no Stardew: o jogo puro não mostra nada ao passar o mouse na lavoura; o mod mais usado (UI Info Suite) mostra o nome e
// os dias que faltam numa etiqueta perto do mouse. Aqui igual: o mouse parado um instante numa cova plantada mostra o nome, os
// dias e a água (o mesmo texto da placa do botão direito). É interface (HTML, como o cartão): some quando o mouse sai da cova ou
// da tela, e com janela aberta. Atualizada no desenho (que roda também com o jogo pausado, para sumir quando abre um menu).
const ETIQUETA_ESPERA = 0.2;   // segundos com o mouse na mesma cova
const _etq = { el: null, chave: '', t: 0, naTela: false, ultimo: 0 };
addEventListener('mousemove', e => { _etq.naTela = !!e.target && e.target.id === 'tela'; });
addEventListener('mouseout', e => { if (!e.relatedTarget) _etq.naTela = false; });   // (saiu da janela)
function plantaSobOMouse() {
  if (!G.comecou || G.mapaId !== 'quintal' || !G.horta || !G.mouse || !_etq.naTela) return null;
  if ((typeof menuAberto === 'function' && menuAberto()) || (typeof noPalco === 'function' && noPalco())) return null;
  const t = ladrilhoDoMouse(), c = Horta.cova(t.x, t.y);
  return c && c.planta ? { x: t.x, y: t.y, c } : null;
}
function etiquetaDaPlanta() {
  const p = plantaSobOMouse(), agora = performance.now() / 1000, dt = Math.min(0.1, agora - (_etq.ultimo || agora)); _etq.ultimo = agora;
  const chave = p ? p.x + ',' + p.y : '';
  if (chave !== _etq.chave) { _etq.chave = chave; _etq.t = 0; } else _etq.t += dt;
  const e = p && _etq.t >= ETIQUETA_ESPERA ? estadoDaPlanta(p.c) : null;
  if (!e) { if (_etq.el) _etq.el.hidden = true; return; }
  if (!_etq.el) { _etq.el = el('div', { class: 'etiqueta-planta' }); document.body.append(_etq.el); }
  const txt = `${e.nome} — ${e.fase}` + (e.agua ? '|' + e.agua : '');
  if (_etq.el._txt !== txt) { _etq.el._txt = txt; _etq.el.innerHTML = ''; _etq.el.append(el('b', {}, `${e.nome} — ${e.fase}`)); if (e.agua) _etq.el.append(el('div', { class: e.molhada ? 'regada' : 'seca' }, e.agua)); }
  _etq.el.hidden = false;
  _etq.el.style.left = Math.min(G.mouse.x + 18, innerWidth - _etq.el.offsetWidth - 6) + 'px';
  _etq.el.style.top = Math.min(G.mouse.y + 20, innerHeight - _etq.el.offsetHeight - 6) + 'px';
}
DESENHOS_TELA.push(() => etiquetaDaPlanta());
AO_MONTAR.push(b => { if (b.id === 'quintal') b.desenhaPorCima = ctx => { if (typeof desenhaAlcanceIrrigador === 'function') desenhaAlcanceIrrigador(ctx, true); for (const c of CARIMBOS) desenhaPe(ctx, 'ui/carimbo_caprichado', c.x, c.y - c.t * 40, Math.max(0, 1 - c.t / 1.2), 0.5); }; });
