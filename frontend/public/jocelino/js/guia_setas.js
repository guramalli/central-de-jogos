// Jocelino — guia_setas.js — as setas didáticas do guia (teste de 12/10, pedido do jogador: "uma seta mostrando onde
// clicar, onde ir, o que fazer"). Enquanto uma missão do guia está aberta (cada uma acontece uma vez só: a primeira obra, a
// primeira limpeza, o primeiro bico...), a seta (a arte ui/seta, gerada no Higgsfield; o código só gira e balança) mostra:
// - no mapa: o alvo, se está na tela; a borda da tela na direção dele, se está fora; a saída certa, se está em outro mapa;
// - na tela: o que clicar (a ferramenta certa na barra, o "Aceitar" do quadro, o "Adiantar" antes da 1ª janta, a Despensa).
// Sem o guia ("Já conheço o jogo") ou com tudo feito, nada. O "!" some de quem a seta já aponta.

const DET_LIMPAR = ['mato', 'pedra', 'galho', 'toco'];
// O que o Jocelino já aprendeu a limpar (teste de 13/10: "a pessoa já aprendeu a limpar o quintal, não precisa mostrar cada
// pedra e mato… precisa dar o caminho apenas"): depois de 3 de um tipo, a seta não aponta mais o que está na tela — só a
// borda, na direção do mais perto, e a saída para outro mapa. O save antigo (já passou do dia 1) conta como aprendido.
const APRENDE_LIMPAR = 3;
INICIADORES.push(s => { G.limpou = s.limpou ? Object.assign({}, s.limpou) : (s.dia || 1) > 1 ? Object.fromEntries(Object.keys(DETRITOS).concat(['aula_pa_chao', 'aula_regador_chao']).map(d => [d, APRENDE_LIMPAR])) : {}; });   // (o save antigo já passou pela aula de cada ferramenta)
COLETORES.push(s => { s.limpou = Object.assign({}, G.limpou || {}); });
const jaSabeLimpar = det => ((G.limpou || {})[det] || 0) >= APRENDE_LIMPAR;
const _naTela = p => { const z = G.zoom || 1, sx = (p.x - G.cam.x) * z, sy = (p.y - G.cam.y) * z; return sx > 20 && sx < G.larg - 20 && sy > 20 && sy < G.alt - 110; };
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
      if (G.pensao.feitaHoje(G.dia)) return null;   // (revisão final) a reforma de hoje já foi: a seta cede, amanhã tem mais
      if (noSalao && G.pensao.estado === 'limpar') { const s = sujeirasDaReforma()[0]; return s ? { mapa: G.mapaId, ponto: { x: s.x, y: s.y - 70 } } : null; }
      if (noSalao) return _alvoDaReforma(true);
      { const fr = faltaDaReforma(), m = fr && _alvoDoMaterial(fr); if (m) return m; }   // (revisão final) sem o material na mochila: onde buscar
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
// A lista do Bira depois da 1ª obra (diário de 13/10: "não diz onde pegá-las, nem onde entregá-las"): na Vila, a seta mostra
// a tarefa que o Jocelino ainda não fez nenhuma vez — onde pegar e, com o material nos braços, onde levar. Feita uma vez, fica
// só o texto da lista (que diz de onde e para onde).
const ORIGEM_OBRA = { tijolos: 'monte_tijolos', pedras: 'monte_tijolos', telhas: 'monte_tijolos', ripas: 'pilha_ripas', massa: 'masseira', areia: 'peneira' };
const FERRAMENTA_TAREFA = { molhar: 'Use o regador na obra', assentar: 'Use a colher na obra', rebocar: 'Use a colher na obra' };
const jaFezObra = id => ((G.limpou || {})['obra_' + id] || 0) > 0;
function _alvoDaObraDoDia() {
  if (!G.obra || typeof listaDeHoje !== 'function' || Obra.aberta(G.dia, G.minutos)) return null;
  if (G.guia && G.guia.ativo && G.guia.abertas.includes('obra')) return null;   // a 1ª obra tem o passo a passo do guia
  const l = listaDeHoje(); if (!l || l.paga || Obra.completa()) return null;
  const pend = Object.keys(l.metas).filter(k => (l.feito[k] || 0) < l.metas[k] && !jaFezObra(k));
  if (G.mapaId === 'quintal' && pend.includes('buscar_pedra') && !G.mochila.total('pedra')) { const o = _maisPerto(x => x.det === 'pedra'); return o ? { mapa: 'quintal', ponto: { x: o.x, y: o.y - 56 }, det: o.det } : null; }
  if (G.mapaId !== 'vila') return null;
  const ob = G.mapa.objs.find(o => o.obraId && obraDaVez(o)), naObra = rot => ob ? { mapa: 'vila', objeto: ob.id, rotuloFixo: rot } : null;
  const c = G.jog && G.jog.carga;
  if (c && c.id === 'massa' && pend.includes('massa')) return { mapa: 'vila', morador: 'ze', rotuloFixo: 'Botão direito: entregar a massa ao Zé' };
  if (c && CARGA_TAREFA[c.id] && pend.includes(CARGA_TAREFA[c.id])) return naObra('Botão direito: entregar na obra');
  for (const id of pend) {
    if ((id === 'pedras' || id === 'buscar_pedra') && G.mochila.total('pedra') > 0) return naObra('Botão direito: entregar as pedras na obra');
    if (ORIGEM_OBRA[id]) return { mapa: 'vila', objeto: ORIGEM_OBRA[id], rotuloFixo: id === 'areia' ? 'Botão direito na peneira: peneirar a areia'
      : `Botão direito ${{ monte_tijolos: 'no monte', pilha_ripas: 'na pilha', masseira: 'na masseira' }[ORIGEM_OBRA[id]]}: pegar ${{ tijolos: 'os tijolos', pedras: 'as pedras', telhas: 'as telhas', ripas: 'as ripas', massa: 'a massa' }[id]}` };
    if (FERRAMENTA_TAREFA[id]) return naObra(FERRAMENTA_TAREFA[id]);
    if (id === 'entulho' || id === 'capinar') { const det = id === 'entulho' ? 'entulho' : 'mato', o = _maisPerto(x => x.det === det && dentroR(CANTEIRO, x.tiles[0].x, x.tiles[0].y)); if (o) return { mapa: 'vila', ponto: { x: o.x, y: o.y - 56 }, det }; }
    if (id === 'buscar_cimento') return G.mochila.total('cimento') ? { mapa: 'vila', morador: 'bira' } : { mapa: 'vila', objeto: 'deposito', rotuloFixo: 'Botão direito: comprar o cimento' };
  }
  return null;
}
// A janta da pensão, a primeira vez de cada coisa (teste de 13/10: "o cliente chegou, pediu um prato, onde pego o prato, como
// levo, depois pediu bebida, como eu sirvo, como eu levo, como pego os pratos sujos e onde levo para lavar"): a seta vai no
// lugar do passo mais urgente que o Jocelino ainda não fez nenhuma vez — a bacia, o cliente que espera o que está na bandeja,
// o passe, o bebedouro, a louça na banqueta, a farinheira; cada uma some depois de feita uma vez (G.limpou['janta_…']).
const jaFezJanta = k => ((G.limpou || {})['janta_' + k] || 0) > 0;
{ const P = TurnoJanta.prototype;
  for (const [m, k] of [['pegar', 'passe'], ['servir', 'entregar'], ['servirBebida', 'bebida_entregar'], ['encherBebida', 'bebedouro'], ['recolher', 'recolher'], ['largarLouca', 'bacia'], ['reporFarinha', 'farinheira']]) {
    const f = P[m]; P[m] = function (...a) { const r = f.apply(this, a); if ((r === true || r === 'ok' || r > 0) && G.limpou) G.limpou['janta_' + k] = (G.limpou['janta_' + k] || 0) + 1; return r; };
  } }
