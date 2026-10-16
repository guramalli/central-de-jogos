// Família Santos — serra_jogo.js — o Nhô Quim, o mateiro da serra, e a loca atrás da Cachoeira Grande (T6 da spec da mata e do
// sítio, 15/10: docs/superpowers/specs/2026-10-15-mata-sitio-design.md, seção 4.4).
// Como é no Stardew: o Linus (o eremita da tenda, perto do lago da montanha): mora fora da cidade, só aparece no lugar dele, na chuva
// fica dentro da tenda, faz amizade como qualquer morador e ensina receita; e a Estrela do Velho Mestre Cannoli, na Floresta Secreta
// (o segredo do mapa de fora: +34 de energia máxima para sempre, uma vez só). Do Dave: o VIP que avisa antes e pede o prato com o
// nome dele. Do nosso jeito:
//  - O Nhô Quim (id 'mateiro', a arte personagens/mateiro e retratos/mateiro_*) fica no terreiro do rancho das 7h às 17h; com chuva,
//    fica no rancho (o botão direito na porta conversa com ele lá dentro); de noite, a porta fechada.
//  - DECISÃO (o caller pediu: "é morador da Vila?"): SIM para a amizade — ele tem corações como o Linus (conversar +10 por dia, cada
//    pedido feito +50, a janta de VIP bem servida +50), assina a lista do povo e fala na audiência (spec 2.1): a serra é patrimônio
//    da Vila. NÃO para a agenda da Vila: ele nunca desce para a praça nem entra na CLIENTELA da semana; só desce a serra para a janta
//    de VIP, uma vez por estação. A família continua sem número (amizade.js).
//  - A cadeia dele são 3 pedidos, cada um uma CONVERSA com o porquê (vivência, não missões; nada de lista):
//      1. "Traz 5 cipós que eu te ensino a fazer corda." → a corda entra no Fabricar (G.empreitas.receitasExtras; a seta da 1ª corda é
//         da T5);
//      2. "Planta 10 mudas nas clareiras..." → só DEPOIS DO TOMBAMENTO (Loteamento.serraTombada, T9): antes disso ele não pede; conta as
//         mudas plantadas na serra (Sitio.mudasEm('serra'); o gesto de plantar e a muda à venda são da T10);
//      3. "Pesca uma tabarana no poço da cachoeira." → a lenda dos jesuítas e a escada de corda (o item que já existe).
//    G.serra.quim.passo: 0 ainda não pediu nada · 1 pediu os cipós · 2 ensinou a corda (espera o tombamento) · 3 pediu as mudas ·
//    4 pediu a tabarana · 5 contou a lenda e deu a escada.
//  - A loca: o botão direito na pedra da fresta (SERRA.LOCA, mapa_serra.js chama abrirLoca) só desce com a escada de corda na mochila
//    (ela fica amarrada lá: a 1ª descida gasta 1). A 1ª vez toca a cena da loca (a arte cenas/loca, CENAS_ESPECIAIS.loca) e dá, uma
//    vez só: a água da mina (+ECO.serra.aguaDaMina de energia máxima, para sempre), o crucifixo de prata antigo (a 15ª peça do Museu
//    da Vila) e a receita "Pitu na Moranga do Nhô Quim" (receitas.js; caminho 'vip', o VIP 'mateiro').
//  - O VIP: com a receita achada, ele desce para jantar uma vez por estação (a partir do dia QUIM.VIP_DESDE dela, numa noite livre); o
//    aviso vem 3 dias antes, de recado pelo Seu Lourival (ele assina com o polegar: não escreve carta). Fica fora do rodízio dos VIPs
//    (porEstacao, eventos.js).
// A 1ª vez de cada coisa tem seta + frase no lugar exato (alvoDoMateiro, guia_setas.js) e some depois de feita; a Caderneta (aba Vila)
// mostra o que o Nhô Quim pediu e o crucifixo por doar.

const QUIM = {
  ID: 'mateiro', NOME: 'Nhô Quim', NOME_VIP: 'Nhô Quim, o mateiro',
  DE: 7 * 60, ATE: 17 * 60,                      // no terreiro das 7h às 17h (com chuva, no rancho)
  LUGAR: { x: 29, y: 8 },                        // no terreiro do rancho (SERRA.TERREIRO), entre a trilha e a porta
  AREA: { x: 27, w: 5 },                         // os ladrilhos do terreiro por onde ele anda (x 27 a 31, na fileira do terreiro)
  CIPOS: 5, MUDAS: 10,
  PEDIDO: 50,                                    // a amizade de cada pedido feito (o mesmo do recado e do serviço do quadro)
  VIP_DESDE: 10,                                 // o VIP sai a partir do 10º dia da estação (dá tempo de juntar pitu)
  RECEITA: 'pitu_moranga',
};
const _quimTerreiroY = () => (typeof SERRA !== 'undefined' ? SERRA.TERREIRO.y : 8);

