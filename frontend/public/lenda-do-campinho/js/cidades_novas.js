/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏙️ CIDADES NOVAS (v272): cada cidade do mundo com o SEU mapa, desenhado como a cidade de verdade.
   Antes, Cairo, Doha, Tóquio, Miami, Buenos Aires, Rio, Lisboa, Paris, Munique e Milão saíam do
   mesmo molde (52×40) e só mudavam os enfeites. Agora:
   - mapas maiores (100×74 quadros, desenhados já no tamanho final — o "espalha" não mexe);
   - ruas de asfalto em grade, com quarteirões, calçadas e esquinas arredondadas (ruas.js);
   - prédios variados em fileira, com a porta para a calçada e os fundos livres;
   - lotes certos para o estádio, os monumentos, o centro de treino e as entradas das dungeons
     (m.lotes: monumentos.js, centros_treino.js e cacadas.js usam o lote antes de procurar);
   - cada adversário tem o SEU bairro de caça, longe dos outros e longe do centro (as lojas e
     missões ficam numa praça central, perto do aeroporto).
   Carregar POR ÚLTIMO.
   ============================================================ */
const CN_W = 100, CN_H = 74;
const CIDADES_NOVAS = {}; // id → função que desenha (b = Construtor, c = cidade, K = kit)
// largura (em quadros) de cada prédio: o desenho mais alto fica mais estreito (a sombra do prédio não passa da calçada de trás)
const CN_AR = { b_cairo1: 1.071, b_cairo2: 0.849, b_doha1: 0.739, b_doha2: 0.97, b_toquio1: 0.702, b_toquio2: 0.884, b_miami1: 0.964, b_miami2: 0.802,
  b_buenos1: 1.4, b_buenos2: 1.424, b_rio1: 1.389, b_rio2: 1.429, b_lisboa1: 1.887, b_lisboa2: 1.037, b_paris1: 1.56, b_paris2: 1.461,
  b_munique1: 0.896, b_munique2: 0.896, b_milao1: 0.936, b_milao2: 0.998,
  b_cairo3: 1.494, b_cairo4: 1.01, b_cairo5: 1.0, b_cairo6: 0.966, b_doha3: 0.987, b_doha4: 1.016, b_doha5: 0.86, b_doha6: 0.968, b_toquio3: 1.445, b_toquio4: 1.016, b_toquio5: 0.841, b_toquio6: 1.022,
  b_miami3: 1.026, b_miami4: 0.809, b_miami5: 0.91, b_miami6: 0.962, b_buenos3: 1.049, b_buenos4: 1.311, b_buenos5: 1.251, b_buenos6: 0.9, b_rio3: 1.51, b_rio4: 1.186, b_rio5: 1.342, b_rio6: 1.329,
  b_lisboa3: 1.777, b_lisboa4: 1.374, b_lisboa5: 1.307, b_lisboa6: 1.683, b_paris3: 1.514, b_paris4: 1.322, b_paris5: 1.382, b_paris6: 1.344,
  b_munique3: 1.203, b_munique4: 1.04, b_munique5: 0.955, b_munique6: 1.118, b_milao3: 1.144, b_milao4: 1.183, b_milao5: 1.059, b_milao6: 1.165 };
const larguraPredio = spr => Math.max(3, Math.min(6, Math.round(6.6 / (CN_AR[spr] || 1) - 0.5)));
for (const n of Object.keys(CN_AR)) { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } if (!PORTAS[n]) PORTAS[n] = { x: 0.5, y: 0.93 }; }
// objetos novos (cidades e dungeons novas): largura do desenho em quadros; todos bloqueiam a passagem
const CN_OBJ = { pilha_especiarias: 1.3, arara_tapetes: 1.4, lampioes_bazar: 1.0, caixotes_frutas: 1.4, coluna_palacio: 0.8, espelho_miragem: 1.0, vaso_palacio: 1.0, almofadas: 1.5,
  taiko: 1.3, biombo: 1.5, lanterna_papel: 0.7, bonsai: 1.1, rack_halteres: 1.4, barra_fixa: 1.6, pneu_gigante: 1.5, supino: 1.6, casco_barco: 2.2, barris: 1.1, corda_ancora: 1.4, caixotes_porto: 1.3,
  carro_alegorico: 2.6, arara_fantasias: 1.5, surdos: 1.4, mascara_carnaval: 1.3, mastro: 1.2, bau_tesouro: 1.1, mesa_mapas: 1.4, rede_pesca: 1.5, topiaria: 0.9, roseira: 1.2, estatua_jardim: 0.8,
  banco_jardim: 1.4, engrenagem: 1.4, pendulo: 1.0, relogio_cuco: 1.0, bancada_relojoeiro: 1.5, manequim: 0.8, arara_roupas: 1.5, espelho_camarim: 1.0, poltronas_plateia: 1.7 };
for (const [n, w] of Object.entries(CN_OBJ)) { OBJ_INFO[n] = { w, b: 1 }; OBJ_BLOQUEIA.add(n); if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } }
['ent_bazar', 'ent_palacio', 'ent_dojo', 'ent_academia', 'ent_estaleiro', 'ent_barracao', 'ent_caravela', 'ent_labirinto', 'ent_relogio', 'ent_passarela'].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });

/* ---------- o kit de desenho ---------- */
function kitCidade(b, c) {
  const m = b.m, W = m.w, H = m.h, r = b.r, i = (x, y) => y * W + x;
  m.lotes = {}; m.semCentrinho = true; m.huntsProprios = true;
  const lista = Array.from({ length: 6 }, (_, k) => `b_${c.arte || c.id}${k + 1}`);
  let giro = 0;
  const K = {
    W, H, r,
    chao: (x, y, w, h, t) => b.ret(x, y, w, h, t),
    rua: (x, y, w, h) => b.ret(x, y, w, h, CH.ASFALTO),
    poe: (x, y, t) => { if (b.livre(x, y)) { b.obj(x, y, t); return true; } return false; },
    // fileira de prédios com a PORTA na linha yp (a pegada fica em yp-2..yp); centrada entre x0 e x1
    fila(x0, x1, yp, opts = {}) {
      const sprs = opts.sprs || lista, fora = new Set(opts.fora || []), gap = opts.gap != null ? opts.gap : 1;
      const escolhidos = []; let tot = 0;
      for (let k = 0; k < 40; k++) {
        let s = sprs[(giro + k) % sprs.length]; if (fora.has(s)) continue;
        if (escolhidos.length && escolhidos[escolhidos.length - 1].s === s) continue;
        const w = opts.w || larguraPredio(s);
        if (tot + (escolhidos.length ? gap : 0) + w > x1 - x0 + 1) { if (escolhidos.length >= (opts.max || 99)) break; continue; }
        tot += (escolhidos.length ? gap : 0) + w; escolhidos.push({ s, w });
        if (escolhidos.length >= (opts.max || 99)) break;
      }
      giro += escolhidos.length + 1;
      let x = x0 + Math.floor((x1 - x0 + 1 - tot) / 2); const feitos = [];
      for (const { s, w } of escolhidos) { const p = b.predio(s, x, yp - 2, w, 3); feitos.push(m.predios[m.predios.length - 1]); x += w + gap; }
      return feitos;
    },
    lote: (k, x, y) => { m.lotes[k] = { x, y }; },
    // monumento: centro da base em cx, última fileira da base em yb
    mon(spr, cx, yb) { const d = (MONUMENTOS[c.id] || []).find(e => e.spr === spr); if (d) m.lotes[spr] = { x: cx - Math.floor(d.w / 2), y: yb - d.h + 1 }; },
    estadio(cx, yb) { const e = ESTADIOS.find(k => k.host === c.id); if (e) m.lotes[e.id] = { x: cx - 7, y: yb - 6 }; },
    caca(id, x, y) { m.lotes[id] = { x, y }; },
    ct(x, y) { m.lotes.ct = { x, y }; },
    // um bairro de caça: vários grupos do MESMO adversário, afastados entre si
    caça(mon, pontos, qtd = 4, raio = 3) { for (const [x, y] of pontos) b.spawn(mon, x, y, qtd, raio); },
    zona(x, y, w, h, nome, hostil = false) { (m.zonas = m.zonas || []).push({ x, y, w, h, nome, hostil }); },
    // praça: piso, postes nos cantos, bancos e árvores na volta, fonte/enfeite no meio
    praca(x, y, w, h, piso, o = {}) {
      b.ret(x, y, w, h, piso);
      if (o.fonte) objLargo(b, x + (w >> 1), y + (h >> 1), o.fonte, o.fonteLarg || 3);
      const arv = o.arvore || (c.arvores && c.arvores[0]) || 'arvore';
      for (const [px, py] of [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]]) K.poe(px, py, o.poste || c.poste || 'poste3');
      if (o.arvores !== false) for (let k = x + 2; k < x + w - 2; k += 4) { K.poe(k, y, arv); }
      if (o.bancos !== false) for (let k = x + 3; k < x + w - 3; k += 5) K.poe(k, y + h - 1, 'banco');
    },
    espalha: (t, n, x, y, w, h, filtro) => b.espalha(t, n, x, y, w, h, filtro),
    // quintal nos fundos de uma fileira de prédios: gramado com árvores e arbustos
    quintal(x, y, w, h, arv) {
      b.ret(x, y, w, h, CH.GRAMA); const a = arv || (c.arvores && c.arvores[0]) || 'arvore';
      for (let k = x + 1; k < x + w - 1; k += 4) K.poe(k, y + ((k >> 2) % 2 ? 0 : h - 1), (k >> 2) % 3 ? a : 'arbusto');
    },
    fileiraObj(x0, x1, y, passo, t) { for (let x = x0; x <= x1; x += passo) K.poe(x, y, t); },
  };
  return K;
}

