// Família Santos — firma.js — a firma da família e o final do jogo: a inauguração da Construtora Santos (C20, 17/10; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 9.2 a 9.4 e a decisão 1 da seção 13; os atos, as cenas de
// virada, as velas da Dona Zefa e o depois do fim são da T15: historias/atos.js).
// Como é no Stardew: o fim do 2º ano é a avaliação do avô e a fazenda continua no dia seguinte; o norte de dinheiro é a meta que o
// jogo mostra com o porquê (o Centro Comunitário, o pacote do cofre). Aqui o ofício vira o nome da família numa placa:
// - a CARTA DO MOREIRA chega na manhã seguinte ao Edifício Maré entregue (aliado ou neutro: "eu te passo uns contratos"; rival, se o
//   loteamento acabou firme: "vai precisar de alvará, de capital e de coragem");
// - lida a carta, A META DO CAPITAL (ECO.construtora.capital) é a barrinha sob o relógio (a prioridade: cartao.js, metaDaBarrinha) e a
//   meta do cartão da família; a Rosa mostra a barrinha (a seta no relógio, como na inauguração da pensão);
// - o capital é pago no QUADRO DA PREFEITURA, na Vila (prefeitura.js: abrirPrefeitura pergunta antes dos pedidos de obra);
// - O FINAL vem quando os 4 marcos estão juntos: mestre de obras, o Edifício Maré entregue, a pensão ★★★★★ e o capital pago. O
//   dinheiro antes da 5ª estrela: o alvará fica guardado e a Rosa segura ("abre quando a minha pensão tiver a quinta estrela, que a
//   festa é lá!"). Com os 4, na manhã seguinte chega a carta da Prefeitura: a inauguração é em 3 dias;
// - O DIA DA INAUGURAÇÃO (de manhã, assim que o jogo fica livre): a Dona Zefa chega (a tela da viagem da abertura, de volta), a cena
//   da inauguração (3 camadas: a fachada da casa do Tio Juca com a placa, a Vila e a família cortando a fita), a festa à noite na
//   pensão 5★ (quem tem 4♥ ou mais, o Zé cantando o samba dele, a Zélia, o Lourival e o caderno da Rosa, conforme os arcos), as velas
//   da Zefa no oratório (a cena em casa, atos.js), o retrato de família e os créditos (com o samba do Zé, se ele cantou na pensão). Não
//   tem obra: o dia acaba na festa e a família dorme;
// - DEPOIS DO FIM o jogo continua: a placa "Construtora Santos" fica sobre a porta da casa do Tio Juca (o escritório, na sala da frente)
//   e, na manhã seguinte, a carta do 1º serviço da Construtora Santos (aliado: a 2ª gleba do Bairro Novo; rival: a licitação da escola).
// Nunca arte por código: as cenas usam só as peças prontas (a/cenas, a/abertura, a/objetos); o código posiciona, escala e faz
// transparência. Tudo o que é da primeira vez tem seta e frase no lugar (a carta, a barrinha, o quadro, a placa).

const FIRMA = {
  DIAS_ATE_FESTA: 3,             // a carta da Prefeitura: a inauguração é daqui a 3 dias
  AMIGOS_DA_VELA: 5,             // a vela da amizade: 5 pessoas da Vila com 8♥ ou mais
  CORACOES_DA_VELA: 8,
  PLACA: { dx: 0, base: 334, escala: 0.7 },   // a placa sobre a porta da casa do Tio Juca (px de mundo: o meio da casa, o pé da placa)
};
const _milF = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const _quandoF = dia => { const n = dia - G.dia; return n <= 0 ? 'hoje' : n === 1 ? 'amanhã' : `daqui a ${n} dias`; };

// ---------- o estado (no save): G.firma ----------
// carta: o dia em que a carta do Moreira chegou (0 = ainda não); capitalPago e alvaraDia: o pagamento no quadro; segurou: o capital
// veio antes da ★★★★★ (a Rosa segurou); inauguracaoDia: o dia da festa (marcado pela carta da Prefeitura); feita: o final já foi;
// servico: o dia da carta do 1º serviço; vela e natal: as velas da Zefa (T15, atos.js).
INICIADORES.push(s => {
  const f = s.firma || {};
  G.firma = { carta: f.carta || 0, capitalPago: !!f.capitalPago, alvaraDia: f.alvaraDia || 0, segurou: !!f.segurou,
    inauguracaoDia: f.inauguracaoDia || 0, feita: !!f.feita, feitaDia: f.feitaDia || 0, servico: f.servico || 0,
    vela: f.vela || '', natal: f.natal || 0 };   // (T15) a vela da amizade no oratório da Zefa: 'acesa' | 'apagada'; natal: o dia em que acendeu
  Firma._tocando = false; Firma._festa = false;
});
COLETORES.push(s => { s.firma = Object.assign({}, G.firma || {}); });

