// Jocelino — guia_setas.js — as setas didáticas do guia (teste de 12/10, pedido do jogador: "uma seta mostrando onde
// clicar, onde ir, o que fazer"). Enquanto uma missão do guia está aberta (cada uma acontece uma vez só: a primeira obra, a
// primeira limpeza, o primeiro bico...), a seta (a arte ui/seta, gerada no Higgsfield; o código só gira e balança) mostra:
// - no mapa: o alvo, se está na tela; a borda da tela na direção dele, se está fora; a saída certa, se está em outro mapa;
// - na tela: o que clicar (a ferramenta certa na barra, o "Aceitar" do quadro, o "Adiantar" antes da 1ª janta, a Despensa).
// Sem o guia ("Já conheço o jogo") ou com tudo feito, nada. O "!" some de quem a seta já aponta.

const DET_LIMPAR = ['mato', 'pedra', 'galho', 'toco'];
// O alvo de cada missão: o mapa e quem (morador), o quê (objeto) ou onde (ponto em px de mundo).
// O detrito mais perto (com peso), preferindo o que não fica escondido atrás da barra ou do quadro de tarefas (vistoria de 12/10).
function _maisPerto(filtro, peso = () => 1) {
  if (!G.mapa || !G.jog) return null;
  const z = G.zoom || 1, esc = o => G.cam && G.alt && ((o.y - G.cam.y) * z > G.alt - 120 || (o.y - G.cam.y) * z < 110) ? 4 : 1;
  let o = null, d = 1e9;
  for (const x of G.mapa.objs) if (x.tipo === 'detrito' && filtro(x)) { const dd = Math.hypot(x.x - G.jog.x, x.y - G.jog.y) * peso(x) * esc(x); if (dd < d) { d = dd; o = x; } }
  return o;
}
function _alvoDaMissao(id) {
  const g = G.guia, m = Guia.missao(id);
  if (m && m.carta && G.correio && G.correio.caixa.includes(m.carta)) return { mapa: 'quintal', objeto: 'caixa_correio' };
  const noSalao = typeof noPalco === 'function' && noPalco();
  switch (id) {
    case 'quintal': {
      if (G.mapaId !== 'quintal' || !G.mapa || !G.jog) return { mapa: 'quintal' };
      // (o mato some na grama: a seta prefere a pedra, o galho e o toco, que se enxergam; o mato só quando não há outro por perto)
      const o = _maisPerto(x => DET_LIMPAR.includes(x.det), x => (x.det === 'mato' ? 3 : 1));
      return o ? { mapa: 'quintal', ponto: { x: o.x, y: o.y - 56 }, det: o.det } : { mapa: 'quintal' };
    }
    case 'obra': {   // na Vila, a seta segue o passo do Bira (a peneira, o monte, a obra da Zélia); fora, leva até ele
      const p = G.mapaId === 'vila' && typeof guiaPasso === 'function' ? guiaPasso() : null;
      return p && p.alvo ? Object.assign({ mapa: 'vila' }, p.alvo) : { mapa: 'vila', morador: 'bira' };
    }
    case 'vila': { const v = GUIA_VIZINHOS.find(x => !g.conversou.includes(x)); return v ? { mapa: 'vila', morador: v } : null; }
    case 'pensao':
      if (noSalao && G.pensao.estado === 'limpar') { const s = sujeirasDaReforma()[0]; return s ? { mapa: G.mapaId, ponto: { x: s.x, y: s.y - 70 } } : null; }
      if (noSalao) return { mapa: G.mapaId, ponto: { x: PALCO.ROSA.x, y: PALCO.ROSA.y - 250 } };
      return { mapa: 'vila', objeto: 'pensao' };
    case 'horta': { const C = QUINTAL.CANTEIRO; return { mapa: 'quintal', ponto: { x: (C.x + C.w / 2) * TILE, y: C.y * TILE } }; }
    case 'janta': case 'domingo': return noSalao ? null : { mapa: 'vila', objeto: 'pensao' };
    case 'bico': {
      const ac = G.empreitas && Object.keys(G.empreitas.aceitas).find(k => dadosEmpreita(k) && dadosEmpreita(k).tipo === 'curta');
      return ac ? _alvoDaEmpreita(ac) : { mapa: 'vila', objeto: 'quadro_pedidos' };
    }
    case 'gremio': return { mapa: 'vila', objeto: 'gremio' };
    case 'pesca': return { mapa: 'praia', morador: 'lourival' };
    case 'bazar': return { mapa: 'vila', objeto: 'balcao_bazar' };
    case 'pedreira': return { mapa: 'pedreira', morador: 'tonico' };
    case 'mina': return { mapa: 'pedreira', objeto: 'escada_mina' };
  }
  return null;
}
// O alvo de um serviço aceito (teste de 12/10: depois do 1º bico, a calçada pega no quadro ficava sem seta): o lugar de
// verdade, a plaquinha do curto, ou a plaquinha da obra longa com trabalho hoje (ou pronta para entregar).
// Sem o material (vistoria de 12/10: aceitar não pede material, e o golpe só dizia "falta"), a seta busca o material antes:
// o que o depósito vende, no depósito; a madeira e a pedra, no galho, no toco ou na pedra mais perto (é no quintal que nascem;
// sem nenhum lá, a seta fica no serviço e o golpe diz o que falta).
function faltaDaEmpreita(cid) {
  const E = dadosEmpreita(cid), a = G.empreitas && G.empreitas.aceitas[cid]; if (!E || !a || !G.mochila) return null;
  if (E.tipo === 'longa' && a.estado !== 'reservada') return null;
  const mat = E.tipo === 'longa' ? Empreitas.material(cid) : E.material;
  for (const m in mat) { const n = mat[m] - G.mochila.total(m); if (n > 0) return { item: m, n }; }
  return null;
}
const _SOLTA = { madeira: ['galho', 'toco', 'arvore'], pedra: ['pedra', 'pedregulho'] };
function _alvoDoMaterial(f, cid) {
  if (LOJA.PRECOS[f.item] !== undefined) return { mapa: 'vila', objeto: 'deposito', falta: f, empreita: cid, buscar: true };
  const dets = _SOLTA[f.item]; if (!dets) return null;
  const o = _maisPerto(x => dets.includes(x.det));
  if (o) return { mapa: G.mapaId, ponto: { x: o.x, y: o.y - 56 }, det: o.det, falta: f, empreita: cid, buscar: true };
  return G.mapaId === 'quintal' ? null : { mapa: 'quintal', falta: f, empreita: cid, buscar: true };
}
function _alvoDaEmpreita(cid) {
  const E = dadosEmpreita(cid), a = G.empreitas && G.empreitas.aceitas[cid]; if (!E || !a) return null;
  const f = faltaDaEmpreita(cid); if (f) { const m = _alvoDoMaterial(f, cid); if (m) return m; }
  if (E.local) { const A = E.local.area; return { mapa: E.mapa, ponto: { x: (A.x + A.w / 2) * TILE, y: A.y * TILE + 6 }, empreita: cid }; }
  // (a limpeza se faz nos matos e entulhos em volta, não na plaquinha: a seta vai no mais perto do serviço)
  if (E.tipo === 'curta' && typeof LIMPEZA !== 'undefined' && LIMPEZA[cid] && G.mapaId === E.mapa) { const o = _maisPerto(x => x.empreitaDet === cid);
    if (o) return { mapa: E.mapa, ponto: { x: o.x, y: o.y - 56 }, det: o.det, empreita: cid, limpeza: true }; }
  if (E.tipo === 'curta') return { mapa: E.mapa, objeto: 'emp_' + cid, empreita: cid };
  // (a obra longa reservada também: com o material, a plaquinha é onde se começa; os aluguéis por começar são opcionais)
  if (E.tipo === 'longa' && ((a.estado === 'obra' && !a.trabalhou) || a.estado === 'pronta' || (a.estado === 'reservada' && typeof E.familia !== 'string'))) return { mapa: E.mapa, objeto: 'emp_placa_' + cid, empreita: cid };
  return null;
}
function _servicosDaSeta() {
  if (!G.empreitas) return [];
  const ids = Object.keys(G.empreitas.aceitas);
  return ids.filter(k => dadosEmpreita(k) && dadosEmpreita(k).tipo === 'curta').concat(ids.filter(k => dadosEmpreita(k) && dadosEmpreita(k).tipo !== 'curta'));
}
// A ordem: na hora da obra (das 7h ao meio-dia, lista por receber), a obra vem antes de tudo; depois, a ordem das abertas.
function _missoesDaSeta() {
  const g = G.guia; if (!g || !g.ativo) return [];
  const ab = g.abertas.slice(), obraAgora = ab.includes('obra') && typeof Obra !== 'undefined' && !Obra.aberta(G.dia, G.minutos);
  return obraAgora ? ['obra', ...ab.filter(x => x !== 'obra')] : ab;
}
// A posição (px de mundo) de um alvo no mapa de agora, ou null.
function _posNoMapa(a) {
  if (!G.mapa) return null;
  if (a.ponto) return a.ponto;
  if (a.morador) { const p = (G.mapa.moradores || []).find(x => x.id === a.morador && x.visivel !== false); return p ? { x: p.x, y: p.y - 140 } : null; }
  if (a.objeto) { const o = G.mapa.objs.find(x => x.id === a.objeto); if (!o) return null; const linhas = new Set((o.tiles || [{ y: 0 }]).map(t => t.y)).size; return { x: o.x, y: o.y - linhas * TILE - 16 }; }
  return null;
}
// O Jocelino chegou no alvo (a 2 ladrilhos do objeto ou do morador, ou perto do ponto): a seta fixada já cumpriu o papel.
function _chegou(a) {
  if (!G.jog || !G.mapa) return false;
  const t = G.jog.ladrilho(), perto = (x, y, d) => Math.max(Math.abs(x - t.x), Math.abs(y - t.y)) <= d;
  if (a.objeto) { const o = G.mapa.objs.find(x => x.id === a.objeto); return !!o && (o.tiles || []).some(q => perto(q.x, q.y, 2)); }
  if (a.morador) { const p = (G.mapa.moradores || []).find(x => x.id === a.morador); return !!p && Math.hypot(p.x - G.jog.x, p.y - G.jog.y) < 2 * TILE; }
  if (a.ponto) return Math.hypot(a.ponto.x - G.jog.x, a.ponto.y - G.jog.y) < 2.5 * TILE;
  return false;
}
// A frase de cada seta (o jogador pediu: "não deixe apenas a seta, coloque algo descrevendo").
const VERBO_DET = { mato: 'capinar o mato', pedra: 'quebrar a pedra', galho: 'cortar o galho', toco: 'cortar o toco', arvore: 'cortar a árvore', pedregulho: 'quebrar a pedra', entulho: 'tirar o entulho' };
const ROTULO_OBJ = { caixa_correio: 'Botão direito: ler a carta', peneira: 'Botão direito: peneirar', monte_tijolos: 'Botão direito: pegar no monte',
  masseira: 'Botão direito: pegar a massa', pilha_ripas: 'Botão direito: pegar as ripas', casa_zelia: 'Botão direito: entregar aqui',
  quadro_pedidos: 'Botão direito: ver os serviços', pensao: 'Botão direito: entrar na pensão', balcao_bazar: 'Botão direito: ver o Bazar',
  escada_mina: 'Botão direito: descer na mina', despensa_pensao: 'Botão direito: abrir a despensa', gremio: 'Botão direito: a lista do povo' };
