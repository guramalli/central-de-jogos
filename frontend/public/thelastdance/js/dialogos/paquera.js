// Paquera: o que ele fala para as meninas e como cada uma reage. RASCUNHO — edite à vontade, o formato fica.
//
// perfis: uma entrada por menina (o NPC da planta aponta para cá com  paquera: "<id do perfil>")
//   nome: o nome dela (só aparece se ela topar) ; retrato: imagem da cabeça (caixa de diálogo)
//   tipo: personalidade — simpatica | engracada | metida | timida | fitness | freira (muda o que funciona com ela)
//   dificuldade: 1 (fácil) a 5 (muito difícil) — quanto interesse ela precisa ter para topar o vinho
//   ignora: chance (0 a 1) de ela nem dar bola ; perguntas: assuntos só dela (somam com os gerais do tipo)
//   topou / fora / ignorou: o que ela diz no final ; zap: a mensagem que ela manda no celular se topar
//
// Cada resposta: { t: o que ele fala, nota: "boa" | "media" | "ruim", gosta: [tipos que amam], odeia: [tipos que odeiam],
//   tapa: true (cantada pesada: com quem odeia, leva um tapa), volta: { bom: "...", ruim: "..." } (reação própria) }
// Em cada rodada aparecem 3 opções (uma boa, uma média e uma ruim, embaralhadas).
(function (global) {
  "use strict";
  const PAQUERA = {
    perfis: {
      // ---- balada (pista de dança): paquera rápida; cena de beijo/tapa com os 3D (sprites3d.json > cenas)
      balada_ruiva: { nome: "Bia", retrato: "assets/characters/npcs/balada_ruiva/retrato.png", tipo: "engracada", rapido: true },
      balada_loira: { nome: "Carol", retrato: "assets/characters/npcs/balada_loira/retrato.png", tipo: "simpatica", rapido: true },
      balada_morena: { nome: "Duda", retrato: "assets/characters/npcs/balada_morena/retrato.png", tipo: "timida", rapido: true },

      vestido_vermelho: { nome: "Rafaela", retrato: "assets/characters/npcs/vestido_vermelho/frente/cabeca.png",
        tipo: "metida", dificuldade: 4, ignora: 0.25,
        perguntas: [
          { ela: "Esse vestido? Comprei em Milão. Você já foi pra Europa?",
            respostas: [
              { t: "Ainda não... mas com uma guia dessas eu ia amanhã.", nota: "boa", gosta: ["metida"] },
              { t: "Já fui pro Paraguai. É quase.", nota: "media", gosta: ["engracada"], odeia: ["metida"] },
              { t: "Europa é superestimada. Bom mesmo é Ubatuba.", nota: "ruim" },
            ] },
        ],
        topou: "Tá bom, vai... um vinho. Mas se for de tampinha de rosca eu vou embora. 💋",
        fora: "Amor, eu não tenho tempo pra isso. Vai catar coquinho.",
        ignorou: "Ela olha você de cima a baixo, suspira e volta pro celular.",
        zap: "Oi, é a Rafaela, da padaria. Que horas é esse vinho? Não vou esperar muito 💅" },

      loira_cargo: { nome: "Júlia", retrato: "assets/characters/npcs/loira_cargo/frente/cabeca.png",
        tipo: "simpatica", dificuldade: 2, ignora: 0.12,
        perguntas: [
          { ela: "Haha, eu tava rindo de um meme de cachorro. Você gosta de cachorro?",
            respostas: [
              { t: "Amo! Tenho um caramelo que se chama Picanha.", nota: "boa", gosta: ["simpatica", "engracada"] },
              { t: "Gosto, mas prefiro gato. Eles não julgam.", nota: "media" },
              { t: "Cachorro? Só se for quente, com purê.", nota: "ruim", gosta: ["engracada"], odeia: ["simpatica"] },
            ] },
        ],
        topou: "Ai, você é bobo demais 😂 Tá, bora! Mas eu escolho a série depois.",
        fora: "Ah... acho que não, viu? Mas boa sorte aí! Vai catar coquinho com carinho. 😅",
        ignorou: "Ela tá de fone, rindo de um vídeo. Nem percebeu que você tá ali.",
        zap: "Oii, é a Júlia da padaria 😊 Ainda tá de pé o vinho? Eu levo pipoca!" },

      cacheada_saia: { nome: "Lívia", retrato: "assets/characters/npcs/cacheada_saia/frente/cabeca.png",
        tipo: "engracada", dificuldade: 3, ignora: 0.15,
        perguntas: [
          { ela: "Minha amiga disse que você é o cara do bigode da balada. É verdade?",
            respostas: [
              { t: "O bigode é meu. A fama veio sozinha.", nota: "boa", gosta: ["engracada", "metida"] },
              { t: "Depende. O que falaram de mim?", nota: "media" },
              { t: "Não, eu sou o primo dele. O bonito da família.", nota: "media", gosta: ["engracada"] },
              { t: "Sou eu sim. E você é a gata mais bonita da padaria.", nota: "ruim", odeia: ["engracada"] },
            ] },
        ],
        topou: "Kkkkk tá, você me ganhou no bigode. Vinho e risada, combinado!",
        fora: "Kkkk ai, não. Vai catar coquinho, vai. Mas foi engraçado!",
        ignorou: "Ela cochicha alguma coisa com a amiga e as duas caem na risada. De você.",
        zap: "Aqui é a Lívia, a do cabelo 🌀 Separa o vinho que eu levo as piadas" },

      morena_moletom: { nome: "Tati", retrato: "assets/characters/npcs/morena_moletom/frente/cabeca.png",
        tipo: "timida", dificuldade: 3, ignora: 0.3,
        perguntas: [
          { ela: "Ai... desculpa, eu tô procurando Guaraná zero. Nunca tem, né?",
            respostas: [
              { t: "Deixa comigo. Seu Zé! Tem Guaraná zero aí pra moça?", nota: "boa", gosta: ["timida", "simpatica"] },
              { t: "Toma esse normal mesmo, açúcar faz bem pra alma.", nota: "media", gosta: ["engracada"] },
              { t: "Zero? Você não precisa disso não, viu... 😏", nota: "ruim", odeia: ["timida"] },
            ] },
        ],
        topou: "Tá... pode ser. Mas só um pouquinho de vinho, tá? 🙈",
        fora: "Ah... não, obrigada. Licença... (e sai rapidinho)",
        ignorou: "Ela fica vermelha, pega o primeiro refrigerante que vê e vai embora sem olhar pra você.",
        zap: "oi... é a Tati, do guaraná zero 🙈 o vinho é hoje mesmo?" },

      coroa_fitness: { nome: "Sandra", retrato: "assets/characters/npcs/coroa_fitness/frente/cabeca.png",
        tipo: "fitness", dificuldade: 3, ignora: 0.2,
        perguntas: [
          { ela: "Pão com ovo a essa hora? Você treina?",
            respostas: [
              { t: "Treino sim! Hoje foi perna. Amanhã também. (mentira)", nota: "boa", gosta: ["fitness"] },
              { t: "Treino a mandíbula. Todo dia.", nota: "media", gosta: ["engracada"], odeia: ["fitness"] },
              { t: "Academia é coisa de quem não tem charme natural.", nota: "ruim", odeia: ["fitness"] },
            ] },
        ],
        topou: "Vinho tinto tem antioxidante. Então tá liberado. Às 21h, e sem atraso.",
        fora: "Querido, eu tenho treino às 5 da manhã. Vai catar coquinho.",
        ignorou: "Ela conta as calorias do pão de queijo no app e nem olha pra você.",
        zap: "Sandra aqui. Vinho às 21h, eu levo castanhas. Não se atrase. 💪" },

      gordinha_loira: { nome: "Kelly", retrato: "assets/characters/npcs/gordinha_loira/frente/cabeca.png",
        tipo: "engracada", dificuldade: 2, ignora: 0.12,
        perguntas: [
          { ela: "Esse pão de queijo é o melhor da cidade. Já provou?",
            respostas: [
              { t: "Provei! Mas com você do lado ficou ainda melhor.", nota: "media", gosta: ["simpatica"] },
              { t: "Bora dividir um? Eu pago, você escolhe.", nota: "boa", gosta: ["engracada", "simpatica"] },
              { t: "Não como carboidrato depois das 18h.", nota: "ruim", odeia: ["engracada"] },
            ] },
        ],
        topou: "Kkkk só se tiver queijo junto com o vinho! Fechou!",
        fora: "Kkkkk não, meu filho. Vai catar coquinho!",
        ignorou: "Ela tá focada no pão de queijo. Você não tem a menor chance contra o pão de queijo.",
        zap: "Kelly aqui!! Comprei o queijo 🧀🍷 que horas?" },

      // A irmã do elevador: dá para tentar... mas a resposta é sempre a mesma.
      freira: { nome: "Irmã Clemência", retrato: "assets/characters/npcs/freira/frente/cabeca.png",
        tipo: "freira", dificuldade: 99, ignora: 0,
        perguntas: [
          { ela: "Meu filho, você foi à missa domingo?",
            respostas: [
              { t: "Fui sim, irmã! (não fui)", nota: "media" },
              { t: "Domingo eu tava de ressaca, irmã.", nota: "media" },
              { t: "Missa não, mas eu rezo toda vez que o elevador trava.", nota: "boa" },
            ] },
        ],
        topou: "",
        fora: "Vá com Deus, meu filho. E vá logo, que eu desço no térreo. 🙏",
        ignorou: "",
        zap: "" },
    },

    // Como ele chega nela (primeira fala dele).
    // ---------------- BALADA: paquera rápida (uma escolha só). Deu certo = beijo; deu errado = tapa (ou um fora).
    // perfil com  rapido: true  (as meninas da pista). chance de cada tipo de chegada dar certo, por personalidade:
    balada: {
      chegada: ["Ela te vê chegando e abre um sorrisinho.", "Ela para de dançar e te olha.", "A música tá alta. Ela chega mais perto pra ouvir."],
      oi: ["Oi! 😉", "E aí?", "Opa... oi.", "Hm? Fala!"],
      chance: {
        direta: { engracada: 0.55, simpatica: 0.75, timida: 0.35 },
        piada: { engracada: 0.85, simpatica: 0.55, timida: 0.6 },
        pesada: { engracada: 0.1, simpatica: 0.1, timida: 0.05 },
      },
      opcoes: [
        { tipo: "direta", t: "Te vi ali de longe me olhando... quer me beijar?" },
        { tipo: "direta", t: "Vou ser sincero: tô te olhando a noite toda. Bora um beijo?" },
        { tipo: "direta", t: "Já que você não para de me olhar... me dá um beijo logo?" },
        { tipo: "piada", t: "Qual o contrário de volátil? Vem cá, sobrinho. 😏" },
        { tipo: "piada", t: "Você é sócia do DJ? Porque desde que te vi meu coração tá no grave." },
        { tipo: "piada", t: "Eu ia te pagar um drink, mas o barman disse que você já é a coisa mais doce daqui." },
        { tipo: "piada", t: "Acredita em amor à primeira vista ou eu passo aqui na frente de novo?" },
        { tipo: "piada", t: "Sabe o que o pagodeiro foi fazer na igreja? Cantar pá God. 🥁" },
        { tipo: "pesada", t: "Esse look ia ficar lindo no chão do meu quarto." },
        { tipo: "pesada", t: "Gata, se beleza desse cadeia você pegava perpétua. E eu era o carcereiro." },
      ],
      riu: ["KKKKKKKK para! 😂", "Hahaha, que horror... mas eu ri. 😂", "Ai, que bobo! 🤭", "Kkkkk tá, essa foi boa."],
      topou: ["Achei que você nunca ia perguntar... 😘", "Vem cá então. 😏", "Tá bom, vai... 💋"],
      tapa: ["Atrevido! 💢", "Se enxerga, ô!", "Tá me achando com cara de quê?!"],
      sem_graca: ["Sem graça... 🙄", "Nossa. Não.", "Essa foi a pior que eu já ouvi hoje."],
      ja: { beijo: "Mais um? Hoje não, já foi o meu limite. 😘", tapa: "Quer outro? 🖐️", fora: "Já falei, né? Sem chance." },
    },

    aberturas: [
      { t: "Oi! Desculpa interromper, mas eu precisava falar com você.", nota: "boa", gosta: ["timida", "simpatica"] },
      { t: "Você acredita em amor à primeira vista ou eu passo de novo?", nota: "media", gosta: ["engracada"], odeia: ["metida"] },
      { t: "Licença... esse lugar tá ocupado? Porque meu coração tá.", nota: "media", gosta: ["engracada"], odeia: ["metida", "fitness"] },
      { t: "E aí, gata, vem sempre aqui?", nota: "ruim", odeia: ["metida", "timida"] },
      { t: "Oi. Eu sou péssimo nisso, então vou direto: posso sentar aqui?", nota: "boa", gosta: ["simpatica", "metida", "engracada"] },
      { t: "Psiu! Ô, princesa!", nota: "ruim", odeia: ["metida", "timida", "simpatica", "fitness"], tapa: true },
      { t: "Bom dia! Você tem cara de quem sabe qual é o melhor pão daqui.", nota: "boa", gosta: ["simpatica", "fitness", "engracada"] },
    ],

    // Assuntos que qualquer uma pode puxar (somam com as perguntas do perfil).
    perguntas: [
      { ela: "E aí, você faz o quê da vida?",
        respostas: [
          { t: "Trabalho de dia e sou mestre do churrasco no fim de semana.", nota: "boa", gosta: ["simpatica", "engracada"] },
          { t: "Sou empresário. (Vendo bala no farol, mas é um negócio.)", nota: "media", gosta: ["engracada"], odeia: ["metida"] },
          { t: "Sou influencer. Tenho 1873 seguidores.", nota: "ruim", gosta: ["engracada"], odeia: ["metida", "fitness"] },
          { t: "Não posso falar. É confidencial.", nota: "media", odeia: ["timida"] },
        ] },
      { ela: "Você curte sair, balada, essas coisas?",
        respostas: [
          { t: "Curto, mas um vinho em casa com boa companhia ganha de qualquer balada.", nota: "boa", gosta: ["timida", "simpatica", "metida"] },
          { t: "Esse é meu último ano de bagunça. Ano que vem eu sossego.", nota: "media", gosta: ["engracada"],
            volta: { bom: "Kkkk aham, todo mundo fala isso.", ruim: "Último ano? Sei..." } },
          { t: "Balada todo dia! Hoje, amanhã e depois. Bora?", nota: "ruim", odeia: ["timida", "fitness"] },
        ] },
      { ela: "Que tipo de música você escuta?",
        respostas: [
          { t: "Sertanejo raiz. Mas se você gostar de outra coisa, eu aprendo.", nota: "boa", gosta: ["simpatica", "timida"] },
          { t: "Música de elevador. Passo muito tempo lá. 20 andares.", nota: "media", gosta: ["engracada"] },
          { t: "Só funk proibidão no último volume.", nota: "ruim", odeia: ["metida", "timida", "simpatica"] },
        ] },
      { ela: "Você tá solteiro mesmo ou é daqueles que dizem que tá?",
        respostas: [
          { t: "Solteiro e sem vergonha de dizer que tô gostando de conversar com você.", nota: "boa", gosta: ["metida", "simpatica"] },
          { t: "Solteiríssimo. Minha mãe pergunta toda semana.", nota: "media", gosta: ["engracada", "simpatica"] },
          { t: "Hoje sim. Amanhã eu vejo.", nota: "ruim", odeia: ["timida", "simpatica", "metida"] },
        ] },
      { ela: "Hm. E o que você quer comigo, afinal?",
        respostas: [
          { t: "Sinceramente? Te conhecer melhor. Você parece interessante.", nota: "boa", gosta: ["timida", "metida", "simpatica"] },
          { t: "Seu número. E a senha do Wi-Fi, se tiver.", nota: "media", gosta: ["engracada"] },
          { t: "O que todo homem quer, né, gata? 😏", nota: "ruim", odeia: ["metida", "timida", "simpatica", "fitness", "engracada"], tapa: true },
        ] },
    ],

    // O convite final para o vinho.
    convites: [
      { t: "Comprei um vinho chileno e ele tá triste sozinho. Me ajuda a resolver isso?", nota: "boa", gosta: ["engracada", "simpatica"] },
      { t: "Que tal continuar essa conversa lá em casa? Um vinho, uma série e zero pressão.", nota: "boa", gosta: ["timida", "metida", "simpatica"] },
      { t: "Bora lá em casa tomar um vinho? Moro no 20º andar, a vista é linda.", nota: "media", gosta: ["metida"] },
      { t: "Lá em casa tem vinho de R$ 39,90. É chileno. Acho.", nota: "media", gosta: ["engracada"], odeia: ["metida"] },
      { t: "Vamo lá pra casa que eu te mostro meu bigode de perto.", nota: "ruim", gosta: ["engracada"], odeia: ["timida", "metida", "fitness"] },
      { t: "Partiu minha casa? Tô sem tempo pra enrolação.", nota: "ruim", odeia: ["timida", "simpatica", "metida"], tapa: true },
    ],

    // Reações (quando a resposta não tem "volta" própria), por tipo e por quanto ela gostou.
    reacoes: {
      geral: {
        amou: ["Haha, gostei de você. 😊", "Olha... que resposta boa.", "Tá, essa foi boa. 😏"],
        gostou: ["Hm, interessante.", "Kkk tá bom.", "Até que você é engraçado."],
        neutro: ["Ahn... tá.", "Hum.", "Ok..."],
        nao_curtiu: ["Sério isso? 🙄", "Nossa...", "Que coisa, hein."],
        odiou: ["Como é que é?! 😤", "Você tá falando sério?", "Credo."],
      },
      metida: { amou: ["Hm. Você tem bom gosto, pelo menos. 💅"], odiou: ["Amor, se enxerga."] },
      timida: { amou: ["Ai... obrigada. 🙈"], odiou: ["Eu... preciso ir..."] },
      engracada: { amou: ["KKKKKKK para! 😂"], gostou: ["Kkkkk boa!"] },
      fitness: { amou: ["Gostei da disciplina! 💪"], odiou: ["Isso não tem proteína nenhuma."] },
      freira: {
        amou: ["Deus te abençoe, meu filho. 🙏"], gostou: ["Hum. Reze mais."], neutro: ["Sei..."],
        nao_curtiu: ["Pai Nosso que estais no céu..."], odiou: ["Vou rezar por você. Muito."],
      },
    },
  };
  if (global.NSF) global.NSF.PAQUERA = PAQUERA;
  if (typeof module !== "undefined") module.exports = PAQUERA;
})(typeof window !== "undefined" ? window : globalThis);