const Firma = {
  _tocando: false,   // o final está tocando (a sequência de telas e cenas)
  _festa: false,     // a música da festa (sons.js: momentoMusica)
  capital() { return (typeof ECO !== 'undefined' && ECO.construtora && ECO.construtora.capital) || 110000; },
  // O Moreira, pelo fim do loteamento: 'rival' (a conversa firme) ou 'aliado' (o acordo, e também o loteamento que ainda não
  // aconteceu: a versão neutra é a do aliado, spec 9.2).
  moreira() { return typeof Loteamento !== 'undefined' && G.loteamento && Loteamento.moreira() === 'frio' ? 'rival' : 'aliado'; },
  // Os 4 marcos (spec 9.2.1), só com o que o jogo já mede.
  // (rodada 2) e só com o mestre: o prédio é a obra dele (obra.js: as reformas do pedreiro não passam mais o índice; o guarda fica)
  predioEntregue() { if (!G.obra || typeof OBRAS === 'undefined' || G.obra.funcao < 3) return false; const k = OBRAS.findIndex(o => o.id === 'predio'); return k >= 0 && G.obra.indice > k; },
  marcos() {
    const f = G.firma || {};
    return { mestre: !!G.obra && G.obra.funcao >= 3, predio: Firma.predioEntregue(), estrela: !!G.pensao && G.pensao.grau() >= 6, capital: !!f.capitalPago };
  },
  prontos() { const m = Firma.marcos(); return m.mestre && m.predio && m.estrela && m.capital; },
  // O que ainda falta para a inauguração, em palavras.
  faltas() {
    const m = Firma.marcos(), t = [];
    if (!m.mestre) t.push('ser mestre de obras');
    if (!m.predio) t.push('entregar o Edifício Maré');
    if (!m.capital) t.push(`o capital de Cr$ ${_milF(Firma.capital())}`);
    if (!m.estrela) t.push('a 5ª estrela da pensão (a Rosa quer a festa lá)');
    return t;
  },
  cartaLida() { return !!G.correio && G.correio.lidas.includes('firma_moreira'); },
  // A meta do capital: aberta pela carta lida, até o pagamento.
  metaAberta() { const f = G.firma; return !!f && !!f.carta && !f.capitalPago && Firma.cartaLida(); },
  temCapital() { return Firma.metaAberta() && G.dinheiro >= Firma.capital(); },
  emFesta() { return Firma._festa; },
  // (C20, rodada 1) O dia da festa: o 1º a partir de daqui a 3 dias com a noite livre na pensão (sem VIP, festa do tema, encomenda,
  // Paladar, Concurso nem domingo: Encomendas.noiteLivre). Assim a inauguração não atropela o que já foi avisado; e, marcada, a noite
  // fica protegida (Eventos.marcada, Encomendas.noiteLivre, o planejar do VIP e o do Nhô Quim olham G.firma.inauguracaoDia).
  diaDaFesta(dia = G.dia) {
    const d0 = dia + FIRMA.DIAS_ATE_FESTA;
    if (!G.pensao || typeof Encomendas === 'undefined') return d0;
    for (let k = 0; k < 60; k++) if (Encomendas.noiteLivre(G.pensao, d0 + k)) return d0 + k;
    return d0;
  },
  // A barrinha sob o relógio (cartao.js, metaDaBarrinha): a prioridade desde a carta, até o capital pago. (O "Juntar para" escolhido
  // no Bazar DEPOIS da carta passa na frente até ser comprado — a carta limpa a escolha de antes; C13: a meta não troca sozinha.)
  metaBarrinha() {
    if (!Firma.metaAberta()) return null;
    const C = Firma.capital(), feito = Math.max(0, Math.min(G.dinheiro, C)), de = `${_milF(feito)}/${_milF(C)}`;
    return { tipo: 'firma', curto: `Capital da firma: ${de}`, texto: `Juntando para a Construtora Santos: o capital da firma, Cr$ ${de} (pago no quadro da Prefeitura, na Vila)`, feito, meta: C };
  },
  // O cartão da família (cartao.js, metaFamilia): a firma é a meta da família desde a carta lida.
  metaFamilia() {
    const f = G.firma; if (!f || !f.carta || !Firma.cartaLida()) return null;
    const C = Firma.capital();
    if (f.feita) return { titulo: 'A Construtora Santos', texto: 'A firma da família está aberta: o escritório é na sala da frente da casa do Tio Juca', feito: 1, meta: 1 };
    if (f.inauguracaoDia) return { titulo: 'A firma da família', texto: `A inauguração da Construtora Santos: ${_quandoF(f.inauguracaoDia)}, na casa do Tio Juca`, feito: 1, meta: 1 };
    if (!f.capitalPago) return { titulo: 'A firma da família', texto: `Construtora Santos: o capital de Cr$ ${_milF(C)}, pago no quadro da Prefeitura (na Vila)`, feito: Math.max(0, Math.min(G.dinheiro, C)), meta: C };
    const m = Firma.marcos(), n = [m.mestre, m.predio, m.estrela, m.capital].filter(Boolean).length;
    return { titulo: 'A firma da família', texto: `O alvará está pago e guardado. Para inaugurar, falta ${Firma.faltas().join(' e ')}`, feito: n, meta: 4 };
  },
  // ---------- o quadro da Prefeitura (prefeitura.js chama antes dos pedidos de obra) ----------
  // true = o quadro mostrou o alvará (e o resto vem pela escolha); false = o quadro de sempre.
  noQuadro(pedidos) {
    if (!Firma.metaAberta()) return false;
    const C = Firma.capital(), tem = G.dinheiro >= C;
    const txt = `O alvará da Construtora Santos: a Prefeitura pede o capital da firma, Cr$ ${_milF(C)}, pago aqui. ` +
      (tem ? 'O dinheiro está juntado: é só pagar.' : `Você tem Cr$ ${_milF(Math.max(0, G.dinheiro))}: faltam Cr$ ${_milF(C - Math.max(0, G.dinheiro))} (a barrinha sob o relógio).`);
    const ops = tem ? [`Pagar o capital e o alvará (Cr$ ${_milF(C)})`, 'Os pedidos de obra', 'Agora não'] : ['Os pedidos de obra', 'Agora não'];
    perguntar(txt, ops, i => {
      const o = ops[i];
      if (/^Pagar/.test(o)) Firma.pagar();
      else if (o === 'Os pedidos de obra' && typeof pedidos === 'function') pedidos();
    });
    return true;
  },
  // O pagamento: o capital sai, o alvará fica pago. Com a ★★★★★ já na fachada, a carta da Prefeitura chega amanhã com a data; sem
  // ela, a Rosa segura a festa (spec 9.2.1).
  pagar() {
    const f = G.firma, C = Firma.capital();
    if (!Firma.metaAberta() || G.dinheiro < C) return false;
    G.dinheiro -= C; G.gastoHoje = (G.gastoHoje || 0) + C;
    f.capitalPago = true; f.alvaraDia = G.dia;
    if (G.feitosHoje) G.feitosHoje.push('O capital da Construtora Santos foi pago: o alvará está na mão.');
    if (typeof sons !== 'undefined') { sons.tocar('carimbo', 1, 0.05, -4); sons.tocar('degrau_fanfarra', 1, 0.03, -6); }
    if (typeof hudSujo === 'function') hudSujo();
    const pago = `Alvará pago! O fiscal carimba o papel: "Construtora Santos — Vila Maré". O capital de Cr$ ${_milF(C)} está na conta da firma.`;
    const m = Firma.marcos();
    if (m.estrela && m.mestre && m.predio) abrirPlaca([pago, 'A Prefeitura manda a data da inauguração pela caixa de correio: amanhã chega a carta.'], { quem: 'Prefeitura da Vila Maré' });
    else {
      f.segurou = !m.estrela;
      abrirPlaca([pago, `Para inaugurar, falta ${Firma.faltas().join(' e ')}.`], { quem: 'Prefeitura da Vila Maré',
        depois: () => { if (!m.estrela) abrirConversa('Rosa', urlArte('retratos/rosa_alegre'), ['@alegre Firma nossa, Jocelino! Mas escuta: abre quando a minha pensão tiver a quinta estrela, que a festa é lá!', '@amorosa O alvará fica guardado, sem pressa. Agora é caprichar na janta.']); } });
    }
    return true;
  },
  // ---------- o dia da inauguração ----------
  // Pode começar agora? O dia chegou, o jogo está livre (nenhuma janela, cena, janta ou noite virando).
  hora() {
    const f = G.firma;
    return !!f && !!f.inauguracaoDia && !f.feita && !Firma._tocando && G.dia >= f.inauguracaoDia && !!G.comecou && !!G.mapa
      && !G.turno && !(typeof _dormindo !== 'undefined' && _dormindo) && !(typeof menuAberto === 'function' && menuAberto());
  },
  // A sequência do final (spec 9.2.3): a Zefa chega, a inauguração, a festa, as velas e o retrato, os créditos; depois a noite.
  inaugurar() {
    if (Firma._tocando || !G.firma || G.firma.feita) return false;
    Firma._tocando = true; Firma._festa = true;
    if (typeof MUSICAS !== 'undefined') MUSICAS.festa = ['musica_festa'];
    if (typeof sons !== 'undefined' && sons.musica) sons.musica('musica_festa');
    const passos = [
      fim => Firma.tela(FIRMA_TELA_ZEFA, fim),
      fim => Firma.promessa(fim),
      fim => CenaPrato.tocarEspecial('firma_inauguracao', fim),
      fim => CenaPrato.tocarEspecial('firma_festa', fim),
      // (T15) as velas: a Zefa acende as velinhas no oratório, em casa (a cena no mapa, atos.js); a da amizade fica marcada
      fim => (typeof Atos !== 'undefined' ? Atos.velasDoFinal(fim) : fim()),
      fim => { Firma.musicaDosCreditos(); CenaPrato.tocarEspecial('firma_retrato', fim); },
      fim => Firma.tela(FIRMA_TELA_FIM, fim),
    ];
    let i = 0;
    const prox = () => { if (i < passos.length) passos[i++](prox); else Firma._depois(); };
    prox();
    return true;
  },
  // (T9) A promessa da praia (o R3 da Rosa, a marca `promessa_zefa`; spec 9.2.3, passo 1): com ela, a Rosa recebe a sogra lembrando a
  // promessa, e a Zefa responde. Sem ela (ou na bateria, com TESTE_PULA_CENAS), segue direto. Devolve true se a fala abriu.
  promessa(aoFim) {
    const prometeu = typeof Conversas !== 'undefined' && Conversas.respondeu('promessa_zefa');
    if (!prometeu || window.TESTE_PULA_CENAS || typeof abrirConversa !== 'function') { aoFim(); return false; }
    abrirConversa('Rosa', urlArte('retratos/rosa_normal'), ['@emocionada Dona Zefa! Ele me prometeu, lá na areia da praia, que a senhora vinha.', '@emocionada E a senhora veio!'],
      () => abrirConversa('Dona Zefa', urlArte('retratos/zefa_normal'), ['@alegre E eu ia perder, minha filha? Trouxe cocada pra Vila inteira.'], aoFim));
    return true;
  },
  // (T9) O caderno da Vó Ia no balcão da festa, com a capa que o Jocelino escreveu (o R4 da Rosa; spec 9.2.3, passo 3). '' sem o R4.
  cadernoNaFesta() {
    const capa = typeof RosaArco !== 'undefined' ? RosaArco.capa() : '';
    return capa ? `No balcão, o caderno "${capa}". A Rosa serve para a Dona Zefa a moqueca da página dela.` : '';
  },
  // (T11) O Mestre Bira na inauguração (o fim do B4 do arco dele, historias/bira.js; spec 9.2.3, passo 2): com o B4 visto ("a próxima
  // maquete... deixa que eu sei qual é"), ele dá a maquete do escritório, que vai para a exposição do Grêmio (com o B3) ou fica no
  // escritório; sem o B4, ele só cumprimenta.
  _comMaquete() { return typeof Historias !== 'undefined' && Historias.viu('bira_8'); },
  maqueteDoBira() {
    if (!Firma._comMaquete()) return 'O Mestre Bira: "Do servente da minha obra ao dono da firma. Eu sempre soube, rapaz."';
    return 'O Mestre Bira: "A próxima maquete, eu disse que sabia qual era: o escritório. Pra você não esquecer de onde veio."';
  },
  // (T15) O samba do Zé nos créditos (spec 9.2.3, item 5): com o E4 do arco dele (o Zé cantou na pensão), a música dele no lugar da
  // da festa; a lista da festa muda junto (o rodízio, sons.js, volta a ela quando a cena das velas acaba).
  sambaNosCreditos() { return typeof Historias !== 'undefined' && Historias.viu('ze_8'); },
  musicaDosCreditos() {
    if (!Firma.sambaNosCreditos() || typeof MUSICAS === 'undefined') return '';
    MUSICAS.festa = ['musica_samba_ze'];
    if (typeof sons !== 'undefined' && sons.musica) sons.musica('musica_samba_ze');
    return 'musica_samba_ze';
  },
  // (T15) A festa na pensão (spec 9.2.3, item 3): vem quem tem 4♥ ou mais. Com poucos amigos, o salão fica acolhedor; com muitos,
  // cheio até a calçada. → a frase da festa.
  CONVIDA: 4, CHEIA: 8,
  convidados() {
    if (typeof Amizade === 'undefined' || !G.amizade) return [];
    return Object.keys(G.amizade).filter(id => Amizade.daVila(id) && Amizade.coracoes(id) >= Firma.CONVIDA).sort((a, b) => Amizade.pontos(b) - Amizade.pontos(a) || (a < b ? -1 : 1));
  },
  salaoDaFesta() {
    const ids = Firma.convidados(), n = ids.length;
    const nome = id => typeof Conversas !== 'undefined' ? Conversas.nomeDe({ id }) : Amizade.nome(id);
    const lista = l => l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1];
    if (n >= Firma.CHEIA) return 'A Pensão da Rosa cheia até a calçada: a Vila inteira veio para a festa.';
    if (n > 3) return `O salão cheio de amigos: ${ids.slice(0, 3).map(nome).join(', ')} e mais gente da Vila.`;   // (rodada 1, M5: só vírgulas)
    if (n) return `Um salão acolhedor: ${lista(ids.map(nome))}, a família e a Dona Zefa.`;
    return 'Um salão acolhedor: a família, o Tio Juca e a Dona Zefa, de porta aberta para a Vila.';
  },
  // As frases da 1ª parte da festa, uma depois da outra: o salão, o samba do Zé (com o nome do E3), a mesa da Zélia (Z4), a taça do
  // Lourival e do Seu Bento (L4) e o caderno da Rosa (R4) com a moqueca para a Zefa. Sem os arcos, só o que sempre acontece.
  festaLinhas() {
    const L = [Firma.salaoDaFesta(), (typeof ZeArco !== 'undefined' && ZeArco.naFesta()) || 'O Zé, no banquinho: "Esse samba é pra Família Santos!"'];
    const z = typeof ZeliaArco !== 'undefined' && ZeliaArco.naFesta(); if (z) L.push(z);
    const l = typeof LourivalArco !== 'undefined' && LourivalArco.naFesta(); if (l) L.push(l);
    L.push(Firma.cadernoNaFesta() || 'A Rosa serve a moqueca para a Dona Zefa.');
    return L;
  },
  // O tempo da festa: cada frase da 1ª parte tem FIRMA_FESTA.PASSO s, ou mais pelo tamanho (rodada 1, M6: uma letra a cada 1/LETRAS s);
  // o corte para a reação (a Zefa provando) vem depois da última.
  festaTempo(f) { return Math.max(FIRMA_FESTA.PASSO, String(f).length / FIRMA_FESTA.LETRAS); },
  festaCorte() { return FIRMA_FESTA.INICIO + Firma.festaLinhas().reduce((t, f) => t + Firma.festaTempo(f), 0) + 0.4; },
  // O fim do dia de festa: o final fica marcado e a família dorme (a carta do 1º serviço chega na manhã seguinte: MANHA, abaixo).
  _depois() {
    const f = G.firma;
    f.feita = true; f.feitaDia = G.dia;
    if (!f.vela) f.vela = velaDaAmizade() ? 'acesa' : 'apagada';
    Firma._tocando = false; Firma._festa = false;
    if (typeof MUSICAS !== 'undefined') MUSICAS.festa = ['musica_festa'];
    // (rodada 1, M4) "a Vila inteira" só com o salão cheio até a calçada (Firma.salaoDaFesta)
    if (G.feitosHoje) G.feitosHoje.push(`A inauguração da Construtora Santos: a Dona Zefa veio de Aracaju e ${Firma.convidados().length >= Firma.CHEIA ? 'a Vila inteira foi' : 'os amigos da Vila foram'} à festa na Pensão da Rosa.`);
    if (G.feitosHoje && Firma._comMaquete()) G.feitosHoje.push(Historias.viu('bira_6') ? 'A maquete do escritório, presente do Mestre Bira, foi para a exposição do Grêmio, ao lado da Vila em miniatura.' : 'A maquete do escritório, presente do Mestre Bira, ficou no escritório, na sala da frente da casa do Tio Juca.');
    if (MAPAS.quintal) Firma.poePlaca(MAPAS.quintal);
    G.minutos = Math.max(G.minutos, 23 * 60);
    if (typeof dormir === 'function') dormir();
  },
  // Uma tela da sequência, no lugar da abertura (o mesmo #abertura e o mesmo estilo: a viagem da Zefa é o espelho da chegada da
  // família). { img, titulo, texto, botao }. Com TESTE_PULA_CENAS, passa direto (o resto da bateria).
  tela(t, aoFim) {
    if (window.TESTE_PULA_CENAS) { aoFim(); return; }
    let d = document.getElementById('abertura');
    if (!d) { d = el('div', { id: 'abertura', hidden: true }); document.body.append(d); }
    let feito = false;
    const fim = () => { if (feito) return; feito = true; d.hidden = true; d.innerHTML = ''; d.classList.remove('firma-final'); aoFim(); };
    d.innerHTML = ''; d.classList.add('firma-final');
    const txt = typeof t.texto === 'function' ? t.texto() : t.texto;
    d.append(...[t.img ? el('img', { src: urlArte(t.img), alt: '' }) : null,
      t.titulo ? el('div', { class: 'ab-texto', style: 'font-size:32px;color:#ffd34d' }, t.titulo) : null,
      el('div', { class: 'ab-texto' }, txt),
      el('div', { class: 'ab-botoes' }, el('button', { class: 'botao forte', onclick: fim }, t.botao || 'Continuar'))].filter(Boolean));
    d._avanca = fim; d._pula = fim;
    d.hidden = false;
  },
  // ---------- a placa da Construtora Santos sobre a porta da casa do Tio Juca (o escritório, na sala da frente) ----------
  poePlaca(b) {
    if (!b || b.id !== 'quintal') return;
    const velha = b.objs.find(o => o.id === 'placa_construtora'); if (velha) b.tirar(velha);
    if (!G.firma || !G.firma.feita) return;
    const casa = b.objs.find(o => o.id === 'casa_juca'); if (!casa) return;
    const P = FIRMA.PLACA, px = casa.x + P.dx, py = casa.y - 432 + P.base;   // (a casa nasce com o pé em y = 432: o ladrilho 8)
    const o = b.enfeite('objetos/placa_construtora', Math.floor(px / TILE), Math.floor(casa.y / TILE) - 1, false);
    o.id = 'placa_construtora'; o.px = px; o.py = py;
    o.y = casa.y + 1; o.desenha = ctx => desenhaPe(ctx, 'objetos/placa_construtora', px, py, 1, P.escala);   // (enfeite: o clique vai para a porta)
    return o;
  },
};
AO_MONTAR.push(b => Firma.poePlaca(b));

