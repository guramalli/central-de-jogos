// Família Santos — historias/atos.js — a história principal: os 5 atos, as cenas de virada, as velas da Dona Zefa e o depois do fim
// (T15 das conversas e histórias; spec docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 9; o motor é o
// historias.js, seção 6; a firma e o dia da inauguração são do firma.js, da C20).
// Como é no Stardew: o jogo não tem "capítulos" na tela. O ano vira com a festa da virada, a fazenda muda de cara aos poucos, e cada
// marco grande tem a sua cena curta (o ônibus consertado, o Centro Comunitário, a avaliação do avô com as velas no altar). Aqui é igual:
// o jogador NUNCA vê "Ato 2". G.ato só escolhe a cena de virada e algumas falas (`quando: { ato: N }`, conversas.js). Não trava nada.
//   ato 1 "A chegada"                 o começo
//   ato 2 "Fincar o pé"               a pensão aberta
//   ato 3 "A Vila é nossa também"     a casa mudada E o Jocelino pedreiro
//   ato 4 "O mestre"                  o dia 113 (o ano 2) OU o mestre de obras, o que vier primeiro
//   ato 5 "A firma da família"        o Edifício Maré entregue (a carta do Moreira, a meta do capital e o final: firma.js)
// O ato é o MAIOR que casa (cada marco só sobe) e nunca desce.
// AS VIRADAS (só arte que já existe: o mapa, os retratos e os balões, como os arcos; nenhuma arte nova):
//   1→2 o letreiro da pensão (a cena da C1, reforma_palco.js) + a 1ª CARTA DA ZEFA (zefa_pensao), 2 dias depois de abrir;
//   2→3 ato3_casa "Casa nossa": a 1ª noite em casa depois da mudança. A janta da família no chão da sala, o Juca de viola, a Rosa:
//       "Casa nossa, Jocelino." (o gatilho é a mudança: a cena é da casa, e o pedreiro pode vir antes ou depois dela);
//   3→4 ato4_reveillon "O primeiro Réveillon": a última noite do ano 1 (Verão 28, o dia 112), na praia: a Vila de branco, o Zé no
//       pandeiro, o Lourival chega de canoa, o Juca de viola; "Faz um ano."; o pedido da virada; a carta de um ano da Zefa no dia 113.
//       Não espera ninguém: da praia, depois da janta, ou a Rosa chama na hora de dormir (ou às 23h, onde o Jocelino estiver). O
//       Réveillon é a festa do dia 'reveillon' todo Verão 28 (a Vila fala dele; a cena é do ano 1);
//   4→5 ato5_predio "O Edifício Maré entregue": o Moreira vem ver o prédio (aliado: "Você já é maior que a minha firma, rapaz."; rival:
//       "Prédio bom. Agora vamos ver se você aguenta ser patrão."). O B4 do Bira (a maquete) é do arco dele, com 8♥: aqui ele só
//       comenta (lembra a maquete se o B4 já foi).
// O SAVE ANTIGO: na 1ª carga depois da T15, o ato é calculado e as viradas dos atos que já passaram ficam puladas (G.atos.pulou):
// só toca a virada do ato de agora (e as dos que vierem), se ainda não vista.
// AS VELAS (9.2.3, item 4): no final, depois da festa, a Dona Zefa pendura o oratório de Aracaju (a arte objetos/oratorio, que já
// existia sem uso) na sala da casa onde a família mora e acende as velinhas: a casa, a pensão e a firma sempre; a da amizade se 5
// pessoas da Vila têm 8♥ ou mais. NÃO HÁ ARTE DE VELA PRONTA: a vela é só o texto (a cena e o clique no oratório), nunca desenhada por
// código. A apagada acende no Natal seguinte: a Zefa volta todo Natal (zefa_natal, a cena da 1ª volta; depois, o resumo e a Vila).
// DEPOIS DO FIM (9.3): a carta do 1º serviço é do firma.js; aqui os tópicos de memória da festa (um mês depois e um ano depois).

const ATOS = {
  ANO2: 113,                       // o 1º dia do ano 2 (Outono 1): o ato 4 pelo calendário
  REVEILLON: { estacao: 3, dia: 28, ano: 1 },   // a última noite do ano 1: Verão 28 (o dia 112)
  REVEILLON_FORCA: 23 * 60,        // a partir das 23h a Rosa chama para a praia, onde o Jocelino estiver (o jogo livre)
  REVEILLON_CAMA: 20 * 60,         // (rodada 1, I1) a cama chama para a praia só a partir das 20h; antes, a cama pergunta como sempre
  REVEILLON_FIM: 25 * 60 + 30,     // (rodada 1, M13) perto das 2h (o desmaio), a Rosa chama mesmo com a dica do guia ou um aviso na tela
  MEIA_NOITE: 23 * 60 + 50,        // a cena da praia começa perto da meia-noite (o relógio anda até lá)
  NATAL: [3, 5],                   // o Natal da Vila Maré: Verão 5 (como o da Zélia, ZELIA_ARCO.NATAL)
  ZEFA_CARTA_DIAS: 2,              // a 1ª carta da Zefa sai 2 dias depois de a pensão abrir (e espera uma manhã sem outra carta)
  MEMORIA: { mes: 28, ano: 112 },  // a festa da firma volta na boca da Vila um mês e um ano depois (os tópicos _memory do Stardew)
  FALA_DIAS: 14,                   // o ato novo é assunto (o tópico 'ato_N') por 2 semanas
  // (rodada 1, I4) o assunto do ato só abre quando os tópicos do marco que o trouxe já fecharam (senão a pessoa repete a mesma coisa)
  MARCO_DO_ATO: { 2: ['pensao_abriu'], 3: ['casa_mudou', 'historia_ato3_casa', 'promovido'], 4: ['promovido', 'reveillon', 'historia_ato4_reveillon'],
    5: ['predio_entregue', 'historia_ato5_predio', 'maquete_predio'] },
  // ato 2→3: a sala da casa nova (ladrilhos de 48 px; o tapete fica entre as colunas 3 e 5, linhas 7 e 8); o Juca entra pela porta
  CASA: { rosa: [3, 8, 'direita'], jocelino: [6, 8, 'esquerda'], ritinha: [4, 9, 'cima'], zezinho: [5, 9, 'cima'], jucaPorta: [9, 10],
    jucaVai: [[9, 9], [7, 9]], camera: [5, 7] },
  // ato 3→4: a areia, longe da água (o mar começa na linha 16); o Lourival chega pela beira do mar
  PRAIA: { rosa: [22, 13, 'baixo'], jocelino: [21, 13, 'baixo'], ritinha: [20, 14, 'baixo'], zezinho: [23, 14, 'baixo'], juca: [18, 13, 'direita'],
    ze: [17, 14, 'direita'], lourivalMar: [27, 16], lourivalVai: [[27, 15], [25, 15], [25, 14]], camera: [21, 13] },
  // ato 4→5: a calçada do Edifício Maré (a mesma da B4 do Bira, BIRA_ARCO.PREDIO); o Moreira chega pela direita
  PREDIO: { jocelino: [18, 24, 'direita'], bira: [17, 24, 'direita'], moreiraDe: [24, 24], moreiraVai: [20, 24], camera: [19, 22] },
  // o oratório da Zefa na parede da sala (o pé, em px do cômodo, e a escala da arte de 78×90) e onde cada um fica na cena das velas
  ORATORIO: {
    // (a casa nova: na parede da sala, à direita do sofá; a família à esquerda, fora da caixa da fala, que fica embaixo)
    casa_familia_dentro: { x: 330, y: 291, escala: 0.6, olha: 'cima', zefa: [6, 7, 'cima'], rosa: [4, 8, 'direita'], jocelino: [2, 8, 'direita'] },
    // (a casa do Tio Juca: na parede de cima, embaixo da prateleira do rádio; a Zefa embaixo dele, olhando para cima)
    // (T16) antes o oratório ficava em (170, 104), sobre a cama das crianças, e o painel "Agora" do HUD (canto de cima à esquerda) o escondia no
    // jogo normal. Agora fica na parede do meio, embaixo da prateleira do rádio (fora dos painéis do HUD); a Zefa embaixo dele, a Rosa e o Jocelino dos lados.
    casa_juca_dentro: { x: 510, y: 118, escala: 0.6, olha: 'cima', zefa: [10, 4, 'cima'], rosa: [12, 4, 'esquerda'], jocelino: [8, 4, 'direita'] },
  },
};

