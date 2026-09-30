/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🗝️ DUNGEONS NOVAS (v272): uma área de caça nova em cada cidade do mundo, cada uma com um
   DESENHO PRÓPRIO (nada do gerador de cavernas de sempre):
   Cairo — Bazar Coberto (corredores de barracas) · Doha — Palácio das Miragens (9 salões e o pátio)
   Tóquio — Grande Dojo do Sumô (4 ringues) · Miami — Academia da Muscle Beach (ao ar livre, na areia)
   Buenos Aires — Estaleiro do Riachuelo (píeres no rio) · Rio — Barracão da Escola de Samba (carros alegóricos)
   Lisboa — Porão da Caravela (o casco de um navio) · Paris — Labirinto de Versalhes (labirinto de verdade)
   Munique — Oficina do Relógio Gigante (o salão redondo do mostrador) · Milão — Passarela da Moda (a plateia)
   Cada uma é de UM adversário da cidade que ainda não tinha área própria. A entrada fica num lote
   desenhado no mapa da cidade (cidades_novas.js). Carregar DEPOIS de cidades_novas.js.
   ============================================================ */
// paredes e pisos novos: texturas que o jogo já tem, tingidas (assets.js: est.tinta)
Object.assign(CH, { PAR_MADEIRA: 51, FACE_MADEIRA: 52, PAR_TIJOLO: 53, FACE_TIJOLO: 54, PAR_PALACIO: 55, FACE_PALACIO: 56, PAR_MODA: 57, FACE_MODA: 58, SEBE: 59, FACE_SEBE: 60, TAPETE: 61, TATAME: 62, DOHYO: 63 });
Object.assign(ESTILO_CHAO, {
  [CH.PAR_MADEIRA]: { cor: '#3a2414', borda: '#1e120a', r: 0, e: 0, tex: 'madeira', o: 21.1, tinta: 'rgba(25,12,4,0.62)' },
  [CH.FACE_MADEIRA]: { cor: '#5a3a20', borda: '#3a2412', r: 0, e: 0, tex: 'madeira', o: 19.1, tinta: 'rgba(45,22,6,0.5)' },
  [CH.PAR_TIJOLO]: { cor: '#5a2a1c', borda: '#2e140c', r: 0, e: 0, tex: 'liso', o: 21.2, tinta: 'rgba(35,12,6,0.6)' },
  [CH.FACE_TIJOLO]: { cor: '#a8583a', borda: '#6a3422', r: 0, e: 0, tex: 'liso', o: 19.2, tinta: 'rgba(40,10,0,0.12)' },
  [CH.PAR_PALACIO]: { cor: '#b89048', borda: '#7a5a24', r: 0, e: 0, tex: 'pedra', o: 21.3, tinta: 'rgba(110,70,10,0.45)' },
  [CH.FACE_PALACIO]: { cor: '#f0dcae', borda: '#b8a070', r: 0, e: 0, tex: 'pedra', o: 19.3, tinta: 'rgba(255,225,150,0.18)' },
  [CH.PAR_MODA]: { cor: '#241634', borda: '#120a1c', r: 0, e: 0, tex: 'liso', o: 21.4, tinta: 'rgba(25,8,45,0.78)' },
  [CH.FACE_MODA]: { cor: '#5a3478', borda: '#361e4a', r: 0, e: 0, tex: 'liso', o: 19.4, tinta: 'rgba(110,40,150,0.45)' },
  [CH.SEBE]: { cor: '#2e7a2e', borda: '#1a4a1a', r: 0, e: 0, tex: 'liso', o: 21.5, tinta: 'rgba(0,55,0,0.42)' },
  [CH.FACE_SEBE]: { cor: '#246624', borda: '#143a14', r: 0, e: 0, tex: 'liso', o: 19.5, tinta: 'rgba(0,35,10,0.58)' },
  [CH.TAPETE]: { cor: '#9c2432', borda: '#5a1018', r: 0, e: 0, tex: 'liso', o: 7.1 },
  [CH.TATAME]: { cor: '#d8cc8a', borda: '#9a8e52', r: 0, e: 0, tex: 'madeira', o: 7.2, tinta: 'rgba(210,215,120,0.5)' },
  [CH.DOHYO]: { cor: '#c89a62', borda: '#8a6232', r: 0.4, e: 0.08, tex: 'areia', o: 7.3 },
});
Object.assign(TEX_CHAO, { [CH.PAR_MADEIRA]: 't_madeira', [CH.FACE_MADEIRA]: 't_madeira', [CH.PAR_TIJOLO]: 't_tijolo', [CH.FACE_TIJOLO]: 't_tijolo', [CH.PAR_PALACIO]: 't_arenito', [CH.FACE_PALACIO]: 't_arenito',
  [CH.PAR_MODA]: 't_piso', [CH.FACE_MODA]: 't_piso', [CH.SEBE]: 't_grama', [CH.FACE_SEBE]: 't_grama', [CH.TATAME]: 't_madeira' });
