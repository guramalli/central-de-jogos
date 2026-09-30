/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏡 A VILA NOVA (v280): a primeira impressão do jogo.
   A Vila do Campinho agora é uma vila do interior do Brasil de verdade:
   - a PRAÇA DA MATRIZ no meio, com coreto, bandeirinhas, pipoqueiro e os pombos;
   - a rua de cima com a sua casa, o bazar, a bicicletaria do Seu Pedal, a escola, a barbearia e a sorveteria;
   - a avenida com a padaria, a quitanda e a AGÊNCIA DE TURISMO (cartões-postais das cidades do mundo);
   - do outro lado da avenida, o MURAL DO MUNDO pintado no muro ("um dia você vai jogar em todos esses lugares!");
   - o campinho com arquibancada de madeira; a rua das casas à venda com horta, galinhas e varal;
   - o RIO a leste, com ponte, trapiche e barquinho, e a mata do Caramelo do outro lado;
   - a mata do oeste com a trilha do Bosque e o Vale das Pedras Celestiais;
   - de vez em quando passa um AVIÃOZINHO no céu (as cidades estão esperando!).
   Mapa desenhado já no tamanho final (90×64 quadros — o "espalha" não mexe).
   Tudo o que o tutorial usa continua aqui (casa, baú da bola, Seu Zé, pênalti, Tonhão, ônibus, quadro...).
   Carregar DEPOIS de cidades_novas.js.
   ============================================================ */
const VILA_W = 90, VILA_H = 64;
// arte nova (Higgsfield): prédios (largura em quadros no mapa) e objetos (largura do desenho; todos bloqueiam)
const VILA_PREDIOS = ['b_padaria_vila', 'b_quitanda', 'b_sorveteria', 'b_barbearia', 'b_casa_azul', 'b_casa_amarela', 'b_agencia', 'b_bicicletaria'];
for (const n of VILA_PREDIOS) { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } if (!PORTAS[n]) PORTAS[n] = { x: 0.5, y: 0.93 }; }
const VILA_OBJ = { coreto: 3.4, pipoqueiro: 1.25, arquibancada_mad: 2.3, barquinho: 1.9, bandeirinhas: 2.7, galinha: 1.1, horta: 1.6, varal: 2.3, poco: 1.3,
  mangueira_balanco: 2.3, banca_coco: 1.8, mural_mundo: 7.2 };
for (const [n, w] of Object.entries(VILA_OBJ)) { OBJ_INFO[n] = { w, b: 1 }; OBJ_BLOQUEIA.add(n); if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } }
if (typeof OBJ_MINI !== 'undefined') { OBJ_MINI.mangueira_balanco = '#3f8a3a'; OBJ_MINI.coreto = '#e8e0d0'; OBJ_MINI.mural_mundo = '#e0a050'; }
if (!ASSET_SET.has('aviao')) { ASSETS.push('aviao'); ASSET_SET.add('aviao'); }