const Atos = {
  _deitar: false,   // a família volta do Réveillon: o dia acaba assim que o jogo fica livre
  _aviso: '',       // o aviso da manhã do Réveillon (espera o jogo livre)
  _naTela: () => typeof HUD !== 'undefined',   // (o simulador carrega o jogo no Node sem o HUD: lá nada é chamado na tela)
  // ---------- o ato ----------
  // O ato pelo que o jogo mede agora (o maior que casa).
  calcular() {
    const o = G.obra, f = o ? o.funcao || 0 : 0;
    if (typeof Firma !== 'undefined' && Firma.predioEntregue()) return 5;
    if ((G.dia || 1) >= ATOS.ANO2 || f >= 3) return 4;
    if (typeof CasaFamilia !== 'undefined' && CasaFamilia.mudou() && f >= 2) return 3;
    if (G.pensao && G.pensao.estado === 'aberta') return 2;
    return 1;
  },
  // Põe G.ato em dia (nunca desce) e marca o dia em que cada ato novo chegou (0: chegou antes da T15, no save antigo). calado: na carga
  // do save (o ato que o save já tinha andado sem a T15 ver, ou um save gravado antes de o ato ser posto em dia) não vira assunto.
  atualizar(calado = false) {
    const A = G.atos || (G.atos = { desde: {}, pulou: [] }), a = Math.max(G.ato || 1, Atos.calcular());
    for (let n = (G.ato || 1) + 1; n <= a; n++) if (!(n in A.desde)) {
      A.desde[n] = G.dia;
      // o ato novo vira assunto de uns poucos (o tópico 'ato_N', aberto pelo Atos.abreFalas quando o marco já não é assunto; o save
      // antigo não abre)
      if (!calado) (A.fala || (A.fala = [])).push(n);
    }
    G.ato = a;
    return a;
  },
  ato() { return Atos.atualizar(); },
  // (rodada 1, I4) De manhã: o assunto do ato que chegou abre só quando os tópicos do marco dele já fecharam; só o do ato de agora.
  abreFalas() {
    const A = G.atos; if (!A || !A.fala || !A.fala.length || typeof Topicos === 'undefined' || !G.topicos) return [];
    const abertos = [];
    A.fala = A.fala.filter(n => {
      if (n !== (G.ato || 1)) return false;   // (o ato que já passou não vira assunto: a fala dele não casa mais)
      if ((ATOS.MARCO_DO_ATO[n] || []).some(t => Topicos.aberto(t))) return true;
      Topicos.abrir('ato_' + n, ATOS.FALA_DIAS); abertos.push(n); return false;
    });
    if (!A.fala.length) delete A.fala;
    return abertos;
  },
  // A virada do ato n pode tocar (a do save antigo, de um ato que já passou, fica pulada).
  viradaPode(n) { return !G.atos || !(G.atos.pulou || []).includes(n); },
  nome(n = G.ato || 1) { return ['', 'A chegada', 'Fincar o pé', 'A Vila é nossa também', 'O mestre', 'A firma da família'][n] || ''; },

  // ---------- o Réveillon ----------
  // A última noite do ano (Verão 28, todo ano): a festa do dia 'reveillon' (FESTAS_DO_DIA: a regra 4 das falas e das cenas).
  ehReveillon(dia = G.dia) { const R = ATOS.REVEILLON; return typeof Conversas !== 'undefined' && Conversas.estacao(dia) === R.estacao && Conversas.noEstacao(dia) === R.dia; },
  // Hoje é a última noite do ano 1 e a cena ainda não foi vista.
  reveillonHoje() {
    if (typeof Conversas === 'undefined' || !Atos.viradaPode(4) || (typeof Historias !== 'undefined' && Historias.viu('ato4_reveillon'))) return false;
    const R = ATOS.REVEILLON;
    return Conversas.ano() === R.ano && Conversas.estacao() === R.estacao && Conversas.noEstacao() === R.dia;
  },
  // A Rosa chama: a família desce para a praia agora (da cama, ou às 23h onde o Jocelino estiver). Devolve true se chamou.
  chamarReveillon() {
    if (!Atos._naTela() || !Atos.reveillonHoje() || typeof Historias === 'undefined' || !Historias.ligado() || Historias._h) return false;
    if (G.jog && G.jog.carga && G.jog.carga.id) return false;   // (com carga nos braços não troca de mapa: obra.js)
    abrirConversa('Rosa', urlArte('retratos/rosa_alegre'), ['@alegre Jocelino! Hoje é a última noite do ano: a Vila inteira tá descendo pra praia, de roupa branca, pra esperar a meia-noite.',
      '@alegre Bora, que ano-novo a gente passa junto!'], () => Atos.irAoReveillon());
    return true;
  },
  irAoReveillon() {
    if (Historias._h || !Atos.reveillonHoje()) return false;
    const P = ATOS.PRAIA;
    if (G.mapaId !== 'praia') entrarMapa('praia', { x: P.jocelino[0], y: P.jocelino[1] });
    return Historias.tocar('ato4_reveillon');
  },
  // O relógio da cena anda até perto da meia-noite (só na 1ª vez: rever não mexe na hora). Devolve false (o passo 'se' não pula).
  _quaseMeiaNoite() { const h = Historias._h; if (h && !h.revendo) G.minutos = Math.max(G.minutos, ATOS.MEIA_NOITE); return false; },
  // O pedido da virada (G.respostas.reveillon_pedido), lembrado nos créditos do final (firma.js).
  pedido() { return typeof Conversas !== 'undefined' ? Conversas.resposta('reveillon_pedido') || '' : ''; },
  pedidoNoFinal() {
    const cheia = typeof Firma !== 'undefined' && Firma.convidados().length >= Firma.CHEIA;
    return { pensao: `Na areia, no primeiro Réveillon, o pedido do Jocelino foi a pensão cheia: ${cheia ? 'a Vila inteira coube na festa' : 'e ela encheu de gente querida'}.`,
      firma: 'Na areia, no primeiro Réveillon, o pedido do Jocelino foi uma firma da família. Pedido feito, pedido cumprido.',
      mae: 'Na areia, no primeiro Réveillon, o pedido do Jocelino foi a mãe na Vila. A Dona Zefa veio.' }[Atos.pedido()] || '';
  },

  // ---------- as velas da Dona Zefa ----------
  // O oratório na sala, do final em diante (G.firma.vela: 'acesa' ou 'apagada', a da amizade).
  temOratorio() { return !!G.firma && !!G.firma.vela; },
  textoDasVelas() {
    const v = G.firma && G.firma.vela;
    return 'O oratório da Dona Zefa, trazido de Aracaju. Quatro velinhas: a da casa, a da pensão e a da firma, acesas' +
      (v === 'acesa' ? ', e a da amizade, acesa também.' : '. A da amizade espera o Natal: a Dona Zefa volta todo ano para acender.');
  },
  poeOratorio(b) {
    if (!b || !ATOS.ORATORIO[b.id]) return;
    for (const o of b.objs.filter(o => o.id === 'oratorio')) b.tirar(o);
    if (!Atos.temOratorio() || typeof casaDaFamilia !== 'function' || b.id !== casaDaFamilia()) return;
    const O = ATOS.ORATORIO[b.id], o = b.interativo('oratorio', 'objetos/oratorio', 0, 0, 1, 1, null, false);
    Object.assign(o, { x: O.x, y: O.y });
    o.desenha = ctx => desenhaPe(ctx, 'objetos/oratorio', o.x, o.y, 1, O.escala);
    o.acao = () => { abrirPlaca(Atos.textoDasVelas()); if (G.limpou) G.limpou.oratorio = (G.limpou.oratorio || 0) + 1; return true; };
    return o;
  },
  // (rodada 2, N1) A seta da 1ª vez no oratório: só DENTRO da casa onde a família mora, do dia depois da festa até o 1º clique, e só
  // quando nenhuma outra seta tem o que mostrar (guia_setas.js: o fim do guiaSetaMundo, como a plaquinha da casa). A missão é
  // 'oratorio' (sem _vez): é um enfeite, não segura as cenas do motor nem passa na frente do serviço e do recado.
  alvoDoOratorio() {
    const f = G.firma;
    if (!f || !f.feita || !f.vela || G.dia <= (f.feitaDia || 0) || (G.limpou && G.limpou.oratorio) || typeof casaDaFamilia !== 'function' || G.mapaId !== casaDaFamilia()) return null;
    return { mapa: G.mapaId, objeto: 'oratorio', rotuloFixo: 'Botão direito: o oratório da Dona Zefa' };
  },
  // A cena das velas no final (firma.js, Firma.inaugurar: depois da festa). A vela da amizade fica marcada; com as cenas ligadas, a
  // família vai para casa (a noite) e a Zefa acende as velinhas no oratório. aoFim() sempre uma vez.
  velasDoFinal(aoFim) {
    const f = G.firma;
    if (f) f.vela = typeof velaDaAmizade === 'function' && velaDaAmizade() ? 'acesa' : 'apagada';
    if ((typeof window !== 'undefined' && window.TESTE_PULA_CENAS) || typeof Historias === 'undefined' || !HISTORIAS.final_velas || Historias._h) { aoFim(); return false; }
    const casa = typeof casaDaFamilia === 'function' ? casaDaFamilia() : 'casa_juca_dentro', O = ATOS.ORATORIO[casa];
    G.minutos = Math.max(G.minutos, 22 * 60 + 30);
    entrarMapa(casa, { x: O.jocelino[0], y: O.jocelino[1] });
    if (!Historias.tocar('final_velas', { aoAcabar: () => aoFim() })) { aoFim(); return false; }
    return true;
  },
  // O dia do Natal deste ano (Verão 5) e se a Zefa ainda vem acender (a 1ª volta: a cena zefa_natal).
  natalDoAno(dia = G.dia) { return dia - (Conversas.estacao(dia) - ATOS.NATAL[0]) * 28 - Conversas.noEstacao(dia) + ATOS.NATAL[1]; },
  ehNatal(dia = G.dia) { return typeof Conversas !== 'undefined' && Conversas.estacao(dia) === ATOS.NATAL[0] && Conversas.noEstacao(dia) === ATOS.NATAL[1]; },
  // A Zefa está na Vila: do Natal ao fim do verão, num ano depois da festa da firma.
  zefaNaVila(dia = G.dia) {
    const f = G.firma; if (!f || !f.feita || typeof Conversas === 'undefined') return false;
    return Conversas.estacao(dia) === ATOS.NATAL[0] && Conversas.noEstacao(dia) >= ATOS.NATAL[1] && Atos.natalDoAno(dia) > (f.feitaDia || 0);
  },
  natalDaZefa() { return Atos.zefaNaVila() && !Historias.viu('zefa_natal'); },
  acendeAmizade() { const f = G.firma; if (f && f.vela !== 'acesa') { f.vela = 'acesa'; f.natal = G.dia; } },
};

