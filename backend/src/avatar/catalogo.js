import { nomeDoTituloQuiz, QUIZ_NOMES, QUIZ_NIVEIS, TITULO_LENDARIO } from "../game/titulosConfig.js";

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
//   1. salvar a arte em frontend/public/avatar/<slot>/<id>-v1.webp;
//   2. acrescentar a linha em LISTA;
//   3. subir VERSAO_CATALOGO (o navegador guarda o catálogo em cache).
// O "-v1" no nome do arquivo é de propósito: arquivo de nome fixo fica preso
// no cache do service worker. Pra trocar a arte de uma peça, salve como
// "-v2" e mude o `arquivo` aqui — o id da peça (o que fica no banco) não muda.
//
// Enquanto a arte não existe, o frontend pula a camada que falta (e desenha
// uma silhueta tracejada se faltar o corpo) — o sistema funciona sem arte.
//
// Este arquivo não fala com o banco (só lê a config dos títulos, que também
// é pura): os testes e o script de fechamento do mês importam ele à vontade.

// Sobe a cada mudança em LISTA: o frontend usa pra invalidar o cache dele.
// v4: `motivo` de cada peça, cabelos pintáveis e a paleta CORES_CABELO.
// (O frontend tem uma cópia deste número em avatarCatalogo.js, que vai no
// "?v=" da busca — suba as duas juntas.)
export const VERSAO_CATALOGO = 4;

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
  { slot: "fundo", nome: "Fundo" },
];
export const NOMES_DOS_SLOTS = SLOTS.map((s) => s.slot);

// Ordem de desenho, de baixo pra cima. O chapéu vem DEPOIS do cabelo e não
// esconde nada: a arte do chapéu já é desenhada por cima do cabelo.
export const CAMADAS = ["fundo", "costas", "pele", "parteDeBaixo", "roupa", "pescoco", "cabelo", "rosto", "chapeu", "mao"];

// Tipos de desbloqueio aceitos (conferidos em desbloqueio.js):
//   { tipo: "inicial" }                                   todo mundo (menos visitante)
//   { tipo: "titulo", tema: "anime", nivel: "ouro" }      título do Quiz daquele tema/nível
//   { tipo: "titulo", nome: "Lenda do Educação Gamer" }   título pelo nome exato
//   { tipo: "titulo", comecaCom: "Campeão " }             qualquer título com esse começo
//   { tipo: "patente", jogo: "quiz", patente: "calouro" } patente alcançada em ALGUM mês
//   { tipo: "sequencia", dias: 30 }                       recorde de dias seguidos jogando
//   { tipo: "pontos", jogo: "stop", min: 50000 }          pontos vitalícios no jogo
//   { tipo: "pontos", jogo: "total", min: 25000 }         pontos vitalícios somando todos os jogos
// jogo (patente): "stop" | "quiz" | "acromania" | "mentira".
export const TIPOS_DE_DESBLOQUEIO = ["inicial", "titulo", "patente", "sequencia", "pontos"];

// Nível dos títulos do Quiz como aparece pra pessoa.
export const NOME_DO_NIVEL = { bronze: "bronze", prata: "prata", ouro: "ouro" };
const INDICE_DO_NIVEL = { bronze: 0, prata: 1, ouro: 2 };

const arte = (slot, id) => `/avatar/${slot}/${id}-v1.webp`;
const milhar = (n) => n.toLocaleString("pt-BR");

// Atalhos pra escrever a lista abaixo sem repetir objeto.
const inicial = { tipo: "inicial" };
const quiz = (tema, nivel) => ({ tipo: "titulo", tema, nivel });
const dias = (n) => ({ tipo: "sequencia", dias: n });
const pontos = (jogo, min) => ({ tipo: "pontos", jogo, min });
const patente = (jogo, key) => ({ tipo: "patente", jogo, patente: key });
const campeao = { tipo: "titulo", comecaCom: "Campeão " };
const lendario = { tipo: "titulo", nome: TITULO_LENDARIO.nome };

const NOME_DO_JOGO = { stop: "Stop", quiz: "Quiz", acromania: "Acromania", mentira: "Mentira Sincera", impostor: "Impostor", total: "todos os jogos" };

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
      if (d.comecaCom === "Campeão ") return "Seja campeão do ranking mensal do Stop ou do Quiz.";
      return `Conquiste o título "${d.nome || d.comecaCom}".`;
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
      if (d.comecaCom === "Campeão ") return "Conquistada com o título Campeão do mês (1º lugar no ranking mensal do Stop ou do Quiz).";
      return `Conquistada com o título ${d.nome || d.comecaCom}.`;
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