mapaVila = function () {
  const W = VILA_W, H = VILA_H;
  const b = new Construtor('vila', 'Vila do Campinho', W, H, CH.GRAMA, 101);
  const m = b.m; m.lotes = {};
  const T_ = CH.TERRA, P = CH.PEDRA, ag = CH.AGUA, MAD = CH.MADEIRA;
  const poe = (x, y, t) => { if (b.livre(x, y)) { b.obj(x, y, t); return true; } return false; };
  const largo = (x, y, t, l) => { if (b.livre(x, y)) objLargo(b, x, y, t, l); };
  for (let i = 0; i < 320; i++) b.chao((b.r() * W) | 0, (b.r() * H) | 0, CH.GRAMA_FLOR);
  b.borda('arvore', 2, 'mangueira');

  /* --- o RIO (leste), de norte a sul, com duas pontes --- */
  b.ret(68, 0, 4, H, ag); b.limpa(68, 0, 4, H);
  /* --- ruas de terra --- */
  b.ret(2, 28, W - 2, 2, T_); b.ret(2, 27, 66, 1, P);                 // a AVENIDA (com calçada de pedra do lado de cima)
  b.ret(66, 27, 7, 3, MAD); b.limpa(66, 27, 7, 3);                     // a ponte da avenida
  b.ret(4, 13, 64, 2, T_);                                             // a rua de cima
  b.ret(22, 13, 2, 47, T_);                                            // a rua do oeste (norte–sul)
  b.ret(44, 13, 2, 15, T_);                                            // a rua do meio (praça → escola)
  b.ret(22, 58, 46, 2, T_);                                            // a rua de baixo (as casas à venda)
  b.ret(66, 58, 7, 2, MAD); b.limpa(66, 58, 7, 2); b.ret(73, 58, 6, 2, T_); // a pontezinha do sul
  b.ret(W - 2, 27, 2, 3, T_); b.limpa(W - 2, 27, 2, 3);                // a estrada da praia

  /* --- A RUA DE CIMA (portas para a rua) --- */
  // a SUA casa, com o quintal e o baú da bola
  b.predio('b_casa', 6, 9, 5, 3, 'casa', 8);
  b.obj(14, 10, 'bau'); b.ponto(14, 10, 'bau_bola');
  poe(15, 9, 'vaso'); poe(13, 8, 'arbusto'); poe(17, 7, 'mangueira');
  largo(4, 6, 'varal', 3); poe(14, 6, 'galinha'); poe(18, 11, 'horta');
  for (let x = 12; x <= 19; x++) if (x !== 14 && x !== 15) poe(x, 5, 'arbusto');
  // o bazar e a oficina do Remendo; a bicicletaria do Seu Pedal
  b.predio('b_bazar', 26, 9, 5, 3, 'bazar', 28);
  b.placa(31, 12, 'BAZAR DA CIDA — compra e venda de tudo');
  b.npc('remendo', 33, 12); poe(34, 11, 'mesa'); poe(35, 11, 'cones');
  b.predio('b_bicicletaria', 37, 9, 5, 3); poe(42, 11, 'bicicleta');
  b.npc('pedal', 39, 12);
  // a escola
  b.predio('b_escola', 48, 8, 7, 4, 'escola', 51);
  b.placa(55, 12, 'ESCOLA MUNICIPAL — aulas com a Professora Lúcia');
  // barbearia e sorveteria
  b.predio('b_barbearia', 57, 9, 4, 3); b.predio('b_sorveteria', 62, 9, 4, 3);
  poe(66, 12, 'mesa_cafe');
  for (const x of [5, 21, 25, 46, 60]) poe(x, 15, 'poste');

  /* --- PRAÇA DA MATRIZ (centro) --- */
  b.ret(25, 16, 18, 11, P);
  largo(33, 21, 'coreto', 3); for (let x = 32; x <= 34; x++) b.obj(x, 20, 'x');
  for (const [x, y] of [[25, 16], [42, 16], [25, 26], [42, 26]]) poe(x, y, 'poste');
  largo(28, 17, 'bandeirinhas', 3); largo(39, 17, 'bandeirinhas', 3);
  for (const [x, y] of [[27, 20], [39, 20]]) poe(x, y, 'banco');
  for (const [x, y] of [[26, 23], [41, 23]]) poe(x, y, 'mangueira');
  poe(36, 24, 'carrinho_flores'); poe(30, 24, 'pipoqueiro');
  poe(34, 17, 'canteiro'); poe(32, 17, 'canteiro');
  b.obj(28, 25, 'banca'); b.npc('juca', 29, 25);
  b.npc('zuzu', 38, 25); poe(39, 24, 'guarda_sol');
  b.npc('quadro', 34, 25);
  if (typeof NPC_COPA !== 'undefined') { b.npc('almanaque', 40, 19); b.placa(41, 19, 'COPA DOS SONHOS: monte um time dos sonhos e busque o 7 a 0!'); }
  b.spawn('pombo', 33, 19, 8, 4);
  b.placa(26, 18, '⛲ PRAÇA DA MATRIZ — o coração da Vila do Campinho. No domingo tem banda no coreto!');
  (m.zonas = m.zonas || []).push({ x: 25, y: 16, w: 18, h: 11, nome: 'Praça da Matriz' });

  /* --- O OESTE: o centro de treino (lote) e a mata --- */
  m.lotes.ct = { x: 4, y: 18 };
  poe(8, 25, 'mangueira'); poe(15, 25, 'arvore');

  /* --- A AVENIDA (lado de cima): padaria, quitanda e a AGÊNCIA DE TURISMO --- */
  b.predio('b_padaria_vila', 47, 23, 5, 3); poe(52, 26, 'sacas_cafe');
  b.predio('b_quitanda', 54, 23, 5, 3);
  b.predio('b_agencia', 61, 23, 5, 3);
  b.npc('agente_turismo', 64, 27);
  b.placa(60, 27, '✈️ AGÊNCIA DE TURISMO DA VILA — venha ver os cartões-postais das cidades do mundo!');
  poe(47, 18, 'poco'); poe(51, 17, 'galinha'); poe(56, 18, 'horta'); largo(61, 17, 'varal', 3); poe(64, 19, 'mangueira'); poe(49, 20, 'arbusto');
  b.spawn('pombo', 55, 20, 5, 3);

  /* --- A AVENIDA (lado de baixo): o ônibus e o MURAL DO MUNDO --- */
  b.ret(46, 30, 22, 2, P);
  poe(49, 30, 'ponto_onibus'); b.npc('motorista', 50, 31);
  largo(59, 31, 'mural_mundo', 7);
  b.npc('lia', 57, 32);
  b.placa(64, 32, '🌎 MURAL DO MUNDO — pintado pela criançada da Vila: "Um dia você vai jogar em todos esses lugares!"');
  (m.zonas = m.zonas || []).push({ x: 46, y: 30, w: 22, h: 3, nome: 'Mural do Mundo' });

  /* --- O CAMPINHO --- */
  b.campo(26, 34, 30, 17, CH.CAMPO_TERRA, 'rgba(255,250,235,0.85)');
  for (const x of [30, 39, 48]) largo(x, 32, 'arquibancada_mad', 3);
  b.npc('ze', 24, 42);
  poe(24, 38, 'banco'); poe(24, 46, 'banco');
  b.ponto(30, 42, 'penalti');
  b.placa(24, 35, 'CAMPINHO — pise na marca amarela do pênalti e aperte E');
  poe(57, 36, 'pipoqueiro'); poe(57, 47, 'gol_caixote_d');
  b.spawn('moleque', 41, 42, 10, 8);
  b.spawn('tonhao', 50, 39, 1, 1);
  (m.zonas = m.zonas || []).push({ x: 26, y: 34, w: 30, h: 17, nome: 'O Campinho' });

  /* --- A RUA DE BAIXO: as casas à venda (a Rua das Mangueiras) --- */
  m.casasLote = [
    b.predio('b_casa_azul', 26, 55, 5, 3),
    b.predio('b_casa_amarela', 33, 55, 5, 3),
    b.predio('b_casa', 40, 55, 5, 3),
  ];
  b.npc('sonia', 46, 56); b.npc('tonico', 25, 53);
  poe(48, 54, 'horta'); poe(52, 55, 'galinha'); largo(55, 54, 'varal', 3); poe(59, 55, 'poco'); poe(62, 54, 'mangueira');
  for (const x of [27, 37, 47, 57]) poe(x, 60, 'poste');

  /* --- O RIO: ponte, trapiche, barquinho --- */
  b.ret(62, 41, 8, 2, MAD); b.limpa(62, 41, 8, 2);                     // o trapiche
  poe(62, 40, 'rede_pesca'); poe(66, 40, 'barris');
  b.obj(70, 44, 'barquinho');
  poe(60, 36, 'mangueira_balanco'); poe(64, 33, 'banca_coco');
  b.placa(61, 43, '🎣 TRAPICHE DO RIO CAMPINHO — dizem que o rio vai até o mar... e o mar vai até o mundo todo!');
  for (const [x, y] of [[65, 31], [74, 26], [74, 31]]) poe(x, y, 'poste');

  /* --- A MATA DO LESTE (depois do rio): o Caramelo e os Zagueiros da Rua --- */
  b.espalha(ARVORES, 34, 74, 3, 14, 23, FILTRO_GRAMA);
  b.espalha('arbusto', 16, 74, 3, 14, 23, FILTRO_GRAMA);
  b.espalha(ARVORES, 16, 75, 33, 13, 28, FILTRO_GRAMA);
  b.spawn('caramelo', 80, 43, 8, 5);
  b.spawn('zagueiro_rua', 81, 51, 5, 3);
  (m.zonas = m.zonas || []).push({ x: 74, y: 33, w: 14, h: 28, nome: 'Mata do Caramelo' });

  /* --- A MATA DO OESTE: a trilha do Bosque e o Vale --- */
  m.lotes.caca_bosque = { x: 7, y: 36 };
  m.lotes.vale_celeste = { x: 7, y: 49 };
  b.espalha(ARVORES, 26, 3, 31, 17, 27, FILTRO_GRAMA);
  b.espalha('arbusto', 14, 3, 31, 17, 27, FILTRO_GRAMA);
  b.spawn('caramelo', 13, 44, 4, 3);
  // clareiras na frente das entradas (a trilha fica livre)
  for (const [x, y] of [[7, 36], [7, 49]]) { b.limpa(x - 1, y - 1, 6, 5); b.ret(x, y + 2, 3, 2, T_); b.ret(x + 3, y + 3, 22 - x - 3, 1, T_); b.limpa(x + 3, y + 2, 22 - x - 3, 3); }

  /* --- mangueiras e flores pelo resto da vila --- */
  b.espalha(ARVORES, 10, 3, 2, 64, 5, FILTRO_GRAMA);
  b.espalha(['arvore', 'mangueira'], 6, 46, 51, 20, 5, FILTRO_GRAMA);

  /* --- saída para a PRAIA (leste) --- */
  const req = { flag: 'libera_praia', msg: 'O caminho pra praia é longe! Vença o Tonhão (missão do Seu Zé) primeiro.' };
  for (const y of [27, 28, 29]) b.saida(W - 1, y, 'praia', 3, y === 29 ? 29 : 27, req);
  b.placa(W - 4, 26, '🏖️ PARA A PRAIA DO FUTEVÔLEI →');
  m.inicio = { x: 8, y: 13 }; m.renasce = { x: 8, y: 13 };
  // nada solto dentro do campinho
  for (const cp of m.campos) for (let j = cp.y; j < cp.y + cp.h; j++) for (let x = cp.x; x < cp.x + cp.w; x++) { const o = m.obj[j * W + x]; if (o && o.t !== 'gol') m.obj[j * W + x] = null; }
  return m;
};
// o tamanho "de projeto" da Vila agora é o real (o espalha não mexe, e a Praia manda o jogador pro lugar certo)
{
  const _dimProjetoVila = dimProjeto;
  dimProjeto = function (id) { return id === 'vila' ? [VILA_W / ESCALA_MAPA, VILA_H / ESCALA_MAPA] : _dimProjetoVila(id); };
  // a Praia foi desenhada para a Vila antiga: quem vem da praia chega na estrada da praia (leste)
  const _praiaVila = MAPAS_DEF.praia;
  MAPAS_DEF.praia = function () { const m = _praiaVila.apply(this, arguments); for (const s of m.saidas) if (s.para === 'vila') { s.tx = VILA_W - 3; s.ty = 28; } return m; };
  // quem salvou dentro da Vila antiga volta para a porta de casa (uma vez)
  const VERSAO_VILA = 280;
  const _iniciarJogoVila = iniciarJogo;
  iniciarJogo = async function (save, ...resto) {
    try {
      if (save && save.vilaNova !== VERSAO_VILA) {
        if (save.mapa === 'vila') { save.x = 8.5; save.y = 13.5; save.mapasEspalhados = ESCALA_MAPA; } // (o conversor dos saves antigos não mexe mais)
        save.vilaNova = VERSAO_VILA;
      }
    } catch (e) { console.warn('vila nova: posição', e); }
    return _iniciarJogoVila.call(this, save, ...resto);
  };
}