// ---------- o estado (no save): G.atos e G.ato ----------
// G.atos = { desde: { 2: dia, ... }, pulou: [n...], cartaZefa: dia (a 1ª carta da Zefa já saiu), fala: [n...] (o assunto do ato por abrir) }. O save de antes da T15 (sem
// s.atos): as viradas dos atos de antes do de agora ficam puladas, e o dia em que cada ato começou fica desconhecido (0; o ato de agora
// não vira assunto). O jogo novo começa no ato 1, sem nada pulado.
INICIADORES.push(s => {
  G.ato = 1;
  if (s.atos) { G.atos = { desde: Object.assign({}, s.atos.desde || {}), pulou: (s.atos.pulou || []).slice() }; if (s.atos.cartaZefa) G.atos.cartaZefa = s.atos.cartaZefa;
    if (Array.isArray(s.atos.fala)) G.atos.fala = s.atos.fala.slice(); G.ato = Math.max(1, +s.ato || 1); }
  else { G.atos = { desde: {}, pulou: [] }; const a = Atos.calcular(); for (let n = 2; n < a; n++) G.atos.pulou.push(n); for (let n = 2; n <= a; n++) G.atos.desde[n] = 0; G.ato = a;
    // (rodada 1, I2) "Casa nossa" é da mudança: o save antigo que já mora na casa nova não tem mais a "1ª noite" (pula a virada 3)
    if (typeof CasaFamilia !== 'undefined' && CasaFamilia.mudou() && !G.atos.pulou.includes(3)) G.atos.pulou.push(3); }
  Atos.atualizar(true);
  Atos._deitar = false; Atos._aviso = '';
});
COLETORES.push(s => { const A = G.atos || {}; s.atos = { desde: Object.assign({}, A.desde || {}), pulou: (A.pulou || []).slice() }; if (A.cartaZefa) s.atos.cartaZefa = A.cartaZefa;
  if (A.fala && A.fala.length) s.atos.fala = A.fala.slice(); s.ato = G.ato || 1; });
