// Zoeira do churrasco na casa do amigo: rodadas de falas que tocam sozinhas, uma atrás da outra, em balões.
// RASCUNHO para testar — trocar pelas falas de verdade (o formato fica). Edite à vontade:
//   quem: "eu" (o protagonista) ou o id do amigo na planta (vibola, gustavinho, juan, vini)
//   texto: a fala ; celular: true = ele saca o celular para mostrar o Instagram (com corações subindo)
// As rodadas tocam em ordem e recomeçam no fim; entre uma rodada e outra há uma pausa.
(function (global) {
  "use strict";
  const ZOEIRA = {
    id: "churrasco_zoeira",
    pausaEntreRodadas: 6,   // segundos
    segundosPorFala: 3.2,
    rodadas: [
      [ // a mina
        { quem: "eu", texto: "Ô rapaziada, presta atenção aqui! A mina de ontem me mandou mensagem de novo." },
        { quem: "juan", texto: "Lá vem..." },
        { quem: "vini", texto: "É a mesma da semana passada ou é outra?" },
        { quem: "eu", texto: "Outra, pô! Essa é diferente. Essa é a certa." },
        { quem: "vibola", texto: "Todas são \"a certa\", né, campeão?" },
      ],
      [ // zoeira entre eles
        { quem: "juan", texto: "Vini, essa bermuda de coqueiro foi presente da sua avó?" },
        { quem: "vini", texto: "Pelo menos eu não vim de cachecol num churrasco, Juan." },
        { quem: "gustavinho", texto: "E o Vibola de óculos escuros de noite, achando que é DJ." },
        { quem: "vibola", texto: "Óculos é estilo, Gustavinho. Coisa que você não tem." },
      ],
      [ // o insta
        { quem: "eu", texto: "Olha aqui no insta, olha! As gatinhas tudo mandando direct!", celular: true },
        { quem: "gustavinho", texto: "Isso aí é golpe, mano. É tudo bot." },
        { quem: "juan", texto: "Larga esse celular e vira a carne, que tá queimando!" },
        { quem: "eu", texto: "Tá no ponto! Picanha mal passada é o segredo do mestre." },
      ],
      [ // a baladinha
        { quem: "eu", texto: "Sexta tem aquela baladinha... quem cola comigo?" },
        { quem: "vini", texto: "Ele vai, bebe três e liga pra ex às 4 da manhã." },
        { quem: "vibola", texto: "Kkkkkkkk clássico." },
        { quem: "eu", texto: "Isso foi UMA vez!" },
        { quem: "juan", texto: "Uma vez por semana." },
      ],
      [ // o réveillon (de novo)
        { quem: "eu", texto: "Esse ano o réveillon é no Nordeste! Praia, sol e as nordestinas me esperando." },
        { quem: "juan", texto: "Pera aí... ano passado você não falou que era o ÚLTIMO réveillon no Nordeste?" },
        { quem: "vini", texto: "E no retrasado também. Já são 12 réveillons seguidos no Nordeste, irmão. DOZE." },
        { quem: "gustavinho", texto: "Ele já virou o tio da Sukita da praia de Porto de Galinhas." },
        { quem: "vibola", texto: "As nordestinas que você fala já são avós, cara. Se enxerga!" },
        { quem: "eu", texto: "Respeita o tio da Sukita! E esse ano é diferente, já tá tudo combinado!" },
        { quem: "juan", texto: "Tá combinado desde 2014." },
      ],
      [ // o último ano de bagunça
        { quem: "eu", texto: "Pode anotar: esse é meu ÚLTIMO ano na bagunça. Ano que vem eu sossego." },
        { quem: "vini", texto: "Ele fala isso desde 2019." },
        { quem: "vibola", texto: "Desde 2015, Vini. Desde 2015." },
        { quem: "juan", texto: "Um brinde ao último ano de solteiro dele... de novo!" },
        { quem: "gustavinho", texto: "Saúde! Até o ano que vem, no último ano de novo." },
      ],
      [ // mais mulher
        { quem: "eu", texto: "Galera, galera! Olha a foto que ela mandou agora!", celular: true },
        { quem: "juan", texto: "Isso é foto de banco de imagem, irmão." },
        { quem: "vibola", texto: "Ele salvou do Pinterest e mandou pra ele mesmo." },
        { quem: "eu", texto: "Vocês tão é com inveja. Passa o sal grosso aí." },
      ],
    ],
  };
  if (global.NSF) (global.NSF.DIALOGOS = global.NSF.DIALOGOS || {})[ZOEIRA.id] = ZOEIRA;
  if (typeof module !== "undefined") module.exports = ZOEIRA;
})(typeof window !== "undefined" ? window : globalThis);
