/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌊 MAR ABERTO no Rio de Janeiro e em Santos (v385; dono: "arrume o mar no Rio de Janeiro e Santos, ele está parecendo
   um rio"). O mar era uma faixa fina de água entre a areia e a borda do mapa (com a calçada da borda embaixo).
   Agora o mapa ganha FILEIRAS DE MAR FUNDO embaixo (até a borda, sem calçada), com jangadas e boias ao longe.
   Só acrescenta linhas no fim do mapa: nada do que já existe muda de lugar (saves, portas e missões continuam iguais).
   Carregar DEPOIS dos mapas (e do espalha.js, que aumenta Santos).
   ============================================================ */
const MAR_ABERTO = { rio: 8, santos: 10 }; // quantas fileiras de mar a mais
function abreMar(m, n) {
  const w = m.w, h = m.h, H2 = h + n;
  const chao = new m.chao.constructor(w * H2), obj = new Array(w * H2).fill(null);
  for (let k = 0; k < w * h; k++) { chao[k] = m.chao[k]; obj[k] = m.obj[k]; }
  const agua = CH.AGUA, bloq = () => ({ t: 'x', v: 0 });
  // a borda de baixo (calçada invisível) vira mar onde em cima já era mar; e as linhas novas são todas mar
  for (let x = 0; x < w; x++) { if (m.chao[(h - 2) * w + x] === agua) { chao[(h - 1) * w + x] = agua; obj[(h - 1) * w + x] = bloq(); } }
  for (let y = h; y < H2; y++) for (let x = 0; x < w; x++) { chao[y * w + x] = agua; obj[y * w + x] = bloq(); }
  // jangadas e boias ao longe (não se chega lá: é decoração)
  const r = mulberry(w * 31 + h * 7 + n);
  const poe = (t, qtd, y0, y1) => { for (let i = 0, tent = 0; i < qtd && tent < 60; tent++) { const x = 3 + Math.floor(r() * (w - 6)), y = y0 + Math.floor(r() * (y1 - y0 + 1)); const k = y * w + x; if (obj[k] && obj[k].t !== 'x') continue; obj[k] = { t, v: (r() * 1000) | 0 }; i++; } };
  poe('jangada', Math.max(2, Math.round(w / 30)), h + 2, H2 - 3);
  poe('boia', Math.max(3, Math.round(w / 18)), h, h + 3);
  m.chao = chao; m.obj = obj; m.h = H2; m._mar = n;
  m._chao = null; m._mini = null;
  return m;
}
{
  const _gmMar = getMapa;
  getMapa = function (id) {
    const novo = typeof MAPAS !== 'undefined' && !MAPAS[id];
    const m = _gmMar.apply(this, arguments);
    try { if (novo && MAR_ABERTO[id] && m && !m._mar) abreMar(m, MAR_ABERTO[id]); } catch (e) { console.warn('mar aberto', id, e); }
    return m;
  };
  if (typeof MAPAS !== 'undefined') for (const id of Object.keys(MAR_ABERTO)) if (MAPAS[id] && !MAPAS[id]._mar) delete MAPAS[id];
}
window.MAR = { MAR_ABERTO, abreMar };