MANHA.push(() => {
  Atos.atualizar(); Atos.abreFalas();
  const c = G.correio, p = G.pensao, f = G.firma;
  // a 1ª carta da Zefa (a virada 1→2): 2 dias depois de a pensão abrir, uma vez; como as outras cartas da família (afeto.js), ela
  // espera uma manhã sem outra novidade na caixa (correio.js, cartaQuePodeEsperar: uma carta por manhã)
  if (c && p && p.estado === 'aberta' && p.abreDia != null && G.dia >= p.abreDia + ATOS.ZEFA_CARTA_DIAS && Atos.viradaPode(2) && G.atos && !G.atos.cartaZefa) {
    G.atos.cartaZefa = G.dia;
    if (typeof cartaQuePodeEsperar === 'function') cartaQuePodeEsperar('zefa_pensao');
    else if (!c.caixa.includes('zefa_pensao') && !c.lidas.includes('zefa_pensao')) c.caixa.push('zefa_pensao');
  }
  // a manhã do Réveillon: a Rosa avisa
  if (Atos.reveillonHoje()) Atos._aviso = 'A Rosa: "Hoje é a última noite do ano! Depois da janta, a Vila inteira desce pra praia."';
  // a Zefa volta todo Natal (a 1ª volta tem a cena; as outras, o resumo e a Vila comentando)
  if (f && f.feita && Atos.ehNatal() && G.dia > (f.feitaDia || 0)) {
    if (G.feitosHoje) G.feitosHoje.push('A Dona Zefa chegou de Aracaju para passar o Natal com a família.');
    if (typeof Topicos !== 'undefined') Topicos.abrir('zefa_natal', 4);
  }
});
NOITE.push(() => { Atos.atualizar(); });
if (typeof ANTES_DE_CONVERSAR !== 'undefined') ANTES_DE_CONVERSAR.unshift(() => { try { Atos.atualizar(); } catch (e) { console.error(e); } return false; });
// O jogo livre: o aviso da manhã; o Réveillon às 23h onde o Jocelino estiver; depois do Réveillon, a família dorme.
let _atosT = 0;
ATUALIZADORES.push(dt => {
  if (!Atos._naTela() || !G.comecou) return;
  if ((_atosT += dt || 0) < 0.4) return; _atosT = 0;
  Atos.atualizar();
  const ocupado = (typeof menuAberto === 'function' && menuAberto()) || (typeof _fade !== 'undefined' && _fade) || !G.jog || G.jog.deitado || (typeof _dormindo !== 'undefined' && _dormindo);
  if (Atos._deitar && !ocupado && !Historias._h) { Atos._deitar = false; if (typeof dormir === 'function') dormir(); return; }
  if (Atos._aviso && !ocupado) { avisar(Atos._aviso, 6000); Atos._aviso = ''; }
  if (!ocupado && G.minutos >= ATOS.REVEILLON_FORCA && Atos.reveillonHoje() && Historias.ligado()) {
    const l = Historias.livre();
    if (!l || (G.minutos >= ATOS.REVEILLON_FIM && (l === 'guia' || l === 'aviso'))) Atos.chamarReveillon();
  }
});
// Dormir na noite do Réveillon (das 20h em diante): a Rosa chama para a praia antes (a cena acaba com a família dormindo). De dia, a
// cama pergunta como sempre (rodada 1, I1: a cama do dia 112 não leva ninguém para a praia ao meio-dia).
{ const _pedir = pedirDormir; pedirDormir = function () { if (G.minutos >= ATOS.REVEILLON_CAMA && Atos.chamarReveillon()) return true; return _pedir.apply(this, arguments); }; }

