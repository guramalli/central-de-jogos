// Jocelino — bau.js — o baú (14/10, o jogador: "quando meu inventário fica cheio, onde posso guardar itens?").
// Como no Stardew: o baú é a primeira coisa que se faz com madeira (aqui o Tio Juca faz, ECO.quintal.bau madeiras); vai no
// quintal ou dentro de casa, quantos o jogador quiser; a tela mostra o baú em cima e a mochila embaixo; o clique passa a pilha
// de um lado para o outro, o Shift+clique passa todas as pilhas daquele item e "Juntar iguais" guarda no baú o que já tem nele.
// O baú vazio se recolhe com o machado ou a picareta. Cada casa já vem com um baú dela, fixo, encostado na parede; na mudança
// para a casa nova, o que estava no da casa velha passa para o da nova. Cada baú é uma Mochila (adicionar devolve o que não
// coube): nada se perde nem se duplica. No save: o mapa, a posição e os espaços de cada um.

ITENS.bau.descricao = 'Guarda 36 coisas. No quintal ou dentro de casa: com ele na mão, botão direito num chão livre para colocar. Vazio, o machado ou a picareta recolhe.';
// O baú fixo de cada casa: um chão livre encostado na parede (fora dos móveis pintados e dos caminhos).
CASAS.casa_juca_dentro.bau = { x: 18, y: 3 };      // no canto da direita, debaixo da prateleira das panelas
CASAS.casa_familia_dentro.bau = { x: 9, y: 2 };    // no canto da cozinha, encostado na parede do meio

// G.baus = [{ mapa, x, y, fixo, m: Mochila }]
const bausDe = mapaId => (G.baus || []).filter(b => b.mapa === mapaId);
const bauEm = (mapaId, x, y) => (G.baus || []).find(b => b.mapa === mapaId && b.x === x && b.y === y) || null;
const bauFixo = mapaId => (G.baus || []).find(b => b.fixo && b.mapa === mapaId) || null;
const bauVazio = b => b.m.slots.every(s => !s);
const ondeVaiBau = id => id === 'quintal' || !!CASAS[id];
function novoBau(mapa, x, y, fixo, slots) { const m = new Mochila(); m.deDict({ slots: slots || [] }); return { mapa, x, y, fixo: !!fixo, m }; }
// As duas casas sempre têm o baú delas (o save antigo ganha os dois, vazios).
function garanteBausFixos() { for (const id in CASAS) if (CASAS[id].bau && !bauFixo(id)) G.baus.push(novoBau(id, CASAS[id].bau.x, CASAS[id].bau.y, true)); }

INICIADORES.push(s => {
  G.baus = (Array.isArray(s.baus) ? s.baus : []).filter(b => b && ondeVaiBau(b.mapa) && Number.isInteger(b.x) && Number.isInteger(b.y))
    .map(b => novoBau(b.mapa, b.x, b.y, b.fixo, b.slots));
  G.bausMudou = !!s.bausMudou;
  garanteBausFixos();
  for (const id in MAPAS) poeBaus(MAPAS[id]);   // (o mapa que outro iniciador já montou)
});
COLETORES.push(s => { s.baus = (G.baus || []).map(b => ({ mapa: b.mapa, x: b.x, y: b.y, fixo: b.fixo, slots: b.m.paraDict().slots })); s.bausMudou = !!G.bausMudou; });

// ---------- no mapa ----------
function poeBaus(b) {
  if (!b || !ondeVaiBau(b.id) || !G.baus) return;
  for (const o of b.objs.filter(o => o.id === 'bau')) b.tirar(o);
  for (const bau of bausDe(b.id)) {
    const oc = b.ocupado.get(chaveT(bau.x, bau.y)); if (oc && oc.tipo === 'detrito') b.tirar(oc);
    const o = b.interativo('bau', 'objetos/bau', bau.x, bau.y, 1, 1, [16, 10]);
    Object.assign(o, { bau, cx: bau.x, cy: bau.y });
    o.acao = () => { abrirBau(bau); return true; };
    o.ferramenta = (q, id) => { if (id === 'machado' || id === 'picareta') recolherBau(o); };
  }
}
AO_MONTAR.push(b => poeBaus(b));

