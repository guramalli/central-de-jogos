// Jocelino — radio.js — o rádio do quintal (a TV do Stardew): o horóscopo (a sorte do dia, que muda a coleta) e a
// previsão do tempo de amanhã.
function previsaoDoRadio() {
  const am = Clima.chove(G.dia + 1);
  return `Rádio Maré, bom dia! O horóscopo: "${Achados.horoscopo(G.dia)}"\n\nE a previsão para amanhã: ${am ? 'chuva na Baixada Santista. Leve o guarda-chuva!' : 'tempo bom, sol entre nuvens.'}`;
}
