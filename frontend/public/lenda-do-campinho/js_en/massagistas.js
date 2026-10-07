/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧃 MASSAGISTAS DO ARMAZÉM (v216), como os vendedores de poção ao lado do depot no Tibia:
   do lado de cada baú de armazém fica um(a) massagista que vende os itens de batalha
   (todas as Garrafas de Fôlego e Isotônicos de Foco, do Mini ao Lendário) e compra loot.
   Só fica num lugar livre ao lado do baú que não feche nenhum caminho; a frente do baú continua livre.
   Carregar DEPOIS de todos os arquivos que mexem nos mapas (é o último a mexer).
   ============================================================ */
const MASSAGISTAS = {
  vila: ['Masseur Bené', 'm'], praia: ['Masseuse Dora', 'f'], cidade: ['Masseur Juca', 'm'], ct: ['Masseuse Lúcia', 'f'], estadio: ['Masseur Tonho', 'm'],
  cairo: ['Masseur Samir', 'm'], toquio: ['Masseuse Aiko', 'f'], doha: ['Masseuse Nadia', 'f'], miami: ['Masseur Joe', 'm'], lisboa: ['Masseuse Inês', 'f'],
  madri: ['Masseur Paco', 'm'], milao: ['Masseuse Giulia', 'f'], munique: ['Masseur Hans', 'm'], londres: ['Masseuse Olivia', 'f'], paris: ['Masseuse Amélie', 'f'],
  buenos: ['Masseur Tito', 'm'], rio: ['Masseuse Dalva', 'f'] /* v407 (Raio-X): era Glória, igual à técnica da seleção */, santos: ['Masseur Zeca', 'm'],
};
const LOJA_BATALHA = ['agua', 'isotonico', 'acai', 'suco_verde', 'vitamina', 'agua_coco', 'energetico', 'guarana', 'kit_massagista', 'isotonico_pro', 'elixir_mar', 'perola_azul', 'soro_estelar', 'cristal_foco'];
const PELES_MASS = ['pele-morena', 'pele-negra', 'pele-clara', 'pele-media'];
Object.entries(MASSAGISTAS).forEach(([mapa, [nome, corpo]], k) => {
  NPCS['massagista_' + mapa] = {
    nome, ola: 'Going hunting? Stock up! I\'ve got Stamina Bottles and Focus Drinks in every size. And I buy whatever you bring back from the hunt.',
    loja: LOJA_BATALHA.filter(id => ITENS[id]),
    // v407 (Raio-X, NPCs distintos): antes de camiseta e shorts, iguais ao boneco do jogador iniciante; agora com o uniforme
    // do departamento médico (jaleco branco, calça de agasalho verde e apito) e penteados variados
    look: { tipo: 'humano', corpo, alt: corpo === 'f' ? 1.64 : 1.72, pele: PELES_MASS[k % PELES_MASS.length], cabelo: corpo === 'f' ? ['cabelo-rabo', 'cabelo-coque', 'cabelo-cacheado'][k % 3] : ['cabelo-curto', 'cabelo-black-power', 'cabelo-topete'][k % 3], corCabelo: k % 3 ? 'preto' : 'castanho',
      roupa: 'roupa-jaleco', corRoupa: '#f4f7fb', baixo: 'baixo-moletom', corBaixo: '#2aa86a', pescoco: 'pescoco-apito' },
  };
});
function poeMassagista(m, id) {
  const bau = (m.pontos || []).find(p => p.tipo === 'armazem'); if (!bau) return false;
  const i = (x, y) => y * m.w + x;
  // começa a conferir os caminhos de um quadro livre (na Praia o ponto de renascer tem um vaso em cima)
  const inicio = [m.renasce, m.inicio, { x: bau.x, y: bau.y + 1 }].find(p => p && !tileBloqueado(m, p.x, p.y)) || { x: bau.x, y: bau.y + 1 };
  const antes = alcancaveis(m, inicio), importantes = pontosImportantes(m).filter(pt => antes[i(pt.x, pt.y)]);
  const ct = m.centroTreino;
  const livre = (x, y) => x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1 && !m.obj[i(x, y)] && CH_ANDA(m.chao[i(x, y)]) && m.chao[i(x, y)] !== CH.AGUA
    && !(x === bau.x && y === bau.y + 1) // a frente do baú fica livre
    && !m.npcs.some(n => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1)
    && !m.saidas.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1)
    && !m.pontos.some(p => p !== bau && Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1)
    && !m.spawns.some(s => s.x === x && s.y === y)
    && !m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h)
    && !(ct && ct.X != null && x >= ct.X - 1 && x <= ct.X + ct.W && y >= ct.Y - 1 && y <= ct.Y + ct.H);
  // escolhe o lado do baú com mais espaço: longe de portas, saídas e pessoas, fora da rua e com menos coisas em volta
  const ruas = typeof tiposRua === 'function' ? tiposRua(m.id) : new Set();
  const portas = [...m.saidas.map(s => ({ x: s.x, y: s.y + (s.porta ? 1 : 0) })), ...m.predios.filter(p => p.porta).map(p => ({ x: p.porta.x, y: p.porta.y + 1 }))];
  const cheb = (a, x, y) => Math.max(Math.abs(a.x - x), Math.abs(a.y - y));
  const nota = (x, y, dx, dy) => {
    let n = dy === 0 ? (Math.abs(dx) === 1 ? 4 : 2) : dy === 1 ? 1 : 0; // colado do lado do baú é o melhor
    n += Math.min(3, ...portas.map(p => cheb(p, x, y)), ...m.npcs.map(p => cheb(p, x, y)));
    if (ruas.has(m.chao[i(x, y)])) n -= 3;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const o = m.obj[i(x + a, y + b)]; if (o && !(x + a === bau.x && y + b === bau.y)) n -= 1; }
    if (m.predios.some(p => x >= p.x - 1 && x <= p.x + p.w && y >= p.y + p.h && y <= p.y + p.h)) n -= 1; // colado na parede de um prédio
    return n;
  };
  const cands = [[-1, 0], [1, 0], [-2, 0], [2, 0], [-1, 1], [1, 1], [-1, -1], [1, -1]].map(([dx, dy]) => ({ x: bau.x + dx, y: bau.y + dy, dx, dy }))
    .filter(c => livre(c.x, c.y)).map(c => ({ ...c, n: nota(c.x, c.y, c.dx, c.dy) })).sort((a, b) => b.n - a.n);
  for (const { x, y } of cands) {
    m.obj[i(x, y)] = { t: 'x', v: 0 }; // a pessoa ocupa o quadro: confere se não fecha nenhum caminho
    const depois = alcancaveis(m, inicio);
    const falaCom = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([a, b]) => depois[i(x + a, y + b)]);
    m.obj[i(x, y)] = null;
    if (!falaCom || !depois[i(bau.x, bau.y + 1)] || !importantes.every(pt => depois[i(pt.x, pt.y)])) continue;
    m.npcs.push({ id, x, y }); return true;
  }
  console.warn('masseur with no spot next to the storage:', m.id); return false;
}
for (const mapa of Object.keys(MASSAGISTAS)) {
  const base = MAPAS_DEF[mapa]; if (!base) continue;
  MAPAS_DEF[mapa] = function () { const m = base(); try { poeMassagista(m, 'massagista_' + mapa); } catch (e) { console.error('massagista', mapa, e); } return m; };
}
