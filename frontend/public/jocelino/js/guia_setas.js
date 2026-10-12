// Jocelino — guia_setas.js — as setas didáticas do guia (teste de 12/10, pedido do jogador: "uma seta mostrando onde
// clicar, onde ir, o que fazer"). Enquanto uma missão do guia está aberta (cada uma acontece uma vez só: a primeira obra, a
// primeira limpeza, o primeiro bico...), a seta (a arte ui/seta, gerada no Higgsfield; o código só gira e balança) mostra:
// - no mapa: o alvo, se está na tela; a borda da tela na direção dele, se está fora; a saída certa, se está em outro mapa;
// - na tela: o que clicar (a ferramenta certa na barra, o "Aceitar" do quadro, o "Adiantar" antes da 1ª janta, a Despensa).
// Sem o guia ("Já conheço o jogo") ou com tudo feito, nada. O "!" some de quem a seta já aponta.

const DET_LIMPAR = ['mato', 'pedra', 'galho', 'toco'];
// O alvo de cada missão: o mapa e quem (morador), o quê (objeto) ou onde (ponto em px de mundo).
function _alvoDaMissao(id) {
  const g = G.guia, m = Guia.missao(id);
  if (m && m.carta && G.correio && G.correio.caixa.includes(m.carta)) return { mapa: 'quintal', objeto: 'caixa_correio' };
  const noSalao = typeof noPalco === 'function' && noPalco();
  switch (id) {
    case 'quintal': {
      if (G.mapaId !== 'quintal' || !G.mapa || !G.jog) return { mapa: 'quintal' };
      let o = null, d = 1e9;
      for (const x of G.mapa.objs) if (x.tipo === 'detrito' && DET_LIMPAR.includes(x.det)) { const dd = Math.hypot(x.x - G.jog.x, x.y - G.jog.y); if (dd < d) { d = dd; o = x; } }
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
      return ac ? { mapa: dadosEmpreita(ac).mapa, objeto: 'emp_' + ac } : { mapa: 'vila', objeto: 'quadro_pedidos' };
    }
    case 'pesca': return { mapa: 'praia', morador: 'lourival' };
    case 'bazar': return { mapa: 'vila', objeto: 'balcao_bazar' };
    case 'pedreira': return { mapa: 'pedreira', morador: 'tonico' };
    case 'mina': return { mapa: 'pedreira', objeto: 'escada_mina' };
  }
  return null;
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
// A seta do mapa: { tipo: 'alvo' | 'saida', x, y (px de mundo), mapa, morador?, objeto?, det?, destino? } ou null.
function guiaSetaMundo() {
  if (!G.mapa || !G.guia || !G.guia.ativo) return null;
  for (const id of _missoesDaSeta()) {
    const a = _alvoDaMissao(id); if (!a) continue;
    if (!a.mapa || a.mapa === G.mapaId) { const p = _posNoMapa(a); if (p) return Object.assign({ tipo: 'alvo', missao: id }, a, p); continue; }
    // Em outro mapa: a saída para lá, ou para a Vila (o centro de tudo).
    const s = (G.mapa.saidas || []).find(x => x.destino === a.mapa) || (G.mapaId !== 'vila' ? (G.mapa.saidas || []).find(x => x.destino === 'vila') : null);
    if (s) return { tipo: 'saida', missao: id, destino: s.destino, mapa: G.mapaId, x: (s.x + s.w / 2) * TILE, y: (s.y + s.h / 2) * TILE - 30 };
  }
  return null;
}
// A seta da tela: { chave, el } ou null (o elemento HTML onde clicar).
function guiaSetaUI() {
  const g = G.guia; if (!g || !g.ativo) return null;
  const barra = i => { const el = document.querySelectorAll('#hud .barra .espaco')[i]; return el ? { chave: 'barra:' + i, el } : null; };
  const slotDe = id => G.mochila.slots.slice(0, 12).findIndex(x => x && x.id === id);
  const mao = typeof itemDaMao === 'function' ? itemDaMao() : '';
  const ab = g.abertas, noSalao = typeof noPalco === 'function' && noPalco();
  // O quadro aberto no primeiro bico (sem serviço aceito ainda): o primeiro "Aceitar".
  if (ab.includes('bico') && !$('#modal').hidden && $('#modal .quadro-vila') && !Object.keys(G.empreitas.aceitas).some(k => dadosEmpreita(k) && dadosEmpreita(k).tipo === 'curta')) {
    const b = [...document.querySelectorAll('#modal button')].find(x => /^Aceitar$/.test(x.textContent.trim())); if (b) return { chave: 'aceitar', el: b };
  }
  if (noSalao) {
    const bt = re => [...document.querySelectorAll('#rodape-palco button')].find(x => re.test(x.textContent));
    if (ab.includes('janta') && !G.turno && typeof pensaoAbreHoje === 'function' && pensaoAbreHoje()) { const b = bt(/Adiantar/); if (b) return { chave: 'adiantar', el: b }; }
    if (ab.includes('domingo')) { const b = bt(/Despensa/); if (b) return { chave: 'despensa', el: b }; }
    return null;
  }
  if (!$('#modal').hidden) return null;
  // A ferramenta certa na barra: a do detrito que a seta aponta, a do serviço aceito, a semente e o regador da horta.
  const sm = guiaSetaMundo();
  if (sm && sm.missao === 'quintal' && sm.det) { const D = DETRITOS[sm.det], ok = mao === D.ferramenta || (D.aceita || []).includes(mao); if (!ok) { const i = slotDe(D.ferramenta); if (i >= 0) return barra(i); } }
  if (sm && sm.missao === 'bico' && sm.objeto && sm.objeto.startsWith('emp_')) { const E = dadosEmpreita(sm.objeto.slice(4)); if (E && E.ferramenta !== 'carga' && mao !== E.ferramenta) { const i = slotDe(E.ferramenta); if (i >= 0) return barra(i); } }
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
// A seta do mapa, desenhada por cima (px de tela): em cima do alvo, balançando; fora da tela, na borda, girada para ele.
DESENHOS_TELA.push(ctx => {
  const s = setaAgora();
  const img = spr('ui/seta'); if (!s || !img || !G.comecou) return;
  const w = img.naturalWidth * 0.8, h = img.naturalHeight * 0.8, z = G.zoom, L = G.larg, A = G.alt;
  const sx = (s.x - G.cam.x) * z, sy = (s.y - G.cam.y) * z, bob = Math.sin((G.agora || 0) * 6) * 8;
  ctx.save();
  // Na tela: em cima do alvo (perto do topo, encostada na borda de cima). Fora: na borda, longe do relógio e do quadro de
  // tarefas (em cima) e da barra (embaixo), girada para o alvo.
  if (sx > 20 && sx < L - 20 && sy > 20 && sy < A - 110) ctx.drawImage(img, sx - w / 2, Math.max(4, sy - h - 6) + bob, w, h);
  else {
    const cx = Math.min(Math.max(sx, 70), L - 70), cy = Math.min(Math.max(sy, 190), A - 160);
    ctx.translate(cx, cy); ctx.rotate(Math.atan2(sy - cy, sx - cx) - Math.PI / 2); ctx.drawImage(img, -w / 2, -h / 2 + bob, w, h);
  }
  ctx.restore();
});
// A seta da tela (HTML por cima de tudo, sem pegar clique), em cima do botão ou do espaço da barra.
setInterval(() => {
  let s = null; try { s = G.comecou ? guiaSetaUI() : null; } catch (e) { s = null; }
  let d = document.getElementById('guia-seta-ui');
  if (!d) { d = el('img', { id: 'guia-seta-ui', class: 'guia-seta-ui', alt: '', src: urlArte('ui/seta') }); d.hidden = true; document.body.append(d); }
  if (!s || !s.el || !s.el.isConnected) { d.hidden = true; return; }
  const r = s.el.getBoundingClientRect(); d.hidden = false;
  d.style.left = Math.round(r.left + r.width / 2 - 27) + 'px'; d.style.top = Math.round(r.top - 80) + 'px';
}, 100);
