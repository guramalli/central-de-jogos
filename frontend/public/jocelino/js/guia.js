// Jocelino — guia.js — o guia das primeiras semanas (Frente 4 das melhorias, 12/10/2026; spec
// docs/superpowers/specs/2026-10-11-frente-4-primeiras-horas-design.md). Missões curtas na tela, cada sistema chega com quem
// ensina (o diário de missões do Stardew), e o passo a passo da 1ª obra e da 1ª janta (o Dave). Um sistema chega quando a
// missão anterior está feita E o dia mínimo chegou (ECO.guia.dias); se a anterior empacar, chega ECO.guia.espera dias depois
// do mínimo mesmo assim. Sem o guia ("Já conheço o jogo"), tudo chega só pelo dia mínimo, sem missões na tela.
const GUIA_VIZINHOS = ['ananias', 'zelia', 'ze'];
const _covasPlantadasRegadas = () => Object.values((G.horta && G.horta.covas) || {}).filter(c => c && c.planta && (c.regada || c.dias > 0)).length;   // regada hoje ou já crescendo (regada antes)
const _culturasNaDespensa = () => { const d = (G.pensao && G.pensao.despensa) || {}; return Object.keys(typeof CULTURAS !== 'undefined' ? CULTURAS : {}).reduce((t, id) => t + (d[id] || 0), 0); };
// A reforma pela metade (as 5 etapas de ECO.reforma e, de saves de antes delas, as telhas e as banquetas).
const _naReforma = e => ['telhas', 'mesas'].includes(e) || ECO.reforma.some(x => x.id === e);
// (revisão final) O material da etapa que falta e de que a mochila não tem nada (o primeiro): { item, n }, ou null. Com algo do que
// falta na mochila, o caminho é a Rosa (entregar primeiro). De onde vem cada um (a seta usa _alvoDoMaterial, como a empreita).
// (C3, 16/10; pendência da C2: com 1 madeira na mochila a seta ia à Rosa entregar 1) Como as pedras do Bira: o caminho é a Rosa só
// com o que completa a etapa na mochila — ou com o resto sem onde buscar hoje (o quintal e a mata sem madeira). Sem nada na mochila
// e sem onde buscar, { semFonte: true }: nem seta nem viagem à toa (amanhã o quintal e a mata repõem). n = o que ainda falta buscar.
function faltaDaReforma() {
  const p = G.pensao; if (!p || !G.mochila || !p._etapa()) return null;
  const f = Object.entries(p.faltaMaterial()); if (!f.length) return null;
  const temFonte = it => typeof materialAoAlcance !== 'function' || materialAoAlcance(it);
  const busca = f.find(([it, q]) => G.mochila.total(it) < q && temFonte(it));
  if (busca) return { item: busca[0], n: busca[1] - G.mochila.total(busca[0]) };
  if (f.some(([it]) => G.mochila.total(it) > 0)) return null;
  return { item: f[0][0], n: f[0][1], semFonte: true };
}
// (C3, 16/10) De onde vem, pelo lugar que ainda tem hoje (materialAoAlcance, guia_setas.js): o quintal, a mata, a pedreira.
const ORIGEM_MAPA = { madeira: { quintal: 'galho e toco, no machado (no quintal)', mata: 'árvore e galho, no machado (na mata, antes da ponte)' },
  pedra: { quintal: 'pedra, na picareta (no quintal)', pedreira: 'rocha, na picareta (na pedreira do Seu Tonico)', mata: 'pedra, na picareta (na beira do rio da mata)' } };