// ---------- as cartas (de dia 1e9: só chegam pela firma, direto na caixa) ----------
function _naCaixaF(id) { const c = G.correio; if (!c || c.caixa.includes(id) || c.lidas.includes(id)) return; c.caixa.push(id); if (G.feitosHoje && !G.feitosHoje.includes('Chegou carta na caixa de correio.')) G.feitosHoje.push('Chegou carta na caixa de correio.'); }
const FIRMA_CARTAS = { firma_moreira: 'do Seu Moreira', firma_prefeitura: 'da Prefeitura', firma_servico: 'da Construtora Santos' };
CARTAS.firma_moreira = { de: 'Seu Moreira (J. Moreira Construções)', dia: 1e9,
  get texto() {
    const C = _milF(Firma.capital());
    return Firma.moreira() === 'rival'
      ? `Prédio bom. Soube que o senhor quer firma própria. Vai precisar de alvará, de capital e de coragem. A Prefeitura pede Cr$ ${C} de capital, pagos no quadro dela, ao lado do Mercado. — J. Moreira`
      : `Jocelino, prédio entregue, cliente feliz. Já pensou em ter firma sua? Eu te passo uns contratos. Para abrir, a Prefeitura pede o capital da firma, Cr$ ${C}, pago no quadro dela, ao lado do Mercado, e te dá o alvará. — J. Moreira`;
  },
  // lida a carta, a meta: o "Juntar para" de antes sai da frente (a escolha DEPOIS da carta vale), e a Rosa mostra a barrinha
  aoLer: () => { if (G.bazar) G.bazar.meta = ''; if (G.metaBarra) G.metaBarra.melhoria = ''; if (typeof hudSujo === 'function') hudSujo(); },
  depois: () => {
    abrirConversa('Rosa', urlArte('retratos/rosa_emocionada'), ['@emocionada Firma nossa, Jocelino? Construtora Santos... quem diria, o servente do Bira!',
      `@alegre Olha ali, embaixo do relógio: agora tudo o que sobrar junta pro capital, Cr$ ${_milF(Firma.capital())}. Encheu, é pagar no quadro da Prefeitura, do lado do Mercado.`]);
    const c = document.querySelector('#modal .placa'); if (c) c.classList.add('fala-firma-meta');
  } };
