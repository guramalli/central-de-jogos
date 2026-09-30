/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🇧🇷 O BRASIL VIVO (v281): a Praia, a Cidade, o CT e o Estádio ganham vida (arte nova do Higgsfield).
   - PRAIA: a vila dos pescadores (casinhas, escola de surfe, posto de salva-vidas),
     o píer, jangadas, carrinhos de açaí e de milho, e o ninho das tartarugas marinhas;
   - CIDADE: a Praça do Craque (estátua do menino, ipês, orelhão), cinema, pastelaria, mercadinho,
     prédio novo, abrigo de ônibus e o muro grafitado do skate;
   - CT: alojamento, departamento médico, vestiário, sala de imprensa, piscina de recuperação,
     o ônibus do time, barreira de falta, canhão de bolas, arquibancadas e torres de luz;
   - ESTÁDIO: bilheteria, loja do clube, museu do futebol, estátua dourada, ônibus e bateria da torcida;
   - em cada lugar, alguém que conta um pouquinho das CIDADES DO MUNDO (para dar vontade de ir!).
   Tudo é posto DEPOIS do mapa pronto, só em lugar livre (nada na frente de porta, pessoa, placa ou saída);
   se algum caminho fechar, o que foi posto por último sai. Carregar DEPOIS de vila_nova.js.
   ============================================================ */
const BV_PREDIOS = ['b_pescador_azul', 'b_pescador_rosa', 'b_escola_surf', 'b_salva_vidas', 'b_predio_cid', 'b_cinema', 'b_pastelaria', 'b_mercadinho',
  'b_alojamento', 'b_medico', 'b_vestiario', 'b_imprensa', 'b_bilheteria', 'b_loja_clube', 'b_museu'];
for (const n of BV_PREDIOS) { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } if (!PORTAS[n]) PORTAS[n] = { x: 0.5, y: 0.93 }; }
const BV_OBJ = { jangada: 2.0, carrinho_acai: 1.2, rack_pranchas: 1.6, ninho_tartaruga: 2.2, carrinho_milho: 1.2, covos_pesca: 1.4, rede_futevolei: 2.6, kit_praia: 1.8,
  orelhao: 0.8, ipe_amarelo: 2.3, ipe_roxo: 2.3, carrinho_hotdog: 1.2, abrigo_onibus: 2.2, barraca_pastel: 1.6, estatua_menino: 1.2, muro_grafite: 2.6,
  piscina_rec: 3.2, onibus_time: 3.4, mastros: 1.8, maquina_bolas: 1.4, barreira_falta: 2.2, arquib_metal: 2.6, minigol: 1.8, torre_luz: 1.2,
  estatua_dourada: 1.4, onibus_torcida: 3.0, banca_cachecol: 1.8, bateria_torcida: 1.7 };
for (const [n, w] of Object.entries(BV_OBJ)) { OBJ_INFO[n] = { w, b: 1 }; OBJ_BLOQUEIA.add(n); if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } }
if (typeof OBJ_MINI !== 'undefined') Object.assign(OBJ_MINI, { ipe_amarelo: '#e8c020', ipe_roxo: '#b050c0' });