/* ---------- monta a cidade nova (o que é comum a todas) ---------- */
function criaCidadeNova(c) {
  const b = new Construtor(c.id, c.nome, CN_W, CN_H, c.base, c.seed + 7);
  bordaInvisivel(b);
  const K = kitCidade(b, c);
  CIDADES_NOVAS[c.id](b, c, K);
  // nada solto dentro dos campos
  for (const cp of b.m.campos) for (let j = cp.y; j < cp.y + cp.h; j++) for (let x = cp.x; x < cp.x + cp.w; x++) { const o = b.m.obj[j * b.m.w + x]; if (o && o.t !== 'gol') b.m.obj[j * b.m.w + x] = null; }
  return b.m;
}

/* ============================================================
   CAIRO — o planalto de Gizé (Esfinge e pirâmides) a oeste, o NILO no meio com duas pontes
   e a cidade a leste: a Praça Tahrir no centro, o bazar de Khan el-Khalili, o estádio e o aeroporto.
   ============================================================ */
CIDADES_NOVAS.cairo = function (b, c, K) {
  const m = b.m, A = CH.AREIA, P = CH.PEDRA;
  /* --- o Nilo (x 27–33) e o calçadão da margem leste --- */
  K.chao(27, 1, 7, 72, CH.AGUA);
  K.chao(34, 1, 2, 72, P);
  K.rua(27, 18, 7, 4); K.rua(27, 50, 7, 4);            // as duas pontes
  /* --- ruas da cidade (leste) --- */
  K.rua(36, 2, 4, 70);                                  // avenida da beira-rio (Corniche)
  K.rua(36, 18, 62, 4); K.rua(36, 50, 62, 4);           // as avenidas das pontes
  K.rua(59, 2, 3, 70); K.rua(80, 2, 3, 70);             // ruas norte–sul
  K.rua(40, 34, 58, 3);                                 // rua do meio
  K.rua(62, 62, 18, 3);                                 // rua de trás do aeroporto
  /* --- quarteirões: calçada de pedra --- */
  for (const [x, y, w, h] of [[40, 2, 19, 16], [62, 2, 18, 16], [83, 2, 15, 16], [40, 22, 19, 12], [62, 22, 18, 12], [83, 22, 15, 12],
    [40, 37, 19, 13], [62, 37, 18, 13], [83, 37, 15, 13], [40, 54, 19, 18], [62, 54, 18, 8], [62, 65, 18, 7], [83, 54, 15, 18]]) K.chao(x, y, w, h, P);
  /* --- estrada do deserto até a Esfinge --- */
  K.rua(8, 18, 19, 4);
  for (let x = 10; x < 26; x += 5) { K.poe(x, 17, 'poste3'); K.poe(x + 2, 22, 'poste3'); }

  /* --- PLANALTO DE GIZÉ (noroeste): pirâmides, a Esfinge e a Tumba --- */
  objLargo(b, 8, 9, 'piramide', 5); objLargo(b, 17, 7, 'piramide', 5); objLargo(b, 23, 12, 'piramide', 5);
  K.mon('mon_esfinge', 13, 29);                          // a Grande Esfinge, de frente para a estrada
  K.caca('caca_tumba', 20, 26);
  for (const [x, y] of [[3, 3], [4, 15], [25, 3], [21, 24], [5, 25], [24, 30]]) K.poe(x, y, 'palmeira_tamara');
  for (const [x, y] of [[13, 13], [3, 20]]) K.poe(x, y, 'obelisco');
  K.caça(c.zagueiro, [[12, 4], [5, 14], [20, 15]], 3, 3);
  K.zona(2, 2, 24, 15, 'Planalto de Gizé');
  b.placa(7, 17, '🔺 PLANALTO DE GIZÉ — as pirâmides têm mais de 4.500 anos. Os Guardiões da Esfinge não deixam ninguém chegar perto!');
  /* --- DUNAS (oeste): os corredores das pirâmides --- */
  for (const [x, y] of [[4, 38], [15, 42], [23, 37], [9, 49], [20, 55], [4, 58], [14, 61], [24, 47]]) K.poe(x, y, 'duna');
  for (const [x, y] of [[11, 36], [22, 44], [6, 53], [17, 50]]) K.poe(x, y, 'palmeira_tamara');
  for (const [x, y] of [[18, 40], [8, 44]]) K.poe(x, y, 'camelo');
  objLargo(b, 12, 57, 'tenda_beduina', 3);
  K.caça(c.rapido, [[9, 40], [19, 47], [10, 55]], 4, 3);
  K.zona(2, 34, 24, 26, 'Dunas de Gizé');
  b.placa(25, 35, '🐪 DUNAS DE GIZÉ — os Corredores das Pirâmides treinam na areia fofa. Quem aguenta o ritmo?');
  /* --- o chefão: o oásis do sul --- */
  K.chao(6, 64, 8, 5, CH.GRAMA); K.chao(8, 65, 4, 3, CH.AGUA);
  for (const [x, y] of [[6, 64], [13, 64], [6, 68], [13, 68]]) K.poe(x, y, 'palmeira_tamara');
  b.spawn(c.chefe, 18, 66, 1, 1); b.placa(22, 63, `👑 OÁSIS DO FARAÓ — território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);

  /* --- JARDIM DOS PAPIROS (beira-rio, norte): os escribas do Nilo --- */
  K.chao(40, 2, 19, 16, CH.GRAMA);
  K.chao(41, 9, 17, 2, P); K.chao(48, 3, 2, 14, P);      // caminhos em cruz
  for (const [x, y] of [[42, 4], [45, 7], [53, 4], [56, 7], [42, 14], [45, 16], [53, 13], [56, 16]]) K.poe(x, y, x % 2 ? 'bambu' : 'palmeira_tamara');
  for (const [x, y] of [[44, 12], [52, 8], [55, 12]]) K.poe(x, y, 'jarros');
  K.caça(c.meia, [[44, 5], [54, 6], [50, 14]], 4, 2);
  K.zona(40, 2, 19, 16, 'Jardim dos Papiros');
  b.placa(41, 17, '📜 JARDIM DOS PAPIROS — no antigo Egito, o papel era feito com a planta papiro, que cresce na beira do Nilo.');
  /* --- ARQUIBANCADA NORTE (bairro dos fanáticos) --- */
  bairroHostil(b, 62, 2, 18, 15, c.zona, c.fanatico, 8);
  b.placa(63, 17, `${c.zona.toUpperCase()} — cuidado: os fanáticos andam em grupo`);
  /* --- o estádio (nordeste) --- */
  K.estadio(90, 15);

  /* --- PRAÇA TAHRIR (centro): lojas, missões e a fonte --- */
  K.praca(62, 22, 18, 12, CH.CALCADA, { fonte: 'chafariz', arvore: 'palmeira_tamara' });
  b.npc('loja_' + c.id, 65, 27); b.obj(64, 26, 'tenda_mercado'); b.obj(66, 26, 'jarros');
  b.npc('lider_' + c.id, 76, 27); b.obj(77, 26, 'banca');
  b.npc('quadro', 71, 31);
  b.placa(63, 32, '⭐ PRAÇA TAHRIR — o coração do Cairo. Aqui ficam a loja, a treinadora do bairro e o quadro de desafios.');
  /* --- prédios --- */
  K.quintal(41, 23, 17, 3); K.quintal(63, 38, 16, 4);
  K.fila(40, 58, 32);                                    // de frente para a rua do meio
  K.fila(83, 97, 32, { max: 2 });
  K.fila(83, 97, 48, { max: 2 });
  K.fila(40, 58, 70, { max: 3 });
  K.fila(62, 79, 60, { max: 3 });
  K.fila(62, 79, 70, { max: 3 });
  // as 3 casas à venda: na rua de trás do aeroporto (as mais perto da chegada)
  m.casasLote = K.fila(62, 79, 47, { w: 5, max: 3, sprs: ['b_cairo5', 'b_cairo2', 'b_cairo6'], gap: 1 });
  /* --- o bazar de Khan el-Khalili (entrada do bazar coberto) --- */
  K.caca('caca_bazar', 88, 24);
  for (const [x, y] of [[84, 25], [95, 25], [85, 29]]) K.poe(x, y, 'tenda_mercado');
  for (const [x, y] of [[84, 27], [96, 28]]) K.poe(x, y, 'lanterna_arabe');
  /* --- centro de treino (sul do rio) --- */
  K.ct(42, 40);
  /* --- AEROPORTO (sudeste) e o largo da chegada --- */
  b.predio('b_aeroporto', 86, 56, 8, 4); b.npc('comissaria', 88, 61);
  m.inicio = { x: 90, y: 62 }; m.renasce = { x: 91, y: 62 };
  K.chao(83, 60, 15, 12, CH.CALCADA);
  for (const [x, y] of [[84, 60], [97, 60], [84, 70], [97, 70]]) K.poe(x, y, 'palmeira_tamara');
  /* --- campo do bairro (sudoeste da cidade) --- */
  b.campo(42, 55, 15, 9, CH.CAMPO);
  for (const x of [42, 56]) K.poe(x, 68, 'poste3');
  /* --- a beira-rio: palmeiras no calçadão --- */
  for (let y = 4; y < 72; y += 6) if (y < 16 || y > 23) if (y < 48 || y > 55) K.poe(34, y, 'palmeira_tamara');
  K.quintal(84, 38, 13, 3);
};

/* ============================================================
   DOHA — o deserto a oeste (oásis e dunas), a cidade no meio (as torres de West Bay, o Souq
   Waqif, o estádio) e a BAÍA do Corniche a leste, em meia-lua, com o Museu de Arte Islâmica
   numa ilha ligada por uma passarela.
   ============================================================ */
CIDADES_NOVAS.doha = function (b, c, K) {
  const m = b.m, C = CH.CALCADA;
  const praia = y => 70 + Math.round(12 * ((y - 37) / 37) ** 2); // onde começa o mar em cada linha
  /* --- a baía, o parque do Corniche e a ilha do museu --- */
  for (let y = 1; y < 73; y++) { const xs = praia(y); K.chao(66, y, xs - 66, 1, CH.GRAMA); K.chao(xs - 2, y, 2, 1, C); K.chao(xs, y, 99 - xs, 1, CH.AGUA); }
  K.chao(84, 57, 12, 12, C); K.chao(praia(62), 62, 84 - praia(62), 2, C);
  for (const [x, y] of [[84, 57], [95, 57], [84, 68], [95, 68], [86, 60], [93, 60]]) K.poe(x, y, 'palmeira_real');
  K.mon('mon_doha', 90, 66);
  /* --- ruas --- */
  K.rua(22, 2, 4, 70); K.rua(42, 2, 3, 70); K.rua(62, 2, 4, 70);
  K.rua(26, 16, 36, 4); K.rua(8, 40, 54, 4); K.rua(26, 28, 36, 3); K.rua(26, 56, 36, 3);
  for (const [x, y, w, h] of [[26, 2, 16, 14], [45, 2, 17, 14], [26, 20, 16, 8], [45, 20, 17, 8], [26, 31, 16, 9], [45, 31, 17, 9], [26, 44, 16, 12], [45, 44, 17, 12], [26, 59, 16, 13], [45, 59, 17, 13]]) K.chao(x, y, w, h, C);
  /* --- OÁSIS (noroeste): as sentinelas e a entrada do Oásis das Dunas --- */
  K.chao(3, 3, 18, 12, CH.GRAMA); K.chao(8, 6, 6, 4, CH.AGUA);
  for (const [x, y] of [[4, 4], [7, 11], [15, 4], [19, 8], [4, 13], [16, 13], [11, 12]]) K.poe(x, y, 'palmeira_tamara');
  K.caca('caca_oasis', 15, 9);
  K.caça(c.zagueiro, [[5, 8], [12, 4], [5, 13]], 3, 2);
  K.zona(3, 3, 18, 12, 'Oásis do Deserto');
  /* --- DUNAS DOURADAS (oeste) --- */
  for (const [x, y] of [[4, 20], [17, 30], [6, 34], [15, 47], [4, 52], [19, 55], [10, 28], [12, 38]]) K.poe(x, y, 'duna');
  objLargo(b, 9, 45, 'tenda_beduina', 3); K.poe(13, 45, 'camelo'); K.poe(5, 25, 'camelo');
  K.caça(c.rapido, [[8, 24], [16, 36], [8, 50]], 4, 3);
  K.zona(2, 18, 20, 21, c.zona); K.zona(2, 44, 20, 13, c.zona);
  b.placa(21, 37, `🐪 ${c.zona.toUpperCase()} — o vento do deserto corre mais que todo mundo por aqui!`);
  /* --- a falcoaria (sudoeste): o chefão --- */
  objLargo(b, 6, 62, 'tenda_beduina', 3); K.poe(4, 68, 'palmeira_tamara'); K.poe(19, 61, 'palmeira_tamara');
  b.spawn(c.chefe, 12, 66, 1, 1); b.placa(16, 60, `🦅 FALCOARIA — território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);
  /* --- WEST BAY: as torres (norte) --- */
  K.quintal(27, 3, 14, 3); K.quintal(46, 3, 15, 3);
  K.fila(26, 41, 14, { sprs: ['b_doha4', 'b_doha1', 'b_doha6'] }); K.fila(45, 61, 14, { sprs: ['b_doha6', 'b_doha4', 'b_doha2'] });
  K.fila(26, 41, 26);
  /* --- PRAÇA DO CORNICHE (centro): lojas e missões --- */
  K.praca(45, 20, 17, 8, CH.PEDRA, { fonte: 'fonte_moderna', arvore: 'palmeira_real' });
  b.npc('loja_' + c.id, 48, 23); b.obj(47, 22, 'lanterna_arabe'); b.obj(49, 22, 'palmeira_real');
  b.npc('lider_' + c.id, 58, 23); b.npc('quadro', 53, 26);
  b.placa(46, 26, '⭐ PRAÇA DO CORNICHE — a loja, a capitã da seleção e o quadro de desafios ficam aqui.');
  /* --- estádio e centro de treino --- */
  K.estadio(34, 38); K.ct(46, 32);
  /* --- SOUQ WAQIF: o mercado antigo --- */
  K.chao(45, 44, 17, 6, CH.ARENITO);
  for (const [x, y, t] of [[46, 45, 'tenda_mercado'], [50, 45, 'pilha_especiarias'], [54, 45, 'tenda_mercado'], [58, 45, 'arara_tapetes'], [48, 48, 'lanterna_arabe'], [56, 48, 'lanterna_arabe'], [52, 48, 'jarros']]) K.poe(x, y, t);
  K.fila(45, 61, 54, { sprs: ['b_doha5', 'b_doha2', 'b_doha3'] });
  b.placa(44, 47, '🏺 SOUQ WAQIF — o mercado mais antigo de Doha: especiarias, tapetes e lamparinas.');
  /* --- casas à venda e o bairro do sul --- */
  K.quintal(27, 45, 14, 4); m.casasLote = K.fila(26, 41, 54, { w: 5, max: 3, gap: 0, sprs: ['b_doha3', 'b_doha5', 'b_doha6'] });
  K.quintal(27, 60, 14, 4); K.fila(26, 41, 70);
  /* --- AEROPORTO (sul) --- */
  b.predio('b_aeroporto', 49, 60, 8, 4); b.npc('comissaria', 51, 65);
  m.inicio = { x: 53, y: 66 }; m.renasce = { x: 54, y: 66 };
  /* --- JARDIM DO CORNICHE: as magas da miragem e o palácio --- */
  K.caça(c.meia, [[72, 6], [68, 22], [72, 70]], 4, 2);
  K.caca('caca_miragem', 71, 12);
  for (let y = 4; y < 71; y += 5) K.poe(praia(y) - 3, y, 'palmeira_real');
  K.zona(66, 2, 14, 70, 'Jardim do Corniche');
  b.placa(66, 30, '🌴 CORNICHE — o calçadão da baía de Doha tem 7 km. Cuidado com as Magas da Miragem!');
};

