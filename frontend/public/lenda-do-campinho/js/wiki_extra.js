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
  const ABAS = [['drops', '👾 Adversários e drops'], ['mascotes', '🐾 Mascotes'], ['epica', '👑 Caçada Épica'], ['reliquias', '✨ Refino e relíquias'], ['novo', '📰 Novidades']];
  const pctW = v => `${Math.round(v * 1000) / 10}%`.replace('.', ',');
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
    const out = [el('div', { class: 'wk-nota' }, el('b', {}, 'Como funciona: '), 'escolha UM mascote em Equipamento → ✨ Adornos. Ele te segue, sobe de nível caçando com você (cada adversário do seu nível = 1 ponto; chefão = 10; só contam adversários de até 30 níveis abaixo do seu) e dá um BÔNUS ao seu jogador, que cresce quando ele evolui: ',
      el('b', {}, MASC_FASES.map(f => `${f.nome} (nível ${f.nv}): ${Math.round(f.k * 100)}% do bônus`).join(' → ')), `. Nível máximo: ${MASC_MAX}.`)];
    // pontos para cada fase
    let soma = 0; const marcos = {}; for (let n = 1; n < MASC_MAX; n++) { soma += mascPontosNivel(n); if (n + 1 === 10 || n + 1 === 25 || n + 1 === MASC_MAX) marcos[n + 1] = soma; }
    out.push(el('p', { class: 'wx-p' }, `Vitórias (do seu nível) para evoluir: Jovem ≈ ${fmt(marcos[10])} · Adulto ≈ ${fmt(marcos[25])} · nível ${MASC_MAX} ≈ ${fmt(marcos[MASC_MAX])}.`));
    const grade = el('div', { class: 'wx-grade' });
    for (const o of (ADORNOS2.OPCOES.mascote || [])) {
      const [id, nome, emo, regra, desc] = o, M = MASC[id]; if (!M) continue;
      const base = (id === 'caramelo' ? 'pet_caramelo2' : `pet_${id}`), q = ['arara', 'dragao', 'corujinha'].includes(id) ? '_c1' : '_p', artes = [`pet_${id}_f${q}`, `${base}${q}`, `pet_${id}_a${q}`]; // (parados; os que voam, batendo asa)
      let meu = null; if (temSave()) { try { if (ADORNOS2.liberado('mascote', id)) { const d = mascDados(id); meu = `Seu: nível ${d.nv} (${MASC_FASES.filter(f => d.nv >= f.nv).pop().nome})`; } } catch (e) { } }
      grade.append(el('div', { class: 'wx-card' },
        el('div', { class: 'wx-figs' }, ...artes.map((a, i) => el('div', {}, figura(a, [40, 52, 62][i]), el('small', {}, MASC_FASES[i].nome)))),
        el('b', {}, `${emo} ${nome}`), el('div', { class: 'wx-bonus' }, `Bônus: +${pctW(M.v)} de ${M.txt} (adulto)` + (id === 'dragao' ? ' — vale depois de liberar a Arara' : '')),
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
    out.push(el('div', { class: 'wk-nota' }, el('b', {}, 'Como funciona: '), `a partir do nível ${CE_NIVEL} (depois da Copa Intergaláctica). Toda segunda-feira, 3 chefões lendários voltam como ECOS do Multiverso, com a força do SEU nível e um poder da semana. Você tem ${Math.round(CE_TEMPO / 60000)} minutos por luta, na Arena dos Ecos (fale com a Caçadora Estela, no Estádio do Multiverso, ou 🎯 Tarefas de caça → 👑 Épica). Todos têm ONDA DE CHOQUE (saia do círculo vermelho) e INVESTIDA, e ficam furiosos na metade da vida.`));
    out.push(secao('📅 Os Ecos desta semana', el('div', { class: 'wx-grade' }, ...ecos.map((e, i) => { const d = MONSTROS[e.base], a = CE_AFIXOS[e.afixo];
      return el('div', { class: 'wx-card' }, d && d.look && d.look.spr ? figura(d.look.spr, 70) : '', el('b', {}, `${i + 1}. ${String((d && d.nome) || e.base).split(',')[0]}, Eco do Multiverso`), el('div', { class: 'wx-bonus' }, a.nome), el('div', { class: 'wx-small' }, a.dica)); }))));
    out.push(secao('⚡ Os poderes da semana', el('div', { class: 'wx-lista' }, ...Object.values(CE_AFIXOS).map(a => el('div', {}, el('b', {}, a.nome + ': '), a.dica)))));
    out.push(secao('🎁 Prêmios', el('div', { class: 'wx-lista' },
      el('div', {}, el('b', {}, 'Cada Eco (1ª vitória da semana): '), `XP, tostões e ${CE_FICHAS} Fichas da Torre (e uma chance pequena de peça do Multiverso). Lutar de novo: +1 Ficha.`),
      el('div', {}, el('b', {}, 'Os 3 Ecos da semana: '), `1 Selo do Caçador Épico, +${CE_FICHAS_SELO} Fichas e um Baú da Torre.`),
      el('div', {}, el('b', {}, 'Molduras de nome (Equipamento → ✨ Adornos): '), CE_MOLDURAS.map(f => `${f.nome} (${f.selos} selo${f.selos > 1 ? 's' : ''})`).join(' · '), '. Só se ganham caçando: não estão à venda.'),
      temSave() ? el('div', { class: 'wx-meu' }, `Você: ${ceDados().feitos.length}/3 Ecos nesta semana · ${ceDados().selos || 0} selo(s)`) : '')));
    out.push(secao('🐉 Chefões que podem ecoar', el('div', { class: 'wx-small' }, cePool().map(id => String(MONSTROS[id].nome).split(',')[0]).join(' · '))));
    return out;
  }

  /* ---------- ✨ Refino e relíquias ---------- */
  function abaReliquias() {
    const out = [];
    out.push(secao('✨ O brilho do refino no boneco (peças comuns)', el('div', { class: 'wx-lista' },
      el('div', {}, el('b', {}, '+7: '), 'um reflexo de luz passa pela peça de vez em quando.'),
      el('div', {}, el('b', {}, '+8: '), 'a peça brilha na cor da raridade dela, pulsando devagar.'),
      el('div', {}, el('b', {}, '+9: '), 'brilho forte e faíscas subindo da peça.'),
      el('div', {}, el('b', {}, '+10: '), 'a peça fica ACESA (a chuteira +10 deixa rastro de luz).'),
      el('div', {}, el('b', {}, 'Conjunto lendário: '), 'as 6 peças em +10 → aura dourada no personagem inteiro e brilho dourado no chão.'))));
    const MARCA_TXT = {
      chuteira_deuses: 'asinhas nos calcanhares (como as sandálias aladas); batem mais rápido quando você corre.',
      caneleira_infinito: 'o símbolo ∞ azul-gelo em cada canela.',
      camisa_multiverso: 'estrelinhas que piscam na camisa de galáxia.',
      calcao_cosmico: 'um anel fino de poeira de estrelas girando na cintura.',
      amuleto_lenda: 'o pingente solta raios curtos de luz.',
      coroa_eterna: 'as joias da coroa cintilam.',
    };
    out.push(el('div', { class: 'wk-nota' }, el('b', {}, 'As relíquias '), 'não usam o brilho do refino: cada uma tem a SUA marca no boneco, discreta no +0 e cada vez mais forte até o +10 (uma peça = um efeito só, para o boneco não virar árvore de Natal). Elas contam para o conjunto lendário +10.'));
    out.push(el('div', { class: 'wx-grade' }, ...RELIQUIAS.map(([id, nome, slot, L, andar]) => { const it = ITENS[id]; const ic = (typeof iconeItem === 'function' && typeof iconeClone === 'function') ? iconeClone(iconeItem(id)) : el('span', {}, '🏺'); ic.className = 'wk-ic';
      return el('div', { class: 'wx-card' }, el('div', { class: 'wx-cab' }, ic, el('b', {}, nome)), el('div', { class: 'wx-small' }, `Nível ${L} · Guardião do andar ${andar} da Torre Infinita (nível ${typeof torreNivel === 'function' ? torreNivel(andar) : '?'})`),
        el('div', { class: 'wx-bonus' }, '✨ ' + (MARCA_TXT[id] || 'marca própria no boneco')), temSave() && G.save.flags && G.save.flags['guardiao_' + id] ? el('div', { class: 'wx-meu' }, '✅ Você já venceu este Guardião') : ''); })));
    if (typeof DESPERTAR !== 'undefined') {
      const D = DESPERTAR;
      out.push(secao('🌟 O Despertar das Relíquias', el('div', { class: 'wk-nota' }, el('b', {}, 'Com a Mestra Altina (Torre Infinita): '), `1) use a relíquia em ${fmt(D.DESP_KILLS)} vitórias (do seu nível); 2) ofereça ${D.DESP_FRAG} Fragmentos do Despertar (caem de chefões de nível 400+ e dos Ecos da semana); 3) vença o Guardião Desperto (8 minutos, na Arena dos Ecos); 4) ESCOLHA um dos 3 bônus para fixar no seu boneco, para sempre. A relíquia desperta ganha a versão dourada da marca.`),
        el('div', { class: 'wx-grade' }, ...RELIQUIAS.map(([id, nome]) => { const c = D.DESP[id]; if (!c) return ''; const dd = temSave() && G.save.despertar && G.save.despertar[id]; const b = dd && dd.bonus && c.bonus.find(x => x[0] === dd.bonus);
          return el('div', { class: 'wx-card' }, el('b', {}, nome), el('div', { class: 'wx-small' }, `Guardião Desperto: ${String((MONSTROS[c.base] || {}).nome || c.base).split(',')[0]} · ${CE_AFIXOS[c.afixo].nome}`), el('div', { class: 'wx-bonus' }, 'Escolha 1: ' + c.bonus.map(x => x[2]).join(' · ')), dd && dd.desperta ? el('div', { class: 'wx-meu' }, `🌟 Desperta${b ? ' — ' + b[2] : ''}`) : ''); }))));
    }
    return out;
  }

  /* ---------- 📰 Novidades ---------- */
  const NOVIDADES = [
    ['v387', '🧠 Quadro Tático (Centro de Treinamento): a Visão de Jogo agora rende a sua recuperação de foco inteira (antes era fixo e, em nível alto, levava dias por nível). A barra de treino mostra quanto falta para o próximo nível.'],
    ['v386', '🏋️ Treino offline de VISÃO DE JOGO corrigido: rendia sempre 4.000/h (em nível alto, mais de 100 horas por nível!). Agora rende metade da sua recuperação de foco — e a janela de Treino mostra quanto tempo falta para o próximo nível de cada habilidade.'],
    ['v385', '🏆 O louro do top 3 agora aparece em TODOS os mapas (caças, casas e arenas também), não só nas cidades. 🌊 O mar do Rio e de Santos virou mar aberto de verdade (fundo, com jangadas e boias). 🗺️ Ao entrar num mapa repaginado, uma cortina rapidinha com o nome do lugar no lugar do chão antigo "pulando" para o novo.'],
    ['v384', '🏆 Os 3 primeiros do ranking agora têm uma COROA DE LOUROS (ouro, prata e bronze) com o número em cima do nome nas cidades. 💬 Botão de falar fixo no canto do chat, e as frases aparecem num balão em cima do nome (dá para ler). 🖱️ Botão direito em cima de um jogador (no celular: segure o dedo): chamar para o grupo, pedir amizade, convidar para a guilda ou silenciar.'],
    ['v383', '🏪 FEIRA DOS JOGADORES! Anuncie itens da mochila (a partir do nível 30) e venda para outros jogadores, só com tostões. Monte a sua BARRACA numa das 36 vagas da nova PRAÇA DA FEIRA (☰ Mais › 🏪 Feira › Ir à Praça da Feira; chegue perto de uma barraca e aperte E) ou procure no mercado central. Item refinado vai com o refino. A feira fica com 5% e o anúncio dura 3 dias.'],
    ['v382', '🛡️ GUILDAS! Crie a sua (nome e escudo de listas prontas) ou entre a convite de um amigo: até 30 membros, meta da semana (contam adversários com pelo menos 60% do seu nível) com prêmios para quem ajuda, ranking das guildas e frases para a guilda. 🤝 Amigos agora se adicionam no próprio jogo (por apelido ou ➕ em quem está perto na cidade). 💬 A conversa com quem está perto fica no ☰ Mais (ou tecla Y).'],
    ['v381', '🌐 Jogue junto! Nas cidades você vê os outros jogadores andando (emotes e frases prontas no 💬 ou na tecla Y; dá para silenciar e esconder). 👥 Caça em grupo com até 3 amigos (☰ Mais › Caçar em grupo): todos enfrentam os mesmos adversários; cada um ganha o que ajudou a derrubar, com prêmio menor por adversário (2: 65%, 3: 50%, 4: 40%) porque o grupo derruba muito mais. Diferença de nível: o mais alto pode ser até 50% maior que o mais baixo.'],
    ['v380', '🗼 Torre Infinita repaginada: uma ilha de pedra flutuando no espaço, com anel de rocha e lava. 🏢 O Escritório da Agência ganhou piso de taco e tapete com a estrela da agência. 🐉 Dragãozinho: o bônus de dano vale depois que você libera a Arara.'],
    ['v379', '🗺️ Mapas repaginados de Atlântida em diante: chão novo desenhado à mão, bordas lisas, penhascos e enfeites variados (água e lava com beirada lisa). E as entradas/saídas das caças agora são LARGAS: sai por qualquer ponto do portal.'],
    ['v378', '🌟 O Despertar das Relíquias: 10.000 vitórias, 40 Fragmentos e o Guardião Desperto — e você FIXA um bônus no seu boneco. Relíquia desperta = marca dourada.'],
    ['v377', '🐾 Mascotes com POSE PARADA própria (não ficam mais "correndo" parados) e evolução 3x mais difícil (Jovem ~1.250 vitórias, Adulto ~23.500).'],
    ['v376', '📖 Wiki com abas: Mascotes, Caçada Épica, Refino e relíquias e Novidades.'],
    ['v375', 'Marcas das 6 relíquias no boneco (asinhas, ∞, estrelinhas, anel cósmico, raios do amuleto, joias da coroa).'],
    ['v372', '🐱 Sortudo, o Gatinho da Sorte: mais chance de cair item (missões da Dona Yuki, Tóquio, nível 72).'],
    ['v370', '🐾 Mascotes que evoluem (filhote → jovem → adulto) e dão bônus; 🐕 Pipoca, o mascote da Vila (nível 12). Molduras de nome nos Adornos.'],
    ['v369', '👑 Caçada Épica: os Ecos do Multiverso (nível 400+). Esc fecha janelas com busca. Missão de uma vez dá XP cheia em qualquer nível.'],
    ['v368', '✨ Brilho do refino no boneco (+7 a +10) e a aura do conjunto +10.'],
    ['v367', '🪨 Vale das Pedras Celestiais redesenhado: uma ilha por faixa de nível.'],
    ['v366', '💬 Histórico grande (⤢) e com a hora certa; 💭 missões dos Sonhadores (Lia, Seu Jonas, Nina, Guto, Carla, Pedrinho).'],
    ['v365', '🏛️ Museu dos Colecionáveis: doe achados e ganhe bônus de XP e tostões.'],
  ];
  function abaNovo() { return [el('div', { class: 'wx-lista' }, ...NOVIDADES.map(([v, t]) => el('div', {}, el('b', {}, v + ': '), t)))]; }

  /* ---------- as abas no Wiki ---------- */
  const _mw = modalWiki;
  modalWiki = function (aba = 'drops') {
    if (aba === 'drops') _mw.apply(this, arguments);
    else {
      const f = { mascotes: abaMascotes, epica: abaEpica, reliquias: abaReliquias, novo: abaNovo }[aba];
      let corpo; try { corpo = f(); } catch (e) { console.warn('wiki', e); corpo = [el('p', {}, 'Não deu para montar esta página agora.')]; }
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