Object.assign(CH_MINI, { 51: '#2a1a0e', 52: '#6a4226', 53: '#4a2016', 54: '#a8583a', 55: '#8a6a30', 56: '#f0dcae', 57: '#1e1030', 58: '#5a3478', 59: '#1e5a1e', 60: '#246624', 61: '#b01e2e', 62: '#d8cc8a', 63: '#c89a62' });
if (typeof chaoSuaviza === 'function') { const _chaoSuavizaDg = chaoSuaviza; chaoSuaviza = t => (t >= 51 && t <= 62) ? false : _chaoSuavizaDg(t); }
SAIDA_CACA.ent_caravela = 'sai_madeira';

/* ---------- kit das dungeons ---------- */
function dgNovo(c, W, H, base) {
  if (!c.porta) try { getMapa(c.host); } catch (e) { } // garante a porta na cidade (a saída volta em frente a ela)
  const b = new Construtor(c.id, '🎯 ' + c.nome, W, H, base, c.seed);
  const piso = new Uint8Array(W * H), r = mulberry(c.seed + 11), m = b.m;
  const D = {
    b, m, W, H, piso, r,
    ok: (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1,
    eh: (x, y) => x >= 0 && y >= 0 && x < W && y < H && piso[y * W + x] === 1,
    cava(x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (D.ok(i, j)) { piso[j * W + i] = 1; if (ch != null) m.chao[j * W + i] = ch; } },
    tapa(x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) piso[j * W + i] = 0; },
    circ(cx, cy, rr, ch) { for (let j = Math.floor(cy - rr); j <= cy + rr; j++) for (let i = Math.floor(cx - rr); i <= cx + rr; i++) if ((i - cx) ** 2 + (j - cy) ** 2 <= rr * rr) D.cava(i, j, 1, 1, ch); },
    chao(x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (D.eh(i, j)) m.chao[j * W + i] = ch; },
    livre: (x, y) => D.eh(x, y) && !m.obj[y * W + x],
    poe(x, y, t) { if (!D.livre(x, y)) return false; m.obj[y * W + x] = { t, v: (hash2(x, y) * 1000) | 0 }; return true; },
    largo(x, y, t) { if (!D.livre(x, y)) return false; m.obj[y * W + x] = { t, v: 1 }; if (D.livre(x + 1, y)) m.obj[y * W + x + 1] = { t: 'x', v: 0 }; return true; },
    // lugar fechado: o que não é piso vira parede (o topo escuro e a "frente" clara logo acima do chão)
    fecha(TOPO, FACE, enfeite) {
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        if (piso[j * W + i]) continue;
        const frente = j + 1 < H && piso[(j + 1) * W + i];
        m.chao[j * W + i] = frente ? FACE : TOPO; m.obj[j * W + i] = { t: 'x', v: 0 };
        if (frente && enfeite && hash2(i * 11, j * 13) < 0.12) m.obj[j * W + i] = { t: enfeite, v: 0 }; // tocha/lanterna encostada na parede
      }
    },
    // lugar aberto: a volta vira vegetação (ou parede invisível)
    abre(borda) {
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        if (piso[j * W + i] || m.chao[j * W + i] === CH.AGUA) { if (!piso[j * W + i] && (i === 0 || j === 0 || i === W - 1 || j === H - 1)) m.obj[j * W + i] = { t: 'x', v: 0 }; continue; }
        const perto = D.eh(i - 1, j) || D.eh(i + 1, j) || D.eh(i, j - 1) || D.eh(i, j + 1);
        m.obj[j * W + i] = { t: perto && borda.length && (i + j) % 2 === 0 ? borda[(hash2(i, j * 7) * borda.length) | 0] : 'x', v: (hash2(i, j) * 1000) | 0 };
      }
    },
    grupo(x, y, qtd = 4, raio = 2) { b.spawn(c.m, x, y, qtd, raio); },
  };
  return D;
}
// saída (a arte da entrada, ou a escada que sobe), o guia, o quadro, a placa e o lugar de chegada
function dgFim(D, c, o) {
  const { b } = D, ex = o.ex, ey = o.ey;
  for (let a = -2; a <= 2; a++) { D.cava(ex + a, ey + 1, 1, 1); b.m.obj[(ey + 1) * D.W + ex + a] = null; }
  b.predio(SAIDA_CACA[c.ent] || c.ent, ex - 1, ey - 1, 3, 2, c.host, ex);
  const sd = b.m.saidas.find(s => s.x === ex && s.y === ey); if (sd && c.porta) { sd.tx = c.porta.x; sd.ty = c.porta.y + 1; }
  b.npc('guia_' + c.id, o.guia[0], o.guia[1]); b.npc('quadro', o.quadro[0], o.quadro[1]);
  b.placa(o.placa[0], o.placa[1], `🎯 ${c.nome.toUpperCase()} — aqui só tem ${MONSTROS[c.m].nome} (nível ${nivelCaca(c)}). Missões com o Guia e desafios no Quadro!`);
  b.m.inicio = { x: ex + 2, y: ey + 1 }; b.m.renasce = { x: ex + 2, y: ey + 1 };
  Object.assign(b.m, { caca: c.id, fechado: !!o.fechado, luzCor: o.cor || null, luzes: o.luzes || [] });
  return b.m;
}

