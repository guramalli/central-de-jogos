// Jocelino — recados.js — os recados do povo da Vila (o Help Wanted do Stardew; plano de 15/10, "Quadro de pedidos da Vila"),
// as regras (a tela, o mundo e o guia vêm depois, em recados_jogo.js e empreitas_jogo.js):
// - 1 recado por dia a partir do dia ECO.recados.diaMin (no Stardew, nada no dia 1), só com o quadro liberado pelo guia;
// - quem pede é um morador com boneco andando no mapa (decisão do dono, 15/10): Zélia, Ananias, Zé, Bira, Tonico, Juca e o
//   Lourival depois que a praia abre. A Rosa e as crianças não pedem (no Stardew, a esposa e os filhos também não);
// - só o que dá para fazer agora: a estação certa, o mapa de onde vem o item aberto, a horta plantada (ou o item na mochila) e,
//   para madeira, pedra e fibra, o bastante no mundo aberto (os detritos que soltam o item);
// - o cliente é diferente dos clientes dos serviços do dia; o tipo alterna no ritmo de 2 entregas para 1 coleta (as entregas são a
//   maioria, como no Stardew): depois de uma coleta vem entrega, e depois de 2 entregas seguidas vem coleta, quando houver
//   (ECO.recados.entregasPorColeta; com 1, alterna dia sim, dia não); sem histórico, a entrega pesa 2 e a coleta 1; nada se
//   repete em 7 dias, e o que está há mais tempo sem aparecer pesa mais;
// - prazo de 2 dias (o dia em que aceitou e o seguinte); vencido, some sem multa; até 2 recados aceitos de uma vez;
// - a entrega é direto da mochila (decisão do dono, 15/10: botão direito no morador, "Entregar 3 couves?"): paga na hora o
//   valor do ECO e dá +1 de amizade (a Lábia vale); a coleta só conta o que entrar na mochila depois de aceitar;
// - o recado NÃO conta para a Fala da Vila nem para a carreira (decisão do dono, 15/10): só dinheiro e amizade.
// Campos: tipo ('entrega' | 'coleta'), cliente, item, qtd, fala (o pedido, na voz da pessoa), obrigado, deixa (o recado vencido, sem
// bronca, para o resumo da noite), estacoes (0 Outono, 1 Inverno, 2 Primavera, 3 Verão), mapas (de onde vem o item), diaMin e,
// quando precisa, `precisa` (a ferramenta: a vara) e `falaPedreira` (a fala depois que a pedreira abre). O pagamento mora no ECO.