// A mudança: o que estava no baú da casa velha vai para o da casa nova (o que não couber fica no velho).
function mudaBauDeCasa() {
  if (G.bausMudou || !G.baus || typeof CasaFamilia === 'undefined' || !CasaFamilia.mudou()) return 0;
  garanteBausFixos();
  const velho = bauFixo('casa_juca_dentro'), novo = bauFixo('casa_familia_dentro'); let n = 0;
  if (velho && novo) for (let i = 0; i < Mochila.TAM; i++) { const s = velho.m.slots[i]; if (!s) continue;
    const sobra = novo.m.adicionar(s.id, s.qtd); n += s.qtd - sobra; s.qtd = sobra; if (!sobra) velho.m.slots[i] = null; }
  G.bausMudou = true;
  return n;
}
ATUALIZADORES.push(() => { if (G.baus && !G.bausMudou) mudaBauDeCasa(); });

// ---------- colocar ----------
const _sobre = (a, d) => a.x < d.x + d.w && a.x + a.w > d.x && a.y < d.y + d.h && a.y + a.h > d.y;
// O baú fecha caminho? Com a caixa dele no chão, todo ladrilho aonde o pé chegava (menos o do próprio baú) tem de continuar
// ao alcance: a porta, a saída, os cômodos e os vãos da cerca (andaveisDe, a mesma busca da rebrota do quintal e da mata).
const _cachePassa = new Map();
function bauFechaPassagem(b, x, y) {
  const chave = `${b.id}:${x},${y}:${b.solidos.length}:${b.objs.length}`;
  if (_cachePassa.has(chave)) return _cachePassa.get(chave);
  const C = CASAS[b.id], o = C ? { x: C.porta.x, y: C.porta.y - 1 } : b.inicio;
  const antes = andaveisDe(b, o.x, o.y), caixa = b._caixa((x + 0.5) * TILE, (y + 1) * TILE, 48, 30);
  b.solidos.push(caixa); const depois = andaveisDe(b, o.x, o.y); b.solidos.splice(b.solidos.indexOf(caixa), 1);
  const k0 = chaveT(x, y); let fecha = false;
  for (const k of antes) if (k !== k0 && !depois.has(k)) { fecha = true; break; }
  if (_cachePassa.size > 400) _cachePassa.clear();
  _cachePassa.set(chave, fecha);
  return fecha;
}
// Motivo para não pôr o baú ('' = pode).
function podeColocarBau(b, x, y) {
  if (!b || !ondeVaiBau(b.id)) return 'O baú vai no quintal ou dentro de casa.';
  const C = CASAS[b.id], perto = (p, d = 1) => p && Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= d;
  if (C) {
    if (!b.livreEm(x, y) || b.saidaEm(x, y) || b.ocupado.has(chaveT(x, y))) return b.ocupado.has(chaveT(x, y)) ? 'Já tem coisa aí.' : 'Aqui não dá.';
    if (perto({ x: C.porta.x, y: C.porta.y - 1 }) || perto(C.acorda)) return 'Aí não: é o caminho da porta e da cama.';
    if (bate({ x: x * TILE + 4, y: y * TILE + 10, w: TILE - 8, h: TILE - 14 }, b)) return 'Aí tem móvel.';
    const cx = b._caixa((x + 0.5) * TILE, (y + 1) * TILE, 48, 30);
    if (G.jog && G.mapa === b && _sobre(cx, G.jog.caixa())) return 'O Jocelino está em cima.';
    if (b.moradores.some(m => m.visivel !== false && _sobre(cx, { x: m.x - 14, y: m.y - 14, w: 28, h: 14 }))) return 'Tem gente aí.';
  } else {
    const m = podeColocar(b, x, y); if (m) return m;
    if (Horta.cova(x, y)) return 'Na cova não: escolha a grama.';
    const portas = [{ x: 7, y: 10 }, b.inicio, typeof CasaFamilia !== 'undefined' && CasaFamilia.mudou() ? CasaFamilia.porta() : null];
    if (portas.some(p => perto(p))) return 'Na frente da porta não: o caminho fica livre.';
  }
  // (nem na frente do que se usa: a cama, a plaquinha, a caixa de venda; baú do lado de baú pode, como no Stardew)
  if (b.objs.some(o => o.tipo === 'inter' && o.acao && o.id !== 'bau' && (o.tiles || []).some(t => t.x === x && (t.y === y || t.y === y - 1)))) return 'Na frente do que se usa não.';
  if (bauFechaPassagem(b, x, y)) return 'Aí fecha a passagem.';
  return '';
}
function colocarBau(x, y) {
  const b = G.mapa, m = podeColocarBau(b, x, y); if (m) { avisar(m); return false; }
  if (!G.mochila.remover('bau', 1)) return false;
  G.baus.push(novoBau(b.id, x, y, false));
  if (G.limpou) G.limpou.bau_colocado = (G.limpou.bau_colocado || 0) + 1;
  poeBaus(b); sons.tocar('pousar', 1, 0.05, -4); hudSujo();
  return true;
}
// Botão direito no chão com o baú na mão (no quintal e nas casas).
ACOES_NO_CHAO.push(t => {
  if (!G.mapa || !G.jog || itemDaMao() !== 'bau') return false;
  if (!ondeVaiBau(G.mapa.id)) { avisar('O baú vai no quintal ou dentro de casa.'); return true; }
  if (G.jog.carga && G.jog.carga.id) { avisar('Primeiro largue o que está carregando.'); return true; }
  if (!perto1(t)) { avisar('Chegue mais perto.'); return true; }
  colocarBau(t.x, t.y); return true;
});
// O machado ou a picareta: o baú vazio volta para a mochila; com coisa dentro, ele só treme. O da casa não sai.
function recolherBau(o) {
  const bau = o.bau; o.treme = 0.25;
  if (bau.fixo) { sons.tocar('madeira', 1.6, 0.05, -10); avisar('Esse é o baú da casa: ele fica aqui.'); return false; }
  if (!bauVazio(bau)) { sons.tocar('madeira', 1.6, 0.05, -10); avisar('Esvazie o baú antes de recolher.'); return false; }
  G.baus = G.baus.filter(b => b !== bau);
  poeBaus(G.mapa);
  const sobra = G.mochila.adicionar('bau', 1); if (sobra) soltar('bau', 1, o.x, o.y - 10);
  sons.tocar('madeira', 1, 0.05, -4); hudSujo(); avisar(sobra ? 'O baú ficou no chão: a mochila está cheia.' : 'O baú foi para a mochila.');
  return true;
}
// O ladrilho do mouse com o baú na mão: verde se dá para pôr, vermelho se não (o mesmo do irrigador e do barril).
EXTRAS_MUNDO.push(m => {
  if (!G.jog || !G.mouse || m !== G.mapa || !ondeVaiBau(m.id) || itemDaMao() !== 'bau' || menuAberto()) return [];
  const t = ladrilhoDoMouse();
  return [{ y: 1e9, desenha(ctx) { ctx.save(); ctx.fillStyle = !podeColocarBau(m, t.x, t.y) && perto1(t) ? 'rgba(80,210,80,0.45)' : 'rgba(225,60,50,0.45)'; ctx.fillRect(t.x * TILE + 3, t.y * TILE + 3, TILE - 6, TILE - 6); ctx.restore(); } }];
});

