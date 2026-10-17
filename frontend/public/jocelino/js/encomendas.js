// Jocelino — encomendas.js — as encomendas de festa (E1: as regras puras; spec
// docs/superpowers/specs/2026-10-16-encomendas-festa-design.md). Como as Party Nights do Dave the Diver, do nosso jeito: lá a festa
// é anônima ("a festa da água-viva"), avisa 3 dias antes no calendário, os convidados brilham, pagam mais pelo prato do tema e dão
// um bônus no fim da noite; o único castigo é o dinheiro que não entrou. Aqui a festa é DE ALGUÉM que o jogador conhece: um morador
// da clientela marca a festa dele na pensão (o batizado do neto da Dona Zélia, a laje batida do Bira...), a turma dele (3 a 6
// pessoas, contando o anfitrião) janta junta na ponta do balcão, cada um com o enfeite da ocasião na cabeça, e pede o prato da
// encomenda (a fitinha, como o laço rosa do Dave). Não há botão "aceitar": a Rosa já disse sim; o jogador só decide se prepara.
// - Começa na 2ª estrela (o "degrau" da spec é o das estrelas da casa: o grau − 1), com a pensão aberta há 7 dias; uma festa marcada
//   por vez; a próxima noite sai de 6 a 11 dias depois da última (ECO.encomendas.intervalo).
// - A noite da festa nunca é domingo nem a de outro acontecimento do salão (VIP, festa do tema, Doutor Paladar, Concurso da Rádio,
//   Festa do Patrimônio, inauguração); um acontecimento novo empurra a festa para a próxima noite livre (noiteLivre).
// - O prato: um que a Rosa sabe, possível no prazo (despensa, baú, Mercearia, orelhão, Viajante, pesca, horta, coleta), nunca o
//   favorito da semana do anfitrião nem um dos 2 últimos de festa; a dificuldade sobe com a fama; a categoria da ocasião pesa mais.
// - O aviso sai 1 + a dificuldade do prato dias antes (o PF na véspera, a moqueca 4 dias antes).
// - A turma não vai embora brava (decisão do dono, 16/10): a espera só baixa as estrelas e a conta da turma. Sem castigo nenhum: a
//   festa que não deu sai com a frase "deixa" e a amizade não muda.
// A festa mora em p.agenda como { tipo: 'encomenda', quem, ocasiao, prato, turma, dia, avisado } (o save da pensão já leva a agenda);
// o sorteio (a próxima noite, o plano antes do aviso, quem já fez festa, as ocasiões e os últimos pratos) fica em G.festas (no save,
// s.festas). Os números moram em ECO.encomendas. Quem chama: o MANHA (E3), o salão (E4), a Caderneta (E5).
// (E2) A encomenda substitui os "pedidos da Vila" da agenda, que saíram do jogo; o save antigo com pedido aberto é migrado aqui
// (migrarPedidos: paga a parte já servida e deixa uma linha na manhã).