// ---------- o estado (no save) ----------
const Serra = {
  iniciar(s) {
    const v = s && s.serra && typeof s.serra === 'object' ? s.serra : {}, q = v.quim || {}, l = v.loca || {}, vp = v.vip || {};
    const n = x => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.trunc(x)) : 0);
    G.serra = {
      quim: { passo: clamp(n(q.passo), 0, 5), tabarana: q.tabarana === true },
      loca: { aberta: l.aberta === true, agua: l.agua === true, crucifixo: l.crucifixo === true, receita: l.receita === true },
      vip: { estacoes: Array.isArray(vp.estacoes) ? vp.estacoes.filter(x => Number.isFinite(x)).map(x => Math.trunc(x)) : [], servido: n(vp.servido) },
    };
    // A água da mina vale para sempre (o ferramentas.js já pôs a energia máxima de sempre: aqui entra o ganho dela).
    if (G.serra.loca.agua) G.energiaMax += ECO.serra.aguaDaMina;
  },
  salvar(s) { s.serra = JSON.parse(JSON.stringify(G.serra)); },
};
INICIADORES.push(s => Serra.iniciar(s));
COLETORES.push(s => Serra.salvar(s));

// ---------- o Nhô Quim ----------
const Quim = {
  chove() { return typeof Clima !== 'undefined' && !!Clima.chove(G.dia); },
  deDia() { return G.minutos >= QUIM.DE && G.minutos < QUIM.ATE; },
  noTerreiro() { return Quim.deDia() && !Quim.chove(); },
  noRancho() { return Quim.deDia() && Quim.chove(); },
  cipos() { return G.mochila ? G.mochila.total('cipo') : 0; },
  mudas() { return typeof Sitio !== 'undefined' && G.sitio ? Sitio.mudasEm('serra') : 0; },
  tombada() { return typeof Loteamento !== 'undefined' && !!G.loteamento && Loteamento.serraTombada(); },
  passo() { return G.serra ? G.serra.quim.passo : 0; },
  // A conversa da receita achada na loca vem na frente da cadeia (uma vez só: o `uma` da linha).
  receitaPorContar() { return !!G.serra && G.serra.loca.receita && !(G.falasVistas && 'quim_receita' in G.falasVistas); },
  emPasso(p) { return Quim.passo() === p && !Quim.receitaPorContar(); },
  morador() { return G.mapaId === 'serra' && G.mapa ? G.mapa.moradores.find(m => m.id === QUIM.ID && m.visivel !== false) || null : null; },
  // No mapa da serra: no terreiro, andando devagar entre a trilha e a porta do rancho (visível só das 7h às 17h, sem chuva).
  porNoMapa(b) {
    if (b.moradores.some(m => m.id === QUIM.ID)) return;
    const y = _quimTerreiroY(), m = b.morador(QUIM.ID, QUIM.NOME, QUIM.LUGAR.x, y, DIR.BAIXO);
    Object.assign(m, { vagueia: true, area: { x: QUIM.AREA.x * TILE, y: y * TILE + 34, w: QUIM.AREA.w * TILE, h: 14 }, visivel: Quim.noTerreiro() });
  },
  // ---- os passos (cada um chamado no fim da conversa que conta o porquê; repetir a conversa no mesmo dia não anda de novo)
  ganhar() { if (typeof Amizade !== 'undefined') Amizade.ganhar(QUIM.ID, QUIM.PEDIDO, 'pedido do mateiro'); },
  pedirCipos() { if (G.serra.quim.passo === 0) G.serra.quim.passo = 1; },
  receberCipos() {
    const q = G.serra.quim; if (q.passo !== 1 || Quim.cipos() < QUIM.CIPOS) return false;
    G.mochila.remover('cipo', QUIM.CIPOS);
    if (!G.empreitas.receitasExtras.includes('corda')) G.empreitas.receitasExtras.push('corda');
    q.passo = 2; Quim.ganhar(); hudSujo();
    if (typeof sons !== 'undefined') sons.tocar('receita_nova', 1, 0, -6);
    avisar('O Nhô Quim ensinou a trançar corda: no Fabricar, 3 cipós dão 1 corda.');
    return true;
  },
  pedirMudas() { if (G.serra.quim.passo === 2 && Quim.tombada()) G.serra.quim.passo = 3; },
  receberMudas() { const q = G.serra.quim; if (q.passo !== 3 || Quim.mudas() < QUIM.MUDAS) return false; q.passo = 4; Quim.ganhar(); return true; },
  contarLenda() {
    const q = G.serra.quim; if (q.passo !== 4 || !q.tabarana) return false;
    q.passo = 5; Quim.ganhar();
    if (G.serra.loca.aberta) return true;   // (a loca já foi aberta com outra escada: ela continua amarrada lá, não precisa de outra)
    const sobra = G.mochila.adicionar('escada_corda', 1); if (sobra && typeof soltar === 'function' && G.jog) soltar('escada_corda', sobra, G.jog.x, G.jog.y);
    hudSujo(); avisar('O Nhô Quim deu uma escada de corda: a loca é na pedra da fresta, do lado da Cachoeira Grande.');
    return true;
  },
  // ---- o VIP: uma vez por estação, a partir do dia VIP_DESDE dela, numa noite livre (sem outro VIP, festa, encomenda de festa,
  // Doutor Paladar nem Concurso). Pede o Pitu na Moranga quando a pensão já aceita os ingredientes; senão, um prato que ele gosta.
  planejarVip(dia = G.dia) {
    const p = G.pensao, S = G.serra;
    if (!p || p.estado !== 'aberta' || !S || !S.loca.receita || typeof vipDe !== 'function') return null;
    const est = Math.floor((dia - 1) / 28), alvo = diaDoAviso(dia);
    if (S.vip.estacoes.includes(est) || (dia - 1) % 28 + 1 < QUIM.VIP_DESDE || Math.floor((alvo - 1) / 28) !== est) return null;
    if ((p.agenda || []).some(e => !e.fim && e.dia === alvo && ['vip', 'festa', 'encomenda'].includes(e.tipo))) return null;
    if (typeof Paladar !== 'undefined' && Paladar.vem(p, alvo)) return null;
    if (typeof Concurso !== 'undefined' && Concurso.temNoDia && Concurso.temNoDia(p, alvo)) return null;
    const v = vipDe(QUIM.ID), rv = QUIM.RECEITA, ok = v.gosta.filter(id => p.receitas.includes(id));
    const da = p.receitas.includes(rv) && Object.keys(Pratos.PRATOS[rv].porcao).every(i => p.aceita(i));
    const e = { tipo: 'vip', id: QUIM.ID, dia: alvo, avisado: dia, prato: da ? rv : (ok.length ? ok[0] : v.gosta[v.gosta.length - 1]), ensinou: '' };
    (p.agenda = p.agenda || []).push(e); S.vip.estacoes.push(est);
    return e;
  },
  cartaDoVip(e) {
    return `Recado do Nhô Quim, pelo Seu Lourival: na ${DIAS[(e.dia - 1) % 7]} o mateiro desce a serra para jantar na pensão. Ele não escreve: mandou dizer de boca.`
      + `\n\n(Ele vai pedir: ${Pratos.PRATOS[e.prato].nome}.)`;
  },
  // A janta de VIP bem servida (a manhã seguinte): +50 de amizade, uma vez por janta.
  depoisDoVip() {
    for (const e of (G.pensao && G.pensao.agenda) || []) {
      if (e.tipo !== 'vip' || e.id !== QUIM.ID || e.fim !== 'servido' || e.quim) continue;
      e.quim = 1; G.serra.vip.servido++; Quim.ganhar();
    }
  },
};
if (typeof Amizade !== 'undefined') Amizade.NOMES[QUIM.ID] = QUIM.NOME;

