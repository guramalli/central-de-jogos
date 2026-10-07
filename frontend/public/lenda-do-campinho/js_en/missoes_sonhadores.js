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
  const it = (reg, t, n, nome, onde) => ({ item: `lr_${reg}_${t}`, n, desc: `Collect ${n}x ${nome} (${onde})` });
  // [npc, id, nível, título, texto, pedido, recompensa, fala de depois]
  // v407 (Raio-X R8): caixa alta só para nome de chefão (palavras de ênfase e nomes de cidade voltaram ao normal)
  const LISTA = [
    ['lia', 'sn_lia1', 3, '💭 The memory album', 'I\'m going to keep a memento from every place in the world! But I need to start right here... Can you bring me 5 Bottle Caps? The Village opponents are always dropping them.', it('vila', 1, 5, 'Bottle Caps', 'Village'), R(3, 1, 150, [['pacotinho', 1]]), 'First memento stuck in! Someday this album will have the whole world.'],
    ['lia', 'sn_lia2', 8, '💭 The postcard', 'Dona Zuleide, from the Travel Agency, has postcards from every city. Can you go ask her what she thinks is the most beautiful place in the world?', { fala: 'agente_turismo', desc: 'Ask Dona Zuleide, from the Travel Agency, what the most beautiful place in the world is' }, R(8, 0.8, 300), null,
      { chegada: 'Dona Zuleide smiles: "The most beautiful? Oh, it depends on the day! But the pyramids near Cairo at sunset are breathtaking. Tell Lia that one day she’ll see them with her own eyes!"', voltaA: 'lia' }],
    ['lia', 'sn_lia3', 55, '💭 Pyramid sand', 'You’ve been to Cairo?! Can you bring me a Pouch of Golden Sand from there? It’ll be the prettiest page in my album!', it('cairo', 1, 1, 'Pouch of Golden Sand', 'Cairo'), R(55, 1, 55 * 300, [['pacotinho', 2]]), 'Sand from the pyramids! When I grow up, I\'m going to play ball there... just like you!'],
    ['seu_jonas', 'sn_jonas1', 12, '💭 The turtle nest', 'The turtles laid eggs here in the sand! I need to fence off the nest so nobody steps on it. Can you bring me 6 Colorful Seashells to mark the spot?', it('praia', 1, 6, 'Colorful Seashells', 'Beach'), R(12, 1, 400), 'Nest fenced off! In a few days the baby turtles will run to the sea.'],
    ['seu_jonas', 'sn_jonas2', 52, '💭 The pharaohs\' writing', 'If you cross this whole sea, you get to Egypt. If you go to Cairo, can you bring me an Ancient Papyrus? I want to see how the pharaohs wrote!', it('cairo', 2, 1, 'Ancient Papyrus', 'Cairo'), R(52, 1.1, 52 * 300), 'Little drawings instead of letters! The Egyptians wrote like this more than 4 thousand years ago.'],
    ['seu_jonas', 'sn_jonas3', 102, '💭 The land of the explorers', 'They say the explorers who crossed the ocean set sail from Lisbon. Can you bring me 2 Portuguese Tiles from there? I’ll decorate my raft!', it('lisboa', 1, 2, 'Portuguese Tiles', 'Lisbon'), R(102, 1.1, 102 * 300, [['pacotinho', 2]]), 'A raft with Portuguese tiles! Now it has a little piece of the other side of the sea.'],
    ['nina_surf', 'sn_nina1', 15, '💭 The decorated surfboard', 'I want to decorate my surfboard with starfish (the ones opponents drop, the real ones stay in the sea!). Can you bring me 3?', it('praia', 2, 3, 'Starfish', 'Beach'), R(15, 1, 500), 'It looks great! Now I can even catch big waves.'],
    ['nina_surf', 'sn_nina2', 88, '💭 Surfing in Miami', 'MIAMI has colorful lifeguard towers just like ours! If you go there, can you bring me a Mini Surfboard? It\'s so I can practice at home, hehe.', it('miami', 2, 1, 'Mini Surfboard', 'Miami'), R(88, 1.1, 88 * 300), 'A surfboard from Miami! I\'ll put it on my shelf, right next to my footvolley medal.'],
    ['nina_surf', 'sn_nina3', 122, '💭 Samba circle on the sand', 'In Rio there’s Copacabana Beach, with its wavy sidewalk! Can you bring me 3 Little Tambourines from there? I’ll start a samba circle here on the beach!', it('rio', 1, 3, 'Little Tambourines', 'Rio de Janeiro'), R(122, 1.1, 122 * 300, [['pacotinho', 2]]), 'Boom-boom-tah! Now the beach has samba and footvolley. Thanks, star!'],
    ['guto', 'sn_guto1', 22, '💭 The arcade tournament', 'There\'s an arcade tournament in the City and I\'m out of tokens! Can you bring me 6 Arcade Tokens? The opponents around here keep dropping them.', it('cidade', 1, 6, 'Arcade Tokens', 'City'), R(22, 1, 700), 'Tokens in hand! If I win, I\'ll share the prize with you.'],
    ['guto', 'sn_guto2', 64, '💭 The cat from Tokyo', 'My dream is to see the neon streets of Tokyo. They have a little cat that brings good luck, the maneki-neko! Can you bring me a Lucky Cat from there?', it('toquio', 2, 1, 'Lucky Cat', 'Tokyo'), R(64, 1.1, 64 * 300), 'It waves its little paw! Now I\'ll land every skateboard trick.'],
    ['guto', 'sn_guto3', 148, '💭 Skating in Paris', 'In Paris there’s an iron tower over 300 meters tall! And painters wear berets. Can you bring me a Painter’s Beret from there? I’ll skate in a beret, super fancy!', it('paris', 2, 1, 'Painter\'s Beret', 'Paris'), R(148, 1.1, 148 * 300, [['pacotinho', 2]]), 'Oh là là! A French skater from Brazil. Thanks, star!'],
    ['olheira_carla', 'sn_carla1', 38, '💭 The lost notes', 'The wind blew my note clipboards all over the Training Center! The opponents here grabbed everything. Can you bring me 2 Scribbled Clipboards?', it('ct', 2, 2, 'Scribbled Clipboards', 'Training Center'), R(38, 1, 1200), 'I found the talent I was writing about... it\'s you! Hehe.'],
    ['olheira_carla', 'sn_carla2', 160, '💭 The Munich report', 'I’m writing a report for the clubs in Europe. In Munich the fans sing in Tyrolean hats! Can you bring me a Tyrolean Hat from there, so my report is complete?', it('munique', 2, 1, 'Tyrolean Hat', 'Munich'), R(160, 1.1, 160 * 300), 'Munich report done! The German clubs are going to want to know about you.'],
    ['olheira_carla', 'sn_carla3', 176, '💭 Talent in Madrid', 'The clubs in Madrid asked to see you play! Bring 2 Flamenco Fans from there so I can send them as gifts to the directors. It’s tradition!', it('madri', 1, 2, 'Flamenco Fans', 'Madrid'), R(176, 1.1, 176 * 300, [['pacotinho', 2]]), 'The directors loved them! Now you\'re famous all over Europe.'],
    ['pedrinho_torcedor', 'sn_pedro1', 48, '💭 The ticket collection', 'I keep a ticket from every game! The stadium opponents keep dropping crumpled ones. Can you bring me 8 Crumpled Tickets?', it('estadio', 1, 8, 'Crumpled Tickets', 'Stadium'), R(48, 1, 1500), 'My collection is getting huge! One day I’ll have a ticket to your farewell game.'],
    ['pedrinho_torcedor', 'sn_pedro2', 112, '💭 The jumping fans', 'In Buenos Aires the fans jump the whole game, and then they dance the tango! Can you bring me a Tango Shoe from there?', it('buenos', 2, 1, 'Tango Shoe', 'Buenos Aires'), R(112, 1.1, 112 * 300), 'A tango shoe! I\'ll dance in the stands at the next goal.'],
    ['pedrinho_torcedor', 'sn_pedro3', 190, '💭 Rain in London', 'They say in London it rains every game and the fans don’t even care! Can you bring me a Striped Umbrella from there? I’ll take it to the stadium!', it('londres', 2, 1, 'Striped Umbrella', 'London'), R(190, 1.1, 190 * 300, [['pacotinho', 2]]), 'Now it can rain all it wants! You\'re the greatest star I\'ve ever seen... and I\'ve seen a lot!'],
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
              el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); log('💭 Go back and tell Lia what Dona Zuleide said!', 'l-xp'); } }, 'I\'ll tell Lia!'), el('button', { class: 'btn', onclick: () => _abSn.call(this, npc) }, 'See the agency')));
          }
        }
      } catch (err) { }
      return _abSn.apply(this, arguments);
    };
  }
}