/* ---------- 1) CAIRO: o Bazar Coberto de Khan el-Khalili ---------- */
function dgBazar(c) {
  const D = dgNovo(c, 52, 42, CH.PAR_TIJOLO), { W } = D;
  D.cava(2, 2, 48, 31, CH.ARENITO); D.cava(19, 33, 14, 7, CH.ARENITO);
  D.chao(25, 2, 2, 38, CH.TAPETE);                                         // o tapete do corredor principal
  D.chao(19, 13, 14, 11, CH.CALCADA_PT);                                   // o pátio do meio
  const barracas = ['tenda_mercado', 'pilha_especiarias', 'arara_tapetes', 'caixotes_frutas', 'jarros', 'pilha_especiarias'];
  let k = 0;
  for (const y of [7, 13, 19, 25]) for (let x = 4; x < W - 4; x++) {
    if (x >= 23 && x <= 28) continue;                                       // o corredor do tapete fica livre
    if ((y === 13 || y === 19) && x >= 18 && x <= 33) continue;            // o pátio
    if ((x - 4) % 10 >= 7) continue;                                        // uma passagem a cada 7 barracas
    D.poe(x, y, barracas[k++ % barracas.length]);
  }
  objLargo(D.b, 26, 18, 'chafariz', 3);
  for (const [x, y] of [[19, 14], [32, 14], [19, 22], [32, 22], [4, 3], [47, 3], [4, 30], [47, 30]]) D.poe(x, y, 'lampioes_bazar');
  D.fecha(CH.PAR_TIJOLO, CH.FACE_TIJOLO, 'lanterna_arabe');
  for (const [x, y] of [[9, 4], [41, 4], [9, 10], [41, 10], [9, 16], [41, 16], [9, 22], [41, 22], [9, 29], [41, 29], [22, 16], [30, 21]]) D.grupo(x, y, 4, 2);
  return dgFim(D, c, { ex: 26, ey: 37, guia: [21, 35], quadro: [30, 35], placa: [21, 38], fechado: true, cor: '255,200,120', luzes: ['lampioes_bazar', 'lanterna_arabe'] });
}

/* ---------- 2) DOHA: o Palácio das Miragens ---------- */
function dgPalacio(c) {
  const D = dgNovo(c, 50, 42, CH.PAR_PALACIO);
  D.cava(3, 3, 44, 32, CH.PISO); D.cava(19, 35, 12, 5, CH.PISO);
  // as paredes de dentro: 9 salões, cada um com portas largas
  for (const x of [17, 31]) { D.tapa(x, 3, 2, 32); for (const y of [7, 18, 29]) D.cava(x, y, 2, 3); }
  for (const y of [13, 24]) { D.tapa(3, y, 44, 2); for (const x of [9, 23, 38]) D.cava(x, y, 3, 2); }
  D.cava(23, 34, 3, 1);
  // o pátio do meio: jardim, espelho d'água e fonte
  D.chao(19, 15, 12, 9, CH.GRAMA); D.chao(21, 17, 8, 1, CH.AGUA); D.chao(21, 21, 8, 1, CH.AGUA);
  objLargo(D.b, 25, 19, 'fonte_moderna', 3);
  for (const [x, y] of [[20, 16], [29, 16], [20, 22], [29, 22]]) D.poe(x, y, 'vaso_palacio');
  // colunas, espelhos, almofadas e vasos em cada salão
  const salas = [[3, 3, 14, 10], [19, 3, 12, 10], [33, 3, 14, 10], [3, 15, 14, 9], [33, 15, 14, 9], [3, 26, 14, 9], [19, 26, 12, 9], [33, 26, 14, 9]];
  for (const [x, y, w, h] of salas) {
    D.poe(x + 1, y, 'coluna_palacio'); D.poe(x + w - 2, y, 'coluna_palacio');
    D.poe(x + (w >> 1), y, 'espelho_miragem'); D.poe(x + 2, y + h - 2, 'almofadas'); D.poe(x + w - 3, y + h - 2, 'vaso_palacio');
    D.grupo(x + (w >> 1), y + (h >> 1) + 1, 4, 2);
  }
  D.fecha(CH.PAR_PALACIO, CH.FACE_PALACIO, 'lanterna_arabe');
  D.grupo(25, 20, 3, 2);
  return dgFim(D, c, { ex: 25, ey: 38, guia: [21, 36], quadro: [29, 36], placa: [20, 39], fechado: true, cor: '255,220,160', luzes: ['lanterna_arabe', 'espelho_miragem'] });
}

