import { nomeDoTituloQuiz, QUIZ_NOMES, QUIZ_NIVEIS, TITULO_LENDARIO, RAPIDO_TITULOS, RAPIDO_SEGUNDOS } from "../game/titulosConfig.js";

// ===== CATÁLOGO DO AVATAR (boneco chibi em camadas) =====
//
// Cada peça é um PNG/WebP transparente do MESMO tamanho de tela (900×1200,
// retrato, personagem de corpo inteiro centralizado embaixo, com folga em
// cima). Por isso montar o boneco é só empilhar as camadas na ordem de
// CAMADAS — nada de posicionar peça por peça.
//
// TUDO É GRÁTIS: nenhuma peça é vendida. Algumas vêm liberadas pra todo
// mundo ("inicial"); as outras se ganham jogando (ver os tipos de desbloqueio
// abaixo e src/avatar/desbloqueio.js, que confere cada regra contra os dados
// reais).
//
// COMO ACRESCENTAR UMA PEÇA:
//   1. salvar a arte em frontend/public/avatar/<slot>/<id>-<VERSAO_ARTE>.webp;
//   2. acrescentar a linha em LISTA;
//   3. subir VERSAO_CATALOGO (o navegador guarda o catálogo em cache).
// A versão no nome do arquivo é de propósito: arquivo de nome fixo fica
// preso no cache do service worker. Pra trocar a arte TODA (como na v2, que
// fechou as frestas do contorno da careca), exporte tudo com o sufixo novo e
// suba VERSAO_ARTE — o id da peça (o que fica no banco) não muda.
//
// Enquanto a arte não existe, o frontend pula a camada que falta (e desenha
// uma silhueta tracejada se faltar o corpo) — o sistema funciona sem arte.
//
// Este arquivo não fala com o banco (só lê a config dos títulos, que também
// é pura): os testes e o script de fechamento do mês importam ele à vontade.

// Sobe a cada mudança em LISTA: o frontend usa pra invalidar o cache dele.
// v4: `motivo` de cada peça, cabelos pintáveis e a paleta CORES_CABELO.
// v6: arte v2, coroas e troféus por jogo (com a plaqueta do mês), undercut
// rosa e a mão esquerda.
// v7: corpo feminino, máscaras que apagam o braço, escada do Quiz com as
// peças de ouro (aura) e o conjunto Relâmpago.
// (O frontend tem uma cópia deste número em avatarCatalogo.js, que vai no
// "?v=" da busca — suba as duas juntas.)
export const VERSAO_CATALOGO = 7;

// Sufixo dos arquivos de arte (peças, máscaras de pele e cinzas).
export const VERSAO_ARTE = "v2";

// Tamanho da tela de todas as camadas e os dois recortes usados fora do
// corpo inteiro (em pixels da tela):
//   cabeca — só a cabeça, pras bolinhas pequenas (chat, listas: 28–40px);
//   busto  — cabeça e ombros, pras bolinhas grandes (pódio, cartão do nick).
// Moram aqui, e não no CSS, pra serem ajustados junto com a arte.
//
// Medidos na arte final: a cabeça (orelha a orelha) vai de x 235 a 665 e
// de y 290 (topo, careca) a ~700 (queixo); os ombros ficam em ~y 760 e os
// pés em ~y 1100. O recorte da cabeça deixa um respiro em volta; o topo de
// chapéus altos (elmo, cartola) fica de fora de propósito, senão o rosto
// encolheria demais a 28px.
export const TELA = {
  largura: 900,
  altura: 1200,
  cabeca: { x: 225, y: 265, lado: 450 },
  busto: { x: 140, y: 220, lado: 620 },
};

// ===== Corpo =====
//
// Cada pele tem DUAS artes, mesma silhueta: masculina (<id>-v2.webp) e
// feminina (<id>-f-v2.webp: cílios, bochechas rosadas, lábios). A escolha
// fica em avatarMontado.corpo; sem a chave = masculino (o corpo de sempre),
// então só "feminino" é gravado. Todas as peças servem nos dois corpos.
export const CORPOS = [
  { chave: "masculino", nome: "Masculino" },
  { chave: "feminino", nome: "Feminino" },
];
export const CORPO_PADRAO = "masculino";
export const corpoValido = (corpo) => (corpo === "feminino" ? "feminino" : CORPO_PADRAO);

// Slots que a pessoa escolhe. `pele` é o corpo-base (com o rosto padrão) e é
// o único obrigatório; os demais podem ficar vazios.
export const SLOTS = [
  { slot: "pele", nome: "Pele", obrigatorio: true },
  { slot: "cabelo", nome: "Cabelo" },
  { slot: "roupa", nome: "Roupa" },
  { slot: "parteDeBaixo", nome: "Calça/saia" },
  { slot: "chapeu", nome: "Chapéu" },
  { slot: "rosto", nome: "Rosto" },
  { slot: "pescoco", nome: "Pescoço" },
  { slot: "costas", nome: "Costas" },
  { slot: "mao", nome: "Na mão" },
  // Segunda mão: usa as MESMAS peças de "mao", espelhadas na horizontal (o
  // corpo é simétrico, então o objeto cai na outra mão). `pecasDe` diz de
  // que slot vêm as peças.
  { slot: "maoEsquerda", nome: "Mão esquerda", pecasDe: "mao" },
  { slot: "fundo", nome: "Fundo" },
];
export const NOMES_DOS_SLOTS = SLOTS.map((s) => s.slot);