CARTAS.firma_prefeitura = { de: 'Prefeitura da Vila Maré', dia: 1e9,
  get texto() {
    const d = G.firma && G.firma.inauguracaoDia, q = d ? _quandoF(d) : 'daqui a 3 dias';
    return `Sr. Jocelino, o alvará da Construtora Santos está aprovado. A inauguração é ${q}, de manhã, na frente do escritório (a sala da frente da casa do Tio Juca). O Prefeito Orlando faz o discurso; a Vila inteira está convidada, e à noite a festa é na Pensão da Rosa. ${Firma.psDoJuca()}`;
  } };
CARTAS.firma_servico = { de: 'Construtora Santos', dia: 1e9,
  get texto() {
    return Firma.moreira() === 'rival'
      ? 'O 1º serviço da Construtora Santos: a licitação da escola nova do Bairro Novo, disputada com a J. Moreira. O Bira já separou a turma, e a Rosa escreveu no caderno da firma: "começar com o pé direito". A vida continua na Vila Maré.'
      : 'O 1º serviço da Construtora Santos: a 2ª gleba do Bairro Novo, passada pelo Seu Moreira com um bilhete: "Cabeça de mestre, rapaz. Agora é tocar a firma." O Bira já separou a turma. A vida continua na Vila Maré.';
  } };