/* ---------- 3) TÓQUIO: o Grande Dojo do Sumô ---------- */
function dgDojo(c) {
  const D = dgNovo(c, 50, 40, CH.PAR_MADEIRA);
  D.cava(3, 3, 44, 22, CH.TATAME);
  for (const [x, y] of [[12, 9], [37, 9], [12, 19], [37, 19]]) D.circ(x, y, 4.2, CH.DOHYO);
  D.cava(19, 25, 12, 13, CH.TATAME);                                        // o salão da entrada
  D.cava(3, 27, 15, 8, CH.GRAMA); D.cava(32, 27, 15, 8, CH.TATAME);          // o jardim e a sala dos tambores
  D.cava(18, 30, 1, 3, CH.TATAME); D.cava(31, 30, 1, 3, CH.TATAME);
  D.chao(7, 29, 5, 3, CH.AGUA);
  for (const [x, y] of [[4, 28], [14, 28], [4, 33], [15, 33]]) D.poe(x, y, 'bonsai');
  for (const [x, y] of [[34, 28], [44, 28], [34, 33], [44, 33]]) D.poe(x, y, 'taiko');
  for (const x of [5, 20, 29, 44]) D.poe(x, 3, 'biombo');
  for (const [x, y] of [[24, 3], [25, 24], [3, 14], [46, 14], [20, 26], [29, 26]]) D.poe(x, y, 'lanterna_papel');
  D.fecha(CH.PAR_MADEIRA, CH.FACE_MADEIRA, 'lanterna_papel');
  for (const [x, y] of [[12, 9], [37, 9], [12, 19], [37, 19]]) D.grupo(x, y, 4, 3);
  D.grupo(25, 14, 3, 2); D.grupo(12, 31, 3, 2); D.grupo(39, 31, 3, 2);
  return dgFim(D, c, { ex: 25, ey: 35, guia: [21, 33], quadro: [29, 33], placa: [20, 36], fechado: true, cor: '255,200,150', luzes: ['lanterna_papel'] });
}

/* ---------- 4) MIAMI: a Academia da Muscle Beach (ao ar livre) ---------- */
function dgAcademia(c) {
  const D = dgNovo(c, 52, 42, CH.AREIA), { m, W, H } = D;
  D.cava(2, 2, 41, 38, CH.AREIA);
  for (let j = 0; j < H; j++) { m.chao[j * W + 43] = CH.AREIA_MOLHADA; for (let i = 44; i < W; i++) m.chao[j * W + i] = CH.AGUA; }
  D.cava(43, 2, 1, 38, CH.AREIA_MOLHADA);
  D.chao(2, 20, 41, 2, CH.MADEIRA); D.chao(22, 2, 2, 38, CH.MADEIRA);      // o deque de madeira em cruz
  const kit = ['rack_halteres', 'barra_fixa', 'supino', 'pneu_gigante'];
  const estacoes = [[10, 9], [34, 9], [10, 30], [34, 30], [10, 16], [34, 25]];
  estacoes.forEach(([x, y], i) => { D.poe(x - 3, y - 2, kit[i % 4]); D.poe(x + 3, y - 2, kit[(i + 1) % 4]); D.poe(x - 3, y + 2, kit[(i + 2) % 4]); D.poe(x + 3, y + 2, kit[(i + 3) % 4]); D.grupo(x, y, 3, 2); });
  for (const [x, y] of [[40, 5], [40, 35]]) objLargo(D.b, x, y, 'torre_salva', 1);
  for (const [x, y, t] of [[30, 17, 'guarda_sol'], [31, 18, 'cadeira_sol'], [16, 25, 'guarda_sol'], [15, 26, 'cadeira_sol'], [41, 20, 'guarda_sol']]) D.poe(x, y, t);
  D.abre(['coqueiro', 'palmeira_real', 'coqueiro2']);
  D.grupo(40, 14, 3, 2); D.grupo(40, 27, 3, 2);
  return dgFim(D, c, { ex: 22, ey: 37, guia: [18, 38], quadro: [27, 38], placa: [17, 36] });
}