/* ============================================================
   TÓQUIO — o Jardim Zen com o lago (oeste), Asakusa com o portal torii (norte), a Torre de
   Tóquio, a praça do cruzamento mais movimentado do mundo, o bairro neon, e do outro lado do
   rio Sumida o bairro do sumô (Ryogoku) e o templo do Sensei.
   ============================================================ */
CIDADES_NOVAS.toquio = function (b, c, K) {
  const m = b.m, C = CH.CALCADA, P = CH.PEDRA;
  /* --- rio Sumida e as pontes --- */
  K.chao(78, 1, 6, 72, CH.AGUA);
  K.rua(20, 20, 78, 4); K.rua(2, 50, 96, 4);
  /* --- ruas --- */
  K.rua(20, 24, 3, 48); K.rua(40, 2, 4, 70); K.rua(60, 2, 3, 70);
  K.rua(2, 36, 76, 3);
  /* --- JARDIM ZEN (oeste): lago, cerejeiras e os ninjas --- */
  K.chao(2, 2, 18, 34, CH.GRAMA); K.chao(2, 24, 18, 2, CH.TERRA); K.chao(10, 2, 2, 34, CH.TERRA); K.chao(5, 12, 11, 10, CH.GRAMA); K.chao(6, 14, 9, 6, CH.AGUA);
  K.chao(4, 11, 13, 1, CH.TERRA); K.chao(4, 22, 13, 1, CH.TERRA); K.chao(4, 11, 1, 12, CH.TERRA); K.chao(16, 11, 1, 12, CH.TERRA); // o caminho dá a volta no lago
  for (const [x, y] of [[3, 4], [16, 3], [5, 11], [17, 12], [4, 21], [16, 21], [3, 30], [15, 33], [7, 28]]) K.poe(x, y, 'cerejeira');
  for (const [x, y] of [[5, 13], [15, 13], [5, 20], [15, 20], [13, 27]]) K.poe(x, y, 'lanterna_pedra');
  for (const [x, y] of [[18, 6], [18, 29], [2, 16]]) K.poe(x, y, 'bambu');
  K.caca('caca_bambu', 13, 6);
  K.caça(c.rapido, [[5, 6], [18, 17], [6, 32]], 4, 2);
  K.zona(2, 2, 18, 34, c.zona);
  b.placa(19, 26, `🌸 ${c.zona.toUpperCase()} — os Ninjas da Linha de Fundo treinam entre as cerejeiras.`);
  /* --- ASAKUSA (norte): o portal torii, os templos e as mestras do origami --- */
  K.chao(23, 2, 17, 18, P); K.chao(44, 2, 16, 18, P);
  K.fila(23, 39, 10, { max: 2, sprs: ['b_toquio2', 'b_toquio6', 'b_toquio4'] }); K.fila(44, 59, 10, { max: 2, sprs: ['b_toquio6', 'b_toquio2', 'b_toquio4'] });
  objLargo(b, 31, 18, 'torii', 3);
  for (const [x, y] of [[25, 13], [37, 13], [46, 13], [57, 13], [25, 18], [57, 18]]) K.poe(x, y, 'lanterna_papel');
  K.caça(c.meia, [[29, 15], [51, 15]], 5, 2);
  K.zona(23, 11, 37, 9, 'Asakusa');
  b.placa(24, 19, '⛩️ ASAKUSA — o bairro dos templos antigos. As Mestras do Origami dobram papel... e dribles!');
  /* --- a Torre de Tóquio --- */
  K.chao(63, 2, 15, 18, C); K.mon('mon_toquio', 70, 16);
  for (const [x, y] of [[64, 4], [76, 4], [64, 18], [76, 18]]) K.poe(x, y, 'cerejeira');
  /* --- PRAÇA DO CRUZAMENTO (centro): lojas e missões --- */
  K.praca(23, 24, 17, 12, P, { arvore: 'cerejeira' });
  b.npc('loja_' + c.id, 26, 28); b.obj(25, 27, 'lanterna_pedra'); b.obj(27, 27, 'maneki');
  b.npc('lider_' + c.id, 36, 28); b.npc('quadro', 31, 33); K.poe(31, 29, 'maneki');
  b.placa(24, 34, '⭐ PRAÇA DO CRUZAMENTO — o cruzamento mais movimentado do mundo fica aqui do lado! Loja, Mestre Kenji e o quadro de desafios.');
  /* --- bairro NEON e prédios --- */
  K.quintal(45, 25, 14, 3); K.fila(44, 59, 34, { sprs: ['b_toquio3', 'b_toquio1', 'b_toquio5'] });
  K.quintal(64, 25, 13, 3); K.fila(63, 77, 34, { sprs: ['b_toquio5', 'b_toquio3', 'b_toquio1'] });
  /* --- centro de treino, casas, estádio --- */
  K.ct(3, 41);
  K.quintal(24, 40, 15, 3); m.casasLote = K.fila(23, 39, 48, { w: 5, max: 3, sprs: ['b_toquio4', 'b_toquio2', 'b_toquio6'] });
  K.estadio(52, 48);
  K.quintal(64, 40, 13, 3); K.fila(63, 77, 48);
  /* --- sul: prédios, campo e o aeroporto --- */
  K.fila(2, 19, 62); K.fila(2, 19, 70);
  b.campo(24, 56, 15, 9, CH.CAMPO);
  b.predio('b_aeroporto', 48, 56, 8, 4); b.npc('comissaria', 50, 61);
  m.inicio = { x: 52, y: 62 }; m.renasce = { x: 53, y: 62 };
  K.fila(63, 77, 62); K.fila(63, 77, 70);
  /* --- RYOGOKU (do outro lado do rio): o bairro do sumô --- */
  K.chao(84, 2, 14, 18, P); K.chao(84, 24, 14, 26, CH.AREIA);
  K.caca('caca_dojo', 89, 8);
  for (const [x, y] of [[85, 4], [96, 4], [85, 14], [96, 14]]) K.poe(x, y, 'lanterna_papel');
  for (const [x, y] of [[86, 30], [95, 40], [86, 46]]) K.poe(x, y, 'taiko');
  K.caça(c.zagueiro, [[91, 15], [90, 31], [90, 44]], 3, 3);
  K.zona(84, 2, 14, 48, 'Ryogoku — Bairro do Sumô');
  b.placa(85, 19, '🥋 RYOGOKU — o bairro do sumô. Os lutadores treinam na areia e no Grande Dojo!');
  /* --- o templo do Sensei (sudeste) --- */
  K.chao(84, 54, 14, 18, P);
  objLargo(b, 90, 57, 'torii', 3);
  for (const [x, y] of [[85, 56], [96, 56], [85, 70], [96, 70]]) K.poe(x, y, 'cerejeira');
  b.spawn(c.chefe, 91, 64, 1, 1); b.placa(86, 58, `⛩️ TEMPLO DO SENSEI — território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);
};

/* ============================================================
   MIAMI — Wynwood (os muros pintados) e os Everglades a oeste, o centro com a Freedom Tower,
   a Ocean Drive, o calçadão, a PRAIA (surfistas), a Muscle Beach e o palco no píer.
   ============================================================ */
CIDADES_NOVAS.miami = function (b, c, K) {
  const m = b.m, C = CH.CALCADA;
  /* --- mar, praia, calçadão e a Ocean Drive --- */
  K.chao(89, 1, 10, 72, CH.AGUA); K.chao(77, 1, 12, 72, CH.AREIA); K.chao(86, 1, 3, 72, CH.AREIA_MOLHADA);
  K.chao(74, 1, 3, 72, CH.CALCADA_PT);
  K.rua(70, 2, 4, 70);
  /* --- ruas --- */
  K.rua(24, 2, 3, 70); K.rua(46, 2, 4, 70);
  K.rua(2, 18, 68, 4); K.rua(2, 36, 68, 3); K.rua(2, 52, 68, 4);
  for (const [x, y, w, h] of [[27, 2, 19, 16], [50, 2, 20, 16], [27, 22, 19, 14], [50, 22, 20, 14], [2, 39, 22, 13], [27, 39, 19, 13], [50, 39, 20, 13], [2, 56, 22, 16], [27, 56, 19, 16], [50, 56, 20, 16]]) K.chao(x, y, w, h, C);
  /* --- WYNWOOD (noroeste): muros pintados e as estrelas de TV --- */
  K.chao(2, 2, 22, 16, CH.CONCRETO);
  for (let x = 3; x < 23; x++) if (x < 11 || x > 14) b.obj(x, 2, 'grafite');
  for (let y = 3; y < 17; y++) if (y < 8 || y > 11) b.obj(2, y, 'grafite');
  for (let x = 6; x < 20; x++) if (x < 11 || x > 13) b.obj(x, 9, 'grafite'); // um muro pintado no meio do bairro
  objLargo(b, 9, 13, 'food_truck', 3); K.poe(17, 6, 'neon_palmeira'); K.poe(19, 14, 'carro_retro');
  K.caça(c.meia, [[6, 5], [17, 12], [5, 15]], 4, 2);
  K.zona(2, 2, 22, 16, 'Wynwood — Muros Pintados');
  b.placa(23, 16, '🎨 WYNWOOD — o bairro dos muros grafitados. As Estrelas de TV gravam aqui!');
  /* --- EVERGLADES (oeste): o pântano --- */
  K.chao(2, 22, 22, 14, CH.LODO); K.chao(4, 24, 5, 3, CH.AGUA); K.chao(15, 30, 6, 3, CH.AGUA); K.chao(2, 27, 22, 2, CH.GRAMA);
  for (const [x, y] of [[3, 33], [12, 23], [21, 25], [10, 34]]) K.poe(x, y, 'mangueira');
  for (const [x, y] of [[9, 25], [14, 29], [20, 34]]) K.poe(x, y, 'flamingo');
  K.caca('caca_pantano', 10, 30);
  K.zona(2, 22, 22, 14, 'Everglades');
  /* --- prédios do norte --- */
  K.quintal(28, 3, 17, 3); K.fila(27, 45, 16, { sprs: ['b_miami3', 'b_miami1', 'b_miami6'] });
  K.quintal(51, 3, 18, 3); K.fila(50, 69, 16, { sprs: ['b_miami4', 'b_miami2', 'b_miami3'] });
  /* --- BAYFRONT: praça das lojas --- */
  K.praca(27, 22, 19, 14, CH.PEDRA, { fonte: 'fonte_moderna', arvore: 'palmeira_real' });
  b.npc('loja_' + c.id, 30, 26); b.obj(31, 25, 'food_truck'); b.obj(29, 25, 'flamingo');
  b.npc('lider_' + c.id, 42, 26); b.npc('quadro', 36, 33);
  b.npc('johnny', 30, 31); b.npc('barao', 42, 31); b.obj(32, 31, 'carro_retro'); b.obj(44, 31, 'carro_luxo');
  b.placa(28, 34, '⭐ BAYFRONT PARK — loja, a Coach Sofia, o quadro de desafios e as montarias de luxo.');
  /* --- a Freedom Tower --- */
  K.chao(50, 22, 20, 14, CH.PEDRA); K.mon('mon_miami', 59, 33);
  for (const [x, y] of [[51, 23], [68, 23], [51, 34], [68, 34]]) K.poe(x, y, 'palmeira_real');
  /* --- estádio, centro de treino e prédios --- */
  K.estadio(11, 49); K.ct(29, 42);
  K.quintal(51, 40, 18, 3); K.fila(50, 69, 50);
  K.quintal(3, 57, 20, 2); K.fila(2, 23, 62); K.fila(2, 23, 70);
  m.casasLote = K.fila(27, 45, 62, { w: 5, max: 3, sprs: ['b_miami5', 'b_miami2', 'b_miami6'] }); K.fila(27, 45, 70);
  /* --- AEROPORTO --- */
  b.predio('b_aeroporto', 56, 57, 8, 4); b.npc('comissaria', 58, 62);
  m.inicio = { x: 60, y: 63 }; m.renasce = { x: 61, y: 63 };
  /* --- a PRAIA: o calçadão neon e os surfistas --- */
  for (let y = 4; y < 72; y += 6) { K.poe(75, y, 'neon_palmeira'); }
  for (const [x, y] of [[85, 12], [85, 40]]) objLargo(b, x, y, 'torre_salva', 1);
  for (const [x, y, t] of [[80, 24, 'guarda_sol'], [81, 25, 'cadeira_sol'], [79, 38, 'guarda_sol'], [80, 39, 'cadeira_sol'], [83, 29, 'prancha'], [79, 14, 'cadeira_sol']]) K.poe(x, y, t);
  K.caça(c.rapido, [[82, 18], [82, 32], [82, 46]], 4, 3);
  K.zona(74, 14, 15, 36, c.zona);
  b.placa(77, 13, `🏄 ${c.zona.toUpperCase()} — os Surfistas Velozes correm na areia!`);
  /* --- MUSCLE BEACH (sul da praia): os fisiculturistas e a academia --- */
  K.caca('caca_academia', 79, 56);
  for (const [x, y, t] of [[78, 62, 'rack_halteres'], [84, 58, 'barra_fixa'], [78, 69, 'pneu_gigante'], [85, 65, 'supino']]) K.poe(x, y, t);
  K.caça(c.zagueiro, [[81, 63], [84, 69]], 3, 2);
  K.zona(77, 54, 12, 18, 'Muscle Beach');
  b.placa(77, 53, '💪 MUSCLE BEACH — a academia ao ar livre mais famosa da praia.');
  /* --- o PÍER (norte): o palco do chefão --- */
  K.chao(80, 3, 18, 7, CH.MADEIRA);
  for (const x of [80, 97]) { K.poe(x, 3, 'poste3'); K.poe(x, 9, 'poste3'); }
  b.spawn(c.chefe, 92, 6, 1, 1); b.placa(78, 6, `🎤 PALCO DO PÍER — território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);
};

