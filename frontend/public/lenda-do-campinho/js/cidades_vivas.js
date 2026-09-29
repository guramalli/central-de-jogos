/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🗺️ CIDADES COM CARA PRÓPRIA (v263)
   As 10 cidades do "molde" (Cairo, Doha, Tóquio, Miami, Buenos Aires, Rio, Lisboa, Paris,
   Munique, Milão) nasciam com os adversários sempre nos MESMOS lugares (pontas no alto à esquerda,
   zagueiros e meias no campo...). Agora cada cidade sorteia os lugares dos grupos com a SUA semente:
   fica diferente de uma cidade para a outra, mas igual toda vez que você volta.
   Regras: lugar alcançável a pé, com espaço em volta; longe da chegada, dos NPCs, das portas e
   entradas, do chefão e dos bonecos de treino; grupos afastados entre si. Torcedores (que andam em
   grupo) continuam no bairro deles; o chefão continua no território dele.
   Carregar POR ÚLTIMO (depois de cacadas.js e de tudo que mexe nos mapas das cidades).
   ============================================================ */
const CIDADES_MOLDE = ['cairo', 'doha', 'toquio', 'miami', 'buenos', 'rio', 'lisboa', 'paris', 'munique', 'milao'];
function sementeTexto(t) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function espalhaAdversarios(m) {
  const W = m.w, H = m.h, r = mulberry(sementeTexto(m.id + ':v263'));
  const bloq = (x, y) => { if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return true; const i = y * W + x, o = m.obj[i]; return m.chao[i] === CH.AGUA || !CH_ANDA(m.chao[i]) || !!(o && (o.predio || OBJ_BLOQUEIA.has(o.t))); };
  // o que dá para alcançar andando a partir da chegada
  const ini = m.inicio || { x: W >> 1, y: H >> 1 }, alc = new Uint8Array(W * H), fila = [[ini.x, ini.y]]; alc[ini.y * W + ini.x] = 1;
  while (fila.length) { const [x, y] = fila.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (bloq(nx, ny) || alc[ny * W + nx]) continue; alc[ny * W + nx] = 1; fila.push([nx, ny]); } }
  const mexe = m.spawns.filter(sp => { const d = MONSTROS[sp.m]; return d && !d.chefe && !d.treino && !d.grupo && !d.pedra; });
  if (!mexe.length) return;
  const fixos = m.spawns.filter(sp => !mexe.includes(sp)); // chefão, bonecos, torcedores
  const perto = (x, y, lista, d) => lista.some(p => Math.hypot(p.x - x, p.y - y) < d);
  const hostis = (m.zonas || []).filter(z => z.hostil);
  const bom = (x, y) => {
    if (!alc[y * W + x] || Math.hypot(x - ini.x, y - ini.y) < 10) return false;
    if (perto(x, y, m.npcs, 5) || perto(x, y, m.saidas, 7) || perto(x, y, fixos, 7)) return false;
    if ((m.renasce && Math.hypot(x - m.renasce.x, y - m.renasce.y) < 8)) return false;
    if (hostis.some(z => x >= z.x - 1 && x <= z.x + z.w && y >= z.y - 1 && y <= z.y + z.h)) return false;
    if ((m.predios || []).some(p => x >= p.x - 2 && x <= p.x + p.w + 1 && y >= p.y - 2 && y <= p.y + p.h + 2)) return false;
    let livres = 0; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const a = x + i, b = y + j; if (a > 0 && b > 0 && a < W && b < H && alc[b * W + a] && !bloq(a, b)) livres++; }
    return livres >= 26; // espaço para o grupo andar
  };
  const cand = []; for (let y = 3; y < H - 3; y += 2) for (let x = 3; x < W - 3; x += 2) if (bom(x, y)) cand.push({ x, y });
  if (cand.length < mexe.length) return; // (não deve acontecer) — deixa como estava
  for (let i = cand.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [cand[i], cand[j]] = [cand[j], cand[i]]; }
  const postos = [];
  for (const sp of mexe.slice().sort((a, b) => b.qtd - a.qtd)) {
    let achou = null;
    for (const dmin of [14, 11, 8, 6]) { achou = cand.find(c => !perto(c.x, c.y, postos, dmin)); if (achou) break; }
    if (!achou) continue;
    postos.push(achou); sp.x = achou.x; sp.y = achou.y;
  }
  m.espalhado = true;
}
for (const id of CIDADES_MOLDE) {
  const base = MAPAS_DEF[id]; if (!base) continue;
  MAPAS_DEF[id] = function () { const m = base.apply(this, arguments); try { espalhaAdversarios(m); } catch (e) { console.warn('espalhaAdversarios', id, e); } return m; };
}
// se algum mapa já foi montado antes deste arquivo carregar, espalha nele também
for (const id of CIDADES_MOLDE) if (typeof MAPAS !== 'undefined' && MAPAS[id] && !MAPAS[id].espalhado) try { espalhaAdversarios(MAPAS[id]); } catch (e) { }