/* ---------- 5) BUENOS AIRES: o Estaleiro do Riachuelo ---------- */
function dgEstaleiro(c) {
  const D = dgNovo(c, 52, 42, CH.CONCRETO), { m, W } = D;
  D.cava(2, 22, 48, 18, CH.CONCRETO);
  for (let j = 1; j < 22; j++) for (let i = 1; i < W - 1; i++) m.chao[j * W + i] = CH.AGUA;
  for (const x of [8, 20, 32, 44]) D.cava(x - 1, 4, 3, 18, CH.MADEIRA);  // os píeres
  D.cava(7, 4, 39, 2, CH.MADEIRA);                                          // o píer de cima liga todos
  for (const x of [8, 20, 32, 44]) { D.poe(x - 1, 21, 'guindaste_porto'); D.poe(x + 1, 7, 'barris'); D.poe(x - 1, 14, 'corda_ancora'); }
  for (const [x, y] of [[5, 26], [14, 26], [38, 26], [47, 26]]) D.poe(x, y, 'casco_barco');
  for (let x = 4; x < 48; x += 3) if (x < 20 || x > 31) D.poe(x, 31, (x / 3) % 2 < 1 ? 'caixotes_porto' : 'barris');
  D.abre([]);
  for (const x of [8, 20, 32, 44]) D.grupo(x, 12, 3, 2);
  for (const [x, y] of [[9, 28], [26, 27], [42, 28], [10, 35], [42, 35]]) D.grupo(x, y, 4, 2);
  return dgFim(D, c, { ex: 26, ey: 37, guia: [22, 38], quadro: [30, 38], placa: [21, 36] });
}

/* ---------- 6) RIO: o Barracão da Escola de Samba ---------- */
function dgBarracao(c) {
  const D = dgNovo(c, 54, 42, CH.PAR_TIJOLO);
  D.cava(2, 2, 50, 31, CH.CONCRETO); D.cava(20, 33, 14, 5, CH.CONCRETO);
  D.chao(24, 2, 6, 31, CH.TAPETE);                                          // a pista do ensaio, no meio
  for (const y of [8, 16, 24]) for (const x of [5, 12, 18, 35, 41, 47]) D.largo(x, y, 'carro_alegorico');
  for (let x = 4; x < 50; x += 4) if (x < 22 || x > 31) D.poe(x, 2, x % 8 ? 'arara_fantasias' : 'mascara_carnaval');
  for (const [x, y] of [[25, 12], [28, 20], [25, 28]]) D.poe(x, y, 'surdos');
  for (const [x, y] of [[23, 3], [30, 3], [23, 32], [30, 32]]) D.poe(x, y, 'holofote');
  D.fecha(CH.PAR_TIJOLO, CH.FACE_TIJOLO, 'tocha');
  for (const [x, y] of [[8, 5], [45, 5], [8, 12], [45, 12], [8, 20], [45, 20], [8, 28], [45, 28], [27, 8], [27, 24]]) D.grupo(x, y, 4, 2);
  return dgFim(D, c, { ex: 27, ey: 36, guia: [22, 35], quadro: [32, 35], placa: [21, 37], fechado: true, cor: '255,230,170', luzes: ['holofote', 'tocha'] });
}

/* ---------- 7) LISBOA: o Porão da Caravela ---------- */
function dgCaravela(c) {
  const D = dgNovo(c, 44, 44, CH.PAR_MADEIRA), cx = 22;
  for (let y = 3; y <= 38; y++) { const meia = y < 15 ? Math.round(1 + (y - 3) * 1.15) : 14; D.cava(cx - meia, y, meia * 2 + 1, 1, CH.MADEIRA); }
  for (const y of [14, 23, 31]) { D.tapa(1, y, 42, 1); for (const x of [cx - 1, cx - 10, cx + 8]) D.cava(x, y, 3, 1, CH.MADEIRA); }
  D.cava(18, 38, 9, 4, CH.MADEIRA);
  for (const y of [9, 19, 27]) D.poe(cx, y, 'mastro');
  D.poe(cx, 5, 'bau_tesouro');
  for (const [x, y] of [[cx - 12, 16], [cx + 12, 16], [cx - 12, 25], [cx + 12, 25], [cx - 7, 12], [cx + 7, 12]]) D.poe(x, y, 'barris');
  for (const [x, y] of [[cx - 12, 21], [cx + 12, 21]]) D.poe(x, y, 'rede_pesca');
  for (const [x, y] of [[cx - 12, 29], [cx + 12, 29]]) D.poe(x, y, 'corda_ancora');
  D.poe(cx, 34, 'mesa_mapas'); D.poe(cx - 11, 36, 'bau_tesouro'); D.poe(cx + 11, 36, 'barris');
  D.fecha(CH.PAR_MADEIRA, CH.FACE_MADEIRA, 'tocha');
  for (const [x, y] of [[cx, 10], [cx - 7, 18], [cx + 7, 18], [cx - 7, 27], [cx + 7, 27], [cx - 6, 34], [cx + 6, 34]]) D.grupo(x, y, 4, 2);
  return dgFim(D, c, { ex: 22, ey: 40, guia: [19, 39], quadro: [26, 39], placa: [18, 40], fechado: true, cor: '255,190,110', luzes: ['tocha'] });
}