// ---------- as falas (o motor de falas, conversas.js; só @alegre: é a emoção que tem arte além do _normal) ----------
const FALA_QUIM_APRESENTA = [
  '@alegre Ô de casa! Gente subindo a trilha da serra? Faz tempo... Eu sou o Joaquim, mas todo mundo me chama de Nhô Quim. Moro neste rancho desde menino.',
  'Você é o Jocelino, o moço de Aracaju que escorou a ponte da mata? Pois a serra agradece: ponte bamba só servia pro palmiteiro.',
  'Aqui ninguém corta nada. A mata dá o que a gente precisa: cipó, fruta, peixe no rio. É só saber pedir.',
  'Faz assim: traz 5 cipós que eu te ensino a fazer corda. Cipó cai no chão da serra, enroscado nas árvores. Corda boa serve pra tudo: poço, rede, escada.',
];
CONVERSAS[QUIM.ID] = {
  nome: QUIM.NOME, aniversario: [1, 3],
  linhas: [
    // A cadeia (regra 5: o estado do jogo). A apresentação é uma linha de estado (passo 0), e não a `primeira` do motor: a `primeira`
    // se repete o dia inteiro (a regra do mesmo dia), e quem catasse os 5 cipós no mesmo dia ouviria a apresentação de novo, sem
    // poder entregar; e o save de antes do motor já "conhece" todo mundo (Conversas.iniciar), então a `primeira` nunca sairia.
    // (o pedido dos cipós anda só aqui, no fim da apresentação: a conversa da lata, com a loca aberta antes de conhecê-lo, não pula a
    // apresentação; revisão da T6)
    { quando: { se: () => Quim.emPasso(0) }, depois: () => Quim.pedirCipos(), fala: FALA_QUIM_APRESENTA },
    { quando: { se: () => Quim.emPasso(1) && Quim.cipos() < QUIM.CIPOS }, fala: () => { const n = Quim.cipos();
      return [`Cadê os cipós, menino? São ${QUIM.CIPOS}${n ? `: você tem ${n}` : ''}.`, 'Cipó cai no chão da serra, enroscado nas árvores: cata que nem fruta. Trançado, vira corda, e corda segura até rede de dormir.']; } },
    { quando: { se: () => Quim.emPasso(1) && Quim.cipos() >= QUIM.CIPOS }, depois: () => Quim.receberCipos(), fala: [
      '@alegre Trouxe os cipós! Senta aqui no toco que eu te mostro.',
      'Pega três, torce um no outro, aperta bem... e trança. Pronto: corda. Meu pai me ensinou assim, e o pai dele ensinou ele.',
      'Agora você sabe: no Fabricar, três cipós viram uma corda.',
      'Quando a serra for da Vila, aí eu te peço outra coisa, moço. Por ora, a mata tá esperando.'] },
    { quando: { se: () => Quim.emPasso(2) && Quim.tombada() }, depois: () => Quim.pedirMudas(), fala: [
      '@alegre A serra agora é da Vila: tombada, no papel da Prefeitura. Ninguém mais derruba juçara aqui.',
      `Mas papel não planta árvore, menino. Planta ${QUIM.MUDAS} mudas nas clareiras que o palmiteiro e a turma do agrimensor deixaram: cova com a pá e a muda na mão.`,
      'Muda pega devagar. Em um mês vira árvore, e árvore em pé segura a nascente da Vila.'] },
    { quando: { se: () => Quim.emPasso(3) && Quim.mudas() < QUIM.MUDAS }, fala: () => { const n = Quim.mudas();
      return [`Já tem ${n} ${n === 1 ? 'muda' : 'mudas'} nas clareiras. Faltam ${QUIM.MUDAS - n}.`, 'Planta na terra das clareiras, onde o palmiteiro cortou. Ali a juçara volta.']; } },
    { quando: { se: () => Quim.emPasso(3) && Quim.mudas() >= QUIM.MUDAS }, depois: () => Quim.receberMudas(), fala: [
      `@alegre ${QUIM.MUDAS === 10 ? 'Dez' : QUIM.MUDAS} mudas! Daqui a uns anos ninguém diz que o palmiteiro passou por aqui.`,
      'Agora me faz um gosto: pesca uma tabarana no poço da Cachoeira Grande. Ela é brava e só sobe na primavera e no verão.',
      'Pegou, vem me contar. Aí eu te conto uma coisa que só os antigos sabiam.'] },
    { quando: { se: () => Quim.emPasso(4) && !G.serra.quim.tabarana }, fala: [
      'Pesca uma tabarana no poço da Cachoeira Grande, menino. Ela só morde no poço fundo, na primavera e no verão.', 'Pegou, vem me contar.'] },
    { quando: { se: () => Quim.emPasso(4) && G.serra.quim.tabarana }, depois: () => Quim.contarLenda(), fala: () => [
      '@alegre Pegou a tabarana! Meu pai dizia que quem tira tabarana daquele poço tem mão firme.',
      'Então escuta. Atrás da água tem uma loca. Os antigos diziam que os padres esconderam coisa ali, no tempo dos jesuítas.',
      G.serra.loca.aberta ? 'Mas pelo jeito você já desceu lá, né? Eu vi a escada amarrada na pedra da fresta. Moço curioso!'
        : 'Eu já tô velho pra descer. Toma esta escada de corda: amarra na pedra da fresta, do lado da cachoeira, e desce devagar.'] },
    { quando: { se: () => Quim.emPasso(5) && !G.serra.loca.aberta }, fala: [
      'A loca é na pedra da fresta, do lado da Cachoeira Grande. Com a escada de corda na mochila, é só descer.'] },
    { quando: { se: () => Quim.receitaPorContar() }, uma: true, id: 'quim_receita', fala: [
      '@alegre Você achou a lata! A receita do Pitu na Moranga é da minha mãe. Eu escondi na loca quando ela se foi, pra não perder.',
      'Leva pra tua Rosa. Uma vez por estação eu desço a serra pra comer: mando avisar pelo Seu Lourival.'] },
    // A chuva (regra 8: em metade dos dias de chuva), as estações e os corações.
    { quando: { chuva: true }, fala: ['Entra, menino, que a chuva tá grossa. Chuva na serra é bênção: enche a nascente da Vila.', 'E com chuva o muçum sai da toca, no outono e no inverno.'] },
    { quando: { estacao: 2 }, fala: ['@alegre Primavera é a flor da uvaia. Daqui a pouco tem fruta pra todo lado.'] },
    { quando: { estacao: 2 }, fala: ['Na primavera a tabarana sobe o rio. Vara firme, menino, que ela puxa.'] },
    { quando: { estacao: 3 }, fala: () => { const d = typeof dicaDoLendario === 'function' ? dicaDoLendario('tabarana_ouro') : '';
      return d ? ['Verão é tempo de grumixama e de tabarana.', 'E ouve o que eu sei: ' + d.charAt(0).toLowerCase() + d.slice(1)] : ['@alegre Verão é tempo de grumixama, a cereja da serra. Doce que só.']; } },
    { quando: { estacao: 3 }, fala: ['O sol do verão esquenta o poço da cachoeira: o peixe grande sobe pra comer de manhã cedo.'] },
    { quando: { coracoes: 4 }, uma: true, id: 'quim_coracoes4', fala: ['@alegre Você é dos bons, Jocelino. Fazia tempo que eu não tinha com quem prosear aqui em cima.', 'Fala pra Rosa que o rancho tá sempre aberto. Café de coador eu tenho.'] },
    // O dia comum (o empate sorteia pelo dia).
    { fala: ['Juçara não se corta, menino. Quem corta palmito mata a palmeira inteira; o fruto, a gente colhe todo ano.'] },
    { fala: ['Pitu sai de noite, no rio. Bota o covo com isca na beira que de manhã tem pitu.'] },
    { fala: ['A água que sai na torneira da Vila nasce aqui em cima. Quem derruba a serra seca a Vila lá embaixo.'] },
    { fala: ['Tá vendo o jequitibá grande, pra lá da pinguela? Já era velho quando os padres passaram por aqui.'] },
  ],
};

