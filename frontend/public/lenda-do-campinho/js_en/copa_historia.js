/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎟️ COPA DOS ESQUECIDOS — HISTÓRIA, MISSÕES E TEXTOS (v410, aprovado pelo dono em 06/10/2026) — prefixo cqHist / CQ_HIST
   Frente MISSÕES E TEXTOS (_avaliacao/COPA_ESQUECIDOS.md). As outras frentes: copa_esquecidos.js (adversários, NPCs,
   itens, chefões, final), copa_arte.js (desenhos), copa_mapas.js (estádio e alas). Este arquivo só CONTA a história:
   - Gancho no nível 700: o Grão-Guardião Orbitto acha um ingresso antigo e amarelado. Ao ACEITAR a missão, a flag cq_portal
     abre o Portal dos Esquecidos (o ingresso é a entrada); a missão termina ao falar com o Seu Saudade, lá dentro.
   - Seu Saudade (roupeiro, anfitrião) e Dona Memória (torcedora mais antiga): falas, apresentação e as missões de cada ala.
     Por ala: 3 missões de história (vencer N · recuperar um objeto de um adversário com req.de · enigma de regra de futebol
     ou falar com alguém) + 1 missão do chefão. Tema: não desistir e jogo limpo. Times INVENTADOS (CQ_HIST_TIMES).
   - Final dos Onze Esquecidos (depois da saga da Bola de Origem; volta toda semana) + capítulos curtos
     "A Copa dos Esquecidos" (ao entrar no estádio) e "A taça, enfim" (primeira vitória na final).
   - Álbum dos Esquecidos (aba nova no Caderno do Craque): uma figurinha por time. Cai jogando (vencendo os fantasmas do
     time; a missão de história do time também dá a figurinha) ou À VISTA com o Seu Saudade, por Ingressos Esquecidos.
     Nunca sorteio pago.
   - Avisos das pressões das alas (frio, escuro, barulho), falas dos adversários no Bestiário (se faltarem).
   - Pista da Bola de Origem: missão opcional com o Orbitto + linha no 📜 Diário da Bola de Origem. Não bloqueia a saga.
   Tudo é montado só com o que as outras frentes já criaram: missão cujo personagem/adversário não existe não entra
   (e a corrente de pré-requisitos pula para a anterior), para nunca quebrar o jogo nem os testes.
   Pedidos novos usados (da saga, saga_origem.js): req.fala + q.enigma. Recompensas pela régua do balanço (xpNivel × k,
   tostões até bzRenda(L)·150), sem fonte nova de poder.
   Carregar NO FIM (depois de copa_esquecidos.js, copa_arte.js, copa_mapas.js, saga_origem.js, origem_fio.js,
   como_chegar.js, missoes_raiox.js, caderno.js, historia.js).
   ============================================================ */
{
  const cqHistXpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));
  // prêmio no padrão da faixa (como origem_fio.js): k = quanto de um nível de XP; tostões com o teto da régua do balanço
  const cqHistR = (L, k, itens) => {
    let o = Math.round(L * 3000);
    try { if (typeof bzRenda === 'function' && typeof bzRedondo === 'function') o = Math.min(o, bzRedondo(bzRenda(L) * 150)); } catch (e) { }
    return { xp: Math.round(cqHistXpNivel(L) * k), ouro: o, itens: (itens || []).filter(([id]) => ITENS[id]) };
  };
  const nomeNpc = id => ((NPCS[id] || {}).nome || id).split(',')[0];
  const nomeMon = id => ((MONSTROS[id] || {}).nome || id).split(',')[0];
  const nivelMon = id => { const d = MONSTROS[id]; return (d && (d.nivel || (typeof nivelMonstro === 'function' ? nivelMonstro(d) : 0))) || 0; };
  const ING = 'ingresso_esquecido';

  /* ---------- os times esquecidos (inventados) e o álbum ---------- */
  // escudo: arte da frente ARTE (a/cq_escudo_N.webp); sem arte, um escudo desenhado com a cor do time
  const CQ_HIST_TIMES = [
    { id: 't1', n: 1, nome: 'Bench United', ala: 'cq_vestiario', cor: '#7a8fb0', adv: ['cq_reserva', 'cq_massagista'],
      txt: 'They spent the whole Origin Cup on the bench, waiting for their turn to go in. They’re still warming up today!' },
    { id: 't2', n: 2, nome: 'Sandlot Lightning', ala: 'cq_vestiario', cor: '#d8b040', adv: ['cq_gandula', 'cq_cap_vestiario'],
      txt: 'The fastest team in the Cup: they ran so much they forgot to pass the ball. They learned in the end, but the final stopped.' },
    { id: 't3', n: 3, nome: 'Wall Football Club', ala: 'cq_tunel', cor: '#8a7a6a', adv: ['cq_zagueiro'],
      txt: 'They never let in a goal... and never scored one! They tied every game 0-0.' },
    { id: 't4', n: 4, nome: 'Origin Trio', ala: 'cq_tunel', cor: '#3a3a3a', adv: ['cq_bandeirinha', 'cq_arbitro', 'cq_xerife_tunel'],
      txt: 'The referee and the two linesmen who officiated every game of the Origin Cup. All that was missing was the final whistle.' },
    { id: 't5', n: 5, nome: 'Wave Sports Club', ala: 'cq_arquibancada', cor: '#5aa0d8', adv: ['cq_torcida', 'cq_bumbo'],
      txt: 'The fans who invented the wave. They sang through the whole Cup without seeing their team score, and they never stopped singing.' },
    { id: 't6', n: 6, nome: 'Hill Mascots', ala: 'cq_arquibancada', cor: '#d07ab0', adv: ['cq_mascote', 'cq_rei_arquibancada'],
      txt: 'The liveliest team in the Cup: every player had a mascot. Their flag ended up with the Lost Mascot.' },
    { id: 't7', n: 7, nome: 'Almost There Football Club', ala: 'cq_gramado', cor: '#5ab86a', adv: ['cq_craque', 'cq_goleiro'],
      txt: 'They reached ten finals and lost every one 1-0. The next day, they were back at practice.' },
    { id: 't8', n: 8, nome: 'Clipboard Athletic', ala: 'cq_gramado', cor: '#c8603a', adv: ['cq_tecnico', 'cq_craque_final'],
      txt: 'The most organized team in the Cup: the coach drew every play on the clipboard before the game.' },
    { id: 'onze', n: 9, nome: 'The Forgotten Eleven', ala: 'cq_gramado', cor: '#e8d070', adv: ['cq_onze'], final: true,
      txt: 'The best players from each forgotten team, together, to play the final that never ended.' },
  ];
  const CQ_HIST_TIME_DE = {}; for (const t of CQ_HIST_TIMES) for (const a of t.adv) CQ_HIST_TIME_DE[a] = t;
  const CQ_HIST_FIG_PRECO = 15;          // Ingressos Esquecidos por figurinha À VISTA (o Seu Saudade mostra qual é antes)
  const CQ_HIST_FIG_CHANCE = 1 / 150;    // por vitória contra um fantasma do time (chefão: 1 em 2)
  const CQ_HIST_ALAS = { cq_vestiario: '👕 Abandoned Locker Room', cq_tunel: '🚦 Players’ Tunnel', cq_arquibancada: '📣 Infinite Stands', cq_gramado: '⚽ Eternal Final Pitch' };
  const nomeAla = id => (CQ_HIST_ALAS[id] || id).replace(/^\S+ /, '');
  const albumDe = (s = G.save) => { if (!s) return {}; if (!s.cqAlbum || typeof s.cqAlbum !== 'object') s.cqAlbum = {}; return s.cqAlbum; };
  function cqHistGanhaFig(tid, como) {
    const s = G.save; if (!s) return false; const t = CQ_HIST_TIMES.find(x => x.id === tid); if (!t) return false;
    const al = albumDe(s); if (al[tid]) return false;
    al[tid] = true; const n = CQ_HIST_TIMES.filter(x => al[x.id]).length;
    log(`👻 NEW STICKER in the Forgotten Album: ${t.nome}! (${n}/${CQ_HIST_TIMES.length})${como ? ' ' + como : ''}`, 'l-xp'); som('moeda');
    try { if (typeof avisoTela === 'function') avisoTela(`👻 New sticker: ${t.nome}`, 'l-xp'); } catch (e) { }
    G.uiSujo = true; return true;
  }

  /* ---------- objetos de missão (chave: não vende, não pesa; só caem enquanto a missão pede) ---------- */
  const CQ_HIST_OBJ = {
    cq_bola_autografada: ['Signed Ball', 'Sandlot Lightning’s ball, signed by every player. The Lightning Ball Boy had grabbed it.', 'i_bola_ouro', 'cq_gandula'],
    cq_apito_final: ['Whistle of the Final', 'The whistle the Forgotten Referee was saving to end the final of the Origin Cup.', 'i_apito_ouro', 'cq_arbitro'],
    cq_bandeira_mascotinhos: ['Hill Mascots Flag', 'The faded flag of the Hill Mascots. The Lost Mascot wouldn’t let go of it.', 'i_bandeira_verde', 'cq_mascote'],
    cq_prancheta_final: ['Clipboard of the Final', 'The Voiceless Coach’s clipboard, with the lineup for the final drawn on it.', 'i_prancheta', 'cq_tecnico'],
  };
  const CQ_HIST_OBJ_CH = 0.07; // ~1 a cada 14 vitórias (com a missão aceita, a chance é cheia mesmo em adversário fraco)
  for (const [id, [nome, desc, ic, de]] of Object.entries(CQ_HIST_OBJ)) {
    if (!MONSTROS[de]) continue;
    if (!ITENS[id]) ITENS[id] = { nome, tipo: 'chave', venda: 0, desc: `🎟️ ${desc}`, cqHist: true };
    if (typeof ICON_ALIAS !== 'undefined' && !ICON_ALIAS[id]) ICON_ALIAS[id] = ic;
    if (typeof CHAVE_DE_USO !== 'undefined') CHAVE_DE_USO.add(id);
    const d = MONSTROS[de]; d.loot = d.loot || []; if (!d.loot.some(l => l[0] === id)) d.loot.push([id, CQ_HIST_OBJ_CH, 1, 1]);
  }

  /* ---------- as missões ---------- */
  // e: [id, npc, nível, pre, título, texto, pedido, k (níveis de XP), itens, extras]
  // nível de missão de vencer/recuperar: nunca muito abaixo do adversário (a régua do s1: item até 30 níveis acima)
  const L = (lvl, tipo, max) => { const nv = nivelMon(tipo); return Math.min(max || 9999, Math.max(lvl, nv ? nv - 20 : lvl)); };
  const ingr = n => [[ING, n]];
  const E = [
    // 🎟️ o gancho e os anfitriões
    ['cq_ingresso', 'guardiao_mv', 700, null, '🎟️ The yellowed ticket',
      'Look what I found on the stadium floor: an old, yellowed ticket for the "Origin Cup"! The sealed portal lit up. Go through it and talk to Seu Saudade inside.',
      { fala: 'seu_saudade', desc: 'Go through the Forgotten Portal (Multiverse Stadium) and talk to Seu Saudade' }, 0.5, ingr(3),
      { mais: 'I know the oldest legends in the universe, but I’ve never heard of this cup! The portal that was sealed, at the top of the Multiverse Stadium, now leads to a very old stadium. The ticket is your way in.',
        chegada: 'A ticket for the Origin Cup! It’s been so long since anyone came by... Welcome to the Forgotten Stadium! I’m Seu Saudade, the kit manager. I take care of the jerseys of every team here.',
        chegadaMais: 'The teams that never won anything play here. The final of the Origin Cup stopped halfway, and they’ve been waiting for the final whistle ever since. They’re ghosts, but don’t be scared: they just want to play soccer!' }],
    ['cq_memoria', 'seu_saudade', 700, 'cq_ingresso', '🎟️ The oldest fan',
      'Dona Memória saw every game of the Origin Cup and remembers every team. She’s here in the stadium lobby. Go say hi!',
      { fala: 'dona_memoria', desc: 'Talk to Dona Memória (Forgotten Stadium lobby)' }, 0.4, ingr(2),
      { chegada: 'Oh, a new face! I’m Dona Memória. Do you know why the teams here never leave? They never gave up... they just forgot why they played. Shall we help each one remember?',
        chegadaMais: 'When you beat a team in a fair duel, it remembers the joy of playing. The stadium has four wings: the Abandoned Locker Room, the Players’ Tunnel, the Infinite Stands and the Eternal Final Pitch.' }],
    // ✨ a pista da Bola de Origem (opcional: não está na linha principal e não bloqueia nada)
    ['cq_pista_origem', 'dona_memoria', 710, 'cq_memoria', '✨ The ball of the final',
      'The final of the Origin Cup stopped when the first ball in the universe broke apart. Grand Guardian Orbitto knows that ball. Go tell him, at the Multiverse Stadium!',
      { fala: 'guardiao_mv', desc: 'Talk to Grand Guardian Orbitto (Multiverse Stadium)' }, 0.4, ingr(2),
      { opcional: true,
        chegada: 'Orbitto’s eyes go wide: "The Origin Cup was played with the Origin Ball! When it broke into 7 panels, the final stopped. With the whole ball, the final can start again!"',
        chegadaMais: 'The 7 panels are scattered across the worlds: that’s the "The Origin Ball" saga (📜 in the ☰ Menu). When the ball wakes up, come back to the Forgotten Stadium and talk to Dona Memória.' }],

    // 🚪 Ala 1 — Vestiário Abandonado (700–760): substituições; frio
    ['cq_vestiario_h1', 'dona_memoria', L(705, 'cq_reserva', 740), 'cq_memoria', '👻 The team that never left the bench',
      'Bench United waited on the bench for the whole Cup. Beat 40 Eternal Subs in the Abandoned Locker Room and show them their turn has come!',
      { kill: 'cq_reserva', n: 40 }, 1, ingr(4),
      { fig: 't1', mais: 'The Bench United coach always said: "easy now, your turn will come". The final stopped before he could call anyone in. Watch out: the Eternal Sub calls other subs to help, and the Sleepwalking Physio takes care of his teammates.',
        fim: 'Look: they’re smiling! They got to go on the field, even if just for a minute. Keep the Bench United sticker in your album.' }],
    ['cq_vestiario_h2', 'dona_memoria', L(725, 'cq_gandula', 750), 'cq_vestiario_h1', '👻 The ball that ran away',
      'The Lightning Ball Boy grabbed Sandlot Lightning’s Signed Ball and ran off! He lives in the Abandoned Locker Room. Bring the ball back.',
      { item: 'cq_bola_autografada', n: 1, de: 'cq_gandula', desc: 'Get the Signed Ball back from the Lightning Ball Boy (Abandoned Locker Room)' }, 1, ingr(4),
      { mais: 'Sandlot Lightning was the fastest team in the Cup: they ran so much they forgot to pass the ball! The Ball Boy is quick and runs off with the ball: mark him and don’t let him get away.',
        fim: 'How wonderful! Each signature belongs to a Sandlot Lightning player. By the end of the Cup they had learned to pass the ball... too bad the final stopped.' }],
    ['cq_vestiario_h3', 'dona_memoria', 740, 'cq_vestiario_h2', '👻 The rule book',
      'Seu Saudade keeps the Origin Cup rule book. Before you face the captain of the locker room, show him you know what fair play is!',
      { fala: 'seu_saudade', desc: 'Answer Seu Saudade’s questions (Forgotten Stadium lobby)' }, 0.8, ingr(3),
      { chegada: 'Seu Saudade opens a very old book: "Fair play starts with the rules. Let’s see if you know them!"',
        depois: 'You got them all right! People who know the rules play better and argue less. Now the Locker Room Captain will want a duel with you.',
        enigma: [
          { p: 'How many players does each team have on the field, counting the goalkeeper?', ops: ['7', '11', '15'], c: 1 },
          { p: 'Two yellow cards for the same player, in the same game, become...', ops: ['A red card', 'A goal for the other team', 'A blue card'], c: 0 },
          { p: 'How do you take a throw-in?', ops: ['By kicking the ball', 'With both hands, over your head', 'With a header'], c: 1 },
        ] }],
    ['cq_vestiario_chefe', 'seu_saudade', L(755, 'cq_cap_vestiario', 760), 'cq_vestiario_h3', '🏆 The Locker Room Captain',
      'The Locker Room Captain never let his team give up. Beat the Captain at the back of the Abandoned Locker Room: he deserves a real duel!',
      { kill: 'cq_cap_vestiario', n: 1 }, 1.6, ingr(8),
      { mais: 'He has kept his captain’s armband since the Origin Cup. When he loses a fair duel, he shakes your hand and says "good game!". Bosses come back after a while: if he’s not there, wait a little bit.',
        fim: '"Good game, star!", said the Captain. The whole Locker Room cheered. The next wing is the Players’ Tunnel.' }],

    // 🔦 Ala 2 — Túnel de Acesso (760–830): impedimento e cartões; escuridão
    ['cq_tunel_h1', 'dona_memoria', L(765, 'cq_zagueiro', 800), 'cq_vestiario_h3', '👻 The zero-to-zero team',
      'Wall Football Club never let in a goal... and never scored one! Beat 50 Wall Defenders in the Players’ Tunnel and teach them the joy of attacking.',
      { kill: 'cq_zagueiro', n: 50 }, 1, ingr(4),
      { fig: 't3', mais: 'Wall FC tied every game 0-0. They defended so well that they forgot to try to score! Tip: the Wall Defender only goes down to strong plays.',
        fim: 'They took a shot on goal for the first time... and celebrated like they’d won a title! Keep the Wall FC sticker.' }],
    ['cq_tunel_h2', 'dona_memoria', L(790, 'cq_arbitro', 820), 'cq_tunel_h1', '👻 The whistle of the final',
      'The Forgotten Referee keeps the Whistle of the Final and doesn’t remember what it’s for anymore. Beat the Referee in the Players’ Tunnel and bring back the whistle: without it, the final never ends!',
      { item: 'cq_apito_final', n: 1, de: 'cq_arbitro', desc: 'Get the Whistle of the Final back from the Forgotten Referee (Players’ Tunnel)' }, 1, ingr(4),
      { mais: 'The Origin Trio (the referee and the two linesmen) officiated every game of the Origin Cup. Watch out for the cards: the yellow one slows you down, and the red one takes away your plays for 3 seconds.',
        fim: 'The Whistle of the Final! I’ll keep it very carefully. One day it will blow the end of that game...' }],
    ['cq_tunel_h3', 'seu_saudade', 805, 'cq_tunel_h2', '👻 Offside!',
      'Dona Memória is always arguing about offside with the Linesman in the tunnel. She wants to see if you understand the rule. Go talk to her here in the lobby!',
      { fala: 'dona_memoria', desc: 'Answer Dona Memória’s questions (Forgotten Stadium lobby)' }, 0.8, ingr(3),
      { chegada: 'Dona Memória fixes her glasses: "Offside is the rule that causes the most arguments in the stands! Let’s see..."',
        depois: 'That’s right! Now, when the Linesman raises the flag, you’ll know why. And watch out for the stripes on the Tunnel floor: step on one and you go back!',
        enigma: [
          { p: 'On a throw-in, can there be offside?', ops: ['Yes, always', 'No: there’s no offside on a throw-in', 'Only in the second half'], c: 1 },
          { p: 'The striker is in his own half when the pass is made. Can he be offside?', ops: ['Yes', 'No: it’s never offside in your own half', 'Only if he’s tall'], c: 1 },
          { p: 'Who raises the flag to signal offside?', ops: ['The linesman (the assistant referee)', 'The ball kid', 'The coach'], c: 0 },
        ] }],
    ['cq_tunel_chefe', 'seu_saudade', L(825, 'cq_xerife_tunel', 830), 'cq_tunel_h3', '🏆 The Tunnel Sheriff',
      'The Tunnel Sheriff doesn’t let anyone through without playing fair. Beat the Sheriff at the top of the Players’ Tunnel and show that you play by the rules!',
      { kill: 'cq_xerife_tunel', n: 1 }, 1.6, ingr(8),
      { mais: 'The Sheriff has guarded the tunnel ever since the final stopped. He’s tough, but fair: he respects those who respect the rules. If he’s not there, come back in a little while.',
        fim: '"You may pass, star!", said the Sheriff, tipping his hat. The next wing is the Infinite Stands.' }],

    // 📣 Ala 3 — Arquibancada Infinita (830–900): a ola; barulho
    ['cq_arquibancada_h1', 'dona_memoria', L(835, 'cq_torcida', 870), 'cq_tunel_h3', '👻 The fans who never stopped',
      'The Wave SC fans sang through the whole Cup without seeing their team score. Beat 60 Mist Fans in the Infinite Stands and throw them a party!',
      { kill: 'cq_torcida', n: 60 }, 1, ingr(4),
      { fig: 't5', mais: 'The Wave SC fans invented the wave, that ripple that goes around the stands. Watch out: the wave crosses the whole map, and the noise drains your focus.',
        fim: 'Did you hear that? They did the most beautiful wave of all time! Keep the Wave SC sticker.' }],
    ['cq_arquibancada_h2', 'dona_memoria', L(860, 'cq_mascote', 890), 'cq_arquibancada_h1', '👻 The lost flag',
      'The Lost Mascot is hugging the Hill Mascots flag. Beat the Mascot in the Infinite Stands and bring the flag back.',
      { item: 'cq_bandeira_mascotinhos', n: 1, de: 'cq_mascote', desc: 'Get the Hill Mascots Flag back from the Lost Mascot (Infinite Stands)' }, 1, ingr(4),
      { mais: 'The Hill Mascots were the liveliest team in the Cup: every player had a mascot! The Lost Mascot got separated from the team and got scared of being alone. He’s very tough: bring focus food.',
        fim: 'The Hill Mascots flag! It’s faded, but all in one piece. Seu Saudade will know how to take care of it.' }],
    ['cq_arquibancada_h3', 'dona_memoria', 880, 'cq_arquibancada_h2', '👻 Flag up high',
      'Take the Hill Mascots flag to Seu Saudade, here in the lobby. He’ll sew up the rips and hang the flag high up in the stands.',
      { fala: 'seu_saudade', desc: 'Take the flag to Seu Saudade (Forgotten Stadium lobby)' }, 0.6, ingr(3),
      { chegada: 'Seu Saudade sews it carefully and hangs the flag way up high. Over in the Infinite Stands, someone started clapping... and then everyone did!',
        chegadaMais: '"A flag reminds a team who it is", says Seu Saudade. "Nobody plays alone: there’s always someone cheering."' }],
    ['cq_arquibancada_chefe', 'seu_saudade', L(895, 'cq_rei_arquibancada', 900), 'cq_arquibancada_h3', '🏆 The King of the Stands',
      'The King of the Stands leads the fans’ party. Beat the King in the VIP box, up at the top of the Infinite Stands, and he’ll start a chant with your name!',
      { kill: 'cq_rei_arquibancada', n: 1 }, 1.6, ingr(8),
      { mais: 'He was the very first fan of the Origin Cup and never missed a game... as a spectator! When the Thunder Drum plays, the wave pushes you: stand firm.',
        fim: 'The King started the chant and the whole Infinite Stands sang your name! Only one wing left: the Eternal Final Pitch.' }],

    // 🏟️ Ala 4 — Gramado da Final Eterna (900–950): prorrogação; frio + escuro + barulho
    ['cq_gramado_h1', 'dona_memoria', L(905, 'cq_craque', 940), 'cq_arquibancada_h3', '👻 Almost there',
      'Almost There Football Club lost every final by one goal. Beat 60 Trophyless Stars on the Eternal Final Pitch and show that losing teaches you too.',
      { kill: 'cq_craque', n: 60 }, 1, ingr(4),
      { fig: 't7', mais: 'Almost There FC reached ten finals and lost every one 1-0. Even so, they never gave up: the next day, they were back at practice. The Trophyless Star is good one-on-one and dodges long shots: get close!',
        fim: 'They laughed together and said: "Losing ten finals means reaching ten finals!" Keep the Almost There FC sticker.' }],
    ['cq_gramado_h2', 'dona_memoria', L(925, 'cq_tecnico', 945), 'cq_gramado_h1', '👻 The lineup for the final',
      'The Voiceless Coach lost his voice from so much shouting, but he still keeps the Clipboard of the Final. Beat the Coach on the Eternal Final Pitch and bring back the clipboard.',
      { item: 'cq_prancheta_final', n: 1, de: 'cq_tecnico', desc: 'Get the Clipboard of the Final back from the Voiceless Coach (Eternal Final Pitch)' }, 1, ingr(4),
      { mais: 'Clipboard Athletic was the most organized team in the Cup: the coach drew every play ahead of time. He sets up a formation that makes the players near him stronger: beat those players first.',
        fim: 'The lineup for the final! Look at the names: the best players from each forgotten team, together. They are... the Forgotten Eleven!' }],
    ['cq_gramado_h3', 'dona_memoria', 940, 'cq_gramado_h2', '👻 Extra time',
      'Seu Saudade wants to know if you’re ready for a final. Answer his questions, here in the stadium lobby.',
      { fala: 'seu_saudade', desc: 'Answer Seu Saudade’s questions (Forgotten Stadium lobby)' }, 0.8, ingr(3),
      { chegada: 'Seu Saudade carefully folds a jersey: "A final is different, star. Let’s see if you know how it ends."',
        depois: 'Perfect! You know your finals. Now the Star of the Final is waiting for you on the Field.',
        enigma: [
          { p: 'How long does extra time last?', ops: ['Two halves of 15 minutes', 'One half of 5 minutes', 'Until someone gets tired'], c: 0 },
          { p: 'From what distance is a penalty kick taken?', ops: ['5 meters', '11 meters', '30 meters'], c: 1 },
          { p: 'Who decides when the game is over?', ops: ['The referee, with the final whistle', 'The team that’s winning', 'The fans'], c: 0 },
        ] }],
    ['cq_gramado_chefe', 'seu_saudade', L(948, 'cq_craque_final', 950), 'cq_gramado_h3', '🏆 The Star of the Final',
      'The Star of the Final is the best player who never won a trophy. Beat the Star in the center circle of the Eternal Final Pitch: he wants to know if you’re worthy of the final.',
      { kill: 'cq_craque_final', n: 1 }, 1.8, ingr(10),
      { mais: 'The longer the duel lasts, the stronger he gets: it’s endless extra time! Bring the three best foods and don’t give up at the end.',
        fim: '"You’re worthy, star", he said. "But the real final only starts again with the first ball in the universe... the Origin Ball."' }],

    // 🏆 A final (depois da saga da Bola de Origem; volta toda semana)
    ['cq_gramado_onze', 'dona_memoria', 950, 'cq_gramado_chefe', '🏆 The final of the Forgotten Eleven',
      'With the Origin Ball, the final can start again! Beat the Forgotten Eleven in the Final Arena, on the Eternal Final Pitch, and give them the final whistle. They come back every week.',
      { kill: 'cq_onze', n: 1 }, 2, ingr(15),
      { fig: 'onze', final: true,
        mais: 'The Forgotten Eleven are the best players from each team: goalkeeper, defense and attack, each line with its own power. At the end comes the deciding play, with the trophy on the line. On your first win, the Forgotten Trophy is yours; after that, they come back every week, a little stronger.',
        fim: 'The final whistle blew! The Forgotten Eleven lifted the trophy together with you... and now they cheer for you in every arena!' }],
  ];

  // monta as missões com o que existe (personagem ou adversário que falta = a missão não entra e a corrente pula para a anterior)
  const CQ_HIST_IDS = new Set(), pula = {};
  const resolvePre = p => { while (p && pula[p] !== undefined) p = pula[p]; return p; };
  const existeNpc = id => !!NPCS[id];
  for (const [id, npc, lvl, pre, titulo, texto, req, k, itens, ex] of E) {
    const x = ex || {};
    const falta = !existeNpc(npc) || (req.fala && !existeNpc(req.fala)) || (req.kill && !MONSTROS[req.kill]) || (req.item && !ITENS[req.item]) || (req.de && !MONSTROS[req.de]) || MISSOES.some(q => q.id === id);
    if (falta) { pula[id] = pre; continue; }
    const q = { id, npc, lvl, titulo, texto, req: Object.assign({}, req), rec: cqHistR(lvl, k, itens), cqHist: true };
    const p = resolvePre(pre); if (p) q.pre = p;
    if (!x.opcional) q.principal = true;
    for (const c of ['mais', 'chegada', 'chegadaMais', 'depois', 'enigma', 'fim']) if (x[c]) q[c] = x[c];
    if (x.fig) q.cqFig = x.fig;
    if (x.final) { q.cqFinal = true; q.rec.flag = 'cq_campeao'; }
    if (q.req.kill && !q.req.desc) q.req.desc = `Beat ${q.req.n}x ${nomeMon(q.req.kill)} (${nomeAla(String(id).replace(/_(h\d|chefe|onze)$/, ''))})`;
    MISSOES.push(q); CQ_HIST_IDS.add(id);
  }
  const ehCq = q => !!(q && CQ_HIST_IDS.has(q.id));
  const cqQ = id => MISSOES.find(q => q.id === id);
  window.CQ_HIST_IDS = CQ_HIST_IDS;
  try { if (typeof mrxOrdena === 'function') mrxOrdena(); } catch (e) { }

  /* ---------- o ingresso abre o portal (flag cq_portal ao aceitar) ---------- */
  const marcaPortal = s => { if (s && s.flags && !s.flags.cq_portal) { const e = s.quests && s.quests.cq_ingresso; if (e && (e.s === 'ativa' || e.s === 'feita')) s.flags.cq_portal = true; } };
  {
    const _aceitaCq = aceitaMissao;
    aceitaMissao = function (q) {
      const r = _aceitaCq.apply(this, arguments);
      try {
        if (q && q.id === 'cq_ingresso' && G.save) { G.save.flags.cq_portal = true; log('🎟️ The yellowed ticket lit up: the Forgotten Portal, at the top of the Multiverse Stadium, is open!', 'l-xp'); salvar(); }
      } catch (e) { }
      return r;
    };
  }

  /* ---------- a final só com a Bola de Origem, e volta toda semana ---------- */
  const finalLiberada = s => !!(s && s.flags && (s.flags.cq_final_liberada || s.flags.saga_origem || (s.quests && s.quests.sg_f3 && s.quests.sg_f3.s === 'feita')));
  const semana = () => (typeof tarSemanaId === 'function' ? tarSemanaId() : String(Math.floor((Date.now() / 86400000 + 3) / 7)));
  // o portão da Arena da Final (copa_mapas.js) abre com cq_final_liberada: marcada aqui também, quando a saga terminou
  const marcaFinal = s => { if (s && s.flags && !s.flags.cq_final_liberada && finalLiberada(s)) { s.flags.cq_final_liberada = true; return true; } return false; };
  function cqHistViraSemana(s) {
    const e = s && s.quests && s.quests.cq_gramado_onze;
    if (e && e.s === 'feita' && e.sem && e.sem !== semana()) { delete s.quests.cq_gramado_onze; return true; }
    return false;
  }
  {
    const _stCq = statusMissao;
    statusMissao = function (q) {
      const r = _stCq.apply(this, arguments);
      if (q && q.cqFinal && (r === 'disponivel' || r === 'nivel') && !finalLiberada(G.save)) return 'bloqueada';
      return r;
    };
    const _ijCq = iniciarJogo;
    iniciarJogo = function (save) { try { marcaPortal(save); marcaFinal(save); cqHistViraSemana(save); } catch (e) { } return _ijCq.apply(this, arguments); };
    setInterval(() => { try { if (G.save && G.rodando) marcaFinal(G.save); if (G.save && G.rodando && cqHistViraSemana(G.save)) { G.uiSujo = true; log('🏆 The Forgotten Eleven are back on the Eternal Final Pitch! Dona Memória has this week’s final for you.', 'l-xp'); } } catch (e) { } }, 30000);
  }

  /* ---------- entregar: figurinha do time, taça na primeira final, semana da final ---------- */
  {
    const _entCq = entregaMissao;
    entregaMissao = function (q) {
      const primeira = q && q.cqFinal && G.save && !G.save.flags.cq_campeao;
      const r = _entCq.apply(this, arguments);
      try {
        if (ehCq(q)) {
          if (q.cqFig) cqHistGanhaFig(q.cqFig, '(a gift from Dona Memória)');
          if (q.cqFinal) {
            const e = G.save.quests[q.id]; if (e) e.sem = semana();
            if (primeira && ITENS.taca_esquecidos) { recebeItem('taca_esquecidos', 1); log('🏆 The Forgotten Trophy is yours!', 'l-lvl'); }
            banner('🏆 Origin Cup Champion!', 'The Forgotten lifted the trophy with you');
          }
          salvar();
        }
      } catch (e) { console.warn('cup story', e); }
      return r;
    };
  }

  /* ---------- conversas: falar com quem a missão manda, enigma, botões ---------- */
  const agora = () => Date.now();
  const fmtMin = ms => `${Math.max(1, Math.ceil(ms / 60000))} min`;
  const falaBox = (npc, ...ps) => el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, ...ps));
  const btnDiario = () => el('button', { class: 'btn', type: 'button', onclick: () => cqHistDiario() }, '📖 Stories of the Forgotten');
  function cqHistConclui(npc, q) {
    const e = G.save.quests[q.id]; e.p = 1;
    entregaMissao(q);
    const prox = MISSOES.find(x => ehCq(x) && x.pre === q.id && statusMissao(x) === 'disponivel');
    const ps = [el('p', {}, q.enigma ? (q.depois || q.chegada) : q.chegada)];
    if (q.chegadaMais && !q.enigma) ps.push(el('details', { class: 'mrx-mais' }, el('summary', {}, '📖 Learn more'), el('p', {}, q.chegadaMais)));
    abreModal(el('h2', {}, npc.d.nome), falaBox(npc, ...ps),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => abrirNPC(npc) }, prox && prox.npc === npc.id ? 'Continue' : 'OK'), btnDiario()));
  }
  function cqHistEnigma(npc, q) {
    const e = G.save.quests[q.id];
    if (e.erroAte && agora() < e.erroAte)
      return abreModal(el('h2', {}, npc.d.nome), falaBox(npc, el('p', {}, `"Think about it a little more and come back in ${fmtMin(e.erroAte - agora())}. Mistakes are part of it: those who don’t give up learn!"`)),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Bye!')));
    let i = 0;
    const pergunta = () => {
      const p = q.enigma[i];
      abreModal(el('h2', {}, `${npc.d.nome} — question ${i + 1} of ${q.enigma.length}`), falaBox(npc, el('p', {}, i === 0 ? q.chegada : 'Very good... what\'s next?'), el('p', {}, el('b', {}, p.p))),
        el('div', { class: 'opcoes' }, ...p.ops.map((o, k) => el('button', { class: 'btn', type: 'button', onclick: () => {
          if (k !== p.c) {
            e.erroAte = agora() + 3 * 60000; salvar(); som('erro');
            return abreModal(el('h2', {}, npc.d.nome), falaBox(npc, el('p', {}, '"Almost! That’s not quite right. Think calmly and come back in 3 minutes: I’ll wait for you."')), el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'OK')));
          }
          som('moeda'); i++; if (i < q.enigma.length) pergunta(); else cqHistConclui(npc, q);
        } }, o))));
    };
    pergunta();
  }

  // falas dos anfitriões (uma por vez, variando)
  const CQ_HIST_FALAS = {
    seu_saudade: [
      'Welcome to the Forgotten Stadium! I take care of the jerseys of every team here. Bring me Forgotten Tickets and I’ll trade them for pieces of the Forgotten Uniform.',
      'Every jersey in this locker room has a story. I wash, iron and put away every one, waiting for the day of the final.',
      'The ghosts here don’t scare anyone: they just want a good game. And they lose with a smile!',
      'Forgotten Tickets drop from the teams here when you play against them. Collect them and come trade with me!',
    ],
    dona_memoria: [
      'I saw every game of the Origin Cup, you know? Every team here has a story. Want to hear it?',
      'No team here ever won anything... but none of them gave up. That’s being a champion too, don’t you think?',
      'When you beat a team in a fair game, it remembers why it played. It’s the most beautiful thing to see!',
      'Have you looked at your Forgotten Album yet? Every sticker is a team that’s smiling again.',
    ],
  };
  for (const [id, l] of Object.entries(CQ_HIST_FALAS)) if (NPCS[id]) NPCS[id].ola = l[0];
  // o Seu Saudade mostra as figurinhas que faltam À VISTA (você escolhe e vê antes; nunca sorteio)
  function cqHistVitrine(npc) {
    const s = G.save; if (!s) return; const al = albumDe(s), tem = typeof contaItem === 'function' ? contaItem(ING) : 0;
    const falta = CQ_HIST_TIMES.filter(t => !t.final && !al[t.id]);
    const lista = el('div', { class: 'cq-vitrine' }, ...falta.map(t => el('div', { class: 'cq-vit-item' }, cqHistEscudo(t, 56),
      el('div', { class: 'cq-vit-txt' }, el('b', {}, t.nome), el('small', {}, CQ_HIST_ALAS[t.ala] || '')),
      el('button', { class: 'btn verde mini', type: 'button', disabled: tem < CQ_HIST_FIG_PRECO ? 'disabled' : null, onclick: () => {
        if (contaItem(ING) < CQ_HIST_FIG_PRECO) { log(`Not enough Forgotten Tickets: a sticker costs ${CQ_HIST_FIG_PRECO}.`, 'l-dano'); som('erro'); return; }
        removeItem(ING, CQ_HIST_FIG_PRECO); cqHistGanhaFig(t.id, '(traded with Seu Saudade)'); salvar(); cqHistVitrine(npc);
      } }, `${CQ_HIST_FIG_PRECO} 🎟️`))));
    abreModal(el('h2', {}, '🎴 Stickers on display'), falaBox(npc, el('p', {}, falta.length ? `I saved one sticker from each team! You see which one it is before you trade: ${CQ_HIST_FIG_PRECO} Forgotten Tickets each. You have ${tem}.` : 'You already have the sticker of every team here! The Forgotten Eleven one only comes from the final.')),
      falta.length ? lista : '', el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: () => window.cqHistAlbum() }, '👻 See the album'), el('button', { class: 'btn', type: 'button', onclick: () => abrirNPC(npc) }, 'Back')));
  }
  {
    const _abrirCq = abrirNPC;
    abrirNPC = function (npc) {
      // falar com quem a missão manda (e o enigma)
      try {
        if (G.save && npc && npc.d && !npc.d.quadro) {
          const q = MISSOES.find(x => ehCq(x) && x.req.fala === npc.id && statusMissao(x) === 'ativa');
          if (q) { npc.flip = G.p.x < npc.x; return q.enigma ? cqHistEnigma(npc, q) : cqHistConclui(npc, q); }
          const fl = CQ_HIST_FALAS[npc.id]; if (fl && npc.d) npc.d.ola = fl[Math.floor(Math.random() * fl.length)];
        }
      } catch (e) { console.warn('cup story', e); }
      const r = _abrirCq.apply(this, arguments);
      // o personagem pode ter outra janela na frente (o Orbitto, a troca do Seu Saudade): a missão da Copa ganha um botão
      try {
        const box = document.getElementById('modalConteudo'), ops = box && box.querySelector('.opcoes');
        if (ops && G.save && npc) {
          const q = MISSOES.find(x => ehCq(x) && x.npc === npc.id && ['disponivel', 'pronta', 'ativa'].includes(statusMissao(x)));
          if (q && !box.textContent.includes(q.titulo)) {
            const st = statusMissao(q); let b = null;
            if (st === 'disponivel') b = el('button', { class: 'btn amarelo', type: 'button', onclick: () => modalMissao(npc, q) }, `Mission: ${q.titulo}`);
            else if (st === 'pronta' && !q.req.fala) b = el('button', { class: 'btn amarelo', type: 'button', onclick: () => { entregaMissao(q); abrirNPCDepois(npc, q.fim); } }, `Turn in: ${q.titulo}`);
            else if (st === 'ativa') { const [a, n] = progressoMissao(q); b = el('button', { class: 'btn', type: 'button', onclick: () => modalMissoes() }, `${q.titulo}: ${descMissao(q)}${q.req.fala ? '' : ` — ${a}/${n}`}`); }
            if (b) ops.prepend(b);
          }
          if (npc.id === 'dona_memoria' || npc.id === 'seu_saudade') {
            const fim = ops.lastChild;
            if (npc.id === 'seu_saudade' && ITENS[ING]) ops.insertBefore(el('button', { class: 'btn', type: 'button', onclick: () => cqHistVitrine(npc) }, '🎴 Stickers on display'), fim);
            if (npc.id === 'dona_memoria') { ops.insertBefore(btnDiario(), fim); ops.insertBefore(el('button', { class: 'btn', type: 'button', onclick: () => window.cqHistAlbum() }, '👻 Forgotten Album'), fim); }
            // a final esperando a Bola de Origem
            const qf = cqQ('cq_gramado_onze'), fala = box.querySelector('.fala');
            if (npc.id === 'dona_memoria' && qf && fala && !finalLiberada(G.save) && statusMissao(cqQ('cq_gramado_chefe') || {}) === 'feita')
              fala.append(el('p', { class: 'dica' }, '🏆 The final of the Forgotten Eleven only starts again with the Origin Ball whole and awake ("The Origin Ball" saga, 📜 in the ☰ Menu).'));
            else if (npc.id === 'dona_memoria' && qf && fala && G.save.quests.cq_gramado_onze && G.save.quests.cq_gramado_onze.s === 'feita')
              fala.append(el('p', { class: 'dica' }, '🏆 You already played this week’s final. The Forgotten Eleven come back on Monday, a little stronger!'));
          }
        }
      } catch (e) { }
      return r;
    };
  }
  // a seta amarela também leva até quem a missão manda procurar (como no fio da Bola de Origem)
  {
    const _oaCq = objetivoAtual;
    objetivoAtual = function () {
      const r = _oaCq.apply(this, arguments);
      try {
        const s = G.save; if (!s || !G.guiaOn) return r;
        if (MISSOES.some(q => statusMissao(q) === 'pronta')) return r;
        const q = MISSOES.find(x => statusMissao(x) === 'ativa');
        if (ehCq(q) && q.req.fala && typeof alvoNpc === 'function') { const a = alvoNpc(q.req.fala); if (a) return a; }
      } catch (e) { }
      return r;
    };
  }

  /* ---------- objetos de missão só caem enquanto a missão pede; figurinhas caem jogando ---------- */
  {
    const objAtivo = id => MISSOES.some(q => ehCq(q) && q.req.item === id && statusMissao(q) === 'ativa' && contaItem(id) < q.req.n);
    const _matarCq = matar;
    matar = function (m) {
      const d = m && m.d; let guarda = null;
      try { if (d && Array.isArray(d.loot) && d.loot.some(l => CQ_HIST_OBJ[l[0]] && !objAtivo(l[0]))) { guarda = d.loot; d.loot = d.loot.filter(l => !CQ_HIST_OBJ[l[0]] || objAtivo(l[0])); } } catch (e) { }
      let r; try { r = _matarCq.apply(this, arguments); } finally { if (guarda) d.loot = guarda; }
      try {
        const t = m && CQ_HIST_TIME_DE[m.tipo];
        if (t && G.save && !albumDe()[t.id] && !t.final && Math.random() < (d && d.chefe ? 0.5 : CQ_HIST_FIG_CHANCE)) cqHistGanhaFig(t.id, `(dropped by ${nomeMon(m.tipo)})`);
      } catch (e) { }
      return r;
    };
  }

  /* ---------- 👻 Álbum dos Esquecidos (aba do Caderno do Craque) ---------- */
  function cqHistEscudo(t, px) {
    const c = document.createElement('canvas'); c.width = c.height = 128; c.className = 'cq-escudo'; c.style.width = c.style.height = px + 'px';
    const x = c.getContext('2d'), nome = t.final ? 'i_taca_esquecidos' : 'cq_escudo_' + t.n; // (os Onze: o ícone da taça)
    const pinta = () => {
      const im = typeof aSprite === 'function' ? aSprite(nome) : null; x.clearRect(0, 0, 128, 128);
      if (im) { const k = Math.min(120 / im.width, 120 / im.height); x.drawImage(im, 64 - im.width * k / 2, 64 - im.height * k / 2, im.width * k, im.height * k); return true; }
      // escudo desenhado (enquanto a arte não chega)
      x.fillStyle = t.cor; x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(20, 18); x.lineTo(108, 18); x.lineTo(108, 62); x.quadraticCurveTo(108, 100, 64, 118); x.quadraticCurveTo(20, 100, 20, 62); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = 'rgba(255,255,255,.9)'; x.font = 'bold 34px Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(t.final ? '★' : t.nome.split(' ').filter(w => w.length > 2).map(w => w[0]).join('').slice(0, 3).toUpperCase(), 64, 64);
      return false;
    };
    if (!pinta()) [500, 1500, 3500].forEach(ms => setTimeout(() => { if (document.body.contains(c)) pinta(); }, ms));
    return c;
  }
  function cqHistAlbum() {
    const s = G.save; if (!s) return; const al = albumDe(s), n = CQ_HIST_TIMES.filter(t => al[t.id]).length, total = CQ_HIST_TIMES.length;
    const grade = el('div', { class: 'cq-album' }, ...CQ_HIST_TIMES.map(t => {
      const tem = !!al[t.id];
      const dica = t.final ? 'Comes from the final of the Forgotten Eleven.' : `Drops from the team’s ghosts (${t.adv.map(nomeMon).join(', ')}) — ${nomeAla(t.ala)}. Or on display at Seu Saudade’s.`;
      return el('div', { class: 'cq-fig' + (tem ? ' tem' : ' falta') }, cqHistEscudo(t, 72), el('b', {}, tem ? t.nome : '???'),
        el('small', { class: 'cq-fig-ala' }, CQ_HIST_ALAS[t.ala] || ''), el('small', {}, tem ? t.txt : dica));
    }));
    const ops = el('div', { class: 'opcoes' });
    if (n >= total && !s.flags.cq_album) ops.append(el('button', { class: 'btn amarelo grande', type: 'button', onclick: () => {
      s.flags.cq_album = true; const R = cqHistR(950, 0, [[ING, 30]]); s.ouro += R.ouro; for (const [id, q] of R.itens) recebeItem(id, q);
      log(`👻 FORGOTTEN ALBUM COMPLETE! You got ${fmt(R.ouro)} coins${R.itens.length ? ' and 30 Forgotten Tickets' : ''}.`, 'l-lvl'); banner('Forgotten Album complete!', 'Every team remembered why they played'); som('nivel'); salvar(); window.cqHistAlbum();
    } }, 'Claim the album prize!'));
    abreModal.largo = true;
    abreModal(el('h2', {}, `👻 Forgotten Album (${n}/${total})`),
      el('p', { class: 'dica' }, 'One sticker for each team in the Origin Cup. They drop when you play against the team’s ghosts (bosses drop more), come as gifts in Dona Memória’s stories, or are on display at Seu Saudade’s, for Forgotten Tickets. No luck involved!'),
      ops, grade);
  }
  window.cqHistAlbum = cqHistAlbum;
  try { // a aba no Caderno do Craque
    if (typeof CDN_ABAS !== 'undefined' && !CDN_ABAS.some(a => a[0] === 'esquecidos')) {
      const aba = ['esquecidos', 'Forgotten', '👻', () => window.cqHistAlbum(), /^👻 (?:Álbum dos Esquecidos|Forgotten Album)/,
        () => !!(G.save && ((G.save.nivel || 1) >= 700 || Object.keys(G.save.cqAlbum || {}).length)), () => 700,
        s => { const al = (s && s.cqAlbum) || {}, n = CQ_HIST_TIMES.filter(t => al[t.id]).length; return { f: n / CQ_HIST_TIMES.length, t: `${n}/${CQ_HIST_TIMES.length}` }; }];
      CDN_ABAS.push(aba); if (typeof CDN_POR !== 'undefined') CDN_POR.esquecidos = aba;
      if (typeof cdnEmbrulha === 'function') cdnEmbrulha('cqHistAlbum', 'esquecidos');
    }
  } catch (e) { console.warn('forgotten album', e); }

  /* ---------- 📖 Histórias dos Esquecidos (o que a Dona Memória já contou) ---------- */
  function cqHistDiario() {
    const s = G.save; if (!s) return;
    const grupos = [['🎟️ The stadium', /^cq_(ingresso|memoria|pista_origem)$/], ...Object.entries(CQ_HIST_ALAS).map(([id, nome]) => [nome, new RegExp('^' + id + '_')])];
    const blocos = grupos.map(([nome, rx]) => {
      const qs = MISSOES.filter(q => ehCq(q) && rx.test(q.id)); if (!qs.length) return '';
      const linhas = []; let atual = null, feitas = 0;
      for (const q of qs) {
        const st = statusMissao(q);
        if (st === 'feita' || (q.cqFinal && s.flags.cq_campeao)) { feitas++; linhas.push(el('p', { class: 'sg-h' }, el('b', {}, q.titulo.replace(/^\S+ /, '') + ': '), q.req.fala ? (q.enigma ? (q.depois || q.chegada) : q.chegada) : (q.mais || q.texto))); if (q.fim) linhas.push(el('p', { class: 'sg-h sg-fim' }, q.fim)); continue; }
        if (!atual && st !== 'bloqueada') atual = q;
      }
      let ag = null;
      if (atual) { const st = statusMissao(atual); ag = st === 'nivel' ? `🔒 Continues at level ${atual.lvl}.` : st === 'disponivel' ? `👉 Talk to ${nomeNpc(atual.npc)}: ${atual.titulo.replace(/^\S+ /, '')}.` : st === 'pronta' ? `✅ Done! Talk to ${nomeNpc(atual.npc)} again.` : `👉 ${descMissao(atual)}${atual.req.fala ? '' : ` (${progressoMissao(atual).join('/')})`}.`; }
      return el('details', { class: 'sg-cap', open: atual && statusMissao(atual) !== 'nivel' ? 'open' : null }, el('summary', {}, `${feitas === qs.length ? '✅' : feitas || atual ? '📖' : '🔒'} ${nome} (${feitas}/${qs.length})`), ...linhas, ag ? el('p', { class: 'sg-agora' }, ag) : '');
    });
    abreModal(el('h2', {}, '📖 Stories of the Forgotten'),
      el('p', { class: 'dica' }, (s.nivel || 1) < 700 ? 'At level 700, Grand Guardian Orbitto (Multiverse Stadium) finds a very old ticket...' : 'The Origin Cup never ended. Every forgotten team has a story: Dona Memória remembers them all.'),
      ...blocos, el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: () => window.cqHistAlbum() }, '👻 Forgotten Album'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
  }
  window.cqHistDiario = cqHistDiario;

  /* ---------- ✨ a pista no Diário da Bola de Origem ---------- */
  {
    const _amCq = abreModal;
    abreModal = function () {
      const r = _amCq.apply(this, arguments);
      try {
        const box = document.getElementById('modalConteudo'), h = box && box.querySelector(':scope > h2');
        if (G.save && h && h.textContent === '📜 The Origin Ball' && !box.querySelector('.cq-pista')) {
          const s = G.save, feita = s.quests.cq_pista_origem && s.quests.cq_pista_origem.s === 'feita';
          const txt = feita ? '🎟️ Forgotten Cup clue: the final of the Origin Cup stopped when this ball broke apart. With the whole Origin Ball, the final can start again (Dona Memória, at the Forgotten Stadium).'
            : (s.nivel || 1) >= 700 && cqQ('cq_pista_origem') ? '🎟️ New clue: at the Forgotten Stadium (portal at the top of the Multiverse Stadium), Dona Memória knows something about the first ball.' : null;
          if (txt) { const p = el('p', { class: 'sg-agora cq-pista' }, txt), ref = box.querySelector('.ofi-pistas') || box.querySelector('p.dica'); if (ref) ref.after(p); else h.after(p); }
        }
      } catch (e) { }
      return r;
    };
  }

  /* ---------- v410: o "como chegar" sempre acha o caminho até o estádio e as alas ----------
     O portal do Multiverso para o saguão (copa_mapas.js, porta 38,6 → 28,38) só é montado a partir do nível 700 / flag
     cq_portal; o índice de rotas (indice().grafo) é montado uma vez só, às vezes antes disso, e ficava sem a ligação:
     a s1 reprovava "sem caminho até cq_vestiario". Aqui a ligação Multiverso → Estádio dos Esquecidos entra sempre no
     grafo (só para as rotas; quem abre a porta de verdade continua sendo o copa_mapas.js), e a viagem diz o portal. */
  const CQ_HIST_PORTA_MV = { x: 38.5, y: 6.5 };
  const cqHistLigaGrafo = I => {
    try {
      if (!I || !I.grafo || !MAPAS_DEF.cq_estadio || !MAPAS_DEF.multiverso) return I;
      const g = I.grafo.multiverso || (I.grafo.multiverso = []);
      if (!g.some(e => e.para === 'cq_estadio')) g.push({ para: 'cq_estadio', x: CQ_HIST_PORTA_MV.x, y: CQ_HIST_PORTA_MV.y, cqHist: true });
    } catch (e) { }
    return I;
  };
  {
    const _idxCq = indice;
    indice = function () { return cqHistLigaGrafo(_idxCq.apply(this, arguments)); };
    if (typeof INDICE !== 'undefined' && INDICE) cqHistLigaGrafo(INDICE);
    try { if (typeof CC_REG !== 'undefined' && CC_REG && CC_REG.de && CC_REG.de.cq_estadio !== CC_REG.de.multiverso) CC_REG = null; } catch (e) { } // (regiões contadas sem a ligação)
  }
  if (typeof ccRota === 'function') {
    const _rotaCq = ccRota;
    ccRota = function (mapa) {
      const r = _rotaCq.apply(this, arguments);
      try {
        if (r && r.caminho && /^cq_/.test(mapa || '') && !/^cq_/.test(r.aqui || '')) {
          const i = r.caminho.indexOf('cq_estadio');
          if (i > 0 && r.caminho[i - 1] === 'multiverso' && !/Estádio dos Esquecidos/.test(r.viagem || ''))
            r.viagem = (r.viagem ? r.viagem + ' ' : '') + '🏟️ In the Multiverse, go through the Forgotten Stadium Portal (level 700).';
        }
      } catch (e) { }
      return r;
    };
  }

  /* ---------- avisos das pressões das alas (ao entrar) ---------- */
  const CQ_HIST_PRESSAO = {
    cq_vestiario: '🥶 Brrr, it’s cold in the Abandoned Locker Room! You get tired faster here. Stamina food helps you hold on.',
    cq_tunel: '🌑 The Players’ Tunnel is really dark: you can only see up close. Vision and focus food help you see farther.',
    cq_arquibancada: '📣 So noisy in the Infinite Stands! Your focus drains faster here. Focus food helps.',
    cq_gramado: '🌫️ On the Eternal Final Pitch it’s cold, dark and noisy, all at once! Bring the three best foods: stamina, vision and focus.',
  };
  const CQ_HIST_ENTRADA = {
    cq_estadio: '🎟️ Forgotten Stadium: the teams that never won anything play here. Talk to Seu Saudade and Dona Memória!',
  };
  window.CQ_TEXTOS = { pressao: CQ_HIST_PRESSAO, entrada: CQ_HIST_ENTRADA, alas: CQ_HIST_ALAS, times: CQ_HIST_TIMES };
  {
    const visto = {};
    const _entCq = entrarMapa;
    entrarMapa = function (id) {
      const r = _entCq.apply(this, arguments);
      try {
        const m = G.mapa && G.mapa.id, t = CQ_HIST_PRESSAO[m] || CQ_HIST_ENTRADA[m];
        if (t && G.save && G.rodando && !window.CQ_PRESSAO_SEM_AVISO && (!visto[m] || Date.now() - visto[m] > 10 * 60000)) {
          visto[m] = Date.now(); log(t, 'l-sis'); if (typeof avisoTela === 'function') avisoTela(t, 'l-sis');
        }
      } catch (e) { }
      return r;
    };
  }

  /* ---------- falas dos adversários (Bestiário), se a frente das mecânicas não pôs ---------- */
  const CQ_HIST_FALAS_MON = {
    cq_reserva: ['Is it my turn yet?', 'I’m warmed up, coach!', 'Put me in!'],
    cq_massagista: ['Zzz... did you stretch?', 'Zzz... ice on the knee...', 'Nobody gets hurt here!'],
    cq_gandula: ['Got the ball!', 'Nobody can catch me!', 'Zoom!'],
    cq_zagueiro: ['You shall not pass!', 'Zero-zero again!', 'The Wall!'],
    cq_bandeirinha: ['Offside!', 'Flag up!', 'It’s on the line!'],
    cq_arbitro: ['Tweeet!', 'Play fair, okay?', 'Where’s my whistle?'],
    cq_torcida: ['Uh, uh, uh!', 'Olê, olê, olá!', 'Go, team!'],
    cq_bumbo: ['BOOM!', 'BOOM-BOOM-BOOM!', 'Thump-thump!'],
    cq_mascote: ['Where’s my team?', 'I won’t let go of the flag!', 'Hug?'],
    cq_craque: ['So close!', 'I’ll win the next one!', 'One more final!'],
    cq_goleiro: ['Saved it!', 'Save number 1,001!', 'Go ahead, shoot!'],
    cq_tecnico: ['...!', '(points at the clipboard)', '(gives a thumbs-up)'],
    cq_cap_vestiario: ['Nobody gives up!', 'Good game!', 'Come on, team!'],
    cq_xerife_tunel: ['Only fair players get through here!', 'Rules are rules!', 'You may pass... if you beat me!'],
    cq_rei_arquibancada: ['Sing, stands!', 'Champions!', 'Louder!'],
    cq_craque_final: ['Extra time is mine!', 'It’s not over yet!', 'What a game!'],
    cq_onze: ['For the Origin Cup!', 'All together!', 'Blow the whistle, ref!'],
  };
  for (const [id, f] of Object.entries(CQ_HIST_FALAS_MON)) { const d = MONSTROS[id]; if (d && !(d.falas && d.falas.length)) d.falas = f; }

  /* ---------- capítulos curtos (arte que já existe; a frente ARTE pode trocar em window.CQ_CAP_IMG) ---------- */
  if (typeof CAPITULOS !== 'undefined' && typeof CAPITULOS_ORDEM !== 'undefined') {
    const hn = n => (typeof _hn === 'function' ? _hn(n) : (n || 'you'));
    const img = (k, padrao) => () => (window.CQ_CAP_IMG && window.CQ_CAP_IMG[k]) || padrao;
    const cena = (k, padrao, o) => Object.defineProperty(o, 'img', { get: img(k, padrao), enumerable: true });
    CAPITULOS.cq_copa = {
      rotulo: 'Chapter 13', titulo: 'The Forgotten Cup', emoji: '🎟️', implica: ['multiverso'],
      cond: (s, mapa) => /^cq_/.test(mapa || ''),
      cenas: [
        cena('ingresso', 'cap_mv_1', { kb: 'kb-a', cor: ['#140a40', '#ffb04a'], txt: n => 'At the Multiverse Stadium, Orbitto found an old, yellowed ticket on the ground: "Origin Cup — Final". And the sealed portal started to glow!' }),
        cena('estadio', 'cap_gloria_4', { kb: 'kb-zoom', foco: '60% 22%', cor: ['#140a40', '#3a2780'], txt: n => 'On the other side was a stadium outside of time. Before the first ball in the universe broke apart, the Origin Cup was played there... and the final never ended.' }),
        cena('times', 'cap_clube_estadio_0', { kb: 'kb-b', cor: ['#c89a5a', '#6a4a2a'], txt: n => 'The teams that never won anything stayed there, playing forever, waiting for the final whistle. They became ghosts... but friendly ghosts who just want to play soccer!' }),
        cena('anfitrioes', 'cap_clube_torcida_3', { kb: 'kb-a', cor: ['#1a2a6a', '#5a8ad8'], txt: n => `Seu Saudade, the kit manager, and Dona Memória, the oldest fan, had been waiting for someone for a very long time. "Welcome, ${hn(n)}! Shall we help these teams remember why they played?"` }),
      ],
      final: { emoji: '🎟️', titulo: 'The Forgotten Cup', sub: n => 'Chapter 13 has begun! Help each forgotten team remember why they played (levels 700 to 950). Don’t give up: they never gave up either.', botao: 'Let\'s play! ⚽' },
    };
    CAPITULOS.cq_taca = {
      rotulo: 'Epilogue', titulo: 'The trophy, at last', emoji: '🏆', implica: ['multiverso', 'cq_copa'],
      cond: s => !!(s.flags && s.flags.cq_campeao),
      cenas: [
        cena('final', 'cap_mv_1', { kb: 'kb-zoom', foco: '22% 70%', cor: ['#140a40', '#ffb04a'], txt: n => 'On the Eternal Final Pitch, the Origin Ball rolled again. The Forgotten Eleven played the best game of their lives.' }),
        cena('apito', 'cap_gloria_4', { kb: 'kb-d', cor: ['#140a40', '#3a2780'], som: 'gol', txt: n => 'And then... TWEEEEET! The Whistle of the Final blew, after such a long, long time. The final of the Origin Cup was finally over.' }),
        cena('taca', 'cap_clube_torcida_3', { kb: 'kb-a', cor: ['#1a2a6a', '#5a8ad8'], txt: n => `The Forgotten lifted the trophy together with ${hn(n)}. Bench United, Wall FC, Almost There FC... all smiling. Nobody there had ever given up.` }),
        cena('torcida', 'cap_clube_torcida_3', { kb: 'kb-zoom', foco: '50% 40%', cor: ['#1a2a6a', '#5a8ad8'], txt: n => 'And now, in every arena, a crowd of mist fans sings your name. The Forgotten became your fans!' }),
      ],
      final: { emoji: '🏆', titulo: 'The trophy, at last', sub: n => `Origin Cup Champion${n ? ', ' + n : ''}! The Forgotten Eleven come back every week for another final.`, botao: 'The legend continues... ⚽' },
    };
    const ord = CAPITULOS_ORDEM;
    for (const [id, depois] of [['cq_copa', 'jurassico'], ['cq_taca', 'origem_fim']]) {
      if (ord.includes(id)) continue; const i = ord.indexOf(depois), ig = ord.indexOf('gloria');
      ord.splice(i >= 0 ? i + 1 : (ig >= 0 ? ig : ord.length), 0, id);
    }
  }

  const css = document.createElement('style');
  css.textContent = `
  .cq-album { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin-top: 8px; }
  .cq-fig { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px; border-radius: 10px; background: rgba(120,140,190,.14); text-align: center; font-size: 12px; line-height: 1.3; }
  .cq-fig.tem { background: linear-gradient(180deg, rgba(220,230,255,.55), rgba(180,200,240,.25)); box-shadow: inset 0 0 0 2px rgba(140,160,220,.5); }
  .cq-fig.falta .cq-escudo { filter: grayscale(1) brightness(.6); opacity: .45; }
  .cq-fig b { font-size: 13.5px; } .cq-fig-ala { font-weight: 700; opacity: .75; }
  .cq-vitrine { display: flex; flex-direction: column; gap: 6px; margin: 6px 0; }
  .cq-vit-item { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 8px; background: rgba(0,0,0,.05); }
  .cq-vit-txt { flex: 1; display: flex; flex-direction: column; font-size: 13px; }
  @media (max-width: 760px) { .cq-album { grid-template-columns: repeat(2, 1fr); } }`;
  document.head.append(css);
  window.CQ_HIST = { CQ_HIST_TIMES, CQ_HIST_IDS, cqHistAlbum, cqHistDiario, cqHistGanhaFig, cqHistVitrine, finalLiberada, cqHistViraSemana };
}
