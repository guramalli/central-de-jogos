// Jocelino — mapa_vila.js — a rua da Vila Maré (jogo/mundo/mapa_vila.gd): o depósito do Seu Ananias, a ferraria
// do Seu Tonico, a obra da J. Moreira (a do Mestre Bira, que vira o "mergulho" na fase 2), o Mercado, o Museu, a
// Pensão da Rosa (a casa da Dona Cotinha, entre o depósito e a ferraria) e as saídas.

MAPAS_DEF.vila = () => {
  const b = new Construtor('vila', 48, 30, 1976);
  b.livre = { x: 2, y: 2, w: 44, h: 26 };
  b.inicio = { x: 23, y: 3 };
  b.saida(23, 2, 2, 1, 'quintal', 20, 26);
  b.saida(23, 27, 2, 1, 'praia', 22, 3);         // sul: a rua do meio desce até a borda de baixo
  b.saida(2, 12, 1, 3, 'mata', 39, 13);          // oeste: a borda sem árvore
  b.saida(45, 12, 1, 2, 'pedreira', 4, 7);       // leste: a estrada da pedreira
  b.saida(45, 14, 1, 1, 'bairro', 2, 10);        // leste, a pista de baixo da rua principal: a rua do Bairro Novo
  b.pinta(2, 12, 2, 3); b.pinta(44, 12, 2, 3);
  // O padrão da cidade: toda rua com calçada dos dois lados; todo prédio de frente para uma calçada, com 1 ladrilho de recuo.
  b.pinta(23, 0, 2, 10); b.pinta(22, 2, 1, 8, CH.CALCADA); b.pinta(25, 2, 1, 8, CH.CALCADA);   // a rua do quintal (de cima)
  b.pinta(2, 10, 44, 2, CH.CALCADA); b.pinta(2, 12, 44, 3); b.pinta(2, 15, 44, 1, CH.CALCADA);
  b.pinta(23, 16, 2, 14); b.pinta(22, 16, 1, 8, CH.CALCADA); b.pinta(25, 16, 1, 8, CH.CALCADA);   // a rua do meio, até a praia
  b.pinta(2, 24, 44, 1, CH.CALCADA); b.pinta(2, 25, 44, 2); b.pinta(2, 27, 44, 1, CH.CALCADA); b.pinta(23, 25, 2, 5);   // a rua de baixo
  for (let x = 0; x <= b.larg; x += 2) {
    if (x < 22 || x > 25) b.enfeite('objetos/arvore', x, 1, false);
    if (x < 21 || x > 25) { b.enfeite('objetos/arvore', x, b.alt - 1, false); b.enfeite('objetos/arbusto_' + (1 + x % 3), x + 1, b.alt - 2, false); }
  }
  for (let y = 2; y < b.alt - 1; y += 2) { if (y < 11 || y > 15) b.enfeite('objetos/arvore', 0, y, false); if (y < 11 || y > 15) b.enfeite('objetos/arvore', b.larg - 1, y, false); }
  // Depósito do Seu Ananias.
  const dep = b.interativo('deposito', 'objetos/deposito', 4, 8, 6, 5);
  dep.acao = () => (typeof entrarDeposito === 'function' ? entrarDeposito() : abrirPlaca('O depósito do Seu Ananias.'));
  b.enfeite('objetos/monte_tijolos', 3, 8, true, 26);
  b.morador('ananias', 'Seu Ananias', 10, 10, DIR.BAIXO, { vagueia: true, area: { x: 4 * TILE, y: 10 * TILE + 42, w: 8 * TILE, h: 1 * TILE } });   // na calçada do depósito
  // A obra da J. Moreira (do Mestre Bira): o canteiro (o material, a prancheta, o Bira e o Zé) fica na obra da vez e muda
  // com ela (CANTEIROS, aqui embaixo); a casa da Dona Zélia é a primeira.
  // O terreno da obra é chato (sem telhado para passar atrás): bloqueia a arte toda, para ninguém pisar na cerca de trás.
  const casaZ = b.interativo('casa_zelia', 'objetos/casa_zelia_1', 36, 8, 5, 3, [78, 62]); casaZ.obraId = 'casa_zelia';   // a arte e as ações vêm de obra_jogo.js
  casaZ.acao = () => abrirPlaca('A obra da casa da Dona Zélia. O Mestre Bira toca o serviço.');
  const C = poeCanteiro(b, lugarDoCanteiro());
  b.morador('bira', 'Mestre Bira', C.gente.bira[0], C.gente.bira[1], DIR.BAIXO, { vagueia: true, area: areaDePasseio(C.passeio.bira) });   // pelo canteiro
  b.morador('ze', 'Zé', C.gente.ze[0], C.gente.ze[1], DIR.BAIXO, { vagueia: true, area: areaDePasseio(C.passeio.ze) });
  // A rua.
  // O Caramelo, vira-lata da Vila: anda pela rua e pela calçada, mais ligeiro que gente; carinho com o botão direito.
  const dog = b.morador('cachorro', 'Caramelo', 26, 13, DIR.ESQUERDA, { vagueia: true, velPasseio: 95, passeioLongo: true,
    area: { x: 3 * TILE, y: 10 * TILE + 42, w: 41 * TILE, h: 6 * TILE } });
  dog.aoConversar = () => {
    dog._coracao = 1.2; dog._espera = 2; dog._alvo = null; dog.andando = false;
    avisar('Você fez carinho no Caramelo. Ele abanou o rabo todo feliz!');
  };
  b.morador('zelia', 'Dona Zélia', 38, 11, DIR.CIMA, { vagueia: true, area: { x: 30 * TILE, y: 10 * TILE + 42, w: 14 * TILE, h: 1 * TILE } });   // pela calçada
  b.interativo('orelhao', 'objetos/orelhao', 19, 9, 1, 1, [8, 6]).acao = () => (typeof abrirOrelhao === 'function' ? abrirOrelhao() : abrirPlaca('O orelhão da Vila.'));
  b.enfeite('objetos/fusca', 44, 22, true, 44);   // estacionado no canto, ao lado do Mercado
  b.interativo('mercado', 'objetos/mercado_0', 37, 22, 7, 5).acao = () => abrirPlaca('O Mercado Municipal, precisando de reforma.');
  b.interativo('balcao_bazar', 'objetos/balcao_bazar', 42, 23, 3, 1, [40, 10]).acao = () => (typeof abrirBazar === 'function' ? abrirBazar() : abrirPlaca('O Bazar do Seu Salim.'));   // no recuo, na frente do Mercado (fora da calçada)
  b.interativo('quadro_prefeitura', 'objetos/quadro_prefeitura', 28, 22, 2, 1, [28, 6]).acao = () => (typeof abrirPrefeitura === 'function' ? abrirPrefeitura() : abrirPlaca('O quadro da Prefeitura: editais e avisos.'));
  b.interativo('oficina', 'objetos/oficina_sem_fumaca', 10, 22, 6, 5).acao = () => (typeof abrirFerraria === 'function' ? abrirFerraria() : abrirPlaca('A ferraria do Seu Tonico.'));
  b.morador('tonico', 'Seu Tonico', 13, 24, DIR.BAIXO, { vagueia: true, area: { x: 10 * TILE, y: 24 * TILE + 42, w: 6 * TILE, h: 1 * TILE } });   // na calçada da ferraria
  // As placas de serviço juntas, à direita do caminho de quem chega do quintal (como o quadro e o calendário do Pierre).
  // (14/10, Tarefa E1) o calendário da Vila abre a semana da pensão (a mesma lousa do salão; calendario_pensao.js)
  b.interativo('calendario', 'objetos/calendario', 26, 5, 2, 1, [12, 6]).acao = () => (typeof abrirCalendarioPensao === 'function' ? abrirCalendarioPensao() : abrirPlaca('O calendário da Vila: festas e aniversários.'));
  b.interativo('quadro_pedidos', 'objetos/quadro_pedidos', 26, 8, 2, 1, [28, 6]).acao = () => (typeof abrirQuadro === 'function' ? abrirQuadro() : abrirPlaca('O quadro de pedidos dos clientes da Vila.'));
  for (const t of [[20, 4], [30, 17], [44, 17]]) b.enfeite('objetos/coqueiro', t[0], t[1], true, 10);   // (o de 21,21 subiu para a chegada do quintal: ali é o lote do Edifício Maré)
  for (const t of [[2, 9], [42, 16]]) b.interativo('latao_lixo', 'objetos/latao_lixo', t[0], t[1], 1, 1, [10, 6]).acao = () => abrirPlaca('Um latão de lixo. Nada de útil hoje.');
  b.interativo('roda_samba', 'objetos/roda_samba', 30, 19, 1, 1, [12, 6], false).acao = () => abrirPlaca('Roda de samba da praça. Toda sexta, das 7 da noite às 10 e meia!');
  // (15/10, T6) O banco da praça, ao lado da roda de samba (sólido só no pé): quebra no serviço da Dona Zélia (empreitas.js).
  // Abaixo do lote da calçada da roda (Prefeitura) e fora do lugar da carroça do viajante e do canteiro do Mercado.
  b.interativo('banco_praca', 'objetos/banco_praca', 27, 20, 2, 1, [28, 8]).acao = () => abrirPlaca(G.empreitas && G.empreitas.aceitas.banco_praca
    ? 'O banco da praça, com a ripa partida. Com 3 madeiras na mochila, dê 3 golpes de machado nele.' : 'O banco da praça. Na sexta do samba, as senhoras sentam aqui para ver a roda.');
  b.interativo('museu', 'objetos/museu', 2, 22, 6, 4).acao = () => (typeof abrirMuseu === 'function' ? abrirMuseu() : abrirPlaca('O Museu da Vila.'));
  for (const t of [[21, 18], [27, 16], [9, 18], [8, 17], [16, 17]]) b.enfeite('objetos/arbusto_' + (1 + t[0] % 3), t[0], t[1], false);
  // A Pensão da Rosa (a casa da Dona Cotinha), ao lado do depósito, com folga dos dois lados.
  b.pensao = b.interativo('pensao', 'objetos/pensao_fechada', 13, 8, 5, 4);
  b.pensao.acao = () => (typeof pensaoFachada === 'function' ? pensaoFachada() : abrirPlaca('Uma pensão abandonada.'));
  b.interativo('placa_loteamento_vila', 'objetos/placa_loteamento', 44, 16, 1, 1, [10, 6]).acao = () => { abrirPlaca(G.bairro && G.bairro.aberto ? 'Loteamento Bairro Novo: siga a pista de baixo da rua, para o leste.' : 'Em breve: Loteamento Bairro Novo.'); return true; };
  b.paredesDaBorda();
  return b;
};