/* ============================================================
   BUENOS AIRES — o Parque Lezama (oeste), a Avenida 9 de Julho com o Obelisco no canteiro do
   meio, a Bombonera e o bairro da torcida, a feira de San Telmo, o Caminito colorido e, no
   sul, o porto de La Boca na beira do Riachuelo.
   ============================================================ */
CIDADES_NOVAS.buenos = function (b, c, K) {
  const m = b.m, P = CH.PEDRA, B = CH.PARALELO;
  /* --- o Riachuelo e o cais --- */
  K.chao(1, 63, 98, 10, CH.AGUA); K.chao(1, 60, 98, 3, CH.CONCRETO);
  for (const x of [8, 34, 62, 94]) b.obj(x, 61, 'guindaste_porto');
  /* --- a Avenida 9 de Julho: canteiro largo no meio, com o Obelisco --- */
  K.chao(44, 2, 8, 58, CH.GRAMA); K.chao(47, 2, 2, 58, P); K.chao(44, 21, 8, 10, P);
  K.mon('mon_obelisco', 48, 27);
  for (let y = 4; y < 58; y += 5) if (y < 20 || y > 31) { K.poe(45, y, 'arvore'); K.poe(50, y, 'arvore'); }
  /* --- ruas --- */
  K.rua(18, 2, 3, 58); K.rua(40, 2, 4, 58); K.rua(52, 2, 4, 58); K.rua(74, 2, 3, 58);
  K.rua(18, 16, 80, 4); K.rua(2, 32, 96, 3); K.rua(2, 46, 96, 4);
  for (const [x, y, w, h] of [[21, 2, 19, 14], [21, 20, 19, 12], [56, 20, 18, 12], [21, 35, 19, 11], [56, 35, 18, 11], [21, 50, 19, 10], [56, 50, 18, 10]]) K.chao(x, y, w, h, B);
  /* --- PARQUE LEZAMA (oeste): os caudilhos e a Cratera --- */
  K.chao(2, 2, 16, 30, CH.GRAMA); K.chao(2, 15, 16, 2, CH.TERRA); K.chao(9, 2, 2, 30, CH.TERRA);
  for (const [x, y] of [[3, 3], [15, 3], [4, 12], [16, 11], [3, 20], [15, 22], [4, 29], [16, 29], [12, 25]]) K.poe(x, y, 'arvore');
  K.caca('caca_cratera', 12, 7);
  K.caça(c.zagueiro, [[5, 7], [14, 20], [5, 25]], 3, 2);
  K.zona(2, 2, 16, 30, 'Parque Lezama');
  b.placa(17, 30, '🌳 PARQUE LEZAMA — os Caudilhos da Boca defendem o parque como se fosse a área deles!');
  /* --- norte: prédios, praça e a Bombonera --- */
  K.quintal(22, 3, 17, 3); K.fila(21, 39, 14);
  K.chao(56, 2, 18, 14, B); K.estadio(65, 13);
  bairroHostil(b, 77, 2, 21, 14, c.zona, c.fanatico, 8);
  b.placa(78, 17, `${c.zona.toUpperCase()} — cuidado: os fanáticos andam em grupo`);
  /* --- PLAZA DORREGO (centro): lojas e missões --- */
  K.praca(21, 20, 19, 12, P, { fonte: 'chafariz' });
  b.npc('loja_' + c.id, 24, 24); b.obj(23, 23, 'banca_empanada'); b.obj(25, 23, 'mesa_cafe');
  b.npc('lider_' + c.id, 36, 24); b.npc('quadro', 30, 29);
  b.placa(22, 30, '⭐ PLAZA DORREGO — empanadas, o Profe Martín e o quadro de desafios.');
  K.quintal(57, 21, 16, 3); K.fila(56, 73, 30);
  /* --- FEIRA DE SAN TELMO (leste) --- */
  K.chao(77, 20, 21, 12, P);
  for (const [x, y, t] of [[79, 21, 'banca_empanada'], [84, 21, 'banca'], [89, 21, 'carrinho_flores'], [94, 21, 'banca'], [81, 27, 'mesa_cafe'], [95, 27, 'mesa_cafe'], [88, 30, 'banca_livros']]) K.poe(x, y, t);
  K.caça(c.meia, [[80, 25], [92, 25], [87, 29]], 3, 2);
  K.zona(77, 20, 21, 12, 'Feira de San Telmo');
  b.placa(76, 21, '🎩 FEIRA DE SAN TELMO — antiguidades, tango na rua... e os Enganches Portenhos driblando entre as bancas.');
  /* --- centro de treino, casas e prédios --- */
  K.ct(2, 37);
  K.quintal(22, 36, 17, 3); m.casasLote = K.fila(21, 39, 44, { w: 5, max: 3, sprs: ['b_buenos6', 'b_buenos3', 'b_buenos5'] });
  K.quintal(57, 36, 16, 3); K.fila(56, 73, 44);
  /* --- CAMINITO (sudeste): a rua mais colorida do mundo --- */
  K.chao(77, 35, 21, 11, P);
  K.fila(77, 97, 39, { sprs: ['b_buenos3', 'b_buenos1', 'b_buenos4', 'b_buenos2'] });
  for (const x of [79, 88, 95]) K.poe(x, 44, 'mural_tango');
  K.caça(c.rapido, [[82, 42], [92, 42]], 4, 2);
  K.zona(77, 40, 21, 6, 'Caminito');
  b.placa(76, 43, '🎨 CAMINITO — as casas de lata pintadas com as sobras de tinta dos barcos. Os Pibes correm por aqui!');
  /* --- a milonga (sudoeste): o chefão --- */
  K.chao(2, 50, 16, 10, P); objLargo(b, 9, 52, 'estatua_tango', 3);
  for (const [x, y] of [[3, 51], [16, 51], [4, 58]]) K.poe(x, y, 'mesa_cafe');
  b.spawn(c.chefe, 10, 56, 1, 1); b.placa(17, 55, `💃 MILONGA DA VUELTA DE ROCHA — território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);
  /* --- AEROPARQUE (na beira do rio) --- */
  b.predio('b_aeroporto', 25, 50, 8, 4); b.npc('comissaria', 27, 55);
  m.inicio = { x: 29, y: 56 }; m.renasce = { x: 30, y: 56 };
  K.fila(56, 73, 58);
  /* --- o porto de La Boca: o estaleiro --- */
  K.chao(77, 50, 21, 10, CH.CONCRETO);
  K.caca('caca_estaleiro', 86, 52);
  for (const [x, y, t] of [[79, 52, 'casco_barco'], [95, 52, 'barris'], [80, 57, 'corda_ancora'], [94, 57, 'caixotes_porto'], [90, 58, 'barris']]) K.poe(x, y, t);
  K.caça(c.rapido, [[84, 57]], 3, 2);
  b.placa(77, 49, '⚓ LA BOCA — o bairro nasceu no porto do Riachuelo, onde os imigrantes chegavam de navio.');
};

/* ============================================================
   RIO DE JANEIRO — a Floresta da Tijuca com o Cristo (noroeste), a Lapa com os Arcos, o
   Maracanã e a Geral, o Aterro do Flamengo, e no sul a Avenida Atlântica, o calçadão de ondas,
   a praia de Copacabana e o Pão de Açúcar.
   ============================================================ */
CIDADES_NOVAS.rio = function (b, c, K) {
  const m = b.m, C = CH.CALCADA, P = CH.PEDRA;
  /* --- mar, praia e calçadão --- */
  K.chao(1, 67, 98, 6, CH.AGUA); K.chao(1, 58, 98, 7, CH.AREIA); K.chao(1, 65, 98, 2, CH.AREIA_MOLHADA);
  K.chao(1, 55, 98, 3, CH.CALCADA_PT);
  /* --- ruas --- */
  K.rua(2, 27, 96, 4); K.rua(2, 40, 76, 3); K.rua(2, 51, 96, 4);
  K.rua(31, 2, 3, 49); K.rua(54, 2, 4, 49); K.rua(76, 2, 3, 49);
  /* --- FLORESTA DA TIJUCA e o CRISTO (noroeste) --- */
  K.chao(2, 2, 29, 25, CH.GRAMA); K.chao(14, 15, 3, 12, CH.TERRA);
  K.mon('mon_cristo', 16, 14);
  for (const [x, y] of [[3, 3], [8, 5], [26, 3], [29, 8], [3, 12], [6, 19], [27, 16], [4, 25], [10, 23], [22, 25], [29, 22], [21, 5]]) K.poe(x, y, (x + y) % 3 ? 'arvore' : 'mangueira');
  K.caca('caca_cristal', 23, 19);
  K.zona(2, 2, 29, 25, 'Floresta da Tijuca');
  /* --- LAPA: os Arcos, os sobrados e o barracão da escola de samba --- */
  K.chao(34, 2, 20, 25, P);
  K.fila(34, 53, 8, { max: 3, sprs: ['b_rio3', 'b_rio5', 'b_rio1'] });
  objLargo(b, 43, 13, 'arcos_lapa', 7);
  K.caca('caca_barracao', 41, 22);
  K.caça(c.meia, [[37, 18], [50, 18]], 4, 2);
  K.zona(34, 14, 20, 13, 'Lapa');
  b.placa(35, 24, '🎭 LAPA — os Arcos eram um aqueduto que levava água para a cidade. Hoje é o bairro do samba!');
  /* --- MARACANÃ e o território do Rei --- */
  K.chao(58, 2, 18, 25, C); K.estadio(67, 12);
  K.chao(59, 15, 16, 11, P);
  b.spawn(c.chefe, 66, 21, 1, 1); b.placa(60, 25, `👑 ESPLANADA DO MARACANÃ — território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);
  /* --- a GERAL (nordeste) --- */
  bairroHostil(b, 79, 2, 19, 14, c.zona, c.fanatico, 8);
  b.placa(80, 17, `${c.zona.toUpperCase()} — cuidado: os fanáticos andam em grupo`);
  K.chao(79, 18, 19, 9, C); K.fila(79, 97, 25);
  /* --- centro de treino e a entrada do Vale --- */
  K.chao(2, 31, 29, 9, C); K.ct(4, 32); K.caca('vale_celeste', 24, 33);
  /* --- PRAÇA TIRADENTES (centro): lojas e missões --- */
  K.praca(34, 31, 20, 9, P, { fonte: 'chafariz', arvore: 'coqueiro' });
  b.npc('loja_' + c.id, 37, 34); b.obj(36, 33, 'carrinho_mate'); b.obj(38, 33, 'guarda_sol');
  b.npc('lider_' + c.id, 50, 34); b.npc('quadro', 44, 37);
  b.placa(35, 38, '⭐ PRAÇA TIRADENTES — o mate do Seu Tião, a Dona Glória e o quadro de desafios.');
  K.chao(58, 31, 18, 9, C); K.fila(58, 75, 38);
  /* --- ATERRO DO FLAMENGO (leste): os leões do calçadão --- */
  K.chao(79, 31, 19, 20, CH.GRAMA); K.chao(79, 40, 19, 2, CH.TERRA);
  for (const [x, y] of [[80, 32], [96, 32], [88, 36], [80, 48], [96, 48], [89, 45]]) K.poe(x, y, (x + y) % 2 ? 'coqueiro' : 'arvore');
  K.caça(c.zagueiro, [[84, 35], [93, 37], [85, 46]], 3, 2);
  K.zona(79, 31, 19, 20, 'Aterro do Flamengo');
  b.placa(78, 43, '🌳 ATERRO DO FLAMENGO — o maior parque na beira da baía. Os Leões do Calçadão treinam aqui.');
  /* --- AEROPORTO SANTOS DUMONT, casas e prédios --- */
  K.chao(2, 43, 29, 8, C);
  b.predio('b_aeroporto', 4, 43, 8, 4); b.npc('comissaria', 10, 48);
  m.inicio = { x: 14, y: 48 }; m.renasce = { x: 15, y: 48 };
  K.chao(34, 43, 20, 8, C); m.casasLote = K.fila(34, 53, 49, { w: 5, max: 3, sprs: ['b_rio2', 'b_rio6', 'b_rio4'] });
  K.chao(58, 43, 18, 8, C); K.fila(58, 75, 49);
  /* --- COPACABANA: a praia --- */
  for (let x = 4; x < 97; x += 7) K.poe(x, 55, 'coqueiro');
  for (const [x, y, t] of [[20, 58, 'quiosque'], [44, 58, 'quiosque'], [64, 58, 'quiosque'], [25, 62, 'guarda_sol'], [26, 63, 'cadeira_praia'], [40, 63, 'guarda_sol'], [58, 62, 'guarda_sol'], [59, 63, 'cadeira_praia'], [78, 62, 'guarda_sol']]) K.poe(x, y, t);
  K.caça(c.rapido, [[32, 61], [52, 61], [72, 61]], 4, 3);
  K.zona(22, 58, 60, 7, 'Praia de Copacabana');
  b.placa(30, 57, '🏖️ COPACABANA — o calçadão de ondas pretas e brancas foi inspirado nas calçadas de Lisboa!');
  K.mon('mon_paodeacucar', 91, 64);
  // a Capitã Iara (submarino) e a Dra. Estela (foguete) ficam na areia, perto do aeroporto
  b.npc('capita_iara', 6, 60); b.npc('estela', 14, 60);
};