// Slot de onde vêm as peças de cada slot (só a mão esquerda empresta).
export const SLOT_DAS_PECAS = Object.fromEntries(SLOTS.map((s) => [s.slot, s.pecasDe || s.slot]));
// Slots desenhados espelhados.
export const SLOTS_ESPELHADOS = ["maoEsquerda"];

// Ordem de desenho, de baixo pra cima. O chapéu vem DEPOIS do cabelo e não
// esconde nada: a arte do chapéu já é desenhada por cima do cabelo.
export const CAMADAS = ["fundo", "costas", "pele", "parteDeBaixo", "roupa", "pescoco", "cabelo", "rosto", "chapeu", "mao", "maoEsquerda"];

// Tipos de desbloqueio aceitos (conferidos em desbloqueio.js):
//   { tipo: "inicial" }                                   todo mundo (menos visitante)
//   { tipo: "titulo", tema: "anime", nivel: "ouro" }      título do Quiz daquele tema/nível
//   { tipo: "titulo", nome: "Lenda do Educação Gamer" }   título pelo nome exato
//   { tipo: "campeao", jogo: "acromania" }                campeão do mês do jogo (CampeaoMensal), em ALGUM mês
//   { tipo: "patente", jogo: "quiz", patente: "calouro" } patente alcançada em ALGUM mês
//   { tipo: "sequencia", dias: 30 }                       recorde de dias seguidos jogando
//   { tipo: "pontos", jogo: "stop", min: 50000 }          pontos vitalícios no jogo
//   { tipo: "pontos", jogo: "total", min: 25000 }         pontos vitalícios somando todos os jogos
// jogo (patente/campeão): "stop" | "quiz" | "acromania". O Mentira Sincera
// está desligado e não libera peça nenhuma.
export const TIPOS_DE_DESBLOQUEIO = ["inicial", "titulo", "campeao", "patente", "sequencia", "pontos"];

// Nível dos títulos do Quiz como aparece pra pessoa.
export const NOME_DO_NIVEL = { bronze: "bronze", prata: "prata", ouro: "ouro" };
const INDICE_DO_NIVEL = { bronze: 0, prata: 1, ouro: 2 };

const arte = (slot, id, sufixo = "") => `/avatar/${slot}/${id}${sufixo}-${VERSAO_ARTE}.webp`;
const milhar = (n) => n.toLocaleString("pt-BR");

// Atalhos pra escrever a lista abaixo sem repetir objeto.
const inicial = { tipo: "inicial" };
const quiz = (tema, nivel) => ({ tipo: "titulo", tema, nivel });
const dias = (n) => ({ tipo: "sequencia", dias: n });
const pontos = (jogo, min) => ({ tipo: "pontos", jogo, min });
const patente = (jogo, key) => ({ tipo: "patente", jogo, patente: key });
const campeao = (jogo) => ({ tipo: "campeao", jogo });
const lendario = { tipo: "titulo", nome: TITULO_LENDARIO.nome };

export const NOME_DO_JOGO = { stop: "Stop", quiz: "Quiz", acromania: "Acromania", impostor: "Impostor", total: "todos os jogos" };

// Dica gerada da regra, pra ficar sempre coerente com ela. Peças de patente
// escrevem a dica à mão (o nome da patente mora nas tabelas de rank, que
// falam com o banco — este arquivo não importa elas).
export function dicaDaRegra(d) {
  switch (d.tipo) {
    case "inicial":
      return "Liberada pra todo mundo.";
    case "titulo":
      if (d.tema) {
        const min = QUIZ_NIVEIS[INDICE_DO_NIVEL[d.nivel]]?.min || 0;
        return `Conquiste o título de ${NOME_DO_NIVEL[d.nivel]} em ${QUIZ_NOMES[d.tema]} no Quiz: "${nomeDoTituloQuiz(d.tema, d.nivel)}" (${milhar(min)} acertos no tema).`;
      }
      if (d.nome === TITULO_LENDARIO.nome) return `Conquiste o título lendário "${TITULO_LENDARIO.nome}" (todos os títulos do portal).`;
      return `Conquiste o título "${d.nome}".`;
    case "campeao":
      return `Seja campeão do mês no ${NOME_DO_JOGO[d.jogo] || d.jogo} (1º lugar do ranking mensal).`;
    case "sequencia":
      return `Jogue ${d.dias} dias seguidos.`;
    case "pontos":
      return d.jogo === "total"
        ? `Some ${milhar(d.min)} pontos, juntando todos os jogos (desde sempre).`
        : `Some ${milhar(d.min)} pontos no ${NOME_DO_JOGO[d.jogo] || d.jogo} (desde sempre).`;
    default:
      return "";
  }
}