// As ocasiões de cada morador da clientela (seção 3.1): o enfeite da turma (a arte salao/<enfeite>), a fala do anfitrião na Vila
// nos dias antes (convite), a frase quando a festa não sai (deixa) e o comentário do dia seguinte (depois). categorias: as categorias
// de prato (receitas.js, CATEGORIAS) que pesam mais no sorteio (vazio: qualquer). umaVez: a ocasião só acontece uma vez no jogo.
const OCASIOES = {
  bira: { categorias: ['pf', 'peixe'], ocasioes: [
    { id: 'laje', nome: 'a laje batida da obra', enfeite: 'enfeite_capacete',
      convite: 'Batemos a laje, Jocelino! Peão que bate laje janta junto: a turma toda vai pra pensão da Rosa.',
      deixa: 'A turma da laje comeu um churrasquinho lá na obra mesmo, Jocelino. Fica pra próxima!',
      depois: 'Que janta, Jocelino! A peãozada ainda está falando da comida da Rosa.' },
    { id: 'patroa', nome: 'o aniversário da patroa', enfeite: 'enfeite_aniversario',
      convite: 'A patroa faz anos, Jocelino. Ela merece uma noite sem fogão: vai ser na pensão, com a família toda.',
      deixa: 'A patroa assoprou a vela em casa mesmo, Jocelino. Fica pra próxima!',
      depois: 'A patroa adorou, Jocelino! Disse que no ano que vem é lá de novo.' } ] },
  ze: { categorias: ['pf', 'salgado'], ocasioes: [
    { id: 'samba', nome: 'o ensaio do samba', enfeite: 'enfeite_malandro',
      convite: 'Depois do ensaio a turma do samba vai jantar na pensão, Jocelino! Barriga cheia, o pandeiro canta melhor.',
      deixa: 'O ensaio acabou no boteco da esquina, Jocelino. Fica pra próxima!',
      depois: 'Lá lá laiá! A turma do samba saiu da pensão cantando, Jocelino.' },
    { id: 'dandara', nome: 'o aniversário da Dandara', enfeite: 'enfeite_aniversario',
      convite: 'A Dandara faz anos e eu quero fazer bonito, Jocelino: janta na pensão, com os amigos dela.',
      deixa: 'A Dandara fez a festa na casa da mãe dela, Jocelino. Fica pra próxima!',
      depois: 'A Dandara ficou toda boba, Jocelino. Ponto pra mim e pra Rosa!' } ] },
  tonico: { categorias: ['peixe'], ocasioes: [
    { id: 'noivado', nome: 'o noivado da filha', enfeite: 'enfeite_casamento',
      convite: 'A minha filha vai noivar, Jocelino. O rapaz é de família boa: quero receber a família dele na pensão.',
      deixa: 'O noivado foi lá em casa mesmo, Jocelino. Fica pra próxima!',
      depois: 'Até o sogro da minha filha pediu a receita, Jocelino. A Rosa é danada!' },
    { id: 'padroeiro', nome: 'a festa do padroeiro dos ferreiros', enfeite: 'enfeite_palha',
      convite: 'É dia de Santo Elói, o padroeiro dos ferreiros, Jocelino. Depois da missa a turma da forja janta na pensão.',
      deixa: 'Depois da missa cada um foi pra sua casa, Jocelino. Fica pra próxima!',
      depois: 'Santo Elói gostou da janta, Jocelino: hoje a forja até esquentou mais rápido.' } ] },
  dona_cida: { categorias: ['caldo', 'doce'], ocasioes: [
    { id: 'cha_bebe', nome: 'o chá de bebê da nora', enfeite: 'enfeite_batizado',
      convite: 'A minha nora está de barriga, Jocelino! O chá de bebê vai ser na pensão, que lá em casa não cabe ninguém.',
      deixa: 'O chá de bebê foi na casa da comadre, meu filho. Fica pra próxima!',
      depois: 'A nora ganhou fralda pra um ano, Jocelino, e a turma saiu de barriga cheia.' },
    { id: 'terco', nome: 'o terço de maio', enfeite: 'enfeite_palha',
      convite: 'Depois do terço as senhoras da capela vão jantar na pensão, Jocelino. Reza dá fome!',
      deixa: 'Depois do terço cada uma foi pra sua casa, meu filho. Fica pra próxima!',
      depois: 'As senhoras do terço estão rezando pela Rosa, Jocelino. Que janta!' } ] },
  ananias: { categorias: [], ocasioes: [
    { id: 'deposito', nome: 'os 20 anos do depósito', enfeite: 'enfeite_aniversario',
      convite: 'O depósito faz 20 anos, Jocelino! Vou levar os fregueses mais antigos pra jantar na pensão.',
      deixa: 'Comemorei os 20 anos com um cafezinho no balcão, Jocelino. Fica pra próxima!',
      depois: 'Vinte anos de depósito e a melhor janta foi a da Rosa, Jocelino.' },
    { id: 'sobrinho', nome: 'o casamento do sobrinho', enfeite: 'enfeite_casamento',
      convite: 'O meu sobrinho vai casar e a família vem de longe, Jocelino. A janta de boas-vindas é na pensão!',
      deixa: 'A família jantou lá em casa mesmo, Jocelino. Fica pra próxima!',
      depois: 'A família do meu sobrinho foi embora falando da pensão, Jocelino.' } ] },
  zelia: { categorias: ['doce', 'peixe'], ocasioes: [
    { id: 'batizado', nome: 'o batizado do neto', enfeite: 'enfeite_batizado',
      convite: 'Ai, Jocelino, o batizado do meu neto! Depois da igreja a turma toda janta na pensão. Capricha, que a família do meu genro é exigente.',
      deixa: 'A comadre fez a festa no quintal, meu filho. Fica pra próxima!',
      depois: 'O padrinho do meu neto repetiu duas vezes, Jocelino! Vou contar pra Vila inteira.' },
    { id: 'bodas', nome: 'as bodas de prata', enfeite: 'enfeite_bodas',
      convite: 'Vinte e cinco anos de casada, Jocelino! As bodas vão ser na pensão, com os filhos e os netos.',
      deixa: 'Comemoramos as bodas em casa, só nós dois, meu filho. Fica pra próxima!',
      depois: 'Parecia festa de casamento de novo, Jocelino. Obrigada, viu?' } ] },
  juca: { categorias: ['peixe'], ocasioes: [
    { id: 'sao_joao', nome: 'a reza de São João', enfeite: 'enfeite_palha',
      convite: 'Sobrinho, depois da reza de São João os conterrâneos vão jantar na pensão. Lembra Aracaju!',
      deixa: 'A reza acabou na fogueira lá de casa, sobrinho. Fica pra próxima!',
      depois: 'Parecia São João em Aracaju, sobrinho. Até chorei, viu?' },
    { id: 'despedida', nome: 'a despedida do compadre que volta para Sergipe', enfeite: 'enfeite_couro',
      convite: 'O meu compadre vai voltar pra Sergipe, sobrinho. A despedida dele é na pensão, com os amigos de lá.',
      deixa: 'O compadre adiou a viagem, sobrinho. Fica pra próxima!',
      depois: 'O compadre foi embora dizendo que a comida da Rosa é a de casa, sobrinho.' } ] },
  lourival: { categorias: ['peixe'], ocasioes: [
    { id: 'pescadores', nome: 'a festa dos pescadores', enfeite: 'enfeite_pescador',
      convite: 'Compadre, é a festa dos pescadores! Depois da procissão no mar a turma da colônia janta na pensão.',
      deixa: 'A turma da colônia fez peixe na brasa na praia mesmo, compadre. Fica pra próxima!',
      depois: 'Os pescadores juram que nunca comeram tão bem, compadre. E olha que eles entendem de peixe!' },
    { id: 'dito', nome: 'o aniversário do Dito', enfeite: 'enfeite_aniversario',
      convite: 'O Dito, meu ajudante do barco, faz anos, compadre. Vou pagar a janta dele e da turma na pensão.',
      deixa: 'O Dito comemorou no barco mesmo, compadre. Fica pra próxima!',
      depois: 'O Dito disse que foi o melhor aniversário da vida dele, compadre.' } ] },
  severino: { categorias: ['pf', 'salgado'], ocasioes: [
    { id: 'varzea', nome: 'o jogo do time da várzea', enfeite: 'enfeite_time',
      convite: 'Domingo tem final na várzea, Jocelino! Ganhando ou perdendo, a turma do time janta na pensão.',
      deixa: 'O time comemorou no campinho mesmo, Jocelino. Fica pra próxima!',
      depois: 'Até o goleiro, que levou três, saiu feliz da pensão, Jocelino.' },
    { id: 'supletivo', nome: 'a formatura do supletivo', enfeite: 'enfeite_aniversario',
      convite: 'Eu me formei no supletivo, Jocelino! A turma da sala vai jantar comigo na pensão.',
      deixa: 'A turma da sala comemorou na escola mesmo, Jocelino. Fica pra próxima!',
      depois: 'Diploma na parede e janta da Rosa na barriga, Jocelino. Que noite!' } ] },
  tonhao: { categorias: ['pf'], ocasioes: [
    { id: 'sindicato', nome: 'o churrasco do sindicato', enfeite: 'enfeite_capacete',
      convite: 'O sindicato vai comemorar o aumento, Jocelino! E churrasco bom mesmo é a janta da Rosa.',
      deixa: 'O sindicato fez a festa na sede mesmo, Jocelino. Fica pra próxima!',
      depois: 'Comi por três e a turma por mais três, Jocelino. Que janta!' } ] },
  lurdes: { categorias: ['doce'], ocasioes: [
    { id: 'neta', nome: 'o aniversário da neta', enfeite: 'enfeite_aniversario',
      convite: 'A minha neta faz anos, Jocelino! Quero levar a criançada pra comer na pensão.',
      deixa: 'A minha neta fez a festa na escola, Jocelino. Fica pra próxima!',
      depois: 'A minha neta não para de falar da Rosa, Jocelino. Agora quer ser cozinheira!' },
    { id: 'quermesse', nome: 'a quermesse', enfeite: 'enfeite_palha',
      convite: 'Depois da quermesse as barraqueiras vão jantar na pensão, Jocelino. A gente merece!',
      deixa: 'A quermesse acabou tarde e cada uma foi pra sua casa, Jocelino. Fica pra próxima!',
      depois: 'As barraqueiras querem a receita da Rosa pra quermesse do ano que vem, Jocelino.' } ] },
  paulo: { categorias: [], ocasioes: [
    { id: 'forro', nome: 'o forró dos nordestinos', enfeite: 'enfeite_couro',
      convite: 'Depois do forró a turma do Nordeste vai jantar na pensão, Jocelino. Comida da terra!',
      deixa: 'O forró virou a noite e ninguém lembrou de jantar, Jocelino. Fica pra próxima!',
      depois: 'Parecia Aracaju, Jocelino! Até a sanfona tocou melhor depois da janta.' },
    { id: 'casamento', nome: 'o casamento dele', enfeite: 'enfeite_casamento', umaVez: true,
      convite: 'Jocelino, eu vou casar! A festa vai ser na pensão da Rosa, com os padrinhos e tudo.',
      deixa: 'A gente fez a festa na casa da noiva, Jocelino. Mas a pensão vai ver muita festa nossa ainda!',
      depois: 'O dia mais feliz da minha vida, Jocelino, e a janta mais gostosa também.' } ] },
};