/* ---------- o kit: tudo com cuidado ---------- */
function kitDecora(m) {
  const W = m.w, H = m.h, i = (x, y) => y * W + x, dentro = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1;
  const TIRAVEL = /^(arvore|mangueira|arbusto|pedra|coqueiro2?|poste3?|lixeira2?|hidrante|caixa_correio|vaso|canteiro|cone_deco|bicicleta)$/; // pode sair do lugar para dar espaço
  const perto = (x, y, r) => m.npcs.some(n => Math.abs(n.x - x) <= r && Math.abs(n.y - y) <= r) || m.saidas.some(s => Math.abs(s.x - x) <= r && Math.abs(s.y - y) <= r)
    || m.placas.some(p => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1) || m.pontos.some(p => Math.abs(p.x - x) <= r && Math.abs(p.y - y) <= r)
    || m.spawns.some(s => s.qtd === 1 && Math.abs(s.x - x) <= 2 && Math.abs(s.y - y) <= 2)
    || m.predios.some(p => p.porta && Math.abs(p.porta.x - x) <= 1 && y > p.porta.y && y <= p.porta.y + 2)
    || m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h);
  const chaoOk = (x, y, agua) => { const c = m.chao[i(x, y)]; return agua ? c === CH.AGUA : CH_ANDA(c) && c !== CH.AGUA; };
  const livre = (x, y, o = {}) => dentro(x, y) && chaoOk(x, y, o.agua) && (!m.obj[i(x, y)] || (o.tira && TIRAVEL.test(m.obj[i(x, y)].t) && !m.obj[i(x, y)].predio)) && !perto(x, y, o.r != null ? o.r : 1);
  const feitos = []; // para desfazer
  const inicio = [m.renasce, m.inicio].find(p => p && !m.obj[i(p.x, p.y)]) || m.renasce || m.inicio;
  const antes = alcancaveis(m, inicio), importantes = pontosImportantes(m).filter(pt => antes[i(pt.x, pt.y)]);
  const K = {
    m, W, H, livre,
    // um objeto (largo = bloqueia os vizinhos de lado); tenta os lugares da lista, na ordem
    poe(t, lugares, o = {}) {
      const larg = o.larg || 1, meia = larg >> 1;
      for (const [x, y] of lugares) {
        let ok = true; for (let k = -meia; k <= meia && ok; k++) ok = livre(x + k, y, o);
        if (!ok) continue;
        const guarda = []; for (let k = -meia; k <= meia; k++) { guarda.push([i(x + k, y), m.obj[i(x + k, y)]]); m.obj[i(x + k, y)] = k ? { t: 'x', v: 0 } : { t, v: (hash2(x, y) * 1000) | 0 }; }
        feitos.push(() => { for (const [k, v] of guarda) m.obj[k] = v; });
        return [x, y];
      }
      return null;
    },
    // prédio decorativo (sem porta para dentro): pegada w×h, porta na base, frente livre
    predio(spr, lugares, w = 5, h = 3) {
      for (const [x, y] of lugares) {
        let ok = true;
        for (let j = y; j < y + h && ok; j++) for (let k = x; k < x + w && ok; k++) ok = dentro(k, j) && chaoOk(k, j) && (!m.obj[i(k, j)] || (TIRAVEL.test(m.obj[i(k, j)].t) && !m.obj[i(k, j)].predio)) && !perto(k, j, 1);
        const px = x + (w >> 1);
        if (!ok || !livre(px, y + h, { tira: true, r: 0 })) continue;
        const guarda = []; for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) { guarda.push([i(k, j), m.obj[i(k, j)]]); m.obj[i(k, j)] = { t: 'x', v: 0, predio: true }; }
        m.obj[i(px, y + h - 1)] = null;
        for (let j = y - 3; j < y; j++) for (let k = x; k < x + w; k++) { const o = dentro(k, j) && m.obj[i(k, j)]; if (o && !o.predio && TIRAVEL.test(o.t)) { guarda.push([i(k, j), o]); m.obj[i(k, j)] = null; } } // nada em cima do telhado
        const p = { spr, x, y, w, h, porta: { x: px, y: y + h - 1 } }; m.predios.push(p);
        feitos.push(() => { for (const [k, v] of guarda) m.obj[k] = v; m.predios.splice(m.predios.indexOf(p), 1); });
        return p;
      }
      return null;
    },
    npc(id, lugares) {
      for (const [x, y] of lugares) if (livre(x, y, { r: 2 }) && livre(x, y + 1, { r: 0 })) { const n = { id, x, y }; m.npcs.push(n); feitos.push(() => m.npcs.splice(m.npcs.indexOf(n), 1)); return n; }
      return null;
    },
    placa(lugares, texto) {
      for (const [x, y] of lugares) if (livre(x, y)) { m.obj[i(x, y)] = { t: 'placa', v: 1 }; const p = { x, y, texto }; m.placas.push(p); feitos.push(() => { m.obj[i(x, y)] = null; m.placas.splice(m.placas.indexOf(p), 1); }); return p; }
      return null;
    },
    // pinta o chão (só onde não tem prédio e o chão é um dos 'de')
    pinta(x, y, w, h, t, de) { for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) if (dentro(k, j) && (!de || de.includes(m.chao[i(k, j)])) && !(m.obj[i(k, j)] && m.obj[i(k, j)].predio)) m.chao[i(k, j)] = t; },
    // tira árvores e enfeites de um caminho
    abre(x, y, w, h) { for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) { const o = dentro(k, j) && m.obj[i(k, j)]; if (o && !o.predio && TIRAVEL.test(o.t)) m.obj[i(k, j)] = null; } },
    // no fim: se algo importante ficou sem caminho, desfaz do fim para o começo
    confere() {
      let d = alcancaveis(m, inicio);
      while (feitos.length && !importantes.every(pt => d[i(pt.x, pt.y)])) { feitos.pop()(); d = alcancaveis(m, inicio); }
      delete m._chao; delete m._chaoV;
    },
  };
  return K;
}