// A mesma regra contada no passado: é o "como ganhei" que aparece nas peças
// JÁ liberadas (editor e coleção do perfil). Como a regra é o motivo, o
// texto é fixo por peça. Peças de patente escrevem à mão, como a dica.
export function motivoDaRegra(d) {
  switch (d.tipo) {
    case "inicial":
      return "Peça inicial, liberada pra todo mundo.";
    case "titulo":
      if (d.tema) return `Conquistada com o título ${nomeDoTituloQuiz(d.tema, d.nivel)} (${NOME_DO_NIVEL[d.nivel]} em ${QUIZ_NOMES[d.tema]} no Quiz).`;
      if (d.nome === TITULO_LENDARIO.nome) return `Conquistada com o título lendário ${TITULO_LENDARIO.nome} (todos os títulos do portal).`;
      return `Conquistada com o título ${d.nome}.`;
    case "campeao":
      // Texto genérico (o catálogo é igual pra todo mundo). A tela troca por
      // "…em Set/2026, Ago/2026" com os meses de quem ganhou (campeonatos).
      return `Conquistada como campeão do mês no ${NOME_DO_JOGO[d.jogo] || d.jogo} (1º lugar do ranking mensal).`;
    case "sequencia":
      return `Conquistada por jogar ${d.dias} dias seguidos.`;
    case "pontos":
      return d.jogo === "total"
        ? `Conquistada ao somar ${milhar(d.min)} pontos, juntando todos os jogos.`
        : `Conquistada com ${milhar(d.min)} pontos no ${NOME_DO_JOGO[d.jogo] || d.jogo}.`;
    default:
      return "";
  }
}

// Rabo de cavalo e undercut rosa saem JUNTOS (mesma regra): o undercut é a
// alternativa masculina da mesma recompensa.
const DICA_DO_PAR_ROSA = "Some 5.000 pontos no Quiz (desde sempre). Libera o par rosa: Rabo de cavalo rosa e Undercut rosa.";

// Conjunto Relâmpago: título relâmpago do Stop (STOPs rápidos na Avançada).
const TITULO_RELAMPAGO = RAPIDO_TITULOS[0].nome; // "Relâmpago da Avançada"
const relampago = { tipo: "titulo", nome: TITULO_RELAMPAGO };
const DICA_RELAMPAGO = `Conquiste o título "${TITULO_RELAMPAGO}": peça ${milhar(RAPIDO_TITULOS[0].min)} STOPs em até ${RAPIDO_SEGUNDOS}s nas salas Avançadas do Stop.`;
const MOTIVO_RELAMPAGO = `Conquistada com o título ${TITULO_RELAMPAGO} (${milhar(RAPIDO_TITULOS[0].min)} STOPs relâmpago na Avançada).`;

