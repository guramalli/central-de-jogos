// ===== CATÁLOGO DO AVATAR (boneco chibi em camadas) =====
//
// Cada peça é um PNG/WebP transparente do MESMO tamanho de tela (900×1200,
// retrato, personagem de corpo inteiro centralizado). Por isso montar o
// boneco é só empilhar as camadas na ordem de CAMADAS — nada de posicionar
// peça por peça.
//
// TUDO É GRÁTIS: nenhuma peça é vendida. Algumas vêm liberadas pra todo
// mundo ("inicial"); as outras se ganham jogando (ver os tipos de desbloqueio abaixo e
// src/avatar/desbloqueio.js, que confere cada regra contra os dados reais).
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

// Sobe a cada mudança em LISTA: o frontend usa pra invalidar o cache dele.
export const VERSAO_CATALOGO = 1;

// Tamanho da tela de todas as camadas, e o recorte do "busto" (cabeça e
// ombros) usado nas bolinhas pequenas. O recorte mora aqui, e não no CSS,
// pra quem desenha a arte poder ajustá-lo junto com as peças.
export const TELA = {
  largura: 900,
  altura: 1200,
  busto: { x: 225, y: 70, lado: 450 },
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
//   { tipo: "inicial" }                                   todo mundo
//   { tipo: "titulo", nome: "Mestre de Games" }           título conquistado (nome exato)
//   { tipo: "titulo", comecaCom: "Campeão Stop " }        qualquer título com esse começo
//   { tipo: "patente", jogo: "quiz", patente: "calouro" } patente alcançada em ALGUM mês
//   { tipo: "sequencia", dias: 30 }                       recorde de dias seguidos jogando
//   { tipo: "pontos", jogo: "stop", min: 50000 }          pontos vitalícios no jogo
// jogo: "stop" | "quiz" | "acromania" | "mentira" (pontos também aceita "impostor").
export const TIPOS_DE_DESBLOQUEIO = ["inicial", "titulo", "patente", "sequencia", "pontos"];

const arte = (slot, id) => `/avatar/${slot}/${id}-v1.webp`;

// PEÇAS PROVISÓRIAS: cobrem cada slot e cada tipo de desbloqueio, pra testar
// o sistema de ponta a ponta. A lista definitiva (~60 peças) entra junto
// com a arte.
const LISTA = [
  // Corpo-base em tons de pele — todos iniciais.
  { id: "pele-1", slot: "pele", nome: "Pele 1", desbloqueio: { tipo: "inicial" }, dica: "Liberado pra todo mundo." },
  { id: "pele-2", slot: "pele", nome: "Pele 2", desbloqueio: { tipo: "inicial" }, dica: "Liberado pra todo mundo." },
  { id: "pele-3", slot: "pele", nome: "Pele 3", desbloqueio: { tipo: "inicial" }, dica: "Liberado pra todo mundo." },
  { id: "pele-4", slot: "pele", nome: "Pele 4", desbloqueio: { tipo: "inicial" }, dica: "Liberado pra todo mundo." },

  { id: "cabelo-curto", slot: "cabelo", nome: "Cabelo curto", desbloqueio: { tipo: "inicial" }, dica: "Liberado pra todo mundo." },
  { id: "roupa-camiseta", slot: "roupa", nome: "Camiseta", desbloqueio: { tipo: "inicial" }, dica: "Liberado pra todo mundo." },
  { id: "parteDeBaixo-bermuda", slot: "parteDeBaixo", nome: "Bermuda", desbloqueio: { tipo: "inicial" }, dica: "Liberado pra todo mundo." },

  { id: "chapeu-capelo", slot: "chapeu", nome: "Capelo de formatura", desbloqueio: { tipo: "patente", jogo: "quiz", patente: "calouro" }, dica: "Chegue à patente Calouro no Quiz em algum mês." },
  { id: "fundo-arena", slot: "fundo", nome: "Arena do Stop", desbloqueio: { tipo: "patente", jogo: "stop", patente: "trofeu_bronze" }, dica: "Chegue ao Troféu de Bronze no Stop em algum mês." },
  { id: "rosto-oculos-gamer", slot: "rosto", nome: "Óculos gamer", desbloqueio: { tipo: "titulo", nome: "Conhecedor de Games" }, dica: "Conquiste o título Conhecedor de Games no Quiz." },
  { id: "pescoco-medalha-campeao", slot: "pescoco", nome: "Medalha de campeão", desbloqueio: { tipo: "titulo", comecaCom: "Campeão " }, dica: "Seja campeão do ranking mensal (Stop ou Quiz)." },
  { id: "costas-capa-fogo", slot: "costas", nome: "Capa de fogo", desbloqueio: { tipo: "sequencia", dias: 30 }, dica: "Jogue 30 dias seguidos." },
  { id: "mao-controle", slot: "mao", nome: "Controle", desbloqueio: { tipo: "pontos", jogo: "stop", min: 50000 }, dica: "Some 50.000 pontos no Stop (desde sempre)." },
];

// `arquivo` é opcional na lista: sem ele, segue a convenção /avatar/<slot>/<id>-v1.webp.
export const ITENS = LISTA.map((i) => ({ ...i, arquivo: i.arquivo || arte(i.slot, i.id) }));
export const ITEM_POR_ID = new Map(ITENS.map((i) => [i.id, i]));

// Montagem de quem nunca abriu o editor (só o corpo).
export const CONFIG_PADRAO = { pele: "pele-1" };

// O que vai pro navegador (GET /api/avatar/catalogo). O `desbloqueio` vai
// junto, sem nada sensível: serve pra tela explicar a regra.
export function catalogoPublico() {
  return {
    versao: VERSAO_CATALOGO,
    tela: TELA,
    slots: SLOTS,
    camadas: CAMADAS,
    itens: ITENS,
  };
}
