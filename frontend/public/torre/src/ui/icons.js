// Ícones em pixel art (16×16) das melhorias e emblemas da árvore de avanços, desenhados por mapa de pixels.
// O contorno escuro é aplicado automaticamente pelo makeSprite.
import { fromGrid, makeSprite, shade } from '../render/sprites.js';

const P = {
  k: '#1b1622', w: '#f4f1e6', y: '#ffd23a', Y: '#e0ae1a', o: '#ff8a1e', O: '#c96a10', r: '#c0573f', R: '#8e3b2a',
  g: '#a9b0bd', G: '#6b7183', d: '#3b4152', b: '#4f88b0', B: '#2b5d86', l: '#bfe3ff', n: '#8b5a2b', N: '#5e3c1c',
  s: '#e0a878', S: '#b9805a', p: '#a08ae8', e: '#6fd08c', E: '#3f9a5c', c: '#5fb8ff', m: '#d94a3a', f: '#ffb43a',
};

export const ICONS = {
  pedreiro: [
    '................', '......yyyy......', '....yyywwyyy....', '...yyyyyyyyyy...', '...yyyyyyyyyy...', '..YYYYYYYYYYYY..',
    '....ssssssss....', '....skssssks....', '....ssssssss....', '.....ssSSss.....', '......ssss......', '....oowwwwoo....',
    '...ooowooowooo..', '...ooowooowooo..', '...oooooooooo...', '................'],
  treino: [
    '................', '.......ee.......', '......eeee......', '.....eeeeee.....', '.......ee.......', '.......ee.......',
    '..bbbbb..bbbbb..', '..bwwwb..bwwwb..', '..bwwwbbbbwwwb..', '..bwwwwbbwwwwb..', '..bwwwwbbwwwwb..', '..bwwwwbbwwwwb..',
    '..bbbbbbbbbbbb..', '...BBBBBBBBBB...', '................', '................'],
  ferram: [
    '................', '................', '..yyyyyyyy......', '..yywwyyyyggggg.', '..yyyyyyyyggggg.', '..YYYYYYYY..g...',
    '....dd..........', '....dd..........', '...dddd.........', '...dddd.........', '...dddd.........', '...dddd.........',
    '..dddddd........', '..GGGGGG........', '................', '................'],
  mestre: [
    '................', '......wwww......', '....wwwwwwww....', '...wwwwwwwwww...', '..gggggggggggg..', '....ssssssss....',
    '....skssssks....', '....ssssssss....', '.....ssssss.....', '...nnnnnn.......', '...nwwwwn.oooo..', '...nwkkwn.oooo..',
    '...nwwwwn.oooo..', '...nwkkwn.oooo..', '...nnnnnn.......', '................'],
  fornec: [
    '................', '................', '................', '.....rrrrrrr....', '.....rrrrrrr....', '.....RRRRRRR....',
    '..rrrrrrr.rrrrr.', '..rrrrrrr.rrrrr.', '..RRRRRRR.RRRRR.', 'rrrrrr.rrrrrrr..', 'rrrrrr.rrrrrrr..', 'RRRRRR.RRRRRRR..',
    'nnnnnnnnnnnnnnn.', 'NNNNNNNNNNNNNNN.', '................', '................'],
  caminhao: [
    '................', '................', '................', '.gggggggg.......', '.gwwwgggggbbbb..', '.ggggggggbllbb..',
    '.gggggggggbllbb.', 'ooooooooooobbbbb', 'ooooooooooobbbbb', 'OOOOOOOOOOOBBBBB', '..ddd.....ddd...', '.ddgdd...ddgdd..',
    '..ddd.....ddd...', '................', '................', '................'],
  olaria: [
    '................', '.........gg.....', '........g.......', '.........gg.....', '.........RR.....', '.........RR.....',
    '...rrrrrrRRrr...', '..rrrrrrrrrrrr..', '..rRRRRRRRRRRr..', '..rrrrrrrrrrrr..', '..rrrkkkkkrrrr..', '..rrrkfofkrrrr..',
    '..rrrkofokrrrr..', '..RRRRRRRRRRRR..', '................', '................'],
  premold: [
    '................', '................', '.....gggggg.....', '....gwwwwwgg....', '...gggggggggg...', '...ggGgggGggG...',
    '...ggggggggggG..', '...GGGGGGGGGGG..', '..gggggg.gggggg.', '..gwwwwg.gwwwwg.', '..ggggGG.ggggGG.', '..ggggGG.ggggGG.',
    '..GGGGGG.GGGGGG.', '................', '................', '................'],
  elevador: [
    '................', '..dddddddddddd..', '..d..........d..', '..d....gg....d..', '..d....gg....d..', '..d.yyyyyyyy.d..',
    '..d.ydddddy.d...', '..d.ydrrrdy..d..', '..d.ydrrrdy..d..', '..d.ydrrrdy..d..', '..d.yyyyyyyy.d..', '..d..........d..',
    '..d..........d..', '..dddddddddddd..', '................', '................'],
  cacamba: [
    '................', '................', '................', '................', '....rrrrr.......', '...rrrrrrr......',
    '..ggggggggggg...', '..gwwwwwwwwgg...', '...ggggggggg..n.', '....GGGGGGG..n..', '.....ddd....n...', '....ddgdd.nn....',
    '.....ddd........', '................', '................', '................'],
  motor: [
    '................', '......gggg......', '...gg.gwwg.gg...', '...ggggggggggg..', '....gggddggg....', '..gggddddddggg..',
    '..ggddd..dddgg..', '.gggdd....ddggg.', '.gggdd....ddggg.', '..ggddd..dddgg..', '..gggddddddggg..', '....gggddggg....',
    '...ggggggggggg..', '...gg.gGGg.gg...', '......GGGG......', '................'],
  maglev: [
    '................', '................', '...mmm....bbb...', '...mmm....bbb...', '...mww....bww...', '...mmm....bbb...',
    '...mmm....bbb...', '...mmm....bbb...', '...mmmmmmmbbb...', '...mmmmmmbbbb...', '....mmmmmbbb....', '.....mmmmbb.....',
    '................', '..c.c..c..c.c...', '................', '................'],
  fundacao: [
    '................', '..rrrrrrrrrrrr..', '..rRrrRrrRrrRr..', '..rrrrrrrrrrrr..', '..nnnnnnnnnnnn..', '..NNNNNNNNNNNN..',
    '...g...g...g....', '...g...g...g....', '..ng..ngn..gn...', '...gn..g..ng....', '..n.g..gn..g.n..', '...ng.ng...gn...',
    '...g...g...g....', '...G...G...G....', '................', '................'],
  guindaste: [
    '................', 'yyyyyyyyyyyyyyyy', 'yYyYyYyYyYyYyYyy', '..yy.........g..', '..yy.........g..', 'GGyy.........g..',
    'GGyy........ddd.', '..yy.........y..', '..yy............', '..yy............', '..yy............', '..yy............',
    '..yy............', '.dddd...........', '................', '................'],
  projeto: [
    '................', '................', '..bbbbbbbbbbbb..', '..bllllllllllb..', '..blwwwwwwwwlb..', '..blwbbbbbbwlb..',
    '..blwbllllbwlb..', '..blwbllllbwlb..', '..blwbbbbbbwlb..', '..blwwwwwwwwlb..', '..bllllllllllb..', '..bbbbbbbbbbbb..',
    '.......w........', '......www.......', '................', '................'],
  corretor: [
    '................', '................', '.......rr.......', '......rrrr......', '.....rrrrrr.....', '....rrrrrrrr....',
    '...rrrrrrrrrr...', '....wwwwwwww....', '....wbbwwbbw....', '....wbbwwbbw....', '....wwwnnwww....', '....wwwnnwww....',
    '..yyyyy.........', '.yyy.yyyyyyy....', '..yyyyy..y.y....', '................'],
  bilheteria: [
    '................', '................', '.....dddddd.....', '...dddddddddd...', '...dlllllllld...', '...dlddddddld...',
    '...dldwwwwdld...', '...dldwbbwdld...', '...dldwbbwdld...', '...dldwwwwdld...', '...dlddddddld...', '...dlllllllld...',
    '...dddddddddd...', '.....GGGGGG.....', '................', '................'],
  aluguel: [
    '................', '........ee......', '.......eeee.....', '......eeeeee....', '.....eeeeeeee...', '....eeeeeeeeee..',
    '.....wwwwwwww...', '.....wbbwwbbw...', '.....wbbwwbbw...', '.....wwwwwwww...', '.....wwwnnwww...', '.....wwwnnwww...',
    '...yyy..........', '..ywwwy.........', '...yyy..........', '................'],
  marketing: [
    '................', '................', '.........mm.....', '.......mmmm..w..', '.....mmmmmm.w...', '..wwmmmmmmm..ww.',
    '..wwmmmmmmm.....', '..wwmmmmmmm..ww.', '.....mmmmmm.w...', '.......mmmm..w..', '....gg...mm.....', '....gg..........',
    '....gg..........', '................', '................', '................'],
  banco: [
    '................', '.......gg.......', '.....gggggg.....', '...gggggggggg...', '..gggggggggggg..', '..GGGGGGGGGGGG..',
    '...w.w..w.w..w..', '...w.w..w.w..w..', '...w.w..w.w..w..', '...w.w..w.w..w..', '..gggggggggggg..', '.gggggggggggggg.',
    '.GGGGGGGGGGGGGG.', '................', '................', '................'],
  heliponto: [
    '................', '..mmmmmmmmmmmm..', '................', '....mmmmmmm.....', '..mmmmlllmmm....', '.mmmmmlllmmmmmmm',
    '.mmmmmmmmmm....m', '..mmmmmmmmm.....', '....dd...dd.....', '..dddddddddd....', '................', '...ggggggggg....',
    '...gwgggggwg....', '...gwwwgwwwg....', '...ggggggggg....', '................'],
  porto: [
    '................', '.......ww.......', '......wwww......', '......wwww......', '.....wwwwww.....', '.....wwbbww.....',
    '.....wwbbww.....', '.....wwwwww.....', '.....wwwwww.....', '....mwwwwwwm....', '...mmwwwwwwmm...', '...mm.wwww.mm...',
    '.......ff.......', '......ffff......', '.......ff.......', '................'],
};

