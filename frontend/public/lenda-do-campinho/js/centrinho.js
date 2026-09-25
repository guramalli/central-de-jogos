/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   CENTRINHO: os NPCs de loja e de missão ficam juntos numa pracinha
   (com barraquinhas), no meio de onde eles já ficavam — longe dos adversários.
   Ficam onde estão: professores que dão aula no campo/quadra,
   motorista do ônibus e comissária do aeroporto.
   Roda logo depois do mapa pronto — antes de arenas/casas/montarias.
   A Vila já tem a pracinha dela (Seu Juca). Carregar DEPOIS de espalha.js.
   ============================================================ */
const MAPAS_CENTRINHO = ['praia', 'cidade', 'ct', 'estadio', 'lisboa', 'madri', 'londres'];
function vaiProCentrinho(n) {
  const d = NPCS[n.id] || {};
  if (d.professor || d.aviao || d.onibus) return false;
  return !!(d.loja || d.refino || d.cura || d.quiz || d.empresario || d.quadro || /^(lider_|loja_|lojista_)/.test(n.id) || MISSOES.some(q => q.npc === n.id));
}
function montaCentrinho(m) {
  const mov = m.npcs.filter(vaiProCentrinho); if (mov.length < 2) return;
  const porLinha = 4, linhas = Math.ceil(mov.length / porLinha);
  const W = 1 + porLinha * 3, H = 2 + linhas * 3; // barraca + NPC a cada 3 quadros; linhas de 3 de altura
  const W0 = m.w, idx = (x, y) => y * W0 + x;
  // enfeite solto (árvore, poste, lixeira, carro...) pode sair do lugar da pracinha; prédio, cerca, placa, gol etc. não
  const FIXOS = new Set(['x', 'grade', 'rede', 'arquibancada', 'grafite', 'placa', 'gol', 'ponto_onibus', 'quiosque', 'torre', 'holofote', 'placar', 'banco_reservas', 'bau', 'quadro']);
  const fixo = o => o && (o.predio || FIXOS.has(o.t));
  const ini = m.inicio || { x: -9, y: -9 };
  const ocupado = (x, y) => x < 1 || y < 1 || x >= m.w - 1 || y >= m.h - 1 || fixo(m.obj[idx(x, y)]) || !CH_ANDA(m.chao[idx(x, y)]) || m.chao[idx(x, y)] === CH.AGUA
    || (Math.abs(x - ini.x) <= 1 && Math.abs(y - ini.y) <= 1)
    || m.saidas.some(s => s.x === x && s.y === y) || m.npcs.some(n => !mov.includes(n) && n.x === x && n.y === y)
    || m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h)
    || (m.zonas || []).some(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h)
    || m.pontos.some(p => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1);
  // longe de onde os adversários ficam (ninguém quer fazer compras levando drible)
  const rivais = m.spawns.filter(sp => MONSTROS[sp.m] && !MONSTROS[sp.m].treino);
  const pertoDeRival = (x0, y0) => rivais.some(sp => { const folga = (sp.raio || 1) + 3; return sp.x >= x0 - folga && sp.x < x0 + W + folga && sp.y >= y0 - folga && sp.y < y0 + H + folga; });
  const cabe = (x0, y0) => { if (pertoDeRival(x0, y0)) return false; for (let y = y0 - 1; y <= y0 + H; y++) for (let x = x0 - 1; x <= x0 + W; x++) if (ocupado(x, y)) return false; return true; };
  // o centrinho nasce no meio de onde esses NPCs já ficavam (normalmente o centro, na rua principal)
  const c = { x: Math.round(mov.reduce((s, n) => s + n.x, 0) / mov.length), y: Math.round(mov.reduce((s, n) => s + n.y, 0) / mov.length) };
  let achou = null;
  for (let r = 2; r < 40 && !achou; r++) for (let dy = -r; dy <= r && !achou; dy++) for (let dx = -r; dx <= r && !achou; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x0 = c.x + dx - (W >> 1), y0 = c.y + dy - (H >> 1);
    if (cabe(x0, y0)) achou = { x: x0, y: y0 };
  }
  if (!achou) return;
  const { x: X0, y: Y0 } = achou;
  // pracinha de pedra
  for (let y = Y0; y < Y0 + H; y++) for (let x = X0; x < X0 + W; x++) { m.chao[idx(x, y)] = CH.PEDRA; m.obj[idx(x, y)] = null; } // tira os enfeites soltos
  for (let y = Y0 - 1; y <= Y0 + H; y++) for (let x = X0 - 1; x <= X0 + W; x++) if ((y === Y0 - 1 || y === Y0 + H || x === X0 - 1 || x === X0 + W) && m.obj[idx(x, y)] && !fixo(m.obj[idx(x, y)])) m.obj[idx(x, y)] = null; // e deixa uma volta livre pra passar
  const poe = (x, y, t) => { m.obj[idx(x, y)] = { t, v: (hash2(x, y) * 1000) | 0 }; };
  const barracas = ['banca', 'guarda_sol'];
  mov.forEach((n, i) => {
    const lin = Math.floor(i / porLinha), col = i % porLinha;
    const bx = X0 + 1 + col * 3, by = Y0 + lin * 3;
    poe(bx, by, barracas[(i + lin) % 2]);    // barraquinha atrás
    n.x = bx; n.y = by + 1;                   // o NPC na frente dela
  });
  // enfeites nos cantos + placa
  poe(X0, Y0 + H - 1, 'vaso'); poe(X0 + W - 1, Y0 + H - 1, 'vaso');
  poe(X0 + W - 1, Y0, 'poste');
  m.obj[idx(X0, Y0)] = { t: 'placa', v: 1 }; m.placas.push({ x: X0, y: Y0, texto: 'CENTRINHO — lojas e missões' });
  m.centrinho = { x: X0, y: Y0, w: W, h: H };
}
(function () {
  const ids = [...MAPAS_CENTRINHO, ...(typeof CIDADES !== 'undefined' ? CIDADES.map(c => c.id) : [])];
  for (const id of ids) {
    const base = MAPAS_DEF[id]; if (!base) continue;
    MAPAS_DEF[id] = function () { const m = base(); try { montaCentrinho(m); } catch (e) { console.error('centrinho', id, e); } return m; };
  }
})();
