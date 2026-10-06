/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🐟 SANTOS (v234): o mapa próprio da cidade, montado como a cidade de verdade.
   De cima (norte) para baixo (sul):
   - PORTO: o estuário, o cais com guindastes e sacas de café, a avenida portuária;
   - CENTRO HISTÓRICO: Museu Pelé (casarões do Valongo), Bolsa do Café, casarões coloniais e uma praça;
   - VILA BELMIRO: o estádio no meio do bairro, o campinho dos Meninos da Vila e o aeroporto;
     cortando tudo de norte a sul, os dois CANAIS de Santos (com pontes nas ruas);
   - ORLA: a fileira de prédios da praia (com os prédios tortos), a avenida da praia com a calçada
     de mosaico, o JARDIM DA ORLA com a praça da estátua do Rei, a praia e, na PONTA DA PRAIA,
     o calçadão de mosaico com a mureta branca.
   Coordenadas "de projeto" (52×40): o Construtor aumenta tudo (espalha.js). Os monumentos e o
   estádio entram nos lotes vazios deixados aqui (monumentos.js / estadios.js, com as refs combinadas).
   Carregar logo DEPOIS de cidades.js.
   ============================================================ */
CH.CALCADA_SANTOS = 50;
ESTILO_CHAO[CH.CALCADA_SANTOS] = { cor: '#c8623e', borda: '#8a3e24', r: 0, e: 0, tex: 'calcada', o: 6.6 };
TEX_CHAO[CH.CALCADA_SANTOS] = 't_calcada_santos';
CH_MINI[CH.CALCADA_SANTOS] = '#c8623e';

