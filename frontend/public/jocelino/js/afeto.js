// Jocelino — afeto.js — os marcos de dinheiro viram afeto (13/10, o princípio do Stardew: 1.000g traz o bichinho, 5.000g os
// biscoitos da mãe, 15.000g o dinheiro do avô — o número vira acontecimento). Aqui o total que o Jocelino ganhou (somado toda
// noite) chama a família que ficou em Aracaju: uma carta na manhã seguinte, uma vez cada.
const MARCOS_AFETO = [
  [1000, 'zefa_1000'],
  [5000, 'zefa_5000'],
  [15000, 'pai_15000'],
];
Object.assign(CARTAS, {
  zefa_1000: { de: 'Dona Zefa, de Aracaju', dia: 1e9, anexo: { cocada: 3 },
    texto: 'Meu filho, a Rosa escreveu contando que você arrumou serviço na obra e que a meninada tá comendo bem. Sua mãe chorou de alegria. Mando umas cocadas da vizinha, que são as melhores da rua. Juízo, e manda notícia. Bênção, Zefa.' },
  // (o queijo e a farinha vão direto para a despensa da pensão: são da Rosa)
  zefa_5000: { de: 'Dona Zefa, de Aracaju', dia: 1e9, aoLer: () => { if (!G.pensao) return; for (const [id, n] of [['queijo_coalho', 2], ['farinha', 5]]) G.pensao.despensa[id] = (G.pensao.despensa[id] || 0) + n; if (typeof avisar === 'function') avisar('Queijo coalho ×2 e farinha ×5 na despensa da pensão'); },
    texto: 'Jocelino, a notícia da pensão da Rosa chegou até aqui! Mandei pelo caminhoneiro queijo coalho e farinha boa de Sergipe: é pra ela fazer o cuscuz que só ela sabe. Tô juntando pra visitar vocês quando a casa ficar pronta. Beijo da sua mãe.' },
  pai_15000: { de: 'Dona Zefa, de Aracaju', dia: 1e9, aoLer: () => { G.dinheiro += 500; G.ganhoHoje = (G.ganhoHoje || 0) + 500; if (typeof avisar === 'function') avisar('+ Cr$ 500 do pé-de-meia do seu pai'); if (typeof hudSujo === 'function') hudSujo(); },
    texto: 'Meu filho, achei o pé-de-meia que o seu pai guardava atrás do santo, pra quando um filho levantasse a própria casa. Ele dizia que você ia ser pedreiro dos bons. Vai junto: é pro tijolo da casa de vocês. Ele tá vendo, viu? Zefa.' },
});
INICIADORES.push(s => { G.ganhoTotal = s.ganhoTotal || 0; G.marcosAfeto = (s.marcosAfeto || []).slice(); });
COLETORES.push(s => { s.ganhoTotal = G.ganhoTotal; s.marcosAfeto = G.marcosAfeto.slice(); });
// Toda noite: soma o que ganhou no dia e, passado um marco, a carta da família chega de manhã.
NOITE.push(() => {
  G.ganhoTotal = (G.ganhoTotal || 0) + Math.max(0, G.ganhoHoje || 0);
  for (const [valor, carta] of MARCOS_AFETO)
    if (G.ganhoTotal >= valor && !G.marcosAfeto.includes(valor)) { G.marcosAfeto.push(valor); if (G.correio && !G.correio.caixa.includes(carta) && !G.correio.lidas.includes(carta)) G.correio.caixa.push(carta); }
});