/* ---------- quem conta das cidades do mundo (a fala muda a cada conversa) ---------- */
function npcSonhador(id, nome, look, falas) {
  let k = (Math.random() * falas.length) | 0;
  NPCS[id] = { nome, look };
  Object.defineProperty(NPCS[id], 'ola', { get() { const f = falas[k % falas.length]; k++; return f; }, enumerable: true, configurable: true });
}
npcSonhador('seu_jonas', 'Seu Jonas, o pescador', { tipo: 'humano', corpo: 'm', pele: 'pele-retinta', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-regata', corRoupa: '#e8e0c0', baixo: 'baixo-praia', chapeu: 'chapeu-palha', alt: 1.72 }, [
  'A jangada é feita de troncos e vela de pano. Os pescadores do Nordeste saem com ela pro mar há mais de 300 anos!',
  'Se você atravessar esse mar todinho, chega na África. Lá no Egito fica o CAIRO, com as pirâmides e o rio Nilo!',
  'Tartaruga marinha bota os ovos na areia. Quando os filhotes nascem, correm pro mar — por isso a gente cerca o ninho e ninguém pisa!',
  'Dizem que em LISBOA, do outro lado do oceano, tem uma torre de pedra na beira do rio, a Torre de Belém. De lá saíam os navegadores!',
]);
npcSonhador('nina_surf', 'Nina, a surfista', { tipo: 'humano', corpo: 'f', pele: 'pele-media', cabelo: 'cabelo-coque', corCabelo: 'loiro', roupa: 'roupa-regata', corRoupa: '#3ac0e0', baixo: 'baixo-praia', alt: 1.34 }, [
  'Em MIAMI a praia tem torre de salva-vidas colorida igual à nossa! Um dia eu vou surfar lá.',
  'No RIO DE JANEIRO tem a praia de Copacabana, com um calçadão de ondinhas igual a esse aqui!',
  'Futevôlei foi inventado no Brasil, sabia? Só pode usar pé, peito e cabeça — mão não vale!',
  'O mar tem mais água que todos os rios do mundo juntos. E é salgado porque os rios levam sal das pedras pra ele!',
]);
npcSonhador('guto', 'Guto do skate', { tipo: 'humano', corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-cacheado', corCabelo: 'preto', roupa: 'roupa-camiseta', corRoupa: '#e05a2a', baixo: 'baixo-shorts', chapeu: 'chapeu-bone', alt: 1.34 }, [
  'Orelhão é telefone público! Antes do celular, era daqui que a gente ligava pra vó.',
  'O ipê perde as folhas no inverno e depois fica TODO florido: amarelo, roxo, branco... A árvore mais bonita do Brasil!',
  'Do AEROPORTO ali embaixo sai avião pro mundo inteiro. Meu sonho é ir pra TÓQUIO ver as ruas de neon!',
  'Diz que em BUENOS AIRES tem um bairro de casas coloridas, o Caminito. Parece a nossa feira!',
  'Em PARIS tem uma torre de ferro de mais de 300 metros. Dá pra ver a cidade inteira lá de cima!',
]);
npcSonhador('olheira_carla', 'Carla, a olheira', { tipo: 'humano', corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-camiseta', corRoupa: '#2a8a4a', baixo: 'baixo-jeans', alt: 1.7 }, [
  'Eu viajo o mundo procurando talentos. Semana passada estava em LISBOA, pertinho da Torre de Belém!',
  'Joga bem aqui no CT, que os clubes da Europa estão de olho: MADRI, MILÃO, LONDRES, MUNIQUE...',
  'Descanso também é treino! A piscina de recuperação ajuda os músculos a ficarem prontos pro próximo jogo.',
  'Um bom jogador treina o chute, o drible, a defesa... e a cabeça! Visão de jogo se treina no quadro tático.',
]);
npcSonhador('pedrinho_torcedor', 'Pedrinho, torcedor mirim', { tipo: 'humano', corpo: 'm', pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-futebol', corRoupa: '#f0c020', baixo: 'baixo-shorts', alt: 1.3 }, [
  'Cada estádio do mundo tem uma torcida diferente: em MUNIQUE cantam com chapéu tirolês, em BUENOS AIRES pulam o jogo inteiro!',
  'Aquela estátua dourada é pra quem virar LENDA do futebol. Quem sabe um dia é você!',
  'Meu avô diz que o Maracanã, no RIO, já recebeu mais de 150 mil torcedores num jogo só!',
  'Em DOHA, no Catar, os estádios têm ar-condicionado. Imagina jogar bola no deserto sem suar!',
]);