/* ---------- 8) PARIS: o Labirinto de Versalhes (um labirinto de verdade, com a fonte no meio) ---------- */
function dgLabirinto(c) {
  const COLS = 10, LINS = 7, W = COLS * 5 + 5, H = LINS * 5 + 10;
  const D = dgNovo(c, W, H, CH.SEBE), r = D.r;
  const cel = (i, j) => [4 + i * 5, 4 + j * 5];                            // canto do corredor (3×3) da célula
  const visto = new Set(), pilha = [[5, LINS - 1]]; visto.add('5,' + (LINS - 1));
  D.cava(...cel(5, LINS - 1), 3, 3, CH.AREIA);
  const centro = new Set(['4,2', '5,2', '4,3', '5,3']);                     // o miolo com a fonte
  while (pilha.length) {
    const [i, j] = pilha[pilha.length - 1];
    const viz = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, bb]) => [i + a, j + bb]).filter(([a, bb]) => a >= 0 && bb >= 0 && a < COLS && bb < LINS && !visto.has(a + ',' + bb));
    if (!viz.length) { pilha.pop(); continue; }
    const [a, bb] = viz[(r() * viz.length) | 0]; visto.add(a + ',' + bb); pilha.push([a, bb]);
    const [x0, y0] = cel(i, j), [x1, y1] = cel(a, bb);
    D.cava(x1, y1, 3, 3, CH.AREIA); D.cava(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) + 3, Math.abs(y1 - y0) + 3, CH.AREIA);
  }
  // o miolo: uma praça com a fonte (as sebes de dentro somem)
  const [px, py] = cel(4, 2); D.cava(px - 1, py - 1, 10, 10, CH.PEDRA);
  objLargo(D.b, px + 4, py + 4, 'fonte_italiana', 3);
  // a entrada: por baixo, no meio
  const [ex0] = cel(5, LINS - 1); D.cava(ex0, 4 + LINS * 5 - 2, 3, 3, CH.AREIA); D.cava(ex0 - 5, 4 + LINS * 5, 13, 5, CH.PEDRA);
  // becos sem saída: estátuas, roseiras, topiarias e bancos
  const enfeites = ['estatua_jardim', 'roseira', 'topiaria', 'banco_jardim'];
  let k = 0; const livres = [];
  for (let j = 0; j < LINS; j++) for (let i = 0; i < COLS; i++) {
    if (centro.has(i + ',' + j)) continue;
    const [x, y] = cel(i, j); let saidas = 0;
    if (D.eh(x + 1, y - 1)) saidas++; if (D.eh(x + 1, y + 3)) saidas++; if (D.eh(x - 1, y + 1)) saidas++; if (D.eh(x + 3, y + 1)) saidas++;
    if (saidas === 1) D.poe(x + 1, y + 1, enfeites[k++ % 4]); else livres.push([x + 1, y + 1]);
  }
  D.fecha(CH.SEBE, CH.FACE_SEBE, 'topiaria');
  for (let n = livres.length - 1; n > 0; n--) { const q = (r() * (n + 1)) | 0; [livres[n], livres[q]] = [livres[q], livres[n]]; }
  const perto = (a, lista) => lista.some(p => Math.abs(p[0] - a[0]) + Math.abs(p[1] - a[1]) < 9);
  const postos = []; for (const p of livres) { if (postos.length >= 9) break; if (p[1] > 4 + (LINS - 1) * 5 - 1 && Math.abs(p[0] - (ex0 + 1)) < 8) continue; if (!perto(p, postos)) postos.push(p); }
  for (const [x, y] of postos) D.grupo(x, y, 3, 2);
  D.grupo(px + 4, py + 7, 4, 2);
  const ey = 4 + LINS * 5 + 3, ex = ex0 + 1;
  return dgFim(D, c, { ex, ey, guia: [ex - 4, ey - 1], quadro: [ex + 4, ey - 1], placa: [ex - 5, ey + 1] });
}