// ===== AS 73 PEÇAS =====
// [slot, id, nome, desbloqueio, dica opcional, motivo opcional]
const LISTA_CRUA = [
  // Pele (corpo-base com o rosto padrão) — todas iniciais.
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
  ["cabelo", "cabelo-anime", "Espetado de anime", quiz("anime", "ouro")],
  ["cabelo", "cabelo-rabo-rosa", "Rabo de cavalo rosa", pontos("quiz", 5000)],
  ["cabelo", "cabelo-topete", "Topete de roqueiro", quiz("rock", "ouro")],
  ["cabelo", "cabelo-chamas", "Cabelo em chamas", lendario],

  ["roupa", "roupa-camiseta", "Camiseta", inicial],
  ["roupa", "roupa-moletom", "Moletom", inicial],
  ["roupa", "roupa-xadrez", "Camisa xadrez", inicial],
  ["roupa", "roupa-regata", "Regata", inicial],
  ["roupa", "roupa-futebol", "Camisa de futebol", quiz("futebol", "ouro")],
  ["roupa", "roupa-piloto", "Macacão de piloto", quiz("automobilismo", "ouro")],
  ["roupa", "roupa-jaleco", "Jaleco", quiz("ciencias", "ouro")],
  ["roupa", "roupa-beca", "Beca de formatura", quiz("terceirao", "ouro")],
  ["roupa", "roupa-couro", "Jaqueta de couro", quiz("rock", "prata")],
  ["roupa", "roupa-banda", "Camisa de banda", quiz("musica", "ouro")],
  // Patente do meio da escada do Mentira (6ª de 12): Cartola de Bronze, 28.000 pts num mês.
  ["roupa", "roupa-terno", "Terno de advogado", patente("mentira", "cartola_bronze"), "Chegue à patente Cartola de Bronze no Mentira Sincera (28.000 pontos num mês).", "Conquistada ao alcançar a patente Cartola de Bronze no Mentira Sincera."],
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
  ["chapeu", "chapeu-capacete", "Capacete de piloto", quiz("automobilismo", "prata")],
  ["chapeu", "chapeu-capelo", "Capelo", quiz("terceirao", "prata")],
  ["chapeu", "chapeu-viking", "Elmo viking", quiz("mitologia", "ouro")],
  ["chapeu", "chapeu-explorador", "Chapéu de explorador", quiz("historia", "ouro")],
  ["chapeu", "chapeu-headset", "Headset gamer", quiz("games", "ouro")],
  ["chapeu", "chapeu-cartola", "Cartola", quiz("cinema", "ouro")],
  ["chapeu", "chapeu-coroa", "Coroa", campeao],

  ["rosto", "rosto-redondos", "Óculos redondos", inicial],
  ["rosto", "rosto-escuros", "Óculos escuros", inicial],
  ["rosto", "rosto-pintura", "Pintura verde e amarela", quiz("futebol", "bronze")],
  ["rosto", "rosto-nerd", "Óculos de nerd", quiz("ciencias", "prata")],
  ["rosto", "rosto-heroi", "Máscara de herói", quiz("series", "ouro")],
  ["rosto", "rosto-monoculo", "Monóculo", quiz("letras", "ouro")],

  ["pescoco", "pescoco-cachecol", "Cachecol", inicial],
  ["pescoco", "pescoco-apito", "Apito de juiz", quiz("esportes", "ouro")],
  ["pescoco", "pescoco-gravata", "Gravata borboleta", quiz("novelas", "ouro")],
  ["pescoco", "pescoco-havaiano", "Colar havaiano", quiz("geografia", "ouro")],
  ["pescoco", "pescoco-medalha", "Medalha de ouro", pontos("total", 25000)],

  ["costas", "costas-mochila", "Mochila", inicial],
  ["costas", "costas-capa", "Capa de herói", dias(30)],
  // Patentes máximas. As do Quiz e do Stop são EXCLUSIVAS (só o 1º do mês):
  // a peça exige também o troféu de campeão daquele mês.
  ["costas", "costas-anjo", "Asas de anjo", patente("quiz", "enciclopedia"), "Chegue à patente máxima do Quiz, Enciclopédia (só o 1º do mês a leva).", "Conquistada ao alcançar a patente máxima do Quiz, Enciclopédia (1º lugar do mês)."],
  ["costas", "costas-morcego", "Asas de morcego", patente("stop", "coroa_imperial_ouro"), "Chegue à patente máxima do Stop, Coroa Imperial de Ouro (só o 1º do mês a leva).", "Conquistada ao alcançar a patente máxima do Stop, Coroa Imperial de Ouro (1º lugar do mês)."],
  ["costas", "costas-jetpack", "Jetpack", patente("acromania", "coroa_ouro"), "Chegue à patente máxima do Acromania, Coroa de Ouro (160.000 pontos num mês).", "Conquistada ao alcançar a patente máxima do Acromania, Coroa de Ouro."],

  ["mao", "mao-controle", "Controle", inicial],
  ["mao", "mao-livro", "Livro", inicial],
  ["mao", "mao-bola", "Bola de futebol", quiz("futebol", "prata")],
  ["mao", "mao-guitarra", "Guitarra", quiz("rock", "ouro")],
  ["mao", "mao-microfone", "Microfone", quiz("mpb", "ouro")],
  ["mao", "mao-martelo", "Martelo de juiz", quiz("direito", "prata")],
  ["mao", "mao-lupa", "Lupa de detetive", patente("mentira", "mascara_ouro"), "Chegue à patente máxima do Mentira Sincera, Máscara de Ouro (150.000 pontos num mês).", "Conquistada ao alcançar a patente máxima do Mentira Sincera, Máscara de Ouro."],
  ["mao", "mao-trofeu", "Troféu", campeao],

  ["fundo", "fundo-roxo", "Roxo", inicial],
  ["fundo", "fundo-quarto", "Quarto gamer", inicial],
  ["fundo", "fundo-estadio", "Estádio", quiz("esportes", "ouro")],
  ["fundo", "fundo-palco", "Palco de show", quiz("musica", "ouro")],
  ["fundo", "fundo-tribunal", "Tribunal", quiz("direito", "ouro")],
  ["fundo", "fundo-galaxia", "Galáxia", dias(60)],
];