function _alvoDaJanta() {
  const t = G.turno; if (!t || typeof noPalco !== 'function' || !noPalco() || G.copo) return null;
  const P = PALCO, mesa = (i, rot) => ({ mapa: G.mapaId, ponto: { x: P.ASSENTOS[i].x, y: P.ASSENTOS[i].y - 250 }, rotuloFixo: rot });
  const nos = (i) => i >= 0 && i < P.ASSENTOS.length;
  if (!jaFezJanta('bacia') && t.bandeja.some(x => x.tipo === 'louca')) return { mapa: G.mapaId, ponto: { x: P.BACIA.x + P.BACIA.w / 2, y: P.BACIA.y - 20 }, rotuloFixo: 'Clique na bacia: lavar a louça' };
  if (!jaFezJanta('entregar')) { const x = t.bandeja.find(b => b.tipo === 'prato'), i = x ? t.mesas.findIndex(m => m.estado === 'prato' && m.prato === x.prato) : -1;
    if (nos(i)) return mesa(i, `Clique em ${t.mesas[i].cliente.nome}: entregar ${Pratos.PRATOS[x.prato].nome.toLowerCase()}`); }
  if (!jaFezJanta('bebida_entregar')) { const x = t.bandeja.find(b => b.tipo === 'bebida'), i = x ? t.mesas.findIndex(m => ['prato', 'comendo'].includes(m.estado) && m.querBebida && !m.bebidaServida && m.bebida === x.bebida) : -1;
    if (nos(i)) return mesa(i, `Clique em ${t.mesas[i].cliente.nome}: entregar ${Pratos.BEBIDAS[x.bebida].toLowerCase()}`); }
  if (!jaFezJanta('passe') && t.passaPrato().length) return { mapa: G.mapaId, ponto: { x: P.PASSE.cx, y: P.PASSE.topo - 40 }, rotuloFixo: 'Prato pronto! Clique no passe: pegar o prato' };
  if (!jaFezJanta('bebedouro') && t.bebidaPedida()) return { mapa: G.mapaId, ponto: { x: P.BEBEDOURO.x + P.BEBEDOURO.w / 2, y: P.BEBEDOURO.y - 20 }, rotuloFixo: `Pediram ${Pratos.BEBIDAS[t.bebidaPedida()].toLowerCase()}: clique no bebedouro` };
  if (!jaFezJanta('recolher')) { const i = t.mesas.findIndex(m => m.estado === 'suja' || m.louca); if (nos(i)) return mesa(i, t.mesas[i].louca ? 'Louça suja do lado do freguês! Clique: recolher antes que ele vá embora' : 'Clique na louça: recolher para a bandeja'); }
  if (!jaFezJanta('farinheira') && t.farinha <= 1) return { mapa: G.mapaId, ponto: { x: P.FARINHEIRA.cx, y: P.FARINHEIRA.y - 20 }, rotuloFixo: 'Clique na farinheira: repor a farinha' };
  if (!jaFezJanta('passe')) { const i = t.mesas.findIndex(m => m.estado === 'pedido' || m.estado === 'prato'); if (nos(i)) return mesa(i, 'O pedido aparece no balão: a Rosa já cozinha'); }
  return null;
}
// A reforma da lojinha no salão (as 5 etapas, 13/10): faltando material, a Rosa ("Entregue o material à Rosa"); com o
// material todo, o lugar do trabalho da etapa. A seta da primeira vez (sempre = false) some depois do primeiro dia de trabalho
// na etapa (G.limpou['reforma_<etapa>']); a da missão (sempre = true) fica até a reforma acabar. Trabalhado hoje, nada.
function _alvoDaReforma(sempre) {
  if (typeof noPalco !== 'function' || !noPalco() || !G.pensao || typeof REFORMA_LUGAR === 'undefined') return null;
  // (revisão final) Na limpeza, a sujeira mais à esquerda (perto da porta), até o salão ficar limpo — na frente de qualquer carta.
  if (G.pensao.estado === 'limpar') { const s = sujeirasDaReforma()[0]; return s ? { mapa: G.mapaId, ponto: { x: s.x, y: s.y - 70 }, rotuloFixo: 'Clique na sujeira para limpar' } : null; }
  const p = G.pensao, L = REFORMA_LUGAR[p.estado], E = ECO.reforma.find(e => e.id === p.estado); if (!L || !E) return null;
  if (!sempre && ((G.limpou || {})['reforma_' + p.estado] || 0) > 0) return null;
  if (Object.keys(p.faltaMaterial()).length) {
    // (revisão final) Sem nada do que falta na mochila, a seta vai na porta e diz onde buscar; com ele, na Rosa.
    const fr = faltaDaReforma(), P = PALCO.PORTA;
    if (fr) return { mapa: G.mapaId, ponto: { x: P.x + P.w / 2, y: P.y - 20 }, rotuloFixo: `Falta ${Itens.qtd(fr.n, fr.item)}: ${origemDoMaterial(fr.item)} (saia por aqui)` };
    return { mapa: G.mapaId, ponto: { x: PALCO.ROSA.x, y: PALCO.ROSA.y - 250 }, rotuloFixo: 'Entregue o material à Rosa' };
  }
  if (p.reforma.hoje === G.dia) return null;
  return { mapa: G.mapaId, ponto: { x: L.seta.x, y: L.seta.y }, rotuloFixo: 'Clique aqui: trabalhar ' + E.nome.replace(/^O /, 'no ').replace(/^A /, 'na ').replace(/ e as /, ' e nas ').replace(/ e o /, ' e no ') };
}
// A Rosa quer conversar (13/10): depois da primeira diária, até a conversa do sonho. Ela mora no quintal.
function _alvoDoSonhoDaRosa() {
  const L = G.lojinha; if (!L || !L.sonho || L.conversou) return null;
  return { mapa: 'quintal', morador: 'rosa', rotuloFixo: 'A Rosa quer conversar: botão direito nela' };
}
// A casa por dentro, a primeira vez (13/10): de dia, a porta ("Por aqui: o quintal"); de noite, a cama. Somem depois de feitas
// uma vez (G.limpou.casa_porta, casa_dormir: casa_dentro.js).
function _alvoDaCasa() {
  if (typeof naCasa !== 'function' || !naCasa()) return null;
  const C = CASAS[G.mapaId], L = G.limpou || {};
  if (G.minutos >= 18 * 60) return L.casa_dormir ? null : { mapa: G.mapaId, objeto: 'cama', rotuloFixo: 'Botão direito na cama: dormir' };
  return L.casa_porta ? null : { mapa: G.mapaId, ponto: { x: (C.porta.x + 0.5) * TILE, y: C.porta.y * TILE - 30 }, rotuloFixo: 'Por aqui: o quintal' };
}
// A aula de cada ferramenta (roteiro de 13/10: "mostrar para ele como usar cada uma delas para limpar o jardim, tirar o mato,
// tirar a madeira, derrubar a árvore, como regar"): uma primeira vez por ferramenta, na ordem do quintal; fora de ordem conta.
// Feita uma vez, some (G.limpou: o detrito quebrado, 'aula_pa_chao' e 'aula_regador_chao', contados em horta_jogo.js).
const AULAS = [['foice', 'mato'], ['machado', 'galho'], ['picareta', 'pedra'], ['pa', null], ['regador', null], ['machado', 'arvore']];
const FALA_AULA = { mato: 'A foice tira o mato: limpa o chão pra plantar.', galho: 'O machado corta o galho: madeira pra cerca e pras obras.',
  pedra: 'A picareta quebra a pedra: pedra pro Bira e pras obras.', pa: 'A pá cava a cova: é ali que a semente vai.',
  regador: 'O regador molha a cova plantada: sem água, a planta não cresce. Enche no barril.', arvore: 'A árvore é mais dura: vários golpes de machado. Dá madeira de monte.' };
