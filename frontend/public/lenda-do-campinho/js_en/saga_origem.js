/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📜 SAGA "A BOLA DE ORIGEM" (v364, pedido do dono: "quests novas nos níveis altos, que remuneram bem mas levam
   tempo, com historinha... falar com outro NPC em outro planeta, outra galáxia").
   Do nível 420 ao 950, em 9 capítulos: a Dra. Estela acha um mapa estelar; o Grão-Guardião Orbitto conta a lenda
   (o primeiro chute do universo criou as estrelas e partiu a primeira bola em 7 gomos); o craque viaja Lua →
   Marte → Saturno → Nebulosa → Atlântida → Pedraforte → Picos Nublados, junta os gomos, os anões forjam o núcleo,
   os gigantes costuram... e a bola acorda no Estádio do Multiverso.
   Tipos novos de pedido (só desta saga, mas servem para outras):
   - req.fala: 'npc'   → "vá falar com fulano": completa ao conversar com ele (q.chegada = o que ele conta)
   - req.espera: horas → espera em TEMPO REAL depois de aceitar (forja, degelo, costura...); vale com o jogo fechado
   - q.enigma: [...]   → ao chegar no NPC, perguntas sobre a história; errou = volta em 10 min
   Diário: ☰ Mais › 📜 A Bola de Origem (e um botão nas conversas da saga). Prêmio final: Bola de Origem
   (item + adorno que gira em volta do jogador) e a Medalha da Origem.
   Carregar DEPOIS de xp_alto_nivel.js (a XP daqui já vem calibrada), loot_regioes.js e adornos2.js.
   ============================================================ */
{
  const xpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));
  const SG_LUGAR = { estela_estacao: 'Galactic Space Station', guardiao_mv: 'Multiverse Stadium', lider_lua: 'Moon', lider_marte: 'Mars', lider_saturno: 'Saturn',
    lider_nebulosa: 'Orion Nebula', prof_coral: 'Atlantis', rei_barbaferro: 'Kingdom of Stonehold', mestra_bigorna: 'Kingdom of Stonehold', rainha_nimbus: 'Cloudy Peaks', ferreiro_gigante: 'Cloudy Peaks' };
  window.SG_LUGAR = SG_LUGAR;
  const nomeNpc = id => (NPCS[id] && NPCS[id].nome) || id;
  const ondeNpc = id => `${nomeNpc(id)} (${SG_LUGAR[id] || '?'})`;
  const icone = (id, px) => { // cópia do ícone (o do jogo pode ser compartilhado); se a arte ainda está chegando, redesenha quando chegar
    const c = document.createElement('canvas'), pinta = () => { const o = iconeItem(id); c.width = o.width; c.height = o.height; c.getContext('2d').drawImage(o, 0, 0); };
    pinta(); if (px) c.style.cssText = `width:${px}px;height:${px}px`;
    const n = (typeof ICON_ALIAS !== 'undefined' && ICON_ALIAS[id]) || 'i_' + id, sp = spr(n);
    if (sp && !sp.ok && !sp.err) { let t = 0; const iv = setInterval(() => { if (spr(n).ok || ++t > 50) { clearInterval(iv); setTimeout(pinta, 60); } }, 200); }
    return c;
  };

  /* ---------- itens da saga (chave: não vende, não pesa, fica na mochila) ---------- */
  const SG_ITENS = {
    mapa_estelar: ['Stitched Star Map', 'An ancient map of the stars, stitched together like a ball. Found by Dr. Estela in an old satellite.'],
    detector_lunar: ['Moon Detector', 'Beeps near things that glow on the Moon. Made by Commander Luna.'],
    gomo_lua: ['Moon Panel', 'The 1st panel of the Origin Ball: moon rock that glows blue.'],
    gomo_marte: ['Mars Panel', 'The 2nd panel: a warm red stone. The Martian General wore it as a medal.'],
    gomo_saturno: ['Saturn Panel', 'The 3rd panel: an ice crystal with a golden ring around it.'],
    gomo_nebulosa: ['Nebula Panel', 'The 4th panel: star glass with a nebula swirling inside.'],
    gomo_oceano: ['Ocean Panel', 'The 5th panel: pearl and coral. Granny Tuga thought it was a jellyfish.'],
    gomo_montanha: ['Mountain Panel', 'The 6th panel: a stone with golden runes. It was the jewel in the dwarves\' crown.'],
    nucleo_bola: ['Ball Core', 'Six panels forged together by Master Anvil. One is still missing.'],
    gomo_ceu: ['Sky Panel', 'The 7th panel: a cloud with golden edges, kept at the top of the world.'],
    linha_nuvem: ['Spool of Cloud Thread', 'Thread spun by the giants from cloud cotton. Only this can stitch the Origin Ball.'],
    bola_dormindo: ['Origin Ball (asleep)', 'The first ball in the universe, whole again... but asleep. It needs a kick from a true star.'],
    bola_origem: ['⭐ Origin Ball', 'The first ball in the universe, awake. It spins around you (Equipment → ✨ Cosmetics).'],
    medalha_origem: ['Origin Medal', 'For those who rebuilt the first ball in the universe. Very few stars have one.'],
  };
  for (const [id, [nome, desc]] of Object.entries(SG_ITENS)) {
    ITENS[id] = { nome, tipo: 'chave', venda: 0, saga: true, desc: `📜 ${desc}` };
    const n = 'i_saga_' + id; if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
    if (typeof ICON_ALIAS !== 'undefined') ICON_ALIAS[id] = n;
    if (typeof CHAVE_DE_USO !== 'undefined') CHAVE_DE_USO.add(id); // ficam na mochila (os pedidos da saga contam a mochila)
  }

  /* ---------- os capítulos ---------- */
  // cada passo: [id, npc que dá, nível, título, texto (o pedido), pedido, recompensa {k: níveis de XP, o: tostões por nível, it: itens}, fim (fala depois), extras]
  const R = (L, k, o, it) => ({ xp: Math.round(xpNivel(L) * k), ouro: Math.round(L * o * 0.5), itens: it || [] }); // tostões: metade do número escrito (a saga inteira ≈ 1 bilhão)
  // v407 (Raio-X R8): caixa alta só para nome de chefão (palavras de ênfase e nomes de cidade voltaram ao normal)
  const CAP = [
    { n: 0, nome: 'Prologue — The Satellite Map', passos: [
      ['p1', 'estela_estacao', 420, 'The strange signal', 'Ace, I need you! My radar picked up a strange signal coming from an old satellite... and inside it was this: a star map stitched together like a soccer ball! Take it to Grand Guardian Orbitto, at the Multiverse Stadium. He knows the oldest legends.',
        { fala: 'guardiao_mv' }, R(420, 0.4, 20000, [['mapa_estelar', 1]]), null,
        { chegada: 'Orbitto\'s eyes go wide: "Where... where did you find this? Sit down, star. I\'ll tell you the oldest legend of all. At the very beginning, someone took the FIRST KICK in history. The ball flew so hard that the sparks became the stars... and the ball broke into 7 panels, scattered across the worlds. The Origin Ball!"' }],
      ['p2', 'guardiao_mv', 420, 'Worthy of the legend', 'The 7 panels only show themselves to someone with a champion\'s heart. Prove you\'re worthy: beat the Nebula Emperor 3 times. Don\'t worry, he\'s a good loser.',
        { kill: 'ch_imperador_nebular', n: 3 }, R(420, 1.2, 40000, [['elixir_multiverso', 5]]), 'Well done! Look at the map: it\'s glowing over the MOON. That\'s where the first panel is. Talk to Commander Luna.'],
    ] },
    { n: 1, nome: 'Chapter 1 — The Glow on the Moon', passos: [
      ['l1', 'guardiao_mv', 430, 'To the Moon', 'The map points to the Sea of Tranquility. Commander Luna knows every crater there. Go talk to her.',
        { fala: 'lider_lua' }, R(430, 0.3, 20000), null,
        { chegada: 'Commander Luna studies the map: "A panel of the Origin Ball? Here? Hmm... the Moon Bunnies are always collecting shiny things! But to find the panel in all this dust, I\'ll need to build a Moon Detector."' }],
      ['l2', 'lider_lua', 435, 'The Moon Detector', 'The detector runs on super-fine Moon Dust. Bring 60 Moon Dust from Moon hunts (the creatures there drop it).',
        { item: 'lr_lua_1', n: 60, desc: 'Collect 60 Moon Dust (Moon hunts)' }, R(435, 1.5, 50000, [['detector_lunar', 1]]), 'Done! Now it needs to charge with Earthlight.'],
      ['l3', 'lider_lua', 440, 'Charging with Earthlight', 'The Moon Detector needs to face the Earth for 1 hour to charge. Go hunt, train, whatever you like... and come back later.',
        { espera: 1 }, R(440, 0.6, 60000, [['gomo_lua', 1]]), 'BEEP-BEEP-BEEP-BEEEP! We found it! It was under the oldest Bunny\'s burrow. The 1st panel is yours! Now the map is glowing over... MARS.'],
    ] },
    { n: 2, nome: 'Chapter 2 — The General\'s Medal', passos: [
      ['m1', 'lider_lua', 470, 'The next glow', 'The map is pointing to Mars. Engineer Rubi knows everything about it. Take the ship and go talk to her!',
        { fala: 'lider_marte' }, R(470, 0.3, 20000), null,
        { chegada: 'Engineer Rubi laughs out loud: "A warm red panel? Oh, I know where it is! The Martian General wears it on his chest like a medal and says it\'s his lucky charm. He won\'t just hand it over..."' }],
      ['m2', 'lider_marte', 480, 'The lucky charm', 'The General will only give it back if he loses in a way he\'ll never forget. Beat the Martian General 10 times: after the tenth, he\'ll admit the charm isn\'t bringing him any luck at all!',
        { kill: 'ch_general_marciano', n: 10 }, R(480, 1.6, 60000, [['bau_torre', 1]]), '"Okay, okay! This charm is useless!" — the General tossed the panel to you. But it fell into a hole in the Rover Desert...'],
      ['m3', 'lider_marte', 490, 'The rover arm', 'The panel fell into a deep hole. I\'ll rig up a rover arm to grab it, but I need 20 Rover Bolts (Spider Rovers and robots drop them).',
        { item: 'lr_marte_2', n: 20, desc: 'Collect 20 Rover Bolts (Mars hunts)' }, R(490, 1.8, 80000, [['gomo_marte', 1]]), 'Clank, clank... GOT IT! The 2nd panel is yours. Now the map is glowing over the rings of SATURN.'],
    ] },
    { n: 3, nome: 'Chapter 3 — The Ice of the Rings', passos: [
      ['s1', 'lider_marte', 530, 'The crystal rings', 'Saturn! Astronomer Vega lives there, studying the rings. Go talk to her.',
        { fala: 'lider_saturno' }, R(530, 0.3, 20000), null,
        { chegada: 'Astronomer Vega points her telescope: "See that glow inside the ring? That\'s the panel, frozen in a block of ice that never melts. Nothing around here gets that hot... except the Eternal Ember, that fire stone that comes from the chests of the Infinite Tower!"' }],
      ['s2', 'lider_saturno', 540, 'The fire that never goes out', 'Bring 10 Eternal Embers. They come from Tower Chests, the prizes from the Infinite Tower bosses, and Master Altina trades chests for Tokens.',
        { item: 'brasa_eterna', n: 10, desc: 'Collect 10 Eternal Embers (Tower Chests)' }, R(540, 1.8, 90000), 'The embers are all around the ice block. Now we wait...'],
      ['s3', 'lider_saturno', 545, 'Thawing', 'Saturn ring ice melts really slowly: about 3 hours. Go play other stuff and I\'ll keep an eye on it.',
        { espera: 3 }, R(545, 0.8, 90000, [['gomo_saturno', 1]]), 'PLINK! The ice melted and the 3rd panel dropped into my hand. Here you go! Now the map shows the ORION NEBULA.'],
    ] },
    { n: 4, nome: 'Chapter 4 — The Memory of the Stars', passos: [
      ['n1', 'lider_saturno', 590, 'The Guardian of the stars', 'Guardian Orion lives in the Orion Nebula. They say she remembers everything that has ever happened in the universe. Go talk to her.',
        { fala: 'lider_nebulosa' }, R(590, 0.4, 25000), null,
        { chegada: 'Guardian Orion smiles: "The Nebula panel only appears to those who remember their own story. Let\'s see if you paid attention on your journey, star."',
          enigma: [
            { p: 'Who found the Star Map inside an old satellite?', ops: ['Grand Guardian Orbitto', 'Dr. Estela', 'The Martian General'], c: 1 },
            { p: 'How many panels did the Origin Ball break into?', ops: ['5', '7', '11'], c: 1 },
            { p: 'What melted the ice of Saturn\'s rings?', ops: ['Eternal Ember', 'Moon Dust', 'A giant hair dryer'], c: 0 },
          ] }],
      ['n2', 'lider_nebulosa', 600, 'Falling stars', 'You remember everything! The panel is hidden inside a Shooting Star, and those are super rare. Bring 3 Shooting Stars from Nebula hunts and I\'ll find the right one.',
        { item: 'lr_nebulosa_3', n: 3, desc: 'Collect 3 Shooting Stars (Nebula hunts, rare)' }, R(600, 2, 120000, [['gomo_nebulosa', 1], ['foco_multiverso', 5]]), 'This one! Inside it is the 4th panel, swirling like a nebula. Now the map points to the bottom of the sea: ATLANTIS.'],
    ] },
    { n: 5, nome: 'Chapter 5 — Granny Tuga', passos: [
      ['a1', 'lider_nebulosa', 670, 'Back to Earth... way down deep', 'The next panel is under the sea, in Atlantis. Professor Coral studies everything that lives down there. Go talk to him.',
        { fala: 'prof_coral' }, R(670, 0.4, 25000), null,
        { chegada: 'Professor Coral fixes his glasses: "A shiny pearl panel? Uh-oh... Granny Tuga, the oldest turtle in the ocean, swallowed something like that thinking it was a jellyfish! Don\'t worry, she\'s fine. But to get her to let it go, you have to tickle her with Black Pearls."' }],
      ['a2', 'prof_coral', 680, 'Pearl tickles', 'Bring 25 Black Pearls from the Coral Reef. With them I\'ll make a tickle duster no turtle can resist!',
        { item: 'lr_caca_recife_2', n: 25, desc: 'Collect 25 Black Pearls (Coral Reef)' }, R(680, 2, 130000), 'The duster is ready! There\'s just one problem: Granny Tuga is asleep.'],
      ['a3', 'prof_coral', 685, 'Waiting for Granny to wake up', 'A 900-year-old turtle sleeps a lot! She\'ll wake up in about 2 hours. Come back later.',
        { espera: 2 }, R(685, 0.8, 130000, [['gomo_oceano', 1]]), 'Hee-hee-hee... ACHOO! Granny Tuga sneezed out the panel and said sorry for the mix-up. The 5th panel is yours! Now the map is glowing inside a MOUNTAIN: Stonehold, the kingdom of the dwarves.'],
    ] },
    { n: 6, nome: 'Chapter 6 — The Jewel of the Crown', passos: [
      ['d1', 'prof_coral', 750, 'The kingdom inside the mountain', 'Through the Dwarf Portal, in the Multiverse Stadium, you\'ll reach Stonehold. Go talk to King Ironbeard.',
        { fala: 'rei_barbaferro' }, R(750, 0.4, 30000), null,
        { chegada: 'King Ironbeard takes off his crown and shows you the stone in the middle, covered in runes: "THIS panel? It\'s been the jewel of Stonehold\'s crown for a thousand years! But... the legend says one day a star would come for it. If that\'s really you, prove it!"' }],
      ['d2', 'rei_barbaferro', 760, 'Dwarf trial', 'A dwarf only trusts someone who climbs high. Reach floor 50 of the Infinite Tower.',
        { flag: 'torre_50', desc: 'Clear floor 50 of the Infinite Tower' }, R(760, 1.5, 120000), 'Floor 50! Not even my great-grandpa climbed that high. Just one more little thing...'],
      ['d3', 'rei_barbaferro', 765, 'The king\'s museum', 'For the empty spot in the crown, I want 2 Multiverse Trophies (the Tower bosses drop them). A fair trade!',
        { item: 'taca_multiverso', n: 2, desc: 'Collect 2 Multiverse Trophies (Tower bosses)' }, R(765, 1.5, 140000, [['gomo_montanha', 1]]), 'It\'s a deal! The 6th panel is yours. And now Master Anvil can put all six together!'],
      ['d4', 'rei_barbaferro', 770, 'The forge of the six panels', 'Take the six panels to Master Anvil. Only she can forge them together without cracking a single one.',
        { fala: 'mestra_bigorna' }, R(770, 0.3, 30000), null,
        { chegada: 'Master Anvil rolls up her sleeves: "Six panels from six different worlds... this is the job of a lifetime! Leave it to me."' }],
      ['d5', 'mestra_bigorna', 775, 'Forge fire', 'Forging six worlds together takes time: 6 hours in the hottest fire in Stonehold. Come back later!',
        { espera: 6 }, R(775, 1, 160000, [['nucleo_bola', 1]]), 'CLANG! Here it is: the Ball Core. Beautiful, right? But there\'s a hole... the 7th panel is missing. The map points to the sky: the Cloudy Peaks.'],
    ] },
    { n: 7, nome: 'Chapter 7 — The Top of the World', passos: [
      ['c1', 'mestra_bigorna', 840, 'Above the clouds', 'Through the Giant Portal you\'ll reach the Cloudy Peaks. Queen Nimbus is the one in charge there. Go talk to her.',
        { fala: 'rainha_nimbus' }, R(840, 0.4, 30000), null,
        { chegada: 'Queen Nimbus bends down (way, way down) to look at you: "The last panel, little one, is kept where the clouds end: at the top of the Infinite Tower. Only those who make it all the way up can see it."' }],
      ['c2', 'rainha_nimbus', 850, 'Where the clouds end', 'Reach floor 75 of the Infinite Tower. From up there, the 7th panel will appear.',
        { flag: 'torre_75', desc: 'Beat floor 75 of the Infinite Tower' }, R(850, 2, 160000, [['gomo_ceu', 1]]), 'You did it! And look: the panel floated down after you. Now we need to STITCH the ball.'],
      ['c3', 'rainha_nimbus', 855, 'Cloud thread', 'The Origin Ball can only be stitched with cloud thread. Bring 150 Cloud Cotton from the Cloud Fields and Blacksmith Bruno will spin the thread.',
        { item: 'lr_caca_mv_nuvens_1', n: 150, desc: 'Collect 150 Cloud Cotton (Cloud Fields)' }, R(855, 2, 170000, [['linha_nuvem', 1]]), 'What lovely thread! Now take everything to Giant Blacksmith Bruno.'],
      ['c4', 'rainha_nimbus', 860, 'The giant tailor', 'Giant Blacksmith Bruno has the biggest and gentlest hands in the Peaks. Take the core, the 7th panel and the thread to him.',
        { fala: 'ferreiro_gigante' }, R(860, 0.3, 30000), null,
        { chegada: 'Blacksmith Bruno picks up his needle (as big as a lamppost): "Stitching the first ball in the universe! Stitch by stitch, no rush. This is going to take all night, little one."' }],
      ['c5', 'ferreiro_gigante', 865, 'Stitch by stitch', 'Stitching the Origin Ball takes 8 hours. Go sleep, play, study... and come back tomorrow!',
        { espera: 8 }, R(865, 1.2, 200000, [['bola_dormindo', 1]]), 'Done! The Origin Ball, whole again... but it looks like it\'s sleeping. Zzz... Only Grand Guardian Orbitto knows how to wake it up.'],
    ] },
    { n: 8, nome: 'Final Chapter — The First Kick', passos: [
      ['f1', 'ferreiro_gigante', 940, 'The sleeping ball', 'Take the sleeping Origin Ball to Grand Guardian Orbitto, at the Multiverse Stadium.',
        { fala: 'guardiao_mv' }, R(940, 0.4, 40000), null,
        { chegada: 'Orbitto holds the ball in both hands, deeply moved: "It\'s back... But the Origin Ball only wakes up with a kick from a star who beat the greatest challenge in the universe: the Relic Guardian on floor 84 of the Infinite Tower."' }],
      ['f2', 'guardiao_mv', 950, 'The greatest challenge', 'Beat the Relic Guardian on floor 84 of the Infinite Tower. When you come back, the ball will know.',
        { flag: 'guardiao_amuleto_lenda', desc: 'Beat the Guardian on floor 84 of the Infinite Tower' }, R(950, 2, 250000, [['bau_torre', 3]]), 'The ball is trembling... it felt it! Now is the time.'],
      ['f3', 'guardiao_mv', 950, 'The first kick', 'All the worlds are watching. Dr. Estela is at the telescope, with Commander Luna, Rubi, Vega, Orion, Professor Coral, the dwarves and the giants... Kick the Origin Ball and tell Dr. Estela, who started all of this!',
        { fala: 'estela_estacao' }, R(950, 2, 400000, [['bola_origem', 1], ['medalha_origem', 1]]), null,
        { chegada: 'Dr. Estela jumps for joy: "I SAW IT! I SAW IT FROM THE TELESCOPE! You kicked it and the ball woke up: all the stars twinkled at once, in every world! The Origin Ball chose you, star. It will be with you forever."', final: true }],
    ] },
  ];
  window.SAGA_ORIGEM = CAP;
  // o que cada passo GASTA ao ser entregue (os gomos viram núcleo, o núcleo vira bola...)
  const SG_CONSOME = { d5: ['gomo_lua', 'gomo_marte', 'gomo_saturno', 'gomo_nebulosa', 'gomo_oceano', 'gomo_montanha'], c5: ['nucleo_bola', 'gomo_ceu', 'linha_nuvem'], f3: ['bola_dormindo', 'mapa_estelar', 'detector_lunar'] };
  const SG_IDS = new Set();
  let ant = null;
  for (const c of CAP) for (const [id, npc, lvl, titulo, texto, req, rec, fim, ex] of c.passos) {
    const q = Object.assign({ id: 'sg_' + id, npc, lvl, titulo: `📜 ${titulo}`, texto, req, rec, saga: c.n, sagaCap: c.nome }, ex || {});
    if (fim) q.fim = fim;
    if (SG_CONSOME[id]) q.consome = SG_CONSOME[id];
    if (req.fala && !req.desc) req.desc = `Talk to ${ondeNpc(req.fala)}`;
    if (req.espera && !req.desc) req.desc = `Wait ${req.espera} h (real time)`;
    if (req.kill && !req.desc) req.desc = `Beat ${req.n}x ${MONSTROS[req.kill] ? MONSTROS[req.kill].nome : req.kill}`;
    if (ant) q.pre = ant;
    MISSOES.push(q); SG_IDS.add(q.id); ant = q.id;
  }
  const ehSaga = q => q && SG_IDS.has(q.id);
  window.ehSagaOrigem = ehSaga;

  /* ---------- os pedidos novos: fala, espera, enigma ---------- */
  const agora = () => Date.now();
  const _prog = progressoMissao;
  progressoMissao = function (q) {
    const r = q && q.req;
    if (r && (r.fala || r.espera)) { const e = G.save.quests[q.id] || {}; if (r.fala) return [e.p ? 1 : 0, 1]; return [e.ate && agora() >= e.ate ? 1 : 0, 1]; }
    return _prog.apply(this, arguments);
  };
  const fmtFaltaH = ms => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`; };
  const _desc = descMissao;
  descMissao = function (q) {
    const r = q && q.req;
    if (r && r.espera) { const e = G.save && G.save.quests[q.id]; if (e && e.s === 'ativa' && e.ate) return agora() >= e.ate ? `${r.desc}: done!` : `${r.desc} — ${fmtFaltaH(e.ate - agora())} left`; }
    return _desc.apply(this, arguments);
  };
  const _entregaSg = entregaMissao;
  entregaMissao = function (q) {
    const r = _entregaSg.apply(this, arguments);
    if (q && q.consome) for (const id of q.consome) { try { if (contaItem(id)) removeItem(id, contaItem(id)); } catch (e) { } }
    return r;
  };
  const _aceita = aceitaMissao;
  aceitaMissao = function (q) {
    const r = _aceita.apply(this, arguments);
    if (q && q.req && q.req.espera) { const e = G.save.quests[q.id]; if (e) { e.ate = agora() + q.req.espera * 3600000; salvar(); } }
    return r;
  };
  // aviso quando uma espera termina (a cada 20 s)
  setInterval(() => {
    try {
      if (!G.save || !G.rodando) return;
      for (const id of SG_IDS) { const e = G.save.quests[id]; const q = MISSOES.find(x => x.id === id); if (e && e.s === 'ativa' && e.ate && !e.avisou && agora() >= e.ate) { e.avisou = 1; log(`📜 "${q.titulo.replace('📜 ', '')}" is ready! Go back and talk to ${ondeNpc(q.npc)}.`, 'l-xp'); som('nivel'); G.uiSujo = true; } }
    } catch (e) { }
  }, 20000);

  /* ---------- conversas: chegar no NPC certo, enigma e os botões da saga ---------- */
  function concluiFala(npc, q) {
    const e = G.save.quests[q.id]; e.p = 1;
    entregaMissao(q);
    const prox = MISSOES.find(x => ehSaga(x) && x.pre === q.id);
    const ops = el('div', { class: 'opcoes' });
    if (q.final) ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); sgFinal(); } }, '⭐ See the Origin Ball'));
    else ops.append(el('button', { class: 'btn amarelo', onclick: () => abrirNPC(npc) }, prox && prox.npc === npc.id ? 'Continue' : 'OK'));
    ops.append(el('button', { class: 'btn', onclick: modalSaga }, '📜 Saga Journal'));
    abreModal(el('h2', {}, npc.d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, q.chegada || 'Great to see you!'))), ops);
  }
  function enigma(npc, q) {
    const e = G.save.quests[q.id];
    if (e.erroAte && agora() < e.erroAte) {
      return abreModal(el('h2', {}, npc.d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, `"Think a little more about your journey and come back in ${fmtFaltaH(e.erroAte - agora())}."`))),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: modalSaga }, '📜 Reread the saga journal'), el('button', { class: 'btn', onclick: fechaModal }, 'Bye!')));
    }
    let i = 0;
    const pergunta = () => {
      const p = q.enigma[i];
      abreModal(el('h2', {}, `${npc.d.nome} — question ${i + 1} of ${q.enigma.length}`), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, i === 0 ? q.chegada : 'Very good... what\'s next?'), el('p', {}, el('b', {}, p.p)))),
        el('div', { class: 'opcoes' }, ...p.ops.map((o, k) => el('button', { class: 'btn', onclick: () => {
          if (k !== p.c) { e.erroAte = agora() + 10 * 60000; salvar(); som('erro'); return abreModal(el('h2', {}, npc.d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, '"Hmm, that\'s not quite how it went... Reread your journal and come back in 10 minutes."'))), el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: modalSaga }, '📜 Saga Journal'), el('button', { class: 'btn', onclick: fechaModal }, 'OK'))); }
          som('moeda'); i++; if (i < q.enigma.length) pergunta(); else concluiFala(npc, q);
        } }, o))));
    };
    pergunta();
  }
  const _abrir = abrirNPC;
  abrirNPC = function (npc) {
    try {
      if (G.save && npc && npc.d && !npc.d.quadro) {
        const q = MISSOES.find(x => ehSaga(x) && x.req.fala === npc.id && statusMissao(x) === 'ativa');
        if (q) { npc.flip = G.p.x < npc.x; return q.enigma ? enigma(npc, q) : concluiFala(npc, q); }
      }
    } catch (e) { console.warn('saga', e); }
    const r = _abrir.apply(this, arguments);
    // o NPC pode ter outras missões na frente: a da saga ganha um botão próprio
    try {
      const box = document.getElementById('modalConteudo'), ops = box && box.querySelector('.opcoes');
      if (ops && G.save) {
        const q = MISSOES.find(x => ehSaga(x) && x.npc === npc.id && ['disponivel', 'pronta', 'ativa'].includes(statusMissao(x)));
        if (q && !box.textContent.includes(q.titulo)) {
          const st = statusMissao(q); let b = null;
          if (st === 'disponivel') b = el('button', { class: 'btn amarelo', onclick: () => modalMissao(npc, q) }, `Mission: ${q.titulo}`);
          else if (st === 'pronta' && !q.req.fala) b = el('button', { class: 'btn amarelo', onclick: () => { entregaMissao(q); abrirNPCDepois(npc, q.fim); } }, `Turn in: ${q.titulo}`);
          else if (st === 'ativa') { const [a, n] = progressoMissao(q); b = el('button', { class: 'btn', onclick: modalSaga }, `${q.titulo}: ${descMissao(q)}${q.req.espera ? '' : ` — ${a}/${n}`}`); }
          if (b) ops.prepend(b);
        }
        if (MISSOES.some(x => ehSaga(x) && x.npc === npc.id) && G.save.nivel >= 400) ops.insertBefore(el('button', { class: 'btn', onclick: modalSaga }, '📜 Saga Journal'), ops.lastChild);
      }
    } catch (e) { }
    return r;
  };

  /* ---------- diário da saga ---------- */
  function modalSaga() {
    const s = G.save; if (!s) return;
    const st = q => statusMissao(q);
    const blocos = CAP.map(c => {
      const qs = MISSOES.filter(q => ehSaga(q) && q.saga === c.n);
      const feitos = qs.filter(q => st(q) === 'feita').length, atual = qs.find(q => ['disponivel', 'ativa', 'pronta', 'nivel'].includes(st(q)) && (!q.pre || st(MISSOES.find(x => x.id === q.pre)) === 'feita'));
      const ic = feitos === qs.length ? '✅' : feitos || atual ? '📖' : '🔒';
      const hist = [];
      for (const q of qs) {
        if (st(q) !== 'feita') break;
        hist.push(el('p', { class: 'sg-h' }, q.req.fala ? q.chegada : q.texto)); if (q.fim) hist.push(el('p', { class: 'sg-h sg-fim' }, q.fim));
      }
      let agoraTxt = null;
      if (atual) {
        const a = st(atual);
        agoraTxt = a === 'nivel' ? `🔒 Continues at level ${atual.lvl}.` : a === 'disponivel' ? `👉 Talk to ${ondeNpc(atual.npc)} to get: ${atual.titulo.replace('📜 ', '')}.`
          : a === 'pronta' ? `✅ Done! Go back and talk to ${ondeNpc(atual.npc)}.` : `👉 ${descMissao(atual)}${atual.req.fala || atual.req.espera ? '' : ` (${progressoMissao(atual).join('/')})`}.`;
      }
      return el('details', { class: 'sg-cap', open: atual && feitos < qs.length ? 'open' : null }, el('summary', {}, `${ic} ${c.nome} (${feitos}/${qs.length})`), ...hist, agoraTxt ? el('p', { class: 'sg-agora' }, agoraTxt) : '');
    });
    const gomos = ['gomo_lua', 'gomo_marte', 'gomo_saturno', 'gomo_nebulosa', 'gomo_oceano', 'gomo_montanha', 'gomo_ceu'];
    const tem = id => contaItem(id) > 0 || (s.quests.sg_d5 && s.quests.sg_d5.s === 'feita' && gomos.indexOf(id) < 6) || (s.quests.sg_c5 && s.quests.sg_c5.s === 'feita') || !!s.flags.saga_origem; // gomos já forjados/costurados contam
    const linha = el('div', { class: 'sg-gomos' }, ...gomos.map(g => { const c = icone(g); c.className = 'sg-gomo' + (tem(g) ? '' : ' falta'); c.title = ITENS[g].nome; return c; }));
    abreModal(el('h2', {}, '📜 The Origin Ball'), el('p', { class: 'dica' }, s.nivel < 420 ? 'A great adventure across the worlds starts at level 420, with Dr. Estela, at the Galactic Space Station.' : 'The first ball in the universe broke into 7 panels. Collect them all!'),
      linha, ...blocos, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Close')));
  }
  window.modalSaga = modalSaga;
  function sgFinal() {
    G.save.flags.saga_origem = true; salvar();
    try { const c = ADORNOS2.cfg(); c.bola_origem = true; } catch (e) { }
    try { if (typeof ADORNOS2 !== 'undefined') ADORNOS2.festa('fogos_ouro', G.p.x, G.p.y); } catch (e) { }
    banner('⭐ The Origin Ball woke up!', 'It will be with you forever (Equipment → ✨ Cosmetics).'); som('nivel');
    const ic = icone('bola_origem'); ic.style.cssText = 'width:140px;height:140px;display:block;margin:6px auto';
    abreModal(el('h2', {}, '⭐ The Origin Ball'), ic, el('p', {}, 'You rebuilt the first ball in the universe! Now it spins around you, with all 7 panels shining. Turn it on and off in Equipment → ✨ Cosmetics.'),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: fechaModal }, 'So cool!')));
  }

  /* ---------- prêmio final: o adorno que gira em volta do jogador ---------- */
  try {
    if (typeof ADORNOS2 !== 'undefined' && ADORNOS2.OPCOES && ADORNOS2.OPCOES.extra && !ADORNOS2.OPCOES.extra.some(o => o[0] === 'bola_origem'))
      ADORNOS2.OPCOES.extra.push(['bola_origem', 'Origin Ball', '🌟', { ok: () => !!(G.save && G.save.flags && G.save.flags.saga_origem), txt: '🔒 Saga: The Origin Ball' }, 'The first ball in the universe spins around you, with all 7 panels shining.']);
  } catch (e) { }
  const CORES = ['#cfd8e8', '#e8603a', '#7ad0ff', '#a05aff', '#ffd0e0', '#d8a83a', '#ffffff'];
  function bolaLigada() { try { return ADORNOS2.atual('extra').includes('bola_origem'); } catch (e) { return false; } }
  function desenhaBolaOrigem(ctx, e, frente) {
    const t = (G.agora || 0) / 700, sn = Math.sin(t); if ((sn > 0) !== frente) return;
    const cx = e.x * T, cy = e.y * T - T * 0.55, rx = T * 0.62, ry = T * 0.2;
    for (let k = 7; k >= 1; k--) { const a = t - k * 0.13; ctx.globalAlpha = 0.45 * (1 - k / 8); ctx.fillStyle = CORES[k - 1]; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, T * 0.06, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    const x = cx + Math.cos(t) * rx, y = cy + sn * ry + Math.sin(t * 3) * 2, r = T * (frente ? 0.2 : 0.17);
    const g = ctx.createRadialGradient(x, y, 1, x, y, r * 2.2); g.addColorStop(0, 'rgba(255,240,160,0.55)'); g.addColorStop(1, 'rgba(255,240,160,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, 7); ctx.fill();
    const sp = spr('i_saga_bola_origem');
    if (sp && sp.ok) ctx.drawImage(sp.im, x - r, y - r, r * 2, r * 2);
    else { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  }
  const _entSg = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    const liga = e === G.p && G.save && !G.p.morto && !G.fut && !G.jogoC && bolaLigada();
    if (liga) { try { ctx.save(); desenhaBolaOrigem(ctx, e, false); ctx.restore(); } catch (err) { } }
    const r = _entSg.apply(this, arguments);
    if (liga) { try { ctx.save(); desenhaBolaOrigem(ctx, e, true); ctx.restore(); } catch (err) { } }
    return r;
  };

  /* ---------- botão no menu ☰ Mais ---------- */
  (function poeBotaoSaga(t = 0) {
    const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => poeBotaoSaga(t + 1), 500); return; }
    if (document.getElementById('btnSaga')) return;
    const b = el('button', { class: 'btn', id: 'btnSaga', type: 'button', role: 'menuitem' }, '📜 The Origin Ball'); b.onclick = modalSaga;
    lista.append(b);
  })();

  const css = document.createElement('style');
  css.textContent = `
  .sg-cap { border: 1px solid rgba(120,80,40,.25); border-radius: 8px; padding: 6px 10px; margin: 6px 0; background: rgba(255,255,255,.35); }
  .sg-cap summary { cursor: pointer; font-weight: 800; }
  .sg-h { margin: 6px 0; font-size: 13.5px; line-height: 1.4; } .sg-fim { font-style: italic; opacity: .85; }
  .sg-agora { margin: 8px 0 2px; font-weight: 700; color: #7a3a00; }
  .sg-gomos { display: flex; gap: 6px; justify-content: center; margin: 6px 0 10px; flex-wrap: wrap; }
  .sg-gomo { width: 44px; height: 44px; } .sg-gomo.falta { filter: grayscale(1) brightness(.55); opacity: .5; }`;
  document.head.append(css);
}