/* ---------- 9) MUNIQUE: a Oficina do Relógio Gigante ---------- */
function dgRelogio(c) {
  const D = dgNovo(c, 50, 46, CH.PAR_TIJOLO), cx = 25, cy = 19;
  D.circ(cx, cy, 13.4, CH.CALCADA);                                         // o mostrador
  D.chao(cx - 1, cy - 11, 2, 11, CH.MADEIRA); D.chao(cx, cy - 1, 8, 2, CH.MADEIRA); // os ponteiros (meio-dia e quinze)
  for (let h = 0; h < 12; h++) { const a = h * Math.PI / 6; D.poe(Math.round(cx + Math.sin(a) * 11), Math.round(cy - Math.cos(a) * 11), h % 3 ? 'engrenagem' : 'pendulo'); }
  D.poe(cx - 2, cy + 2, 'engrenagem'); D.poe(cx + 2, cy + 2, 'engrenagem');
  // quatro oficinas nos cantos, ligadas ao mostrador
  for (const [x, y] of [[2, 2], [38, 2], [2, 29], [38, 29]]) {
    D.cava(x, y, 10, 8, CH.MADEIRA);
    D.poe(x + 1, y, 'bancada_relojoeiro'); D.poe(x + 8, y, 'relogio_cuco'); D.poe(x + 1, y + 7, 'relogio_cuco');
  }
  D.cava(11, 7, 8, 3, CH.MADEIRA); D.cava(31, 7, 8, 3, CH.MADEIRA); D.cava(11, 29, 8, 3, CH.MADEIRA); D.cava(31, 29, 8, 3, CH.MADEIRA);
  D.cava(23, 32, 5, 4, CH.MADEIRA); D.cava(19, 35, 12, 7, CH.MADEIRA);      // o corredor até a entrada
  D.fecha(CH.PAR_TIJOLO, CH.FACE_TIJOLO, 'tocha');
  for (const [x, y] of [[cx, cy - 6], [cx + 6, cy + 4], [cx - 6, cy + 4], [cx - 7, cy - 4], [7, 6], [43, 6], [7, 33], [43, 33]]) D.grupo(x, y, 4, 2);
  return dgFim(D, c, { ex: 25, ey: 40, guia: [21, 38], quadro: [29, 38], placa: [20, 41], fechado: true, cor: '255,210,140', luzes: ['tocha'] });
}

/* ---------- 10) MILÃO: a Passarela da Moda ---------- */
function dgPassarela(c) {
  const D = dgNovo(c, 50, 44, CH.PAR_MODA);
  D.cava(3, 10, 44, 24, CH.PISO); D.cava(3, 2, 44, 7, CH.PISO);             // a plateia e os camarins
  for (const x of [10, 24, 38]) D.cava(x, 9, 3, 1, CH.PISO);
  D.chao(23, 10, 4, 24, CH.TAPETE);                                          // a passarela
  for (const y of [14, 18, 22, 26, 30]) for (let x = 5; x < 45; x += 2) if (x < 21 || x > 28) if (x !== 13 && x !== 37 && x !== 11 && x !== 39) D.poe(x, y, 'poltronas_plateia');
  for (const [x, y] of [[22, 11], [27, 11], [22, 32], [27, 32]]) D.poe(x, y, 'holofote');
  for (let x = 4; x < 46; x += 3) if (x < 9 || (x > 13 && x < 23) || (x > 27 && x < 37) || x > 41) D.poe(x, 2, [ 'arara_roupas', 'manequim', 'espelho_camarim'][(x / 3 | 0) % 3]);
  D.cava(19, 34, 12, 6, CH.PISO);
  D.fecha(CH.PAR_MODA, CH.FACE_MODA, 'holofote');
  for (const [x, y] of [[25, 15], [25, 26], [12, 16], [38, 16], [12, 28], [38, 28], [8, 5], [42, 5], [25, 5]]) D.grupo(x, y, 4, 2);
  return dgFim(D, c, { ex: 25, ey: 37, guia: [21, 35], quadro: [29, 35], placa: [20, 38], fechado: true, cor: '255,225,245', luzes: ['holofote'] });
}

