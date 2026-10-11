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
  // A obra da J. Moreira (do Mestre Bira): um canteiro com corredores de 2 ladrilhos entre as coisas, para trabalhar
  // andando em volta (a prancheta na entrada, junto da calçada).
  b.interativo('prancheta_obra', 'objetos/prancheta_reforma', 29, 8, 1, 1, [8, 6]).acao = () => abrirPlaca('A prancheta do Mestre Bira com a lista do dia.');
  b.enfeite('objetos/sacos_cimento', 29, 4, true, 26);
  b.interativo('monte_tijolos', 'objetos/monte_tijolos', 32, 8, 2, 1).acao = () => abrirPlaca('Um monte de tijolos da obra.');
  b.interativo('masseira', 'objetos/masseira', 32, 4, 2, 1).acao = () => abrirPlaca('A masseira do Zé.');
  // O terreno da obra é chato (sem telhado para passar atrás): bloqueia a arte toda, para ninguém pisar na cerca de trás.
  const casaZ = b.interativo('casa_zelia', 'objetos/casa_zelia_1', 36, 8, 5, 3, [78, 62]); casaZ.obraId = 'casa_zelia';   // a arte e as ações vêm de obra_jogo.js
  casaZ.acao = () => abrirPlaca('A obra da casa da Dona Zélia. O Mestre Bira toca o serviço.');
  b.interativo('pilha_ripas', 'objetos/pilha_ripas', 37, 3, 1, 1).acao = () => abrirPlaca('Ripas para o telhado.');
  b.enfeite('objetos/carrinho', 40, 3, true, 22);
  b.interativo('peneira', 'objetos/peneira', 43, 8, 2, 1).acao = () => abrirPlaca('A peneira de areia.');
  b.interativo('cacamba', 'objetos/cacamba', 43, 4, 3, 2).acao = () => abrirPlaca('A caçamba de entulho.');
  for (const t of [[46, 3], [46, 6], [46, 9]]) b.enfeite('objetos/bandeirinha', t[0], t[1], false);
  b.morador('bira', 'Mestre Bira', 31, 6, DIR.BAIXO, { vagueia: true, area: { x: 28 * TILE, y: 5 * TILE + 42, w: 14 * TILE, h: 4 * TILE } });   // pelo canteiro
  b.morador('ze', 'Zé', 35, 4, DIR.BAIXO, { vagueia: true, area: { x: 30 * TILE, y: 3 * TILE + 42, w: 12 * TILE, h: 6 * TILE } });
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
  b.interativo('calendario', 'objetos/calendario', 26, 5, 2, 1, [12, 6]).acao = () => abrirPlaca('O calendário da Vila: festas e aniversários.');
  b.interativo('quadro_pedidos', 'objetos/quadro_pedidos', 26, 8, 2, 1, [28, 6]).acao = () => (typeof abrirQuadro === 'function' ? abrirQuadro() : abrirPlaca('O quadro de pedidos dos clientes da Vila.'));
  for (const t of [[21, 21], [30, 17], [44, 17]]) b.enfeite('objetos/coqueiro', t[0], t[1], true, 10);
  for (const t of [[2, 9], [42, 16]]) b.interativo('latao_lixo', 'objetos/latao_lixo', t[0], t[1], 1, 1, [10, 6]).acao = () => abrirPlaca('Um latão de lixo. Nada de útil hoje.');
  b.interativo('roda_samba', 'objetos/roda_samba', 30, 19, 1, 1, [12, 6], false).acao = () => abrirPlaca('Roda de samba da praça. Toda sexta, das 7 da noite às 10 e meia!');
  b.interativo('museu', 'objetos/museu', 2, 22, 6, 4).acao = () => (typeof abrirMuseu === 'function' ? abrirMuseu() : abrirPlaca('O Museu da Vila.'));
  for (const t of [[21, 18], [27, 16], [9, 18], [8, 17], [16, 17]]) b.enfeite('objetos/arbusto_' + (1 + t[0] % 3), t[0], t[1], false);
  // A Pensão da Rosa (a casa da Dona Cotinha), ao lado do depósito, com folga dos dois lados.
  b.pensao = b.interativo('pensao', 'objetos/pensao_fechada', 13, 8, 5, 4);
  b.pensao.acao = () => (typeof pensaoFachada === 'function' ? pensaoFachada() : abrirPlaca('Uma pensão abandonada.'));
  b.interativo('placa_loteamento_vila', 'objetos/placa_loteamento', 44, 16, 1, 1, [10, 6]).acao = () => { abrirPlaca(G.bairro && G.bairro.aberto ? 'Loteamento Bairro Novo: siga a pista de baixo da rua, para o leste.' : 'Em breve: Loteamento Bairro Novo.'); return true; };
  b.paredesDaBorda();
  return b;
};