function _rotulo(a) {
  if (a.rotuloFixo && a.tipo !== 'saida' && !a.det) return a.rotuloFixo;
  if (a.falta && a.tipo !== 'saida') { const q = Itens.qtd(a.falta.n, a.falta.item);
    if (a.objeto === 'deposito') return `Falta ${q}: compre no depósito do Seu Ananias`;
    if (a.det) return `Falta ${q}: use ${NOME_FERRAMENTA[DETRITOS[a.det].ferramenta]} aqui`; }
  if (a.limpeza) { const E = dadosEmpreita(a.empreita), ac = G.empreitas.aceitas[a.empreita];
    return `Use ${NOME_FERRAMENTA[E.ferramenta]} aqui para ${VERBO_DET[a.det] || 'limpar'} (faltam ${E.vezes - ((ac && ac.vezes) || 0)})`; }
  if (a.tipo === 'saida') return `Vá por aqui: ${typeof NOME_LUGAR !== 'undefined' && NOME_LUGAR[a.destino] || a.destino}`;
  if (a.det) { const f = NOME_FERRAMENTA[DETRITOS[a.det].ferramenta]; return `Use ${f} aqui para ${VERBO_DET[a.det] || 'limpar'}`; }
  if (a.morador) { const p = (G.mapa.moradores || []).find(x => x.id === a.morador); return `Botão direito: falar com ${p ? p.nome : a.morador}`; }
  if (a.empreita && dadosEmpreita(a.empreita) && dadosEmpreita(a.empreita).local) { const E = dadosEmpreita(a.empreita); return `Use ${NOME_FERRAMENTA[E.ferramenta] || E.ferramenta} ${E.local.nome} (${E.vezes} vezes)`; }
  if (a.objeto && a.objeto.startsWith('emp_') && !a.objeto.startsWith('emp_placa_')) { const E = dadosEmpreita(a.objeto.slice(4)); if (!E) return 'Botão direito aqui';
    return E.ferramenta !== 'carga' ? `Use ${NOME_FERRAMENTA[E.ferramenta] || E.ferramenta} aqui (${E.vezes} vezes)` : `Botão direito: entregar ${Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ')}`; }
  if (a.objeto && a.objeto.startsWith('emp_placa_')) { const id = a.objeto.slice(10), E = dadosEmpreita(id), st = G.empreitas.aceitas[id] && G.empreitas.aceitas[id].estado, f = Empreitas.ferramentaHoje(id);
    if (!E) return 'Botão direito aqui';
    return st === 'reservada' ? `Botão direito: começar a obra (${E.nome})` : st === 'pronta' ? `Botão direito: entregar a obra (${E.nome})` : f ? `Use ${NOME_FERRAMENTA[f] || f} na plaquinha (${E.nome})` : `Botão direito: ${E.nome}`; }
  if (a.objeto) return ROTULO_OBJ[a.objeto] || 'Botão direito aqui';
  if (a.missao === 'horta') return 'Plante aqui: a semente na mão, botão direito na terra';
  if (a.missao === 'pensao' && G.pensao && G.pensao.estado === 'limpar') return 'Clique na sujeira para limpar';
  if (a.missao === 'pensao') return 'Clique na Rosa: entregar o material';
  return '';
}
// A seta do mapa: { tipo: 'alvo' | 'saida', x, y (px de mundo), mapa, morador?, objeto?, det?, destino? } ou null.
function guiaSetaMundo() {
  if (!G.mapa) return null;
  const cands = [];
  // (Obra do Povo) A linha da caderneta escolhida no Mostrar vem primeiro; acabou a linha, some a seta.
  if (G.guia && G.guia.ativo) for (const id of _missoesDaSeta()) cands.push([id, () => _alvoDaMissao(id)]);
  // (Obra do Povo) A linha da caderneta escolhida no Mostrar (ou na ideia): depois das missões do guia; acabou a linha, ou o
  // Jocelino chegou lá, some a seta (revisão final).
  if (G.setaFixa && typeof Caderneta !== 'undefined') { const l = Caderneta.linha(G.setaFixa);
    if (!l || !l.alvo) G.setaFixa = null; else cands.push(['caderneta', () => { const a = typeof l.alvo === 'function' ? l.alvo() : l.alvo; return a && Object.assign({ rotuloFixo: l.rotulo || l.texto }, a); }]); }
  for (const cid of _servicosDaSeta()) cands.push(['servico', () => _alvoDaEmpreita(cid)]);
  for (const [id, f] of cands) {
    const a = f(); if (!a) continue;
    if (id === 'caderneta' && !a.det && (!a.mapa || a.mapa === G.mapaId) && _chegou(a)) { G.setaFixa = null; continue; }   // (a limpeza do quintal segue o detrito mais perto: não "chega")
    if (!a.mapa || a.mapa === G.mapaId) { const p = _posNoMapa(a); if (p) { const o = Object.assign({ tipo: 'alvo', missao: id }, a, p); o.rotulo = _rotulo(o); return o; } continue; }
    // Em outro mapa: a saída para lá, ou para a Vila (o centro de tudo).
    const s = (G.mapa.saidas || []).find(x => x.destino === a.mapa) || (G.mapaId !== 'vila' ? (G.mapa.saidas || []).find(x => x.destino === 'vila') : null);
    if (s) { const o = { tipo: 'saida', missao: id, destino: s.destino, mapa: G.mapaId, x: (s.x + s.w / 2) * TILE, y: (s.y + s.h / 2) * TILE - 30 }; o.rotulo = _rotulo(o); return o; }
  }
  return null;
}
// A seta da tela: { chave, el } ou null (o elemento HTML onde clicar).
function guiaSetaUI() {
  const g = G.guia || { ativo: false, abertas: [] };
  const barra = i => { const el = document.querySelectorAll('#hud .barra .espaco')[i], it = G.mochila.slots[i]; return el ? { chave: 'barra:' + i, el, rotulo: `Clique aqui: ${it ? (NOME_FERRAMENTA[it.id] || Itens.nome(it.id)).replace(/^(a|o) /, '') : ''}` } : null; };
  const slotDe = id => G.mochila.slots.slice(0, 12).findIndex(x => x && x.id === id);
  const mao = typeof itemDaMao === 'function' ? itemDaMao() : '';
  const ab = g.ativo ? g.abertas : [], noSalao = typeof noPalco === 'function' && noPalco();
  // O quadro aberto no primeiro bico (sem serviço aceito ainda): o primeiro "Aceitar".
  if (ab.includes('bico') && !$('#modal').hidden && $('#modal .quadro-vila') && !Object.keys(G.empreitas.aceitas).some(k => dadosEmpreita(k) && dadosEmpreita(k).tipo === 'curta')) {
    const b = [...document.querySelectorAll('#modal button')].find(x => /^Aceitar$/.test(x.textContent.trim())); if (b) return { chave: 'aceitar', el: b, rotulo: 'Clique em Aceitar' };
  }
  if (noSalao) {
    const bt = re => [...document.querySelectorAll('#rodape-palco button')].find(x => re.test(x.textContent));
    if (ab.includes('janta') && !G.turno && typeof pensaoAbreHoje === 'function' && pensaoAbreHoje()) { const b = bt(/Adiantar/); if (b) return { chave: 'adiantar', el: b, rotulo: 'Clique para pular até as 17h' }; }
    if (ab.includes('domingo')) { const b = bt(/Despensa/); if (b) return { chave: 'despensa', el: b, rotulo: 'Clique para guardar na despensa' }; }
    return null;
  }
  if (!$('#modal').hidden) return null;
  // A ferramenta certa na barra: a do detrito que a seta aponta, a do serviço aceito, a semente e o regador da horta.
  const sm = guiaSetaMundo();
  if (sm && sm.det && (sm.missao === 'quintal' || sm.buscar || sm.missao === 'caderneta')) { const D = DETRITOS[sm.det], ok = mao === D.ferramenta || (D.aceita || []).includes(mao); if (!ok) { const i = slotDe(D.ferramenta); if (i >= 0) return barra(i); } }
  if (sm && sm.empreita && !sm.buscar) { const E = dadosEmpreita(sm.empreita), fe = E && (E.tipo === 'longa' ? Empreitas.ferramentaHoje(sm.empreita) : E.ferramenta);
    if (fe && fe !== 'carga' && mao !== fe) { const i = slotDe(fe); if (i >= 0) return barra(i); } }
  if (sm && sm.missao === 'horta' && G.mapaId === 'quintal') {
    const plantadas = Object.values(G.horta.covas || {}).filter(c => c && c.planta).length;
    const semente = G.mochila.slots.slice(0, 12).find(x => x && /^semente_/.test(x.id));
    if (plantadas < 10 && semente && mao !== semente.id) return barra(slotDe(semente.id));
    if (plantadas >= 10 && mao !== 'regador') { const i = slotDe('regador'); if (i >= 0) return barra(i); }
  }
  return null;
}
// O "!" some de quem a seta já aponta (a seta basta). A seta é calculada uma vez por quadro (cache pelo relógio do jogo).
let _setaAgora = null, _setaT = -1, _setaMapa = '';
function setaAgora() { const t = G.agora || 0; if (t !== _setaT || G.mapaId !== _setaMapa) { _setaT = t; _setaMapa = G.mapaId; try { _setaAgora = guiaSetaMundo(); } catch (e) { _setaAgora = null; } } return _setaAgora; }
{ const m0 = guiaMarcaMorador, o0 = guiaMarcaObjeto;
  guiaMarcaMorador = function (id) { const s = setaAgora(); return !(s && s.morador === id) && m0(id); };
  guiaMarcaObjeto = function (id) { const s = setaAgora(); return !(s && s.objeto === id) && o0(id); }; }