/* ---------- a Lia, a menina que sonha com o mundo (na frente do mural) ---------- */
{
  const FALAS_LIA = [
    'Tá vendo aquela torre de ferro no mural? É a TORRE EIFFEL, em Paris! Dizem que lá tem jogador que dribla até o garçom do café.',
    'Meu tio foi pro RIO DE JANEIRO e jogou bola do lado do Cristo Redentor! Um dia eu vou também.',
    'No CAIRO, no Egito, tem gente que joga bola do lado das PIRÂMIDES. Pirâmide de verdade, com mais de 4 mil anos!',
    'Em TÓQUIO, no Japão, as ruas brilham de noite com luz neon. E o goleiro de lá defende até pensamento!',
    'Sabia que em BUENOS AIRES tem um bairro todo colorido, o Caminito? A torcida lá canta o jogo inteiro!',
    'Primeiro você fica forte aqui na Vila, depois vai pra Praia, pra Cidade, pro CT... e aí pega o AVIÃO pro mundo! ✈️',
    'Quando passar o aviãozinho lá no céu, faz um pedido! Eu sempre peço pra jogar em LONDRES, do lado do Big Ben.',
    'A moça da Agência de Turismo tem cartão-postal de TODAS as cidades. Vai lá ver!',
  ];
  let k = (Math.random() * FALAS_LIA.length) | 0;
  NPCS.lia = { nome: 'Lia, a sonhadora', look: { tipo: 'humano', corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-camiseta', corRoupa: '#f0c030', baixo: 'baixo-shorts', mao: 'mao-bola', alt: 1.3 } };
  Object.defineProperty(NPCS.lia, 'ola', { get() { const f = FALAS_LIA[k % FALAS_LIA.length]; k++; return f; }, enumerable: true, configurable: true });
}

/* ---------- a Agência de Turismo: cartões-postais das cidades ---------- */
{
  NPCS.agente_turismo = { nome: 'Dona Glória, da Agência de Turismo', turismo: true,
    look: { tipo: 'humano', corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-coque', corCabelo: 'castanho', roupa: 'roupa-camiseta', corRoupa: '#2a7ad0', baixo: 'baixo-saia', alt: 1.68 },
    ola: 'Bem-vindo(a) à Agência de Turismo da Vila! Olha só os cartões-postais: cada cidade dessas tem adversários, estádio, música e segredos só dela.' };
  const POSTAIS = {
    cairo: ['📮', 'Jogue bola ao lado das pirâmides de Gizé, atravesse o rio Nilo e enfrente o Faraó da Bola!'],
    doha: ['📮', 'Dunas de areia, um museu na beira da baía e estádios com ar-condicionado. Cuidado com a Falcoaria!'],
    toquio: ['📮', 'Ruas de neon, templos, cerejeiras e um dojo onde se treina drible em silêncio.'],
    miami: ['📮', 'Praia, palmeiras, prédios coloridos e um píer onde o chefão dá show.'],
    buenos: ['📮', 'O bairro colorido de La Boca, o tango e a torcida que canta o jogo inteiro!'],
    rio: ['📮', 'O Cristo Redentor, o Pão de Açúcar, a praia de Copacabana e o Maracanã!'],
    lisboa: ['📮', 'Bondinhos amarelos, a Torre de Belém e pastéis de nata. Ó pá, que golaço!'],
    paris: ['📮', 'A Torre Eiffel, o Arco do Triunfo, o rio Sena e muito croissant.'],
    munique: ['📮', 'O relógio que dança da Prefeitura, pretzels e a torcida de chapéu tirolês.'],
    milao: ['📮', 'A catedral do Duomo, os canais Navigli e o bairro da moda. Dribles com estilo!'],
    madri: ['📮', 'A Puerta de Alcalá, flamenco e um dos estádios mais famosos do mundo.'],
    londres: ['📮', 'O Big Ben, ônibus vermelhos de dois andares e a chuvinha inglesa.'],
    santos: ['📮', 'A Vila Belmiro, a estátua dourada do Rei Pelé e a orla com prédios tortos!'],
  };
  function modalPostais(npc) {
    const s = G.save, nv = s ? s.nivel : 1;
    const grade = el('div', { class: 'postais' });
    const ids = Object.keys(POSTAIS).filter(id => typeof VOOS === 'undefined' || VOOS[id]).sort((a, b) => ((VOOS[a] || {}).lvl || 0) - ((VOOS[b] || {}).lvl || 0));
    for (const id of ids) {
      const v = (typeof VOOS !== 'undefined' && VOOS[id]) || { nome: id, lvl: 1 };
      const mon = typeof MONUMENTOS !== 'undefined' && MONUMENTOS[id] && MONUMENTOS[id][0];
      const pode = nv >= v.lvl, falta = v.lvl - nv;
      grade.append(el('div', { class: 'postal' + (pode ? ' pode' : '') },
        mon ? el('img', { src: 'a/' + mon.spr + '.webp', alt: mon.nome, loading: 'lazy' }) : el('div', { class: 'sem' }, '🏙️'),
        el('b', {}, v.nome),
        mon ? el('small', { class: 'mon' }, mon.nome) : null,
        el('p', {}, POSTAIS[id][1]),
        el('span', { class: 'nv' }, pode ? '✈️ Você já pode voar! (aeroporto da Cidade)' : `Nível ${v.lvl} · faltam ${falta}`)));
    }
    abreModal(el('h2', {}, '✈️ Agência de Turismo da Vila'),
      el('div', { class: 'npc-topo' }, typeof retratoNPC === 'function' ? retratoNPC(npc) : null, el('div', { class: 'fala' }, el('p', {}, npc.d.ola),
        el('p', {}, el('small', {}, 'O caminho: Vila → Praia → Cidade → CT → Estádio. Na Cidade tem o AEROPORTO — e de lá você voa para o mundo!')))),
      grade,
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: fechaModal }, 'Um dia eu vou! ✈️')));
  }
  const _abrirNPCTur = abrirNPC;
  abrirNPC = function (npc) {
    if (!npc || !npc.d || !npc.d.turismo) return _abrirNPCTur.apply(this, arguments);
    som('porta'); modalPostais(npc);
  };
  if (typeof iconeNPC === 'function') { const _iconeNPCTur = iconeNPC; iconeNPC = function (n) { const d = n.d || NPCS[n.id] || {}; return d.turismo ? '✈️' : _iconeNPCTur(n); }; }
  const css = document.createElement('style');
  css.textContent = `.postais{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:10px 0;max-height:52vh;overflow-y:auto;overflow-x:hidden;padding:4px}
.postal{background:#fff8e8;color:#3a2a1a;border-radius:10px;padding:8px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:rotate(-1deg);display:flex;flex-direction:column;gap:3px}
.postal:nth-child(2n){transform:rotate(1.2deg)}
.postal img{width:100%;height:92px;object-fit:contain;background:linear-gradient(#9fd4ff,#e8f6ff);border-radius:6px}
.postal .sem{height:92px;display:grid;place-items:center;font-size:40px;background:#dfefff;border-radius:6px}
.postal b{font-size:14px}.postal .mon{color:#7a5a3a;font-size:11px}.postal p{font-size:12px;margin:0;line-height:1.3}
.postal .nv{margin-top:auto;font-size:11px;font-weight:bold;color:#a04a2a}.postal.pode .nv{color:#1a8a3a}`;
  document.head.append(css);
}

