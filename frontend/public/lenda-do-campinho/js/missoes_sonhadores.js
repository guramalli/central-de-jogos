/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   💭 MISSÕES DOS SONHADORES (v366, dono: "missões para os 6 NPCs que só conversam").
   Lia (Vila), Seu Jonas e Nina (Praia), Guto (Cidade), Carla (CT) e Pedrinho (Estádio) sonham com lugares do mundo.
   Cada um ganha 3 missões que acompanham o jogador: a 1ª no próprio bairro; as outras chegam quando você já pode ir
   ao lugar dos sonhos dele — e o pedido é trazer uma LEMBRANÇA de lá (um achado da região, do loot_regioes.js).
   Carregar DEPOIS de brasil_vivo.js, vila_nova.js e loot_regioes.js.
   ============================================================ */
{
  const xpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));
  const R = (L, k, ouro, itens) => ({ xp: Math.round(xpNivel(L) * k), ouro: ouro != null ? ouro : L * 220, itens: itens || [] });
  const it = (reg, t, n, nome, onde) => ({ item: `lr_${reg}_${t}`, n, desc: `Junte ${n}x ${nome} (${onde})` });
  // [npc, id, nível, título, texto, pedido, recompensa, fala de depois]
  // v407 (Raio-X R8): caixa alta só para nome de chefão (palavras de ênfase e nomes de cidade voltaram ao normal)
  const LISTA = [
    ['lia', 'sn_lia1', 3, '💭 O álbum de lembranças', 'Eu vou guardar uma lembrança de cada lugar do mundo! Mas preciso começar por aqui mesmo... Me traz 5 Tampinhas de Garrafa? Os adversários da Vila vivem derrubando.', it('vila', 1, 5, 'Tampinhas de Garrafa', 'Vila'), R(3, 1, 150, [['pacotinho', 1]]), 'Primeira lembrança colada! Um dia esse álbum vai ter o mundo inteiro.'],
    ['lia', 'sn_lia2', 8, '💭 O cartão-postal', 'A Dona Zuleide, da Agência de Turismo, tem cartão-postal de todas as cidades. Vai lá e pergunta qual é o lugar mais bonito do mundo pra ela?', { fala: 'agente_turismo', desc: 'Pergunte à Dona Zuleide, da Agência de Turismo, qual é o lugar mais bonito do mundo' }, R(8, 0.8, 300), null,
      { chegada: 'Dona Zuleide sorri: "O mais bonito? Ah, depende do dia! Mas as pirâmides do Cairo, ao pôr do sol, são de perder o fôlego. Diga à Lia que um dia ela vai ver com os próprios olhos!"', voltaA: 'lia' }],
    ['lia', 'sn_lia3', 55, '💭 Areia das pirâmides', 'Você já foi pro Cairo?! Me traz um Saquinho de Areia Dourada de lá? Vai ser a página mais bonita do meu álbum!', it('cairo', 1, 1, 'Saquinho de Areia Dourada', 'Cairo'), R(55, 1, 55 * 300, [['pacotinho', 2]]), 'Areia das pirâmides! Quando eu crescer, vou jogar bola lá... igual a você!'],
    ['seu_jonas', 'sn_jonas1', 12, '💭 O ninho das tartarugas', 'As tartarugas botaram ovos aqui na areia! Preciso cercar o ninho pra ninguém pisar. Me traz 6 Conchinhas Coloridas pra marcar o lugar?', it('praia', 1, 6, 'Conchinhas Coloridas', 'Praia'), R(12, 1, 400), 'Ninho cercado! Daqui a uns dias os filhotinhos correm pro mar.'],
    ['seu_jonas', 'sn_jonas2', 52, '💭 A escrita dos faraós', 'Atravessando esse mar todinho a gente chega no Egito. Se você for pro Cairo, me traz um Papiro Antigo? Quero ver como os faraós escreviam!', it('cairo', 2, 1, 'Papiro Antigo', 'Cairo'), R(52, 1.1, 52 * 300), 'Desenhinhos no lugar das letras! Os egípcios escreviam assim há mais de 4 mil anos.'],
    ['seu_jonas', 'sn_jonas3', 102, '💭 A terra dos navegadores', 'Dizem que de Lisboa saíam os navegadores que cruzaram o oceano. Me traz 2 Azulejos Portugueses de lá? Vou enfeitar a minha jangada!', it('lisboa', 1, 2, 'Azulejos Portugueses', 'Lisboa'), R(102, 1.1, 102 * 300, [['pacotinho', 2]]), 'Jangada com azulejo português! Agora ela tem um pedacinho do outro lado do mar.'],
    ['nina_surf', 'sn_nina1', 15, '💭 A prancha enfeitada', 'Quero enfeitar a minha prancha com estrelas-do-mar (as que caem dos adversários, as de verdade ficam no mar!). Me traz 3?', it('praia', 2, 3, 'Estrelas-do-Mar', 'Praia'), R(15, 1, 500), 'Ficou linda! Agora eu pego até onda grande.'],
    ['nina_surf', 'sn_nina2', 88, '💭 Surfe em Miami', 'MIAMI tem torre de salva-vidas colorida igual à nossa! Se você for pra lá, me traz uma Prancha de Surfe Mini? É pra eu treinar em casa, hehe.', it('miami', 2, 1, 'Prancha de Surfe Mini', 'Miami'), R(88, 1.1, 88 * 300), 'Uma prancha de Miami! Vou colocar na estante, do lado da minha medalha de futevôlei.'],
    ['nina_surf', 'sn_nina3', 122, '💭 Roda de samba na areia', 'No Rio tem a praia de Copacabana, com calçadão de ondinhas! Me traz 3 Pandeirinhos de lá? Vou fazer uma roda de samba aqui na praia!', it('rio', 1, 3, 'Pandeirinhos', 'Rio de Janeiro'), R(122, 1.1, 122 * 300, [['pacotinho', 2]]), 'Tum-tum-tá! Agora a praia tem samba e futevôlei. Valeu, craque!'],
    ['guto', 'sn_guto1', 22, '💭 O campeonato de fliperama', 'Vai ter campeonato de fliperama na Cidade e eu tô sem ficha! Me traz 6 Fichas de Fliperama? Os adversários daqui vivem derrubando.', it('cidade', 1, 6, 'Fichas de Fliperama', 'Cidade'), R(22, 1, 700), 'Fichas na mão! Se eu ganhar, divido o prêmio com você.'],
    ['guto', 'sn_guto2', 64, '💭 O gato de Tóquio', 'Meu sonho é ver as ruas de neon de Tóquio. Lá tem um gatinho que dá sorte, o maneki-neko! Me traz um Gato da Sorte de lá?', it('toquio', 2, 1, 'Gato da Sorte', 'Tóquio'), R(64, 1.1, 64 * 300), 'Ele mexe a patinha! Agora eu acerto todas as manobras de skate.'],
    ['guto', 'sn_guto3', 148, '💭 Skate em Paris', 'Em Paris tem uma torre de ferro de mais de 300 metros! E os pintores usam boina. Me traz uma Boina de Pintor de lá? Vou andar de skate de boina, todo chique!', it('paris', 2, 1, 'Boina de Pintor', 'Paris'), R(148, 1.1, 148 * 300, [['pacotinho', 2]]), 'Oh là là! Skatista francês do Brasil. Obrigado, craque!'],
    ['olheira_carla', 'sn_carla1', 38, '💭 As anotações perdidas', 'Ventou e as minhas pranchetas de anotações voaram pelo CT! Os adversários daqui pegaram tudo. Me traz 2 Pranchetas Rabiscadas?', it('ct', 2, 2, 'Pranchetas Rabiscadas', 'Centro de Treinamento'), R(38, 1, 1200), 'Achei o talento que eu estava anotando... é você! Hehe.'],
    ['olheira_carla', 'sn_carla2', 160, '💭 O relatório de Munique', 'Estou fazendo um relatório pros clubes da Europa. Em Munique a torcida canta de chapéu tirolês! Me traz um Chapéu Tirolês de lá, pro meu relatório ficar completo?', it('munique', 2, 1, 'Chapéu Tirolês', 'Munique'), R(160, 1.1, 160 * 300), 'Relatório de Munique pronto! Os clubes alemães vão querer saber de você.'],
    ['olheira_carla', 'sn_carla3', 176, '💭 Talento em Madri', 'Os clubes de Madri pediram para ver você jogar! Leve 2 Leques Flamencos de lá pra eu mandar de presente pros diretores, é tradição!', it('madri', 1, 2, 'Leques Flamencos', 'Madri'), R(176, 1.1, 176 * 300, [['pacotinho', 2]]), 'Os diretores adoraram! Você agora é conhecido(a) em toda a Europa.'],
    ['pedrinho_torcedor', 'sn_pedro1', 48, '💭 A coleção de ingressos', 'Eu guardo ingresso de todos os jogos! Os adversários do estádio vivem derrubando os amassados. Me traz 8 Ingressos Amassados?', it('estadio', 1, 8, 'Ingressos Amassados', 'Estádio'), R(48, 1, 1500), 'Minha coleção tá ficando gigante! Um dia vou ter o ingresso do seu jogo de despedida.'],
    ['pedrinho_torcedor', 'sn_pedro2', 112, '💭 A torcida que pula', 'Em Buenos Aires a torcida pula o jogo inteiro, e depois dança tango! Me traz um Sapato de Tango de lá?', it('buenos', 2, 1, 'Sapato de Tango', 'Buenos Aires'), R(112, 1.1, 112 * 300), 'Um sapato de tango! Vou dançar na arquibancada no próximo gol.'],
    ['pedrinho_torcedor', 'sn_pedro3', 190, '💭 Chuva em Londres', 'Dizem que em Londres chove em todo jogo e a torcida nem liga! Me traz um Guarda-chuva Listrado de lá? Vou levar pro estádio!', it('londres', 2, 1, 'Guarda-chuva Listrado', 'Londres'), R(190, 1.1, 190 * 300, [['pacotinho', 2]]), 'Agora pode chover à vontade! Você é o maior craque que eu já vi... e eu vi muitos!'],
  ];
  const ant = {};
  for (const [npc, id, lvl, titulo, texto, req, rec, fim, ex] of LISTA) {
    if (!NPCS[npc]) continue;
    const q = Object.assign({ id, npc, lvl, titulo, texto, req, rec }, ex ? { chegada: ex.chegada } : {});
    if (fim) q.fim = fim;
    if (ant[npc]) q.pre = ant[npc];
    MISSOES.push(q); ant[npc] = id;
  }
  // v407 (Raio-X): a agente de turismo agora é a Dona Zuleide (era Dona Glória). "vá falar com" (sn_lia2): chega na Dona Zuleide e a missão fica pronta; a entrega é com a própria Lia
  {
    const _abSn = abrirNPC;
    abrirNPC = function (npc) {
      try {
        if (G.save && npc && npc.id === 'agente_turismo') {
          const q = MISSOES.find(x => x.id === 'sn_lia2'), e = G.save.quests.sn_lia2;
          if (q && e && e.s === 'ativa' && !e.p) {
            e.p = 1; salvar(); G.uiSujo = true;
            return abreModal(el('h2', {}, npc.d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, q.chegada))),
              el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); log('💭 Volte e conte para a Lia o que a Dona Zuleide disse!', 'l-xp'); } }, 'Vou contar para a Lia!'), el('button', { class: 'btn', onclick: () => _abSn.call(this, npc) }, 'Ver a agência')));
          }
        }
      } catch (err) { }
      return _abSn.apply(this, arguments);
    };
  }
}