// A seta do quintal vem explicada: a dica do Tio Juca diz o que a seta mostra e a ferramenta, com a tecla.
{ const p0 = guiaPasso; guiaPasso = function () {
  const r = p0(); if (r) return r;
  const g = G.guia; if (!g || !g.ativo || !g.abertas.includes('quintal') || G.mapaId !== 'quintal') return null;
  const s = setaAgora(); if (!s || s.missao !== 'quintal' || !s.det) return null;
  const D = DETRITOS[s.det], i = G.mochila.slots.slice(0, 12).findIndex(x => x && x.id === D.ferramenta), m = Guia.missao('quintal');
  const nome = { mato: 'o mato', pedra: 'a pedra', galho: 'o galho', toco: 'o toco' }[s.det] || 'isso', tecla = i >= 0 && i < 10 ? ` (tecla ${(i + 1) % 10})` : '';
  return { id: 'juca', nome: 'Tio Juca', texto: `Limpe ${nome} que a seta mostra: escolha ${NOME_FERRAMENTA[D.ferramenta]}${tecla} e clique em cima. Faltam ${m.meta - Guia.progresso(m)}.`, alvo: null };
}; }
// A seta do mapa, desenhada por cima (px de tela): em cima do alvo, balançando; fora da tela, na borda, girada para ele.
DESENHOS_TELA.push(ctx => {
  const s = setaAgora();
  const img = spr('ui/seta'); if (!s || !img || !G.comecou) return;
  const w = img.naturalWidth * 0.8, h = img.naturalHeight * 0.8, z = G.zoom, L = G.larg, A = G.alt;
  const sx = (s.x - G.cam.x) * z, sy = (s.y - G.cam.y) * z, bob = Math.sin((G.agora || 0) * 6) * 8;
  // (a frase inteira na tela: a frase longa, encostada na borda, saía cortada; vistoria de 12/10)
  ctx.save(); ctx.font = '900 17px Nunito'; const meia = s.rotulo ? ctx.measureText(s.rotulo).width / 2 + 14 : 0; ctx.restore();
  // (no alto, a frase não entra por baixo do relógio, à direita)
  const xr = (x, y) => Math.min(Math.max(x, meia), L - meia - (y < 240 ? 190 : 0));
  ctx.save();
  // Na tela: em cima do alvo (perto do topo, encostada na borda de cima). Fora: na borda, longe do relógio e do quadro de
  // tarefas (em cima) e da barra (embaixo), girada para o alvo.
  if (sx > 20 && sx < L - 20 && sy > 20 && sy < A - 110) {
    const top = Math.max(4, sy - h - 6) + bob; ctx.drawImage(img, sx - w / 2, top, w, h);
    const ty = top > 130 ? top - 8 : top + h + 22;
    if (s.rotulo) texto(ctx, s.rotulo, xr(sx, ty), ty, 17, '#fff4cf', '900');
  }
  else {
    const cx = Math.min(Math.max(sx, 70), L - 70), cy = Math.min(Math.max(sy, 190), A - 160);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(sy - cy, sx - cx) - Math.PI / 2); ctx.drawImage(img, -w / 2, -h / 2 + bob, w, h); ctx.restore();
    // (a seta na borda de baixo: a frase vai em cima dela, longe da barra)
    const ty = cy + h / 2 + 24 > A - 105 ? cy - h / 2 - 12 : cy + h / 2 + 24;
    if (s.rotulo) texto(ctx, s.rotulo, xr(cx, ty), ty, 17, '#fff4cf', '900');
  }
  ctx.restore();
});
// A seta da tela (HTML por cima de tudo, sem pegar clique), em cima do botão ou do espaço da barra.
setInterval(() => {
  let s = null; try { s = G.comecou ? guiaSetaUI() : null; } catch (e) { s = null; }
  let d = document.getElementById('guia-seta-ui');
  if (!d) { d = el('img', { id: 'guia-seta-ui', class: 'guia-seta-ui', alt: '', src: urlArte('ui/seta') }); d.hidden = true; document.body.append(d); }
  let t = document.getElementById('guia-seta-ui-rotulo');
  if (!t) { t = el('div', { id: 'guia-seta-ui-rotulo', class: 'guia-seta-ui-rotulo' }); t.hidden = true; document.body.append(t); }
  if (!s || !s.el || !s.el.isConnected) { d.hidden = true; t.hidden = true; return; }
  const r = s.el.getBoundingClientRect(); d.hidden = false;
  t.hidden = !s.rotulo; t.textContent = s.rotulo || ''; t.style.left = Math.round(r.left + r.width / 2) + 'px'; t.style.top = Math.round(r.top - 112) + 'px';
  d.style.left = Math.round(r.left + r.width / 2 - 27) + 'px'; d.style.top = Math.round(r.top - 80) + 'px';
}, 100);
