// Pedido no balcão com a Dona Cida (atendente da padaria). Cara a cara, mesmo formato dos outros roteiros.
// Os resultados ("pingado", "pao_com_ovo"...) ficam guardados para a energia/dinheiro que entram depois.
(function (global) {
  "use strict";
  const CONVERSA = {
    id: "atendente_padaria",
    tipo: "conversa",
    contato: "Dona Cida, a atendente",
    lugar: "no balcão",
    inicio: "abertura",
    nos: {
      abertura: {
        falas: [
          { quem: "ela", texto: "Bom dia, meu filho! Ou boa noite... a essa hora eu já nem sei." },
          { quem: "ela", texto: "O que vai ser?" },
        ],
        opcoes: [
          { texto: "Um pingado e um pão na chapa (R$ 14)", vai: "pingado" },
          { texto: "Pão com ovo e um suco de laranja (R$ 16)", vai: "pao_com_ovo" },
          { texto: "Misto quente e uma Coca (R$ 20)", vai: "misto" },
          { texto: "Só uma água, tô duro", vai: "agua" },
        ],
      },
      pingado: {
        falas: [
          { quem: "eu", texto: "Um pingado e um pão na chapa, caprichado na manteiga." },
          { quem: "ela", texto: "Saindo! O clássico de quem virou a noite." },
          { quem: "ela", texto: "Toma, quentinho. Vai, que isso levanta até defunto." },
        ],
        fim: { texto: "Pingado e pão na chapa. Você se sente gente de novo.", resultado: "pingado" },
      },
      pao_com_ovo: {
        falas: [
          { quem: "eu", texto: "Me vê um pão com ovo e um suco de laranja." },
          { quem: "ela", texto: "Ovo com a gema mole, do jeito certo. Não aceito reclamação." },
          { quem: "ela", texto: "Pronto. Come devagar que ninguém vai tirar de você." },
        ],
        fim: { texto: "Pão com ovo e suco. Energia de volta para mais uma noite.", resultado: "pao_com_ovo" },
      },
      misto: {
        falas: [
          { quem: "eu", texto: "Um misto quente e uma Coca bem gelada." },
          { quem: "ela", texto: "Coca a essa hora? Tá bom, tá bom, quem sou eu pra julgar." },
        ],
        fim: { texto: "Misto quente e Coca. O açúcar bateu.", resultado: "misto" },
      },
      agua: {
        falas: [
          { quem: "eu", texto: "Só uma água mesmo. A noite de ontem levou tudo." },
          { quem: "ela", texto: "Ai, ai... toma. E leva esse pão de queijo, é por minha conta." },
        ],
        fim: { texto: "Água e um pão de queijo de cortesia. A Dona Cida é gente boa.", resultado: "agua" },
      },
    },
  };
  if (global.NSF) (global.NSF.DIALOGOS = global.NSF.DIALOGOS || {})[CONVERSA.id] = CONVERSA;
  if (typeof module !== "undefined") module.exports = CONVERSA;
})(typeof window !== "undefined" ? window : globalThis);