function criaSantos(c) {
  const W = 52, H = 40, M = CH.CALCADA_SANTOS, AS = CH.ASFALTO;
  const b = new Construtor(c.id, c.nome, W, H, CH.CALCADA, c.seed);
  bordaInvisivel(b);
  const poe = (x, y, t) => { if (b.livre(x, y)) b.obj(x, y, t); };

  /* ---------- PORTO (y 1–5) ---------- */
  b.ret(1, 1, 50, 2, CH.AGUA);                 // o estuário
  b.ret(1, 3, 50, 1, CH.CONCRETO);             // o cais
  for (const x of [7, 21, 34, 47]) b.obj(x, 3, 'guindaste_porto');
  for (const x of [9, 10, 23, 36, 37, 45]) b.obj(x, 3, 'sacas_cafe');
  b.ret(1, 4, 50, 2, AS);                      // avenida portuária
  b.placa(28, 3, '⚓ PORTO DE SANTOS — o maior porto da América Latina. Por aqui o café do Brasil saía para o mundo inteiro!');

  /* ---------- ruas e canais ---------- */
  b.ret(1, 12, 50, 2, AS);                     // rua do comércio (entre o centro e a Vila Belmiro)
  b.ret(1, 21, 50, 2, AS);                     // rua de trás da orla
  for (const cx of [13, 38]) {                 // os canais: avenida – água – avenida, do porto até a praia
    b.ret(cx, 6, 1, 20, AS); b.ret(cx + 3, 6, 1, 20, AS); b.ret(cx + 1, 6, 2, 20, CH.AGUA);
    for (const y of [12, 13, 21, 22]) b.ret(cx + 1, y, 2, 1, CH.CONCRETO);   // as pontes das ruas
    b.ret(cx + 1, 17, 2, 1, CH.CONCRETO);                                   // uma ponte de pedestres no meio
  }
  b.placa(18, 17, '🌊 OS CANAIS DE SANTOS — foram construídos há mais de 100 anos pelo engenheiro Saturnino de Brito para levar a água da chuva até o mar e acabar com as enchentes e as doenças.');

  /* ---------- CENTRO HISTÓRICO (y 6–11) ---------- */
  // lotes vazios: Museu Pelé (x 2–11) e Bolsa do Café (x 18–25) — os monumentos entram neles
  // cada lote com um prédio DIFERENTE (nada de casarões iguais empilhados)
  b.predio('b_santos1', 10, 7, 5, 3);                                                // casarão azul ao lado do museu
  b.predio('b_santos5', 25.5, 7, 5, 3); b.predio('b_santos9', 29, 7.3, 5, 3);        // sobrado amarelo e a casinha santista
  b.predio('b_santos7', 42, 7, 7, 3); b.predio('b_santos1', 47.2, 7, 5, 3);          // armazém do porto e casarão
  // Praça do Centro (entre os prédios e o canal): gramado com árvores, bancos e poste
  b.ret(32.5, 7, 4.5, 4, CH.GRAMA);
  poe(33, 7, 'arvore'); poe(36, 10, 'arvore'); poe(34.5, 9, 'banco'); poe(36, 7, 'poste3'); poe(33, 10, 'banco');

  /* ---------- VILA BELMIRO (y 14–20) ---------- */
  // lote do estádio: x 19–32 (vazio); campinho dos Meninos da Vila no oeste; aeroporto no leste
  b.campo(2, 15, 10, 5, CH.CAMPO);
  (b.m.zonas = b.m.zonas || []).push({ x: 2, y: 15, w: 10, h: 5, nome: 'Campinho dos Meninos da Vila', hostil: false });
  b.placa(6, 14, '⚽ CAMPINHO DOS MENINOS DA VILA — aqui a base do Peixe treina pedalada, chapéu e caneta. Cuidado com o drible!');
  b.predio('b_aeroporto', 43, 15, 8, 4); b.npc('comissaria', 46, 19);
  b.m.inicio = { x: 47, y: 20 }; b.m.renasce = { x: 48, y: 20 };
  b.predio('b_santos6', 34, 15.5, 5, 3);                                         // a padaria da esquina do bairro
  b.npc('quadro', 32, 24);                                                        // o quadro de desafios fica na Praça do Gonzaga, com as lojas

  /* ---------- ORLA: prédios da praia (y 23–26) ---------- */
  // os prédios de frente para o mar; lotes vazios: prédios tortos (x 2–11) e a Praça do Gonzaga (x 24–33, com as lojas)
  // prédios altos só onde atrás deles tem rua ou calçada livre (não cobrem outro prédio)
  for (const [x, spr, w] of [[17.3, 'b_santos4', 3], [20.5, 'b_santos2', 5], [34, 'b_santos8', 5], [42, 'b_santos3', 3.5], [46.5, 'b_santos2', 5]]) b.predio(spr, x, 23, w, 3);
  b.npc('loja_' + c.id, 27, 24); b.npc('lider_' + c.id, 30, 24);
  c.enfeitesLoja.forEach(([t, dx]) => poe(27 + dx, 23, t));

  /* ---------- avenida da praia (y 26–29) ---------- */
  b.ret(1, 26, 50, 1, M); b.ret(1, 27, 50, 2, AS); b.ret(1, 29, 50, 1, M);
  for (let x = 3; x < 50; x += 6) { poe(x, 26, 'poste3'); poe(x + 3, 29, 'poste3'); }

  /* ---------- JARDIM DA ORLA (y 30–33) ---------- */
  b.ret(1, 30, 42, 4, CH.GRAMA);
  for (const x of [7, 16, 31, 38]) b.ret(x, 30, 1, 4, M);                                 // passagens retas para a praia: gramados em canteiros retos
  b.ret(20, 30, 9, 4, CH.GRAMA); b.limpa(20, 30, 9, 4);                                   // a praça da estátua do Rei (lote livre)
  b.obj(3, 32, 'farol_orla'); objLargo(b, 11, 31, 'pavilhao_orla', 3);
  for (const [x, y] of [[9, 31], [18, 31], [33, 31], [36, 32], [41, 31], [26, 31]]) poe(x, y, 'jardim_orla');
  for (const [x, y] of [[2, 30], [13, 33], [17, 30], [33, 33], [36, 33], [40, 30], [9, 33], [4, 33]]) poe(x, y, x % 2 ? 'coqueiro' : 'coqueiro2');
  for (const [x, y] of [[10, 33], [19, 32], [34, 32]]) poe(x, y, 'banco');
  b.placa(7, 29, '🌺 JARDIM DA ORLA — está no Guinness como o MAIOR JARDIM DE PRAIA DO MUNDO: são mais de 5 km de flores e gramados na beira da praia!');

  /* ---------- PRAIA e PONTA DA PRAIA (y 34–38) ---------- */
  b.ret(1, 34, 42, 2, CH.AREIA); b.ret(1, 36, 42, 1, CH.AREIA_MOLHADA); b.ret(1, 37, 50, 2, CH.AGUA);
  b.ret(43, 30, 8, 6, M); b.ret(43, 36, 8, 1, CH.AGUA);
  for (const x of [44, 47]) poe(x, 32, 'banco');
  for (const [x, y] of [[45, 30], [49, 31], [43, 33]]) poe(x, y, x % 2 ? 'coqueiro' : 'coqueiro2');
  b.placa(44, 30, '🌊 PONTA DA PRAIA — a mureta branca e o calçadão de mosaico com bolinhas brancas são a cara de Santos. Daqui dá pra ver os navios entrando no porto!');
  // os jogos de GOL CAIXOTE dos turistas na areia: dois golzinhos de frente um pro outro
  for (const x of [2, 24, 33]) { b.obj(x, 35, 'gol_caixote_d'); b.obj(x + 6, 35, 'gol_caixote_e'); }
  for (const [x, y, t] of [[11, 34, 'quiosque'], [21, 34, 'quiosque'], [41, 34, 'quiosque'], [13, 35, 'guarda_sol'], [17, 34, 'guarda_sol'], [19, 35, 'guarda_sol'],
    [12, 35, 'toalha_praia'], [18, 35, 'toalha_praia'], [15, 34, 'isopor_praia'], [16, 35, 'cadeira_praia'], [20, 35, 'cadeira_praia'], [16, 29, 'carrinho_caldo'], [37, 29, 'carrinho_caldo']]) poe(x, y, t);
  (b.m.zonas = b.m.zonas || []).push({ x: 1, y: 34, w: 42, h: 3, nome: c.zona, hostil: false }, { x: 43, y: 30, w: 8, h: 5, nome: 'Ponta da Praia', hostil: false });

  /* ---------- os Meninos da Vila ---------- */
  b.spawn(c.zagueiro, 5, 17, 3, 2); b.spawn(c.meia, 9, 17, 3, 2);                 // no campinho
  for (const x of [5, 27, 36]) b.spawn('santos_turista', x, 35, 3, 2);            // os turistas sem protetor, jogando gol caixote na areia
  b.spawn(c.rapido, 4, 31, 3, 1); b.spawn(c.rapido, 35, 31, 3, 1);              // os Meninos da Vila no jardim da orla
  b.spawn(c.rapido, 30, 5, 3, 1); b.spawn(c.zagueiro, 44, 11, 3, 2);             // no centro
  b.spawn(c.meia, 8, 22, 3, 1);                                                  // na rua de trás da orla
  b.spawn(c.chefe, 48, 33, 1, 1); b.placa(46, 33, `Território do ${MONSTROS[c.chefe].nome.toUpperCase()} — a Ponta da Praia é dele!`);
  // a mureta branca: UMA fileira contínua na beira d'água (desenhada já no tamanho final do mapa)
  { const m = b.m, esc = typeof escalaCoord === 'function' && m.projeto ? (v, D, R) => escalaCoord(v, D, R) : v => v;
    const y = esc(36, H, m.h) - 1, x0 = esc(43, W, m.w), x1 = m.w - 2;
    for (let x = x0; x <= x1; x++) m.obj[y * m.w + x] = { t: 'mureta_reta', v: 0 };                 // a parede inteira, sem buraco
    for (let x = x0 + 1; x <= x1; x += 4) if (!m.obj[(y - 1) * m.w + x]) m.obj[(y - 1) * m.w + x] = { t: 'poste3', v: 0 }; } // postes logo atrás da mureta
  return b.m;
}
{ const c = CIDADES.find(k => k.id === 'santos'); if (c) c.cria = criaSantos; }
// os TURISTAS SEM PROTETOR: meninos de sunga, vermelhos de sol, jogando gol caixote na praia
// v407 (Raio-X U3): era "Turista Branquelo" — nome que caçoa da aparência; agora "Turista Sem Protetor"
{
  const t = montaMonstro('santos_turista', 'Turista Sem Protetor', 'rapido', 186, { falas: ['Gol caixote!', 'Tá ardendo!', 'Cadê o protetor?', 'Passa a bola!'], look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'loiro', roupa: 'roupa-regata', corRoupa: '#e03a3a', baixo: 'baixo-praia' } });
  t.loot = [['couro', 0.3, 1, 2], ['pastel_caldo', 0.05, 1, 1], ['saca_cafe', 0.05, 1, 1], ['medalha_copa', 0.002, 1, 1]];
  Object.assign(OBJ_INFO, { gol_caixote_d: { w: 2.1, b: 1 }, gol_caixote_e: { w: 2.1, b: 1 }, toalha_praia: { w: 1.2, b: 0 }, isopor_praia: { w: 0.8, b: 1 } });
  ['gol_caixote_d', 'gol_caixote_e', 'isopor_praia'].forEach(k => OBJ_BLOQUEIA.add(k));
  ['gol_caixote_d', 'gol_caixote_e', 'toalha_praia', 'isopor_praia', 'boneco_turista_a', 'boneco_turista_b'].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
  MISSOES.push({ id: 'santos_turistas', npc: 'loja_santos', titulo: 'Gol Caixote na Areia', lvl: 184,
    texto: 'Os turistas tomaram conta da praia com o gol caixote... e esqueceram o protetor solar! Vença 30 Turistas Sem Protetor no jogo limpo, na areia da praia de Santos.',
    req: { kill: 'santos_turista', n: 30 }, rec: { xp: Math.round((xpPara(187) - xpPara(186)) * 1.1), ouro: 186 * 150, itens: [['pastel_caldo', 5]] }, fim: 'Agora eles querem aprender a pedalada... e comprar protetor! Toma um pastel por conta da casa.' });
}
