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
// (tarefa 7, o robô jogador) O depósito do Seu Ananias fechado agora (depositoFechado e DEPOSITO_HORARIO, em loja.js): a seta diz quando abre.
// (tarefa 7) A etapa da casa da família ainda por começar sem o dinheiro dela (E.custo): a seta e o Agora não mandam para lá.
const casaSemDinheiro = (E, a) => !!E && !!a && E.tipo === 'longa' && a.estado === 'reservada' && typeof E.familia === 'number' && G.dinheiro < (E.custo || 0);
// (tarefa 7) A entrada da lojinha juntou (depois da conversa da Rosa): a seta leva à fachada amarela, na Vila.
function _alvoDaLojinha() {
  const L = G.lojinha; if (!L || !L.conversou || L.comprada || typeof ECO === 'undefined' || G.dinheiro < ECO.lojinha.entrada) return null;
  return { mapa: 'vila', objeto: 'pensao', rotuloFixo: 'Botão direito: comprar a lojinha da Rosa' };
}
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
    case 'pesca': {   // (tarefa 7, o robô jogador) depois da conversa com a vara na mochila, a seta vai na ponta do píer (era o Seu Lourival até
      // o 3º peixe); chegando lá com a vara na mão, some e fica a fala dele na dica (como o Willy: dá a vara e o jogador pesca na água)
      const vara = typeof VARAS !== 'undefined' && VARAS.some(v => G.mochila.total(v) > 0);
      if (vara && g.conversou.includes('lourival') && typeof PRAIA !== 'undefined') {
        const ponto = { x: (PRAIA.PIER_X + 1) * TILE, y: PRAIA.PIER_FIM * TILE }, perto = G.mapaId === 'praia' && G.jog && Math.hypot(ponto.x - G.jog.x, ponto.y + 36 - G.jog.y) < 1.6 * TILE;
        if (perto && VARAS.includes(itemDaMao())) return null;
        return { mapa: 'praia', ponto, rotuloFixo: 'Pesque da ponta do píer: a vara na mão, de frente para a água' };
      }
      return { mapa: 'praia', morador: 'lourival' };
    }
    case 'bazar': return { mapa: 'vila', objeto: 'balcao_bazar' };
    case 'pedreira': {   // (tarefa 7) a missão é quebrar 10 pedras: depois da primeira (ou da conversa), a seta mostra a rocha, não o Seu Tonico
      if (G.mapaId === 'pedreira' && G.mapa && (jaFezTela('pedreira') || g.conversou.includes('tonico'))) { const o = _maisPerto(x => x.det === 'rocha' || x.det === 'ferro'); if (o) return { mapa: 'pedreira', ponto: { x: o.x, y: o.y - 56 }, det: o.det }; }
      return { mapa: 'pedreira', morador: 'tonico' };
    }
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
  // (onda final, o robô #23) as pedras do Bira: do quintal enquanto ele tem pedra; sem pedra lá e com a pedreira aberta, a seta vai
  // à pedreira (mesmo depois da 1ª vez: a fonte que o jogador conhecia acabou) e, lá, à rocha mais perto
  const quintal = MAPAS.quintal, pedraNoQuintal = !quintal || quintal.objs.some(o => o.det === 'pedra');
  const pedreira = !!(G.lugares && G.lugares.pedreira) && !pedraNoQuintal && (l.feito.buscar_pedra || 0) + G.mochila.total('pedra') < (l.metas.buscar_pedra || 0);
  const pend = Object.keys(l.metas).filter(k => (l.feito[k] || 0) < l.metas[k] && (!jaFezObra(k) || (k === 'buscar_pedra' && pedreira)));
  if (G.mapaId === 'pedreira' && pedreira) { const o = _maisPerto(x => x.det === 'rocha'); return o ? { mapa: 'pedreira', ponto: { x: o.x, y: o.y - 56 }, det: o.det } : null; }
  if (G.mapaId === 'quintal' && pend.includes('buscar_pedra')) { const o = _maisPerto(x => x.det === 'pedra');
    if (!o && pedreira) return { mapa: 'pedreira' };   // (com algumas pedras na mochila e o quintal sem pedra: o resto, na pedreira)
    if (!G.mochila.total('pedra')) return o ? { mapa: 'quintal', ponto: { x: o.x, y: o.y - 56 }, det: o.det } : null; }
  if (G.mapaId !== 'vila') return null;
  const ob = G.mapa.objs.find(o => o.obraId && obraDaVez(o)), naObra = rot => ob ? { mapa: 'vila', objeto: ob.id, rotuloFixo: rot } : null;
  const c = G.jog && G.jog.carga;
  if (c && c.id === 'massa' && pend.includes('massa')) return { mapa: 'vila', morador: 'ze', rotuloFixo: 'Botão direito: entregar a massa ao Zé' };
  if (c && CARGA_TAREFA[c.id] && pend.includes(CARGA_TAREFA[c.id])) return naObra('Botão direito: entregar na obra');
  for (const id of pend) {
    if ((id === 'pedras' || id === 'buscar_pedra') && G.mochila.total('pedra') > 0) return naObra('Botão direito: entregar as pedras na obra');
    if (id === 'buscar_pedra' && pedreira) return { mapa: 'pedreira' };
    if (ORIGEM_OBRA[id]) return { mapa: 'vila', objeto: ORIGEM_OBRA[id], rotuloFixo: id === 'areia' ? 'Botão direito na peneira: peneirar a areia'
      : `Botão direito ${{ monte_tijolos: 'no monte', pilha_ripas: 'na pilha', masseira: 'na masseira' }[ORIGEM_OBRA[id]]}: pegar ${{ tijolos: 'os tijolos', pedras: 'as pedras', telhas: 'as telhas', ripas: 'as ripas', massa: 'a massa' }[id]}` };
    if (FERRAMENTA_TAREFA[id]) return naObra(FERRAMENTA_TAREFA[id]);
    if (id === 'entulho' || id === 'capinar') { const det = id === 'entulho' ? 'entulho' : 'mato', o = _maisPerto(x => x.det === det && dentroR(CANTEIRO, x.tiles[0].x, x.tiles[0].y)); if (o) return { mapa: 'vila', ponto: { x: o.x, y: o.y - 56 }, det }; }
    if (id === 'buscar_cimento') return G.mochila.total('cimento') ? { mapa: 'vila', morador: 'bira' } : { mapa: 'vila', objeto: 'deposito', rotuloFixo: depositoFechado() ? `O depósito abre às ${DEPOSITO_HORARIO.abre / 60}h: aí, botão direito para comprar o cimento` : 'Botão direito: comprar o cimento' };
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
// (14/10, o desgosto) A louça do lado de quem sentou, recolhida pelo Jocelino (G.limpou.janta_louca_lado): a seta dela some.
{ const f = TurnoJanta.prototype.recolher;
  TurnoJanta.prototype.recolher = function (i) { const lado = !!(this.mesas[i] && this.mesas[i].louca), r = f.apply(this, arguments);
    if (r && lado && G.limpou) G.limpou.janta_louca_lado = (G.limpou.janta_louca_lado || 0) + 1; return r; }; }
function _alvoDaJanta() {
  const t = G.turno; if (!t || typeof noPalco !== 'function' || !noPalco() || G.copo) return null;
  const P = PALCO, mesa = (i, rot) => ({ mapa: G.mapaId, ponto: { x: P.ASSENTOS[i].x, y: P.ASSENTOS[i].y - 250 }, rotuloFixo: rot });
  const nos = (i) => i >= 0 && i < P.ASSENTOS.length;
  // (14/10, o desgosto) a 1ª vez que um freguês senta do lado da louça suja: a seta na louça (é urgente: ele vai embora)
  if (!jaFezJanta('louca_lado')) { const i = t.mesas.findIndex(m => m.louca && m.estado === 'pedido');
    if (nos(i)) return { mapa: G.mapaId, ponto: { x: P.ASSENTOS[i].x, y: P.LOUCA.base - 34 }, rotuloFixo: 'Louça suja espanta freguês! Clique na louça: recolher antes que ele vá embora' }; }
  if (!jaFezJanta('bacia') && t.bandeja.some(x => x.tipo === 'louca')) return { mapa: G.mapaId, ponto: { x: P.BACIA.x + P.BACIA.w / 2, y: P.BACIA.y - 20 }, rotuloFixo: 'Clique na bacia: lavar a louça' };
  if (!jaFezJanta('entregar')) { const x = t.bandeja.find(b => b.tipo === 'prato'), i = x ? t.mesas.findIndex(m => m.estado === 'prato' && m.prato === x.prato) : -1;
    if (nos(i)) return mesa(i, `Clique em ${t.mesas[i].cliente.nome}: entregar ${Pensao.prato(x.prato).nome.toLowerCase()}`); }
  if (!jaFezJanta('bebida_entregar')) { const x = t.bandeja.find(b => b.tipo === 'bebida'), i = x ? t.mesas.findIndex(m => t.querBebidaAgora(m) && m.bebida === x.bebida) : -1;
    if (nos(i)) return mesa(i, `Clique em ${t.mesas[i].cliente.nome}: entregar ${Pratos.BEBIDAS[x.bebida].toLowerCase()}`); }
  if (!jaFezJanta('passe') && t.passaPrato().length) return { mapa: G.mapaId, ponto: { x: P.PASSE.cx, y: P.PASSE.topo - 40 }, rotuloFixo: 'Prato pronto! Clique no passe: pegar o prato' };
  // (14/10, Tarefa E2) a 1ª caipirinha pedida (depois do presente do Seu Orlando): a seta no bebedouro, até a primeira sair pronta
  if (!((G.limpou || {}).caipirinha > 0) && t.bebidaPedida() === 'caipirinha') return { mapa: G.mapaId, ponto: { x: P.BEBEDOURO.x + P.BEBEDOURO.w / 2, y: P.BEBEDOURO.y - 20 }, rotuloFixo: 'Pediram caipirinha! Clique no bebedouro e faça a receita do Seu Orlando' };
  if (!jaFezJanta('bebedouro') && t.bebidaPedida()) return { mapa: G.mapaId, ponto: { x: P.BEBEDOURO.x + P.BEBEDOURO.w / 2, y: P.BEBEDOURO.y - 20 }, rotuloFixo: `Pediram ${Pratos.BEBIDAS[t.bebidaPedida()].toLowerCase()}: clique no bebedouro` };
  if (!jaFezJanta('recolher')) { const i = t.mesas.findIndex(m => m.estado === 'suja' || m.louca); if (nos(i)) return mesa(i, t.mesas[i].louca ? 'Louça suja do lado do freguês! Clique: recolher antes que ele vá embora' : 'Clique na louça: recolher para a bandeja'); }
  // (Tarefa C) a 1ª vez que a farinheira pisca (o alerta): peneirar leva uns segundos, parado
  if (!jaFezJanta('farinheira') && t.farinha <= t.alertaFarinha() && !G.peneira && t.podeReporFarinha() === 'ok') return { mapa: G.mapaId, ponto: { x: P.FARINHEIRA.cx, y: P.FARINHEIRA.y - 20 }, rotuloFixo: 'A farinheira está no fim: clique e peneire (fique parado até a barrinha encher)' };
  if (!jaFezJanta('passe')) { const i = t.mesas.findIndex(m => m.estado === 'pedido' || m.estado === 'prato'); if (nos(i)) return mesa(i, 'O pedido aparece no balão: a Rosa já cozinha'); }
  return null;
}
// A reforma da lojinha no salão (as 5 etapas, 13/10): faltando material, a Rosa ("Traga X e entregue à Rosa"); com o
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
    if (fr) return { mapa: G.mapaId, ponto: { x: P.x + P.w / 2, y: P.y - 20 }, rotuloFixo: `Traga ${Itens.qtd(fr.n, fr.item)} e entregue à Rosa: ${origemDoMaterial(fr.item)} (saia por aqui)` };
    // (14/10, pedido do jogador) A Rosa brilha (realceDaReforma, reforma_palco.js) e a frase diz o que trazer.
    const RL = rosaLugar(), lista = Object.entries(p.faltaMaterial()).map(([i, q]) => Itens.qtd(q, i)).join(' e ');
    return { mapa: G.mapaId, ponto: { x: RL.x, y: caixaDaRosa().y0 + 10 }, rotuloFixo: `Traga ${lista} e entregue à Rosa` };   // (a ponta no alto da caixa que brilha)
  }
  if (p.reforma.hoje === G.dia) return null;   // (o trabalho de hoje feito: sem seta nem realce; no lugar, "Amanhã continua")
  // (14/10) Quantos golpes faltam hoje e quantos dias faltam na etapa (o lugar brilha: realceDaReforma).
  const golpes = GOLPES_DIA - (p._golpes || 0), dias = E.dias - (p.reforma.dias || 0);
  return { mapa: G.mapaId, ponto: { x: L.seta.x, y: L.seta.y }, rotuloFixo: `Clique aqui: ${golpes} ${golpes === 1 ? 'golpe' : 'golpes'} hoje (${dias === 1 ? 'falta 1 dia' : `faltam ${dias} dias`})` };
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
  // (o cardápio do Bancho) a primeira marmita da Rosa na mesa (G.limpou.casa_marmita: pegarMarmitas)
  // (a ponta da seta na marmita: ela é pequena, não tem a altura de um ladrilho)
  const mm = !L.casa_marmita && G.mapa.objs.find(o => o.id === 'marmita_mesa');
  if (mm) return { mapa: G.mapaId, objeto: 'marmita_mesa', ponto: { x: mm.x, y: mm.y - 30 }, rotuloFixo: 'Botão direito: a marmita da Rosa (energia para o dia)' };
  return L.casa_porta ? null : { mapa: G.mapaId, ponto: { x: (C.porta.x + 0.5) * TILE, y: C.porta.y * TILE - 30 }, rotuloFixo: 'Por aqui: o quintal' };
}
// A aula de cada ferramenta (roteiro de 13/10: "mostrar para ele como usar cada uma delas para limpar o jardim, tirar o mato,
// tirar a madeira, derrubar a árvore, como regar"): uma primeira vez por ferramenta, na ordem do quintal; fora de ordem conta.
// Feita uma vez, some (G.limpou: o detrito quebrado, 'aula_pa_chao' e 'aula_regador_chao', contados em horta_jogo.js).
const AULAS = [['foice', 'mato'], ['machado', 'galho'], ['picareta', 'pedra'], ['pa', null], ['regador', null], ['machado', 'arvore']];
const FALA_AULA = { mato: 'A foice tira o mato: limpa o chão pra plantar.', galho: 'O machado corta o galho: madeira pra cerca e pras obras.',
  pedra: 'A picareta quebra a pedra: pedra pro Bira e pras obras.', pa: 'A pá cava a cova: é ali que a semente vai. Cavou no lugar errado? A picareta fecha a cova vazia; a foice arranca um pé.',
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
  // (tarefa 7, o robô jogador) a etapa da casa da família ainda por começar, sem o dinheiro dela: nada de seta para comprar material nem para
  // a plaquinha (antes mandava comprar cimento e quebrar 30 pedras com Cr$ 2.600 de 8.000, no meio da reforma da pensão); a barrinha já diz quanto falta
  if (casaSemDinheiro(E, a)) return null;   // (a plaquinha com o quanto falta é só o último recurso: _alvoDaCasaSemDinheiro)
  // (14/10) No mapa do serviço no lugar de verdade, com o material longe daqui (a madeira no quintal), a seta fica no lugar do
  // serviço e diz o que trazer ("Traga 4 madeiras e use o machado aqui"); o depósito, aqui mesmo, segue levando a ele.
  const noObjeto = E.tipo === 'curta' && E.estrago && E.estrago.noObjeto;
  const f = faltaDaEmpreita(cid); if (f) { const m = _alvoDoMaterial(f, cid); if (m && !((E.local || noObjeto) && G.mapaId === E.mapa && m.mapa !== G.mapaId)) return m; }
  // (14/10, foto do jogador: "a seta nessa missão está apontando pro nada") A entrega no próprio objeto: a seta na casa do Tio Juca.
  if (noObjeto) { const lista = Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ');
    return { mapa: E.mapa, objeto: E.estrago.objeto, empreita: cid, rotuloFixo: f ? `Traga ${Itens.qtd(f.n, f.item)} e entregue aqui (botão direito na casa)` : `Botão direito na casa: entregar ${lista}` }; }
  // (a ponta da seta no chão do lugar; na cerca, de pé, no meio da altura da arte)
  // (o trecho do píer: no próprio trecho quebrado; a banca: no alto da luz)
  if (E.local) { const L = E.local, A = L.retalho || L.area, img = L.trechos && spr(L.arte), y = L.luz ? (L.luz.y + 0.5) * TILE : img ? (A.y + A.h) * TILE - img.naturalHeight / 2 : A.y * TILE + 6;
    return { mapa: E.mapa, ponto: { x: (A.x + A.w / 2) * TILE, y }, empreita: cid, falta: f || undefined }; }
  // (a limpeza se faz nos matos e entulhos em volta, não na plaquinha: a seta vai no mais perto do serviço)
  if (E.tipo === 'curta' && typeof LIMPEZA !== 'undefined' && LIMPEZA[cid] && G.mapaId === E.mapa) { const o = _maisPerto(x => x.empreitaDet === cid);
    if (o) return { mapa: E.mapa, ponto: { x: o.x, y: o.y - 56 }, det: o.det, empreita: cid, limpeza: true }; }
  if (E.tipo === 'curta') return { mapa: E.mapa, objeto: 'emp_' + cid, empreita: cid };
  // (a obra longa reservada também: com o material, a plaquinha é onde se começa; os aluguéis por começar são opcionais)
  if (E.tipo === 'longa' && ((a.estado === 'obra' && !a.trabalhou) || a.estado === 'pronta' || (a.estado === 'reservada' && typeof E.familia !== 'string'))) return { mapa: E.mapa, objeto: 'emp_placa_' + cid, empreita: cid };
  return null;
}
// A plaquinha da etapa da casa da família ainda sem o dinheiro (só no quintal; o último recurso da seta).
function _alvoDaCasaSemDinheiro() {
  if (G.mapaId !== 'quintal' || !G.empreitas) return null;
  for (const cid of Object.keys(G.empreitas.aceitas)) { const E = dadosEmpreita(cid), a = G.empreitas.aceitas[cid];
    if (casaSemDinheiro(E, a)) return { mapa: E.mapa, objeto: 'emp_placa_' + cid, empreita: cid, rotuloFixo: `A casa da família começa aqui: faltam Cr$ ${Math.ceil((E.custo || 0) - G.dinheiro)}` }; }
  return null;
}
// O serviço aceito que é de hoje: o curto (até ser feito) e a obra longa com o dia de trabalho por fazer ou pronta para entregar.
function _servicoDeHoje(cid) {
  const E = dadosEmpreita(cid), a = G.empreitas && G.empreitas.aceitas[cid]; if (!E || !a) return false;
  return E.tipo === 'curta' || (E.tipo === 'longa' && ((a.estado === 'obra' && !a.trabalhou) || a.estado === 'pronta'));
}
function _servicosDaSeta() {
  if (!G.empreitas) return [];
  const ids = Object.keys(G.empreitas.aceitas);
  return ids.filter(k => dadosEmpreita(k) && dadosEmpreita(k).tipo === 'curta').concat(ids.filter(k => dadosEmpreita(k) && dadosEmpreita(k).tipo !== 'curta'));
}
// (15/10, T4) Os recados do povo (recados.js): o guia da 1ª vez (regra de 13/10: seta e frase no lugar exato, que somem depois de
// feitas). Como é no Stardew: o Help Wanted não tem seta (o bilhete diz quem pede e o jogador acha a pessoa); aqui a 1ª vez é guiada:
// 1) o 1º cartão de recado no quadro: a seta no "Aceitar" (PRIMEIRA_TELA.recado, mais abaixo);
// 2) o 1º recado aceito, sem o item: a seta vai aonde o item nasce (o achado do chão, o galho, a pedra, o mato, o pé pronto da horta,
//    o píer), com a frase de onde ele vem;
// 3) com tudo na mochila (a entrega é direto da mochila, decisão do dono): a seta no morador, "Botão direito na Dona Zélia: entregar
//    as 3 couves";
// 4) a 1ª peça da coleta que conta: a frase flutuante "Recado: 1/15 madeiras (conta o que juntar a partir de agora)" (AO_PEGAR, abaixo).
// As setas somem na 1ª entrega (G.limpou.recado_entregue). Sem o guia ("Já conheço o jogo"), nenhuma seta. Depois da 1ª vez, a linha
// do recado na Caderneta (aba Hoje) tem o Mostrar, que usa o mesmo alvo (alvoDoRecado).
const RECADO_DET = { madeira: ['galho', 'toco', 'arvore'], pedra: ['pedra', 'pedregulho'], fibra: ['mato'] };
const RECADO_ITEM_O = ['coco', 'cogumelo', 'tomate'];   // "os 2 cocos"; o resto, "as 3 couves"
const _maiuscula = t => t ? t[0].toUpperCase() + t.slice(1) : '';
// Onde nasce o item que falta para o recado (null se hoje não há onde: a horta ainda não deu, o chão já foi catado).
function _origemDoRecado(id) {
  const P = PEDIDOS_VILA[id], n = Recados.faltam(id), base = { recado: id, buscar: true };
  const abertos = P.mapas.filter(m => Recados.aberto(m)), frase = _maiuscula((typeof RECADO_ORIGEM !== 'undefined' && RECADO_ORIGEM[P.item]) || ''), faltam = `${n === 1 ? 'falta' : 'faltam'} ${n}`;
  // a horta: o pé pronto (colher); ainda verde, nada (a Caderneta diz em quantos dias a horta dá)
  if (typeof CULTURAS !== 'undefined' && CULTURAS[P.item]) {
    const k = G.horta && Object.keys(G.horta.covas).find(k => { const c = G.horta.covas[k]; return c && c.planta === P.item && Horta.madura(c); }); if (!k) return null;
    const [x, y] = k.split(',').map(Number);
    return Object.assign({ mapa: 'quintal', ponto: { x: (x + 0.5) * TILE, y: y * TILE }, rotuloFixo: `Pé de ${Itens.nome(P.item).toLowerCase()} pronto: botão direito para colher (${faltam})` }, base);
  }
  // o peixe: a ponta do píer, com a vara na mão
  if (P.precisa === 'vara' && typeof PRAIA !== 'undefined') return Object.assign(G.mapaId === 'praia' ? { mapa: 'praia', ponto: { x: (PRAIA.PIER_X + 1) * TILE, y: PRAIA.PIER_FIM * TILE }, rotuloFixo: `Pesque da ponta do píer, com a vara na mão (${faltam})` } : { mapa: 'praia' }, base);
  // o material (madeira, pedra, fibra): o detrito que solta o item, aqui; senão, o mapa aberto que ainda tem
  const dets = RECADO_DET[P.item];
  if (dets) {
    if (abertos.includes(G.mapaId)) { const o = _maisPerto(x => dets.includes(x.det) && !x.empreitaDet); if (o) return Object.assign({ mapa: G.mapaId, ponto: { x: o.x, y: o.y - 56 }, det: o.det, rotuloFixo: `${frase} (${faltam})` }, base); }
    const m = abertos.find(m => m !== G.mapaId && Recados.noMundo(P.item, [m]) > 0);
    return m ? Object.assign({ mapa: m }, base) : null;
  }
  // o que nasce no chão (goiaba, flor, coco, cogumelo): o achado de hoje mais perto, aqui; senão, o mapa aberto que ainda tem
  if (typeof Achados === 'undefined' || !G.achados) return null;
  const doItem = m => Achados.doDia(G.dia, m).filter(x => x.id === P.item && !(G.achados.catados[m] || []).includes(x.k));
  const comChao = abertos.filter(m => ACHADOS_POR_MAPA[m]);
  if (comChao.includes(G.mapaId) && G.mapa && G.jog) {
    const ks = new Set(doItem(G.mapaId).map(x => 'achado_' + x.k)); let o = null, d = 1e9;
    for (const x of G.mapa.objs) if (x.achado && ks.has(x.id)) { const dd = Math.hypot(x.x - G.jog.x, x.y - G.jog.y); if (dd < d) { d = dd; o = x; } }
    if (o) return Object.assign({ mapa: G.mapaId, ponto: { x: o.x, y: o.y - 40 }, rotuloFixo: `${frase}: botão direito para catar` }, base);
  }
  const m = comChao.find(m => m !== G.mapaId && doItem(m).length);
  return m ? Object.assign({ mapa: m }, base) : null;
}
// O alvo de um recado aceito: com tudo na mochila, o morador; senão, a origem do item.
function alvoDoRecado(id) {
  const P = PEDIDOS_VILA[id], a = G.recados && G.recados.ativos[id]; if (!P || !a || !G.mochila) return null;
  if (Recados.podeEntregar(id) === 'ok') return { mapa: RECADO_MORADOR[P.cliente], morador: P.cliente, recado: id,
    rotuloFixo: `Botão direito ${RECADO_ARTIGO[P.cliente] === 'a' ? 'na' : 'no'} ${Recados.nome(P.cliente)}: entregar ${RECADO_ITEM_O.includes(P.item) ? 'os' : 'as'} ${Itens.qtd(P.qtd, P.item)}` };
  return _origemDoRecado(id);
}
// A seta da 1ª vez: com o guia, até a 1ª entrega; o recado pronto para entregar vem antes.
function _alvoDoRecadoGuia() {
  if (!G.guia || !G.guia.ativo || !G.recados || typeof Recados === 'undefined' || ((G.limpou || {}).recado_entregue || 0) > 0) return null;
  const ids = Object.keys(G.recados.ativos).sort((x, y) => (Recados.podeEntregar(y) === 'ok') - (Recados.podeEntregar(x) === 'ok'));
  for (const id of ids) { const a = alvoDoRecado(id); if (a) return a; }
  return null;
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
  mercado: 'Botão direito: entregar aqui', obra_escola: 'Botão direito: entregar aqui', obra_predio: 'Botão direito: entregar aqui',   // (a obra da vez: o canteiro segue a obra)
  quadro_pedidos: 'Botão direito: ver os serviços', pensao: 'Botão direito: entrar na pensão', balcao_bazar: 'Botão direito: ver o Bazar',
  escada_mina: 'Botão direito: descer na mina', desce_mina: 'Botão direito: descer para a próxima bancada', sobe_mina: 'Botão direito: subir da mina', despensa_pensao: 'Botão direito: abrir a despensa', gremio: 'Botão direito: a lista do povo' };