// ===== AS 112 PEÇAS =====
// [slot, id, nome, desbloqueio, dica opcional, motivo opcional]
//
// ESCADA DO QUIZ: cada tema dá uma peça de bronze (iniciante), uma ou duas
// de prata (intermediário) e uma de ouro — as de ouro são LENDÁRIAS e têm
// aura (brilho dourado em volta do boneco inteiro). Ver ESCADA_DO_QUIZ.
const LISTA_CRUA = [
  // Pele (corpo-base com o rosto padrão) — todas iniciais. Cada uma tem as
  // duas versões de corpo (masculino e feminino, ver CORPOS).
  ["pele", "pele-clara", "Pele clara", inicial],
  ["pele", "pele-media", "Pele média", inicial],
  ["pele", "pele-morena", "Pele morena", inicial],
  ["pele", "pele-negra", "Pele negra", inicial],
  ["pele", "pele-retinta", "Pele retinta", inicial],

  ["cabelo", "cabelo-curto", "Cabelo curto", inicial],
  ["cabelo", "cabelo-cacheado", "Cacheado", inicial],
  ["cabelo", "cabelo-liso-longo", "Liso longo", inicial],
  ["cabelo", "cabelo-coque", "Coque", inicial],
  ["cabelo", "cabelo-black-power", "Black power", inicial],
  ["cabelo", "cabelo-moicano", "Moicano colorido", dias(7)],
  ["cabelo", "cabelo-anime", "Espetado de anime", quiz("anime", "prata")],
  ["cabelo", "cabelo-anime-ouro", "Cabelo dourado", quiz("anime", "ouro")],
  ["cabelo", "cabelo-rabo-rosa", "Rabo de cavalo rosa", pontos("quiz", 5000), DICA_DO_PAR_ROSA],
  ["cabelo", "cabelo-undercut-rosa", "Undercut rosa", pontos("quiz", 5000), DICA_DO_PAR_ROSA],
  ["cabelo", "cabelo-topete", "Topete de roqueiro", quiz("rock", "bronze")],
  ["cabelo", "cabelo-chamas", "Cabelo em chamas", lendario],

  ["roupa", "roupa-camiseta", "Camiseta", inicial],
  ["roupa", "roupa-moletom", "Moletom", inicial],
  ["roupa", "roupa-xadrez", "Camisa xadrez", inicial],
  ["roupa", "roupa-regata", "Regata", inicial],
  ["roupa", "roupa-futebol", "Camisa de futebol", quiz("futebol", "prata")],
  ["roupa", "roupa-camisa10-ouro", "Camisa 10 Dourada", quiz("futebol", "ouro")],
  ["roupa", "roupa-piloto", "Macacão de piloto", quiz("automobilismo", "prata")],
  ["roupa", "roupa-piloto-ouro", "Macacão cromado de campeão", quiz("automobilismo", "ouro")],
  ["roupa", "roupa-escolar", "Uniforme escolar", quiz("anime", "bronze")],
  ["roupa", "roupa-jaleco", "Jaleco", quiz("ciencias", "prata")],
  ["roupa", "roupa-jaleco-ouro", "Jaleco de gênio", quiz("ciencias", "ouro")],
  ["roupa", "roupa-beca", "Beca de formatura", quiz("terceirao", "prata")],
  ["roupa", "roupa-beca-ouro", "Beca de honra", quiz("terceirao", "ouro")],
  ["roupa", "roupa-cavaleiro-ouro", "Armadura de cavaleiro", quiz("historia", "ouro")],
  ["roupa", "roupa-pixel", "Camiseta pixel", quiz("games", "bronze")],
  ["roupa", "roupa-heroi-ouro", "Traje de herói dourado", quiz("series", "ouro")],
  ["roupa", "roupa-banda", "Camisa de banda", quiz("musica", "prata")],
  ["roupa", "roupa-rockstar-ouro", "Jaqueta de rockstar dourada", quiz("musica", "ouro")],
  ["roupa", "roupa-couro", "Jaqueta de couro", quiz("rock", "prata")],
  ["roupa", "roupa-smoking-ouro", "Smoking de gala dourado", quiz("novelas", "ouro")],
  ["roupa", "roupa-terno", "Terno de advogado", quiz("direito", "bronze")],
  ["roupa", "roupa-toga-ouro", "Toga dourada", quiz("direito", "ouro")],
  ["roupa", "roupa-relampago", "Jaqueta Relâmpago", relampago, DICA_RELAMPAGO, MOTIVO_RELAMPAGO],
  ["roupa", "roupa-manto-impostor", "Manto do impostor", dias(21)],

  ["parteDeBaixo", "baixo-shorts", "Shorts", inicial],
  ["parteDeBaixo", "baixo-jeans", "Calça jeans", inicial],
  ["parteDeBaixo", "baixo-saia", "Saia", inicial],
  ["parteDeBaixo", "baixo-moletom", "Calça de moletom", inicial],
  ["parteDeBaixo", "baixo-praia", "Bermuda de praia", dias(14)],
  ["parteDeBaixo", "baixo-camuflada", "Calça camuflada", pontos("stop", 10000)],

  ["chapeu", "chapeu-bone", "Boné", inicial],
  ["chapeu", "chapeu-gorro", "Gorro", inicial],
  ["chapeu", "chapeu-palha", "Chapéu de palha", dias(3)],
  ["chapeu", "chapeu-faixa", "Faixa esportiva", quiz("esportes", "bronze")],
  ["chapeu", "chapeu-capacete", "Capacete de piloto", quiz("automobilismo", "bronze")],
  ["chapeu", "chapeu-capelo", "Capelo", quiz("terceirao", "prata")],
  ["chapeu", "chapeu-tricornio", "Tricórnio", quiz("historia", "bronze")],
  ["chapeu", "chapeu-explorador", "Chapéu de explorador", quiz("historia", "prata")],
  ["chapeu", "chapeu-louros", "Coroa de louros", quiz("mitologia", "bronze")],
  ["chapeu", "chapeu-viking", "Elmo viking", quiz("mitologia", "prata")],
  ["chapeu", "chapeu-espartano-ouro", "Elmo espartano dourado", quiz("mitologia", "ouro")],
  ["chapeu", "chapeu-headset", "Headset gamer", quiz("games", "prata")],
  ["chapeu", "chapeu-cartola", "Cartola", quiz("cinema", "prata")],
  ["chapeu", "chapeu-panama", "Chapéu panamá", quiz("mpb", "bronze")],
  // Coroas de campeão do mês, uma por jogo ("chapeu-coroa" é a do Stop:
  // o id ficou o antigo pra não mexer em quem já veste).
  ["chapeu", "chapeu-coroa", "Coroa do Stop", campeao("stop")],
  ["chapeu", "chapeu-coroa-quiz", "Coroa do Quiz", campeao("quiz")],
  ["chapeu", "chapeu-coroa-acromania", "Coroa do Acromania", campeao("acromania")],

  ["rosto", "rosto-redondos", "Óculos redondos", inicial],
  ["rosto", "rosto-escuros", "Óculos escuros", inicial],
  ["rosto", "rosto-pintura", "Pintura verde e amarela", quiz("futebol", "bronze")],
  ["rosto", "rosto-nerd", "Óculos de nerd", quiz("ciencias", "bronze")],
  ["rosto", "rosto-3d", "Óculos 3D", quiz("cinema", "bronze")],
  ["rosto", "rosto-heroi", "Máscara de herói", quiz("series", "prata")],
  ["rosto", "rosto-monoculo", "Monóculo", quiz("letras", "prata")],
  ["rosto", "rosto-estrela", "Óculos de estrela", quiz("novelas", "bronze")],

  ["pescoco", "pescoco-cachecol", "Cachecol", inicial],
  ["pescoco", "pescoco-apito", "Apito de juiz", quiz("esportes", "prata")],
  ["pescoco", "pescoco-gravata", "Gravata borboleta", quiz("novelas", "prata")],
  ["pescoco", "pescoco-havaiano", "Colar havaiano", quiz("geografia", "prata")],
  ["pescoco", "pescoco-medalha", "Medalha de ouro", pontos("total", 25000)],

  ["costas", "costas-mochila", "Mochila", inicial],
  ["costas", "costas-trilha", "Mochila de trilha", quiz("geografia", "bronze")],
  ["costas", "costas-raio", "Rastro de raio", relampago, DICA_RELAMPAGO, MOTIVO_RELAMPAGO],
  ["costas", "costas-capa", "Capa de herói", dias(30)],
  // Patentes máximas. As do Quiz e do Stop são EXCLUSIVAS (só o 1º do mês):
  // a peça exige também o troféu de campeão daquele mês.
  ["costas", "costas-anjo", "Asas de anjo", patente("quiz", "enciclopedia"), "Chegue à patente máxima do Quiz, Enciclopédia (só o 1º do mês a leva).", "Conquistada ao alcançar a patente máxima do Quiz, Enciclopédia (1º lugar do mês)."],
  ["costas", "costas-morcego", "Asas de morcego", patente("stop", "coroa_imperial_ouro"), "Chegue à patente máxima do Stop, Coroa Imperial de Ouro (só o 1º do mês a leva).", "Conquistada ao alcançar a patente máxima do Stop, Coroa Imperial de Ouro (1º lugar do mês)."],
  ["costas", "costas-jetpack", "Jetpack", patente("acromania", "coroa_ouro"), "Chegue à patente máxima do Acromania, Coroa de Ouro (160.000 pontos num mês).", "Conquistada ao alcançar a patente máxima do Acromania, Coroa de Ouro."],

  ["mao", "mao-controle", "Controle", inicial],
  ["mao", "mao-livro", "Livro", inicial],
  ["mao", "mao-bola", "Bola de futebol", quiz("futebol", "prata")],
  ["mao", "mao-tocha-ouro", "Tocha dourada", quiz("esportes", "ouro")],
  ["mao", "mao-lapis", "Lápis gigante", quiz("terceirao", "bronze")],
  ["mao", "mao-espada-pixel-ouro", "Espada pixel lendária", quiz("games", "ouro")],
  ["mao", "mao-estatueta-ouro", "Estatueta dourada", quiz("cinema", "ouro")],
  ["mao", "mao-pipoca", "Balde de pipoca", quiz("series", "bronze")],
  ["mao", "mao-pena", "Pena de escrever", quiz("letras", "bronze")],
  ["mao", "mao-livro-ouro", "Livro mágico dourado", quiz("letras", "ouro")],
  ["mao", "mao-lupa", "Lupa de detetive", quiz("geral", "prata")],
  ["mao", "mao-lampada-ouro", "Lâmpada de gênio", quiz("geral", "ouro")],
  ["mao", "mao-pandeiro", "Pandeiro", quiz("musica", "bronze")],
  ["mao", "mao-microfone", "Microfone", quiz("mpb", "prata")],
  ["mao", "mao-violao-ouro", "Violão dourado", quiz("mpb", "ouro")],
  ["mao", "mao-guitarra", "Guitarra", quiz("rock", "prata")],
  ["mao", "mao-guitarra-ouro", "Guitarra flamejante dourada", quiz("rock", "ouro")],
  ["mao", "mao-globo-ouro", "Globo dourado", quiz("geografia", "ouro")],
  ["mao", "mao-martelo", "Martelo de juiz", quiz("direito", "prata")],
  // Troféus de campeão do mês, um por jogo, com o mês escrito na plaqueta
  // (ver PLACAS).
  ["mao", "mao-trofeu-stop", "Troféu do Stop", campeao("stop")],
  ["mao", "mao-trofeu-quiz", "Troféu do Quiz", campeao("quiz")],
  ["mao", "mao-trofeu-acromania", "Troféu do Acromania", campeao("acromania")],

  ["fundo", "fundo-roxo", "Roxo", inicial],
  ["fundo", "fundo-quarto", "Quarto gamer", inicial],
  ["fundo", "fundo-estadio", "Estádio", quiz("esportes", "prata")],
  ["fundo", "fundo-palco", "Palco de show", quiz("musica", "prata")],
  ["fundo", "fundo-tribunal", "Tribunal", quiz("direito", "prata")],
  ["fundo", "fundo-galaxia", "Galáxia", dias(60)],
];