const origemDoMaterial = it => {
  if (LOJA.PRECOS[it] !== undefined) return typeof precoLoja === 'function' && G.dinheiro < precoLoja(it) ? `o Seu Ananias vende no depósito, a Cr$ ${precoLoja(it)} cada: junte o dinheiro` : 'o Seu Ananias vende no depósito';
  if (!ORIGEM_MAPA[it]) return 'entregue à Rosa';
  const m = typeof materialAoAlcance === 'function' ? materialAoAlcance(it) : 'quintal';
  if (m) return ORIGEM_MAPA[it][m];
  // (C7; a revisão da C3: "o quintal e a mata repõem" com a mata ainda fechada) só os lugares já abertos de onde o material vem
  const L = { quintal: 'o quintal', mata: 'a mata', pedreira: 'a pedreira' };
  const abertos = (typeof FONTE_MATERIAL !== 'undefined' && FONTE_MATERIAL[it] ? FONTE_MATERIAL[it].map(([x]) => x) : ['quintal'])
    .filter(x => L[x] && (x === 'quintal' || typeof Mundo === 'undefined' || Mundo.aberto(x))).map(x => L[x]);
  return `${listaE(abertos)} ${abertos.length > 1 ? 'repõem' : 'repõe'} de manhã`;
};
// (dia cheio, Frente B) O porquê da pesca, com o preço (a sardinha e a tainha, os peixes de todo dia do píer): sem a pensão, a banca do
// Seu Lourival compra na hora; com ela aberta, vai para a despensa da Rosa e vira prato. (O peixe não vai para a caixa de venda: é o
// prato da pensão — revisão da tarde livre, 13/10.)
function pescaParaOnde() {
  const pr = id => (typeof precoPeixe === 'function' && typeof DADOS_PEIXE !== 'undefined' && DADOS_PEIXE[id] ? precoPeixe(id) : 0), sp = `a sardinha vale Cr$ ${pr('sardinha')}, a tainha Cr$ ${pr('tainha')}`;
  // (correção 1) A banca fechada (domingo, ou fora das 7h–17h, como abrirBanca) não "paga na hora": diz quando abre.
  const aberta = !(typeof relogio !== 'undefined' && relogio.domingo()) && G.minutos >= 7 * 60 && G.minutos < 17 * 60;
  return G.pensao && G.pensao.estado === 'aberta' ? `o peixe vai para a despensa da Rosa e vira prato na janta (${sp})`
    : `${sp} na banca do Seu Lourival, ${aberta ? 'que paga na hora' : 'que abre das 7h às 17h, menos no domingo'}`;
}
const GUIA_MISSOES = [
  { id: 'obra', agora: () => { const l = typeof listaDeHoje === 'function' ? listaDeHoje() : null;
      if (l && !l.paga) { const ids = Object.keys(l.metas), feitas = ids.filter(id => (l.feito[id] || 0) >= l.metas[id]).length; return feitas < ids.length ? `A lista do dia do Bira: ${feitas} de ${ids.length} tarefas; completa, a diária de Cr$ ${Obra.diaria()}` : `Lista completa: receba a diária de Cr$ ${Obra.diaria()} com o Bira`; }
      return `O Mestre Bira contrata servente, na Vila: Cr$ ${Obra.diaria()} por dia, o primeiro dinheiro da casa`; }, titulo: 'A primeira obra', quem: 'Mestre Bira', texto: 'A primeira obra: o Mestre Bira, na Vila', feita: () => !!(G.obra && G.obra.lista && G.obra.lista.contou), alvo: () => ({ morador: 'bira' }) },   // contou: paga, ou fechada com mais da metade
  { id: 'vila', agora: 'Conhecer a Vila: o Seu Ananias (o depósito), a Dona Zélia (a obra é a casa dela) e o Zé (a massa)', titulo: 'Conhecer a Vila', quem: 'Mestre Bira', texto: 'Conhecer a Vila: Seu Ananias, Dona Zélia e o Zé', meta: 3, depois: 'obra',
    conta: () => GUIA_VIZINHOS.filter(i => G.guia.conversou.includes(i)).length,
    alvo: () => { const i = GUIA_VIZINHOS.find(v => !G.guia.conversou.includes(v)); return i ? { morador: i } : null; },
    intro: () => ['bira', 'Mestre Bira', [G.guia.feitas.includes('obra') ? 'Serviço bom, rapaz! Amanhã tem mais, a hora que você chegar.' : 'Rapaz, ainda não te vi na obra! É aqui na Vila, de sol a sol.',
      'Vai conhecer a Vila: o Seu Ananias, do depósito, a Dona Zélia e o Zé, que mexe a massa aqui na obra.', 'Depois de conhecer o pessoal, passa no quadro de serviços ali na frente da obra: tem bico pra fazer de tarde.']],
    aoFeita: () => {
      Guia.fila.push(['juca', 'Tio Juca', ['O que sobrou da limpeza (madeira, pedra, fibra) dá pra vender na caixa de venda, aqui no quintal.', 'Põe lá dentro e o carroceiro leva de madrugada: o dinheiro entra no resumo da noite.']]);
      // (roteiro de 13/10) Nada de carta prometida: a Dona Cotinha vende a lojinha, e a Rosa conta o sonho no quintal depois da diária.
      const L = G.lojinha || {};
      Guia.fila.push(['rosa', 'Rosa', ['Amor, sabe a pensão fechada da Dona Cotinha, lá na Vila? Ela é amiga da minha mãe.', L.conversou ? 'A gente já se entendeu: é juntar a entrada e comprar a lojinha dela. Eu cozinho pra fora, você vai ver.'
        : L.sonho ? 'Vem no quintal, que eu quero conversar com você: é um sonho que eu guardo desde Aracaju.'   // (revisão final: a diária já veio)
        : 'Quando você receber a diária, passa no quintal que eu te conto um sonho que guardo desde Aracaju.']]);
    } },
  { id: 'pensao', agora: () => { const p = G.pensao || {}; if (p.estado === 'fechada') return `A lojinha da Rosa: juntar Cr$ ${ECO.lojinha.entrada} de entrada (a Dona Cotinha vende)`;
      if (p.estado === 'limpar') return 'O sonho da Rosa: arrumar a pensão da Dona Cotinha, começando pela limpeza do salão (a casa amarela, ao lado do depósito)';
      const E = ECO.reforma.find(e => e.id === p.estado); if (!E) return 'A pensão da Rosa'; const f = p.faltaMaterial ? p.faltaMaterial() : {};
      const fr = faltaDaReforma();
      // (C3) com parte na mochila, quanto já tem; com tudo, "entregue à Rosa"
      const naMochila = Object.entries(f).filter(([i, q]) => G.mochila.total(i) > 0 && G.mochila.total(i) < q).map(([i]) => `${G.mochila.total(i)} na mochila`);
      return Object.keys(f).length ? `A reforma — ${E.nome}: falta ${Object.entries(f).map(([i, q]) => Itens.qtd(q, i)).join(', ')}${fr && naMochila.length ? ` (${naMochila.join(', ')})` : ''}${fr ? ' — ' + origemDoMaterial(fr.item) : ' (entregue à Rosa)'}`
        : p.feitaHoje && p.feitaHoje(G.dia) ? `A reforma — ${E.nome}: por hoje chega, amanhã tem mais` : `A reforma — ${E.nome}: ${E.dias - ((p.reforma || {}).dias || 0)} dia(s) de trabalho no salão`; }, titulo: 'Reformar a pensão', quem: 'Dona Cotinha', texto: 'Reformar a pensão: limpar o salão, o telhado, o balcão, a cozinha e a pintura', depois: 'vila', dia: 'pensao', carta: 'cotinha_pensao', libera: 'pensao', prioridade: true,
    abre: () => typeof Lojinha !== 'undefined' && Lojinha.comprada(),   // (13/10) só depois da compra da lojinha; quem abre a reforma é a compra
    feita: () => !!G.pensao && ['pronta', 'aberta'].includes(G.pensao.estado), aoAbrir: () => {} },
  { id: 'horta', titulo: 'A primeira horta', quem: 'Tio Juca', texto: 'A primeira horta: plante e regue 10 covas', meta: 10, dia: 'horta', libera: 'horta', conta: _covasPlantadasRegadas,
    agora: 'A horta da família: plante as sementes do Tio Juca no canteiro e regue (a Rosa cozinha, a caixa de venda leva o resto)',
    // (revisão: o save antigo que passou da chegada sem as sementes recebe as do Tio Juca ao abrir a horta)
    aoAbrir: () => { if (G.dia > 1 && G.mochila && !G.mochila.total('semente_alface') && typeof presentesDaChegada === 'function') { G.mochila.adicionar('semente_alface', 15); if (typeof avisar === 'function') avisar('O Tio Juca deixou um pacote de sementes de alface na porta.'); } } },
  // (C3, 16/10) prioridade: com as vagas do guia cheias, a apresentação da 1ª janta não fica para depois da fala da inauguração
  { id: 'janta', agora: 'Hoje é a inauguração da pensão: a primeira janta da Rosa, às 17h, com a Vila convidada (o dinheiro da janta também vai para a casa)', titulo: 'A primeira janta', quem: 'Rosa', texto: 'A primeira janta: às 17h, na pensão', depois: 'pensao', prioridade: true, abre: () => !!G.pensao && G.pensao.estado === 'aberta' && (G.dia - 1) % 7 !== 6,   // no domingo a pensão não abre
    feita: () => !!(G.relatorioPensao && G.relatorioPensao.servidos > 0),
    intro: ['rosa', 'Rosa', ['Amor, hoje é a inauguração! Às 17h a pensão abre, e eu convidei a Vila inteira.', 'Eu cozinho, você serve. Lá dentro eu te ensino, passo a passo.']] },
  // (o bico vem na tarde do dia 1, depois da Vila: o ritmo do balanço pede as empreitas cedo, e a tarde do dia 1 era vazia)
  { id: 'bico', agora: 'Bico de tarde: o quadro de serviços da Vila paga na hora', titulo: 'O primeiro bico', quem: 'Mestre Bira', texto: 'O primeiro bico: um serviço do quadro (na frente da obra)', depois: 'vila', dia: 'quadro', libera: 'quadro',
    feita: () => !!G.empreitas && G.empreitas.entregues >= 1,
    alvo: () => { const id = G.empreitas && Object.keys(G.empreitas.aceitas).find(k => dadosEmpreita(k) && dadosEmpreita(k).tipo === 'curta'); return { objeto: id ? 'emp_' + id : 'quadro_pedidos' }; },
    aoAbrir: () => { if (G.empreitas && typeof Empreitas !== 'undefined') Empreitas.poeQuadro(G.dia); }, },
  { id: 'gremio', agora: 'A Vila quer o Grêmio de volta: a lista do povo está na porta (cada ala pronta muda a Vila)', titulo: 'A Obra do Povo', quem: 'Dona Zélia', texto: 'A Obra do Povo: ver a lista na porta do Grêmio (na Vila)', meta: 1, depois: 'vila', comoDepois: 'aberta', dia: 'gremio', carta: 'zelia_gremio', libera: 'gremio',
    conta: () => G.guia.cont.gremio || 0, alvo: () => ({ objeto: 'gremio' }) },
  // (o domingo vale só naquele dia: na segunda se encerra sem recompensa, para não ocupar a vaga das outras; revisão final: só com a
  // pensão aberta — antes dela não há despensa de pensão, e ele não abre nem expira)
  { id: 'domingo', agora: 'Domingo da família: guarde verdura da horta na despensa da pensão', titulo: 'Domingo em família', quem: 'Rosa', texto: 'Domingo em família: guarde 5 da horta na despensa da pensão', meta: 5, depois: 'horta', dia: 'domingo', semana: 6, expira: 1, conta: _culturasNaDespensa,
    abre: () => !!G.pensao && G.pensao.estado === 'aberta',
    alvo: () => ({ objeto: 'despensa_pensao' }), intro: ['rosa', 'Rosa', ['Domingo é dia de família. O que a horta der, guarda na despensa da pensão: vira comida boa.']] },
  // (dia cheio, Frente B) A carta do Seu Lourival no dia 2, como a do Willy (a única datada da 1ª semana do Stardew): depois só da
  // primeira obra (o dia 1 de serviço), não mais do bico — o bico pode estar aberto no dia 2, e a pesca ficava para o dia 5. Como a
  // pensão, não espera vaga (prioridade): a carta vem pelo calendário mesmo com a horta e o bico abertos.
  { id: 'pesca', agora: () => `O Seu Lourival chamou para pescar no píer — ${pescaParaOnde()}`, titulo: 'A primeira pescaria', quem: 'Seu Lourival', texto: 'Pescar 3 peixes no píer da praia', meta: 3, depois: 'obra', dia: 'pesca', prioridade: true, carta: 'lourival_praia', libera: 'praia', conta: () => G.guia.cont.pescou || 0, alvo: () => ({ morador: 'lourival' }) },
  { id: 'bazar', agora: 'O Bazar do Salim abriu no Mercado: coisas para a família (garrafa térmica, bicicleta, fogão)', titulo: 'O Bazar do Salim', quem: 'Seu Salim', texto: 'Visitar o Bazar do Salim (no Mercado)', meta: 1, depois: 'bico', dia: 'bazar', carta: 'folheto_salim', libera: 'bazar', conta: () => G.guia.cont.bazar || 0, alvo: () => ({ objeto: 'balcao_bazar' }) },
  { id: 'pedreira', agora: 'A pedreira do Seu Tonico abriu: pedra boa para a obra e para o Grêmio', titulo: 'A pedreira', quem: 'Seu Tonico', texto: 'Quebrar 10 pedras na pedreira', meta: 10, depois: 'bazar', comoDepois: 'aberta', dia: 'pedreira', carta: 'tonico_pedreira', libera: 'pedreira', conta: () => G.guia.cont.pedreira || 0, alvo: () => ({ morador: 'tonico' }) },
  { id: 'mina', agora: 'A mina do Seu Tonico: ferro para ferramentas melhores', titulo: 'A mina', quem: 'Seu Tonico', texto: 'Descer na mina do Seu Tonico', depois: 'pedreira', dia: 'mina', carta: 'tonico_bancadas', libera: 'mina', feita: () => !!G.mina && G.mina.maisFunda >= 1 },
];
const GUIA_SISTEMAS = ['pensao', 'horta', 'quadro', 'gremio', 'praia', 'bazar', 'pedreira', 'mina'];
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
    let cartaHoje = false;
    for (const m of Guia._ordem()) {
      if (g.feitas.includes(m.id) || g.abertas.includes(m.id)) continue;
      if ((m.carta && !manha) || !Guia.podeAbrir(m)) continue;
      const atrasada = G.dia >= Guia.diaMin(m) + ECO.guia.espera;
      if (g.ativo && g.abertas.length >= ECO.guia.maxAbertas && !atrasada && !m.prioridade) continue;   // a pensão (o centro) e a carta da pesca (a do Willy) não esperam vaga
      // uma carta por manhã: a outra chega amanhã (só com o guia; sem ele tudo chega pelo dia mínimo, e os dias não colidem)
      if (g.ativo && cartaHoje && Guia._cartaNova(m)) continue;
      if (Guia._cartaNova(m)) cartaHoje = true;
      Guia._abrir(m); mudou.push({ abriu: m.id });
      if (Guia.feita(m)) { Guia._fechar(m); mudou.push({ feita: m.id }); }
    }
    return mudou;
  },
  // (dia cheio, Frente B) Sem duas cartas na mesma manhã (o correio do Stardew traz uma novidade por vez): as missões de carta na
  // ordem do dia mínimo (a pensão, o centro, primeiro), nos lugares delas na lista; se duas colidem, a mais nova fica para amanhã.
  // Só conta a carta que vai mesmo para a caixa (a da lojinha já lida na compra não ocupa a manhã).
  _ordem() {
    const cartas = GUIA_MISSOES.filter(m => m.carta).sort((a, b) => (b.prioridade ? 1 : 0) - (a.prioridade ? 1 : 0) || Guia.diaMin(a) - Guia.diaMin(b));
    let k = 0; return GUIA_MISSOES.map(m => m.carta ? cartas[k++] : m);
  },
  _cartaNova(m) { return !!m.carta && !!G.correio && !G.correio.caixa.includes(m.carta) && !G.correio.lidas.includes(m.carta); },
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
    if (g.ativo) { if (premio && typeof avisar === 'function') avisar(`${m.quem} agradeceu: ${premio}.`); if (m.aoFeita) m.aoFeita(); }
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
    if (dia >= ECO.guia.dias.gremio || lidas.includes('zelia_gremio')) g.antes.push('gremio');   // (o Grêmio, 12/10: sem missão no save antigo; a carta vem de manhã)
    for (const m of GUIA_MISSOES) {
      const feita = (m.libera && g.antes.includes(m.libera)) || (['quintal', 'obra', 'vila'].includes(m.id) && dia > 1)
        || (m.id === 'janta' && pz.estado === 'aberta' && (pz.ultimaJanta || 0) > 0) || (m.id === 'domingo' && dia > 7 && pz.estado === 'aberta');   // (revisão final: em reforma, o domingo fica para depois da abertura)
      // (a reforma pela metade fica aberta: a seta e a frase guiam até a pensão; teste de 12/10)
      if (feita && m.id === 'pensao' && _naReforma(pz.estado)) { g.abertas.push('pensao'); continue; }
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
    // A reforma pela metade dada como feita (saves de 12/10, antes do conserto da migração): volta a ficar aberta, com a seta.
    if (G.guia.ativo && G.guia.feitas.includes('pensao') && s.pensao && _naReforma(s.pensao.estado)) { G.guia.feitas = G.guia.feitas.filter(x => x !== 'pensao'); if (!G.guia.abertas.includes('pensao')) G.guia.abertas.push('pensao'); }
    // Nos testes (?test=1, o MODO_TESTE de base.js, como as boas-vindas), o jogo novo sem guia pedido começa com tudo liberado; quem testa o guia pede s.guia.
    if (!s.guia && novoJogo && MODO_TESTE.ativo) Guia.liberarTudo();
  },
  // Para os testes antigos (que usam os sistemas em qualquer dia): tudo liberado e todas as missões feitas.
  liberarTudo() { if (!G.guia) G.guia = Guia.novo(true); G.guia.antes = GUIA_SISTEMAS.slice(); G.guia.feitas = GUIA_MISSOES.map(m => m.id); G.guia.abertas = []; },
};
// As cartas do roteiro só chegam pelo guia (não pela data antiga). A da horta saiu do roteiro em 13/10 (as sementes vêm na
// chegada, da mão do Tio Juca): não chega mais.
if (typeof CARTAS !== 'undefined' && CARTAS.juca_horta) CARTAS.juca_horta.dia = 1e9;
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
// (13/10: as missões não ficam mais pregadas na tela; o cartão da família mostra a de agora, em palavras de gente)
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
    if (!a.objeto || (typeof setaAgora === 'function' && setaAgora() && setaAgora().objeto === a.objeto)) continue;   // a seta já aponta
    const o = G.mapa.objs.find(x => x.id === a.objeto); if (!o) continue;
    const linhas = new Set((o.tiles || [{ y: 0 }]).map(t => t.y)).size;
    desenhaFx(ctx, 'exclamacao', o.x, o.y - linhas * TILE - 26 + Math.sin((G.agora || 0) * 5) * 4);
  }
}; }
// ---------- a dica do passo a passo (a 1ª obra; a 1ª janta na Task 4) e o contador da obra ----------
// ({obra} = a obra da vez, "a obra da casa da Dona Zélia" ou "a obra do Mercado": o canteiro segue a obra, obra_jogo.js)
const PASSO_OBRA = { areia: ['Agora a areia: a peneira do canteiro. Botão direito nela até completar.', 'peneira'],
  tijolos: ['Os tijolos: pegue no monte (botão direito) e leve até {obra}.', 'monte_tijolos'],
  massa: ['A massa: pegue na masseira e leve para o Zé.', 'masseira'], ripas: ['As ripas: pegue na pilha e leve para a obra.', 'pilha_ripas'],
  pedras: ['As pedras: pegue no monte (botão direito) e leve até {obra}. As da mochila também valem.', 'monte_tijolos'],
  buscar_pedra: ['As pedras: quebre as pedras do quintal com a picareta e traga 10 na mochila. Depois entregue n{obra} (botão direito) ou fale comigo.', null], entulho: ['O entulho: quebre os montinhos de entulho do canteiro.', null] };