// ---------- as cartas da Dona Zefa (a virada 1→2 e a de um ano) ----------
CARTAS.zefa_pensao = { de: 'Dona Zefa, de Aracaju', dia: 1e9,
  texto: 'Meu filho, a Rosa me escreveu contando do letreiro da pensão, que foi você que pintou. Li a carta em voz alta na porta da venda, pra rua inteira ouvir: Pensão da Rosa! Me conta o que a Vila mais pede na janta, que eu quero saber. E dá um beijo nas crianças por mim. Sua mãe, Zefa.' };
CARTAS.zefa_um_ano = { de: 'Dona Zefa, de Aracaju', dia: 1e9,
  texto: 'Meu filho, faz um ano que vocês desceram do ônibus em Praia Grande. Na virada eu acendi uma velinha por vocês, no oratório. A Rosa escreve que a Ritinha já lê de tudo e que o Zezinho não para quieto. Guarda um lugar na Vila pra mim, que um dia eu apareço. Feliz ano-novo! Sua mãe, Zefa.' };

// ---------- as cenas de virada ----------
const _violaDoJuca = () => typeof JucaArco !== 'undefined' && JucaArco.violaNaVaranda();
HISTORIAS.ato3_casa = {
  // (a 1ª noite na casa nova vem antes da conversa do Juca da mesma noite, o J2 sem o loteamento, que pede o mesmo marco; as cenas
  // de coração dos arcos, mais adiantadas, continuam antes)
  prioridade: 20,
  quem: 'rosa', titulo: 'Casa nossa', clima: 'Anda arrumando a casa nova, pensando na primeira janta lá',
  // a casa mudada: a 1ª noite em casa depois da mudança (o pedreiro pode vir antes ou depois: a cena é da casa)
  gatilho: { mapa: 'casa_familia_dentro', hora: [19 * 60, 24 * 60], se: () => typeof CasaFamilia !== 'undefined' && CasaFamilia.mudou() && Atos.viradaPode(3) },
  elenco: { rosa: ATOS.CASA.rosa, jocelino: ATOS.CASA.jocelino, ritinha: ATOS.CASA.ritinha, zezinho: ATOS.CASA.zezinho },
  musica: 'musica_noite_2', falaNoAlto: true,   // (a sala fica na parte de baixo da casa: a fala vai para cima)
  passos: [
    ['camera', ATOS.CASA.camera[0], ATOS.CASA.camera[1]],
    ['fala', null, 'Noite na casa nova. A Rosa estendeu uma esteira no chão da sala, com a panela no meio e os pratos em volta.'],
    ['fala', 'rosa', '@alegre Senta, Jocelino. A primeira janta da família aqui é no chão, igual à nossa primeira noite de casados em Aracaju, que a gente não tinha nem mesa.'],
    ['fala', 'zezinho', '@alegre Comer no chão! Mãe, pode ser sempre assim?'],
    ['fala', 'ritinha', '@alegre O meu quarto tem janela pro quintal, pai! Dá pra ver a mangueira do Tio Juca.'],
    ['som', 'porta'],
    ['aparece', 'juca', ATOS.CASA.jucaPorta[0], ATOS.CASA.jucaPorta[1], 'cima'],
    ...ATOS.CASA.jucaVai.map(([x, y]) => ['anda', 'juca', x, y]),
    ['vira', 'juca', 'rosa'],
    ['fala', 'juca', () => _violaDoJuca() ? ['@alegre Licença! Casa nova sem música não pega. Trouxe a viola de dez cordas.'] : ['@alegre Licença! Casa nova sem música não pega. Desenterrei a minha viola velha do baú.']],
    ['musica', 'pensao_animada_2'],
    ['balao', 'juca', 'nota_musical', 'junto'],
    ['fala', null, 'O Tio Juca toca um forró de Aracaju. O Zezinho dança em volta da panela, e a Ritinha bate palma no ritmo.'],
    ['balao', 'zezinho', 'nota_musical', 'junto'],
    ['balao', 'ritinha', 'coracao'],
    ['vira', 'rosa', 'jocelino'], ['vira', 'jocelino', 'rosa'],
    ['fala', 'rosa', '@emocionada Casa nossa, Jocelino.'],
    ['fala', 'jocelino', '@alegre Casa nossa, Rosa. Tijolo por tijolo.'],
    ['balao', 'rosa', 'coracao'],
    ['fim', {}],
  ],
};

