// Jocelino — mapa_vila.js — a rua da Vila Maré (jogo/mundo/mapa_vila.gd): o depósito do Seu Ananias, a ferraria
// do Seu Tonico, a obra da J. Santos (a do Mestre Bira, que vira o "mergulho" na fase 2), o Mercado, o Museu, a
// Pensão da Rosa (a casa da Dona Cotinha, entre o depósito e a ferraria) e as saídas.

MAPAS_DEF.vila = () => {
  const b = new Construtor('vila', 48, 26, 1976);
  b.livre = { x: 2, y: 2, w: 44, h: 22 };
  b.inicio = { x: 23, y: 3 };
  b.saida(23, 2, 2, 1, 'quintal', 20, 26);
  b.pinta(23, 2, 2, 8);
  b.pinta(2, 10, 44, 2, CH.CALCADA); b.pinta(2, 12, 44, 3); b.pinta(2, 15, 44, 1, CH.CALCADA);
  b.pinta(23, 16, 2, 8);
  for (let x = 0; x <= b.larg; x += 2) {
    if (x < 22 || x > 25) b.enfeite('objetos/arvore', x, 1, false);
    if (x < 21 || x > 25) { b.enfeite('objetos/arvore', x, b.alt - 1, false); b.enfeite('objetos/arbusto_' + (1 + x % 3), x + 1, b.alt - 2, false); }
  }
  for (let y = 2; y < b.alt - 1; y += 2) { if (y < 11 || y > 15) b.enfeite('objetos/arvore', 0, y, false); b.enfeite('objetos/arvore', b.larg - 1, y, false); }
  // Depósito do Seu Ananias.
  const dep = b.interativo('deposito', 'objetos/deposito', 5, 8, 6, 5);
  dep.acao = () => (typeof entrarDeposito === 'function' ? entrarDeposito() : abrirPlaca('O depósito do Seu Ananias.'));
  b.enfeite('objetos/monte_tijolos', 3, 8, true, 26);
  b.morador('ananias', 'Seu Ananias', 9, 10, DIR.BAIXO);
  // A obra da J. Santos (do Mestre Bira).
  b.interativo('casa_zelia', 'objetos/casa_zelia_1', 31, 8, 5, 3).acao = () => abrirPlaca('A obra da casa da Dona Zélia. O Mestre Bira toca o serviço.');
  b.interativo('monte_tijolos', 'objetos/monte_tijolos', 28, 8, 2, 1).acao = () => abrirPlaca('Um monte de tijolos da obra.');
  b.interativo('pilha_ripas', 'objetos/pilha_ripas', 30, 7, 1, 1).acao = () => abrirPlaca('Ripas para o telhado.');
  b.interativo('masseira', 'objetos/masseira', 28, 5, 2, 1).acao = () => abrirPlaca('A masseira do Zé.');
  b.interativo('peneira', 'objetos/peneira', 37, 8, 2, 1).acao = () => abrirPlaca('A peneira de areia.');
  b.interativo('cacamba', 'objetos/cacamba', 37, 5, 3, 2).acao = () => abrirPlaca('A caçamba de entulho.');
  b.enfeite('objetos/sacos_cimento', 30, 4, true, 26);
  b.enfeite('objetos/carrinho', 39, 9, true, 22);
  for (const t of [[40, 3], [40, 6], [40, 9]]) b.enfeite('objetos/bandeirinha', t[0], t[1], false);
  b.interativo('prancheta_obra', 'objetos/prancheta_reforma', 27, 8, 1, 1, [8, 6]).acao = () => abrirPlaca('A prancheta do Mestre Bira com a lista do dia.');
  b.morador('bira', 'Mestre Bira', 30, 9, DIR.BAIXO);
  b.morador('ze', 'Zé', 34, 9, DIR.CIMA);
  // A rua.
  b.morador('zelia', 'Dona Zélia', 33, 11, DIR.CIMA);
  b.enfeite('objetos/orelhao', 19, 10, true, 8);
  b.enfeite('objetos/fusca', 14, 13, true, 44);
  b.interativo('mercado', 'objetos/mercado_0', 36, 22, 7, 5).acao = () => abrirPlaca('O Mercado Municipal, precisando de reforma.');
  b.interativo('quadro_prefeitura', 'objetos/quadro_prefeitura', 34, 22, 2, 1, [28, 6]).acao = () => abrirPlaca('O quadro da Prefeitura: editais e avisos.');
  b.interativo('oficina', 'objetos/oficina', 16, 8, 6, 5).acao = () => abrirPlaca('A ferraria do Seu Tonico. "Ferramenta boa é meio caminho andado."');
  b.morador('tonico', 'Seu Tonico', 22, 9, DIR.BAIXO);
  b.interativo('quadro_pedidos', 'objetos/quadro_pedidos', 13, 9, 2, 1, [28, 6]).acao = () => abrirPlaca('O quadro de pedidos dos clientes da Vila.');
  b.interativo('calendario', 'objetos/calendario', 11, 9, 1, 1, [12, 6]).acao = () => abrirPlaca('O calendário da Vila: festas e aniversários.');
  for (const t of [[3, 17], [25, 22], [44, 4]]) b.enfeite('objetos/coqueiro', t[0], t[1], true, 10);
  for (const t of [[15, 9], [42, 15]]) b.interativo('latao_lixo', 'objetos/latao_lixo', t[0], t[1], 1, 1, [10, 6]).acao = () => abrirPlaca('Um latão de lixo. Nada de útil hoje.');
  b.interativo('roda_samba', 'objetos/roda_samba', 36, 17, 1, 1, [12, 6], false).acao = () => abrirPlaca('Roda de samba da praça. Toda sexta, das 7 da noite às 10 e meia!');
  b.interativo('museu', 'objetos/museu', 10, 22, 6, 4).acao = () => abrirPlaca('O Museu da Vila.');
  for (const t of [[22, 17], [31, 17], [3, 21]]) b.enfeite('objetos/arbusto_' + (1 + t[0] % 3), t[0], t[1], false);
  // A Pensão da Rosa (a casa da Dona Cotinha), entre o depósito e a ferraria.
  b.pensao = b.interativo('pensao', 'objetos/pensao_fechada', 11, 7, 5, 4);
  b.pensao.acao = () => (typeof pensaoFachada === 'function' ? pensaoFachada() : abrirPlaca('Uma pensão abandonada.'));
  b.paredesDaBorda();
  return b;
};
