// Jocelino — guia.js — o guia das primeiras semanas (Frente 4 das melhorias, 12/10/2026; spec
// docs/superpowers/specs/2026-10-11-frente-4-primeiras-horas-design.md). Missões curtas na tela, cada sistema chega com quem
// ensina (o diário de missões do Stardew), e o passo a passo da 1ª obra e da 1ª janta (o Dave). Um sistema chega quando a
// missão anterior está feita E o dia mínimo chegou (ECO.guia.dias); se a anterior empacar, chega ECO.guia.espera dias depois
// do mínimo mesmo assim. Sem o guia ("Já conheço o jogo"), tudo chega só pelo dia mínimo, sem missões na tela.
const GUIA_VIZINHOS = ['ananias', 'zelia', 'ze'];
const _covasPlantadasRegadas = () => Object.values((G.horta && G.horta.covas) || {}).filter(c => c && c.planta && (c.regada || c.dias > 0)).length;   // regada hoje ou já crescendo (regada antes)
const _culturasNaDespensa = () => { const d = (G.pensao && G.pensao.despensa) || {}; return Object.keys(typeof CULTURAS !== 'undefined' ? CULTURAS : {}).reduce((t, id) => t + (d[id] || 0), 0); };
const GUIA_MISSOES = [
  { id: 'quintal', titulo: 'Limpar o quintal', quem: 'Tio Juca', texto: 'Limpar o quintal (mato, pedra, galho)', meta: 5, conta: () => G.guia.cont.limpou || 0,
    aoFeita: () => avisar('Ganhou marmitas! Para comer, clique com o botão direito na marmita da barra: dá energia. A mochila abre na tecla E.') },
  { id: 'obra', titulo: 'A primeira obra', quem: 'Mestre Bira', texto: 'A primeira obra (das 7h ao meio-dia, na Vila)', feita: () => !!(G.obra && G.obra.lista && G.obra.lista.contou), alvo: () => ({ morador: 'bira' }) },   // contou: paga, ou fechada com mais da metade
  { id: 'vila', titulo: 'Conhecer a Vila', quem: 'Mestre Bira', texto: 'Conhecer a Vila: Seu Ananias, Dona Zélia e o Zé', meta: 3, depois: 'obra',
    conta: () => GUIA_VIZINHOS.filter(i => G.guia.conversou.includes(i)).length,
    alvo: () => { const i = GUIA_VIZINHOS.find(v => !G.guia.conversou.includes(v)); return i ? { morador: i } : null; },
    intro: () => ['bira', 'Mestre Bira', [G.guia.feitas.includes('obra') ? 'Serviço bom, rapaz! A obra é só de manhã: de tarde é com você.' : 'Rapaz, ainda não te vi na obra! Ela é das 7h ao meio-dia, aqui na Vila.',
      'Vai conhecer a Vila: o Seu Ananias, do depósito, a Dona Zélia e o Zé, que mexe a massa aqui na obra.', 'Depois de conhecer o pessoal, passa no quadro de serviços ali na frente da obra: tem bico pra fazer de tarde.']],
    aoFeita: () => {
      Guia.fila.push(['juca', 'Tio Juca', ['O que sobrou da limpeza (madeira, pedra, fibra) dá pra vender na caixa de venda, aqui no quintal.', 'Põe lá dentro e o carroceiro leva de madrugada: o dinheiro entra no resumo da noite.']]);
      const respondeu = G.correio && (G.correio.caixa.includes('cotinha_pensao') || G.correio.lidas.includes('cotinha_pensao'));
      Guia.fila.push(['rosa', 'Rosa', ['Amor, sabe a pensão fechada da Dona Cotinha, lá na Vila? Ela é amiga da minha mãe.', respondeu ? 'Escrevi pra ela, e ela já respondeu! A carta está na caixa de correio.' : 'Escrevi pra ela. Se ela deixar, a gente arruma a casa e eu cozinho pra fora. A resposta chega pelo correio!']]);
    } },
  { id: 'pensao', titulo: 'Reformar a pensão', quem: 'Dona Cotinha', texto: 'Reformar a pensão: limpar o salão, as telhas e a madeira', depois: 'vila', dia: 'pensao', carta: 'cotinha_pensao', libera: 'pensao', prioridade: true,
    feita: () => !!G.pensao && ['pronta', 'aberta'].includes(G.pensao.estado), aoAbrir: () => { if (G.pensao) G.pensao.abrirReforma(); } },
  { id: 'horta', titulo: 'A primeira horta', quem: 'Tio Juca', texto: 'A primeira horta: plante e regue 10 covas', meta: 10, depois: 'pensao', comoDepois: 'aberta', dia: 'horta', carta: 'juca_horta', libera: 'horta', conta: _covasPlantadasRegadas },
  { id: 'janta', titulo: 'A primeira janta', quem: 'Rosa', texto: 'A primeira janta: às 17h, na pensão', depois: 'pensao', abre: () => !!G.pensao && G.pensao.estado === 'aberta' && (G.dia - 1) % 7 !== 6,   // no domingo a pensão não abre
    feita: () => !!(G.relatorioPensao && G.relatorioPensao.servidos > 0),
    intro: ['rosa', 'Rosa', ['Amor, hoje é a primeira janta! Às 17h vem gente na pensão.', 'Eu cozinho, você serve. Lá dentro eu te ensino, passo a passo.']] },
  // (o bico vem na tarde do dia 1, depois da Vila: o ritmo do balanço pede as empreitas cedo, e a tarde do dia 1 era vazia)
  { id: 'bico', titulo: 'O primeiro bico', quem: 'Mestre Bira', texto: 'O primeiro bico: um serviço do quadro (na frente da obra)', depois: 'vila', dia: 'quadro', libera: 'quadro',
    feita: () => !!G.empreitas && G.empreitas.entregues >= 1,
    alvo: () => { const id = G.empreitas && Object.keys(G.empreitas.aceitas).find(k => dadosEmpreita(k) && dadosEmpreita(k).tipo === 'curta'); return { objeto: id ? 'emp_' + id : 'quadro_pedidos' }; },
    aoAbrir: () => { if (G.empreitas && typeof Empreitas !== 'undefined') { G.empreitas.dia = G.dia; G.empreitas.quadro = Empreitas.quadroDoDia(G.dia); } }, },
  // (o domingo vale só naquele dia: na segunda se encerra sem recompensa, para não ocupar a vaga das outras)
  { id: 'domingo', titulo: 'Domingo em família', quem: 'Rosa', texto: 'Domingo em família: guarde 5 da horta na despensa da pensão', meta: 5, depois: 'horta', dia: 'domingo', semana: 6, expira: 1, conta: _culturasNaDespensa,
    alvo: () => ({ objeto: 'despensa_pensao' }), intro: ['rosa', 'Rosa', ['Domingo é dia de família. O que a horta der, guarda na despensa da pensão: vira comida boa.']] },
  { id: 'pesca', titulo: 'A primeira pescaria', quem: 'Seu Lourival', texto: 'Pescar 3 peixes no píer da praia', meta: 3, depois: 'bico', dia: 'pesca', carta: 'lourival_praia', libera: 'praia', conta: () => G.guia.cont.pescou || 0, alvo: () => ({ morador: 'lourival' }) },
  { id: 'bazar', titulo: 'O Bazar do Salim', quem: 'Seu Salim', texto: 'Visitar o Bazar do Salim (no Mercado)', meta: 1, depois: 'pesca', comoDepois: 'aberta', dia: 'bazar', carta: 'folheto_salim', libera: 'bazar', conta: () => G.guia.cont.bazar || 0, alvo: () => ({ objeto: 'balcao_bazar' }) },
  { id: 'pedreira', titulo: 'A pedreira', quem: 'Seu Tonico', texto: 'Quebrar 10 pedras na pedreira', meta: 10, depois: 'bazar', comoDepois: 'aberta', dia: 'pedreira', carta: 'tonico_pedreira', libera: 'pedreira', conta: () => G.guia.cont.pedreira || 0, alvo: () => ({ morador: 'tonico' }) },
  { id: 'mina', titulo: 'A mina', quem: 'Seu Tonico', texto: 'Descer na mina do Seu Tonico', depois: 'pedreira', dia: 'mina', carta: 'tonico_bancadas', libera: 'mina', feita: () => !!G.mina && G.mina.maisFunda >= 1 },
];
const GUIA_SISTEMAS = ['pensao', 'horta', 'quadro', 'praia', 'bazar', 'pedreira', 'mina'];
const Guia = {
  fila: [],
  novo(ativo = true) { return { ativo, feitas: [], abertas: [], cont: {}, conversou: [], antes: [], versao: 0 }; },
  missao(id) { return GUIA_MISSOES.find(m => m.id === id); },
  diaMin(m) { return m.dia ? ECO.guia.dias[m.dia] : 1; },
  feita(m) { try { return m.meta ? m.conta() >= m.meta : !!m.feita(); } catch (e) { return false; } },
  progresso(m) { try { return m.meta ? Math.min(m.meta, m.conta()) : undefined; } catch (e) { return 0; } },
  // O sistema já chegou? Sem o estado do guia (o simulador, as regras puras), vale o dia mínimo.
  liberado(sis) {
    const g = G.guia; if (!g) return G.dia >= (ECO.guia.dias[sis === 'praia' ? 'pesca' : sis] || 1);
    if (g.antes.includes(sis)) return true;
    const m = GUIA_MISSOES.find(x => x.libera === sis); if (!m) return true;
    return g.abertas.includes(m.id) || g.feitas.includes(m.id);
  },
  // Pode abrir hoje? O dia mínimo; com o guia, a anterior feita (ou só aberta, quando comoDepois) — ou a espera passou.
  podeAbrir(m, dia = G.dia) {
    const g = G.guia, min = Guia.diaMin(m);
    if (dia < min || (m.abre && !m.abre())) return false;
    if (m.semana !== undefined && (dia - 1) % 7 !== m.semana) return false;   // o domingo só no domingo
    if (!g.ativo || !m.depois) return true;
    const ok = g.feitas.includes(m.depois) || (m.comoDepois === 'aberta' && g.abertas.includes(m.depois));
    return ok || dia >= min + ECO.guia.espera;
  },
  // A volta do guia: fecha o que ficou pronto e abre o que pode (até ECO.guia.maxAbertas; a de carta só de manhã; a atrasada
  // pela espera passa na frente do limite, para nada empacar).
  tique(manha = false) {
    const g = G.guia, mudou = []; if (!g) return mudou;
    for (const id of g.abertas.slice()) {
      const m = Guia.missao(id); if (!m) continue;
      if (Guia.feita(m)) { Guia._fechar(m); mudou.push({ feita: id }); }
      else if (m.expira && G.dia >= ((g.desde || {})[id] || G.dia) + m.expira) { g.abertas = g.abertas.filter(x => x !== id); g.feitas.push(id); g.versao++; mudou.push({ expirou: id }); }
    }
    for (const m of GUIA_MISSOES) {
      if (g.feitas.includes(m.id) || g.abertas.includes(m.id)) continue;
      if ((m.carta && !manha) || !Guia.podeAbrir(m)) continue;
      const atrasada = G.dia >= Guia.diaMin(m) + ECO.guia.espera;
      if (g.ativo && g.abertas.length >= ECO.guia.maxAbertas && !atrasada && !m.prioridade) continue;   // a pensão (o centro) não espera vaga
      Guia._abrir(m); mudou.push({ abriu: m.id });
      if (Guia.feita(m)) { Guia._fechar(m); mudou.push({ feita: m.id }); }
    }
    return mudou;
  },
  _abrir(m) {
    const g = G.guia; g.abertas.push(m.id); g.versao++; (g.desde = g.desde || {})[m.id] = G.dia;
    if (m.carta && G.correio && !G.correio.caixa.includes(m.carta) && !G.correio.lidas.includes(m.carta)) G.correio.caixa.push(m.carta);
    if ((m.libera === 'praia' || m.libera === 'pedreira') && G.lugares) G.lugares[m.libera] = true;
    if (m.aoAbrir) m.aoAbrir();
    if (g.ativo && m.intro) Guia.fila.push(typeof m.intro === 'function' ? m.intro() : m.intro);
  },
  _fechar(m) {
    const g = G.guia; g.abertas = g.abertas.filter(x => x !== m.id); g.feitas.push(m.id); g.versao++;
    const premio = Guia.premiar(m.id);
    if (g.ativo) { if (typeof avisar === 'function') avisar(`Missão cumprida: ${m.titulo || m.texto}!${premio ? ' Ganhou ' + premio + '.' : ''}`); if (typeof sons !== 'undefined') sons.tocar('fanfarra', 1.1, 0, -8); if (m.aoFeita) m.aoFeita(); }
    else if (premio && typeof avisar === 'function') avisar('+ ' + premio);
  },
  // A recompensa (ECO.guia.recompensas): na mochila (o que não couber cai no chão) ou na despensa da pensão. Devolve o texto.
  premiar(id) {
    const r = ECO.guia.recompensas[id]; if (!r) return '';
    const partes = [];
    for (const it in r.mochila || {}) { const sobra = G.mochila.adicionar(it, r.mochila[it]); if (sobra && typeof soltar === 'function' && G.jog) soltar(it, sobra, G.jog.x, G.jog.y); partes.push(`${Itens.nome(it)} ×${r.mochila[it]}`); }
    for (const it in r.despensa || {}) { if (!G.pensao) continue; G.pensao.despensa[it] = (G.pensao.despensa[it] || 0) + r.despensa[it]; partes.push(`${Itens.nome(it)} ×${r.despensa[it]} na despensa`); }
    return partes.join(', ');
  },
  evento(tipo, dado) {
    const g = G.guia; if (!g) return;
    if (tipo === 'conversou') { if (!g.conversou.includes(dado)) { g.conversou.push(dado); g.versao++; } return; }
    g.cont[tipo] = (g.cont[tipo] || 0) + 1; g.versao++;
  },
  // As linhas do quadro de tarefas (só com o guia): a missão em destaque; a de carta ainda na caixa avisa da carta.
  linhas() {
    const g = G.guia; if (!g || !g.ativo) return [];
    return g.abertas.map(id => {
      const m = Guia.missao(id), carta = m.carta && G.correio && G.correio.caixa.includes(m.carta);
      return carta ? { texto: `➤ ${m.quem}: chegou carta! (caixa de correio do quintal)` } : { texto: `➤ ${m.quem}: ${m.texto}`, feito: Guia.progresso(m), meta: m.meta };
    });
  },
  // Onde pôr o "!": quem pede ou onde fazer (a carta na caixa já tem o envelope pulando).
  alvos() {
    const g = G.guia; if (!g || !g.ativo) return [];
    const r = [];
    for (const id of g.abertas) { const m = Guia.missao(id); if (m.carta && G.correio && G.correio.caixa.includes(m.carta)) continue; const a = m.alvo && m.alvo(); if (a) r.push(a); }
    return r;
  },
  // O save antigo (sem guia): o que já chegou fica liberado e as missões dele contam como feitas (sem recompensa).
  migrar(s) {
    const g = Guia.novo(true), lidas = (s.correio && (s.correio.lidas || []).concat(s.correio.caixa || [])) || [], lug = s.lugares || {}, dia = s.dia || 1;
    const pz = s.pensao || {};
    if (pz.estado && pz.estado !== 'fechada') g.antes.push('pensao');
    if (lidas.includes('juca_horta')) g.antes.push('horta');
    g.antes.push('quadro');
    if (lug.praia || lidas.includes('lourival_praia')) g.antes.push('praia');
    if (dia >= 4 || lidas.includes('folheto_salim')) g.antes.push('bazar');
    if (lug.pedreira || lidas.includes('tonico_pedreira')) g.antes.push('pedreira');
    if ((s.mina && s.mina.aberta) || lidas.includes('tonico_bancadas')) g.antes.push('mina');
    for (const m of GUIA_MISSOES) {
      const feita = (m.libera && g.antes.includes(m.libera)) || (['quintal', 'obra', 'vila'].includes(m.id) && dia > 1)
        || (m.id === 'janta' && pz.estado === 'aberta' && (pz.ultimaJanta || 0) > 0) || (m.id === 'domingo' && dia > 7);
      if (feita) g.feitas.push(m.id);
    }
    return g;
  },
  // A carta já aparece no quadro pela missão (o guia ligado e a missão dela aberta)?
  cartaNaTela(id) { const g = G.guia; return !!g && g.ativo && g.abertas.some(x => { const m = Guia.missao(x); return m && m.carta === id; }); },
  salvar(s) { if (G.guia) s.guia = JSON.parse(JSON.stringify(G.guia)); },
  carregar(s) {
    const novoJogo = !s.guia && (s.dia || 1) === 1 && !(s.correio && s.correio.lidas && s.correio.lidas.length);
    G.guia = s.guia ? Object.assign(Guia.novo(true), JSON.parse(JSON.stringify(s.guia))) : novoJogo ? Guia.novo(true) : Guia.migrar(s);
    Guia.fila.length = 0;
    G.guia.feitas = G.guia.feitas.filter(id => Guia.missao(id)); G.guia.abertas = G.guia.abertas.filter(id => Guia.missao(id));   // um id que sumiu não trava
    // Nos testes (?teste=1, como as boas-vindas), o jogo novo sem guia pedido começa com tudo liberado; quem testa o guia pede s.guia.
    if (!s.guia && novoJogo && typeof location !== 'undefined' && /teste=1/.test(location.search)) Guia.liberarTudo();
  },
  // Para os testes antigos (que usam os sistemas em qualquer dia): tudo liberado e todas as missões feitas.
  liberarTudo() { if (!G.guia) G.guia = Guia.novo(true); G.guia.antes = GUIA_SISTEMAS.slice(); G.guia.feitas = GUIA_MISSOES.map(m => m.id); G.guia.abertas = []; },
};
// As cartas do roteiro só chegam pelo guia (não pela data antiga).
for (const m of GUIA_MISSOES) if (m.carta && typeof CARTAS !== 'undefined' && CARTAS[m.carta]) CARTAS[m.carta].dia = 1e9;
// ---------- no jogo ----------
function guiaEvento(tipo, dado) { try { Guia.evento(tipo, dado); } catch (e) { } }
const _guiaAlvo = pred => { try { return Guia.alvos().some(pred); } catch (e) { return false; } };
function guiaMarcaMorador(id) { return _guiaAlvo(a => a.morador === id); }
function guiaMarcaObjeto(id) { return _guiaAlvo(a => a.objeto === id); }
INICIADORES.push(s => Guia.carregar(s));
COLETORES.push(s => Guia.salvar(s));
MANHA.push(() => Guia.tique(true));
// A volta (a cada 6 quadros) e a fila das falas (fora de menu e fora do serviço da janta).
let _guiaQuadro = 0;
ATUALIZADORES.push(() => {
  if (!G.guia || (++_guiaQuadro % 6)) return;
  if (G.dia === 1 && !G.guia.feitas.length && !G.guia.abertas.length) Guia.tique(true);   // o primeiro dia abre sem esperar a manhã
  else Guia.tique(false);
  if (Guia.fila.length && !menuAberto() && !(typeof noPalco === 'function' && noPalco() && G.turno)) {
    const [id, nome, paginas] = Guia.fila.shift();
    abrirConversa(nome, urlArte('retratos/' + id + '_normal'), paginas);
  }
});
TAREFAS.push(() => Guia.linhas());
ANTES_DE_CONVERSAR.push(p => { guiaEvento('conversou', p.id); return false; });
// Os eventos que contam: a pesca (embrulho), o Bazar aberto (embrulho), a limpeza e a pedreira (gancho em quebrar).
{ const p0 = pegouPeixe; pegouPeixe = function (...a) { const r = p0.apply(this, a); guiaEvento('pescou'); return r; }; }
{ const b0 = abrirBazar; abrirBazar = function (...a) { guiaEvento('bazar'); return b0.apply(this, a); }; }
function quebrouNoGuia(o) {
  if (G.mapaId === 'quintal' && ['mato', 'pedra', 'galho', 'toco'].includes(o.det)) guiaEvento('limpou');
  if (G.mapaId === 'pedreira') guiaEvento('pedreira');   // toda rocha da pedreira conta (pedra, ferro...)
}
// O "!" em cima do objeto da missão (os moradores, no personagens.js).
{ const d0 = desenhaMapa; desenhaMapa = function (ctx) {
  d0(ctx);
  if (!G.mapa || !G.guia || !G.guia.ativo) return;
  for (const a of Guia.alvos()) {
    if (!a.objeto) continue;
    const o = G.mapa.objs.find(x => x.id === a.objeto); if (!o) continue;
    const linhas = new Set((o.tiles || [{ y: 0 }]).map(t => t.y)).size;
    desenhaFx(ctx, 'exclamacao', o.x, o.y - linhas * TILE - 26 + Math.sin((G.agora || 0) * 5) * 4);
  }
}; }
// ---------- a dica do passo a passo (a 1ª obra; a 1ª janta na Task 4) e o contador da obra ----------
const PASSO_OBRA = { areia: ['Agora a areia: a peneira ali no canto. Botão direito nela até completar.', 'peneira'],
  tijolos: ['Os tijolos: pegue no monte (botão direito) e leve até a obra da casa da Dona Zélia.', 'monte_tijolos'],
  massa: ['A massa: pegue na masseira e leve para o Zé.', 'masseira'], ripas: ['As ripas: pegue na pilha e leve para a obra.', 'pilha_ripas'],
  pedras: ['As pedras: pegue no monte e leve para a obra.', 'monte_tijolos'],
  buscar_pedra: ['As pedras: quebre as pedras do quintal com a picareta e traga 10 na mochila. Depois é só falar comigo.', null], entulho: ['O entulho: quebre os montinhos de entulho do canteiro.', null] };