HISTORIAS.ato4_reveillon = {
  prioridade: -1,   // (no empate com a cena de um arco no mesmo dia, o arco vai antes: a virada espera)
  quem: 'rosa', titulo: 'O primeiro Réveillon', clima: 'Anda separando roupa branca para a virada do ano',
  // a última noite do ano 1, na praia, depois da janta (de outro lugar, a Rosa chama: Atos.chamarReveillon). É a cena da festa do dia
  // (o Réveillon é festa: no domingo do Concurso da Rádio, que cai no mesmo dia, ela toca igual)
  gatilho: { mapa: 'praia', hora: [20 * 60, 26 * 60], festa: 'reveillon', se: () => Atos.reveillonHoje() },
  elenco: { rosa: ATOS.PRAIA.rosa, jocelino: ATOS.PRAIA.jocelino, ritinha: ATOS.PRAIA.ritinha, zezinho: ATOS.PRAIA.zezinho, juca: ATOS.PRAIA.juca, ze: ATOS.PRAIA.ze },
  musica: 'musica_noite_3', falaNoAlto: true,
  passos: [
    ['se', () => Atos._quaseMeiaNoite(), 'praia'],
    ['rotulo', 'praia'],
    ['camera', ATOS.PRAIA.camera[0], ATOS.PRAIA.camera[1]],
    ['fala', null, 'A última noite do ano. A Vila Maré inteira desceu para a areia, de roupa branca, para esperar a meia-noite.'],
    ['fala', 'rosa', '@alegre Olha a Vila toda de branco, Jocelino. Em Aracaju a gente pulava sete ondas, lembra?'],
    ['balao', 'ze', 'nota_musical', 'junto'],
    ['fala', 'ze', '@alegre Pandeiro afinado! Ano-novo começa no samba, Jocelino!'],
    ['fala', 'juca', '@alegre E na viola! Hoje ninguém dorme cedo, sobrinho.'],
    ['aparece', 'lourival', ATOS.PRAIA.lourivalMar[0], ATOS.PRAIA.lourivalMar[1], 'cima'],
    ['fala', null, 'Da beira do mar, chega uma canoa. O Seu Lourival encosta na areia e desce com a calça arregaçada.'],
    ...ATOS.PRAIA.lourivalVai.map(([x, y]) => ['anda', 'lourival', x, y]),
    ['vira', 'lourival', 'jocelino'],
    ['fala', 'lourival', '@alegre Cheguei de canoa, compadre. Ano-novo bonito se vê do mar.'],
    ['fala', null, 'Meia-noite! Os rojões do Bar do Orlando sobem por cima do mar.'],
    ['som', 'festa_rojao'],
    ['balao', 'zezinho', 'exclamacao', 'junto'], ['balao', 'ritinha', 'exclamacao', 'junto'],
    ['som', 'noite_comemora_1', -8],
    ['fala', 'zezinho', '@alegre Feliz ano-novo! Pai, são sete ondas ou sete pulos?'],
    ['vira', 'rosa', 'jocelino'], ['vira', 'jocelino', 'rosa'],
    ['fala', 'rosa', '@emocionada Faz um ano, Jocelino.', '@amorosa Um ano que a gente desceu do ônibus com a mala amarrada no barbante. Olha onde a gente está.'],
    ['escolha', 'rosa', '@amorosa E o pedido do ano-novo? Pede baixinho, que é pro mar ouvir.', [
      { t: 'A pensão cheia toda noite', valor: 'pensao', resposta: ['@alegre Cheia até a calçada! Esse pedido eu ajudo a cumprir.'] },
      { t: 'Um dia, uma firma da família', valor: 'firma', resposta: ['@emocionada Firma com o nosso nome... Você sonha alto, seu Jocelino. Eu gosto.'] },
      { t: 'A mãe aqui com a gente', valor: 'mae', resposta: ['@emocionada A Dona Zefa na Vila... Um dia, meu velho. Um dia.'] }],
      { id: 'reveillon_pedido' }],
    ['balao', 'rosa', 'coracao'],
    ['fala', null, 'A família fica na areia até o samba do Zé cansar. Depois sobe para casa, devagar, com os pés molhados.'],
    ['fim', { carta: 'zefa_um_ano', topico: { id: 'reveillon', dias: 5 }, depois: () => { Atos._deitar = true; } }],
  ],
};

HISTORIAS.ato5_predio = {
  prioridade: -1,   // (no empate com a cena de um arco no mesmo dia, o arco vai antes: a virada espera)
  quem: 'santos', titulo: 'O Edifício Maré entregue', clima: 'Anda rondando o Edifício Maré, de prancheta na mão',
  nomes: { santos: 'Seu Moreira' },
  // o prédio entregue, de dia, na Vila (antes do dia da inauguração: depois do final a cena não tem mais sentido)
  // (rodada 1, M1) até o dia da festa (a carta da Prefeitura pode marcar a inauguração no dia seguinte à entrega); M2: sem chuva (o sol)
  gatilho: { mapa: 'vila', hora: [6 * 60, 17 * 60], chuva: false,
    se: () => Atos.viradaPode(5) && typeof Firma !== 'undefined' && Firma.predioEntregue() && !!G.firma && !G.firma.feita && (!G.firma.inauguracaoDia || G.dia < G.firma.inauguracaoDia) },
  elenco: { jocelino: ATOS.PREDIO.jocelino, bira: ATOS.PREDIO.bira },
  musica: 'musica_dia_3', falaNoAlto: true,   // (a calçada do prédio fica na beira de baixo do mapa)
  passos: [
    ['camera', ATOS.PREDIO.camera[0], ATOS.PREDIO.camera[1]],
    ['fala', null, 'O Edifício Maré pronto: quatro andares e a cobertura, com as janelas brilhando no sol. A turma da obra olha lá de baixo.'],
    ['aparece', 'santos', ATOS.PREDIO.moreiraDe[0], ATOS.PREDIO.moreiraDe[1], 'esquerda'],
    ['anda', 'santos', ATOS.PREDIO.moreiraVai[0], ATOS.PREDIO.moreiraVai[1]],
    ['vira', 'jocelino', 'santos'], ['vira', 'bira', 'santos'],
    ['fala', null, 'O Seu Moreira chega de terno, de prancheta debaixo do braço, e olha o prédio de baixo até em cima.'],
    ['se', () => Firma.moreira() === 'rival', 'rival'],
    ['fala', 'santos', '@alegre Prédio entregue, cliente feliz.', '@alegre Você já é maior que a minha firma, rapaz.'],
    ['fala', 'santos', () => G.firma && G.firma.carta ? ['@alegre E pensa no que eu te escrevi, viu?'] : ['@alegre Amanhã te mando um bilhete. Tenho uma ideia pra você.']],
    ['ir', 'bira'],
    ['rotulo', 'rival'],
    ['fala', 'santos', 'Conferi o prumo do terceiro andar. Tá no lugar.', 'Prédio bom. Agora vamos ver se você aguenta ser patrão.'],
    ['some', 'santos'],
    ['balao', 'bira', 'reticencias'],
    ['rotulo', 'bira'],
    ['vira', 'bira', 'jocelino'],
    ['fala', 'bira', () => typeof Historias !== 'undefined' && Historias.viu('bira_8')
      ? ['@alegre Patrão, ouviu essa? A maquete que eu te dei já sabia, rapaz.']
      : ['@alegre Olha o tamanho disso, rapaz. E pensar que você chegou aqui carregando saco de cimento.']],
    ['fim', {}],
  ],
};