/* ============================================================
   LISBOA — Belém com a Torre e a caravela (oeste), o Chiado, o Rossio, o Estádio da Luz e o
   bairro da Claque, Alfama com os elétricos (leste) e, na beira do Tejo, a Praça do Comércio
   e o Cais das Colunas.
   ============================================================ */
CIDADES_NOVAS.lisboa = function (b, c, K) {
  const m = b.m, C = CH.CALCADA_PT, P = CH.PEDRA;
  /* --- o Tejo e a beira-rio --- */
  K.chao(1, 62, 98, 11, CH.AGUA); K.chao(1, 54, 98, 8, P);
  /* --- ruas --- */
  K.rua(2, 16, 96, 4); K.rua(2, 33, 96, 3); K.rua(2, 50, 96, 4);
  K.rua(22, 2, 3, 48); K.rua(46, 2, 4, 48); K.rua(72, 2, 3, 48);
  /* --- BELÉM (sudoeste): a Torre, o jardim e a caravela --- */
  K.mon('mon_belem', 7, 60);
  K.chao(2, 36, 20, 14, CH.GRAMA);
  for (const [x, y] of [[3, 37], [20, 37], [11, 42], [3, 48], [20, 48]]) K.poe(x, y, 'arvore');
  K.caça(c.zagueiro, [[6, 41], [16, 45]], 3, 2); K.caça(c.zagueiro, [[26, 58]], 3, 2);
  K.caca('caca_caravela', 15, 56);
  K.zona(2, 36, 20, 14, 'Jardim de Belém');
  b.placa(21, 42, '⚓ BELÉM — daqui partiram as caravelas das Grandes Navegações. Os Navegadores de Belém guardam o jardim!');
  /* --- CHIADO (norte): o largo e os médios do Chiado --- */
  K.chao(25, 2, 21, 14, P); K.fila(25, 45, 8, { max: 3 });
  K.caça(c.meia, [[29, 12], [41, 12]], 4, 2);
  K.zona(25, 9, 21, 7, 'Largo do Chiado');
  b.placa(26, 15, '☕ LARGO DO CHIADO — cafés antigos, livrarias... e os Médios do Chiado trocando passes.');
  K.quintal(51, 3, 20, 3); K.fila(50, 71, 14);
  /* --- CENTRO DE TREINO e casas (noroeste) --- */
  K.ct(4, 5);
  K.quintal(3, 21, 18, 3); m.casasLote = K.fila(2, 21, 31, { w: 5, max: 3, sprs: ['b_lisboa2', 'b_lisboa5', 'b_lisboa4'] });
  /* --- ROSSIO: lojas e missões --- */
  K.praca(25, 20, 21, 13, P, { fonte: 'chafariz' });
  b.npc('lojista_lisboa', 28, 24); b.obj(27, 23, 'mesa_cafe'); b.obj(29, 23, 'carrinho_flores');
  b.npc('lider_lisboa', 42, 24); b.npc('quadro', 35, 30);
  b.placa(26, 31, '⭐ ROSSIO — a pastelaria da Dona Amália, a Dona Fátima e o quadro de desafios.');
  /* --- ESTÁDIO DA LUZ e o bairro da Claque --- */
  K.estadio(61, 31);
  bairroHostil(b, 75, 2, 23, 14, 'Bairro da Claque', 'ultra_lisboa', 8);
  b.placa(76, 17, 'BAIRRO DA CLAQUE — cuidado: os fanáticos andam em grupo');
  /* --- ALFAMA (leste): ruas de pedra e os elétricos --- */
  K.chao(75, 20, 23, 30, CH.PARALELO);
  K.fila(75, 97, 24, { sprs: ['b_lisboa6', 'b_lisboa3', 'b_lisboa1'] });
  K.chao(75, 36, 23, 2, P);
  objLargo(b, 80, 36, 'bonde', 3); objLargo(b, 93, 36, 'bonde', 3);
  K.fila(75, 97, 49, { sprs: ['b_lisboa3', 'b_lisboa6', 'b_lisboa1'] });
  K.caça(c.rapido, [[80, 30], [92, 30], [86, 41]], 4, 2);
  K.zona(75, 25, 23, 18, 'Alfama');
  b.placa(74, 37, '🚋 ALFAMA — o bairro mais antigo de Lisboa: ladeiras, becos e o elétrico amarelo.');
  /* --- prédios e o AEROPORTO --- */
  K.quintal(26, 37, 19, 3); K.fila(25, 45, 48);
  b.predio('b_aeroporto', 56, 37, 8, 4); b.npc('comissaria', 58, 42);
  m.inicio = { x: 60, y: 43 }; m.renasce = { x: 61, y: 43 };
  /* --- PRAÇA DO COMÉRCIO e o Cais das Colunas (beira do Tejo) --- */
  K.chao(34, 54, 30, 8, CH.CALCADA);
  objLargo(b, 48, 56, 'chafariz', 3);
  for (const x of [35, 62]) { K.poe(x, 54, 'poste3'); K.poe(x, 61, 'poste3'); }
  b.spawn(c.chefe, 55, 59, 1, 1); b.placa(45, 60, `⚓ CAIS DAS COLUNAS — território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);
  /* --- o cais escondido (Alfama, na beira do rio) --- */
  K.caca('caca_cais', 86, 56);
  for (let x = 4; x < 97; x += 8) if (x < 30 || x > 66) K.poe(x, 61, 'poste3');
};
/* ============================================================
   PARIS — o rio SENA atravessando a cidade com a Île de la Cité (Notre-Dame) no meio.
   Margem norte: Montmartre dos artistas, o Arco do Triunfo, o Louvre, a praça das lojas, o
   Parque dos Príncipes. Margem sul: o Champ de Mars com a Torre Eiffel, o Jardim de
   Luxemburgo, a Bastilha e o aeroporto.
   ============================================================ */
CIDADES_NOVAS.paris = function (b, c, K) {
  const m = b.m, P = CH.PEDRA, C = CH.CALCADA;
  /* --- o Sena, os cais e a ilha --- */
  K.chao(1, 34, 98, 10, CH.AGUA); K.chao(1, 31, 98, 3, P); K.chao(1, 44, 98, 3, P);
  K.chao(44, 36, 17, 6, P); K.chao(51, 34, 2, 2, P); K.chao(51, 42, 2, 2, P); // a ilha e as pontes de pedestre
  K.mon('mon_notredame', 52, 41);
  /* --- ruas --- */
  K.rua(2, 14, 96, 4); K.rua(2, 27, 96, 4); K.rua(2, 47, 96, 4); K.rua(48, 60, 50, 3);
  K.rua(28, 2, 4, 70); K.rua(48, 2, 3, 25); K.rua(48, 51, 3, 21); K.rua(70, 2, 4, 70);
  /* --- MONTMARTRE (noroeste): a colina dos artistas --- */
  K.chao(2, 2, 26, 12, CH.GRAMA); K.chao(2, 7, 26, 1, CH.TERRA);
  K.fila(2, 27, 5, { max: 3, sprs: ['b_paris5', 'b_paris2', 'b_paris6'] });
  for (const [x, y] of [[4, 10], [11, 11], [19, 9], [25, 11]]) K.poe(x, y, 'cavalete');
  K.caca('caca_metro_paris', 14, 9);
  K.caça(c.meia, [[7, 10], [22, 10]], 4, 2);
  K.zona(2, 7, 26, 7, 'Montmartre');
  b.placa(27, 12, '🎨 MONTMARTRE — a colina dos pintores. As Artistas de Montmartre pintam... e driblam!');
  /* --- norte: prédios, o Arco, o Louvre e a praça --- */
  K.quintal(33, 3, 14, 3); K.fila(32, 47, 12, { sprs: ['b_paris3', 'b_paris1', 'b_paris4'] });
  K.quintal(52, 3, 17, 3); K.fila(51, 69, 12, { sprs: ['b_paris2', 'b_paris3', 'b_paris6'] });
  K.chao(2, 18, 26, 9, P); K.mon('mon_arco', 14, 25);
  K.chao(32, 18, 16, 9, C); K.mon('mon_louvre', 40, 25);
  K.praca(51, 18, 19, 9, P, { fonte: 'chafariz' });
  b.npc('loja_' + c.id, 54, 21); b.obj(53, 20, 'carrinho_crepe'); b.obj(55, 20, 'mesa_cafe');
  b.npc('lider_' + c.id, 66, 21); b.npc('quadro', 60, 24);
  b.placa(52, 25, '⭐ PLACE VENDÔME — croissants, o técnico Didier e o quadro de desafios.');
  /* --- o Parque dos Príncipes (nordeste) --- */
  K.chao(74, 2, 24, 12, C); K.estadio(84, 12);
  bairroHostil(b, 74, 18, 24, 9, c.zona, c.fanatico, 8);
  b.placa(75, 17, `${c.zona.toUpperCase()} — cuidado: os fanáticos andam em grupo`);
  /* --- os cais do Sena: os ciclistas --- */
  for (let x = 4; x < 97; x += 6) if (x < 26 || x > 33) if (x < 68 || x > 75) { K.poe(x, 31, 'banca_livros'); }
  K.caça(c.rapido, [[10, 45], [40, 45], [88, 45]], 4, 2);
  K.zona(2, 44, 96, 3, 'Cais do Sena');
  b.placa(20, 46, '🚲 CAIS DO SENA — os Ciclistas do Sena pedalam na beira do rio. As bancas de livros verdes estão aqui há 400 anos!');
  /* --- CHAMP DE MARS (sudoeste): a Torre Eiffel e o labirinto --- */
  K.chao(2, 51, 26, 21, CH.GRAMA); K.chao(13, 51, 3, 21, P); K.chao(2, 63, 26, 2, P);
  K.mon('mon_eiffel', 14, 58);
  for (const [x, y] of [[3, 52], [26, 52], [3, 61], [26, 61], [3, 70], [26, 70], [8, 67], [21, 67]]) K.poe(x, y, 'arvore');
  K.caca('caca_labirinto', 18, 67);
  K.caça(c.rapido, [[7, 55]], 3, 2);
  K.zona(2, 51, 26, 21, 'Champ de Mars');
  /* --- JARDIM DE LUXEMBURGO: o chefão --- */
  K.chao(32, 51, 16, 21, CH.GRAMA); K.chao(35, 58, 10, 8, P);
  objLargo(b, 40, 60, 'fonte_italiana', 3);
  for (const [x, y] of [[33, 52], [46, 52], [33, 70], [46, 70], [34, 56], [45, 56]]) K.poe(x, y, 'arvore');
  b.spawn(c.chefe, 40, 64, 1, 1); b.placa(36, 58, `👑 JARDIM DE LUXEMBURGO — território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);
  /* --- sul: centro de treino, casas, a Bastilha e o aeroporto --- */
  K.chao(51, 51, 19, 9, C); K.ct(53, 52);
  K.chao(51, 63, 19, 9, C); K.quintal(52, 64, 17, 2); m.casasLote = K.fila(51, 69, 70, { w: 5, max: 3, sprs: ['b_paris4', 'b_paris5', 'b_paris6'] });
  K.chao(74, 51, 24, 9, P); objLargo(b, 85, 53, 'coluna_palacio', 1);
  K.caça(c.zagueiro, [[79, 56], [92, 56]], 3, 2);
  K.zona(74, 51, 24, 9, 'Praça da Bastilha');
  b.placa(75, 52, '🏰 PRAÇA DA BASTILHA — os Guardas da Bastilha não deixam ninguém passar!');
  K.chao(74, 63, 24, 9, C);
  b.predio('b_aeroporto', 80, 63, 8, 4); b.npc('comissaria', 82, 68);
  m.inicio = { x: 84, y: 69 }; m.renasce = { x: 85, y: 69 };
};

