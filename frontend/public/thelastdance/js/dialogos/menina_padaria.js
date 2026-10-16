// Conversa com a menina de vestido vermelho (mesa das meninas). RASCUNHO só para testar a interação:
// a história de verdade dessa personagem ainda vai ser escrita — trocar as falas aqui, o formato fica.
(function (global) {
  "use strict";
  const CONVERSA = {
    id: "menina_padaria",
    tipo: "conversa",
    contato: "Menina de vestido vermelho",
    lugar: "na padaria",
    inicio: "abertura",
    nos: {
      abertura: {
        falas: [
          { quem: "ela", texto: "Hum... posso ajudar?" },
        ],
        opcoes: [
          { texto: "\"Te vi na balada ontem. Você dança muito.\"", vai: "elogio" },
          { texto: "Oferecer um café sem açúcar", vai: "cafe" },
        ],
      },
      elogio: {
        falas: [
          { quem: "eu", texto: "Te vi na balada ontem. Você dança muito." },
          { quem: "ela", texto: "Ah, você é o cara que derrubou a bebida no DJ? 😂" },
          { quem: "ela", texto: "Corajoso aparecer aqui. Senta aí um minuto." },
        ],
        fim: { texto: "Ela abriu espaço na mesa. (Continua...)", resultado: "conversou" },
      },
      cafe: {
        falas: [
          { quem: "eu", texto: "Posso te pagar um café? Sem açúcar, né?" },
          { quem: "ela", texto: "...Como você sabe?" },
          { quem: "ela", texto: "Tá, agora fiquei curiosa. Aceito." },
        ],
        fim: { texto: "Ponto pra você. (Continua...)", resultado: "cafe" },
      },
    },
  };
  if (global.NSF) (global.NSF.DIALOGOS = global.NSF.DIALOGOS || {})[CONVERSA.id] = CONVERSA;
  if (typeof module !== "undefined") module.exports = CONVERSA;
})(typeof window !== "undefined" ? window : globalThis);