// ---------- no mapa ----------
AO_MONTAR.push(b => { if (b.id === 'serra') Quim.porNoMapa(b); });
// Das 7h às 17h no terreiro; com chuva, no rancho; de noite, dormindo (some do terreiro).
ATUALIZADORES.push(() => {
  if (G.mapaId !== 'serra' || !G.mapa) return;
  const m = G.mapa.moradores.find(p => p.id === QUIM.ID); if (m) m.visivel = Quim.noTerreiro();
});
// O botão direito no rancho (mapa_serra.js): com chuva, ele conversa lá de dentro; de dia sem chuva, está no terreiro; de noite, dorme.
function acaoDoRancho() {
  if (Quim.noRancho()) {
    if (typeof Amizade !== 'undefined') Amizade.conversar(QUIM.ID);   // (a conversa pela porta conta como a do terreiro)
    const P = SERRA.PORTA;
    return Conversas.abrir({ id: QUIM.ID, nome: QUIM.NOME, x: (P.x + 0.5) * TILE, y: P.y * TILE + 42 });
  }
  abrirPlaca(Quim.noTerreiro() ? 'Um rancho de pau a pique com telhado de sapé. A porta está encostada: o Nhô Quim está aí fora, no terreiro.'
    : 'A porta do rancho está fechada. O Nhô Quim dorme com as galinhas e acorda com os passarinhos: de dia, das 7h às 17h, ele está por aqui.');
  return true;
}
// O peixe pego (pesca_jogo.js): a tabarana que o Nhô Quim pediu (só sai no poço da Cachoeira Grande).
{ const _pegou = pegouPeixe; pegouPeixe = function (...a) { const r = _pegou.apply(this, a); if (a[0] === 'tabarana' && G.serra && G.serra.quim.passo === 4) G.serra.quim.tabarana = true; return r; }; }