function _rotulo(a) {
  if (a.recado && a.rotuloFixo && a.tipo !== 'saida') return a.rotuloFixo;   // (o recado: a frase de onde vem o item, também no detrito)
  if (a.rotuloFixo && a.tipo !== 'saida' && !a.det) return a.rotuloFixo;
  if (a.falta && a.tipo !== 'saida') { const q = Itens.qtd(a.falta.n, a.falta.item);
    if (a.objeto === 'deposito') return `Falta ${q}: compre no depósito do Seu Ananias${depositoFechado() ? ` (abre das ${DEPOSITO_HORARIO.abre / 60}h às ${DEPOSITO_HORARIO.fecha / 60}h)` : ''}`;
    if (a.det) return `Falta ${q}: use ${NOME_FERRAMENTA[DETRITOS[a.det].ferramenta]} aqui`; }
  if (a.limpeza) { const E = dadosEmpreita(a.empreita), ac = G.empreitas.aceitas[a.empreita];
    return `Use ${NOME_FERRAMENTA[E.ferramenta]} aqui para ${VERBO_DET[a.det] || 'limpar'} (faltam ${E.vezes - ((ac && ac.vezes) || 0)})`; }
  if (a.tipo === 'saida') return `Vá por aqui: ${typeof NOME_LUGAR !== 'undefined' && NOME_LUGAR[a.destino] || a.destino}`;
  if (a.det) { const f = NOME_FERRAMENTA[DETRITOS[a.det].ferramenta]; return `Use ${f} aqui para ${VERBO_DET[a.det] || 'limpar'}`; }
  if (a.morador) { const p = (G.mapa.moradores || []).find(x => x.id === a.morador); return `Botão direito: falar com ${p ? p.nome : a.morador}`; }
  // (14/10) O serviço no lugar de verdade: a ferramenta, quantos golpes faltam e, sem o material, o que trazer.
  if (a.empreita && !a.buscar && dadosEmpreita(a.empreita) && dadosEmpreita(a.empreita).local) { const E = dadosEmpreita(a.empreita), ac = G.empreitas.aceitas[a.empreita], resta = E.vezes - ((ac && ac.vezes) || 0);
    const usa = `use ${NOME_FERRAMENTA[E.ferramenta] || E.ferramenta} aqui (${resta} ${resta === 1 ? 'vez' : 'vezes'})`;
    return a.falta ? `Traga ${Itens.qtd(a.falta.n, a.falta.item)} e ${usa}` : usa[0].toUpperCase() + usa.slice(1); }
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
// (revisão da T4) As 17h e a janta da pensão por fazer depois delas (jantaPorFazer, cartao.js).
const _depoisDas17 = () => (G.minutos || 0) >= 17 * 60;
const _horaDaJanta = () => _depoisDas17() && typeof jantaPorFazer === 'function' && jantaPorFazer();
// A seta do mapa: { tipo: 'alvo' | 'saida', x, y (px de mundo), mapa, morador?, objeto?, det?, destino? } ou null.
function guiaSetaMundo() {
  if (!G.mapa) return null;
  const cands = [['janta_vez', _alvoDaJanta], ['reforma_vez', () => _alvoDaReforma(false)], ['casa_vez', _alvoDaCasa], ['tela_pedreira', _alvoDaPedreira], ['aula', _alvoDaAula], ['rosa_sonho', _alvoDoSonhoDaRosa], ['lojinha', _alvoDaLojinhaGuia]];   // (13/10) a primeira vez de cada passo da janta e da casa, na frente de tudo
  // (14/10, relato do jogador: a calçada e a cerca aceitas passaram para o outro dia "sem a seta mostrando onde deveria ser
  // feito") A causa: o serviço aceito vinha por último, depois de toda missão do guia e da caderneta; no dia seguinte uma
  // missão com alvo na Vila (a pensão, o Grêmio, o Bazar) tomava a seta. Agora o serviço aceito que é de hoje (o curto, que
  // passa de um dia para o outro até ser feito; a obra longa com trabalho hoje ou pronta) vem antes das missões e da
  // caderneta (sugestões); a primeira vez de cada coisa, a janta e o domingo do dia e a obra do Bira seguem na frente.
  const missoes = G.guia && G.guia.ativo ? _missoesDaSeta() : [], doDia = id => id === 'janta' || id === 'domingo';
  for (const id of missoes.filter(doDia)) cands.push([id, () => _alvoDaMissao(id)]);
  cands.push(['obra_dia', _alvoDaObraDoDia]);
  // (revisão da T4: à noite, a janta manda) Depois das 17h com a janta da pensão por fazer, o serviço aceito não toma a seta; o
  // recado sai da fila desde as 17h (de dia, fica junto com os serviços "de hoje", porque tem prazo).
  const servicos = _horaDaJanta() ? [] : _servicosDaSeta(), deHoje = servicos.filter(_servicoDeHoje);
  for (const cid of deHoje) cands.push(['servico', () => { const a = _alvoDaEmpreita(cid); return a && Object.assign({ empreita: cid }, a); }]);
  if (!_depoisDas17()) cands.push(['recado', _alvoDoRecadoGuia]);   // (15/10, T4) o recado aceito é "de hoje" (tem prazo): junto com os serviços
  // (Obra do Povo) A linha da caderneta escolhida no Mostrar (ou na ideia): depois das missões do guia; acabou a linha, ou o
  // Jocelino chegou lá, some a seta (revisão final). (T8, a vistoria jogando) O recado mostrado tem prazo, como o recado da 1ª vez:
  // vem junto dele, antes das missões. Antes, com a missão da pensão aberta (dias e dias), o Mostrar do recado apontava a madeira da
  // pensão na mata, e não o cogumelo do Tio Juca a dois passos; o recado vencia.
  let cad = null;
  if (G.setaFixa && typeof Caderneta !== 'undefined') { const l = Caderneta.linha(G.setaFixa);
    if (!l || !l.alvo) G.setaFixa = null; else cad = ['caderneta', () => { const a = typeof l.alvo === 'function' ? l.alvo() : l.alvo; return a && Object.assign({ rotuloFixo: l.rotulo || l.texto }, a); }]; }
  const cadRecado = !!cad && /^recado_/.test(G.setaFixa);
  if (cadRecado && !_depoisDas17()) cands.push(cad);
  for (const id of missoes.filter(x => !doDia(x))) cands.push([id, () => _alvoDaMissao(id)]);
  if (cad && (!cadRecado || _depoisDas17())) cands.push(cad);   // (depois das 17h, a janta manda: o recado volta para o fim)
  for (const cid of servicos.filter(x => !deHoje.includes(x))) cands.push(['servico', () => { const a = _alvoDaEmpreita(cid); return a && Object.assign({ empreita: cid }, a); }]);
  // (13/10) Primeiro o que dá para fazer no mapa onde o Jocelino está; só depois o caminho para outro lugar.
  const res = [];
  for (const [id, f] of cands) {
    const a = f(); if (!a) continue;
    if (id === 'caderneta' && !a.det && (!a.mapa || a.mapa === G.mapaId) && _chegou(a)) { G.setaFixa = null; continue; }   // (a limpeza do quintal segue o detrito mais perto: não "chega")
    res.push([id, a]);
  }
  // (tarefa 7, o robô jogador) Dentro do salão aberto (o restaurante, o Dave) nenhuma seta manda sair: era "Vá por aqui: Vila" na porta
  // durante a janta. E a conversa da Rosa depois da 1ª diária e a compra da lojinha com a entrada no bolso vêm antes das missões do
  // mapa de agora (o Agora já dizia isso, urgente, e a seta mandava falar com o Seu Ananias).
  const salaoAberto = typeof noPalco === 'function' && noPalco() && !!G.pensao && G.pensao.estado === 'aberta';
  const naFrente = res.filter(([id]) => id === 'rosa_sonho' || id === 'lojinha');
  const seta = _setaDe(naFrente, salaoAberto) || _setaDe(res, salaoAberto); if (seta || salaoAberto) return seta;
  // (15/10, foto do jogador: "missão da casa da família do seu Juca, não tinha seta indicando") A etapa da casa sem o dinheiro dela:
  // no quintal, sem nenhuma outra seta, aponta a plaquinha e diz quanto falta. Só no fim: na frente das outras, a seta ficava
  // presa na plaquinha e o que dava para fazer em outro mapa sumia (o robô jogador indo e voltando entre o quintal e a Vila).
  { const c = _alvoDaCasaSemDinheiro(); if (c) { const o = Object.assign({ tipo: 'alvo' }, c); const p = _posNoMapa(o); if (p) { Object.assign(o, p); o.rotulo = c.rotuloFixo; return o; } } }
  // (14/10) A primeira árvore de corte da mata (mapa_mata.js): sem outra seta, a mais perto, com a frase, até a primeira cair.
  { const m = typeof alvoDaArvoreDaMata === 'function' ? alvoDaArvoreDaMata() : null; if (m) { const o = Object.assign({ tipo: 'alvo', missao: 'mata_arvore' }, m, m.ponto); o.rotulo = _rotulo(o); return o; } }
  // (dia cheio, Frente A) A primeira coleta: sem nenhuma outra seta, o achado mais perto (uma vez: some depois de catar o primeiro).
  const a = _alvoDoAchado(); if (!a) return null;
  const o = Object.assign({ tipo: 'alvo', missao: 'achado' }, a, a.ponto); o.rotulo = _rotulo(o); return o;
}
// A seta de uma lista de alvos: primeiro o que está no mapa de agora; depois a saída para o mapa do primeiro que está em outro (sem saída no salão).
// (T4) O detrito do recado aparece mesmo a quem já sabe limpar: a seta ensina de onde vem o item.
function _setaDe(res, semSaida) {
  for (const [id, a] of res) if (!a.mapa || a.mapa === G.mapaId) { const p = _posNoMapa(a); if (p && a.det && jaSabeLimpar(a.det) && !a.recado && G.cam && _naTela(p)) continue; if (p) { const o = Object.assign({ tipo: 'alvo', missao: id }, a, p); o.rotulo = _rotulo(o); return o; } }
  if (semSaida) return null;
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
function _alvoDaLojinhaGuia() { return typeof _alvoDaLojinha === 'function' ? _alvoDaLojinha() : null; }
function _alvoDoAchado() {
  if (!G.guia || !G.guia.ativo || !G.limpou || G.limpou.achado || !G.mapa || !G.jog) return null;   // (sem o guia, nenhuma seta)
  let o = null, d = 1e9;
  for (const x of G.mapa.objs) if (x.achado) { const dd = Math.hypot(x.x - G.jog.x, x.y - G.jog.y); if (dd < d) { d = dd; o = x; } }
  return o && { mapa: G.mapaId, ponto: { x: o.x, y: o.y - 40 }, rotuloFixo: 'Botão direito: catar (o que nasce no chão vale dinheiro)' };
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
  receitas: { painel: '#modal .caderno', sel: '#modal .caderno .cad-capricho', faixa: '#modal .cad-faixa',
    usou: () => { const p = G.pensao; return !!p && (Object.keys(p.niveis || {}).length > 0 || p.receitas.length > Pensao.RECEITAS_INICIAIS.length); },
    escolhe(bts) {   // pesquisar, se a receita aberta é a nova; caprichar, se a pensão já deixa; senão, a receita nova a pesquisar
      const p = G.pensao, b = bts[0], pesquisa = 'Pesquisar gasta pitadas de tempero (as estrelas da janta viram pitadas) e abre uma receita nova no caderno.';
      if (b && /Pesquisar/.test(b.textContent)) return { el: b, frase: pesquisa };
      if (b && p.tetoCapricho() > p.nivel(_cadernoSel)) return { el: b, frase: 'Caprichar gasta ingredientes repetidos (os da lista ao lado) e sobe o nível do prato: mais preço, sabor e porções.' };
      const nova = document.querySelector('#modal .caderno .cad-icone.pode');
      if (nova) return { el: nova, frase: 'Receita nova: clique nela e pesquise com pitadas de tempero. Caprichar os pratos sobe com as estrelas da pensão.' };
      return b && { el: b, frase: 'Caprichar gasta ingredientes repetidos e sobe o nível do prato. A Rosa só capricha mais quando a pensão ganha estrela.' }; } },
  melhorias: { painel: '#modal .melhorias', sel: '#modal .melhorias .mel-item > button', faixa: '#modal .mel-faixa',
    usou: () => !!G.pensao && (G.pensao.melhorias || []).length > 0,
    escolhe: bts => { const b = _botaoLivre(bts); return b && { el: b, frase: 'Cada melhoria muda o salão e rende mais. Leia o que ela faz (▸) e clique em Comprar.' }; } },
  equipe: { painel: '#modal .equipe', sel: '#modal .equipe button', faixa: '#modal .eq-faixa',
    usou: () => !!G.pensao && (G.pensao.equipe || []).length > 0,
    escolhe(bts) {   // com candidatos, o posto do primeiro; sem eles (e com vaga), o cartaz mais barato
      const p = G.pensao, postos = Object.values(Equipe.POSTOS);
      if (p.candidatos.length) { const b = _botaoLivre(bts.filter(x => x.closest('.eq-bts') && postos.includes(x.textContent.trim())));
        return b && { el: b, frase: 'Escolha o posto e contrate: o Salão recolhe a louça, a Cozinha ajuda a Rosa e a Expedição busca ingrediente. Ele trabalha sozinho e cobra salário por noite.' }; }
      const b = bts.find(x => x.classList.contains('eq-anuncio'));
      return b && { el: b, frase: 'Para ter ajudante, ponha um anúncio: amanhã aparecem 3 candidatos. Cada um cobra salário por noite.' }; } },
  // - (14/10, Tarefa B) A expedição -> Dave (o dispatch: quem está na sala de espera vai buscar um tempero e volta no dia seguinte):
  //   a seta vai no botão Expedição de quem está na reserva (ou no posto de Expedição) e, com a lista aberta, num ingrediente.
  expedicao: { painel: '#modal .equipe', sel: '#modal .equipe .eq-expedir:not(.desligado), #modal .equipe .eq-ing', faixa: '#modal .eq-faixa',
    usou: () => !!G.pensao && (G.pensao.equipe || []).some(e => e.expedicao || (e.busca && e.busca !== 'sorteio')),
    escolhe(bts) {   // (revisão) o 2º passo diz o que vale para quem vai: o do posto busca toda manhã; o da reserva sai hoje e volta amanhã
      const ing = bts.find(x => x.classList.contains('eq-ing') && x.dataset.ing !== 'sorteio');
      if (ing) { const fixo = (ing.closest('.eq-escolha') || { dataset: {} }).dataset.posto === 'compras';
        return { el: ing, frase: fixo ? 'Escolha o ingrediente: quem está no posto de Expedição busca ele TODA MANHÃ, no salário do posto. O "traz ~N" diz quanto vem.'
          : 'Escolha o ingrediente: quem está na reserva sai hoje e volta AMANHÃ de manhã com ele. É grátis, só o salário do dia; o "traz ~N" diz quanto vem.' }; }
      const ex = bts.filter(x => x.classList.contains('eq-expedir')), b = ex.find(x => x.dataset.posto === 'reserva') || ex[0];
      // (a seta vem da esquerda: de cima, ela tapava o Treinar logo acima)
      return b && { el: b, lado: 'esquerda', frase: 'Quem está na reserva (ou no posto de Expedição) busca o ingrediente que você escolher: clique em Expedição.' }; } },
  // - O cardápio da noite -> Dave (o Bancho ensina o cardápio na primeira noite): a Rosa guia passo a passo no quadro da abertura —
  //   3 passos: o prato, a panela ("cada panela dá N porções") e o "Abrir a pensão", cuja fala explica o "Rosa repõe" (ligado de
  //   fábrica; G.limpou.cardapio_prato e _panela, contados no quadro; a tela some no primeiro "Abrir a pensão"). O save antigo também
  //   vê: o quadro obrigatório é novo.
  //   (correção 1) A fala da Rosa vai na faixa fixa da lousa, acima da lista (faixa), e não por cima do quadro; no Abrir, a seta vem
  //   da esquerda (lado), por cima da seta de giz, para não tapar a linha "Sempre tem".
  cardapio: { painel: '#modal .quadro-cardapio.abertura', sel: '#modal .quadro-cardapio [data-guia]', usou: () => false, faixa: '#modal .qc-rosa',
    escolhe() {
      const L = G.limpou || {}, q = s => document.querySelector('#modal .quadro-cardapio ' + s), linha = q('.qc-prato.marcado');
      if (!linha) { const n = q('.qc-prato .qc-nome'); return n && { el: n, frase: 'Rosa: "Escolha o prato da noite: clique no nome dele. Só sai o que estiver no quadro."' }; }
      const id = linha.dataset.prato, nome = Pratos.PRATOS[id].nome, mais = linha.querySelector('.qc-mais'), rp = linha.querySelector('.qc-repoe');
      if (!L.cardapio_panela && mais && !mais.classList.contains('desligada')) return { el: mais, frase: `Rosa: "Cada panela de ${nome} dá ${G.pensao.porcoesPorPanela(id)} porções, e a noite costuma ter ~${clientesEsperados()} clientes. Clique no + para mais uma panela."` };
      // (tarefa 7, o robô jogador) a seta não vai mais no "Rosa repõe": quem seguia a seta clicava nele e abria a primeira noite com ele
      // desligado. A explicação do repõe (ligado de fábrica) vai na fala do Abrir.
      const repoe = !rp || rp.classList.contains('acesa') ? 'O "Rosa repõe" ligado: quando a panela acaba eu faço outra com a despensa. ' : 'O "Não repõe": quando a panela acabar, o prato sai do quadro. ';
      const ab = q('.qc-abrir'); return ab && { el: ab, lado: 'esquerda', frase: `Rosa: "${repoe}Pronto! Abrir a pensão: eu faço as panelas agora (os ingredientes saem da despensa) e a janta começa."` }; } },
  // - (14/10, Tarefa E1) O calendário da pensão -> Stardew (o calendário na porta do Pierre: informa, não manda): na primeira vez a
  //   Rosa explica na faixa da lousa e a seta vai no dia que tem novidade (o jantar especial, a festa, o concurso; senão, hoje). É só
  //   para ler: a primeira vez acaba quando a lousa fecha (calendario_pensao.js marca G.limpou.tela_calendario).
  calendario: { painel: '#modal .calendario-pensao', sel: '#modal .calendario-pensao .cal-dia', usou: () => false, faixa: '#modal .cal-faixa',
    escolhe(dias) {
      const marcado = dias.find(d => d.querySelector('.cal-vip, .cal-festa, .cal-concurso')), alvo = marcado || dias.find(d => d.classList.contains('hoje')) || dias[0];
      return alvo && { el: alvo.querySelector('.cal-cabeca') || alvo, frase: marcado
        ? 'Rosa: "Aqui eu anoto a semana. Esse dia tem jantar especial: veja o prato e encha a despensa antes. O resto é quem costuma vir e o domingo fechado. É só para a gente se preparar!"'
        : 'Rosa: "Aqui eu anoto a semana: quem costuma jantar cada noite, o prato de cada um e o domingo fechado. Quando chegar carta de jantar especial, ele aparece aqui também."' }; } },
  // (tarefa 7, o robô jogador) o peixe que escapa dá 1 de experiência e apagava a fala do Seu Lourival antes do primeiro peixe pego;
  // o primeiro peixe dá 5 ou mais (Pesca.xp): a fala fica até ele
  pesca: { usou: () => (G.guia && (G.guia.cont.pescou || 0) > 0) || (!!G.hab && G.hab.xp.pesca >= 5) },
  pedreira: { usou: () => ((G.limpou || {}).rocha || 0) > 0 || ((G.limpou || {}).ferro || 0) > 0 || (G.guia && (G.guia.cont.pedreira || 0) > 0) || (!!G.mina && G.mina.maisFunda >= 1) },
  // - (15/10, T4) O 1º cartão de recado no quadro -> Stardew (o bilhete do Help Wanted: quem pede, o porquê e o prazo): a seta no
  //   "Aceitar" do recado, com o guia. Some no 1º recado aceito ou quando o quadro fecha depois de visto (_recadoVisto); o 1º bico
  //   (o "Aceitar" de um serviço) vem antes.
  recado: { painel: '#modal .quadro-vila', sel: '#modal [data-recado] button:not([disabled])',
    usou: () => !!G.recados && (G.recados.entregues > 0 || Object.keys(G.recados.ativos).length > 0),
    escolhe(bts) {
      if (!G.guia || !G.guia.ativo || !bts[0]) return null;
      if (G.guia.abertas.includes('bico') && !Object.keys(G.empreitas.aceitas).some(k => dadosEmpreita(k) && dadosEmpreita(k).tipo === 'curta')) return null;
      _recadoVisto = true;
      return { el: bts[0], frase: 'Recado de vizinho: leve o que pedem até o prazo. Paga na entrega e a pessoa fica mais sua amiga.' }; } },
};
let _recadoVisto = false;
const jaFezTela = id => ((G.limpou || {})['tela_' + id] || 0) > 0 || _tenta(PRIMEIRA_TELA[id].usou);
function _marcaTela(id) { if (G.limpou) G.limpou['tela_' + id] = (G.limpou['tela_' + id] || 0) + 1; }
{ const embrulha = (obj, m, id) => { const f = obj[m]; obj[m] = function (...a) { const r = f.apply(this, a); if (r === 'ok') _marcaTela(id); return r; }; };
  embrulha(Bazar, 'comprar', 'bazar'); embrulha(Pensao.prototype, 'caprichar', 'receitas'); embrulha(Pensao.prototype, 'pesquisar', 'receitas');
  embrulha(Melhorias, 'comprar', 'melhorias'); embrulha(Melhorias, 'subir', 'melhorias'); embrulha(Equipe, 'contratar', 'equipe'); embrulha(Equipe, 'expedir', 'expedicao');
  const pp = pegouPeixe; pegouPeixe = function (...a) { const r = pp.apply(this, a); _marcaTela('pesca'); return r; };
  // (15/10, T4) o 1º recado aceito apaga a seta do quadro; a 1ª entrega apaga as setas da origem e do morador
  if (typeof Recados !== 'undefined') { embrulha(Recados, 'aceitar', 'recado');
    const en = Recados.entregar; Recados.entregar = function (...a) { const r = en.apply(this, a); if (r === 'ok' && G.limpou) G.limpou.recado_entregue = (G.limpou.recado_entregue || 0) + 1; return r; }; } }
// (T4) O quadro com a seta do recado fechou: a 1ª vez da tela já foi vista.
ATUALIZADORES.push(() => { if (_recadoVisto && !document.querySelector('#modal .quadro-vila')) { _recadoVisto = false; _marcaTela('recado'); } });
// (T4) A 1ª peça da coleta que conta: a frase flutuante sobre o Jocelino, uma vez (G.limpou.recado_coleta). Vem depois da conta
// (recados_jogo.js carrega antes); vale também sem o guia, como o contador do serviço.
AO_PEGAR.push(item => {
  if (!G.recados || !G.limpou || G.limpou.recado_coleta || !G.jog) return;
  const id = Object.keys(G.recados.ativos).find(k => PEDIDOS_VILA[k].tipo === 'coleta' && PEDIDOS_VILA[k].item === item && G.recados.ativos[k].juntou > 0); if (!id) return;
  const P = PEDIDOS_VILA[id]; G.limpou.recado_coleta = 1;
  (G.guiaFlut = G.guiaFlut || []).push({ texto: `Recado: ${G.recados.ativos[id].juntou}/${Itens.qtd(P.qtd, P.item)} (conta o que juntar a partir de agora)`, x: G.jog.x, y: G.jog.y - 150, ate: (G.agora || 0) + 3 });
});
function _primeiraTelaUI() {
  for (const id in PRIMEIRA_TELA) {
    const T = PRIMEIRA_TELA[id]; if (!T.painel || !document.querySelector(T.painel) || jaFezTela(id)) continue;
    const r = T.escolhe([...document.querySelectorAll(T.sel)]); if (r && r.el) return { chave: 'tela_' + id, el: r.el, rotulo: r.frase, faixa: T.faixa, lado: r.lado };
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
// (14/10) Depois da conversa do Lourival (aulaDaPesca, pesca_jogo.js), a dica não repete o que ele disse: fica só o "!" e a
// barrinha; com o primeiro minijogo parado, a explicação está por cima dele e a dica some.
function _falaDaPesca() {
  if (!G.jog || !G.mapa || jaFezTela('pesca')) return null;
  const L = G.linha, ouviu = typeof aulaVista === 'function' && aulaVista();
  if (L && L.pausa) return null;
  if (ouviu && (!L || !['mordeu', 'minijogo'].includes(L.fase))) return null;
  const t = L ? FALA_PESCA[L.fase] :(typeof itemDaMao === 'function' && VARAS.includes(itemDaMao()) && ['praia', 'mata', 'alto_mar'].includes(G.mapaId) && !menuAberto() ? FALA_PESCA.vara : '');
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
    const b = [...document.querySelectorAll('#modal button')].find(x => !x.closest('[data-recado]') && /^Aceitar$/.test(x.textContent.trim())); if (b) return { chave: 'aceitar', el: b, rotulo: 'Clique em Aceitar' };   // (o "Aceitar" de um serviço, não o do recado)
  }
  if (noSalao) {
    const bt = re => [...document.querySelectorAll('#rodape-palco button')].find(x => re.test(x.textContent));
    if (ab.includes('janta') && !G.turno && typeof pensaoAbreHoje === 'function' && pensaoAbreHoje() && $('#modal').hidden) {
      // (o cardápio do Bancho) antes das 17h, o Adiantar; às 17h, com o quadro fechado, o "Cardápio" (a janta espera por ele)
      if (G.minutos < TurnoJanta.ABRE) { const b = bt(/Adiantar/); if (b) return { chave: 'adiantar', el: b, rotulo: 'Clique para pular até as 17h' }; }
      else if (jantaEsperaCardapio()) { const b = bt(/Cardápio/); if (b) return { chave: 'cardapio', el: b, rotulo: 'A janta espera o cardápio: clique aqui' }; } }
    if (ab.includes('domingo')) { const b = bt(/Despensa/); if (b) return { chave: 'despensa', el: b, rotulo: 'Clique para guardar na despensa' }; }
    // (Tarefa E1) a primeira carta de jantar especial (ou festa) da semana: a seta na Semana do rodapé (o calendário), fora da janta, uma vez
    if (!jaFezTela('calendario') && !G.turno && $('#modal').hidden && typeof Calendario !== 'undefined' && Calendario.temEspecial(G.pensao, G.dia)) {
      const b = $('#rodape-palco .bt-calendario'); if (b) return { chave: 'calendario', el: b, rotulo: 'Chegou carta de jantar especial: veja a Semana da pensão' }; }
    return null;
  }
  if (!$('#modal').hidden) return null;
  // A ferramenta certa na barra: a do detrito que a seta aponta, a do serviço aceito, a semente e o regador da horta.
  const sm = guiaSetaMundo();
  if (sm && sm.det && (sm.missao === 'quintal' || sm.missao === 'aula' || sm.buscar || sm.missao === 'caderneta' || sm.missao === 'obra_dia' || sm.missao === 'tela_pedreira')) { const D = DETRITOS[sm.det], ok = mao === D.ferramenta || (D.aceita || []).includes(mao); if (!ok) { const i = slotDe(D.ferramenta); if (i >= 0) return barra(i); } }
  if (sm && sm.missao === 'aula' && !sm.det) { const a = sm.aula; if (a && mao !== a.ferramenta) { const i = slotDe(a.ferramenta); if (i >= 0) return barra(i); } }
  if (sm && sm.empreita && !sm.buscar) { const E = dadosEmpreita(sm.empreita), fe = E && (E.tipo === 'longa' ? Empreitas.ferramentaHoje(sm.empreita) : E.ferramenta);
    if (fe && fe !== 'carga' && mao !== fe) { const i = slotDe(fe); if (i >= 0) return barra(i); } }
  // (tarefa 7) a seta da pesca na ponta do píer: a vara na barra
  if (sm && sm.missao === 'pesca' && sm.ponto && !sm.morador && typeof VARAS !== 'undefined' && !VARAS.includes(mao)) { const v = VARAS.find(x => slotDe(x) >= 0); if (v) return barra(slotDe(v)); }
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
// (13/10) A primeira vez com o barril d'água na mão: o Tio Juca diz como colocar, até o barril ir para o chão uma vez
// (G.limpou.barril_colocado, marcado em quintal_coisas.js).
const FALA_BARRIL = { quintal: 'O barril vai em qualquer grama livre do quintal: chegue perto e clique com o botão direito no chão (o quadrado verde mostra onde dá). Para mudar de novo, machado ou picareta recolhe.',
  fora: 'O barril vai no quintal: lá, botão direito na grama livre para colocar. Sem ele no chão, o regador não enche.' };
{ const p0 = guiaPasso; guiaPasso = function () {
  if (G.jog && typeof itemDaMao === 'function' && itemDaMao() === 'barril_agua' && !((G.limpou || {}).barril_colocado > 0))
    return { id: 'juca', nome: 'Tio Juca', texto: G.mapaId === 'quintal' ? FALA_BARRIL.quintal : FALA_BARRIL.fora, alvo: null };
  return p0();
}; }
// A seta do mapa, desenhada por cima (px de tela): em cima do alvo, balançando; fora da tela, na borda, girada para ele.
// Os painéis do HUD à vista (o cartão da família, o quadro, o relógio, a meta, os botões, a barra e, desde a tarefa 7, os avisos do canto),
// em px de tela: a seta e a frase não ficam embaixo deles (teste de 13/10: com o depósito no alto da tela, a seta e a frase sumiam atrás do
// cartão; tarefa 7: a frase da horta e a do Seu Ananias ficavam embaixo da pilha de avisos).
let _hudRects = [], _hudT = -1;
function paineisDoHud() {
  const t = G.agora || 0; if (t === _hudT) return _hudRects; _hudT = t;
  _hudRects = [...document.querySelectorAll('#hud .painel, #hud .botao, #hud .guia-dica:not([hidden]), #avisos .aviso')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0)
    .map(r => ({ x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 }));
  return _hudRects;
}
const _bate = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const _livre = r => !paineisDoHud().some(p => _bate(r, p));
// A frase: o primeiro lugar livre entre os candidatos (acima, abaixo), deslocada para o lado de quem a cobre; sem nenhum livre,
// o primeiro. O x fica dentro da tela.
function _lugarDaFrase(meia, cands, L) {
  const caixa = (x, y) => ({ x: x - meia, y: y - 18, w: meia * 2, h: 26 }), dentro = x => Math.min(Math.max(x, meia + 4), L - meia - 4);
  // (tarefa 7, o robô jogador) a frase inteira na tela: com o alvo perto da borda de cima (a saída para o quintal, na Vila), ela saía cortada
  const cabe = y => y - 18 >= 2 && y + 8 <= (G.alt || 1e9) - 2;
  for (const [x0, y] of cands) {
    if (!cabe(y)) continue;
    const x = dentro(x0); if (_livre(caixa(x, y))) return [x, y];
    const p = paineisDoHud().find(q => _bate(caixa(x, y), q)); if (!p) continue;
    for (const x2 of [p.x + p.w + meia + 4, p.x - meia - 4]) { const xx = dentro(x2); if (_livre(caixa(xx, y))) return [xx, y]; }
  }
  const y0 = cands.map(c => c[1]).find(cabe);
  return [dentro(cands[0][0]), y0 !== undefined ? y0 : Math.max(22, cands[0][1])];
}
DESENHOS_TELA.push(ctx => {
  const s = setaAgora();
  const img = spr('ui/seta'); if (!s || !img || !G.comecou) return;
  const w = img.naturalWidth * 0.8, h = img.naturalHeight * 0.8, z = G.zoom, L = G.larg, A = G.alt;
  const sx = (s.x - G.cam.x) * z, sy0 = (s.y - G.cam.y) * z, sy = sy0, bob = Math.sin((G.agora || 0) * 6) * 8;
  // (a frase inteira na tela: a frase longa, encostada na borda, saía cortada; vistoria de 12/10)
  ctx.save(); ctx.font = '900 17px Nunito'; const meia = s.rotulo ? ctx.measureText(s.rotulo).width / 2 + 14 : 0; ctx.restore();
  ctx.save();
  // Na tela: em cima do alvo, apontando para baixo; se um painel do HUD cobre esse lugar, embaixo do alvo, apontando para cima.
  // Fora: na borda, girada para o alvo. A frase vai no primeiro lugar livre perto da seta.
  if (sx > 20 && sx < L - 20 && sy > 20 && sy < A - 110) {
    // O ponto de cima do alvo coberto por um painel: a seta desce pelo próprio alvo (o prédio, a pessoa) até um trecho visível.
    let sy = sy0;
    const ob = s.objeto && G.mapa.objs.find(o => o.id === s.objeto), base = ((ob ? ob.y : s.y + (s.morador ? 140 : 40)) - G.cam.y) * z;
    while (!_livre({ x: sx - w / 2, y: Math.max(4, sy - h - 6), w, h }) && sy + 20 < base - 10) sy += 20;
    let top = Math.max(4, sy - h - 6);
    const embaixo = !_livre({ x: sx - w / 2, y: top, w, h }) && _livre({ x: sx - w / 2, y: sy + 10, w, h });
    if (embaixo) { top = sy + 10; ctx.save(); ctx.translate(sx, top + h / 2 - bob); ctx.rotate(Math.PI); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore(); }
    else ctx.drawImage(img, sx - w / 2, top + bob, w, h);
    if (s.rotulo) { const [x, y] = _lugarDaFrase(meia, embaixo ? [[sx, top + h + 24], [sx, sy - 14]] : [[sx, top - 8], [sx, top + h + 22]], L); texto(ctx, s.rotulo, x, y, 17, '#fff4cf', '900'); }
  }
  else {
    const cx = Math.min(Math.max(sx, 70), L - 70), cy = Math.min(Math.max(sy, 190), A - 160);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(sy - cy, sx - cx) - Math.PI / 2); ctx.drawImage(img, -w / 2, -h / 2 + bob, w, h); ctx.restore();
    if (s.rotulo) { const [x, y] = _lugarDaFrase(meia, [[cx, cy + h / 2 + 24], [cx, cy - h / 2 - 12]], L); texto(ctx, s.rotulo, x, y, 17, '#fff4cf', '900'); }
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
  // (correção 1) A tela que tem faixa (o quadro do cardápio): a frase vai na faixa dela, não flutuando por cima da tela.
  const vivo = !!(s && s.el && s.el.isConnected);
  let faixa = null;
  document.querySelectorAll('.guia-faixa').forEach(f => { const usa = vivo && !!s.faixa && f.matches(s.faixa); if (usa) faixa = f; if (f.hidden === usa) f.hidden = !usa; });
  if (!vivo) { d.hidden = true; t.hidden = true; return; }
  if (/^tela_/.test(s.chave) && !s.el._rolou) { s.el._rolou = true; s.el.scrollIntoView({ block: 'nearest' }); }   // (o botão fica à vista na página que rola; uma vez só, para não brigar com quem rola)
  if (faixa) { const tx = faixa.querySelector('.guia-faixa-texto'); if (tx && tx.textContent !== s.rotulo) tx.textContent = s.rotulo || ''; }
  const r = s.el.getBoundingClientRect(); d.hidden = false;
  t.hidden = !s.rotulo || !!faixa; t.textContent = faixa ? '' : s.rotulo || ''; const meia = (t.offsetWidth || 0) / 2 + 8;
  t.style.left = Math.round(Math.min(Math.max(r.left + r.width / 2, meia), Math.max(meia, innerWidth - meia))) + 'px'; t.style.top = Math.round(Math.max((t.offsetHeight || 0) + 4, r.top - 84)) + 'px';   // (a frase longa quebra em linhas e termina em cima da seta)
  // A seta: em cima do elemento, apontando para baixo; ou (lado: 'esquerda') à esquerda dele, deitada, apontando para a direita.
  d.classList.toggle('lado', s.lado === 'esquerda');
  const H = d.offsetHeight || 76;
  if (s.lado === 'esquerda') { d.style.left = Math.round(r.left - 6 - H / 2 - 27) + 'px'; d.style.top = Math.round(r.top + r.height / 2 - H / 2) + 'px'; }
  else { d.style.left = Math.round(r.left + r.width / 2 - 27) + 'px'; d.style.top = Math.round(r.top - 80) + 'px'; }
  // Na faixa, a frase fica do lado oposto ao da seta (a seta de cima cai dentro da faixa, logo acima da primeira linha).
  if (faixa) { const fr = faixa.getBoundingClientRect(); faixa.classList.toggle('direita', s.lado !== 'esquerda' && r.left + r.width / 2 < fr.left + fr.width / 2); }
}, 100);