let guiaPasso = function () {
  const g = G.guia; if (!g || !g.ativo) return null;
  if (g.abertas.includes('obra') && G.mapaId === 'vila') {
    const l = G.obra.lista && G.obra.lista.dia === G.dia ? G.obra.lista : null, fechada = Obra.aberta(G.dia, G.minutos);
    if (fechada && fechada !== 'cedo') return null;   // de tarde, no domingo e na chuva a obra não está aberta: sem dica
    if (!l) return { id: 'bira', nome: 'Mestre Bira', texto: 'Bom dia! Fale comigo para pegar a lista do dia (botão direito em mim).', alvo: { morador: 'bira' } };
    if (Obra.completa()) return l.paga ? null : { id: 'bira', nome: 'Mestre Bira', texto: 'Lista completa! Fale comigo para receber a diária.', alvo: { morador: 'bira' } };
    if (G.jog && G.jog.carga && typeof CARGA_TAREFA !== 'undefined' && CARGA_TAREFA[G.jog.carga.id]) return { id: 'bira', nome: 'Mestre Bira', texto: `Agora leve até ${aObraDaVez()}.`, alvo: { objeto: idDaObraDaVez() } };
    const id = Object.keys(l.metas).find(k => (l.feito[k] || 0) < l.metas[k]);
    // (teste de 13/10: com as pedras na mochila, o passo não dizia onde entregar)
    // (C2, 16/10) só com as pedras que completam a tarefa (com 1 pedra e 0/10, a dica é a de buscar no quintal)
    if ((id === 'buscar_pedra' || id === 'pedras') && (typeof pedrasParaEntregar === 'function' ? pedrasParaEntregar(id) : G.mochila.total('pedra') > 0)) return { id: 'bira', nome: 'Mestre Bira', texto: `Trouxe as pedras? Entregue n${aObraDaVez()}: botão direito no canteiro (${l.feito[id] || 0}/${l.metas[id]}).`, alvo: { objeto: idDaObraDaVez() } };
    // (15/10) lavar e pintar: a ferramenta vem do Bira; com ela, a frase da seta e a obra
    if ((id === 'lavar' || id === 'pintar') && typeof faltaFerramentaDaObra === 'function') {
      if (faltaFerramentaDaObra(id)) return { id: 'bira', nome: 'Mestre Bira', texto: `Fale comigo: eu te dou ${id === 'lavar' ? 'a mangueira' : 'o rolo de pintura'}.`, alvo: { morador: 'bira' } };
      return { id: 'bira', nome: 'Mestre Bira', texto: `${FERRAMENTA_TAREFA[id]} (${l.feito[id] || 0}/${l.metas[id]}).`, alvo: { objeto: idDaObraDaVez() } };
    }
    const [texto, obj] = PASSO_OBRA[id] || [`Agora: ${TAREFAS_OBRA[id] ? TAREFAS_OBRA[id].texto : id}.`, null];
    return { id: 'bira', nome: 'Mestre Bira', texto: texto.replace('{obra}', aObraDaVez()), alvo: obj ? { objeto: obj } : null };
  }
  return null;
};
// A 1ª janta (o Dave): a Rosa ensina o serviço pela dica, um passo por vez, conforme o salão.
function passoJanta() {
  const t = G.turno;
  if (!t && typeof jantaEsperaCardapio === 'function' && jantaEsperaCardapio()) return 'A janta espera o cardápio: no quadro de giz ("Cardápio", lá embaixo), escolha os pratos e as panelas e clique em "Abrir a pensão".';
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
// (revisão final) A dica não cobre o que a seta manda clicar (foto primeira_pedreira_escada: a fala do Seu Tonico cobria a escada):
// se o alvo da seta — do ponto dela até o pé do objeto — cai onde a dica fica (embaixo, 172 px acima do fundo), a dica sobe e
// termina acima da frase da seta (a seta é desenhada em cima do ponto, e a frase em cima dela: guia_setas.js).
function dicaForaDaSeta(d, hud) {
  let alto = false, topo = 0;
  const s = !d.hidden && typeof setaAgora === 'function' ? setaAgora() : null;
  if (s && s.tipo === 'alvo' && G.cam && G.mapa) {
    const z = G.zoom || 1, sx = (s.x - G.cam.x) * z, sy = (s.y - G.cam.y) * z;
    const o = s.objeto ? G.mapa.objs.find(x => x.id === s.objeto) : null, pe = o ? (o.y - G.cam.y) * z : sy + 80 * z;
    const r = d.getBoundingClientRect(), H = hud.getBoundingClientRect(), base = H.bottom - 172;
    const meia = s.rotulo ? s.rotulo.length * 4.6 : 0;   // (14/10) a frase da seta, centrada nela, também não pode ficar embaixo da dica
    alto = sx > r.left - 30 - meia && sx < r.right + 30 + meia && pe > base - r.height - 10 && sy < base + 10;
    const seta = typeof spr === 'function' && spr('ui/seta'), hSeta = seta ? seta.naturalHeight * 0.8 : 80;
    topo = Math.max(56, Math.round(sy - hSeta - 40 - r.height - 8 - H.top));   // (40: o balanço da seta, o vão e a frase de 17 px)
  }
  if (d.classList.contains('alto') !== alto) d.classList.toggle('alto', alto);
  const t = alto ? topo + 'px' : ''; if (d.style.top !== t) d.style.top = t;
}
// A caixinha da dica (HTML, com o retrato que já existe), sem pausar nada.
ATUALIZADORES.push(() => {
  let d = document.getElementById('guia-dica'); const hud = document.getElementById('hud'); if (!hud) return;
  const p = guiaPasso(), chave = p ? p.id + '|' + p.texto : '';
  if (!d) { d = el('div', { id: 'guia-dica', class: 'guia-dica' }); d.hidden = true; hud.append(d); }
  dicaForaDaSeta(d, hud);
  if (d._chave === chave) return; d._chave = chave;
  d.hidden = !p; d.innerHTML = '';
  if (p) d.append(el('img', { src: urlArte('retratos/' + (p.retrato || p.id + '_normal')), alt: '' }), el('div', {}, el('b', {}, p.nome + ': '), p.texto));
});
// O contador da obra: cada tarefa que avança mostra "Peneirar areia 2/3" em cima do lugar, por 1,5 s.
{ const t0 = Obra.trabalho; Obra.trabalho = function (id, n, ...resto) {
  const r = t0.call(this, id, n, ...resto);   // (o resto: quem fez — a turma do Bira não conta em dobro)
  // (só o Jocelino na obra da Vila; a turma do mestre trabalha sozinha, sem contador)
  try { if ((r === 'ok' || r === 'completa') && G.jog && G.mapaId === 'vila' && !(typeof ehMestre === 'function' && ehMestre())) { const l = G.obra.lista, f = G.jog.frente(); (G.guiaFlut = G.guiaFlut || []).push({ texto: `${TAREFAS_OBRA[id] ? TAREFAS_OBRA[id].texto : id} ${l.feito[id]}/${l.metas[id]}`, x: f.x, y: f.y - 40, ate: (G.agora || 0) + 1.5 }); } } catch (e) { }
  return r;
}; }
{ const d0 = desenhaMapa; desenhaMapa = function (ctx) {
  d0(ctx);
  if (!G.guiaFlut || !G.guiaFlut.length) return;
  G.guiaFlut = G.guiaFlut.filter(f => f.ate > (G.agora || 0));
  // (14/10) letra menor e sempre dentro da tela: perto da borda, o contador encosta nela em vez de sair.
  const tam = 17, vis = ctx.canvas.width / (G.zoom * G.dpr), m = 10;
  ctx.font = `900 ${tam}px Nunito`;
  for (const f of G.guiaFlut) {
    const w = ctx.measureText(f.texto).width, x = Math.max(G.cam.x + w / 2 + m, Math.min(G.cam.x + vis - w / 2 - m, f.x));
    f.desenho = { x1: x - w / 2, x2: x + w / 2, vis1: G.cam.x, vis2: G.cam.x + vis };   // (para o teste: onde caiu)
    texto(ctx, f.texto, x, f.y - (1.5 - (f.ate - (G.agora || 0))) * 20, tam, '#fff8e8', '900');
  }
}; }
// (o contador é do lugar onde se trabalhou: trocou de mapa, some; vistoria de 12/10)
AO_ENTRAR_MAPA.push(() => { G.guiaFlut = []; });