const TODO_ANO = [0, 1, 2, 3];
const PEDIDOS_VILA = {
  // ---- Entregas dos primeiros dias
  ent_couve_zelia: { tipo: 'entrega', cliente: 'zelia', item: 'couve', qtd: 3, estacoes: [0, 1], mapas: ['quintal'], diaMin: 8,
    fala: 'Meu filho, me deu uma saudade de caldo verde... Três pés de couve bem verdinhos e eu faço um panelão.',
    obrigado: 'Ai, que beleza de couve! Passa aqui de noite pra provar o caldo.',
    deixa: 'Deixa, meu filho, a vizinha arrumou umas couves.' },
  // (T3, 15/10) O 2º recado da Dona Zélia, possível desde o dia 2 (o da couve só vem com a horta): a flor nasce no chão do quintal e da Vila.
  ent_flor_zelia: { tipo: 'entrega', cliente: 'zelia', item: 'flor', qtd: 3, estacoes: [0, 1, 2], mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: 'Meu filho, hoje tem terço lá em casa e o altarzinho da sala tá sem flor. Arruma três flores do mato pra mim?',
    obrigado: 'Que lindeza! O altar vai ficar todo prosa. Deus te pague, meu filho.',
    deixa: 'A comadre trouxe flor de plástico, meu filho. Serve, serve.' },
  ent_goiaba_tonico: { tipo: 'entrega', cliente: 'tonico', item: 'goiaba', qtd: 3, estacoes: [0, 1], mapas: ['quintal', 'vila'], diaMin: 2,
    fala: 'Goiaba no tacho de cobre fica outra coisa, Jocelino. Me arruma três, que a forja tá quente.',
    obrigado: 'Cheiro de doce na ferraria! Valeu, rapaz.',
    deixa: 'Deixa estar, rapaz: o doce fica pra outra fornada.' },
  ent_flor_bira: { tipo: 'entrega', cliente: 'bira', item: 'flor', qtd: 3, estacoes: [0, 1, 2], mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: 'Rapaz, hoje é aniversário da patroa e eu esqueci. Arruma umas flores do mato antes das cinco?',
    obrigado: 'Salvou minha pele! Ela nem vai desconfiar.',
    deixa: 'Comprei umas flores na feira mesmo. Fica pra próxima, rapaz.' },
  ent_coco_ze: { tipo: 'entrega', cliente: 'ze', item: 'coco', qtd: 2, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'praia'], diaMin: 2,
    fala: 'Sol de rachar na laje, Jocelino! Me arruma dois cocos que eu divido com a peãozada.',
    obrigado: 'Ê, água de coco! Lá lá laiá!',
    deixa: 'A peãozada tomou água da bica mesmo. Tranquilo, parceiro!' },
  ent_fibra_ze: { tipo: 'entrega', cliente: 'ze', item: 'fibra', qtd: 10, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: 'A amarração do andaime tá podre. Me traz dez de fibra que eu tranço uma corda nova.',
    obrigado: 'Corda nova, andaime firme. Obrigado, parceiro.',
    deixa: 'Arrumei uma corda emprestada. Fica pra próxima, parceiro.' },
  ent_madeira_juca: { tipo: 'entrega', cliente: 'juca', item: 'madeira', qtd: 10, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: 'Sobrinho, a lenha acabou e a água do banho das crianças é no fogão. Dez de madeira resolve.',
    obrigado: 'Lenha boa, seca. Ê, Aracaju ensinou direito.',
    deixa: 'Esquentei a água com o que tinha, sobrinho. Sem problema.' },
  ent_pedra_ananias: { tipo: 'entrega', cliente: 'ananias', item: 'pedra', qtd: 15, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata', 'pedreira'], diaMin: 2,
    fala: 'O caminhão da Serra não desce enquanto a estrada tá fechada, e o freguês quer pedra pro alicerce. Quinze pedras?',
    falaPedreira: 'Freguês apressado, pedra pouca. Quinze pedras, Jocelino?',
    obrigado: 'Pedra boa. Material bem pago, freguês.',
    deixa: 'O freguês achou pedra em outro canto. Fica pra próxima.' },
  ent_alface_ananias: { tipo: 'entrega', cliente: 'ananias', item: 'alface', qtd: 5, estacoes: [0, 1, 2], mapas: ['quintal'], diaMin: 6,
    fala: 'O caminhão da Ceasa não veio e a freguesia da Mercearia quer verdura. Cinco pés de alface?',
    obrigado: 'Já tem freguesa esperando! Pois não, obrigado.',
    deixa: 'A Ceasa mandou verdura no fim das contas. Obrigado assim mesmo.' },
  ent_tomate_bira: { tipo: 'entrega', cliente: 'bira', item: 'tomate', qtd: 2, estacoes: [0, 1, 2], mapas: ['quintal'], diaMin: 11,
    fala: 'A peãozada reclamou do molho aguado da marmita. Dois tomates bons fazem milagre.',
    obrigado: 'Agora sim, molho de verdade!',
    deixa: 'A marmita foi de molho aguado mesmo. Fica pra próxima!' },
  // ---- Entregas das fases seguintes (a praia e a mata)
  ent_sardinha_lourival: { tipo: 'entrega', cliente: 'lourival', item: 'sardinha', qtd: 4, estacoes: TODO_ANO, mapas: ['praia'], diaMin: 2, precisa: 'vara',
    fala: 'Compadre, o barco do Dito quebrou e a banca tá pelada. Me traz quatro sardinhas pro almoço do pessoal?',
    obrigado: 'Salvou a banca, compadre!',
    deixa: 'O Dito consertou o barco, compadre. Fica pra outra vez.' },
  ent_tainha_tonico: { tipo: 'entrega', cliente: 'tonico', item: 'tainha', qtd: 2, estacoes: [0, 1], mapas: ['praia'], diaMin: 2, precisa: 'vara',
    fala: 'Tainha na brasa da forja, Jocelino. Duas, se o mar deixar.',
    obrigado: 'Isso é que é almoço de ferreiro!',
    deixa: 'Almocei o que tinha, rapaz. A tainha fica pra outro dia.' },
  ent_cogumelo_juca: { tipo: 'entrega', cliente: 'juca', item: 'cogumelo', qtd: 2, estacoes: [0, 1], mapas: ['mata'], diaMin: 2,
    fala: 'Cogumelo do mato com ovo, do jeito que a minha mãe fazia lá em Sergipe. Acha dois pra mim?',
    obrigado: 'Esse cheiro me levou de volta pra casa.',
    deixa: 'Fiz o ovo puro mesmo, sobrinho. Outro dia a gente acha.' },
  // ---- Coletas (só conta o que entrar na mochila depois de aceitar)
  col_madeira_ze: { tipo: 'coleta', cliente: 'ze', item: 'madeira', qtd: 15, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: 'O Mestre quer forma nova pra laje e a madeira da obra acabou. Junta quinze pra mim, da boa?',
    obrigado: 'Forma de primeira! O Mestre vai achar que fui eu.',
    deixa: 'O Mestre arrumou madeira no depósito. Valeu a intenção, parceiro!' },
  col_pedra_tonico: { tipo: 'coleta', cliente: 'tonico', item: 'pedra', qtd: 15, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata', 'pedreira'], diaMin: 2,
    fala: 'A base da forja tá afundando. Quinze pedras e eu calço ela de novo.',
    obrigado: 'Forja firme, ferro reto. Muito obrigado.',
    deixa: 'Calcei a forja com tijolo velho. Fica pra próxima, rapaz.' },
  col_fibra_juca: { tipo: 'coleta', cliente: 'juca', item: 'fibra', qtd: 15, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: 'A cerca de bambu do galinheiro tá solta. Fibra pra amarrar: quinze, que eu faço o resto.',
    obrigado: 'Galinha presa, horta salva!',
    deixa: 'Amarrei a cerca com arame mesmo, sobrinho. Sem problema.' },
};
ecoCampo(PEDIDOS_VILA, 'paga', ECO.recados.paga);   // o pagamento de cada recado mora no ECO
// Onde mora o boneco de cada um (a entrega é feita no próprio morador): o mapa tem de estar aberto para ele pedir.
const RECADO_MORADOR = { zelia: 'vila', ananias: 'vila', ze: 'vila', bira: 'vila', tonico: 'vila', juca: 'quintal', lourival: 'praia' };
// "para a Dona Zélia", "o recado do Zé"
const RECADO_ARTIGO = { zelia: 'a', ananias: 'o', ze: 'o', bira: 'o', tonico: 'o', juca: 'o', lourival: 'o' };
const RECADO_NOME = { zelia: 'Dona Zélia', ananias: 'Seu Ananias', ze: 'Zé', bira: 'Mestre Bira', tonico: 'Seu Tonico', juca: 'Tio Juca', lourival: 'Seu Lourival' };
// Os mapas onde se procura o material no chão (madeira, pedra, fibra), na ordem.
const RECADO_MAPAS_MATERIAL = ['quintal', 'vila', 'mata', 'pedreira', 'praia'];