// ---------- a loca ----------
const FALA_LOCA_SEM_ESCADA = 'Uma pedra grande, de musgo, colada na queda d\'água. Tem uma fresta escura no meio... Lá dentro é fundo: sem uma escada de corda, não dá para descer.';
const FALA_LOCA_DE_NOVO = 'A loca atrás da cachoeira. A escada de corda continua amarrada na pedra. A mina d\'água escorre fria, e o baú dos padres está vazio.';
// O botão direito na pedra da fresta (mapa_serra.js).
function abrirLoca() {
  const L = G.serra.loca;
  if (L.aberta) { abrirPlaca(FALA_LOCA_DE_NOVO); return true; }
  if (G.mochila.total('escada_corda') < 1) { abrirPlaca(FALA_LOCA_SEM_ESCADA); return true; }
  Loca.descer();
  return true;
}
const Loca = {
  // A 1ª descida: a escada fica amarrada (gasta 1), os achados entram e a cena toca; os avisos vêm no fim da cena.
  descer() {
    G.mochila.remover('escada_corda', 1); G.serra.loca.aberta = true;
    const r = Loca.ganhar();
    if (typeof sons !== 'undefined') sons.tocar('pegar', 0.6, 0.05, -6);
    const fim = () => Loca.avisos(r);
    if (typeof CenaPrato !== 'undefined') CenaPrato.tocarEspecial('loca', fim, { artes: [iconePratoGrande(QUIM.RECEITA)] }); else fim();
    return r;
  },
  // O que a loca dá, cada coisa uma vez só: { agua, crucifixo, receita }.
  ganhar() {
    const L = G.serra.loca, r = {};
    if (!L.agua) { L.agua = true; G.energiaMax += ECO.serra.aguaDaMina; G.energia = G.energiaMax; r.agua = ECO.serra.aguaDaMina; }
    if (!L.crucifixo) { L.crucifixo = true; r.crucifixo = true;
      const s = G.mochila.adicionar('crucifixo_prata', 1); if (s && typeof soltar === 'function' && G.jog) soltar('crucifixo_prata', s, G.jog.x, G.jog.y); }
    if (!L.receita) { L.receita = true; r.receita = !!G.pensao && G.pensao.liberarReceita(QUIM.RECEITA); }
    hudSujo();
    return r;
  },
  avisos(r) {
    if (r.agua) avisar(`A água da mina: +${r.agua} de energia máxima, para sempre.`);
    if (r.crucifixo) avisar('Um crucifixo de prata antigo, do tempo dos jesuítas: o Museu da Vila tem vitrine para ele.');
    if (r.receita) avisar(`Receita nova no caderno da Rosa: ${Pratos.PRATOS[QUIM.RECEITA].nome}.`);
  },
};
// A cena da loca (a arte cenas/loca, 16:9, sem gente: a cortina d'água à esquerda, a mina no meio, o baú à direita). O código só
// aproxima, faz transparência e põe o brilho e o prato por cima (nunca arte por código). Três partes, cada uma com a frase dela na
// faixa de cima: a água da mina, o baú dos padres e a receita.
const LOCA_CENA = { MINA: { x: 1200, y: 600 }, BAU: { x: 1730, y: 720 }, PARTES: [[0.5, 3.1], [3.3, 6.0], [6.2, 9.3]] };
if (typeof CENAS_ESPECIAIS !== 'undefined') CENAS_ESPECIAIS.loca = {
  dur: 9.6, legenda: [0.4, 9.3], titulo: 'A loca atrás da cachoeira',
  // a frase da parte que está tocando (cena_prato.js lê `fala` a cada quadro: [de, até, texto])
  get fala() {
    const c = typeof CenaPrato !== 'undefined' && CenaPrato._cena, t = c ? c.t : -1, P = LOCA_CENA.PARTES;
    const textos = [`A água da mina: fria, de pedra. +${ECO.serra.aguaDaMina} de energia máxima, para sempre.`,
      'No baú dos padres, um crucifixo de prata antigo: peça para o Museu da Vila.',
      'E numa lata, um papel dobrado: a receita do Pitu na Moranga do Nhô Quim.'];
    const k = P.findIndex(([a, b]) => t >= a && t <= b);
    return k < 0 ? null : [P[k][0], P[k][1], textos[k]];
  },
  artes: ['cenas/loca', 'cenas/letreiro_brilho'],
  sons: [[0.9, 'cena_tchan', 0.8, -8], [3.5, 'cena_tchan', 1, -6], [6.4, 'receita_nova', 1, -4]],
  desenha(d, t) {
    const M = LOCA_CENA.MINA, B = LOCA_CENA.BAU;
    // 1. a mina: a loca inteira e o zoom devagar em volta da água que brilha; o brilho pulsa em cima dela
    if (t < 3.6) {
      d.fundo('cenas/loca', 1 + 0.14 * _eo(_cs(t, 0, 3.4)), 1, M.x, M.y);
      for (let k = 0; k < 4; k++) {
        const v = _cs(t, 0.8 + k * 0.45, 1.8 + k * 0.45); if (v <= 0 || v >= 1) continue;
        d.peca('cenas/letreiro_brilho', M.x + [-40, 50, -10, 30][k], M.y + [-30, 10, 30, -60][k], 150 * Math.sin(Math.PI * v), { rot: v * 2.2 * (k % 2 ? -1 : 1), alfa: Math.sin(Math.PI * v) });
      }
      if (t >= 1.2 && t < 1.8) d.luz(0.18 * (1 - _cs(t, 1.2, 1.8)));   // (o gole: a força voltando)
    }
    // 2. o baú dos padres: a câmera vai para a direita (o mesmo quadro, com o zoom em volta do baú) e o brilho da prata
    if (t >= 3.2 && t < 6.4) {
      d.fundo('cenas/loca', 1.18 + 0.06 * _eo(_cs(t, 3.2, 6.2)), _cs(t, 3.2, 3.6), B.x, B.y);
      for (let k = 0; k < 4; k++) {
        const v = _cs(t, 3.9 + k * 0.4, 4.9 + k * 0.4); if (v <= 0 || v >= 1) continue;
        d.peca('cenas/letreiro_brilho', B.x + [0, -60, 45, -20][k], B.y + [-30, -10, -50, 15][k], 160 * Math.sin(Math.PI * v), { rot: v * 2.4 * (k % 2 ? -1 : 1), alfa: Math.sin(Math.PI * v) });
      }
    }
    // 3. a receita: a loca a meia luz e o prato subindo no meio, com o brilho atrás
    if (t >= 6.0) {
      d.fundo('cenas/loca', 1.04 - 0.04 * _eo(_cs(t, 6.0, 9.6)), 0.38 * _cs(t, 6.0, 6.4), 960, 540);
      const u = _eo(_cs(t, 6.3, 7.1)), y = 1180 - u * 640;
      d.peca('cenas/letreiro_brilho', 960, y, 480 * u * (1 + 0.05 * Math.sin(t * 4)), { rot: t * 0.6, alfa: 0.55 * u });
      d.peca(iconePratoGrande(QUIM.RECEITA), 960, y, 270, { esc: 1 + 0.12 * Math.sin(Math.PI * _cs(t, 7.1, 7.5)), alfa: u });
    }
  },
};