let guiaPasso = function () {
  const g = G.guia; if (!g || !g.ativo) return null;
  if (g.abertas.includes('obra') && G.mapaId === 'vila') {
    const l = G.obra.lista && G.obra.lista.dia === G.dia ? G.obra.lista : null, fechada = Obra.aberta(G.dia, G.minutos);
    if (fechada && fechada !== 'cedo') return null;   // de tarde, no domingo e na chuva a obra não está aberta: sem dica
    if (!l) return { id: 'bira', nome: 'Mestre Bira', texto: fechada === 'cedo' ? 'A obra abre às 7h. Enquanto isso, dá pra limpar o quintal.' : 'Bom dia! Fale comigo para pegar a lista do dia (botão direito em mim).', alvo: { morador: 'bira' } };
    if (Obra.completa()) return l.paga ? null : { id: 'bira', nome: 'Mestre Bira', texto: 'Lista completa! Fale comigo para receber a diária.', alvo: { morador: 'bira' } };
    if (G.jog && G.jog.carga && typeof CARGA_TAREFA !== 'undefined' && CARGA_TAREFA[G.jog.carga.id]) return { id: 'bira', nome: 'Mestre Bira', texto: 'Agora leve até a obra da casa da Dona Zélia.', alvo: { objeto: 'casa_zelia' } };
    const id = Object.keys(l.metas).find(k => (l.feito[k] || 0) < l.metas[k]);
    const [texto, obj] = PASSO_OBRA[id] || [`Agora: ${TAREFAS_OBRA[id] ? TAREFAS_OBRA[id].texto : id}.`, null];
    return { id: 'bira', nome: 'Mestre Bira', texto, alvo: obj ? { objeto: obj } : null };
  }
  return null;
};
// A 1ª janta (o Dave): a Rosa ensina o serviço pela dica, um passo por vez, conforme o salão.
function passoJanta() {
  const t = G.turno;
  if (!t) return typeof pensaoAbreHoje === 'function' && pensaoAbreHoje() ? 'Às 17h a janta começa. Pode adiantar o relógio no botão "Adiantar", lá embaixo.' : null;
  if (t.bandeja.some(x => x.tipo !== 'prato' && x.tipo !== 'bebida')) return 'Louça na bandeja: leve até a bacia, no canto da cozinha.';
  if (t.bandeja.some(x => x.tipo === 'prato')) return 'Prato na bandeja: leve até a mesa de quem pediu.';
  if (t.passaPrato().length) return 'Prato pronto no passe (o balcão da cozinha): vá pegar.';
  if (t.bebidaPedida()) return 'Pediram bebida! No bebedouro, segure e solte o copo na linha.';
  if (t.mesas.some(m => m.estado === 'suja')) return 'Mesa suja: recolha a louça e leve até a bacia.';
  if (t.mesas.some(m => m.estado === 'pedido')) return 'Cliente escolhendo: o pedido aparece no balão. Eu já começo a cozinhar.';
  return 'Isso! Fique de olho nas mesas: quem chega, quem pede, quem termina.';
}
{ const p0 = guiaPasso; guiaPasso = function () {
  const g = G.guia;
  if (g && g.ativo && g.abertas.includes('janta') && typeof noPalco === 'function' && noPalco()) { const tx = passoJanta(); return tx ? { id: 'rosa', retrato: 'rosa_cozinha_normal', nome: 'Rosa', texto: tx, alvo: null } : null; }
  return p0();
}; }
// O "!" segue o passo (por cima dos alvos da missão).
{ const a0 = Guia.alvos; Guia.alvos = function () { const p = guiaPasso(); if (p) return p.alvo ? [p.alvo] : []; return a0.call(Guia); }; }
// A caixinha da dica (HTML, com o retrato que já existe), sem pausar nada.
ATUALIZADORES.push(() => {
  let d = document.getElementById('guia-dica'); const hud = document.getElementById('hud'); if (!hud) return;
  const p = guiaPasso(), chave = p ? p.id + '|' + p.texto : '';
  if (!d) { d = el('div', { id: 'guia-dica', class: 'guia-dica' }); d.hidden = true; hud.append(d); }
  if (d._chave === chave) return; d._chave = chave;
  d.hidden = !p; d.innerHTML = '';
  if (p) d.append(el('img', { src: urlArte('retratos/' + (p.retrato || p.id + '_normal')), alt: '' }), el('div', {}, el('b', {}, p.nome + ': '), p.texto));
});
// O contador da obra: cada tarefa que avança mostra "Peneirar areia 2/3" em cima do lugar, por 1,5 s.
{ const t0 = Obra.trabalho; Obra.trabalho = function (id, n) {
  const r = t0.call(this, id, n);
  // (só o Jocelino na obra da Vila; a turma do mestre trabalha sozinha, sem contador)
  try { if ((r === 'ok' || r === 'completa') && G.jog && G.mapaId === 'vila' && !(typeof ehMestre === 'function' && ehMestre())) { const l = G.obra.lista, f = G.jog.frente(); (G.guiaFlut = G.guiaFlut || []).push({ texto: `${TAREFAS_OBRA[id] ? TAREFAS_OBRA[id].texto : id} ${l.feito[id]}/${l.metas[id]}`, x: f.x, y: f.y - 40, ate: (G.agora || 0) + 1.5 }); } } catch (e) { }
  return r;
}; }
{ const d0 = desenhaMapa; desenhaMapa = function (ctx) {
  d0(ctx);
  if (!G.guiaFlut || !G.guiaFlut.length) return;
  G.guiaFlut = G.guiaFlut.filter(f => f.ate > (G.agora || 0));
  for (const f of G.guiaFlut) texto(ctx, f.texto, f.x, f.y - (1.5 - (f.ate - (G.agora || 0))) * 20, 22, '#fff8e8', '900');
}; }
