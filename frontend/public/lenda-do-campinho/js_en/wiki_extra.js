/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📖 WIKI — ABAS NOVAS (v376, dono: "atualize o wiki do site"). O Wiki (📖, tela inicial e ☰ Mais) tinha só os adversários
   e o que eles deixam cair. Agora tem abas, todas lidas dos DADOS do jogo (ficam certas sozinhas quando algo muda):
     👾 Adversários e drops (a de sempre) · 🐾 Mascotes · 👑 Caçada Épica · ✨ Refino e relíquias · 📰 Novidades
   Funciona também na tela inicial (sem jogo carregado): aí mostra as regras, sem o "seu" progresso.
   Carregar NO FIM (depois de wiki.js, mascotes.js, cacada_epica.js, brilho_refino.js e torre_infinita.js).
   ============================================================ */
{
  const ABAS = [['drops', '📚 Bestiary'], ['mascotes', '🐾 Pets'], ['epica', '👑 Epic Hunt'], ['reliquias', '✨ Upgrades and relics'], ['novo', '📰 What\'s New']];
  const pctW = v => `${Math.round(v * 1000) / 10}%`;
  const temSave = () => !!(G && G.save);
  // uma arte do jogo (sprite) num canvas pequeno; se ainda não carregou, tenta de novo depois
  function figura(nome, alt = 64) {
    const c = document.createElement('canvas'); c.className = 'wx-fig'; c.height = alt; c.width = alt; c.style.width = alt + 'px'; c.style.height = alt + 'px'; c.dataset.spr = nome;
    const pinta = () => { const im = typeof aSprite === 'function' ? aSprite(nome) : null; if (!im) return false; c.width = Math.round(alt * im.width / im.height); c.height = alt; c.style.width = c.width + 'px'; c.style.height = alt + 'px'; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return true; };
    if (!pinta()) [400, 1200, 2500, 5000].forEach(ms => setTimeout(() => { if (document.body.contains(c) && !c.dataset.ok && pinta()) c.dataset.ok = '1'; }, ms)); else c.dataset.ok = '1';
    return c;
  }
  const secao = (titulo, ...filhos) => el('details', { class: 'wk-lugar', open: 'open' }, el('summary', {}, titulo), el('div', { class: 'wx-sec' }, ...filhos));

  /* ---------- 🐾 Mascotes ---------- */
  function abaMascotes() {
    const out = [el('div', { class: 'wk-nota' }, el('b', {}, 'How it works: '), 'pick ONE pet in Equipment → ✨ Cosmetics. It follows you, levels up hunting with you (each opponent at your level = 1 point; boss = 10; only opponents up to 30 levels below yours count) and gives your player a BONUS that grows as it evolves: ',
      el('b', {}, MASC_FASES.map(f => `${f.nome} (level ${f.nv}): ${Math.round(f.k * 100)}% of the bonus`).join(' → ')), `. Max level: ${MASC_MAX}.`)];
    // pontos para cada fase
    let soma = 0; const marcos = {}; for (let n = 1; n < MASC_MAX; n++) { soma += mascPontosNivel(n); if (n + 1 === 10 || n + 1 === 25 || n + 1 === MASC_MAX) marcos[n + 1] = soma; }
    out.push(el('p', { class: 'wx-p' }, `Wins (at your level) to evolve: Young ≈ ${fmt(marcos[10])} · Adult ≈ ${fmt(marcos[25])} · level ${MASC_MAX} ≈ ${fmt(marcos[MASC_MAX])}.`));
    const grade = el('div', { class: 'wx-grade' });
    for (const o of (ADORNOS2.OPCOES.mascote || [])) {
      const [id, nome, emo, regra, desc] = o, M = MASC[id]; if (!M) continue;
      const base = (id === 'caramelo' ? 'pet_caramelo2' : `pet_${id}`), q = ['arara', 'dragao', 'corujinha'].includes(id) ? '_c1' : '_p', artes = [`pet_${id}_f${q}`, `${base}${q}`, `pet_${id}_a${q}`]; // (parados; os que voam, batendo asa)
      let meu = null; if (temSave()) { try { if (ADORNOS2.liberado('mascote', id)) { const d = mascDados(id); meu = `Yours: level ${d.nv} (${MASC_FASES.filter(f => d.nv >= f.nv).pop().nome})`; } } catch (e) { } }
      grade.append(el('div', { class: 'wx-card' },
        el('div', { class: 'wx-figs' }, ...artes.map((a, i) => el('div', {}, figura(a, [40, 52, 62][i]), el('small', {}, MASC_FASES[i].nome)))),
        el('b', {}, `${emo} ${nome}`), el('div', { class: 'wx-bonus' }, `Bonus: +${pctW(M.v)} ${M.txt} (adult)` + (id === 'dragao' ? ' — just for looks: uses your Macaw\'s bonus (and level)' : '')), /* v407 (Raio-X T3) */
        el('div', { class: 'wx-small' }, MASC_FASES.map(f => `${f.nome} +${pctW(M.v * f.k)}`).join(' · ')),
        el('div', { class: 'wx-small' }, '🔓 ' + String(regra.txt || '').replace(/^🔒\s*/, '')), el('i', { class: 'wx-small' }, desc),
        meu ? el('div', { class: 'wx-meu' }, meu) : ''));
    }
    out.push(grade);
    return out;
  }

  /* ---------- 👑 Caçada Épica ---------- */
  function abaEpica() {
    const ecos = ceEcosDaSemana(), out = [];
    out.push(el('div', { class: 'wk-nota' }, el('b', {}, 'How it works: '), `from level ${CE_NIVEL} (after the Intergalactic Cup). Every Monday, 3 legendary bosses come back as ECHOES of the Multiverse, with the strength of YOUR level and a power of the week. You have ${Math.round(CE_TEMPO / 60000)} minutes per fight, in the Echo Arena (talk to Estela the Hunter, at the Multiverse Stadium, or 🎯 Hunt Tasks → 👑 Epic). They all have a SHOCKWAVE (get out of the red circle) and a CHARGE, and they get furious at half health.`));
    out.push(secao('📅 This week\'s Echoes', el('div', { class: 'wx-grade' }, ...ecos.map((e, i) => { const d = MONSTROS[e.base], a = CE_AFIXOS[e.afixo];
      return el('div', { class: 'wx-card' }, d && d.look && d.look.spr ? figura(d.look.spr, 70) : '', el('b', {}, `${i + 1}. ${String((d && d.nome) || e.base).split(',')[0]}, Echo of the Multiverse`), el('div', { class: 'wx-bonus' }, a.nome), el('div', { class: 'wx-small' }, a.dica)); }))));
    out.push(secao('⚡ Powers of the week', el('div', { class: 'wx-lista' }, ...Object.values(CE_AFIXOS).map(a => el('div', {}, el('b', {}, a.nome + ': '), a.dica)))));
    out.push(secao('🎁 Prizes', el('div', { class: 'wx-lista' },
      el('div', {}, el('b', {}, 'Each Echo (1st win of the week): '), `XP, coins and ${CE_FICHAS} Tower Tokens (and a small chance of a Multiverse piece). Fight again: +1 Token.`),
      el('div', {}, el('b', {}, 'All 3 Echoes of the week: '), `1 Epic Hunter Seal, +${CE_FICHAS_SELO} Tokens and a Tower Chest.`),
      el('div', {}, el('b', {}, 'Name frames (Equipment → ✨ Cosmetics): '), CE_MOLDURAS.map(f => `${f.nome} (${f.selos} seal${f.selos > 1 ? 's' : ''})`).join(' · '), '. You can only get them by hunting: they\'re not for sale.'),
      temSave() ? el('div', { class: 'wx-meu' }, `You: ${ceDados().feitos.length}/3 Echoes this week · ${ceDados().selos || 0} seal(s)`) : '')));
    out.push(secao('🐉 Bosses that can echo', el('div', { class: 'wx-small' }, cePool().map(id => String(MONSTROS[id].nome).split(',')[0]).join(' · '))));
    return out;
  }

  /* ---------- ✨ Refino e relíquias ---------- */
  function abaReliquias() {
    const out = [];
    out.push(secao('✨ Upgrade glow on your character (regular pieces)', el('div', { class: 'wx-lista' },
      el('div', {}, el('b', {}, '+7: '), 'a flash of light sweeps across the piece every now and then.'),
      el('div', {}, el('b', {}, '+8: '), 'the piece glows in its rarity color, pulsing slowly.'),
      el('div', {}, el('b', {}, '+9: '), 'strong glow and sparks rising from the piece.'),
      el('div', {}, el('b', {}, '+10: '), 'the piece LIGHTS UP (the +10 cleats leave a trail of light).'),
      el('div', {}, el('b', {}, 'Legendary set: '), 'all 6 pieces at +10 → golden aura around your whole character and a golden glow on the ground.'))));
    const MARCA_TXT = {
      chuteira_deuses: 'little wings on your heels (like the winged sandals); they flap faster when you run.',
      caneleira_infinito: 'an ice-blue ∞ symbol on each shin.',
      camisa_multiverso: 'twinkling little stars on the galaxy jersey.',
      calcao_cosmico: 'a thin ring of stardust spinning around your waist.',
      amuleto_lenda: 'the pendant shoots short rays of light.',
      coroa_eterna: 'the crown\'s jewels sparkle.',
    };
    out.push(el('div', { class: 'wk-nota' }, el('b', {}, 'Relics '), 'don\'t use the upgrade glow: each one has ITS OWN mark on your character, subtle at +0 and stronger and stronger up to +10 (one piece = just one effect, so your character doesn\'t turn into a Christmas tree). They count toward the +10 legendary set.'));
    out.push(el('div', { class: 'wx-grade' }, ...RELIQUIAS.map(([id, nome, slot, L, andar]) => { const it = ITENS[id]; const ic = (typeof iconeItem === 'function' && typeof iconeClone === 'function') ? iconeClone(iconeItem(id)) : el('span', {}, '🏺'); ic.className = 'wk-ic';
      return el('div', { class: 'wx-card' }, el('div', { class: 'wx-cab' }, ic, el('b', {}, nome)), el('div', { class: 'wx-small' }, `Level ${L} · Guardian of floor ${andar} of the Infinite Tower (level ${typeof torreNivel === 'function' ? torreNivel(andar) : '?'})`),
        el('div', { class: 'wx-bonus' }, '✨ ' + (MARCA_TXT[id] || 'its own mark on your character')), temSave() && G.save.flags && G.save.flags['guardiao_' + id] ? el('div', { class: 'wx-meu' }, '✅ You already beat this Guardian') : ''); })));
    if (typeof DESPERTAR !== 'undefined') {
      const D = DESPERTAR;
      out.push(secao('🌟 The Relic Awakening', el('div', { class: 'wk-nota' }, el('b', {}, 'With Master Altina (Infinite Tower): '), `1) use the relic for ${fmt(D.DESP_KILLS)} wins (at your level); 2) offer ${D.DESP_FRAG} Awakening Fragments (dropped by level 400+ bosses and by the Echoes of the week); 3) beat the Awakened Guardian (8 minutes, in the Echo Arena); 4) CHOOSE one of 3 bonuses to lock onto your character, forever. The awakened relic gets a golden version of its mark.`),
        el('div', { class: 'wx-grade' }, ...RELIQUIAS.map(([id, nome]) => { const c = D.DESP[id]; if (!c) return ''; const dd = temSave() && G.save.despertar && G.save.despertar[id]; const b = dd && dd.bonus && c.bonus.find(x => x[0] === dd.bonus);
          return el('div', { class: 'wx-card' }, el('b', {}, nome), el('div', { class: 'wx-small' }, `Awakened Guardian: ${String((MONSTROS[c.base] || {}).nome || c.base).split(',')[0]} · ${CE_AFIXOS[c.afixo].nome}`), el('div', { class: 'wx-bonus' }, 'Choose 1: ' + c.bonus.map(x => x[2]).join(' · ')), dd && dd.desperta ? el('div', { class: 'wx-meu' }, `🌟 Awakened${b ? ' — ' + b[2] : ''}`) : ''); }))));
    }
    return out;
  }

  /* ---------- 📰 Novidades ---------- */
  const NOVIDADES = [
    // v410 (aprovado pelo dono, frente MISSÕES/TEXTOS): Copa dos Esquecidos (js/copa_historia.js e as outras frentes copa_*)
    ['v410', '🎟️ THE FORGOTTEN CUP! At level 700, Orbitto finds an old ticket and the sealed portal of the Multiverse Stadium opens. On the other side is a stadium outside of time, where the teams that never won anything still play the Origin Cup. They’re friendly ghosts! With Seu Saudade and Dona Memória, help each team remember why they played, across 4 wings (levels 700 to 950), with questions about the rules of soccer. After the Origin Ball, the Final of the Forgotten Eleven comes back every week. And there’s the Forgotten Album in the Star’s Notebook. Also: tapping a mission (in the corner of the screen or in the Missions window) shows where to find the opponent and how to get there.'],
    // v408.3 (ECA Digital, Lei 15.211/2025): nada de pagar por sorteio (js/figurinha_vista.js)
    ['v408.3', '🃏 STICKERS IN SIGHT! Seu Juca\'s newsstand now has a DISPLAY CASE with 3 stickers missing from your album: you see which one it is before you buy (120 coins each). The surprise pack isn\'t sold anymore; it still comes as a GIFT (Cup, challenges, daily reward) and, when you open it, the sticker shows up right away. In the Tasks shop, the trade stickers are also shown up front.'],
    // v408 (Raio-X I3, frente MISSÕES/TEXTOS): Passaporte do Craque (js/passaporte.js)
    ['v408', '🛂 STAR\'S PASSPORT! In 29 places (from the Village to the Jurassic Valley, through the cities of the world, Atlantis and the planets), a local asks 3 questions about the place: monuments, countries, oceans, planets, dinosaurs and the rules of soccer. Got all 3 right? You get a stamp and some coins! Got one wrong? Read the explanation and try again in 1 minute. With 5, 15 and all the stamps you earn titles, and at the end the Traveler\'s Frame. Look for the 🛂 button in conversations, open the passport in the ☰ Menu and start with Dona Zuleide, at the Village Travel Agency (level 8). ⚽ Seu Juca\'s quiz got new questions about the rules and fair play.'],
    // v408 (Raio-X I5, frente MISSÕES): a Bola de Origem como fio da história desde o nível 1 (js/origem_fio.js)
    ['v408', '✨ A MYSTERY FROM THE VERY START! Your leather ball has seven little dots that glow at night... Mom and Seu Zé tell the legend, and the clues follow you: in Cairo, in Lisbon, in Atlantis (4 new story missions) and in Space (2 on each planet), all the way to Dr. Estela and the Origin Ball saga. 📜 The Origin Ball Journal (☰ Menu) shows all the clues. 🎬 New chapters: "The beginning of the mystery", "The Jurassic Valley" and the end of the saga. If you\'ve already passed these regions, you get the clues as keepsakes in the journal.'],
    // v407 (Raio-X): avaliação completa do jogo; uma frase por assunto, para o jogador
    ['v407', '🌟 BIG CLEANUP! 🖥️ Wider, cleaner game screen on computer. 🎵 New music on the title screen and new sounds. 💬 Conversations with character portraits. 🗺️ Rio de Janeiro got a makeover and maps open faster. 📅 "Today" card with 3 daily goals and a chest. 🔥 Missed a day? Your streak is kept safe. 🏟️ Arena bosses all day long. 📖 Missions show the story first, with filters and "Learn more"; hunts and collections ask for less. 📍 Item missions show where to get each item, close to your level. ⚖️ From level 300 on, every win is worth more, the classes are balanced and endgame upgrades got much cheaper. 🧪 Stamina Bottles heal part of your stamina. ⚔️ In your Profile: your Power and where it comes from. 🛡️ More safety: invites only from friends, invisible mode and a report button. 🎒 New tips teach you how the backpack works. 🕴️ Agency: the kids develop much faster (training really gives +1 to +2, they get less tired and they improve by playing for their club); a 5★ reaches overall 16 in about 6 months of game time.'],
    ['v406', '🪟 Dragging panels got easier: while you drag, the empty column becomes a target as tall as the whole screen (before, it was just a little square at the top, and if you dropped a panel in the middle of the screen you couldn\'t move the panels back to the right). You can also drop below the last panel in a column.'],
    ['v405', '📚 BESTIARY (N key, or Menu → Collection): each creature has 3 stages unlocked by your wins — 1st win: name and where it lives (with the route); 25: stamina, attack, XP and the items it drops; 250: item drop chances and Bestiary Points (bosses: 1 / 3 / 5 wins). With the points you buy bonuses against a completed creature: +5% damage, +5% XP and +10% item chance. The wins you already had count! The Bestiary replaces the Wiki\'s opponent list. Shift + click on a creature shows your progress.'],
    ['v404', '💾 The game now remembers whether you play in DRIBBLE or SHOT mode (X key): when you come back, it stays on the last one you used. (Target priority — Close, Strong, Weak, Stamina — was already saved.)'],
    ['v403', '🎒 Each backpack window can now be made SMALLER: drag the little handle at the bottom of the window up or down (it snaps to whole rows and the rest scrolls inside). Each backpack remembers its size. Double-click the handle to go back to full size.'],
    ['v402', '🎒 The Field Backpack got its own art. 🎽 Equipment: the slots got a little smaller and the names no longer hide under the next slot; the order on the right side is back to Neck, Backpack, Shorts and Cleats (the cape and wings were confusing). ⚽ Slimmer Skills: one thin line per skill, with the value on the right, the bonus small and green, and a little bar showing how much is left.'],
    ['v401', '🔊 New boss sounds: they come in ROARING (human bosses come in with the crowd cheering), every boss hit that lands on you makes a THUD, and the rage (when it gets angry), the stomp that shakes the ground and the boss\'s fall now have real recorded sounds. King Rex from the Dinosaur Valley also roars when he wakes up.'],
    ['v400', '👁️ LOOK (Shift + click): on an item (backpack, equipment, hotbar) the chat describes its name, rarity, stats, level, weight and what it\'s for; on the map, it tells you who the opponent is (level and whether it\'s strong for you), what the character does (shop, new mission), who the other player is, the signs and even yourself. The "Backpack" box is gone (backpacks are in the 🎒 Backpacks column; the I key takes you there). 🎽 Equipment: the backpack is now a slot on the character, like the other items (drag another backpack onto it to swap); Attack/Defense/Speed are in the status. ✨ Cosmetics moved to the top of the page. ⚽ Skills got a new look.'],
    ['v399', '🎒 Simpler backpacks: RIGHT-CLICK a backpack to open it; every item that goes into a backpack goes into the first slot; when the backpack fills up, new items go into the backpack inside it (and the one inside that...). Each slot now holds up to 999 of the same item. The weight you carry shows in the title of the first backpack and your CAP in the new status panel (with Attack, Defense and Speed). 🚪 The map loading screen is gone: the game no longer stops when you change maps.'],
    ['v398', '🪟 Arranging panels is now free: drag a panel (⠿) and drop it on another one to place it ABOVE or BELOW it (the yellow line shows where). Joining panels as tabs now only happens on purpose, by dropping on the ⊕ that appears in the middle of the panels. The empty columns on the sides show up as places to drop.'],
    ['v397', '⚙️ Real SETTINGS: ⚙️ button at the top (or Esc): Sound, Video, Interface, Game, Keys, Online, Accessibility and Account, all in one place. What\'s new: master volume and zoom are saved; turn on/off the yellow arrow, tips, damage numbers, names, opponent health, effects and weather; text size and colorblind colors. ☰ The old More button became a grid MENU with groups (Character, Adventure, Social, Collection, Help).'],
    ['v396', '🎒 New backpacks: your main backpack goes on your BACK (new slot in Equipment — drag another backpack there to swap; the old one goes inside the new one with everything in it). On computer, open backpacks stay in a column on the right (minimize, close, go back ↑ and reorder by dragging the title). Stacks of up to 100 per slot: Shift + drag (or ✂️ Split) separates part of it; dropping a stack on top of a matching one merges them. Players who were already playing got the Field Backpack (30 slots) with everything inside.'],
    ['v395', '⚡ Faster map entry: the ground of neighboring maps gets ready while you play (by the time you go through the door, it\'s done) and the loading screen only shows up on heavy maps that aren\'t ready yet — no waiting around for nothing.'],
    ['v394', '📍 Every mission now explains WHERE to find it and HOW TO GET THERE: who the opponent is (and their level), the place, the trip (plane, submarine, rocket, portal), the route from map to map and which part of the map it\'s in. The yellow arrow points to the same place. 🌋 Lava River, Dragon Volcano and Dragon\'s Lair: the rock walls now show up exactly where they block you (before, there were invisible walls next to the passages).'],
    ['v393', '⚽ Loading screen for big maps (Jurassic Valley, Atlantis, space, Multiverse...): the name of the place, a ball rolling along a bar that fills up, and a tip, while the map gets ready. The game no longer freezes when you enter the Jurassic Maze (the ground is drawn little by little).'],
    ['v392', '🦖 Shorter, fuller Jurassic Maze: the path between rooms is much shorter (the deepest room is half as far away), there are more shortcuts, dead ends are tiny and there are TWICE as many dinosaurs (more in each room and small groups at the crossings).'],
    ['v391', '🦸👑 The Hero\'s Cape sways with every step and the Crown (Blue Flames / Lightning Halo) stays on your head: it turns, tilts and kicks along with the character. 👑 The Echoes of the Multiverse are now boss-sized. 🛒 In shops you can buy up to 1,000 at once (it used to be 100), and the message tells you how many fit in your money or your load.'],
    ['v390', '🧠 Game Vision: on the Tactics Board and in offline training it now goes up at the same pace as the other skills (each level takes the same time as a Shooting level of the same number), without getting too fast for players with lots of focus.'],
    ['v389', '🏋️ TRAINING CENTER WORKOUTS REVAMPED: in Shooting the ball leaves the foot, goes into the goal, shakes the net and rolls back; on the Cones the character zigzags on the mat; at the Gym they do dumbbell curls; at the Tactics Board they stand with their back turned, studying. No more duplicate ball (not even on a real shot).'],
    ['v388', '🏆 SKILL LEADERBOARD: in the Leaderboard window, tabs for Dribbling, Shooting, Marking and Game Vision with the top 50 players who trained each one the most.'],
    ['v387', '🧠 Tactics Board (Training Center): Game Vision now uses your full focus recovery (before, it was a fixed amount and, at high levels, took days per level). The training bar shows how much is left until the next level.'],
    ['v386', '🏋️ Offline GAME VISION training fixed: it always gave 4,000/h (at high levels, more than 100 hours per level!). Now it gives half your focus recovery — and the Training window shows how much time is left until the next level of each skill.'],
    ['v385', '🏆 The top 3 laurel now shows up on ALL maps (hunts, houses and arenas too), not just in cities. 🌊 The sea in Rio and Santos is now real open sea (deep, with rafts and buoys). 🗺️ When you enter a remodeled map, a quick curtain shows the place\'s name instead of the old ground "jumping" to the new one.'],
    ['v384', '🏆 The top 3 on the leaderboard now have a LAUREL CROWN (gold, silver and bronze) with their number above their name in cities. 💬 A fixed talk button in the corner of the chat, and messages show up in a bubble above the name (easy to read). 🖱️ Right-click a player (on phones: press and hold): invite to group, send a friend request, invite to guild or mute.'],
    ['v383', '🏪 PLAYERS\' MARKET! List items from your backpack (from level 30) and sell them to other players, for coins only. Set up your STALL in one of the 36 spots in the new MARKET SQUARE (☰ More › 🏪 Market › Go to the Market Square; walk up to a stall and press E) or search the central market. Upgraded items keep their upgrade. The market keeps 5% and listings last 3 days.'],
    ['v382', '🛡️ GUILDS! Create your own (name and crest from ready-made lists) or join with a friend\'s invite: up to 30 members, a weekly goal (opponents of at least 60% of your level count) with prizes for those who help, a guild leaderboard and guild phrases. 🤝 You can now add friends right in the game (by nickname or with ➕ on people nearby in the city). 💬 Chat with people nearby is in ☰ More (or the Y key).'],
    ['v381', '🌐 Play together! In cities you can see other players walking around (emotes and quick phrases in 💬 or with the Y key; you can mute and hide them). 👥 Group hunts with up to 3 friends (☰ More › Hunt in a group): everyone faces the same opponents; each player gets what they helped take down, with a smaller prize per opponent (2: 65%, 3: 50%, 4: 40%) because the group takes down way more. Level difference: the highest level can be up to 50% higher than the lowest.'],
    ['v380', '🗼 Infinite Tower makeover: a stone island floating in space, with a ring of rock and lava. 🏢 The Agency Office got a wood floor and a rug with the agency star. 🐉 Baby Dragon: its damage bonus works after you unlock the Macaw.'],
    ['v379', '🗺️ Maps made over from Atlantis onward: new hand-drawn ground, smooth edges, cliffs and all kinds of decorations (water and lava with smooth borders). And hunt entrances/exits are now WIDE: walk out through any part of the portal.'],
    ['v378', '🌟 Relic Awakening: 10,000 wins, 40 Fragments and the Awakened Guardian — and you LOCK a bonus onto your character. Awakened relic = golden mark.'],
    ['v377', '🐾 Pets with their own STANDING POSE (no more "running" while standing still) and evolution 3x harder (Young ~1,250 wins, Adult ~23,500).'],
    ['v376', '📖 Wiki with tabs: Pets, Epic Hunt, Upgrades and relics, and What\'s New.'],
    ['v375', 'Marks of the 6 relics on your character (little wings, ∞, little stars, cosmic ring, amulet rays, crown jewels).'],
    ['v372', '🐱 Sortudo, the Lucky Kitty: better chance of item drops (Dona Yuki\'s missions, Tokyo, level 72).'],
    ['v370', '🐾 Pets that evolve (baby → young → adult) and give bonuses; 🐕 Pipoca, the Village pet (level 12). Name frames in Cosmetics.'],
    ['v369', '👑 Epic Hunt: the Echoes of the Multiverse (level 400+). Esc closes windows with search. One-time missions give full XP at any level.'],
    ['v368', '✨ Upgrade glow on your character (+7 to +10) and the +10 set aura.'],
    ['v367', '🪨 Valley of the Celestial Stones redesigned: one island per level range.'],
    ['v366', '💬 Big chat history (⤢) with the right time; 💭 Dreamers\' missions (Lia, Seu Jonas, Nina, Guto, Carla, Pedrinho).'],
    ['v365', '🏛️ Collectibles Museum: donate your finds and get XP and coin bonuses.'],
  ];
  function abaNovo() { return [el('div', { class: 'wx-lista' }, ...NOVIDADES.map(([v, t]) => el('div', {}, el('b', {}, v + ': '), t)))]; }

  /* ---------- as abas no Wiki ---------- */
  const _mw = modalWiki;
  modalWiki = function (aba = 'drops') {
    if (aba === 'drops') _mw.apply(this, arguments);
    else {
      const f = { mascotes: abaMascotes, epica: abaEpica, reliquias: abaReliquias, novo: abaNovo }[aba];
      let corpo; try { corpo = f(); } catch (e) { console.warn('wiki', e); corpo = [el('p', {}, 'Couldn\'t build this page right now.')]; }
      abreModal.largo = true;
      abreModal(el('h2', {}, '📖 Wiki'), el('div', { class: 'wk-corpo' }, ...corpo));
      if (!G.rodando) $('#modal').onclick = null;
    }
    try {
      const h2 = document.querySelector('#modalConteudo h2') || document.querySelector('#modal h2');
      if (h2 && !document.querySelector('.wx-abas')) h2.after(el('div', { class: 'opcoes wx-abas' }, ...ABAS.map(([k, t]) => el('button', { class: 'btn mini' + (k === aba ? ' amarelo' : ''), type: 'button', onclick: () => modalWiki(k) }, t))));
    } catch (e) { }
  };
  const st = document.createElement('style');
  st.textContent = `.wx-abas { flex-wrap: wrap; justify-content: flex-start; margin: 0 0 8px; gap: 5px; }
  .wx-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; margin-top: 6px; }
  .wx-card { background: #fffaf0; border: 2px solid #d8c09a; border-radius: 10px; padding: 8px; display: flex; flex-direction: column; gap: 3px; font-size: 13px; color: #3d2b3a; }
  .wx-card > b { font-size: 14px; } .wx-cab { display: flex; gap: 6px; align-items: center; }
  .wx-figs { display: flex; align-items: flex-end; justify-content: center; gap: 8px; min-height: 66px; }
  .wx-figs > div { display: flex; flex-direction: column; align-items: center; } .wx-figs small { font-size: 10px; opacity: .7; }
  .wx-fig { image-rendering: auto; max-width: 100%; align-self: center; flex: none; }
  .wx-bonus { font-weight: 800; color: #2a6a2a; } .wx-small { font-size: 11.5px; opacity: .85; line-height: 1.3; }
  .wx-meu { margin-top: 3px; font-size: 12px; font-weight: 800; color: #6a3a9a; background: #f1e8ff; border-radius: 6px; padding: 2px 6px; }
  .wx-sec { padding: 6px 2px; } .wx-p { font-size: 13px; margin: 4px 0 6px; }
  .wx-lista { display: flex; flex-direction: column; gap: 4px; font-size: 13px; line-height: 1.35; }`;
  document.head.append(st);
}