// ---------- o crucifixo de prata: a 15ª peça do Museu da Vila (não sai cavando marca: só da loca) ----------
Object.assign(ITENS, { crucifixo_prata: { nome: 'Crucifixo de prata antigo', pilha: 9, ferramenta: false,
  descricao: 'Achado na loca atrás da Cachoeira Grande, do tempo dos jesuítas. Doe ao Museu da Vila.' } });
if (typeof MUSEU !== 'undefined' && !MUSEU.ANTIGOS.includes('crucifixo_prata')) {
  MUSEU.ANTIGOS.push('crucifixo_prata');
  MUSEU.DESCRICAO.crucifixo_prata = 'Crucifixo de prata do tempo dos jesuítas, achado na loca atrás da Cachoeira Grande. O Nhô Quim jura que os padres esconderam mais coisa na serra.';
}

// ---------- o VIP (eventos.js): fora do rodízio, uma vez por estação ----------
if (typeof VIPS !== 'undefined') VIPS.push({ id: QUIM.ID, nome: QUIM.NOME_VIP, porEstacao: true, gosta: ['pirao', 'lambari_crocante', 'peixe_frito'],
  premio: { dinheiro: 0, curtidas: 8, pitadas: 4 },
  carta: 'Recado do Nhô Quim, pelo Seu Lourival: o mateiro vai descer a serra para jantar na pensão. Ele não escreve: mandou dizer de boca.',
  frase: 'Comida boa assim eu não comia desde que a minha mãe se foi. Deus lhe pague, Dona Rosa!' });