// ===== Cor da pele e máscaras de pele =====
//
// Cada corpo-base tem a sua cor (usada pra pintar as máscaras abaixo).
export const CORES_DA_PELE = {
  "pele-clara": "#fcdccc",
  "pele-media": "#ec9c7c",
  "pele-morena": "#cc8464",
  "pele-negra": "#a4644c",
  "pele-retinta": "#643c3c",
};

// Peças que DESCOBREM pele que o corpo-base não mostra (braço da regata, a
// mão que mudou de lugar pra segurar um objeto...). Cada uma tem um arquivo
// irmão <id>-pele-v1.webp: máscara branca sobre transparente, pintada com a
// cor da pele de quem veste e desenhada logo ABAIXO da peça. Lista tirada
// da pasta da arte (um teste confere que bate com os arquivos).
const COM_MASCARA_DE_PELE = new Set([
  "roupa-banda", "roupa-beca", "roupa-camiseta", "roupa-couro", "roupa-futebol", "roupa-jaleco",
  "roupa-manto-impostor", "roupa-moletom", "roupa-piloto", "roupa-regata", "roupa-terno", "roupa-xadrez",
  "baixo-camuflada", "baixo-jeans", "baixo-moletom", "baixo-praia", "baixo-saia", "baixo-shorts",
  "mao-bola", "mao-controle", "mao-guitarra", "mao-livro", "mao-lupa", "mao-martelo", "mao-microfone", "mao-trofeu",
]);

// ===== Cor do cabelo =====
//
// Cabelos PINTÁVEIS têm um arquivo irmão <id>-cinza-v1.webp: a mesma camada
// (mesma tela, mesmo contorno) em tons de cinza claro, feita pra ser
// MULTIPLICADA por uma cor — o cinza guarda o sombreado e a cor entra por
// cima. Moicano e chamas ficam de fora: as cores são a graça deles.
const CABELOS_PINTAVEIS = new Set([
  "cabelo-curto", "cabelo-cacheado", "cabelo-liso-longo", "cabelo-coque",
  "cabelo-black-power", "cabelo-anime", "cabelo-rabo-rosa", "cabelo-topete",
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

export const ITENS = LISTA_CRUA.map(([slot, id, nome, regra, dica, motivo]) => {
  // Título do Quiz por tema/nível: guarda também o NOME do título (é por ele
  // que a lista de desbloqueados é conferida).
  const desbloqueio = regra.tipo === "titulo" && regra.tema ? { ...regra, nome: nomeDoTituloQuiz(regra.tema, regra.nivel) } : regra;
  const item = { id, slot, nome, arquivo: arte(slot, id), desbloqueio, dica: dica || dicaDaRegra(desbloqueio), motivo: motivo || motivoDaRegra(desbloqueio) };
  if (CORES_DA_PELE[id]) item.cor = CORES_DA_PELE[id];
  if (COM_MASCARA_DE_PELE.has(id)) item.mascaraPele = `/avatar/${slot}/${id}-pele-v1.webp`;
  if (CABELOS_PINTAVEIS.has(id)) item.pintavel = `/avatar/${slot}/${id}-cinza-v1.webp`;
  return item;
});
export const ITEM_POR_ID = new Map(ITENS.map((i) => [i.id, i]));

// ===== Avatar padrão =====
//
// Quem nunca montou um avatar (e visitante) ganha um boneco sorteado a
// partir do próprio id — sempre o MESMO pra mesma pessoa, sem gravar nada no
// banco. Só peças iniciais, e fundo roxo (o da marca), pra ficar discreto.
const PADRAO_FUNDO = "fundo-roxo";
const SLOTS_SORTEADOS = ["pele", "cabelo", "roupa", "parteDeBaixo"];

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
    coresCabelo: Object.entries(CORES_CABELO).map(([chave, cor]) => ({ chave, nome: NOMES_CORES_CABELO[chave], cor })),
    itens: ITENS,
  };
}