/* ============================================================
   MUNIQUE — a Marienplatz com a Prefeitura e o relógio dos bonequinhos no centro, o mercado
   Viktualienmarkt, a Aliança Arena, o rio Isar com o parque do outro lado, e no sul o sopé
   dos Alpes (a caverna de gelo) e o campo da festa (Theresienwiese).
   ============================================================ */
CIDADES_NOVAS.munique = function (b, c, K) {
  const m = b.m, P = CH.PEDRA, C = CH.CALCADA;
  /* --- o rio Isar e o parque do outro lado --- */
  K.chao(80, 1, 6, 72, CH.AGUA); K.chao(86, 1, 12, 72, CH.GRAMA);
  K.chao(89, 30, 6, 5, CH.AGUA);
  /* --- ruas --- */
  K.rua(2, 20, 96, 4); K.rua(2, 48, 96, 4); K.rua(2, 36, 78, 3);
  K.rua(20, 2, 3, 50); K.rua(42, 2, 4, 22); K.rua(42, 36, 4, 36); K.rua(62, 2, 3, 70);
  /* --- PARQUE ALPINO (leste do Isar): os relâmpagos bávaros --- */
  for (const [x, y] of [[87, 4], [96, 4], [92, 10], [87, 17], [96, 26], [87, 40], [96, 44], [92, 58], [87, 66], [96, 68], [88, 29], [96, 35]]) K.poe(x, y, 'pinheiro');
  K.caça(c.rapido, [[91, 13], [91, 40], [91, 63]], 4, 3);
  K.zona(86, 2, 12, 70, c.zona);
  b.placa(86, 25, `🌲 ${c.zona.toUpperCase()} — o parque do outro lado do rio Isar. Os Relâmpagos Bávaros correm entre os pinheiros!`);
  /* --- norte: a Aliança Arena e os prédios --- */
  K.chao(2, 2, 18, 18, C); K.estadio(10, 17);
  K.chao(23, 2, 19, 18, C); K.chao(46, 2, 16, 18, C); K.chao(65, 2, 15, 18, C);
  K.fila(23, 41, 9); K.fila(23, 41, 18);
  K.fila(46, 61, 9, { sprs: ['b_munique3', 'b_munique6', 'b_munique1'] }); K.fila(46, 61, 18);
  K.fila(65, 79, 9); K.fila(65, 79, 18);
  /* --- MARIENPLATZ (centro): a Prefeitura, as lojas e as missões --- */
  K.praca(23, 24, 39, 12, P, { arvores: false });
  K.mon('mon_rathaus', 52, 33);
  b.npc('loja_' + c.id, 27, 28); b.obj(26, 27, 'banca_pretzel'); b.obj(28, 27, 'bicicleta');
  b.npc('lider_' + c.id, 37, 28); b.npc('quadro', 32, 33);
  objLargo(b, 42, 27, 'maibaum', 1);
  b.placa(24, 34, '⭐ MARIENPLATZ — pretzel quentinho, o Treinador Hans e o quadro de desafios. Olhe o relógio da Prefeitura!');
  /* --- CT, prédios e casas --- */
  K.chao(2, 24, 18, 12, C); K.ct(3, 26);
  K.chao(65, 24, 15, 12, C); K.fila(65, 79, 34);
  K.chao(2, 39, 18, 9, C); m.casasLote = K.fila(2, 19, 46, { w: 5, max: 3, sprs: ['b_munique5', 'b_munique2', 'b_munique4'] });
  K.chao(46, 39, 16, 9, C); K.fila(46, 61, 46);
  K.chao(65, 39, 15, 9, C); K.fila(65, 79, 46);
  /* --- VIKTUALIENMARKT: o mercado e as relojoeiras --- */
  K.chao(23, 39, 19, 9, P);
  for (const [x, y, t] of [[24, 40, 'banca_pretzel'], [40, 40, 'banca_pretzel'], [27, 46, 'mesa_bavara'], [37, 46, 'mesa_bavara']]) K.poe(x, y, t);
  objLargo(b, 32, 40, 'maibaum', 1);
  K.caca('caca_relogio', 30, 43);
  K.caça(c.meia, [[26, 43], [38, 43]], 3, 2);
  K.zona(23, 39, 19, 9, 'Viktualienmarkt');
  b.placa(22, 42, '🥨 VIKTUALIENMARKT — o mercado de Munique. As Relojoeiras da Praça consertam relógios... e dribles!');
  /* --- SOPÉ DOS ALPES (sudoeste): as muralhas alpinas e a caverna de gelo --- */
  K.chao(2, 52, 40, 20, CH.GRAMA);
  for (const [x, y] of [[3, 53], [14, 53], [24, 53], [38, 53], [8, 60], [19, 62], [33, 64], [40, 70], [26, 70], [14, 70]]) K.poe(x, y, 'pinheiro');
  for (const [x, y] of [[11, 57], [36, 60], [22, 67], [4, 67], [17, 58], [30, 54]]) K.poe(x, y, 'rochas');
  K.caca('caca_gelo', 6, 61);
  K.caça(c.zagueiro, [[9, 55], [26, 60], [33, 68]], 3, 2);
  K.zona(2, 52, 40, 20, 'Sopé dos Alpes');
  b.placa(41, 53, '🏔️ SOPÉ DOS ALPES — as Muralhas Alpinas treinam na neve. Lá dentro, a Caverna de Gelo!');
  /* --- AEROPORTO e o campo da festa (Theresienwiese): o chefão --- */
  K.chao(46, 52, 16, 20, C);
  b.predio('b_aeroporto', 50, 54, 8, 4); b.npc('comissaria', 52, 59);
  m.inicio = { x: 54, y: 60 }; m.renasce = { x: 55, y: 60 };
  K.chao(65, 52, 15, 20, CH.GRAMA); K.chao(68, 55, 9, 13, CH.TERRA); objLargo(b, 72, 55, 'maibaum', 1);
  for (const [x, y] of [[66, 53], [78, 53], [66, 70], [78, 70]]) K.poe(x, y, 'mesa_bavara');
  b.spawn(c.chefe, 72, 62, 1, 1); b.placa(66, 60, `🎪 THERESIENWIESE — território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);
};

/* ============================================================
   MILÃO — o Parco Sempione, a Curva dos Ultras e o San Siro (oeste), o Quadrilátero da Moda
   (norte), a Piazza del Duomo no centro, os canais dos Navigli (sul), a Piazza della Scala
   (leste) e o aeroporto.
   ============================================================ */
CIDADES_NOVAS.milao = function (b, c, K) {
  const m = b.m, P = CH.PEDRA, C = CH.CALCADA;
  /* --- ruas --- */
  K.rua(2, 22, 96, 4); K.rua(2, 48, 96, 4);
  K.rua(26, 2, 3, 70); K.rua(48, 2, 3, 20); K.rua(70, 2, 3, 70);
  /* --- PARCO SEMPIONE (noroeste): os líberos --- */
  K.chao(2, 2, 24, 20, CH.GRAMA); K.chao(9, 7, 7, 5, CH.AGUA); K.chao(2, 14, 24, 2, CH.TERRA);
  for (const [x, y] of [[3, 3], [22, 3], [3, 11], [19, 9], [24, 12], [4, 19], [14, 19], [24, 19]]) K.poe(x, y, 'cipreste');
  K.caça(c.zagueiro, [[5, 6], [20, 6], [12, 18]], 3, 2);
  K.zona(2, 2, 24, 20, 'Parco Sempione');
  b.placa(25, 16, '🌳 PARCO SEMPIONE — o parque atrás do castelo. Os Líberos do Catenaccio fecham tudo!');
  /* --- a CURVA DOS ULTRAS e o SAN SIRO (oeste) --- */
  bairroHostil(b, 2, 26, 24, 8, c.zona, c.fanatico, 8);
  b.placa(25, 34, `${c.zona.toUpperCase()} — cuidado: os fanáticos andam em grupo`);
  K.chao(2, 34, 24, 14, C); K.estadio(12, 44);
  K.caca('caca_catacumba', 21, 44);
  /* --- oeste-sul: centro de treino e casas --- */
  K.chao(2, 52, 24, 20, C); K.ct(5, 53);
  m.casasLote = K.fila(2, 25, 70, { w: 5, max: 3, sprs: ['b_milao1', 'b_milao3', 'b_milao6'] });
  /* --- QUADRILÁTERO DA MODA (norte) --- */
  K.chao(29, 2, 19, 20, P); K.chao(51, 2, 19, 20, P);
  K.fila(29, 47, 10, { sprs: ['b_milao4', 'b_milao2', 'b_milao4'] }); K.fila(51, 69, 10, { sprs: ['b_milao4', 'b_milao5', 'b_milao2'] });
  for (const [x, y, t] of [[31, 14, 'manequim'], [45, 14, 'arara_roupas'], [53, 19, 'vespa'], [67, 14, 'manequim']]) K.poe(x, y, t);
  K.caca('caca_passarela', 57, 13);
  K.caça(c.rapido, [[38, 16], [64, 18]], 4, 2);
  K.zona(29, 11, 41, 11, 'Quadrilátero da Moda');
  b.placa(30, 20, '👗 QUADRILÁTERO DA MODA — as ruas das grifes. Os Estilistas da Ala desfilam dribles!');
  /* --- PIAZZA DEL DUOMO (centro) --- */
  K.praca(29, 26, 41, 22, P, { arvores: false });
  K.fila(29, 43, 33, { max: 2, sprs: ['b_milao1', 'b_milao6'] }); K.fila(56, 69, 33, { max: 2, sprs: ['b_milao3', 'b_milao1'] });
  K.mon('mon_duomo', 49, 33);
  objLargo(b, 49, 40, 'estatua', 1);
  b.npc('loja_' + c.id, 36, 39); b.obj(35, 38, 'mesa_italiana'); b.obj(37, 38, 'vespa');
  b.npc('lider_' + c.id, 62, 39); b.npc('quadro', 49, 44);
  b.placa(30, 45, '⭐ PIAZZA DEL DUOMO — a pizzaria da Nonna Giulia, o Padre Marco e o quadro de desafios.');
  /* --- NAVIGLI (sul): os canais e os registas --- */
  K.chao(29, 52, 41, 20, P);
  for (const x of [38, 58]) { K.chao(x, 52, 2, 20, CH.AGUA); K.chao(x, 61, 2, 2, CH.MADEIRA); }
  for (const [x, y, t] of [[31, 53, 'mesa_italiana'], [44, 53, 'mesa_italiana'], [51, 70, 'vespa'], [64, 53, 'mesa_italiana'], [33, 70, 'cipreste'], [67, 70, 'cipreste']]) K.poe(x, y, t);
  K.caça(c.meia, [[33, 58], [48, 64], [65, 58]], 4, 2);
  K.zona(29, 52, 41, 20, 'Navigli');
  b.placa(28, 60, '🛶 NAVIGLI — os canais de Milão foram projetados com a ajuda de Leonardo da Vinci!');
  /* --- norte-leste: prédios; PIAZZA DELLA SCALA: o chefão --- */
  K.chao(73, 2, 25, 20, C); K.quintal(74, 3, 23, 3); K.fila(73, 97, 20);
  K.chao(73, 26, 25, 22, P); K.fila(73, 97, 30, { max: 3 });
  objLargo(b, 85, 38, 'fonte_italiana', 3);
  b.spawn(c.chefe, 85, 43, 1, 1); b.placa(74, 40, `🎼 PIAZZA DELLA SCALA — território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);
  /* --- AEROPORTO (sudeste) --- */
  K.chao(73, 52, 25, 20, C);
  b.predio('b_aeroporto', 81, 53, 8, 4); b.npc('comissaria', 83, 58);
  m.inicio = { x: 85, y: 59 }; m.renasce = { x: 86, y: 59 };
  K.fila(73, 97, 70);
};