const Recados = {
  iniciar(s) {
    const r = s.recados || {}, ativos = {};
    for (const id in r.ativos || {}) if (PEDIDOS_VILA[id]) ativos[id] = Object.assign({}, r.ativos[id], { juntou: r.ativos[id].juntou || 0 });   // (recado que saiu do jogo: some)
    G.recados = { doDia: r.doDia && PEDIDOS_VILA[r.doDia] ? r.doDia : null, dia: r.dia || 0, ativos, ultimaVez: Object.assign({}, r.ultimaVez || {}),
      ultimoTipo: r.ultimoTipo || '', entregues: r.entregues || 0 };
  },
  salvar(s) { s.recados = JSON.parse(JSON.stringify(G.recados)); },
  nome(cliente) { return RECADO_NOME[cliente] || (typeof CLIENTE_NOME !== 'undefined' && CLIENTE_NOME[cliente]) || cliente; },
  estacao(dia) { return Math.floor((dia - 1) / 28) % 4; },
  aberto(mapa) { return typeof Mundo === 'undefined' || Mundo.aberto(mapa); },
  // O quadro já chegou (o guia libera o quadro de serviços; sem o guia, o simulador e as regras puras, vale o dia).
  liberado(dia = G.dia) { return !!G.recados && dia >= ECO.recados.diaMin && (typeof Guia === 'undefined' || Guia.liberado('quadro')); },
  // A fala do pedido (a do Seu Ananias muda quando a pedreira abre).
  fala(id) { const P = PEDIDOS_VILA[id]; return P.falaPedreira && Recados.aberto('pedreira') ? P.falaPedreira : P.fala; },
  // "Dona Zélia quer 3 couves"
  titulo(id) { const P = PEDIDOS_VILA[id]; return `${Recados.nome(P.cliente)} quer ${Itens.qtd(P.qtd, P.item)}`; },
  // Quanto do item os detritos dos mapas abertos soltam (a árvore conta o toco que fica). O mapa ainda não montado é montado
  // como o resto do jogo faz (os achados): o que o jogador já tirou não volta, e a mata e a pedreira repõem de manhã.
  noMundo(item, mapas = RECADO_MAPAS_MATERIAL) {
    let n = 0;
    for (const id of mapas) {
      if (!Recados.aberto(id) || typeof MAPAS_DEF === 'undefined' || !MAPAS_DEF[id]) continue;
      let m = null; try { m = MAPAS[id] || (typeof getMapa === 'function' ? getMapa(id) : null); } catch (e) { m = null; }
      if (!m) continue;
      for (const o of m.objs) {
        if (o.tipo !== 'detrito' || o.empreitaDet) continue;
        const D = DETRITOS[o.det]; if (!D) continue;
        n += (D.solta && D.solta[item]) || 0;
        if (D.vira && DETRITOS[D.vira] && DETRITOS[D.vira].solta) n += DETRITOS[D.vira].solta[item] || 0;
      }
    }
    return n;
  },
  ehMaterial(item) { return Object.values(DETRITOS).some(D => D.solta && D.solta[item]); },
  // Covas da horta plantadas com a cultura.
  plantadas(item) { return G.horta && G.horta.covas ? Object.values(G.horta.covas).filter(c => c && c.planta === item).length : 0; },
  // Dá para fazer agora? A estação, o dia, o morador e o mapa de origem abertos, a ferramenta (a vara), a horta plantada (ou o
  // item na mochila) e o material no mundo aberto (na entrega, somando o que já está na mochila; na coleta, só o mundo).
  possivel(id, dia = G.dia, mochila = G.mochila) {
    const P = PEDIDOS_VILA[id];
    if (!P || !P.estacoes.includes(Recados.estacao(dia)) || dia < Math.max(P.diaMin, ECO.recados.diaMin)) return false;
    if (!Recados.aberto(RECADO_MORADOR[P.cliente]) || !P.mapas.some(m => Recados.aberto(m))) return false;
    if (P.precisa && !(mochila && mochila.total(P.precisa) > 0)) return false;
    const tem = P.tipo === 'entrega' && mochila ? mochila.total(P.item) : 0;
    if (typeof CULTURAS !== 'undefined' && CULTURAS[P.item]) return Recados.plantadas(P.item) + tem >= P.qtd;
    if (Recados.ehMaterial(P.item)) return tem >= P.qtd || tem + Recados.noMundo(P.item, P.mapas) >= P.qtd;
    return true;
  },
  // Os clientes dos serviços do dia: o quadro de hoje (o guardado, ou o sorteio do dia) e os aceitos hoje.
  clientesDosServicos(dia = G.dia) {
    if (!G.empreitas || typeof Empreitas === 'undefined') return [];
    const q = G.empreitas.dia === dia ? G.empreitas.quadro || [] : Empreitas.quadroDoDia(dia);
    const hoje = Object.keys(G.empreitas.aceitas || {}).filter(k => G.empreitas.aceitas[k] && G.empreitas.aceitas[k].dia === dia);
    return [...new Set(q.concat(hoje).map(k => dadosEmpreita(k) && dadosEmpreita(k).cliente).filter(Boolean))];
  },
  // Os que podem sair hoje: possíveis, fora dos aceitos, sem ter aparecido nos últimos 7 dias, de um cliente sem serviço nem
  // recado aceito hoje e de um item que nenhum recado aceito já pede (revisão da T3: Zélia e Bira pedindo 3 flores cada, a entrega
  // de um zerava o outro em silêncio).
  candidatos(dia = G.dia, servicos = null) {
    if (!Recados.liberado(dia)) return [];
    const R = G.recados, ocupados = new Set((servicos || Recados.clientesDosServicos(dia)).concat(Object.keys(R.ativos).map(k => PEDIDOS_VILA[k].cliente)));
    const itens = new Set(Object.keys(R.ativos).map(k => PEDIDOS_VILA[k].item));
    return Object.keys(PEDIDOS_VILA).filter(id => !R.ativos[id] && !(R.ultimaVez[id] && dia - R.ultimaVez[id] < ECO.recados.janela)
      && !ocupados.has(PEDIDOS_VILA[id].cliente) && !itens.has(PEDIDOS_VILA[id].item) && Recados.possivel(id, dia));
  },
  // Os recados que já saíram antes do dia, do mais novo ao mais velho.
  ultimos(dia = G.dia) { const R = G.recados; return Object.keys(R.ultimaVez).filter(id => PEDIDOS_VILA[id] && R.ultimaVez[id] < dia).sort((a, b) => R.ultimaVez[b] - R.ultimaVez[a]); },
  // O tipo que o ritmo pede hoje (pelos últimos recados que saíram): depois de uma coleta, entrega; depois de
  // ECO.recados.entregasPorColeta entregas seguidas, coleta; no meio do caminho, entrega; sem histórico, nenhum ('').
  tipoPreferido(dia = G.dia) {
    const ult = Recados.ultimos(dia);
    if (!ult.length) return '';
    if (PEDIDOS_VILA[ult[0]].tipo === 'coleta') return 'entrega';
    let seguidas = 0; for (const id of ult) { if (PEDIDOS_VILA[id].tipo !== 'entrega' || seguidas >= ECO.recados.entregasPorColeta) break; seguidas++; }
    return seguidas >= ECO.recados.entregasPorColeta ? 'coleta' : 'entrega';
  },
  // O sorteio do dia (fixo pelo dia, como o quadro de serviços): o tipo que o ritmo pede, quando houver; sem preferência, a entrega
  // pesa ECO.recados.pesoEntrega e a coleta 1; dentro do tipo, quem pediu ontem fica de fora quando há outro (para a mesma pessoa não
  // pedir dois dias seguidos), e o peso é 1 + min(14, dias sem aparecer); quem nunca apareceu vale 15.
  sortear(dia = G.dia, servicos = null) {
    const cand = Recados.candidatos(dia, servicos); if (!cand.length) return null;
    const f = mulberry(dia * 7349 + 23), R = G.recados;
    const ent = cand.filter(id => PEDIDOS_VILA[id].tipo === 'entrega'), col = cand.filter(id => PEDIDOS_VILA[id].tipo === 'coleta');
    let pool;
    const quer = Recados.tipoPreferido(dia);
    if (quer === 'coleta' && col.length) pool = col;
    else if (quer === 'entrega' && ent.length) pool = ent;
    else if (ent.length && col.length) pool = f() * (ECO.recados.pesoEntrega + 1) < ECO.recados.pesoEntrega ? ent : col;
    else pool = ent.length ? ent : col;
    const ontem = Recados.ultimos(dia)[0], cliOntem = ontem && dia - R.ultimaVez[ontem] === 1 ? PEDIDOS_VILA[ontem].cliente : '';
    if (cliOntem && pool.some(id => PEDIDOS_VILA[id].cliente !== cliOntem)) pool = pool.filter(id => PEDIDOS_VILA[id].cliente !== cliOntem);
    const peso = id => R.ultimaVez[id] ? 1 + Math.min(14, dia - R.ultimaVez[id]) : 15, soma = pool.reduce((t, id) => t + peso(id), 0);
    let v = f() * soma;
    for (const id of pool) { v -= peso(id); if (v < 0) return id; }
    return pool[pool.length - 1];
  },
  // O recado do dia: o guardado (o save e o recarregar mostram o mesmo) ou, para outro dia, o sorteio.
  doDia(dia = G.dia) { return G.recados && G.recados.dia === dia ? G.recados.doDia : Recados.sortear(dia); },
  // Guarda o recado do dia (uma vez por dia; antes do quadro liberado não marca o dia, para sortear quando ele chegar). O aceito
  // vencido que ninguém tirou à noite sai aqui, sem multa.
  poeDoDia(dia = G.dia) {
    const R = G.recados; if (!R) return null;
    if (R.dia === dia) return R.doDia;
    for (const id of Object.keys(R.ativos)) if (R.ativos[id].ate < dia) delete R.ativos[id];
    if (!Recados.liberado(dia)) { R.doDia = null; return null; }
    const id = Recados.sortear(dia);
    R.dia = dia; R.doDia = id;
    if (id) { R.ultimaVez[id] = dia; R.ultimoTipo = PEDIDOS_VILA[id].tipo; }
    return id;
  },
  hoje() { return Recados.poeDoDia(G.dia); },
  // O recado de hoje ainda no quadro (não aceito).
  noQuadro() { const id = Recados.hoje(); return id && !G.recados.ativos[id] ? id : null; },
  ativosDe(cliente) { return Object.keys(G.recados.ativos).filter(id => PEDIDOS_VILA[id].cliente === cliente); },
  aceitar(id) {
    const P = PEDIDOS_VILA[id], R = G.recados;
    if (!P || !R) return 'nao';
    if (R.ativos[id]) return 'ja';
    if (Recados.hoje() !== id) return 'nao';   // só o recado do dia
    if (Object.keys(R.ativos).length >= ECO.recados.maxAtivos) return 'limite';
    R.ativos[id] = { dia: G.dia, ate: G.dia + ECO.recados.prazo - 1, juntou: 0 };
    return 'ok';
  },
  // A coleta: o que entrou na mochila agora (chamado onde o item do chão entra na mochila). Devolve os recados que acabaram de
  // completar a conta.
  contarColeta(item, qtd = 1) {
    const R = G.recados, completos = []; if (!R || !(qtd > 0)) return completos;
    for (const id of Object.keys(R.ativos)) {
      const P = PEDIDOS_VILA[id], a = R.ativos[id];
      if (P.tipo !== 'coleta' || P.item !== item || a.juntou >= P.qtd) continue;
      a.juntou = Math.min(P.qtd, a.juntou + qtd);
      if (a.juntou >= P.qtd) completos.push(id);
    }
    return completos;
  },
  // Quanto falta: na coleta incompleta, o que falta juntar; senão, o que falta na mochila.
  faltam(id, mochila = G.mochila) {
    const P = PEDIDOS_VILA[id], a = G.recados && G.recados.ativos[id]; if (!P) return 0;
    if (a && P.tipo === 'coleta' && a.juntou < P.qtd) return P.qtd - a.juntou;
    return Math.max(0, P.qtd - (mochila ? mochila.total(P.item) : 0));
  },
  // Pode entregar? 'ok', 'nao' (não aceito), 'juntando' (a coleta ainda não juntou tudo) ou 'falta' (falta na mochila).
  podeEntregar(id, mochila = G.mochila) {
    const P = PEDIDOS_VILA[id], a = G.recados && G.recados.ativos[id];
    if (!P || !a) return 'nao';
    if (P.tipo === 'coleta' && a.juntou < P.qtd) return 'juntando';
    if (!mochila || mochila.total(P.item) < P.qtd) return 'falta';
    return 'ok';
  },
  // Entregar direto da mochila (a pilha da mão conta junto): o item sai, o dinheiro entra na hora e a amizade sobe. Não mexe na
  // Fala da Vila nem na carreira (G.empreitas.entregues e a reputação ficam como estão).
  entregar(id, mochila = G.mochila) {
    const r = Recados.podeEntregar(id, mochila); if (r !== 'ok') return r;
    const P = PEDIDOS_VILA[id], R = G.recados;
    let resta = P.qtd - mochila.remover(P.item, P.qtd);
    if (resta > 0 && mochila.mao && mochila.mao.id === P.item) { const t = Math.min(resta, mochila.mao.qtd); mochila.mao.qtd -= t; resta -= t; if (mochila.mao.qtd <= 0) mochila.mao = null; }
    G.dinheiro += P.paga; G.ganhoHoje = (G.ganhoHoje || 0) + P.paga;
    if (typeof Clientela !== 'undefined') Clientela.registrarAmizade(G.amizade || (G.amizade = {}), [P.cliente]);
    // Lábia: a amizade sobe 50% mais rápido (um coração a mais a cada duas entregas, contando serviços e recados juntos).
    if (typeof Habilidades !== 'undefined' && Habilidades.tem('labia') && G.empreitas) { G.empreitas.labia = (G.empreitas.labia || 0) + 1; if (G.empreitas.labia % 2 === 0 && typeof Clientela !== 'undefined') Clientela.registrarAmizade(G.amizade, [P.cliente]); }
    delete R.ativos[id]; R.entregues++;
    return 'ok';
  },
  // O prazo em palavras ("até hoje", "até amanhã", "até quinta").
  textoPrazo(ate) {
    if (ate <= G.dia) return 'até hoje';
    if (ate === G.dia + 1) return 'até amanhã';
    return 'até ' + (typeof DIAS !== 'undefined' ? DIAS[(ate - 1) % 7] : 'o dia ' + ((ate - 1) % 28 + 1));
  },
  // O estado: do aceito ("tem 1/3 · até amanhã", "juntou 4/15 · até hoje") ou o rodapé do cartão no quadro ("até amanhã · Cr$ 70 ·
  // tem 1/3"; na coleta, "juntar 15 a partir de agora · Cr$ 90").
  textoEstado(id) {
    const P = PEDIDOS_VILA[id], R = G.recados; if (!P || !R) return '';
    const a = R.ativos[id], tem = G.mochila ? Math.min(P.qtd, G.mochila.total(P.item)) : 0;
    if (a) {
      const prazo = Recados.textoPrazo(a.ate);
      if (P.tipo === 'coleta') return a.juntou < P.qtd ? `juntou ${a.juntou}/${P.qtd} · ${prazo}` : tem < P.qtd ? `juntou ${P.qtd}/${P.qtd}, mas tem ${tem} na mochila · ${prazo}` : `juntou ${P.qtd}/${P.qtd}: é só entregar · ${prazo}`;
      return `tem ${tem}/${P.qtd} · ${prazo}`;
    }
    const prazo = Recados.textoPrazo(G.dia + ECO.recados.prazo - 1);
    if (P.tipo === 'coleta') return `juntar ${P.qtd} a partir de agora · Cr$ ${P.paga}`;
    return `${prazo} · Cr$ ${P.paga} · tem ${tem}/${P.qtd}`;
  },
  // A noite: o aceito no último dia do prazo vence (sem multa; na coleta, o que foi juntado fica com o jogador). Devolve
  // [{ id, venceu: true }] para a linha do resumo, na voz da pessoa (P.deixa).
  noite() {
    const R = G.recados, r = []; if (!R) return r;
    for (const id of Object.keys(R.ativos)) if (G.dia >= R.ativos[id].ate) { delete R.ativos[id]; r.push({ id, venceu: true }); }
    return r;
  },
  // A linha do vencido no resumo da noite (revisão da T3: a fala solta não dizia do que era):
  // O recado da Dona Zélia venceu: "Deixa, meu filho, a vizinha arrumou umas couves."
  linhaVencido(id) { const P = PEDIDOS_VILA[id]; return `O recado ${RECADO_ARTIGO[P.cliente] === 'a' ? 'da' : 'do'} ${Recados.nome(P.cliente)} venceu: "${P.deixa}"`; },
};
INICIADORES.push(s => Recados.iniciar(s));
COLETORES.push(s => Recados.salvar(s));