// ===== Cor da pele e máscaras de pele =====
//
// Cada corpo-base tem a sua cor (usada pra pintar as máscaras abaixo).
// Tons do corpo feminino (amostrados na arte -f; bem perto dos masculinos).
export const CORES_DA_PELE_FEMININA = {
  "pele-clara": "#fcd4c4",
  "pele-media": "#f4ac94",
  "pele-morena": "#d4846c",
  "pele-negra": "#ac6454",
  "pele-retinta": "#643c3c",
};
export const CORES_DA_PELE = {
  "pele-clara": "#fcdccc",
  "pele-media": "#ec9c7c",
  "pele-morena": "#cc8464",
  "pele-negra": "#a4644c",
  "pele-retinta": "#643c3c",
};

// Peças que DESCOBREM pele que o corpo-base não mostra (braço da regata, a
// mão que mudou de lugar pra segurar um objeto...). Cada uma tem um arquivo
// irmão <id>-pele-<VERSAO_ARTE>.webp: máscara branca sobre transparente,
// pintada com a cor da pele de quem veste e desenhada logo ABAIXO da peça.
// Lista tirada da pasta da arte (um teste confere que bate com os arquivos).
const COM_MASCARA_DE_PELE = new Set([
  "roupa-banda", "roupa-beca", "roupa-camiseta", "roupa-couro", "roupa-futebol", "roupa-jaleco",
  "roupa-manto-impostor", "roupa-moletom", "roupa-piloto", "roupa-regata", "roupa-terno", "roupa-xadrez",
  "baixo-camuflada", "baixo-jeans", "baixo-moletom", "baixo-praia", "baixo-saia", "baixo-shorts",
  "mao-bola", "mao-controle", "mao-guitarra", "mao-livro", "mao-lupa", "mao-martelo", "mao-microfone",
  "mao-trofeu-stop", "mao-trofeu-quiz", "mao-trofeu-acromania",
  "roupa-beca-ouro", "roupa-camisa10-ouro", "roupa-cavaleiro-ouro", "roupa-escolar", "roupa-heroi-ouro",
  "roupa-jaleco-ouro", "roupa-piloto-ouro", "roupa-pixel", "roupa-relampago", "roupa-rockstar-ouro",
  "roupa-smoking-ouro", "roupa-toga-ouro",
  "mao-espada-pixel-ouro", "mao-estatueta-ouro", "mao-globo-ouro", "mao-guitarra-ouro", "mao-lampada-ouro",
  "mao-lapis", "mao-livro-ouro", "mao-pandeiro", "mao-pena", "mao-pipoca", "mao-tocha-ouro", "mao-violao-ouro",
]);