const LISBOA_C = { id: 'lisboa', nome: 'Lisboa — Bairro Alto', base: CH.CALCADA_PT, seed: 606, arvores: ['arvore'], poste: 'poste3',
  rapido: 'ponta_alfama', meia: 'medio_chiado', zagueiro: 'central_belem', fanatico: 'ultra_lisboa', chefe: 'capitao_tejo' };
mapaLisboa = function () { return criaCidadeNova(LISBOA_C); };

/* ---------- registra (Lisboa é da Europa: europa.js chama mapaLisboa()) ---------- */
{
  const NOVAS = Object.keys(CIDADES_NOVAS);
  for (const id of NOVAS) {
    const c = CIDADES.find(k => k.id === id);
    if (c) { c.cria = criaCidadeNova; c.rua = CH.ASFALTO; }
  }
  // a missão do chefão dizia "canto sudeste": agora cada um tem o seu lugar
  const CHEFE_ONDE = { cairo: 'no Oásis do Faraó, no sudoeste, depois das dunas', doha: 'na Falcoaria, no sudoeste do deserto', toquio: 'no Templo do Sensei, do outro lado do rio (sudeste)',
    miami: 'no Palco do Píer, no norte da praia', buenos: 'na Milonga da Vuelta de Rocha, no sudoeste, perto do rio', rio: 'na Esplanada do Maracanã, no norte',
    paris: 'no Jardim de Luxemburgo, na margem sul do Sena', munique: 'na Theresienwiese, no sul da cidade', milao: 'na Piazza della Scala, no leste' };
  for (const [id, onde] of Object.entries(CHEFE_ONDE)) { const q = MISSOES.find(k => k.id === id + '_m4'); if (q) q.texto = q.texto.replace('manda no canto sudeste da cidade', 'manda ' + onde); }
  // o tamanho "de projeto" que dá o tamanho real (o espalha usa para as ruas e os saves antigos)
  const _dimProjetoCN = dimProjeto;
  dimProjeto = function (id) { return CIDADES_NOVAS[id] ? [CN_W / ESCALA_MAPA, CN_H / ESCALA_MAPA] : _dimProjetoCN(id); };
  // quem salvou dentro de uma cidade que mudou de desenho volta para o aeroporto dela
  const VERSAO_CN = 272;
  const _iniciarJogoCN = iniciarJogo;
  iniciarJogo = async function (save, ...resto) {
    try {
      if (save && CIDADES_NOVAS[save.mapa]) {
        save.cidadesNovas = save.cidadesNovas || {};
        if (save.cidadesNovas[save.mapa] !== VERSAO_CN) {
          const mp = getMapa(save.mapa), p = mp.renasce || mp.inicio;
          if (p) { save.x = p.x + 0.5; save.y = p.y + 0.5; }
        }
      }
      if (save) { save.cidadesNovas = save.cidadesNovas || {}; for (const id of Object.keys(CIDADES_NOVAS)) save.cidadesNovas[id] = VERSAO_CN; }
    } catch (e) { console.warn('cidades novas: posição', e); }
    return _iniciarJogoCN.call(this, save, ...resto);
  };
}