// De manhã: a carta do Moreira (o Edifício Maré entregue), a da Prefeitura (os 4 marcos) e a do 1º serviço (o dia depois da festa).
MANHA.push(() => {
  const f = G.firma; if (!f || !G.correio) return;
  if (!f.carta && Firma.predioEntregue()) { f.carta = G.dia; _naCaixaF('firma_moreira'); }
  // (T10, rodada 1) a carta da Prefeitura espera o J4 do Tio Juca (ele vai buscar a Zefa) no máximo 3 dias, só quando ele pode tocar
  if (!f.inauguracaoDia && !f.feita && Firma.prontos() && !(typeof JucaArco !== 'undefined' && JucaArco.seguraInauguracao())) { f.inauguracaoDia = Firma.diaDaFesta(); _naCaixaF('firma_prefeitura'); }
  if (f.feita && !f.servico) { f.servico = G.dia; _naCaixaF('firma_servico'); }
});
// O dia chegou e o jogo está livre: o final começa.
ATUALIZADORES.push(() => { if (Firma.hora()) Firma.inaugurar(); });

// ---------- o que a tela diz (o Agora, a Caderneta e as setas da primeira vez) ----------
TAREFAS.push(() => {
  const f = G.firma, c = G.correio, r = []; if (!f || !c) return r;
  const id = Object.keys(FIRMA_CARTAS).find(x => c.caixa.includes(x));
  if (id) r.push({ texto: `Chegou carta ${FIRMA_CARTAS[id]}: a caixa de correio, no quintal`, urgente: true });
  if (Firma.temCapital()) r.push({ texto: 'O capital da firma está juntado: pague o alvará no quadro da Prefeitura, na Vila', urgente: true });
  return r;
});
// (o simulador carrega o jogo no Node sem a caderneta: ferramentas_balanco/carrega_jogo.js)
if (typeof CADERNETA !== 'undefined') CADERNETA.push(() => {
  const m = Firma.metaFamilia(), f = G.firma; if (!m) return [];
  const alvo = !f.capitalPago ? { mapa: 'vila', objeto: 'quadro_prefeitura' } : f.feita ? { mapa: 'quintal', objeto: 'casa_juca' } : null;
  return [{ id: 'firma', aba: 'carreira', texto: `${m.titulo}: ${m.texto}${!f.capitalPago ? ` (${_milF(m.feito)}/${_milF(m.meta)})` : ''}`, feito: m.feito, meta: m.meta, alvo,
    rotulo: !f.capitalPago ? 'Botão direito: o alvará da Construtora Santos' : 'A placa da Construtora Santos, na casa do Tio Juca' }];
});
// A seta da primeira vez no mundo (guia_setas.js, guiaSetaMundo): a carta da firma na caixa (cada uma chega uma vez só); o capital
// juntado (o quadro da Prefeitura, até o pagamento). (O oratório da Zefa tem a seta dele, só dentro de casa: Atos.alvoDoOratorio.)
function alvoDaFirma() {
  const f = G.firma, c = G.correio; if (!f || !c) return null;
  const id = Object.keys(FIRMA_CARTAS).find(x => c.caixa.includes(x));
  if (id) return { mapa: 'quintal', objeto: 'caixa_correio', rotuloFixo: `Botão direito: a carta ${FIRMA_CARTAS[id]}` };
  if (Firma.temCapital()) return { mapa: 'vila', objeto: 'quadro_prefeitura', rotuloFixo: 'Botão direito: pagar o alvará da Construtora Santos' };
  return null;
}
// A seta no relógio enquanto a Rosa mostra a meta nova (guia_setas.js, guiaSetaUI; como a da inauguração da pensão): a barrinha.
function setaDaFirma() {
  if (typeof HUD === 'undefined' || !HUD.meta || HUD.meta.hidden || !document.querySelector('#modal .fala-firma-meta')) return null;
  return { chave: 'firma_meta', el: HUD.meta, rotulo: 'A meta nova: o capital da firma', lado: 'esquerda' };
}