const Encomendas = {
  get E() { return ECO.encomendas; },
  // As estrelas da casa (o "degrau" da spec): 0 a 5.
  degrau(p) { return p.grau() - 1; },
  domingo: d => (d - 1) % 7 === 6,
  nome(quem) { const c = typeof Clientela !== 'undefined' && Clientela.dado(quem); return c ? c.nome : quem; },
  ocasiao(quem, id) { return ((OCASIOES[quem] || {}).ocasioes || []).find(o => o.id === id) || null; },
  // A arte do enfeite da turma (o genérico enquanto a da ocasião não existe).
  enfeite(e) {
    const o = e && Encomendas.ocasiao(e.quem, e.ocasiao), arte = o && 'salao/' + o.enfeite;
    return arte && (typeof ARTE_LISTA === 'undefined' || ARTE_LISTA.includes(arte)) ? arte : 'salao/enfeite_festa';
  },

  // ---------- o estado do sorteio (G.festas, no save) ----------
  novoEstado() { return { proxima: 0, ultima: 0, plano: null, anfitriao: {}, ocasioes: {}, pratos: [] }; },
  estado() { return G.festas || (G.festas = Encomendas.novoEstado()); },
  iniciar(s) { G.festas = Object.assign(Encomendas.novoEstado(), JSON.parse(JSON.stringify(s.festas || {}))); },
  salvar(s) { s.festas = JSON.parse(JSON.stringify(Encomendas.estado())); },

  // ---------- quando ----------
  // Já pode marcar festa: a pensão aberta há diasAbertaMin dias e na 2ª estrela ou mais.
  liberada(p, dia) {
    return !!p && p.estado === 'aberta' && p.abreDia > 0 && dia - p.abreDia >= Encomendas.E.diasAbertaMin && Encomendas.degrau(p) >= Encomendas.E.grauMin;
  },
  // A noite d não tem outro acontecimento do salão. As contas são as do próprio jogo: a agenda (o VIP e a festa do tema já avisados),
  // as contas fixas que o Eventos.planejar ainda vai fazer (VIP com desde % 5 === 2, festa com desde % 7 === 4, a carta 3 dias antes:
  // diaDoAviso), a noite do Paladar da estação e a revisita dele, o dia do Concurso, a Festa do Patrimônio (p.festaDia) e a inauguração
  // (a pensão sem nenhuma janta ainda). propria: a encomenda que está sendo conferida (não conta contra ela mesma).
  noiteLivre(p, d, propria = null) {
    if (!p || Encomendas.domingo(d)) return false;
    if (typeof G !== 'undefined' && (G.firma && G.firma.inauguracaoDia === d && !G.firma.feita)) return false;   // (C20, rodada 1) a noite da inauguração da Construtora Santos
    // (C17) a revisita do Doutor Paladar (tipo 'paladar') também é noite ocupada
    if ((p.agenda || []).some(x => x !== propria && !x.fim && x.dia === d && ['vip', 'festa', 'encomenda', 'paladar'].includes(x.tipo))) return false;
    if (p.abreDia > 0 && typeof diaDoAviso === 'function') for (const d0 of [d - 3, d - 4]) {
      if (d0 < p.abreDia || diaDoAviso(d0) !== d) continue;
      const desde = d0 - p.abreDia;
      if ((desde >= 2 && desde % 5 === 2) || (desde >= 4 && desde % 7 === 4)) return false;
    }
    if (typeof Paladar !== 'undefined' && Paladar.noite(p, Math.floor((d - 1) / 28)) === d) return false;   // (C17) a noite desta pensão
    if (typeof Concurso !== 'undefined' && Concurso.hoje(d)) return false;
    if (p.festaDia && p.festaDia === d) return false;
    if (p.ultimaJanta === -1) return false;   // a 1ª janta é a inauguração: festa só depois dela
    return true;
  },
  // A primeira noite livre a partir de d (0 se nenhuma nos próximos 120 dias: a pensão ainda sem a 1ª janta).
  proxNoiteLivre(p, d, propria = null) { for (let k = 0; k < 120; k++) if (Encomendas.noiteLivre(p, d + k, propria)) return d + k; return 0; },

  // ---------- a turma e a ponta ----------
  // Quantas pessoas, contando o anfitrião: pela estrela da casa (ECO.encomendas.turma), +1 com o salão maior.
  turma(p) {
    const T = Encomendas.E.turma, n = T[clamp(Encomendas.degrau(p), 0, T.length - 1)] || 0;
    return n ? n + (((p.ampliacoes || []).includes('salao_maior')) ? Encomendas.E.turmaSalaoMaior : 0) : 0;
  },
  // Quantas banquetas a ponta reserva: a turma inteira, mas sempre sobram livresMin para os fregueses comuns.
  pontaDaTurma(nBanquetas, turma) { return clamp(Math.min(turma, nBanquetas - Encomendas.E.livresMin), 0, Math.max(0, turma)); },
  // As k banquetas mais perto da porta (as de x menor): os índices, da ponta para dentro (o anfitrião senta na primeira).
  assentosDaPonta(xs, k) { return xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, Math.max(0, k)).map(a => a[1]); },

  // ---------- o prato ----------
  // A dificuldade do ingrediente (a tabela do relatório da despensa de 16/10, a mesma da s1 prato_caro_pede_ingrediente_dificil):
  // 0 o básico da Mercearia (até Cr$ 2); 1 a horta de até 5 dias, a Mercearia até Cr$ 8, a coleta e o peixe ★; 2 a horta de 8 a 9 dias,
  // o queijo e o ★★; 3 a horta de 12 a 14 dias e o ★★★ (peixe de fundo, camarão, dendê); 4 o ★★★★ (lagosta, polvo).
  difIngrediente(i) {
    if (i === 'pedra') return 0;
    if (i === 'peixe') return 1;
    if (typeof CULTURAS !== 'undefined' && CULTURAS[i]) return CULTURAS[i].dias <= 5 ? 1 : CULTURAS[i].dias <= 9 ? 2 : 3;
    if (Pratos.MERCEARIA[i] != null) return Pratos.MERCEARIA[i] <= 2 ? 0 : Pratos.MERCEARIA[i] <= 8 ? 1 : 2;
    return Pratos.raridade(i);
  },
  // A do prato: a do ingrediente mais difícil.
  dificuldade(prato) { const P = Pratos.PRATOS[prato]; return P ? Math.max(0, ...Object.keys(P.porcao).map(Encomendas.difIngrediente)) : 0; },
  // Quantos dias antes sai o aviso: 1 + a dificuldade, de 1 a 4 (o PF na véspera, a moqueca 4 dias antes).
  antecedencia(prato) { const A = Encomendas.E.antecedencia; return clamp(A.base + Encomendas.dificuldade(prato), A.base, A.max); },

  // ---------- dá para conseguir no prazo? ----------
  // Quanto do ingrediente o Jocelino já tem: a despensa (o "peixe" conta qualquer peixe que a pensão aceita), a mochila e os baús.
  tem(p, i) {
    const ids = i === 'peixe' ? Pratos.PEIXES.filter(x => p.aceita(x)) : [i];
    let n = 0;
    for (const x of ids) {
      n += p.despensa[x] || 0;
      if (typeof G !== 'undefined' && G.mochila && G.mochila.total) n += G.mochila.total(x);
      if (typeof G !== 'undefined' && G.baus) for (const b of G.baus) n += b.m && b.m.total ? b.m.total(x) : 0;
    }
    return n;
  },
  _aberto(m) { return typeof Mundo === 'undefined' || Mundo.aberto(m); },
  _est: d => Math.floor((d - 1) / 28) % 4,
  _dias(dia, noite) { const r = []; for (let d = dia; d <= noite; d++) r.push(d); return r; },
  // O peixe sai num lugar de pesca aberto em algum dia do prazo (a estação; o que só morde com chuva, num dia de chuva; o alto-mar
  // com o barco do Lourival, que não sai no domingo nem com chuva). O covo dá siri na praia (de um dia para o outro).
  pescavel(i, dia, noite) {
    if (typeof LUGARES_PESCA === 'undefined') return false;
    const MAPA = { mar: 'praia', rio: 'mata', alto: 'praia', serra: 'serra' }, chove = d => typeof Clima !== 'undefined' && Clima.chove(d);
    if (i === 'siri') return noite > dia && Encomendas._aberto('praia');
    for (const local in LUGARES_PESCA) {
      if (!MAPA[local] || !Encomendas._aberto(MAPA[local])) continue;
      for (const x of LUGARES_PESCA[local]) {
        if (x.id !== i) continue;
        if (Encomendas._dias(dia, noite).some(d => x.est.includes(Encomendas._est(d)) && (!x.chuva || chove(d)) && (local !== 'alto' || (!Encomendas.domingo(d) && !chove(d))))) return true;
      }
    }
    return false;
  },
  // O que nasce no chão (os achados) num mapa aberto, na estação de algum dia do prazo.
  coletavel(i, dia, noite) {
    if (typeof ACHADOS_ESTACAO === 'undefined') return false;
    return Encomendas._dias(dia, noite).some(d => {
      const e = Encomendas._est(d), T = { quintal: ACHADOS_ESTACAO[e], vila: ACHADOS_ESTACAO[e], mata: ACHADOS_MATA[e], praia: ACHADOS_PRAIA,
        serra: typeof ACHADOS_SERRA !== 'undefined' ? ACHADOS_SERRA[e] : [] };
      return Object.keys(T).some(m => Encomendas._aberto(m) && (T[m] || []).some(([id]) => id === i));
    });
  },
  // As covas da horta com a cultura que ficam prontas até a noite da festa (a mesma conta de dias da horta e do recado).
  naHorta(i, dia, noite) {
    if (typeof G === 'undefined' || !G.horta || !G.horta.covas || typeof Horta === 'undefined') return 0;
    return Object.values(G.horta.covas).filter(c => c && c.planta === i && Horta.diasDa(c) - (c.dias || 0) <= noite - dia).length;
  },
  // De onde vem cada ingrediente do prato para n porções, da hoje (dia) até a noite da festa: { ingrediente: fonte } com a fonte
  // 'tem' (já tem: despensa, mochila, baú), 'mercearia', 'orelhao' (chega no dia seguinte), 'viajante' (às quintas), 'pesca',
  // 'horta', 'coleta', 'quintal' (a pedra) ou '' (não dá). A Caderneta (E5) usa para o Mostrar.
  fontes(p, prato, n, dia, noite) {
    const g = p.gasto(prato, n), r = {};
    for (const i in g) r[i] = Encomendas._fonte(p, i, g[i], dia, noite);
    return r;
  },
  _fonte(p, i, precisa, dia, noite) {
    if (i === 'pedra') return 'quintal';
    if (i !== 'peixe' && !p.aceita(i)) return '';
    if (Encomendas.tem(p, i) >= precisa) return 'tem';
    const ids = i === 'peixe' ? Pratos.PEIXES.filter(x => p.aceita(x)) : [i];
    const ENC = typeof ENCOMENDA !== 'undefined' ? ENCOMENDA : (ECO.lojas.encomenda || {});
    if (ids.some(x => Pratos.MERCEARIA[x] != null)) return 'mercearia';
    if (noite > dia && ids.some(x => ENC[x] != null)) return 'orelhao';
    if (typeof Viajante !== 'undefined' && ids.some(x => x in Viajante.INGREDIENTES) && p.grau() >= Viajante.GRAU
      && Encomendas._dias(dia, noite).some(d => (d - 1) % 7 === Viajante.DIA)) return 'viajante';
    if (ids.some(x => Encomendas.pescavel(x, dia, noite))) return 'pesca';
    if (typeof CULTURAS !== 'undefined' && CULTURAS[i] && Encomendas.tem(p, i) + Encomendas.naHorta(i, dia, noite) >= precisa) return 'horta';
    if (Encomendas.coletavel(i, dia, noite)) return 'coleta';
    return '';
  },
  // Dá para fazer o prato para n porções até a noite: a Rosa sabe e todo ingrediente tem de onde vir no prazo.
  possivel(p, prato, n, dia, noite) {
    if (!Pratos.PRATOS[prato] || !p.receitas.includes(prato) || n <= 0) return false;
    return Object.values(Encomendas.fontes(p, prato, n, dia, noite)).every(Boolean);
  },
  // O que ainda falta juntar para a festa: [[ingrediente, quantos]] (pelo que já tem: despensa, mochila e baús).
  falta(p, prato, n) { const g = p.gasto(prato, n); return Object.keys(g).map(i => [i, g[i] - Encomendas.tem(p, i)]).filter(([, q]) => q > 0); },

  // O sorteio do prato: entre as receitas da Rosa possíveis no prazo (o aviso cabe antes da noite), fora o favorito da semana do
  // anfitrião e os 2 últimos pratos de festa. Pesa mais o prato com a dificuldade perto de min(estrelas, 3) (o prato valioso pede
  // ingrediente difícil) e o da categoria da ocasião. '' se nenhum dá.
  escolherPrato(p, quem, dia, noite, rng, h = Encomendas.estado(), n = Encomendas.turma(p)) {
    const fav = typeof Clientela !== 'undefined' && Clientela.dado(quem) ? Clientela.dado(quem).prato : '';
    const cats = (OCASIOES[quem] || {}).categorias || [], alvo = Math.min(Encomendas.degrau(p), 3), PESO = [4, 2, 1, 0.5, 0.25];
    const cands = p.receitas.filter(id => Pratos.PRATOS[id] && id !== fav && !(h.pratos || []).slice(0, 2).includes(id)
      && Encomendas.antecedencia(id) <= noite - dia && Encomendas.possivel(p, id, n, dia, noite));
    if (!cands.length) return '';
    const pesos = cands.map(id => PESO[Math.min(4, Math.abs(Encomendas.dificuldade(id) - alvo))] * (cats.includes(categoriaDe(id)) ? 2 : 1));
    return cands[Encomendas._sorteia(pesos, rng)];
  },
  _sorteia(pesos, rng) { let r = rng.randf() * pesos.reduce((s, x) => s + x, 0); for (let k = 0; k < pesos.length; k++) { r -= pesos[k]; if (r < 0) return k; } return pesos.length - 1; },
  _inteiro(a, b, rng) { return a + Math.floor(rng.randf() * (b - a + 1)); },
  // Quem pode ser o anfitrião: um morador da clientela sem festa nos últimos mesmoMoradorDias dias e sem recado aceito aberto.
  anfitrioes(dia, h = Encomendas.estado()) {
    const ocupados = new Set(typeof G !== 'undefined' && G.recados && typeof PEDIDOS_VILA !== 'undefined'
      ? Object.keys(G.recados.ativos || {}).map(k => PEDIDOS_VILA[k] && PEDIDOS_VILA[k].cliente).filter(Boolean) : []);
    return Object.keys(OCASIOES).filter(q => !ocupados.has(q) && !(h.anfitriao[q] && dia - h.anfitriao[q] < Encomendas.E.mesmoMoradorDias)
      && Encomendas._ocasioesDe(q, h).length);
  },
  // As ocasiões que ainda podem sair: as menos usadas (sem repetir enquanto houver outra); a de uma vez só, nunca de novo.
  _ocasioesDe(quem, h) {
    const os = OCASIOES[quem].ocasioes.filter(o => !(o.umaVez && (h.ocasioes[quem + ':' + o.id] || 0) > 0));
    const min = Math.min(...os.map(o => h.ocasioes[quem + ':' + o.id] || 0));
    return os.filter(o => (h.ocasioes[quem + ':' + o.id] || 0) === min);
  },
  // O plano da noite (quem, a ocasião, o prato), sorteado uma vez quando a noite entra na janela do aviso (4 dias antes).
  _plano(p, dia, noite, rng, h) {
    const quem = Encomendas.anfitrioes(dia, h), n = Encomendas.turma(p);
    while (quem.length) {
      const q = quem.splice(Math.floor(rng.randf() * quem.length), 1)[0], prato = Encomendas.escolherPrato(p, q, dia, noite, rng, h, n);
      if (!prato) continue;
      const os = Encomendas._ocasioesDe(q, h), o = os[Math.floor(rng.randf() * os.length)];
      return { dia: noite, quem: q, ocasiao: o.id, prato, turma: n };
    }
    return null;
  },

  // ---------- o sorteio da manhã ----------
  // A festa marcada que ainda não aconteceu (a de hoje conta).
  aberta(p, dia) { return ((p && p.agenda) || []).find(e => e.tipo === 'encomenda' && !e.fim && e.dia >= dia) || null; },
  // A festa de hoje à noite.
  hoje(p, dia) { return ((p && p.agenda) || []).find(e => e.tipo === 'encomenda' && !e.fim && e.dia === dia) || null; },
  // Roda de manhã (E3: o MANHA de eventos.js), com a semente do dia. Devolve as festas mexidas hoje: a nova (avisado === dia) e a que
  // mudou de noite porque outro acontecimento caiu nela (mudou === dia, de: a noite antiga).
  // 1. A festa que passou sem fechar (a pensão não abriu) fecha como "passou", sem mudar a amizade.
  // 2. A festa marcada numa noite que deixou de ser livre passa para a próxima noite livre.
  // 3. Sem festa marcada: a próxima noite é sorteada (intervalo) depois da última; 4 dias antes sai o plano (quem, a ocasião, o
  //    prato); o aviso sai antecedencia(prato) dias antes, conferindo de novo se o prato dá no prazo (senão, outro que dê).
  planejar(p, dia, rng, h = Encomendas.estado()) {
    const novos = [];
    if (!p) return novos;
    p.agenda = p.agenda || [];
    for (const e of p.agenda) {
      if (e.tipo !== 'encomenda' || e.fim) continue;
      if (e.dia < dia) { e.fim = 'passou'; h.ultima = Math.max(h.ultima || 0, e.dia); continue; }
      if (!Encomendas.noiteLivre(p, e.dia, e)) {
        const de = e.dia, nova = Encomendas.proxNoiteLivre(p, Math.max(e.dia + 1, dia), e);
        if (!nova) continue;
        Object.assign(e, { dia: nova, mudou: dia, de }); h.ultima = nova; h.anfitriao[e.quem] = nova; novos.push(e);   // (os 28 dias contam da noite nova)
      }
    }
    if (!Encomendas.liberada(p, dia) || Encomendas.aberta(p, dia)) return novos;
    const A = Encomendas.E.antecedencia, I = Encomendas.E.intervalo;
    if (!h.proxima) h.proxima = (h.ultima || dia) + Encomendas._inteiro(I[0], I[1], rng);
    const noite = Encomendas.proxNoiteLivre(p, Math.max(h.proxima, dia + 1)), falta = noite - dia;
    if (!noite || falta > A.max) return novos;
    if (!h.plano || h.plano.dia !== noite) h.plano = Encomendas._plano(p, dia, noite, rng, h);
    if (!h.plano) { h.proxima = noite + 1; return novos; }               // ninguém pode ou nenhum prato dá: tenta a noite seguinte
    if (falta > Encomendas.antecedencia(h.plano.prato)) return novos;    // ainda não é o dia do aviso
    let prato = h.plano.prato;
    const turma = Encomendas.turma(p);   // a turma de hoje (a pensão pode ter subido de estrela desde o plano)
    if (!Encomendas.possivel(p, prato, turma, dia, noite)) prato = Encomendas.escolherPrato(p, h.plano.quem, dia, noite, rng, h, turma);
    if (!prato) { h.plano = null; h.proxima = noite + 1; return novos; }
    const e = { tipo: 'encomenda', quem: h.plano.quem, ocasiao: h.plano.ocasiao, prato, turma, dia: noite, avisado: dia };
    p.agenda.push(e); novos.push(e);
    const k = e.quem + ':' + e.ocasiao;
    h.anfitriao[e.quem] = noite; h.ocasioes[k] = (h.ocasioes[k] || 0) + 1; h.pratos = [prato].concat(h.pratos || []).slice(0, 2);
    h.ultima = noite; h.proxima = 0; h.plano = null;
    return novos;
  },

  // ---------- a noite ----------
  // A panela reservada (só a conta; E4b tira da despensa com p.consumir(prato, rng, porcoes)): as porções que a despensa dá para a
  // turma (o gasto por prato de sempre, Pensao.gasto), a raridade (a do principal, p.planoPanela) e o que falta. Com menos de
  // minimo × turma, a festa fica pra próxima (deixa: true).
  reservar(p, e) {
    const n0 = e.turma;
    let n = n0; while (n > 0 && p.rende(e.prato, n) < 1) n--;
    const falta = n < n0 ? p.faltaPara(e.prato, n0) : [];
    if (n <= 0 || n < n0 * Encomendas.E.minimo) return { prato: e.prato, porcoes: 0, turma: n0, deixa: true, gasto: p.gasto(e.prato, n0), raridade: 0, falta };
    const plano = p.planoPanela(e.prato, n);
    return { prato: e.prato, porcoes: n, turma: n0, deixa: false, gasto: p.gasto(e.prato, n), raridade: plano.rar, tira: plano.tira, falta };
  },
  // Cada prato da turma: o preço normal (nível e raridade) × fator, e a gorjeta das estrelas sobre ele (como no prato do tema).
  pagamento(p, prato, raridade, estrelas) {
    const preco = Math.round(p.preco(prato, raridade) * Encomendas.E.fator), gorjeta = Pensao.gorjeta(preco, estrelas);
    return { preco, gorjeta, total: preco + gorjeta, bem: Encomendas.bemServido(estrelas) };
  },
  bemServido(estrelas) { return estrelas >= Encomendas.E.bemServido; },
  // A conta da turma (o bônus do fim da noite do Dave): bonus × os bem servidos; com a Rosa sozinha, pela metade.
  contaDaTurma(bem, rosaSozinha = false) { return Math.round(Encomendas.E.bonus * Math.max(0, bem) * (rosaSozinha ? Encomendas.E.rosaSozinhaConta : 1)); },
  // Fecha a festa. res: { bem (os bem servidos), turma (quantos vieram; a turma inteira por padrão), rosaSozinha } ou
  // { deixa: true, motivo } (a despensa não deu, a pensão não abriu). A festa feita dá a amizade com o anfitrião (Amizade.ganhar com o
  // número: amizade, + amizadeTodos se a turma inteira saiu bem servida) e devolve a conta da turma e as curtidas a mais para o
  // relatório da noite (E4: r.encomenda, fora de r.ganho). A que não saiu não muda nada ("deixa"). Sem castigo em nenhum caso.
  fechar(p, e, res = {}, h = Encomendas.estado()) {
    if (!e || e.fim) return null;
    h.ultima = Math.max(h.ultima || 0, e.dia);
    if (res.deixa) { e.fim = 'deixa'; e.motivo = res.motivo || ''; return { deixa: true, conta: 0, amizade: 0, curtidas: 0, bem: 0, todos: false }; }
    const turma = res.turma || e.turma, bem = clamp(res.bem | 0, 0, turma), todos = turma > 0 && bem >= turma;
    const conta = Encomendas.contaDaTurma(bem, !!res.rosaSozinha), curtidas = Encomendas.E.curtidasBem * bem;
    const pts = Encomendas.E.amizade + (todos ? Encomendas.E.amizadeTodos : 0);
    const amizade = typeof Amizade !== 'undefined' ? Amizade.ganhar(e.quem, pts, 'encomenda') : 0;
    Object.assign(e, { fim: 'feita', bem, conta });
    return { deixa: false, conta, amizade, curtidas, bem, todos };
  },
  // Na noite da festa, o anfitrião não vem de novo como freguês da semana (chamar depois de Clientela.porNaFila; E4b).
  tirarAnfitriao(t, p, dia) {
    const e = Encomendas.hoje(p, dia);
    if (e && t && t._fila) t._fila = t._fila.filter(f => f.cliente.turma || f.cliente.id !== e.quem);
    return e;
  },

  // ---------- (E2) o save antigo: os "pedidos da Vila" da agenda saíram (spec, seção 6.2) ----------
  // Cada pedido aberto ({ tipo: 'pedido', quem, prato, qtd, feito, ate, premio }) fecha com fim 'migrou' e paga a parte já servida
  // (premio × feito / qtd, arredondado); o fechado (feito ou vencido) só sai. A agenda fica sem nenhum. Devolve { pago, linhas }: uma
  // linha por pedido aberto, a última com o convite da festa. Quem chama põe o dinheiro e as linhas (o INICIADORES abaixo).
  migrarPedidos(p) {
    const velhos = ((p && p.agenda) || []).filter(x => x.tipo === 'pedido'), abertos = velhos.filter(x => !x.fim), linhas = [];
    let pago = 0;
    abertos.forEach((x, k) => {
      const qtd = Math.max(1, x.qtd | 0), feito = clamp(x.feito | 0, 0, qtd), v = Math.round((x.premio || 0) * feito / qtd);
      x.fim = 'migrou'; pago += v;
      const prato = (Pratos.PRATOS[x.prato] || { nome: x.prato }).nome;
      linhas.push(`${Encomendas._quemNoComeco(x.quem)} deixou pra lá o pedido de ${qtd} ${prato}`
        + (feito ? ` (${feito} já ${feito === 1 ? 'tinha' : 'tinham'} saído: Cr$ ${v})` : '') + '.'
        + (k === abertos.length - 1 ? ' Agora, quando alguém quiser, marca a festa aqui na pensão!' : ''));
    });
    if (velhos.length) p.agenda = p.agenda.filter(x => !velhos.includes(x));
    return { pago, linhas };
  },
  // O nome no começo da frase, com o artigo: "Dona Zélia" → "A Dona Zélia", "o Zé da masseira" → "O Zé da masseira".
  _quemNoComeco(q) {
    const s = String(q || 'Alguém');
    if (/^[oa] /.test(s)) return s[0].toUpperCase() + s.slice(1);
    return /^Dona /.test(s) ? 'A ' + s : /^[OA] /.test(s) || s === 'Alguém' ? s : 'O ' + s;
  },
};
INICIADORES.push(s => Encomendas.iniciar(s));
// (depois do Pensao.deDict, que é do pensao_tela.js, carregado antes): o dinheiro da parte servida e a linha na manhã
INICIADORES.push(() => {
  const m = Encomendas.migrarPedidos(G.pensao);
  if (m.pago > 0) { G.dinheiro += m.pago; G.ganhoHoje = (G.ganhoHoje || 0) + m.pago; }
  for (const l of m.linhas) if (G.feitosHoje && !G.feitosHoje.includes(l)) G.feitosHoje.push(l);
});
COLETORES.push(s => Encomendas.salvar(s));
