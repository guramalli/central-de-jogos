// Ligação da "Gatinha de Campinas" (primeira interação de teste). Só o roteiro: quem fala, o quê e as escolhas.
// Formato: cada nó tem "falas" (em ordem) e depois "opcoes" (o jogador escolhe) ou "fim".
// quem: "ela" (aparece à esquerda, com a foto) ou "eu" (o protagonista, à direita).
(function (global) {
  "use strict";
  const LIGACAO = {
    id: "gatinha_campinas",
    contato: "Gatinha de Campinas",
    foto: "assets/characters/npcs/gatinha_campinas.png",
    toque_segundos: 4,          // o telefone toca alguns segundos depois de o jogo começar
    inicio: "abertura",
    nos: {
      abertura: {
        falas: [
          { quem: "ela", texto: "Ooooi, sumido! 😏" },
          { quem: "ela", texto: "Tô com uma saudade de você que nem te conto..." },
          { quem: "ela", texto: "Sério. Quero te ver. Faz tempo demais, né?" },
        ],
        opcoes: [
          { texto: "Dar uma desculpa esfarrapada", vai: "desculpa" },
          { texto: "Chamar ela pra vir de ônibus (você paga tudo) e passar o fim de semana", vai: "convite" },
        ],
      },
      desculpa: {
        falas: [
          { quem: "eu", texto: "Pô, gatinha... esse fim de semana não vai dar. Meu peixe tá doente." },
          { quem: "ela", texto: "Você não tem peixe." },
          { quem: "eu", texto: "Tenho sim. Ele é muito tímido, nunca aparece nas fotos." },
          { quem: "ela", texto: "Aham. Me liga quando o peixe melhorar. 🙄" },
        ],
        fim: { texto: "Ela desligou. Mais uma noite sozinho?", resultado: "dispensou" },
      },
      convite: {
        falas: [
          { quem: "eu", texto: "Então vem pra cá! Pega um ônibus que eu pago tudo. Passa o fim de semana comigo." },
          { quem: "ela", texto: "JURA?? 😍" },
          { quem: "ela", texto: "Tô arrumando a mala agora mesmo." },
          { quem: "ela", texto: "Chego sábado de manhã na rodoviária. Vai me buscar, hein! 😘" },
        ],
        fim: { texto: "Fim de semana garantido. (Sua carteira sentiu um frio na espinha.)", resultado: "convidou" },
      },
    },
  };
  if (global.NSF) (global.NSF.DIALOGOS = global.NSF.DIALOGOS || {})[LIGACAO.id] = LIGACAO;
  if (typeof module !== "undefined") module.exports = LIGACAO;
})(typeof window !== "undefined" ? window : globalThis);