// ===== Máscara que apaga o braço =====
//
// Objeto da mão que LEVANTA o braço (o braço vai pra cima segurando a
// coisa) tem um arquivo irmão <id>-apaga-<VERSAO_ARTE>.webp: branco opaco =
// fica, transparente = some. Com a peça vestida, as camadas ABAIXO da mão
// (corpo, calça, roupa, pescoço e as máscaras de pele delas — não o fundo
// nem as costas) são recortadas por ele: o braço caído do corpo-base some
// e não sobra "braço a mais". Na mão esquerda, a mesma máscara espelhada.
// Lista tirada da pasta da arte (um teste confere).
const COM_APAGA_BRACO = new Set([
  "mao-bola", "mao-controle", "mao-espada-pixel-ouro", "mao-estatueta-ouro", "mao-globo-ouro",
  "mao-guitarra", "mao-guitarra-ouro", "mao-lampada-ouro", "mao-lapis", "mao-livro-ouro", "mao-lupa",
  "mao-martelo", "mao-microfone", "mao-pandeiro", "mao-pena", "mao-pipoca", "mao-tocha-ouro",
  "mao-trofeu-stop", "mao-trofeu-quiz", "mao-trofeu-acromania", "mao-violao-ouro",
]);
// Camadas que a máscara de apagar recorta.
export const CAMADAS_APAGAVEIS = ["pele", "parteDeBaixo", "roupa", "pescoco"];

// ===== Plaqueta do troféu =====
//
// A base de cada troféu tem uma plaqueta dourada em branco: a tela escreve
// nela o mês do campeonato ("SET/26", avatarMontado.mesTrofeu). Posição em
// pixels da tela 900×1200 (centro, tamanho, inclinação em graus e tamanho
// da letra), medida na arte v2 — o troféu fica na mão direita do boneco, do
// lado DIREITO de quem olha. Na mão esquerda (espelhada) o x vira 900 - x e
// o ângulo troca de sinal; o texto em si nunca é espelhado.
export const PLACAS = {
  "mao-trofeu-stop": { x: 735, y: 856, largura: 70, altura: 32, angulo: -1, fonte: 19 },
  "mao-trofeu-quiz": { x: 720, y: 835, largura: 70, altura: 34, angulo: 3, fonte: 19 },
  "mao-trofeu-acromania": { x: 735, y: 787, largura: 74, altura: 36, angulo: 7, fonte: 20 },
};