/* ============================================================ PRAIA ============================================================ */
function decoraPraia(m) {
  const K = kitDecora(m), A = CH.AREIA, G = [CH.GRAMA, CH.GRAMA_FLOR];
  // a vila dos pescadores (no gramado ao sul da estrada)
  K.pinta(1, 35, 18, 1, CH.TERRA, G); K.abre(1, 35, 18, 1);
  K.pinta(1, 44, 18, 1, CH.TERRA, G); K.abre(1, 44, 18, 1);
  K.predio('b_pescador_azul', [[2, 32], [3, 32]]);
  K.predio('b_pescador_rosa', [[10, 32], [11, 32]]);
  K.predio('b_escola_surf', [[2, 41], [3, 41]]);
  K.poe('covos_pesca', [[16, 33], [16, 34], [8, 33]]);
  K.poe('rack_pranchas', [[9, 42], [9, 43], [15, 42]], { larg: 1 });
  K.npc('seu_jonas', [[8, 36], [9, 36], [15, 36]]);
  K.npc('nina_surf', [[11, 45], [12, 45], [7, 45]]);
  K.placa([[17, 36], [17, 37]], '🎣 VILA DOS PESCADORES — aqui mora quem sai de jangada todo dia antes do sol nascer.');
  // na areia: o posto de salva-vidas, jangadas, carrinhos e guarda-sóis
  K.predio('b_salva_vidas', [[33, 21], [31, 21], [35, 21], [24, 21]], 4, 3);
  K.poe('carrinho_acai', [[30, 25], [26, 25], [36, 25], [48, 25]], { r: 1 });
  K.poe('carrinho_milho', [[50, 30], [22, 30], [44, 31]], { r: 1 });
  for (const [x, y] of [[24, 34], [36, 47], [47, 24], [27, 16], [50, 45]]) K.poe('kit_praia', [[x, y], [x + 1, y], [x, y + 1]], { larg: 1 });
  K.poe('jangada', [[57, 44], [57, 45], [56, 46]], { larg: 1 });
  K.poe('jangada', [[57, 50], [56, 51], [57, 52]], { larg: 1 });
  // o ninho das tartarugas (bem longe do caminho)
  if (K.poe('ninho_tartaruga', [[30, 58], [32, 58], [28, 59], [34, 57]], { larg: 3 })) K.placa([[34, 59], [35, 58], [26, 59]], '🐢 NINHO DE TARTARUGA MARINHA — não pise! Os filhotes nascem e correm sozinhos para o mar. Só no Brasil nascem milhares por ano.');
  // o píer dos pescadores (entra no mar)
  const Wm = m.w; let px = 59; while (px < Wm - 1 && m.chao[16 * Wm + px] !== CH.AGUA) px++;
  const fim = Math.min(Wm - 3, px + 9);
  for (let x = px - 2; x <= fim; x++) for (const y of [16, 17]) { const k = y * Wm + x; if (!m.obj[k] || m.obj[k].t === 'x' && !m.obj[k].predio && x > px) { m.chao[k] = CH.MADEIRA; m.obj[k] = null; } }
  K.poe('jangada', [[fim - 2, 19], [fim - 3, 19], [fim - 1, 14]], { agua: true, r: 0 });
  K.placa([[px - 3, 15], [px - 4, 15], [px - 3, 18]], '🚣 PÍER DOS PESCADORES — daqui o mar vai longe... até outros continentes!');
  K.confere();
}