// ---------- as velas da Dona Zefa (o final e o Natal) ----------
const _oratorioAqui = () => ATOS.ORATORIO[G.mapaId] || ATOS.ORATORIO[typeof casaDaFamilia === 'function' ? casaDaFamilia() : 'casa_juca_dentro'];
// A cena das velas toca só pelo final (firma.js → Atos.velasDoFinal): o gatilho nunca casa sozinho; o Rever das Lembranças funciona.
HISTORIAS.final_velas = {
  quem: 'zefa', titulo: 'As velas da Dona Zefa', nomes: { zefa: 'Dona Zefa' },
  get gatilho() { return { mapa: [typeof casaDaFamilia === 'function' ? casaDaFamilia() : 'casa_juca_dentro'], se: () => false }; },
  get elenco() { const O = _oratorioAqui(); return { zefa: O.zefa, rosa: O.rosa, jocelino: O.jocelino }; },
  musica: 'musica_noite_3',
  get passos() { return [
    ['camera', 'zefa'],
    ['fala', null, () => [`Tarde da noite, em casa. A Dona Zefa tirou da mala de papelão o oratório de Aracaju e pendurou na parede${G.mapaId === 'casa_familia_dentro' ? ' da sala' : ''}.`]],
    ['vira', 'zefa', _oratorioAqui().olha],
    ['fala', 'zefa', '@alegre Uma velinha pra cada sonho, meu filho. Essa é pela casa.', '@alegre Essa é pela pensão da Rosa. E essa, pela firma.'],
    ['se', () => !!G.firma && G.firma.vela === 'acesa', 'amizade'],
    ['vira', 'zefa', 'jocelino'],
    ['fala', 'zefa', '@alegre E a quarta é pela amizade... Essa eu acendo no Natal, que eu volto.'],
    ['ir', 'fim'],
    ['rotulo', 'amizade'],
    ['vira', 'zefa', 'jocelino'],
    ['fala', 'zefa', '@alegre E a quarta, pela amizade. Nunca vi uma Vila gostar tanto de uma família.'],
    ['rotulo', 'fim'],
    ['fala', 'rosa', '@emocionada A senhora fica um tempo com a gente, Dona Zefa?'],
    ['fala', 'zefa', '@alegre Fico até acabar a cocada, minha filha.'],
    ['fim', {}],
  ]; },
};
HISTORIAS.zefa_natal = {
  quem: 'zefa', titulo: 'O Natal da Dona Zefa', nomes: { zefa: 'Dona Zefa' },
  // a 1ª volta da Zefa: do Natal ao fim do verão, num ano depois da firma; à noite, em casa
  get gatilho() { return { mapa: [typeof casaDaFamilia === 'function' ? casaDaFamilia() : 'casa_juca_dentro'], hora: [18 * 60, 24 * 60], se: () => Atos.natalDaZefa() }; },
  get elenco() { const O = _oratorioAqui(); return { zefa: O.zefa, rosa: O.rosa, jocelino: O.jocelino }; },
  musica: 'musica_noite_2',
  get passos() { return [
    ['camera', 'zefa'],
    ['fala', null, () => [Atos.ehNatal() ? 'Noite de Natal na Vila Maré. A Dona Zefa chegou de Aracaju de manhã, com a lata de cocada de sempre.'
      : 'Fim de ano na Vila Maré. A Dona Zefa chegou de Aracaju para as festas, com a lata de cocada de sempre.']],
    ['vira', 'zefa', _oratorioAqui().olha],
    ['se', () => !G.firma || G.firma.vela === 'acesa', 'trocar'],
    ['fala', 'zefa', '@alegre Prometi, não prometi? A vela da amizade.'],
    ['fala', null, 'A quarta velinha do oratório acende, do lado das outras três.'],
    ['vira', 'zefa', 'jocelino'],
    ['fala', 'zefa', '@alegre Agora tá completo, meu filho: a casa, a pensão, a firma e os amigos.'],
    ['ir', 'fim'],
    ['rotulo', 'trocar'],
    ['fala', 'zefa', '@alegre Vim trocar as velinhas do oratório, que vela de promessa não pode apagar.'],
    ['vira', 'zefa', 'jocelino'],
    ['rotulo', 'fim'],
    ['fala', 'rosa', '@amorosa Fica pro Réveillon, Dona Zefa?'],
    ['fala', 'zefa', '@alegre Fico até o Zezinho acabar com a lata!'],
    ['fim', { topico: { id: 'zefa_natal', dias: 4 }, depois: () => Atos.acendeAmizade() }],
  ]; },
};

// O Réveillon é festa do dia (todo Verão 28): a Vila fala dele, e nenhuma outra cena toca nesse dia (a regra 2 do motor).
if (typeof FESTAS_DO_DIA !== 'undefined') FESTAS_DO_DIA.push(() => Atos.ehReveillon() ? 'reveillon' : null);

// ---------- o mundo muda: o oratório na sala (do final em diante) ----------
AO_MONTAR.push(b => Atos.poeOratorio(b));
AO_ENTRAR_MAPA.push(id => { if (ATOS.ORATORIO[id] && G.mapa) Atos.poeOratorio(G.mapa); });

// ---------- a Caderneta (o que o jogador precisa saber) ----------
if (typeof CADERNETA !== 'undefined') CADERNETA.push(() => {
  const r = [], casa = typeof CasaFamilia !== 'undefined' && CasaFamilia.mudou() ? 'casa_familia' : 'casa_juca';
  if (Atos.reveillonHoje()) r.push({ id: 'hoje_reveillon', aba: 'hoje', texto: 'Hoje é a última noite do ano: depois da janta, a Vila inteira desce para a praia' });
  if (Atos.natalDaZefa()) r.push({ id: 'hoje_zefa_natal', aba: 'hoje', texto: 'A Dona Zefa veio de Aracaju para o Natal: à noite, em casa', alvo: { mapa: 'quintal', objeto: casa }, rotulo: 'A casa da família' });
  if (Atos.temOratorio()) r.push({ id: 'oratorio', aba: 'carreira', texto: G.firma.vela === 'acesa' ? 'O oratório da Dona Zefa, na sala de casa: as quatro velinhas acesas (a casa, a pensão, a firma e a amizade)'
    : 'O oratório da Dona Zefa, na sala de casa: três velinhas acesas; a da amizade, a Zefa acende no Natal', alvo: { mapa: 'quintal', objeto: casa }, rotulo: 'O oratório, na sala de casa' });
  return r;
});

