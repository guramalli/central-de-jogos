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
          { quem: "ele", texto: "Vai querer o de sempre?" },
        ],
        opcoes: [
          { texto: "Pingado e pão na chapa (recupera a energia)", vai: "cafe" },
          { texto: "Só uma água, tô sem grana", vai: "agua" },
          { texto: "Quem são as meninas daquela mesa?", vai: "meninas" },
        ],
      },
      cafe: {
        falas: [
          { quem: "eu", texto: "Manda o de sempre, Seu Zé. Caprichado na manteiga." },
          { quem: "ele", texto: "Saindo! Com isso aí você aguenta mais uma noite." },
        ],
        fim: { texto: "Energia recuperada. (A barra de energia entra nas próximas etapas.)", resultado: "cafe" },
      },
      agua: {
        falas: [
          { quem: "eu", texto: "Só uma água mesmo. A noite de ontem levou tudo." },
          { quem: "ele", texto: "Essa é por conta da casa. Mas vê se come alguma coisa, rapaz." },
        ],
        fim: { texto: "Água grátis. A fome continua.", resultado: "agua" },
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
