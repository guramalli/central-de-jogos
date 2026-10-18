// Zoeira do churrasco na casa do amigo: rodadas de falas que tocam sozinhas, uma atrás da outra, em balões.
// RASCUNHO para testar — trocar pelas falas de verdade (o formato fica). Edite à vontade:
//   quem: "eu" (o protagonista), o id do amigo na planta (vibola, gustavinho, juan, vini) ou "todos" (a turma
//     inteira ao mesmo tempo — ex.: todo mundo rindo; cada um ganha um balão de risada diferente)
//   texto: a fala ; celular: true = ele saca o celular para mostrar o Instagram (com corações subindo)
//   audio: voz gravada que toca no lugar do texto, como se a pessoa falasse ali, ao vivo (sem balão: só as ondinhas
//     de voz do lado da cabeça de quem fala).
//     As vozes ficam no pacote trancado da área dos amigos (tools/vip_trancar.mjs); "texto" aí é só um lembrete.
//   riem: ["gustavinho"] = quem reage à piada caindo na risada logo depois (quem tem animação de risada: o Gustavinho 3D)
//   rindo: true = quem fala, fala rindo
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
        { quem: "vibola", texto: "Todas são \"a certa\", né, campeão?", riem: ["gustavinho"] },
      ],
      [ // zoeira entre eles
        { quem: "juan", texto: "Vini, essa bermuda de coqueiro foi presente da sua avó?" },
        { quem: "vini", texto: "Pelo menos eu não vim de cachecol num churrasco, Juan.", riem: ["gustavinho"] },
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
        { quem: "juan", texto: "Uma vez por semana.", riem: ["gustavinho"] },
      ],
      [ // a baladinha de ontem (áudio do Gustavinho)
        { quem: "eu", texto: "Rapaziada, ontem eu fui naquela baladinha e vocês não sabem o que aconteceu..." },
        { quem: "gustavinho", texto: "(áudio do Gustavinho: \"ô loco, bicho, foi pra baladinha!\")", audio: "assets/audio/amigos/gustavinho_baladinha.mp3" },
        { quem: "todos", texto: "KKKKKKKKKKKK" },
        { quem: "vini", texto: "Kkkkkk o Faustão chegou no churrasco!" },
        { quem: "eu", texto: "Ri não, que eu peguei o telefone de três!" },
        { quem: "juan", texto: "De três atendentes do bar. Pra pedir a conta.", riem: ["gustavinho"] },
      ],
      [ // o réveillon (de novo)
        { quem: "eu", texto: "Esse ano o réveillon é no Nordeste! Praia, sol e as nordestinas me esperando." },
        { quem: "juan", texto: "Pera aí... ano passado você não falou que era o ÚLTIMO réveillon no Nordeste?" },
        { quem: "vini", texto: "E no retrasado também. Já são 12 réveillons seguidos no Nordeste, irmão. DOZE." },
        { quem: "gustavinho", texto: "Ele já virou o tio da Sukita da praia de Porto de Galinhas." },
        { quem: "vibola", texto: "As nordestinas que você fala já são avós, cara. Se enxerga!", riem: ["gustavinho"] },
        { quem: "eu", texto: "Respeita o tio da Sukita! E esse ano é diferente, já tá tudo combinado!" },
        { quem: "juan", texto: "Tá combinado desde 2014.", riem: ["gustavinho"] },
      ],
      [ // o último ano de bagunça
        { quem: "eu", texto: "Pode anotar: esse é meu ÚLTIMO ano na bagunça. Ano que vem eu sossego." },
        { quem: "vini", texto: "Ele fala isso desde 2019." },
        { quem: "vibola", texto: "Desde 2015, Vini. Desde 2015.", riem: ["gustavinho"] },
        { quem: "juan", texto: "Um brinde ao último ano de solteiro dele... de novo!" },
        { quem: "gustavinho", texto: "Saúde! Até o ano que vem, no último ano de novo." },
      ],
      [ // o Vini e o futebol (áudio do Vini)
        { quem: "eu", texto: "E aí, Vini, domingo tem futebol? Separei a chuteira!" },
        { quem: "vini", texto: "(áudio do Vini: parou de jogar bola por causa do joelho)", audio: "assets/audio/amigos/vini_futebol.mp3" },
        { quem: "juan", texto: "Aposentou o joelho e a dignidade junto.", riem: ["gustavinho"] },
        { quem: "eu", texto: "Corridinha na praia... no Nordeste, no réveillon! Bora, Vini!" },
        { quem: "vibola", texto: "Pronto, voltou pro réveillon. Em menos de um minuto.", riem: ["gustavinho"] },
      ],
      [ // o Juan "elogiando" (áudio do Juan)
        { quem: "eu", texto: "Rapaziada, tive uma ideia genial: camiseta do grupo com a minha cara!" },
        { quem: "juan", texto: "(áudio do Juan: \"você é o melhor, muito engraçado, muito criativo\")", audio: "assets/audio/amigos/juan_elogio.mp3" },
        { quem: "gustavinho", texto: "Kkkkkkk o Juan no modo irônico máximo.", rindo: true },
        { quem: "eu", texto: "Ironia nada! O Juan é meu fã número um." },
      ],
      [ // a perguntinha dele (áudio do protagonista)
        { quem: "eu", texto: "(áudio dele: a \"perguntinha\" pra galera)", audio: "assets/audio/amigos/eu_perguntinha.mp3" },
        { quem: "vibola", texto: "Lá vem..." },
        { quem: "vini", texto: "Isso aí é a picanha de ontem, irmão.", riem: ["gustavinho"] },
        { quem: "juan", texto: "Ninguém mais acordou assim. Só você. Todo domingo." },
      ],
      [ // a turma completa
        { quem: "eu", texto: "Pablo, Elcio, Jamil! Agora sim a família tá completa!" },
        { quem: "jamil", texto: "Vim abençoar essa carne. E esse churrasqueiro, que precisa mais." },
        { quem: "pabo", texto: "Picanha é proteína. Então tá liberado." },
        { quem: "elcio", texto: "Alguém viu meu protetor solar?" },
        { quem: "juan", texto: "É meia-noite, Elcio.", riem: ["gustavinho"] },
      ],
      [ // mais mulher
        { quem: "eu", texto: "Galera, galera! Olha a foto que ela mandou agora!", celular: true },
        { quem: "juan", texto: "Isso é foto de banco de imagem, irmão." },
        { quem: "vibola", texto: "Ele salvou do Pinterest e mandou pra ele mesmo.", riem: ["gustavinho"] },
        { quem: "eu", texto: "Vocês tão é com inveja. Passa o sal grosso aí." },
      ],
    ],
  };
  if (global.NSF) (global.NSF.DIALOGOS = global.NSF.DIALOGOS || {})[ZOEIRA.id] = ZOEIRA;
  if (typeof module !== "undefined") module.exports = ZOEIRA;
})(typeof window !== "undefined" ? window : globalThis);