// ---------- depois do fim: a festa da firma na memória da Vila (um mês e um ano depois) ----------
if (typeof TOPICOS_MARCOS !== 'undefined') TOPICOS_MARCOS.push(
  { id: 'firma_um_mes', topico: 'firma_lembra', dias: 7, valor: () => G.firma && G.firma.feita && G.dia >= (G.firma.feitaDia || 0) + ATOS.MEMORIA.mes ? 1 : 0 },
  { id: 'firma_um_ano', topico: 'firma_um_ano', dias: 7, valor: () => G.firma && G.firma.feita && G.dia >= (G.firma.feitaDia || 0) + ATOS.MEMORIA.ano ? 1 : 0 });

// ---------- as falas: os tópicos das viradas, a memória da festa e o ato (uma vez cada) ----------
{
  const T = (quem, topico, fala, se) => { if (typeof _T === 'function') _T(quem, topico, fala, se); else if (CONVERSAS[quem]) CONVERSAS[quem].linhas.push({ quando: Object.assign({ topico }, se ? { se } : {}), fala }); };
  // a casa: a janta no chão (o tópico historia_ato3_casa, que o motor abre por 4 dias)
  T('zelia', 'historia_ato3_casa', ['@alegre Soube que a primeira janta na casa nova foi no chão da sala, com o Juca na viola. Coisa mais bonita, meu filho.']);
  T('ze', 'historia_ato3_casa', ['@alegre Forró na casa nova, é? Da próxima vez me chama, que eu levo o pandeiro.']);
  // o Réveillon (5 dias)
  T('zelia', 'reveillon', ['@alegre Feliz ano-novo, meu filho! Vi vocês na areia, todos de branco. Família bonita.']);
  T('lourival', 'reveillon', ['@alegre Ano-novo visto do mar é outra coisa, compadre. Ano que vem você vem na canoa comigo.']);
  T('bira', 'reveillon', ['Ano novo, obra nova, rapaz. O primeiro a gente aprende; o segundo a gente faz.']);
  T('ze', 'reveillon', ['@alegre Meu pandeiro ainda tá rouco da virada, Jocelino! Que noite!']);
  T('juca', 'reveillon', ['@alegre Um ano de vocês na Vila, sobrinho. Passou ligeiro que nem forró bom.']);
  // a Zefa no Natal (todo ano, 4 dias)
  T('zelia', 'zefa_natal', ['@alegre A Dona Zefa voltou pro Natal! Manda ela passar lá em casa pra um café, que a gente tem muito assunto.']);
  T('juca', 'zefa_natal', ['@alegre A cunhada veio pro Natal! E com a lata de cocada, que eu já vi.']);
  T('lourival', 'zefa_natal', ['A sua mãe veio ver o mar de novo, compadre? Diz pra ela que a canoa tá às ordens.']);
  // a festa da firma, um mês depois (os tópicos de memória)
  T('zelia', 'firma_lembra', ['@alegre Lembra da festa da firma? A Vila nunca comeu tanto, meu filho.']);
  T('ze', 'firma_lembra', ['@alegre Até hoje me pedem o samba da inauguração, Jocelino. Virou hino da Vila!']);
  T('lourival', 'firma_lembra', ['Lembra da festa da firma, compadre? Até o mar ficou quieto pra ouvir o discurso do Orlando.']);
  T('ananias', 'firma_lembra', ['@alegre Lembra da festa da firma? Vendi farinha que dava pra um mês inteiro, freguês.']);
  T('bira', 'firma_lembra', ['A placa da firma ainda tá brilhando, rapaz. Passo na frente toda manhã.']);
  // ... e um ano depois
  T('zelia', 'firma_um_ano', ['@alegre Faz um ano da festa da Construtora Santos, sabia? Parece que foi ontem.']);
  T('juca', 'firma_um_ano', ['@alegre Um ano de escritório na minha sala da frente, sobrinho. E a placa ainda é a coisa mais bonita da rua.']);
  T('ze', 'firma_um_ano', ['@alegre Um ano da festa da firma! Vou cantar o samba de novo, só pra comemorar.']);
  T('tonico', 'firma_um_ano', ['Um ano de Construtora Santos. Ferramenta boa dura; firma boa também.']);
  // o dia do Réveillon (a festa do dia, todo ano)
  const F = (quem, fala) => { if (CONVERSAS[quem]) CONVERSAS[quem].linhas.push({ quando: { festa: 'reveillon' }, fala }); };
  F('zelia', ['@alegre Hoje à noite a Vila inteira desce pra praia, meu filho. Roupa branca, viu? Que é pro ano entrar limpinho.']);
  F('ze', ['@alegre Réveillon na areia, Jocelino! Meu pandeiro já tá separado.']);
  F('lourival', ['Hoje eu vejo a virada do mar, compadre. Passo de canoa pra dar um alô.']);
  F('ananias', ['@alegre Último dia do ano, freguês! Hoje o povo leva fósforo e vela pra praia, que vende mais que farinha.']);
  F('bira', ['Último dia do ano, rapaz. Ano que vem tem mais obra.']);
  // o ato muda a fala (`quando: { ato }`, conversas.js): o ato novo é assunto de uns poucos por 2 semanas (o tópico 'ato_N', aberto
  // quando o marco que o trouxe já não é assunto; cada um comenta uma vez). Ninguém diz "ato": a Vila só sente o TEMPO PASSAR (rodada 1,
  // I4: nada da pensão, da casa, do mestre, do ano novo ou do prédio, que os tópicos de marco já comentam).
  const A = (quem, ato, id, fala) => { if (CONVERSAS[quem]) CONVERSAS[quem].linhas.push({ quando: { topico: 'ato_' + ato, ato }, fala }); };
  A('juca', 2, 'juca_2', ['@alegre Já reparou, sobrinho? A gente nem conta mais os dias desde que vocês chegaram. Agora sim a família fincou o pé na Vila.']);
  A('zelia', 3, 'zelia_3', ['@alegre Parece que vocês moram aqui desde sempre, meu filho. A Vila já fala de vocês como gente daqui.']);
  A('juca', 4, 'juca_4', ['@pensativo O tempo corre na Vila Maré, sobrinho. Quando eu vejo, as crianças já cresceram um palmo.']);
  A('lourival', 5, 'lourival_5', ['Quando você chegou, compadre, mal sabia o caminho da praia. Hoje, quando falam em obra na Vila, falam no seu nome.']);
}
