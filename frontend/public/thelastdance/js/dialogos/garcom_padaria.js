// Conversa com o Seu Zé, garçom da padaria (cara a cara, não é ligação). Rascunho para testar a interação.
// Mesmo formato dos roteiros de ligação; tipo "conversa" muda o topo ("na padaria") e o botão final ("Tchau").
(function (global) {
  "use strict";
  const CONVERSA = {
    id: "garcom_padaria",
    tipo: "conversa",
    contato: "Seu Zé, o garçom",
    lugar: "na padaria",
    inicio: "abertura",
    nos: {
      abertura: {
        falas: [
          { quem: "ele", texto: "Opa, campeão! Cara de quem não dormiu de novo, hein?" },
        ],
        opcoes: [
          { texto: "Quero comer alguma coisa", vai: "pedido" },
          { texto: "Quem são as meninas daquela mesa?", vai: "meninas" },
        ],
      },
      pedido: {
        falas: [
          { quem: "eu", texto: "Tô morrendo de fome, Seu Zé." },
          { quem: "ele", texto: "Pede ali no balcão com a Dona Cida. O pão com ovo dela é patrimônio da cidade." },
        ],
        fim: { texto: "Dica: a Dona Cida fica atrás do balcão.", resultado: "dica_balcao" },
      },
      meninas: {
        falas: [
          { quem: "eu", texto: "Seu Zé, quem são aquelas ali?" },
          { quem: "ele", texto: "Vêm todo fim de semana depois da balada. A de vermelho sempre pede o mesmo: café sem açúcar." },
          { quem: "ele", texto: "Mas eu não te contei nada, hein." },
        ],
        fim: { texto: "Dica anotada: café sem açúcar.", resultado: "dica_menina" },
      },
    },
  };
  if (global.NSF) (global.NSF.DIALOGOS = global.NSF.DIALOGOS || {})[CONVERSA.id] = CONVERSA;
  if (typeof module !== "undefined") module.exports = CONVERSA;
})(typeof window !== "undefined" ? window : globalThis);
