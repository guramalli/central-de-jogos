// Quadrinho de opções no elevador (abre toda vez que ele entra): o que fazer até chegar.
// Formato dos roteiros de conversa; "eu" = o protagonista. botaoFim troca o "Tchau" por "Continuar".
(function (global) {
  "use strict";
  const ROTEIRO = {
    id: "elevador_acoes",
    tipo: "conversa",
    contato: "No elevador",
    lugar: "a caminho",
    botaoFim: "Continuar",
    inicio: "abertura",
    nos: {
      abertura: {
        falas: [{ quem: "eu", texto: "(Elevador vazio. Uns segundos até chegar... o que eu faço?)" }],
        opcoes: [
          { texto: "Peidar", vai: "peidar" },
          { texto: "Assobiar uma música", vai: "assobiar" },
          { texto: "Pegar o celular", vai: "celular" },
          { texto: "Mexer no bigode", vai: "bigode" },
        ],
      },
      peidar: {
        falas: [
          { quem: "eu", texto: "(Ninguém vai saber...)" },
          { quem: "eu", texto: "*prrrr*" },
          { quem: "ela", texto: "*a porta abre no 7º andar e a síndica entra*" },
          { quem: "ela", texto: "...que cheiro é esse, meu Deus?" },
          { quem: "eu", texto: "Já tava assim quando eu entrei." },
        ],
        fim: { texto: "A síndica nunca vai esquecer. Nem você.", resultado: "peidou" },
      },
      assobiar: {
        falas: [
          { quem: "eu", texto: "*assobia \"Evidências\"*" },
          { quem: "eu", texto: "(Esse eco do elevador valoriza muito o meu talento.)" },
        ],
        fim: { texto: "Afinado. Pelo menos foi o que você achou.", resultado: "assobiou" },
      },
      celular: {
        falas: [
          { quem: "eu", texto: "(Nenhuma mensagem nova. 3% de bateria.)" },
          { quem: "eu", texto: "(Uma notificação: \"Gatinha de Campinas visualizou seu story\".)" },
        ],
        fim: { texto: "Ela viu. Isso significa alguma coisa? Significa.", resultado: "celular" },
      },
      bigode: {
        falas: [
          { quem: "eu", texto: "*ajeita o bigode no espelho*" },
          { quem: "eu", texto: "(Tá no ponto. Hoje ninguém me segura.)" },
        ],
        fim: { texto: "Confiança +1. Bigode impecável.", resultado: "bigode" },
      },
    },
  };
  if (global.NSF) (global.NSF.DIALOGOS = global.NSF.DIALOGOS || {})[ROTEIRO.id] = ROTEIRO;
  if (typeof module !== "undefined") module.exports = ROTEIRO;
})(typeof window !== "undefined" ? window : globalThis);