// ===== Cor do cabelo =====
//
// Cabelos PINTÁVEIS têm um arquivo irmão <id>-cinza-<VERSAO_ARTE>.webp: a mesma camada
// (mesma tela, mesmo contorno) em tons de cinza claro, feita pra ser
// MULTIPLICADA por uma cor — o cinza guarda o sombreado e a cor entra por
// cima. Moicano e chamas ficam de fora: as cores são a graça deles.
const CABELOS_PINTAVEIS = new Set([
  "cabelo-curto", "cabelo-cacheado", "cabelo-liso-longo", "cabelo-coque",
  "cabelo-black-power", "cabelo-anime", "cabelo-rabo-rosa", "cabelo-topete",
  "cabelo-undercut-rosa",
]);

// Paleta (a chave é o que fica gravado em avatarMontado.corCabelo).
// "original" = a camada colorida de sempre, sem pintar. Os tons foram
// acertados compondo a multiplicação sobre o cinza de verdade: o cinza dos
// cabelos fica, na média, entre 45% e 70% de brilho, então a cor sai bem
// mais escura que o hex — por isso o loiro puxa pro laranja (#ffb94a): um
// amarelo "de verdade" multiplicado vira verde-oliva.
export const CORES_CABELO = {
  original: null,
  preto: "#2a2230",
  castanho: "#7a4a2a",
  loiro: "#ffb94a",
  ruivo: "#e0582a",
  grisalho: "#e2dfea",
  rosa: "#ff8ccb",
  azul: "#4f82ff",
  roxo: "#a066ff",
  verde: "#46c776",
};
export const NOMES_CORES_CABELO = {
  original: "Original", preto: "Preto", castanho: "Castanho", loiro: "Loiro", ruivo: "Ruivo",
  grisalho: "Grisalho", rosa: "Rosa", azul: "Azul", roxo: "Roxo", verde: "Verde",
};

// ===== Raridade =====
//
// Nível de dificuldade de cada peça, tirado da PRÓPRIA regra de desbloqueio
// (sem lista à mão, pra não desencontrar da regra). No editor e na Coleção
// cada nível tem a sua cor de card: base azul, iniciante verde, intermediário
// roxo, difícil laranja e lendário dourado (com brilho). Lendário é só o que
// é raro de verdade (título lendário, campeão do mês, patente máxima, 60 dias).
export const RARIDADES = [
  { chave: "base", nome: "Base" },
  { chave: "iniciante", nome: "Iniciante" },
  { chave: "intermediario", nome: "Intermediário" },
  { chave: "dificil", nome: "Difícil" },
  { chave: "lendario", nome: "Lendário" },
];
// Patentes do topo de cada jogo (as mais difíceis).
const PATENTES_MAXIMAS = new Set(["enciclopedia", "coroa_imperial_ouro", "coroa_ouro"]);
export function raridadeDaRegra(d) {
  switch (d.tipo) {
    case "inicial": return "base";
    case "campeao": return "lendario";
    case "titulo":
      // Escada do Quiz: bronze iniciante, prata intermediário, ouro lendário.
      if (d.nivel === "bronze") return "iniciante";
      if (d.nivel === "prata") return "intermediario";
      if (d.nivel === "ouro") return "lendario";
      if (d.nome === TITULO_LENDARIO.nome) return "lendario";
      return "intermediario"; // outros títulos por nome (relâmpago do Stop)
    case "sequencia": return d.dias <= 7 ? "iniciante" : d.dias <= 21 ? "intermediario" : d.dias < 60 ? "dificil" : "lendario";
    case "pontos":
      if (d.jogo === "total" || d.min >= 25000) return "dificil";
      return d.min >= 10000 ? "intermediario" : "iniciante";
    case "patente": return PATENTES_MAXIMAS.has(d.patente) ? "lendario" : "intermediario";
    default: return "base";
  }
}

export const ITENS = LISTA_CRUA.map(([slot, id, nome, regra, dica, motivo]) => {
  // Título do Quiz por tema/nível: guarda também o NOME do título (é por ele
  // que a lista de desbloqueados é conferida).
  const desbloqueio = regra.tipo === "titulo" && regra.tema ? { ...regra, nome: nomeDoTituloQuiz(regra.tema, regra.nivel) } : regra;
  const item = { id, slot, nome, arquivo: arte(slot, id), desbloqueio, raridade: raridadeDaRegra(desbloqueio), dica: dica || dicaDaRegra(desbloqueio), motivo: motivo || motivoDaRegra(desbloqueio) };
  if (CORES_DA_PELE[id]) {
    item.cor = CORES_DA_PELE[id];
    item.corFeminina = CORES_DA_PELE_FEMININA[id];
    item.arquivoFeminino = arte(slot, id, "-f");
  }
  if (COM_APAGA_BRACO.has(id)) item.apagaBraco = arte(slot, id, "-apaga");
  // Ouro do Quiz: peça lendária com aura em volta do boneco.
  if (desbloqueio.tipo === "titulo" && desbloqueio.tema && desbloqueio.nivel === "ouro") item.aura = true;
  if (COM_MASCARA_DE_PELE.has(id)) item.mascaraPele = arte(slot, id, "-pele");
  if (CABELOS_PINTAVEIS.has(id)) item.pintavel = arte(slot, id, "-cinza");
  if (PLACAS[id]) item.placa = PLACAS[id];
  return item;
});
export const ITEM_POR_ID = new Map(ITENS.map((i) => [i.id, i]));