/* ============================================================ CIDADE ============================================================ */
function decoraCidade(m) {
  const K = kitDecora(m), C = [CH.CALCADA];
  // prédios novos nas quadras vazias
  K.predio('b_pastelaria', [[11, 3], [12, 3], [10, 3]]);
  K.predio('b_mercadinho', [[17, 3], [16, 3]]);
  K.predio('b_cinema', [[70, 37], [71, 37], [72, 37]], 6, 3);
  K.predio('b_predio_cid', [[71, 50], [70, 50], [71, 51], [70, 52]], 5, 3);
  K.predio('b_mercadinho', [[52, 56], [53, 56], [60, 56]]);
  // a Praça do Craque (sudoeste)
  K.pinta(3, 47, 16, 8, CH.PEDRA, C);
  K.poe('estatua_menino', [[10, 50], [11, 50], [10, 51]]);
  K.placa([[12, 51], [8, 51], [12, 49]], '⚽ PRAÇA DO CRAQUE — a estátua é do menino que aprendeu a jogar aqui e ganhou o mundo. Será que é você?');
  for (const [x, y, t] of [[3, 47, 'ipe_amarelo'], [18, 47, 'ipe_roxo'], [3, 54, 'ipe_roxo'], [18, 54, 'ipe_amarelo']]) K.poe(t, [[x, y], [x + 1, y], [x, y - 1]], { tira: true });
  K.poe('banco', [[7, 53], [8, 53]]); K.poe('banco', [[14, 53], [13, 53]]);
  K.poe('carrinho_hotdog', [[16, 49], [16, 50], [15, 51]]);
  K.poe('orelhao', [[5, 50], [5, 49], [6, 51]]);
  K.npc('guto', [[13, 48], [8, 48], [12, 52]]);
  // ipês nas calçadas
  for (const [x, y, t] of [[15, 34], [28, 34], [46, 33], [62, 33], [76, 33], [40, 3], [60, 2], [77, 12], [77, 20]].map((p, k) => [...p, k % 2 ? 'ipe_roxo' : 'ipe_amarelo'])) K.poe(t, [[x, y], [x + 1, y], [x - 1, y]], { tira: true });
  // rua: orelhões, abrigo de ônibus, pastel de feira, grafite do skate
  K.poe('orelhao', [[33, 24], [33, 23], [39, 33]]); K.poe('orelhao', [[41, 56], [42, 55], [66, 52]]);
  K.poe('abrigo_onibus', [[46, 25], [47, 25], [50, 25]], { larg: 3 });
  K.poe('barraca_pastel', [[26, 44], [27, 44], [25, 46]], { larg: 1 });
  K.poe('muro_grafite', [[22, 9], [8, 9], [26, 14]], { larg: 3 });
  K.confere();
}

