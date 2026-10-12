// Jocelino — reforma_palco.js — a reforma da pensão no salão de lado (teste de 12/10: o cômodo de cima, com a arte velha da
// versão Godot, saiu do jogo). Durante a reforma (limpar, telhas, banquetas), a porta leva ao mesmo salão de lado da janta,
// vazio: 8 sujeiras no chão da frente (entulho e mato, arte que já existe) saem com um clique cada (o Jocelino vai até lá e
// limpa, gastando um pouco de energia); as telhas e a madeira se entregam à Rosa (clique nela) ou na porta, como antes.

const SUJEIRA_PALCO = [['objetos/entulho_1', 420], ['objetos/mato_2', 560], ['objetos/entulho_2', 700], ['objetos/mato_3', 840],
  ['objetos/entulho_3', 980], ['objetos/mato_1', 1120], ['objetos/entulho_1', 1260], ['objetos/mato_4', 1450]];
const SUJEIRA_ESCALA = 1.6, CUSTO_SUJEIRA = 2;
const emReforma = () => !!G.pensao && ['limpar', 'telhas', 'mesas'].includes(G.pensao.estado);
// As sujeiras que faltam (só na etapa de limpar), com a posição no palco (px de mundo, o pé no chão da frente).
function sujeirasDaReforma() {
  const p = G.pensao; if (!p || p.estado !== 'limpar') return [];
  const limpos = p.limpos || [];
  return SUJEIRA_PALCO.map(([arte, x], k) => ({ k, arte, x, y: PALCO.CHAO_Y + 30 })).filter(s => !limpos.includes(s.k));
}
function limparSujeira(k) {
  const p = G.pensao; if (!p || p.estado !== 'limpar' || (p.limpos || []).includes(k)) return;
  if (G.energia < CUSTO_SUJEIRA) { avisar('O Jocelino está esgotado. Coma alguma coisa ou vá dormir.'); return; }
  G.energia = Math.max(0, G.energia - CUSTO_SUJEIRA); (p.limpos = p.limpos || []).push(k);
  sons.tocar(SUJEIRA_PALCO[k][0].includes('mato') ? 'foice' : 'pedra', 1, 0.08, -6); hudSujo();
  if (!sujeirasDaReforma().length) {
    p.limpou(); atualizarPensaoMundo(); sons.tocar('feito', 1, 0.03, 0);
    abrirPlaca(`Salão limpo! Agora o telhado: traga ${Pensao.TELHAS} telhas (o Seu Ananias vende no depósito) e entregue à Rosa.`);
  }
}
// As sujeiras desenhadas no chão da frente (a arte já pronta, só posicionada e na escala do palco).
MAPAS_DEF.pensao_palco = (orig => () => {
  const b = orig(), e0 = b.extras;
  b.extras = () => [...(e0 ? e0() : []), ...sujeirasDaReforma().map(s => ({ tipo: 'camada', y: s.y, desenha(ctx) {
    const img = spr(s.arte); if (!img) return;
    const w = img.naturalWidth * SUJEIRA_ESCALA, h = img.naturalHeight * SUJEIRA_ESCALA;
    ctx.drawImage(img, s.x - w / 2, s.y - h, w, h);
  } }))];
  return b;
})(MAPAS_DEF.pensao_palco);
// O clique: a sujeira (o Jocelino vai até ela) e a Rosa (entrega o material), só na reforma.
{ const a0 = palcoAlvoEm; palcoAlvoEm = function (px, py) {
  if (emReforma()) {
    for (const s of sujeirasDaReforma()) if (Math.abs(px - s.x) < 50 && py > s.y - 110 && py < s.y + 25) return { tipo: 'sujeira', k: s.k, x: s.x };
    const R = PALCO.ROSA; if (Math.abs(px - R.x) < 75 && py > R.y - 260 && py < R.y + 25) return { tipo: 'rosa_reforma', x: clamp(R.x - 60, PALCO.X_MIN, PALCO.X_MAX) };
  }
  return a0(px, py);
}; }
{ const g0 = palcoAgir; palcoAgir = function (a) {
  if (a && a.tipo === 'sujeira') return limparSujeira(a.k);
  if (a && a.tipo === 'rosa_reforma') return pensaoPlaquinha();
  return g0.call(this, a);
}; }
// Quem estiver no cômodo antigo na reforma (um save de antes) vai para o salão de lado.
ATUALIZADORES.push(() => { if (G.mapaId === 'pensao_dentro' && emReforma()) entrarPalco(); });