// ---------- a tela: o baú em cima, a mochila embaixo ----------
// Passa a pilha do espaço i de `de` para `para`; com `um`, só uma unidade. Devolve quanto passou.
function passarPilha(de, para, i, um = false) {
  const s = de.slots[i]; if (!s) return 0;
  const quer = um ? 1 : s.qtd, sobra = para.adicionar(s.id, quer), foi = quer - sobra;
  s.qtd -= foi; if (s.qtd <= 0) de.slots[i] = null;
  return foi;
}
// Shift+clique: todas as pilhas daquele item.
function passarTudoDoItem(de, para, id) { let n = 0; for (let i = 0; i < Mochila.TAM; i++) if (de.slots[i] && de.slots[i].id === id) n += passarPilha(de, para, i); return n; }
// "Juntar iguais": o que já tem no baú sai da mochila e vai para ele (as ferramentas ficam na mochila).
function juntarIguais(bauM, mochila) {
  const ids = new Set(bauM.slots.filter(Boolean).map(s => s.id)); let n = 0;
  for (let i = 0; i < Mochila.TAM; i++) { const s = mochila.slots[i]; if (s && ids.has(s.id) && !Itens.ehFerramenta(s.id)) n += passarPilha(mochila, bauM, i); }
  return n;
}
function abrirBau(bau) {
  { const r = G.mochila.guardarMao(); if (r) soltar(r.id, r.qtd, G.jog.x, G.jog.y); }
  if (G.limpou) G.limpou.bau_aberto = (G.limpou.bau_aberto || 0) + 1;
  const caixa = el('div', { class: 'painel bau-tela' });
  const clicar = (de, para, i, e, um) => {
    const s = de.slots[i]; if (!s) return;
    const id = s.id, foi = e.shiftKey && !um ? passarTudoDoItem(de, para, id) : passarPilha(de, para, i, um);
    if (foi) sons.tocar('pegar', 1.1, 0.03, -8); else avisar(para === G.mochila ? 'A mochila está cheia.' : 'O baú está cheio.');
    hudSujo(); desenha();
  };
  const grade = (m, outra) => el('div', { class: 'bau-grade' }, ...m.slots.map((s, i) => el('div', {
    class: 'espaco' + (m === G.mochila && i < Mochila.BARRA ? ' barra' : ''), title: s ? Itens.nome(s.id) + ' — ' + Itens.descricao(s.id) : '',
    onclick: e => { e.stopPropagation(); clicar(m, outra, i, e, false); },
    oncontextmenu: e => { e.preventDefault(); e.stopPropagation(); clicar(m, outra, i, e, true); } },
    s ? el('img', { src: urlItem(s.id), draggable: 'false' }) : null,
    s && Itens.pilha(s.id) > 1 ? el('div', { class: 'qtd' }, s.qtd) : null)));
  const desenha = () => {
    caixa.innerHTML = '';
    const usados = bau.m.slots.filter(Boolean).length;
    caixa.append(el('div', { class: 'titulo bau-titulo' }, bau.fixo ? 'Baú de casa' : 'Baú', el('span', { class: 'bau-conta' }, ` ${usados} de ${Mochila.TAM}`)),
      grade(bau.m, G.mochila),
      el('div', { class: 'titulo bau-sub' }, 'Mochila'),
      grade(G.mochila, bau.m),
      el('div', { class: 'bau-rodape' },
        el('div', { class: 'rodape' }, 'Clique passa a pilha. Shift+clique passa todas daquele item. Botão direito passa um.'),
        el('button', { class: 'botao', title: 'Guarda no baú o que já tem nele', onclick: e => { e.stopPropagation(); const n = juntarIguais(bau.m, G.mochila); if (n) sons.tocar('pegar', 1, 0.03, -8); else avisar('Nada da mochila combina com o baú.'); hudSujo(); desenha(); } }, 'Juntar iguais'),
        el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa, () => hudSujo());
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}

// ---------- a primeira vez (no Node, sem o guia, fica de fora; seta e frase; G.limpou.bau_colocado e bau_aberto marcam o que já fez) ----------
// O chão livre mais perto do Jocelino para pôr o baú (a seta aponta para ele).
function lugarParaBau() {
  const b = G.mapa, p = G.jog.ladrilho();
  for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
    if (Math.max(Math.abs(dx), Math.abs(dy)) === r && !podeColocarBau(b, p.x + dx, p.y + dy)) return { x: p.x + dx, y: p.y + dy };
  return null;
}
const _feitoBau = k => ((G.limpou || {})[k] || 0) > 0;
const _bauNaMochila = () => !!G.mochila && G.mochila.total('bau') > 0;
// A fase da primeira vez: 'colocar' (ganhou o baú e nunca pôs), 'abrir' (pôs um, ou a mochila encheu, e nunca abriu) ou ''.
function faseDoBau() {
  if (!G.mochila || !G.limpou) return '';
  if (_bauNaMochila() && !_feitoBau('bau_colocado')) return 'colocar';
  if (!_feitoBau('bau_aberto') && (_feitoBau('bau_colocado') || (G.dicasDadas || []).includes('mochila_bau'))) return 'abrir';
  return '';
}
function _alvoDoBau() {
  if (!G.mapa || !G.jog || (typeof noPalco === 'function' && noPalco())) return null;
  const f = faseDoBau();
  if (f === 'colocar') {
    if (itemDaMao() !== 'bau') return null;   // (a seta da tela mostra o baú na barra; o baú guardado não puxa o Jocelino de longe)
    if (!ondeVaiBau(G.mapaId)) return { mapa: 'quintal' };
    const t = lugarParaBau(); return t ? { mapa: G.mapaId, ponto: { x: (t.x + 0.5) * TILE, y: t.y * TILE + 6 }, rotuloFixo: 'Botão direito aqui: pôr o baú' } : null;
  }
  if (f !== 'abrir') return null;
  // o baú mais perto no mapa de agora; senão, o baú de casa
  let o = null, d = 1e9;
  for (const x of G.mapa.objs) if (x.id === 'bau') { const dd = Math.hypot(x.x - G.jog.x, x.y - G.jog.y); if (dd < d) { d = dd; o = x; } }
  if (o) return { mapa: G.mapaId, ponto: { x: o.x, y: o.y - 58 }, rotuloFixo: 'Botão direito: abrir o baú' };
  if (!(G.dicasDadas || []).includes('mochila_bau')) return null;   // (o baú do quintal, em outro mapa, não chama de longe)
  const casa = casaDaFamilia();
  if (G.mapaId === 'quintal') return { mapa: 'quintal', objeto: casa === 'casa_juca_dentro' ? 'casa_juca' : 'casa_familia', rotuloFixo: 'Botão direito: entrar em casa (o baú fica lá dentro)' };
  return { mapa: 'quintal' };
}
if (typeof guiaSetaMundo === 'function') { const s0 = guiaSetaMundo; guiaSetaMundo = function () {
  const a = _alvoDoBau(); if (a) { const s = _setaDe([['bau_vez', a]]); if (s) return s; }
  return s0();
}; }
// Na tela: o baú na barra, quando ainda não está na mão.
if (typeof guiaSetaUI === 'function') { const u0 = guiaSetaUI; guiaSetaUI = function () {
  if (faseDoBau() === 'colocar' && $('#modal').hidden && itemDaMao() !== 'bau' && !(typeof noPalco === 'function' && noPalco())) {
    const i = G.mochila.slots.slice(0, Mochila.BARRA).findIndex(s => s && s.id === 'bau'), e = i >= 0 && document.querySelectorAll('#hud .barra .espaco')[i];
    if (e) return { chave: 'barra:' + i, el: e, rotulo: 'Clique aqui: Baú' };
  }
  return u0();
}; }
// A frase do Tio Juca na caixa de dica.
const FALA_BAU = {
  colocar: 'O baú vai num chão livre do quintal ou de dentro de casa: com ele na mão, chegue perto e clique com o botão direito (o quadrado verde mostra onde dá).',
  colocarBarra: 'Escolha o baú na barra. Se ele não estiver nela, abra a mochila (E) e ponha na primeira fileira.',
  colocarFora: 'O baú vai no quintal ou dentro de casa: lá, com ele na mão, botão direito num chão livre.',
  abrir: 'Botão direito no baú abre: em cima fica o baú, embaixo a mochila. Clique num item para passar de um lado pro outro.',
  casa: 'Mochila cheia? Guarde no baú de casa: entre em casa e clique com o botão direito nele.',
};
if (typeof guiaPasso === 'function') { const p0 = guiaPasso; guiaPasso = function () {
  const f = G.jog && !(typeof noPalco === 'function' && noPalco()) ? faseDoBau() : '';
  if (f === 'colocar') return { id: 'juca', nome: 'Tio Juca', texto: !ondeVaiBau(G.mapaId) ? FALA_BAU.colocarFora : itemDaMao() === 'bau' ? FALA_BAU.colocar : FALA_BAU.colocarBarra, alvo: null };
  if (f === 'abrir') {
    if (G.mapa && G.mapa.objs.some(o => o.id === 'bau')) return { id: 'juca', nome: 'Tio Juca', texto: FALA_BAU.abrir, alvo: null };
    if ((G.dicasDadas || []).includes('mochila_bau')) return { id: 'juca', nome: 'Tio Juca', texto: FALA_BAU.casa, alvo: null };
  }
  return p0();
}; }
