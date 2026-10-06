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
    { id: 't1', n: 1, nome: 'Unidos do Banco', ala: 'cq_vestiario', cor: '#7a8fb0', adv: ['cq_reserva', 'cq_massagista'],
      txt: 'Passaram a Copa de Origem inteira no banco de reservas, esperando a vez de entrar. Aquecem até hoje!' },
    { id: 't2', n: 2, nome: 'Relâmpago da Várzea', ala: 'cq_vestiario', cor: '#d8b040', adv: ['cq_gandula', 'cq_cap_vestiario'],
      txt: 'O time mais rápido da Copa: corriam tanto que esqueciam de passar a bola. Aprenderam no fim, mas a final parou.' },
    { id: 't3', n: 3, nome: 'Muralha Futebol Clube', ala: 'cq_tunel', cor: '#8a7a6a', adv: ['cq_zagueiro'],
      txt: 'Nunca levaram um gol... e nunca fizeram um! Empataram todos os jogos por 0 a 0.' },
    { id: 't4', n: 4, nome: 'Trio da Origem', ala: 'cq_tunel', cor: '#3a3a3a', adv: ['cq_bandeirinha', 'cq_arbitro', 'cq_xerife_tunel'],
      txt: 'O árbitro e os dois bandeirinhas que apitaram todos os jogos da Copa de Origem. Só faltou o apito final.' },
    { id: 't5', n: 5, nome: 'Ola Esporte Clube', ala: 'cq_arquibancada', cor: '#5aa0d8', adv: ['cq_torcida', 'cq_bumbo'],
      txt: 'A torcida que inventou a ola. Cantou a Copa inteira sem ver um gol do time, e nunca parou de cantar.' },
    { id: 't6', n: 6, nome: 'Mascotinhos da Colina', ala: 'cq_arquibancada', cor: '#d07ab0', adv: ['cq_mascote', 'cq_rei_arquibancada'],
      txt: 'O time mais animado da Copa: cada jogador tinha um mascote. A bandeira deles ficou com o Mascote Perdido.' },
    { id: 't7', n: 7, nome: 'Quase Lá Futebol Clube', ala: 'cq_gramado', cor: '#5ab86a', adv: ['cq_craque', 'cq_goleiro'],
      txt: 'Chegaram em dez finais e perderam todas por 1 a 0. No dia seguinte, estavam treinando de novo.' },
    { id: 't8', n: 8, nome: 'Prancheta Atlético', ala: 'cq_gramado', cor: '#c8603a', adv: ['cq_tecnico', 'cq_craque_final'],
      txt: 'O time mais organizado da Copa: o técnico desenhava cada jogada na prancheta antes do jogo.' },
    { id: 'onze', n: 9, nome: 'Os Onze Esquecidos', ala: 'cq_gramado', cor: '#e8d070', adv: ['cq_onze'], final: true,
      txt: 'Os melhores de cada time esquecido, juntos, para jogar a final que nunca terminou.' },
  ];
  const CQ_HIST_TIME_DE = {}; for (const t of CQ_HIST_TIMES) for (const a of t.adv) CQ_HIST_TIME_DE[a] = t;
  const CQ_HIST_FIG_PRECO = 15;          // Ingressos Esquecidos por figurinha À VISTA (o Seu Saudade mostra qual é antes)
  const CQ_HIST_FIG_CHANCE = 1 / 150;    // por vitória contra um fantasma do time (chefão: 1 em 2)
  const CQ_HIST_ALAS = { cq_vestiario: '👕 Vestiário Abandonado', cq_tunel: '🚦 Túnel de Acesso', cq_arquibancada: '📣 Arquibancada Infinita', cq_gramado: '⚽ Gramado da Final Eterna' };
  const nomeAla = id => (CQ_HIST_ALAS[id] || id).replace(/^\S+ /, '');
  const albumDe = (s = G.save) => { if (!s) return {}; if (!s.cqAlbum || typeof s.cqAlbum !== 'object') s.cqAlbum = {}; return s.cqAlbum; };
  function cqHistGanhaFig(tid, como) {
    const s = G.save; if (!s) return false; const t = CQ_HIST_TIMES.find(x => x.id === tid); if (!t) return false;
    const al = albumDe(s); if (al[tid]) return false;
    al[tid] = true; const n = CQ_HIST_TIMES.filter(x => al[x.id]).length;
    log(`👻 FIGURINHA NOVA no Álbum dos Esquecidos: ${t.nome}! (${n}/${CQ_HIST_TIMES.length})${como ? ' ' + como : ''}`, 'l-xp'); som('moeda');
    try { if (typeof avisoTela === 'function') avisoTela(`👻 Figurinha nova: ${t.nome}`, 'l-xp'); } catch (e) { }
    G.uiSujo = true; return true;
  }

  /* ---------- objetos de missão (chave: não vende, não pesa; só caem enquanto a missão pede) ---------- */
  const CQ_HIST_OBJ = {
    cq_bola_autografada: ['Bola Autografada', 'A bola do Relâmpago da Várzea, com o autógrafo de cada jogador. O Gandula Relâmpago tinha pegado.', 'i_bola_ouro', 'cq_gandula'],
    cq_apito_final: ['Apito da Final', 'O apito que o Árbitro Esquecido guardava para encerrar a final da Copa de Origem.', 'i_apito_ouro', 'cq_arbitro'],
    cq_bandeira_mascotinhos: ['Bandeira dos Mascotinhos', 'A bandeira desbotada dos Mascotinhos da Colina. O Mascote Perdido não largava dela.', 'i_bandeira_verde', 'cq_mascote'],
    cq_prancheta_final: ['Prancheta da Final', 'A prancheta do Técnico Sem Voz, com a escalação da final desenhada.', 'i_prancheta', 'cq_tecnico'],
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
    ['cq_ingresso', 'guardiao_mv', 700, null, '🎟️ O ingresso amarelado',
      'Olhe o que achei no chão do estádio: um ingresso antigo e amarelado da "Copa de Origem"! O portal selado brilhou. Entre nele e fale com o Seu Saudade, lá dentro.',
      { fala: 'seu_saudade', desc: 'Entre no Portal dos Esquecidos (Estádio do Multiverso) e fale com o Seu Saudade' }, 0.5, ingr(3),
      { mais: 'Eu conheço as lendas mais antigas do universo, mas nunca ouvi falar dessa copa! O portal que estava selado, no alto do Estádio do Multiverso, agora leva a um estádio muito antigo. O ingresso é a sua entrada.',
        chegada: 'Um ingresso da Copa de Origem! Faz tanto tempo que ninguém aparece... Bem-vindo(a) ao Estádio dos Esquecidos! Eu sou o Seu Saudade, o roupeiro. Cuido das camisas de todos os times daqui.',
        chegadaMais: 'Aqui jogam os times que nunca ganharam nada. A final da Copa de Origem parou no meio, e eles ficaram esperando o apito final. São fantasmas, mas não precisa ter medo: só querem jogar bola!' }],
    ['cq_memoria', 'seu_saudade', 700, 'cq_ingresso', '🎟️ A torcedora mais antiga',
      'A Dona Memória viu todos os jogos da Copa de Origem e lembra de cada time. Ela está aqui no saguão do estádio. Vá dar um oi!',
      { fala: 'dona_memoria', desc: 'Fale com a Dona Memória (saguão do Estádio dos Esquecidos)' }, 0.4, ingr(2),
      { chegada: 'Ah, um rosto novo! Eu sou a Dona Memória. Sabe por que os times daqui não vão embora? Eles nunca desistiram... só esqueceram por que jogavam. Vamos ajudar cada um a lembrar?',
        chegadaMais: 'Quando você vence um time num duelo limpo, ele lembra da alegria de jogar. O estádio tem quatro alas: o Vestiário Abandonado, o Túnel de Acesso, a Arquibancada Infinita e o Gramado da Final Eterna.' }],
    // ✨ a pista da Bola de Origem (opcional: não está na linha principal e não bloqueia nada)
    ['cq_pista_origem', 'dona_memoria', 710, 'cq_memoria', '✨ A bola da final',
      'A final da Copa de Origem parou quando a primeira bola do universo se partiu. O Grão-Guardião Orbitto conhece essa bola. Conte para ele, no Estádio do Multiverso!',
      { fala: 'guardiao_mv', desc: 'Fale com o Grão-Guardião Orbitto (Estádio do Multiverso)' }, 0.4, ingr(2),
      { opcional: true,
        chegada: 'Orbitto arregala os olhos: "A Copa de Origem era jogada com a Bola de Origem! Quando ela se partiu em 7 gomos, a final parou. Com a bola inteira, a final poderá recomeçar!"',
        chegadaMais: 'Os 7 gomos estão espalhados pelos mundos: é a saga "A Bola de Origem" (📜 no ☰ Menu). Quando ela acordar, volte ao Estádio dos Esquecidos e fale com a Dona Memória.' }],

    // 🚪 Ala 1 — Vestiário Abandonado (700–760): substituições; frio
    ['cq_vestiario_h1', 'dona_memoria', L(705, 'cq_reserva', 740), 'cq_memoria', '👻 O time que nunca saiu do banco',
      'O Unidos do Banco esperou a Copa inteira no banco de reservas. Vença 40 Reservas Eternos no Vestiário Abandonado e mostre que a vez deles chegou!',
      { kill: 'cq_reserva', n: 40 }, 1, ingr(4),
      { fig: 't1', mais: 'O técnico do Unidos do Banco sempre dizia: "calma, a sua vez vai chegar". A final parou antes de ele chamar alguém. Atenção: o Reserva Eterno chama outros reservas para ajudar, e o Massagista Sonâmbulo cuida dos colegas.',
        fim: 'Olha só: eles estão sorrindo! Entraram em campo, nem que fosse por um minutinho. Guarde a figurinha do Unidos do Banco no seu álbum.' }],
    ['cq_vestiario_h2', 'dona_memoria', L(725, 'cq_gandula', 750), 'cq_vestiario_h1', '👻 A bola que fugiu',
      'O Gandula Relâmpago pegou a Bola Autografada do Relâmpago da Várzea e saiu correndo! Ele vive no Vestiário Abandonado. Traga a bola de volta.',
      { item: 'cq_bola_autografada', n: 1, de: 'cq_gandula', desc: 'Recupere a Bola Autografada com o Gandula Relâmpago (Vestiário Abandonado)' }, 1, ingr(4),
      { mais: 'O Relâmpago da Várzea era o time mais rápido da Copa: corriam tanto que esqueciam de passar a bola! O Gandula é ligeiro e foge com a bola: marque ele e não deixe escapar.',
        fim: 'Que alegria! Cada autógrafo é de um jogador do Relâmpago da Várzea. No fim da Copa eles aprenderam a passar a bola... pena que a final parou.' }],
    ['cq_vestiario_h3', 'dona_memoria', 740, 'cq_vestiario_h2', '👻 O livro de regras',
      'O Seu Saudade guarda o livro de regras da Copa de Origem. Antes de enfrentar o capitão do vestiário, mostre a ele que você conhece o jogo limpo!',
      { fala: 'seu_saudade', desc: 'Responda às perguntas do Seu Saudade (saguão do Estádio dos Esquecidos)' }, 0.8, ingr(3),
      { chegada: 'O Seu Saudade abre um livro velhinho: "Jogo limpo começa pelas regras. Vamos ver se você sabe!"',
        depois: 'Acertou tudo! Quem conhece as regras joga melhor e briga menos. Agora sim: o Capitão do Vestiário vai querer um duelo com você.',
        enigma: [
          { p: 'Quantos jogadores cada time tem em campo, contando o goleiro?', ops: ['7', '11', '15'], c: 1 },
          { p: 'Dois cartões amarelos para o mesmo jogador, no mesmo jogo, viram...', ops: ['Um cartão vermelho', 'Um gol para o outro time', 'Um cartão azul'], c: 0 },
          { p: 'Como se cobra um lateral?', ops: ['Chutando a bola', 'Com as duas mãos, por cima da cabeça', 'De cabeça'], c: 1 },
        ] }],
    ['cq_vestiario_chefe', 'seu_saudade', L(755, 'cq_cap_vestiario', 760), 'cq_vestiario_h3', '🏆 O Capitão do Vestiário',
      'O Capitão do Vestiário nunca deixou o time desistir. Vença o Capitão lá no fundo do Vestiário Abandonado: ele merece um duelo de verdade!',
      { kill: 'cq_cap_vestiario', n: 1 }, 1.6, ingr(8),
      { mais: 'Ele guarda a braçadeira de capitão desde a Copa de Origem. Quando perde um duelo limpo, aperta a sua mão e diz "bom jogo!". Os chefões voltam depois de um tempo: se ele não estiver lá, espere um pouquinho.',
        fim: '"Bom jogo, craque!", disse o Capitão. O Vestiário inteiro aplaudiu. A próxima ala é o Túnel de Acesso.' }],

    // 🔦 Ala 2 — Túnel de Acesso (760–830): impedimento e cartões; escuridão
    ['cq_tunel_h1', 'dona_memoria', L(765, 'cq_zagueiro', 800), 'cq_vestiario_h3', '👻 O time do zero a zero',
      'O Muralha Futebol Clube nunca levou um gol... e nunca fez um! Vença 50 Zagueiros Muralha no Túnel de Acesso e ensine a eles a alegria de atacar.',
      { kill: 'cq_zagueiro', n: 50 }, 1, ingr(4),
      { fig: 't3', mais: 'O Muralha FC empatou todos os jogos por 0 a 0. Defendiam tão bem que esqueceram de tentar o gol! Dica: o Zagueiro Muralha só cai com jogadas fortes.',
        fim: 'Eles chutaram ao gol pela primeira vez... e comemoraram como se fosse um título! Guarde a figurinha do Muralha FC.' }],
    ['cq_tunel_h2', 'dona_memoria', L(790, 'cq_arbitro', 820), 'cq_tunel_h1', '👻 O apito da final',
      'O Árbitro Esquecido guarda o Apito da Final e não lembra mais para que serve. Vença o Árbitro no Túnel de Acesso e traga o apito: sem ele, a final nunca termina!',
      { item: 'cq_apito_final', n: 1, de: 'cq_arbitro', desc: 'Recupere o Apito da Final com o Árbitro Esquecido (Túnel de Acesso)' }, 1, ingr(4),
      { mais: 'O Trio da Origem (o árbitro e os dois bandeirinhas) apitou todos os jogos da Copa de Origem. Cuidado com os cartões: o amarelo deixa você lento, e o vermelho tira as suas jogadas por 3 segundos.',
        fim: 'O Apito da Final! Vou guardar com muito carinho. Um dia ele vai apitar o fim daquele jogo...' }],
    ['cq_tunel_h3', 'seu_saudade', 805, 'cq_tunel_h2', '👻 Impedido!',
      'A Dona Memória vive discutindo impedimento com o Bandeirinha do túnel. Ela quer ver se você entende a regra. Vá falar com ela aqui no saguão!',
      { fala: 'dona_memoria', desc: 'Responda às perguntas da Dona Memória (saguão do Estádio dos Esquecidos)' }, 0.8, ingr(3),
      { chegada: 'A Dona Memória ajeita os óculos: "Impedimento é a regra que mais dá discussão na arquibancada! Vamos ver..."',
        depois: 'Isso mesmo! Agora, quando o Bandeirinha levantar a bandeira, você sabe por quê. E nas faixas do chão do Túnel, cuidado: pisou, volta!',
        enigma: [
          { p: 'Na cobrança de um lateral, existe impedimento?', ops: ['Sim, sempre', 'Não: no lateral não tem impedimento', 'Só no segundo tempo'], c: 1 },
          { p: 'O atacante está no próprio campo na hora do passe. Ele pode estar impedido?', ops: ['Sim', 'Não: no próprio campo nunca é impedimento', 'Só se for alto'], c: 1 },
          { p: 'Quem levanta a bandeira para avisar o impedimento?', ops: ['O bandeirinha (assistente do árbitro)', 'O gandula', 'O técnico'], c: 0 },
        ] }],
    ['cq_tunel_chefe', 'seu_saudade', L(825, 'cq_xerife_tunel', 830), 'cq_tunel_h3', '🏆 O Xerife do Túnel',
      'O Xerife do Túnel não deixa ninguém passar sem jogar limpo. Vença o Xerife lá no alto do Túnel de Acesso e mostre que você joga pelas regras!',
      { kill: 'cq_xerife_tunel', n: 1 }, 1.6, ingr(8),
      { mais: 'O Xerife cuida do túnel desde que a final parou. É durão, mas justo: respeita quem respeita as regras. Se ele não estiver lá, volte daqui a pouco.',
        fim: '"Pode passar, craque!", disse o Xerife, tirando o chapéu. A próxima ala é a Arquibancada Infinita.' }],

    // 📣 Ala 3 — Arquibancada Infinita (830–900): a ola; barulho
    ['cq_arquibancada_h1', 'dona_memoria', L(835, 'cq_torcida', 870), 'cq_tunel_h3', '👻 A torcida que nunca parou',
      'A torcida do Ola Esporte Clube cantou a Copa inteira sem ver um gol do time. Vença 60 Torcidas de Névoa na Arquibancada Infinita e dê a eles uma festa!',
      { kill: 'cq_torcida', n: 60 }, 1, ingr(4),
      { fig: 't5', mais: 'Foi a torcida do Ola EC que inventou a ola, aquela onda que passa pela arquibancada. Cuidado: a ola atravessa o mapa inteiro, e o barulho gasta o seu foco.',
        fim: 'Ouviu? Eles fizeram a ola mais bonita de todos os tempos! Guarde a figurinha do Ola EC.' }],
    ['cq_arquibancada_h2', 'dona_memoria', L(860, 'cq_mascote', 890), 'cq_arquibancada_h1', '👻 A bandeira perdida',
      'O Mascote Perdido está abraçado na bandeira dos Mascotinhos da Colina. Vença o Mascote na Arquibancada Infinita e traga a bandeira de volta.',
      { item: 'cq_bandeira_mascotinhos', n: 1, de: 'cq_mascote', desc: 'Recupere a Bandeira dos Mascotinhos com o Mascote Perdido (Arquibancada Infinita)' }, 1, ingr(4),
      { mais: 'Os Mascotinhos da Colina eram o time mais animado da Copa: cada jogador tinha um mascote! O Mascote Perdido se separou do time e ficou com medo de ficar sozinho. Ele é muito resistente: leve comida de foco.',
        fim: 'A bandeira dos Mascotinhos! Está desbotada, mas inteirinha. O Seu Saudade vai saber cuidar dela.' }],
    ['cq_arquibancada_h3', 'dona_memoria', 880, 'cq_arquibancada_h2', '👻 Bandeira no alto',
      'Leve a bandeira dos Mascotinhos para o Seu Saudade, aqui no saguão. Ele vai costurar os rasgos e pendurar a bandeira bem no alto da arquibancada.',
      { fala: 'seu_saudade', desc: 'Leve a bandeira ao Seu Saudade (saguão do Estádio dos Esquecidos)' }, 0.6, ingr(3),
      { chegada: 'O Seu Saudade costura com cuidado e pendura a bandeira bem no alto. Lá na Arquibancada Infinita, alguém bateu palmas... e depois todo mundo!',
        chegadaMais: '"Uma bandeira lembra o time de quem ele é", diz o Seu Saudade. "Ninguém joga sozinho: sempre tem alguém torcendo."' }],
    ['cq_arquibancada_chefe', 'seu_saudade', L(895, 'cq_rei_arquibancada', 900), 'cq_arquibancada_h3', '🏆 O Rei da Arquibancada',
      'O Rei da Arquibancada comanda a festa da torcida. Vença o Rei no camarote, lá em cima da Arquibancada Infinita, e ele vai puxar um coro com o seu nome!',
      { kill: 'cq_rei_arquibancada', n: 1 }, 1.6, ingr(8),
      { mais: 'Ele foi o primeiro torcedor da Copa de Origem e nunca perdeu um jogo... de assistir! Quando o Bumbo Trovão toca, a onda empurra: fique firme.',
        fim: 'O Rei puxou o coro e a Arquibancada Infinita inteira cantou o seu nome! Falta só uma ala: o Gramado da Final Eterna.' }],

    // 🏟️ Ala 4 — Gramado da Final Eterna (900–950): prorrogação; frio + escuro + barulho
    ['cq_gramado_h1', 'dona_memoria', L(905, 'cq_craque', 940), 'cq_arquibancada_h3', '👻 Quase lá',
      'O Quase Lá Futebol Clube perdeu todas as finais por um gol. Vença 60 Craques Sem Taça no Gramado da Final Eterna e mostre que perder também ensina.',
      { kill: 'cq_craque', n: 60 }, 1, ingr(4),
      { fig: 't7', mais: 'O Quase Lá FC chegou em dez finais e perdeu todas por 1 a 0. Mesmo assim, nunca desistiu: no dia seguinte, estava treinando. O Craque Sem Taça é bom no um contra um e desvia de chute de longe: chegue perto!',
        fim: 'Eles riram juntos e disseram: "Perder dez finais é chegar em dez finais!" Guarde a figurinha do Quase Lá FC.' }],
    ['cq_gramado_h2', 'dona_memoria', L(925, 'cq_tecnico', 945), 'cq_gramado_h1', '👻 A escalação da final',
      'O Técnico Sem Voz perdeu a voz de tanto gritar, mas ainda guarda a Prancheta da Final. Vença o Técnico no Gramado da Final Eterna e traga a prancheta.',
      { item: 'cq_prancheta_final', n: 1, de: 'cq_tecnico', desc: 'Recupere a Prancheta da Final com o Técnico Sem Voz (Gramado da Final Eterna)' }, 1, ingr(4),
      { mais: 'O Prancheta Atlético era o time mais organizado da Copa: o técnico desenhava cada jogada antes. Ele monta uma formação que deixa os vizinhos mais fortes: vença os vizinhos primeiro.',
        fim: 'A escalação da final! Olhe só os nomes: os melhores de cada time esquecido, juntos. Eles são... os Onze Esquecidos!' }],
    ['cq_gramado_h3', 'dona_memoria', 940, 'cq_gramado_h2', '👻 Prorrogação',
      'O Seu Saudade quer saber se você está pronto(a) para uma final. Responda às perguntas dele, aqui no saguão do estádio.',
      { fala: 'seu_saudade', desc: 'Responda às perguntas do Seu Saudade (saguão do Estádio dos Esquecidos)' }, 0.8, ingr(3),
      { chegada: 'O Seu Saudade dobra uma camisa com cuidado: "Final é diferente, craque. Vamos ver se você sabe como ela termina."',
        depois: 'Perfeito! Você entende de final. Agora o Craque da Final está esperando por você no Gramado.',
        enigma: [
          { p: 'Quanto tempo dura a prorrogação?', ops: ['Dois tempos de 15 minutos', 'Um tempo de 5 minutos', 'Até alguém cansar'], c: 0 },
          { p: 'De que distância se cobra um pênalti?', ops: ['5 metros', '11 metros', '30 metros'], c: 1 },
          { p: 'Quem decide quando o jogo acaba?', ops: ['O árbitro, com o apito final', 'O time que está ganhando', 'A torcida'], c: 0 },
        ] }],
    ['cq_gramado_chefe', 'seu_saudade', L(948, 'cq_craque_final', 950), 'cq_gramado_h3', '🏆 O Craque da Final',
      'O Craque da Final é o melhor jogador que nunca ganhou uma taça. Vença o Craque no círculo central do Gramado da Final Eterna: ele quer saber se você é digno da final.',
      { kill: 'cq_craque_final', n: 1 }, 1.8, ingr(10),
      { mais: 'Quanto mais o duelo demora, mais forte ele fica: é a prorrogação eterna! Leve as três melhores comidas e não desista no fim.',
        fim: '"Você é digno, craque", disse ele. "Mas a final de verdade só recomeça com a primeira bola do universo... a Bola de Origem."' }],

    // 🏆 A final (depois da saga da Bola de Origem; volta toda semana)
    ['cq_gramado_onze', 'dona_memoria', 950, 'cq_gramado_chefe', '🏆 A final dos Onze Esquecidos',
      'Com a Bola de Origem, a final pode recomeçar! Vença os Onze Esquecidos na Arena da Final, no Gramado da Final Eterna, e dê a eles o apito final. Eles voltam toda semana.',
      { kill: 'cq_onze', n: 1 }, 2, ingr(15),
      { fig: 'onze', final: true,
        mais: 'Os Onze Esquecidos são os melhores de cada time: goleiro, zaga e ataque, cada setor com um poder. No fim vem o lance decisivo, valendo a taça. Na primeira vitória, a Taça dos Esquecidos é sua; depois, eles voltam toda semana, um pouco mais fortes.',
        fim: 'O apito final soou! Os Onze Esquecidos ergueram a taça junto com você... e agora torcem por você em todas as arenas!' }],
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
    if (q.req.kill && !q.req.desc) q.req.desc = `Vença ${q.req.n}x ${nomeMon(q.req.kill)} (${nomeAla(String(id).replace(/_(h\d|chefe|onze)$/, ''))})`;
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
        if (q && q.id === 'cq_ingresso' && G.save) { G.save.flags.cq_portal = true; log('🎟️ O ingresso amarelado brilhou: o Portal dos Esquecidos, no alto do Estádio do Multiverso, está aberto!', 'l-xp'); salvar(); }
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
    setInterval(() => { try { if (G.save && G.rodando) marcaFinal(G.save); if (G.save && G.rodando && cqHistViraSemana(G.save)) { G.uiSujo = true; log('🏆 Os Onze Esquecidos voltaram ao Gramado da Final Eterna! A Dona Memória tem a final da semana para você.', 'l-xp'); } } catch (e) { } }, 30000);
  }

  /* ---------- entregar: figurinha do time, taça na primeira final, semana da final ---------- */
  {
    const _entCq = entregaMissao;
    entregaMissao = function (q) {
      const primeira = q && q.cqFinal && G.save && !G.save.flags.cq_campeao;
      const r = _entCq.apply(this, arguments);
      try {
        if (ehCq(q)) {
          if (q.cqFig) cqHistGanhaFig(q.cqFig, '(presente da Dona Memória)');
          if (q.cqFinal) {
            const e = G.save.quests[q.id]; if (e) e.sem = semana();
            if (primeira && ITENS.taca_esquecidos) { recebeItem('taca_esquecidos', 1); log('🏆 A Taça dos Esquecidos é sua!', 'l-lvl'); }
            banner('🏆 Campeão da Copa de Origem!', 'Os Esquecidos ergueram a taça com você');
          }
          salvar();
        }
      } catch (e) { console.warn('copa história', e); }
      return r;
    };
  }

  /* ---------- conversas: falar com quem a missão manda, enigma, botões ---------- */
  const agora = () => Date.now();
  const fmtMin = ms => `${Math.max(1, Math.ceil(ms / 60000))} min`;
  const falaBox = (npc, ...ps) => el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, ...ps));
  const btnDiario = () => el('button', { class: 'btn', type: 'button', onclick: () => cqHistDiario() }, '📖 Histórias dos Esquecidos');
  function cqHistConclui(npc, q) {
    const e = G.save.quests[q.id]; e.p = 1;
    entregaMissao(q);
    const prox = MISSOES.find(x => ehCq(x) && x.pre === q.id && statusMissao(x) === 'disponivel');
    const ps = [el('p', {}, q.enigma ? (q.depois || q.chegada) : q.chegada)];
    if (q.chegadaMais && !q.enigma) ps.push(el('details', { class: 'mrx-mais' }, el('summary', {}, '📖 Saiba mais'), el('p', {}, q.chegadaMais)));
    abreModal(el('h2', {}, npc.d.nome), falaBox(npc, ...ps),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => abrirNPC(npc) }, prox && prox.npc === npc.id ? 'Continuar' : 'OK'), btnDiario()));
  }
  function cqHistEnigma(npc, q) {
    const e = G.save.quests[q.id];
    if (e.erroAte && agora() < e.erroAte)
      return abreModal(el('h2', {}, npc.d.nome), falaBox(npc, el('p', {}, `"Pense mais um pouquinho e volte em ${fmtMin(e.erroAte - agora())}. Errar faz parte: quem não desiste aprende!"`)),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Tchau!')));
    let i = 0;
    const pergunta = () => {
      const p = q.enigma[i];
      abreModal(el('h2', {}, `${npc.d.nome} — pergunta ${i + 1} de ${q.enigma.length}`), falaBox(npc, el('p', {}, i === 0 ? q.chegada : 'Muito bem... e agora?'), el('p', {}, el('b', {}, p.p))),
        el('div', { class: 'opcoes' }, ...p.ops.map((o, k) => el('button', { class: 'btn', type: 'button', onclick: () => {
          if (k !== p.c) {
            e.erroAte = agora() + 3 * 60000; salvar(); som('erro');
            return abreModal(el('h2', {}, npc.d.nome), falaBox(npc, el('p', {}, '"Quase! Não foi bem assim. Pense com calma e volte daqui a 3 minutos: eu espero você."')), el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'OK')));
          }
          som('moeda'); i++; if (i < q.enigma.length) pergunta(); else cqHistConclui(npc, q);
        } }, o))));
    };
    pergunta();
  }

  // falas dos anfitriões (uma por vez, variando)
  const CQ_HIST_FALAS = {
    seu_saudade: [
      'Bem-vindo(a) ao Estádio dos Esquecidos! Eu cuido das camisas de todos os times daqui. Traga Ingressos Esquecidos e eu troco por peças do Uniforme dos Esquecidos.',
      'Cada camisa deste vestiário tem uma história. Eu lavo, passo e guardo todas, esperando o dia da final.',
      'Os fantasmas daqui não assustam ninguém: só querem um bom jogo. E perdem com um sorriso!',
      'Ingresso Esquecido cai dos times daqui quando você joga contra eles. Junte e venha trocar comigo!',
    ],
    dona_memoria: [
      'Eu vi todos os jogos da Copa de Origem, sabia? Cada time daqui tem uma história. Quer ouvir?',
      'Nenhum time daqui ganhou nada... mas nenhum desistiu. Isso também é ser campeão, não acha?',
      'Quando você vence um time em jogo limpo, ele lembra por que jogava. É a coisa mais bonita de ver!',
      'Já olhou o seu Álbum dos Esquecidos? Cada figurinha é um time que voltou a sorrir.',
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
        if (contaItem(ING) < CQ_HIST_FIG_PRECO) { log(`Faltam Ingressos Esquecidos: a figurinha custa ${CQ_HIST_FIG_PRECO}.`, 'l-dano'); som('erro'); return; }
        removeItem(ING, CQ_HIST_FIG_PRECO); cqHistGanhaFig(t.id, '(trocada com o Seu Saudade)'); salvar(); cqHistVitrine(npc);
      } }, `${CQ_HIST_FIG_PRECO} 🎟️`))));
    abreModal(el('h2', {}, '🎴 Figurinhas à vista'), falaBox(npc, el('p', {}, falta.length ? `Guardei uma figurinha de cada time! Você vê qual é antes de trocar: ${CQ_HIST_FIG_PRECO} Ingressos Esquecidos cada. Você tem ${tem}.` : 'Você já tem a figurinha de todos os times daqui! A dos Onze Esquecidos só vem da final.')),
      falta.length ? lista : '', el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: () => window.cqHistAlbum() }, '👻 Ver o álbum'), el('button', { class: 'btn', type: 'button', onclick: () => abrirNPC(npc) }, 'Voltar')));
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
      } catch (e) { console.warn('copa história', e); }
      const r = _abrirCq.apply(this, arguments);
      // o personagem pode ter outra janela na frente (o Orbitto, a troca do Seu Saudade): a missão da Copa ganha um botão
      try {
        const box = document.getElementById('modalConteudo'), ops = box && box.querySelector('.opcoes');
        if (ops && G.save && npc) {
          const q = MISSOES.find(x => ehCq(x) && x.npc === npc.id && ['disponivel', 'pronta', 'ativa'].includes(statusMissao(x)));
          if (q && !box.textContent.includes(q.titulo)) {
            const st = statusMissao(q); let b = null;
            if (st === 'disponivel') b = el('button', { class: 'btn amarelo', type: 'button', onclick: () => modalMissao(npc, q) }, `Missão: ${q.titulo}`);
            else if (st === 'pronta' && !q.req.fala) b = el('button', { class: 'btn amarelo', type: 'button', onclick: () => { entregaMissao(q); abrirNPCDepois(npc, q.fim); } }, `Entregar: ${q.titulo}`);
            else if (st === 'ativa') { const [a, n] = progressoMissao(q); b = el('button', { class: 'btn', type: 'button', onclick: () => modalMissoes() }, `${q.titulo}: ${descMissao(q)}${q.req.fala ? '' : ` — ${a}/${n}`}`); }
            if (b) ops.prepend(b);
          }
          if (npc.id === 'dona_memoria' || npc.id === 'seu_saudade') {
            const fim = ops.lastChild;
            if (npc.id === 'seu_saudade' && ITENS[ING]) ops.insertBefore(el('button', { class: 'btn', type: 'button', onclick: () => cqHistVitrine(npc) }, '🎴 Figurinhas à vista'), fim);
            if (npc.id === 'dona_memoria') { ops.insertBefore(btnDiario(), fim); ops.insertBefore(el('button', { class: 'btn', type: 'button', onclick: () => window.cqHistAlbum() }, '👻 Álbum dos Esquecidos'), fim); }
            // a final esperando a Bola de Origem
            const qf = cqQ('cq_gramado_onze'), fala = box.querySelector('.fala');
            if (npc.id === 'dona_memoria' && qf && fala && !finalLiberada(G.save) && statusMissao(cqQ('cq_gramado_chefe') || {}) === 'feita')
              fala.append(el('p', { class: 'dica' }, '🏆 A final dos Onze Esquecidos só recomeça com a Bola de Origem inteira e acordada (saga "A Bola de Origem", 📜 no ☰ Menu).'));
            else if (npc.id === 'dona_memoria' && qf && fala && G.save.quests.cq_gramado_onze && G.save.quests.cq_gramado_onze.s === 'feita')
              fala.append(el('p', { class: 'dica' }, '🏆 Você já jogou a final desta semana. Os Onze Esquecidos voltam na segunda-feira, um pouco mais fortes!'));
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
        if (t && G.save && !albumDe()[t.id] && !t.final && Math.random() < (d && d.chefe ? 0.5 : CQ_HIST_FIG_CHANCE)) cqHistGanhaFig(t.id, `(caiu de ${nomeMon(m.tipo)})`);
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
      const dica = t.final ? 'Vem da final dos Onze Esquecidos.' : `Cai dos fantasmas do time (${t.adv.map(nomeMon).join(', ')}) — ${nomeAla(t.ala)}. Ou à vista com o Seu Saudade.`;
      return el('div', { class: 'cq-fig' + (tem ? ' tem' : ' falta') }, cqHistEscudo(t, 72), el('b', {}, tem ? t.nome : '???'),
        el('small', { class: 'cq-fig-ala' }, CQ_HIST_ALAS[t.ala] || ''), el('small', {}, tem ? t.txt : dica));
    }));
    const ops = el('div', { class: 'opcoes' });
    if (n >= total && !s.flags.cq_album) ops.append(el('button', { class: 'btn amarelo grande', type: 'button', onclick: () => {
      s.flags.cq_album = true; const R = cqHistR(950, 0, [[ING, 30]]); s.ouro += R.ouro; for (const [id, q] of R.itens) recebeItem(id, q);
      log(`👻 ÁLBUM DOS ESQUECIDOS COMPLETO! Você ganhou ${fmt(R.ouro)} tostões${R.itens.length ? ' e 30 Ingressos Esquecidos' : ''}.`, 'l-lvl'); banner('Álbum dos Esquecidos completo!', 'Todos os times lembraram por que jogavam'); som('nivel'); salvar(); window.cqHistAlbum();
    } }, 'Resgatar o prêmio do álbum!'));
    abreModal.largo = true;
    abreModal(el('h2', {}, `👻 Álbum dos Esquecidos (${n}/${total})`),
      el('p', { class: 'dica' }, 'Uma figurinha para cada time da Copa de Origem. Elas caem jogando contra os fantasmas do time (os chefões dão mais), vêm de presente nas histórias da Dona Memória ou ficam à vista com o Seu Saudade, por Ingressos Esquecidos. Nada de sorteio!'),
      ops, grade);
  }
  window.cqHistAlbum = cqHistAlbum;
  try { // a aba no Caderno do Craque
    if (typeof CDN_ABAS !== 'undefined' && !CDN_ABAS.some(a => a[0] === 'esquecidos')) {
      const aba = ['esquecidos', 'Esquecidos', '👻', () => window.cqHistAlbum(), /^👻 Álbum dos Esquecidos/,
        () => !!(G.save && ((G.save.nivel || 1) >= 700 || Object.keys(G.save.cqAlbum || {}).length)), () => 700,
        s => { const al = (s && s.cqAlbum) || {}, n = CQ_HIST_TIMES.filter(t => al[t.id]).length; return { f: n / CQ_HIST_TIMES.length, t: `${n}/${CQ_HIST_TIMES.length}` }; }];
      CDN_ABAS.push(aba); if (typeof CDN_POR !== 'undefined') CDN_POR.esquecidos = aba;
      if (typeof cdnEmbrulha === 'function') cdnEmbrulha('cqHistAlbum', 'esquecidos');
    }
  } catch (e) { console.warn('álbum dos esquecidos', e); }

  /* ---------- 📖 Histórias dos Esquecidos (o que a Dona Memória já contou) ---------- */
  function cqHistDiario() {
    const s = G.save; if (!s) return;
    const grupos = [['🎟️ O estádio', /^cq_(ingresso|memoria|pista_origem)$/], ...Object.entries(CQ_HIST_ALAS).map(([id, nome]) => [nome, new RegExp('^' + id + '_')])];
    const blocos = grupos.map(([nome, rx]) => {
      const qs = MISSOES.filter(q => ehCq(q) && rx.test(q.id)); if (!qs.length) return '';
      const linhas = []; let atual = null, feitas = 0;
      for (const q of qs) {
        const st = statusMissao(q);
        if (st === 'feita' || (q.cqFinal && s.flags.cq_campeao)) { feitas++; linhas.push(el('p', { class: 'sg-h' }, el('b', {}, q.titulo.replace(/^\S+ /, '') + ': '), q.req.fala ? (q.enigma ? (q.depois || q.chegada) : q.chegada) : (q.mais || q.texto))); if (q.fim) linhas.push(el('p', { class: 'sg-h sg-fim' }, q.fim)); continue; }
        if (!atual && st !== 'bloqueada') atual = q;
      }
      let ag = null;
      if (atual) { const st = statusMissao(atual); ag = st === 'nivel' ? `🔒 Continua no nível ${atual.lvl}.` : st === 'disponivel' ? `👉 Fale com ${nomeNpc(atual.npc)}: ${atual.titulo.replace(/^\S+ /, '')}.` : st === 'pronta' ? `✅ Pronto! Volte a falar com ${nomeNpc(atual.npc)}.` : `👉 ${descMissao(atual)}${atual.req.fala ? '' : ` (${progressoMissao(atual).join('/')})`}.`; }
      return el('details', { class: 'sg-cap', open: atual && statusMissao(atual) !== 'nivel' ? 'open' : null }, el('summary', {}, `${feitas === qs.length ? '✅' : feitas || atual ? '📖' : '🔒'} ${nome} (${feitas}/${qs.length})`), ...linhas, ag ? el('p', { class: 'sg-agora' }, ag) : '');
    });
    abreModal(el('h2', {}, '📖 Histórias dos Esquecidos'),
      el('p', { class: 'dica' }, (s.nivel || 1) < 700 ? 'No nível 700, o Grão-Guardião Orbitto (Estádio do Multiverso) acha um ingresso muito antigo...' : 'A Copa de Origem nunca terminou. Cada time esquecido tem uma história: a Dona Memória lembra de todas.'),
      ...blocos, el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: () => window.cqHistAlbum() }, '👻 Álbum dos Esquecidos'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
  }
  window.cqHistDiario = cqHistDiario;

  /* ---------- ✨ a pista no Diário da Bola de Origem ---------- */
  {
    const _amCq = abreModal;
    abreModal = function () {
      const r = _amCq.apply(this, arguments);
      try {
        const box = document.getElementById('modalConteudo'), h = box && box.querySelector(':scope > h2');
        if (G.save && h && h.textContent === '📜 A Bola de Origem' && !box.querySelector('.cq-pista')) {
          const s = G.save, feita = s.quests.cq_pista_origem && s.quests.cq_pista_origem.s === 'feita';
          const txt = feita ? '🎟️ Pista da Copa dos Esquecidos: a final da Copa de Origem parou quando esta bola se partiu. Com a Bola de Origem inteira, a final poderá recomeçar (Dona Memória, no Estádio dos Esquecidos).'
            : (s.nivel || 1) >= 700 && cqQ('cq_pista_origem') ? '🎟️ Pista nova: no Estádio dos Esquecidos (portal no alto do Estádio do Multiverso), a Dona Memória sabe algo sobre a primeira bola.' : null;
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
            r.viagem = (r.viagem ? r.viagem + ' ' : '') + '🏟️ No Multiverso, entre pelo Portal do Estádio dos Esquecidos (nível 700).';
        }
      } catch (e) { }
      return r;
    };
  }

  /* ---------- avisos das pressões das alas (ao entrar) ---------- */
  const CQ_HIST_PRESSAO = {
    cq_vestiario: '🥶 Brrr, que frio no Vestiário Abandonado! Aqui você cansa mais rápido. Comidas de fôlego ajudam a aguentar.',
    cq_tunel: '🌑 O Túnel de Acesso é bem escuro: você só enxerga de perto. Comidas de visão e foco ajudam a enxergar mais longe.',
    cq_arquibancada: '📣 Que barulho na Arquibancada Infinita! Aqui o seu foco gasta mais rápido. Comidas de foco ajudam.',
    cq_gramado: '🌫️ No Gramado da Final Eterna faz frio, é escuro e tem barulho, tudo junto! Leve as três melhores comidas: fôlego, visão e foco.',
  };
  const CQ_HIST_ENTRADA = {
    cq_estadio: '🎟️ Estádio dos Esquecidos: aqui jogam os times que nunca ganharam nada. Fale com o Seu Saudade e a Dona Memória!',
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
    cq_reserva: ['Já é a minha vez?', 'Tô aquecido, professor!', 'Me chama!'],
    cq_massagista: ['Zzz... alongou?', 'Zzz... gelo no joelho...', 'Ninguém se machuca aqui!'],
    cq_gandula: ['Peguei a bola!', 'Ninguém me alcança!', 'Vupt!'],
    cq_zagueiro: ['Aqui não passa!', 'Zero a zero de novo!', 'Muralha!'],
    cq_bandeirinha: ['Impedido!', 'Bandeira pra cima!', 'Tá na linha!'],
    cq_arbitro: ['Fiiiu!', 'Jogo limpo, hein!', 'Cadê o meu apito?'],
    cq_torcida: ['Uh, uh, uh!', 'Olê, olê, olá!', 'Vai, time!'],
    cq_bumbo: ['BUM!', 'BUM-BUM-BUM!', 'Tum-tum!'],
    cq_mascote: ['Cadê o meu time?', 'Não vou largar a bandeira!', 'Abraço?'],
    cq_craque: ['Quase!', 'Na próxima eu ganho!', 'Mais uma final!'],
    cq_goleiro: ['Defendi!', 'Mil e uma!', 'Pode chutar!'],
    cq_tecnico: ['...!', '(aponta para a prancheta)', '(faz sinal de joia)'],
    cq_cap_vestiario: ['Ninguém desiste!', 'Bom jogo!', 'Vamos, time!'],
    cq_xerife_tunel: ['Aqui só passa quem joga limpo!', 'Regra é regra!', 'Pode passar... se me vencer!'],
    cq_rei_arquibancada: ['Canta, arquibancada!', 'É campeão!', 'Mais alto!'],
    cq_craque_final: ['A prorrogação é minha!', 'Ainda não acabou!', 'Que jogão!'],
    cq_onze: ['Pela Copa de Origem!', 'Todos juntos!', 'Apita, juiz!'],
  };
  for (const [id, f] of Object.entries(CQ_HIST_FALAS_MON)) { const d = MONSTROS[id]; if (d && !(d.falas && d.falas.length)) d.falas = f; }

  /* ---------- capítulos curtos (arte que já existe; a frente ARTE pode trocar em window.CQ_CAP_IMG) ---------- */
  if (typeof CAPITULOS !== 'undefined' && typeof CAPITULOS_ORDEM !== 'undefined') {
    const hn = n => (typeof _hn === 'function' ? _hn(n) : (n || 'você'));
    const img = (k, padrao) => () => (window.CQ_CAP_IMG && window.CQ_CAP_IMG[k]) || padrao;
    const cena = (k, padrao, o) => Object.defineProperty(o, 'img', { get: img(k, padrao), enumerable: true });
    CAPITULOS.cq_copa = {
      rotulo: 'Capítulo 13', titulo: 'A Copa dos Esquecidos', emoji: '🎟️', implica: ['multiverso'],
      cond: (s, mapa) => /^cq_/.test(mapa || ''),
      cenas: [
        cena('ingresso', 'cap_mv_1', { kb: 'kb-a', cor: ['#140a40', '#ffb04a'], txt: n => 'No Estádio do Multiverso, o Orbitto achou no chão um ingresso antigo e amarelado: "Copa de Origem — Final". E o portal selado começou a brilhar!' }),
        cena('estadio', 'cap_gloria_4', { kb: 'kb-zoom', foco: '60% 22%', cor: ['#140a40', '#3a2780'], txt: n => 'Do outro lado, um estádio fora do tempo. Antes de a primeira bola do universo se partir, ali se jogava a Copa de Origem... e a final nunca terminou.' }),
        cena('times', 'cap_clube_estadio_0', { kb: 'kb-b', cor: ['#c89a5a', '#6a4a2a'], txt: n => 'Os times que nunca ganharam nada ficaram lá, jogando para sempre, esperando o apito final. Viraram fantasmas... mas fantasmas simpáticos, que só querem jogar bola!' }),
        cena('anfitrioes', 'cap_clube_torcida_3', { kb: 'kb-a', cor: ['#1a2a6a', '#5a8ad8'], txt: n => `O Seu Saudade, o roupeiro, e a Dona Memória, a torcedora mais antiga, esperavam alguém havia muito tempo. "Bem-vindo(a), ${hn(n)}! Vamos lembrar esses times por que eles jogavam?"` }),
      ],
      final: { emoji: '🎟️', titulo: 'A Copa dos Esquecidos', sub: n => 'Capítulo 13 começou! Ajude cada time esquecido a lembrar por que jogava (níveis 700 a 950). Não desista: eles também nunca desistiram.', botao: 'Bora jogar! ⚽' },
    };
    CAPITULOS.cq_taca = {
      rotulo: 'Epílogo', titulo: 'A taça, enfim', emoji: '🏆', implica: ['multiverso', 'cq_copa'],
      cond: s => !!(s.flags && s.flags.cq_campeao),
      cenas: [
        cena('final', 'cap_mv_1', { kb: 'kb-zoom', foco: '22% 70%', cor: ['#140a40', '#ffb04a'], txt: n => 'No Gramado da Final Eterna, a Bola de Origem rolou de novo. Os Onze Esquecidos jogaram o melhor jogo da vida deles.' }),
        cena('apito', 'cap_gloria_4', { kb: 'kb-d', cor: ['#140a40', '#3a2780'], som: 'gol', txt: n => 'E então... FIIIIU! O Apito da Final soou, depois de tanto, tanto tempo. A final da Copa de Origem, enfim, terminou.' }),
        cena('taca', 'cap_clube_torcida_3', { kb: 'kb-a', cor: ['#1a2a6a', '#5a8ad8'], txt: n => `Os Esquecidos ergueram a taça junto com ${hn(n)}. O Unidos do Banco, o Muralha, o Quase Lá... todos sorrindo. Ninguém ali tinha desistido.` }),
        cena('torcida', 'cap_clube_torcida_3', { kb: 'kb-zoom', foco: '50% 40%', cor: ['#1a2a6a', '#5a8ad8'], txt: n => 'E agora, em cada arena, uma torcida de névoa canta o seu nome. Os Esquecidos viraram a sua torcida!' }),
      ],
      final: { emoji: '🏆', titulo: 'A taça, enfim', sub: n => `Campeão da Copa de Origem${n ? ', ' + n : ''}! Os Onze Esquecidos voltam toda semana para mais uma final.`, botao: 'A lenda continua... ⚽' },
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