function aulaFeita([f, det]) {
  const L = G.limpou || {};
  if (det) return (L[det] || 0) > 0;
  if (f === 'pa') return (L.aula_pa_chao || 0) > 0 || Object.keys((G.horta || {}).covas || {}).length > 15;   // o canteiro do Tio Juca já vem cavado (15 covas)
  return (L.aula_regador_chao || 0) > 0;
}
const _aulaObj = a => ({ ferramenta: a[0], det: a[1], fala: FALA_AULA[a[1] || a[0]] });
function aulaDaVez() { const a = AULAS.find(x => !aulaFeita(x)); return a ? _aulaObj(a) : null; }
// Onde a seta mostra a aula (só no quintal, e SÓ com o alvo na tela: é a primeira vez daquele objeto; fora da tela a aula cede
// às setas da carta, da Rosa, do guia, da reforma e da caderneta — correção de 13/10). A aula sem alvo visível espera: vai para a
// próxima que tem; sem nenhuma, null.
const _naTelaAula = p => !!G.cam && _naTela(p);
function _alvoDeUmaAula(a) {
  if (a.det) { const o = _maisPerto(x => x.det === a.det && _naTelaAula({ x: x.x, y: x.y - 56 })); return o ? { mapa: 'quintal', ponto: { x: o.x, y: o.y - 56 }, det: o.det, aula: a } : null; }
  const C = QUINTAL.CANTEIRO, covas = Object.entries(G.horta.covas);
  if (a.ferramenta === 'pa') {   // só depois do canteiro do Tio Juca plantado (15 covas): a grama que dá para cavar, na tela, mais perto dele
    if (covas.filter(([, c]) => c.planta).length < 15) return null;
    let melhor = null, d = 1e9;
    for (let y = C.y - 4; y < C.y + C.h + 4; y++) for (let x = C.x - 4; x < C.x + C.w + 4; x++) if (podeCavar(G.mapa, x, y) && _naTelaAula({ x: (x + 0.5) * TILE, y: y * TILE })) { const dd = Math.hypot(x - (C.x + C.w / 2), y - (C.y + C.h / 2)); if (dd < d) { d = dd; melhor = { x, y }; } }
    return melhor ? { mapa: 'quintal', ponto: { x: (melhor.x + 0.5) * TILE, y: melhor.y * TILE }, aula: a, rotuloFixo: 'Use a pá na grama limpa: cavar uma cova' } : null;
  }
  // o regador: uma cova plantada e sem água (nem de chuva) na tela, a mais perto do Jocelino
  let melhor = null, d = 1e9;
  for (const [k, c] of covas) { if (!c.planta || Horta.molhada(c, G.dia)) continue; const [cx, cy] = k.split(',').map(Number), p = { x: (cx + 0.5) * TILE, y: cy * TILE };
    if (!_naTelaAula(p)) continue; const dd = Math.hypot(p.x - G.jog.x, p.y - G.jog.y); if (dd < d) { d = dd; melhor = p; } }
  return melhor ? { mapa: 'quintal', ponto: melhor, aula: a, rotuloFixo: 'Use o regador na cova plantada' } : null;
}
function _alvoDaAula() {
  if (G.mapaId !== 'quintal' || !G.mapa || !G.jog || !G.horta) return null;
  for (const x of AULAS) { if (aulaFeita(x)) continue; const r = _alvoDeUmaAula(_aulaObj(x)); if (r) return r; }
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
// A ordem: a das missões abertas (a obra é de sol a sol desde 13/10: não passa mais na frente do quintal de manhã).
function _missoesDaSeta() {
  const g = G.guia; if (!g || !g.ativo) return [];
  return g.abertas.slice();
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
const VERBO_DET = { mato: 'capinar o mato', pedra: 'quebrar a pedra', galho: 'cortar o galho', toco: 'cortar o toco', arvore: 'cortar a árvore', pedregulho: 'quebrar a pedra', entulho: 'tirar o entulho', rocha: 'quebrar a pedra', ferro: 'quebrar o ferro' };
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
  const cands = [['janta_vez', _alvoDaJanta], ['reforma_vez', () => _alvoDaReforma(false)], ['casa_vez', _alvoDaCasa], ['tela_pedreira', _alvoDaPedreira], ['aula', _alvoDaAula], ['rosa_sonho', _alvoDoSonhoDaRosa]];   // (13/10) a primeira vez de cada passo da janta e da casa, na frente de tudo
  // (Obra do Povo) A linha da caderneta escolhida no Mostrar vem primeiro; acabou a linha, some a seta.
  if (G.guia && G.guia.ativo) for (const id of _missoesDaSeta()) cands.push([id, () => _alvoDaMissao(id)]);
  cands.push(['obra_dia', _alvoDaObraDoDia]);
  // (Obra do Povo) A linha da caderneta escolhida no Mostrar (ou na ideia): depois das missões do guia; acabou a linha, ou o
  // Jocelino chegou lá, some a seta (revisão final).
  if (G.setaFixa && typeof Caderneta !== 'undefined') { const l = Caderneta.linha(G.setaFixa);
    if (!l || !l.alvo) G.setaFixa = null; else cands.push(['caderneta', () => { const a = typeof l.alvo === 'function' ? l.alvo() : l.alvo; return a && Object.assign({ rotuloFixo: l.rotulo || l.texto }, a); }]); }
  for (const cid of _servicosDaSeta()) cands.push(['servico', () => _alvoDaEmpreita(cid)]);
  // (13/10) Primeiro o que dá para fazer no mapa onde o Jocelino está; só depois o caminho para outro lugar.
  const res = [];
  for (const [id, f] of cands) {
    const a = f(); if (!a) continue;
    if (id === 'caderneta' && !a.det && (!a.mapa || a.mapa === G.mapaId) && _chegou(a)) { G.setaFixa = null; continue; }   // (a limpeza do quintal segue o detrito mais perto: não "chega")
    res.push([id, a]);
  }
  for (const [id, a] of res) if (!a.mapa || a.mapa === G.mapaId) { const p = _posNoMapa(a); if (p && a.det && jaSabeLimpar(a.det) && G.cam && _naTela(p)) continue; if (p) { const o = Object.assign({ tipo: 'alvo', missao: id }, a, p); o.rotulo = _rotulo(o); return o; } }
  for (const [id, a] of res) {
    if (!a.mapa || a.mapa === G.mapaId) continue;
    // Em outro mapa: a saída para lá, ou para a Vila (o centro de tudo).
    // (de dentro de casa, a única saída é a porta para o quintal: tudo passa por ela)
    const s = (G.mapa.saidas || []).find(x => x.destino === a.mapa) || (G.mapaId !== 'vila' ? (G.mapa.saidas || []).find(x => x.destino === 'vila') : null)
      || (typeof naCasa === 'function' && naCasa() ? (G.mapa.saidas || [])[0] : null);
    if (s) { const o = { tipo: 'saida', missao: id, destino: s.destino, mapa: G.mapaId, x: (s.x + s.w / 2) * TILE, y: (s.y + s.h / 2) * TILE - 30 }; o.rotulo = _rotulo(o); return o; }
  }
  return null;
}
// A primeira vez das telas que ainda não tinham guia (roteiro de 13/10: "se for a primeira vez que a pessoa for fazer alguma
// coisa, deve mostrar como fazer e encaminhar a pessoa"). Como é nos jogos de referência:
// - Bazar -> Stardew (o balcão do Pierre/Joja): a primeira visita mostra o que se compra e o preço; aqui, "clique no preço para
//   comprar; o que você junta vai para a meta, sob o relógio" (sem dinheiro, a seta vai no "Juntar para").
// - Caderno de receitas -> Dave (Enhance e Research do Bancho): caprichar gasta ingrediente repetido e sobe o prato; pesquisar gasta pitadas.
// - Melhorias e Equipe -> Dave (o que o Bancho põe no salão; contratar funcionário): cada melhoria muda o salão; o ajudante cobra por noite e trabalha sozinho.
// - Pesca -> Stardew (o Willy ensina a barra): segure para subir, solte para descer, mantenha o peixe dentro. Canvas: só a fala do Lourival.
// - Pedreira -> Stardew (a primeira descida na mina): a picareta na pedra, a escada para descer, a energia que cada golpe gasta.
// Cada uma some depois da ação principal feita uma vez (G.limpou['tela_<id>'], contada nos embrulhos abaixo) ou, no save antigo, se o
// estado mostra que a tela já foi usada (usou). painel/sel: onde está a tela e os botões; escolhe(botões) devolve { el, frase }.
const _tenta = f => { try { return !!f(); } catch (e) { return false; } };
const _botaoLivre = bts => bts.find(b => !b.classList.contains('desligado')) || bts[0] || null;
const PRIMEIRA_TELA = {
  bazar: { painel: '#modal .bazar', sel: '#modal .bazar .linha button',
    usou: () => !!G.bazar && (G.bazar.comprados.length > 0 || !!G.bazar.meta),
    escolhe() {   // a primeira coisa que ainda não é da família e que o dinheiro paga; senão, o "Juntar para" de uma que ainda não é a meta
      const linhas = [...document.querySelectorAll('#modal .bazar .linha')], livres = [];
      for (let i = 0; i < linhas.length; i++) { const it = ECO.bazar.itens[i], bts = linhas[i].querySelectorAll('button'); if (it && !Bazar.tem(it.id) && bts.length > 1) livres.push([it, bts]); }
      const paga = livres.find(([it]) => G.dinheiro >= it.preco);
      if (paga) return { el: paga[1][0], frase: 'Clique no preço para comprar. O que você junta vai para a meta, sob o relógio.' };
      const outra = livres.find(([, bts]) => /Juntar/.test(bts[1].textContent)) || livres[0];
      return outra && { el: outra[1][1], frase: 'Ainda falta dinheiro: clique em Juntar para escolher o que quer. A barrinha sob o relógio mostra quanto falta.' }; } },
  receitas: { painel: '#modal .caderno', sel: '#modal .caderno .cad-capricho',
    usou: () => { const p = G.pensao; return !!p && (Object.keys(p.niveis || {}).length > 0 || p.receitas.length > Pensao.RECEITAS_INICIAIS.length); },
    escolhe(bts) {   // pesquisar, se a receita aberta é a nova; caprichar, se a pensão já deixa; senão, a receita nova a pesquisar
      const p = G.pensao, b = bts[0], pesquisa = 'Pesquisar gasta pitadas de tempero (as estrelas da janta viram pitadas) e abre uma receita nova no caderno.';
      if (b && /Pesquisar/.test(b.textContent)) return { el: b, frase: pesquisa };
      if (b && p.tetoCapricho() > p.nivel(_cadernoSel)) return { el: b, frase: 'Caprichar gasta ingredientes repetidos (os da lista ao lado) e sobe o nível do prato: mais preço, sabor e porções.' };
      const nova = document.querySelector('#modal .caderno .cad-icone.pode');
      if (nova) return { el: nova, frase: 'Receita nova: clique nela e pesquise com pitadas de tempero. Caprichar os pratos sobe com as estrelas da pensão.' };
      return b && { el: b, frase: 'Caprichar gasta ingredientes repetidos e sobe o nível do prato. A Rosa só capricha mais quando a pensão ganha estrela.' }; } },
  melhorias: { painel: '#modal .melhorias', sel: '#modal .melhorias .mel-item > button',
    usou: () => !!G.pensao && (G.pensao.melhorias || []).length > 0,
    escolhe: bts => { const b = _botaoLivre(bts); return b && { el: b, frase: 'Cada melhoria muda o salão e rende mais. Leia o que ela faz (▸) e clique em Comprar.' }; } },
  equipe: { painel: '#modal .equipe', sel: '#modal .equipe button',
    usou: () => !!G.pensao && (G.pensao.equipe || []).length > 0,
    escolhe(bts) {   // com candidatos, o posto do primeiro; sem eles (e com vaga), o cartaz mais barato
      const p = G.pensao, postos = Object.values(Equipe.POSTOS);
      if (p.candidatos.length) { const b = _botaoLivre(bts.filter(x => x.closest('.eq-bts') && postos.includes(x.textContent.trim())));
        return b && { el: b, frase: 'Escolha o posto e contrate: o Salão recolhe a louça, a Cozinha ajuda a Rosa e as Compras trazem ingrediente. Ele trabalha sozinho e cobra salário por noite.' }; }
      const b = bts.find(x => x.classList.contains('eq-anuncio'));
      return b && { el: b, frase: 'Para ter ajudante, ponha um anúncio: amanhã aparecem 3 candidatos. Cada um cobra salário por noite.' }; } },
  pesca: { usou: () => (G.guia && (G.guia.cont.pescou || 0) > 0) || (!!G.hab && G.hab.xp.pesca > 0) },
  pedreira: { usou: () => ((G.limpou || {}).rocha || 0) > 0 || ((G.limpou || {}).ferro || 0) > 0 || (G.guia && (G.guia.cont.pedreira || 0) > 0) || (!!G.mina && G.mina.maisFunda >= 1) },
};
const jaFezTela = id => ((G.limpou || {})['tela_' + id] || 0) > 0 || _tenta(PRIMEIRA_TELA[id].usou);
function _marcaTela(id) { if (G.limpou) G.limpou['tela_' + id] = (G.limpou['tela_' + id] || 0) + 1; }
{ const embrulha = (obj, m, id) => { const f = obj[m]; obj[m] = function (...a) { const r = f.apply(this, a); if (r === 'ok') _marcaTela(id); return r; }; };
  embrulha(Bazar, 'comprar', 'bazar'); embrulha(Pensao.prototype, 'caprichar', 'receitas'); embrulha(Pensao.prototype, 'pesquisar', 'receitas');
  embrulha(Melhorias, 'comprar', 'melhorias'); embrulha(Melhorias, 'subir', 'melhorias'); embrulha(Equipe, 'contratar', 'equipe');
  const pp = pegouPeixe; pegouPeixe = function (...a) { const r = pp.apply(this, a); _marcaTela('pesca'); return r; }; }
function _primeiraTelaUI() {
  for (const id in PRIMEIRA_TELA) {
    const T = PRIMEIRA_TELA[id]; if (!T.painel || !document.querySelector(T.painel) || jaFezTela(id)) continue;
    const r = T.escolhe([...document.querySelectorAll(T.sel)]); if (r && r.el) return { chave: 'tela_' + id, el: r.el, rotulo: r.frase };
  }
  return null;
}
// A pedreira: a rocha com a picareta e, com a escada arrumada e ninguém ainda desceu, a escada. O Seu Tonico fala na dica.
const FALA_ROCHA = 'Pedra boa, essa! A picareta quebra a rocha e rende pedra pra obra do Bira. Cada golpe gasta energia: a seta mostra uma.';
const FALA_ESCADA = 'A escada leva às bancadas, lá embaixo: tem ferro pras ferramentas. Cada andar gasta energia; leve comida e, depois da décima bancada, luz.';
function _alvoDaPedreira() {
  if (G.mapaId !== 'pedreira' || !G.mapa || !G.jog) return null;
  if (!jaFezTela('pedreira')) { const o = _maisPerto(x => x.det === 'rocha'); if (o) return { mapa: 'pedreira', ponto: { x: o.x, y: o.y - 56 }, det: 'rocha' }; }
  if (G.mina && G.mina.aberta && G.mina.maisFunda < 1) return { mapa: 'pedreira', objeto: 'escada_mina' };
  return null;
}
// A pesca: a fala do Seu Lourival em cada fase da linha (o minijogo é no canvas: sem seta HTML), até o primeiro peixe.
const FALA_PESCA = { vara: 'Com a vara na mão, segure o botão perto da água: a força sobe. Solte para lançar a boia.',
  carregando: 'Segure para encher a força e solte para lançar: quanto mais forte, mais longe cai a boia.',
  esperando: 'Agora espere a boia afundar. Quando aparecer o "!", clique rápido para fisgar.',
  mordeu: 'Mordeu! Clique agora para fisgar o peixe.',
  minijogo: 'Segure o botão para a barra subir e solte para descer: mantenha o peixe dentro da faixa até encher o medidor.' };
function _falaDaPesca() {
  if (!G.jog || !G.mapa || jaFezTela('pesca')) return null;
  const L = G.linha, t = L ? FALA_PESCA[L.fase] : (typeof itemDaMao === 'function' && VARAS.includes(itemDaMao()) && ['praia', 'mata', 'alto_mar'].includes(G.mapaId) && !menuAberto() ? FALA_PESCA.vara : '');
  return t ? { id: 'lourival', nome: 'Seu Lourival', texto: t, alvo: null } : null;
}
// A seta da tela: { chave, el } ou null (o elemento HTML onde clicar).
function guiaSetaUI() {
  const tela = _primeiraTelaUI(); if (tela) return tela;   // (a primeira vez de uma tela vem antes de tudo, até com o modal aberto)
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
  if (sm && sm.det && (sm.missao === 'quintal' || sm.missao === 'aula' || sm.buscar || sm.missao === 'caderneta' || sm.missao === 'obra_dia' || sm.missao === 'tela_pedreira')) { const D = DETRITOS[sm.det], ok = mao === D.ferramenta || (D.aceita || []).includes(mao); if (!ok) { const i = slotDe(D.ferramenta); if (i >= 0) return barra(i); } }
  if (sm && sm.missao === 'aula' && !sm.det) { const a = sm.aula; if (a && mao !== a.ferramenta) { const i = slotDe(a.ferramenta); if (i >= 0) return barra(i); } }
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
  // (13/10) A aula de cada ferramenta: a fala do Tio Juca diz o que a seta mostra (vale também para quem pulou o guia).
  if (G.mapaId === 'quintal') { const sa = setaAgora(); if (sa && sa.missao === 'aula' && sa.aula) return { id: 'juca', nome: 'Tio Juca', texto: sa.aula.fala + ' (a seta mostra onde)', alvo: null }; }
  const g = G.guia; if (!g || !g.ativo || !g.abertas.includes('quintal') || G.mapaId !== 'quintal') return null;
  const s = setaAgora(); if (!s || s.missao !== 'quintal' || !s.det) return null;
  const D = DETRITOS[s.det], i = G.mochila.slots.slice(0, 12).findIndex(x => x && x.id === D.ferramenta), m = Guia.missao('quintal');
  const nome = { mato: 'o mato', pedra: 'a pedra', galho: 'o galho', toco: 'o toco' }[s.det] || 'isso', tecla = i >= 0 && i < 10 ? ` (tecla ${(i + 1) % 10})` : '';
  return { id: 'juca', nome: 'Tio Juca', texto: `Limpe ${nome} que a seta mostra: escolha ${NOME_FERRAMENTA[D.ferramenta]}${tecla} e clique em cima. Faltam ${m.meta - Guia.progresso(m)}.`, alvo: null };
}; }
// (13/10) A primeira vez da pesca (a fala do Seu Lourival em cada fase) e da pedreira (o Seu Tonico), na caixa de dica.
{ const p0 = guiaPasso; guiaPasso = function () {
  const pesca = _falaDaPesca(); if (pesca) return pesca;
  if (G.mapaId === 'pedreira') { const sa = setaAgora(); if (sa && sa.missao === 'tela_pedreira') return { id: 'tonico', nome: 'Seu Tonico', texto: sa.objeto ? FALA_ESCADA : FALA_ROCHA, alvo: null }; }
  return p0();
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
  if (/^tela_/.test(s.chave) && !s.el._rolou) { s.el._rolou = true; s.el.scrollIntoView({ block: 'nearest' }); }   // (o botão fica à vista na página que rola; uma vez só, para não brigar com quem rola)
  const r = s.el.getBoundingClientRect(); d.hidden = false;
  t.hidden = !s.rotulo; t.textContent = s.rotulo || ''; const meia = (t.offsetWidth || 0) / 2 + 8;
  t.style.left = Math.round(Math.min(Math.max(r.left + r.width / 2, meia), Math.max(meia, innerWidth - meia))) + 'px'; t.style.top = Math.round(Math.max((t.offsetHeight || 0) + 4, r.top - 84)) + 'px';   // (a frase longa quebra em linhas e termina em cima da seta)
  d.style.left = Math.round(r.left + r.width / 2 - 27) + 'px'; d.style.top = Math.round(r.top - 80) + 'px';
}, 100);
