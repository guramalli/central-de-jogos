/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ✨ O FIO DA BOLA DE ORIGEM — v408 (Raio-X I5, aprovado pelo dono) — prefixo ofi
   A história principal acabava perto da metade dos níveis e, entre o 196 e o 560, virava só caça; a saga
   "A Bola de Origem" (saga_origem.js) só começava no 420. Agora o mistério é plantado no nível 5 e segue o jogador:
   - Vila (nível 5): a Mãe vê sete pontinhos brilhando na bola de capotão; o Seu Zé conta a lenda (+ capítulo curto
     "O começo do mistério").
   - Mundo e Europa: pistas no Cairo (desenho da tumba) e em Lisboa (mapa do navegador → Atlântida).
   - Atlântida (206–280): 4 missões de HISTÓRIA (estátua de Netuno, pirâmide com enigma, a Vovó Tuga, mapa do recife).
   - Espaço (303–392): 2 missões de HISTÓRIA por planeta (pedra azul da Lua, rádio do rover, gelo de Saturno, recado para
     a Dra. Estela, enigma da Guardiã Órion, o caminho no céu).
   - Multiverso (403–412): a joia do Rei Barbaferro brilha e a Dra. Estela liga o radar → saga do 420 (que continua igual).
   - Capítulos curtos: "O começo do mistério", "O Vale Jurássico" (Capítulo 12) e "A Bola de Origem" (fim da saga).
   - Diário da saga (☰ Menu › 📜 A Bola de Origem) mostra as pistas desde o começo.
   Nada aqui bloqueia o caminho de antes (nenhuma missão antiga depende destas). Quem já passou da região ganha a pista
   como lembrança (vai para o diário, sem prêmio) e a seta não manda ninguém de volta para trás.
   Usa os pedidos req.fala / q.enigma da saga (progressoMissao já entende req.fala). Carregar DEPOIS de saga_origem.js,
   jurassico.js, como_chegar.js e missoes_raiox.js (MRX: principal, "Saiba mais").
   ============================================================ */
{
  const ofiXpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));
  // prêmio no padrão da faixa: k = quanto de um nível de XP; tostões fixos (do 400 em diante, a régua do balanço v407)
  const R = (L, k, ouro, itens) => {
    let o = ouro;
    try { if (L >= 400 && typeof bzRenda === 'function' && typeof bzRedondo === 'function') o = Math.min(o, bzRedondo(bzRenda(L) * 150)); } catch (e) { }
    return { xp: Math.round(ofiXpNivel(L) * k), ouro: o, itens: itens || [] };
  };

  /* ---------- as missões do fio ---------- */
  // reg: região no diário · passou: nível em que o jogador já foi embora da região (ganha a pista como lembrança)
  const OFI = [
    // 🏡 Brasil — a marca na bola
    { id: 'of_vila1', reg: 'br', passou: 50, npc: 'mae', lvl: 5, pre: 'q_penaltis', titulo: '✨ The mark on the ball',
      texto: 'Sweetie, look at your leather ball! At night, seven little dots glow on the leather, like stars. Show it to Seu Zé, at the little pitch: he’s known this ball for a long time.',
      mais: 'The ball had been kept in the backyard chest since before you were born. Nobody had ever seen it glow like this.',
      req: { fala: 'ze', desc: 'Show the ball to Seu Zé (at the little pitch)' }, rec: R(5, 0.6, 30),
      chegada: 'Seu Zé gets serious: "When I was a kid, a star fell behind the little pitch. The next day, this ball was in the bushes, with these seven little dots. Take good care of it!"',
      chegadaMais: 'My grandpa used to tell a legend: the first ball in the universe broke into seven pieces, scattered across the worlds. One day, a true star will bring them all together. Could it be you?' },
    // 🌍 Mundo e Europa
    { id: 'of_cairo', reg: 'mundo', passou: 124, npc: 'lider_cairo', lvl: 54, titulo: '✨ The tomb drawing',
      texto: 'Dr. Nadia found a strange drawing in the Sphinx Tomb: a ball with seven little dots, just like yours! Go talk to her inside.',
      req: { fala: 'guia_caca_tumba', desc: 'Talk to Dr. Nadia (Sphinx Tomb, in Cairo)' }, rec: R(54, 0.5, 3000),
      chegada: 'Dr. Nadia points to the wall: "Look! A player kicks a ball, the ball flies up, turns into stars... and breaks into seven pieces. This drawing is more than 4,000 years old!"',
      chegadaMais: 'The ancient Egyptians knew the legend too. If your ball has the same seven little dots, it must be a map. But a map of what?' },
    { id: 'of_lisboa', reg: 'mundo', passou: 196, npc: 'lider_lisboa', lvl: 128, titulo: '✨ The navigator’s map',
      texto: 'Captain Leonor keeps a map from the old navigators with seven stars drawn on it. She’s in the Caravel’s Hold. Go see!',
      req: { fala: 'guia_caca_caravela', desc: 'Talk to Captain Leonor (Caravel’s Hold, in Lisbon)' }, rec: R(128, 0.5, 5000),
      chegada: 'Captain Leonor opens the map: "Seven stars and a note from the navigator: \'One of them fell to the bottom of the sea, where a lost city sleeps.\' Have you ever heard of Atlantis?"',
      chegadaMais: '500 years ago, Portuguese navigators wrote down everything they saw in the sky and the sea. This map was passed from captain to captain until it reached me.' },
    // 🌊 Atlântida — missões de HISTÓRIA (linha principal entre atl_m1 e atl_m4)
    { id: 'atl_h1', reg: 'atl', passou: 298, npc: 'lider_atl', lvl: 206, pre: 'atl_m1', titulo: '🌊 The statue in the square',
      texto: 'The statue of Neptune, here in the square, holds a stone ball with seven panels. Professor Coral has studied this statue for years. Go talk to him!',
      req: { fala: 'prof_coral', desc: 'Talk to Professor Coral (Atlantis square)' }, rec: R(206, 0.6, 160000, [['elixir_mar', 5]]),
      chegada: 'Professor Coral fixes his glasses: "Seven panels, and one of them is made of pearl! The Atlanteans say that, a thousand years ago, a star fell into the sea and the city glowed all night long."',
      chegadaMais: 'Nobody knows where that glow went. But the creatures from the portals keep very old stories. Maybe one of them knows more...' },
    { id: 'atl_h2', reg: 'atl', passou: 298, npc: 'prof_coral', lvl: 238, pre: 'atl_h1', titulo: '🌊 The pyramid drawings',
      texto: 'Professor Tutan found drawings in the Lost Pyramid, just like the ones in the Cairo tomb! Before showing them, he wants to see if you know the legend. Go talk to him.',
      req: { fala: 'guia_caca_piramide', desc: 'Talk to Professor Tutan (Lost Pyramid, in Atlantis)' }, rec: R(238, 0.8, 190000, [['bolinho_algas', 5]]),
      chegada: 'Professor Tutan smiles: "Before I show you the drawings, I want to see if you paid attention to the clues."',
      depois: 'Very good! Look here on the wall: a kick, a ball that turns into stars, seven pieces... and one of them falling into the sea. The pearl panel really exists!',
      enigma: [
        { p: 'How many little dots glow on your leather ball?', ops: ['3', '7', '11'], c: 1 },
        { p: 'Who told the legend of the first ball, back in the Village?', ops: ['Seu Zé', 'Queen Marina', 'Professor Coral'], c: 0 },
        { p: 'What does the statue of Neptune hold?', ops: ['A golden fish', 'A ball with seven panels', 'A giant seashell'], c: 1 },
      ] },
    { id: 'atl_h3', reg: 'atl', passou: 298, npc: 'prof_coral', lvl: 262, pre: 'atl_h2', titulo: '🌊 Glowing bubbles',
      texto: 'Nina the Mermaid saw glowing bubbles at Octopus Reef. Could it be the pearl panel? Go talk to her at the Reef.',
      req: { fala: 'guia_caca_recife', desc: 'Talk to Nina the Mermaid (Octopus Reef, in Atlantis)' }, rec: R(262, 0.6, 210000),
      chegada: 'Nina the Mermaid laughs: "The bubbles are from Granny Tuga, the oldest turtle in the sea! She’s been giving off little lights ever since she swallowed a glowing \'jellyfish\'..."',
      chegadaMais: 'Granny Tuga is 900 years old and sleeps almost all day. She’s fine, just a tiny bit confused. Waking her up now isn’t a good idea.' },
    { id: 'atl_h4', reg: 'atl', passou: 298, npc: 'guia_caca_recife', lvl: 280, pre: 'atl_h3', titulo: '🌊 The map of the currents',
      texto: 'I’ll draw where Granny Tuga sleeps, so you never forget. Bring 8 Octopus Inks: the Juggler Octopuses here at the Reef drop them.',
      req: { item: 'tinta_polvo', n: 8, desc: 'Collect 8 Octopus Inks (Octopus Reef)' }, rec: R(280, 1, 260000, [['elixir_mar', 10]]),
      fim: 'There, the reef map! Keep this secret: when you’re a legend of the universe, come back and talk to Professor Coral. Granny Tuga will wait.' },
    // 🚀 Espaço — 2 missões de HISTÓRIA por planeta (linha principal entre esp_m1 e esp_m6)
    { id: 'esp_h1', reg: 'esp', passou: 400, npc: 'lider_esp', lvl: 303, pre: 'esp_m1', titulo: '🚀 The Bunny’s burrow',
      texto: 'Commander Luna, on the Moon, wants to meet you. They say the Moon Bunnies hide something that glows. Go talk to her!',
      req: { fala: 'lider_lua', desc: 'Talk to Commander Luna (Moon)' }, rec: R(303, 0.6, 450000),
      chegada: 'Commander Luna whispers: "The oldest Bunny keeps a glowing blue stone, down in his burrow. It glows just like the little dots on your ball!"' },
    { id: 'esp_h2', reg: 'esp', passou: 400, npc: 'lider_lua', lvl: 316, pre: 'esp_h1', titulo: '🚀 The pocket telescope',
      texto: 'I want to take my time looking at the sky. Bring 8 Moon Rock Samples (the Moon Boulders drop them) and I’ll build a pocket telescope.',
      req: { item: 'amostra_lunar', n: 8, desc: 'Collect 8 Moon Rock Samples (Moon hunts)' }, rec: R(316, 1, 550000, [['soro_estelar', 5]]),
      fim: 'Look through the telescope: seven glows scattered across the sky, each one in a different world. And one of them is right here on the Moon!' },
    { id: 'esp_h3', reg: 'esp', passou: 400, npc: 'lider_esp', lvl: 330, pre: 'esp_h2', titulo: '🚀 The General’s medal',
      texto: 'Engineer Rubi, on Mars, sent a message: "I have a clue for the star player!" Go to Mars and talk to her.',
      req: { fala: 'lider_marte', desc: 'Talk to Engineer Rubi (Mars)' }, rec: R(330, 0.6, 500000),
      chegada: 'Engineer Rubi laughs: "The Martian General wears a warm red stone on his chest. He swears it fell from the sky and that it’s his lucky charm!"' },
    { id: 'esp_h4', reg: 'esp', passou: 400, npc: 'lider_marte', lvl: 344, pre: 'esp_h3', titulo: '🚀 The rover\'s radio',
      texto: 'An old rover recorded a mysterious signal, but its radio broke. Bring me 6 Robot Gears (Mining Robots drop them) and I\'ll fix it.',
      req: { item: 'engrenagem', n: 6, desc: 'Collect 6 Robot Gears (Mars hunts)' }, rec: R(344, 1, 600000, [['cristal_foco', 5]]),
      fim: 'There, listen: beep... beep... beep... SEVEN blinks, and then silence. This signal comes from far, far away!' },
    { id: 'esp_h5', reg: 'esp', passou: 400, npc: 'lider_esp', lvl: 356, pre: 'esp_h4', titulo: '🚀 The glow in the ice',
      texto: 'Astronomer Vega saw a strange glow inside Saturn\'s rings. Go to Saturn and talk to her.',
      req: { fala: 'lider_saturno', desc: 'Talk to Astronomer Vega (Saturn)' }, rec: R(356, 0.6, 550000),
      chegada: 'Astronomer Vega points her telescope: "See that? Inside the ring, there\'s a glow trapped in a block of ice. Nothing here is warm enough to melt that ice..."' },
    { id: 'esp_h6', reg: 'esp', passou: 400, npc: 'lider_saturno', lvl: 368, pre: 'esp_h5', titulo: '🚀 A message for Dr. Estela',
      texto: 'I wrote down everything about the seven glows. Take these notes to Dr. Estela, at the Space Station. She\'ll know what to do!',
      req: { fala: 'estela_estacao', desc: 'Talk to Dr. Estela (Space Station)' }, rec: R(368, 0.6, 600000),
      chegada: 'Dr. Estela reads it all with wide eyes: "Seven glows... and the rover\'s signal blinks seven times! I\'ll build a radar to follow that signal. When I find it, I\'ll call you!"' },
    { id: 'esp_h7', reg: 'esp', passou: 400, npc: 'lider_esp', lvl: 381, pre: 'esp_h6', titulo: '🚀 The memory of the stars',
      texto: 'Guardian Orion, in the Nebula, remembers everything that has ever happened in the universe. She wants to hear your clues. Go talk to her!',
      req: { fala: 'lider_nebulosa', desc: 'Talk to Guardian Orion (Orion Nebula)' }, rec: R(381, 0.8, 600000),
      chegada: 'Guardian Orion closes her eyes: "Tell me what you\'ve found out so far, little star."',
      depois: 'Guardian Orion smiles: "The seven glows are the panels of the first ball in the universe. It\'s not time to put them together yet... but that time is coming."',
      enigma: [
        { p: 'What does the oldest Moon Bunny keep in his burrow?', ops: ['A glowing blue stone', 'A golden carrot', 'A toy rocket'], c: 0 },
        { p: 'What does the Martian General wear on his chest?', ops: ['A whistle', 'A warm red stone', 'A tin star'], c: 1 },
        { p: 'How many times does the rover\'s signal blink?', ops: ['2', '7', '100'], c: 1 },
      ] },
    { id: 'esp_h8', reg: 'esp', passou: 400, npc: 'lider_nebulosa', lvl: 392, pre: 'esp_h7', titulo: '🚀 The path in the sky',
      texto: 'With Stardust I can draw the path of the seven glows across the sky. Bring 10 Stardust from the Nebula hunts.',
      req: { item: 'poeira_estelar', n: 10, desc: 'Collect 10 Stardust (Nebula hunts)' }, rec: R(392, 1, 700000, [['soro_estelar', 10]]),
      fim: 'Look: the path leads out of this universe! Win the Intergalactic Cup. After that, a portal will open... and Dr. Estela will have news.' },
    // 🌀 Multiverso — levam direto para a saga (Dra. Estela, nível 420)
    { id: 'of_mv1', reg: 'mv', passou: 420, npc: 'guardiao_mv', lvl: 403, titulo: '🌀 The glowing jewel',
      texto: 'When you arrived in the Multiverse, the jewel in King Ironbeard\'s crown started glowing on its own! Go to Stonehold and talk to the king.',
      req: { fala: 'rei_barbaferro', desc: 'Talk to King Ironbeard (Kingdom of Stonehold)' }, rec: R(403, 0.4, 1000000),
      chegada: 'King Ironbeard takes off his crown: "A thousand years, and this jewel has never glowed like this! The runes say: \'when the ace of the seven stars arrives, the stone will wake up\'."' },
    { id: 'of_mv2', reg: 'mv', passou: 420, npc: 'rei_barbaferro', lvl: 412, pre: 'of_mv1', titulo: '🌀 Dr. Estela\'s signal',
      texto: 'Seven stars... Dr. Estela, from the Space Station, is always studying signals from the sky. Tell her what happened to my jewel!',
      req: { fala: 'estela_estacao', desc: 'Talk to Dr. Estela (Space Station)' }, rec: R(412, 0.4, 1200000),
      chegada: 'Dr. Estela jumps out of her chair: "The jewel glowed? Then my radar is right! It found a signal inside an old satellite. Come back at level 420: we\'ll find out together!"' },
  ];
  const OFI_IDS = new Set(OFI.map(q => q.id));
  for (const q of OFI) { q.principal = true; q.fio = true; MISSOES.push(q); }
  const ofiQ = id => MISSOES.find(q => q.id === id);
  const ehFio = q => !!(q && OFI_IDS.has(q.id));
  window.OFI_MISSOES = OFI;

  /* ---------- quem já passou da região: a pista vira lembrança (vai para o diário, sem prêmio) ---------- */
  // v408.2 (dono aprovou): também vira lembrança a pista que ficou 30+ níveis para trás (OFI_LEMBRA_ACIMA).
  // Missão já aceita (em andamento) não é tocada: o jogador escolheu fazer.
  const OFI_LEMBRA_ACIMA = 30;
  function ofiLembra(s) {
    if (!s || !s.quests) return 0;
    const sagaComecou = !!s.quests.sg_p1, nv = s.nivel || 1; let n = 0;
    for (const q of OFI) {
      const e = s.quests[q.id]; if (e && (e.s === 'feita' || e.s === 'ativa')) continue;
      if (nv >= q.passou || nv >= q.lvl + OFI_LEMBRA_ACIMA || (q.reg === 'mv' && sagaComecou)) { s.quests[q.id] = { s: 'feita', lembranca: 1 }; if (q.id === 'of_vila1') { s.flags = s.flags || {}; s.flags.cena_origem = true; } n++; }
    }
    return n;
  }
  { const _ijOfi = iniciarJogo; iniciarJogo = function (save) { try { ofiLembra(save); } catch (e) { console.warn('origin thread', e); } return _ijOfi.apply(this, arguments); }; }
  // durante o jogo: ao subir de nível, a pista que ficou longe vira lembrança (vai para o diário)
  {
    let ofiNv = 0;
    setInterval(() => {
      try {
        const s = G.save; if (!s || !G.rodando || s.nivel === ofiNv) return; ofiNv = s.nivel;
        if (ofiLembra(s)) { G.uiSujo = true; salvar(); }
      } catch (e) { }
    }, 4000);
  }
  /* v408.2 (dono aprovou): pista aberta que ficou para trás (10+ níveis abaixo de você) é "pista antiga, opcional":
     não puxa a seta nem o "🎯 Agora" se houver outra missão principal mais perto do seu nível. Continua no diário e em Missões. */
  const OFI_ANTIGA = 10;
  const ofiAntiga = q => ehFio(q) && G.save && (G.save.nivel || 1) - (q.lvl || 1) >= OFI_ANTIGA && ['disponivel', 'ativa', 'pronta'].includes(statusMissao(q));
  // a missão disponível que a seta deve mostrar (null = deixa como estava)
  function ofiDisponivelPreferida() {
    const s = G.save; if (!s) return null;
    if (MISSOES.some(q => { const st = statusMissao(q); return st === 'pronta' || st === 'ativa'; })) return null;
    const disp = MISSOES.filter(q => statusMissao(q) === 'disponivel'); if (!disp.length || !ofiAntiga(disp[0])) return null;
    const nv = s.nivel || 1, perto = q => Math.abs(nv - (q.lvl || 1));
    for (const q of disp) {
      if (!ofiAntiga(q)) return q;
      if (!disp.some(p => p !== q && !ehFio(p) && mrxEhPrincipal(p) && perto(p) < perto(q))) return q;
    }
    return null;
  }
  const mrxEhPrincipal = q => (typeof mrxPrincipal === 'function' ? mrxPrincipal(q) : !!q.principal);
  {
    const _oaAnt = objetivoAtual;
    objetivoAtual = function () {
      const r = _oaAnt.apply(this, arguments);
      try { if (!G.guiaOn || (typeof TUTORIAL !== 'undefined' && G.save.tut < TUTORIAL.length)) return r; const q = ofiDisponivelPreferida(); if (q) { const a = alvoNpc(q.npc); if (a) return a; } } catch (e) { }
      return r;
    };
    if (typeof objetivoTexto === 'function') {
      const _otAnt = objetivoTexto;
      objetivoTexto = function () {
        const r = _otAnt.apply(this, arguments);
        try { const q = ofiDisponivelPreferida(); if (q && r && !r.pronta) return { txt: `Talk to ${(NPCS[q.npc] || {}).nome || 'who gave the mission'}: new mission "${q.titulo}"` }; } catch (e) { }
        return r;
      };
    }
  }

  /* ---------- conversas: chegar em quem a missão manda, enigma, botões ---------- */
  const agora = () => Date.now();
  const fmtMin = ms => { const m = Math.max(1, Math.ceil(ms / 60000)); return `${m} min`; };
  const diarioBtn = () => el('button', { class: 'btn', onclick: () => { if (typeof window.modalSaga === 'function') window.modalSaga(); } }, '📜 Origin Ball Journal');
  const falaBox = (npc, ...ps) => el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, ...ps));
  function ofiConclui(npc, q) {
    const e = G.save.quests[q.id]; e.p = 1;
    entregaMissao(q);
    const prox = MISSOES.find(x => ehFio(x) && x.pre === q.id);
    const txt = q.enigma ? (q.depois || q.chegada) : q.chegada;
    const ps = [el('p', {}, txt)];
    if (q.chegadaMais && !q.enigma) ps.push(el('details', { class: 'mrx-mais' }, el('summary', {}, '📖 Learn more'), el('p', {}, q.chegadaMais)));
    const ops = el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => abrirNPC(npc) }, prox && prox.npc === npc.id ? 'Continue' : 'OK'), diarioBtn());
    abreModal(el('h2', {}, npc.d.nome), falaBox(npc, ...ps), ops);
  }
  function ofiEnigma(npc, q) {
    const e = G.save.quests[q.id];
    if (e.erroAte && agora() < e.erroAte)
      return abreModal(el('h2', {}, npc.d.nome), falaBox(npc, el('p', {}, `"Think about your journey for a bit and come back in ${fmtMin(e.erroAte - agora())}. The clues are in your journal."`)),
        el('div', { class: 'opcoes' }, diarioBtn(), el('button', { class: 'btn', onclick: fechaModal }, 'Bye!')));
    let i = 0;
    const pergunta = () => {
      const p = q.enigma[i];
      abreModal(el('h2', {}, `${npc.d.nome} — question ${i + 1} of ${q.enigma.length}`), falaBox(npc, el('p', {}, i === 0 ? q.chegada : 'Very good... what\'s next?'), el('p', {}, el('b', {}, p.p))),
        el('div', { class: 'opcoes' }, ...p.ops.map((o, k) => el('button', { class: 'btn', onclick: () => {
          if (k !== p.c) {
            e.erroAte = agora() + 3 * 60000; salvar(); som('erro');
            return abreModal(el('h2', {}, npc.d.nome), falaBox(npc, el('p', {}, '"Hmm, that\'s not quite how it went... Reread the clues in your journal and come back in 3 minutes."')), el('div', { class: 'opcoes' }, diarioBtn(), el('button', { class: 'btn', onclick: fechaModal }, 'OK')));
          }
          som('moeda'); i++; if (i < q.enigma.length) pergunta(); else ofiConclui(npc, q);
        } }, o))));
    };
    pergunta();
  }
  const _abrirOfi = abrirNPC;
  abrirNPC = function (npc) {
    try {
      if (G.save && npc && npc.d && !npc.d.quadro) {
        const q = MISSOES.find(x => ehFio(x) && x.req.fala === npc.id && statusMissao(x) === 'ativa');
        if (q) { npc.flip = G.p.x < npc.x; return q.enigma ? ofiEnigma(npc, q) : ofiConclui(npc, q); }
      }
    } catch (e) { console.warn('origin thread', e); }
    const r = _abrirOfi.apply(this, arguments);
    // o personagem pode ter outra missão na frente (ou uma janela própria, como a do Orbitto): a do fio ganha um botão
    try {
      const box = document.getElementById('modalConteudo'), ops = box && box.querySelector('.opcoes');
      if (ops && G.save && npc) {
        const q = MISSOES.find(x => ehFio(x) && x.npc === npc.id && ['disponivel', 'pronta', 'ativa'].includes(statusMissao(x)));
        if (q && !box.textContent.includes(q.titulo)) {
          const st = statusMissao(q); let b = null;
          if (st === 'disponivel') b = el('button', { class: 'btn amarelo', onclick: () => modalMissao(npc, q) }, `Mission: ${q.titulo}`);
          else if (st === 'pronta' && !q.req.fala) b = el('button', { class: 'btn amarelo', onclick: () => { entregaMissao(q); abrirNPCDepois(npc, q.fim); } }, `Turn in: ${q.titulo}`);
          else if (st === 'ativa') { const [a, n] = progressoMissao(q); b = el('button', { class: 'btn', onclick: () => { if (typeof window.modalSaga === 'function') window.modalSaga(); } }, `${q.titulo}: ${descMissao(q)}${q.req.fala ? '' : ` — ${a}/${n}`}`); }
          if (b) ops.prepend(b);
        }
      }
    } catch (e) { }
    return r;
  };

  /* ---------- a seta amarela também leva até quem a missão manda procurar (req.fala, aqui e na saga) ---------- */
  {
    const _oaOfi = objetivoAtual;
    objetivoAtual = function () {
      const r = _oaOfi.apply(this, arguments);
      try {
        const s = G.save; if (!s || !G.guiaOn || (typeof TUTORIAL !== 'undefined' && s.tut < TUTORIAL.length)) return r;
        if (MISSOES.some(q => statusMissao(q) === 'pronta')) return r;
        const q = MISSOES.find(x => statusMissao(x) === 'ativa');
        if (q && q.req && q.req.fala && NPCS[q.req.fala]) { const a = alvoNpc(q.req.fala); if (a) return a; }
      } catch (e) { }
      return r;
    };
  }

  /* ---------- o diário da saga mostra as pistas desde o começo ---------- */
  const REG = [['br', '🏡 Brazil'], ['mundo', '🌍 World and Europe'], ['atl', '🌊 Atlantis'], ['esp', '🚀 Space'], ['mv', '🌀 Multiverse']];
  const ondeDe = id => { try { const I = COMO_CHEGAR.ccInfo({ id: 'x', npc: id, req: { fala: id } }); return I ? I.onde.replace(/^🎯 /, '') : ''; } catch (e) { return ''; } };
  function blocoPistas() {
    const s = G.save; if (!s) return null;
    let feitas = 0;
    const det = REG.map(([reg, nome]) => {
      const qs = OFI.filter(q => q.reg === reg).map(q => ofiQ(q.id) || q);
      const linhas = []; let atual = null, nFeitas = 0;
      for (const q of qs) {
        const st = statusMissao(q);
        if (st === 'feita') {
          nFeitas++;
          linhas.push(el('p', { class: 'sg-h' }, el('b', {}, q.titulo.replace(/^\S+ /, '') + ': '), q.req.fala ? (q.enigma ? (q.depois || q.chegada) : q.chegada) : q.texto));
          if (q.fim) linhas.push(el('p', { class: 'sg-h sg-fim' }, q.fim));
          continue;
        }
        if (!atual) atual = q;
      }
      feitas += nFeitas;
      let ag = null;
      if (atual) {
        const st = statusMissao(atual), quem = ondeDe(atual.npc), nm = (NPCS[atual.npc] || {}).nome || '';
        ag = st === 'nivel' || st === 'bloqueada' ? `🔒 Next clue from level ${atual.lvl}${quem ? ` (${quem})` : ''}.`
          : st === 'disponivel' ? `👉 Talk to ${nm}${quem ? ` (${quem})` : ''}: ${atual.titulo.replace(/^\S+ /, '')}.`
          : st === 'pronta' ? `✅ Done! Go back and talk to ${nm}.` : `👉 ${descMissao(atual)}${atual.req.fala ? '' : ` (${progressoMissao(atual).join('/')})`}.`;
        if (ofiAntiga(atual)) ag += ' (old clue, optional)';
      }
      const ic = nFeitas === qs.length ? '✅' : nFeitas || (atual && statusMissao(atual) !== 'nivel' && statusMissao(atual) !== 'bloqueada') ? '🔎' : '🔒';
      return el('details', { class: 'sg-cap', open: atual && ['disponivel', 'ativa', 'pronta'].includes(statusMissao(atual)) ? 'open' : null },
        el('summary', {}, `${ic} ${nome} (${nFeitas}/${qs.length})`), ...linhas, ag ? el('p', { class: 'sg-agora' }, ag) : '');
    });
    return el('div', { class: 'ofi-pistas' }, el('h3', { class: 'ofi-tit' }, `🔎 The clues (${feitas}/${OFI.length})`),
      el('p', { class: 'dica' }, 'Before the big adventure, the mystery of your leather ball: clues around the world that lead to Dr. Estela at level 420.'), ...det,
      el('h3', { class: 'ofi-tit' }, '📜 The saga (level 420 and up)'));
  }
  {
    const _amOfi = abreModal;
    abreModal = function () {
      const r = _amOfi.apply(this, arguments);
      try {
        const box = document.getElementById('modalConteudo'), h = box && box.querySelector('h2');
        if (h && h.textContent === '📜 The Origin Ball' && !box.querySelector('.ofi-pistas')) {
          const b = blocoPistas(), dica = box.querySelector('p.dica');
          if (b) { if (dica) dica.after(b); else h.after(b); }
        }
        // v408.2: na janela Missões (e nas conversas), a pista que ficou para trás ganha a etiqueta "pista antiga, opcional"
        if (box && G.save) for (const tb of box.querySelectorAll('.linha-item .nm b, .opcoes .btn')) {
          if (tb.querySelector('.ofi-antiga')) continue;
          const q = OFI.find(x => tb.textContent.includes(x.titulo)); if (q && ofiAntiga(ofiQ(q.id) || q)) tb.append(el('span', { class: 'ofi-antiga' }, 'old clue, optional'));
        }
      } catch (e) { console.warn('clue journal', e); }
      return r;
    };
  }

  /* ---------- capítulos curtos (arte que já existe) ---------- */
  if (typeof CAPITULOS !== 'undefined') {
    const hn = n => (typeof _hn === 'function' ? _hn(n) : (n || 'you'));
    const feita = (s, id) => !!(s.quests && s.quests[id] && s.quests[id].s === 'feita');
    CAPITULOS.origem = {
      rotulo: 'A mystery', titulo: 'The beginning of the mystery', emoji: '✨',
      // v408.4 (dono, nível 622: "entrei no jogo e abriu o vídeo de início"): a pista recebida como LEMBRANÇA (quem já passou da Vila)
      // não toca o capítulo — ele só aparece para quem faz a pista de verdade
      cond: s => feita(s, 'of_vila1') && !(s.quests && s.quests.of_vila1 && s.quests.of_vila1.lembranca),
      cenas: [
        { img: 'historia_4', kb: 'kb-a', cor: ['#f0c060', '#5ab85a'], txt: n => 'Remember your leather ball, the one in the chest in the backyard? One night, Mom saw something strange: seven little dots shining on the leather, like stars.' },
        { img: 'historia_2', kb: 'kb-b', cor: ['#c89a5a', '#6a4a2a'], txt: n => 'Seu Zé said that when he was a kid, he saw a star fall behind the little pitch. The next day, that ball was lying in the bushes.' },
        { img: 'cap_gloria_4', kb: 'kb-d', cor: ['#140a40', '#3a2780'], txt: n => 'His grandpa used to say: the first ball in the universe broke into seven pieces, scattered across the worlds. And one day, a star player will bring them all back together.' },
        { img: 'cap_gloria_4', kb: 'kb-zoom', foco: '60% 22%', cor: ['#140a40', '#3a2780'], txt: n => `The seven little dots look like a map. Where could it lead? Keep an eye out, ${hn(n)}: every new place might have a clue!` },
      ],
      final: { emoji: '✨', titulo: 'The beginning of the mystery', sub: n => 'Your clues are kept in the 📜 Origin Ball Journal (☰ Menu).', botao: 'Continue ⚽' },
    };
    CAPITULOS.jurassico = {
      rotulo: 'Chapter 12', titulo: 'The Jurassic Valley', emoji: '🦖', implica: ['multiverso'],
      cond: (s, mapa) => /^jur_/.test(mapa || ''),
      cenas: [
        { img: 'cap_mv_1', kb: 'kb-a', cor: ['#140a40', '#ffb04a'], txt: n => 'In the Multiverse Stadium, a portal covered in leaves and giant footprints started to shake. From inside came a roar... and the sound of a bouncing ball!' },
        { img: 'mv_portal_jur', kb: 'kb-zoom', cor: ['#3a8a4a', '#0a3a2a'], txt: n => 'On the other side: the Jurassic Valley, with a volcano, waterfalls and dinosaurs of every size. And all of them playing soccer!' },
        { img: 'mv_portal_jur', kb: 'kb-a', foco: '50% 62%', cor: ['#3a8a4a', '#0a3a2a'], txt: n => 'Dr. Fossil, the paleontologist, set up a camp in the valley. She needs help: King Rex doesn\'t like soccer and wants to send the humans away.' },
        { img: 'cap_gloria_4', kb: 'kb-zoom', foco: '60% 22%', cor: ['#140a40', '#3a2780'], txt: n => 'And on a very old rock, Dr. Fossil found a footprint... next to a drawing of a ball with seven panels. Did even the dinosaurs see the first ball fall from the sky?' },
      ],
      final: { emoji: '🦖', titulo: 'The Jurassic Valley', sub: n => 'Chapter 12 has begun! Help Dr. Fossil study the dinosaurs (levels 566 to 700) and show King Rex that soccer is pure joy.', botao: 'Explore! 🦖' },
    };
    CAPITULOS.origem_fim = {
      rotulo: 'Final chapter', titulo: 'The Origin Ball', emoji: '⭐', implica: ['multiverso'],
      cond: s => !!(s.flags && s.flags.saga_origem),
      cenas: [
        { img: 'cap_mv_1', kb: 'kb-zoom', foco: '22% 70%', cor: ['#140a40', '#ffb04a'], txt: n => 'In the Multiverse Stadium, every world fell silent. The Origin Ball, whole again, was in your hands.' },
        { img: 'cap_esp_3', kb: 'kb-b', cor: ['#0a0a1e', '#ffcf3a'], som: 'gol', txt: n => 'You took a deep breath and made the first kick. The ball rose, spun... and the stars all twinkled together, in every world!' },
        { img: 'cap_gloria_4', kb: 'kb-d', cor: ['#140a40', '#3a2780'], txt: n => 'Back in Campinho Village, Seu Zé saw a star shoot across the sky and smiled: "My grandpa\'s legend was true."' },
        { img: 'historia_4', kb: 'kb-a', cor: ['#f0c060', '#5ab85a'], txt: n => `And the old leather ball from the chest? The seven little dots went out, one by one. The map had led ${hn(n)} all the way to the end.` },
      ],
      final: { emoji: '⭐', titulo: 'The Origin Ball', sub: n => `The end of the saga${n ? ', ' + n : ''}! The first ball in the universe now spins around you. Every legend starts on a little pitch.`, botao: 'The legend continues... ⚽' },
    };
    const ord = CAPITULOS_ORDEM;
    if (!ord.includes('origem')) ord.splice(Math.max(1, ord.indexOf('intro') + 1), 0, 'origem');
    for (const [id, depois] of [['jurassico', 'multiverso'], ['origem_fim', 'jurassico']]) {
      if (ord.includes(id)) continue; const i = ord.indexOf(depois), ig = ord.indexOf('gloria');
      ord.splice(i >= 0 ? i + 1 : (ig >= 0 ? ig : ord.length), 0, id);
    }
    // o fim da Galáxia dizia "novos mundos nas próximas atualizações": o Multiverso já existe e a Dra. Estela tem um sinal
    if (CAPITULOS.galaxia && CAPITULOS.galaxia.final) CAPITULOS.galaxia.final.sub = n => `Congratulations${n ? ', ' + n : ''}! You won the Intergalactic Cup. In Rio, the Multiverse Guardian is opening a new portal... and Dr. Estela has a mysterious signal to show you.`;
  }

  const css = document.createElement('style');
  css.textContent = `
  .ofi-pistas { margin: 4px 0 8px; }
  .ofi-tit { margin: 10px 0 2px; font-size: 16px; }
  .ofi-antiga { display: inline-block; margin-left: 6px; padding: 0 6px; border-radius: 8px; background: rgba(120,90,60,.15); font-size: 11px; font-weight: 700; color: #7a5a3a; vertical-align: middle; }
  .hist .hist-cena .h-img[src*="mv_portal_jur"] { object-fit: contain; }
  .hist .hist-cena:has(.h-img[src*="mv_portal_jur"]) { background: radial-gradient(circle at 50% 45%, #7ad08a, #1a5a3a 70%, #0a2a1a); }`;
  document.head.append(css);
  window.OFI = { OFI, ofiLembra, blocoPistas, ehFio };
}