// ---------- o canteiro da obra da vez ----------
// (15/10, pedido do jogador: "agora que a obra da Dona Zélia acabou, o canteiro de obras deve sair de lá; devemos agora
// colocar ali no mercado") O canteiro segue a obra da vez, como no Stardew: o material da Robin fica no lugar da obra e some
// quando ela acaba. A obra pronta fica limpa (só ela). Em ladrilhos:
//  ret: onde nasce (e conta) o entulho e o mato da lista; fora: ladrilhos do ret onde nada nasce (escondidos atrás da arte
//       alta de um prédio, debaixo da roda de samba);
//  pecas: o pé de cada coisa (a base à esquerda, como em interativo), sempre com 2 ladrilhos de corredor entre elas e até a
//         obra (no Mercado não cabem a caçamba nem o carrinho: o lote ao lado é pequeno);
//  gente: onde cada um começa (o Bira, o Zé, os peões do mestre e o Seu Moreira); passeio: por onde o Bira e o Zé andam.
// As reformas pela Vila (lugar 'mercado') usam o canteiro do Mercado. Nada aqui tapa rua, calçada, porta, saída, os lotes das
// empreitas e da Prefeitura nem o lugar da carroça do viajante (a s2 confere, para cada obra).
const CANTEIROS = {
  casa_zelia: { ret: { x: 29, y: 3, w: 16, h: 6 }, fora: [],
    pecas: { prancheta_obra: [29, 8], sacos_cimento: [29, 4], monte_tijolos: [32, 8], masseira: [32, 4], pilha_ripas: [37, 3], carrinho: [40, 3], peneira: [43, 8], cacamba: [43, 4] },
    bandeirinhas: [[46, 3], [46, 6], [46, 9]],
    gente: { bira: [31, 6], ze: [35, 4], severino: [33, 7], cicero: [38, 4], damiao: [41, 7], santos: [34, 6] },
    passeio: { bira: { x: 28, y: 5, w: 14, h: 4 }, ze: { x: 30, y: 3, w: 12, h: 6 } } },
  // O Mercado (37,22, 7x5): o material em fila na beira da calçada, de frente para a rua, e o pátio de trabalho atrás, no lote
  // entre a praça e o Mercado; a peneira no fundo do pátio e as ripas encostadas na parede do Mercado (o telhado dele é que se
  // reforma). O entulho e o mato também em volta do Mercado (atrás da torre do relógio, não: ela esconde).
  mercado: { ret: { x: 26, y: 16, w: 20, h: 6 }, fora: [{ x: 26, y: 17, w: 5, h: 5 }, { x: 31, y: 18, w: 1, h: 2 }, { x: 39, y: 16, w: 3, h: 2 }],
    pecas: { prancheta_obra: [28, 16], monte_tijolos: [32, 16], masseira: [36, 16], peneira: [32, 19], pilha_ripas: [36, 19] },
    bandeirinhas: [],
    gente: { bira: [34, 18], ze: [35, 17], severino: [32, 18], cicero: [36, 18], damiao: [35, 19], santos: [32, 17] },
    passeio: { bira: { x: 32, y: 17, w: 5, h: 2 }, ze: { x: 32, y: 17, w: 5, h: 3 } } },
  // A Escola (29,8, 6x4, à esquerda da casa da Dona Zélia; a arte sobe até a linha 4): o material em fila atrás dela, na
  // linha 3 (com a linha 2 e a 4 de corredor), as ripas atrás da casa da Zélia e a prancheta na quina da frente, entre a
  // Escola e a cerca da Zélia. O entulho e o mato em volta (fora das placas da chegada, do recuo da Escola e de trás das artes).
  escola: { ret: { x: 26, y: 2, w: 20, h: 8 }, fora: [{ x: 26, y: 5, w: 2, h: 5 }, { x: 29, y: 4, w: 6, h: 1 }, { x: 36, y: 4, w: 5, h: 2 }, { x: 28, y: 9, w: 8, h: 1 }],
    pecas: { monte_tijolos: [29, 3], masseira: [33, 3], peneira: [37, 3], pilha_ripas: [41, 3], prancheta_obra: [35, 9] },
    bandeirinhas: [],
    gente: { bira: [32, 9], ze: [31, 2], severino: [27, 3], cicero: [44, 4], damiao: [43, 8], santos: [34, 9] },
    passeio: { bira: { x: 28, y: 9, w: 7, h: 1 }, ze: { x: 28, y: 2, w: 12, h: 1 } } },
  // O Edifício Maré (17,23, 5x4, na esquina da rua do meio, 1 ladrilho depois da ferraria; a arte, de 8 ladrilhos, sobe até a
  // linha 16, sem cobrir a calçada da rua de cima): o material em fila na beira da calçada de cima, na frente do Museu e da
  // ferraria, e as ripas no vão entre a ferraria e o prédio, na calçada dele. O entulho também no vão e no recuo do Museu.
  predio: { ret: { x: 2, y: 16, w: 20, h: 8 }, fora: [{ x: 17, y: 16, w: 5, h: 4 }, { x: 2, y: 17, w: 6, h: 2 }, { x: 10, y: 17, w: 6, h: 1 }],
    pecas: { masseira: [2, 16], peneira: [6, 16], prancheta_obra: [10, 16], monte_tijolos: [13, 16], pilha_ripas: [16, 23] },
    bandeirinhas: [],
    gente: { bira: [11, 16], ze: [4, 16], severino: [8, 16], cicero: [16, 16], damiao: [16, 20], santos: [12, 16] },
    passeio: { bira: { x: 11, y: 16, w: 2, h: 1 }, ze: { x: 4, y: 16, w: 2, h: 1 } } },
};
// As reformas pela Vila (o Bira toca entre uma obra e outra; o lugar delas é o Mercado): o canteiro do Mercado (a Escola saiu
// de perto da praça em 15/10, o pátio ao lado do Mercado ficou livre de novo).
CANTEIROS.reformas = CANTEIROS.mercado;
// Os lotes da Escola e do Edifício Maré na Vila (x, y da base à esquerda, largura e altura, como em interativo). (15/10) A
// Escola estava em (31,22), em cima do Grêmio (30,23); o prédio em (16,22), encostado na ferraria e com a arte (8 ladrilhos)
// por cima da calçada. A Escola foi para o lote livre à esquerda da casa da Dona Zélia; o prédio encosta na calçada de baixo
// (como o Grêmio), porque entre as duas calçadas só cabem 8 ladrilhos. A s2 confere: nada por baixo, a arte fora da rua e da
// calçada, as portas e saídas alcançáveis.
const LOTES_DAS_OBRAS = { escola: [29, 8, 6, 4], predio: [17, 23, 5, 4] };
// As coisas do canteiro (as artes de sempre): interativas (w x h ladrilhos) ou enfeites sólidos (largura do pé).
const PECAS_CANTEIRO = {
  prancheta_obra: { arte: 'objetos/prancheta_reforma', w: 1, h: 1, colisao: [8, 6], texto: 'A prancheta do Mestre Bira com a lista do dia.' },
  sacos_cimento: { arte: 'objetos/sacos_cimento', pe: 26 },
  monte_tijolos: { arte: 'objetos/monte_tijolos', w: 2, h: 1, texto: 'Um monte de tijolos da obra.' },
  masseira: { arte: 'objetos/masseira', w: 2, h: 1, texto: 'A masseira do Zé.' },
  pilha_ripas: { arte: 'objetos/pilha_ripas', w: 1, h: 1, texto: 'Ripas para o telhado.' },
  carrinho: { arte: 'objetos/carrinho', pe: 22 },
  peneira: { arte: 'objetos/peneira', w: 2, h: 1, texto: 'A peneira de areia.' },
  cacamba: { arte: 'objetos/cacamba', w: 3, h: 2, texto: 'A caçamba de entulho.' },
};
// O lugar do canteiro da vez: o da obra (as reformas têm o delas, no Mercado); antes da obra existir, o da casa da Dona Zélia.
function lugarDoCanteiro() {
  if (typeof Obra === 'undefined' || !G.obra) return 'casa_zelia';
  const o = Obra.obra();
  return CANTEIROS[o.id] ? o.id : CANTEIROS[o.lugar] ? o.lugar : 'mercado';
}
const canteiroDaVez = () => CANTEIROS[lugarDoCanteiro()];
const areaDePasseio = a => ({ x: a.x * TILE, y: a.y * TILE + 42, w: a.w * TILE, h: a.h * TILE });
// Monta (ou muda) o canteiro: tira as coisas do canteiro velho, põe as do lugar novo (o achado ou o mato que estiver por baixo
// sai) e leva para lá quem trabalha nele. Devolve a definição do lugar. (O entulho e o mato: poeEntulhoDaObra, obra_jogo.js.)
function poeCanteiro(b, lugar) {
  const C = CANTEIROS[lugar];
  for (const o of b.objs.filter(o => o.doCanteiro)) b.tirar(o);
  for (const [id, [x, y]] of Object.entries(C.pecas)) {
    const P = PECAS_CANTEIRO[id], w = P.w || 1, h = P.h || 1;
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { const o = b.ocupado.get(chaveT(x + i, y - j)); if (o && (o.tipo === 'detrito' || o.achado)) b.tirar(o); }
    let o;
    if (P.pe) { o = b.enfeite(P.arte, x, y, true, P.pe); if (id === 'carrinho') o.id = 'carrinho_obra'; }   // (o carrinho quebra no serviço do Zé: empreitas.js)
    else {
      o = b.interativo(id, P.arte, x, y, w, h, P.colisao || null);
      o.acao = id === 'prancheta_obra' ? () => (typeof abrirPrancheta === 'function' ? abrirPrancheta() : abrirPlaca(P.texto)) : () => abrirPlaca(P.texto);
    }
    o.doCanteiro = true;
  }
  for (const [x, y] of C.bandeirinhas) b.enfeite('objetos/bandeirinha', x, y, false).doCanteiro = true;
  for (const m of b.moradores) {
    const g = C.gente[m.id]; if (!g) continue;
    Object.assign(m, { x: (g[0] + 0.5) * TILE, y: g[1] * TILE + 42, _alvo: null, andando: false });
    if (C.passeio[m.id]) m.area = areaDePasseio(C.passeio[m.id]);
  }
  b.canteiro = lugar;
  return C;
}