/* ---------- as dez áreas ---------- */
{
  const g = (pele, cor, extra) => lkGuia(pele, cor, extra);
  const NOVAS = [
    { id: 'caca_bazar', nome: 'Bazar Coberto do Khan', host: 'cairo', m: 'cairo_rapido', tema: 'bazar', ent: 'ent_bazar', cria: dgBazar, guia: 'Seu Farid, o mercador', look: g('pele-morena', '#c8903a', { chapeu: null, corCabelo: 'preto' }) },
    { id: 'caca_miragem', nome: 'Palácio das Miragens', host: 'doha', m: 'doha_meia', tema: 'palacio', ent: 'ent_palacio', cria: dgPalacio, guia: 'Amira, a guardiã do palácio', look: g('pele-morena', '#8a1a3a', { corpo: 'f', cabelo: 'cabelo-coque', corCabelo: 'preto', chapeu: null }) },
    { id: 'caca_dojo', nome: 'Grande Dojo do Sumô', host: 'toquio', m: 'toquio_zagueiro', tema: 'dojo', ent: 'ent_dojo', cria: dgDojo, guia: 'Mestre Takeshi, o juiz do sumô', look: g('pele-clara', '#2a2a3a', { corCabelo: 'grisalho', chapeu: null }) },
    { id: 'caca_academia', nome: 'Academia da Muscle Beach', host: 'miami', m: 'miami_zagueiro', tema: 'academia', ent: 'ent_academia', cria: dgAcademia, guia: 'Coach Brenda, a treinadora', look: g('pele-negra', '#ff5ad0', { corpo: 'f', cabelo: 'cabelo-black-power', corCabelo: 'preto' }) },
    { id: 'caca_estaleiro', nome: 'Estaleiro do Riachuelo', host: 'buenos', m: 'buenos_rapido', tema: 'estaleiro', ent: 'ent_estaleiro', cria: dgEstaleiro, guia: 'Don Ernesto, o carpinteiro naval', look: g('pele-clara', '#1a3ab9', { corCabelo: 'grisalho' }) },
    { id: 'caca_barracao', nome: 'Barracão da Escola de Samba', host: 'rio', m: 'rio_meia', tema: 'barracao', ent: 'ent_barracao', cria: dgBarracao, guia: 'Mestre-sala Jorginho', look: g('pele-retinta', '#f8d838', { chapeu: null }) },
    { id: 'caca_caravela', nome: 'Porão da Caravela', host: 'lisboa', m: 'central_belem', tema: 'caravela', ent: 'ent_caravela', cria: dgCaravela, guia: 'Capitã Leonor, a navegadora', look: g('pele-clara', '#1a2a6a', { corpo: 'f', cabelo: 'cabelo-coque', corCabelo: 'castanho' }) },
    { id: 'caca_labirinto', nome: 'Labirinto de Versalhes', host: 'paris', m: 'paris_rapido', tema: 'labirinto', ent: 'ent_labirinto', cria: dgLabirinto, guia: 'Monsieur Pierre, o jardineiro', look: g('pele-clara', '#2a7a3a', { chapeu: 'chapeu-palha' }) },
    { id: 'caca_relogio', nome: 'Oficina do Relógio Gigante', host: 'munique', m: 'munique_meia', tema: 'relogio', ent: 'ent_relogio', cria: dgRelogio, guia: 'Meister Otto, o relojoeiro', look: g('pele-clara', '#6a4a2a', { corCabelo: 'grisalho', chapeu: null }) },
    { id: 'caca_passarela', nome: 'Passarela da Moda', host: 'milao', m: 'milao_rapido', tema: 'moda', ent: 'ent_passarela', cria: dgPassarela, guia: 'Signora Valentina, a estilista', look: g('pele-clara', '#1a1a1a', { corpo: 'f', cabelo: 'cabelo-liso-longo', corCabelo: 'preto', chapeu: null }) },
  ];
  // temas (o jogo consulta TEMAS_CACA para saber se é ao ar livre)
  Object.assign(TEMAS_CACA, {
    bazar: { chao: CH.ARENITO, parede: CH.PAR_TIJOLO, props: [] }, palacio: { chao: CH.PISO, parede: CH.PAR_PALACIO, props: [] }, dojo: { chao: CH.TATAME, parede: CH.PAR_MADEIRA, props: [] },
    academia: { aberto: 1, chao: CH.AREIA, borda: [], props: [] }, estaleiro: { aberto: 1, chao: CH.CONCRETO, borda: [], props: [] }, barracao: { chao: CH.CONCRETO, parede: CH.PAR_TIJOLO, props: [] },
    caravela: { chao: CH.MADEIRA, parede: CH.PAR_MADEIRA, props: [] }, labirinto: { aberto: 1, chao: CH.AREIA, borda: [], props: [] }, relogio: { chao: CH.CALCADA, parede: CH.PAR_TIJOLO, props: [] },
    moda: { chao: CH.PISO, parede: CH.PAR_MODA, props: [] },
  });
  NOVAS.forEach((c, i) => {
    if (!MONSTROS[c.m] || !MAPAS_DEF[c.host]) return;
    c.seed = 8801 + i * 113;
    registraCaca(c);
    MAPAS_DEF[c.id] = () => c.cria(c);                       // o desenho próprio no lugar do gerador de cavernas
    if (typeof PAPEL !== 'undefined' && !PAPEL['guia_' + c.id]) PAPEL['guia_' + c.id] = c.look.corpo === 'f' ? 'adulta' : 'adulto';
  });
}