// O caderno da Rosa: antes de achar, a receita é um segredo da serra (e não "chega pela carta").
if (typeof Pensao !== 'undefined') { const _como = Pensao.prototype.comoLiberar;
  Pensao.prototype.comoLiberar = function (id) { return id === QUIM.RECEITA && !this.receitas.includes(id) ? 'Um segredo da Mata da Serra: dizem que o mateiro de lá sabe onde a receita está guardada.' : _como.call(this, id); }; }
MANHA.push(() => {
  if (!G.serra) return;
  Quim.depoisDoVip();
  const e = Quim.planejarVip();
  if (e && typeof CARTAS !== 'undefined' && G.correio) { const k = 'vip_' + G.dia; CARTAS[k] = { de: 'Seu Lourival (recado do Nhô Quim)', dia: 1e9, texto: Quim.cartaDoVip(e) }; G.correio.caixa.push(k); }
});

// ---------- a primeira vez (seta + frase no lugar exato; some depois de feita) ----------
// guia_setas.js chama: conhecer o Nhô Quim; entregar os 5 cipós; descer na loca com a escada dele; doar o crucifixo no Museu.
function alvoDoMateiro() {
  if (!G.serra || !G.mochila) return null;
  const q = G.serra.quim, L = G.serra.loca;
  if (G.mapaId === 'vila' && L.crucifixo && G.mochila.total('crucifixo_prata') > 0 && G.mina && G.mina.museu && !G.mina.museu.doados.includes('crucifixo_prata'))
    return { mapa: 'vila', objeto: 'museu', rotuloFixo: 'O crucifixo de prata da loca: botão direito no Museu da Vila para doar' };
  if (G.mapaId !== 'serra') return null;
  const m = Quim.morador();
  if (q.passo === 0 && m) return { mapa: 'serra', morador: QUIM.ID, rotuloFixo: 'O Nhô Quim, o mateiro da serra: botão direito para conversar' };
  if (q.passo === 1 && Quim.cipos() >= QUIM.CIPOS) {
    if (m) return { mapa: 'serra', morador: QUIM.ID, rotuloFixo: `Os ${QUIM.CIPOS} cipós: botão direito no Nhô Quim para entregar` };
    if (Quim.noRancho()) return { mapa: 'serra', objeto: 'rancho_mateiro', rotuloFixo: 'Com chuva o Nhô Quim fica no rancho: botão direito na porta' };
  }
  // (C12) O 1º cipó depois do pedido: a seta no cipó mais perto, com o porquê; some no 1º cipó catado com o pedido feito (G.limpou.cipo_quim)
  if (q.passo === 1 && Quim.cipos() < QUIM.CIPOS && !G.limpou.cipo_quim) { const c = _cipoMaisPerto();
    if (c) return Object.assign(c, { rotuloFixo: `Cipó! Botão direito para catar: o Nhô Quim pediu ${QUIM.CIPOS} pra ensinar a corda` }); }
  if (q.passo === 5 && !L.aberta && G.mochila.total('escada_corda') > 0)
    return { mapa: 'serra', objeto: 'loca_entrada', rotuloFixo: 'A loca: com a escada de corda na mochila, botão direito na pedra da fresta' };
  return null;
}
// O cipó de hoje ainda no chão da serra, o mais perto do Jocelino (só com ele na serra).
function _cipoMaisPerto() {
  if (G.mapaId !== 'serra' || !G.mapa || !G.jog || !G.achados || typeof Achados === 'undefined') return null;
  const cat = G.achados.catados.serra || [], ks = new Set(Achados.doDia(G.dia, 'serra').filter(x => x.id === 'cipo' && !cat.includes(x.k)).map(x => 'achado_' + x.k));
  let o = null, d = 1e9;
  for (const x of G.mapa.objs) if (x.achado && ks.has(x.id)) { const dd = Math.hypot(x.x - G.jog.x, x.y - G.jog.y); if (dd < d) { d = dd; o = x; } }
  return o && { mapa: 'serra', ponto: { x: o.x, y: o.y - 40 } };
}
AO_PEGAR.push(item => { if (item === 'cipo' && G.serra && G.serra.quim.passo === 1 && G.limpou) G.limpou.cipo_quim = 1; });

