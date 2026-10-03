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
  const SG_LUGAR = { estela_estacao: 'Estação Espacial Galáctica', guardiao_mv: 'Estádio do Multiverso', lider_lua: 'Lua', lider_marte: 'Marte', lider_saturno: 'Saturno',
    lider_nebulosa: 'Nebulosa de Órion', prof_coral: 'Atlântida', rei_barbaferro: 'Reino de Pedraforte', mestra_bigorna: 'Reino de Pedraforte', rainha_nimbus: 'Picos Nublados', ferreiro_gigante: 'Picos Nublados' };
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
    mapa_estelar: ['Mapa Estelar Costurado', 'Um mapa antigo das estrelas, costurado como uma bola. Achado pela Dra. Estela num satélite velho.'],
    detector_lunar: ['Detector Lunar', 'Apita perto de coisas que brilham na Lua. Feito pela Comandante Luna.'],
    gomo_lua: ['Gomo da Lua', 'O 1º gomo da Bola de Origem: pedra lunar que brilha azul.'],
    gomo_marte: ['Gomo de Marte', 'O 2º gomo: pedra vermelha, quentinha. O General Marciano usava como medalha.'],
    gomo_saturno: ['Gomo de Saturno', 'O 3º gomo: cristal de gelo com um anel dourado em volta.'],
    gomo_nebulosa: ['Gomo da Nebulosa', 'O 4º gomo: vidro de estrelas com uma nebulosa girando dentro.'],
    gomo_oceano: ['Gomo do Oceano', 'O 5º gomo: pérola e coral. A Vovó Tuga achou que era uma água-viva.'],
    gomo_montanha: ['Gomo da Montanha', 'O 6º gomo: pedra com runas douradas. Era a joia da coroa dos anões.'],
    nucleo_bola: ['Núcleo da Bola', 'Seis gomos forjados juntos pela Mestra Bigorna. Falta um.'],
    gomo_ceu: ['Gomo do Céu', 'O 7º gomo: nuvem com bordas de ouro, guardado no alto do mundo.'],
    linha_nuvem: ['Carretel de Linha de Nuvem', 'Linha fiada pelos gigantes com algodão de nuvem. Só ela costura a Bola de Origem.'],
    bola_dormindo: ['Bola de Origem (adormecida)', 'A primeira bola do universo, inteira de novo... mas dormindo. Precisa do chute de um craque de verdade.'],
    bola_origem: ['⭐ Bola de Origem', 'A primeira bola do universo, acordada. Gira em volta de você (Equipamento → ✨ Adornos).'],
    medalha_origem: ['Medalha da Origem', 'Para quem reconstruiu a primeira bola do universo. Pouquíssimos craques têm uma.'],
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
  const CAP = [
    { n: 0, nome: 'Prólogo — O mapa do satélite', passos: [
      ['p1', 'estela_estacao', 420, 'O sinal estranho', 'Craque, preciso de você! Meu radar pegou um sinal estranho vindo de um satélite velhinho... e dentro dele tinha ISTO: um mapa das estrelas costurado como uma bola de futebol! Leve para o Grão-Guardião Orbitto, no Estádio do Multiverso. Ele conhece as lendas mais antigas.',
        { fala: 'guardiao_mv' }, R(420, 0.4, 20000, [['mapa_estelar', 1]]), null,
        { chegada: 'Orbitto arregala os olhos: "Onde... onde você achou isso? Sente aí, craque. Vou te contar a lenda mais antiga de todas. No começo de tudo, alguém deu o PRIMEIRO CHUTE da história. A bola voou tão forte que as faíscas viraram as estrelas... e a bola se partiu em 7 gomos, espalhados pelos mundos. A Bola de Origem!"' }],
      ['p2', 'guardiao_mv', 420, 'Digno da lenda', 'Os 7 gomos só se mostram para quem tem coração de campeão. Prove que você é digno: vença o Imperador Nebular 3 vezes. Ele sabe perder com classe, não se preocupe.',
        { kill: 'ch_imperador_nebular', n: 3 }, R(420, 1.2, 40000, [['elixir_multiverso', 5]]), 'Muito bem! Olhe o mapa: está brilhando sobre a LUA. É lá que está o primeiro gomo. Fale com a Comandante Luna.'],
    ] },
    { n: 1, nome: 'Capítulo 1 — O brilho na Lua', passos: [
      ['l1', 'guardiao_mv', 430, 'Rumo à Lua', 'O mapa aponta para o Mar da Tranquilidade. A Comandante Luna conhece cada cratera de lá. Vá falar com ela.',
        { fala: 'lider_lua' }, R(430, 0.3, 20000), null,
        { chegada: 'A Comandante Luna examina o mapa: "Um gomo da Bola de Origem? Aqui? Hmm... os Coelhinhos Lunares vivem juntando coisas que brilham! Mas para achar o gomo no meio de tanta poeira, vou precisar construir um Detector Lunar."' }],
      ['l2', 'lider_lua', 435, 'O Detector Lunar', 'O detector funciona com Poeira Lunar bem fininha. Traga 60 Poeiras Lunares das caçadas da Lua (os bichos de lá derrubam).',
        { item: 'lr_lua_1', n: 60, desc: 'Junte 60 Poeiras Lunares (caçadas da Lua)' }, R(435, 1.5, 50000, [['detector_lunar', 1]]), 'Pronto! Agora ele precisa carregar com a luz da Terra.'],
      ['l3', 'lider_lua', 440, 'Carregando com a luz da Terra', 'O Detector Lunar precisa ficar 1 hora virado para a Terra, carregando. Vá caçar, treinar, o que quiser... e volte depois.',
        { espera: 1 }, R(440, 0.6, 60000, [['gomo_lua', 1]]), 'PI-PI-PI-PIII! Achamos! Estava debaixo da toca do Coelhinho mais velho. O 1º gomo é seu! O mapa agora brilha sobre... MARTE.'],
    ] },
    { n: 2, nome: 'Capítulo 2 — A medalha do General', passos: [
      ['m1', 'lider_lua', 470, 'O próximo brilho', 'O mapa está apontando para Marte. A Engenheira Rubi sabe tudo de lá. Pegue a nave e vá falar com ela!',
        { fala: 'lider_marte' }, R(470, 0.3, 20000), null,
        { chegada: 'A Engenheira Rubi ri alto: "Um gomo vermelho e quentinho? Ah, eu sei onde está! O General Marciano usa no peito, como medalha, e diz que é o seu amuleto da sorte. Ele não vai entregar assim, não..."' }],
      ['m2', 'lider_marte', 480, 'O amuleto da sorte', 'O General só devolve se perder de um jeito que ele nunca esqueça. Vença o General Marciano 10 vezes: depois da décima, ele vai admitir que o amuleto não está dando sorte nenhuma!',
        { kill: 'ch_general_marciano', n: 10 }, R(480, 1.6, 60000, [['bau_torre', 1]]), '"Tá bom, tá bom! Esse amuleto não presta pra nada!" — o General jogou o gomo pra você. Mas ele caiu num buraco do Deserto dos Rovers...'],
      ['m3', 'lider_marte', 490, 'O braço do rover', 'O gomo caiu num buraco fundo. Vou adaptar um braço de rover para pegar, mas preciso de 20 Parafusos de Rover (as Aranhas-Rover e os robôs derrubam).',
        { item: 'lr_marte_2', n: 20, desc: 'Junte 20 Parafusos de Rover (caçadas de Marte)' }, R(490, 1.8, 80000, [['gomo_marte', 1]]), 'Clanc, clanc... PEGUEI! O 2º gomo é seu. O mapa brilha agora sobre os anéis de SATURNO.'],
    ] },
    { n: 3, nome: 'Capítulo 3 — O gelo dos anéis', passos: [
      ['s1', 'lider_marte', 530, 'Os anéis de cristal', 'Saturno! A Astrônoma Vega vive lá, estudando os anéis. Vá falar com ela.',
        { fala: 'lider_saturno' }, R(530, 0.3, 20000), null,
        { chegada: 'A Astrônoma Vega aponta o telescópio: "Está vendo aquele brilho dentro do anel? É o gomo, congelado num bloco de gelo que nunca derrete. Nada daqui esquenta tanto... a não ser a Brasa Eterna, aquela pedra de fogo que sai dos baús da Torre Infinita!"' }],
      ['s2', 'lider_saturno', 540, 'O fogo que nunca apaga', 'Traga 10 Brasas Eternas. Elas saem dos Baús da Torre, os prêmios dos chefões da Torre Infinita, e a Mestra Altina troca baús por Fichas.',
        { item: 'brasa_eterna', n: 10, desc: 'Junte 10 Brasas Eternas (Baús da Torre)' }, R(540, 1.8, 90000), 'As brasas estão em volta do bloco de gelo. Agora é esperar...'],
      ['s3', 'lider_saturno', 545, 'Degelo', 'Gelo de anel de Saturno derrete bem devagarinho: umas 3 horas. Pode ir jogando outras coisas que eu fico de olho.',
        { espera: 3 }, R(545, 0.8, 90000, [['gomo_saturno', 1]]), 'PLIC! O gelo derreteu e o 3º gomo caiu na minha mão. Tome! O mapa agora mostra a NEBULOSA DE ÓRION.'],
    ] },
    { n: 4, nome: 'Capítulo 4 — A memória das estrelas', passos: [
      ['n1', 'lider_saturno', 590, 'A Guardiã das estrelas', 'Na Nebulosa de Órion vive a Guardiã Órion. Dizem que ela lembra de tudo o que já aconteceu no universo. Vá falar com ela.',
        { fala: 'lider_nebulosa' }, R(590, 0.4, 25000), null,
        { chegada: 'A Guardiã Órion sorri: "O gomo da Nebulosa só aparece para quem lembra da própria história. Vamos ver se você prestou atenção na sua jornada, craque."',
          enigma: [
            { p: 'Quem achou o Mapa Estelar dentro de um satélite velho?', ops: ['O Grão-Guardião Orbitto', 'A Dra. Estela', 'O General Marciano'], c: 1 },
            { p: 'Em quantos gomos a Bola de Origem se partiu?', ops: ['5', '7', '11'], c: 1 },
            { p: 'O que derreteu o gelo dos anéis de Saturno?', ops: ['Brasa Eterna', 'Poeira Lunar', 'Um secador gigante'], c: 0 },
          ] }],
      ['n2', 'lider_nebulosa', 600, 'Estrelas que caem', 'Você lembra de tudo! O gomo está escondido dentro de uma Estrela Cadente, e elas são raríssimas. Traga 3 Estrelas Cadentes das caçadas da Nebulosa e eu acho a certa.',
        { item: 'lr_nebulosa_3', n: 3, desc: 'Junte 3 Estrelas Cadentes (caçadas da Nebulosa, raras)' }, R(600, 2, 120000, [['gomo_nebulosa', 1], ['foco_multiverso', 5]]), 'Esta aqui! Dentro dela, o 4º gomo, girando como uma nebulosa. O mapa agora aponta para o fundo do mar: ATLÂNTIDA.'],
    ] },
    { n: 5, nome: 'Capítulo 5 — A Vovó Tuga', passos: [
      ['a1', 'lider_nebulosa', 670, 'De volta à Terra... lá no fundo', 'O próximo gomo está debaixo d\'água, em Atlântida. O Professor Coral estuda tudo o que existe lá embaixo. Vá falar com ele.',
        { fala: 'prof_coral' }, R(670, 0.4, 25000), null,
        { chegada: 'O Professor Coral ajeita os óculos: "Um gomo brilhante de pérola? Ih... a Vovó Tuga, a tartaruga mais velha do oceano, engoliu uma coisa assim achando que era uma água-viva! Não se preocupe, ela está bem. Mas para ela soltar, só fazendo cócegas com Pérolas Negras."' }],
      ['a2', 'prof_coral', 680, 'Cócegas de pérola', 'Traga 25 Pérolas Negras do Recife de Coral. Com elas eu faço um espanador de cócegas que nenhuma tartaruga aguenta!',
        { item: 'lr_caca_recife_2', n: 25, desc: 'Junte 25 Pérolas Negras (Recife de Coral)' }, R(680, 2, 130000), 'O espanador está pronto! Só tem um problema: a Vovó Tuga está dormindo.'],
      ['a3', 'prof_coral', 685, 'Esperando a Vovó acordar', 'Tartaruga de 900 anos dorme muito! Ela acorda em umas 2 horas. Volte depois.',
        { espera: 2 }, R(685, 0.8, 130000, [['gomo_oceano', 1]]), 'Hihihi... ATCHIM! A Vovó Tuga espirrou o gomo e pediu desculpas pela confusão. O 5º gomo é seu! O mapa brilha agora dentro de uma MONTANHA: Pedraforte, o reino dos anões.'],
    ] },
    { n: 6, nome: 'Capítulo 6 — A joia da coroa', passos: [
      ['d1', 'prof_coral', 750, 'O reino dentro da montanha', 'Pelo Portal dos Anões, no Estádio do Multiverso, você chega em Pedraforte. Vá falar com o Rei Barbaferro.',
        { fala: 'rei_barbaferro' }, R(750, 0.4, 30000), null,
        { chegada: 'O Rei Barbaferro tira a coroa e mostra a pedra do meio, cheia de runas: "ESTE gomo? É a joia da coroa de Pedraforte há mil anos! Mas... a lenda diz que um dia viria um craque buscá-la. Se for você mesmo, prove!"' }],
      ['d2', 'rei_barbaferro', 760, 'Prova de anão', 'Um anão só confia em quem sobe alto. Chegue ao andar 50 da Torre Infinita.',
        { flag: 'torre_50', desc: 'Vença o andar 50 da Torre Infinita' }, R(760, 1.5, 120000), 'Andar 50! Nem meu bisavô subiu tanto. Falta só uma coisinha...'],
      ['d3', 'rei_barbaferro', 765, 'O museu do rei', 'Para o lugar vazio da coroa, quero 2 Taças do Multiverso (os chefões da Torre deixam cair). Uma troca justa!',
        { item: 'taca_multiverso', n: 2, desc: 'Junte 2 Taças do Multiverso (chefões da Torre)' }, R(765, 1.5, 140000, [['gomo_montanha', 1]]), 'Negócio fechado! O 6º gomo é seu. E agora a Mestra Bigorna pode juntar os seis!'],
      ['d4', 'rei_barbaferro', 770, 'A forja dos seis gomos', 'Leve os seis gomos para a Mestra Bigorna. Só ela consegue forjar os gomos juntos sem rachar nenhum.',
        { fala: 'mestra_bigorna' }, R(770, 0.3, 30000), null,
        { chegada: 'A Mestra Bigorna arregaça as mangas: "Seis gomos de seis mundos diferentes... é o trabalho da minha vida! Deixa comigo."' }],
      ['d5', 'mestra_bigorna', 775, 'Fogo da forja', 'Forjar seis mundos juntos leva tempo: 6 horas no fogo mais quente de Pedraforte. Volte depois!',
        { espera: 6 }, R(775, 1, 160000, [['nucleo_bola', 1]]), 'TCHANG! Aqui está: o Núcleo da Bola. Lindo, né? Mas tem um buraco... falta o 7º gomo. O mapa aponta para o céu: os Picos Nublados.'],
    ] },
    { n: 7, nome: 'Capítulo 7 — O alto do mundo', passos: [
      ['c1', 'mestra_bigorna', 840, 'Acima das nuvens', 'Pelo Portal dos Gigantes você chega aos Picos Nublados. A Rainha Nimbus é quem manda lá. Vá falar com ela.',
        { fala: 'rainha_nimbus' }, R(840, 0.4, 30000), null,
        { chegada: 'A Rainha Nimbus se abaixa (bem, bem baixo) para olhar você: "O último gomo, pequenino, está guardado onde as nuvens acabam: no alto da Torre Infinita. Só quem chega lá em cima consegue ver."' }],
      ['c2', 'rainha_nimbus', 850, 'Onde as nuvens acabam', 'Chegue ao andar 75 da Torre Infinita. Lá de cima, o 7º gomo vai aparecer.',
        { flag: 'torre_75', desc: 'Vença o andar 75 da Torre Infinita' }, R(850, 2, 160000, [['gomo_ceu', 1]]), 'Você conseguiu! E olha: o gomo desceu flutuando atrás de você. Agora precisamos COSTURAR a bola.'],
      ['c3', 'rainha_nimbus', 855, 'Linha de nuvem', 'Bola de Origem só se costura com linha de nuvem. Traga 150 Algodões de Nuvem dos Campos de Nuvem e o Ferreiro Bruno fia a linha.',
        { item: 'lr_caca_mv_nuvens_1', n: 150, desc: 'Junte 150 Algodões de Nuvem (Campos de Nuvem)' }, R(855, 2, 170000, [['linha_nuvem', 1]]), 'Que linha linda! Agora leve tudo para o Ferreiro Gigante Bruno.'],
      ['c4', 'rainha_nimbus', 860, 'O costureiro gigante', 'O Ferreiro Gigante Bruno tem as mãos maiores e mais delicadas dos Picos. Leve o núcleo, o 7º gomo e a linha para ele.',
        { fala: 'ferreiro_gigante' }, R(860, 0.3, 30000), null,
        { chegada: 'O Ferreiro Bruno pega a agulha (do tamanho de um poste): "Costurar a primeira bola do universo! Ponto por ponto, sem pressa. Isso vai levar a noite inteira, pequenino."' }],
      ['c5', 'ferreiro_gigante', 865, 'Ponto por ponto', 'Costurar a Bola de Origem leva 8 horas. Vá dormir, jogar, estudar... e volte amanhã!',
        { espera: 8 }, R(865, 1.2, 200000, [['bola_dormindo', 1]]), 'Pronta! A Bola de Origem, inteira de novo... mas parece que está dormindo. Ronc... Só o Grão-Guardião Orbitto sabe como acordá-la.'],
    ] },
    { n: 8, nome: 'Capítulo final — O primeiro chute', passos: [
      ['f1', 'ferreiro_gigante', 940, 'A bola que dorme', 'Leve a Bola de Origem adormecida ao Grão-Guardião Orbitto, no Estádio do Multiverso.',
        { fala: 'guardiao_mv' }, R(940, 0.4, 40000), null,
        { chegada: 'Orbitto segura a bola com as duas mãos, emocionado: "Ela voltou... Mas a Bola de Origem só acorda com o chute de um craque que venceu o maior desafio do universo: o Guardião da Relíquia do andar 84 da Torre Infinita."' }],
      ['f2', 'guardiao_mv', 950, 'O maior desafio', 'Vença o Guardião da Relíquia do andar 84 da Torre Infinita. Quando você voltar, a bola vai saber.',
        { flag: 'guardiao_amuleto_lenda', desc: 'Vença o Guardião do andar 84 da Torre Infinita' }, R(950, 2, 250000, [['bau_torre', 3]]), 'A bola está tremendo... ela sentiu! Agora é a hora.'],
      ['f3', 'guardiao_mv', 950, 'O primeiro chute', 'Todos os mundos estão olhando. A Dra. Estela está no telescópio, a Comandante Luna, a Rubi, a Vega, a Órion, o Professor Coral, os anões e os gigantes... Chute a Bola de Origem e conte para a Dra. Estela, que começou tudo isso!',
        { fala: 'estela_estacao' }, R(950, 2, 400000, [['bola_origem', 1], ['medalha_origem', 1]]), null,
        { chegada: 'A Dra. Estela pula de alegria: "EU VI! EU VI DO TELESCÓPIO! Você chutou e a bola acordou: as estrelas piscaram todas juntas, em todos os mundos! A Bola de Origem escolheu você, craque. Ela vai te acompanhar para sempre."', final: true }],
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
    if (req.fala && !req.desc) req.desc = `Fale com ${ondeNpc(req.fala)}`;
    if (req.espera && !req.desc) req.desc = `Espere ${req.espera} h (tempo real)`;
    if (req.kill && !req.desc) req.desc = `Vença ${req.n}x ${MONSTROS[req.kill] ? MONSTROS[req.kill].nome : req.kill}`;
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
    if (r && r.espera) { const e = G.save && G.save.quests[q.id]; if (e && e.s === 'ativa' && e.ate) return agora() >= e.ate ? `${r.desc}: pronto!` : `${r.desc} — falta ${fmtFaltaH(e.ate - agora())}`; }
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
      for (const id of SG_IDS) { const e = G.save.quests[id]; const q = MISSOES.find(x => x.id === id); if (e && e.s === 'ativa' && e.ate && !e.avisou && agora() >= e.ate) { e.avisou = 1; log(`📜 "${q.titulo.replace('📜 ', '')}" está pronto! Volte a falar com ${ondeNpc(q.npc)}.`, 'l-xp'); som('nivel'); G.uiSujo = true; } }
    } catch (e) { }
  }, 20000);

  /* ---------- conversas: chegar no NPC certo, enigma e os botões da saga ---------- */
  function concluiFala(npc, q) {
    const e = G.save.quests[q.id]; e.p = 1;
    entregaMissao(q);
    const prox = MISSOES.find(x => ehSaga(x) && x.pre === q.id);
    const ops = el('div', { class: 'opcoes' });
    if (q.final) ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); sgFinal(); } }, '⭐ Ver a Bola de Origem'));
    else ops.append(el('button', { class: 'btn amarelo', onclick: () => abrirNPC(npc) }, prox && prox.npc === npc.id ? 'Continuar' : 'OK'));
    ops.append(el('button', { class: 'btn', onclick: modalSaga }, '📜 Diário da saga'));
    abreModal(el('h2', {}, npc.d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, q.chegada || 'Que bom te ver!'))), ops);
  }
  function enigma(npc, q) {
    const e = G.save.quests[q.id];
    if (e.erroAte && agora() < e.erroAte) {
      return abreModal(el('h2', {}, npc.d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, `"Pense um pouco mais na sua jornada e volte em ${fmtFaltaH(e.erroAte - agora())}."`))),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: modalSaga }, '📜 Reler o diário da saga'), el('button', { class: 'btn', onclick: fechaModal }, 'Tchau!')));
    }
    let i = 0;
    const pergunta = () => {
      const p = q.enigma[i];
      abreModal(el('h2', {}, `${npc.d.nome} — pergunta ${i + 1} de ${q.enigma.length}`), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, i === 0 ? q.chegada : 'Muito bem... e agora?'), el('p', {}, el('b', {}, p.p)))),
        el('div', { class: 'opcoes' }, ...p.ops.map((o, k) => el('button', { class: 'btn', onclick: () => {
          if (k !== p.c) { e.erroAte = agora() + 10 * 60000; salvar(); som('erro'); return abreModal(el('h2', {}, npc.d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, '"Hmm, não foi bem assim... Releia o seu diário e volte em 10 minutos."'))), el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: modalSaga }, '📜 Diário da saga'), el('button', { class: 'btn', onclick: fechaModal }, 'OK'))); }
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
          if (st === 'disponivel') b = el('button', { class: 'btn amarelo', onclick: () => modalMissao(npc, q) }, `Missão: ${q.titulo}`);
          else if (st === 'pronta' && !q.req.fala) b = el('button', { class: 'btn amarelo', onclick: () => { entregaMissao(q); abrirNPCDepois(npc, q.fim); } }, `Entregar: ${q.titulo}`);
          else if (st === 'ativa') { const [a, n] = progressoMissao(q); b = el('button', { class: 'btn', onclick: modalSaga }, `${q.titulo}: ${descMissao(q)}${q.req.espera ? '' : ` — ${a}/${n}`}`); }
          if (b) ops.prepend(b);
        }
        if (MISSOES.some(x => ehSaga(x) && x.npc === npc.id) && G.save.nivel >= 400) ops.insertBefore(el('button', { class: 'btn', onclick: modalSaga }, '📜 Diário da saga'), ops.lastChild);
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
        agoraTxt = a === 'nivel' ? `🔒 Continua no nível ${atual.lvl}.` : a === 'disponivel' ? `👉 Fale com ${ondeNpc(atual.npc)} para receber: ${atual.titulo.replace('📜 ', '')}.`
          : a === 'pronta' ? `✅ Pronto! Volte a falar com ${ondeNpc(atual.npc)}.` : `👉 ${descMissao(atual)}${atual.req.fala || atual.req.espera ? '' : ` (${progressoMissao(atual).join('/')})`}.`;
      }
      return el('details', { class: 'sg-cap', open: atual && feitos < qs.length ? 'open' : null }, el('summary', {}, `${ic} ${c.nome} (${feitos}/${qs.length})`), ...hist, agoraTxt ? el('p', { class: 'sg-agora' }, agoraTxt) : '');
    });
    const gomos = ['gomo_lua', 'gomo_marte', 'gomo_saturno', 'gomo_nebulosa', 'gomo_oceano', 'gomo_montanha', 'gomo_ceu'];
    const tem = id => contaItem(id) > 0 || (s.quests.sg_d5 && s.quests.sg_d5.s === 'feita' && gomos.indexOf(id) < 6) || (s.quests.sg_c5 && s.quests.sg_c5.s === 'feita') || !!s.flags.saga_origem; // gomos já forjados/costurados contam
    const linha = el('div', { class: 'sg-gomos' }, ...gomos.map(g => { const c = icone(g); c.className = 'sg-gomo' + (tem(g) ? '' : ' falta'); c.title = ITENS[g].nome; return c; }));
    abreModal(el('h2', {}, '📜 A Bola de Origem'), el('p', { class: 'dica' }, s.nivel < 420 ? 'Uma grande aventura pelos mundos começa no nível 420, com a Dra. Estela, na Estação Espacial Galáctica.' : 'A primeira bola do universo se partiu em 7 gomos. Reúna todos!'),
      linha, ...blocos, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Fechar')));
  }
  window.modalSaga = modalSaga;
  function sgFinal() {
    G.save.flags.saga_origem = true; salvar();
    try { const c = ADORNOS2.cfg(); c.bola_origem = true; } catch (e) { }
    try { if (typeof ADORNOS2 !== 'undefined') ADORNOS2.festa('fogos_ouro', G.p.x, G.p.y); } catch (e) { }
    banner('⭐ A Bola de Origem acordou!', 'Ela vai te acompanhar para sempre (Equipamento → ✨ Adornos).'); som('nivel');
    const ic = icone('bola_origem'); ic.style.cssText = 'width:140px;height:140px;display:block;margin:6px auto';
    abreModal(el('h2', {}, '⭐ A Bola de Origem'), ic, el('p', {}, 'Você reconstruiu a primeira bola do universo! Ela agora gira em volta de você, com os 7 gomos brilhando. Ligue e desligue em Equipamento → ✨ Adornos.'),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: fechaModal }, 'Que demais!')));
  }

  /* ---------- prêmio final: o adorno que gira em volta do jogador ---------- */
  try {
    if (typeof ADORNOS2 !== 'undefined' && ADORNOS2.OPCOES && ADORNOS2.OPCOES.extra && !ADORNOS2.OPCOES.extra.some(o => o[0] === 'bola_origem'))
      ADORNOS2.OPCOES.extra.push(['bola_origem', 'Bola de Origem', '🌟', { ok: () => !!(G.save && G.save.flags && G.save.flags.saga_origem), txt: '🔒 Saga: A Bola de Origem' }, 'A primeira bola do universo gira em volta de você, com os 7 gomos brilhando.']);
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
    const b = el('button', { class: 'btn', id: 'btnSaga', type: 'button', role: 'menuitem' }, '📜 A Bola de Origem'); b.onclick = modalSaga;
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