export const iconSprite = k => ICONS[k] ? fromGrid('icon-' + k, ICONS[k], P) : null;

// Emblema hexagonal 30×30 (com relevo) para as compras; estado: locked | open | own | can | max
export function badgeSprite(color, state) {
  return makeSprite(`badge-${color}-${state}`, 30, 30, p => {
    const base = state === 'locked' ? '#191c27' : state === 'own' || state === 'can' ? shade(color, -0.45) : state === 'max' ? color : '#1d2130';
    const rim = state === 'locked' ? '#353b50' : state === 'max' ? '#ffe9a8' : color;
    // hexágono de pixels: linhas com largura crescente/decrescente
    const rows = [10, 14, 18, 22, 24, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 26, 24, 22, 18, 14, 10];
    rows.forEach((w, i) => p.r(15 - w / 2, i + 1, w, 1, rim));
    rows.forEach((w, i) => { if (i < 2 || i > rows.length - 3) return; p.r(15 - w / 2 + 2, i + 1, w - 4, 1, base); });
    // relevo: luz em cima à esquerda, sombra embaixo à direita
    if (state !== 'locked') { p.r(8, 4, 8, 1, shade(rim, 0.45)); p.r(5, 6, 2, 6, shade(rim, 0.3)); p.r(17, 25, 7, 1, shade(rim, -0.4)); p.r(24, 18, 2, 5, shade(rim, -0.35)); }
  });
}