// ---------- o final: as telas e as cenas (a arte pronta da T8; o código só posiciona, escala e faz transparência) ----------
// (T10) Quem traz a Zefa (spec 9.2.3, passo 1): com o J4 do Tio Juca (historias/juca.js, `juca_vai_buscar`), ele desce com ela, de
// viola (de ônibus, com a passagem paga, ou no caminhão do Calixto); sem o J4, o Calixto a traz e o Juca a recebe no quintal.
const FIRMA_TELA_ZEFA = { img: 'abertura/viagem', botao: 'Continuar', texto: () => Firma.chegadaDaZefa() };
Firma.chegadaDaZefa = () => {
  const v = typeof JucaArco !== 'undefined' ? JucaArco.viagem() : '', ela = 'Agora quem viaja é ela: a Dona Zefa, a mãe do Jocelino, com uma mala de papelão e uma lata de cocada.';
  if (v === 'onibus') return `Dois dias de ônibus, de Aracaju a Praia Grande. ${ela} Do lado dela desce o Tio Juca, de viola no colo: foi buscar a cunhada, como prometeu, e tocou forró a viagem inteira.`;
  if (v === 'calixto') return `Dois dias de estrada, de Aracaju a Praia Grande, no caminhão do Calixto. ${ela} Da boleia desce o Tio Juca, de viola: foi buscar a cunhada, como prometeu, e o Calixto cantou junto a estrada inteira.`;
  return `Dois dias de ônibus, de Aracaju a Praia Grande. ${ela} O Calixto foi buscá-la na rodoviária de caminhão, e o Tio Juca recebeu a cunhada no quintal, de viola.`;
};
// (T10) O P.S. do Tio Juca na carta da Prefeitura: quem vai buscar a Zefa.
Firma.psDoJuca = () => {
  const v = typeof JucaArco !== 'undefined' ? JucaArco.viagem() : '';
  if (v === 'onibus') return 'P.S. do Tio Juca: "A passagem tá no bolso e a viola tá afinada. Vou buscar a cunhada Zefa em Aracaju."';
  if (v === 'calixto') return 'P.S. do Tio Juca: "O Calixto me leva no caminhão. Vou buscar a cunhada Zefa em Aracaju, de viola e tudo."';
  return 'P.S. do Tio Juca: "Já mandei recado pra Aracaju. A cunhada Zefa vem no caminhão do Calixto."';
};
// (T15) com o pedido do primeiro Réveillon (atos.js), a frase dele: o que o Jocelino pediu na areia aconteceu.
const FIRMA_TELA_FIM = { img: 'cenas/final_retrato_familia', titulo: 'Família Santos — Vila Maré, 1977', botao: 'Continuar',
  texto: () => `De Aracaju a Praia Grande: o servente virou dono de firma, a pensão da Rosa virou Patrimônio da Vila e a Dona Zefa veio para a festa. ${Firma.moreira() === 'rival' ? 'O Seu Moreira veio, cumprimentou seco e, da esquina, tirou o chapéu.' : 'O Seu Moreira trouxe a prancheta velha dele de presente.'} ${typeof Atos !== 'undefined' && Atos.pedidoNoFinal() ? Atos.pedidoNoFinal() + ' ' : ''}A vida continua: amanhã a Construtora Santos abre as portas.` };