/* ============================================================ CT ============================================================ */
function decoraCT(m) {
  const K = kitDecora(m);
  K.predio('b_alojamento', [[3, 7], [2, 7], [4, 8]]);
  K.predio('b_medico', [[11, 7], [12, 7], [10, 8]]);
  K.predio('b_vestiario', [[19, 33], [20, 33], [18, 33]]);
  K.predio('b_imprensa', [[19, 40], [20, 40], [21, 41]]);
  K.poe('piscina_rec', [[12, 13], [13, 13], [8, 13]], { larg: 3, tira: true });
  K.placa([[15, 14], [9, 14]], '🏊 PISCINA DE RECUPERAÇÃO — depois do treino, água fria para os músculos descansarem.');
  K.poe('onibus_time', [[14, 30], [12, 30], [15, 31]], { larg: 3 });
  K.poe('mastros', [[20, 3], [19, 3], [21, 4]], { tira: true });
  K.poe('barreira_falta', [[33, 54], [34, 54], [32, 55]], { larg: 3 });
  K.poe('maquina_bolas', [[44, 56], [42, 55], [46, 54]]);
  K.poe('minigol', [[40, 60], [41, 60]], { larg: 1 }); K.poe('minigol', [[70, 60], [71, 60]], { larg: 1 });
  for (const x of [35, 50, 66]) K.poe('arquib_metal', [[x, 33], [x + 1, 33], [x, 34]], { larg: 3 });
  for (const [x, y] of [[26, 36], [81, 36], [26, 50], [81, 50]]) K.poe('torre_luz', [[x, y], [x, y + 1], [x, y - 1]]);
  K.npc('olheira_carla', [[24, 32], [23, 32], [24, 31]]);
  K.confere();
}

/* ============================================================ ESTÁDIO ============================================================ */
function decoraEstadio(m) {
  const K = kitDecora(m);
  // a esplanada: bilheteria, loja do clube e museu (encostados na arquibancada)
  const faixa = (x0, x1) => { const l = []; for (let x = x0; x <= x1; x++) l.push([x, 54]); return l; };
  K.predio('b_bilheteria', faixa(4, 10));
  const loja = K.predio('b_loja_clube', faixa(12, 19));
  K.predio('b_museu', faixa(loja ? loja.x + loja.w + 2 : 24, 31));
  K.placa([[29, 57], [35, 58], [28, 57], [33, 59]], '🏛️ MUSEU DO FUTEBOL — as chuteiras, as bolas e as taças dos grandes jogos da história.');
  // o lado leste: estátua dourada, bateria, bandeiras e o ônibus da torcida
  K.poe('estatua_dourada', [[70, 58], [69, 58], [71, 59]]);
  K.placa([[72, 59], [68, 59]], '🏆 ESTÁTUA DA LENDA — para quem ganhar tudo no Brasil e no mundo. Falta pouco?');
  K.poe('bateria_torcida', [[64, 56], [63, 56], [65, 57]]);
  K.poe('banca_cachecol', [[60, 59], [61, 59], [62, 60]], { larg: 1 });
  K.poe('onibus_torcida', [[77, 60], [76, 60], [77, 58]], { larg: 3 });
  K.poe('bandeirao', [[58, 61], [59, 61], [58, 60]]); K.poe('bandeirao', [[79, 56], [79, 57], [78, 56]]);
  K.poe('carrinho_hotdog', [[75, 56], [76, 56], [74, 57]]);
  K.npc('pedrinho_torcedor', [[67, 60], [66, 61], [74, 58]]);
  K.confere();
}

/* ---------- liga nos mapas ---------- */
for (const [id, f] of [['praia', decoraPraia], ['cidade', decoraCidade], ['ct', decoraCT], ['estadio', decoraEstadio]]) {
  const base = MAPAS_DEF[id]; if (!base) continue;
  MAPAS_DEF[id] = function () { const m = base.apply(this, arguments); try { f(m); } catch (e) { console.error('brasil vivo', id, e); } return m; };
}