// cadeado 10×10
export const lockSprite = () => fromGrid('lock', [
  '...gggg...', '..g....g..', '..g....g..', '.gggggggg.', '.gGGGGGGg.', '.gGGddGGg.', '.gGGddGGg.', '.gGGGGGGg.', '.gggggggg.', '..........'], P);

// estrelas de Pesquisa: pequena (13), notável (19), chave (octógono 23), ponte (losango 13)
const inPoly = (x, y, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
function shapePts(kind, c, R) {
  const ring = (n, r0, r1, rot) => Array.from({ length: n }, (_, i) => { const a = rot + i * Math.PI * 2 / n, r = i % 2 ? r1 : r0; return [c + r * Math.cos(a), c + r * Math.sin(a)]; });
  if (kind === 'key') return ring(8, R, R, Math.PI / 8);
  if (kind === 'bridge') return ring(4, R, R, 0);
  return ring(10, R, R * 0.47, -Math.PI / 2);
}
export function starSprite(kind, state, color = '#a08ae8') {
  const fill = { own: color, can: shade(color, -0.55), open: '#1d1a2c', hint: '#12141b' }[state] || '#1d1a2c';
  const rim = { own: shade(color, 0.6), can: color, open: shade(color, -0.35), hint: '#2b3044' }[state] || '#6d5fa8';
  const n = kind === 'key' ? 23 : kind === 'notable' ? 19 : 13, S = n + 2;
  return makeSprite(`star-${kind}-${state}-${color}`, S, S, p => {
    const pts = shapePts(kind, S / 2, n / 2 + 0.3), inside = (x, y) => x >= 0 && y >= 0 && x < S && y < S && inPoly(x + 0.5, y + 0.5, pts);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      p.px(x, y, edge ? rim : fill);
    }
    if (state === 'own') { p.px(Math.round(S / 2 - 2), Math.round(S / 2 - 2), '#ffffff'); p.px(Math.round(S / 2 - 1), Math.round(S / 2 - 2), '#ffffff'); }
  });
}