// As velas (spec 9.2.3, passo 4): a casa, a pensão e a firma sempre; a da amizade com 5 pessoas da Vila com 8♥ ou mais.
function velaDaAmizade() {
  if (typeof Amizade === 'undefined' || !G.amizade) return false;
  return Object.keys(G.amizade).filter(id => Amizade.daVila(id) && Amizade.coracoes(id) >= FIRMA.CORACOES_DA_VELA).length >= FIRMA.AMIGOS_DA_VELA;
}
// O close da placa: o meio e a largura da placa pintada na fachada da inauguração (no quadro de 1920×1080, sem zoom).
const FIRMA_PLACA_FUNDO = { x: 944, y: 246, l: 450 };
// O banquinho do Zé no salão da festa (o pé, no quadro de 1920×1080) e o ponto do zoom lento.
const FIRMA_BANQUINHO = { x: 950, y: 995, h: 900, zoom: { x: 950, y: 700 } };
// (T15) O tempo da festa: as frases da 1ª parte (Firma.festaLinhas) a cada PASSO s, desde INICIO; a reação da Zefa, ZEFA s depois do corte.
const FIRMA_FESTA = { INICIO: 0.7, PASSO: 2.1, LETRAS: 28, ZEFA: 5.5 };
Object.assign(CENAS_ESPECIAIS, {
  // A inauguração (13,4 s): a fachada da casa do Tio Juca com a fita na porta; a Vila sobe pela frente com o confete (o Prefeito e o
  // Moreira falam); a Vila desce e a família entra cortando a fita (o Juca acena o chapéu, o Caramelo pula); o close da placa.
  firma_inauguracao: { dur: 13.4, legenda: [0.5, 13.1], abafa: false,
    titulo: c => c.t < 9.9 ? 'A inauguração da Construtora Santos' : 'Construtora Santos',
    falas: () => [
      [0.9, 3.0, 'O Prefeito Orlando: "Duas placas na mesma família: a de bronze da pensão e esta!"'],
      [3.0, 5.4, Firma.moreira() === 'rival' ? 'O Seu Moreira, seco: "Parabéns, Santos. Nos vemos na licitação da escola."' : 'O Seu Moreira: "Você tem cabeça de mestre, rapaz. Agora tem firma também."'],
      [5.6, 7.5, 'A Ritinha e o Zezinho cortam a fita com a tesoura de costura da Dona Lurdes!'],
      [7.5, 9.8, 'O Tio Juca: "A sala da frente é de vocês. Foi aqui que vocês chegaram."'],
      [10.2, 13.0, Firma.maqueteDoBira()],
    ],
    artes: ['cenas/inauguracao_fundo', 'cenas/inauguracao_vila', 'cenas/inauguracao_familia', 'cenas/placa_construtora', 'cenas/letreiro_brilho'],
    sons: [[0.6, 'festa_rojao', 1, -6], [1.3, 'noite_comemora_1', 1, -6], [6.95, 'cena_tchan', 1, -4], [7.1, 'fanfarra', 1, -6], [9.95, 'degrau_fanfarra', 1, -4], [10.4, 'festa_rojao', 1.1, -8]],
    desenha(d, t) {
      if (t < 10.1) {
        d.fundo('cenas/inauguracao_fundo', 1 + 0.06 * _eo(_cs(t, 0, 10)), 1, 944, 420);
        // a Vila, da cintura para cima, sobe pela frente (balançando com o confete) e desce para a família passar
        if (t < 6.0) { const sobe = _eo(_cs(t, 0.5, 1.4)), desce = _cs(t, 5.0, 6.0);
          d.peca('cenas/inauguracao_vila', 960, 1120 + (1 - sobe) * 640 + desce * desce * 700, 600, { ancora: 'base', rot: 0.012 * Math.sin(t * 3) }); }
        // a família sobe e, no corte da fita, dá um pulinho com o clarão
        if (t >= 5.3) { const u = _eo(_cs(t, 5.3, 6.1)), pulo = Math.abs(Math.sin(Math.PI * _cs(t, 7.0, 7.5))) * 36;
          d.peca('cenas/inauguracao_familia', 960, 1110 + (1 - u) * 860 - pulo, 800, { ancora: 'base' });
          if (t >= 7.0) d.luz(0.3 * (1 - _cs(t, 7.0, 7.4))); }
      }
      // o close da placa: a fachada aproxima em volta da placa, e a placa grande (a peça nítida) entra exatamente por cima da dela
      // (FIRMA_PLACA_FUNDO), um pouco maior, com um pulso e as faíscas nas pontas
      if (t >= 9.9) {
        const a = _cs(t, 9.9, 10.2), P = FIRMA_PLACA_FUNDO, zoom = 1.5 + 0.06 * _eo(_cs(t, 9.9, 13.4)), u = _cs(t, 9.95, 10.25);
        d.fundo('cenas/inauguracao_fundo', zoom, a, P.x, P.y);
        const h = P.l * zoom * 1.1 * 418 / 1000, cy = P.y - 0.05 * h;
        d.peca('cenas/placa_construtora', P.x, cy, h, { alfa: u, esc: 1 + 0.05 * Math.sin(Math.PI * _cs(t, 10.4, 11.0)) });
        const pontas = [[-0.46, -0.3], [0.47, 0.25], [0.1, -0.42], [-0.3, 0.36], [0.44, -0.32]], w = h * 1000 / 418;
        for (let k = 0; k < pontas.length; k++) { const v = _cs(t, 10.4 + k * 0.4, 11.2 + k * 0.4); if (v <= 0 || v >= 1) continue;
          d.peca('cenas/letreiro_brilho', P.x + pontas[k][0] * w, cy + pontas[k][1] * h, 170 * Math.sin(Math.PI * v), { rot: v * 2.2 * (k % 2 ? -1 : 1), alfa: Math.sin(Math.PI * v) }); }
      }
    } },
  // A festa à noite na Pensão da Rosa ★★★★★ (de 10 a 16 s, conforme os arcos): o salão cheio, o Zé cantando no banquinho com as
  // notas subindo; as frases da festa (Firma.festaLinhas, T15) uma depois da outra; a Rosa e o Jocelino dançando; a Dona Zefa prova a
  // moqueca e fala. O tempo depende de quantas frases a festa tem (o corte, Firma.festaCorte).
  firma_festa: { abafa: false, titulo: 'A festa na Pensão da Rosa ★★★★★',
    get dur() { return Firma.festaCorte() + FIRMA_FESTA.ZEFA; },
    get legenda() { return [0.4, Firma.festaCorte() - 0.4]; },
    falas: () => {
      const L = Firma.festaLinhas(), c = Firma.festaCorte(); let t = FIRMA_FESTA.INICIO;
      return [...L.map(f => { const a = t; t += Firma.festaTempo(f); return [a, t, f]; }),
        [c, c + 2.7, 'A Dona Zefa: "Meu filho, você saiu de Aracaju servente e vai voltar patrão."'],
        [c + 2.7, c + 5.3, '"Mas volta só pra visitar, viu? Que o seu lugar é aqui."']];
    },
    artes: ['cenas/samba_fundo', 'cenas/samba_ze', 'cenas/samba_notas', 'cenas/samba_reacao'],
    get sons() { const c = Firma.festaCorte(); return [[0.4, 'noite_comemora_2', 1, -6], [c - 0.2, 'cena_tchan', 1, -6], [c + 0.1, 'noite_comemora_1', 1, -6]]; },
    desenha(d, t) {
      const c = Firma.festaCorte(), dur = c + FIRMA_FESTA.ZEFA;
      if (t < c) {
        const B = FIRMA_BANQUINHO, zoom = 1 + 0.05 * _eo(_cs(t, 0, c)), z = y => B.zoom.y + (y - B.zoom.y) * zoom;
        d.fundo('cenas/samba_fundo', zoom, 1, B.zoom.x, B.zoom.y);
        // o Zé sobe no banquinho (a peça tem o banquinho dela, por cima do da arte) e balança no samba
        const u = _eo(_cs(t, 0.2, 0.9));
        d.peca('cenas/samba_ze', B.x, z(B.y) + (1 - u) * 900, B.h * zoom, { ancora: 'base', rot: 0.03 * Math.sin(t * 5) * u });
        d.peca('cenas/samba_notas', 960, 470 - 70 * _cs(t, 1, c - 0.1), 820, { alfa: _cs(t, 1.0, 1.6) * (1 - _cs(t, c - 0.7, c)) });
      }
      if (t >= c - 0.3) d.fundo('cenas/samba_reacao', 1.08 - 0.08 * _eo(_cs(t, c - 0.3, dur)), _cs(t, c - 0.3, c), 960, 450);
    } },
  // O retrato de família (11 s): o último quadro, com o título. (T15: as velas viraram a cena em casa, antes dele: atos.js)
  firma_retrato: { dur: 11.0, legenda: [5.0, 10.8], abafa: false, titulo: 'Família Santos — Vila Maré, 1977',
    falas: () => [
      [0.5, 2.7, 'O retrato da família, na frente da placa da Construtora Santos:'],
      [2.7, 4.9, 'a Dona Zefa, o Tio Juca de viola, a Rosa, o Jocelino, a Ritinha, o Zezinho e o Caramelo.'],
    ],
    artes: ['cenas/final_retrato_familia'],
    sons: [[5.0, 'degrau_fanfarra', 1, -6]],
    // (a arte tem a placa encostada em cima: a faixa de cinema a cobria; recuando até 0,84 o retrato fica inteiro entre as faixas,
    // emoldurado de preto, como um quadro na parede)
    desenha(d, t) { d.fundo('cenas/final_retrato_familia', 1.06 - 0.22 * _eo(_cs(t, 0, 9)), 1, 960, 540); } },
});