// A peça cabe nesse slot? (a mão esquerda aceita as peças da mão)
export function pecaCabeNoSlot(item, slot) {
  return !!item && !!SLOT_DAS_PECAS[slot] && item.slot === SLOT_DAS_PECAS[slot];
}

// Chave do mês gravado pra cada mão com troféu (avatarMontado).
export const CHAVE_DO_MES = { mao: "mesTrofeu", maoEsquerda: "mesTrofeuEsquerda" };

// "2026-09" -> "SET/26" (o texto da plaqueta).
const MESES_PLACA = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
export function textoDaPlaca(monthKey) {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey || "");
  if (!m || !MESES_PLACA[Number(m[2]) - 1]) return null;
  return `${MESES_PLACA[Number(m[2]) - 1]}/${m[1].slice(2)}`;
}

// ===== Avatar padrão =====
//
// Quem nunca montou um avatar (e visitante) ganha um boneco sorteado a
// partir do próprio id — sempre o MESMO pra mesma pessoa, sem gravar nada no
// banco. Só peças iniciais, e fundo roxo (o da marca), pra ficar discreto.
const PADRAO_FUNDO = "fundo-roxo";
const SLOTS_SORTEADOS = ["pele", "roupa", "parteDeBaixo"];
// Cabelos sorteados pra cada corpo (todos servem nos dois; estes só combinam
// mais com o corpo sorteado).
const CABELOS_DO_CORPO = {
  feminino: ["cabelo-liso-longo", "cabelo-coque", "cabelo-cacheado", "cabelo-black-power"],
  masculino: ["cabelo-curto", "cabelo-cacheado", "cabelo-black-power"],
};

// FNV-1a de 32 bits: simples, rápido e igual em qualquer máquina.
export function hashDoTexto(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function avatarPadrao(userId) {
  const config = {};
  for (const slot of SLOTS_SORTEADOS) {
    const opcoes = ITENS.filter((i) => i.slot === slot && i.desbloqueio.tipo === "inicial");
    // Um sorteio por slot (o slot entra no hash): senão pele e cabelo
    // andariam juntos e sairiam sempre as mesmas combinações.
    config[slot] = opcoes[hashDoTexto(`${userId}:${slot}`) % opcoes.length].id;
  }
  // Corpo meio a meio, e um cabelo que combine com ele.
  const corpo = hashDoTexto(`${userId}:corpo`) % 2 ? "feminino" : "masculino";
  if (corpo === "feminino") config.corpo = corpo;
  const cabelos = CABELOS_DO_CORPO[corpo];
  config.cabelo = cabelos[hashDoTexto(`${userId}:cabelo`) % cabelos.length];
  config.fundo = PADRAO_FUNDO;
  // Cabelo pintável ganha uma cor natural, também sorteada do id
  // ("original" não é gravado: é a ausência de cor).
  if (ITEM_POR_ID.get(config.cabelo)?.pintavel) {
    const cor = CORES_NATURAIS[hashDoTexto(`${userId}:corCabelo`) % CORES_NATURAIS.length];
    if (cor !== "original") config.corCabelo = cor;
  }
  return config;
}

// Cores sorteadas no avatar padrão (as fantasia ficam pra quem escolhe).
const CORES_NATURAIS = ["original", "preto", "castanho", "loiro", "ruivo"];

// A cor do cabelo que vale pra uma montagem: a chave da paleta, ou null
// ("original", cor desconhecida ou cabelo que não se pinta).
export function corDoCabeloValida(cabeloId, cor) {
  if (typeof cor !== "string" || cor === "original" || !Object.hasOwn(CORES_CABELO, cor)) return null;
  return ITEM_POR_ID.get(cabeloId)?.pintavel ? cor : null;
}

// Montagem da tela de "começar do zero" (o editor parte do padrão da pessoa).
export const CONFIG_PADRAO = { pele: "pele-clara" };

// O que vai pro navegador (GET /api/avatar/catalogo). O `desbloqueio` vai
// junto, sem nada sensível: serve pra tela explicar a regra.
export function catalogoPublico() {
  return {
    versao: VERSAO_CATALOGO,
    tela: TELA,
    slots: SLOTS,
    camadas: CAMADAS,
    corpos: CORPOS,
    camadasApagaveis: CAMADAS_APAGAVEIS,
    coresCabelo: Object.entries(CORES_CABELO).map(([chave, cor]) => ({ chave, nome: NOMES_CORES_CABELO[chave], cor })),
    raridades: RARIDADES,
    itens: ITENS,
  };
}