/* ---------- o aviãozinho que passa no céu da Vila ---------- */
{
  let aviao = null, proximo = 0;
  window.aviaoVila = () => { aviao = null; proximo = 0; return () => aviao; }; // (para gravar vídeo e para os testes)
  const _desenhaAviao = desenha;
  desenha = function (dt) {
    const r = _desenhaAviao.apply(this, arguments);
    try {
      const m = G.mapa; if (!m || m.id !== 'vila' || !G.p || !G.cam || !G.zoom) { aviao = null; return r; }
      const agora = G.agora || performance.now();
      if (!aviao && agora > proximo) {
        const daEsq = Math.random() < 0.5;
        aviao = { t0: agora, dur: 11000, daEsq, fy: 0.07 + Math.random() * 0.08 }; // altura: no terço de cima da tela
        proximo = agora + 45000 + Math.random() * 40000;
      }
      if (!aviao) return r;
      const f = (agora - aviao.t0) / aviao.dur; if (f > 1) { aviao = null; return r; }
      const im = aSprite('aviao'); if (!im) return r;
      const z = G.zoom, vw = CV.width / z, x0 = G.cam.x - 3 * T, x1 = G.cam.x + vw + 3 * T;
      const x = aviao.daEsq ? x0 + (x1 - x0) * f : x1 - (x1 - x0) * f, y = G.cam.y + (CV.height / z) * aviao.fy - f * T * 1.2;
      const w = 1.5 * T, h = w * im.height / im.width;
      const ctx = CTX; ctx.setTransform(z, 0, 0, z, -G.cam.x * z, -G.cam.y * z);
      // a sombra no chão
      ctx.fillStyle = 'rgba(20,30,20,0.10)'; ctx.beginPath(); ctx.ellipse(x - T * 1.2, y + 5 * T, w * 0.34, h * 0.2, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(x, y); if (!aviao.daEsq) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
    } catch (e) { aviao = null; }
    return r;
  };
}