// ---------- a Caderneta (aba Vila): o que o Nhô Quim pediu (a conversa explica o porquê) e o crucifixo por doar ----------
// O Mostrar: na serra, o Nhô Quim (ou o rancho), a loca ou as clareiras; na mata, a saída de baixo; de outro lugar, a mata.
function _alvoNaSerra(a) {
  return G.mapaId === 'serra' ? Object.assign({ mapa: 'serra' }, a) : G.mapaId === 'mata' ? { mapa: 'mata', ponto: { x: 27 * TILE, y: 22 * TILE } } : { mapa: 'mata' };
}
const _alvoDoQuim = () => _alvoNaSerra(Quim.morador() ? { morador: QUIM.ID } : { objeto: 'rancho_mateiro' });
// (C12, 16/10; o teste crítico: "o pedido dos 5 cipós não entra no Agora nem na lista") Na aba Mata e serra (caderneta.js), com a
// barrinha e o Mostrar, logo que ele pede (antes a linha esperava a cachoeira, mesmo com o pedido feito no rancho). Os cipós com o porquê
// de demorar: nascem no chão da serra, uns por dia (o sorteio dos achados, achados.js), e no verão a serra não dá cipó.
const CIPO_NA_ESTACAO = est => (ACHADOS_SERRA[est] || []).some(([id]) => id === 'cipo');
function linhasDoMateiro() {
  if (!G.serra || typeof Mundo === 'undefined' || !Mundo.aberto('serra') || !G.limpou) return [];
  const q = G.serra.quim, L = G.serra.loca, r = [], linha = (texto, alvo, feito, meta) => r.push(Object.assign({ id: 'serra_mateiro', aba: 'mata', texto, alvo }, meta ? { feito, meta } : {}));
  if (q.passo === 0) { if (G.limpou.serra_cachoeira) linha('Na serra mora um mateiro, o Nhô Quim: o rancho dele fica na trilha, antes do rio (de dia, das 7h às 17h)', _alvoDoQuim); }
  else if (q.passo === 1) { const n = Math.min(Quim.cipos(), QUIM.CIPOS), est = Math.floor((G.dia - 1) / 28) % 4;
    linha(n >= QUIM.CIPOS ? `Cipós ${n}/${QUIM.CIPOS}: leve ao Nhô Quim, que ele ensina a trançar corda`
      : `Cipós ${n}/${QUIM.CIPOS}: nascem no chão da serra, uns por dia${CIPO_NA_ESTACAO(est) ? '' : ' (no verão, não: volta no outono)'}. O Nhô Quim ensina a trançar corda`,
    n >= QUIM.CIPOS ? _alvoDoQuim : () => _cipoMaisPerto() || _alvoDoQuim(), n, QUIM.CIPOS); }
  else if (q.passo === 3) { const n = Math.min(Quim.mudas(), QUIM.MUDAS), C = SERRA.CLAREIRAS[0];
    linha(`O Nhô Quim pediu ${QUIM.MUDAS} mudas nas clareiras feridas da serra (${n} de ${QUIM.MUDAS})`, () => _alvoNaSerra({ ponto: { x: (C.x + C.w / 2) * TILE, y: (C.y + 1) * TILE } }), n, QUIM.MUDAS); }
  else if (q.passo === 4) linha(q.tabarana ? 'Você pegou a tabarana: vá contar ao Nhô Quim' : 'O Nhô Quim quer saber de uma tabarana do poço da Cachoeira Grande (primavera e verão)',
    q.tabarana ? _alvoDoQuim : () => _alvoNaSerra({ ponto: { x: (SERRA.POCO.x + 2) * TILE, y: (SERRA.POCO.y + 1) * TILE } }));
  else if (q.passo === 5 && !L.aberta) linha(G.mochila.total('escada_corda') > 0 ? 'A loca atrás da Cachoeira Grande: desça com a escada de corda do Nhô Quim'
    : 'A loca atrás da Cachoeira Grande: precisa de uma escada de corda na mochila', () => _alvoNaSerra({ objeto: 'loca_entrada' }));
  if (L.crucifixo && G.mochila.total('crucifixo_prata') > 0 && G.mina && G.mina.museu && !G.mina.museu.doados.includes('crucifixo_prata'))
    r.push({ id: 'serra_crucifixo', aba: 'vila', texto: 'O crucifixo de prata da loca: doe ao Museu da Vila', alvo: () => ({ mapa: 'vila', objeto: 'museu' }) });
  return r;
}
addEventListener('load', () => { if (typeof CADERNETA !== 'undefined') CADERNETA.push(() => linhasDoMateiro()); });
