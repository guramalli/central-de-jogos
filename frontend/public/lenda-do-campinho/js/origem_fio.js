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
    { id: 'of_vila1', reg: 'br', passou: 50, npc: 'mae', lvl: 5, pre: 'q_penaltis', titulo: '✨ A marca na bola',
      texto: 'Filho(a), olha a sua bola de capotão! De noite, sete pontinhos brilham no couro, como estrelas. Mostre para o Seu Zé, no campinho: ele conhece essa bola há muito tempo.',
      mais: 'A bola estava guardada no baú do quintal desde antes de você nascer. Ninguém nunca tinha visto ela brilhar assim.',
      req: { fala: 'ze', desc: 'Mostre a bola ao Seu Zé (no campinho)' }, rec: R(5, 0.6, 30),
      chegada: 'O Seu Zé fica sério: "Quando eu era moleque, uma estrela caiu atrás do campinho. No outro dia, esta bola estava no mato, com esses sete pontinhos. Guarde bem ela!"',
      chegadaMais: 'O meu avô contava uma lenda: a primeira bola do universo se partiu em sete pedaços, espalhados pelos mundos. Um dia, um craque de verdade vai juntar todos eles. Será você?' },
    // 🌍 Mundo e Europa
    { id: 'of_cairo', reg: 'mundo', passou: 124, npc: 'lider_cairo', lvl: 54, titulo: '✨ O desenho da tumba',
      texto: 'A Doutora Nadia achou um desenho estranho na Tumba da Esfinge: uma bola com sete pontinhos, igual à sua! Vá falar com ela lá dentro.',
      req: { fala: 'guia_caca_tumba', desc: 'Fale com a Doutora Nadia (Tumba da Esfinge, no Cairo)' }, rec: R(54, 0.5, 3000),
      chegada: 'A Doutora Nadia mostra a parede: "Olhe! Um jogador chuta uma bola, a bola sobe, vira estrelas... e se parte em sete pedaços. Este desenho tem mais de 4.000 anos!"',
      chegadaMais: 'Os antigos egípcios também conheciam a lenda. Se a sua bola tem os mesmos sete pontinhos, ela deve ser um mapa. Mas um mapa de quê?' },
    { id: 'of_lisboa', reg: 'mundo', passou: 196, npc: 'lider_lisboa', lvl: 128, titulo: '✨ O mapa do navegador',
      texto: 'A Capitã Leonor guarda um mapa dos antigos navegadores com sete estrelas desenhadas. Ela está no Porão da Caravela. Vá ver!',
      req: { fala: 'guia_caca_caravela', desc: 'Fale com a Capitã Leonor (Porão da Caravela, em Lisboa)' }, rec: R(128, 0.5, 5000),
      chegada: 'A Capitã Leonor abre o mapa: "Sete estrelas e um bilhete do navegador: \'Uma delas caiu no fundo do mar, onde dorme uma cidade perdida.\' Já ouviu falar de Atlântida?"',
      chegadaMais: 'Há 500 anos, os navegadores portugueses anotavam tudo o que viam no céu e no mar. Este mapa passou de capitão para capitão até chegar em mim.' },
    // 🌊 Atlântida — missões de HISTÓRIA (linha principal entre atl_m1 e atl_m4)
    { id: 'atl_h1', reg: 'atl', passou: 298, npc: 'lider_atl', lvl: 206, pre: 'atl_m1', titulo: '🌊 A estátua da praça',
      texto: 'A estátua de Netuno, aqui na praça, segura uma bola de pedra com sete gomos. O Professor Coral estuda essa estátua há anos. Vá conversar com ele!',
      req: { fala: 'prof_coral', desc: 'Fale com o Professor Coral (praça de Atlântida)' }, rec: R(206, 0.6, 160000, [['elixir_mar', 5]]),
      chegada: 'O Professor Coral ajeita os óculos: "Sete gomos, e um deles é de pérola! Os atlantes contam que, há mil anos, uma estrela caiu no mar e a cidade brilhou a noite inteira."',
      chegadaMais: 'Ninguém sabe para onde foi aquele brilho. Mas os bichos dos portais guardam histórias muito antigas. Talvez algum deles saiba mais...' },
    { id: 'atl_h2', reg: 'atl', passou: 298, npc: 'prof_coral', lvl: 238, pre: 'atl_h1', titulo: '🌊 Os desenhos da pirâmide',
      texto: 'O Professor Tutan achou desenhos na Pirâmide Perdida, iguais aos da tumba do Cairo! Antes de mostrar, ele quer ver se você conhece a lenda. Vá falar com ele.',
      req: { fala: 'guia_caca_piramide', desc: 'Fale com o Professor Tutan (Pirâmide Perdida, em Atlântida)' }, rec: R(238, 0.8, 190000, [['bolinho_algas', 5]]),
      chegada: 'O Professor Tutan sorri: "Antes de mostrar os desenhos, quero ver se você prestou atenção nas pistas."',
      depois: 'Muito bem! Olhe aqui na parede: um chute, uma bola que vira estrelas, sete pedaços... e um deles caindo no mar. O gomo de pérola existe mesmo!',
      enigma: [
        { p: 'Quantos pontinhos brilham na sua bola de capotão?', ops: ['3', '7', '11'], c: 1 },
        { p: 'Quem contou a lenda da primeira bola, lá na Vila?', ops: ['O Seu Zé', 'A Rainha Marina', 'O Professor Coral'], c: 0 },
        { p: 'O que a estátua de Netuno segura?', ops: ['Um peixe dourado', 'Uma bola com sete gomos', 'Uma concha gigante'], c: 1 },
      ] },
    { id: 'atl_h3', reg: 'atl', passou: 298, npc: 'prof_coral', lvl: 262, pre: 'atl_h2', titulo: '🌊 Bolhas que brilham',
      texto: 'A Sereia Nina viu bolhas brilhantes no Recife do Polvo. Será o gomo de pérola? Vá falar com ela no Recife.',
      req: { fala: 'guia_caca_recife', desc: 'Fale com a Sereia Nina (Recife do Polvo, em Atlântida)' }, rec: R(262, 0.6, 210000),
      chegada: 'A Sereia Nina ri: "As bolhas são da Vovó Tuga, a tartaruga mais velha do mar! Ela solta luzinhas desde que engoliu uma \'água-viva\' brilhante..."',
      chegadaMais: 'A Vovó Tuga tem 900 anos e dorme quase o dia inteiro. Ela está bem, só um pouquinho confusa. Acordar ela agora não é uma boa ideia.' },
    { id: 'atl_h4', reg: 'atl', passou: 298, npc: 'guia_caca_recife', lvl: 280, pre: 'atl_h3', titulo: '🌊 O mapa das correntes',
      texto: 'Vou desenhar onde a Vovó Tuga dorme, para você nunca esquecer. Traga 8 Tintas de Polvo: os Polvos Malabaristas aqui do Recife deixam cair.',
      req: { item: 'tinta_polvo', n: 8, desc: 'Junte 8 Tintas de Polvo (Recife do Polvo)' }, rec: R(280, 1, 260000, [['elixir_mar', 10]]),
      fim: 'Pronto, o mapa do recife! Guarde este segredo: quando você for uma lenda do universo, volte e fale com o Professor Coral. A Vovó Tuga vai esperar.' },
    // 🚀 Espaço — 2 missões de HISTÓRIA por planeta (linha principal entre esp_m1 e esp_m6)
    { id: 'esp_h1', reg: 'esp', passou: 400, npc: 'lider_esp', lvl: 303, pre: 'esp_m1', titulo: '🚀 A toca do Coelhinho',
      texto: 'A Comandante Luna, na Lua, quer conhecer você. Dizem que os Coelhinhos Lunares escondem uma coisa que brilha. Vá falar com ela!',
      req: { fala: 'lider_lua', desc: 'Fale com a Comandante Luna (Lua)' }, rec: R(303, 0.6, 450000),
      chegada: 'A Comandante Luna cochicha: "O Coelhinho mais velho guarda uma pedra azul que brilha, lá na toca dele. Brilha igualzinho aos pontinhos da sua bola!"' },
    { id: 'esp_h2', reg: 'esp', passou: 400, npc: 'lider_lua', lvl: 316, pre: 'esp_h1', titulo: '🚀 O telescópio de bolso',
      texto: 'Quero olhar o céu com calma. Traga 8 Amostras de Rocha Lunar (os Rochedos Lunares deixam cair) e eu monto um telescópio de bolso.',
      req: { item: 'amostra_lunar', n: 8, desc: 'Junte 8 Amostras de Rocha Lunar (caçadas da Lua)' }, rec: R(316, 1, 550000, [['soro_estelar', 5]]),
      fim: 'Olhe pelo telescópio: sete brilhos espalhados pelo céu, cada um num mundo diferente. E um deles está aqui na Lua!' },
    { id: 'esp_h3', reg: 'esp', passou: 400, npc: 'lider_esp', lvl: 330, pre: 'esp_h2', titulo: '🚀 A medalha do General',
      texto: 'A Engenheira Rubi, em Marte, mandou um recado: "Tenho uma pista para o craque!" Vá até Marte falar com ela.',
      req: { fala: 'lider_marte', desc: 'Fale com a Engenheira Rubi (Marte)' }, rec: R(330, 0.6, 500000),
      chegada: 'A Engenheira Rubi ri: "O General Marciano usa no peito uma pedra vermelha e quentinha. Ele jura que ela caiu do céu e que é o amuleto da sorte dele!"' },
    { id: 'esp_h4', reg: 'esp', passou: 400, npc: 'lider_marte', lvl: 344, pre: 'esp_h3', titulo: '🚀 O rádio do rover',
      texto: 'Um rover velhinho gravou um sinal misterioso, mas o rádio dele quebrou. Traga 6 Engrenagens de Robô (os Robôs Mineradores deixam cair) e eu conserto.',
      req: { item: 'engrenagem', n: 6, desc: 'Junte 6 Engrenagens de Robô (caçadas de Marte)' }, rec: R(344, 1, 600000, [['cristal_foco', 5]]),
      fim: 'Pronto, escute: pi... pi... pi... SETE piscadas, e depois silêncio. Esse sinal vem de muito, muito longe!' },
    { id: 'esp_h5', reg: 'esp', passou: 400, npc: 'lider_esp', lvl: 356, pre: 'esp_h4', titulo: '🚀 O brilho no gelo',
      texto: 'A Astrônoma Vega viu um brilho estranho dentro dos anéis de Saturno. Vá até Saturno e fale com ela.',
      req: { fala: 'lider_saturno', desc: 'Fale com a Astrônoma Vega (Saturno)' }, rec: R(356, 0.6, 550000),
      chegada: 'A Astrônoma Vega aponta o telescópio: "Está vendo? Dentro do anel, um brilho preso num bloco de gelo. Nada aqui é quente o bastante para derreter aquele gelo..."' },
    { id: 'esp_h6', reg: 'esp', passou: 400, npc: 'lider_saturno', lvl: 368, pre: 'esp_h5', titulo: '🚀 Recado para a Dra. Estela',
      texto: 'Anotei tudo sobre os sete brilhos. Leve estas anotações para a Dra. Estela, na Estação Espacial. Ela vai saber o que fazer!',
      req: { fala: 'estela_estacao', desc: 'Fale com a Dra. Estela (Estação Espacial)' }, rec: R(368, 0.6, 600000),
      chegada: 'A Dra. Estela lê tudo de olhos arregalados: "Sete brilhos... e o sinal do rover pisca sete vezes! Vou montar um radar para seguir esse sinal. Quando eu achar, chamo você!"' },
    { id: 'esp_h7', reg: 'esp', passou: 400, npc: 'lider_esp', lvl: 381, pre: 'esp_h6', titulo: '🚀 A memória das estrelas',
      texto: 'A Guardiã Órion, na Nebulosa, lembra de tudo o que já aconteceu no universo. Ela quer ouvir as suas pistas. Vá falar com ela!',
      req: { fala: 'lider_nebulosa', desc: 'Fale com a Guardiã Órion (Nebulosa de Órion)' }, rec: R(381, 0.8, 600000),
      chegada: 'A Guardiã Órion fecha os olhos: "Conte-me o que você já descobriu, pequena estrela."',
      depois: 'A Guardiã Órion sorri: "Os sete brilhos são os gomos da primeira bola do universo. Ainda não é a hora de juntá-los... mas essa hora está chegando."',
      enigma: [
        { p: 'O que o Coelhinho mais velho guarda na toca?', ops: ['Uma pedra azul que brilha', 'Uma cenoura de ouro', 'Um foguete de brinquedo'], c: 0 },
        { p: 'O que o General Marciano usa no peito?', ops: ['Um apito', 'Uma pedra vermelha e quentinha', 'Uma estrela de lata'], c: 1 },
        { p: 'Quantas vezes pisca o sinal do rover?', ops: ['2', '7', '100'], c: 1 },
      ] },
    { id: 'esp_h8', reg: 'esp', passou: 400, npc: 'lider_nebulosa', lvl: 392, pre: 'esp_h7', titulo: '🚀 O caminho no céu',
      texto: 'Com Poeira de Estrela eu desenho no céu o caminho dos sete brilhos. Traga 10 Poeiras de Estrela das caçadas da Nebulosa.',
      req: { item: 'poeira_estelar', n: 10, desc: 'Junte 10 Poeiras de Estrela (caçadas da Nebulosa)' }, rec: R(392, 1, 700000, [['soro_estelar', 10]]),
      fim: 'Veja: o caminho sai deste universo! Vença a Copa Intergaláctica. Depois dela, um portal vai se abrir... e a Dra. Estela terá novidades.' },
    // 🌀 Multiverso — levam direto para a saga (Dra. Estela, nível 420)
    { id: 'of_mv1', reg: 'mv', passou: 420, npc: 'guardiao_mv', lvl: 403, titulo: '🌀 A joia que brilha',
      texto: 'Quando você chegou ao Multiverso, a joia da coroa do Rei Barbaferro começou a brilhar sozinha! Vá até Pedraforte e fale com o rei.',
      req: { fala: 'rei_barbaferro', desc: 'Fale com o Rei Barbaferro (Reino de Pedraforte)' }, rec: R(403, 0.4, 1000000),
      chegada: 'O Rei Barbaferro tira a coroa: "Mil anos, e esta joia nunca brilhou assim! As runas dizem: \'quando o craque das sete estrelas chegar, a pedra vai acordar\'."' },
    { id: 'of_mv2', reg: 'mv', passou: 420, npc: 'rei_barbaferro', lvl: 412, pre: 'of_mv1', titulo: '🌀 O sinal da Dra. Estela',
      texto: 'Sete estrelas... A Dra. Estela, da Estação Espacial, vive estudando sinais do céu. Conte para ela o que aconteceu com a minha joia!',
      req: { fala: 'estela_estacao', desc: 'Fale com a Dra. Estela (Estação Espacial)' }, rec: R(412, 0.4, 1200000),
      chegada: 'A Dra. Estela pula da cadeira: "A joia brilhou? Então o meu radar está certo! Ele achou um sinal dentro de um satélite velhinho. Volte no nível 420: vamos descobrir juntos!"' },
  ];
  const OFI_IDS = new Set(OFI.map(q => q.id));
  for (const q of OFI) { q.principal = true; q.fio = true; MISSOES.push(q); }
  const ofiQ = id => MISSOES.find(q => q.id === id);
  const ehFio = q => !!(q && OFI_IDS.has(q.id));
  window.OFI_MISSOES = OFI;

  /* ---------- quem já passou da região: a pista vira lembrança (vai para o diário, sem prêmio) ---------- */
  function ofiLembra(s) {
    if (!s || !s.quests) return;
    const sagaComecou = !!s.quests.sg_p1;
    for (const q of OFI) {
      const e = s.quests[q.id]; if (e && e.s === 'feita') continue;
      if ((s.nivel || 1) >= q.passou || (q.reg === 'mv' && sagaComecou)) s.quests[q.id] = { s: 'feita', lembranca: 1 };
    }
  }
  { const _ijOfi = iniciarJogo; iniciarJogo = function (save) { try { ofiLembra(save); } catch (e) { console.warn('fio da origem', e); } return _ijOfi.apply(this, arguments); }; }

  /* ---------- conversas: chegar em quem a missão manda, enigma, botões ---------- */
  const agora = () => Date.now();
  const fmtMin = ms => { const m = Math.max(1, Math.ceil(ms / 60000)); return `${m} min`; };
  const diarioBtn = () => el('button', { class: 'btn', onclick: () => { if (typeof window.modalSaga === 'function') window.modalSaga(); } }, '📜 Diário da Bola de Origem');
  const falaBox = (npc, ...ps) => el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, ...ps));
  function ofiConclui(npc, q) {
    const e = G.save.quests[q.id]; e.p = 1;
    entregaMissao(q);
    const prox = MISSOES.find(x => ehFio(x) && x.pre === q.id);
    const txt = q.enigma ? (q.depois || q.chegada) : q.chegada;
    const ps = [el('p', {}, txt)];
    if (q.chegadaMais && !q.enigma) ps.push(el('details', { class: 'mrx-mais' }, el('summary', {}, '📖 Saiba mais'), el('p', {}, q.chegadaMais)));
    const ops = el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => abrirNPC(npc) }, prox && prox.npc === npc.id ? 'Continuar' : 'OK'), diarioBtn());
    abreModal(el('h2', {}, npc.d.nome), falaBox(npc, ...ps), ops);
  }
  function ofiEnigma(npc, q) {
    const e = G.save.quests[q.id];
    if (e.erroAte && agora() < e.erroAte)
      return abreModal(el('h2', {}, npc.d.nome), falaBox(npc, el('p', {}, `"Pense um pouco na sua jornada e volte em ${fmtMin(e.erroAte - agora())}. As pistas estão no seu diário."`)),
        el('div', { class: 'opcoes' }, diarioBtn(), el('button', { class: 'btn', onclick: fechaModal }, 'Tchau!')));
    let i = 0;
    const pergunta = () => {
      const p = q.enigma[i];
      abreModal(el('h2', {}, `${npc.d.nome} — pergunta ${i + 1} de ${q.enigma.length}`), falaBox(npc, el('p', {}, i === 0 ? q.chegada : 'Muito bem... e agora?'), el('p', {}, el('b', {}, p.p))),
        el('div', { class: 'opcoes' }, ...p.ops.map((o, k) => el('button', { class: 'btn', onclick: () => {
          if (k !== p.c) {
            e.erroAte = agora() + 3 * 60000; salvar(); som('erro');
            return abreModal(el('h2', {}, npc.d.nome), falaBox(npc, el('p', {}, '"Hmm, não foi bem assim... Releia as pistas no seu diário e volte daqui a 3 minutos."')), el('div', { class: 'opcoes' }, diarioBtn(), el('button', { class: 'btn', onclick: fechaModal }, 'OK')));
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
    } catch (e) { console.warn('fio da origem', e); }
    const r = _abrirOfi.apply(this, arguments);
    // o personagem pode ter outra missão na frente (ou uma janela própria, como a do Orbitto): a do fio ganha um botão
    try {
      const box = document.getElementById('modalConteudo'), ops = box && box.querySelector('.opcoes');
      if (ops && G.save && npc) {
        const q = MISSOES.find(x => ehFio(x) && x.npc === npc.id && ['disponivel', 'pronta', 'ativa'].includes(statusMissao(x)));
        if (q && !box.textContent.includes(q.titulo)) {
          const st = statusMissao(q); let b = null;
          if (st === 'disponivel') b = el('button', { class: 'btn amarelo', onclick: () => modalMissao(npc, q) }, `Missão: ${q.titulo}`);
          else if (st === 'pronta' && !q.req.fala) b = el('button', { class: 'btn amarelo', onclick: () => { entregaMissao(q); abrirNPCDepois(npc, q.fim); } }, `Entregar: ${q.titulo}`);
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
  const REG = [['br', '🏡 Brasil'], ['mundo', '🌍 Mundo e Europa'], ['atl', '🌊 Atlântida'], ['esp', '🚀 Espaço'], ['mv', '🌀 Multiverso']];
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
        ag = st === 'nivel' || st === 'bloqueada' ? `🔒 Próxima pista a partir do nível ${atual.lvl}${quem ? ` (${quem})` : ''}.`
          : st === 'disponivel' ? `👉 Fale com ${nm}${quem ? ` (${quem})` : ''}: ${atual.titulo.replace(/^\S+ /, '')}.`
          : st === 'pronta' ? `✅ Pronto! Volte a falar com ${nm}.` : `👉 ${descMissao(atual)}${atual.req.fala ? '' : ` (${progressoMissao(atual).join('/')})`}.`;
      }
      const ic = nFeitas === qs.length ? '✅' : nFeitas || (atual && statusMissao(atual) !== 'nivel' && statusMissao(atual) !== 'bloqueada') ? '🔎' : '🔒';
      return el('details', { class: 'sg-cap', open: atual && ['disponivel', 'ativa', 'pronta'].includes(statusMissao(atual)) ? 'open' : null },
        el('summary', {}, `${ic} ${nome} (${nFeitas}/${qs.length})`), ...linhas, ag ? el('p', { class: 'sg-agora' }, ag) : '');
    });
    return el('div', { class: 'ofi-pistas' }, el('h3', { class: 'ofi-tit' }, `🔎 As pistas (${feitas}/${OFI.length})`),
      el('p', { class: 'dica' }, 'Antes da grande aventura, o mistério da sua bola de capotão: pistas pelo mundo, que levam até a Dra. Estela no nível 420.'), ...det,
      el('h3', { class: 'ofi-tit' }, '📜 A saga (nível 420 em diante)'));
  }
  {
    const _amOfi = abreModal;
    abreModal = function () {
      const r = _amOfi.apply(this, arguments);
      try {
        const box = document.getElementById('modalConteudo'), h = box && box.querySelector('h2');
        if (h && h.textContent === '📜 A Bola de Origem' && !box.querySelector('.ofi-pistas')) {
          const b = blocoPistas(), dica = box.querySelector('p.dica');
          if (b) { if (dica) dica.after(b); else h.after(b); }
        }
      } catch (e) { console.warn('diário das pistas', e); }
      return r;
    };
  }

  /* ---------- capítulos curtos (arte que já existe) ---------- */
  if (typeof CAPITULOS !== 'undefined') {
    const hn = n => (typeof _hn === 'function' ? _hn(n) : (n || 'você'));
    const feita = (s, id) => !!(s.quests && s.quests[id] && s.quests[id].s === 'feita');
    CAPITULOS.origem = {
      rotulo: 'Um mistério', titulo: 'O começo do mistério', emoji: '✨',
      cond: s => feita(s, 'of_vila1'),
      cenas: [
        { img: 'historia_4', kb: 'kb-a', cor: ['#f0c060', '#5ab85a'], txt: n => 'Lembra da sua bola de capotão, a do baú do quintal? Uma noite, a Mãe viu uma coisa estranha: sete pontinhos brilhando no couro, como estrelas.' },
        { img: 'historia_2', kb: 'kb-b', cor: ['#c89a5a', '#6a4a2a'], txt: n => 'O Seu Zé contou que, quando era moleque, viu uma estrela cair atrás do campinho. No outro dia, aquela bola estava no meio do mato.' },
        { img: 'cap_gloria_4', kb: 'kb-d', cor: ['#140a40', '#3a2780'], txt: n => 'O avô dele dizia: a primeira bola do universo se partiu em sete pedaços, espalhados pelos mundos. E um dia, um craque vai juntar todos eles.' },
        { img: 'cap_gloria_4', kb: 'kb-zoom', foco: '60% 22%', cor: ['#140a40', '#3a2780'], txt: n => `Os sete pontinhos parecem um mapa. Para onde será que ele leva? Fique de olho, ${hn(n)}: em cada lugar novo pode ter uma pista!` },
      ],
      final: { emoji: '✨', titulo: 'O começo do mistério', sub: n => 'As pistas ficam guardadas no 📜 Diário da Bola de Origem (☰ Menu).', botao: 'Continuar ⚽' },
    };
    CAPITULOS.jurassico = {
      rotulo: 'Capítulo 12', titulo: 'O Vale Jurássico', emoji: '🦖', implica: ['multiverso'],
      cond: (s, mapa) => /^jur_/.test(mapa || ''),
      cenas: [
        { img: 'cap_mv_1', kb: 'kb-a', cor: ['#140a40', '#ffb04a'], txt: n => 'No Estádio do Multiverso, um portal coberto de folhas e pegadas gigantes começou a tremer. Lá de dentro vinha um rugido... e o barulho de uma bola quicando!' },
        { img: 'mv_portal_jur', kb: 'kb-zoom', cor: ['#3a8a4a', '#0a3a2a'], txt: n => 'Do outro lado, o Vale Jurássico: vulcão, cachoeiras e dinossauros de todos os tamanhos. E todos jogando bola!' },
        { img: 'mv_portal_jur', kb: 'kb-a', foco: '50% 62%', cor: ['#3a8a4a', '#0a3a2a'], txt: n => 'A Dra. Fóssil, a paleontóloga, montou um acampamento no vale. Ela precisa de ajuda: o Rei Rex não gosta de futebol e quer mandar os humanos embora.' },
        { img: 'cap_gloria_4', kb: 'kb-zoom', foco: '60% 22%', cor: ['#140a40', '#3a2780'], txt: n => 'E numa pedra bem antiga, a Dra. Fóssil achou uma pegada... ao lado do desenho de uma bola com sete gomos. Até os dinossauros viram a primeira bola cair do céu?' },
      ],
      final: { emoji: '🦖', titulo: 'O Vale Jurássico', sub: n => 'Capítulo 12 começou! Ajude a Dra. Fóssil a estudar os dinossauros (níveis 566 a 700) e mostre ao Rei Rex que futebol é alegria.', botao: 'Explorar! 🦖' },
    };
    CAPITULOS.origem_fim = {
      rotulo: 'Capítulo final', titulo: 'A Bola de Origem', emoji: '⭐', implica: ['multiverso'],
      cond: s => !!(s.flags && s.flags.saga_origem),
      cenas: [
        { img: 'cap_mv_1', kb: 'kb-zoom', foco: '22% 70%', cor: ['#140a40', '#ffb04a'], txt: n => 'No Estádio do Multiverso, todos os mundos ficaram em silêncio. A Bola de Origem, inteira de novo, estava nas suas mãos.' },
        { img: 'cap_esp_3', kb: 'kb-b', cor: ['#0a0a1e', '#ffcf3a'], som: 'gol', txt: n => 'Você respirou fundo e deu o primeiro chute. A bola subiu, girou... e as estrelas piscaram todas juntas, em todos os mundos!' },
        { img: 'cap_gloria_4', kb: 'kb-d', cor: ['#140a40', '#3a2780'], txt: n => 'Lá na Vila do Campinho, o Seu Zé viu uma estrela passar no céu e sorriu: "A lenda do meu avô era verdade."' },
        { img: 'historia_4', kb: 'kb-a', cor: ['#f0c060', '#5ab85a'], txt: n => `E a velha bola de capotão do baú? Os sete pontinhos se apagaram, um por um. O mapa tinha levado ${hn(n)} até o fim.` },
      ],
      final: { emoji: '⭐', titulo: 'A Bola de Origem', sub: n => `Fim da saga${n ? ', ' + n : ''}! A primeira bola do universo agora gira em volta de você. Toda lenda começa num campinho.`, botao: 'A lenda continua... ⚽' },
    };
    const ord = CAPITULOS_ORDEM;
    if (!ord.includes('origem')) ord.splice(Math.max(1, ord.indexOf('intro') + 1), 0, 'origem');
    for (const [id, depois] of [['jurassico', 'multiverso'], ['origem_fim', 'jurassico']]) {
      if (ord.includes(id)) continue; const i = ord.indexOf(depois), ig = ord.indexOf('gloria');
      ord.splice(i >= 0 ? i + 1 : (ig >= 0 ? ig : ord.length), 0, id);
    }
    // o fim da Galáxia dizia "novos mundos nas próximas atualizações": o Multiverso já existe e a Dra. Estela tem um sinal
    if (CAPITULOS.galaxia && CAPITULOS.galaxia.final) CAPITULOS.galaxia.final.sub = n => `Parabéns${n ? ', ' + n : ''}! Você venceu a Copa Intergaláctica. No Rio, o Guardião do Multiverso abre um portal novo... e a Dra. Estela tem um sinal misterioso para te mostrar.`;
  }

  const css = document.createElement('style');
  css.textContent = `
  .ofi-pistas { margin: 4px 0 8px; }
  .ofi-tit { margin: 10px 0 2px; font-size: 16px; }
  .hist .hist-cena .h-img[src*="mv_portal_jur"] { object-fit: contain; }
  .hist .hist-cena:has(.h-img[src*="mv_portal_jur"]) { background: radial-gradient(circle at 50% 45%, #7ad08a, #1a5a3a 70%, #0a2a1a); }`;
  document.head.append(css);
  window.OFI = { OFI, ofiLembra, blocoPistas, ehFio };
}
