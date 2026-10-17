// Celular dele (canto de baixo da tela): ZapZap (o "zap" fake), Instagrão (o insta fake) e as ligações.
// RASCUNHO — edite à vontade, o formato fica:
//   conversas[]: { id, nome, app: "zap" | "insta", cor, grupo?, membros?, mensagens: [{ de, t }], chega?, novas?, rodadas? }
//     de: "eu" (ele, à direita) ; "ela"/"ele" (o contato) ; no grupo, o nome de quem mandou (ex.: "Vibola")
//     chega: segundos de jogo até as "novas" mensagens chegarem (notificação + bolinha vermelha)
//     rodadas: o que ele pode responder, em ordem. Cada rodada = 2 ou 3 opções { eu: "o que ele manda", volta: [respostas] }
//       esperaNovas: true = essa rodada só aparece depois que as "novas" chegarem
//       audio: (opção) ele responde com uma mensagem de voz gravada (pasta trancada assets/audio/amigos), dur = segundos
//       volta: falas de quem está do outro lado (no grupo: { de: "Juan", t: "..." }) ; volta vazio = "visualizou e não respondeu"
//   ligacoes[]: quem liga toda hora. Cada vez que ele atende, toca a próxima conversa da lista (e depois recomeça).
//     Conversa com "passos" em vez de "falas": [{ quem: "ele" | "eu", t: "fala" } ou { quem, audio: "voz gravada" }];
//     sem "opcoes", a ligação acaba sozinha depois dos passos. so: ["casa_amigo"] = só liga nesses mapas.
//   posts[]: fotos do perfil no Instagrão ; avisos[]: notificações do coração
(function (global) {
  "use strict";
  const CELULAR = {
    dono: { insta: "ultimoanosolteiro", nome: "O Brabo 🍷", seguidores: 1873, seguindo: 2140,
      bio: "Último ano de solteiro (desde 2015) 🥂\nRéveillon no Nordeste ☀️ · Churrasqueiro oficial 🔥" },

    conversas: [
      { id: "bia", nome: "Bia 🍷", app: "zap", cor: "#c2185b",
        mensagens: [
          { de: "eu", t: "Oi sumida 😏" },
          { de: "eu", t: "Comprei um vinho chileno caríssimo. R$ 39,90. Bora abrir hoje?" },
          { de: "ela", t: "Caríssimo kkkkkk" },
          { de: "ela", t: "É aquele do mercado com tampinha de rosca?" },
        ],
        rodadas: [
          { opcoes: [
            { eu: "É de rolha!! Tem até saca-rolha aqui. Acho.", volta: ["Kkkkk tá bom, vou pensar 🍷", "Se tiver queijo eu vou"] },
            { eu: "Vinho é vinho, o importante é a companhia 😎", volta: ["Que brega 🙄", "...mas eu gostei kkkk"] },
          ] },
          { opcoes: [
            { eu: "Tem queijo sim! (vou comprar agora)", volta: ["Então tá. Sexta eu vejo 😘"] },
            { eu: "Queijo é caro, mas tem bolacha de água e sal", volta: [] },
          ] },
        ] },

      { id: "lari", nome: "Lari Fit 💪", app: "zap", cor: "#2e7d32",
        mensagens: [
          { de: "eu", t: "E aí, depois do treino, um vinhozinho pra repor as energias? 🍷" },
          { de: "ela", t: "Vinho não repõe energia nenhuma kkkk" },
          { de: "ela", t: "E você não pisa na academia faz 3 meses" },
        ],
        rodadas: [
          { opcoes: [
            { eu: "Tô no bulking 😤", volta: ["Bulking de picanha né", "Vi teus stories no churrasco"] },
            { eu: "Volto segunda. Essa segunda é a certa!", volta: ["Todas as segundas são \"a certa\" pra você 😂"] },
          ] },
        ] },

      { id: "camila", nome: "Camila", app: "zap", cor: "#6a1b9a",
        mensagens: [
          { de: "eu", t: "Camila, boa noite! Lembra de mim? Da festa do Juan" },
          { de: "eu", t: "O do bigode 🥸" },
          { de: "eu", t: "Bora tomar um vinho qualquer dia?" },
        ],
        rodadas: [
          { opcoes: [
            { eu: "Oiii?", volta: [] },
            { eu: "Mandei sem querer, era pro meu primo", volta: [] },
          ] },
        ] },

      { id: "mari", nome: "Mari 🌻", app: "zap", cor: "#f9a825", chega: 50,
        mensagens: [
          { de: "ela", t: "Viu o show sertanejo de sábado?" },
        ],
        novas: [
          { de: "ela", t: "Bora? Vai a galera toda 🤠" },
          { de: "ela", t: "Mas sem você ficar falando do réveillon a noite inteira, hein" },
        ],
        rodadas: [
          { esperaNovas: true, opcoes: [
            { eu: "Tô dentro! Já separei a camisa xadrez 🤠", volta: ["Kkkkk combinado. Te busco às 22h"] },
            { eu: "Não prometo nada sobre o réveillon. É no Nordeste!!", volta: ["MEU DEUS 😂", "Vou levar protetor de ouvido"] },
          ] },
        ] },

      { id: "jessica", nome: "Jéssica (vizinha)", app: "zap", cor: "#00838f",
        mensagens: [
          { de: "ela", t: "Oi, aqui é a Jéssica do 18" },
          { de: "ela", t: "Alguém tá peidando muito no elevador, você sabe quem é?" },
        ],
        rodadas: [
          { opcoes: [
            { eu: "Deve ser a freira do 7º", volta: ["A IRMÃ??", "Não acredito que você falou isso 😂"] },
            { eu: "Não sei de nada. Mas quer tomar um vinho?", volta: ["Foi você né", "Eu sabia"] },
          ] },
        ] },

      { id: "mae", nome: "Mãe ❤️", app: "zap", cor: "#ad1457",
        mensagens: [
          { de: "ela", t: "Filho, tá comendo direito?" },
          { de: "ela", t: "Quando vai me apresentar uma namorada? Sua prima já vai casar." },
          { de: "ela", t: "Bom dia 🌹🙏 (imagem de flores)" },
        ],
        rodadas: [
          { opcoes: [
            { eu: "Esse ano eu sossego, mãe. Prometo.", volta: ["Você falou isso ano passado.", "E no outro.", "Te amo mesmo assim ❤️"] },
            { eu: "Bom dia mãe 🌹🙏", volta: ["Que Deus te abençoe e te dê juízo 🙏"] },
          ] },
        ] },

      // convite pro churrasco: ele responde com o áudio dele (voz gravada, trancada no pacote da área dos amigos)
      { id: "vibola_churras", nome: "Vibola 🕶️", app: "zap", cor: "#455a64", chega: 20,
        mensagens: [
          { de: "ele", t: "Fala, Brabo!" },
        ],
        novas: [
          { de: "ele", t: "Sábado tem churrasco lá em casa 🔥🥩" },
          { de: "ele", t: "Truco, chope gelado e a zoeira de sempre. Vai colar?" },
        ],
        rodadas: [
          { esperaNovas: true, opcoes: [
            { eu: "🎤 Responder com áudio", audio: "assets/audio/amigos/eu_churras_convite.mp3", dur: 9,
              volta: ["KKKKKKKKKKKK", "Calma, rapaz 😂 É só um churrasco", "Traz o carvão então, animado"] },
          ] },
        ] },

      { id: "apocalipse", nome: "Apocalipse Boys 💀🔥", app: "zap", grupo: true, cor: "#37474f",
        membros: ["Vibola", "Gustavinho", "Juan", "Vini", "Bruno Moon", "Carioca"],
        mensagens: [
          { de: "Bruno Moon", t: "QUEM VAI HOJE???" },
          { de: "Carioca", t: "Já tô na rua, alguém me atende!!" },
          { de: "Juan", t: "Atende o Carioca aí, ele tá ligando pra todo mundo" },
          { de: "Vini", t: "Ele me ligou 6 vezes em 2 minutos" },
          { de: "eu", t: "Rapaziada, olhem o direct que eu recebi 👀" },
          { de: "Gustavinho", t: "Lá vem" },
          { de: "Vibola", t: "Se for a de Campinas de novo eu saio do grupo" },
        ],
        chega: 90,
        novas: [
          { de: "Bruno Moon", t: "Bora na baladinha sexta? Lista vip até meia-noite" },
          { de: "Juan", t: "Só se o mestre do churrasco prometer não falar do réveillon" },
          { de: "Carioca", t: "TÔ LIGANDO PRA VCS ATENDE" },
        ],
        rodadas: [
          { opcoes: [
            { eu: "Esse é meu último ano na bagunça, tenho que aproveitar!", volta: [
              { de: "Vini", t: "Último ano 🤡" }, { de: "Juan", t: "Desde 2015" }, { de: "Vibola", t: "Print pra cobrar ano que vem 📸" }] },
            { eu: "Galera, réveillon no Nordeste, quem fecha?", volta: [
              { de: "Juan", t: "Ano passado você não disse que era o último?" },
              { de: "Vini", t: "12 réveillons seguidos no Nordeste. DOZE 🤡" },
              { de: "Gustavinho", t: "Já é o tio da Sukita da praia 🧃👴" },
              { de: "Vibola", t: "Se enxerga, mano" },
              { de: "Bruno Moon", t: "Eu fecho!! 🏖️ (pela 12ª vez)" }] },
            { eu: "Mandem o Carioca parar de ligar", volta: [
              { de: "Carioca", t: "SÓ ATENDER UMA VEZ, IRMÃO" }] },
          ] },
          { esperaNovas: true, opcoes: [
            { eu: "Sexta eu tô dentro. Vou de camisa social preta 😎", volta: [
              { de: "Juan", t: "A mesma de sempre" }, { de: "Bruno Moon", t: "Fechou, lista vip no nome do Brabo 😂" }] },
            { eu: "Sexta não posso, tenho vinho marcado 🍷", volta: [
              { de: "Vibola", t: "Com quem? Com a garrafa?" }, { de: "Gustavinho", t: "KKKKKKKKKK" }] },
          ] },
        ] },

      // Instagrão: directs
      { id: "nanda", nome: "nanda.praia", app: "insta", cor: "#e65100",
        mensagens: [
          { de: "ela", t: "Vi que você vai pro Nordeste no réveillon 👀" },
          { de: "ela", t: "Eu sou de Maceió hein" },
        ],
        rodadas: [
          { opcoes: [
            { eu: "Então já tenho guia turística? 😏", volta: ["Depende... você paga a água de coco?", "🥥😂"] },
            { eu: "Me passa umas dicas de praia?", volta: ["Passo sim! Mas só se você tirar o bigode 🥸", "Brincadeira, deixa 😂"] },
          ] },
        ] },

      { id: "paty", nome: "paty_balada", app: "insta", cor: "#8e24aa", chega: 35,
        mensagens: [
          { de: "ela", t: "Curtiu minha foto de 2019 kkkkkk" },
        ],
        novas: [
          { de: "ela", t: "Sexta vou na baladinha, vai também?" },
        ],
        rodadas: [
          { esperaNovas: true, opcoes: [
            { eu: "Foi sem querer! Mas já que tô aqui... vou sim 😎", volta: ["Kkkk te vejo lá então 🍸"] },
            { eu: "Vou se você tomar um vinho comigo antes 🍷", volta: ["Vinho antes da balada?? Você tem 60 anos? 😂", "...mas ok"] },
          ] },
        ] },

      { id: "carol", nome: "carol.viagens", app: "insta", cor: "#1565c0",
        mensagens: [
          { de: "eu", t: "Que foto linda! Bora tomar um vinho pra você me contar da viagem? 🍷" },
          { de: "ela", t: "Visualizado" },
        ],
        rodadas: [] },
    ],

    ligacoes: [
      // A Mãe: ele atende e responde com o áudio dele (voz gravada, trancada no pacote da área dos amigos)
      { id: "mae", nome: "Mãe ❤️", cor: "#ad1457", so: ["casa_amigo"], // só liga quando ele está no churrasco
        conversas: [
          { passos: [
            { quem: "ele", t: "Filho? Tá acordado ainda? Já passou da meia-noite..." },
            { quem: "eu", audio: "assets/audio/amigos/eu_mae_ligacao.mp3" },
            { quem: "ele", t: "Ai, esse menino... Juízo, hein! A bênção. ❤️" },
          ] },
        ] },
      { id: "bruno_moon", nome: "Bruno Moon", cor: "#283593",
        conversas: [
          { falas: ["Alô! Fala, Brabo! Cê vem ou não vem??", "Tá todo mundo aqui, só falta você e o Carioca!"],
            opcoes: [
              { eu: "Tô saindo agora!", volta: ["Saindo agora igual semana passada? Chegou às 3h"] },
              { eu: "Hoje vou ficar em casa, tomar um vinho", volta: ["VINHO? Sozinho?? Cara... vou te mandar áudio depois"] },
            ] },
          { falas: ["Irmão, liguei só pra saber: e o réveillon, fechou mesmo?"],
            opcoes: [
              { eu: "Fechadíssimo! Nordeste, meu parceiro", volta: ["De novo? Já é o 12º, irmão! Você não tinha dito que o do ano passado era o último?", "Tá virando o tio da Sukita, se enxerga 😂"] },
              { eu: "Tô vendo ainda...", volta: ["Vendo o quê? É Nordeste há 12 anos, tio da Sukita 😂"] },
            ] },
          { falas: ["Atende o Carioca, pelo amor de Deus, ele tá me ligando achando que eu sou você"],
            opcoes: [{ eu: "Kkkkkk deixa ele", volta: ["Deixar nada, já passei teu número de novo"] }] },
        ] },
      { id: "carioca", nome: "Carioca", cor: "#00695c",
        conversas: [
          { falas: ["Aê, mermão! Finalmente atendeu, pô!", "Bora brotar no rolê hoje? Vai ser brabo!"],
            opcoes: [
              { eu: "Bora! Me manda a localização", volta: ["Já mandei no grupo, tu não lê o grupo não?"] },
              { eu: "Hoje não, Carioca...", volta: ["Hoje não?? Tu tá namorando? Ih, olha ele..."] },
            ] },
          { falas: ["Mermão, liguei só pra ver se tu tava vivo", "Tu não atende, pô!"],
            opcoes: [{ eu: "Tô vivo, Carioca. Tô vivo.", volta: ["Então brota! Abraço, valeu, falou!"] }] },
          { falas: ["Ô, aquela mina do insta perguntou de tu, hein..."],
            opcoes: [
              { eu: "Qual mina??", volta: ["Ih, esqueci o nome. Te ligo depois! 📞"] },
              { eu: "Já sei quem é 😎", volta: ["Sabe nada! Tô inventando, só queria que tu atendesse kkkkk"] },
            ] },
        ] },
    ],

    posts: [
      { icone: "🍷", fundo: "linear-gradient(135deg,#4a0e2e,#b0279a)", legenda: "Sextou com classe 🍷 #vinho #solteiro", curtidas: 87 },
      { icone: "🔥", fundo: "linear-gradient(135deg,#3e1f00,#ff7a18)", legenda: "Mestre do churrasco 🥩🔥 (a picanha não foi eu que comprei)", curtidas: 142 },
      { icone: "🏖️", fundo: "linear-gradient(135deg,#0277bd,#ffd54f)", legenda: "Contagem regressiva pro réveillon no Nordeste ☀️ #esseanovai", curtidas: 64 },
      { icone: "🥸", fundo: "linear-gradient(135deg,#3b2a1a,#a1887f)", legenda: "Bigode em dia ✅", curtidas: 203 },
      { icone: "🚗", fundo: "linear-gradient(135deg,#263238,#90a4ae)", legenda: "Partiu 🚗💨", curtidas: 58 },
      { icone: "🪞", fundo: "linear-gradient(135deg,#1a1a2e,#6a5acd)", legenda: "Selfie no elevador (a freira não gostou)", curtidas: 121 },
      { icone: "🍻", fundo: "linear-gradient(135deg,#5d4037,#ffca28)", legenda: "Apocalipse Boys reunidos 💀", curtidas: 176 },
      { icone: "🌃", fundo: "linear-gradient(135deg,#0b0712,#3949ab)", legenda: "A noite é uma criança 🌙", curtidas: 95 },
      { icone: "🥐", fundo: "linear-gradient(135deg,#6d4c41,#ffe0b2)", legenda: "Café da padaria pra curar a ressaca ☕", curtidas: 49 },
    ],
    avisos: [
      "nanda.praia curtiu sua foto ❤️",
      "paty_balada começou a seguir você",
      "lari.fit curtiu sua foto (sem querer, ela disse)",
      "carol.viagens visualizou seu story",
      "bruno.moon comentou: \"último ano kkkkk\"",
      "vibola comentou: \"bigode de delegado\"",
    ],
  };
  if (global.NSF) global.NSF.CELULAR = CELULAR;
  if (typeof module !== "undefined") module.exports = CELULAR;
})(typeof window !== "undefined" ? window : globalThis);
